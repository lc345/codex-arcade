import { STANDALONE_CATALOG } from "../collection/standalone-catalog.js";

// This adapter hosts only the five shipped games, never a supplied URL or script.
export function createStandalonePack(canvas, requested, callbacks = {}) {
  const program = STANDALONE_CATALOG.find(game => game.id === requested.id);
  if (!program) throw new Error("Unknown local game");
  let frame, timer, observer, active = false, disposed = false, paused = false;
  let muted = true, reduced = false, phase = "idle", signature = "";
  const cleanup = [];
  const pilot = () => frame?.contentWindow?.[program.pilot];
  const doc = () => frame?.contentDocument;
  const controls = () => ({ primary: { label: "开始", hint: program.hint }, secondary: { label: "" } });
  function snapshot() {
    const value = pilot()?.snapshot?.() ?? {};
    return { ...value, id: program.id, phase: active ? (value.phase ?? phase) : "stopped", level: value.stage ?? value.round ?? 0, score: value.score ?? 0, primaryEnabled: active && phase === "playing" };
  }
  function settings() {
    for (const [id, value] of [["mute", muted], [program.id === "godot-junk" ? "reduced" : "motion", reduced]]) {
      const button = doc()?.getElementById(id);
      if (button && button.getAttribute("aria-pressed") !== String(value)) button.click();
    }
  }
  function escapeFrom(childWindow) {
    const childDocument = childWindow.document;
    for (const [event, type] of [["pointerdown", "down"], ["pointerup", "up"], ["pointercancel", "up"], ["pointermove", "move"], ["keydown", "down"], ["keyup", "up"], ["blur", "clear"]]) {
      const target = event === "blur" ? childWindow : childDocument;
      const input = e => canvas.ownerDocument.defaultView.dispatchEvent(new CustomEvent("agent-stage-game-input", { detail: { type, id: e.pointerId !== undefined ? `embedded:pointer:${e.pointerId}` : `embedded:key:${e.code}` } }));
      target.addEventListener(event, input, { capture: true, passive: true });
      cleanup.push(() => target.removeEventListener(event, input, true));
    }
    const key = event => {
      if (event.key !== "Escape" || event.repeat) return;
      event.preventDefault(); event.stopImmediatePropagation();
      canvas.ownerDocument.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    };
    childDocument.addEventListener("keydown", key, true);
    cleanup.push(() => childDocument.removeEventListener("keydown", key, true));
    for (const child of childDocument.querySelectorAll("iframe")) {
      const loaded = () => { if (active) escapeFrom(child.contentWindow); };
      child.addEventListener("load", loaded, { once: true });
      cleanup.push(() => child.removeEventListener("load", loaded));
      if (child.contentDocument?.readyState === "complete") loaded();
    }
  }
  function clearView() {
    clearInterval(timer); timer = null; observer?.disconnect(); observer = null;
    cleanup.splice(0).forEach(off => off());
    try { pilot()?.stop(); pilot()?.destroy(); } finally { frame?.remove(); frame = null; canvas.hidden = false; }
  }
  function start() {
    if (disposed || active) return;
    active = true; phase = "loading"; signature = "";
    frame = document.createElement("iframe");
    frame.className = "standalone-game"; frame.title = program.title;
    frame.allow = "autoplay"; frame.referrerPolicy = "no-referrer";
    // No hook token, run ID, prompt or original task data enters this page.
    frame.src = program.entry;
    Object.assign(frame.style, { position: "absolute", left: "0", top: "0", width: "960px", height: `${program.canvasHeight}px`, border: "0", transformOrigin: "0 0", visibility: "hidden" });
    const resize = () => {
      if (!frame) return;
      const scale = canvas.parentElement.clientWidth / 960;
      frame.style.transform = `scale(${scale})`;
      if (doc()?.documentElement) doc().documentElement.dataset.stageRenderScale = String(Math.min(1, scale));
    };
    canvas.hidden = true; canvas.parentElement.append(frame); resize();
    observer = new ResizeObserver(resize); observer.observe(canvas.parentElement);
    const current = frame;
    frame.addEventListener("load", () => {
      if (!active || frame !== current) return;
      const document = doc();
      document.documentElement.classList.add("stage-embedded");
      document.documentElement.dataset.game = program.id;
      const style = document.createElement("link"); style.rel = "stylesheet"; style.href = "/apps/codex-stage/packs/standalone-embed.css";
      style.onload = () => { if (active && frame === current) { frame.style.visibility = "visible"; resize(); } };
      document.head.append(style);
      if (program.id === "godot-junk") document.getElementById("stage").append(document.getElementById("next"));
      escapeFrom(current.contentWindow);
      settings();
    }, { once: true });
    const began = performance.now();
    timer = setInterval(() => {
      if (!active || frame !== current) return;
      const state = pilot()?.state?.();
      if (state === "playing" || state?.active) {
        if (phase !== "playing") { phase = "playing"; settings(); pilot()?.pause(paused); }
        const s = snapshot(), next = [s.phase, s.level, s.score].join(":");
        if (signature !== next) { signature = next; callbacks.onFeedback?.({ text: program.title, snapshot: s }); }
      } else if (state === "error" || performance.now() - began > 45000 && phase === "loading") {
        phase = "error"; clearView(); callbacks.onFeedback?.({ text: "游戏加载失败，请重试" });
      }
    }, 200);
    callbacks.onState?.({ type: "started", program });
  }
  function stop() {
    if (!active) return;
    active = false; phase = "stopped"; clearView();
    callbacks.onState?.({ type: "stopped", program, score: 0 });
  }
  return {
    start, stop, destroy() { stop(); disposed = true; },
    setMuted(value) { muted = Boolean(value); settings(); }, setReduced(value) { reduced = Boolean(value); settings(); },
    setPaused(value) { paused = Boolean(value); pilot()?.pause(paused); }, setLevel() { return false; },
    retry() { if (!active || paused) return false; if (phase === "error") { stop(); start(); return true; } doc()?.getElementById("retry")?.click(); return true; },
    input(gesture) {
      if (!active || paused || phase !== "playing" || gesture !== "tap") return false;
      const id = { "cart-downhill": "drive", "reel-break": "continue", "last-beacon": "enter", "grab-go": "continue", "godot-junk": "next" }[program.id];
      const button = doc()?.getElementById(id);
      if (!button || button.getBoundingClientRect().height === 0) return false;
      button.click(); return true;
    },
    get snapshot() { return snapshot(); }, get controls() { return controls(); }, get active() { return active; }, get program() { return program; },
    get diagnostics() { return { phase, rendering: Boolean(active && frame), frames: frame ? 1 : 0 }; },
  };
}
