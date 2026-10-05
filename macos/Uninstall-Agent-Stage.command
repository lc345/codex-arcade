#!/bin/bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
"$ROOT/macos/scripts/uninstall-agent-stage-macos.sh"
printf '\nAgent Stage was removed. Press Return to close this window.\n'
read -r _
