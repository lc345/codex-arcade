#!/bin/bash
set -Eeuo pipefail
STATE="$HOME/Library/Application Support/AgentStage"
mkdir -p "$STATE"
touch "$STATE/paused"
printf '%s\n' 'Agent Stage 已暂停。不会影响 Codex 工作。双击 Resume.command 恢复。'
