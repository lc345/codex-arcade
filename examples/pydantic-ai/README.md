# Pydantic AI adapter pattern

Mark the side-effecting Pydantic AI tool as requiring approval, then resolve the deferred request through FinalButton instead of turning a browser click directly into a tool result.

```python
@agent.tool_plain(requires_approval=True)
def call_customer(to: str, purpose: str) -> str:
    return place_call(to, purpose)

# In the deferred-tool resolver:
receipt = guard.run(call_definition, {"to": to, "purpose": purpose}, lambda: place_call(to, purpose))
```

FinalButton protects model autonomy, not endpoint authorization. Keep provider authentication and authorization inside `place_call`.
