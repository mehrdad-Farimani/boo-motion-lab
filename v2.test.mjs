import fs from 'node:fs';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {buildV2} from './app/robotV2.ts';
import {REST} from './app/motion.ts';
import {BODY_REST,POSTURES,supportHeight} from './app/body.ts';
const decoderModule={exports:{}};
// Load the trusted vendored CommonJS decoder inside this ESM test.
// oxlint-disable-next-line typescript/no-implied-eval
new Function('module','exports','require','__dirname',fs.readFileSync('public/draco/draco_decoder.js','utf8'))(decoderModule,decoderModule.exports,createRequire(import.meta.url),process.cwd()+'/public/draco');
const draco=await decoderModule.exports({});
const decoder={preload(){},decodeDracoFile(buffer,callback,ids,types,space,reject){try{
 const dec=new draco.Decoder(),buf=new draco.DecoderBuffer();buf.Init(new Int8Array(buffer),buffer.byteLength);const mesh=new draco.Mesh();const status=dec.DecodeBufferToMesh(buf,mesh);assert.ok(status.ok());const geometry=new THREE.BufferGeometry();
 for(const [name,id] of Object.entries(ids)){const attr=dec.GetAttributeByUniqueId(mesh,id),values=new draco.DracoFloat32Array();dec.GetAttributeFloatForAllPoints(mesh,attr,values);const array=new Float32Array(values.size());for(let i=0;i<array.length;i++)array[i]=values.GetValue(i);geometry.setAttribute(name,new THREE.BufferAttribute(array,attr.num_components()));draco.destroy(values);}
 const face=new draco.DracoInt32Array(),indices=new Uint32Array(mesh.num_faces()*3);for(let i=0;i<mesh.num_faces();i++){dec.GetFaceFromMesh(mesh,i,face);for(let j=0;j<3;j++)indices[i*3+j]=face.GetValue(j);}geometry.setIndex(new THREE.BufferAttribute(indices,1));[face,mesh,buf,dec].forEach(o=>draco.destroy(o));callback(geometry);
 }catch(e){reject(e);}}};
const bytes=fs.readFileSync('public/models/boo-v2.glb');
const loaded=await new GLTFLoader().setDRACOLoader(decoder).parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
// A single decoded asset supports independently articulated robot instances.
const copies=Array.from({length:5},()=>buildV2(loaded.scene.clone(true)));
const copySnapshots=copies.map(m=>{m.applyPose(REST);m.boo.updateMatrixWorld(true);return m.arms[0].quaternion.clone();});
copies[2].applyPose({...REST,left:80,turn:30,lids:0},{legLeft:40,legRight:0});
copies.forEach((m,i)=>{m.boo.updateMatrixWorld(true);assert.equal(m.arms[0].quaternion.angleTo(copySnapshots[i])>1e-6,i===2,'only commanded clone moves');});
assert.equal(new Set(copies.map(m=>m.head)).size,5,'separate neck hierarchy per Boo');
assert.equal(new Set(copies.map(m=>m.hands[0])).size,5,'separate contact probes per Boo');
assert.ok(loaded.scene.getObjectByName('main_body'),'source asset survives cloning');
console.log('Passed: five CAD clones, isolated arm/neck/leg transforms, distinct contact probes, reusable source.');
const model=buildV2(loaded.scene),rig=new THREE.Group();rig.add(model.boo);
console.log('Native V2 W/H/D (mm)',model.dimensions.toArray().map(v=>v*1000));
assert.ok(model.supportMeshes.length>20);assert.equal(REST.tilt,0);assert.equal(REST.lids,100);assert.equal(BODY_REST.pitch,0);
const before=model.arms[0].children[0].matrixWorld.clone();model.applyPose(REST);rig.updateMatrixWorld(true);assert.ok(model.arms[0].children[0].matrixWorld.elements.every((x,i)=>Math.abs(x-before.elements[i])<1e-9),'rest preserves CAD transform');
for(const p of Object.values(POSTURES)){rig.position.y=0;rig.rotation.set(p.pitch*Math.PI/180,0,p.roll*Math.PI/180);rig.updateMatrixWorld(true);rig.position.y=supportHeight(model.supportMeshes);rig.updateMatrixWorld(true);assert.ok(Math.abs(supportHeight(model.supportMeshes))<1e-6,'posture supported');}
model.applyPose({...REST,left:40,turn:25,lids:0});rig.updateMatrixWorld(true);assert.notDeepEqual(model.arms[0].children[0].matrixWorld.elements,before.elements);assert.ok(Number.isFinite(supportHeight(model.supportMeshes)));
console.log('Passed: compressed GLB decode, named parts, native scale, unchanged CAD rest pose, all posture support and articulation.');

