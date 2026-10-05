import { STUDIO_ART } from "./assets.js";

export function createStuntPainter(canvas) {
  const c = canvas.getContext("2d"), art = new Image(); let loaded = false, disposed = false;
  const ink = "#24393c", yellow = "#f1d45d", red = "#ed725d", mint = "#80c6a8";
  const ready = new Promise(resolve => { art.onload = () => { loaded = true; resolve(); }; art.onerror = resolve; });
  art.src = STUDIO_ART["temp-stunt"] || "/apps/codex-stage/assets/studio/temp-stunt-art.webp";
  const point = (x, y) => { const b = canvas.getBoundingClientRect(); return { x: (x - b.left) * 960 / b.width, y: (y - b.top) * 540 / b.height }; };
  function box(x, y, w, h, fill, r = 0, stroke) { c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2; c.stroke(); } }
  function line(p, color, w = 2, dash = []) { c.beginPath(); p.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.strokeStyle = color; c.lineWidth = w; c.lineCap = "round"; c.lineJoin = "round"; c.setLineDash(dash); c.stroke(); c.setLineDash([]); }
  function ellipse(x, y, rx, ry, color) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = color; c.fill(); }
  function text(v, x, y, size = 16, color = ink, align = "left", weight = 700) { c.font = `${weight} ${size}px "Avenir Next", "PingFang SC", system-ui, sans-serif`; c.fillStyle = color; c.textAlign = align; c.textBaseline = "alphabetic"; c.fillText(v, x, y); }
  function clay(x, y, w, h, color, light, r = 8) {
    c.save(); c.shadowColor = "#172b3940"; c.shadowBlur = 6; c.shadowOffsetY = 4;
    const g = c.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, light); g.addColorStop(.36, color); g.addColorStop(1, color);
    box(x, y, w, h, g, r); c.shadowBlur = 0; c.shadowOffsetY = 0;
    c.strokeStyle = "#102b3828"; c.lineWidth = 1.5; c.stroke();
    if (w > 20 && h > 20) line([[x + 7, y + 5], [x + w - 8, y + 5]], "#ffffff38", 2);
    c.restore();
  }
  function screw(x, y) { ellipse(x, y, 3, 3, "#566c70"); line([[x - 1, y - 1], [x + 1, y + 1]], "#a0b4b0", 1); }
  function set(s, time) {
    // Surfaces are drawn at the exact heights used by Matter.
    ellipse(152, 453, 142, 16, "#0f292745"); ellipse(853, 466, 105, 16, "#0f292760");
    clay(-12, 430, 266, 49, "#637b84", "#99a6aa", 6); box(-12, 430, 266, 8, "#abc4bd", 4);
    for (let x = 15; x < 250; x += 34) { c.save(); c.beginPath(); c.rect(-12, 460, 266, 10); c.clip(); line([[x, 460], [x + 10, 470]], yellow, 11); c.restore(); }
    // Spring-loaded office copier: its top is the spring collision surface.
    clay(308, 435, 88, 55, "#657c80", "#b3c9c1"); clay(305, 426, 94, 17, "#d2e4d5", "#faf8e7", 4);
    box(320, 454, 47, 18, "#2d454d", 3); line([[326, 464], [360, 464]], "#90baaf", 2);
    box(371, 450, 16, 7, "#aee274", 2); ellipse(377, 467, 4, 4, yellow);
    for (let i = 0; i < 4; i++) box(317 + i * 2, 481 - i * 3, 61, 4, "#f1efda", 1);
    line([[348, 423], [339, 414], [348, 406], [339, 398]], "#ebdc8b", 3);
    // The chair and elastic harness belong to the launch rig, not an approval button.
    line([[145, 391], [145, 421], [119, 428]], "#324d59", 7); line([[145, 414], [178, 428]], "#324d59", 7);
    ellipse(117, 429, 7, 6, "#1f363d"); ellipse(180, 429, 7, 6, "#1f363d");
    clay(112, 383, 66, 14, "#bd4f55", "#ed9a8a", 7); clay(111, 338, 13, 54, "#bb4c52", "#e89988", 7);
    line([[107, 352], [107, 377], [120, 377]], "#293f48", 4);
    // A narrow frame above/below the panes leaves the opening truly traversable.
    clay(497, 122, 36, 32, "#a4c5ba", "#e3ece0", 3);
    clay(499, 401, 32, 14, "#a4c5ba", "#e3ece0", 3);
    line([[533, 141], [555, 417], [573, 435]], "#4d6970", 5); line([[553, 337], [537, 382]], "#4d6970", 4);
    for (const p of s.panes) {
      if (p.broken) { line([[507, p.y - 19], [512, p.y - 9], [508, p.y - 6]], "#c0efe8", 2); continue; }
      c.save(); c.shadowColor = "#b9f5f5"; c.shadowBlur = 5;
      box(510, p.y - 21, 11, 42, "#a5dfde8c", 1, "#e8fbf5");
      line([[512, p.y + 6], [519, p.y - 10]], "#ffffffcc", 2); c.restore();
    }
    screw(505, 133); screw(525, 133); screw(509, 409);
    // Open-backed miniature elevator with a working overhead shutter.
    clay(765, 177, 182, 268, "#467779", "#98c6b4", 8);
    box(791, 204, 131, 225, "#254e51", 3);
    const inside = c.createLinearGradient(0, 204, 0, 430); inside.addColorStop(0, "#466b6c"); inside.addColorStop(1, "#729b88"); box(800, 205, 115, 219, inside, 2);
    line([[802, 366], [914, 366]], "#adccc0", 5); line([[855, 217], [855, 357]], "#294a4d", 2);
    box(828, 185, 61, 15, "#183437", 3); text("01", 858, 197, 13, "#d5e788", "center");
    clay(775, 430, 162, 26, "#74b383", "#c8e6ae", 5);
    for (let x = 795; x < 930; x += 20) line([[x, 436], [x + 7, 446]], "#b8d8a5", 3);
    box(770, 198, 18, Math.max(1, s.gate - 198), "#dd8775", 2);
    clay(770, s.gate - 18, 18, 18, "#c75f56", "#ffc5a0", 3);
    for (let y = 212; y < s.gate - 10; y += 13) line([[770, y], [786, y]], "#9e5653", 2);
    text("落位", 857, 392, 20, "#d5efc7", "center");
    line([[832, 405], [857, 418], [881, 405]], "#c9e991", 3);
    for (const a of s.anchors) {
      const live = a.available && s.attached === null;
      line([[a.x, 16], [a.x, a.y - 19]], "#27383c", 3);
      clay(a.x - 26, a.y - 24, 52, 21, "#7ca69a", "#d4e5c0", 5);
      ellipse(a.x, a.y - 1, 20, 5, "#ffedac");
      c.strokeStyle = live ? "#fff5b6" : "#708d84"; c.lineWidth = live ? 4 : 3; c.beginPath(); c.arc(a.x, a.y + 7, 10, -.3, Math.PI * 1.6); c.stroke();
      if (live) { c.strokeStyle = "#fff0a3"; c.lineWidth = 2; c.setLineDash([5, 5]); c.beginPath(); c.arc(a.x, a.y + 6, 33, 0, Math.PI * 2); c.stroke(); c.setLineDash([]); }
    }
  }
  function actor(s, time, reduced) {
    const parts = s.limbs;
    if (s.attached !== null) { const a = s.anchors[s.attached]; line([[a.x, a.y + 5], [s.player.x, s.player.y - 12]], "#162d38", 4); line([[a.x, a.y + 5], [s.player.x, s.player.y - 12]], yellow, 2); }
    if (s.mode === "ready" || s.mode === "aiming") {
      const x = 145 - s.aim.x * .55, y = 326 - s.aim.y * .55;
      if (s.mode === "aiming") { line([[113, 358], [x, y], [174, 380]], "#344e50", 7); line([[113, 358], [x, y], [174, 380]], "#e3b97a", 3); ellipse(x, y, 7, 7, red); }
      const vx = s.aim.x * .17, vy = s.aim.y * .17;
      for (let i = 1; i < 17; i++) { const t = i * 2; const px = 145 + vx * t, py = 326 + vy * t + .5 * .236 * t * t; if (px > 470 || py > 425 || py < 100) break; ellipse(px, py, i % 3 ? 2 : 3.5, i % 3 ? 2 : 3.5, "#fff5bcc9"); }
      if (s.mode === "ready") { c.strokeStyle = "#ffe4a4"; c.lineWidth = 2; c.setLineDash([4, 6]); c.beginPath(); c.ellipse(145, 328, 46, 62, 0, 0, Math.PI * 2); c.stroke(); c.setLineDash([]); }
    }
    if (!reduced) s.trail.forEach((p, i) => { c.globalAlpha = i / s.trail.length * .13; ellipse(p.x, p.y, 8, 8, "#fffbe5"); }); c.globalAlpha = 1;
    const order = [2, 3, 6, 7, 0, 8, 9, 4, 5, 1];
    for (const i of order) {
      const p = parts[i]; c.save(); c.translate(p.x, p.y); c.rotate(p.angle);
      if (i === 1) {
        clay(-13.5, -13.5, 27, 28, "#e9ae87", "#ffdeaf", 12);
        clay(-16, -18, 32, 15, "#d7bc4e", "#fff195", 10); box(-18, -7, 36, 5, yellow, 2);
        line([[-4, -16], [-4, -9]], "#fff7c7", 3);
        const dizzy = s.phase === "lost", wide = s.mode === "flight";
        for (const x of [-5, 7]) { ellipse(x, 2, 4.5, wide ? 5.5 : 4, "#fff9df"); if (dizzy) { line([[x - 2, 0], [x + 2, 4]], ink, 1.5); line([[x + 2, 0], [x - 2, 4]], ink, 1.5); } else ellipse(x + 1, 2, 1.7, wide ? 2.5 : 2, ink); }
        ellipse(1, 7, 3, 2, "#db9273"); if (wide) ellipse(3, 11, 3.4, 3.4, "#8d4c49"); else line([[-1, 11], [5, 11]], "#8d4c49", 1.5);
      } else if (i === 0) {
        clay(-14, -18, 28, 37, "#d86c65", "#fba393", 8);
        box(-14, 8, 28, 7, "#3c6570", 2); box(-4, 8, 8, 7, yellow, 1);
        line([[-8, -12], [-2, 6]], "#345666", 4); line([[8, -12], [2, 6]], "#345666", 4);
        box(3, -10, 7, 9, "#f2d7b1", 1); screw(5, -7);
        const sway = reduced ? 0 : Math.sin(time * .008) * 4 + s.player.vx * .7;
        line([[-4, -15], [-11 - sway, -10], [-14 - sway, 0]], "#f4d077", 4);
      } else {
        const leg = i >= 6, front = i >= 4;
        clay(-p.w / 2, -p.h / 2, p.w, p.h, leg ? front ? "#396d78" : "#34515e" : front ? "#dc7b6b" : "#ae5859", leg ? "#79a9ac" : "#f3b194", p.w / 2 - 1);
        if ([3, 5].includes(i)) { clay(-6, p.h / 2 - 5, 12, 12, "#e6b791", "#ffe3b4", 5); }
        if ([7, 9].includes(i)) { clay(-7, p.h / 2 - 6, 21, 12, "#eee8cd", "#ffffee", 5); line([[-6, p.h / 2 + 5], [13, p.h / 2 + 5]], "#60716d", 2); }
      }
      c.restore();
    }
  }
  function particles(s, reduced) {
    if (reduced) return;
    for (const p of s.particles) { c.save(); c.globalAlpha = Math.min(1, p.life * 2); c.translate(p.x, p.y); c.rotate(p.angle);
      if (p.kind === "glass") { c.beginPath(); c.moveTo(-4, -8); c.lineTo(7, 2); c.lineTo(-3, 5); c.closePath(); c.fillStyle = "#c3f4edb0"; c.fill(); c.strokeStyle = "#eaffff"; c.lineWidth = 1; c.stroke(); }
      else if (p.kind === "paper") { box(-7, -5, 14, 10, "#f5efd5", 1); line([[-4, -1], [3, -1]], "#93aeb4", 1); }
      else if (p.kind === "confetti") box(-3, -5, 6, 10, [red, yellow, mint][Math.floor(p.angle) % 3] || yellow, 1);
      else ellipse(0, 0, 5, 4, "#d3d7c470"); c.restore(); }
  }
  function hud(s, stopped) {
    const labels = ["自由拍摄", "不用吊灯", "复印机救场", "轻拿轻放"];
    for (let i = 0; i < 4; i++) { const x = 225 + i * 118, chosen = s.challenge === i;
      box(x, 39, 112, 41, chosen ? "#e9d389" : "#243b40e8", 4);
      text(labels[i], x + 56, 58, 14, chosen ? ink : "#e6ead8", "center");
      text(i && s.badges[i - 1] ? "已达成" : i === 3 ? "至多两块玻璃" : i === 2 ? "弹起后落位" : i === 1 ? "零次挂绳" : "任选路线", x + 56, 73, 10, chosen ? "#536257" : "#afc2b8", "center");
    }
    c.save(); c.translate(21, 23); c.rotate(-.025); clay(0, 0, 180, 67, "#243b40", "#42585b", 5);
    box(0, 0, 180, 13, "#e0e7db", 2); for (let i = 0; i < 7; i++) { c.save(); c.beginPath(); c.rect(0, 0, 180, 13); c.clip(); line([[i * 30 - 7, 0], [i * 30 + 5, 13]], "#293b3f", 15); c.restore(); }
    text("临时替身", 13, 39, 24, "#f9f0d6"); text(`OFFICE / TAKE ${String(s.take).padStart(2, "0")}`, 13, 56, 11, "#b3cabb"); c.restore();
    box(733, 27, 198, 47, "#1c343bdd", 6); ellipse(752, 43, 4, 4, s.mode === "flight" ? red : mint);
    text(s.phase === "won" ? "PRINT IT" : s.mode === "flight" ? "CAMERA ROLLING" : "STAND BY", 764, 47, 12, "#ecf2d5");
    if (s.slow) text("SLOW 0.4x", 746, 65, 12, yellow);
    text(`${String(s.score).padStart(4, "0")} PTS`, 917, 65, 12, yellow, "right");
    // Small caption strip leaves the entire playfield unobstructed.
    box(17, 491, 926, 36, "#1b303ae8", 6);
    text(s.phase === "won" ? s.challenge && !s.challengePassed ? "镜头完成 · 可选挑战还差一点" : "穿窗落位，完美收工。" : s.phase === "lost" ? s.status : stopped ? "片场暂停 · 下次从这一帧继续" : s.broken ? "道具玻璃已穿过" : "道具玻璃", 32, 514, 15, "#f0f0db");
    text(`吊灯 ${3 - s.catches}/3`, 772, 514, 14, "#d5dfd1", "right"); text(s.bounced ? "复印机弹射 ✓" : "办公室 · 第 01 镜", 925, 514, 13, s.bounced ? yellow : "#aebdbb", "right");
    if (s.phase !== "playing") {
      c.save(); c.translate(425, 265); c.rotate(-.04);
      box(-163, -49, 326, 95, "#f5eddced", 6); text(s.phase === "won" ? "这条过了！" : "再来一条。", 0, -5, 36, ink, "center");
      text(s.phase === "won" ? `${s.score} 分 · ${s.bounced ? "复印机救场" : s.catches ? "空中救场" : "一镜到底"}` : "替身没事，场务有点忙。", 0, 27, 17, "#68776c", "center"); c.restore();
    }
  }
  function draw(g, { reduced = false, stopped = false } = {}) {
    if (disposed) return; const s = g.scene, dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    if (canvas.width !== Math.round(960 * dpr) || canvas.height !== Math.round(540 * dpr)) { canvas.width = Math.round(960 * dpr); canvas.height = Math.round(540 * dpr); }
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, 960, 540);
    if (loaded) c.drawImage(art, 0, 0, 960, 540); else { box(0, 0, 960, 540, "#98b1a6"); box(0, 410, 960, 130, "#435659"); }
    c.save(); if (!reduced && s.hit > .05 && !stopped) c.translate(Math.sin(s.time) * s.hit * 2, Math.cos(s.time * .7) * s.hit);
    const time = reduced ? 0 : s.time; set(s, time); actor(s, time, reduced); particles(s, reduced); c.restore(); hud(s, stopped);
    if (!stopped && !s.tutorialSeen && s.mode === "ready" && s.time < 5200) {
      const t = reduced ? .55 : Math.min(1, (s.time % 2600) / 1500), x = 151 - 65 * t, y = 337 + 30 * t;
      c.save(); c.globalAlpha = .85; line([[151, 337], [86, 367]], "#fff9da", 3, [3, 5]);
      c.translate(x, y); c.beginPath(); c.moveTo(0, 0); c.lineTo(2, 23); c.lineTo(9, 16); c.lineTo(17, 16); c.closePath(); c.fillStyle = "#fffced"; c.fill(); c.strokeStyle = ink; c.lineWidth = 2; c.stroke();
      if (t < .85) { c.strokeStyle = yellow; c.beginPath(); c.arc(0, 0, 12, 0, Math.PI * 2); c.stroke(); } c.restore();
    }
  }
  return { ready, draw, point, get diagnostics() { return { assetLoaded: loaded, contexts: disposed ? 0 : 1 }; }, destroy() { disposed = true; art.onload = art.onerror = null; } };
}
