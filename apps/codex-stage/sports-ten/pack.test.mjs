import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {SPORTS_CATALOG} from './catalog.js';
import {GAME_CATALOG,createGamePicker} from '../collection/catalog.js';
import {buildReviewedPack} from '../packs/build.js';
test('ten new games are explicit previews, with stable rotation and curation unchanged',()=>{
  assert.equal(SPORTS_CATALOG.length,10);assert.equal(GAME_CATALOG.length,95);assert.equal(GAME_CATALOG.filter(g=>g.collection==='sports-ten').length,10);
  assert.equal(GAME_CATALOG.filter(g=>g.curated).length,7);assert.equal(GAME_CATALOG.filter(g=>g.release!=='preview').length,7);
  const picker=createGamePicker();for(let i=0;i<100;i++)assert.ok(!SPORTS_CATALOG.some(g=>g.id===picker.pick('test-'+i).id));
});
test('each new sports pack is self contained, local, licensed, digest-bound and within eight MiB',()=>{
  for(const game of SPORTS_CATALOG){const {source,manifest,factory}=buildReviewedPack(game.id);assert.ok(manifest.bytes<8*1024*1024);assert.equal(manifest.sha256,createHash('sha256').update(source).digest('hex'));assert.deepEqual(manifest.permissions,[]);assert.equal(typeof Function('return '+factory)(),'function');assert.ok(!/https?:\/\//.test(source.replace(/\/\*[\s\S]*?\*\//g,'')));
    const art=readFileSync(new URL(`./assets/${game.id}.png`,import.meta.url)).toString('base64');assert.ok(source.includes(art));assert.equal((source.match(/data:image\/png;base64,/g)||[]).length,1);
  }
});
