import { createScenePack, StageRuntime } from "/packages/stage-core-ts/src/index.js";
import { createStageRenderer } from "/packages/stage-web/src/index.js";

import { createLabState, transition } from "./state.js";
import { getProfilePresentation } from "./profiles.js";
import { ACTION_CATALOG, GESTURE_CATALOG, SCENE_CATALOG, defaultSceneForAction, scenesForAction } from "./catalog.js";
import { createAudioRenderer } from "./renderers/audio.js";
import { applyLight } from "./renderers/light.js";
import { createStageEventForLab } from "./stage.js";

const recipePaths = {
  "email-send": "/recipes/email-send/recipe.json",
  "phone-call": "/recipes/phone-call/recipe.json",
  "slack-send": "/recipes/slack-send/recipe.json",
  "calendar-create": "/recipes/calendar-create/recipe.json",
  deploy: "/recipes/deploy/recipe.json",
  "file-share": "/recipes/file-share/recipe.json",
};

const scenePackPaths = [
  "/scene-packs/mail-flight/scene.json",
  "/scene-packs/open-line/scene.json",
  "/scene-packs/city-dispatch/scene.json",
  "/scene-packs/paper-courier/scene.json",
  "/scene-packs/mission-control/scene.json",
  "/scene-packs/prism-relay/scene.json",
  "/scene-packs/quiet-night/scene.json",
  "/scene-packs/voice-orbit/scene.json",
  "/scene-packs/calendar-orbit/scene.json",
  "/scene-packs/launch-rail/scene.json",
  "/scene-packs/neon-run/scene.json",
  "/scene-packs/inkwell-atelier/scene.json",
  "/scene-packs/switchboard/scene.json",
  "/scene-packs/chorus-room/scene.json",
  "/scene-packs/time-garden/scene.json",
  "/scene-packs/release-forge/scene.json",
  "/scene-packs/vault-ritual/scene.json",
];

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const buffer = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function newActionDigest(nextRecipe) {
  const nonce = crypto.getRandomValues(new Uint32Array(1))[0];
  return sha256(`${nextRecipe.id}:${Date.now()}:${nonce}`);
}

const [recipes, rawScenePacks] = await Promise.all([
  Promise.all(Object.values(recipePaths).map(fetchJson)),
  Promise.all(scenePackPaths.map(fetchJson)),
]);
const scenePacks = rawScenePacks.map(createScenePack);
const recipeById = new Map(recipes.map((item) => [item.id, item]));
const $ = (selector) => document.querySelector(selector);
const assembly = $(".seal-assembly");
const seal = $("#seal");
const audio = createAudioRenderer();
const stageRenderer = createStageRenderer($("#stage-canvas"), {
  onCaption(text) {
    $("#stage-caption").textContent = text;
  },
});

let recipe = recipeById.get("email-send") ?? recipes[0];
let state = createLabState(recipe);
let profile = "pulse";
let dialChoice = "approve_once";
let detailsRevealed = false;
let stageMode = "full-detail";
let sceneChoice = defaultSceneForAction(recipe.id);
let privacyMode = "summary-only";
let timeMode = "day";
let lifecyclePreview = "live";
let reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
let actionDigest = await newActionDigest(recipe);
let stageRuntime = null;
let approvalPresentation = null;
let currentPresentation = null;
let currentStageEvent = null;
let lastPresentationKey = "";
let presentationRun = 0;
let holdTimer = null;
let progressTimer = null;
let tapTimer = null;
let tapCount = 0;
let tapStartedAt = null;
const DOUBLE_TAP_WINDOW_MS = 420;

function titleCase(value) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function elapsedHold() {
  return state.holdStartedAt ? Math.max(0, Date.now() - state.holdStartedAt) : 0;
}

