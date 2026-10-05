import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {EXTREME_CATALOG} from './catalog.js';
import {GAME_CATALOG} from '../collection/catalog.js';
import {buildReviewedPack} from '../packs/build.js';
test('six isolated local packs use licensed art and only their required engine',()=>{
  assert.equal(GAME_CATALOG.length,95);
  assert.deepEqual(GAME_CATALOG.filter(g=>g.collection==='extreme-six').map(g=>g.id),EXTREME_CATALOG.map(g=>g.id));
  const manifest=JSON.parse(readFileSync(new URL('./assets/provenance.json',import.meta.url)));assert.equal(manifest.files.length,12);
  for(const f of manifest.files){const bytes=readFileSync(new URL('./assets/'+f.path,import.meta.url));assert.equal(f.license,'Apache-2.0');assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);assert.equal(bytes.length,f.bytes);}
  for(const g of EXTREME_CATALOG){const p=buildReviewedPack(g.id);assert.ok(p.manifest.bytes<1300000,g.id);assert.deepEqual(p.manifest.permissions,[]);assert.equal(p.manifest.dependencies.length,g.physics==='matter'?1:0);assert.equal(typeof Function('return '+p.factory)(),'function');assert.equal((p.source.match(/data:image\/png;base64,/g)||[]).length,1);for(const other of EXTREME_CATALOG)if(other.id!==g.id)assert.ok(!p.source.includes(`createOddKit('${other.id}'`));}
});
