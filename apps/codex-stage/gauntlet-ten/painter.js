export function gauntletBrushes(g,s){
 const {c,rect,line,ellipse,path,text}=g;
 function foot(a,b,dark=false){rect(0,576,960,64,dark?'#132832f0':'#f4f5eaf0');text(a,30,607,21,dark?'#d7ede2':'#234541');text(b,930,607,19,dark?'#d7ede2':'#234541','right');text(`${Math.max(0,Math.ceil(s.limit-s.time))}s`,480,607,17,dark?'#acd7c5':'#5a7b70','center');}
 function star(x,y,r,fill){path(Array.from({length:10},(_,i)=>{const a=i*Math.PI/5-Math.PI/2,d=i%2?r*.45:r;return [x+Math.cos(a)*d,y+Math.sin(a)*d];}),fill);}
 function person(x,y,tilt=0,scale=1){c.save();c.translate(x,y);c.rotate(tilt);c.scale(scale,scale);ellipse(0,-57,13,14,'#f5c27f','#233e44',2);rect(-10,-42,20,35,'#e35041',5,'#263d45');line([[-3,-9],[-14,9]],'#233e44',7);line([[5,-9],[16,9]],'#233e44',7);line([[-8,-33],[-37,-22]],'#263d45',6);line([[8,-33],[37,-22]],'#263d45',6);line([[-60,-19],[60,-19]],'#233e44',4);c.restore();}
 function sub(x,y,flip,color){c.save();c.translate(x,y);if(flip)c.scale(-1,1);ellipse(0,0,18,31,color,'#e5f8e6',2);ellipse(0,-8,10,13,'#102e41','#a9eae2',2);path([[-15,9],[-26,27],[-14,22]],color);path([[15,9],[26,27],[14,22]],color);line([[-9,26],[-9,40]],'#b3efc7',3);line([[9,26],[9,40]],'#b3efc7',3);c.restore();}
 return {foot,star,person,sub};
}
export function paintNeedle(g,s,reduced){
 const {c,rect,line,ellipse,path,text}=g,{foot}=gauntletBrushes(g,s);
 rect(112,270,83,104,'#da6391',6,'#f5bdc1');for(let y=280;y<370;y+=8)line([[119,y],[187,y-5]],'#f8b799',3);ellipse(151,270,48,12,'#dbb38a','#573c46',3);ellipse(151,374,48,12,'#dbb38a','#573c46',3);ellipse(151,268,10,4,'#5a3c49');
 const ey=s.eye;line([[745,ey-145],[745,ey-31]],'#8dabae',10);path([[740,ey+31],[750,ey+31],[745,ey+173]],'#acbfc1');ellipse(745,ey,18,s.radius+12,'#b7d2ce','#e1e9df',3);ellipse(745,ey,9,s.radius,'#152e37','#7399a1',2);line([[735,ey-s.radius],[736,ey+s.radius]],'#fcf2d1',3);
 if(s.bullet){line([[185,320],...s.line.map(p=>[p.x,p.y])],'#ffabce',4);ellipse(s.bullet.x,s.bullet.y,9,4,'#ffe8a7');}else{line([[189,320],[238,320]],'#f9a8c3',4);path([[239,314],[252,320],[239,326]],'#ffe1a0');}
 if(!reduced){for(let i=0;i<5;i++)ellipse(745,ey-100-i*25,2,3,'#a4d8dc50');}for(let i=0;i<s.goal;i++){ellipse(335+i*48,520,16,10,null,i<s.progress?'#ffc59d':'#6b8a8a',3);if(i<s.progress)line([[320+i*48,520],[350+i*48,520]],'#eb7cae',3);}text('线头',180,427,19,'#e9cbbd','center');foot(`穿过 ${s.progress} / ${s.goal}`,`针眼 ±${s.radius-4} px`,true);
}
export function paintTightrope(g,s,reduced){
 const {c,rect,line,ellipse,path,text,meter}=g,{foot,person}=gauntletBrushes(g,s),x=145+670*Math.min(1,s.time/s.goal),y=301+Math.sin(x/960*Math.PI)*14;
 for(const a of [100,860]){rect(a-28,285,56,287,'#263e49',1);rect(a-50,280,100,13,'#4f696a',2);rect(a-20,300,40,185,'#e0e8d8',1);for(let i=0;i<5;i++)line([[a-18,310+i*35],[a+17,330+i*35]],'#638282',3);}
 line([[105,299],[480,317],[861,298]],'#263e49',4);line([[105,301],[480,319],[861,300]],'#f8f8e5',1);
 person(x,y-10,s.tilt*.95,1.1);const wind=s.wind;for(let i=0;i<4;i++){const px=470+i*55+(reduced?0:s.time*80%90);line([[px,127+i*25],[px+wind*90,127+i*25]],'#d74a47',3);}text(wind>0?'侧风 →':'← 侧风',480,101,18,'#be473f','center');
 rect(281,447,398,77,'#fffef1',5,'#5f7975');line([[311,486],[649,486]],'#acbdb4',12);line([[480-s.safe*150,486],[480+s.safe*150,486]],'#5b9c88',12);line([[480,469],[480,503]],'#234a4b',2);path([[480+s.tilt*150,476],[472+s.tilt*150,461],[488+s.tilt*150,461]],'#df4945');foot(`距离 ${Math.min(100,Math.round(s.time/s.goal*100))}%`,s.held?'向左修正':'向右修正');
}
export function paintMirrors(g,s,reduced){
 const {c,rect,line,ellipse,path,text}=g,{foot,star}=gauntletBrushes(g,s);
 for(let y=0;y<6;y++)for(let x=0;x<8;x++){rect(204+x*70,99+y*70,62,62,'#1c4546',2,'#366461');ellipse(235+x*70,130+y*70,2,2,'#5c9182');}
 const points=s.beam.points.map(p=>[235+p.x*70,130+p.y*70]);line(points,'#79e6c126',14);line(points,'#a7f4ce',3);if(!reduced)for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],t=s.time*1.5%1;ellipse(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,3,3,'#fffad6');}
 for(const m of s.mirrors){const x=235+m.x*70,y=130+m.y*70;ellipse(x,y,28,28,'#103438','#688b77',2);const dy=m.slash?-19:19;line([[x-19,y-dy],[x+19,y+dy]],'#cef2e4',6);line([[x-18,y-dy-3],[x+18,y+dy-3]],'#6babba',2);ellipse(x,y,4,4,'#e2c46e');}
 star(235+s.target.x*70,130+s.target.y*70,28,s.beam.hit?'#f6e4a8':'#81abcc');foot('让光抵达水晶',`剩余 ${s.moves} 次翻转`,true);
}
export function paintCrates(g,s,reduced){
 const {c,rect,line,ellipse,path,text}=g,{foot}=gauntletBrushes(g,s),xy=i=>({x:270+i%7*64,y:140+Math.floor(i/7)*64});
 for(let i=0;i<42;i++){const {x,y}=xy(i);if(s.board[i]){rect(x-30,y-30,60,60,'#40675f',1);rect(x-28,y-28,56,13,'#8cab91');line([[x-30,y],[x+30,y]],'#263f41',3);line([[x,y],[x,y+30]],'#284d48',2);}else{rect(x-30,y-30,60,60,'#ccd5b2',1,'#b1bc9d');if(s.targets.includes(i)){rect(x-23,y-23,46,46,'#e7c951',1);path([[x-12,y],[x,y-12],[x+12,y],[x,y+12]],'#a88d38');}}}
 for(const i of s.boxes){const {x,y}=xy(i);rect(x-26,y-20,55,52,'#385a4850',2);rect(x-27,y-28,53,52,s.targets.includes(i)?'#7ead80':'#d1a465',2,'#52624f');rect(x-21,y-22,41,39,'#ebca86',1,'#7d825b');line([[x-20,y-20],[x+20,y+17]],'#a98950',5);line([[x+20,y-20],[x-20,y+17]],'#a98950',5);for(const dx of [-22,22])for(const dy of [-23,20])ellipse(x+dx,y+dy,2,2,'#3a5650');}
 const p=xy(s.player);ellipse(p.x,p.y+18,22,9,'#50705677');rect(p.x-13,p.y-6,26,24,'#347d94',3);rect(p.x-15,p.y-27,30,24,'#edc195',4);rect(p.x-18,p.y-34,36,10,'#edc34c',2);rect(p.x-9,p.y-35,18,7,'#f7df82',1);rect(p.x-8,p.y-18,4,4,'#25484b');rect(p.x+5,p.y-18,4,4,'#25484b');foot(`归位 ${s.progress} / ${s.goal}`,`剩余 ${s.moves} 步`);
}
export function paintTwins(g,s,reduced){
 const {c,rect,line,ellipse,path,text}=g,{foot,sub}=gauntletBrushes(g,s);
 line([[480,68],[480,560]],'#649caa',2);for(let side=0;side<2;side++){const base=side?530:110;for(const gate of s.gates){const y=gate.y;if(y<55||y>570)continue;const mid=base+(side?1-gate.p:gate.p)*320,w=s.width*320;rect(base-25,y-12,mid-w/2-base+25,24,'#da746c',3,'#ffe2b8');rect(mid+w/2,y-12,base+345-mid-w/2,24,'#da746c',3,'#ffe2b8');line([[mid-w/2,y],[mid+w/2,y]],'#7befe088',1);}}sub(110+s.x*320,490,false,'#f4c66b');sub(530+(1-s.x)*320,490,true,'#c6e5e6');
 if(!reduced)for(let i=0;i<12;i++){const y=515+(s.time*55+i*12)%48;ellipse(110+s.x*320+Math.sin(i)*7,y,2,4,'#a8eae280');ellipse(530+(1-s.x)*320+Math.sin(i)*7,y,2,4,'#a8eae280');}foot(`双艇通过 ${s.progress} / ${s.goal}`,s.stage===2?'极窄航道':'镜像操纵',true);
}
export function paintMines(g,s,reduced){
 const {c,rect,line,ellipse,path,text}=g,{foot}=gauntletBrushes(g,s),ox=480-s.w*29,colors=['#68836d','#287da1','#448858','#b14942','#775483','#977234','#368c89'];
 for(let i=0;i<s.w*s.h;i++){const x=ox+i%s.w*58,y=140+Math.floor(i/s.w)*58;rect(x+3,y+4,52,52,'#476f4c33',2);rect(x,y,52,52,s.open[i]?'#f5f7db':'#4e8070',3,s.open[i]?'#a0b991':'#265a51');if(s.open[i]){if(s.counts[i])text(s.counts[i],x+26,y+26,26,colors[s.counts[i]],'center');else ellipse(x+26,y+26,4,4,'#a3bb87');}else if(i===s.explosion){ellipse(x+26,y+26,15,15,'#db5952');for(let j=0;j<8;j++){const a=j*Math.PI/4;line([[x+26+Math.cos(a)*12,y+26+Math.sin(a)*12],[x+26+Math.cos(a)*22,y+26+Math.sin(a)*22]],'#f9dc90',3);}}else{rect(x+7,y+8,38,5,'#96bba366',1);line([[x+10,y+40],[x+40,y+40]],'#285848',2);}}
 foot(`安全地块 ${s.progress} / ${s.goal}`,'一颗雷，一局归零');
}
export function paintTerritory(g,s,reduced){
 const {c,rect,line,ellipse,path,text}=g,{foot}=gauntletBrushes(g,s);
 rect(164,126,632,398,'#3d6b76',3,'#fcf3d3');for(let i=0;i<360;i++){const x=168+i%24*26,y=130+Math.floor(i/24)*26;rect(x+1,y+1,24,24,s.board[i]?'#f3ddb1':'#285d6b',1);if(s.board[i]&&i%3===0)ellipse(x+13,y+13,2,2,'#c7957c');}
 if(s.trail.length>1)line(s.trail.map(i=>[181+i%24*26,143+Math.floor(i/24)*26]),'#fd9788',5);for(const [j,e]of s.enemies.entries()){const x=168+e.x*26,y=130+e.y*26;ellipse(x,y,13,13,['#ecbc65','#dc7fac','#b7d9c0'][j],'#fffad0',3);for(let i=0;i<8;i++){const a=i*Math.PI/4+(reduced?0:s.time*2);line([[x+Math.cos(a)*16,y+Math.sin(a)*16],[x+Math.cos(a)*25,y+Math.sin(a)*25]],'#fcce7c',2);}}foot(`领地 ${Math.round(s.percent*100)}% / ${s.goal*100}%`,`${s.enemies.length} 个光核，别碰线`);
}
export function paintFold(g,s,reduced){
 const {c,rect,line,ellipse,path,text}=g,{foot}=gauntletBrushes(g,s);rect(207,132,322,322,'#fffef6',1,'#afb7b8');path([[529,132],[557,159],[557,482],[235,482],[207,454],[529,454]],'#83969c30');
 for(let y=0;y<7;y++)for(let x=0;x<7;x++){ellipse(225+x*48,150+y*48,2,2,'#bac8c5');}
 const fading=!reduced&&s.lastFold&&s.time-s.lastFold.at<.35;if(fading){c.save();c.globalAlpha=1-(s.time-s.lastFold.at)/.35;for(const p of s.lastFold.before)ellipse(225+p.x*48,150+p.y*48,13,13,'#d6a3c3');c.restore();}
 for(const p of s.points){ellipse(225+p.x*48+2,150+p.y*48+2,13,13,'#48647830');ellipse(225+p.x*48,150+p.y*48,13,13,'#bc568a','#f3c2d6',2);}
 s.lines.forEach((l,i)=>{const pos=(l.axis==='x'?225:150)+l.line*48;c.save();c.setLineDash([5,6]);line(l.axis==='x'?[[pos,132],[pos,454]]:[[207,pos],[529,pos]],i<2?'#2b8e97':'#a98639',2);c.restore();const x=i<2?315:425,y=i%2?526:102;ellipse(x,y,23,23,i<2?'#368c96':'#b99d48','#fffdf2',2);text(l.axis==='x'?'→':'↓',x,y,25,'#fffdf1','center');});
 rect(639,207,180,180,'#f8f9f0',2,'#9cabb0');for(const p of s.target)ellipse(650+p.x*26,218+p.y*26,7,7,'#bc568a');text('目标',729,417,21,'#516876','center');foot(`色点 ${s.points.length} 颗`,`剩余 ${s.moves} 折`);
}
export function paintTempo(g,s,reduced){
 const {c,rect,line,ellipse,path,text}=g,{foot}=gauntletBrushes(g,s);
 rect(64,231,832,201,'#101f26',4,'#59686d');for(let y=263;y<=401;y+=46)line([[80,y],[880,y]],'#354e57',1);rect(480-s.window*200,245,s.window*400,160,'#91bd8930',1);line([[480,239],[480,422]],'#fff5d5',4);
 for(const [i,n]of s.notes.entries()){const x=480+(n.at-s.time)*200;if(x<75||x>890)continue;const y=325+(i%3-1)*25;rect(x-13,y-15,26,30,n.hit?'#79caa5':n.miss?'#d75d61':'#efcf53',4,'#fff7be');line([[x+10,y-12],[x+10,y-46]],'#ffe99b',3);path([[x+10,y-46],[x+26,y-39],[x+10,y-29]],'#f4cf53');}
 if(!reduced&&s.time-s.flash<.16){c.save();c.globalAlpha=1-(s.time-s.flash)/.16;ellipse(480,330,42+(s.time-s.flash)*100,42,null,'#fff4c2',3);c.restore();}text('AFTER / BEAT',480,143,37,'#efcf53','center');for(let i=0;i<3;i++){ellipse(440+i*40,490,10,10,i<s.errors?'#dd6366':'#53665f');}foot(`命中 ${s.progress} / ${s.goal}`,`判定 ±${Math.round(s.window*1000)} ms`,true);
}
export function paintAirlock(g,s,reduced){
 const {c,rect,line,ellipse,path,text,meter}=g,{foot}=gauntletBrushes(g,s),n=s.capsules[s.cursor],target=n?.target??50;
 rect(193,199,541,240,'#376360',10,'#1e484d');rect(213,216,497,204,'#133f50',8,'#90bfb3');for(let i=0;i<7;i++)line([[223,238+i*25],[700,238+i*25]],'#547874',1);
 for(const cap of s.capsules){const x=480+(cap.at-s.time)*93;if(x<238||x>685||cap.done)continue;rect(x-31,288,62,59,'#d2e0cc',8,'#edcf60');ellipse(x,317,16,16,'#5dafa6','#edeee2',3);text(cap.target,x,318,17,'#143e47','center');rect(x-18,279,36,10,'#e8c465',2);}
 line([[480,225],[480,405]],'#e9df9a',3);path([[470,234],[480,246],[490,234]],'#f5d37b');
 const cx=480,cy=473;ellipse(cx,cy,73,73,'#edeed8','#385a57',5);c.save();c.translate(cx,cy);c.beginPath();c.arc(0,0,59,Math.PI+(target-s.tolerance)/100*Math.PI,Math.PI+(target+s.tolerance)/100*Math.PI);c.strokeStyle='#5ca184';c.lineWidth=13;c.stroke();const a=Math.PI+s.pressure/100*Math.PI;line([[0,0],[Math.cos(a)*55,Math.sin(a)*55]],'#d84d45',4);ellipse(0,0,7,7,'#375b5b');c.restore();text(Math.round(s.pressure),480,504,22,'#325558','center');text('kPa',480,527,12,'#66857b','center');
 if(s.flash&&!reduced&&s.time-s.flash.at<.3)rect(213,216,497,204,s.flash.ok?'#9fffc244':'#ff514866',8);text(s.held?'加压 ↑':'泄压 ↓',285,483,22,'#ecede2','center');text(`裂舱 ${s.errors} / 2`,687,483,21,'#ecede2','center');foot(`已接入 ${s.progress} / ${s.goal}`,`允许压差 ±${s.tolerance}`);
}
export const GAUNTLET_PAINTERS={'needle-rush':paintNeedle,'tightrope-club':paintTightrope,'mirror-vault':paintMirrors,'crate-escape':paintCrates,'twin-tide':paintTwins,'mine-surveyor':paintMines,'territory-cut':paintTerritory,'paper-fold':paintFold,'tempo-steps':paintTempo,'airlock-queue':paintAirlock};
