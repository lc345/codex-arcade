import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";

const archive = resolve(process.argv[2] || "dist/Agent-Stage-for-Codex.zip");
const dir = await mkdtemp(join(tmpdir(), "agent-stage-release-"));
const root = join(dir, "Agent Stage for Codex"), payload = join(root, ".agent-stage");
const home = join(dir, "Fresh User");
let child;
try {
  const entries = execFileSync("/usr/bin/unzip", ["-Z1", archive], { encoding: "utf8" }).split("\n").filter(Boolean);
  for (const entry of entries) {
    assert.ok(!entry.startsWith("/") && !entry.split("/").includes(".."));
    assert.ok(!/(^|\/)(output|outputs|work|node_modules|\.tools|\.env(?:\.[^/]*)?|daemon\.json|window\.json|hooks-before-install\.json)(\/|$)/.test(entry), `Private payload: ${entry}`);
  }
  execFileSync("/usr/bin/ditto", ["-x", "-k", archive, dir]);
  const release = JSON.parse(await readFile(join(root, "RELEASE.json")));
  const pkg = JSON.parse(await readFile(join(payload, "package.json")));
  assert.equal(release.version, pkg.version);
  assert.equal(release.processType, "Interactive");
  assert.equal(release.signing, "unsigned-unnotarized");
  assert.equal(release.games, 100);
  for (const command of ["Install Agent Stage", "Check Agent Stage", "Uninstall Agent Stage", "Open Agent Stage", "Open Live Game", "Pause", "Resume"]) {
    assert.ok((await stat(join(root, `${command}.command`))).mode & 0o111, `${command} executable bit`);
    execFileSync("/bin/bash", ["-n", join(root, `${command}.command`)]);
  }
  for (const [arch, native] of [["arm64", "arm64"], ["x86_64", "x86_64"]]) {
    const runtime = join(payload, "runtime", arch);
    assert.equal(execFileSync("/usr/bin/lipo", ["-archs", join(runtime, "bin/node")], { encoding: "utf8" }).trim(), native);
    const provenance = JSON.parse(await readFile(join(runtime, "provenance.json")));
    assert.ok(provenance.source.startsWith("https://nodejs.org/dist/"));
    assert.match(provenance.sha256, /^[a-f0-9]{64}$/);
    assert.ok((await readFile(join(runtime, "LICENSE"), "utf8")).length > 1000);
  }
  await mkdir(home);
  const env = { HOME: home, CODEX_HOME: join(home, ".codex"), PATH: "/usr/bin:/bin:/usr/sbin:/sbin", TMPDIR: tmpdir(), ROOT: payload };
  const node = execFileSync("/bin/bash", ["-c", 'source "$ROOT/macos/scripts/agent-stage-env.sh"; resolve_agent_stage_node'], { env, encoding: "utf8" }).trim();
  assert.equal(node, join(payload, "runtime", process.arch === "arm64" ? "arm64" : "x86_64", "bin/node"));
  const version = execFileSync(node, ["--version"], { env, encoding: "utf8" }).trim();
  const copied = join(dir, "Installer Payload");
  execFileSync(node, [join(payload, "tools/distribution.mjs"), payload, copied], { env });
  assert.ok((await stat(join(copied, "tools/build-game-packs.mjs"))).isFile(), "actual installer copy CLI must run through the archive path");
  await rm(copied, { recursive: true, force: true });
  const hooks = join(home, "hooks.json"), manager = join(payload, "macos/scripts/manage-agent-stage-hooks.mjs");
  execFileSync(node, [manager, "check", hooks], { env });
  const existing = { hooks: { Stop: [{ hooks: [{ type: "command", command: "echo unrelated" }] }] } };
  await writeFile(hooks, JSON.stringify(existing));
  const command = `"${node}" "${join(payload, "packages/codex-stage/src/agent-stage-hook-collector.js")}"`;
  execFileSync(node, [manager, "install", hooks, command], { env });
  const once = await readFile(hooks, "utf8");
  execFileSync(node, [manager, "install", hooks, command], { env });
  assert.equal(await readFile(hooks, "utf8"), once);
  execFileSync(node, [manager, "remove", hooks], { env });
  assert.deepEqual(JSON.parse(await readFile(hooks)), existing);
  const plistPath = join(home, "agent.plist");
  execFileSync(node, [join(payload, "macos/scripts/write-launch-agent.mjs"), plistPath, payload, node, "9341", join(home, "agent.log")], { env });
  const plist = JSON.parse(execFileSync("/usr/bin/plutil", ["-convert", "json", "-o", "-", plistPath], { encoding: "utf8" }));
  assert.equal(plist.ProcessType, "Interactive");
  const catalog = JSON.parse(await readFile(join(payload, "apps/codex-stage/packs/built/catalog.json")));
  assert.equal(catalog.games.length, 95);
  for (const game of catalog.games) {
    const bytes = await readFile(join(payload, "apps/codex-stage/packs/built", game.entry));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), game.sha256, game.id);
  }
  // No PATH Node, Codex runtime, user configuration or external network is used.
  child = spawn(node, [join(payload, "apps/press-lab/server.js")], { cwd: payload, env: { ...env, PORT: "0" }, stdio: ["ignore", "pipe", "pipe"] });
  let errors = "";
  child.stderr.on("data", chunk => errors += chunk);
  const port = await new Promise((accept, reject) => {
    let buffer = "";
    const timer = setTimeout(() => reject(new Error("Packaged server did not start")), 10000);
    child.once("error", error => { clearTimeout(timer); reject(error); });
    child.once("exit", code => { clearTimeout(timer); reject(new Error(`Packaged server exited ${code}`)); });
    child.stdout.on("data", chunk => { buffer += chunk; const match = buffer.match(/http:\/\/127\.0\.0\.1:(\d+)/); if (match) { clearTimeout(timer); accept(Number(match[1])); } });
  });
  for (const path of ["/codex-stage", "/apps/codex-stage/packs/built/zipper-run.js", ...["godot-junk", "cart-downhill", "reel-break", "last-beacon", "grab-go"].map(id => `/apps/codex-stage/${id}/index.html`)]) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`);
    assert.equal(response.status, 200, path);
    assert.ok((await response.arrayBuffer()).byteLength > 100, path);
  }
  assert.equal(errors, "");
  const report = { version: pkg.version, node: version, games: 100, verifiedPackDigests: 95, isolatedHome: true, pathNodeAbsent: true, preservesHooks: true, processType: plist.ProcessType, server: "passed", architecturesPresent: ["arm64", "x86_64"], signing: release.signing, fullCleanMacInstall: "not-tested", windows: "not-tested", extractedRoot: process.env.KEEP_RELEASE_TEST ? root : undefined };
  await mkdir(resolve("output/release-qa"), { recursive: true });
  await writeFile(resolve("output/release-qa/report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  if (child && child.exitCode === null && child.signalCode === null) { const exited = new Promise(r => child.once("exit", r)); child.kill("SIGTERM"); await exited; }
  if (!process.env.KEEP_RELEASE_TEST) await rm(dir, { recursive: true, force: true });
}
