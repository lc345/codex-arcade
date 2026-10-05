const inputTypes = new Set(["button.down", "button.up", "tap", "doubleTap", "longPress", "idle.started", "idle.ended"]);

/** Reserved for future Speakon play modes; never used to approve or steer an Agent. */
export function createInputEvent(input) {
  if (!input || typeof input !== "object" || !inputTypes.has(input.type)) throw new Error("Unsupported Agent Stage input event");
  if (typeof input.deviceId !== "string" || !input.deviceId.trim()) throw new Error("Input events need a deviceId");
  if (!Number.isInteger(input.sequence) || input.sequence < 1) throw new Error("Input events need a positive sequence");
  if (!["idle", "play"].includes(input.mode)) throw new Error("Input events need an idle or play mode");
  return Object.freeze({ protocolVersion: "0.1", type: input.type, deviceId: input.deviceId, sequence: input.sequence, mode: input.mode, emittedAt: input.emittedAt ?? new Date().toISOString() });
}
