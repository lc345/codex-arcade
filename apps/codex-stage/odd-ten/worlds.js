import {createOddKit,linesCross} from './kit.js';
import {Matter as M} from '../vendor/matter.js';

export function createVault(options){
  const {k,s,api,bind,gain,miss}=createOddKit('velvet-vault',options);
  const delta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
  function target(){s.target=(1.2+s.progress*1.71+s.stage*.38)%(Math.PI*2);s.direction=s.progress%2?-1:1;}
  bind({reset(){Object.assign(s,{goal:4+s.stage,angle:0,tolerance:.23-s.stage*.035,limit:42});target();},tick(dt){if(s.held)s.angle=(s.angle+s.direction*(1.65+s.stage*.2)*dt+Math.PI*2)%(Math.PI*2);},up(){if(Math.abs(delta(s.angle,s.target))<s.tolerance){gain();target();}else miss('警铃响了，金库锁定');}});return api;
}

export function createWash(options){
  const {k,s,api,bind,clamp}=createOddKit('power-wash',options);let cells=[];
  bind({reset(){s.goal=130;s.limit=36-s.stage*2;s.jammed=false;s.controlPoint={x:200,y:160};cells=Array.from({length:144},(_,i)=>({x:196+i%16*38,y:154+Math.floor(i/16)*40,dirt:1}));},tick(dt){
    s.heat=clamp(s.heat+(s.held&&!s.jammed?.27:-.75)*dt,0,1);if(s.heat>=1&&!s.jammed){s.jammed=true;k.event('miss');}if(s.jammed&&s.heat<.12)s.jammed=false;
    if(s.held&&!s.jammed){let cleaned=false;for(const c of cells)if(c.dirt>0&&Math.hypot(c.x-s.controlPoint.x,c.y-s.controlPoint.y)<59){c.dirt=Math.max(0,c.dirt-dt*(5-s.stage*.7));if(c.dirt===0){s.progress++;s.score+=10;cleaned=true;}}if(cleaned)k.event('break',{...s.controlPoint});if(s.progress>=s.goal)k.finish(true,'原来是一整面彩色壁画');}
  },down(p){s.controlPoint={...p};},read:()=>({cells}),restoreCompleted(){for(const c of cells)c.dirt=0;}});return api;
}

export function createZipper(options){
  const {k,s,api,bind,clamp,dist}=createOddKit('zipper-run',options);
  const lane=y=>480+Math.sin((y-118)*(.013+s.stage*.003))*115;
  bind({reset(){s.goal=410;s.limit=25;s.y=120;s.x=lane(s.y);s.wear=0;s.width=58-s.stage*10;s.controlPoint={x:s.x,y:s.y};s.path=Array.from({length:83},(_,i)=>({x:lane(120+i*5),y:120+i*5}));},tick(dt){if(!s.held)return;const p=s.controlPoint;s.x+=clamp(p.x-s.x,-480*dt,480*dt);s.y+=clamp(p.y-s.y,0,210*dt);const off=Math.abs(s.x-lane(s.y));s.wear=clamp(s.wear+(off>s.width/2?1.8:-.18)*dt,0,1);s.progress=Math.max(0,s.y-120);s.score=Math.floor(s.progress);if(s.wear>=1)k.finish(false,'拉链脱轨了');if(s.y>=530){s.progress=s.goal;k.finish(true,'一拉到底，严丝合缝');}},down(p){if(dist(p,{x:s.x,y:s.y})>65){s.held=false;return false;}s.controlPoint={...p};},read:()=>({ball:{x:s.x+150,y:s.y}})});return api;
}

export function createAlarm(options){
  const {s,api,bind,gain,miss}=createOddKit('alarm-alley',options);let clocks=[],serial=0,next=0;
  bind({reset(){s.goal=8+s.stage*2;s.limit=30;serial=0;next=.4;clocks=Array.from({length:9},(_,i)=>({x:300+i%3*180,y:185+Math.floor(i/3)*140,mode:'sleep',until:0}));s.controlPoint={x:480,y:325};},tick(){for(const c of clocks)if(c.mode==='ring'&&s.time>c.until){c.mode='sleep';miss('闹钟把整栋楼叫醒了');}if(s.time>=next){const c=clocks[(serial*5+s.stage*2)%9];c.mode='ring';c.until=s.time+1.35-s.stage*.17;serial++;next=s.time+.96-s.stage*.12;}},down(p){const c=clocks.find(c=>Math.hypot(c.x-p.x,c.y-p.y)<62);if(!c||c.mode!=='ring'){miss('敲醒了睡着的闹钟');return;}c.mode='sleep';gain(c.x,c.y);},read:()=>({clocks})});return api;
}

