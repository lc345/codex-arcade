import {createOddKit} from '../odd-ten/kit.js';
import {gauntletRules} from './rules.js';

export function createNeedle(options){
  const {k,s,api,bind,gain}=createOddKit('needle-rush',options);
  const eye=t=>320+Math.sin(t*(1.65+s.stage*.4)+s.progress*1.7)*142;
  bind({reset(){s.goal=4+s.stage;s.limit=70;s.eye=eye(0);s.radius=[27,21,16][s.stage];s.bullet=null;s.line=[];s.readyAt=0;s.speed=740+s.stage*90;},tick(dt){s.eye=eye(s.time);if(!s.bullet)return;const b=s.bullet;b.x+=s.speed*dt;s.line.push({x:b.x,y:b.y});if(b.x>=745){const crossing=s.time-(b.x-745)/s.speed;if(Math.abs(eye(crossing)-b.y)>s.radius-4){k.finish(false,'擦到了针眼，线断了');return;}s.bullet=null;s.readyAt=s.time+.3;gain(745,b.y);}},down(){if(s.bullet||s.time<s.readyAt)return false;s.bullet={x:180,y:320};s.line=[];k.event('launch');}});return api;
}
export function createTightrope(options){
  const {k,s,api,bind}=createOddKit('tightrope-club',options);
  bind({reset(){s.goal=[12,15,18][s.stage];s.limit=s.goal+2;s.tilt=.06;s.velocity=0;s.wind=0;s.safe=[.76,.64,.55][s.stage];},tick(dt){s.wind=Math.sin(s.time*1.7)*.25+Math.sin(s.time*.53+2)*(.18+s.stage*.045);s.velocity+=((s.held?-1:1)*1.75+s.tilt*.8+s.wind)*dt;s.velocity*=Math.exp(-2.3*dt);s.tilt+=s.velocity*dt;s.progress=s.time;s.score=Math.floor(s.time*10);if(Math.abs(s.tilt)>s.safe)k.finish(false,'重心出了钢丝，失足了');else if(s.time>=s.goal)k.finish(true,'踩着风，走到了对面');}});return api;
}
export function createMirrors(options){
  const {k,s,api,bind}=createOddKit('mirror-vault',options),{beam}=gauntletRules();
  function trace(){s.beam=beam(s.mirrors,s.start,s.target);}
  bind({reset(){s.limit=100;s.goal=1;s.moves=[3,5,6][s.stage];s.start={x:0,y:4,dx:1,dy:0};const routes=[[[2,4,1],[2,1,1]],[[2,4,1],[2,1,1],[5,1,0],[5,4,0]],[[1,4,1],[1,1,1],[3,1,0],[3,3,0],[5,3,1],[5,0,1]]];s.mirrors=routes[s.stage].map(([x,y,v],i)=>({x,y,slash:i%3===1?Boolean(v):!v,id:i}));s.mirrors.push(...[{x:0,y:2,slash:false},{x:4,y:5,slash:true},{x:7,y:2,slash:false}].slice(0,s.stage+1));s.target=[{x:7,y:1},{x:7,y:4},{x:7,y:0}][s.stage];s.controlPoint={x:235+s.mirrors[0].x*70,y:130+s.mirrors[0].y*70};trace();},tick(){},down(p){const m=s.mirrors.find(m=>Math.hypot(p.x-(235+m.x*70),p.y-(130+m.y*70))<31);if(!m)return false;m.slash=!m.slash;s.moves--;trace();k.event('launch');if(s.beam.hit){s.progress=1;s.score=100;k.finish(true,'月光到手');}else if(!s.moves)k.finish(false,'翻转次数用完了');}});return api;
}
export function createCrates(options){
  const {k,s,api,bind}=createOddKit('crate-escape',options),{neighbors}=gauntletRules();
  bind({reset(){s.limit=120;s.w=7;s.h=6;s.goal=1+s.stage;s.moves=[22,34,48][s.stage];s.board=Array.from({length:42},(_,i)=>i%7===0||i%7===6||i<7||i>=35?1:0);s.player=29;s.boxes=[17,19,25].slice(0,s.goal);s.targets=[10,12,11].slice(0,s.goal);s.controlPoint={x:270+(s.player%7)*64,y:140+Math.floor(s.player/7)*64};},tick(){},down(p){const x=Math.round((p.x-270)/64),y=Math.round((p.y-140)/64),i=y*7+x;if(x<0||x>=7||y<0||y>=6||!neighbors(s.player,7,6).includes(i)||s.board[i])return false;const b=s.boxes.indexOf(i);if(b>=0){const to=i+(i-s.player);if(s.board[to]!==0||s.boxes.includes(to))return false;s.boxes[b]=to;k.event('impact');}s.player=i;s.moves--;s.controlPoint={x:270+x*64,y:140+y*64};s.progress=s.boxes.filter(i=>s.targets.includes(i)).length;s.score=s.progress*100;if(s.progress===s.goal)k.finish(true,'一个箱子也没困住');else if(s.boxes.some(i=>!s.targets.includes(i)&&((s.board[i-1]||s.board[i+1])&&(s.board[i-7]||s.board[i+7]))))k.finish(false,'箱子卡进了死角，拉不出来了');else if(!s.moves)k.finish(false,'搬运步数用完了');}});return api;
}
export function createTwins(options){
  const {k,s,api,bind,clamp}=createOddKit('twin-tide',options);
  bind({reset(){s.limit=40;s.goal=6+s.stage;s.x=.5;s.target=.5;s.speed=[105,130,155][s.stage];s.width=[.34,.27,.21][s.stage];s.gates=Array.from({length:s.goal},(_,i)=>({id:i,y:-i*290-100,p:[.26,.71,.37,.77,.24,.64,.42,.68][i],passed:false}));s.controlPoint={x:480,y:490};},tick(dt){s.x+=clamp(s.target-s.x,-dt*1.5,dt*1.5);for(const g of s.gates){g.y+=s.speed*dt;if(Math.abs(g.y-490)<23&&Math.abs(s.x-g.p)>s.width/2-.035){k.finish(false,s.x<g.p?'左艇擦到了闸门':'右艇撞上了闸门');return;}if(!g.passed&&g.y>518){g.passed=true;s.progress++;s.score+=100;k.event('catch',{x:270+(s.x-.5)*320,y:490});}}if(s.progress===s.goal)k.finish(true,'两个人，一个也没掉队');},move(p){s.target=clamp((p.x-150)/660,.05,.95);}});return api;
}
export function createMines(options){
  const {k,s,api,bind}=createOddKit('mine-surveyor',options),{minePuzzle}=gauntletRules();
  bind({reset(){Object.assign(s,minePuzzle(s.stage));s.limit=[85,85,80][s.stage];s.goal=s.mines.filter(v=>!v).length;s.progress=s.open.filter(Boolean).length;s.explosion=-1;},tick(){},down(p){const x=Math.floor((p.x-(480-s.w*29))/58),y=Math.floor((p.y-140)/58);if(x<0||x>=s.w||y<0||y>=s.h)return false;const i=y*s.w+x;if(s.open[i])return false;if(s.mines[i]){s.explosion=i;k.finish(false,'这格有雷，整片灯灭了');return;}s.open[i]=true;s.progress++;s.score+=100;k.event('catch',{x:p.x,y:p.y});if(s.progress===s.goal)k.finish(true,'安全地块，全部点亮');}});return api;
}
export function createTerritory(options){
  const {k,s,api,bind,clamp}=createOddKit('territory-cut',options),{capture}=gauntletRules();
  const index=p=>Math.floor((p.y-130)/26)*24+Math.floor((p.x-168)/26);
  const valid=p=>p.x>=168&&p.x<792&&p.y>=130&&p.y<520;
  const enemyCells=()=>s.enemies.map(e=>Math.floor(e.y)*24+Math.floor(e.x));
  bind({reset(){s.w=24;s.h=15;s.limit=70;s.goal=[.35,.5,.65][s.stage];s.board=Array.from({length:360},(_,i)=>i<24||i>=336||i%24===0||i%24===23?1:0);s.trail=[];s.enemies=[[15.3,8.3],[5.3,4.3],[11.3,11.3]].slice(0,s.stage+1).map(([x,y],i)=>({x,y,vx:(i%2?-1:1)*(1.7+s.stage*.45),vy:1.2+s.stage*.3}));s.percent=0;s.drawing=false;},
   tick(dt){for(const e of s.enemies){const iy=Math.floor(e.y),nx=e.x+e.vx*dt,ny=e.y+e.vy*dt;if(s.board[iy*24+Math.floor(nx)])e.vx*=-1;else e.x=nx;if(s.board[Math.floor(ny)*24+Math.floor(e.x)])e.vy*=-1;else e.y=ny;}if(enemyCells().some(i=>s.trail.includes(i)))k.finish(false,'光核碰到了还没闭合的线');},
   down(p){if(!valid(p)||!s.board[index(p)]){s.held=false;return false;}s.trail=[index(p)];s.drawing=true;},
   move(p){if(!s.held||!s.drawing||!valid(p))return;const end=index(p),last=s.trail.at(-1);let x=last%24,y=Math.floor(last/24),ex=end%24,ey=Math.floor(end/24);for(let n=0;n<40&&(x!==ex||y!==ey);n++){if(x!==ex)x+=Math.sign(ex-x);else y+=Math.sign(ey-y);const cell=y*24+x;if(s.trail.includes(cell)){k.finish(false,'线绕回了自己');return;}s.trail.push(cell);if(enemyCells().includes(cell)){k.finish(false,'划到了光核');return;}if(s.board[cell]){if(s.trail.length<3){s.trail=[cell];continue;}const next=capture(s.board,24,15,enemyCells(),s.trail);if(next)s.board=next;s.trail=[];s.drawing=false;s.held=false;s.percent=(s.board.filter(Boolean).length-74)/286;s.progress=s.percent;s.score=Math.round(s.percent*1000);k.event('break',{x:p.x,y:p.y});if(s.percent>=s.goal)k.finish(true,'这一片海，是你的了');return;}}},
   up(){s.trail=[];s.drawing=false;},clear(){s.trail=[];s.drawing=false;}});return api;
}
export function createFold(options){
  const {k,s,api,bind}=createOddKit('paper-fold',options),{fold}=gauntletRules();
  bind({reset(){s.limit=100;s.goal=1;s.moves=[3,4,5][s.stage];s.lines=[{axis:'x',line:2},{axis:'y',line:2},{axis:'x',line:3},{axis:'y',line:3}];s.points=[{x:0,y:0},{x:1,y:2},{x:2,y:1},{x:4,y:4},{x:0,y:4},{x:3,y:0}];const sequences=[[0,1],[1,0,2],[0,1,2,3]];s.target=s.points.map(p=>({...p}));for(const i of sequences[s.stage])s.target=fold(s.target,s.lines[i].axis,s.lines[i].line);s.lastFold=null;},tick(){},down(p){const i=s.lines.findIndex((l,i)=>Math.hypot(p.x-(i<2?315:425),p.y-(i%2?526:102))<25);if(i<0)return false;const l=s.lines[i],before=s.points;s.points=fold(s.points,l.axis,l.line);if(s.points.some(p=>p.x>6||p.y>6)){k.finish(false,'折出了纸张边界');return;}s.lastFold={before,axis:l.axis,line:l.line,at:s.time};s.moves--;k.event('launch');const key=ps=>ps.map(p=>p.x+','+p.y).sort().join('|');if(key(s.points)===key(s.target)){s.progress=1;s.score=100;k.finish(true,'折痕恰到好处');}else if(!s.moves)k.finish(false,'折多一步，也回不去了');}});return api;
}
export function createTempo(options){
  const {k,s,api,bind,gain}=createOddKit('tempo-steps',options);
  bind({reset(){s.goal=[16,20,24][s.stage];s.limit=40;s.window=[.12,.09,.065][s.stage];let t=1.5;s.notes=Array.from({length:s.goal},(_,i)=>{t+=[.72,.72,.36,.72,1.08,.36,.36,.72][(i+s.stage*2)%8]/(1+s.stage*.12);return {at:t,hit:false,miss:false};});s.cursor=0;s.flash=0;},tick(){const n=s.notes[s.cursor];if(n&&s.time>n.at+s.window){n.miss=true;s.errors++;s.cursor++;k.event('miss');if(s.errors>=3)k.finish(false,'漏掉三拍，节奏断了');}if(s.cursor===s.goal&&s.phase==='playing')k.finish(true,'切分拍，也没乱');},down(){const n=s.notes[s.cursor];if(!n)return false;s.flash=s.time;if(Math.abs(s.time-n.at)<=s.window){n.hit=true;s.cursor++;s.progress++;s.score+=100;k.event('catch',{x:480,y:330});if(s.cursor===s.goal)k.finish(true,'最后一拍，稳稳接住');}else{s.errors++;k.event('hit');if(s.errors>=3)k.finish(false,'抢拍太多，重新找节奏');}}});return api;
}
export function createAirlock(options){
  const {k,s,api,bind,clamp}=createOddKit('airlock-queue',options);
  bind({reset(){s.goal=6+s.stage*2;s.limit=60;s.pressure=50;s.velocity=0;s.tolerance=[12,9,6][s.stage];s.period=[3.4,2.8,2.35][s.stage];s.capsules=Array.from({length:s.goal},(_,i)=>({at:3+i*s.period,target:[30,76,20,65,38,82,26,68,42,75][i],done:false}));s.cursor=0;s.flash=null;},tick(dt){const target=s.held?32:-26;s.velocity+=(target-s.velocity)*Math.min(1,dt*7);s.pressure=clamp(s.pressure+s.velocity*dt,0,100);const n=s.capsules[s.cursor];if(n&&s.time>=n.at){const ok=Math.abs(s.pressure-n.target)<=s.tolerance;n.done=true;s.cursor++;s.flash={ok,at:s.time};if(ok){s.progress++;s.score+=100;k.event('catch',{x:480,y:330});}else{s.errors++;k.event('hit');if(s.errors>=2){k.finish(false,'气压差过大，货舱裂了');return;}}if(s.cursor===s.goal)k.finish(true,'最后一舱，安全接入');}}});return api;
}
export const GAUNTLET_WORLDS={'needle-rush':createNeedle,'tightrope-club':createTightrope,'mirror-vault':createMirrors,'crate-escape':createCrates,'twin-tide':createTwins,'mine-surveyor':createMines,'territory-cut':createTerritory,'paper-fold':createFold,'tempo-steps':createTempo,'airlock-queue':createAirlock};
