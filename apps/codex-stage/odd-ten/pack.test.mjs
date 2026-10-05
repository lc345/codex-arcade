import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ODD_CATALOG} from './catalog.js';
import {GAME_CATALOG,createGamePicker} from '../collection/catalog.js';
import {buildReviewedPack} from '../packs/build.js';
test('ten distinct new previews do not silently enter stable or curated rotation',()=>{
  assert.equal(ODD_CATALOG.length,10);assert.equal(new Set(ODD_CATALOG.map(g=>g.artStyle)).size,10);assert.equal(GAME_CATALOG.length,95);
  assert.equal(GAME_CATALOG.filter(g=>g.release!=='preview').length,7);assert.equal(GAME_CATALOG.filter(g=>g.curated).length,7);
  const picker=createGamePicker();for(let i=0;i<60;i++)assert.ok(!ODD_CATALOG.some(g=>g.id===picker.pick('odd-'+i).id));
});
test('each pack is small, isolated, licensed and offline; only physics games bundle Matter',()=>{
  for(const g of ODD_CATALOG){const p=buildReviewedPack(g.id);assert.ok(p.manifest.bytes<800000);assert.equal(p.manifest.sha256,createHash('sha256').update(p.source).digest('hex'));assert.deepEqual(p.manifest.permissions,[]);assert.equal(typeof Function('return '+p.factory)(),'function');assert.equal(p.source.includes('createMatter='),g.physics==='matter');
    assert.ok(!/https?:\/\//.test(p.source.replace(/\/\*[\s\S]*?\*\//g,'')));assert.equal((p.source.match(/data:image\/png;base64,/g)||[]).length,1);assert.ok(p.source.includes(readFileSync(new URL(`./assets/${g.id}.png`,import.meta.url)).toString('base64')));
    assert.equal(p.manifest.dependencies.length,g.physics==='matter'?1:0);
    for(const other of ODD_CATALOG)if(other.id!==g.id)assert.ok(!p.source.includes(`createOddKit('${other.id}'`));
  }
});
