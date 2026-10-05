import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {GAME_CATALOG,createGamePicker} from './collection/catalog.js';
import {buildReviewedPack} from './packs/build.js';
const retired=JSON.parse(readFileSync(new URL('../../docs/retired-games.json',import.meta.url))).ids;
test('the retired 26 are not selectable, buildable or left in shipped packs',()=>{
  assert.equal(retired.length,26);
  for(const id of retired){
    assert.ok(!GAME_CATALOG.some(g=>g.id===id),id);
    assert.throws(()=>buildReviewedPack(id));
    assert.ok(!existsSync(new URL(`packs/built/${id}.js`,import.meta.url)),id);
  }
});
test('default and curated bags contain retained games only, without consecutive repeats',()=>{
  for(const mode of ['random','curated']){const picker=createGamePicker(()=>.37);let previous;
    for(let i=0;i<150;i++){const g=picker.pick(String(i),null,mode);assert.ok(g&&!retired.includes(g.id));assert.notEqual(g.id,previous);assert.equal(picker.pick(String(i),null,mode).id,g.id);previous=g.id;}
  }
});
