import test from 'node:test';
import assert from 'node:assert/strict';
import {GAUNTLET_WORLDS as worlds} from './worlds.js';
import {gauntletRules} from './rules.js';
import {playGauntlet} from '../../../tools/gauntlet-replays.mjs';
const tick=(w,sec)=>{for(let i=0;i<sec*120;i++)w.step(1000/120);};
test('territory capture preserves every hostile region, not just one enemy',()=>{
 const {capture}=gauntletRules(),w=8,h=6,board=Array.from({length:w*h},(_,i)=>i<w||i>=w*(h-1)||i%w===0||i%w===w-1?1:0),path=Array.from({length:h},(_,y)=>y*w+4),next=capture(board,w,h,[18,22],path);
 assert.equal(next[18],0);assert.equal(next[22],0);assert.equal(next[20],1);
});
test('later territory rounds really introduce separate moving threats',()=>{
 for(let stage=0;stage<3;stage++){const w=worlds['territory-cut']({checkpoint:{version:1,id:'territory-cut',stage,phase:'ready'}});assert.equal(w.snapshot().enemies.length,stage+1);w.destroy();}
});
test('holding forever fails balance and pressure, and random beat spam fails rhythm',()=>{
 for(const id of ['tightrope-club','airlock-queue']){const w=worlds[id]();w.begin();w.down();tick(w,60);assert.equal(w.snapshot().phase,'lost',id);w.destroy();}
 const w=worlds['tempo-steps']();w.begin();for(let i=0;i<3;i++){w.down();w.up();}assert.equal(w.snapshot().phase,'lost');w.destroy();
});
test('blind needle launch really collides, rejected mirror clicks do not spend moves',()=>{
 const w=worlds['needle-rush']();w.begin();w.down();w.up();tick(w,1);assert.equal(w.snapshot().phase,'lost');assert.equal(w.snapshot().progress,0);w.destroy();
 const m=worlds['mirror-vault']();m.begin();const n=m.snapshot().moves;m.down({x:30,y:590});assert.equal(m.snapshot().moves,n);m.destroy();
});
test('puzzle boundary exploits and cancelled drags never award victory',()=>{
 const w=worlds['crate-escape']();w.begin();const s=w.snapshot();w.down({x:900,y:80});assert.equal(w.snapshot().player,s.player);assert.equal(w.snapshot().moves,s.moves);w.destroy();
 const t=worlds['territory-cut']();t.begin();t.down({x:181,y:143});t.move({x:260,y:210});t.cancel();assert.equal(t.snapshot().progress,0);assert.deepEqual(t.snapshot().trail,[]);t.destroy();
});
test('frame-rate independent timing and balancing remain solvable',()=>{
 for(const id of ['needle-rush','tightrope-club','twin-tide','tempo-steps','airlock-queue'])for(const stepMs of [16,25,33])assert.equal(playGauntlet(id,{stepMs}).phase,'won',id+' '+stepMs);
});
