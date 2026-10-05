import {createMatter} from '../vendor/matter.js';
export function hardPhysics(){
  const M=createMatter(),engine=M.Engine.create({gravity:{x:0,y:0},positionIterations:8,velocityIterations:8});
  const disk=(x,y,r,options={})=>{const b=M.Bodies.circle(x,y,r,{friction:0,frictionStatic:0,frictionAir:0,restitution:1,...options});M.Composite.add(engine.world,b);return b;};
  const box=(x,y,w,h,options={})=>{const b=M.Bodies.rectangle(x,y,w,h,{friction:0,frictionStatic:0,frictionAir:0,restitution:1,...options});M.Composite.add(engine.world,b);return b;};
  return {M,engine,disk,box,step:dt=>M.Engine.update(engine,dt*1000),position:(b,x,y)=>M.Body.setPosition(b,{x,y}),velocity:(b,x,y)=>M.Body.setVelocity(b,{x:x/60,y:y/60}),overlap:(a,b)=>Boolean(M.Collision.collides(a,b)),dispose(){M.Composite.clear(engine.world,false);M.Engine.clear(engine);}};
}
