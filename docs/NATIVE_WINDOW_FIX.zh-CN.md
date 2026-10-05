# 原生窗口可见性修复

2026-10-04 本机排查复现：旧窗口返回 visible=true、onActiveSpace=true，但 occlusionState=8192（不含 Visible 位），eventLoopRunning=false。WebKit 在后台能绘制画布，不能据此认定窗口能被用户看见或操作。

修复内容：

- 用 NSTimer 驱动状态读取，并启动 NSApplication 的真正事件循环。
- 使用不抢应用焦点的 NSPanel，允许跨桌面、其他应用的全屏空间和 Stage Manager；明确关闭失焦自动隐藏。
- 每轮开始按指针所在屏幕定位，窗口限定在可用屏幕区域内。
- 自检增加 userVisible、onActiveSpace、occlusionState、eventLoopRunning 和窗口矩形，不再用 visible 一项下结论。
- 原生测试要求当前桌面实际可见、事件循环运行、画布有内容，并测试完成和中断收起。

测试仅操作本项目独立窗口，不读取或控制 Codex 的受保护界面。模拟 hooks 的成功仍需与用户新任务的实际体验区分。此前构建的 ZIP/DMG 不自动获得此修复，发布前必须重新构建。

参考：[Apple 窗口遮挡状态](https://developer.apple.com/documentation/appkit/nswindow/occlusionstate-swift.property)、[跨应用全屏浮动窗口](https://developer.apple.com/documentation/appkit/nswindow/collectionbehavior-swift.struct/canjoinallapplications)。
