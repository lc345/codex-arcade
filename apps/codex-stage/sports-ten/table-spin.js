import {Matter as M} from '../vendor/matter.js';
import {createSportsKit} from './physics.js';

export function createPingWorld(options={}){
  const q=createSportsKit('table-spin',options,.0005),{k,s,api,circle,box,body}=q;
  let ball,table,net,bat,mode='serve',cooldown=.7,swing=0,returns=0,lives=3,hit=false,trail=[],flight=0;
  const goal=()=>4+s.stage;
  function feed(){if(ball)q.remove(ball);ball=circle(760,344+(returns%2)*12,9,{restitution:.88});M.Body.setVelocity(ball,{x:-7.2-s.stage*.25,y:-5});mode='flight';hit=false;flight=0;trail=[];}
  function reset(){returns=0;lives=3;swing=0;cooldown=.7;mode='serve';hit=false;ball=circle(760,344,9,{isStatic:true});table=box(480,484,650,20,{isStatic:true,restitution:.88});net=box(480,423-s.stage*5,8,102+s.stage*10,{isStatic:true,restitution:.15});bat=box(187,375,15,156,{isStatic:true,restitution:1,collisionFilter:{mask:0}});s.notice='看准来球，轻点挥拍';}
  function resolve(success){mode='serve';cooldown=.65;M.Body.setVelocity(ball,{x:0,y:0});if(success){returns++;s.score+=100;k.event('catch',{x:ball.position.x,y:470});s.notice='压到对面台面';if(returns===goal())k.finish(true,'接杀训练完成');}else{lives--;k.event('miss');s.notice='这一板没接稳';if(lives===0)k.finish(false,'来球太快，再试一次');}}
  q.bind({reset,clear(){swing=0;bat.collisionFilter.mask=0;},restoreCompleted(){returns=goal();s.score=returns*100;s.notice='接杀训练完成';},tick(dt){
    swing=Math.max(0,swing-dt);bat.collisionFilter.mask=swing>0?0xffffffff:0;M.Body.setPosition(bat,{x:187+(swing>0?Math.sin((.22-swing)/.22*Math.PI)*25:0),y:375});
    if(mode==='serve'){cooldown-=dt;if(cooldown<=0)feed();return;}const vy=ball.velocity.y,vx=ball.velocity.x;flight+=dt;q.step(dt);trail.push(body(ball));if(trail.length>20)trail.shift();
    if(!hit&&swing>0&&vx<0&&M.Collision.collides(ball,bat)){hit=true;M.Body.setVelocity(ball,{x:7+s.stage*.12,y:-3.6-s.stage*.15});M.Body.setAngularVelocity(ball,.2);k.event('launch');s.notice='回球';}
    if(hit&&vy>0&&ball.position.x>512&&ball.position.x<805&&M.Collision.collides(ball,table)){resolve(true);return;}
    if(ball.position.x<130||ball.position.x>860||ball.position.y>585||flight>4)resolve(false);
  },read(){return {ball:body(ball),bat:body(bat),netTop:372-s.stage*10,swing,returns,lives,mode,hit,flight,trail:trail.map(t=>({...t})),progress:returns,goal:goal()};}});
  api.down=p=>k.input(()=>{if(mode!=='flight'||swing>0)return false;swing=.22;k.event('break');},p);return api;
}
