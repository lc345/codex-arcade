import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvasPack} from './packs/canvas-runtime.js';
const flush=()=>new Promise(r=>setImmediate(r));
function fixture(t,painter){
  const saved=Object.fromEntries(['document','window','requestAnimationFrame','cancelAnimationFrame'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)])),frames=new Map();let serial=0;
  const doc=new EventTarget();doc.hidden=false;
  Object.assign(globalThis,{document:doc,window:new EventTarget(),requestAnimationFrame:fn=>{frames.set(++serial,fn);return serial;},cancelAnimationFrame:id=>frames.delete(id)});
  const restore=()=>{for(const [k,d]of Object.entries(saved)){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}};
  const stats={created:0,destroyed:0,paints:0,disposed:0,sound:false,states:[]},canvas=new EventTarget();
  const deps={createWorld(){stats.created++;let active=true;return {snapshot:()=>({phase:'ready',stage:0,active}),checkpoint:()=>({version:1,stage:0}),cancel(){},stop(){active=false;},destroy(){stats.destroyed++;},begin(){},step(){},hold(){},retry(){}};},
    async createPainter(){if(painter)await painter();return {draw(){stats.paints++;},dispose(){stats.disposed++;}};},
    createSound(){return {setActive(v){stats.sound=v;},setMuted(){},unlock(){},voices:()=>0,stop(){},dispose(){},event(){}};}};
  const r=createCanvasPack(canvas,{id:'statue-act',hint:'hold',levels:['one']},deps,{onState:e=>stats.states.push(e.type)});t.after(()=>{try{r.destroy();}finally{restore();}});return {r,stats,frames};
}
test('Canvas artwork failures are retryable without starting a new agent task',async t=>{
  let attempts=0;const {r,stats,frames}=fixture(t,()=>{if(++attempts===1)throw Error('missing local asset');});
  await r.start();assert.equal(r.snapshot.phase,'error');assert.equal(frames.size,0);assert.equal(r.retry(),true);await flush();
  assert.equal(r.snapshot.phase,'ready');assert.equal(attempts,2);assert.equal(stats.destroyed,1);assert.equal(frames.size,1);assert.ok(!stats.states.includes('stopped'));
});
test('late Canvas resources dispose instead of restarting a completed task',async t=>{
  let resolve;const {r,stats,frames}=fixture(t,()=>new Promise(v=>{resolve=v;}));const pending=r.start();r.stop();resolve();await pending;
  assert.equal(r.active,false);assert.equal(frames.size,0);assert.equal(stats.disposed,1);assert.equal(stats.paints,0);assert.equal(stats.sound,false);
});
test('a repeated task reuses art but destroys its previous world; cleanup is idempotent',async t=>{
  let loads=0;const {r,stats,frames}=fixture(t,()=>loads++);await r.start();r.stop();await r.start();
  assert.equal(loads,1);assert.equal(stats.created,2);assert.equal(stats.destroyed,1);r.setPaused(true);assert.equal(frames.size,0);assert.equal(stats.sound,false);
  r.setPaused(false);assert.equal(frames.size,1);r.destroy();r.destroy();assert.equal(stats.destroyed,2);assert.equal(stats.disposed,1);assert.equal(frames.size,0);
});
