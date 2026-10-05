import assert from "node:assert/strict";
import test from "node:test";

import { lightProfileFor } from "./light.js";

test("light tokens preserve a recognizable domain grammar", () => {
  assert.equal(lightProfileFor("mission.warning").mode, "warning");
  assert.equal(lightProfileFor("dispatch.arrive").mode, "arrival");
  assert.equal(lightProfileFor("quiet.confirm").mode, "quiet");
  assert.equal(lightProfileFor("prism.transit").mode, "prism");
  assert.equal(lightProfileFor("prism.bloom").mode, "arrival");
  assert.equal(lightProfileFor("voice.bridge").mode, "voice");
  assert.equal(lightProfileFor("time.confirmed").mode, "success");
  assert.equal(lightProfileFor("rail.launch").mode, "rail");
  assert.equal(lightProfileFor("neon.run").mode, "neon");
  assert.equal(lightProfileFor("neon.arrive").mode, "arrival");
});

test("an unknown community light token receives a safe neutral fallback", () => {
  const profile = lightProfileFor("community.some-new-thing");

  assert.equal(profile.mode, "neutral");
  assert.match(profile.accent, /^#/);
});
