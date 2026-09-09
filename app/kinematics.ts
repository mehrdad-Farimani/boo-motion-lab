import * as THREE from 'three';
import {URDF_JOINTS} from './urdfJoints.ts';
const frames=new Map<string,THREE.Matrix4>([['root',new THREE.Matrix4()]]);
const pending=[...URDF_JOINTS];
while(pending.length){const index=pending.findIndex(j=>frames.has(j.parent));if(index<0)throw Error('Invalid URDF joint tree');const [j]=pending.splice(index,1);const local=new THREE.Matrix4().compose(new THREE.Vector3(...j.xyz),new THREE.Quaternion().setFromEuler(new THREE.Euler(...j.rpy as [number,number,number],'ZYX')),new THREE.Vector3(1,1,1));frames.set(j.child,frames.get(j.parent)!.clone().multiply(local));}
const cadToScene=new THREE.Matrix4().makeRotationX(-Math.PI/2);
export function jointReference(name:string){const joint=URDF_JOINTS.find(j=>j.name===name);if(!joint)throw Error('Missing joint '+name);const matrix=cadToScene.clone().multiply(frames.get(joint.child)!);return {pivot:new THREE.Vector3().setFromMatrixPosition(matrix),axis:new THREE.Vector3(...joint.axis).transformDirection(matrix),lower:joint.lower,upper:joint.upper};}
export const PASSIVE_LEGS=[{key:'legLeft',label:'Left leg · passive',min:0,max:160,unit:'°'},{key:'legRight',label:'Right leg · passive',min:0,max:180,unit:'°'}] as const;
