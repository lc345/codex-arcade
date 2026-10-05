import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {SPRITES} from './painter.js';
test('fishing art is local, licensed, hash-checked and has three nonoverlapping sprite regions',()=>{
  const dir=new URL('./assets/',import.meta.url),manifest=JSON.parse(readFileSync(new URL('provenance.json',dir))),sha=b=>createHash('sha256').update(b).digest('hex');
  assert.equal(manifest.tool,'Built-in image_gen');assert.equal(manifest.license,'Apache-2.0');assert.match(readFileSync(new URL('LICENSE',dir),'utf8'),/Apache License/);
  assert.equal(sha(readFileSync(new URL(manifest.prompts,dir))),manifest.promptsSha256);
  assert.deepEqual(manifest.files.map(f=>f.name),['inlet.png','fish-v2.png','angler.png']);
  for(const f of manifest.files){assert.ok(!f.name.includes('/'));const b=readFileSync(new URL(f.name,dir));assert.equal(b.length,f.bytes);assert.equal(sha(b),f.sha256);assert.equal(b.readUInt32BE(16),f.width);assert.equal(b.readUInt32BE(20),f.height);}
  assert.ok(manifest.files.reduce((n,f)=>n+f.bytes,0)<12*1024*1024);
  const atlas=manifest.files.find(f=>f.name==='fish-v2.png');for(let i=0;i<3;i++){assert.ok(SPRITES[i][0]+SPRITES[i][1]<=atlas.height);if(i>0)assert.ok(SPRITES[i][0]>=SPRITES[i-1][0]+SPRITES[i-1][1]);}
});
