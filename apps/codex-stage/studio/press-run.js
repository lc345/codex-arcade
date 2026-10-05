import { createOneButtonSession } from "./one-button-kit.js";

export function createPressWorld(options = {}) {
  const specs = [[300, 1700, 0], [560, 1540, 640], [820, 1480, 1030], [1080, 1630, 250], [1330, 1410, 780], [1580, 1350, 150], [1810, 1320, 970], [2050, 1260, 510]];
  const s = { id: "press-run", goal: 8, x: 105, holding: false, gates: [], camera: 0, wheel: 0, bestX: 105, spark: 0, ghost: null };
  function gateAt([x, period, offset], i) {
    const phase = ((s.time + offset) % period) / period;
    // Open dwell, visible warning, fast stroke, closed dwell, deliberate recovery.
    const bottom = phase < .5 ? 198 : phase < .61 ? 198 + (phase - .5) / .11 * 240 : phase < .78 ? 438 : 438 - (phase - .78) / .22 * 240;
    return { id: i, x, w: 84, bottom, phase, warning: phase >= .40 && phase < .61, safe: bottom < 399 };
  }
  function place() { s.gates = specs.map(gateAt); }
  const hooks = {
    reset() { s.x = 105; s.holding = false; s.camera = 0; s.wheel = 0; s.spark = 0; s.mode = "braked"; place(); },
    press() { s.holding = true; s.mode = "running"; return true; },
    release() { s.holding = false; s.mode = "braked"; }, cancel() { s.holding = false; if (s.phase === "playing") s.mode = "braked"; },
    update(dt, { emit, finish }) {
      place(); s.spark *= .93;
      if (s.holding) { s.x += dt * .32; s.wheel += dt * .025; }
      const p = s.gates[s.progress];
      if (p && Math.abs(s.x - p.x) < p.w / 2 + 17 && p.bottom > 399) {
        s.ghost = { x: s.x, gate: p.id + 1 }; s.spark = 1; s.mode = "flattened"; finish(false, `${p.id + 1} 号压机：差一点就过去了`); return;
      }
      if (p && s.x - 17 > p.x + p.w / 2) { s.progress++; emit("gate"); }
      s.camera += (Math.max(0, Math.min(1600, s.x - 255)) - s.camera) * .1;
      if (s.progress === s.goal && s.x >= 2180) { s.mode = "complete"; finish(true); }
    },
    sync() { s.primaryLabel = s.holding ? "刹车" : "前进"; s.status = s.phase === "won" ? "八道压机，完整下班。" : s.phase === "lost" ? s.failure : `${s.progress} / 8 · 最佳 ${s.best} · 压扁 ${s.deaths} 次`; },
    save() { return { progress: s.phase === "lost" ? 0 : s.progress, won: s.phase === "won" }; },
    restore(v) {
      if (!v || !Number.isInteger(v.progress) || v.progress < 0 || v.progress > 8 || typeof v.won !== "boolean" || v.won && v.progress !== 8) return false;
      s.progress = v.progress; s.x = v.progress ? specs[v.progress - 1][0] + 74 : 105; s.camera = Math.max(0, Math.min(1600, s.x - 255));
      if (v.won) { s.phase = "won"; s.mode = "complete"; s.x = 2180; } place(); return true;
    },
  };
  return createOneButtonSession(s, hooks, options);
}
export function paintPress() {}
