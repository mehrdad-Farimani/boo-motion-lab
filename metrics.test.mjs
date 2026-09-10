import assert from 'node:assert/strict';
import * as THREE from 'three';
import {BOO_METRICS,GRAVITY,potentialEnergy,kineticEnergy} from './app/metrics.ts';
import {advanceDrop} from './app/body.ts';
import {INITIAL_HARDWARE,radarState} from './app/hardware.ts';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} ≈ ${b}`);
close(potentialEnergy(.12),1.7658);close(kineticEnergy(Math.sqrt(2*GRAVITY*.12)),potentialEnergy(.12));
let y=.12,v=0;
for(let i=0;i<4;i++){const step=advanceDrop(y,v,0,.02);y=step.y;v=step.v;close(potentialEnergy(y)+kineticEnergy(v),potentialEnergy(.12));}
close(BOO_METRICS.mass,1.5);close(INITIAL_HARDWARE.range,6);
const radar=radarState(INITIAL_HARDWARE,new THREE.Vector3(0,.15,.086),new THREE.Quaternion());assert.ok(radar.detected&&radar.distance>3&&radar.distance<3.1,'human target remains at real metre scale');
console.log('Passed: 1.5 kg drop energy conservation, real-scale human detection.');
