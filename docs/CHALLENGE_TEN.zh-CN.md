# 十种挑战，十种手感

试玩：`/codex-stage?collection=challenge-ten`。十款新作，每款三关；每关从准备态开始，失败可立即重试。保留一到两种输入，把难度放在判断、记忆和时机上。

## 游戏与操作

| 游戏 / ID | 操作 | 挑战递进 | 美术方向 |
| --- | --- | --- | --- |
| 零点过街 `crosswalk-zero` | 点一下前进一格 | 三条车道到五条车道，货车更长、车速更快 | 纸模街区 |
| 断层钻头 `faultline-drill` | 点一下改变斜钻方向 | 六层缺口逐关变窄，下钻加速 | 套色版画矿井 |
| 激光借过 `laser-limbo` | 移动鼠标引导光点；触屏拖动 | 三道移动缺口由宽变窄，碰线重来 | 红白黑几何竞技场 |
| 熄灯之后 `blackout-bridge` | 先记住路线，熄灯后从下往上点击 | 四步到六步，记忆时间缩短 | 黑白炭笔蚀刻花园 |
| 一刀两半 `glass-divide` | 按住划穿玻璃，从外侧到另一外侧 | 真实面积分割，容差从 ±7 到 ±2 个百分点 | 彩绘玻璃 |
| 只准右转 `neon-coil` | 点一下排队右转，在下一格生效 | 四到六枚电池，更快、路线向内收紧 | CRT 绿磷街机 |
| 暂停键逃生 `freeze-frame` | 按住冻结锯片，松开恢复能量 | 冷量更少、角色跑得更快 | 有材质的定格工厂 |
| 偏心装货 `copper-balance` | 选择左边或右边投下下一件货 | 八到十二件，失衡阈值更严格 | 科学博物馆版画 |
| 路口别打结 `traffic-tangle` | 点一下切换绿灯，黄灯期间等待 | 十二到二十辆，来车更密、排队不能超过上限 | 桌面交通玩具 |
| 星环守卫 `shield-waltz` | 鼠标绕核心转盾；触屏拖动 | 八到十二次格挡，护盾变窄、光束更快 | 棱晶太空 |

键盘：聚焦画布后，空格对应主要动作；方向键在点选 / 鼠标引导游戏中移动指向。`R` 重试。切玻璃可用空格按住配合方向键划线，鼠标或触屏更直接。

记忆桥前三秒并非卡住：亮石头上的编号就是前进顺序。切玻璃没有一条固定正确线，任意方向只要真实面积接近一半即可；无效短划、未划穿两条边和触控取消不扣刀数。冻结机关不是暂停角色，锯片必须停在足够高的位置。

## 接入边界

- 已进入源码 catalog、独立合集、按需 reviewed pack 和源码 lazy Dock，可手动选择。
- 默认随机池仍是 20 款，精选池仍是 8 款；新增作品尚未经过用户保留 / 淘汰验收，不自动进入这两个池。
- 本批不修改 `~/.codex`、Codex.app、已安装 companion 或旧 DMG，不宣称真机安装已经更新。
- 任务完成时停止输入、模拟、绘制和声音。失焦、触控取消和暂停清除按住状态；恢复需再次开始。
- 只存本地的小型关卡检查点。未完成的关卡回到准备态，不保存危险中的半帧；完成状态保持静止，恢复不补播获胜音效。
- `output/challenge-ten-qa/dock-report.json` 是模拟 Codex Shell 的真实浏览器检查，不等同真实 Codex 安装验收。

## 实现与资产

入口：`apps/codex-stage/challenge-ten/`。`worlds.js` 管规则，`painter.js` 管十套动态画面，`catalog.js` 管元数据，`build.js` 每次只包含选中的 world、painter 和一张背景。复用已有生命周期内核和输入路由，不复制十套宿主。

过街、激光、玻璃、天平与路口使用本地 MIT 许可 Matter.js；其余为离散规则和运动判定，不附带无用的物理引擎。切割用 Matter 的真实多边形面积，天平按物体落稳计分，不按按钮次数计分。

四张原创生成背景保留提示词，其余六张为可编辑的原创 SVG 并本地光栅化。角色与危险物是 Canvas 动态绘制，音效本地合成，没有远程素材或商业游戏采样。资产许可证、尺寸和 SHA-256 见 `assets/provenance.json` 与 [ARTWORK.md](../apps/codex-stage/challenge-ten/assets/ARTWORK.md)。生成素材不是独占版权保证。

四个插画包限制 8 MiB，其余每包限制 800 KB。游戏数量增加时，lazy Dock 使用无损紧凑元数据并在启动时还原；不将背景、物理引擎塞进启动注入脚本，仍保持 50 KB 上限。社区 JavaScript 必须经过审查；Shadow DOM 不是安全沙箱。

## 验证命令

```bash
node tools/build-game-packs.mjs
node tools/test-challenge-ten-browser.mjs
node tools/test-challenge-dock.mjs
node tools/build-challenge-manifest.mjs
node --test apps/codex-stage/challenge-ten/*.test.mjs
npm test
```

浏览器测试需要 Playwright 和 Chrome，可指定 `PLAYWRIGHT_MODULE`、`CHROME_PATH`；`STAGE_ORIGIN` 默认 `http://127.0.0.1:4180`。`CHALLENGE_GAME=<id>` 单款补测会写独立报告，不覆盖完整合集的报告。

测试包括十款三关的公开输入回放、不操作 / 无脑连点失败、无效输入、触控取消、检查点、音频停止、不同帧间隔下的冻结机关，以及切割实际穿过边界。浏览器脚本用真实鼠标事件通关，不直接改游戏状态；同时检查移动端、减少动效、无远程请求和任务结束后的画面像素冻结。自动通关证明可完成，不替代用户对乐趣和难度的试玩判断。

2026-10-02 本地验证：699 项 JavaScript / TypeScript 测试、9 项 Python 测试全部通过；十款共 30 关完成真实浏览器鼠标回放，玻璃边界修正后另做单款三关补测。十款新作与上一批十款均通过模拟 Dock 的键盘、任务开始 / 结束、复用与清理检查。报告和桌面 / 手机截图位于 `output/challenge-ten-qa/`，不应随发布包携带个人测试输出。
