# ActionProof

An ActionProof is the durable answer to one question: **what exact external effect did a person allow, against what state, and what happened next?**

It is not another approval inbox. Most agent frameworks already pause a run. FinalButton adds a compact, model-neutral proof chain that can travel across a browser simulator, a physical device, an MCP proxy, or a provider adapter.

## The proof chain

1. **Action Request**: trusted integration code validates arguments and derives the human card.
2. **Action Commit**: integration code records the provider operation, target, and a SHA-256 digest of the actual provider payload. It can include a State Witness such as an ETag, record version, deployment revision, or calendar event sequence.
3. **Action Presentation**: when Agent Stage is used, its selected scene, visible transcript and locked device contract form a digest-bound presentation record.
4. **Action Decision**: a deliberate device gesture is HMAC-bound to the exact request digest and, when available, the compact presentation proof.
5. **Action Receipt**: the outcome is itself digested and locally signed. `verifyReceipt(receipt, sessionSecret)` detects a changed request, decision, result, error, or status.

The protocol deliberately distinguishes these objects. An attractive approval card is not evidence that the actual provider request stayed the same after review.

## A stage is evidence, not permission

Agent Stage lets the same request be told as a quiet night signal, a paper courier, a launch console or a city dispatch. The scene can vary with trusted facts such as status, time of day and privacy mode, but it may output only light, audio, screen and speech commands. It cannot change risk, target, expiry, hold duration or the available decision outcomes.

When a presenter includes `ActionDecision.presentation`, a later audit can answer a useful additional question: *which version of which scene was on stage when the person acted?* Read [Agent Stage Packs](STAGE_PACKS.md) for the pack contract.

## State Witnesses

Long-running agents create a time-of-check/time-of-use problem: the user may review a deploy at revision 42, while the deployment target changes to revision 43 before the press arrives.

An Action Commit can contain:

```json
{
  "operation": "deployment.release",
  "target": "service:api",
  "payloadDigest": "sha256 hex",
  "stateWitness": {
    "subject": "service:api",
    "version": "42",
    "observedAt": "2026-07-22T09:30:00.000Z"
  }
}
```

Before the external call, a bound executor runs `preflight`. If its current witness differs, FinalButton consumes that one-time approval and emits a `stale` receipt. A new state needs a new human decision.

## Provider adapter contract

The provider adapter owns credentials and is the final security boundary. It should build the provider payload from trusted code, call `assertCommitPayload(commit, payload)`, optionally return a fresh witness from `preflight`, then invoke the provider only from `execute`.

```ts
await guard.run(deploy, args, {
  preflight: async (commit) => ({ ok: true, stateWitness: await cloud.currentVersion(commit.target) }),
  execute: async (commit) => {
    const payload = trustedDeployPayload(args);
    assertCommitPayload(commit, payload);
    return cloud.release(payload);
  },
});
```

The SDK cannot turn a compromised process into a trusted provider. It makes the expected boundary explicit, verifies it before calling the executor, and gives adapters a uniform way to fail closed.

## Ecosystem surface

The small unit worth sharing is an **Action Recipe + ActionProof adapter**:

- A recipe makes a consequential action legible on a light, speaker, button, or screen.
- An adapter binds the real provider payload and state witness.
- A device profile maps semantic decisions to a physical interaction.
- The resulting receipt is a testable artifact for CI, incident review, or a developer demo.

This gives contributors clear things to build: a GitHub deploy adapter, Home Assistant state witness, Slack recipe, a Stream Deck renderer, a Speakon bridge, or a test fixture that proves a dangerous action fails closed.
