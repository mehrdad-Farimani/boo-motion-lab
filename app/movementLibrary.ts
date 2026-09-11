import {validPose,type Frame} from './motion.ts';
export type SavedMovement={name:string;frames:Frame[]};
export const LIBRARY_KEY='boo.movement-library.v1';
export function validMovement(value:unknown):value is SavedMovement{
 if(!value||typeof value!=='object')return false;
 const m=value as SavedMovement;
 return typeof m.name==='string'&&m.name.trim().length>0&&m.name.length<=60&&Array.isArray(m.frames)&&m.frames.length>=2&&m.frames.length<=100&&m.frames.every(f=>f&&validPose(f.pose)&&Number.isFinite(f.duration)&&f.duration>=.2&&f.duration<=10);
}
export function readLibrary(raw:string|null):SavedMovement[]{
 if(!raw)return [];
 const data:unknown=JSON.parse(raw);
 if(!Array.isArray(data)||data.length>100||!data.every(validMovement))throw Error('Invalid movement library');
 return data;
}
export function addMovement(library:SavedMovement[],name:string,frames:Frame[]):SavedMovement[]{
 const movement={name:name.trim(),frames:structuredClone(frames)};
 if(!validMovement(movement))throw Error('Enter a name and capture at least two valid poses.');
 if(library.some(m=>m.name.toLowerCase()===movement.name.toLowerCase()))throw Error('That name is already in your library. Choose a different name.');
 if(library.length>=100)throw Error('Your library is full (100 movements). Export the sequence to keep a copy.');
 return [...library,movement];
}
