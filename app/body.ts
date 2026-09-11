import * as THREE from 'three';
import {PASSIVE_LEGS} from './kinematics.ts';
import {GRAVITY} from './metrics.ts';
import {contactPoints} from './contact.ts';
import {surfaceAt} from './surfaces.ts';
export type BodyPose={x:number;z:number;yaw:number;pitch:number;roll:number;lift:number;legLeft:number;legRight:number};
export const BODY_REST:BodyPose={x:0,z:0,yaw:0,pitch:0,roll:0,lift:0,legLeft:0,legRight:0};
export const BODY_CONTROLS=[{key:'yaw',label:'Turn',min:-180,max:180,unit:'°'},{key:'pitch',label:'Lean',min:-180,max:180,unit:'°'},{key:'roll',label:'Roll',min:-180,max:180,unit:'°'},{key:'x',label:'Position · left / right',min:-3.5,max:3.5,unit:' m'},{key:'z',label:'Position · front / back',min:-3.5,max:3.5,unit:' m'},{key:'lift',label:'Lift above surface',min:0,max:1,unit:' m'},...PASSIVE_LEGS] as const;
export const POSTURES={'Sleep on belly':{pitch:0,roll:0},Sitting:{pitch:-90,roll:0},'Sleep on back':{pitch:0,roll:180}} as const;
export function validBody(p:unknown):p is BodyPose{return !!p&&typeof p==='object'&&BODY_CONTROLS.every(j=>{const v=(p as BodyPose)[j.key];return typeof v==='number'&&Number.isFinite(v)&&v>=j.min&&v<=j.max;});}
// Exact world-axis extents for a unit sphere transformed into a plush ellipsoid.
export function sphereExtents(matrix:THREE.Matrix4){const e=matrix.elements;return {x:Math.hypot(e[0],e[4],e[8]),y:Math.hypot(e[1],e[5],e[9]),z:Math.hypot(e[2],e[6],e[10])};}
export function advanceDrop(y:number,v:number,floor:number,dt:number){const velocity=v-GRAVITY*dt;const next=y+v*dt-.5*GRAVITY*dt*dt;return next<=floor?{y:floor,v:0,landed:true}:{y:next,v:velocity,landed:false};}
const worldFrame=new THREE.Object3D();
export function supportHeight(meshes:THREE.Mesh[]){
 const points=contactPoints(meshes,worldFrame);
 return points.reduce((height,p)=>Math.max(height,surfaceAt(p.x,p.z)-p.y),-Infinity);
}
