import test from "node:test";
import assert from "node:assert/strict";
import { createDiceWorld } from "./studio/dice-foundry.js";
import { solveDice } from "../../tools/dice-replays.mjs";
import { GAME_CATALOG, createGamePicker } from "./collection/catalog.js";
import { buildReviewedPack } from "./packs/build.js";

const tick = (g, ms) => { for (let t = 0; t < ms; t += 1000 / 120) g.step(1000 / 120); };
const roll = g => { assert.equal(g.primary(), true); tick(g, 700); assert.equal(g.scene.mode, "plan"); };
const place = (g, order = [0, 1, 2]) => order.forEach((d, slot) => assert.equal(g.assign(d, slot), true));

test("dice factory waits for input and rejects invalid assignments", () => {
  const g = createDiceWorld(); tick(g, 3000); assert.equal(g.scene.mode, "ready"); assert.equal(g.scene.score, 0);
  assert.equal(g.assign(0, 1), false); assert.equal(g.selectDie(NaN), false); assert.equal(g.setLevel(5), false); g.destroy();
});

test("dice results are committed before rolling animation and persist exactly across stop", () => {
  const g = createDiceWorld({ seed: 7 }); g.primary(); tick(g, 120); g.stop(); const cp = g.checkpoint();
  assert.ok(cp.roll.every(n => n >= 0 && n < 6)); tick(g, 900); assert.deepEqual(g.checkpoint(), cp); assert.equal(g.secondary(), false);
  const restored = createDiceWorld({ checkpoint: cp }); tick(restored, 650); assert.equal(restored.scene.mode, "plan");
  assert.deepEqual(restored.scene.roll, cp.roll); assert.equal(restored.checkpoint().rng, cp.rng); restored.destroy(); g.destroy();
});

test("dice hold and one reroll preserve held faces and consume no score", () => {
  const g = createDiceWorld({ seed: 17 }); roll(g); const before = [...g.scene.roll];
  g.toggleHold(0); assert.equal(g.secondary(), true); tick(g, 700); assert.equal(g.scene.roll[0], before[0]);
  assert.equal(g.secondary(), false); assert.equal(g.scene.rerolls, 0); assert.equal(g.scene.score, 0);
  place(g); g.assign(0, 2); assert.deepEqual(g.scene.slots, [2, 1, 0]); assert.equal(g.assign(3, 0), false); g.destroy();
});

test("dice forecast is the same outcome as the real three-device resolution", () => {
  const g = createDiceWorld({ seed: 11 }); roll(g); assert.equal(g.primary(), false); place(g);
  const forecast = g.forecast(); assert.equal(g.primary(), true); tick(g, 2700);
  assert.deepEqual(g.scene.stats, forecast.final); assert.ok(g.scene.log.length > 0); g.destroy();
});

test("dice dragging cancels without placement and keyboard can fill all three devices", () => {
  const g = createDiceWorld(); roll(g); g.pointer("down", 270, 266); g.pointer("move", 240, 390); g.cancel(); g.pointer("up", 240, 390);
  assert.deepEqual(g.scene.slots, [-1, -1, -1]);
  for (const k of ["1", "4", "2", "5", "3", "6"]) g.key(k, true);
  assert.deepEqual(g.scene.slots, [0, 1, 2]); g.destroy();
});

test("dice keyboard selections expose face, lock and workshop target in accessible status", () => {
  const g = createDiceWorld(); roll(g); g.key("2", true);
  const s = g.scene, face = s.faces[s.decks[1][s.roll[1]]];
  assert.ok(g.snapshot().status.includes(`骰子B · ${face.name} ${s.roll[1] + 1}点`));
  g.key("l", true); assert.match(g.snapshot().status, /已锁定/);
  solveDice(g); g.destroy();
  const other = createDiceWorld();
  for (let i = 0; i < 15 && other.scene.mode !== "reward"; i++) { roll(other); place(other); other.primary(); tick(other, 2400); }
  assert.equal(other.scene.mode, "reward"); other.key("ArrowRight", true);
  assert.match(other.snapshot().status, /替换骰子A的2点面/); other.destroy();
});

