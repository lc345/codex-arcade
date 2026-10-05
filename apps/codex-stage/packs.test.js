import test from "node:test";
import assert from "node:assert/strict";
import { createPackHost } from "./packs/host.js";
import { GAME_CATALOG } from "./collection/catalog.js";

function fakeFactory(log) {
  return (_canvas, callbacks) => {
    let active = false;
    return { start() { active = true; log.push("start"); callbacks.onState?.({ type: "started" }); },
      stop() { active = false; log.push("stop"); }, destroy() { active = false; log.push("destroy"); },
      input() { return active; }, setMuted(v) { log.push(["muted", v]); }, setReduced() {}, setPaused() {}, setLevel() { return true; },
      get active() { return active; }, get snapshot() { return { active, phase: "playing", score: 0 }; },
      controls: { primary: { label: "开始" } } };
  };
}
const flush = () => new Promise(resolve => setImmediate(resolve));

test("opted-in checkpoints persist after stop, survive host recreation and ignore oversized storage", async () => {
  const data = new Map(), storage = { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }, restored = [], log = [];
  const load = async () => (_c, callbacks) => { const runtime = fakeFactory(log)(_c, callbacks); return { ...runtime, restoreCheckpoint: cp => restored.push(cp), get checkpoint() { return { version: 1, job: 1, layout: [] }; } }; };
  const first = createPackHost({}, {}, load, storage); first.chooseProgram("toast-hop"); first.start({ runId: "one", secret: "private" }); await flush(); first.stop();
  assert.equal(data.size, 1); assert.ok(log.includes("stop")); assert.equal([...data.values()][0].includes("private"), false); first.destroy();
  const next = createPackHost({}, {}, load, storage); next.chooseProgram("toast-hop"); next.start({ runId: "two" }); await flush(); assert.deepEqual(restored.at(-1), { version: 1, job: 1, layout: [] }); next.destroy();
  for (const k of data.keys()) data.set(k, "x".repeat(9000));
  const bad = createPackHost({}, {}, load, storage); bad.chooseProgram("toast-hop"); bad.start({ runId: "three" }); await flush(); assert.equal(restored.at(-1), undefined); bad.destroy();
});
test("unavailable storage cannot prevent a task stopping, and other games never write to it", async () => {
  let writes = 0; const storage = { getItem() { throw new Error("blocked"); }, setItem() { writes++; throw new Error("full"); } };
  const load = async () => (...args) => ({ ...fakeFactory([])(...args), get checkpoint() { return { version: 1, job: 0, layout: [] }; } });
  const h = createPackHost({}, {}, load, storage); h.chooseProgram("rainline"); h.start({ runId: "one" }); await flush(); h.stop(); assert.equal(writes, 0);
  h.chooseProgram("toast-hop"); h.start({ runId: "two" }); await flush(); assert.doesNotThrow(() => h.stop()); assert.equal(h.active, false); assert.ok(writes > 0); h.destroy();
});

test("checkpoints resume the same pack across tasks without handing over any task data", async () => {
  const restored = [], received = [];
  const host = createPackHost({}, {}, async id => (_canvas, callbacks) => {
    const base = fakeFactory([])(_canvas, callbacks);
    return { ...base, start(...args) { received.push(args); base.start(); }, restoreCheckpoint(value) { restored.push([id, value]); }, get checkpoint() { return { version: 1, station: 2 }; } };
  });
  host.chooseProgram("rainline"); host.start({ runId: "one", secret: "never-forward" }); await flush();
  host.stop(); host.start({ runId: "two" }); await flush();
  assert.deepEqual(restored.at(-1), ["rainline", { version: 1, station: 2 }]);
  host.chooseProgram("ink-archive"); await flush();
  assert.deepEqual(restored.at(-1), ["ink-archive", undefined]);
  assert.ok(received.every(args => args.length === 0)); host.destroy();
});

test("pack host stops synchronously while a selected pack is still loading", async () => {
  let resolve; const log = [];
  const host = createPackHost({}, {}, () => new Promise(r => { resolve = r; }));
  host.start({ runId: "task" }); await flush();
  assert.equal(host.active, true); assert.equal(host.snapshot.phase, "loading");
  host.stop(); assert.equal(host.active, false); assert.equal(host.input("tap"), false);
  resolve(fakeFactory(log)); await flush(); assert.deepEqual(log, []);
  host.destroy();
});

