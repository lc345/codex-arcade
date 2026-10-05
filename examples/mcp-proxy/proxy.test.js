import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const proxy = fileURLToPath(new URL("./finalbutton-mcp-proxy.js", import.meta.url));
const upstream = fileURLToPath(new URL("./mock-upstream.js", import.meta.url));
const presenter = fileURLToPath(new URL("./approve-demo-presenter.js", import.meta.url));

test("the MCP proxy forwards a tool call only after its presenter approves it", async () => {
  const child = spawn(process.execPath, [proxy], {
    env: {
      ...process.env,
      FINALBUTTON_UPSTREAM_COMMAND: process.execPath,
      FINALBUTTON_UPSTREAM_ARGS: JSON.stringify([upstream]),
      FINALBUTTON_PRESENT_COMMAND: process.execPath,
      FINALBUTTON_PRESENT_ARGS: JSON.stringify([presenter]),
    },
    stdio: ["pipe", "pipe", "pipe"],
  });
  let output = "";
  let errors = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { errors += chunk; });
  child.stdin.end(`${JSON.stringify({ jsonrpc: "2.0", id: 7, method: "tools/call", params: { name: "update_contact", arguments: { id: "c_123" } } })}\n`);

  const code = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error("proxy did not exit after its upstream completed"));
    }, 2500);
    child.on("close", (exitCode) => {
      clearTimeout(timer);
      resolve(exitCode);
    });
  });
  assert.equal(code, 0, errors);
  assert.deepEqual(JSON.parse(output.trim()), { jsonrpc: "2.0", id: 7, result: { content: [{ type: "text", text: "upstream-ok" }] } });
});
