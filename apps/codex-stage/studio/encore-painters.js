import { createOneButtonCanvas } from "./one-button-painters.js";

export function createBridgePainter(canvas) {
  const k = createOneButtonCanvas(canvas), { c, box, oval, line, poly, text, gesture } = k;
  const ink = "#263c39", pale = "#edf5e5", red = "#eb684e", yellow = "#ebca58";
  function ruler(x, y, length, angle) {
    c.save(); c.translate(x, y); c.rotate(angle); box(0, -6, length, 8, ink, 1); box(0, -6, length, 3, yellow);
    for (let n = 8; n < length; n += 12) line([[n, -5], [n, n % 24 === 8 ? 0 : -2]], pale, 1);
    oval(0, -1, 5, 5, red); if (length > 6) box(length - 3, -8, 4, 13, red, 1); c.restore();
  }
  return k.renderer((s, { reduced, stopped }) => {
    box(0, 0, 960, 540, "#dbead7"); oval(777, 167, 48, 48, "#f39c7b");
    for (let row = 0; row < 2; row++) {
      const points = [[0, 490]]; for (let i = 0; i <= 12; i++) points.push([i * 92 - (s.camera * (.08 + row * .05) % 92), 277 + row * 52 + Math.sin(i * 1.7 + row) * 39]); points.push([960, 490]); poly(points, row ? "#a0c9ac" : "#b8d2b6");
    }
    for (let i = 0; i < 8; i++) { const x = i * 165 + 38 - s.camera * .14 % 165, y = 305 + i % 2 * 26; line([[x, y - 78], [x, y + 49]], "#688f7790", 5); for (let j = 0; j < 4; j++) line([[x, y - j * 19], [x + 27, y - 24 - j * 18]], "#688f7770", 3); }
    box(0, 420, 960, 83, "#85b5a6"); for (let i = 0; i < 22; i++) { const x = i * 53 - (reduced ? 0 : s.time / 90) % 53; line([[x, 452 + i % 3 * 17], [x + 23, 452 + i % 3 * 17]], "#d9eada", 1.5); }
    for (const [i, p] of s.platforms.entries()) {
      const x = p.x - s.camera; if (x + p.w < 0 || x > 960) continue;
      box(x + 5, p.y + 8, Math.max(4, p.w - 10), 109, i % 2 ? "#617f72" : "#759789", 3);
      for (let z = 0; z < 5; z++) line([[x + 7, p.y + 25 + z * 17], [x + p.w - 7, p.y + 25 + z * 17]], "#aac1a2", 1);
      box(x - 1, p.y, p.w + 2, 11, pale, 2); box(x, p.y + 9, p.w, 5, ink);
      if (i === s.progress + 1) { box(x + p.w / 2 - 4, p.y - 3, 8, 4, red); text(String(i).padStart(2, "0"), x + p.w / 2, p.y + 39, 13, pale, "center"); }
      if (i === 10) { line([[x + p.w - 2, p.y - 60], [x + p.w - 2, p.y]], ink, 2); poly([[x + p.w - 2, p.y - 59], [x + p.w + 36, p.y - 47], [x + p.w - 2, p.y - 33]], red); }
    }
    for (const b of s.bridges) ruler(b.x - s.camera, 396, b.length, 0);
    if (!["ready", "complete"].includes(s.mode)) {
      const angle = s.mode === "growing" ? -Math.PI / 2 : s.mode === "lowering" ? -(1 - s.turn * s.turn) * Math.PI / 2 : 0;
      ruler(s.anchor - s.camera, 396, s.length, angle);
      if (s.mode === "growing") text(String(Math.round(s.length)), s.anchor - s.camera + 22, Math.max(106, 390 - s.length), 15, ink);
    }
    const px = s.player.x - s.camera, py = s.player.y;
    if (s.phase !== "lost") {
      c.save(); c.translate(px, py); const walk = s.mode === "walking" && !reduced ? Math.sin(s.time / 50) * 5 : 0;
      line([[-5, 5], [-7 - walk, 15]], ink, 3); line([[5, 5], [7 + walk, 15]], ink, 3); box(-10, -12, 20, 23, red, 4); box(-14, -7, 6, 16, yellow, 2);
      oval(0, -18, 10, 10, pale); box(-12, -26, 24, 7, yellow, 2); line([[-17, -20], [14, -20]], ink, 2); oval(5, -16, 1.5, 1.5, ink); c.restore();
    } else { oval(px, 445, 25, 6, pale); for (let i = 0; i < 5; i++) line([[px - 22 + i * 11, 440], [px - 29 + i * 15, 420 - i % 2 * 9]], pale, 3); }
    box(0, 0, 960, 84, pale); box(22, 20, 7, 44, red); text("桥就这么长", 43, 33, 29, ink); text("MEASURE ONCE. CROSS ONCE.", 45, 63, 11, "#59766b");
    text(`${s.progress} / 10`, 492, 43, 30, ink, "center"); text(`最佳 ${s.best} 段`, 931, 29, 17, ink, "right"); text(`落水 ${s.deaths} 次`, 931, 58, 14, "#b6513e", "right");
    box(0, 503, 960, 37, pale); text(stopped ? "测量暂停" : s.mode === "growing" ? "卷尺，还在长。" : "多一点、少一点，都到不了。", 24, 523, 14, ink); text(`第 ${s.attempt} 趟`, 933, 523, 14, ink, "right");
    if (s.phase === "lost") { text(s.failure, 500, 206, 42, "#bf4c37", "center"); text("河水不接受四舍五入。", 500, 250, 18, ink, "center"); }
    if (s.phase === "won") text("十段路，刚刚好。", 500, 200, 36, ink, "center");
    if (s.mode === "ready" && !s.progress && !stopped) gesture(285, 300, ink, true);
  });
}

