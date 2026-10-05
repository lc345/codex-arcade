import { STUDIO_ART } from "./assets.js";

export function createYesterdayPainter(canvas) {
  const c = canvas.getContext("2d"), art = new Image(), ink = "#183f61", blue = "#247bb4", red = "#df514e", yellow = "#ffd54f";
  let loaded = false, disposed = false, last = null, hoverNode = -1;
  const originalTitle = canvas.title;
  const ready = new Promise(resolve => { art.onload = () => { loaded = true; resolve(); }; art.onerror = resolve; });
  art.src = STUDIO_ART["yesterday-express"] || "/apps/codex-stage/assets/studio/yesterday-express-art.jpg";
  const point = (x, y) => { const r = canvas.getBoundingClientRect(); return { x: (x - r.left) * 960 / r.width, y: (y - r.top) * 540 / r.height }; };
  function hover(e) {
    if (!last) return;
    const p = point(e.clientX, e.clientY), node = last.nodes.find(n => Math.hypot(n.x - p.x, n.y - 23 - p.y) < 52);
    hoverNode = node?.index ?? -1;
    canvas.title = p.y > 457 ? p.x > 722 ? "留下分身：倒带并重放这次选过的目的地；分身会留在终点。" : p.x > 633 ? "撤回最新分身，重新开始这轮。" : originalTitle : node ? `${node.label}：设为目的地` : originalTitle;
    canvas.style.cursor = node || p.y > 457 && p.x > 633 ? "pointer" : "default";
  }
  canvas.addEventListener("pointermove", hover);
  function line(points, color = ink, width = 3, dash = []) {
    c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.strokeStyle = color; c.lineWidth = width; c.lineCap = "round"; c.lineJoin = "round"; c.setLineDash(dash); c.stroke(); c.setLineDash([]);
  }
  function rect(x, y, w, h, color, radius = 0, outline = null) { c.beginPath(); c.roundRect(x, y, w, h, radius); c.fillStyle = color; c.fill(); if (outline) { c.strokeStyle = outline; c.lineWidth = 2; c.stroke(); } }
  function circle(x, y, r, color, outline = null, width = 2) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = color; c.fill(); if (outline) { c.strokeStyle = outline; c.lineWidth = width; c.stroke(); } }
  function ellipse(x, y, rx, ry, color) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = color; c.fill(); }
  function text(value, x, y, size = 18, color = ink, align = "left", weight = 700) { c.font = `${weight} ${size}px "Avenir Next", "PingFang SC", system-ui, sans-serif`; c.fillStyle = color; c.textAlign = align; c.textBaseline = "alphabetic"; c.fillText(value, x, y); }
  function paper(points, color, shadow = true) {
    if (shadow) { c.save(); c.translate(3, 5); paper(points, "#164d7128", false); c.restore(); }
    c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fillStyle = color; c.fill();
  }
  function stamp(x, y, value, color, selected = false) {
    rect(x, y, 42, 45, selected ? color : "#f7fcff");
    for (let i = 0; i < 5; i++) { circle(x, y + 4 + i * 9, 2.8, "#a2d4eb"); circle(x + 42, y + 4 + i * 9, 2.8, "#a2d4eb"); }
    text(value, x + 21, y + 31, 24, selected ? "#ffffff" : color, "center");
  }
  function parcel(x, y, scale = 1, rotation = 0) {
    c.save(); c.translate(x, y); c.rotate(rotation); c.scale(scale, scale);
    paper([[-17, -14], [15, -16], [19, 11], [-15, 14]], yellow);
    line([[0, -14], [2, 12]], "#d99735", 5); line([[-15, -2], [17, -4]], "#d99735", 3);
    rect(-11, -10, 9, 6, "#fff9df"); line([[-9, -7], [-4, -7]], blue, 1); c.restore();
  }
  function building(x1, x2, y, index) {
    const colors = ["#f5fcff", "#347cac", "#ee8272", "#f7fcff"], fill = colors[index % colors.length];
    paper([[x1, y + 8], [x2, y + 8], [x2 - 5, 450], [x1 + 3, 450]], fill);
    rect(x1 - 4, y + 2, x2 - x1 + 8, 12, ink);
    rect(x1 - 9, y - 5, x2 - x1 + 18, 11, "#f9feff", 1);
    line([[x1 - 8, y + 6], [x2 + 8, y + 6]], "#b7d1dd", 2);
    for (let x = x1 + 23; x < x2 - 15; x += 48) for (let yy = y + 38; yy < 440; yy += 47) {
      rect(x, yy, 20, 27, index % 4 === 1 ? "#b6e0ed" : "#84b9d0"); line([[x + 10, yy], [x + 10, yy + 27]], fill, 3); line([[x, yy + 13], [x + 20, yy + 13]], fill, 3);
    }
    if (x2 - x1 > 180) { rect(x1 + 31, 427, 36, 23, red); circle(x1 + 58, 439, 2, yellow); }
  }
  function mechanism(e, s, g, time, reduced) {
    const a = s.nodes[e.a], b = s.nodes[e.b], open = g.plates()[e.gate], occupied = s.actors.some(p => p.next !== null && (p.node === e.a && p.next === e.b || p.node === e.b && p.next === e.a));
    if (e.kind === "stairs") {
      line([[a.x - 20, a.y], [b.x - 20, b.y]], ink, 5); line([[a.x + 20, a.y], [b.x + 20, b.y]], ink, 5);
      for (let k = 0; k < 10; k++) { const t = k / 10; line([[a.x - 23 + (b.x - a.x) * t, a.y + (b.y - a.y) * t], [a.x + 23 + (b.x - a.x) * t, a.y + (b.y - a.y) * t]], "#f9fbfa", 7); }
      return;
    }
    if (e.kind === "walk") return;
    const plate = s.nodes.find(n => n.role === e.gate), mid = (a.x + b.x) / 2;
    line([[plate.x, plate.y + 14], [plate.x, plate.y + 27], [mid, plate.y + 27], [mid, (a.y + b.y) / 2 + 15]], open ? "#e4b02a" : "#8baabb", 3, [6, 5]);
    if (e.kind === "bridge") {
      const ready = open || occupied;
      c.save(); c.translate(a.x, a.y); c.rotate(ready ? 0 : -.3);
      rect(0, 0, b.x - a.x, 9, ready ? "#e3ae39" : "#98aebb");
      for (let x = 8; x < b.x - a.x; x += 18) line([[x, 0], [x, 9]], ready ? "#bc832a" : "#718c9a", 2);
      c.restore();
      for (const node of [a, b]) { rect(node.x - 4, node.y - 35, 8, 35, blue); circle(node.x, node.y - 39, 6, ready ? yellow : "#e26560", ink); }
      if (!ready) text(e.gate, mid, a.y - 22, 20, ink, "center");
    } else {
      line([[a.x - 32, a.y + 10], [b.x - 32, b.y - 18], [b.x + 32, b.y - 18], [a.x + 32, a.y + 10]], ink, 4);
      const riding = s.actors.find(p => p.next !== null && (p.node === e.a && p.next === e.b || p.node === e.b && p.next === e.a));
      const y = riding ? g.pose(riding).y : s.actors.some(p => p.node === e.b) ? b.y : a.y;
      rect(a.x - 30, y + 1, 60, 9, open || occupied ? yellow : "#b5c2c7");
      for (const x of [a.x - 32, a.x + 32]) { circle(x, b.y - 18, 9, blue, ink); line([[x - 5, b.y - 18], [x + 5, b.y - 18]], "#fff", 2); }
      if (!open) text("B", a.x, (a.y + b.y) / 2, 23, ink, "center");
    }
  }
  function station(n, s, open, time, reduced) {
    const { x, y, role } = n, selected = n.index === s.cursor || n.index === hoverNode;
    if (selected && !s.completed) { ellipse(x, y + 3, 28, 8, "#ffdb5290"); line([[x - 16, y + 18], [x, y + 24], [x + 16, y + 18]], blue, 3); }
    if (["A", "B"].includes(role)) {
      const down = open[role]; rect(x - 25, y - (down ? 5 : 10), 50, down ? 5 : 10, down ? "#efc447" : "#7097a9", 3, ink);
      circle(x - 36, y - 40, 14, down ? yellow : "#edf8fb", ink); text(role, x - 36, y - 33, 19, ink, "center");
    } else if (role === "mail") {
      rect(x - 5, y - 52, 10, 52, ink); paper([[x - 25, y - 76], [x + 23, y - 77], [x + 27, y - 28], [x - 24, y - 27]], red);
      rect(x - 16, y - 59, 31, 5, ink, 1); rect(x - 11, y - 48, 22, 13, "#fff9e8"); line([[x - 10, y - 47], [x, y - 40], [x + 10, y - 47]], red, 1.5);
      line([[x + 29, y - 76], [x + 29, y - 96]], ink, 2); paper([[x + 28, y - 96], [x + 47, y - 92], [x + 29, y - 86]], s.completed ? yellow : "#f8fcfe", false);
      rect(x - 38, y + 18, 76, 26, "#f8fcfff0", 2); text("收件箱", x, y + 37, 18, ink, "center");
    } else if (role === "depot") {
      rect(x - 33, y - 48, 66, 48, "#f7fbfb", 1, ink); paper([[x - 41, y - 50], [x - 31, y - 71], [x + 29, y - 71], [x + 40, y - 50]], blue);
      for (let i = 0; i < 5; i++) rect(x - 31 + i * 13, y - 50, 7, 10, "#b4dfed"); rect(x - 19, y - 33, 38, 27, "#376788");
      rect(x - 38, y + 18, 76, 26, "#f8fcfff0", 2); text("取件处", x, y + 37, 18, ink, "center");
    } else if (role === "chute") {
      line([[x - 25, y - 25], [x - 13, y - 5], [x + 22, y - 5], [x + 28, y - 17]], blue, 9);
      text("滑道 B", x + 48, y - 48, 18, ink);
    } else if (role === "catch") {
      paper([[x - 28, y - 17], [x - 21, y + 1], [x + 25, y + 1], [x + 30, y - 17]], "#e4b02a");
      line([[x - 20, y - 10], [x + 20, y - 10]], "#fff1ad", 3);
    } else if (role === "start") {
      rect(x - 27, y - 54, 5, 54, ink); paper([[x - 23, y - 55], [x + 7, y - 51], [x - 23, y - 35]], "#f8fbff");
    } else { circle(x, y - 6, 4, "#537f94"); }
  }
  function courier(a, index, s, g, time, reduced) {
    const p = g.pose(a), live = index === s.records.length, color = live ? yellow : index === 0 ? "#57c4c7" : "#db7a9a";
    const walking = a.next !== null, cycle = reduced ? 0 : Math.sin(time / 92 + index * 2), stride = walking ? cycle * 12 : 0, bob = walking && !reduced ? Math.abs(cycle) * 2 : 0;
    ellipse(p.x, p.y + 1, 18, 4, "#123f5638");
    c.save(); c.translate(p.x, p.y - bob); c.scale(a.facing, 1);
    line([[-7, -22], [-7 + stride, -9], [-6 - stride * .5, -2]], ink, 7); line([[7, -22], [7 - stride, -10], [9 + stride * .5, -2]], blue, 7);
    line([[-9 - stride * .5, -2], [-1 - stride * .5, -2]], red, 5); line([[7 + stride * .5, -2], [16 + stride * .5, -2]], red, 5);
    paper([[-13, -49], [9, -47], [15, -22], [-15, -22]], color);
    if (!live) { line([[-8, -39], [8, -39]], "#fff8dd", 2); line([[-10, -31], [10, -31]], "#fff8dd", 2); }
    line([[-6, -45], [12, -25]], "#a75445", 4); rect(-20, -34, 17, 19, "#cc6250", 3, ink);
    line([[8, -42], [18, -32 + stride / 3], [23, -35]], color, 7); circle(24, -36, 4, "#f6c6a6");
    circle(0, -60, 12, "#f8c8a9"); paper([[-13, -62], [-13, -70], [7, -73], [14, -63]], blue); rect(1, -65, 19, 4, blue);
    circle(8, -58, 1.8, ink); line([[7, -52], [11, -53]], "#a95245", 1.4);
    paper([[-9, -48], [-18, -46], [-31 - (walking ? cycle * 3 : 0), -55], [-27, -42], [-10, -43]], red, false);
    if (s.parcel.owner === index) parcel(26, -31, .8, -.08);
    c.restore();
    rect(p.x - 25, p.y - 103, 50, 22, live ? ink : color, 3);
    text(live ? "今天" : `昨天 ${index + 1}`, p.x, p.y - 87, live ? 15 : 13, live ? "#fff" : ink, "center");
  }
  function cassette(x, index, commands, s, time, reduced) {
    const color = index === 0 ? "#57c4c7" : "#db7a9a";
    rect(x, 477, 150, 47, commands ? color : "#d9e8ed", 3);
    text(`昨天 ${index + 1}`, x + 12, 495, 15, ink);
    if (commands) {
      rect(x + 11, 502, 128, 12, "#ecf8f4", 2);
      for (const xx of [x + 26, x + 124]) { circle(xx, 508, 7, ink); circle(xx, 508, 2, "#fff"); const a = reduced ? 0 : time / 220; line([[xx - Math.cos(a) * 5, 508 - Math.sin(a) * 5], [xx + Math.cos(a) * 5, 508 + Math.sin(a) * 5]], "#f5faf4", 1.5); }
      text(`${commands.length} 站`, x + 133, 495, 13, ink, "right");
    } else { line([[x + 16, 510], [x + 135, 510]], "#90acb9", 2, [4, 6]); }
  }
  function draw(world, { reduced = false, stopped = false } = {}) {
    if (disposed) return; const s = world.scene; last = s;
    const ratio = Math.min(2, globalThis.devicePixelRatio || 1), w = Math.round(960 * ratio), h = Math.round(540 * ratio);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    c.setTransform(ratio, 0, 0, ratio, 0, 0); c.clearRect(0, 0, 960, 540); rect(0, 0, 960, 540, "#a8d9ee");
    if (loaded) c.drawImage(art, 0, 0, 960, 540);
    const time = reduced ? 0 : s.time, open = world.plates();
    s.floors.forEach(([x1, x2, y], i) => building(x1, x2, y, i + s.level));
    if (s.level === 2) {
      line([[712, 216], [751, 260], [751, 328], [690, 374]], "#2b719b45", 26);
      line([[712, 216], [751, 260], [751, 328], [690, 374]], "#e5f5f2b0", 18);
      line([[714, 216], [753, 260], [753, 328], [692, 374]], "#4f88a0", 2, [4, 6]);
    }
    for (const e of s.edges) mechanism(e, s, world, time, reduced);
    for (const n of s.nodes) station(n, s, open, time, reduced);
    if (s.parcel.node !== null && !s.parcel.delivered) { const n = s.nodes[s.parcel.node]; parcel(n.x, n.y - 22, .85); }
    if (s.parcel.drop !== null) {
      const k = s.parcel.drop, x = k < .28 ? 690 + k / .28 * 61 : k < .68 ? 751 : 751 - (k - .68) / .32 * 61;
      parcel(x, 192 + k * 177, .8, reduced ? 0 : k * Math.PI * 2);
    }
    const order = s.actors.map((a, i) => ({ a, i })).sort((a, b) => world.pose(a.a).y - world.pose(b.a).y || a.i - b.i);
    for (const { a, i } of order) courier(a, i, s, world, time, reduced);
    text("YESTERDAY EXPRESS", 28, 30, 15, blue);
    text(s.title, 27, 67, 28, ink);
    for (let i = 0; i < 3; i++) stamp(790 + i * 50, 20, `${i + 1}`, i < s.level + Number(s.completed) ? red : blue, i === s.level);
    rect(0, 456, 960, 84, "#f3fbfc"); line([[0, 456], [960, 456]], "#729cad", 2);
    text("时间邮局", 25, 488, 20); text(`${s.level + 1} / 3`, 25, 516, 20, blue);
    for (let i = 0; i < s.limit; i++) cassette(143 + i * 160, i, s.records[i], s, time, reduced);
    text(`${(s.time / 1000).toFixed(1)}s`, 544, 498, 21, ink, "center");
    text(`${s.commands.length} 个目的地`, 544, 520, 13, "#527b93", "center");
    rect(641, 477, 62, 47, s.abilityAvailable ? "#dcecf2" : "#e9f1f3", 4);
    line([[674, 489], [660, 500], [674, 511]], s.abilityAvailable ? ink : "#aac0cb", 3); line([[664, 500], [685, 500]], s.abilityAvailable ? ink : "#aac0cb", 3);
    const enabled = world.snapshot().primaryEnabled;
    rect(726, 477, 209, 47, enabled ? s.completed ? blue : red : "#c7d7de", 4);
    if (s.completed) line([[744, 500], [755, 510], [773, 490]], "#fff", 3); else circle(753, 500, 8, enabled ? "#fff6e6" : "#eaf1f4");
    text(s.primaryLabel, 840, 507, 21, enabled ? "#fff" : "#688799", "center");
    if (s.completed) {
      c.save(); c.translate(466, 136); c.rotate(-.06); rect(-107, -29, 214, 65, "#fffaf0", 3, red);
      text("已 送 达", 0, 14, 30, red, "center"); c.restore();
      if (!reduced) for (let i = 0; i < 15; i++) { const x = 360 + (i * 43) % 270, y = 99 + (i * 31) % 68; c.save(); c.translate(x, y); c.rotate(i); rect(-3, -5, 6, 10, i % 2 ? yellow : red); c.restore(); }
    }
    if (s.rewind) {
      if (!reduced) { c.fillStyle = "#f7fbfc55"; c.fillRect(0, 90, 960, 345); for (let i = 0; i < 8; i++) line([[0, 105 + i * 43 + s.rewind % 12], [960, 100 + i * 43 + s.rewind % 12]], "#ffffff6a", 2); }
      text("昨天，重放中", 480, 127, 25, ink, "center");
    }
    if (stopped) { rect(301, 86, 358, 43, "#f8fcfff0", 4); text("已存档 · 下一次等待继续", 480, 114, 20, ink, "center"); }
  }
  return { ready, draw, point, get diagnostics() { return { assetLoaded: loaded, contexts: disposed ? 0 : 1 }; }, destroy() { disposed = true; art.onload = art.onerror = null; canvas.removeEventListener("pointermove", hover); canvas.title = originalTitle; canvas.style.cursor = ""; } };
}
