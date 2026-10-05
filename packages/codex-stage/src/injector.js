import { createAgentArcadeSource } from "../../../apps/codex-stage/arcade.js";
import { createPackHost } from "../../../apps/codex-stage/packs/host.js";
import { GAME_CATALOG, createGamePicker } from "../../../apps/codex-stage/collection/catalog.js";
import { readFileSync } from "node:fs";

const icon = name => readFileSync(new URL(`../../../apps/codex-stage/assets/icons/${name}.svg`, import.meta.url), "utf8");

export async function ensureCodexStageDock(target, evaluate, source) {
  const installed = await evaluate(target, 'Boolean(window.__AGENT_STAGE_CODEX_DOCK__?.version === "0.11.0" && document.contains(window.__AGENT_STAGE_CODEX_DOCK__.host))');
  if (installed) return { reused: true };
  return evaluate(target, source);
}

const dockMarkup = `
  <style>
    :host { all: initial; } * { box-sizing: border-box; letter-spacing: 0; }
    .dock { width: min(590px, calc(100vw - 32px)); font-family: ui-sans-serif, system-ui, sans-serif; color: #23453e; }
    .dock.large { width: min(960px, calc(100vw - 32px), calc((100dvh - 165px) * var(--stage-ratio, 1.777778))); }
    .panel { overflow: hidden; border: 1px solid #a5c0b1; border-radius: 8px; background: #f3f8f2; box-shadow: 0 12px 40px #0004; }
    .bar { min-height: 39px; display: flex; align-items: center; gap: 6px; padding: 5px 9px 5px 13px; }
    .brand { flex: 1; font-size: 12px; font-weight: 800; white-space: nowrap; }
    .brand small { font-size: 9px; font-weight: 500; color: #729082; margin-left: 7px; }
    button,select { font: 600 11px ui-sans-serif, system-ui; border: 1px solid #c4d7ca; border-radius: 5px; min-height: 28px; color: #335b4d; background: transparent; cursor: pointer; padding: 0 8px; }
    button:hover,button[aria-pressed=true] { background: #e0ede2; } button:disabled { opacity: .4; cursor: default; }
    button:focus-visible,select:focus-visible { outline: 2px solid #238988; outline-offset: 2px; }
    .icon { width: 29px; min-width:29px; padding: 5px; border-color: transparent; display: grid; place-items: center; } .icon svg { width: 18px; height: 18px; }
    select { width: 92px; min-width: 0; font-weight: 500; } [hidden] { display: none !important; }
    .selection { display: flex; align-items: center; justify-content: space-between; padding: 0 9px 7px; gap: 8px; } [data-game] { width: 160px; }
    .stage { aspect-ratio: var(--stage-ratio, 1.777778); background: #92cdd9; } canvas { display: block; width: 100%; height: 100%; touch-action: none; cursor: crosshair; }
    canvas:focus-visible { outline: 2px solid #fff; outline-offset: -3px; }
    .footer { display: flex; align-items: center; gap: 5px; min-height: 44px; padding: 7px 9px; }
    .footer small { flex: 1; min-width: 0; font-size: 10px; color: #749080; }
    .primary { background: #2d6653; color: white; border-color: #2d6653; min-width: 54px; }
    .primary:hover { background: #1e4c3c; }
    .mini { display: none; width: 36px; height: 36px; background: #eff7ef; border-radius: 8px; box-shadow: 0 4px 18px #0003; }
    .collapsed .panel { display: none; } .collapsed .mini { display: block; }
    .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
    @media(max-width:480px) { .brand small { display: none; } .footer small { display: none; } .footer { justify-content: space-between; } }
  </style>
  <div class="dock collapsed" data-dock>
    <button class="mini" data-action="expand" title="打开游戏" aria-label="打开 Agent Stage">A</button>
    <section class="panel" aria-label="Agent Stage 游戏">
      <header class="bar"><span class="brand"><span data-title>Agent Stage</span><small data-catalog-count>ARCADE</small></span>
        <button class="icon" data-action="retry" title="重试" aria-label="重试">${icon("rotate-ccw")}</button>
        <button class="icon" data-action="mute" title="开关声音" aria-label="静音" aria-pressed="true">${icon("volume-x")}</button>
        <button class="icon" data-action="reduce" title="减少动效" aria-label="减少动效" aria-pressed="false">${icon("sparkles")}</button>
        <button class="icon" data-action="resize" title="放大游戏" aria-label="放大游戏" aria-pressed="false">${icon("maximize-2")}</button>
        <button class="icon" data-action="collapse" title="折叠游戏" aria-label="折叠游戏">${icon("minimize-2")}</button>
      </header>
      <div class="selection"><select data-game aria-label="选择游戏"><option value="random">随机轮换</option><option value="curated">精选轮换 · 7 款</option></select><select data-level aria-label="选择关卡"></select></div>
      <div class="stage"><canvas tabindex="0" aria-label="Agent Stage 游戏画布"></canvas></div>
      <div class="footer"><select data-ammo aria-label="游戏选项" hidden></select><small data-status></small><button data-action="boost" title="辅助操作">技能</button><button class="primary" data-action="tap">开始</button></div>
      <div data-live class="sr" aria-live="polite"></div>
    </section>
  </div>`;

