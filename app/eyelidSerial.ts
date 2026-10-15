import {RIG,ReplyParser,readPacket,movePacket,torquePacket,decodeReading,lidsToSteps,type Reply,type RigReading} from './eyelidProtocol.ts';
export type SerialPortLike={readable:ReadableStream<Uint8Array>|null;writable:WritableStream<Uint8Array>|null;open(options:{baudRate:number;dataBits:8;stopBits:1;parity:'none';flowControl:'none'}):Promise<void>;close():Promise<void>};
export type SerialAPI={requestPort():Promise<SerialPortLike>};
/** One connection, one outstanding read, and no queued motion targets. */
export class EyelidSerial{
 private reader:ReadableStreamDefaultReader<Uint8Array>|null=null;
 private writer:WritableStreamDefaultWriter<Uint8Array>|null=null;
 private readerTask:Promise<void>|null=null;
 private pending:{count:number;resolve:(b:Uint8Array)=>void;reject:(e:Error)=>void}|null=null;
 private armed=false;
 private closed=false;
 private lastStep=RIG.open as number;
 private lastMove=0;
 private lastRead=0;
 private generation=0;
 private fault:Error|null=null;
 private port:SerialPortLike;
 constructor(port:SerialPortLike){this.port=port;}
 async open(){
  await this.port.open({baudRate:RIG.baud,dataBits:8,stopBits:1,parity:'none',flowControl:'none'});
  if(!this.port.readable||!this.port.writable)throw Error('Serial streams unavailable.');
  this.reader=this.port.readable.getReader();this.writer=this.port.writable.getWriter();this.readerTask=this.readLoop();
  // Read-only verification: SCSCL endian marker, servo ID, and position-mode limits.
  const identity=await this.read(2,4);if(identity[0]!==1||identity[3]!==RIG.id)throw Error('Expected the SCS0009 at ID 2. Check the model and adapter.');
  const limits=await this.read(9,4);const low=(limits[0]<<8)|limits[1],high=(limits[2]<<8)|limits[3];
  if(low>RIG.open||high<RIG.closed||high>1023)throw Error('Servo limits do not cover the calibrated eyelid range, or it is in motor mode.');
  return this.feedback();
 }
 private async readLoop(){
  const parser=new ReplyParser();
  try{while(!this.closed&&this.reader){const result=await this.reader.read();if(result.done)break;for(const reply of parser.push(result.value))this.receive(reply);}}
  catch(e){if(!this.closed)this.fault=e instanceof Error?e:Error('USB connection lost.');}
  finally{if(!this.closed){this.fault??=Error('USB connection lost.');this.pending?.reject(this.fault);this.armed=false;}}
 }
 private receive(reply:Reply){
  if(reply.id!==RIG.id||!this.pending)return;
  // Adapter echoes contain the READ params (two bytes); our reads use 1/4/8 bytes.
  if(reply.data.length!==this.pending.count)return;
  if(reply.error)this.pending.reject(Error('Servo reported fault '+reply.error+'. Motion stopped.'));
  else this.pending.resolve(reply.data);
 }
 private async write(bytes:Uint8Array){if(this.closed||!this.writer)throw Error('Rig is disconnected.');await this.writer.write(bytes);}
 private async read(address:number,count:number){
  if(this.fault)throw this.fault;if(this.pending)throw Error('Serial read already in progress.');
  let timer:ReturnType<typeof setTimeout>;
  const response=new Promise<Uint8Array>((resolve,reject)=>{timer=setTimeout(()=>reject(Error('No reply from servo ID 2. Check power, COM6 and TTL Servo Studio.')),500);this.pending={count,resolve,reject};});
  void response.catch(()=>{});
  try{await this.write(readPacket(address,count));return await response;}
  catch(e){this.fault=e instanceof Error?e:Error('Serial read failed.');throw this.fault;}
  finally{clearTimeout(timer!);this.pending=null;}
 }
 async feedback(){const reading=decodeReading(await this.read(56,8));this.lastRead=performance.now();return reading;}
 private check(reading:RigReading){
  if(reading.steps<RIG.open-3||reading.steps>RIG.closed+3)throw Error('Position is outside the eyelid calibration. Reposition with TTL Servo Studio before enabling.');
  if(reading.voltage<4.8||reading.voltage>6.5||reading.temperature>=60)throw Error('Servo supply or temperature is outside the rig limits.');
 }
 async enable(reading:RigReading){
  this.check(reading);if(this.fault)throw this.fault;
  const gen=++this.generation;this.lastStep=Math.max(RIG.open,Math.min(RIG.closed,reading.steps));
  // Replace any old target BEFORE enabling torque, avoiding a jump on enable.
  await this.write(movePacket(this.lastStep));if(gen!==this.generation)return false;
  await this.write(torquePacket(true));if(gen!==this.generation){await this.write(torquePacket(false));return false;}
  const torque=await this.read(40,1);if(torque[0]!==1)throw Error('Servo did not enable torque.');
  if(gen!==this.generation){await this.write(torquePacket(false));return false;}
  this.armed=true;this.lastMove=performance.now();return true;
 }
 async follow(percent:number,reading:RigReading){
  if(!this.armed)return;this.check(reading);
  const now=performance.now();if(this.fault||now-this.lastRead>600)throw Error('Servo feedback is stale. Reconnect before enabling.');
  const target=lidsToSteps(percent),maxStep=Math.max(1,Math.floor(RIG.speed*Math.min(.1,(now-this.lastMove)/1000)));
  const next=this.lastStep+Math.sign(target-this.lastStep)*Math.min(Math.abs(target-this.lastStep),maxStep);
  this.lastMove=now;if(next!==this.lastStep){await this.write(movePacket(next));this.lastStep=next;}
 }
 async stop(){this.armed=false;++this.generation;await this.write(torquePacket(false));}
 async close(){
  if(this.closed)return;
  try{if(this.armed)await this.stop();}finally{
   this.closed=true;++this.generation;this.pending?.reject(Error('Disconnected.'));
   await this.reader?.cancel().catch(()=>{});await this.readerTask;
   this.reader?.releaseLock();this.reader=null;this.writer?.releaseLock();this.writer=null;
   await this.port.close();
  }
 }
}
