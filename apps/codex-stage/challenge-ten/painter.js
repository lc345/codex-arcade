export function challengeBrushes(g){
  const {c,rect,ellipse,path,line,text,meter}=g;
  function footer(left,right,color='#f5ebd5'){text(left,36,600,22,color);text(right,924,600,19,color,'right');}
  function gear(x,y,r,angle,fill='#c7d4d3',ink='#273d45'){
    c.save();c.translate(x,y);c.rotate(angle);path(Array.from({length:32},(_,i)=>{const a=i*Math.PI/16,d=i%4<2?r:r*.77;return [Math.cos(a)*d,Math.sin(a)*d];}),fill,ink,2);ellipse(0,0,r*.37,r*.37,'#49616b',ink,2);ellipse(-r*.1,-r*.1,r*.1,r*.1,'#e4ecdd');c.restore();
  }
  function car(x,y,w,angle,color){
    c.save();c.translate(x,y);c.rotate(angle);rect(-w/2+3,-12,w,28,'#15272c50',4);for(const side of [-1,1])for(const dx of [-w*.3,w*.3])rect(dx-5,side*15-3,10,6,'#182e36',2);rect(-w/2,-13,w,26,color,4,'#1d3c45');rect(-w*.21,-10,w*.42,20,'#c5e4d9',3);rect(-w*.17,-8,w*.1,16,'#466b76',1);rect(w*.07,-8,w*.1,16,'#466b76',1);rect(w/2-5,-9,3,5,'#fff8c7',1);rect(w/2-5,4,3,5,'#fff8c7',1);line([[-w/2+6,-9],[-w*.26,-9]],'#fff7',2);c.restore();
  }
  function prism(x,y,r,angle=0,color='#a5e7e3'){
    c.save();c.translate(x,y);c.rotate(angle);path([[0,-r],[r*.74,-r*.2],[r*.5,r*.72],[0,r],[-r*.7,r*.35],[-r*.6,-r*.55]],color,'#e4fbff',1.5);path([[0,-r],[0,0],[-r*.6,-r*.55]],'#fff9');path([[0,0],[r*.74,-r*.2],[r*.5,r*.72],[0,r]],'#13577666');line([[0,-r],[0,0],[0,r]],'#ffffff70');c.restore();
  }
  return {footer,gear,car,prism};
}

export function paintCrosswalk(g,s,reduced){
  const {c,rect,ellipse,line,path,text}=g,{footer,car}=challengeBrushes(g);
  for(let row=0;row<=s.goal;row++){const y=520-row*420/s.goal,h=420/s.goal;if(row%2){rect(180,y-h*.44,600,h*.88,'#354c53');for(let x=205;x<760;x+=72)rect(x,y-1,32,2,'#f9da9755');}else{rect(180,y-h*.4,600,h*.8,'#93ac8d');for(let x=202;x<773;x+=38){rect(x,y-3,22,7,'#d3cbaa');line([[x,y+7],[x+22,y+7]],'#476658',1);}}}
  for(let i=0;i<12;i++)rect(192+i*47,89,23,15,i%2?'#ebcf86':'#244f53');
  for(const lane of s.lanes)for(const [i,vehicle] of lane.cars.entries())if(vehicle.x>145&&vehicle.x<813)car(vehicle.x,lane.y,vehicle.w,lane.speed>0?0:Math.PI,['#e97558','#d8bc61','#76b8bf'][(lane.row+i)%3]);
  const y=s.player.y,bob=s.jump&&!reduced?Math.sin(s.jump.t*Math.PI)*18:0;ellipse(480,y+9,15,6,'#172c4460');c.save();c.translate(480,y-bob);path([[-9,8],[-8,-9],[8,-9],[11,8]],'#efbd58','#263e46',2);ellipse(0,-14,9,9,'#efdfbb','#263e46',2);rect(-10,-22,20,6,'#316d77',2);line([[-5,8],[-6,13]],'#294651',4);line([[6,8],[7,13]],'#294651',4);c.restore();
  footer(`安全岛 ${s.progress} / ${s.goal}`,s.jump?'跨步中':'等一辆，还是现在过？');
}

