# LangGraph adapter pattern

Use FinalButton at the tool boundary, then use LangGraph's `interrupt` only to preserve or resume graph state. The policy and binding must stay outside the model prompt.

```python
from langgraph.types import interrupt
from finalbutton import FinalButtonGuard

def guarded_call(state):
    request = guard.create_request(call_definition, state["call_args"])
    decision = interrupt({"finalbutton_request": request})
    return guard.execute(request, decision, lambda: place_call(**state["call_args"]))
```

The UI/device process must create a signed decision with the same local session secret. Do not allow the model to construct a decision itself.
