import {createOddKit} from '../odd-ten/kit.js';
import {Matter as M} from '../vendor/matter.js';
import {splitGlass,glassStrokeCrosses} from './geometry.js';

export function createCrosswalk(options){
  const {k,s,api,bind,gain}=createOddKit('crosswalk-zero',options);let lanes=[],carBodies=[],player;
  bind({reset(){s.goal=6+s.stage*2;s.limit=40;s.row=0;s.jump=null;s.player={x:480,y:520};player=M.Bodies.circle(480,520,13);lanes=[];carBodies=[];for(let row=1;row<s.goal;row+=2){const lane={row,y:520-row*420/s.goal,speed:(row%4===1?1:-1)*(125+s.stage*35),offset:row*137,cars:[]};for(let i=0;i<2;i++){lane.cars.push({x:0,w:s.stage&&i===0?112:66});carBodies.push(M.Bodies.rectangle(0,lane.y,lane.cars[i].w,29));}lanes.push(lane);}},tick(dt){
    if(s.jump){s.jump.t=Math.min(1,s.jump.t+dt/.21);s.player.y=s.jump.from+(s.jump.to-s.jump.from)*s.jump.t;if(s.jump.t===1){s.jump=null;s.row++;gain(480,s.player.y);}}
    M.Body.setPosition(player,s.player);let n=0;for(const lane of lanes)for(let i=0;i<2;i++){const car=lane.cars[i];car.x=65+((lane.offset+i*510+s.time*lane.speed)%1020+1020)%1020;M.Body.setPosition(carBodies[n],{x:car.x,y:lane.y});if(M.Collision.collides(player,carBodies[n]))k.finish(false,'被车流撞回来了');n++;}
  },down(){if(s.jump)return false;s.jump={from:s.player.y,to:520-(s.row+1)*420/s.goal,t:0};k.event('launch');},read:()=>({lanes})});return api;
}

export function createDrill(options){
  const {k,s,api,bind,gain}=createOddKit('faultline-drill',options);let gates=[];
  bind({reset(){s.goal=6;s.limit=30;s.x=480;s.depth=0;s.direction=1;s.speed=110+s.stage*20;s.vx=172+s.stage*18;gates=[420,595,355,550,390,590].map((x,i)=>({x,y:300+i*245,gap:230-s.stage*34,passed:false}));s.trail=[];},tick(dt){s.depth+=s.speed*dt;s.x+=s.direction*s.vx*dt;if(s.x<205||s.x>755)k.finish(false,'钻头撞上了侧壁');for(const gate of gates){if(Math.abs(gate.y-s.depth)<32&&Math.abs(gate.x-s.x)>gate.gap/2-17)k.finish(false,'转向晚了，撞到岩层');if(gate.y<s.depth-35&&!gate.passed){gate.passed=true;gain(s.x,270);}}if(s.trail.length===0||s.depth-s.trail.at(-1).y>8){s.trail.push({x:s.x,y:s.depth});if(s.trail.length>70)s.trail.shift();}},down(){s.direction*=-1;k.event('launch');},read:()=>({gates})});return api;
}

export function createLaser(options){
  const {k,s,api,bind,clamp}=createOddKit('laser-limbo',options);let player,beams=[];
  bind({reset(){s.goal=1;s.limit=30;s.player={x:480,y:520};s.controlPoint={...s.player};s.target={x:480,y:91};s.gap=162-s.stage*26;s.bars=[180,310,440].map((y,i)=>({y,x:480,phase:i*1.6+s.stage*.5,rate:.75+s.stage*.17}));player=M.Bodies.circle(480,520,12);beams=Array.from({length:6},()=>M.Bodies.rectangle(0,0,700,8));},tick(dt){
    const dx=clamp(s.controlPoint.x,160,800)-s.player.x,dy=clamp(s.controlPoint.y,85,540)-s.player.y,d=Math.hypot(dx,dy),speed=Math.min(d,220*dt);if(d){s.player.x+=dx/d*speed;s.player.y+=dy/d*speed;}M.Body.setPosition(player,s.player);
    let n=0;for(const bar of s.bars){bar.x=480+Math.sin(s.time*bar.rate+bar.phase)*210;for(const side of [-1,1]){const edge=bar.x+side*s.gap/2;M.Body.setPosition(beams[n],{x:edge+side*350,y:bar.y});if(M.Collision.collides(player,beams[n]))k.finish(false,'擦到了红色激光');n++;}}
    if(Math.hypot(s.player.x-480,s.player.y-91)<19){s.progress=1;s.score=100;k.finish(true,'三道红线，穿过去了');}
  }});return api;
}

