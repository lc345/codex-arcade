export function centuryBrushes(g,s){
  const {c,rect,ellipse,path,line,text}=g;
  const palette=['#e57566','#6baec8','#edc45c','#80b89d','#b386ba','#d5ab70'];
  function footer(a,b,color='#f6f0d6'){text(a,34,601,21,color);text(b,926,601,19,color,'right');text(`${Math.max(0,Math.ceil(s.limit-s.time))}s`,480,601,17,s.limit-s.time<=10?'#ffb995':color,'center');}
  function gem(x,y,r,color){path([[x,y-r],[x+r*.85,y-r*.15],[x+r*.6,y+r*.7],[x,y+r],[x-r*.85,y+r*.2],[x-r*.6,y-r*.65]],color,'#f6e4b7',2);path([[x,y-r],[x,y],[x-r*.6,y-r*.65]],'#fff7');path([[x,y],[x+r*.85,y-r*.15],[x+r*.6,y+r*.7],[x,y+r]],'#082c5140');}
  function seal(shape,x,y,r,color){c.save();c.translate(x,y);if(shape===0)ellipse(0,0,r,r,color);if(shape===1)path([[0,-r],[r,r],[-r,r]],color);if(shape===2)rect(-r,-r,r*2,r*2,color,2);if(shape===3)path([[0,-r],[r,0],[0,r],[-r,0]],color);if(shape===4){rect(-r*.3,-r,r*.6,r*2,color,2);rect(-r,-r*.3,r*2,r*.6,color,2);}c.restore();}
  function item(shape,variant,x,y,color,shadow=false){c.save();c.translate(x,y);const ink=shadow?color:'#304657';if(shape===0){for(const side of variant===2?[-1,1]:[variant===0?-1:1]){ellipse(side*25,-2,11,14,null,ink,6);if(!shadow)ellipse(side*25,-2,11,14,null,color,3);}rect(-21,-23,42,47,color,5,shadow?undefined:ink);if(!shadow){line([[-13,-17],[-13,11]],'#fff9',4);ellipse(0,-21,18,4,'#315266');}}
    if(shape===1){ellipse(-17,-9,16,16,null,ink,7);line([[-4,-3],[31,26]],ink,9);for(let i=0;i<2+variant;i++)line([[10+i*6,7+i*5],[4+i*6,16+i*5]],ink,6);if(!shadow){ellipse(-17,-9,16,16,null,color,4);line([[-4,-3],[31,26]],color,5);}}
    if(shape===2){const n=6+variant;path(Array.from({length:n*4},(_,i)=>{const a=i*Math.PI*2/(n*4),r=i%4<2?30:23;return [Math.cos(a)*r,Math.sin(a)*r];}),color,shadow?undefined:ink,2);ellipse(0,0,9,9,shadow?'#a9bbc0':'#edf2dd',ink,shadow?0:2);}
    if(shape===3){path([[-32,0],[-24,-19],[0,-34],[24,-19],[32,0]],color,shadow?undefined:ink,2);line([[0,-5],[0,29]],ink,5);if(variant<2){const side=variant?1:-1;line([[0,29],[side*11,34],[side*15,24]],ink,5);}if(!shadow)line([[0,-30],[0,-5]],'#fff8',2);}
    c.restore();
  }
  return {palette,footer,gem,seal,item};
}

