export function createOneButtonCanvas(canvas) {
  const c = canvas.getContext("2d"); let disposed = false;
  function box(x, y, w, h, fill, radius = 0) { c.beginPath(); c.roundRect(x, y, Math.max(0, w), Math.max(0, h), radius); c.fillStyle = fill; c.fill(); }
  function oval(x, y, rx, ry, fill) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); }
  function line(points, color, width = 2, dash = []) { c.beginPath(); for (const [i, [x, y]] of points.entries()) i ? c.lineTo(x, y) : c.moveTo(x, y); c.strokeStyle = color; c.lineWidth = width; c.lineCap = "round"; c.lineJoin = "round"; c.setLineDash(dash); c.stroke(); c.setLineDash([]); }
  function poly(points, fill) { c.beginPath(); for (const [i, [x, y]] of points.entries()) i ? c.lineTo(x, y) : c.moveTo(x, y); c.closePath(); c.fillStyle = fill; c.fill(); }
  function text(value, x, y, size = 18, fill = "#162b38", align = "left", weight = 700) { c.font = `${weight} ${size}px "Avenir Next", "PingFang SC", system-ui`; c.fillStyle = fill; c.textAlign = align; c.textBaseline = "middle"; c.fillText(value, x, y); }
  function gesture(x, y, color, pressed = false) {
    line([[x, y + 17], [x, y - 6], [x + 4, y - 10], [x + 8, y - 6], [x + 8, y + 5], [x + 15, y + 3], [x + 21, y + 8], [x + 20, y + 26], [x + 4, y + 26], [x - 6, y + 14], [x, y + 17]], color, 2);
    if (pressed) { line([[x - 7, y - 15], [x - 12, y - 20]], color); line([[x + 4, y - 19], [x + 4, y - 27]], color); line([[x + 15, y - 15], [x + 20, y - 20]], color); }
  }
  return { c, box, oval, line, poly, text, gesture,
    renderer(paint) { return {
      ready: Promise.resolve(),
      draw(g, options = {}) { if (disposed) return; const b = canvas.getBoundingClientRect(), dpr = Math.min(2, globalThis.devicePixelRatio || 1), w = Math.max(1, Math.round((b.width || 960) * dpr)), h = Math.round(w * 9 / 16); if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; } c.setTransform(w / 960, 0, 0, h / 540, 0, 0); c.clearRect(0, 0, 960, 540); paint(g.scene, options); },
      point(x, y) { const b = canvas.getBoundingClientRect(); return { x: (x - b.left) * 960 / b.width, y: (y - b.top) * 540 / b.height }; },
      get diagnostics() { return { assetLoaded: true, contexts: disposed ? 0 : 1, artwork: "original-procedural" }; }, destroy() { disposed = true; },
    }; },
  };
}

