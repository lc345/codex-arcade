export const DICE_CATALOG = Object.freeze([{
  id: "dice-foundry", title: "骰子改装厂", english: "DICE FOUNDRY", kind: "game", edition: "studio", release: "preview",
  category: "cards-dice", collection: "dice", artStyle: "industrial-ink-comic", presentation: "panorama", soundPalette: "dice",
  pointerMode: "click-nav", persistentCheckpoint: true, hideLevels: true, keyboardKeys: ["Escape", "1", "2", "3", "4", "5", "6", "l"],
  color: "#bec535", genre: "骰面改装 · 组合战斗", levels: ["冲床学徒", "保险柜队长", "漏电线圈", "翻修拳王", "高压守卫", "六面总装机"], replayLabel: "再开一轮",
  hint: "投骰后，把三颗骰子拖进三个设备，或先点骰子再点设备。左到右结算：首台先充电2，中台效果点数+2，末台直接伤害+2。小锁保留骰子，每轮有一次重掷。看输出与自损预览后执行。电能保留，护盾每轮清空；热量达到8会先损伤自己8。胜利后选一个模块，再选六面中的一面替换。键盘1/2/3选骰，4/5/6装设备，L保留，B重掷，空格执行；改装时1/2/3选模块，方向键选骰面，回车安装。R重试本场。任务完成即停，投掷结果也会保存。",
  cover: "/apps/codex-stage/assets/studio/dice-foundry.png",
}]);
