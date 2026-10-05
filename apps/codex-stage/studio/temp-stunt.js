import { Matter } from "../vendor/matter.js";

// The pack builder serializes this factory with the reviewed local Matter runtime.
export function createStuntWorld(options = {}) {
  const { Engine, Bodies, Body, Composite, Constraint, Query } = Matter;
  const dt = 1000 / 120, start = { x: 145, y: 326 }, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const engine = Engine.create({ gravity: { x: 0, y: .85 }, positionIterations: 8, velocityIterations: 8, constraintIterations: 5 });
  const scene = { id: "temp-stunt", level: 0, phase: "playing", mode: "ready", time: 0, flightTime: 0, score: 0, progress: 0, goal: 1,
    take: 1, aim: { x: 74, y: -33 }, player: {}, limbs: [], anchors: [{ id: 0, x: 430, y: 114, available: false }, { id: 1, x: 660, y: 142, available: false }],
    attached: null, catches: 0, bounced: false, landed: 0, gate: 178, best: 0, broken: 0, stunts: [], particles: [], trail: [], hit: 0,
    panes: Array.from({ length: 5 }, (_, i) => ({ x: 515, y: 182 + i * 44, w: 9, h: 42, broken: false })),
    status: "办公室最后一镜", primaryLabel: "开拍", secondaryLabel: "慢镜头", slow: false, abilityAvailable: true,
    tutorialSeen: false, challenge: 0, challengePassed: false, badges: [false, false, false], failure: "", metrics: [145, 326, 0, 0],
  };
  const floor = Bodies.rectangle(121, 461, 266, 62, { isStatic: true, friction: .8 });
  const landing = Bodies.rectangle(856, 456, 162, 52, { isStatic: true, friction: .75, restitution: .08 });
  const back = Bodies.rectangle(943, 325, 20, 262, { isStatic: true, friction: .1, restitution: .25 });
  const ceiling = Bodies.rectangle(855, 185, 178, 20, { isStatic: true });
  const copier = Bodies.rectangle(352, 440, 94, 26, { isStatic: true, restitution: .4 });
  const lintel = Bodies.rectangle(515, 139, 32, 32, { isStatic: true, restitution: .4 });
  const sill = Bodies.rectangle(515, 406, 32, 14, { isStatic: true, restitution: .25 });
  const gate = Bodies.rectangle(779, 120, 18, 220, { isStatic: true, friction: .05, restitution: .5 });
  const staticBodies = [floor, landing, back, ceiling, copier, lintel, sill, gate];
  const panes = scene.panes.map(p => Bodies.rectangle(p.x, p.y, p.w, p.h, { isStatic: true, restitution: .25 }));
  const specs = [
    ["torso", 0, 0, 27, 36], ["head", 0, -31, 27, 27],
    ["upperL", -20, -3, 11, 24], ["lowerL", -23, 19, 10, 23],
    ["upperR", 20, -3, 11, 24], ["lowerR", 23, 19, 10, 23],
    ["thighL", -9, 30, 13, 26], ["shinL", -9, 55, 12, 27],
    ["thighR", 9, 30, 13, 26], ["shinR", 9, 55, 12, 27],
  ];
  const rag = specs.map(([name, x, y, w, h]) => {
    const b = Bodies.rectangle(start.x + x, start.y + y, w, h, { chamfer: { radius: Math.min(w / 2 - 1, 7) }, label: name, friction: .38, frictionAir: .003, restitution: .2, collisionFilter: { group: -7 } });
    Body.setMass(b, name === "torso" ? 2.4 : name === "head" ? 1 : .38); return b;
  });
  const torso = rag[0];
  const joints = [[0, 1, 0, -18, 0, 13], [0, 2, -14, -10, 0, -10], [2, 3, 0, 12, 0, -11], [0, 4, 14, -10, 0, -10], [4, 5, 0, 12, 0, -11], [0, 6, -9, 17, 0, -13], [6, 7, 0, 13, 0, -13], [0, 8, 9, 17, 0, -13], [8, 9, 0, 13, 0, -13]].map(([a, b, ax, ay, bx, by]) => Constraint.create({ bodyA: rag[a], bodyB: rag[b], pointA: { x: ax, y: ay }, pointB: { x: bx, y: by }, length: 1, stiffness: .88, damping: .07 }));
  Composite.add(engine.world, [...staticBodies, ...panes, ...rag, ...joints]);
  let active = true, accumulator = 0, rope = null, dragging = false, heldKey = false, lastImpact = -1000, bounceCooldown = 0;
  const emit = type => { if (active) options.onEvent?.({ type: `stunt-${type}` }); };
  const dist = a => Math.hypot(a.x - torso.position.x, a.y - torso.position.y);
  const failures = { short: "没能越过窗框，下一条试着增加力度。", high: "飞过了窗框上沿，下一条把仰角放低一些。", gate: "撞到了电梯挡板，可以挂住吊灯等开口。", landing: "接触落垫时速度较大，试着挂绳减速再松手。", glass: "绕过了道具玻璃，本镜需要真正穿窗。", miss: "穿窗后没落进电梯，试着调整松绳时机。", timeout: "停在了半路，换个角度或借复印机再弹一次。" };
  function burst(x, y, kind, n = 14) {
    for (let i = 0; i < n; i++) { const a = i * 2.399; scene.particles.push({ x, y, vx: Math.cos(a) * (50 + i * 7), vy: -90 + Math.sin(a) * 70, life: .9, kind, angle: i }); }
    if (scene.particles.length > 100) scene.particles.splice(0, scene.particles.length - 100);
  }
  function sync() {
    scene.player = { x: torso.position.x, y: torso.position.y, vx: torso.velocity.x, vy: torso.velocity.y, angle: torso.angle };
    scene.limbs = rag.map((b, i) => ({ name: specs[i][0], x: b.position.x, y: b.position.y, angle: b.angle, w: specs[i][3], h: specs[i][4] }));
    for (const a of scene.anchors) a.available = scene.mode === "flight" && scene.phase === "playing" && scene.catches < 3 && dist(a) < 340 && dist(a) > 35 && !Query.ray([lintel, ceiling, back], torso.position, a).length;
    scene.primaryLabel = scene.mode === "ready" || scene.mode === "aiming" ? "开拍" : scene.attached !== null ? "松绳" : "抓吊灯";
    scene.secondaryLabel = scene.slow ? "正常速度" : "慢镜头";
    scene.abilityAvailable = true;
    scene.status = scene.phase === "won" ? scene.challenge && !scene.challengePassed ? "这条过了！可选挑战未达成，还可以再拍。" : "这条过了！替身安全落位" : scene.phase === "lost" ? failures[scene.failure] || failures.miss : scene.mode === "ready" || scene.mode === "aiming" ? `本镜目标：穿过道具玻璃，落进电梯${scene.challenge ? ` · 挑战：${["", "不用吊灯", "复印机救场", "轻拿轻放（最多两块玻璃）"][scene.challenge]}` : ""}` : scene.attached !== null ? "安全绳已挂住，等待合适的松手时机" : scene.broken ? "玻璃已穿过 · 电梯落位" : "拍摄中 · 道具玻璃尚未穿过";
  }
  function detach() { if (!rope) return false; Composite.remove(engine.world, rope); rope = null; scene.attached = null; return true; }
  function finish(win) {
    if (scene.phase !== "playing") return;
    detach(); scene.phase = win ? "won" : "lost"; scene.mode = win ? "wrap" : "cut";
    if (win) { scene.progress = 1; scene.score += 600 + (scene.bounced ? 150 : 0) + (scene.catches ? 100 : 0); scene.best = Math.max(scene.best, scene.score); burst(torso.position.x, torso.position.y, "confetti", 25);
      const earned = [scene.catches === 0, scene.bounced, scene.broken <= 2]; scene.badges = scene.badges.map((b, i) => b || earned[i]); scene.challengePassed = scene.challenge === 0 || earned[scene.challenge - 1];
    } else scene.failure = scene.metrics[2] ? "gate" : scene.metrics[3] > 8 ? "landing" : scene.metrics[0] < 470 ? "short" : scene.metrics[1] < 80 ? "high" : !scene.broken ? "glass" : scene.flightTime > 14000 ? "timeout" : "miss";
    emit(win ? "win" : "cut"); sync();
  }
  function reset() {
    detach(); Composite.clear(engine.world, false); Engine.clear(engine);
    Object.assign(scene, { phase: "playing", mode: "ready", time: 0, flightTime: 0, score: 0, progress: 0, catches: 0, bounced: false, landed: 0, gate: 178, broken: 0, stunts: [], particles: [], trail: [], hit: 0, challengePassed: false, failure: "", metrics: [145, 326, 0, 0] });
    scene.panes.forEach(p => { p.broken = false; });
    rag.forEach((b, i) => { Body.setAngle(b, 0); Body.setPosition(b, { x: start.x + specs[i][1], y: start.y + specs[i][2] }); Body.setVelocity(b, { x: 0, y: 0 }); Body.setAngularVelocity(b, 0); b.force.x = b.force.y = 0; b.torque = 0; b.positionImpulse.x = b.positionImpulse.y = 0; b.constraintImpulse.x = b.constraintImpulse.y = b.constraintImpulse.angle = 0; });
    Composite.add(engine.world, [...staticBodies, ...panes, ...rag, ...joints]);
    engine.timing.timestamp = 0; accumulator = 0; bounceCooldown = 0; lastImpact = -1000; dragging = heldKey = false; sync();
  }
  function launch() {
    if (!active || scene.phase !== "playing" || !["ready", "aiming"].includes(scene.mode)) return false;
    const a = scene.aim; if (Math.hypot(a.x, a.y) < 10) { scene.mode = "ready"; dragging = false; return false; }
    scene.mode = "flight"; dragging = false; scene.flightTime = 0; scene.tutorialSeen = true;
    rag.forEach((b, i) => { Body.setVelocity(b, { x: a.x * .17, y: a.y * .17 }); Body.setAngularVelocity(b, (i % 2 ? -1 : 1) * .025); });
    burst(start.x, start.y + 65, "dust", 10); emit("launch"); sync(); return true;
  }
  function attach(id) {
    if (!active || scene.phase !== "playing" || scene.mode !== "flight" || rope) return false;
    const a = scene.anchors.find(a => a.id === id); if (!a?.available) return false;
    scene.attached = id; scene.catches++;
    rope = Constraint.create({ pointA: { x: a.x, y: a.y }, bodyB: torso, pointB: { x: 0, y: -12 }, length: dist(a), stiffness: .8, damping: .025 });
    Composite.add(engine.world, rope); emit("hook"); sync(); return true;
  }
  function releaseRope() { if (!active || !detach()) return false; emit("release"); sync(); return true; }
  function update() {
    if (scene.phase !== "playing") return;
    scene.time += dt;
    if (scene.mode !== "flight") return;
    scene.flightTime += dt; bounceCooldown = Math.max(0, bounceCooldown - dt);
    // A slow practical shutter has a real body: its visible bottom matches collision geometry.
    scene.gate = 198 + Math.max(0, Math.sin((scene.flightTime - 1500) / 1150)) * 173;
    Body.setPosition(gate, { x: 779, y: scene.gate - 110 });
    if (rope) {
      const a = scene.anchors[scene.attached];
      rope.length = Math.max(125, rope.length - .42);
      rope.stiffness = dist(a) >= rope.length - 2 ? .86 : 0;
      if (torso.position.x < a.x) Body.applyForce(torso, torso.position, { x: .0036, y: 0 });
    }
    for (let i = 0; i < panes.length; i++) if (!scene.panes[i].broken && rag.some(b => b.speed > 2.8 && Query.collides(b, [panes[i]]).length)) {
      scene.panes[i].broken = true; scene.broken++; scene.score += 60; Composite.remove(engine.world, panes[i]);
      burst(515, scene.panes[i].y, "glass", 14); scene.hit = 1; emit("glass");
      if (!scene.stunts.includes("glass")) scene.stunts.push("glass");
    }
    if (!bounceCooldown && torso.velocity.y > 1.1 && rag.some(b => Query.collides(b, [copier]).length)) {
      rag.forEach(b => Body.setVelocity(b, { x: Math.max(b.velocity.x, 7.5), y: -10.8 }));
      bounceCooldown = 900; scene.bounced = true; if (!scene.stunts.includes("copier")) scene.stunts.push("copier");
      burst(352, 420, "paper", 18); emit("bounce");
    }
    const speed = torso.speed;
    if (rag.some(b => Query.collides(b, [gate]).length)) scene.metrics[2] = 1;
    if (rag.some(b => Query.collides(b, [landing]).length)) scene.metrics[3] = Math.max(scene.metrics[3], Math.abs(torso.velocity.y));
    Engine.update(engine, dt);
    for (const b of rag) if (b.speed > 24) Body.setVelocity(b, { x: clamp(b.velocity.x, -22, 22), y: clamp(b.velocity.y, -22, 22) });
    if (speed - torso.speed > 3 && scene.time - lastImpact > 240) { lastImpact = scene.time; scene.hit = .7; emit("thud"); }
    const p = torso.position;
    scene.metrics[0] = Math.max(scene.metrics[0], p.x); scene.metrics[1] = Math.min(scene.metrics[1], p.y);
    if (scene.broken && p.x > 799 && p.x < 925 && p.y > 378 && p.y < 442 && Math.abs(torso.velocity.y) < 2 && rag.some(b => Query.collides(b, [landing]).length)) scene.landed += dt;
    else scene.landed = 0;
    if (scene.landed >= 250) finish(true);
    else if (p.y > 610 || p.x < -95 || p.x > 1070 || p.y < -170 || scene.flightTime > 14000) finish(false);
    scene.trail.push({ x: p.x, y: p.y }); if (scene.trail.length > 18) scene.trail.shift();
    for (const part of scene.particles) { part.life -= dt / 1000; part.x += part.vx * dt / 1000; part.y += part.vy * dt / 1000; part.vy += dt * .35; part.angle += dt * .004; }
    scene.particles = scene.particles.filter(p => p.life > 0); scene.hit *= .91;
    sync();
  }
  function checkpoint() {
    return { version: 1, mode: scene.mode === "aiming" ? "ready" : scene.mode, phase: scene.phase, time: scene.time, flightTime: scene.flightTime,
      take: scene.take, best: scene.best, score: scene.score, catches: scene.catches, bounced: scene.bounced, landed: scene.landed, slow: scene.slow,
      panes: scene.panes.map(p => p.broken), aim: [scene.aim.x, scene.aim.y],
      rope: rope ? [scene.attached, rope.length] : null,
      limbs: rag.map(b => [b.position.x, b.position.y, b.angle, b.velocity.x, b.velocity.y, b.angularVelocity]), bounceCooldown,
      tutorialSeen: scene.tutorialSeen, challenge: scene.challenge, badges: scene.badges.slice(), failure: scene.failure, metrics: scene.metrics.slice() };
  }
  function restore(v) {
    if (!v || typeof v !== "object" || v.version !== 1 || !["ready", "flight", "wrap", "cut"].includes(v.mode) || !["playing", "won", "lost"].includes(v.phase)) return;
    if ((v.phase === "won") !== (v.mode === "wrap") || (v.phase === "lost") !== (v.mode === "cut")) return;
    if (!Array.isArray(v.limbs) || v.limbs.length !== 10 || !v.limbs.every(a => Array.isArray(a) && a.length === 6 && a.every(Number.isFinite) && a[0] >= -150 && a[0] <= 1150 && a[1] >= -250 && a[1] <= 730 && Math.abs(a[2]) < 1000 && Math.abs(a[3]) <= 30 && Math.abs(a[4]) <= 30 && Math.abs(a[5]) < 3)) return;
    if (!Array.isArray(v.panes) || v.panes.length !== 5 || !v.panes.every(p => typeof p === "boolean") || !Array.isArray(v.aim) || v.aim.length !== 2 || !v.aim.every(Number.isFinite) || Math.hypot(...v.aim) > 105.01) return;
    if (![v.time, v.flightTime, v.take, v.best, v.score, v.catches, v.landed, v.bounceCooldown].every(Number.isFinite) || v.time < 0 || v.time > 1e9 || v.flightTime < 0 || v.flightTime > 15000 || !Number.isInteger(v.catches) || v.catches < 0 || v.catches > 3 || !Number.isInteger(v.take) || v.take < 1 || v.take > 100000 || v.score < 0 || v.score > 2000 || v.best < 0 || v.best > 2000 || v.landed < 0 || v.landed > 300 || v.bounceCooldown < 0 || v.bounceCooldown > 900 || typeof v.bounced !== "boolean") return;
    if (v.rope !== null && (!Array.isArray(v.rope) || v.rope.length !== 2 || ![0, 1].includes(v.rope[0]) || !Number.isFinite(v.rope[1]) || v.rope[1] < 100 || v.rope[1] > 350 || v.mode !== "flight" || !v.catches)) return;
    for (let i = 1; i < v.limbs.length; i++) if (Math.hypot(v.limbs[i][0] - v.limbs[0][0], v.limbs[i][1] - v.limbs[0][1]) > 150) return;
    if (v.phase === "won" && (!v.panes.some(Boolean) || v.limbs[0][0] < 799 || v.limbs[0][0] > 925 || v.limbs[0][1] < 378 || v.limbs[0][1] > 442)) return;
    Object.assign(scene, { mode: v.mode, phase: v.phase, time: v.time, flightTime: v.flightTime, take: v.take, best: v.best, score: v.score, catches: v.catches, bounced: v.bounced, landed: v.landed, slow: v.slow === true, progress: v.phase === "won" ? 1 : 0, aim: { x: v.aim[0], y: v.aim[1] } });
    scene.tutorialSeen = v.tutorialSeen === true || v.mode !== "ready" || v.take > 1;
    scene.challenge = Number.isInteger(v.challenge) && v.challenge >= 0 && v.challenge <= 3 ? v.challenge : 0;
    if (Array.isArray(v.badges) && v.badges.length === 3 && v.badges.every(b => typeof b === "boolean")) scene.badges = v.badges.slice();
    scene.failure = Object.hasOwn(failures, v.failure) ? v.failure : "";
    if (Array.isArray(v.metrics) && v.metrics.length === 4 && v.metrics.every(n => Number.isFinite(n) && Math.abs(n) <= 2000)) scene.metrics = v.metrics.slice();
    v.limbs.forEach((a, i) => { Body.setAngle(rag[i], a[2]); Body.setPosition(rag[i], { x: a[0], y: a[1] }); Body.setVelocity(rag[i], { x: a[3], y: a[4] }); Body.setAngularVelocity(rag[i], a[5]); });
    v.panes.forEach((broken, i) => { scene.panes[i].broken = broken; if (broken) Composite.remove(engine.world, panes[i]); });
    scene.broken = v.panes.filter(Boolean).length; scene.stunts = [...(scene.broken ? ["glass"] : []), ...(v.bounced ? ["copier"] : [])]; bounceCooldown = v.bounceCooldown;
    scene.challengePassed = v.phase === "won" && (scene.challenge === 0 || [v.catches === 0, v.bounced, scene.broken <= 2][scene.challenge - 1]);
    scene.gate = 198 + Math.max(0, Math.sin((scene.flightTime - 1500) / 1150)) * 173; Body.setPosition(gate, { x: 779, y: scene.gate - 110 });
    if (v.rope) { scene.attached = v.rope[0]; rope = Constraint.create({ pointA: { x: scene.anchors[v.rope[0]].x, y: scene.anchors[v.rope[0]].y }, bodyB: torso, pointB: { x: 0, y: -12 }, length: v.rope[1], stiffness: .8, damping: .025 }); Composite.add(engine.world, rope); }
  }
  const api = {
    scene, effects: [], attach, releaseRope, checkpoint,
    selectChallenge(n) { if (!active || scene.mode !== "ready" || !Number.isInteger(n) || n < 0 || n > 3) return false; scene.challenge = n; sync(); return true; },
    step(ms) { if (!active || !Number.isFinite(ms) || ms <= 0) return; accumulator += Math.min(ms, 50) * (scene.slow ? .4 : 1); while (accumulator >= dt) { accumulator -= dt; update(); } },
    pointer(type, x, y) {
      if (!active || scene.phase !== "playing" || !Number.isFinite(x + y)) return false;
      if (type === "down") {
        if (y >= 39 && y <= 80 && x >= 225 && x < 697) return api.selectChallenge(Math.floor((x - 225) / 118));
        if (scene.mode === "ready" && Math.hypot(x - start.x, y - start.y) < 85) { dragging = true; scene.mode = "aiming"; scene.tutorialSeen = true; return true; }
        if (scene.mode === "flight") { if (rope) return releaseRope(); const a = scene.anchors.filter(a => a.available && Math.hypot(a.x - x, a.y - y) < 60).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0]; return a ? attach(a.id) : false; }
      }
      if (type === "move" && dragging) { const dx = clamp(start.x - x, 0, 105), dy = clamp(start.y - y, -95, 50), k = Math.min(1, 105 / Math.hypot(dx, dy)); scene.aim = { x: dx * k, y: dy * k }; return true; }
      if (type === "up" && dragging) return launch();
      return false;
    },
    primary() { if (!active) return false; if (scene.phase !== "playing") return api.retry(); if (scene.mode !== "flight") return launch(); if (rope) return releaseRope(); const a = scene.anchors.filter(a => a.available).sort((a, b) => dist(a) - dist(b))[0]; return a ? attach(a.id) : false; },
    secondary() { if (!active || scene.phase !== "playing") return false; scene.slow = !scene.slow; sync(); return true; },
    key(key, down) {
      if (!active) return false;
      if (down && ["1", "2", "3", "4"].includes(key)) return api.selectChallenge(Number(key) - 1);
      if (key === " " || key === "Enter") { if (!down) { heldKey = false; return true; } if (heldKey) return true; heldKey = true; api.primary(); return true; }
      if (!down || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Escape"].includes(key)) return false;
      if (key === "Escape") { api.cancel(); return true; }
      if (["ready", "aiming"].includes(scene.mode)) { scene.tutorialSeen = true; scene.aim.x = clamp(scene.aim.x + (key === "ArrowRight" ? 3 : key === "ArrowLeft" ? -3 : 0), 12, 95); scene.aim.y = clamp(scene.aim.y + (key === "ArrowDown" ? 3 : key === "ArrowUp" ? -3 : 0), -44, 35); return true; }
      return false;
    },
    cancel() { if (!active) return; dragging = heldKey = false; if (scene.mode === "aiming") scene.mode = "ready"; },
    retry() { if (!active) return false; scene.take = Math.min(100000, scene.take + 1); reset(); emit("slate"); return true; },
    next() { return api.retry(); }, setLevel(n) { if (!active || n !== 0) return false; reset(); return true; },
    snapshot() { return { id: scene.id, phase: scene.phase, mode: scene.mode, level: 0, time: scene.time, score: scene.score, progress: scene.progress, goal: 1, status: scene.status, abilityAvailable: true, primaryLabel: scene.primaryLabel, secondaryLabel: scene.secondaryLabel, take: scene.take, broken: scene.broken, catches: scene.catches, bounced: scene.bounced, attached: scene.attached, best: scene.best, slow: scene.slow, challenge: scene.challenge, challengePassed: scene.challengePassed, badges: scene.badges.slice(), failure: scene.failure }; },
    stop() { if (!active) return; api.cancel(); active = false; },
    destroy() { api.stop(); Composite.clear(engine.world, false); Engine.clear(engine); },
  };
  sync(); restore(options.checkpoint); sync(); return api;
}

export function paintStunt() {}