export function createSkyStackPainter(canvas) {
  const k = createOneButtonCanvas(canvas), { c, box, oval, line, poly, text, gesture } = k;
  const ink = "#253649", cream = "#fcf7ef", palette = [["#ef5f69", "#ffb4af", "#ac354d"], ["#36aeb0", "#a7e6d1", "#187880"], ["#f1be48", "#ffdd89", "#bb7b29"], ["#5476d1", "#b4c5f6", "#33468b"]];
  function floor(p, camera, moving = false, angle = 0) {
    const [front, top, side] = palette[p.hue % 4], x = p.x, y = p.y + camera, w = p.w;
    c.save(); c.translate(x, y); c.rotate(angle);
    poly([[-w / 2, 0], [w / 2, 0], [w / 2 + 34, -18], [-w / 2 + 34, -18]], top);
    box(-w / 2, 0, w, 27, front); poly([[w / 2, 0], [w / 2 + 34, -18], [w / 2 + 34, 9], [w / 2, 27]], side);
    line([[-w / 2 + 3, 2], [w / 2 - 3, 2]], "#ffffff80", 2);
    for (let j = 0; j < Math.floor((w - 12) / 23); j++) { const px = -w / 2 + 9 + j * 23; box(px, 9, 13, 12, moving ? cream : "#f8e9b4", 1); box(px + 7, 9, 2, 12, side); }
    if (w > 65 && p.hue === 0) { box(-14, 9, 25, 18, ink, 2); line([[0, 11], [0, 26]], top, 1); }
    c.restore();
  }
  return k.renderer((s, { reduced, stopped }) => {
    box(0, 0, 960, 540, "#e7f2ef");
    // Original miniature city silhouettes, with a diagonal risograph sky.
    poly([[0, 0], [620, 0], [160, 540], [0, 540]], "#f6d4d6");
    oval(780, 162, 54, 54, "#f7c965");
    for (let i = 0; i < 11; i++) { const x = i * 103 - 16, h = 40 + (i * 31 % 84); box(x, 463 - h, 65, h + 80, i % 2 ? "#b8d8d1" : "#c9e3de"); for (let row = 0; row < 6; row++) for (let col = 0; col < 3; col++) box(x + 9 + col * 17, 477 - h + row * 16, 7, 6, "#e4eeea"); }
    line([[0, 489], [960, 489]], "#8eb7b1", 2); oval(493, 482, 146, 20, "#244f4d1c");
    // Reference ruler exposes lost width without adding another control.
    for (let i = 0; i <= 12; i++) { const y = 431 - i * 27 + s.camera; if (y < 112 || y > 470) continue; line([[705, y], [i % 3 ? 714 : 724, y]], "#839d9c", 1); if (i % 3 === 0) text(String(i).padStart(2, "0"), 739, y, 12, "#527372"); }
    for (const p of s.floors) floor(p, s.camera);
    if (s.phase !== "won") {
      const m = s.moving, t = s.top;
      if (s.mode === "slide") { line([[m.x - m.w / 2, m.y + 28 + s.camera], [m.x - m.w / 2, t.y + s.camera]], "#34485426", 1, [3, 5]); line([[m.x + m.w / 2, m.y + 28 + s.camera], [m.x + m.w / 2, t.y + s.camera]], "#34485426", 1, [3, 5]); }
      floor(m, s.camera, true, s.phase === "lost" ? .1 : 0);
    }
    if (!reduced) for (const p of s.scraps) floor(p, s.camera, false, p.angle);
    if (s.flash > .25 && !reduced) text(s.lastCut ? `−${s.lastCut}` : "正中", s.top.x - 130, s.top.y + s.camera - 4, 22, s.lastCut ? "#c54457" : "#12867d", "right");
    box(0, 0, 960, 88, cream); box(24, 21, 7, 47, "#ed5e69"); text("叠到天上", 45, 35, 30, ink); text("TWELVE FLOORS, ONE CHANCE", 47, 65, 11, "#b44a5a");
    text(String(s.progress).padStart(2, "0"), 483, 43, 45, ink, "right"); text("/ 12", 496, 51, 18, "#678682");
    text(`最佳 ${s.best} 层`, 933, 31, 17, ink, "right"); text(`倒了 ${s.deaths} 次`, 933, 62, 14, "#bc5260", "right");
    box(0, 505, 960, 35, cream); text(`楼宽 ${Math.round(s.top.w)}`, 25, 523, 14, ink); text(stopped ? "工地暂停" : s.phase === "won" ? "今天，天际线由你决定。" : "再歪一点点，就没有下一层了。", 935, 523, 14, ink, "right");
    if (s.phase === "lost") { box(290, 178, 380, 86, cream, 4); text("楼，没了。", 480, 207, 34, "#c54457", "center"); text(s.failure, 480, 244, 16, ink, "center"); }
    if (s.phase === "won") { poly([[s.top.x, s.top.y + s.camera - 66], [s.top.x + 70, s.top.y + s.camera - 54], [s.top.x, s.top.y + s.camera - 37]], "#ef5f69"); line([[s.top.x, s.top.y + s.camera], [s.top.x, s.top.y + s.camera - 67]], ink, 3); text("十二层，站住了。", 200, 180, 25, ink, "center"); }
    if (!s.progress && s.mode === "slide" && !stopped) gesture(800, 330, ink, true);
  });
}

