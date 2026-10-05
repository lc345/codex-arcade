#!/bin/bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
"$ROOT/macos/scripts/start-agent-stage-macos.sh"
