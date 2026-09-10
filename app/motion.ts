export type Pose = { left: number; right: number; tilt: number; turn: number; lids: number };
export const REST: Pose = { left: 0, right: 0, tilt: 0, turn: 0, lids: 100 };
export const JOINTS = [
 {key:'left',label:'Left hand',min:0,max:150,unit:'°'},
 {key:'right',label:'Right hand',min:0,max:150,unit:'°'},
 {key:'tilt',label:'Neck · tilt',min:-25,max:50,unit:'°'},
 {key:'turn',label:'Neck · turn',min:-43,max:46,unit:'°'},
 {key:'lids',label:'Eyelids · closed',min:0,max:100,unit:'%'},
] as const;
export type Frame = {pose:Pose; duration:number};
export function blend(a:Pose,b:Pose,t:number):Pose { const k=t*t*(3-2*t); return Object.fromEntries(Object.keys(a).map(j=>[j,a[j as keyof Pose]+(b[j as keyof Pose]-a[j as keyof Pose])*k])) as Pose; }
export function sample(frames:Frame[],time:number):Pose {let start=0;for(let i=0;i<frames.length-1;i++){const duration=frames[i].duration;if(time<start+duration)return blend(frames[i].pose,frames[i+1].pose,(time-start)/duration);start+=duration;}return {...frames[frames.length-1].pose};}
export const PRESETS:Record<string,Frame[]> = {
 'Wake up':[{pose:REST,duration:2},{pose:{...REST,lids:35,tilt:15},duration:1.4},{pose:{...REST,lids:0,tilt:-8,left:42,right:42},duration:1.8},{pose:{...REST,lids:15,tilt:5},duration:1}],
 'Sleepy wave':[{pose:REST,duration:1.5},{pose:{...REST,tilt:12,lids:48,right:90},duration:.6},{pose:{...REST,tilt:10,lids:38,right:62},duration:.6},{pose:{...REST,tilt:10,lids:38,right:105},duration:.6},{pose:{...REST,tilt:10,lids:45,right:62},duration:.6},{pose:{...REST,tilt:10,lids:45,right:100},duration:1.8},{pose:REST,duration:1}],
 'Look around':[{pose:REST,duration:1.4},{pose:{...REST,lids:15,tilt:0,turn:-40},duration:2.5},{pose:{...REST,lids:15,tilt:0,turn:40},duration:2},{pose:REST,duration:1}],
 'Doze off':[{pose:{...REST,tilt:0,lids:20},duration:2},{pose:{...REST,tilt:23,lids:75},duration:.7},{pose:{...REST,tilt:12,lids:45},duration:2.8},{pose:{...REST,tilt:40,lids:100},duration:1}]
};
export function validPose(p:unknown):p is Pose {return !!p && typeof p==='object' && JOINTS.every(j=>{const v=(p as Pose)[j.key];return typeof v==='number'&&Number.isFinite(v)&&v>=j.min&&v<=j.max;});}
