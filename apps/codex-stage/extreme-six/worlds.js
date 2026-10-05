import {createOddKit} from '../odd-ten/kit.js';
import {hardPhysics} from '../hardcore-ten/physics.js';
import {extremeRules} from './rules.js';

export function createRazor(options={}){
  const {k,s,api,bind}=createOddKit('razor-wings',options),{waveY}=extremeRules();
  bind({reset(){s.goal=10+s.stage*4;s.limit=28;s.speed=[215,245,275][s.stage];s.halfWidth=[32,25,19][s.stage];s.points=Array.from({length:s.goal+2},(_,i)=>({x:160+i*185,y:[320,190,375,235,420,270,150,345,200,385,230,405,220,360,180,335,190,405,245,340][i]}));s.player={x:160,y:320};s.camera=0;s.trail=[];},
    tick(dt){s.player.x+=s.speed*dt;s.player.y+=(s.held?-1:1)*s.speed*1.24*dt;s.camera=Math.max(0,s.player.x-235);s.trail.push({...s.player});if(s.trail.length>60)s.trail.shift();if(Math.abs(s.player.y-waveY(s.points,s.player.x))>s.halfWidth-6){k.finish(false,'晶壁擦翼，整段重飞');return;}const passed=Math.min(s.goal,Math.floor((s.player.x-160)/185));if(passed>s.progress){s.progress=passed;s.score+=100;k.event('catch',{x:235,y:s.player.y});}if(s.progress===s.goal)k.finish(true,'十八折，翼尖没碰过墙');},down(){},up(){}});return api;
}

export function createWall(options={}){
  const {k,s,api,bind}=createOddKit('wall-rebound',options),p=hardPhysics();let body;
  bind({reset(){p.M.Composite.clear(p.engine.world,false);p.engine.gravity.y=1.2;s.goal=6+s.stage*2;s.limit=40;s.halfGrip=[28,21,14][s.stage];let y=480;s.grips=Array.from({length:s.goal+1},(_,i)=>{if(i)y-=[110,145,95,160,120,155,100,140,115,150][i-1];return {x:i%2?720:240,y};});s.player={...s.grips[0]};s.mode='wall';s.charge=0;s.wallAt=0;s.camera=0;s.trail=[];body=p.disk(240,480,8,{isSensor:true});},
    tick(dt){if(s.mode==='wall'){p.position(body,body.position.x,body.position.y+18*dt);if(s.held)s.charge+=dt;if(s.time-s.wallAt>1.45){k.finish(false,'抓不住了，手指松开');return;}}else{p.step(dt);const n=s.grips[s.progress+1],reached=s.progress%2===0?body.position.x>=n.x:body.position.x<=n.x;if(reached){if(Math.abs(body.position.y-n.y)>s.halfGrip-8){k.finish(false,'差一截抓沿，蹬进尖刺');return;}s.progress++;s.score+=100;s.mode='wall';s.charge=0;s.held=false;s.wallAt=s.time;p.position(body,n.x,n.y);p.velocity(body,0,0);k.event('catch',{x:n.x,y:355});if(s.progress===s.goal)k.finish(true,'最后一沿，攀上去了');}}
      s.player={...body.position};s.velocity={x:body.velocity.x*60,y:body.velocity.y*60};s.camera=Math.min(0,s.player.y-370);s.trail.push({...s.player});if(s.trail.length>30)s.trail.shift();},
    down(){if(s.mode!=='wall')return false;s.charge=0;},up(){if(s.mode!=='wall')return false;s.mode='flight';p.velocity(body,s.progress%2===0?620:-620,-(420+Math.min(.95,s.charge)*440));s.charge=0;k.event('launch');},clear(){s.charge=0;},dispose:p.dispose});return api;
}

