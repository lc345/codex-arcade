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
},createWorld=function createFuse(options){
  const {k,s,api,bind,gain}=createOddKit('fuse-salon',options);let wires=[],last=null,wave=0;
  function refill(){wires=[155,245,405,495].map((y,i)=>({x1:160,x2:805,y,cut:false,burn:160,rate:70+s.stage*16+wave*10+i*5}));}
  bind({reset(){s.goal=(s.stage+1)*4;s.limit=35;s.power={a:{x:100,y:325},b:{x:860,y:325}};wave=0;last=null;refill();},tick(dt){for(const w of wires){if(!w.cut){w.burn+=w.rate*dt;if(w.burn>=w.x2)k.finish(false,'火星追到炸弹了');}}if(wires.every(w=>w.cut)&&s.phase==='playing'){wave++;refill();}},down(p){last={...p};},move(p){if(!s.held||!last)return;if(linesCross(last,p,s.power.a,s.power.b)){k.finish(false,'剪到了金色供电线');last=null;return;}for(const w of wires)if(!w.cut&&linesCross(last,p,{x:w.burn+10,y:w.y},{x:w.x2-30,y:w.y})){w.cut=true;gain(p.x,w.y);}last={...p};},clear(){last=null;},read:()=>({wires,wave,cutPoint:last})});return api;
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
},paintScene=function paintFuse(g,s,reduced){
  const {c,rect,line,path,ellipse,text}=g,{hud,spark}=oddBrushes(g);
  for(const w of s.wires){line([[w.x1,w.y],[w.x2,w.y]],'#0b2a36',8);line([[w.x1,w.y-2],[w.x2,w.y-2]],'#709b91',1);
    if(w.cut){line([[632,w.y],[650,w.y-12]],'#879f9a',4);line([[665,w.y+14],[684,w.y]],'#879f9a',4);rect(650,w.y-7,14,14,'#174356');}
    else {line([[w.x1,w.y],[w.burn,w.y]],'#f08652',4);spark(w.burn,w.y,reduced?0:s.time);}
    const x=824,y=w.y;rect(x-23,y-25,47,50,w.cut?'#508c83':'#d36267',6,'#102f40');rect(x-17,y-17,34,18,'#173545',2);text(w.cut?'SAFE':`${Math.max(0,Math.ceil((w.x2-w.burn)/w.rate))}`,x,y-7,w.cut?9:18,w.cut?'#a2e2c2':'#f7dc85','center');for(const dx of [-1,1])line([[x+dx*12,y+11],[x+dx*12,y+20]],'#223e4b',3);
  }
  line([[100,325],[860,325]],'#6d4b2b',17);line([[100,325],[860,325]],'#e7ba57',11);for(let x=118;x<850;x+=27)line([[x-3,320],[x+3,330]],'#876543',3);rect(399,310,162,31,'#153d52',3);text('POWER / 勿剪',480,326,15,'#efd174','center');
  const p=s.controlPoint;ellipse(p.x-9,p.y+9,8,8,null,'#cbe6da',3);ellipse(p.x+9,p.y+9,8,8,null,'#cbe6da',3);line([[p.x-5,p.y+4],[p.x+12,p.y-22]],'#d0e7d7',3);line([[p.x+5,p.y+4],[p.x-12,p.y-22]],'#d0e7d7',3);
  hud(s,'剪引线 / 金色电缆不可碰','#398f98');
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
},program={"id":"fuse-salon","title":"引线理发师","english":"FUSE SALON","category":"combat-action","artStyle":"technical-blueprint","color":"#267c91","inputMode":"drag","pointInput":true,"sound":[180,"triangle"],"genre":"划切 · 拆弹救场","levels":["四条引线","八条引线","十二条引线"],"goals":["划断燃烧引线，别碰金色电缆","分两批剪断引线","三批引线，动作再快一点"],"hint":"按住划过黑色引线即可剪断。不要划到横穿中央的金色电缆；火星烧到炸弹就失败。","kind":"game","release":"preview","collection":"odd-ten","canvasPack":true,"packFamily":"odd-ten","canvasHeight":640,"physics":"rules","hideLevels":true,"persistentCheckpoint":true,"cover":"/apps/codex-stage/odd-ten/assets/covers/fuse-salon.png","curated":false},art="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA8AAAAKACAIAAADcm4YUAAAQAElEQVR4nOzdX4tc5QHH8WezZ2aM8Q8qAVOWFL0IRjEgguJNveiFV73xHRR60YJvoZTSF9GbQl+LBcFeCJIbMYiiSKOEGDAaM3PO7nSSgSAk2ewv8+ycmbOfz4UsOwO/dXbF7zw7O6c5+4c/FwAA4GhOFQAA4MgENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAASayagpAADA0Zza3e3hEHo8asZ9hLtdu3bt2rVrt6ydXbsD22329w+mbVf6YNeuXbt27dq1a9fu1u16DTQAAAQENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAAQENAAABAQ0AAAEBDQAAASa8agpa7e7eyfcJ6X+9MF+N5/9Mu/a+UF3/63t3X+u/0mDXbt27dq1a9fuCdzdOdXsNKOd8elTu/Wrr5eIXe72M3xM9m//dDC9VQAA2ACLA835rCuLw83Jk7tPPFWGopm13bTtynotz57r7u7MftrpZgUAgA2zOOLc3+/m4/oNvf6OLYN5DfROe0s9AwBsrEWqLYKtDMIgAnq+v9PeLgAAbLA7wTbfL9tvCAGtngEAtsIwsm0QAb3fw2tfAABIDSPbBvEuHIP4XQAAwPB5CQcAAJw0g3of6ENcfOncpQt7Z597evHxtRs3L1/59rOvrhYAAB7LSY6r3WcuvrV/cFDWq7l7JcJauzvtL4fc+uxTp99757U3Xjl/5vRk+ZnFBy/vnX3xhWe+u/7jdOb10wAAgRXjaj46XWqo25PR7vBfwvHumxfOn3vh/s8vPrm4qQAAkBBXAw/oxS8XHvgNXlrc9OpL5woAAEfzyLi6eALiauABfenC3uF3eP1RdwAA4J5HxtWlExBXA/8jwuUL21e5AwAA94ir4m3sAAAgMvCAvnbj5op3AADgHnFVBh/Ql698u+IdAAC4R1yVwQf0Z19d/ebq9YfdurjJ5VQAAI5OXJWT8BroDz+58sBv8+KTi5sKAAAJcTX8KxFOZ93nX39/8+fbT595Ynm9nGs3bn58+cuPPv3CZQgBAFIrxtUArkS4s/f+B9N23R05Gd15+7xau6du/VD68I+//7HAXX/9278LAHAEB08+X2qo25PRrrexAwCAwMAvpHKsHDoCAJxATqABACDgBBoA2FD+3Oj4+EX6KpxAAwBAwAn04/O0+LF51gvAUfj/BZvJCTQAAAScQD8+T4sBAE4gJ9AAABBwAg0ADJw/W7qfX6Svwgk0AAAEnEADAAPntJW6nEADAEBAQAMAQEBAAwBAQEADAEBAQAMAQEBAAwBAoBmPengnu7qjbQEAYDtMKnVgLxG73HUCDQAAgWbWdtO2K32otetJAADAtqhbnr10rPgEAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAIBAMx41Ze3qjrYFAIDtMKnUgb1E7HLXCTQAAASaWdtN2670odauJwEAANuibnn20rHiEwAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAs141JS1qzvaFgAAtsOkUgf2ErHLXSfQAAAQaGZtN2270odau54EAABsi7rl2UvHik8AAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAg041FT1q7uaFsAANgOk0od2EvELnedQAMAQKCZtd207Uofau16EgAAsC3qlmcvHSs+AQAgIKABACAgoAEAICCgAQAgIKABACAgoAEAICCgAQAgIKABACAgoAEAICCgAQAgIKABACAgoAEAICCgAQAgIKABACAgoAEAICCgAQAgIKABACAgoAEAICCgAQAgIKABACAgoAEAICCgAQAgIKABACAgoAEAICCgAQAgIKABACAgoAEAICCgAQAgIKABACAgoAEAICCgAQAgIKABACAgoAEAICCgAQAgIKABACAgoAEAICCgAQAg0IxHTVm7uqNtAQBgO0wqdWAvEbvcdQINAACBZtZ207Yrfai160kAAMC2qFuevXSs+AQAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgEAzHjVl7eqOtgUAgO0wqdSBvUTsctcJNAAABJpZ203brvSh1q4nAQAA26JuefbSseITAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACzXjUlLWrO9oWAAC2w6RSB/YSsctdJ9AAABBoZm03bbvSh1q7ngQAAGyLuuXZS8eKTwAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACDTjUVPWru5oWwAA2A6TSh3YS8Qud51AAwBAoJm13bTtSh9q7XoSAACwLeqWZy8dKz4BACAgoAEAICCgAQAgIKABACAgoAEAICCgAQAgIKABACAgoAEAICCgAQAgIKABACAgoAEAICCgAQAgIKABACAgoAEAICCgAQAgIKABACAgoAEAICCgAQAgIKABACAgoAEAICCgAQAgIKABACAgoAEAICCgAQAgIKABACAgoAEAICCgAQAgIKABACAgoAEAICCgAQAgIKABACAgoAEAICCgAQAgIKABACAgoAEAICCgAQAgIKABACDQjEdNWbu6o20BAGA7TCp1YC8Ru9x1Ag0AAIFm1nbTtit9qLXrSQAAwLaoW569dKz4BACAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAQDMeNWXt6o62BQCA7TCp1IG9ROxy1wk0AAAEmlnbTduu9KHWricBAADbom559tKx4hMAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAk05GS6+dO7Shb2zzz29+PjajZuXr3z72VdXCwAAj+Ukx9XuMxff2j84KOvV7N45+a61u9P+csitzz51+r13XnvjlfNnTk+Wn1l88PLe2RdfeOa76z9OZ10BAODIVoyr+eh0qaFuT0a7w38Jx7tvXjh/7oX7P7/45OKmAgBAQlwNPKAXv1x44Dd4aXHTqy+dKwAAHI24KoMP6EsX9g6/w+uPugMAAPeIqzL4PyJcvrB9lTsAAHCPuCrexg4AACIDD+hrN26ueAcAAO4RVwvNeNTDqzjqjrYPv+nylW9///bFcugdCgAAR7N6XE0qdWAvEbvcHfgJ9GdfXf3m6vWH3bq4yeVUAACOTlwtNLO2m7b9XEyk1u7hTwI+/OTKA9+tcPENXtxUAABIrBhXdcuzl44d/pUIp7Pu86+/v/nz7afPPLG8Xs61Gzc/vvzlR59+4TKEAACpFeNqAFci3Nl7/4P1l/vytS/VTqBv/VAAANgGB08+X2qo25PRrrexAwCAwCACeme3AACw+QaRbUMI6PnuwK+nCAAwDMPItkEE9OiJAgDAxps3k7L9BvISDg0NALDh7gTbKSfQG2M+enLejAsAABtpkWqLYCuDvrg7cgAAAvxJREFUMJx34ZiPn3IODQCwgRaRtki1MhSD+vO7u+fQk5329s5+V+b7BQCAHu3sznebO0ecw3rPtMG9f8Xi+zQ+M3/IjT2+4bZdu3bt2rVrt6yX3WHv9siFVAAAICCgAQAgIKABACAgoAEAICCgAQAgIKABACAgoAEAICCgAQAgIKABACAgoAEAICCgAQAgIKABACAgoAEAICCgAQAgIKABACDQFB5X+/WVo97zIZ8f/fZCOQb//cv/ymre/udvyjE4+iP2MBv7iP3uX+fLMTj8EWvLox3TI/afP31TVuNnLLW2R+woP1e/5hFLncxHLP25+rWT9oixFZxAAwBAQEADAEBAQAMAQEBAAwBAQEADAEBAQAMAQEBAAwBAQEADAEBAQAMAQEBAAwBAoBmPeriady+j1XdXuTDp0mS0oZdSX/ELe9jjfNyP2Li/x/OYpjfzZ6zKv+xjfGFH2T2OR2y8Gf+dTob+M1b9cT7iF5bu1nrENuTn6tcG+TN2rI/zIV/YMDrH7iG7TqABACCws/f+B9O2K+u1fNJm165du3bt2rVr1+7W7TqBBgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAgIAGAICAgAYAgICABgCAQDMeNWXtehm1a9euXbsbu7u7e+dAZ1LWve77a9eu3cfYdQINAACBZtZ207YrfbBr165du3aXlmfPHme7du1uxa4TaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAgIaAAACAhoAAAICGgAAAj8HwAA//9KEwjfAAAABklEQVQDAJgNBJ/CknqnAAAAAElFTkSuQmCC";
    async function bitmap(){const response=await fetch(art);return createImageBitmap(await response.blob());}
    return (canvas,callbacks)=>runtime(canvas,program,{createWorld,createPainter:c=>createFivePainter(c,program,paintScene,bitmap),createSound:()=>createOddSound(program.id,{palette:program.sound})},callbacks);
  })();