function updateProgress() {
  const presentation = getProfilePresentation(profile, dialChoice);
  const sequenceLength = presentation.tapSequence ?? 0;
  const sequenceComplete = sequenceLength && state.status === "succeeded";
  const progress = sequenceLength && (state.status === "pending" || sequenceComplete)
    ? (sequenceComplete ? 1 : tapCount / sequenceLength)
    : state.status === "holding" ? Math.min(1, elapsedHold() / recipe.holdMs) : 0;
  assembly.style.setProperty("--hold-progress", `${progress * 360}deg`);
  $("#seal-progress").textContent = sequenceLength && (state.status === "pending" || sequenceComplete)
    ? `${sequenceComplete ? sequenceLength : tapCount}/${sequenceLength}`
    : state.status === "holding" ? `${Math.max(0, (recipe.holdMs - elapsedHold()) / 1000).toFixed(1)}s` : `${(recipe.holdMs / 1000).toFixed(1)}s`;
}

function cardRows(card) {
  const rows = [
    ["To", card.target],
    ["Impact", card.impact],
    ["Undo", card.rollback ?? "No rollback provided."],
  ];
  if (card.disclosure) rows.splice(2, 0, ["Disclosure", card.disclosure]);
  return rows.map(([label, value]) => `<div class="card-row"><span>${label}</span><p>${value}</p></div>`).join("");
}

function stageStatus() {
  if (lifecyclePreview !== "live") return lifecyclePreview;
  return state.status === "pending" ? "waiting" : state.status;
}

function contextTimeOfDay() {
  if (stageMode === "quiet-night" || sceneChoice === "quiet-night") return "night";
  if (timeMode === "day" || timeMode === "night") return timeMode;
  const hour = new Date().getHours();
  return hour >= 22 || hour < 7 ? "night" : "day";
}

function activePacks() {
  if (stageMode === "quiet-night") return scenePacks.filter((pack) => pack.id === "quiet-night");
  return scenePacks.filter((pack) => pack.id === sceneChoice);
}

function stageEvent() {
  return createStageEventForLab({
    recipe,
    actionDigest,
    status: stageStatus(),
    profile,
    privacyMode,
    locale: "zh-CN",
    timeOfDay: contextTimeOfDay(),
    reducedMotion,
  });
}

function sceneText(presentation) {
  return presentation.commands.find((command) => command.channel === "screen")?.text
    ?? presentation.commands.find((command) => command.channel === "speech")?.text
    ?? "这个场景用灯光来表达当前状态。";
}

function renderScenePresentation(presentation) {
  const light = [...presentation.commands].reverse().find((command) => command.channel === "light");
  if (light) applyLight(assembly, light);
  $("#scene-pack").textContent = `${presentation.record.scene.packId} / ${presentation.record.scene.variantId}`;
  $("#scene-copy").textContent = sceneText(presentation);
  const render = presentation.record.render;
  $("#scene-proof").textContent = render
    ? `${presentation.record.digest.slice(0, 10)} · assets ${render.assetDigest.slice(0, 10)}`
    : presentation.record.digest.slice(0, 14);
  audio.render(presentation.commands, { voice: $("#sound-enabled").checked });
  if (presentation.timeline) {
    stageRenderer.render(presentation, { slots: currentStageEvent.slots, reducedMotion: currentStageEvent.context.reducedMotion });
  } else {
    stageRenderer.clear();
    $("#stage-caption").textContent = "";
  }
}

async function presentStage({ force = false } = {}) {
  const key = [actionDigest, recipe.id, stageStatus(), profile, stageMode, sceneChoice, privacyMode, timeMode, reducedMotion].join(":");
  if (!force && key === lastPresentationKey) return;
  lastPresentationKey = key;
  const run = ++presentationRun;
  stageRuntime = new StageRuntime({ packs: activePacks() });
  try {
    currentStageEvent = stageEvent();
    const presentation = await stageRuntime.present(currentStageEvent);
    if (run !== presentationRun) return;
    currentPresentation = presentation;
    if (state.status === "pending" && lifecyclePreview === "live") approvalPresentation = presentation.record;
    renderScenePresentation(presentation);
    $("#scene-preview").hidden = lifecyclePreview === "live";
  } catch (error) {
    stageRenderer.clear();
    $("#stage-caption").textContent = "";
    $("#scene-pack").textContent = "scene unavailable";
    $("#scene-copy").textContent = "No compatible Stage Pack is installed for this action.";
    $("#scene-proof").textContent = "";
    $("#scene-preview").hidden = lifecyclePreview === "live";
    console.error(error);
  }
}

