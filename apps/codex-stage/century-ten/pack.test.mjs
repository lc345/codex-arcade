import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CENTURY_CATALOG} from './catalog.js';
import {GAME_CATALOG,createGamePicker} from '../collection/catalog.js';
import {buildReviewedPack} from '../packs/build.js';
test('ten different century previews preserve the existing release pools',()=>{
  assert.equal(CENTURY_CATALOG.length,10);assert.equal(new Set(CENTURY_CATALOG.map(g=>g.artStyle)).size,10);assert.equal(GAME_CATALOG.length,95);
  assert.equal(GAME_CATALOG.filter(g=>g.release!=='preview').length,7);assert.equal(GAME_CATALOG.filter(g=>g.curated).length,7);
  const picker=createGamePicker();for(let i=0;i<90;i++)assert.ok(!CENTURY_CATALOG.some(g=>g.id===picker.pick('century-'+i).id));
});
test('selected century packs are isolated, licensed and offline',()=>{
  const illustrated=new Set(['ink-rail','leak-patrol','fridge-fit']);
  for(const g of CENTURY_CATALOG){const p=buildReviewedPack(g.id);assert.ok(p.manifest.bytes<(illustrated.has(g.id)?8*1024*1024:800000),g.id);assert.equal(p.manifest.sha256,createHash('sha256').update(p.source).digest('hex'));assert.deepEqual(p.manifest.permissions,[]);assert.equal(typeof Function('return '+p.factory)(),'function');assert.equal(p.source.includes('createMatter='),g.physics==='matter');
    assert.ok(!/https?:\/\//.test(p.source.replace(/\/\*[\s\S]*?\*\//g,'')));assert.equal((p.source.match(/data:image\/png;base64,/g)||[]).length,1);assert.ok(p.source.includes(readFileSync(new URL(`./assets/${g.id}.png`,import.meta.url)).toString('base64')));assert.equal(p.manifest.dependencies.length,g.physics==='matter'?1:0);
    for(const other of CENTURY_CATALOG)if(other.id!==g.id)assert.ok(!p.source.includes(`createOddKit('${other.id}'`));
  }
});
