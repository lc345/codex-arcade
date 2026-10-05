#!/bin/bash
set -Eeuo pipefail

ROOT="${AGENT_STAGE_RUNTIME_ROOT:-$HOME/.codex/agent-stage}"
source "$ROOT/macos/scripts/agent-stage-env.sh"
require_macos
NODE_BIN="$(resolve_agent_stage_node)"
require_agent_stage_node_22 "$NODE_BIN"
if [[ ! -f "$ROOT/macos/scripts/agent-stage-launcher.sh" ]]; then
  printf '%s\n' "Start with the Agent Stage installer first; runtime is missing at $ROOT." >&2
  exit 1
fi
STATE_DIR="$HOME/Library/Application Support/AgentStage"
LABEL="com.agentstage.codex"
GUI_DOMAIN="gui/$(id -u)"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
mkdir -p "$STATE_DIR"
CDP_PORT="${AGENT_STAGE_CDP_PORT:-9341}"
launchctl bootout "$GUI_DOMAIN/$LABEL" 2>/dev/null || true
# Ignore status left by the previous process when deciding whether this launch succeeded.
STARTED_AT="$("$NODE_BIN" -p 'Date.now()')"
"$NODE_BIN" "$ROOT/macos/scripts/write-launch-agent.mjs" "$PLIST" "$ROOT" "$NODE_BIN" "$CDP_PORT" "$STATE_DIR/launch-agent.log"
sleep 0.3
STARTED=false
for _ in $(seq 1 5); do
  if launchctl bootstrap "$GUI_DOMAIN" "$PLIST" 2>/dev/null; then
    STARTED=true
    break
  fi
  sleep 0.3
done
if [[ "$STARTED" != "true" ]]; then
  printf '%s\n' "Agent Stage LaunchAgent could not be loaded. See $STATE_DIR/launch-agent.log." >&2
  exit 1
fi
for _ in $(seq 1 30); do
  if curl --max-time 1 -fsS http://127.0.0.1:4282/v1/health >/dev/null 2>&1 && curl --max-time 1 -fsS http://127.0.0.1:4173/codex-stage >/dev/null 2>&1; then
    if "$NODE_BIN" -e 'const fs=require("node:fs");try{const s=JSON.parse(fs.readFileSync(process.argv[1]));process.exit(s.updatedAt>=Number(process.argv[2])&&Date.now()-s.updatedAt<3000&&s.eventLoopRunning===true?0:1)}catch{process.exit(1)}' "$STATE_DIR/window.json.status" "$STARTED_AT"; then
      printf '%s\n' "Agent Stage is running locally at http://127.0.0.1:4173/codex-stage with LaunchAgent $LABEL."
      exit 0
    fi
  fi
  sleep 0.2
done
printf '%s\n' "Agent Stage did not become ready. Check ports 4173 / 4282 and $STATE_DIR/window.log / launch-agent.log." >&2
exit 1
