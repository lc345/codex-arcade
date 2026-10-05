import test from 'node:test';
import assert from 'node:assert/strict';
import {HARDCORE_CATALOG} from './catalog.js';
import {HARDCORE_WORLDS} from './worlds.js';
import {playHardcore} from '../../../tools/hardcore-replays.mjs';

const ids=['ratchet-vault','hex-panic','downshaft','magnet-suture','flash-dojo','rotor-courier','knight-fall','polarity-lock','disc-vault','echo-rewind'];
test('ten independent hard games, with clear controls and three authored rounds',()=>{
  assert.deepEqual(HARDCORE_CATALOG.map(g=>g.id),ids);
  for(const field of ['mechanic','artStyle'])assert.equal(new Set(HARDCORE_CATALOG.map(g=>g[field])).size,10);
  for(const game of HARDCORE_CATALOG){assert.equal(game.levels.length,3);assert.ok(game.hint.length>15);assert.equal(game.release,'preview');}
});
for(const id of ids){
  test(`${id}: all three rounds are reachable using only public player inputs`,()=>{
    const result=playHardcore(id);assert.equal(result.phase,'won',JSON.stringify(result));assert.equal(result.stage,2);
  });
  test(`${id}: inactivity loses, retry resets the run, stop freezes everything`,()=>{
    const events=[],w=HARDCORE_WORLDS[id]({onEvent:e=>events.push(e)});w.begin();for(let n=0;n<4000;n++)w.step(50);
    assert.equal(w.snapshot().phase,'lost');w.retry();assert.equal(w.snapshot().phase,'ready');assert.equal(w.snapshot().time,0);
    w.begin();w.down({x:480,y:320});w.step(40);w.stop();const state=JSON.stringify(w.snapshot()),count=events.length;
    w.step(500);assert.equal(w.down({x:200,y:200}),false);assert.equal(w.up({x:200,y:200}),false);assert.equal(w.retry(),false);
    assert.equal(JSON.stringify(w.snapshot()),state);assert.equal(events.length,count);
    const restored=HARDCORE_WORLDS[id]({checkpoint:w.checkpoint()});assert.equal(restored.snapshot().held,false);assert.equal(restored.snapshot().phase,'ready');w.destroy();restored.destroy();
  });
}