export function createCodexStageInjectorSource({ lazy = false } = {}) {
  // Covers, art and engine metadata belong to the selected pack, not the startup relay.
  const dockCatalog = GAME_CATALOG.map(({ id, title, hint, levels, release, hideLevels, persistentCheckpoint, curated, category, canvasHeight }) => ({ id, title, hint, levels, release, hideLevels, persistentCheckpoint, curated, category, canvasHeight }));
  const keys = ['id', 'title', 'hint', 'levels', 'release', 'hideLevels', 'persistentCheckpoint', 'curated', 'category', 'canvasHeight'];
  // Positional rows avoid repeating metadata keys as the gallery grows; inflate at startup.
  const rows = dockCatalog.map(game => keys.map(key => game[key] ?? null));
  const runtime = lazy ? `const GAME_CATALOG = ${JSON.stringify(rows)}.map(row=>Object.fromEntries(${JSON.stringify(keys)}.flatMap((key,i)=>row[i]===null?[]:[[key,row[i]]]))); const createGamePicker = ${createGamePicker.toString()}; const createPackHost = ${createPackHost.toString()};` : createAgentArcadeSource();
  return `(() => {
    const stateKey = "__AGENT_STAGE_CODEX_DOCK__";
    const prior = window[stateKey];
    if (prior?.host && document.contains(prior.host) && prior.version === "0.11.0") return { installed: true, reused: true, version: "0.11.0" };
    if (prior && typeof prior.cleanup === "function") prior.cleanup();
    ${runtime}
    let packSerial = 0;
    const packRequests = new Map();
    function loadPack(id) {
      return new Promise((resolve, reject) => {
        const request = ++packSerial;
        const timeout = setTimeout(() => { packRequests.delete(request); reject(new Error("Game pack relay timed out")); }, 12000);
        packRequests.set(request, { id, resolve, reject, timeout });
      });
    }
    function pendingPacks() { return Array.from(packRequests, ([request, p]) => ({ request, id: p.id })); }
    function acceptPack(request, id, factory) {
      const p = packRequests.get(request);
      if (!p || p.id !== id || typeof factory !== "function") return false;
      clearTimeout(p.timeout); packRequests.delete(request); p.resolve(factory); return true;
    }
    const host = document.createElement("agent-stage-dock"); host.id = "agent-stage-codex-dock";
    host.style.cssText = "all:initial;position:fixed;right:16px;bottom:16px;z-index:2147483000;display:block;pointer-events:auto;";
    const shadow = host.attachShadow({ mode: "open" }); shadow.innerHTML = ${JSON.stringify(lazy ? dockMarkup : dockMarkup.replace('<option value="curated">精选轮换 · 7 款</option>',''))}; document.body.append(host);
    const find = s => shadow.querySelector(s), dock = find("[data-dock]"), canvas = find("canvas");
    if (!(canvas.getContext("2d") instanceof CanvasRenderingContext2D)) throw new Error("Canvas 2D unavailable");
    const state = { runId: null, spanId: null, muted: true, reduced: matchMedia("(prefers-reduced-motion: reduce)").matches, collapsed: false, large: false };
    const desktop = { pending: null, observed: false };
    const previews = GAME_CATALOG.filter(game => game.release === "preview").length;
    find("[data-catalog-count]").textContent = "ARCADE / " + (GAME_CATALOG.length - previews) + " + " + previews;
    for (const game of GAME_CATALOG) { const option = document.createElement("option"); option.value = game.id; option.textContent = game.title; find("[data-game]").append(option); }
    function showProgram(program) {
      dock.style.setProperty('--stage-ratio',String(960/(program.canvasHeight??540)));
      find("[data-title]").textContent = program.title; canvas.setAttribute("aria-label", program.title + "。" + program.hint);
      find("[data-level]").replaceChildren();
      find("[data-level]").disabled = false;
      find("[data-level]").hidden = Boolean(program.hideLevels);
      for (const [i, name] of program.levels.entries()) { const option = document.createElement("option"); option.value = i; option.textContent = (i + 1) + " " + name; find("[data-level]").append(option); }
      find("[data-game]").value = arcade.random ? (arcade.mode??'random') : program.id;
      find("[data-ammo]").hidden = true;
    }
    function update() {
      dock.classList.toggle("collapsed", state.collapsed || !arcade.active);
      dock.classList.toggle("large", state.large);
      find('[data-action="resize"]').setAttribute("aria-pressed", String(state.large));
      find('[data-action="resize"]').setAttribute("aria-label", state.large ? "缩小游戏" : "放大游戏");
      find('[data-action="resize"]').title = state.large ? "缩小游戏" : "放大游戏";
      find('[data-action="mute"]').setAttribute("aria-pressed", String(state.muted));
      find('[data-action="reduce"]').setAttribute("aria-pressed", String(state.reduced));
      const s = arcade.snapshot; if (!s) return;
      find("[data-level]").value = s.level; find("[data-ammo]").value = s.ammo; find("[data-ammo]").disabled = !arcade.active || s.phase !== "ready";
      find('[data-action="tap"]').textContent = arcade.controls.primary.label;
      find('[data-action="tap"]').hidden = Boolean(arcade.controls.primary.hidden) && arcade.active;
      find('[data-action="tap"]').title = arcade.controls.primary.hint;
      find('[data-action="tap"]').disabled = !arcade.active || s.phase === "flight" || s.phase === "aiming" || (s.primaryEnabled === false && !["won", "lost"].includes(s.phase));
      find('[data-action="boost"]').textContent = arcade.controls.secondary?.label ?? "技能";
      find('[data-action="boost"]').hidden = arcade.controls.secondary?.label === "";
      find('[data-action="boost"]').title = arcade.controls.secondary?.hint ?? "";
      find('[data-action="boost"]').disabled = !arcade.active || !s.abilityAvailable;
    }
    const arcade = ${lazy ? "createPackHost" : "createAgentArcade"}(canvas, {
      onProgram: showProgram,
      onFeedback: notice => { find("[data-status]").textContent = notice.text; find("[data-live]").textContent = notice.text; update(); },
      onScore: score => { find("[data-status]").textContent = score + " 分"; },
      onState: notice => { if (notice.type === "stopped") { state.runId = state.spanId = null; find("[data-live]").textContent = "任务完成，游戏已停止"; } update(); },
    }, loadPack);
    showProgram(arcade.program);
    arcade.setReduced(state.reduced);
    function start(event) {
      if (state.runId === event.runId && state.spanId === event.spanId && arcade.active) return;
      state.runId = event.runId; state.spanId = event.spanId; state.collapsed = false;
      dock.classList.remove("collapsed"); arcade.start(event); update();
    }
    function stop() { arcade.stop(); state.runId = state.spanId = null; update(); }
    function dispatch(event) {
      if (!event || typeof event.type !== "string" || !event.operation) return;
      if (event.type === "turn.started") {
        if (state.runId === "desktop-turn" && arcade.active) { state.runId = event.runId; state.spanId = event.spanId; return; }
        start(event);
      }
      if (event.type === "turn.completed" && (!state.runId || state.runId === event.runId || state.runId === "desktop-turn")) { desktop.observed = false; stop(); }
    }
    function input(event) { if (!["tap", "doubleTap", "button.up"].includes(event?.type)) return false; return arcade.input(event.type === "button.up" ? "tap" : event.type); }
    shadow.addEventListener("click", event => {
      const action = event.target?.closest?.("[data-action]")?.dataset.action;
      if (action === "tap") arcade.input("tap");
      if (action === "boost") arcade.input("doubleTap");
      if (action === "retry") arcade.retry();
      if (action === "mute") { state.muted = !state.muted; arcade.setMuted(state.muted); }
      if (action === "reduce") { state.reduced = !state.reduced; arcade.setReduced(state.reduced); }
      if (action === "resize") { state.large = !state.large; canvas.focus({ preventScroll: true }); }
      if (action === "collapse") { state.collapsed = true; arcade.setPaused(true); }
      if (action === "expand") { state.collapsed = false; arcade.setPaused(false); }
      update();
    });
    find("[data-level]").addEventListener("change", event => { arcade.setLevel(Number(event.target.value)); update(); });
    find("[data-ammo]").addEventListener("change", event => { arcade.selectAmmo(event.target.value); update(); });
    find("[data-game]").addEventListener("change", event => { if (['random','curated'].includes(event.target.value)) arcade.setMode(event.target.value); else arcade.chooseProgram(event.target.value); update(); });
    // Observe only a visible run-state control, never prompt, transcript or tool content.
    function codexIsRunning() {
      return Array.from(document.querySelectorAll('button[aria-label="停止"],button[aria-label="Stop"]')).some(control => {
        if (host.contains(control)) return false;
        const b = control.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(control).visibility !== "hidden";
      });
    }
    function syncDesktopTurn() {
      if (codexIsRunning()) {
        desktop.observed = true;
        if (!state.runId && !desktop.pending) desktop.pending = setTimeout(() => {
          desktop.pending = null; if (state.runId || !codexIsRunning()) return;
          start({ type: "turn.started", runId: "desktop-turn", spanId: "desktop_" + Date.now().toString(36), operation: { family: "turn" } });
        }, 240);
      } else {
        if (desktop.pending) { clearTimeout(desktop.pending); desktop.pending = null; }
        if (desktop.observed && state.runId) { desktop.observed = false; stop(); }
      }
    }
    const desktopTurnObserver = new MutationObserver(syncDesktopTurn);
    desktopTurnObserver.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-label", "disabled"] });
    syncDesktopTurn(); update();
    const observer = new MutationObserver(() => { if (!document.contains(host) && !window[stateKey]?.disabled) document.body?.append(host); });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    const cleanup = () => { if (desktop.pending) clearTimeout(desktop.pending); desktopTurnObserver.disconnect(); observer.disconnect(); arcade.destroy(); for (const p of packRequests.values()) { clearTimeout(p.timeout); p.reject(new Error("Dock removed")); } packRequests.clear(); host.remove(); window[stateKey] = { disabled: true }; };
    window[stateKey] = { host, cleanup, dispatch, input, pendingPacks, acceptPack, setMedia() {}, version: "0.11.0", snapshot: () => arcade.snapshot, program: () => arcade.program.id };
    return { installed: true, version: "0.11.0" };
  })()`;
}
