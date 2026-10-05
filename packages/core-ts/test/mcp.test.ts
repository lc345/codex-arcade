import assert from "node:assert/strict";
import test from "node:test";

import { FinalButtonGuard, createMcpToolDefinition, createSignedDecision, gateMcpToolCall } from "../src/index.ts";

test("an MCP tool without a trusted policy is treated as high risk and waits for FinalButton", async () => {
  let calls = 0;
  let requestedRisk = "";
  const guard = new FinalButtonGuard({
    sessionSecret: "mcp-secret",
    present: (request) => {
      requestedRisk = request.action.risk;
      return createSignedDecision(request, { outcome: "approve_once", method: "hold" }, "mcp-secret");
    },
  });
  const definition = createMcpToolDefinition({ server: "crm", tool: "update_contact", title: "Update contact" });

  const receipt = await gateMcpToolCall(guard, definition, { id: "c_123", status: "qualified" }, async () => {
    calls += 1;
    return { updated: true };
  });

  assert.equal(requestedRisk, "high");
  assert.equal(calls, 1);
  assert.equal(receipt.status, "succeeded");
});
