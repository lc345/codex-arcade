import {FIELD,ITEMS} from './world.js';
import {stagePixelRatio} from '../packs/render-budget.js';

export async function createGrabPainter(canvas,{signal}={}){
  const c=canvas.getContext('2d',{alpha:false}),images=[];let disposed=false,frames=0,view={scale:1,x:0,y:0},crop=[];
  async function load(name){const r=await fetch(new URL('./assets/'+name,import.meta.url),{signal});if(!r.ok)throw Error('Missing local artwork: '+name);const image=await createImageBitmap(await r.blob());images.push(image);if(signal?.aborted)throw new DOMException('Stopped','AbortError');return image;}
  let cabinet,treasures;
  try{
    cabinet=await load('cabinet.png');treasures=await load('treasures.png');
    const scan=document.createElement('canvas');scan.width=treasures.width;scan.height=treasures.height;const ctx=scan.getContext('2d',{willReadFrequently:true});ctx.drawImage(treasures,0,0);const pixels=ctx.getImageData(0,0,scan.width,scan.height).data;
    for(let i=0;i<8;i++){const x0=Math.round(i%4*scan.width/4),y0=Math.round(Math.floor(i/4)*scan.height/2),x1=Math.round((i%4+1)*scan.width/4),y1=Math.round((Math.floor(i/4)+1)*scan.height/2);let l=x1,r=x0,t=y1,b=y0;
      for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(pixels[(y*scan.width+x)*4+3]>32){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
      if(r<=l||b<=t)throw Error('Empty sprite cell '+i);crop.push({x:l,y:t,w:r-l+1,h:b-t+1});
    }
  }catch(e){images.forEach(i=>i.close());throw e;}
  function line(points,color,width=2){c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
  function rounded(x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  function circle(x,y,r,fill){c.fillStyle=fill;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
  function sprite(kind,x,y,size,angle=0){const f=crop[ITEMS[kind].sprite],scale=size/Math.max(f.w,f.h);c.save();c.translate(x,y);c.rotate(angle);c.drawImage(treasures,f.x,f.y,f.w,f.h,-f.w*scale/2,-f.h*scale/2,f.w*scale,f.h*scale);c.restore();}
  function label(text,x,y,color='#223d3c',bold=true){c.save();c.textAlign='center';c.textBaseline='middle';c.font=`${bold?750:500} ${Math.max(14,10/view.scale)}px ui-monospace,monospace`;c.lineJoin='round';c.strokeStyle='#f9faf3';c.lineWidth=4;c.strokeText(text,x,y);c.fillStyle=color;c.fillText(text,x,y);c.restore();}
  function claw(s){
    const closed=s.grabId!==null||s.mode==='deposit',angle=s.angle;
    c.save();c.translate(s.hook.x,s.hook.y);c.rotate(-angle);
    const metal=c.createLinearGradient(-24,0,24,0);metal.addColorStop(0,'#546f70');metal.addColorStop(.35,'#f4fcf5');metal.addColorStop(.65,'#93b2b0');metal.addColorStop(1,'#365254');
    for(const side of [-1,1]){
      c.beginPath();c.moveTo(side*7,-6);c.quadraticCurveTo(side*(closed?23:33),5,side*(closed?15:35),22);c.quadraticCurveTo(side*(closed?11:30),33,side*(closed?3:19),30);c.lineCap='round';c.strokeStyle='#2e464a';c.lineWidth=10;c.stroke();c.strokeStyle=metal;c.lineWidth=6;c.stroke();
      circle(side*9,0,4,'#586d6b');circle(side*9,-1,1.5,'#f9fbed');
    }
    rounded(-12,-22,24,24,5,'#ea654e','#334f50');rounded(-7,-19,14,9,2,'#ffd477');line([[-8,-4],[8,-4]],'#faf9e5',2);
    c.restore();
  }
  function draw(s,{reduced=false}={}){
    if(disposed)return;frames++;const r=canvas.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height),dpr=stagePixelRatio(canvas);
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle='#cfddd7';c.fillRect(0,0,w,h);
    const designWidth=FIELD.width*(s.compact?.56:1),scale=Math.min(w/designWidth,h/FIELD.height);view={scale,x:w/2-480*scale,y:(h-FIELD.height*scale)/2};
    c.save();c.translate(view.x,view.y);c.scale(scale,scale);c.lineCap='round';c.lineJoin='round';
    if(!s.compact)c.drawImage(cabinet,0,0,FIELD.width,FIELD.height);
    else {const left=480-designWidth/2,edge=64,middle=designWidth-edge*2,k=cabinet.width/960;
      c.drawImage(cabinet,0,0,86*k,cabinet.height,left,0,edge,720);
      c.drawImage(cabinet,(480-middle/2)*k,0,middle*k,cabinet.height,left+edge,0,middle,720);
      c.drawImage(cabinet,874*k,0,86*k,cabinet.height,left+edge+middle,0,edge,720);
    }
    // Mark the real play boundary subtly; decorative cabinet edges never count as prizes.
    const age=s.lastEvent?s.time-s.lastEvent.at:100;
    if(s.gate){const g=s.gate;line([[480-designWidth*.36,g.y],[480+designWidth*.36,g.y]],'#7b8e8990',3);rounded(g.x-g.w/2,g.y-g.h/2,g.w,g.h,3,'#678b84','#3e5753');
      c.save();c.beginPath();c.rect(g.x-g.w/2+4,g.y-7,g.w-8,14);c.clip();for(let x=g.x-g.w/2-20;x<g.x+g.w/2;x+=28){c.fillStyle='#efd073';c.beginPath();c.moveTo(x,g.y-8);c.lineTo(x+13,g.y-8);c.lineTo(x+29,g.y+8);c.lineTo(x+16,g.y+8);c.fill();}c.restore();
      for(const x of [g.x-g.w/2+7,g.x+g.w/2-7])circle(x,g.y,3,'#e9f2de');
    }
    for(const o of s.items){if(o.collected||o.id===s.grabId)continue;const spec=ITEMS[o.kind];
      c.fillStyle='#53605b30';c.beginPath();c.ellipse(o.x+3,o.y+o.r*.7,o.r*.8,o.r*.25,0,0,Math.PI*2);c.fill();
      if(o.moving){const def=o.x;line([[def-o.r*.8,o.y+o.r],[def+o.r*.8,o.y+o.r]],'#57797170',2);}
      sprite(o.kind,o.x,o.y,o.r*2.05,o.angle);
      label(spec.seconds?`${spec.value}  +${spec.seconds}s`:String(spec.value),o.x,o.y+o.r+12,spec.value<60?'#656b69':'#294c4b');
    }
    const o=s.items.find(i=>i.id===s.grabId);
    if(s.mode==='aim'&&s.phase==='playing'){
      c.save();c.setLineDash([4,8]);const a=s.angle;line([[s.hook.x+Math.sin(a)*40,s.hook.y+Math.cos(a)*40],[s.hook.x+Math.sin(a)*125,s.hook.y+Math.cos(a)*125]],'#325a576b',2);c.restore();
    }
    line([[s.origin.x,s.origin.y],[s.hook.x,s.hook.y]],'#33494b',5);line([[s.origin.x-1,s.origin.y],[s.hook.x-1,s.hook.y]],'#e7e9d6',2);
    if(o){sprite(o.kind,o.x,o.y,o.r*2.05,o.angle);label(String(ITEMS[o.kind].value),o.x,o.y+o.r+14);}
    claw(s);
    // Recoil and the reel's turn are linked to the actual cable length, not a fake progress bar.
    c.save();c.translate(s.origin.x,s.origin.y-20);circle(0,0,14,'#415c5b');circle(0,0,10,'#ceded0');c.rotate(reduced?0:s.length*.09);for(let i=0;i<4;i++){c.rotate(Math.PI/2);line([[3,0],[8,0]],'#527c73',3);}circle(0,0,3,'#e5bc66');c.restore();
    if(s.phase==='playing'&&age<.6&&['catch','blocked','empty'].includes(s.lastEvent?.type)&&!reduced){const e=s.lastEvent,p=age/.6;for(let i=0;i<7;i++){const a=i*2.399;c.globalAlpha=1-p;circle(e.x+Math.cos(a)*p*28,e.y+Math.sin(a)*p*22+p*p*12,2+i%2,e.type==='catch'?'#f3c650':'#b6c2b8');}c.globalAlpha=1;}
    if(age<1.1&&s.lastEvent?.type==='delivered'){
      const e=s.lastEvent,p=reduced?0:age;label(`+${e.value}${e.seconds?'  +6s':''}`,480,226-p*40,'#b85335');
    }
    if(age<.65&&s.lastEvent?.type==='blocked')label('挡住了',s.hook.x,s.hook.y-38,'#ae4f3e');
    const kept=s.items.filter(i=>i.collected);for(let i=0;i<Math.min(kept.length,12);i++)sprite(kept[i].kind,316+i*29,681,25,(i%3-1)*.12);
    c.restore();
  }
  return {draw,dispose(){if(disposed)return;disposed=true;images.forEach(i=>i.close());},diagnostics:()=>({renderer:'canvas2d',frames,assets:images.length,sprites:crop.length,view:{...view}})};
}
