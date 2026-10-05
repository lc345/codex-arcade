import test from 'node:test';
import assert from 'node:assert/strict';
import {SPORTS_WORLDS} from './worlds.js';
import {playSports} from '../../../tools/sports-replays.mjs';
const step=(w,seconds)=>{for(let i=0;i<seconds*120;i++)w.step(1000/120);};
for(const [id,make] of Object.entries(SPORTS_WORLDS)){
  test(`${id}: three authored rounds can be won with legal player input`,()=>{
    const result=playSports(id);assert.equal(result.snapshot.phase,'won',JSON.stringify(result.snapshot));assert.deepEqual(result.stages,[0,1,2]);
  });
  test(`${id}: ready waits and task completion freezes physics and rejects controls`,()=>{
    const w=make(),ready=w.snapshot();step(w,2);assert.deepEqual(w.snapshot(),ready);w.begin();w.down({x:480,y:380});step(w,.3);w.stop();const stopped=w.snapshot();step(w,4);assert.deepEqual(w.snapshot(),stopped);assert.equal(w.down(),false);assert.equal(w.move({x:0,y:0}),false);assert.equal(w.up(),false);w.destroy();
  });
  test(`${id}: safe checkpoints and malformed input cannot invent score`,()=>{
    const w=make({checkpoint:{version:1,id,stage:99,phase:'won',private:'secret'}});assert.equal(w.snapshot().stage,0);w.begin();assert.equal(w.down({x:Infinity,y:0}),false);assert.equal(w.move({x:0,y:NaN}),false);step(w,.1);w.cancel();const cp=w.checkpoint();assert.ok(JSON.stringify(cp).length<300);assert.ok(!JSON.stringify(cp).includes('secret'));const n=make({checkpoint:cp});assert.equal(n.snapshot().phase,'ready');assert.equal(n.snapshot().held,false);assert.equal(n.snapshot().score,0);w.destroy();n.destroy();
  });
  test(`${id}: canonical completed saves are static and silent`,()=>{
    const events=[],w=make({checkpoint:{version:1,id,stage:2,phase:'won'},onEvent:e=>events.push(e)});const s=w.snapshot();assert.equal(s.phase,'won');assert.ok(s.score>0);assert.ok(s.progress>=s.goal);assert.deepEqual(events,[]);step(w,2);assert.deepEqual(w.snapshot(),s);w.destroy();
  });
  test(`${id}: normal inputs preserve finite physics and emit no output after disposal`,()=>{
    const events=[],w=make({onEvent:e=>events.push(e)});w.begin();w.down({x:480,y:480});step(w,.4);w.move({x:360,y:610});w.up({x:360,y:610});step(w,4);
    const finite=x=>{if(typeof x==='number')assert.ok(Number.isFinite(x),id);else if(x&&typeof x==='object')Object.values(x).forEach(finite);};finite(w.snapshot());
    w.destroy();const n=events.length;w.down();w.up();step(w,5);assert.equal(events.length,n);assert.equal(w.begin(),false);
  });
}
test('tennis and table tennis cannot win without returning a ball',()=>{
  for(const id of ['lawn-rally','table-spin']){const w=SPORTS_WORLDS[id]();w.begin();w.move({x:190,y:500});step(w,30);assert.equal(w.snapshot().phase,'lost');assert.equal(w.snapshot().progress,0);w.destroy();}
});
test('a bridge parked away from the gap breaks the actual domino chain',()=>{
  const w=SPORTS_WORLDS['domino-bridge']();w.begin();w.down();step(w,.06);w.up();step(w,20);assert.equal(w.snapshot().phase,'lost');assert.ok(w.snapshot().fallen<20);w.destroy();
});
test('dropping every incoming plate without moving is a real loss',()=>{
  const w=SPORTS_WORLDS['plate-parade']();w.begin();w.move({x:190,y:548});step(w,10);assert.equal(w.snapshot().phase,'lost');w.destroy();
});
test('keeping the press down crushes batteries and cannot clear the shift',()=>{
  const w=SPORTS_WORLDS['crush-hour']({checkpoint:{version:1,id:'crush-hour',stage:2,phase:'ready'}});w.begin();w.down();step(w,40);assert.equal(w.snapshot().phase,'lost');assert.ok(w.snapshot().errors>0);w.destroy();
});
