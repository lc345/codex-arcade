import test from "node:test";
import assert from "node:assert/strict";
import * as catalog from "./collection/catalog.js";
import { createPackHost } from "./packs/host.js";

test("the task pool contains exactly 100 distinct retained works", () => {
  assert.equal(catalog.PLAYABLE_CATALOG?.length, 100);
  assert.equal(new Set(catalog.PLAYABLE_CATALOG.map(g => g.id)).size, 100);
  const picker = catalog.createGamePicker(() => .31, catalog.PLAYABLE_CATALOG);
  let previous;
  for (let round = 0; round < 3; round++) {
    const seen = new Set();
    for (let n = 0; n < 100; n++) {
      const run = `${round}:${n}`, game = picker.pick(run, null, "all");
      assert.equal(picker.pick(run, null, "all").id, game.id);
      assert.notEqual(previous, game.id);
      seen.add(game.id); previous = game.id;
    }
    assert.equal(seen.size, 100);
  }
});

test("the default host loads all 100, never passes task contents, and stops each child", async () => {
  const seen = new Set(); let starts = 0, stops = 0;
  const host = createPackHost({}, {}, async id => {
    seen.add(id);
    return () => ({
      start(...args) { assert.deepEqual(args, []); starts++; },
      stop() { stops++; }, destroy() {}, setMuted() {}, setReduced() {}, setPaused() {}, setLevel() {},
    });
  });
  for (let n = 0; n < 100; n++) {
    host.start({ runId: String(n), secret: "must not reach a game" });
    await new Promise(resolve => setImmediate(resolve));
    host.stop(); assert.equal(host.active, false); assert.equal(host.input("tap"), false);
  }
  host.destroy(); assert.equal(seen.size, 100); assert.equal(starts, 100); assert.ok(stops >= starts);
});
