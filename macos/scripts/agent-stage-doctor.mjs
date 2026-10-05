import { access, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { discoverDesktop, selectLocalCodexTarget } from "../../packages/codex-stage/src/desktop-entry.js";

const args = new Set(process.argv.slice(2));
const runtimeIndex = process.argv.indexOf("--runtime");
const runtime = runtimeIndex >= 0 ? process.argv[runtimeIndex + 1] : process.env.AGENT_STAGE_RUNTIME_ROOT ?? join(homedir(), ".codex", "agent-stage");
const cdpPort = Number(process.env.AGENT_STAGE_CDP_PORT ?? 9341);
const hooksPath = join(process.env.CODEX_HOME ?? join(homedir(), ".codex"), "hooks.json");

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function fetchJson(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
    if (!response.ok) return null;
    return await response.json();
  } catch { return null; }
}

const health = await fetchJson("http://127.0.0.1:4282/v1/health");
const cdp = await fetchJson(`http://127.0.0.1:${cdpPort}/json/version`);
const desktop = await discoverDesktop();
let windowStatus = {};
try { windowStatus = JSON.parse(await readFile(join(homedir(), "Library", "Application Support", "AgentStage", "window.json.status"), "utf8")); } catch {}
const target = desktop ? selectLocalCodexTarget(await fetchJson(`http://127.0.0.1:${cdpPort}/json/list`), cdpPort) : null;
let hooksInstalled = false;
try { hooksInstalled = (await readFile(hooksPath, "utf8")).includes("agent-stage-hook-collector"); } catch { /* A missing hooks file is a normal pre-install state. */ }

const report = {
  platform: process.platform,
  runtime: { path: runtime, installed: await exists(join(runtime, "packages", "codex-stage", "src", "injector.js")) },
  companion: { healthy: health?.ok === true, endpoint: "http://127.0.0.1:4282/v1/health" },
  hooks: { installed: hooksInstalled, path: hooksPath },
  desktop,
  popup: { running: Date.now() - (windowStatus.updatedAt ?? 0) < 5000, visible: windowStatus.userVisible === true, ordered: windowStatus.visible === true, mode: windowStatus.mode ?? "unknown", hostAnchored: windowStatus.hostAnchored === true, gamePaused: windowStatus.gamePaused === true, onActiveSpace: windowStatus.onActiveSpace === true, eventLoopRunning: windowStatus.eventLoopRunning === true, frame: windowStatus.frame ?? null },
  cdp: { available: Boolean(cdp && target), endpointAvailable: Boolean(cdp), port: cdpPort, browser: cdp?.Browser ?? null, reason: !desktop ? "codex-bundle-not-found" : !cdp ? "debug-endpoint-unavailable" : !target ? "unsupported-target" : "ready" },
  liveWindow: { available: health?.ok === true && hooksInstalled, command: join(runtime, "macos", "Open-Live-Game.command") },
};

if (args.has("--json")) {
  process.stdout.write(`${JSON.stringify(report)}\n`);
} else {
  const mark = (value) => value ? "OK" : "NEEDS ATTENTION";
  process.stdout.write(`Agent Stage check\n\n`);
  process.stdout.write(`${mark(report.runtime.installed)}  Runtime: ${runtime}\n`);
  process.stdout.write(`${mark(report.hooks.installed)}  Codex hooks: ${hooksPath}\n`);
  process.stdout.write(`${mark(report.companion.healthy)}  Local companion: ${report.companion.endpoint}\n`);
  process.stdout.write(`${mark(Boolean(desktop))}  Verified Codex bundle: ${desktop?.path ?? "not found"}\n`);
  process.stdout.write(`${mark(report.popup.running && report.popup.eventLoopRunning)}  Native game window: ${report.popup.visible ? "visible at Codex window corner" : report.popup.mode === "hidden" ? "suspended: Codex is not foreground or has no visible window" : report.popup.mode === "dismissed" ? "dismissed for this task" : report.popup.ordered ? "opened but obscured / on another desktop" : "waiting for next task"}\n`);
  process.stdout.write(`${report.cdp.available ? "OK" : "OPTIONAL / OFF"}  Embedded Codex CDP: 127.0.0.1:${cdpPort}${report.cdp.browser ? ` (${report.cdp.browser})` : ""}\n`);
  if (!report.cdp.available) process.stdout.write(`\nEmbedded Dock unavailable (${report.cdp.reason}). This does NOT block the default native game window. No Codex debug flag or theme changes are needed.\nBrowser fallback: ${report.liveWindow.command}\n`);
  process.stdout.write(`\nHealth checks do not prove an existing chat emitted task-start hooks. If no game appears, finish active work, quit and reopen Codex, then send a new task.\n`);
}

if (args.has("--strict") && (!report.runtime.installed || !report.hooks.installed || !report.companion.healthy || !report.popup.running || !report.popup.eventLoopRunning)) process.exitCode = 1;
