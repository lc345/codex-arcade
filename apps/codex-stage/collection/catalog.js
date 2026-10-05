import { CONTRAST_CATALOG } from "../studio/contrast-catalog.js";
import { KITCHEN_CATALOG } from "../studio/kitchen-catalog.js";
import { YESTERDAY_CATALOG } from "../studio/yesterday-catalog.js";
import { RULE_CATALOG } from "../studio/rule-catalog.js";
import { STUNT_CATALOG } from "../studio/stunt-catalog.js";
import { SHADOW_CATALOG } from "../studio/shadow-catalog.js";
import { DICE_CATALOG } from "../studio/dice-catalog.js";
import { APPLIANCE_CATALOG } from "../studio/appliance-catalog.js";
import { TOAST_CATALOG } from "../studio/toast-catalog.js";
import { ONE_BUTTON_CATALOG } from "../studio/one-button-catalog.js";
import { ENCORE_CATALOG } from "../studio/encore-catalog.js";
import { VARIETY_CATALOG } from "../studio/variety-catalog.js";
import { MAGNET_CATALOG } from "../studio/magnet-catalog.js";
import { FIVE_CATALOG } from "../arcade-five/catalog.js";
import { SPORTS_CATALOG } from "../sports-ten/catalog.js";
import { ODD_CATALOG } from "../odd-ten/catalog.js";
import { CHALLENGE_CATALOG } from "../challenge-ten/catalog.js";
import { CENTURY_CATALOG } from "../century-ten/catalog.js";
import { GAUNTLET_CATALOG } from "../gauntlet-ten/catalog.js";
import { EXTREME_CATALOG } from "../extreme-six/catalog.js";
import { HARDCORE_CATALOG } from "../hardcore-ten/catalog.js";
import { STANDALONE_CATALOG } from "./standalone-catalog.js";
const CURATED_IDS = new Set(['toast-hop','sky-stack','press-run','swing-post','marble-demolition','magnet-rampage','return-fire']);
export const GAME_CATALOG = Object.freeze([
  ...CONTRAST_CATALOG,
  ...KITCHEN_CATALOG,
  ...YESTERDAY_CATALOG,
  ...RULE_CATALOG,
  ...STUNT_CATALOG,
  ...SHADOW_CATALOG,
  ...DICE_CATALOG,
  ...APPLIANCE_CATALOG,
  ...TOAST_CATALOG,
  ...ONE_BUTTON_CATALOG,
  ...ENCORE_CATALOG,
  ...VARIETY_CATALOG,
  ...MAGNET_CATALOG,
  ...FIVE_CATALOG,
  ...SPORTS_CATALOG,
  ...ODD_CATALOG,
  ...CHALLENGE_CATALOG,
  ...CENTURY_CATALOG,
  ...GAUNTLET_CATALOG,
  ...HARDCORE_CATALOG,
  ...EXTREME_CATALOG,
  {id:'return-fire',title:'借弹还弹',english:'RETURN FIRE',kind:'game',release:'preview',category:'shooter-bullethell',collection:'arcade-pilots',canvasPack:true,canvasHeight:640,physics:'matter',color:'#8de0b0',genre:'吸收反击 · 部件拆毁',levels:['肩炮','激光臂','反应堆'],hideLevels:true,persistentCheckpoint:true,cover:'/apps/codex-stage/return-fire/assets/drydock.png',hint:'移动鼠标闪避，按住吸收金色子弹，松开发射。红色攻击必须躲开。方向键移动，空格吸收。'},
  {id:'statue-act',title:'假装是雕像',english:'NOT A THIEF',kind:'game',release:'preview',category:'stealth-observation',collection:'arcade-pilots',canvasPack:true,canvasHeight:600,physics:'matter',color:'#ae483d',genre:'单键潜行 · 伪装喜剧',levels:['小奖杯','大花瓶','半身像'],hideLevels:true,persistentCheckpoint:true,cover:'/apps/codex-stage/statue-act/assets/museum.png',hint:'按住鼠标或空格前进，松手装雕像。保安回头前提前停稳，重物还会晃。'},
].map(game => ({ ...game, curated: CURATED_IDS.has(game.id), release: CURATED_IDS.has(game.id) ? "stable" : game.release })));

export const PLAYABLE_CATALOG = Object.freeze([...GAME_CATALOG, ...STANDALONE_CATALOG]);

export function createGamePicker(random = Math.random, catalog = GAME_CATALOG) {
  let bag = [], previous = null, previousCategory = null, cachedRun = null, cached = null, lastMode = null;
  return {
    pick(runId, preferred = null, mode = 'random') {
      if (cachedRun === runId && cached) return { ...cached };
      const pinned = catalog.find(g => g.id === preferred);
      if (pinned) { cached = pinned; cachedRun = runId; return { ...pinned }; }
      if(mode!==lastMode){bag=[];lastMode=mode;}
      if (!bag.length) {
        bag = catalog.filter(game => mode === 'all' || (mode==='curated' ? game.curated : game.release !== "preview"));
        if(!bag.length)bag=catalog.slice();
        for (let i = bag.length - 1; i > 0; i--) { const j = Math.min(i, Math.floor(Math.max(0, random()) * (i + 1))); [bag[i], bag[j]] = [bag[j], bag[i]]; }
        if (bag.at(-1).id === previous) [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
      }
      if(mode==='curated'&&bag.at(-1).category===previousCategory){const alternate=bag.findIndex(g=>g.category!==previousCategory&&g.id!==previous);if(alternate>=0)[bag[alternate],bag[bag.length-1]]=[bag.at(-1),bag[alternate]];}
      cached = bag.pop(); cachedRun = runId; previous = cached.id; previousCategory=cached.category; return { ...cached };
    },
  };
}
