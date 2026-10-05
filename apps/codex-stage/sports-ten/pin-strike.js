import {Matter as M} from '../vendor/matter.js';
import {createSportsKit} from './physics.js';

export function createBowlingWorld(options={}){
  const q=createSportsKit('pin-strike',options),{k,s,api,circle,box,body}=q;
  let ball,pins=[],aim=null,mode='aim',shots=2,elapsed=0,trail=[];
  const launch={x:480,y:545},goal=()=>[8,9,10][s.stage];
  function ballReset(){if(ball)q.remove(ball);ball=circle(480,545,23,{frictionAir:.003,restitution:.45});M.Body.setMass(ball,5);mode='aim';trail=[];}
  function reset(){shots=2;aim=null;elapsed=0;ball=null;box(215,325,25,470,{isStatic:true,restitution:.2});box(745,325,25,470,{isStatic:true,restitution:.2});box(480,78,555,20,{isStatic:true});pins=[];
    for(let row=0;row<4;row++)for(let col=0;col<=row;col++){const x=480+(col-row/2)*42+(s.stage===1?12:0),y=252-row*40,b=box(x,y,23,34,{frictionAir:.025,restitution:.6,chamfer:{radius:9}});M.Body.setMass(b,.55);pins.push({id:pins.length,x,y,b,fallen:false});}ballReset();s.notice=`两球机会，击倒 ${goal()} 瓶`;}
  q.bind({reset,clear(){aim=null;},restoreCompleted(){pins.forEach(p=>p.fallen=true);s.score=1000;s.notice='全场喝彩';},tick(dt){if(mode==='aim')return;elapsed+=dt;q.step(dt);trail.push(body(ball));if(trail.length>20)trail.shift();
    for(const p of pins)if(!p.fallen&&(Math.hypot(p.b.position.x-p.x,p.b.position.y-p.y)>25||Math.abs(p.b.angle)>.65)){p.fallen=true;s.score+=100;k.event('break',{x:p.b.position.x,y:p.b.position.y});}
    if(elapsed>2.3&&pins.filter(p=>p.fallen).length>=goal()){k.finish(true,pins.every(p=>p.fallen)?'全中':'漂亮的补中');return;}
    if(elapsed>5||ball.position.y<95){if(pins.filter(p=>p.fallen).length>=goal()){k.finish(true,'漂亮的补中');return;}if(shots===0){k.finish(false,'还有球瓶站着');return;}pins.filter(p=>p.fallen).forEach(p=>q.remove(p.b));pins.filter(p=>!p.fallen).forEach(p=>M.Body.setVelocity(p.b,{x:0,y:0}));ballReset();}
  },read(){return {ball:body(ball),launch,pins:pins.map(p=>({id:p.id,...body(p.b),fallen:p.fallen})),aim:aim?{...aim}:null,shots,mode,elapsed,trail:trail.map(p=>({...p})),progress:pins.filter(p=>p.fallen).length,goal:goal()};}});
  api.down=p=>k.input(()=>{if(mode!=='aim')return false;s.held=true;aim=p||{x:480,y:690};},p);api.move=p=>k.input(()=>{if(s.held&&p)aim={...p};},p);
  api.up=p=>k.input(()=>{if(!s.held||mode!=='aim')return false;s.held=false;const v=q.aim(ball,p||aim,.19,16);aim=null;if(!v||v.y>-2)return false;M.Body.setVelocity(ball,v);mode='rolling';shots--;elapsed=0;k.event('launch');},p);return api;
}
