# 单键挑战第二辑

四款新游戏保持一个动作、明确输赢、快速重试，但考验不同的判断。原有《叠到天上》《别被夹扁》《松手邮局》保持不变。

## 试玩

启动 `npm run serve:codex-stage`，打开服务输出的地址，在后面加 `/codex-stage?collection=one-button-2`。本次开发服务使用 `PORT=4176`。

| 游戏 | 操作 | 较劲的地方 |
| --- | --- | --- |
| 桥就这么长 `bridge-span` | 按住伸长，松手落桥 | 十座桥墩逐渐变窄；桥太长、太短都落水，桥头居中有额外分数 |
| 见缝插签 `orbit-pins` | 单击发射 | 十八根签共用一张唱片；旧签会挡路，每六根切换转向，越到最后空隙越少 |
| 最后一厘米 `last-stop` | 按住加速，松手刹车 | 八次停车，路面阻力和车位不同；松手后仍有惯性，整辆车必须留在车位内 |
| 地板辞职了 `gravity-shift` | 单击切换重力 | 十道障碍，有时得翻面，有时必须忍住不点；地板和天花板交替成为落脚处 |

鼠标、触摸、空格/回车共用输入契约。重试按钮或 R 重新开始；失败后 650ms 自动重试。没有第二技能、装备菜单或操作组合。任务结束同步冻结，不继续补完动画或音效。

这些是手动选择的预览包，未加入稳定的二十款随机池。库共 44 款，20 款稳定、24 款预览。浏览器的“开始任务/结束任务”是模拟生命周期；这次没有修改已安装 Codex 的 hooks、主题、注入器部署或旧 DMG。

## 实现边界

- `studio/encore-catalog.js` 声明四款预览；四个独立 world 文件负责规则，`encore-painters.js` 负责原创 Canvas 画面。
- 沿用 `one-button-kit.js` 的固定 120Hz 步进、输入所有权、防长按重复触发、取消和即时停止。
- 停车和重力使用仓库已有的 Matter.js。搭桥测量和转盘间隙用确定性规则，不另加引擎或网络依赖。
- 停车的宽度判定与画面车身一致；重力障碍用真实物理碰撞；不靠点击次数假装得分。
- 独立包只包含自身目录项和所需代码，音效在本地合成，默认静音；减少动效关闭装饰运动，但保留判断所需的核心运动。
- 每个包只有小型白名单存档：已通过的节点、最佳成绩、失败次数。没有 Agent 内容、文件路径、工具输出或网络传输。
- 任务中断后从安全节点恢复，不恢复按住状态、不回放未完成的发射。失败存档从起点重新开始，保留最佳记录。
- 社区任意 JavaScript 安装仍未开放；Shadow DOM 不构成安全沙箱。

## 素材与许可

全部画面、角色和合成声音为本项目原创，Apache-2.0。借鉴经典单键挑战的玩法节奏，不使用其他游戏角色、截图、商标或音效。Matter.js 保留原 MIT 许可。封面由 `tools/build-studio-previews.mjs` 截取真实画布，来源见 `assets/studio/ARTWORK.md`。

## 验证

```sh
node --test apps/codex-stage/one-button-encore.test.js
npm run build:game-packs
STAGE_ORIGIN=http://127.0.0.1:4176 npm run test:one-button-encore-browser
STAGE_ORIGIN=http://127.0.0.1:4176 npm run test:game-collections-browser
npm test
```

浏览器测试需要 Playwright 和 Chrome/Chromium，可通过 `PLAYWRIGHT_MODULE` 与 `CHROME_PATH` 指定已有安装。测试不会下载新软件。

规则测试覆盖所有关卡的合法输入通关、碰撞失败、每个中间节点恢复、非法存档拒绝、取消和停止。`tools/one-button-encore-replays.mjs` 的控制器只读公开场景并调用正常输入，不改写坐标、速度、成绩或结局。

浏览器测试用真实鼠标通关全部四款，并检查 390px 触屏、两倍像素密度、静音、减少动效、键盘、离线重开、存档、桌面/移动截图。模拟 Dock 验证四个独立包接收任务开始/结束事件后立即冻结画布，不改变宿主布局和主题。它不等同于已经验证本机安装版 Codex 的真实 hooks 触发。

截图与报告生成于 `output/one-button-encore-qa/`。
