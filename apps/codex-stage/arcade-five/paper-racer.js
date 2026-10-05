import {Matter as M} from '../vendor/matter.js';
import {createFiveKernel} from './kernel.js';

export function createPaperWorld(options={}){
  const k=createFiveKernel('paper-racer',options),{s,api}=k,engine=M.Engine.create({gravity:{y:0}});
  let car,edges=[],erasers=[],distance=0,health=3,invulnerable=0,marks=[],lastHit=null;
  const center=d=>480+135*Math.sin(d/(370-s.stage*25))+70*Math.sin(d/150);
  const half=()=>134-s.stage*12;
  function reset(){M.Composite.clear(engine.world,false);M.Engine.clear(engine);distance=0;health=3;invulnerable=0;marks=[];lastHit=null;
    car=M.Bodies.rectangle(center(0),500,22,40,{frictionAir:.12,restitution:.2});M.Body.setMass(car,1);
    edges=[];for(let d=-200;d<2600;d+=45)for(const sign of [-1,1]){const x1=center(d)+half()*sign,x2=center(d+45)+half()*sign;edges.push(M.Bodies.rectangle((x1+x2)/2,500-d-22.5,Math.hypot(x2-x1,45),12,{angle:Math.atan2(-45,x2-x1),isStatic:true}));}
    erasers=[560,1030,1550,2030].map((d,i)=>({d,x:center(d)+(i%2?45:-45),body:M.Bodies.rectangle(center(d)+(i%2?45:-45),500-d,58+s.stage*4,37,{isStatic:true,angle:(i%2?1:-1)*.18})}));
    M.Composite.add(engine.world,[car,...edges,...erasers.map(e=>e.body)]);s.notice='别越线';
  }
  k.configure({reset,restoreCompleted(){distance=2370;M.Body.setPosition(car,{x:center(distance),y:500-distance});s.score=237;s.notice='划过终点';},dispose(){M.Composite.clear(engine.world,false);M.Engine.clear(engine);},tick(dt){
    invulnerable=Math.max(0,invulnerable-dt);const speed=3.3+s.stage*.2;M.Body.setVelocity(car,{x:car.velocity.x*.88+(s.held?.63:-.63),y:-speed});M.Body.setAngle(car,Math.atan2(car.velocity.x,speed)*.38);M.Engine.update(engine,dt*1000);distance=Math.max(distance,500-car.position.y);s.score=Math.floor(distance/10);
    marks.push({x:car.position.x,y:car.position.y});if(marks.length>100)marks.shift();
    if(invulnerable===0&&M.Query.collides(car,[...edges,...erasers.map(e=>e.body)]).length){health--;lastHit={x:car.position.x,y:car.position.y,at:s.time};k.event('hit',lastHit);if(health===0){k.finish(false,'纸都刮破了');return;}invulnerable=1;M.Body.setPosition(car,{x:center(distance),y:500-distance-45});M.Body.setVelocity(car,{x:0,y:-speed});}
    if(distance>=2370)k.finish(true,'划过终点');
  },read(){return {car:{x:car.position.x,y:car.position.y,vx:car.velocity.x,angle:car.angle},distance,health,invulnerable,halfWidth:half(),road:Array.from({length:35},(_,i)=>{const d=distance-220+i*38;return {x:center(d),y:500-d,d};}),erasers:erasers.map(e=>({x:e.body.position.x,y:e.body.position.y,angle:e.body.angle,d:e.d})),marks:marks.map(m=>({...m})),lastHit:lastHit?{...lastHit}:null,progress:distance,goal:2370};}});
  api.down=p=>k.input(()=>{s.held=true;},p);api.up=p=>k.input(()=>{s.held=false;},p);api.move=p=>k.input(()=>{},p);return api;
}
