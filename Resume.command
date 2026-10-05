#!/bin/bash
set -Eeuo pipefail
rm -f "$HOME/Library/Application Support/AgentStage/paused"
exec /bin/bash "$HOME/.codex/agent-stage/macos/scripts/start-agent-stage-macos.sh"
