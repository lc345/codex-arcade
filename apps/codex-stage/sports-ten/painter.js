export function sportsBrushes(g,s,reduced){
  const {c,rect,ellipse,line,text,path}=g;
  function ball(b,r,color,kind='plain'){
    if(!Number.isFinite(b.x+b.y))return;ellipse(b.x+3,b.y+6,r*.95,r*.67,'#102c3b38');
    c.save();c.translate(b.x,b.y);c.rotate(b.angle||0);const light=c.createRadialGradient(-r*.34,-r*.38,r*.08,0,0,r);light.addColorStop(0,'#fffbea');light.addColorStop(.28,color);light.addColorStop(1,kind==='cue'?'#bfc9ba':color);ellipse(0,0,r,r,light,'#193d454d',1.3);
    if(kind==='basket'){ellipse(0,0,r*.45,r,null,'#6e3827',1.5);line([[-r,0],[r,0]],'#6e3827',1.5);line([[0,-r],[0,r]],'#6e3827',1.5);}
    if(kind==='football'){path(Array.from({length:5},(_,i)=>[Math.cos(i*Math.PI*2/5)*r*.43,Math.sin(i*Math.PI*2/5)*r*.43]),'#253c41');for(let i=0;i<5;i++){const a=i*Math.PI*2/5;line([[Math.cos(a)*r*.4,Math.sin(a)*r*.4],[Math.cos(a)*r*.88,Math.sin(a)*r*.88]],'#526b69',1.5);}}
    if(kind==='tennis'){c.beginPath();c.arc(-r*.8,0,r*.9,-1.4,1.4);c.strokeStyle='#fffed7';c.lineWidth=2;c.stroke();}
    if(kind==='bowling'){for(const [x,y] of [[-4,-5],[5,-5],[0,5]])ellipse(x,y,3,3,'#241839');}
    if(typeof kind==='number'){ellipse(0,0,r*.52,r*.52,'#fffbe8');text(kind,0,1,12,'#273d3b','center');}
    c.restore();
  }
  function trail(color,width=4){if(reduced||!s.trail?.length)return;c.save();c.globalAlpha=.3;line(s.trail.map(p=>[p.x,p.y]),color,width);c.restore();}
  function aim(scale=.075,gravity=0){if(!s.aim)return;const b=s.ball,dx=b.x-s.aim.x,dy=b.y-s.aim.y,len=Math.hypot(dx,dy)||1,ratio=Math.min(17,len*scale)/len;
    c.save();c.setLineDash([2,12]);const pts=[];for(let t=0;t<=.38;t+=.025)pts.push([b.x+dx*ratio*60*t,b.y+dy*ratio*60*t+gravity*t*t/2]);line(pts,'#fffceb',3);c.restore();ellipse(s.aim.x,s.aim.y,8,8,null,'#fff8d8',2);line([[b.x,b.y],[s.aim.x,s.aim.y]],'#fff9df66',2);
  }
  function footer(left,right,color='#203e47'){rect(24,578,912,42,'#fffdf2ec',4);text(left,42,600,20,color);text(right,916,600,20,color,'right');}
  return {ball,trail,aim,footer};
}

export function paintPocket(g,s,reduced){
  const {c,rect,ellipse,line,text}=g,h=sportsBrushes(g,s,reduced);
  rect(83,103,794,454,'#175b4595',2);for(const r of s.rails){rect(r[0]-r[2]/2,r[1]-r[3]/2,r[2],r[3],'#164e40',4,'#8d6339');line([[r[0]-r[2]/2+7,r[1]-r[3]/2+4],[r[0]+r[2]/2-7,r[1]-r[3]/2+4]],'#52a17a',2);}
  for(const p of s.pockets){ellipse(p.x,p.y,26,26,'#100f0b','#946840',3);ellipse(p.x,p.y+3,19,17,'#020908');}
  h.trail('#f6efc0',3);const colors=['#efc23d','#4e8acf','#da5149','#865dac','#dd7849'];for(const b of s.balls)if(!b.potted)h.ball(b,14,colors[b.id-1],b.id);
  if(!s.scratched)h.ball(s.ball,14,'#fffdee','cue');
  if(s.aim){h.aim();const b=s.ball,dx=b.x-s.aim.x,dy=b.y-s.aim.y,len=Math.hypot(dx,dy)||1,d=35+Math.min(70,len*.5),x=b.x-dx/len*d,y=b.y-dy/len*d;line([[x,y],[x-dx/len*130,y-dy/len*130]],'#d5ad70',6);line([[x,y],[x-dx/len*12,y-dy/len*12]],'#bbe6d5',7);}
  h.footer(`入袋 ${s.progress} / ${s.goal}`,`球杆 ${s.shots}   ·   犯规 ${s.fouls}`);
}

