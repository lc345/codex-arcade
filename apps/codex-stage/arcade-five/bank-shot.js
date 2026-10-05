import {Matter as M} from '../vendor/matter.js';
import {createFiveKernel} from './kernel.js';

export function createBankWorld(options={}){
  const k=createFiveKernel('bank-shot',options),{s,api}=k,engine=M.Engine.create({gravity:{y:0}});
  const layouts=[[[440,240],[540,240],[640,240],[580,420],[700,420]],[[450,170],[610,170],[735,265],[620,440],[420,465],[300,305]],[[340,170],[510,180],[725,185],[740,430],[565,420],[390,430],[265,300]]];
  let ball,targets=[],walls=[],obstacles=[],shots=4,aim=null,moving=false,shotTime=0,trail=[];
  function reset(){M.Composite.clear(engine.world,false);M.Engine.clear(engine);shots=4;aim=null;moving=false;shotTime=0;trail=[];
    ball=M.Bodies.circle(210,430,15,{frictionAir:.006,friction:0,restitution:1});M.Body.setMass(ball,1);
    walls=[[480,92,780,20],[480,552,780,20],[88,322,20,480],[872,322,20,480]].map(v=>M.Bodies.rectangle(...v,{isStatic:true,restitution:1,friction:0}));
    targets=layouts[s.stage].map(([x,y],i)=>({id:i,x,y,hit:false,body:M.Bodies.circle(x,y,22,{isStatic:true,restitution:.96,friction:0})}));
    obstacles=s.stage===0?[]:[M.Bodies.rectangle(482,320,s.stage===1?140:90,22,{isStatic:true,angle:s.stage===1?-.35:.4,restitution:1,friction:0})];
    M.Composite.add(engine.world,[ball,...walls,...targets.map(t=>t.body),...obstacles]);s.notice='四杆清台';
  }
  k.configure({reset,restoreCompleted(){for(const t of targets){t.hit=true;M.Composite.remove(engine.world,t.body);}s.score=targets.length*100;s.notice='这一杆，漂亮';},clear(){aim=null;},dispose(){M.Composite.clear(engine.world,false);M.Engine.clear(engine);},tick(dt){
    if(!moving)return;shotTime+=dt;M.Engine.update(engine,dt*1000);trail.push({x:ball.position.x,y:ball.position.y});if(trail.length>22)trail.shift();
    for(const t of targets)if(!t.hit&&M.Collision.collides(ball,t.body)&&Math.hypot(ball.velocity.x,ball.velocity.y)>1){t.hit=true;M.Composite.remove(engine.world,t.body);s.score+=100;k.event('break',{x:t.x,y:t.y});}
    if(targets.every(t=>t.hit)){k.finish(true,'这一杆，漂亮');return;}
    if(Math.hypot(ball.velocity.x,ball.velocity.y)<.6||shotTime>5.5){moving=false;M.Body.setVelocity(ball,{x:0,y:0});trail=[];if(shots===0)k.finish(false,'还差一点');}
  },read(){return {ball:{x:ball.position.x,y:ball.position.y,vx:ball.velocity.x,vy:ball.velocity.y},targets:targets.map(({id,x,y,hit})=>({id,x,y,hit})),obstacles:obstacles.map(b=>({x:b.position.x,y:b.position.y,angle:b.angle,w:s.stage===1?140:90,h:22})),shots,aim:aim?{...aim}:null,moving,shotTime,trail:trail.map(p=>({...p})),progress:targets.filter(t=>t.hit).length,goal:targets.length};}});
  api.down=p=>k.input(()=>{if(moving||shots===0)return false;s.held=true;aim=p?{x:p.x,y:p.y}:{x:ball.position.x-120,y:ball.position.y};},p);
  api.move=p=>k.input(()=>{if(s.held&&p)aim={x:p.x,y:p.y};},p);
  api.up=p=>k.input(()=>{if(!s.held||moving)return false;s.held=false;const target=p||aim,dx=ball.position.x-target.x,dy=ball.position.y-target.y,len=Math.hypot(dx,dy);aim=null;if(len<12)return false;
    const speed=Math.min(16,6+len*.055);M.Body.setVelocity(ball,{x:dx/len*speed,y:dy/len*speed});shots--;moving=true;shotTime=0;k.event('launch',{power:speed/16});
  },p);
  return api;
}