export function createLander(options){
  const {k,s,api,bind,clamp}=createOddKit('lunar-lease',options);let engine,ship;
  bind({reset(){engine=M.Engine.create({gravity:{x:0,y:1,scale:.00055}});ship=M.Bodies.rectangle(260,160,48,38,{inertia:Infinity,frictionAir:.006});M.Composite.add(engine.world,ship);s.pad={x:[480,670,340][s.stage],y:530,w:160-s.stage*32};s.controlPoint={x:260,y:160};s.fuel=8-s.stage;s.goal=1;s.limit=22;},tick(dt){
    const desired=clamp((s.controlPoint.x-ship.position.x)*.032,-3,3);M.Body.setVelocity(ship,{x:ship.velocity.x+(desired-ship.velocity.x)*Math.min(1,dt*4),y:ship.velocity.y});
    if(s.held&&s.fuel>0){M.Body.applyForce(ship,ship.position,{x:0,y:-ship.mass*.00112});s.fuel-=dt;}
    M.Engine.update(engine,dt*1000);const b=ship.position;
    if(b.y<82||b.x<90||b.x>870)k.finish(false,'飞出了安全着陆区');
    if(b.y+25>=s.pad.y){if(Math.abs(b.x-s.pad.x)<s.pad.w/2-24&&ship.velocity.y<2.9&&Math.abs(ship.velocity.x)<1.4){s.progress=1;s.score=100;k.finish(true,'轻落月面，停车成功');}else k.finish(false,'着陆太重，或者停错了位置');}
  },read:()=>({ship:{x:ship.position.x,y:ship.position.y,vx:ship.velocity.x,vy:ship.velocity.y}}),dispose(){M.Composite.clear(engine.world,false);M.Engine.clear(engine);}});return api;
}

export function createJelly(options){
  const {k,s,api,bind,clamp,gain}=createOddKit('jelly-shift',options);let gates=[];
  bind({reset(){s.goal=5+s.stage;s.limit=35;s.distance=0;s.squash=0;s.speed=150+s.stage*25;gates=Array.from({length:s.goal},(_,i)=>({x:620+i*360,low:(i+s.stage)%2===0,clearance:(i+s.stage)%2===0?55:58,passed:false}));},tick(dt){s.distance+=s.speed*dt;s.squash=clamp(s.squash+(s.held?2.6:-2.6)*dt,0,1);s.width=38+s.squash*66;s.height=112-s.squash*77;
    for(const gate of gates){const dx=gate.x-(s.distance+200);if(Math.abs(dx)<45&&!gate.passed){if(gate.low?s.height>gate.clearance:s.width>gate.clearance){k.finish(false,'果冻卡在门框上了');return;}}if(dx< -48&&!gate.passed){gate.passed=true;gain(200,475);}}
  },read:()=>({gates,width:38+s.squash*66,height:112-s.squash*77})});return api;
}

export function createBaggage(options){
  const {s,api,bind,dist,gain,miss}=createOddKit('baggage-boogie',options);let bags=[],next=0,serial=0,drag=null;
  bind({reset(){s.goal=6+s.stage;s.limit=34;s.bins=[{x:275,y:503,type:0},{x:685,y:503,type:1}];s.controlPoint={x:120,y:285};bags=[];next=.2;serial=0;drag=null;},tick(dt){if(s.time>next){bags.push({id:serial,x:115,y:275,type:(serial+s.stage)%2});serial++;next=s.time+1.65-s.stage*.15;}for(const b of bags){if(b.id!==drag)b.x+=(77+s.stage*17)*dt;if(b.x>890){b.dead=true;miss('行李错过了航班');}}bags=bags.filter(b=>!b.dead);},down(p){const b=bags.find(b=>dist(b,p)<48);drag=b?.id??null;if(drag===null){s.held=false;return false;}},move(p){const b=bags.find(b=>b.id===drag);if(b&&s.held){b.x=p.x;b.y=p.y;}},up(p){const b=bags.find(b=>b.id===drag),bin=s.bins.find(b=>dist(b,p)<85);if(b&&bin){b.dead=true;if(b.type===bin.type)gain(bin.x,bin.y);else miss('行李送错出口');}else if(b)b.y=275;drag=null;},clear(){const b=bags.find(b=>b.id===drag);if(b)b.y=275;drag=null;},read:()=>({bags,drag})});return api;
}

export function createFuse(options){
  const {k,s,api,bind,gain}=createOddKit('fuse-salon',options);let wires=[],last=null,wave=0;
  function refill(){wires=[155,245,405,495].map((y,i)=>({x1:160,x2:805,y,cut:false,burn:160,rate:70+s.stage*16+wave*10+i*5}));}
  bind({reset(){s.goal=(s.stage+1)*4;s.limit=35;s.power={a:{x:100,y:325},b:{x:860,y:325}};wave=0;last=null;refill();},tick(dt){for(const w of wires){if(!w.cut){w.burn+=w.rate*dt;if(w.burn>=w.x2)k.finish(false,'火星追到炸弹了');}}if(wires.every(w=>w.cut)&&s.phase==='playing'){wave++;refill();}},down(p){last={...p};},move(p){if(!s.held||!last)return;if(linesCross(last,p,s.power.a,s.power.b)){k.finish(false,'剪到了金色供电线');last=null;return;}for(const w of wires)if(!w.cut&&linesCross(last,p,{x:w.burn+10,y:w.y},{x:w.x2-30,y:w.y})){w.cut=true;gain(p.x,w.y);}last={...p};},clear(){last=null;},read:()=>({wires,wave,cutPoint:last})});return api;
}

