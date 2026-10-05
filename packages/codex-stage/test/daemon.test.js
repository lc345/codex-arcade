import assert from "node:assert/strict";
import test from "node:test";

import { createCodexStageDaemon } from "../src/daemon.js";

test("late windows receive active turns, never completed history; Interrupt stops a turn", async () => {
  const daemon = createCodexStageDaemon({ token: "late-token" });
  const { port } = await daemon.start({ port: 0 });
  const base = `http://127.0.0.1:${port}`;
  const post = (event, turn = "one") => fetch(`${base}/v1/hooks`, { method: "POST", headers: { authorization: "Bearer late-token", "content-type": "application/json" }, body: JSON.stringify({ hook_event_name: event, session_id: "private-session", turn_id: turn, prompt: "PRIVATE PROMPT", tool_name: "Bash" }) });
  try {
    assert.equal((await fetch(`${base}/v1/state`)).status, 401);
    await post("UserPromptSubmit");
    await post("PostToolUse");
    const state = await (await fetch(`${base}/v1/state?token=late-token`)).json();
    assert.equal(state.active.length, 1);
    assert.equal(JSON.stringify(state).includes("PRIVATE"), false);
    const controller = new AbortController();
    const stream = await fetch(`${base}/v1/events?token=late-token`, { signal: controller.signal });
    const { value } = await stream.body.getReader().read();
    assert.match(new TextDecoder().decode(value), /event: snapshot/);
    controller.abort();
    await post("UserPromptSubmit", "two");
    await post("Interrupt");
    assert.equal((await (await fetch(`${base}/v1/state?token=late-token`)).json()).active.length, 1);
    await post("Stop", "two");
    assert.equal((await (await fetch(`${base}/v1/state?token=late-token`)).json()).active.length, 0);
  } finally { await daemon.stop(); }
});

test("the local daemon rejects unauthenticated hooks and streams only sanitized events", async () => {
  const daemon = createCodexStageDaemon({ token: "test-token", slowIntervalMs: 60_000 });
  const { port } = await daemon.start({ port: 0 });
  const base = `http://127.0.0.1:${port}`;

  const denied = await fetch(`${base}/v1/hooks`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ hook_event_name: "PreToolUse" }) });
  assert.equal(denied.status, 401);

  const received = [];
  const disconnect = daemon.subscribe((event) => received.push(event));
  const accepted = await fetch(`${base}/v1/hooks`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer test-token" },
    body: JSON.stringify({ hook_event_name: "PreToolUse", session_id: "secret-session", turn_id: "secret-turn", tool_name: "Bash", tool_input: { command: "cat /very/private/file" } }),
  });
  assert.equal(accepted.status, 202);
  assert.equal(received.length, 1);
  assert.equal(received[0].operation.family, "shell.inspect");
  assert.equal(JSON.stringify(received[0]).includes("private"), false);

  disconnect();
  await daemon.stop();
});

test("the local daemon exposes a token-protected browser event stream", async () => {
  const daemon = createCodexStageDaemon({ token: "stream-token", slowIntervalMs: 60_000 });
  const { port } = await daemon.start({ port: 0 });
  const base = `http://127.0.0.1:${port}`;
  const controller = new AbortController();
  const response = await fetch(`${base}/v1/events?token=stream-token`, { signal: controller.signal });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  const reader = response.body.getReader();
  await reader.read();

  try {
    await fetch(`${base}/v1/hooks`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer stream-token" },
      body: JSON.stringify({ hook_event_name: "PreToolUse", session_id: "s", turn_id: "t", tool_name: "apply_patch", tool_input: { patch: "private" } }),
    });
    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);
    assert.match(text, /tool\.started/);
    assert.equal(text.includes("private"), false);
  } finally {
    controller.abort();
    await daemon.stop();
  }
});

test("the CDP relay can poll a bounded, token-protected sanitized activity history", async () => {
  const daemon = createCodexStageDaemon({ token: "relay-token", slowIntervalMs: 60_000 });
  const { port } = await daemon.start({ port: 0 });
  const base = `http://127.0.0.1:${port}`;
  try {
    const denied = await fetch(`${base}/v1/activity?after=0`);
    assert.equal(denied.status, 401);
    await fetch(`${base}/v1/hooks`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer relay-token" },
      body: JSON.stringify({ hook_event_name: "PreToolUse", session_id: "private-session", tool_name: "Bash", tool_input: { command: "cat /private/path" } }),
    });
    const response = await fetch(`${base}/v1/activity?token=relay-token&after=0`);
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.events.length, 1);
    assert.equal(payload.events[0].event.operation.family, "shell.inspect");
    assert.equal(JSON.stringify(payload).includes("private"), false);
  } finally {
    await daemon.stop();
  }
});
