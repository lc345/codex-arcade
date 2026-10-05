import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createScenePack, createStageEvent, StageRuntime } from "../src/index.js";

const baseEvent = {
  actionDigest: "a".repeat(64),
  category: "communication.send",
  risk: "high" as const,
  status: "waiting" as const,
  card: {
    title: "Send proposal",
    summary: "Send the approved proposal to Alex.",
    target: "Alex Chen",
    impact: "One email will be delivered.",
  },
  contract: {
    holdMs: 2000,
    allowedOutcomes: ["approve_once", "deny", "defer"],
    deviceProfile: "seal-duo",
  },
  context: {
    timeOfDay: "day" as const,
    privacyMode: "summary-only" as const,
    recipientCount: 1,
  },
};

test("a Stage Pack cannot define, reorder, or weaken decision controls", () => {
  assert.throws(
    () => createScenePack({
      schemaVersion: "1",
      id: "unsafe-pack",
      version: "0.1.0",
      matches: { categories: ["communication.send"], states: ["waiting"] },
      variants: [{
        id: "skip-confirmation",
        beats: [{ phase: "decision", commands: [{ channel: "control", action: "approve_once" }] }],
      }],
    }),
    /control/i,
  );
});

test("a Scene changes expression but preserves the locked decision contract", async () => {
  const pack = createScenePack({
    schemaVersion: "1",
    id: "paper-courier",
    version: "0.1.0",
    matches: { categories: ["communication.send"], states: ["waiting"] },
    variants: [{
      id: "courier-stamp",
      beats: [
        { phase: "cue", commands: [{ channel: "light", token: "courier.departure", durationMs: 520 }] },
        { phase: "context", commands: [{ channel: "speech", template: "已整理 {{title}}，等待你的确认。", slots: ["title"] }] },
      ],
    }],
  });
  const runtime = new StageRuntime({ packs: [pack], now: () => new Date("2026-07-22T12:00:00.000Z") });

  const presentation = await runtime.present(baseEvent);

  assert.deepEqual(presentation.contract, baseEvent.contract);
  assert.equal(presentation.record.scene.packId, "paper-courier");
  assert.equal(presentation.commands[0].channel, "light");
});

test("the runtime selects a quiet night variant from facts without exposing private fields", async () => {
  const pack = createScenePack({
    schemaVersion: "1",
    id: "dispatch",
    version: "0.1.0",
    matches: { categories: ["communication.send"], states: ["succeeded"] },
    variants: [
      {
        id: "day-dispatch",
        when: [{ field: "timeOfDay", op: "eq", value: "day" }],
        beats: [{ phase: "resolution", commands: [{ channel: "speech", template: "消息已出发，下一站：{{target}}。", slots: ["target"] }] }],
      },
      {
        id: "quiet-night",
        when: [{ field: "timeOfDay", op: "eq", value: "night" }],
        beats: [{ phase: "resolution", commands: [{ channel: "light", token: "quiet.confirm", durationMs: 260 }] }],
      },
    ],
  });
  const runtime = new StageRuntime({ packs: [pack], now: () => new Date("2026-07-22T22:30:00.000Z") });

  const presentation = await runtime.present({ ...baseEvent, status: "succeeded", context: { ...baseEvent.context, timeOfDay: "night" } });

  assert.equal(presentation.record.scene.variantId, "quiet-night");
  assert.equal(presentation.commands.some((command) => command.channel === "speech"), false);
  assert.equal(presentation.record.transcript.includes("Alex Chen"), false);
});

test("a higher-priority contextual pack can replace a general theme without changing the contract", async () => {
  const general = createScenePack({
    schemaVersion: "1",
    id: "city-dispatch",
    version: "0.1.0",
    priority: 0,
    matches: { categories: ["communication.send"], states: ["succeeded"] },
    variants: [{
      id: "dispatch-complete",
      beats: [{ phase: "resolution", commands: [{ channel: "audio", cue: "dispatch.arrive" }] }],
    }],
  });
  const quiet = createScenePack({
    schemaVersion: "1",
    id: "quiet-night",
    version: "0.1.0",
    priority: 100,
    matches: { categories: ["communication.send"], states: ["succeeded"] },
    variants: [{
      id: "quiet-confirmation",
      when: [{ field: "timeOfDay", op: "eq", value: "night" }],
      beats: [{ phase: "resolution", commands: [{ channel: "light", token: "quiet.confirm", durationMs: 240 }] }],
    }],
  });
  const runtime = new StageRuntime({ packs: [general, quiet] });

  const presentation = await runtime.present({ ...baseEvent, status: "succeeded", context: { ...baseEvent.context, timeOfDay: "night" } });

  assert.equal(presentation.record.scene.packId, "quiet-night");
  assert.deepEqual(presentation.contract, baseEvent.contract);
});

