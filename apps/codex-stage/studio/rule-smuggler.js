export function createRuleWorld({ level = 0, checkpoint, onEvent = () => {} } = {}) {
  const id = "rule-smuggler", dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]], arrows = ["右", "下", "左", "上"];
  const cards = [
    { id: "mirror", name: "镜面", cost: 1, color: "#31b9c9", hint: "在空地放镜面，改变炮弹方向；再次选牌切换斜向。" },
    { id: "swap", name: "换位", cost: 1, color: "#df719c", hint: "交换两个单位的位置，保留各自朝向；货箱不能交换。" },
    { id: "portal", name: "折跃", cost: 2, color: "#787bd5", hint: "连接两个空格；炮弹和移动保持方向穿过。" },
    { id: "link", name: "同频", cost: 1, color: "#eab742", hint: "连接两台敌机或油桶；一方受伤，另一方受同等伤害。" },
    { id: "push", name: "推挤", cost: 1, color: "#ed7959", hint: "推敌机或油桶到相邻空格，掉进深坑立即摧毁。" },
    { id: "step", name: "步移", cost: 1, color: "#87b264", hint: "自己移动一格，可以走进折跃门；每轮只用一次。" },
  ];
  const levels = [
    { title: "借火开场", subtitle: "RETURN TO SENDER", unlocked: [0, 3, 5], walls: [6, 28], pits: [], units: [["you", "player", 1, 4, 0, 3], ["cargo", "cargo", 3, 4, 0, 3], ["a", "sentry", 0, 1, 0, 1], ["b", "sentry", 5, 3, 2, 1]] },
    { title: "隔墙的连锁", subtitle: "SPECIAL CONNECTION", unlocked: [0, 1, 2, 3, 5], walls: [3, 10, 17], pits: [2, 28], units: [["you", "player", 1, 4, 0, 3], ["cargo", "cargo", 3, 4, 0, 3], ["a", "sentry", 0, 2, 0, 1], ["b", "pulse", 6, 3, 2, 1], ["c", "sentry", 5, 2, 1, 1], ["d", "barrel", 5, 3, 0, 1]] },
    { title: "漂亮的事故", subtitle: "CONTROLLED CHAOS", unlocked: [0, 1, 2, 3, 4, 5], walls: [9, 10], pits: [0, 6, 28], units: [["you", "player", 1, 3, 0, 3], ["cargo", "cargo", 3, 3, 0, 3], ["a", "armor", 0, 1, 0, 3], ["b", "pulse", 6, 3, 2, 2], ["c", "sentry", 4, 0, 1, 1], ["d", "barrel", 4, 2, 0, 1], ["e", "barrel", 5, 2, 0, 1]] },
  ];
  const clone = v => JSON.parse(JSON.stringify(v)), integer = (n, max, min = 0) => Number.isInteger(n) && n >= min && n <= max;
  const index = p => p[1] * 7 + p[0], point = i => [i % 7, Math.floor(i / 7)], same = (a, b) => a[0] === b[0] && a[1] === b[1];
  const enemy = u => ["sentry", "pulse", "armor"].includes(u.kind), unitAt = (b, p) => b.units.find(u => u.hp > 0 && same(u.pos, p));
  const number = (u, n) => ({ id: u[0], kind: u[1], pos: [u[2], u[3]], dir: u[4], hp: u[5], maxHp: levels[n].units.find(v => v[0] === u[0])[5] });
  const s = {}; let active = true, pressed = null, keyboardFocus = false;
  const emit = type => { if (active) onEvent({ type: `rules-${type}` }); };
  function makeBoard(n) { return { units: levels[n].units.map(u => number(u, n)), mirrors: [], portals: [], link: [] }; }
  function encode(b) { return { u: b.units.map(u => [u.id, u.kind, ...u.pos, u.dir, u.hp]), m: b.mirrors.map(m => [m.x, m.y, m.flip]), p: b.portals.map(p => [...p]), l: [...b.link] }; }
  function decode(b, n) { return { units: b.u.map(u => number(u, n)), mirrors: b.m.map(([x, y, flip]) => ({ x, y, flip })), portals: b.p.map(p => [...p]), link: [...b.l] }; }
  function setup(n) {
    for (const key of Object.keys(s)) delete s[key]; pressed = null; keyboardFocus = false;
    Object.assign(s, { id, kind: id, level: n, title: levels[n].title, subtitle: levels[n].subtitle, walls: [...levels[n].walls], pits: [...levels[n].pits], cards, unlocked: [...levels[n].unlocked],
      board: makeBoard(n), turn: 0, energy: 3, used: [], history: [], selected: 0, flip: 0, cursor: 12, pending: null,
      phase: "playing", mode: "plan", time: 0, elapsed: 0, status: "", notice: "", noticeUntil: 0, score: n * 100, progress: n, goal: 3, lives: 3, primaryLabel: "执行回合", secondaryLabel: "撤销", abilityAvailable: false, preview: null,
    }); refresh();
  }
  // The same pure resolver drives both forecast and playback; no second outcome engine.
  function resolve(input, round = s.turn) {
    const b = clone(input), shots = []; let at = 150;
    for (const original of input.units.filter(u => enemy(u) && u.hp > 0)) {
      const shooter = b.units.find(u => u.id === original.id); if (!shooter?.hp) continue;
      const path = [{ x: shooter.pos[0], y: shooter.pos[1] }], impacts = [], explosions = [], queue = [], exploded = new Set();
      let pos = [...shooter.pos], dir = shooter.dir, loop = false;
      const seen = new Set();
      function hurt(target, amount, linked = new Set()) {
        if (!target || target.hp <= 0 || linked.has(target.id)) return;
        linked.add(target.id); const before = target.hp; target.hp = Math.max(0, target.hp - amount);
        impacts.push({ id: target.id, before, hp: target.hp, x: target.pos[0], y: target.pos[1] });
        if (b.link.includes(target.id)) hurt(b.units.find(u => b.link.includes(u.id) && u.id !== target.id), amount, linked);
        if (!target.hp && target.kind === "barrel" && !exploded.has(target.id)) { exploded.add(target.id); queue.push(target); }
      }
      for (let step = 0; step < 64; step++) {
        const [dx, dy] = dirs[dir]; pos = [pos[0] + dx, pos[1] + dy];
        if (pos[0] < 0 || pos[0] > 6 || pos[1] < 0 || pos[1] > 4) break;
        const state = `${index(pos)}:${dir}`; if (seen.has(state)) { loop = true; break; } seen.add(state);
        path.push({ x: pos[0], y: pos[1] }); if (s.walls.includes(index(pos))) break;
        const portal = b.portals.findIndex(p => same(p, pos));
        if (portal >= 0) { pos = [...b.portals[1 - portal]]; path.push({ x: pos[0], y: pos[1], jump: true }); }
        const target = unitAt(b, pos); if (target) { hurt(target, shooter.kind === "pulse" ? 2 : 1); break; }
        const mirror = b.mirrors.find(m => m.x === pos[0] && m.y === pos[1]);
        if (mirror) dir = (mirror.flip ? [3, 2, 1, 0] : [1, 0, 3, 2])[dir];
        if (step === 63) loop = true;
      }
      for (let i = 0; i < queue.length; i++) {
        const barrel = queue[i]; explosions.push({ x: barrel.pos[0], y: barrel.pos[1] });
        for (const target of b.units) if (target.hp > 0 && Math.abs(target.pos[0] - barrel.pos[0]) + Math.abs(target.pos[1] - barrel.pos[1]) <= 1) hurt(target, 1);
      }
      const hitAt = at + Math.max(1, path.length - 1) * 65;
      shots.push({ shooter: shooter.id, at, hitAt, path, impacts, explosions, loop }); at = hitAt + 260;
    }
    const safe = b.units.filter(u => ["player", "cargo"].includes(u.kind)).every(u => u.hp > 0), remaining = b.units.filter(u => enemy(u) && u.hp > 0).length;
    for (const u of b.units) if (enemy(u) && u.hp > 0) u.dir = (u.dir + (u.kind === "armor" ? 3 : u.kind === "pulse" ? 2 : 1)) % 4;
    return { board: b, shots, duration: at + 150, win: safe && !remaining, lose: !safe || remaining > 0 && round >= 5, remaining,
      playerHp: b.units.find(u => u.id === "you").hp, cargoHp: b.units.find(u => u.id === "cargo").hp,
    };
  }
  function refresh(recompute = true) {
    if (recompute) s.preview = resolve(s.board);
    s.primaryLabel = s.mode === "clear" ? s.level === 2 ? "再闯一次" : "下一场" : s.mode === "resolve" ? "连锁结算中" : "执行回合";
    s.abilityAvailable = s.mode === "plan" && (s.pending !== null || s.history.length > 0);
    s.lives = s.board.units.find(u => u.id === "you").hp;
    if (s.phase === "lost") s.status = s.preview.cargoHp <= 0 ? "货箱损坏，行动失败。重试时可以先检查预览中的危险弹道。" : s.preview.playerHp <= 0 ? "走私者被击中。下一次试试换位、步移或改变弹道。" : "六轮已到，仍有守卫。重新安排规则，试试连锁清场。";
    else if (s.mode === "clear") s.status = s.level === 2 ? "三场清场。最好的武器，是对手自己的计划。" : "清场成功，货箱安全。下一场会开放新的规则。";
    else if (s.mode === "resolve") s.status = "按当前预览执行。已被摧毁的守卫不会继续开火。";
    else if (s.pending !== null) s.status = `${cards[s.selected].name}：已选 ${String.fromCharCode(65 + s.pending % 7)}${Math.floor(s.pending / 7) + 1}，请选择第二个目标；撤销可取消。`;
    else {
      const forecast = s.preview.win ? "预计清场，货箱安全" : `预计剩余 ${s.preview.remaining} 台；你 ${s.preview.playerHp}/3，货箱 ${s.preview.cargoHp}/3`;
      s.status = `${cards[s.selected].name}：${cards[s.selected].hint} ${forecast}。`;
    }
  }
  function canPlan() { return active && s.mode === "plan" && s.phase === "playing"; }
  function validCell(c) { return integer(c, 34); }
  function floor(c) { return validCell(c) && !s.walls.includes(c) && !s.pits.includes(c); }
  function clear(b, c) { return floor(c) && !unitAt(b, point(c)) && !b.mirrors.some(m => index([m.x, m.y]) === c); }
  function transport(b, pos) {
    const portal = b.portals.findIndex(p => same(p, pos));
    return portal >= 0 && !unitAt(b, b.portals[1 - portal]) ? [...b.portals[1 - portal]] : [...pos];
  }
  function play(cardId, first, second) {
    const cardIndex = cards.findIndex(c => c.id === cardId), card = cards[cardIndex];
    if (!canPlan() || !card || !s.unlocked.includes(cardIndex) || s.used.includes(cardIndex) || s.energy < card.cost || !validCell(first)) return false;
    const b = clone(s.board), p = point(first), q = validCell(second) ? point(second) : null, u = unitAt(b, p), v = q && unitAt(b, q);
    if (cardId === "mirror") {
      if (!clear(b, first) || b.portals.some(t => same(t, p)) || b.mirrors.length >= 5) return false;
      b.mirrors.push({ x: p[0], y: p[1], flip: s.flip });
    } else if (cardId === "swap") {
      if (!u || !v || u.id === v.id || [u.kind, v.kind].includes("cargo")) return false;
      [u.pos, v.pos] = [[...v.pos], [...u.pos]];
    } else if (cardId === "portal") {
      if (!q || first === second || !clear(b, first) || !clear(b, second)) return false;
      b.portals = [p, q];
    } else if (cardId === "link") {
      if (!u || !v || u.id === v.id || [u, v].some(x => !enemy(x) && x.kind !== "barrel")) return false;
      b.link = [u.id, v.id];
    } else if (cardId === "push") {
      if (!u || !q || (!enemy(u) && u.kind !== "barrel") || Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) !== 1 || s.walls.includes(second) || unitAt(b, q) || b.mirrors.some(m => index([m.x, m.y]) === second)) return false;
      u.pos = transport(b, q); if (s.pits.includes(second)) u.hp = 0;
    } else {
      const you = b.units.find(u => u.id === "you");
      if (!clear(b, first) || Math.abs(you.pos[0] - p[0]) + Math.abs(you.pos[1] - p[1]) !== 1) return false;
      you.pos = transport(b, p);
    }
    s.history.push({ b: encode(s.board), e: s.energy, u: [...s.used] });
    s.board = b; s.energy -= card.cost; s.used.push(cardIndex); s.pending = null; s.notice = ""; refresh(); emit(cardId); return true;
  }
  function selectCard(n) {
    if (!canPlan() || !integer(n, 5) || !s.unlocked.includes(n) || s.used.includes(n) || s.energy < cards[n].cost) return false;
    if (n === 0 && s.selected === 0) s.flip = 1 - s.flip;
    s.selected = n; s.pending = null; refresh(false); emit("select"); return true;
  }
  function target(c) {
    if (!canPlan() || !validCell(c)) return false; s.cursor = c;
    const card = cards[s.selected], pair = ["swap", "portal", "link", "push"].includes(card.id);
    if (s.used.includes(s.selected) || s.energy < card.cost) { s.notice = "这张牌本轮已用，或能量不足"; s.noticeUntil = s.time + 1600; return false; }
    if (pair && s.pending === null) {
      const u = unitAt(s.board, point(c));
      const valid = card.id === "portal" ? clear(s.board, c) : card.id === "swap" ? u && u.kind !== "cargo" : u && (enemy(u) || u.kind === "barrel");
      if (!valid) { s.notice = "这里不是这张牌的目标"; s.noticeUntil = s.time + 1600; return false; }
      s.pending = c; refresh(false); emit("select"); return true;
    }
    if (pair && c === s.pending) { s.pending = null; refresh(false); return true; }
    const ok = pair ? play(card.id, s.pending, c) : play(card.id, c);
    if (!ok) { s.notice = "目标不成立，规则未消耗"; s.noticeUntil = s.time + 1600; } return ok;
  }
  function primary() {
    if (!active || s.mode === "resolve") return false;
    if (s.phase === "lost") { setup(s.level); return true; }
    if (s.mode === "clear") { setup((s.level + 1) % 3); emit("select"); return true; }
    if (s.pending !== null) { s.notice = "先完成第二个目标，或撤销选择"; s.noticeUntil = s.time + 1600; return false; }
    s.preview = resolve(s.board); s.mode = "resolve"; s.elapsed = 0; s.notice = ""; s.history = []; refresh(false); emit("commit"); return true;
  }
  function secondary() {
    if (!canPlan()) return false;
    if (s.pending !== null) { s.pending = null; refresh(false); return true; }
    const last = s.history.pop(); if (!last) return false;
    s.board = decode(last.b, s.level); s.energy = last.e; s.used = [...last.u]; s.notice = ""; refresh(); emit("undo"); return true;
  }
  function display() {
    const b = clone(s.board);
    if (s.mode === "resolve") for (const shot of s.preview.shots) if (s.elapsed >= shot.hitAt) for (const hit of shot.impacts) b.units.find(u => u.id === hit.id).hp = hit.hp;
    return b;
  }
  function save() { return clone({ version: 1, id, level: s.level, turn: s.turn, board: encode(s.board), history: s.history, energy: s.energy, used: s.used, selected: s.selected, flip: s.flip, cursor: s.cursor, pending: s.pending, phase: s.phase, mode: s.mode, time: s.time, elapsed: s.elapsed }); }
  function restore(v) {
    try {
      if (!v || v.id !== id || v.version !== 1 || !integer(v.level, 2) || JSON.stringify(v).length > 8192) return false;
      const n = v.level, config = levels[n];
      function validBoard(b) {
        if (!b || !Array.isArray(b.u) || b.u.length !== config.units.length || !Array.isArray(b.m) || b.m.length > 5 || !Array.isArray(b.p) || ![0, 2].includes(b.p.length) || !Array.isArray(b.l) || ![0, 2].includes(b.l.length)) return false;
        const seen = new Set();
        if (!b.u.every((u, i) => { const original = config.units[i]; if (!Array.isArray(u) || u.length !== 6 || u[0] !== original[0] || u[1] !== original[1] || !integer(u[2], 6) || !integer(u[3], 4) || !integer(u[4], 3) || !integer(u[5], original[5])) return false; const c = u[3] * 7 + u[2]; if (u[5] > 0 && (seen.has(c) || config.walls.includes(c) || config.pits.includes(c))) return false; if (u[5] > 0) seen.add(c); return true; })) return false;
        const mirrors = new Set();
        if (!b.m.every(m => { if (!Array.isArray(m) || m.length !== 3 || !integer(m[0], 6) || !integer(m[1], 4) || !integer(m[2], 1)) return false; const c = m[1] * 7 + m[0]; if (seen.has(c) || mirrors.has(c) || config.walls.includes(c) || config.pits.includes(c)) return false; mirrors.add(c); return true; })) return false;
        if (!b.p.every(p => Array.isArray(p) && p.length === 2 && integer(p[0], 6) && integer(p[1], 4) && !config.walls.includes(index(p)) && !config.pits.includes(index(p)) && !mirrors.has(index(p))) || b.p.length && same(...b.p)) return false;
        if (new Set(b.l).size !== b.l.length || !b.l.every(id => b.u.some(u => u[0] === id && !["player", "cargo"].includes(u[1])))) return false;
        return true;
      }
      const validUsed = u => Array.isArray(u) && u.length <= 3 && new Set(u).size === u.length && u.every(i => config.unlocked.includes(i));
      if (!integer(v.turn, 6) || !integer(v.energy, 3) || !validUsed(v.used) || v.used.reduce((sum, i) => sum + cards[i].cost, 0) !== 3 - v.energy || !validBoard(v.board)) return false;
      if (!integer(v.selected, 5) || !config.unlocked.includes(v.selected) || !integer(v.flip, 1) || !validCell(v.cursor) || v.pending !== null && !validCell(v.pending)) return false;
      if (!["playing", "won", "lost"].includes(v.phase) || !["plan", "resolve", "clear"].includes(v.mode) || !Number.isFinite(v.time) || v.time < 0 || v.time > 3600000 || !Number.isFinite(v.elapsed) || v.elapsed < 0 || v.elapsed > 60000) return false;
      if (!Array.isArray(v.history) || v.history.length > 3 || !v.history.every(h => validBoard(h.b) && integer(h.e, 3) && validUsed(h.u) && h.u.reduce((sum, i) => sum + cards[i].cost, 0) === 3 - h.e)) return false;
      const safe = v.board.u.filter(u => ["player", "cargo"].includes(u[1])).every(u => u[5] > 0), enemies = v.board.u.some(u => ["sentry", "pulse", "armor"].includes(u[1]) && u[5] > 0);
      if (v.mode === "clear" && (!safe || enemies || v.phase !== (n === 2 ? "won" : "playing")) || v.phase === "won" && v.mode !== "clear" || v.mode === "plan" && v.phase === "playing" && (!safe || v.turn >= 6) || v.mode === "resolve" && (v.phase !== "playing" || v.history.length || v.pending !== null || v.turn >= 6)) return false;
      setup(n); s.board = decode(v.board, n);
      for (const k of ["turn", "energy", "used", "selected", "flip", "cursor", "pending", "phase", "mode", "time", "elapsed"]) s[k] = clone(v[k]);
      s.history = v.history.map(h => ({ b: encode(decode(h.b, n)), e: h.e, u: [...h.u] })); refresh();
      if (s.mode === "resolve" && s.elapsed >= s.preview.duration) return false;
      s.score = (n + Number(s.mode === "clear")) * 100; s.progress = n + Number(s.mode === "clear"); return true;
    } catch { return false; }
  }
  setup(integer(level, 2) ? level : 0); if (checkpoint && !restore(checkpoint)) setup(0);
  return {
    scene: s, effects: [], history: [], play, selectCard, target, primary, secondary, display, checkpoint: save,
    forecast: () => resolve(s.board),
    step(ms) {
      if (!active || !Number.isFinite(ms) || ms <= 0) return; const dt = Math.min(ms, 50); s.time = Math.min(3600000, s.time + dt);
      if (s.mode !== "resolve") return; const previous = s.elapsed; s.elapsed += dt;
      for (const shot of s.preview.shots) {
        if (previous < shot.at && s.elapsed >= shot.at) emit("shot");
        if (previous < shot.hitAt && s.elapsed >= shot.hitAt) emit(shot.explosions.length ? "blast" : shot.impacts.length ? "hit" : "miss");
      }
      if (s.elapsed >= s.preview.duration) {
        const result = s.preview; s.board = clone(result.board); s.turn++; s.energy = 3; s.used = []; s.history = []; s.pending = null; s.elapsed = 0;
        if (result.lose) { s.phase = "lost"; s.mode = "plan"; emit("lose"); }
        else if (result.win) { s.mode = "clear"; s.phase = s.level === 2 ? "won" : "playing"; s.score = (s.level + 1) * 100; s.progress = s.level + 1; emit("win"); }
        else s.mode = "plan";
        refresh();
      }
    },
    snapshot() { const status = s.notice && s.noticeUntil > s.time ? s.notice : s.status; return { id, active, phase: s.phase, mode: s.mode, level: s.level, time: Math.round(s.time), score: s.score, progress: s.progress, goal: 3, lives: s.lives, status: keyboardFocus ? `${String.fromCharCode(65 + s.cursor % 7)}${Math.floor(s.cursor / 7) + 1}。${status}` : status, primaryLabel: s.primaryLabel, secondaryLabel: "撤销", primaryEnabled: s.mode !== "resolve" && s.pending === null, abilityAvailable: s.abilityAvailable, turn: s.turn, energy: s.energy, selected: s.selected }; },
    pointer(type, x, y) {
      if (!active || !Number.isFinite(x + y)) return false;
      if (type === "down") { pressed = { x, y }; keyboardFocus = false; return true; }
      if (type !== "up" || !pressed) return false; const distance = Math.hypot(x - pressed.x, y - pressed.y); pressed = null; if (distance > 28) return false;
      if (y >= 440 && y <= 527 && x >= 26 && x < 932) return selectCard(Math.floor((x - 26) / 151));
      if (x >= 709 && x < 931 && y >= 349 && y <= 395) return primary();
      if (x >= 635 && x < 698 && y >= 349 && y <= 395) return secondary();
      const cx = Math.floor((x - 69) / 68), cy = Math.floor((y - 91) / 64);
      return cx >= 0 && cx < 7 && cy >= 0 && cy < 5 ? target(cy * 7 + cx) : false;
    },
    key(key, down) {
      if (!active || !down) return false;
      if (/^[1-6]$/.test(key)) { selectCard(Number(key) - 1); return true; }
      if (key === "q") { if (canPlan()) { s.flip = 1 - s.flip; refresh(false); } return true; }
      if (key === "Escape") { if (s.pending !== null) { s.pending = null; refresh(false); } return true; }
      if (key === "Enter") { primary(); return true; }
      if (key === " ") { target(s.cursor); return true; }
      const d = { ArrowRight: [1, 0], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowUp: [0, -1] }[key];
      if (d && canPlan()) { keyboardFocus = true; const p = point(s.cursor); s.cursor = Math.max(0, Math.min(4, p[1] + d[1])) * 7 + Math.max(0, Math.min(6, p[0] + d[0])); return true; }
      return false;
    },
    cancel() { pressed = null; }, stop() { active = false; pressed = null; }, destroy() { active = false; pressed = null; },
    retry() { if (!active) return false; setup(s.level); return true; },
    setLevel(n) { if (!active || !integer(n, 2)) return false; setup(n); return true; },
  };
}

export function paintRules() {}
