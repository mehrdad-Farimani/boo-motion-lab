'use client';
import {useEffect,useRef} from 'react';
import {validPose,PRESETS,type Pose} from './motion';
type Tool={name:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean};execute:(input:unknown)=>unknown};
type Context={registerTool:(tool:Tool,options:{signal:AbortSignal})=>void|Promise<void>};
export function useBooTools(pose:Pose,setPose:(p:Pose)=>void,play:(name:string)=>void){
 const current=useRef({pose,setPose,play});current.current={pose,setPose,play};
 useEffect(()=>{const context=(document as Document & {modelContext?:Context}).modelContext;if(!context?.registerTool)return;const lifecycle=new AbortController();
 const tools:Tool[]=[{name:'read_boo_pose',description:'Read Boo’s current five joint values.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({...current.current.pose})},
 {name:'set_boo_pose',description:'Set all five joints and stop movement playback and target tracking.',inputSchema:{type:'object',properties:{left:{type:'number',minimum:-25,maximum:115},right:{type:'number',minimum:-25,maximum:115},tilt:{type:'number',minimum:-25,maximum:50},turn:{type:'number',minimum:-65,maximum:65},lids:{type:'number',minimum:0,maximum:100}},required:['left','right','tilt','turn','lids'],additionalProperties:false},annotations:{readOnlyHint:false},execute:async input=>{if(!validPose(input))throw Error('Invalid pose or joint values outside supported ranges.');current.current.setPose({...input});await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));return {...current.current.pose};}},
 {name:'play_boo_movement',description:'Start a named built-in Boo movement.',inputSchema:{type:'object',properties:{name:{type:'string',enum:Object.keys(PRESETS)}},required:['name'],additionalProperties:false},annotations:{readOnlyHint:false},execute:async input=>{const name=(input as {name?:unknown})?.name;if(typeof name!=='string'||!Object.hasOwn(PRESETS,name))throw Error('Unknown movement.');current.current.play(name);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));return {playing:name};}}];
 tools.forEach(tool=>{try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}});return()=>lifecycle.abort();},[]);
}