test("dice recovery filters private fields and rejects corrupt state", () => {
  const g = createDiceWorld(); roll(g); place(g); g.primary(); tick(g, 650); g.stop(); const cp = g.checkpoint();
  const restored = createDiceWorld({ checkpoint: { ...cp, prompt: "SECRET_DICE", path: "/private/task" } });
  assert.ok(!JSON.stringify(restored.checkpoint()).includes("SECRET_DICE")); assert.ok(JSON.stringify(cp).length < 8192);
  tick(restored, 2300); const expected = createDiceWorld({ checkpoint: cp }); tick(expected, 2300); assert.deepEqual(restored.scene.stats, expected.scene.stats);
  for (const patch of [{ roll: [0, 0, 90] }, { slots: [0, 0, 0] }, { rng: Infinity }, { mode: "clear" }, { decks: [[99]] }]) {
    const bad = createDiceWorld({ checkpoint: { ...cp, ...patch } }); assert.equal(bad.scene.mode, "ready"); bad.destroy();
  }
  restored.destroy(); expected.destroy(); g.destroy();
});

function arrangement(types, pips = [2, 3, 4], state = [24, 4, 0, 0, 24]) {
  const g = createDiceWorld(); roll(g); place(g); const cp = g.checkpoint(); g.destroy();
  cp.roll = pips.map(p => p - 1); cp.stats = state; types.forEach((type, d) => cp.decks[d][pips[d] - 1] = type);
  return createDiceWorld({ checkpoint: cp });
}

test("dice charge before discharge changes the actual result, not only the animation", () => {
  const g = arrangement([1, 3, 0]); const forward = g.forecast([0, 1, 2]), backward = g.forecast([1, 0, 2]);
  assert.equal(forward.win, true); assert.equal(backward.win, false); assert.equal(backward.final.enemy, 1);
  assert.deepEqual(g.scene.stats, { hp: 24, energy: 4, heat: 0, shield: 0, enemy: 24 }); g.destroy();
});

test("dice counter uses actual blocked damage and shields expire after the attack", () => {
  const g = arrangement([2, 4, 2]); const result = g.forecast();
  assert.equal(result.final.enemy, 14); assert.equal(result.final.hp, 24); assert.equal(result.final.shield, 0);
  assert.equal(result.frames[3].type, "counter"); g.destroy();
});

test("dice copies only base effects, amplifiers do not stack, and low faces use original pips", () => {
  const g = arrangement([1, 5, 3], [2, 3, 4], [24, 0, 0, 0, 24]); assert.equal(g.forecast().final.enemy, 0); g.destroy();
  const amp = arrangement([10, 5, 0]); assert.equal(amp.forecast().frames[2].damage, 14); amp.destroy();
  const low = arrangement([2, 11, 2]); assert.equal(low.forecast().frames[1].damage, 10); low.destroy();
  const high = arrangement([2, 11, 2], [2, 4, 3]); assert.equal(high.forecast().frames[1].damage, 0); high.destroy();
});

test("dice overheat can hurt after a killing shot and cooling prevents that cost", () => {
  const hot = arrangement([6, 6, 0], [2, 3, 4], [24, 4, 0, 0, 24]); const h = hot.forecast(); assert.equal(h.final.hp, 16); assert.equal(h.final.heat, 1); hot.destroy();
  const cool = arrangement([6, 7, 0], [2, 3, 4], [24, 4, 4, 0, 24]); assert.equal(cool.forecast().final.heat, 0); assert.ok(cool.forecast().final.hp > 16); cool.destroy();
});

test("dice loss and retry restore the encounter entry without farming repairs", () => {
  const g = arrangement([6, 6, 6], [2, 3, 4], [4, 4, 7, 0, 24]); g.primary(); tick(g, 2400);
  assert.equal(g.scene.phase, "lost"); const cp = g.checkpoint(); g.retry(); assert.equal(g.scene.stats.hp, cp.entry.hp); assert.deepEqual(g.scene.decks, cp.entry.decks);
  const r = g.checkpoint(); g.retry(); assert.deepEqual(g.checkpoint(), r); g.destroy();
});

