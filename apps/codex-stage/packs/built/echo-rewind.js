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
},hardRules=function hardRules(){
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const angle=x=>Math.atan2(Math.sin(x),Math.cos(x));
  function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
  const corridorDistance=(p,path)=>Math.min(...path.slice(1).map((b,i)=>segmentDistance(p,path[i],b)));
  function knightMoves(i){const x=i%5,y=Math.floor(i/5);return [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]].map(([dx,dy])=>[x+dx,y+dy]).filter(([a,b])=>a>=0&&a<5&&b>=0&&b<5).map(([a,b])=>a+b*5);}
  function knightPuzzle(stage){
    // A full tour supplies connected islands; the player is never given its traversal order.
    const route=[],used=new Set();
    function visit(i){route.push(i);used.add(i);if(route.length===25)return true;const next=knightMoves(i).filter(j=>!used.has(j)).sort((a,b)=>knightMoves(a).filter(j=>!used.has(j)).length-knightMoves(b).filter(j=>!used.has(j)).length);for(const j of next)if(visit(j))return true;used.delete(i);route.pop();return false;}
    visit(0);const tiles=route.slice(0,[12,18,24][stage]);return {tiles:tiles.slice().sort((a,b)=>a-b),start:tiles[0],exit:tiles.at(-1)};
  }
  function polarityMasks(stage){const masks=Array.from({length:16},(_,i)=>{const x=i%4,y=Math.floor(i/4),diagonal=stage===1||stage===2&&(x+y)%2===1,dirs=diagonal?[[0,0],[-1,-1],[-1,1],[1,-1],[1,1]]:[[0,0],[-1,0],[1,0],[0,-1],[0,1]];return dirs.reduce((m,[dx,dy])=>x+dx>=0&&x+dx<4&&y+dy>=0&&y+dy<4?m|1<<((y+dy)*4+x+dx):m,0);});for(let i=0;i<16;i++)for(let j=i+1;j<16;j++)if((masks[i]>>j&1)||(masks[j]>>i&1)){masks[i]|=1<<j;masks[j]|=1<<i;}return masks;}
  function solvePolarity(state,masks){let best=null;const sums=new Uint16Array(65536),counts=new Uint8Array(65536);for(let bits=1;bits<65536;bits++){const bit=bits&-bits,index=31-Math.clz32(bit),rest=bits^bit;sums[bits]=sums[rest]^masks[index];counts[bits]=counts[rest]+1;if(sums[bits]===state&&(!best||counts[bits]<best.length))best=Array.from({length:16},(_,i)=>i).filter(i=>bits>>i&1);}return state===0?[]:best;}
  function polarityPuzzle(stage){const masks=polarityMasks(stage);let seed=1709+stage*733;for(let attempt=0;attempt<100;attempt++){let bits=0;for(let i=0;i<7+stage;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;bits|=1<<(seed>>>16)%16;}let state=0;for(let i=0;i<16;i++)if(bits>>i&1)state^=masks[i];const solution=solvePolarity(state,masks);if(solution&&solution.length>=6+stage)return {state,masks,moves:solution.length+1};}throw Error('No suitable polarity board');}
  return {clamp,angle,segmentDistance,corridorDistance,knightMoves,knightPuzzle,polarityPuzzle,solvePolarity};
},world=function createEcho(options={}){
  const {k,s,api,bind}=createOddKit('echo-rewind',options);
  bind({reset(){s.sequence=[[0,4,2,7,3,8],[2,6,1,8,4,0,7,3],[4,0,8,2,6,1,5,7,0,3]][s.stage];s.goal=s.sequence.length;s.period=[.64,.58,.52][s.stage];s.revealEnd=1+s.period*s.goal;s.limit=s.revealEnd+25;s.lit=-1;s.mode='show';s.entered=[];s.controlPoint={x:354,y:201};},
    tick(){if(s.time>=s.revealEnd){s.mode='recall';s.lit=-1;}else{const t=s.time-1,index=Math.floor(t/s.period);s.lit=t>=0&&t%s.period<s.period*.62?s.sequence[index]??-1:-1;if(s.lit>=0&&s.previousLit!==s.lit)k.event('ring',{note:s.lit});s.previousLit=s.lit;}},
    down(p){if(s.mode!=='recall')return false;const x=Math.round((p.x-354)/126),y=Math.round((p.y-201)/126);if(x<0||x>2||y<0||y>2||Math.abs(p.x-(354+x*126))>48||Math.abs(p.y-(201+y*126))>48)return false;const i=x+y*3;if(i!==s.sequence[s.goal-1-s.progress]){k.finish(false,'倒带错了一拍，从头记');return;}s.entered.push(i);s.progress++;s.score+=100;k.event('catch',{x:p.x,y:p.y});if(s.progress===s.goal)k.finish(true,'十拍回声，一拍不差');}});return api;
},hardBrushes=function hardBrushes(g,s){
  const {c,rect,line,ellipse,path,text}=g;
  function foot(left,right,dark=false){rect(0,576,960,64,dark?'#14181ff2':'#f3f4ebf2');text(left,26,607,20,dark?'#f3e3c7':'#223d48');text(right,934,607,19,dark?'#f3e3c7':'#223d48','right');text(`${Math.max(0,Math.ceil(s.limit-s.time))}s`,480,607,17,dark?'#9db7bb':'#748c86','center');}
  function cog(x,y,r,a,fill,teeth=12){path(Array.from({length:teeth*4},(_,i)=>{const t=a+i*Math.PI*2/(teeth*4),d=i%4<2?r:r*.81;return [x+Math.cos(t)*d,y+Math.sin(t)*d];}),fill,'#182f38',2);ellipse(x,y,r*.24,r*.24,'#f1e2ba','#233d47',3);}
  function shine(x,y,r,color){for(let i=0;i<4;i++){const a=i*Math.PI/2;line([[x+Math.cos(a)*r*.6,y+Math.sin(a)*r*.6],[x+Math.cos(a)*r,y+Math.sin(a)*r]],color,2);}}
  function flag(x,y){line([[x,y-32],[x,y+13]],'#243b48',3);path([[x,y-32],[x+23,y-25],[x,y-17]],'#e46e4d');}
  function worker(x,y,size=1){c.save();c.translate(x,y);c.scale(size,size);ellipse(0,4,13,10,'#1d394144');rect(-7,-9,14,19,'#e77749',3,'#24373a');ellipse(0,-15,9,9,'#f4c397','#263a41',2);rect(-11,-24,22,8,'#ebcf55',2);rect(-7,-29,14,9,'#efd778',3);line([[-5,10],[-8,20]],'#243c4a',4);line([[5,10],[8,20]],'#243c4a',4);c.restore();}
  return {foot,cog,shine,flag,worker};
},paint=function paintEcho(g,s,reduced){
  const {c,rect,line,ellipse,path,text}=g,{foot,cog}=hardBrushes(g,s),colors=['#e8ad63','#c95b65','#7db9b1','#8ba261','#ca8273','#ccaf69','#a896ba','#689cbd','#c99c6a'];
  rect(244,114,472,418,'#e0c29a',12,'#5d7068');rect(256,125,448,395,'#344b4b',6);for(let i=0;i<9;i++){const x=354+i%3*126,y=201+Math.floor(i/3)*126,on=s.lit===i,hit=s.mode==='recall'&&s.entered.at(-1)===i;rect(x-50,y-45,100,95,'#112f3755',8);rect(x-48,y-49,96,94,on?'#fff0ba':hit?'#a6cdaa':colors[i],7,'#253d43');rect(x-40,y-40,80,8,on?'#ffffff':'#ffe5b666',2);text(i+1,x,y,32,on?'#745738':'#2c474d','center');}
  for(const x of [152,808]){ellipse(x,275,53,53,'#c9b696','#345457',4);cog(x,275,33,reduced?0:(s.mode==='show'?s.time:-s.time),'#5f7f7b',6);ellipse(x,275,7,7,'#e3ca9b');}
  line([[151,327],[188,436],[243,452]],'#c3a36a',4);line([[809,327],[772,436],[718,452]],'#c3a36a',4);text(s.mode==='show'?'▶':'◀◀',480,86,24,'#ebcf99','center');
  for(let i=0;i<s.goal;i++)rect(333+i*(300/s.goal),547,Math.min(22,220/s.goal),7,i<s.progress?'#86c3a7':'#6f7b73',1);foot(s.mode==='show'?'记住顺序':'从最后一拍开始',`倒带 ${s.progress} / ${s.goal}`,true);
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
},createFiveRuntime=function createFiveRuntime(canvas,program,{createWorld,createPainter,createSound},callbacks={}){
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
},program={"id":"echo-rewind","title":"回声倒带","english":"ECHO / REVERSE","mechanic":"reverse-spatial-sequence-recall","artStyle":"retro-tape-console","category":"stealth-observation","inputMode":"tap","color":"#e79536","sound":[570,"sine"],"genre":"反向记忆 · 一错清空","levels":["倒放六拍","倒放八拍","倒放十拍"],"goals":["看完六个亮格，再按相反顺序点回去","不是重复原顺序，要从最后一个开始","十拍倒放，点错一格就重来"],"hint":"先看九宫格闪烁的顺序。出现倒放符号后，从最后一个开始反着点。展示期间点按无效，回答时一错归零。","kind":"game","release":"preview","collection":"hardcore-ten","canvasPack":true,"packFamily":"hardcore-ten","canvasHeight":640,"physics":"rules","pointInput":true,"uiTheme":"dark","hideLevels":true,"persistentCheckpoint":true,"cover":"/apps/codex-stage/hardcore-ten/assets/covers/echo-rewind.png","curated":false},art="data:image/png;base64,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";
    async function bitmap(){const r=await fetch(art);return createImageBitmap(await r.blob());}
    return (canvas,callbacks)=>createFiveRuntime(canvas,program,{createWorld:world,createPainter:c=>createFivePainter(c,program,paint,bitmap),createSound:()=>createFiveSound(program.id,{palette:program.sound})},callbacks);
  })();
