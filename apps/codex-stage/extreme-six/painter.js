import {extremeRules} from './rules.js';

export function extremeBrushes(g,s){
  const {c,rect,text,line,path,ellipse}=g;
  function footer(left,right,dark=true){rect(0,577,960,63,dark?'#101b20f5':'#fbfcf4f5');text(left,25,608,20,dark?'#edeee0':'#2b3d47');text(right,935,608,18,dark?'#c5d4c8':'#436168','right');}
  function diamond(x,y,r,fill,edge='#e8fff3'){path([[x,y-r],[x+r,y],[x,y+r],[x-r,y]],fill,edge,2);line([[x,y-r],[x,y+r]],edge+'70',1);line([[x-r,y],[x+r,y]],edge+'70',1);}
  function crosshair(x,y,r,color){ellipse(x,y,r,r,null,color,2);for(let i=0;i<4;i++){const a=i*Math.PI/2;line([[x+Math.cos(a)*(r+3),y+Math.sin(a)*(r+3)],[x+Math.cos(a)*(r+10),y+Math.sin(a)*(r+10)]],color,2);}}
  function astronaut(x,y,a,color){c.save();c.translate(x,y);c.rotate(a);rect(-13,-8,24,16,color,4,'#122f3c');rect(1,-5,8,10,'#d3f1ea',3);rect(-18,-5,6,10,'#657e89',1);path([[-10,-7],[-18,-15],[-1,-7]],'#dc795d');path([[-10,7],[-18,15],[-1,7]],'#dc795d');c.restore();}
  return {footer,diamond,crosshair,astronaut};
}

export function paintRazor(g,s,reduced){
  const {c,rect,path,line,ellipse,text}=g,{footer,diamond}=extremeBrushes(g,s),cam=s.camera;
  const pts=s.points.map(p=>[p.x-cam,p.y]),top=pts.map(([x,y])=>[x,y-s.halfWidth]),bottom=pts.map(([x,y])=>[x,y+s.halfWidth]);
  path([[0,58],...top,[s.points.at(-1).x-cam,58]],'#124837','#379976',2);path([[0,577],...bottom,[s.points.at(-1).x-cam,577]],'#193e3d','#39b1a0',2);
  path([...top,...bottom.slice().reverse()],'#091e2a');line(top,'#a1e5b1',3);line(bottom,'#51d6c5',3);
  for(let i=0;i<s.points.length;i++){const p=s.points[i],x=p.x-cam;if(x< -100||x>1050)continue;path([[x,p.y-s.halfWidth-3],[x-53,70],[x+45,70]],i%2?'#235d46':'#2d7450');path([[x,p.y+s.halfWidth+3],[x-54,576],[x+72,576]],i%2?'#286253':'#185255');line([[x,p.y-s.halfWidth-7],[x+32,90]],'#63b48155',2);text(String(i).padStart(2,'0'),x,550,14,'#92bfac','center');}
  if(!reduced&&s.trail.length>1)line(s.trail.map(p=>[p.x-cam,p.y]),'#f0e578',3);
  const p=s.player,x=p.x-cam;c.save();c.translate(x,p.y);c.rotate(s.held?-.88:.88);path([[10,0],[-9,-7],[-4,0],[-9,7]],'#f2e488','#fcffcf',1);c.restore();
  for(const sign of [-1,1])line([[x-12,p.y+sign*9],[x-25,p.y+sign*12]],'#b7eece',1);
  footer(`折角 ${s.progress} / ${s.goal}`,s.held?'上扬 ↗':'俯冲 ↘');
}