export function paintHoops(g,s,reduced){
  const {c,rect,ellipse,line,path,text}=g,h=sportsBrushes(g,s,reduced),{x,y}=s.hoop;
  line([[x+62,y+15],[x+72,564],[x+132,564]],'#244e63',13);line([[x+66,y+29],[x+113,555]],'#9bd4d4',4);rect(x+56,y-112,12,126,'#e7f5ed',2,'#285369');rect(x+43,y-72,14,44,'#e87250',1);
  const pulse=s.lastEvent?.type==='catch'&&!reduced?Math.max(0,1-(s.time-s.lastEvent.at)*2):0;
  for(let i=0;i<8;i++){const xx=x-39+i*11;line([[xx,y+2],[x+(xx-x)*.6+Math.sin(i)*pulse*10,y+58+Math.sin(i)*pulse*6]],'#fff5dc',2);}
  for(let j=1;j<4;j++)line([[x-39+j*4,y+j*14],[x+39-j*4,y+j*14]],'#e8f5d2',2);ellipse(x,y+1,43,5,null,'#a34529',6);ellipse(x,y-2,43,5,null,'#ed7744',4);
  ellipse(s.launch.x,505,40,9,'#ac392b40');h.trail('#f8eea6',6);h.aim(.085,800);h.ball(s.ball,15,'#ed8a35','basket');
  for(let i=0;i<3;i++){ellipse(79+i*37,101,12,12,i<s.made?'#f7c952':'#ffffff77','#b14d38',2);if(i<s.made)line([[73+i*37,101],[78+i*37,106],[86+i*37,96]],'#85402f',2);}
  h.footer(`命中 ${s.made} / 3`,`剩余 ${s.shots} 次出手`);
}

export function paintKick(g,s,reduced){
  const {c,rect,ellipse,line,path,text}=g,h=sportsBrushes(g,s,reduced);
  rect(348,61,264,42,'#dceae052',1);for(let x=351;x<611;x+=17)line([[x,61],[x,101]],'#e2f7db',1);for(let y=65;y<104;y+=12)line([[348,y],[612,y]],'#e2f7db',1);line([[340,134],[340,67],[620,67],[620,134]],'#f5fff0',9);
  function person(x,y,color,keeper=false){ellipse(x+4,y+8,keeper?37:25,13,'#183f393a');rect(x-13,y-13,26,32,color,7,'#21483c');line([[x-9,y+14],[x-13,y+28]],'#18372d',8);line([[x+9,y+14],[x+13,y+28]],'#18372d',8);line([[x-12,y-7],[x-(keeper?34:20),y+3]],color,10);line([[x+12,y-7],[x+(keeper?34:20),y+3]],color,10);ellipse(x,y-17,12,11,'#eac294','#5d5333',1);if(keeper){ellipse(x-34,y+3,6,7,'#ffefba');ellipse(x+34,y+3,6,7,'#ffefba');}}
  for(const b of s.wall)person(b.x,b.y,'#3879bc');person(s.keeper.x,s.keeper.y,'#ee7d38',true);
  h.trail('#fffcc6',4);h.aim(.16);h.ball(s.ball,13,'#f9ffef','football');
  if(s.mode==='aim')ellipse(480,535,26,26,null,'#f8ffb07a',2);h.footer(`进球 ${s.made} / 3`,`剩余 ${s.shots} 脚`);
}

