import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile, copyFile, rename } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { createStageServer } from "../apps/press-lab/server.js";

const dir = await mkdtemp(join(tmpdir(), "agent-stage-native-"));
const server = createStageServer({ mediaDirectory: join(dir, "media") });
const { port: webPort } = await server.start({ port: 0 });
const env = { ...process.env, AGENT_STAGE_STATE_DIR: dir, AGENT_STAGE_PORT: "0", AGENT_STAGE_WEB_PORT: String(webPort) };
const daemon = spawn(process.execPath, ["packages/codex-stage/src/macos-daemon.js"], { env, stdio: ["ignore", "ignore", "pipe"] });
let errors = "";
daemon.stderr.on("data", data => errors += data);
let window, observer, canvas, pixels, windowDiagnostics;
let launchTarget, launchProcessType;
const game = process.env.NATIVE_QA_GAME || "toast-hop";
const profiling = process.env.NATIVE_QA_PROFILE === "1";
let profiles;
const host = { front: { bundleId: "com.openai.codex", pid: 9000, hidden: false }, windows: [{ pid: 9000, layer: 0, onScreen: true, alpha: 1, bounds: { x: 100, y: 60, width: 1000, height: 700 } }] };
const updateHost = async () => { const path = join(dir, "window.json.host.json"); await writeFile(path + ".tmp", JSON.stringify(host)); await rename(path + ".tmp", path); };
async function waitFor(fn, ms = 15000) { const end = Date.now() + ms; while (Date.now() < end) { try { if (await fn()) return; } catch {} await sleep(100); } throw new Error(`Timed out. ${errors}`); }
try {
  let state;
  await waitFor(async () => { state = JSON.parse(await readFile(join(dir, "daemon.json"))); return state.endpoint; });
  await updateHost();
  observer = spawn('/usr/bin/osascript', ['-l', 'JavaScript', resolve('macos/scripts/native-game-window.js'), join(dir, 'window.json'), '--observe'], {stdio: ['ignore', 'ignore', 'pipe']});
  observer.stderr.on('data', data => errors += data);
  const windowArgs = ["-l", "JavaScript", resolve("macos/scripts/native-game-window.js"), join(dir, "window.json"), "--qa", game, ...(profiling ? ["--profile", resolve("macos/scripts/native-game-profile.js")] : []), "--host-fixture", ...(process.env.NATIVE_QA_POLL ? ["--poll-geometry"] : []), ...(process.env.NATIVE_QA_INPUT ? ["--native-input"] : [])];
  if (process.env.NATIVE_QA_LAUNCHD === "1") {
    const plistPath = join(dir, "test.plist");
    execFileSync(process.execPath, ["macos/scripts/write-launch-agent.mjs", plistPath, resolve("."), process.execPath, "9341", join(dir, "native.log")]);
    const plist = JSON.parse(execFileSync("/usr/bin/plutil", ["-convert", "json", "-o", "-", plistPath], { encoding: "utf8" }));
    // Keep the deployed resource policy, isolate only the label, lifetime and test window.
    plist.Label = `com.agentstage.native-qa-${process.pid}`;
    plist.ProgramArguments = ["/usr/bin/osascript", ...windowArgs];
    plist.KeepAlive = false;
    launchProcessType = plist.ProcessType;
    await writeFile(plistPath, JSON.stringify(plist));
    execFileSync("/usr/bin/plutil", ["-convert", "xml1", plistPath]);
    launchTarget = `gui/${process.getuid()}/${plist.Label}`;
    execFileSync("/bin/launchctl", ["bootstrap", `gui/${process.getuid()}`, plistPath]);
  } else {
    window = spawn("/usr/bin/osascript", windowArgs, { stdio: ["ignore", "ignore", "pipe"] });
    window.stderr.on("data", data => errors += data);
    window.on("exit", (code, signal) => { if (code !== null && code !== 0 || signal && signal !== "SIGTERM") errors += `Native test host exited: ${code ?? signal}\n`; });
  }
  const visible = async () => JSON.parse(await readFile(join(dir, "window.json.status"))).visible;
  await waitFor(async () => (await visible()) === false);
  const post = async event => {
    const response = await fetch(state.endpoint, { method: "POST", headers: { authorization: `Bearer ${state.token}`, "content-type": "application/json" }, body: JSON.stringify({ hook_event_name: event, session_id: "native-qa", turn_id: "test", prompt: "must not reach window" }) });
    assert.equal(response.status, 202);
  };
  await post("UserPromptSubmit");
  await waitFor(visible);
  await waitFor(async () => {
    windowDiagnostics = JSON.parse(await readFile(join(dir, "window.json.status")));
    return windowDiagnostics.userVisible === true && windowDiagnostics.eventLoopRunning === true;
  });
  await waitFor(async () => {
    canvas = JSON.parse(await readFile(join(dir, "window.json.canvas")));
    if (!profiling) pixels = JSON.parse(await readFile(join(dir, "window.json.pixels")));
    return (profiling || pixels.colors > 20) && canvas.status === "Agent 工作中" && !/加载/.test(canvas.feedback);
  }, 60000);
  windowDiagnostics = JSON.parse(await readFile(join(dir, "window.json.status")));
  assert.equal(windowDiagnostics.metadataReaderVerified, true, "public geometry API reads the test panel's own window");
  assert.equal(windowDiagnostics.hostAnchored, true);
  if (!profiling) await copyFile(join(dir, "window.json.png"), resolve(`output/native-${game}.png`));
  assert.ok(windowDiagnostics.frame.width <= 520, "native window must stay compact");
  assert.equal(windowDiagnostics.titled, false, "native title bar must not be visible");
  assert.equal(canvas.chromeVisible, false, "only the game is visible");
  assert.ok(Math.abs(canvas.width - windowDiagnostics.frame.width) < 1);
  assert.ok(Math.abs(canvas.height - windowDiagnostics.frame.height) < 1);
  console.log("Native WebKit popup is visible. Real hooks are simulated in this isolated test.");
  await sleep(Number(process.env.NATIVE_QA_HOLD_MS ?? 5000));
  if (profiling) {
    profiles = JSON.parse(await readFile(join(dir, "window.json.profile")));
    if (process.env.NATIVE_QA_INPUT) assert.ok(profiles[0].trustedMoves > 100, 'must exercise native WebKit input, not only animate an idle scene');
    if (process.env.NATIVE_QA_INPUT && game === 'zipper-run') assert.ok(profiles[0].zipperProgress > 100, 'native dragging must advance the zipper, not just deliver unused events');
    if (process.env.NATIVE_QA_POLL) assert.ok(profiles[0].geometryCosts.length > 5, 'background window observer must run during profiling');
  }
  const status = async () => JSON.parse(await readFile(join(dir, "window.json.status")));
  windowDiagnostics = await status();
  assert.ok(windowDiagnostics.frameStats?.samples > 0, 'native runtime exposes bounded frame cadence diagnostics');
  const originalFrame = (await status()).frame;
  host.front.bundleId = "com.apple.finder"; await updateHost();
  await waitFor(async () => { const s = await status(); return !s.visible && s.mode === "hidden" && s.gamePaused === true; });
  await waitFor(async () => (await status()).frameStats?.running === false);
  host.windows[0].bounds.x += 60; host.windows[0].bounds.y += 40;
  host.front.bundleId = "com.openai.codex"; await updateHost();
  await waitFor(async () => { const s = await status(); return s.visible && s.mode === "visible" && s.gamePaused === false && Math.abs(s.frame.x - originalFrame.x - 60) < 1 && Math.abs(s.frame.y - originalFrame.y + 40) < 1; });
  await waitFor(async () => (await status()).frameStats?.running === true);
  await waitFor(async () => JSON.parse(await readFile(join(dir, "window.json.canvas"))).status === "Agent 工作中");
  host.windows[0].onScreen = false; await updateHost();
  await waitFor(async () => !(await visible()));
  host.windows[0].onScreen = true; await updateHost();
  await waitFor(visible);
  host.front.bundleId = "com.apple.finder"; await updateHost();
  await waitFor(async () => !(await visible()));
  await post("Stop");
  await waitFor(async () => (await status()).mode === "stopped");
  host.front.bundleId = "com.openai.codex"; await updateHost(); await sleep(1200);
  assert.equal(await visible(), false, "completed in background must not reappear");
  await post("UserPromptSubmit");
  await waitFor(visible);
  await post("Interrupt");
  await waitFor(async () => !(await visible()));
  assert.equal(errors, "");
  const report = { nativeWindow: true, launchProcessType, windowDiagnostics, canvas, pixels, profiles, game, startVisible: true, stopHidden: true, interruptHidden: true, focusHidesAndPauses: true, focusReturnResumes: true, followsHostMove: true, minimizeHides: true, backgroundCompletionStaysHidden: true, fixtureHooks: true, fixtureHost: true };
  await writeFile(resolve(`output/native-${game}-${process.env.NATIVE_QA_LABEL || 'report'}.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  if (launchTarget) {
    assert.ok(windowDiagnostics.frameStats.fps >= 50, `installed scheduling must sustain 50+ FPS, got ${windowDiagnostics.frameStats.fps} (${launchProcessType})`);
    assert.ok(windowDiagnostics.frameStats.p95 < 35, "installed frame gaps must not repeatedly exceed 35ms");
    if (process.env.NATIVE_QA_INPUT) assert.ok(profiles[0].inputP95 < 35, "native dragging must remain responsive under installed scheduling");
  }
} catch (error) {
  try { windowDiagnostics = JSON.parse(await readFile(join(dir, "window.json.status"))); } catch {}
  console.error(JSON.stringify({ game, windowDiagnostics, canvas, pixels }));
  throw error;
} finally {
  if (launchTarget) { try { execFileSync("/bin/launchctl", ["bootout", launchTarget]); } catch {} }
  window?.kill("SIGTERM"); observer?.kill('SIGTERM'); daemon.kill("SIGTERM");
  await server.stop(); await sleep(300); await rm(dir, { recursive: true, force: true });
}
