import { createOneButtonSession } from "./one-button-kit.js";

export function createBridgeWorld(options = {}) {
  const spans = [[130, 86], [215, 70], [108, 56], [255, 48], [170, 42], [278, 36], [145, 32], [239, 29], [189, 25], [268, 23]];
  const platforms = [{ x: 96, w: 104, y: 397 }];
  for (const [gap, w] of spans) { const p = platforms.at(-1); platforms.push({ x: p.x + p.w + gap, w, y: 397 }); }
  const s = { id: "bridge-span", goal: 10, platforms, bridges: [], player: {}, camera: 0, length: 0, turn: 0, perfect: 0, lastMiss: "", pending: null };
  function setup() { const p = platforms[s.progress]; s.anchor = p.x + p.w; s.target = platforms[Math.min(10, s.progress + 1)]; s.player = { x: s.anchor - 14, y: 381 }; s.mode = "ready"; s.length = 0; s.turn = 0; s.pending = null; }
  const hooks = {
    reset() { s.bridges = []; s.camera = 0; setup(); },
    press() { if (s.mode !== "ready") return false; s.mode = "growing"; s.pending = "stretch"; return true; },
    release() { if (s.mode === "growing") { s.mode = "lowering"; s.turn = 0; s.pending = "bridge"; } },
    cancel() { if (s.mode === "growing") { s.length = 0; s.mode = "ready"; } s.pending = null; }, enabled: () => ["ready", "growing"].includes(s.mode),
    update(dt, { emit, finish }) {
      if (s.pending) { emit(s.pending); s.pending = null; }
      s.camera += (Math.max(0, s.player.x - 220) - s.camera) * .07;
      if (s.mode === "growing") s.length = Math.min(390, s.length + dt * .18);
      if (s.mode === "lowering") { s.turn = Math.min(1, s.turn + dt / 280); if (s.turn === 1) {
        const tip = s.anchor + s.length; s.valid = tip >= s.target.x + 2 && tip <= s.target.x + s.target.w - 2;
        s.walkEnd = s.valid ? s.target.x + s.target.w - 14 : tip; s.mode = "walking";
      } }
      if (s.mode === "walking") {
        s.player.x = Math.min(s.walkEnd, s.player.x + dt * .42);
        if (s.player.x === s.walkEnd) {
          if (!s.valid) { const tip = s.anchor + s.length, short = tip < s.target.x + 2, distance = Math.max(1, Math.round(short ? s.target.x + 2 - tip : tip - s.target.x - s.target.w + 2)); s.lastMiss = `${short ? "短" : "长"}了 ${distance} px`; s.mode = "fall"; finish(false, s.lastMiss); return; }
          if (Math.abs(s.anchor + s.length - s.target.x - s.target.w / 2) < 4) s.perfect++;
          s.bridges.push({ x: s.anchor, length: s.length }); s.progress++; emit("delivery");
          if (s.progress === 10) { s.mode = "complete"; finish(true); } else setup();
        }
      }
    },
    sync() { s.primaryLabel = s.mode === "growing" ? "落桥" : "伸长"; s.status = s.phase === "lost" ? s.failure : s.phase === "won" ? "十段路，刚刚好。" : `${s.progress} / 10 · 最佳 ${s.best} · 落水 ${s.deaths} 次`; },
    save() { return { progress: s.phase === "lost" ? 0 : s.progress, perfect: s.phase === "lost" ? 0 : s.perfect, lengths: s.phase === "lost" ? [] : s.bridges.map(p => p.length) }; },
    restore(v) {
      if (!v || !Number.isInteger(v.progress) || v.progress < 0 || v.progress > 10 || !Number.isInteger(v.perfect) || v.perfect < 0 || v.perfect > v.progress || !Array.isArray(v.lengths) || v.lengths.length !== v.progress) return false;
      for (let i = 0; i < v.progress; i++) { const n = v.lengths[i], tip = platforms[i].x + platforms[i].w + n, t = platforms[i + 1]; if (!Number.isFinite(n) || n < 0 || n > 390 || tip < t.x + 2 || tip > t.x + t.w - 2) return false; }
      s.progress = v.progress; s.perfect = v.perfect; s.bridges = v.lengths.map((length, i) => ({ x: platforms[i].x + platforms[i].w, length })); setup(); s.camera = Math.max(0, s.player.x - 220);
      if (s.progress === 10) { s.phase = "won"; s.mode = "complete"; } return true;
    },
  };
  return createOneButtonSession(s, hooks, options);
}
export function paintBridge() {}
