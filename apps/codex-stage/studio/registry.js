import { prepareRapier } from "../vendor/rapier.js";
import { createRainlineWorld, paintRainline } from "./rainline.js";
import { createRainlinePainter } from "./rainline-painter.js";
import { createInkWorld, paintInk } from "./ink-archive.js";
import { createInkPainter } from "./ink-painter.js";
import { createLiftWorld, paintLift } from "./last-lift.js";
import { createLiftPainter } from "./lift-painter.js";
import { createKitchenWorld, paintKitchen } from "./kitchen-defense.js";
import { createKitchenPainter } from "./kitchen-painter.js";
import { createYesterdayWorld, paintYesterday } from "./yesterday-express.js";
import { createYesterdayPainter } from "./yesterday-painter.js";
import { createRuleWorld, paintRules } from "./rule-smuggler.js";
import { createRulePainter } from "./rule-painter.js";
import { createStuntWorld, paintStunt } from "./temp-stunt.js";
import { createStuntPainter } from "./stunt-painter.js";
import { createShadowWorld, paintShadow } from "./shadow-crew.js";
import { createShadowPainter } from "./shadow-painter.js";
import { createDiceWorld, paintDice } from "./dice-foundry.js";
import { createDicePainter } from "./dice-painter.js";
import { createApplianceWorld, paintAppliance } from "./appliance-escape.js";
import { createAppliancePainter } from "./appliance-painter.js";
import { createToastWorld, paintToast } from "./toast-hop.js";
import { createToastPainter } from "./toast-painter.js";
import { createSkyStackWorld, paintSkyStack } from "./sky-stack.js";
import { createPressWorld, paintPress } from "./press-run.js";
import { createSwingWorld, paintSwing } from "./swing-post.js";
import { createSkyStackPainter, createPressPainter, createSwingPainter } from "./one-button-painters.js";
import { createBridgeWorld, paintBridge } from "./bridge-span.js";
import { createOrbitPinsWorld, paintOrbitPins } from "./orbit-pins.js";
import { createLastStopWorld, paintLastStop } from "./last-stop.js";
import { createGravityWorld, paintGravity } from "./gravity-shift.js";
import { createBridgePainter, createOrbitPinsPainter, createLastStopPainter, createGravityPainter } from "./encore-painters.js";
import { createDemolitionWorld, paintDemolition } from "./marble-demolition.js";
import { createDemolitionPainter } from "./demolition-painter.js";
import { createTownWorld, paintTown } from "./pocket-town.js";
import { createTownPainter } from "./town-painter.js";
import { createClearoutWorld, paintClearout } from "./clockout-clearout.js";
import { createClearoutPainter } from "./clearout-painter.js";
import { createMagnetWorld, paintMagnet } from "./magnet-rampage.js";
import { createMagnetPainter } from "./magnet-painter.js";
export const STUDIO_PACKS = Object.freeze({
  "magnet-rampage": { create: createMagnetWorld, paint: paintMagnet, createPainter: createMagnetPainter },
  "marble-demolition": { create: createDemolitionWorld, paint: paintDemolition, createPainter: createDemolitionPainter },
  "pocket-town": { create: createTownWorld, paint: paintTown, createPainter: createTownPainter },
  "clockout-clearout": { create: createClearoutWorld, paint: paintClearout, createPainter: createClearoutPainter },
  "bridge-span": { create: createBridgeWorld, paint: paintBridge, createPainter: createBridgePainter },
  "orbit-pins": { create: createOrbitPinsWorld, paint: paintOrbitPins, createPainter: createOrbitPinsPainter },
  "last-stop": { create: createLastStopWorld, paint: paintLastStop, createPainter: createLastStopPainter },
  "gravity-shift": { create: createGravityWorld, paint: paintGravity, createPainter: createGravityPainter },
  "sky-stack": { create: createSkyStackWorld, paint: paintSkyStack, createPainter: createSkyStackPainter },
  "press-run": { create: createPressWorld, paint: paintPress, createPainter: createPressPainter },
  "swing-post": { create: createSwingWorld, paint: paintSwing, createPainter: createSwingPainter },
  "toast-hop": { create: createToastWorld, paint: paintToast, createPainter: createToastPainter },
  "appliance-escape": { create: createApplianceWorld, paint: paintAppliance, createPainter: createAppliancePainter, prepare: prepareRapier },
  "dice-foundry": { create: createDiceWorld, paint: paintDice, createPainter: createDicePainter },
  "shadow-crew": { create: createShadowWorld, paint: paintShadow, createPainter: createShadowPainter },
  "temp-stunt": { create: createStuntWorld, paint: paintStunt, createPainter: createStuntPainter },
  "rule-smuggler": { create: createRuleWorld, paint: paintRules, createPainter: createRulePainter },
  "yesterday-express": { create: createYesterdayWorld, paint: paintYesterday, createPainter: createYesterdayPainter },
  "kitchen-defense": { create: createKitchenWorld, paint: paintKitchen, createPainter: createKitchenPainter },
  "rainline": { create: createRainlineWorld, paint: paintRainline, createPainter: createRainlinePainter },
  "ink-archive": { create: createInkWorld, paint: paintInk, createPainter: createInkPainter },
  "last-lift": { create: createLiftWorld, paint: paintLift, createPainter: createLiftPainter, prepare: prepareRapier },
});
