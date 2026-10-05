import test from "node:test";
import assert from "node:assert/strict";
import { createToastWorld } from "./studio/toast-hop.js";
import { serveToast, solveToastJump, toastJump, toastTicks } from "../../tools/toast-replay.mjs";

const tick = (g, ms) => { for (let n = 0; n < Math.ceil(ms / (1000 / 120)); n++) g.step(1000 / 120); };
const jump = (g, ms) => { assert.equal(g.pointer("down", 400, 300), true); tick(g, ms); assert.equal(g.pointer("up", 400, 300), true); };

test("toast waits safely and has only charge/release, no secondary ability", () => {
  const g = createToastWorld(); const before = g.checkpoint(); tick(g, 2000);
  assert.deepEqual(g.checkpoint(), before); assert.equal(g.secondary(), false);
  assert.equal(g.scene.progress, 0); assert.equal(g.scene.score, 0); g.destroy();
});
test("holding visibly compresses without scoring; release launches a real Matter body", () => {
  const g = createToastWorld(); g.key(" ", true); tick(g, 400);
  assert.equal(g.scene.mode, "charging"); assert.ok(g.scene.charge > .4); assert.equal(g.scene.score, 0);
  g.key(" ", false); assert.equal(g.scene.mode, "flight"); const x = g.scene.player.x, y = g.scene.player.y;
  tick(g, 100); assert.ok(g.scene.player.x > x); assert.ok(g.scene.player.y < y);
  assert.equal(g.primary(), false); g.destroy();
});
test("overholding caps the power, without secretly auto-firing", () => {
  const g = createToastWorld(); g.pointer("down", 400, 300); tick(g, 4000);
  assert.equal(g.scene.mode, "charging"); assert.equal(g.scene.charge, 1); assert.equal(g.scene.progress, 0); g.destroy();
});
test("pointer cancel and off-canvas release discard charge instead of jumping", () => {
  const g = createToastWorld(); g.pointer("down", 400, 300); tick(g, 200); g.cancel();
  assert.equal(g.scene.mode, "ready"); assert.equal(g.pointer("up", 400, 300), false);
  g.pointer("down", 400, 300); tick(g, 200); g.pointer("up", -10, 300);
  assert.equal(g.scene.mode, "ready"); assert.equal(g.scene.score, 0); g.destroy();
});
test("too short is a real miss and retries quickly with a readable previous landing", () => {
  const g = createToastWorld(); jump(g, 0); tick(g, 1500);
  assert.equal(g.scene.mode, "ready"); assert.equal(g.scene.progress, 0); assert.equal(g.scene.attempt, 2);
  assert.equal(g.scene.deaths, 1); assert.equal(g.scene.lastMiss.index, 1); assert.equal(g.scene.lastMiss.side, "short");
  assert.ok(g.scene.lastMiss.distance > 0); assert.equal(g.scene.score, 0); g.destroy();
});
test("too long misses on the other side instead of granting skipped platforms", () => {
  const g = createToastWorld(); jump(g, 1200); tick(g, 1500);
  assert.equal(g.scene.deaths, 1); assert.equal(g.scene.lastMiss.side, "long"); assert.equal(g.scene.progress, 0); g.destroy();
});
test("task stop cancels held input and freezes time, physics, retries and audio", () => {
  const sounds = [], g = createToastWorld({ onEvent: e => sounds.push(e) }); jump(g, 500); tick(g, 150); g.stop();
  const cp = g.checkpoint(), events = sounds.length; tick(g, 2000);
  assert.deepEqual(g.checkpoint(), cp); assert.equal(sounds.length, events);
  for (const action of [() => g.primary(), () => g.retry(), () => g.pointer("down", 400, 300), () => g.key(" ", true)]) assert.equal(action(), false);
  const resumed = createToastWorld({ checkpoint: cp }); assert.equal(resumed.scene.mode, "flight"); tick(resumed, 100);
  assert.notEqual(resumed.scene.player.y, cp.body[1]); resumed.destroy(); g.destroy();
});
test("save data is bounded and ignores injection, impossible wins and malformed bodies", () => {
  const g = createToastWorld(); const cp = g.checkpoint();
  assert.ok(JSON.stringify(cp).length < 2000);
  for (const value of [{ ...cp, progress: 10, phase: "won" }, { ...cp, body: [Infinity, 1, 0, 0] }, { ...cp, index: 99 }, { ...cp, time: -1 }]) {
    const bad = createToastWorld({ checkpoint: value }); assert.equal(bad.scene.progress, 0); assert.equal(bad.scene.phase, "playing"); bad.destroy();
  }
  const clean = createToastWorld({ checkpoint: { ...cp, prompt: "private", path: "/secret", command: "exec" } });
  assert.deepEqual(clean.checkpoint(), cp); clean.destroy(); g.destroy();
});
test("all ten tables are winnable by charge/release, including moving narrow tables", () => {
  const g = createToastWorld(), route = serveToast(g);
  assert.equal(g.scene.phase, "won"); assert.equal(g.scene.index, 10); assert.equal(g.scene.best, 10);
  assert.equal(g.scene.deaths, 0); assert.ok(route[0].windowMs > route[8].windowMs);
  assert.ok(route[8].windowMs <= 100); assert.ok(route.every(r => r.error < 5));
  const restored = createToastWorld({ checkpoint: g.checkpoint() }); assert.equal(restored.scene.phase, "won");
  g.retry(); assert.equal(g.scene.best, 10); assert.equal(g.scene.index, 0); restored.destroy(); g.destroy();
});
test("edge landings cannot skip progress; repeated input cannot change a jump in midair", () => {
  const g = createToastWorld(), choice = solveToastJump(g.checkpoint()); toastJump(g, choice.ticks);
  const vx = g.scene.player.vx; assert.equal(g.pointer("down", 400, 300), false); g.key(" ", true); g.key(" ", false);
  assert.equal(g.scene.player.vx, vx); toastTicks(g, 130); assert.equal(g.scene.index, 1); assert.ok(g.scene.score >= 100);
  const cp = g.checkpoint(), resumed = createToastWorld({ checkpoint: cp }); assert.deepEqual(resumed.checkpoint(), cp);
  g.retry(); assert.equal(g.scene.best, 1); assert.equal(g.scene.score, 0); resumed.destroy(); g.destroy();
});