export function paintDrill(g,s,reduced){
  const {c,rect,path,line,text}=g,{footer}=challengeBrushes(g),sy=y=>270+y-s.depth;
  c.save();c.beginPath();c.rect(192,58,576,500);c.clip();
  for(let i=0;i<23;i++){const y=74+i*29-(s.depth*.18%29);line([[210,y],[235,y+7],[724,y-8],[749,y]],'#321f2740',2);}
  for(const gate of s.gates){const y=sy(gate.y);if(y<20||y>610)continue;for(const side of [-1,1]){const edge=gate.x+side*gate.gap/2,wall=side<0?192:768;path([[wall,y-20],[edge,y-25],[edge-side*9,y+3],[edge,y+24],[wall,y+20]],'#2e3033','#161f22',3);for(let j=0;j<7;j++)line([[wall+(edge-wall)*j/7,y-16],[wall+(edge-wall)*(j+.8)/7,y+15]],'#d88b6650',2);}line([[gate.x-gate.gap/2+6,y-26],[gate.x-gate.gap/2+6,y+23]],'#ffe091',3);line([[gate.x+gate.gap/2-6,y-26],[gate.x+gate.gap/2-6,y+23]],'#ffe091',3);}
  if(!reduced&&s.trail.length>1)line(s.trail.map(p=>[p.x,sy(p.y)]),'#ffdaa17a',9);
  c.save();c.translate(s.x,270);c.rotate(-s.direction*.6);path([[-19,-16],[18,-16],[14,14],[-14,14]],'#63b9b2','#192e36',3);rect(-11,-25,22,12,'#e8bf65',2,'#2d3839');path([[-18,14],[18,14],[0,40]],'#e8c788','#293435',3);for(let i=0;i<3;i++)line([[-12+i*4,19+i*5],[11-i*4,19+i*5]],'#63583f',2);rect(-11,-9,22,11,'#233b40',2);rect(-8,-7,8,5,'#e8cf75',1);c.restore();
  if(!reduced)for(let i=0;i<6;i++){const age=(s.time*3+i*.17)%1;rect(s.x+(i%2?1:-1)*age*27,235-age*27,4,5,'#f5d28c');}c.restore();
  rect(0,572,960,68,'#252e32ee');footer(`岩层 ${s.progress} / ${s.goal}`,`${Math.floor(s.depth)} m · ${s.direction>0?'右下':'左下'}`);
}

export function paintLaser(g,s,reduced){
  const {c,rect,path,line,ellipse,text}=g,{footer}=challengeBrushes(g);
  ellipse(s.target.x,s.target.y,23,23,'#13161c');path([[470,92],[478,100],[491,82]],null,'#fff',4);
  for(const [i,b] of s.bars.entries()){const left=b.x-s.gap/2,right=b.x+s.gap/2;rect(153,b.y-4,left-153,8,'#ed3435');rect(right,b.y-4,805-right,8,'#ed3435');for(const edge of [left,right]){rect(edge-5,b.y-13,10,26,'#17191e');rect(edge-2,b.y-5,4,10,'#fff');}text(`0${3-i}`,117,b.y,15,'#fff','right');if(!reduced){c.globalAlpha=.12+Math.sin(s.time*10+i)*.06;rect(153,b.y-12,left-153,24,'#ef3736');rect(right,b.y-12,805-right,24,'#ef3736');c.globalAlpha=1;}}
  c.save();c.setLineDash([3,8]);line([[s.player.x,s.player.y],[s.controlPoint.x,s.controlPoint.y]],'#1b252d35',2);c.restore();
  ellipse(s.controlPoint.x,s.controlPoint.y,7,7,null,'#27989a',1.5);ellipse(s.player.x+3,s.player.y+4,12,12,'#12203324');ellipse(s.player.x,s.player.y,12,12,'#1ba7a1','#0b4448',2);ellipse(s.player.x-3,s.player.y-3,3,3,'#f6f9ec');footer('不要碰红线',`${s.gap}px 空隙 · ${Math.max(0,Math.ceil(s.limit-s.time))}s`,'#fff');
}

