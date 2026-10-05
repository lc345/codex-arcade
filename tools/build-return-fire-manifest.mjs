import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),dir=new URL('apps/codex-stage/return-fire/assets/',root),sha=b=>createHash('sha256').update(b).digest('hex');
const files=[];
for(const name of ['drydock.png','machines.png']){const b=await readFile(new URL(name,dir));if(b.toString('hex',0,8)!=='89504e470d0a1a0a')throw Error('Expected PNG');files.push({name,bytes:b.length,width:b.readUInt32BE(16),height:b.readUInt32BE(20),sha256:sha(b)});}
await copyFile(new URL('LICENSE',root),new URL('LICENSE',dir));
await writeFile(new URL('provenance.json',dir),JSON.stringify({id:'return-fire',date:'2026-10-01',tool:'Built-in image_gen',license:'Apache-2.0',prompts:'ARTWORK.md',promptsSha256:sha(await readFile(new URL('ARTWORK.md',dir))),files},null,2)+'\n');
console.log(JSON.stringify({files,totalBytes:files.reduce((n,f)=>n+f.bytes,0)}));
