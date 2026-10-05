import {createOddKit,linesCross} from '../odd-ten/kit.js';
import {Matter as M} from '../vendor/matter.js';
import {centuryRules} from './rules.js';

export function createChromatic(options){
  const {k,s,api,bind,dist}=createOddKit('chromatic-lab',options);
  bind({reset(){s.goal=1;s.limit=45;s.amounts=[0,0,0];s.target=[[.5,.5,0],[.2,.5,.3],[.35,.15,.5]][s.stage];s.tolerance=[.08,.05,.03][s.stage];s.valve=-1;s.total=0;s.controlPoint={x:280,y:175};},tick(dt){s.valve=s.held?[280,480,680].findIndex(x=>dist({x,y:175},s.controlPoint)<72):-1;if(s.valve<0)return;const n=Math.min(100-s.total,25*dt);s.amounts[s.valve]+=n;s.total+=n;if(s.total>=99.999){s.error=Math.max(...s.amounts.map((a,i)=>Math.abs(a/100-s.target[i])));s.progress=s.error<=s.tolerance?1:0;s.score=s.progress*100;k.finish(s.progress===1,s.progress?'颜色对上了':'这一杯颜色偏了');}},clear(){s.valve=-1;}});return api;
}

export function createLoop(options){
  const {k,s,api,bind,dist}=createOddKit('loop-lock',options),{inside}=centuryRules();let objects=[];
  bind({reset(){s.goal=3+s.stage;s.limit=55;s.loops=3;s.ink=650-s.stage*60;s.stroke=[];s.spent=0;objects=[[300,205],[365,245],[645,225],[575,420],[640,450]].slice(0,s.goal).map(([x,y],id)=>({id,x,y,bx:x,by:y,kind:'gem',taken:false}));objects.push(...[[480,180],[470,390],[275,430]].map(([x,y],i)=>({id:8+i,x,y,bx:x,by:y,kind:'curse'})));},tick(){for(const o of objects){o.x=o.bx+Math.sin(s.time*.8+o.id)*9;o.y=o.by+Math.cos(s.time*.6+o.id)*7;}},down(p){s.stroke=[{...p}];s.spent=0;},move(p){if(!s.held||!s.stroke.length)return;const d=dist(s.stroke.at(-1),p);if(d>4&&s.stroke.length<250){s.spent+=d;s.stroke.push({...p});}},up(p){if(s.stroke.length<7||dist(s.stroke[0],p)>42){s.stroke=[];return;}const poly=s.stroke.slice();s.stroke=[];if(s.spent>s.ink){s.notice='圈太长了，重新画';return;}for(let i=0;i<poly.length-1;i++)for(let j=i+2;j<poly.length-1;j++)if(!(i===0&&j===poly.length-2)&&linesCross(poly[i],poly[i+1],poly[j],poly[j+1])){s.notice='线打结了，重新画';return;}s.loops--;if(objects.some(o=>o.kind==='curse'&&inside(poly,o))){k.finish(false,'黑石也被圈进去了');return;}let n=0;for(const o of objects)if(o.kind==='gem'&&!o.taken&&inside(poly,o)){o.taken=true;n++;}s.progress+=n;s.score+=100*n;k.event(n?'catch':'miss',{x:p.x,y:p.y});s.notice=n?`收走 ${n} 枚`:'这一圈没有宝石';if(s.progress===s.goal)k.finish(true,'宝石，一枚不落');else if(!s.loops)k.finish(false,'三圈用完了');},clear(){s.stroke=[];s.spent=0;},read:()=>({objects})});return api;
}

