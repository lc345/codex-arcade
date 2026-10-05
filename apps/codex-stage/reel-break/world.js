const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const move=(id,duration,force,label)=>({id,duration,force,label});
export const FISH=Object.freeze([
  {id:'redfin',name:'赤尾梭',title:'短跑高手',distance:18,color:'#e65d43',moves:[move('cruise',2.5,.24,'游弋'),move('tell',.75,.38,'蓄力摆尾'),move('surge',1.45,1.28,'冲刺'),move('rest',2.5,.08,'喘息'),move('tell',.65,.40,'蓄力摆尾'),move('surge',1.05,1.32,'再冲一次'),move('rest',2.9,.09,'喘息')]},
  {id:'goldbelly',name:'金腹鲷',title:'沉底大力士',distance:22,color:'#d8b448',moves:[move('cruise',2,.34,'巡游'),move('tell',.85,.42,'低头蓄力'),move('dive',3.1,.99,'持续下潜'),move('rest',4.1,.12,'浮起换气'),move('tell',.75,.40,'低头蓄力'),move('dive',2.65,1.08,'深潜'),move('rest',3.8,.10,'浮起换气')]},
  {id:'ribbon',name:'蓝绸鳍',title:'回身假动作',distance:24,color:'#68b7c1',moves:[move('cruise',2.2,.28,'盘旋'),move('tell',.70,.35,'向右摆尾'),move('turn',1.25,1.25,'急转反冲'),move('rest',1.8,.08,'短暂喘息'),move('feint',.8,.26,'虚晃'),move('rest',1.3,.10,'露出空当'),move('tell',.65,.4,'收拢尾鳍'),move('surge',1.8,1.20,'突然折返'),move('rest',2.9,.08,'喘息')]},
]);

export function fishMove(stage,time){
  const list=FISH[stage]?.moves||FISH[0].moves,total=list.reduce((n,m)=>n+m.duration,0);let at=Math.max(0,time)%total;
  for(let i=0;i<list.length;i++){const m=list[i];if(at<m.duration)return {...m,progress:at/m.duration,index:i};at-=m.duration;}
  return {...list[0],progress:0,index:0};
}

function readCheckpoint(cp){
  if(!cp||typeof cp!=='object'||cp.version!==1||!Number.isInteger(cp.stage)||cp.stage<0||cp.stage>2)return null;
  const ranges={time:[0,600],distance:[.8,40],tension:[0,1.8],slack:[0,6.5],overload:[0,.5],peak:[0,1.8]};
  for(const [k,[a,b]]of Object.entries(ranges))if(!Number.isFinite(cp[k])||cp[k]<a||cp[k]>b)return null;
  if(!['playing','ready','caught','won','lost'].includes(cp.phase))return null;
  if(['caught','won'].includes(cp.phase)&&(cp.distance>1.2||cp.time<2||cp.phase==='won'&&cp.stage!==2))return null;
  return Object.fromEntries(['stage','time','distance','tension','slack','overload','peak','phase'].map(k=>[k,cp[k]]));
}

export function createReelWorld({stage=0,checkpoint,onEvent=()=>{}}={}){
  let active=true,destroyed=false,accumulator=0,lastMove='',s;
  function reset(index){s={stage:index,phase:'ready',time:0,distance:FISH[index].distance,tension:.18,slack:0,overload:0,peak:0,held:false,engagement:0,reason:'',caughtAt:0,grace:0,resuming:false};accumulator=0;lastMove='';}
  function restore(cp){
    const saved=readCheckpoint(cp);if(!saved)return false;reset(saved.stage);Object.assign(s,saved);
    if(!['caught','won'].includes(saved.phase)){s.phase='ready';s.resuming=s.time>0;s.grace=.6;s.tension=Math.min(s.tension,.55);s.overload=0;s.slack=Math.min(s.slack,3);}
    return true;
  }
  reset(Number.isInteger(stage)&&stage>=0&&stage<3?stage:0);restore(checkpoint);
  const emit=(type,strength=1)=>{if(active&&!destroyed)onEvent({type,strength});};
  function finish(phase,reason=''){
    s.phase=phase;s.reason=reason;s.held=false;s.engagement=0;s.caughtAt=s.time;
    emit(phase==='lost'?(reason==='line'?'snap':'escape'):'land');
  }
  function update(dt){
    if(s.phase!=='playing')return;s.time+=dt;s.grace=Math.max(0,s.grace-dt);
    const m=fishMove(s.stage,s.time);
    if(lastMove!==m.id+':'+m.index){lastMove=m.id+':'+m.index;if(m.id==='tell')emit('warn');if(['surge','turn','dive'].includes(m.id))emit('splash',m.force);}
    // Reeling needs a continuous turn of the spool; rapid taps cannot replace timing.
    s.engagement=clamp(s.engagement+dt*(s.held?3.4:-8),0,1);
    const target=.14+s.engagement*(.14+m.force*.95)+m.force*.12;
    s.tension+=(target-s.tension)*Math.min(1,dt*(s.held?3.3:5.5));
    s.peak=Math.max(s.peak,s.tension);
    s.overload=clamp(s.overload+dt*(s.tension>.93?(s.tension-.93)*2.2:-.6),0,.5);
    s.slack=clamp(s.slack+dt*(s.held?-3:m.force>.8?.65:1),0,6.5);
    const inward=2.55*s.engagement*(1-m.force*.55),outward=(.35+m.force*1.3)*(1-s.engagement);
    s.distance=clamp(s.distance+(outward-inward)*dt,.8,40);
    if(s.grace===0&&s.overload>.32){finish('lost','line');return;}
    if(s.slack>=6.5||s.distance>=40){finish('lost','slack');return;}
    if(s.distance<=1.2&&s.held&&s.tension<.92)finish(s.stage===2?'won':'caught');
  }
  const api={
    input(held){
      if(!active||destroyed||typeof held!=='boolean'||!['ready','playing'].includes(s.phase))return false;
      if(s.phase==='ready'){if(!held)return false;s.phase='playing';emit('hook');}
      s.held=held;return true;
    },
    cancel(){s.held=false;s.engagement=0;},
    step(ms){if(!active||destroyed||!Number.isFinite(ms)||ms<=0||s.phase!=='playing')return;accumulator+=Math.min(ms,50);while(accumulator>=1000/120){accumulator-=1000/120;update(1/120);}},
    snapshot(){const m=fishMove(s.stage,s.time);return {...s,active,catches:s.stage+(['caught','won'].includes(s.phase)?1:0),move:m.id,moveLabel:m.label,moveProgress:m.progress,force:m.force};},
    checkpoint(){return {version:1,...Object.fromEntries(['stage','phase','time','distance','tension','slack','overload','peak'].map(k=>[k,s[k]]))};},
    retry(){if(!active||destroyed)return false;reset(s.stage);return true;},
    next(){if(!active||destroyed||s.phase!=='caught'||s.stage===2)return false;reset(s.stage+1);return true;},
    restart(){if(!active||destroyed)return false;reset(0);return true;},
    stop(){api.cancel();active=false;},
    resume(){if(destroyed)return false;const cp=api.checkpoint();active=true;restore(cp);return true;},
    destroy(){api.stop();destroyed=true;},
  };
  return api;
}
