import * as THREE from 'three';

/** Lightweight room scenery; the central play area stays clear. */
export function addRoom(scene:THREE.Scene){
 const room=new THREE.Group();room.name='Open living room';scene.add(room);
 const fabric=new THREE.MeshStandardMaterial({color:'#76949b',roughness:1});
 const cushion=new THREE.MeshStandardMaterial({color:'#a8bcc0',roughness:1});
 const wood=new THREE.MeshStandardMaterial({color:'#bd936c',roughness:.85});
 const cream=new THREE.MeshStandardMaterial({color:'#efe7d6',roughness:1});
 const dark=new THREE.MeshStandardMaterial({color:'#494b48',roughness:.65});
 function box(parent:THREE.Object3D,material:THREE.Material,x:number,y:number,z:number,w:number,h:number,d:number){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 }
 function cylinder(parent:THREE.Object3D,material:THREE.Material,x:number,y:number,z:number,top:number,bottom:number,height:number){
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(top,bottom,height,24),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 }
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(6,5),new THREE.MeshStandardMaterial({color:'#d8bea0',roughness:.95}));floor.rotation.x=-Math.PI/2;floor.position.set(0,.0002,-.35);floor.receiveShadow=true;room.add(floor);
 const lines:THREE.Vector3[]=[];
 for(let x=-3;x<=3;x+=.3)lines.push(new THREE.Vector3(x,.0004,-2.85),new THREE.Vector3(x,.0004,2.15));
 for(let i=0;i<20;i++){const x=-3+i*.3;for(let z=-2.85+(i%3)*.6;z<2.15;z+=1.8)lines.push(new THREE.Vector3(x,.0004,z),new THREE.Vector3(x+.3,.0004,z));}
 room.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(lines),new THREE.LineBasicMaterial({color:'#c7ac8d',transparent:true,opacity:.55})));
 const sofa=new THREE.Group();sofa.position.set(-.2,0,-1.85);room.add(sofa);
 for(const x of [-.85,.85])for(const z of [-.3,.3])box(sofa,wood,x,.1,z,.07,.2,.07);
 box(sofa,fabric,0,.3,0,2,.32,.82);box(sofa,fabric,0,.67,-.34,2,.5,.18);
 for(const x of [-.94,.94])box(sofa,fabric,x,.51,0,.18,.42,.86);
 for(const x of [-.43,.43])box(sofa,cushion,x,.49,.06,.82,.12,.62);
 const pillow=box(sofa,cream,-.62,.69,-.13,.3,.32,.12);pillow.rotation.z=.15;
 const chair=new THREE.Group();chair.position.set(-1.95,0,-.2);chair.rotation.y=.55;room.add(chair);
 for(const x of [-.27,.27])for(const z of [-.25,.25])box(chair,wood,x,.19,z,.05,.38,.05);
 box(chair,cream,0,.44,0,.73,.18,.7);box(chair,cream,0,.75,-.27,.73,.5,.16);
 for(const x of [-.35,.35])box(chair,wood,x,.57,0,.07,.1,.72);
 // Side table and two books, away from the robot's play mat.
 cylinder(room,wood,1.5,.47,-1.25,.34,.34,.05);
 for(const x of [1.28,1.72])for(const z of [-1.46,-1.04])box(room,dark,x,.23,z,.035,.46,.035);
 box(room,cream,1.5,.515,-1.25,.24,.035,.18);box(room,fabric,1.53,.55,-1.24,.21,.03,.16);
 // A floor lamp and one plant finish the room without clutter.
 cylinder(room,dark,2.15,.025,-1.8,.18,.18,.05);cylinder(room,dark,2.15,.76,-1.8,.016,.016,1.5);
 cylinder(room,cream,2.15,1.55,-1.8,.18,.29,.32);
 cylinder(room,wood,-2.2,.18,-1.9,.19,.14,.36);
 const leafMaterial=new THREE.MeshStandardMaterial({color:'#547665',roughness:1});
 const leafGeometry=new THREE.SphereGeometry(1,12,8);
 for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const leaf=new THREE.Mesh(leafGeometry,leafMaterial);leaf.position.set(-2.2+Math.sin(a)*.15,.48+(i%3)*.12,-1.9+Math.cos(a)*.15);leaf.scale.set(.1,.24,.065);leaf.rotation.z=Math.sin(a)*.5;leaf.castShadow=true;room.add(leaf);}
 return room;
}
