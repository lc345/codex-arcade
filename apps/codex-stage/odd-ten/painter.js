export function oddBrushes(g){
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
}

export function paintVault(g,s,reduced){
  const {c,ellipse,line,rect,path,text}=g,{hud}=oddBrushes(g),x=470,y=325;
  ellipse(x+8,y+12,185,185,'#132c3480');const rim=c.createLinearGradient(260,170,650,480);rim.addColorStop(0,'#efe2b4');rim.addColorStop(.45,'#8f855f');rim.addColorStop(.7,'#ece3c5');rim.addColorStop(1,'#736746');ellipse(x,y,176,176,rim,'#15282e',5);ellipse(x,y,158,158,'#172e35','#a8b5a1',2);
  for(let i=0;i<60;i++){const a=i*Math.PI/30-Math.PI/2;line([[x+Math.cos(a)*143,y+Math.sin(a)*143],[x+Math.cos(a)*(i%5?135:125),y+Math.sin(a)*(i%5?135:125)]],'#d3d9bb',i%5?1:3);if(i%5===0)text(i,x+Math.cos(a)*112,y+Math.sin(a)*112,15,'#c6d4c2','center');}
  c.beginPath();c.arc(x,y,146,s.target-Math.PI/2-s.tolerance,s.target-Math.PI/2+s.tolerance);c.strokeStyle='#86dab4';c.lineWidth=15;c.stroke();
  c.save();c.translate(x,y);c.rotate(s.angle);path([[0,-151],[-9,-129],[9,-129]],'#edb657');line([[0,-126],[0,-47]],'#dcad61',3);c.restore();
  ellipse(x,y,83,83,rim,'#101f28',4);ellipse(x,y,66,66,'#657e79','#dfd6ac',3);ellipse(x-14,y-15,16,11,'#b8c7a4');line([[x-36,y+35],[x+37,y-35]],'#29424a',17);text(s.direction>0?'↻':'↺',x,y+5,62,'#e9e5bc','center');
  for(let i=0;i<s.goal;i++){const yy=175+i*48;rect(725,yy,61,29,i<s.progress?'#84c7a8':'#152c37',4,'#6a938d');if(i<s.progress)line([[738,yy+15],[747,yy+23],[772,yy+7]],'#264b4e',3);}
  for(let i=0;i<3;i++)ellipse(211+i*25,475,6,6,i<s.errors?'#ef665e':'#536863');
  hud(s,s.held?'转盘转动中':'指针停在绿色刻度','#b24968');
}

export function paintWash(g,s,reduced){
  const {c,rect,ellipse,line,text,meter}=g,{hud}=oddBrushes(g);
  for(let i=0;i<s.cells.length;i++){const d=s.cells[i];if(!d.dirt)continue;c.save();c.globalAlpha=d.dirt;rect(d.x-21,d.y-22,43,45,['#697276','#586369','#77817d'][i%3],6);ellipse(d.x-7,d.y+4,12,10,'#49535265');line([[d.x-12,d.y-9],[d.x+9,d.y-5]],'#92928b70',3);c.restore();}
  const p=s.controlPoint;
  if(s.held&&!s.jammed){c.save();c.globalAlpha=.5;ellipse(p.x,p.y,57,48,'#b8f4ff');c.restore();if(!reduced)for(let i=0;i<20;i++){const a=i*2.4,d=10+((s.time*170+i*19)%65);line([[p.x+Math.cos(a)*d,p.y+Math.sin(a)*d],[p.x+Math.cos(a)*(d+7),p.y+Math.sin(a)*(d+7)]],'#e6ffff',3);}}
  line([[p.x+39,p.y+37],[899,559]],'#244856',11);line([[p.x+39,p.y+37],[899,559]],'#537c8a',5);c.save();c.translate(p.x,p.y);c.rotate(-.7);rect(4,0,72,21,'#1d5363',4,'#133746');rect(37,12,24,39,'#e96d43',4);rect(-8,0,15,20,'#bcccd0',2);c.restore();
  rect(748,81,163,48,'#fdf7e5ec',4);text(s.jammed?'过热，冷却中':'水枪温度',762,96,14,s.jammed?'#ce475b':'#325768');meter(762,115,134,s.heat,s.heat>.78?'#d74752':'#339fb4');
  hud(s,`壁画显影 ${Math.min(100,Math.round(s.progress/144*100))}%`,'#279bad');
}

