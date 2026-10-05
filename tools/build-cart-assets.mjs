import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {homedir} from 'node:os';
const root=new URL('../',import.meta.url).pathname,dir=root+'apps/codex-stage/cart-downhill/assets/';
const binary=process.env.BLENDER_BIN||homedir()+'/Applications/Blender 4.5.14.app/Contents/MacOS/Blender';
const {stdout,stderr}=await promisify(execFile)(binary,['--background','--python',root+'tools/art/build-cart-assets.py'],{maxBuffer:4*1024*1024});
if(!stdout.includes('CART_ASSETS_READY')||/Traceback|Error: Python/.test(stdout+stderr))throw new Error(stdout+stderr);
const marker=stdout.split('\n').find(line=>line.startsWith('CART_ASSETS_READY '));
const {tool}=JSON.parse(marker.slice('CART_ASSETS_READY '.length));
const sources=['seaside.glb','seaside.blend'],files=[];
for(const name of sources){const data=await readFile(dir+name);files.push({name,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});}
const glb=await readFile(dir+'seaside.glb');if(glb.readUInt32LE(0)!==0x46546c67||glb.length!==glb.readUInt32LE(8))throw new Error('Invalid GLB');
await copyFile(root+'LICENSE',dir+'LICENSE');
await writeFile(dir+'provenance.json',JSON.stringify({id:'cart-downhill',date:'2026-09-30',author:'Agent Stage',license:'Apache-2.0',tool,source:'tools/art/build-cart-assets.py',sourceSha256:createHash('sha256').update(await readFile(root+'tools/art/build-cart-assets.py')).digest('hex'),method:'Original scripted Blender modelling. No external models, textures, audio, or named franchise assets.',files},null,2)+'\n');
console.log(JSON.stringify({files}));
