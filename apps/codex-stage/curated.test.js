import test from 'node:test';
import assert from 'node:assert/strict';
import {GAME_CATALOG,createGamePicker} from './collection/catalog.js';
import {createPackHost} from './packs/host.js';
import {buildReviewedPack} from './packs/build.js';
test('curated bag includes seven retained approved games, keeps a run stable and avoids adjacent genres',()=>{
  const expected=['toast-hop','sky-stack','press-run','swing-post','marble-demolition','magnet-rampage','return-fire'];
  assert.deepEqual(GAME_CATALOG.filter(g=>g.curated).map(g=>g.id).sort(),expected.sort());
  const p=createGamePicker(()=>.3),seen=[];
  for(let n=0;n<28;n++){const g=p.pick('r'+n,null,'curated');assert.ok(expected.includes(g.id));assert.equal(p.pick('r'+n,null,'curated').id,g.id);seen.push(g);}
  for(let n=0;n<28;n+=7)assert.equal(new Set(seen.slice(n,n+7).map(g=>g.id)).size,7);
  for(let n=1;n<seen.length;n++){assert.notEqual(seen[n].id,seen[n-1].id);assert.notEqual(seen[n].category,seen[n-1].category);}
});
test('retained random pool stays seven and curated mode never reloads the current task',async()=>{
  const p=createGamePicker(()=>.3);assert.equal(new Set(Array.from({length:7},(_,n)=>p.pick(n).id)).size,7);
  let loads=0;const h=createPackHost({}, {}, async()=>{loads++;return()=>({start(){},stop(){},destroy(){},setMuted(){},setReduced(){},setPaused(){},setLevel(){},snapshot:{phase:'ready'}});});
  h.setMode('curated');h.start({runId:'a'});await new Promise(r=>setImmediate(r));const id=h.program.id;
  assert.equal(h.mode,'curated');assert.equal(h.random,true);h.setMode('random');h.start({runId:'a'});assert.equal(h.program.id,id);assert.equal(loads,1);h.destroy();
});
test('return-fire is a reviewed self-contained bounded pack with local art, not a URL embed',()=>{
  const p=buildReviewedPack('return-fire');assert.ok(p.manifest.bytes<8*1024*1024);assert.deepEqual(p.manifest.permissions,[]);
  assert.ok(p.source.includes('data:image/png;base64,'));assert.ok(!p.source.includes('import.meta'));assert.ok(!p.source.includes('document.getElementById'));
  assert.doesNotThrow(()=>new Function('return '+p.factory));
});
