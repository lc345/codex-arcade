import unittest
from datetime import datetime, timezone

from finalbutton import ActionDefinition, FinalButtonGuard, assert_commit_payload, create_signed_decision, verify_receipt


NOW = datetime(2026, 7, 22, 9, 30, tzinfo=timezone.utc)


def phone_call() -> ActionDefinition:
    def validate(value):
        if not isinstance(value, dict) or not value.get("to") or not value.get("purpose"):
            raise ValueError("to and purpose are required")
        return {"to": value["to"], "purpose": value["purpose"]}

    def card(args):
        return {
            "title": f"Call {args['to']}",
            "summary": f"Ask: {args['purpose']}",
            "target": args["to"],
            "impact": "An AI assistant will place one phone call.",
        }

    return ActionDefinition(
        id="communication.call",
        category="communication.call",
        default_risk="high",
        reversible=False,
        expires_in_seconds=60,
        validate=validate,
        card=card,
    )


class GuardTests(unittest.TestCase):
    def test_approved_action_executes_once_and_keeps_a_receipt(self):
        calls = []

        def present(request):
            return create_signed_decision(request, {"outcome": "approve_once", "method": "hold"}, "test-secret", NOW)

        guard = FinalButtonGuard(session_secret="test-secret", now=lambda: NOW, present=present)
        receipt = guard.run(phone_call(), {"to": "Alex", "purpose": "confirm a demo"}, lambda: calls.append("called") or {"call_id": "demo_1"})

        self.assertEqual(calls, ["called"])
        self.assertEqual(receipt["status"], "succeeded")
        self.assertEqual(receipt["request"]["card"]["title"], "Call Alex")

    def test_tampered_approval_is_rejected_before_execution(self):
        calls = []

        def present(request):
            decision = create_signed_decision(request, {"outcome": "approve_once", "method": "hold"}, "test-secret", NOW)
            decision["actionDigest"] = "tampered"
            return decision

        guard = FinalButtonGuard(session_secret="test-secret", now=lambda: NOW, present=present)
        with self.assertRaisesRegex(ValueError, "digest"):
            guard.run(phone_call(), {"to": "Alex", "purpose": "confirm a demo"}, lambda: calls.append("called"))
        self.assertEqual(calls, [])

    def test_tampered_presentation_proof_is_rejected_before_execution(self):
        calls = []

        def present(request):
            decision = create_signed_decision(
                request,
                {
                    "outcome": "approve_once",
                    "method": "hold",
                    "presentation": {
                        "id": "presentation_demo",
                        "actionDigest": request["actionDigest"],
                        "scene": {"packId": "city-dispatch", "packVersion": "0.1.0", "variantId": "dispatch-complete"},
                        "digest": "a" * 64,
                    },
                },
                "test-secret",
                NOW,
            )
            decision["presentation"]["scene"]["variantId"] = "looks-safe-but-isnt"
            return decision

        guard = FinalButtonGuard(session_secret="test-secret", now=lambda: NOW, present=present)
        with self.assertRaisesRegex(ValueError, "signature"):
            guard.run(phone_call(), {"to": "Alex", "purpose": "confirm a demo"}, lambda: calls.append("called"))
        self.assertEqual(calls, [])

    def test_denied_action_is_never_executed(self):
        calls = []

        def present(request):
            return create_signed_decision(request, {"outcome": "deny", "method": "deny_button"}, "test-secret", NOW)

        guard = FinalButtonGuard(session_secret="test-secret", now=lambda: NOW, present=present)
        receipt = guard.run(phone_call(), {"to": "Alex", "purpose": "confirm a demo"}, lambda: calls.append("called"))

        self.assertEqual(calls, [])
        self.assertEqual(receipt["status"], "denied")

    def test_tampered_card_is_rejected_before_execution(self):
        calls = []
        guard = FinalButtonGuard(session_secret="test-secret", now=lambda: NOW)
        request = guard.create_request(phone_call(), {"to": "Alex", "purpose": "confirm a demo"})
        request["card"]["impact"] = "Delete every contact instead."
        decision = create_signed_decision(request, {"outcome": "approve_once", "method": "hold"}, "test-secret", NOW)

        with self.assertRaisesRegex(ValueError, "digest"):
            guard.execute(request, decision, lambda: calls.append("called"))
        self.assertEqual(calls, [])

    def test_receipt_proof_detects_a_changed_outcome(self):
        def present(request):
            return create_signed_decision(request, {"outcome": "approve_once", "method": "hold"}, "test-secret", NOW)

        guard = FinalButtonGuard(session_secret="test-secret", now=lambda: NOW, present=present)
        receipt = guard.run(phone_call(), {"to": "Alex", "purpose": "confirm a demo"}, lambda: {"call_id": "demo_1"})

        self.assertTrue(verify_receipt(receipt, "test-secret"))
        changed = {**receipt, "status": "failed"}
        self.assertFalse(verify_receipt(changed, "test-secret"))

    def test_state_witness_blocks_a_changed_resource_before_execution(self):
        calls = []

        deploy = ActionDefinition(
            id="system.deploy",
            category="system.deploy",
            default_risk="critical",
            reversible=False,
            expires_in_seconds=60,
            validate=lambda value: value,
            card=lambda args: {"title": "Deploy", "summary": "Release", "target": args["service"], "impact": "Production traffic changes."},
            commit=lambda args: {
                "operation": "deployment.release",
                "target": f"service:{args['service']}",
                "payload": {"release": args["release"]},
                "stateWitness": {"subject": f"service:{args['service']}", "version": args["version"], "observedAt": "2026-07-22T09:30:00.000Z"},
            },
        )

        def present(request):
            return create_signed_decision(request, {"outcome": "approve_once", "method": "hold"}, "test-secret", NOW)

        guard = FinalButtonGuard(session_secret="test-secret", now=lambda: NOW, present=present)
        receipt = guard.run(
            deploy,
            {"service": "api", "release": "2026.07.22", "version": "42"},
            {
                "preflight": lambda *_: {"ok": True, "stateWitness": {"subject": "service:api", "version": "43", "observedAt": "2026-07-22T09:30:30.000Z"}},
                "execute": lambda *_: calls.append("released"),
            },
        )

        self.assertEqual(receipt["status"], "stale")
        self.assertEqual(calls, [])

    def test_provider_adapter_rejects_a_changed_payload(self):
        guard = FinalButtonGuard(session_secret="test-secret", now=lambda: NOW)
        request = guard.create_request(phone_call(), {"to": "Alex", "purpose": "confirm a demo"})

        assert_commit_payload(request["commit"], {"to": "Alex", "purpose": "confirm a demo"})
        with self.assertRaisesRegex(ValueError, "payload digest"):
            assert_commit_payload(request["commit"], {"to": "Blair", "purpose": "confirm a demo"})

    def test_failed_preflight_consumes_approval_without_execution(self):
        calls = []
        guarded = ActionDefinition(
            id="calendar.update",
            category="calendar.update",
            default_risk="high",
            reversible=True,
            expires_in_seconds=60,
            validate=lambda value: value,
            card=lambda args: {"title": "Update event", "summary": "Change one event", "target": args["id"], "impact": "Invitees may be notified."},
            commit=lambda args: {
                "operation": "calendar.events.update",
                "target": f"event:{args['id']}",
                "payload": {"id": args["id"]},
                "stateWitness": {"subject": f"event:{args['id']}", "version": args["version"], "observedAt": "2026-07-22T09:30:00.000Z"},
            },
        )

        def present(request):
            return create_signed_decision(request, {"outcome": "approve_once", "method": "hold"}, "test-secret", NOW)

        def preflight(*_):
            raise RuntimeError("calendar service unavailable")

        guard = FinalButtonGuard(session_secret="test-secret", now=lambda: NOW, present=present)
        receipt = guard.run(guarded, {"id": "evt_1", "version": "3"}, {"preflight": preflight, "execute": lambda *_: calls.append("updated")})

        self.assertEqual(receipt["status"], "failed")
        self.assertEqual(calls, [])
        self.assertIn("calendar service unavailable", receipt["error"])


if __name__ == "__main__":
    unittest.main()