export function paintTennis(g,s,reduced){
  const {c,rect,ellipse,line,text}=g,h=sportsBrushes(g,s,reduced);
  function racket(p,color,top){const y=p.y;ellipse(p.x+6,y+8,p.w/2,11,'#19452f33');line([[p.x,y],[p.x,y+(top?-40:40)]],'#824e31',10);ellipse(p.x,y,p.w/2,11,'#eaf4c3a0',color,5);c.save();c.beginPath();c.ellipse(p.x,y,p.w/2-3,9,0,0,Math.PI*2);c.clip();for(let j=-40;j<=40;j+=8)line([[p.x+j,y-15],[p.x+j,y+15]],'#e5f3d5',1);for(let j=-8;j<=8;j+=4)line([[p.x-45,y+j],[p.x+45,y+j]],'#f1f7c7',1);c.restore();ellipse(p.x,y+(top?-51:36),12,12,top?'#e8c390':'#e4b88d');rect(p.x-16,y+(top?-39:17),32,20,color,5);}
  racket(s.opponent,'#e75e4d',true);racket(s.player,'#317cac',false);h.trail('#edffc2',4);h.ball(s.ball,10,'#daeb53','tennis');
  rect(30,91,125,67,'#fffde7eb',4);text('你',48,111,15,'#387b91');text(s.points,78,137,27,'#387b91','center');text(':',113,137,23);text(s.enemy,139,137,27,'#bf5441','center');
  h.footer(`你 ${s.points}   :   ${s.enemy} 对手`,`先得 3 分   ·   本球 ${s.hits} 拍`);
}

export function paintPing(g,s,reduced){
  const {c,rect,ellipse,line,path,text}=g,h=sportsBrushes(g,s,reduced);
  line([[222,492],[202,562]],'#2b5861',11);line([[720,492],[741,562]],'#2b5861',11);line([[220,500],[723,542]],'#93ac98',6);rect(155,474,650,20,'#276391',2,'#123953');rect(155,474,650,5,'#f8f4d8');
  rect(476,s.netTop,8,474-s.netTop,'#163e50',1);for(let y=s.netTop+3;y<470;y+=8)line([[474,y],[486,y]],'#edf4d8',1);rect(469,s.netTop-3,23,5,'#fbf8e9',1);
  const bat=s.bat;c.save();c.translate(bat.x,bat.y);c.rotate(s.swing?Math.sin(s.swing/.22*Math.PI)*-.11:0);line([[0,30],[-13,100]],'#cc9b57',13);ellipse(0,0,13,77,'#ed4450','#622c37',3);ellipse(-3,-5,7,61,'#f96b69');c.restore();
  if(s.mode==='flight'&&!s.hit){c.save();c.globalAlpha=.3;rect(205,289,45,158,'#fef1a4',4);c.restore();}
  h.trail('#fff3b5',3);h.ball(s.ball,9,'#fffbee');h.footer(`回球 ${s.returns} / ${s.goal}`,`失误余量 ${s.lives}`);
}

export function paintBowling(g,s,reduced){
  const {c,rect,ellipse,line,path,text}=g,h=sportsBrushes(g,s,reduced);
  for(let side of [215,745]){rect(side-12,90,25,470,'#734253b0',5);line([[side-9,90],[side-9,560]],'#f5ddaa',2);}
  for(let i=0;i<7;i++)path([[390+i*30,417-Math.abs(i-3)*10],[395+i*30,427-Math.abs(i-3)*10],[385+i*30,427-Math.abs(i-3)*10]],'#a57034b0');
  h.trail('#965bb7',8);for(const p of s.pins){c.save();c.translate(p.x,p.y);c.rotate(p.angle);if(p.fallen)c.globalAlpha=.75;ellipse(4,8,14,21,'#68413640');rect(-11,-17,22,34,'#fffceb',9,'#bea77f');rect(-8,-11,16,5,'#d94a46',2);ellipse(-3,6,5,10,'#fff');c.restore();}
  h.aim(.19);h.ball(s.ball,23,'#834b99','bowling');h.footer(`击倒 ${s.progress} / ${s.goal}`,`剩余 ${s.shots} 球`);
}