export function paintZipper(g,s,reduced){
  const {c,rect,line,path,ellipse,text}=g,{hud}=oddBrushes(g),points=s.path.map(p=>[p.x,p.y]);
  line(points,'#102c4c',s.width+24);line(points,'#92b0c2',s.width+11);line(points,'#153b62',s.width);
  if(s.wear>.05){c.save();c.globalAlpha=s.wear;line(points,'#ef6560',s.width+24);line(points,'#183e63',s.width);c.restore();}
  const used=s.path.filter(p=>p.y<s.y).map(p=>[p.x,p.y]);if(used.length>1){line(used,'#73a8b3',s.width-8);line(used,'#dce2bd',4);}
  for(let i=0;i<s.path.length;i+=2){const p=s.path[i],open=p.y>s.y;rect(p.x-s.width/2-11,p.y-4,open?18:s.width/2+11,7,i%4?'#b9b499':'#ded1a2',1);rect(p.x+ (open?s.width/2-7:0),p.y,open?18:s.width/2+11,7,'#ddc790',1);}
  const z={x:s.x,y:s.y};ellipse(z.x+6,z.y+7,30,13,'#081e3880');path([[z.x-22,z.y-16],[z.x+22,z.y-16],[z.x+15,z.y+21],[z.x-15,z.y+21]],'#e9be6e','#634d38',3);rect(z.x-9,z.y-5,18,51,'#dcc99b',7,'#62492e');rect(z.x-4,z.y+20,8,16,'#2b506c',4);
  line([[s.path.at(-1).x-47,547],[s.path.at(-1).x+47,547]],'#cf704b',9);text('FINISH',s.path.at(-1).x,555,12,'#fff','center');
  hud(s,s.wear>.3?'布料开始磨损':'沿着针脚，拉到终点',s.wear>.3?'#d35155':'#4488ad');
}

export function paintAlarm(g,s,reduced){
  const {c,rect,line,text}=g,{hud,cross}=oddBrushes(g);
  for(const clock of s.clocks){const ringing=clock.mode==='ring',dx=ringing&&!reduced?Math.round(Math.sin(s.time*40)*3)*2:0,x=clock.x+dx,y=clock.y,base=ringing?'#f2bf53':'#8394bd',ink='#313b60';
    rect(x-51,y-37,102,79,ink);rect(x-45,y-43,90,79,base);rect(x-32,y-29,64,53,ringing?'#fff0aa':'#d2e5e9');rect(x-49,y+32,15,12,ink);rect(x+31,y+32,15,12,ink);rect(x-31,y-54,60,11,base);rect(x-4,y-62,8,9,'#e7788f');
    if(ringing){line([[x,y-22],[x,y],[x+20,y-6]],ink,5);rect(x-3,y-3,6,6,ink);for(const side of [-1,1]){rect(x+side*60-3,y-30,6,14,'#f8d375');rect(x+side*71-3,y-11,6,12,'#f8d375');}const t=Math.max(0,(clock.until-s.time)/(1.35-s.stage*.17));rect(x-43,y+44,86*t,5,'#f0d26a');}
    else {line([[x-24,y-7],[x-14,y-7]],'#546997',4);line([[x+14,y-7],[x+24,y-7]],'#546997',4);text('z',x+24,y-53,18,'#b4c6e5');}
  }
  cross(s.controlPoint,'#dbeff780');hud(s,`敲错 / 漏响 ${s.errors} / 3`,'#8571b8');
}

