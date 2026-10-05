const phases = new Set(["cue", "context", "preview", "decision", "resolution"]);
const conditionFields = new Set(["timeOfDay", "privacyMode", "recipientCount", "risk", "status"]);
const conditionOperators = new Set(["eq", "gt", "gte", "lt", "lte"]);
const timelineCommands = new Set(["spawn", "move", "path", "fade", "scale", "text", "particle", "holdProgress", "orbit", "pulse", "rotate", "shake"]);
const timelineAnchors = new Set(["actor", "recipient", "center", "top", "bottom", "left", "right"]);
const slotNames = new Set(["actorLabel", "recipientLabel", "recipientCount", "actionSummary", "status"]);
const assetExtensions = new Set([".png", ".webp", ".svg", ".wav", ".mp3"]);

function nonEmpty(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(label + " must be a non-empty string");
}

function validateCondition(condition) {
  if (!conditionFields.has(condition.field)) throw new Error("Unsupported scene condition field: " + String(condition.field));
  if (!conditionOperators.has(condition.op)) throw new Error("Unsupported scene condition operator: " + String(condition.op));
  if (typeof condition.value !== "string" && typeof condition.value !== "number") throw new Error("Scene condition values must be strings or numbers");
}

function validateCommand(command) {
  if (!command || typeof command !== "object") throw new Error("Scene commands must be objects");
  if (!["light", "audio", "speech", "screen"].includes(command.channel)) {
    throw new Error("Scene Packs cannot define control commands");
  }
  if (command.channel === "light") {
    nonEmpty(command.token, "light.token");
    if (!Number.isInteger(command.durationMs) || command.durationMs < 0 || command.durationMs > 10_000) {
      throw new Error("light.durationMs must be an integer between 0 and 10000");
    }
  }
  if (command.channel === "audio") {
    nonEmpty(command.cue, "audio.cue");
    if (command.gain && !["quiet", "normal"].includes(command.gain)) throw new Error("audio.gain must be quiet or normal");
  }
  if (command.channel === "speech" || command.channel === "screen") {
    nonEmpty(command.template, command.channel + ".template");
    if (!Array.isArray(command.slots) || command.slots.some((slot) => typeof slot !== "string")) {
      throw new Error(command.channel + ".slots must be an array of strings");
    }
  }
}

function validateVariant(variant) {
  nonEmpty(variant.id, "variant.id");
  if (variant.when) variant.when.forEach(validateCondition);
  if (!Array.isArray(variant.beats) || variant.beats.length === 0) throw new Error("Scene variants need at least one beat");
  for (const beat of variant.beats) {
    if (!phases.has(beat.phase)) throw new Error("Unsupported stage phase: " + String(beat.phase));
    if (!Array.isArray(beat.commands) || beat.commands.length === 0) throw new Error("Scene beats need at least one command");
    beat.commands.forEach(validateCommand);
  }
}

function isNightVariant(variant) {
  return variant.when?.some((condition) => condition.field === "timeOfDay" && condition.op === "eq" && condition.value === "night") ?? false;
}

function validateAsset(asset) {
  if (!asset || typeof asset !== "object") throw new Error("Scene assets must be objects");
  nonEmpty(asset.id, "asset.id");
  nonEmpty(asset.path, "asset.path");
  if (!asset.path.startsWith("assets/") || asset.path.includes("..") || /^https?:/i.test(asset.path)) {
    throw new Error("Scene assets must use local assets/ paths without remote URLs");
  }
  const extension = asset.path.slice(asset.path.lastIndexOf(".")).toLowerCase();
  if (!assetExtensions.has(extension)) throw new Error("Scene assets must be PNG, WebP, SVG, WAV, or MP3 files");
  if (!["image", "vector", "audio"].includes(asset.type)) throw new Error("Scene asset type must be image, vector, or audio");
  if (asset.sha256 !== undefined && (typeof asset.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(asset.sha256))) {
    throw new Error("Scene asset sha256 must be a lowercase SHA-256 digest");
  }
}

