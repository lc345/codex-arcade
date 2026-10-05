import test from 'node:test';
import assert from 'node:assert/strict';
import {CHALLENGE_WORLDS} from './worlds.js';
import {playChallenge} from '../../../tools/challenge-replays.mjs';
const advance=(w,t)=>{for(let i=0;i<t*120;i++)w.step(1000/120);};
for(const [id,make] of Object.entries(CHALLENGE_WORLDS)){
  test(`${id}: all three rounds complete using legal controls`,()=>{const r=playChallenge(id);assert.equal(r.snapshot.phase,'won',JSON.stringify(r.snapshot));assert.deepEqual(r.stages,[0,1,2]);});
  test(`${id}: inactivity is not a victory`,()=>{const w=make();w.begin();advance(w,65);assert.equal(w.snapshot().phase,'lost');w.destroy();});
  test(`${id}: input guards, cancellation, stop and disposal freeze the world`,()=>{const events=[],w=make({onEvent:e=>events.push(e)}),ready=w.snapshot();advance(w,1);assert.deepEqual(w.snapshot(),ready);w.begin();assert.equal(w.move({x:Infinity,y:0}),false);w.down({x:480,y:400});advance(w,.1);w.cancel();assert.equal(w.snapshot().held,false);w.stop();const frozen=w.snapshot();advance(w,5);assert.deepEqual(w.snapshot(),frozen);assert.equal(w.down(),false);assert.equal(w.up(),false);w.destroy();const n=events.length;advance(w,1);assert.equal(events.length,n);});
  test(`${id}: bounded saves restore to ready or an inert completed round`,()=>{const w=make({checkpoint:{version:1,id,stage:100,phase:'won'}});assert.equal(w.snapshot().stage,0);w.begin();advance(w,.3);const cp=w.checkpoint();assert.ok(JSON.stringify(cp).length<200);const r=make({checkpoint:cp});assert.equal(r.snapshot().phase,'ready');assert.equal(r.snapshot().held,false);w.destroy();r.destroy();const events=[],done=make({checkpoint:{version:1,id,stage:2,phase:'won'},onEvent:e=>events.push(e)}),s=done.snapshot();assert.ok(s.progress>=s.goal);assert.ok(s.score>0);advance(done,3);assert.deepEqual(done.snapshot(),s);assert.deepEqual(events,[]);done.destroy();});
}
test('challenge rules reject brute-force shortcuts, not just inactivity',()=>{
  const cases=[
    ['crosswalk-zero',w=>{w.down();w.up();}],
    ['faultline-drill',w=>{w.down();w.up();}],
    ['laser-limbo',w=>w.move({x:480,y:90})],
    ['neon-coil',w=>{w.down();w.up();}],
    ['freeze-frame',w=>w.down()],
    ['copper-balance',w=>{w.down({x:320,y:350});w.up();}],
    ['traffic-tangle',w=>{w.down();w.up();}],
    ['shield-waltz',w=>w.move({x:650,y:320})],
  ];
  for(const [id,input]of cases){const w=CHALLENGE_WORLDS[id]();w.begin();for(let i=0;i<18000;i++){const s=w.snapshot();if(['won','lost'].includes(s.phase))break;if(s.phase==='cleared'){w.next();w.begin();}input(w);w.step(1000/120);}assert.equal(w.snapshot().phase,'lost',id);w.destroy();}
});
test('dark bridge withholds the answer after lights out and wrong stones fail',()=>{
  const w=CHALLENGE_WORLDS['blackout-bridge']();w.begin();const hints=w.snapshot().hints;assert.equal(hints.length,4);advance(w,3.5);assert.deepEqual(w.snapshot().hints,[]);assert.deepEqual(w.snapshot().passed,[]);w.down({x:340+((hints[0]+1)%3)*140,y:496});w.up();assert.equal(w.snapshot().phase,'lost');w.destroy();
});
test('glass uses actual polygon areas; canceled strokes spend nothing and bad cuts fail',()=>{
  const w=CHALLENGE_WORLDS['glass-divide']();w.begin();w.down({x:320,y:80});w.move({x:320,y:545});w.cancel();w.up({x:320,y:545});assert.equal(w.snapshot().attempts,3);assert.equal(w.snapshot().ratio,null);
  for(let i=0;i<3;i++){w.down({x:320,y:80});w.move({x:320,y:545});w.up({x:320,y:545});assert.ok(Math.abs(w.snapshot().ratio-50)>7);advance(w,1);}assert.equal(w.snapshot().phase,'lost');w.destroy();
});
test('physics packing awards settled cargo, never button presses',()=>{
  const w=CHALLENGE_WORLDS['copper-balance']();w.begin();advance(w,.4);w.down({x:320,y:350});w.up();assert.equal(w.snapshot().placed,1);assert.equal(w.snapshot().progress,0);for(let i=0;i<20;i++){w.down({x:635,y:350});w.up();}assert.equal(w.snapshot().placed,1);advance(w,1.5);assert.equal(w.snapshot().progress,1);w.destroy();
});
test('freeze timing remains playable across different render cadences',()=>{
  for(const stepMs of [1000/120,16,1000/60,20,25,33])assert.equal(playChallenge('freeze-frame',{stepMs}).snapshot.phase,'won',`${stepMs}ms`);
});
test('glass requires a stroke that actually crosses both edges',()=>{
  const w=CHALLENGE_WORLDS['glass-divide']();w.begin();
  for(const [a,b]of [[{x:480,y:300},{x:480,y:430}],[{x:480,y:60},{x:480,y:141}]]){w.down(a);w.move(b);w.up(b);assert.equal(w.snapshot().attempts,3);assert.equal(w.snapshot().ratio,null);}w.destroy();
});
