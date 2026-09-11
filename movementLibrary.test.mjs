import {test} from 'node:test';
import assert from 'node:assert/strict';
import {addMovement,readLibrary} from './app/movementLibrary.ts';
import {REST} from './app/motion.ts';
test('named captured movement survives serialization without sharing mutable draft poses',()=>{
 const frames=[{pose:{...REST},duration:1},{pose:{...REST,left:40},duration:2}];
 const saved=addMovement([],' My wave ',frames);frames[0].pose.left=90;
 assert.equal(saved[0].name,'My wave');assert.equal(saved[0].frames[0].pose.left,0);
 assert.deepEqual(readLibrary(JSON.stringify(saved)),saved);
 assert.throws(()=>addMovement(saved,'my wave',frames));
 assert.throws(()=>addMovement(saved,'',frames));
 assert.throws(()=>addMovement(saved,'One pose',frames.slice(0,1)));
 assert.throws(()=>readLibrary('[{"name":"Bad","frames":[null,null]}]'));
});