export function createOrbitPinsPainter(canvas) {
  const k = createOneButtonCanvas(canvas), { c, box, oval, line, poly, text, gesture } = k;
  const ink = "#222631", white = "#f3f5f6", red = "#e35b70", blue = "#4165cb", gold = "#ebc54e", cx = 480, cy = 284, radius = 130;
  function pin(angle, seeded, index, color) {
    const x = cx + Math.cos(angle) * radius, y = cy + Math.sin(angle) * radius;
    line([[cx + Math.cos(angle) * 79, cy + Math.sin(angle) * 79], [x, y]], color, 3); oval(x + 2, y + 3, 11, 11, "#1e25301c"); oval(x, y, 11, 11, color);
    if (seeded) line([[x - 3, y - 3], [x + 3, y + 3]], white, 2); else text(String(index), x, y, 10, white, "center");
  }
  return k.renderer((s, { reduced, stopped }) => {
    box(0, 0, 960, 540, white); box(0, 84, 247, 419, "#d6e2e2"); box(735, 84, 225, 419, "#e6dce8");
    for (let i = 0; i < 7; i++) { line([[0, 145 + i * 48], [247, 145 + i * 48]], "#b8cccd", 1); line([[735, 130 + i * 53], [960, 130 + i * 53]], "#d0c4d4", 1); }
    text("PRESS", 118, 144, 14, blue, "center"); text("YOUR", 118, 170, 14, blue, "center"); text("LUCK", 118, 196, 14, blue, "center");
    for (let i = 0; i < 18; i++) { const x = 790 + i % 3 * 43, y = 171 + Math.floor(i / 3) * 43; oval(x, y, 10, 10, i < s.progress ? red : "#cbbecd"); if (i < s.progress) text(String(i + 1), x, y, 9, white, "center"); }
    oval(cx + 5, cy + 7, 92, 92, "#2226311a"); oval(cx, cy, 86, 86, ink);
    for (let r = 82; r >= 48; r -= 5) { c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.strokeStyle = "#48515b"; c.lineWidth = .7; c.stroke(); }
    oval(cx, cy, 46, 46, s.progress < 6 ? red : s.progress < 12 ? blue : "#328a83");
    c.save(); c.translate(cx, cy); c.rotate(s.angle); line([[-34, 0], [34, 0]], "#ffffff65", 2); line([[0, -34], [0, 34]], "#ffffff65", 2); c.restore();
    oval(cx, cy, 15, 15, white); oval(cx, cy, 4, 4, ink);
    s.pins.forEach((a, i) => pin(a + s.angle, i < 4, i - 3, i < 4 ? ink : i < 10 ? red : i < 16 ? blue : "#328a83"));
    // The incoming head joins the same orbit as every installed pin head.
    if (s.phase === "playing" && s.mode !== "cooldown") {
      const y = s.mode === "shot" ? 477 - Math.min(1, s.flight / 130) * (477 - cy - radius) : 477;
      line([[cx, y - 25], [cx, y - 9]], ink, 3); poly([[cx - 4, y - 22], [cx, y - 30], [cx + 4, y - 22]], ink); oval(cx, y, 11, 11, gold); text(String(s.progress + 1), cx, y, 10, ink, "center");
    }
    const dir = s.direction || 1; line([[cx - 38, 121], [cx + 38, 121]], blue, 3); poly(dir > 0 ? [[cx + 40, 121], [cx + 28, 114], [cx + 28, 128]] : [[cx - 40, 121], [cx - 28, 114], [cx - 28, 128]], blue);
    text(dir > 0 ? "顺时针" : "逆时针", cx, 99, 12, blue, "center");
    if (!reduced && s.flash > .1) { c.globalAlpha = s.flash * .5; c.beginPath(); c.arc(cx, cy, 147, 0, Math.PI * 2); c.strokeStyle = gold; c.lineWidth = 3; c.stroke(); c.globalAlpha = 1; }
    if (s.hit !== null) { const x = cx + Math.cos(s.hit) * radius, y = cy + Math.sin(s.hit) * radius; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; line([[x + Math.cos(a) * 16, y + Math.sin(a) * 16], [x + Math.cos(a) * 27, y + Math.sin(a) * 27]], red, 3); } }
    box(0, 0, 960, 82, ink); text("见缝插签", 25, 31, 30, white); text("ORBIT PRESS / NO COLLISIONS", 27, 61, 11, gold); text(`${s.progress} / 18`, 492, 41, 30, white, "center"); text(`最佳 ${s.best}`, 933, 28, 17, white, "right"); text(`卡住 ${s.deaths} 次`, 933, 58, 14, "#ee98a8", "right");
    box(0, 503, 960, 37, ink); text(stopped ? "唱片暂停" : "空隙，是会用完的。", 24, 523, 14, white); text(`${18 - s.progress} 根待插`, 933, 523, 14, gold, "right");
    if (s.phase === "lost" || s.phase === "won") { box(281, 242, 398, 77, white, 4); text(s.phase === "won" ? "一根都没碰。" : "这下挤不进了。", cx, 275, 31, s.phase === "won" ? "#328a83" : red, "center"); text(s.phase === "won" ? "18 / 18" : "旧签，也算障碍。", cx, 304, 13, ink, "center"); }
    if (!s.progress && s.mode === "ready" && !stopped) gesture(646, 452, blue, true);
  });
}

