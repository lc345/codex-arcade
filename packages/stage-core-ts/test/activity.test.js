import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { ActivityCollector, ActivityStoryRuntime, createActivityEvent, createActivityStoryPack } from "../src/index.js";

test("ActivityEvent accepts only privacy-safe display data", () => {
  const event = createActivityEvent({
    type: "tool.started",
    runId: "run_12345678",
    spanId: "span_12345678",
    sequence: 1,
    operation: { family: "shell.inspect", label: "正在查看项目结构" },
    elapsedMs: 0,
  });

  assert.equal(event.operation.label, "正在查看项目结构");
  assert.equal(JSON.stringify(event).includes("/Users"), false);
  assert.equal(event.privacyMode, "summary-only");
});

test("ActivityCollector turns Codex hooks into redacted lifecycle events", () => {
  const collector = new ActivityCollector({ now: () => 1_000 });
  const started = collector.ingestHook({
    hook_event_name: "PreToolUse",
    session_id: "session-private",
    turn_id: "turn-private",
    tool_name: "Bash",
    tool_input: { command: "rg SECRET_TOKEN /Users/example/private-repo" },
  });

  assert.equal(started.type, "tool.started");
  assert.equal(started.operation.family, "shell.inspect");
  assert.equal(JSON.stringify(started).includes("SECRET_TOKEN"), false);
  assert.equal(JSON.stringify(started).includes("private-repo"), false);

  const completed = collector.ingestHook({
    hook_event_name: "PostToolUse",
    session_id: "session-private",
    turn_id: "turn-private",
    tool_name: "Bash",
    tool_output: "do not send this to a renderer",
  });

  assert.equal(completed.type, "tool.completed");
  assert.equal(completed.spanId, started.spanId);
  assert.equal(JSON.stringify(completed).includes("renderer"), false);
});

test("ActivityCollector opens the theater for every submitted turn, not only after a tool starts", () => {
  const collector = new ActivityCollector({ now: () => 2_000 });
  const sessionStart = collector.ingestHook({ hook_event_name: "SessionStart", session_id: "s" });
  const started = collector.ingestHook({ hook_event_name: "UserPromptSubmit", session_id: "s", turn_id: "turn-one", prompt: "never render this" });
  const completed = collector.ingestHook({ hook_event_name: "Stop", session_id: "s", turn_id: "turn-one" });

  assert.equal(sessionStart, null);
  assert.equal(started.type, "turn.started");
  assert.equal(started.operation.family, "turn");
  assert.equal(JSON.stringify(started).includes("never render this"), false);
  assert.equal(completed.type, "turn.completed");
  assert.equal(completed.spanId, started.spanId);
});

test("ActivityCollector emits a slow state without inventing progress and resolves it with a real completion", () => {
  let now = 0;
  const collector = new ActivityCollector({ now: () => now, slowAfterMs: 900 });
  const started = collector.ingestHook({ hook_event_name: "PreToolUse", session_id: "s", turn_id: "t", tool_name: "apply_patch" });

  now = 1_000;
  const [slow] = collector.flushSlow();
  assert.equal(slow.type, "tool.slow");
  assert.equal(slow.spanId, started.spanId);
  assert.equal(Object.hasOwn(slow, "progress"), false);

  const completed = collector.ingestHook({ hook_event_name: "PostToolUse", session_id: "s", turn_id: "t", tool_name: "apply_patch" });
  assert.equal(completed.type, "tool.completed");
  assert.equal(completed.elapsedMs, 1_000);
});

test("Activity Story Packs keep a run's visual language stable and never turn a start into a success chapter", async () => {
  const pack = createActivityStoryPack({
    schemaVersion: "3",
    id: "evidence-wall",
    version: "1.0.0",
    license: "Apache-2.0",
    matches: { families: ["shell.inspect"] },
    chapters: [
      { id: "opening", on: ["tool.started"], timeline: { durationMs: 800, loop: true, tracks: [{ atMs: 0, command: "spawn", id: "evidence", kind: "evidence", anchor: "center" }] } },
      { id: "resolved", on: ["tool.completed"], timeline: { durationMs: 500, tracks: [{ atMs: 0, command: "spawn", id: "proof", kind: "proof", anchor: "center" }] } },
    ],
  });
  const runtime = new ActivityStoryRuntime({ packs: [pack] });
  const started = createActivityEvent({ type: "tool.started", runId: "run_same", spanId: "span_one", sequence: 1, operation: { family: "shell.inspect", label: "正在查看项目结构" } });
  const presentation = await runtime.present(started);

  assert.equal(presentation.record.story.packId, "evidence-wall");
  assert.equal(presentation.record.story.chapterId, "opening");
  assert.equal(presentation.timeline.loop, true);
  assert.equal(JSON.stringify(presentation).includes("resolved"), false);
});

test("the five official Activity Story Packs are valid and cover every supported Codex tool family", async () => {
  const ids = ["evidence-wall", "patchwork-studio", "build-orchestra", "signal-observatory", "night-shift"];
  const packs = await Promise.all(ids.map(async (id) => createActivityStoryPack(JSON.parse(await readFile(new URL(`../../../activity-packs/${id}/scene.json`, import.meta.url), "utf8")))));
  const runtime = new ActivityStoryRuntime({ packs });

  for (const family of ["shell.inspect", "patch.apply", "shell.test", "mcp.call", "local.tool"]) {
    const presentation = await runtime.present(createActivityEvent({
      type: "tool.started",
      runId: `run_${family.replaceAll(".", "_")}`,
      spanId: "span_demo",
      sequence: 1,
      operation: { family, label: "正在工作" },
    }));
    assert.ok(presentation.timeline.loop);
    assert.ok(presentation.record.story.packId);
  }
});
