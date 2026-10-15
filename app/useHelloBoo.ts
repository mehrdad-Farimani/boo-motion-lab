'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {HelloBooListener,type ListenerState} from './helloBoo';
import {LocalRecognizer} from './localSpeech';

export function useHelloBoo(binding:string,onHello:(transcript:string)=>void,onStart:()=>void){
 const [supported,setSupported]=useState<boolean|null>(null);
 const [state,setState]=useState<ListenerState>({active:false,status:'Microphone off'});
 const [transcript,setTranscript]=useState('');
 const [level,setLevel]=useState(0);
 const listener=useRef<HelloBooListener|null>(null),latest=useRef({onHello,onStart});
 useLayoutEffect(()=>{latest.current={onHello,onStart};});
 useEffect(()=>{
  const available=!!navigator.mediaDevices?.getUserMedia&&typeof AudioWorkletNode!=='undefined';setSupported(available);
  if(!available)return;
  const session=new HelloBooListener(()=>new LocalRecognizer(setLevel),setState,(phrase,matched)=>{
   setTranscript(phrase);if(matched)latest.current.onHello(phrase);
  });
  listener.current=session;
  const visibility=()=>{if(document.hidden)session.stop('Microphone off · page hidden');};
  document.addEventListener('visibilitychange',visibility);
  return()=>{listener.current=null;session.stop();document.removeEventListener('visibilitychange',visibility);};
 },[]);
 useLayoutEffect(()=>{listener.current?.stop('Microphone off');setTranscript('');},[binding]);
 return {...state,supported,transcript,level,
  start:()=>{latest.current.onStart();setTranscript('');listener.current?.start();},
  stop:(message?:string)=>listener.current?.stop(message)};
}
