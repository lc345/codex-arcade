import test from "node:test";
import assert from "node:assert/strict";
import { stagePixelRatio } from "./packs/render-budget.js";
import { createStudioRuntime } from "./studio/runtime.js";

test("an embedded 960px scene only renders pixels required by its displayed size", () => {
  const canvas = scale => ({ ownerDocument: { documentElement: { dataset: { stageRenderScale: scale } } } });
  assert.equal(960 * stagePixelRatio(canvas(String(400 / 960)), 2, 2), 800);
  assert.equal(Math.round(960 * stagePixelRatio(canvas(String(400 / 960)), 1.75, 2)), 700);
  for (const invalid of [undefined, "", "NaN", "0", "-1", "3"]) assert.equal(stagePixelRatio(canvas(invalid), 2, 2), 2);
  assert.equal(stagePixelRatio(canvas("1"), 2, 1), 1);
});

test("moving game coordinates do not trigger hidden controls or live announcements every frame", t => {
  const names = ["document", "requestAnimationFrame", "cancelAnimationFrame"], saved = names.map(n => Object.getOwnPropertyDescriptor(globalThis, n));
  let frame, frames = 0, feedback = 0, score = 0, moving = 0;
  Object.assign(globalThis, { document: new EventTarget(), requestAnimationFrame: fn => { frame = fn; return 1; }, cancelAnimationFrame() {} });
  t.after(() => names.forEach((n, i) => saved[i] ? Object.defineProperty(globalThis, n, saved[i]) : delete globalThis[n]));
  const scene = { phase: "playing" }, canvas = new EventTarget();
  const runtime = createStudioRuntime(canvas, { id: "fixture", levels: ["one"] }, () => ({
    scene, step() { moving++; frames++; }, snapshot: () => ({ phase: scene.phase, status: "running", score, x: moving, time: moving / 60, primaryEnabled: true }),
    cancel() {}, stop() {}, destroy() {}, primary() { scene.phase = "lost"; return true; },
  }), () => {}, { onFeedback: () => feedback++ }, () => ({ draw() {}, destroy() {} }));
  runtime.start();
  for (let i = 1; i <= 120; i++) frame(performance.now() + i * 16.67);
  assert.equal(frames, 120); assert.equal(feedback, 1);
  score = 1; frame(performance.now() + 2100); assert.equal(feedback, 2);
  runtime.input("tap"); assert.equal(feedback, 3); assert.equal(runtime.snapshot.phase, "lost");
  runtime.destroy();
});
