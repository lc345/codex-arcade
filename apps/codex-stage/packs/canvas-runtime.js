// Lifecycle adapter for reviewed Canvas games with asynchronous local artwork.
export function createCanvasPack(canvas,program,{createWorld,createPainter,createSound},callbacks={}) {
  const sound=createSound(),listeners=[],keys=new Set(),listen=(el,type,fn)=>{el.addEventListener(type,fn);listeners.push(()=>el.removeEventListener(type,fn));};
  let world,painter,checkpoint,active=false,disposed=false,paused=false,hidden=document.hidden,reduced=false,frame=0,last=0,time=0,ticket=0,pointer=null,space=false,signature='',error=false;
  const height=program.canvasHeight??640;
  const can=()=>active&&!paused&&!hidden&&!disposed&&world&&painter;
  const controls=()=>({primary:{label:world?.snapshot().phase==='won'?'再来一轮':world?.snapshot().phase==='caught'?'下一件':world?.snapshot().phase==='lost'?'重试':'开始',hidden:world?.snapshot().phase==='playing',hint:program.hint},secondary:{label:''}});
  function snapshot(){const s=world?.snapshot();return s?{...s,id:program.id,score:Math.round(s.damage??s.progress??0),level:s.stage,status:s.notice||program.levels[s.stage],primaryEnabled:true,abilityAvailable:false}:{id:program.id,phase:error?'error':'loading',level:0,score:0,primaryEnabled:false};}
  function notify(){const s=snapshot(),key=[s.phase,s.stage,s.charge,s.player?.hp,s.held,s.settled,s.guards?.map(g=>g.mode).join(','),Math.floor((s.suspicion??0)*5)].join(':');if(key===signature)return;signature=key;callbacks.onFeedback?.({text:s.status??(error?'素材加载失败':'加载中'),score:s.score,snapshot:s,controls:controls()});}
  function draw(){
    if(!world||!painter)return;const s=world.snapshot();painter.draw(s,{time,reduced});
    if(program.id==='return-fire'){
      const c=canvas.getContext('2d');c.save();c.setTransform(canvas.width/960,0,0,canvas.height/640,0,0);
      c.fillStyle='#09241ddd';c.fillRect(16,12,928,34);c.fillStyle='#f9e8b2';c.font='bold 18px sans-serif';c.fillText(program.levels[s.stage],28,35);
      c.fillStyle='#334a3a';c.fillRect(170,24,590,9);c.fillStyle='#f3cc7d';c.fillRect(170,24,590*s.bossHp/[18,23,30][s.stage],9);
      c.fillStyle='#aeffd6';c.fillText('装甲 '+s.player.hp+' / 4',795,36);
      if(['ready','lost','won'].includes(s.phase)){c.fillStyle='#071b15bb';c.fillRect(270,280,420,80);c.fillStyle='#f9e6b8';c.textAlign='center';c.font='bold 28px sans-serif';c.fillText(s.phase==='ready'?'废港巨像':s.phase==='lost'?'装甲耗尽':'原弹奉还',480,329);}c.restore();
    }
    notify();
  }
  function clear(){pointer=null;space=false;keys.clear();world?.cancel();}
  function loop(now){frame=0;if(!can())return;const dt=last?Math.min(50,now-last):0;last=now;time+=dt/1000;
    if(world.move){const s=world.snapshot(),dx=Number(keys.has('ArrowRight')||keys.has('KeyD'))-Number(keys.has('ArrowLeft')||keys.has('KeyA')),dy=Number(keys.has('ArrowDown')||keys.has('KeyS'))-Number(keys.has('ArrowUp')||keys.has('KeyW'));if(dx||dy)world.move(s.player.x+dx*560*dt/1000,s.player.y+dy*560*dt/1000);}
    world.step(dt);draw();frame=requestAnimationFrame(loop);
  }
  function schedule(){clear();cancelAnimationFrame(frame);frame=0;last=0;sound.setActive(Boolean(can()));if(can())frame=requestAnimationFrame(loop);}
  async function start(){
    if(disposed||active)return;active=true;error=false;signature='';const own=++ticket;world?.destroy();world=createWorld({checkpoint,onEvent:sound.event});callbacks.onState?.({type:'started',program});
    try{if(!painter){const p=await createPainter(canvas);if(disposed||own!==ticket||!active){p.dispose();return;}painter=p;}draw();schedule();}
    catch{if(own===ticket&&active){error=true;world?.destroy();world=null;notify();}}
  }
  function stop(){if(!active)return;active=false;++ticket;clear();world?.stop();cancelAnimationFrame(frame);frame=0;sound.setActive(false);checkpoint=world?.checkpoint()??checkpoint;callbacks.onState?.({type:'stopped',program,score:snapshot().score});}
  function action(){if(!can())return false;sound.unlock();const s=world.snapshot();if(s.phase==='won')world.restart();else if(s.phase==='lost')world.retry();else if(s.phase==='caught')world.next();world.begin();draw();return true;}
  function held(){if(!can())return;const s=world.snapshot();if(['ready','lost','won','caught'].includes(s.phase))action();world.hold(pointer!==null||space);}
  function point(e){if(!world?.move)return;const r=canvas.getBoundingClientRect();world.move((e.clientX-r.x)/r.width*960,(e.clientY-r.y)/r.height*height);}
  listen(canvas,'pointerdown',e=>{if(!can()||e.button!==0||pointer!==null)return;e.preventDefault();sound.unlock();canvas.focus({preventScroll:true});pointer=e.pointerId;canvas.setPointerCapture(pointer);point(e);held();});
  listen(canvas,'pointermove',e=>{if(can()&&(e.pointerType==='mouse'||e.pointerId===pointer))point(e);});
  listen(canvas,'pointerup',e=>{if(e.pointerId!==pointer)return;pointer=null;if(can())world.hold(space);});
  for(const n of ['pointercancel','lostpointercapture','blur'])listen(canvas,n,clear);
  listen(canvas,'keydown',e=>{if(!can())return;if(e.code==='Space'){e.preventDefault();if(!e.repeat){space=true;sound.unlock();held();}}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS'].includes(e.code)){e.preventDefault();keys.add(e.code);}});
  listen(document,'keyup',e=>{keys.delete(e.code);if(e.code==='Space'&&space){space=false;if(can())world.hold(pointer!==null);}});
  listen(document,'visibilitychange',()=>{hidden=document.hidden;schedule();});listen(window,'blur',()=>{hidden=true;schedule();});listen(window,'focus',()=>{hidden=document.hidden;schedule();});
  return {start,stop,input(g){if(g==='retry')return this.retry();return g==='tap'?action():false;},retry(){if(error&&active&&!paused&&!hidden&&!disposed){active=false;void start();return true;}if(!can())return false;clear();world.retry();sound.stop();draw();return true;},
    setMuted(v){sound.setMuted(v);if(!v)sound.unlock();},setReduced(v){reduced=Boolean(v);},setPaused(v){paused=Boolean(v);schedule();},setLevel(){return false;},
    restoreCheckpoint(cp){if(!active)checkpoint=cp;},get checkpoint(){return world?.checkpoint()??checkpoint;},get snapshot(){return snapshot();},get controls(){return controls();},get active(){return active;},get program(){return program;},
    get diagnostics(){return {rendering:frame!==0,voices:sound.voices(),loaded:Boolean(painter),disposed};},
    destroy(){if(disposed)return;stop();disposed=true;listeners.forEach(off=>off());world?.destroy();painter?.dispose();sound.dispose();},
  };
}
