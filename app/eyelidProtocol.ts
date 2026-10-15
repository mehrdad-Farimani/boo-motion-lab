// Feetech SCSCL: https://ftservo.github.io/ftservo-wiki/reference/parameter/memory-scscl/
// SCS0009 uses big-endian 10-bit positions. Calibration matches TTL Servo Studio.
export const RIG={id:2,baud:1000000,open:511,closed:955,speed:100} as const;
export function lidsToSteps(percent:number){
 if(!Number.isFinite(percent))throw Error('Invalid eyelid command.');
 return Math.round(RIG.open+(RIG.closed-RIG.open)*Math.max(0,Math.min(100,percent))/100);
}
export const stepsToDegrees=(steps:number)=>steps*300/1023;
export const stepsToLids=(steps:number)=>Math.max(0,Math.min(100,(steps-RIG.open)*100/(RIG.closed-RIG.open)));
export function packet(id:number,instruction:number,params:number[]=[]){
 const body=[id,params.length+2,instruction,...params];
 return Uint8Array.from([255,255,...body,(~body.reduce((a,b)=>a+b,0))&255]);
}
export const readPacket=(address:number,length:number)=>packet(RIG.id,2,[address,length]);
// SYNC_WRITE targets ONLY the listed ID. No write acknowledgement is generated.
export const torquePacket=(on:boolean)=>packet(254,0x83,[40,1,RIG.id,on?1:0]);
export function movePacket(steps:number){
 if(!Number.isInteger(steps)||steps<RIG.open||steps>RIG.closed)throw Error('Position outside the calibrated eyelid range.');
 return packet(254,0x83,[42,6,RIG.id,steps>>8,steps&255,0,0,0,RIG.speed]);
}
export type Reply={id:number;error:number;data:Uint8Array};
export class ReplyParser{
 private bytes:number[]=[];
 push(chunk:Uint8Array):Reply[]{
  this.bytes.push(...chunk);const replies:Reply[]=[];
  while(this.bytes.length>=4){
   if(this.bytes[0]!==255||this.bytes[1]!==255){this.bytes.shift();continue;}
   const length=this.bytes[3];if(length<2||length>64){this.bytes.shift();continue;}
   if(this.bytes.length<length+4)break;
   const p=this.bytes.slice(0,length+4);
   if((p.slice(2).reduce((a,b)=>a+b,0)&255)!==255){this.bytes.shift();continue;}
   this.bytes.splice(0,p.length);replies.push({id:p[2],error:p[4],data:Uint8Array.from(p.slice(5,-1))});
  }
  if(this.bytes.length>128)this.bytes=[];
  return replies;
 }
}
export type RigReading={steps:number;degrees:number;voltage:number;temperature:number};
export function decodeReading(bytes:Uint8Array):RigReading{
 if(bytes.length!==8)throw Error('Incomplete servo feedback.');
 const steps=(bytes[0]<<8)|bytes[1];if(steps>1023)throw Error('Unexpected servo position format.');
 return {steps,degrees:stepsToDegrees(steps),voltage:bytes[6]/10,temperature:bytes[7]};
}
