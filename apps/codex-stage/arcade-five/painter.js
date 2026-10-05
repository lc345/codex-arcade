export async function createFivePainter(canvas,program,paintScene,bitmap){
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
}

export function paintPan(g,s,reduced){
  const {c,rect,ellipse,line,path,text,meter}=g;
  rect(367,530,226,35,'#bd313e',7,'#74333b');ellipse(480,530,79,17,'#315866','#aacacf');
  if(s.phase==='playing'&&!s.airborne)for(let i=0;i<7;i++){const h=12+(reduced?0:Math.sin(s.time*13+i)*5);path([[420+i*19,531],[427+i*19,531-h],[433+i*19,531]],i%2?'#f4ce4d':'#ee854a');}
  ellipse(480,513,s.panWidth/2+6,16,'#263a43','#6d8b8e',3);ellipse(480,505,s.panWidth/2,10,'#4e6062','#203038',3);
  c.save();c.translate(480+s.panWidth/2-2,508);c.rotate(-s.charge*.13);rect(0,-6,104,14,'#293d47',5);rect(66,-7,41,15,'#df5449',5);c.restore();
  ellipse(740,520,70,17,'#e5f1f4','#5e92a7',3);ellipse(740,518,49,10,null,'#94bac5');
  const served=['won','cleared'].includes(s.phase),f=s.food,face=Math.cos(f.angle)<0?1:0,heat=s.cook[face];
  c.save();c.translate(served?740:f.x,served?507:f.y);c.rotate(served?0:f.angle);const foodColor=heat>1.12?'#765237':heat>.7?'#e3a24e':'#ffe0a0';
  if(s.stage===1){rect(-46,-12,92,25,'#b96c34',8,'#8d4b26');rect(-41,-10,82,17,foodColor,6);for(let i=0;i<5;i++)line([[-32+i*16,-7],[-32+i*16,5]],'#ba793c',2);}
  else {ellipse(0,3,51-s.stage*3,14,'#b7773b','#85532b',2);ellipse(0,-2,51-s.stage*3,11,foodColor,'#ba763d',2);for(let i=0;i<13;i++){const x=Math.sin(i*5.2)*39,y=Math.cos(i*2.1)*6;ellipse(x,y,2+i%3,1.2,heat>.6?'#bc6c30':'#e9b269');}if(s.stage===2){for(let i=0;i<7;i++)rect(-32+i*10,-5+(i%3)*4,5,2,'#4b9264',1);}}
  c.restore();
  for(let i=0;i<2;i++){const x=260+i*260;text(i===0?'A 面':'B 面',x,98,20);rect(x,120,200,13,'#efdebd',4);rect(x+200*.72/1.27,120,200*.4/1.27,13,'#7fbc8c',1);rect(x,124,200*Math.min(s.cook[i]/1.27,1),5,s.cook[i]>1.12?'#db4845':'#a35c2f',2);ellipse(x+200*Math.min(s.cook[i]/1.27,1),126,5,9,'#3c4b41');}
  if(s.held){text('力道',480,571,17,'#fff5df','center');meter(390,590,180,s.charge/1.2,'#f2ce50','#5a2b3290');}
  else text(s.airborne?'翻面中':served?'出锅':'煎制中',480,587,21,'#fff4e4','center');
}

export function paintBank(g,s,reduced){
  const {c,rect,ellipse,line,path,text}=g;
  rect(90,95,780,455,'#671b33',3);for(let i=0;i<24;i++){c.globalAlpha=.06;line([[100,110+i*18],[860,110+i*18]],'#f1b9c1');}c.globalAlpha=1;
  for(const o of s.obstacles){c.save();c.translate(o.x,o.y);c.rotate(o.angle);rect(-o.w/2,-11,o.w,22,'#274b45',5,'#d8b87c');line([[-o.w/2+10,-5],[o.w/2-10,-5]],'#72a495',2);c.restore();}
  for(const t of s.targets){if(t.hit)continue;ellipse(t.x+3,t.y+7,23,18,'#230d2990');ellipse(t.x,t.y,22,22,t.id%2?'#47baa5':'#f2c76c','#ffedbb',2);ellipse(t.x-5,t.y-6,10,7,t.id%2?'#bce7cf':'#fff0b0');path([[t.x-7,t.y+2],[t.x,t.y-5],[t.x+7,t.y+2],[t.x,t.y+9]],t.id%2?'#125e58':'#ab622b');}
  if(!reduced&&s.trail.length>1){c.save();c.globalAlpha=.25;line(s.trail.map(p=>[p.x,p.y]),'#ffe9bd',5);c.restore();}
  const b=s.ball;ellipse(b.x+3,b.y+5,17,13,'#170b2290');const sh=c.createRadialGradient(b.x-5,b.y-5,2,b.x,b.y,17);sh.addColorStop(0,'#fff');sh.addColorStop(.7,'#f7f2d6');sh.addColorStop(1,'#95a8a0');ellipse(b.x,b.y,15,15,sh,'#c9cba9');
  if(s.aim){const dx=b.x-s.aim.x,dy=b.y-s.aim.y,len=Math.hypot(dx,dy)||1,nx=dx/len,ny=dy/len;c.save();c.setLineDash([3,11]);line([[b.x+nx*24,b.y+ny*24],[b.x+nx*190,b.y+ny*190]],'#fff6c4',3);c.restore();line([[b.x-nx*30,b.y-ny*30],[b.x-nx*(65+Math.min(120,len)),b.y-ny*(65+Math.min(120,len))]],'#c09d69',8);line([[b.x-nx*28,b.y-ny*28],[b.x-nx*48,b.y-ny*48]],'#abd3c7',7);}
  text(`已清 ${s.progress} / ${s.goal}`,180,595,22,'#f2dfb2');text('剩余球杆',645,595,18,'#e3ccab');for(let i=0;i<4;i++)rect(761+i*27,584,15,23,i<s.shots?'#e6ba69':'#ffffff20',3);
}

