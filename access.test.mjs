import {test} from 'node:test';
import assert from 'node:assert/strict';
import {accessGate} from './server/access.ts';
const origin='https://boo.example.com',secret='test-only-password';
test('login preserves same-origin form headers and accepts the known public hosts behind a proxy',async()=>{
 const page=await accessGate(new Request(origin),secret);
 assert.equal(page.headers.get('referrer-policy'),'same-origin');
 for(const site of ['https://boo.farimaniconsultant.com','https://boo-motion-lab.mehrdad655045.chatgpt.site']){
  const response=await accessGate(new Request('https://internal.example/boo-login',{method:'POST',headers:{Origin:site},body:new URLSearchParams({password:secret})}),secret);
  assert.equal(response.status,303);
 }
 for(const site of ['null','https://boo.farimaniconsultant.com.evil.example']){
  const response=await accessGate(new Request(origin+'/boo-login',{method:'POST',headers:{Origin:site},body:new URLSearchParams({password:secret})}),secret);
  assert.equal(response.status,403);
 }
});
test('password gate protects routes/assets and fails closed',async()=>{
 for(const path of ['/','/assets/model.glb','/?_rsc=1'])assert.match(await (await accessGate(new Request(origin+path),secret)).text(),/type="password"/);
 assert.equal((await accessGate(new Request(origin),undefined)).status,503);
});
test('valid password creates a protected session; invalid and forged credentials fail',async()=>{
 const login=(password,site=origin)=>accessGate(new Request(origin+'/boo-login',{method:'POST',headers:{Origin:site},body:new URLSearchParams({password})}),secret);
 assert.equal((await login('wrong')).status,401);
 assert.equal((await login(secret,'https://evil.example')).status,403);
 const response=await login(secret);assert.equal(response.status,303);
 const cookie=response.headers.get('set-cookie');assert.match(cookie,/HttpOnly; Secure; SameSite=Strict/);
 const request=new Request(origin,{headers:{Cookie:cookie.split(';')[0]}});
 assert.equal(await accessGate(request,secret),null);
 assert.notEqual(await accessGate(request,'changed-password'),null);
 assert.notEqual(await accessGate(new Request(origin,{headers:{Cookie:'__Host-boo_session=9999999999.'+'0'.repeat(64)}}),secret),null);
});
