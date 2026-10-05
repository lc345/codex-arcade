// A window may connect after a turn starts, and several Codex chats may overlap.
export function createLiveTurns({ start, stop }) {
  const active = new Map();
  let showing = null;
  function sync() {
    const latest = [...active.values()].at(-1);
    if (!latest) { showing = null; stop(); }
    else if (showing !== latest.runId) { showing = latest.runId; start(latest); }
  }
  return {
    snapshot(events) { active.clear(); for (const event of events) if (event.type === "turn.started") active.set(event.runId, event); sync(); },
    event(event) {
      if (event.type === "turn.started") active.set(event.runId, event);
      else if (event.type === "turn.completed") active.delete(event.runId);
      else return;
      sync();
    },
    disconnect() { active.clear(); showing = null; stop(); },
  };
}
