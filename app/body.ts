import * as THREE from 'three';
export type BodyPose={x:number;z:number;yaw:number;pitch:number;roll:number;lift:number};
export const BODY_REST:BodyPose={x:0,z:0,yaw:0,pitch:0,roll:0,lift:0};
export const BODY_CONTROLS=[{key:'yaw',label:'Turn',min:-180,max:180,unit:'°'},{key:'pitch',label:'Lean',min:-180,max:180,unit:'°'},{key:'roll',label:'Roll',min:-180,max:180,unit:'°'},{key:'x',label:'Position · left / right',min:-3.5,max:3.5,unit:''},{key:'z',label:'Position · front / back',min:-3.5,max:3.5,unit:''},{key:'lift',label:'Lift above surface',min:0,max:2,unit:''}] as const;
export const POSTURES={Sitting:{pitch:0,roll:0},'Sleep on belly':{pitch:90,roll:0},'Sleep on back':{pitch:-90,roll:0}} as const;
export function validBody(p:unknown):p is BodyPose{return !!p&&typeof p==='object'&&BODY_CONTROLS.every(j=>{const v=(p as BodyPose)[j.key];return typeof v==='number'&&Number.isFinite(v)&&v>=j.min&&v<=j.max;});}
// Exact world-axis extents for a unit sphere transformed into a plush ellipsoid.
export function sphereExtents(matrix:THREE.Matrix4){const e=matrix.elements;return {x:Math.hypot(e[0],e[4],e[8]),y:Math.hypot(e[1],e[5],e[9]),z:Math.hypot(e[2],e[6],e[10])};}
export function advanceDrop(y:number,v:number,floor:number,dt:number){const velocity=v-9.81*dt;const next=y+velocity*dt;return next<=floor?{y:floor,v:0,landed:true}:{y:next,v:velocity,landed:false};}
