const COOKIE='__Host-boo_session';
const enc=new TextEncoder();
const headers={'Cache-Control':'no-store','Content-Type':'text/html; charset=utf-8','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'"};
async function key(password:string){return crypto.subtle.importKey('raw',enc.encode(password),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
async function sign(value:string,password:string){return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',await key(password),enc.encode(value))),b=>b.toString(16).padStart(2,'0')).join('');}
function page(error=false){return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Boo Motion Lab</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f1ede6;color:#323c3a;font:16px system-ui}main{background:white;border-radius:24px;padding:36px;width:min(340px,75vw);box-shadow:0 12px 50px #283e3312}h1{margin-top:0}p{line-height:1.5;color:#65716b}label{display:block;margin-bottom:8px}input,button{box-sizing:border-box;width:100%;padding:13px;border-radius:10px;font:inherit}input{border:1px solid #adb7b1}button{margin-top:16px;background:#3c6359;color:white;border:0;cursor:pointer}.error{color:#a43535}</style><main><h1>Boo Motion Lab</h1><p>A little world for Boo. Enter the shared password to open the simulation.</p><form method="post" action="/boo-login"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="256" autofocus>${error?'<p class="error" role="alert">That password is incorrect. Please try again.</p>':''}<button>Open simulation</button></form></main></html>`,{status:error?401:200,headers});}
/** Runs before application routes and assets. Missing secrets fail closed. */
export async function accessGate(request:Request,password:string|undefined):Promise<Response|null>{
 if(!password)return new Response('Site access is being configured. Please try again shortly.',{status:503,headers});
 const url=new URL(request.url);
 if(url.pathname==='/boo-login'&&request.method==='POST'){
  if(request.headers.get('Origin')!==url.origin)return new Response('Invalid origin',{status:403,headers});
  const body=await request.text();if(body.length>2048)return new Response('Request too large',{status:413,headers});
  const supplied=new URLSearchParams(body).get('password')??'';
  // Verify a fixed-length signature instead of comparing passwords directly.
  const signature=await sign('boo-password-check',supplied||'invalid');
  const valid=await crypto.subtle.verify('HMAC',await key(password),Uint8Array.from(signature.match(/../g)!,x=>parseInt(x,16)),enc.encode('boo-password-check'));
  if(!valid)return page(true);
  const expires=String(Math.floor(Date.now()/1000)+7*86400);
  return new Response(null,{status:303,headers:{Location:'/', 'Cache-Control':'no-store','Set-Cookie':`${COOKIE}=${expires}.${await sign(expires,password)}; Path=/; Max-Age=604800; HttpOnly; Secure; SameSite=Strict`}});
 }
 const cookie=request.headers.get('Cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
 const match=cookie?.match(/^(\d{10})\.([a-f0-9]{64})$/);
 if(match&&Number(match[1])>Date.now()/1000&&Number(match[1])<=Date.now()/1000+604801){
  if(await crypto.subtle.verify('HMAC',await key(password),Uint8Array.from(match[2].match(/../g)!,x=>parseInt(x,16)),enc.encode(match[1])))return null;
 }
 return page();
}