export function createHelix(options={}){
  const {k,s,api,bind}=createOddKit('twin-helix',options),{clamp,slitRects}=extremeRules();
  bind({reset(){s.goal=12+s.stage*4;s.limit=42;s.angle=0;s.target=0;s.speed=180+s.stage*30;s.width=[40,32,26][s.stage];s.interval=[1.65,1.48,1.35][s.stage];s.radius=8;s.bars=Array.from({length:s.goal},(_,i)=>({at:2.3+i*s.interval,angle:[0,Math.PI/2,.72,0,1.05,Math.PI/2,.43][i%7],done:false}));s.controlPoint={x:100,y:420};},
    tick(dt){s.angle+=clamp(s.target-s.angle,-4.2*dt,4.2*dt);s.players=[-1,1].map(sign=>({x:480+sign*Math.cos(s.angle)*86,y:402+sign*Math.sin(s.angle)*86}));for(const bar of s.bars){bar.y=402+(s.time-bar.at)*s.speed;const rects=slitRects(bar.angle,s.width);for(const b of s.players)if(Math.abs(b.y-bar.y)<s.radius+7&&rects.some(r=>b.x+s.radius>r.x&&b.x-s.radius<r.x+r.w)){k.finish(false,'另一颗还没过，双核断联');return;}if(!bar.done&&bar.y>500){bar.done=true;s.progress++;s.score+=100;k.event('catch',{x:480,y:402});}}if(s.progress===s.goal)k.finish(true,'两颗核心，一颗没少');},
    move(q){s.target=clamp((q.x-100)/760,0,1)*Math.PI/2;}});return api;
}

export function createDash(options={}){
  const {k,s,api,bind}=createOddKit('dash-stitch',options),{dashNode}=extremeRules();
  function fail(text){k.finish(false,text);}
  bind({reset(){s.goal=6+s.stage*2;s.limit=38;s.speed=1050;s.catchRadius=[22,17,13][s.stage];s.aperture=[46,36,29][s.stage];s.nodes=Array.from({length:s.goal+1},(_,i)=>({x:140+i*220,y:[360,230,365,220,345,185,315,435,280,175,345][i],amplitude:i?18+s.stage*7:0,phase:i*.7}));s.player=dashNode(s.nodes[0],0);s.camera=0;s.mode='dock';s.dockedAt=0;s.aim={x:480,y:230};s.trail=[];},
    tick(dt){if(s.mode==='dock'){s.player=dashNode(s.nodes[s.progress],s.time);if(s.time-s.dockedAt>1.6){fail('棱晶碎了，别停太久');return;}}else{
      const before={...s.player};s.player.x+=s.vx*dt;s.player.y+=s.vy*dt;const a=s.nodes[s.progress],b=s.nodes[s.progress+1],gx=(a.x+b.x)/2;
      if(before.x<=gx&&s.player.x>=gx){const f=(gx-before.x)/(s.player.x-before.x),y=before.y+(s.player.y-before.y)*f,gy=(dashNode(a,s.time).y+dashNode(b,s.time).y)/2;if(Math.abs(y-gy)>s.aperture/2-6){fail('窄闸擦肩，折光失败');return;}}
      const target=dashNode(b,s.time);if(Math.hypot(s.player.x-target.x,s.player.y-target.y)<s.catchRadius){s.progress++;s.score+=100;s.mode='dock';s.dockedAt=s.time;s.player=target;k.event('catch',{x:250,y:target.y});if(s.progress===s.goal)k.finish(true,'一口气，接完所有棱晶');}else if(s.time-s.firedAt>.42||s.player.y<75||s.player.y>555){fail('错过充能点，能量耗尽');return;}
    }s.camera=Math.max(0,s.player.x-230);s.trail.push({...s.player});if(s.trail.length>24)s.trail.shift();},
    move(q){s.aim={x:q.x+s.camera,y:q.y};},down(q){if(s.mode!=='dock')return false;const dx=q.x+s.camera-s.player.x,dy=q.y-s.player.y,d=Math.hypot(dx,dy);if(d<12)return false;s.mode='flight';s.firedAt=s.time;s.vx=dx/d*s.speed;s.vy=dy/d*s.speed;k.event('launch');}});return api;
}

