#!/bin/bash
set -Eeuo pipefail

STATE_DIR="$HOME/Library/Application Support/AgentStage"
LABEL="com.agentstage.codex"
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
rm -f "$STATE_DIR/daemon.json"
printf '%s\n' "Agent Stage local companion stopped."
