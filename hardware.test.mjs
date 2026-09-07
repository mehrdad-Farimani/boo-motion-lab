import assert from 'node:assert/strict';
import * as THREE from 'three';
import {INITIAL_HARDWARE,initialServos,stepServo,radarState,accelerometer,gyroRate,motorAngle,jointAngle} from './app/hardware.ts';
const h=structuredClone(INITIAL_HARDWARE),origin=new THREE.Vector3(0,1,0),q=new THREE.Quaternion();
h.human.z=6;assert.equal(radarState(h,origin,q).detected,true);
h.human.z=6.01;assert.equal(radarState(h,origin,q).detected,false);
h.human.z=-3;assert.equal(radarState(h,origin,q).state,'Outside field of view');
h.human.z=3;h.human.moving=false;assert.equal(radarState(h,origin,q).movingDistance,null);h.human.moving=true;assert.equal(radarState(h,origin,q).movingDistance,3);
h.human.enabled=false;assert.equal(radarState(h,origin,q).detected,false);h.human.enabled=true;h.radarEnabled=false;assert.equal(radarState(h,origin,q).state,'Disabled');
assert.deepEqual(accelerometer(new THREE.Vector3(),q).toArray(),[0,9.81,0]);
assert.equal(accelerometer(new THREE.Vector3(0,-9.81,0),q).length(),0);
const turned=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI/2);assert.ok(Math.abs(gyroRate(q,turned,1).y-90)<1e-8);
let s=initialServos()[0];const off=stepServo(s,100,{enabled:false,blocked:false},120,6,.1);assert.equal(off.angle,s.angle);
s=stepServo(s,100,{enabled:true,blocked:false},120,6,.1);assert.equal(s.speed,120);assert.equal(s.angle,170);
for(let i=0;i<21;i++)s=stepServo(s,115,{enabled:true,blocked:true},120,6,.1);assert.equal(s.status,'Protection');assert.equal(s.speed,0);
s=stepServo(s,115,{enabled:false,blocked:false},120,6,.1);assert.equal(s.fault,false);s=stepServo(s,115,{enabled:true,blocked:false},120,6,.1);assert.equal(s.status,'Moving');
assert.ok(Math.abs(jointAngle('lids',motorAngle('lids',88))-88)<1e-8);
console.log('Passed: radar range/FOV/disabled/presence-vs-moving, IMU rest/freefall/gyro, servo rate/torque-off/block protection/recovery.');

