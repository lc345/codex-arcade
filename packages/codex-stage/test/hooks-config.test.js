import assert from "node:assert/strict";
import test from "node:test";

import { installAgentStageHooks, removeAgentStageHooks } from "../src/hooks-config.js";

test("upgrades preserve unrelated handlers inside shared groups and install Interrupt", () => {
  const existing = { hooks: { Stop: [{ matcher: "*", hooks: [{ type: "command", command: "echo keep" }, { type: "command", command: "/old/agent-stage-hook-collector.js" }] }] } };
  const installed = installAgentStageHooks(existing, { command: "/new/agent-stage-hook-collector.js" });
  assert.equal(installed.hooks.Stop[0].hooks[0].command, "echo keep");
  assert.equal(installed.hooks.Interrupt.length, 1);
  assert.deepEqual(installAgentStageHooks(installed, { command: "/new/agent-stage-hook-collector.js" }), installed);
  const removed = removeAgentStageHooks(installed);
  assert.equal(removed.hooks.Stop[0].hooks[0].command, "echo keep");
  assert.equal(removed.hooks.Interrupt, undefined);
});

test("installing Agent Stage hooks preserves unrelated user hook groups", () => {
  const existing = {
    description: "My Codex hooks",
    hooks: {
      PreToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "python3 ~/policy.py" }] }],
    },
  };
  const installed = installAgentStageHooks(existing, { command: "/Users/me/.codex/agent-stage/hook-collector.js" });

  assert.equal(installed.hooks.PreToolUse.length, 2);
  assert.equal(installed.hooks.PreToolUse[0].hooks[0].command, "python3 ~/policy.py");
  assert.equal(installed.hooks.PostToolUse.length, 1);
  assert.match(installed.hooks.PostToolUse[0].hooks[0].command, /agent-stage/);
  assert.equal(installed.hooks.UserPromptSubmit.length, 1);
  assert.equal(installed.hooks.SessionStart, undefined);
  assert.equal(Object.hasOwn(installed.hooks.PostToolUse[0].hooks[0], "agentStage"), false);
});

test("installing the turn-scoped hook removes Agent Stage's retired session-start group only", () => {
  const installed = installAgentStageHooks({
    hooks: {
      SessionStart: [
        { matcher: "startup", hooks: [{ type: "command", command: "echo keep" }] },
        { matcher: "*", hooks: [{ type: "command", command: "/stage/agent-stage-hook-collector.js" }] },
      ],
    },
  }, { command: "/stage/agent-stage-hook-collector.js" });

  assert.equal(installed.hooks.SessionStart.length, 1);
  assert.equal(installed.hooks.SessionStart[0].hooks[0].command, "echo keep");
  assert.equal(installed.hooks.UserPromptSubmit.length, 1);
});

test("removing Agent Stage hooks restores unrelated groups without deleting the hooks file", () => {
  const installed = installAgentStageHooks({ hooks: { Stop: [{ hooks: [{ type: "command", command: "echo keep" }] }] } }, { command: "/stage/agent-stage-hook-collector.js" });
  const restored = removeAgentStageHooks(installed);

  assert.equal(restored.hooks.Stop.length, 1);
  assert.equal(restored.hooks.Stop[0].hooks[0].command, "echo keep");
  assert.equal(restored.hooks.PreToolUse, undefined);
  assert.equal(restored.hooks.PostToolUse, undefined);
});