export function paintChromatic(g,s,reduced){
  const {c,rect,ellipse,line,path,text,meter}=g,{footer}=centuryBrushes(g,s),colors=[[236,100,93],[111,208,210],[243,213,101]],color=ratios=>`rgb(${[0,1,2].map(j=>Math.round(ratios.reduce((v,n,i)=>v+n*colors[i][j],0))).join(',')})`;
  for(let i=0;i<3;i++){const x=280+i*200,fill=`rgb(${colors[i]})`;rect(x-48,83,96,144,'#b5d6d650',13,'#567b83');rect(x-39,100,78,104,fill,8);line([[x-31,111],[x-31,191]],'#fff9',5);rect(x-16,228,32,40,'#698c93',3);ellipse(x,175,29,29,'#f0f3de','#486d75',3);line([[x-19,175],[x+19,175]],fill,8);line([[x,156],[x,194]],fill,8);ellipse(x,175,7,7,'#43656c');text(`${Math.round(s.amounts[i])}`,x,290,19,'#2d5763','center');if(s.valve===i){path([[x-8,268],[x+8,268],[480+8,352],[480-8,352]],fill);if(!reduced)for(let j=0;j<6;j++)ellipse(x+(480-x)*((s.time*2+j/6)%1),268+84*((s.time*2+j/6)%1),3,7,'#fff6');}}
  const total=Math.max(1,s.total),mix=color(s.amounts.map(v=>v/total)),h=155*s.total/100;ellipse(480,524,105,15,'#6c989b40');path([[390,336],[400,507],[560,507],[570,336]],'#d9f2ef50','#49757f',3);if(s.total>0){path([[400,506-h],[560,506-h],[556,504],[404,504]],mix);ellipse(480,506-h,80,9,mix,'#fff7',1);}for(let i=0;i<5;i++){line([[401,475-i*27],[421,475-i*27]],'#49757f',2);text(20+i*20,434,475-i*27,12,'#49757f');}line([[407,344],[416,494]],'#fff9',4);
  rect(689,354,106,133,'#365963',5);rect(698,363,88,113,color(s.target),2);text('样品',742,514,19,'#345e68','center');footer(`${Math.floor(s.total)} / 100 ml`,`比例容差 ±${Math.round(s.tolerance*100)}`);
}

export function paintLoop(g,s,reduced){
  const {c,rect,ellipse,line,path,text,meter}=g,{footer,gem,palette}=centuryBrushes(g,s);
  for(const o of s.objects){if(o.taken)continue;ellipse(o.x+3,o.y+14,25,9,'#001b2080');if(o.kind==='gem'){gem(o.x,o.y,21,palette[o.id]);if(!reduced){const a=s.time*1.4+o.id;line([[o.x+Math.cos(a)*27-3,o.y+Math.sin(a)*25],[o.x+Math.cos(a)*27+3,o.y+Math.sin(a)*25]],'#edecb5',1);}}else{path(Array.from({length:16},(_,i)=>{const a=i*Math.PI/8,r=i%2?17:26;return [o.x+Math.cos(a)*r,o.y+Math.sin(a)*r];}),'#162126','#d46f79',2);line([[o.x-7,o.y-7],[o.x+7,o.y+7]],'#f29193',3);line([[o.x+7,o.y-7],[o.x-7,o.y+7]],'#f29193',3);}}
  if(s.stroke.length>1){c.save();c.setLineDash([3,3]);line(s.stroke.map(p=>[p.x,p.y]),s.spent>s.ink?'#fa8c8d':'#f7dc99',4);c.restore();ellipse(s.stroke[0].x,s.stroke[0].y,11,11,null,'#e7dba5',2);}
  rect(327,72,307,30,'#183a33df',4);meter(344,86,272,1-s.spent/s.ink,s.spent>s.ink?'#dd6767':'#edc877','#071d20');footer(`宝石 ${s.progress} / ${s.goal}`,`剩余 ${s.loops} 圈`);
}

