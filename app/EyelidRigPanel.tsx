'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {EyelidSerial,type SerialAPI} from './eyelidSerial';
import {RIG,lidsToSteps,stepsToDegrees,stepsToLids,type RigReading} from './eyelidProtocol';
type Props={selected:number;lids:number;canMove:boolean;resetSerial:number;onAlign:(lids:number)=>void};
export default function EyelidRigPanel(props:Props){
 const latest=useRef(props);useLayoutEffect(()=>{latest.current=props;});
 const link=useRef<EyelidSerial|null>(null),active=useRef(false),busy=useRef(false),owner=useRef<number|null>(null),mounted=useRef(true);
 const connectAttempt=useRef(0);
 const [supported,setSupported]=useState(false),[connected,setConnected]=useState(false),[working,setWorking]=useState(false),[following,setFollowing]=useState(false);
 const [reading,setReading]=useState<RigReading|null>(null),[status,setStatus]=useState('Disconnected — no commands sent.'),[error,setError]=useState('');
 const api=()=> (navigator as Navigator&{serial?:SerialAPI}).serial;
 async function stop(message='Stopped. Eyelid torque released.'){
  active.current=false;setFollowing(false);owner.current=null;
  try{await link.current?.stop();setStatus(message);}catch{setError('Could not confirm torque release. Disconnect servo power if it is still moving.');}
 }
 async function disconnect(){
  const session=link.current;link.current=null;active.current=false;owner.current=null;setFollowing(false);setConnected(false);
  if(session){try{await session.stop();}catch{/* The USB link may already be unplugged. */}await session.close().catch(()=>{});}
  setStatus('Disconnected. Reconnect and enable to resume.');setReading(null);
 }
 useEffect(()=>{
  mounted.current=true;setSupported(!!api()&&window.isSecureContext);
  let timer:ReturnType<typeof setTimeout>;
  async function poll(){
   const session=link.current;
   if(session&&!busy.current){busy.current=true;try{
    const value=await session.feedback();if(session===link.current){
     setReading(value);
     if(active.current&&owner.current===latest.current.selected&&latest.current.canMove&&!document.hidden)await session.follow(latest.current.lids,value);
    }
   }catch(e){if(session===link.current){active.current=false;setFollowing(false);setError(e instanceof Error?e.message:'USB communication failed.');await disconnect();}}
   finally{busy.current=false;}}
   if(mounted.current)timer=setTimeout(poll,100);
  }
  timer=setTimeout(poll,100);
  const hidden=()=>{if(document.hidden&&active.current)void stop('Paused because the page is hidden. Enable again to resume.');};
  document.addEventListener('visibilitychange',hidden);
  return()=>{mounted.current=false;clearTimeout(timer);document.removeEventListener('visibilitychange',hidden);const session=link.current;link.current=null;active.current=false;if(session)void session.stop().catch(()=>{}).finally(()=>session.close().catch(()=>{}));};
 },[]);
 useEffect(()=>{if(active.current)void stop('Following paused after changing Boo or resetting. Enable again to resume.');},[props.selected,props.resetSerial]);
 useEffect(()=>{if(!props.canMove&&active.current)void stop('Simulation eyelid torque is off or in protection.');},[props.canMove]);
 async function connect(){
  setError('');setWorking(true);busy.current=true;let session:EyelidSerial|null=null;const attempt=++connectAttempt.current;
  setStatus('Choose COM6 in the browser’s port picker. If no picker appears, open this address in Edge or Chrome.');
  try{
   const serial=api();if(!serial)throw Error('Open this simulation in Microsoft Edge or Google Chrome to use USB serial.');
   const port=await serial.requestPort();if(attempt!==connectAttempt.current||!mounted.current)return;
   session=new EyelidSerial(port);const value=await session.open();
   if(attempt!==connectAttempt.current||!mounted.current){await session.close();return;}
   link.current=session;setReading(value);setConnected(true);setStatus('Connected to ID 2 · read-only. Enable following when ready.');
  }catch(e){if(session)await session.close().catch(()=>{});if(attempt===connectAttempt.current)setError(e instanceof Error?e.message:'Could not connect. Disconnect TTL Servo Studio and select COM6.');}
  finally{if(attempt===connectAttempt.current){busy.current=false;setWorking(false);}}
 }
 async function enable(){
  const session=link.current;if(!session)return;
  if(busy.current){setStatus('Reading the servo. Press Enable following again in a moment.');return;}
  setError('');setWorking(true);busy.current=true;const selected=latest.current.selected,reset=latest.current.resetSerial;
  try{
   const value=await session.feedback();setReading(value);
   latest.current.onAlign(stepsToLids(value.steps));
   if(await session.enable(value)&&session===link.current&&selected===latest.current.selected&&reset===latest.current.resetSerial&&latest.current.canMove&&!document.hidden){active.current=true;owner.current=selected;setFollowing(true);setStatus('Following Boo '+(selected+1)+' eyelids.');}
   else await session.stop();
  }catch(e){await session.stop().catch(()=>{});setError(e instanceof Error?e.message:'Could not enable the rig.');}
  finally{busy.current=false;setWorking(false);}
 }
 return <section className="eyelid-rig" aria-label="Physical eyelid rig"><div className="body-heading"><div><span className="overline">USB HARDWARE / EYELIDS</span><h2>Live eyelid rig</h2></div><span className="badge">{following?'LIVE · Boo '+(props.selected+1):connected?'Connected · not following':'Disconnected'}</span></div>
 <p className="muted">Feetech SCS0009 · ID 2 · COM6 · 1,000,000 baud. Disconnect TTL Servo Studio first, then choose COM6 in the browser’s port picker.</p>
 <div className="posture-buttons"><button onClick={()=>void connect()} disabled={!supported||connected||working}>Connect eyelid rig</button><button className={following?'':'primary'} onClick={()=>void enable()} disabled={!connected||following||working||!props.canMove}>Enable following</button><button className="rig-stop" onClick={()=>void stop()} disabled={!connected}>Stop & release</button><button onClick={()=>void disconnect()} disabled={!connected||working}>Disconnect rig</button></div>
 {working&&!connected&&<button onClick={()=>{++connectAttempt.current;busy.current=false;setWorking(false);setStatus('Connection cancelled. If the port picker did not open, use Edge or Chrome.');}}>Cancel connection</button>}
 {!supported&&<p role="status">USB serial is unavailable in this browser. Open this same address in Microsoft Edge or Google Chrome on the computer connected to COM6.</p>}
 <p role="status">{status}</p>{error&&<p role="alert" className="rig-error">{error} If the port is busy, click Disconnect in TTL Servo Studio.</p>}
 <div className="readings"><div><span>Boo target</span><strong>{props.lids.toFixed(0)}% closed · {stepsToDegrees(lidsToSteps(props.lids)).toFixed(1)}°</strong></div><div><span>Physical position</span><strong>{reading?reading.degrees.toFixed(1)+'° · '+reading.steps+' steps':'—'}</strong></div><div><span>Physical supply / temperature</span><strong>{reading?reading.voltage.toFixed(1)+' V / '+reading.temperature+'°C':'—'}</strong></div></div>
 <p className="muted">Open: 149.9° · closed: 280° (511–955 steps, rounded to servo resolution). Speed limited to {RIG.speed} steps/s (about 29°/s). Fast simulated blinks will take longer on the rig.</p>
 <p className="muted">Connecting only reads the servo. Enabling aligns Boo’s eyelids to the physical position, then follows the slider, movements, captured sequences and sensor reactions. Switching Boo, hiding the page, or disabling simulated eyelid torque stops following. Only ID 2 is commanded; other joints remain simulated. If USB is unplugged, the servo may finish its last small move and hold until power is disconnected.</p>
 </section>;
}
