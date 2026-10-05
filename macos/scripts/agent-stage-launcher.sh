#!/bin/bash
set -Eeuo pipefail

ROOT="${AGENT_STAGE_RUNTIME_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
STATE_DIR="$HOME/Library/Application Support/AgentStage"
NODE_BIN="${AGENT_STAGE_NODE:-}"
WEB_PORT="${AGENT_STAGE_WEB_PORT:-4173}"
CDP_PORT="${AGENT_STAGE_CDP_PORT:-9341}"

if [[ -z "$NODE_BIN" || ! -x "$NODE_BIN" ]]; then
  printf '%s\n' "Agent Stage needs its configured Node runtime." >&2
  exit 1
fi

cd "$ROOT"
mkdir -p "$STATE_DIR"
TOKEN="$(openssl rand -hex 24)"
PIDS=()

cleanup() {
  for pid in "${PIDS[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}
trap 'cleanup; exit 0' INT TERM

env PORT="$WEB_PORT" "$NODE_BIN" "$ROOT/apps/press-lab/server.js" >"$STATE_DIR/web.log" 2>&1 &
PIDS+=("$!")
env AGENT_STAGE_TOKEN="$TOKEN" AGENT_STAGE_WEB_PORT="$WEB_PORT" "$NODE_BIN" "$ROOT/packages/codex-stage/src/macos-daemon.js" >"$STATE_DIR/daemon.log" 2>&1 &
PIDS+=("$!")
if [[ "${AGENT_STAGE_DISPLAY_MODE:-popup}" == "embedded" ]]; then
env AGENT_STAGE_TOKEN="$TOKEN" AGENT_STAGE_CDP_PORT="$CDP_PORT" AGENT_STAGE_DOCK_URL="http://127.0.0.1:$WEB_PORT/codex-stage" "$NODE_BIN" "$ROOT/packages/codex-stage/src/cdp-watchdog.js" >"$STATE_DIR/cdp-watchdog.log" 2>&1 &
PIDS+=("$!")
else
  /usr/bin/osascript -l JavaScript "$ROOT/macos/scripts/native-game-window.js" "$STATE_DIR/window.json" --observe >"$STATE_DIR/geometry.log" 2>&1 &
  PIDS+=("$!")
  /usr/bin/osascript -l JavaScript "$ROOT/macos/scripts/native-game-window.js" "$STATE_DIR/window.json" >"$STATE_DIR/window.log" 2>&1 &
  PIDS+=("$!")
fi

while true; do
  for pid in "${PIDS[@]}"; do
    if ! kill -0 "$pid" 2>/dev/null; then
      wait "$pid" || true
      cleanup
      exit 1
    fi
  done
  sleep 1
done
