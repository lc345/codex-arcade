import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const dir=new URL('./assets/',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
test('local museum and puppet art has reproducible provenance, dimensions and license',async()=>{
  const m=JSON.parse(await readFile(new URL('provenance.json',dir),'utf8'));
  assert.equal(m.license,'Apache-2.0');assert.equal(m.files.length,2);
  assert.equal(sha(await readFile(new URL('ARTWORK.md',dir))),m.promptsSha256);
  assert.match(await readFile(new URL('LICENSE',dir),'utf8'),/Apache License/);
  for(const f of m.files){assert.match(f.name,/^[a-z-]+\.png$/);const b=await readFile(new URL(f.name,dir));assert.equal(sha(b),f.sha256);assert.equal(b.length,f.bytes);assert.equal(b.readUInt32BE(16),f.width);assert.equal(b.readUInt32BE(20),f.height);}
  assert.ok(m.files.reduce((n,f)=>n+f.bytes,0)<8_000_000);
});
