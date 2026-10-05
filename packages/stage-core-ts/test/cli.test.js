import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { simulatePack, verifyStagePackDirectory } from "../src/cli.js";

const pack = {
  schemaVersion: "2",
  id: "cli-test-pack",
  version: "0.1.0",
  priority: 0,
  license: "Apache-2.0",
  locales: ["en"],
  assets: [],
  matches: { categories: ["communication.send"], states: ["waiting"] },
  variants: [{
    id: "ready",
    when: [{ field: "status", op: "eq", value: "waiting" }],
    beats: [{ phase: "cue", commands: [{ channel: "light", token: "test.ready", durationMs: 100 }] }],
    timeline: {
      durationMs: 300,
      tracks: [
        { atMs: 0, command: "spawn", id: "envelope", kind: "envelope", anchor: "actor" },
        { atMs: 10, command: "text", id: "caption", slot: "actionSummary", anchor: "center" },
      ],
    },
  }],
};

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
}

function digest(value) {
  return createHash("sha256").update(Buffer.isBuffer(value) ? value : stableStringify(value)).digest("hex");
}

function withDigests(value) {
  const assetDigest = digest(value.assets.map(({ id, path, type, sha256 }) => ({ id, path, type, sha256 })));
  const content = { ...value, assetDigest };
  return { ...content, contentDigest: digest(content) };
}

async function makePackDirectory() {
  const directory = await mkdtemp(join(tmpdir(), "agent-stage-pack-"));
  await writeFile(join(directory, "scene.json"), JSON.stringify(withDigests(pack), null, 2));
  await writeFile(join(directory, "preview.json"), JSON.stringify({ event: { status: "waiting" } }, null, 2));
  await writeFile(join(directory, "README.md"), "# CLI test pack\n");
  await writeFile(join(directory, "LICENSE"), "Apache-2.0\n");
  return directory;
}

test("Stage Pack directory verification requires the shareable v2 bundle files", async () => {
  const directory = await makePackDirectory();
  const result = await verifyStagePackDirectory(directory);

  assert.equal(result.pack.id, "cli-test-pack");
  assert.equal(result.preview.event.status, "waiting");
});

test("Stage Pack directory verification checks declared asset files", async () => {
  const directory = await makePackDirectory();
  await mkdir(join(directory, "assets"));
  const scene = withDigests({ ...pack, assets: [{ id: "tone", path: "assets/tone.wav", type: "audio", sha256: "a".repeat(64) }] });
  await writeFile(join(directory, "scene.json"), JSON.stringify(scene, null, 2));

  await assert.rejects(() => verifyStagePackDirectory(directory), /missing asset/i);
});

test("Stage Pack directory verification rejects changed asset or content digests", async () => {
  const directory = await makePackDirectory();
  const raw = withDigests({ ...pack });
  await writeFile(join(directory, "scene.json"), JSON.stringify({ ...raw, contentDigest: "0".repeat(64) }, null, 2));

  await assert.rejects(() => verifyStagePackDirectory(directory), /content digest/i);
});

test("Stage Pack directory verification rejects a changed local asset", async () => {
  const directory = await makePackDirectory();
  await mkdir(join(directory, "assets"));
  const tone = Buffer.from("original-tone");
  await writeFile(join(directory, "assets", "tone.wav"), tone);
  const scene = withDigests({
    ...pack,
    assets: [{ id: "tone", path: "assets/tone.wav", type: "audio", sha256: digest(tone) }],
  });
  await writeFile(join(directory, "scene.json"), JSON.stringify(scene, null, 2));
  await verifyStagePackDirectory(directory);
  await writeFile(join(directory, "assets", "tone.wav"), "changed-tone");

  await assert.rejects(() => verifyStagePackDirectory(directory), /asset digest mismatch/i);
});

test("simulatePack derives a privacy-safe presentation without an approval decision", async () => {
  const directory = await makePackDirectory();
  const result = await simulatePack(directory, { status: "waiting", privacyMode: "summary-only" });

  assert.equal(result.event.slots.recipientLabel, "一位收件人");
  assert.equal(result.presentation.record.scene.packId, "cli-test-pack");
  assert.equal(result.presentation.contract.holdMs, 1200);
});