export function createBridge(options){
  const {k,s,api,bind,gain}=createOddKit('blackout-bridge',options);let route=[];
  bind({reset(){s.goal=4+s.stage;s.limit=32;s.mode='preview';s.previewUntil=3.4-s.stage*.35;s.row=0;s.chosen=[];route=[1,0,2,1,2,0].slice(0,s.goal).map(n=>(n+s.stage)%3);s.controlPoint={x:480,y:496};},tick(){if(s.time>=s.previewUntil)s.mode='recall';},down(p){if(s.mode!=='recall')return false;const col=Math.round((p.x-340)/140),y=496-s.row*65;if(col<0||col>2||Math.abs(p.x-(340+col*140))>53||Math.abs(p.y-y)>34)return false;s.chosen.push(col);if(col!==route[s.row]){k.finish(false,'这块石头沉下去了');return;}s.row++;gain(p.x,y);s.controlPoint={x:480,y:496-s.row*65};},read:()=>({hints:s.mode==='preview'?route.slice():[],passed:route.slice(0,s.row)})});return api;
}

export function createGlass(options){
  const {k,s,api,bind,dist}=createOddKit('glass-divide',options);let parts=[];
  bind({reset(){s.goal=1;s.limit=45;s.tolerance=[7,4,2][s.stage];s.attempts=3;s.mode='aim';s.cutStart=null;s.cutEnd=null;s.ratio=null;s.revealUntil=0;parts=[];s.polygon=[[[325,170],[595,145],[697,288],[630,470],[380,489],[273,332]],[[258,165],[717,272],[388,508]],[[316,185],[493,122],[713,211],[650,447],[422,508],[242,355]]][s.stage].map(([x,y])=>({x,y}));s.controlPoint={x:480,y:95};},tick(){if(s.mode==='reveal'&&s.time>=s.revealUntil){if(Math.abs(s.ratio-50)<=s.tolerance){s.progress=1;s.score=100;k.finish(true,'两半，刚刚好');}else if(s.attempts===0)k.finish(false,'三刀用完，下次再准一点');else{s.mode='aim';s.cutStart=null;s.cutEnd=null;parts=[];}}},down(p){if(s.mode!=='aim'){s.held=false;return false;}s.cutStart={...p};s.cutEnd={...p};},move(p){if(s.held&&s.cutStart)s.cutEnd={...p};},up(p){if(s.mode!=='aim'||!s.cutStart)return;const a=s.cutStart,b=p;if(dist(a,b)<80||!glassStrokeCrosses(s.polygon,a,b)){s.cutStart=null;s.cutEnd=null;return;}parts=splitGlass(s.polygon,a,b);if(parts.some(p=>p.length<3)){s.cutStart=null;parts=[];return;}s.cutEnd={...p};const a0=M.Vertices.area(parts[0]),a1=M.Vertices.area(parts[1]);s.ratio=100*a0/(a0+a1);s.attempts--;s.mode='reveal';s.revealUntil=s.time+.9;k.event('break',{x:480,y:310});},clear(){if(s.mode==='aim'){s.cutStart=null;s.cutEnd=null;}},read:()=>({parts})});return api;
}

export function createCoil(options){
  const {k,s,api,bind,gain}=createOddKit('neon-coil',options);let trail=[],food=[];
  bind({reset(){s.goal=4+s.stage;s.limit=35;s.head={x:2,y:2};s.direction=0;s.queued=false;s.nextStep=.7;s.interval=.28-s.stage*.035;trail=[{...s.head}];food=[{x:12,y:2},{x:12,y:8},{x:3,y:8},{x:3,y:3},{x:10,y:3},{x:10,y:6}];},tick(){if(s.time<s.nextStep)return;s.nextStep+=s.interval;if(s.queued){s.direction=(s.direction+1)%4;s.queued=false;}const d=[[1,0],[0,1],[-1,0],[0,-1]][s.direction],p={x:s.head.x+d[0],y:s.head.y+d[1]};if(p.x<0||p.x>15||p.y<0||p.y>9||trail.some(t=>t.x===p.x&&t.y===p.y)){k.finish(false,'撞上了自己留下的线路');return;}s.head=p;trail.push({...p});const f=food[s.progress];if(f&&p.x===f.x&&p.y===f.y)gain(210+p.x*36,137+p.y*36);},down(){if(s.queued)return false;s.queued=true;k.event('launch');},read:()=>({trail,food:food[s.progress]??null})});return api;
}

