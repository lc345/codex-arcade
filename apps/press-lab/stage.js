import { createStageEvent } from "../../packages/stage-core-ts/src/index.js";

function defaultStageDescriptor(recipe) {
  const recipientCount = Number(recipe.card.impact.match(/\b(\d+)\b/)?.[1] ?? 1);
  return {
    actionKind: recipe.category === "communication.send" ? "email.send" : recipe.category,
    channel: recipe.category === "communication.send" ? "email" : "generic",
    actorLabel: "You",
    recipientLabel: recipe.card.target,
    recipientCount,
    actionSummary: recipe.card.title,
  };
}

export function createStageEventForLab({ recipe, actionDigest, status, profile, privacyMode, locale = "zh-CN", timeOfDay = "day", reducedMotion = false }) {
  return createStageEvent({
    request: {
      actionDigest,
      action: { category: recipe.category, risk: recipe.risk },
      card: recipe.card,
    },
    status,
    contract: {
      holdMs: recipe.holdMs,
      allowedOutcomes: ["approve_once", "deny", "defer"],
      deviceProfile: profile,
    },
    descriptor: recipe.stage ?? defaultStageDescriptor(recipe),
    context: {
      privacyMode,
      locale,
      timeOfDay,
      reducedMotion,
      deviceCapabilities: ["screen", "light", "audio", "haptic"],
      selectionSeed: actionDigest,
    },
  });
}
