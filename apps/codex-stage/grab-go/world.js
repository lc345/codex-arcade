import {Matter as M} from '../vendor/matter.js';

export const FIELD={width:960,height:720,origin:{x:480,y:148},home:39,bottom:633,left:76,right:884};
export const ITEMS=Object.freeze({
  gold:{name:'金块',value:120,weight:2,r:32,sprite:0,color:'#f7c953'},
  gem:{name:'蓝宝石',value:200,weight:.8,r:25,sprite:1,color:'#38cbd1'},
  console:{name:'旧掌机',value:280,weight:2.8,r:34,sprite:2,color:'#f36d59'},
  robot:{name:'铁皮机器人',value:400,weight:4.8,r:44,sprite:3,color:'#95aca8'},
  rock:{name:'石头',value:25,weight:7,r:42,sprite:4,color:'#747c83'},
  anvil:{name:'废铁',value:40,weight:8,r:46,sprite:5,color:'#9c7761'},
  clock:{name:'闹钟',value:60,weight:1.4,r:30,sprite:6,color:'#ed7966',seconds:6},
  van:{name:'发条车',value:240,weight:2.3,r:35,sprite:7,color:'#77b9a5'},
});
const item=(id,kind,x,y,motion)=>({id,kind,x,y,...(motion?{motion}:{})});
export const STAGES=Object.freeze([
  {name:'街角初开张',seconds:42,goal:600,tempo:1.2,items:[
    item('a-gem','gem',340,310),item('a-gold','gold',610,300),item('a-console','console',695,475),item('a-robot','robot',240,545),
    item('a-rock','rock',480,405),item('a-gold-2','gold',423,580),item('a-clock','clock',165,410),item('a-gem-2','gem',792,583),
    item('a-rock-2','rock',180,275),item('a-anvil','anvil',795,355),item('a-console-2','console',560,580),
  ]},
  {name:'大件有大价',seconds:44,goal:900,tempo:1.32,items:[
    item('b-gem','gem',455,302),item('b-clock','clock',630,292),item('b-gold','gold',280,285),item('b-anvil','anvil',350,410),
    item('b-robot','robot',187,548),item('b-robot-2','robot',760,526),item('b-console','console',568,485),item('b-gem-2','gem',438,600),
    item('b-rock','rock',690,378),item('b-rock-2','rock',155,372),item('b-gold-2','gold',645,610),item('b-console-2','console',315,597),
  ]},
  {name:'宝贝会溜走',seconds:46,goal:1100,tempo:1.4,gate:true,items:[
    item('c-gold','gold',292,250),item('c-gem','gem',656,276),item('c-clock','clock',483,255),
    item('c-van','van',208,439,{range:74,speed:.74,offset:0}),item('c-van-2','van',706,557,{range:78,speed:.9,offset:1.7}),
    item('c-robot','robot',365,579),item('c-robot-2','robot',803,405),item('c-console','console',521,491),item('c-gem-2','gem',169,597),
    item('c-anvil','anvil',629,405),item('c-rock','rock',280,353),item('c-gold-2','gold',507,616),
  ]},
]);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const finite=(n,a,b)=>Number.isFinite(n)&&n>=a&&n<=b;
const angleAt=(s,stage,compact=false)=>Math.sin(s*STAGES[stage].tempo+.23)*Math.atan(Math.tan(1.08)*(compact?.56:1));
const point=(length,angle)=>({x:FIELD.origin.x+Math.sin(angle)*length,y:FIELD.origin.y+Math.cos(angle)*length});
const gateAt=time=>({x:480+Math.sin(time*.86)*144,y:347,w:144,h:19});