export function paintWall(g,s,reduced){
  const {c,rect,line,path,ellipse,text,meter}=g,{footer}=extremeBrushes(g,s),cam=s.camera;
  rect(248,58,464,519,'#262738');for(let y=60-((-cam)%54);y<590;y+=54){rect(120,y,105,48,'#79465b',1,'#b46271');rect(735,y,105,48,'#55405a',1,'#805c78');line([[142,y+8],[209,y+8]],'#c6807b55',3);}
  for(const x of [240,720])for(let y=64;y<575;y+=25){const wx=x===240?-1:1;path([[x+wx*17,y-10],[x,y],[x+wx*17,y+10]],'#e35f70','#ffb599',1);}
  for(const [i,n]of s.grips.entries()){const y=n.y-cam;if(y<65||y>568)continue;const next=i===s.progress+1,col=next?'#ffe980':i<=s.progress?'#679896':'#936a81';rect(n.x-20,y-s.halfGrip,40,s.halfGrip*2,'#203038',2,col);line([[n.x-14,y-s.halfGrip],[n.x+14,y-s.halfGrip]],col,4);text(i,n.x+(n.x<480?-55:55),y,16,col,'center');if(next){path(n.x<480?[[280,y-8],[266,y],[280,y+8]]:[[680,y-8],[694,y],[680,y+8]],'#ffe980');}}
  if(!reduced&&s.trail.length>1)line(s.trail.map(p=>[p.x,p.y-cam]),'#ffa66a55',5);
  const p=s.player,y=p.y-cam,side=s.progress%2?1:-1;ellipse(p.x,y+18,16,5,'#00000045');rect(p.x-8,y-12,16,25,'#fba268',3,'#eae3ac');rect(p.x-7,y-10,14,8,'#282d45',2);line([[p.x-5,y+10],[p.x-12,y+16]],'#f2d298',4);line([[p.x+5,y+10],[p.x+12,y+16]],'#f2d298',4);line([[p.x+side*7,y-1],[p.x+side*15,y-11]],'#f2d298',4);
  rect(410,100,140,9,'#ccb9c329',3);rect(410,100,140*Math.min(1,s.charge/.95),9,'#eec96a',3);text(s.mode==='wall'?(s.held?'蓄力':'按住蓄力'):'不能改向',480,131,17,'#edc6bd','center');
  footer(`攀壁 ${s.progress} / ${s.goal}`,`抓沿 ${s.halfGrip*2}px`);
}

export function paintHelix(g,s,reduced){
  const {c,rect,line,path,ellipse,text}=g,{footer,diamond}=extremeBrushes(g,s),{slitRects}=extremeRules();
  rect(298,58,364,519,'#f2f4ed');line([[298,60],[298,574]],'#2a3944',3);line([[662,60],[662,574]],'#2a3944',3);
  for(let y=80;y<580;y+=30){line([[283,y],[296,y]],'#657a7b',1);line([[664,y],[678,y]],'#657a7b',1);}
  for(const [i,b]of s.bars.entries()){const y=b.y??402+(s.time-b.at)*s.speed;if(y<68||y>565)continue;for(const r of slitRects(b.angle,s.width)){rect(r.x,y-7,r.w,14,'#28313c',1);rect(r.x,y-7,r.w,3,'#d96874',0);for(let x=r.x+4;x<r.x+r.w-6;x+=12)line([[x,y+5],[x+6,y-3]],'#65767b',1);}text(String(i+1).padStart(2,'0'),704,y,17,'#43585e');}
  ellipse(480,402,86,86,null,'#aab8b3',1);const bodies=s.players||[{x:394,y:402},{x:566,y:402}];line(bodies.map(b=>[b.x,b.y]),'#abb5b7',2);for(const [i,b]of bodies.entries()){ellipse(b.x+2,b.y+4,11,9,'#17273d18');diamond(b.x,b.y,9,i?'#ef6874':'#39a9b9',i?'#b42e51':'#277288');}
  line([[140,332],[220,332]],'#798d89',3);path([[142,332],[154,324],[154,340]],'#617875');path([[219,332],[207,324],[207,340]],'#617875');text('旋转',181,362,19,'#496264','center');
  footer(`双核 ${s.progress} / ${s.goal}`,`缝宽 ${s.width}px`,false);
}

