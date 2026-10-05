// Generated first-party game pack. Apache-2.0; dependencies retain their license notices.
export default (() => {
const GAME_CATALOG = [{"id":"bridge-span","title":"桥就这么长","english":"MEASURE ONCE","category":"spatial-routing","artStyle":"field-survey-cutout","color":"#eb684e","genre":"按住 · 估长度","hint":"按住伸长桥，松手放下。桥头必须落在下一座桥墩上，多一点少一点都不行。","replayLabel":"再过一次河","levels":["十段刚好"],"kind":"game","edition":"studio","release":"preview","collection":"one-button-2","presentation":"panorama","soundPalette":"one-button","pointerMode":"click-nav","persistentCheckpoint":true,"hideLevels":true,"cover":"/apps/codex-stage/assets/studio/bridge-span.png","curated":false}];
const STUDIO_ART = {"bridge-span":""};
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
const STUDIO_PACKS = {"bridge-span": { create: function createBridgeWorld(options = {}) {
  const spans = [[130, 86], [215, 70], [108, 56], [255, 48], [170, 42], [278, 36], [145, 32], [239, 29], [189, 25], [268, 23]];
  const platforms = [{ x: 96, w: 104, y: 397 }];
  for (const [gap, w] of spans) { const p = platforms.at(-1); platforms.push({ x: p.x + p.w + gap, w, y: 397 }); }
  const s = { id: "bridge-span", goal: 10, platforms, bridges: [], player: {}, camera: 0, length: 0, turn: 0, perfect: 0, lastMiss: "", pending: null };
  function setup() { const p = platforms[s.progress]; s.anchor = p.x + p.w; s.target = platforms[Math.min(10, s.progress + 1)]; s.player = { x: s.anchor - 14, y: 381 }; s.mode = "ready"; s.length = 0; s.turn = 0; s.pending = null; }
  const hooks = {
    reset() { s.bridges = []; s.camera = 0; setup(); },
    press() { if (s.mode !== "ready") return false; s.mode = "growing"; s.pending = "stretch"; return true; },
    release() { if (s.mode === "growing") { s.mode = "lowering"; s.turn = 0; s.pending = "bridge"; } },
    cancel() { if (s.mode === "growing") { s.length = 0; s.mode = "ready"; } s.pending = null; }, enabled: () => ["ready", "growing"].includes(s.mode),
    update(dt, { emit, finish }) {
      if (s.pending) { emit(s.pending); s.pending = null; }
      s.camera += (Math.max(0, s.player.x - 220) - s.camera) * .07;
      if (s.mode === "growing") s.length = Math.min(390, s.length + dt * .18);
      if (s.mode === "lowering") { s.turn = Math.min(1, s.turn + dt / 280); if (s.turn === 1) {
        const tip = s.anchor + s.length; s.valid = tip >= s.target.x + 2 && tip <= s.target.x + s.target.w - 2;
        s.walkEnd = s.valid ? s.target.x + s.target.w - 14 : tip; s.mode = "walking";
      } }
      if (s.mode === "walking") {
        s.player.x = Math.min(s.walkEnd, s.player.x + dt * .42);
        if (s.player.x === s.walkEnd) {
          if (!s.valid) { const tip = s.anchor + s.length, short = tip < s.target.x + 2, distance = Math.max(1, Math.round(short ? s.target.x + 2 - tip : tip - s.target.x - s.target.w + 2)); s.lastMiss = `${short ? "短" : "长"}了 ${distance} px`; s.mode = "fall"; finish(false, s.lastMiss); return; }
          if (Math.abs(s.anchor + s.length - s.target.x - s.target.w / 2) < 4) s.perfect++;
          s.bridges.push({ x: s.anchor, length: s.length }); s.progress++; emit("delivery");
          if (s.progress === 10) { s.mode = "complete"; finish(true); } else setup();
        }
      }
    },
    sync() { s.primaryLabel = s.mode === "growing" ? "落桥" : "伸长"; s.status = s.phase === "lost" ? s.failure : s.phase === "won" ? "十段路，刚刚好。" : `${s.progress} / 10 · 最佳 ${s.best} · 落水 ${s.deaths} 次`; },
    save() { return { progress: s.phase === "lost" ? 0 : s.progress, perfect: s.phase === "lost" ? 0 : s.perfect, lengths: s.phase === "lost" ? [] : s.bridges.map(p => p.length) }; },
    restore(v) {
      if (!v || !Number.isInteger(v.progress) || v.progress < 0 || v.progress > 10 || !Number.isInteger(v.perfect) || v.perfect < 0 || v.perfect > v.progress || !Array.isArray(v.lengths) || v.lengths.length !== v.progress) return false;
      for (let i = 0; i < v.progress; i++) { const n = v.lengths[i], tip = platforms[i].x + platforms[i].w + n, t = platforms[i + 1]; if (!Number.isFinite(n) || n < 0 || n > 390 || tip < t.x + 2 || tip > t.x + t.w - 2) return false; }
      s.progress = v.progress; s.perfect = v.perfect; s.bridges = v.lengths.map((length, i) => ({ x: platforms[i].x + platforms[i].w, length })); setup(); s.camera = Math.max(0, s.player.x - 220);
      if (s.progress === 10) { s.phase = "won"; s.mode = "complete"; } return true;
    },
  };
  return createOneButtonSession(s, hooks, options);
}, paint: function paintBridge() {}, createPainter: function createBridgePainter(canvas) {
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
} }};
const program = GAME_CATALOG.find(g => g.id === "bridge-span");
return (canvas, callbacks = {}) => { const forwarded = { ...callbacks, onProgram: (_program, controls) => callbacks.onProgram?.(program, controls), onState: notice => callbacks.onState?.({ ...notice, program }) }; const studio = STUDIO_PACKS[program.id]; return studio.prepare ? createPreparedStudioRuntime(canvas, program, studio, forwarded) : createStudioRuntime(canvas, program, studio.create, studio.paint, forwarded, studio.createPainter); };
})();
