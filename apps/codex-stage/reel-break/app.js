import {createReelWorld,FISH} from './world.js';
import {createReelPainter} from './painter.js';
import {createReelSound} from './sound.js';
const $=id=>document.getElementById(id),canvas=$('game'),sound=createReelSound(),storageKey='agent-stage:reel-break:v1';
let world,painter,active=false,loading=false,disposed=false,paused=false,manualPaused=false,hidden=document.hidden,blurred=false;
let frame=0,last=0,visualTime=0,generation=0,abort,pointer=null,space=false,muted=true,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,caption='',lastSave=0;
let saved=null;try{const raw=localStorage.getItem(storageKey);if(raw&&raw.length<2048)saved=JSON.parse(raw);}catch{}
function save(){if(!world)return;saved=world.checkpoint();try{localStorage.setItem(storageKey,JSON.stringify(saved));}catch{}}
function show(){
  if(!world)return;const s=world.snapshot(),f=FISH[s.stage],caught=['caught','won'].includes(s.phase);
  $('fish-type').textContent=f.title;$('fish-name').textContent=f.name;$('fish-move').textContent=s.phase==='ready'?(s.resuming?'继续这场较量':'鱼已上钩'):s.phase==='lost'?'暂别海湾':caught?'收入手记':s.moveLabel;
  for(let j=0;j<3;j++){$('chapter-'+j).className=j<s.catches?'done':j===s.stage?'active':'';$('chapter-'+j).setAttribute('aria-current',j===s.stage?'step':'false');}
  $('distance').innerHTML=`${s.distance.toFixed(1)}<small>m</small>`;$('tension').style.width=Math.min(100,s.tension/1.18*100)+'%';$('tension').style.background=s.tension>.88?'#f77957':'#e9d691';
  $('line-label').textContent=s.overload>.10?'快断了！':s.slack>4?'线太松了':s.held?'正在收线':'线的张力';
  $('reel').setAttribute('aria-pressed',String(s.held));$('reel-label').textContent=s.held?'收线中':'收线';$('reel').disabled=!active||paused||!['ready','playing'].includes(s.phase);
  $('retry').disabled=!active||paused;$('banner').textContent=!active?'任务结束 · 已保存':paused?'已暂停':s.phase==='playing'&&s.slack>4?'鱼钩快松脱了':s.phase==='playing'&&s.overload>.10?'鱼线即将断裂':'';
  $('result').hidden=!active||!['caught','won','lost'].includes(s.phase);
  $('result-kicker').textContent=s.phase==='won'?'COLLECTION COMPLETE':s.phase==='caught'?'LANDED':'UNTIL NEXT TIME';
  $('result-title').textContent=s.phase==='won'?'海湾手记，集齐了':s.phase==='caught'?f.name+'，上岸！':s.reason==='line'?'绷断了':'脱钩了';
  $('result-detail').textContent=caught?`${s.time.toFixed(1)} 秒 · ${s.catches} / 3 条`:s.reason==='line'?'刚才拉得太急，鱼线承受不住。':'放线太久，它挣开了鱼钩。';
  $('continue').textContent=s.phase==='caught'?'下一条':s.phase==='won'?'再来一轮':'再试一次';$('continue').disabled=paused;
  const next=`${f.name} · ${s.phase==='ready'?'等待收线':s.phase==='playing'?s.moveLabel:s.phase==='lost'?(s.reason==='line'?'断线':'脱钩'):'已上岸'}`;
  if(caption!==next){caption=next;$('live').textContent=next;}
}
function paint(){if(world&&painter){painter.draw(world.snapshot(),{time:visualTime,reduced});show();}}
function loop(now){frame=0;if(!active||paused||disposed)return;const dt=last?Math.min(50,now-last):0;last=now;visualTime+=dt/1000;world.step(dt);paint();sound.update(world.snapshot());if(now-lastSave>2000){save();lastSave=now;}frame=requestAnimationFrame(loop);}
function clear(){pointer=null;space=false;world?.cancel();}
function reconcilePause(){if(disposed)return;paused=manualPaused||hidden||blurred;clear();cancelAnimationFrame(frame);frame=0;last=0;sound.setActive(active&&!paused);if(active&&!paused)frame=requestAnimationFrame(loop);show();}
function pause(value){manualPaused=Boolean(value);reconcilePause();}
async function start(){
  if(disposed||active||loading)return;const own=++generation;loading=true;abort=new AbortController();$('task').textContent='海湾加载中';$('start').disabled=true;$('stop').disabled=false;
  try{
    if(!painter){const candidate=await createReelPainter(canvas,{signal:abort.signal});if(own!==generation||disposed){candidate.dispose();return;}painter=candidate;}
    if(!world)world=createReelWorld({checkpoint:saved,onEvent:sound.event});else world.resume();
    if(own!==generation||disposed)return;active=true;loading=false;manualPaused=false;hidden=document.hidden;blurred=false;paused=hidden;last=0;clear();sound.setActive(!paused);$('task').textContent='试玩任务进行中';paint();if(!paused)frame=requestAnimationFrame(loop);
  }catch(e){if(own!==generation||disposed)return;loading=false;$('task').textContent='加载失败';$('banner').textContent='本地素材加载失败，请重试';$('live').textContent=e.message;$('start').disabled=false;}
}
function stop(){++generation;abort?.abort();loading=false;active=false;clear();world?.stop();cancelAnimationFrame(frame);frame=0;sound.setActive(false);save();$('task').textContent='任务已结束';$('start').disabled=false;$('stop').disabled=true;show();}
function act(){if(!active||paused||disposed||!world)return false;return world.input(pointer!==null||space);}
function retry(){if(!active||paused)return;clear();world.retry();visualTime=0;last=0;sound.stop();save();paint();}
for(const target of [canvas,$('reel')]){
  target.addEventListener('pointerdown',e=>{if(e.button!==0||!active||paused||pointer!==null)return;e.preventDefault();sound.unlock();pointer=e.pointerId;target.setPointerCapture(e.pointerId);target.focus();act();});
  target.addEventListener('pointerup',e=>{if(pointer!==e.pointerId)return;pointer=null;act();});
  for(const name of ['pointercancel','lostpointercapture'])target.addEventListener(name,e=>{if(pointer===e.pointerId){clear();show();}});
  target.addEventListener('keydown',e=>{if(e.code!=='Space')return;e.preventDefault();if(e.repeat||space)return;sound.unlock();space=true;act();});
}
// Release belongs to the held gesture even if focus moved to another control.
document.addEventListener('keyup',e=>{if(e.code!=='Space'||!space)return;e.preventDefault();space=false;act();});
$('continue').onclick=()=>{if(!active||paused)return;clear();const s=world.snapshot();if(s.phase==='caught')world.next();else if(s.phase==='won')world.restart();else world.retry();visualTime=0;last=0;sound.stop();save();paint();};
$('retry').onclick=retry;$('start').onclick=start;$('stop').onclick=stop;
$('mute').onclick=()=>{muted=!muted;if(!muted)sound.unlock();sound.setMuted(muted);$('mute').setAttribute('aria-pressed',String(muted));$('mute').querySelector('img').src=`../assets/icons/${muted?'volume-x':'volume-2'}.svg`;};
$('motion').setAttribute('aria-pressed',String(reduced));$('motion').onclick=()=>{reduced=!reduced;$('motion').setAttribute('aria-pressed',String(reduced));if(!active)paint();};
$('expand').onclick=()=>{const expanded=document.querySelector('main').classList.toggle('expanded');$('expand').setAttribute('aria-pressed',String(expanded));if(!active||paused)paint();};
document.addEventListener('visibilitychange',()=>{hidden=document.hidden;reconcilePause();});
window.addEventListener('blur',()=>{blurred=true;reconcilePause();});window.addEventListener('focus',()=>{blurred=false;reconcilePause();});
window.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelector('main').classList.remove('expanded');$('expand').setAttribute('aria-pressed','false');clear();}});
function destroy(){if(disposed)return;stop();disposed=true;world?.destroy();painter?.dispose();world=painter=null;sound.dispose();document.querySelectorAll('button').forEach(b=>b.disabled=true);}
window.addEventListener('pagehide',destroy);
window.reelPilot={start,stop,pause,destroy,snapshot:()=>world?.snapshot(),state:()=>({active,loading,paused,disposed,voices:sound.voices(),rendering:frame!==0,...painter?.diagnostics()})};
void start();
