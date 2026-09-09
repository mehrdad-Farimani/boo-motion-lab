import * as THREE from 'three';
import {REST} from './motion.ts';
import {sphereExtents} from './body.ts';
import {BOO_METRICS} from './metrics.ts';
export function plushBounds(root:THREE.Object3D){root.updateMatrixWorld(true);const bounds=new THREE.Box3();root.traverse(o=>{if(o instanceof THREE.Mesh && !(o instanceof THREE.InstancedMesh) && o.geometry.type==='SphereGeometry' && !o.userData.sensorMarker){const e=sphereExtents(o.matrixWorld),c=o.getWorldPosition(new THREE.Vector3()),v=new THREE.Vector3(e.x,e.y,e.z);bounds.expandByPoint(c.clone().sub(v));bounds.expandByPoint(c.add(v));}});return bounds;}
export function buildBoo(){
 const mat=(c:string)=>new THREE.MeshStandardMaterial({color:c,roughness:.95});const fur=mat('#92705c'),cream=mat('#e8d8be'),mask=mat('#514339'),black=mat('#231f22'),claw=mat('#e8dfcb'),blue=mat('#365d81');
 function ell(parent:THREE.Object3D,m:THREE.Material,x:number,y:number,z:number,sx:number,sy:number,sz:number){const o=new THREE.Mesh(new THREE.SphereGeometry(1,40,28),m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 const boo=new THREE.Group();ell(boo,fur,0,.9,0,.56,.76,.43);ell(boo,cream,0,.94,.29,.41,.54,.19);
 // Feet are fixed plush geometry; the model has exactly five actuated channels.
 for(const s of [-1,1]){ell(boo,fur,s*.34,.22,.25,.26,.22,.37);for(let i=0;i<3;i++)ell(boo,claw,s*.34+(i-1)*.095,.2,.57,.035,.045,.12);}
 const head=new THREE.Group();head.position.set(0,1.63,0);boo.add(head);ell(head,fur,0,.31,0,.62,.55,.48);ell(head,cream,0,.31,.32,.54,.43,.22);
 const eyes:THREE.Mesh[]=[];for(const s of [-1,1]){const patch=ell(head,mask,s*.27,.32,.485,.23,.145,.07);patch.rotation.z=s*.25;const eye=ell(head,black,s*.25,.34,.549,.065,.07,.025);eyes.push(eye);ell(head,fur,s*.52,.35,-.02,.16,.19,.15);}
 ell(head,black,0,.21,.55,.105,.065,.065);const smile=new THREE.Mesh(new THREE.TorusGeometry(.12,.012,8,28,Math.PI),black);smile.rotation.z=Math.PI;smile.position.set(0,.14,.547);head.add(smile);
 // Fine surface tufts suggest plush pile without adding extra articulation.
 const tuftGeo=new THREE.SphereGeometry(1,5,4);const tuft=new THREE.InstancedMesh(tuftGeo,fur,550);let seed=73;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};const dummy=new THREE.Object3D();for(let i=0;i<550;i++){const a=rand()*Math.PI*2,b=Math.acos(2*rand()-1);dummy.position.set(.565*Math.sin(b)*Math.cos(a),.9+.765*Math.cos(b),.435*Math.sin(b)*Math.sin(a));dummy.scale.set(.018,.035,.018);dummy.rotation.set(rand(),rand(),rand());dummy.updateMatrix();tuft.setMatrixAt(i,dummy.matrix);}boo.add(tuft);
 const arms:THREE.Group[]=[],hands:THREE.Mesh[]=[];for(const s of [1,-1]){const arm=new THREE.Group();arm.position.set(s*.5,1.34,0);boo.add(arm);ell(arm,fur,s*.07,-.49,.015,.17,.63,.18);const hand=ell(arm,fur,s*.07,-1.04,.07,.19,.19,.21);for(let i=0;i<3;i++)ell(arm,claw,s*.07+(i-1)*.09,-1.12,.22,.032,.105,.04);arms.push(arm);hands.push(hand);}

 head.rotation.set(THREE.MathUtils.degToRad(REST.tilt),0,0,'YXZ');arms.forEach(a=>a.rotation.x=-THREE.MathUtils.degToRad(REST.left));
 const size=plushBounds(boo).getSize(new THREE.Vector3());boo.scale.set(BOO_METRICS.width/size.x,BOO_METRICS.height/size.y,BOO_METRICS.depth/size.z);boo.position.y=-1.1*boo.scale.y;
 return {boo,head,arms,hands,eyes};
}
