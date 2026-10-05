import { createStudioKernel } from "./kernel.js";

export function createKitchenWorld(options = {}) {
  const g = createStudioKernel("kitchen-defense", options), s = g.scene;
  const equipment = [
    { kind: "pop", name: "爆米花炮", cost: 45, color: "#d84c51", range: 156, cooldown: .52 },
    { kind: "frost", name: "冷冻柜", cost: 50, color: "#359cba", range: 148, cooldown: 1.65 },
    { kind: "pan", name: "弹簧锅", cost: 55, color: "#e6ad35", range: 148, cooldown: 2.7 },
    { kind: "heat", name: "电磁炉", cost: 60, color: "#eb7250", range: 150, cooldown: .85 },
  ];
  const robots = {
    scout: { hp: 56, speed: 65, bounty: 12, damage: 1 },
    runner: { hp: 42, speed: 108, bounty: 10, damage: 1 },
    shell: { hp: 148, speed: 49, bounty: 18, damage: 2 },
    boss: { hp: 850, speed: 36, bounty: 80, damage: 8 },
  };
  const recipes = {
    steam: { name: "蒸汽回声", detail: "冷热冲击范围扩大，伤害 +18", color: "#329ba0" },
    spring: { name: "双倍弹簧", detail: "击退更远，追尾冲击更强", color: "#dfa828" },
    ricochet: { name: "跳跳玉米", detail: "爆米花命中后弹向另一目标", color: "#d64d59" },
    frostbite: { name: "深度冷冻", detail: "冷气持续更久，减速更强", color: "#469fc0" },
    overdrive: { name: "旺火快炒", detail: "所有厨具冷却缩短 16%", color: "#e7754d" },
    tips: { name: "大方食客", detail: "立即获得 70 枚金币", color: "#669b59" },
  };
  const waves = [
    ["scout", "scout", "runner", "scout", "scout", "runner"],
    ["runner", "scout", "runner", "runner", "shell", "scout", "runner", "scout"],
    ["shell", "scout", "runner", "shell", "runner", "scout", "shell", "runner", "scout"],
    ["runner", "runner", "shell", "scout", "shell", "runner", "shell", "runner", "scout", "shell"],
    ["shell", "runner", "boss", "runner", "scout", "shell", "runner", "runner", "shell", "scout"],
  ];
  const route = [[910, 166], [165, 166], [165, 288], [795, 288], [795, 410], [75, 410]];
  const lengths = route.slice(1).map((p, i) => Math.hypot(p[0] - route[i][0], p[1] - route[i][1]));
  const total = lengths.reduce((a, b) => a + b, 0);
  let live = true, pressed = null;
  const count = id => s.perks.filter(p => p === id).length;
  const spec = id => equipment.find(t => t.kind === id);
  const canAct = () => live && s.phase === "playing";
  function position(d) {
    d = Math.max(0, Math.min(total, d));
    for (let i = 0; i < lengths.length; i++) {
      if (d <= lengths[i]) { const a = route[i], b = route[i + 1], f = d / lengths[i]; return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, angle: Math.atan2(b[1] - a[1], b[0] - a[0]) }; }
      d -= lengths[i];
    }
    return { x: 75, y: 410, angle: Math.PI };
  }
  function effect(kind, x, y, size = 50, text = "") {
    s.fx.push({ kind, x, y, size, text, life: 1, total: 1 });
    if (s.fx.length > 60) s.fx.shift();
  }
  function labels() {
    s.primaryLabel = s.mode === "prep" ? `开餐 · 第 ${s.wave + 1} 波` : s.mode === "reward" ? "收下配方" : "清扫队来袭";
    s.secondaryLabel = s.bell > 0 ? `摇铃 ${Math.ceil(s.bell)}s` : "摇铃救场";
    s.abilityAvailable = s.mode === "battle" && s.bell <= 0;
    s.progress = s.wave; s.goal = 5;
  }
  g.build = () => {
    Object.assign(s, { equipment, recipes, route, routeLength: total, coins: 150, lives: 8, wave: 0, mode: "prep", enemies: [], shots: [], fx: [], perks: [], offers: [], cursor: 0, selectedKind: 0, selectedSlot: -1, rewardCursor: 0, bell: 0, bellFlash: 0, spawned: 0, spawnClock: 0, nextId: 1, battleTime: 0, kills: 0, combos: { steam: 0, bounce: 0, collision: 0, ricochet: 0 }, status: "晚班开张 · 厨具已就位", slots: Array.from({ length: 10 }, (_, i) => ({ x: 240 + (i % 5) * 130, y: i < 5 ? 230 : 348, tower: null })) });
    s.slots[3].tower = { kind: "pop", level: 1, cooldown: 0, recoil: 0, spent: 45, angle: -Math.PI / 2 };
    labels();
  };
  function select(index) { s.selectedKind = index; s.selectedSlot = -1; s.status = `${equipment[index].name} · ${equipment[index].cost} 金币`; g.emit("kitchen-select"); }
  g.place = (kind, index) => {
    const item = spec(kind), slot = s.slots[index];
    if (!canAct() || s.mode === "reward" || !item || !slot || slot.tower || s.coins < item.cost) return false;
    s.coins -= item.cost; slot.tower = { kind, level: 1, cooldown: .15, recoil: 0, spent: item.cost, angle: -Math.PI / 2 };
    s.cursor = index; s.selectedSlot = index; s.status = `${item.name}就位`; effect("build", slot.x, slot.y, 40); g.emit("kitchen-build"); return true;
  };
  g.upgrade = (index = s.selectedSlot) => {
    const t = s.slots[index]?.tower;
    if (!canAct() || s.mode === "reward" || !t || t.level >= 2 || s.coins < 45) return false;
    s.coins -= 45; t.spent += 45; t.level++; t.recoil = .5; s.status = `${spec(t.kind).name} · 改装完成`;
    effect("build", s.slots[index].x, s.slots[index].y, 60); g.emit("kitchen-upgrade"); return true;
  };
  g.sell = (index = s.selectedSlot) => {
    const t = s.slots[index]?.tower;
    if (!canAct() || s.mode !== "prep" || !t) return false;
    s.coins += Math.floor(t.spent * .65); s.slots[index].tower = null; s.selectedSlot = -1; s.status = "厨具已回收"; g.emit("kitchen-select"); return true;
  };
  function startWave() {
    if (!canAct() || s.mode !== "prep" || s.wave >= 5) return false;
    s.wave++; s.mode = "battle"; s.spawned = 0; s.spawnClock = 0; s.battleTime = 0; s.bell = 0;
    s.status = ["第一批清扫机入场", "快递轮组 · 高速来袭", "铁壳护甲 · 注意火力搭配", "交叉混编 · 守住出餐口", "总管上线 · 装甲充能时减伤"][s.wave - 1];
    labels(); g.emit("kitchen-wave"); return true;
  }
  g.chooseReward = index => {
    if (!canAct() || s.mode !== "reward" || !Number.isInteger(index) || !s.offers[index]) return false;
    const id = s.offers[index]; s.perks.push(id); if (id === "tips") s.coins += 70;
    s.status = `${recipes[id].name} · 配方已生效`; s.offers = []; s.mode = "prep"; s.rewardCursor = 0;
    labels(); g.emit("kitchen-upgrade"); return true;
  };
  function damage(e, amount, physical = false) {
    if (e.hp <= 0) return;
    const armor = physical && (e.kind === "shell" || (e.kind === "boss" && e.age % 9 < 2.5));
    e.hp -= amount * (armor ? .42 : 1); e.hit = .14;
  }
  function steam(e) {
    const p = position(e.d), power = 26 + count("steam") * 18, radius = 88 + count("steam") * 18;
    e.chill = 0; e.shock = 2.5; s.combos.steam++; s.score += 30;
    for (const other of s.enemies) { const q = position(other.d); if (other.hp > 0 && Math.hypot(p.x - q.x, p.y - q.y) < radius) { damage(other, power); other.stun = Math.max(other.stun, other.kind === "boss" ? .15 : .6); } }
    effect("steam", p.x, p.y, radius, "蒸汽冲击"); s.status = "冷热交汇 · 蒸汽冲击"; g.emit("kitchen-steam");
  }
  function impact(e, amount) {
    damage(e, amount, true); const p = position(e.d); effect("pop", p.x, p.y, 12);
    if (count("ricochet")) {
      const next = s.enemies.filter(n => n !== e && n.hp > 0).sort((a, b) => Math.abs(a.d - e.d) - Math.abs(b.d - e.d))[0];
      if (next && Math.abs(next.d - e.d) < 140) { damage(next, amount * .7 * count("ricochet"), true); s.combos.ricochet++; const q = position(next.d); s.fx.push({ kind: "arc", x: p.x, y: p.y, tx: q.x, ty: q.y, size: 1, life: .25, total: .25 }); }
    }
  }
  function fire(slot, e) {
    const t = slot.tower, p = position(e.d); t.angle = Math.atan2(p.y - slot.y, p.x - slot.x); t.recoil = .25;
    if (t.kind === "pop") {
      s.shots.push({ x: slot.x, y: slot.y - 6, target: e.id, damage: t.level === 2 ? 16 : 9 });
      g.emit("kitchen-pop");
    } else if (t.kind === "frost") {
      const radius = t.level === 2 ? 76 : 38;
      for (const n of s.enemies) { const q = position(n.d); if (n.hp > 0 && Math.hypot(q.x - p.x, q.y - p.y) < radius) { n.chill = 2.8 + count("frostbite") * 1.2; damage(n, t.level === 2 ? 9 : 5); } }
      effect("frost", p.x, p.y, radius); g.emit("kitchen-frost");
    } else if (t.kind === "heat") {
      const radius = t.level === 2 ? 86 : 60;
      for (const n of s.enemies) { const q = position(n.d); if (n.hp > 0 && Math.hypot(q.x - p.x, q.y - p.y) < radius) { damage(n, t.level === 2 ? 15 : 10); n.heat = 1.6; if (n.chill > 0 && n.shock <= 0) steam(n); } }
      effect("heat", p.x, p.y, radius); g.emit("kitchen-heat");
    } else {
      const old = e.d, before = s.combos.collision, push = (t.level === 2 ? 175 : 125) + 65 * count("spring");
      damage(e, t.level === 2 ? 27 : 17); e.d = Math.max(0, e.d - push * (e.kind === "boss" ? .24 : 1)); e.stun = e.kind === "boss" ? .12 : .65;
      e.air = .55; s.combos.bounce++;
      for (const n of s.enemies) if (n !== e && n.hp > 0 && n.d < old && n.d >= e.d - 20) { damage(n, 13 + 10 * count("spring")); n.stun = .7; s.combos.collision++; }
      effect("pan", p.x, p.y, push, s.combos.collision > before ? "追尾连击" : "弹回去"); s.status = "弹簧锅起跳 · 清扫队倒车"; g.emit("kitchen-pan");
    }
  }
  function clearWave() {
    s.shots.length = 0; s.score += 150; s.coins += 40;
    if (s.wave === 5) { s.status = "出餐口守住了 · 晚班收工"; g.finish(true); g.emit("kitchen-win"); }
    else {
      s.mode = "reward"; s.offers = s.wave % 2 ? ["steam", "spring", "ricochet"] : ["frostbite", "overdrive", "tips"];
      s.rewardCursor = 0; s.status = "本轮清场 · 新配方到店"; g.emit("kitchen-clear");
    }
    labels();
  }
  g.update = dt => {
    for (const f of s.fx) f.life -= dt;
    s.fx = s.fx.filter(f => f.life > 0); s.bellFlash = Math.max(0, s.bellFlash - dt);
    for (const slot of s.slots) if (slot.tower) slot.tower.recoil = Math.max(0, slot.tower.recoil - dt);
    if (s.mode !== "battle") return;
    s.battleTime += dt; s.bell = Math.max(0, s.bell - dt);
    const wave = waves[s.wave - 1];
    if (s.spawned < wave.length) s.spawnClock -= dt;
    if (s.spawned < wave.length && s.spawnClock <= 0) {
      const kind = wave[s.spawned++], def = robots[kind];
      s.enemies.push({ id: s.nextId++, kind, d: 0, hp: def.hp, maxHp: def.hp, chill: 0, heat: 0, shock: 0, stun: 0, hit: 0, air: 0, age: 0 });
      s.spawnClock = kind === "boss" ? 3.5 : s.wave === 1 ? 2.4 : 1.5;
      if (kind === "boss") { s.status = "清扫总管 · 装甲充能"; g.emit("kitchen-boss"); }
    }
    for (const e of s.enemies) {
      if (e.hp <= 0) continue;
      for (const key of ["chill", "heat", "shock", "stun", "hit", "air"]) e[key] = Math.max(0, e[key] - dt);
      e.age += dt;
      if (e.heat > 0) damage(e, 5 * dt);
      if (e.stun <= 0) e.d += robots[e.kind].speed * dt * (e.chill > 0 ? Math.max(.27, .5 - count("frostbite") * .1) : 1);
      if (e.d >= total) { s.lives = Math.max(0, s.lives - robots[e.kind].damage); e.escaped = true; e.hp = 0; effect("leak", 75, 410, 40); g.emit("kitchen-leak"); s.status = "出餐口受损"; }
    }
    for (const slot of s.slots) {
      const t = slot.tower; if (!t) continue; t.cooldown -= dt;
      if (t.cooldown > 0) continue;
      const def = spec(t.kind), candidates = s.enemies.filter(e => { const p = position(e.d); return e.hp > 0 && Math.hypot(p.x - slot.x, p.y - slot.y) < def.range; });
      candidates.sort((a, b) => b.d - a.d);
      if (!candidates.length) continue;
      fire(slot, candidates[0]); t.cooldown = def.cooldown * (1 - Math.min(.48, count("overdrive") * .16)) * (t.level === 2 ? .88 : 1);
    }
    for (const shot of s.shots) {
      const target = s.enemies.find(e => e.id === shot.target && e.hp > 0);
      if (!target) { shot.done = true; continue; }
      const p = position(target.d), dx = p.x - shot.x, dy = p.y - shot.y, distance = Math.hypot(dx, dy);
      if (distance < 650 * dt + 10) { impact(target, shot.damage); shot.done = true; }
      else { shot.x += dx / distance * 650 * dt; shot.y += dy / distance * 650 * dt; }
    }
    s.shots = s.shots.filter(p => !p.done);
    for (const e of s.enemies) if (e.hp <= 0 && !e.escaped) { s.coins += robots[e.kind].bounty; s.score += robots[e.kind].bounty * 5; s.kills++; const p = position(e.d); effect("scrap", p.x, p.y, 26, `+${robots[e.kind].bounty}`); g.emit("kitchen-scrap"); }
    s.enemies = s.enemies.filter(e => e.hp > 0);
    if (s.lives <= 0) { s.status = "出餐口失守 · 换个布阵再来"; g.finish(false); g.emit("kitchen-lose"); }
    else if (s.spawned >= wave.length && !s.enemies.length) clearWave();
    labels();
  };
  g.act = () => s.mode === "reward" ? g.chooseReward(s.rewardCursor) : startWave();
  g.alt = () => {
    if (!canAct() || s.mode !== "battle" || s.bell > 0) return false;
    s.bell = 20; s.bellFlash = .7; s.status = "出餐铃响 · 清扫队暂停";
    for (const e of s.enemies) { e.stun = e.kind === "boss" ? .4 : 1.6; damage(e, 8); }
    g.emit("kitchen-bell"); labels(); return true;
  };
  function tap(x, y) {
    if (s.mode === "reward") { const n = Math.floor((x - 149) / 225); return y >= 195 && y <= 359 && x >= 149 && x < 811 ? g.chooseReward(n) : false; }
    if (y < 84 && x > 780) return startWave();
    if (y >= 465) {
      if (x >= 87 && x < 519) { select(Math.floor((x - 87) / 108)); return true; }
      if (x >= 532 && x < 665) return g.upgrade();
      if (x >= 668 && x < 752) return g.sell();
      if (x >= 768 && x < 927) return g.alt();
      return false;
    }
    const index = s.slots.findIndex(p => Math.hypot(p.x - x, p.y - y) < 39);
    if (index < 0) return false;
    s.cursor = index;
    if (s.slots[index].tower) { s.selectedSlot = index; s.status = `${spec(s.slots[index].tower.kind).name} · ${s.slots[index].tower.level === 2 ? "已改装" : "改装 45 金币"}`; return true; }
    return g.place(equipment[s.selectedKind].kind, index);
  }
  g.point = (type, x, y) => {
    if (type === "down") { pressed = { x, y }; return true; }
    if (type === "up") { const p = pressed; pressed = null; return p && Math.hypot(x - p.x, y - p.y) < 22 ? tap(x, y) : false; }
    return false;
  };
  g.keyboard = (key, down) => {
    if (!down) return false;
    if (s.mode === "reward") {
      if (key === "ArrowLeft" || key === "ArrowRight") { s.rewardCursor = (s.rewardCursor + (key === "ArrowLeft" ? 2 : 1)) % 3; return true; }
      if (key === " " || key === "Enter") return g.chooseReward(s.rewardCursor);
      return false;
    }
    if (key === "ArrowLeft" || key === "ArrowRight") { s.cursor = (s.cursor + (key === "ArrowLeft" ? 9 : 1)) % 10; s.selectedSlot = s.slots[s.cursor].tower ? s.cursor : -1; return true; }
    if (key === "ArrowUp" || key === "ArrowDown") { select((s.selectedKind + (key === "ArrowUp" ? 1 : 3)) % 4); return true; }
    if (key === " ") { if (s.slots[s.cursor].tower) g.upgrade(s.cursor); else g.place(equipment[s.selectedKind].kind, s.cursor); return true; }
    if (key === "Enter") return startWave();
    if (key === "u") return g.upgrade(s.cursor);
    if (key === "Delete") return g.sell(s.cursor);
    if (["1", "2", "3", "4"].includes(key)) { select(Number(key) - 1); return true; }
    return false;
  };
  g.clearInput = () => { pressed = null; };
  g.controls = () => ({ wave: s.wave, coins: s.coins, mode: s.mode, kills: s.kills, combos: { ...s.combos }, primaryEnabled: s.mode !== "battle", abilityAvailable: s.mode === "battle" && s.bell <= 0, selectedKind: s.selectedKind, selectedSlot: s.selectedSlot });
  g.position = position;
  g.checkpoint = () => s.phase !== "playing" ? { version: 1, finished: true } : ({
    version: 1, mode: s.mode, wave: s.wave, time: s.time, coins: s.coins, lives: s.lives, score: s.score, kills: s.kills, spawned: s.spawned, spawnClock: s.spawnClock, nextId: s.nextId, battleTime: s.battleTime, bell: s.bell,
    perks: s.perks.slice(), offers: s.offers.slice(), combos: { ...s.combos }, selectedKind: s.selectedKind, selectedSlot: s.selectedSlot, cursor: s.cursor, rewardCursor: s.rewardCursor,
    towers: s.slots.map(p => p.tower ? [p.tower.kind, p.tower.level, p.tower.cooldown, p.tower.recoil, p.tower.spent, p.tower.angle] : null),
    enemies: s.enemies.map(e => [e.id, e.kind, e.d, e.hp, e.chill, e.heat, e.shock, e.stun, e.hit, e.air, e.age]),
    shots: s.shots.map(p => [p.x, p.y, p.target, p.damage]),
  });
  function restore(cp) {
    const num = (n, low, high) => typeof n === "number" && Number.isFinite(n) && n >= low && n <= high;
    const integer = (n, low, high) => Number.isInteger(n) && num(n, low, high);
    if (!cp || cp.version !== 1 || cp.finished || !["prep", "battle", "reward"].includes(cp.mode)) return;
    if (!integer(cp.wave, 0, 5) || (cp.mode !== "prep" && cp.wave === 0) || !num(cp.time, 0, 1e8) || !integer(cp.coins, 0, 100000) || !integer(cp.lives, 1, 8) || !num(cp.score, 0, 1e7) || !integer(cp.kills, 0, 1000)) return;
    if (!integer(cp.spawned, 0, waves[cp.wave - 1]?.length ?? 0) || !num(cp.spawnClock, -10, 10) || !integer(cp.nextId, 1, 10000) || !num(cp.battleTime, 0, 1e6) || !num(cp.bell, 0, 20)) return;
    if (!integer(cp.selectedKind, 0, 3) || !integer(cp.selectedSlot, -1, 9) || !integer(cp.cursor, 0, 9) || !integer(cp.rewardCursor, 0, 2)) return;
    if (!Array.isArray(cp.perks) || cp.perks.length > 4 || !cp.perks.every(p => Object.hasOwn(recipes, p)) || !Array.isArray(cp.offers) || cp.offers.length > 3 || !cp.offers.every(p => Object.hasOwn(recipes, p)) || (cp.mode === "reward" && cp.offers.length !== 3)) return;
    if (!cp.combos || !["steam", "bounce", "collision", "ricochet"].every(k => integer(cp.combos[k], 0, 100000))) return;
    if (!Array.isArray(cp.towers) || cp.towers.length !== 10 || !cp.towers.every(t => t === null || (Array.isArray(t) && t.length === 6 && spec(t[0]) && integer(t[1], 1, 2) && num(t[2], -1e6, 10) && num(t[3], 0, 1) && integer(t[4], 0, 105) && num(t[5], -Math.PI, Math.PI)))) return;
    if (!Array.isArray(cp.enemies) || cp.enemies.length > 16 || !cp.enemies.every(e => Array.isArray(e) && e.length === 11 && integer(e[0], 1, 10000) && Object.hasOwn(robots, e[1]) && num(e[2], 0, total) && num(e[3], .000001, robots[e[1]].hp) && e.slice(4).every(v => num(v, 0, 1e6)))) return;
    if (new Set(cp.enemies.map(e => e[0])).size !== cp.enemies.length || !Array.isArray(cp.shots) || cp.shots.length > 40 || !cp.shots.every(p => Array.isArray(p) && p.length === 4 && num(p[0], 0, 960) && num(p[1], 0, 540) && integer(p[2], 1, 10000) && num(p[3], 0, 50))) return;
    for (const k of ["mode", "wave", "time", "coins", "lives", "score", "kills", "spawned", "spawnClock", "nextId", "battleTime", "bell", "selectedKind", "selectedSlot", "cursor", "rewardCursor"]) s[k] = cp[k];
    s.perks = cp.perks.slice(); s.offers = cp.offers.slice(); s.combos = Object.fromEntries(["steam", "bounce", "collision", "ricochet"].map(k => [k, cp.combos[k]]));
    cp.towers.forEach((t, i) => { s.slots[i].tower = t ? { kind: t[0], level: t[1], cooldown: t[2], recoil: t[3], spent: t[4], angle: t[5] } : null; });
    s.enemies = cp.enemies.map(e => ({ id: e[0], kind: e[1], d: e[2], hp: e[3], maxHp: robots[e[1]].hp, chill: e[4], heat: e[5], shock: e[6], stun: e[7], hit: e[8], air: e[9], age: e[10] }));
    s.shots = cp.shots.map(p => ({ x: p[0], y: p[1], target: p[2], damage: p[3] })); s.status = "晚班继续 · 布阵已恢复"; labels();
  }
  const stop = g.stop, destroy = g.destroy;
  g.stop = () => { live = false; stop(); };
  g.destroy = () => { live = false; destroy(); };
  g.next = () => { if (!live) return false; g.reset(0); return true; };
  g.reset(0); restore(options.checkpoint); return g;
}

export function paintKitchen() {}
