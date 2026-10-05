import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {buildReviewedPack,reviewedCatalog} from './packs/build.js';
import {GAME_CATALOG} from './collection/catalog.js';
test('95 retained packs have valid digests, taxonomy, bounded size and no capabilities',()=>{
 const catalog=reviewedCatalog();assert.equal(catalog.length,95);assert.equal(catalog.filter(p=>p.release==='stable').length,7);
 const categories=new Set(JSON.parse(readFileSync(new URL('../../docs/game-catalog-1000-allocation.json',import.meta.url))).categories.map(c=>c.id));
 for(const p of catalog){const pack=buildReviewedPack(p.id);assert.equal(p.sha256,createHash('sha256').update(pack.source).digest('hex'));assert.deepEqual(p.permissions,[]);assert.ok(p.bytes<8*1024*1024,p.id);assert.ok(categories.has(p.category),p.id);assert.equal(p.license,'Apache-2.0');assert.doesNotThrow(()=>Function('return '+pack.factory));}
 for(const id of ['../../evil','https://host/game.js','cloud-sling','tin-wilderness'])assert.throws(()=>buildReviewedPack(id));
});
test('retained spatial games still bundle licensed local Three and Rapier only when needed',()=>{
 for(const id of ['last-lift','appliance-escape']){const p=buildReviewedPack(id);assert.deepEqual(p.manifest.dependencies.map(d=>d.id),['three','@dimforge/rapier3d-compat']);assert.match(p.source,/Apache License/);assert.match(p.source,/createPreparedStudioRuntime/);assert.ok(!p.source.includes('fetch('));}
 for(const id of ['toast-hop','needle-rush','return-fire'])assert.ok(!buildReviewedPack(id).source.includes('function createRapier'));
 const p=buildReviewedPack('magnet-rampage');assert.ok(p.manifest.dependencies.some(d=>d.id==='three'));assert.match(p.source,/Permission is hereby granted/);
});
test('selected studio packs remain isolated after legacy code removal',()=>{
 const studio=GAME_CATALOG.filter(g=>!g.canvasPack);for(const g of studio){const source=buildReviewedPack(g.id).source;assert.ok((source.match(/data:image\//g)||[]).length<=1);for(const other of studio)if(other.id!==g.id)assert.ok(!source.includes(`createStudioKernel("${other.id}"`));}
});
