import {EXTREME_WORLDS} from '../apps/codex-stage/extreme-six/worlds.js';
import {extremeRules} from '../apps/codex-stage/extreme-six/rules.js';
const {waveY,dashNode,sliderPoint}=extremeRules();
export function extremeCommand(s,m={}){
  if(m.stage!==s.stage){const stepMs=m.stepMs;for(const key of Object.keys(m))delete m[key];m.stage=s.stage;m.stepMs=stepMs||16;}
  if(s.id==='razor-wings'){
    const dt=m.stepMs/1000;
    function score(x,y,depth){if(!depth)return Math.abs(y-waveY(s.points,x));return Math.min(...[-1,1].map(sign=>{let worst=0;for(let i=1;i<=4;i++){const t=dt*i/4;worst=Math.max(worst,Math.abs(y+sign*s.speed*1.24*t-waveY(s.points,x+s.speed*t)));}return Math.max(worst,score(x+s.speed*dt,y+sign*s.speed*1.24*dt,depth-1));}));}
    const options=[true,false].map(held=>{let worst=0;for(let i=1;i<=4;i++){const t=dt*i/4;worst=Math.max(worst,Math.abs(s.player.y+(held?-1:1)*s.speed*1.24*t-waveY(s.points,s.player.x+s.speed*t)));}return {held,cost:Math.max(worst,score(s.player.x+s.speed*dt,s.player.y+(held?-1:1)*s.speed*1.24*dt,3))};});
    const held=options.sort((a,b)=>a.cost-b.cost)[0].held;
    if(held!==s.held)return {type:held?'down':'up'};
  }
  if(s.id==='wall-rebound'&&s.mode==='wall'){
    if(!s.held)return {type:'down'};
    const n=s.grips[s.progress+1],t=Math.ceil(480/620*120)/120;
    const needed=((s.player.y-n.y+600*t*(t+1/120))/t-420)/440;
    if(s.charge>=needed-m.stepMs/2000)return {type:'up'};
  }
  if(s.id==='twin-helix'){const n=s.bars.find(b=>!b.done);if(n)return {type:'move',point:{x:100+n.angle/(Math.PI/2)*760,y:400}};}
  if(s.id==='dash-stitch'&&s.mode==='dock'){
    const n=s.nodes[s.progress+1];let target=dashNode(n,s.time+.23);
    for(let i=0;i<4;i++)target=dashNode(n,s.time+Math.hypot(target.x-s.player.x,target.y-s.player.y)/s.speed);
    const flight=Math.hypot(target.x-s.player.x,target.y-s.player.y)/s.speed,mid=(s.player.y+target.y)/2,gate=(dashNode(s.nodes[s.progress],s.time+flight/2).y+dashNode(n,s.time+flight/2).y)/2;
    if(Math.abs(mid-gate)<s.aperture/2-9)return {type:'tap',point:{x:target.x-s.camera,y:target.y}};
  }
  if(s.id==='cursor-overdrive'){
    const n=s.notes[s.progress];if(!n)return null;
    if(s.sliding)return {type:'move',point:sliderPoint(n,(s.time-s.slideAt+m.stepMs/2000+1/240)/n.duration)};
    if(s.held)return {type:'up'};
    if(s.time>=n.at&&s.time<=n.at+s.window)return {type:n.slider?'down':'tap',point:n.a};
  }
  if(s.id==='recoil-pilot'){
    const n=s.ports[s.progress+1];if(!n)return null;
    const dx=n.x-s.player.x,dy=n.y-s.player.y,d=Math.hypot(dx,dy),v=Math.hypot(s.velocity.x,s.velocity.y);
    if(!s.flying)return {type:'tap',point:{x:s.player.x-dx/d*75,y:s.player.y-dy/d*75}};
    if(d<s.portRadius*.65&&v>20)return {type:'tap',point:{x:s.player.x+s.velocity.x/v*75,y:s.player.y+s.velocity.y/v*75}};
  }
  return null;
}
export function playExtreme(id,{stepMs=16}={}){
  const w=EXTREME_WORLDS[id](),m={stepMs};w.begin();
  for(let i=0;i<40000;i++){
    const s=w.snapshot();if(['lost','won'].includes(s.phase)){w.destroy();return s;}
    if(s.phase==='cleared'){w.next();w.begin();continue;}
    const cmd=extremeCommand(s,m),p=cmd?.point||{x:480,y:320};
    if(cmd?.type==='tap'){w.down(p);w.up(p);}else if(cmd?.type==='down')w.down(p);else if(cmd?.type==='up')w.up(p);else if(cmd?.type==='move')w.move(p);
    w.step(stepMs);
  }
  const result=w.snapshot();w.destroy();return result;
}
