function receipt(recipe, outcome, method, at, context = {}) {
  const status = outcome === "approve_once" ? "succeeded" : outcome === "deny" ? "denied" : outcome === "defer" ? "deferred" : "expired";
  const presentation = context.presentation
    ? {
      id: context.presentation.id,
      actionDigest: context.presentation.actionDigest,
      scene: context.presentation.scene,
      digest: context.presentation.digest,
    }
    : undefined;
  return {
    id: `rcpt_${recipe.id}_${at}`,
    request: {
      id: `req_${recipe.id}_${at}`,
      action: { id: recipe.category, category: recipe.category, risk: recipe.risk ?? "high" },
      card: recipe.card,
      ...(context.actionDigest ? { actionDigest: context.actionDigest } : {}),
    },
    decision: {
      outcome,
      method,
      createdAt: new Date(at).toISOString(),
      ...(context.actionDigest ? { actionDigest: context.actionDigest } : {}),
      ...(presentation ? { presentation } : {}),
    },
    status,
    createdAt: new Date(at).toISOString(),
    ...(context.presentation ? { presentation: context.presentation } : {}),
  };
}

export function createLabState(recipe, at = Date.now()) {
  return {
    recipe,
    status: "pending",
    createdAt: at,
    holdStartedAt: null,
    receipt: null,
  };
}

export function transition(state, event) {
  if (event.type === "RESET") return createLabState(event.recipe ?? state.recipe, event.at);
  if (event.type === "HOLD_START" && state.status === "pending") {
    return { ...state, status: "holding", holdStartedAt: event.at };
  }
  if (event.type === "HOLD_CANCEL" && state.status === "holding") {
    return { ...state, status: "pending", holdStartedAt: null };
  }
  if (event.type === "HOLD_COMPLETE" && state.status === "holding") {
    if (event.at - state.holdStartedAt < state.recipe.holdMs) return state;
    return { ...state, status: "succeeded", receipt: receipt(state.recipe, "approve_once", "hold", event.at, event) };
  }
  if (event.type === "TAP_SEQUENCE_COMPLETE" && state.status === "pending" && event.count === event.required) {
    return { ...state, status: "succeeded", receipt: receipt(state.recipe, "approve_once", event.method ?? "tap_sequence", event.at, event) };
  }
  if (event.type === "DENY" && (state.status === "pending" || state.status === "holding")) {
    return { ...state, status: "denied", holdStartedAt: null, receipt: receipt(state.recipe, "deny", event.method ?? "deny_button", event.at, event) };
  }
  if (event.type === "DEFER" && (state.status === "pending" || state.status === "holding")) {
    return { ...state, status: "deferred", holdStartedAt: null, receipt: receipt(state.recipe, "defer", event.method ?? "tap", event.at, event) };
  }
  if (event.type === "EXPIRE" && (state.status === "pending" || state.status === "holding")) {
    return { ...state, status: "expired", holdStartedAt: null, receipt: receipt(state.recipe, "expired", "system", event.at, event) };
  }
  return state;
}