function readCheckpoint(cp){
  if(!cp||cp.version!==1||!Number.isInteger(cp.stage)||!STAGES[cp.stage])return null;
  const level=STAGES[cp.stage],known=new Set(level.items.map(i=>i.id));
  if(!Array.isArray(cp.collected)||new Set(cp.collected).size!==cp.collected.length||cp.collected.some(id=>!known.has(id)))return null;
  if(!finite(cp.time,0,100)||!finite(cp.sweep,0,100)||!finite(cp.length,FIELD.home,700)||!finite(cp.angle,-1.08,1.08)||!finite(cp.cooldown,0,.5))return null;
  if(!['aim','out','grip','back','deposit'].includes(cp.mode)||!['ready','playing','cleared','won','lost'].includes(cp.phase))return null;
  if(!Number.isInteger(cp.shots)||cp.shots<0||cp.shots>300||!Number.isInteger(cp.misses)||cp.misses<0||cp.misses>cp.shots||!Number.isInteger(cp.banked)||cp.banked<0||cp.banked>10000)return null;
  if(cp.grabId!==null){
    if(!known.has(cp.grabId)||cp.collected.includes(cp.grabId)||!['grip','back'].includes(cp.mode))return null;
    const b=cp.body;if(!b||!finite(b.x,-100,1060)||!finite(b.y,0,820)||!finite(b.angle,-100,100)||!finite(b.vx,-30,30)||!finite(b.vy,-30,30)||!finite(b.spin,-2,2)||!finite(b.ox,-70,70)||!finite(b.oy,-70,70))return null;
  }else if(cp.mode==='grip')return null;
  const score=level.items.filter(i=>cp.collected.includes(i.id)).reduce((n,i)=>n+ITEMS[i.kind].value,0);
  if(['cleared','won'].includes(cp.phase)&&(score<level.goal||cp.phase==='won'&&cp.stage!==2))return null;
  return {...Object.fromEntries(['stage','phase','time','sweep','length','angle','cooldown','mode','grabId','shots','misses','banked'].map(k=>[k,cp[k]])),compact:cp.compact===true,collected:[...cp.collected],body:cp.grabId?{...cp.body}:null};
}

