import {HARDCORE_WORLDS} from '../apps/codex-stage/hardcore-ten/worlds.js';
import {hardRules} from '../apps/codex-stage/hardcore-ten/rules.js';
const {angle,knightMoves,solvePolarity,corridorDistance}=hardRules();

function knightRoute(s){const used=new Set(s.visited),route=[];function visit(i){if(used.size===s.tiles.length)return i===s.exit;const ns=knightMoves(i).filter(j=>s.tiles.includes(j)&&!used.has(j)).sort((a,b)=>knightMoves(a).filter(j=>!used.has(j)&&s.tiles.includes(j)).length-knightMoves(b).filter(j=>!used.has(j)&&s.tiles.includes(j)).length);for(const j of ns){if(j===s.exit&&used.size!==s.tiles.length-1)continue;used.add(j);route.push(j);if(visit(j))return true;used.delete(j);route.pop();}return false;}if(!visit(s.player))throw Error('No knight tour');return route;}
function reflect(x,min,max){const len=max-min,v=((x-min)%(len*2)+len*2)%(len*2);return min+(v>len?2*len-v:v);}
function discMove(s){const goal=s.keys[s.progress];if(!goal)return null;let best=null;const directions=Array.from({length:32},(_,i)=>i*Math.PI/16);directions.push(Math.atan2(goal.y-s.player.y,goal.x-s.player.x));
  for(const a of directions){const vx=Math.cos(a)*240,vy=Math.sin(a)*240;let clearance=999,hit=false;
    for(const t of [.06,.14,.24,.36]){const x=s.player.x+vx*t,y=s.player.y+vy*t;if(x<139||x>821||y<126||y>514){hit=true;break;}for(const d of s.discs){const dx=reflect(d.x+d.vx*t,143,817),dy=reflect(d.y+d.vy*t,128,512),dist=Math.hypot(x-dx,y-dy)-32;clearance=Math.min(clearance,dist);if(dist<4)hit=true;}}
    const x=s.player.x+vx*.18,y=s.player.y+vy*.18,score=-Math.hypot(x-goal.x,y-goal.y)+Math.min(65,clearance)*.27-(hit?2000:0);if(!best||score>best.score)best={score,point:{x:s.player.x+vx*.14,y:s.player.y+vy*.14}};
  }return {type:'move',point:best.point};
}
function rotorMove(s,m){const target=s.path[s.progress+1];if(!target)return null;const from=s.path[s.progress],dx=target.x-s.player.x,dy=target.y-s.player.y,d=Math.hypot(dx,dy);if(m.rotorLeg===s.progress)return {type:'move',point:target};
  if(Math.hypot(from.x-s.player.x,from.y-s.player.y)>1)return {type:'move',point:from};
  // Wait inside the turning pocket until the entire crossing is collision-free.
  for(let t=0;t<d/s.moveSpeed;t+=1/90){const x=s.player.x+dx/d*Math.min(d,s.moveSpeed*t),y=s.player.y+dy/d*Math.min(d,s.moveSpeed*t),a=s.angle+s.turnSpeed*t;
    for(const end of [-1,1])for(const side of [-1,1]){const p={x:x+end*51*Math.cos(a)-side*6*Math.sin(a),y:y+end*51*Math.sin(a)+side*6*Math.cos(a)};if(corridorDistance(p,s.path)>s.halfWidth-2&&s.path.every(n=>Math.hypot(p.x-n.x,p.y-n.y)>s.pocket-2))return {type:'move',point:from};}
  }m.rotorLeg=s.progress;return {type:'move',point:target};
}
export function hardcoreCommand(s,m={}){
  if(m.stage!==s.stage){for(const key of Object.keys(m))delete m[key];m.stage=s.stage;}
  if(s.id==='ratchet-vault'&&s.mode==='orbit'){
    const n=s.nodes[s.node+1],vx=-Math.sin(s.angle),vy=Math.cos(s.angle),dx=n.x-s.player.x,dy=n.y-s.player.y,along=dx*vx+dy*vy,cross=Math.abs(dx*vy-dy*vx);if(along>0&&cross<s.catchRadius-5)return {type:'tap'};
  }
  if(s.id==='hex-panic'){const r=s.rings.find(r=>!r.done);if(r){const held=angle(r.gap-s.angle)<0;if(held!==s.held)return {type:held?'down':'up'};}}
  if(s.id==='downshaft'){
    const gate=s.gates.find(g=>!g.done);if(gate){const x=gate.x??gate.center,dy=gate.y-s.player.y,error=Math.abs(s.player.x-x);if(dy>28&&dy<250&&s.fuel>0&&s.time-s.brakeAt>.4&&error>Math.max(12,s.opening/2-16)&&dy/Math.max(90,s.vy)<error/235+.3)return {type:'tap',point:{x,y:300}};return {type:'move',point:{x,y:300}};}
  }
  if(s.id==='magnet-suture'){
    const goal=s.path[s.progress+1];if(goal){const dx=goal.x-s.player.x,dy=goal.y-s.player.y,d=Math.hypot(dx,dy),speed=Math.min(85,d*2.5),vx=dx/(d||1)*speed,vy=dy/(d||1)*speed;return {type:'move',point:{x:s.player.x+(vx-s.velocity.x)*.5+vx*.18,y:s.player.y+(vy-s.velocity.y)*.5+vy*.18}};}
  }
  if(s.id==='flash-dojo'){const n=s.duels[s.cursor];if(n&&s.time>=n.at+.015&&s.time<n.at+s.window-.01)return {type:'tap'};}
  if(s.id==='rotor-courier')return rotorMove(s,m);
  if(s.id==='knight-fall'){m.route??=knightRoute(s);const i=m.route.shift();if(i!==undefined)return {type:'tap',point:{x:306+i%5*87,y:150+Math.floor(i/5)*87}};}
  if(s.id==='polarity-lock'){m.route??=solvePolarity(s.state,s.masks);const i=m.route.shift();if(i!==undefined)return {type:'tap',point:{x:336+i%4*96,y:180+Math.floor(i/4)*96}};}
  if(s.id==='disc-vault')return discMove(s);
  if(s.id==='echo-rewind'){
    m.notes??=[];if(s.mode==='show'&&s.lit>=0)m.notes[Math.floor((s.time-1)/s.period)]=s.lit;
    if(s.mode==='recall'){const i=m.notes[s.goal-1-s.progress];if(i===undefined)throw Error('Replay missed a visible note');return {type:'tap',point:{x:354+i%3*126,y:201+Math.floor(i/3)*126}};}
  }
  return null;
}
export function playHardcore(id,{stepMs=1000/120}={}){
  const w=HARDCORE_WORLDS[id](),memory={};w.begin();
  for(let i=0;i<60000;i++){const s=w.snapshot();if(['lost','won'].includes(s.phase)){w.destroy();return s;}if(s.phase==='cleared'){w.next();w.begin();continue;}
    const c=hardcoreCommand(s,memory),p=c?.point||{x:480,y:320};if(c?.type==='tap'){w.down(p);w.up(p);}if(c?.type==='down')w.down(p);if(c?.type==='up')w.up(p);if(c?.type==='move')w.move(p);w.step(stepMs);
  }const result=w.snapshot();w.destroy();return result;
}
