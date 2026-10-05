// Retained dice-only replay helpers, extracted from the removed legacy replay bundle.
export function stepFor(g, seconds) { for (let i = 0; i < seconds * 120; i++) g.step(1000 / 120); }
export function chooseDiceOrder(g, style = 'charge') {
 const orders = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
 const value = p => (p.win ? 10000 : 0) - (p.lose ? 10000 : 0) + (g.scene.stats.enemy-p.final.enemy)*1.5 + p.final.hp*(style==='counter'?2.5:1.8) + p.final.energy*.45 - p.final.heat*.7;
 return orders.reduce((best,o)=>value(g.forecast(o))>value(g.forecast(best))?o:best,orders[0]);
}
export function chooseDiceUpgrade(g,style='charge') {
 const priority=style==='counter'?[4,8,11,9,7,5,3,10,6]:[3,8,9,10,5,7,11,6,4];
 const offer=g.scene.offers.reduce((best,face,i)=>priority.indexOf(face)<priority.indexOf(g.scene.offers[best])?i:best,0),face=g.scene.offers[offer],preferred=style==='counter'?1:2;
 const options=g.scene.decks.flatMap((row,d)=>row.map((old,f)=>({d,f,value:(d===preferred?10:0)+([0,2].includes(old)?8:-12)+(face===11?6-f:f)})));
 const target=options.sort((a,b)=>b.value-a.value)[0];return {offer,die:target.d,face:target.f};
}
export function solveDice(g,style='charge'){
 const rounds=[],upgrades=[];
 for(let i=0;i<150&&g.scene.phase==='playing';i++){
  if(g.scene.mode==='ready'){g.primary();stepFor(g,.7);}
  if(g.scene.mode==='plan'){const s=g.scene;if(s.rerolls){for(let d=0;d<3;d++){const face=s.decks[d][s.roll[d]],keep=[3,4,8,11].includes(face)||s.roll[d]>=3&&face!==1||face===1&&s.stats.energy<6;if(keep!==s.held[d])g.toggleHold(d);}if(s.held.some(h=>!h)){g.secondary();stepFor(g,.7);}}
   chooseDiceOrder(g,style).forEach((d,slot)=>g.assign(d,slot));g.primary();stepFor(g,2.4);rounds.push({level:g.scene.level,hp:g.scene.stats.hp,mode:g.scene.mode});}
  if(g.scene.mode==='reward'){const u=chooseDiceUpgrade(g,style);g.selectOffer(u.offer);g.install(u.die,u.face);upgrades.push(u);}
  if(g.scene.mode==='between')g.primary();
 }return {rounds,upgrades};
}
