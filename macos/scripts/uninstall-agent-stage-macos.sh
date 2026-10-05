#!/bin/bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
"$ROOT/macos/scripts/stop-agent-stage-macos.sh" || true
rm -f "$HOME/Library/LaunchAgents/com.agentstage.codex.plist"
source "$ROOT/macos/scripts/agent-stage-env.sh"
require_macos
NODE_BIN="$(resolve_agent_stage_node)"
require_agent_stage_node_22 "$NODE_BIN"
"$NODE_BIN" "$ROOT/macos/scripts/manage-agent-stage-hooks.mjs" remove "$CODEX_HOME/hooks.json"
rm -rf "$HOME/.codex/agent-stage"
printf '%s\n' "Removed Agent Stage hooks and runtime."
