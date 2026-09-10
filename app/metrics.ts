// All scene lengths are metres, masses kilograms, and time seconds.
export const BOO_METRICS={height:.223642110,width:.286912775,depth:.402594561,mass:1.5} as const;
export const GRAVITY=9.81;
export const PLAY={rugRadius:1.05,rugTop:.006,tableWidth:.30,tableDepth:.12,tableHeight:.055,tableZ:.32,ballRadius:.025,ballMass:.03,ballX:.092,ballZ:.267,targetZ:.45,targetY:.28,dragLift:.12} as const;
export const potentialEnergy=(height:number)=>BOO_METRICS.mass*GRAVITY*Math.max(0,height);
export const kineticEnergy=(speed:number)=>.5*BOO_METRICS.mass*speed*speed;
