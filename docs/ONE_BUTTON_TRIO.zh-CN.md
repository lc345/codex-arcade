# 一根手指，三种较劲

这组作品延续《吐司别掉》的方向：规则简单、操作直接，难度来自时机，不来自记忆按键。新增三款手动试玩，稳定的二十款随机池不变。

## 直接试玩

启动：`npm run serve:codex-stage`，默认地址为 `http://127.0.0.1:4173`。本次开发预览使用 4175。

| 游戏 | 地址后缀 | 唯一操作 | 目标与代价 |
| --- | --- | --- | --- |
| 叠到天上 | `/codex-stage?game=sky-stack` | 点击画面让楼层落下 | 叠到十二层。偏掉的部分被削去，下一层继承变窄后的宽度；正中不削减。 |
| 别被夹扁 | `/codex-stage?game=press-run` | 按住前进，松手立即刹车 | 连过八道压机。观察警示灯和压头，停在机器前等待；压头碰到车就失败。 |
| 松手邮局 | `/codex-stage?game=swing-post` | 按住画面，在摆荡合适的位置松手 | 连送八封信。松手时保留摆荡惯性；后段邮筒会变窄、横移，飞出后不能修正。 |

合集：`/codex-stage?collection=one-button`。三款都支持空格或 Enter；R 重来。页面的单个主按钮为无长按设备保留点击/切换替代，不增加第二技能。

## 公平的难度

- 叠楼速度逐层增加，宽度损失来自实际重叠；不是随机扣分。
- 压机有固定且可观察的开合周期，关闭前有警示灯；松开立即停止，不引入隐形制动距离。
- 邮局使用解析摆荡轨迹及其切向速度，脱绳后由本地 Matter.js 模拟刚体落体和邮筒接触；必须从上方真实落入，碰侧面不算签收。签收目标先停住，盖章后才换下一封。
- 失败 650ms 后回到本局起点，也可以立刻手动重开。保留最好成绩和失败次数；没有生命次数、体力或广告限制。
- 没有任何按键会批准、取消或改变 Agent 的工具执行。

## 中断与本地记录

任务结束同步禁用输入、冻结模拟、取消动画帧和停止声音。三款都使用既有受审查 Pack Host，仅保存游戏自身的有界字段，不读写 Agent 内容。

恢复采取稳定检查点，而不是重放最后一帧物理碰撞：叠楼恢复已经落稳的楼层；压机恢复到上一道已通过机器之后的安全位置；邮局恢复到当前未完成信件起点。按住状态不会跨任务恢复，失败后的关卡从头开始；最佳纪录、失败次数保留。关闭页面前正常停止可触发保存。

## 实现入口

- 规则：`studio/sky-stack.js`、`studio/press-run.js`、`studio/swing-post.js`。
- 单键输入、中断和重开：`studio/one-button-kit.js`。
- 原创画面：`studio/one-button-painters.js`。微缩建筑、工业剖面、航空邮局是三套独立构图。
- 原创合成音效：`studio/one-button-sound.js`。默认静音，受页面静音开关控制。
- 注册：`studio/one-button-catalog.js`、`studio/registry.js`。
- 所有源文件相对于 `apps/codex-stage/`。本地模块继续由既有 Pack Builder 序列化，运行时不使用 CDN。

## 验证命令

```sh
node --test apps/codex-stage/one-button.test.js
node tools/build-game-packs.mjs
npm run test:one-button-browser
npm run test:studio-browser
```

浏览器测试可通过 `PLAYWRIGHT_MODULE`、`CHROME_PATH` 和 `STAGE_ORIGIN` 指定本地环境；全库回归使用 `STAGE_URL`。只读回放控制器在 `tools/one-button-replays.mjs`，通过点击、按住、松手完成关卡，不改坐标、分数或通关标志。浏览器验证使用真实鼠标、触屏事件、键盘和模拟 Codex Dock；模拟 Dock 通过不等于已经更新用户安装的 Codex。

美术、声音是本项目原创代码素材，Apache-2.0；Matter.js 保留 MIT 许可。封面由真实游戏渲染生成，来源记录在 `assets/studio/ARTWORK.md`。