export function paintLander(g,s,reduced){
  const {c,rect,path,line,ellipse,text,meter}=g,{hud}=oddBrushes(g),b=s.ship,p=s.pad;
  rect(p.x-p.w/2-6,p.y+6,p.w+12,25,'#304b48',2);rect(p.x-p.w/2,p.y,p.w,8,'#83d6a9',2);for(const dx of [-1,1]){line([[p.x+dx*(p.w/2+10),p.y],[p.x+dx*(p.w/2+10),p.y-34]],'#384943',4);ellipse(p.x+dx*(p.w/2+10),p.y-36,5,5,'#edcf73');}
  text('LAND',p.x,p.y+26,14,'#d6ebc3','center');
  c.save();c.setLineDash([4,8]);line([[s.controlPoint.x,95],[s.controlPoint.x,510]],'#bae7a838',1);c.restore();
  if(s.held&&s.fuel>0){const h=26+(reduced?0:Math.sin(s.time*70)*11);path([[b.x-12,b.y+19],[b.x,b.y+19+h],[b.x+12,b.y+19]],'#e2b851');path([[b.x-6,b.y+19],[b.x,b.y+19+h*.6],[b.x+6,b.y+19]],'#f3efd2');}
  path([[b.x-29,b.y+6],[b.x-17,b.y-22],[b.x+17,b.y-22],[b.x+29,b.y+6],[b.x+20,b.y+20],[b.x-20,b.y+20]],'#d1c8a0','#1f343b',3);rect(b.x-15,b.y-15,30,23,'#284a51',4);line([[b.x-10,b.y-11],[b.x+8,b.y-11]],'#9fd8bb',3);for(const side of [-1,1]){line([[b.x+side*20,b.y+11],[b.x+side*32,b.y+25],[b.x+side*40,b.y+25]],'#c3cbb0',4);}
  rect(80,82,196,85,'#182e2dea',3);text(`↓ ${(b.vy*60).toFixed(0)} px/s`,95,105,20,b.vy>2.9?'#ee876f':'#a9d7b3');text('FUEL',95,138,14,'#b6c9b3');meter(150,137,105,s.fuel/(8-s.stage),'#e0c17f');
  hud(s,'绿色停机坪 / 轻落才算数','#539b80');
}

export function paintJelly(g,s,reduced){
  const {c,rect,path,line,ellipse,text}=g,{hud,face}=oddBrushes(g);
  for(const gate of s.gates){const x=gate.x-s.distance;if(x< -80||x>1040)continue;
    if(gate.low){const bottom=501-gate.clearance;rect(x-25,151,50,bottom-151,'#579f98',6,'#316b70');rect(x-39,bottom-15,78,15,'#346b71',5);line([[x-13,169],[x-13,bottom-40]],'#9cd8b8',5);path([[x-7,bottom-40],[x,bottom-30],[x+7,bottom-40]],'#ffdd87');}
    else {for(const side of [-1,1])rect(x+side*(gate.clearance/2+11)-11,373,22,129,'#b466a0',4,'#7e4484');rect(x-gate.clearance/2-23,344,gate.clearance+46,29,'#b466a0',4,'#7e4484');line([[x-gate.clearance/2,356],[x+gate.clearance/2,356]],'#f4c3d6',3);}
    if(gate.passed){ellipse(x,324,12,12,'#fff5c7');path([[x-6,324],[x-1,329],[x+7,319]],null,'#318879',3);}
  }
  const x=200,y=501,w=s.width,h=s.height;ellipse(x+8,y+5,w*.67,10,'#78377440');const fill=c.createLinearGradient(x,y-h,x,y);fill.addColorStop(0,'#fcbed8');fill.addColorStop(.25,'#f781bd');fill.addColorStop(1,'#ce4489');rect(x-w/2,y-h,w,h,fill,Math.min(20,w/3),'#983d75');rect(x-w/2+8,y-h+8,9,h*.47,'#fff0df80',5);face(x,y-h*.55,Math.min(30,w*.6),'#692e68');ellipse(x-12,y-h*.46,4,2,'#fbd5c9');ellipse(x+12,y-h*.46,4,2,'#fbd5c9');
  if(!reduced&&s.phase==='playing')for(let i=0;i<4;i++)ellipse(x-40-i*24,y-4,7-i,3,'#fff0c6a0');
  hud(s,s.held?'扁扁模式':'高高模式','#c85497');
}

