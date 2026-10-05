const allowedCommands = new Set(["spawn", "move", "path", "fade", "scale", "text", "particle", "orbit", "pulse", "rotate", "shake"]);
const anchors = new Set(["center", "top", "bottom", "left", "right"]);

function nonEmpty(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must be a non-empty string`);
}

function stableStringify(value) {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean" || typeof value === "number") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
}

async function sha256(value) {
  const buffer = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function validTrack(track, durationMs) {
  if (!track || typeof track !== "object" || !allowedCommands.has(track.command)) throw new Error("Activity Story Pack contains an unsupported timeline command");
  if (!Number.isInteger(track.atMs) || track.atMs < 0 || track.atMs > durationMs) throw new Error("Activity timeline track must fit its duration");
  if (track.command === "spawn") {
    nonEmpty(track.id, "activity timeline spawn.id");
    nonEmpty(track.kind, "activity timeline spawn.kind");
    if (!anchors.has(track.anchor)) throw new Error("Activity timeline anchor is unsupported");
  }
  if (track.command === "text") throw new Error("Activity Story Packs cannot render arbitrary text slots");
  if (["move", "path"].includes(track.command) && (!anchors.has(track.from) || !anchors.has(track.to))) throw new Error("Activity timeline movement anchor is unsupported");
}

function validateChapter(chapter) {
  nonEmpty(chapter.id, "chapter.id");
  if (!Array.isArray(chapter.on) || chapter.on.length === 0 || chapter.on.some((type) => typeof type !== "string")) throw new Error("Activity chapters need lifecycle events");
  if (!chapter.timeline || !Number.isInteger(chapter.timeline.durationMs) || chapter.timeline.durationMs < 200 || chapter.timeline.durationMs > 8_000) {
    throw new Error("Activity timelines must last between 200ms and 8000ms");
  }
  if (chapter.timeline.loop !== undefined && typeof chapter.timeline.loop !== "boolean") throw new Error("Activity timeline.loop must be boolean");
  if (!Array.isArray(chapter.timeline.tracks) || chapter.timeline.tracks.length === 0 || chapter.timeline.tracks.length > 64) throw new Error("Activity timelines need tracks");
  chapter.timeline.tracks.forEach((track) => validTrack(track, chapter.timeline.durationMs));
}

export function createActivityStoryPack(input) {
  if (!input || input.schemaVersion !== "3") throw new Error("Activity Story Pack schemaVersion must be 3");
  nonEmpty(input.id, "id");
  nonEmpty(input.version, "version");
  nonEmpty(input.license, "license");
  if (!input.matches || !Array.isArray(input.matches.families) || input.matches.families.length === 0) throw new Error("Activity Story Packs need tool families");
  if (!Array.isArray(input.chapters) || input.chapters.length === 0) throw new Error("Activity Story Packs need chapters");
  input.chapters.forEach(validateChapter);
  return Object.freeze({ ...input, priority: input.priority ?? 0, __brand: "AgentStageActivityStoryPack" });
}

function pickPack(event, packs) {
  const eligible = packs.filter((pack) => pack.matches.families.includes(event.operation.family) || pack.matches.families.includes("*"));
  if (eligible.length === 0) throw new Error(`No Activity Story Pack matches ${event.operation.family}`);
  return [...eligible].sort((left, right) => right.priority - left.priority || left.id.localeCompare(right.id))[0];
}

export class ActivityStoryRuntime {
  constructor({ packs, now = () => new Date() } = {}) {
    this.packs = packs ?? [];
    this.now = now;
    this.packByRun = new Map();
  }

  async present(event) {
    const pack = this.packByRun.get(event.runId) ?? pickPack(event, this.packs);
    this.packByRun.set(event.runId, pack);
    const chapter = pack.chapters.find((candidate) => candidate.on.includes(event.type));
    if (!chapter) throw new Error(`Activity Story Pack ${pack.id} has no chapter for ${event.type}`);
    const timeline = { ...chapter.timeline, tracks: chapter.timeline.tracks.map((track) => ({ ...track })) };
    const renderedAt = this.now().toISOString();
    const unsignedRecord = {
      runId: event.runId,
      spanId: event.spanId,
      eventType: event.type,
      story: { packId: pack.id, packVersion: pack.version, chapterId: chapter.id },
      renderedAt,
      render: { stageVersion: "3", timelineDigest: await sha256(stableStringify(timeline)) },
    };
    const digest = await sha256(stableStringify(unsignedRecord));
    return { event, timeline, commands: [], record: { id: `activity_${digest.slice(0, 16)}`, ...unsignedRecord, digest } };
  }
}
