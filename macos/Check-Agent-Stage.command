#!/bin/bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT/macos/scripts/agent-stage-env.sh"
NODE_BIN="$(resolve_agent_stage_node)"
"$NODE_BIN" "$ROOT/macos/scripts/agent-stage-doctor.mjs"
printf '\nPress Return to close this window.\n'
read -r _