export function paintCurling(g,s,reduced){
  const {c,rect,ellipse,line,path,text,meter}=g,h=sportsBrushes(g,s,reduced),t=s.target;
  for(const [r,color] of [[105,'#399bb7b0'],[66,'#fffdf1e8'],[31,'#e56b63df']])ellipse(t.x,t.y,r,r,color,'#d9e8e6',2);ellipse(t.x,t.y,5,5,'#f5faef');line([[t.x-122,t.y],[t.x+122,t.y]],'#32587970',1);line([[t.x,t.y-122],[t.x,t.y+122]],'#32587970',1);
  function stone(b,color){ellipse(b.x+3,b.y+7,25,18,'#155a6e34');ellipse(b.x,b.y+3,23,21,'#889995','#486d74',2);ellipse(b.x,b.y-3,22,19,'#d8ddd2','#5d7e84',2);ellipse(b.x,b.y-3,15,12,color);line([[b.x-8,b.y-6],[b.x-8,b.y-14],[b.x+9,b.y-14],[b.x+9,b.y-6]],color,6);line([[b.x-7,b.y-15],[b.x+7,b.y-15]],'#fffbcaa0',2);}
  if(s.guard)stone(s.guard,'#427dab');h.trail('#fff',9);stone(s.stone,'#df5c51');
  if(s.mode==='slide'&&s.held&&s.sweep>0){const x=s.stone.x+43,y=s.stone.y+(reduced?0:Math.sin(s.time*35)*22);line([[x+8,y-52],[x,y]],'#52717b',5);rect(x-18,y-7,37,14,'#e9b83b',3);for(let i=0;i<7;i++)line([[x-15+i*5,y-5],[x-15+i*5,y+5]],'#8a691f');}
  if(s.mode==='aim'&&s.held){rect(260,485,380,49,'#fffdf5e8',5);meter(278,507,343,s.charge/1.4,'#e47555');}else if(s.mode==='slide')meter(100,498,172,s.sweep,'#3495a3');
  h.footer(`靶分 ${s.points} / ${s.goal}`,`剩余 ${s.throws} 壶`);
}

export function paintDomino(g,s,reduced){
  const {c,rect,ellipse,line,path,text}=g,h=sportsBrushes(g,s,reduced);
  rect(40,500,410,40,'#bf493e',3,'#753939');rect(550,500,390,40,'#427f91',3,'#2d5b6e');for(const x of [75,392,579,891]){rect(x,540,20,37,'#d1a159',2);ellipse(x+9,518,5,5,'#edc18b','#72473a');}
  rect(451,519,98,50,'#162e374f',2);const b=s.bridge;rect(b.x-b.w/2,b.y-10,b.w,20,'#e7b749',3,'#6f6b3c');for(let i=-b.w/2+10;i<b.w/2;i+=17)line([[b.x+i,b.y-7],[b.x+i-6,b.y+7]],'#b58531',2);line([[500,544],[500,565]],'#cf463e',2);
  for(let i=0;i<s.pieces.length;i++){const p=s.pieces[i];c.save();c.translate(p.x,p.y);c.rotate(p.angle);rect(-6.5,-33,13,66,i%3===0?'#ee6550':i%3===1?'#ffd365':'#4fa3a8',2,'#334b4b');line([[-4,-1],[4,-1]],'#effae4',1);for(let n=0;n<3;n++){ellipse(0,-23+n*7,1.5,1.5,'#fff9d3');ellipse(0,10+n*7,1.5,1.5,'#fff9d3');}c.restore();}
  line([[850,414],[850,500]],'#575d50',4);path([[850,415],[887,425],[850,438]],'#de4843','#8d3935',1);h.footer(`连锁 ${s.fallen} / 20`,s.mode==='aim'?'桥位待定':'连锁进行中');
}

