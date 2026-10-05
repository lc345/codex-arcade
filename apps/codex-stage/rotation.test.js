import test from "node:test";
import assert from "node:assert/strict";
import { createGameRotation } from "./rotation.js";

test("automatic rotation waits for the interval, a result and five idle seconds", () => {
  let now = 0, count = 0;
  const rotation = createGameRotation({ now: () => now, next: () => count++ });
  rotation.reset();
  const state = { active: true, random: true, phase: "lost" };
  now = 179999; rotation.tick(state); assert.equal(count, 0);
  now = 180001; rotation.tick({ ...state, phase: "playing" }); assert.equal(count, 0);
  rotation.press("pointer:1"); now += 10000;
  rotation.tick(state); assert.equal(count, 0);
  rotation.release("pointer:1"); now += 4999; rotation.tick(state); assert.equal(count, 0);
  now++; rotation.tick(state); assert.equal(count, 1);
  now += 5000; rotation.tick(state); assert.equal(count, 1);
});

test("rotation never switches paused, hidden, pinned, stopped or unknown game phases", () => {
  let now = 0, count = 0;
  const r = createGameRotation({ now: () => now, next: () => count++ }); r.reset(); now = 200000;
  const s = { active: true, random: true, phase: "won" };
  for (const delta of [{ active: false }, { random: false }, { paused: true }, { hidden: true }, { phase: "aiming" }, { phase: "flight" }, { phase: "loading" }, { phase: "mystery" }]) r.tick({ ...s, ...delta });
  assert.equal(count, 0);
  r.press("key:Space"); r.clearInput(); now += 5001; r.tick(s); assert.equal(count, 1);
});
