import { createGodotSession } from "./session.js";
const $ = id => document.getElementById(id), names=["锅炉重拳","涡轮连击","弹簧骗子"], key="agent-stage:junk-champion:v1";
let frame, snapshot, muted=true, reduced=matchMedia("(prefers-reduced-motion: reduce)").matches, checkpoint=null;
try { const raw=localStorage.getItem(key);if(raw&&raw.length<8192)checkpoint=JSON.parse(raw); }catch{}
const labels={ready:"拳手就位",won:"击倒对手",lost:"挑战结束",playing:"交锋中"};
const actions={"PERFECT!":"完美格挡","COUNTER!":"反击命中","CLEAN HIT":"命中破绽","GUARD BROKEN":"防御被击破","BLOCK":"挡住了","OUCH!":"受到重击","COVERED":"对手挡住了","CHAMPION":"三战全胜","KNOCKOUT":"击倒对手"};
function save(value){if(!value||typeof value!=="object")return;const raw=JSON.stringify(value);if(raw.length<8192){checkpoint=value;try{localStorage.setItem(key,raw);}catch{}}}
function update(value){
  if(!value||typeof value!=="object"||!Number.isFinite(value.hp)||!names[value.round])return;
  snapshot=value;$('opponent').textContent=names[value.round];
  $('next').hidden=!(value.phase==="won"&&value.round<2);
  $('live').textContent=(actions[value.banner]||labels[value.phase]||"交锋中")+` · 体力 ${Math.ceil(value.hp)} · 完美格挡 ${value.parries}`;
  save(value.checkpoint);
}
const session=createGodotSession({checkpoint,onState(state){
  $('task-state').textContent={loading:"本地引擎加载中",playing:"试玩任务进行中",stopped:"任务已结束",error:"引擎加载失败",idle:"本地试玩"}[state];
  $('start').disabled=state==="playing"||state==="loading";$('stop').disabled=state==="stopped"||state==="idle";
  $('retry').disabled=state!=="playing";$('next').disabled=state!=="playing";
  if(state==="playing")$('loading').hidden=true;
  if(state==="stopped"){$('live').textContent="任务结束 · 进度已保存";$('loading').hidden=true;}
  if(state==="error"){$('loading').hidden=false;$('loading').textContent="擂台加载失败";}
},boot({signal}){
  return new Promise((resolve,reject)=>{
    const child=document.createElement('iframe');frame=child;child.title="破烂拳王 Godot 擂台";child.setAttribute('aria-describedby','help');
    child.src=new URL('./built/game.html',location.href).href;
    let settled=false;
    const dispose=()=>{try{child.contentWindow.agentStageQuit?.();}catch{} child.remove();window.removeEventListener('message',receive);};
    const abort=()=>{clearTimeout(timeout);if(!settled){dispose();reject(new DOMException("Task ended","AbortError"));}};
    const receive=e=>{
      if(e.source!==child.contentWindow||e.origin!==location.origin||e.data?.source!=="agent-stage-junk")return;
      const {type,value}=e.data;
      if(type==='ready'&&!settled){settled=true;clearTimeout(timeout);signal.removeEventListener('abort',abort);resolve({
        command(type,value){child.contentWindow.agentStageCommand?.(type,value);update(child.contentWindow.agentStageSnapshot?.());},dispose,
      });}
      if(type==='snapshot'&&session.state==='playing')update(value);
      if(type==='progress'&&!settled)$('loading').textContent=value===null?'本地引擎加载中':`本地引擎 ${value}%`;
      if(type==='failed'&&!settled){clearTimeout(timeout);dispose();reject(new Error(value));}
    };
    const timeout=setTimeout(()=>{if(!settled){dispose();reject(new Error('Engine boot timeout'));}},45000);
    signal.addEventListener('abort',abort,{once:true});
    window.addEventListener('message',receive);$('stage').appendChild(child);
  });
}});
session.setReduced(reduced);$('reduced').setAttribute('aria-pressed',String(reduced));
$('start').onclick=()=>session.start();$('stop').onclick=()=>session.stop();
$('retry').onclick=()=>{session.input('retry');frame?.contentWindow.focus();};
$('next').onclick=()=>{session.input('next');frame?.contentWindow.focus();};
$('mute').onclick=()=>{muted=!muted;session.setMuted(muted);$('mute').setAttribute('aria-pressed',String(muted));$('mute').querySelector('img').src=`../assets/icons/${muted?'volume-x':'volume-2'}.svg`;};
$('reduced').onclick=()=>{reduced=!reduced;session.setReduced(reduced);$('reduced').setAttribute('aria-pressed',String(reduced));};
$('expand').onclick=()=>{const expanded=document.querySelector('main').classList.toggle('expanded');$('expand').setAttribute('aria-pressed',String(expanded));};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelector('main').classList.remove('expanded');$('expand').setAttribute('aria-pressed','false');}});
document.addEventListener('visibilitychange',()=>session.setPaused(document.hidden));
window.addEventListener('pagehide',()=>session.destroy());
// Public simulator has no connection to Agent approval, tools, paths or outputs.
window.agentStagePilot={start:()=>session.start(),stop:()=>session.stop(),pause:v=>session.setPaused(v),snapshot:()=>snapshot,state:()=>session.state,destroy:()=>session.destroy()};
void session.start();
