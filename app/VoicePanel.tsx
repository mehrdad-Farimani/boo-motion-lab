'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {BodyPose} from './body';
import type {Hardware,Telemetry} from './hardware';
import type {Pose,Frame} from './motion';
import {CUES,SOUNDS,hearing,voiceResponse,type Cue,type Sound} from './voice';
import {useHelloBoo} from './useHelloBoo';
import {eyelidVoiceTarget} from './helloBoo';
type Controller={commandRevision:number;pose:Pose;body:BodyPose;hardware:Hardware;telemetry:Telemetry;playVoice:(name:string,frames:Frame[])=>void;manual:(key:keyof Pose,value:number)=>void};
type Feed={reset:number;status:string;sound?:Sound;until:number;left:number;right:number};
export default function VoicePanel({controllers,present,selected,human,setHuman}:{controllers:Controller[];present:number[];selected:number;human:Hardware['human'];setHuman:React.Dispatch<React.SetStateAction<Hardware['human']>>}){
 const [loudness,setLoudness]=useState(65),[noise,setNoise]=useState(30),[only,setOnly]=useState(false),[volume,setVolume]=useState(35),[muted,setMuted]=useState(false),[busy,setBusy]=useState(false),[feed,setFeed]=useState<Record<number,Feed>>({}),[events,setEvents]=useState<string[]>([]),[audioError,setAudioError]=useState('');
 const latest=useRef({controllers,present,muted,volume});useLayoutEffect(()=>{latest.current={controllers,present,muted,volume};});
 const audio=useRef<AudioContext|null>(null),timers=useRef<ReturnType<typeof setTimeout>[]>([]),lastCalls=useRef<Record<string,number>>({}),generation=useRef(0);
 function log(s:string){setEvents(e=>[new Date().toLocaleTimeString()+' · '+s,...e].slice(0,18));}
 function sound(name:Sound,delay=0){
  if(latest.current.muted)return;
  try{const ctx=audio.current??(audio.current=new AudioContext());void ctx.resume().catch(()=>setAudioError('Audio could not start. Try Replay sound.'));
   const index=SOUNDS.indexOf(name),start=ctx.currentTime+delay;
   for(let n=0;n<(index===0?3:2);n++){const o=ctx.createOscillator(),g=ctx.createGain();o.type=index===3?'triangle':'sine';const t=start+n*.26,f=[640,180,130,920,210,95][index];o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*(index===1?1.8:index===3?.4:1.2),t+.35);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(latest.current.volume/100*.12,t+.04);g.gain.exponentialRampToValueAtTime(.0001,t+.5);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+.52);o.onended=()=>{o.disconnect();g.disconnect();};}
  }catch{setAudioError('Audio is unavailable in this browser. Visual reactions still work.');}
 }
 function stopAudio(){generation.current++;timers.current.forEach(clearTimeout);timers.current=[];window.speechSynthesis?.cancel();void audio.current?.close();audio.current=null;setBusy(false);setFeed({});}
 const microphone=useHelloBoo(selected+':'+controllers[selected].hardware.resetSerial,phrase=>{
  const target=eyelidVoiceTarget(phrase);if(target===null)return;
  stopAudio();
  const current=controllers[selected];
  if(!present.includes(selected))return;
  const servo=current.hardware.servos.lids;
  if(!servo.enabled||servo.blocked||current.telemetry.servos.find(s=>s.key==='lids')?.fault){
   log('Boo '+(selected+1)+' · Heard “'+phrase+'” · eyelid servo unavailable; enable torque and clear protection.');return;
  }
  current.manual('lids',target);
  const position=target===0?'open':'closed';
  setFeed(f=>({...f,[selected]:{reset:current.hardware.resetSerial,status:(target===0?'Hello Boo':'Goodbye Boo')+' · eyelids '+position,until:Date.now()+6000,left:0,right:0}}));
  log('Boo '+(selected+1)+' · PC microphone: “'+phrase+'” → eyelids fully '+position+' · connected rig follows if enabled.');
 },stopAudio);
 function stop(){microphone.stop();stopAudio();}
 useEffect(()=>()=>{timers.current.forEach(clearTimeout);window.speechSynthesis?.cancel();void audio.current?.close();},[]);
 useEffect(()=>{if(muted){window.speechSynthesis?.cancel();void audio.current?.close();audio.current=null;}},[muted]);
 useEffect(()=>{const timer=setInterval(()=>setFeed(old=>{let changed=false;const next={...old};for(const key of Object.keys(next)){const id=Number(key);if(next[id].until&&Date.now()>next[id].until){next[id]={...next[id],status:'Quiet',until:0,left:0,right:0};changed=true;}}return changed?next:old;}),200);return()=>clearInterval(timer);},[]);
 function send(cue:Cue){
  microphone.stop('Microphone off · scripted cue selected');
  timers.current.forEach(clearTimeout);timers.current=[];setAudioError('');setBusy(true);const serial=++generation.current;
  try{audio.current??=new AudioContext();void audio.current.resume().catch(()=>{});if(!muted&&cue!=='Loud sound'&&'speechSynthesis' in window){const utterance=new SpeechSynthesisUtterance(cue==='Gentle speech'?'Hello little Boo, you can rest.':cue);utterance.volume=volume/100;window.speechSynthesis.speak(utterance);}else if(cue==='Loud sound')sound('Squeak');}catch{setAudioError('Phrase audio unavailable; the scripted cue still runs.');}
  const targets=only?[selected]:present;
  for(const id of targets){const c=controllers[id],source=c.telemetry.time?c.telemetry.humanPosition:human;
   const h=hearing(source,c.body,cue==='Loud sound'?85:loudness,noise,c.pose.lids>75),heard=human.enabled&&h.detected,recognized=heard&&(h.recognized||cue==='Loud sound');
   setFeed(f=>({...f,[id]:{reset:c.hardware.resetSerial,status:heard?'Listening':'Not heard',until:Date.now()+1800,left:heard?h.left:0,right:heard?h.right:0}}));
   log('Boo '+(id+1)+' · '+(heard?'Sound detected':'Not heard')+' · '+h.distance.toFixed(1)+' m');
   const reset=c.hardware.resetSerial,revision=c.commandRevision;
   timers.current.push(setTimeout(()=>{if(serial!==generation.current||!latest.current.present.includes(id)||latest.current.controllers[id].hardware.resetSerial!==reset||latest.current.controllers[id].commandRevision!==revision)return;
    const current=latest.current.controllers[id];
    if(!recognized){setFeed(f=>({...f,[id]:{reset:c.hardware.resetSerial,status:heard?'Sound only · cue unclear':'Not heard',until:Date.now()+1800,left:0,right:0}}));return;}
    const repeated=Date.now()-(lastCalls.current[id+":"+reset]??0)<15000;lastCalls.current[id+":"+reset]=Date.now();
    const response=voiceResponse(cue,current.pose,h.angle,Object.values(current.hardware.touch).some(Boolean),repeated);
    current.playVoice('Voice · '+cue,response.frames);sound(response.sound,id*.08);
    setFeed(f=>({...f,[id]:{reset:c.hardware.resetSerial,status:'Responding',sound:response.sound,until:Date.now()+2400,left:0,right:0}}));log('Boo '+(id+1)+' · '+cue+' → '+response.sound);
   },1800));
  }
  timers.current.push(setTimeout(()=>{if(serial===generation.current)setBusy(false);},4300));
 }
 const c=controllers[selected],h=hearing(c.telemetry.time?c.telemetry.humanPosition:human,c.body,loudness,noise,c.pose.lids>75),current=feed[selected]?.reset===c.hardware.resetSerial?feed[selected]:undefined;
 return <section className="voice-panel"><span className="overline">VOICE & HEARING / BOO {selected+1}</span><h2>Talk to Boo</h2><p className="muted">Say hello through your PC microphone, or explore scripted cues and Boo’s sounds below.</p>
 <section className={'microphone-card'+(microphone.active?' is-listening':'')} aria-label="PC microphone">
  <div className="microphone-heading"><h3>PC microphone</h3><span>{microphone.active?(microphone.status.startsWith('Listening')?'● LIVE':'◌ STARTING'):'○ OFF'}</span></div>
  <p><strong>“Hello Boo”</strong> opens Boo {selected+1}’s eyelids.<br/><strong>“Goodbye Boo”</strong> closes them.</p>
  <div className="voice-cues"><button className="primary" disabled={microphone.supported!==true||microphone.active} onClick={microphone.start}>Start microphone</button><button disabled={!microphone.active} onClick={()=>microphone.stop()}>Stop microphone</button></div>
  <output className="microphone-status" aria-live="polite">{microphone.status}</output>
  <label className="microphone-level">Microphone input <meter min={0} max={100} value={microphone.level}/></label>
  {microphone.transcript&&<p className="microphone-transcript">Heard: “{microphone.transcript.replaceAll('[unk]','…')}”</p>}
  {microphone.supported===false&&<p role="alert">Microphone audio is unavailable here. Open this simulation over HTTPS or localhost in a current browser.</p>}
  {microphone.error&&<p role="alert">{microphone.error}</p>}
  <p className="muted">Uses your PC’s default microphone. English recognition runs on your device; audio stays in this browser and is not recorded. First use downloads a speech model (about 40 MB). Say the phrase, then briefly pause.</p>
  <p className="muted">To move the real eyelids too, enable following in <strong>Sensors & Rig</strong> on this same page. Both phrases pause movements and scenarios and hold the requested eyelid position. Switching Boo, resetting, or hiding the page stops listening.</p>
 </section>
 <h3>Scripted voice cues</h3><p className="muted">These buttons simulate hearing from the person in the scene. Choosing a cue stops the PC microphone so Boo cannot hear its own spoken prompt.</p>
 <div className="voice-cues">{CUES.map(cue=><button key={cue} disabled={busy} onClick={()=>send(cue)}>{cue}</button>)}</div>
 <label className="voice-check"><input type="checkbox" checked={only} onChange={e=>setOnly(e.target.checked)}/> Selected Boo only</label>
 <output className="voice-readout"><strong>{current?.status??'Quiet'}</strong><span>{h.distance.toFixed(1)} m · {h.angle.toFixed(0)}° relative direction (simulated)</span><label>Left microphone (simulated) <meter min={0} max={100} value={current?.left??0}/></label><label>Right microphone (simulated) <meter min={0} max={100} value={current?.right??0}/></label><span>Speaker: {current?.status==='Responding'?current.sound:'Quiet'}</span></output>
 <h3>Sound source</h3><p className="muted">The person in the scene is the speaker. Position and movement are shared with the radar controls.</p>
 <label className="voice-check"><input type="checkbox" checked={human.enabled} onChange={e=>setHuman(h=>({...h,enabled:e.target.checked}))}/> Person present</label>
 <label className="voice-check"><input type="checkbox" checked={human.moving} onChange={e=>setHuman(h=>({...h,moving:e.target.checked}))}/> Person moving</label>
 {(['x','z'] as const).map(axis=><label className="voice-slider" key={axis}>Person {axis.toUpperCase()} · {human[axis].toFixed(1)} m<input type="range" min={-8} max={8} step={.1} value={human[axis]} onChange={e=>setHuman(h=>({...h,[axis]:Number(e.target.value)}))}/></label>)}
 <label className="voice-slider">Voice level at 1 m · {loudness} dB (simulated)<input type="range" min={35} max={85} value={loudness} onChange={e=>setLoudness(Number(e.target.value))}/></label>
 <label className="voice-slider">Background noise · {noise} dB (simulated)<input type="range" min={20} max={65} value={noise} onChange={e=>setNoise(Number(e.target.value))}/></label>
 <p className="muted">Approximate hearing model: distance, facing direction, noise and sleep affect detection. Loud sound uses 85 dB. These are test values, not calibrated microphone measurements. Hold a touch sensor during gentle speech for a contented response. A repeated call within 15 seconds helps Boo wake.</p>
 <h3>Boo’s speaker</h3><label className="voice-slider">Playback volume · {volume}%<input type="range" min={0} max={100} value={volume} onChange={e=>setVolume(Number(e.target.value))}/></label><label className="voice-check"><input type="checkbox" checked={muted} onChange={e=>setMuted(e.target.checked)}/> Mute all audio</label>
 <div className="voice-cues">{SOUNDS.map(name=><button key={name} disabled={muted} onClick={()=>sound(name)}>{name}</button>)}<button disabled={!current?.sound||muted} onClick={()=>current?.sound&&sound(current.sound)}>Replay sound</button><button onClick={stop}>Stop audio / cancel listening</button></div>
 <p className="muted">Scripted voice movements temporarily pause sensor scenarios, then restore them. Stop audio does not stop joint movement; use Pause in the play space or Stop & release in Sensors & Rig.</p>{audioError&&<p role="alert">{audioError}</p>}
 <h3>Voice activity · all Boos</h3><ol className="voice-events" aria-live="polite">{events.length?events.map((e,i)=><li key={i}>{e}</li>):<li>Start the microphone or choose a scripted phrase to begin.</li>}</ol></section>;
}
