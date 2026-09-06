'use client';
import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import type {Pose} from './motion';
export type World={targetX:number;targetY:number;ballX:number;ballZ:number;reset:number;camera:number;paused:boolean};
export default function Scene({pose,world,onContact}:{pose:Pose;world:World;onContact:(s:string)=>void}){
 const host=useRef<HTMLDivElement>(null),live=useRef({pose,world,onContact});live.current={pose,world,onContact};const [error,setError]=useState('');
 useEffect(()=>{if(!host.current)return;let renderer:THREE.WebGLRenderer;try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});}catch{setError('3D is unavailable. Enable hardware acceleration or try another browser.');return;}
 const el=host.current;renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setClearColor('#e6edf1');el.appendChild(renderer.domElement);
 const scene=new THREE.Scene();scene.fog=new THREE.Fog('#e6edf1',10,23);const camera=new THREE.PerspectiveCamera(38,1,.1,50);camera.position.set(4.3,3.2,6.8);const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,1.15,0);orbit.enableDamping=true;orbit.minDistance=3;orbit.maxDistance=11;orbit.maxPolarAngle=Math.PI*.49;
 scene.add(new THREE.HemisphereLight(0xffffff,0x74839a,2.6));const light=new THREE.DirectionalLight(0xfff6e4,4);light.position.set(-3,7,4);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-6,right:6,top:6,bottom:-6});scene.add(light);
 const mat=(c:string)=>new THREE.MeshStandardMaterial({color:c,roughness:.95});const fur=mat('#92705c'),cream=mat('#e8d8be'),mask=mat('#514339'),black=mat('#231f22'),claw=mat('#e8dfcb'),blue=mat('#365d81');
 function ell(parent:THREE.Object3D,m:THREE.Material,x:number,y:number,z:number,sx:number,sy:number,sz:number){const o=new THREE.Mesh(new THREE.SphereGeometry(1,40,28),m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),mat('#dce5ea'));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);const grid=new THREE.GridHelper(10,20,0x9aacb8,0xc4d0d8);grid.position.y=.006;scene.add(grid);
 const rug=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.4,.05,80),blue);rug.position.y=.03;rug.receiveShadow=true;scene.add(rug);
 const boo=new THREE.Group();scene.add(boo);ell(boo,fur,0,.9,0,.56,.76,.43);ell(boo,cream,0,.94,.29,.41,.54,.19);
 // Feet are fixed plush geometry; the model has exactly five actuated channels.
 for(const s of [-1,1]){ell(boo,fur,s*.34,.22,.25,.26,.22,.37);for(let i=0;i<3;i++)ell(boo,claw,s*.34+(i-1)*.095,.2,.57,.035,.045,.12);}
 const head=new THREE.Group();head.position.set(0,1.63,0);boo.add(head);ell(head,fur,0,.31,0,.62,.55,.48);ell(head,cream,0,.31,.32,.54,.43,.22);
 const eyes:THREE.Mesh[]=[];for(const s of [-1,1]){const patch=ell(head,mask,s*.27,.32,.485,.23,.145,.07);patch.rotation.z=s*.25;const eye=ell(head,black,s*.25,.34,.549,.065,.07,.025);eyes.push(eye);ell(head,fur,s*.52,.35,-.02,.16,.19,.15);}
 ell(head,black,0,.21,.55,.105,.065,.065);const smile=new THREE.Mesh(new THREE.TorusGeometry(.12,.012,8,28,Math.PI),black);smile.rotation.z=Math.PI;smile.position.set(0,.14,.547);head.add(smile);
 // Fine surface tufts suggest plush pile without adding extra articulation.
 const tuftGeo=new THREE.SphereGeometry(1,5,4);const tuft=new THREE.InstancedMesh(tuftGeo,fur,550);let seed=73;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};const dummy=new THREE.Object3D();for(let i=0;i<550;i++){const a=rand()*Math.PI*2,b=Math.acos(2*rand()-1);dummy.position.set(.565*Math.sin(b)*Math.cos(a),.9+.765*Math.cos(b),.435*Math.sin(b)*Math.sin(a));dummy.scale.set(.018,.035,.018);dummy.rotation.set(rand(),rand(),rand());dummy.updateMatrix();tuft.setMatrixAt(i,dummy.matrix);}boo.add(tuft);
 const arms:THREE.Group[]=[],hands:THREE.Mesh[]=[];for(const s of [1,-1]){const arm=new THREE.Group();arm.position.set(s*.5,1.34,0);boo.add(arm);ell(arm,fur,s*.07,-.35,.015,.19,.49,.2);const hand=ell(arm,fur,s*.07,-.76,.07,.2,.19,.22);for(let i=0;i<3;i++)ell(arm,claw,s*.07+(i-1)*.09,-.84,.22,.032,.105,.04);arms.push(arm);hands.push(hand);}
 const table=new THREE.Mesh(new THREE.BoxGeometry(1.9,.45,.8),mat('#b5c5d1'));table.position.set(0,.225,.95);table.castShadow=true;table.receiveShadow=true;scene.add(table);
 const ball=ell(scene,mat('#d56e46'),1,.63,.8,.18,.18,.18);const stripe=new THREE.Mesh(new THREE.TorusGeometry(.181,.012,8,40),cream);ball.add(stripe);stripe.scale.setScalar(1/.18);
 const target=ell(scene,mat('#d5a438'),0,1.8,2,.065,.065,.065);const ring=new THREE.Mesh(new THREE.TorusGeometry(.13,.012,8,40),mat('#b38726'));target.add(ring);ring.scale.setScalar(1/.065);
 // Low room boundaries contain the ball, while the plush stays seated.
 for(const x of [-2.8,2.8]){const wall=new THREE.Mesh(new THREE.BoxGeometry(.08,.13,5.6),mat('#a9b8c3'));wall.position.set(x,.065,0);scene.add(wall);}for(const z of [-2.8,2.8]){const wall=new THREE.Mesh(new THREE.BoxGeometry(5.6,.13,.08),mat('#a9b8c3'));wall.position.set(0,.065,z);scene.add(wall);}
 let frame=0,last=performance.now(),lastReset=-1,lastCamera=-1,px=NaN,pz=NaN,lastContact=0;const vel=new THREE.Vector3(),previous=[new THREE.Vector3(),new THREE.Vector3()];let initialized=false;
 const resize=()=>{camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight);};const observer=new ResizeObserver(resize);observer.observe(el);resize();
 function tick(now:number){const dt=Math.min((now-last)/1000,.04);last=now;const {pose:p,world:w}=live.current;
 head.rotation.set(THREE.MathUtils.degToRad(p.tilt),THREE.MathUtils.degToRad(p.turn),0,'YXZ');arms[0].rotation.x=-THREE.MathUtils.degToRad(p.left);arms[1].rotation.x=-THREE.MathUtils.degToRad(p.right);eyes.forEach(e=>{e.scale.y=.07*Math.max(.045,1-p.lids/100);});target.position.set(w.targetX,w.targetY,2);
 if(w.reset!==lastReset||w.ballX!==px||w.ballZ!==pz){ball.position.set(w.ballX,.63,w.ballZ);vel.set(0,0,0);lastReset=w.reset;px=w.ballX;pz=w.ballZ;initialized=false;}
 if(w.camera!==lastCamera){camera.position.set(4.3,3.2,6.8);orbit.target.set(0,1.15,0);lastCamera=w.camera;}
 scene.updateMatrixWorld(true);hands.forEach((h,i)=>{const hp=h.getWorldPosition(new THREE.Vector3());if(!w.paused){const delta=ball.position.clone().sub(hp),distance=delta.length(),radius=.37;if(distance<radius){if(distance<.001)delta.set(0,0,1);else delta.normalize();ball.position.copy(hp).addScaledVector(delta,radius);const speed=initialized?Math.min(hp.distanceTo(previous[i])/Math.max(dt,.001),3):0;vel.addScaledVector(delta,.4+speed*1.2);if(now-lastContact>550){live.current.onContact(i===0?'Left hand nudged the ball':'Right hand nudged the ball');lastContact=now;}}}previous[i].copy(hp);});initialized=true;
 if(!w.paused){const oldY=ball.position.y;vel.y-=9.81*dt;ball.position.addScaledVector(vel,dt);const surface=Math.abs(ball.position.x)<.95&&ball.position.z>.55&&ball.position.z<1.35&&oldY>=.625?.63:.18;if(ball.position.y<surface){ball.position.y=surface;vel.y=Math.abs(vel.y)<.15?0:-vel.y*.42;vel.x*=Math.exp(-1.5*dt);vel.z*=Math.exp(-1.5*dt);}for(const axis of ['x','z'] as const){if(Math.abs(ball.position[axis])>2.57){ball.position[axis]=Math.sign(ball.position[axis])*2.57;vel[axis]*=-.6;}}ball.rotation.x+=vel.z*dt/.18;ball.rotation.z-=vel.x*dt/.18;}
 orbit.update();renderer.render(scene,camera);frame=requestAnimationFrame(tick);}
 frame=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(frame);observer.disconnect();orbit.dispose();scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose());}});renderer.dispose();el.removeChild(renderer.domElement);};
 },[]);
 return <div ref={host} className="scene" aria-label="Interactive 3D model of Boo, a five-joint plush sloth">{error&&<p className="error">{error}</p>}</div>;
}
