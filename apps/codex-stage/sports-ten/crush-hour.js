import {Matter as M} from '../vendor/matter.js';
import {createSportsKit} from './physics.js';

export function createCrushWorld(options={}){
  const q=createSportsKit('crush-hour',options,.001),{k,s,api,box,body,circle}=q;
  let press,items=[],debris=[],serial=0,spawn=.5,crushed=0,errors=0,missed=0,pressY=300;
  const goal=()=>6+s.stage,speed=()=>2.65+s.stage*.3;
  function reset(){items=[];debris=[];serial=0;spawn=.5;crushed=errors=missed=0;pressY=300;box(480,539,1060,24,{isStatic:true,friction:.1});press=box(570,300,118,70,{isStatic:true});s.notice='压碎废品，让红色电池通过';}
  function shatter(item){item.done=true;q.remove(item.b);const bad=item.kind==='battery';if(bad){errors++;k.event('hit',{x:570,y:480});s.notice='电池不能压';}else{crushed++;s.score+=100;k.event('break',{x:570,y:480});s.notice='压成小块';}
    for(let i=0;i<6;i++){const b=box(item.b.position.x+(i%3-1)*13,480-Math.floor(i/3)*16,12,12,{restitution:.55,frictionAir:.02});M.Body.setVelocity(b,{x:(i-2.5)*2,y:-3-(i%2)*2});debris.push({b,life:1.5,bad});}}
  q.bind({reset,restoreCompleted(){crushed=goal();s.score=crushed*100;s.notice='回收完成';},tick(dt){
    pressY=q.clamp(pressY+(s.held?320:-440)*dt,300,486);M.Body.setPosition(press,{x:570,y:pressY});spawn-=dt;
    if(spawn<=0){const kind=serial%4===2?'battery':serial%3===0?'metal':'box';items.push({id:serial++,kind,b:box(40,490,44,62,{restitution:.05,friction:.02,inertia:Infinity}),done:false,pressure:0});spawn=1.45-s.stage*.12;}
    for(const item of items){if(item.done)continue;M.Body.setVelocity(item.b,{x:speed(),y:item.b.velocity.y});
      if(s.held&&pressY+35>471&&Math.abs(item.b.position.x-570)<100&&M.Collision.collides(item.b,press)){item.pressure+=dt;if(item.pressure>(item.kind==='metal'?.12:.025))shatter(item);}
      if(item.b.position.x>950){item.done=true;q.remove(item.b);if(item.kind!=='battery'){missed++;k.event('miss');s.notice='漏掉了一件废品';}}
    }
    q.step(dt);for(const d of debris){d.life-=dt;if(d.life<=0)q.remove(d.b);}debris=debris.filter(d=>d.life>0);items=items.filter(i=>!i.done);
    if(errors>0)k.finish(false,'压到电池，紧急停机');else if(missed>=3)k.finish(false,'漏件太多，这班先下工');else if(crushed>=goal())k.finish(true,'回收完成');else if(s.time>40)k.finish(false,'回收线超时');
  },read(){return {press:{x:570,y:pressY},items:items.map(i=>({id:i.id,kind:i.kind,...body(i.b),pressure:i.pressure})),debris:debris.map(d=>({...body(d.b),life:d.life,bad:d.bad})),crushed,errors,missed,speed:speed(),progress:crushed,goal:goal()};}});return api;
}
