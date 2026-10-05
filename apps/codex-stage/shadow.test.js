import test from "node:test";
import assert from "node:assert/strict";
import { createShadowWorld } from "./studio/shadow-crew.js";
import { GAME_CATALOG, createGamePicker } from "./collection/catalog.js";
import { buildReviewedPack } from "./packs/build.js";

const tick = (g, ms) => { for (let t = 0; t < ms; t += 1000 / 120) g.step(1000 / 120); };

test("shadow idle is safe and moving the lamp changes real projected geometry", () => {
  const g = createShadowWorld(); tick(g, 6000); assert.equal(g.scene.phase, "playing"); assert.ok(g.scene.player.x < 140);
  const before = g.project()[0]; assert.equal(g.setLight(2.8), true); const after = g.project()[0];
  assert.ok(after.vertices[1].x - after.vertices[0].x > (before.vertices[1].x - before.vertices[0].x) * 1.8);
  assert.equal(g.scene.score, 0); assert.equal(g.setLight(Infinity), false); assert.equal(g.moveProp(NaN, 320), false); g.destroy();
});

test("shadow first chapter crosses a real projected ruler without a scripted win", () => {
  const g = createShadowWorld(); g.setLight(2.9); g.moveProp(475, 320); assert.equal(g.primary(), true); tick(g, 16000);
  assert.equal(g.scene.phase, "won"); assert.ok(g.scene.player.x > 800); assert.equal(g.scene.score, 100); g.destroy();
});

test("shadow missing bridge falls; retry returns to safety and keeps the player's arrangement", () => {
  const g = createShadowWorld(); g.primary(); tick(g, 7000); assert.equal(g.scene.phase, "lost");
  const prop = { ...g.scene.prop }; g.retry(); assert.equal(g.scene.phase, "playing"); assert.deepEqual(g.scene.prop, prop);
  assert.ok(g.scene.player.x < 140); assert.equal(g.scene.score, 0); g.destroy();
});

test("shadow relay requires reusing a bridge after a real intermediate landing", () => {
  const g = createShadowWorld({ level: 1 }); g.setLight(2.2); g.moveProp(400, 320); g.primary(); tick(g, 7000);
  assert.equal(g.scene.rest, 1); assert.equal(g.scene.mode, "edit"); assert.ok(g.scene.player.x > 400 && g.scene.player.x < 510);
  g.moveProp(539, 320); g.primary(); tick(g, 10000); assert.equal(g.scene.phase, "won"); g.destroy();
});

test("shadow two lamps create independently collidable bridges", () => {
  const g = createShadowWorld({ level: 2 }); g.setLight(1.8); g.moveProp(480, 320);
  assert.equal(new Set(g.project().map(p => p.lamp)).size, 2); g.primary(); tick(g, 18000);
  assert.equal(g.scene.phase, "won"); g.destroy();
});

test("shadow edit undo and stop preserve bounded private-free checkpoints", () => {
  const g = createShadowWorld(); const before = { ...g.scene.prop }; g.moveProp(520, 317); assert.equal(g.secondary(), true); assert.deepEqual(g.scene.prop, before);
  g.setLight(2.9); g.moveProp(475, 320); g.primary(); tick(g, 2800); g.stop(); const saved = g.checkpoint();
  tick(g, 2000); assert.deepEqual(g.checkpoint(), saved); assert.equal(g.primary(), false); assert.equal(g.moveProp(300, 330), false);
  const restored = createShadowWorld({ checkpoint: { ...saved, prompt: "PRIVATE_SHADOW", path: "/private/secret" } });
  assert.ok(Math.abs(restored.scene.player.x - g.scene.player.x) < .01); assert.ok(!JSON.stringify(restored.checkpoint()).includes("PRIVATE_SHADOW"));
  tick(restored, 16000); assert.equal(restored.scene.phase, "won"); assert.ok(JSON.stringify(saved).length < 8192);
  restored.destroy(); g.destroy();
});

