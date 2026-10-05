#!/bin/bash

# Shared local-runtime discovery for the Finder commands and installer.

require_macos() {
  if [[ "$(uname -s)" != "Darwin" ]]; then
    printf '%s\n' "Agent Stage for Codex currently supports macOS only." >&2
    return 1
  fi
}

resolve_agent_stage_node() {
  local candidate app
  if [[ -n "${AGENT_STAGE_NODE:-}" && -x "$AGENT_STAGE_NODE" ]]; then printf '%s\n' "$AGENT_STAGE_NODE"; return; fi
  for candidate in \
    "${ROOT:-.}/runtime/$(uname -m)/bin/node" \
    "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" \
    "/Applications/Codex.app/Contents/Resources/node" \
    "/Applications/ChatGPT.app/Contents/Resources/node" \
    "$(command -v node || true)"; do
    if [[ -x "$candidate" ]] && require_agent_stage_node_22 "$candidate" 2>/dev/null; then printf '%s\n' "$candidate"; return; fi
  done
  for app in "/Applications/Codex.app" "/Applications/ChatGPT.app"; do
    if [[ -d "$app" ]]; then
      candidate="$(find "$app" -type f -name node -perm -u+x 2>/dev/null | head -n 1 || true)"
      if [[ -n "$candidate" ]]; then printf '%s\n' "$candidate"; return; fi
    fi
  done
  printf '%s\n' "A Node 22+ runtime is required. Install Codex Desktop or set AGENT_STAGE_NODE." >&2
  return 1
}

require_agent_stage_node_22() {
  local node_bin="$1" version major
  version="$("$node_bin" -p 'process.versions.node' 2>/dev/null || true)"
  major="${version%%.*}"
  if [[ ! "$major" =~ ^[0-9]+$ ]] || (( major < 22 )); then
    printf '%s\n' "Agent Stage needs Node 22+; found ${version:-an unreadable runtime}." >&2
    return 1
  fi
}

resolve_agent_stage_codex() {
  local candidate
  if [[ -n "${AGENT_STAGE_CODEX_BIN:-}" && -x "$AGENT_STAGE_CODEX_BIN" ]]; then printf '%s\n' "$AGENT_STAGE_CODEX_BIN"; return; fi
  for candidate in \
    "/Applications/Codex.app/Contents/Resources/codex" \
    "/Applications/ChatGPT.app/Contents/Resources/codex"; do
    if [[ -x "$candidate" ]]; then printf '%s\n' "$candidate"; return; fi
  done
  if command -v codex >/dev/null 2>&1; then command -v codex; return; fi
  printf '%s\n' "Codex CLI is required to record trusted Agent Stage hook hashes." >&2
  return 1
}
