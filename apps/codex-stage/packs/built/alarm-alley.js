// Reviewed Agent Stage Canvas pack. Apache-2.0. Matter.js retains its MIT notice.
export default (()=>{const createFiveKernel=function createFiveKernel(id,{checkpoint,onEvent=()=>{}}={}){
  const s={id,stage:0,phase:'ready',time:0,score:0,held:false,notice:'',lastEvent:null};
  let active=true,disposed=false,acc=0,serial=0,hooks={};
  const valid=checkpoint?.version===1&&checkpoint.id===id&&Number.isInteger(checkpoint.stage)&&checkpoint.stage>=0&&checkpoint.stage<3&&['ready','cleared','won'].includes(checkpoint.phase)&&(checkpoint.phase!=='won'||checkpoint.stage===2);
  function event(type,extra={}){if(!active||disposed)return;s.lastEvent={type,at:s.time,serial:++serial,...extra};onEvent(s.lastEvent);}
  function reset(stage){s.stage=stage;s.phase='ready';s.time=0;s.score=0;s.held=false;s.notice='';s.lastEvent=null;acc=0;hooks.reset?.();}
  const api={
    begin(){if(!active||disposed||s.phase!=='ready')return false;s.phase='playing';event('start');return true;},
    step(ms){if(!active||disposed||s.phase!=='playing'||!Number.isFinite(ms)||ms<=0)return;acc+=Math.min(ms,50);while(acc>=1000/120&&s.phase==='playing'){acc-=1000/120;s.time+=1/120;hooks.tick?.(1/120);}},
    cancel(){s.held=false;hooks.clear?.();},
    retry(){if(!active||disposed)return false;reset(s.stage);return true;},
    next(){if(!active||disposed||s.phase!=='cleared'||s.stage>=2)return false;reset(s.stage+1);return true;},
    restart(){if(!active||disposed)return false;reset(0);return true;},
    snapshot(){return {...s,active,level:s.stage,primaryEnabled:true,abilityAvailable:false,...hooks.read?.(),lastEvent:s.lastEvent?{...s.lastEvent}:null};},
    checkpoint(){return {version:1,id,stage:s.stage,phase:['cleared','won'].includes(s.phase)?s.phase:'ready'};},
    stop(){if(!active)return;api.cancel();active=false;},
    destroy(){if(disposed)return;api.stop();disposed=true;hooks.dispose?.();},
  };
  return {s,api,event,
    configure(value){hooks=value;reset(valid?checkpoint.stage:0);if(valid&&checkpoint.phase!=='ready'){s.phase=checkpoint.phase;hooks.restoreCompleted?.();}},
    input(fn,p){if(!active||disposed||s.phase!=='playing'||p&&(!Number.isFinite(p.x)||!Number.isFinite(p.y)))return false;return fn(p)!==false;},
    finish(won,notice){if(s.phase!=='playing')return;s.held=false;hooks.clear?.();s.phase=won?(s.stage===2?'won':'cleared'):'lost';s.notice=notice;event(won?'win':'lose');},
  };
},createOddKit=function createOddKit(id,options={}){
  const k=createFiveKernel(id,options),{s,api}=k;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  let hooks={};
  const point=()=>s.controlPoint||{x:480,y:320};
  function bind(h){hooks=h;k.configure({reset(){Object.assign(s,{progress:0,goal:1,errors:0,heat:0,controlPoint:{x:480,y:320},limit:40});h.reset();},tick(dt){h.tick(dt);if(s.time>s.limit&&s.phase==='playing')k.finish(false,'时间到了');},read:()=>structuredClone(h.read?.()||{}),clear(){s.held=false;h.clear?.();},restoreCompleted(){s.progress=s.goal;s.score=s.goal*100;h.restoreCompleted?.();},dispose:()=>h.dispose?.()});}
  api.down=p=>k.input(()=>{s.held=true;if(p)s.controlPoint={...p};return hooks.down?.(p||point());},p);
  api.move=p=>k.input(()=>{if(p)s.controlPoint={...p};return hooks.move?.(p||point());},p);
  api.up=p=>k.input(()=>{const held=s.held;s.held=false;return held?hooks.up?.(p||point()):false;},p);
  function gain(x=480,y=320){s.progress++;s.score+=100;k.event('catch',{x,y});if(s.progress>=s.goal)k.finish(true,'漂亮，过关');}
  function miss(text='这次没接住'){s.errors++;k.event('hit');if(s.errors>=3)k.finish(false,text);}
  const snapshot=api.snapshot;api.snapshot=()=>structuredClone(snapshot());
  return {k,s,api,bind,clamp,dist,gain,miss};
},linesCross=function linesCross(a,b,c,d){
  const cross=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);
  if(Math.max(a.x,b.x)<Math.min(c.x,d.x)||Math.max(c.x,d.x)<Math.min(a.x,b.x)||Math.max(a.y,b.y)<Math.min(c.y,d.y)||Math.max(c.y,d.y)<Math.min(a.y,b.y))return false;
  return cross(a,b,c)*cross(a,b,d)<=0&&cross(c,d,a)*cross(c,d,b)<=0;
},createWorld=function createAlarm(options){
  const {s,api,bind,gain,miss}=createOddKit('alarm-alley',options);let clocks=[],serial=0,next=0;
  bind({reset(){s.goal=8+s.stage*2;s.limit=30;serial=0;next=.4;clocks=Array.from({length:9},(_,i)=>({x:300+i%3*180,y:185+Math.floor(i/3)*140,mode:'sleep',until:0}));s.controlPoint={x:480,y:325};},tick(){for(const c of clocks)if(c.mode==='ring'&&s.time>c.until){c.mode='sleep';miss('闹钟把整栋楼叫醒了');}if(s.time>=next){const c=clocks[(serial*5+s.stage*2)%9];c.mode='ring';c.until=s.time+1.35-s.stage*.17;serial++;next=s.time+.96-s.stage*.12;}},down(p){const c=clocks.find(c=>Math.hypot(c.x-p.x,c.y-p.y)<62);if(!c||c.mode!=='ring'){miss('敲醒了睡着的闹钟');return;}c.mode='sleep';gain(c.x,c.y);},read:()=>({clocks})});return api;
},oddBrushes=function oddBrushes(g){
  const {c,rect,ellipse,path,line,text,meter}=g;
  function hud(s,label,color='#286b68'){
    rect(18,575,924,49,'#fffdf2ef',5);text(label,38,600,19,'#29444a');
    const progress=Math.min(1,s.progress/s.goal);meter(434,598,290,progress,color);text(`${Math.min(s.goal,Math.floor(s.progress))} / ${s.goal}`,746,600,19,'#29444a');
    text(`${Math.max(0,Math.ceil(s.limit-s.time))}s`,916,600,18,s.limit-s.time<8?'#c94651':'#29444a','right');
  }
  function face(x,y,w=26,color='#213c4c'){ellipse(x-w*.35,y,3,4,color);ellipse(x+w*.35,y,3,4,color);c.beginPath();c.arc(x,y+4,w*.2,0,Math.PI);c.strokeStyle=color;c.lineWidth=2;c.stroke();}
  function cross(p,color='#fff5b9'){line([[p.x-10,p.y],[p.x+10,p.y]],color,2);line([[p.x,p.y-10],[p.x,p.y+10]],color,2);ellipse(p.x,p.y,16,16,null,color,1);}
  function spark(x,y,t,color='#ffd967'){for(let i=0;i<7;i++){const a=i*2.399,r=7+(Math.sin(t*23+i)+1)*8;line([[x+Math.cos(a)*r,y+Math.sin(a)*r],[x+Math.cos(a)*(r+8),y+Math.sin(a)*(r+8)]],color,2);}}
  return {hud,face,cross,spark};
},paintScene=function paintAlarm(g,s,reduced){
  const {c,rect,line,text}=g,{hud,cross}=oddBrushes(g);
  for(const clock of s.clocks){const ringing=clock.mode==='ring',dx=ringing&&!reduced?Math.round(Math.sin(s.time*40)*3)*2:0,x=clock.x+dx,y=clock.y,base=ringing?'#f2bf53':'#8394bd',ink='#313b60';
    rect(x-51,y-37,102,79,ink);rect(x-45,y-43,90,79,base);rect(x-32,y-29,64,53,ringing?'#fff0aa':'#d2e5e9');rect(x-49,y+32,15,12,ink);rect(x+31,y+32,15,12,ink);rect(x-31,y-54,60,11,base);rect(x-4,y-62,8,9,'#e7788f');
    if(ringing){line([[x,y-22],[x,y],[x+20,y-6]],ink,5);rect(x-3,y-3,6,6,ink);for(const side of [-1,1]){rect(x+side*60-3,y-30,6,14,'#f8d375');rect(x+side*71-3,y-11,6,12,'#f8d375');}const t=Math.max(0,(clock.until-s.time)/(1.35-s.stage*.17));rect(x-43,y+44,86*t,5,'#f0d26a');}
    else {line([[x-24,y-7],[x-14,y-7]],'#546997',4);line([[x+14,y-7],[x+24,y-7]],'#546997',4);text('z',x+24,y-53,18,'#b4c6e5');}
  }
  cross(s.controlPoint,'#dbeff780');hud(s,`敲错 / 漏响 ${s.errors} / 3`,'#8571b8');
},createFivePainter=async function createFivePainter(canvas,program,paintScene,bitmap){
  const c=canvas.getContext('2d',{alpha:false}),background=await bitmap(program.id+'.png');let disposed=false,frames=0,view={scale:1,x:0,y:0};
  const dark=program.id==='bank-shot'||program.uiTheme==='dark',ink=dark?'#fff1cb':'#213b46';
  function path(points,fill,stroke,width=2){c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));if(fill){c.closePath();c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
  function rect(x,y,w,h,fill,r=0,stroke){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  function ellipse(x,y,rx,ry,fill,stroke,width=2){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
  function text(t,x,y,size=20,color=ink,align='left'){c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';c.font=`700 ${size}px system-ui,-apple-system,"PingFang SC",sans-serif`;c.fillText(t,x,y);}
  function line(points,color,width=2){path(points,null,color,width);}
  function meter(x,y,w,value,color,bg='#263b4422'){rect(x,y,w,7,bg,3);rect(x,y,w*Math.max(0,Math.min(1,value)),7,color,3);}
  const g={c,path,rect,ellipse,text,line,meter};
  function draw(s,{reduced=false}={}){
    if(disposed)return;frames++;const r=canvas.getBoundingClientRect(),dpr=Math.min(2,globalThis.devicePixelRatio||1),w=Math.max(1,r.width),h=Math.max(1,r.height);
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle=dark?'#171e21':'#e0e8e4';c.fillRect(0,0,w,h);const scale=Math.min(w/960,h/640);view={scale,x:(w-960*scale)/2,y:(h-640*scale)/2};c.translate(view.x,view.y);c.scale(scale,scale);c.lineJoin='round';c.lineCap='round';
    c.drawImage(background,0,0,960,640);paintScene(g,s,reduced);
    rect(0,0,960,58,dark?'#131a1eea':'#fffef2ed');text(program.levels[s.stage],24,28,21);text(`0${s.stage+1} / 03`,936,29,18,ink,'right');
    for(let i=0;i<3;i++)rect(392+i*60,23,48,8,i<s.stage||s.phase==='won'?'#49a583':i===s.stage?'#e57047':dark?'#ffffff25':'#17384425',4);
    if(s.lastEvent&&!reduced){const age=s.time-s.lastEvent.at;if(age<.6&&['break','catch','ring','hit'].includes(s.lastEvent.type)){const x=s.lastEvent.x??480,y=s.lastEvent.y??300;if(x>=0&&x<=960&&y>=60&&y<=620){c.save();c.globalAlpha=1-age/.6;for(let i=0;i<10;i++){const a=i*2.399,dist=age*105;rect(x+Math.cos(a)*dist,y+Math.sin(a)*dist+age*age*80,4+i%3,3,s.lastEvent.type==='hit'?'#e34d45':'#e6b646',1);}c.restore();}}}
    if(s.phase!=='playing'){
      c.fillStyle=dark?'#051218a0':'#fcfff58e';c.fillRect(0,58,960,582);
      const title=s.phase==='ready'?program.title:s.phase==='lost'?s.notice:s.phase==='won'?'三关，全部拿下':s.notice;
      text(title,480,265,36,ink,'center');text(s.phase==='ready'?program.goals[s.stage]:s.phase==='lost'?'这一局，重新来':s.phase==='cleared'?'下一关':'再来一轮',480,315,22,ink,'center');
      ellipse(480,386,34,34,program.color);path([[472,373],[472,399],[493,386]],'#fffef6');
    }
  }
  return {draw,point(clientX,clientY){const r=canvas.getBoundingClientRect();return {x:(clientX-r.x-view.x)/view.scale,y:(clientY-r.y-view.y)/view.scale};},dispose(){if(disposed)return;disposed=true;background.close();},diagnostics:()=>({frames,view:{...view},loaded:true,disposed})};
},createFiveSound=function createFiveSound(id,{AudioContext,palette:customPalette}={}){
  let ctx,muted=true,active=true,disposed=false,pulse=-1;const voices=new Set();
  const palette=customPalette||{'pan-flip':[260,'triangle'],'bank-shot':[1180,'sine'],'paper-racer':[145,'sawtooth'],'cap-cup':[820,'sine'],'paper-glider':[440,'sine']}[id]||[440,'triangle'];
  function unlock(){if(disposed)return;try{const C=AudioContext||globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)return;ctx??=new C();void ctx.resume().catch(()=>{});}catch{}}
  function stop(){for(const v of voices){try{v.o.stop();}catch{}v.o.disconnect();v.g.disconnect();}voices.clear();pulse=-1;}
  function tone(f,end,d=.15,volume=.03,delay=0,type=palette[1]){
    if(!ctx||muted||!active||disposed||voices.size>=12)return;const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+delay;o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(Math.max(25,end),t+d);g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(volume,t+.006);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(ctx.destination);const v={o,g};voices.add(v);o.onended=()=>{o.disconnect();g.disconnect();voices.delete(v);};o.start(t);o.stop(t+d+.01);
  }
  function event(e){const f=palette[0];if(e.type==='impact')tone(f,f*.55,.055,.028);if(e.type==='launch'){tone(f,f*1.9,.12,.035);tone(f*.5,f*.7,.1,.02,.02);}if(['break','catch','ring'].includes(e.type)){tone(f*1.5,f*1.48,.17,.04);tone(f*2.1,f*2,.12,.025,.04);}if(['hit','miss'].includes(e.type))tone(165,45,.2,.05,0,'triangle');if(e.type==='win')[1,1.25,1.5,2].forEach((v,i)=>tone(440*v,440*v,.28,.035,i*.085,'sine'));if(e.type==='lose'){tone(310,150,.3,.04);tone(230,95,.3,.025,.12);}}
  return {unlock,event,stop,voices:()=>voices.size,
    update(s){if(s.phase!=='playing'||s.time-pulse<.19)return;pulse=s.time;if(id==='pan-flip'&&!s.airborne)tone(2100+Math.sin(s.time*11)*650,320,.045,.006,0,'triangle');if(id==='paper-racer')tone(95+(s.held?18:0),80,.07,.008,0,'sawtooth');if(id==='paper-glider'&&s.held)tone(390,460,.18,.004,0,'sine');},
    setMuted(v){muted=Boolean(v);if(muted)stop();},setActive(v){active=Boolean(v);if(!active)stop();},dispose(){if(disposed)return;disposed=true;stop();void ctx?.close().catch(()=>{});},
  };
},createOddSound=function createOddSound(id,options){
  const audio=createFiveSound(id,options);let last=-1;
  return {...audio,update(s){audio.update(s);if(s.time<last)last=-1;if(s.phase!=='playing'||!s.held||s.time-last<.18)return;
    if(id==='power-wash'&&!s.jammed||id==='zipper-run'||id==='lunar-lease'&&s.fuel>0||id==='velvet-vault'){last=s.time;audio.event({type:'impact'});}
  }};
},runtime=function createFiveRuntime(canvas,program,{createWorld,createPainter,createSound},callbacks={}){
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
},program={"id":"alarm-alley","title":"闹钟闭嘴","english":"ALARM ALLEY","category":"stealth-observation","artStyle":"pixel-nightstand","color":"#5860af","inputMode":"tap","pointInput":true,"sound":[1480,"square"],"genre":"反应 · 敲响铃","levels":["八个清晨","闹钟扎堆","最后十二响"],"goals":["敲掉八只正在响的闹钟","蓝色睡眠钟不能碰","敲掉十二次响铃"],"hint":"点击黄色、正在响铃的闹钟。别敲蓝色睡眠钟；漏掉或敲错三次就起晚了。","kind":"game","release":"preview","collection":"odd-ten","canvasPack":true,"packFamily":"odd-ten","canvasHeight":640,"physics":"rules","hideLevels":true,"persistentCheckpoint":true,"cover":"/apps/codex-stage/odd-ten/assets/covers/alarm-alley.png","curated":false},art="data:image/png;base64,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CAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAhMF5gIR89PFQCA0TOBBgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAwNS9X/ndAgAADMYEGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAL/DwAA//+DI4CsAAAABklEQVQDAK2/DxhTlZcCAAAAAElFTkSuQmCC";
    async function bitmap(){const response=await fetch(art);return createImageBitmap(await response.blob());}
    return (canvas,callbacks)=>runtime(canvas,program,{createWorld,createPainter:c=>createFivePainter(c,program,paintScene,bitmap),createSound:()=>createOddSound(program.id,{palette:program.sound})},callbacks);
  })();
