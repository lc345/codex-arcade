import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const manager = resolve("macos/scripts/manage-agent-stage-hooks.mjs");
test("installer preflight accepts a fresh home without creating hooks", async () => {
  const dir = await mkdtemp(join(tmpdir(), "stage-preflight-"));
  try {
    const file = join(dir, "hooks.json");
    execFileSync(process.execPath, [manager, "check", file]);
    await assert.rejects(readFile(file), { code: "ENOENT" });
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("invalid existing hooks fail before installation and remain untouched", async () => {
  const dir = await mkdtemp(join(tmpdir(), "stage-preflight-"));
  try {
    const file = join(dir, "hooks.json");
    for (const content of ['{"secret":"private-value",oops}', '[]', 'null', '{"hooks":[]}']) {
      await writeFile(file, content);
      const result = spawnSync(process.execPath, [manager, "check", file], { encoding: "utf8" });
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /hooks\.json/);
      assert.match(result.stderr, /Cannot read|Invalid/);
      assert.equal(result.stderr.includes("private-value"), false);
      assert.equal(await readFile(file, "utf8"), content);
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("installing twice and removing preserves unrelated hooks and settings", async () => {
  const dir = await mkdtemp(join(tmpdir(), "stage-preflight-"));
  try {
    const file = join(dir, "hooks.json");
    const initial = { metadata: { user: true }, hooks: { Stop: [{ hooks: [{ type: "command", command: "echo keep-me" }] }] } };
    await writeFile(file, JSON.stringify(initial));
    execFileSync(process.execPath, [manager, "check", file]);
    const command = '"/tmp/Space User/node" "/tmp/Space User/agent-stage-hook-collector.js"';
    execFileSync(process.execPath, [manager, "install", file, command]);
    const first = await readFile(file, "utf8");
    execFileSync(process.execPath, [manager, "install", file, command]);
    assert.equal(await readFile(file, "utf8"), first);
    execFileSync(process.execPath, [manager, "remove", file]);
    assert.deepEqual(JSON.parse(await readFile(file, "utf8")), initial);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
