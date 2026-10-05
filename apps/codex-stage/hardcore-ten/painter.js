export function hardBrushes(g,s){
  const {c,rect,line,ellipse,path,text}=g;
  function foot(left,right,dark=false){rect(0,576,960,64,dark?'#14181ff2':'#f3f4ebf2');text(left,26,607,20,dark?'#f3e3c7':'#223d48');text(right,934,607,19,dark?'#f3e3c7':'#223d48','right');text(`${Math.max(0,Math.ceil(s.limit-s.time))}s`,480,607,17,dark?'#9db7bb':'#748c86','center');}
  function cog(x,y,r,a,fill,teeth=12){path(Array.from({length:teeth*4},(_,i)=>{const t=a+i*Math.PI*2/(teeth*4),d=i%4<2?r:r*.81;return [x+Math.cos(t)*d,y+Math.sin(t)*d];}),fill,'#182f38',2);ellipse(x,y,r*.24,r*.24,'#f1e2ba','#233d47',3);}
  function shine(x,y,r,color){for(let i=0;i<4;i++){const a=i*Math.PI/2;line([[x+Math.cos(a)*r*.6,y+Math.sin(a)*r*.6],[x+Math.cos(a)*r,y+Math.sin(a)*r]],color,2);}}
  function flag(x,y){line([[x,y-32],[x,y+13]],'#243b48',3);path([[x,y-32],[x+23,y-25],[x,y-17]],'#e46e4d');}
  function worker(x,y,size=1){c.save();c.translate(x,y);c.scale(size,size);ellipse(0,4,13,10,'#1d394144');rect(-7,-9,14,19,'#e77749',3,'#24373a');ellipse(0,-15,9,9,'#f4c397','#263a41',2);rect(-11,-24,22,8,'#ebcf55',2);rect(-7,-29,14,9,'#efd778',3);line([[-5,10],[-8,20]],'#243c4a',4);line([[5,10],[8,20]],'#243c4a',4);c.restore();}
  return {foot,cog,shine,flag,worker};
}

export function paintRatchet(g,s,reduced){
  const {c,rect,line,ellipse,path,text}=g,{foot,cog,flag,worker}=hardBrushes(g,s),cam=s.camera||0;
  for(let i=0;i<13;i++){const x=i*140-cam*.35%140;rect(x,82,48,475,'#394b4330',1);for(let y=106;y<550;y+=55){line([[x,y],[x+48,y+35]],'#39534b44',3);}}
  for(const [i,n]of s.nodes.entries()){const x=n.x-cam;if(x< -100||x>1060)continue;line([[x,60],[x,n.y-63]],'#34443e',5);for(let y=70;y<n.y-64;y+=24)ellipse(x,y,6,10,null,'#f0c777',2);cog(x,n.y,56,reduced?0:s.time*(i%2?-1:1)*.3,i<=s.node?'#354e51':'#a69c75');ellipse(x,n.y,37,37,'#eee0bc','#374e4b',4);for(let j=0;j<4;j++){const a=j*Math.PI/2;line([[x+Math.cos(a)*18,n.y+Math.sin(a)*18],[x+Math.cos(a)*41,n.y+Math.sin(a)*41]],'#928957',5);}text(String(i+1).padStart(2,'0'),x,n.y,18,'#374b48','center');
    if(i===s.node+1){ellipse(x,n.y,s.catchRadius,s.catchRadius,null,'#f15f37',4);ellipse(x,n.y,s.catchRadius+7,s.catchRadius+7,null,'#fff4cf',2);flag(x+68,n.y-24);}if(i===s.goal)rect(x-44,n.y+76,88,16,'#d26341',1);
  }
  const x=s.player.x-cam,y=s.player.y;if(s.mode==='orbit'){const n=s.nodes[s.node];line([[n.x-cam,n.y],[x,y]],'#263f46',5);ellipse(x,y,12,12,'#f5e2ae','#263f46',2);const vx=-Math.sin(s.angle),vy=Math.cos(s.angle);line([[x+vx*18,y+vy*18],[x+vx*42,y+vy*42]],'#c95137',3);path([[x+vx*46,y+vy*46],[x+vx*36-vy*6,y+vy*36+vx*6],[x+vx*36+vy*6,y+vy*36-vx*6]],'#c95137');}
  if(!reduced&&s.trail.length>1)line(s.trail.map(p=>[p.x-cam,p.y]),'#d97b5144',4);worker(x,y-2,.7);foot(`连续借力 ${s.progress} / ${s.goal}`,s.mode==='flight'?'已脱钩 · 无法修正':'单击脱钩');
}

