import {Matter as M} from '../vendor/matter.js';
import {createSportsKit} from './physics.js';

export function createHoopsWorld(options={}){
  const q=createSportsKit('roof-hoops',options,.0008),{k,s,api,circle,box,body}=q;
  let ball,rims=[],board,aim=null,mode='aim',shots=6,made=0,cooldown=0,flight=0,hoop={x:720,y:300},trail=[];
  const launch={x:210,y:480};
  function place(){hoop={x:720+(s.stage?Math.sin(s.time*.65)*s.stage*25:0),y:300-s.stage*15};rims.forEach((r,i)=>M.Body.setPosition(r,{x:hoop.x+(i?42:-42),y:hoop.y}));M.Body.setPosition(board,{x:hoop.x+62,y:hoop.y-49});}
  function serve(){if(ball)q.remove(ball);ball=circle(launch.x,launch.y,15,{restitution:.65});mode='aim';trail=[];flight=0;}
  function reset(){shots=6;made=0;aim=null;cooldown=0;ball=null;rims=[circle(678,300,6,{isStatic:true}),circle(762,300,6,{isStatic:true})];board=box(782,245,12,126,{isStatic:true,restitution:.85});box(480,612,960,24,{isStatic:true});serve();place();s.notice='六次出手，命中三球';}
  function settle(success){mode='settle';cooldown=.7;if(success){made++;s.score+=100;k.event('catch',{x:hoop.x,y:hoop.y});s.notice='空心入网';if(made===3)k.finish(true,'三球命中');}else{k.event('miss');s.notice='差一点，调整力度';}if(mode==='settle'&&shots===0&&made<3)k.finish(false,'今天的手感还差一点');}
  q.bind({reset,clear(){aim=null;},restoreCompleted(){made=3;s.score=300;mode='settle';M.Body.setPosition(ball,{x:hoop.x,y:hoop.y+50});s.notice='三球命中';},tick(dt){place();if(mode==='settle'){cooldown-=dt;if(cooldown<=0)serve();return;}if(mode!=='flight')return;
    const previous={...ball.position};flight+=dt;q.step(dt);trail.push(body(ball));if(trail.length>27)trail.shift();
    if(previous.y<hoop.y&&ball.position.y>=hoop.y&&ball.velocity.y>0&&Math.abs(ball.position.x-hoop.x)<26){settle(true);return;}
    if(ball.position.y>575||ball.position.x>980||ball.position.x<0||flight>5)settle(false);
  },read(){return {ball:body(ball),launch,hoop:{...hoop},aim:aim?{...aim}:null,mode,shots,made,flight,trail:trail.map(t=>({...t})),progress:made,goal:3};}});
  api.down=p=>k.input(()=>{if(mode!=='aim')return false;s.held=true;aim=p||{x:110,y:605};},p);api.move=p=>k.input(()=>{if(s.held&&p)aim={...p};},p);
  api.up=p=>k.input(()=>{if(!s.held||mode!=='aim')return false;s.held=false;const v=q.aim(ball,p||aim,.085,17);aim=null;if(!v||v.y>=-2)return false;M.Body.setStatic(ball,false);M.Body.setVelocity(ball,v);M.Body.setAngularVelocity(ball,.11);shots--;mode='flight';flight=0;k.event('launch');},p);return api;
}
