import {createRapier} from '../vendor/rapier.js';
import {Graph,NavNode,NavEdge,Vector3,AStar} from '../vendor/yuka.js';
import {BEACON_MAP} from './map.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const WEAPONS={pistol:{name:'P9 手枪',mag:12,interval:.27,damage:24,range:70,spread:.003,reload:1.2,pellets:1},rifle:{name:'R4 突击步枪',mag:28,interval:.105,damage:21,range:85,spread:.009,reload:1.65,pellets:1},scatter:{name:'K6 霰弹枪',mag:6,interval:.64,damage:15,range:28,spread:.068,reload:1.9,pellets:6}};
export function zoneAt(time){
  const t=Math.max(0,time),stages=[{start:25,end:60,from:63,to:40},{start:78,end:105,from:40,to:20},{start:120,end:147,from:20,to:7},{start:160,end:180,from:7,to:0}];
  let radius=63,index=0,shrinking=false,until=25;
  for(let i=0;i<stages.length;i++){const s=stages[i];if(t<s.start){until=s.start-t;index=i;break;}radius=s.from+(s.to-s.from)*clamp((t-s.start)/(s.end-s.start),0,1);index=i;shrinking=t<s.end;until=Math.max(0,s.end-t);if(t<s.end)break;}
  return {x:0,z:-4,radius,index,shrinking,until,damage:3+index*2.5,nextRadius:stages[index].to};
}
export function createBattleWorld({checkpoint=null,seed=73,arena=BEACON_MAP,onEvent=()=>{}}={}){
  const R=createRapier(),physics=new R.World({x:0,y:0,z:0}),dt=1/60;
  physics.timestep=dt;
  let rng=seed>>>0,active=true,disposed=false,phase='ready',time=0,acc=0,reason='',notice='',noticeUntil=0,serial=0;
  const random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
  const actors=[],owners=new Map(),traces=[],feed=[],loot=arena.loot.map(v=>({...v,taken:false})),effects=[];
  const emit=(type,data={})=>{if(active&&!disposed)onEvent({type,...data});};
  const tell=text=>{notice=text;noticeUntil=time+2;};
  let input={forward:0,strafe:0,yaw:0,pitch:0,fire:false,sprint:false};
  const walkable=(x,z,margin=.6)=>Number.isFinite(x)&&Number.isFinite(z)&&Math.hypot(x,z)<arena.radius-1&&!arena.obstacles.some(o=>Math.abs(x-o.x)<o.w/2+margin&&Math.abs(z-o.z)<o.d/2+margin);
  function clearSegment(a,b,margin=.6){const length=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(1,Math.ceil(length/.6));for(let i=0;i<=n;i++){const f=i/n;if(!walkable(a.x+(b.x-a.x)*f,a.z+(b.z-a.z)*f,margin))return false;}return true;}
  const graph=new Graph(),nodes=[];
  for(let z=-60;z<=60;z+=4)for(let x=-60;x<=60;x+=4)if(walkable(x,z)){const p={x,z,index:nodes.length};nodes.push(p);graph.addNode(new NavNode(p.index,new Vector3(x,0,z)));}
  const grid=new Map(nodes.map(n=>[`${n.x},${n.z}`,n]));
  for(const a of nodes)for(const [dx,dz]of [[4,0],[0,4],[4,4],[-4,4]]){const b=grid.get(`${a.x+dx},${a.z+dz}`);if(b&&clearSegment(a,b))graph.addEdge(new NavEdge(a.index,b.index,Math.hypot(dx,dz)));}
  const nearest=p=>nodes.reduce((a,b)=>Math.hypot(b.x-p.x,b.z-p.z)<Math.hypot(a.x-p.x,a.z-p.z)?b:a,nodes[0]);
  function route(from,to){if(clearSegment(from,to))return [{x:to.x,z:to.z}];const a=nearest(from),b=nearest(to),search=new AStar(graph,a.index,b.index).search();return search.found?search.getPath().slice(1).map(i=>({x:nodes[i].x,z:nodes[i].z})):[];}
  for(const o of arena.obstacles){physics.createCollider(R.ColliderDesc.cuboid(o.w/2,o.h/2,o.d/2).setTranslation(o.x,o.h/2,o.z));}
  for(const [x,z,w,d]of [[-64,0,1,130],[64,0,1,130],[0,-64,130,1],[0,64,130,1]])physics.createCollider(R.ColliderDesc.cuboid(w/2,5,d/2).setTranslation(x,5,z));
  const valid=checkpoint?.version===1&&checkpoint.arena==='coast-1'&&Number.isFinite(checkpoint.time)&&checkpoint.time>=0&&checkpoint.time<180&&Array.isArray(checkpoint.actors)&&checkpoint.actors.length===arena.spawns.length&&checkpoint.actors.every(a=>a&&walkable(a.x,a.z,.36)&&Number.isFinite(a.hp)&&a.hp>=0&&a.hp<=100&&Number.isFinite(a.armor)&&a.armor>=0&&a.armor<=100&&Object.hasOwn(WEAPONS,a.weapon)&&Number.isInteger(a.mag)&&a.mag>=0&&a.mag<=WEAPONS[a.weapon].mag&&Number.isInteger(a.reserve)&&a.reserve>=0&&a.reserve<=240&&Number.isInteger(a.medkits)&&a.medkits>=0&&a.medkits<=5&&Number.isInteger(a.kills)&&a.kills>=0&&a.kills<arena.spawns.length)&&checkpoint.actors[0].hp>0&&checkpoint.actors.filter(a=>a.hp>0).length>1;
  if(valid){time=checkpoint.time;rng=Number.isInteger(checkpoint.rng)?checkpoint.rng>>>0:rng;for(const l of loot)l.taken=Array.isArray(checkpoint.taken)&&checkpoint.taken.includes(l.id);}
  for(const [id,spawn]of arena.spawns.entries()){
    const saved=valid?checkpoint.actors[id]:null,p=saved||spawn,body=physics.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(p.x,.91,p.z)),collider=physics.createCollider(R.ColliderDesc.capsule(.51,.38),body),controller=physics.createCharacterController(.025);
    controller.setSlideEnabled(true);
    const a={id,x:p.x,z:p.z,hp:saved?.hp??100,armor:saved?.armor??(id?15:0),weapon:saved?.weapon??(id%3===0&&id?'rifle':'pistol'),mag:saved?.mag??12,reserve:saved?.reserve??96,medkits:saved?.medkits??(id?0:1),kills:saved?.kills??0,yaw:0,pitch:0,speed:0,fire:false,cooldown:0,reload:0,heal:0,flash:0,hit:0,lastShot:-10,deadAt:0,alert:0,target:-1,path:[],navAt:0,brainAt:0,goal:{x:spawn.x,z:spawn.z},body,collider,controller};
    if(!saved)a.mag=WEAPONS[a.weapon].mag;
    if(a.hp===0)collider.setEnabled(false);owners.set(collider.handle,id);actors.push(a);
  }
  physics.step();
  const origin=a=>({x:a.x,y:1.35,z:a.z});
  function ray(a,dir,range=90){return physics.castRay(new R.Ray(origin(a),dir),range,true,undefined,undefined,a.collider);}
  function visible(a,b){const d=Math.hypot(b.x-a.x,b.z-a.z);if(d<.01)return true;const hit=ray(a,{x:(b.x-a.x)/d,y:0,z:(b.z-a.z)/d},d+.4);return hit&&owners.get(hit.collider.handle)===b.id;}
  function damage(a,amount,by,storm=false){if(a.hp<=0)return;const absorb=storm?0:Math.min(a.armor,amount*.5);a.armor-=absorb;a.hp=Math.max(0,a.hp-amount+absorb);a.hit=.22;
    if(a.id===0)emit('hurt',{storm,angle:by?Math.atan2(by.x-a.x,-(by.z-a.z)):0});
    if(a.hp===0){a.deadAt=time;a.fire=false;a.collider.setEnabled(false);if(by)by.kills++;feed.unshift({id:++serial,text:storm?`对手 ${a.id} 未能进圈`:`${by.id===0?'你':'对手 '+by.id} 击败 ${a.id===0?'你':'对手 '+a.id}`,time});feed.splice(4);emit('eliminate',{player:by?.id===0});
      if(a.id===0){phase='lost';reason=storm?'未能进入安全区':'你被淘汰了';emit('lose');}
      else{loot.push({id:'drop-'+a.id,kind:'ammo',x:a.x,z:a.z,taken:false});}
    }
  }
  function shoot(a){
    const gun=WEAPONS[a.weapon];if(a.hp<=0||a.cooldown>0||a.reload>0||a.heal>0||a.mag<=0)return false;
    a.mag--;a.cooldown=a.id===0?gun.interval:Math.max(.42,gun.interval*3);a.flash=.075;a.lastShot=time;
    for(let i=0;i<gun.pellets;i++){
      const spread=a.id===0?gun.spread:(.042+a.speed*.007),yaw=a.yaw+(random()-.5)*spread*2,pitch=a.pitch+(random()-.5)*spread*1.4,dir={x:Math.sin(yaw)*Math.cos(pitch),y:Math.sin(pitch),z:-Math.cos(yaw)*Math.cos(pitch)},from=origin(a),hit=ray(a,dir,gun.range),dist=hit?.timeOfImpact??gun.range,to={x:from.x+dir.x*dist,y:from.y+dir.y*dist,z:from.z+dir.z*dist};
      const target=hit?actors[owners.get(hit.collider.handle)]:null;
      if(target&&target.hp>0){damage(target,gun.damage*(a.id===0?1:.43),a);if(a.id===0){emit('hit');effects.push({type:'hit',time,x:to.x,y:to.y,z:to.z});}}
      traces.push({id:++serial,from,to,age:0,player:a.id===0,hit:Boolean(target)});
    }
    if(a.id===0)emit('shot',{weapon:a.weapon});else if(Math.hypot(a.x-actors[0].x,a.z-actors[0].z)<32)emit('enemy-shot',{distance:Math.hypot(a.x-actors[0].x,a.z-actors[0].z)});
    return true;
  }
  function reload(a=actors[0]){if(!active||phase!=='playing'||a.hp<=0||a.reload>0||a.reserve===0||a.mag===WEAPONS[a.weapon].mag)return false;a.reload=WEAPONS[a.weapon].reload;a.heal=0;if(a.id===0)emit('reload');return true;}
  function move(a,x,z,speed){const length=Math.hypot(x,z);if(length>1){x/=length;z/=length;}a.controller.computeColliderMovement(a.collider,{x:x*speed*dt,y:0,z:z*speed*dt},undefined,undefined,c=>!owners.has(c.handle));const m=a.controller.computedMovement();a.body.setNextKinematicTranslation({x:a.x+m.x,y:.91,z:a.z+m.z});a.speed=Math.hypot(m.x,m.z)/dt;}
  function brain(a,zone){
    if(time>a.brainAt){a.brainAt=time+.35+a.id*.013;
      const targets=actors.filter(b=>b.id!==a.id&&b.hp>0&&Math.hypot(b.x-a.x,b.z-a.z)<43&&visible(a,b)).sort((b,c)=>Math.hypot(b.x-a.x,b.z-a.z)-Math.hypot(c.x-a.x,c.z-a.z));
      const target=targets[0];if(target?.id!==a.target)a.alert=time+.65;a.target=target?.id??-1;
      const outside=Math.hypot(a.x-zone.x,a.z-zone.z)>zone.radius-5;
      if(outside)a.goal={x:zone.x+Math.sin(a.id*2.1)*Math.max(0,zone.radius*.35),z:zone.z+Math.cos(a.id*2.1)*Math.max(0,zone.radius*.35)};
      else if(target){const d=Math.hypot(target.x-a.x,target.z-a.z);a.goal=d>17?{x:target.x,z:target.z}:{x:a.x+Math.cos(time+a.id)*3,z:a.z+Math.sin(time+a.id)*3};}
      else if(Math.hypot(a.x-a.goal.x,a.z-a.goal.z)<3||time>a.navAt+4){const candidates=nodes.filter(p=>Math.hypot(p.x-zone.x,p.z-zone.z)<Math.max(4,zone.radius-8));a.goal=candidates[Math.floor(random()*candidates.length)]||{x:0,z:-4};}
    }
    if(time>a.navAt){a.navAt=time+.9;a.path=route(a,a.goal);}
    while(a.path.length&&Math.hypot(a.path[0].x-a.x,a.path[0].z-a.z)<1)a.path.shift();
    const dest=a.path[0],d=dest?Math.hypot(dest.x-a.x,dest.z-a.z):0,target=actors[a.target];
    if(target?.hp>0){a.yaw=Math.atan2(target.x-a.x,-(target.z-a.z));a.pitch=0;a.fire=time>a.alert&&visible(a,target);}else {a.fire=false;if(dest)a.yaw=Math.atan2(dest.x-a.x,-(dest.z-a.z));}
    move(a,d?(dest.x-a.x)/d:0,d?(dest.z-a.z)/d:0,a.fire?1.25:3.2);
    if(a.mag===0)reload(a);
  }
  function update(){
    if(phase!=='playing')return;time+=dt;const zone=zoneAt(time),p=actors[0];
    for(const a of actors){if(a.hp<=0)continue;a.cooldown=Math.max(0,a.cooldown-dt);a.flash=Math.max(0,a.flash-dt);a.hit=Math.max(0,a.hit-dt);
      if(a.reload>0){a.reload=Math.max(0,a.reload-dt);if(a.reload===0){const n=Math.min(WEAPONS[a.weapon].mag-a.mag,a.reserve);a.mag+=n;a.reserve-=n;}}
      if(a.heal>0){a.heal=Math.max(0,a.heal-dt);if(a.heal===0){a.hp=Math.min(100,a.hp+60);a.medkits--;emit('heal');tell('已使用医疗包');}}
      if(a.id===0){a.yaw=input.yaw;a.pitch=input.pitch;a.fire=input.fire;if(input.fire||input.forward||input.strafe)a.heal=0;const speed=a.heal?0:input.sprint&&!input.fire?9:input.fire?4.2:5.8;move(a,Math.sin(a.yaw)*input.forward+Math.cos(a.yaw)*input.strafe,-Math.cos(a.yaw)*input.forward+Math.sin(a.yaw)*input.strafe,speed);}
      else brain(a,zone);
    }
    physics.step();for(const a of actors){const p=a.body.translation();a.x=p.x;a.z=p.z;}
    for(const a of actors){if(a.hp<=0)continue;if(Math.hypot(a.x-zone.x,a.z-zone.z)>zone.radius)damage(a,zone.damage*dt,null,true);if(a.fire&&phase==='playing')shoot(a);}
    if(p.mag===0&&input.fire&&p.reserve>0)reload(p);
    for(const t of traces)t.age+=dt;while(traces.length&&(traces[0].age>.16||traces.length>80))traces.shift();while(effects.length&&(time-effects[0].time>.25||effects.length>20))effects.shift();
    if(phase==='playing'&&p.hp>0&&actors.filter(a=>a.hp>0).length===1){phase='won';reason='最后的生还者';emit('win');}
    if(phase!=='playing'){input.fire=false;for(const a of actors){a.fire=false;a.flash=0;a.speed=0;}}
  }
  function interact(){if(!active||phase!=='playing')return false;const a=actors[0],l=loot.filter(l=>!l.taken&&Math.hypot(l.x-a.x,l.z-a.z)<1.8).sort((b,c)=>Math.hypot(b.x-a.x,b.z-a.z)-Math.hypot(c.x-a.x,c.z-a.z))[0];if(!l)return false;
    l.taken=true;if(WEAPONS[l.kind]){a.weapon=l.kind;a.mag=WEAPONS[l.kind].mag;a.reserve=Math.min(240,a.reserve+56);a.reload=0;tell('已装备 '+WEAPONS[l.kind].name);}else if(l.kind==='armor'){a.armor=100;tell('护甲已补充');}else if(l.kind==='med'){a.medkits=Math.min(5,a.medkits+1);tell('医疗包 +1');}else {a.reserve=Math.min(240,a.reserve+56);tell('弹药 +56');}emit('loot');return true;
  }
  const plain=a=>{const {body,collider,controller,path,goal,...p}=a;return p;};
  function snapshot(){const p=actors[0],dir={x:Math.sin(p.yaw)*Math.cos(p.pitch),y:Math.sin(p.pitch),z:-Math.cos(p.yaw)*Math.cos(p.pitch)},hit=ray(p,dir,70),range=hit?.timeOfImpact??70,o=origin(p);return {phase,active,time,reason,notice:time<noticeUntil?notice:'',actors:actors.map(plain),player:plain(p),alive:actors.filter(a=>a.hp>0).length,zone:zoneAt(time),loot:loot.map(l=>({...l})),traces:traces.map(t=>structuredClone(t)),effects:effects.map(e=>({...e})),feed:feed.filter(f=>time-f.time<7).map(f=>({...f})),aim:{x:o.x+dir.x*range,y:o.y+dir.y*range,z:o.z+dir.z*range},nearby:loot.find(l=>!l.taken&&Math.hypot(l.x-p.x,l.z-p.z)<1.8)?.kind??null};}
  return {begin(){if(!active||disposed||phase!=='ready')return false;phase='playing';emit('start');return true;},
    control(v={}){if(!active||disposed||phase!=='playing')return false;for(const k of ['forward','strafe','yaw','pitch'])if(v[k]!==undefined&&!Number.isFinite(v[k]))return false;input={...input,...v,forward:clamp(v.forward??input.forward,-1,1),strafe:clamp(v.strafe??input.strafe,-1,1),pitch:clamp(v.pitch??input.pitch,-.65,.7),fire:Boolean(v.fire??input.fire),sprint:Boolean(v.sprint??input.sprint)};return true;},
    cancel(){input={...input,forward:0,strafe:0,fire:false,sprint:false};actors[0].fire=false;actors[0].speed=0;},reload:()=>reload(),interact,
    heal(){const p=actors[0];if(!active||phase!=='playing'||p.medkits===0||p.hp>=100||p.heal>0)return false;p.heal=1.7;p.reload=0;input.fire=false;emit('bandage');return true;},
    step(ms){if(!active||disposed||phase!=='playing'||!Number.isFinite(ms)||ms<=0)return;acc+=Math.min(50,ms)/1000;while(acc>=dt){acc-=dt;update();}},snapshot,route,walkable,
    checkpoint(){return {version:1,arena:'coast-1',time,rng,actors:actors.map(a=>({x:a.x,z:a.z,hp:a.hp,armor:a.armor,weapon:a.weapon,mag:a.mag,reserve:a.reserve,medkits:a.medkits,kills:a.kills})),taken:loot.filter(l=>l.taken&&!l.id.startsWith('drop-')).map(l=>l.id)};},
    stop(){if(disposed)return;this.cancel();active=false;},destroy(){if(disposed)return;active=false;disposed=true;physics.free();},
  };
}
