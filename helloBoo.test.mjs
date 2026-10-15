import test from 'node:test';
import assert from 'node:assert/strict';
import {HelloBooListener,isHelloBoo,eyelidVoiceTarget} from './app/helloBoo.ts';
import {lidsToSteps,RIG} from './app/eyelidProtocol.ts';

function setup(){
 const recognizers=[],states=[],phrases=[];
 const listener=new HelloBooListener(()=>{
  const r={start(){this.onstart?.();},abort(){this.aborted=true;},onstart:null,onend:null,onerror:null,onresult:null};
  recognizers.push(r);return r;
 },s=>states.push(s),(text,match)=>phrases.push({text,match}));
 return {listener,recognizers,states,phrases};
}
const event=(text,final=true)=>({resultIndex:0,results:[{0:{transcript:text},length:1,isFinal:final}]});

test('Hello Boo recognizes whole words with punctuation, not similar words',()=>{
 for(const text of ['Hello Boo','HELLO, BOO!','Well, hello Boo.'])assert.equal(isHelloBoo(text),true,text);
 for(const text of ['hello','Boo','hello booth','hello book','hello beautiful Boo','nothello boo'])assert.equal(isHelloBoo(text),false,text);
});
test('Goodbye Boo closes to the calibrated endpoint and ambiguous phrases do nothing',()=>{
 for(const phrase of ['Goodbye Boo','GOOD BYE, BOO!','okay goodbye boo'])assert.equal(eyelidVoiceTarget(phrase),100);
 for(const phrase of ['goodbye','goodbye booth','hello boo goodbye boo','bye boo'])assert.equal(eyelidVoiceTarget(phrase),null);
 assert.equal(eyelidVoiceTarget('hello boo'),0);assert.equal(lidsToSteps(100),RIG.closed);
});
test('an opposite command works immediately; repeated commands are debounced',()=>{
 const {listener,recognizers,phrases}=setup();listener.start();const results=[];
 for(const phrase of ['hello boo','goodbye boo','goodbye boo','hello boo']){
  results.push(event(phrase).results[0]);recognizers[0].onresult({resultIndex:results.length-1,results});
 }
 assert.deepEqual(phrases.map(p=>p.match),[true,true,false,true]);listener.stop();
});
test('only new final results trigger once, with a cooldown; open maps to calibrated rig endpoint',()=>{
 const {listener,recognizers,phrases}=setup();listener.start();const r=recognizers[0];
 r.onresult(event('hello boo',false));assert.equal(phrases.length,0);
 r.onresult(event('hello boo'));r.onresult(event('hello boo'));assert.deepEqual(phrases,[{text:'hello boo',match:true}]);
 r.onresult({resultIndex:1,results:[event('hello boo').results[0],event('hello boo').results[0]]});
 assert.equal(phrases.length,2);assert.equal(phrases[1].match,false);
 assert.equal(lidsToSteps(0),RIG.open);assert.equal(RIG.open,511);listener.stop();
});
test('stop rejects late recognition and start events and releases the microphone',()=>{
 const {listener,recognizers,phrases,states}=setup();listener.start();const r=recognizers[0],late=r.onresult,lateStart=r.onstart;
 listener.stop();late(event('hello boo'));lateStart();
 assert.equal(phrases.length,0);assert.equal(r.aborted,true);assert.equal(states.at(-1).active,false);
 listener.start();assert.equal(recognizers.length,2);listener.stop();
});
test('low-confidence sound cannot open the real eyelids',()=>{
 const {listener,recognizers,phrases}=setup();listener.start();const uncertain=event('hello boo');
 uncertain.results[0][0].confidence=.4;recognizers[0].onresult(uncertain);
 assert.equal(phrases[0].match,false);listener.stop();
});
test('permission and service errors stop instead of endlessly restarting',()=>{
 for(const error of ['not-allowed','local-model','audio-capture']){
  const {listener,recognizers,states}=setup();listener.start();const r=recognizers[0],lateEnd=r.onend;
  r.onerror({error});lateEnd();assert.equal(states.at(-1).active,false);assert.ok(states.at(-1).error);assert.equal(recognizers.length,1);
 }
});
test('normal end restarts listening, but an explicit stop cancels a pending restart',t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const {listener,recognizers,phrases}=setup();listener.start();const first=recognizers[0],lateResult=first.onresult;
 first.onend();t.mock.timers.tick(500);assert.equal(recognizers.length,2);
 lateResult(event('hello boo'));assert.equal(phrases.length,0);
 recognizers[1].onresult(event('hello boo'));assert.equal(phrases[0].match,true);
 recognizers[1].onend();listener.stop();t.mock.timers.tick(1000);assert.equal(recognizers.length,2);
});
