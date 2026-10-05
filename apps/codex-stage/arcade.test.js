import assert from 'node:assert/strict';
import test from 'node:test';
import {createAgentArcadeSource,listTheaterPrograms,selectTheaterProgram,programControls} from './arcade.js';
import {GAME_CATALOG} from './collection/catalog.js';
test('old preferences cannot resurrect retired works',()=>{
 assert.deepEqual(listTheaterPrograms('short'),[]);assert.equal(listTheaterPrograms().length,95);
 for(const id of ['cloud-sling','neon-slice','office-life','tin-wilderness']){const g=selectTheaterProgram({runId:'r'},'game',0,null,id);assert.ok(GAME_CATALOG.some(p=>p.id===g.id));assert.notEqual(g.id,id);assert.throws(()=>createAgentArcadeSource({packId:id}));}
});
test('neutral controls no longer describe retired slingshot ammunition',()=>{
 assert.equal(programControls(null,{phase:'won'}).primary.label,'下一关');assert.equal(programControls(null,{phase:'lost'}).primary.label,'再试一次');assert.equal(programControls(null,{phase:'ready'}).primary.label,'开始');
});
test('studio packs contain only their selected metadata and no retired game worlds',()=>{
 for(const id of ['toast-hop','kitchen-defense','rainline']){const source=createAgentArcadeSource({packId:id});const programs=Function(source+';return GAME_CATALOG')();assert.deepEqual(programs.map(p=>p.id),[id]);assert.ok(!source.includes('createSlingWorld'));assert.ok(!source.includes('createFlightWorld'));}
});
test('synchronous studio serialization excludes Canvas packs',()=>{
 const source=createAgentArcadeSource();assert.ok(Function(source+';return GAME_CATALOG')().every(g=>!g.canvasPack));assert.throws(()=>createAgentArcadeSource({packId:'needle-rush'}),/reviewed pack builder/);
 const packs=Function(source+';return STUDIO_PACKS')();assert.ok(packs['toast-hop']);assert.equal(packs['tin-wilderness'],undefined);assert.equal(source.includes('eval('),false);
});
