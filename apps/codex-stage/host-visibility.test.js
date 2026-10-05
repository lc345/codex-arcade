import test from "node:test";
import assert from "node:assert/strict";
import { bindHostVisibility } from "./host-visibility.js";

test("switching apps suspends and resumes the same game without ending or starting a turn", () => {
  const host = new EventTarget(), pauses = [];
  host.__agentStageHostVisible = false;
  const remove = bindHostVisibility(host, { setPaused: value => pauses.push(value), stop: () => assert.fail("not a task stop"), start: () => assert.fail("not a new turn") });
  for (const visible of [true, false, true]) host.dispatchEvent(new CustomEvent("agent-stage-host-visibility", { detail: { visible } }));
  assert.deepEqual(pauses, [true, false, true, false]);
  host.dispatchEvent(new CustomEvent("agent-stage-host-visibility", { detail: { visible: "true" } }));
  assert.equal(pauses.length, 4);
  remove(); host.dispatchEvent(new CustomEvent("agent-stage-host-visibility", { detail: { visible: false } }));
  assert.equal(pauses.length, 4);
});
