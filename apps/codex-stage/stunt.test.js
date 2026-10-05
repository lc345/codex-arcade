import test from "node:test";
import assert from "node:assert/strict";
import { createStuntWorld } from "./studio/temp-stunt.js";
import { GAME_CATALOG, createGamePicker } from "./collection/catalog.js";
import { buildReviewedPack } from "./packs/build.js";

const tick = (g, ms) => { for (let t = 0; t < ms; t += 1000 / 120) g.step(1000 / 120); };
const shoot = (g, dx = 70, dy = 35) => {
  const p = g.scene.player;
  assert.equal(g.pointer("down", p.x, p.y), true);
  assert.equal(g.pointer("move", p.x - dx, p.y + dy), true);
  assert.equal(g.pointer("up", p.x - dx, p.y + dy), true);
};

test("stunt gesture demonstration is noninteractive and disappears after actual input", () => {
  const g = createStuntWorld(); assert.equal(g.scene.tutorialSeen, false); tick(g, 1800);
  assert.equal(g.scene.mode, "ready"); assert.equal(g.scene.score, 0); shoot(g, 12, 0);
  assert.equal(g.scene.tutorialSeen, true); tick(g, 15000);
  assert.equal(g.scene.failure, "short"); assert.match(g.scene.status, /力度/);
  const r = createStuntWorld({ checkpoint: g.checkpoint() }); assert.equal(r.scene.tutorialSeen, true); assert.equal(r.scene.failure, "short");
  g.destroy(); r.destroy();
});

test("stunt optional challenges only earn badges after a real successful landing", () => {
  const g = createStuntWorld(); assert.equal(g.selectChallenge(1), true); assert.equal(g.selectChallenge(9), false);
  assert.deepEqual(g.scene.badges, [false, false, false]); shoot(g, 95, 40);
  assert.equal(g.selectChallenge(2), false); tick(g, 5000);
  assert.equal(g.scene.challengePassed, true); assert.equal(g.scene.badges[0], true);
  g.retry(); assert.equal(g.scene.badges[0], true); g.selectChallenge(2); shoot(g, 55, 10); tick(g, 6000);
  assert.equal(g.scene.challengePassed, true); assert.equal(g.scene.badges[1], true);
  const r = createStuntWorld({ checkpoint: g.checkpoint() }); assert.deepEqual(r.scene.badges, g.scene.badges);
  g.destroy(); r.destroy();
});

test("stunt waits safely for input and clamps aim, invalid pointers never launch", () => {
  const g = createStuntWorld(); const p = { ...g.scene.player }; tick(g, 8000);
  assert.equal(g.scene.mode, "ready"); assert.deepEqual(g.scene.player, p); assert.equal(g.scene.score, 0);
  assert.equal(g.pointer("down", NaN, 10), false); assert.equal(g.pointer("down", 900, 500), false);
  g.pointer("down", p.x, p.y); g.pointer("move", -900, 900);
  assert.ok(Math.hypot(g.scene.aim.x, g.scene.aim.y) <= 105.01);
  g.cancel(); assert.equal(g.scene.mode, "ready"); assert.equal(g.scene.score, 0); g.destroy();
});

test("stunt launches a constrained ragdoll, not a scripted trajectory", () => {
  const g = createStuntWorld(); shoot(g); tick(g, 350);
  assert.equal(g.scene.mode, "flight"); assert.ok(g.scene.player.x > 200);
  assert.equal(g.scene.limbs.length, 10);
  assert.ok(g.scene.limbs.some(p => Math.abs(p.angle) > .1));
  assert.ok(g.scene.limbs.every(p => Number.isFinite(p.x + p.y + p.angle)));
  assert.equal(g.scene.phase, "playing"); g.destroy();
});

test("stunt too-weak take really fails, retry resets glass and costs no lives", () => {
  const g = createStuntWorld(); shoot(g, 12, 0); tick(g, 14000);
  assert.equal(g.scene.phase, "lost"); assert.equal(g.scene.score, 0);
  assert.equal(g.retry(), true); assert.equal(g.scene.take, 2); assert.equal(g.scene.mode, "ready");
  assert.ok(g.scene.panes.every(p => !p.broken)); assert.equal(g.scene.catches, 0); g.destroy();
});

