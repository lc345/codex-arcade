# Security Model and Limits

## What FinalButton enforces

- A valid `approve_once` decision must point at exactly one request and one action digest.
- The action digest is recomputed before execution, so a changed card, argument, commit, target, or state witness is rejected.
- A commit binds a trusted provider operation and provider-payload digest to the reviewed request.
- A commit with a state witness must pass a fresh preflight check. A changed version produces `stale` and does not invoke the side effect.
- A decision must be signed by the locally configured session secret.
- A request must not be expired.
- An approved request and decision can be consumed once only.
- The side-effect executor is never called after deny, defer, expiry, a digest mismatch, or a bad signature.
- Every receipt has a digest and local HMAC signature; a host can detect a changed receipt with `verifyReceipt`.
- When a decision includes a presentation proof, its scene ID, version, variant and digest are signed with the decision and bound to the same action digest.
- A Stage Pack can emit only descriptive light, audio, speech and screen commands. It cannot mint a decision, define an approval control, lower risk, alter an action card, change expiry or widen approval scope.

## What it does not enforce

- Human identity, intent, or legal consent.
- Authentication or authorization to Gmail, Slack, telephony, cloud, payment, filesystem or APIs.
- Isolation from a compromised local process with access to the session secret.
- Durable replay prevention across process restarts or multiple Guard instances; the reference replay sets are in-memory.
- Safe interpretation of untrusted MCP annotations or model-produced UI copy.
- Provider-specific rate limits, compliance duties, retention requirements, or call-recording regulations.
- The truthfulness, accessibility or cultural appropriateness of a third-party Stage Pack. Treat community packs as presentation code/data and review them before enabling them in a sensitive environment.

## Deployment guidance

Keep the session secret in the local trusted bridge, not in model context. Derive Action Cards and Action Commits from developer-owned validators. Make the provider adapter rebuild and compare the provider payload with `assertCommitPayload`, enforce provider-side authorization and idempotency, and supply a State Witness for mutable high-impact targets. Use a durable idempotency and receipt store before deploying across restarts or multiple processes. For stronger assurance, place the signer in a hardware-backed device and require an attestation policy outside protocol 0.2.

The default HMAC proof is **local integrity**, not public proof of a named human. A future asymmetric-signature or hardware-attestation profile can make ActionProofs independently verifiable without sharing a session secret.