export function createCursor(options={}){
  const {k,s,api,bind}=createOddKit('cursor-overdrive',options),{sliderPoint}=extremeRules();
  function complete(){s.progress++;s.score+=100;s.sliding=false;k.event('catch',{x:s.target.x,y:s.target.y});if(s.progress===s.goal)k.finish(true,'准星过载，二十段满连');}
  bind({reset(){s.goal=12+s.stage*4;s.limit=40;s.window=[.095,.075,.055][s.stage];s.radius=[31,26,21][s.stage];s.railRadius=[25,20,16][s.stage];s.period=[.87,.76,.66][s.stage];s.notes=[];let at=1.5;for(let i=0;i<s.goal;i++){const a={x:[230,700,320,650,200,730,430,580][i%8],y:[195,430,415,170,355,275,155,450][i%8]},slider=i%3===2,duration=slider?[.95,.85,.75][s.stage]:0,b={x:480+(i%2?110:-110),y:i%2?130:495},c={x:960-a.x,y:640-a.y};s.notes.push({a,b,c,at,slider,duration});at+=duration+s.period*(i%4===1?.78:1);}s.sliding=false;s.target={...s.notes[0].a};s.controlPoint={...s.target};s.lastHit=-1;},
    tick(){const n=s.notes[s.progress];if(!n)return;if(s.sliding){s.target=sliderPoint(n,(s.time-s.slideAt)/n.duration);if(!s.held){k.finish(false,'滑轨没到头，松手太早');return;}if(s.time-s.slideAt>.04&&Math.hypot(s.controlPoint.x-s.target.x,s.controlPoint.y-s.target.y)>s.railRadius){k.finish(false,'准星脱轨，连段清空');return;}if(s.time>=s.slideAt+n.duration)complete();}else{s.target={...n.a};if(s.time>n.at+s.window)k.finish(false,'漏掉一个点，整串重来');}},
    down(q){if(s.sliding)return false;const n=s.notes[s.progress];if(!n)return false;if(Math.abs(s.time-n.at)>s.window||Math.hypot(q.x-n.a.x,q.y-n.a.y)>s.radius){k.finish(false,'时机或准星差了一点');return;}s.target={...n.a};if(n.slider){s.sliding=true;s.slideAt=s.time;s.controlPoint={...q};k.event('launch');}else complete();},move(){},up(){if(s.sliding)k.finish(false,'轨道没走完，不能松手');},clear(){s.sliding=false;}});return api;
}

export function createRecoil(options={}){
  const {k,s,api,bind}=createOddKit('recoil-pilot',options),p=hardPhysics();let body;
  bind({reset(){p.M.Composite.clear(p.engine.world,false);s.goal=4+s.stage;s.limit=42;s.portRadius=[28,22,18][s.stage];s.speedLimit=[52,42,32][s.stage];s.impulse=180;s.maxAmmo=8-s.stage;s.ammo=s.maxAmmo;s.legLimit=[6.5,5.8,5.1][s.stage];s.legAt=0;s.shotAt=-1;s.flying=false;s.ports=[{x:175,y:455},{x:785,y:455},{x:785,y:155},{x:175,y:155},{x:175,y:455},{x:785,y:455},{x:785,y:155}];s.player={...s.ports[0]};s.velocity={x:0,y:0};s.aim={x:95,y:455};s.trail=[];body=p.disk(s.player.x,s.player.y,9,{isSensor:true});},
    tick(dt){p.step(dt);s.player={...body.position};s.velocity={x:body.velocity.x*60,y:body.velocity.y*60};s.trail.push({...s.player});if(s.trail.length>38)s.trail.shift();const b=s.player;if(b.x<118||b.x>842||b.y<109||b.y>519||b.x>326&&b.x<634&&b.y>250&&b.y<383){k.finish(false,'船体触壁，舱压归零');return;}if(s.time-s.legAt>s.legLimit){k.finish(false,'没在时限内低速进港');return;}const target=s.ports[s.progress+1];if(target&&Math.hypot(target.x-b.x,target.y-b.y)<s.portRadius&&Math.hypot(s.velocity.x,s.velocity.y)<s.speedLimit){s.progress++;s.score+=100;s.ammo=s.maxAmmo;s.legAt=s.time;s.flying=false;p.position(body,target.x,target.y);p.velocity(body,0,0);s.player={...target};s.velocity={x:0,y:0};k.event('catch',{x:target.x,y:target.y});if(s.progress===s.goal)k.finish(true,'六次低速进港，船体无伤');}},
    move(q){s.aim={...q};},down(q){if(s.time-s.shotAt<.16)return false;if(!s.ammo){k.finish(false,'最后一发也用完了');return;}const dx=s.player.x-q.x,dy=s.player.y-q.y,d=Math.hypot(dx,dy);if(d<8)return false;s.ammo--;s.shotAt=s.time;s.flying=true;s.aim={...q};p.velocity(body,s.velocity.x+dx/d*s.impulse,s.velocity.y+dy/d*s.impulse);s.velocity={x:body.velocity.x*60,y:body.velocity.y*60};k.event('launch',{x:s.player.x,y:s.player.y});},dispose:p.dispose});return api;
}

export const EXTREME_WORLDS={'razor-wings':createRazor,'wall-rebound':createWall,'twin-helix':createHelix,'dash-stitch':createDash,'cursor-overdrive':createCursor,'recoil-pilot':createRecoil};
