#!/bin/bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
RUNTIME_DIR="$HOME/.codex/agent-stage"
STATE_DIR="$HOME/Library/Application Support/AgentStage"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
HOOKS_FILE="$CODEX_HOME/hooks.json"
source "$ROOT/macos/scripts/agent-stage-env.sh"
require_macos
printf '\n[1/4] 检查 Codex 和运行环境 / Checking requirements...\n'
NODE_BIN="$(resolve_agent_stage_node)"
require_agent_stage_node_22 "$NODE_BIN"
CODEX_BIN="$(resolve_agent_stage_codex)"
"$NODE_BIN" "$ROOT/macos/scripts/manage-agent-stage-hooks.mjs" check "$HOOKS_FILE"
if [[ "$ROOT" == "$RUNTIME_DIR" ]]; then
  printf '%s\n' 'Run Install.command from your downloaded copy, not the installed runtime.' >&2
  exit 1
fi
STAGED="$(mktemp -d)"
trap 'rm -rf "$STAGED"' EXIT
printf '\n[2/4] 准备本地游戏 / Preparing local games...\n'
"$NODE_BIN" "$ROOT/tools/distribution.mjs" "$ROOT" "$STAGED/payload"
"$NODE_BIN" "$STAGED/payload/tools/build-game-packs.mjs"
mkdir -p "$RUNTIME_DIR" "$STATE_DIR"
if [[ -f "$HOOKS_FILE" ]]; then cp -p "$HOOKS_FILE" "$STATE_DIR/hooks-before-install.json"; chmod 600 "$STATE_DIR/hooks-before-install.json"; fi
launchctl bootout "gui/$(id -u)/com.agentstage.codex" 2>/dev/null || true
rsync -a --delete "$STAGED/payload/" "$RUNTIME_DIR/"
# A Release-bundled runtime must point into the persistent copy, not the mounted DMG.
if [[ "$NODE_BIN" == "$ROOT/runtime/"* ]]; then NODE_BIN="$RUNTIME_DIR/${NODE_BIN#"$ROOT/"}"; fi
COLLECTOR_COMMAND="\"$NODE_BIN\" \"$RUNTIME_DIR/packages/codex-stage/src/agent-stage-hook-collector.js\""
printf '\n[3/4] 接入 Codex / Connecting to Codex...\n'
"$NODE_BIN" "$RUNTIME_DIR/macos/scripts/manage-agent-stage-hooks.mjs" install "$HOOKS_FILE" "$COLLECTOR_COMMAND"
"$NODE_BIN" "$RUNTIME_DIR/macos/scripts/trust-agent-stage-hooks.mjs" "$CODEX_BIN" "$RUNTIME_DIR"
printf '\n[4/4] 启动并检查游戏小窗 / Starting and checking the companion...\n'
AGENT_STAGE_NODE="$NODE_BIN" AGENT_STAGE_RUNTIME_ROOT="$RUNTIME_DIR" "$RUNTIME_DIR/macos/scripts/start-agent-stage-macos.sh"
"$NODE_BIN" "$RUNTIME_DIR/macos/scripts/agent-stage-doctor.mjs" --runtime "$RUNTIME_DIR" --strict
printf '\n安装完成。回到 Codex 发送一条新消息即可。\n任务开始：右下角独立游戏小窗；任务完成或中断：停止并收起。\n不修改主题，也不会自动重启 Codex。若检查正常但仍无小窗，请结束当前任务，退出并重新打开 Codex 后再发新任务。\n试玩：http://127.0.0.1:4173/codex-stage\n'
