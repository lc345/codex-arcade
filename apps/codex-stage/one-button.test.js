import test from "node:test";
import assert from "node:assert/strict";
import { createSkyStackWorld } from "./studio/sky-stack.js";
import { createPressWorld } from "./studio/press-run.js";
import { createSwingWorld } from "./studio/swing-post.js";
import { stackTower, crossPresses, deliverPost, solveSwing } from "../../tools/one-button-replays.mjs";

const factories = [createSkyStackWorld, createPressWorld, createSwingWorld];
const tick = (g, n) => { for (let i = 0; i < n; i++) g.step(1000 / 120); };
for (const create of factories) {
  test(`${create.name}: one gesture, no secondary, no points for idle time`, () => {
    const g = create(); tick(g, 120); assert.equal(g.scene.score, 0); assert.equal(g.secondary(), false);
    assert.equal(g.scene.secondaryLabel, ""); assert.equal(g.pointer("down", -1, 50), false); g.destroy();
  });
  test(`${create.name}: stop freezes input, simulation, retry and sound`, () => {
    const events = [], g = create({ onEvent: e => events.push(e) }); g.pointer("down", 400, 300); tick(g, 20); g.pointer("up", 400, 300); tick(g, 20); g.stop();
    const cp = g.checkpoint(), before = JSON.stringify(g.scene), count = events.length;
    tick(g, 200); assert.deepEqual(g.checkpoint(), cp); assert.equal(JSON.stringify(g.scene), before); assert.equal(events.length, count);
    for (const action of [() => g.primary(), () => g.retry(), () => g.key(" ", true), () => g.pointer("down", 400, 300)]) assert.equal(action(), false);
    g.destroy();
  });
  test(`${create.name}: cancel never fires; save is bounded and whitelisted`, () => {
    const g = create(); g.key(" ", true); tick(g, 12); g.cancel(); const score = g.scene.score;
    g.key(" ", false); assert.equal(g.scene.score, score);
    const cp = g.checkpoint(); assert.ok(JSON.stringify(cp).length < 7000);
    const restored = create({ checkpoint: { ...cp, prompt: "secret", path: "/private" } });
    assert.equal(JSON.stringify(restored.checkpoint()).includes("secret"), false);
    const bad = create({ checkpoint: { ...cp, best: Infinity, phase: "won", progress: 999 } });
    assert.equal(bad.scene.progress, 0); assert.equal(bad.scene.phase, "playing");
    g.destroy(); restored.destroy(); bad.destroy();
  });
}
test("stack: clicking a completely misaligned floor fails, rather than awarding a point", () => {
  const g = createSkyStackWorld(); g.primary(); tick(g, 80);
  assert.equal(g.scene.deaths, 1); assert.equal(g.scene.progress, 0); tick(g, 100); assert.equal(g.scene.phase, "playing"); g.destroy();
});
test("stack: an off-center landing trims the next floor and perfect landings do not", () => {
  const g = createSkyStackWorld();
  for (let i = 0; i < 1000 && Math.abs(g.scene.moving.x - g.scene.top.x - 35) > 2; i++) tick(g, 1);
  const width = g.scene.top.w; g.primary(); tick(g, 60);
  assert.equal(g.scene.progress, 1); assert.ok(g.scene.top.w < width - 20); assert.ok(g.scene.top.w > width - 45); g.destroy();
});
test("press: holding forever is punished; releasing stops movement immediately", () => {
  const g = createPressWorld(); g.pointer("down", 400, 300); tick(g, 30); g.pointer("up", 400, 300);
  const x = g.scene.x; tick(g, 50); assert.equal(g.scene.x, x);
  g.pointer("down", 400, 300); for (let i = 0; i < 3000 && !g.scene.deaths; i++) tick(g, 1);
  assert.equal(g.scene.deaths, 1); assert.ok(g.scene.progress < g.scene.goal); g.destroy();
});
test("swing: release creates a free Matter body, second inputs cannot steer it", () => {
  const g = createSwingWorld(); g.key(" ", true); tick(g, 80); g.key(" ", false);
  assert.equal(g.scene.mode, "flight"); const p = { ...g.scene.parcel }; tick(g, 10);
  assert.notEqual(g.scene.parcel.y, p.y); assert.equal(g.pointer("down", 400, 300), false); g.destroy();
});
test("twelve floors are winnable with clicks and no geometry mutation", () => {
  const g = createSkyStackWorld(); stackTower(g); assert.equal(g.scene.phase, "won"); assert.equal(g.scene.progress, 12); assert.equal(g.scene.top.w, 192);
  const restored = createSkyStackWorld({ checkpoint: g.checkpoint() }); assert.equal(restored.scene.phase, "won"); g.retry(); assert.equal(g.scene.best, 12); assert.equal(g.scene.progress, 0); g.destroy(); restored.destroy();
});
test("all eight presses are winnable using only hold/release and fixed readable timings", () => {
  const g = createPressWorld(), route = crossPresses(g); assert.equal(g.scene.progress, 8); assert.equal(g.scene.deaths, 0); assert.ok(route.length > 4);
  const restored = createPressWorld({ checkpoint: g.checkpoint() }); assert.equal(restored.scene.phase, "won"); g.destroy(); restored.destroy();
});
test("eight real ballistic deliveries are possible, including narrow moving targets", () => {
  const g = createSwingWorld(), route = deliverPost(g); assert.equal(g.scene.phase, "won"); assert.equal(g.scene.deaths, 0); assert.equal(g.scene.progress, 8);
  assert.ok(route[0].window > route[7].window); assert.ok(route[7].window < 100);
  const restored = createSwingWorld({ checkpoint: g.checkpoint() }); assert.equal(restored.scene.phase, "won"); g.destroy(); restored.destroy();
});
test("delivery holds the receiving tray still until the next letter starts", () => {
  const g = createSwingWorld(), pick = solveSwing(g.checkpoint()); g.key(" ", true); tick(g, pick.ticks); g.key(" ", false);
  while (g.scene.mode === "flight") tick(g, 1);
  const target = { ...g.scene.target }; tick(g, 20); assert.equal(g.scene.mode, "delivered"); assert.deepEqual(g.scene.target, target); g.destroy();
});
test("saving a failed tower cannot revive the lost run, but retains the record", () => {
  const g = createSkyStackWorld();
  while (Math.abs(g.scene.moving.x - g.scene.top.x) > 1.6) tick(g, 1);
  g.primary(); while (!g.scene.progress) tick(g, 1);
  g.primary(); while (g.scene.phase === "playing") tick(g, 1);
  const restored = createSkyStackWorld({ checkpoint: g.checkpoint() });
  assert.equal(restored.scene.progress, 0); assert.equal(restored.scene.best, 1); assert.equal(restored.scene.deaths, 1); g.destroy(); restored.destroy();
});
