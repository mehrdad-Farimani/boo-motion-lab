import {REST,sample,type Pose,type Frame} from './motion.ts';
import type {Hardware,Telemetry} from './hardware.ts';
export const RULES=[
 {key:'human',name:'Follow the person',description:'A person detected within the radar cone → turn the neck toward them. Move Human X/Z or enable Human moving below.'},
 {key:'head',name:'Head touch → head shake',description:'A new head press → two gentle head shakes, then return.'},
 {key:'back',name:'Back touch → settle',description:'A new back press → lower the head and close the eyelids, then return.'},
 {key:'belly',name:'Belly touch → happy wiggle',description:'A new belly press → alternate both hands and open the eyes, then return.'},
 {key:'imu',name:'Motion sensed → move hands',description:'IMU enabled and tilt over 25°, rotation over 30°/s, lift over 30 mm, or a fall → raise and wave both hands.'},
] as const;
export type Rule=typeof RULES[number]['key'];
export type ScenarioOptions={enabled:boolean}&Record<Rule,boolean>;
export const DEFAULT_SCENARIOS:ScenarioOptions={enabled:true,human:false,head:true,back:true,belly:true,imu:true};
type Action={rule:Rule;start:number;frames:Frame[]};
export type ScenarioState={active:Action|null;pressed:Record<'head'|'back'|'belly',boolean>;imuHigh:boolean;quietUntil:number;following:boolean};
export const initialScenario=():ScenarioState=>({active:null,pressed:{head:false,back:false,belly:false},imuHigh:false,quietUntil:0,following:false});
export function reaction(rule:Rule,base:Pose):Frame[]{
 const steps:Partial<Pose>[]=rule==='head'?[{turn:-28,lids:25},{turn:28},{turn:-28},{turn:28}]:rule==='back'?[{tilt:5,lids:100},{tilt:0,lids:100}]:rule==='belly'?[{left:65,right:25,lids:10},{left:25,right:65,lids:10},{left:65,right:25,lids:10}]:[{left:70,right:70,lids:15},{left:35,right:80},{left:80,right:35},{left:35,right:35}];
 return [{pose:{...base},duration:.55},...steps.map(p=>({pose:{...base,...p},duration:rule==='back'?1:.55})),{pose:{...base},duration:0}];
}
export function stepScenario(state:ScenarioState,options:ScenarioOptions,h:Hardware,t:Telemetry,pose:Pose){
 const next:ScenarioState={...state,pressed:{...h.touch}};
 const high=h.imuEnabled&&(Math.max(Math.abs(t.orientation[0]),Math.abs(t.orientation[2]))>25||Math.hypot(...t.gyro)>30||t.lift>.03||t.fallSpeed<-.2);
 const low=!h.imuEnabled||(Math.max(Math.abs(t.orientation[0]),Math.abs(t.orientation[2]))<20&&Math.hypot(...t.gyro)<15&&t.lift<.015&&t.fallSpeed>-.1);
 if(low)next.imuHigh=false;else if(high)next.imuHigh=true;
 if(!options.enabled)return {state:{...next,active:null,following:false},pose:null,status:'Scenarios paused',event:null};
 let event:string|null=null;
 if(next.active&&(!options[next.active.rule]||(next.active.rule==='imu'&&!h.imuEnabled))){next.active=null;event='Reaction cancelled';}
 if(next.active){const end=next.active.frames.slice(0,-1).reduce((n,f)=>n+f.duration,0);if(t.time-next.active.start>=end){const final=next.active.frames.at(-1)!.pose;event=RULES.find(r=>r.key===next.active!.rule)!.name+' · complete';next.active=null;next.quietUntil=t.time+1.5;return {state:next,pose:final,status:'Waiting for sensors',event};}}
 if(!next.active){
  const touch=(['head','back','belly'] as const).find(z=>options[z]&&h.touch[z]&&!state.pressed[z]);
  const trigger=touch??(options.imu&&high&&!state.imuHigh&&t.time>=state.quietUntil?'imu':null);
  if(trigger){next.active={rule:trigger,start:t.time,frames:reaction(trigger,pose)};event=RULES.find(r=>r.key===trigger)!.name+' · triggered';}
 }
 if(next.active)return {state:next,pose:sample(next.active.frames,Math.max(0,t.time-next.active.start)),status:RULES.find(r=>r.key===next.active!.rule)!.name,event};
 const detected=options.human&&h.radarEnabled&&h.human.enabled&&t.radar.detected;
 if(detected){if(!state.following)event='Person detected · following';next.following=true;return {state:next,pose:{...pose,...t.humanAim,lids:20},status:'Following person',event};}
 next.following=false;
 return {state:next,pose:state.following?{...pose,turn:REST.turn,tilt:REST.tilt,lids:REST.lids}:null,status:'Waiting for sensors',event:event??(state.following?'Person lost · resting':null)};
}
