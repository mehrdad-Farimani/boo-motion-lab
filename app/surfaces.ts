import {PLAY} from './metrics.ts';

export type Surface={name:string;x:number;z:number;top:number;width:number;depth:number;yaw:number;round?:boolean};
export const SOFA={x:-.2,z:-1.85};
export const CHAIR={x:-1.95,z:-.2,yaw:.55};
export const SIDE_TABLE={x:1.5,z:-1.25,radius:.34,top:.495};
function chairTop(name:string,x:number,z:number,top:number,width:number,depth:number):Surface{
 const c=Math.cos(CHAIR.yaw),s=Math.sin(CHAIR.yaw);
 return {name,x:CHAIR.x+x*c+z*s,z:CHAIR.z-x*s+z*c,top,width,depth,yaw:CHAIR.yaw};
}
export const ROOM_SURFACES:Surface[]=[
 {name:'Sofa seat',x:SOFA.x,z:SOFA.z+.06,top:.55,width:1.68,depth:.62,yaw:0},
 {name:'Sofa back',x:SOFA.x,z:SOFA.z-.34,top:.92,width:2,depth:.18,yaw:0},
 ...[-.94,.94].map(x=>({name:'Sofa armrest',x:SOFA.x+x,z:SOFA.z,top:.72,width:.18,depth:.86,yaw:0})),
 chairTop('Chair seat',0,0,.53,.73,.7),
 chairTop('Chair back',0,-.27,1,.73,.16),
 ...[-.35,.35].map(x=>chairTop('Chair armrest',x,0,.62,.07,.72)),
 {name:'Side table',x:SIDE_TABLE.x,z:SIDE_TABLE.z,top:SIDE_TABLE.top,width:SIDE_TABLE.radius*2,depth:SIDE_TABLE.radius*2,yaw:0,round:true},
 {name:'Play table',x:0,z:PLAY.tableZ,top:PLAY.tableHeight,width:PLAY.tableWidth,depth:PLAY.tableDepth,yaw:0},
];
export function containsSurface(surface:Surface,x:number,z:number){
 const dx=x-surface.x,dz=z-surface.z,c=Math.cos(surface.yaw),s=Math.sin(surface.yaw);
 const lx=dx*c-dz*s,lz=dx*s+dz*c;
 return surface.round?Math.hypot(lx/(surface.width/2),lz/(surface.depth/2))<=1:Math.abs(lx)<=surface.width/2+1e-9&&Math.abs(lz)<=surface.depth/2+1e-9;
}
// Cache immutable transforms; contact sampling calls this many times per frame.
const surfaceFrames=ROOM_SURFACES.map(surface=>({surface,c:Math.cos(surface.yaw),s:Math.sin(surface.yaw)})).sort((a,b)=>b.surface.top-a.surface.top);
export function surfaceAt(x:number,z:number,ceiling=Infinity){
 const floor=Math.hypot(x,z)<=PLAY.rugRadius&&PLAY.rugTop<=ceiling?PLAY.rugTop:0;
 for(const {surface,c,s} of surfaceFrames){
  if(surface.top<=floor||surface.top>ceiling)continue;
  const dx=x-surface.x,dz=z-surface.z,hw=surface.width/2,hd=surface.depth/2;
  if(Math.abs(dx)>Math.abs(c)*hw+Math.abs(s)*hd||Math.abs(dz)>Math.abs(s)*hw+Math.abs(c)*hd)continue;
  const lx=dx*c-dz*s,lz=dx*s+dz*c;
  if(surface.round?Math.hypot(lx/hw,lz/hd)<=1:Math.abs(lx)<=hw+1e-9&&Math.abs(lz)<=hd+1e-9)return surface.top;
 }
 return floor;
}
export const PLACEMENTS=[
 {name:'Sofa',x:SOFA.x+.43,z:SOFA.z+.1,yaw:0},
 {name:'Chair',x:CHAIR.x,z:CHAIR.z,yaw:CHAIR.yaw*180/Math.PI},
 {name:'Side table',x:SIDE_TABLE.x,z:SIDE_TABLE.z,yaw:0},
 {name:'Rug',x:0,z:0,yaw:0},
];