export function paintDash(g,s,reduced){
  const {c,rect,line,path,ellipse,text}=g,{footer,diamond,crosshair}=extremeBrushes(g,s),{dashNode}=extremeRules(),cam=s.camera;
  for(let i=0;i<s.nodes.length;i++){const n=dashNode(s.nodes[i],s.time),x=n.x-cam;if(x< -60||x>1040)continue;
    line([[x,85],[x,555]],'#7ca4ad25',1);path([[x-30,560],[x,530],[x+38,560]],'#89bdcc');if(i>=s.progress){diamond(x,n.y,s.catchRadius,i===s.progress?'#ec6c99':'#44b9c1','#e7ffff');ellipse(x,n.y,s.catchRadius+5,s.catchRadius+5,null,'#367b8b',1);text(i===s.goal?'OUT':i,x,n.y-40,16,'#366173','center');}else diamond(x,n.y,9,'#abc9d0','#8cafb6');
    if(i<s.nodes.length-1){const next=dashNode(s.nodes[i+1],s.time),gx=(n.x+next.x)/2-cam,gy=(n.y+next.y)/2,half=s.aperture/2;path([[gx-12,70],[gx+13,70],[gx+13,gy-half],[gx,gy-half-10],[gx-12,gy-half]],'#778eae','#58718a',2);path([[gx-12,gy+half],[gx,gy+half+10],[gx+13,gy+half],[gx+13,576],[gx-12,576]],'#859ab5','#58718a',2);line([[gx-12,gy-half],[gx+13,gy-half]],'#d93e79',3);line([[gx-12,gy+half],[gx+13,gy+half]],'#d93e79',3);}
  }
  if(!reduced&&s.trail.length>1)line(s.trail.map(p=>[p.x-cam,p.y]),'#ec709b90',5);
  const p=s.player,x=p.x-cam;if(s.mode==='dock'){const dx=s.aim.x-p.x,dy=s.aim.y-p.y,d=Math.hypot(dx,dy)||1;c.save();c.setLineDash([5,7]);line([[x,p.y],[x+dx/d*82,p.y+dy/d*82]],'#94425d',2);c.restore();const r=s.catchRadius+13;c.beginPath();c.arc(x,p.y,r,-Math.PI/2,-Math.PI/2+Math.max(0,1-(s.time-s.dockedAt)/1.6)*Math.PI*2);c.strokeStyle='#ce477b';c.lineWidth=3;c.stroke();}
  path([[x+8,p.y],[x-6,p.y-6],[x-3,p.y],[x-6,p.y+6]],'#fffafa','#982952',2);
  footer(`连闪 ${s.progress} / ${s.goal}`,s.mode==='dock'?'棱晶即将破碎':'已出手 · 无法修正',false);
}

export function paintCursor(g,s,reduced){
  const {c,rect,line,path,ellipse,text}=g,{footer,crosshair}=extremeBrushes(g,s),{sliderPoint}=extremeRules();
  rect(99,93,762,451,'#202629',4,'#414c4a');for(let x=124;x<850;x+=29)for(let y=114;y<540;y+=29)rect(x,y,2,2,'#48524b',0);
  const current=s.notes[s.progress];if(current){const visible=s.notes.slice(s.progress,s.progress+3).filter(n=>n.at-s.time<1.45);for(let j=visible.length-1;j>=0;j--){const n=visible[j],active=n===current,col=active?'#cce958':'#687b76';c.save();c.globalAlpha=active?1:.45;
    if(n.slider){const points=Array.from({length:45},(_,i)=>{const p=sliderPoint(n,i/44);return [p.x,p.y];});line(points,'#566553',s.railRadius*2+7);line(points,'#232e2c',s.railRadius*2);line(points,'#b3c367',2);rect(n.c.x-8,n.c.y-8,16,16,col,2);}
    ellipse(n.a.x,n.a.y,s.radius,s.radius,'#1a2825',col,3);text(s.notes.indexOf(n)+1,n.a.x,n.a.y,23,col,'center');if(!s.sliding||!active){const remaining=Math.max(0,n.at-s.time),r=s.radius+Math.min(1,remaining/.85)*58;ellipse(n.a.x,n.a.y,r,r,null,col,2);}c.restore();}
    if(s.sliding){ellipse(s.target.x,s.target.y,s.railRadius,s.railRadius,'#eefff136','#fbffe1',2);ellipse(s.target.x,s.target.y,5,5,'#fcfff1');}
  }
  crosshair(s.controlPoint.x,s.controlPoint.y,7,'#f4a8b8');text(String(s.progress).padStart(2,'0'),63,200,31,'#c6dd66','center');text('连击',63,235,16,'#9aaa83','center');text('满连',896,454,17,'#a6bb8f','center');text('ONLY',896,483,13,'#86997f','center');
  footer(`连段 ${s.progress} / ${s.goal}`,s.sliding?'按住跟随 · 不要松开':`判定 ±${Math.round(s.window*1000)}ms`);
}

