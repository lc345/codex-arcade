import {Matter as M} from '../vendor/matter.js';
import {createSportsKit} from './physics.js';

export function createPocketWorld(options={}){
  const q=createSportsKit('pocket-six',options),{k,s,api,body,circle,box}=q;
  const pockets=[{x:105,y:125},{x:480,y:116},{x:855,y:125},{x:105,y:535},{x:480,y:544},{x:855,y:535}];
  const rails=[[288,102,305,22],[672,102,305,22],[288,558,305,22],[672,558,305,22],[81,330,22,348],[879,330,22,348]];
  let cue,balls=[],aim=null,moving=false,elapsed=0,shots=8,fouls=0,scratched=false,trail=[];
  const layouts=[[[340,245],[590,340],[725,435]],[[345,235],[610,210],[610,445],[330,430]],[[355,230],[615,215],[700,420],[330,425],[480,325]]];
  function reset(){aim=null;moving=false;elapsed=0;shots=8;fouls=0;scratched=false;trail=[];
    rails.forEach(r=>box(...r,{isStatic:true,restitution:.92,friction:0}));
    cue=circle(230,350,14,{frictionAir:.009,restitution:.93,inertia:Infinity});M.Body.setMass(cue,1);
    balls=layouts[s.stage].map(([x,y],i)=>{const b=circle(x,y,14,{frictionAir:.009,restitution:.93,inertia:Infinity});M.Body.setMass(b,1);return {id:i+1,b,potted:false};});s.notice='八杆内，把彩球送进六个袋口';
  }
  q.bind({reset,clear(){aim=null;},restoreCompleted(){balls.forEach(b=>{b.potted=true;q.remove(b.b);});s.score=balls.length*100;s.notice='清台';},tick(dt){
    if(!moving)return;elapsed+=dt;q.step(dt);trail.push(body(cue));if(trail.length>20)trail.shift();
    for(const item of [{b:cue,cue:true},...balls]){if(item.potted||item.cue&&scratched)continue;const p=pockets.find(p=>Math.hypot(item.b.position.x-p.x,item.b.position.y-p.y)<25);
      if(!p)continue;if(item.cue){scratched=true;fouls++;M.Body.setStatic(cue,true);k.event('hit');s.notice='白球落袋：罚杆并重新摆白球';}
      else {item.potted=true;q.remove(item.b);s.score+=100;k.event('catch',{x:p.x,y:p.y});s.notice='好球，落袋';}}
    if(balls.every(b=>b.potted)){k.finish(true,'清台');return;}
    const rolling=[...(scratched?[]:[cue]),...balls.filter(b=>!b.potted).map(b=>b.b)].some(b=>Math.hypot(b.velocity.x,b.velocity.y)>.15);
    if(!rolling||elapsed>7){moving=false;[cue,...balls.map(b=>b.b)].forEach(b=>M.Body.setVelocity(b,{x:0,y:0}));if(scratched){M.Body.setStatic(cue,false);M.Body.setMass(cue,1);const spot=[{x:230,y:350},{x:230,y:230},{x:230,y:460}].find(p=>balls.every(b=>b.potted||Math.hypot(b.b.position.x-p.x,b.b.position.y-p.y)>40))||{x:180,y:330};M.Body.setPosition(cue,spot);shots=Math.max(0,shots-1);scratched=false;}if(shots===0)k.finish(false,'球杆用完了');}
  },read(){return {ball:body(cue),balls:balls.map(b=>({id:b.id,...body(b.b),potted:b.potted})),pockets,rails,aim:aim?{...aim}:null,moving,shots,fouls,scratched,trail:trail.map(p=>({...p})),progress:balls.filter(b=>b.potted).length,goal:balls.length};}});
  api.down=p=>k.input(()=>{if(moving)return false;s.held=true;aim=p||{x:cue.position.x-150,y:cue.position.y};},p);
  api.move=p=>k.input(()=>{if(s.held&&p)aim={...p};},p);
  api.up=p=>k.input(()=>{if(!s.held||moving)return false;s.held=false;const v=q.aim(cue,p||aim,.075,14);aim=null;if(!v)return false;M.Body.setVelocity(cue,v);shots--;moving=true;elapsed=0;k.event('launch');},p);return api;
}