export function createPressPainter(canvas) {
  const k = createOneButtonCanvas(canvas), { c, box, oval, line, poly, text, gesture } = k;
  const ink = "#1e282b", steel = "#637576", light = "#d9e4df", yellow = "#d7ee4b", hot = "#f46e91";
  function stripes(x, y, w, h) { box(x, y, w, h, yellow); c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); for (let z = -24; z < w + 24; z += 26) poly([[x + z, y], [x + z + 12, y], [x + z + 12 - h, y + h], [x + z - h, y + h]], ink); c.restore(); }
  function machine(g, s) {
    const x = g.x - s.camera; if (x < -110 || x > 1070) return;
    box(x - 63, 126, 126, 323, "#364446", 6); box(x - 46, 130, 92, 313, "#8ca09c", 2); box(x - 42, 180, 84, 255, "#273538");
    for (const d of [-55, 55]) { box(x + d - 5, 166, 10, 277, steel, 3); line([[x + d - 2, 175], [x + d - 2, 437]], "#b6cac2", 2); }
    box(x - 13, 178, 26, Math.max(3, g.bottom - 204), "#b7cac5", 4); line([[x - 5, 180], [x - 5, g.bottom - 22]], "#f1f5df", 4);
    box(x - 42, g.bottom - 25, 84, 25, steel, 2); stripes(x - 42, g.bottom - 14, 84, 14);
    box(x - 63, 115, 126, 61, light, 4); box(x - 61, 115, 122, 8, hot); text(String(g.id + 1).padStart(2, "0"), x - 44, 149, 27, ink);
    oval(x + 36, 143, 9, 9, g.warning ? hot : g.safe ? yellow : "#ef514d"); oval(x + 34, 141, 3, 3, "#ffffff70");
    box(x - 49, 169, 98, 4, "#1e282b"); box(x - 49, 169, 98 * g.phase, 4, g.warning ? hot : "#86baa9");
    for (const dx of [-55, 55]) { oval(x + dx, 129, 3, 3, steel); line([[x + dx - 2, 129], [x + dx + 2, 129]], ink, 1); }
    // Floor footprint is the exact lethal width, with a safe waiting marker before it.
    stripes(x - 42, 443, 84, 8); line([[x - 70, 434], [x - 70, 454]], hot, 3);
    if (g.bottom > 420) { poly([[x - 47, 430], [x - 65, 417], [x - 56, 441]], yellow); poly([[x + 47, 430], [x + 66, 416], [x + 57, 441]], hot); }
  }
  function cart(s) {
    const x = s.x - s.camera, squash = s.phase === "lost" ? .24 : 1;
    c.save(); c.translate(x, 435); c.scale(1, squash);
    for (const dx of [-11, 11]) { oval(dx, 0, 7, 7, ink); oval(dx, 0, 4, 4, light); line([[dx - Math.cos(s.wheel) * 3, -Math.sin(s.wheel) * 3], [dx + Math.cos(s.wheel) * 3, Math.sin(s.wheel) * 3]], ink, 1.5); }
    box(-18, -13, 36, 11, hot, 4); box(-15, -36, 30, 24, "#eff1c2", 4); box(-12, -33, 24, 15, ink, 3);
    for (const dx of [-6, 6]) { if (s.holding) line([[dx - 2, -28], [dx + 2, -26]], yellow, 2); else oval(dx, -26, 2, 2, yellow); }
    line([[0, -37], [0, -44]], ink, 2); oval(0, -46, 3, 3, hot);
    if (!s.holding) poly([[-24, -3], [-18, -3], [-18, 5], [-27, 5]], "#ef5759");
    c.restore();
  }
  return k.renderer((s, { reduced, stopped }) => {
    box(0, 0, 960, 540, "#c2cec9");
    for (let i = 0; i < 14; i++) { const x = i * 92 - (s.camera * .2 % 92); line([[x, 93], [x, 440]], "#9aaea8", 1); box(x + 14, 236, 58, 4, "#adbbb4"); }
    line([[0, 102], [960, 102]], steel, 13); line([[0, 106], [960, 106]], "#e0e8dd", 2);
    for (let i = 0; i < 4; i++) { const x = 80 + i * 295 - s.camera * .1 % 295; box(x, 95, 63, 12, ink, 2); box(x + 4, 109, 55, 5, "#edf2c8", 1); }
    for (const g of s.gates) machine(g, s);
    box(0, 451, 960, 48, ink); for (let i = 0; i < 25; i++) { const x = i * 43 - s.camera % 43; oval(x, 462, 8, 8, steel); oval(x, 462, 3, 3, light); line([[x + 7, 476], [x + 29, 476]], steel, 2); }
    const exit = 2200 - s.camera; if (exit < 1000) { box(exit - 17, 180, 100, 260, "#91baa6", 3); box(exit, 196, 66, 42, ink, 3); text("OFF", exit + 33, 218, 18, yellow, "center"); poly([[exit + 19, 276], [exit + 49, 295], [exit + 19, 314]], yellow); }
    if (s.ghost && s.phase !== "lost") { const x = s.ghost.x - s.camera; if (x > 0 && x < 950) { c.globalAlpha = .38; box(x - 21, 432, 42, 6, hot, 2); c.globalAlpha = 1; } }
    cart(s);
    if (s.holding && !reduced) for (let i = 0; i < 4; i++) line([[s.x - s.camera - 28 - i * 11, 415 + i * 6], [s.x - s.camera - 34 - i * 11, 415 + i * 6]], "#435f6260", 2);
    box(0, 0, 960, 84, ink); box(23, 22, 7, 41, yellow); text("别被夹扁", 46, 32, 29, light); text("NIGHT SHIFT / PRESS LINE", 48, 62, 12, yellow);
    for (let i = 0; i < 8; i++) box(395 + i * 25, 30, 17, 25, i < s.progress ? yellow : "#46595a", 2);
    text(`最佳 ${s.best} / 8`, 932, 29, 17, light, "right"); text(`压扁 ${s.deaths} 次`, 932, 59, 14, hot, "right");
    box(0, 499, 960, 41, ink); oval(28, 520, 5, 5, s.holding ? yellow : hot); text(stopped ? "断电" : s.holding ? "前进" : "刹车", 43, 521, 15, light); text("准时下班，完整回家。", 932, 521, 14, light, "right");
    if (s.phase === "lost") { box(300, 203, 360, 101, hot, 3); text("下班变薄了。", 480, 239, 33, ink, "center"); text(`${s.ghost?.gate || 1} 号压机`, 480, 281, 16, ink, "center"); }
    if (s.phase === "won") { box(285, 216, 390, 95, yellow, 3); text("完整下班。", 480, 253, 35, ink, "center"); text("8 / 8", 480, 292, 17, ink, "center"); }
    if (!s.progress && s.x < 190 && !stopped) gesture(206, 363, ink, s.holding);
  });
}

