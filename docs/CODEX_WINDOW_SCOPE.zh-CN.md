# Codex 窗口范围

## 行为

- 有活动任务且前台应用确认为 `com.openai.codex` 时，显示在其最前可见普通窗口的右下角。
- 切走、最小化、窗口关闭或无法读取位置时隐藏并暂停模拟、输入、声音。重新进入 Codex 继续当前游戏。
- 任务在后台完成或中断后，返回 Codex 不再出现；后续新任务仍可出现。
- Esc 是用户主动关闭本轮，与切换应用造成的临时隐藏分开处理。
- 多显示器采用 Codex 窗口与屏幕可见区域的交集定位，不跟随鼠标，不显示在其他应用上。

仍然是独立的本机 WebKit 窗口，不修改 Codex 安装包或内部 UI。不同 macOS 全屏 / Stage Manager 布局需要实际使用复核。

## 实现与隐私

`native-game-window.js` 用 NSWorkspace 前台应用通知及短间隔坐标检查约束显示，公共 CG 窗口列表只按 PID 筛出几何信息，不读取标题、辅助功能内容或像素。显示条件不成立时不采用桌面角落兜底。

系统窗口列表由独立的 `--observe` 进程每 200ms 查询，游戏窗口的输入线程只读取小型坐标快照，不再同步调用 WindowServer。主窗口仍独立检查前台应用，缓存不能放宽这个条件；PID 不匹配、坐标无效或快照超过 750ms 时隐藏。观察进程由同一个启动器管理并清理，不需要安装额外软件。

`agent-stage-host-visibility` 只更改宿主暂停状态；不调用 turn started/completed，不断开事件流，不控制 Agent。暂停状态跨任务保留，避免用户在其他应用时新任务的游戏开始渲染。已有一次性用户隐藏和任务完成逻辑保留。

Apple 参考：[前台应用](https://developer.apple.com/documentation/appkit/nsworkspace/frontmostapplication)、[窗口信息](https://developer.apple.com/documentation/coregraphics/cgwindowlistcopywindowinfo(_:_:))、[跨应用窗口资格](https://developer.apple.com/documentation/appkit/nswindow/collectionbehavior-swift.struct/canjoinallapplications)。后者只解决全屏空间的显示资格，实际是否显示仍必须经过前台和窗口位置检查。

## 验证

- 单元测试覆盖其他前台应用、最小化、未知坐标、普通窗口筛选、坐标转换、负坐标显示器、移动/缩放和隐藏与关闭的区别。
- 浏览器测试覆盖 Canvas 与独立 Three 页面：隐藏后像素冻结、输入无效、声音停止；恢复同一实例；后台完成不会恢复。
- 原生测试运行真实 NSPanel/WKWebView，用合成的前台/坐标夹具验证隐藏、恢复、移动、最小化及后台结束；同时用公共窗口 API 读取测试窗口自身的几何信息验证 JXA 桥接，不读取 Codex 界面内容。

```sh
node --test packages/codex-stage/test/native-window.test.js apps/codex-stage/host-visibility.test.js apps/codex-stage/packs.test.js
node tools/test-host-focus-browser.mjs
NATIVE_QA_GAME=toast-hop NATIVE_QA_LABEL=focus node tools/test-native-companion.mjs
```

报告在 `output/host-focus-qa/` 与 `output/native-*-focus.json`，不进入发行包。模拟测试不是用户实际切换应用、全屏和多显示器的验收替代品。

## 操作性能

不能用待机画面的平均 FPS 代替实际操作测试。拉链测试包含浏览器真实鼠标拖动，以及独立原生测试窗口内的 AppKit 拖动事件；原生测试必须确认输入到达页面且拉链实际前进。原生事件仅发送到测试自身的 WKWebView，不移动系统鼠标，不操作 Codex。

```sh
node tools/test-zipper-performance.mjs
NATIVE_QA_GAME=zipper-run NATIVE_QA_PROFILE=1 NATIVE_QA_POLL=1 NATIVE_QA_INPUT=1 NATIVE_QA_HOLD_MS=18000 NATIVE_QA_LABEL=verified node tools/test-native-companion.mjs
```

2026-10-05 的原生对照中，同步窗口查询改为独立查询后，页面帧间隔 P99 从 22ms 降至 18-19ms，最大间隔从 24ms 降至 19-21ms；平均均约 60 FPS。最终测试确认拉链随原生输入前进 282/410，未出现超过 25ms 的帧间隔。这是特定本机测试的抖动改善，不证明所有游戏或所有桌面状态的卡顿已解决。

已安装小窗的 `~/Library/Application Support/AgentStage/window.json.status` 中包含 `frameStats`：最近最多 300 个页面帧间隔的 FPS、P95/P99、最大间隔、超过 25ms 的数量，以及游戏 ID 和采样时间。它测的是页面调度，不是屏幕硬件最终呈现时间；停止/隐藏时暂停采样。仅保留一份本地状态，不记录命令、任务、输入坐标、截图或上传数据。

AppKit 输入测试参考：[Apple NSEvent](https://developer.apple.com/documentation/appkit/nsevent)、[WebKit 自身的 EventSenderProxy](https://github.com/WebKit/WebKit/blob/main/Tools/WebKitTestRunner/mac/EventSenderProxy.mm)。测试不依赖其中的私有接口或运行时方法替换。
