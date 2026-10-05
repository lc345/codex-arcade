# 假装是雕像 / Not a Thief

一款剪纸博物馆喜剧小游戏。按住往出口溜，松开摆出雕像姿势；保安回头时，身体和搬着的东西都需要停稳。只有一个主要输入，不需要背组合键。

## 试玩

- 独立画面：`/apps/codex-stage/statue-act/index.html`
- 游戏库集成版：`/codex-stage?game=statue-act`
- 本地服务：`PORT=4180 node apps/press-lab/server.js`

点击进入展厅，按住鼠标左键或空格前进，松开伪装。触屏按住画面操作相同。
巡逻时可以走；出现“即将回头”以及保安的“嗯？”时，提前松手。怀疑刚升起时还有挽救机会，迅速停稳可以消退，而不是立刻判输。

三件展品分别改变手感：

1. 小奖杯：轻、停得快，认识保安节奏。
2. 大花瓶：脚停了，花瓶还会摇。要预留站稳时间。
3. 半身像：惯性更大，增加第二位错开巡视节奏的保安。

抵达右侧实际出口才能过关；等待本身、反复点击都不会增加进度。失败可重试当前展品，完成三件后可再来一轮。
保安的疑问、角色僵硬的姿势和临时展牌负责喜剧反馈；脚步、摆姿势、警示和成功提示采用原创本地合成音效，默认静音。

## 生命周期

任务结束立即清除按住状态，冻结模拟、动画与声音。窗口失焦或触摸取消不会留下粘住的按键。
恢复只到当前关卡的安全起点，等待新的玩家输入，不是从保安面前自动续跑。

- 独立页：`agent-stage:statue-act:v1`
- 游戏库及 Dock：`agent-stage:checkpoint:v1:statue-act`
- 只保存 `{version:1,stage:0..2}`。不同入口的存档不互相迁移，也不接收任务内容。

素材异步加载结束后会检查任务是否仍有效；迟到资源被释放，不会复活已经结束的任务。加载失败可以使用重试恢复。

## 实现与素材

`world.js` 使用固定时间步的运动、惯性、摇晃和怀疑值规则，Matter.js SAT 检测巡视范围。搬运手感是可控的街机近似，不是完整刚体布偶或自由破坏模拟。
`painter.js` 使用 Canvas 2D，剪纸场景与角色图集、姿势切换、视线、汗滴、提示牌均随游戏状态绘制。不是视频。
`sound.js` 最多 10 个合成声部；静音、停止、销毁同步释放。

两张 PNG 共 5,372,762 字节，约 5.12 MiB，由本项目通过内置 image_gen 生成。完整提示词、摘要、尺寸和 Apache-2.0 许可位于 `apps/codex-stage/statue-act/assets/`。AI 生成素材不作著作权独占性保证。没有借用现成游戏人物或商业配乐。

独立页与 reviewed pack 共用 `packs/canvas-runtime.js`。包内嵌本地素材，仅选择该游戏时加载，保持原生宽高比。旧单体运行时不展示它；正式 lazy Dock 与浏览器包加载器支持它。

## 验证与边界

2026-10-01：全量 469 项 JavaScript/TypeScript、9 项 Python 测试通过。

```bash
npm run test:statue
npm run test:statue-browser
npm run test:curated-browser
npm run build:statue-manifest
npm run build:game-packs
```

浏览器脚本支持 `PLAYWRIGHT_MODULE`、`CHROME_PATH`、`STAGE_ORIGIN`。
Chrome/Playwright 使用真实鼠标输入跑通三关，分别约 9.5、9.9、15.5 秒，没有改写游戏状态；另测试故意不停被抓、重试、空格和焦点释放、真实触摸事件取消、减少动效、离线继续、停止后像素冻结、迟到素材释放。
截图与报告在 `output/statue-qa/`；集成包、精选轮换、模拟 Dock 的测试在 `output/curated-qa/`。
这是自动化交互验证，难度与趣味性仍需玩家评价，触屏模拟不等于所有真机和 Safari 兼容。

新游戏暂不进入精选轮换。已完成源码集成，不代表已更新用户的安装副本、通过真实 Codex 任务验收，或发布了新的 DMG。此次没有修改 Codex.app、主题、hooks 或已安装运行时。
