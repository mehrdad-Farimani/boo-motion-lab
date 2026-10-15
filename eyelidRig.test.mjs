import {test} from 'node:test';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {RIG,lidsToSteps,movePacket,packet,ReplyParser,decodeReading} from './app/eyelidProtocol.ts';
import {EyelidSerial} from './app/eyelidSerial.ts';
class FakePort{
 writes=[];torque=1;position=800;silent=false;badIdentity=false;closed=false;
 readable=new ReadableStream({start:c=>{this.rx=c;}});
 writable=new WritableStream({write:b=>{
  this.writes.push([...b]);
  if(b[4]===2&&!this.silent){
   const data=b[5]===2?[this.badIdentity?0:1,0,9,2]:b[5]===9?[0,20,3,235]:b[5]===40?[this.torque]:[this.position>>8,this.position&255,0,0,0,0,59,22];
   const p=packet(2,0,data);this.rx.enqueue(p.slice(0,3));this.rx.enqueue(p.slice(3));
  }
  if(b[4]===0x83){assert.equal(b[7],2);if(b[5]===40)this.torque=b[8];else this.position=(b[8]<<8)|b[9];}
 }});
 async open(options){assert.equal(options.baudRate,1000000);}
 async close(){this.closed=true;}
}
test('calibrated range, finite targets, big-endian goal and scoped ID',()=>{
 assert.equal(lidsToSteps(0),511);assert.equal(lidsToSteps(100),955);
 assert.equal(lidsToSteps(-100),511);assert.equal(lidsToSteps(200),955);assert.throws(()=>lidsToSteps(NaN));
 assert.deepEqual([...movePacket(955)].slice(2,-1),[254,11,131,42,6,2,3,187,0,0,0,100]);
 assert.throws(()=>movePacket(956));assert.throws(()=>movePacket(510));
 const parser=new ReplyParser(),reply=packet(2,0,[3,187,0,0,0,0,59,22]);
 assert.deepEqual(parser.push(Uint8Array.from([9,12,255])),[]);
 const result=parser.push(reply);assert.equal(result.length,1);assert.equal(decodeReading(result[0].data).steps,955);
 reply[reply.length-1]^=1;assert.equal(new ReplyParser().push(reply).length,0);
});
test('connection is read-only; enable seeds current position; following is bounded and stop releases only ID 2',async()=>{
 const port=new FakePort(),link=new EyelidSerial(port);const reading=await link.open();
 assert.equal(reading.steps,800);assert.ok(port.writes.every(p=>p[4]===2));
 await link.follow(100,reading);assert.ok(port.writes.every(p=>p[4]===2));
 assert.equal(await link.enable(reading),true);assert.equal(port.position,800);
 await delay(120);await link.follow(100,await link.feedback());assert.ok(port.position>800&&port.position<=810);
 await link.stop();assert.equal(port.torque,0);const count=port.writes.length;
 await link.follow(0,reading);assert.equal(port.writes.length,count);
 await link.close();assert.equal(port.closed,true);
});
test('wrong protocol, unhealthy readings, stale telemetry and missing replies cannot drive the rig',async()=>{
 const wrong=new FakePort();wrong.badIdentity=true;const invalid=new EyelidSerial(wrong);
 await assert.rejects(()=>invalid.open(),/Expected/);assert.ok(wrong.writes.every(p=>p[4]===2));await invalid.close();
 const port=new FakePort(),link=new EyelidSerial(port);const reading=await link.open();
 await assert.rejects(()=>link.enable({...reading,steps:200}),/outside/);
 await assert.rejects(()=>link.enable({...reading,temperature:65}),/temperature/);
 await link.enable(reading);await delay(650);await assert.rejects(()=>link.follow(100,reading),/stale/);
 await link.stop();port.silent=true;await assert.rejects(()=>link.feedback(),/No reply/);await link.close();
});
