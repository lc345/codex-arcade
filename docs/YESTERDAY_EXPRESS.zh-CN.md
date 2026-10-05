# 昨天的快递员 / Yesterday Express

三关时间分身合作解谜，入口 `/codex-stage?game=yesterday-express`。独立的横向剪纸邮局，不依赖此前的射击、弹射或塔防规则。当前作为手选 `preview`，不进入二十款正式游戏的随机池。

## 怎么玩

- 点站台选择目的地，快递员会沿真实通路走过去，沿途自动取件，到红色信箱投递。
- 点击“留下分身”会倒带。昨天的你重放点过的目的地，今天的你可以走另一条路。分身走完后留在终点，因此可以一直踩住机关。
- 录的是带时间的目的地指令，不是坐标录像。开头的思考时间自动剪掉，后续指令之间的间隔保留。分身也会被关闭的桥、升降机或窄梯挡住，不能穿墙。
- “撤回分身”删除最新一份路线并重新开始这轮；重试按钮清空当前关卡的全部路线。
- 方向键选择目的地，空格出发，Enter 留下分身或进入下一关，B 撤回，R 重开。键盘候选目的地会进入屏幕阅读器状态文本。
- 无倒计时惩罚。任务完成时立即冻结并本地存档，下次选中本游戏继续。静音默认开启；支持触屏、放大和减少动效。

## 三个递进谜题

| 章节 | 新规则 | 一种解法 |
| --- | --- | --- |
| 借昨天一双手 | 一份分身和压力桥 | 点 A，留下分身，再点信箱。也可以先录走向信箱的路线，自己替昨天守桥。 |
| 两份昨天，一份今天 | 桥与升降机各需要一人 | 分别留下去 A、去楼上 B 的分身，今天从桥和升降机穿过，取件投递。 |
| 把今天交到手上 | 包裹不能过窄梯，必须上下接力 | 一份分身守 A；另一份走楼上滑道，路过取件处；今天踩楼下 B 接通滑道，再从接件处走到信箱。 |

全部动作是游戏内虚构投递，不会发送真实邮件，不会读取 Agent 的任务内容。只有包裹实际抵达信箱才算送达；不按等待时长发放通关。

## 工程与边界

- `apps/codex-stage/studio/yesterday-express.js`：独立 120 Hz 确定性图路线规则。不是自由刚体物理，不为这个小型机关图引入新引擎。
- `yesterday-painter.js`：高 DPI Canvas 2D。原创建模式剪纸角色、机械桥、升降机、滑道和磁带界面；没有背景图时仍可玩。
- `yesterday-sound.js`：原生 Web Audio 合成脚步、机关、倒带和投递提示。无第三方音频或联网播放。
- `yesterday-catalog.js`：目录信息与独立离线包配置。沿用现有 reviewed pack 和宿主生命周期；无额外权限或依赖。
- 本地存档键 `agent-stage:checkpoint:v1:yesterday-express`。包括章节、指令、角色在边上的位置、包裹归属/滑落进度、倒带进度和计时余量。最多两份分身，每条路线最多 32 个目的地；存档限制 8 KiB。
- 恢复只复制白名单字段，检查有限数值、节点范围、合法边、指令顺序、单一包裹归属。非法存档回到第一关，不导入外部文本。无账户、远程排行榜或 Agent 数据。
- 仍是三关可玩小样，不是无限关卡或完整商业游戏。真实趣味性、后续谜题难度及不同玩家的理解成本还需试玩反馈。

## 复现验证

```bash
node --test apps/codex-stage/yesterday.test.js
node tools/build-studio-assets.mjs
node tools/build-game-packs.mjs
GAME_ID=yesterday-express STAGE_ORIGIN=http://127.0.0.1:4175 node tools/build-studio-previews.mjs
npm run test:yesterday-browser
```

浏览器脚本使用项目既有 Playwright / Chrome，可用 `PLAYWRIGHT_MODULE`、`CHROME_PATH`、`STAGE_ORIGIN` 指定本机路径。输出在 `output/yesterday-qa/`，覆盖三关真实点击、触屏、像素变化、静音/有声、暂停、停止冻结、背景素材损坏时的降级、存档与刷新恢复。

`tools/test-studio-browser.mjs` 另覆盖本游戏在模拟 Codex Dock 中的加载、任务停止及分身存档恢复。这不是对实际 Codex CDP 注入的重新安装验证。本次仅更新源码、离线包和本地试玩，不修改已安装运行目录、hooks、Codex 主题或旧 DMG。