export function paintInk(g,s,reduced){
  const {c,rect,ellipse,line,path,text,meter}=g,{footer}=centuryBrushes(g,s);
  for(const [x,y,w]of [[70,320,110],[770,430,120]]){rect(x,y,w,12,'#355560',2);for(let j=x+8;j<x+w;j+=22)line([[j,y+12],[j-14,570]],'#657e7455',7);line([[x,y-3],[x+w,y-3]],'#eff4d9',3);}
  for(const r of s.rocks){path([[r.x-r.w/2,r.y-r.h/2],[r.x+r.w*.35,r.y-r.h/2],[r.x+r.w/2,r.y+r.h*.15],[r.x+r.w*.25,r.y+r.h/2],[r.x-r.w*.4,r.y+r.h/2]],'#637b7a','#355c64',3);line([[r.x-r.w*.28,r.y-r.h*.3],[r.x+r.w*.15,r.y+r.h*.28]],'#afc1ab',3);}
  const points=s.mode==='draw'?s.stroke:s.rail;if(points.length>1){line(points.map(p=>[p.x,p.y]),'#f5ebc1',11);line(points.map(p=>[p.x,p.y]),'#274d61',5);for(const p of points)ellipse(p.x,p.y,3,3,'#eebd6c');}
  for(const t of s.tickets){if(t.taken)continue;c.save();c.translate(t.x,t.y);c.rotate(-.1);rect(-17,-12,34,24,'#ecc45d',3,'#80594b');line([[-10,-7],[-10,7]],'#7e694d',1);text('票',4,0,15,'#4c5f55','center');c.restore();}
  const a=s.cart;ellipse(a.x+4,a.y+16,26,7,'#284e5b55');c.save();c.translate(a.x,a.y);rect(-18,-18,37,25,'#da7157',5,'#36576a');rect(-13,-14,11,11,'#d5ecdd',2);rect(2,-14,11,11,'#d5ecdd',2);rect(-22,-21,45,6,'#315e70',3);for(const x of [-11,12]){ellipse(x,11,8,8,'#365065','#f1d284',2);if(!reduced)line([[x+Math.cos(a.angle)*5,11+Math.sin(a.angle)*5],[x-Math.cos(a.angle)*5,11-Math.sin(a.angle)*5]],'#f1d284',2);}c.restore();
  if(s.mode==='draw'){ellipse(170,320,23,15,null,'#d66b4c',3);ellipse(795,430,25,15,null,'#d66b4c',3);}rect(0,570,960,70,'#335e65ee');footer(`车票 ${s.progress} / ${s.goal}`,s.mode==='draw'?`墨量 ${Math.max(0,Math.round(s.ink-s.spent))}`:'下一站，到达');
}

export function paintSoda(g,s,reduced){
  const {c,rect,ellipse,line,path,text}=g,{palette,footer}=centuryBrushes(g,s),colors=[palette[0],palette[1],palette[2],palette[4]];
  for(let i=0;i<30;i++){const v=s.board[i];if(v<0)continue;const x=320+i%6*64,y=184+Math.floor(i/6)*72;ellipse(x+2,y+5,27,27,'#164e6735');const sh=c.createRadialGradient(x-10,y-12,1,x,y,27);sh.addColorStop(0,'#fff6e2');sh.addColorStop(.23,colors[v]);sh.addColorStop(1,['#ab3d5e','#327d9a','#cc8c36','#715385'][v]);ellipse(x,y,27,27,sh,'#ffffffaa',2);ellipse(x-8,y-10,8,5,'#fff9');if(v===0)path([[x,y-5],[x+7,y+5],[x-7,y+5]],'#fff9');if(v===1)line([[x-6,y],[x+6,y]],'#fff9',3);if(v===2)ellipse(x,y+1,4,4,'#fff9');}
  if(!reduced&&s.popAt!==undefined&&s.time-s.popAt<.3){c.save();c.globalAlpha=1-(s.time-s.popAt)/.3;for(const i of s.popped)ellipse(320+i%6*64,184+Math.floor(i/6)*72,27+(s.time-s.popAt)*70,27+(s.time-s.popAt)*70,null,'#fff',2);c.restore();}
  footer(`已清 ${s.progress} / ${s.goal}`,`剩余 ${s.moves} 步`);
}