function presentationContext() {
  return approvalPresentation ? { actionDigest, presentation: approvalPresentation } : { actionDigest };
}

function receiptMarkup(receipt) {
  if (!receipt) return `<p class="pending-receipt">A decision will be bound to this exact action digest.</p>`;
  const presentation = receipt.presentation;
  const sceneRows = presentation
    ? `<div><dt>Scene</dt><dd>${presentation.scene.packId}/${presentation.scene.variantId}</dd></div><div><dt>Presented</dt><dd>${presentation.digest.slice(0, 14)}</dd></div>`
    : "";
  return `<dl><div><dt>Decision</dt><dd>${titleCase(receipt.decision.outcome)}</dd></div><div><dt>Method</dt><dd>${titleCase(receipt.decision.method)}</dd></div>${sceneRows}<div><dt>Receipt</dt><dd>${receipt.id.slice(-14)}</dd></div><div><dt>Time</dt><dd>${new Date(receipt.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</dd></div></dl>`;
}

function actionLibraryMarkup() {
  return Object.entries(ACTION_CATALOG)
    .filter(([recipeId]) => recipeById.has(recipeId))
    .map(([recipeId, item]) => `
      <button class="action-option${recipe.id === recipeId ? " is-selected" : ""}" data-recipe="${recipeId}" type="button" aria-pressed="${recipe.id === recipeId}">
        <span class="action-mark">${item.mark}</span>
        <span><strong>${item.label}</strong><small>${item.eyebrow}</small></span>
      </button>`)
    .join("");
}

function scenePickerMarkup() {
  return scenesForAction(recipe.id)
    .map((sceneId) => {
      const item = SCENE_CATALOG[sceneId];
      const selected = sceneChoice === sceneId;
      return `
        <button class="scene-option${selected ? " is-selected" : ""}" data-scene="${sceneId}" type="button" aria-pressed="${selected}">
          <span class="scene-preview scene-${item.family}" aria-hidden="true"></span>
          <span><strong>${item.title}</strong><small>${item.detail}</small></span>
        </button>`;
    })
    .join("");
}

function gesturePickerMarkup() {
  return GESTURE_CATALOG
    .map((item) => {
      const selected = profile === item.id;
      return `
        <button class="gesture-option${selected ? " is-selected" : ""}" data-profile="${item.id}" type="button" aria-pressed="${selected}">
          <span class="gesture-mark gesture-${item.id}">${item.mark}</span>
          <span><strong>${item.title}</strong><small>${item.detail}</small></span>
        </button>`;
    })
    .join("");
}

