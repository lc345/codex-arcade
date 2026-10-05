import { STUDIO_ART } from "./assets.js";

export function createInkPainter(canvas,program) {
  const c=canvas.getContext("2d"),art=new Image();art.src=STUDIO_ART[program.id]??"";let destroyed=false;
  const text=(v,x,y,n=18,color="#eeede5",align="left",font="Georgia, 'Songti SC', serif")=>{c.fillStyle=color;c.font=`${n}px ${font}`;c.textAlign=align;c.textBaseline="middle";c.fillText(v,x,y);};
  const line=(x,y,a,b,color="#aaa99d",w=1)=>{c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(a,b);c.stroke();};
  function background(){if(art.complete&&art.naturalWidth)c.drawImage(art,0,0,960,540);else{c.fillStyle="#222321";c.fillRect(0,0,960,540);for(let i=0;i<180;i++)line(i*9,540,i*9-400,0,"#363831");text("档案图像加载中",480,250,24,"#eee","center");}}
  function paper(){c.beginPath();c.moveTo(548,121);for(let i=0;i<10;i++)c.lineTo(548+i*36,120+(i%3));c.lineTo(894,484);for(let i=0;i<10;i++)c.lineTo(894-i*36,481+(i%3));c.closePath();c.fillStyle="#ecece3";c.fill();for(let i=0;i<65;i++)line(561+(i*47%313),135+(i*67%330),567+(i*47%313),136+(i*67%330),"#8b8c7d44");}
  function draw(world,{reduced=false,stopped=false}={}){
    if(destroyed)return;const s=world.scene,b=canvas.getBoundingClientRect(),dpr=Math.min(2,globalThis.devicePixelRatio||1),w=Math.max(1,Math.round((b.width||960)*dpr)),h=Math.round(w*9/16);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}c.setTransform(w/960,0,0,h/540,0,0);background();
    c.fillStyle="#0c0d0ae0";c.fillRect(0,0,960,87);text("墨影档案",28,34,30);text("THE INK ARCHIVE  /  CASE No. 017",30,65,13,"#c6c7bb");text("夜半 · 失踪的房间",930,40,18,"#dfdfd3","right");line(28,84,930,84);
    if(!s.seal){
      const {x,y}=s.lens,r=76;
      c.save();c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.clip();c.fillStyle="#e9e9dd";c.fillRect(x-r,y-r,r*2,r*2);
      if(art.complete&&art.naturalWidth)c.drawImage(art,(x-r/1.7)/960*art.naturalWidth,(y-r/1.7)/540*art.naturalHeight,r*2/1.7/960*art.naturalWidth,r*2/1.7/540*art.naturalHeight,x-r,y-r,r*2,r*2);
      const p=s.clues[s.focus];if(p&&(p.found||s.exposure>80)){const a=p.found?1:Math.min(1,s.exposure/700);c.globalAlpha=a;c.fillStyle="#e5e4d6ee";c.fillRect(x-33,y-29,66,58);text(p.mark,x,y,36,"#171912","center");line(x-25,y+20,x+25,y+20,"#23241b",2);c.globalAlpha=1;}
      c.restore();line(x+52,y+55,x+104,y+112,"#131511",18);line(x+52,y+55,x+104,y+112,"#a8aa98",8);
      c.beginPath();c.arc(x,y,r+5,0,Math.PI*2);c.strokeStyle="#10120f";c.lineWidth=13;c.stroke();c.strokeStyle="#d8d9c7";c.lineWidth=2;c.stroke();
      for(let i=0;i<40;i++){const a=i*Math.PI/20;line(x+Math.cos(a)*(r+9),y+Math.sin(a)*(r+9),x+Math.cos(a)*(r+12),y+Math.sin(a)*(r+12),"#c6c9b8");}
      if(s.holding){c.beginPath();c.arc(x,y,r+17,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,s.exposure/700));c.strokeStyle="#f5f7e8";c.lineWidth=3;c.stroke();}
      if(p) {c.fillStyle="#11150fe8";c.fillRect(303,99,354,39);text(p.found?`${p.label} / ${p.mark}`:p.label,480,119,20,"#eeefe0","center");}
    }else{
      c.fillStyle="#080a07a8";c.fillRect(0,88,960,410);paper();text("封存档案",720,156,30,"#181b16","center");text("ARCHIVE  /  017",720,192,13,"#54584b","center");line(574,214,866,214,"#4a4d43");
      if(s.phase==="won"){text("准予解封",720,271,40,"#1b1f16","center");text("失踪的不是人。",720,336,21,"#33382c","center");text("是一整个房间。",720,375,21,"#33382c","center");text("CASE CLOSED",720,443,15,"#555b4b","center");}
      else {text("表  /  钥匙  /  窗",720,251,19,"#30392a","center");text("登记编号",720,285,14,"#5d6657","center");
        for(let i=0;i<3;i++){const x=620+i*90;c.fillStyle=s.dial===i?"#252b21":"#d2d4c6";c.fillRect(x-33,314,66,84);text(String(s.dials[i]),x,355,52,s.dial===i?"#f2f2e5":"#252b21","center");line(x-25,390,x+25,390,s.dial===i?"#ddd":"#555");}
        line(584,425,852,425,"#565d4f");text(s.flash>0?"编号不符":"揭开封条",720,451,21,"#282f23","center");}
      for(let i=0;i<3;i++){const p=s.clues[i],y=215+i*86;text(`0${i+1}`,38,y,17,"#cccdbb");text(p.label,90,y,24);text(p.mark,386,y,33,"#edeedb","right");line(38,y+35,389,y+35,"#727766");}
    }
    if(!reduced&&!s.seal){c.fillStyle="#f5f4e980";for(let i=0;i<13;i++){const x=480+(i*61+s.time*.008)%270,y=97+(i*39+s.time*.012)%340;c.fillRect(x,y,1,1);}}
    c.fillStyle="#0e100cef";c.fillRect(0,498,960,42);text(s.seal?"午夜书房 / 证物已归档":"怀表、钥匙、窗图。墨迹下面，还有墨迹。",26,519,17,"#dddccb");text(`${s.progress} / 3`,933,519,18,"#f1f0df","right");
    if(stopped){c.fillStyle="#080a07cc";c.fillRect(0,0,960,540);text("档案暂存",480,251,37,"#eeeedc","center");line(355,287,605,287);text("任务结束 · 检视已暂停",480,320,19,"#c9cdba","center");}
  }
  return{draw,ready:art.decode().catch(()=>undefined),point(x,y){const b=canvas.getBoundingClientRect();return{x:(x-b.left)*960/b.width,y:(y-b.top)*540/b.height};},get diagnostics(){return{renderer:"engraving-canvas",assetLoaded:Boolean(art.naturalWidth),contexts:destroyed?0:1};},destroy(){destroyed=true;art.src="";}};
}