export function paintRecoil(g,s,reduced){
  const {c,rect,line,path,ellipse,text}=g,{footer,astronaut,crosshair}=extremeBrushes(g,s);
  rect(109,99,742,430,'#1c303b',5,'#859aa0');for(let x=127;x<837;x+=38)line([[x,105],[x,524]],'#5c829527',1);for(let y=125;y<520;y+=38)line([[113,y],[847,y]],'#5c829527',1);
  for(const x of [116,846])for(let y=108;y<520;y+=29)rect(x-4,y,8,13,'#d19a50',0);
  rect(317,241,326,151,'#daaf59',7,'#f8e3a6');rect(329,253,302,127,'#475263',4);for(let i=0;i<7;i++){rect(344+i*39,266,25,84,'#273c4a',3);line([[348+i*39,270],[348+i*39,340]],'#819293',2);}text('REACTOR',480,367,16,'#d9c78f','center');
  const current=s.ports[s.progress+1];for(const port of s.ports.slice(0,4)){const active=current&&port.x===current.x&&port.y===current.y,r=active?s.portRadius:22,col=active?'#80dac6':'#758891';rect(port.x-r-5,port.y-r-5,r*2+10,r*2+10,'#1e3e49',4,col);for(const sign of [-1,1])line([[port.x+sign*(r+8),port.y-r],[port.x+sign*(r+8),port.y+r]],col,3);if(active){ellipse(port.x,port.y,r,r,null,'#71cab6',2);text(s.progress+1,port.x,port.y,17,'#cef4d4','center');}}
  if(!reduced&&s.trail.length>1)line(s.trail.map(p=>[p.x,p.y]),'#d7b87255',3);const b=s.player,dx=s.aim.x-b.x,dy=s.aim.y-b.y,a=Math.atan2(dy,dx);astronaut(b.x,b.y,a,'#e5c776');
  if(s.time-s.shotAt<.12&&!reduced){path([[b.x+Math.cos(a)*18,b.y+Math.sin(a)*18],[b.x+Math.cos(a)*42-Math.sin(a)*5,b.y+Math.sin(a)*42+Math.cos(a)*5],[b.x+Math.cos(a)*42+Math.sin(a)*5,b.y+Math.sin(a)*42-Math.cos(a)*5]],'#ffd989');}
  const vx=s.velocity.x,vy=s.velocity.y;line([[b.x,b.y],[b.x+vx*.25,b.y+vy*.25]],'#91e4d2',2);crosshair(s.aim.x,s.aim.y,6,'#dda67d');
  for(let i=0;i<s.maxAmmo;i++)rect(360+i*28,553,18,10,i<s.ammo?'#d8bd6c':'#4b5b5c',2);text(`${Math.hypot(vx,vy).toFixed(0)} / ${s.speedLimit}`,772,552,14,'#b9d3cd','right');
  footer(`进港 ${s.progress} / ${s.goal}`,`对接剩余 ${Math.max(0,s.legLimit-s.time+s.legAt).toFixed(1)}s`);
}
export const EXTREME_PAINTERS={'razor-wings':paintRazor,'wall-rebound':paintWall,'twin-helix':paintHelix,'dash-stitch':paintDash,'cursor-overdrive':paintCursor,'recoil-pilot':paintRecoil};