export function paintPaper(g,s,reduced){
  const {c,rect,ellipse,line,path,text,meter}=g,offset=s.distance-30,sy=y=>y+offset;
  const left=s.road.map(p=>[p.x-s.halfWidth,sy(p.y)]),right=s.road.map(p=>[p.x+s.halfWidth,sy(p.y)]);
  path([...left,...right.slice().reverse()],'#c7e3f65a');line(left,'#35465c',5);line(right,'#35465c',5);line(left.map(([x,y])=>[x-5,y+2]),'#35465c50',1);line(right.map(([x,y])=>[x+4,y+1]),'#35465c50',1);
  c.save();c.setLineDash([18,24]);line(s.road.map(p=>[p.x,sy(p.y)]),'#eeae4770',3);c.restore();
  if(!reduced&&s.marks.length>1){line(s.marks.map(p=>[p.x-9,sy(p.y)]),'#367fb980',3);line(s.marks.map(p=>[p.x+9,sy(p.y)]),'#367fb950',2);}
  for(const e of s.erasers){const y=sy(e.y);if(y<-60||y>710)continue;c.save();c.translate(e.x,y);c.rotate(e.angle);rect(-33,-21,66,42,'#d97691',5,'#8f415b');rect(-32,-20,25,40,'#537eb7',4);line([[-28,-12],[25,-12]],'#ffc0ce',2);for(let i=0;i<4;i++)line([[0,-5+i*6],[25,-5+i*6]],'#b5506a',1);c.restore();}
  const finishY=sy(500-2370);if(finishY>-20&&finishY<660)for(let i=0;i<12;i++)for(let j=0;j<2;j++)rect(365+i*20,finishY+j*20,20,20,(i+j)%2?'#243f62':'#fff');
  const car=s.car;c.save();c.translate(car.x,sy(car.y));c.rotate(car.angle);if(s.invulnerable>0&&!reduced)c.globalAlpha=.6+.35*Math.sin(s.time*25);
  for(const side of [-1,1]){rect(side*14-5,-14,10,15,'#2d3647',3);rect(side*14-5,15,10,15,'#2d3647',3);}rect(-11,-22,22,50,'#387fbe',4,'#204967');rect(-6,-19,5,44,'#89cdea',2);path([[-11,-22],[0,-43],[11,-22]],'#efc583','#705b4d');path([[-3,-37],[0,-43],[3,-37]],'#253d4d');rect(-11,23,22,9,'#e9789e',2);c.restore();
  if(s.lastHit&&s.time-s.lastHit.at<.6&&!reduced){const age=s.time-s.lastHit.at;for(let i=0;i<12;i++){const a=i*2.4;ellipse(s.lastHit.x+Math.cos(a)*age*90,sy(s.lastHit.y)+Math.sin(a)*age*90,5,2,'#e65062');}}
  rect(20,568,920,55,'#fffff3e8',4);text(`${Math.min(100,Math.round(s.distance/2370*100))}%`,43,594,23);meter(136,591,548,s.distance/2370,'#408cc2');for(let i=0;i<3;i++)path([[746+i*54,603],[751+i*54,578],[764+i*54,578],[769+i*54,603]],i<s.health?'#438fc4':'#b9c6c9');
}

