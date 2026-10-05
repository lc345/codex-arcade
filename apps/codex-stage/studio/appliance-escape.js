import { createRapier } from "../vendor/rapier.js";

export function createApplianceWorld({ checkpoint, onEvent = () => {} } = {}) {
  const R = createRapier(), dt = 1 / 120, clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const clone = v => JSON.parse(JSON.stringify(v)), finite = (...v) => v.every(Number.isFinite), distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const definitions = [
    { id: "lamp", name: "台灯", x: -5.5, z: -2.7, y: .62, w: .75, h: 1.2, d: .7, mass: 1.6, angle: 0 },
    { id: "fan", name: "风扇", x: -3.2, z: -.7, y: .64, w: .9, h: 1.25, d: .9, mass: 8, angle: 0 },
    { id: "vacuum", name: "扫地机", x: -5.5, z: 2.4, y: .26, w: 1.1, h: .5, d: 1.1, mass: 4, angle: 0 },
    { id: "vendor", name: "售货机", x: .8, z: 3.4, y: 1.1, w: 1.25, h: 2.2, d: 1.05, mass: 50, angle: -.5 },
    { id: "rack", name: "带轮货架", x: -.2, z: -.7, y: .83, w: 1.3, h: 1.6, d: .7, mass: 2.8, angle: 0 },
    { id: "robot", name: "待修机器人", x: -6, z: 3.8, y: .36, w: .6, h: .7, d: .6, mass: 1, angle: 0 },
  ];
  const s = { id: "appliance-escape", level: 0, goal: 1, devices: [], objects: [], room: { sensor: { x: 3.8, z: -2 }, plate: { x: 2.65, z: -.7 }, pedal: { x: 3.63, z: 1.8 }, exit: { x: 6.6, z: 0 } } };
  let world, door, joint, active = true, disposed = false, accumulator = 0, pointer = null, keys = new Set();
  const bodies = new Map(), entities = new Map();
  const emit = type => { if (active) onEvent({ type: `appliance-${type}` }); };
  const live = () => active && s.phase === "playing";
  const selected = () => entities.get(s.selected);
  const wake = () => { s.awaiting = false; };
  function box(x, y, z, w, h, d) { const b = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x, y, z)); world.createCollider(R.ColliderDesc.cuboid(w / 2, h / 2, d / 2).setFriction(.35), b); return b; }
  function addEntity(def, can = false) {
    const e = { ...def, on: false, speed: 0, flash: 0, rotation: { x: 0, y: 0, z: 0, w: 1 } };
    const desc = e.id === "vendor" ? R.RigidBodyDesc.fixed() : R.RigidBodyDesc.dynamic().setLinearDamping(can ? 1.5 : 2).setAngularDamping(3).setCcdEnabled(true);
    if (!can) desc.lockRotations();
    const b = world.createRigidBody(desc.setTranslation(e.x, e.y, e.z));
    const shape = can ? R.ColliderDesc.cylinder(.21, .16) : e.id === "vacuum" ? R.ColliderDesc.cylinder(.25, .55) : R.ColliderDesc.cuboid(e.w / 2, e.h / 2, e.d / 2);
    world.createCollider(shape.setMass(e.mass).setFriction(can ? .12 : e.id === "rack" || e.id === "vacuum" ? .08 : .25).setRestitution(can ? .25 : .02), b);
    entities.set(e.id, e); bodies.set(e.id, b); return e;
  }
  function load() {
    world?.free(); world = new R.World({ x: 0, y: -9.81, z: 0 }); world.timestep = dt; bodies.clear(); entities.clear(); keys.clear(); joint = null; accumulator = 0; pointer = null;
    Object.assign(s, { phase: "playing", time: 0, score: 0, progress: 0, selected: "lamp", awaiting: true, planning: false, target: null, carry: null, cooldown: 0, canSerial: 0,
      gate: 0, power: 0, pulse: 0, light: false, plate: false, wedge: false, route: "", routes: [], notice: "", noticeUntil: 0, transfer: null, noise: null, splatter: 0,
      guard: { x: 1.4, z: -3.5, angle: Math.PI / 2, leg: 0, alarm: 0, investigate: 0, target: null, watching: false }, bumps: 0 });
    box(0, -.18, 0, 17, .3, 11); box(-8.2, 1, 0, .35, 2, 10.5); box(8.2, 1, 0, .35, 2, 10.5); box(0, 1, -5.2, 16.5, 2, .35); box(0, 1, 5.2, 16.5, 2, .35);
    box(4, 1, -3.35, .3, 2, 3.5); box(4, 1, 3.35, .3, 2, 3.5);
    door = world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(4, 1.2, 0)); world.createCollider(R.ColliderDesc.cuboid(.15, 1.2, 1.6).setFriction(.1), door);
    for (const d of definitions) addEntity(d); sync();
  }
  function sync() {
    for (const [id, e] of entities) { const b = bodies.get(id), p = b.translation(), q = b.rotation(), v = b.linvel(); Object.assign(e, p, { speed: Math.hypot(v.x, v.z), rotation: { ...q } }); }
    s.devices = definitions.slice(0, 4).map(d => entities.get(d.id)); s.objects = [...entities.values()];
    const d = selected(); s.primaryLabel = s.phase !== "playing" ? "重新营业" : d.id === "vacuum" ? s.carry ? "卸载" : "拾取" : d.id === "vendor" ? "弹出饮料" : d.on ? "关闭" : "启动";
    s.secondaryLabel = s.planning ? "继续时间" : "停下思考"; s.abilityAvailable = s.phase === "playing";
    const action = d.id === "lamp" ? "照向光敏开关" : d.id === "fan" ? "风会推动附近轻物件" : d.id === "vendor" ? "饮料罐能撞检修踏板，也能卡门" : s.carry ? `载着${entities.get(s.carry).name}` : "靠近台灯或机器人可拾取";
    s.status = s.phase === "won" ? `机器人安全抵达维修出口 · ${s.route}` : s.phase === "lost" ? "被巡检机锁定，电流中断。可以立即重试。" : s.noticeUntil > s.time ? s.notice : `${d.name} · ${action}${s.planning ? " · 时间暂停" : ""}`;
    s.title = "打烊后的家电卖场";
  }
  function notice(text) { s.notice = text; s.noticeUntil = s.time + 2000; sync(); return false; }
  function possess(id) {
    if (!live() || !definitions.slice(0, 4).some(e => e.id === id)) return false;
    const next = entities.get(id), old = selected(); if (s.carry === id) return notice("先把电器放到地上，再转移电流。");
    if (distance(old, next) > 5.6) return notice("距离太远，先移动一台电器搭桥。");
    s.transfer = { x: old.x, z: old.z, to: id, at: s.time }; s.selected = id; s.target = null; keys.clear(); sync(); emit("transfer"); return true;
  }
  function aim(x, z) {
    if (!live() || !finite(x, z) || Math.abs(x) > 8 || Math.abs(z) > 5) return false;
    const d = selected(); if (d.id === "vacuum") return drive(x, z);
    if (distance(d, { x, z }) > .15) d.angle = Math.atan2(z - d.z, x - d.x); sync(); return true;
  }
  function drive(x, z) { if (!live() || s.selected !== "vacuum" || !finite(x, z) || Math.abs(x) > 7.8 || Math.abs(z) > 4.8) return false; s.target = { x, z }; wake(); return true; }
  function soundAt(x, z, strength = 1) { s.noise = { x, z, until: s.time + 1800, strength }; s.guard.target = { x: clamp(x, -.5, 3.1), z: clamp(z, -4.3, 4.3) }; s.guard.investigate = 4.5; emit("clatter"); }
  function latch(id, restoring = false) {
    const v = bodies.get("vacuum"), b = bodies.get(id), p = v.translation();
    const height = id === "lamp" ? .9 : .62;
    if (!restoring) { b.setTranslation({ x: p.x, y: p.y + height, z: p.z }, true); b.setLinvel(v.linvel(), true); }
    joint = world.createImpulseJoint(R.JointData.fixed({ x: 0, y: height, z: 0 }, { x: 0, y: 0, z: 0, w: 1 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 1 }), v, b, true); joint.setContactsEnabled(false); s.carry = id;
  }
  function release(dropped = false) {
    if (!s.carry) return false; const id = s.carry, b = bodies.get(id), v = entities.get("vacuum");
    const destination = { x: v.x + Math.cos(v.angle) * 1.1, z: v.z + Math.sin(v.angle) * 1.1 };
    if (!dropped && (!clearLine(v, destination) || Math.abs(destination.x) > 7.6 || Math.abs(destination.z) > 4.6 || s.objects.some(e => !["vacuum", id].includes(e.id) && !e.id.startsWith("can") && Math.abs(destination.x - e.x) < e.w / 2 + .3 && Math.abs(destination.z - e.z) < e.d / 2 + .3))) return notice("前面没有安全卸货的位置，换个方向。");
    world.removeImpulseJoint(joint, true); joint = null; s.carry = null;
    if (!dropped) { b.setTranslation({ ...destination, y: entities.get(id).h / 2 + .2 }, true); b.setLinvel({ x: 0, y: 0, z: 0 }, true); }
    if (dropped) { s.bumps++; soundAt(v.x, v.z); notice("货物滑落了，靠近后可以重新拾取。"); }
    sync(); emit("load"); return true;
  }
  function dispense() {
    if (s.cooldown > 0) return false; const d = selected(), ux = Math.cos(d.angle), uz = Math.sin(d.angle);
    const cans = s.objects.filter(e => e.id.startsWith("can"));
    if (cans.length >= 5) { const old = cans.find(e => !(Math.abs(e.x - 4) < .7 && Math.abs(e.z) < 1.45)); if (!old) return false; world.removeRigidBody(bodies.get(old.id)); bodies.delete(old.id); entities.delete(old.id); }
    const id = `can${s.canSerial % 6}`; s.canSerial++; if (bodies.has(id)) { world.removeRigidBody(bodies.get(id)); bodies.delete(id); entities.delete(id); }
    addEntity({ id, name: "饮料罐", x: d.x + ux * .9, y: .35, z: d.z + uz * .9, w: .32, h: .42, d: .32, mass: .45, angle: 0 }, true);
    bodies.get(id).setLinvel({ x: ux * 5.8, y: .7, z: uz * 5.8 }, true); s.cooldown = .9; soundAt(d.x, d.z); sync(); emit("vend"); return true;
  }
  function primary() {
    if (!active) return false; if (s.phase !== "playing") return api.retry();
    const d = selected(); wake();
    if (d.id === "vacuum") {
      if (s.carry) return release();
      const near = [entities.get("lamp"), entities.get("robot")].filter(e => distance(e, d) < 1.5).sort((a, b) => distance(a, d) - distance(b, d))[0];
      if (!near) return notice("靠近台灯或待修机器人，再拾取。"); latch(near.id); s.target = null; sync(); emit("load"); return true;
    }
    if (d.id === "vendor") return dispense();
    d.on = !d.on; if (d.id === "fan" && d.on) soundAt(d.x, d.z, .5); sync(); emit(d.on ? "switch" : "off"); return true;
  }
  function secondary() { if (!live()) return false; s.planning = !s.planning; keys.clear(); pointer = null; sync(); emit("pause"); return true; }
  function clearLine(a, b) {
    for (const e of s.objects.filter(e => e.id === "rack" || e.id === "vendor")) {
      if (distance(a, e) < .9 || distance(b, e) < .9) continue;
      const dx = b.x - a.x, dz = b.z - a.z, t = clamp(((e.x - a.x) * dx + (e.z - a.z) * dz) / (dx * dx + dz * dz || 1), 0, 1);
      if (Math.abs(a.x + dx * t - e.x) < e.w / 2 + .1 && Math.abs(a.z + dz * t - e.z) < e.d / 2 + .1) return false;
    }
    if ((a.x - 4) * (b.x - 4) < 0) { const z = a.z + (b.z - a.z) * (4 - a.x) / (b.x - a.x); if (Math.abs(z) > 1.6 || s.gate < .8) return false; }
    return true;
  }
  function update() {
    if (!live() || s.planning || s.awaiting) return;
    s.time += dt * 1000; s.cooldown = Math.max(0, s.cooldown - dt); s.pulse = Math.max(0, s.pulse - dt); s.splatter = Math.max(0, s.splatter - dt);
    const vac = entities.get("vacuum"), vb = bodies.get("vacuum"), vel = vb.linvel(), oldSpeed = vac.speed;
    for (const [id, b] of bodies) if (id !== "vendor") b.resetForces(false);
    let dx = Number(keys.has("d") || keys.has("ArrowRight")) - Number(keys.has("a") || keys.has("ArrowLeft")), dz = Number(keys.has("s") || keys.has("ArrowDown")) - Number(keys.has("w") || keys.has("ArrowUp"));
    if (s.selected !== "vacuum") { dx = dz = 0; } else if (!dx && !dz && s.target) { dx = s.target.x - vac.x; dz = s.target.z - vac.z; if (Math.hypot(dx, dz) < .13) { s.target = null; dx = dz = 0; } }
    const len = Math.hypot(dx, dz), speed = s.carry ? 2.3 : 3.1;
    if (len) vac.angle = Math.atan2(dz, dx);
    const scale = len ? Math.min(1, len / .55) * speed / len : 0;
    vb.addForce({ x: clamp((dx * scale - vel.x) * 50, -80, 80), y: 0, z: clamp((dz * scale - vel.z) * 50, -80, 80) }, true);
    const fan = entities.get("fan"), lamp = entities.get("lamp");
    if (fan.on && s.carry !== "fan") {
      const ux = Math.cos(fan.angle), uz = Math.sin(fan.angle);
      for (const e of s.objects) { if (["fan", "vendor", "vacuum"].includes(e.id) || s.carry === e.id) continue; const ex = e.x - fan.x, ez = e.z - fan.z, along = ex * ux + ez * uz, side = Math.abs(ex * uz - ez * ux);
        if (along > 0 && along < 7 && side < .65 + along * .2 && clearLine(fan, e)) bodies.get(e.id).addForce({ x: ux * 14, y: 0, z: uz * 14 }, true);
      }
      s.splatter = .5;
    }
    const sensor = s.room.sensor, la = Math.atan2(sensor.z - lamp.z, sensor.x - lamp.x), angular = Math.atan2(Math.sin(la - lamp.angle), Math.cos(la - lamp.angle));
    s.light = lamp.on && s.carry !== "lamp" && distance(lamp, sensor) < 6.5 && Math.abs(angular) < .19 && clearLine(lamp, sensor);
    s.power = clamp(s.power + dt * (s.light ? 2 : -.24), 0, 1);
    s.plate = s.objects.some(e => e.id !== "vendor" && e.id !== s.carry && e.mass >= 2.5 && Math.abs(e.x - s.room.plate.x) < 1 && Math.abs(e.z - s.room.plate.z) < .7);
    const wedge = s.objects.some(e => e.id.startsWith("can") && Math.abs(e.x - 4) < .65 && Math.abs(e.z) < 1.4 && e.y < .6);
    s.wedge = wedge && (s.gate > .3 || s.wedge);
    for (const e of s.objects.filter(e => e.id.startsWith("can"))) if (distance(e, s.room.pedal) < .52 && e.speed > .7) { if (s.pulse < 8) { s.pulse = 12; soundAt(e.x, e.z); emit("bell"); } }
    const reason = s.power > .05 ? "光敏线路" : s.plate ? "货架配重" : s.wedge ? "饮料罐卡门" : s.pulse > 0 ? "检修踏板" : "";
    if (reason && !s.routes.includes(reason)) s.routes.push(reason);
    const occupied = s.gate > .8 && s.objects.some(e => Math.abs(e.x - 4) < .7 && Math.abs(e.z) < 1.5);
    s.gate = clamp(s.gate + dt * (reason || occupied ? 1.9 : -1.15), 0, 1); door.setNextKinematicTranslation({ x: 4, y: 1.2 + s.gate * 2.8, z: 0 });
    world.step(); sync();
    if (s.carry && oldSpeed > 2 && vac.speed < oldSpeed - 1.3) release(true);
    const guard = s.guard, patrol = [{ x: 2.5, z: -3.5 }, { x: 2.5, z: 2.2 }, { x: .2, z: 2.2 }, { x: .2, z: -3.5 }];
    if (lamp.on && !s.light && s.carry !== "lamp" && !(s.noise?.until > s.time)) {
      const spot = { x: clamp(lamp.x + Math.cos(lamp.angle) * 5, -.5, 3.1), z: clamp(lamp.z + Math.sin(lamp.angle) * 5, -4.3, 4.3) };
      if (distance(guard, spot) < 4.5 && clearLine(lamp, spot)) { guard.target = spot; guard.investigate = Math.max(guard.investigate, .4); }
    }
    guard.investigate = Math.max(0, guard.investigate - dt);
    const target = guard.investigate > 0 && guard.target ? guard.target : patrol[guard.leg], gx = target.x - guard.x, gz = target.z - guard.z, gl = Math.hypot(gx, gz);
    if (gl > .15) { guard.angle = Math.atan2(gz, gx); const next = { x: guard.x + gx / gl * dt * .85, z: guard.z + gz / gl * dt * .85 }; if (clearLine(guard, next) && !s.objects.some(e => e.id === "rack" && Math.abs(next.x - e.x) < .95 && Math.abs(next.z - e.z) < .65)) Object.assign(guard, next); }
    else if (guard.investigate <= 0) guard.leg = (guard.leg + 1) % patrol.length;
    const d = selected(), facing = Math.cos(Math.atan2(d.z - guard.z, d.x - guard.x) - guard.angle), suspicious = d.id === "vacuum" ? d.speed > .3 : d.id === "vendor" ? s.cooldown > .4 : d.on;
    guard.watching = Boolean(suspicious && distance(guard, d) < 3.4 && facing > .58 && clearLine(guard, d)); guard.alarm = clamp(guard.alarm + dt * (guard.watching ? 34 : -22), 0, 100);
    if (guard.alarm >= 100) { s.phase = "lost"; s.target = null; keys.clear(); emit("caught"); }
    const robot = entities.get("robot");
    if (s.phase === "playing" && robot.x > 5.65 && Math.abs(robot.z) < 1.25 && robot.y < 1.6) { s.phase = "won"; s.score = 1000; s.progress = 1; s.route = reason || s.routes.at(-1) || "维修通道"; s.target = null; keys.clear(); emit("win"); }
    sync();
  }
  function save() {
    const body = s.objects.map(e => { const b = bodies.get(e.id), p = b.translation(), v = b.linvel(), q = b.rotation(), a = b.angvel(); return [e.id, p.x, p.y, p.z, v.x, v.y, v.z, q.x, q.y, q.z, q.w, a.x, a.y, a.z, e.angle, e.on]; });
    return clone({ version: 1, id: s.id, phase: s.phase, selected: s.selected, time: s.time, awaiting: s.awaiting, planning: s.planning, carry: s.carry, cooldown: s.cooldown, canSerial: s.canSerial, gate: s.gate, power: s.power, pulse: s.pulse, wedge: s.wedge, route: s.route, routes: s.routes, guard: s.guard, body });
  }
  function restore(v) {
    const bounded = (n, lo, hi) => Number.isFinite(n) && n >= lo && n <= hi;
    try {
      if (!v || v.version !== 1 || v.id !== s.id || JSON.stringify(v).length > 8192 || !["playing", "won", "lost"].includes(v.phase) || !definitions.slice(0, 4).some(e => e.id === v.selected)) return;
      if (!Array.isArray(v.body) || v.body.length < 6 || v.body.length > 11 || new Set(v.body.map(a => a[0])).size !== v.body.length || !definitions.every(d => v.body.some(a => a[0] === d.id))) return;
      for (const a of v.body) { if (!Array.isArray(a) || a.length !== 16 || !(definitions.some(d => d.id === a[0]) || /^can[0-5]$/.test(a[0])) || !a.slice(1, 15).every(Number.isFinite) || !bounded(a[1], -8, 8) || !bounded(a[3], -5, 5) || !bounded(a[2], -.5, 5) || a.slice(4, 7).some(n => Math.abs(n) > 30) || Math.abs(Math.hypot(...a.slice(7, 11)) - 1) > .02 || a.slice(11, 14).some(n => Math.abs(n) > 100) || Math.abs(a[14]) > 100 || typeof a[15] !== "boolean") return; }
      if (![v.awaiting, v.planning, v.wedge].every(b => typeof b === "boolean") || ![null, "lamp", "robot"].includes(v.carry) || v.carry === v.selected || !bounded(v.time, 0, 1e9) || !bounded(v.cooldown, 0, .9) || !Number.isInteger(v.canSerial) || !bounded(v.canSerial, 0, 1e6) || ![v.gate, v.power].every(n => bounded(n, 0, 1)) || !bounded(v.pulse, 0, 12)) return;
      const routes = ["光敏线路", "货架配重", "饮料罐卡门", "检修踏板"];
      if (!Array.isArray(v.routes) || v.routes.length > 4 || !v.routes.every(r => routes.includes(r)) || !["", ...routes, "维修通道"].includes(v.route)) return;
      const g = v.guard;
      if (!g || !bounded(g.x, -.5, 3.2) || !bounded(g.z, -4.4, 4.4) || !bounded(g.angle, -Math.PI, Math.PI) || !Number.isInteger(g.leg) || !bounded(g.leg, 0, 3) || !bounded(g.alarm, 0, 100) || !bounded(g.investigate, 0, 4.5) || typeof g.watching !== "boolean" || g.target && (!bounded(g.target.x, -.5, 3.1) || !bounded(g.target.z, -4.3, 4.3))) return;
      const robot = v.body.find(a => a[0] === "robot"); if (v.phase === "won" && !(robot[1] > 5.65 && Math.abs(robot[3]) < 1.25 && robot[2] < 1.6) || v.phase === "lost" && g.alarm !== 100) return;
      for (const a of v.body) { if (!entities.has(a[0])) addEntity({ id: a[0], name: "饮料罐", x: a[1], y: a[2], z: a[3], w: .32, h: .42, d: .32, mass: .45, angle: 0 }, true);
        const b = bodies.get(a[0]); b.setTranslation({ x: a[1], y: a[2], z: a[3] }, true); b.setLinvel({ x: a[4], y: a[5], z: a[6] }, true); b.setRotation({ x: a[7], y: a[8], z: a[9], w: a[10] }, true); b.setAngvel({ x: a[11], y: a[12], z: a[13] }, true); Object.assign(entities.get(a[0]), { angle: a[14], on: a[15] });
      }
      Object.assign(s, { phase: v.phase, selected: v.selected, time: v.time, awaiting: v.awaiting, planning: v.planning, cooldown: v.cooldown, canSerial: v.canSerial, gate: v.gate, power: v.power, pulse: v.pulse, wedge: v.wedge, route: v.route, routes: [...v.routes], guard: { x: g.x, z: g.z, angle: g.angle, leg: g.leg, alarm: g.alarm, investigate: g.investigate, watching: g.watching, target: g.target ? { x: g.target.x, z: g.target.z } : null }, score: v.phase === "won" ? 1000 : 0, progress: v.phase === "won" ? 1 : 0 });
      if (v.carry) latch(v.carry, true); door.setTranslation({ x: 4, y: 1.2 + s.gate * 2.8, z: 0 }, true); sync();
    } catch { load(); }
  }
  const api = { scene: s, effects: [], possess, aim, drive, primary, secondary, checkpoint: save, clearLine,
    step(ms) { if (!active || !finite(ms) || ms <= 0 || s.planning || s.awaiting) return; accumulator += Math.min(50, ms); while (accumulator >= dt * 1000) { update(); accumulator -= dt * 1000; } },
    pointer(type, x, y, _pointerType, detail = {}) {
      if (!live() || !finite(x, y)) return false;
      if (x < 0 || x > 960 || y < 0 || y > 540) { if (type === "up") pointer = null; return false; }
      const floor = detail.floor;
      if (type === "down") { pointer = { x, y, entity: detail.entity, floor, moved: false }; return true; }
      if (type === "move" && pointer) { pointer.moved ||= Math.hypot(x - pointer.x, y - pointer.y) > 5; if (pointer.moved && floor) aim(floor.x, floor.z); return true; }
      if (type === "up" && pointer) { const p = pointer; pointer = null; if (p.moved) return true;
        if (y > 466) { if (x < 620) return possess(["lamp", "fan", "vacuum", "vendor"][Math.floor(x / 155)]); if (x < 770) return secondary(); return primary(); }
        if (p.entity && definitions.slice(0, 4).some(d => d.id === p.entity)) return possess(p.entity);
        return floor ? aim(floor.x, floor.z) : false;
      } return false;
    },
    key(key, down) {
      if (!active) return false;
      if (!down) { keys.delete(key); return true; }
      if (!live()) return false;
      if (["1", "2", "3", "4"].includes(key)) return possess(["lamp", "fan", "vacuum", "vendor"][Number(key) - 1]);
      if (key === "Escape") { api.cancel(); return true; }
      if ([" ", "Enter", "e"].includes(key)) return primary();
      if (["w", "a", "s", "d", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(key)) { wake(); if (s.selected === "vacuum") { keys.add(key); s.target = null; } else { const d = selected(); d.angle += ["a", "ArrowLeft", "w", "ArrowUp"].includes(key) ? -.12 : .12; } return true; }
      return false;
    },
    cancel() { pointer = null; keys.clear(); s.target = null; },
    retry() { if (!active) return false; load(); return true; }, next() { return api.retry(); }, setLevel(n) { return n === 0 && api.retry(); },
    snapshot() { return { id: s.id, level: 0, phase: s.phase, time: Math.round(s.time), score: s.score, progress: s.progress, goal: 1, selected: s.selected, carry: s.carry, planning: s.planning, awaiting: s.awaiting, alert: Math.round(s.guard.alarm), gate: Math.round(s.gate * 10), status: s.status, abilityAvailable: s.abilityAvailable }; },
    stop() { if (!active) return; api.cancel(); active = false; }, destroy() { if (disposed) return; api.stop(); disposed = true; world.free(); bodies.clear(); entities.clear(); },
  };
  load(); restore(checkpoint); return api;
}

export function paintAppliance() {}
