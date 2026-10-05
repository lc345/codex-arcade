import {Matter as M} from '../vendor/matter.js';
import {createSportsKit} from './physics.js';

export function createTennisWorld(options={}){
  const q=createSportsKit('lawn-rally',options),{k,s,api,box,circle,body,clamp}=q;
  let ball,player,opponent,target=480,points=0,enemy=0,hits=0,last='opponent',cooldown=1,mode='serve',trail=[];
  function serve(){M.Body.setPosition(ball,{x:480,y:172});M.Body.setVelocity(ball,{x:Math.sin(points*2+enemy+1)*2.2,y:6.3+s.stage*.55});last='opponent';hits=0;mode='rally';trail=[];}
  function reset(){target=480;points=enemy=hits=0;cooldown=.7;mode='serve';trail=[];player=box(480,526,88-s.stage*8,18,{isStatic:true,restitution:1,friction:0});opponent=box(480,132,82-s.stage*4,18,{isStatic:true,restitution:1,friction:0});ball=circle(480,172,10,{restitution:1});s.notice='移动球拍，抢下三分';}
  function point(won){if(won){points++;s.score=points*100;k.event('catch',{x:ball.position.x,y:130});s.notice='对手没接到';}else{enemy++;k.event('miss');s.notice='下一球，先站到落点';}mode='serve';cooldown=.75;M.Body.setVelocity(ball,{x:0,y:0});if(points===3)k.finish(true,'这一盘拿下');else if(enemy===3)k.finish(false,'被对手拿下这一盘');}
  q.bind({reset,restoreCompleted(){points=3;s.score=300;s.notice='这一盘拿下';},tick(dt){
    const oldX=player.position.x;M.Body.setPosition(player,{x:oldX+clamp(target-oldX,-900*dt,900*dt),y:526});
    const aiTarget=mode==='rally'&&ball.velocity.y<0?ball.position.x:480,aiSpeed=155+s.stage*30;M.Body.setPosition(opponent,{x:clamp(opponent.position.x+clamp(aiTarget-opponent.position.x,-aiSpeed*dt,aiSpeed*dt),208,752),y:132});
    if(mode==='serve'){cooldown-=dt;if(cooldown<=0)serve();return;}
    const vy=ball.velocity.y;q.step(dt);trail.push(body(ball));if(trail.length>18)trail.shift();
    if(vy>0&&M.Collision.collides(ball,player)){hits++;last='player';const offset=(ball.position.x-player.position.x)/(44-s.stage*4);M.Body.setVelocity(ball,{x:clamp(offset*7+(player.position.x-oldX)*.2,-7.8,7.8),y:-8.1-s.stage*.45});k.event('launch');}
    if(vy<0&&M.Collision.collides(ball,opponent)){last='opponent';const destination=player.position.x<480?700:260;M.Body.setVelocity(ball,{x:clamp((destination-ball.position.x)/57,-6,6),y:7.1+s.stage*.5});k.event('break');}
    if(ball.position.y<90)point(true);else if(ball.position.y>582)point(false);else if(ball.position.x<165||ball.position.x>795)point(last==='opponent');
  },read(){return {ball:body(ball),player:{...body(player),w:88-s.stage*8},opponent:{...body(opponent),w:82-s.stage*4},controlPoint:{x:target,y:526},points,enemy,hits,mode,last,trail:trail.map(t=>({...t})),progress:points,goal:3};}});
  const move=p=>k.input(()=>{if(p)target=clamp(p.x,205,755);},p);api.move=move;api.down=p=>{const ok=move(p);if(ok)s.held=true;return ok;};return api;
}
