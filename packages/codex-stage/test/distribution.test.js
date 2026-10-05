import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, symlink, readdir, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { copyDistribution } from "../../../tools/distribution.mjs";

test("distribution CLI runs when launched through a filesystem alias", async () => {
  const tmp = await mkdtemp(join(tmpdir(), "stage-dist-cli-"));
  try {
    const source = join(tmp, "source"), destination = join(tmp, "payload");
    await mkdir(source);
    await writeFile(join(source, "README.md"), "release payload");
    const script = join(tmp, "copy release.mjs");
    await symlink(resolve("tools/distribution.mjs"), script);
    execFileSync(process.execPath, [script, source, destination]);
    assert.equal(await readFile(join(destination, "README.md"), "utf8"), "release payload");
  } finally { await rm(tmp, { recursive: true, force: true }); }
});

test("distribution copies only project payload, rejects symlinks and never includes local work", async () => {
  const tmp = await mkdtemp(join(tmpdir(), "stage-dist-"));
  const source = join(tmp, "source"), destination = join(tmp, "result");
  try {
    await mkdir(join(source, "apps"), { recursive: true });
    for (const name of ["README.md", "README.zh-CN.md", ".env", "apps/game.js", "apps/.env.local", "apps/.npmrc", "apps/hooks.json", "apps/daemon.json"]) await writeFile(join(source, name), name);
    for (const name of ["output", "outputs", "work", ".tools", "node_modules"]) {
      await mkdir(join(source, name)); await writeFile(join(source, name, "private.txt"), "private");
    }
    await copyDistribution(source, destination);
    assert.deepEqual((await readdir(destination)).sort(), ["README.md", "README.zh-CN.md", "apps"]);
    assert.deepEqual(await readdir(join(destination, "apps")), ["game.js"]);
    assert.equal(await readFile(join(destination, "apps/game.js"), "utf8"), "apps/game.js");
    await symlink(join(source, ".env"), join(source, "apps/leak"));
    await assert.rejects(copyDistribution(source, join(tmp, "second")), /symbolic link/);
    await assert.rejects(copyDistribution(source, source), /outside/);
  } finally { await rm(tmp, { recursive: true, force: true }); }
});
