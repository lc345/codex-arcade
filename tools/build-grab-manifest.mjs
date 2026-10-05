import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),dir=new URL('apps/codex-stage/grab-go/assets/',root),sha=b=>createHash('sha256').update(b).digest('hex');
const files=[];for(const name of ['cabinet.png','treasures.png']){const b=await readFile(new URL(name,dir));if(b.toString('hex',0,8)!=='89504e470d0a1a0a')throw Error('Invalid PNG');files.push({name,bytes:b.length,width:b.readUInt32BE(16),height:b.readUInt32BE(20),sha256:sha(b)});}
await copyFile(new URL('LICENSE',root),new URL('LICENSE',dir));await writeFile(new URL('provenance.json',dir),JSON.stringify({id:'grab-go',date:'2026-10-02',license:'Apache-2.0',method:'Built-in image_gen; originals unchanged; runtime atlas crops from alpha bounds.',prompts:'ARTWORK.md',promptsSha256:sha(await readFile(new URL('ARTWORK.md',dir))),files},null,2)+'\n');console.log(JSON.stringify({files}));
