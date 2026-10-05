"""FinalButton: local, verifiable consent for agent side effects."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from hashlib import sha256
import hmac
import inspect
import json
from secrets import token_hex
from typing import Any, Callable, Literal, Mapping
from uuid import uuid4

RiskLevel = Literal["low", "medium", "high", "critical"]
PolicyOutcome = Literal["allow", "require_approval", "deny"]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def canonicalize(value: Any) -> str:
    """Return deterministic JSON used to bind a decision to an action."""
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False)


def digest(value: Any) -> str:
    return sha256(canonicalize(value).encode("utf-8")).hexdigest()


def _sign(value: Any, session_secret: str) -> str:
    return hmac.new(session_secret.encode("utf-8"), canonicalize(value).encode("utf-8"), sha256).hexdigest()


def _proof_signature_payload(receipt_id: str, receipt_digest: str) -> dict[str, str]:
    return {"receiptId": receipt_id, "receiptDigest": receipt_digest}


@dataclass(frozen=True)
class ActionDefinition:
    id: str
    category: str
    default_risk: RiskLevel
    reversible: bool
    expires_in_seconds: int
    validate: Callable[[Any], dict[str, Any]]
    card: Callable[[dict[str, Any]], dict[str, str]]
    commit: Callable[[dict[str, Any]], dict[str, Any]] | None = None

    def __post_init__(self) -> None:
        if not self.id or not self.category:
            raise ValueError("An action definition needs an id and category")
        if self.expires_in_seconds <= 0:
            raise ValueError("expires_in_seconds must be positive")


def _decision_payload(decision: Mapping[str, Any]) -> dict[str, Any]:
    return {
        "id": decision["id"],
        "requestId": decision["requestId"],
        "actionDigest": decision["actionDigest"],
        "outcome": decision["outcome"],
        "method": decision["method"],
        **({"reason": decision["reason"]} if decision.get("reason") is not None else {}),
        **({"presentation": decision["presentation"]} if decision.get("presentation") is not None else {}),
        "createdAt": decision["createdAt"],
    }


def create_signed_decision(
    request: Mapping[str, Any],
    input_value: Mapping[str, Any],
    session_secret: str,
    now: datetime | None = None,
) -> dict[str, Any]:
    created = now or _now()
    unsigned: dict[str, Any] = {
        "id": str(uuid4()),
        "requestId": request["id"],
        "actionDigest": request["actionDigest"],
        "outcome": input_value["outcome"],
        "method": input_value["method"],
        "createdAt": _iso(created),
    }
    if input_value.get("reason"):
        unsigned["reason"] = input_value["reason"]
    if input_value.get("presentation") is not None:
        unsigned["presentation"] = input_value["presentation"]
    return {**unsigned, "signature": _sign(_decision_payload(unsigned), session_secret)}


def assert_commit_payload(commit: Mapping[str, Any], payload: Mapping[str, Any]) -> None:
    if not hmac.compare_digest(str(commit.get("payloadDigest", "")), digest(dict(payload))):
        raise ValueError("Provider payload digest does not match the approved commit")


def verify_receipt(receipt: Mapping[str, Any], session_secret: str) -> bool:
    proof = receipt.get("proof")
    if not isinstance(proof, Mapping):
        return False
    receipt_digest = proof.get("digest")
    signature = proof.get("signature")
    if not isinstance(receipt_digest, str) or not isinstance(signature, str):
        return False
    unsigned = {key: value for key, value in receipt.items() if key != "proof"}
    if not hmac.compare_digest(receipt_digest, digest(unsigned)):
        return False
    expected = _sign(_proof_signature_payload(str(receipt.get("id", "")), receipt_digest), session_secret)
    return hmac.compare_digest(signature, expected)


def default_policy(request: Mapping[str, Any]) -> dict[str, Any]:
    action = request["action"]
    if action["risk"] == "critical":
        return {"decision": "require_approval", "reason": "Critical actions always need a human confirmation.", "holdMs": 2500}
    if action["risk"] == "high" or not action["reversible"]:
        return {"decision": "require_approval", "reason": "This action has real-world or irreversible impact.", "holdMs": 2000}
    if action["risk"] == "medium":
        return {"decision": "require_approval", "reason": "This action changes an external system.", "holdMs": 1200}
    return {"decision": "allow", "reason": "This low-risk reversible action is allowed by local policy."}


class FinalButtonGuard:
    def __init__(
        self,
        *,
        session_secret: str,
        now: Callable[[], datetime] = _now,
        policy: Callable[[Mapping[str, Any]], Mapping[str, Any]] = default_policy,
        present: Callable[[Mapping[str, Any]], Mapping[str, Any] | None] | None = None,
    ) -> None:
        if not session_secret:
            raise ValueError("A local session_secret is required")
        self.session_secret = session_secret
        self.now = now
        self.policy = policy
        self.present = present
        self._consumed_requests: set[str] = set()
        self._consumed_decisions: set[str] = set()

    def create_request(
        self,
        definition: ActionDefinition,
        raw_arguments: Any,
        created_at: datetime | None = None,
        origin: Mapping[str, str] | None = None,
    ) -> dict[str, Any]:
        created = created_at or self.now()
        arguments = definition.validate(raw_arguments)
        card = definition.card(arguments)
        commit = self._bind_commit(definition, arguments, card)
        request_id = str(uuid4())
        draft = {
            "protocolVersion": "0.2",
            "id": request_id,
            "createdAt": _iso(created),
            "expiresAt": _iso(created + timedelta(seconds=definition.expires_in_seconds)),
            "origin": dict(origin or {"agentId": "unknown-agent", "runId": str(uuid4())}),
            "action": {
                "id": definition.id,
                "category": definition.category,
                "arguments": arguments,
                "risk": definition.default_risk,
                "reversible": definition.reversible,
                "idempotencyKey": request_id,
            },
            "commit": commit,
            "card": card,
        }
        return {**draft, "actionDigest": digest(draft)}

    def run(
        self,
        definition: ActionDefinition,
        raw_arguments: Any,
        executor: Callable[[], Any] | Mapping[str, Any],
        origin: Mapping[str, str] | None = None,
    ) -> dict[str, Any]:
        request = self.create_request(definition, raw_arguments, origin=origin)
        policy = dict(self.policy(request))
        if policy["decision"] == "deny":
            return self._policy_receipt(request, policy, "blocked")
        if policy["decision"] == "allow":
            decision = create_signed_decision(request, {"outcome": "approve_once", "method": "policy", "reason": policy["reason"]}, self.session_secret, self.now())
            return self.execute(request, decision, executor, policy)
        decision = self.present(request) if self.present else None
        if decision is None:
            return self._policy_receipt(request, policy, "expired")
        return self.execute(request, decision, executor, policy)

    async def arun(
        self,
        definition: ActionDefinition,
        raw_arguments: Any,
        executor: Callable[[], Any] | Mapping[str, Any],
        origin: Mapping[str, str] | None = None,
    ) -> dict[str, Any]:
        request = self.create_request(definition, raw_arguments, origin=origin)
        policy = dict(self.policy(request))
        if policy["decision"] == "deny":
            return self._policy_receipt(request, policy, "blocked")
        if policy["decision"] == "allow":
            decision = create_signed_decision(request, {"outcome": "approve_once", "method": "policy", "reason": policy["reason"]}, self.session_secret, self.now())
        else:
            decision = self.present(request) if self.present else None
            if inspect.isawaitable(decision):
                decision = await decision
            if decision is None:
                return self._policy_receipt(request, policy, "expired")
        return await self.aexecute(request, decision, executor, policy)

    def execute(
        self,
        request: Mapping[str, Any],
        decision: Mapping[str, Any],
        executor: Callable[[], Any] | Mapping[str, Any],
        policy: Mapping[str, Any] | None = None,
    ) -> dict[str, Any]:
        self._verify_request(request)
        if self._is_expired(request):
            return self._receipt(request, decision, "expired", policy)
        self._verify_decision(request, decision)
        if decision["outcome"] == "deny":
            return self._receipt(request, decision, "denied", policy)
        if decision["outcome"] in ("defer", "request_details"):
            return self._receipt(request, decision, "deferred", policy)
        if decision["outcome"] == "expired":
            return self._receipt(request, decision, "expired", policy)
        try:
            preflight_error = self._preflight(request, executor)
        except Exception as error:
            self._consume(request, decision)
            return self._receipt(request, decision, "failed", policy, error=str(error))
        if preflight_error:
            self._consume(request, decision)
            return self._receipt(request, decision, "stale", policy, error=preflight_error)
        self._consume(request, decision)
        try:
            return self._receipt(request, decision, "succeeded", policy, result=self._invoke(request, executor))
        except Exception as error:  # executor failures belong in the receipt
            return self._receipt(request, decision, "failed", policy, error=str(error))

    async def aexecute(
        self,
        request: Mapping[str, Any],
        decision: Mapping[str, Any],
        executor: Callable[[], Any] | Mapping[str, Any],
        policy: Mapping[str, Any] | None = None,
    ) -> dict[str, Any]:
        self._verify_request(request)
        if self._is_expired(request):
            return self._receipt(request, decision, "expired", policy)
        self._verify_decision(request, decision)
        if decision["outcome"] == "deny":
            return self._receipt(request, decision, "denied", policy)
        if decision["outcome"] in ("defer", "request_details"):
            return self._receipt(request, decision, "deferred", policy)
        if decision["outcome"] == "expired":
            return self._receipt(request, decision, "expired", policy)
        try:
            preflight_error = await self._apreflight(request, executor)
        except Exception as error:
            self._consume(request, decision)
            return self._receipt(request, decision, "failed", policy, error=str(error))
        if preflight_error:
            self._consume(request, decision)
            return self._receipt(request, decision, "stale", policy, error=preflight_error)
        self._consume(request, decision)
        try:
            result = self._invoke(request, executor)
            if inspect.isawaitable(result):
                result = await result
            return self._receipt(request, decision, "succeeded", policy, result=result)
        except Exception as error:  # executor failures belong in the receipt
            return self._receipt(request, decision, "failed", policy, error=str(error))

    def _verify_decision(self, request: Mapping[str, Any], decision: Mapping[str, Any]) -> None:
        if decision.get("requestId") != request["id"]:
            raise ValueError("Decision request id does not match")
        if decision.get("actionDigest") != request["actionDigest"]:
            raise ValueError("Decision action digest does not match")
        presentation = decision.get("presentation")
        if presentation is not None:
            if not isinstance(presentation, Mapping):
                raise ValueError("Decision presentation proof is invalid")
            if presentation.get("actionDigest") != request["actionDigest"]:
                raise ValueError("Decision presentation action digest does not match")
            scene = presentation.get("scene")
            if not isinstance(scene, Mapping) or not all(isinstance(scene.get(key), str) and scene[key] for key in ("packId", "packVersion", "variantId")):
                raise ValueError("Decision presentation scene is invalid")
            if not isinstance(presentation.get("id"), str) or not presentation["id"]:
                raise ValueError("Decision presentation id is invalid")
            if not isinstance(presentation.get("digest"), str) or len(presentation["digest"]) != 64:
                raise ValueError("Decision presentation digest is invalid")
        expected = _sign(_decision_payload(decision), self.session_secret)
        if not hmac.compare_digest(str(decision.get("signature", "")), expected):
            raise ValueError("Decision signature is invalid")

    def _verify_request(self, request: Mapping[str, Any]) -> None:
        if request.get("protocolVersion") != "0.2":
            raise ValueError("ActionRequest protocolVersion must be 0.2")
        action_digest = request.get("actionDigest")
        if not isinstance(action_digest, str):
            raise ValueError("ActionRequest actionDigest is missing")
        unsigned = {key: value for key, value in request.items() if key != "actionDigest"}
        if not hmac.compare_digest(action_digest, digest(unsigned)):
            raise ValueError("ActionRequest digest does not match the request payload")

    def _bind_commit(self, definition: ActionDefinition, arguments: dict[str, Any], card: Mapping[str, str]) -> dict[str, Any]:
        source = definition.commit(arguments) if definition.commit else {
            "operation": definition.id,
            "target": card["target"],
            "payload": arguments,
        }
        if not isinstance(source, Mapping) or not str(source.get("operation", "")).strip() or not str(source.get("target", "")).strip():
            raise ValueError("A commit needs a trusted operation and target")
        payload = source.get("payload")
        if not isinstance(payload, Mapping):
            raise ValueError("A commit payload must be an object")
        commit: dict[str, Any] = {
            "operation": str(source["operation"]),
            "target": str(source["target"]),
            "payloadDigest": digest(dict(payload)),
        }
        witness = source.get("stateWitness")
        if witness is not None:
            if not isinstance(witness, Mapping) or not all(str(witness.get(key, "")).strip() for key in ("subject", "version", "observedAt")):
                raise ValueError("A state witness needs a subject, version, and observedAt timestamp")
            try:
                datetime.fromisoformat(str(witness["observedAt"]).replace("Z", "+00:00"))
            except ValueError as error:
                raise ValueError("A state witness needs a subject, version, and observedAt timestamp") from error
            commit["stateWitness"] = dict(witness)
        return commit

    def _preflight(self, request: Mapping[str, Any], executor: Callable[[], Any] | Mapping[str, Any]) -> str | None:
        if not isinstance(executor, Mapping):
            return "A commit with a state witness requires a preflight check." if request["commit"].get("stateWitness") else None
        preflight = executor.get("preflight")
        if not callable(preflight):
            return "A commit with a state witness requires a preflight check." if request["commit"].get("stateWitness") else None
        check = preflight(request["commit"], request)
        if inspect.isawaitable(check):
            raise ValueError("Use arun for an asynchronous commit preflight")
        return self._preflight_result(request, check)

    async def _apreflight(self, request: Mapping[str, Any], executor: Callable[[], Any] | Mapping[str, Any]) -> str | None:
        if not isinstance(executor, Mapping):
            return "A commit with a state witness requires a preflight check." if request["commit"].get("stateWitness") else None
        preflight = executor.get("preflight")
        if not callable(preflight):
            return "A commit with a state witness requires a preflight check." if request["commit"].get("stateWitness") else None
        check = preflight(request["commit"], request)
        if inspect.isawaitable(check):
            check = await check
        return self._preflight_result(request, check)

    def _preflight_result(self, request: Mapping[str, Any], check: Any) -> str | None:
        if not isinstance(check, Mapping) or not check.get("ok"):
            return str(check.get("reason", "The trusted preflight rejected this action.")) if isinstance(check, Mapping) else "The trusted preflight rejected this action."
        expected = request["commit"].get("stateWitness")
        actual = check.get("stateWitness")
        if expected and (not isinstance(actual, Mapping) or actual.get("subject") != expected.get("subject") or actual.get("version") != expected.get("version")):
            return "The state witness changed after approval."
        return None

    def _invoke(self, request: Mapping[str, Any], executor: Callable[[], Any] | Mapping[str, Any]) -> Any:
        if isinstance(executor, Mapping):
            execute = executor.get("execute")
            if not callable(execute):
                raise ValueError("A commit executor needs an execute function")
            return execute(request["commit"], request)
        return executor()

    def _consume(self, request: Mapping[str, Any], decision: Mapping[str, Any]) -> None:
        if request["id"] in self._consumed_requests or decision["id"] in self._consumed_decisions:
            raise ValueError("This approval has already been consumed")
        self._consumed_requests.add(request["id"])
        self._consumed_decisions.add(decision["id"])

    def _is_expired(self, request: Mapping[str, Any]) -> bool:
        expires = datetime.fromisoformat(request["expiresAt"].replace("Z", "+00:00"))
        return self.now() >= expires

    def _policy_receipt(self, request: Mapping[str, Any], policy: Mapping[str, Any], status: str) -> dict[str, Any]:
        outcome = "deny" if status == "blocked" else "expired"
        decision = create_signed_decision(request, {"outcome": outcome, "method": "system", "reason": policy["reason"]}, self.session_secret, self.now())
        return self._receipt(request, decision, status, policy)

    def _receipt(
        self,
        request: Mapping[str, Any],
        decision: Mapping[str, Any],
        status: str,
        policy: Mapping[str, Any] | None,
        result: Any = None,
        error: str | None = None,
    ) -> dict[str, Any]:
        created_at = _iso(self.now())
        receipt: dict[str, Any] = {
            "id": str(uuid4()),
            "request": dict(request),
            "decision": dict(decision),
            "status": status,
            "createdAt": created_at,
        }
        if policy is not None:
            receipt["policy"] = dict(policy)
        if status in ("succeeded", "failed"):
            receipt["completedAt"] = created_at
        if result is not None:
            receipt["result"] = result
        if error is not None:
            receipt["error"] = error
        receipt_digest = digest(receipt)
        receipt["proof"] = {
            "digest": receipt_digest,
            "signature": _sign(_proof_signature_payload(receipt["id"], receipt_digest), self.session_secret),
        }
        return receipt


def guarded_tool(guard: FinalButtonGuard, definition: ActionDefinition, args_from_call: Callable[..., Any]):
    """Wrap a side-effect function so it cannot run before FinalButton approves it."""
    def decorator(function: Callable[..., Any]):
        def wrapped(*args: Any, **kwargs: Any) -> dict[str, Any]:
            return guard.run(definition, args_from_call(*args, **kwargs), lambda: function(*args, **kwargs))
        return wrapped
    return decorator


__all__ = [
    "ActionDefinition",
    "FinalButtonGuard",
    "assert_commit_payload",
    "canonicalize",
    "create_signed_decision",
    "default_policy",
    "digest",
    "guarded_tool",
    "verify_receipt",
]
