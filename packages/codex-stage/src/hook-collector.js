import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

async function readStdin() {
  let raw = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) {
    raw += chunk;
    if (raw.length > 250_000) throw new Error("Hook payload is too large");
  }
  return raw;
}

const raw = await readStdin();
const statePath = process.env.AGENT_STAGE_STATE_PATH ?? join(homedir(), "Library", "Application Support", "AgentStage", "daemon.json");
let state = {};
try { state = JSON.parse(await readFile(statePath, "utf8")); } catch { /* The visual companion is optional. */ }
const token = process.env.AGENT_STAGE_TOKEN ?? state.token;
const endpoint = process.env.AGENT_STAGE_ENDPOINT ?? state.endpoint ?? "http://127.0.0.1:4282/v1/hooks";
if (!token) process.exit(0);
try {
  await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: raw || "{}" });
} catch {
  // A display companion must never slow down or block Codex tool execution.
}