export function createLastStopPainter(canvas) {
  const k = createOneButtonCanvas(canvas), { c, box, oval, line, poly, text, gesture } = k;
  const ink = "#2b414b", white = "#f4faf9", red = "#e56558", green = "#499580", blue = "#518bba";
  return k.renderer((s, { reduced, stopped }) => {
    box(0, 0, 960, 540, "#dfeeed");
    for (let i = 0; i < 13; i++) { const x = i * 88 - 20; box(x, 103, 65, 82, "#c0d9d4", 3); box(x + 5, 108, 55, 57, "#ecf7ed", 2); line([[x + 31, 108], [x + 31, 165]], "#adc9c7", 3); }
    box(0, 206, 960, 206, "#c5dce1"); box(0, 220, 960, 180, "#eff8f8");
    for (let i = 0; i < 36; i++) { const x = i * 31; line([[x, 233], [x - 90, 393]], "#cedfe2", 1); }
    for (const y of [234, 398]) { line([[0, y], [960, y]], blue, 3); for (let i = 0; i < 25; i++) box(i * 42, y - 5, 17, 3, "#ffffffc0"); }
    for (let i = 0; i < 20; i++) { const x = 57 + i * 43; line([[x, 414], [x, 421 + (i % 5 ? 0 : 7)]], blue, 1); if (i % 5 === 0) text(String(i * 10), x, 440, 11, blue, "center"); }
    const t = s.target, l = t.x - t.w / 2, r = t.x + t.w / 2;
    box(l, 248, t.w, 132, "#91c4aa55", 3); for (const x of [l, r]) line([[x, 249], [x, 380]], green, 3); line([[l, 249], [r, 249]], green, 3); line([[l, 380], [r, 380]], green, 3);
    line([[t.x, 252], [t.x, 375]], "#6d9e9170", 1, [5, 7]); text("P", t.x, 273, 22, green, "center");
    box(t.x - 35, 161, 70, 37, green, 3); text(String(Math.min(8, s.mode === "parked" ? s.progress : s.progress + 1)).padStart(2, "0"), t.x, 180, 24, white, "center"); line([[t.x, 199], [t.x, 218]], ink, 3);
    const surface = t.drag < .045 ? "薄冰" : t.drag > .06 ? "磨砂" : "湿瓷"; text(surface, 33, 185, 17, ink); text(t.drag < .045 ? "长滑行" : t.drag > .06 ? "短滑行" : "中滑行", 91, 185, 12, blue);
    if (s.brakeAt !== null) { for (const y of [307, 327]) line([[s.brakeAt, y], [s.x, y]], "#59747b6b", 3); poly([[s.brakeAt - 5, 382], [s.brakeAt, 373], [s.brakeAt + 5, 382]], red); }
    if (s.lastMiss?.round === s.progress) { c.globalAlpha = .25; box(s.lastMiss.x - 20, 294, 40, 42, red, 8); c.globalAlpha = 1; }
    const x = s.x;
    oval(x + 3, 337, 31, 8, "#304b5826");
    for (const dx of [-15, 15]) for (const y of [298, 334]) box(x + dx - 4, y - 5, 8, 11, ink, 3);
    box(x - 22, 293, 44, 44, red, 8); box(x - 7, 297, 23, 35, "#f58e76", 4); box(x - 12, 298, 11, 33, ink, 3); box(x - 9, 301, 6, 27, "#a3d7dd", 2);
    for (const y of [301, 329]) box(x + 18, y, 6, 5, "#ffed94", 2);
    if (s.mode === "braking") { for (const y of [302, 328]) box(x - 24, y, 4, 7, "#d23747", 1); }
    if (!reduced && s.mode === "driving") for (let i = 0; i < 3; i++) line([[x - 32 - i * 12, 306 + i * 10], [x - 43 - i * 12, 306 + i * 10]], "#518bba75", 2);
    box(0, 0, 960, 84, white); text("最后一厘米", 24, 31, 30, ink); text("LAST STOP / PRECISION PARKING", 26, 62, 11, blue); text(`${s.progress} / 8`, 490, 40, 30, ink, "center"); text(`最佳 ${s.best}`, 933, 28, 17, ink, "right"); text(`失手 ${s.deaths} 次`, 933, 58, 14, red, "right");
    box(0, 503, 960, 37, white); text(stopped ? "车库暂停" : s.mode === "driving" ? "油门踩着呢。" : s.mode === "braking" ? "松手了，车还没同意。" : "车，得整个停进去。", 24, 523, 14, ink);
    for (let i = 0; i < 12; i++) box(786 + i * 12, 515, 8, 13, s.velocity / 9 * 12 > i ? i > 8 ? red : green : "#d5e4e0", 1);
    if (s.phase === "lost") { text(s.failure, 480, 463, 25, red, "center"); }
    if (s.mode === "parked") { text(s.phase === "won" ? "八次，全都停稳。" : "一把入库。", 480, 459, 27, green, "center"); }
    if (s.mode === "ready" && !stopped) gesture(222, 302, ink, true);
  });
}

