import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {GAUNTLET_CATALOG} from './catalog.js';
import {GAME_CATALOG} from '../collection/catalog.js';
import {buildReviewedPack} from '../packs/build.js';
test('gauntlet packs are isolated, licensed, offline and asset-verified',()=>{
 const manifest=JSON.parse(readFileSync(new URL('./assets/provenance.json',import.meta.url)));
 assert.equal(manifest.files.length,20);assert.equal(GAME_CATALOG.length,95);
 for(const f of manifest.files){assert.equal(f.license,'Apache-2.0');const b=readFileSync(new URL('./assets/'+f.path,import.meta.url));assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256);assert.equal(b.length,f.bytes);}
 for(const g of GAUNTLET_CATALOG){const p=buildReviewedPack(g.id);assert.ok(p.manifest.bytes<800000,g.id);assert.deepEqual(p.manifest.permissions,[]);assert.deepEqual(p.manifest.dependencies,[]);assert.equal(typeof Function('return '+p.factory)(),'function');assert.equal((p.source.match(/data:image\/png;base64,/g)||[]).length,1);assert.ok(!/https?:\/\//.test(p.source));for(const other of GAUNTLET_CATALOG)if(other.id!==g.id)assert.ok(!p.source.includes(`createOddKit('${other.id}'`));}
});
