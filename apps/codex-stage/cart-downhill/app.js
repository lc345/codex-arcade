import {prepareRapier} from '../vendor/rapier.js';
import {createCartWorld} from './world.js';
import {createCartPainter} from './painter.js';
import {createCartSound} from './sound.js';
const $=id=>document.getElementById(id),canvas=$('game'),sound=createCartSound(),key='agent-stage:cart-downhill:v1';
let world,painter,active=false,loading=false,paused=false,muted=true,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,frame=0,last=0,token=0,abort,steer=0,brake=false,pointer=null,lastState='',disposed=false;
const keys=new Set();let saved=null;
let hudSignature='';
try{const raw=localStorage.getItem(key);if(raw&&raw.length<1024)saved=JSON.parse(raw);}catch{}
function save(){if(!world)return;saved=world.checkpoint();try{localStorage.setItem(key,JSON.stringify(saved));}catch{}}
function show(){
  if(!world)return;const s=world.snapshot();
  const notice=!active?'任务结束 · 已保存路段':paused?'已暂停':s.tilt>.3?'稳住购物车！':s.hit>0?'小心撞击':s.distance>242&&s.phase==='playing'?'派对到了 · 减速停车':'';
  const progress=Math.min(100,Math.floor(s.distance/260*100));
  const signature=JSON.stringify([active,s.phase,s.cake,Math.ceil(260-s.distance),Math.round(s.speed*3.6),s.district,progress,notice,s.reason,['won','lost'].includes(s.phase)?s.time.toFixed(1):null]);
  if(signature===hudSignature)return;hudSignature=signature;
  $('cake').innerHTML=`${s.cake}<small>%</small>`;$('health').value=s.cake;
  $('distance').innerHTML=`${Math.max(0,Math.ceil(260-s.distance))}<small>m</small>`;$('speed').innerHTML=`${String(Math.round(s.speed*3.6)).padStart(2,'0')}<small>km/h</small>`;
  $('district').textContent=['01 / 坡顶街区','02 / 集市混乱','03 / 码头派对'][s.district];$('progress').style.width=progress+'%';
  $('drive').hidden=!active||s.phase!=='ready';$('result').hidden=!['won','lost'].includes(s.phase)||!active;
  if(s.phase==='won'||s.phase==='lost'){$('result-title').textContent=s.reason;$('result-label').textContent=s.phase==='won'?'DELIVERED':'SPECIAL DELIVERY';$('result-detail').textContent=s.phase==='won'?`蛋糕完整度 ${s.cake}% · ${s.time.toFixed(1)} 秒`:`${Math.round(s.distance)} 米 · 最近路段可重试`;}
  $('notice').textContent=notice;
  const caption=`${s.phase==='won'?'送达':s.phase==='lost'?s.reason:['坡顶出发','穿过集市','送往码头'][s.district]} · 蛋糕 ${s.cake}%`;
  if(lastState!==caption){lastState=caption;$('live').textContent=caption;}
}
function paint(){if(world&&painter){painter.draw(world.state(),{reduced});show();}}
function loop(now){frame=0;if(!active||paused||disposed)return;world.step(last?Math.min(50,now-last):0);last=now;paint();const s=world.snapshot();sound.update(s.phase==='playing'?s.speed:0,s.braking);frame=requestAnimationFrame(loop);}
async function start(){
  if(disposed||active||loading)return;loading=true;const own=++token;abort=new AbortController();$('task').textContent='本地场景加载中';$('start').disabled=true;
  try{
    await prepareRapier();if(own!==token||disposed)return;
    if(!painter){const next=await createCartPainter(canvas,{signal:abort.signal});if(own!==token||disposed){next.dispose();return;}painter=next;}
    if(!world)world=createCartWorld({checkpoint:saved,onEvent:sound.event});else world.resume();
    active=true;loading=false;paused=document.hidden;last=0;steer=0;brake=false;sound.setActive(!paused);$('task').textContent='试玩任务进行中';$('stop').disabled=false;
    paint();if(!paused)frame=requestAnimationFrame(loop);
  }catch(e){if(own!==token||disposed)return;loading=false;$('notice').textContent='场景加载失败';$('live').textContent=e.message;$('start').disabled=false;}
}
function clear(){steer=0;brake=false;pointer=null;keys.clear();world?.cancel();$('brake').classList.remove('held');}
function stop(){++token;abort?.abort();loading=false;active=false;cancelAnimationFrame(frame);frame=0;clear();world?.stop();sound.setActive(false);save();$('task').textContent='任务已结束';$('start').disabled=false;$('stop').disabled=true;show();}
function pause(value){if(disposed)return;paused=Boolean(value);clear();sound.setActive(active&&!paused);cancelAnimationFrame(frame);frame=0;last=0;if(active&&!paused)frame=requestAnimationFrame(loop);show();}
function act(){if(!active||paused||!world)return false;return world.input(steer,brake);}
function retry(){if(!active||paused)return;clear();world.retry();last=0;paint();canvas.focus();}
function coord(e){const b=canvas.getBoundingClientRect();return Math.max(-1,Math.min(1,(e.clientX-b.left)/b.width*2-1));}
canvas.addEventListener('pointerdown',e=>{if(!active||paused)return;e.preventDefault();sound.unlock();canvas.focus();pointer=e.pointerId;canvas.setPointerCapture(pointer);steer=coord(e);brake=e.pointerType==='mouse';act();});
canvas.addEventListener('pointermove',e=>{if(!active||paused||!world||world.snapshot().phase==='ready')return;if(e.pointerType!=='mouse'&&pointer!==e.pointerId)return;steer=coord(e);act();});
canvas.addEventListener('pointerup',e=>{if(pointer!==e.pointerId)return;pointer=null;brake=false;act();});
canvas.addEventListener('pointercancel',clear);canvas.addEventListener('lostpointercapture',()=>{if(pointer!==null)clear();});
canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight',' ','Enter','r','R'].includes(e.key))return;e.preventDefault();sound.unlock();if(e.key.toLowerCase()==='r'){retry();return;}keys.add(e.key);steer=Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft'));brake=keys.has(' ');act();});
canvas.addEventListener('keyup',e=>{if(!['ArrowLeft','ArrowRight',' ','Enter'].includes(e.key))return;e.preventDefault();keys.delete(e.key);steer=Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft'));brake=keys.has(' ');act();});
$('brake').addEventListener('pointerdown',e=>{e.preventDefault();sound.unlock();$('brake').setPointerCapture(e.pointerId);brake=true;$('brake').classList.add('held');act();});
for(const type of ['pointerup','pointercancel','lostpointercapture'])$('brake').addEventListener(type,()=>{brake=false;$('brake').classList.remove('held');if(active&&world?.snapshot().phase==='playing')act();});
$('drive').onclick=()=>{sound.unlock();steer=0;brake=false;act();canvas.focus();};$('retry').onclick=retry;$('retry-result').onclick=retry;
$('start').onclick=start;$('stop').onclick=stop;
$('mute').onclick=()=>{sound.unlock();muted=!muted;sound.setMuted(muted);$('mute').setAttribute('aria-pressed',String(muted));$('mute').querySelector('img').src=`../assets/icons/${muted?'volume-x':'volume-2'}.svg`;};
$('motion').setAttribute('aria-pressed',String(reduced));$('motion').onclick=()=>{reduced=!reduced;$('motion').setAttribute('aria-pressed',String(reduced));};
$('expand').onclick=()=>{const value=document.querySelector('main').classList.toggle('expanded');$('expand').setAttribute('aria-pressed',String(value));if(!active)paint();};
window.addEventListener('blur',clear);document.addEventListener('visibilitychange',()=>pause(document.hidden));
window.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelector('main').classList.remove('expanded');$('expand').setAttribute('aria-pressed','false');}});
function destroy(){if(disposed)return;stop();disposed=true;world?.destroy();painter?.dispose();world=painter=null;sound.dispose();document.querySelectorAll('button').forEach(b=>b.disabled=true);}
window.addEventListener('pagehide',destroy);
window.cartPilot={start,stop,pause,destroy,snapshot:()=>world?.snapshot(),state:()=>({active,loading,paused,disposed,voices:sound.voices(),rendering:frame!==0,...painter?.diagnostics()})};
void start();