export function paintBridge(g,s,reduced){
  const {c,ellipse,path,line,text,rect}=g,{footer}=challengeBrushes(g),lit=s.mode==='preview';
  for(let row=s.goal-1;row>=0;row--)for(let col=0;col<3;col++){const x=340+col*140,y=496-row*65,passed=row<s.row&&s.passed[row]===col,hint=lit&&s.hints[row]===col,sunk=s.phase==='lost'&&row===s.row&&s.chosen.at(-1)===col;
    ellipse(x,y+14,55,14,'#0008');if(sunk){ellipse(x,y+9,49,12,null,'#d1d8ce',2);line([[x-20,y],[x+15,y+9]],'#c1cabe',2);continue;}
    path([[x-46,y-5],[x-30,y-17],[x+29,y-14],[x+49,y],[x+32,y+13],[x-30,y+14]],hint?'#e8eed9':passed?'#8fc8ad':'#535957',hint?'#fcffef':'#929d96',1.5);line([[x-31,y+3],[x+27,y+3]],hint?'#abb8a5':'#89948a',1);line([[x-17,y-9],[x-23,y+11]],'#27352d75',1);
    if(hint||passed){text(row+1,x,y-1,17,hint?'#24372f':'#183d34','center');if(hint&&!reduced)ellipse(x,y,58+Math.sin(s.time*2+row)*2,23,null,'#e1edcb77',1);}
    if(row===s.row&&!lit)line([[x-35,y+23],[x+35,y+23]],'#d6bf7d',2);
  }
  if(s.row>0){const x=340+s.passed[s.row-1]*140,y=496-(s.row-1)*65;path([[x-7,y-4],[x,y-26],[x+8,y-4]],'#e9ece4','#1b2428',1.5);ellipse(x,y-29,5,5,'#c8d2c9');}
  rect(0,570,960,70,'#0c161cdd');footer(lit?`灯熄灭前 ${Math.max(0,s.previewUntil-s.time).toFixed(1)} 秒`:`下一步 ${Math.min(s.row+1,s.goal)} / ${s.goal}`,lit?'记住发亮的路':'走过的路，会留下脚印','#e0e5dc');
}

export function paintGlass(g,s,reduced){
  const {c,path,line,text,ellipse}=g,{footer}=challengeBrushes(g),pieces=s.parts.length?s.parts:[s.polygon],colors=['#e7a86b','#79ced0','#d989a7','#c8ce79','#7ba7d2'];
  for(const [j,poly] of pieces.entries()){const shift=s.mode==='reveal'?(j?1:-1)*(reduced?8:Math.min(24,(s.time-(s.revealUntil-.9))*32)):0;c.save();c.translate(shift,0);path(poly.map(p=>[p.x+4,p.y+8]),'#0005');path(poly.map(p=>[p.x,p.y]),'#79c3ce','#ede5c7',3);c.save();c.beginPath();poly.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.clip();
    for(let i=0;i<8;i++){const a=i*Math.PI/4,b=(i+1)*Math.PI/4;path([[460,315],[460+430*Math.cos(a),315+430*Math.sin(a)],[460+430*Math.cos(b),315+430*Math.sin(b)]],colors[i%5],'#243e52',3);}
    for(let i=0;i<8;i++)line([[200+i*82,75],[440+i*82,550]],'#fff5',2);ellipse(460,315,79,79,null,'#294457',4);ellipse(460,315,46,46,null,'#f9e9b7',3);c.restore();c.restore();
  }
  if(s.cutStart&&s.cutEnd){c.save();c.setLineDash([6,8]);line([[s.cutStart.x,s.cutStart.y],[s.cutEnd.x,s.cutEnd.y]],'#fff2b9',3);c.restore();ellipse(s.cutStart.x,s.cutStart.y,6,6,'#fff2b9');}
  if(s.mode==='reveal'){text(`${s.ratio.toFixed(1)} / ${(100-s.ratio).toFixed(1)}`,480,90,25,'#f8efd5','center');}
  footer(`目标 50 : 50 · 容差 ±${s.tolerance}`,`剩余 ${s.attempts} 刀`);
}

export function paintCoil(g,s,reduced){
  const {c,rect,line,text,path}=g,{footer}=challengeBrushes(g),xy=p=>[210+p.x*36,137+p.y*36];
  for(let y=0;y<10;y++)for(let x=0;x<16;x++)rect(209+x*36,136+y*36,2,2,'#345743');
  if(s.trail.length>1){const points=s.trail.map(xy);if(!reduced){c.save();c.shadowColor='#5eee8f';c.shadowBlur=8;line(points,'#3da566',7);c.restore();}line(points,'#72dfa2',5);}
  if(s.food){const [x,y]=xy(s.food);rect(x-10,y-13,20,26,'#deb351',2,'#e7e3a7');rect(x-4,y-17,8,4,'#e7e3a7');rect(x-5,y-7,10,14,'#7d5624');line([[x-3,y],[x+3,y]],'#f7da82',2);}
  const [x,y]=xy(s.head),angle=s.direction*Math.PI/2;c.save();c.translate(x,y);c.rotate(angle);path([[14,0],[-9,-9],[-5,0],[-9,9]],'#e2ffcf','#82dd95',2);c.restore();
  text('↻',860,285,64,s.queued?'#e5c965':'#326a4b','center');path([[838,324],[858,324],[858,342],[874,330]],null,s.queued?'#e5c965':'#326a4b',3);
  footer(`电量 ${s.progress} / ${s.goal}`,s.queued?'下格：右转':'方向锁定 · 只准右转','#acf0b5');
}

