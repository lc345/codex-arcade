import assert from "node:assert/strict";
import test from "node:test";

import { FinalButtonGuard, createActionDefinition, validateActionRequest, validateActionDecision } from "../src/index.ts";

const definition = createActionDefinition({
  id: "calendar.create",
  category: "calendar.create",
  defaultRisk: "medium",
  reversible: true,
  expiresInSeconds: 60,
  validate: (value) => ({ title: (value as { title: string }).title }),
  card: (args) => ({ title: args.title, summary: "Create an event", target: "Calendar", impact: "An invite will be sent." }),
});

test("the 0.2 request validator accepts a generated request", () => {
  const request = new FinalButtonGuard({ sessionSecret: "validator-secret" }).createRequest(definition, { title: "Demo" });
  assert.deepEqual(validateActionRequest(request), []);
});

test("the 0.2 request validator reports missing required data and an invalid digest", () => {
  const errors = validateActionRequest({ protocolVersion: "0.1", id: "req_1", actionDigest: "bad" });
  assert.ok(errors.some((error) => error.includes("expiresAt")));
  assert.ok(errors.some((error) => error.includes("actionDigest")));
});

test("the 0.2 decision validator rejects a non-semantic approval method", () => {
  const errors = validateActionDecision({ id: "d", requestId: "r", actionDigest: "a".repeat(64), outcome: "approve_once", method: "click_anywhere", createdAt: "2026-07-22T09:30:00.000Z", signature: "b".repeat(64) });
  assert.ok(errors.some((error) => error.includes("method")));
});
