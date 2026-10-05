import {createMatter} from '../vendor/matter.js';

export function createStatueWorld({checkpoint,onEvent=()=>{}}={}) {
  const {Bodies,Body,Collision}=createMatter(),carrier=Bodies.rectangle(100,430,55,120),vision=Bodies.rectangle(480,425,940,200);
  const config=[{name:'小奖杯',speed:124,brake:10},{name:'大花瓶',speed:113,brake:4},{name:'半身像',speed:100,brake:2.8}];
  let active=true,disposed=false,accumulator=0,s;
  const valid=checkpoint?.version===1&&Number.isInteger(checkpoint.stage)&&checkpoint.stage>=0&&checkpoint.stage<3;
  function guards(){return Array.from({length:s.stage===2?2:1},(_,i)=>{
    const t=(s.time+i*.8)%7.4,mode=t<3.4?'away':t<4.5?'warn':t<6.9?'watch':'away';
    return {x:i?65:900,mode,remaining:t<3.4?3.4-t:t<4.5?4.5-t:t<6.9?6.9-t:7.4-t,side:i?-1:1,index:i};
  });}
  function reset(stage=0){s={stage,phase:'ready',time:0,x:100,speed:0,held:false,wobble:0,wobbleVelocity:0,suspicion:0,progress:0,notice:'',reason:'',rescues:0,noticeTime:0,guardModes:[],footstep:-1};accumulator=0;Body.setPosition(carrier,{x:100,y:430});}
  reset(valid?checkpoint.stage:0);
  const emit=(type)=>onEvent({type});
  function update(dt){
    if(s.phase!=='playing')return;
    s.time+=dt;s.noticeTime=Math.max(0,s.noticeTime-dt);
    const cfg=config[s.stage],previous=s.speed;
    s.speed+=( (s.held?cfg.speed:0)-s.speed)*(1-Math.exp(-(s.held?7:cfg.brake)*dt));
    if(s.speed<.02)s.speed=0;s.x=Math.min(835,s.x+s.speed*dt);
    const acceleration=(s.speed-previous)/dt;
    s.wobbleVelocity+=(-s.wobble*30-s.wobbleVelocity*7-acceleration*.013*(1+s.stage*.5))*dt;
    s.wobble=Math.max(-.65,Math.min(.65,s.wobble+s.wobbleVelocity*dt));
    Body.setPosition(carrier,{x:s.x,y:430});const gs=guards();
    for(const [i,g]of gs.entries()){if(g.mode==='warn'&&s.guardModes[i]!=='warn')emit('warning');s.guardModes[i]=g.mode;}
    const seen=gs.some(g=>g.mode==='watch')&&Boolean(Collision.collides(carrier,vision));
    const moving=s.speed>9||Math.abs(s.wobble)>.09;
    const was=s.suspicion;
    s.suspicion=Math.max(0,Math.min(1,s.suspicion+(seen&&moving?1.2:-1.5)*dt));
    if(was>.05&&s.suspicion===0&&seen){s.rescues++;s.notice='他好像信了';s.noticeTime=1.2;emit('safe');}
    const foot=Math.floor(s.x/32);if(s.held&&foot!==s.footstep){s.footstep=foot;emit('step');}
    s.progress=Math.round((s.x-100)/720*100);
    if(s.suspicion>=1){s.phase='lost';s.held=false;s.reason=Math.abs(s.wobble)>.09&&s.speed<20?'wobble':'moving';s.notice=s.reason==='wobble'?'雕像怎么还在晃？':'这件展品会走路！';emit('caught');}
    else if(s.x>=820){s.phase=s.stage===2?'won':'caught';s.held=false;s.speed=0;s.wobble=0;s.progress=100;s.notice='顺利带出展厅';emit('escape');}
  }
  const api={
    begin(){if(!active||disposed||s.phase!=='ready')return false;s.phase='playing';emit('start');return true;},
    hold(v){if(!active||disposed||s.phase!=='playing')return false;if(s.held&&!v)emit('pose');s.held=Boolean(v);return true;},
    cancel(){s.held=false;},
    step(ms){if(!active||disposed||!Number.isFinite(ms)||ms<=0)return;accumulator+=Math.min(ms,50);while(accumulator>=1000/120){update(1/120);accumulator-=1000/120;}},
    next(){if(!active||s.phase!=='caught')return false;reset(s.stage+1);return true;},
    retry(){if(!active||disposed)return false;reset(s.stage);return true;},restart(){if(!active||disposed)return false;reset(0);return true;},
    stop(){s.held=false;active=false;},destroy(){api.stop();disposed=true;},
    checkpoint(){return {version:1,stage:s.phase==='caught'?Math.min(2,s.stage+1):s.stage};},
    snapshot(){return structuredClone({...s,active,item:config[s.stage].name,guards:guards(),settled:s.speed<9&&Math.abs(s.wobble)<.09});},
  };return api;
}
