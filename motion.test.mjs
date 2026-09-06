import assert from 'node:assert/strict';
import {JOINTS,REST,PRESETS,sample,blend,validPose} from './app/motion.ts';
assert.equal(JOINTS.length,5);
assert.ok(validPose(REST));
assert.ok(!validPose({...REST,left:200}));
assert.ok(!validPose({...REST,lids:NaN}));
assert.ok(!validPose(null));
for(const [name,frames] of Object.entries(PRESETS)){
 const total=frames.slice(0,-1).reduce((a,f)=>a+f.duration,0);
 assert.deepEqual(sample(frames,0),frames[0].pose,name+' begins at first pose');
 assert.deepEqual(sample(frames,total),frames.at(-1).pose,name+' ends at last pose');
 for(let t=0;t<=total;t+=.025)assert.ok(validPose(sample(frames,t)),name+' stays within limits');
}
assert.deepEqual(blend(REST,REST,.5),REST);
const handAt30={y:1.34-.76*Math.cos(Math.PI/6)+.07*Math.sin(Math.PI/6),z:.76*Math.sin(Math.PI/6)+.07*Math.cos(Math.PI/6)};
assert.ok(Math.hypot(handAt30.y-.63,handAt30.z-.7)<.37,'left hand can reach ball on low surface');
console.log('Passed: five channels, range rejection, preset endpoints and all interpolated poses, ball reach.');
