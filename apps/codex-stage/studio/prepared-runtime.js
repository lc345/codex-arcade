import { createStudioRuntime } from "./runtime.js";

// WASM preparation is local and may outlive a task. Only the current start may mount.
export function createPreparedStudioRuntime(canvas, program, studio, callbacks = {}, makeRuntime = createStudioRuntime) {
  let child = null, active = false, disposed = false, generation = 0, phase = "idle", level = 0, checkpoint;
  let muted = true, reduced = false, paused = false;
  const controls = () => ({ primary: { label: phase === "loading" ? "加载中" : "重试", hint: program.hint }, secondary: { label: "换件", hint: program.hint } });
  function notice(text) { callbacks.onFeedback?.({ text, score: 0, snapshot: api.snapshot, controls: api.controls }); }
  function drawPending(text) {
    const ctx = canvas.getContext?.("2d"); if (!ctx) return;
    const r = canvas.getBoundingClientRect(); canvas.width = Math.max(1, Math.round(r.width || 960)); canvas.height = Math.round(canvas.width * 9 / 16);
    ctx.fillStyle = "#162d36"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = "#e8eee8"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "16px -apple-system, sans-serif"; ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }
  function prepare() {
    const ticket = ++generation; phase = "loading"; callbacks.onProgram?.(program, controls()); notice("正在加载本地物理引擎"); drawPending("正在加载本地物理引擎");
    Promise.resolve().then(() => studio.prepare()).then(() => {
      if (disposed || !active || ticket !== generation) return;
      const forwarded = Object.fromEntries(["onProgram", "onScore", "onFeedback", "onState"].map(name => [name, (...args) => { if (active && !disposed && ticket === generation) callbacks[name]?.(...args); }]));
      child = makeRuntime(canvas, program, studio.create, studio.paint, forwarded, studio.createPainter);
      child.setMuted(muted); child.setReduced(reduced); child.setLevel(level); child.restoreCheckpoint?.(checkpoint); child.setPaused(paused);
      phase = "playing"; child.start();
    }).catch(() => {
      if (disposed || !active || ticket !== generation) return;
      child?.destroy(); child = null; phase = "error"; notice("物理引擎加载失败，请重试或切换游戏"); drawPending("物理引擎加载失败");
    });
  }
  const api = {
    start() { if (disposed || active) return program; active = true; child?.destroy(); child = null; prepare(); return program; },
    stop() { if (!active) return; const score = child?.snapshot?.score ?? 0; active = false; ++generation; child?.stop(); phase = "stopped"; if (!child) drawPending("任务已完成"); callbacks.onState?.({ type: "stopped", program, score }); },
    input(gesture) { return active && !paused && phase === "playing" ? child?.input(gesture) ?? false : false; },
    retry() { if (!active || paused) return false; if (phase === "error") { prepare(); return true; } return child?.retry() ?? false; },
    setMuted(value) { muted = Boolean(value); child?.setMuted(muted); }, setReduced(value) { reduced = Boolean(value); child?.setReduced(reduced); },
    setPaused(value) { paused = Boolean(value); child?.setPaused(paused); },
    setLevel(n) { if (!Number.isInteger(n) || n < 0 || n >= program.levels.length) return false; level = n; checkpoint = undefined; return child?.setLevel(n) ?? true; },
    restoreCheckpoint(value) { if (!active) { checkpoint = value; child?.restoreCheckpoint?.(value); } },
    selectAmmo() { return false; }, destroy() { if (disposed) return; api.stop(); disposed = true; ++generation; child?.destroy(); child = null; },
    get active() { return active; }, get program() { return program; }, get controls() { return child?.controls ?? controls(); },
    get checkpoint() { return child?.checkpoint ?? checkpoint; },
    get snapshot() { return child?.snapshot ?? { id: program.id, phase, active, level, score: 0, time: 0, primaryEnabled: false, abilityAvailable: false }; },
  };
  return api;
}