test("stunt only reachable hooks attach; detach preserves momentum and does not award points", () => {
  const g = createStuntWorld(); assert.equal(g.attach(0), false); shoot(g);
  assert.equal(g.attach(999), false);
  let attached = false;
  for (let i = 0; i < 150; i++) { g.step(1000 / 120); if (g.scene.anchors[0].available) { attached = g.attach(0); break; } }
  assert.equal(attached, true); assert.equal(g.scene.catches, 1);
  const score = g.scene.score; tick(g, 180); assert.equal(g.releaseRope(), true);
  assert.equal(g.scene.attached, null); assert.equal(g.scene.score, score);
  assert.ok(Math.hypot(g.scene.player.vx, g.scene.player.vy) > .2); g.destroy();
});

test("stunt stop freezes physics, input and audio; bounded checkpoint restores airborne pose", () => {
  const events = [], g = createStuntWorld({ onEvent: e => events.push(e) }); shoot(g); tick(g, 360);
  g.stop(); const before = JSON.stringify(g.scene), save = g.checkpoint(), count = events.length;
  tick(g, 5000); g.cancel();
  for (const value of [g.primary(), g.secondary(), g.retry(), g.setLevel(0), g.key(" ", true), g.attach(0), g.pointer("down", 100, 200)]) assert.equal(value, false);
  assert.equal(JSON.stringify(g.scene), before); assert.equal(events.length, count); assert.ok(JSON.stringify(save).length < 8192);
  const restored = createStuntWorld({ checkpoint: save });
  assert.equal(restored.scene.mode, "flight");
  assert.ok(Math.abs(restored.scene.player.x - g.scene.player.x) < .01);
  tick(restored, 100); assert.notEqual(restored.scene.player.x, g.scene.player.x);
  g.destroy(); restored.destroy();
});

test("stunt rejects malformed checkpoints and never persists unknown task data", () => {
  for (const checkpoint of [null, "bad", { version: 1, limbs: [] }, { version: 1, phase: "won", score: 999999 }]) {
    const g = createStuntWorld({ checkpoint }); assert.equal(g.scene.mode, "ready"); assert.equal(g.scene.score, 0); g.destroy();
  }
  const g = createStuntWorld(); shoot(g); tick(g, 100);
  const saved = g.checkpoint(); saved.prompt = "PRIVATE_TEST"; saved.path = "/private/foo";
  const restored = createStuntWorld({ checkpoint: saved });
  assert.ok(!JSON.stringify(restored.checkpoint()).includes("PRIVATE_TEST"));
  g.destroy(); restored.destroy();
});

test("stunt authored set is winnable by direct shot, copier bounce and a mid-air rescue", () => {
  for (const path of [{ dx: 95, dy: 40 }, { dx: 55, dy: 10, bounce: true }, { dx: 70, dy: 35, hook: true }]) {
    const g = createStuntWorld(); shoot(g, path.dx, path.dy);
    for (let i = 0; i < 1500 && g.scene.phase === "playing"; i++) {
      if (path.hook && i === 40) assert.equal(g.attach(0), true);
      if (path.hook && i === 70) assert.equal(g.releaseRope(), true);
      g.step(1000 / 120);
    }
    assert.equal(g.scene.phase, "won", JSON.stringify({ path, snapshot: g.snapshot() }));
    assert.ok(g.scene.broken > 0); assert.ok(g.scene.player.x > 799); assert.ok(g.scene.score >= 600);
    if (path.bounce) assert.equal(g.scene.bounced, true);
    if (path.hook) assert.equal(g.scene.catches, 1);
    const score = g.scene.score; tick(g, 1000); assert.equal(g.scene.score, score);
    const restored = createStuntWorld({ checkpoint: g.checkpoint() }); assert.equal(restored.scene.phase, "won");
    restored.destroy(); g.destroy();
  }
});

test("stunt restored airborne body can complete the same legal direct shot", () => {
  const g = createStuntWorld(); shoot(g, 95, 40); tick(g, 450);
  const restored = createStuntWorld({ checkpoint: g.checkpoint() }); tick(restored, 6000);
  assert.equal(restored.scene.phase, "won"); g.destroy(); restored.destroy();
});

test("stunt slow motion buys real reaction time without changing the physics route", () => {
  const normal = createStuntWorld(), slow = createStuntWorld();
  shoot(normal, 95, 40); shoot(slow, 95, 40); assert.equal(slow.secondary(), true);
  assert.equal(slow.scene.slow, true);
  tick(normal, 300); tick(slow, 300);
  assert.ok(slow.scene.player.x < normal.scene.player.x - 60);
  tick(normal, 6000); tick(slow, 10000);
  assert.equal(normal.scene.phase, "won"); assert.equal(slow.scene.phase, "won");
  assert.equal(normal.scene.score, slow.scene.score);
  const restored = createStuntWorld({ checkpoint: slow.checkpoint() });
  assert.equal(restored.scene.slow, true); restored.destroy();
  normal.destroy(); slow.destroy();
});

