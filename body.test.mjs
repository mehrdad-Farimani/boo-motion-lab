import assert from 'node:assert/strict';
import * as THREE from 'three';
import {BODY_REST,POSTURES,validBody,sphereExtents,advanceDrop} from './app/body.ts';
assert.ok(validBody(BODY_REST));
assert.ok(!validBody({...BODY_REST,pitch:Infinity}));
assert.ok(!validBody({...BODY_REST,x:8}));
assert.ok(!validBody({...BODY_REST,lift:-1}));
for(const [name,p] of Object.entries(POSTURES)){
 const rotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(p.pitch*Math.PI/180,0,p.roll*Math.PI/180,'YXZ'));
 const forward=new THREE.Vector3(0,0,1).applyQuaternion(rotation);
 if(name==='Sleep on belly')assert.ok(forward.y<-.999);
 if(name==='Sleep on back')assert.ok(forward.y>.999);
 if(name==='Sitting')assert.ok(forward.z>.999);
}
const m=new THREE.Matrix4().compose(new THREE.Vector3(),new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI/2,0,0)),new THREE.Vector3(.6,.8,.4));
assert.ok(Math.abs(sphereExtents(m).y-.4)<1e-8,'support accounts for body orientation');
let y=2,v=0,landed=false;for(let i=0;i<180;i++){const s=advanceDrop(y,v,.3,1/60);assert.ok(s.y>=.3);y=s.y;v=s.v;landed=s.landed;}
assert.equal(y,.3);assert.equal(v,0);assert.ok(landed);
console.log('Passed: body input limits, belly/back facing directions, rotated support extents, gravity landing without floor penetration.');
