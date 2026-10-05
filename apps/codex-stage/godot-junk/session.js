// Only lifecycle and semantic game input cross this boundary, never Agent content.
export function createGodotSession({ boot, checkpoint = null, onState = () => {} }) {
  let view, ticket = 0, abort, destroyed = false, state = "idle", paused = false;
  let muted = true, reduced = false;
  const settings = () => view?.command("settings", { muted, reduced });
  const api = {
    async start() {
      if (destroyed || state === "playing" || state === "loading") return;
      const current = ++ticket; paused = false; state = "loading"; onState(state);
      try {
        if (!view) {
          abort = new AbortController();
          const next = await boot({ signal: abort.signal });
          if (destroyed || current !== ticket) { next.dispose(); return; }
          view = next; settings(); view.command("restore", checkpoint);
        }
        view.command("start"); state = "playing"; onState(state);
      } catch (e) { if (current === ticket && !destroyed) { state = "error"; onState(state, e); } }
    },
    stop() { if (destroyed) return; ++ticket; abort?.abort(); view?.command("stop"); state = "stopped"; paused = false; onState(state); },
    input(type) { if (state !== "playing" || paused || !["down", "up", "cancel", "retry", "next"].includes(type)) return false; view?.command(type); return true; },
    setMuted(value) { muted = Boolean(value); settings(); },
    setReduced(value) { reduced = Boolean(value); settings(); },
    setPaused(value) { paused = Boolean(value); if (state === "playing") view?.command("pause", paused); },
    destroy() { if (destroyed) return; api.stop(); destroyed = true; view?.dispose(); view = null; },
    get state() { return state; },
  };
  return api;
}
