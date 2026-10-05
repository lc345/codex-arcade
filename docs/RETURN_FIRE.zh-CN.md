# 借弹还弹 / Return Fire

原创像素机械街机 Boss 战。玩家没有常规弹药，接住敌人的金色子弹，再松手集中反击。主动闪避和取舍蓄力时机是主要挑战，不是自动射击换皮。

## 试玩

已有本仓库服务时打开 `/apps/codex-stage/return-fire/index.html`。否则：

```bash
PORT=4180 node apps/press-lab/server.js
# http://127.0.0.1:4180/apps/codex-stage/return-fire/index.html
```

独立入口仍是本地任务生命周期模拟器。2026-10-01 已增加 reviewed pack：可在 `/codex-stage?game=return-fire` 和 8 款精选轮换中运行，源码 lazy Dock 支持同一包。未更新已安装运行时、Codex 主题或发行 DMG，真实 Codex 任务验收仍是单独步骤。

- 点击“迎战”。鼠标移动闪避，按住左键吸收金色弹幕，松开自动反击当前目标部件。
- 键盘聚焦画面后，方向键或 WASD 移动，空格按住吸收、松开发射。
- 触屏按住并拖动画面移动和吸收，松手反击；触摸取消不误发射。下方吸收盾按钮也可用。
- 集齐五发以上，单发反击伤害提高。最多十发；蓄力和吸收都会增加热量，过载会损失蓄弹、伤害装甲并暂时禁用盾。
- 红色斜纹区域是不可吸收的攻击，提前一秒预警。不能靠一直开盾过关。
- 第一阶段拆肩炮；第二阶段增加扇形弹幕和双激光道；第三阶段裸露核心发出双源弹幕，并实际沿预警通道冲撞。
- 部件击破会清掉旧弹幕并恢复一格装甲。失败后可立刻重试本阶段，不强迫重打一整轮。
- 默认静音，点击声音图标启用吸收、反击、警示、过载、击破音效。支持减少动效和放大。

## 生命周期与存档

“结束任务”同步停止输入、模拟更新、动画帧和声音。暂停或浏览器失焦清除按住状态，不产生一次意外反击。
加载期间停止会取消请求并丢弃迟到资源，不会重新启动游戏。

检查点键 `agent-stage:return-fire:v1` 只存 `{version:1,stage:0..2}`，不存任务内容、弹幕、按键或任意对象。
任务重新开始、刷新页面后，从当前阶段的等待状态恢复，需要再次点击迎战。已打掉的部件保留；未完成阶段重新开始，不是逐帧原地续玩。
打通后的检查点仍是第三阶段，可再次挑战；“再战一轮”从第一阶段开始。

本地测试接口 `window.returnFirePilot` 只有 start、stop、pause、destroy、snapshot、state，不提供直接改血量或强制通关的入口。
集成版的存档键为 `agent-stage:checkpoint:v1:return-fire`，与独立页分开。reviewed pack 封装和模拟 Dock 内加载已验证；这不代表已在用户当前 Codex 进程完成真实任务验收。详见 [精选轮换](CURATED_ROTATION.zh-CN.md)。

## 实现与素材

- `world.js`：120 Hz 确定性规则，使用已有本地 Matter.js 的碰撞检测；有界时间步、弹幕、追踪反击、过热、预警、部件状态及检查点校验。
- `painter.js`：Canvas 2D、高 DPI、独立机体/炮臂精灵、原画背景、反击尾迹、碎片、危险区与核心冲撞。不是预录短片。
- `sound.js`：本地 Web Audio 合成，最多 14 个声部；停止/静音/销毁同步释放声部。
- `app.js`：鼠标、触控、键盘、焦点和任务模拟器边界。无外部服务、CDN、遥测或 Agent 内容读取。

两张原创生成式 PNG 合计 5,363,869 字节，约 5.12 MiB；只在打开此试玩时加载，不增加旧 Dock 启动包。
素材通过内置 image_gen 生成，提示词、来源和许可证在 [ARTWORK.md](../apps/codex-stage/return-fire/assets/ARTWORK.md)，校验摘要在同目录 `provenance.json`。
游戏素材采用 Apache-2.0；盾牌图标来自 Lucide，单独保留 ISC 许可证。AI 生成素材不作著作权独占性保证。
沿用了项目的 Microgame Director 方法、测试驱动流程和 imagegen 技能，没有安装新引擎或插件。

## 验证

2026-10-01：新增 15 项规则、音效及素材测试，全量 452 项 JavaScript/TypeScript、9 项 Python 测试通过。

```bash
npm run test:return-fire
npm run test:return-fire-browser
npm run build:return-fire-manifest
```

浏览器测试可指定 `PLAYWRIGHT_MODULE`、`CHROME_PATH`、`STAGE_ORIGIN`。
真实 Chrome/Playwright 鼠标输入打通三个阶段，约 27 秒、吸收 60 发、反击 16 次；未修改游戏状态。这是自动操作验证，不是人工趣味性评审。
另验证持续贪吸失败、失败重试、阶段存档、键盘移动/松键、真实触控事件拖动/取消、暂停、静音、减少动效、离线继续、停止后像素冻结与延迟加载取消。
报告与桌面/手机截图：`output/return-fire-qa/`。浏览器错误为零；移动测试是 Chrome 触屏模拟，不等于所有手机或 Safari 通过。

美术和反馈的主观吸引力仍需要玩家反馈；当前先验证这一个完整 Boss，不宣称已经完成大型内容库或正式发布。
