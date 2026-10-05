const activityTypes = new Set([
  "turn.started",
  "tool.started",
  "tool.slow",
  "tool.completed",
  "tool.failed",
  "turn.completed",
]);

const toolLabels = {
  "shell.inspect": { zh: "正在查看项目结构", en: "Reading the project structure" },
  "shell.build": { zh: "正在构建工作区", en: "Building the workspace" },
  "shell.test": { zh: "正在验证改动", en: "Verifying the changes" },
  "shell.other": { zh: "正在运行本地工具", en: "Running a local tool" },
  "patch.apply": { zh: "正在整理代码改动", en: "Shaping the code changes" },
  "mcp.call": { zh: "正在通过工具网关协作", en: "Working through the tool gateway" },
  "local.tool": { zh: "正在协调本地能力", en: "Coordinating a local capability" },
  "turn": { zh: "正在组织这次工作", en: "Organizing this run" },
};

function nonEmpty(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must be a non-empty string`);
}

function hash(value) {
  let output = 2166136261;
  for (const character of String(value)) {
    output ^= character.charCodeAt(0);
    output = Math.imul(output, 16777619);
  }
  return (output >>> 0).toString(16).padStart(8, "0");
}

function safeRunId(raw) {
  return `run_${hash(raw || "anonymous")}`;
}

function safeSpanId(raw) {
  return `span_${hash(raw)}`;
}

function toolFamily(toolName, input) {
  const name = String(toolName ?? "");
  if (name === "apply_patch" || name === "Edit" || name === "Write") return "patch.apply";
  if (name.startsWith("mcp__")) return "mcp.call";
  if (name === "Bash" || name === "exec_command") {
    const command = String(input?.command ?? "").toLowerCase();
    if (/\b(test|pytest|vitest|jest|mocha|playwright)\b/.test(command)) return "shell.test";
    if (/\b(build|compile|bundle|vite build|next build)\b/.test(command)) return "shell.build";
    if (/\b(rg|find|ls|cat|sed|head|tail|git status|git log)\b/.test(command)) return "shell.inspect";
    return "shell.other";
  }
  return "local.tool";
}

function labelFor(family, locale) {
  return toolLabels[family]?.[locale === "en" ? "en" : "zh"] ?? toolLabels["local.tool"].zh;
}

function isFailedHook(raw) {
  return Boolean(raw?.error || raw?.tool_error || raw?.failed || raw?.success === false || raw?.tool_result?.success === false);
}

/**
 * The only event shape consumed by Activity Story Packs and renderers. It is
 * deliberately incapable of carrying tool input, output, prompts, or paths.
 */
export function createActivityEvent(input) {
  if (!input || typeof input !== "object") throw new Error("ActivityEvent input must be an object");
  if (!activityTypes.has(input.type)) throw new Error("Unsupported ActivityEvent type");
  nonEmpty(input.runId, "runId");
  nonEmpty(input.spanId, "spanId");
  if (!Number.isInteger(input.sequence) || input.sequence < 1) throw new Error("sequence must be a positive integer");
  if (!input.operation || typeof input.operation !== "object") throw new Error("operation is required");
  nonEmpty(input.operation.family, "operation.family");
  nonEmpty(input.operation.label, "operation.label");
  if (input.elapsedMs !== undefined && (!Number.isInteger(input.elapsedMs) || input.elapsedMs < 0)) {
    throw new Error("elapsedMs must be a non-negative integer");
  }
  const locale = input.locale === "en" ? "en" : "zh-CN";
  const capabilities = Array.isArray(input.capabilities) ? input.capabilities.filter((value) => ["screen", "audio", "lights", "haptic"].includes(value)) : ["screen", "audio", "lights"];
  return Object.freeze({
    protocolVersion: "0.1",
    type: input.type,
    runId: input.runId,
    spanId: input.spanId,
    sequence: input.sequence,
    emittedAt: input.emittedAt ?? new Date().toISOString(),
    operation: Object.freeze({ family: input.operation.family, label: input.operation.label }),
    ...(input.elapsedMs === undefined ? {} : { elapsedMs: input.elapsedMs }),
    locale,
    privacyMode: "summary-only",
    capabilities: Object.freeze(capabilities),
  });
}

/** Maps raw Codex hook payloads while never returning a raw field. */
export class ActivityCollector {
  constructor({ now = () => Date.now(), slowAfterMs = 1_000, locale = "zh-CN" } = {}) {
    this.now = now;
    this.slowAfterMs = slowAfterMs;
    this.locale = locale;
    this.runs = new Map();
  }

  #state(raw) {
    const source = `${raw?.session_id ?? "session"}:${raw?.turn_id ?? "turn"}`;
    const runId = safeRunId(source);
    let state = this.runs.get(source);
    if (!state) {
      state = { runId, sequence: 0, toolCounters: new Map(), open: new Map(), started: false };
      this.runs.set(source, state);
    }
    return state;
  }

  #event(state, input) {
    state.sequence += 1;
    return createActivityEvent({ ...input, runId: state.runId, sequence: state.sequence, locale: this.locale, emittedAt: new Date(this.now()).toISOString() });
  }

  ingestHook(raw) {
    const state = this.#state(raw ?? {});
    const eventName = raw?.hook_event_name;
    if (eventName === "UserPromptSubmit") {
      state.started = true;
      return this.#event(state, { type: "turn.started", spanId: safeSpanId(`${state.runId}:turn`), operation: { family: "turn", label: labelFor("turn", this.locale) }, elapsedMs: 0 });
    }
    if (eventName === "SessionStart") return null;
    if (eventName === "Stop" || eventName === "Interrupt") {
      for (const item of state.open.values()) item.closed = true;
      if (!state.started) return null;
      state.started = false;
      return this.#event(state, { type: "turn.completed", spanId: safeSpanId(`${state.runId}:turn`), operation: { family: "turn", label: labelFor("turn", this.locale) }, elapsedMs: 0 });
    }
    if (eventName !== "PreToolUse" && eventName !== "PostToolUse") return null;

    const family = toolFamily(raw?.tool_name ?? raw?.toolName, raw?.tool_input ?? raw?.toolInput);
    const key = String(raw?.tool_name ?? raw?.toolName ?? "local");
    if (eventName === "PreToolUse") {
      const counter = (state.toolCounters.get(key) ?? 0) + 1;
      state.toolCounters.set(key, counter);
      const spanId = safeSpanId(`${state.runId}:${key}:${counter}`);
      const opened = { spanId, key, family, startedAt: this.now(), slowSent: false, closed: false };
      state.open.set(spanId, opened);
      return this.#event(state, { type: "tool.started", spanId, operation: { family, label: labelFor(family, this.locale) }, elapsedMs: 0 });
    }

    const candidates = [...state.open.values()].filter((item) => !item.closed && item.key === key);
    const opened = candidates[0];
    if (!opened) return null;
    opened.closed = true;
    const elapsedMs = Math.max(0, Math.round(this.now() - opened.startedAt));
    return this.#event(state, {
      type: isFailedHook(raw) ? "tool.failed" : "tool.completed",
      spanId: opened.spanId,
      operation: { family: opened.family, label: labelFor(opened.family, this.locale) },
      elapsedMs,
    });
  }

  flushSlow() {
    const events = [];
    for (const state of this.runs.values()) {
      for (const opened of state.open.values()) {
        const elapsedMs = Math.max(0, Math.round(this.now() - opened.startedAt));
        if (!opened.closed && !opened.slowSent && elapsedMs >= this.slowAfterMs) {
          opened.slowSent = true;
          events.push(this.#event(state, { type: "tool.slow", spanId: opened.spanId, operation: { family: opened.family, label: labelFor(opened.family, this.locale) }, elapsedMs }));
        }
      }
    }
    return events;
  }
}

export const activityToolFamilyFor = toolFamily;
