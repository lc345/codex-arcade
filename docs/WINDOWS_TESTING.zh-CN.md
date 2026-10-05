# Windows 实验教程：先验证游戏

本教程测试同一套网页游戏在 Windows 上的表现。**不是 Windows 安装版，不会接管 Codex hooks，不会自动弹出右下角窗口。** Mac 首发后，先用这条路径收集兼容反馈，再实现 Windows 小窗和安装器。尚未完成 Windows 实机验收。

## 需要什么

- Windows 电脑及可用的 Edge 或 Chrome。
- Node.js 22+；建议从 [Node.js 官方下载页](https://nodejs.org/en/download) 选择 LTS 的 Windows 安装器。装好后重新打开终端。
- 项目源码。这里与 Mac 用户相反：选择 GitHub 的 **Code → Download ZIP** 并解压，或用 Git 拉取发布者提供的实际仓库地址。仓库尚未公开时，不要猜测地址。

不需要 Unity、Godot、Python、npm install、API Key；Mac Release 中的运行库不能在 Windows 执行。网页实验不要求安装 Codex。

## 启动

在解压后**含 package.json 的项目根目录**，右键选择“在终端中打开”。以下命令使用 PowerShell：

```powershell
node --version
node apps/press-lab/server.js
```

版本应为 v22 或更高。看到本机地址后，保持这个终端打开，在浏览器访问：

http://127.0.0.1:4173/codex-stage

如果 4173 已被使用，不要关闭不认识的进程，改用另一个端口：

```powershell
$env:PORT = "4181"
node apps/press-lab/server.js
```

然后访问 http://127.0.0.1:4181/codex-stage 。结束时回到终端按 Ctrl+C。本服务只监听 127.0.0.1，不需要公网、防火墙入站规则或端口转发。

## 怎么测

1. 选择一款游戏，点击“开始”。若模拟任务已结束，先点击页面底部“开始任务”。
2. 按住、拖动、快速点击，确认坐标正确、输入不卡；开关声音检查是否立即生效。
3. 点击“结束任务”，确认游戏和声音停止；再开始任务，检查能否恢复。
4. 缩小浏览器窗口、切换标签页后回来，检查画布和输入是否正常。
5. 至少覆盖下面三种引擎，不只测一个简单画面。

| 测试 | 地址（默认端口） | 重点 |
| --- | --- | --- |
| 拉链别脱轨 | http://127.0.0.1:4173/codex-stage?game=zipper-run | 连续鼠标拖动和帧率 |
| 购物车下坡王 | http://127.0.0.1:4173/codex-stage?game=cart-downhill | 3D、碰撞、音效 |
| 废品冠军 | http://127.0.0.1:4173/codex-stage?game=godot-junk | Godot/WebAssembly 资源加载 |

小窗样式的网页预览可在对应地址末尾加 `&popup=1`。它仍然只是浏览器里的模拟任务，不代表 Windows Codex 自动触发已经实现。

## 常见问题

- `node` 无法识别：安装官方 Node 后重新打开终端，再运行 `node --version`。
- `MODULE_NOT_FOUND`：确认终端位于项目根目录、源码已完整解压，不要双击单个 HTML 文件。
- 黑屏或 WebGL 错误：尝试另一浏览器，检查硬件加速和显卡驱动。保留 F12 控制台错误，先不要修改安全策略。
- 个别游戏没反应：记录游戏 ID、具体操作和截图；不能以“网页打开了”判定全部游戏通过。
- .command 或 .dmg 无法运行：这些是 Mac 专用入口，本教程不使用它们。

## 反馈模板

```text
项目版本：
Windows 版本 / CPU / 显卡：
浏览器和版本：
游戏 ID / 地址：
操作步骤：
是否卡顿、黑屏、坐标偏移或声音未停止：
停止任务后的表现：
控制台错误（删除私人路径和任何密钥）：
```

下一阶段才是 Windows 自动任务接入、仅在 Codex 前台显示的原生小窗、自带运行库的安装包。网页实验通过不能替代这些验证。
