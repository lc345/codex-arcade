import test from "node:test";
import assert from "node:assert/strict";
import { createRainlineWorld } from "./studio/rainline.js";
import { createInkWorld } from "./studio/ink-archive.js";
import { createLiftWorld } from "./studio/last-lift.js";
import { prepareRapier } from "./vendor/rapier.js";
await prepareRapier();
const tick = (w, ms) => { for (let i = 0; i < ms; i += 10) w.step(10); };

test("rainline uses real platform collisions, double jumps and recovers lost parcels", () => {
  const w = createRainlineWorld(); tick(w, 500);
  assert.equal(w.scene.awaiting, true); assert.equal(w.scene.player.x, 90);
  w.primary(); tick(w, 100); assert.ok(w.scene.player.y < 410);
  assert.equal(w.primary(), true); assert.equal(w.primary(), false);
  tick(w, 500); assert.ok(w.scene.player.x > 120); w.destroy();
});
test("rainline's complete route is reachable using jump inputs", () => {
  const w = createRainlineWorld(); w.primary();
  for (let i = 0; i < 14000 && w.scene.phase !== "won"; i++) {
    const s = w.scene, x = s.player.x;
    if (s.grounded && (s.platforms.some(p => p.y < 435 && p.x > x && p.x - x < 100) || s.gaps.some(([a,b]) => a > x && a - x < 100))) w.primary();
    if (s.player.y > 470) w.primary();
    w.step(10);
  }
  assert.equal(w.scene.phase, "won", JSON.stringify(w.snapshot())); assert.equal(w.scene.progress, 3); w.destroy();
});
test("ink requires observation before the archive seal can be opened", () => {
  const w = createInkWorld(); assert.equal(w.scene.seal, false);
  for (const p of w.scene.clues) { w.pointer("down", p.x, p.y); tick(w, 850); w.pointer("up", p.x, p.y); }
  assert.equal(w.scene.progress, 3); assert.equal(w.scene.phase, "playing");
  assert.equal(w.primary(), false);
  for (let i = 0; i < 3; i++) for (let n = 0; n < [7,2,4][i]; n++) { w.pointer("down", 620+i*90, 355); w.pointer("up", 620+i*90, 355); }
  assert.equal(w.primary(), true); assert.equal(w.scene.phase, "won"); w.destroy();
});
test("ink can start with keyboard alone, without a pointer priming its first clue",()=>{
  const w=createInkWorld();w.key(" ",true);tick(w,800);w.key(" ",false);assert.equal(w.scene.progress,1);w.destroy();
});
test("lift retry resets the footstep cadence along with simulation time",()=>{
  const events=[],w=createLiftWorld({onEvent:e=>events.push(e.type)});w.key("w",true);tick(w,3000);w.retry();const before=events.length;w.key("w",true);tick(w,600);assert.ok(events.slice(before).includes("lift-step"));w.destroy();
});
test("ink cancels development on pointer cancellation and is keyboard solvable", () => {
  const w=createInkWorld();w.pointer("down",190,390);tick(w,100);w.cancel();tick(w,900);assert.equal(w.scene.progress,0);
  for(let i=0;i<3;i++){w.key(" ",true);tick(w,850);w.key(" ",false);if(i<2)w.key("ArrowRight",true);}
  assert.equal(w.scene.progress,3);
  for(let i=0;i<3;i++){for(let j=0;j<[7,2,4][i];j++)w.key("ArrowUp",true);if(i<2)w.key("ArrowRight",true);}
  w.key("Enter",true);assert.equal(w.scene.phase,"won");w.destroy();
});
test("lift blocks remote interactions and has a physical first-person capsule", () => {
  const w=createLiftWorld();assert.equal(w.interact("breaker"),false);assert.equal(w.interact("exit"),false);
  w.key("ArrowLeft",true);tick(w,6000);w.cancel();assert.ok(w.scene.player.x>-2.8);w.destroy();
});
test("all contrast samples freeze synchronously and reject invalid inputs after stop", () => {
  for(const create of [createRainlineWorld,createInkWorld,createLiftWorld]){
    const events=[],w=create({onEvent:e=>events.push(e.type)});w.primary();tick(w,250);
    assert.equal(w.pointer("down",NaN,0),false);assert.equal(w.pointer("down",Infinity,200),false);
    w.stop();const s=JSON.stringify(w.scene),n=events.length;tick(w,1000);
    assert.equal(w.primary(),false);assert.equal(w.secondary(),false);assert.equal(w.retry(),false);assert.equal(w.key("ArrowUp",true),false);
    assert.equal(JSON.stringify(w.scene),s);assert.equal(events.length,n);w.destroy();w.destroy();
  }
});