export function createSwingPainter(canvas) {
  const k = createOneButtonCanvas(canvas), { c, box, oval, line, poly, text, gesture } = k;
  const ink = "#173a6c", blue = "#2865d5", red = "#ed5f63", white = "#f6fcff";
  function cloud(x, y, scale = 1) { c.save(); c.translate(x, y); c.scale(scale, scale); oval(0, 0, 36, 14, "#ffffffa8"); oval(-16, -8, 16, 14, "#ffffffa8"); oval(13, -13, 21, 19, "#ffffffa8"); c.restore(); }
  function parcel(s) {
    const p = s.parcel; c.save(); c.translate(p.x, p.y); c.rotate(p.angle);
    box(-15, -13, 30, 26, "#fff3c8", 2); line([[-15, -13], [0, 0], [15, -13]], red, 2); line([[-15, 13], [-5, 2]], "#dbb67d", 1); line([[15, 13], [5, 2]], "#dbb67d", 1);
    box(6, -9, 5, 6, blue, 1); oval(-5, 5, 1.5, 1.5, ink); oval(4, 5, 1.5, 1.5, ink); c.restore();
  }
  return k.renderer((s, { reduced, stopped }) => {
    box(0, 0, 960, 540, "#b4e3ee");
    for (let i = 0; i < 6; i++) { const drift = reduced ? 0 : s.time / 1800; cloud((i * 209 + 60 + drift) % 1130 - 80, 135 + i % 3 * 67, .5 + i % 2 * .45); }
    // Original paper-cut harbor, deliberately different from the other two sets.
    poly([[0, 348], [78, 306], [148, 344], [222, 285], [315, 354], [402, 326], [513, 369], [666, 314], [792, 350], [886, 298], [960, 331], [960, 540], [0, 540]], "#7ab5cf");
    for (let i = 0; i < 12; i++) { const x = i * 86 - 12, y = 384 - i * 17 % 44; box(x, y, 64, 108, i % 3 ? "#94c6db" : "#679dc3"); poly([[x - 5, y], [x + 32, y - 21], [x + 70, y]], "#578eaf"); for (let z = 0; z < 3; z++) box(x + 9 + z * 17, y + 16, 8, 12, "#c5e3df"); }
    const wave = reduced ? 0 : s.time / 600 % 61;
    box(0, 466, 960, 36, "#4e9ebc"); for (let i = 0; i < 19; i++) line([[i * 61 - wave, 485], [i * 61 + 27 - wave, 485]], "#b6e0e8", 2);
    // Crane structure, cable and parcel all use the actual launch geometry.
    box(124, 140, 21, 319, blue, 2); box(118, 453, 112, 16, ink, 2); box(115, 128, 213, 15, blue, 3);
    poly([[145, 235], [145, 211], [276, 143], [304, 143]], "#4083ce");
    for (let i = 0; i < 8; i++) line([[127, 153 + i * 35], [142, 183 + i * 35]], "#9acbf1", 2);
    oval(s.pivot.x, s.pivot.y, 12, 12, ink); oval(s.pivot.x, s.pivot.y, 6, 6, white);
    if (s.mode === "swing") { line([[s.pivot.x, s.pivot.y], [s.parcel.x, s.parcel.y - 12]], s.holding ? red : ink, s.holding ? 3 : 2); oval(s.parcel.x, s.parcel.y - 15, 4, 4, red); }
    else { const angle = reduced ? 0 : Math.sin(s.roundTime / 180) * .15; line([[s.pivot.x, s.pivot.y], [s.pivot.x + Math.sin(angle) * 52, s.pivot.y + 52]], ink, 2); }
    const t = s.target, width = t.w;
    box(t.x - width / 2 - 7, t.y + 4, width + 14, 43, blue, 3); box(t.x - width / 2, t.y, width, 8, ink, 1);
    for (let i = 0; i < Math.max(1, Math.floor(width / 13)); i++) { const x = t.x - width / 2 + 6 + i * 13; poly([[x, t.y + 11], [x + 6, t.y + 11], [x + 2, t.y + 23], [x - 4, t.y + 23]], white); }
    line([[t.x, t.y + 28], [t.x, 494]], ink, 6); line([[t.x - width / 2, t.y - 2], [t.x + width / 2, t.y - 2]], red, 3);
    for (const dx of [-width / 2 - 4, width / 2 + 4]) { line([[t.x + dx, 411], [t.x + dx, 434]], white, 2); }
    const mailNumber = s.mode === "delivered" ? s.progress : Math.min(8, s.progress + 1);
    text(String(mailNumber).padStart(2, "0"), t.x, t.y - 45, 16, ink, "center");
    if (!reduced && s.mode === "flight") for (let i = 0; i < s.trail.length; i++) { const p = s.trail[i]; c.globalAlpha = i / s.trail.length * .5; oval(p.x, p.y, 2, 2, white); } c.globalAlpha = 1;
    if (s.phase !== "lost") parcel(s);
    if (s.lastMiss && s.phase === "lost") { line([[s.lastMiss.x - 8, 443], [s.lastMiss.x + 8, 459]], red, 4); line([[s.lastMiss.x + 8, 443], [s.lastMiss.x - 8, 459]], red, 4); }
    if (s.mode === "delivered") { c.save(); c.translate(610, 267); c.rotate(-.16); c.strokeStyle = red; c.lineWidth = 3; c.strokeRect(-74, -30, 148, 60); text("已签收", 0, 0, 29, red, "center"); c.restore(); }
    box(0, 0, 960, 83, white); for (let i = 0; i < 36; i++) poly([[i * 28, 79], [i * 28 + 13, 79], [i * 28 + 9, 84], [i * 28 - 4, 84]], i % 2 ? blue : red);
    text("松手邮局", 24, 31, 30, ink); text("AIRMAIL / SPECIAL DELIVERY", 26, 61, 11, blue);
    for (let i = 0; i < 8; i++) { const x = 389 + i * 28; box(x, 30, 21, 17, i < s.progress ? red : "#cee3ed", 2); line([[x, 30], [x + 10, 39], [x + 21, 30]], white, 1); }
    text(`最佳 ${s.best} / 8`, 934, 27, 17, ink, "right"); text(`退件 ${s.deaths} 次`, 934, 57, 14, red, "right");
    box(0, 501, 960, 39, white); text(stopped ? "邮局暂休" : s.holding ? "吊绳在你手里" : s.mode === "flight" ? "不接受空中改地址" : "今日还有信，要越过这片海。", 25, 522, 14, ink);
    text(`${mailNumber} 号邮筒`, 934, 522, 14, blue, "right");
    if (s.phase === "lost") { box(299, 210, 392, 96, white, 4); text("退回寄件人。", 495, 245, 31, red, "center"); text(s.failure, 495, 285, 15, ink, "center"); }
    if (s.phase === "won") { text("八封信，没有一封落海。", 510, 176, 27, ink, "center"); }
    if (!s.progress && s.mode === "swing" && !stopped) gesture(470, 320, ink, s.holding);
  });
}
