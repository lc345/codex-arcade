import test from 'node:test';
import assert from 'node:assert/strict';
import {EXTREME_CATALOG} from './catalog.js';
import {EXTREME_WORLDS} from './worlds.js';
import {playExtreme} from '../../../tools/extreme-replays.mjs';

const ids=['razor-wings','wall-rebound','twin-helix','dash-stitch','cursor-overdrive','recoil-pilot'];
test('six distinct operation games with three escalating rounds',()=>{
  assert.deepEqual(EXTREME_CATALOG.map(g=>g.id),ids);
  for(const key of ['mechanic','artStyle'])assert.equal(new Set(EXTREME_CATALOG.map(g=>g[key])).size,6);
  for(const g of EXTREME_CATALOG){assert.equal(g.levels.length,3);assert.equal(g.release,'preview');assert.ok(g.hint.length>25);}
});
for(const id of ids){
  for(const stepMs of [16,33])test(`${id}: three rounds reachable with public inputs at ${stepMs}ms`,()=>{
    const s=playExtreme(id,{stepMs});assert.equal(s.phase,'won',JSON.stringify(s));assert.equal(s.stage,2);
  });
  test(`${id}: idle loses, cancel releases input, stop blocks all further play`,()=>{
    const events=[],w=EXTREME_WORLDS[id]({onEvent:e=>events.push(e)});w.begin();for(let i=0;i<4000;i++)w.step(50);assert.equal(w.snapshot().phase,'lost');
    w.retry();assert.equal(w.snapshot().time,0);w.begin();w.down({x:470,y:310});w.cancel();assert.equal(w.snapshot().held,false);w.stop();
    const before=JSON.stringify(w.snapshot()),n=events.length;w.step(1000);assert.equal(w.down({x:480,y:320}),false);assert.equal(w.move({x:40,y:40}),false);assert.equal(w.up({x:100,y:100}),false);assert.equal(w.retry(),false);assert.equal(JSON.stringify(w.snapshot()),before);assert.equal(events.length,n);
    const restored=EXTREME_WORLDS[id]({checkpoint:w.checkpoint()});assert.equal(restored.snapshot().phase,'ready');assert.equal(restored.snapshot().held,false);w.destroy();restored.destroy();
  });
}
test('dash cannot teleport or fire again in flight',()=>{const w=EXTREME_WORLDS['dash-stitch']();w.begin();const a=w.snapshot().player;w.down({x:950,y:160});const b=w.snapshot();assert.deepEqual(b.player,a);assert.equal(b.mode,'flight');assert.equal(w.down({x:0,y:600}),false);w.destroy();});
test('wall charge cancellation never launches',()=>{const w=EXTREME_WORLDS['wall-rebound']();w.begin();w.down();w.step(50);w.cancel();w.up();assert.equal(w.snapshot().mode,'wall');assert.equal(w.snapshot().charge,0);w.destroy();});
test('recoil points away from the cursor and consumes finite ammunition',()=>{const w=EXTREME_WORLDS['recoil-pilot']();w.begin();const s=w.snapshot();w.down({x:s.player.x-80,y:s.player.y});w.step(20);const a=w.snapshot();assert.ok(a.velocity.x>0);assert.equal(a.ammo,s.ammo-1);w.destroy();});
test('cursor spam before the timing window fails',()=>{const w=EXTREME_WORLDS['cursor-overdrive']();w.begin();w.down(w.snapshot().notes[0].a);assert.equal(w.snapshot().phase,'lost');w.destroy();});
