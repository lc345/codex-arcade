import { STUDIO_ART } from "./assets.js";

export function createToastPainter(canvas) {
  const c = canvas.getContext("2d"), art = new Image(); let loaded = false, disposed = false;
  const ready = new Promise(resolve => { art.onload = () => { loaded = true; resolve(); }; art.onerror = resolve; });
  art.src = STUDIO_ART["toast-hop"] || "/apps/codex-stage/assets/studio/toast-hop-art.jpg";
  const ink = "#243b47", red = "#dc5144", blue = "#3353a0", white = "#fff9eb", yellow = "#f2cd4b";
  function box(x, y, w, h, color, r = 0, stroke) { c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = color; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2; c.stroke(); } }
  function ellipse(x, y, rx, ry, color) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = color; c.fill(); }
  function line(points, color, width = 2, dash = []) { c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.strokeStyle = color; c.lineWidth = width; c.lineCap = "round"; c.lineJoin = "round"; c.setLineDash(dash); c.stroke(); c.setLineDash([]); }
  function text(v, x, y, size = 16, color = ink, align = "left") { c.fillStyle = color; c.font = `800 ${size}px "Avenir Next", "PingFang SC", system-ui`; c.textAlign = align; c.textBaseline = "middle"; c.fillText(v, x, y); }
  function table(p, s) {
    const x = p.x - s.camera, y = p.y, w = p.w, next = p.id === s.index + 1, done = p.id <= s.index;
    if (x + w < -10 || x - w > 1000) return;
    const color = [red, blue, "#e6af38", "#3c9382"][p.kind];
    if (!p.id) {
      box(x - w / 2, y + 5, w, 112, red, 22, ink); box(x - w / 2 + 9, y + 21, w - 18, 12, "#f0947b", 5);
      box(x - w / 2 + 20, y + 44, w - 40, 34, "#f0beb0", 6); text("BON MATIN", x, y + 62, 14, red, "center");
      line([[x + w / 2 + 3, y + 27], [x + w / 2 + 3, y + 83]], ink, 5); box(x + w / 2 - 4, y + 28, 16, 9, blue, 3);
      for (const dx of [-w * .32, w * .32]) box(x + dx - 8, y + 112, 16, 25, ink, 3);
    } else if (p.id === 10) {
      box(x - w / 2, y + 9, w, 135, "#ef9ca3", 8, ink); for (let i = 0; i < 4; i++) box(x - w / 2 + 6 + i * 15, y + 10, 6, 128, "#f7c2bf");
      line([[x + 42, y - 76], [x + 42, y + 3]], ink, 3); c.beginPath(); c.moveTo(x + 42, y - 77); c.lineTo(x + 90, y - 63); c.lineTo(x + 42, y - 48); c.fillStyle = red; c.fill();
      ellipse(x, y + 9, w / 2, 10, blue);
    } else if (p.kind === 1) {
      box(x - w * .38, y + 19, w * .76, 146, white, 11, ink);
      for (let row = 0; row < 9; row++) for (let col = 0; col < 3; col++) if ((row + col) % 2 === 0) box(x - w * .34 + col * w * .23, y + 26 + row * 15, w * .23, 15, blue);
      ellipse(x, y + 22, w * .42, 9, blue); ellipse(x, y + 24, w * .29, 3, "#6f8bc5");
    } else if (p.kind === 2) {
      box(x - w * .39, y + 20, w * .78, 144, color, 8, ink); box(x - w * .24, y + 43, w * .48, 65, white, 4);
      text("M", x, y + 74, Math.min(26, w * .55), red, "center");
      for (let i = 0; i < 5; i++) line([[x - w * .32, y + 121 + i * 6], [x + w * .32, y + 121 + i * 6]], "#bb882d", 2);
      ellipse(x, y + 21, w * .42, 6, yellow);
    } else {
      const h = 150; box(x - w * .3, y + 16, w * .6, h, "#a2d3c2", 4, ink);
      for (let i = 0; i < 12; i++) { ellipse(x, y + 27 + i * 11, w * .4, 7, color); ellipse(x, y + 24 + i * 11, w * .4, 5, white); line([[x - w * .29, y + 26 + i * 11], [x + w * .29, y + 26 + i * 11]], "#b8d4c7", 1); }
    }
    // The flat ceramic lip exactly matches the physical landing width and top.
    box(x - w / 2, y, w, 9, done ? "#daf4cb" : white, 3, ink); box(x - w / 2 + 3, y + 8, w - 6, 5, color, 2);
    if (next) line([[x - w / 2 + 4, y - 3], [x + w / 2 - 4, y - 3]], red, 3);
    if (p.amp) { line([[x - p.amp, y + 184], [x + p.amp, y + 184]], "#477c7770", 2); for (const side of [-1, 1]) line([[x + side * (p.amp - 5), y + 180], [x + side * p.amp, y + 184], [x + side * (p.amp - 5), y + 188]], "#477c77", 2); }
    ellipse(x, y + 40, 11, 11, next ? red : ink); text(String(p.id).padStart(2, "0"), x, y + 41, 10, white, "center");
  }
  function toast(s, reduced) {
    if (s.phase === "lost") return;
    const p = s.player, x = p.x - s.camera, y = p.y, q = s.mode === "charging" ? s.charge : 0;
    const squash = q * .38 + (!reduced ? s.landing * .19 : 0), flight = s.mode === "flight";
    const angle = reduced ? 0 : flight ? Math.max(-.2, Math.min(.28, p.vy * .028)) : Math.sin(s.time / 40) * q * .025;
    c.save(); c.translate(x, y + 19); c.rotate(angle); c.scale(1 + squash * .55, 1 - squash); c.translate(0, -22);
    c.shadowColor = "#694a3928"; c.shadowBlur = 5; c.shadowOffsetY = 3;
    c.beginPath(); c.moveTo(-18, 20); c.quadraticCurveTo(-23, 17, -21, 8); c.lineTo(-21, -7); c.bezierCurveTo(-32, -18, -17, -29, -6, -24); c.quadraticCurveTo(0, -27, 7, -24); c.bezierCurveTo(20, -28, 32, -16, 21, -7); c.lineTo(21, 12); c.quadraticCurveTo(22, 21, 16, 21); c.closePath(); c.fillStyle = "#c9733f"; c.fill(); c.strokeStyle = "#793e2d"; c.lineWidth = 2.5; c.stroke(); c.shadowBlur = 0; c.shadowOffsetY = 0;
    c.beginPath(); c.moveTo(-15, 15); c.lineTo(-15, -9); c.bezierCurveTo(-24, -15, -13, -23, -5, -18); c.quadraticCurveTo(1, -22, 7, -18); c.bezierCurveTo(17, -22, 24, -13, 15, -8); c.lineTo(15, 15); c.closePath(); c.fillStyle = "#fff3c8"; c.fill();
    for (let i = 0; i < 11; i++) ellipse(-11 + (i * 13 % 23), -14 + (i * 17 % 28), .8 + i % 2, 1, "#dbb87470");
    c.save(); c.rotate(-.15); box(-9, -21, 17, 7, yellow, 2, "#cba12f"); line([[-6, -19], [4, -19]], "#fff4a4", 2); c.restore();
    for (const ex of [-7, 8]) { if (q > .7) line([[ex - 3, -1], [ex, 1], [ex + 3, -1]], ink, 2); else { ellipse(ex, -1, 3.3, flight ? 4.5 : 3.5, white); ellipse(ex + 1, -1, 1.5, 2.5, ink); } }
    if (flight) ellipse(2, 9, 3, 4, "#b45941"); else line([[-2, 8], [2, 9 + q * 2], [5, 8]], "#b45941", 1.8);
    for (const side of [-1, 1]) { line([[side * 20, 3], [side * (flight ? 29 : 26), flight ? -8 : 10]], ink, 2); ellipse(side * (flight ? 30 : 26), flight ? -9 : 11, 2.5, 2.5, red); }
    c.restore();
    if (s.mode === "charging") {
      const meterY = y - 58; box(x - 33, meterY, 66, 7, "#29413c30", 3); box(x - 33, meterY, 66 * q, 7, q > .88 ? red : blue, 3);
      for (let i = 1; i < 4; i++) line([[x - 33 + i * 16.5, meterY + 1], [x - 33 + i * 16.5, meterY + 6]], "#ffffffa0", 1);
    }
  }
  function draw(g, { reduced = false, stopped = false } = {}) {
    if (disposed) return; const s = g.scene, dpr = Math.min(2, globalThis.devicePixelRatio || 1), b = canvas.getBoundingClientRect(), w = Math.max(1, Math.round((b.width || 960) * dpr)), h = Math.round(w * 9 / 16);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; } c.setTransform(w / 960, 0, 0, h / 540, 0, 0);
    if (loaded) c.drawImage(art, -s.camera * .024, -28, 1020, 574); else { box(0, 0, 960, 540, "#abd9c7"); for (let x = 0; x < 960; x += 70) line([[x, 0], [x, 540]], "#d4e7cf", 1); }
    const shade = c.createLinearGradient(0, 200, 0, 540); shade.addColorStop(0, "#dbf0d900"); shade.addColorStop(1, "#c9e4d7cc"); box(0, 0, 960, 540, shade);
    c.save(); if (!reduced && !stopped && s.impact > .02) c.translate(Math.sin(s.time * .7) * s.impact * 2.5, 0);
    for (const p of s.platforms) table(p, s);
    if (s.lastMiss?.index === s.index + 1 && s.mode !== "flight") {
      const target = s.platforms[s.lastMiss.index], x = target.x + s.lastMiss.offset - s.camera;
      if (x > 20 && x < 920) { line([[x, target.y - 32], [x, target.y - 7]], red, 2, [3, 4]); line([[x - 5, target.y - 12], [x, target.y - 6], [x + 5, target.y - 12]], red, 2); text(`${s.lastMiss.side === "short" ? "短" : "过"} ${s.lastMiss.distance}`, x, target.y - 43, 12, red, "center"); }
    }
    if (!reduced) { for (let i = 0; i < s.trail.length; i++) { const p = s.trail[i]; c.globalAlpha = i / s.trail.length * .24; ellipse(p.x - s.camera, p.y, 3, 3, white); } c.globalAlpha = 1; }
    toast(s, reduced);
    if (!reduced) for (const p of s.crumbs) { c.save(); c.globalAlpha = Math.min(1, p.life * 2); c.translate(p.x - s.camera, p.y); c.rotate(p.angle); box(-2, -2, 4 + p.angle % 3, 4, p.angle % 2 > 1 ? yellow : "#bd7346", 1); c.restore(); }
    c.restore();
    box(0, 0, 960, 79, "#fffaf0f5"); box(0, 77, 960, 3, red);
    text("吐司别掉", 24, 30, 29); text("TOAST DON'T FALL", 26, 59, 12, red);
    for (let i = 0; i < 10; i++) { const x = 343 + i * 23; box(x, 28, 16, 22, i < s.index ? red : "#d7e0d6", 3); if (i < s.index) line([[x + 4, 40], [x + 7, 43], [x + 12, 35]], white, 2); }
    text(`${s.index} / 10`, 596, 40, 22); text(`最远 ${s.best}`, 930, 26, 16, ink, "right"); text(`摔了 ${s.deaths} 次`, 930, 54, 14, red, "right");
    box(0, 500, 960, 40, "#fffaf0ee"); text(`第 ${String(s.attempt).padStart(2, "0")} 份早餐`, 23, 522, 14, ink);
    text(stopped ? "早餐暂停了" : s.phase === "won" ? "今天的早餐，没有掉。" : s.phase === "lost" ? s.failure : s.mode === "charging" ? "蓄力中" : s.mode === "flight" ? "拜托，接住。" : s.lastMiss ? s.failure || "再来一口气。" : "地板不提供早餐。", 935, 522, 14, s.phase === "lost" ? red : ink, "right");
    if (s.phase === "lost") { text(s.failure, 480, 220, 46, red, "center"); text("再来。", 480, 265, 19, ink, "center"); }
    if (s.phase === "won") { box(219, 170, 522, 124, "#fffaf0f2", 6); text("早餐保住了。", 480, 211, 38, red, "center"); text(`10 / 10   ·   ${s.perfect} 次正中餐台`, 480, 263, 19, ink, "center"); }
    // A wordless hand points to the single gesture without covering the playfield.
    if (s.awaiting && !stopped) {
      const x = s.player.x - s.camera + 60, y = s.player.y - 5;
      c.save(); c.translate(x, y); line([[0, 12], [0, -8], [5, -11], [10, -7], [10, 4], [18, 2], [24, 7], [23, 27], [4, 27], [-4, 16], [0, 12]], ink, 2.5); box(3, -5, 4, 16, white, 2); line([[0, -20], [5, -24], [10, -20]], red, 2); c.restore();
    }
  }
  return { draw, ready, point(x, y) { const b = canvas.getBoundingClientRect(); return { x: (x - b.left) * 960 / b.width, y: (y - b.top) * 540 / b.height }; },
    get diagnostics() { return { assetLoaded: loaded, contexts: disposed ? 0 : 1 }; }, destroy() { disposed = true; art.onload = art.onerror = null; } };
}
