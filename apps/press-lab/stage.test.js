import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createStageEventForLab } from "./stage.js";

const recipe = {
  id: "email-send",
  category: "communication.send",
  risk: "medium",
  holdMs: 1200,
  card: {
    title: "Send Q3 proposal",
    summary: "Email the Q3 proposal to Lina.",
    target: "Lina Zhang",
    impact: "One email will be delivered.",
  },
  stage: { actionKind: "email.send", channel: "email", actorLabel: "Youze", recipientLabel: "Lina Zhang", recipientCount: 1, actionSummary: "Send Q3 proposal" },
};

test("Stage Lab derives an email event from the trusted recipe and never leaks it in summary-only mode", () => {
  const event = createStageEventForLab({
    recipe,
    actionDigest: "d".repeat(64),
    status: "waiting",
    profile: "seal-duo",
    privacyMode: "summary-only",
    locale: "zh-CN",
    timeOfDay: "day",
  });

  assert.equal(event.descriptor.actionKind, "email.send");
  assert.equal(event.slots.recipientLabel, "一位收件人");
  assert.equal(event.contract.holdMs, 1200);
  assert.equal(JSON.stringify(event).includes("Lina"), false);
});

test("a file-share action keeps its descriptor while summary mode strips workspace details", () => {
  const fileShare = {
    ...recipe,
    id: "file-share",
    category: "file.share",
    card: { ...recipe.card, title: "Share the launch brief", target: "Product team workspace" },
    stage: { actionKind: "file.share", channel: "drive", actorLabel: "Youze", recipientLabel: "Product team workspace", recipientCount: 12, actionSummary: "Share the launch brief" },
  };
  const event = createStageEventForLab({
    recipe: fileShare,
    actionDigest: "e".repeat(64),
    status: "waiting",
    profile: "tap-three",
    privacyMode: "summary-only",
    locale: "zh-CN",
    timeOfDay: "day",
  });

  assert.equal(event.descriptor.actionKind, "file.share");
  assert.equal(event.category, "file.share");
  assert.equal(event.slots.recipientLabel, "12 位成员");
  assert.equal(event.slots.actionSummary, "一份文件");
  assert.equal(JSON.stringify(event).includes("Product team"), false);
});

test("the file-share recipe uses file.share so its dedicated scene can match", async () => {
  const fileShare = JSON.parse(await readFile(new URL("../../recipes/file-share/recipe.json", import.meta.url), "utf8"));
  const event = createStageEventForLab({
    recipe: fileShare,
    actionDigest: "1".repeat(64),
    status: "waiting",
    profile: "tap-three",
    privacyMode: "summary-only",
  });

  assert.equal(event.category, "file.share");
});

test("a deployment uses a production destination instead of a recipient label", () => {
  const deploy = {
    ...recipe,
    id: "deploy",
    category: "system.deploy",
    card: { ...recipe.card, target: "Production / web-api" },
    stage: { actionKind: "system.deploy", channel: "deployment", actorLabel: "Youze", recipientLabel: "Production / web-api", recipientCount: 0, actionSummary: "Deploy web-api" },
  };
  const event = createStageEventForLab({
    recipe: deploy,
    actionDigest: "f".repeat(64),
    status: "waiting",
    profile: "pulse",
    privacyMode: "summary-only",
    locale: "zh-CN",
    timeOfDay: "day",
  });

  assert.equal(event.slots.recipientLabel, "生产环境");
  assert.equal(JSON.stringify(event).includes("web-api"), false);
});
