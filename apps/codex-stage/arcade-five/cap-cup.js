import {Matter as M} from '../vendor/matter.js';
import {createFiveKernel} from './kernel.js';

export function createCapWorld(options={}){
  const k=createFiveKernel('cap-cup',options),{s,api}=k,engine=M.Engine.create({gravity:{y:1,scale:.00075}});
  let cap,cup=[],mode='aim',angle=-.8,scored=0,misses=0,flight=0,cooldown=0,trail=[],cupX=680;
  const launch={x:196,y:460},cupWidth=()=>100-s.stage*12;
  const targetX=()=>[650,755,585][scored%3]+(s.stage?Math.sin(s.time*(.55+s.stage*.15)+scored)*[0,38,56][s.stage]:0);
  function resetCap(){if(cap)M.Composite.remove(engine.world,cap);cap=M.Bodies.circle(launch.x,launch.y,11,{frictionAir:0,restitution:.35});M.Body.setStatic(cap,true);M.Composite.add(engine.world,cap);mode='aim';flight=0;trail=[];}
  function setCup(){cupX=targetX();const w=cupWidth();cup.forEach((b,i)=>M.Body.setPosition(b,{x:cupX+(i===0?-w/2:i===1?w/2:0),y:i<2?494:534}));}
  function reset(){M.Composite.clear(engine.world,false);M.Engine.clear(engine);scored=misses=0;cooldown=0;cup=[M.Bodies.rectangle(0,494,8,80,{isStatic:true}),M.Bodies.rectangle(0,494,8,80,{isStatic:true}),M.Bodies.rectangle(0,534,cupWidth(),8,{isStatic:true})];M.Composite.add(engine.world,cup);cap=null;resetCap();setCup();s.notice='三枚入杯';}
  function resolve(success){mode='settle';cooldown=.7;if(success){scored++;s.score+=100;k.event('catch',{x:cap.position.x,y:cap.position.y});if(scored===3)k.finish(true,'叮，全部入杯');}else{misses++;k.event('miss');if(misses===4)k.finish(false,'瓶盖用完了');}}
  k.configure({reset,restoreCompleted(){scored=3;mode='settle';M.Body.setPosition(cap,{x:cupX,y:520});s.score=300;s.notice='叮，全部入杯';},dispose(){M.Composite.clear(engine.world,false);M.Engine.clear(engine);},tick(dt){
    if(mode==='settle'){cooldown-=dt;if(cooldown<=0)resetCap();return;}setCup();angle=-.85+Math.sin(s.time*(1.15+s.stage*.1))*.38;
    if(mode!=='flight')return;flight+=dt;M.Engine.update(engine,dt*1000);trail.push({x:cap.position.x,y:cap.position.y});if(trail.length>24)trail.shift();
    if(cap.velocity.y>0&&cap.position.y>468&&cap.position.y<522&&Math.abs(cap.position.x-cupX)<cupWidth()/2-14){resolve(true);return;}
    if(cap.position.y>620||cap.position.x>1000||cap.position.x<0||flight>4)resolve(false);
  },read(){return {cap:{x:cap.position.x,y:cap.position.y,angle:cap.angle,vx:cap.velocity.x,vy:cap.velocity.y},mode,angle,scored,misses,flight,cupX,cupWidth:cupWidth(),launch:{...launch},trail:trail.map(t=>({...t})),progress:scored,goal:3};}});
  api.down=p=>k.input(()=>{if(mode!=='aim')return false;M.Body.setStatic(cap,false);M.Body.setVelocity(cap,{x:Math.cos(angle)*11,y:Math.sin(angle)*11});M.Body.setAngularVelocity(cap,.14);mode='flight';flight=0;k.event('launch');},p);
  api.up=p=>k.input(()=>{},p);api.move=p=>k.input(()=>{},p);return api;
}
