import { createStudioPainter } from "./painter.js";
import { createSlingSound } from "./base-sound.js";
import { createContrastSound } from "./contrast-sound.js";
import { createKitchenSound } from "./kitchen-sound.js";
import { createYesterdaySound } from "./yesterday-sound.js";
import { createRuleSound } from "./rule-sound.js";
import { createStuntSound } from "./stunt-sound.js";
import { createShadowSound } from "./shadow-sound.js";
import { createDiceSound } from "./dice-sound.js";
import { createApplianceSound } from "./appliance-sound.js";
import { createToastSound } from "./toast-sound.js";
import { createOneButtonSound } from "./one-button-sound.js";
import { createVarietySound } from "./variety-sound.js";
import { createMagnetSound } from "./magnet-sound.js";

export function createStudioRuntime(canvas, program, createWorld, paintWorld, callbacks = {}, makePainter = createStudioPainter) {
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
}
