import { createMatter } from '../vendor/matter.js';

const { Bodies, Body, Collision } = createMatter();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const STAGES=Object.freeze([
  {name:'拆掉肩炮',part:'左肩弹幕炮',hp:18,x:358,y:215,cycle:6.8},
  {name:'切断激光臂',part:'右侧激光臂',hp:23,x:602,y:225,cycle:6.3},
  {name:'击碎反应堆',part:'暴露的核心',hp:30,x:480,y:180,cycle:5.9},
]);

export function createReturnWorld({checkpoint,onEvent=()=>{}}={}) {
  let active=true,disposed=false,acc=0,serial=0,rng=17,s;
  const hitBody=Bodies.circle(0,0,12),shieldBody=Bodies.circle(0,0,53),targetBody=Bodies.circle(0,0,48);
  const initial=checkpoint?.version===1&&Number.isInteger(checkpoint.stage)&&checkpoint.stage>=0&&checkpoint.stage<3?checkpoint.stage:0;
  const emit=(type,extra={})=>onEvent({type,...extra});
  const random=()=>((rng=(Math.imul(rng,1664525)+1013904223)>>>0)/4294967296);
  function reset(stage=0,keep=false) {
    const previous=s;
    s={phase:'ready',stage,time:keep?previous.time:0,stageTime:0,held:false,charge:0,heat:0,lockout:0,
      player:{x:480,y:525,tx:480,ty:525,hp:4,invul:0},bossHp:STAGES[stage].hp,
      bullets:[],returns:[],hazards:[],effects:[],cycle:-1,volley:0,warned:false,transition:0,
      absorbed:keep?previous.absorbed:0,shots:keep?previous.shots:0,damage:keep?previous.damage:0,
      overloads:keep?previous.overloads:0,hazardHits:keep?previous.hazardHits:0,
      shake:0,flash:0,notice:'',noticeTime:0,reason:'',combo:0};
    acc=0;
  }
  reset(initial);
  function burst(x,y,color,count=16,force=170) {
    for(let n=0;n<count;n++){const a=random()*Math.PI*2,v=force*(.3+random());s.effects.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.35+random()*.7,max:1,color,size:2+random()*5,spin:random()*6});}
    if(s.effects.length>170)s.effects.splice(0,s.effects.length-170);
  }
  function notice(text){s.notice=text;s.noticeTime=1.25;}
  function hit(reason){
    if(s.player.invul>0||s.phase!=='playing')return;
    s.player.hp--;s.player.invul=1.15;s.combo=0;s.shake=.28;s.flash=.18;
    burst(s.player.x,s.player.y,'#f66e58',24);emit('hurt');notice(reason==='overload'?'过载！先松手':reason==='laser'?'红色攻击不能吸收':'被击中');
    if(s.player.hp<=0){s.phase='lost';s.held=false;s.charge=0;s.reason=reason;emit('lose');}
  }
  function bossPose(){
    const base=480+Math.sin(s.time*.75)*20,h=s.hazards.find(h=>h.kind==='slam');
    if(s.stage!==2||!h)return {x:base,y:157};
    const p=clamp(-h.warn/.7,0,1),align=h.warn>0?1-clamp(h.warn,0,1):1-clamp((p-.55)/.45,0,1);
    return {x:base+(h.x-base)*align,y:157+(h.warn>0?-12*(1-h.warn):Math.sin(p*Math.PI)*330)};
  }
  const target=()=>s.stage===2?{x:bossPose().x,y:bossPose().y+20}:{x:STAGES[s.stage].x+Math.sin(s.time*.75)*20,y:STAGES[s.stage].y};
  function spawn(x,y,angle,speed=240) {
    const body=Bodies.circle(x,y,7);s.bullets.push({id:++serial,x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,body});
  }
  function shootVolley() {
    const origins=s.stage===0?[{x:358,y:235}]:s.stage===1?[{x:480,y:200}]:[{x:426,y:205},{x:534,y:205}];
    for(const o of origins){const angle=Math.atan2(s.player.y-o.y,s.player.x-o.x);spawn(o.x,o.y,angle,245+s.stage*16);if(s.stage>0&&s.volley%2===0){spawn(o.x,o.y,angle-.28,225);spawn(o.x,o.y,angle+.28,225);}}
    s.volley++;emit('enemy');
  }
  function fire(){
    if(!s.charge||s.phase!=='playing')return;
    const count=s.charge,power=count>=5?1.75:1.1;s.shots++;s.shake=.10;notice(count>=5?`${count} 发 · 强力反击`:`${count} 发 · 反击`);
    for(let n=0;n<count;n++){const x=s.player.x+(n-(count-1)/2)*10,y=s.player.y-26;
      s.returns.push({x,y,id:++serial,damage:power,delay:n*.018,body:Bodies.circle(x,y,8),trail:[]});}
    emit('release',{count});s.charge=0;s.heat=Math.max(0,s.heat-.25);
  }
  function damageBoss(amount){
    s.bossHp=Math.max(0,s.bossHp-amount);s.damage+=amount;s.combo++;s.shake=Math.max(s.shake,.09);s.flash=.05;
    const t=target();burst(t.x,t.y,'#fbdc85',10);emit('impact');
    if(s.bossHp>0)return;
    s.bullets=[];s.hazards=[];s.returns=[];s.held=false;s.charge=0;s.heat=0;s.shake=.55;
    burst(t.x,t.y,'#fff0c2',60,320);
    if(s.stage===2){s.phase='won';emit('win');notice('反应堆已击破');}
    else{emit('break',{stage:s.stage});s.stage++;s.bossHp=STAGES[s.stage].hp;s.phase='transition';s.transition=1.7;s.player.hp=Math.min(4,s.player.hp+1);notice('部件击破');}
  }
  function update(dt){
    for(const e of s.effects){e.life-=dt;e.x+=e.vx*dt;e.y+=e.vy*dt;e.vy+=70*dt;}
    s.effects=s.effects.filter(e=>e.life>0);s.shake=Math.max(0,s.shake-dt);s.flash=Math.max(0,s.flash-dt);s.noticeTime=Math.max(0,s.noticeTime-dt);
    if(s.phase==='transition'){
      s.transition-=dt;
      if(s.transition<=0){s.phase='playing';s.bossHp=STAGES[s.stage].hp;s.stageTime=0;s.cycle=-1;s.player.invul=1;emit('phase');}
      return;
    }
    if(s.phase!=='playing')return;
    s.time+=dt;s.stageTime+=dt;s.player.invul=Math.max(0,s.player.invul-dt);s.lockout=Math.max(0,s.lockout-dt);
    const dx=s.player.tx-s.player.x,dy=s.player.ty-s.player.y,d=Math.hypot(dx,dy),step=Math.min(d,560*dt);
    if(d>0){s.player.x+=dx/d*step;s.player.y+=dy/d*step;}
    Body.setPosition(hitBody,s.player);Body.setPosition(shieldBody,s.player);
    s.heat=clamp(s.heat+(s.held&&!s.lockout ? .12 : -.52)*dt,0,1.1);
    const cfg=STAGES[s.stage],cycle=Math.floor(s.stageTime/cfg.cycle),ct=s.stageTime%cfg.cycle;
    if(cycle!==s.cycle){s.cycle=cycle;s.volley=0;s.warned=false;}
    const cadence=s.stage===2?.22:.19,count=s.stage===0?10:9;
    if(ct>.65+s.volley*cadence&&s.volley<count)shootVolley();
    if(ct>3.35&&!s.warned){
      s.warned=true;const width=s.stage===2?190:s.stage===1?110:80;
      s.hazards.push({x:s.player.x,y:420,w:width,h:440,warn:1.0,remaining:1.7,kind:s.stage===2?'slam':'laser'});emit('warning');
      if(s.stage===1)s.hazards.push({x:s.player.x<480?745:215,y:420,w:80,h:440,warn:1.25,remaining:1.95,kind:'laser'});
    }
    for(const b of s.bullets){
      b.x+=b.vx*dt;b.y+=b.vy*dt;Body.setPosition(b.body,b);
      if(s.held&&!s.lockout&&Collision.collides(shieldBody,b.body)){
        b.dead=true;s.absorbed++;s.charge=Math.min(10,s.charge+1);s.heat+=.070;
        burst(b.x,b.y,'#8fffdc',5,70);emit('absorb',{count:s.charge});
      }else if(Collision.collides(hitBody,b.body)){b.dead=true;hit('bullet');}
    }
    s.bullets=s.bullets.filter(b=>!b.dead&&b.y<710&&b.x>-80&&b.x<1040);
    if(s.heat>=1&&!s.lockout){s.heat=.75;s.lockout=1.45;s.charge=0;s.overloads++;hit('overload');emit('overload');}
    for(const h of s.hazards){
      h.warn-=dt;h.remaining-=dt;
      if(h.warn<=0&&h.remaining>0){
        const hazardBody=Bodies.rectangle(h.x,h.y,h.w,h.h);
        if(Collision.collides(hitBody,hazardBody)&&s.player.invul<=0){s.hazardHits++;hit('laser');}
      }
    }
    s.hazards=s.hazards.filter(h=>h.remaining>0);
    if(s.phase!=='playing')return;
    const t=target();Body.setPosition(targetBody,t);
    for(const b of s.returns){
      b.delay-=dt;if(b.delay>0)continue;
      const angle=Math.atan2(t.y-b.y,t.x-b.x);b.x+=Math.cos(angle)*800*dt;b.y+=Math.sin(angle)*800*dt;Body.setPosition(b.body,b);
      if(Collision.collides(targetBody,b.body)){b.dead=true;damageBoss(b.damage);if(s.phase!=='playing')break;}
    }
    s.returns=s.returns.filter(b=>!b.dead);
  }
  const api={
    begin(){if(!active||disposed||s.phase!=='ready')return false;s.phase='playing';emit('start');return true;},
    move(x,y){if(!active||disposed||!Number.isFinite(x+y))return false;s.player.tx=clamp(x,100,860);s.player.ty=clamp(y,330,590);return true;},
    hold(value){if(!active||disposed||s.phase!=='playing')return false;const next=Boolean(value);if(s.held&&!next)fire();s.held=next;return true;},
    cancel(){s.held=false;},
    step(ms){if(!active||disposed||s.phase==='ready'||!Number.isFinite(ms)||ms<=0)return;acc+=Math.min(50,ms);while(acc>=1000/120){update(1/120);acc-=1000/120;}},
    stop(){s.held=false;active=false;},
    resume(){if(disposed)return false;active=true;reset(s.stage,true);return true;},
    retry(){if(!active||disposed)return false;reset(s.stage);return true;},
    restart(){if(!active||disposed)return false;reset(0);return true;},
    checkpoint(){return {version:1,stage:s.stage};},
    snapshot(){const {bullets,returns,...plain}=s;return structuredClone({...plain,bullets:bullets.map(({body,...b})=>b),returns:returns.map(({body,...b})=>b),target:target(),boss:bossPose(),active});},
    destroy(){api.stop();disposed=true;s.bullets=[];s.returns=[];s.effects=[];s.hazards=[];},
  };
  return api;
}
