import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createCodexStageDaemon } from "../src/daemon.js";

function runCollector({ statePath, payload }) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [fileURLToPath(new URL("../src/agent-stage-hook-collector.js", import.meta.url))], {
      env: { ...process.env, AGENT_STAGE_STATE_PATH: statePath },
      stdio: ["pipe", "ignore", "pipe"],
    });
    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("exit", (code) => resolve({ code, stderr }));
    child.stdin.end(JSON.stringify(payload));
  });
}

test("installed Hook Collector reads stdin with current Codex Node runtimes and forwards a redacted event", async () => {
  const token = "collector-process-token";
  const daemon = createCodexStageDaemon({ token });
  const { port } = await daemon.start({ port: 0 });
  const directory = await mkdtemp(join(tmpdir(), "agent-stage-hook-"));
  const statePath = join(directory, "daemon.json");
  const events = [];
  const unsubscribe = daemon.subscribe((event) => events.push(event));

  try {
    await writeFile(statePath, JSON.stringify({ token, endpoint: `http://127.0.0.1:${port}/v1/hooks` }));
    const result = await runCollector({ statePath, payload: { hook_event_name: "UserPromptSubmit", session_id: "private-session", turn_id: "turn-1", prompt: "never forward this" } });

    assert.equal(result.code, 0, result.stderr);
    assert.equal(events.length, 1);
    assert.equal(events[0].type, "turn.started");
    assert.equal(JSON.stringify(events[0]).includes("never forward this"), false);
  } finally {
    unsubscribe();
    await daemon.stop();
  }
});