function render() {
  const receipt = state.receipt;
  const presentation = getProfilePresentation(profile, dialChoice);
  assembly.dataset.status = state.status;
  assembly.dataset.tone = recipe.tone;
  assembly.dataset.profile = profile;
  $("#action-card").innerHTML = `
    <div class="card-kicker"><span>${recipe.category}</span><span class="risk-chip risk-${recipe.risk}">${recipe.risk}</span></div>
    <h2>${recipe.card.title}</h2>
    <p class="card-summary">${recipe.card.summary}</p>
    <div class="card-rows">${cardRows(recipe.card)}</div>`;
  $("#risk-value").textContent = titleCase(recipe.risk);
  $("#gesture-value").textContent = presentation.gesture;
  $("#signal-meter").innerHTML = `<span class="meter-track"><i class="meter-fill risk-${recipe.risk}"></i></span><span>${recipe.category}</span>`;
  const labels = {
    pending: ["Awaiting your consent", "Review the action, then commit it deliberately."],
    holding: ["Reading your press", "The ring closes only while your hand stays on the seal."],
    succeeded: ["Action released", "The executor acknowledged this one-time approval."],
    denied: ["Action denied", "The agent received a clear no."],
    deferred: ["Action deferred", "Nothing has been executed."],
    expired: ["Request expired", "Nothing has been executed."],
  };
  const [label, subtitle] = labels[state.status];
  $("#state-label").textContent = label;
  $("#mobile-action-label").textContent = recipe.card.title;
  $("#state-subtitle").textContent = detailsRevealed && state.status === "pending"
    ? `${recipe.card.target} · ${recipe.card.impact}`
    : subtitle;
  $("#live-status").textContent = label;
  $("#receipt-status").textContent = receipt ? titleCase(receipt.status) : "Pending";
  $("#receipt-status").className = `receipt-status ${receipt ? `status-${receipt.status}` : ""}`;
  $("#receipt-content").innerHTML = receiptMarkup(receipt);
  $("#action-library").innerHTML = actionLibraryMarkup();
  $("#scene-picker").innerHTML = scenePickerMarkup();
  $("#gesture-picker").innerHTML = gesturePickerMarkup();
  $("#scene-shelf-title").textContent = `${ACTION_CATALOG[recipe.id]?.label ?? recipe.label} scenes`;
  $("#gesture-shelf-title").textContent = `${ACTION_CATALOG[recipe.id]?.label ?? recipe.label} confirmation`;
  for (const button of document.querySelectorAll(".dial-choice")) {
    button.classList.toggle("is-selected", button.dataset.dialChoice === dialChoice);
    button.disabled = state.status !== "pending";
    button.setAttribute("aria-pressed", String(button.dataset.dialChoice === dialChoice));
  }
  $("#stage-actions").hidden = !presentation.showStageActions;
  $("#dial-controls").hidden = !presentation.showDial;
  $("#seal-label").textContent = presentation.sealLabel;
  $("#seal-details").hidden = !detailsRevealed || state.status !== "pending";
  $("#seal-details").textContent = `${recipe.card.title} · ${recipe.card.target}`;
  $("#seal-instruction").textContent = presentation.caption;
  seal.disabled = state.status !== "pending";
  $("#deny").disabled = state.status !== "pending";
  $("#defer").disabled = state.status !== "pending";
  $("#details").disabled = state.status !== "pending";
  updateProgress();
  void presentStage();
}

function stopHolding(cancel = false) {
  if (holdTimer) clearTimeout(holdTimer);
  if (progressTimer) clearInterval(progressTimer);
  holdTimer = null;
  progressTimer = null;
  if (cancel && state.status === "holding") {
    state = transition(state, { type: "HOLD_CANCEL", at: Date.now() });
    render();
  }
}

function clearTapTimer() {
  if (tapTimer) clearTimeout(tapTimer);
  tapTimer = null;
  tapCount = 0;
  tapStartedAt = null;
}

function startHolding(event) {
  if (state.status !== "pending") return;
  event.preventDefault();
  void audio.unlock();
  const presentation = getProfilePresentation(profile, dialChoice);
  if (presentation.tapSequence) {
    tapStartedAt = Date.now();
    return;
  }
  const decisionContext = presentationContext();
  state = transition(state, { type: "HOLD_START", at: Date.now() });
  render();
  progressTimer = setInterval(updateProgress, 16);
  holdTimer = setTimeout(() => {
    clearTapTimer();
    const holdEvent = getProfilePresentation(profile, dialChoice).holdEvent;
    state = transition(state, { ...holdEvent, ...decisionContext, at: Date.now() });
    stopHolding(false);
    render();
  }, recipe.holdMs);
}

function endPrimaryGesture() {
  const presentation = getProfilePresentation(profile, dialChoice);
  if (presentation.tapSequence && tapStartedAt) {
    const isShortTap = Date.now() - tapStartedAt < 420;
    tapStartedAt = null;
    if (!isShortTap || state.status !== "pending") return;
    if (tapTimer) clearTimeout(tapTimer);
    tapCount += 1;
    if (tapCount === presentation.tapSequence) {
      tapTimer = null;
      state = transition(state, {
        type: "TAP_SEQUENCE_COMPLETE",
        count: tapCount,
        required: presentation.tapSequence,
        method: "triple_tap",
        ...presentationContext(),
        at: Date.now(),
      });
      render();
      return;
    }
    tapTimer = setTimeout(() => {
      tapTimer = null;
      tapCount = 0;
      render();
    }, 760);
    updateProgress();
    return;
  }
  const quickPress = state.status === "holding" && elapsedHold() < 280;
  stopHolding(true);
  if (!quickPress || state.status !== "pending") return;
  if (presentation.doublePress === "deny") {
    if (tapTimer) {
      clearTapTimer();
      state = transition(state, { type: "DENY", method: "double_tap", ...presentationContext(), at: Date.now() });
      render();
      return;
    }
    tapTimer = setTimeout(() => {
      tapTimer = null;
      if (state.status === "pending" && profile === "pulse") {
        lastPresentationKey = "";
        void presentStage({ force: true });
      }
    }, DOUBLE_TAP_WINDOW_MS);
    return;
  }
  if (presentation.quickPress === "reveal") {
    detailsRevealed = !detailsRevealed;
    render();
  }
}