export function paintLeaks(g,s,reduced){
  const {c,rect,ellipse,line,path,text,meter}=g,{footer}=centuryBrushes(g,s);
  for(const y of [235,415]){line([[235,y],[725,y]],'#263e50',27);line([[235,y-2],[725,y-2]],'#b1b9a0',20);line([[240,y-6],[720,y-6]],'#e8c58a',4);}line([[480,176],[480,473]],'#324e5c',24);line([[477,176],[477,473]],'#aaae8c',17);
  for(const [i,v]of s.valves.entries()){ellipse(v.x+3,v.y+6,29,29,'#172d4170');ellipse(v.x,v.y,27,27,v.leaking?'#d96b56':'#538e85','#244852',3);ellipse(v.x,v.y,19,19,null,'#ecbb6c',4);for(let j=0;j<3;j++){const a=j*Math.PI*2/3+(s.repairing===i&&!reduced?s.time*7:0);line([[v.x,v.y],[v.x+Math.cos(a)*18,v.y+Math.sin(a)*18]],'#ecc682',4);}ellipse(v.x,v.y,6,6,'#315967');if(v.leaking){path([[v.x+10,v.y+9],[v.x+47,v.y+41],[v.x+18,v.y+80],[v.x+6,v.y+20]],'#b9f5f4bb');if(!reduced)for(let j=0;j<6;j++){const t=(s.time*2+j/6)%1;ellipse(v.x+15+t*28,v.y+30+t*70,3,6,'#c6fcff');}meter(v.x-34,v.y-47,68,v.repair,'#9df0c8','#172f45');}}
  const surface=566-s.water*3.45;c.save();c.globalAlpha=.7;path([[0,surface],...Array.from({length:25},(_,i)=>[i*40,surface+(reduced?0:Math.sin(i+s.time*3)*4)]),[960,570],[0,570]],'#278bafd0');c.restore();rect(778,115,39,371,'#193e5480',4);rect(787,478-s.water*3.5,21,s.water*3.5,'#8be4e1',2);line([[779,128],[816,128]],'#ef8769',4);rect(0,571,960,69,'#163d52ed');footer(`修好 ${s.progress} / ${s.goal}`,`水位 ${Math.round(s.water)}%`);
}

export function paintQuarter(g,s,reduced){
  const {c,rect,ellipse,path,line,text}=g,{palette,seal,footer}=centuryBrushes(g,s);
  function tile(value,x,y,size){rect(x+2,y+3,size-3,size-3,'#39484b40',3);rect(x,y,size-4,size-4,palette[value%6],3,'#edf1d2');seal(value%5,x+size*.47,y+size*.43,size*.21,value<5?'#f8edc9':'#274b5c');text(value+1,x+size*.78,y+size*.76,size*.19,value<5?'#374d59':'#faf0d2','center');}
  const rotating=s.phase==='playing'&&s.lastTurn&&!reduced&&s.time-s.lastTurn.at<.23,board=rotating?s.lastTurn.before:s.board,q=s.lastTurn?.q,ids=rotating?[Math.floor(q/2)*3+q%2,Math.floor(q/2)*3+q%2+1,Math.floor(q/2)*3+q%2+3,Math.floor(q/2)*3+q%2+4]:[];
  for(let i=0;i<9;i++)if(!ids.includes(i))tile(board[i],310+i%3*90,175+Math.floor(i/3)*90,90);
  if(rotating){const x=400+q%2*90,y=265+Math.floor(q/2)*90;c.save();c.translate(x,y);c.rotate(Math.min(1,(s.time-s.lastTurn.at)/.23)*Math.PI/2);c.translate(-x,-y);for(const i of ids)tile(board[i],310+i%3*90,175+Math.floor(i/3)*90,90);c.restore();}
  for(let i=0;i<9;i++)tile(i,705+i%3*45,212+Math.floor(i/3)*45,45);text('原图',770,372,19,'#385267','center');for(const [x,y]of [[400,265],[490,265],[400,355],[490,355]]){ellipse(x,y,18,18,'#faf6dd','#3d565b',2);text('↻',x,y-1,24,'#294c59','center');}footer(`归位 ${s.board.filter((v,i)=>v===i).length} / 9`,`剩余 ${s.moves} 转`);
}