export function paintFreeze(g,s,reduced){
  const {c,rect,path,line,ellipse,text,meter}=g,{footer,gear}=challengeBrushes(g);
  rect(0,498,960,64,'#285759');rect(0,498,960,10,'#8cbaad');for(let i=0;i<23;i++){const x=i*48-(s.distance%48);rect(x,515,36,21,'#346c69',4,'#194747');line([[x+4,519],[x+30,519]],'#77a897',2);}
  for(const saw of s.saws){const x=210+saw.x-s.distance;if(x< -60||x>1030)continue;rect(x-14,88,28,Math.max(0,saw.y-88),'#46595c',4,'#263e43');rect(x-7,93,7,Math.max(0,saw.y-106),'#9bbeb8',2);rect(x-36,82,72,28,'#b4483f',6,'#673d39');gear(x,saw.y,42,reduced?0:s.machineTime*4,s.frozen?'#b2edee':'#c5cfbc');if(s.frozen){ellipse(x,saw.y,49,49,null,'#98f3eab0',2);for(let i=0;i<6;i++){const a=i*Math.PI/3;line([[x+Math.cos(a)*49,saw.y+Math.sin(a)*49],[x+Math.cos(a)*57,saw.y+Math.sin(a)*57]],'#c5ffff',2);}}}
  const stride=reduced?0:Math.sin(s.time*17)*9;ellipse(210,496,25,7,'#173a3d77');c.save();c.translate(210,473);for(const [side,j] of [[-1,stride],[1,-stride]]){line([[side*8,7],[side*10+j*.4,17],[side*13+j,19]],'#254955',6);}rect(-16,-30,32,40,'#dda33e',8,'#775a38');rect(-13,-25,26,15,'#244b58',4);ellipse(-5,-19,3,3,'#c5ece2');ellipse(6,-19,3,3,'#c5ece2');line([[-16,-10],[-24,-3-stride*.3]],'#c88434',6);line([[16,-10],[24,-3+stride*.3]],'#c88434',6);rect(-19,-34,38,9,'#b64036',4);c.restore();
  rect(22,73,222,57,'#174544e0',6);text(s.frozen?'时间冻结':'冷却能量',36,89,16,'#e0f0df');meter(36,110,194,s.cold/s.maxCold,s.locked?'#d76353':'#88e1d2','#082e3b');rect(0,572,960,68,'#163d42ed');footer(`机关 ${s.progress} / ${s.goal}`,s.frozen?'机器暂停，脚步不停':'松开，恢复能量');
}

export function paintBalance(g,s,reduced){
  const {c,rect,ellipse,line,path,text}=g,{footer}=challengeBrushes(g);
  path([[418,475],[456,438],[468,345],[492,345],[504,438],[542,475]],'#576d62','#24473f',3);rect(406,472,148,18,'#b28b59',4,'#4d634e');for(let i=0;i<8;i++)line([[435+i*12,459],[443+i*10,380]],'#ddcda160',1);
  c.save();c.translate(480,335);c.rotate(s.angle);rect(-225,-9,450,18,'#b88551',3,'#3d5646');rect(-220,-8,440,5,'#edd29a',2);for(const x of [-145,145]){ellipse(x,0,56,8,'#ccba89','#4a624e',2);line([[x-48,-6],[x+48,-6]],'#ebdfb8',2);}c.restore();ellipse(480,335,18,18,'#8f7751','#3f5845',3);ellipse(477,331,7,7,'#dac698');
  for(const w of s.weights){c.save();c.translate(w.x,w.y);c.rotate(w.angle);rect(-27,-12,54,24,['#d1ae6b','#a9704b','#688e7d'][w.mass-1],2,'#355443');line([[-22,-8],[22,-8]],'#ecd7a2',1);text(`${w.mass}`,0,1,16,'#183f39','center');for(let i=0;i<5;i++)line([[-23+i*10,7],[-19+i*10,11]],'#33493980',1);c.restore();}
  text(`${s.left}`,335,514,25,'#294d43','center');text(`${s.right}`,625,514,25,'#294d43','center');
  for(const x of [335,625]){c.save();c.setLineDash([4,5]);ellipse(x,402,60,23,null,'#396a5960',1);c.restore();}
  rect(350,72,260,50,'#f0e9d2df',3,'#527665');text(`下一件：${s.nextWeight} kg`,480,97,24,'#244b3e','center');rect(0,573,960,67,'#244f47ef');footer(`已稳住 ${s.progress} / ${s.goal}`,s.time<s.readyAt?'等货物落稳':'左边，还是右边？');
}