export function createFreeze(options){
  const {k,s,api,bind,clamp,gain}=createOddKit('freeze-frame',options);let saws=[];
  bind({reset(){s.goal=4;s.limit=28;s.distance=0;s.speed=130+s.stage*18;s.machineTime=0;s.cold=3.1-s.stage*.35;s.maxCold=s.cold;s.locked=false;saws=Array.from({length:4},(_,i)=>({x:380+i*360,phase:Math.PI/2-(380+i*360)/s.speed*2.2,y:330,passed:false}));},tick(dt){s.distance+=s.speed*dt;const frozen=s.held&&s.cold>0&&!s.locked;s.frozen=frozen;s.cold=clamp(s.cold+(frozen?-1:.7)*dt,0,s.maxCold);if(s.cold===0)s.locked=true;if(!s.held&&s.cold>.25)s.locked=false;if(!frozen)s.machineTime+=dt;
    for(const saw of saws){saw.y=350+Math.sin(s.machineTime*2.2+saw.phase)*137;const dx=saw.x-s.distance;if(Math.abs(dx)<53&&saw.y>409)k.finish(false,'锯片停得太低了');if(dx< -58&&!saw.passed){saw.passed=true;gain(210,475);}}
  },read:()=>({saws})});return api;
}

export function createBalance(options){
  const {k,s,api,bind}=createOddKit('copper-balance',options);let engine,beam,weights=[],serial=0,unsafe=0;
  const sequence=[1,2,1,3,2,1,3,1,2,2,1,3];
  function clear(){if(engine){M.Composite.clear(engine.world,false);M.Engine.clear(engine);}}
  bind({reset(){clear();engine=M.Engine.create({gravity:{x:0,y:1,scale:.00055},positionIterations:8});beam=M.Bodies.rectangle(480,335,450,18,{density:.002,friction:1,restitution:0});const pivot=M.Constraint.create({pointA:{x:480,y:335},bodyB:beam,length:0,stiffness:1});M.Composite.add(engine.world,[beam,pivot]);weights=[];serial=0;unsafe=0;s.goal=8+s.stage*2;s.limit=45;s.readyAt=.3;s.placed=0;s.nextWeight=sequence[s.stage];s.left=0;s.right=0;s.controlPoint={x:325,y:400};},tick(dt){beam.torque+=-beam.angle*1.8-beam.angularVelocity*50;M.Engine.update(engine,dt*1000);unsafe=Math.abs(beam.angle)>.34-s.stage*.025?unsafe+dt:0;if(unsafe>.35)k.finish(false,'天平失去平衡了');
    for(const w of weights){if(w.b.position.y>530||w.b.position.x<205||w.b.position.x>755)k.finish(false,'有货物滑下去了');if(!w.counted&&s.time-w.born>.9&&w.b.speed<.8){w.counted=true;s.progress++;s.score+=100;k.event('catch',{x:w.b.position.x,y:w.b.position.y});}}
    if(s.progress>=s.goal&&Math.abs(beam.angle)<.13)k.finish(true,'所有货物，稳稳装下');
  },down(p){if(s.time<s.readyAt||s.placed>=s.goal)return false;const side=p.x<480?-1:1,mass=sequence[(serial+s.stage)%sequence.length],count=weights.filter(w=>w.side===side).length,x=480+side*145*Math.cos(beam.angle),y=335+side*145*Math.sin(beam.angle)-60-count*25,b=M.Bodies.rectangle(x,y,54,24,{friction:1,frictionStatic:1,frictionAir:.025,restitution:0});M.Body.setMass(b,mass);M.Composite.add(engine.world,b);weights.push({b,side,mass,born:s.time,counted:false});serial++;s.placed++;s[side<0?'left':'right']+=mass;s.nextWeight=sequence[(serial+s.stage)%sequence.length];s.readyAt=s.time+.95;k.event('launch');},read:()=>({angle:beam.angle,weights:weights.map(w=>({x:w.b.position.x,y:w.b.position.y,angle:w.b.angle,mass:w.mass,side:w.side,counted:w.counted}))}),dispose:clear});return api;
}

