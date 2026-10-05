import { STUDIO_ART } from "./assets.js";

export function createStudioPainter(canvas, program, paint) {
  const c = canvas.getContext("2d");
  const art = new Image(); if (STUDIO_ART[program.id]) art.src = STUDIO_ART[program.id];
  const d = {
    c,
    worldArt(width, height) { if (!art.complete || !art.naturalWidth) return false; c.drawImage(art, 0, 0, width, height); return true; },
    panorama(progress) {
      if (!art.complete || !art.naturalWidth) return false;
      const width = 540 * art.naturalWidth / art.naturalHeight;
      c.drawImage(art, -Math.max(0, Math.min(1, progress)) * Math.max(0, width - 960), 0, width, 540); return true;
    },
    backdrop() { if (!art.complete || !art.naturalWidth) return false; c.drawImage(art, 0, 0, art.naturalWidth, art.naturalHeight, 0, 0, 960, 540); return true; },
    sprite(frame, x, y, width, height) {
      if (!art.complete || !art.naturalWidth) return false;
      // The two atlas silhouettes have an irregular transparent gutter.
      const start = frame ? 560 : 0, span = frame ? 720 : 640;
      c.save(); c.translate(x, y); c.scale(width / span, height / 640); c.beginPath();
      const edge = [[590, 0], [590, 320], [550, 400], [550, 640]];
      const mask = frame ? [...edge, [1280, 640], [1280, 0]] : [[0, 0], ...edge, [0, 640]];
      mask.forEach(([px, py], index) => index ? c.lineTo(px - start, py) : c.moveTo(px - start, py)); c.closePath(); c.clip();
      c.drawImage(art, 0, 0, art.naturalWidth, art.naturalHeight, -start, 0, 1280, 640); c.restore(); return true;
    },
    box(x, y, w, h, color, r = 6, stroke = null) { c.beginPath(); c.roundRect(x, y, Math.max(0, w), Math.max(0, h), r); c.fillStyle = color; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2; c.stroke(); } },
    circle(x, y, r, color, stroke = null, weight = 2) { c.beginPath(); c.arc(x, y, Math.max(0, r), 0, Math.PI * 2); c.fillStyle = color; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = weight; c.stroke(); } },
    line(points, color, weight = 2) { c.beginPath(); c.moveTo(...points[0]); for (const p of points.slice(1)) c.lineTo(...p); c.strokeStyle = color; c.lineWidth = weight; c.lineCap = "round"; c.lineJoin = "round"; c.stroke(); },
    poly(points, color, stroke = null) { c.beginPath(); c.moveTo(...points[0]); for (const p of points.slice(1)) c.lineTo(...p); c.closePath(); c.fillStyle = color; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2; c.stroke(); } },
    text(value, x, y, size = 22, color = "#edf4e8", align = "center", weight = 700) { c.font = `${weight} ${size}px system-ui,sans-serif`; c.fillStyle = color; c.textAlign = align; c.textBaseline = "middle"; c.fillText(String(value), x, y); },
    token(x, y, color, scale = 1) { c.save(); c.translate(x, y); c.scale(scale, scale); d.circle(0, 15, 20, "#0003"); d.box(-16, -8, 32, 28, color, 9, "#172c4266"); d.circle(0, -15, 15, color, "#ffffff66"); d.box(-10, -20, 20, 9, "#163448", 4); d.circle(-5, -16, 2, "#d6ffef"); d.circle(5, -16, 2, "#d6ffef"); d.line([[-7, 20], [-9, 26]], "#243a50", 6); d.line([[7, 20], [9, 26]], "#243a50", 6); c.restore(); },
    gem(x, y, color = "#8ee8d8", r = 16) { d.poly([[x, y - r], [x + r * .8, y], [x, y + r], [x - r * .8, y]], color, "#ffffff80"); d.poly([[x, y - r], [x, y + r], [x - r * .8, y]], "#ffffff40"); },
    tile(x, y, size, color, border = "#ffffff33") { d.box(x, y + 5, size - 3, size - 3, "#10293855", 7); d.box(x, y, size - 3, size - 3, color, 7, border); d.line([[x + 9, y + 6], [x + size - 13, y + 6]], "#ffffff22", 2); },
  };
  return {
    ready: art.src ? art.decode().catch(() => undefined) : Promise.resolve(),
    point(x, y) { const b = canvas.getBoundingClientRect(); return { x: (x - b.left) * 960 / b.width, y: (y - b.top) * 540 / b.height }; },
    draw(world, { reduced = false, stopped = false } = {}) {
      const b = canvas.getBoundingClientRect(), dpr = Math.min(2, globalThis.devicePixelRatio || 1), w = Math.max(1, Math.round(b.width * dpr)), h = Math.max(1, Math.round(b.height * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      c.setTransform(w / 960, 0, 0, h / 540, 0, 0); c.clearRect(0, 0, 960, 540);
      c.fillStyle = "#183a46"; c.fillRect(0, 0, 960, 540);
      d.reduced = reduced; d.time = reduced ? 0 : world.scene.time; d.compact = b.width < 650;
      paint(world, d);
      if (!reduced) for (const p of world.effects) { c.globalAlpha = Math.max(0, p.life / .65); d.circle(p.x, p.y, 3, p.color); } c.globalAlpha = 1;
      const compact = b.width < 650;
      if (program.presentation !== "panorama") {
      d.box(20, 16, compact ? 340 : 220, 36, "#102936d9", 7); d.text(program.english, 34, 34, compact ? 22 : 14, "#f4f7eb", "left");
      d.box(790, 16, 150, 36, "#102936d9", 7); d.text(String(world.scene.score).padStart(5, "0"), 924, 34, 20, "#fff2ca", "right");
      const s = world.snapshot();
      d.box(20, 493, 920, 31, "#102936dd", 7); d.text(s.status, 38, 509, compact ? 21 : 16, "#e1efe4", "left", 500);
      d.text(`${s.progress} / ${s.goal}`, 920, 509, compact ? 22 : 16, "#a5e1d8", "right");
      if (["won", "lost"].includes(s.phase)) { d.box(285, 191, 390, 142, "#132d39ed", 8, program.color); d.text(s.phase === "won" ? "挑战完成" : "再来一局", 480, 237, 32); d.text(`${s.score} 分`, 480, 284, 23, program.color); }
      }
      if (stopped) { d.box(0, 0, 960, 540, "#14202c66", 0); d.box(358, 235, 244, 62, "#102936ed", 8); d.text("任务完成 · 已暂停", 480, 267, 21); }
    },
    destroy() { art.src = ""; c.clearRect(0, 0, canvas.width, canvas.height); },
  };
}
