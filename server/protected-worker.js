import application from './application.js';
import {accessGate} from './access.js';
import {protectedAsset} from './protected-assets.js';
export default {async fetch(request,env,ctx){
 const denied=await accessGate(request,env.BOO_SITE_PASSWORD);if(denied)return denied;
 const asset=await protectedAsset(request,env);if(asset)return asset;
 const response=await application.fetch(request,env,ctx);
 const result=new Response(response.body,response);result.headers.set('Cache-Control','private, no-store');return result;
}};
