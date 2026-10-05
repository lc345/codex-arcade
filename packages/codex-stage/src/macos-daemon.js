import { randomBytes } from "node:crypto";
import { mkdir, rm, writeFile, rename, access } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import { createCodexStageDaemon } from "./daemon.js";
import { liveGameURL } from "./desktop-entry.js";

const stateDirectory = process.env.AGENT_STAGE_STATE_DIR ?? join(homedir(), "Library", "Application Support", "AgentStage");
const statePath = join(stateDirectory, "daemon.json");
const token = process.env.AGENT_STAGE_TOKEN ?? randomBytes(24).toString("hex");
const daemon = createCodexStageDaemon({ token });
const { port } = await daemon.start({ port: Number(process.env.AGENT_STAGE_PORT ?? 4282) });
await mkdir(stateDirectory, { recursive: true });
const state = { token, endpoint: `http://127.0.0.1:${port}/v1/hooks`, events: `http://127.0.0.1:${port}/v1/events`, startedAt: new Date().toISOString() };
await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
const windowPath = join(stateDirectory, "window.json");
const windowURL = new URL(liveGameURL(state, Number(process.env.AGENT_STAGE_WEB_PORT ?? 4173)));
windowURL.searchParams.set("popup", "1");
let publishing = Promise.resolve();
function publishWindow() {
  publishing = publishing.then(async () => {
    let paused = false;
    try { await access(join(stateDirectory, "paused")); paused = true; } catch {}
    const turns = [...daemon.activeTurns.values()];
    const snapshot = { url: windowURL.href, active: turns.length > 0, epoch: turns.at(-1)?.runId ?? "", paused, updatedAt: Date.now() };
    await writeFile(`${windowPath}.tmp`, JSON.stringify(snapshot), { mode: 0o600 });
    await rename(`${windowPath}.tmp`, windowPath);
  }).catch(() => process.stderr.write("Could not update local game window state.\n"));
}
daemon.subscribe(event => { if (event.type.startsWith("turn.")) publishWindow(); });
publishWindow();
const windowTimer = setInterval(publishWindow, 1000);
process.stdout.write(`Agent Stage daemon listening on 127.0.0.1:${port}\n`);

async function shutdown() {
  clearInterval(windowTimer);
  await daemon.stop();
  await publishing;
  await rm(windowPath, { force: true });
  await rm(statePath, { force: true });
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
