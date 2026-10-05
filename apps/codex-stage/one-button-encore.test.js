import test from "node:test";
import assert from "node:assert/strict";
import { createBridgeWorld } from "./studio/bridge-span.js";
import { createOrbitPinsWorld } from "./studio/orbit-pins.js";
import { createLastStopWorld } from "./studio/last-stop.js";
import { createGravityWorld } from "./studio/gravity-shift.js";
import { crossBridges, fillOrbit, parkAll, flipCourse } from "../../tools/one-button-encore-replays.mjs";
const factories = [createBridgeWorld, createOrbitPinsWorld, createLastStopWorld, createGravityWorld];
const tick = (g, n) => { for (let i = 0; i < n; i++) g.step(1000 / 120); };
for (const create of factories) {
  test(`${create.name}: idle never scores and only one input is exposed`, () => {
    const g = create(); tick(g, 240); assert.equal(g.scene.score, 0); assert.equal(g.scene.progress, 0); assert.equal(g.secondary(), false);
    assert.equal(g.pointer("down", -1, 200), false); assert.equal(g.scene.secondaryLabel, ""); g.destroy();
  });
  test(`${create.name}: task completion freezes state and rejects every input`, () => {
    const events = [], g = create({ onEvent: e => events.push(e) }); g.key(" ", true); tick(g, 30); g.key(" ", false); tick(g, 10); g.stop();
    const before = JSON.stringify(g.scene), cp = g.checkpoint(), count = events.length; tick(g, 200);
    assert.equal(JSON.stringify(g.scene), before); assert.deepEqual(g.checkpoint(), cp); assert.equal(events.length, count);
    assert.equal(g.primary(), false); assert.equal(g.retry(), false); assert.equal(g.pointer("down", 300, 300), false); assert.equal(g.key(" ", true), false); g.destroy();
  });
  test(`${create.name}: bounded local save ignores private/unknown fields and malformed records`, () => {
    const g = create(), cp = g.checkpoint(); assert.ok(JSON.stringify(cp).length < 4096);
    const restored = create({ checkpoint: { ...cp, prompt: "secret", path: "/private", tool: "exec" } }); assert.equal(JSON.stringify(restored.checkpoint()).includes("secret"), false);
    for (const data of [null, { progress: Infinity }, { progress: -1 }, { progress: 999, won: true }, { pins: [NaN], angle: 0 }]) {
      const bad = create({ checkpoint: { ...cp, data } }); assert.equal(bad.scene.progress, 0); assert.equal(bad.scene.phase, "playing"); bad.destroy();
    }
    g.destroy(); restored.destroy();
  });
}
test("bridge: a tap is too short; a held length is capped, not auto-released", () => {
  const g = createBridgeWorld(); g.key(" ", true); g.key(" ", false);
  for (let n = 0; n < 600 && !g.scene.deaths; n++) tick(g, 1);
  assert.equal(g.scene.deaths, 1); assert.equal(g.scene.progress, 0); g.retry(); g.key(" ", true); tick(g, 1000);
  assert.equal(g.scene.mode, "growing"); assert.equal(g.scene.length, 390); assert.equal(g.scene.progress, 0); g.cancel(); assert.equal(g.scene.mode, "ready"); g.destroy();
});
test("orbit pins: holding never repeats shots and pressing does not award instant points", () => {
  const g = createOrbitPinsWorld(); g.key(" ", true); assert.equal(g.scene.score, 0); assert.equal(g.scene.mode, "shot");
  tick(g, 400); assert.ok(g.scene.progress <= 1); g.key(" ", true); assert.ok(g.scene.progress <= 1); g.destroy();
});
test("last stop: release brakes gradually, never teleports to a stop", () => {
  const g = createLastStopWorld(); g.key(" ", true); tick(g, 65); g.key(" ", false); const x = g.scene.x;
  tick(g, 8); assert.ok(g.scene.x > x); assert.equal(g.scene.mode, "braking"); assert.equal(g.pointer("down", 200, 200), false); g.destroy();
});
test("gravity: first tap starts and reverses gravity, waiting does not secretly run", () => {
  const g = createGravityWorld(); const x = g.scene.player.x; tick(g, 200); assert.equal(g.scene.player.x, x);
  g.primary(); assert.equal(g.scene.gravity, -1); tick(g, 45); assert.ok(g.scene.player.x > x); assert.ok(g.scene.player.y < 380); g.primary(); assert.equal(g.scene.gravity, 1); g.destroy();
});
for (const [create, replay, count] of [[createBridgeWorld, crossBridges, 10], [createOrbitPinsWorld, fillOrbit, 18], [createLastStopWorld, parkAll, 8], [createGravityWorld, flipCourse, 10]]) {
  test(`${create.name}: complete campaign is winnable with legal inputs and survives a saved win`, () => {
    const g = create(), route = replay(g); assert.equal(g.scene.phase, "won"); assert.equal(g.scene.progress, count); assert.equal(g.scene.deaths, 0); assert.ok(route.length > 0);
    const restored = create({ checkpoint: g.checkpoint() }); assert.equal(restored.scene.phase, "won"); assert.equal(restored.scene.progress, count);
    g.retry(); assert.equal(g.scene.best, count); assert.equal(g.scene.progress, 0); g.destroy(); restored.destroy();
  });
  test(`${create.name}: every reached checkpoint resumes at a safe milestone without held input`, () => {
    const saves = new Map(); let g;
    g = create({ onEvent() { if (g.scene.progress > 0 && g.scene.progress < count) saves.set(g.scene.progress, g.checkpoint()); } });
    replay(g); assert.equal(saves.size, count - 1);
    for (const [progress, cp] of saves) {
      const restored = create({ checkpoint: cp }); assert.equal(restored.scene.progress, progress); assert.equal(restored.scene.mode, "ready");
      tick(restored, 240); assert.equal(restored.scene.progress, progress); assert.equal(restored.scene.deaths, 0); restored.destroy();
    }
    g.destroy();
  });
}
test("orbit pins: mindless rapid firing collides with existing pins", () => {
  const g = createOrbitPinsWorld(); for (let n = 0; n < 3000 && !g.scene.deaths; n++) { if (g.scene.mode === "ready") g.primary(); tick(g, 1); }
  assert.equal(g.scene.deaths, 1); assert.ok(g.scene.progress < 18); g.destroy();
});
test("last stop: early and late braking both fail without granting a parked car", () => {
  for (const hold of [1, 290]) { const g = createLastStopWorld(); g.key(" ", true); for (let n = 0; n < hold && !g.scene.deaths; n++) tick(g, 1); g.key(" ", false);
    for (let n = 0; n < 650 && !g.scene.deaths; n++) tick(g, 1); assert.equal(g.scene.deaths, 1); assert.equal(g.scene.progress, 0); g.destroy(); }
});
test("last stop: a parked result contains the entire visible car, not just its center", () => {
  for (let hold = 60; hold < 160; hold++) {
    const g = createLastStopWorld(); g.key(" ", true); tick(g, hold); g.key(" ", false);
    for (let n = 0; n < 650 && g.scene.mode === "braking"; n++) tick(g, 1);
    if (g.scene.mode === "parked") assert.ok(Math.abs(g.scene.x - g.scene.target.x) + 24 <= g.scene.target.w / 2, `car protrudes after ${hold} ticks`);
    g.destroy();
  }
});
test("gravity: staying on one surface crashes at a real Matter obstacle", () => {
  const g = createGravityWorld(); g.primary(); for (let n = 0; n < 800 && !g.scene.deaths; n++) tick(g, 1);
  assert.equal(g.scene.deaths, 1); assert.equal(g.scene.progress, 1); g.destroy();
});
