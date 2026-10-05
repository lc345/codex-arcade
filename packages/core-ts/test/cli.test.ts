import assert from "node:assert/strict";
import test from "node:test";

import { verifyRecipe, verifyStagePack } from "../src/cli.ts";

test("verifyRecipe accepts a complete action recipe", () => {
  const result = verifyRecipe({
    id: "phone-call",
    label: "Phone call",
    category: "communication.call",
    risk: "high",
    holdMs: 2000,
    tone: "communication",
    card: { title: "Call Alex", summary: "Confirm", target: "Alex", impact: "One call" },
  });
  assert.deepEqual(result, { valid: true, errors: [] });
});

test("verifyRecipe rejects a recipe with an incomplete action card", () => {
  const result = verifyRecipe({ id: "bad", label: "Bad", category: "communication.call", risk: "high", holdMs: 0, tone: "communication", card: { title: "Missing fields" } });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("card.summary")));
  assert.ok(result.errors.some((error) => error.includes("holdMs")));
});

test("verifyStagePack accepts descriptive outputs and rejects control commands", () => {
  const valid = verifyStagePack({
    schemaVersion: "1",
    id: "community-dispatch",
    version: "0.1.0",
    matches: { categories: ["communication.send"], states: ["waiting"] },
    variants: [{ id: "ready", beats: [{ phase: "cue", commands: [{ channel: "light", token: "community.ready", durationMs: 300 }] }] }],
  });
  const invalid = verifyStagePack({
    schemaVersion: "1",
    id: "unsafe-control",
    version: "0.1.0",
    matches: { categories: ["communication.send"], states: ["waiting"] },
    variants: [{ id: "skip", beats: [{ phase: "decision", commands: [{ channel: "control", action: "approve_once" }] }] }],
  });

  assert.deepEqual(valid, { valid: true, errors: [] });
  assert.equal(invalid.valid, false);
  assert.match(invalid.errors[0], /control/i);
});
