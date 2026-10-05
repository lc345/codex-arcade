import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createStageServer } from "./server.js";

test("the local Stage server uploads, selects, streams, and deletes user video without exposing a file path", async () => {
  const mediaDirectory = await mkdtemp(join(tmpdir(), "agent-stage-server-media-"));
  const stage = createStageServer({ root: process.cwd(), mediaDirectory, maxMediaBytes: 1024 * 1024 });
  const { port } = await stage.start({ port: 0 });
  const base = `http://127.0.0.1:${port}`;
  try {
    const uploaded = await fetch(`${base}/v1/media`, {
      method: "POST",
      headers: { "content-type": "video/mp4", "x-agent-stage-file-name": encodeURIComponent("my-short.mp4") },
      body: Buffer.from("local-video"),
    });
    const media = await uploaded.json();
    assert.equal(uploaded.status, 201);
    assert.match(media.id, /^[a-f0-9]{16}$/);
    assert.equal(JSON.stringify(media).includes(mediaDirectory), false);

    const selected = await fetch(`${base}/v1/media/selection`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: media.id }) });
    assert.equal(selected.status, 200);
    const selection = await fetch(`${base}/v1/media/selection`).then((response) => response.json());
    assert.equal(selection.id, media.id);

    const streamed = await fetch(`${base}/v1/media/${media.id}`);
    assert.equal(streamed.status, 200);
    assert.equal(streamed.headers.get("content-type"), "video/mp4");
    assert.equal(await streamed.text(), "local-video");

    assert.equal((await fetch(`${base}/v1/media/${media.id}`, { method: "DELETE" })).status, 204);
    assert.equal(await fetch(`${base}/v1/media/selection`).then((response) => response.json()), null);
  } finally {
    await stage.stop();
    await rm(mediaDirectory, { recursive: true, force: true });
  }
});
