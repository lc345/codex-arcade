import { Matter } from "../vendor/matter.js";
import { createOneButtonSession } from "./one-button-kit.js";

export function createLastStopWorld(options = {}) {
  const { Engine, Bodies, Body, Composite } = Matter, engine = Engine.create({ gravity: { x: 0, y: 0 } });
  const puck = Bodies.rectangle(128, 316, 48, 44, { frictionAir: 0, inertia: Infinity }); Composite.add(engine.world, puck);
  const specs = [[600, 132, .05], [505, 114, .065], [726, 100, .038], [560, 88, .06], [675, 80, .044], [495, 72, .07], [740, 66, .037], [625, 60, .052]];
  const s = { id: "last-stop", goal: 8, x: 128, velocity: 0, target: {}, mode: "ready", wheel: 0, trail: [], receipt: 0, brakeAt: null, lastMiss: null, pending: null, perfect: 0 };
  function setup() { const [x, w, drag] = specs[Math.min(7, s.progress)]; s.target = { x, w, drag }; s.mode = "ready"; s.x = 128; s.velocity = 0; s.wheel = 0; s.trail = []; s.brakeAt = null; s.receipt = 0; s.pending = null; Body.setStatic(puck, false); Body.setPosition(puck, { x: 128, y: 316 }); Body.setVelocity(puck, { x: 0, y: 0 }); puck.frictionAir = 0; Engine.clear(engine); }
  const hooks = {
    reset() { setup(); },
    press() { if (s.mode !== "ready") return false; s.mode = "driving"; s.pending = "stretch"; return true; },
    release() { if (s.mode !== "driving") return; s.mode = "braking"; puck.frictionAir = s.target.drag; s.brakeAt = s.x; s.pending = "brake"; },
    cancel() { if (s.mode === "driving") setup(); s.pending = null; }, enabled: () => ["ready", "driving"].includes(s.mode),
    update(dt, { emit, finish }) {
      if (s.pending) { emit(s.pending); s.pending = null; }
      if (s.mode === "ready") return;
      if (s.mode === "parked") { s.receipt += dt; if (s.receipt > 460) setup(); return; }
      if (s.mode === "driving") { Body.applyForce(puck, puck.position, { x: .00036 * puck.mass, y: 0 }); if (puck.velocity.x > 9) Body.setVelocity(puck, { x: 9, y: 0 }); }
      Engine.update(engine, dt); s.x = puck.position.x; s.velocity = puck.velocity.x; s.wheel += s.velocity * .035;
      s.trail.push(s.x); if (s.trail.length > 30) s.trail.shift();
      const safeHalf = s.target.w / 2 - 24;
      if (s.x > s.target.x + safeHalf || s.mode === "braking" && s.velocity < .06) {
        const error = s.x - s.target.x;
        if (s.mode === "braking" && s.velocity < .06 && Math.abs(error) <= safeHalf) { Body.setStatic(puck, true); s.mode = "parked"; s.progress++; if (Math.abs(error) < 5) s.perfect++; emit(Math.abs(error) < 5 ? "perfect" : "park"); if (s.progress === 8) finish(true); }
        else { s.lastMiss = { x: s.x, round: s.progress, error: Math.round(error) }; s.mode = "missed"; finish(false, `${error < 0 ? "早刹" : "晚刹"}了 ${Math.max(1, Math.round(Math.abs(error) - safeHalf))} px`); }
      }
    },
    sync() { s.primaryLabel = s.mode === "driving" ? "刹车" : "出发"; s.status = s.phase === "won" ? "八次入库，全都停稳。" : s.phase === "lost" ? s.failure : `${s.progress} / 8 · 最佳 ${s.best} · 失手 ${s.deaths} 次`; },
    save() { return { progress: s.phase === "lost" ? 0 : s.progress, perfect: s.phase === "lost" ? 0 : s.perfect }; },
    restore(v) { if (!v || !Number.isInteger(v.progress) || v.progress < 0 || v.progress > 8 || !Number.isInteger(v.perfect) || v.perfect < 0 || v.perfect > v.progress) return false;
      s.progress = v.progress; s.perfect = v.perfect; setup(); if (s.progress === 8) { s.phase = "won"; s.mode = "parked"; s.x = s.target.x; Body.setPosition(puck, { x: s.x, y: 316 }); Body.setStatic(puck, true); } return true;
    }, destroy() { Composite.clear(engine.world, false); Engine.clear(engine); },
  };
  return createOneButtonSession(s, hooks, options);
}
export function paintLastStop() {}
