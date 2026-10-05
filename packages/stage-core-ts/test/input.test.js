import assert from "node:assert/strict";
import test from "node:test";

import { createInputEvent } from "../src/index.js";

test("future hardware input events stay separate from Agent execution events", () => {
  const input = createInputEvent({ type: "doubleTap", deviceId: "speakon_one", sequence: 3, mode: "idle" });

  assert.equal(input.type, "doubleTap");
  assert.equal(input.mode, "idle");
  assert.equal(Object.hasOwn(input, "actionDigest"), false);
});