export function paintBaggage(g,s,reduced){
  const {c,rect,ellipse,line,path,text}=g,{hud}=oddBrushes(g);
  rect(75,224,816,116,'#34525d',28,'#244553');rect(85,233,796,90,'#526e74',25);for(let i=0;i<30;i++){const x=89+(i*29+(reduced?0:s.time*77)%29)%780;line([[x,239],[x,316]],'#829695',2);}for(const x of [83,871])ellipse(x,279,24,43,'#213e4f');
  for(const bin of s.bins){const col=bin.type?'#d76a8c':'#298f9f';rect(bin.x-96,425,192,130,col,8,'#244d5a');rect(bin.x-78,436,156,44,'#24414d',7);text(bin.type?'B':'A',bin.x,518,44,'#fff2d7','center');path([[bin.x-13,404],[bin.x,416],[bin.x+13,404]],null,col,5);}
  for(const b of s.bags){if(b.dead)continue;c.save();c.translate(b.x,b.y);c.rotate(b.id===s.drag?.08:0);ellipse(4,43,46,7,'#273c4050');rect(-30,-34,60,72,b.type?'#e999b0':'#56b6c1',7,'#224c60');rect(-17,-45,34,13,'#284856',4);rect(-11,-42,22,7,'#b4d6d0',2);for(const x of [-16,0,16])line([[x,-23],[x,24]],b.type?'#b76286':'#2b899b',3);rect(13,-18,15,26,'#fff4c9',2);text(b.type?'B':'A',20,-4,13,'#355967','center');ellipse(-20,41,5,6,'#244154');ellipse(20,41,5,6,'#244154');c.restore();}
  hud(s,`误送 / 漏件 ${s.errors} / 3`,'#438d95');
}

export function paintFuse(g,s,reduced){
  const {c,rect,line,path,ellipse,text}=g,{hud,spark}=oddBrushes(g);
  for(const w of s.wires){line([[w.x1,w.y],[w.x2,w.y]],'#0b2a36',8);line([[w.x1,w.y-2],[w.x2,w.y-2]],'#709b91',1);
    if(w.cut){line([[632,w.y],[650,w.y-12]],'#879f9a',4);line([[665,w.y+14],[684,w.y]],'#879f9a',4);rect(650,w.y-7,14,14,'#174356');}
    else {line([[w.x1,w.y],[w.burn,w.y]],'#f08652',4);spark(w.burn,w.y,reduced?0:s.time);}
    const x=824,y=w.y;rect(x-23,y-25,47,50,w.cut?'#508c83':'#d36267',6,'#102f40');rect(x-17,y-17,34,18,'#173545',2);text(w.cut?'SAFE':`${Math.max(0,Math.ceil((w.x2-w.burn)/w.rate))}`,x,y-7,w.cut?9:18,w.cut?'#a2e2c2':'#f7dc85','center');for(const dx of [-1,1])line([[x+dx*12,y+11],[x+dx*12,y+20]],'#223e4b',3);
  }
  line([[100,325],[860,325]],'#6d4b2b',17);line([[100,325],[860,325]],'#e7ba57',11);for(let x=118;x<850;x+=27)line([[x-3,320],[x+3,330]],'#876543',3);rect(399,310,162,31,'#153d52',3);text('POWER / 勿剪',480,326,15,'#efd174','center');
  const p=s.controlPoint;ellipse(p.x-9,p.y+9,8,8,null,'#cbe6da',3);ellipse(p.x+9,p.y+9,8,8,null,'#cbe6da',3);line([[p.x-5,p.y+4],[p.x+12,p.y-22]],'#d0e7d7',3);line([[p.x+5,p.y+4],[p.x-12,p.y-22]],'#d0e7d7',3);
  hud(s,'剪引线 / 金色电缆不可碰','#398f98');
}