export function createGravityPainter(canvas) {
  const k = createOneButtonCanvas(canvas), { c, box, oval, line, poly, text, gesture } = k;
  const ink = "#242b2c", white = "#edf1df", mint = "#6ed4b5", pink = "#ef7f94", yellow = "#e4d45f";
  return k.renderer((s, { reduced, stopped }) => {
    box(0, 0, 960, 540, ink);
    for (let i = 0; i < 11; i++) { const x = i * 116 - (s.camera * .2 % 116); box(x, 178, 85, 214, "#303b3a", 5); box(x + 7, 185, 71, 198, "#344342", 3); line([[x + 13, 251], [x + 73, 251]], "#3f5250", 2); line([[x + 13, 317], [x + 73, 317]], "#3f5250", 2); oval(x + 17, 196, 3, 3, "#6d8478"); }
    const exitX = 3030 - s.camera; if (exitX < 1020) { box(exitX, 185, 103, 238, "#5d8c74", 6); box(exitX + 11, 207, 80, 38, white, 3); text("OFFICE", exitX + 51, 226, 14, ink, "center"); line([[exitX + 50, 275], [exitX + 50, 405]], mint, 3); }
    for (const y of [119, 432]) { box(0, y, 960, 25, "#53635b"); box(0, y === 119 ? 138 : 432, 960, 6, s.gravity === (y === 119 ? -1 : 1) ? mint : "#839488"); for (let i = 0; i < 24; i++) { const x = i * 47 - s.camera % 47; box(x, y + 9, 23, 5, "#283633", 1); } }
    for (const [i, p] of s.columns.entries()) {
      const x = p.x - s.camera; if (x + p.w / 2 < 0 || x - p.w / 2 > 960) continue;
      box(x - p.w / 2, p.y, p.w, p.h, pink, 3); box(x - p.w / 2 + 6, p.y + 7, p.w - 12, p.h - 14, "#b8576e", 2);
      const lip = p.ceiling ? p.y + p.h - 12 : p.y;
      box(x - p.w / 2, lip, p.w, 12, yellow);
      for (let d = -p.w / 2 + 4; d < p.w / 2; d += 16) poly([[x + d, lip], [x + d + 7, lip], [x + d + 13, lip + 12], [x + d + 6, lip + 12]], ink);
      text(String(i + 1).padStart(2, "0"), x, p.ceiling ? p.y + 31 : p.y + p.h - 24, 16, white, "center");
      for (const dx of [-p.w / 2 + 10, p.w / 2 - 10]) oval(x + dx, p.ceiling ? p.y + p.h - 25 : p.y + 26, 3, 3, "#f4b3b1");
    }
    if (!reduced) s.trail.forEach((p, i) => { c.globalAlpha = i / s.trail.length * .22; oval(p.x - s.camera, p.y, 8, 8, mint); }); c.globalAlpha = 1;
    const x = s.player.x - s.camera, y = s.player.y;
    c.save(); c.translate(x, y); if (!reduced && !s.awaiting) c.rotate(Math.max(-.5, Math.min(.5, s.player.vy * .04)));
    oval(0, 0, 14, 14, white); box(-11, -7, 22, 12, ink, 5); for (const dx of [-5, 5]) box(dx - 1, -4, 3, 5, s.phase === "lost" ? pink : mint, 1);
    box(-6, 8, 12, 5, yellow, 2); c.restore();
    if (s.phase === "lost") for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; line([[x + Math.cos(a) * 18, y + Math.sin(a) * 18], [x + Math.cos(a) * 33, y + Math.sin(a) * 33]], pink, 3); }
    if (s.flash > .2 && !reduced) { c.globalAlpha = s.flash * .7; const d = s.gravity; poly([[x + 38, y - d * 6], [x + 48, y + d * 9], [x + 58, y - d * 6]], mint); c.globalAlpha = 1; }
    box(0, 0, 960, 85, white); text("地板辞职了", 24, 31, 30, ink); text("GRAVITY SHIFT / NO JUMP BUTTON", 26, 62, 11, "#558174"); text(`${s.progress} / 10`, 490, 41, 30, ink, "center"); text(`最佳 ${s.best}`, 933, 28, 17, ink, "right"); text(`撞上 ${s.deaths} 次`, 933, 58, 14, "#b5546c", "right");
    text(s.gravity < 0 ? "天花板值班" : "地板值班", 480, 101, 12, mint, "center"); box(0, 503, 960, 37, white);
    text(stopped ? "重力暂停" : s.awaiting ? "今天的地板，不太可靠。" : "不是每一根柱子，都需要点一下。", 24, 523, 14, ink); text(`翻面 ${s.flips} 次`, 933, 523, 14, ink, "right");
    if (s.phase === "lost") { box(276, 249, 405, 75, ink, 3); text("换面没赶上。", 480, 278, 32, pink, "center"); text(s.failure, 480, 309, 14, white, "center"); }
    if (s.phase === "won") { box(267, 242, 430, 80, mint, 3); text("天花板替你完成了下班。", 480, 282, 25, ink, "center"); }
    if (s.awaiting && !stopped) gesture(245, 295, white, true);
  });
}
