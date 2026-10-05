# 不服再来

0.10.0 增加十款高难短局，保留原 84 款。当前是 **89 款统一库 + 5 款独立试玩 = 94 款不同作品**，距离净 100 款还差 6 款。不重复计算关卡，不恢复已退役的旧 26 款，不把未获玩家认可的新作放入默认随机池。

试玩入口：`/codex-stage?collection=hardcore-ten&game=ratchet-vault`。

## 实际研究过的参考

检索日期：2026-10-03。参考的是机制和难度组织，不复制代码、角色、画面、音乐或关卡，也不声称已移植完整商业游戏。

- [Jump King 官方 Steam 页面](https://store.steampowered.com/app/1061090/Jump_King/)：蓄力后出手、空中不能反悔、失误后坠落。这启发了棘轮登塔的切线承诺与整关接力，操作并非照搬跳跃。
- [Super Hexagon 官方站](https://superhexagon.com/)：极简动作的集中压力。六角封锁使用原创墙序、单键反转与明确的入场缺口；不采用强闪屏或整屏旋转。
- [Downwell 官方 Steam 页面](https://store.steampowered.com/app/360740/Downwell/)：下降动作和射击减速结合。倒悬矿井转为有限喷气刹降，只有鼠标横移和单击，不复刻武器或敌人。
- [One Finger Death Punch 官方 Steam 页面](https://store.steampowered.com/app/264200/One_Finger_Death_Punch/)：少量输入也能获得明确的击打反馈。刹那居合采用原创佯攻提示和短判定窗。
- [Disc Room 官方 Steam 页面](https://store.steampowered.com/app/1229580/Disc_Room/)：小空间内的刀盘压力。刀盘密室改为顺序取钥，不允许待在角落等时间通关。
- [Bennett Foddy: Eleven Flavors of Frustration](https://www.foddy.net/blog/2017/01/eleven-flavors-of-frustration/)：挫败感可以有不同来源。这里分别落实为失手、过度修正、不能撤销、分神和记忆负担，不把随机不可解当难度。

## 十款规则

| 游戏 | 主要操作 | 难度递进 |
| --- | --- | --- |
| 棘轮登塔 | 单击沿转轮切线脱钩 | 连续 6 / 8 / 10 次抓环；捕获半径 25 / 20 / 16 px；飞出后不可修正 |
| 六角封锁 | 按住逆转、松手正转 | 14 / 18 / 22 道墙；间隔 1.35 / 1.18 / 1.04 秒；缺口逐关缩小 |
| 倒悬矿井 | 横移鼠标、单击刹降 | 6 / 8 / 10 道闸；开口 102 / 86 / 70 px；每道闸只有三次喷气 |
| 磁针手术 | 鼠标磁铁间接吸引钢珠 | 管腔 84 / 68 / 56 px；有惯性和阻尼，碰壁整关重来 |
| 刹那居合 | 红印出现时单击 | 8 / 10 / 12 刀；窗口 210 / 170 / 135 ms；蓝印是可辨认的佯攻 |
| 转杆快递 | 鼠标移动自转长杆 | 窄道 76 / 64 / 52 px；转角有等待区，杆尖也参与碰撞 |
| 烧桥骑士 | 点击日字落点 | 12 / 18 / 24 个格子；经过的格子塌掉，出口必须最后到达 |
| 反转熔炉 | 点击联动开关熄灯 | 十字、对角、混合线路；至少需要 6 / 7 / 8 次翻转，只有一步额外余量 |
| 刀盘密室 | 鼠标移动躲避并取钥 | 3 / 5 / 7 枚刀盘；6 / 7 / 8 把顺序钥匙；一次接触失败 |
| 回声倒带 | 看完后反向点击九宫格 | 6 / 8 / 10 拍；展示逐关加快；回答错误清空本轮 |

判定使用逻辑坐标，不因 Retina 或窄窗口改变。动态关卡会给出可见轨迹、缺口、节奏或警示。减少动效关闭装饰性旋转/拖尾，但不去掉判定所需运动。静音不隐藏任何必要信号。

每次失败重新开始当前关，已过关卡保留；任务完成时立即停输入、物理、绘制和声音。下个任务恢复到安全准备态，不在用户尚未准备好时继续危险动作。

## 工程与许可

- 五款物理/刚体作品使用本地 Matter.js：棘轮、矿井、磁针、转杆、刀盘。其余是确定性的自定义规则，不另造物理引擎。
- 十幅原创 SVG 场景由 Chromium 栅格化为 PNG；每款独立画面和音色。`assets/provenance.json` 记录源文件、图片、许可、大小和 SHA-256。
- 源码、美术和合成音效采用 Apache-2.0；Matter.js 保留 MIT 声明。没有外部音频、远程图片或品牌角色。
- 单包只装入所选世界和绘制函数；有需要才包含物理库，不把十款一起载入。
- 游戏不接收 prompt、工具参数、工具输出或路径，也不能影响 Agent 执行。

## 验证命令

```bash
node tools/build-hardcore-art.mjs
node tools/build-game-packs.mjs
node tools/build-playable-inventory.mjs
node --test apps/codex-stage/hardcore-ten/*.test.mjs
node tools/test-hardcore-ten-browser.mjs
node tools/test-hardcore-dock.mjs
```

规则回放只通过公开的鼠标/按住/松开接口，不直接写入胜利或修改玩家坐标；它证明关卡可解，并不等于普通玩家首次就能通关。浏览器回放另行验证鼠标三关、窄屏触摸、取消、音效停止、Canvas 冻结、离线重启和辅助文本。模拟 Dock 检查键盘、生命周期和隔离清理。

报告保存在 `output/hardcore-ten-qa/`。这些验证不等于用户当前 Codex 进程已经更新；本批没有重装 companion、重启 Codex、创建 GitHub Release 或覆盖旧 DMG。

### 本次验证结果

2026-10-03：727 项 JavaScript/TypeScript 测试与 9 项 Python 测试通过。十款游戏共 30 关通过 Playwright 鼠标回放；十款均通过窄屏触摸与取消、任务结束冻结画布及停声、离线重启和中途停止恢复检查。合集检查确认只显示本批十款、没有页面报错、没有远程资源请求或横向溢出。十款也通过模拟 Codex Dock 的输入路由、任务启停和卸载清理检查。

可核对 `output/hardcore-ten-qa/report.json`、`dock-report.json`、`full-tests.log` 与桌面/移动端截图。自动回放证明规则可达成和生命周期兼容，不代替玩家对难度、操作手感与趣味性的验收；本批暂列库内试玩，默认随机池仍为原来的七款。
