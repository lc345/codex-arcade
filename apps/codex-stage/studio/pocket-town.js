import { createVarietySession } from "./variety-session.js";

export function createTownWorld(options = {}) {
  const deck = Array.from({ length: 3 }, () => ["home", "park", "home", "market", "rail"]).flat();
  const names = { home: "住宅", park: "花园", market: "商店", rail: "铁道" };
  const s = { id: "pocket-town", goal: 3, cells: [], log: [], turn: 0, cursor: 13, pulse: null, drag: null, homes: 0, shops: 0, rails: 0 };
  let pending = null;
  const neighbors = i => [i % 5 ? i - 1 : -1, i % 5 < 4 ? i + 1 : -1, i >= 5 ? i - 5 : -1, i < 20 ? i + 5 : -1].filter(n => n >= 0);
  function assess(cells) {
    const homes = [], shops = [], rail = [12], todo = [12];
    cells.forEach((p, i) => { if (p?.type === "home" && neighbors(i).some(n => cells[n]?.type === "park")) homes.push(i); if (p?.type === "market" && neighbors(i).filter(n => cells[n]?.type === "home").length >= 2) shops.push(i); });
    while (todo.length) for (const n of neighbors(todo.shift())) if (cells[n]?.type === "rail" && !rail.includes(n)) { rail.push(n); todo.push(n); }
    return { homes, shops, rail: rail.slice(1) };
  }
  function refresh() {
    const a = assess(s.cells); s.homes = a.homes.length; s.shops = a.shops.length; s.rails = a.rail.length; s.lit = a; s.progress = Number(s.homes >= 6) + Number(s.shops >= 3) + Number(s.rails >= 3); s.score = s.homes * 30 + s.shops * 60 + s.rails * 20;
    s.turn = s.log.length; s.nextTile = deck[s.turn] ?? null; s.phase = s.turn === 15 && s.progress === 3 ? "won" : "playing"; s.mode = s.phase === "won" ? "complete" : s.turn === 15 ? "review" : "build";
    s.available = s.cells.map((p, i) => !p && neighbors(i).some(n => s.cells[n]) && s.turn < 15 ? i : -1).filter(i => i >= 0);
    s.primaryLabel = s.phase === "won" ? "另建一座" : s.mode === "review" ? "撤回一块" : `放置${names[s.nextTile]}`; s.secondaryLabel = "撤销"; s.abilityAvailable = s.turn > 0;
    s.status = `亮灯住宅 ${s.homes}/6 · 开门商店 ${s.shops}/3 · 连通铁道 ${s.rails}/3${s.mode === "review" ? " · 可撤销重新布局" : ""}`;
  }
  function place(i, emit = () => {}) { if (!Number.isInteger(i) || !s.available.includes(i) || !s.nextTile) return false; s.cells[i] = { type: s.nextTile }; s.log.push(i); s.cursor = i; s.pulse = { cell: i, at: s.time }; refresh(); emit(s.phase === "won" ? "win" : "build"); return true; }
  function undo(emit) { if (!s.log.length) return false; s.cells[s.log.pop()] = null; s.pulse = null; refresh(); emit("undo"); return true; }
  function cell(x, y) { const col = Math.floor((x - 235) / 98), row = Math.floor((y - 110) / 68); return col >= 0 && col < 5 && row >= 0 && row < 5 ? row * 5 + col : -1; }
  const h = {
    reset() { s.cells = Array(25).fill(null); s.cells[12] = { type: "port" }; s.log = []; s.turn = 0; s.cursor = 13; s.pulse = null; s.time = 0; refresh(); },
    primary(emit) { if (s.phase === "won") { h.reset(); return true; } if (s.mode === "review") return undo(emit); return place(s.available.includes(s.cursor) ? s.cursor : s.available[0], emit); }, secondary: undo,
    pointer(type, x, y, emit) { if (type === "down") { const i = cell(x, y); if (!s.available.includes(i)) return false; pending = i; s.cursor = i; return true; } if (type === "up" && pending !== null) { const i = pending; pending = null; return cell(x, y) === i && place(i, emit); } return false; },
    key(key) { if (!key.startsWith("Arrow")) return false; s.cursor = Math.max(0, Math.min(24, s.cursor + (key === "ArrowLeft" ? -1 : key === "ArrowRight" ? 1 : key === "ArrowUp" ? -5 : 5))); return true; }, cancel() { pending = null; },
    sync: refresh, save() { return { log: s.log.slice() }; },
    restore(v) { if (!v || !Array.isArray(v.log) || v.log.length > 15 || !v.log.every(i => Number.isInteger(i) && i >= 0 && i < 25)) return false; h.reset(); for (const i of v.log) if (!place(i)) { h.reset(); return false; } s.pulse = null; return true; },
  };
  const api = createVarietySession(s, h, options); api.place = i => { if (!api.snapshot().active) return false; return place(i, type => options.onEvent?.({ type: `variety-${type}` })); }; api.assess = assess; return api;
}
export function paintTown() {}
