// Rotation is independent of task identity; only a quiet round boundary may advance it.
export function createGameRotation({ next, now = () => performance.now(), intervalMs = 180000, idleMs = 5000 }) {
  const held = new Set(), boundaries = new Set(["ready", "won", "lost", "cleared", "error"]);
  let selectedAt = now(), touchedAt = now();
  return {
    reset() { selectedAt = touchedAt = now(); held.clear(); },
    touch() { touchedAt = now(); },
    press(id) { held.add(id); touchedAt = now(); },
    release(id) { held.delete(id); touchedAt = now(); },
    clearInput() { held.clear(); touchedAt = now(); },
    tick({ active, random, paused = false, hidden = false, phase }) {
      const time = now();
      if (!active || !random || paused || hidden || held.size || !boundaries.has(phase) || time - selectedAt < intervalMs || time - touchedAt < idleMs) return false;
      selectedAt = touchedAt = time; next(); return true;
    },
  };
}
