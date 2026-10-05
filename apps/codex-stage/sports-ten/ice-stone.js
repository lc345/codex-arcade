import {Matter as M} from '../vendor/matter.js';
import {createSportsKit} from './physics.js';

export function createCurlingWorld(options={}){
  const q=createSportsKit('ice-stone',options),{k,s,api,circle,body}=q;
  let stone,guard,charge=0,mode='aim',throws=3,points=0,time=0,trail=[],sweep=1;
  const target={x:744,y:338},goal=()=>[4,5,6][s.stage];
  function serve(){if(stone)q.remove(stone);stone=circle(155,338,22,{frictionAir:.018,restitution:.75});M.Body.setMass(stone,2);mode='aim';charge=0;trail=[];sweep=1;time=0;}
  function reset(){throws=3;points=0;stone=null;guard=s.stage?circle(580,338+(s.stage===1?31:-28),23,{frictionAir:.022,restitution:.85}):null;serve();s.notice='放准力道，停进靶心';}
  function settle(){const dist=Math.hypot(stone.position.x-target.x,stone.position.y-target.y),value=dist<31?3:dist<66?2:dist<105?1:0;points+=value;s.score=points*100;k.event(value?'catch':'miss',{x:stone.position.x,y:stone.position.y});mode='settle';time=0;s.notice=value?`${value} 分落点`:'滑过头了';if(points>=goal())k.finish(true,'冰面上的分寸');else if(throws===0)k.finish(false,'三壶用完了');}
  q.bind({reset,clear(){charge=0;},restoreCompleted(){points=goal();s.score=points*100;mode='settle';M.Body.setPosition(stone,target);s.notice='冰面上的分寸';},tick(dt){
    if(mode==='aim'){if(s.held)charge=Math.min(1.4,charge+dt);return;}if(mode==='settle'){time+=dt;if(time>.7)serve();return;}
    time+=dt;if(s.held&&sweep>0){sweep=Math.max(0,sweep-dt);stone.frictionAir=.008;}else stone.frictionAir=.018;
    q.step(dt);trail.push(body(stone));if(trail.length>70)trail.shift();if(stone.position.x>930||Math.hypot(stone.velocity.x,stone.velocity.y)<.12||time>7)settle();
  },read(){return {ball:body(stone),stone:body(stone),guard:guard?body(guard):null,target,charge,mode,throws,points,sweep,trail:trail.map(t=>({...t})),progress:points,goal:goal()};}});
  api.down=p=>k.input(()=>{s.held=true;if(mode==='aim')charge=0;},p);api.up=p=>k.input(()=>{if(!s.held)return false;s.held=false;if(mode!=='aim')return;const power=charge;charge=0;if(power<.08)return false;M.Body.setVelocity(stone,{x:3+power*13,y:s.stage===2?.11:0});mode='slide';throws--;time=0;k.event('launch');},p);return api;
}
