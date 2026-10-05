import test from 'node:test';
import assert from 'node:assert/strict';
import {CENTURY_WORLDS} from './worlds.js';
import {centuryRules} from './rules.js';
import {solveFridge} from '../../../tools/century-replays.mjs';
const step=(w,seconds)=>{for(let n=0;n<seconds*120;n++)w.step(1000/120);};
const make=(t,id)=>{const w=CENTURY_WORLDS[id]();t.after(()=>w.destroy());w.begin();return w;};
const tap=(w,p)=>{w.down(p);w.up(p);};
const stroke=(w,points)=>{w.down(points[0]);points.slice(1).forEach(p=>w.move(p));w.up(points.at(-1));};
test('pouring a full cup of the wrong ingredient fails, not merely fills progress',t=>{
  const w=make(t,'chromatic-lab');w.down({x:680,y:175});step(w,5);assert.equal(w.snapshot().phase,'lost');assert.equal(w.snapshot().progress,0);
});
test('enclosing a curse fails; cancelled and empty loops never collect gems',t=>{
  const w=make(t,'loop-lock');w.down({x:280,y:180});w.move({x:400,y:280});w.cancel();assert.equal(w.snapshot().loops,3);assert.equal(w.snapshot().progress,0);
  const x=480,y=180,r=35;stroke(w,Array.from({length:9},(_,i)=>({x:x+Math.cos(i*Math.PI/4)*r,y:y+Math.sin(i*Math.PI/4)*r})));assert.equal(w.snapshot().phase,'lost');assert.equal(w.snapshot().progress,0);
});
test('a broken rail is rejected; reaching the station without tickets is not success',t=>{
  const w=make(t,'ink-rail');stroke(w,[{x:165,y:320},{x:210,y:540},{x:795,y:430}]);assert.equal(w.snapshot().mode,'draw');
  stroke(w,[{x:165,y:320},{x:400,y:410},{x:795,y:430}]);step(w,20);assert.equal(w.snapshot().phase,'lost');assert.equal(w.snapshot().progress,0);
});
test('soda only removes connected groups and gravity preserves remaining color counts',t=>{
  const w=make(t,'soda-strata'),before=w.snapshot();tap(w,{x:200,y:200});assert.deepEqual(w.snapshot().board,before.board);assert.equal(w.snapshot().moves,before.moves);
  const {sodaGroup,popSoda}=centuryRules(),group=sodaGroup(before.board,0),after=popSoda(before.board,group);assert.ok(group.length>=3);
  for(let color=0;color<3;color++)assert.equal(after.filter(v=>v===color).length,before.board.filter(v=>v===color).length-group.filter(i=>before.board[i]===color).length);
  assert.equal(sodaGroup([0,1,0,1,0,1,...Array(24).fill(-1)],0).length,1);
});
test('holding away from a leak cannot repair it or prevent flooding',t=>{
  const w=make(t,'leak-patrol');w.down({x:100,y:100});step(w,30);assert.equal(w.snapshot().phase,'lost');assert.equal(w.snapshot().progress,0);
});
test('blindly rotating one axle exhausts the finite move budget',t=>{
  const w=make(t,'quarter-turn');for(let i=0;i<4;i++){tap(w,{x:400,y:265});step(w,.25);}assert.equal(w.snapshot().phase,'lost');assert.equal(w.snapshot().moves,0);
});
test('three incorrect stamps fail even when the input is fast',t=>{
  const w=make(t,'stamp-storm');for(let i=0;i<3;i++){step(w,.25);const s=w.snapshot();tap(w,{x:s.seals.every((v,i)=>v===s.sample[i])?310:650,y:492});}assert.equal(w.snapshot().phase,'lost');assert.equal(w.snapshot().progress,0);
});
test('fridge rejects overlap and cancelled dragging restores a placed item',t=>{
  const w=make(t,'fridge-fit'),s=w.snapshot(),plan=solveFridge(s),p=plan[0],b=s.pieces[p.id],start={x:b.x+27,y:b.y+27},end={x:s.bx+p.x*54+27,y:s.by+p.y*54+27};
  stroke(w,[start,end]);assert.equal(w.snapshot().progress,1);const placed=w.snapshot().pieces[0];w.down(end);w.move({x:20,y:20});w.cancel();assert.deepEqual(w.snapshot().pieces[0],placed);
  const other=w.snapshot().pieces[1];stroke(w,[{x:other.x+27,y:other.y+27},end]);assert.equal(w.snapshot().progress,1);assert.equal(w.snapshot().pieces[1].placed,false);
});
test('stacking nodes on top of each other cannot solve the knot',t=>{
  const w=make(t,'knot-office'),s=w.snapshot();stroke(w,[s.nodes[0],s.nodes[1]]);assert.equal(w.snapshot().phase,'playing');assert.equal(w.snapshot().progress,0);
});
test('matching shadows are wrong answers, with a three-miss limit',t=>{
  const w=make(t,'shadow-tell');for(let i=0;i<3;i++){step(w,.26);tap(w,w.snapshot().cards.find(c=>c.variant===c.shadowVariant));}assert.equal(w.snapshot().phase,'lost');assert.equal(w.snapshot().progress,0);
});
