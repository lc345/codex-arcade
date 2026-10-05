import test from "node:test";
import assert from "node:assert/strict";
import { createGodotSession } from "./session.js";

function fixture(boot) { const calls = [], view = { command: (type, value) => calls.push([type, value]), dispose: () => calls.push(["dispose"]) }; return { calls, view, session: createGodotSession({ boot: boot ?? (async () => view) }) }; }
test("Godot session: stop during loading cannot resurrect a completed task", async () => {
  let resolve; const f = fixture(() => new Promise(r => { resolve = r; }));
  const pending = f.session.start(); f.session.stop(); resolve(f.view); await pending;
  assert.deepEqual(f.calls, [["dispose"]]); assert.equal(f.session.state, "stopped");
});
test("Godot session: settings precede start, stop is synchronous and rejects input", async () => {
  const f = fixture(); f.session.setMuted(false); f.session.setReduced(true); await f.session.start();
  assert.deepEqual(f.calls.slice(0, 3), [["settings", {muted:false,reduced:true}], ["restore",null], ["start",undefined]]);
  f.session.input("down"); f.session.stop(); const n = f.calls.length;
  assert.equal(f.session.input("up"), false); assert.equal(f.calls.length, n);
  assert.equal(f.calls.at(-1)[0], "stop"); f.session.destroy();
});
test("Godot session: pause clears the gesture and settings still work", async () => {
  const f=fixture(); await f.session.start(); f.session.setPaused(true);
  assert.equal(f.session.input("down"),false); f.session.setMuted(true);
  assert.equal(f.calls.at(-1)[0],"settings"); f.session.setPaused(false);
  assert.equal(f.session.input("down"),true); assert.equal(f.session.input("approve-agent"),false);
  f.session.destroy();
});