export function createInkRail(options){
  const {k,s,api,bind,dist}=createOddKit('ink-rail',options);let engine,cart,obstacles=[];
  const clear=()=>{if(engine){M.Composite.clear(engine.world,false);M.Engine.clear(engine);}};
  bind({reset(){clear();s.goal=s.stage+1;s.limit=65;s.mode='draw';s.stroke=[];s.rail=[];s.ink=890-s.stage*35;s.spent=0;s.cart={x:168,y:294,angle:0};s.tickets=[[[470,330]],[[350,290],[620,363]],[[300,330],[465,285],[645,377]]][s.stage].map(([x,y])=>({x,y,taken:false}));s.rocks=s.stage===0?[]:s.stage===1?[{x:480,y:468,w:100,h:145}]:[{x:390,y:160,w:88,h:180},{x:570,y:480,w:100,h:110}];engine=M.Engine.create({gravity:{x:0,y:1,scale:.0007},positionIterations:8});cart=M.Bodies.circle(168,294,14,{friction:.05,frictionAir:.001,restitution:0,density:.003});obstacles=s.rocks.map(r=>M.Bodies.rectangle(r.x,r.y,r.w,r.h,{isStatic:true}));M.Composite.add(engine.world,[cart,M.Bodies.rectangle(125,324,110,10,{isStatic:true}),M.Bodies.rectangle(825,434,110,10,{isStatic:true}),...obstacles]);},tick(dt){if(s.mode!=='ride')return;if(cart.velocity.x<3.6)M.Body.applyForce(cart,cart.position,{x:.00055,y:0});M.Engine.update(engine,dt*1000);s.cart={x:cart.position.x,y:cart.position.y,angle:cart.angle};for(const t of s.tickets)if(!t.taken&&dist(cart.position,t)<30){t.taken=true;s.progress++;s.score+=100;k.event('catch',t);}if(obstacles.some(b=>M.Collision.collides(cart,b)))k.finish(false,'小车撞到了悬石');if(cart.position.y>575||cart.position.x<70)k.finish(false,'轨道没托住小车');if(cart.position.x>785&&cart.position.y>375&&cart.position.y<437){k.finish(s.progress===s.goal,s.progress===s.goal?'车票齐了，进站':'还有车票没拿到');}},down(p){if(s.mode!=='draw'||dist(p,{x:170,y:320})>55){s.held=false;return false;}s.stroke=[{x:165,y:320}];s.spent=0;},move(p){if(!s.held||s.mode!=='draw'||!s.stroke.length)return;const last=s.stroke.at(-1);if(p.x<=last.x+5)return;s.spent+=dist(last,p);s.stroke.push({x:p.x,y:p.y});},up(p){if(s.mode!=='draw'||!s.stroke.length)return;const points=s.stroke.slice();s.stroke=[];if(dist(p,{x:795,y:430})>50||s.spent>s.ink||points.length<3){s.notice='从左站重新画到右站';return;}points.push({x:835,y:430});if(points.some((v,i)=>i&&Math.abs(v.y-points[i-1].y)>(v.x-points[i-1].x)*1.35)){s.notice='这个坡太陡了';return;}s.rail=points;s.mode='ride';for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],len=dist(a,b);M.Composite.add(engine.world,M.Bodies.rectangle((a.x+b.x)/2,(a.y+b.y)/2,len+5,8,{isStatic:true,angle:Math.atan2(b.y-a.y,b.x-a.x),friction:.05}));}k.event('launch');},clear(){s.stroke=[];},dispose:clear});return api;
}

export function createSoda(options){
  const {k,s,api,bind}=createOddKit('soda-strata',options),{sodaGroup,popSoda}=centuryRules();
  bind({reset(){s.goal=30;s.limit=75;s.moves=[10,8,7][s.stage];s.readyAt=0;s.popped=[];s.board=[
    [0,0,1,1,2,2,0,1,1,2,2,0,1,1,2,2,0,0,1,2,2,0,0,1,2,2,0,0,1,1],
    [0,2,2,1,2,0,1,1,1,2,2,2,0,2,0,1,1,1,1,1,0,0,0,0,1,0,0,2,2,2],
    [0,0,0,0,0,2,2,1,1,1,1,2,0,0,0,2,2,0,2,0,2,1,1,0,2,1,2,2,2,0]
  ][s.stage].slice();},tick(){},down(p){if(s.time<s.readyAt)return false;const x=Math.floor((p.x-288)/64),y=Math.floor((p.y-148)/72);if(x<0||x>5||y<0||y>4)return false;const group=sodaGroup(s.board,y*6+x);if(group.length<3){s.notice='至少三个同色相连';return false;}s.popped=group;s.popAt=s.time;s.board=popSoda(s.board,group);s.moves--;s.progress+=group.length;s.score+=group.length*100;s.readyAt=s.time+.28;k.event('break',{x:p.x,y:p.y});if(s.progress===s.goal)k.finish(true,'整瓶清空');else if(!s.moves||!s.board.some((v,i)=>v>=0&&sodaGroup(s.board,i).length>=3))k.finish(false,'剩下的气泡凑不成组了');}});return api;
}

export function createLeaks(options){
  const {k,s,api,bind,dist,gain,clamp}=createOddKit('leak-patrol',options);let serial=0;
  bind({reset(){s.goal=6+s.stage*2;s.limit=40;s.water=0;s.nextLeak=.3;s.created=0;s.repairing=-1;serial=0;s.valves=Array.from({length:6},(_,i)=>({x:280+i%3*200,y:235+Math.floor(i/3)*180,leaking:false,repair:0,since:0}));},tick(dt){if(s.time>=s.nextLeak&&s.created<s.goal&&s.valves.some(v=>!v.leaking)){let i=(serial*5+s.stage)%6;while(s.valves[i].leaking)i=(i+1)%6;const v=s.valves[i];Object.assign(v,{leaking:true,repair:0,since:s.time});s.created++;serial++;s.nextLeak=s.time+[1.15,.95,.78][s.stage];}s.repairing=s.held?s.valves.findIndex(v=>v.leaking&&dist(v,s.controlPoint)<52):-1;for(const [i,v]of s.valves.entries())if(v.leaking){s.water+=(6+s.stage*2)*dt;if(i===s.repairing){v.repair+=dt/[.63,.72,.78][s.stage];if(v.repair>=1){v.leaking=false;s.water=Math.max(0,s.water-7);gain(v.x,v.y);}}}s.water=clamp(s.water-dt*1.2,0,100);if(s.water>=100)k.finish(false,'水漫过了警戒线');},clear(){s.repairing=-1;}});return api;
}