test("a Presentation Record changes when the scene variant changes and is tied to the action digest", async () => {
  const pack = createScenePack({
    schemaVersion: "1",
    id: "mission-control",
    version: "0.1.0",
    matches: { categories: ["communication.send"], states: ["waiting"] },
    variants: [
      { id: "alpha", beats: [{ phase: "cue", commands: [{ channel: "light", token: "mission.ready", durationMs: 300 }] }] },
      { id: "beta", beats: [{ phase: "cue", commands: [{ channel: "light", token: "mission.hold", durationMs: 300 }] }] },
    ],
  });
  const runtime = new StageRuntime({ packs: [pack], now: () => new Date("2026-07-22T12:00:00.000Z") });

  const first = await runtime.present(baseEvent);
  const second = await runtime.present({ ...baseEvent, actionDigest: "b".repeat(64) });

  assert.equal(first.record.actionDigest, baseEvent.actionDigest);
  assert.notEqual(first.record.digest, second.record.digest);
  assert.notEqual(first.record.scene.variantId, second.record.scene.variantId);
});

test("summary privacy redacts every personal card field from a community template", async () => {
  const pack = createScenePack({
    schemaVersion: "1",
    id: "privacy-check",
    version: "0.1.0",
    matches: { categories: ["communication.send"], states: ["waiting"] },
    variants: [{
      id: "summary-only",
      beats: [{ phase: "context", commands: [{ channel: "screen", template: "{{title}} {{summary}} {{impact}} {{target}}", slots: ["title", "summary", "impact", "target"] }] }],
    }],
  });
  const runtime = new StageRuntime({ packs: [pack] });

  const presentation = await runtime.present(baseEvent);

  assert.equal(presentation.record.transcript.includes("Send proposal"), false);
  assert.equal(presentation.record.transcript.includes("Alex Chen"), false);
  assert.equal(presentation.record.transcript.includes("One email"), false);
  assert.match(presentation.record.transcript, /一条消息/);
});

test("the official packs are valid and cover every first-party recipe", async () => {
  const paths = [
    "../../../scene-packs/open-line/scene.json",
    "../../../scene-packs/city-dispatch/scene.json",
    "../../../scene-packs/paper-courier/scene.json",
    "../../../scene-packs/mission-control/scene.json",
    "../../../scene-packs/quiet-night/scene.json",
  ];
  const packs = await Promise.all(paths.map(async (path) => createScenePack(JSON.parse(await readFile(new URL(path, import.meta.url), "utf8")))));
  const runtime = new StageRuntime({ packs });

  for (const category of ["communication.call", "communication.send", "calendar.create", "system.deploy"]) {
    const presentation = await runtime.present({ ...baseEvent, category, status: "waiting" });
    assert.equal(presentation.contract.holdMs, 2000);
    assert.ok(presentation.record.scene.packId);
  }
});

test("a v2 presentation resolves only privacy-safe slots into its replayable timeline", async () => {
  const pack = createScenePack({
    schemaVersion: "2",
    id: "mail-flight",
    version: "1.0.0",
    license: "Apache-2.0",
    locales: ["zh-CN", "en"],
    assets: [],
    assetDigest: "a".repeat(64),
    contentDigest: "b".repeat(64),
    matches: { categories: ["communication.send"], states: ["succeeded"] },
    variants: [{
      id: "delivered",
      beats: [{ phase: "resolution", commands: [{ channel: "audio", cue: "mail.delivered" }] }],
      timeline: {
        durationMs: 1200,
        tracks: [
          { atMs: 0, command: "spawn", id: "envelope", kind: "envelope", anchor: "actor" },
          { atMs: 180, command: "path", id: "envelope", from: "actor", to: "recipient", arc: 0.2, durationMs: 780 },
          { atMs: 980, command: "text", id: "caption", slot: "recipientLabel", anchor: "recipient" },
        ],
      },
    }],
  });
  const event = createStageEvent({
    request: {
      actionDigest: "c".repeat(64),
      action: { category: "communication.send", risk: "medium" },
      card: { title: "Send proposal", summary: "Private proposal", target: "Alex Chen", impact: "One email" },
    },
    status: "succeeded",
    contract: baseEvent.contract,
    descriptor: { actionKind: "email.send", actorLabel: "Youze", recipientLabel: "Alex Chen", recipientCount: 1, channel: "email", actionSummary: "Send proposal" },
    context: { privacyMode: "summary-only", locale: "zh-CN", timeOfDay: "day" },
  });
  const runtime = new StageRuntime({ packs: [pack], now: () => new Date("2026-07-23T12:00:00.000Z") });

  const presentation = await runtime.present(event);

  assert.equal(presentation.timeline.durationMs, 1200);
  assert.equal(presentation.timeline.tracks[2].text, "一位收件人");
  assert.equal(JSON.stringify(presentation.timeline).includes("Alex Chen"), false);
  assert.equal(presentation.record.render.stageVersion, "2");
  assert.match(presentation.record.render.packContentDigest, /^[a-f0-9]{64}$/);
});
