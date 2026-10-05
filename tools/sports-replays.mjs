import {Matter as M} from '../apps/codex-stage/vendor/matter.js';
import {SPORTS_WORLDS} from '../apps/codex-stage/sports-ten/worlds.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const shot=(s,end)=>({type:'shot',start:{x:s.ball.x,y:s.ball.y},end});

// These planners see snapshots only. All replay actions use the public player input API.
export function pocketShot(s){
  const candidates=[];
  for(const b of s.balls.filter(b=>!b.potted))for(const p of s.pockets){const d=Math.hypot(p.x-b.x,p.y-b.y),gx=b.x-(p.x-b.x)/d*27.4,gy=b.y-(p.y-b.y)/d*27.4,a=Math.atan2(gy-s.ball.y,gx-s.ball.x);for(const tweak of [-.03,-.012,0,.012,.03])for(const power of [3,5,7,10,13])candidates.push([a+tweak,power]);}
  let best={score:-Infinity,end:{x:s.ball.x-100,y:s.ball.y}};
  for(const [a,power] of candidates){
    const end={x:clamp(s.ball.x-Math.cos(a)*power/.075,5,955),y:clamp(s.ball.y-Math.sin(a)*power/.075,70,620)},dx=s.ball.x-end.x,dy=s.ball.y-end.y;
    const e=M.Engine.create({gravity:{y:0}}),opts={friction:0,frictionAir:.009,restitution:.93,inertia:Infinity},cue=M.Bodies.circle(s.ball.x,s.ball.y,14,{...opts,angle:s.ball.angle}),balls=s.balls.filter(b=>!b.potted).map(b=>M.Bodies.circle(b.x,b.y,14,{...opts,angle:b.angle}));[cue,...balls].forEach(b=>M.Body.setMass(b,1));
    M.Composite.add(e.world,[cue,...balls,...s.rails.map(r=>M.Bodies.rectangle(...r,{isStatic:true,restitution:.92,friction:0}))]);M.Body.setVelocity(cue,{x:dx*.075,y:dy*.075});let points=0,scratch=false;
    for(let i=0;i<760;i++){M.Engine.update(e,1000/120);for(let j=balls.length-1;j>=0;j--)if(s.pockets.some(p=>Math.hypot(p.x-balls[j].position.x,p.y-balls[j].position.y)<25)){M.Composite.remove(e.world,balls[j]);balls.splice(j,1);points++;}if(!scratch&&s.pockets.some(p=>Math.hypot(p.x-cue.position.x,p.y-cue.position.y)<25)){scratch=true;M.Body.setStatic(cue,true);}if([cue,...balls].every(b=>Math.hypot(b.velocity.x,b.velocity.y)<.15))break;}
    const near=balls.length?Math.min(...balls.flatMap(b=>s.pockets.map(p=>Math.hypot(p.x-b.position.x,p.y-b.position.y)))):0,score=points*1000-(scratch?650:0)-near*.05;
    M.Composite.clear(e.world,false);M.Engine.clear(e);if(score>best.score)best={score,end};
  }
  return best.end;
}