export function createTraffic(options){
  const {k,s,api,bind}=createOddKit('traffic-tangle',options);let cars=[],next=[0,.6],bodies=new Map(),serial=0;
  bind({reset(){s.goal=12+s.stage*4;s.limit=45;s.green=0;s.amberUntil=0;s.passed=[0,0];s.queues=[0,0];s.speed=165+s.stage*25;cars=[];next=[.1,.65];bodies.clear();serial=0;},tick(dt){
    for(let axis=0;axis<2;axis++)if(s.time>=next[axis]){const car={id:serial++,axis,pos:-60,x:0,y:0};cars.push(car);bodies.set(car.id,M.Bodies.rectangle(0,0,axis?26:46,axis?46:26));next[axis]=s.time+1.5-s.stage*.12;}
    for(let axis=0;axis<2;axis++){const lane=cars.filter(c=>c.axis===axis).sort((a,b)=>b.pos-a.pos),stop=axis?186:291;let ahead=10000;s.queues[axis]=0;for(const car of lane){let target=car.pos+s.speed*dt;if(car.pos<=stop&&(s.green!==axis||s.time<s.amberUntil))target=Math.min(target,stop);target=Math.min(target,ahead-63);if(target-car.pos<s.speed*dt*.5)s.queues[axis]++;car.pos=target;ahead=target;car.x=axis?480:120+car.pos;car.y=axis?70+car.pos:335;M.Body.setPosition(bodies.get(car.id),car);}}
    for(const a of cars)for(const b of cars)if(a.id<b.id&&a.axis!==b.axis&&M.Collision.collides(bodies.get(a.id),bodies.get(b.id)))k.finish(false,'路口发生碰撞');
    for(const c of cars)if(c.pos>(c.axis?530:790)){s.passed[c.axis]++;s.progress++;s.score+=100;k.event('catch',{x:c.x,y:c.y});bodies.delete(c.id);c.done=true;}cars=cars.filter(c=>!c.done);
    if(Math.max(...s.queues)>=6)k.finish(false,'一侧已经排不下了');if(s.progress>=s.goal&&Math.min(...s.passed)>=3)k.finish(true,'高峰过去，路口通畅');
  },down(){if(s.time<s.amberUntil)return false;s.green=1-s.green;s.amberUntil=s.time+.8;k.event('launch');},read:()=>({cars})});return api;
}

export function createShield(options){
  const {k,s,api,bind,gain,miss}=createOddKit('shield-waltz',options);let bolts=[],serial=0,next=0;
  bind({reset(){s.goal=8+s.stage*2;s.limit=32;s.angle=0;s.width=.44-s.stage*.065;s.controlPoint={x:650,y:320};bolts=[];serial=0;next=.2;},tick(dt){s.angle=Math.atan2(s.controlPoint.y-320,s.controlPoint.x-480);if(s.time>next){bolts.push({id:serial,angle:(serial*2.399+s.stage*.7)%(Math.PI*2),radius:285,checked:false});serial++;next=s.time+.96-s.stage*.12;}
    for(const b of bolts){b.radius-=(142+s.stage*25)*dt;if(b.radius<=144&&!b.checked){b.checked=true;const d=Math.abs(Math.atan2(Math.sin(b.angle-s.angle),Math.cos(b.angle-s.angle)));if(d<s.width){b.dead=true;gain(480+Math.cos(b.angle)*144,320+Math.sin(b.angle)*144);}}if(b.radius<34&&!b.dead){b.dead=true;miss('核心失去防护了');}}
    bolts=bolts.filter(b=>!b.dead);
  },read:()=>({bolts})});return api;
}

export const CHALLENGE_WORLDS={'crosswalk-zero':createCrosswalk,'faultline-drill':createDrill,'laser-limbo':createLaser,'blackout-bridge':createBridge,'glass-divide':createGlass,'neon-coil':createCoil,'freeze-frame':createFreeze,'copper-balance':createBalance,'traffic-tangle':createTraffic,'shield-waltz':createShield};
