import {createFiveKernel} from '../arcade-five/kernel.js';
export function createOddKit(id,options={}){
  const k=createFiveKernel(id,options),{s,api}=k;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  let hooks={};
  const point=()=>s.controlPoint||{x:480,y:320};
  function bind(h){hooks=h;k.configure({reset(){Object.assign(s,{progress:0,goal:1,errors:0,heat:0,controlPoint:{x:480,y:320},limit:40});h.reset();},tick(dt){h.tick(dt);if(s.time>s.limit&&s.phase==='playing')k.finish(false,'时间到了');},read:()=>structuredClone(h.read?.()||{}),clear(){s.held=false;h.clear?.();},restoreCompleted(){s.progress=s.goal;s.score=s.goal*100;h.restoreCompleted?.();},dispose:()=>h.dispose?.()});}
  api.down=p=>k.input(()=>{s.held=true;if(p)s.controlPoint={...p};return hooks.down?.(p||point());},p);
  api.move=p=>k.input(()=>{if(p)s.controlPoint={...p};return hooks.move?.(p||point());},p);
  api.up=p=>k.input(()=>{const held=s.held;s.held=false;return held?hooks.up?.(p||point()):false;},p);
  function gain(x=480,y=320){s.progress++;s.score+=100;k.event('catch',{x,y});if(s.progress>=s.goal)k.finish(true,'漂亮，过关');}
  function miss(text='这次没接住'){s.errors++;k.event('hit');if(s.errors>=3)k.finish(false,text);}
  const snapshot=api.snapshot;api.snapshot=()=>structuredClone(snapshot());
  return {k,s,api,bind,clamp,dist,gain,miss};
}

export function linesCross(a,b,c,d){
  const cross=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);
  if(Math.max(a.x,b.x)<Math.min(c.x,d.x)||Math.max(c.x,d.x)<Math.min(a.x,b.x)||Math.max(a.y,b.y)<Math.min(c.y,d.y)||Math.max(c.y,d.y)<Math.min(a.y,b.y))return false;
  return cross(a,b,c)*cross(a,b,d)<=0&&cross(c,d,a)*cross(c,d,b)<=0;
}