export function paintStamps(g,s,reduced){
  const {c,rect,ellipse,line,path,text,meter}=g,{palette,seal,footer}=centuryBrushes(g,s),n=s.sample.length;
  rect(262,77,436,91,'#fff5de',3,'#508a8c');text('样本',281,94,14,'#3d6a72');for(let i=0;i<n;i++)seal(s.sample[i],480+(i-(n-1)/2)*77,130,21,palette[s.sample[i]]);
  c.save();c.translate(480,304);c.rotate(reduced?0:Math.sin(s.sheet*2.3)*.023);rect(-205,-100,414,229,'#163a4b25',3);rect(-211,-106,414,229,'#fff9e4',3,'#548486');rect(-190,-87,94,9,'#76b1b0',1);for(let j=0;j<3;j++)line([[-187,-59+j*12],[-35+j*32,-59+j*12]],'#547d8150',2);text(String(s.sheet+1).padStart(3,'0'),166,-76,23,'#3b6d7b','right');line([[-187,-15],[184,-15]],'#549998',2);for(let i=0;i<n;i++)seal(s.seals[i],(i-(n-1)/2)*78,53,24,palette[s.seals[i]]);c.restore();
  meter(293,444,375,Math.max(0,(s.deadline-s.time)/[3.1,2.5,2.05][s.stage]),'#dc7471','#28556130');for(const [x,color]of [[310,'#d75960'],[650,'#348e7c']]){ellipse(x,499,57,36,'#22475955');ellipse(x,492,57,36,color,'#f4e8bf',3);if(x<480){line([[x-13,481],[x+13,503]],'#fff0d3',5);line([[x+13,481],[x-13,503]],'#fff0d3',5);}else path([[x-17,492],[x-4,504],[x+19,480]],null,'#fff0d3',5);}if(s.mark&&!reduced&&s.time-s.mark.at<.22){text(s.mark.correct?'通过':'有误',480,532,21,s.mark.correct?'#287769':'#ba4650','center');}footer(`正确 ${s.progress} / ${s.goal}`,`失误 ${s.errors} / 3`);
}

export function paintFridge(g,s,reduced){
  const {c,rect,ellipse,path,line,text}=g,{palette,footer}=centuryBrushes(g,s),w=s.cols*54,h=s.rows*54;
  rect(s.bx-25,s.by-42,w+50,h+88,'#6b9f93',12,'#356a68');rect(s.bx-14,s.by-13,w+28,h+28,'#e2ede2',5,'#50877d');for(let y=0;y<s.rows;y++)for(let x=0;x<s.cols;x++)rect(s.bx+x*54+1,s.by+y*54+1,52,52,'#b5d2c3',1,'#ecf2df');rect(s.bx+15,s.by-31,w-30,8,'#d7e8d5',4);line([[s.bx+w+17,s.by+12],[s.bx+w+17,s.by+75]],'#e7e3bc',6);
  if(s.drag){const b=s.pieces[s.drag.id],gx=Math.round((b.x-s.bx)/54),gy=Math.round((b.y-s.by)/54);c.save();c.globalAlpha=.4;for(const [x,y]of b.cells)if(x+gx>=0&&x+gx<s.cols&&y+gy>=0&&y+gy<s.rows)rect(s.bx+(gx+x)*54+2,s.by+(gy+y)*54+2,50,50,'#fff8b0',2);c.restore();}
  for(const b of s.pieces.slice().sort((a,b)=>Number(a.id===s.drag?.id)-Number(b.id===s.drag?.id))){for(const [i,[dx,dy]]of b.cells.entries()){const x=b.x+dx*54,y=b.y+dy*54;rect(x+4,y+6,50,49,'#325a5140',5);rect(x,y,52,52,palette[b.id],5,'#46665c');rect(x+5,y+5,42,39,'#fff2',3);if(b.id%3===0){ellipse(x+27,y+26,15,18,'#fff2c5','#8e8a56',1);ellipse(x+27,y+28,8,8,'#dfa84d');}if(b.id%3===1){path([[x+13,y+34],[x+17,y+15],[x+38,y+17],[x+42,y+35]],'#688f53','#e9de9d',2);line([[x+22,y+19],[x+20,y+32]],'#d1d187',2);}if(b.id%3===2){ellipse(x+26,y+28,17,13,'#dc7960','#ffe1a5',2);line([[x+12,y+29],[x+36,y+20]],'#f9c5a4',2);}if(i===0){rect(x+3,y+3,14,15,'#fff4d9',2);text(b.id+1,x+10,y+10,11,'#426755','center');}}}
  rect(0,578,960,62,'#346657ed');footer(`已装 ${s.progress} / ${s.goal}`,`${s.cols} × ${s.rows} 格`);
}

