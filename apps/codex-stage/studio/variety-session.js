// Shared host contract only; each world owns its rules, hit testing and safe checkpoint.
export function createVarietySession(s, h, { checkpoint, onEvent = () => {} } = {}) {
  let active = true, accumulator = 0;
  const emit = type => { if (active) onEvent({ type: `variety-${type}` }); };
  Object.assign(s, { level: 0, time: 0, phase: "playing", score: 0, progress: 0, secondaryLabel: "", abilityAvailable: false });
  function sync() { h.sync(); }
  function reset(all = false) { accumulator = 0; h.cancel?.(); h.reset(all); sync(); }
  function command(fn, ...args) { if (!active) return false; const ok = fn?.(...args, emit) ?? false; sync(); return ok; }
  reset(true);
  try { if (checkpoint?.version === 1 && checkpoint.id === s.id && JSON.stringify(checkpoint).length < 8192 && h.restore(checkpoint.data)) sync(); else reset(true); } catch { reset(true); }
  const api = { scene: s, effects: [],
    step(ms) { if (!active || !Number.isFinite(ms) || ms <= 0) return; accumulator += Math.min(50, ms); while (accumulator + 1e-8 >= 1000 / 120) { accumulator -= 1000 / 120; s.time += 1000 / 120; h.update?.(1000 / 120, emit); sync(); } },
    primary() { return command(h.primary); }, secondary() { return command(h.secondary); },
    pointer(type, x, y) { if (!Number.isFinite(x + y)) return false; return command(h.pointer, type, x, y); },
    key(key, down) { if (!active) return false; if (!down) return false; if ([" ", "Enter"].includes(key)) { command(h.primary); return true; } return command(h.key, key); },
    retry() { if (!active) return false; reset(false); return true; }, next() { return api.primary(); },
    setLevel(n) { if (!active || n !== 0) return false; reset(true); return true; }, cancel() { if (active) { h.cancel?.(); sync(); } },
    checkpoint() { return { version: 1, id: s.id, data: h.save() }; },
    snapshot() { return { id: s.id, active, level: 0, time: Math.round(s.time), phase: s.phase, mode: s.mode, score: s.score, progress: s.progress, goal: s.goal, status: s.status, primaryLabel: s.primaryLabel, secondaryLabel: s.secondaryLabel, abilityAvailable: s.abilityAvailable, primaryEnabled: h.enabled?.() !== false }; },
    stop() { if (!active) return; h.cancel?.(); sync(); active = false; }, destroy() { api.stop(); h.destroy?.(); },
  };
  return api;
}
