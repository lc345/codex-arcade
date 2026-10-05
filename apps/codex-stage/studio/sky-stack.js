import { createOneButtonSession } from "./one-button-kit.js";

export function createSkyStackWorld(options = {}) {
  const s = { id: "sky-stack", goal: 12, floors: [], moving: {}, top: {}, scraps: [], camera: 0, perfect: 0, flash: 0, lastCut: 0 };
  const base = () => ({ x: 480, w: 192, y: 431, hue: 0 });
  function spawn() { s.top = s.floors.at(-1); s.mode = "slide"; s.clock = 0; s.moving = { x: s.top.x + (s.progress % 2 ? 270 : -270), w: s.top.w, y: s.top.y - 87, vy: 0, hue: s.progress + 1 }; }
  const hooks = {
    tap: true,
    reset() { s.floors = [base()]; s.scraps = []; s.camera = 0; s.lastCut = 0; s.flash = 0; s.perfect = 0; spawn(); },
    press() { if (s.mode !== "slide") return false; s.mode = "drop"; s.moving.vy = 0; return true; },
    enabled: () => s.mode === "slide",
    update(dt, { emit, finish }) {
      s.flash *= .94;
      s.scraps.forEach(p => { p.vy += dt * .0015; p.y += p.vy; p.x += p.vx; p.angle += p.vx * .012; p.life -= dt; }); s.scraps = s.scraps.filter(p => p.life > 0);
      s.camera += (Math.max(0, 385 - s.top.y) - s.camera) * .08;
      if (s.mode === "slide") {
        s.clock += dt; const speed = 185 + s.progress * 14, travel = (s.clock / 1000 * speed) % 1080;
        const offset = travel <= 540 ? travel - 270 : 810 - travel;
        s.moving.x = s.top.x + offset * (s.progress % 2 ? -1 : 1);
      } else if (s.mode === "drop") {
        s.moving.vy += dt * .008; s.moving.y += s.moving.vy;
        if (s.moving.y < s.top.y - 27) return;
        const m = s.moving, t = s.top, delta = m.x - t.x, perfect = Math.abs(delta) <= 4;
        const left = Math.max(m.x - m.w / 2, t.x - t.w / 2), right = Math.min(m.x + m.w / 2, t.x + t.w / 2), overlap = right - left;
        if (overlap < 7) { s.mode = "fallen"; finish(false, `第 ${s.progress + 1} 层，没接住`); return; }
        const width = perfect ? t.w : overlap, x = perfect ? t.x : (left + right) / 2;
        s.lastCut = perfect ? 0 : Math.round(t.w - width);
        if (!perfect) { const cut = t.w - width, side = Math.sign(delta); s.scraps.push({ x: x + side * (width + cut) / 2, y: t.y - 27, w: cut, hue: m.hue, vy: 0, vx: side * 1.6, angle: 0, life: 1300 }); }
        else s.perfect++;
        s.floors.push({ x, w: width, y: t.y - 27, hue: m.hue }); s.progress++; s.flash = 1;
        emit(perfect ? "perfect" : "stack"); s.top = s.floors.at(-1);
        if (s.progress === s.goal) { s.mode = "complete"; s.camera = 46; finish(true); } else spawn();
      }
    },
    sync() { s.primaryLabel = "落下"; s.status = s.phase === "won" ? "十二层，站住了。" : s.phase === "lost" ? s.failure : `${s.progress} / 12 · 楼宽 ${Math.round(s.top.w)} · 最佳 ${s.best}`; },
    save() { return { floors: (s.phase === "lost" ? [base()] : s.floors).map(p => [p.x, p.w]), perfect: s.phase === "lost" ? 0 : s.perfect }; },
    restore(v) {
      if (!v || !Array.isArray(v.floors) || v.floors.length < 1 || v.floors.length > 13 || !Number.isInteger(v.perfect) || v.perfect < 0 || v.perfect >= v.floors.length) return false;
      if (v.floors[0]?.[0] !== 480 || v.floors[0]?.[1] !== 192) return false;
      for (let i = 0; i < v.floors.length; i++) {
        const p = v.floors[i], prev = v.floors[i - 1];
        if (!Array.isArray(p) || p.length !== 2 || !p.every(Number.isFinite) || p[1] < 7 || p[1] > 192 || Math.abs(p[0] - 480) > 96) return false;
        if (prev && (p[1] > prev[1] + .001 || Math.abs(p[0] - prev[0]) + p[1] / 2 > prev[1] / 2 + .001)) return false;
      }
      s.floors = v.floors.map(([x, w], i) => ({ x, w, y: 431 - i * 27, hue: i })); s.progress = s.floors.length - 1; s.perfect = v.perfect; spawn(); s.camera = Math.max(0, 385 - s.top.y);
      if (s.progress === s.goal) { s.phase = "won"; s.mode = "complete"; s.camera = 46; } return true;
    },
  };
  return createOneButtonSession(s, hooks, options);
}
export function paintSkyStack() {}
