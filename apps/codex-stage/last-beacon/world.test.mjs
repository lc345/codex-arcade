import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareRapier} from '../vendor/rapier.js';
import {createBattleWorld,zoneAt,WEAPONS} from './world.js';
import {BEACON_MAP} from './map.js';
import {chooseBattleInput} from '../../../tools/beacon-replay.mjs';
await prepareRapier();
const tick=(w,n)=>{for(let i=0;i<n*60;i++)w.step(1000/60);};
const duel=(cover=false)=>({obstacles:cover?[{id:'wall',x:0,z:0,w:10,d:1,h:3,kind:'wall'}]:[],spawns:[{x:0,z:8},{x:0,z:-8}],loot:[{id:'rifle',kind:'rifle',x:0,z:6}],radius:62});
test('battle starts waiting, has eight contenders, and needs player input',()=>{const w=createBattleWorld();const s=w.snapshot();tick(w,10);assert.deepEqual(w.snapshot(),s);assert.equal(s.actors.length,8);assert.equal(s.phase,'ready');w.destroy();});
test('Rapier blocks movement and bullets at real cover',()=>{const w=createBattleWorld({arena:duel(true)});w.begin();w.control({forward:1,fire:true,yaw:0,pitch:0});tick(w,5);const s=w.snapshot();assert.ok(s.player.z>.88);assert.equal(s.actors[1].hp,100);assert.equal(s.player.kills,0);w.destroy();});
test('aimed fire eliminates an opponent, while missed shots never award a kill',()=>{const w=createBattleWorld({arena:duel()});w.begin();w.control({fire:true,yaw:Math.PI/2});tick(w,1);assert.equal(w.snapshot().player.kills,0);for(let n=0;n<240;n++){const s=w.snapshot(),b=s.actors[1];w.control({fire:true,yaw:Math.atan2(b.x-s.player.x,-(b.z-s.player.z)),pitch:0});w.step(1000/60);}assert.equal(w.snapshot().phase,'won');assert.equal(w.snapshot().alive,1);assert.equal(w.snapshot().player.kills,1);w.destroy();});
test('loot requires proximity and improves the actual equipped weapon',()=>{const w=createBattleWorld({arena:duel()});w.begin();assert.equal(w.interact(),false);w.control({forward:1,yaw:0});tick(w,.3);w.cancel();assert.equal(w.interact(),true);assert.equal(w.snapshot().player.weapon,'rifle');assert.equal(w.interact(),false);w.destroy();});
test('reload consumes reserve and shooting has a cadence',()=>{const w=createBattleWorld({arena:duel(true)});w.begin();w.control({fire:true,yaw:1});tick(w,.7);w.cancel();let s=w.snapshot();assert.ok(s.player.mag<WEAPONS.pistol.mag);const reserve=s.player.reserve;assert.equal(w.reload(),true);tick(w,2);s=w.snapshot();assert.equal(s.player.mag,WEAPONS.pistol.mag);assert.ok(s.player.reserve<reserve);assert.equal(w.heal(),false);w.destroy();});
test('zone has warning and shrink periods and standing outside it can really lose',()=>{assert.ok(zoneAt(30).radius<zoneAt(0).radius);assert.ok(zoneAt(115).radius<zoneAt(60).radius);const w=createBattleWorld({arena:{...duel(true),spawns:[{x:0,z:58},{x:0,z:0}]}});w.begin();tick(w,100);assert.equal(w.snapshot().phase,'lost');assert.equal(w.snapshot().reason,'未能进入安全区');w.destroy();});
test('AI paths use a navigable route around warehouse walls',()=>{const w=createBattleWorld();const path=w.route({x:-36,z:12},{x:-8,z:12});assert.ok(path.length>2);assert.ok(path.every(p=>w.walkable(p.x,p.z)));w.destroy();});
test('task stop freezes combat, rejects input, and a bounded checkpoint resumes unheld',()=>{const w=createBattleWorld();w.begin();w.control({forward:1,fire:true,yaw:0});tick(w,.4);w.stop();const s=w.snapshot(),cp=w.checkpoint();tick(w,3);assert.deepEqual(w.snapshot(),s);assert.equal(w.control({fire:true}),false);assert.ok(JSON.stringify(cp).length<16000);const next=createBattleWorld({checkpoint:cp});assert.equal(next.snapshot().phase,'ready');assert.equal(next.snapshot().player.mag,s.player.mag);assert.equal(next.snapshot().player.fire,false);assert.equal(next.snapshot().time,s.time);w.destroy();next.destroy();});
test('malformed saves, nonfinite input and invalid timesteps cannot corrupt a battle',()=>{const w=createBattleWorld({checkpoint:{version:1,time:Infinity,actors:[{hp:1e8,x:NaN}]}});assert.equal(w.snapshot().player.hp,100);w.begin();const s=w.snapshot();assert.equal(w.control({forward:Infinity}),false);for(const t of [NaN,Infinity,-1])w.step(t);assert.deepEqual(w.snapshot(),s);w.destroy();assert.equal(w.begin(),false);});
test('a complete eight-actor match is winnable through ordinary controls without state mutation',()=>{
  const w=createBattleWorld();w.begin();for(let i=0;i<60*185;i++){const s=w.snapshot();if(s.phase!=='playing')break;w.control(chooseBattleInput(w,s));w.step(1000/60);}
  const s=w.snapshot();assert.equal(s.phase,'won');assert.equal(s.alive,1);assert.equal(s.player.kills,7);assert.ok(s.player.reserve<152);assert.equal(s.player.fire,false);assert.equal(s.player.flash,0);w.destroy();
});
test('bots really fight each other without player shots',()=>{const w=createBattleWorld();w.begin();w.control({strafe:-1});tick(w,4);w.cancel();tick(w,40);const s=w.snapshot();assert.ok(s.actors.slice(1).some(a=>a.kills>0));assert.ok(s.alive<8);assert.equal(s.player.kills,0);w.destroy();});
test('a wounded survivor can heal, but moving interrupts without consuming a kit',()=>{
  const a=duel(true),setup=createBattleWorld({arena:a}),cp=setup.checkpoint();setup.destroy();cp.actors[0].hp=30;
  const w=createBattleWorld({arena:a,checkpoint:cp});w.begin();assert.equal(w.heal(),true);tick(w,.3);w.control({forward:1});tick(w,.1);w.cancel();assert.equal(w.snapshot().player.heal,0);assert.equal(w.snapshot().player.medkits,1);assert.equal(w.snapshot().player.hp,30);
  w.heal();tick(w,1.9);assert.equal(w.snapshot().player.hp,90);assert.equal(w.snapshot().player.medkits,0);w.destroy();
});
