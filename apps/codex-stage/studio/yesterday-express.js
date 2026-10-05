export function createYesterdayWorld({ level = 0, checkpoint, onEvent = () => {} } = {}) {
  const id = "yesterday-express", dt = 1000 / 120, maxTick = 3600000;
  const chapters = [
    { title: "借昨天一双手", subtitle: "ONE YESTERDAY", limit: 1,
      nodes: [[205, 350, "start"], [110, 350, "A"], [365, 350, "way"], [555, 350, "way"], [705, 350, "depot"], [840, 350, "mail"]],
      edges: [[0, 1], [0, 2], [2, 3, "bridge", "A"], [3, 4], [4, 5]],
      floors: [[65, 405, 350], [520, 905, 350]],
    },
    { title: "两份昨天，一份今天", subtitle: "DOUBLE EXPOSURE", limit: 2,
      nodes: [[130, 390, "start"], [270, 390, "A"], [165, 205, "B"], [365, 390, "way"], [570, 390, "way"], [570, 205, "way"], [715, 205, "depot"], [845, 205, "mail"]],
      edges: [[0, 1], [0, 2, "stairs"], [1, 3], [3, 4, "bridge", "A"], [4, 5, "lift", "B"], [5, 6], [6, 7]],
      floors: [[85, 405, 390], [520, 620, 390], [105, 225, 205], [525, 905, 205]],
    },
    { title: "把今天交到手上", subtitle: "SPECIAL DELIVERY", limit: 2,
      nodes: [[125, 390, "start"], [215, 390, "A"], [300, 390, "way"], [300, 205, "way"], [470, 205, "way"], [575, 205, "depot"], [690, 205, "chute"], [420, 390, "B"], [690, 390, "catch"], [840, 390, "mail"]],
      edges: [[0, 1], [1, 2], [2, 3, "stairs"], [3, 4, "bridge", "A"], [4, 5], [5, 6], [2, 7], [7, 8], [8, 9]],
      floors: [[65, 900, 390], [255, 335, 205], [440, 730, 205]],
    },
  ];
  const s = {}, labels = { start: "出发站", A: "踏板 A", B: "踏板 B", way: "站台", depot: "取件处", mail: "收件箱", chute: "投递滑道", catch: "接件处" };
  let active = true, accumulator = 0, pressed = null, keyboardFocus = false;
  const copy = value => JSON.parse(JSON.stringify(value));
  const integer = (v, max, min = 0) => Number.isInteger(v) && v >= min && v <= max;
  const emit = type => { if (active) onEvent({ type: `yesterday-${type}` }); };
  const actor = () => ({ node: 0, next: null, travel: 0, goal: 0, cursor: 0, facing: 1 });
  function setup(n) {
    const chapter = chapters[n]; accumulator = 0; pressed = null; keyboardFocus = false;
    for (const key of Object.keys(s)) delete s[key];
    Object.assign(s, { id, kind: id, level: n, title: chapter.title, subtitle: chapter.subtitle, limit: chapter.limit,
      nodes: chapter.nodes.map(([x, y, role], index) => ({ x, y, role, index, label: labels[role] })),
      edges: chapter.edges.map(([a, b, kind = "walk", gate = null]) => ({ a, b, kind, gate })), floors: chapter.floors,
      tick: 0, time: 0, rewind: 0, records: [], commands: [], actors: [actor()], cursor: 0,
      parcel: { node: chapter.nodes.findIndex(n => n[2] === "depot"), owner: null, drop: null, delivered: false },
      completed: false, phase: "playing", score: n * 100, progress: n, goal: 3, lives: 1, status: "", primaryLabel: "留下分身", secondaryLabel: "撤回分身", abilityAvailable: false,
    }); refresh();
  }
  function rewind() {
    accumulator = 0; s.tick = 0; s.time = 0; s.rewind = 60; s.commands = []; s.actors = Array.from({ length: s.records.length + 1 }, actor);
    s.parcel = { node: s.nodes.findIndex(n => n.role === "depot"), owner: null, drop: null, delivered: false };
    s.completed = false; s.phase = "playing"; s.cursor = 0; refresh(); emit("rewind");
  }
  function pose(a) {
    const from = s.nodes[a.node], to = a.next === null ? from : s.nodes[a.next];
    return { x: from.x + (to.x - from.x) * a.travel, y: from.y + (to.y - from.y) * a.travel };
  }
  function plates() {
    const result = { A: false, B: false };
    for (const a of s.actors) if (a.next === null && ["A", "B"].includes(s.nodes[a.node].role)) result[s.nodes[a.node].role] = true;
    return result;
  }
  function nextNode(from, to) {
    const queue = [[from]], visited = new Set([from]);
    for (let i = 0; i < queue.length; i++) {
      const path = queue[i], last = path.at(-1); if (last === to) return path[1] ?? null;
      for (const e of s.edges) { const n = e.a === last ? e.b : e.b === last ? e.a : null; if (n !== null && !visited.has(n)) { visited.add(n); queue.push([...path, n]); } }
    }
    return null;
  }
  function blocked(a, index, open) {
    const next = nextNode(a.node, a.goal); if (next === null) return null;
    const e = s.edges.find(e => e.a === a.node && e.b === next || e.b === a.node && e.a === next);
    if (e.gate && !open[e.gate]) return `gate-${e.gate}`;
    if (s.level === 2 && e.kind === "stairs" && s.parcel.owner === index) return "parcel-stairs";
    return null;
  }
  function refresh() {
    const live = s.actors.at(-1), open = plates(), reason = live.next === null ? blocked(live, s.records.length, open) : null;
    s.score = (s.level + Number(s.completed)) * 100; s.progress = s.level + Number(s.completed);
    s.primaryLabel = s.completed ? s.level === 2 ? "再走一遍" : "下一票" : "留下分身";
    s.abilityAvailable = s.records.length > 0 && !s.completed && !s.rewind;
    if (s.completed) s.status = s.level === 2 ? "三封时间邮件，全部送达。今天也多亏了昨天的你。" : "邮件已送达。下一票，试试更默契的配合。";
    else if (s.rewind) s.status = "倒带中。分身将重放这次点过的目的地。";
    else if (reason === "parcel-stairs") s.status = "包裹太宽，走不了窄梯。带到投递滑道，让楼下的人踩 B。";
    else if (reason) s.status = `前方在等踏板 ${reason.at(-1)}。让分身留在踏板上，再让今天的你出发。`;
    else if (s.parcel.drop !== null) s.status = "接力成功，包裹正在滑向楼下。";
    else if (s.level === 2 && s.parcel.owner !== null && s.actors[s.parcel.owner].node === 6) s.status = "楼上的快递员已就位。楼下踩 B 开滑道，再去接件处。";
    else if (s.records.length === 0) s.status = "先点踏板 A，再留下分身。昨天的你会留下帮忙。";
    else if (s.level === 1 && s.records.length < 2) s.status = "还差一份昨天：点楼上的 B，再留下第二个分身。";
    else if (s.level === 2 && s.records.length < 2) s.status = "让第二个分身走到楼上滑道，沿途取件。今天的你留在楼下。";
    else s.status = s.level === 2 ? "踩 B 接通滑道，接住楼上的包裹，再送到红色信箱。" : "点红色信箱。沿途取件，分身会替你守住机关。";
  }
  function advance() {
    if (s.rewind > 0) { s.rewind--; refresh(); return; }
    if (s.completed) return;
    s.tick = Math.min(maxTick, s.tick + 1); s.time = s.tick * dt;
    const open = plates();
    for (let i = 0; i < s.actors.length; i++) {
      const a = s.actors[i], commands = s.records[i];
      if (commands) while (a.cursor < commands.length && commands[a.cursor][0] <= s.tick) a.goal = commands[a.cursor++][1];
      if (a.next === null && a.goal !== a.node && !blocked(a, i, open)) {
        a.next = nextNode(a.node, a.goal); a.travel = 0;
        if (a.next !== null) a.facing = Math.sign(s.nodes[a.next].x - s.nodes[a.node].x) || a.facing;
      }
      if (a.next !== null) {
        const from = s.nodes[a.node], to = s.nodes[a.next], distance = Math.hypot(to.x - from.x, to.y - from.y);
        a.travel += 150 / 120 / distance;
        if (a.travel >= 1) { a.node = a.next; a.next = null; a.travel = 0; emit("step"); }
      }
    }
    const p = s.parcel;
    if (p.drop !== null) { p.drop = Math.min(1, p.drop + 1 / 84); if (p.drop >= 1) { p.drop = null; p.node = 8; emit("catch"); } }
    if (p.owner === null && p.node !== null && p.drop === null && !p.delivered) {
      const owner = s.actors.findIndex(a => a.next === null && a.node === p.node);
      if (owner >= 0) { p.owner = owner; p.node = null; emit("pickup"); }
    }
    if (p.owner !== null) {
      const carrier = s.actors[p.owner];
      if (s.level === 2 && carrier.next === null && carrier.node === 6 && plates().B) { p.owner = null; p.node = null; p.drop = 0; emit("drop"); }
      else if (carrier.next === null && s.nodes[carrier.node].role === "mail") { p.owner = null; p.node = carrier.node; p.delivered = true; s.completed = true; if (s.level === 2) s.phase = "won"; emit("delivery"); }
    }
    const after = plates(); if (after.A !== open.A || after.B !== open.B) emit("gate"); refresh();
  }
  function canAct() { return active && !s.completed && !s.rewind; }
  function walkTo(node) {
    if (!canAct() || !integer(node, s.nodes.length - 1) || s.commands.length >= 32 || s.actors.at(-1).goal === node) return false;
    s.cursor = node; s.actors.at(-1).goal = node; s.commands.push([s.tick, node]); emit("select"); refresh(); return true;
  }
  function primary() {
    if (!active || s.rewind) return false;
    if (s.completed) { setup((s.level + 1) % 3); emit("select"); return true; }
    if (!s.commands.length || s.records.length >= s.limit) return false;
    // Trim idle thinking time, but preserve timing between chosen destinations.
    const origin = s.commands[0][0];
    s.records.push(s.commands.map(([tick, node]) => [tick - origin, node])); rewind(); return true;
  }
  function secondary() {
    if (!canAct() || !s.records.length) return false;
    s.records.pop(); rewind(); return true;
  }
  function saved() {
    return copy({ version: 1, id, level: s.level, tick: s.tick, accumulator, rewind: s.rewind, records: s.records, commands: s.commands, actors: s.actors, parcel: s.parcel, completed: s.completed, cursor: s.cursor });
  }
  function restore(v) {
    try {
      if (!v || v.version !== 1 || v.id !== id || !integer(v.level, 2) || JSON.stringify(v).length > 8192) return false;
      const ch = chapters[v.level], validNode = n => integer(n, ch.nodes.length - 1);
      if (!integer(v.tick, maxTick) || !integer(v.rewind, 60) || !Number.isFinite(v.accumulator) || v.accumulator < 0 || v.accumulator >= dt || !validNode(v.cursor)) return false;
      const validCommands = list => Array.isArray(list) && list.length <= 32 && list.every((c, i) => Array.isArray(c) && c.length === 2 && integer(c[0], maxTick) && validNode(c[1]) && (!i || c[0] >= list[i - 1][0]));
      if (!Array.isArray(v.records) || v.records.length > ch.limit || !v.records.every(r => validCommands(r) && r.length) || !validCommands(v.commands) || v.commands.some(c => c[0] > v.tick)) return false;
      if (!Array.isArray(v.actors) || v.actors.length !== v.records.length + 1 || !v.actors.every((a, i) => validNode(a.node) && validNode(a.goal) && (a.facing === -1 || a.facing === 1) && integer(a.cursor, v.records[i]?.length ?? 0) && Number.isFinite(a.travel) && a.travel >= 0 && a.travel < 1 && (a.next === null ? a.travel === 0 : validNode(a.next) && ch.edges.some(([x, y]) => x === a.node && y === a.next || y === a.node && x === a.next)))) return false;
      const p = v.parcel;
      if (!p || typeof p.delivered !== "boolean" || typeof v.completed !== "boolean" || p.delivered !== v.completed || (p.owner !== null && !integer(p.owner, v.actors.length - 1)) || (p.node !== null && !validNode(p.node))) return false;
      if (p.drop !== null && (v.level !== 2 || !Number.isFinite(p.drop) || p.drop < 0 || p.drop >= 1)) return false;
      if (Number(p.owner !== null) + Number(p.node !== null) + Number(p.drop !== null) !== 1 || p.delivered && ch.nodes[p.node]?.[2] !== "mail") return false;
      if (p.node !== null && !["depot", "catch", "mail"].includes(ch.nodes[p.node][2])) return false;
      if (v.rewind && (v.tick !== 0 || v.commands.length || v.completed || v.actors.some(a => a.node !== 0 || a.next !== null || a.goal !== 0 || a.cursor !== 0))) return false;
      setup(v.level); accumulator = v.accumulator;
      for (const key of ["tick", "rewind", "records", "commands", "completed", "cursor"]) s[key] = copy(v[key]);
      s.actors = v.actors.map(a => ({ node: a.node, next: a.next, travel: a.travel, goal: a.goal, cursor: a.cursor, facing: a.facing }));
      s.parcel = { node: p.node, owner: p.owner, drop: p.drop, delivered: p.delivered };
      s.time = s.tick * dt; s.phase = s.completed && s.level === 2 ? "won" : "playing"; refresh(); return true;
    } catch { return false; }
  }
  setup(integer(level, 2) ? level : 0); if (checkpoint && !restore(checkpoint)) setup(0);
  return {
    scene: s, effects: [], history: [], pose, plates, walkTo, primary, secondary, checkpoint: saved,
    step(ms) { if (!active || !Number.isFinite(ms) || ms <= 0) return; accumulator += Math.min(50, ms); while (accumulator >= dt) { accumulator -= dt; advance(); } },
    snapshot() { return { id, active, phase: s.phase, level: s.level, time: Math.round(s.time), score: s.score, progress: s.progress, goal: 3, lives: 1, status: keyboardFocus ? `目的地 ${s.cursor + 1}：${s.nodes[s.cursor].label}。${s.status}` : s.status, primaryLabel: s.primaryLabel, secondaryLabel: s.secondaryLabel, primaryEnabled: !s.rewind && (s.completed || s.commands.length > 0 && s.records.length < s.limit), abilityAvailable: s.abilityAvailable, echoes: s.records.length }; },
    pointer(type, x, y) {
      if (!active || !Number.isFinite(x + y)) return false;
      if (type === "down") { pressed = { x, y }; keyboardFocus = false; return true; }
      if (type !== "up" || !pressed) return false;
      const distance = Math.hypot(pressed.x - x, pressed.y - y); pressed = null; if (distance > 30) return false;
      if (y >= 457) { if (x >= 722) return primary(); if (x >= 633) return secondary(); return false; }
      const nearest = s.nodes.reduce((best, n) => Math.hypot(n.x - x, n.y - 23 - y) < best.distance ? { node: n.index, distance: Math.hypot(n.x - x, n.y - 23 - y) } : best, { node: -1, distance: 72 });
      return walkTo(nearest.node);
    },
    key(key, down) {
      if (!active || !down) return false;
      if (key.startsWith("Arrow")) { keyboardFocus = true; s.cursor = (s.cursor + (["ArrowLeft", "ArrowUp"].includes(key) ? s.nodes.length - 1 : 1)) % s.nodes.length; return true; }
      if (key === " ") { walkTo(s.cursor); return true; }
      if (key === "Enter") { primary(); return true; }
      if (key === "b") { secondary(); return true; }
      return false;
    },
    cancel() { pressed = null; }, stop() { active = false; pressed = null; }, destroy() { active = false; pressed = null; },
    retry() { if (!active) return false; setup(s.level); return true; },
    setLevel(n) { if (!active || !integer(n, 2)) return false; setup(n); return true; },
  };
}

export function paintYesterday() {}
