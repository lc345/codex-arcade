import { Matter } from "../vendor/matter.js";

export function createToastWorld({ checkpoint: saved, onEvent = () => {} } = {}) {
  const { Engine, Bodies, Body, Composite, Query } = Matter, dt = 1000 / 120;
  const engine = Engine.create({ gravity: { x: 0, y: 1.5 }, positionIterations: 8, velocityIterations: 8 });
  const specs = [[120, 370, 158], [330, 370, 94], [565, 344, 76], [755, 386, 62], [980, 362, 48, 16, 2400], [1220, 325, 56], [1410, 382, 38, 18, 2900], [1640, 345, 50], [1840, 378, 34, 22, 2300], [2065, 342, 30, 16, 2800], [2310, 365, 64]];
  const scene = { id: "toast-hop", level: 0, phase: "playing", mode: "ready", time: 0, score: 0, progress: 0, goal: 10,
    index: 0, best: 0, attempt: 1, deaths: 0, charge: 0, awaiting: true, player: {}, platforms: [], camera: 0,
    primaryLabel: "蓄力", secondaryLabel: "", abilityAvailable: false, status: "早餐还没落地", failure: "", lastMiss: null,
    flight: 0, impact: 0, landing: 0, perfect: 0, crumbs: [], trail: [], miss: null, deadTime: 0 };
  const platforms = specs.map(([x, y, w]) => Bodies.rectangle(x, y + 12, w, 24, { isStatic: true, friction: 0, restitution: 0 }));
  const toast = Bodies.rectangle(120, 351, 26, 38, { friction: 0, frictionAir: 0, restitution: 0, inertia: Infinity });
  Composite.add(engine.world, [...platforms, toast]); Body.setStatic(toast, true);
  let active = true, accumulator = 0, owner = null, crossed = false;
  const emit = name => { if (active) onEvent({ type: `toast-${name}` }); };
  const positionAt = (i, t) => specs[i][0] + (specs[i][3] || 0) * Math.sin(t / (specs[i][4] || 1) * Math.PI * 2);
  function placePlatforms() { platforms.forEach((b, i) => Body.setPosition(b, { x: positionAt(i, scene.time), y: specs[i][1] + 12 })); }
  function sync() {
    scene.player = { x: toast.position.x, y: toast.position.y, vx: toast.velocity.x, vy: toast.velocity.y };
    scene.platforms = specs.map(([x, y, w, amp = 0], i) => ({ x: platforms[i].position.x, y, w, amp, id: i, kind: i % 4 }));
    scene.progress = scene.index; scene.score = scene.index * 100 + scene.perfect * 25;
    scene.primaryLabel = scene.phase === "won" ? "再来一份" : scene.phase === "lost" ? "再来" : scene.mode === "charging" ? "起跳" : "蓄力";
    scene.status = scene.phase === "won" ? "十跳全过，早餐保住了。" : scene.phase === "lost" ? scene.failure : scene.mode === "charging" ? "吐司压扁了" : scene.mode === "flight" ? "这一跳，交给惯性" : `${scene.index} / 10 · 最远 ${scene.best} · 摔了 ${scene.deaths} 次`;
  }
  function crumbs(x, y, n = 14) { for (let i = 0; i < n; i++) scene.crumbs.push({ x, y, vx: Math.cos(i * 2.399) * (45 + i * 5), vy: -80 - (i % 5) * 20, life: .7, angle: i }); if (scene.crumbs.length > 60) scene.crumbs.splice(0, scene.crumbs.length - 60); }
  function reset(count = true) {
    const { best, attempt, deaths, lastMiss } = scene;
    Object.assign(scene, { phase: "playing", mode: "ready", time: 0, index: 0, charge: 0, awaiting: true, camera: 0, flight: 0, impact: 0, landing: 0, perfect: 0, failure: "", crumbs: [], trail: [], miss: null, deadTime: 0, best, deaths, lastMiss, attempt: Math.min(99999, attempt + Number(count)) });
    Body.setStatic(toast, true); Body.setPosition(toast, { x: 120, y: 351 }); Body.setVelocity(toast, { x: 0, y: 0 }); toast.collisionFilter.mask = 0xffffffff;
    Engine.clear(engine); accumulator = 0; owner = null; crossed = false; placePlatforms(); sync();
  }
  function begin(source) {
    if (!active || owner !== null) return false;
    if (scene.phase !== "playing") reset();
    if (scene.mode !== "ready") return false;
    owner = source; scene.mode = "charging"; scene.charge = 0; scene.awaiting = false; emit("press"); sync(); return true;
  }
  function release(source) {
    if (!active || scene.mode !== "charging" || owner !== source) return false;
    owner = null; scene.mode = "flight"; scene.flight = 0; scene.miss = null; crossed = false;
    Body.setStatic(toast, false); Body.setInertia(toast, Infinity); Body.setVelocity(toast, { x: 1.5 + scene.charge * 8, y: -9 });
    crumbs(toast.position.x, toast.position.y + 19, 8); emit("jump"); scene.trail = []; sync(); return true;
  }
  function cancel() { owner = null; if (scene.mode === "charging") { scene.mode = "ready"; scene.charge = 0; } sync(); }
  function markMiss(x) {
    if (scene.miss) return;
    const i = scene.index + 1, center = positionAt(i, scene.time), half = specs[i][2] / 2 - 4;
    const side = x < center ? "short" : "long", distance = Math.max(1, Math.round(Math.abs(x - center) - half));
    scene.miss = { index: i, offset: Math.max(-600, Math.min(600, x - center)), side, distance: Math.min(999, distance), charge: scene.charge };
  }
  function fail() {
    if (scene.phase !== "playing") return;
    markMiss(toast.position.x); scene.lastMiss = { ...scene.miss }; scene.deaths = Math.min(99999, scene.deaths + 1);
    scene.phase = "lost"; scene.mode = "crumbs"; scene.deadTime = 0; scene.impact = 1;
    scene.failure = `${scene.lastMiss.side === "short" ? "短了" : "过了"} ${scene.lastMiss.distance} px`;
    crumbs(toast.position.x, Math.min(478, toast.position.y), 24); emit("fall"); sync();
  }
  function land(i) {
    const error = Math.abs(toast.position.x - platforms[i].position.x);
    Body.setStatic(toast, true); Body.setPosition(toast, { x: toast.position.x, y: specs[i][1] - 19 }); Body.setVelocity(toast, { x: 0, y: 0 });
    scene.index = i; scene.best = Math.max(scene.best, i); scene.mode = "ready"; scene.charge = 0; scene.landing = 1; scene.impact = .35;
    if (error < 7) scene.perfect++; crumbs(toast.position.x, toast.position.y + 19, 9); emit(error < 7 ? "perfect" : "land");
    if (i === 10) { scene.phase = "won"; scene.mode = "served"; emit("win"); }
    sync();
  }
  function update() {
    if (scene.awaiting || scene.phase === "won") return;
    scene.time += dt;
    scene.impact *= .91; scene.landing *= .88;
    for (const p of scene.crumbs) { p.life -= dt / 1000; p.x += p.vx * dt / 1000; p.y += p.vy * dt / 1000; p.vy += dt * .6; p.angle += .05; }
    scene.crumbs = scene.crumbs.filter(p => p.life > 0);
    if (scene.phase === "lost") { scene.deadTime += dt; if (scene.deadTime >= 380) reset(); return; }
    const oldPlatform = platforms[scene.index].position.x; placePlatforms();
    if (["ready", "charging"].includes(scene.mode)) {
      Body.translate(toast, { x: platforms[scene.index].position.x - oldPlatform, y: 0 });
      if (scene.mode === "charging") scene.charge = Math.min(1, scene.charge + dt / 900);
    } else {
      scene.flight += dt; const before = { ...toast.position }, descending = toast.velocity.y >= 0;
      Engine.update(engine, dt); const p = toast.position, next = scene.index + 1, target = platforms[next], top = specs[next][1];
      // Landing requires real contact from above and the body's center safely inside the visible top.
      if (descending && before.y + 19 <= top + 3 && p.y + 19 >= top - 1 && Query.collides(toast, [target]).length && Math.abs(p.x - target.position.x) <= specs[next][2] / 2 - 4) land(next);
      else {
        if (!crossed && descending && p.y + 19 >= top) { crossed = true; markMiss(p.x); }
        if (descending && Query.collides(toast, platforms).length) { markMiss(p.x); toast.collisionFilter.mask = 0; fail(); }
        if (p.y > 500 || p.x > positionAt(next, scene.time) + 430 || scene.flight > 1800) fail();
      }
      scene.trail.push({ x: p.x, y: p.y }); if (scene.trail.length > 14) scene.trail.shift();
    }
    scene.camera += (Math.max(0, Math.min(1690, toast.position.x - 235)) - scene.camera) * .085;
    sync();
  }
  function checkpoint() {
    return { version: 1, phase: scene.phase, mode: scene.mode === "charging" ? "ready" : scene.mode, time: scene.time,
      index: scene.index, best: scene.best, attempt: scene.attempt, deaths: scene.deaths, awaiting: scene.awaiting, flight: scene.flight,
      perfect: scene.perfect, camera: scene.camera, body: [toast.position.x, toast.position.y, toast.velocity.x, toast.velocity.y],
      crossed, mask: toast.collisionFilter.mask !== 0, charge: scene.mode === "flight" ? scene.charge : 0, deadTime: scene.deadTime,
      lastMiss: scene.lastMiss ? { ...scene.lastMiss } : null, miss: scene.miss ? { ...scene.miss } : null };
  }
  function restore(v) {
    const finite = (n, a, b) => Number.isFinite(n) && n >= a && n <= b, integer = (n, a, b) => Number.isInteger(n) && finite(n, a, b);
    const missOK = m => m === null || m && integer(m.index, 1, 10) && finite(m.offset, -600, 600) && ["short", "long"].includes(m.side) && integer(m.distance, 1, 999) && finite(m.charge, 0, 1);
    if (!v || v.version !== 1 || !["ready", "flight", "crumbs", "served"].includes(v.mode) || !["playing", "lost", "won"].includes(v.phase)) return;
    if ((v.phase === "won") !== (v.mode === "served") || (v.phase === "lost") !== (v.mode === "crumbs") || !integer(v.index, 0, 10) || (v.index === 10) !== (v.phase === "won")) return;
    if (!finite(v.time, 0, 1e9) || !finite(v.flight, 0, 1850) || !finite(v.camera, 0, 1690) || !finite(v.deadTime, 0, 400) || !finite(v.charge, 0, 1) || !integer(v.best, v.index, 10) || !integer(v.attempt, 1, 99999) || !integer(v.deaths, 0, 99999) || !integer(v.perfect, 0, v.index)) return;
    if (!Array.isArray(v.body) || v.body.length !== 4 || !finite(v.body[0], 20, 2760) || !finite(v.body[1], 120, 550) || !finite(v.body[2], -1, 11) || !finite(v.body[3], -10, 25) || !missOK(v.lastMiss) || !missOK(v.miss)) return;
    if ([v.awaiting, v.crossed, v.mask].some(b => typeof b !== "boolean") || v.awaiting && (v.mode !== "ready" || v.index !== 0 || v.time !== 0)) return;
    if (["ready", "served"].includes(v.mode) && (Math.abs(v.body[0] - positionAt(v.index, v.time)) > specs[v.index][2] / 2 - 4 || Math.abs(v.body[1] - (specs[v.index][1] - 19)) > 1)) return;
    const cleanMiss = m => m && ({ index: m.index, offset: m.offset, side: m.side, distance: m.distance, charge: m.charge });
    for (const k of ["phase", "mode", "time", "index", "best", "attempt", "deaths", "awaiting", "flight", "perfect", "camera", "deadTime", "charge"]) scene[k] = v[k];
    scene.lastMiss = cleanMiss(v.lastMiss); scene.miss = cleanMiss(v.miss); crossed = v.crossed;
    Body.setStatic(toast, v.mode !== "flight"); if (v.mode === "flight") Body.setInertia(toast, Infinity);
    Body.setPosition(toast, { x: v.body[0], y: v.body[1] }); Body.setVelocity(toast, { x: v.body[2], y: v.body[3] }); toast.collisionFilter.mask = v.mask ? 0xffffffff : 0;
    if (scene.lastMiss) scene.failure = `${scene.lastMiss.side === "short" ? "短了" : "过了"} ${scene.lastMiss.distance} px`; placePlatforms(); sync();
  }
  const api = { scene, effects: [], checkpoint,
    step(ms) { if (!active || !Number.isFinite(ms) || ms <= 0) return; accumulator += Math.min(ms, 50); while (accumulator + 1e-8 >= dt) { accumulator -= dt; update(); } },
    pointer(type, x, y) { if (!active || !Number.isFinite(x + y)) return false;
      const inside = x >= 0 && x <= 960 && y >= 0 && y <= 540;
      if (type === "down") return inside && begin("pointer");
      if (type === "up" && owner === "pointer") { if (!inside) { cancel(); return false; } return release("pointer"); } return false;
    },
    key(key, down) { if (!active || ![" ", "Enter"].includes(key)) return false; if (down) begin("key"); else release("key"); return true; },
    primary() { if (!active) return false; return scene.mode === "charging" && owner === "tap" ? release("tap") : begin("tap"); },
    secondary() { return false; }, cancel() { if (active) cancel(); },
    retry() { if (!active) return false; reset(); return true; }, next() { return api.retry(); }, setLevel(n) { return n === 0 && api.retry(); },
    snapshot() { return { id: scene.id, active, phase: scene.phase, mode: scene.mode, level: 0, time: Math.round(scene.time), score: scene.score, progress: scene.index, goal: 10, best: scene.best, attempt: scene.attempt, deaths: scene.deaths, status: scene.status, primaryLabel: scene.primaryLabel, secondaryLabel: "", abilityAvailable: false, primaryEnabled: scene.mode !== "flight" }; },
    stop() { if (!active) return; cancel(); active = false; }, destroy() { api.stop(); Composite.clear(engine.world, false); Engine.clear(engine); },
  };
  sync(); restore(saved); return api;
}

export function paintToast() {}
