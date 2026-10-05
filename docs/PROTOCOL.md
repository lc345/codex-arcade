# FinalButton Protocol 0.2

## Principle

The model proposes a tool call. Trusted integration code validates the arguments, generates an Action Request, and prepares a commit binding for the provider effect. A separate policy chooses whether a human must approve. The executor verifies a signed decision bound to that exact request, rechecks an optional state witness, and then causes a side effect.

The model must never author the primary human-readable action card, choose its own risk level, or mint a valid decision.

## ActionRequest

`ActionRequest` is immutable once presented. It includes a canonical SHA-256 `actionDigest` over every field except the digest itself. Implementations must recompute the digest before any decision is honored.

```json
{
  "protocolVersion": "0.2",
  "id": "req_...",
  "createdAt": "2026-07-22T09:30:00.000Z",
  "expiresAt": "2026-07-22T09:31:30.000Z",
  "origin": { "agentId": "sales-agent", "runId": "run_...", "model": "optional" },
  "action": {
    "id": "communication.call",
    "category": "communication.call",
    "arguments": { "to": "Alex Chen", "purpose": "Confirm the demo" },
    "risk": "high",
    "reversible": false,
    "idempotencyKey": "req_..."
  },
  "commit": {
    "operation": "telephony.place_call",
    "target": "tel:+14155550199",
    "payloadDigest": "sha256 hex",
    "stateWitness": {
      "subject": "phone-route:sales",
      "version": "route-v12",
      "observedAt": "2026-07-22T09:30:00.000Z"
    }
  },
  "card": {
    "title": "Call Alex Chen",
    "summary": "Confirm the demo",
    "target": "Alex Chen",
    "impact": "One AI-assisted phone call will be placed.",
    "disclosure": "The assistant identifies itself."
  },
  "actionDigest": "sha256 hex"
}
```

## Action Commit

`commit` is developer-owned and is never authored by a model. It records the provider operation, the canonical target, and a SHA-256 hash of the actual provider payload. The payload itself can remain inside the trusted provider adapter; before calling the provider, that adapter calls `assertCommitPayload(commit, payload)`.

`stateWitness` is optional but strongly recommended for writes to mutable resources. It identifies the reviewed resource and version. A bound executor returns its latest witness from `preflight`; any mismatch produces a terminal `stale` receipt and no side effect.

## PolicyDecision

`allow` executes through a locally minted policy decision. `require_approval` sends the request to a presenter. `deny` creates a blocked receipt and never invokes the executor.

The reference default requires approval for medium, high, critical, and irreversible actions. It allows only low-risk reversible actions. A production integration should replace this with its own deterministic policy.

## ActionPresentationRecord

An Agent Stage renderer can create an `ActionPresentationRecord` before a person decides. It contains the action digest, chosen scene pack/version/variant, the immutable device contract, visible screen/speech transcript, render timestamp and a digest. Its schema is [`action-presentation.schema.json`](../spec/schemas/action-presentation.schema.json).

The renderer may pass a compact proof into `ActionDecision.presentation`:

```json
{
  "id": "presentation_...",
  "actionDigest": "sha256 hex",
  "scene": { "packId": "mission-control", "packVersion": "0.1.0", "variantId": "launch-window" },
  "digest": "sha256 hex"
}
```

The proof is optional because a text-only or hardware presenter may not implement Stage. If present, it is part of the signed decision payload and its action digest must equal the decision action digest. It is evidence of what was presented, not a source of authorization.

## ActionDecision

The decision is HMAC-SHA256 over its ID, request ID, action digest, outcome, method, optional reason, optional presentation proof and creation time. Implementations must reject a different request ID, digest mismatch, bad signature, expiry, or any previously consumed approval.

`approve_once` is the only outcome that can reach an executor. Its valid methods are `hold`, `tap`, `deny_button`, `dial`, `policy`, and `system`; `policy` and `system` are reserved for explicit trusted local policies and system expiry/blocking.

## ActionReceipt

The receipt records the complete request, decision, policy result and execution state. It includes an `ActionProof` with a SHA-256 digest of the entire unsigned receipt and a local HMAC signature over that digest. `verifyReceipt(receipt, sessionSecret)` detects changes to any signed receipt field. Store receipts according to the host product's data-retention and privacy requirements; they may contain sensitive action metadata.

## Compatibility

Protocol JSON Schemas are in [`spec/schemas`](../spec/schemas). Version 0.2 is pre-release and supersedes the repository's 0.1 draft. Additive optional fields may be introduced in a compatible minor version. Changing the digest payload, required fields, outcome semantics or decision verification requires a new protocol version.
