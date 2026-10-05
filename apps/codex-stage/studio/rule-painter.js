import { STUDIO_ART } from "./assets.js";

export function createRulePainter(canvas) {
  const c = canvas.getContext("2d"), art = new Image(), ink = "#25282c", cyan = "#32b9c9", coral = "#e45e50", lime = "#dce955";
  let loaded = false, disposed = false, world = null, hoverCell = -1;
  const originalTitle = canvas.title;
  const ready = new Promise(resolve => { art.onload = () => { loaded = true; resolve(); }; art.onerror = resolve; });
  art.src = STUDIO_ART["rule-smuggler"] || "/apps/codex-stage/assets/studio/rule-smuggler-art.webp";
  const point = (x, y) => { const b = canvas.getBoundingClientRect(); return { x: (x - b.left) * 960 / b.width, y: (y - b.top) * 540 / b.height }; };
  const center = (x, y) => ({ x: 103 + x * 68, y: 123 + y * 64 });
  const types = { sentry: "哨戒炮", pulse: "双脉冲炮", armor: "装甲炮", player: "走私者", cargo: "货箱", barrel: "油桶" };
  function hover(e) {
    if (!world) return; const p = point(e.clientX, e.clientY), s = world.scene, x = Math.floor((p.x - 69) / 68), y = Math.floor((p.y - 91) / 64);
    hoverCell = x >= 0 && x < 7 && y >= 0 && y < 5 ? y * 7 + x : -1;
    const card = p.y >= 440 && p.y <= 527 && p.x >= 26 && p.x < 932 ? s.cards[Math.floor((p.x - 26) / 151)] : null;
    const u = s.board.units.find(u => u.hp > 0 && u.pos[0] === x && u.pos[1] === y);
    canvas.title = card ? `${card.name} · ${card.cost} 能量：${card.hint}` : u ? `${u.id.toUpperCase()} ${types[u.kind]} · 耐久 ${u.hp}/${u.maxHp}` : p.x >= 709 && p.y >= 349 && p.y <= 395 ? "执行当前预览；布置后还可以撤销。" : p.x >= 635 && p.x < 698 && p.y >= 349 && p.y <= 395 ? "撤销最后一步，或取消第一个目标。" : originalTitle;
    canvas.style.cursor = card || hoverCell >= 0 || p.x >= 635 && p.y >= 349 && p.y <= 395 ? "pointer" : "default";
  }
  canvas.addEventListener("pointermove", hover);
  function line(points, color = ink, width = 2, dash = []) { c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.strokeStyle = color; c.lineWidth = width; c.lineCap = "round"; c.lineJoin = "round"; c.setLineDash(dash); c.stroke(); c.setLineDash([]); }
  function rect(x, y, w, h, fill, radius = 0, stroke = null, width = 2) { c.beginPath(); c.roundRect(x, y, w, h, radius); c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); } }
  function ellipse(x, y, rx, ry, fill) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); }
  function circle(x, y, r, fill, stroke = null, width = 2) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); } }
  function text(v, x, y, size = 18, color = ink, align = "left", weight = 700) { c.font = `${weight} ${size}px "Avenir Next", "PingFang SC", system-ui, sans-serif`; c.fillStyle = color; c.textAlign = align; c.textBaseline = "alphabetic"; c.fillText(v, x, y); }
  function polygon(points, fill, stroke = null, width = 2) { c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); } }
  function arrow(x, y, dir, size = 12, color = ink) { c.save(); c.translate(x, y); c.rotate(dir * Math.PI / 2); line([[-size, 0], [size, 0]], color, 3); line([[size - 7, -6], [size, 0], [size - 7, 6]], color, 3); c.restore(); }
  function sprite(kind, x, y, size, alpha = 1) {
    const i = { player: 0, sentry: 1, pulse: 2, armor: 3 }[kind];
    c.save(); c.globalAlpha *= alpha;
    if (loaded && i !== undefined) { const sw = art.naturalWidth / 2, sh = art.naturalHeight / 2; c.drawImage(art, i % 2 * sw, Math.floor(i / 2) * sh, sw, sh, x - size / 2, y - size / 2, size, size); }
    else { rect(x - size * .25, y - size * .23, size * .5, size * .46, kind === "player" ? cyan : kind === "armor" ? lime : coral, 5, ink); circle(x + 5, y, size * .11, "#fff", ink); circle(x + 7, y, size * .04, ink); }
    c.restore();
  }
  function icon(kind, x, y, color, flip = 0, size = 1) {
    c.save(); c.translate(x, y); c.scale(size, size);
    if (kind === "mirror") { line(flip ? [[-13, 13], [13, -13]] : [[-13, -13], [13, 13]], color, 6); line([[-18, 5], [-5, 5], [-5, -12]], ink, 2); }
    else if (kind === "swap") { arrow(0, -8, 0, 14, color); arrow(0, 8, 2, 14, ink); }
    else if (kind === "portal") { c.strokeStyle = color; c.lineWidth = 4; for (const x of [-10, 10]) { c.beginPath(); c.ellipse(x, 0, 6, 15, -.3, 0, Math.PI * 2); c.stroke(); } }
    else if (kind === "link") { circle(-11, -9, 7, color, ink); circle(11, 9, 7, color, ink); line([[-6, -5], [6, 5]], ink, 4); }
    else if (kind === "push") { rect(1, -11, 20, 22, color, 2, ink); arrow(-10, 0, 0, 13, ink); }
    else { rect(-15, -11, 14, 18, color, 4, ink); rect(4, -1, 14, 18, color, 4, ink); }
    c.restore();
  }
  function hp(u, x, y, scale = 1, predicted = u.hp) {
    const width = 7 * scale, gap = 11 * scale;
    for (let i = 0; i < u.maxHp; i++) rect(x + (i - (u.maxHp - 1) / 2) * gap - width / 2, y, width, 5 * scale, i < predicted ? u.kind === "cargo" ? cyan : "#ec7365" : i < u.hp ? "#edb17c" : "#b9bdb8", 1);
  }
  function floor(s, time, reduced) {
    polygon([[63, 86], [549, 86], [557, 410], [73, 426]], "#25282c");
    rect(64, 83, 485, 330, "#828d90", 3, ink, 3);
    for (let y = 0; y < 5; y++) for (let x = 0; x < 7; x++) {
      const i = y * 7 + x, p = center(x, y), wall = s.walls.includes(i), pit = s.pits.includes(i);
      rect(p.x - 32, p.y - 30, 64, 60, pit ? "#292d35" : (x + y) % 2 ? "#eef0e9" : "#e0e5e3", 2);
      if (pit) { for (let k = 0; k < 4; k++) line([[p.x - 24 + k * 14, p.y - 22], [p.x - 30 + k * 14, p.y - 13]], lime, 4); line([[p.x - 20, p.y + 17], [p.x + 19, p.y + 17]], "#4a545f", 3); }
      else if (wall) {
        polygon([[p.x - 25, p.y - 15], [p.x + 19, p.y - 15], [p.x + 28, p.y + 16], [p.x - 20, p.y + 16]], "#566571", ink);
        polygon([[p.x - 25, p.y - 15], [p.x - 20, p.y - 24], [p.x + 24, p.y - 24], [p.x + 19, p.y - 15]], "#839299", ink);
        for (let k = 0; k < 3; k++) line([[p.x - 17 + k * 13, p.y - 8], [p.x - 11 + k * 13, p.y + 7]], "#dee752", 6);
      } else { for (const dx of [-26, 26]) for (const dy of [-24, 24]) circle(p.x + dx, p.y + dy, 1.2, "#acb6b5"); }
      if (i === s.cursor || i === hoverCell) { c.strokeStyle = s.mode === "plan" ? s.cards[s.selected].color : "#708a96"; c.lineWidth = 3; c.strokeRect(p.x - 28, p.y - 26, 56, 52); }
      if (i === s.pending) { circle(p.x, p.y, 26, "#ffe68555", ink, 3); }
    }
    for (let x = 0; x < 7; x++) text(String.fromCharCode(65 + x), center(x, 0).x, 78, 13, "#637078", "center");
    for (let y = 0; y < 5; y++) text(y + 1, 51, center(0, y).y + 5, 13, "#637078", "center");
  }
  function rules(b, time, reduced) {
    if (b.link.length === 2) {
      const units = b.link.map(id => b.units.find(u => u.id === id));
      if (units.every(u => u?.hp > 0)) { const a = center(...units[0].pos), z = center(...units[1].pos); line([[a.x, a.y], [z.x, z.y]], "#b48b28", 3, [4, 7]); }
    }
    for (const m of b.mirrors) { const p = center(m.x, m.y); ellipse(p.x + 3, p.y + 8, 24, 8, "#34394630"); icon("mirror", p.x, p.y, cyan, m.flip, 1.45); }
    for (let i = 0; i < b.portals.length; i++) {
      const p = center(...b.portals[i]); ellipse(p.x, p.y + 3, 25, 15, "#656ebd"); ellipse(p.x, p.y + 2, 19, 10, "#353b68");
      c.strokeStyle = "#c9caf2"; c.lineWidth = 2; c.beginPath(); c.ellipse(p.x, p.y + 2, 15, 7, 0, reduced ? 0 : time / 600, (reduced ? 0 : time / 600) + 4); c.stroke(); text(i ? "II" : "I", p.x, p.y + 8, 14, "#f5f7ff", "center");
    }
  }
  function trajectories(s) {
    for (let k = 0; k < s.preview.shots.length; k++) {
      const shot = s.preview.shots[k], color = shot.impacts.some(i => ["you", "cargo"].includes(i.id)) ? "#d94a47" : "#46858f";
      c.save(); c.globalAlpha = s.mode === "plan" ? .63 : .2;
      for (let j = 1; j < shot.path.length; j++) {
        const a = center(shot.path[j - 1].x, shot.path[j - 1].y), b = center(shot.path[j].x, shot.path[j].y);
        if (shot.path[j].jump) { line([[a.x, a.y], [b.x, b.y]], "#7773bf", 1.5, [2, 10]); continue; }
        line([[a.x, a.y], [b.x, b.y]], color, 2, [4, 5]);
        const direction = Math.abs(a.x - b.x) > Math.abs(a.y - b.y) ? b.x > a.x ? 0 : 2 : b.y > a.y ? 1 : 3;
        arrow((a.x + b.x) / 2, (a.y + b.y) / 2, direction, 5, color);
      }
      c.restore();
    }
  }
  function unit(u, s, time, reduced) {
    const p = center(...u.pos); if (!u.hp) { if (!s.pits.includes(u.pos[1] * 7 + u.pos[0])) { ellipse(p.x, p.y + 15, 19, 7, "#3b46563b"); line([[p.x - 10, p.y + 11], [p.x + 11, p.y + 20]], "#809097", 3); } return; }
    const shot = s.mode === "resolve" && s.preview.shots.find(a => a.shooter === u.id && s.elapsed >= a.at && s.elapsed < a.at + 160);
    const recoil = shot && !reduced ? Math.sin((s.elapsed - shot.at) / 160 * Math.PI) * 5 : 0;
    ellipse(p.x + 3, p.y + 22, 24, 7, "#25283432");
    if (u.kind === "cargo") {
      rect(p.x - 23, p.y - 17, 46, 39, cyan, 3, ink); polygon([[p.x - 23, p.y - 17], [p.x - 17, p.y - 25], [p.x + 24, p.y - 25], [p.x + 23, p.y - 17]], "#9cdee0", ink);
      rect(p.x - 7, p.y - 16, 14, 37, "#e7ee5b"); rect(p.x - 11, p.y - 10, 22, 19, "#edf3ee", 2, ink); icon("link", p.x, p.y - 1, cyan, 0, .43);
    } else if (u.kind === "barrel") {
      rect(p.x - 17, p.y - 20, 34, 40, "#e2874b", 4, ink); ellipse(p.x, p.y - 20, 17, 6, "#eebe7a"); line([[p.x - 17, p.y - 11], [p.x + 17, p.y - 11]], ink, 3); line([[p.x - 17, p.y + 11], [p.x + 17, p.y + 11]], ink, 3);
      polygon([[p.x, p.y - 6], [p.x + 8, p.y + 7], [p.x - 8, p.y + 7]], "#f4e858", ink, 1.5); text("!", p.x, p.y + 5, 10, ink, "center");
    } else {
      const d = [[1, 0], [0, 1], [-1, 0], [0, -1]][u.dir]; sprite(u.kind, p.x - d[0] * recoil, p.y - 7 - d[1] * recoil, u.kind === "armor" ? 70 : 67);
      if (u.kind !== "player") { const x = p.x + d[0] * 24, y = p.y + d[1] * 22; circle(x, y, 11, "#fcfaec", ink, 1.5); arrow(x, y, u.dir, 6, coral); }
    }
    if (!["player", "cargo", "barrel"].includes(u.kind)) { rect(p.x - 30, p.y - 29, 17, 17, ink, 2); text(u.id.toUpperCase(), p.x - 21.5, p.y - 16, 12, "#fff", "center"); }
    const predicted = s.mode === "plan" ? s.preview.board.units.find(t => t.id === u.id)?.hp ?? u.hp : u.hp; hp(u, p.x, p.y + 24, 1, predicted);
  }
  function impacts(s, reduced) {
    if (s.mode !== "resolve") return;
    for (const shot of s.preview.shots) {
      if (s.elapsed >= shot.at && s.elapsed < shot.hitAt) {
        const t = Math.max(0, (s.elapsed - shot.at) / 65), i = Math.min(shot.path.length - 2, Math.floor(t)); if (i < 0) continue;
        const a = center(shot.path[i].x, shot.path[i].y), z = center(shot.path[i + 1].x, shot.path[i + 1].y), k = t - Math.floor(t), jump = shot.path[i + 1].jump;
        if (!jump) { const x = a.x + (z.x - a.x) * k, y = a.y + (z.y - a.y) * k; line([[a.x, a.y], [x, y]], coral, 5); circle(x, y, reduced ? 5 : 7, "#fff6b5", coral, 2); }
      }
      const age = s.elapsed - shot.hitAt; if (age < 0 || age > 300) continue;
      for (const hit of shot.impacts) {
        const p = center(hit.x, hit.y), k = age / 300;
        c.save(); c.globalAlpha = 1 - k;
        if (!reduced) for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, r = 13 + k * 26; line([[p.x + Math.cos(a) * r, p.y + Math.sin(a) * r], [p.x + Math.cos(a) * (r + 7), p.y + Math.sin(a) * (r + 7)]], coral, 3); }
        text(`-${hit.before - hit.hp}`, p.x, p.y - 28 - (reduced ? 0 : k * 16), 22, coral, "center"); c.restore();
      }
      for (const explosion of shot.explosions) { const p = center(explosion.x, explosion.y); c.save(); c.globalAlpha = 1 - age / 300; circle(p.x, p.y, reduced ? 26 : 18 + age / 7, "#f5d64d65", coral, 3); c.restore(); }
    }
  }
  function hud(s, b, stopped) {
    text("RULE SMUGGLER", 27, 27, 13, "#6c757e"); text("规则走私者", 25, 62, 29);
    const you = b.units.find(u => u.id === "you"), cargo = b.units.find(u => u.id === "cargo");
    for (const [u, x, label] of [[you, 327, "你"], [cargo, 430, "货箱"]]) { text(label, x, 31, 14, "#66767a", "center"); hp(u, x, 44, 1.8); }
    text(`${s.level + 1} / 3`, 586, 31, 16, "#69767b"); text(s.title, 586, 64, 27);
    text(`第 ${Math.min(6, s.turn + 1)} / 6 轮`, 925, 28, 14, "#69767b", "right");
    for (let i = 0; i < 3; i++) polygon([[860 + i * 25, 42], [869 + i * 25, 42], [863 + i * 25, 51], [870 + i * 25, 51], [855 + i * 25, 65], [859 + i * 25, 54], [853 + i * 25, 54]], i < s.energy ? "#b2bd26" : "#c7ccc4");
    line([[586, 88], [931, 88]], "#aab5b5", 1);
    text("守住货箱 · 清空守卫", 590, 113, 15, "#68777d"); text("预演耐久", 924, 113, 13, "#68777d", "right");
    s.board.units.filter(u => ["sentry", "pulse", "armor"].includes(u.kind)).forEach((original, i) => {
      const u = b.units.find(u => u.id === original.id), y = 145 + i * 50, predicted = s.preview.board.units.find(t => t.id === u.id), fires = s.preview.shots.some(t => t.shooter === u.id);
      sprite(u.kind, 613, y + 3, 47, u.hp ? 1 : .25);
      text(`${u.id.toUpperCase()}  ${types[u.kind]}`, 646, y, 17, u.hp ? ink : "#949c9f");
      if (u.hp) { arrow(659, y + 18, u.dir, 9, fires ? coral : "#a4acae"); text(fires ? `${u.kind === "pulse" ? 2 : 1} 伤害` : "被提前拦截", 679, y + 22, 12, "#6f7b7d"); }
      text(`${u.hp} > ${s.mode === "plan" ? predicted.hp : u.hp}`, 922, y + 8, 19, predicted.hp < u.hp ? coral : "#68777d", "right");
      line([[592, y + 33], [931, y + 33]], "#ccd3ce", 1);
    });
    const isClear = s.mode === "clear", isLost = s.phase === "lost", warning = s.preview.playerHp < you.hp || s.preview.cargoHp < cargo.hp;
    const title = stopped ? "已存档，下次继续" : isClear ? "漂亮的清场" : isLost ? "行动失败" : s.mode === "resolve" ? "正在执行" : s.preview.win ? "预演：全员清场" : `预演：剩余 ${s.preview.remaining} 台`;
    text(title, 591, 307, 23, isLost || warning ? coral : ink);
    text(isClear ? "规则留在场上，成果已经到手" : isLost ? "重新布置，仍有别的解法" : s.mode === "resolve" ? "炮弹、折跃与爆炸按预演发生" : warning ? `风险：你 ${s.preview.playerHp}/3 · 货箱 ${s.preview.cargoHp}/3` : "你与货箱安全", 592, 331, 15, warning ? coral : "#6b787b");
    rect(639, 352, 60, 45, "#bec7c0", 4); rect(635, 349, 60, 45, s.abilityAvailable ? "#f8faf3" : "#e2e6e2", 4, ink);
    line([[671, 362], [656, 372], [671, 382]], s.abilityAvailable ? ink : "#a2ada7", 3); line([[658, 372], [680, 372]], s.abilityAvailable ? ink : "#a2ada7", 3);
    const enabled = !stopped && s.mode !== "resolve" && s.pending === null;
    rect(713, 353, 219, 45, ink, 4); rect(709, 349, 219, 45, enabled ? isLost ? coral : lime : "#b9c5bf", 4, ink);
    polygon([[726, 362], [738, 372], [726, 382]], ink); text(isLost ? "重新布置" : s.primaryLabel, 831, 379, 20, ink, "center");
    if (s.notice && s.noticeUntil > s.time) text(s.notice, 592, 418, 14, coral);
    else if (s.pending !== null) { const p = s.pending; text(`已选 ${String.fromCharCode(65 + p % 7)}${Math.floor(p / 7) + 1} · 第二个目标`, 592, 418, 14, "#6e5b2e"); }
    else text(s.mode === "plan" ? "布置阶段" : s.mode === "resolve" ? "连锁结算" : "本场结束", 592, 418, 13, "#71817e");
  }
  function hand(s) {
    const labels = [s.flip ? "斜向 /" : "斜向 \\", "交换两个单位", "连接两个空格", "伤害同时传递", "推开一格", "移动一格"];
    for (let i = 0; i < 6; i++) {
      const card = s.cards[i], x = 26 + i * 151, y = 442, locked = !s.unlocked.includes(i), used = s.used.includes(i), chosen = s.selected === i;
      rect(x + 3, y + 4, 142, 83, "#25282c", 4);
      rect(x, y, 142, 83, locked || used ? "#d7ded9" : "#fbfcf6", 4, chosen && !used ? card.color : ink, chosen ? 3 : 2);
      rect(x + 2, y + 2, 138, 5, locked || used ? "#b4c0ba" : card.color, 1);
      text(i + 1, x + 11, y + 24, 12, "#6e7c7c"); text(card.name, x + 32, y + 28, 20, locked || used ? "#89978f" : ink);
      circle(x + 123, y + 22, 12, locked || used ? "#c2ccc3" : lime, ink, 1); text(card.cost, x + 123, y + 27, 15, ink, "center");
      c.save(); c.globalAlpha = locked || used ? .4 : 1; icon(card.id, x + 23, y + 57, card.color, s.flip, .72); c.restore();
      text(locked ? i === 4 ? "第三场开放" : "第二场开放" : used ? "本轮已用" : labels[i], x + 46, y + 61, 12, locked || used ? "#8b978f" : "#4e6068");
      if (chosen && !locked && !used) line([[x + 11, y + 74], [x + 131, y + 74]], card.color, 2);
    }
  }
  function draw(g, { reduced = false, stopped = false } = {}) {
    if (disposed) return; world = g; const s = g.scene, b = g.display(), dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    if (canvas.width !== Math.round(960 * dpr) || canvas.height !== Math.round(540 * dpr)) { canvas.width = Math.round(960 * dpr); canvas.height = Math.round(540 * dpr); }
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, 960, 540); rect(0, 0, 960, 540, "#eaf0e9");
    polygon([[0, 0], [215, 0], [178, 72], [0, 72]], "#dce957");
    for (let x = 10; x < 960; x += 13) for (let y = 10; y < 540; y += 13) if (x < 34 || x > 945 || y > 427) circle(x, y, .7, "#8b969038");
    const time = reduced ? 0 : s.time; floor(s, time, reduced); rules(b, time, reduced);
    if (s.mode === "plan" || s.mode === "resolve") trajectories(s);
    for (const u of [...b.units].sort((a, z) => a.pos[1] - z.pos[1])) unit(u, s, time, reduced);
    impacts(s, reduced); hud(s, b, stopped); hand(s);
    if (s.mode === "clear" || s.phase === "lost") {
      c.save(); c.translate(306, 247); c.rotate(-.075); rect(-133, -32, 266, 66, "#fafbf5ef", 2, s.mode === "clear" ? ink : coral, 3);
      text(s.mode === "clear" ? "规则生效 · 清场" : "这次，失手了", 0, 10, 27, s.mode === "clear" ? ink : coral, "center"); c.restore();
    }
    if (stopped) { rect(154, 89, 311, 35, "#f7fcf1f0", 3, ink); text("已暂停 · 保存当前布置与弹道", 310, 112, 16, ink, "center"); }
  }
  return { ready, draw, point, get diagnostics() { return { assetLoaded: loaded, contexts: disposed ? 0 : 1 }; }, destroy() { disposed = true; art.onload = art.onerror = null; canvas.removeEventListener("pointermove", hover); canvas.title = originalTitle; canvas.style.cursor = ""; } };
}
