import { createOneButtonSession } from "./one-button-kit.js";

export function createOrbitPinsWorld(options = {}) {
  const tau = Math.PI * 2, seeds = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
  const norm = a => (a % tau + tau) % tau, distance = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  const s = { id: "orbit-pins", goal: 18, angle: 0, pins: [], flight: 0, cooldown: 0, flash: 0, hit: null, pending: false };
  const hooks = {
    tap: true,
    reset() { s.angle = .42; s.pins = seeds.slice(); s.flight = 0; s.cooldown = 0; s.flash = 0; s.mode = "ready"; s.hit = null; s.pending = false; },
    press() { if (s.mode !== "ready") return false; s.mode = "shot"; s.flight = 0; s.pending = true; return true; }, enabled: () => s.mode === "ready",
    update(dt, { emit, finish }) {
      if (s.pending) { emit("pin"); s.pending = false; }
      s.direction = s.progress >= 6 && s.progress < 12 ? -1 : 1;
      s.speed = s.direction * (1.05 + s.progress * .037 + Math.sin(s.time / 1150) * .22);
      s.angle = norm(s.angle + s.speed * dt / 1000); s.flash *= .95;
      if (s.mode === "cooldown") { s.cooldown -= dt; if (s.cooldown <= 0) s.mode = "ready"; }
      if (s.mode === "shot") {
        s.flight += dt;
        if (s.flight >= 130) {
          const a = norm(Math.PI / 2 - s.angle), nearest = s.pins.reduce((best, p) => distance(a, p) < distance(a, best) ? p : best, s.pins[0]);
          if (distance(a, nearest) < .18) { s.hit = norm(nearest + s.angle); s.mode = "jammed"; finish(false, "碰到旧签了"); return; }
          s.pins.push(a); s.progress++; s.flash = 1; s.mode = "cooldown"; s.cooldown = 160; emit("stack");
          if (s.progress === 18) { s.mode = "complete"; finish(true); }
        }
      }
    },
    sync() { s.primaryLabel = "插签"; s.direction = s.progress >= 6 && s.progress < 12 ? -1 : 1; s.status = s.phase === "won" ? "十八根，一根都没碰。" : s.phase === "lost" ? s.failure : `${s.progress} / 18 · 最佳 ${s.best} · 卡住 ${s.deaths} 次`; },
    save() { return { pins: s.phase === "lost" ? seeds.slice() : s.pins.slice(), angle: s.phase === "lost" ? .42 : s.angle }; },
    restore(v) {
      if (!v || !Array.isArray(v.pins) || v.pins.length < 4 || v.pins.length > 22 || !Number.isFinite(v.angle) || v.angle < 0 || v.angle >= tau || seeds.some((a, i) => v.pins[i] !== a)) return false;
      for (let i = 0; i < v.pins.length; i++) { if (!Number.isFinite(v.pins[i]) || v.pins[i] < 0 || v.pins[i] >= tau) return false; for (let j = 0; j < i; j++) if (distance(v.pins[i], v.pins[j]) < .18) return false; }
      s.pins = v.pins.slice(); s.angle = v.angle; s.progress = s.pins.length - 4; if (s.progress === 18) { s.phase = "won"; s.mode = "complete"; } return true;
    },
  };
  return createOneButtonSession(s, hooks, options);
}
export function paintOrbitPins() {}
