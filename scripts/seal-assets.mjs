import {readFile,writeFile,readdir,mkdir,rm,rename,copyFile} from 'node:fs/promises';
import {createCipheriv,randomBytes,createHash} from 'node:crypto';
import {extname} from 'node:path';
import {stripTypeScriptTypes} from 'node:module';
const key=Buffer.from(process.env.BOO_ASSET_KEY||'','base64');
if(key.length!==32)throw Error('BOO_ASSET_KEY must be a 32-byte secret before building');
const manifest={};const payloads=[];
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.glb':'model/gltf-binary','.wasm':'application/wasm','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
async function visit(dir,prefix=''){for(const item of await readdir(dir,{withFileTypes:true})){const relative=prefix+'/'+item.name;if(item.isDirectory())await visit(dir+'/'+item.name,relative);else{const data=await readFile(dir+'/'+item.name);const iv=randomBytes(12);const cipher=createCipheriv('aes-256-gcm',key,iv);const sealed=Buffer.concat([iv,cipher.update(data),cipher.final(),cipher.getAuthTag()]);const target='/__sealed/'+createHash('sha256').update(relative).digest('hex')+'.bin';payloads.push([target,sealed]);manifest[relative]={target,type:mime[extname(item.name)]||'application/octet-stream'};}}}
await visit('dist/client');
await rm('dist/client',{recursive:true});await mkdir('dist/client/__sealed',{recursive:true});
for(const [target,data] of payloads)await writeFile('dist/client'+target,data);
await rename('dist/server/index.js','dist/server/application.js');
await writeFile('dist/server/protected-manifest.js','export default '+JSON.stringify(manifest)+';');
await copyFile('server/protected-assets.js','dist/server/protected-assets.js');
await copyFile('server/protected-worker.js','dist/server/index.js');
let gate;try{gate=await readFile('server/access.js','utf8');}catch{gate=stripTypeScriptTypes(await readFile('server/access.ts','utf8'));}
await writeFile('dist/server/access.js',gate);
console.log('Sealed '+payloads.length+' assets; all original URLs pass through the password gate.');
