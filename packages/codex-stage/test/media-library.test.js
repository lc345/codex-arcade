import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createMediaLibrary } from "../src/media-library.js";

async function withLibrary(run) {
  const directory = await mkdtemp(join(tmpdir(), "agent-stage-media-"));
  try {
    await run(createMediaLibrary({ directory, maxBytes: 1024 * 1024 }));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("a local video library stores opaque media ids and keeps source paths out of metadata", async () => {
  await withLibrary(async (library) => {
    const saved = await library.add({
      fileName: "private-vacation.mov",
      contentType: "video/quicktime",
      data: Buffer.from("not-a-real-mov-but-a-local-test"),
    });

    assert.match(saved.id, /^[a-f0-9]{16}$/);
    assert.equal(saved.contentType, "video/quicktime");
    assert.equal(saved.fileName, "private-vacation.mov");
    assert.equal(JSON.stringify(saved).includes(library.directory), false);
    assert.equal((await library.list()).length, 1);
    assert.equal(await readFile(await library.pathFor(saved.id), "utf8"), "not-a-real-mov-but-a-local-test");
  });
});

test("selection is local, replaceable, and cleared when a selected clip is removed", async () => {
  await withLibrary(async (library) => {
    const first = await library.add({ fileName: "first.mp4", contentType: "video/mp4", data: Buffer.from("first") });
    const second = await library.add({ fileName: "second.webm", contentType: "video/webm", data: Buffer.from("second") });

    assert.deepEqual(await library.select(first.id), first);
    assert.equal((await library.selection()).id, first.id);
    await library.select(second.id);
    assert.equal((await library.selection()).id, second.id);
    await library.remove(second.id);
    assert.equal(await library.selection(), null);
    assert.deepEqual((await library.list()).map((entry) => entry.id), [first.id]);
  });
});

test("the media library rejects unsupported files and enforces the configured byte ceiling", async () => {
  await withLibrary(async (library) => {
    await assert.rejects(
      library.add({ fileName: "notes.txt", contentType: "text/plain", data: Buffer.from("nope") }),
      /MP4, WebM, or MOV/,
    );
    await assert.rejects(
      library.add({ fileName: "long.mp4", contentType: "video/mp4", data: Buffer.alloc(1024 * 1024 + 1) }),
      /maximum size/,
    );
  });
});
