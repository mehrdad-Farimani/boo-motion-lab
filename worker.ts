import handler from 'vinext/server/fetch-handler';
import {accessGate} from './server/access';
export default {
 async fetch(request:Request,env:Record<string,unknown>,ctx:ExecutionContext){
  const denied=await accessGate(request,typeof env.BOO_SITE_PASSWORD==='string'?env.BOO_SITE_PASSWORD:undefined);
  if(denied)return denied;
  const assets=env.ASSETS as {fetch(request:Request):Promise<Response>}|undefined;
  const asset=(request.method==='GET'||request.method==='HEAD')&&assets?await assets.fetch(request):null;
  const response=asset&&asset.status!==404?asset:await handler.fetch(request,env,ctx);
  const protectedResponse=new Response(response.body,response);
  protectedResponse.headers.set('Cache-Control','private, no-store');
  return protectedResponse;
 }
};
