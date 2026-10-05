import { assertCommitPayload, createActionDefinition, createSignedDecision, FinalButtonGuard } from "../../packages/core-ts/src/index.ts";

const placeCall = createActionDefinition({
  id: "communication.call",
  category: "communication.call",
  defaultRisk: "high",
  reversible: false,
  expiresInSeconds: 90,
  validate(input: unknown) {
    const value = input as { to?: string; purpose?: string };
    if (!value.to || !value.purpose) throw new Error("to and purpose are required");
    return { to: value.to, purpose: value.purpose };
  },
  card(args) {
    return {
      title: `Call ${args.to}`,
      summary: args.purpose,
      target: args.to,
      impact: "One AI-assisted phone call will be placed.",
      disclosure: "The assistant identifies itself before speaking.",
    };
  },
  commit(args) {
    return {
      operation: "telephony.place_call",
      target: `tel:${args.to}`,
      payload: { to: args.to, purpose: args.purpose, aiDisclosure: true },
    };
  },
});

const guard = new FinalButtonGuard({
  sessionSecret: "replace-with-a-local-secret",
  present: (request) => createSignedDecision(request, { outcome: "approve_once", method: "hold" }, "replace-with-a-local-secret"),
});

const receipt = await guard.run(placeCall, { to: "Alex Chen", purpose: "Confirm the demo time" }, {
  execute: async (commit) => {
    const providerPayload = { to: "Alex Chen", purpose: "Confirm the demo time", aiDisclosure: true };
    assertCommitPayload(commit, providerPayload);
    // Call your telephony provider only after the guard returns an approved decision.
    return { providerCallId: "call_demo_01" };
  },
});

console.log(receipt);