export function createQuarter(options){
  const {k,s,api,bind}=createOddKit('quarter-turn',options),{rotateFour}=centuryRules();
  bind({reset(){s.goal=1;s.limit=80;s.target=[0,1,2,3,4,5,6,7,8];s.board=s.target.slice();s.moves=[4,7,10][s.stage];s.readyAt=0;s.lastTurn=null;for(const q of [[0,3],[0,2,1,3],[0,2,3,1,0,3]][s.stage])s.board=rotateFour(s.board,q,3);},tick(){},down(p){if(s.time<s.readyAt)return false;const q=[{x:400,y:265},{x:490,y:265},{x:400,y:355},{x:490,y:355}].findIndex(v=>Math.hypot(v.x-p.x,v.y-p.y)<30);if(q<0)return false;s.lastTurn={q,at:s.time,before:s.board.slice()};s.board=rotateFour(s.board,q);s.moves--;s.readyAt=s.time+.23;k.event('launch');s.progress=s.board.every((v,i)=>v===s.target[i])?1:0;if(s.progress){s.score=100;k.finish(true,'窗花归位了');}else if(s.moves===0)k.finish(false,'旋转次数用完了');}});return api;
}

export function createStamps(options){
  const {k,s,api,bind,gain,miss}=createOddKit('stamp-storm',options);let serial=0;
  function next(){const count=s.stage===2?4:3;s.sample=Array.from({length:count},(_,i)=>(i+Math.floor(serial/3)+s.stage)%5);s.seals=s.sample.slice();if(serial%4===1||serial%4===2)s.seals[(serial+s.stage)%count]=(s.seals[(serial+s.stage)%count]+1)%5;s.deadline=s.time+[3.1,2.5,2.05][s.stage];s.readyAt=s.time+.22;s.sheet=serial++;}
  bind({reset(){s.goal=8+s.stage*2;s.limit=60;serial=0;s.mark=null;next();},tick(){if(s.time>s.deadline){miss('漏检太多张了');if(s.phase==='playing')next();}},down(p){if(s.time<s.readyAt||p.y<440||p.y>550||p.x<230||p.x>730)return false;const pass=p.x>480,valid=s.seals.every((v,i)=>v===s.sample[i]);s.mark={accepted:pass,correct:pass===valid,at:s.time};if(pass===valid)gain(p.x,p.y);else miss('盖错三次了');if(s.phase==='playing')next();}});return api;
}

export function createFridge(options){
  const {k,s,api,bind}=createOddKit('fridge-fit',options);let pieces=[];
  bind({reset(){s.goal=4+s.stage;s.limit=90;s.cols=s.stage?5:4;s.rows=s.stage===2?5:4;s.cell=54;s.bx=350;s.by=145;s.drag=null;
    let shape=s.stage===0?[[[0,0],[1,0],[0,1],[0,2]],[[0,0],[1,0],[0,1],[1,1]],[[0,0],[0,1],[1,1],[2,1]],[[0,0],[1,0],[2,0],[3,0]]]:[[[0,0],[1,0],[2,0],[0,1]],[[0,0],[1,0],[0,1],[1,1]],[[0,0],[1,0],[0,1],[1,1]],[[0,0],[0,1],[1,1],[2,1]],[[0,0],[1,0],[0,1],[1,1]]];if(s.stage===2){shape=shape.map(cells=>{const mx=Math.max(...cells.map(p=>p[0])),my=Math.max(...cells.map(p=>p[1]));return cells.map(([x,y])=>[mx-x,my-y]);});shape.push([[0,0],[1,0],[2,0],[3,0],[4,0]]);}
    pieces=shape.map((cells,id)=>({id,cells,x:id%2?Math.min(715,925-(1+Math.max(...cells.map(p=>p[0])))*54):55,y:130+Math.floor(id/2)*165,placed:false}));},tick(){},down(p){const item=pieces.slice().reverse().find(b=>b.cells.some(([x,y])=>p.x>=b.x+x*54&&p.x<b.x+(x+1)*54&&p.y>=b.y+y*54&&p.y<b.y+(y+1)*54));if(!item){s.held=false;return false;}s.drag={id:item.id,dx:p.x-item.x,dy:p.y-item.y,from:{x:item.x,y:item.y,placed:item.placed}};},move(p){if(s.held&&s.drag){const b=pieces[s.drag.id];b.x=p.x-s.drag.dx;b.y=p.y-s.drag.dy;}},up(){if(!s.drag)return;const d=s.drag,b=pieces[d.id],gx=Math.round((b.x-s.bx)/54),gy=Math.round((b.y-s.by)/54),occupied=new Set(pieces.filter(q=>q.placed&&q.id!==b.id).flatMap(q=>q.cells.map(([x,y])=>`${Math.round((q.x-s.bx)/54)+x},${Math.round((q.y-s.by)/54)+y}`)));
    const valid=b.cells.every(([x,y])=>gx+x>=0&&gx+x<s.cols&&gy+y>=0&&gy+y<s.rows&&!occupied.has(`${gx+x},${gy+y}`));if(valid){b.x=s.bx+gx*54;b.y=s.by+gy*54;b.placed=true;k.event('catch',{x:b.x,y:b.y});}else Object.assign(b,d.from);s.drag=null;s.progress=pieces.filter(q=>q.placed).length;s.score=s.progress*100;if(s.progress===s.goal)k.finish(true,'刚好，一格不剩');},clear(){if(s.drag){Object.assign(pieces[s.drag.id],s.drag.from);s.drag=null;}},read:()=>({pieces})});return api;
}

