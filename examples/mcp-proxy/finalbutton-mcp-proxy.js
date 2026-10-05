#!/usr/bin/env node
/**
 * A dependency-free stdio MCP proxy. Unknown upstream tools are high-risk by
 * default and must pass through a FinalButton presenter before they are sent.
 *
 * Required environment:
 *   FINALBUTTON_UPSTREAM_COMMAND  command that starts the upstream MCP server
 * Optional environment:
 *   FINALBUTTON_UPSTREAM_ARGS     JSON array of upstream command arguments
 *   FINALBUTTON_PRESENT_COMMAND   executable that receives an ActionRequest JSON
 *                                 on stdin and outputs {outcome, method, reason?}
 * Optional environment:
 *   FINALBUTTON_PRESENT_ARGS      JSON array of presenter arguments
 */
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createMcpToolDefinition, FinalButtonGuard, createSignedDecision, gateMcpToolCall } from "../../packages/core-ts/src/index.ts";

const upstreamCommand = process.env.FINALBUTTON_UPSTREAM_COMMAND;
const upstreamArgs = process.env.FINALBUTTON_UPSTREAM_ARGS ? JSON.parse(process.env.FINALBUTTON_UPSTREAM_ARGS) : [];
const presenterCommand = process.env.FINALBUTTON_PRESENT_COMMAND;
const presenterArgs = process.env.FINALBUTTON_PRESENT_ARGS ? JSON.parse(process.env.FINALBUTTON_PRESENT_ARGS) : [];
if (!upstreamCommand) throw new Error("FINALBUTTON_UPSTREAM_COMMAND is required");
if (!Array.isArray(upstreamArgs)) throw new Error("FINALBUTTON_UPSTREAM_ARGS must be a JSON array");
if (!Array.isArray(presenterArgs)) throw new Error("FINALBUTTON_PRESENT_ARGS must be a JSON array");

const upstream = spawn(upstreamCommand, upstreamArgs, { stdio: ["pipe", "pipe", "inherit"], shell: false });
const sessionSecret = process.env.FINALBUTTON_SESSION_SECRET ?? randomBytes(32).toString("hex");
const responseWaiters = new Map();
let inputEnded = false;
let activeApprovals = 0;

function closeUpstreamWhenIdle() {
  if (inputEnded && activeApprovals === 0 && !upstream.stdin.destroyed) upstream.stdin.end();
}

function presentWithCommand(request) {
  if (!presenterCommand) return undefined;
  return new Promise((resolve, reject) => {
    const child = spawn(presenterCommand, presenterArgs, { stdio: ["pipe", "pipe", "inherit"], shell: false });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(`FinalButton presenter exited with ${code}`));
      try {
        const input = JSON.parse(output);
        if (!["approve_once", "deny", "defer", "expired", "request_details"].includes(input.outcome)) throw new Error("Presenter returned an invalid outcome");
        if (!["hold", "tap", "deny_button", "dial", "policy", "system"].includes(input.method)) throw new Error("Presenter returned an invalid method");
        resolve(createSignedDecision(request, input, sessionSecret));
      } catch (error) {
        reject(error);
      }
    });
    child.stdin.end(JSON.stringify(request));
  });
}

const guard = new FinalButtonGuard({ sessionSecret, present: presentWithCommand });

function keyFor(id) {
  return JSON.stringify(id);
}

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function forwardAndWait(message) {
  return new Promise((resolve, reject) => {
    if (message.id === undefined) return reject(new Error("MCP tools/call must have an id"));
    const key = keyFor(message.id);
    responseWaiters.set(key, { resolve, reject });
    upstream.stdin.write(`${JSON.stringify(message)}\n`);
  });
}

function readLines(stream, callback) {
  let buffer = "";
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      callback(JSON.parse(line));
    }
  });
}

readLines(upstream.stdout, (message) => {
  const waiter = message.id === undefined ? undefined : responseWaiters.get(keyFor(message.id));
  if (waiter) {
    responseWaiters.delete(keyFor(message.id));
    waiter.resolve(message);
  } else {
    send(message);
  }
});

readLines(process.stdin, async (message) => {
  if (message.method !== "tools/call") {
    upstream.stdin.write(`${JSON.stringify(message)}\n`);
    return;
  }
  const params = message.params ?? {};
  const definition = createMcpToolDefinition({ server: process.env.FINALBUTTON_UPSTREAM_NAME ?? "upstream", tool: params.name ?? "unknown" });
  activeApprovals += 1;
  try {
    const receipt = await gateMcpToolCall(guard, definition, params.arguments ?? {}, () => forwardAndWait(message));
    if (receipt.status === "succeeded") {
      send(receipt.result);
      return;
    }
    send({
      jsonrpc: "2.0",
      id: message.id,
      error: { code: -32001, message: `FinalButton ${receipt.status}`, data: { receipt } },
    });
  } catch (error) {
    send({ jsonrpc: "2.0", id: message.id, error: { code: -32000, message: error instanceof Error ? error.message : String(error) } });
  } finally {
    activeApprovals -= 1;
    closeUpstreamWhenIdle();
  }
});

// A one-shot stdio client may close immediately after its request. Propagate
// that close so the upstream process and this proxy can terminate cleanly.
process.stdin.on("end", () => {
  inputEnded = true;
  closeUpstreamWhenIdle();
});

upstream.on("exit", (code) => {
  for (const waiter of responseWaiters.values()) waiter.reject(new Error("Upstream MCP server exited"));
  process.exitCode = code ?? 1;
});
