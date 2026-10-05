import { STUDIO_ART } from "./assets.js";

export function createDicePainter(canvas) {
  const c = canvas.getContext("2d"), art = new Image(), ink = "#20252a", white = "#f2f4ef", yellow = "#e2e949", red = "#f15b47", cyan = "#48bbd1";
  const originalTitle = canvas.title; let loaded = false, disposed = false, world = null, hovered = null;
  const ready = new Promise(resolve => { art.onload = () => { loaded = true; resolve(); }; art.onerror = resolve; });
  art.src = STUDIO_ART["dice-foundry"] || "/apps/codex-stage/assets/studio/dice-foundry-art.webp";
  const point = (x, y) => { const b = canvas.getBoundingClientRect(); return { x: (x - b.left) * 960 / b.width, y: (y - b.top) * 540 / b.height }; };
  function hover(e) {
    if (!world) return; const p = point(e.clientX, e.clientY), s = world.scene; hovered = world.hit(p.x, p.y);
    let label = originalTitle;
    if (hovered) { const [kind, a, b] = hovered;
      if (kind === "die") label = `${"ABC"[a]} · ${s.roll[a] + 1}点 · ${s.faces[s.decks[a][s.roll[a]]].hint} 拖到设备，或选中后点设备。`;
      else if (kind === "hold") label = s.held[a] ? "取消保留，下次重掷这颗骰子" : "保留这颗骰子，重掷时不变";
      else if (kind === "slot") label = `${s.machines[a].name}：${s.machines[a].hint}`;
      else if (kind === "offer") label = s.faces[s.offers[a]].hint;
      else if (kind === "face") label = `${"ABC"[a]} · ${b + 1}点 · ${s.faces[s.decks[a][b]].name} → ${s.faces[s.offers[s.offer]].name}`;
      else if (kind === "primary") label = s.primaryLabel;
      else label = s.secondaryLabel;
    }
    canvas.title = label; canvas.style.cursor = hovered ? hovered[0] === "die" ? "grab" : "pointer" : "default";
  }
  canvas.addEventListener("pointermove", hover);
  function rect(x, y, w, h, fill, r = 0, stroke = null, width = 2) { c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); } }
  function line(points, color = ink, width = 2, dash = []) { c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.strokeStyle = color; c.lineWidth = width; c.lineJoin = "round"; c.lineCap = "round"; c.setLineDash(dash); c.stroke(); c.setLineDash([]); }
  function poly(points, fill, stroke = ink, width = 2) { c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); } }
  function circle(x, y, r, fill, stroke = null, width = 2) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); } }
  function text(v, x, y, size = 16, color = ink, align = "left", max = 900, weight = 700) { c.textAlign = align; c.textBaseline = "alphabetic"; do { c.font = `${weight} ${size}px "Avenir Next", "PingFang SC", system-ui, sans-serif`; if (c.measureText(String(v)).width <= max || size <= 10) break; size--; } while (true); c.fillStyle = color; c.fillText(v, x, y); }
  function gear(x, y, r, color, angle = 0) { c.save(); c.translate(x, y); c.rotate(angle); const p = []; for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2, n = r * (i % 4 < 2 ? 1 : .82); p.push([Math.cos(a) * n, Math.sin(a) * n]); } poly(p, color); circle(0, 0, r * .44, ink); circle(0, 0, r * .18, white); c.restore(); }
  function icon(face, x, y, size = 20, color = ink) {
    c.save(); c.translate(x, y); c.scale(size / 20, size / 20);
    if ([1, 3, 9].includes(face)) { if (face === 9) { rect(-15, -16, 30, 32, "transparent", 3, color, 2); line([[-4, -20], [4, -20]], color, 3); } poly([[2, -17], [-12, 3], [-1, 3], [-4, 17], [13, -5], [2, -5]], color, null); if (face === 3) { line([[-19, -9], [-24, -14]], color, 2); line([[18, 9], [23, 14]], color, 2); } }
    else if ([2, 4].includes(face)) { poly([[-14, -15], [14, -15], [13, 5], [0, 18], [-13, 5]], "transparent", color, 3); if (face === 4) line([[-8, 3], [6, -6], [6, 2], [15, -7]], color, 3); }
    else if (face === 5) { rect(-16, -16, 23, 23, "transparent", 2, color); rect(-5, -5, 23, 23, "transparent", 2, color); }
    else if (face === 6) { poly([[-12, 13], [-7, -6], [0, 0], [5, -18], [14, 6], [9, 16]], color, null); }
    else if (face === 7) { for (let i = 0; i < 3; i++) { c.save(); c.rotate(i * Math.PI / 3); line([[-17, 0], [17, 0]], color, 3); c.restore(); } }
    else if (face === 8) { line([[-13, 13], [11, -11]], color, 7); line([[4, -17], [4, -6], [14, -5], [18, -13]], color, 4); }
    else if (face === 10) text("×2", 0, 10, 27, color, "center");
    else if (face === 11) { circle(-7, 0, 4, color); circle(7, 0, 4, color); line([[-15, 13], [0, 19], [15, 13]], color, 3); }
    else { poly([[-4, -18], [2, -5], [17, -10], [8, 2], [19, 11], [3, 9], [-3, 20], [-8, 5], [-20, 6], [-11, -4], [-17, -14]], color, null); }
    c.restore();
  }
  function die(s, d, x, y, size = 68, rolled = false, alpha = 1) {
    const index = rolled ? Math.floor(s.elapsed / 70 + d * 2) % 6 : s.roll[d], face = index < 0 ? -1 : s.decks[d][index], color = face < 0 ? "#aab5b4" : s.faces[face].color;
    c.save(); c.globalAlpha *= alpha; c.translate(x, y); if (rolled) c.rotate(Math.sin(s.elapsed / 56 + d) * .18);
    const h = size / 2; rect(-h + 5, -h + 7, size, size, ink, 7); rect(-h, -h, size, size, white, 7, ink, 3); rect(-h + 5, -h + 5, size - 10, size - 10, color, 4);
    if (face < 0) { for (const [px, py] of [[-10, -10], [10, -10], [-10, 10], [10, 10]]) circle(px, py, 3, ink); }
    else { icon(face, 0, -2, size * .26); text(index + 1, h - 7, h - 5, Math.max(12, size * .21), ink, "right"); }
    c.restore();
  }
  function health(x, y, w, current, max, color) { rect(x, y, w, 9, "#8b979944", 2); rect(x, y, w * current / max, 9, color, 2); for (let i = 1; i < 4; i++) line([[x + w * i / 4, y], [x + w * i / 4, y + 9]], white, 1); }
  function bolts(x, y, w, h) { for (const a of [x + 8, x + w - 8]) for (const b of [y + 8, y + h - 8]) { circle(a, b, 2, "#9aa5a4"); line([[a - 1, b], [a + 1, b]], ink, 1); } }
  function bench(s) {
    rect(0, 0, 960, 540, white);
    rect(0, 0, 960, 67, ink); poly([[0, 0], [344, 0], [320, 67], [0, 67]], yellow, null);
    text("骰子改装厂", 24, 35, 27); text("DICE FOUNDRY  /  CUSTOM BUILT", 25, 53, 10);
    for (let i = 0; i < 6; i++) { const x = 368 + i * 28; circle(x, 30, 8, i < s.level ? cyan : i === s.level ? yellow : "#535c60"); if (i < s.level) line([[x - 3, 30], [x, 33], [x + 4, 27]], ink, 2); }
    text(`${String(s.level + 1).padStart(2, "0")} / 06`, 929, 32, 20, white, "right"); text(s.title, 929, 53, 12, "#a9b9b8", "right");
    rect(0, 211, 960, 262, "#e1e6e2");
    for (let x = 8; x < 960; x += 24) for (let y = 222; y < 472; y += 24) circle(x, y, .75, "#bbc4c0");
    for (const y of [211, 473]) { line([[0, y], [960, y]], ink, 3); for (let x = 15; x < 955; x += 36) line([[x, y - 2], [x + 8, y + 2]], "#89938e", 2); }
  }
  function arena(s, reduced) {
    const e = s.encounters[s.level], t = reduced ? 0 : s.time, flashAge = s.flash ? s.time - s.flash.at : 9999, hot = flashAge < 450;
    text(`耐久 ${s.stats.hp} / 32`, 28, 89, 14); health(28, 98, 186, s.stats.hp, 32, s.stats.hp < 10 ? red : cyan);
    text(`装甲 ${s.intent.armor}   耐久 ${s.stats.enemy} / ${e.hp}`, 731, 89, 12, ink, "left", 204); health(731, 98, 201, s.stats.enemy, e.hp, red);
    const shake = !reduced && hot && s.flash.type === "enemy" ? Math.sin(flashAge / 18) * 4 : 0;
    c.save(); c.translate(136 + shake, 160);
    line([[-100, 35], [82, 35]], ink, 5); rect(-78, -21, 119, 52, "#a7b4b2", 4, ink, 3); rect(-69, -15, 65, 34, "#303b40", 3);
    for (let i = 0; i < 3; i++) { rect(-60 + i * 19, -9, 13, 18, [yellow, cyan, red][i], 2); text(i + 1, -54 + i * 19, 5, 10, ink, "center"); }
    gear(29, 16, 22, yellow, t / 1200); gear(-61, 31, 13, "#92a3a2", -t / 1400); rect(45, -24, 36, 22, white, 3, ink, 3); rect(66, -20, 24, 13, yellow, 1, ink); line([[1, -22], [1, -38], [34, -38]], ink, 4);
    circle(36, -38, 5, s.stats.heat >= 6 ? red : cyan, ink); bolts(-78, -21, 119, 52); c.restore();
    text("电能", 272, 99, 12, "#637173"); text(s.stats.energy, 327, 103, 23); text("热量", 395, 99, 12, "#637173"); text(`${s.stats.heat}/8`, 450, 103, 23, s.stats.heat >= 6 ? red : ink);
    for (let i = 0; i < 9; i++) rect(273 + i * 10, 114, 7, 8, i * 2 < s.stats.energy ? "#9dab27" : "#cbd3cc", 1);
    for (let i = 0; i < 8; i++) rect(396 + i * 10, 114, 7, 8, i < s.stats.heat ? red : "#cbd3cc", 1);
    text(`回合 ${s.round}`, 567, 98, 12, "#637173"); text(`来袭 ${s.intent.attack}`, 567, 124, 19, red);
    text(e.quirk, 567, 146, 11, "#69777a", "left", 142);
    const enemyX = 826 + (!reduced && hot && ["hit", "counter"].includes(s.flash.type) ? Math.sin(flashAge / 17) * 5 : 0);
    c.save(); c.translate(enemyX, 156); const alive = s.stats.enemy > 0;
    if (!alive) { c.globalAlpha = .38; c.rotate(.08); }
    else if (!reduced) c.translate(0, Math.sin(t / 600) * 1.7);
    if (loaded) { const sw = art.naturalWidth / 2, sh = art.naturalHeight / 2; c.drawImage(art, e.art % 2 * sw, Math.floor(e.art / 2) * sh, sw, sh, -84, -79, 168, 150); }
    else { rect(-35, -38, 70, 72, white, 4, ink, 4); circle(0, -5, 23, yellow, ink, 3); rect(-14, -8, 28, 5, red); gear(-35, 34, 14, cyan); gear(35, 34, 14, cyan); }
    c.restore();
    if (s.mode === "resolve" && hot) {
      const progress = Math.min(1, flashAge / 320), shot = ["hit", "counter"].includes(s.flash.type), col = shot ? red : s.flash.type === "shield" ? cyan : yellow;
      if (!reduced && shot) { const x = 230 + progress * 480; line([[x - 70, 163], [x, 163]], col, 8); line([[x - 90, 156], [x - 23, 156]], ink, 2); }
      if (shot) text(`−${s.flash.damage}`, 735, 168 - (reduced ? 0 : progress * 14), 28, red, "center");
      else if (s.flash.type === "shield") { c.beginPath(); c.arc(139, 160, 66, -1.2, 1.2); c.strokeStyle = cyan; c.lineWidth = 5; c.stroke(); }
    }
    if (["reward", "between", "clear"].includes(s.mode)) { text(s.mode === "clear" ? "全线检修完成" : "拆解成功", 425, 177, 28, ink, "center"); text(s.mode === "clear" ? "六台对手 · 一套自己的骰子" : "回收一枚模块，改造下一场的运气。", 425, 198, 12, "#667578", "center"); }
    else if (s.mode === "lost") { text("停机检修", 425, 175, 28, red, "center"); text("重试保留入场改装与投掷序列", 425, 197, 12, "#667578", "center"); }
    else { text(s.preview ? `预计输出 ${s.preview.damage}   自损 ${Math.max(0, s.preview.loss)}` : s.mode === "resolve" ? s.log.at(-1) ?? "设备启动" : "三枚骰子，一条生产线。", 436, 176, 16, ink, "center", 340); text(s.preview?.lose ? "当前方案会停机" : s.preview?.win ? "当前方案可击败对手" : s.mode === "plan" ? "" : "电能跨回合保留 · 过热损伤 8", 436, 197, 11, s.preview?.lose ? red : "#69777a", "center", 320); }
  }
  function machine(s, slot, reduced) {
    const x = 242 + slot * 238, y = 387, d = s.slots[slot], running = s.mode === "resolve" && s.applied === slot, col = s.machines[slot].color;
    line([[x - 100, y + 56], [x + 108, y + 56]], ink, 6); rect(x - 103, y - 40, 206, 84, running ? col : "#7e9092", 5, ink, 3);
    rect(x - 95, y - 34, 190, 22, ink, 2); text(`${slot + 1}  ${s.machines[slot].name}`, x - 80, y - 18, 13, col); text(["+2 电", "+2 点", "+2 伤"][slot], x + 83, y - 18, 12, white, "right");
    rect(x - 41, y - 4, 82, 44, "#2f3b3f", 3, ink); for (let i = 0; i < 4; i++) line([[x - 89, y + i * 8], [x - 59, y + i * 8]], "#344447", 3);
    gear(x + 70, y + 20, 14, col, reduced || !running ? slot : s.time / 180); bolts(x - 103, y - 40, 206, 84);
    if (d >= 0) die(s, d, x, y + 16, 43); else { c.setLineDash([4, 4]); c.strokeStyle = "#809a9f"; c.lineWidth = 2; c.strokeRect(x - 18, y + 1, 36, 28); c.setLineDash([]); text("+", x, y + 23, 24, "#95afb0", "center"); }
    if (slot < 2) { line([[x + 104, y + 10], [x + 129, y + 10]], ink, 4); poly([[x + 120, y + 4], [x + 130, y + 10], [x + 120, y + 16]], col, ink); }
    if (s.drag?.moved && Math.abs(s.drag.x - x) < 105 && s.drag.y >= 347 && s.drag.y <= 447) { c.strokeStyle = yellow; c.lineWidth = 4; c.strokeRect(x - 101, y - 38, 202, 80); }
  }
  function playfield(s, reduced) {
    text("投掷盘", 25, 248, 13, "#526368"); text(`${s.rerolls} 次重掷`, 25, 270, 11, "#72817f");
    for (let d = 0; d < 3; d++) {
      const x = 270 + d * 210, isRolling = s.mode === "rolling" && !reduced, lift = isRolling ? Math.abs(Math.sin(s.elapsed / 130 + d)) * 19 : 0;
      const assigned = s.slots.includes(d), dragged = s.drag?.moved && s.drag.die === d;
      if (s.selected === d && s.mode === "plan") { line([[x - 42, 316], [x + 42, 316]], ink, 3); poly([[x - 5, 320], [x + 5, 320], [x, 326]], ink, null); }
      die(s, d, x, 266 - lift, 68, isRolling, assigned || dragged ? .42 : 1);
      text("ABC"[d], x - 52, 241, 12, "#667b7e", "center");
      if (s.mode === "plan") { circle(x + 53, 253, 15, s.held[d] ? yellow : white, ink); rect(x + 47, 251, 12, 10, ink, 2); c.beginPath(); c.arc(x + 53, 250, 4, Math.PI, 0); c.strokeStyle = ink; c.lineWidth = 2; c.stroke(); }
      if (s.roll[d] >= 0 && s.mode !== "rolling") text(s.faces[s.decks[d][s.roll[d]]].name, x, 313, 12, ink, "center");
    }
    if (s.mode === "plan" && s.roll[s.selected] >= 0) text(s.faces[s.decks[s.selected][s.roll[s.selected]]].short, 930, 332, 11, "#596e70", "right", 215);
    for (let slot = 0; slot < 3; slot++) machine(s, slot, reduced);
    if (s.drag?.moved) die(s, s.drag.die, s.drag.x, s.drag.y, 68);
  }
  function workshop(s) {
    for (let o = 0; o < 3; o++) {
      const x = 170 + o * 210, face = s.faces[s.offers[o]], selected = s.offer === o;
      rect(x + 4, 220, 193, 80, ink, 4); rect(x, 214, 193, 80, selected ? face.color : white, 4, ink, selected ? 3 : 2);
      icon(s.offers[o], x + 31, 245, 20); text(face.name, x + 62, 244, 18); text(face.short, x + 13, 278, 12, ink, "left", 169);
      text(o + 1, x + 180, 232, 11, ink, "right");
    }
    for (let d = 0; d < 3; d++) {
      const y = 320 + d * 48; text(`骰子 ${"ABC"[d]}`, 229, y + 26, 13, ink, "right");
      for (let f = 0; f < 6; f++) { const x = 281 + f * 66, face = s.faces[s.decks[d][f]], patched = s.patch?.[0] === d && s.patch?.[1] === f;
        rect(x, y, 58, 43, patched ? yellow : white, 4, patched || s.faceCursor === d * 6 + f ? ink : "#a4b4af", patched ? 3 : 1.5);
        icon(s.decks[d][f], x + 24, y + 20, 12, ink); circle(x + 45, y + 31, 8, face.color); text(f + 1, x + 45, y + 35, 10, ink, "center");
      }
    }
    text(s.mode === "between" ? "已安装" : "替换一个骰面", 741, 365, 14, ink); text(s.faces[s.offers[s.offer]].name, 741, 388, 19, ink);
    text("原点数不变", 741, 410, 11, "#5b6e70");
  }
  function footer(s, stopped) {
    const mainDisabled = ["rolling", "resolve", "reward"].includes(s.mode) || stopped, secondaryDisabled = !s.abilityAvailable || stopped;
    text(stopped ? "已暂停 · 骰面与改装已保存" : s.mode === "plan" ? `装配 ${s.slots.filter(d => d >= 0).length}/3` : s.mode === "reward" ? "改装台" : s.mode === "between" ? "准备下一场" : "本地工坊", 26, 499, 14);
    text(s.mode === "plan" ? "电能可留到下一回合，护盾不能。" : s.mode === "reward" ? s.faces[s.offers[s.offer]].hint : s.mode === "resolve" ? s.log.at(-1) ?? "启动生产线" : s.noticeUntil > s.time ? s.notice : s.mode === "between" ? "耐久修复8，电能与热量保留。" : "", 26, 521, 12, "#637274", "left", 593);
    rect(651, 484, 124, 44, secondaryDisabled ? "#d8deda" : white, 5, secondaryDisabled ? "#bac3bf" : ink);
    text(s.mode === "between" ? "撤回改装" : `重掷 ${s.rerolls}`, 713, 512, 16, secondaryDisabled ? "#87958f" : ink, "center");
    rect(795, 488, 139, 43, ink, 5); rect(791, 482, 139, 43, mainDisabled ? "#b7c3bb" : yellow, 5, ink, 2.5); text(s.primaryLabel, 860, 509, 18, mainDisabled ? "#5d6f6c" : ink, "center", 124);
  }
  function draw(g, { reduced = false, stopped = false } = {}) {
    if (disposed) return; world = g; const s = g.scene, dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    if (canvas.width !== Math.round(960 * dpr) || canvas.height !== Math.round(540 * dpr)) { canvas.width = Math.round(960 * dpr); canvas.height = Math.round(540 * dpr); }
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, 960, 540); bench(s); arena(s, reduced || stopped);
    if (["reward", "between"].includes(s.mode)) workshop(s); else playfield(s, reduced || stopped);
    footer(s, stopped);
    if (s.mode === "clear") { rect(183, 223, 594, 219, "#20252af5", 5); text("一套属于你的改装", 480, 267, 26, yellow, "center");
      for (let d = 0; d < 3; d++) for (let f = 0; f < 6; f++) { const x = 320 + f * 65, y = 302 + d * 42; rect(x - 20, y - 16, 42, 32, s.faces[s.decks[d][f]].color, 4); icon(s.decks[d][f], x, y, 11); }
      text("六场检修完成", 480, 430, 12, white, "center"); }
  }
  return { ready, draw, point, get diagnostics() { return { assetLoaded: loaded, contexts: disposed ? 0 : 1 }; }, destroy() { disposed = true; art.onload = art.onerror = null; canvas.removeEventListener("pointermove", hover); canvas.title = originalTitle; canvas.style.cursor = ""; } };
}
