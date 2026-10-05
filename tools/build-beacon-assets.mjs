import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {homedir} from 'node:os';
const root=new URL('../',import.meta.url).pathname,dir=root+'apps/codex-stage/last-beacon/assets/',sha=b=>createHash('sha256').update(b).digest('hex');
const binary=process.env.BLENDER_BIN||homedir()+'/Applications/Blender 4.5.14.app/Contents/MacOS/Blender';
let tool;
if(process.argv.includes('--manifest-only'))tool=JSON.parse(await readFile(dir+'provenance.json','utf8')).tool;
else {
  const {stdout,stderr}=await promisify(execFile)(binary,['--background','--python',root+'tools/art/build-beacon-assets.py'],{maxBuffer:4*1024*1024});
  if(!stdout.includes('BEACON_ASSETS_READY')||/Traceback|Error: Python/.test(stdout+stderr))throw Error(stdout+stderr);
  tool=JSON.parse(stdout.split('\n').find(l=>l.startsWith('BEACON_ASSETS_READY ')).slice(20)).tool;
}
const files=[];for(const name of ['survivor.glb','survivor.blend','ground.png','crosshair.svg','heart-pulse.svg','package-open.svg']){const b=await readFile(dir+name);files.push({name,bytes:b.length,sha256:sha(b),license:name.endsWith('.svg')?'ISC':'Apache-2.0'});}
await copyFile(root+'LICENSE',dir+'LICENSE');
await writeFile(dir+'provenance.json',JSON.stringify({id:'last-beacon',date:'2026-10-01',license:'Apache-2.0',tool,source:'tools/art/build-beacon-assets.py',sourceSha256:sha(await readFile(root+'tools/art/build-beacon-assets.py')),prompts:'ARTWORK.md',promptsSha256:sha(await readFile(dir+'ARTWORK.md')),files},null,2)+'\n');
const vendor=root+'apps/codex-stage/vendor/';await writeFile(vendor+'yuka-provenance.json',JSON.stringify({version:'0.7.6',commit:'8440c4fe3282088ecdace32701e196d4b12a715c',source:'https://github.com/Mugen87/yuka',license:'MIT',sha256:sha(await readFile(vendor+'yuka.js'))},null,2)+'\n');
console.log(JSON.stringify({files}));
