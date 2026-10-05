import type { ActionRequest, InteractionPlan, PolicyDecision } from "./types.ts";

export type Policy = (request: ActionRequest) => PolicyDecision;

export const defaultPolicy: Policy = (request) => {
  if (request.action.risk === "critical") {
    return { decision: "require_approval", reason: "Critical actions always need a human confirmation.", holdMs: 2500 };
  }
  if (request.action.risk === "high" || !request.action.reversible) {
    return { decision: "require_approval", reason: "This action has real-world or irreversible impact.", holdMs: 2000 };
  }
  if (request.action.risk === "medium") {
    return { decision: "require_approval", reason: "This action changes an external system.", holdMs: 1200 };
  }
  return { decision: "allow", reason: "This low-risk reversible action is allowed by local policy." };
};

export function interactionPlanFor(request: ActionRequest, holdMs = 2000): InteractionPlan {
  const category = request.action.category;
  const domainTone = category.startsWith("communication")
    ? "communication"
    : category.startsWith("calendar")
      ? "calendar"
      : category.startsWith("money")
        ? "money"
        : category.startsWith("file")
          ? "files"
          : category.startsWith("system")
            ? "system"
            : "general";
  return {
    profile: {
      id: "seal-duo",
      inputs: ["tap", "hold", "deny", "defer", "details"],
      outputs: ["ring", "screen", "audio"],
    },
    attention: request.action.risk === "high" || request.action.risk === "critical" ? "high" : "elevated",
    domainTone,
    holdMs,
    affordances: ["reveal", "approve_once", "deny", "defer"],
  };
}
