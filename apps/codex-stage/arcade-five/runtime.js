export function createFiveRuntime(canvas,program,{createWorld,createPainter,createSound},callbacks={}){
  const sound=createSound(),listeners=[];let world,painter,checkpoint,active=false,disposed=false,paused=false,hidden=document.hidden,frame=0,last=0,ticket=0,pointer=null,space=false,spaceConsumed=false,keyboardPoint=null,reduced=false,error=false,signature='';
  let seenPhase='',resultReadyAt=0;
  function observePhase(){const phase=world?.snapshot().phase;if(phase!==seenPhase){seenPhase=phase;resultReadyAt=performance.now()+350;}return phase;}
  const listen=(el,name,fn)=>{el.addEventListener(name,fn);listeners.push(()=>el.removeEventListener(name,fn));};
  const can=()=>Boolean(active&&!disposed&&!paused&&!hidden&&world&&painter&&!error);
  function controls(){const phase=world?.snapshot().phase;return {primary:{label:error?'重试':phase==='won'?'再来三关':phase==='cleared'?'下一关':phase==='lost'?'重试':'开始',hidden:phase==='playing',hint:program.hint},secondary:{label:''}};}
  function snapshot(){return world?{...world.snapshot(),id:program.id}: {id:program.id,phase:error?'error':'loading',level:0,stage:0,score:0,primaryEnabled:false};}
  function notify(){const s=snapshot(),key=[s.phase,s.stage,s.score,s.held,s.notice,Math.floor((s.progress??0)*10),Math.floor(s.charge*20)].join(':');if(key===signature)return;signature=key;callbacks.onFeedback?.({text:error?'素材加载失败，请重试':s.notice||program.goals?.[s.stage]||'准备好了',score:s.score,snapshot:s,controls:controls()});}
  function draw(){observePhase();if(world&&painter)painter.draw(world.snapshot(),{reduced});notify();}
  function clear(){pointer=null;space=false;spaceConsumed=false;keyboardPoint=null;world?.cancel();}
  function loop(now){frame=0;if(!can())return;const dt=last?Math.min(50,now-last):0;last=now;world.step(dt);sound.update?.(world.snapshot());draw();frame=requestAnimationFrame(loop);}
  function schedule(){clear();cancelAnimationFrame(frame);frame=0;last=0;sound.setActive(can());if(can())frame=requestAnimationFrame(loop);}
  function action(){if(!can())return false;const phase=observePhase();if(phase==='playing'||phase!=='ready'&&performance.now()<resultReadyAt)return false;sound.unlock();if(phase==='won')world.restart();else if(phase==='cleared')world.next();else if(phase==='lost')world.retry();world.begin();draw();return true;}
  async function start(){if(disposed||active)return;active=true;error=false;signature='';const own=++ticket;world?.destroy();world=createWorld({checkpoint,onEvent:sound.event});callbacks.onState?.({type:'started',program});
    try{if(!painter){const candidate=await createPainter(canvas);if(disposed||own!==ticket||!active){candidate.dispose();return;}painter=candidate;}draw();schedule();}
    catch{if(own===ticket&&active){error=true;world?.destroy();world=null;sound.setActive(false);notify();}}
  }
  function stop(){if(!active)return;active=false;++ticket;clear();world?.stop();cancelAnimationFrame(frame);frame=0;sound.setActive(false);checkpoint=world?.checkpoint()??checkpoint;callbacks.onState?.({type:'stopped',program,score:world?.snapshot().score??0});}
  const point=e=>painter.point(e.clientX,e.clientY);
  listen(canvas,'pointerdown',e=>{if(!can()||pointer!==null||e.button!==0)return;e.preventDefault();sound.unlock();canvas.focus({preventScroll:true});const p=point(e),consumed=world.snapshot().phase!=='playing';pointer={id:e.pointerId,x:e.clientX,y:e.clientY,consumed};canvas.setPointerCapture(e.pointerId);if(consumed)action();else if(program.inputMode!=='tap')world.down(p);draw();});
  listen(canvas,'pointermove',e=>{if(!can()||world.snapshot().phase!=='playing')return;const captured=pointer?.id===e.pointerId&&!pointer.consumed;if((program.inputMode==='drag'||program.inputMode==='hold'&&program.pointInput)&&captured||program.inputMode==='track'&&(captured||e.pointerType==='mouse')){keyboardPoint=null;world.move(point(e));}});
  listen(canvas,'pointerup',e=>{if(pointer?.id!==e.pointerId)return;const previous=pointer;pointer=null;if(!can()||previous.consumed)return;if(program.inputMode==='tap'){if(Math.hypot(e.clientX-previous.x,e.clientY-previous.y)>18)return;world.down(point(e));}world.up(point(e));draw();});
  for(const name of ['pointercancel','blur'])listen(canvas,name,clear);
  listen(canvas,'lostpointercapture',()=>{if(pointer!==null)clear();});
  listen(canvas,'keydown',e=>{if(!can())return;
    if(program.pointInput&&world.snapshot().phase==='playing'&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code)){e.preventDefault();const p=keyboardPoint||world.snapshot().controlPoint||{x:480,y:320};keyboardPoint={x:Math.max(0,Math.min(960,p.x+(e.code==='ArrowRight'?24:e.code==='ArrowLeft'?-24:0))),y:Math.max(70,Math.min(560,p.y+(e.code==='ArrowDown'?24:e.code==='ArrowUp'?-24:0)))};world.move(keyboardPoint);draw();return;}
    if(program.inputMode==='track'&&world.snapshot().phase==='playing'&&['ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();const p=world.snapshot().controlPoint||{x:480,y:526};keyboardPoint={x:Math.max(0,Math.min(960,p.x+(e.code==='ArrowRight'?24:-24))),y:p.y};world.move(keyboardPoint);draw();}
    if(e.code==='Space'){e.preventDefault();if(e.repeat||space)return;space=true;sound.unlock();spaceConsumed=world.snapshot().phase!=='playing';if(spaceConsumed)action();else if(program.inputMode!=='tap'){const s=world.snapshot();if(program.pointInput)keyboardPoint??={...s.controlPoint};else if(program.inputMode==='drag')keyboardPoint??={x:s.ball.x-150,y:s.ball.y};world.down(keyboardPoint||undefined);}draw();}
    if(program.inputMode==='drag'&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code)){e.preventDefault();const s=world.snapshot();keyboardPoint??={x:s.ball.x-150,y:s.ball.y};keyboardPoint.x+=e.code==='ArrowRight'?12:e.code==='ArrowLeft'?-12:0;keyboardPoint.y+=e.code==='ArrowDown'?12:e.code==='ArrowUp'?-12:0;if(space)world.move(keyboardPoint);draw();}
  });
  listen(document,'keyup',e=>{if(e.code!=='Space'||!space)return;e.preventDefault();space=false;if(can()&&!spaceConsumed){if(program.inputMode==='tap')world.down(keyboardPoint||undefined);world.up(keyboardPoint||undefined);}spaceConsumed=false;draw();});
  listen(document,'visibilitychange',()=>{hidden=document.hidden;schedule();});listen(window,'blur',()=>{hidden=true;schedule();});listen(window,'focus',()=>{hidden=document.hidden;schedule();});
  return {start,stop,input(gesture){if(!can())return false;if(gesture==='retry')return this.retry();if(world.snapshot().phase!=='playing')return gesture==='tap'?action():false;if(gesture==='hold-start')return world.down();if(gesture==='hold-end')return world.up();if(gesture==='tap'&&program.inputMode==='tap'){world.down();world.up();draw();return true;}return false;},
    retry(){if(error&&active&&!paused&&!hidden&&!disposed){active=false;void start();return true;}if(!can())return false;clear();world.retry();sound.stop();draw();return true;},
    setMuted(v){sound.setMuted(v);if(!v)sound.unlock();},setReduced(v){reduced=Boolean(v);if(can())draw();},setPaused(v){paused=Boolean(v);schedule();},setLevel(){return false;},
    restoreCheckpoint(cp){if(!active)checkpoint=cp;},get checkpoint(){return world?.checkpoint()??checkpoint;},get snapshot(){return snapshot();},get controls(){return controls();},get active(){return active;},get program(){return program;},
    get diagnostics(){return {rendering:frame!==0,voices:sound.voices(),loaded:Boolean(painter),disposed};},
    destroy(){if(disposed)return;stop();disposed=true;listeners.forEach(off=>off());world?.destroy();painter?.dispose();sound.dispose();},
  };
}
