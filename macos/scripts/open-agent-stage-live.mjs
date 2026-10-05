import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { liveGameURL } from "../../packages/codex-stage/src/desktop-entry.js";
try {
  const state = JSON.parse(await readFile(join(homedir(), "Library", "Application Support", "AgentStage", "daemon.json"), "utf8"));
  const url = liveGameURL(state, Number(process.env.AGENT_STAGE_WEB_PORT ?? 4173));
  const health = await fetch(`${new URL(state.events).origin}/v1/health`, { signal: AbortSignal.timeout(1500) });
  if (!health.ok) throw new Error("Local companion is not healthy");
  await promisify(execFile)("/usr/bin/open", [url]);
  console.log("Opened the local live game window. It waits for the next Codex task; no Codex restart is required.");
} catch { console.error("Cannot open the live window. Run Open Agent Stage.command to start the local companion, then try again."); process.exitCode = 1; }
