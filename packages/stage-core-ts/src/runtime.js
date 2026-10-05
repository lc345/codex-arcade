import { packMatches, variantMatches } from "./pack.js";

function stableStringify(value) {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean" || typeof value === "number") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  return "{" + Object.keys(value).sort().map((key) => JSON.stringify(key) + ":" + stableStringify(value[key])).join(",") + "}";
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const buffer = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function selectionIndex(seed, length) {
  return Number.parseInt(seed.slice(0, 8), 16) % length;
}

function privateActionLabel(category) {
  const labels = {
    "email.send": "一封邮件",
    "communication.call": "一通外呼",
    "communication.send": "一条消息",
    "calendar.create": "一项日程",
    "system.deploy": "一次部署",
    "file.share": "一份文件",
  };
  return labels[category] ?? "一项行动";
}

function renderSlot(event, slot) {
  if (event.slots && Object.hasOwn(event.slots, slot)) return event.slots[slot];
  const privateLabel = privateActionLabel(event.category);
  const summaryOnly = event.context.privacyMode !== "full";
  const values = {
    title: summaryOnly ? privateLabel : event.card.title,
    summary: summaryOnly ? "详情已隐藏" : event.card.summary,
    impact: summaryOnly ? "将执行一次已确认的外部操作" : event.card.impact,
    target: summaryOnly ? "一位收件人" : event.card.target,
    recipient_count: String(event.context.recipientCount ?? 0),
  };
  return values[slot] ?? "";
}

function renderTemplate(event, template, slots) {
  return slots.reduce((result, slot) => result.replaceAll("{{" + slot + "}}", renderSlot(event, slot)), template);
}

function resolveCommands(event, variant) {
  return variant.beats.flatMap((beat) => beat.commands.map((command) => {
    if (command.channel === "light") return { phase: beat.phase, channel: "light", token: command.token, durationMs: command.durationMs };
    if (command.channel === "audio") return { phase: beat.phase, channel: "audio", cue: command.cue, gain: command.gain ?? "normal" };
    if (command.channel === "speech") return { phase: beat.phase, channel: "speech", text: renderTemplate(event, command.template, command.slots) };
    return { phase: beat.phase, channel: "screen", text: renderTemplate(event, command.template, command.slots) };
  }));
}

function transcriptFor(commands) {
  return commands
    .filter((command) => command.channel === "speech" || command.channel === "screen")
    .map((command) => command.text)
    .join("\n");
}

function resolveTimeline(event, variant) {
  if (!variant.timeline) return undefined;
  return {
    durationMs: variant.timeline.durationMs,
    tracks: variant.timeline.tracks.map((track) => {
      if (track.command !== "text") return { ...track };
      return { ...track, text: renderSlot(event, track.slot) };
    }),
  };
}

function timelineTranscript(timeline) {
  if (!timeline) return "";
  return timeline.tracks
    .filter((track) => track.command === "text")
    .map((track) => track.text)
    .join("\n");
}

export class StageRuntime {
  constructor(options) {
    this.packs = options.packs;
    this.now = options.now ?? (() => new Date());
    this.recentVariants = new Map();
  }

  async present(event) {
    const candidates = this.packs
      .map((pack, index) => ({ pack, index, eligible: pack.variants.filter((variant) => packMatches(event, pack) && variantMatches(event, variant)) }))
      .filter((candidate) => candidate.eligible.length > 0)
      .sort((left, right) => right.pack.priority - left.pack.priority || left.index - right.index);
    if (candidates.length === 0) throw new Error("No Stage Pack matches " + event.category + "/" + event.status);
    const { pack, eligible } = candidates[0];
    const historyKey = event.category + ":" + event.status + ":" + pack.id;
    const start = selectionIndex(event.context?.selectionSeed ?? event.actionDigest, eligible.length);
    const previous = this.recentVariants.get(historyKey);
    const variant = eligible.find((candidate, index) => index >= start && candidate.id !== previous)
      ?? eligible.find((candidate) => candidate.id !== previous)
      ?? eligible[start];
    this.recentVariants.set(historyKey, variant.id);

    const commands = resolveCommands(event, variant);
    const timeline = resolveTimeline(event, variant);
    const renderedAt = this.now().toISOString();
    const transcript = [transcriptFor(commands), timelineTranscript(timeline)].filter(Boolean).join("\n");
    const transcriptDigest = await sha256(transcript);
    const render = pack.schemaVersion === "2"
      ? {
        stageVersion: "2",
        packContentDigest: pack.contentDigest ?? await sha256(stableStringify(pack)),
        assetDigest: pack.assetDigest ?? await sha256(stableStringify(pack.assets)),
        timelineDigest: await sha256(stableStringify(timeline)),
      }
      : undefined;
    const unsignedRecord = {
      actionDigest: event.actionDigest,
      scene: { packId: pack.id, packVersion: pack.version, variantId: variant.id },
      contract: event.contract,
      transcript,
      transcriptDigest,
      renderedAt,
      ...(render ? { render } : {}),
    };
    const digest = await sha256(stableStringify(unsignedRecord));
    return {
      contract: event.contract,
      commands,
      ...(timeline ? { timeline } : {}),
      record: {
        id: "presentation_" + digest.slice(0, 16),
        ...unsignedRecord,
        digest,
      },
    };
  }
}
