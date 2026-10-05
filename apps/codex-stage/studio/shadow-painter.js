import { STUDIO_ART } from "./assets.js";

export function createShadowPainter(canvas) {
  const c = canvas.getContext("2d"), art = new Image(), ink = "#263b42", coral = "#d95d50", mint = "#5da493";
  let loaded = false, disposed = false, world = null; const title = canvas.title;
  const ready = new Promise(resolve => { art.onload = () => { loaded = true; resolve(); }; art.onerror = resolve; });
  art.src = STUDIO_ART["shadow-crew"] || "/apps/codex-stage/assets/studio/shadow-crew-art.webp";
  const point = (x, y) => { const r = canvas.getBoundingClientRect(); return { x: (x - r.left) * 960 / r.width, y: (y - r.top) * 540 / r.height }; };
  function hover(e) {
    if (!world) return; const p = point(e.clientX, e.clientY), s = world.scene;
    canvas.title = p.y >= 490 && p.x >= 260 && p.x <= 610 ? "移动台灯：改变影子大小。键盘 - / =。" : s.level === 2 && p.y >= 480 && p.x >= 687 ? ["直尺", "梳子：阶梯影子", "剪刀：Q / E 开合"][Math.min(2, Math.floor((p.x - 687) / 79))] : p.y > 405 && Math.abs(p.x - s.prop.x) < 100 ? "拖动物件，影子跟着移动。方向键微调；B 撤销。" : title;
    canvas.style.cursor = p.y > 405 && p.y < 529 ? "grab" : "default";
  }
  canvas.addEventListener("pointermove", hover);
  function rect(x, y, w, h, fill, r = 0, stroke) { c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2; c.stroke(); } }
  function line(points, color = ink, width = 2, dash = []) { c.beginPath(); points.forEach((p, i) => i ? c.lineTo(p.x ?? p[0], p.y ?? p[1]) : c.moveTo(p.x ?? p[0], p.y ?? p[1])); c.strokeStyle = color; c.lineWidth = width; c.lineCap = "round"; c.lineJoin = "round"; c.setLineDash(dash); c.stroke(); c.setLineDash([]); }
  function poly(points, fill, stroke, width = 1) { c.beginPath(); points.forEach((p, i) => i ? c.lineTo(p.x ?? p[0], p.y ?? p[1]) : c.moveTo(p.x ?? p[0], p.y ?? p[1])); c.closePath(); c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); } }
  function circle(x, y, r, fill, stroke) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2; c.stroke(); } }
  function text(v, x, y, size = 16, color = ink, align = "left", weight = 700) { c.font = `${weight} ${size}px "Avenir Next", "PingFang SC", system-ui, sans-serif`; c.fillStyle = color; c.textAlign = align; c.textBaseline = "alphabetic"; c.fillText(v, x, y); }
  function tool(kind, x, y, w = 140, angle = 0, selected = false) {
    c.save(); c.translate(x, y); c.shadowColor = "#26383c45"; c.shadowBlur = 4; c.shadowOffsetY = 4;
    if (kind === "ruler") { rect(-w / 2, 0, w, 19, "#ebc04e", 2, "#a77a33"); c.shadowBlur = c.shadowOffsetY = 0;
      for (let i = 0; i < w - 6; i += 7) line([[-w / 2 + i + 4, 2], [-w / 2 + i + 4, i % 21 ? 7 : 12]], "#6c532d", 1);
      circle(w / 2 - 9, 12, 2, "#fbefb0");
    } else if (kind === "comb") {
      rect(-w / 2, 12, w, 10, "#db6754", 3, "#993b39");
      for (let i = 0; i < 7; i++) rect(-w / 2 + i * w / 7, -i * 2, w / 7 - 3, 18 + i * 2, "#e78668", 2);
    } else {
      for (const sign of [-1, 1]) { c.save(); c.rotate(sign * angle); poly([[-w / 2, 0], [w / 2, 0], [w / 2 - 8, 8], [-w / 2 + 8, 8]], "#becbd0", "#566c72");
        c.shadowBlur = c.shadowOffsetY = 0; c.strokeStyle = sign > 0 ? coral : mint; c.lineWidth = 5; c.beginPath(); c.ellipse(-w / 2 + 4, 9, 16, 10, 0, 0, Math.PI * 2); c.stroke(); c.restore(); }
      circle(0, 4, 4, "#f3edce", ink);
    }
    c.shadowBlur = c.shadowOffsetY = 0;
    if (selected) { line([[-w / 2 - 8, 31], [w / 2 + 8, 31]], "#edc45a", 3); circle(0, 32, 4, "#edc45a", "#fff9df"); }
    c.restore();
  }
  function worker(s, reduced) {
    const p = s.player, walking = s.mode === "walk" && Math.abs(p.vy) < 1, stride = walking && !reduced ? Math.sin(s.steps * 13) * 5 : 0;
    c.save(); c.translate(p.x, p.y); c.rotate(s.phase === "lost" ? .25 : 0);
    line([[-3, 4], [-5 - stride, 12]], ink, 4); line([[3, 4], [5 + stride, 12]], ink, 4);
    line([[-6 - stride, 12], [-2 - stride, 12]], "#d7614e", 3); line([[4 + stride, 12], [9 + stride, 12]], "#d7614e", 3);
    poly([[-6, -5], [5, -5], [7, 7], [-5, 7]], ink); line([[-4, -2], [2, 3]], "#f5e8cd", 2);
    line([[-5, -3], [-10, 2 + stride / 2]], ink, 3); line([[5, -2], [11, -4 - stride / 2]], ink, 3);
    line([[11, -8 - stride / 2], [11, 5 - stride / 2]], "#8b6251", 2); rect(7, -10 - stride / 2, 9, 4, "#708f8d", 1);
    circle(0, -10, 6.5, ink); c.beginPath(); c.arc(0, -12, 8, Math.PI, 0); c.fillStyle = coral; c.fill(); line([[-10, -12], [10, -12]], coral, 3);
    circle(3, -9, 1.2, "#fff7cf"); c.restore();
  }
  function draw(g, { reduced = false, stopped = false } = {}) {
    if (disposed) return; world = g; const s = g.scene, dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    if (canvas.width !== Math.round(960 * dpr) || canvas.height !== Math.round(540 * dpr)) { canvas.width = Math.round(960 * dpr); canvas.height = Math.round(540 * dpr); }
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, 960, 540);
    if (loaded) c.drawImage(art, 0, 0, 960, 540); else { rect(0, 0, 960, 540, "#f5f3eb"); rect(0, 425, 960, 115, "#9cc6b3"); }
    rect(188, 15, 584, 66, "#f8f5ecdc", 4);
    text("影子施工队", 211, 47, 26); text("SHADOW CREW", 212, 66, 10, "#7b8d87");
    text(`${String(s.level + 1).padStart(2, "0")} / 03`, 746, 39, 12, coral, "right"); text(s.title, 746, 65, 17, ink, "right");
    // Construction lines connect the physical prop on the bench to its wall projection.
    const shapes = g.sourceShapes();
    if (s.mode === "edit" && !stopped) for (const shadow of s.shadows.filter(p => p.part === 0)) {
      const source = shapes[0];
      for (const i of [0, 1]) line([[s.prop.x + source[i].x, 450 + (s.prop.y - 320) * .4 + source[i].y], shadow.vertices[i]], shadow.lamp ? "#d8736350" : "#517c8450", 1, [3, 5]);
    }
    c.save(); c.beginPath(); c.rect(35, 87, 890, 316); c.clip();
    for (const p of s.shadows) {
      c.save(); c.shadowColor = p.lamp ? "#d6615225" : "#416d7825"; c.shadowBlur = reduced ? 0 : 3;
      poly(p.vertices, p.lamp ? "#5f3e47df" : "#2e4552e8"); c.restore();
      const a = p.vertices[0], b = p.vertices[1]; line([a, b], p.lamp ? "#db8a72" : "#729ca8", 2);
    }
    for (let i = 0; i < s.islands.length; i++) {
      const p = s.islands[i], w = p.right - p.left;
      poly([[p.left + 5, p.y + 6], [p.right + 5, p.y + 6], [p.right + 9, 397], [p.left, 397]], "#24413b30");
      poly([[p.left, p.y], [p.right, p.y], [p.right - 3, 391], [p.left + 2, 391]], i === s.islands.length - 1 ? "#d16857" : "#8baaa0");
      rect(p.left - 2, p.y, w + 4, 6, i === s.islands.length - 1 ? "#ea927a" : "#bcd3bd", 1);
      for (let x = p.left + 16; x < p.right - 10; x += 26) { rect(x, p.y + 23, 11, 19, "#f5ecd5", 1); line([[x + 5, p.y + 23], [x + 5, p.y + 42]], "#8a9a8b", 1); }
      line([[p.left + 4, p.y + 57], [p.right - 7, p.y + 57]], "#36544b30", 1, [10, 4]);
      if (i === 0) { line([[79, p.y], [79, p.y - 34]], ink, 2); poly([[79, p.y - 34], [101, p.y - 30], [79, p.y - 17]], mint); }
      if (i === 1 && s.level === 1) { rect(444, p.y - 5, 16, 5, "#edd074", 1); circle(451, p.y - 23, 9, s.rest ? "#edc866" : "#f0f0da", ink); text("P", 451, p.y - 19, 10, ink, "center"); }
      if (i === s.islands.length - 1) { rect(846, p.y - 42, 27, 42, "#394b4b", 3); rect(851, p.y - 37, 17, 34, "#eec965", 2); circle(865, p.y - 19, 1.5, ink); poly([[840, p.y - 43], [858, p.y - 56], [879, p.y - 43]], coral); }
    }
    worker(s, reduced); c.restore();
    if (s.phase === "lost" || s.phase === "won") {
      const x = s.phase === "won" ? 640 : 480; c.save(); c.translate(x, 180); c.rotate(-.035);
      rect(-127, -28, 254, 64, "#f9f5e8f0", 2, s.phase === "won" ? mint : coral);
      text(s.phase === "won" ? "影子，也能搭桥。" : "脚下断开了。", 0, 1, 24, ink, "center"); text(s.phase === "won" ? "施工完成" : "回安全台继续", 0, 23, 12, "#788b84", "center"); c.restore();
    }
    // A compact workbench, with familiar slider and physical object handles.
    const benchY = 450 + (s.prop.y - 320) * .4;
    text("物件", 70, 452, 12, "#4c6f62"); tool(s.prop.kind, s.prop.x, benchY, [170, 106, 140][s.level], s.prop.angle, s.selected === "prop");
    if (s.prop.kind === "scissors") { circle(s.prop.x, benchY - 32, 13, "#e3ece0", coral); line([[s.prop.x - 7, benchY - 32], [s.prop.x + 7, benchY - 32]], coral, 2); }
    text("灯距", 212, 513, 14, "#3a6558"); line([[270, 507], [600, 507]], "#446d6460", 5);
    for (let i = 0; i <= 10; i++) line([[270 + 33 * i, 515], [270 + 33 * i, 519]], "#5c8373", 1);
    const lx = 270 + (s.zoom - 1.15) / 1.85 * 330;
    line([[270, 507], [lx, 507]], "#c06550", 4);
    circle(lx, 507, 12, "#faf2cf", ink); circle(lx, 507, 4, coral);
    text(`${s.zoom.toFixed(2)}×`, 652, 513, 15, ink, "right");
    // Tiny projector silhouettes make the two-light rule visible without another tutorial panel.
    for (let i = 0; i < s.lamps.length; i++) { const x = 107 + i * 45;
      line([[x, 496], [x + 2, 475], [x + 16, 468]], ink, 3); rect(x - 10, 497, 30, 6, i ? coral : mint, 3);
      poly([[x + 7, 466], [x + 22, 458], [x + 25, 475]], i ? coral : mint, ink); circle(x + 25, 466, 3, "#fff4be"); }
    if (s.level === 2) for (const [i, kind] of ["ruler", "comb", "scissors"].entries()) {
      const x = 687 + i * 79; rect(x, 484, 73, 39, s.prop.kind === kind ? "#fbefd3" : "#e3ece0b0", 4, s.prop.kind === kind ? coral : undefined); tool(kind, x + 38, 498, 43, kind === "scissors" ? .22 : 0); text(i + 1, x + 5, 494, 9, "#69897c");
    }
    if (stopped) { rect(324, 99, 312, 30, "#f5f5e9f0", 3, ink); text("施工暂停 · 已保存光线与落脚点", 480, 120, 15, ink, "center"); }
  }
  return { ready, draw, point, get diagnostics() { return { assetLoaded: loaded, contexts: disposed ? 0 : 1 }; }, destroy() { disposed = true; art.onload = art.onerror = null; canvas.removeEventListener("pointermove", hover); canvas.title = title; canvas.style.cursor = ""; } };
}
