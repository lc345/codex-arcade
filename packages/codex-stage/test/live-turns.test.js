import test from "node:test";
import assert from "node:assert/strict";
import { createLiveTurns } from "../../../apps/codex-stage/live-turns.js";

test("live window synchronizes late connection and overlapping turns without false stop", () => {
  const calls = [];
  const turns = createLiveTurns({ start: e => calls.push(e.runId), stop: () => calls.push("stop") });
  const a = { type: "turn.started", runId: "a" }, b = { type: "turn.started", runId: "b" };
  turns.snapshot([a]); turns.event(a); turns.event(b);
  turns.event({ type: "turn.completed", runId: "a" });
  assert.deepEqual(calls, ["a", "b"]);
  turns.event({ type: "turn.completed", runId: "b" });
  turns.snapshot([]);
  assert.deepEqual(calls, ["a", "b", "stop", "stop"]);
  turns.event(a); turns.disconnect(); turns.snapshot([a]);
  assert.deepEqual(calls.slice(-3), ["a", "stop", "a"]);
});
