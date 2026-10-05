import test from 'node:test';
import assert from 'node:assert/strict';
import {CENTURY_WORLDS} from './worlds.js';
import {playCentury} from '../../../tools/century-replays.mjs';
const advance=(w,t)=>{for(let i=0;i<t*120;i++)w.step(1000/120);};
for(const [id,make] of Object.entries(CENTURY_WORLDS)){
  test(`${id}: three rounds are winnable through public input`,()=>{const {snapshot,stages}=playCentury(id);assert.equal(snapshot.phase,'won',JSON.stringify(snapshot));assert.deepEqual(stages,[0,1,2]);});
  test(`${id}: inactivity is not success`,()=>{const w=make();w.begin();advance(w,95);assert.equal(w.snapshot().phase,'lost');w.destroy();});
  test(`${id}: cancellation and task stop are synchronous`,()=>{const w=make(),ready=w.snapshot();advance(w,1);assert.deepEqual(w.snapshot(),ready);w.begin();assert.equal(w.move({x:NaN,y:0}),false);w.down({x:480,y:330});advance(w,.1);w.cancel();assert.equal(w.snapshot().held,false);w.stop();const before=w.snapshot();advance(w,5);assert.deepEqual(w.snapshot(),before);assert.equal(w.down(),false);assert.equal(w.up(),false);w.destroy();});
  test(`${id}: bounded checkpoints resume safely without held input`,()=>{const w=make({checkpoint:{version:1,id,stage:99,phase:'won'}});assert.equal(w.snapshot().stage,0);w.begin();advance(w,.2);const cp=w.checkpoint();assert.ok(JSON.stringify(cp).length<200);const r=make({checkpoint:cp});assert.equal(r.snapshot().phase,'ready');assert.equal(r.snapshot().held,false);w.destroy();r.destroy();const events=[],done=make({checkpoint:{version:1,id,stage:2,phase:'won'},onEvent:e=>events.push(e)}),s=done.snapshot();assert.ok(s.progress>=s.goal);advance(done,2);assert.deepEqual(done.snapshot(),s);assert.deepEqual(events,[]);done.destroy();});
}
