import {createCanvasPack} from '../packs/canvas-runtime.js';
import {createStatueWorld} from './world.js';
import {createStatuePainter} from './painter.js';
import {createStatueSound} from './sound.js';
const $=id=>document.getElementById(id),key='agent-stage:statue-act:v1',program={id:'statue-act',title:'假装是雕像',levels:['小奖杯','大花瓶','半身像'],canvasHeight:600,hint:'按住前进，松手装雕像。保安回头前提前停稳。'};
let muted=true,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,disposed=false;
const runtime=createCanvasPack($('game'),program,{createWorld:createStatueWorld,createPainter:createStatuePainter,createSound:createStatueSound},{onFeedback:show,onState:()=>{queueMicrotask(show);}});
try{const raw=localStorage.getItem(key);if(raw&&raw.length<256)runtime.restoreCheckpoint(JSON.parse(raw));}catch{}
function save(){try{localStorage.setItem(key,JSON.stringify(runtime.checkpoint));}catch{}}
function show(){const s=runtime.snapshot;for(let i=0;i<3;i++)$('chapter-'+i).className=i<(s.stage??0)?'done':i===(s.stage??0)?'active':'';
  $('action').hidden=!runtime.active||!['ready','lost','caught','won'].includes(s.phase);$('action').textContent=s.phase==='won'?'再来一趟':s.phase==='caught'?'下一件展品':s.phase==='lost'?'再试一次':'进入展厅';
  $('action').disabled=!runtime.diagnostics.loaded;$('start').disabled=runtime.active;$('stop').disabled=!runtime.active;$('retry').disabled=!runtime.active;
  $('task').textContent=runtime.active?'试玩任务进行中':'任务已结束';$('live').textContent=!runtime.active?'已停止 · 展厅已保存':s.phase==='playing'?(s.suspicion>.4?'保安正在靠近':s.held?'溜走中':s.settled?'伪装中':'展品还在晃'):s.phase==='loading'?'素材加载中':s.phase==='error'?'素材加载失败，请重新开始任务':s.notice||'等待进入展厅';
}
$('action').onclick=()=>{runtime.input('tap');$('game').focus();};$('retry').onclick=()=>runtime.retry();
$('stop').onclick=()=>{runtime.stop();save();show();};$('start').onclick=()=>{runtime.start();show();};
$('mute').onclick=()=>{muted=!muted;runtime.setMuted(muted);$('mute').setAttribute('aria-pressed',String(muted));$('mute').querySelector('img').src=`../assets/icons/${muted?'volume-x':'volume-2'}.svg`;};
$('motion').setAttribute('aria-pressed',String(reduced));$('motion').onclick=()=>{reduced=!reduced;runtime.setReduced(reduced);$('motion').setAttribute('aria-pressed',String(reduced));};
$('expand').onclick=()=>{$('expand').setAttribute('aria-pressed',String(document.querySelector('main').classList.toggle('expanded')));};
window.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelector('main').classList.remove('expanded');$('expand').setAttribute('aria-pressed','false');}});
const saver=setInterval(save,1500);
function destroy(){if(disposed)return;save();runtime.destroy();clearInterval(saver);disposed=true;}
window.addEventListener('pagehide',destroy,{once:true});
window.statuePilot={snapshot:()=>runtime.snapshot,state:()=>({...runtime.diagnostics,active:runtime.active,disposed}),start:()=>runtime.start(),stop:()=>{runtime.stop();save();show();},pause:v=>runtime.setPaused(v),destroy};
runtime.setReduced(reduced);runtime.start();show();
