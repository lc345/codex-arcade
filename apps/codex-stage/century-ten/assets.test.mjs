import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {CENTURY_CATALOG} from './catalog.js';
test('all ten backgrounds and gameplay covers have licensed, hash-bound provenance',async()=>{
  const dir=new URL('./assets/',import.meta.url),m=JSON.parse(await readFile(new URL('provenance.json',dir))),sha=b=>createHash('sha256').update(b).digest('hex');assert.equal(m.files.length,27);assert.equal(m.license,'Apache-2.0');assert.equal(m.generated.length,3);
  for(const [name,key]of [['../art.js','sourceSha256'],['ARTWORK.md','documentationSha256'],['LICENSE','licenseSha256']])assert.equal(sha(await readFile(new URL(name,dir))),m[key]);
  for(const g of CENTURY_CATALOG){assert.ok(m.files.some(f=>f.name===g.id+'.png'));assert.ok(m.files.some(f=>f.name===`covers/${g.id}.png`));}
  for(const f of m.files){assert.match(f.name,/^(covers\/)?[a-z-]+\.(png|svg)$/);const b=await readFile(new URL(f.name,dir));assert.equal(b.length,f.bytes);assert.equal(sha(b),f.sha256);if(f.name.endsWith('.png')){assert.equal(b.readUInt32BE(16),f.width);assert.equal(b.readUInt32BE(20),f.height);assert.equal(f.width/f.height,1.5);assert.ok(f.width>=960);}else assert.ok(!/<script|<foreignObject|https?:\/\/(?!www.w3.org\/2000\/svg)/.test(b.toString()));}
});
