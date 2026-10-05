import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {SPORTS_CATALOG} from './catalog.js';

test('all ten local backgrounds and actual game covers have licenses, prompts and matching digests',async()=>{
  const dir=new URL('./assets/',import.meta.url),manifest=JSON.parse(await readFile(new URL('provenance.json',dir))),sha=b=>createHash('sha256').update(b).digest('hex');
  assert.equal(manifest.license,'Apache-2.0');assert.equal(manifest.files.length,20);
  const prompts=await readFile(new URL('ARTWORK.md',dir));
  assert.equal(sha(prompts),manifest.promptsSha256);
  assert.equal(sha(await readFile(new URL('LICENSE',dir))),manifest.licenseSha256);
  for(const g of SPORTS_CATALOG){assert.ok(prompts.includes(g.id));assert.ok(manifest.files.some(f=>f.name===g.id+'.png'));}
  for(const f of manifest.files){
    assert.match(f.name,/^(covers\/)?[a-z-]+\.png$/);const b=await readFile(new URL(f.name,dir));
    assert.equal(sha(b),f.sha256);assert.equal(b.length,f.bytes);assert.equal(b.readUInt32BE(16),f.width);assert.equal(b.readUInt32BE(20),f.height);assert.ok(f.width>=900&&f.height>=600);
  }
});
