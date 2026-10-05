# 破烂拳王：Godot 独立试玩

这是一次引擎与美术制作方式的小规模验证，不是把现有游戏迁移到 Godot。
原来的 48 个目录游戏、20 个随机游戏池、《磁力暴走》、已安装的 Codex 与 DMG 均未改动。
本作目前不在目录或随机池中，也没有连接真实 Codex 任务；页面的开始/结束按钮模拟任务生命周期。

## 直接玩

已有构建产物，不需要玩家安装 Godot，也不需要下载额外素材。

```bash
PORT=4180 node apps/press-lab/server.js
# http://127.0.0.1:4180/apps/codex-stage/godot-junk/index.html
```

如果端口已被使用，请换一个端口。必须使用 HTTP 服务，不能通过 file:// 打开。

- 在擂台内按住鼠标、触屏或空格：举起防御；松开：出拳。
- 对手出拳前的最后时刻防御，可以完美格挡；趁破绽松开，打出反击。
- 不能一直按住：防御值耗尽会破防。也不能靠快速乱点无限压制对手。
- 击倒后可挑战下一位；失败可点击重试。R 重试，Enter 进入下一位对手。
- 默认静音，扬声器按钮开启声音；支持减少动效和放大擂台。
- 手机也可操作，横屏更适合这个固定比例的横向擂台。

## 这一版的内容

三位对手依次是：锅炉重拳（慢前摇、重击）、涡轮连击（快速二连）、弹簧骗子（假动作与延迟出拳）。
同一套简单操作分别考验判断时机、连续防守和识别假动作。连击、血量、格挡、反击、破防、击倒都有真实规则。

画面不使用以前的程序化方块模型：独立绘制的位图擂台和透明角色图集，由 Godot 的躯干、双臂、双腿节点组合。
动作包括预备、举拳、出拳伸展、受击后仰和击倒；击中时有短暂停顿、克制震动和七种本地音效。
图集来源与授权说明见 [ARTWORK.md](../games/junk-champion/ARTWORK.md)。

这不是完整拳击模拟器。命中使用与动作位置对应的 Godot Rect2 接触检测，不是布娃娃或刚体拳击；当前不包含可破坏擂台、联机、成长商店或无限关卡。

## 生命周期与隐私

- `session.js` 提供 start、stop、pause、settings、destroy 和有限的游戏输入。
- 结束任务同步停止规则推进、输入、所有音频声部以及 Godot 渲染循环，画面停在最后一帧。
- 页面隐藏会暂停；失焦和触摸取消清除按住状态，不会误出拳。
- 未加载完时结束任务，会取消本次挂载；迟到的引擎不能让游戏复活。
- 进度只存于本机 localStorage 的 `agent-stage:junk-champion:v1`，恢复时清除进行中的攻击和按住状态。
- 已胜利的回合保持胜利；失败回合重新挑战；尚未结束的回合恢复血量后等待玩家输入。
- 游戏只接收生命周期与游戏手势，不接收 Agent 原文、工具输入输出、文件路径或权限。
- 同源 iframe 用于生命周期隔离，不是可运行任意社区代码的安全沙箱。

当前入口 `window.agentStagePilot` 用于本地验证，不代表已完成 Codex overlay 集成。接入随机池之前仍需补齐 Dock 加载、缓存预算、嵌入窗口和浏览器兼容性验收。

## 开发构建

源工程：`games/junk-champion/project.godot`。固定 Godot 4.5.2、GDScript、Web Compatibility、单线程导出。
开发工具仅放在被忽略的 `.tools/godot`，不替换系统安装的软件。

```bash
# macOS 开发者安装固定版本编辑器，校验完整下载的 SHA-256
npm run tools:godot

# 从官方大模板包中按 HTTP Range 提取单线程 Web 模板
python3 tools/fetch-godot-web-template.py

# 重建原创音效、导入素材、运行规则测试、导出 Web 和摘要清单
npm run build:junk-godot
```

编辑器安装器只安装编辑器，Web 模板需要执行上面的独立命令。
模板下载验证 HTTPS 来源和 ZIP 条目 CRC，不声称校验了未完整下载的 1.35 GB 总包；构建器另外校验固定的 Web 模板 SHA-256。
macOS 以外的编辑器安装暂未自动化；构建脚本支持通过 `GODOT_BIN` 指向自行安装的兼容引擎。

Godot [官方固定版本下载](https://godotengine.org/download/archive/4.5.2-stable/)及 [MIT 许可证](https://godotengine.org/license/)保留于工程。
导出目录同时带有 Godot 许可证和第三方声明。
原始代码、动作编排及原创声音合成遵循仓库 Apache-2.0；生成图像不主张独占版权，来源与复用说明单独列明。

## 包体和性能边界

本次未压缩导出合计约 39.95 MiB：引擎 WASM 约 36.29 MiB，游戏 PCK 约 3.37 MiB，其余为启动代码。
没有运行时外部网络依赖，但第一次打开需要从提供页面的服务下载构建文件；浏览器缓存策略会影响后续加载。
这不是适合直接复制 1000 份引擎的发布方式。后续只有在玩法、美术和嵌入成本通过试玩后，才考虑共享引擎缓存、按需游戏资源和压缩传输。
暂停会停止渲染与游戏循环，iframe 卸载才完整释放引擎。尚未对所有浏览器、低端硬件或长期驻留做性能保证。

## 验证

```bash
# 原生规则测试也会被构建命令自动运行
.tools/godot/Godot.app/Contents/MacOS/Godot --headless \
  --path games/junk-champion --script tests.gd

# 生命周期适配器测试包含在仓库 test:ts 中
node --test apps/codex-stage/godot-junk/*.test.mjs

# 需要本地 Chrome 和可导入的 Playwright；默认服务端口 4180
# 可设置 PLAYWRIGHT_MODULE、CHROME_PATH、STAGE_ORIGIN 覆盖环境
npm run test:junk-browser
```

规则测试覆盖三个对手、真实时机反击、乱点不能无限压制、持续防御破防、失败、停止、输入取消、回合清理、非法存档和安全恢复。
浏览器测试使用真实鼠标通关三个对手，不改写血量或胜利状态；另测键盘、手机触控取消、桌面/移动截图、画布变化、静音、减少动效、停止后状态/像素冻结、渲染关闭、零音频声部、离线继续、重载恢复、销毁和加载期间停止。
截图与机器可读结果生成在 `output/junk-qa/`；实际原生测试和浏览器测试都运行同一份 GDScript 规则。

2026-09-29 本机验证：29 项 Godot 规则检查、416 项 JavaScript/TypeScript 回归和 9 项 Python 回归全部通过；Chrome 真实鼠标完成三战，移动触控与生命周期检查通过，浏览器错误为 0。浏览器测试为本机 Chrome 与触屏模拟，不等同于已覆盖真机 Safari 或所有移动设备。
