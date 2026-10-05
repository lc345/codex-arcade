import test from 'node:test';
import assert from 'node:assert/strict';
import {HARDCORE_WORLDS as worlds} from './worlds.js';
import {hardRules} from './rules.js';
import {playHardcore,hardcoreCommand} from '../../../tools/hardcore-replays.mjs';
const tick=(w,sec)=>{for(let i=0;i<sec*120;i++)w.step(1000/120);};
test('reflex games punish early inputs instead of letting click spam win',()=>{
  const w=worlds['flash-dojo']();w.begin();w.down();w.up();assert.equal(w.snapshot().phase,'lost');w.destroy();
  const h=worlds['hex-panic']();h.begin();h.down();tick(h,30);assert.equal(h.snapshot().phase,'lost');h.destroy();
});
test('knight moves consume real tiles, and illegal clicks never move the player',()=>{
  const w=worlds['knight-fall']();w.begin();const s=w.snapshot();w.down({x:20,y:20});assert.equal(w.snapshot().player,s.player);assert.equal(w.snapshot().visited.length,1);w.destroy();
});
test('reverse memory rejects ordinary forward recall and ignores touches during the reveal',()=>{
  const w=worlds['echo-rewind']();w.begin();const a=w.snapshot();w.down({x:380,y:230});assert.equal(w.snapshot().progress,0);tick(w,a.revealEnd+.1);
  const i=a.sequence[0];w.down({x:354+i%3*126,y:201+Math.floor(i/3)*126});assert.equal(w.snapshot().phase,'lost');w.destroy();
});
test('late rounds increase genuine constraints, not just a difficulty label',()=>{
  const read=(id,stage)=>{const w=worlds[id]({checkpoint:{version:1,id,stage,phase:'ready'}}),s=w.snapshot();w.destroy();return s;};
  assert.ok(read('hex-panic',2).gapWidth<read('hex-panic',0).gapWidth);
  assert.ok(read('ratchet-vault',2).catchRadius<read('ratchet-vault',0).catchRadius);
  assert.ok(read('downshaft',2).opening<read('downshaft',0).opening);
  assert.ok(read('magnet-suture',2).halfWidth<read('magnet-suture',0).halfWidth);
  assert.ok(read('flash-dojo',2).window<read('flash-dojo',0).window);
  assert.ok(read('echo-rewind',2).sequence.length>read('echo-rewind',0).sequence.length);
});
test('each relay remains winnable at ordinary and low rendering rates',()=>{
  for(const id of ['ratchet-vault','hex-panic','downshaft','magnet-suture','flash-dojo','rotor-courier'])for(const stepMs of [16,33])assert.equal(playHardcore(id,{stepMs}).phase,'won',id+' '+stepMs);
});
test('numeric inputs cannot teleport precision pieces through obstacles',()=>{
  for(const id of ['magnet-suture','rotor-courier','disc-vault']){const w=worlds[id]();w.begin();const a=w.snapshot().player;w.move({x:900,y:100});w.step(8.4);const b=w.snapshot().player;assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<8,id);w.destroy();}
});
test('polarity boards need several deliberate toggles, not one lucky click',()=>{
  const {polarityPuzzle,solvePolarity}=hardRules();for(let stage=0;stage<3;stage++){const p=polarityPuzzle(stage),solution=solvePolarity(p.state,p.masks);assert.ok(solution.length>=6+stage);assert.ok(solution.length<=p.moves);}
});
test('every visible polarity wire is genuinely bidirectional',()=>{
  const {polarityPuzzle}=hardRules();for(let stage=0;stage<3;stage++){const {masks}=polarityPuzzle(stage);for(let i=0;i<16;i++)for(let j=0;j<16;j++)assert.equal(Boolean(masks[i]>>j&1),Boolean(masks[j]>>i&1),`${stage}: ${i}-${j}`);}
});
