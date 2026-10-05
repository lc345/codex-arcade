// Shared interruption/input contract. Game rules and collision geometry stay in each world.
export function createOneButtonSession(scene, hooks, { checkpoint: saved, onEvent = () => {} } = {}) {
  const dt = 1000 / 120; let active = true, owner = null, accumulator = 0, deadTime = 0;
  Object.assign(scene, { level: 0, phase: "playing", time: 0, progress: 0, score: 0, best: 0, deaths: 0, attempt: 1, secondaryLabel: "", abilityAvailable: false });
  const emit = type => { if (active) onEvent({ type: `precision-${type}` }); };
  function sync() { scene.best = Math.max(scene.best, scene.progress); scene.score = scene.progress * 100 + (scene.perfect || 0) * 25; hooks.sync?.(); }
  function reset() { owner = null; accumulator = 0; deadTime = 0; Object.assign(scene, { phase: "playing", time: 0, progress: 0, score: 0, perfect: 0, failure: "" }); hooks.reset(); sync(); }
  function finish(won, reason = "") { if (!active || scene.phase !== "playing") return; scene.phase = won ? "won" : "lost"; scene.failure = reason; owner = null; hooks.cancel?.(); deadTime = 0; if (!won) scene.deaths = Math.min(99999, scene.deaths + 1); emit(won ? "win" : "fail"); sync(); }
  function retry() { if (!active) return false; scene.attempt = Math.min(99999, scene.attempt + 1); reset(); return true; }
  function down(source) {
    if (!active || owner !== null) return false;
    if (scene.phase !== "playing") return retry();
    if (hooks.press() === false) return false;
    owner = source; sync(); return true;
  }
  function up(source) { if (!active || owner !== source) return false; owner = null; hooks.release?.(); sync(); return true; }
  function cancel() { owner = null; hooks.cancel?.(); sync(); }
  reset();
  const integer = (n, lo, hi) => Number.isInteger(n) && n >= lo && n <= hi;
  if (saved?.version === 1 && saved.id === scene.id && integer(saved.best, 0, scene.goal) && integer(saved.deaths, 0, 99999) && integer(saved.attempt, 1, 99999) && hooks.restore?.(saved.data)) {
    scene.best = Math.max(saved.best, scene.progress); scene.deaths = saved.deaths; scene.attempt = saved.attempt; sync();
  }
  const api = { scene, effects: [],
    step(ms) { if (!active || !Number.isFinite(ms) || ms <= 0) return; accumulator += Math.min(50, ms); while (accumulator + 1e-8 >= dt) {
      accumulator -= dt; if (scene.phase === "won") continue;
      if (scene.phase === "lost") { deadTime += dt; if (deadTime >= 650) retry(); continue; }
      scene.time += dt; hooks.update(dt, { emit, finish }); sync();
    } },
    pointer(type, x, y) { if (!active || !Number.isFinite(x + y)) return false; const inside = x >= 0 && x <= 960 && y >= 0 && y <= 540;
      if (type === "down") return inside && down("pointer");
      if (type === "up") { if (!inside) { cancel(); return false; } return up("pointer"); } return false;
    },
    key(key, pressed) { if (!active || ![" ", "Enter"].includes(key)) return false; if (pressed) down("key"); else up("key"); return true; },
    primary() { if (!active) return false; if (hooks.tap) { const accepted = down("tap"); up("tap"); return accepted; } return owner === "tap" ? up("tap") : down("tap"); },
    secondary() { return false; }, cancel() { if (active) cancel(); }, retry, next: retry, setLevel(n) { return n === 0 && retry(); },
    checkpoint() { return { version: 1, id: scene.id, best: scene.best, deaths: scene.deaths, attempt: scene.attempt, data: hooks.save() }; },
    snapshot() { return { id: scene.id, active, level: 0, phase: scene.phase, mode: scene.mode, time: Math.round(scene.time), progress: scene.progress, goal: scene.goal, score: scene.score, best: scene.best, deaths: scene.deaths, attempt: scene.attempt, status: scene.status, primaryLabel: scene.primaryLabel, secondaryLabel: "", abilityAvailable: false, primaryEnabled: scene.phase !== "playing" || hooks.enabled?.() !== false }; },
    stop() { if (!active) return; cancel(); active = false; }, destroy() { api.stop(); hooks.destroy?.(); },
  };
  return api;
}