test("latest selection wins; stale loads cannot start or emit lifecycle callbacks", async () => {
  const resolvers = new Map(), log = [], notices = [];
  const host = createPackHost({}, { onState: e => notices.push(e.type) }, id => new Promise(r => resolvers.set(id, r)));
  host.chooseProgram(GAME_CATALOG[0].id); host.start({ runId: "one" }); await flush();
  host.chooseProgram(GAME_CATALOG[1].id); await flush();
  resolvers.get(GAME_CATALOG[1].id)(fakeFactory(log)); await flush();
  assert.equal(host.program.id, GAME_CATALOG[1].id);
  resolvers.get(GAME_CATALOG[0].id)(fakeFactory(log)); await flush();
  assert.equal(log.filter(x => x === "start").length, 1);
  assert.equal(host.input("tap"), true); host.stop();
  assert.equal(host.input("tap"), false); host.destroy();
});

test("same task does not reload; pinning an unknown pack is rejected; cache is bounded", async () => {
  let loads = 0; const log = [];
  const host = createPackHost({}, {}, async () => { loads++; return fakeFactory(log); });
  assert.equal(host.chooseProgram("../../untrusted"), null);
  host.start({ runId: "same" }); await flush(); host.start({ runId: "same" }); await flush();
  assert.equal(loads, 1);
  for (const p of GAME_CATALOG.slice(0, 6)) { host.chooseProgram(p.id); await flush(); }
  assert.ok(host.diagnostics.cached <= 2); assert.equal(host.diagnostics.activeInstances, 1);
  host.stop(); assert.equal(host.active, false); host.destroy(); assert.equal(host.diagnostics.cached, 0);
});

test("failed pack loads are reported without restarting a completed task", async () => {
  const errors = [];
  const host = createPackHost({}, { onFeedback: e => errors.push(e.text) }, async () => { throw new Error("failed"); });
  host.start({ runId: "bad" }); await flush();
  assert.equal(host.snapshot.phase, "error"); assert.equal(host.input("tap"), false);
  assert.ok(errors.some(s => s.includes("加载"))); host.stop(); host.destroy();
});

test("a long task can shuffle all 100 games without a new task or adjacent repeats", async () => {
  const log = [], states = [], seen = new Set();
  const host = createPackHost({}, { onState: e => states.push(e.type) }, async () => fakeFactory(log));
  host.start({ runId: "long-task" }); await flush();
  seen.add(host.program.id);
  for (let i = 1; i < 100; i++) {
    const before = host.program.id;
    host.nextGame(); await flush();
    assert.notEqual(host.program.id, before);
    seen.add(host.program.id);
    const starts = log.filter(x => x === "start").length;
    host.start({ runId: "long-task" }); await flush();
    assert.equal(log.filter(x => x === "start").length, starts);
    assert.equal(host.diagnostics.activeInstances, 1);
    assert.ok(host.diagnostics.cached <= 2);
  }
  assert.equal(seen.size, 100);
  assert.ok(!states.includes("stopped"));
  host.stop(); assert.equal(host.nextGame(), null); assert.equal(host.active, false); host.destroy();
});

test("completion cancels a pending mid-task shuffle and preserves checkpoints", async () => {
  const log = [], restored = [], storage = new Map(); let finish;
  const host = createPackHost({}, {}, async id => {
    if (id !== "toast-hop") return new Promise(resolve => { finish = resolve; });
    return (...args) => ({ ...fakeFactory(log)(...args), get checkpoint() { return { version: 1, stage: 2 }; }, restoreCheckpoint: cp => restored.push(cp) });
  }, { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v) });
  host.chooseProgram("toast-hop"); host.start({ runId: "one" }); await flush();
  assert.notEqual(host.nextGame().id, "toast-hop"); await flush();
  assert.ok(storage.size > 0);
  host.stop(); finish(fakeFactory(log)); await flush();
  assert.equal(log.filter(x => x === "start").length, 1);
  assert.equal(host.active, false); host.destroy();
});

test("a background task ending and another starting cannot unpause the hidden host", async () => {
  const log = [], host = createPackHost({}, {}, async () => fakeFactory(log));
  host.start({ runId: "first" }); await flush(); host.setPaused(true); host.stop();
  host.start({ runId: "second" }); await flush();
  assert.equal(host.paused, true); assert.equal(host.input("tap"), false); assert.equal(host.nextGame(), null);
  const starts = log.filter(x => x === "start").length;
  host.setPaused(false); assert.equal(host.input("tap"), true);
  assert.equal(log.filter(x => x === "start").length, starts); host.destroy();
});
