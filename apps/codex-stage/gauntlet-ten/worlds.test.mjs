import test from 'node:test';
import assert from 'node:assert/strict';
import {GAUNTLET_WORLDS} from './worlds.js';
import {GAUNTLET_CATALOG} from './catalog.js';
import {playGauntlet} from '../../../tools/gauntlet-replays.mjs';
const advance=(w,seconds)=>{for(let i=0;i<seconds*120;i++)w.step(1000/120);};
test('ten games use ten independently named mechanics and art directions',()=>{
  assert.equal(GAUNTLET_CATALOG.length,10);
  for(const key of ['id','mechanic','artStyle'])assert.equal(new Set(GAUNTLET_CATALOG.map(g=>g[key])).size,10);
  assert.deepEqual(Object.keys(GAUNTLET_WORLDS),GAUNTLET_CATALOG.map(g=>g.id));
});
for(const id of ['needle-rush','tightrope-club','mirror-vault','crate-escape','twin-tide','mine-surveyor','territory-cut','paper-fold','tempo-steps','airlock-queue']){
  test(`${id}: three rounds are winnable using public inputs`,()=>{const result=playGauntlet(id);assert.equal(result.phase,'won',JSON.stringify(result));assert.equal(result.stage,2);});
  test(`${id}: inactivity never wins`,()=>{const w=GAUNTLET_WORLDS[id]();w.begin();advance(w,190);assert.equal(w.snapshot().phase,'lost');w.destroy();});
  test(`${id}: stop freezes input, simulation and feedback; restart keeps only the round`,()=>{
    const events=[],w=GAUNTLET_WORLDS[id]({onEvent:e=>events.push(e)});w.begin();w.down({x:480,y:320});advance(w,.1);w.stop();
    const frozen=JSON.stringify(w.snapshot()),count=events.length;advance(w,3);assert.equal(w.down({x:100,y:100}),false);assert.equal(w.up({x:100,y:100}),false);assert.equal(w.retry(),false);assert.equal(JSON.stringify(w.snapshot()),frozen);assert.equal(events.length,count);
    const r=GAUNTLET_WORLDS[id]({checkpoint:w.checkpoint()});assert.equal(r.snapshot().phase,'ready');assert.equal(r.snapshot().held,false);w.destroy();r.destroy();
  });
}
