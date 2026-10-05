import { Matter } from "../vendor/matter.js";
import { createVarietySession } from "./variety-session.js";

export function createClearoutWorld(options = {}) {
  const { Engine, Bodies, Body, Composite } = Matter, engine = Engine.create({ gravity: { x: 0, y: .9 }, positionIterations: 8 });
  const s = { id: "clockout-clearout", goal: 3, chapter: 0, selected: 0, items: [], supports: [], plank: {}, delivered: 0, elapsed: 0 };
  let items = [], supports = [], plank, pending = null, settle = new Map();
  const mirror = x => s.chapter === 1 ? 960 - x : x;
  const rect = (x, y, w, h, opts = {}) => Bodies.rectangle(mirror(x), y, w, h, { ...opts, angle: (s.chapter === 1 ? -1 : 1) * (opts.angle || 0) });
  function syncBodies() {
    s.items = items.map((b, i) => ({ x: b.position.x, y: b.position.y, angle: b.angle, w: b.plugin.w, h: b.plugin.h, kind: b.plugin.kind, delivered: (settle.get(i) || 0) >= 400, speed: b.speed }));
    s.plank = { x: plank.position.x, y: plank.position.y, angle: plank.angle, w: 332, h: 17 };
    s.supports = supports.map((b, i) => ({ x: b.position.x, y: b.position.y, w: 22, h: 118, removed: s.removed === i }));
  }
  function build() {
    Composite.clear(engine.world, false); Engine.clear(engine); settle = new Map(); s.time = 0; s.elapsed = 0; s.removed = -1; s.delivered = 0; s.selected = 0; s.mode = "choose"; s.phase = "playing";
    plank = rect(370, 267, 332, 17, { density: .004, friction: 0, frictionStatic: 0, frictionAir: .003 });
    supports = [rect(498, 335, 22, 118, { isStatic: true, friction: .2 }), rect(241, 335, 22, 118, { isStatic: true, friction: .2 })];
    s.ramp = { x: mirror(558), y: 374, w: 366, h: 14, angle: (s.chapter === 1 ? -1 : 1) * .25 };
    const ramp = rect(558, 374, 366, 14, { angle: .25, isStatic: true, friction: .035 });
    const floor = rect(775, 481, 228, 16, { isStatic: true, friction: .65 }), wall1 = rect(664, 468, 10, 35, { isStatic: true }), wall2 = rect(888, 440, 12, 86, { isStatic: true });
    s.truck = { x: mirror(775), y: 481, left: Math.min(mirror(668), mirror(883)), right: Math.max(mirror(668), mirror(883)) };
    const specs = s.chapter === 2 ? [[300, 229, 42, 50, "washer"], [355, 236, 38, 36, "tv"], [412, 236, 45, 36, "box"], [460, 238, 29, 30, "ball"], [356, 196, 32, 33, "lamp"]] : [[300, 234, 42, 42, "washer"], [354, 237, 42, 36, "tv"], [410, 237, 45, 36, "box"], [460, 237, 30, 30, "ball"]];
    items = specs.map(([x, y, w, h, kind]) => { const b = kind === "ball" ? Bodies.circle(mirror(x), y, w / 2, { friction: 0, frictionStatic: 0, restitution: .15, density: .002 }) : rect(x, y, w, h, { friction: 0, frictionStatic: 0, restitution: .05, chamfer: { radius: 4 }, density: .002 }); Object.assign(b.plugin, { w, h, kind }); return b; });
    Composite.add(engine.world, [plank, ...supports, ramp, floor, wall1, wall2, ...items]); syncBodies();
  }
  function pull(i, emit = () => {}) { if (s.mode !== "choose" || ![0, 1].includes(i)) return false; Composite.remove(engine.world, supports[i]); s.removed = i; s.mode = "settling"; s.elapsed = 0; emit("pull"); return true; }
  const h = {
    reset(all) { if (all || s.phase === "won") s.chapter = 0; build(); },
    primary(emit) { if (s.phase === "won") { h.reset(true); return true; } if (s.mode === "delivered") { s.chapter++; build(); emit("build"); return true; } if (s.phase === "lost") { build(); return true; } return pull(s.selected, emit); },
    pointer(type, x, y, emit) { if (type === "down" && s.mode === "choose") { const i = s.supports.findIndex(p => Math.abs(x - p.x) <= 46 && y >= 290 && y <= 423); if (i < 0) return false; pending = i; s.selected = i; return true; } if (type === "up" && pending !== null) { const i = pending; pending = null; return Math.abs(x - s.supports[i].x) <= 65 && y >= 285 && y <= 432 && pull(i, emit); } return false; },
    key(key) { if (!key.startsWith("Arrow") || s.mode !== "choose") return false; s.selected = key === "ArrowRight" ? (s.chapter === 1 ? 1 : 0) : (s.chapter === 1 ? 0 : 1); return true; }, cancel() { pending = null; }, enabled: () => s.mode !== "settling",
    update(dt, emit) {
      if (s.mode !== "settling") return; s.elapsed += dt; Engine.update(engine, dt);
      items.forEach((b, i) => { if ((settle.get(i) || 0) >= 400) return; const ok = b.bounds.min.x > s.truck.left && b.bounds.max.x < s.truck.right && b.bounds.max.y < 478 && b.bounds.min.y > 320 && b.speed < .8;
        settle.set(i, ok ? (settle.get(i) || 0) + dt : 0); if ((settle.get(i) || 0) >= 400) { s.delivered++; emit("delivery"); } });
      syncBodies();
      if (s.delivered === items.length) { s.mode = s.chapter === 2 ? "complete" : "delivered"; s.phase = s.chapter === 2 ? "won" : "playing"; emit("win"); }
      else if (s.elapsed > 12000 || items.some(b => b.position.y > 650)) { s.mode = "spill"; s.phase = "lost"; emit("fail"); }
    },
    sync() { s.progress = s.chapter + (["delivered", "complete"].includes(s.mode) ? 1 : 0); s.score = s.chapter * 500 + s.delivered * 100; s.primaryLabel = s.mode === "delivered" ? "下一车" : "抽掉支撑"; s.status = s.phase === "lost" ? `装进 ${s.delivered} 件 · 这一车得重新来` : s.phase === "won" ? "三车杂物，全部打包下班。" : `${s.chapter + 1} / 3 车 · ${s.delivered} / ${s.items.length} 件装稳${s.mode === "delivered" ? " · 下一车" : ""}`; },
    save() { return { chapter: s.chapter, complete: ["delivered", "complete"].includes(s.mode) }; },
    restore(v) { if (!v || !Number.isInteger(v.chapter) || v.chapter < 0 || v.chapter > 2 || typeof v.complete !== "boolean") return false; s.chapter = v.chapter; if (v.complete && v.chapter < 2) s.chapter++; build();
      // Reconstruct the final tableau through physics, never from untrusted body coordinates.
      if (v.complete && v.chapter === 2) { pull(0); for (let i = 0; i < 1500 && s.mode === "settling"; i++) h.update(1000 / 120, () => {}); }
      return true; },
    destroy() { Composite.clear(engine.world, false); Engine.clear(engine); },
  };
  const api = createVarietySession(s, h, options); api.pull = i => api.snapshot().active && pull(i, type => options.onEvent?.({ type: `variety-${type}` })); return api;
}
export function paintClearout() {}
