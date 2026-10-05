import assert from "node:assert/strict";
import test from "node:test";

import { createScenePack, createStageEvent, StageRuntime } from "../../stage-core-ts/src/index.js";
import { createStageBridge } from "../src/index.js";

function stageEvent() {
  return createStageEvent({
    request: {
      actionDigest: "e".repeat(64),
      action: { category: "communication.send", risk: "medium" },
      card: { title: "Send proposal", summary: "Private", target: "Lina", impact: "One email" },
    },
    status: "waiting",
    contract: { holdMs: 1200, allowedOutcomes: ["approve_once", "deny", "defer"], deviceProfile: "seal-duo" },
    descriptor: { actionKind: "email.send", channel: "email", actorLabel: "Youze", recipientLabel: "Lina", recipientCount: 1, actionSummary: "Send proposal" },
    context: { privacyMode: "summary-only", locale: "zh-CN", timeOfDay: "day" },
  });
}

function runtime() {
  return new StageRuntime({ packs: [createScenePack({
    schemaVersion: "2",
    id: "mail-flight",
    version: "1.0.0",
    license: "Apache-2.0",
    locales: ["zh-CN"],
    assets: [],
    assetDigest: "a".repeat(64),
    contentDigest: "b".repeat(64),
    matches: { categories: ["communication.send"], states: ["waiting"] },
    variants: [{
      id: "ready",
      beats: [{ phase: "cue", commands: [{ channel: "light", token: "mail.ready", durationMs: 400 }] }],
      timeline: { durationMs: 600, tracks: [{ atMs: 0, command: "spawn", id: "mail", kind: "envelope", anchor: "actor" }] },
    }],
  })] });
}

test("Stage Bridge broadcasts descriptive presentations to virtual devices and forwards only semantic gestures", async () => {
  const delivered = [];
  const gestures = [];
  const bridge = createStageBridge({ runtime: runtime(), onGesture: (gesture) => gestures.push(gesture) });
  bridge.registerVirtualDevice({ id: "speakon-sim", capabilities: ["light", "audio", "haptic"], deliver: (message) => delivered.push(message) });

  const startedAt = performance.now();
  const presentation = await bridge.present(stageEvent());
  const deliveryMs = performance.now() - startedAt;
  bridge.receiveGesture({ deviceId: "speakon-sim", requestId: "req_mail", actionDigest: "e".repeat(64), gesture: "hold-start" });
  bridge.receiveGesture({ deviceId: "speakon-sim", requestId: "req_mail", actionDigest: "e".repeat(64), gesture: "tap" });

  assert.equal(delivered.length, 1);
  assert.equal(delivered[0].type, "stage.presentation");
  assert.equal(delivered[0].presentationId, presentation.record.id);
  assert.equal(delivered[0].decision, undefined);
  assert.ok(deliveryMs < 250, `expected a first device cue in under 250ms, got ${deliveryMs.toFixed(1)}ms`);
  assert.deepEqual(gestures, [
    { deviceId: "speakon-sim", requestId: "req_mail", actionDigest: "e".repeat(64), gesture: "hold-start" },
    { deviceId: "speakon-sim", requestId: "req_mail", actionDigest: "e".repeat(64), gesture: "tap" },
  ]);
});

test("Stage Bridge serves a local event endpoint without allowing the endpoint to mint a decision", async (t) => {
  const delivered = [];
  const bridge = createStageBridge({ runtime: runtime() });
  bridge.registerVirtualDevice({ id: "browser", capabilities: ["screen"], deliver: (message) => delivered.push(message) });
  const address = await bridge.start({ host: "127.0.0.1", port: 0 });
  t.after(() => bridge.stop());

  const response = await fetch(`http://${address.host}:${address.port}/v1/events`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ event: stageEvent() }),
  });
  const body = await response.json();

  assert.equal(response.status, 202);
  assert.equal(body.presentation.record.actionDigest, "e".repeat(64));
  assert.equal(body.decision, undefined);
  assert.equal(delivered.length, 1);
});