const {jointReference}=await import('./app/kinematics.ts');
rig.rotation.set(0,0,0);rig.position.set(0,0,0);model.applyPose(REST);rig.updateMatrixWorld(true);
assert.ok(model.arms[0].getWorldPosition(new THREE.Vector3()).distanceTo(jointReference('revolute_1').pivot)<1e-8);
const origin=model.legs[0].getWorldPosition(new THREE.Vector3()),footBefore=model.legs[0].children[0].getWorldPosition(new THREE.Vector3());
model.applyPose(REST,{legLeft:60,legRight:45});rig.updateMatrixWorld(true);
assert.ok(model.legs[0].getWorldPosition(new THREE.Vector3()).distanceTo(origin)<1e-8,'passive leg rotates about URDF pivot');
assert.ok(model.legs[0].children[0].getWorldPosition(new THREE.Vector3()).distanceTo(footBefore)>.001,'passive leg moves');
assert.ok(model.arms[0].quaternion.angleTo(new THREE.Quaternion())<1e-8,'manual legs do not drive arms');
assert.ok(jointReference('neck_dof_1').axis.dot(new THREE.Vector3(0,-1,0))>.999,'yaw axis is vertical');
assert.ok(jointReference('neck_dof_2').axis.dot(new THREE.Vector3(-1,0,0))>.999,'pitch axis is lateral');
console.log('Passed: URDF arm pivot, passive legs without servo commands, yaw/pitch axis mapping.');

const {contactPoints,bellyContact}=await import('./app/contact.ts');
rig.position.set(0,0,0);rig.rotation.set(0,0,0);
for(const angle of [0,30,60,90,120,150]){model.applyPose({...REST,left:angle,right:angle});rig.updateMatrixWorld(true);const stance=bellyContact(contactPoints(model.supportMeshes,rig),0,0,0);console.log('Belly arm',angle,stance);assert.ok(stance.penetration<.003,'rear-grounded solution clears CAD surfaces');}

const {surfaceAt}=await import('./app/contact.ts');
for(const [left,right,x,z,yaw] of [[0,0,0,0,0],[90,90,0,0,0],[90,0,0,0,0],[90,90,1.2,0,45]]){
 model.applyPose({...REST,left,right});rig.updateMatrixWorld(true);const points=contactPoints(model.supportMeshes,rig),stance=bellyContact(points,x,z,yaw);
 const transform=new THREE.Matrix4().compose(new THREE.Vector3(x,stance.height,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(stance.pitch*Math.PI/180,yaw*Math.PI/180,0,'YXZ')),new THREE.Vector3(1,1,1));
 let lowerGap=Infinity;
 for(const p of points.filter(p=>p.rear)){const w=new THREE.Vector3(p.x,p.y,p.z).applyMatrix4(transform);lowerGap=Math.min(lowerGap,w.y-surfaceAt(w.x,w.z));}
 assert.ok(Math.abs(lowerGap)<1e-8,'lower body remains touching its supporting surface');
 if(left===0&&right===0)assert.equal(stance.pitch,0,'sleeping rest is unchanged');
 if(left===90&&right===90){assert.ok(stance.pitch<0,'chest rocks upward');assert.ok(stance.penetration<=.0011,'hands clear support surface');}
}
console.log('Passed: grounded lower body during symmetric/asymmetric arm motion, yaw and off-rug positions; neutral rest unchanged.');
