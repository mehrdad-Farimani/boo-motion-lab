'use client';
import {useEffect,useRef,useState} from 'react';
import type {BodyPose} from './body';
import type {Hardware,Telemetry} from './hardware';
import type {Pose,Frame} from './motion';
import {CUES,SOUNDS,hearing,voiceResponse,type Cue,type Sound} from './voice';
type Controller={pose:Pose;body:BodyPose;hardware:Hardware;telemetry:Telemetry;playVoice:(name:string,frames:Frame[])=>void};
type Feed={status:string;sound?:Sound;until:number;left:number;right:number};
export default function VoicePanel({controllers,present,selected,human,setHuman}:{controllers:Controller[];present:number[];selected:number;human:Hardware['human'];setHuman:React.Dispatch<React.SetStateAction<Hardware['human']>>}){
 const [loudness,setLoudness]=useState(65),[noise,setNoise]=useState(30),[only,setOnly]=useState(false),[volume,setVolume]=useState(35),[muted,setMuted]=useState(false),[busy,setBusy]=useState(false),[feed,setFeed]=useState<Record<number,Feed>>({}),[events,setEvents]=useState<string[]>([]),[audioError,setAudioError]=useState('');
 const latest=useRef({controllers,present,muted,volume});latest.current={controllers,present,muted,volume};
 const audio=useRef<AudioContext|null>(null),timers=useRef<ReturnType<typeof setTimeout>[]>([]),lastCalls=useRef<Record<number,number>>({}),generation=useRef(0);
 function log(s:string){setEvents(e=>[new Date().toLocaleTimeString()+' · '+s,...e].slice(0,18));}
 function sound(name:Sound,delay=0){
  if(latest.current.muted)return;
  try{const ctx=audio.current??(audio.current=new AudioContext());void ctx.resume().catch(()=>setAudioError('Audio could not start. Try Replay sound.'));
   const index=SOUNDS.indexOf(name),start=ctx.currentTime+delay;
   for(let n=0;n<(index===0?3:2);n++){const o=ctx.createOscillator(),g=ctx.createGain();o.type=index===3?'triangle':'sine';const t=start+n*.26,f=[640,180,130,920,210,95][index];o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*(index===1?1.8:index===3?.4:1.2),t+.35);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(latest.current.volume/100*.12,t+.04);g.gain.exponentialRampToValueAtTime(.0001,t+.5);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+.52);o.onended=()=>{o.disconnect();g.disconnect();};}
  }catch{setAudioError('Audio is unavailable in this browser. Visual reactions still work.');}
 }
 function stop(){generation.current++;timers.current.forEach(clearTimeout);timers.current=[];window.speechSynthesis?.cancel();void audio.current?.close();audio.current=null;setBusy(false);setFeed({});}
 useEffect(()=>()=>{timers.current.forEach(clearTimeout);window.speechSynthesis?.cancel();void audio.current?.close();},[]);
 useEffect(()=>{if(muted){window.speechSynthesis?.cancel();void audio.current?.close();audio.current=null;}},[muted]);
 useEffect(()=>{const timer=setInterval(()=>setFeed(old=>{let changed=false;const next={...old};for(const key of Object.keys(next)){const id=Number(key);if(next[id].until&&Date.now()>next[id].until){next[id]={...next[id],status:'Quiet',until:0,left:0,right:0};changed=true;}}return changed?next:old;}),200);return()=>clearInterval(timer);},[]);
 function send(cue:Cue){
  timers.current.forEach(clearTimeout);timers.current=[];setAudioError('');setBusy(true);const serial=++generation.current;
  try{audio.current??=new AudioContext();void audio.current.resume().catch(()=>{});if(!muted&&cue!=='Loud sound'&&'speechSynthesis' in window){const utterance=new SpeechSynthesisUtterance(cue==='Gentle speech'?'Hello little Boo, you can rest.':cue);utterance.volume=volume/100;window.speechSynthesis.speak(utterance);}else if(cue==='Loud sound')sound('Squeak');}catch{setAudioError('Phrase audio unavailable; the scripted cue still runs.');}
  const targets=only?[selected]:present;
  for(const id of targets){const c=controllers[id],source=c.telemetry.time?c.telemetry.humanPosition:human;
   const h=hearing(source,c.body,cue==='Loud sound'?85:loudness,noise,c.pose.lids>75),heard=human.enabled&&h.detected,recognized=heard&&(h.recognized||cue==='Loud sound');
   setFeed(f=>({...f,[id]:{status:heard?'Listening':'Not heard',until:Date.now()+1800,left:heard?h.left:0,right:heard?h.right:0}}));
   log('Boo '+(id+1)+' · '+(heard?'Sound detected':'Not heard')+' · '+h.distance.toFixed(1)+' m');
   const reset=c.hardware.resetSerial;
   timers.current.push(setTimeout(()=>{if(serial!==generation.current||!latest.current.present.includes(id)||latest.current.controllers[id].hardware.resetSerial!==reset)return;
    const current=latest.current.controllers[id];
    if(!recognized){setFeed(f=>({...f,[id]:{status:heard?'Sound only · cue unclear':'Not heard',until:Date.now()+1800,left:0,right:0}}));return;}
    const repeated=Date.now()-(lastCalls.current[id]??0)<15000;lastCalls.current[id]=Date.now();
    const response=voiceResponse(cue,current.pose,h.angle,Object.values(current.hardware.touch).some(Boolean),repeated);
    current.playVoice('Voice · '+cue,response.frames);sound(response.sound,id*.08);
    setFeed(f=>({...f,[id]:{status:'Responding',sound:response.sound,until:Date.now()+2400,left:0,right:0}}));log('Boo '+(id+1)+' · '+cue+' → '+response.sound);
   },1800));
  }
  timers.current.push(setTimeout(()=>{if(serial===generation.current)setBusy(false);},4300));
 }
 const c=controllers[selected],h=hearing(c.telemetry.time?c.telemetry.humanPosition:human,c.body,loudness,noise,c.pose.lids>75),current=feed[selected];
 return <section className="voice-panel"><span className="overline">VOICE & HEARING / BOO {selected+1}</span><h2>Talk to Boo</h2><p className="muted">Scripted cues, browser-spoken phrases and six synthesized Boo sounds. No microphone recording or speech recognition.</p>
 <div className="voice-cues">{CUES.map(cue=><button key={cue} disabled={busy} onClick={()=>send(cue)}>{cue}</button>)}</div>
 <label className="voice-check"><input type="checkbox" checked={only} onChange={e=>setOnly(e.target.checked)}/> Selected Boo only</label>
 <div className="voice-readout" role="status"><strong>{current?.status??'Quiet'}</strong><span>{h.distance.toFixed(1)} m · {h.angle.toFixed(0)}° relative direction</span><label>Left microphone <meter min={0} max={100} value={current?.left??0}/></label><label>Right microphone <meter min={0} max={100} value={current?.right??0}/></label><span>Speaker: {current?.status==='Responding'?current.sound:'Quiet'}</span></div>
 <h3>Sound source</h3><p className="muted">The person in the scene is the speaker. Position and movement are shared with the radar controls.</p>
 <label className="voice-check"><input type="checkbox" checked={human.enabled} onChange={e=>setHuman(h=>({...h,enabled:e.target.checked}))}/> Person present</label>
 <label className="voice-check"><input type="checkbox" checked={human.moving} onChange={e=>setHuman(h=>({...h,moving:e.target.checked}))}/> Person moving</label>
 {(['x','z'] as const).map(axis=><label className="voice-slider" key={axis}>Person {axis.toUpperCase()} · {human[axis].toFixed(1)} m<input type="range" min={-8} max={8} step={.1} value={human[axis]} onChange={e=>setHuman(h=>({...h,[axis]:Number(e.target.value)}))}/></label>)}
 <label className="voice-slider">Voice level at 1 m · {loudness} dB (simulated)<input type="range" min={35} max={85} value={loudness} onChange={e=>setLoudness(Number(e.target.value))}/></label>
 <label className="voice-slider">Background noise · {noise} dB (simulated)<input type="range" min={20} max={65} value={noise} onChange={e=>setNoise(Number(e.target.value))}/></label>
 <p className="muted">Approximate hearing model: distance, facing direction, noise and sleep affect detection. Loud sound uses 85 dB. These are test values, not calibrated microphone measurements. Hold a touch sensor during gentle speech for a contented response. A repeated call within 15 seconds helps Boo wake.</p>
 <h3>Boo’s speaker</h3><label className="voice-slider">Playback volume · {volume}%<input type="range" min={0} max={100} value={volume} onChange={e=>setVolume(Number(e.target.value))}/></label><label className="voice-check"><input type="checkbox" checked={muted} onChange={e=>setMuted(e.target.checked)}/> Mute all audio</label>
 <div className="voice-cues">{SOUNDS.map(name=><button key={name} disabled={muted} onClick={()=>sound(name)}>{name}</button>)}<button disabled={!current?.sound||muted} onClick={()=>current?.sound&&sound(current.sound)}>Replay sound</button><button onClick={stop}>Stop audio / cancel listening</button></div>
 <p className="muted">Voice movements temporarily pause sensor scenarios, then restore them. Stop audio does not stop joint movement; use Pause in the play space.</p>{audioError&&<p role="alert">{audioError}</p>}
 <h3>Voice activity · all Boos</h3><ol className="voice-events" aria-live="polite">{events.length?events.map((e,i)=><li key={i}>{e}</li>):<li>Choose a phrase to begin.</li>}</ol></section>;
}