export function paintHex(g,s,reduced){
  const {c,rect,line,ellipse,path,text}=g,{foot}=hardBrushes(g,s),cx=480,cy=320;
  for(let j=0;j<6;j++){const a=j*Math.PI/3;path([[cx,cy],[cx+Math.cos(a)*480,cy+Math.sin(a)*480],[cx+Math.cos(a+Math.PI/3)*480,cy+Math.sin(a+Math.PI/3)*480]],j%2?'#34282c':'#29272e');}
  for(const r of s.rings){const radius=82+(r.at-s.time)*160;if(radius<40||radius>460)continue;c.beginPath();c.arc(cx,cy,radius,r.gap+s.gapWidth/2,r.gap+Math.PI*2-s.gapWidth/2);c.strokeStyle=r.done?'#636667':'#e9554b';c.lineWidth=21;c.stroke();c.beginPath();c.arc(cx,cy,radius+9,r.gap+s.gapWidth/2,r.gap+Math.PI*2-s.gapWidth/2);c.strokeStyle='#ffb58a';c.lineWidth=2;c.stroke();for(const a of [r.gap-s.gapWidth/2,r.gap+s.gapWidth/2])line([[cx+Math.cos(a)*(radius-15),cy+Math.sin(a)*(radius-15)],[cx+Math.cos(a)*(radius+15),cy+Math.sin(a)*(radius+15)]],'#fff1c6',3);}
  path(Array.from({length:6},(_,i)=>[cx+Math.cos(i*Math.PI/3)*39,cy+Math.sin(i*Math.PI/3)*39]),'#dcdac6','#ffc096',3);text(s.progress,cx,cy,23,'#2c282c','center');ellipse(cx,cy,82,82,null,'#958b8255',2);
  c.save();c.translate(cx+Math.cos(s.angle)*82,cy+Math.sin(s.angle)*82);c.rotate(s.angle+Math.PI/2);path([[0,-13],[-9,9],[9,9]],'#fff9cf','#e9c67f',2);c.restore();foot(`${s.progress} / ${s.goal} 层`,s.held?'逆时针 ↶':'顺时针 ↷',true);
}

export function paintShaft(g,s,reduced){
  const {c,rect,line,ellipse,path,text}=g,{foot}=hardBrushes(g,s),cam=s.camera;
  rect(148,60,664,512,'#111c26');for(let y=-cam%60+60;y<576;y+=60)for(let side=0;side<2;side++){const x=side?814:67;rect(x,y,78,55,side?'#344b5e':'#34485a',1);rect(x+4,y+5,66,4,'#506b79');rect(x+(Math.floor(y/60)%2?10:43),y+15,21,26,'#263b4b');}
  for(const gate of s.gates){const y=gate.y-cam;if(y<55||y>570)continue;const x=gate.x??gate.center,a=x-s.opening/2,b=x+s.opening/2;rect(150,y-11,a-150,23,'#e5c453');rect(b,y-11,810-b,23,'#e5c453');for(let xx=160;xx<a-10;xx+=20)path([[xx,y-11],[xx+9,y-22],[xx+18,y-11]],'#e77a63');for(let xx=b+5;xx<790;xx+=20)path([[xx,y-11],[xx+9,y-22],[xx+18,y-11]],'#e77a63');line([[a,y-23],[a,y+23]],'#85e7bf',3);line([[b,y-23],[b,y+23]],'#85e7bf',3);text(String(gate.id+1).padStart(2,'0'),104,y,16,'#f5ddb5','center');}
  const x=s.player.x,y=s.player.y-cam;rect(x-10,y-10,20,23,'#f3ead7',2);rect(x-8,y-8,16,8,'#334f63',1);rect(x-14,y-3,5,12,'#dc855c');rect(x+9,y-3,5,12,'#dc855c');rect(x-12,y+10,10,8,'#e4c84d',1);rect(x+2,y+10,10,8,'#e4c84d',1);line([[x-6,y-15],[x-6,y-21]],'#f4e0a2',2);if(!reduced&&s.time-s.brakeAt<.22)for(const dx of [-8,8])path([[x+dx-5,y+17],[x+dx,y+41],[x+dx+5,y+17]],'#6ce8b7');
  for(let i=0;i<3;i++)rect(866,212+i*33,29,24,i<s.fuel?'#83dfb5':'#334553',2,'#728d8e');text('燃料',881,180,17,'#c7dfcf','center');foot(`穿越 ${s.progress} / ${s.goal}`,`缺口 ${s.opening}px`,true);
}

