# 极限六式 / Limit Break

版本 0.11.0，集合 `extreme-six`。在保留的 94 款基础上增加 6 款，当前按唯一 ID 计数为 **95 款统一包 + 5 款独立试玩 = 100 款**。不重复计算关卡，不恢复已删除的旧 26 款。数量不等于全库已完成正式发布验收。

本地入口：`/codex-stage?collection=extreme-six&game=razor-wings`。

## 参考研究

检索于 2026-10-03。以下是机制参考，不是声称存在客观的“世界最难六款”排名；没有拷贝角色、关卡、声音、画面或商业代码。

| 原作及一手来源 | 借鉴的设计原则 | 本项目的独立实现 |
| --- | --- | --- |
| [Geometry Dash](https://store.steampowered.com/app/322170/Geometry_Dash/) | 少量输入、连续穿障与快重试 | 刃隙飞行：原创折线晶体走廊、按住上升/松手俯冲 |
| [Super Meat Boy](https://store.steampowered.com/app/40800/Super_Meat_Boy/) | 精密平台、墙面跳跃与反复练习 | 绝壁反蹬：单键蓄力决定抛物线落点，左右狭小抓沿交替 |
| [Duet](https://store.steampowered.com/app/292600/Duet/) | 相连双体、旋转同时避障 | 双核穿刃：鼠标横移控制角度，双孔/单缝切片，后核通过前不能转向 |
| [Celeste](https://store.steampowered.com/app/504230/Celeste/) | 精密冲刺、短暂机会与快速重试 | 断空连闪：鼠标任意方向瞄准，移动棱晶补能，窄闸和飞行提前量 |
| [osu! Slider 文档](https://osu.ppy.sh/wiki/en/Gameplay/Hit_object/Slider) | 位置瞄准、时机、按住跟随轨迹结合 | 准星过载：原创拍点及曲线路径，一次失误清空本关 |
| [Downwell](https://store.steampowered.com/app/360740/Downwell/) | 开火与移动相互影响 | 后坐力飞行：改为零重力反向推进，有限弹药，低速进港才算成功 |

另参考 [Flywrench](https://store.steampowered.com/app/337350/Flywrench/) 的紧凑操作与快速重置。这里不复刻其三色动作规则。所有方案均有重新设计的控制、目标及资产。

## 六款操作与难度

| 游戏 | 操作 | 三关递进 |
| --- | --- | --- |
| 刃隙飞行 | 按住右上、松开右下；没有停止键 | 10/14/18 个折角；通道 64/50/38 px；角色判定半径 6 px |
| 绝壁反蹬 | 贴壁按住蓄力、松手反蹬 | 6/8/10 次抓沿；沿高 56/42/28 px；角色半径 8 px；1.45 秒内必须出手 |
| 双核穿刃 | 横移鼠标转动双核，触屏按住拖动 | 12/16/20 道切片；缝宽 40/32/26 px；两颗半径 8 px 核心都不能碰 |
| 断空连闪 | 鼠标瞄准，单击冲刺；飞出后不能改向 | 6/8/10 次连闪；闸缝 46/36/29 px；移动目标越来越小；1.6 秒停留上限 |
| 准星过载 | 看收缩圈点按；滑轨按住跟随，到头再松 | 12/16/20 段；点按窗口 ±95/75/55 ms；拖拽容差 25/20/16 px |
| 后坐力飞行 | 向鼠标开火，船反向飞；向前开火刹车 | 4/5/6 次停靠；每段 8/7/6 发；港口半径 28/22/18 px；进港速度限制 52/42/32 px/s |

最高关要求精细手眼协调，鼠标优先；触控保留同样规则，没有暗中放宽判定。计时和几何判定使用固定逻辑坐标与 120 Hz 规则步进。减少动效只去掉装饰拖尾和闪光，不删掉玩法所需的运动；静音不影响必要信号。

每次失败只重开当前关，已通过关卡保留。任务完成立即停止模拟、输入、绘制和声音。新任务恢复到安全准备态，不自动把用户放回半空中。默认随机池仍为原七款；新六款为手动试玩，等待玩家验收。

## 资产与实现

- 六套独立 Canvas 画面、原创 SVG/PNG 背景和本地合成音色。素材许可 Apache-2.0，`assets/provenance.json` 含大小、来源、SHA-256。
- 绝壁反蹬与后坐力飞行使用既有本地 Matter.js（MIT）；其余是确定性几何/时序规则。
- 每包只包含自身世界、绘制函数和所需引擎；不下载远程字体、图片、音频，也不读取 Agent 内容。
- 回放仅通过公开 `down/move/up/step` 输入，不直接写坐标、跳过关卡或修改胜利状态。

## 验证与分发边界

```sh
node tools/build-extreme-art.mjs
node tools/build-game-packs.mjs
node tools/build-playable-inventory.mjs
node --test apps/codex-stage/extreme-six/*.test.mjs
node tools/test-extreme-six-browser.mjs
node tools/test-extreme-dock.mjs
```

浏览器/规则验证结果在 `output/extreme-six-qa/`。规则可解不等于玩家已接受趣味性或难度。模拟 Dock 验证也不等于当前安装的 Codex 已更新。

2026-10-03 验证：751 项 JS/TS 测试与 9 项 Python 测试通过；六款共 18 关通过浏览器鼠标回放，六款均通过窄屏触摸、触摸取消、离线重启、中途停止恢复、停画和停声检查（`report.json`）。合集初始化顺序问题修复后，入口页面重新通过六款切换、结束任务、桌面/窄屏布局、零页面错误与仅本地请求检查（`report-library.json`）。模拟 Dock 的六款启停、键盘路由和卸载清理通过（`dock-report.json`）。

本次改动只更新源码及本地试玩，不重装 `~/.codex/agent-stage`、不重启 Codex、不创建 GitHub Release 或新 DMG。正式发布前仍需筛选现有作品、决定五款独立试玩的归属，并完成真机安装/升级/卸载验收。
