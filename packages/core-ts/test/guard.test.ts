import assert from "node:assert/strict";
import test from "node:test";

import {
  FinalButtonGuard,
  assertCommitPayload,
  canonicalize,
  createActionDefinition,
  createSignedDecision,
  verifyReceipt,
  validateActionReceipt,
  type ActionRequest,
} from "../src/index.ts";

const phoneCall = createActionDefinition({
  id: "communication.call",
  category: "communication.call",
  defaultRisk: "high",
  reversible: false,
  expiresInSeconds: 60,
  validate(input: unknown) {
    const value = input as { to?: string; purpose?: string };
    if (!value.to || !value.purpose) throw new Error("to and purpose are required");
    return { to: value.to, purpose: value.purpose };
  },
  card(args) {
    return {
      title: `Call ${args.to}`,
      summary: `Ask: ${args.purpose}`,
      target: args.to,
      impact: "An AI assistant will place one phone call.",
      disclosure: "The assistant will identify itself as an AI calling for Youze.",
    };
  },
});

function fixedClock() {
  return new Date("2026-07-22T09:30:00.000Z");
}

function makeGuard(present: (request: ActionRequest) => unknown) {
  return new FinalButtonGuard({
    sessionSecret: "local-test-secret",
    now: fixedClock,
    present,
  });
}

test("canonicalize produces the same digest input for differently ordered JSON objects", () => {
  assert.equal(
    canonicalize({ b: 2, a: { y: true, x: "ok" } }),
    canonicalize({ a: { x: "ok", y: true }, b: 2 }),
  );
});

test("a high-risk phone call does not execute until a matching signed approval arrives", async () => {
  let calls = 0;
  const guard = makeGuard((request) =>
    createSignedDecision(request, { outcome: "approve_once", method: "hold" }, "local-test-secret"),
  );

  const receipt = await guard.run(
    phoneCall,
    { to: "+1 415 555 0199", purpose: "confirm a product demo" },
    async () => {
      calls += 1;
      return { callId: "call_demo_01" };
    },
  );

  assert.equal(calls, 1);
  assert.equal(receipt.status, "succeeded");
  assert.equal(receipt.decision.outcome, "approve_once");
  assert.equal(receipt.request.card.title, "Call +1 415 555 0199");
});

test("a denied request never invokes the side-effect executor", async () => {
  let calls = 0;
  const guard = makeGuard((request) =>
    createSignedDecision(request, { outcome: "deny", method: "deny_button", reason: "Not now" }, "local-test-secret"),
  );

  const receipt = await guard.run(phoneCall, { to: "Alex", purpose: "reschedule" }, async () => {
    calls += 1;
    return "unreachable";
  });

  assert.equal(calls, 0);
  assert.equal(receipt.status, "denied");
});

test("a decision with a changed action digest is rejected before execution", async () => {
  let calls = 0;
  const guard = makeGuard((request) => {
    const decision = createSignedDecision(request, { outcome: "approve_once", method: "hold" }, "local-test-secret");
    return { ...decision, actionDigest: "tampered" };
  });

  await assert.rejects(
    guard.run(phoneCall, { to: "Alex", purpose: "reschedule" }, async () => {
      calls += 1;
      return "unreachable";
    }),
    /digest/i,
  );
  assert.equal(calls, 0);
});

test("a malformed decision is rejected before the executor can run", async () => {
  let calls = 0;
  const guard = makeGuard((request) => ({
    ...createSignedDecision(request, { outcome: "approve_once", method: "hold" }, "local-test-secret"),
    method: "click_anywhere",
  }));

  await assert.rejects(
    guard.run(phoneCall, { to: "Alex", purpose: "reschedule" }, async () => {
      calls += 1;
      return "unreachable";
    }),
    /Invalid ActionDecision/,
  );
  assert.equal(calls, 0);
});

test("a signed decision can only be consumed once", async () => {
  const guard = makeGuard(() => undefined);
  const request = guard.createRequest(phoneCall, { to: "Alex", purpose: "reschedule" });
  const decision = createSignedDecision(request, { outcome: "approve_once", method: "hold" }, "local-test-secret");

  const first = await guard.execute(request, decision, async () => "placed");
  assert.equal(first.status, "succeeded");
  await assert.rejects(guard.execute(request, decision, async () => "should not run"), /consumed/i);
});

test("an expired approval never executes an action", async () => {
  let calls = 0;
  const guard = new FinalButtonGuard({
    sessionSecret: "local-test-secret",
    now: () => new Date("2026-07-22T09:32:00.000Z"),
    present: () => undefined,
  });
  const request = guard.createRequest(phoneCall, { to: "Alex", purpose: "reschedule" }, fixedClock());
  const decision = createSignedDecision(request, { outcome: "approve_once", method: "hold" }, "local-test-secret", fixedClock());

  const receipt = await guard.execute(request, decision, async () => {
    calls += 1;
    return "should not run";
  });

  assert.equal(calls, 0);
  assert.equal(receipt.status, "expired");
});

test("an approval is expired at its exact expiry timestamp", async () => {
  let calls = 0;
  const guard = new FinalButtonGuard({
    sessionSecret: "local-test-secret",
    now: () => new Date("2026-07-22T09:31:00.000Z"),
  });
  const request = guard.createRequest(phoneCall, { to: "Alex", purpose: "reschedule" }, fixedClock());
  const decision = createSignedDecision(request, { outcome: "approve_once", method: "hold" }, "local-test-secret", fixedClock());

  const receipt = await guard.execute(request, decision, async () => { calls += 1; });

  assert.equal(calls, 0);
  assert.equal(receipt.status, "expired");
});