function validateTimelineTrack(track, durationMs) {
  if (!track || typeof track !== "object") throw new Error("Timeline tracks must be objects");
  if (!Number.isInteger(track.atMs) || track.atMs < 0 || track.atMs > durationMs) throw new Error("timeline atMs must fit within durationMs");
  if (!timelineCommands.has(track.command)) throw new Error("Unsupported timeline command");
  if (track.command === "spawn") {
    nonEmpty(track.id, "timeline spawn.id");
    nonEmpty(track.kind, "timeline spawn.kind");
    if (!timelineAnchors.has(track.anchor)) throw new Error("timeline spawn.anchor is unsupported");
  }
  if (track.command === "move" || track.command === "path") {
    nonEmpty(track.id, "timeline movement.id");
    if (!timelineAnchors.has(track.from) || !timelineAnchors.has(track.to)) throw new Error("timeline movement anchors are unsupported");
    if (!Number.isInteger(track.durationMs) || track.durationMs < 0 || track.atMs + track.durationMs > durationMs) {
      throw new Error("timeline movement duration must fit within durationMs");
    }
  }
  if (track.command === "path" && (typeof track.arc !== "number" || track.arc < -1 || track.arc > 1)) {
    throw new Error("timeline path.arc must be between -1 and 1");
  }
  if (track.command === "fade" || track.command === "scale") {
    nonEmpty(track.id, `timeline ${track.command}.id`);
    if (typeof track.to !== "number") throw new Error(`timeline ${track.command}.to must be numeric`);
  }
  if (track.command === "orbit") {
    nonEmpty(track.id, "timeline orbit.id");
    if (!timelineAnchors.has(track.anchor)) throw new Error("timeline orbit.anchor is unsupported");
    if (typeof track.radius !== "number" || track.radius < 0 || track.radius > 1) throw new Error("timeline orbit.radius must be between 0 and 1");
    if (typeof track.turns !== "number" || track.turns < -6 || track.turns > 6) throw new Error("timeline orbit.turns must be between -6 and 6");
    if (!Number.isInteger(track.durationMs) || track.durationMs < 0 || track.atMs + track.durationMs > durationMs) {
      throw new Error("timeline orbit duration must fit within durationMs");
    }
  }
  if (track.command === "pulse") {
    nonEmpty(track.id, "timeline pulse.id");
    if (typeof track.to !== "number" || track.to < 0 || track.to > 4) throw new Error("timeline pulse.to must be between 0 and 4");
    if (!Number.isInteger(track.count) || track.count < 1 || track.count > 8) throw new Error("timeline pulse.count must be an integer between 1 and 8");
    if (!Number.isInteger(track.durationMs) || track.durationMs < 0 || track.atMs + track.durationMs > durationMs) {
      throw new Error("timeline pulse duration must fit within durationMs");
    }
  }
  if (track.command === "rotate") {
    nonEmpty(track.id, "timeline rotate.id");
    if (typeof track.turns !== "number" || track.turns < -6 || track.turns > 6) throw new Error("timeline rotate.turns must be between -6 and 6");
    if (!Number.isInteger(track.durationMs) || track.durationMs < 0 || track.atMs + track.durationMs > durationMs) {
      throw new Error("timeline rotate duration must fit within durationMs");
    }
  }
  if (track.command === "shake") {
    nonEmpty(track.id, "timeline shake.id");
    if (typeof track.amplitude !== "number" || track.amplitude < 0 || track.amplitude > 100) throw new Error("timeline shake.amplitude must be between 0 and 100");
    if (!Number.isInteger(track.durationMs) || track.durationMs < 0 || track.atMs + track.durationMs > durationMs) {
      throw new Error("timeline shake duration must fit within durationMs");
    }
  }
  if (track.command === "text") {
    nonEmpty(track.id, "timeline text.id");
    if (!slotNames.has(track.slot)) throw new Error("timeline text.slot is not an allowed privacy-safe slot");
    if (!timelineAnchors.has(track.anchor)) throw new Error("timeline text.anchor is unsupported");
  }
  if (track.command === "particle") {
    nonEmpty(track.id, "timeline particle.id");
    if (!timelineAnchors.has(track.anchor)) throw new Error("timeline particle.anchor is unsupported");
  }
  if (track.command === "holdProgress") {
    nonEmpty(track.id, "timeline holdProgress.id");
  }
}