export function paintKnots(g,s,reduced){
  const {c,rect,ellipse,line,path,text}=g,{palette,footer}=centuryBrushes(g,s);
  for(const [i,[a,b]]of s.edges.entries()){const p=s.nodes[a],q=s.nodes[b];line([[p.x+2,p.y+4],[q.x+2,q.y+4]],'#0c0c1966',9);line([[p.x,p.y],[q.x,q.y]],palette[i%6],6);c.save();c.setLineDash([2,9]);line([[p.x,p.y],[q.x,q.y]],'#fff8',1.5);c.restore();}
  for(const p of s.crossings){ellipse(p.x,p.y,11,11,'#d85761','#ffc1a4',1);line([[p.x-4,p.y-4],[p.x+4,p.y+4]],'#fff1da',2);line([[p.x+4,p.y-4],[p.x-4,p.y+4]],'#fff1da',2);}
  for(const n of s.nodes){ellipse(n.x+3,n.y+5,22,22,'#06091280');ellipse(n.x,n.y,23,23,palette[n.id],'#eee0c6',3);ellipse(n.x,n.y,16,16,null,'#392f4940',1.5);text(String.fromCharCode(65+n.id),n.x,n.y,20,'#312e48','center');if(n.id===s.drag?.id)ellipse(n.x,n.y,29,29,null,'#ecddb3',2);}footer(`交叉 ${s.crossings.length} 处`,'把交叉都理顺');
}

export function paintShadows(g,s,reduced){
  const {c,rect,ellipse,line,path,text,meter}=g,{item,palette,footer}=centuryBrushes(g,s);
  for(const card of s.cards){rect(card.x-74+4,card.y-93+5,148,187,'#29456730',5);rect(card.x-74,card.y-93,148,187,'#f4f2de',5,'#597385');rect(card.x-68,card.y+8,136,79,'#a9bbc0',3);item(card.shape,card.variant,card.x,card.y-40,palette[card.id%6]);item(card.shape,card.shadowVariant,card.x,card.y+47,'#2c4057',true);line([[card.x-63,card.y+3],[card.x+63,card.y+3]],'#607e84',1);}
  meter(293,102,375,Math.max(0,(s.deadline-s.time)/[5.2,4.6,4][s.stage]),'#e26c65','#234b6520');footer(`找到 ${s.progress} / ${s.goal}`,`失误 ${s.errors} / 3`);
}

export const CENTURY_PAINTERS={'chromatic-lab':paintChromatic,'loop-lock':paintLoop,'ink-rail':paintInk,'soda-strata':paintSoda,'leak-patrol':paintLeaks,'quarter-turn':paintQuarter,'stamp-storm':paintStamps,'fridge-fit':paintFridge,'knot-office':paintKnots,'shadow-tell':paintShadows};
