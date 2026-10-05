import { STUDIO_ART } from "./assets.js";

export function createKitchenPainter(canvas) {
  const c = canvas.getContext("2d"), ink = "#263b3b", art = new Image();
  let disposed = false, loaded = false, lastScene = null;
  const originalTitle = canvas.title;
  const descriptions = { pop: "连续射击，对装甲伤害较低；改装后弹丸更强。", frost: "冷气减速；改装后冷冻范围扩大。先冷冻再加热可触发蒸汽冲击。", pan: "把敌人弹回上游，撞击后排；总管更重，击退距离较短。", heat: "范围加热、持续灼烧；碰到冷冻目标触发蒸汽冲击。" };
  function hover(e) {
    if (!lastScene) return; const b = canvas.getBoundingClientRect(), x = (e.clientX - b.left) * 960 / b.width, y = (e.clientY - b.top) * 540 / b.height;
    const slot = lastScene.slots.find(p => Math.hypot(p.x - x, p.y - y) < 39), kind = y >= 465 && x >= 87 && x < 519 ? lastScene.equipment[Math.floor((x - 87) / 108)].kind : slot?.tower?.kind;
    canvas.title = kind ? `${lastScene.equipment.find(t => t.kind === kind).name}：${descriptions[kind]}` : y >= 465 && x >= 768 ? "出餐铃：短暂停住清扫队，20 秒冷却。" : originalTitle;
  }
  canvas.addEventListener("pointermove", hover);
  const ready = new Promise(resolve => { art.onload = () => { loaded = true; resolve(); }; art.onerror = () => resolve(); });
  art.src = STUDIO_ART["kitchen-defense"] || "/apps/codex-stage/assets/studio/kitchen-defense-art.jpg";
  function box(x, y, w, h, fill, stroke = ink, radius = 6, lineWidth = 2) {
    c.beginPath(); c.roundRect(x, y, w, h, radius); c.fillStyle = fill; c.fill();
    if (stroke) { c.lineWidth = lineWidth; c.strokeStyle = stroke; c.stroke(); }
  }
  function ellipse(x, y, rx, ry, fill, stroke = null, width = 2) {
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
    if (stroke) { c.lineWidth = width; c.strokeStyle = stroke; c.stroke(); }
  }
  function line(points, color = ink, width = 2) {
    c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.strokeStyle = color; c.lineWidth = width; c.lineJoin = c.lineCap = "round"; c.stroke();
  }
  function text(value, x, y, size = 18, color = ink, align = "left", weight = 700) {
    c.font = `${weight} ${size}px "Avenir Next", "PingFang SC", system-ui, sans-serif`; c.fillStyle = color; c.textAlign = align; c.textBaseline = "alphabetic"; c.fillText(value, x, y);
  }
  function star(x, y, r, color) {
    c.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, n = i % 2 ? r * .45 : r; const px = x + Math.cos(a) * n, py = y + Math.sin(a) * n; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); c.fillStyle = color; c.fill();
  }
  function snow(x, y, size) {
    for (let i = 0; i < 3; i++) { const a = Math.PI * i / 3, dx = Math.cos(a) * size, dy = Math.sin(a) * size; line([[x - dx, y - dy], [x + dx, y + dy]], "#effcff", 2); }
  }
  function coin(x, y, size = 9) { ellipse(x, y, size, size, "#ffdc70", "#a87926", 1.5); line([[x, y - size * .5], [x, y + size * .5]], "#a87926", 2); }
  function bell(x, y, scale = 1) {
    c.save(); c.translate(x, y); c.scale(scale, scale); ellipse(0, 11, 22, 5, "#af762b", ink);
    c.beginPath(); c.moveTo(-20, 9); c.bezierCurveTo(-19, -19, 19, -19, 20, 9); c.closePath(); c.fillStyle = "#ffd267"; c.fill(); c.strokeStyle = ink; c.lineWidth = 2; c.stroke();
    line([[-5, -14], [5, -14]], ink, 3); line([[-13, 4], [-11, -3]], "#fff4ae", 3); c.restore();
  }
  function tower(kind, x, y, t = {}, scale = 1, time = 0) {
    c.save(); c.translate(x, y); c.scale(scale, scale);
    const recoil = t.recoil || 0;
    ellipse(1, 25, 28, 9, "#183f3927");
    if (kind === "pop") {
      box(-23, 10, 46, 15, "#cc4a50"); ellipse(-15, 27, 5, 5, ink); ellipse(15, 27, 5, 5, ink);
      box(-20, -27 + recoil * 12, 40, 39, "#c1e4dc"); box(-23, -32 + recoil * 12, 46, 9, "#e36561");
      box(-15, -20, 30, 22, "#f3fae8", "#496361", 2, 1);
      for (let i = 0; i < 9; i++) { const a = (i * 17) % 26 - 13, b = (i * 7) % 16 - 10; ellipse(a, b, 4, 3, i % 2 ? "#ffd768" : "#fff1b4", "#d9b34b", .7); }
      box(-7, 12, 14, 8, "#fff0cf", null, 2); line([[-15, 14], [-15, 20]], "#f6c29b");
      c.save(); c.rotate((t.angle ?? -Math.PI / 2) + Math.PI / 2); box(-7, -45 + recoil * 20, 14, 24, "#4c6468"); box(-9, -47 + recoil * 20, 18, 6, "#d0ddd6"); c.restore();
    } else if (kind === "frost") {
      box(-22, -30, 44, 55, "#3096a9"); box(-18, -27, 36, 48, "#c5f0e9"); line([[-17, -8], [17, -8]], "#438389");
      box(9, -21, 4, 9, "#60898c", null, 1); box(9, -1, 4, 13, "#60898c", null, 1);
      ellipse(-3, 5, 11, 11, "#34879a", ink, 1.5); snow(-3, 5, 8);
      for (let i = 0; i < 3; i++) line([[-12 + i * 10, 28], [-12 + i * 10, 31]], ink, 4);
      if (recoil > 0) for (let i = 0; i < 4; i++) snow(-22 + i * 16, -39 - Math.sin(time / 100 + i) * 5, 3);
    } else if (kind === "pan") {
      box(-25, 14, 50, 15, "#e7b443"); box(-20, 17, 40, 7, "#f3d06e", null, 2);
      const lift = recoil * 58;
      for (let i = 0; i < 4; i++) ellipse(0, 10 - i * (5 + lift / 4), 11, 3.5, "#8b9f97", ink, 1.5);
      c.save(); c.translate(0, -9 - lift); c.rotate(recoil * -1.8);
      box(15, -4, 30, 8, "#c75353", ink, 3); ellipse(0, 0, 23, 13, "#7f9892", ink, 3); ellipse(0, -2, 18, 9, "#324c4c", "#afc5b9", 2); line([[-10, -4], [5, -7]], "#718a81", 2); c.restore();
    } else {
      box(-26, -24, 52, 45, "#de7053"); box(-23, -22, 46, 34, "#293e41");
      for (let i = 0; i < 3; i++) ellipse(0, -7, 17 - i * 5, 11 - i * 3, "#273c3b", recoil ? "#ffb657" : "#ba7157", 2.5);
      ellipse(-12, 17, 3, 3, "#f7d076", ink, 1); ellipse(12, 17, 3, 3, "#f7d076", ink, 1);
      if (recoil > 0) for (let i = 0; i < 3; i++) { const a = i * 12 - 12; c.beginPath(); c.moveTo(a - 5, -19); c.quadraticCurveTo(a - 7, -33, a, -37); c.quadraticCurveTo(a + 9, -24, a + 5, -19); c.fillStyle = "#ffd574"; c.fill(); }
      line([[-19, 25], [-12, 25]], ink, 4); line([[12, 25], [19, 25]], ink, 4);
    }
    if (t.level === 2) { star(25, -24, 9, "#fff3a5"); star(25, -24, 5, "#df9f32"); }
    c.restore();
  }
  function robot(e, p, time, reduced) {
    const big = e.kind === "boss", shell = e.kind === "shell", runner = e.kind === "runner", scale = big ? 1.6 : shell ? 1.1 : .9;
    const air = reduced ? 0 : Math.sin((e.air || 0) / .55 * Math.PI) * 24;
    ellipse(p.x, p.y + 15, 23 * scale, 9 * scale, "#25464035");
    c.save(); c.translate(p.x, p.y - air); c.rotate(reduced ? 0 : Math.sin(time / 90 + e.id) * (e.stun > 0 ? .09 : .025)); c.scale(scale, scale);
    const wheel = reduced ? 0 : Math.sin(time / 60 + e.id) * 2;
    box(-28, -11, 9, 27, "#334747"); box(19, -11, 9, 27, "#334747");
    for (let i = 0; i < 3; i++) { line([[-27, -5 + i * 7 + wheel], [-20, -5 + i * 7 + wheel]], "#71817a", 2); line([[20, -5 + i * 7 + wheel], [27, -5 + i * 7 + wheel]], "#71817a", 2); }
    const fill = big ? "#aa6981" : shell ? "#aaa997" : runner ? "#e78370" : "#f5dfaa";
    box(-23, -22, 46, 43, fill, ink, 8, 2.5); box(-18, -18, 36, 11, big ? "#dbc2be" : "#fff0ce", ink, 3, 1.5);
    line([[-12, -13], [12, -13]], shell ? "#707f7d" : "#b6996d", 2); box(-16, -2, 32, 14, "#264549", ink, 4, 1);
    const face = e.chill > 0 ? "#bcf7ff" : big ? "#ffc27d" : "#e5f9d4";
    if (e.stun > 0) { line([[-10, 2], [-5, 8]], face, 2); line([[-5, 2], [-10, 8]], face, 2); line([[5, 2], [10, 8]], face, 2); line([[10, 2], [5, 8]], face, 2); }
    else { box(-10, 2, 5, 6, face, null, 1); box(5, 2, 5, 6, face, null, 1); }
    line([[-19, 24], [-25, 29]], ink, 2); line([[-19, 24], [-15, 30]], ink, 2); line([[19, 24], [25, 29]], ink, 2); line([[19, 24], [15, 30]], ink, 2);
    if (runner) { c.save(); c.translate(0, -27); c.rotate(Math.sin(time / 70) * .12); line([[-30, 0], [30, 0]], "#ad554f", 4); ellipse(0, 0, 5, 4, "#ffdf9c", ink, 1.5); c.restore(); }
    if (shell || big) { for (const x of [-17, 17]) { ellipse(x, -15, 2, 2, ink); ellipse(x, 16, 2, 2, ink); } line([[-11, 16], [11, 16]], "#eec85e", 3); }
    if (big) { box(-13, -35, 26, 9, "#f7d46c", ink, 3); ellipse(0, -39, 5, 5, e.age % 9 < 2.5 ? "#ff7673" : "#77d7a3", ink, 1.5); }
    if (e.chill > 0) { snow(-27, -18, 6); snow(23, 19, 4); c.strokeStyle = "#71d5ed"; c.lineWidth = 2; c.strokeRect(-26, -25, 52, 49); }
    if (e.heat > 0) for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-15 + i * 15, -27); c.quadraticCurveTo(-22 + i * 15, -33, -11 + i * 15, -40); c.strokeStyle = "#eb7754"; c.lineWidth = 2; c.stroke(); }
    if (e.hit > 0 && !reduced) { star(24, -20, 7, "#fff4be"); }
    c.restore();
    const width = big ? 70 : 39, yy = p.y - 33 * scale - air;
    box(p.x - width / 2, yy, width, 5, "#314943", null, 2); box(p.x - width / 2 + 1, yy + 1, Math.max(0, (width - 2) * e.hp / e.maxHp), 3, big ? "#e48499" : "#61bca0", null, 1);
    if (big && e.age % 9 < 2.5) { text("装甲充能", p.x, yy - 8, 13, "#623548", "center"); }
  }
  function track(s, time, reduced) {
    line(s.route, "#344f4c", 52); line(s.route, "#e3e5d6", 46); line(s.route, "#f4f3de", 34);
    c.save(); c.setLineDash([2, 17]); c.lineDashOffset = reduced ? 0 : -time / 65; line(s.route, "#a6b8a77a", 32); c.restore();
    for (const y of [166, 288, 410]) for (const x of [290, 455, 620]) {
      const sign = y === 288 ? 1 : -1; line([[x - sign * 6, y - 5], [x, y], [x - sign * 6, y + 5]], "#8daba0", 2);
    }
    box(886, 139, 52, 54, "#668b87", ink, 5); for (let i = 0; i < 4; i++) line([[897, 148 + i * 11], [927, 148 + i * 11]], "#aecac0", 3);
    box(40, 382, 57, 53, "#d75255", ink, 5); box(49, 390, 39, 32, "#fff0bd", ink, 3); ellipse(69, 406, 12, 6, "#ede9d3", "#bcc5b2", 2); bell(69, 385, .5);
  }
  function particles(s, time, reduced) {
    for (const f of s.fx) {
      const k = 1 - f.life / f.total; c.save(); c.globalAlpha = Math.min(1, f.life * 3);
      if (f.kind === "arc") line([[f.x, f.y], [(f.x + f.tx) / 2, Math.min(f.y, f.ty) - 23], [f.tx, f.ty]], "#ffc55c", 3);
      else if (f.kind === "steam") {
        for (let i = 0; i < 7; i++) { const a = i * Math.PI * 2 / 7, r = f.size * (reduced ? .35 : k * .65); ellipse(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r - (reduced ? 0 : k * 24), 15 + k * 7, 12 + k * 5, "#f1ffefb0", "#89bfc070", 1); }
      } else if (f.kind === "frost") { for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; snow(f.x + Math.cos(a) * f.size * k, f.y + Math.sin(a) * f.size * k, 4); } }
      else if (f.kind === "heat") { c.strokeStyle = "#ef80536e"; c.lineWidth = 3; c.beginPath(); c.ellipse(f.x, f.y, f.size * .65, f.size * .3, 0, 0, Math.PI * 2); c.stroke(); }
      else if (f.kind === "pan") { line([[f.x + 25, f.y - 7], [f.x + 43, f.y - 18]], "#bd852f", 3); star(f.x, f.y, 10 * (1 - k), "#ffdb73"); }
      else if (f.kind === "build") { c.strokeStyle = "#f8df8f"; c.lineWidth = 3; c.beginPath(); c.ellipse(f.x, f.y + 13, f.size * k, f.size * k * .4, 0, 0, Math.PI * 2); c.stroke(); }
      else { for (let i = 0; i < 5; i++) { const a = i * Math.PI * .4, r = reduced ? 6 : k * f.size; c.save(); c.translate(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r - k * 13); c.rotate(a + k); box(-3, -3, 6, 6, f.kind === "leak" ? "#d35253" : i % 2 ? "#e7b852" : "#88b5a5", null, 1); c.restore(); } }
      if (f.text) text(f.text, f.x, f.y - 35 - (reduced ? 0 : k * 15), f.kind === "scrap" ? 14 : 17, f.kind === "steam" ? "#257879" : "#6e562e", "center");
      c.restore();
    }
  }
  function hud(s) {
    box(22, 15, 264, 67, "#fff9e9f5", ink, 6); text("KITCHEN / 晚班", 37, 39, 16, "#577a6a");
    coin(45, 62, 9); text(s.coins, 62, 69, 23); line([[134, 49], [134, 72]], "#d6d9c5", 1);
    text("出餐口", 150, 66, 15); for (let i = 0; i < 8; i++) box(205 + (i % 4) * 16, 46 + Math.floor(i / 4) * 14, 11, 9, i < s.lives ? "#d85b5d" : "#d6d5c5", null, 2);
    box(354, 19, 264, 59, "#fff9e9f5", ink, 6); text(`第 ${Math.max(1, s.wave)} / 5 波`, 371, 42, 17);
    text(s.mode === "prep" ? "备餐时间" : s.mode === "reward" ? "清扫队已清空" : `${s.enemies.length} 台在场`, 371, 64, 14, "#608374");
    for (let i = 0; i < 5; i++) { ellipse(510 + i * 21, 49, 7, 7, i < s.wave ? "#d66a57" : "#d7dfcf", ink, 1); if (i < s.wave - (s.mode === "battle" ? 1 : 0)) line([[506 + i * 21, 49], [510 + i * 21, 53], [514 + i * 21, 46]], "#fff2cc", 1.5); }
    box(787, 21, 149, 54, s.mode === "prep" ? "#d65356" : "#335c58", ink, 6, 2);
    text(s.mode === "prep" ? "开餐" : s.mode === "reward" ? "新配方" : s.phase === "won" ? "收工" : "营业中", 861, 54, 24, "#fff5d9", "center");
    box(78, 457, 858, 74, "#fff9eaf5", ink, 7, 2.5);
    for (let i = 0; i < 4; i++) {
      const x = 87 + i * 108, item = s.equipment[i], selected = s.selectedKind === i;
      box(x, 465, 102, 58, selected ? "#f9e6b0" : "#eff1df", selected ? "#b55a43" : "#abbcab", 5, selected ? 2.5 : 1);
      c.save(); if (s.coins < item.cost) c.globalAlpha = .55; tower(item.kind, x + 26, 493, {}, .54); c.restore();
      text(item.name, x + 53, 487, 12, ink); coin(x + 59, 506, 6); text(item.cost, x + 70, 512, 17);
    }
    const chosen = s.slots[s.selectedSlot]?.tower, upgrade = chosen && chosen.level < 2 && s.coins >= 45;
    box(532, 465, 124, 58, upgrade ? "#385f57" : "#d7deca", "#6f897a", 5, 1);
    line([[548, 493], [556, 485], [564, 493]], upgrade ? "#f7e9be" : "#829780", 3); line([[556, 485], [556, 505]], upgrade ? "#f7e9be" : "#829780", 3);
    text(chosen?.level === 2 ? "已改装" : "改装", 578, 488, 16, upgrade ? "#fff1d0" : "#69826e"); text(chosen?.level === 2 ? "II" : "45", 578, 511, 17, upgrade ? "#f1cd77" : "#69826e");
    box(666, 465, 80, 58, "#e5e8d7", "#abbcab", 5, 1); text("回收", 706, 488, 16, chosen && s.mode === "prep" ? "#385f57" : "#8a9a85", "center"); text(chosen ? `+${Math.floor(chosen.spent * .65)}` : "-", 706, 512, 17, "#6d836e", "center");
    const canBell = s.mode === "battle" && s.bell <= 0; box(766, 465, 161, 58, canBell ? "#f3cc61" : "#e1dfc6", "#ad9a64", 5, 1);
    bell(796, 493, .63); text("摇铃", 823, 488, 17); text(s.bell > 0 ? `${Math.ceil(s.bell)}s` : s.mode === "battle" ? "就绪" : "待开餐", 823, 511, 14, "#887745");
  }
  function rewards(s) {
    c.fillStyle = "#214b416e"; c.fillRect(0, 88, 960, 360);
    box(129, 111, 704, 303, "#fff9e9", ink, 7, 3); text("今日特别配方", 481, 150, 28, ink, "center"); text("本轮清场 · 任选一份", 481, 175, 16, "#73917b", "center");
    s.offers.forEach((id, i) => {
      const r = s.recipes[id], x = 149 + i * 225; box(x, 195, 211, 165, "#f0f0dc", i === s.rewardCursor ? r.color : "#b6c2ac", 6, i === s.rewardCursor ? 3 : 1.5);
      if (id === "steam") { tower("frost", x + 76, 237, {}, .65); tower("heat", x + 131, 242, { recoil: .1 }, .65); }
      else if (id === "spring") tower("pan", x + 105, 239, { recoil: .12 }, .8);
      else if (id === "ricochet") tower("pop", x + 105, 239, {}, .8);
      else if (id === "frostbite") tower("frost", x + 105, 239, {}, .8);
      else if (id === "overdrive") tower("heat", x + 105, 242, { recoil: .1 }, .8);
      else { for (let j = 0; j < 3; j++) coin(x + 85 + j * 19, 240 - (j % 2) * 10, 15); }
      text(r.name, x + 105, 291, 21, ink, "center");
      const parts = r.detail.split(/[，、]/); parts.forEach((p, n) => text(p, x + 105, 318 + n * 22, 14, "#66816c", "center", 500));
    });
    text(`出餐口 ${s.lives}/8     击退 ${s.combos.bounce}     蒸汽冲击 ${s.combos.steam}`, 481, 391, 16, "#688372", "center");
  }
  function draw(world, { reduced = false, stopped = false } = {}) {
    if (disposed) return;
    const bounds = canvas.getBoundingClientRect(), dpr = Math.min(2, globalThis.devicePixelRatio || 1), width = Math.max(1, Math.round((bounds.width || 960) * dpr)), height = Math.round(width * 9 / 16);
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    c.setTransform(width / 960, 0, 0, height / 540, 0, 0); c.imageSmoothingEnabled = true;
    const s = world.scene, time = reduced ? 0 : s.time; lastScene = s;
    c.fillStyle = "#cce2cb"; c.fillRect(0, 0, 960, 540);
    if (loaded) c.drawImage(art, 0, 0, 960, 540);
    else for (let y = 100; y < 540; y += 40) for (let x = 0; x < 960; x += 40) box(x, y, 39, 39, (x / 40 + y / 40) % 2 ? "#d3e4cb" : "#b8d7c7", null, 0);
    track(s, time, reduced);
    const selected = s.slots[s.selectedSlot];
    if (selected?.tower) { const range = s.equipment.find(e => e.kind === selected.tower.kind).range; c.beginPath(); c.arc(selected.x, selected.y, range, 0, Math.PI * 2); c.fillStyle = "#3d8e8a0a"; c.fill(); c.setLineDash([4, 6]); c.strokeStyle = "#408c8780"; c.lineWidth = 1; c.stroke(); c.setLineDash([]); }
    s.slots.forEach((p, i) => {
      const active = i === s.cursor; box(p.x - 32, p.y - 28, 64, 60, p.tower ? "#9aa999" : "#d4ddbf", active ? "#d76d50" : "#819b88", 7, active ? 3 : 1.5);
      if (!p.tower) { line([[p.x - 7, p.y], [p.x + 7, p.y]], "#89a48d", 2); line([[p.x, p.y - 7], [p.x, p.y + 7]], "#89a48d", 2); text(i + 1, p.x + 21, p.y + 24, 10, "#799581", "center"); }
    });
    const actors = [...s.slots.filter(p => p.tower).map(p => ({ y: p.y, slot: p })), ...s.enemies.map(e => ({ y: world.position(e.d).y, enemy: e }))].sort((a, b) => a.y - b.y);
    for (const a of actors) if (a.slot) tower(a.slot.tower.kind, a.slot.x, a.slot.y, a.slot.tower, 1, time); else robot(a.enemy, world.position(a.enemy.d), time, reduced);
    for (const p of s.shots) { ellipse(p.x, p.y, 5, 4, "#fff2c1", "#bd9956", 1); ellipse(p.x - 3, p.y - 3, 3, 3, "#ffdf7f", null); }
    particles(s, time, reduced);
    if (s.bellFlash > 0) { c.globalAlpha = s.bellFlash; c.strokeStyle = "#fff4be"; c.lineWidth = 6; c.strokeRect(8, 95, 944, 348); c.globalAlpha = 1; }
    hud(s);
    if (s.mode === "reward" && s.phase === "playing") rewards(s);
    if (s.phase !== "playing") {
      c.fillStyle = "#244b4177"; c.fillRect(0, 90, 960, 355); box(230, 144, 500, 240, "#fff9e9", ink, 7, 3);
      bell(480, 196, 1.3); text(s.phase === "won" ? "晚班，顺利收工。" : "今天的厨房有点忙。", 480, 262, 32, ink, "center");
      text(`守住 ${s.wave}/5 波 · 回收 ${s.kills} 台 · ${s.score} 分`, 480, 301, 20, "#668676", "center");
      text(`蒸汽 ${s.combos.steam} 次 / 弹回 ${s.combos.bounce} 次 / 追尾 ${s.combos.collision} 次`, 480, 341, 17, "#a66b47", "center");
    }
    if (stopped) { c.fillStyle = "#183d3388"; c.fillRect(0, 0, 960, 540); box(250, 219, 460, 98, "#fff9eaf2", ink, 7, 2); text(s.phase === "playing" ? "任务已完成 · 厨房已存档" : "任务已完成 · 本班已结束", 480, 262, 27, ink, "center"); text(s.phase === "playing" ? "下次任务继续这一班" : "下次任务开始新的一班", 480, 294, 18, "#698777", "center"); }
  }
  return { ready, draw, point(x, y) { const b = canvas.getBoundingClientRect(); return { x: (x - b.left) * 960 / b.width, y: (y - b.top) * 540 / b.height }; }, get diagnostics() { return { renderer: "illustrated-canvas", assetLoaded: loaded, contexts: disposed ? 0 : 1 }; }, destroy() { disposed = true; lastScene = null; art.onload = art.onerror = null; canvas.removeEventListener("pointermove", hover); canvas.title = originalTitle; } };
}
