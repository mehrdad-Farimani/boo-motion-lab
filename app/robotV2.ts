import * as THREE from 'three';
import type {Pose} from './motion.ts';
import {jointReference} from './kinematics.ts';
export function buildV2(raw:THREE.Group){
 // Onshape export uses CAD Z-up, -Y forward, metres. Preserve its native scale.
 raw.rotation.x=-Math.PI/2;raw.updateMatrixWorld(true);
 const boo=new THREE.Group();
 function hinge(name:string,parent:THREE.Object3D=boo){const reference=jointReference(name),group=new THREE.Group();parent.updateMatrixWorld(true);group.position.copy(parent.worldToLocal(reference.pivot.clone()));parent.add(group);group.updateMatrixWorld(true);const axis=reference.axis.clone().applyQuaternion(parent.getWorldQuaternion(new THREE.Quaternion()).invert());return {group,axis,reference};}
 // CAD Y-axis roll stays locked. CAD -Z is yaw, CAD -X is pitch.
 const yaw=hinge('neck_dof_1'),pitch=hinge('neck_dof_2',yaw.group),head=pitch.group;
 const armHinges=[hinge('revolute_1'),hinge('revolute_2')],arms=armHinges.map(h=>h.group);
 const legHinges=[hinge('revolute_4'),hinge('revolute_3')],legs=legHinges.map(h=>h.group);
 const lidHinges=[hinge('eyelid_left',head),hinge('eyelid_right',head)];
 boo.updateMatrixWorld(true);
 const names=['main_body','body_structure','head','head_structure','arm_left','arm_right','leg_left','leg_right','cheek_left','cheek_right','nose','eyelid_left','eyelid_right'];
 const parts:THREE.Object3D[]=[];raw.traverse(o=>{if(names.includes(o.name)||/^eye(_\d+)?$/.test(o.name))parts.push(o);});
 if(!parts.some(o=>o.name==='main_body')||!parts.some(o=>o.name==='head')||!parts.some(o=>o.name==='arm_left')||!parts.some(o=>o.name==='arm_right'))throw Error('The CAD assembly is missing named body, head, or arm parts.');
 const supportMeshes:THREE.Mesh[]=[];
 for(const part of parts){const name=part.name;let parent:THREE.Object3D=boo;
  if(name==='arm_left')parent=arms[0];else if(name==='arm_right')parent=arms[1];
  else if(name==='leg_left')parent=legs[0];else if(name==='leg_right')parent=legs[1];
  else if(name.startsWith('eyelid'))parent=lidHinges[name==='eyelid_left'?0:1].group;
  else if(name==='head'||name==='head_structure'||name==='nose'||name.startsWith('cheek')||/^eye(_\d+)?$/.test(name))parent=head;
  parent.attach(part);
  part.visible=!name.endsWith('_structure');
  part.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();o.userData.part=name;if(part.visible)supportMeshes.push(o);if(parent===head||name.startsWith('eyelid'))o.userData.touchZone='head';}});
 }
 const bounds=new THREE.Box3();supportMeshes.forEach(m=>bounds.union(new THREE.Box3().setFromObject(m)));const dimensions=bounds.getSize(new THREE.Vector3());
 const hands=arms.map((arm,i)=>{const marker=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),new THREE.MeshBasicMaterial({visible:false}));marker.position.set((i===0?.09:-.09)-arm.position.x,0,.225-arm.position.z);marker.scale.setScalar(.027);arm.add(marker);return marker;});
 function rotate(h:ReturnType<typeof hinge>,angle:number,direction=1){const q=THREE.MathUtils.clamp(angle,h.reference.lower??-Infinity,h.reference.upper??Infinity);h.group.quaternion.setFromAxisAngle(h.axis,q*direction);}
 // Upper eyelids use the reversed angular convention, preserving their calibrated travel and pivots.
 function applyPose(p:Pose,passive={legLeft:0,legRight:0}){const rad=THREE.MathUtils.degToRad;rotate(yaw,-rad(p.turn));rotate(pitch,-rad(p.tilt));armHinges.forEach((h,i)=>rotate(h,-rad(i===0?p.left:p.right)));rotate(legHinges[0],-rad(passive.legLeft??0));rotate(legHinges[1],rad(passive.legRight??0));const opening=rad((100-p.lids)*.65);rotate(lidHinges[0],-opening,-1);rotate(lidHinges[1],opening,-1);}

 return {boo,head,arms,legs,hands,supportMeshes,dimensions,applyPose};
}
