import { Matter } from "../vendor/matter.js";

export function createRainlineWorld(options = {}) {
  const { Engine, Bodies, Body, Composite, Query } = Matter;
  const engine = Engine.create(); engine.gravity.y = 1.1;
  const scene = { id: "rainline", level: 0, phase: "playing", time: 0, score: 0, progress: 0, goal: 3, awaiting: true,
    player: { x: 90, y: 416, vy: 0, facing: 1 }, camera: 0, grounded: true, jumps: 0, dash: 0, cooldown: 0, flash: 0,
    parcels: [{ x: 410, y: 387, found: false }, { x: 1170, y: 387, found: false }, { x: 1900, y: 387, found: false }],
    gaps: [[760, 890], [1550, 1680]], platforms: [{ x: 600, y: 390, w: 90, h: 50 }, { x: 1370, y: 378, w: 100, h: 62 }, { x: 2080, y: 390, w: 110, h: 50 }],
    status: "三封急件，赶在末班车之前。", primaryLabel: "起跑 / 跳跃", secondaryLabel: "冲刺" };
  const grounds = [[380, 470, 760, 60], [1220, 470, 660, 60], [2190, 470, 1020, 60], ...scene.platforms.map(p => [p.x, p.y + p.h/2, p.w, p.h])].map(([x,y,w,h]) => Bodies.rectangle(x,y,w,h,{isStatic:true,friction:0}));
  const body = Bodies.rectangle(90,416,22,46,{friction:0,frictionAir:0,restitution:0,inertia:Infinity}); Composite.add(engine.world,[...grounds,body]);
  let active = true, disposed = false, accumulator = 0, direction = 1, safe = 90;
  const keys = new Set(), effects = [], emit = type => { if(active) options.onEvent?.({type}); };
  function sync() { Object.assign(scene.player,{x:body.position.x,y:body.position.y,vy:body.velocity.y,facing:direction});scene.camera=Math.max(0,Math.min(1760,body.position.x-270));scene.progress=scene.parcels.filter(p=>p.found).length;scene.score=scene.progress*500;scene.primaryLabel=scene.awaiting?"起跑 / 跳跃":"跳跃"; }
  function primary() {
    if(!active)return false;if(scene.phase==="won")return retry();scene.awaiting=false;
    if(scene.jumps>=2)return false;scene.jumps++;scene.grounded=false;Body.setVelocity(body,{x:body.velocity.x,y:scene.jumps===1?-10.1:-8.7});emit("rain-jump");sync();return true;
  }
  function secondary(){if(!active||scene.phase!=="playing"||scene.cooldown>0)return false;scene.awaiting=false;scene.dash=180;scene.cooldown=1500;emit("rain-dash");return true;}
  function retry(){if(!active)return false;scene.parcels.forEach(p=>p.found=false);Object.assign(scene,{phase:"playing",awaiting:true,time:0,flash:0,dash:0,cooldown:0,jumps:0,grounded:true,status:"三封急件，赶在末班车之前。"});safe=90;keys.clear();direction=1;Body.setPosition(body,{x:90,y:416});Body.setVelocity(body,{x:0,y:0});accumulator=0;sync();return true;}
  function fixed(){
    scene.time+=1000/60;scene.flash=Math.max(0,scene.flash-1000/60);scene.cooldown=Math.max(0,scene.cooldown-1000/60);scene.dash=Math.max(0,scene.dash-1000/60);
    if(scene.awaiting||scene.phase!=="playing")return;
    direction=keys.has("ArrowLeft")||keys.has("a")?-1:1;
    Body.setVelocity(body,{x:direction*(scene.dash>0?7:3.15),y:body.velocity.y});Engine.update(engine,1000/60);
    scene.grounded=body.velocity.y>=-.1&&Query.ray(grounds,{x:body.position.x,y:body.position.y+22},{x:body.position.x,y:body.position.y+28},16).length>0;
    if(scene.grounded)scene.jumps=0;
    for(const p of scene.parcels)if(!p.found&&Math.abs(p.x-body.position.x)<38&&Math.abs(p.y-body.position.y)<95){p.found=true;safe=p.x+50;scene.flash=600;emit("rain-parcel");scene.status=`急件 ${scene.parcels.filter(q=>q.found).length} / 3 · 邮袋收妥`;}
    if(body.position.y>610||body.position.x<20){Body.setPosition(body,{x:safe,y:360});Body.setVelocity(body,{x:0,y:0});scene.jumps=0;scene.flash=500;emit("rain-fall");scene.status="雨棚接住了你，继续这一段。";}
    if(body.position.x>2490){if(scene.parcels.every(p=>p.found)){scene.phase="won";scene.status="末班车等到了你。三封信，准时送达。";emit("rain-delivered");}else{const p=scene.parcels.find(p=>!p.found);Body.setPosition(body,{x:p.x-130,y:350});scene.status="还有一封急件，回去取上它。";}}
    sync();
  }
  sync();
  return {scene,effects,primary,secondary,retry,
    step(ms){if(!active||!Number.isFinite(ms)||ms<=0)return;accumulator+=Math.min(ms,50);while(accumulator>=1000/60){accumulator-=1000/60;fixed();}},
    pointer(type,x,y){if(!active||![x,y].every(Number.isFinite)||x<0||x>960||y<0||y>540)return false;if(type==="down")return x>835&&y>450?secondary():primary();return type==="up";},
    key(key,down){if(!active)return false;if([" ","Enter","ArrowUp","w"].includes(key)){if(down)primary();return true;}if(["ArrowLeft","ArrowRight","a","d"].includes(key)){if(down){keys.add(key);scene.awaiting=false;}else keys.delete(key);return true;}return false;},
    cancel(){keys.clear();},setLevel(n){return n===0&&retry();},
    snapshot(){return {id:scene.id,level:0,phase:scene.phase,time:scene.time,score:scene.score,progress:scene.progress,goal:3,status:scene.status,abilityAvailable:scene.cooldown<=0};},
    stop(){if(!active)return;keys.clear();active=false;},destroy(){if(disposed)return;this.stop();disposed=true;Composite.clear(engine.world,false);Engine.clear(engine);},
  };
}

export function paintRainline() {}
