// First-party local pages with an existing task lifecycle. No community URL input.
export const STANDALONE_CATALOG = Object.freeze([
  { id: "godot-junk", title: "破烂拳王", english: "JUNK CHAMPION", pilot: "agentStagePilot", canvasHeight: 540, category: "timing-combat", cover: "godot-junk/built/game.png", hint: "按住防御，松开出拳；R 重试。", levels: ["锅炉重拳", "涡轮连击", "弹簧骗子"] },
  { id: "cart-downhill", title: "购物车下坡王", english: "CAKE, BRAKES & CHAOS", pilot: "cartPilot", canvasHeight: 540, category: "driving", cover: "standalone/covers/cart-downhill.png", hint: "鼠标移动转向，按住刹车，松开加速。", levels: ["坡顶街区", "集市混乱", "码头派对"] },
  { id: "reel-break", title: "收线！别断", english: "REEL, DON'T BREAK", pilot: "reelPilot", canvasHeight: 640, category: "timing-survival", cover: "reel-break/assets/inlet.png", hint: "按住收线，松开泄力，别把鱼线绷断。", levels: ["赤尾梭", "金腹鲷", "蓝绸鳍"] },
  { id: "last-beacon", title: "最后信标", english: "LAST BEACON", pilot: "battlePilot", canvasHeight: 540, category: "shooter-survival", cover: "last-beacon/assets/ground.png", hint: "WASD 移动，鼠标瞄准，左键射击，R 换弹。", levels: ["海岸站"] },
  { id: "grab-go", title: "抓到算你的", english: "GRAB & GO", pilot: "grabPilot", canvasHeight: 640, category: "timing-collection", cover: "grab-go/assets/cabinet.png", hint: "点击画面下钩，限时抓取物品达到目标。", levels: ["街角初开张", "夜市寻宝", "满载而归"] },
].map(game => ({ ...game, kind: "game", release: "preview", curated: false, collection: "arcade-pilots", genre: game.english, hideLevels: true, standalone: true, cover: `/apps/codex-stage/${game.cover}`, entry: `/apps/codex-stage/${game.id}/index.html` })));
