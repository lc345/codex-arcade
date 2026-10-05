import test from 'node:test';
import assert from 'node:assert/strict';
import {ODD_WORLDS} from './worlds.js';
import {playOdd} from '../../../tools/odd-replays.mjs';

const advance=(w,seconds)=>{for(let i=0;i<seconds*120;i++)w.step(1000/120);};
for(const [id,make] of Object.entries(ODD_WORLDS)){
  test(`${id}: all three rounds are winnable using public controls`,()=>{
    const result=playOdd(id);assert.equal(result.snapshot.phase,'won',JSON.stringify(result.snapshot));assert.deepEqual(result.stages,[0,1,2]);
  });
  test(`${id}: ready, stop and disposal do not advance`,()=>{
    const events=[],w=make({onEvent:e=>events.push(e)}),ready=w.snapshot();advance(w,1);assert.deepEqual(w.snapshot(),ready);
    w.begin();w.down({x:480,y:320});advance(w,.2);w.cancel();assert.equal(w.snapshot().held,false);w.stop();const stopped=w.snapshot();advance(w,3);assert.deepEqual(w.snapshot(),stopped);assert.equal(w.down(),false);assert.equal(w.up(),false);assert.equal(w.move({x:40,y:40}),false);w.destroy();const count=events.length;advance(w,2);assert.equal(events.length,count);
  });
  test(`${id}: invalid input and saves fail safely; completed restore is inert`,()=>{
    const w=make({checkpoint:{version:1,id,stage:99,phase:'won'}});assert.equal(w.snapshot().stage,0);w.begin();assert.equal(w.down({x:NaN,y:1}),false);assert.equal(w.move({x:1,y:Infinity}),false);advance(w,.5);
    const cp=w.checkpoint();assert.ok(JSON.stringify(cp).length<200);const resumed=make({checkpoint:cp});assert.equal(resumed.snapshot().phase,'ready');assert.equal(resumed.snapshot().score,0);w.destroy();resumed.destroy();
    const events=[],done=make({checkpoint:{version:1,id,stage:2,phase:'won'},onEvent:e=>events.push(e)}),s=done.snapshot();assert.ok(s.progress>=s.goal);assert.ok(s.score>0);advance(done,2);assert.deepEqual(done.snapshot(),s);assert.deepEqual(events,[]);done.destroy();
  });
  test(`${id}: doing nothing cannot win`,()=>{
    const w=make();w.begin();advance(w,65);assert.equal(w.snapshot().phase,'lost');w.destroy();
  });
}
test('wrong locks, sleeping clocks and live power cables punish the actual mistake',()=>{
  for(const id of ['velvet-vault','alarm-alley']){const w=ODD_WORLDS[id]();w.begin();for(let i=0;i<3;i++){w.down({x:10,y:10});w.up();}assert.equal(w.snapshot().phase,'lost');assert.equal(w.snapshot().progress,0);w.destroy();}
  const w=ODD_WORLDS['fuse-salon']();w.begin();w.down({x:500,y:300});w.move({x:500,y:350});assert.equal(w.snapshot().phase,'lost');assert.equal(w.snapshot().progress,0);w.destroy();
});
test('washing has a real heat limit and cancellation stops cleaning',()=>{
  const w=ODD_WORLDS['power-wash']();w.begin();w.down({x:200,y:160});advance(w,3.8);assert.equal(w.snapshot().jammed,true);w.cancel();const n=w.snapshot().progress;advance(w,.8);assert.equal(w.snapshot().progress,n);assert.equal(w.up(),false);w.destroy();
});
test('zipper wear and jelly dimensions are not cosmetic',()=>{
  const w=ODD_WORLDS['zipper-run']();w.begin();w.down({x:480,y:120});w.move({x:860,y:400});advance(w,3);assert.equal(w.snapshot().phase,'lost');w.destroy();
  const j=ODD_WORLDS['jelly-shift']();j.begin();j.down();advance(j,10);assert.equal(j.snapshot().phase,'lost');assert.ok(j.snapshot().progress>0);j.destroy();
});
test('wrong baggage outlets consume lives; an aborted drag does not deliver',()=>{
  const w=ODD_WORLDS['baggage-boogie']();w.begin();advance(w,.3);let s=w.snapshot();w.down(s.bags[0]);w.move(s.bins[s.bags[0].type]);w.cancel();assert.equal(w.up(s.bins[0]),false);assert.equal(w.snapshot().progress,0);
  for(let i=0;i<3;i++){s=w.snapshot();const b=s.bags.find(b=>!b.dead);w.down(b);const bin=s.bins[1-b.type];w.move(bin);w.up(bin);advance(w,1.7);}assert.equal(w.snapshot().phase,'lost');w.destroy();
});
test('physics outcomes require a genuine soft landing or catching the candy',()=>{
  const w=ODD_WORLDS['lunar-lease']();w.begin();w.down();advance(w,6);assert.equal(w.snapshot().phase,'lost');w.destroy();
  const c=ODD_WORLDS['sugar-snip']();c.begin();c.down();c.up();advance(c,3);assert.equal(c.snapshot().phase,'lost');c.destroy();
});
test('snapshots cannot be used to move objects or manufacture progress',()=>{
  for(const make of Object.values(ODD_WORLDS)){const w=make(),s=w.snapshot();s.controlPoint.x=-999;if(s.path)s.path[0].x=-999;if(s.bins)s.bins[0].type=99;assert.notEqual(w.snapshot().controlPoint.x,-999);if(s.path)assert.notEqual(w.snapshot().path[0].x,-999);w.destroy();}
});
test('retrying a held timber releases the old mouse constraint',()=>{
  const w=ODD_WORLDS['tower-unplug']();w.begin();w.down(w.snapshot().blocks.at(-1));assert.equal(w.snapshot().drag,8);w.retry();assert.equal(w.snapshot().held,false);assert.equal(w.snapshot().drag,null);w.begin();assert.equal(w.down(w.snapshot().blocks.at(-1)),true);w.destroy();
});