test("dice can resume between lethal damage and the final loss screen", () => {
  const g = arrangement([6, 6, 6], [2, 3, 4], [4, 4, 7, 0, 24]); g.primary(); tick(g, 2050);
  assert.equal(g.scene.mode, "resolve"); assert.equal(g.scene.stats.hp, 0); g.stop();
  const r = createDiceWorld({ checkpoint: g.checkpoint() }); assert.equal(r.scene.mode, "resolve"); tick(r, 400);
  assert.equal(r.scene.phase, "lost"); r.destroy(); g.destroy();
});

test("dice stop freezes every stage and rejects input, upgrades and new sounds", () => {
  for (const ms of [0, 120, 700, 1300, 2050, 2450]) {
    const events = [], g = createDiceWorld({ onEvent: e => events.push(e) }); g.primary(); tick(g, 700); place(g); g.primary(); tick(g, ms); g.stop();
    const saved = g.checkpoint(), count = events.length; tick(g, 3000);
    for (const result of [g.primary(), g.secondary(), g.assign(0, 1), g.toggleHold(0), g.install(1, 1), g.selectOffer(0), g.key("1", true), g.pointer("down", 300, 260), g.retry()]) assert.equal(result, false);
    assert.deepEqual(g.checkpoint(), saved); assert.equal(events.length, count); g.destroy();
  }
});

test("dice winning unlocks a real face replacement, with reversible installation and no duplicate reward", () => {
  const g = arrangement([1, 3, 0]); g.primary(); tick(g, 2400); assert.equal(g.scene.mode, "reward");
  const before = g.checkpoint(), hp = g.scene.stats.hp; g.selectOffer(0); assert.equal(g.install(2, 0), true); assert.equal(g.scene.decks[2][0], 3);
  assert.equal(g.install(2, 1), false); assert.equal(g.scene.stats.hp, hp); g.secondary(); assert.deepEqual(g.scene.decks, before.decks);
  g.install(2, 0); const r = createDiceWorld({ checkpoint: g.checkpoint() }); assert.equal(r.scene.mode, "between"); r.primary();
  assert.equal(r.scene.level, 1); assert.equal(r.scene.decks[2][0], 3); assert.equal(r.scene.stats.hp, Math.min(32, hp + 8)); r.destroy(); g.destroy();
});

test("dice twelve faces remain bounded in every sequence and order", () => {
  for (let a = 0; a < 12; a++) for (let b = 0; b < 12; b++) {
    const g = arrangement([a, b, 5], [2, 3, 6]); const cp = g.checkpoint();
    for (const order of [[0, 1, 2], [2, 1, 0], [1, 0, 2]]) { const p = g.forecast(order); assert.ok(Object.values(p.final).every(Number.isFinite)); assert.ok(p.final.hp >= 0 && p.final.hp <= 32); assert.ok(p.final.energy <= 18); assert.equal(p.frames.length, 4); }
    assert.deepEqual(g.checkpoint(), cp); g.destroy();
  }
});

test("dice both charge and counter builds complete all six encounters using public player actions", () => {
  for (const style of ["charge", "counter"]) for (const seed of [1, 7, 11, 37]) {
    const g = createDiceWorld({ seed }); const result = solveDice(g, style);
    assert.equal(g.scene.phase, "won", `${style}/${seed}: ${g.scene.level}`); assert.equal(g.scene.score, 600); assert.equal(result.upgrades.length, 5); assert.equal(new Set(result.rounds.map(r => r.level)).size, 6); g.destroy();
  }
});

test("dice is one offline manual preview without physics downloads or Agent permissions", () => {
  const p = GAME_CATALOG.find(g => g.id === "dice-foundry"), picker = createGamePicker(() => .4); assert.equal(p.release, "preview");
  for (let i = 0; i < 40; i++) assert.notEqual(picker.pick(`r${i}`).id, p.id);
  const { source, manifest } = buildReviewedPack(p.id); assert.deepEqual(manifest.permissions, []); assert.deepEqual(manifest.dependencies, []);
  assert.equal((source.match(/data:image\//g) ?? []).length, 1); assert.ok(manifest.bytes < 600000); assert.equal(manifest.offline, true);
});
