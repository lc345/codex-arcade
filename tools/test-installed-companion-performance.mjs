import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

// Exercise the installed LaunchAgent, not a directly spawned surrogate host.
// Keep Codex foreground; this test never activates or controls another app.
const dir = join(homedir(), "Library", "Application Support", "AgentStage");
const state = JSON.parse(await readFile(join(dir, "daemon.json"), "utf8"));
const endpoint = new URL(state.endpoint);
assert.equal(endpoint.origin, "http://127.0.0.1:4282");
assert.equal(endpoint.pathname, "/v1/hooks");
const id = `installed-performance-${Date.now()}`;
const samples = [];
const post = async type => {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { authorization: `Bearer ${state.token}`, "content-type": "application/json" },
    body: JSON.stringify({ hook_event_name: type, session_id: id, turn_id: id }),
    signal: AbortSignal.timeout(3000),
  });
  assert.equal(response.status, 202);
};
let lastUpdated = 0;
try {
  await post("UserPromptSubmit");
  const deadline = Date.now() + 90000;
  while (samples.length < 10 && Date.now() < deadline) {
    await sleep(3000);
    const s = JSON.parse(await readFile(join(dir, "window.json.status"), "utf8"));
    if (s.updatedAt <= lastUpdated || Date.now() - s.updatedAt > 3500) continue;
    lastUpdated = s.updatedAt;
    const f = s.frameStats;
    if (!s.userVisible || s.gamePaused || !f?.running || f.samples < 100 || Date.now() - f.at > 3500) continue;
    const sample = { game: f.game, fps: f.fps, p95: f.p95, p99: f.p99, maxGap: f.maxGap, over25: f.over25, samples: f.samples, at: f.at };
    samples.push(sample);
    console.log(JSON.stringify(sample));
  }
  await writeFile(resolve("output/installed-launchd-performance.json"), JSON.stringify({ simulatedHook: true, realInstalledHost: true, samples }, null, 2));
  assert.equal(samples.length, 10, "Need 10 fresh visible samples. Keep Codex foreground; hidden samples are not performance evidence.");
  assert.ok(samples.every(s => s.fps >= 50 && s.p95 < 35), "Installed popup must sustain 50+ FPS with p95 frame gaps below 35ms.");
} finally {
  // Remove only this test's turn; unrelated real tasks remain active.
  await post("Stop");
}