export function paintMagnet(g,s,reduced){
  const {c,rect,line,ellipse,path,text}=g,{foot,shine}=hardBrushes(g,s),points=s.path.map(p=>[p.x,p.y]);
  c.save();c.lineJoin='round';line(points,'#395e61',s.halfWidth*2+12);line(points,'#83bfb4',s.halfWidth*2+6);line(points,'#e8f5eb',s.halfWidth*2-2);c.restore();
  for(let i=1;i<s.path.length;i++){const n=s.path[i];ellipse(n.x,n.y,18,18,null,i<=s.progress?'#3aa18b':'#e89e79',3);if(i>s.progress)text(i,n.x,n.y,13,'#81978f','center');}
  if(!reduced&&s.trail.length>1)line(s.trail.map(p=>[p.x,p.y]),'#65b19c60',3);
  const b=s.player;ellipse(b.x+3,b.y+4,10,8,'#38616250');ellipse(b.x,b.y,8,8,'#4d7682','#1e4653',2);ellipse(b.x-2,b.y-3,3,3,'#dff6ed');
  const m=s.target;c.save();c.translate(m.x,m.y);c.setLineDash([3,8]);line([[0,0],[b.x-m.x,b.y-m.y]],'#ca7c6488',1);c.setLineDash([]);path([[-15,-27],[-15,-42],[15,-42],[15,-27],[6,-27],[6,-33],[-6,-33],[-6,-27]],'#db7863','#486465',2);rect(-15,-28,9,8,'#eff1e8',1);rect(6,-28,9,8,'#eff1e8',1);c.restore();shine(s.path.at(-1).x,s.path.at(-1).y,32,'#60a58b');foot(`检查环 ${s.progress} / ${s.goal}`,`管腔 ${s.halfWidth*2}px`);
}

export function paintDojo(g,s,reduced){
  const {c,rect,line,ellipse,path,text}=g,{foot}=hardBrushes(g,s),n=s.duels[s.cursor],cut=s.time-s.cutAt<.28;
  function fighter(x,flip,enemy){c.save();c.translate(x,445);c.scale(flip,1);ellipse(0,16,68,12,'#22384225');path([[-24,-110],[25,-104],[49,-38],[18,-16],[-44,-28]],enemy?'#4b5661':'#263942');ellipse(1,-139,22,24,'#e4c7a2','#263942',3);path([[-23,-150],[15,-165],[31,-143],[10,-131],[-24,-138]],'#253744');line([[-4,-21],[-39,10]],'#243942',14);line([[15,-20],[49,7]],'#243942',13);line([[4,-97],[40,-76]],'#d5b58f',12);const arm=cut?(enemy?-1:1):0;line([[35,-80],[70,-84-arm*52]],'#243942',9);line([[68,-84-arm*52],[153,-121-arm*63]],'#eee7cb',6);line([[66,-91-arm*52],[73,-75-arm*52]],'#d6a66c',7);c.restore();}
  fighter(288,1,false);fighter(680,-1,true);line([[90,465],[870,465]],'#4b5652',4);line([[140,470],[810,477]],'#7f8a7955',2);
  const red=s.signal==='strike',blue=s.signal==='feint';ellipse(480,209,65,65,red?'#c7343e':blue?'#497995':'#e5dcc6');text(red?'斩':blue?'静':'待',480,207,54,red||blue?'#fff3d5':'#8e9686','center');
  if(n){const approach=Math.max(0,Math.min(1,(n.at-s.time)/.8));ellipse(480,209,70+approach*42,70+approach*42,null,red?'#c73e44':'#627c7860',2);}
  if(cut&&!reduced){line([[300,245],[674,407]],'#f5efcc',16);line([[280,235],[690,415]],'#bf3744',3);path([[593,244],[630,250],[683,287],[646,272]],'#d5634c');}
  for(let i=0;i<s.goal;i++)rect(251+i*(458/s.goal),527,Math.min(25,380/s.goal),7,i<s.progress?'#c63c46':'#abb5a3',1);foot(`无伤 ${s.progress} / ${s.goal}`,`出刀窗口 ${Math.round(s.window*1000)}ms`);
}

