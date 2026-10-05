export function createDiceWorld({ seed = 37, checkpoint, onEvent = () => {} } = {}) {
  const id = "dice-foundry", clone = v => JSON.parse(JSON.stringify(v));
  const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
  const faces = [
    { id: "strike", name: "冲击", color: "#f15b47", short: "点数 +2 伤害", hint: "造成点数 +2 伤害。" },
    { id: "charge", name: "蓄电", color: "#e2e949", short: "储存等量电能", hint: "储存等于点数的电能，上限18，跨回合保留。" },
    { id: "guard", name: "护盾", color: "#48bbd1", short: "点数 +2 护盾", hint: "获得点数 +2 护盾；敌人行动后清空。" },
    { id: "discharge", name: "放电", color: "#e2e949", short: "电能 ×2 + 点数", hint: "消耗全部电能，造成电能 ×2 + 点数伤害。先蓄电再放电。" },
    { id: "reflect", name: "反击", color: "#48bbd1", short: "护盾挡伤 ×2 反击", hint: "获得等于点数的护盾，本轮所有被护盾挡下的伤害以两倍反击。" },
    { id: "echo", name: "复写", color: "#eaa8c2", short: "复制前项基础效果", hint: "按自己的点数复制前一台设备的非复写骰面，不复制设备加成，不递归。首位无前项时只充电2。" },
    { id: "overclock", name: "超频", color: "#f15b47", short: "点数 ×2 +5 / 热 +4", hint: "造成点数 ×2 +5 伤害，热量 +4。热量达到8会在敌人行动前损伤自身8。" },
    { id: "coolant", name: "冷却", color: "#48bbd1", short: "降温 点数 +2 / 修复2", hint: "降低点数 +2 热量，修复2耐久。" },
    { id: "leech", name: "拆取", color: "#7bc78a", short: "点数 +1 伤害 / 修复2", hint: "造成点数 +1 伤害，修复2耐久。" },
    { id: "capacitor", name: "电容", color: "#e2e949", short: "少量电能与护盾", hint: "储存向下取整的半点数 +2 电能，并获得向下取整的半点数护盾。" },
    { id: "amplify", name: "倍增", color: "#eaa8c2", short: "下次直接伤害 ×2", hint: "本轮下一次直接伤害翻倍，不叠加，也不翻倍反击或自身过热损伤。" },
    { id: "low", name: "低频", color: "#7bc78a", short: "原点数 ≤3：10伤 / 4盾", hint: "骰面原点数不超过3时造成10伤害并获得4护盾，否则只充电2。设备增幅不会改变触发条件。" },
  ];
  const encounters = [
    { name: "冲床学徒", hp: 24, attacks: [5, 7, 4], armor: 0, art: 0, quirk: "普通冲击", drain: 0, heat: 0 },
    { name: "保险柜队长", hp: 34, attacks: [6, 8, 5], armor: 2, art: 1, quirk: "每次伤害抵挡2", drain: 0, heat: 0 },
    { name: "漏电线圈", hp: 40, attacks: [5, 8, 6], armor: 0, art: 2, quirk: "行动后偷走2电能", drain: 2, heat: 0 },
    { name: "翻修拳王", hp: 46, attacks: [6, 10, 6], armor: 1, art: 0, quirk: "重拳与快拳交替", drain: 0, heat: 0 },
    { name: "高压守卫", hp: 52, attacks: [7, 9, 6], armor: 1, art: 1, quirk: "行动后热量 +2", drain: 0, heat: 2 },
    { name: "六面总装机", hp: 66, attacks: [8, 12, 6], armor: 2, art: 3, quirk: "装甲2 · 蓄力重击", drain: 0, heat: 0 },
  ];
  const rewards = [[3, 4, 5], [6, 7, 8], [9, 10, 11], [3, 5, 10], [4, 6, 7]];
  const machines = [{ name: "预充舱", hint: "任何骰面先充电 +2", color: "#e2e949" }, { name: "增幅器", hint: "效果点数 +2", color: "#48bbd1" }, { name: "输出口", hint: "直接伤害 +2", color: "#f15b47" }];
  const freshDecks = () => [[1, 1, 1, 2, 0, 0], [0, 2, 0, 0, 2, 1], [0, 0, 2, 0, 1, 0]];
  const s = { id, faces, machines, encounters }; let active = true, rng = seed >>> 0 || 37, initialSeed = rng, pending = null, entry, timeline = null;
  const emit = type => { if (active) onEvent({ type: `dice-${type}` }); };
  function randomFace() { rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0; return Math.floor(rng / 4294967296 * 6); }
  function intent(level = s.level, round = s.round) { const e = encounters[level]; return { attack: e.attacks[(round - 1) % 3] + Math.max(0, round - 4) * 2, armor: e.armor, drain: e.drain, heat: e.heat }; }
  const tuple = st => [st.hp, st.energy, st.heat, st.shield, st.enemy];
  const stats = v => ({ hp: v[0], energy: v[1], heat: v[2], shield: v[3], enemy: v[4] });
  function begin(n, deck, hp, energy, heat) {
    pending = null; timeline = null;
    Object.assign(s, { level: n, title: encounters[n].name, phase: "playing", mode: "ready", time: 0, elapsed: 0, round: 1, score: n * 100, progress: n, goal: 6,
      stats: { hp, energy, heat, shield: 0, enemy: encounters[n].hp }, decks: clone(deck), roll: [-1, -1, -1], held: [false, false, false], slots: [-1, -1, -1],
      selected: 0, offer: 0, faceCursor: 0, rerolls: 1, applied: -1, base: null, patch: null, drag: null, log: [], flash: null, notice: "", noticeUntil: 0 });
    entry = { hp, energy, heat, rng, decks: clone(deck) }; refresh();
  }
  // One pure resolver is shared by the live forecast, playback and interrupted-round recovery.
  function resolve(order = s.slots, base = s.stats) {
    if (order.length !== 3 || new Set(order).size !== 3 || !order.every(i => int(i, 0, 2)) || s.roll.some(i => i < 0)) return null;
    const st = { ...base, shield: 0 }, frames = [], logs = [], enemyIntent = intent(); let boost = 1, counter = false, previous = null;
    function bounded() { st.hp = Math.max(0, Math.min(32, st.hp)); st.energy = Math.max(0, Math.min(18, st.energy)); st.shield = Math.max(0, Math.min(60, st.shield)); st.heat = Math.max(0, Math.min(24, st.heat)); st.enemy = Math.max(0, st.enemy); }
    for (let slot = 0; slot < 3; slot++) {
      const die = order[slot], raw = s.roll[die] + 1, power = raw + (slot === 1 ? 2 : 0), face = s.decks[die][raw - 1], before = { ...st };
      if (slot === 0) st.energy += 2; bounded();
      const effective = face === 5 ? previous : face;
      let damage = 0;
      if (effective === 0) damage = power + 2;
      else if (effective === 1) st.energy += power;
      else if (effective === 2) st.shield += power + 2;
      else if (effective === 3) { damage = st.energy * 2 + power; st.energy = 0; }
      else if (effective === 4) { st.shield += power; counter = true; }
      else if (effective === 6) { damage = power * 2 + 5; st.heat += 4; }
      else if (effective === 7) { st.heat -= power + 2; st.hp += 2; }
      else if (effective === 8) { damage = power + 1; st.hp += 2; }
      else if (effective === 9) { st.energy += Math.floor(power / 2) + 2; st.shield += Math.floor(power / 2); }
      else if (effective === 10) boost = 2;
      else if (effective === 11) { if (raw <= 3) { damage = 10; st.shield += 4; } else st.energy += 2; }
      else st.energy += 2;
      if (damage > 0) { damage = Math.max(0, damage * boost + (slot === 2 ? 2 : 0) - enemyIntent.armor); boost = 1; st.enemy -= damage; }
      bounded(); if (face !== 5) previous = face;
      const actual = before.enemy - st.enemy, type = actual > 0 ? "hit" : st.shield > before.shield ? "shield" : st.heat < before.heat || st.hp > before.hp ? "repair" : "charge";
      const label = `${machines[slot].name} · ${faces[face].name}${actual ? ` −${actual}` : st.energy > before.energy ? ` +${st.energy - before.energy}电` : st.shield > before.shield ? ` +${st.shield - before.shield}盾` : ""}`;
      logs.push(label); frames.push({ at: 300 + slot * 500, slot, die, face, type, damage: actual, stats: { ...st }, label });
    }
    const before = { ...st }; let retaliation = 0, overheated = false;
    if (st.heat >= 8) { st.hp -= 8; st.heat -= 6; overheated = true; }
    if (st.enemy > 0 && st.hp > 0) {
      const blocked = Math.min(st.shield, enemyIntent.attack); st.hp -= enemyIntent.attack - blocked;
      if (counter) { retaliation = Math.max(0, blocked * 2 - enemyIntent.armor); st.enemy -= retaliation; }
      st.energy -= enemyIntent.drain; st.heat += enemyIntent.heat;
    }
    st.heat -= 1; st.shield = 0; bounded();
    const label = `${overheated ? "过热损伤8 · " : ""}${before.enemy <= 0 ? "对手停机" : `敌方行动 · 耐久 −${before.hp - st.hp}`}${retaliation ? ` · 反击 ${retaliation}` : ""}`;
    logs.push(label); frames.push({ at: 1900, slot: 3, type: retaliation ? "counter" : overheated ? "heat" : "enemy", damage: before.enemy - st.enemy, stats: { ...st }, label });
    return { frames, final: st, logs, duration: 2350, win: st.hp > 0 && st.enemy === 0, lose: st.hp <= 0 };
  }
  function refresh() {
    s.intent = intent(); s.offers = rewards[s.level] ?? []; s.lives = s.stats.hp;
    s.primaryLabel = { ready: "投骰", rolling: "投掷中", plan: "执行", resolve: "运转中", reward: "选择改装", between: "下一场", clear: "再开一轮", lost: "重试本场" }[s.mode];
    s.secondaryLabel = s.mode === "between" ? "撤回改装" : "重掷";
    s.abilityAvailable = s.mode === "between" || s.mode === "plan" && s.rerolls > 0 && s.held.some(h => !h);
    const forecast = s.mode === "plan" ? resolve() : null;
    s.preview = forecast && { damage: s.stats.enemy - forecast.final.enemy, loss: s.stats.hp - forecast.final.hp, energy: forecast.final.energy, heat: forecast.final.heat, win: forecast.win, lose: forecast.lose };
    s.status = s.noticeUntil > s.time ? s.notice : s.mode === "ready" ? `第 ${s.round} 回合 · 对手将造成 ${s.intent.attack} 伤害` : s.mode === "rolling" ? "骰面已确定，正在落位" : s.mode === "plan" ? s.preview ? `预计对手损伤 ${s.preview.damage}，自身${s.preview.loss < 0 ? "修复" : "损伤"} ${Math.abs(s.preview.loss)}，剩余电能 ${s.preview.energy}${s.preview.lose ? " · 会过热或被击倒" : s.preview.win ? " · 可击败对手" : ""}` : `已装配 ${s.slots.filter(v => v >= 0).length}/3 · 选择骰子与设备，按左到右执行` : s.mode === "resolve" ? s.log.at(-1) ?? "设备启动" : s.mode === "reward" ? `战利品：${faces[s.offers[s.offer]].name}。选一颗骰子的一个面替换，原点数不变。` : s.mode === "between" ? "改装完成。下一场修复8耐久，电能与热量保留。" : s.mode === "clear" ? "六场完成。这套骰子是你自己改出来的。" : "设备停机。可以重试本场，保留入场改装与相同投掷序列。";
  }
  function selectionStatus() {
    if (s.mode === "plan") return `骰子${"ABC"[s.selected]} · ${faces[s.decks[s.selected][s.roll[s.selected]]].name} ${s.roll[s.selected] + 1}点 · ${s.held[s.selected] ? "已锁定" : "未锁定"}`;
    if (s.mode === "reward") { const d = Math.floor(s.faceCursor / 6), f = s.faceCursor % 6; return `替换骰子${"ABC"[d]}的${f + 1}点面：${faces[s.decks[d][f]].name}`; }
    return "";
  }
  function notice(v) { s.notice = v; s.noticeUntil = s.time + 1800; refresh(); return false; }
  const planning = () => active && s.mode === "plan";
  function throwDice(reroll = false) {
    if (!active || (reroll ? !planning() || !s.rerolls || s.held.every(Boolean) : s.mode !== "ready")) return false;
    if (reroll) s.rerolls--;
    for (let i = 0; i < 3; i++) if (!reroll || !s.held[i]) s.roll[i] = randomFace();
    s.mode = "rolling"; s.elapsed = 0; s.noticeUntil = 0; s.flash = null; pending = null; s.drag = null; refresh(); emit("roll"); return true;
  }
  function assign(die, slot) {
    if (!planning() || !int(die, 0, 2) || !int(slot, 0, 2)) return false;
    const old = s.slots.indexOf(die), target = s.slots[slot];
    if (old >= 0) s.slots[old] = target; s.slots[slot] = die; s.selected = die; s.noticeUntil = 0; refresh(); emit("place"); return true;
  }
  function install(die, face) {
    if (!active || s.mode !== "reward" || !int(die, 0, 2) || !int(face, 0, 5)) return false;
    const replacement = s.offers[s.offer]; if (s.decks[die][face] === replacement) return notice("这个面已经安装同一模块，换一个位置。");
    s.patch = [die, face, s.decks[die][face], replacement]; s.decks[die][face] = replacement; s.mode = "between"; s.noticeUntil = 0; refresh(); emit("install"); return true;
  }
  function primary() {
    if (!active) return false;
    if (s.mode === "ready") return throwDice();
    if (s.mode === "lost") return api.retry();
    if (s.mode === "clear") { initialSeed = (initialSeed + 7919) >>> 0 || 37; rng = initialSeed; begin(0, freshDecks(), 32, 2, 0); return true; }
    if (s.mode === "between") { begin(s.level + 1, s.decks, Math.min(32, s.stats.hp + 8), s.stats.energy, s.stats.heat); emit("next"); return true; }
    if (s.mode !== "plan") return false;
    timeline = resolve(); if (!timeline) return notice("还有设备没有装入骰子。");
    s.base = tuple(s.stats); s.mode = "resolve"; s.elapsed = 0; s.applied = -1; s.log = []; s.noticeUntil = 0; pending = null; s.drag = null; refresh(); emit("start"); return true;
  }
  function secondary() {
    if (!active) return false;
    if (s.mode === "between" && s.patch) { const [d, f, old] = s.patch; s.decks[d][f] = old; s.patch = null; s.mode = "reward"; refresh(); emit("place"); return true; }
    return throwDice(true);
  }
  function update(ms) {
    if (!active || !Number.isFinite(ms) || ms <= 0) return; const dt = Math.min(50, ms); s.time += dt;
    if (s.mode === "rolling") { s.elapsed += dt; if (s.elapsed >= 640) { s.elapsed = 0; s.mode = "plan"; emit("land"); refresh(); } }
    else if (s.mode === "resolve") {
      s.elapsed += dt;
      for (let i = s.applied + 1; i < timeline.frames.length; i++) { const f = timeline.frames[i]; if (s.elapsed < f.at) break; s.stats = { ...f.stats }; s.log.push(f.label); s.flash = { type: f.type, slot: f.slot, damage: f.damage, at: s.time }; s.applied = i; refresh(); emit(f.type); }
      if (s.elapsed >= timeline.duration) {
        s.stats = { ...timeline.final }; s.base = null; s.elapsed = 0; s.applied = -1;
        if (timeline.lose) { s.mode = "lost"; s.phase = "lost"; emit("lose"); }
        else if (timeline.win) { s.score = (s.level + 1) * 100; s.progress = s.level + 1; s.mode = s.level === 5 ? "clear" : "reward"; s.phase = s.level === 5 ? "won" : "playing"; s.offer = 0; emit("win"); }
        else { s.mode = "ready"; s.round++; s.rerolls = 1; s.held = [false, false, false]; s.slots = [-1, -1, -1]; s.roll = [-1, -1, -1]; }
        timeline = null; refresh();
      }
    }
    if (s.noticeUntil && s.time >= s.noticeUntil) { s.noticeUntil = 0; refresh(); }
  }
  function hit(x, y) {
    if (y >= 480 && y <= 530) { if (x >= 790 && x <= 934) return ["primary"]; if (x >= 651 && x <= 775) return ["secondary"]; }
    if (s.mode === "plan") {
      for (let d = 0; d < 3; d++) { const cx = 270 + 210 * d; if (Math.hypot(x - cx - 53, y - 253) < 19) return ["hold", d]; if (Math.abs(x - cx) < 43 && y >= 225 && y <= 309) return ["die", d]; }
      for (let slot = 0; slot < 3; slot++) if (Math.abs(x - (242 + slot * 238)) < 105 && y >= 347 && y <= 447) return ["slot", slot];
    }
    if (s.mode === "reward") {
      for (let o = 0; o < 3; o++) if (x >= 170 + o * 210 && x <= 363 + o * 210 && y >= 213 && y <= 300) return ["offer", o];
      for (let d = 0; d < 3; d++) for (let f = 0; f < 6; f++) if (x >= 281 + f * 66 && x < 339 + f * 66 && y >= 320 + d * 48 && y < 363 + d * 48) return ["face", d, f];
    }
    return null;
  }
  function checkpointState() { return clone({ version: 1, id, seed: initialSeed, rng, level: s.level, mode: s.mode, round: s.round, time: s.time, elapsed: s.elapsed, stats: tuple(s.stats), decks: s.decks, roll: s.roll, held: s.held, slots: s.slots, selected: s.selected, offer: s.offer, faceCursor: s.faceCursor, rerolls: s.rerolls, base: s.base, patch: s.patch, entry }); }
  function restore(v) {
    try {
      if (!v || v.version !== 1 || v.id !== id || JSON.stringify(v).length > 8192 || !int(v.level, 0, 5) || !int(v.seed, 1, 4294967295) || !int(v.rng, 0, 4294967295)) return false;
      const mode = v.mode, modes = ["ready", "rolling", "plan", "resolve", "reward", "between", "clear", "lost"], n = v.level;
      const validDecks = d => Array.isArray(d) && d.length === 3 && d.every(row => Array.isArray(row) && row.length === 6 && row.every(i => int(i, 0, 11)));
      const validStats = a => Array.isArray(a) && a.length === 5 && a.every(Number.isInteger) && a[0] >= 0 && a[0] <= 32 && a[1] >= 0 && a[1] <= 18 && a[2] >= 0 && a[2] <= 24 && a[3] >= 0 && a[3] <= 60 && a[4] >= 0 && a[4] <= encounters[n].hp;
      if (!modes.includes(mode) || !validStats(v.stats) || !validDecks(v.decks) || !int(v.round, 1, 10000) || !int(v.selected, 0, 2) || !int(v.offer, 0, 2) || !int(v.faceCursor, 0, 17) || !int(v.rerolls, 0, 1)) return false;
      if (![v.time, v.elapsed].every(x => Number.isFinite(x) && x >= 0 && x < 1e9) || v.elapsed >= (mode === "rolling" ? 640 : mode === "resolve" ? 2350 : 1)) return false;
      if (!Array.isArray(v.roll) || v.roll.length !== 3 || !v.roll.every(i => int(i, mode === "ready" ? -1 : 0, mode === "ready" ? -1 : 5))) return false;
      if (!Array.isArray(v.held) || v.held.length !== 3 || !v.held.every(x => typeof x === "boolean") || !Array.isArray(v.slots) || v.slots.length !== 3 || !v.slots.every(i => int(i, -1, 2)) || new Set(v.slots.filter(i => i >= 0)).size !== v.slots.filter(i => i >= 0).length) return false;
      if (["resolve", "reward", "between", "clear", "lost"].includes(mode) && v.slots.includes(-1)) return false;
      if (mode === "lost" && v.stats[0] !== 0 || v.stats[0] === 0 && !["lost", "resolve"].includes(mode) || (["reward", "between", "clear"].includes(mode) && (v.stats[4] !== 0 || v.stats[0] <= 0)) || mode === "clear" && n !== 5 || ["reward", "between"].includes(mode) && n === 5) return false;
      if (["ready", "rolling", "plan"].includes(mode) && (v.stats[4] <= 0 || v.stats[0] <= 0)) return false;
      const e = v.entry;
      if (!e || !int(e.hp, 1, 32) || !int(e.energy, 0, 18) || !int(e.heat, 0, 24) || !int(e.rng, 0, 4294967295) || !validDecks(e.decks)) return false;
      if (mode === "between" && (!Array.isArray(v.patch) || v.patch.length !== 4 || !int(v.patch[0], 0, 2) || !int(v.patch[1], 0, 5) || !int(v.patch[2], 0, 11) || v.patch[3] !== rewards[n][v.offer] || v.decks[v.patch[0]][v.patch[1]] !== v.patch[3])) return false;
      if (mode === "resolve" && (!validStats(v.base) || v.base[0] <= 0 || v.base[4] <= 0)) return false;
      initialSeed = v.seed; rng = v.rng; begin(n, v.decks, v.stats[0], v.stats[1], v.stats[2]);
      entry = { hp: e.hp, energy: e.energy, heat: e.heat, rng: e.rng, decks: clone(e.decks) };
      Object.assign(s, { mode, round: v.round, time: v.time, elapsed: v.elapsed, stats: stats(v.stats), roll: [...v.roll], held: [...v.held], slots: [...v.slots], selected: v.selected, offer: v.offer, faceCursor: v.faceCursor, rerolls: v.rerolls, base: mode === "resolve" ? [...v.base] : null, patch: mode === "between" ? [...v.patch] : null,
        phase: mode === "clear" ? "won" : mode === "lost" ? "lost" : "playing", score: (n + (["reward", "between", "clear"].includes(mode) ? 1 : 0)) * 100, progress: n + (["reward", "between", "clear"].includes(mode) ? 1 : 0) });
      if (mode === "resolve") { timeline = resolve(s.slots, stats(v.base)); s.applied = timeline.frames.findLastIndex(f => f.at <= s.elapsed); const expected = s.applied >= 0 ? tuple(timeline.frames[s.applied].stats) : v.base; if (JSON.stringify(expected) !== JSON.stringify(v.stats)) throw new Error("inconsistent resolution"); s.log = timeline.frames.slice(0, s.applied + 1).map(f => f.label); }
      refresh(); return true;
    } catch { rng = initialSeed; begin(0, freshDecks(), 32, 2, 0); return false; }
  }
  const api = {
    scene: s, effects: [], hit, intent, forecast: resolve, checkpoint: checkpointState, primary, secondary, step: update,
    assign, install,
    selectDie(d) { if (!planning() || !int(d, 0, 2)) return false; s.selected = d; refresh(); return true; },
    toggleHold(d) { if (!planning() || !int(d, 0, 2)) return false; s.held[d] = !s.held[d]; refresh(); emit("lock"); return true; },
    selectOffer(o) { if (!active || s.mode !== "reward" || !int(o, 0, 2)) return false; s.offer = o; s.noticeUntil = 0; refresh(); emit("select"); return true; },
    pointer(type, x, y) {
      if (!active || !Number.isFinite(x + y)) return false;
      if (type === "down") { const h = hit(x, y); if (!h) return false; pending = { hit: h, x, y, moved: false }; if (h[0] === "die") { s.selected = h[1]; s.drag = { die: h[1], x, y, moved: false }; } return true; }
      if (type === "move" && pending) { pending.moved ||= Math.hypot(x - pending.x, y - pending.y) > 5; if (s.drag) Object.assign(s.drag, { x, y, moved: pending.moved }); return true; }
      if (type === "up" && pending) {
        const p = pending, h = hit(x, y); pending = null; s.drag = null;
        if (p.hit[0] === "die") return h?.[0] === "slot" ? assign(p.hit[1], h[1]) : !p.moved && api.selectDie(p.hit[1]);
        if (p.moved || !h || JSON.stringify(h) !== JSON.stringify(p.hit)) return false;
        if (h[0] === "primary") return primary(); if (h[0] === "secondary") return secondary();
        if (h[0] === "hold") return api.toggleHold(h[1]); if (h[0] === "slot") return assign(s.selected, h[1]);
        if (h[0] === "offer") return api.selectOffer(h[1]); if (h[0] === "face") return install(h[1], h[2]);
      }
      return false;
    },
    key(key, down) {
      if (!active || !down) return false;
      if ([" ", "Enter"].includes(key)) { if (s.mode === "reward") return install(Math.floor(s.faceCursor / 6), s.faceCursor % 6); return primary(); }
      if (key === "Escape") { api.cancel(); return true; }
      if (s.mode === "reward") { if (["1", "2", "3"].includes(key)) return api.selectOffer(Number(key) - 1); if (key.startsWith("Arrow")) { const d = Math.floor(s.faceCursor / 6), f = s.faceCursor % 6; s.faceCursor = Math.max(0, Math.min(2, d + (key === "ArrowDown" ? 1 : key === "ArrowUp" ? -1 : 0))) * 6 + Math.max(0, Math.min(5, f + (key === "ArrowRight" ? 1 : key === "ArrowLeft" ? -1 : 0))); return true; } }
      if (!planning()) return false;
      if (["1", "2", "3"].includes(key)) return api.selectDie(Number(key) - 1);
      if (["4", "5", "6"].includes(key)) return assign(s.selected, Number(key) - 4);
      if (key === "l") return api.toggleHold(s.selected);
      if (key === "ArrowLeft" || key === "ArrowRight") return api.selectDie((s.selected + (key === "ArrowLeft" ? 2 : 1)) % 3);
      return false;
    },
    cancel() { pending = null; s.drag = null; },
    retry() { if (!active) return false; const e = clone(entry); rng = e.rng; begin(s.level, e.decks, e.hp, e.energy, e.heat); return true; },
    next: primary,
    setLevel(n) { if (!active || n !== 0) return false; rng = initialSeed; begin(0, freshDecks(), 32, 2, 0); return true; },
    snapshot() { const selected = selectionStatus(); return { id, phase: s.phase, mode: s.mode, time: Math.round(s.time), level: s.level, score: s.score, progress: s.progress, goal: 6, status: selected ? `${s.status} · ${selected}` : s.status, lives: s.stats.hp, energy: s.stats.energy, heat: s.stats.heat, enemyHp: s.stats.enemy, round: s.round, abilityAvailable: s.abilityAvailable, rerolls: s.rerolls, primaryEnabled: !["rolling", "resolve", "reward"].includes(s.mode) }; },
    stop() { if (!active) return; api.cancel(); active = false; }, destroy() { api.stop(); timeline = null; },
  };
  begin(0, freshDecks(), 32, 2, 0); restore(checkpoint); return api;
}

export function paintDice() {}
