'use client';
import {useEffect,useState} from 'react';
import {LIBRARY_KEY,addMovement,readLibrary,type SavedMovement} from './movementLibrary';
import type {Frame} from './motion';
export function useMovementLibrary(){
 const [movements,setMovements]=useState<SavedMovement[]>([]),[ready,setReady]=useState(false),[error,setError]=useState('');
 useEffect(()=>{try{setMovements(readLibrary(localStorage.getItem(LIBRARY_KEY)));setReady(true);}catch{setError('Saved movements could not be loaded. Browser storage may be unavailable. You can still export your sequence.');}},[]);
 function saveMovement(name:string,frames:Frame[]){
  try{
   if(!ready)throw Error('Browser storage is unavailable. Export your sequence to keep it.');
   // Re-read before saving so another tab’s saved movements are preserved.
   const next=addMovement(readLibrary(localStorage.getItem(LIBRARY_KEY)),name,frames);
   localStorage.setItem(LIBRARY_KEY,JSON.stringify(next));setMovements(next);setError('');return true;
  }catch(e){setError(e instanceof Error?e.message:'Could not save this movement. Export it to keep a copy.');return false;}
 }
 return {movements,ready,error,saveMovement};
}
