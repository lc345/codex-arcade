import { Matter } from "../vendor/matter.js";
import { createOneButtonSession } from "./one-button-kit.js";

export function createGravityWorld(options = {}) {
  const { Engine, Bodies, Body, Composite, Query } = Matter, engine = Engine.create({ gravity: { x: 0, y: 1.3 }, positionIterations: 8, velocityIterations: 8 });
  const specs = [[420, 0, 180, 52], [705, 1, 185, 52], [983, 1, 205, 60], [1260, 0, 205, 56], [1530, 1, 200, 62], [1795, 0, 180, 58], [2050, 0, 210, 62], [2315, 1, 200, 56], [2570, 0, 210, 62], [2830, 1, 208, 60]];
  const columns = specs.map(([x, ceiling, h, w]) => ({ x, y: ceiling ? 144 : 432 - h, h, w, ceiling: Boolean(ceiling) }));
  const obstacles = columns.map(p => Bodies.rectangle(p.x, p.y + p.h / 2, p.w, p.h, { isStatic: true }));
  const ball = Bodies.circle(130, 417, 14, { friction: 0, frictionStatic: 0, frictionAir: 0, restitution: 0, inertia: Infinity });
  const surfaces = [Bodies.rectangle(1700, 442, 3400, 20, { isStatic: true, friction: 0 }), Bodies.rectangle(1700, 134, 3400, 20, { isStatic: true, friction: 0 })];
  Composite.add(engine.world, [ball, ...obstacles, ...surfaces]);
  const s = { id: "gravity-shift", goal: 10, columns, player: {}, camera: 0, gravity: 1, awaiting: true, mode: "ready", trail: [], flips: 0, flash: 0, pending: false };
  function syncBody() { s.player = { x: ball.position.x, y: ball.position.y, vy: ball.velocity.y }; }
  function setup(progress = 0) {
    const prev = columns[progress - 1], x = prev ? prev.x + prev.w / 2 + 25 : 130;
    s.gravity = prev && !prev.ceiling ? -1 : 1; engine.gravity.y = s.gravity * 1.3; s.awaiting = true; s.mode = "ready"; s.trail = []; s.pending = false; s.flash = 0; s.flips = 0;
    Body.setPosition(ball, { x, y: s.gravity === 1 ? 417 : 159 }); Body.setVelocity(ball, { x: 0, y: 0 }); Engine.clear(engine); syncBody(); s.camera = Math.max(0, Math.min(2370, x - 225));
  }
  const hooks = {
    tap: true, reset() { setup(); },
    press() { s.awaiting = false; s.mode = "running"; s.gravity *= -1; engine.gravity.y = s.gravity * 1.3; s.flips++; s.flash = 1; s.pending = true; return true; },
    update(dt, { emit, finish }) {
      if (s.awaiting) return;
      if (s.pending) { emit("flip"); s.pending = false; } s.flash *= .93;
      Body.setVelocity(ball, { x: 2.8, y: ball.velocity.y }); Engine.update(engine, dt); syncBody();
      s.camera += (Math.max(0, Math.min(2370, s.player.x - 225)) - s.camera) * .1;
      s.trail.push({ ...s.player }); if (s.trail.length > 22) s.trail.shift();
      if (Query.collides(ball, obstacles).length) { s.mode = "crashed"; finish(false, `第 ${s.progress + 1} 道，换面没赶上`); return; }
      const next = columns[s.progress]; if (next && s.player.x > next.x + next.w / 2 + 14) { s.progress++; emit("gate"); }
      if (s.progress === 10 && s.player.x > 3000) { s.mode = "complete"; finish(true); }
    },
    sync() { s.primaryLabel = "翻面"; s.status = s.phase === "won" ? "地板不干了，天花板接班。" : s.phase === "lost" ? s.failure : `${s.progress} / 10 · 最佳 ${s.best} · 撞上 ${s.deaths} 次`; },
    save() { return { progress: s.phase === "lost" ? 0 : s.progress, won: s.phase === "won" }; },
    restore(v) { if (!v || !Number.isInteger(v.progress) || v.progress < 0 || v.progress > 10 || typeof v.won !== "boolean" || v.won && v.progress !== 10) return false; s.progress = v.progress; setup(v.progress); if (v.won) { s.phase = "won"; s.mode = "complete"; Body.setPosition(ball, { x: 3001, y: 417 }); syncBody(); } return true; },
    destroy() { Composite.clear(engine.world, false); Engine.clear(engine); },
  };
  return createOneButtonSession(s, hooks, options);
}
export function paintGravity() {}
