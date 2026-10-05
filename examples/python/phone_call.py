from finalbutton import ActionDefinition, FinalButtonGuard, assert_commit_payload, create_signed_decision


def validate(value):
    if not isinstance(value, dict) or not value.get("to") or not value.get("purpose"):
        raise ValueError("to and purpose are required")
    return {"to": value["to"], "purpose": value["purpose"]}


call = ActionDefinition(
    id="communication.call",
    category="communication.call",
    default_risk="high",
    reversible=False,
    expires_in_seconds=90,
    validate=validate,
    card=lambda args: {
        "title": f"Call {args['to']}",
        "summary": args["purpose"],
        "target": args["to"],
        "impact": "One AI-assisted phone call will be placed.",
    },
    commit=lambda args: {
        "operation": "telephony.place_call",
        "target": f"tel:{args['to']}",
        "payload": {"to": args["to"], "purpose": args["purpose"], "aiDisclosure": True},
    },
)


def present(request):
    # Replace with a local browser, M5Stack, Stream Deck, or Speakon bridge.
    return create_signed_decision(request, {"outcome": "approve_once", "method": "hold"}, "local-secret")


guard = FinalButtonGuard(session_secret="local-secret", present=present)


def place_call(commit, _request):
    provider_payload = {"to": "Alex Chen", "purpose": "Confirm the demo time", "aiDisclosure": True}
    assert_commit_payload(commit, provider_payload)
    return {"provider_call_id": "call_demo_01"}


receipt = guard.run(call, {"to": "Alex Chen", "purpose": "Confirm the demo time"}, {"execute": place_call})
print(receipt)
