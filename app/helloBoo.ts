// Only complete, final phrases may command the rig; interim guesses never move it.
export function isHelloBoo(transcript:string){
 return /(?:^|\s)hello\s+boo(?:\s|$)/u.test(transcript.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim());
}
type Result={isFinal:boolean;length:number;[index:number]:{transcript:string;confidence?:number}};
export type RecognitionEvent={resultIndex:number;results:{length:number;[index:number]:Result}};
export type Recognizer={
 continuous:boolean;interimResults:boolean;lang:string;maxAlternatives:number;
 onstart:(()=>void)|null;onend:(()=>void)|null;
 onerror:((event:{error:string})=>void)|null;
 onresult:((event:RecognitionEvent)=>void)|null;
 onprogress?:((message:string)=>void)|null;
 start:()=>void;abort:()=>void;
};
export const speechError=(code:string)=>({
 'not-allowed':'Microphone permission was denied. Allow the microphone for this site, then try again.',
 'audio-capture':'No microphone is available. Check your PC’s input device and microphone permissions.',
 'local-model':'The on-device speech model could not load. Check your connection for the first download, then try again.',
 'aborted':'Listening stopped. Press Start microphone to try again.'
}[code]??'Speech recognition stopped. Press Start microphone to try again.');

export type ListenerState={active:boolean;status:string;error?:string};
export class HelloBooListener{
 private create:()=>Recognizer;
 private onState:(state:ListenerState)=>void;
 private onPhrase:(transcript:string,matched:boolean)=>void;
 private recognizer:Recognizer|null=null;
 private timer:ReturnType<typeof setTimeout>|null=null;
 private wanted=false;
 private lastWake=-Infinity;
 private rapidEnds=0;
 constructor(create:()=>Recognizer,onState:(state:ListenerState)=>void,onPhrase:(transcript:string,matched:boolean)=>void){
  this.create=create;this.onState=onState;this.onPhrase=onPhrase;
 }
 start(){
  if(this.wanted)return;
  this.wanted=true;this.lastWake=-Infinity;this.rapidEnds=0;this.begin();
 }
 stop(status='Microphone off'){
  this.wanted=false;if(this.timer)clearTimeout(this.timer);this.timer=null;
  const r=this.recognizer;this.recognizer=null;
  if(r){r.onstart=r.onend=r.onerror=r.onresult=r.onprogress=null;try{r.abort();}catch{/* Already ended. */}}
  this.onState({active:false,status});
 }
 private fail(message:string){this.stop();this.onState({active:false,status:'Microphone unavailable',error:message});}
 private begin(){
  if(!this.wanted)return;
  let r:Recognizer;
  try{r=this.create();}catch{this.fail('Speech recognition could not start in this browser.');return;}
  this.recognizer=r;
  r.continuous=true;r.interimResults=false;r.lang='en-US';r.maxAlternatives=1;
  let seen=0;const began=Date.now(),valid=()=>this.wanted&&this.recognizer===r;
  this.onState({active:true,status:'Starting microphone…'});
  r.onstart=()=>{if(valid())this.onState({active:true,status:'Listening · say “Hello Boo”'});};
  r.onprogress=status=>{if(valid())this.onState({active:true,status});};
  r.onresult=event=>{
   if(!valid())return;
   for(let i=Math.max(seen,event.resultIndex);i<event.results.length;i++){
    const result=event.results[i];if(!result.isFinal)continue;
    seen=i+1;const transcript=result[0]?.transcript.trim()??'';
    if(!transcript)continue;
    const matched=isHelloBoo(transcript)&&(result[0]?.confidence??1)>=.7&&Date.now()-this.lastWake>=2500;
    if(matched)this.lastWake=Date.now();
    this.onPhrase(transcript,matched);
    if(!valid())break;
   }
  };
  r.onerror=event=>{if(valid()&&event.error!=='no-speech')this.fail(speechError(event.error));};
  r.onend=()=>{
   if(!valid())return;
   this.recognizer=null;r.onstart=r.onend=r.onerror=r.onresult=null;
   this.rapidEnds=Date.now()-began<1000?this.rapidEnds+1:0;
   if(this.rapidEnds>=3){this.fail('The browser keeps stopping speech recognition. Try Chrome or Edge.');return;}
   this.onState({active:true,status:'Restarting listening…'});
   this.timer=setTimeout(()=>{this.timer=null;this.begin();},500);
  };
  try{r.start();}catch{this.fail('Microphone could not start. Check permissions and try again.');}
 }
}
