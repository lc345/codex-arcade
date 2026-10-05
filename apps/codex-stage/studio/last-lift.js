import { createRapier } from "../vendor/rapier.js";

export function createLiftWorld(options={}) {
  const R=createRapier(),world=new R.World({x:0,y:0,z:0});world.timestep=1/60;
  const scene={id:"last-lift",level:0,phase:"playing",time:0,score:0,progress:0,goal:3,player:{x:0,z:4,yaw:0,pitch:0,speed:0},power:false,fuse:false,door:0,opened:false,target:null,focus:null,flash:0,status:"B1 / 夜班结束了，电梯却还没有。",primaryLabel:"向前走",secondaryLabel:"转身",sites:[{id:"fuse",x:-2.45,z:.8,title:"取保险丝"},{id:"breaker",x:2.5,z:-1.8,title:"修复配电箱"},{id:"call",x:.9,z:-5,title:"呼叫电梯"}]};
  const body=world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(0,.9,4));
  const collider=world.createCollider(R.ColliderDesc.capsule(.55,.26),body),controller=world.createCharacterController(.015);controller.setSlideEnabled(true);
  const box=(x,z,w,d)=>world.createCollider(R.ColliderDesc.cuboid(w/2,2,d/2).setTranslation(x,1.5,z));
  box(-3.1,0,.2,18);box(3.1,0,.2,18);box(0,5.5,6.4,.2);box(0,-9,6.4,.2);box(-2,-5,2,.3);box(2,-5,2,.3);
  const gate=box(0,-5,2,.25);box(-2.75,.8,.5,1.2);box(2.75,-1.8,.5,1.2);
  let active=true,disposed=false,accumulator=0,press=null,lastStep=0;const keys=new Set(),emit=type=>{if(active)options.onEvent?.({type});};
  function sync(){const p=body.translation();scene.player.x=p.x;scene.player.z=p.z;const fwd={x:-Math.sin(scene.player.yaw),z:-Math.cos(scene.player.yaw)};scene.focus=scene.sites.find(s=>!(s.id==="fuse"&&scene.fuse)&&Math.hypot(s.x-p.x,s.z-p.z)<2.35&&((s.x-p.x)*fwd.x+(s.z-p.z)*fwd.z)>0.2)??null;scene.primaryLabel=scene.focus?.title??"向前走";scene.progress=Number(scene.fuse)+Number(scene.power)+Number(scene.phase==="won");scene.score=scene.progress*400;}
  function interact(id){if(!active||scene.phase!=="playing")return false;const p=scene.sites.find(p=>p.id===id);if(!p||Math.hypot(p.x-scene.player.x,p.z-scene.player.z)>2.35)return false;
    if(id==="fuse"){if(scene.fuse)return false;scene.fuse=true;scene.status="保险丝还热着。配电箱在对面的墙上。";emit("lift-metal");}
    if(id==="breaker"){if(!scene.fuse||scene.power){scene.status=scene.power?"供电正常。":"配电箱少了一枚保险丝。";emit("lift-locked");return false;}scene.power=true;scene.status="应急电源接通了。电梯指示灯亮起。";emit("lift-power");}
    if(id==="call"){if(!scene.power||scene.opened){if(!scene.power){scene.status="按钮没有反应。先找到备用保险丝。";emit("lift-locked");}return false;}scene.opened=true;scene.status="门开了。走进电梯，结束今晚的夜班。";emit("lift-door");}
    scene.flash=450;sync();return true;
  }
  function primary(){if(!active)return false;if(scene.phase==="won")return retry();if(scene.focus)return interact(scene.focus.id);scene.target={x:scene.player.x-Math.sin(scene.player.yaw)*2,z:scene.player.z-Math.cos(scene.player.yaw)*2};return true;}
  function secondary(){if(!active)return false;scene.player.yaw+=Math.PI;scene.target=null;sync();return true;}
  function retry(){if(!active)return false;keys.clear();Object.assign(scene,{phase:"playing",time:0,power:false,fuse:false,door:0,opened:false,target:null,flash:0,status:"B1 / 夜班结束了，电梯却还没有。",player:{x:0,z:4,yaw:0,pitch:0,speed:0}});gate.setEnabled(true);body.setTranslation({x:0,y:.9,z:4},true);body.setNextKinematicTranslation({x:0,y:.9,z:4});accumulator=lastStep=0;sync();return true;}
  function fixed(){scene.time+=1000/60;scene.flash=Math.max(0,scene.flash-1000/60);if(scene.phase!=="playing")return;
    if(scene.opened){scene.door=Math.min(1,scene.door+.012);if(scene.door>.85)gate.setEnabled(false);}
    let strafe=Number(keys.has("d")||keys.has("ArrowRight"))-Number(keys.has("a")||keys.has("ArrowLeft")),forward=Number(keys.has("w")||keys.has("ArrowUp"))-Number(keys.has("s")||keys.has("ArrowDown"));
    let dx=strafe*Math.cos(scene.player.yaw)-forward*Math.sin(scene.player.yaw),dz=-strafe*Math.sin(scene.player.yaw)-forward*Math.cos(scene.player.yaw);
    if(dx||dz)scene.target=null;else if(scene.target){dx=scene.target.x-scene.player.x;dz=scene.target.z-scene.player.z;if(Math.hypot(dx,dz)<.12){scene.target=null;dx=dz=0;}}
    const n=Math.hypot(dx,dz);if(n>0){dx/=n;dz/=n;}const p=body.translation();controller.computeColliderMovement(collider,{x:dx*.038,y:0,z:dz*.038});const m=controller.computedMovement();body.setNextKinematicTranslation({x:p.x+m.x,y:.9,z:p.z+m.z});world.step();scene.player.speed=Math.hypot(m.x,m.z)*60;
    if(n>0&&scene.player.speed<.05)scene.target=null;
    if(scene.player.speed>.2&&scene.time-lastStep>420){emit("lift-step");lastStep=scene.time;}sync();
    if(scene.player.z< -6.7&&scene.opened){scene.phase="won";scene.target=null;scene.status="地面层。早安，夜班人。";emit("lift-arrive");sync();}
  }
  sync();
  return{scene,effects:[],interact,primary,secondary,retry,
    step(ms){if(!active||!Number.isFinite(ms)||ms<=0)return;accumulator+=Math.min(50,ms);while(accumulator>=1000/60){accumulator-=1000/60;fixed();}},
    pointer(type,x,y,_kind,detail){if(!active||![x,y].every(Number.isFinite)||x<0||x>960||y<0||y>540)return false;
      if(type==="down"){press={x,y,lastX:x,lastY:y,moved:0};return true;}
      if(type==="move"&&press){scene.player.yaw-=(x-press.lastX)*.005;scene.player.pitch=Math.max(-.65,Math.min(.65,scene.player.pitch-(y-press.lastY)*.003));press.moved+=Math.hypot(x-press.lastX,y-press.lastY);press.lastX=x;press.lastY=y;sync();return true;}
      if(type==="up"&&press){const click=press.moved<12;press=null;if(!click)return true;if(detail?.entity)return interact(detail.entity);if(detail?.floor&&[detail.floor.x,detail.floor.z].every(Number.isFinite)&&Math.abs(detail.floor.x)<2.9&&detail.floor.z> -8.8&&detail.floor.z<5.2){scene.target={x:detail.floor.x,z:detail.floor.z};return true;}return primary();}return false;},
    key(key,down){if(!active)return false;if(["w","a","s","d","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(key)){if(down)keys.add(key);else keys.delete(key);return true;}if([" ","Enter","e"].includes(key)){if(down)primary();return true;}return false;},
    cancel(){keys.clear();press=null;scene.target=null;},setLevel(n){return n===0&&retry();},
    snapshot(){return{id:scene.id,level:0,phase:scene.phase,time:scene.time,score:scene.score,progress:scene.progress,goal:3,status:scene.status,abilityAvailable:true,focus:scene.focus?.id??null,power:scene.power};},
    stop(){if(!active)return;keys.clear();press=null;scene.target=null;active=false;},destroy(){if(disposed)return;this.stop();disposed=true;world.free();},
  };
}
export function paintLift() {}