test("shadow scissors handle changes angle, not prop position, and cancel restores the drag", () => {
  const g = createShadowWorld({ level: 2 }); g.selectTool("scissors");
  g.pointer("down", 480, 418); g.pointer("move", 516, 418);
  assert.equal(g.scene.prop.x, 480); assert.equal(g.scene.prop.angle, .2);
  g.cancel(); assert.equal(g.scene.prop.angle, 0);
  g.pointer("down", 480, 418); g.pointer("move", 516, 418); g.pointer("up", 516, 418);
  g.secondary(); assert.equal(g.scene.prop.angle, 0); g.destroy();
});

test("shadow retry cancels pending input and rejects malformed checkpoints", () => {
  const g = createShadowWorld(); g.pointer("down", 480, 450); g.pointer("move", 505, 452);
  g.retry(); const before = g.checkpoint(); assert.equal(g.pointer("move", 620, 490), false); assert.deepEqual(g.checkpoint(), before);
  for (const patch of [{ mode: "clear" }, { player: [900, 100, 0, 0], phase: "won", mode: "clear" }, { arrangement: { ...before.arrangement, zoom: Infinity } }, { level: 80 }]) {
    const bad = createShadowWorld({ checkpoint: { ...before, ...patch } }); assert.equal(bad.scene.mode, "edit"); assert.equal(bad.scene.player.x, 116); bad.destroy();
  }
  g.destroy();
});

test("shadow undo cannot bury a worker inside an older shadow", () => {
  const source = createShadowWorld(); const saved = source.checkpoint(); source.destroy();
  saved.arrangement.zoom = 2.9; saved.player = [480, 307, 0, 0];
  saved.history = [{ ...saved.arrangement, y: 313 }];
  const g = createShadowWorld({ checkpoint: saved }); assert.equal(g.secondary(), false);
  assert.equal(g.scene.prop.y, 320); assert.equal(g.checkpoint().history.length, 1); g.destroy();
});

test("shadow comb and opened scissors support distinct real walking routes", () => {
  for (const kind of ["comb", "scissors"]) {
    const g = createShadowWorld({ level: 2 }); g.selectTool(kind); g.setLight(1.75);
    if (kind === "scissors") { g.setAngle(.22); g.moveProp(480, 323); }
    assert.equal(g.project().length, kind === "comb" ? 16 : 4); g.primary();
    let minY = 307; for (let t = 0; t < 20000; t += 1000 / 120) { g.step(1000 / 120); minY = Math.min(minY, g.scene.player.y); }
    assert.ok(minY < 299); assert.equal(g.scene.phase, "won"); g.destroy();
  }
});

test("shadow removing support causes a fall even while the worker is stopped", () => {
  const g = createShadowWorld(); g.setLight(2.9); g.moveProp(475, 320); g.primary(); tick(g, 4500);
  assert.ok(g.scene.player.x > 300 && g.scene.player.x < 690); g.primary();
  g.moveProp(650, 345); tick(g, 2000); assert.equal(g.scene.phase, "lost"); g.destroy();
});

test("shadow is a manual offline preview with one asset and no Agent permissions", () => {
  const p = GAME_CATALOG.find(p => p.id === "shadow-crew"), picker = createGamePicker(() => .3);
  assert.equal(p.release, "preview"); assert.equal(p.persistentCheckpoint, true);
  for (let i = 0; i < 40; i++) assert.notEqual(picker.pick(`t${i}`).id, p.id);
  assert.equal(picker.pick("manual", p.id).id, p.id);
  const { source, manifest } = buildReviewedPack(p.id); assert.deepEqual(manifest.permissions, []);
  assert.equal(manifest.dependencies[0].id, "matter-js"); assert.equal(manifest.offline, true);
  assert.equal((source.match(/data:image\//g) ?? []).length, 1); assert.ok(manifest.bytes < 600000);
});
