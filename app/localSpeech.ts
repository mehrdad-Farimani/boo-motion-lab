import type {Recognizer,RecognitionEvent} from './helloBoo';
import type {Model,KaldiRecognizer} from 'vosk-browser/dist/model';

// The model is downloaded, but audio stays in this browser's recognition worker.
const MODEL_URL='https://ccoreilly.github.io/vosk-browser/models/vosk-model-small-en-us-0.15.tar.gz';
const WORKLET=`class BooMicrophone extends AudioWorkletProcessor {
 constructor(){super();this.buffer=new Float32Array(2048);this.offset=0;}
 process(inputs){const input=inputs[0]?.[0];if(input)for(const sample of input){
  this.buffer[this.offset++]=sample;
  if(this.offset===this.buffer.length){this.port.postMessage(this.buffer,[this.buffer.buffer]);this.buffer=new Float32Array(2048);this.offset=0;}
 }return true;}
}registerProcessor('boo-microphone',BooMicrophone);`;

export class LocalRecognizer implements Recognizer{
 continuous=true;interimResults=false;lang='en-US';maxAlternatives=1;
 onstart:(()=>void)|null=null;onend:(()=>void)|null=null;
 onerror:((event:{error:string})=>void)|null=null;
 onresult:((event:RecognitionEvent)=>void)|null=null;
 onprogress:((message:string)=>void)|null=null;
 private stopped=false;
 private stream:MediaStream|null=null;
 private context:AudioContext|null=null;
 private source:MediaStreamAudioSourceNode|null=null;
 private node:AudioWorkletNode|null=null;
 private model:Model|null=null;
 private recognizer:KaldiRecognizer|null=null;
 private cancelLoad:(()=>void)|null=null;
 private level:(value:number)=>void;
 constructor(level:(value:number)=>void){this.level=level;}
 start(){void this.listen().catch(error=>{
  if(this.stopped)return;
  const code=error instanceof DOMException?(error.name==='NotAllowedError'?'not-allowed':error.name==='NotFoundError'?'audio-capture':'local-model'):'local-model';
  this.onerror?.({error:code});this.abort();
 });}
 private async listen(){
  // Create/resume in the user gesture, before waiting for permission or the model.
  const context=new AudioContext({sampleRate:16000});this.context=context;
  await context.resume();if(this.stopped)return;
  this.onprogress?.('Allow your PC microphone…');
  const stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
  if(this.stopped){stream.getTracks().forEach(track=>track.stop());return;}
  this.stream=stream;
  stream.getAudioTracks().forEach(track=>track.addEventListener('ended',()=>{if(!this.stopped)this.onerror?.({error:'audio-capture'});}));
  this.onprogress?.('Loading on-device speech model · first use downloads about 40 MB…');
  const {Model}=await import('vosk-browser');if(this.stopped)return;
  const model=new Model(MODEL_URL,-2);this.model=model;
  await new Promise<void>((resolve,reject)=>{
   const finish=(error?:Error)=>{clearTimeout(timeout);this.cancelLoad=null;error?reject(error):resolve();};
   const timeout=setTimeout(()=>finish(new Error('Model load timed out')),120000);
   this.cancelLoad=()=>finish(new DOMException('Stopped','AbortError'));
   model.on('load',message=>{if(message.event==='load')finish(message.result?undefined:new Error('Model unavailable'));});
   model.on('error',()=>finish(new Error('Model unavailable')));
  });
  if(this.stopped)return;
  const recognizer=new model.KaldiRecognizer(context.sampleRate,JSON.stringify(['hello boo','[unk]']));this.recognizer=recognizer;recognizer.setWords(true);
  let index=0;
  recognizer.on('result',message=>{
   if(this.stopped||message.event!=='result'||!message.result.text)return;
   const words=message.result.result??[],confidence=words.length?Math.min(...words.map(word=>word.conf)):0;
   this.onresult?.({resultIndex:index,results:{length:index+1,[index]:{isFinal:true,length:1,0:{transcript:message.result.text,confidence}}}});index++;
  });
  recognizer.on('error',()=>{if(!this.stopped)this.onerror?.({error:'local-model'});});
  const workletUrl=URL.createObjectURL(new Blob([WORKLET],{type:'text/javascript'}));
  try{await context.audioWorklet.addModule(workletUrl);}finally{URL.revokeObjectURL(workletUrl);}
  if(this.stopped)return;
  const node=new AudioWorkletNode(context,'boo-microphone');this.node=node;
  node.port.onmessage=event=>{
   if(this.stopped)return;
   const samples=event.data as Float32Array;
   let energy=0;for(const sample of samples)energy+=sample*sample;
   this.level(Math.min(100,Math.sqrt(energy/samples.length)*400));
   recognizer.acceptWaveformFloat(samples,context.sampleRate);
  };
  const source=context.createMediaStreamSource(stream);this.source=source;
  // The worklet writes silence to its output, preventing microphone playback/echo.
  source.connect(node);node.connect(context.destination);this.onstart?.();
 }
 abort(){
  this.stopped=true;this.cancelLoad?.();this.cancelLoad=null;
  this.stream?.getTracks().forEach(track=>track.stop());this.stream=null;
  if(this.node){this.node.port.onmessage=null;this.node.disconnect();this.node.port.close();this.node=null;}
  this.source?.disconnect();this.source=null;
  void this.context?.close().catch(()=>{});this.context=null;
  this.recognizer?.remove();this.recognizer=null;this.model?.terminate();this.model=null;this.level(0);
 }
}
