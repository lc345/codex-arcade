import test from "node:test";
import assert from "node:assert/strict";
import { createYesterdayWorld } from "./studio/yesterday-express.js";
import { GAME_CATALOG, createGamePicker } from "./collection/catalog.js";
import { buildReviewedPack } from "./packs/build.js";

function advance(g, seconds = 5) { for (let i = 0; i < seconds * 120; i++) g.step(1000 / 120); }
function echo(g, node) { assert.equal(g.walkTo(node), true); assert.equal(g.primary(), true); advance(g, 4); }
function deliver(g, target) { assert.equal(g.walkTo(target), true); advance(g, 15); assert.equal(g.scene.completed, true); }

test("yesterday is a bounded offline preview with its own artwork and sounds", () => {
  const p = GAME_CATALOG.find(p => p.id === "yesterday-express"), picker = createGamePicker(() => .4);
  assert.equal(p.persistentCheckpoint, true); assert.equal(p.release, "preview");
  for (let i = 0; i < 60; i++) assert.notEqual(picker.pick(String(i)).id, p.id);
  assert.equal(picker.pick("pinned", p.id).id, p.id);
  const { source, manifest } = buildReviewedPack(p.id);
  assert.equal(manifest.offline, true); assert.deepEqual(manifest.permissions, []); assert.deepEqual(manifest.dependencies, []);
  assert.equal((source.match(/data:image\//g) ?? []).length, 1); assert.ok(source.includes("createYesterdaySound")); assert.ok(manifest.bytes < 800000);
});

test("a courier cannot cross a closed bridge or deliver while idle", () => {
  const g = createYesterdayWorld(); advance(g, 30); assert.equal(g.scene.completed, false);
  g.walkTo(5); advance(g, 10); assert.equal(g.scene.actors[0].node, 2); assert.equal(g.scene.parcel.owner, null);
  assert.equal(g.scene.score, 0);
});

test("a recorded destination creates an echo, not a teleport past the gate", () => {
  const g = createYesterdayWorld(); echo(g, 5);
  assert.equal(g.scene.actors[0].node, 2); assert.equal(g.scene.records.length, 1);
  g.walkTo(1); advance(g, 10); assert.equal(g.scene.completed, true);
  assert.equal(g.scene.parcel.delivered, true);
});

test("three chapters are solvable through real destination and record inputs", () => {
  const g = createYesterdayWorld(); echo(g, 1); deliver(g, 5);
  assert.equal(g.primary(), true); assert.equal(g.scene.level, 1);
  echo(g, 1); echo(g, 2); deliver(g, 7);
  assert.equal(g.primary(), true); assert.equal(g.scene.level, 2);
  echo(g, 1); echo(g, 6); advance(g, 4);
  assert.equal(g.scene.parcel.owner, 1); assert.equal(g.scene.parcel.delivered, false);
  g.walkTo(7); advance(g, 3); assert.equal(g.scene.parcel.node, 8);
  deliver(g, 9); assert.equal(g.scene.phase, "won"); assert.equal(g.scene.score, 300);
});

test("the upper parcel needs the chute and cannot be carried down the stairs", () => {
  const g = createYesterdayWorld({ level: 2 }); echo(g, 1);
  g.walkTo(5); advance(g, 8); assert.equal(g.scene.parcel.owner, 1);
  g.walkTo(9); advance(g, 8); assert.equal(g.scene.actors[1].node, 3);
  assert.equal(g.scene.parcel.delivered, false); assert.equal(g.scene.parcel.drop, null);
});

test("recording, undo and chapter restart are bounded and award no free points", () => {
  const g = createYesterdayWorld(); assert.equal(g.primary(), false);
  echo(g, 1); g.walkTo(2); assert.equal(g.primary(), false); assert.equal(g.scene.records.length, 1);
  assert.equal(g.secondary(), true); assert.equal(g.scene.records.length, 0); assert.equal(g.scene.actors.length, 1);
  assert.equal(g.scene.score, 0); assert.equal(g.secondary(), false);
  assert.equal(g.retry(), true);
});

test("recording trims thinking time before the first destination, retaining later timing", () => {
  const g = createYesterdayWorld(); advance(g, 60); g.walkTo(1); advance(g, 1); g.walkTo(2); g.primary();
  assert.equal(g.scene.records[0][0][0], 0); assert.equal(g.scene.records[0][1][0], 120);
});

test("stop freezes the exact state and silences all new interactions", () => {
  const sounds = [], g = createYesterdayWorld({ onEvent: e => sounds.push(e) });
  echo(g, 1); g.walkTo(5); advance(g, .3); g.stop(); const cp = g.checkpoint(), n = sounds.length;
  advance(g, 10); for (const action of [() => g.walkTo(1), () => g.primary(), () => g.secondary(), () => g.retry(), () => g.key(" ", true), () => g.pointer("down", 100, 300)]) assert.equal(action(), false);
  assert.deepEqual(g.checkpoint(), cp); assert.equal(sounds.length, n);
});

test("checkpoint resumes mid-walk and mid-rewind without drift or private data", () => {
  for (const state of ["walking", "rewind"]) {
    const g = createYesterdayWorld(); g.walkTo(1); advance(g, .2); if (state === "rewind") g.primary();
    const cp = g.checkpoint(), restored = createYesterdayWorld({ checkpoint: cp });
    assert.deepEqual(restored.checkpoint(), cp); advance(g, 3); advance(restored, 3);
    assert.deepEqual(restored.checkpoint(), g.checkpoint()); assert.ok(JSON.stringify(cp).length < 8192);
    assert.equal("status" in cp, false); assert.equal("prompt" in cp, false);
  }
});

test("invalid checkpoints fail closed to a fresh first chapter", () => {
  const g = createYesterdayWorld(); echo(g, 1); const good = g.checkpoint();
  for (const mutate of [v => v.actors[0].node = 90, v => v.records[0][0][1] = 999, v => v.parcel.owner = 12, v => v.completed = true, v => v.tick = NaN, v => v.records.push(...Array(10).fill([])), v => v.actors[0].next = 5]) {
    const cp = structuredClone(good); mutate(cp); const restored = createYesterdayWorld({ checkpoint: cp });
    assert.equal(restored.scene.records.length, 0); assert.equal(restored.scene.level, 0);
  }
});

test("parcel handoff preserves single ownership through a mid-air checkpoint", () => {
  const g = createYesterdayWorld({ level: 2 }); echo(g, 1); echo(g, 6); advance(g, 4); g.walkTo(7);
  for (let i = 0; i < 1000 && g.scene.parcel.drop === null; i++) g.step(1000 / 120);
  assert.notEqual(g.scene.parcel.drop, null); assert.equal(g.scene.parcel.owner, null); assert.equal(g.scene.parcel.node, null);
  const cp = g.checkpoint(), r = createYesterdayWorld({ checkpoint: cp }); assert.deepEqual(r.checkpoint(), cp);
  advance(r, 2); advance(g, 2); assert.deepEqual(r.checkpoint(), g.checkpoint()); assert.equal(r.scene.parcel.node, 8);
  r.walkTo(9); advance(r, 10); assert.equal(r.scene.parcel.delivered, true); assert.equal(r.scene.parcel.owner, null);
});

test("unknown checkpoint properties are not carried into the game or export", () => {
  const g = createYesterdayWorld(), cp = g.checkpoint(); cp.prompt = "private-value"; cp.actors[0].path = "private-value"; cp.parcel.output = "private-value";
  const r = createYesterdayWorld({ checkpoint: cp }); assert.equal(JSON.stringify(r.scene).includes("private-value"), false); assert.equal(JSON.stringify(r.checkpoint()).includes("private-value"), false);
});

test("destination command limits keep every saved scene below the host budget", () => {
  const g = createYesterdayWorld({ level: 2 });
  for (let echo = 0; echo < 3; echo++) {
    for (let i = 0; i < 32; i++) assert.equal(g.walkTo(i % 2 ? 0 : 1), true);
    assert.equal(g.walkTo(2), false); if (echo < 2) { assert.equal(g.primary(), true); advance(g, 1); }
  }
  assert.ok(JSON.stringify(g.checkpoint()).length < 8192); assert.equal(g.scene.records.length, 2);
});

test("cancelled pointers, invalid coordinates and blocked keys do not record", () => {
  const g = createYesterdayWorld(); assert.equal(g.walkTo(NaN), false); assert.equal(g.walkTo(50), false);
  assert.equal(g.pointer("down", NaN, 50), false); g.pointer("down", 120, 350); g.cancel(); g.pointer("up", 120, 350);
  assert.equal(g.scene.commands.length, 0); assert.equal(g.key(" ", true), true); assert.equal(g.scene.records.length, 0);
  g.key("ArrowRight", true); g.key(" ", true); assert.equal(g.scene.commands.length, 1);
  assert.match(g.snapshot().status, /踏板 A/);
  g.key("Enter", true); advance(g, 3); assert.equal(g.scene.records.length, 1);
});
