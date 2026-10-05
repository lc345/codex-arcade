import test from 'node:test';
import assert from 'node:assert/strict';
import {createReelWorld, fishMove, FISH} from './world.js';

const tick=(w,seconds)=>{for(let i=0;i<seconds*120;i++)w.step(1000/120);};
function play(w){
  w.input(true);
  for(let i=0;i<120*100&&w.snapshot().phase==='playing';i++){
    const s=w.snapshot();w.input(!['surge','dive','turn'].includes(s.move));w.step(1000/120);
  }
}
test('ready fish never progresses by waiting or unrelated input',()=>{
  const w=createReelWorld(),before=w.snapshot();tick(w,30);assert.deepEqual(w.snapshot(),before);
  for(const value of [undefined,0,1,'press',{},NaN])assert.equal(w.input(value),false);
  assert.equal(w.input(false),false);assert.equal(w.snapshot().phase,'ready');
});
test('holding pulls the fish closer and releasing pays line out without rewarding taps',()=>{
  const w=createReelWorld();w.input(true);tick(w,1);const near=w.snapshot();assert.ok(near.distance<FISH[0].distance);
  w.input(false);tick(w,.6);assert.ok(w.snapshot().distance>near.distance);assert.equal(w.snapshot().catches,0);
});
test('every fish can be landed with only hold and release through its visible behaviour',()=>{
  const w=createReelWorld(),phases=new Set();
  for(let j=0;j<3;j++){
    play(w);const s=w.snapshot();phases.add(s.phase);assert.equal(s.stage,j);assert.ok(s.distance<=1.2);assert.equal(s.catches,j+1);assert.ok(s.time>5&&s.time<100);
    if(j<2){assert.equal(s.phase,'caught');assert.equal(w.next(),true);assert.equal(w.snapshot().phase,'ready');}
  }
  assert.equal(w.snapshot().phase,'won');assert.equal(w.next(),false);
});
test('never releasing snaps the line; abandoning the reel loses the hook',()=>{
  for(let stage=0;stage<3;stage++){
    const w=createReelWorld({stage});w.input(true);tick(w,40);assert.equal(w.snapshot().phase,'lost');assert.equal(w.snapshot().reason,'line');
    w.retry();w.input(true);w.input(false);tick(w,15);assert.equal(w.snapshot().phase,'lost');assert.equal(w.snapshot().reason,'slack');
  }
});
test('quick repetitive clicking is not a substitute for watching the fish',()=>{
  const w=createReelWorld();
  for(let i=0;i<120*120&& !['caught','lost'].includes(w.snapshot().phase);i++){w.input(i%12<6);w.step(1000/120);}
  assert.notEqual(w.snapshot().phase,'caught');assert.equal(w.snapshot().catches,0);
});
test('fish have different readable moves with advance warning and a recovery window',()=>{
  const sets=FISH.map((_,j)=>new Set(Array.from({length:200},(_,i)=>fishMove(j,i/10).id)));
  assert.ok(sets[0].has('surge'));assert.ok(sets[1].has('dive'));assert.ok(sets[2].has('turn'));
  for(let j=0;j<3;j++){assert.ok(sets[j].has('tell'));assert.ok(sets[j].has('rest'));}
});
test('stop freezes snapshots and events; checkpoint resumes safely with no held input',()=>{
  const events=[],w=createReelWorld({onEvent:e=>events.push(e)});w.input(true);tick(w,2);
  w.stop();const before=w.snapshot(),saved=w.checkpoint(),count=events.length;tick(w,30);
  assert.deepEqual(w.snapshot(),before);assert.equal(w.input(true),false);assert.equal(w.retry(),false);assert.equal(events.length,count);
  const r=createReelWorld({checkpoint:saved});assert.equal(r.snapshot().phase,'ready');assert.equal(r.snapshot().held,false);assert.equal(r.snapshot().distance,before.distance);
  const resting=r.snapshot();tick(r,5);assert.deepEqual(r.snapshot(),resting);r.input(true);tick(r,.1);assert.ok(r.snapshot().time>resting.time);
});
test('checkpoint filters private fields, rejects corrupt values, and preserves earned catches',()=>{
  for(const checkpoint of [null,{version:1,stage:99},{version:1,stage:0,time:Infinity,distance:-20,prompt:'private'},'bad']){
    const w=createReelWorld({checkpoint});assert.equal(w.snapshot().stage,0);assert.equal(w.snapshot().phase,'ready');assert.ok(!JSON.stringify(w.checkpoint()).includes('private'));
  }
  const w=createReelWorld();play(w);const r=createReelWorld({checkpoint:w.checkpoint()});assert.equal(r.snapshot().phase,'caught');assert.equal(r.snapshot().catches,1);assert.equal(r.next(),true);
});
test('cancel clears pressure input, retry keeps chapter, and destroy rejects all actions',()=>{
  const w=createReelWorld({stage:1});w.input(true);tick(w,1);w.cancel();assert.equal(w.snapshot().held,false);
  w.retry();assert.equal(w.snapshot().stage,1);assert.equal(w.snapshot().time,0);assert.equal(w.snapshot().phase,'ready');
  w.destroy();assert.equal(w.input(true),false);assert.equal(w.next(),false);assert.equal(w.retry(),false);
});