export function paintRotor(g,s,reduced){
  const {c,rect,line,ellipse,path,text}=g,{foot}=hardBrushes(g,s),points=s.path.map(p=>[p.x,p.y]);
  line(points,'#163a58',s.halfWidth*2+9);for(const n of s.path)ellipse(n.x,n.y,s.pocket+5,s.pocket+5,'#163a58');line(points,'#b4d8dc',s.halfWidth*2);for(const n of s.path)ellipse(n.x,n.y,s.pocket,s.pocket,'#b4d8dc');
  c.save();c.setLineDash([6,10]);line(points,'#507d92',2);for(const n of s.path)ellipse(n.x,n.y,s.pocket-7,s.pocket-7,null,'#799fab',1);c.restore();for(const [i,n]of s.path.entries())text(i===s.goal?'OUT':i+1,n.x,n.y,16,i<=s.progress?'#388474':'#527e8a','center');
  const b=s.player;c.save();c.translate(b.x,b.y);c.rotate(s.angle);rect(-54,-8,108,16,'#233f50',3);rect(-51,-6,102,12,'#e8cb52',2);for(let x=-41;x<50;x+=18)line([[x,-5],[x+8,5]],'#a67d35',3);for(const x of [-51,51]){ellipse(x,0,8,8,'#e97962','#243e55',2);ellipse(x,0,3,3,'#ffeac4');}ellipse(0,0,12,12,'#f3edc5','#466b7a',2);line([[-6,0],[6,0]],'#547e8a',2);c.restore();
  ellipse(s.target.x,s.target.y,5,5,null,'#c45447',2);foot(`转运 ${s.progress} / ${s.goal}`,`窄道 ${s.halfWidth*2}px`);
}

export function paintKnight(g,s,reduced){
  const {c,rect,line,ellipse,path,text}=g,{foot,flag}=hardBrushes(g,s),xy=i=>({x:306+i%5*87,y:150+Math.floor(i/5)*87});
  for(const i of s.tiles){const {x,y}=xy(i),gone=s.visited.includes(i)&&i!==s.player;if(gone){ellipse(x,y+17,29,9,'#334b5825');if(!reduced)for(let j=0;j<3;j++)rect(x-14+j*13,y+19+j*5,5,5,'#8b9487',1);continue;}path([[x-33,y-15],[x+35,y-15],[x+35,y+34],[x-33,y+34]],'#5e7480','#304953',2);rect(x-34,y-30,69,58,s.legal.includes(i)?'#dfd6a0':'#e1e3cd',1,'#425b67');line([[x-29,y-21],[x+28,y-21]],'#faf5d7',3);if(s.legal.includes(i)){rect(x-30,y-26,61,49,'#e7daa6',1,'#4a96a3');ellipse(x,y,5,5,'#609cac');}if(i===s.exit)flag(x+7,y-8);}
  const p=xy(s.player);c.save();c.translate(p.x,p.y);ellipse(0,14,24,8,'#2d445f30');path([[-19,17],[-12,-4],[-15,-17],[-8,-30],[9,-34],[20,-15],[10,-9],[11,16]],'#447897','#273d55',3);line([[-8,-23],[12,-20]],'#c3d5d4',3);rect(4,-19,14,6,'#233b52',1);rect(-23,17,45,9,'#2f4c65',2);c.restore();
  foot(`孤岛 ${s.progress} / ${s.goal}`,'只能走一次 · 旗帜最后到');
}

export function paintPolarity(g,s,reduced){
  const {c,rect,line,ellipse,path,text}=g,{foot}=hardBrushes(g,s),xy=i=>({x:336+i%4*96,y:180+Math.floor(i/4)*96});
  rect(258,102,444,448,'#252b39',7,'#836879');for(let i=0;i<16;i++)for(let j=i+1;j<16;j++)if((s.masks[i]>>j&1)||(s.masks[j]>>i&1)){const a=xy(i),b=xy(j);line([[a.x,a.y],[b.x,b.y]],'#907b90',3);}
  for(let i=0;i<16;i++){const {x,y}=xy(i),on=s.state>>i&1;path([[x-29,y-33],[x+23,y-33],[x+34,y-19],[x+34,y+27],[x+20,y+35],[x-32,y+35],[x-35,y-21]],on?'#d87ba5':'#303e4a','#bd98a3',2);path([[x-29,y-28],[x+10,y-28],[x-5,y+30],[x-28,y+30]],on?'#f2bbad':'#4a5663');ellipse(x+3,y,11,11,on?'#f5d980':'#1b2939','#a07c89',2);if(on)ellipse(x+3,y,4,4,'#fff4b2');}
  text(s.stage===0?'＋':s.stage===1?'×':'＋ ×',144,303,42,'#edc96e','center');text('联动',144,351,17,'#bfa7b0','center');text(String(s.moves).padStart(2,'0'),810,306,50,'#efc679','center');text('剩余',810,355,17,'#bfa7b0','center');foot(`已熄灭 ${s.progress} / 16`,'一格翻转，整片联动',true);
}

