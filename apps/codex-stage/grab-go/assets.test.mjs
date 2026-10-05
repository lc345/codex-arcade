import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const root=new URL('./assets/',import.meta.url);
const digest=buffer=>createHash('sha256').update(buffer).digest('hex');

test('original local artwork matches its dimensions, license and content digests',async()=>{
  const manifest=JSON.parse(await readFile(new URL('provenance.json',root),'utf8'));
  assert.equal(manifest.id,'grab-go');
  assert.equal(manifest.license,'Apache-2.0');
  assert.match(await readFile(new URL('LICENSE',root),'utf8'),/Apache License/);
  assert.equal(digest(await readFile(new URL(manifest.prompts,root))),manifest.promptsSha256);
  assert.deepEqual(manifest.files.map(f=>f.name).sort(),['cabinet.png','treasures.png']);
  assert.deepEqual((await readdir(root)).filter(f=>/\.(png|webp|jpg)$/i.test(f)).sort(),manifest.files.map(f=>f.name).sort());
  let total=0;
  for(const file of manifest.files){
    assert.match(file.name,/^[a-z-]+\.png$/);
    const buffer=await readFile(new URL(file.name,root));
    assert.equal(buffer.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.equal(buffer.length,file.bytes);
    assert.equal(buffer.readUInt32BE(16),file.width);
    assert.equal(buffer.readUInt32BE(20),file.height);
    assert.equal(digest(buffer),file.sha256);
    total+=buffer.length;
  }
  assert.ok(total<8*1024*1024,'standalone artwork stays below 8 MiB');
  const atlas=manifest.files.find(f=>f.name==='treasures.png');
  assert.equal(atlas.width,atlas.height*2,'four-by-two atlas must have square cells');
});
