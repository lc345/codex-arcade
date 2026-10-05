import {Matter as M} from '../apps/codex-stage/vendor/matter.js';
import {createPanWorld} from '../apps/codex-stage/arcade-five/pan-flip.js';
import {createBankWorld} from '../apps/codex-stage/arcade-five/bank-shot.js';
import {createPaperWorld} from '../apps/codex-stage/arcade-five/paper-racer.js';
import {createCapWorld} from '../apps/codex-stage/arcade-five/cap-cup.js';
import {createGliderWorld} from '../apps/codex-stage/arcade-five/paper-glider.js';
export const FIVE_FACTORIES={'pan-flip':createPanWorld,'bank-shot':createBankWorld,'paper-racer':createPaperWorld,'cap-cup':createCapWorld,'paper-glider':createGliderWorld};

// A read-only practice planner. It only sends the same press, move and release as a player.
export function chooseBankShot(s){
  let best={hits:-1,p:null};
  for(let n=0;n<90;n++){
    const a=n*Math.PI*2/90,px=Math.max(12,Math.min(948,s.ball.x-Math.cos(a)*165)),py=Math.max(60,Math.min(605,s.ball.y-Math.sin(a)*165)),dx=s.ball.x-px,dy=s.ball.y-py,len=Math.hypot(dx,dy);
    if(len<20)continue;
    const engine=M.Engine.create({gravity:{y:0}}),ball=M.Bodies.circle(s.ball.x,s.ball.y,15,{frictionAir:.006,friction:0,restitution:1});M.Body.setMass(ball,1);
    const targets=s.targets.filter(t=>!t.hit).map(t=>M.Bodies.circle(t.x,t.y,22,{isStatic:true,restitution:.96,friction:0}));
    const walls=[[480,92,780,20],[480,552,780,20],[88,322,20,480],[872,322,20,480]].map(v=>M.Bodies.rectangle(...v,{isStatic:true,restitution:1,friction:0}));
    M.Composite.add(engine.world,[ball,...targets,...walls,...s.obstacles.map(o=>M.Bodies.rectangle(o.x,o.y,o.w,o.h,{isStatic:true,angle:o.angle,restitution:1,friction:0}))]);
    const speed=Math.min(16,6+len*.055);M.Body.setVelocity(ball,{x:dx/len*speed,y:dy/len*speed});let hits=0;
    for(let i=0;i<660;i++){M.Engine.update(engine,1000/120);for(let j=targets.length-1;j>=0;j--)if(M.Collision.collides(ball,targets[j])&&Math.hypot(ball.velocity.x,ball.velocity.y)>1){M.Composite.remove(engine.world,targets[j]);targets.splice(j,1);hits++;}if(Math.hypot(ball.velocity.x,ball.velocity.y)<.6)break;}
    M.Composite.clear(engine.world,false);M.Engine.clear(engine);if(hits>best.hits)best={hits,p:{x:px,y:py}};
  }
  return best.p;
}
export function fiveCommand(s){
  if(s.phase!=='playing')return null;
  if(s.id==='pan-flip'){
    if(s.airborne)return null;
    if(s.held)return s.charge>=.52?{type:'up'}:null;
    if(s.cook[s.side]>.55&&s.cook[1-s.side]<.72)return {type:'down'};
  }
  if(s.id==='bank-shot'&&!s.moving)return {type:'shot',start:{x:s.ball.x,y:s.ball.y},end:chooseBankShot(s)};
  if(s.id==='paper-racer'){
    const d=s.distance+50,center=480+135*Math.sin(d/(370-s.stage*25))+70*Math.sin(d/150);let target=center;
    const e=s.erasers.find(e=>e.d-s.distance>-35&&e.d-s.distance<170);if(e)target=e.x+(e.x<center?85:-85);
    const right=s.car.x+s.car.vx*9<target;return right!==s.held?{type:right?'down':'up'}:null;
  }
  if(s.id==='cap-cup'&&s.mode==='aim'){
    const vx=Math.cos(s.angle)*660,vy=Math.sin(s.angle)*660,t=(-vy+Math.sqrt(vy*vy+2*750*20))/750;
    const x=s.launch.x+vx*t,tx=[650,755,585][s.scored%3]+(s.stage?Math.sin((s.time+t)*(.55+s.stage*.15)+s.scored)*[0,38,56][s.stage]:0);
    if(Math.abs(x-tx)<10)return {type:'down'};
  }
  if(s.id==='paper-glider'){
    const g=s.gates.find(g=>g.x>s.plane.x-35)||s.gates.at(-1),rise=s.plane.y+s.plane.vy*10>g.y;
    return rise!==s.held?{type:rise?'down':'up'}:null;
  }
  return null;
}
export function applyFiveCommand(w,c){if(!c)return;if(c.type==='shot'){w.down(c.start);w.move(c.end);w.up(c.end);}else w[c.type](c.point);}
export function replayFive(id,maxSeconds=180){const w=FIVE_FACTORIES[id](),stages=[];
  for(let i=0;i<maxSeconds*120;i++){
    const s=w.snapshot();if(!stages.includes(s.stage))stages.push(s.stage);if(['lost','won'].includes(s.phase)){w.destroy();return {s,stages};}
    if(s.phase==='ready')w.begin();else if(s.phase==='cleared')w.next();else applyFiveCommand(w,fiveCommand(s));w.step(1000/120);
  }
  const s=w.snapshot();w.destroy();return {s,stages};
}
