import {Matter as M} from '../vendor/matter.js';
import {createSportsKit} from './physics.js';

export function createPlateWorld(options={}){
  const q=createSportsKit('plate-parade',options,.0009),{k,s,api,box,body,clamp}=q;
  let tray,plates=[],target=480,spawn=0,clock=0,stable=0;
  const goal=()=>5+s.stage,nextX=()=>480+Math.sin(spawn*1.72+s.stage*.25)*[52,63,72][s.stage];
  function reset(){target=480;plates=[];spawn=0;clock=.8;stable=0;tray=box(480,548,158-s.stage*8,18,{isStatic:true,friction:1});s.notice='接住这一摞，别让盘子滑走';}
  q.bind({reset,restoreCompleted(){spawn=goal();for(let i=0;i<goal();i++)plates.push({id:i,b:box(480,530-i*16,102,15,{chamfer:{radius:5}})});s.score=spawn*100;s.notice='稳稳上菜';},tick(dt){
    const dx=clamp(target-tray.position.x,-210*dt,210*dt);M.Body.setPosition(tray,{x:tray.position.x+dx,y:548});
    clock-=dt;if(spawn<goal()&&clock<=0){plates.push({id:spawn,b:box(nextX(),135,102-s.stage*4,15,{friction:.85,restitution:.015,frictionAir:.006,chamfer:{radius:5}})});spawn++;clock=1.75;k.event('launch');}
    // Transport touching plates with the moving support; airborne plates still use free physics.
    for(const p of plates){if(p.b.position.y>300&&Math.abs(p.b.velocity.y)<.7){const contact=M.Collision.collides(p.b,tray)||plates.some(o=>o!==p&&o.b.position.y>p.b.position.y&&M.Collision.collides(p.b,o.b));if(contact)M.Body.setPosition(p.b,{x:p.b.position.x+dx,y:p.b.position.y});}}
    q.step(dt);s.score=plates.filter(p=>p.b.position.y>320&&Math.abs(p.b.velocity.y)<.7).length*100;
    if(plates.some(p=>p.b.position.y>615||p.b.position.x<60||p.b.position.x>900)){k.finish(false,'盘子哗啦啦');return;}
    if(spawn===goal()&&plates.every(p=>Math.abs(p.b.velocity.y)<.4&&Math.abs(p.b.angle)<.3&&p.b.position.y>300)){stable+=dt;if(stable>.65)k.finish(true,'稳稳上菜');}else stable=0;
    if(s.time>25)k.finish(false,'盘子还没站稳');
  },read(){return {tray:{...body(tray),w:158-s.stage*8},plates:plates.map(p=>({id:p.id,...body(p.b)})),nextX:nextX(),spawn,clock,stable,controlPoint:{x:target,y:548},progress:s.score/100,goal:goal()};}});
  api.move=p=>k.input(()=>{if(p)target=clamp(p.x,190,770);},p);api.down=p=>{const ok=api.move(p);if(ok)s.held=true;return ok;};return api;
}
