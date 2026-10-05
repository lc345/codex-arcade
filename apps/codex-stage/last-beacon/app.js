import {prepareRapier} from '../vendor/rapier.js';
import {createBattleWorld,WEAPONS} from './world.js';
import {createBattlePainter} from './painter.js';
import {createBattleSound} from './sound.js';
import {BEACON_MAP} from './map.js';

const $=id=>document.getElementById(id),canvas=$('game'),sound=createBattleSound(),storageKey='agent-stage:last-beacon:v1',keys=new Set();
let world,painter,active=false,loading=false,paused=false,disposed=false,muted=true,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,frame=0,last=0,epoch=0,abort,saved,lookPointer=null,joyPointer=null,firePointer=null,lastX=0,lastY=0,joyX=0,joyY=0,yaw=0,pitch=0,firing=false,aiming=false,locked=false,hitAt=-1,damageAt=-1,lastCaption='',mapTime=-1;
try{const raw=localStorage.getItem(storageKey);if(raw&&raw.length<16000)saved=JSON.parse(raw);}catch{}
if(matchMedia('(pointer: coarse)').matches)document.body.classList.add('touch');
const can=()=>active&&!paused&&!disposed&&world?.snapshot().phase==='playing';
const clock=t=>`${String(Math.floor(Math.ceil(t)/60)).padStart(2,'0')}:${String(Math.ceil(t)%60).padStart(2,'0')}`;
function event(e){sound.event(e);if(e.type==='hit')hitAt=world?.snapshot().time??0;if(e.type==='hurt')damageAt=world?.snapshot().time??0;}
function save(){if(!world)return;saved=world.checkpoint();try{localStorage.setItem(storageKey,JSON.stringify(saved));}catch{}}
function input(){if(!can())return;world.control({yaw,pitch,forward:joyY+Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown')),strafe:joyX+Number(keys.has('KeyD'))-Number(keys.has('KeyA')),fire:firing||keys.has('Space'),sprint:keys.has('ShiftLeft')||keys.has('ShiftRight')});}
function clear(){keys.clear();firing=aiming=false;lookPointer=joyPointer=firePointer=null;joyX=joyY=0;$('joystick').querySelector('i').style.transform='none';world?.cancel();}
function unlock(){if(document.pointerLockElement===canvas)document.exitPointerLock();}
function minimap(s){
  const c=$('minimap').getContext('2d'),size=192,scale=1.4,to=(x,z)=>[96+x*scale,96+z*scale];c.clearRect(0,0,size,size);c.fillStyle='#203a30e8';c.fillRect(0,0,size,size);
  c.fillStyle='#586a5d';for(const o of BEACON_MAP.obstacles){const [x,z]=to(o.x,o.z);c.fillRect(x-o.w*scale/2,z-o.d*scale/2,o.w*scale,o.d*scale);}
  const [zx,zz]=to(s.zone.x,s.zone.z);c.strokeStyle='#70c6df';c.lineWidth=2;c.beginPath();c.arc(zx,zz,s.zone.radius*scale,0,Math.PI*2);c.stroke();c.setLineDash([3,3]);c.strokeStyle='#f3e6be';c.beginPath();c.arc(zx,zz,s.zone.nextRadius*scale,0,Math.PI*2);c.stroke();c.setLineDash([]);
  for(const a of s.actors){if(a.id===0||a.hp<=0||s.time-a.lastShot>2.5||Math.hypot(a.x-s.player.x,a.z-s.player.z)>40)continue;const [x,z]=to(a.x,a.z);c.fillStyle='#ec9473';c.beginPath();c.arc(x,z,3,0,Math.PI*2);c.fill();}
  for(const l of s.loot){if(l.taken||Math.hypot(l.x-s.player.x,l.z-s.player.z)>18)continue;const [x,z]=to(l.x,l.z);c.fillStyle='#e9cd85';c.fillRect(x-1.5,z-1.5,3,3);}
  const [x,z]=to(s.player.x,s.player.z);c.save();c.translate(x,z);c.rotate(s.player.yaw);c.fillStyle='#fff4c3';c.beginPath();c.moveTo(0,-6);c.lineTo(4,4);c.lineTo(0,2);c.lineTo(-4,4);c.closePath();c.fill();c.restore();
  c.fillStyle='#d1dbc9';c.font='10px monospace';c.fillText('N',91,11);
}
function show(s=world?.snapshot()){
  if(!s)return;const p=s.player,z=s.zone;
  $('alive').textContent=s.alive;$('kills').textContent=p.kills;$('zone-label').textContent=z.shrinking?'安全区缩小':'缩圈倒计时';$('zone-clock').textContent=clock(z.until);
  $('weapon').textContent=WEAPONS[p.weapon].name;$('ammo').innerHTML=`${p.mag} <small>/ ${p.reserve}</small>`;$('health').value=p.hp;$('armor').value=p.armor;$('hp-value').textContent=Math.ceil(p.hp);$('armor-value').textContent=Math.ceil(p.armor);$('meds').textContent=p.medkits;
  $('reload').disabled=!can()||p.reload>0||p.reserve===0||p.mag===WEAPONS[p.weapon].mag;$('heal').disabled=!can()||p.medkits===0||p.hp>=100||p.heal>0;$('pickup').disabled=!can()||!s.nearby;
  $('action-progress').hidden=p.reload===0&&p.heal===0;$('action-progress').value=p.heal>0?1-p.heal/1.7:1-p.reload/WEAPONS[p.weapon].reload;
  const deg=((p.yaw*180/Math.PI)%360+360)%360;$('compass').textContent=`${['N','NE','E','SE','S','SW','W','NW'][Math.round(deg/45)%8]}  ${Math.round(deg)}°`;
  const warn=Math.hypot(p.x-z.x,p.z-z.z)>z.radius;
  $('notice').textContent=!active?'任务已结束 · 战局已保存':paused?'已暂停':warn?'正在安全区外':p.heal>0?'使用医疗包':p.reload>0?'更换弹匣':s.notice||((s.nearby)?{rifle:'R4 突击步枪',scatter:'K6 霰弹枪',ammo:'弹药箱',armor:'防弹护甲',med:'医疗包'}[s.nearby]:'');
  const curtain=active&&(s.phase!=='playing'||paused);$('curtain').hidden=!curtain;
  if(curtain){$('result-tag').textContent=s.phase==='won'?'LAST ONE STANDING':s.phase==='lost'?'ELIMINATED':paused?'PAUSED':'COASTAL STATION / SOLO';$('result-title').textContent=s.phase==='won'?'最后的生还者':s.phase==='lost'?'下局再来':paused?'暂时停火':'最后信标';$('result-detail').textContent=s.phase==='won'?`${p.kills} 次淘汰 · ${clock(s.time)}`:s.phase==='lost'?`${s.reason} · 第 ${s.alive+1} 名`:s.time>0?`剩余 ${s.alive} 人 · 战局已保留`:'8 名生还者 · 海岸站';$('enter').textContent=['won','lost'].includes(s.phase)?'再战一局':paused?'继续战斗':s.time>0?'返回战场':'进入战场';$('enter').disabled=false;}
  $('crosshair').hidden=!active||s.phase!=='playing'||paused;
  const point=painter?.crosshair()??{x:.5,y:.5};for(const id of ['crosshair','hit-mark']){$(id).style.left=`${Math.max(.03,Math.min(.97,point.x))*100}%`;$(id).style.top=`${Math.max(.05,Math.min(.95,point.y))*100}%`;}
  $('hit-mark').classList.toggle('flash',s.time-hitAt<.13);$('damage').classList.toggle('flash',s.time-damageAt<.25);
  const entries=s.feed.map(f=>f.text).join('|');if($('feed').dataset.entries!==entries){$('feed').dataset.entries=entries;$('feed').replaceChildren(...s.feed.map(f=>{const li=document.createElement('li');li.textContent=f.text;return li;}));}
  const caption=`${s.phase} · 存活 ${s.alive} · 淘汰 ${p.kills}`;if(caption!==lastCaption){lastCaption=caption;$('live').textContent=caption;}
  if(mapTime<0||s.time-mapTime>.12||s.phase!=='playing'){minimap(s);mapTime=s.time;}
}
function paint(){if(!painter||!world)return;const s=world.snapshot();painter.draw(s,{reduced,aiming});show(s);}
function loop(now){frame=0;if(!active||paused||disposed)return;const dt=last?Math.min(50,now-last):0;last=now;
  if(keys.has('ArrowLeft'))yaw-=dt*.0017;if(keys.has('ArrowRight'))yaw+=dt*.0017;input();world.step(dt);paint();const s=world.snapshot();sound.update(s);if(['lost','won'].includes(s.phase)&&document.pointerLockElement===canvas)unlock();frame=requestAnimationFrame(loop);
}
async function start(){
  if(active||loading||disposed)return;loading=true;const own=++epoch;abort=new AbortController();$('task').textContent='本地场景加载中';$('start').disabled=true;
  try{await prepareRapier();if(own!==epoch||disposed)return;if(!painter){const p=await createBattlePainter(canvas,{signal:abort.signal});if(own!==epoch||disposed){p.dispose();return;}painter=p;}
    world?.destroy();world=createBattleWorld({checkpoint:saved,onEvent:event});yaw=world.snapshot().player.yaw;pitch=0;active=true;loading=false;paused=document.hidden;last=0;mapTime=-1;sound.setActive(!paused);$('task').textContent='试玩任务进行中';$('stop').disabled=false;paint();if(!paused)frame=requestAnimationFrame(loop);
  }catch(e){if(own!==epoch||disposed)return;loading=false;$('task').textContent='加载失败';$('notice').textContent='本地场景加载失败';$('live').textContent=e.message;$('start').disabled=false;}
}
function stop(){++epoch;abort?.abort();loading=false;active=false;clear();world?.stop();cancelAnimationFrame(frame);frame=0;sound.setActive(false);save();unlock();$('task').textContent='任务已结束';$('start').disabled=false;$('stop').disabled=true;show();}
function pause(v){if(disposed)return;paused=Boolean(v);clear();cancelAnimationFrame(frame);frame=0;last=0;sound.setActive(active&&!paused);if(active&&!paused)frame=requestAnimationFrame(loop);show();}
function retry(){if(!active||!world)return;clear();world.destroy();world=createBattleWorld({onEvent:event});saved=null;yaw=pitch=0;hitAt=damageAt=-1;mapTime=-1;paused=false;last=0;sound.stop();sound.setActive(true);cancelAnimationFrame(frame);frame=requestAnimationFrame(loop);paint();}
function capture(){if(!document.body.classList.contains('touch')){try{Promise.resolve(canvas.requestPointerLock?.()).catch(()=>{});}catch{}}canvas.focus({preventScroll:true});}
$('enter').onclick=()=>{sound.unlock();if(['won','lost'].includes(world?.snapshot().phase))retry();if(paused)pause(false);world?.begin();capture();paint();};
$('start').onclick=start;$('stop').onclick=stop;$('retry').onclick=retry;$('reload').onclick=()=>world?.reload();$('pickup').onclick=()=>world?.interact();$('heal').onclick=()=>{firing=false;keys.delete('Space');world?.heal();};
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{if(!can())return;e.preventDefault();sound.unlock();canvas.focus({preventScroll:true});if(e.pointerType==='touch')document.body.classList.add('touch');lookPointer=e.pointerId;lastX=e.clientX;lastY=e.clientY;if(e.pointerType==='mouse'){if(e.button===0){firing=true;capture();}if(e.button===2)aiming=true;}else canvas.setPointerCapture(e.pointerId);input();});
canvas.addEventListener('pointermove',e=>{if(!can())return;const captured=document.pointerLockElement===canvas;if(!captured&&e.pointerId!==lookPointer)return;const dx=captured?e.movementX:e.clientX-lastX,dy=captured?e.movementY:e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;yaw+=dx*(aiming?.0019:.0032);pitch=Math.max(-.65,Math.min(.7,pitch-dy*(aiming?.0015:.0025)));input();});
document.addEventListener('pointerup',e=>{if(e.pointerType==='mouse'){if(e.button===0)firing=false;if(e.button===2)aiming=false;}if(e.pointerId===lookPointer)lookPointer=null;input();});canvas.addEventListener('pointercancel',clear);canvas.addEventListener('lostpointercapture',e=>{if(e.pointerId===lookPointer){lookPointer=null;input();}});
canvas.addEventListener('keydown',e=>{if(!can())return;if(e.code==='Escape'){pause(true);unlock();return;}if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','Space','KeyR','KeyE','KeyH'].includes(e.code)){e.preventDefault();keys.add(e.code);sound.unlock();if(!e.repeat){if(e.code==='KeyR')world.reload();if(e.code==='KeyE')world.interact();if(e.code==='KeyH'){firing=false;keys.delete('Space');world.heal();}}input();}});
document.addEventListener('keyup',e=>{keys.delete(e.code);input();});canvas.addEventListener('blur',()=>{if(!document.pointerLockElement)clear();});
document.addEventListener('pointerlockchange',()=>{const now=document.pointerLockElement===canvas;if(locked&&!now&&can())pause(true);locked=now;});
const stick=$('joystick');function moveStick(e){const r=stick.getBoundingClientRect(),dx=(e.clientX-r.x-r.width/2)/34,dy=(e.clientY-r.y-r.height/2)/34,n=Math.max(1,Math.hypot(dx,dy));joyX=dx/n;joyY=-dy/n;stick.querySelector('i').style.transform=`translate(${joyX*27}px,${-joyY*27}px)`;input();}
stick.addEventListener('pointerdown',e=>{if(!can())return;e.preventDefault();joyPointer=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e);});stick.addEventListener('pointermove',e=>{if(e.pointerId===joyPointer)moveStick(e);});for(const event of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(event,()=>{joyPointer=null;joyX=joyY=0;stick.querySelector('i').style.transform='none';input();});
$('touch-fire').addEventListener('pointerdown',e=>{if(!can())return;e.preventDefault();sound.unlock();firePointer=e.pointerId;$('touch-fire').setPointerCapture(e.pointerId);firing=true;input();});for(const event of ['pointerup','pointercancel','lostpointercapture'])$('touch-fire').addEventListener(event,e=>{if(e.pointerId!==firePointer)return;firePointer=null;firing=false;input();});
$('mute').onclick=()=>{sound.unlock();muted=!muted;sound.setMuted(muted);$('mute').setAttribute('aria-pressed',String(muted));$('mute').querySelector('img').src=`../assets/icons/${muted?'volume-x':'volume-2'}.svg`;};
$('motion').setAttribute('aria-pressed',String(reduced));$('motion').onclick=()=>{reduced=!reduced;$('motion').setAttribute('aria-pressed',String(reduced));paint();};
$('expand').onclick=()=>{if(document.fullscreenElement)void document.exitFullscreen();else void $('stage').requestFullscreen?.().catch(()=>{});};
window.addEventListener('blur',()=>{if(active)pause(true);});document.addEventListener('visibilitychange',()=>{if(document.hidden&&active)pause(true);});
const saveTimer=setInterval(()=>{if(active)save();},3000);
function destroy(){if(disposed)return;stop();disposed=true;clearInterval(saveTimer);world?.destroy();painter?.dispose();sound.dispose();}
window.addEventListener('pagehide',destroy);window.battlePilot={start,stop,pause,destroy,snapshot:()=>world?.snapshot(),state:()=>({active,paused,loading,disposed,rendering:frame!==0,voices:sound.voices(),...painter?.diagnostics()})};
void start();
