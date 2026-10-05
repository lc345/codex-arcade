import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

test("web preview CLI starts through aliases and paths requiring URL encoding", async () => {
  const dir = await mkdtemp(join(tmpdir(), "stage-entry-"));
  let child;
  try {
    const entry = join(dir, "game preview #1.mjs");
    await symlink(resolve("apps/press-lab/server.js"), entry);
    child = spawn(process.execPath, [entry], { env: { ...process.env, PORT: "0" }, stdio: ["ignore", "pipe", "pipe"] });
    const origin = await new Promise((accept, reject) => {
      let output = "", errors = "";
      const timer = setTimeout(() => reject(new Error("Preview did not start")), 5000);
      child.stderr.on("data", data => errors += data);
      child.once("error", error => { clearTimeout(timer); reject(error); });
      child.once("exit", code => { clearTimeout(timer); reject(new Error(`Preview exited ${code}: ${errors}`)); });
      child.stdout.on("data", data => {
        output += data;
        const match = output.match(/http:\/\/127\.0\.0\.1:\d+/);
        if (match) { clearTimeout(timer); accept(match[0]); }
      });
    });
    const response = await fetch(`${origin}/codex-stage`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /stage-canvas/);
  } finally {
    if (child?.exitCode === null && child.signalCode === null) { const closed = new Promise(r => child.once("exit", r)); child.kill(); await closed; }
    await rm(dir, { recursive: true, force: true });
  }
});
