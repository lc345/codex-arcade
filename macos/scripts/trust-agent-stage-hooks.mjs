import { spawn } from "node:child_process";
import { resolve } from "node:path";

const [codexBinary, requestedCwd = process.cwd()] = process.argv.slice(2);
if (!codexBinary) throw new Error("Usage: trust-agent-stage-hooks.mjs <codex-binary> [cwd]");

const child = spawn(codexBinary, ["app-server", "--listen", "stdio://"], { stdio: ["pipe", "pipe", "ignore"] });
let buffer = "";
let nextId = 1;
const pending = new Map();

function request(method, params) {
  const id = nextId++;
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
  return new Promise((resolveRequest, rejectRequest) => pending.set(id, { resolve: resolveRequest, reject: rejectRequest }));
}

function close(error) {
  for (const requestState of pending.values()) requestState.reject(error);
  pending.clear();
  child.kill("SIGTERM");
}

child.once("error", close);
child.stdout.setEncoding("utf8");
child.stdout.on("data", (chunk) => {
  buffer += chunk;
  let boundary;
  while ((boundary = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, boundary);
    buffer = buffer.slice(boundary + 1);
    if (!line.trim()) continue;
    let message;
    try { message = JSON.parse(line); } catch { continue; }
    const requestState = pending.get(message.id);
    if (!requestState) continue;
    pending.delete(message.id);
    if (message.error) requestState.reject(new Error(message.error.message ?? "Codex app-server request failed"));
    else requestState.resolve(message.result);
  }
});

const timeout = setTimeout(() => close(new Error("Timed out while trusting Agent Stage hooks")), 10_000);
try {
  await request("initialize", {
    clientInfo: { name: "agent-stage-installer", title: "Agent Stage installer", version: "0.3.6" },
    capabilities: { experimentalApi: false, requestAttestation: false },
  });
  const listing = await request("hooks/list", { cwds: [resolve(requestedCwd)] });
  const collectorPath = resolve(requestedCwd, "packages/codex-stage/src/agent-stage-hook-collector.js");
  const hooks = listing.data?.flatMap((entry) => entry.hooks ?? []).filter((hook) => String(hook.command ?? "").includes(`"${collectorPath}"`)) ?? [];
  if (!hooks.length) throw new Error("No installed Agent Stage hooks were found to trust");
  for (const hook of hooks) {
    const key = String(hook.key).replaceAll("\\", "\\\\").replaceAll('"', '\\"');
    await request("config/value/write", { keyPath: `hooks.state."${key}".trusted_hash`, value: hook.currentHash, mergeStrategy: "upsert" });
  }
  process.stdout.write(`Trusted ${hooks.length} Agent Stage hooks by exact content hash.\n`);
} finally {
  clearTimeout(timeout);
  child.stdin.end();
  child.kill("SIGTERM");
}