export function paintTraffic(g,s,reduced){
  const {rect,ellipse,text,line}=g,{footer,car}=challengeBrushes(g),amber=s.time<s.amberUntil;
  // The road markings are visible, but live signal state always comes from the model.
  rect(443,298,74,74,'#354e59');for(const [axis,x,y] of [[0,414,260],[1,548,405]]){rect(x-12,y-38,24,62,'#203740',5);for(let i=0;i<3;i++)ellipse(x,y-26+i*18,6,6,amber?(i===1?'#f4c553':'#5c664f'):(i===(s.green===axis?2:0)?(i===2?'#9ad777':'#ed6757'):'#435955'));line([[x,y+24],[x,y+45]],'#223b43',5);}
  for(const v of s.cars)car(v.x,v.y,46,v.axis?Math.PI/2:0,['#ea805e','#e4ca69','#6cbbbe','#e7eadc'][v.id%4]);
  rect(26,73,223,50,'#f8eed9e8',4);text(`横向 ${s.passed[0]} · 纵向 ${s.passed[1]}`,138,98,20,'#245260','center');
  for(let i=0;i<2;i++){const x=i?670:54;text(i?'纵向排队':'横向排队',x,548,16,'#244d56');for(let j=0;j<6;j++)rect(x+100+j*20,540,13,14,j<s.queues[i]?(s.queues[i]>3?'#c64b44':'#dfb34d'):'#47746b40',2);}
  footer(`${s.progress} / ${s.goal} 辆已通过`,amber?'黄灯清空路口':s.green===0?'横向绿灯':'纵向绿灯');
}

export function paintShield(g,s,reduced){
  const {c,ellipse,line,path,text}=g,{footer,prism}=challengeBrushes(g);
  for(const radius of [92,144,234]){c.save();c.setLineDash(radius===144?[]:[2,9]);ellipse(480,320,radius,radius,null,radius===144?'#5e83916b':'#516b8540',1);c.restore();}
  for(let i=0;i<8;i++){const a=i*Math.PI/4;line([[480+Math.cos(a)*242,320+Math.sin(a)*242],[480+Math.cos(a)*252,320+Math.sin(a)*252]],'#809aa26b',2);}
  prism(480,320,34,reduced?0:s.time*.13,'#a5d4dd');for(const b of s.bolts){const x=480+Math.cos(b.angle)*b.radius,y=320+Math.sin(b.angle)*b.radius;line([[x,y],[x+Math.cos(b.angle)*25,y+Math.sin(b.angle)*25]],b.checked?'#e26268':'#efbf7470',4);prism(x,y,10,b.angle+Math.PI/2,b.checked?'#ed656c':'#f0bf6d');}
  c.save();c.beginPath();c.arc(480,320,144,s.angle-s.width,s.angle+s.width);c.strokeStyle='#91eeed';c.lineWidth=13;if(!reduced){c.shadowColor='#60cdca';c.shadowBlur=14;}c.stroke();c.shadowBlur=0;c.beginPath();c.arc(480,320,144,s.angle-s.width*.92,s.angle+s.width*.92);c.strokeStyle='#e5ffff';c.lineWidth=3;c.stroke();c.restore();
  for(let i=0;i<3;i++)prism(418+i*62,86,8,0,i<3-s.errors?'#a1e4d6':'#39445d');footer(`拦截 ${s.progress} / ${s.goal}`,`护盾弧度 ${Math.round(s.width*2*180/Math.PI)}°`,'#cfe4ed');
}

export const CHALLENGE_PAINTERS={'crosswalk-zero':paintCrosswalk,'faultline-drill':paintDrill,'laser-limbo':paintLaser,'blackout-bridge':paintBridge,'glass-divide':paintGlass,'neon-coil':paintCoil,'freeze-frame':paintFreeze,'copper-balance':paintBalance,'traffic-tangle':paintTraffic,'shield-waltz':paintShield};
