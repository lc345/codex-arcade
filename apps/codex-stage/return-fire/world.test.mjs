import test from 'node:test';
import assert from 'node:assert/strict';
import { createReturnWorld, STAGES } from './world.js';

const tick = (w, seconds) => { for (let n=0;n<Math.ceil(seconds*120);n++) w.step(1000/120); };
export function pilot(w, maxSeconds=180) {
  const stages=new Set();
  for(let n=0;n<maxSeconds*120;n++) {
    const s=w.snapshot(); stages.add(s.stage);
    if(['won','lost'].includes(s.phase)) return {s,stages:[...stages]};
    if(s.phase==='ready') w.begin();
    let x=480;
    const threat=s.hazards.find(h=>h.remaining>0 && h.y+h.h/2>480);
    if(threat) x=threat.x<480?Math.min(790,threat.x+threat.w/2+95):Math.max(170,threat.x-threat.w/2-95);
    w.move(x,525);
    w.hold(s.heat<.78 && s.charge<7 && !s.lockout && s.phase==='playing');
    w.step(1000/120);
  }
  return {s:w.snapshot(),stages:[...stages]};
}
test('ready cannot advance or score; begin requires active runtime',()=>{
  const w=createReturnWorld();tick(w,3);assert.equal(w.snapshot().time,0);
  assert.equal(w.snapshot().phase,'ready');w.stop();assert.equal(w.begin(),false);
});
test('ordinary shots are absorbed by a held shield and only release creates return fire',()=>{
  const w=createReturnWorld();w.begin();w.hold(true);
  for(let n=0;n<500&&w.snapshot().charge<4;n++) w.step(1000/120);
  const s=w.snapshot();assert.ok(s.charge>=4);assert.equal(s.player.hp,4);assert.equal(s.returns.length,0);
  w.hold(false);assert.equal(w.snapshot().charge,0);assert.ok(w.snapshot().returns.length>=4);
  tick(w,.7);assert.ok(w.snapshot().bossHp<STAGES[0].hp);assert.ok(w.snapshot().damage>0);
});
test('empty repeated clicks do not award damage or score',()=>{
  const w=createReturnWorld();w.begin();for(let n=0;n<30;n++){w.hold(true);w.hold(false);}
  assert.equal(w.snapshot().damage,0);assert.equal(w.snapshot().returns.length,0);
});
test('greedy continuous holding overloads the shield and cannot win',()=>{
  const w=createReturnWorld();w.begin();w.hold(true);tick(w,30);
  assert.ok(w.snapshot().overloads>0);assert.notEqual(w.snapshot().phase,'won');assert.equal(w.snapshot().damage,0);
});
test('cancel clears the gesture without firing the stored charge',()=>{
  const w=createReturnWorld();w.begin();w.hold(true);tick(w,2.1);w.cancel();
  assert.equal(w.snapshot().held,false);assert.equal(w.snapshot().returns.length,0);
});
test('telegraphed red hazards damage through the shield',()=>{
  const w=createReturnWorld();w.begin();
  for(let n=0;n<1000;n++) {const s=w.snapshot();w.hold(s.heat<.65);w.step(1000/120);if(w.snapshot().hazardHits)break;}
  assert.ok(w.snapshot().hazardHits>0);assert.ok(w.snapshot().player.hp<4);
});
test('all three stages are winnable with movement, hold and release alone',()=>{
  const events=[];const w=createReturnWorld({onEvent:e=>events.push(e.type)});const result=pilot(w);
  assert.equal(result.s.phase,'won',JSON.stringify(result.s));assert.deepEqual(result.stages,[0,1,2]);
  assert.equal(events.filter(e=>e==='break').length,2);assert.equal(events.filter(e=>e==='win').length,1);
  assert.ok(result.s.absorbed>15);assert.ok(result.s.shots>2);assert.ok(result.s.time>15);
});
test('stop freezes every gameplay value and rejects inputs; resume is safely ready',()=>{
  const w=createReturnWorld();w.begin();w.hold(true);tick(w,2);w.stop();const saved=JSON.stringify(w.snapshot());
  tick(w,4);w.move(10,20);w.hold(true);w.begin();assert.equal(JSON.stringify(w.snapshot()),saved);
  w.resume();assert.equal(w.snapshot().phase,'ready');assert.equal(w.snapshot().held,false);
});
test('checkpoint stores only cleared stages and bounded numbers, never held input or bullets',()=>{
  const w=createReturnWorld();pilot(w);const cp=w.checkpoint();assert.ok(JSON.stringify(cp).length<250);
  const restored=createReturnWorld({checkpoint:cp});assert.equal(restored.snapshot().stage,2);assert.equal(restored.snapshot().phase,'ready');
  assert.equal(restored.snapshot().charge,0);assert.equal(restored.snapshot().held,false);assert.equal(restored.snapshot().bullets.length,0);
  for(const bad of [null,{version:1,stage:999},{version:1,stage:-1},{version:1,stage:NaN},{version:2,stage:1}]) assert.equal(createReturnWorld({checkpoint:bad}).snapshot().stage,0);
});
test('frame-time clamping, nonfinite input and defensive snapshots',()=>{
  const w=createReturnWorld();w.begin();w.move(NaN,Infinity);w.step(NaN);w.step(-50);w.step(100000);
  assert.ok(w.snapshot().time<=.051);assert.ok(Number.isFinite(w.snapshot().player.x));
  const s=w.snapshot();s.player.hp=0;assert.equal(w.snapshot().player.hp,4);
});
test('retry restarts the current stage without held input and destroy is final',()=>{
  const w=createReturnWorld({checkpoint:{version:1,stage:1}});w.begin();w.hold(true);tick(w,2);w.retry();
  assert.equal(w.snapshot().stage,1);assert.equal(w.snapshot().phase,'ready');assert.equal(w.snapshot().held,false);
  w.destroy();w.resume();assert.equal(w.begin(),false);
});
test('the exposed core physically charges into its marked lane',()=>{
  const w=createReturnWorld({checkpoint:{version:1,stage:2}});w.begin();w.move(300,520);tick(w,4.65);
  const s=w.snapshot();assert.ok(s.hazards.some(h=>h.kind==='slam'&&h.warn<0));assert.ok(s.boss.y>350);assert.ok(Math.abs(s.boss.x-300)<3);
  assert.ok(Math.abs(s.target.y-s.boss.y)<40);
});
test('losing is terminal until retry, with no late shots changing the result',()=>{
  const w=createReturnWorld();w.begin();w.hold(true);tick(w,90);assert.equal(w.snapshot().phase,'lost');
  const {phase,damage,stage,bossHp}=w.snapshot();tick(w,10);
  const after=w.snapshot();assert.deepEqual({phase:after.phase,damage:after.damage,stage:after.stage,bossHp:after.bossHp},{phase,damage,stage,bossHp});
});
