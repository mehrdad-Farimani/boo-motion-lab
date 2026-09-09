import * as THREE from 'three';
import {PASSIVE_LEGS} from './kinematics.ts';
import {GRAVITY,PLAY} from './metrics.ts';
export type BodyPose={x:number;z:number;yaw:number;pitch:number;roll:number;lift:number;legLeft:number;legRight:number};
export const BODY_REST:BodyPose={x:0,z:0,yaw:0,pitch:0,roll:0,lift:0,legLeft:0,legRight:0};
export const BODY_CONTROLS=[{key:'yaw',label:'Turn',min:-180,max:180,unit:'°'},{key:'pitch',label:'Lean',min:-180,max:180,unit:'°'},{key:'roll',label:'Roll',min:-180,max:180,unit:'°'},{key:'x',label:'Position · left / right',min:-3.5,max:3.5,unit:' m'},{key:'z',label:'Position · front / back',min:-3.5,max:3.5,unit:' m'},{key:'lift',label:'Lift above surface',min:0,max:1,unit:' m'},...PASSIVE_LEGS] as const;
export const POSTURES={'Sleep on belly':{pitch:0,roll:0},Sitting:{pitch:-90,roll:0},'Sleep on back':{pitch:0,roll:180}} as const;
export function validBody(p:unknown):p is BodyPose{return !!p&&typeof p==='object'&&BODY_CONTROLS.every(j=>{const v=(p as BodyPose)[j.key];return typeof v==='number'&&Number.isFinite(v)&&v>=j.min&&v<=j.max;});}
// Exact world-axis extents for a unit sphere transformed into a plush ellipsoid.
export function sphereExtents(matrix:THREE.Matrix4){const e=matrix.elements;return {x:Math.hypot(e[0],e[4],e[8]),y:Math.hypot(e[1],e[5],e[9]),z:Math.hypot(e[2],e[6],e[10])};}
export function advanceDrop(y:number,v:number,floor:number,dt:number){const velocity=v-GRAVITY*dt;const next=y+v*dt-.5*GRAVITY*dt*dt;return next<=floor?{y:floor,v:0,landed:true}:{y:next,v:velocity,landed:false};}
export function supportHeight(meshes:THREE.Mesh[]){let minimum=Infinity;for(const m of meshes){const box=m.geometry.type==='SphereGeometry'?null:m.geometry.boundingBox!.clone().applyMatrix4(m.matrixWorld);const center=box?box.getCenter(new THREE.Vector3()):new THREE.Vector3().setFromMatrixPosition(m.matrixWorld);const ext=box?box.getSize(new THREE.Vector3()).multiplyScalar(.5):sphereExtents(m.matrixWorld);const e={12:center.x,13:center.y,14:center.z};let surface=0;if(Math.hypot(e[12],e[14])<PLAY.rugRadius+Math.max(ext.x,ext.z))surface=PLAY.rugTop;if(e[12]+ext.x>-PLAY.tableWidth/2&&e[12]-ext.x<PLAY.tableWidth/2&&e[14]+ext.z>PLAY.tableZ-PLAY.tableDepth/2&&e[14]-ext.z<PLAY.tableZ+PLAY.tableDepth/2)surface=Math.max(surface,PLAY.tableHeight);minimum=Math.min(minimum,e[13]-ext.y-surface);}return -minimum;}
