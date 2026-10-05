import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),dir=new URL('apps/codex-stage/reel-break/assets/',root);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex'),files=[];
for(const name of ['inlet.png','fish-v2.png','angler.png']){
  const bytes=await readFile(new URL(name,dir));
  if(bytes.toString('hex',0,8)!=='89504e470d0a1a0a')throw new Error('Expected PNG: '+name);
  files.push({name,bytes:bytes.length,width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),sha256:sha(bytes)});
}
await copyFile(new URL('LICENSE',root),new URL('LICENSE',dir));
const manifest={id:'reel-break',date:'2026-09-30',tool:'Built-in image_gen',license:'Apache-2.0',prompts:'ARTWORK.md',promptsSha256:sha(await readFile(new URL('ARTWORK.md',dir))),files};
await writeFile(new URL('provenance.json',dir),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({files,totalBytes:files.reduce((n,f)=>n+f.bytes,0)}));
