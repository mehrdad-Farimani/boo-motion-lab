import manifest from './protected-manifest.js';
let cachedSecret,cachedKey;
export async function protectedAsset(request,env){
 if(!['GET','HEAD'].includes(request.method))return null;
 const url=new URL(request.url);let path;try{path=decodeURIComponent(url.pathname);}catch{return new Response('Invalid path',{status:400});}
 const entry=manifest[path==='/'?'/index.html':path];if(!entry)return null;
 if(!env.BOO_ASSET_KEY)return new Response('Site access is being configured.',{status:503});
 try{
 if(cachedSecret!==env.BOO_ASSET_KEY){cachedKey=await crypto.subtle.importKey('raw',Uint8Array.from(atob(env.BOO_ASSET_KEY),c=>c.charCodeAt(0)),'AES-GCM',false,['decrypt']);cachedSecret=env.BOO_ASSET_KEY;}
 url.pathname=entry.target;url.search='';
 const response=await env.ASSETS.fetch(new Request(url,{method:'GET'}));if(!response.ok)return new Response('Asset unavailable',{status:502});
 const bytes=new Uint8Array(await response.arrayBuffer());const data=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(0,12)},cachedKey,bytes.slice(12));
 return new Response(request.method==='HEAD'?null:data,{headers:{'Content-Type':entry.type,'Content-Length':String(data.byteLength),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }catch{return new Response('Asset unavailable',{status:503,headers:{'Cache-Control':'no-store'}});}
}
