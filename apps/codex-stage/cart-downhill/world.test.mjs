import test from 'node:test';
import assert from 'node:assert/strict';
import {createCartWorld, roadAt} from './world.js';
import {prepareRapier} from '../vendor/rapier.js';
await prepareRapier();

const tick=(w,n=120)=>{for(let i=0;i<n;i++)w.step(1000/120);};
test('cart stays ready until a player acts; stop freezes everything and rejects input',()=>{
  const w=createCartWorld();const before=w.snapshot();tick(w);assert.deepEqual(w.snapshot(),before);
  assert.equal(w.input(NaN,false),false);w.input(0,false);tick(w,360);assert.ok(w.snapshot().distance>1);
  w.stop();const s=w.snapshot();tick(w);assert.deepEqual(w.snapshot(),s);assert.equal(w.input(1,true),false);w.destroy();
});
test('braking reduces actual vehicle speed and cancellation clears held input',()=>{
  const w=createCartWorld();w.input(0,false);tick(w,480);const fast=w.snapshot().speed;
  w.input(0,true);tick(w,120);assert.ok(w.snapshot().speed<fast*.55);w.cancel();assert.equal(w.snapshot().braking,false);w.destroy();
});
test('checkpoints contain only bounded game progress and restore parked with no held gesture',()=>{
  const w=createCartWorld();w.input(0,false);tick(w,240);const cp=w.checkpoint();w.stop();
  const r=createCartWorld({checkpoint:cp});assert.equal(r.snapshot().phase,'ready');assert.equal(r.snapshot().speed,0);assert.equal(r.snapshot().braking,false);
  const bad=createCartWorld({checkpoint:{version:1,gate:99,cake:10000,secret:'private'}});assert.equal(bad.snapshot().distance,0);assert.ok(!JSON.stringify(bad.checkpoint()).includes('private'));
  w.destroy();r.destroy();bad.destroy();
});
test('the road has three continuous districts and ends at a real delivery bay',()=>{
  assert.equal(roadAt(0).district,0);assert.equal(roadAt(100).district,1);assert.equal(roadAt(200).district,2);
  for(let d=0;d<260;d++)assert.ok(Math.abs(roadAt(d+.01).height-roadAt(d).height)<.02);
});
function drive(w,mode='safe'){
  for(let i=0;i<18000;i++){
    const s=w.snapshot();if(['won','lost'].includes(s.phase))break;
    const target=roadAt(s.distance+9).center-(mode==='crates'&&s.distance<40?2.5:0);
    const aim=mode==='straight'?0:mode==='swerve'&&s.distance>16?1:(Math.atan2(target-s.x,9)-s.heading)*2;
    w.input(Math.max(-1,Math.min(1,aim)),mode==='safe'&&s.speed>(s.distance>247?1.5:7));w.step(1000/120);
  }
}
test('real steering and braking deliver the cake through all three districts',()=>{
  const w=createCartWorld();drive(w);const s=w.snapshot();assert.equal(s.phase,'won');assert.equal(s.gate,2);assert.ok(s.cake>0&&s.distance>254&&s.speed<2.2);assert.equal(s.lostCargo,0);w.destroy();
});
test('hitting crates really scatters bodies and produces collision feedback',()=>{
  const events=[],w=createCartWorld({onEvent:e=>events.push(e)}),p=w.state().props[0].p;
  drive(w,'crates');const q=w.state().props[0].p;assert.ok(Math.hypot(q.x-p.x,q.z-p.z)>2);assert.ok(events.some(e=>e.type==='crash'));assert.notEqual(w.snapshot().phase,'won','cannot coast past the delivery without stopping');w.destroy();
});
test('blindly going straight fails, wild steering spills actual cargo, and stopped bodies stay fixed',()=>{
  for(const mode of ['straight','swerve']){const w=createCartWorld();drive(w,mode);assert.equal(w.snapshot().phase,'lost');if(mode==='swerve')assert.ok(w.snapshot().lostCargo>0);w.stop();const state=w.state();tick(w,300);assert.deepEqual(w.state(),state);w.destroy();}
});
test('a traffic hit turns the cart and spills goods, but braking and counter-steering can recover',()=>{
  const w=createCartWorld({checkpoint:{version:1,gate:2,cake:100}});
  for(let i=0;i<16000;i++){
    const s=w.snapshot();if(['won','lost'].includes(s.phase))break;
    const steering=s.time>5.8?Math.max(-1,Math.min(1,(Math.atan2(roadAt(s.distance+8).center-s.x,8)-s.heading)*2.5)):0;
    w.input(steering,s.time>5.8&&s.speed>(s.time<10?2.5:s.distance>247?1.5:5));w.step(1000/120);
  }
  assert.equal(w.snapshot().phase,'won');assert.ok(w.snapshot().crashes>0);assert.ok(w.snapshot().lostCargo>0);w.destroy();
});
