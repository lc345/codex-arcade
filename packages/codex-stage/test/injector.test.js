import assert from "node:assert/strict";
import test from "node:test";
import { createCodexStageInjectorSource, ensureCodexStageDock } from "../src/injector.js";
import { GAME_CATALOG } from "../../../apps/codex-stage/collection/catalog.js";

test("the self-contained dock expression compiles and has no remote runtime loader", () => {
  const source = createCodexStageInjectorSource();
  assert.doesNotThrow(() => new Function(source));
  assert.match(source, /attachShadow/);
  assert.match(source, /prior\.version === "0\.11\.0"/);
  assert.equal(source.includes('<option value=\\"curated\\"'),false);
  assert.equal(source.includes("fetch("), false);
  assert.equal(source.includes("ProseMirror"), false);
  assert.equal(source.includes('event.type === "tool.started"'), false);
  assert.equal(source.includes("localStorage"), false);
});
test("production lazy dock ships metadata and lifecycle, not every game asset", () => {
  const source = createCodexStageInjectorSource({ lazy: true });
  assert.doesNotThrow(() => new Function(source));
  assert.ok(Buffer.byteLength(source) < 50000);
  assert.equal(source.includes("data:image/jpeg;base64"), false);
  assert.equal(source.includes("fetch("), false);
  assert.match(source, /pendingPacks/);
  assert.match(source, /agent-stage:checkpoint:v1:/);
  assert.match(source, /persistentCheckpoint/);
  assert.match(source, /data-action=\\"resize\\"/);
  assert.match(source, /aria-pressed/);
  const catalog = Function('return '+source.match(/const GAME_CATALOG = (.*?); const createGamePicker/)[1])();
  assert.deepEqual(catalog, JSON.parse(JSON.stringify(GAME_CATALOG.map(({ id, title, hint, levels, release, hideLevels, persistentCheckpoint, curated, category, canvasHeight }) => ({ id, title, hint, levels, release, hideLevels, persistentCheckpoint, curated, category, canvasHeight })))));
  assert.ok(catalog.every(p => !Object.hasOwn(p, "cover") && !Object.hasOwn(p, "renderer")));
});

test("watchdog probes a live dock without retransmitting the game and artwork every tick", async () => {
  const calls = [];
  const evaluate = async (_target, code) => { calls.push(code); return true; };
  assert.deepEqual(await ensureCodexStageDock({}, evaluate, "large bundle"), { reused: true });
  assert.equal(calls.length, 1); assert.ok(calls[0].length < 200);
  const missing = [];
  await ensureCodexStageDock({}, async (_target, code) => { missing.push(code); return false; }, "large bundle");
  assert.equal(missing[1], "large bundle");
});