export function createTower(options){
  const {k,s,api,bind}=createOddKit('tower-unplug',options);let engine,blocks=[],roof,tether=null,settle=0;
  function release(){if(tether){M.Composite.remove(engine.world,tether);tether=null;}}
  bind({reset(){release();engine=M.Engine.create({gravity:{x:0,y:1,scale:.0007},positionIterations:8});M.Composite.add(engine.world,M.Bodies.rectangle(480,569,760,40,{isStatic:true}));blocks=Array.from({length:9},(_,i)=>{const b=M.Bodies.rectangle(480,535-i*29,176,27,{friction:.009,frictionStatic:.015,restitution:0,frictionAir:.015});b.plugin.order=i;return b;});roof=M.Bodies.rectangle(480,249,128,28,{friction:.006,frictionAir:.02});M.Composite.add(engine.world,[...blocks,roof]);s.goal=3+s.stage;s.limit=55;s.controlPoint={x:480,y:448};settle=0;},tick(dt){M.Engine.update(engine,dt*1000);for(const b of [...blocks])if(Math.abs(b.position.x-480)>225){if(tether?.bodyB===b)release();M.Composite.remove(engine.world,b);blocks=blocks.filter(v=>v!==b);s.progress++;s.score+=100;k.event('catch',{x:b.position.x,y:b.position.y});}
    if(Math.abs(roof.angle)>.55||Math.abs(roof.position.x-480)>100||roof.position.y>530){k.finish(false,'楼顶失去平衡了');return;}
    if(s.progress>=s.goal){settle=Math.abs(roof.velocity.y)<.4?settle+dt:0;if(settle>.6)k.finish(true,'抽走木板，屋顶还稳稳的');}
  },down(p){if(tether)return false;const hit=M.Query.point(blocks,p)[0];if(!hit){s.held=false;return false;}tether=M.Constraint.create({pointA:{...p},bodyB:hit,pointB:{x:p.x-hit.position.x,y:p.y-hit.position.y},stiffness:.035,damping:.2,length:0});M.Composite.add(engine.world,tether);},move(p){if(tether&&s.held)tether.pointA={...p};},up:release,clear:release,read:()=>({blocks:blocks.map(b=>({id:b.plugin.order,x:b.position.x,y:b.position.y,angle:b.angle})),roof:{x:roof.position.x,y:roof.position.y,angle:roof.angle},drag:tether?.bodyB.plugin.order??null}),dispose(){release();M.Composite.clear(engine.world,false);M.Engine.clear(engine);}});return api;
}

export function createSugar(options){
  const {k,s,api,bind}=createOddKit('sugar-snip',options);let engine,candy,rope;
  bind({reset(){engine=M.Engine.create({gravity:{x:0,y:1,scale:.0007},constraintIterations:4});candy=M.Bodies.circle(300,220,22,{frictionAir:0,restitution:.1});rope=M.Constraint.create({pointA:{x:480,y:100},bodyB:candy,length:216,stiffness:.95});M.Composite.add(engine.world,[candy,rope]);s.anchor={x:480,y:100};s.cut=false;s.basket={x:590,y:510,w:130-s.stage*22};s.goal=1;s.limit=22;},tick(dt){s.basket.x=590+(s.stage?Math.sin(s.time*.85)*105:0);M.Engine.update(engine,dt*1000);if(s.cut&&candy.position.y+22>=s.basket.y){if(Math.abs(candy.position.x-s.basket.x)<s.basket.w/2-22){s.progress=1;s.score=100;k.finish(true,'正好一口甜');}else k.finish(false,'糖果擦过了罐口');}},down(){if(!s.cut){M.Composite.remove(engine.world,rope);s.cut=true;k.event('launch');}},read:()=>({candy:{x:candy.position.x,y:candy.position.y,vx:candy.velocity.x,vy:candy.velocity.y,angle:candy.angle}}),dispose(){M.Composite.clear(engine.world,false);M.Engine.clear(engine);}});return api;
}

export const ODD_WORLDS={'velvet-vault':createVault,'power-wash':createWash,'zipper-run':createZipper,'alarm-alley':createAlarm,'lunar-lease':createLander,'jelly-shift':createJelly,'baggage-boogie':createBaggage,'fuse-salon':createFuse,'tower-unplug':createTower,'sugar-snip':createSugar};