async function startNewRequest(nextRecipe = recipe) {
  stopHolding(false);
  clearTapTimer();
  recipe = nextRecipe;
  sceneChoice = defaultSceneForAction(recipe.id);
  state = createLabState(recipe);
  detailsRevealed = false;
  dialChoice = "approve_once";
  actionDigest = await newActionDigest(recipe);
  approvalPresentation = null;
  currentPresentation = null;
  lastPresentationKey = "";
  render();
}

seal.addEventListener("pointerdown", startHolding);
seal.addEventListener("pointerup", endPrimaryGesture);
seal.addEventListener("pointerleave", endPrimaryGesture);
seal.addEventListener("pointercancel", endPrimaryGesture);
seal.addEventListener("keydown", (event) => {
  if ((event.key === " " || event.key === "Enter") && !event.repeat) startHolding(event);
});
seal.addEventListener("keyup", (event) => {
  if (event.key === " " || event.key === "Enter") endPrimaryGesture();
});

$("#deny").addEventListener("click", () => {
  stopHolding(false);
  void audio.unlock();
  state = transition(state, { type: "DENY", ...presentationContext(), at: Date.now() });
  render();
});
$("#defer").addEventListener("click", () => {
  stopHolding(false);
  void audio.unlock();
  state = transition(state, { type: "DEFER", ...presentationContext(), at: Date.now() });
  render();
});
$("#details").addEventListener("click", () => {
  detailsRevealed = !detailsRevealed;
  render();
});
$("#reset").addEventListener("click", () => void startNewRequest());
$("#scene-mode").addEventListener("change", (event) => {
  stageMode = event.target.value;
  lastPresentationKey = "";
  void presentStage({ force: true });
});
$("#privacy-mode").addEventListener("change", (event) => {
  privacyMode = event.target.value;
  lastPresentationKey = "";
  void presentStage({ force: true });
});
$("#time-mode").addEventListener("change", (event) => {
  timeMode = event.target.value;
  lastPresentationKey = "";
  void presentStage({ force: true });
});
$("#lifecycle-preview").addEventListener("change", (event) => {
  lifecyclePreview = event.target.value;
  lastPresentationKey = "";
  void presentStage({ force: true });
});
$("#sound-enabled").addEventListener("change", (event) => {
  audio.setEnabled(event.target.checked);
  if (event.target.checked) void audio.unlock();
});
$("#reduced-motion").addEventListener("change", (event) => {
  reducedMotion = event.target.checked;
  lastPresentationKey = "";
  void presentStage({ force: true });
});
$("#action-library").addEventListener("click", (event) => {
  const button = event.target.closest("[data-recipe]");
  if (button) void startNewRequest(recipeById.get(button.dataset.recipe));
});
$("#scene-picker").addEventListener("click", (event) => {
  const button = event.target.closest("[data-scene]");
  if (button) {
    sceneChoice = button.dataset.scene;
    lastPresentationKey = "";
    render();
  }
});
$("#gesture-picker").addEventListener("click", (event) => {
  const button = event.target.closest("[data-profile]");
  if (button) {
    stopHolding(true);
    clearTapTimer();
    profile = button.dataset.profile;
    dialChoice = "approve_once";
    detailsRevealed = false;
    lastPresentationKey = "";
    render();
  }
});
for (const button of document.querySelectorAll(".dial-choice")) {
  button.addEventListener("click", () => {
    if (state.status !== "pending") return;
    dialChoice = button.dataset.dialChoice;
    detailsRevealed = false;
    render();
  });
}

render();
