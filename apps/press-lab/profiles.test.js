import assert from "node:assert/strict";
import test from "node:test";

import { getProfilePresentation } from "./profiles.js";

test("Seal One is a single-control profile with tap-to-reveal and hold-to-approve", () => {
  const presentation = getProfilePresentation("seal-one");

  assert.equal(presentation.showStageActions, false);
  assert.equal(presentation.showDial, false);
  assert.equal(presentation.quickPress, "reveal");
  assert.equal(presentation.holdEvent.type, "HOLD_COMPLETE");
});

test("Seal Duo exposes its separate later and deny controls", () => {
  const presentation = getProfilePresentation("seal-duo");

  assert.equal(presentation.showStageActions, true);
  assert.equal(presentation.showDial, false);
  assert.equal(presentation.quickPress, "cancel");
  assert.equal(presentation.holdEvent.type, "HOLD_COMPLETE");
});

test("Seal Dial commits the currently selected decision only after a hold", () => {
  const deferred = getProfilePresentation("seal-dial", "defer");
  const denied = getProfilePresentation("seal-dial", "deny");

  assert.equal(deferred.showStageActions, false);
  assert.equal(deferred.showDial, true);
  assert.deepEqual(deferred.holdEvent, { type: "DEFER", method: "dial" });
  assert.deepEqual(denied.holdEvent, { type: "DENY", method: "dial" });
});

test("Pulse uses tap as a non-committing replay and double tap as an explicit denial", () => {
  const presentation = getProfilePresentation("pulse");

  assert.equal(presentation.showStageActions, false);
  assert.equal(presentation.quickPress, "replay");
  assert.equal(presentation.doublePress, "deny");
  assert.equal(presentation.holdEvent.type, "HOLD_COMPLETE");
});

test("Triple tap is a separate physical approval sequence", () => {
  const presentation = getProfilePresentation("tap-three");

  assert.equal(presentation.tapSequence, 3);
  assert.equal(presentation.quickPress, "tap_sequence");
  assert.equal(presentation.showStageActions, false);
});
