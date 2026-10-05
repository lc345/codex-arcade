import assert from "node:assert/strict";
import test from "node:test";

import { createScenePack } from "../src/index.js";

const basePack = {
  schemaVersion: "2",
  id: "mail-flight",
  version: "1.0.0",
  license: "Apache-2.0",
  locales: ["zh-CN", "en"],
  assets: [],
  assetDigest: "a".repeat(64),
  contentDigest: "b".repeat(64),
  matches: { categories: ["communication.send"], states: ["waiting"] },
  variants: [{
    id: "mail-ready",
    beats: [{ phase: "cue", commands: [{ channel: "light", token: "mail.ready", durationMs: 480 }] }],
    timeline: {
      durationMs: 1600,
      tracks: [
        { atMs: 0, command: "spawn", id: "envelope", kind: "envelope", anchor: "actor" },
        { atMs: 240, command: "path", id: "envelope", from: "actor", to: "recipient", arc: 0.24, durationMs: 980 },
        { atMs: 1280, command: "text", id: "caption", slot: "actionSummary", anchor: "recipient" },
      ],
    },
  }],
};

test("a v2 Scene Pack accepts a bounded declarative visual timeline", () => {
  const pack = createScenePack(basePack);

  assert.equal(pack.schemaVersion, "2");
  assert.equal(pack.variants[0].timeline.tracks[1].command, "path");
});

test("a v2 Scene Pack requires content and asset digest declarations", () => {
  const { assetDigest, ...withoutAssetDigest } = basePack;
  const { contentDigest, ...withoutContentDigest } = basePack;

  assert.throws(() => createScenePack(withoutAssetDigest), /assetDigest/i);
  assert.throws(() => createScenePack(withoutContentDigest), /contentDigest/i);
});

test("a v2 Scene Pack rejects remote, executable, and control-shaped content", () => {
  assert.throws(
    () => createScenePack({ ...basePack, assets: [{ id: "bad", path: "https://example.com/track.mp3", type: "audio" }] }),
    /local|remote/i,
  );
  assert.throws(
    () => createScenePack({
      ...basePack,
      variants: [{
        ...basePack.variants[0],
        timeline: { durationMs: 2000, tracks: [{ atMs: 0, command: "script", source: "approve()" }] },
      }],
    }),
    /timeline command/i,
  );
  assert.throws(
    () => createScenePack({ ...basePack, variants: [{ ...basePack.variants[0], beats: [{ phase: "decision", commands: [{ channel: "control", action: "approve_once" }] }] }] }),
    /control/i,
  );
});

test("a v2 Scene Pack rejects a normal timeline that exceeds the eight-second budget", () => {
  assert.throws(
    () => createScenePack({ ...basePack, variants: [{ ...basePack.variants[0], timeline: { ...basePack.variants[0].timeline, durationMs: 8001 } }] }),
    /8000/i,
  );
});
