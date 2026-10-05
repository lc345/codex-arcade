export function createStudioKernel(id, { level = 0, seed = 1, onEvent = () => {} } = {}) {
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
}
