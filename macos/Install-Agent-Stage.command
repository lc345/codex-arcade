#!/bin/bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if ! "$ROOT/macos/scripts/install-agent-stage-macos.sh"; then
  printf '\n安装未完成 / Installation did not finish.\n请先确认 Codex 已安装，再查看上方错误。完整 Release 不需要另装 Node。\n排障：双击 Check Agent Stage.command。请勿分享 daemon.json、window.json 或 hooks 备份。\n' >&2
  if [[ -t 0 ]]; then printf '\n按回车关闭 / Press Return to close.\n'; read -r _; fi
  exit 1
fi
if [[ -t 0 ]]; then printf '\n安装成功。回到 Codex 发送新任务即可；可以关闭此窗口。\nInstalled. Send a new Codex message to play. Press Return to close.\n'; read -r _; fi
