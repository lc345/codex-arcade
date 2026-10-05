import { Matter } from "../vendor/matter.js";

// Serialized as a reviewed, offline pack. The compound's cargo is real collision geometry.
export function createMagnetWorld({ checkpoint, onEvent = () => {} } = {}) {
  const { Engine, Bodies, Body, Composite, Events, Query } = Matter;
  const engine = Engine.create({ gravity: { x: 0, y: 0 }, positionIterations: 8 }), keys = new Set(), parts = new Map(), trafficBodies = new Map(), walls = [];
  const city = { width: 2800, height: 1560, zones: [{ name: "后巷回收站", x: 300, y: 390 }, { name: "商业十字街", x: 1475, y: 1060 }, { name: "河岸巴士桥", x: 2390, y: 390 }] };
  const depot = { x: 320, y: 390, w: 630, h: 630 };
  const s = { id: "magnet-rampage", level: 0, phase: "playing", mode: "collect", time: 0, score: 0, power: 0, load: 0, radius: 22, collected: 0, progress: 0, goal: 3, city, depot, zone: 0, delivered: false, deliveryProgress: 0, trafficTime: 0, trafficGrace: 0, trafficHits: 0, busDrops: 0, player: {}, items: [], obstacles: [], roads: [], traffic: [], sparks: [], popups: [], tracks: [], crash: 0, hits: 0, primaryLabel: "重新出发", secondaryLabel: "", abilityAvailable: false, status: "", camera: { x: 400, y: 390, width: 1040 } };
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  let root, core, active = true, accumulator = 0, target = null, started = false, collecting = false, impact = null, lastHit = -2000, lastTrack = 0, nextAttachAt = 0, restoring = false, deliveryStart = 0;
  const seen = new Set(), emit = type => { if (active) onEvent({ type: `magnet-${type}` }); };
  function part(item, x = item.x, y = item.y, angle = item.angle || 0) {
    const b = Bodies.circle(x, y, item.r, { friction: .05, frictionAir: .06, restitution: .24, label: `cargo:${item.id}` });
    Body.setMass(b, item.mass / 4); Body.setAngle(b, angle); return b;
  }
  function obstacle(x, y, w, h, kind) {
    s.obstacles.push({ x, y, w, h, kind });
    const b = Bodies.rectangle(x, y, w, h, { isStatic: true, friction: .01, restitution: .3, label: "wall" }); walls.push(b); Composite.add(engine.world, b);
  }
  const clear = (x, y, r = 0) => x > 30 + r && x < city.width - 30 - r && y > 30 + r && y < city.height - 30 - r && s.obstacles.every(o => Math.hypot(x - clamp(x, o.x - o.w / 2, o.x + o.w / 2), y - clamp(y, o.y - o.h / 2, o.y + o.h / 2)) > r + 2);
  function traffic(kind, lane, phase, speed, direction = 1) {
    const id = `traffic-${s.traffic.length}`, truck = kind === "truck", t = { id, kind, lane, phase, travel: phase, speed, direction, x: 0, y: 0, vx: 0, vy: 0, angle: truck ? Math.PI / 2 : direction < 0 ? Math.PI : 0, w: truck ? 72 : 92, h: truck ? 225 : 50, color: truck ? "#eeae3e" : direction > 0 ? "#e26857" : "#55a8cd", warning: false };
    const b = Bodies.rectangle(0, 0, t.w, t.h, { isStatic: true, label: id, friction: .02, restitution: .55 });
    trafficBodies.set(id, b); s.traffic.push(t); Composite.add(engine.world, b);
  }
  function trafficStep(dt) {
    s.trafficTime += dt; s.trafficGrace = Math.max(0, s.trafficGrace - dt / 1000);
    for (const t of s.traffic) {
      const b = trafficBodies.get(t.id), previous = { x: t.x, y: t.y };
      if (t.kind === "truck") {
        const cycle = (s.trafficTime / 1000 + t.phase) % 16;
        t.x = t.lane; t.y = cycle < 4 ? -140 : -140 + (cycle - 4) * t.speed; t.visible = t.y > -130 && t.y < city.height + 130; t.warning = cycle > 7.7 && cycle < 10.2;
      } else {
        const cycle = s.trafficTime / 1000 % 16, red = cycle > 8 && cycle < 12;
        t.stopped = red && (t.direction > 0 ? t.x >= 1190 && t.x <= 1350 : t.x >= 1550 && t.x <= 1700);
        if (!t.stopped) t.travel += dt / 1000 * t.speed;
        const length = city.width + 180, position = t.travel % length;
        t.x = t.direction > 0 ? position - 90 : city.width + 90 - position; t.y = t.lane; t.visible = t.x > -60 && t.x < city.width + 60;
      }
      b.collisionFilter.mask = s.trafficGrace > 0 || !t.visible ? 0 : 0xFFFFFFFF;
      const wrap = Math.hypot(previous.x - t.x, previous.y - t.y) > 300 || dt === 0;
      t.vx = wrap ? 0 : (t.x - previous.x) / (dt / 1000); t.vy = wrap ? 0 : (t.y - previous.y) / (dt / 1000);
      Body.setPosition(b, { x: t.x, y: t.y }, !wrap);
      if (t.warning && !t.warned && dt > 0) emit("horn"); t.warned = t.warning;
    }
  }
  function add(kind, x, y, r, mass, need, color) {
    const i = { id: s.items.length, kind, x, y, r, mass, need, color, angle: s.items.length * 1.71, attached: false, cooldown: 0 };
    s.items.push(i); const b = part(i); Body.setStatic(b, need > 0); parts.set(i.id, b); Composite.add(engine.world, b);
  }
  function sync() {
    s.player = { x: core.position.x, y: core.position.y, angle: core.angle + root.angle, vx: root.velocity.x, vy: root.velocity.y };
    s.load = 0; s.radius = 22; s.collected = 0;
    for (const i of s.items) {
      const b = parts.get(i.id); i.x = b.position.x; i.y = b.position.y; i.angle = b.angle + (i.attached ? root.angle : 0); i.part = i.attached; i.eligible = s.power >= i.need;
      if (i.attached) { s.collected++; s.load += i.mass; s.radius = Math.max(s.radius, Math.hypot(i.x - s.player.x, i.y - s.player.y) + i.r); }
    }
    s.score = [...seen].reduce((sum, id) => sum + s.items[id].mass, 0);
    const bus = s.items.find(i => i.kind === "bus");
    s.mode = s.delivered ? s.phase === "won" ? "complete" : "recycle" : bus?.attached ? "return" : seen.has(bus?.id) ? "recover" : s.power >= 180 ? "find-bus" : "collect";
    s.progress = s.delivered ? 3 : bus?.attached ? 2 : s.power >= 180 ? 1 : 0;
    s.zone = s.player.x < 800 ? 0 : s.player.x < 1950 ? 1 : 2;
    const labels = { collect: `收集金属 · 磁力 ${s.power}/180`, "find-bus": "到河岸桥头拖走废弃巴士", return: "巴士已接上 · 拖回西侧回收厂", recover: "巴士脱落 · 返回标记处接回", recycle: "回收厂拆解中", complete: "城市大搬家完成！" };
    s.status = `${city.zones[s.zone].name} · ${labels[s.mode]}`;
  }
  function rebuild(extra = null, remove = []) {
    const position = { ...core.position }, angle = core.angle + root.angle, velocity = { ...root.velocity }, angular = root.angularVelocity;
    const rotation = root.angle;
    const kept = s.items.filter(i => i.attached && !remove.includes(i.id)).map(i => ({ i, b: parts.get(i.id) }));
    Composite.remove(engine.world, root);
    core = Bodies.circle(position.x, position.y, 22, { label: "magnet-core" }); Body.setMass(core, 4); Body.setAngle(core, angle);
    const bodies = [core];
    for (const { i, b } of kept) { const next = part(i, b.position.x, b.position.y, b.angle + rotation); parts.set(i.id, next); bodies.push(next); }
    if (extra) {
      Composite.remove(engine.world, parts.get(extra.i.id)); const b = part(extra.i, extra.x, extra.y, extra.angle);
      parts.set(extra.i.id, b); bodies.push(b); extra.i.attached = true;
    }
    root = Body.create({ parts: bodies, frictionAir: .025, friction: .03, restitution: .18 });
    Body.setVelocity(root, velocity); Body.setAngularVelocity(root, angular); Composite.add(engine.world, root);
  }
  function burst(x, y, color, n) {
    for (let j = 0; j < n; j++) { const a = j * 2.399; s.sparks.push({ x, y, vx: Math.cos(a) * (60 + j * 8), vy: Math.sin(a) * (60 + j * 8), life: .5, color }); }
    if (s.sparks.length > 100) s.sparks.splice(0, s.sparks.length - 100);
  }
  function attach(i) {
    const p = core.position, direction = Math.atan2(i.y - p.y, i.x - p.x); let slot;
    // Find a non-overlapping perimeter slot, retaining the incoming side of the cluster.
    for (let radius = 22 + i.r; radius < 440 && !slot; radius += 9) {
      for (let j = 0; j < 18; j++) {
        const a = direction + (j % 2 ? 1 : -1) * Math.ceil(j / 2) * .21, x = p.x + Math.cos(a) * radius, y = p.y + Math.sin(a) * radius;
        if ((restoring || clear(x, y, i.r)) && s.items.every(o => !o.attached || Math.hypot(x - o.x, y - o.y) >= i.r + o.r + 1)) { slot = { x, y, angle: a }; break; }
      }
    }
    if (!slot) return;
    rebuild({ i, ...slot });
    const previous = s.power;
    if (!seen.has(i.id)) { seen.add(i.id); s.power += i.mass; }
    burst(slot.x, slot.y, i.color, i.mass >= 12 ? 12 : 5);
    if (i.kind !== "bus") s.popups.push({ x: slot.x, y: slot.y, text: `+${i.mass}`, life: .8, large: i.mass >= 12 });
    if (s.popups.length > 4) s.popups.shift();
    nextAttachAt = s.time + (i.mass >= 12 ? 650 : 80);
    emit(i.mass >= 12 ? "big" : "catch");
    if ([20, 60, 110, 180].some(n => previous < n && s.power >= n)) emit("upgrade");
    if (i.kind === "bus") emit("tow");
    sync();
  }
  function shed(severity = 1, trafficHit = false) {
    const attached = s.items.filter(i => i.attached).sort((a, b) => Math.hypot(b.x - core.position.x, b.y - core.position.y) - Math.hypot(a.x - core.position.x, a.y - core.position.y));
    if (!attached.length) return;
    const selected = attached.filter(i => i.kind !== "bus" || severity > 4).slice(0, Math.min(severity > 4 ? 5 : 3, Math.ceil(attached.length / 9)));
    const bus = attached.find(i => i.kind === "bus"); if (bus && severity > 4 && !selected.includes(bus)) selected.push(bus);
    const dropped = selected.map(i => ({ i, x: i.x, y: i.y, angle: i.angle }));
    rebuild(null, dropped.map(({ i }) => i.id));
    for (const { i, x, y, angle } of dropped) {
      i.attached = false; i.cooldown = s.time + 1200;
      const dx = x - core.position.x, dy = y - core.position.y, d = Math.hypot(dx, dy) || 1;
      const b = part(i, clamp(x, 35 + i.r, city.width - 35 - i.r), clamp(y, 35 + i.r, city.height - 35 - i.r), angle); Body.setVelocity(b, { x: dx / d * 4, y: dy / d * 4 }); Body.setAngularVelocity(b, .06);
      parts.set(i.id, b); Composite.add(engine.world, b); burst(x, y, "#ffd251", 8);
      if (i.kind === "bus") { s.busDrops++; emit("lost-bus"); }
    }
    s.crash = .4; s.hits++; if (trafficHit) s.trafficHits++; lastHit = s.time; emit("crash"); sync();
  }
  Events.on(engine, "collisionStart", event => {
    for (const pair of event.pairs) {
      const a = pair.bodyA.parent, b = pair.bodyB.parent, other = a === root ? b : b === root ? a : null;
      if (!other) continue;
      const t = s.traffic.find(t => t.id === other.label);
      if (other.label === "wall" || t) {
        const vx = t ? t.vx / 60 : 0, vy = t ? t.vy / 60 : 0;
        const severity = Math.hypot(root.velocity.x - vx, root.velocity.y - vy) * (t?.kind === "truck" ? 1.8 : 1);
        if (!impact || severity > impact.severity) impact = { severity, traffic: Boolean(t) };
      }
    }
  });
  function reset() {
    Composite.clear(engine.world, false); Engine.clear(engine); parts.clear(); seen.clear(); keys.clear(); trafficBodies.clear(); walls.length = 0; target = null; started = collecting = false; accumulator = 0; impact = null; lastHit = -2000; nextAttachAt = 0; lastTrack = 0; deliveryStart = 0;
    Object.assign(s, { phase: "playing", mode: "collect", time: 0, score: 0, power: 0, progress: 0, hits: 0, crash: 0, delivered: false, deliveryProgress: 0, trafficTime: 0, trafficGrace: 0, trafficHits: 0, busDrops: 0, items: [], obstacles: [], roads: [], traffic: [], sparks: [], popups: [], tracks: [], camera: { x: 430, y: 390, width: 1040 } });
    core = Bodies.circle(180, 390, 22); Body.setMass(core, 4); root = Body.create({ parts: [core], frictionAir: .025, restitution: .18 }); Composite.add(engine.world, root);
    obstacle(1400, 0, 2850, 50, "edge"); obstacle(1400, 1560, 2850, 50, "edge"); obstacle(0, 780, 50, 1600, "edge"); obstacle(2800, 780, 50, 1600, "edge");
    for (const v of [[1030,175,440,230],[1000,515,400,100],[1020,1030,140,80],[1920,220,430,300],[1940,510,430,120],[1960,1030,160,80],[1020,1510,420,40],[1960,1510,480,40]]) obstacle(...v, "shop");
    obstacle(2710, 85, 180, 170, "water"); obstacle(2710, 1080, 180, 960, "water");
    obstacle(690, 305, 26, 30, "bollard"); obstacle(690, 475, 26, 30, "bollard");
    s.roads = [{x:1400,y:780,w:2740,h:380,axis:"x"},{x:1450,y:780,w:360,h:1460,axis:"y"},{x:1140,y:390,w:1370,h:250,axis:"x"},{x:2370,y:390,w:640,h:330,axis:"x"},{x:2400,y:970,w:480,h:780,axis:"y"},{x:1400,y:1260,w:2660,h:340,axis:"x"},{x:460,y:950,w:440,h:1050,axis:"y"}];
    for (let j = 0; j < 20; j++) add(j % 2 ? "can" : "nut", 258 + j % 5 * 47, 294 + Math.floor(j / 5) * 58, j % 2 ? 10 : 8, 2, 0, j % 2 ? "#ec6653" : "#dbe5ed");
    for (let j = 0; j < 8; j++) add("tool", 360 + j % 4 * 66, 175 + Math.floor(j / 4) * 405, 14, 5, 20, "#45b8a9");
    for (let j = 0; j < 6; j++) add("bike", 820 + j % 3 * 140, 650 + Math.floor(j / 3) * 230, 23, 12, 60, "#eeb94b");
    for (let j = 0; j < 4; j++) add("vending", 1660 + j % 2 * 170, 620 + Math.floor(j / 2) * 280, 29, 24, 110, j % 2 ? "#a18bdb" : "#40b49d");
    add("car", 2370, 900, 40, 50, 180, "#999f90"); add("car", 2490, 1010, 40, 50, 180, "#88979d"); add("bus", 2480, 390, 70, 80, 180, "#ee674f");
    traffic("car", 740, 750, 130); traffic("car", 740, 1950, 130); traffic("car", 840, 1300, 105, -1); traffic("truck", 1450, 0, 150);
    trafficStep(0);
    sync();
  }
  function cancel() { target = null; collecting = false; keys.clear(); if (root) { Body.setVelocity(root, { x: 0, y: 0 }); Body.setAngularVelocity(root, 0); } sync(); }
  function update(dt) {
    s.time += dt; const sec = dt / 1000;
    let dx = Number(keys.has("d") || keys.has("ArrowRight")) - Number(keys.has("a") || keys.has("ArrowLeft"));
    let dy = Number(keys.has("s") || keys.has("ArrowDown")) - Number(keys.has("w") || keys.has("ArrowUp"));
    if (!dx && !dy && target) { dx = target.x - core.position.x; dy = target.y - core.position.y; if (Math.hypot(dx, dy) < 9) { dx = dy = 0; target = null; } }
    const distance = Math.hypot(dx, dy), speed = (s.mode === "return" ? 3.1 : 3.7) / (1 + s.load / 1400), moving = distance > 0 && s.phase === "playing" && !s.delivered;
    if (moving) {
      const factor = Math.min(1, distance / 40 || 1), keyboard = keys.size > 0;
      const vx = dx / distance * speed * (keyboard ? 1 : factor), vy = dy / distance * speed * (keyboard ? 1 : factor);
      Body.setVelocity(root, { x: root.velocity.x * .9 + vx * .1, y: root.velocity.y * .9 + vy * .1 });
      const desired = Math.atan2(dy, dx), heading = core.angle + root.angle, delta = Math.atan2(Math.sin(desired - heading), Math.cos(desired - heading));
      const eccentric = Math.hypot(root.position.x - core.position.x, root.position.y - core.position.y);
      Body.setAngularVelocity(root, clamp(delta * .035 / (1 + eccentric / 25), -.034, .034));
    } else { Body.setVelocity(root, { x: root.velocity.x * .72, y: root.velocity.y * .72 }); Body.setAngularVelocity(root, root.angularVelocity * .6); }
    impact = null;
    for (const i of s.items) {
      if (i.attached) continue; const b = parts.get(i.id);
      if (b.isStatic && s.power >= i.need) { Body.setStatic(b, false); Body.setMass(b, i.mass / 4); }
      if (collecting && s.phase === "playing" && !s.delivered && s.power >= i.need && s.time >= i.cooldown) {
        const x = core.position.x - b.position.x, y = core.position.y - b.position.y, d = Math.hypot(x, y);
        if (d < s.radius + i.r + 85 && d > 1) { const force = .0017 / (1 + i.mass / 35); Body.applyForce(b, b.position, { x: x / d * b.mass * force, y: y / d * b.mass * force }); }
      }
    }
    if (started && s.phase === "playing" && !s.delivered) { trafficStep(dt); Engine.update(engine, dt); } sync();
    if (impact && impact.severity > (impact.traffic ? 1.6 : 2.7) && s.time - lastHit > 1500 && s.phase === "playing") shed(impact.severity, impact.traffic);
    if (collecting && s.phase === "playing" && !s.delivered && s.time >= nextAttachAt) for (const i of s.items) {
      if (i.attached || !i.eligible || i.cooldown > s.time) continue;
      const close = Math.hypot(i.x - core.position.x, i.y - core.position.y) < 22 + i.r + 6 || s.items.some(o => o.attached && Math.hypot(i.x - o.x, i.y - o.y) < o.r + i.r + 6);
      if (close) { attach(i); break; }
    }
    const bus = s.items.find(i => i.kind === "bus");
    if (!s.delivered && bus.attached && Math.hypot(s.player.x - depot.x, s.player.y - depot.y) < 150 && Math.abs(bus.x - depot.x) + bus.r < depot.w / 2 && Math.abs(bus.y - depot.y) + bus.r < depot.h / 2) {
      s.delivered = true; deliveryStart = s.time; cancel(); emit("delivery");
    }
    if (s.delivered && s.phase !== "won") { s.deliveryProgress = clamp((s.time - deliveryStart) / 2600, 0, 1); if (s.deliveryProgress === 1) { s.phase = "won"; emit("win"); } }
    s.crash = Math.max(0, s.crash - sec);
    for (const p of s.sparks) { p.x += p.vx * sec; p.y += p.vy * sec; p.life -= sec; }
    s.sparks = s.sparks.filter(p => p.life > 0); for (const p of s.popups) p.life -= sec; s.popups = s.popups.filter(p => p.life > 0);
    if (moving && s.time - lastTrack > 120) { s.tracks.push({ x: s.player.x, y: s.player.y, a: s.player.angle }); if (s.tracks.length > 60) s.tracks.shift(); lastTrack = s.time; }
    s.camera.width += (Math.min(1340, 1040 + s.radius * 1.5) - s.camera.width) * .025;
    s.camera.x += (clamp(s.delivered ? depot.x : s.player.x, 430, city.width - 430) - s.camera.x) * .04; s.camera.y += (clamp(s.delivered ? depot.y : s.player.y, 320, city.height - 320) - s.camera.y) * .04;
    sync();
  }
  reset();
  // Safe bays replace live poses; a legacy collected bus now resumes the return trip.
  try {
    const data = checkpoint?.data;
    const legacy = checkpoint?.version === 1, busId = s.items.find(i => i.kind === "bus").id;
    if (checkpoint?.id === s.id && [1, 2].includes(checkpoint.version) && JSON.stringify(checkpoint).length < 8192 && Array.isArray(data?.collected) && Array.isArray(data?.seen) && data.collected.length <= s.items.length && new Set(data.collected).size === data.collected.length && new Set(data.seen).size === data.seen.length && [...data.collected, ...data.seen].every(id => Number.isInteger(id) && id >= 0 && id < s.items.length) && data.collected.every(id => data.seen.includes(id))) {
      let power = 0; const valid = data.seen.every(id => { const item = s.items[id]; if (item.need > power) return false; power += item.mass; return true; });
      const validExtra = legacy || ([0, 1, 2].includes(data.zone) && typeof data.delivered === "boolean" && (!data.delivered || (data.collected.includes(busId) && data.zone === 0)) && (data.busLoose === null || (data.seen.includes(busId) && !data.collected.includes(busId) && Number.isFinite(data.busLoose?.x + data.busLoose?.y) && clear(data.busLoose.x, data.busLoose.y, s.items[busId].r))));
      if (valid && validExtra) {
        const pending = data.collected.map(id => s.items[id]);
        const zone = legacy ? pending.some(i => i.kind === "bus") ? 2 : 0 : data.zone, safe = city.zones[zone];
        Body.setPosition(root, { x: safe.x, y: safe.y }); restoring = true; const old = active; active = false;
        for (const i of pending) attach(i); active = old; restoring = false;
        // Compound extents vary with cargo: verify the entire assembly, not only the core.
        const candidates = [safe, ...city.zones.filter(z => z !== safe)];
        const placed = candidates.some(p => { const dx = p.x - core.position.x, dy = p.y - core.position.y; Body.translate(root, { x: dx, y: dy }); return Query.collides(root, walls).length === 0; });
        if (!placed) throw new Error("No safe cargo bay");
        seen.clear(); data.seen.forEach(id => seen.add(id)); s.power = power; s.sparks = []; s.popups = [];
        s.delivered = !legacy && data.delivered; s.phase = s.delivered ? "won" : "playing"; s.deliveryProgress = s.delivered ? 1 : 0; s.trafficGrace = 2.5;
        if (!legacy && data.busLoose && !s.items[busId].attached) Body.setPosition(parts.get(busId), { x: data.busLoose.x, y: data.busLoose.y });
        sync(); cancel(); s.camera.x = clamp(s.player.x, 430, city.width - 430); s.camera.y = clamp(s.player.y, 320, city.height - 320);
      }
    }
  } catch { active = true; restoring = false; reset(); }
  const api = { scene: s,
    step(ms) { if (!active || !Number.isFinite(ms) || ms <= 0) return; accumulator += Math.min(50, ms); while (accumulator + 1e-8 >= 1000 / 120) { accumulator -= 1000 / 120; update(1000 / 120); } },
    pointer(type, x, y, pointerType = "mouse", point = {}) {
      if (!active || s.phase !== "playing" || s.delivered || !Number.isFinite(x + y) || x < 0 || x > 960 || y < 0 || y > 540) return false;
      if (type === "up") { if (pointerType === "touch") cancel(); return true; }
      if (!["down", "move", "hover"].includes(type)) return false;
      const wx = point.worldX, wy = point.worldY; if (!Number.isFinite(wx + wy) || wx < 30 || wx > city.width - 30 || wy < 30 || wy > city.height - 30) return false;
      target = { x: wx, y: wy }; started = collecting = true; return true;
    },
    key(key, down) { if (!active) return false; if (!["w", "a", "s", "d", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(key)) return false; if (down && s.phase === "playing" && !s.delivered) { keys.add(key); target = null; started = collecting = true; } else keys.delete(key); if (!keys.size && !target) cancel(); return true; },
    primary() { if (!active) return false; reset(); return true; }, secondary() { return false; }, retry() { return api.primary(); }, next() { return api.primary(); },
    setLevel(n) { return n === 0 && api.primary(); }, cancel() { if (active) cancel(); },
    checkpoint() { const bus = s.items.find(i => i.kind === "bus"), loose = seen.has(bus.id) && !bus.attached && clear(bus.x, bus.y, bus.r); return { version: 2, id: s.id, data: { collected: s.items.filter(i => i.attached).map(i => i.id), seen: [...seen], zone: s.delivered ? 0 : s.zone, delivered: s.delivered, busLoose: loose ? { x: Math.round(bus.x * 100) / 100, y: Math.round(bus.y * 100) / 100 } : null } }; },
    snapshot() { return { id: s.id, active, level: 0, time: Math.round(s.time), phase: s.phase, mode: s.mode, score: s.score, progress: s.progress, goal: s.goal, power: s.power, collected: s.collected, zone: s.zone, delivered: s.delivered, status: s.status, primaryLabel: s.primaryLabel, primaryEnabled: true, secondaryLabel: "", abilityAvailable: false }; },
    stop() { if (!active) return; cancel(); active = false; }, destroy() { api.stop(); Events.off(engine); Composite.clear(engine.world, false); Engine.clear(engine); },
  };
  return api;
}

export function paintMagnet() {}
