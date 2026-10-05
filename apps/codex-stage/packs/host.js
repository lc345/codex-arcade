import { PLAYABLE_CATALOG as GAME_CATALOG, createGamePicker } from "../collection/catalog.js";

// Only reviewed, locally built IDs can reach the loader. Packs receive no task data.
export function createPackHost(canvas, callbacks = {}, loadPack, checkpointStorage) {
  const picker = createGamePicker(Math.random, GAME_CATALOG), cache = new Map(), levels = new Map(), checkpoints = new Map();
  if (checkpointStorage === undefined) { try { checkpointStorage = globalThis.localStorage; } catch {} }
  const persistent = id => GAME_CATALOG.some(p => p.id === id && p.persistentCheckpoint);
  const storageKey = id => `agent-stage:checkpoint:v1:${id}`;
  function readSaved(id) { if (!persistent(id)) return; try { const raw = checkpointStorage?.getItem(storageKey(id)); if (typeof raw === "string" && raw.length <= 8192) return JSON.parse(raw); } catch {} }
  function remember(id, runtime) {
    if (!id || !runtime) return;
    try { const value = runtime.checkpoint; if (value === undefined) return; const raw = JSON.stringify(value); if (raw.length > 8192) return; checkpoints.set(id, JSON.parse(raw)); if (persistent(id)) checkpointStorage?.setItem(storageKey(id), raw); } catch {}
  }
  let child = null, childId = null, program = GAME_CATALOG[0], preferred = null, key = null, epoch = 0;
  let active = false, muted = true, reduced = false, paused = false, destroyed = false, phase = "idle";
  let mode = 'all';
  const pendingControls = () => ({ primary: { label: phase === "loading" ? "加载中" : "开始", hint: program.hint }, secondary: { label: "技能" } });
  function dispose() { const old = child, oldId = childId; child = null; childId = null; old?.stop(); remember(oldId, old); old?.destroy(); }
  function feedback(text) { callbacks.onFeedback?.({ text, score: 0, snapshot: api.snapshot, controls: api.controls }); }
  async function mount() {
    const ticket = ++epoch, selected = program;
    dispose(); phase = "loading"; callbacks.onProgram?.(selected, pendingControls()); feedback("正在加载游戏");
    try {
      let factory = cache.get(selected.id);
      if (!factory) factory = await loadPack(selected.id);
      if (destroyed || ticket !== epoch || !active) return;
      if (typeof factory !== "function") throw new Error("Invalid reviewed pack");
      cache.delete(selected.id); cache.set(selected.id, factory);
      while (cache.size > 2) cache.delete(cache.keys().next().value);
      const forwarded = Object.fromEntries(["onProgram", "onScore", "onFeedback", "onState"].map(name => [name, (...args) => {
        if (!destroyed && ticket === epoch && active) callbacks[name]?.(...args);
      }]));
      child = factory(canvas, forwarded); childId = selected.id;
      child.setMuted(muted); child.setReduced(reduced); child.setLevel(levels.get(selected.id) ?? 0);
      child.restoreCheckpoint?.(checkpoints.get(selected.id) ?? readSaved(selected.id));
      phase = "playing"; child.start(); child.setPaused(paused);
    } catch {
      if (ticket !== epoch || !active || destroyed) return;
      dispose(); phase = "error"; feedback("游戏加载失败，请重试或切换游戏");
    }
  }
  const api = {
    start(event = {}) {
      if (destroyed) return null;
      const nextKey = event.runId === "desktop-turn" ? event.spanId : event.runId;
      if (active && key === nextKey) return program;
      key = nextKey; active = true; program = picker.pick(nextKey, preferred, mode);
      void mount(); callbacks.onState?.({ type: "started", program }); return program;
    },
    stop() {
      if (!active) return;
      const score = child?.snapshot?.score ?? 0;
      active = false; ++epoch; child?.stop(); phase = "stopped"; remember(childId, child);
      callbacks.onState?.({ type: "stopped", program, score });
    },
    input(gesture) { return active && !paused && phase === "playing" ? child?.input(gesture) ?? false : false; },
    tap() { return api.input("tap"); },
    retry() { if (!active || paused) return false; if (phase === "error") { void mount(); return true; } return child?.retry() ?? false; },
    chooseProgram(id) {
      const selected = GAME_CATALOG.find(p => p.id === id); if (!selected || destroyed) return null;
      preferred = id;
      if (program.id !== id) { program = selected; if (active) void mount(); else { ++epoch; dispose(); callbacks.onProgram?.(program, pendingControls()); } }
      return program;
    },
    cycleGame() { return api.chooseProgram(GAME_CATALOG[(GAME_CATALOG.findIndex(p => p.id === program.id) + 1) % GAME_CATALOG.length].id); },
    nextGame() {
      if (!active || paused || destroyed) return null;
      preferred = null;
      let selected = picker.pick(Symbol("selection"), null, mode);
      if (selected.id === program.id) selected = picker.pick(Symbol("selection"), null, mode);
      program = selected; void mount(); return program;
    },
    cycleProgram() { return api.cycleGame(); }, setMode(value) { mode=value==='curated'?'curated':'all';preferred = ['all','random','curated'].includes(value) ? null : program.id; }, setMedia() {},
    setMuted(value) { muted = Boolean(value); child?.setMuted(muted); },
    setReduced(value) { reduced = Boolean(value); child?.setReduced(reduced); },
    setPaused(value) { paused = Boolean(value); child?.setPaused(paused); },
    setLevel(index) { if (!Number.isInteger(index) || index < 0 || index >= program.levels.length) return false; levels.set(program.id, index); return child?.setLevel(index) ?? true; },
    selectAmmo(kind) { return active && !paused ? child?.selectAmmo(kind) ?? false : false; },
    destroy() { api.stop(); destroyed = true; ++epoch; dispose(); cache.clear(); levels.clear(); checkpoints.clear(); globalThis.removeEventListener?.("pagehide", onPageHide); },
    get active() { return active; }, get paused() { return paused; }, get interactive() { return true; }, get program() { return program; }, get random() { return preferred === null; }, get mode(){return preferred===null?mode:'game';},
    get controls() { return child?.controls ?? pendingControls(); },
    get snapshot() { return child?.snapshot ?? { id: program.id, phase, active, level: levels.get(program.id) ?? 0, score: 0, time: 0, primaryEnabled: false, abilityAvailable: false }; },
    get diagnostics() { return { cached: cache.size, activeInstances: child && active ? 1 : 0, phase }; },
  };
  const onPageHide = () => api.stop(); globalThis.addEventListener?.("pagehide", onPageHide);
  return api;
}
