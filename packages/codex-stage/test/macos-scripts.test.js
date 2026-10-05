import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

test("the installed UI receives interactive scheduling rather than background throttling", async () => {
  const dir = await mkdtemp(resolve(tmpdir(), "agent-stage-plist-"));
  try {
    const path = resolve(dir, "agent.plist");
    execFileSync(process.execPath, ["macos/scripts/write-launch-agent.mjs", path, "/tmp/Stage & Games", process.execPath, "9341", "/tmp/stage.log"]);
    const plist = await readFile(path, "utf8");
    assert.match(plist, /<key>ProcessType<\/key>\s*<string>Interactive<\/string>/);
    assert.match(plist, /Stage &amp; Games/);
    assert.doesNotMatch(plist, /NSAppSleepDisabled/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("the macOS launcher delegates the local companion to a user LaunchAgent", async () => {
  const startScript = await readFile(resolve("macos/scripts/start-agent-stage-macos.sh"), "utf8");
  const installScript = await readFile(resolve("macos/scripts/install-agent-stage-macos.sh"), "utf8");
  const launcher = await readFile(resolve("macos/scripts/agent-stage-launcher.sh"), "utf8");
  const plistWriter = await readFile(resolve("macos/scripts/write-launch-agent.mjs"), "utf8");
  const hookTrust = await readFile(resolve("macos/scripts/trust-agent-stage-hooks.mjs"), "utf8");

  assert.match(startScript, /launchctl bootstrap "\$GUI_DOMAIN"/);
  assert.match(startScript, /for _ in \$\(seq 1 5\)/);
  assert.match(startScript, /s\.eventLoopRunning===true/);
  assert.match(startScript, /ROOT="\$\{AGENT_STAGE_RUNTIME_ROOT:-\$HOME\/\.codex\/agent-stage\}"/);
  assert.match(startScript, /Start with the Agent Stage installer first/);
  assert.match(plistWriter, /KeepAlive/);
  assert.match(launcher, /macos-daemon\.js/);
  assert.match(launcher, /cdp-watchdog\.js/);
  assert.match(launcher, /server\.js/);
  assert.match(launcher, /cd "\$ROOT"/);
  assert.match(installScript, /trust-agent-stage-hooks\.mjs/);
  assert.match(installScript, /resolve_agent_stage_codex/);
  assert.match(installScript, /require_agent_stage_node_22/);
  assert.equal(installScript.includes("dangerously-bypass-hook-trust"), false);
  assert.match(hookTrust, /hooks\/list/);
  assert.match(hookTrust, /config\/value\/write/);
  assert.equal(hookTrust.includes("dangerously-bypass-hook-trust"), false);
});

test("the one-step installer starts the companion and the release exposes human-friendly entry points", async () => {
  const installScript = await readFile(resolve("macos/scripts/install-agent-stage-macos.sh"), "utf8");
  const releaseScript = await readFile(resolve("macos/scripts/build-agent-stage-release.sh"), "utf8");
  const finderInstaller = await readFile(resolve("macos/Install-Agent-Stage.command"), "utf8");
  const doctor = await readFile(resolve("macos/scripts/agent-stage-doctor.mjs"), "utf8");

  assert.match(installScript, /start-agent-stage-macos\.sh/);
  assert.match(releaseScript, /"Install Agent Stage"/);
  assert.match(releaseScript, /"Check Agent Stage"/);
  assert.match(finderInstaller, /install-agent-stage-macos\.sh/);
  assert.match(doctor, /127\.0\.0\.1:4282\/v1\/health/);
  assert.match(doctor, /CDP/);
});
