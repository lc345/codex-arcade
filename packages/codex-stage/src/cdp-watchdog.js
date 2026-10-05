import { createCodexStageInjectorSource, ensureCodexStageDock } from "./injector.js";
import { buildReviewedPack } from "../../../apps/codex-stage/packs/build.js";
import { discoverDesktop, selectLocalCodexTarget } from "./desktop-entry.js";

const port = Number(process.env.AGENT_STAGE_CDP_PORT ?? 9341);
const token = process.env.AGENT_STAGE_TOKEN;
if (!token) throw new Error("AGENT_STAGE_TOKEN is required for the CDP watchdog");
const daemonUrl = (process.env.AGENT_STAGE_DAEMON_URL ?? "http://127.0.0.1:4282").replace(/\/$/, "");
const stageUrl = new URL(process.env.AGENT_STAGE_DOCK_URL ?? "http://127.0.0.1:4173/codex-stage");
const desktop = await discoverDesktop();

async function targets() {
  const response = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(1500) });
  if (!response.ok) throw new Error(`CDP target discovery failed with ${response.status}`);
  return response.json();
}

async function evaluate(target, expression) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(target.webSocketDebuggerUrl);
    const timer = setTimeout(() => { socket.close(); reject(new Error("CDP evaluation timed out")); }, 3_000);
    socket.addEventListener("open", () => socket.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression, returnByValue: true } })));
    socket.addEventListener("message", (message) => {
      const payload = JSON.parse(String(message.data));
      if (payload.id !== 1) return;
      clearTimeout(timer); socket.close();
      if (payload.error || payload.result?.exceptionDetails) reject(new Error("CDP renderer injection failed"));
      else resolve(payload.result?.result?.value);
    });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("CDP socket failed")); });
  });
}

const source = createCodexStageInjectorSource({ lazy: true });
async function codexTarget() {
  if (!desktop) throw new Error("Verified Codex bundle not found; use Open Live Game.command");
  const list = await targets();
  return selectLocalCodexTarget(list, port);
}

async function install() {
  const target = await codexTarget();
  if (target) await ensureCodexStageDock(target, evaluate, source);
  return target;
}

let cursor = 0;
let mediaFingerprint = null;
let mediaTargetId = null;
async function activitySinceCursor() {
  const response = await fetch(`${daemonUrl}/v1/activity?token=${encodeURIComponent(token)}&after=${cursor}`);
  if (!response.ok) throw new Error(`Activity relay failed with ${response.status}`);
  const payload = await response.json();
  cursor = Math.max(cursor, Number(payload.cursor) || 0);
  return Array.isArray(payload.events) ? payload.events : [];
}

async function relayActivity() {
  const events = await activitySinceCursor();
  if (!events.length) return;
  const target = await install();
  if (!target) return;
  for (const entry of events) {
    await evaluate(target, `window.__AGENT_STAGE_CODEX_DOCK__?.dispatch(${JSON.stringify(entry.event)});`);
  }
}

async function selectedMedia() {
  const response = await fetch(new URL("/v1/media/selection", stageUrl));
  if (!response.ok) throw new Error(`Local media selection failed with ${response.status}`);
  const selection = await response.json();
  if (selection === null) return null;
  if (!selection || !/^[a-f0-9]{16}$/.test(selection.id ?? "")) throw new Error("Local media selection is malformed");
  return { id: selection.id, contentType: selection.contentType, url: new URL(`/v1/media/${selection.id}`, stageUrl).toString() };
}

async function relayMedia() {
  const media = await selectedMedia();
  const fingerprint = JSON.stringify(media);
  const target = await install();
  if (!target || (fingerprint === mediaFingerprint && target.id === mediaTargetId)) return;
  await evaluate(target, `window.__AGENT_STAGE_CODEX_DOCK__?.setMedia(${fingerprint});`);
  mediaFingerprint = fingerprint;
  mediaTargetId = target.id;
}

async function tick() {
  const target = await install();
  if (target) {
    const requests = await evaluate(target, "window.__AGENT_STAGE_CODEX_DOCK__?.pendingPacks?.() ?? []");
    for (const request of (Array.isArray(requests) ? requests : []).slice(0, 4)) {
      if (!Number.isSafeInteger(request.request) || typeof request.id !== "string") continue;
      let pack; try { pack = buildReviewedPack(request.id); } catch { continue; }
      await evaluate(target, `window.__AGENT_STAGE_CODEX_DOCK__?.acceptPack(${request.request}, ${JSON.stringify(request.id)}, ${pack.factory});`);
    }
  }
  await relayActivity();
  await relayMedia();
}

let ticking = false, reported = false;
setInterval(async () => { if (ticking) return; ticking = true; try { await tick(); reported = false; } catch { if (!reported) process.stderr.write("Codex Dock unavailable. Run Check Agent Stage.command; Open Live Game.command works without CDP.\n"); reported = true; } finally { ticking = false; } }, 700);
await tick().catch(() => undefined);
