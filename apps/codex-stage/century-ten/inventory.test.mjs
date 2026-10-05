import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {GAME_CATALOG} from '../collection/catalog.js';
test('the post-retirement inventory counts distinct games, not stages or duplicate standalone pages',()=>{
  const root=new URL('../../../',import.meta.url),m=JSON.parse(readFileSync(new URL('docs/playable-inventory.json',root),'utf8'));
  assert.deepEqual(m.counts,{catalog:95,standalone:5,total:100,stableRandom:7,previewCatalog:88,curated:7,taskRandom:100});
  assert.equal(new Set(m.games.map(g=>g.id)).size,100);assert.equal(m.games.length,100);
  assert.deepEqual(m.games.filter(g=>g.scope==='catalog').map(g=>g.id),GAME_CATALOG.map(g=>g.id));
  for(const g of m.games.filter(g=>g.scope==='standalone'))assert.ok(existsSync(new URL(g.url.slice(1),root)));
  assert.match(m.scope,/Not a release approval/);
});
