export const REGIONS={body:[8,3,572,516],cannon:[610,0,400,512],laser:[1095,0,440,512],ship:[25,531,446,492],broken:[486,519,570,505],debris:[1060,522,475,501]};
async function bitmap(name,signal){const r=await fetch(new URL(`./assets/${name}`,import.meta.url),{signal});if(!r.ok)throw new Error(`Artwork: ${name}`);return createImageBitmap(await r.blob());}

export async function createReturnPainter(canvas,{signal}={}) {
  let background,atlas;
  try{background=await bitmap('drydock.png',signal);atlas=await bitmap('machines.png',signal);}catch(e){background?.close();throw e;}
  const ctx=canvas.getContext('2d',{alpha:false});let disposed=false;
  function sprite(name,x,y,w,h,angle=0,alpha=1){const r=REGIONS[name];ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=alpha;ctx.drawImage(atlas,...r,-w/2,-h/2,w,h);ctx.restore();}
  function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  function text(value,x,y,size=14,color='#fff0c5',align='center'){ctx.fillStyle=color;ctx.font=`700 ${size}px ui-monospace, SFMono-Regular, monospace`;ctx.textAlign=align;ctx.fillText(value,x,y);}
  function ring(x,y,r,color,width=2,start=0,end=Math.PI*2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.arc(x,y,r,start,end);ctx.stroke();}
  function draw(s,{reduced=false,time=0}={}){
    if(disposed)return;
    const r=canvas.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1),w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    ctx.setTransform(w/960,0,0,h/640,0,0);ctx.imageSmoothingEnabled=false;
    ctx.drawImage(background,0,0,960,640);rect(0,0,960,640,'#08251c28');
    ctx.save();
    if(!reduced&&s.shake>0)ctx.translate(Math.sin(time*105)*s.shake*12,Math.cos(time*83)*s.shake*8);
    for(const h of s.hazards){
      const live=h.warn<=0;
      ctx.save();ctx.beginPath();ctx.rect(h.x-h.w/2,200,h.w,440);ctx.clip();
      rect(h.x-h.w/2,200,h.w,440,live?'#ff4f4470':'#e758332c');
      if(live&&h.kind==='laser'){rect(h.x-h.w*.18,205,h.w*.36,435,'#fff0cf');rect(h.x-h.w*.35,205,h.w*.7,435,'#ff4a5477');}
      ctx.strokeStyle=live?'#ffebe7':'#ff8a67';ctx.lineWidth=3;
      for(let j=-450;j<500;j+=28){ctx.beginPath();ctx.moveTo(h.x-h.w/2,200+j);ctx.lineTo(h.x+h.w/2,200+j+h.w);ctx.stroke();}
      ctx.restore();rect(h.x-h.w/2,200,3,440,'#ff8c6a');rect(h.x+h.w/2-3,200,3,440,'#ff8c6a');
      text(live?(h.kind==='slam'?'冲撞':'LASER'):'!',h.x,570,live?17:34,'#fff1d4');
      if(h.warn>0)rect(h.x-h.w/2,606,h.w*Math.min(1,h.warn),4,'#ffcb90');
    }
    const bx=s.boss.x,by=s.boss.y+(reduced?0:Math.sin(time*2)*3),recoil=s.flash>0?-5:0;
    ctx.fillStyle='#03141088';ctx.beginPath();ctx.ellipse(bx,268,174,35,0,0,Math.PI*2);ctx.fill();
    if(s.phase!=='won'){
      sprite(s.stage===2?'broken':'body',bx,by,248,228,0,1);
      if(s.stage===0)sprite('cannon',bx-126,by+30+recoil,154,215,Math.sin(time)*.025);
      if(s.stage<2)sprite('laser',bx+130,by+35,153,211,Math.sin(time*.8)*.035);
      if(s.stage>0){rect(bx-133,by+32,26,10,'#fa905a');if(!reduced)for(let i=0;i<4;i++)rect(bx-130+Math.sin(i+time*7)*9,by+55+(time*45+i*17)%62,3,6,'#d56848');}
      if(s.stage===2){ring(bx,by+9,21,'#ff724b',3);ring(bx,by+9,14,'#fff1b3',4);}
      if(s.phase==='playing'){
        const t=s.target,p=6+(reduced?0:Math.sin(time*5)*3);
        ctx.strokeStyle='#fff0b6';ctx.lineWidth=2;
        for(const dx of [-1,1])for(const dy of [-1,1]){const x=t.x+dx*(42+p),y=t.y+dy*(39+p);ctx.beginPath();ctx.moveTo(x-dx*13,y);ctx.lineTo(x,y);ctx.lineTo(x,y-dy*13);ctx.stroke();}
      }
    }else{
      sprite('broken',bx,by+65,230,215,.15,.65);sprite('debris',bx,by+100,350,310,0,.85);
    }
    if(s.phase==='transition'){
      const t=1.7-s.transition;
      sprite(s.stage===1?'cannon':'laser',bx+(s.stage===1?-135:140)*(1+t*.38),by+75+t*t*60,153,215,t*(s.stage===1?-1:1),Math.max(0,1-t*.4));
      text(s.stage===1?'肩炮击破':'激光臂击破',480,337,28,'#fbe6b0');
    }
    for(const b of s.bullets){
      rect(b.x-5,b.y-12,10,22,'#122c27');rect(b.x-4,b.y-11,8,18,'#ffc85e');rect(b.x-2,b.y-10,4,8,'#fff8d1');
    }
    for(const b of s.returns){if(b.delay>0)continue;
      const a=Math.atan2(s.target.y-b.y,s.target.x-b.x);ctx.save();ctx.translate(b.x,b.y);ctx.rotate(a);rect(-35,-4,34,8,'#82ffce88');rect(-15,-6,27,12,'#b3ffe1');rect(-4,-3,15,6,'#fff');ctx.restore();
    }
    const p=s.player;
    if(s.phase!=='lost'){
      const thrust=14+(reduced?0:Math.sin(time*40)*7);
      rect(p.x-12,p.y+25,7,thrust,'#71e8cf');rect(p.x+5,p.y+25,7,thrust,'#71e8cf');
      sprite('ship',p.x,p.y,66,73,(p.tx-p.x)*.001,reduced||p.invul<=0?1:Math.sin(time*28)>.1?.5:1);
      if(s.held&&!s.lockout){
        const color=s.heat>.76?'#ff9c66':'#7df4d0';ring(p.x,p.y,54,color,3);ring(p.x,p.y,59,color+'66',1);
        ctx.fillStyle=color+'12';ctx.beginPath();ctx.arc(p.x,p.y,52,0,Math.PI*2);ctx.fill();
      }
      if(s.lockout){ctx.strokeStyle='#ff7861';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p.x-27,p.y-30);ctx.lineTo(p.x+27,p.y+30);ctx.moveTo(p.x+27,p.y-30);ctx.lineTo(p.x-27,p.y+30);ctx.stroke();}
      for(let j=0;j<s.charge;j++){const a=-Math.PI/2+(j-(s.charge-1)/2)*.20,rr=66;rect(p.x+Math.cos(a)*rr-3,p.y+Math.sin(a)*rr-5,6,11,'#fff2b8');}
      if(s.charge>0)text(String(s.charge),p.x,p.y+57,16,'#fff5cc');
      if(s.heat>.08){rect(p.x-26,p.y+66,52,4,'#071a15');rect(p.x-26,p.y+66,52*Math.min(1,s.heat),4,s.heat>.76?'#ff8162':'#83dab7');}
    }
    for(const e of s.effects){if(reduced&&e.size<5)continue;ctx.globalAlpha=Math.min(1,e.life*2);rect(e.x,e.y,e.size,e.size,e.color);}
    ctx.globalAlpha=1;
    if(s.noticeTime>0&&s.phase==='playing'){
      rect(355,302,250,32,'#071c18ce');text(s.notice,480,324,17,s.notice.includes('过载')?'#ff9c7e':'#f5eac5');
    }
    ctx.restore();
    if(!reduced){ctx.fillStyle='#03130c20';for(let y=0;y<640;y+=4)ctx.fillRect(0,y,960,1);}
  }
  return {draw,dispose(){disposed=true;background.close();atlas.close();},diagnostics:()=>({assetsLoaded:2,atlasWidth:atlas.width,backgroundWidth:background.width})};
}
