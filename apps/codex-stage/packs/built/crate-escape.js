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
},gauntletRules=function gauntletRules(){
  const neighbors=(i,w,h,diagonal=false)=>{const out=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy||!diagonal&&Math.abs(dx)+Math.abs(dy)!==1)continue;const x=i%w+dx,y=Math.floor(i/w)+dy;if(x>=0&&x<w&&y>=0&&y<h)out.push(y*w+x);}return out;};
  function beam(mirrors,start,target,w=8,h=6){let {x,y,dx,dy}=start;const points=[{x:x-.8*dx,y:y-.8*dy}],seen=new Set();let hit=false;for(let n=0;n<100;n++){if(x<0||x>=w||y<0||y>=h)break;points.push({x,y});if(x===target.x&&y===target.y){hit=true;break;}const key=[x,y,dx,dy].join();if(seen.has(key))break;seen.add(key);const m=mirrors.find(m=>m.x===x&&m.y===y);if(m){[dx,dy]=m.slash?[-dy,-dx]:[dy,dx];}x+=dx;y+=dy;}points.push({x,y});return {points,hit};}
  function fold(points,axis,line){return [...new Map(points.map(p=>{const q={...p};if(q[axis]<line)q[axis]=2*line-q[axis];return [`${q.x},${q.y}`,q];})).values()];}
  function capture(board,w,h,enemy,path){const next=board.slice();for(const i of path)next[i]=1;const queue=Array.isArray(enemy)?enemy.slice():[enemy];if(queue.some(i=>next[i]))return null;const open=new Set(queue);while(queue.length){const i=queue.pop();for(const j of neighbors(i,w,h))if(!next[j]&&!open.has(j)){open.add(j);queue.push(j);}}return next.map((v,i)=>v||!open.has(i)?1:0);}
  function minePuzzle(stage){const w=6+stage,h=6,n=w*h,mines=Array.from({length:n},(_,i)=>((i*17+stage*11)%23)<4&&i>=w),counts=mines.map((_,i)=>neighbors(i,w,h,true).filter(j=>mines[j]).length),open=mines.map((v,i)=>!v&&(i<w||counts[i]===0));
    const deduce=()=>{const known=new Set(),safe=new Set(open.flatMap((v,i)=>v?[i]:[]));let changed=true;while(changed){changed=false;for(let i=0;i<n;i++){if(!safe.has(i))continue;const around=neighbors(i,w,h,true),unknown=around.filter(j=>!safe.has(j)&&!known.has(j)),need=counts[i]-around.filter(j=>known.has(j)).length;if(!unknown.length)continue;if(need===0)for(const j of unknown){safe.add(j);changed=true;}else if(need===unknown.length)for(const j of unknown){known.add(j);changed=true;}}}return safe;};
    // Add only enough given safe clues to make the deterministic layout guess-free.
    for(let n=0;n<50;n++){const safe=deduce(),left=mines.findIndex((v,i)=>!v&&!safe.has(i));if(left<0)break;open[left]=true;}
    return {w,h,mines,counts,open};
  }
  return {neighbors,beam,fold,capture,minePuzzle};
},world=function createCrates(options){
  const {k,s,api,bind}=createOddKit('crate-escape',options),{neighbors}=gauntletRules();
  bind({reset(){s.limit=120;s.w=7;s.h=6;s.goal=1+s.stage;s.moves=[22,34,48][s.stage];s.board=Array.from({length:42},(_,i)=>i%7===0||i%7===6||i<7||i>=35?1:0);s.player=29;s.boxes=[17,19,25].slice(0,s.goal);s.targets=[10,12,11].slice(0,s.goal);s.controlPoint={x:270+(s.player%7)*64,y:140+Math.floor(s.player/7)*64};},tick(){},down(p){const x=Math.round((p.x-270)/64),y=Math.round((p.y-140)/64),i=y*7+x;if(x<0||x>=7||y<0||y>=6||!neighbors(s.player,7,6).includes(i)||s.board[i])return false;const b=s.boxes.indexOf(i);if(b>=0){const to=i+(i-s.player);if(s.board[to]!==0||s.boxes.includes(to))return false;s.boxes[b]=to;k.event('impact');}s.player=i;s.moves--;s.controlPoint={x:270+x*64,y:140+y*64};s.progress=s.boxes.filter(i=>s.targets.includes(i)).length;s.score=s.progress*100;if(s.progress===s.goal)k.finish(true,'一个箱子也没困住');else if(s.boxes.some(i=>!s.targets.includes(i)&&((s.board[i-1]||s.board[i+1])&&(s.board[i-7]||s.board[i+7]))))k.finish(false,'箱子卡进了死角，拉不出来了');else if(!s.moves)k.finish(false,'搬运步数用完了');}});return api;
},gauntletBrushes=function gauntletBrushes(g,s){
 const {c,rect,line,ellipse,path,text}=g;
 function foot(a,b,dark=false){rect(0,576,960,64,dark?'#132832f0':'#f4f5eaf0');text(a,30,607,21,dark?'#d7ede2':'#234541');text(b,930,607,19,dark?'#d7ede2':'#234541','right');text(`${Math.max(0,Math.ceil(s.limit-s.time))}s`,480,607,17,dark?'#acd7c5':'#5a7b70','center');}
 function star(x,y,r,fill){path(Array.from({length:10},(_,i)=>{const a=i*Math.PI/5-Math.PI/2,d=i%2?r*.45:r;return [x+Math.cos(a)*d,y+Math.sin(a)*d];}),fill);}
 function person(x,y,tilt=0,scale=1){c.save();c.translate(x,y);c.rotate(tilt);c.scale(scale,scale);ellipse(0,-57,13,14,'#f5c27f','#233e44',2);rect(-10,-42,20,35,'#e35041',5,'#263d45');line([[-3,-9],[-14,9]],'#233e44',7);line([[5,-9],[16,9]],'#233e44',7);line([[-8,-33],[-37,-22]],'#263d45',6);line([[8,-33],[37,-22]],'#263d45',6);line([[-60,-19],[60,-19]],'#233e44',4);c.restore();}
 function sub(x,y,flip,color){c.save();c.translate(x,y);if(flip)c.scale(-1,1);ellipse(0,0,18,31,color,'#e5f8e6',2);ellipse(0,-8,10,13,'#102e41','#a9eae2',2);path([[-15,9],[-26,27],[-14,22]],color);path([[15,9],[26,27],[14,22]],color);line([[-9,26],[-9,40]],'#b3efc7',3);line([[9,26],[9,40]],'#b3efc7',3);c.restore();}
 return {foot,star,person,sub};
},paint=function paintCrates(g,s,reduced){
 const {c,rect,line,ellipse,path,text}=g,{foot}=gauntletBrushes(g,s),xy=i=>({x:270+i%7*64,y:140+Math.floor(i/7)*64});
 for(let i=0;i<42;i++){const {x,y}=xy(i);if(s.board[i]){rect(x-30,y-30,60,60,'#40675f',1);rect(x-28,y-28,56,13,'#8cab91');line([[x-30,y],[x+30,y]],'#263f41',3);line([[x,y],[x,y+30]],'#284d48',2);}else{rect(x-30,y-30,60,60,'#ccd5b2',1,'#b1bc9d');if(s.targets.includes(i)){rect(x-23,y-23,46,46,'#e7c951',1);path([[x-12,y],[x,y-12],[x+12,y],[x,y+12]],'#a88d38');}}}
 for(const i of s.boxes){const {x,y}=xy(i);rect(x-26,y-20,55,52,'#385a4850',2);rect(x-27,y-28,53,52,s.targets.includes(i)?'#7ead80':'#d1a465',2,'#52624f');rect(x-21,y-22,41,39,'#ebca86',1,'#7d825b');line([[x-20,y-20],[x+20,y+17]],'#a98950',5);line([[x+20,y-20],[x-20,y+17]],'#a98950',5);for(const dx of [-22,22])for(const dy of [-23,20])ellipse(x+dx,y+dy,2,2,'#3a5650');}
 const p=xy(s.player);ellipse(p.x,p.y+18,22,9,'#50705677');rect(p.x-13,p.y-6,26,24,'#347d94',3);rect(p.x-15,p.y-27,30,24,'#edc195',4);rect(p.x-18,p.y-34,36,10,'#edc34c',2);rect(p.x-9,p.y-35,18,7,'#f7df82',1);rect(p.x-8,p.y-18,4,4,'#25484b');rect(p.x+5,p.y-18,4,4,'#25484b');foot(`归位 ${s.progress} / ${s.goal}`,`剩余 ${s.moves} 步`);
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
},program={"id":"crate-escape","title":"死角搬运工","english":"NO WAY BACK","mechanic":"irreversible-box-push","artStyle":"warehouse-pixel-isometric","category":"logic-rules","inputMode":"tap","color":"#e3b843","sound":[160,"square"],"genre":"推箱子 · 不可逆死角","levels":["别推错方向","双箱错位","三箱仓库"],"goals":["把木箱推到黄色标记上","两个箱子，都要留出绕行空间","三箱归位，别把自己封住"],"hint":"点角色相邻的地砖走一步。箱子只能推，不能拉；推到死角就得重来。","kind":"game","release":"preview","collection":"gauntlet-ten","canvasPack":true,"packFamily":"gauntlet-ten","canvasHeight":640,"pointInput":true,"physics":"rules","uiTheme":"light","hideLevels":true,"persistentCheckpoint":true,"cover":"/apps/codex-stage/gauntlet-ten/assets/covers/crate-escape.png","curated":false},art="data:image/png;base64,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";
 async function bitmap(){const r=await fetch(art);return createImageBitmap(await r.blob());}
 return (canvas,callbacks)=>createFiveRuntime(canvas,program,{createWorld:world,createPainter:c=>createFivePainter(c,program,paint,bitmap),createSound:()=>createFiveSound(program.id,{palette:program.sound})},callbacks);
 })();
