# Agent Stage for Codex 0.11.1-beta.3 · macOS Beta

## English

100 local mini-games while Codex works. A small game-only window follows Codex, pauses when you switch apps, and stops when the task ends or is interrupted.

### New in Beta 3

- Larger 520px game window, with responsive sizing for narrow Codex windows.
- Compatibility with the current `codex-cli/bin/codex` app layout; legacy paths remain supported.
- Updated README animation showing concurrent work and real gameplay. The surrounding Codex session is illustrated, not a private screen recording.
- Clearer guidance when a previously opened chat does not emit start events: finish active work, quit and reopen Codex, then send a new task.

**Download Agent-Stage-for-Codex.zip**, extract it, and double-click **Install Agent Stage.command**. Open and sign into Codex Desktop first; after installation, send a new task. The DMG contains the same files. Do not use GitHub's automatic source ZIP as an installer.

No npm, game engine, API key or additional runtime download is required. Official Node runtimes for Apple Silicon and Intel are included. Use Check for diagnostics, Pause/Resume to control games, and Uninstall to remove this project's runtime/service/hooks while retaining unrelated hooks and preferences.

**Unsigned, unnotarized community beta; not an OpenAI product.** Verify the SHA-256 file and follow macOS first-open guidance only if you trust the download. Never disable Gatekeeper globally. Apple Silicon has been tested locally; Intel and additional macOS versions still need hardware testing. The collection includes 93 preview games and seven curated stable entries. Windows has browser-only experiment documentation, not an automatic companion installer.

The release candidate's public source was freshly cloned and reinstalled on the maintainer's Apple Silicon Mac running macOS 26.5.1 and Codex 26.928.40906. Unrelated hooks/media were preserved. A real CLI task exercised the complete lifecycle; the maintainer then confirmed automatic appearance and closure in a real Desktop writing task. This is an existing-Mac reinstall, not a clean-OS or first-open Gatekeeper certification. Release CI separately tests the actual ZIP with an isolated HOME, minimal PATH and bundled Node.

[English README](https://github.com/lc345/codex-arcade#readme) | [中文 README](https://github.com/lc345/codex-arcade/blob/main/README.zh-CN.md)

## 中文

Codex 工作时，在右下角玩一局小游戏。任务完成或中断后自动停止，切到其他应用时隐藏暂停。

## 下载哪个文件

**推荐 Agent-Stage-for-Codex.zip**：解压后双击 **Install Agent Stage.command**。DMG 含相同内容，二选一。不需要 npm、游戏引擎、API Key 或额外下载运行库。不要把下方 GitHub 自动生成的 Source code (zip) 当作安装包。

先安装并登录 Codex Desktop。安装成功后，返回 Codex 发送新任务。安装器在终端中自动执行四个步骤，无需手输命令；请等到显示“安装完成”。更新也是重复运行新安装器。

## 包含什么

- 100 款保留游戏，随机不重复轮换；长任务中可手动换游戏。
- 520px 游戏小窗，小窗口自动缩小，默认静音；任务结束时停止输入、动画、声音。
- 兼容新版 Codex 的 `codex-cli/bin/codex` 路径，同时保留旧路径。
- 更新首页动图，展示任务与游戏同时进行；外围任务界面为明确标注的示意，不是私人录屏。
- 已修复后台调度导致小窗约 5 FPS 的问题，使用交互式进程调度。
- 安装、检查、暂停、恢复、卸载；只管理自己的 hooks。
- Apple Silicon 和 Intel 的官方 Node 运行库、许可证及下载摘要。

## 已知边界

这是未签名、未公证的社区 Beta，不是 OpenAI 官方产品。首次打开可能需要 macOS 安全确认；请核对同页 SHA-256 文件，只在信任来源时确认，切勿全局关闭 Gatekeeper。详见压缩包 README。

Apple Silicon 本机已验证；Intel 及更多 macOS 版本仍需实机反馈。100 款包含 93 款 preview，不表示全部完成正式验收。远程任务、组织禁用 hooks、所有全屏/多显示器组合不保证。

已从公开 GitHub 重新克隆候选源码，在维护者的 macOS 26.5.1 / Codex 26.928.40906 上卸载后重装，保留无关 hooks 和媒体。真实 CLI 生命周期已测试；维护者也确认真实桌面写作任务开始时弹出、结束时收起。这不是全新系统或 Gatekeeper 首次下载验收。Release CI 另行检查实际 ZIP 在隔离 HOME、最小 PATH 下使用内置 Node 的运行情况。

Windows 尚无一键安装版；源码 docs/WINDOWS_TESTING.zh-CN.md 提供网页试玩实验教程，不会自动关联 Windows Codex。

没有弹窗先双击 Check Agent Stage.command。反馈版本、系统、芯片、游戏名及脱敏错误；不要上传 daemon.json、window.json、hooks 备份或任务日志。

若 Check 正常但旧会话不弹窗，请先结束当前任务，退出并重新打开 Codex，再发新任务。安装器不会自动重启 Codex，也无法补发先前漏掉的事件。
