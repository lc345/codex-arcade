import test from "node:test";
import assert from "node:assert/strict";
import { createKitchenWorld } from "./studio/kitchen-defense.js";
import { GAME_CATALOG, createGamePicker } from "./collection/catalog.js";
import { buildReviewedPack } from "./packs/build.js";

const tick = (g, ms) => { for (let i = 0; i < ms; i += 1000 / 120) g.step(1000 / 120); };
const click = (g, x, y) => { g.pointer("down", x, y); return g.pointer("up", x, y); };

test("kitchen ships as an offline checkpointable preview, separate from the stable random bag", () => {
  const p = GAME_CATALOG.find(p => p.id === "kitchen-defense");
  assert.equal(p?.persistentCheckpoint, true); assert.equal(p.release, "preview");
  const picker = createGamePicker(() => .5);
  for (let i = 0; i < 50; i++) assert.notEqual(picker.pick(String(i)).id, p.id);
  assert.equal(picker.pick("pinned", p.id).id, p.id);
  const { source, manifest } = buildReviewedPack(p.id);
  assert.equal(manifest.offline, true); assert.deepEqual(manifest.permissions, []);
  assert.ok(source.includes("createKitchenSound")); assert.ok(source.includes("data:image/jpeg;base64,"));
  assert.ok(manifest.bytes < 1400000);
});

test("kitchen starts in preparation, has real budgets and accepts pointer placement", () => {
  const g = createKitchenWorld(), s = g.scene;
  tick(g, 1000); assert.equal(s.mode, "prep"); assert.equal(s.enemies.length, 0);
  const money = s.coins;
  assert.equal(g.place("unknown", 2), false);
  assert.equal(g.place("frost", 999), false);
  click(g, 278, 492); click(g, s.slots[2].x, s.slots[2].y);
  assert.equal(s.slots[2].tower.kind, "frost"); assert.equal(s.coins, money - 50);
  assert.equal(g.place("heat", 2), false); assert.equal(s.coins, money - 50);
  assert.equal(g.place("heat", 4), true);
  assert.equal(g.place("pan", 1), false, "overspending cannot create a tower");
  g.primary(); tick(g, 100); assert.equal(s.mode, "battle"); assert.ok(s.enemies.length > 0);
  g.destroy();
});

test("cold followed by heat creates a real area steam reaction, not a cosmetic label", () => {
  const events = [], g = createKitchenWorld({ onEvent: e => events.push(e.type) }), s = g.scene;
  g.place("frost", 2); g.place("heat", 4); g.primary(); tick(g, 20);
  const e = s.enemies[0]; e.d = 300; e.hp = e.maxHp = 500; e.chill = 2; e.shock = 0;
  s.slots[4].tower.cooldown = 0; s.slots[4].x = 620;
  const neighbor = { ...e, id: 998, d: 318, hp: 500 }; s.enemies.push(neighbor);
  tick(g, 800);
  assert.ok(s.combos.steam > 0); assert.ok(e.hp < 470); assert.ok(neighbor.hp < 500);
  assert.ok(events.includes("kitchen-steam")); g.destroy();
});

test("a pan changes enemy position and can cause a rear-end collision", () => {
  const g = createKitchenWorld(), s = g.scene;
  g.place("pan", 2); g.primary(); tick(g, 20);
  const e = s.enemies[0]; e.d = 385; e.hp = e.maxHp = 500;
  s.enemies.push({ ...e, id: 998, d: 360 }); s.slots[2].tower.cooldown = 0;
  tick(g, 1300);
  assert.ok(s.combos.bounce > 0); assert.ok(s.combos.collision > 0);
  assert.ok(e.d < 400, "knockback overcomes forward motion"); g.destroy();
});

test("keyboard selects equipment and sockets without depending on mouse focus history", () => {
  const g = createKitchenWorld(); g.key("ArrowRight", true); g.key("ArrowUp", true);
  const slot = g.scene.cursor; g.key(" ", true);
  assert.equal(g.scene.slots[slot].tower.kind, "frost");
  g.key("u", true); assert.equal(g.scene.slots[slot].tower.level, 2);
  g.destroy();
});

test("mid-battle checkpoint restores projectiles, timers, rewards and deterministic simulation", () => {
  const g = createKitchenWorld(); g.place("frost", 2); g.place("heat", 4); g.primary(); tick(g, 9000);
  const cp = g.checkpoint(); assert.ok(JSON.stringify(cp).length < 8192);
  g.stop(); const r = createKitchenWorld({ checkpoint: JSON.parse(JSON.stringify(cp)) });
  assert.deepEqual(r.checkpoint(), cp);
  const a = createKitchenWorld({ checkpoint: cp });
  tick(r, 6000); tick(a, 6000); assert.deepEqual(r.checkpoint(), a.checkpoint());
  g.destroy(); r.destroy(); a.destroy();
});

