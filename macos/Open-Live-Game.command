#!/bin/bash
set -Eeuo pipefail
ROOT="${AGENT_STAGE_RUNTIME_ROOT:-$HOME/.codex/agent-stage}"
source "$ROOT/macos/scripts/agent-stage-env.sh"
NODE_BIN="$(resolve_agent_stage_node)"
require_agent_stage_node_22 "$NODE_BIN"
exec "$NODE_BIN" "$ROOT/macos/scripts/open-agent-stage-live.mjs"
