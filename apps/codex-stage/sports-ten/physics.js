import {Matter as M} from '../vendor/matter.js';
import {createFiveKernel} from '../arcade-five/kernel.js';

export function createSportsKit(id,options={},gravity=0){
  const k=createFiveKernel(id,options),engine=M.Engine.create({gravity:{y:gravity?1:0,scale:gravity}}),{s,api}=k;
  const add=b=>(M.Composite.add(engine.world,b),b);
  const circle=(x,y,r,opts={})=>add(M.Bodies.circle(x,y,r,{friction:0,frictionAir:0,restitution:.75,...opts}));
  const box=(x,y,w,h,opts={})=>add(M.Bodies.rectangle(x,y,w,h,{friction:.4,...opts}));
  const body=b=>({x:b.position.x,y:b.position.y,vx:b.velocity.x,vy:b.velocity.y,angle:b.angle});
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function aim(b,p,scale=.075,limit=16){const dx=b.position.x-p.x,dy=b.position.y-p.y,len=Math.hypot(dx,dy),speed=Math.min(limit,len*scale);return len<12?null:{x:dx/len*speed,y:dy/len*speed};}
  const clear=()=>{M.Composite.clear(engine.world,false);M.Engine.clear(engine);};
  let lastImpact=-1;
  M.Events.on(engine,'collisionStart',({pairs})=>{
    if(s.phase!=='playing'||s.time-lastImpact<.07)return;
    const moving=pairs.some(({bodyA:a,bodyB:b})=>Math.hypot(a.velocity.x-b.velocity.x,a.velocity.y-b.velocity.y)>2);
    if(moving){lastImpact=s.time;k.event('impact');}
  });
  function bind(hooks){k.configure({...hooks,reset(){clear();lastImpact=-1;hooks.reset();},dispose(){clear();M.Events.off(engine);}});}
  api.down=p=>k.input(()=>{s.held=true;},p);api.up=p=>k.input(()=>{s.held=false;},p);api.move=p=>k.input(()=>{},p);
  return {k,s,api,engine,add,circle,box,body,clamp,aim,bind,step:dt=>M.Engine.update(engine,dt*1000),remove:b=>M.Composite.remove(engine.world,b)};
}
