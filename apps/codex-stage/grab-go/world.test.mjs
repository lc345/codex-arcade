import test from 'node:test';
import assert from 'node:assert/strict';
import {createGrabWorld,STAGES,ITEMS} from './world.js';
import {playGrab} from '../../../tools/grab-replay.mjs';
const tick=(w,sec)=>{for(let n=0;n<Math.ceil(sec*120);n++)w.step(1000/120);};
const until=(w,pred,seconds=20)=>{for(let n=0;n<seconds*120;n++){if(pred(w.snapshot()))return true;w.step(1000/120);}return false;};
const target=(w,id)=>until(w,s=>{const o=s.items.find(i=>i.id===id);if(!o||o.collected)return false;const a=Math.atan2(o.x-s.origin.x,o.y-s.origin.y);return s.mode==='aim'&&Math.abs(s.angle-a)<.008;});
test('ready is inert, first shot is immediate, and repeated taps cannot create score or extra hooks',()=>{
  const w=createGrabWorld();const before=w.snapshot();tick(w,10);assert.deepEqual(w.snapshot(),before);assert.equal(w.begin(),true);assert.equal(w.tap(),true);assert.equal(w.snapshot().mode,'out');
  for(let n=0;n<100;n++)assert.equal(w.tap(),false);assert.equal(w.snapshot().score,0);assert.equal(w.snapshot().shots,1);w.destroy();
});
test('a real hook hit attaches a Matter constraint but only delivery awards the listed value',()=>{
  const w=createGrabWorld();w.begin();assert.equal(target(w,'a-gem'),true);w.tap();assert.equal(until(w,s=>s.grabId==='a-gem'),true);const caught=w.snapshot();assert.equal(caught.score,0);assert.equal(caught.constraints,1);
  assert.equal(until(w,s=>s.items.find(i=>i.id==='a-gem').collected),true);assert.equal(w.snapshot().score,ITEMS.gem.value);assert.equal(w.snapshot().constraints,0);w.destroy();
});
test('a miss returns an empty claw and earns nothing',()=>{
  const w=createGrabWorld();w.begin();until(w,s=>s.angle<-.99);w.tap();assert.equal(until(w,s=>s.mode==='aim'),true);assert.equal(w.snapshot().score,0);assert.equal(w.snapshot().misses,1);w.destroy();
});
test('the heavy anvil has a genuinely slower retrieval than a lightweight gem',()=>{
  const duration=id=>{const w=createGrabWorld();w.begin();assert.ok(target(w,id));w.tap();assert.ok(until(w,s=>s.grabId===id));const at=w.snapshot().time;assert.ok(until(w,s=>s.items.find(i=>i.id===id).collected));const dt=w.snapshot().time-at;w.destroy();return dt;};
  assert.ok(duration('a-anvil')>duration('a-gem')*1.6);
});
test('waiting loses, retry preserves the current round and resets that round rather than farming points',()=>{
  const w=createGrabWorld({stage:1});w.begin();tick(w,80);assert.equal(w.snapshot().phase,'lost');const frozen=w.snapshot();tick(w,3);assert.deepEqual(w.snapshot(),frozen);w.retry();assert.equal(w.snapshot().stage,1);assert.equal(w.snapshot().phase,'ready');assert.equal(w.snapshot().score,0);w.destroy();
});
test('stop freezes a travelling hook and rejects every gameplay action',()=>{
  const w=createGrabWorld();w.begin();w.tap();tick(w,.2);w.stop();const s=w.snapshot();tick(w,5);assert.deepEqual(w.snapshot(),s);assert.equal(w.tap(),false);assert.equal(w.begin(),false);assert.equal(w.next(),false);assert.equal(w.retry(),false);w.destroy();assert.equal(w.resume(),false);
});
test('mid-haul checkpoint restores safely ready, retaining the physical catch and exact earned progress',()=>{
  const w=createGrabWorld();w.begin();target(w,'a-gem');w.tap();until(w,s=>s.grabId==='a-gem');tick(w,.3);w.stop();const cp=w.checkpoint(),next=createGrabWorld({checkpoint:cp});
  assert.equal(next.snapshot().phase,'ready');assert.equal(next.snapshot().grabId,'a-gem');assert.equal(next.snapshot().score,0);assert.equal(next.snapshot().constraints,1);const before=next.snapshot();tick(next,3);assert.deepEqual(next.snapshot(),before);
  next.begin();assert.ok(until(next,s=>s.items.find(i=>i.id==='a-gem').collected));assert.equal(next.snapshot().score,ITEMS.gem.value);assert.ok(JSON.stringify(cp).length<6000);w.destroy();next.destroy();
});
test('clock is a visible time bonus, earned once and only upon delivery',()=>{
  const w=createGrabWorld();w.begin();assert.ok(target(w,'a-clock'));w.tap();assert.ok(until(w,s=>s.grabId==='a-clock'));assert.equal(w.snapshot().bonus,0);assert.ok(until(w,s=>s.items.find(i=>i.id==='a-clock').collected));assert.equal(w.snapshot().bonus,6);const s=w.snapshot();assert.ok(Math.abs(s.remaining-(STAGES[0].seconds+6-s.time))<.02);w.destroy();
});
test('moving treasure has real changing coordinates while a shutter can block a shot',()=>{
  const w=createGrabWorld({stage:2});w.begin();const first=w.snapshot().items.find(i=>i.kind==='van');tick(w,1);const next=w.snapshot().items.find(i=>i.id===first.id);assert.ok(Math.abs(first.x-next.x)>5);
  assert.equal(until(w,s=>s.mode==='aim'&&Math.abs(s.angle-Math.atan2(s.gate.x-s.origin.x,s.gate.y-s.origin.y))<.012),true);w.tap();assert.equal(until(w,s=>s.mode==='back'),true);assert.equal(w.snapshot().grabId,null);assert.equal(w.snapshot().lastEvent.type,'blocked');w.destroy();
});
test('nonfinite ticks and hostile saves cannot introduce arbitrary state or score',()=>{
  const w=createGrabWorld({checkpoint:{version:1,stage:99,time:-2,collected:['invented'],score:99999}});assert.equal(w.snapshot().stage,0);assert.equal(w.snapshot().score,0);w.begin();const s=w.snapshot();for(const ms of [NaN,Infinity,-1])w.step(ms);assert.deepEqual(w.snapshot(),s);
  const snap=w.snapshot();snap.items[0].collected=true;assert.equal(w.snapshot().items[0].collected,false);w.destroy();
});
test('all three authored boards can be cleared by timed taps without changing any game state',()=>{
  const events=[],w=createGrabWorld({onEvent:e=>events.push(e)}),result=playGrab(w);
  assert.equal(result.snapshot.phase,'won',JSON.stringify(result.snapshot));assert.deepEqual(result.stages,[0,1,2]);assert.ok(result.snapshot.banked>=1500);assert.equal(events.filter(e=>e.type==='win').length,3);assert.ok(events.filter(e=>e.type==='delivered').length>=9);w.destroy();
});
test('compact boards keep readable spacing, actual collisions and all three playable rounds',()=>{
  const w=createGrabWorld({compact:true}),s=w.snapshot();assert.equal(s.compact,true);assert.ok(s.items.every(i=>i.x>260&&i.x<710));const result=playGrab(w);assert.equal(result.snapshot.phase,'won');const next=createGrabWorld({checkpoint:w.checkpoint()});assert.equal(next.snapshot().compact,true);w.destroy();next.destroy();
});
test('the third cabinet gold price stays clear of the rock below in both layouts',()=>{
  for(const compact of [false,true]){
    const w=createGrabWorld({stage:2,compact}),s=w.snapshot(),gold=s.items.find(i=>i.id==='c-gold'),rock=s.items.find(i=>i.id==='c-rock');
    assert.ok(Math.hypot(gold.x-rock.x,gold.y+gold.r+12-rock.y)>rock.r+10,'price needs clearance below the gold');w.destroy();
  }
});
