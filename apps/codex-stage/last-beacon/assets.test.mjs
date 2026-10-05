import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createThree} from '../vendor/three.js';
const dir=new URL('./assets/',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
test('the pinned offline renderer exposes the required battle rendering surface',()=>{
  const T=createThree();for(const name of ['FogExp2','IcosahedronGeometry','Texture','LineSegments','BufferAttribute','Object3D','GLTFLoader'])assert.equal(typeof T[name],'function',name);
});
test('original local models, ground texture and credited icons match their licensed manifest',async()=>{
  const m=JSON.parse(await readFile(new URL('provenance.json',dir),'utf8'));assert.equal(m.license,'Apache-2.0');assert.equal(m.files.length,6);
  assert.equal(sha(await readFile(new URL('ARTWORK.md',dir))),m.promptsSha256);assert.match(await readFile(new URL('LICENSE',dir),'utf8'),/Apache License/);assert.match(await readFile(new URL('LUCIDE-LICENSE',dir),'utf8'),/ISC/);
  assert.equal(sha(await readFile(new URL('../../../tools/art/build-beacon-assets.py',import.meta.url))),m.sourceSha256);
  for(const f of m.files){assert.match(f.name,/^[a-z-]+\.(glb|blend|png|svg)$/);const b=await readFile(new URL(f.name,dir));assert.equal(sha(b),f.sha256);assert.equal(b.length,f.bytes);}
  const glb=await readFile(new URL('survivor.glb',dir));assert.equal(glb.toString('utf8',0,4),'glTF');const json=JSON.parse(glb.toString('utf8',20,20+glb.readUInt32LE(12)));
  for(const name of ['Survivor','GunSocket','LegL','LegR','Upper','Rifle','Pistol','Scatter'])assert.ok(json.nodes.some(n=>n.name===name),name);
  assert.ok((json.buffers||[]).every(b=>!b.uri));assert.ok((json.images||[]).every(i=>!i.uri));assert.ok(m.files.reduce((n,f)=>n+f.bytes,0)<8_000_000);
});
test('AI and renderer dependency checksums and licenses remain verifiable',async()=>{
  for(const name of ['yuka','three']){const base=new URL('../vendor/',import.meta.url),m=JSON.parse(await readFile(new URL(name+'-provenance.json',base),'utf8'));assert.equal(sha(await readFile(new URL(name+'.js',base))),m.sha256);assert.match(await readFile(new URL(name.toUpperCase()+'-LICENSE.txt',base),'utf8'),/MIT/);}
});
