import test from "node:test";
import assert from "node:assert/strict";
import { createPreparedStudioRuntime } from "./studio/prepared-runtime.js";
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const flush = async () => { await new Promise(resolve => setImmediate(resolve)); };
function fixture(gate) {
  const events = [], made = [], program = { id: "qa", title: "QA", levels: ["one"], hint: "hint" };
  const studio = { prepare: () => gate.promise };
  const runtime = createPreparedStudioRuntime({}, program, studio, { onState: e => events.push(e.type), onFeedback: e => events.push(e.text) }, (_c, _p, _w, _paint, callbacks) => {
    const value = { started: 0, stopped: 0, destroyed: 0, level: -1, muted: null, reduced: null, paused: null,
      start() { this.started++; callbacks.onState?.({ type: "started" }); }, stop() { this.stopped++; }, destroy() { this.destroyed++; },
      setLevel(n) { this.level = n; return true; }, setMuted(v) { this.muted = v; }, setReduced(v) { this.reduced = v; }, setPaused(v) { this.paused = v; },
      restoreCheckpoint(v) { this.checkpoint = v; }, input() { return true; }, retry() { return true; }, snapshot: { score: 7 }, controls: {},
    }; made.push(value); return value;
  });
  return { runtime, events, made };
}
test("prepared games cannot construct or emit a late start after stop or destroy", async () => {
  for (const operation of ["stop", "destroy"]) {
    const gate = deferred(), { runtime, events, made } = fixture(gate);
    runtime.start(); assert.equal(runtime.snapshot.phase, "loading"); runtime[operation](); const before = events.slice();
    gate.resolve(); await flush(); assert.equal(made.length, 0); assert.deepEqual(events, before); assert.equal(runtime.active, false);
  }
});
test("prepared games apply settings and checkpoint before starting exactly once", async () => {
  const gate = deferred(), { runtime, made } = fixture(gate);
  runtime.setMuted(false); runtime.setReduced(true); runtime.setPaused(true); runtime.setLevel(0); runtime.restoreCheckpoint({ sector: 1 }); runtime.start(); runtime.start();
  gate.resolve(); await flush(); assert.equal(made.length, 1); assert.equal(made[0].started, 1); assert.equal(made[0].muted, false); assert.equal(made[0].reduced, true); assert.equal(made[0].paused, true); assert.deepEqual(made[0].checkpoint, { sector: 1 });
  runtime.stop(); assert.equal(runtime.input("tap"), false); runtime.destroy(); assert.equal(made[0].destroyed, 1);
});
test("preparation failure is visible and retryable without reviving an ended task", async () => {
  const gate = deferred(), { runtime, events } = fixture(gate); runtime.start(); gate.reject(new Error("WASM blocked")); await flush();
  assert.equal(runtime.snapshot.phase, "error"); assert.ok(events.some(e => e.includes("加载失败"))); assert.equal(runtime.input("tap"), false); runtime.stop(); assert.equal(runtime.retry(), false); runtime.destroy();
});
