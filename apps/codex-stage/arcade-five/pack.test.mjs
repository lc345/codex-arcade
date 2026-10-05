import test from 'node:test';
import assert from 'node:assert/strict';
import {GAME_CATALOG,createGamePicker} from '../collection/catalog.js';
import {buildReviewedPack} from '../packs/build.js';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const ids=['pan-flip','bank-shot','paper-racer','cap-cup','paper-glider'];
test('five distinct reviewed games extend the library without silently changing approved rotation',()=>{
  assert.deepEqual(GAME_CATALOG.filter(g=>g.collection==='arcade-five').map(g=>g.id),ids);assert.equal(GAME_CATALOG.length, 95);assert.equal(GAME_CATALOG.filter(g=>g.curated).length,7);
  const picker=createGamePicker();for(let i=0;i<20;i++)assert.ok(!ids.includes(picker.pick('stable-'+i).id));
});
test('each new factory is self-contained, bounded and includes only its own local artwork',()=>{
  for(const id of ids){const {source,manifest,factory}=buildReviewedPack(id);assert.equal(manifest.reviewed,true);assert.ok(manifest.bytes<8*1024*1024);assert.equal(manifest.sha256,createHash('sha256').update(source).digest('hex'));assert.equal(typeof Function('return '+factory)(),'function');
    for(const other of ids.filter(x=>x!==id))assert.ok(!source.includes(`data:image/png;base64,${readFileSync(new URL(`./assets/${other}.png`,import.meta.url)).toString('base64')}`));
    assert.ok(!/https?:\/\//.test(source.replace(/\/\*[\s\S]*?\*\//g,'')));assert.deepEqual(manifest.permissions,[]);
  }
});
