import {Matter as M} from '../vendor/matter.js';
import {createFiveKernel} from './kernel.js';

export function createPanWorld(options={}){
  const k=createFiveKernel('pan-flip',options),{s,api}=k,engine=M.Engine.create({gravity:{y:1,scale:.0008}});
  let food,pan,charge=0,cook=[0,0],side=0,airborne=false,flips=0,landed=0,panWidth=180;
  function setup(){M.Composite.clear(engine.world,false);M.Engine.clear(engine);panWidth=180-s.stage*18;charge=0;cook=[0,0];side=0;airborne=false;flips=0;landed=0;
    pan=M.Bodies.rectangle(480,509,panWidth,18,{isStatic:true,friction:.6});food=M.Bodies.rectangle(480,488,96-s.stage*5,13,{frictionAir:0,restitution:0,friction:.5});M.Body.setMass(food,1);M.Composite.add(engine.world,[pan,food]);s.notice='两面金黄';
  }
  k.configure({reset:setup,clear(){charge=0;},dispose(){M.Composite.clear(engine.world,false);M.Engine.clear(engine);},
    restoreCompleted(){cook=[.85,.85];flips=1;s.score=342;s.notice='两面刚刚好';},
    tick(dt){
      if(s.held&&!airborne)charge=Math.min(1.25,charge+dt);
      M.Engine.update(engine,dt*1000);
      const contact=M.Collision.collides(food,pan);
      if(airborne&&food.velocity.y>0&&contact){const a=Math.atan2(Math.sin(food.angle),Math.cos(food.angle));
        if(Math.min(Math.abs(a),Math.abs(Math.PI-Math.abs(a)))>.64){k.finish(false,'落歪了');return;}
        side=Math.cos(a)<0?1:0;M.Body.setAngle(food,side*Math.PI);M.Body.setAngularVelocity(food,0);M.Body.setVelocity(food,{x:0,y:0});airborne=false;landed=s.time;flips++;k.event('catch',{x:food.position.x,y:492});
      }
      if(!airborne&&contact){cook[side]+=dt/(2.7-s.stage*.3);if(cook[side]>1.27){k.finish(false,'这一面焦了');return;}
        if(cook.every(v=>v>=.72)){s.score=300+Math.round((1.27-Math.max(...cook))*100);k.finish(true,'两面刚刚好');}}
      if(food.position.y>610||Math.abs(food.position.x-480)>panWidth*.9){k.finish(false,'飞出锅了');return;}
      if(s.time>24)k.finish(false,'厨房打烊');
    },
    read(){return {food:{x:food.position.x,y:food.position.y,angle:food.angle,vx:food.velocity.x,vy:food.velocity.y},charge,cook:[...cook],side,airborne,flips,landed,panWidth,progress:Math.min(...cook),goal:.72,remaining:Math.max(0,24-s.time)};},
  });
  api.down=p=>k.input(()=>{if(airborne)return false;s.held=true;charge=0;},p);
  api.move=p=>k.input(()=>{},p);
  api.up=p=>k.input(()=>{if(!s.held)return false;s.held=false;if(airborne)return false;const power=Math.min(1.2,charge);charge=0;if(power<.08)return false;
    const velocity=7+power*7;M.Body.setPosition(food,{x:food.position.x,y:485});M.Body.setVelocity(food,{x:(power-.52)*2.4,y:-velocity});M.Body.setAngularVelocity(food,.005+power*.048);airborne=true;k.event('launch',{power});
  },p);
  return api;
}
