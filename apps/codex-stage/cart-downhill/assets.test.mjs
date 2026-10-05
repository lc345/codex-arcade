import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
test('seaside models are original, bounded, offline and integrity checked',()=>{
  const dir=new URL('./assets/',import.meta.url),manifest=JSON.parse(readFileSync(new URL('provenance.json',dir)));
  assert.equal(manifest.license,'Apache-2.0');assert.match(readFileSync(new URL('LICENSE',dir),'utf8'),/Apache License/);
  assert.match(manifest.tool,/^Blender \d+\.\d+\.\d+( LTS)?$/);
  assert.equal(createHash('sha256').update(readFileSync(new URL('../../../'+manifest.source,import.meta.url))).digest('hex'),manifest.sourceSha256);
  for(const f of manifest.files){const b=readFileSync(new URL(f.name,dir));assert.equal(b.length,f.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256);}
  const b=readFileSync(new URL('seaside.glb',dir));assert.ok(b.length<4*1024*1024);assert.equal(b.readUInt32LE(8),b.length);const gltf=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));
  for(const name of ['Cart','Shopper','Cake','Crate','Orange','TrafficCar','Stall','House','Head','LegL','LegR'])assert.ok(gltf.nodes.some(n=>n.name===name),name);
  assert.ok(!gltf.buffers.some(b=>b.uri));assert.ok(!(gltf.images||[]).some(i=>i.uri));assert.equal(gltf.extensionsRequired?.length||0,0);
});
