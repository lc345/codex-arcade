import {access,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {GAME_CATALOG,PLAYABLE_CATALOG} from '../apps/codex-stage/collection/catalog.js';
import {STANDALONE_CATALOG} from '../apps/codex-stage/collection/standalone-catalog.js';

const root=new URL('../',import.meta.url);
const standalone=STANDALONE_CATALOG.map(({id,title,entry})=>({id,title,scope:'standalone',release:'preview',taskEligible:true,url:entry}));
for(const game of standalone)await access(new URL(game.url.slice(1),root));
const catalog=GAME_CATALOG.map(g=>({id:g.id,title:g.title,scope:'catalog',release:g.release==='preview'?'preview':'stable',collection:g.collection||null,category:g.category,curated:Boolean(g.curated),url:`/codex-stage?game=${g.id}`}));
const games=[...catalog,...standalone];assert.equal(new Set(games.map(g=>g.id)).size,games.length,'A standalone game must not also be counted in the catalog');
const counts={catalog:catalog.length,standalone:standalone.length,total:games.length,stableRandom:catalog.filter(g=>g.release==='stable').length,previewCatalog:catalog.filter(g=>g.release==='preview').length,curated:catalog.filter(g=>g.curated).length,taskRandom:PLAYABLE_CATALOG.length};
const inventory={schemaVersion:1,counts,scope:'Source inventory of distinct playable IDs, including experiments. Not a release approval, current installed-runtime inventory, or a count of stages.',games};
await writeFile(new URL('docs/playable-inventory.json',root),JSON.stringify(inventory,null,2)+'\n');
const rows=games.map((g,i)=>`| ${i+1} | ${g.title} | \`${g.id}\` | ${g.scope==='standalone'?'本地页面适配 / 试玩':g.release==='stable'?'稳定':'库内试玩'}${g.curated?' / 精选':''} | [本地试玩](http://127.0.0.1:4173${g.url}) |`).join('\n');
await writeFile(new URL('docs/PLAYABLE_INVENTORY.zh-CN.md',root),`# 可玩作品清单\n\n由 \`node tools/build-playable-inventory.mjs\` 从源码生成。\n\n**${counts.catalog} 款编译游戏包 + ${counts.standalone} 款本地页面适配 = ${counts.total} 款不同作品。** 不按关卡、美术变体或独立页面重复计数。任务随机池 ${counts.taskRandom} 款；精选 ${counts.curated} 款是其中的子集，不能再相加。\n\n这是源码可玩清单，包含实验、待返工和用户不喜欢的作品，不代表全部通过发布验收；也不代表现有 Codex 安装已经更新。\n\n下表链接指向你电脑上的本地服务，并非 GitHub 在线游戏。请先完成安装或运行 \`node apps/press-lab/server.js\`；使用其他端口时替换链接中的 4173。\n\n| # | 游戏 | ID | 状态 | 入口 |\n| --- | --- | --- | --- | --- |\n${rows}\n`);
console.log(JSON.stringify(counts));
