import {Matter as M} from '../vendor/matter.js';
import {createFiveKernel} from './kernel.js';

export function createGliderWorld(options={}){
  const k=createFiveKernel('paper-glider',options),{s,api}=k,engine=M.Engine.create({gravity:{y:1,scale:.0007}});
  let plane,gates=[],rings=[],trail=[],wind=0;
  const gap=()=>212-s.stage*18;
  const center=(g)=>g.base+(s.stage===2?Math.sin(s.time*.8+g.index)*22:0);
  function reset(){M.Composite.clear(engine.world,false);M.Engine.clear(engine);trail=[];wind=0;
    plane=M.Bodies.circle(160,320,13,{frictionAir:.025,restitution:0});M.Body.setMass(plane,1);
    gates=[330,235,380,255,335].map((base,index)=>{const x=660+index*440,a=M.Bodies.rectangle(x,base-gap()/2-400,48,800,{isStatic:true}),b=M.Bodies.rectangle(x,base+gap()/2+400,48,800,{isStatic:true});return {x,base,index,a,b};});
    rings=gates.map(g=>({x:g.x-90,y:g.base,hit:false}));M.Composite.add(engine.world,[plane,...gates.flatMap(g=>[g.a,g.b])]);s.notice='穿过三枚风环';
  }
  k.configure({reset,restoreCompleted(){rings.forEach(r=>r.hit=true);M.Body.setPosition(plane,{x:2700,y:gates.at(-1).base});s.score=500;s.notice='顺风抵达';},dispose(){M.Composite.clear(engine.world,false);M.Engine.clear(engine);},tick(dt){
    const near=gates.find(g=>g.x>plane.position.x-80);wind=s.stage&&near&&near.index%2===1?Math.sin(s.time*1.5)*.00022:0;
    M.Body.applyForce(plane,plane.position,{x:0,y:(s.held?-.00145:0)+wind});M.Body.setVelocity(plane,{x:3.45+s.stage*.15,y:Math.max(-4.3,Math.min(4.3,plane.velocity.y))});
    for(const g of gates){const y=center(g);M.Body.setPosition(g.a,{x:g.x,y:y-gap()/2-400});M.Body.setPosition(g.b,{x:g.x,y:y+gap()/2+400});rings[g.index].y=y;}
    M.Engine.update(engine,dt*1000);trail.push({x:plane.position.x,y:plane.position.y});if(trail.length>35)trail.shift();
    for(const r of rings)if(!r.hit&&Math.hypot(r.x-plane.position.x,r.y-plane.position.y)<43){r.hit=true;s.score+=100;k.event('ring',{x:r.x,y:r.y});}
    if(plane.position.y<65||plane.position.y>590||M.Query.collides(plane,gates.flatMap(g=>[g.a,g.b])).length){k.finish(false,'纸翼折了一下');return;}
    if(plane.position.x>gates.at(-1).x+240)k.finish(rings.filter(r=>r.hit).length>=3,rings.filter(r=>r.hit).length>=3?'顺风抵达':'漏掉太多风环');
  },read(){return {plane:{x:plane.position.x,y:plane.position.y,vy:plane.velocity.y,angle:Math.atan2(plane.velocity.y,3.5)},gates:gates.map(g=>({x:g.x,y:center(g),gap:gap()})),rings:rings.map(r=>({...r})),trail:trail.map(t=>({...t})),wind,progress:Math.max(0,plane.position.x-160),goal:2500,ringsHit:rings.filter(r=>r.hit).length};}});
  api.down=p=>k.input(()=>{s.held=true;},p);api.up=p=>k.input(()=>{s.held=false;},p);api.move=p=>k.input(()=>{},p);return api;
}