export function paintTower(g,s,reduced){
  const {c,rect,ellipse,path,line,text}=g,{hud}=oddBrushes(g);
  ellipse(480,553,154,12,'#213f424a');
  for(const b of s.blocks){c.save();c.translate(b.x,b.y);c.rotate(b.angle);const selected=s.drag===b.id;rect(-88,-13,176,27,selected?'#86baa0':b.id%2?'#daae70':'#eec691',3,'#976f4b');for(let i=0;i<4;i++)line([[-79,-8+i*5],[-25,-9+i*5],[40,-6+i*5],[80,-7+i*5]],selected?'#498d79':'#b889574d',1);ellipse(-34,2,13,4,null,selected?'#579f87':'#ae855952',1);text(b.id+1,69,0,12,'#7e694b','center');c.restore();}
  const r=s.roof;c.save();c.translate(r.x,r.y);c.rotate(r.angle);rect(-64,-14,128,28,'#e79b84',3,'#774b4c');path([[-78,-14],[0,-64],[78,-14]],'#487972','#254e53',3);line([[-59,-19],[0,-56],[59,-19]],'#79a490',2);rect(-8,-11,16,25,'#634755',2);for(const side of [-1,1])rect(side*38-10,-8,20,13,'#f9dc8c',1);c.restore();
  if(s.drag!==null){const b=s.blocks.find(b=>b.id===s.drag);if(b)line([[b.x,b.y],[s.controlPoint.x,s.controlPoint.y]],'#277b7b',2);}
  hud(s,'抽出木板 / 让屋顶落稳','#488f7c');
}

export function paintSugar(g,s,reduced){
  const {c,rect,path,ellipse,line,text}=g,{hud}=oddBrushes(g),b=s.candy,p=s.basket;
  if(!s.cut){line([[s.anchor.x,s.anchor.y],[b.x,b.y]],'#805075',4);line([[s.anchor.x-1,s.anchor.y],[b.x-1,b.y]],'#f6dba7',1);ellipse(s.anchor.x,s.anchor.y,8,8,'#f6d187','#7f4c73',2);}
  ellipse(p.x+6,556,p.w*.64,13,'#548d9040');path([[p.x-p.w/2,510],[p.x-p.w/2+9,561],[p.x+p.w/2-9,561],[p.x+p.w/2,510]],'#e8acbc','#885679',3);ellipse(p.x,510,p.w/2,10,'#613e63','#f5d7c7',4);rect(p.x-p.w/2+10,543,p.w-20,7,'#f9dfb0',2);text('SUGAR',p.x,542,Math.min(17,p.w/6),'#734b71','center');
  c.save();c.translate(b.x,b.y);c.rotate(b.angle);path([[-19,-6],[-44,-22],[-40,13],[-19,6]],'#dd6f9b','#925476',2);path([[19,-6],[44,-22],[40,13],[19,6]],'#dd6f9b','#925476',2);ellipse(0,0,23,23,'#f9d9a4','#9d607d',3);for(let i=0;i<3;i++){c.save();c.rotate(i*2.094);path([[0,0],[-10,-20],[2,-23],[10,-20]],'#d26495');c.restore();}ellipse(-9,-9,5,3,'#fff5d5');c.restore();
  if(s.cut&&!reduced)for(let i=0;i<3;i++)ellipse(b.x-b.vx*i*3,b.y-b.vy*i*3,4-i,4-i,'#bd658344');
  hud(s,s.cut?'糖果落下了':'选准一瞬，剪断绳子','#c06498');
}
