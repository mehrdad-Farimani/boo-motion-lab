import test from 'node:test';
import assert from 'node:assert/strict';
import {hearing,voiceResponse,CUES} from './app/voice.ts';
import {REST,validPose} from './app/motion.ts';
test('hearing distinguishes distance, noise, sleep and direction',()=>{
 const body={x:0,z:0,yaw:0};
 assert.equal(hearing({x:0,z:1},body,65,30,true).recognized,true);
 assert.equal(hearing({x:0,z:8},body,50,40,false).detected,false);
 assert.equal(hearing({x:0,z:1},body,50,30,false).recognized,true);
 assert.equal(hearing({x:0,z:1},body,50,30,true).recognized,false);
 const left=hearing({x:-1,z:1},body,65,30,false),right=hearing({x:1,z:1},body,65,30,false);
 assert.ok(left.left>left.right);assert.ok(right.right>right.left);
 assert.ok(hearing({x:0,z:-1},body,65,30,false).level<hearing({x:0,z:1},body,65,30,false).level);
});
test('voice reactions respect joints, touch, repetition and input isolation',()=>{
 const base={...REST};
 for(const cue of CUES) for(const angle of [-180,180])assert.ok(voiceResponse(cue,base,angle,false,false).frames.every(f=>validPose(f.pose)));
 assert.equal(voiceResponse('Gentle speech',base,0,true,false).sound,'Contented murmur');
 assert.equal(voiceResponse('Hello Boo',base,0,false,false).sound,'Sleepy grumble');
 assert.equal(voiceResponse('Hello Boo',base,0,false,true).sound,'Chirp');
 assert.equal(voiceResponse('Good night',base,0,false,false).frames.at(-1).pose.lids,100);
 assert.deepEqual(base,REST);
});
