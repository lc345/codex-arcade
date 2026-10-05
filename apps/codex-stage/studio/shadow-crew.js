import { Matter } from "../vendor/matter.js";

export function createShadowWorld(options = {}) {
  const { Engine, Bodies, Body, Composite, Query, Vertices } = Matter, dt = 1000 / 120;
  const engine = Engine.create({ gravity: { x: 0, y: .7 }, positionIterations: 8, velocityIterations: 8 });
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const chapters = [
    { title: "长一点，再长一点", width: 170, islands: [[54, 240, 320], [690, 914, 320]], lamps: [480], zoom: 1.35 },
    { title: "借来的桥", width: 106, islands: [[54, 210, 320], [400, 510, 320], [710, 914, 320]], lamps: [480], zoom: 1.4 },
    { title: "一件物品，两条路", width: 140, islands: [[54, 180, 320], [410, 550, 320], [780, 914, 320]], lamps: [230, 730], zoom: 1.3 },
  ];
  const scene = { id: "shadow-crew", level: 0, phase: "playing", mode: "edit", time: 0, score: 0, progress: 0, goal: 1,
    title: "", prop: { x: 480, y: 320, kind: "ruler", angle: 0 }, zoom: 1.35, islands: [], lamps: [], shadows: [], player: {}, rest: 0, falls: 0,
    steps: 0, edits: 0, status: "", primaryLabel: "出发", secondaryLabel: "撤销", abilityAvailable: false, selected: "prop", notice: "", noticeUntil: 0, marks: [] };
  const player = Bodies.rectangle(116, 307, 14, 26, { friction: 0, frictionAir: 0, restitution: 0, inertia: Infinity, chamfer: { radius: 2 } });
  let active = true, acc = 0, solids = [], permanent = [], shadowBodies = [], history = [], dragging = null, dragOrigin = null, walkSound = 0;
  const emit = type => { if (active) options.onEvent?.({ type: `shadow-${type}` }); };
  function sourceShapes() {
    const { kind, angle } = scene.prop, w = chapters[scene.level].width;
    const rect = (x, y, width, height) => [{ x, y }, { x: x + width, y }, { x: x + width, y: y + height }, { x, y: y + height }];
    if (kind === "comb") return [rect(-w / 2, 15, w, 8), ...Array.from({ length: 7 }, (_, i) => rect(-w / 2 + i * w / 7, -i * 2, w / 7 - 3, 18 + i * 2))];
    if (kind === "scissors") return [-1, 1].map(sign => rect(-w / 2, 0, w, 8).map(p => ({ x: p.x * Math.cos(angle) - p.y * Math.sin(sign * angle), y: p.x * Math.sin(sign * angle) + p.y * Math.cos(angle) })));
    return [rect(-w / 2, 0, w, 10)];
  }
  function project() {
    // Point-light projection onto a parallel wall. Zoom = wall distance / source distance.
    return scene.lamps.flatMap((lamp, l) => sourceShapes().map((shape, i) => ({ lamp: l, part: i, vertices: shape.map(p => ({ x: lamp.x + (scene.prop.x + p.x - lamp.x) * scene.zoom, y: lamp.y + (scene.prop.y + p.y - lamp.y) * scene.zoom })) })));
  }
  function rebuild() {
    shadowBodies.forEach(b => Composite.remove(engine.world, b));
    scene.shadows = project();
    shadowBodies = scene.shadows.map((p, i) => { const center = Vertices.centre(p.vertices); return Bodies.fromVertices(center.x, center.y, [p.vertices], { isStatic: true, friction: 0, restitution: 0, label: `shadow-${i}` }); });
    Composite.add(engine.world, shadowBodies); solids = [...permanent, ...shadowBodies];
  }
  const arrangement = () => ({ x: scene.prop.x, y: scene.prop.y, kind: scene.prop.kind, angle: scene.prop.angle, zoom: scene.zoom });
  function validArrangement(v) { return v && [v.x, v.y, v.angle, v.zoom].every(Number.isFinite) && v.x >= 265 && v.x <= 695 && v.y >= 290 && v.y <= 352 && Math.abs(v.angle) <= .32 && v.zoom >= 1.15 && v.zoom <= 3 && ["ruler", "comb", "scissors"].includes(v.kind) && (scene.level === 2 || v.kind === "ruler"); }
  function apply(v) { scene.prop = { x: v.x, y: v.y, kind: v.kind, angle: v.angle }; scene.zoom = v.zoom; rebuild(); }
  function setArrangement(v, remember = true) {
    if (!active || scene.phase !== "playing" || !validArrangement(v)) return false;
    const previous = arrangement(); if (JSON.stringify(previous) === JSON.stringify(v)) return true;
    apply(v);
    if (shadowBodies.some(b => Vertices.contains(b.vertices, player.position))) { apply(previous); scene.notice = "影子压住了工人，换一个位置"; scene.noticeUntil = scene.time + 1600; return false; }
    if (remember) { history.push(previous); if (history.length > 12) history.shift(); scene.edits++; emit("place"); }
    sync(); return true;
  }
  function sync() {
    scene.player = { x: player.position.x, y: player.position.y, vx: player.velocity.x, vy: player.velocity.y };
    scene.primaryLabel = scene.mode === "walk" ? "停步" : "出发"; scene.abilityAvailable = history.length > 0 && scene.phase === "playing";
    scene.status = scene.phase === "won" ? "影子接成了路，施工完成。" : scene.phase === "lost" ? "脚下的影子断开了；回到安全台后继续调整。" : scene.noticeUntil > scene.time ? scene.notice : scene.rest && scene.level === 1 && scene.mode === "edit" ? "中转台已到，后面的影子可以借到前面。" : scene.mode === "walk" ? "施工员在影子上行走" : "把影子接在平台之间，让施工员走到右侧门口。";
  }
  function build(level) {
    Composite.clear(engine.world, false); Engine.clear(engine); history = []; dragging = null; dragOrigin = null; acc = walkSound = 0;
    const def = chapters[level]; Object.assign(scene, { level, phase: "playing", mode: "edit", time: 0, score: 0, progress: 0, title: def.title,
      prop: { x: 480, y: 320, kind: "ruler", angle: 0 }, zoom: def.zoom, islands: def.islands.map(([left, right, y]) => ({ left, right, y })),
      lamps: def.lamps.map(x => ({ x, y: 320 })), rest: 0, falls: 0, steps: 0, edits: 0, selected: "prop", notice: "", noticeUntil: 0, marks: [] });
    permanent = scene.islands.map(p => Bodies.rectangle((p.left + p.right) / 2, p.y + 36, p.right - p.left, 72, { isStatic: true, friction: 0 }));
    shadowBodies = []; Body.setPosition(player, { x: 116, y: 307 }); Body.setVelocity(player, { x: 0, y: 0 }); Body.setAngle(player, 0); Body.setAngularVelocity(player, 0);
    player.force.x = player.force.y = 0; player.positionImpulse.x = player.positionImpulse.y = 0;
    Composite.add(engine.world, [...permanent, player]); rebuild(); sync();
  }
  function topAt(x) {
    let top = Infinity;
    for (const b of solids) for (let i = 0; i < b.vertices.length; i++) {
      const a = b.vertices[i], z = b.vertices[(i + 1) % b.vertices.length];
      if (Math.abs(z.x - a.x) < .01 || x < Math.min(a.x, z.x) || x > Math.max(a.x, z.x)) continue;
      const y = a.y + (z.y - a.y) * (x - a.x) / (z.x - a.x); if (y < top) top = y;
    }
    return top;
  }
  function update() {
    if (scene.phase !== "playing") return; scene.time += dt;
    const p = player.position, foot = p.y + 13;
    const supported = Query.ray(solids, { x: p.x, y: foot - 2 }, { x: p.x, y: foot + 4 }, 5).length > 0;
    const nextY = topAt(p.x + 10);
    if (scene.mode === "walk" && supported && nextY < foot - 1 && nextY >= foot - 12) Body.setPosition(player, { x: p.x, y: nextY - 13 });
    Body.setVelocity(player, { x: scene.mode === "walk" ? 1.15 : 0, y: player.velocity.y });
    Engine.update(engine, dt); scene.steps += scene.mode === "walk" && supported ? dt / 1000 : 0;
    if (scene.mode === "walk" && supported && scene.time - walkSound > 330) { walkSound = scene.time; emit("step"); }
    if (scene.level === 1 && !scene.rest && player.position.x > 438 && player.position.x < 510 && Math.abs(player.position.y + 13 - 320) < 4) {
      scene.rest = 1; scene.mode = "edit"; Body.setVelocity(player, { x: 0, y: 0 }); emit("checkpoint");
    }
    const end = scene.islands.at(-1);
    if (player.position.x > 844 && player.position.x < end.right && Math.abs(player.position.y + 13 - end.y) < 4 && Query.collides(player, [permanent.at(-1)]).length) {
      scene.phase = "won"; scene.mode = "clear"; scene.score = 100; scene.progress = 1; Body.setVelocity(player, { x: 0, y: 0 }); emit("win");
    } else if (player.position.y > 400 || player.position.x > 950 || player.position.x < 30) { scene.phase = "lost"; scene.mode = "fallen"; scene.falls++; emit("fall"); }
    sync();
  }
  function checkpoint() { return { version: 1, level: scene.level, arrangement: arrangement(), history: history.map(h => ({ ...h })), phase: scene.phase, mode: scene.mode, time: scene.time,
    player: [player.position.x, player.position.y, player.velocity.x, player.velocity.y], rest: scene.rest, falls: scene.falls, edits: scene.edits, steps: scene.steps }; }
  function restore(v) {
    if (!v || v.version !== 1 || !Number.isInteger(v.level) || v.level < 0 || v.level > 2) return;
    const oldLevel = scene.level; scene.level = v.level; const valid = validArrangement(v.arrangement); scene.level = oldLevel;
    if (!valid || !["playing", "won", "lost"].includes(v.phase) || !["edit", "walk", "clear", "fallen"].includes(v.mode) || (v.phase === "won") !== (v.mode === "clear") || (v.phase === "lost") !== (v.mode === "fallen")) return;
    if (!Array.isArray(v.player) || v.player.length !== 4 || !v.player.every(Number.isFinite) || v.player[0] < 20 || v.player[0] > 970 || v.player[1] < 30 || v.player[1] > 430 || Math.abs(v.player[2]) > 5 || Math.abs(v.player[3]) > 30) return;
    if (![v.time, v.falls, v.edits, v.steps].every(n => Number.isFinite(n) && n >= 0 && n < 1e8) || ![0, 1].includes(v.rest) || v.rest && v.level !== 1) return;
    if (v.phase === "won" && (v.player[0] < 844 || Math.abs(v.player[1] - 307) > 4)) return;
    build(v.level); apply(v.arrangement);
    if (Array.isArray(v.history) && v.history.length <= 12 && v.history.every(validArrangement)) history = v.history.map(h => ({ x: h.x, y: h.y, kind: h.kind, angle: h.angle, zoom: h.zoom }));
    Object.assign(scene, { phase: v.phase, mode: v.mode, time: v.time, rest: v.rest, falls: v.falls, edits: v.edits, steps: v.steps, score: v.phase === "won" ? 100 : 0, progress: v.phase === "won" ? 1 : 0 });
    Body.setPosition(player, { x: v.player[0], y: v.player[1] }); Body.setVelocity(player, { x: v.player[2], y: v.player[3] }); sync();
  }
  const api = {
    scene, effects: [], project, sourceShapes, checkpoint,
    moveProp(x, y) { return setArrangement({ ...arrangement(), x, y }); },
    setLight(zoom) { return setArrangement({ ...arrangement(), zoom }); },
    selectTool(kind) { return setArrangement({ ...arrangement(), kind }); },
    setAngle(angle) { return setArrangement({ ...arrangement(), angle }); },
    step(ms) { if (!active || !Number.isFinite(ms) || ms <= 0) return; acc += Math.min(50, ms); while (acc >= dt) { acc -= dt; update(); } },
    primary() { if (!active) return false; if (scene.phase === "won") return api.next(); if (scene.phase === "lost") return api.retry(); scene.mode = scene.mode === "walk" ? "edit" : "walk"; emit("start"); sync(); return true; },
    secondary() { if (!active || dragging || scene.phase !== "playing" || !history.length) return false; if (!setArrangement(history.at(-1), false)) return false; history.pop(); scene.edits++; emit("undo"); sync(); return true; },
    pointer(type, x, y) {
      if (!active || scene.phase !== "playing" || !Number.isFinite(x + y)) return false;
      if (type === "down") {
        if (y >= 490 && y <= 526 && x >= 260 && x <= 610) { dragging = "light"; scene.selected = "light"; }
        else if (scene.level === 2 && y >= 480 && y <= 526 && x >= 687 && x <= 922) { scene.selected = "prop"; return api.selectTool(["ruler", "comb", "scissors"][Math.floor((x - 687) / 79)]); }
        else if (scene.prop.kind === "scissors" && Math.hypot(x - scene.prop.x, y - (418 + (scene.prop.y - 320) * .4)) < 20) { dragging = "angle"; }
        else if (Math.abs(x - scene.prop.x) <= chapters[scene.level].width / 2 + 18 && Math.abs(y - (450 + (scene.prop.y - 320) * .4)) < 29) { dragging = "prop"; scene.selected = "prop"; }
        else return false;
        scene.mode = "edit"; dragOrigin = { pointerX: x, pointerY: y, arrangement: arrangement() }; sync(); return true;
      }
      if (type === "move" && dragging) {
        const a = dragOrigin.arrangement;
        return setArrangement(dragging === "light" ? { ...arrangement(), zoom: clamp(1.15 + (x - 270) / 330 * 1.85, 1.15, 3) } : dragging === "angle" ? { ...arrangement(), angle: clamp(a.angle + (x - dragOrigin.pointerX) / 180, -.32, .32) } : { ...arrangement(), x: clamp(a.x + x - dragOrigin.pointerX, 265, 695), y: clamp(a.y + (y - dragOrigin.pointerY) / .4, 290, 352) }, false);
      }
      if (type === "up" && dragging) { if (JSON.stringify(arrangement()) !== JSON.stringify(dragOrigin.arrangement)) { history.push(dragOrigin.arrangement); if (history.length > 12) history.shift(); scene.edits++; emit("place"); } dragging = dragOrigin = null; sync(); return true; }
      return false;
    },
    key(key, down) {
      if (!active || !down) return false;
      if ([" ", "Enter"].includes(key)) { api.primary(); return true; }
      if (key === "Escape") { api.cancel(); return true; }
      if (scene.phase !== "playing") return false;
      if (["1", "2", "3"].includes(key)) return api.selectTool(["ruler", "comb", "scissors"][Number(key) - 1]);
      if (["-", "="].includes(key)) { scene.selected = "light"; return api.setLight(clamp(scene.zoom + (key === "=" ? .05 : -.05), 1.15, 3)); }
      if (["q", "e"].includes(key)) return api.setAngle(clamp(scene.prop.angle + (key === "e" ? .03 : -.03), -.32, .32));
      if (key.startsWith("Arrow")) { scene.selected = "prop"; return api.moveProp(clamp(scene.prop.x + (key === "ArrowLeft" ? -5 : key === "ArrowRight" ? 5 : 0), 265, 695), clamp(scene.prop.y + (key === "ArrowUp" ? -2 : key === "ArrowDown" ? 2 : 0), 290, 352)); }
      return false;
    },
    cancel() { if (!active) return; if (dragOrigin) apply(dragOrigin.arrangement); dragging = dragOrigin = null; sync(); },
    retry() { if (!active) return false; api.cancel(); const island = scene.islands[scene.rest]; Body.setPosition(player, { x: scene.rest ? 450 : 116, y: island.y - 13 }); Body.setVelocity(player, { x: 0, y: 0 }); player.force.x = player.force.y = 0; player.positionImpulse.x = player.positionImpulse.y = 0; scene.phase = "playing"; scene.mode = "edit"; scene.progress = scene.score = 0; scene.notice = ""; acc = 0; sync(); return true; },
    next() { if (!active || scene.phase !== "won") return false; build((scene.level + 1) % 3); return true; },
    setLevel(n) { if (!active || !Number.isInteger(n) || n < 0 || n > 2) return false; build(n); return true; },
    snapshot() { return { id: scene.id, phase: scene.phase, mode: scene.mode, time: scene.time, level: scene.level, score: scene.score, progress: scene.progress, goal: 1, status: scene.status, abilityAvailable: scene.abilityAvailable, rest: scene.rest, zoom: Math.round(scene.zoom * 100) / 100, tool: scene.prop.kind, edits: scene.edits, falls: scene.falls }; },
    stop() { if (!active) return; api.cancel(); active = false; }, destroy() { api.stop(); Composite.clear(engine.world, false); Engine.clear(engine); },
  };
  build(Number.isInteger(options.level) && options.level >= 0 && options.level <= 2 ? options.level : 0); restore(options.checkpoint); return api;
}

export function paintShadow() {}