export function paintPlates(g,s,reduced){
  const {c,rect,ellipse,line,path,text}=g,h=sportsBrushes(g,s,reduced),t=s.tray;
  line([[t.x,560],[t.x,586]],'#e1b185',25);path([[t.x-17,560],[t.x+17,560],[t.x+37,583],[t.x-28,583]],'#f5f8e8','#466962',2);ellipse(t.x,t.y+9,t.w/2+7,10,'#30473c28');rect(t.x-t.w/2,t.y-9,t.w,18,'#e8c867',8,'#706142');line([[t.x-t.w/2+7,t.y-5],[t.x+t.w/2-7,t.y-5]],'#fff6c0',3);
  for(const p of s.plates){c.save();c.translate(p.x,p.y);c.rotate(p.angle);const w=102-s.stage*4;rect(-w/2,-7.5,w,15,'#fffbed',6,'#377e96');line([[-w/2+6,-3],[w/2-6,-3]],p.id%2?'#dc5e7c':'#519fa6',3);for(let i=0;i<7;i++)ellipse(-30+i*10,4,1.5,1.5,p.id%2?'#e67b89':'#4c95a2');c.restore();}
  if(s.spawn<s.goal){ellipse(s.nextX,115,16,6,'#28585130');path([[s.nextX-6,108],[s.nextX,114],[s.nextX+6,108]],null,'#ca5673',2);}
  h.footer(`接稳 ${s.progress} / ${s.goal}`,s.stable>0?'稳住这一摞':'别让盘子掉下去');
}

export function paintCrush(g,s,reduced){
  const {c,rect,ellipse,line,path,text}=g,h=sportsBrushes(g,s,reduced);
  rect(32,526,896,41,'#2e4146',5,'#182a32');for(let i=0;i<30;i++){const x=35+(i*32+(reduced?0:s.time*s.speed*60))%880;line([[x,534],[x+11,556]],'#647e76',4);}ellipse(42,546,16,16,'#a6b3a1','#364c4d',3);ellipse(918,546,16,16,'#a6b3a1','#364c4d',3);
  rect(555,168,30,s.press.y-168,'#77908c',4,'#304749');rect(520,147,100,64,'#38a18b',5,'#27595b');ellipse(570,177,15,15,'#f3e7a1','#305c5c',2);line([[570,178],[575,166]],'#e46346',3);
  for(const it of s.items){c.save();c.translate(it.x,it.y);c.rotate(it.angle);if(it.kind==='battery'){rect(-20,-29,40,60,'#ed4b43',5,'#732c32');rect(-10,-35,20,7,'#453f3b',2);line([[-6,-12],[6,-12]],'#fff3d3',3);line([[0,-18],[0,-6]],'#fff3d3',3);path([[-5,5],[3,5],[-2,14],[5,14],[-5,24],[-1,16],[-7,16]],'#ffdf6b');}else if(it.kind==='metal'){rect(-22,-31,44,62,'#8fadb2',5,'#375561');for(let j=-20;j<30;j+=11)line([[-17,j],[17,j]],'#d6e9d8',3);rect(-13,-22,26,15,'#5c8b97',2);}else{rect(-22,-31,44,62,'#d2a665',2,'#805b36');rect(-5,-30,10,60,'#f1d39a',1);line([[-18,-7],[18,7]],'#9e713d',2);}c.restore();}
  for(const d of s.debris){c.save();c.translate(d.x,d.y);c.rotate(d.angle);rect(-6,-6,12,12,d.bad?'#e5493d':'#d5b26d',1,'#6b6855');c.restore();}
  const y=s.press.y;rect(511,y-35,118,70,'#526c68',4,'#243d43');rect(511,y+13,118,21,'#efc64b',1);c.save();c.beginPath();c.rect(511,y+13,118,21);c.clip();for(let x=505;x<640;x+=27)path([[x,y+13],[x+14,y+13],[x+29,y+34],[x+15,y+34]],'#303b39');c.restore();line([[519,y-27],[620,y-27]],'#9cc0ab',4);
  h.footer(`回收 ${s.crushed} / ${s.goal}`,`电池 ${s.errors} / 1   ·   漏件 ${s.missed} / 3`);
}
