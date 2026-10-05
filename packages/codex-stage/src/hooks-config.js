export const AGENT_STAGE_HOOK_MARKER = "agent-stage-hook-collector";

const installedEvents = ["UserPromptSubmit", "PreToolUse", "PostToolUse", "Stop", "Interrupt"];
const managedEvents = ["SessionStart", ...installedEvents];

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function groupFor(event, command) {
  const status = {
    UserPromptSubmit: "Agent Stage is opening this turn",
    PreToolUse: "Agent Stage is observing activity",
    PostToolUse: "Agent Stage is closing activity",
    Stop: "Agent Stage is closing this run",
    Interrupt: "Agent Stage is stopping the game",
  }[event];
  return {
    matcher: "*",
    hooks: [{ type: "command", command, timeout: 3, statusMessage: status }],
  };
}

function withoutAgentStage(groups) {
  return groups.flatMap(group => {
    if (!Array.isArray(group?.hooks)) return [group];
    const hooks = group.hooks.filter(hook => hook?.agentStage !== AGENT_STAGE_HOOK_MARKER && !String(hook?.command ?? "").includes(AGENT_STAGE_HOOK_MARKER));
    return hooks.length ? [{ ...group, hooks }] : [];
  });
}

export function installAgentStageHooks(existing, { command }) {
  if (!command || typeof command !== "string") throw new Error("Agent Stage hook command is required");
  const output = clone(existing);
  output.hooks = output.hooks && typeof output.hooks === "object" ? output.hooks : {};
  for (const event of managedEvents) {
    const groups = Array.isArray(output.hooks[event]) ? withoutAgentStage(output.hooks[event]) : [];
    if (installedEvents.includes(event)) groups.push(groupFor(event, command));
    if (groups.length) output.hooks[event] = groups;
    else delete output.hooks[event];
  }
  return output;
}

export function removeAgentStageHooks(existing) {
  const output = clone(existing);
  if (!output.hooks || typeof output.hooks !== "object") return output;
  for (const event of managedEvents) {
    if (!Array.isArray(output.hooks[event])) continue;
    const retained = withoutAgentStage(output.hooks[event]);
    if (retained.length) output.hooks[event] = retained;
    else delete output.hooks[event];
  }
  return output;
}
