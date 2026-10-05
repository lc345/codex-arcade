import {Matter as M} from '../vendor/matter.js';
import {createSportsKit} from './physics.js';

export function createKickWorld(options={}){
  const q=createSportsKit('curve-kick',options),{k,s,api,circle,box,body}=q;
  let ball,keeper,wall=[],mode='aim',aim=null,spin=0,shots=7,made=0,cooldown=0,flight=0,trail=[];
  const launch={x:480,y:535},keeperX=t=>480+Math.sin(t*(1.4+s.stage*.25))*[84,100,118][s.stage];
  function serve(){if(ball)q.remove(ball);ball=circle(launch.x,launch.y,13,{restitution:.6});M.Body.setMass(ball,1);mode='aim';flight=0;trail=[];}
  function reset(){shots=7;made=0;spin=0;aim=null;cooldown=0;ball=null;wall=[{x:460,y:315},{x:515,y:315},...(s.stage?[{x:575,y:355}]:[])].map(p=>({...p,b:circle(p.x,p.y,22,{isStatic:true,restitution:.8})}));keeper=box(480,155,66-s.stage*4,24,{isStatic:true,restitution:.9});box(340,89,16,100,{isStatic:true});box(620,89,16,100,{isStatic:true});serve();s.notice='绕过人墙，三次破门';}
  function resolve(ok){mode='settle';cooldown=.7;if(ok){made++;s.score+=100;k.event('catch',{x:ball.position.x,y:98});s.notice='破门';if(made===3)k.finish(true,'帽子戏法');}else{k.event('miss');s.notice='被挡住了';}if(shots===0&&made<3)k.finish(false,'下一次踢得更刁钻');}
  q.bind({reset,clear(){aim=null;},restoreCompleted(){made=3;mode='settle';s.score=300;M.Body.setPosition(ball,{x:480,y:83});s.notice='帽子戏法';},tick(dt){M.Body.setPosition(keeper,{x:keeperX(s.time),y:155});if(mode==='settle'){cooldown-=dt;if(cooldown<=0)serve();return;}if(mode!=='flight')return;flight+=dt;
    M.Body.applyForce(ball,ball.position,{x:-ball.velocity.y*spin,y:ball.velocity.x*spin});q.step(dt);trail.push(body(ball));if(trail.length>30)trail.shift();
    if(ball.position.y<103){resolve(ball.position.x>358&&ball.position.x<602);return;}
    if(ball.position.y>605||ball.position.x<60||ball.position.x>900||flight>3.2||ball.velocity.y>1.5)resolve(false);
  },read(){return {ball:body(ball),launch,keeper:{...body(keeper),w:66-s.stage*4},wall:wall.map(p=>({x:p.x,y:p.y,r:22})),aim:aim?{...aim}:null,spin,shots,made,mode,flight,trail:trail.map(t=>({...t})),progress:made,goal:3};}});
  api.down=p=>k.input(()=>{if(mode!=='aim')return false;s.held=true;aim=p||{x:480,y:660};},p);api.move=p=>k.input(()=>{if(s.held&&p)aim={...p};},p);
  api.up=p=>k.input(()=>{if(!s.held||mode!=='aim')return false;s.held=false;const end=p||aim,v=q.aim(ball,end,.16,15);aim=null;if(!v||v.y>=-2)return false;spin=q.clamp((end.x-launch.x)*.000001,-.00006,.00006);M.Body.setStatic(ball,false);M.Body.setMass(ball,1);M.Body.setVelocity(ball,v);shots--;mode='flight';flight=0;k.event('launch');},p);return api;
}