export function createKnots(options){
  const {k,s,api,bind,dist,clamp}=createOddKit('knot-office',options),{crossings}=centuryRules();
  function update(){s.crossings=crossings(s.nodes,s.edges);}
  bind({reset(){s.goal=1;s.limit=90;s.drag=null;const n=4+s.stage,perms=[[0,2,1,3],[0,2,4,1,3],[0,3,1,4,2,5]][s.stage];s.nodes=perms.map((v,id)=>({id,x:480+Math.cos(v/n*Math.PI*2-Math.PI/2)*215,y:325+Math.sin(v/n*Math.PI*2-Math.PI/2)*185}));s.edges=Array.from({length:n},(_,i)=>[i,(i+1)%n]);for(let i=2;i<n-1;i++)s.edges.push([0,i]);update();},tick(){},down(p){const node=s.nodes.find(n=>dist(n,p)<29);if(!node){s.held=false;return false;}s.drag={id:node.id,from:{x:node.x,y:node.y}};},move(p){if(!s.held||!s.drag)return;const point={x:clamp(p.x,215,745),y:clamp(p.y,135,515)};Object.assign(s.nodes[s.drag.id],point);update();},up(){if(!s.drag)return;s.drag=null;update();if(!s.crossings.length&&s.nodes.every((a,i)=>s.nodes.every((b,j)=>i===j||dist(a,b)>=55))){s.progress=1;s.score=100;k.finish(true,'每根线，都理顺了');}else k.event('launch');},clear(){if(s.drag){Object.assign(s.nodes[s.drag.id],s.drag.from);s.drag=null;update();}}});return api;
}

export function createShadows(options){
  const {k,s,api,bind,gain,miss}=createOddKit('shadow-tell',options);let serial=0;
  function next(){const n=4+s.stage*2,odd=(serial*5+s.stage)%n;s.cards=Array.from({length:n},(_,i)=>({id:i,shape:(i+serial)%4,variant:(i+serial)%3,shadowVariant:i===odd?((i+serial)%3+1)%3:(i+serial)%3,x:200+(i%(n/2))*560/(n/2-1),y:210+Math.floor(i/(n/2))*225}));s.deadline=s.time+[5.2,4.6,4][s.stage];s.readyAt=s.time+.24;s.sheet=serial++;}
  bind({reset(){s.goal=6+s.stage*2;s.limit=70;serial=0;next();},tick(){if(s.time>s.deadline){miss('观察时间用完了');if(s.phase==='playing')next();}},down(p){if(s.time<s.readyAt)return false;const card=s.cards.find(c=>Math.abs(c.x-p.x)<70&&Math.abs(c.y-p.y)<94);if(!card)return false;if(card.variant!==card.shadowVariant)gain(p.x,p.y);else miss('这件的影子没有错');if(s.phase==='playing')next();}});return api;
}

export const CENTURY_WORLDS={'chromatic-lab':createChromatic,'loop-lock':createLoop,'ink-rail':createInkRail,'soda-strata':createSoda,'leak-patrol':createLeaks,'quarter-turn':createQuarter,'stamp-storm':createStamps,'fridge-fit':createFridge,'knot-office':createKnots,'shadow-tell':createShadows};
