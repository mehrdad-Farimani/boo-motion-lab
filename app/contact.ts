import * as THREE from 'three';
import {PLAY} from './metrics.ts';
export type ContactPoint={x:number;y:number;z:number;rear:boolean};
// Sample real CAD surfaces, avoiding rotated bounding-box corners that do not
// belong to the plush. Cache local samples; only transforms change per pose.
const samples=new WeakMap<THREE.BufferGeometry,THREE.Vector3[]>();
export function contactPoints(meshes:THREE.Mesh[],rig:THREE.Object3D):ContactPoint[]{
 const inverse=rig.matrixWorld.clone().invert(),points:ContactPoint[]=[];
 for(const mesh of meshes){let local=samples.get(mesh.geometry);if(!local){local=[];const position=mesh.geometry.getAttribute('position');const stride=Math.max(1,Math.floor(position.count/120));const extrema=Array.from({length:6},()=>({value:-Infinity,index:0}));for(let i=0;i<position.count;i++){for(let axis=0;axis<3;axis++){const value=position.getComponent(i,axis);for(let sign=0;sign<2;sign++){const v=value*(sign?1:-1),e=extrema[axis*2+sign];if(v>e.value){e.value=v;e.index=i;}}}if(i%stride===0)local.push(new THREE.Vector3().fromBufferAttribute(position,i));}extrema.forEach(e=>local!.push(new THREE.Vector3().fromBufferAttribute(position,e.index)));samples.set(mesh.geometry,local);}
  const transform=inverse.clone().multiply(mesh.matrixWorld);for(const point of local){const p=point.clone().applyMatrix4(transform);points.push({x:p.x,y:p.y,z:p.z,rear:mesh.userData.part==='main_body'||String(mesh.userData.part).startsWith('leg_')});}
 }
 return points;
}
export function surfaceAt(x:number,z:number){let y=Math.hypot(x,z)<=PLAY.rugRadius?PLAY.rugTop:0;if(Math.abs(x)<=PLAY.tableWidth/2&&Math.abs(z-PLAY.tableZ)<=PLAY.tableDepth/2)y=Math.max(y,PLAY.tableHeight);return y;}
export function bellyContact(points:ContactPoint[],x:number,z:number,yaw:number){
 const yawRad=yaw*Math.PI/180,cy=Math.cos(yawRad),sy=Math.sin(yawRad);
 function evaluate(pitch:number){const a=pitch*Math.PI/180,c=Math.cos(a),s=Math.sin(a);let rearHeight=-Infinity,allHeight=-Infinity;
  for(const p of points){const py=p.y*c-p.z*s,pz=p.y*s+p.z*c;const height=surfaceAt(x+p.x*cy+pz*sy,z-p.x*sy+pz*cy)-py;allHeight=Math.max(allHeight,height);if(p.rear)rearHeight=Math.max(rearHeight,height);}
  return {pitch,height:rearHeight,penetration:Math.max(0,allHeight-rearHeight)};
 }
 const rest=evaluate(0);if(!Number.isFinite(rest.height))return {pitch:0,height:0,penetration:0};if(rest.penetration<=.001)return rest;
 // Find the smallest chest-up rotation that clears the ground while retaining
 // contact beneath the rear. This is a quasi-static support approximation.
 let best=rest;
 for(let angle=-2;angle>=-65;angle-=2){const candidate=evaluate(angle);if(candidate.penetration<best.penetration)best=candidate;if(candidate.penetration<=.001){let low=angle,high=angle+2;for(let i=0;i<7;i++){const mid=(low+high)/2;if(evaluate(mid).penetration<=.001)low=mid;else high=mid;}return evaluate(low);}}
 return best;
}
