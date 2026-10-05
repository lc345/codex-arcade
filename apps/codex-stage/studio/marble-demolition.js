import { Matter } from "../vendor/matter.js";
import { createVarietySession } from "./variety-session.js";

export function createDemolitionWorld(options = {}) {
  const { Engine, Bodies, Body, Composite, Events } = Matter, engine = Engine.create({ gravity: { x: 0, y: 0 } });
  const s = { id: "marble-demolition", goal: 3, chapter: 0, modules: [], blocks: [], balls: [], sparks: [], bolts: [], aim: { x: 470, y: 220 }, dragging: false, selected: 0, combo: 0, maxCombo: 0 };
  let blocks = [], balls = [], queue = [], elapsed = 0, entry, hits = [], pending = false;
  const clone = v => JSON.parse(JSON.stringify(v));
  function layout(n) { const result = []; for (let row = 0; row < 3 + n; row++) for (let col = 0; col < 5; col++) result.push({ x: 356 + col * 62 + (row % 2 ? 15 : -15), y: 142 + row * 42, hp: row === 0 && n > 0 ? 2 : 1, metal: (row + col) % 3 === 0 }); return result; }
  function build(hp) {
    Composite.clear(engine.world, false); Engine.clear(engine); balls = []; queue = []; hits = []; s.balls = []; s.sparks = []; s.bolts = []; s.combo = 0; elapsed = 0;
    s.blocks = layout(s.chapter).map((p, i) => ({ ...p, hp: hp?.[i] ?? p.hp, maxHp: p.hp, index: i }));
    blocks = s.blocks.map(p => { const b = Bodies.rectangle(p.x, p.y, 49, 31, { isStatic: true, restitution: 1, friction: 0 }); b.plugin.stage = { kind: "block", index: p.index }; if (p.hp) Composite.add(engine.world, b); return b; });
    Composite.add(engine.world, [Bodies.rectangle(183, 265, 14, 460, { isStatic: true, restitution: 1, friction: 0 }), Bodies.rectangle(777, 265, 14, 460, { isStatic: true, restitution: 1, friction: 0 }), Bodies.rectangle(480, 91, 600, 16, { isStatic: true, restitution: 1, friction: 0 })]);
    for (const [x, y] of [[262, 225], [698, 225], [290, 365], [670, 365]]) Composite.add(engine.world, Bodies.circle(x, y, 17, { isStatic: true, restitution: 1, friction: 0 }));
    s.mode = "aim"; s.phase = "playing"; s.dragging = false; pending = false; entry = null;
  }
  function stage(n) { s.chapter = n; s.shots = 7; s.aim = { x: 470, y: 220 }; build(); }
  function save() { return entry && s.mode === "flight" ? clone(entry) : { chapter: s.chapter, modules: s.modules.slice(), shots: s.shots, hp: s.blocks.map(p => p.hp), mode: s.mode === "upgrade" ? "upgrade" : s.phase === "won" ? "won" : "aim" }; }
  function addBall(x, y, vx, vy, child = false) { if (balls.length >= 18) return; const b = Bodies.circle(x, y, child ? 5 : 7, { restitution: 1, friction: 0, frictionAir: 0, density: .002 }); b.plugin.stage = { kind: "ball", child, split: false, hitAt: new Map() }; Body.setVelocity(b, { x: vx, y: vy }); balls.push(b); Composite.add(engine.world, b); }
  function damage(i, emit, chain = false) {
    const p = s.blocks[i]; if (!p?.hp) return; p.hp--; s.combo++; s.maxCombo = Math.max(s.maxCombo, s.combo); s.sparks.push({ x: p.x, y: p.y, life: 430, metal: p.metal }); emit(chain ? "electric" : "hit");
    if (!p.hp) Composite.remove(engine.world, blocks[i]);
  }
  Events.on(engine, "collisionStart", event => { for (const pair of event.pairs) { const a = pair.bodyA, b = pair.bodyB; if (a.plugin.stage?.kind === "ball" && b.plugin.stage?.kind === "block") hits.push([a, b.plugin.stage.index]); if (b.plugin.stage?.kind === "ball" && a.plugin.stage?.kind === "block") hits.push([b, a.plugin.stage.index]); } });
  function launch(emit) { if (s.mode !== "aim" || !s.shots) return false; entry = save(); s.shots--; s.mode = "flight"; s.combo = 0; elapsed = 0; const dx = s.aim.x - 480, dy = Math.min(-80, s.aim.y - 468), d = Math.hypot(dx, dy); queue = [0, 90, 180, 270, 360].map(at => ({ at, vx: dx / d * 11, vy: dy / d * 11 })); emit("launch"); return true; }
  const h = {
    reset(all) { if (all || s.phase === "won") { s.modules = []; s.maxCombo = 0; stage(0); } else stage(s.chapter); },
    primary(emit) { if (s.phase === "won") { h.reset(true); return true; } if (s.phase === "lost") { stage(s.chapter); return true; } if (s.mode === "upgrade") return choose(s.selected, emit); return launch(emit); },
    pointer(type, x, y, emit) {
      const inside = x >= 184 && x <= 776 && y >= 98 && y <= 489;
      if (type === "down") { if (!inside || !["aim", "upgrade"].includes(s.mode)) return false; pending = true; if (s.mode === "aim") { s.dragging = true; s.aim = { x, y: Math.min(385, y) }; } else s.selected = x < 480 ? 0 : 1; return true; }
      if (type === "move" && pending && s.mode === "aim") { s.aim = { x: Math.max(200, Math.min(760, x)), y: Math.max(100, Math.min(385, y)) }; return true; }
      if (type === "up" && pending) { pending = false; s.dragging = false; if (!inside) return false; return s.mode === "upgrade" ? choose(s.selected, emit) : launch(emit); } return false;
    },
    key(key) { if (!key.startsWith("Arrow")) return false; if (s.mode === "upgrade") s.selected = key === "ArrowLeft" ? 0 : 1; else if (s.mode === "aim") s.aim.x = Math.max(205, Math.min(755, s.aim.x + (key === "ArrowLeft" ? -16 : key === "ArrowRight" ? 16 : 0))); return true; },
    cancel() { pending = false; s.dragging = false; }, enabled: () => s.mode !== "flight",
    update(dt, emit) {
      for (const p of s.sparks) p.life -= dt; s.sparks = s.sparks.filter(p => p.life > 0).slice(-60); for (const p of s.bolts) p.life -= dt; s.bolts = s.bolts.filter(p => p.life > 0).slice(-24);
      if (s.mode !== "flight") return; elapsed += dt;
      while (queue.length && elapsed >= queue[0].at) { const q = queue.shift(); addBall(480, 465, q.vx, q.vy); }
      Engine.update(engine, dt);
      for (const [ball, i] of hits.splice(0)) {
        const data = ball.plugin.stage, last = data.hitAt.get(i) ?? -1000; if (elapsed - last < 90 || !s.blocks[i].hp) continue; data.hitAt.set(i, elapsed); damage(i, emit); if (s.modules.includes("heavy")) damage(i, emit);
        const p = s.blocks[i];
        if (s.modules.includes("charge") && p.metal) for (const other of s.blocks.filter(b => b.hp && Math.hypot(p.x - b.x, p.y - b.y) < 105).slice(0, 3)) { s.bolts.push({ x: p.x, y: p.y, tx: other.x, ty: other.y, life: 250 }); damage(other.index, emit, true); }
        if (s.modules.includes("split") && !data.child && !data.split) { data.split = true; for (const sign of [-1, 1]) addBall(p.x + sign * 30, p.y + 24, sign * 6.5, 7.5, true); emit("split"); }
      }
      for (const b of balls) { const speed = Math.hypot(b.velocity.x, b.velocity.y); if (speed < 9 || speed > 12) Body.setVelocity(b, { x: b.velocity.x / (speed || 1) * 11, y: (Math.abs(b.velocity.y) < .3 ? 1.2 : b.velocity.y) / (speed || 1) * 11 }); }
      balls = balls.filter(b => { if (b.position.y > 498 || elapsed > 3300) { Composite.remove(engine.world, b); return false; } return true; });
      s.balls = balls.map(b => ({ x: b.position.x, y: b.position.y, child: b.plugin.stage.child, vx: b.velocity.x, vy: b.velocity.y }));
      if (s.blocks.every(p => !p.hp)) { for (const b of balls) Composite.remove(engine.world, b); balls = []; queue = []; s.balls = []; entry = null; s.mode = s.chapter === 2 ? "complete" : "upgrade"; s.phase = s.chapter === 2 ? "won" : "playing"; s.selected = 0; emit("win"); }
      else if (!balls.length && !queue.length) { entry = null; s.mode = s.shots ? "aim" : "lost"; s.phase = s.shots ? "playing" : "lost"; if (!s.shots) emit("fail"); }
    },
    sync() { s.destroyed = s.blocks.filter(b => !b.hp).length; s.progress = s.chapter + (["upgrade", "complete"].includes(s.mode) ? 1 : 0); s.score = s.chapter * 1000 + s.destroyed * 40; s.primaryLabel = s.mode === "upgrade" ? "装上模块" : "发射"; s.offers = s.modules.includes("split") ? ["charge", "heavy"] : s.modules.includes("charge") ? ["split", "heavy"] : ["split", "charge"]; s.status = s.mode === "upgrade" ? "街区清空 · 选择下一发的组合" : s.phase === "won" ? "三个街区清空。组合，拆得更漂亮。" : s.phase === "lost" ? "弹珠用完了 · 重试本街区，保留模块" : `${s.chapter + 1} / 3 街区 · ${s.destroyed} / ${s.blocks.length} 清除 · 剩余 ${s.shots} 发 · 连击 ${s.combo}`; },
    save,
    restore(v) { if (!v || !Number.isInteger(v.chapter) || v.chapter < 0 || v.chapter > 2 || !Array.isArray(v.modules) || v.modules.length !== v.chapter || !v.modules.every(x => ["split", "charge", "heavy"].includes(x)) || new Set(v.modules).size !== v.modules.length || !Number.isInteger(v.shots) || v.shots < 0 || v.shots > 7 || !["aim", "upgrade", "won"].includes(v.mode)) return false;
      const ls = layout(v.chapter); if (!Array.isArray(v.hp) || v.hp.length !== ls.length || !v.hp.every((hp, i) => Number.isInteger(hp) && hp >= 0 && hp <= ls[i].hp)) return false;
      const clear = v.hp.every(x => !x); if (clear !== (v.mode !== "aim") || v.mode === "won" && v.chapter !== 2 || v.mode === "upgrade" && v.chapter === 2) return false;
      s.chapter = v.chapter; s.modules = v.modules.slice(); s.shots = v.shots; build(v.hp); s.mode = v.mode === "won" ? "complete" : v.mode; s.phase = v.mode === "won" ? "won" : !s.shots && !clear ? "lost" : "playing"; return true;
    }, destroy() { Events.off(engine); Composite.clear(engine.world, false); Engine.clear(engine); },
  };
  function choose(index, emit) { if (s.mode !== "upgrade" || ![0, 1].includes(index)) return false; s.modules.push(s.offers[index]); stage(s.chapter + 1); emit("upgrade"); return true; }
  const api = createVarietySession(s, h, options);
  return api;
}
export function paintDemolition() {}