test("a request whose trusted card changes after its digest was minted is rejected before execution", async () => {
  let calls = 0;
  const guard = makeGuard(() => undefined);
  const request = guard.createRequest(phoneCall, { to: "Alex", purpose: "reschedule" });
  const tampered = { ...request, card: { ...request.card, impact: "Delete every contact instead." } };
  const decision = createSignedDecision(tampered, { outcome: "approve_once", method: "hold" }, "local-test-secret");

  await assert.rejects(
    guard.execute(tampered, decision, async () => {
      calls += 1;
      return "should not run";
    }),
    /digest/i,
  );
  assert.equal(calls, 0);
});

test("a stale state witness consumes the approval without executing the effect", async () => {
  let calls = 0;
  const deploy = createActionDefinition({
    id: "system.deploy",
    category: "system.deploy",
    defaultRisk: "critical",
    reversible: false,
    expiresInSeconds: 60,
    validate: (input) => input as { service: string; release: string; version: string },
    card: (args) => ({ title: `Deploy ${args.release}`, summary: "Release to production", target: args.service, impact: "Production traffic will change." }),
    commit: (args) => ({
      operation: "deployment.release",
      target: `service:${args.service}`,
      payload: { service: args.service, release: args.release },
      stateWitness: { subject: `service:${args.service}`, version: args.version, observedAt: "2026-07-22T09:30:00.000Z" },
    }),
  });
  const guard = makeGuard((request) =>
    createSignedDecision(request, { outcome: "approve_once", method: "hold" }, "local-test-secret"),
  );

  const receipt = await guard.run(deploy, { service: "api", release: "2026.07.22", version: "42" }, {
    preflight: async () => ({ ok: true, stateWitness: { subject: "service:api", version: "43", observedAt: "2026-07-22T09:30:30.000Z" } }),
    execute: async () => {
      calls += 1;
      return "should not run";
    },
  });

  assert.equal(receipt.status, "stale");
  assert.equal(calls, 0);
  assert.match(receipt.error ?? "", /state witness/i);
});

test("a failed preflight consumes the approval and never executes the effect", async () => {
  let calls = 0;
  const guarded = createActionDefinition({
    id: "calendar.update",
    category: "calendar.update",
    defaultRisk: "high",
    reversible: true,
    expiresInSeconds: 60,
    validate: (input) => input as { id: string; version: string },
    card: (args) => ({ title: "Update calendar event", summary: "Change one event", target: args.id, impact: "Invitees may be notified." }),
    commit: (args) => ({
      operation: "calendar.events.update",
      target: `event:${args.id}`,
      payload: { id: args.id },
      stateWitness: { subject: `event:${args.id}`, version: args.version, observedAt: "2026-07-22T09:30:00.000Z" },
    }),
  });
  const guard = makeGuard((request) =>
    createSignedDecision(request, { outcome: "approve_once", method: "hold" }, "local-test-secret"),
  );

  const receipt = await guard.run(guarded, { id: "evt_1", version: "3" }, {
    preflight: async () => { throw new Error("calendar service unavailable"); },
    execute: async () => { calls += 1; },
  });

  assert.equal(receipt.status, "failed");
  assert.equal(calls, 0);
  assert.match(receipt.error ?? "", /calendar service unavailable/);
});

test("an ActionProof receipt is verifiable and detects a changed outcome", async () => {
  const guard = makeGuard((request) =>
    createSignedDecision(request, { outcome: "approve_once", method: "hold" }, "local-test-secret"),
  );
  const receipt = await guard.run(phoneCall, { to: "Alex", purpose: "confirm a demo" }, async () => "placed");

  assert.equal(verifyReceipt(receipt, "local-test-secret"), true);
  assert.deepEqual(validateActionReceipt(receipt), []);
  assert.equal(verifyReceipt({ ...receipt, status: "failed" }, "local-test-secret"), false);
});

test("a provider adapter cannot reuse a commit for a changed payload", () => {
  const guard = makeGuard(() => undefined);
  const request = guard.createRequest(phoneCall, { to: "Alex", purpose: "confirm a demo" });

  assert.doesNotThrow(() => assertCommitPayload(request.commit, { to: "Alex", purpose: "confirm a demo" }));
  assert.throws(() => assertCommitPayload(request.commit, { to: "Blair", purpose: "confirm a demo" }), /payload digest/i);
});

test("a decision binds the presentation proof shown to the person", async () => {
  const guard = makeGuard(() => undefined);
  const request = guard.createRequest(phoneCall, { to: "Alex", purpose: "confirm a demo" });
  const presentation = {
    id: "presentation_01",
    actionDigest: request.actionDigest,
    scene: { packId: "city-dispatch", packVersion: "0.1.0", variantId: "message-departed" },
    digest: "a".repeat(64),
  };
  const decision = createSignedDecision(
    request,
    { outcome: "approve_once", method: "hold", presentation },
    "local-test-secret",
  );
  const tampered = {
    ...decision,
    presentation: { ...presentation, scene: { ...presentation.scene, variantId: "quiet-night" } },
  };

  await assert.rejects(guard.execute(request, tampered, async () => "should not run"), /signature/i);
});
