import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {SPORTS_CATALOG} from '../apps/codex-stage/sports-ten/catalog.js';

const dir=new URL('../apps/codex-stage/sports-ten/assets/',import.meta.url);
const sha=b=>createHash('sha256').update(b).digest('hex');
const files=[];
for(const game of SPORTS_CATALOG){
  for(const name of [`${game.id}.png`,`covers/${game.id}.png`]){
    const b=await readFile(new URL(name,dir));
    if(b.toString('hex',0,8)!=='89504e470d0a1a0a')throw Error(`Invalid PNG: ${name}`);
    files.push({name,bytes:b.length,width:b.readUInt32BE(16),height:b.readUInt32BE(20),sha256:sha(b)});
  }
}
await writeFile(new URL('provenance.json',dir),JSON.stringify({
  id:'sports-ten',date:'2026-10-02',license:'Apache-2.0',
  method:'Ten original built-in image_gen backgrounds, including two imagegen revisions. Covers captured from the running Canvas games. Sound synthesized locally with Web Audio; no sampled music.',
  prompts:'ARTWORK.md',promptsSha256:sha(await readFile(new URL('ARTWORK.md',dir))),
  licenseSha256:sha(await readFile(new URL('LICENSE',dir))),files,
},null,2)+'\n');
console.log(JSON.stringify({assets:files.length,bytes:files.reduce((n,f)=>n+f.bytes,0)}));