function kickShot(s){
  let best=null;
  for(let dx=-76;dx<=76;dx+=4){
    const end={x:480+dx,y:620},len=Math.hypot(dx,85),v=Math.min(15,len*.16),spin=clamp(dx*.000001,-.00006,.00006),e=M.Engine.create({gravity:{y:0}}),ball=M.Bodies.circle(480,535,13,{friction:0,frictionAir:0,restitution:.6}),keeper=M.Bodies.rectangle(s.keeper.x,155,s.keeper.w,24,{isStatic:true,restitution:.9});M.Body.setMass(ball,1);
    M.Composite.add(e.world,[ball,keeper,...s.wall.map(p=>M.Bodies.circle(p.x,p.y,22,{isStatic:true,restitution:.8,friction:0})),...[[340,89,16,100],[620,89,16,100]].map(p=>M.Bodies.rectangle(...p,{isStatic:true}))]);M.Body.setVelocity(ball,{x:-dx/len*v,y:-85/len*v});let good=false,margin=0;
    for(let i=1;i<385;i++){const t=s.time+i/120;M.Body.setPosition(keeper,{x:480+Math.sin(t*(1.4+s.stage*.25))*[84,100,118][s.stage],y:155});M.Body.applyForce(ball,ball.position,{x:-ball.velocity.y*spin,y:ball.velocity.x*spin});M.Engine.update(e,1000/120);if(ball.position.y<103){good=ball.position.x>358&&ball.position.x<602;margin=Math.min(ball.position.x-358,602-ball.position.x);break;}if(ball.velocity.y>1.5||ball.position.y>605||ball.position.x<60||ball.position.x>900)break;}
    M.Composite.clear(e.world,false);M.Engine.clear(e);if(good&&(!best||margin>best.margin))best={end,margin};
  }
  return best?.end;
}
export function sportsCommand(s){
  if(s.phase!=='playing')return null;
  if(s.id==='pocket-six'&&!s.moving)return shot(s,pocketShot(s));
  if(s.id==='roof-hoops'&&s.mode==='aim'){const t=1.14,x=720+Math.sin((s.time+t)*.65)*s.stage*25,y=300-s.stage*15,vx=(x-210)/(60*t),vy=(y-480-.5*800*t*t)/(60*t)-.06;return shot(s,{x:210-vx/.085,y:480-vy/.085});}
  if(s.id==='curve-kick'&&s.mode==='aim'){const end=kickShot(s);return end?shot(s,end):null;}
  if(s.id==='lawn-rally'){
    if(s.mode!=='rally'||s.ball.vy<=0)return {type:'move',point:{x:480,y:526}};
    const x=s.ball.x+s.ball.vx*Math.max(0,(507-s.ball.y)/s.ball.vy),desired=s.opponent.x<480?730:230,offset=clamp((desired-x)/360*(8.1+s.stage*.45),-6,6)*(s.player.w/2)/7;
    return {type:'move',point:{x:x-offset,y:526}};
  }
  if(s.id==='table-spin'&&s.mode==='flight'&&!s.hit&&s.ball.vx<0&&s.ball.x<253&&s.swing===0)return {type:'down'};
  if(s.id==='pin-strike'&&s.mode==='aim'){const left=s.pins.filter(p=>!p.fallen),x=left.reduce((n,p)=>n+p.x,0)/left.length+8;return shot(s,{x:480-(x-480)/3.2,y:624});}
  if(s.id==='ice-stone'&&s.mode==='aim')return !s.held?{type:'down'}:s.charge>=[.58,s.throws===3?.75:.60,s.throws===3?.77:.60][s.stage]?{type:'up'}:null;
  if(s.id==='domino-bridge'&&s.mode==='aim')return !s.held?{type:'down'}:Math.abs(s.bridge.x-500)<3?{type:'up'}:null;
  if(s.id==='plate-parade'){const falling=s.plates.find(p=>p.vy>1&&p.y<450),rest=s.plates.filter(p=>p.y>300&&Math.abs(p.vy)<.7),top=rest.at(-1);let x=falling?.x??s.tray.x;if(top)x=s.tray.x+(falling?falling.x-top.x:0)*.4;return {type:'move',point:{x,y:548}};}
  if(s.id==='crush-hour'){const target=s.items.find(i=>i.x>355&&i.x<645),hold=Boolean(target&&target.kind!=='battery');return hold!==s.held?{type:hold?'down':'up'}:null;}
  return null;
}
export function applySports(w,c){if(!c)return;if(c.type==='shot'){w.down(c.start);w.move(c.end);w.up(c.end);}else w[c.type](c.point);}
export function playSports(id,maxSeconds=160){const w=SPORTS_WORLDS[id](),stages=[];
  for(let i=0;i<maxSeconds*120;i++){const s=w.snapshot();if(!stages.includes(s.stage))stages.push(s.stage);if(['won','lost'].includes(s.phase)){w.destroy();return {snapshot:s,stages};}if(s.phase==='ready')w.begin();else if(s.phase==='cleared')w.next();else applySports(w,sportsCommand(s));w.step(1000/120);}
  const snapshot=w.snapshot();w.destroy();return {snapshot,stages};
}
