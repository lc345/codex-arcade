import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {ODD_CATALOG} from '../apps/codex-stage/odd-ten/catalog.js';
const dir=new URL('../apps/codex-stage/odd-ten/assets/',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex'),files=[];
for(const game of ODD_CATALOG)for(const name of [`${game.id}.svg`,`${game.id}.png`,`covers/${game.id}.png`]){const b=await readFile(new URL(name,dir));files.push({name,bytes:b.length,sha256:sha(b),...(name.endsWith('.png')?{width:b.readUInt32BE(16),height:b.readUInt32BE(20)}:{})});}
await writeFile(new URL('provenance.json',dir),JSON.stringify({id:'odd-ten',date:'2026-10-02',license:'Apache-2.0',method:'Original SVG scenery rasterized locally; original Canvas game objects; actual gameplay covers; locally synthesized audio.',source:'../art.js',sourceSha256:sha(await readFile(new URL('../art.js',dir))),documentationSha256:sha(await readFile(new URL('ARTWORK.md',dir))),licenseSha256:sha(await readFile(new URL('LICENSE',dir))),files},null,2)+'\n');console.log(JSON.stringify({assets:files.length,bytes:files.reduce((n,f)=>n+f.bytes,0)}));
