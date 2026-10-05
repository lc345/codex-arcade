import { createMatter, Matter } from "./vendor/matter.js";
import { createSlingSound } from "./studio/base-sound.js";
import { GAME_CATALOG, createGamePicker } from "./collection/catalog.js";
import { STUDIO_PACKS } from "./studio/registry.js";
import { createStudioKernel } from "./studio/kernel.js";
import { createStudioPainter } from "./studio/painter.js";
import { createStudioRuntime } from "./studio/runtime.js";
import { createContrastSound } from "./studio/contrast-sound.js";
import { createKitchenSound } from "./studio/kitchen-sound.js";
import { createYesterdaySound } from "./studio/yesterday-sound.js";
import { createRuleSound } from "./studio/rule-sound.js";
import { createStuntSound } from "./studio/stunt-sound.js";
import { createShadowSound } from "./studio/shadow-sound.js";
import { createDiceSound } from "./studio/dice-sound.js";
import { createApplianceSound } from "./studio/appliance-sound.js";
import { createToastSound } from "./studio/toast-sound.js";
import { createOneButtonSound } from "./studio/one-button-sound.js";
import { createVarietySound } from "./studio/variety-sound.js";
import { createMagnetSound } from "./studio/magnet-sound.js";
import { createVarietySession } from "./studio/variety-session.js";
import { createVarietyStage } from "./studio/variety-3d.js";
import { createOneButtonSession } from "./studio/one-button-kit.js";
import { createOneButtonCanvas } from "./studio/one-button-painters.js";
import { STUDIO_ART } from "./studio/assets.js";
import { createThree } from "./vendor/three.js";
import { createRapier, prepareRapier } from "./vendor/rapier.js";
import { createPreparedStudioRuntime } from "./studio/prepared-runtime.js";
import { createPackHost } from "./packs/host.js";
import { loadReviewedPack } from "./packs/loader.js";

export function listTheaterPrograms(kind = "game") { return kind === "short" ? [] : GAME_CATALOG.map(p => ({ ...p, levels: p.levels.slice() })); }
export function selectTheaterProgram(event = {}, _mode, _index, _media, preferred) {
  const pinned = GAME_CATALOG.find(p => p.id === preferred);
  let hash = 0; for (const c of event.runId ?? "") hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  const released = GAME_CATALOG.filter(p => p.release !== "preview");
  return { ...(pinned ?? released[hash % released.length]) };
}
export function gameControls() {
  return { primary: { label: "开始", gesture: "tap", hint: "开始当前游戏" }, secondary: { label: "" } };
}
export function programControls(_program, snapshot) {
  if (snapshot?.phase === "won") return { primary: { label: "下一关", gesture: "tap", hint: "前往下一关" }, secondary: { label: "重试", gesture: "retry", hint: "重玩当前关卡" } };
  if (snapshot?.phase === "lost") return { primary: { label: "再试一次", gesture: "tap", hint: "重新挑战当前关卡" } };
  return gameControls();
}

export function createAgentArcade(canvas, callbacks = {}) {
  return createPackHost(canvas, callbacks, loadReviewedPack);
}

// The installer ships the trusted runtime, including Matter and art, with no renderer network dependency.
export function createAgentArcadeSource({ packId } = {}) {
  if (packId && !GAME_CATALOG.some(g => g.id === packId)) throw new Error("Unknown reviewed game pack");
  if (GAME_CATALOG.find(g => g.id === packId)?.canvasPack) throw new Error("Use the reviewed pack builder for asynchronous Canvas games");
  const functions = { createMatter, createSlingSound, listTheaterPrograms, selectTheaterProgram, gameControls, programControls, createGamePicker };
  const constants = { GAME_CATALOG: packId ? GAME_CATALOG.filter(p => p.id === packId) : GAME_CATALOG.filter(p => !p.canvasPack), STUDIO_ART: packId ? { [packId]: STUDIO_ART[packId] ?? "" } : STUDIO_ART };
  const studio = Object.entries(STUDIO_PACKS).filter(([id]) => !packId || id === packId);
  const needsPhysics = !packId || !STUDIO_PACKS[packId] || GAME_CATALOG.find(g => g.id === packId)?.physics === "matter";
  if (!needsPhysics) functions.createMatter = null;
  if (studio.length) Object.assign(functions, { createStudioKernel, createStudioPainter, createStudioRuntime });
  if (!packId || GAME_CATALOG.find(g => g.id === packId)?.collection === "contrast") functions.createContrastSound = createContrastSound;
  if (!packId || GAME_CATALOG.find(g => g.id === packId)?.soundPalette === "kitchen") functions.createKitchenSound = createKitchenSound;
  if (!packId || GAME_CATALOG.find(g => g.id === packId)?.soundPalette === "yesterday") functions.createYesterdaySound = createYesterdaySound;
  if (!packId || GAME_CATALOG.find(g => g.id === packId)?.soundPalette === "rules") functions.createRuleSound = createRuleSound;
  if (!packId || GAME_CATALOG.find(g => g.id === packId)?.soundPalette === "stunt") functions.createStuntSound = createStuntSound;
  if (!packId || GAME_CATALOG.find(g => g.id === packId)?.soundPalette === "shadow") functions.createShadowSound = createShadowSound;
  if (!packId || GAME_CATALOG.find(g => g.id === packId)?.soundPalette === "dice") functions.createDiceSound = createDiceSound;
  if (!packId || GAME_CATALOG.find(g => g.id === packId)?.soundPalette === "appliance") functions.createApplianceSound = createApplianceSound;
  if (!packId || GAME_CATALOG.find(g => g.id === packId)?.soundPalette === "toast") functions.createToastSound = createToastSound;
  if (!packId || GAME_CATALOG.find(g => g.id === packId)?.soundPalette === "one-button") Object.assign(functions, { createOneButtonSound, createOneButtonSession, createOneButtonCanvas });
  if (!packId || GAME_CATALOG.find(g => g.id === packId)?.collection === "variety") Object.assign(functions, { createVarietySound, createVarietySession, createOneButtonCanvas });
  if (!packId || packId === "magnet-rampage") functions.createMagnetSound = createMagnetSound;
  if (!packId || ["pocket-town", "clockout-clearout", "magnet-rampage"].includes(packId)) functions.createVarietyStage = createVarietyStage;
  if (!packId || GAME_CATALOG.find(g => g.id === packId)?.renderer === "three") functions.createThree = createThree;
  if (studio.some(([, p]) => p.prepare)) Object.assign(functions, { createRapier, prepareRapier, createPreparedStudioRuntime });
  const declarations = studio.map(([id, { create, paint, createPainter, prepare }]) => `${JSON.stringify(id)}: { create: ${create.toString()}, paint: ${paint.toString()}${createPainter ? `, createPainter: ${createPainter.toString()}` : ""}${prepare ? ", prepare: prepareRapier" : ""} }`).join(",\n");
  return `${Object.entries(constants).map(([name, value]) => `const ${name} = ${JSON.stringify(value)};`).join("\n")}\n${Object.entries(functions).map(([name, fn]) => `const ${name} = ${fn ? fn.toString() : "null"};`).join("\n")}\nconst Matter = ${needsPhysics ? "createMatter()" : "null"};\nconst STUDIO_PACKS = {${declarations}};`;
}