test("stunt hooks are limited, persisted and never award score just for clicking", () => {
  const g = createStuntWorld(); shoot(g); tick(g, 340);
  for (let i = 0; i < 3; i++) { const score = g.scene.score; assert.equal(g.attach(0), true); assert.equal(g.scene.score, score); g.releaseRope(); }
  assert.equal(g.attach(0), false); assert.equal(g.scene.catches, 3);
  const r = createStuntWorld({ checkpoint: g.checkpoint() }); assert.equal(r.scene.catches, 3); assert.equal(r.attach(0), false);
  r.destroy(); g.destroy();
});

test("stunt rope checkpoint preserves attachment and release remains a legal player action", () => {
  const g = createStuntWorld(); shoot(g); tick(g, 340); g.attach(0); tick(g, 100);
  const saved = g.checkpoint(); assert.equal(saved.rope[0], 0);
  g.stop(); const r = createStuntWorld({ checkpoint: saved }); assert.equal(r.scene.attached, 0);
  tick(r, 160); assert.equal(r.releaseRope(), true); assert.equal(r.scene.attached, null);
  assert.ok(r.scene.limbs.every(l => Number.isFinite(l.x + l.y)));
  r.destroy(); g.destroy();
});

test("stunt corruption cannot inject impossible limbs or forged win flag", () => {
  const g = createStuntWorld(); shoot(g); tick(g, 200); const saved = g.checkpoint();
  const mutations = [v => { v.limbs[2][0] = 10000; }, v => { v.limbs[0][3] = Infinity; }, v => { v.phase = "won"; v.mode = "wrap"; }, v => { v.rope = [4, 150]; }, v => { v.catches = -1; }, v => { v.panes[0] = "yes"; }];
  for (const change of mutations) { const v = structuredClone(saved); change(v); const r = createStuntWorld({ checkpoint: v }); assert.equal(r.scene.mode, "ready"); r.destroy(); }
  g.destroy();
});

test("stunt repeated legal aims stay finite and single-level retry always returns the rig", () => {
  for (let i = 0; i < 25; i++) {
    const g = createStuntWorld(); shoot(g, 15 + i * 3.5, i % 7 * 9 - 12);
    for (let j = 0; j < 1750 && g.scene.phase === "playing"; j++) {
      if (j === 60) { const a = g.scene.anchors.find(a => a.available); if (a) g.attach(a.id); }
      if (j === 110) g.releaseRope(); g.step(1000 / 120);
      assert.ok(g.scene.limbs.every(p => Number.isFinite(p.x + p.y + p.angle)));
    }
    assert.ok(["won", "lost"].includes(g.scene.phase)); assert.equal(g.setLevel(1), false);
    g.retry(); assert.equal(g.scene.player.x, 145); assert.equal(g.scene.mode, "ready"); assert.equal(g.scene.score, 0); g.destroy();
  }
});

test("stunt selected pack includes one offline asset and Matter, with no Agent capabilities", () => {
  const p = GAME_CATALOG.find(p => p.id === "temp-stunt"), picker = createGamePicker(() => .3);
  assert.equal(p.release, "preview"); assert.equal(p.persistentCheckpoint, true);
  for (let i = 0; i < 40; i++) assert.notEqual(picker.pick(`t${i}`).id, p.id);
  assert.equal(picker.pick("manual", p.id).id, p.id);
  const { source, manifest } = buildReviewedPack(p.id); assert.deepEqual(manifest.permissions, []);
  assert.equal(manifest.dependencies[0].id, "matter-js"); assert.equal(manifest.offline, true);
  assert.equal((source.match(/data:image\//g) ?? []).length, 1); assert.ok(manifest.bytes < 600000);
});

test("stunt selected challenge is announced and cannot be changed during a take", () => {
  const g = createStuntWorld(); assert.equal(g.key("3", true), true); assert.match(g.scene.status, /复印机救场/);
  shoot(g); assert.equal(g.selectChallenge(1), false); assert.equal(g.scene.challenge, 2); g.destroy();
});
