# 五款新作：短局、真碰撞、不同画风

入口：`/codex-stage?collection=arcade-five`。在本地已运行的服务中打开；首次从源码运行使用 `npm run serve:codex-stage`，以终端打印的端口为准。

这次新增五款游戏，每款三关，共十五个关卡，不把关卡算成独立游戏。

| 游戏 | 最小操作 | 核心挑战 | 视觉与声音 |
| --- | --- | --- | --- |
| 翻锅大师 `pan-flip` | 按住蓄力，松手翻锅 | 两面火候、翻转角度、小锅快火 | 水粉早餐厨房、煎制声和接锅声 |
| 一杆清台 `bank-shot` | 从白球向后拖拽后松手 | 四杆内清台、借桌边与斜桥反弹 | 红绒装饰艺术台球桌、玻璃宝石碰撞 |
| 纸上狂飙 `paper-racer` | 按住右转，松手左转 | 连续弯道、橡皮障碍、三次碰撞容错 | 彩铅作业本、铅笔赛车、低频马达 |
| 瓶盖入杯 `cap-cup` | 单击发射 | 摆动瞄准、移动杯子、抛物线时机 | 汽水丝网印刷海报、弹盖声和入杯声 |
| 折纸穿风 `paper-glider` | 按住爬升，松手下降 | 收集风环、侧风与呼吸山门 | 木刻山景、折纸飞机、风声与清亮音符 |

也支持触屏和空格。台球的键盘操作是方向键调整瞄准点，空格按住瞄准、松开发射。第一次开始和关卡结算的点击只操作菜单，不会顺带发射。音频默认静音，用户开启后才播放。

## 生命周期和边界

- 已接入源代码游戏库、独立 reviewed pack、浏览器宿主和源代码 lazy Codex Dock。
- 本批标为 `preview`，默认二十款随机池和八款精选池均未改变。逐款试玩后再决定入选，避免把不喜欢的原型自动塞回随机池。
- 任务结束同步停止输入、物理、画面调度和音频；素材加载尚未完成时结束，也不会事后复活。
- 恢复正在玩的关卡时，从该关开头的待开始状态恢复，不自动开始或继续按住。完成关卡恢复为静止的结算展示，重建标准通关分数，不保存精确的操作轨迹或排行榜成绩。
- 减少动效模式移除粒子、拖尾和装饰闪烁，保留游戏必要的物理运动。
- 游戏只读取自己的按键和物理状态，不读取模型提示词、工具输出、文件或路径。
- 这次修改没有重新安装用户的 Codex companion，没有创建新 DMG，也没有发布 GitHub Release。浏览器/Dock 夹具验收不能代替真实已安装客户端验收。

## 可复用结构

`apps/codex-stage/arcade-five/` 内，每款 `*.js` 的 world 仅负责规则和 Matter 碰撞；`painter.js` 中各款画面独立绘制；`kernel.js` 只共用三关生命周期；`runtime.js` 负责输入、失焦、音频和停止；`build.js` 只打包被选中的 world、绘图函数及一张背景。

物理使用现有本地 Matter.js，不新加玩家安装依赖。每款工厂包限制在 8 MiB 内，运行时不请求外部素材。

背景由内置 image_gen 分别原创生成，原图未改动；封面来自实际游戏画布。详见 [完整提示词和原始输出记录](../apps/codex-stage/arcade-five/assets/ARTWORK.md)、[资源摘要](../apps/codex-stage/arcade-five/assets/provenance.json)、[素材许可](../apps/codex-stage/arcade-five/assets/LICENSE)。音效来自本地 Web Audio 合成，无采样歌曲或商业游戏素材。

## 验收命令

```bash
npm run build:game-packs
npm run test:five-browser
npm run build:five-manifest
npm run test:five
npm run test:five-dock
npm run test:ts
npm run test:py
```

浏览器脚本默认服务端口 `4180`，可通过 `STAGE_ORIGIN` 改写。需要 Playwright 与 Chromium；本机 Chrome 可由 `CHROME_PATH` 指定，Playwright 模块可由 `PLAYWRIGHT_MODULE` 指定。图片封面改变后重新生成资源摘要。

浏览器验收使用真实 mouse/touch/keyboard 事件，不写入胜利状态：逐款通三关、触屏取消、无声/减少动效、离线恢复、任务结束静止、五款合集加载。Dock 测试使用本项目的模拟 Codex Shell，检查正式注入器和 lazy pack relay，保留侧栏、编辑区和模拟 Dream Skin。证据输出在 `output/arcade-five-qa/`；该目录不是发行资源。

## 本批验证记录

2026-10-02 本机运行结果：

- 新批次 39 项单元/资源/包测试通过；全项目 JS/TS 539 项、Python 9 项通过。
- 五款各三关全部通过真实浏览器鼠标操作；五款均通过触屏、触屏取消、减少动效、停止后画面冻结及音频清零、离线任务恢复。
- 五款均通过源代码 lazy Dock 夹具的键盘输入、`turn.started` / `turn.completed` 和清理检查；模拟侧栏、编辑区、Dream Skin 节点保留。
- 实际合集页面在桌面及 390px 手机宽度完成加载、切换、停止及无横向溢出检查；浏览器无页面错误，游戏请求仅访问本地来源或内嵌资源。
- 修复快速按放跨过结算帧时误触重新开始的问题；结算后有 350ms 防误触窗口。截图和报告见上述 QA 目录。

自动化通关只证明规则与操作链路可用，不代表已获得用户的趣味性认可，也不代表已在真实安装的 Codex 上回归。

下一阶段见 [一百款路线图](ROAD_TO_100.zh-CN.md)。