export function paintCap(g,s,reduced){
  const {c,rect,ellipse,line,path,text}=g,x=s.launch.x;
  ellipse(x,564,54,10,'#aa38194a');path([[x-37,560],[x-35,498],[x-18,470],[x-18,434],[x+18,434],[x+18,470],[x+35,498],[x+37,560]],'#278e9c','#173f6e',4);rect(x-35,499,70,44,'#ffec9b',3);ellipse(x,520,18,16,'#dd493c');line([[x-22,497],[x-22,551]],'#c7ede3',5);rect(x-22,432,44,12,'#f0d05f',2,'#174875');
  if(s.mode==='aim'){c.save();c.translate(x,460);c.rotate(s.angle);line([[25,0],[82,0]],'#174a75',4);path([[85,0],[72,-8],[72,8]],'#174a75');c.restore();}
  const cx=s.cupX,w=s.cupWidth;ellipse(cx,543,w*.64,9,'#b7632c45');path([[cx-w/2,455],[cx-w/2+8,534],[cx+w/2-8,534],[cx+w/2,455]],'#d9f6fc88','#285e81',3);path([[cx-w/2+5,493],[cx-w/2+9,532],[cx+w/2-9,532],[cx+w/2-5,493]],'#62bfeac0');ellipse(cx,493,w/2-5,8,'#a1e0ee','#398eb4');line([[cx-w/2+12,468],[cx-w/2+16,519]],'#fff',5);ellipse(cx,455,w/2,9,null,'#fff9dc',6);ellipse(cx,455,w/2,9,null,'#275875',2);
  if(!reduced&&s.trail.length>1){c.save();c.setLineDash([2,8]);line(s.trail.map(p=>[p.x,p.y]),'#e34a3a90',3);c.restore();}
  const cap=s.cap;c.save();c.translate(cap.x,cap.y);c.rotate(cap.angle);const points=Array.from({length:24},(_,i)=>{const a=i*Math.PI/12,r=i%2?12:15;return [Math.cos(a)*r,Math.sin(a)*r];});path(points,'#eb5744','#762d39',2);ellipse(0,0,10,10,'#fff3af');path([[-5,0],[0,-6],[5,0],[0,6]],'#ed5d47');c.restore();
  for(let i=0;i<3;i++){ellipse(405+i*62,581,17,17,i<s.scored?'#fff1a8':'#d0524090','#fff0b0',2);if(i<s.scored)path([[397+i*62,581],[403+i*62,587],[415+i*62,573]],null,'#126b83',3);}
  text(`失手 ${s.misses} / 4`,826,587,21,'#fff4cd','center');
}

export function paintGlider(g,s,reduced){
  const {c,rect,ellipse,line,path,text}=g,ox=s.plane.x-240;
  for(const gate of s.gates){const x=gate.x-ox;if(x<-100||x>1050)continue;const top=gate.y-gate.gap/2,bottom=gate.y+gate.gap/2;
    for(const [y,h] of [[58,top-58],[bottom,640-bottom]]){if(h<=0)continue;rect(x-24,y,48,h,'#265d5b',1,'#174845');rect(x-19,y,7,h,'#76aaa0',1);for(let j=y+15;j<y+h;j+=26)line([[x-11,j],[x+18,j-8]],'#497b70',3);}
    rect(x-32,top-13,64,13,'#d56247',2,'#7c3d34');rect(x-32,bottom,64,13,'#d56247',2,'#7c3d34');
  }
  for(const r of s.rings){const x=r.x-ox;if(r.hit||x<-60||x>1020)continue;ellipse(x,r.y,30,42,null,'#ece7b6',8);ellipse(x,r.y,30,42,null,'#cc9c43',3);line([[x-17,r.y-28],[x-24,r.y-12]],'#fffbea',4);}
  if(!reduced&&s.trail.length>1){c.save();c.globalAlpha=.55;line(s.trail.map(p=>[p.x-ox,p.y]),'#fff8db',5);c.restore();}
  const p=s.plane;c.save();c.translate(240,p.y);c.rotate(p.angle*.4);path([[-31,-15],[36,0],[-26,20],[-13,3]],'#fffef0','#365e68',2);path([[-31,-15],[-13,3],[36,0]],'#b2dde0','#365e68',2);path([[-13,3],[-26,20],[6,6]],'#e06345','#78463e',1.5);line([[-22,-9],[14,-1]],'#78a4a9',1.5);c.restore();
  if(Math.abs(s.wind)>.00008&&!reduced){for(let i=0;i<6;i++){const x=330+i*64,y=150+(i%3)*85+(s.time*35%40);line([[x,y],[x+28,y-10]],'#fff7d999',2);}}
  rect(24,571,258,47,'#fcfff1dd',4);text('风环',40,595,21,'#295b60');for(let i=0;i<5;i++)ellipse(116+i*32,595,9,13,i<s.ringsHit?'#d8a74d':null,i<s.ringsHit?'#b77d31':'#689b9a',2);text(`${Math.min(100,Math.round(s.progress/2500*100))}%`,918,597,24,'#fffdec','right');
}
