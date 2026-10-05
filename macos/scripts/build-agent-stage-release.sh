#!/bin/bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
source "$ROOT/macos/scripts/agent-stage-env.sh"
NODE_BIN="$(resolve_agent_stage_node)"
require_agent_stage_node_22 "$NODE_BIN"
"$NODE_BIN" "$ROOT/tools/build-game-packs.mjs"
OUTPUT="${1:-$ROOT/dist/Agent-Stage-for-Codex.dmg}"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/Agent Stage for Codex"
"$NODE_BIN" "$ROOT/tools/distribution.mjs" "$ROOT" "$STAGE/Agent Stage for Codex/.agent-stage"
"$NODE_BIN" "$ROOT/tools/bundle-node-runtime.mjs" "$STAGE/Agent Stage for Codex/.agent-stage"
for command in "Install Agent Stage" "Open Agent Stage" "Open Live Game" "Check Agent Stage" "Uninstall Agent Stage"; do
  source_script="${command// /-}.command"
  command_file="$command.command"
  {
    printf '#!/bin/bash\nset -Eeuo pipefail\n'
    printf 'ROOT="$(cd "$(dirname "$0")/.agent-stage" && pwd)"\n'
    printf 'exec "$ROOT/macos/%s"\n' "$source_script"
  } > "$STAGE/Agent Stage for Codex/$command_file"
  chmod +x "$STAGE/Agent Stage for Codex/$command_file"
done
cp "$ROOT/Pause.command" "$ROOT/Resume.command" "$STAGE/Agent Stage for Codex/"
cp "$ROOT/macos/README.md" "$STAGE/Agent Stage for Codex/README.md"
"$NODE_BIN" "$ROOT/tools/write-release-manifest.mjs" "$STAGE/Agent Stage for Codex"
mkdir -p "$(dirname "$OUTPUT")"
hdiutil create -volname "Agent Stage for Codex" -srcfolder "$STAGE/Agent Stage for Codex" -ov -format UDZO "$OUTPUT"
ditto -c -k --sequesterRsrc --keepParent "$STAGE/Agent Stage for Codex" "${OUTPUT%.dmg}.zip"
(cd "$(dirname "$OUTPUT")" && shasum -a 256 "$(basename "$OUTPUT")" "$(basename "${OUTPUT%.dmg}.zip")" > "$(basename "$OUTPUT").sha256")
