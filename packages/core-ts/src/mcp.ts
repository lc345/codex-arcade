import { createActionDefinition, type FinalButtonGuard } from "./guard.ts";
import type { ActionDefinition, ActionReceipt, RiskLevel } from "./types.ts";

export type McpToolDefinitionOptions = {
  server: string;
  tool: string;
  title?: string;
  trustedRisk?: RiskLevel;
};

function summarizeArguments(args: Record<string, unknown>): string {
  const keys = Object.keys(args).slice(0, 3);
  if (keys.length === 0) return "No input arguments.";
  return keys.map((key) => `${key}: ${JSON.stringify(args[key])}`).join(" | ");
}

/**
 * MCP annotations are intentionally ignored here. They are hints, not a trusted
 * authorization signal. A host must opt in with trustedRisk to lower risk.
 */
export function createMcpToolDefinition(options: McpToolDefinitionOptions): ActionDefinition<Record<string, unknown>> {
  if (!options.server || !options.tool) throw new Error("MCP server and tool names are required");
  return createActionDefinition({
    id: `mcp.${options.server}.${options.tool}`,
    category: "external.mcp",
    defaultRisk: options.trustedRisk ?? "high",
    reversible: false,
    expiresInSeconds: 90,
    validate(input) {
      if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("MCP tool arguments must be an object");
      return { ...(input as Record<string, unknown>) };
    },
    card(args) {
      return {
        title: options.title ?? `Run ${options.tool}`,
        summary: summarizeArguments(args),
        target: `${options.server}/${options.tool}`,
        impact: "An MCP tool will run against an external service.",
        rollback: "Rollback depends on the upstream MCP server.",
      };
    },
  });
}

export async function gateMcpToolCall<Result>(
  guard: FinalButtonGuard,
  definition: ActionDefinition<Record<string, unknown>>,
  args: Record<string, unknown>,
  invoke: () => Result | Promise<Result>,
): Promise<ActionReceipt> {
  return guard.run(definition, args, invoke, { agentId: "mcp-proxy", runId: `${definition.id}:${Date.now()}` });
}
