import { Matter } from "../vendor/matter.js";
import { createOneButtonSession } from "./one-button-kit.js";

export function createSwingWorld(options = {}) {
  const { Engine, Bodies, Body, Composite, Query } = Matter;
  const engine = Engine.create({ gravity: { x: 0, y: 1.15 }, positionIterations: 8, velocityIterations: 8 });
  const parcel = Bodies.rectangle(240, 210, 24, 24, { frictionAir: 0, restitution: 0, inertia: Infinity });
  const tray = Bodies.rectangle(600, 446, 110, 12, { isStatic: true }); Composite.add(engine.world, [parcel, tray]);
  const specs = [[590, 112, 0, 2300], [635, 92, 0, 2170], [568, 76, 25, 2450], [658, 66, 34, 2630], [600, 57, 40, 2400], [650, 48, 30, 2240], [580, 43, 35, 2520], [625, 38, 30, 2370]];
  const s = { id: "swing-post", goal: 8, roundTime: 0, pivot: { x: 305, y: 130 }, angle: -1, parcel: {}, target: {}, holding: false, trail: [], stamp: 0, lastMiss: null, receipt: 0, perfect: 0 };
  function target() { const [x, w, amp, period] = specs[Math.min(7, s.progress)]; return { x: x + amp * Math.sin(s.roundTime / period * Math.PI * 2), w, y: 440 }; }
  function hang() {
    const period = 2050 - s.progress * 38, omega = Math.PI * 2 / period, a = -1.08 * Math.cos(s.roundTime * omega), av = 1.08 * omega * Math.sin(s.roundTime * omega), length = 174;
    s.angle = a; Body.setPosition(parcel, { x: s.pivot.x + Math.sin(a) * length, y: s.pivot.y + Math.cos(a) * length });
    s.launch = { x: Math.cos(a) * length * av * (1000 / 60), y: -Math.sin(a) * length * av * (1000 / 60) };
    s.parcel = { x: parcel.position.x, y: parcel.position.y, angle: a * -.25 };
  }
  function setup() { s.mode = "swing"; s.roundTime = 0; s.holding = false; s.trail = []; s.stamp = 0; s.receipt = 0; Body.setStatic(parcel, true); Body.setAngle(parcel, 0); Body.setVelocity(parcel, { x: 0, y: 0 }); s.target = target(); hang(); }
  let trayWidth = 110;
  function moveTray() { s.target = target(); Body.scale(tray, s.target.w / trayWidth, 1); trayWidth = s.target.w; Body.setPosition(tray, { x: s.target.x, y: 446 }); }
  const hooks = {
    reset() { setup(); s.perfect = 0; moveTray(); },
    press() { if (s.mode !== "swing") return false; s.holding = true; return true; },
    release() { if (s.mode !== "swing" || !s.holding) return; s.holding = false; s.mode = "flight"; Body.setStatic(parcel, false); Body.setInertia(parcel, Infinity); Body.setVelocity(parcel, s.launch); },
    cancel() { s.holding = false; }, enabled: () => s.mode === "swing",
    update(dt, { emit, finish }) {
      s.roundTime += dt; if (s.mode !== "delivered") moveTray();
      if (s.mode === "swing") hang();
      else if (s.mode === "flight") {
        const before = { ...parcel.position }, descending = parcel.velocity.y >= 0; Engine.update(engine, dt); const p = parcel.position;
        s.parcel = { x: p.x, y: p.y, angle: Math.max(-.4, Math.min(.4, parcel.velocity.y * .03)) };
        s.trail.push({ x: p.x, y: p.y }); if (s.trail.length > 20) s.trail.shift();
        if (descending && before.y + 12 <= 443 && p.y + 12 >= 439 && Query.collides(parcel, [tray]).length && Math.abs(p.x - s.target.x) <= s.target.w / 2 - 8) {
          const error = Math.abs(p.x - s.target.x); s.progress++; if (error < 6) s.perfect++;
          s.mode = "delivered"; s.stamp = 1; s.receipt = 0; Body.setStatic(parcel, true); emit(error < 6 ? "perfect" : "delivery");
          if (s.progress === s.goal) finish(true);
        } else if (p.y > 485 || p.x < 0 || p.x > 970 || descending && Query.collides(parcel, [tray]).length) {
          const error = Math.round(p.x - s.target.x); s.lastMiss = { x: p.x, target: s.target.x, distance: Math.abs(error), side: error < 0 ? "short" : "long" };
          s.mode = "missed"; finish(false, `${error < 0 ? "差" : "过"} ${Math.abs(error)} px，邮筒没接住`);
        }
      } else if (s.mode === "delivered") { s.receipt += dt; if (s.receipt > 430) { setup(); moveTray(); } }
    },
    sync() { s.primaryLabel = s.holding ? "松手" : "接住吊绳"; s.status = s.phase === "won" ? "八封信，全都送到了。" : s.phase === "lost" ? s.failure : `${s.progress} / 8 · 最佳 ${s.best} · 退件 ${s.deaths} 次`; },
    save() { return { progress: s.phase === "lost" ? 0 : s.progress, perfect: s.phase === "lost" ? 0 : s.perfect }; },
    restore(v) { if (!v || !Number.isInteger(v.progress) || v.progress < 0 || v.progress > 8 || !Number.isInteger(v.perfect) || v.perfect < 0 || v.perfect > v.progress) return false;
      s.progress = v.progress; s.perfect = v.perfect; setup(); moveTray(); if (s.progress === 8) { s.phase = "won"; s.mode = "delivered"; } return true;
    }, destroy() { Composite.clear(engine.world, false); Engine.clear(engine); },
  };
  return createOneButtonSession(s, hooks, options);
}
export function paintSwing() {}
