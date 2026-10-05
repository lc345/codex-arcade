import {createReturnWorld,STAGES} from './world.js';
import {createReturnPainter} from './painter.js';
import {createReturnSound} from './sound.js';

const $=id=>document.getElementById(id),canvas=$('game'),sound=createReturnSound(),storageKey='agent-stage:return-fire:v1';
const listeners=new AbortController(),listen=(el,type,fn)=>el.addEventListener(type,fn,{signal:listeners.signal});
let world,painter,active=false,loading=false,disposed=false,paused=false,manualPause=false,hidden=document.hidden,blurred=false;
let frame=0,last=0,visualTime=0,generation=0,abort,pointer=null,space=false,muted=true,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let saved=null,caption='',lastSave=0;const keys=new Set();
try{const raw=localStorage.getItem(storageKey);if(raw&&raw.length<512)saved=JSON.parse(raw);}catch{}
function save(){if(!world)return;saved=world.checkpoint();try{localStorage.setItem(storageKey,JSON.stringify(saved));}catch{}}
function show(){
  if(!world)return;const s=world.snapshot(),cfg=STAGES[s.stage];
  $('objective').textContent=cfg.part;$('boss-count').textContent=`${Math.ceil(s.bossHp)} / ${cfg.hp}`;$('boss-hp').style.width=100*s.bossHp/cfg.hp+'%';
  for(let i=0;i<3;i++){$('phase-'+i).className=i<s.stage||s.phase==='won'?'done':i===s.stage?'active':'';$('phase-'+i).setAttribute('aria-current',i===s.stage?'step':'false');}
  $('hull').textContent='▰'.repeat(s.player.hp)+'▱'.repeat(4-s.player.hp);$('hull').setAttribute('aria-label',`装甲 ${s.player.hp} / 4`);
  $('ammo').textContent=String(s.charge).padStart(2,'0');$('heat').style.width=Math.min(100,s.heat*100)+'%';$('heat').style.background=s.heat>.76?'#ff865e':'#99e5b5';
  $('heat-label').textContent=s.lockout?'OVERLOAD':s.heat>.76?'DANGER':'HEAT';
  $('shield').setAttribute('aria-pressed',String(s.held));$('shield-label').textContent=s.lockout?'冷却中':s.held?(s.charge>=5?'强力反击就绪':'吸收中'):'吸收盾';
  $('shield').disabled=!active||paused||!['ready','playing'].includes(s.phase);$('retry').disabled=!active||paused;
  $('result').hidden=!active||!['ready','won','lost'].includes(s.phase);
  $('result-kicker').textContent=s.phase==='won'?'WRECKER DISMANTLED':s.phase==='lost'?'SIGNAL LOST':`SECTOR 07 / PHASE 0${s.stage+1}`;
  $('result-title').textContent=s.phase==='won'?'漂亮，原弹奉还':s.phase==='lost'?(s.reason==='overload'?'贪多，盾就炸了':'装甲被击穿'):s.stage===0?'废港巨像':cfg.name;
  $('result-detail').textContent=s.phase==='ready'?'肩炮 · 激光臂 · 反应堆':`${s.absorbed} 发吸收 · ${s.shots} 次反击 · ${s.time.toFixed(1)} 秒`;
  $('continue').textContent=s.phase==='won'?'再战一轮':s.phase==='lost'?'重试本阶段':s.stage===0?'迎战':'继续挑战';$('continue').disabled=paused;
  $('banner').textContent=!active?'任务结束 · 阶段已保存':paused?'已暂停':'';
  const next=!active?'任务已结束':paused?'已暂停':s.phase==='playing'?`${cfg.name} · ${s.lockout?'盾过载':s.hazards.length?'红色危险区域':s.charge>=5?'反击已充能':'交战中'}`:s.phase==='ready'?'等待迎战':s.phase==='won'?'巨像已击破':s.phase==='lost'?'装甲耗尽':'部件击破，下一阶段';
  if(next!==caption){caption=next;$('live').textContent=next;}
}
function paint(){if(world&&painter){painter.draw(world.snapshot(),{time:visualTime,reduced});show();}}
function clear(){pointer=null;space=false;keys.clear();world?.cancel();}
function loop(now){
  frame=0;if(!active||paused||disposed)return;
  const dt=last?Math.min(50,now-last):0;last=now;visualTime+=dt/1000;
  const dx=Number(keys.has('ArrowRight')||keys.has('KeyD'))-Number(keys.has('ArrowLeft')||keys.has('KeyA'));
  const dy=Number(keys.has('ArrowDown')||keys.has('KeyS'))-Number(keys.has('ArrowUp')||keys.has('KeyW'));
  if(dx||dy){const p=world.snapshot().player;world.move(p.x+dx*560*dt/1000,p.y+dy*560*dt/1000);}
  world.step(dt);paint();if(now-lastSave>1500){save();lastSave=now;}frame=requestAnimationFrame(loop);
}
function reconcile(){if(disposed)return;paused=manualPause||hidden||blurred;clear();cancelAnimationFrame(frame);frame=0;last=0;sound.setActive(active&&!paused);if(active&&!paused)frame=requestAnimationFrame(loop);show();}
function pause(v){manualPause=Boolean(v);reconcile();}
async function start(){
  if(disposed||active||loading)return;const own=++generation;loading=true;abort=new AbortController();$('task').textContent='战场加载中';$('start').disabled=true;$('stop').disabled=false;$('continue').disabled=true;
  try{
    if(!painter){const candidate=await createReturnPainter(canvas,{signal:abort.signal});if(own!==generation||disposed){candidate.dispose();return;}painter=candidate;}
    if(!world)world=createReturnWorld({checkpoint:saved,onEvent:sound.event});else world.resume();
    if(own!==generation||disposed)return;active=true;loading=false;manualPause=false;hidden=document.hidden;blurred=false;paused=hidden;last=0;clear();sound.setActive(!paused);$('task').textContent='试玩任务进行中';paint();if(!paused)frame=requestAnimationFrame(loop);
  }catch(e){if(own!==generation||disposed)return;loading=false;$('task').textContent='加载失败';$('result-title').textContent='素材未能加载';$('result-detail').textContent='检查本地文件后重试';$('result').hidden=false;$('continue').disabled=true;$('start').disabled=false;$('live').textContent=e.message;}
}
function stop(){++generation;abort?.abort();loading=false;active=false;clear();world?.stop();cancelAnimationFrame(frame);frame=0;sound.setActive(false);save();$('task').textContent='任务已结束';$('start').disabled=false;$('stop').disabled=true;$('result').hidden=true;show();}
function act(){if(!active||paused||disposed||!world)return false;if(world.snapshot().phase==='ready')world.begin();return world.hold(pointer!==null||space);}
function point(e){const r=canvas.getBoundingClientRect();world?.move((e.clientX-r.x)/r.width*960,(e.clientY-r.y)/r.height*640);}
function retry(){if(!active||paused)return;clear();world.retry();visualTime=0;last=0;sound.stop();save();paint();}
for(const el of [canvas,$('shield')]){
  listen(el,'pointerdown',e=>{if(e.button!==0||!active||paused||pointer!==null)return;e.preventDefault();sound.unlock();pointer=e.pointerId;el.setPointerCapture(e.pointerId);el.focus();if(el===canvas)point(e);act();});
  listen(el,'pointerup',e=>{if(pointer!==e.pointerId)return;pointer=null;act();});
  for(const type of ['pointercancel','lostpointercapture'])listen(el,type,e=>{if(pointer===e.pointerId){clear();show();}});
  listen(el,'keydown',e=>{
    if(!active||paused)return;
    if(e.code==='Space'){e.preventDefault();if(e.repeat||space)return;sound.unlock();space=true;act();}
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'].includes(e.code)){e.preventDefault();keys.add(e.code);}
  });
}
listen(canvas,'pointermove',e=>{if(active&&!paused&&(e.pointerType==='mouse'||e.pointerId===pointer))point(e);});
listen(document,'keyup',e=>{keys.delete(e.code);if(e.code==='Space'&&space){e.preventDefault();space=false;act();}});
$('continue').onclick=()=>{if(!active||paused)return;clear();sound.unlock();const s=world.snapshot();if(s.phase==='won')world.restart();else if(s.phase==='lost')world.retry();world.begin();canvas.focus();last=0;save();paint();};
$('retry').onclick=retry;$('start').onclick=start;$('stop').onclick=stop;
$('mute').onclick=()=>{muted=!muted;if(!muted)sound.unlock();sound.setMuted(muted);$('mute').setAttribute('aria-pressed',String(muted));$('mute').querySelector('img').src=`../assets/icons/${muted?'volume-x':'volume-2'}.svg`;};
$('motion').setAttribute('aria-pressed',String(reduced));$('motion').onclick=()=>{reduced=!reduced;$('motion').setAttribute('aria-pressed',String(reduced));if(paused)paint();};
$('expand').onclick=()=>{const v=document.querySelector('main').classList.toggle('expanded');$('expand').setAttribute('aria-pressed',String(v));if(paused)paint();};
listen(document,'visibilitychange',()=>{hidden=document.hidden;reconcile();});
listen(window,'blur',()=>{blurred=true;reconcile();});listen(window,'focus',()=>{blurred=false;reconcile();});
listen(window,'keydown',e=>{if(e.key==='Escape'){document.querySelector('main').classList.remove('expanded');$('expand').setAttribute('aria-pressed','false');clear();}});
function destroy(){if(disposed)return;stop();disposed=true;listeners.abort();world?.destroy();painter?.dispose();world=painter=null;sound.dispose();document.querySelectorAll('button').forEach(b=>b.disabled=true);}
listen(window,'pagehide',destroy);
window.returnFirePilot={start,stop,pause,destroy,snapshot:()=>world?.snapshot(),state:()=>({active,loading,paused,disposed,rendering:frame!==0,voices:sound.voices(),...painter?.diagnostics()})};
void start();
