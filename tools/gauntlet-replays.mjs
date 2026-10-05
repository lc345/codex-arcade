import {GAUNTLET_WORLDS} from '../apps/codex-stage/gauntlet-ten/worlds.js';
import {gauntletRules} from '../apps/codex-stage/gauntlet-ten/rules.js';
const {neighbors,beam,fold,capture}=gauntletRules();
function crateSolution(s){const seen=new Set(),q=[{p:s.player,b:s.boxes.slice(),route:[]}];for(let head=0;head<q.length&&head<100000;head++){const a=q[head],key=a.p+':'+a.b.slice().sort((x,y)=>x-y).join();if(seen.has(key))continue;seen.add(key);if(a.b.every(i=>s.targets.includes(i)))return a.route;for(const i of neighbors(a.p,7,6)){if(s.board[i])continue;const b=a.b.slice(),bi=b.indexOf(i);if(bi>=0){const n=i+i-a.p;if(s.board[n]!==0||b.includes(n))continue;b[bi]=n;}q.push({p:i,b,route:[...a.route,i]});}}throw Error('Unsolvable crate layout');}
function foldSolution(s){const key=p=>p.map(p=>[p.x,p.y].join()).sort().join('|'),target=key(s.target),queue=[{p:s.points,route:[]}],seen=new Set();while(queue.length){const a=queue.shift(),k=key(a.p);if(k===target)return a.route;if(seen.has(k)||a.route.length>=s.moves)continue;seen.add(k);s.lines.forEach((l,i)=>{const p=fold(a.p,l.axis,l.line);if(p.every(p=>p.x<=6&&p.y<=6))queue.push({p,route:[...a.route,i]});});}throw Error('Unsolvable fold');}
export function gauntletCommand(s,memory={}){
 if(memory.stage!==s.stage){for(const key of Object.keys(memory))delete memory[key];memory.stage=s.stage;}
 if(s.id==='needle-rush'){const travel=565/s.speed,y=320+Math.sin((s.time+travel)*(1.65+s.stage*.4)+s.progress*1.7)*142;if(!s.bullet&&s.time>=s.readyAt&&Math.abs(y-320)<s.radius-9)return {type:'tap'};}
 if(s.id==='tightrope-club'){const held=s.tilt+s.velocity*.3>-.025;if(held!==s.held)return {type:held?'down':'up'};}
 if(s.id==='mirror-vault'){const m=s.mirrors.find((m,i)=>m.slash!==[true,true,...(s.stage===1?[false,false]:[false,false,true,true])][i]);if(m)return {type:'tap',point:{x:235+m.x*70,y:130+m.y*70}};}
 if(s.id==='crate-escape'){memory.route??=crateSolution(s);const i=memory.route.shift();if(i!==undefined)return {type:'tap',point:{x:270+i%7*64,y:140+Math.floor(i/7)*64}};}
 if(s.id==='twin-tide'){const g=s.gates.find(g=>!g.passed);if(g)return {type:'move',point:{x:150+660*g.p,y:490}};}
 if(s.id==='mine-surveyor'){
  const known=new Set(),safe=new Set(s.open.flatMap((v,i)=>v?[i]:[]));let changed=true;while(changed){changed=false;for(let i=0;i<s.open.length;i++){if(!s.open[i])continue;const ns=neighbors(i,s.w,s.h,true),u=ns.filter(j=>!safe.has(j)&&!known.has(j)),need=s.counts[i]-ns.filter(j=>known.has(j)).length;if(u.length&&need===u.length)for(const j of u){known.add(j);changed=true;}else if(u.length&&need===0)for(const j of u){safe.add(j);changed=true;}}}
  const i=[...safe].find(i=>!s.open[i]);if(i!==undefined)return {type:'tap',point:{x:480-s.w*29+i%s.w*58+29,y:169+Math.floor(i/s.w)*58}};throw Error('Mine clues require a guess');
 }
 if(s.id==='territory-cut'){
  const enemy=s.enemies.map(e=>Math.floor(e.y)*24+Math.floor(e.x));let best=null;
  for(const vertical of [true,false])for(let j=1;j<(vertical?23:14);j++){let path=[];for(let i=0;i<(vertical?15:24);i++){const cell=vertical?i*24+j:j*24+i;path.push(cell);if(!s.board[cell])continue;if(path.length>2&&!path.some(i=>enemy.includes(i))){const board=capture(s.board,24,15,enemy,path),gain=board?board.filter(Boolean).length-s.board.filter(Boolean).length:0;if(gain>(best?.gain??0))best={gain,path:path.slice()};}path=[cell];}}
  if(best)return {type:'stroke',points:best.path.map(i=>({x:181+i%24*26,y:143+Math.floor(i/24)*26}))};
 }
 if(s.id==='paper-fold'){memory.route??=foldSolution(s);const i=memory.route.shift();if(i!==undefined)return {type:'tap',point:{x:i<2?315:425,y:i%2?526:102}};}
 if(s.id==='tempo-steps'){const n=s.notes[s.cursor];if(n&&Math.abs(n.at-s.time)<s.window*.3)return {type:'tap'};}
 if(s.id==='airlock-queue'){const n=s.capsules[s.cursor];if(n){const held=s.pressure+s.velocity*.13<n.target;if(held!==s.held)return {type:held?'down':'up'};}}
 return null;
}
export function playGauntlet(id,{stepMs=1000/120}={}){const w=GAUNTLET_WORLDS[id](),memory={};w.begin();for(let i=0;i<60000;i++){const s=w.snapshot();if(s.phase==='lost'||s.phase==='won'){w.destroy();return s;}if(s.phase==='cleared'){w.next();w.begin();continue;}const c=gauntletCommand(s,memory),p=c?.point||{x:480,y:320};if(c?.type==='tap'){w.down(p);w.up(p);}if(c?.type==='down')w.down(p);if(c?.type==='up')w.up(p);if(c?.type==='move')w.move(p);if(c?.type==='stroke'){w.down(c.points[0]);for(const p of c.points.slice(1))w.move(p);w.up(c.points.at(-1));}w.step(stepMs);}const s=w.snapshot();w.destroy();return s;}
