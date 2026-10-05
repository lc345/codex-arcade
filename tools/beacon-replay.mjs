import {BEACON_MAP} from '../apps/codex-stage/last-beacon/map.js';

// Test pilot uses only public movement, aiming, healing and pickup operations.
export function chooseBattleInput(world,s){
  const p=s.player,zone=s.zone;
  const seen=b=>{const distance=Math.hypot(b.x-p.x,b.z-p.z);for(let i=1;i<distance*3;i++){const t=i/(distance*3),x=p.x+(b.x-p.x)*t,z=p.z+(b.z-p.z)*t;if(BEACON_MAP.obstacles.some(o=>o.h>1.35&&Math.abs(x-o.x)<o.w/2+.06&&Math.abs(z-o.z)<o.d/2+.06))return false;}return true;};
  const enemies=s.actors.filter(a=>a.id!==0&&a.hp>0).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z));
  const target=enemies.find(e=>seen(e)&&Math.hypot(e.x-p.x,e.z-p.z)<55);
  if(s.nearby)world.interact();
  let goal;
  if(p.weapon==='pistol'&&s.time<12)goal={x:0,z:44};
  else if(p.armor===0&&s.time<12)goal={x:2,z:44};
  else if(Math.hypot(p.x-zone.x,p.z-zone.z)>zone.radius-6)goal={x:zone.x,z:zone.z};
  else if(!target)goal=enemies[0]||{x:0,z:-4};
  if(!target&&p.hp<62&&p.medkits>0){world.cancel();world.heal();return {forward:0,strafe:0,fire:false};}
  const dest=goal?(world.route(p,goal).find(d=>Math.hypot(d.x-p.x,d.z-p.z)>.6)||goal):null;
  const travel=dest?Math.atan2(dest.x-p.x,-(dest.z-p.z)):p.yaw;
  const yaw=target?Math.atan2(target.x-p.x,-(target.z-p.z)):travel;
  return {yaw,pitch:0,fire:Boolean(target),forward:dest?Math.cos(travel-yaw):0,strafe:dest?Math.sin(travel-yaw):Math.sin(s.time*.8)*.65,sprint:!target};
}