export function paintDiscs(g,s,reduced){
  const {c,rect,line,ellipse,path,text}=g,{foot,cog}=hardBrushes(g,s);
  rect(114,99,732,443,'#242b39',5,'#bb668d');for(let x=138;x<835;x+=39)line([[x,107],[x,533]],'#4a3a4e',1);for(let y=107;y<540;y+=39)line([[125,y],[835,y]],'#4a3a4e',1);for(const x of [129,823])for(let y=122;y<530;y+=34)line([[x,y],[x+8,y+16]],'#daa750',5);
  const key=s.keys[s.progress];if(key){ellipse(key.x,key.y,25,25,null,'#e5bd5866',2);ellipse(key.x-5,key.y-5,8,8,null,'#e8cd6b',5);line([[key.x+1,key.y+1],[key.x+13,key.y+13]],'#e8cd6b',5);line([[key.x+10,key.y+8],[key.x+16,key.y+3]],'#e8cd6b',4);}
  for(const [i,d]of s.discs.entries()){ellipse(d.x+4,d.y+7,23,19,'#0e162980');cog(d.x,d.y,24,reduced?0:s.time*(i%2?5:-5),'#d5c5c3',10);ellipse(d.x,d.y,10,10,'#b24f79','#edf0ca',2);ellipse(d.x,d.y,3,3,'#e8c971');}
  const p=s.player;ellipse(p.x+2,p.y+6,14,8,'#050c1980');rect(p.x-9,p.y-10,18,24,'#f0e6c7',5,'#829dae');rect(p.x-7,p.y-7,14,9,'#386982',3);line([[p.x-6,p.y+14],[p.x-9,p.y+20]],'#d6e2d7',4);line([[p.x+6,p.y+14],[p.x+9,p.y+20]],'#d6e2d7',4);foot(`钥匙 ${s.progress} / ${s.goal}`,`${s.discs.length} 枚刀盘 · 一击结束`,true);
}

export function paintEcho(g,s,reduced){
  const {c,rect,line,ellipse,path,text}=g,{foot,cog}=hardBrushes(g,s),colors=['#e8ad63','#c95b65','#7db9b1','#8ba261','#ca8273','#ccaf69','#a896ba','#689cbd','#c99c6a'];
  rect(244,114,472,418,'#e0c29a',12,'#5d7068');rect(256,125,448,395,'#344b4b',6);for(let i=0;i<9;i++){const x=354+i%3*126,y=201+Math.floor(i/3)*126,on=s.lit===i,hit=s.mode==='recall'&&s.entered.at(-1)===i;rect(x-50,y-45,100,95,'#112f3755',8);rect(x-48,y-49,96,94,on?'#fff0ba':hit?'#a6cdaa':colors[i],7,'#253d43');rect(x-40,y-40,80,8,on?'#ffffff':'#ffe5b666',2);text(i+1,x,y,32,on?'#745738':'#2c474d','center');}
  for(const x of [152,808]){ellipse(x,275,53,53,'#c9b696','#345457',4);cog(x,275,33,reduced?0:(s.mode==='show'?s.time:-s.time),'#5f7f7b',6);ellipse(x,275,7,7,'#e3ca9b');}
  line([[151,327],[188,436],[243,452]],'#c3a36a',4);line([[809,327],[772,436],[718,452]],'#c3a36a',4);text(s.mode==='show'?'▶':'◀◀',480,86,24,'#ebcf99','center');
  for(let i=0;i<s.goal;i++)rect(333+i*(300/s.goal),547,Math.min(22,220/s.goal),7,i<s.progress?'#86c3a7':'#6f7b73',1);foot(s.mode==='show'?'记住顺序':'从最后一拍开始',`倒带 ${s.progress} / ${s.goal}`,true);
}

export const HARDCORE_PAINTERS={'ratchet-vault':paintRatchet,'hex-panic':paintHex,'downshaft':paintShaft,'magnet-suture':paintMagnet,'flash-dojo':paintDojo,'rotor-courier':paintRotor,'knight-fall':paintKnight,'polarity-lock':paintPolarity,'disc-vault':paintDiscs,'echo-rewind':paintEcho};
