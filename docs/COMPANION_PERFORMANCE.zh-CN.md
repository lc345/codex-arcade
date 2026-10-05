# 小窗切换与性能验证

## 使用行为

- 鼠标移到小窗右上角显示换游戏图标。更换后仍属于原任务，不向 Agent 发送任何输入。
- 随机模式每款至少 3 分钟；仅在 ready / won / lost / cleared / error、无按住输入且静止 5 秒时自动切换。未知状态不推测为结算。
- 重复开始事件和工具事件不会切回旧游戏；任务结束会立即停止当前游戏，并使正在加载的旧结果失效。
- 更换前保存支持检查点的游戏，销毁旧实例和声音。单个宿主仍最多缓存两个工厂、只运行一个游戏。

## 本次优化

### 安装版低帧率根因（2026-10-05）

原启动器把包含可见 WKWebView 的 LaunchAgent 标记为 `ProcessType=Background`。它受到后台任务调度限制；浏览器和直接由测试进程启动的窗口没有走这条启动路径。因此之前直接启动测试得到 60 FPS，不能代表实际安装版。

使用相同拉链游戏、400px 窗口、800 x 533 绘图缓冲、AppKit 连续拖动，仅变更生成的 LaunchAgent 调度类型，得到以下结果：

| 指标 | Background | Interactive |
| --- | --- | --- |
| RAF 平均帧率 | 5.52 FPS | 60.00 FPS |
| P95 / P99 帧间隔 | 215 / 218ms | 18 / 19ms |
| 最大帧间隔 | 219ms | 22ms |
| 绘制回调 P95 | 2ms | 2ms |
| 原生拖动事件 P95 间隔 | 120ms | 19ms |

修复使用 `ProcessType=Interactive`，不修改游戏速度、难度、分辨率或全局 App Nap 设置。切出 Codex 后仍隐藏并暂停游戏。Apple 对此策略的说明见 [launchd.plist](https://github.com/apple-oss-distributions/launchd/blob/main/man/launchd.plist.5)：交互任务使用应用级资源策略，后台任务受到限制。

新增测试必须通过实际 launchd 调度启动测试窗口，并检查 50+ FPS、P95 帧间隔及输入事件间隔低于 35ms。报告分别在 `output/native-zipper-run-launchd-before.json` 和 `output/native-zipper-run-launchd-after.json`。夹具仅模拟任务和前台窗口信息，绘制与 AppKit 输入由真实 WKWebView 执行。普通直接启动测试仍有用途，但不能单独作为性能验收。

更新本机安装后，通过真实安装服务发送独立测试任务，采集右下角小窗约 30 秒的 10 个可见状态样本，随机选中的 `ice-stone` 为 60.0-60.1 FPS，P95 18ms，P99 20-22ms，最大间隔 24ms，采样窗口内无超过 25ms 的间隔。没有使用窗口位置夹具或注入 profiler。开始事件由测试发送，非用户手动输入；这验证实际安装路径，不声称已实玩全部 100 款。

### 前期渲染开销优化

- Studio 不再把移动坐标和整个世界快照序列化成 UI 更新信号；只有实际状态、得分、字幕和控制项变化才通知界面。
- 宿主去重控件更新和字幕写入，避免每帧重写隐藏的页面控件。
- 四款 Canvas / Three 本地页面适配器保留 960px 逻辑布局和输入坐标，绘图缓冲区按照实际小窗缩放比例计算。Godot 的引擎视口未在本次改动。
- 购物车的 DOM HUD 按显示值变化刷新；物理模拟和画面仍按原节奏运行，不降低难度、游戏速度或素材分辨率。

## 原生采样

macOS WebKit，400px 小窗，15 秒采样；采样时关闭截图，避免截图读回干扰。购物车对照：

| 指标 | 修改前 | 修改后 |
| --- | --- | --- |
| 画布缓冲 | 1680 x 945 | 700 x 394 |
| DOM 变更数 | 6216 | 1013 |
| RAF 平均帧率 | 60.00 | 60.01 |
| p95 帧间隔 | 18ms | 18ms |
| 大于 25ms 的间隔 | 0 | 0 |

吐司别掉、磁力暴走、刃隙飞行的优化前原生采样也约 60 FPS。这些短时采样没有复现用户反馈的普遍卡顿；不能宣称 100 款游戏在真实长任务、所有设备负载下均已流畅。减少了明确的浪费，但仍需真实长任务复测。

## 复测方法

```sh
node --test apps/codex-stage/packs.test.js apps/codex-stage/rotation.test.js apps/codex-stage/render-budget.test.js
node tools/test-game-shuffle-browser.mjs
node tools/test-live-window-browser.mjs
node tools/test-full-pool-browser.mjs
NATIVE_QA_GAME=cart-downhill NATIVE_QA_PROFILE=1 NATIVE_QA_HOLD_MS=15000 NATIVE_QA_LABEL=after node tools/test-native-companion.mjs
NATIVE_QA_GAME=zipper-run NATIVE_QA_PROFILE=1 NATIVE_QA_POLL=1 NATIVE_QA_INPUT=1 NATIVE_QA_LAUNCHD=1 NATIVE_QA_HOLD_MS=18000 NATIVE_QA_LABEL=launchd-after node tools/test-native-companion.mjs
# 安装后保持 Codex 前台，独立测试任务通过真实服务触发小窗；只结束自身测试任务。
node tools/test-installed-companion-performance.mjs
```

浏览器脚本需要本地开发测试用 Playwright/Chrome 和源码服务（默认 4180，可设 STAGE_ORIGIN）；普通安装使用不需要这些软件。原生脚本自行创建隔离服务并清理，不控制 Codex 界面。报告写入 output，不进入发布包。profile 只在显式 --qa --profile 参数下加载，不在用户正常运行时采集。

安装版采样脚本只读取本机已有的帧间隔诊断，不注入 profiler。至少采集 10 个新鲜、可见状态样本；隐藏、暂停或过期数据不能算通过。报告是 `output/installed-launchd-performance.json`，不包含 token、任务内容或输入坐标。RAF 数据反映页面调度，并非显示器最终呈现时间；不能替代用户实玩验收。