test("a late-wave save remains valid after the last scheduled enemy has spawned", () => {
  const g = createKitchenWorld(); g.sell(3); g.primary(); tick(g, 30000);
  assert.equal(g.scene.mode, "battle"); const cp = g.checkpoint(), r = createKitchenWorld({ checkpoint: cp });
  assert.deepEqual(r.checkpoint(), cp);
  tick(g, 1000); tick(r, 1000); assert.deepEqual(r.checkpoint(), g.checkpoint());
  g.destroy(); r.destroy();
});

test("a cancelled pointer cannot buy a tower on a later release", () => {
  const g = createKitchenWorld(), money = g.scene.coins;
  g.pointer("down", 240, 230); g.cancel(); assert.equal(g.pointer("up", 240, 230), false);
  assert.equal(g.scene.coins, money); assert.equal(g.scene.slots[0].tower, null); g.destroy();
});

test("malformed saves fail closed and never forward extra values into the scene", () => {
  const g = createKitchenWorld(); g.primary(); tick(g, 2000); const cp = g.checkpoint();
  for (const bad of [null, "bad", { ...cp, coins: Infinity }, { ...cp, towers: Array(200).fill([]) }, { ...cp, wave: 99 }, { ...cp, enemies: [["<script>"]] }]) {
    const r = createKitchenWorld({ checkpoint: bad }); assert.equal(r.scene.mode, "prep"); assert.equal(r.scene.wave, 0); r.destroy();
  }
  const r = createKitchenWorld({ checkpoint: { ...cp, prompt: "secret", path: "/private/test" } });
  assert.equal(JSON.stringify(r.checkpoint()).includes("secret"), false); r.destroy(); g.destroy();
});

test("stop freezes all simulation and input including buying, rewards, retry and audio", () => {
  const events = [], g = createKitchenWorld({ onEvent: e => events.push(e) }); g.primary(); tick(g, 1000); g.stop();
  const state = JSON.stringify(g.scene), n = events.length;
  tick(g, 10000); assert.equal(g.place("pan", 1), false); assert.equal(g.upgrade(3), false);
  assert.equal(g.chooseReward(0), false); assert.equal(g.primary(), false); assert.equal(g.secondary(), false);
  assert.equal(g.retry(), false); assert.equal(g.pointer("down", 300, 300), false); assert.equal(g.key("Enter", true), false);
  assert.equal(JSON.stringify(g.scene), state); assert.equal(events.length, n); g.destroy(); g.destroy();
});

test("neglecting defense loses and retry creates a clean new shift", () => {
  const g = createKitchenWorld(); g.sell(3); g.primary();
  for (let i = 0; i < 24000 && g.scene.phase === "playing"; i++) { if (g.scene.mode === "reward") g.chooseReward(0); if (g.scene.mode === "prep") g.primary(); g.step(1000 / 120); }
  assert.equal(g.scene.phase, "lost"); g.retry(); assert.equal(g.scene.mode, "prep"); assert.equal(g.scene.lives, 8); assert.equal(g.scene.wave, 0); g.destroy();
});

for (const build of ["steam", "bounce"]) test(`${build} build wins a complete shift through legal purchases and wave controls`, () => {
  const g = createKitchenWorld(), s = g.scene;
  const plan = build === "steam" ? [["frost", 2], ["heat", 4], ["heat", 1], ["frost", 0], ["pop", 7], ["pan", 9]] : [["pan", 2], ["pop", 4], ["pan", 1], ["heat", 0], ["pop", 7], ["frost", 9]];
  let next = 0, guards = 0;
  for (let i = 0; i < 42000 && s.phase === "playing"; i++) {
    if (s.mode === "reward") { g.chooseReward(Math.max(0, s.offers.indexOf(build === "steam" ? "steam" : "spring"))); guards++; }
    if (s.mode === "prep") {
      while (next < plan.length && g.place(...plan[next])) next++;
      for (const index of [2, 4, 3, 1, 0, 7]) g.upgrade(index);
      g.primary();
    }
    if (s.enemies.length >= 5) g.secondary();
    g.step(1000 / 120);
  }
  assert.equal(s.phase, "won", JSON.stringify(g.snapshot())); assert.equal(s.wave, 5); assert.equal(guards, 4);
  assert.ok(s.combos[build === "steam" ? "steam" : "bounce"] > 0);
  assert.ok(s.lives > 0); assert.ok(JSON.stringify(g.checkpoint()).length < 8192); g.destroy();
});
