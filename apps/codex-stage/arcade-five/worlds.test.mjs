import test from 'node:test';
import assert from 'node:assert/strict';
import {createPanWorld} from './pan-flip.js';
import {createBankWorld} from './bank-shot.js';
import {createPaperWorld} from './paper-racer.js';
import {createCapWorld} from './cap-cup.js';
import {createGliderWorld} from './paper-glider.js';
import {replayFive} from '../../../tools/arcade-five-replays.mjs';

export const factories={ 'pan-flip':createPanWorld,'bank-shot':createBankWorld,'paper-racer':createPaperWorld,'cap-cup':createCapWorld,'paper-glider':createGliderWorld };
const tick=(w,s)=>{for(let i=0;i<s*120;i++)w.step(1000/120);};
test('idle cooking burns rather than granting a timed victory',()=>{const w=createPanWorld();w.begin();tick(w,8);assert.equal(w.snapshot().phase,'lost');assert.equal(w.snapshot().score,0);w.destroy();});
test('bank shots need a real drag; cancellation and short clicks spend nothing',()=>{const w=createBankWorld();w.begin();const p=w.snapshot().ball;w.down(p);w.up(p);assert.equal(w.snapshot().shots,4);w.down(p);w.move({x:120,y:320});w.cancel();w.up({x:120,y:320});tick(w,2);assert.equal(w.snapshot().shots,4);assert.equal(w.snapshot().score,0);w.destroy();});
for(const [id,make] of [['paper-racer',createPaperWorld],['paper-glider',createGliderWorld]])for(const held of [false,true])test(`${id}: ${held?'holding forever':'no input'} loses; participation is required`,()=>{const w=make();w.begin();if(held)w.down();tick(w,30);assert.equal(w.snapshot().phase,'lost');w.destroy();});
test('a cap only scores inside the cup; repeated presses cannot spawn extra projectiles',()=>{const w=createCapWorld();w.begin();w.down();const initial=w.snapshot();for(let i=0;i<20;i++)w.down();assert.deepEqual(w.snapshot(),initial);assert.equal(w.snapshot().scored,0);tick(w,.2);assert.equal(w.snapshot().scored,0);w.destroy();});
for(const [id,make] of Object.entries(factories)){
  test(`${id}: completed checkpoints restore a consistent result without replaying sound`,()=>{
    const events=[],w=make({checkpoint:{version:1,id,stage:2,phase:'won'},onEvent:e=>events.push(e)}),s=w.snapshot();
    assert.equal(s.phase,'won');assert.ok(s.score>0);assert.ok(s.progress>=s.goal);assert.deepEqual(events,[]);w.destroy();
  });
  test(`${id}: all three rounds are winnable through legal player inputs`,()=>{const {s,stages}=replayFive(id);assert.equal(s.phase,'won',JSON.stringify(s));assert.deepEqual(stages,[0,1,2]);});
  test(`${id}: ready waits for the player; task stop freezes the world and rejects input`,()=>{
    const w=make(),ready=w.snapshot();tick(w,2);assert.deepEqual(w.snapshot(),ready);assert.equal(w.begin(),true);w.down({x:480,y:320});tick(w,.3);w.stop();const stopped=w.snapshot();tick(w,5);assert.deepEqual(w.snapshot(),stopped);assert.equal(w.down({x:300,y:200}),false);assert.equal(w.up({x:300,y:200}),false);assert.equal(w.retry(),false);w.destroy();
  });
  test(`${id}: bounded checkpoint restores the current round ready with no held input`,()=>{
    const w=make();w.begin();w.down({x:400,y:300});tick(w,.2);w.cancel();const cp=w.checkpoint();assert.ok(JSON.stringify(cp).length<500);const next=make({checkpoint:cp});assert.equal(next.snapshot().phase,'ready');assert.equal(next.snapshot().held,false);assert.equal(next.snapshot().stage,0);const ready=next.snapshot();tick(next,1);assert.deepEqual(next.snapshot(),ready);w.destroy();next.destroy();
  });
  test(`${id}: invalid inputs, nonfinite time and malformed progress cannot corrupt state`,()=>{
    const w=make({checkpoint:{id,version:1,stage:99,phase:'won',secret:'private',score:999999}});assert.equal(w.snapshot().stage,0);assert.equal(w.snapshot().score,0);w.begin();const s=w.snapshot();for(const dt of [NaN,Infinity,-10])w.step(dt);assert.deepEqual(w.snapshot(),s);assert.equal(w.down({x:NaN,y:0}),false);assert.ok(!JSON.stringify(w.checkpoint()).includes('private'));w.destroy();
  });
}
