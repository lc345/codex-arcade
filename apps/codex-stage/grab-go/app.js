import {createGrabWorld,STAGES,ITEMS} from './world.js';
import {createGrabPainter} from './painter.js';
import {createGrabSound} from './sound.js';
const $=id=>document.getElementById(id),canvas=$('game'),sound=createGrabSound(),storageKey='agent-stage:grab-go:v1';
let world,painter,active=false,loading=false,paused=false,disposed=false,manualPaused=false,hidden=document.hidden,blurred=false;
let epoch=0,abort,frame=0,last=0,lastSave=0,saved=null,pointer=null,space=false,muted=true,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,caption='';
try{const raw=localStorage.getItem(storageKey);if(raw&&raw.length<6000)saved=JSON.parse(raw);}catch{}
const modes={aim:'摆动中',out:'出钩',grip:'抓住了',back:'回收中',deposit:'到账'};
function save(){if(!world)return;saved=world.checkpoint();try{localStorage.setItem(storageKey,JSON.stringify(saved));}catch{}}
function show(){
  if(!world)return;const s=world.snapshot(),level=STAGES[s.stage],result=s.phase!=='playing';
  $('round-name').textContent=level.name;$('round').textContent=`0${s.stage+1} / 03`;$('score').textContent=s.score;$('goal').textContent=level.goal;$('progress').max=level.goal;$('progress').value=s.score;
  $('time').innerHTML=`${Math.ceil(s.remaining)}<small>s</small>`;document.querySelector('.timer').classList.toggle('urgent',s.remaining<=10);
  for(let i=0;i<3;i++)$('lamp-'+i).className=i<s.stage||s.phase==='won'?'done':i===s.stage?'active':'';
  const caught=s.items.find(i=>i.id===s.grabId);$('status').textContent=paused?'已暂停':!active?'已停止':caught?ITEMS[caught.kind].name:result?'就位':modes[s.mode];
  $('hook').disabled=!active||paused||s.phase!=='playing'||s.mode!=='aim';$('hook').textContent=s.mode==='aim'?'下钩':'回收中';$('retry').disabled=!active||paused;
  $('banner').hidden=active&&!paused;$('banner').textContent=!active?'任务结束 · 已保存':'已暂停';
  $('result').hidden=!active||(!result&&!paused);$('result-tag').textContent=paused?'PAUSED':s.phase==='won'?'ALL THREE CLEARED':s.phase==='cleared'?'TARGET REACHED':s.phase==='lost'?'TIME UP':`ROUND 0${s.stage+1}`;
  $('result-title').textContent=paused?'稍等一下':s.phase==='won'?'今天满载而归':s.phase==='cleared'?'这一柜，拿下了':s.phase==='lost'?'差一点，再来':level.name;
  $('result-detail').textContent=paused?'这根钩子，给你留着':s.phase==='won'?`三柜合计 ${s.banked+s.score} · 全部达标`:s.phase==='cleared'?`收入 ${s.score} · 还剩 ${Math.ceil(s.remaining)} 秒`:s.phase==='lost'?`${s.score} / ${s.goal} · 差 ${Math.max(0,s.goal-s.score)}`:s.resuming?`已保留 ${s.score} · 剩余 ${Math.ceil(s.remaining)} 秒`:`目标 ${level.goal} · ${level.seconds} 秒`;
  $('continue').textContent=paused?'继续':s.phase==='cleared'?'下一柜':s.phase==='won'?'再来三柜':s.phase==='lost'?'再试一次':s.resuming?'接着抓':'开抓';$('continue').disabled=!active;
  const next=`第 ${s.stage+1} 柜 · ${s.phase} · 收入 ${s.score}，目标 ${level.goal}${caught?' · 抓住 '+ITEMS[caught.kind].name:''}`;if(next!==caption){caption=next;$('live').textContent=next;}
}
function paint(){if(!painter||!world)return;painter.draw(world.snapshot(),{reduced});show();}
function loop(now){frame=0;if(!active||paused||disposed)return;const dt=last?Math.min(50,now-last):0;last=now;world.step(dt);paint();sound.update(world.snapshot());if(now-lastSave>2000){save();lastSave=now;}frame=requestAnimationFrame(loop);}
function clear(){pointer=null;space=false;world?.cancel();}
function reconcile(){if(disposed)return;paused=manualPaused||hidden||blurred;clear();cancelAnimationFrame(frame);frame=0;last=0;sound.setActive(active&&!paused);if(active&&!paused)frame=requestAnimationFrame(loop);show();}
function pause(value){manualPaused=Boolean(value);reconcile();}
async function start(){
  if(disposed||active||loading)return;loading=true;const own=++epoch;abort=new AbortController();$('task').textContent='寻宝仓加载中';$('start').disabled=true;$('stop').disabled=false;
  try{
    if(!painter){const candidate=await createGrabPainter(canvas,{signal:abort.signal});if(own!==epoch||disposed){candidate.dispose();return;}painter=candidate;}
    if(!world)world=createGrabWorld({checkpoint:saved,compact:matchMedia('(max-width: 600px) and (orientation: portrait)').matches,onEvent:sound.event});else world.resume();
    if(own!==epoch||disposed)return;active=true;loading=false;manualPaused=false;hidden=document.hidden;blurred=false;paused=hidden;last=0;clear();sound.setActive(!paused);$('task').textContent='试玩任务进行中';paint();if(!paused)frame=requestAnimationFrame(loop);
  }catch(e){if(own!==epoch||disposed)return;loading=false;$('task').textContent='加载失败';$('banner').hidden=false;$('banner').textContent='本地素材加载失败，请重试';$('live').textContent=e.message;$('start').disabled=false;}
}
function stop(){++epoch;abort?.abort();loading=false;active=false;clear();world?.stop();cancelAnimationFrame(frame);frame=0;sound.setActive(false);save();$('task').textContent='任务已结束';$('start').disabled=false;$('stop').disabled=true;show();}
function primary(){
  if(!active||disposed||!world)return false;sound.unlock();if(paused){manualPaused=false;blurred=false;hidden=document.hidden;reconcile();return !paused;}
  const s=world.snapshot();if(s.phase==='ready')world.begin();else if(s.phase==='cleared'){world.next();world.begin();}else if(s.phase==='lost'){world.retry();world.begin();}else if(s.phase==='won'){world.restart();world.begin();}else world.tap();
  save();paint();return true;
}
for(const el of [canvas,$('hook')]){
  el.addEventListener('pointerdown',e=>{if(e.button!==0||!active||paused||pointer)return;e.preventDefault();pointer={id:e.pointerId,x:e.clientX,y:e.clientY};el.setPointerCapture(e.pointerId);el.focus({preventScroll:true});sound.unlock();});
  el.addEventListener('pointerup',e=>{if(!pointer||e.pointerId!==pointer.id)return;const tap=Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)<18;pointer=null;if(tap)primary();});
  for(const event of ['pointercancel','lostpointercapture'])el.addEventListener(event,e=>{if(pointer?.id===e.pointerId)clear();});
  el.addEventListener('keydown',e=>{if(e.code!=='Space'||e.repeat||space)return;e.preventDefault();space=true;primary();});
}
document.addEventListener('keyup',e=>{if(e.code==='Space'&&space){e.preventDefault();space=false;}});
$('continue').onclick=()=>{primary();canvas.focus({preventScroll:true});};$('retry').onclick=()=>{if(!active||paused)return;clear();world.retry();last=0;sound.stop();save();paint();};$('start').onclick=start;$('stop').onclick=stop;
$('mute').onclick=()=>{muted=!muted;if(!muted)sound.unlock();sound.setMuted(muted);$('mute').setAttribute('aria-pressed',String(muted));$('mute').querySelector('img').src=`../assets/icons/${muted?'volume-x':'volume-2'}.svg`;};
$('motion').setAttribute('aria-pressed',String(reduced));$('motion').onclick=()=>{reduced=!reduced;$('motion').setAttribute('aria-pressed',String(reduced));paint();};
$('expand').onclick=()=>{const value=$('stage').classList.toggle('expanded');$('expand').setAttribute('aria-pressed',String(value));paint();};
document.addEventListener('visibilitychange',()=>{hidden=document.hidden;reconcile();});window.addEventListener('blur',()=>{blurred=true;reconcile();});window.addEventListener('focus',()=>{blurred=false;reconcile();});window.addEventListener('keydown',e=>{if(e.key==='Escape'){clear();if(active)pause(!manualPaused);}});
function destroy(){if(disposed)return;stop();disposed=true;world?.destroy();painter?.dispose();sound.dispose();document.querySelectorAll('button').forEach(b=>b.disabled=true);}
window.addEventListener('pagehide',destroy);window.grabPilot={start,stop,pause,destroy,snapshot:()=>world?.snapshot(),state:()=>({active,loading,paused,disposed,rendering:frame!==0,voices:sound.voices(),...painter?.diagnostics()})};
void start();
