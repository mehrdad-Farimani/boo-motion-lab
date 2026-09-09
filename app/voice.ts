import {REST,type Pose,type Frame} from './motion.ts';
export const CUES=['Hello Boo','Wake up','Good night','Are you there?','Gentle speech','Loud sound'] as const;
export type Cue=typeof CUES[number];
export const SOUNDS=['Chirp','Yawn','Settling hum','Squeak','Contented murmur','Sleepy grumble'] as const;
export type Sound=typeof SOUNDS[number];
export function hearing(source:{x:number;z:number},body:{x:number;z:number;yaw:number},loudness:number,noise:number,sleeping:boolean){
 const dx=source.x-body.x,dz=source.z-body.z,distance=Math.hypot(dx,dz,1);
 const angle=((Math.atan2(dx,dz)*180/Math.PI-body.yaw+540)%360)-180;
 const level=loudness-20*Math.log10(Math.max(1,distance))-(Math.abs(angle)>90?6:0);
 const detected=level>=noise+6,recognized=detected&&level>=noise+(sleeping?18:12);
 const strength=Math.max(0,Math.min(100,(level-20)*1.5)),pan=Math.sin(angle*Math.PI/180)*.25;
 return {distance,angle,level,detected,recognized,left:strength*(.75-pan),right:strength*(.75+pan)};
}
export function voiceResponse(cue:Cue,base:Pose,angle:number,petting:boolean,repeated:boolean):{sound:Sound;frames:Frame[]}{
 const turn=Math.max(-43,Math.min(46,angle));
 const sound:Sound=cue==='Loud sound'?'Squeak':cue==='Good night'?'Settling hum':petting?'Contented murmur':cue==='Wake up'?'Yawn':base.lids>75&&!repeated?'Sleepy grumble':'Chirp';
 const next:Pose=cue==='Good night'?{...REST}:cue==='Loud sound'?{...base,left:38,right:38,tilt:-12,lids:15}:{...base,turn,tilt:-8,lids:petting?55:cue==='Wake up'||repeated?15:45,left:cue==='Wake up'?45:base.left,right:cue==='Wake up'?45:base.right};
 return {sound,frames:[{pose:{...base},duration:cue==='Good night'?2:1},{pose:next,duration:1},{pose:{...next,left:cue==='Wake up'||cue==='Loud sound'?0:next.left,right:cue==='Wake up'||cue==='Loud sound'?0:next.right},duration:0}]};
}
