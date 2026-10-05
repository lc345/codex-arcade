// Generated first-party game pack. Apache-2.0; dependencies retain their license notices.
export default (() => {
const GAME_CATALOG = [{"id":"press-run","title":"别被夹扁","english":"PRESS LINE","category":"platform-runner","artStyle":"industrial-cutaway","color":"#c9df43","genre":"按住 · 松手刹车","hint":"按住前进，松手刹车。八道压机，完整下班。","replayLabel":"再上一班","levels":["夜班八道关"],"kind":"game","edition":"studio","release":"stable","collection":"one-button","presentation":"panorama","soundPalette":"one-button","pointerMode":"click-nav","persistentCheckpoint":true,"hideLevels":true,"cover":"/apps/codex-stage/assets/studio/press-run.png","curated":true}];
const STUDIO_ART = {"press-run":""};
const createMatter = null;
const createSlingSound = function createSlingSound() {
  let context, muted = true;
  const voices = new Set();
  function stop() { for (const voice of voices) { try { voice.stop(); } catch {} } voices.clear(); }
  function play(kind, material) {
    if (muted || voices.size > 20) return;
    context ??= new AudioContext();
    if (context.state !== "running") return;
    const now = context.currentTime;
    function note(hz, endHz, duration, volume, type = "sine", delay = 0) {
      const voice = context.createOscillator(), gain = context.createGain();
      voice.type = type; voice.frequency.setValueAtTime(hz, now + delay); voice.frequency.exponentialRampToValueAtTime(endHz, now + delay + duration);
      gain.gain.setValueAtTime(0, now); gain.gain.setValueAtTime(volume, now + delay); gain.gain.exponentialRampToValueAtTime(.001, now + delay + duration);
      voice.connect(gain).connect(context.destination); voices.add(voice);
      voice.onended = () => { voices.delete(voice); voice.disconnect(); gain.disconnect(); };
      voice.start(now + delay); voice.stop(now + delay + duration + .02);
    }
    if (kind === "tin-step") note(110, 65, .045, .009, "triangle");
    else if (kind === "tin-pickup") [660, 990].forEach((hz,i)=>note(hz,hz,.2,.018,"sine",i*.08));
    else if (kind === "tin-magnet") { note(130, 280, .2, .018, "triangle"); note(620, 460, .12, .009); }
    else if (kind === "tin-grapple") { note(1450, 480, .07, .018, "triangle"); note(260, 990, .32, .014); }
    else if (kind === "tin-repair") [262, 392, 523, 659].forEach((hz,i)=>note(hz,hz,.28,.02,"triangle",i*.13));
    else if (kind === "tin-win") [392, 523, 659, 784, 1047].forEach((hz,i)=>note(hz,hz,.4,.02,"sine",i*.16));
    else if (kind === "tin-denied" || kind === "tin-alert") note(280, 190, .14, .016, "triangle");
    else if (kind === "tin-rescue") { note(220, 330, .22, .015); note(440, 660, .2, .012, "sine", .15); }
    else if (kind === "tin-switch") note(880, 740, .07, .012);
    else if (kind === "raft-hook") { note(750, 1600, .08, .022, "triangle"); note(320, 270, .11, .012); }
    else if (kind === "raft-install") { note(120, 70, .065, .035, "triangle"); note(660, 880, .18, .021, "sine", .055); }
    else if (kind === "raft-clunk") note(240, 90, .07, .026, "triangle");
    else if (kind === "raft-gasp") { note(300, 470, .15, .018, "triangle"); note(450, 230, .14, .013, "sine", .1); }
    else if (kind === "raft-horn") { note(220, 240, .26, .025, "triangle"); note(293, 310, .25, .012, "triangle", .05); }
    else if (kind === "raft-anchor" || kind === "raft-brake") note(370, 95, .24, .017, "triangle");
    else if (kind === "raft-chute") note(1300, 300, .4, .015);
    else if (kind === "raft-catch") [660, 990].forEach((hz, i) => note(hz, hz, .18, .025, "sine", i * .09));
    else if (kind === "raft-bump") { note(150, 70, .16, .035, "triangle"); note(700, 130, .1, .016); }
    else if (kind === "raft-splash") { note(430, 110, .29, .025, "sine"); note(700, 160, .21, .014, "triangle", .06); }
    else if (kind === "raft-clear") [392, 523, 659, 784].forEach((hz, i) => note(hz, hz, .25, .024, "triangle", i * .12));
    else if (kind === "cargo-grab") { note(130, 320, .16, .023, "triangle"); note(880, 660, .06, .012); }
    else if (kind === "cargo-release") note(380, 140, .18, .018);
    else if (kind === "cargo-brake") { note(220, 72, .25, .025, "triangle"); note(700, 200, .15, .01); }
    else if (kind === "cargo-impact") { note(material === "heavy" ? 75 : 170, 45, .14, .035, "triangle"); note(1350, 510, .06, .008); }
    else if (kind === "cargo-damage") { note(220, 90, .18, .03, "triangle"); note(1200, 400, .1, .013); }
    else if (kind === "cargo-dock") [440, 660, 880].forEach((hz, i) => note(hz, hz, .19, .023, "sine", i * .07));
    else if (kind === "cargo-clear") [523, 659, 784, 1047].forEach((hz, i) => note(hz, hz, .28, .025, "sine", i * .11));
    else if (kind === "fold-paper") { note(360, 190, .17, .025, "triangle"); note(850, 470, .11, .009); }
    else if (kind === "fold-lock") { note(550, 360, .055, .028, "triangle"); note(1100, 880, .08, .01); }
    else if (kind === "fold-depart") [392, 523].forEach((hz, i) => note(hz, hz, .19, .018, "sine", i * .1));
    else if (kind === "fold-step") note(160, 100, .035, .012, "triangle");
    else if (kind === "fold-lantern") [784, 1175].forEach((hz, i) => note(hz, hz, .28, .021, "sine", i * .09));
    else if (kind === "fold-arrive") [523, 659, 784, 1047].forEach((hz, i) => note(hz, hz, .37, .025, "sine", i * .12));
    else if (kind === "fold-blocked") { note(330, 280, .17, .018); note(220, 220, .18, .01, "sine", .13); }
    else if (kind === "mech-shot") { note(620, 170, .045, .018, "triangle"); note(95, 65, .045, .012); }
    else if (kind === "mech-dash") { note(160, 660, .13, .018, "triangle"); note(330, 100, .18, .014); }
    else if (kind === "mech-pulse") { note(130, 520, .3, .03); note(650, 180, .4, .015, "triangle"); }
    else if (kind === "mech-shield") { note(1760, 1400, .12, .012); note(880, 690, .1, .015); }
    else if (kind === "mech-hurt") { note(180, 90, .2, .033, "triangle"); note(73, 52, .23, .025); }
    else if (kind === "mech-boom") { note(95, 28, .35, .055, "triangle"); note(240, 70, .15, .025); }
    else if (kind === "mech-break") { note(260, 85, .12, .021, "triangle"); note(1300, 600, .08, .01); }
    else if (kind === "mech-warn") { note(430, 430, .1, .014); note(520, 520, .1, .012, "sine", .15); }
    else if (kind === "mech-clear") [392, 494, 587].forEach((hz, i) => note(hz, hz, .2, .021, "triangle", i * .08));
    else if (kind === "courier-hook") { note(1650, 780, .045, .028, "triangle"); note(620, 610, .13, .021); }
    else if (kind === "courier-release") { note(380, 1100, .16, .014, "triangle"); note(930, 1600, .13, .007); }
    else if (kind === "courier-land") { note(120, 58, .09, .035, "triangle"); note(240, 110, .055, .012); }
    else if (kind === "courier-stamp") [1047, 1568].forEach((hz, i) => note(hz, hz, .14, .025, "sine", i * .05));
    else if (kind === "courier-checkpoint") [440, 554, 659].forEach((hz, i) => note(hz, hz, .22, .025, "triangle", i * .075));
    else if (kind === "courier-glass") [1780, 2640, 3510, 4300].forEach((hz, i) => note(hz, hz * .7, .16, .016, "sine", i * .024));
    else if (kind === "courier-fall") note(360, 180, .28, .019, "triangle");
    else if (kind === "courier-recover") { note(350, 560, .19, .021); note(700, 840, .16, .011, "sine", .11); }
    else if (kind === "beat") { const frequency = [261.63, 329.63, 392, 523.25][Number(material) % 4] ?? 261.63; note(frequency, frequency, .22, .055, "triangle"); note(frequency * 2, frequency * 2, .1, .018); }
    else if (kind === "metronome") note(1300, 650, .03, .012, "sine");
    else if (kind === "launch") { note(280, 70, .24, .09, "triangle"); note(900, 240, .13, .025); }
    else if (kind === "boost") note(200, 1600, .25, .045, "triangle");
    else if (kind === "laser") note(1000, 240, .055, .015, "triangle");
    else if (kind === "shield") { note(180, 500, .4, .04); note(360, 1000, .35, .02); }
    else if (kind === "magnet") { note(110, 220, .25, .035, "triangle"); note(440, 330, .2, .03, "sine", .1); }
    else if (kind === "chime" || kind === "powerup") [659, 988, 1318].forEach((hz, i) => note(hz, hz, .22, .035, "sine", i * .06));
    else if (kind === "slice") { note(1600, 500, .09, .028, "triangle"); note(2000, 2800, .075, .018); }
    else if (kind === "slow") { note(700, 130, .55, .035); note(1050, 195, .5, .025); }
    else if (kind === "jump") note(220, 650, .14, .035, "triangle");
    else if (kind === "glide") { note(360, 720, .4, .025); note(540, 1080, .4, .015); }
    else if (kind === "flipper") { note(120, 65, .055, .04, "triangle"); note(240, 150, .06, .018); }
    else if (kind === "bell") [800, 1600, 2370].forEach((hz, i) => note(hz, hz * .99, .35 - i * .06, .025 / (i + 1)));
    else if (kind === "brake") note(420, 180, .21, .025, "triangle");
    else if (kind === "lumen") { note(880, 880, .27, .03); note(1320, 1320, .3, .015, "sine", .05); }
    else if (kind === "rocket") note(280, 1100, .16, .025, "triangle");
    else if (kind === "intercept") { note(140, 55, .23, .045, "triangle"); note(440, 220, .2, .02); }
    else if (kind === "win") [523, 659, 784, 1047].forEach((hz, i) => note(hz, hz, .3, .055, "sine", i * .1));
    else if (kind === "lose") { note(280, 170, .23, .04, "triangle"); }
    else if (kind === "break" && material === "glass") [1450, 2200, 3100].forEach((hz, i) => note(hz, hz * .85, .13, .018, "sine", i * .025));
    else if (kind === "break" && material === "target") { note(700, 1000, .12, .06); note(1200, 1300, .14, .025, "sine", .06); }
    else if (kind === "impact" || kind === "break" || kind === "explode") {
      if (voices.size > 16) return;
      const duration = kind === "explode" ? .4 : .085;
      const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2;
      const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
      source.buffer = buffer; filter.type = "lowpass"; filter.frequency.value = kind === "explode" ? 600 : material === "metal" ? 2800 : 950; gain.gain.value = kind === "explode" ? .24 : .07;
      source.connect(filter).connect(gain).connect(context.destination); voices.add(source);
      source.onended = () => { voices.delete(source); source.disconnect(); filter.disconnect(); gain.disconnect(); }; source.start();
      if (kind === "explode") note(100, 30, .32, .11, "sine");
    }
  }
  return {
    play, stop,
    setMuted(value) { muted = Boolean(value); if (muted) stop(); },
    unlock() { if (muted) return; context ??= new AudioContext(); context.resume().catch(() => {}); },
    destroy() { stop(); context?.close().catch(() => {}); },
  };
};
const listTheaterPrograms = function listTheaterPrograms(kind = "game") { return kind === "short" ? [] : GAME_CATALOG.map(p => ({ ...p, levels: p.levels.slice() })); };
const selectTheaterProgram = function selectTheaterProgram(event = {}, _mode, _index, _media, preferred) {
  const pinned = GAME_CATALOG.find(p => p.id === preferred);
  let hash = 0; for (const c of event.runId ?? "") hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  const released = GAME_CATALOG.filter(p => p.release !== "preview");
  return { ...(pinned ?? released[hash % released.length]) };
};
const gameControls = function gameControls() {
  return { primary: { label: "开始", gesture: "tap", hint: "开始当前游戏" }, secondary: { label: "" } };
};
const programControls = function programControls(_program, snapshot) {
  if (snapshot?.phase === "won") return { primary: { label: "下一关", gesture: "tap", hint: "前往下一关" }, secondary: { label: "重试", gesture: "retry", hint: "重玩当前关卡" } };
  if (snapshot?.phase === "lost") return { primary: { label: "再试一次", gesture: "tap", hint: "重新挑战当前关卡" } };
  return gameControls();
};
const createGamePicker = function createGamePicker(random = Math.random, catalog = GAME_CATALOG) {
  let bag = [], previous = null, previousCategory = null, cachedRun = null, cached = null, lastMode = null;
  return {
    pick(runId, preferred = null, mode = 'random') {
      if (cachedRun === runId && cached) return { ...cached };
      const pinned = catalog.find(g => g.id === preferred);
      if (pinned) { cached = pinned; cachedRun = runId; return { ...pinned }; }
      if(mode!==lastMode){bag=[];lastMode=mode;}
      if (!bag.length) {
        bag = catalog.filter(game => mode === 'all' || (mode==='curated' ? game.curated : game.release !== "preview"));
        if(!bag.length)bag=catalog.slice();
        for (let i = bag.length - 1; i > 0; i--) { const j = Math.min(i, Math.floor(Math.max(0, random()) * (i + 1))); [bag[i], bag[j]] = [bag[j], bag[i]]; }
        if (bag.at(-1).id === previous) [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
      }
      if(mode==='curated'&&bag.at(-1).category===previousCategory){const alternate=bag.findIndex(g=>g.category!==previousCategory&&g.id!==previous);if(alternate>=0)[bag[alternate],bag[bag.length-1]]=[bag.at(-1),bag[alternate]];}
      cached = bag.pop(); cachedRun = runId; previous = cached.id; previousCategory=cached.category; return { ...cached };
    },
  };
};
const createStudioKernel = function createStudioKernel(id, { level = 0, seed = 1, onEvent = () => {} } = {}) {
  const scene = {}, effects = [], history = [];
  let active = true, accumulator = 0, rng = seed >>> 0 || 1;
  const api = {
    scene, effects, history,
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    random() { rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0; return rng / 4294967296; },
    emit(type, material) { if (active) onEvent({ type, material }); },
    burst(x, y, color = "#75dac3") { for (let i = 0; i < 14; i++) { const a = api.random() * Math.PI * 2, v = 25 + api.random() * 100; effects.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .65, color }); } if (effects.length > 140) effects.splice(0, effects.length - 140); },
    reward(x, y, points = 100) { scene.score += points; api.burst(x, y); api.emit("break", "target"); },
    finish(win) { if (scene.phase !== "playing") return; scene.phase = win ? "won" : "lost"; api.emit(win ? "win" : "lose"); },
    build() {}, update() {}, release() {}, controls: () => ({}), act: () => false, alt: () => false, point: () => false, keyboard: () => false, clearInput() {},
    reset(next = scene.level ?? level) { api.release(); effects.length = history.length = 0; accumulator = 0; rng = seed >>> 0 || 1; for (const k of Object.keys(scene)) delete scene[k]; Object.assign(scene, { id, kind: id, level: next, time: 0, phase: "playing", score: 0, progress: 0, goal: 1, lives: 3, selection: 0, status: "", primaryLabel: "行动", secondaryLabel: "撤销", abilityAvailable: true }); api.build(); },
    step(ms) { if (!active || !Number.isFinite(ms) || ms <= 0) return; accumulator += Math.min(50, ms); while (accumulator >= 1000 / 120) { accumulator -= 1000 / 120; scene.time += 1000 / 120; if (scene.phase === "playing") api.update(1 / 120); for (const p of effects) { p.life -= 1 / 120; p.x += p.vx / 120; p.y += p.vy / 120; } for (let i = effects.length - 1; i >= 0; i--) if (effects[i].life <= 0) effects.splice(i, 1); } },
    snapshot() { return { id, active, phase: scene.phase, level: scene.level, time: Math.round(scene.time), score: scene.score, progress: scene.progress, goal: scene.goal, lives: scene.lives, status: scene.status, abilityAvailable: scene.phase === "playing" && scene.abilityAvailable, primaryLabel: scene.primaryLabel, secondaryLabel: scene.secondaryLabel, primaryEnabled: true, ...api.controls() }; },
    primary() { if (!active) return false; if (scene.phase === "won") return api.next(); if (scene.phase === "lost") return api.retry(); return api.act(); },
    secondary() { return active && scene.phase === "playing" ? api.alt() : false; },
    pointer(type, x, y) { return active && scene.phase === "playing" && Number.isFinite(x + y) ? api.point(type, x, y) : false; },
    key(key, down) { return active && scene.phase === "playing" ? api.keyboard(key, down) : false; },
    cancel() { api.clearInput(); }, stop() { api.clearInput(); active = false; },
    retry() { if (!active) return false; api.reset(); return true; }, next() { if (!active || scene.phase !== "won") return false; api.reset((scene.level + 1) % 3); return true; },
    setLevel(n) { if (!active || !Number.isInteger(n) || n < 0 || n > 2) return false; api.reset(n); return true; },
    destroy() { active = false; api.clearInput(); api.release(); effects.length = history.length = 0; },
  };
  return api;
};
const createStudioPainter = function createStudioPainter(canvas, program, paint) {
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
};
const createStudioRuntime = function createStudioRuntime(canvas, program, createWorld, paintWorld, callbacks = {}, makePainter = createStudioPainter) {
  const painter = makePainter(canvas, program, paintWorld), sound = program.soundPalette === "magnet" ? createMagnetSound() : program.soundPalette === "variety" ? createVarietySound(program.id) : program.soundPalette === "one-button" ? createOneButtonSound(program.id) : program.soundPalette === "toast" ? createToastSound() : program.soundPalette === "appliance" ? createApplianceSound() : program.soundPalette === "dice" ? createDiceSound() : program.soundPalette === "shadow" ? createShadowSound() : program.soundPalette === "stunt" ? createStuntSound() : program.soundPalette === "rules" ? createRuleSound() : program.soundPalette === "yesterday" ? createYesterdaySound() : program.soundPalette === "kitchen" ? createKitchenSound() : program.collection === "contrast" ? createContrastSound(program.id) : createSlingSound();
  let world = null, active = false, paused = false, hidden = false, reduced = false, frame = 0, last = 0, level = 0, pointer = null, signature = "", checkpoint;
  const listeners = [], listen = (target, type, fn) => { target.addEventListener(type, fn); listeners.push(() => target.removeEventListener(type, fn)); };
  const controls = () => ({ primary: { label: world?.scene.phase === "won" ? (program.replayLabel ?? (program.levels.length === 1 ? "再送一趟" : "下一关")) : world?.scene.phase === "lost" ? "重试" : world?.scene.primaryLabel ?? "开始", hint: program.hint }, secondary: { label: world?.scene.secondaryLabel ?? "技能", hint: program.hint } });
  function notify() {
    if (!world) return;
    const s = world.snapshot(), currentControls = controls();
    // Motion belongs on the canvas, not in the surrounding DOM or live region.
    const sig = JSON.stringify([s.phase, s.status, s.score, s.level, s.ammo, s.primaryEnabled, s.abilityAvailable, currentControls]);
    if (sig === signature) return;
    signature = sig; callbacks.onScore?.(s.score); callbacks.onFeedback?.({ text: s.status, score: s.score, controls: currentControls, snapshot: s });
  }
  function draw(now) { if (!active || paused || hidden) return; world.step(now - last); last = now; painter.draw(world, { reduced }); notify(); frame = requestAnimationFrame(draw); }
  function cancel() { if (pointer !== null) { const id = pointer; pointer = null; try { canvas.releasePointerCapture(id); } catch {} } world?.cancel(); }
  function stop() { if (!active) return; active = false; cancelAnimationFrame(frame); cancel(); world.stop(); sound.stop(); painter.draw(world, { reduced, stopped: true }); callbacks.onState?.({ type: "stopped", program, score: world.snapshot().score }); }
  function start() { cancelAnimationFrame(frame); cancel(); world?.destroy(); sound.stop(); active = true; world = createWorld({ level, checkpoint, onEvent: e => { if (active && !paused && !hidden) sound.play(e.type, e.material); } }); signature = ""; painter.draw(world, { reduced }); callbacks.onProgram?.(program, controls()); callbacks.onState?.({ type: "started", program }); notify(); last = performance.now(); if (!paused && !hidden) frame = requestAnimationFrame(draw); return program; }
  function input(gesture) { if (!active || paused || hidden) return false; sound.unlock(); const ok = gesture === "tap" ? world.primary() : gesture === "doubleTap" ? world.secondary() : gesture === "retry" ? world.retry() : false; painter.draw(world, { reduced }); notify(); return ok; }
  listen(canvas, "pointerdown", e => { if (!active || paused || hidden || pointer !== null || (e.button !== 0 && e.pointerType !== "touch")) return; canvas.focus({ preventScroll: true }); sound.unlock(); const p = painter.point(e.clientX, e.clientY); if (world.pointer("down", p.x, p.y, e.pointerType, p)) { pointer = e.pointerId; canvas.setPointerCapture(pointer); e.preventDefault(); notify(); } });
  listen(canvas, "pointermove", e => { if (!active || paused || hidden) return; const hover = program.pointerMode === "hover-dash" && e.pointerType === "mouse" && pointer === null; if (!hover && e.pointerId !== pointer) return; const p = painter.point(e.clientX, e.clientY); world.pointer(hover ? "hover" : "move", p.x, p.y, e.pointerType, p); });
  listen(canvas, "pointerup", e => { if (e.pointerId !== pointer) return; const p = painter.point(e.clientX, e.clientY); if (active && !paused && !hidden) world.pointer("up", p.x, p.y, e.pointerType, p); if (["hover-dash", "click-nav"].includes(program.pointerMode)) { const id = pointer; pointer = null; try { canvas.releasePointerCapture(id); } catch {} } else cancel(); notify(); });
  listen(canvas, "pointercancel", cancel); listen(canvas, "lostpointercapture", () => { if (pointer !== null) cancel(); }); listen(canvas, "blur", cancel);
  listen(canvas, "pointerleave", () => { if (program.pointerMode === "hover-dash" && pointer === null) cancel(); });
  listen(canvas, "keydown", e => { const key = e.key.length === 1 ? e.key.toLowerCase() : e.key; if (!active || paused || hidden || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Enter", "b", "r", ...(program.keyboardKeys ?? []), ...(["hover-dash", "click-nav"].includes(program.pointerMode) ? ["w", "a", "s", "d", "e"] : [])].includes(key)) return; e.preventDefault(); sound.unlock(); if (e.repeat) return; if (key === "b") input("doubleTap"); else if (key === "r") input("retry"); else if (!world.key(key, true) && [" ", "Enter"].includes(key)) input("tap"); notify(); });
  listen(canvas, "keyup", e => { if (active) world.key(e.key.length === 1 ? e.key.toLowerCase() : e.key, false); });
  function schedule() { cancel(); sound.stop(); cancelAnimationFrame(frame); if (active && !paused && !hidden) { last = performance.now(); frame = requestAnimationFrame(draw); } }
  listen(document, "visibilitychange", () => { hidden = document.hidden; schedule(); });
  return { start, stop, input, retry: () => input("retry"),
    setPaused(v) { paused = Boolean(v); schedule(); }, setMuted(v) { sound.setMuted(v); if (!v) sound.unlock(); }, setReduced(v) { reduced = Boolean(v); },
    setLevel(n) { if (!Number.isInteger(n) || n < 0 || n >= program.levels.length) return false; level = n; checkpoint = undefined; if (active) { cancel(); sound.stop(); world.setLevel(n); notify(); } return true; }, selectAmmo() { return false; },
    restoreCheckpoint(value) { if (!active) checkpoint = value; }, get checkpoint() { return world?.checkpoint?.(); },
    destroy() { stop(); listeners.forEach(off => off()); world?.destroy(); sound.destroy(); painter.destroy(); },
    get active() { return active; }, get program() { return program; }, get controls() { return controls(); }, get snapshot() { return world?.snapshot() ?? null; },
  };
};
const createOneButtonSound = function createOneButtonSound(id) {
  let context, muted = true, disposed = false; const voices = new Set();
  function stop() { for (const v of voices) { try { v.stop(); } catch {} } voices.clear(); }
  function play(type) {
    if (muted || disposed || !type.startsWith("precision-")) return; context ??= new AudioContext(); if (context.state !== "running") return;
    const t = context.currentTime, mechanical = ["press-run", "last-stop", "gravity-shift"].includes(id);
    function tone(f, end, length, delay = 0, wave = "sine", volume = .035) {
      if (voices.size >= 12) return; const o = context.createOscillator(), g = context.createGain(); o.type = wave;
      o.frequency.setValueAtTime(f, t + delay); o.frequency.exponentialRampToValueAtTime(end, t + delay + length);
      g.gain.setValueAtTime(0, t); g.gain.setValueAtTime(volume, t + delay); g.gain.exponentialRampToValueAtTime(.0001, t + delay + length);
      o.connect(g).connect(context.destination); voices.add(o); o.onended = () => { voices.delete(o); o.disconnect(); g.disconnect(); }; o.start(t + delay); o.stop(t + delay + length + .025);
    }
    if (type === "precision-stack") { tone(170, 75, .12, 0, "triangle"); tone(720, 340, .05, .01, "sine", .02); }
    if (type === "precision-stretch") tone(240, 680, .15, 0, "triangle", .015);
    if (type === "precision-bridge") { tone(140, 60, .15, 0, "triangle"); tone(420, 250, .09, .06); }
    if (type === "precision-pin") { tone(1400, 650, .055, 0, "sine", .024); tone(330, 110, .07, 0, "triangle", .02); }
    if (type === "precision-brake") tone(210, 65, .22, 0, "sawtooth", .012);
    if (type === "precision-park") { tone(620, 620, .06, 0, "square", .013); tone(930, 930, .14, .08); }
    if (type === "precision-flip") tone(id === "gravity-shift" ? 180 : 300, 840, .1, 0, "triangle", .025);
    if (type === "precision-gate") { tone(820, 820, .07, 0, "square", .015); tone(1240, 1240, .09, .06, "sine", .02); }
    if (type === "precision-delivery") { tone(940, 940, .15); tone(1410, 1410, .14, .07); }
    if (type === "precision-perfect") { tone(780, 780, .12); tone(1170, 1170, .18, .08); }
    if (type === "precision-fail") { tone(mechanical ? 90 : 280, 42, .24, 0, "triangle", .05); tone(180, 65, .13, .09, mechanical ? "sawtooth" : "sine", .013); }
    if (type === "precision-win") [523, 659, 784, 1046].forEach((f, i) => tone(f, f, .19, i * .09, "sine", .022));
  }
  return { play, stop, setMuted(v) { muted = Boolean(v); if (muted) stop(); }, unlock() { if (muted || disposed) return; context ??= new AudioContext(); context.resume().catch(() => {}); }, destroy() { if (disposed) return; disposed = true; stop(); context?.close().catch(() => {}); } };
};
const createOneButtonSession = function createOneButtonSession(scene, hooks, { checkpoint: saved, onEvent = () => {} } = {}) {
  const dt = 1000 / 120; let active = true, owner = null, accumulator = 0, deadTime = 0;
  Object.assign(scene, { level: 0, phase: "playing", time: 0, progress: 0, score: 0, best: 0, deaths: 0, attempt: 1, secondaryLabel: "", abilityAvailable: false });
  const emit = type => { if (active) onEvent({ type: `precision-${type}` }); };
  function sync() { scene.best = Math.max(scene.best, scene.progress); scene.score = scene.progress * 100 + (scene.perfect || 0) * 25; hooks.sync?.(); }
  function reset() { owner = null; accumulator = 0; deadTime = 0; Object.assign(scene, { phase: "playing", time: 0, progress: 0, score: 0, perfect: 0, failure: "" }); hooks.reset(); sync(); }
  function finish(won, reason = "") { if (!active || scene.phase !== "playing") return; scene.phase = won ? "won" : "lost"; scene.failure = reason; owner = null; hooks.cancel?.(); deadTime = 0; if (!won) scene.deaths = Math.min(99999, scene.deaths + 1); emit(won ? "win" : "fail"); sync(); }
  function retry() { if (!active) return false; scene.attempt = Math.min(99999, scene.attempt + 1); reset(); return true; }
  function down(source) {
    if (!active || owner !== null) return false;
    if (scene.phase !== "playing") return retry();
    if (hooks.press() === false) return false;
    owner = source; sync(); return true;
  }
  function up(source) { if (!active || owner !== source) return false; owner = null; hooks.release?.(); sync(); return true; }
  function cancel() { owner = null; hooks.cancel?.(); sync(); }
  reset();
  const integer = (n, lo, hi) => Number.isInteger(n) && n >= lo && n <= hi;
  if (saved?.version === 1 && saved.id === scene.id && integer(saved.best, 0, scene.goal) && integer(saved.deaths, 0, 99999) && integer(saved.attempt, 1, 99999) && hooks.restore?.(saved.data)) {
    scene.best = Math.max(saved.best, scene.progress); scene.deaths = saved.deaths; scene.attempt = saved.attempt; sync();
  }
  const api = { scene, effects: [],
    step(ms) { if (!active || !Number.isFinite(ms) || ms <= 0) return; accumulator += Math.min(50, ms); while (accumulator + 1e-8 >= dt) {
      accumulator -= dt; if (scene.phase === "won") continue;
      if (scene.phase === "lost") { deadTime += dt; if (deadTime >= 650) retry(); continue; }
      scene.time += dt; hooks.update(dt, { emit, finish }); sync();
    } },
    pointer(type, x, y) { if (!active || !Number.isFinite(x + y)) return false; const inside = x >= 0 && x <= 960 && y >= 0 && y <= 540;
      if (type === "down") return inside && down("pointer");
      if (type === "up") { if (!inside) { cancel(); return false; } return up("pointer"); } return false;
    },
    key(key, pressed) { if (!active || ![" ", "Enter"].includes(key)) return false; if (pressed) down("key"); else up("key"); return true; },
    primary() { if (!active) return false; if (hooks.tap) { const accepted = down("tap"); up("tap"); return accepted; } return owner === "tap" ? up("tap") : down("tap"); },
    secondary() { return false; }, cancel() { if (active) cancel(); }, retry, next: retry, setLevel(n) { return n === 0 && retry(); },
    checkpoint() { return { version: 1, id: scene.id, best: scene.best, deaths: scene.deaths, attempt: scene.attempt, data: hooks.save() }; },
    snapshot() { return { id: scene.id, active, level: 0, phase: scene.phase, mode: scene.mode, time: Math.round(scene.time), progress: scene.progress, goal: scene.goal, score: scene.score, best: scene.best, deaths: scene.deaths, attempt: scene.attempt, status: scene.status, primaryLabel: scene.primaryLabel, secondaryLabel: "", abilityAvailable: false, primaryEnabled: scene.phase !== "playing" || hooks.enabled?.() !== false }; },
    stop() { if (!active) return; cancel(); active = false; }, destroy() { api.stop(); hooks.destroy?.(); },
  };
  return api;
};
const createOneButtonCanvas = function createOneButtonCanvas(canvas) {
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
};
const Matter = null;
const STUDIO_PACKS = {"press-run": { create: function createPressWorld(options = {}) {
  const specs = [[300, 1700, 0], [560, 1540, 640], [820, 1480, 1030], [1080, 1630, 250], [1330, 1410, 780], [1580, 1350, 150], [1810, 1320, 970], [2050, 1260, 510]];
  const s = { id: "press-run", goal: 8, x: 105, holding: false, gates: [], camera: 0, wheel: 0, bestX: 105, spark: 0, ghost: null };
  function gateAt([x, period, offset], i) {
    const phase = ((s.time + offset) % period) / period;
    // Open dwell, visible warning, fast stroke, closed dwell, deliberate recovery.
    const bottom = phase < .5 ? 198 : phase < .61 ? 198 + (phase - .5) / .11 * 240 : phase < .78 ? 438 : 438 - (phase - .78) / .22 * 240;
    return { id: i, x, w: 84, bottom, phase, warning: phase >= .40 && phase < .61, safe: bottom < 399 };
  }
  function place() { s.gates = specs.map(gateAt); }
  const hooks = {
    reset() { s.x = 105; s.holding = false; s.camera = 0; s.wheel = 0; s.spark = 0; s.mode = "braked"; place(); },
    press() { s.holding = true; s.mode = "running"; return true; },
    release() { s.holding = false; s.mode = "braked"; }, cancel() { s.holding = false; if (s.phase === "playing") s.mode = "braked"; },
    update(dt, { emit, finish }) {
      place(); s.spark *= .93;
      if (s.holding) { s.x += dt * .32; s.wheel += dt * .025; }
      const p = s.gates[s.progress];
      if (p && Math.abs(s.x - p.x) < p.w / 2 + 17 && p.bottom > 399) {
        s.ghost = { x: s.x, gate: p.id + 1 }; s.spark = 1; s.mode = "flattened"; finish(false, `${p.id + 1} 号压机：差一点就过去了`); return;
      }
      if (p && s.x - 17 > p.x + p.w / 2) { s.progress++; emit("gate"); }
      s.camera += (Math.max(0, Math.min(1600, s.x - 255)) - s.camera) * .1;
      if (s.progress === s.goal && s.x >= 2180) { s.mode = "complete"; finish(true); }
    },
    sync() { s.primaryLabel = s.holding ? "刹车" : "前进"; s.status = s.phase === "won" ? "八道压机，完整下班。" : s.phase === "lost" ? s.failure : `${s.progress} / 8 · 最佳 ${s.best} · 压扁 ${s.deaths} 次`; },
    save() { return { progress: s.phase === "lost" ? 0 : s.progress, won: s.phase === "won" }; },
    restore(v) {
      if (!v || !Number.isInteger(v.progress) || v.progress < 0 || v.progress > 8 || typeof v.won !== "boolean" || v.won && v.progress !== 8) return false;
      s.progress = v.progress; s.x = v.progress ? specs[v.progress - 1][0] + 74 : 105; s.camera = Math.max(0, Math.min(1600, s.x - 255));
      if (v.won) { s.phase = "won"; s.mode = "complete"; s.x = 2180; } place(); return true;
    },
  };
  return createOneButtonSession(s, hooks, options);
}, paint: function paintPress() {}, createPainter: function createPressPainter(canvas) {
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
} }};
const program = GAME_CATALOG.find(g => g.id === "press-run");
return (canvas, callbacks = {}) => { const forwarded = { ...callbacks, onProgram: (_program, controls) => callbacks.onProgram?.(program, controls), onState: notice => callbacks.onState?.({ ...notice, program }) }; const studio = STUDIO_PACKS[program.id]; return studio.prepare ? createPreparedStudioRuntime(canvas, program, studio, forwarded) : createStudioRuntime(canvas, program, studio.create, studio.paint, forwarded, studio.createPainter); };
})();