function validateTimeline(variant) {
  const timeline = variant.timeline;
  if (!timeline || typeof timeline !== "object") throw new Error("v2 Scene variants need a timeline");
  if (!Number.isInteger(timeline.durationMs) || timeline.durationMs < 0 || timeline.durationMs > 8_000) {
    throw new Error("timeline.durationMs must be an integer between 0 and 8000");
  }
  if (isNightVariant(variant) && timeline.durationMs > 1_000) throw new Error("night timelines cannot exceed 1000ms");
  if (!Array.isArray(timeline.tracks) || timeline.tracks.length === 0 || timeline.tracks.length > 64) {
    throw new Error("timeline.tracks must contain between 1 and 64 tracks");
  }
  timeline.tracks.forEach((track) => validateTimelineTrack(track, timeline.durationMs));
}

export function createScenePack(input) {
  if (input.schemaVersion !== "1" && input.schemaVersion !== "2") throw new Error("Scene Pack schemaVersion must be 1 or 2");
  nonEmpty(input.id, "id");
  nonEmpty(input.version, "version");
  if (input.priority !== undefined && (!Number.isInteger(input.priority) || input.priority < -1_000 || input.priority > 1_000)) {
    throw new Error("Scene Pack priority must be an integer between -1000 and 1000");
  }
  if (!input.matches || !Array.isArray(input.matches.categories) || input.matches.categories.length === 0) {
    throw new Error("Scene Packs need at least one category match");
  }
  if (!Array.isArray(input.matches.states) || input.matches.states.length === 0) {
    throw new Error("Scene Packs need at least one state match");
  }
  if (!Array.isArray(input.variants) || input.variants.length === 0) throw new Error("Scene Packs need at least one variant");
  input.variants.forEach(validateVariant);
  if (input.schemaVersion === "2") {
    nonEmpty(input.license, "license");
    if (!Array.isArray(input.locales) || input.locales.length === 0 || input.locales.some((locale) => typeof locale !== "string" || !locale)) {
      throw new Error("v2 Scene Packs need supported locales");
    }
    if (!Array.isArray(input.assets)) throw new Error("v2 Scene Packs need an assets array");
    input.assets.forEach(validateAsset);
    if (typeof input.assetDigest !== "string" || !/^[a-f0-9]{64}$/.test(input.assetDigest)) {
      throw new Error("v2 Scene Pack assetDigest must be a lowercase SHA-256 digest");
    }
    if (typeof input.contentDigest !== "string" || !/^[a-f0-9]{64}$/.test(input.contentDigest)) {
      throw new Error("v2 Scene Pack contentDigest must be a lowercase SHA-256 digest");
    }
    input.variants.forEach(validateTimeline);
  }
  return Object.freeze({ ...input, priority: input.priority ?? 0, __brand: "FinalButtonScenePack" });
}

function valueFor(event, field) {
  if (field === "timeOfDay") return event.context.timeOfDay;
  if (field === "privacyMode") return event.context.privacyMode;
  if (field === "recipientCount") return event.context.recipientCount;
  if (field === "risk") return event.risk;
  return event.status;
}

export function conditionMatches(event, condition) {
  const actual = valueFor(event, condition.field);
  if (actual === undefined) return false;
  if (condition.op === "eq") return actual === condition.value;
  if (typeof actual !== "number" || typeof condition.value !== "number") return false;
  if (condition.op === "gt") return actual > condition.value;
  if (condition.op === "gte") return actual >= condition.value;
  if (condition.op === "lt") return actual < condition.value;
  return actual <= condition.value;
}

export function packMatches(event, pack) {
  return pack.matches.categories.includes(event.category) && pack.matches.states.includes(event.status);
}

export function variantMatches(event, variant) {
  return !variant.when || variant.when.every((condition) => conditionMatches(event, condition));
}