export function createGrabWorld({stage=0,checkpoint,compact=false,onEvent=()=>{}}={}){
  const engine=M.Engine.create({gravity:{x:0,y:1,scale:.00065},positionIterations:8,constraintIterations:4});
  let active=true,disposed=false,accumulator=0,s,objects=[],gateBody=null,tether=null,lastEvent=null,serial=0;
  const emit=(type,extra={})=>{lastEvent={type,at:s.time,id:++serial,...extra};if(active&&!disposed)onEvent(lastEvent);};
  const definition=()=>STAGES[s.stage];
  const score=()=>objects.filter(o=>o.collected).reduce((n,o)=>n+ITEMS[o.kind].value,0);
  const bonus=()=>objects.filter(o=>o.collected).reduce((n,o)=>n+(ITEMS[o.kind].seconds||0),0);
  const remaining=()=>Math.max(0,definition().seconds+bonus()-s.time);
  const mapX=x=>480+(x-480)*(compact?.56:1);
  const gateNow=()=>{const g=gateAt(s.time);return {...g,x:mapX(g.x),w:g.w*(compact?.56:1)};};
  function reset(index,banked=0){
    M.Composite.clear(engine.world,false);M.Engine.clear(engine);tether=null;gateBody=null;accumulator=0;lastEvent=null;
    s={stage:index,phase:'ready',mode:'aim',time:0,sweep:0,length:FIELD.home,angle:angleAt(0,index,compact),cooldown:0,grabId:null,shots:0,misses:0,banked,resuming:false,compact};
    objects=STAGES[index].items.map((o,n)=>{const spec=ITEMS[o.kind],x=mapX(o.x),radius=spec.r*(compact?.8:1),body=M.Bodies.circle(x,o.y,radius*.88,{label:o.id,frictionAir:.025,restitution:.15});M.Body.setStatic(body,true);M.Body.setAngle(body,(n%3-1)*.13);M.Composite.add(engine.world,body);return {...o,x,radius,motion:o.motion?{...o.motion,range:o.motion.range*(compact?.56:1)}:null,collected:false,body};});
    if(STAGES[index].gate){const g=gateNow();gateBody=M.Bodies.rectangle(g.x,g.y,g.w,g.h,{isStatic:true,label:'gate'});M.Composite.add(engine.world,gateBody);}
  }
  function attach(o,saved){
    const p=point(s.length,s.angle);s.grabId=o.id;
    M.Body.setStatic(o.body,false);M.Body.setMass(o.body,ITEMS[o.kind].weight);o.body.collisionFilter.mask=0;
    let offset;
    if(saved){M.Body.setPosition(o.body,{x:saved.x,y:saved.y});M.Body.setAngle(o.body,saved.angle);M.Body.setVelocity(o.body,{x:saved.vx,y:saved.vy});M.Body.setAngularVelocity(o.body,saved.spin);offset={x:saved.ox,y:saved.oy};}
    else offset={x:p.x-o.body.position.x,y:p.y-o.body.position.y};
    tether=M.Constraint.create({pointA:p,bodyB:o.body,pointB:offset,length:0,stiffness:.48,damping:.25});M.Composite.add(engine.world,tether);
  }
  function restore(cp){
    const data=readCheckpoint(cp);if(!data)return false;compact=data.compact;reset(data.stage,data.banked);Object.assign(s,Object.fromEntries(Object.entries(data).filter(([k])=>!['body','collected'].includes(k))));
    s.resuming=s.time>0;if(['ready','playing'].includes(s.phase))s.phase='ready';
    for(const o of objects){o.collected=data.collected.includes(o.id);if(o.collected)M.Composite.remove(engine.world,o.body);}
    setMoving();if(data.grabId)attach(objects.find(o=>o.id===data.grabId),data.body);return true;
  }
  function setMoving(){for(const o of objects)if(o.motion&&!o.collected&&o.id!==s.grabId){const m=o.motion;M.Body.setPosition(o.body,{x:o.x+Math.sin(s.time*m.speed+m.offset)*m.range,y:o.y});}if(gateBody){const g=gateNow();M.Body.setPosition(gateBody,{x:g.x,y:g.y});}}
  reset(Number.isInteger(stage)&&STAGES[stage]?stage:0);restore(checkpoint);
  const limit=()=>Math.min((FIELD.bottom-FIELD.origin.y)/Math.cos(s.angle),s.angle>0?(mapX(FIELD.right)-FIELD.origin.x)/Math.sin(s.angle):(mapX(FIELD.left)-FIELD.origin.x)/Math.sin(s.angle));
  function finish(phase){s.phase=phase;emit(phase==='lost'?'lose':'win',{final:phase==='won'});}
  function deliver(){
    const o=objects.find(o=>o.id===s.grabId);
    if(o){o.collected=true;M.Composite.remove(engine.world,o.body);M.Composite.remove(engine.world,tether);tether=null;s.grabId=null;
      emit('delivered',{kind:o.kind,value:ITEMS[o.kind].value,seconds:ITEMS[o.kind].seconds||0});
    }else{s.misses++;emit('miss');}
    s.mode='deposit';s.cooldown=.32;
    if(score()>=definition().goal)finish(s.stage===2?'won':'cleared');
    else if(remaining()===0)finish('lost');
  }
  function update(dt){
    if(s.phase!=='playing')return;s.time+=dt;setMoving();
    if(remaining()===0&&!s.grabId){finish('lost');return;}
    if(s.mode==='aim'){s.sweep+=dt;s.angle=angleAt(s.sweep,s.stage,compact);}
    else if(s.mode==='out'){
      const from=point(s.length,s.angle);s.length=Math.min(limit(),s.length+640*dt);const to=point(s.length,s.angle);
      const bodies=objects.filter(o=>!o.collected).map(o=>o.body);if(gateBody)bodies.push(gateBody);
      const hits=M.Query.ray(bodies,from,to,7).sort((a,b)=>M.Vector.magnitude(M.Vector.sub(a.bodyA.position,from))-M.Vector.magnitude(M.Vector.sub(b.bodyA.position,from)));
      if(hits.length){const body=hits[0].bodyA===gateBody?gateBody:objects.find(o=>o.body===hits[0].bodyA)?.body;
        if(body===gateBody){s.mode='back';emit('blocked',{x:to.x,y:to.y});}
        else if(body){const o=objects.find(o=>o.body===body);attach(o);s.mode='grip';s.cooldown=.16;emit('catch',{kind:o.kind,x:to.x,y:to.y});}
      }else if(s.length>=limit()-.01){s.mode='back';emit('empty',{x:to.x,y:to.y});}
    }else if(s.mode==='grip'){s.cooldown=Math.max(0,s.cooldown-dt);if(s.cooldown===0)s.mode='back';}
    else if(s.mode==='back'){
      const o=objects.find(o=>o.id===s.grabId),speed=o?440/(.85+ITEMS[o.kind].weight*.32):600;
      s.length=Math.max(FIELD.home,s.length-speed*dt);
    }else if(s.mode==='deposit'){s.cooldown=Math.max(0,s.cooldown-dt);if(s.cooldown===0){s.mode='aim';s.sweep+=.32;s.angle=angleAt(s.sweep,s.stage,compact);}}
    if(tether){const p=point(s.length,s.angle);tether.pointA.x=p.x;tether.pointA.y=p.y;}
    M.Engine.update(engine,dt*1000);
    if(s.mode==='back'&&s.length===FIELD.home){const o=objects.find(o=>o.id===s.grabId),p=point(s.length,s.angle);if(!o||Math.hypot(o.body.position.x-p.x,o.body.position.y-p.y)<o.radius+38)deliver();}
  }
  const api={
    begin(){if(!active||disposed||s.phase!=='ready')return false;s.phase='playing';emit('start');return true;},
    tap(){if(!active||disposed||s.phase!=='playing'||s.mode!=='aim')return false;s.mode='out';s.shots++;emit('launch');return true;},
    cancel(){},
    step(ms){if(!active||disposed||s.phase!=='playing'||!Number.isFinite(ms)||ms<=0)return;accumulator+=Math.min(50,ms);while(accumulator>=1000/120){accumulator-=1000/120;update(1/120);}},
    snapshot(){return {...s,active,origin:{...FIELD.origin},hook:point(s.length,s.angle),score:score(),goal:definition().goal,bonus:bonus(),remaining:remaining(),collected:objects.filter(o=>o.collected).length,constraints:tether?1:0,gate:gateBody?gateNow():null,lastEvent:lastEvent?{...lastEvent}:null,
      items:objects.map(o=>({id:o.id,kind:o.kind,x:o.body.position.x,y:o.body.position.y,angle:o.body.angle,r:o.radius,collected:o.collected,moving:Boolean(o.motion)}))};},
    checkpoint(){const o=objects.find(o=>o.id===s.grabId);return {version:1,...Object.fromEntries(['stage','phase','time','sweep','length','angle','cooldown','mode','grabId','shots','misses','banked','compact'].map(k=>[k,s[k]])),collected:objects.filter(o=>o.collected).map(o=>o.id),body:o?{x:o.body.position.x,y:o.body.position.y,angle:o.body.angle,vx:o.body.velocity.x,vy:o.body.velocity.y,spin:o.body.angularVelocity,ox:tether.pointB.x,oy:tether.pointB.y}:null};},
    retry(){if(!active||disposed)return false;reset(s.stage,s.banked);return true;},
    next(){if(!active||disposed||s.phase!=='cleared'||s.stage===2)return false;reset(s.stage+1,s.banked+score());return true;},
    restart(){if(!active||disposed)return false;reset(0);return true;},
    stop(){active=false;},
    resume(){if(disposed)return false;const cp=api.checkpoint();active=true;restore(cp);return true;},
    destroy(){if(disposed)return;active=false;disposed=true;M.Composite.clear(engine.world,false);M.Engine.clear(engine);},
  };
  return api;
}
