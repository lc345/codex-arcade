# Agent Stage for Codex · macOS Beta

Agent 工作，你玩游戏。Your agent works. You play.

## 中文：只做三步

1. 安装、打开并登录 Codex Desktop。
2. 解压完整的 Agent-Stage-for-Codex.zip，打开文件夹。DMG 也包含相同文件，选一种即可。
3. 双击 **Install Agent Stage.command**。等待四步自动安装完成，回到 Codex 发送**新任务**。

不需要输入命令、npm install、API Key、Godot、Python 或额外下载运行库。安装时会打开终端窗口，请保留到“安装完成”。完整包内置两种 Mac 芯片的运行库；Source code (zip) 不是安装包。

本 Beta 未签名/公证。首次打开可能被 macOS 拦截。确认来源、核对 Release 校验和后，仅在信任文件时，按 Apple 的官方步骤在“系统设置 → 隐私与安全性”中确认“仍要打开”：https://support.apple.com/zh-cn/102445 。不要关闭 Gatekeeper；恶意软件或损坏警告应先停止并反馈。

## 开始玩

- 任务开始：Codex 窗口右下角出现约 520px 的游戏画面，小窗口会自动缩小；思考和工具执行期间都可玩。
- 任务完成/中断：立即停止并收起。切到其他 App 或最小化 Codex 会隐藏暂停。
- 小窗右上角：鼠标悬停后可换游戏。长任务可在结算并停手后自动轮换。
- 默认静音。点击游戏后按 Esc 只关闭本轮游戏，不停止 Codex。
- 游戏库与声音设置：http://127.0.0.1:4173/codex-stage 。此处也能独立试玩，不代表真实任务触发成功。

100 款包含实验作品，并非全部正式验收。Apple Silicon 本机已验证，Intel 运行库已打包但仍待实机验收。Windows 不能使用此安装包。

## 文件用途

| 文件 | 用途 |
| --- | --- |
| Install Agent Stage.command | 首次安装或更新，不需要先卸载 |
| Check Agent Stage.command | 检查安装；可选 CDP 未开启不影响默认小窗 |
| Pause.command / Resume.command | 暂停/恢复游戏，不影响 Codex |
| Uninstall Agent Stage.command | 移除本项目服务和 hooks，保留其他 hooks 与进度/媒体 |
| Open Agent Stage.command | 重新启动已安装服务 |
| Open Live Game.command | 浏览器备用视图，不是正常使用的必需步骤 |

安装后可以删除下载文件或推出 DMG。永久文件位于 `~/.codex/agent-stage`；其中的 `macos/` 目录仍有检查和卸载入口。更新只需再次运行新 Release 的安装器。

没弹窗时：先回到 Codex 前台发送**新**任务，再运行 Check。组织策略可能禁止 hooks，安装器不会绕过。端口 4173 / 4282 冲突时先确认占用者，不要强制关闭未知程序。

如果检查正常但旧会话仍不弹窗，先结束手头任务，退出并重新打开 Codex，再发送新任务。安装器不会替你重启 Codex，也无法补发漏掉的开始事件。

不修改 Codex 安装包或主题，不要求调试端口、录屏或辅助功能权限。只读取前台应用身份及窗口几何信息。游戏不接收任务文本、命令、输出或密钥。

反馈可提供版本、系统、芯片、游戏名和已脱敏的 Check 输出。不要分享 `daemon.json`、`window.json`、hooks 备份或任务日志。

## English: Download, Unzip, Install

1. Install, open and sign into Codex Desktop.
2. Download the full **Agent-Stage-for-Codex.zip** Release asset, not GitHub's automatic source ZIP. Extract it.
3. Double-click **Install Agent Stage.command**, wait for installation to finish, then send a **new** Codex message.

No terminal commands, npm install, game engines or API keys are required. Official Node runtimes for Apple Silicon and Intel are included. Installation downloads no dependencies. This unsigned, unnotarized beta may require an explicit first-open security confirmation; only proceed if you trust and have verified the artifact. Never disable Gatekeeper globally.

The approximately 520px-wide game-only companion follows the foreground Codex window and shrinks to fit smaller windows. It hides and pauses when you switch apps, and stops on task completion/interruption. Hover the upper-right corner to shuffle; press Escape after focusing the game to dismiss this turn. Audio is muted by default.

Use Check for diagnostics, Pause/Resume to control games, and Uninstall to remove only Agent Stage's runtime, service and hooks. Existing preferences/media remain. Re-run the new Release installer to upgrade. The installed runtime is independent of the downloaded folder.

If Check passes but an existing chat never opens a game, finish your active work, quit and reopen Codex, then send a new task. The installer does not restart Codex or replay missed task-start events.

This is a community project, not an OpenAI product. macOS only; remote tasks, organization-disabled hooks, all Intel machines and all macOS versions are not certified. The Windows browser experiment is documented in the source repository, not a Windows automatic companion release.
