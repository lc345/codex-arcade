export async function statueBitmap(name){const r=await fetch(new URL(`./assets/${name}`,import.meta.url));if(!r.ok)throw Error('Missing artwork');return createImageBitmap(await r.blob());}
export async function createStatuePainter(canvas){
  let set,atlas;try{set=await statueBitmap('museum.png');atlas=await statueBitmap('puppets.png');}catch(e){set?.close();throw e;}
  const c=canvas.getContext('2d',{alpha:false}),regions={walk:[54,8,451,496],pose:[587,1,380,505],guard:[1030,3,501,506],cup:[8,540,502,483],vase:[600,516,338,508],bust:[1082,514,390,510]};let disposed=false;
  function sprite(name,x,y,w,h,angle=0,flip=1){c.save();c.translate(x,y);c.rotate(angle);c.scale(flip,1);c.drawImage(atlas,...regions[name],-w/2,-h,w,h);c.restore();}
  function text(t,x,y,size=18,color='#253d3a',align='center'){c.fillStyle=color;c.font=`700 ${size}px "PingFang SC",sans-serif`;c.textAlign=align;c.fillText(t,x,y);}
  function bubble(t,x,y){const width=Math.max(46,t.length*18+24);c.fillStyle='#fffdf1';c.strokeStyle='#30413e';c.lineWidth=2;c.beginPath();c.roundRect(x-width/2,y-31,width,40,5);c.fill();c.stroke();c.beginPath();c.moveTo(x-6,y+9);c.lineTo(x+5,y+20);c.lineTo(x+9,y+9);c.fill();text(t,x,y-4,17);}
  function draw(s,{time=0,reduced=false}={}){
    if(disposed)return;const r=canvas.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    c.setTransform(w/960,0,0,h/600,0,0);c.imageSmoothingEnabled=true;c.drawImage(set,0,0,960,600);
    const watches=s.guards.filter(g=>g.mode==='watch'),warning=s.guards.some(g=>g.mode==='warn');
    for(const g of watches){c.fillStyle='#f2be7140';c.beginPath();c.moveTo(g.x,320);c.lineTo(g.side===1?0:960,395);c.lineTo(g.side===1?0:960,525);c.closePath();c.fill();}
    c.fillStyle='#ecf3e5ec';c.fillRect(18,16,924,44);text(`0${s.stage+1} / ${s.item}`,34,44,18,'#294844','left');
    c.fillStyle='#cbd8c8';c.fillRect(250,33,390,8);c.fillStyle='#356e62';c.fillRect(250,33,390*Math.min(1,s.progress/100),8);text('出口',663,44,14);
    text(watches.length?'正在查看':warning?'即将回头':'巡逻中',915,44,18,watches.length?'#ad4234':warning?'#a56828':'#356e62','right');
    c.fillStyle='#f3eddb';c.fillRect(386,171,185,59);text(['无价之杯','严禁摇晃','请勿搬动'][s.stage],478,207,25,'#414b42');
    c.fillStyle='#163f3833';c.beginPath();c.ellipse(s.x+5,520,58,10,0,0,Math.PI*2);c.fill();
    const walking=s.speed>9&&s.held,cycle=reduced?0:Math.floor(time*12)/12;
    const bob=walking?Math.sin(cycle*18)*3:0,lean=walking?.09:Math.sin(cycle*1.6)*.008;
    const failed=s.phase==='lost',frozen=!walking;
    c.save();c.translate(s.x,515+bob);if(failed)c.rotate(-.17);
    sprite(frozen?'pose':'walk',0,0,frozen?130:173,191,lean);
    const item=['cup','vase','bust'][s.stage],sizes=[[72,76],[74,129],[115,148]][s.stage];
    const cargoX=50+(s.wobble*24),cargoY=-117+(failed?26:0);
    sprite(item,cargoX,cargoY,sizes[0],sizes[1],s.wobble+(failed?.6:0));
    if(frozen&&s.settled&&!failed){c.fillStyle='#e9e4d2';c.fillRect(-39,0,83,14);text(['沉思者（临时）','人形喷泉','双人半身像'][s.stage],2,10,10,'#42514a');}
    if(s.suspicion>.18){c.fillStyle='#238f99';for(let i=0;i<3;i++){const x=21+i*7,y=-154+(reduced?i*5:(time*80+i*9)%32);c.beginPath();c.ellipse(x,y,2,4,0,0,Math.PI*2);c.fill();}}
    c.restore();
    for(const g of s.guards){
      const approach=s.suspicion>.1?(s.x-g.x)*s.suspicion*.27:0,x=g.x+approach,y=482+(reduced?0:Math.sin(cycle*5)*1.5);
      const looking=g.mode!=='away';sprite('guard',x,y,133,184,looking?-.02:Math.sin(cycle*3)*.025,(g.side===1?1:-1)*(looking?1:-1));
      if(g.mode==='warn')bubble('嗯？',x,270);else if(g.mode==='watch')bubble(s.suspicion>.4?'会动？！':s.settled?'新展品？':'……',x,270);
    }
    if(s.suspicion>.02){c.fillStyle='#eee9db';c.fillRect(s.x-40,285,80,8);c.fillStyle='#c84839';c.fillRect(s.x-40,285,80*s.suspicion,8);}
    if(s.noticeTime>0&&s.phase==='playing')bubble(s.notice,s.x,240);
    text(`${Math.min(100,s.progress)}%`,34,574,15,'#f6e7d1','left');text(s.held?'溜走中':s.settled?'一尊普通雕像': '还没站稳',927,574,17,'#f6e7d1','right');
    if(['ready','lost','caught','won'].includes(s.phase)){
      c.fillStyle='#18362a52';c.fillRect(0,65,960,485);c.fillStyle='#fff8e7';c.fillRect(260,240,440,100);
      text(s.phase==='ready'?'本馆不缺雕像':s.phase==='lost'?s.notice:s.phase==='won'?'整座展厅，满载而归':'这一件，带走了',480,284,28);
      text(s.phase==='ready'?s.item:s.phase==='lost'?'展品身份，暴露了':`用时 ${s.time.toFixed(1)} 秒`,480,316,17,'#73735c');
    }
  }
  return {draw,dispose(){disposed=true;set.close();atlas.close();},diagnostics:()=>({assetsLoaded:2})};
}
