import assert from "node:assert/strict";
import test from "node:test";

import { createLabState, transition } from "./state.js";

const recipe = {
  id: "phone-call",
  category: "communication.call",
  holdMs: 2000,
  card: { title: "Call Alex", summary: "Confirm a product demo", target: "Alex Chen", impact: "One phone call will be placed." },
};

test("a completed hold creates a successful one-time approval receipt", () => {
  const pending = createLabState(recipe, 1000);
  const holding = transition(pending, { type: "HOLD_START", at: 1000 });
  const complete = transition(holding, { type: "HOLD_COMPLETE", at: 3000 });

  assert.equal(complete.status, "succeeded");
  assert.equal(complete.receipt.decision.outcome, "approve_once");
  assert.equal(complete.receipt.decision.method, "hold");
});

test("a decision keeps the presentation record that was visible before the press", () => {
  const pending = createLabState(recipe, 1000);
  const holding = transition(pending, { type: "HOLD_START", at: 1000 });
  const presentation = {
    id: "presentation_demo",
    actionDigest: "a".repeat(64),
    scene: { packId: "open-line", packVersion: "0.1.0", variantId: "line-ready" },
    digest: "b".repeat(64),
  };
  const complete = transition(holding, { type: "HOLD_COMPLETE", at: 3000, actionDigest: presentation.actionDigest, presentation });

  assert.equal(complete.receipt.decision.presentation.id, "presentation_demo");
  assert.equal(complete.receipt.decision.presentation.scene.variantId, "line-ready");
  assert.equal(complete.receipt.request.actionDigest, presentation.actionDigest);
});

test("releasing before the hold duration returns the action to pending without a receipt", () => {
  const pending = createLabState(recipe, 1000);
  const holding = transition(pending, { type: "HOLD_START", at: 1000 });
  const released = transition(holding, { type: "HOLD_CANCEL", at: 1500 });

  assert.equal(released.status, "pending");
  assert.equal(released.receipt, null);
});

test("a deny decision never turns into a success receipt", () => {
  const pending = createLabState(recipe, 1000);
  const denied = transition(pending, { type: "DENY", at: 1001 });

  assert.equal(denied.status, "denied");
  assert.equal(denied.receipt.decision.outcome, "deny");
});

test("a dial decision records that the denial came from the dial", () => {
  const pending = createLabState(recipe, 1000);
  const denied = transition(pending, { type: "DENY", method: "dial", at: 1001 });

  assert.equal(denied.status, "denied");
  assert.equal(denied.receipt.decision.method, "dial");
});

test("a complete tap sequence creates one approval receipt without a hold", () => {
  const pending = createLabState(recipe, 1000);
  const incomplete = transition(pending, { type: "TAP_SEQUENCE_COMPLETE", count: 2, required: 3, at: 1100 });
  const approved = transition(pending, { type: "TAP_SEQUENCE_COMPLETE", count: 3, required: 3, method: "triple_tap", at: 1200 });

  assert.equal(incomplete.status, "pending");
  assert.equal(approved.status, "succeeded");
  assert.equal(approved.receipt.decision.method, "triple_tap");
});
