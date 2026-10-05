import test from "node:test";
import assert from "node:assert/strict";
import { createRuleWorld } from "./studio/rule-smuggler.js";
import { GAME_CATALOG, createGamePicker } from "./collection/catalog.js";
import { buildReviewedPack } from "./packs/build.js";

const tick = (g, ms = 7000) => { for (let t = 0; t < ms; t += 1000 / 120) g.step(1000 / 120); };
const cell = (x, y) => y * 7 + x;

test("rules pack is an offline, checkpointable preview outside the stable shuffle", () => {
  const p = GAME_CATALOG.find(g => g.id === "rule-smuggler"), picker = createGamePicker(() => .4);
  assert.equal(p.release, "preview"); assert.equal(p.persistentCheckpoint, true);
  for (let i = 0; i < 50; i++) assert.notEqual(picker.pick(`run-${i}`).id, p.id);
  assert.equal(picker.pick("manual", p.id).id, p.id);
  const { source, manifest } = buildReviewedPack(p.id); assert.deepEqual(manifest.permissions, []); assert.deepEqual(manifest.dependencies, []);
  assert.equal(manifest.offline, true); assert.equal((source.match(/data:image\//g) ?? []).length, 1);
  assert.ok(source.includes("createRuleSound")); assert.ok(manifest.bytes < 800000);
});

test("planning is untimed and preview cannot damage the real board", () => {
  const g = createRuleWorld(), board = structuredClone(g.scene.board);
  tick(g, 60000); for (let i = 0; i < 10; i++) g.forecast();
  assert.deepEqual(g.scene.board, board); assert.equal(g.scene.mode, "plan"); assert.equal(g.scene.score, 0);
});

test("a mirror and a link clear the first encounter through actual enemy fire", () => {
  const g = createRuleWorld();
  assert.equal(g.play("mirror", cell(5, 1)), true);
  assert.equal(g.play("link", cell(0, 1), cell(5, 3)), true);
  const preview = g.forecast(); assert.equal(preview.win, true); assert.equal(g.scene.score, 0);
  assert.equal(g.primary(), true); assert.equal(g.scene.mode, "resolve"); assert.equal(g.play("step", cell(2, 4)), false);
  tick(g); assert.equal(g.scene.mode, "clear"); assert.equal(g.scene.score, 100);
  assert.deepEqual(g.scene.board, preview.board);
});

test("portals bypass the wall and barrels trigger a real chain in encounter two", () => {
  const g = createRuleWorld({ level: 1 });
  assert.equal(g.play("portal", cell(2, 2), cell(4, 3)), true);
  assert.equal(g.play("link", cell(0, 2), cell(6, 3)), true);
  const preview = g.forecast(); assert.equal(preview.win, true);
  assert.ok(preview.shots.some(s => s.path.some(p => p.jump)));
  assert.ok(preview.shots.some(s => s.explosions.length)); g.primary(); tick(g); assert.equal(g.scene.mode, "clear");
});

test("armored encounter is winnable with push, reflection, linking and a return portal", () => {
  const g = createRuleWorld({ level: 2 });
  assert.equal(g.play("push", cell(0, 1), cell(0, 0)), true);
  assert.equal(g.play("mirror", cell(5, 3)), true);
  assert.equal(g.play("link", cell(6, 3), cell(5, 2)), true);
  assert.equal(g.forecast().cargoHp, 3); assert.equal(g.forecast().remaining, 1);
  g.primary(); tick(g); assert.equal(g.scene.turn, 1); assert.equal(g.scene.mode, "plan");
  assert.equal(g.play("portal", cell(3, 0), cell(5, 0)), true); assert.equal(g.forecast().win, true);
  g.primary(); tick(g); assert.equal(g.scene.phase, "won"); assert.equal(g.scene.score, 300);
});

test("undo restores positions, rules, costs and the exact forecast", () => {
  const g = createRuleWorld(), start = g.forecast(); g.play("mirror", cell(5, 1)); g.play("link", cell(0, 1), cell(5, 3));
  assert.equal(g.scene.energy, 1); assert.equal(g.secondary(), true); assert.equal(g.scene.energy, 2);
  assert.equal(g.secondary(), true); assert.equal(g.scene.energy, 3); assert.deepEqual(g.forecast(), start);
  assert.equal(g.secondary(), false);
});

test("invalid cards, repeated use, occupied mirrors and overspending do not change state", () => {
  const g = createRuleWorld({ level: 1 }), before = g.checkpoint();
  for (const args of [["unknown", 2], ["mirror", cell(0, 2)], ["portal", 1, 1], ["step", 999], ["swap", 0, 0], ["link", cell(1, 4), cell(6, 3)]]) assert.equal(g.play(...args), false);
  assert.deepEqual(g.checkpoint(), before);
  assert.equal(g.play("portal", cell(2, 2), cell(4, 3)), true); assert.equal(g.play("portal", 0, 1), false);
  assert.equal(g.play("mirror", cell(2, 3)), true); assert.equal(g.play("step", cell(2, 4)), false); assert.equal(g.scene.energy, 0);
});

test("swapping moves real units, stepping traverses a portal, pushing obeys occupancy", () => {
  const g = createRuleWorld({ level: 2 });
  assert.equal(g.play("swap", cell(0, 1), cell(6, 3)), true);
  assert.deepEqual(g.scene.board.units.find(u => u.id === "a").pos, [6, 3]);
  g.secondary(); assert.equal(g.play("push", cell(0, 1), cell(0, 0)), true);
  assert.equal(g.scene.board.units.find(u => u.id === "a").hp, 0);
  g.secondary(); assert.equal(g.play("push", cell(4, 2), cell(5, 2)), false);
  const portal = createRuleWorld({ level: 1 }); portal.play("portal", cell(2, 4), cell(4, 4));
  assert.equal(portal.play("step", cell(2, 4)), true); assert.deepEqual(portal.scene.board.units.find(u => u.id === "you").pos, [4, 4]);
});

test("stop freezes a shot in flight and a checkpoint resumes the same outcome", () => {
  const sounds = [], g = createRuleWorld({ onEvent: e => sounds.push(e) }); g.play("mirror", cell(5, 1)); g.play("link", cell(0, 1), cell(5, 3)); g.primary(); tick(g, 200);
  g.stop(); const cp = g.checkpoint(), n = sounds.length; tick(g); assert.deepEqual(g.checkpoint(), cp);
  assert.equal(g.primary(), false); assert.equal(g.secondary(), false); assert.equal(g.retry(), false); assert.equal(g.play("mirror", 2), false); assert.equal(g.key("1", true), false);
  assert.equal(sounds.length, n); const r = createRuleWorld({ checkpoint: cp }); assert.deepEqual(r.checkpoint(), cp);
  tick(r); assert.equal(r.scene.mode, "clear"); assert.ok(JSON.stringify(cp).length < 8192);
});

test("lost cargo is a real defeat, even if an enemy is destroyed too", () => {
  const g = createRuleWorld({ level: 2 }); g.primary(); tick(g);
  assert.ok(g.scene.board.units.find(u => u.id === "cargo").hp < 3);
  for (let i = 0; i < 7 && g.scene.phase === "playing"; i++) { g.primary(); tick(g); }
  assert.equal(g.scene.phase, "lost"); assert.equal(g.retry(), true); assert.equal(g.scene.turn, 0);
});

test("cancelled pointer and keyboard targeting never auto-commit a turn", () => {
  const g = createRuleWorld(); g.pointer("down", 700, 365); g.cancel(); assert.equal(g.pointer("up", 700, 365), false);
  g.key("1", true); g.key(" ", true); assert.equal(g.scene.mode, "plan"); assert.equal(g.scene.turn, 0);
});

test("checkpoint restores a partially selected pair, undo history and a completed encounter", () => {
  const g = createRuleWorld({ level: 1 }); g.play("mirror", 8); g.selectCard(2); g.target(16);
  const cp = g.checkpoint(), r = createRuleWorld({ checkpoint: cp }); assert.deepEqual(r.checkpoint(), cp);
  assert.equal(r.primary(), false); assert.equal(r.secondary(), true); assert.equal(r.scene.pending, null);
  assert.equal(r.secondary(), true); assert.equal(r.scene.board.mirrors.length, 0); assert.equal(r.scene.energy, 3);
  const a = createRuleWorld(); a.play("mirror", 12); a.play("link", 7, 26); a.primary(); tick(a);
  const done = createRuleWorld({ checkpoint: a.checkpoint() }); assert.equal(done.scene.mode, "clear"); done.primary(); assert.equal(done.scene.level, 1);
});

test("invalid saves fail closed and unknown properties never enter scene or export", () => {
  const g = createRuleWorld({ level: 1 }); g.play("mirror", 8); const good = g.checkpoint();
  for (const mutate of [v => v.energy = 7, v => v.board.u[0][2] = 99, v => v.board.u[0][5] = NaN, v => v.board.p = [[0, 0]], v => v.phase = "won", v => v.board.l = ["you", "a"], v => v.history = Array(9).fill(v.history[0]), v => v.used = [0, 0], v => v.elapsed = Infinity]) {
    const bad = structuredClone(good); mutate(bad); const r = createRuleWorld({ checkpoint: bad }); assert.equal(r.scene.level, 0); assert.equal(r.scene.energy, 3);
  }
  good.prompt = "private-content"; good.board.secret = "private-content"; good.history[0].path = "private-content";
  const r = createRuleWorld({ checkpoint: good }); assert.equal(JSON.stringify(r.scene).includes("private-content"), false); assert.equal(JSON.stringify(r.checkpoint()).includes("private-content"), false);
});

test("forecasts use bounded paths and apply linked damage once per direct hit", () => {
  const g = createRuleWorld(); g.play("mirror", 12); g.play("link", 7, 26);
  const f = g.forecast(); assert.ok(f.shots.every(s => s.path.length <= 130));
  assert.deepEqual(f.shots[0].impacts.map(i => i.id), ["b", "a"]); assert.equal(f.shots.length, 1);
});

test("seeded legal arrangements resolve exactly as forecast and resume every in-flight state", () => {
  let seed = 917;
  const random = n => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n; };
  const names = ["mirror", "swap", "portal", "link", "push", "step"];
  for (let run = 0; run < 40; run++) {
    const g = createRuleWorld({ level: run % 3 });
    for (let round = 0; round < 6 && g.scene.mode === "plan" && g.scene.phase === "playing"; round++) {
      for (let attempt = 0; attempt < 45; attempt++) g.play(names[random(6)], random(35), random(35));
      if (random(3) === 0) g.secondary();
      const expected = g.forecast(); g.primary(); tick(g, 110);
      const cp = g.checkpoint(); assert.ok(JSON.stringify(cp).length < 8192);
      const r = createRuleWorld({ checkpoint: cp }); assert.deepEqual(r.checkpoint(), cp);
      tick(r); tick(g); assert.deepEqual(g.scene.board, expected.board); assert.deepEqual(r.checkpoint(), g.checkpoint());
      assert.equal(g.scene.mode === "clear", expected.win && !expected.lose);
      assert.equal(g.scene.phase === "lost", expected.lose);
    }
  }
});

test("rotation, keyboard focus and paired-target cancellation preserve the planning contract", () => {
  const g = createRuleWorld({ level: 1 }); g.key("q", true); assert.equal(g.scene.flip, 1);
  g.key("ArrowLeft", true); assert.match(g.snapshot().status, /^E2/);
  g.key("3", true); g.target(cell(2, 2)); assert.equal(g.primary(), false); assert.equal(g.scene.energy, 3);
  g.key("Escape", true); assert.equal(g.scene.pending, null); assert.equal(g.scene.mode, "plan");
});
