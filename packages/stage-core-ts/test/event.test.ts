import assert from "node:assert/strict";
import test from "node:test";

import { createStageEvent } from "../src/index.js";

const request = {
  id: "req_mail",
  actionDigest: "a".repeat(64),
  action: {
    category: "communication.send",
    risk: "medium",
  },
  card: {
    title: "Send Q3 proposal",
    summary: "Send the Q3 proposal to Lina.",
    target: "Lina Zhang <lina@example.com>",
    impact: "One email will be delivered.",
  },
};

const contract = {
  holdMs: 1200,
  allowedOutcomes: ["approve_once", "deny", "defer"],
  deviceProfile: "seal-duo",
};

test("a StageEvent redacts sender, recipient, and summary slots in summary-only mode", () => {
  const event = createStageEvent({
    request,
    status: "waiting",
    contract,
    descriptor: {
      actionKind: "email.send",
      actorLabel: "Youze",
      recipientLabel: "Lina Zhang",
      recipientCount: 1,
      channel: "email",
      actionSummary: "Send the Q3 proposal",
    },
    context: { privacyMode: "summary-only", locale: "zh-CN", timeOfDay: "day" },
  });

  assert.equal(event.slots.actorLabel, "你");
  assert.equal(event.slots.recipientLabel, "一位收件人");
  assert.equal(event.slots.actionSummary, "一封邮件");
  assert.equal(event.slots.recipientCount, "1");
  assert.equal(JSON.stringify(event).includes("Lina"), false);
  assert.equal(JSON.stringify(event).includes("Q3 proposal"), false);
});

test("a StageEvent exposes trusted display slots only when full privacy is selected", () => {
  const event = createStageEvent({
    request,
    status: "succeeded",
    contract,
    descriptor: {
      actionKind: "email.send",
      actorLabel: "Youze",
      recipientLabel: "Lina Zhang",
      recipientCount: 1,
      channel: "email",
      actionSummary: "Send the Q3 proposal",
    },
    context: { privacyMode: "full", locale: "en", timeOfDay: "day" },
  });

  assert.equal(event.slots.actorLabel, "Youze");
  assert.equal(event.slots.recipientLabel, "Lina Zhang");
  assert.equal(event.slots.actionSummary, "Send the Q3 proposal");
  assert.equal(event.descriptor.channel, "email");
});
