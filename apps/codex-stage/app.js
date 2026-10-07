import { createPackHost } from "./packs/host.js";
import { loadReviewedPack } from "./packs/loader.js";
import { PLAYABLE_CATALOG as GAME_CATALOG } from "./collection/catalog.js";
import { createLiveTurns } from "./live-turns.js";
import { createGameRotation } from "./rotation.js";
import { bindHostVisibility } from "./host-visibility.js";
import { createFrameProbe } from "./frame-probe.js";
const $ = selector => document.querySelector(selector);
const previewCount=GAME_CATALOG.filter(g=>g.release==='preview').length;
$('#library-drawer summary').lastElementChild.textContent=`${GAME_CATALOG.length-previewCount} + ${previewCount} 试玩`;
$('.edition').textContent=`ARCADE / ${GAME_CATALOG.length-previewCount} + ${previewCount} PREVIEW`;
const collections = { contrast: ["ART STUDIES / 03", "3 款风格小样"], "one-button": ["ONE BUTTON / 03", "3 款单键挑战"], "one-button-2": ["ONE BUTTON ENCORE / 04", "4 款新挑战"], variety: ["THREE LITTLE WORLDS / 03", "3 种新玩法"] };
collections.curated=['CURATED / 07','7 款精选'];
collections['arcade-five']=['ARCADE FIVE / 05','五款新作'];
collections['sports-ten']=['SPORTS & TOYS / 10','运动与机关十连发'];
collections['odd-ten']=['ODD LITTLE ARCADE / 10','十种奇妙小差事'];
collections['challenge-ten']=['CHALLENGE ARCADE / 10','十种挑战，十种手感'];
collections['century-ten']=['CENTURY ARCADE / 10','百款新章 · 十种新挑战'];
collections['gauntlet-ten']=['THE GAUNTLET / 10','险境十局 · 操作简单，过关不易'];
collections['hardcore-ten']=['ONE MORE TRY / 10','不服再来 · 十款高难挑战'];
collections['extreme-six']=['LIMIT BREAK / 6','极限六式 · 百款终章'];
const previewCollection = Object.keys(collections).find(id => id === new URLSearchParams(location.search).get("collection"));
const curatedView=previewCollection==='curated';
let settings = {};
try { settings = JSON.parse(localStorage.getItem("agent-stage-arcade-settings") || "{}"); } catch {}
let muted = settings.muted ?? true, reduced = settings.reduced ?? matchMedia("(prefers-reduced-motion: reduce)").matches;
let runId = null, demoTimer = null, dismissedRunId = null;
let controlsSignature = "";
function setText(selector, text) { const node = $(selector); if (node.textContent !== String(text)) node.textContent = text; }
const rotation = createGameRotation({ next: () => arcade.nextGame() });
const config = new URLSearchParams(location.hash.slice(1)), token = config.get("token");
const daemon = config.get("daemon") || "http://127.0.0.1:4282";
if (token) history.replaceState(null, "", location.pathname + location.search);
const popup = new URLSearchParams(location.search).has("popup");
let stageRatio = 16 / 9;
function syncWindowRatio() {
  // Include the control strip in the native frame, not in the game's aspect ratio.
  document.documentElement.dataset.stageRatio = String(popup ? innerWidth / (innerWidth / stageRatio + 40) : stageRatio);
}
window.addEventListener("resize", syncWindowRatio);
const frameProbe = window.__agentStageNativeWindow ? createFrameProbe() : null;
if (frameProbe) window.__agentStagePerformance = () => ({game: arcade.program.id, at: Date.now(), ...frameProbe.read()});
if (popup) { document.documentElement.classList.add("popup-mode"); $("#library-drawer").open = false; }
$("#close-game").hidden = !popup;
function save() { localStorage.setItem("agent-stage-arcade-settings", JSON.stringify({ muted, reduced, game: arcade.random ? null : arcade.program.id, mode:arcade.mode })); }
function revealSelection() {
  const library = $("#game-library"), selected = library.querySelector('[aria-pressed="true"]');
  if (!selected || library.scrollWidth <= library.clientWidth) return;
  const item = selected.getBoundingClientRect(), bounds = library.getBoundingClientRect();
  if (item.left < bounds.left) library.scrollLeft += item.left - bounds.left;
  else if (item.right > bounds.right) library.scrollLeft += item.right - bounds.right;
}
function showProgram(program) {
  rotation.reset();
  stageRatio = 960 / (program.canvasHeight ?? 540);
  $(".playfield").style.setProperty('--stage-ratio', String(stageRatio));
  syncWindowRatio();
  $("#popup-game-name").textContent = program.title;
  $("#game-title").textContent = program.title; $("#game-english").textContent = program.english; $("#game-genre").textContent = program.genre;
  $(".playfield").setAttribute("aria-label", program.title); $("#stage-canvas").setAttribute("aria-label", `${program.title}。${program.hint}`);
  $(".ammo").hidden = true; $("#random").checked = arcade.random;
  $(".level-strip").hidden = program.hideLevels || program.collection === "contrast" || program.id === "kitchen-defense";
  $("#levels").replaceChildren(); $("#levels").style.setProperty("--level-count", program.levels.length);
  for (const [index, level] of program.levels.entries()) {
    const button = document.createElement("button"); button.className = "level"; button.dataset.level = index;
    button.disabled = false;
    const number = document.createElement("b"); number.textContent = String(index + 1).padStart(2, "0");
    const name = document.createElement("span"); name.textContent = level; button.append(number, name);
    button.addEventListener("click", () => { arcade.setLevel(index); refresh(); }); $("#levels").append(button);
  }
  document.querySelectorAll("[data-game]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.game === program.id)));
  revealSelection();
}
function refresh() {
  frameProbe?.setActive(arcade.active && !arcade.paused && !document.hidden);
  const s = arcade.snapshot;
  if (!s) return;
  const controls = arcade.controls;
  const interactive = arcade.active && !arcade.paused;
  const signature = JSON.stringify([arcade.program.id, arcade.active, arcade.paused, s.phase, s.primaryEnabled, s.abilityAvailable, s.level, s.ammo, controls]);
  if (signature === controlsSignature) return;
  controlsSignature = signature;
  $("#next-game").disabled = !arcade.active || arcade.paused;
  $("#close-game").disabled = !arcade.active;
  $("#fire").disabled = !interactive || s.phase === "aiming" || s.phase === "flight" || (s.primaryEnabled === false && !["won", "lost"].includes(s.phase));
  $("#fire").textContent = arcade.controls.primary.label;
  $("#fire").hidden = Boolean(arcade.controls.primary.hidden) && arcade.active;
  $("#fire").title = arcade.controls.primary.hint;
  $("#ability").textContent = arcade.controls.secondary?.label ?? "技能";
  $("#ability").hidden = arcade.controls.secondary?.label === "";
  $("#ability").title = arcade.controls.secondary?.hint ?? "";
  $("#ability").disabled = !interactive || !s.abilityAvailable;
  $("#retry").disabled = !interactive;
  $("#stop").disabled = !arcade.active;
  $("#level-count").textContent = `${String(s.level + 1).padStart(2, "0")} / ${String(arcade.program.levels.length).padStart(2, "0")}`;
  document.querySelectorAll("button[data-ammo]").forEach(b => { b.setAttribute("aria-pressed", String(b.dataset.ammo === s.ammo)); b.disabled = !arcade.active || s.phase !== "ready"; });
  document.querySelectorAll("button[data-level]").forEach(b => b.setAttribute("aria-pressed", String(Number(b.dataset.level) === s.level)));
}
const arcade = createPackHost($("#stage-canvas"), {
  onProgram: showProgram,
  onFeedback(notice) { setText("#feedback", notice.text); setText("#stage-live", notice.text); refresh(); },
  onScore(score) { setText("#feedback", `${score} 分`); refresh(); },
  onState(notice) {
    $("#agent-status").textContent = notice.type === "stopped" ? (dismissedRunId ? "游戏已关闭" : "Agent 已完成") : "Agent 工作中";
    $(".agent-status").classList.toggle("idle", notice.type === "stopped");
    if (notice.type === "stopped") { runId = null; $("#feedback").textContent = `已停止 · ${notice.score} 分`; $("#stage-live").textContent = dismissedRunId ? "本轮游戏已关闭，Codex 任务继续执行" : "任务完成，游戏已停止"; }
    refresh();
  },
}, loadReviewedPack);
for (const game of GAME_CATALOG.filter(g => !previewCollection || (curatedView ? g.curated : g.collection === previewCollection))) {
  const button = document.createElement("button"); button.className = "game-choice"; button.dataset.game = game.id; button.title = `${game.genre}。${game.hint}`;
  const art = document.createElement("img"); art.alt = ""; art.loading = "lazy"; art.src = game.cover;
  const name = document.createElement("span"); name.textContent = game.title; button.append(art, name);
  button.addEventListener("click", () => { arcade.chooseProgram(game.id); $("#random").checked = false; showProgram(arcade.program); refresh(); save(); }); $("#game-library").append(button);
}
const requestedGame = new URLSearchParams(location.search).get("game") || (previewCollection&&!curatedView ? GAME_CATALOG.find(g => g.collection === previewCollection)?.id : null);
if (requestedGame || (!popup&&!curatedView&&settings.game)) arcade.chooseProgram(requestedGame || settings.game);
if (popup && !requestedGame) arcade.setMode('all');
if(curatedView&&!requestedGame)arcade.setMode('curated');
if (requestedGame && GAME_CATALOG.some(g => g.id === requestedGame)) $("#library-drawer").open = Boolean(previewCollection);
if (previewCollection) { $(".edition").textContent = collections[previewCollection][0]; $("#library-drawer summary").lastElementChild.textContent = collections[previewCollection][1]; $(".random-mode").hidden = !curatedView; }
if(curatedView){$('.random-mode').lastChild.textContent=' 精选轮换';$('.random-mode').title='七款一轮，可随时换一款';$('#library-drawer').open=true;}
showProgram(arcade.program);
const libraryResize = new ResizeObserver(revealSelection); libraryResize.observe($("#game-library"));
$("#random").addEventListener("change", () => { arcade.setMode($("#random").checked ? (curatedView?'curated':'random') : "game"); save(); });
function present(event) {
  if (event.type === "turn.started") {
    if (event.runId === dismissedRunId || (runId === event.runId && arcade.active)) return;
    dismissedRunId = null; document.documentElement.classList.remove("game-dismissed");
    runId = event.runId; arcade.start(event);
  }
  if (event.type === "turn.completed" && (!runId || event.runId === runId)) arcade.stop();
}
function demo() {
  clearTimeout(demoTimer);
  const id = `preview_${Date.now()}`; present({ type: "turn.started", runId: id, spanId: id, operation: { family: "turn" } });
  demoTimer = setTimeout(() => present({ type: "turn.completed", runId: id }), 180000);
}
$("#demo").addEventListener("click", demo);
$("#stop").addEventListener("click", () => { clearTimeout(demoTimer); arcade.stop(); });
$("#fire").addEventListener("click", () => { arcade.input("tap"); refresh(); });
$("#ability").addEventListener("click", () => { arcade.input("doubleTap"); refresh(); });
$("#retry").addEventListener("click", () => { arcade.retry(); refresh(); });
$("#next-game").addEventListener("click", () => { arcade.nextGame(); refresh(); save(); $("#stage-canvas").focus({ preventScroll: true }); });
function dismissGame() {
  if (!popup || !arcade.active) return;
  dismissedRunId = runId;
  const root = document.documentElement;
  root.dataset.stageDismissSerial = String(Number(root.dataset.stageDismissSerial || 0) + 1);
  root.classList.add("game-dismissed");
  clearTimeout(demoTimer); rotation.clearInput(); arcade.stop();
}
$("#close-game").addEventListener("click", dismissGame);
function trackInput(type, id) {
  if (type === "down") rotation.press(id);
  else if (type === "up") rotation.release(id);
  else if (type === "clear") rotation.clearInput();
  else rotation.touch();
}
for (const [event, type] of [["pointerdown", "down"], ["pointerup", "up"], ["pointercancel", "up"], ["pointermove", "move"], ["keydown", "down"], ["keyup", "up"]]) {
  document.addEventListener(event, e => trackInput(type, e.pointerId !== undefined ? `pointer:${e.pointerId}` : `key:${e.code}`), { capture: true, passive: true });
}
window.addEventListener("blur", () => rotation.clearInput());
window.addEventListener("agent-stage-game-input", e => trackInput(e.detail.type, e.detail.id));
const rotationTimer = setInterval(() => rotation.tick({ active: arcade.active, random: arcade.random, paused: arcade.paused, hidden: document.hidden, phase: arcade.snapshot?.phase }), 1000);
const unbindHostVisibility = popup ? bindHostVisibility(window, arcade, paused => {
  document.documentElement.dataset.stageHostPaused = String(paused);
  rotation.clearInput(); refresh();
}) : () => {};
function expandStage(expanded) {
  $(".playfield").classList.toggle("expanded", expanded); document.body.classList.toggle("stage-expanded", expanded);
  const button=$("#expand-stage"),label=expanded?"缩小游戏":"放大游戏";button.setAttribute("aria-pressed",String(expanded));button.setAttribute("aria-label",label);button.title=label;
  button.querySelector("img").src=`/apps/codex-stage/assets/icons/${expanded?"minimize-2":"maximize-2"}.svg`;$("#stage-canvas").focus({preventScroll:true});
}
$("#expand-stage").addEventListener("click",()=>expandStage(!$(".playfield").classList.contains("expanded")));
document.addEventListener("keydown", e => {
  if (e.key !== "Escape" || e.repeat) return;
  if (popup && arcade.active) {
    e.preventDefault();
    dismissGame();
  } else if ($(".playfield").classList.contains("expanded")) {
    e.preventDefault(); expandStage(false);
  }
});
document.querySelectorAll("button[data-ammo]").forEach(b => b.addEventListener("click", () => { arcade.selectAmmo(b.dataset.ammo); refresh(); }));
function sound() { arcade.setMuted(muted); $("#mute").setAttribute("aria-pressed", String(muted)); $("#mute img").src = `/apps/codex-stage/assets/icons/${muted ? "volume-x" : "volume-2"}.svg`; }
$("#mute").addEventListener("click", () => { muted = !muted; sound(); save(); });
$("#reduce").addEventListener("click", () => { reduced = !reduced; arcade.setReduced(reduced); $("#reduce").setAttribute("aria-pressed", String(reduced)); save(); });
sound(); arcade.setReduced(reduced); $("#reduce").setAttribute("aria-pressed", String(reduced));
if (token) {
  $(".brand").addEventListener("click", event => event.preventDefault());
  const endpoint = new URL(daemon);
  if (endpoint.protocol !== "http:" || endpoint.hostname !== "127.0.0.1" || endpoint.username || endpoint.password || endpoint.pathname !== "/" || endpoint.search || endpoint.hash) throw new Error("Only local Agent Stage endpoints are allowed");
  $("#connection").textContent = "正在连接";
  $("#agent-status").textContent = "等待下一个任务";
  $(".agent-status").classList.add("idle");
  $("#fire").disabled = $("#ability").disabled = $("#retry").disabled = true;
  $("#feedback").textContent = "等待 Codex 任务";
  $("#demo").hidden = $("#stop").hidden = true;
  const stream = new EventSource(`${endpoint.origin}/v1/events?token=${encodeURIComponent(token)}`);
  const turns = createLiveTurns({ start: present, stop: () => arcade.stop() });
  stream.onopen = () => { $("#connection").textContent = "本地 hooks 已连接"; };
  stream.addEventListener("snapshot", message => { try { turns.snapshot(JSON.parse(message.data).active); } catch {} });
  stream.addEventListener("activity", message => { try { turns.event(JSON.parse(message.data)); } catch {} });
  stream.onerror = () => { $("#connection").textContent = "连接中断"; turns.disconnect(); };
  window.addEventListener("agent-stage-pause", () => turns.disconnect());
  window.addEventListener("pagehide", () => stream.close(), { once: true });
} else demo();
document.addEventListener("visibilitychange", refresh);
window.addEventListener("pagehide", () => { clearTimeout(demoTimer); clearInterval(rotationTimer); unbindHostVisibility(); window.removeEventListener("resize", syncWindowRatio); libraryResize.disconnect(); arcade.destroy(); frameProbe?.destroy(); }, { once: true });
