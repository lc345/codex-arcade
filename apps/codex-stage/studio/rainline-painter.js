export function createRainlinePainter(canvas) {
  const ctx=canvas.getContext("2d"),surface=document.createElement("canvas");surface.width=320;surface.height=180;const c=surface.getContext("2d");
  let destroyed=false;
  const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));};
  const line=(a,b,color,width=1)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(Math.round(a[0]),Math.round(a[1]));c.lineTo(Math.round(b[0]),Math.round(b[1]));c.stroke();};
  const text=(s,x,y,size=7,color="#f3f3cc",align="left")=>{c.font=`bold ${size}px monospace`;c.fillStyle=color;c.textAlign=align;c.fillText(s,x,y);};
  function building(x,y,w,h,layer,i){
    rect(x,y,w,h,layer===0?"#163637":"#214347");rect(x+2,y+1,w-4,2,"#356266");
    for(let row=0;row<h/10-1;row++)for(let col=0;col<w/8-1;col++){const lit=(row*13+col*7+i)%7<3;rect(x+4+col*8,y+6+row*10,4,5,lit?(i%3?"#d3b163":"#87b9af"):"#102829");if(lit)rect(x+4+col*8,y+10+row*10,4,1,"#668b76");}
    rect(x+w-7,y-6,4,6,"#335b59");line([x+w/2,y],[x+w/2,y-14],"#436864");
  }
  function foreground(x,i){
    const y=104+(i%3)*4;rect(x,y,45,42,"#173335");rect(x+1,y,43,2,"#789083");
    rect(x+5,y+6,16,21,"#0a1b20");rect(x+6,y+7,14,18,"#b55a67");rect(x+8,y+9,10,14,"#ffc782");
    rect(x+26,y+9,14,17,"#081e23");rect(x+27,y+10,12,14,"#497575");rect(x+31,y+10,1,14,"#172e30");
    rect(x+2,y+29,40,3,"#315451");for(let n=0;n<4;n++)rect(x+7+n*8,y+34,5,7,"#284c48");
    if(i%2===0){rect(x+7,y-10,29,9,"#ef9066");rect(x+8,y-9,27,7,"#1b3033");text(i%4?"RECORDS":"POST",x+21,y-3,5,"#f4ad75","center");}
    else{rect(x+32,y-19,8,30,"#de527b");text("24",x+36,y-7,6,"#ffead0","center");rect(x+35,y-4,2,12,"#ffc987");}
    line([x+5,y],[x+5,y-17],"#77968c");line([x-30,y-20],[x+5,y-17],"#688887");line([x+5,y-17],[x+45,y-19],"#688887");
  }
  function courier(s,t){
    const x=Math.round((s.player.x-s.camera)/3),y=Math.round(s.player.y/3),run=s.grounded&&!s.awaiting&&s.phase==="playing",frame=run?Math.floor(t/90)%4:0;
    c.save();c.translate(x,y);c.scale(s.player.facing,1);
    rect(-7,8,16,2,"#071c23");
    if(s.dash>0){rect(-26,-7,17,2,"#ffb2a6");rect(-36,0,24,1,"#d9896f");}
    const l=[-2,2,3,-1][frame],r=[3,-1,-2,2][frame];
    rect(-4,3,3,5,"#325369");rect(1,3,3,5,"#284357");rect(-4+l,7,4,3,"#e07a68");rect(1+r,7,4,3,"#f0a17a");
    rect(-6,-10,11,15,"#e4b654");rect(-5,-7,2,10,"#fbe086");rect(3,-7,3,9,"#9b762f");rect(-6,2,12,2,"#c09236");
    rect(-9,-7,4,10,"#d15e72");rect(-9,-8,4,2,"#ffb38c");rect(-8,-5,2,4,"#ffe1a1");
    rect(-3,-17,7,7,"#e8ba8a");rect(3,-15,2,3,"#efd2a0");rect(2,-15,1,1,"#152e35");
    rect(-5,-20,8,4,"#e96f7d");rect(-5,-17,11,2,"#ef9b84");rect(-5,-16,2,5,"#243b4a");
    rect(-5,-11,9,2,"#eb6679");rect(-10,-10-(frame%2),6,2,"#e56d87");rect(-13,-9-(frame%2),4,2,"#b54d6d");
    const arm=!s.grounded?-5:[3,0,-2,0][frame];rect(4,-6+arm,3,6,"#eccc75");rect(5,arm,3,2,"#f0ca9b");
    c.restore();
  }
  function draw(world,{reduced=false,stopped=false}={}){
    if(destroyed)return;const s=world.scene,t=reduced?0:s.time,cam=s.camera/3;
    rect(0,0,320,180,"#102b30");rect(0,28,320,72,"#284749");
    for(let i=-1;i<12;i++)building(i*39-(cam*.12%39),26+(i*i%4)*10,31,100,0,i+12);
    rect(0,90,320,16,"#254e50");
    for(let i=-1;i<9;i++)building(i*62-(cam*.32%62),45+(i*i%3)*9,49,83,1,i+30);
    line([0,84],[320,89],"#79938b");line([0,87],[320,92],"#152e35",2);
    for(let i=-1;i<9;i++)foreground(i*47-(cam*.68%47),i+Math.floor(cam*.68/47)+20);
    // The interactive rooftops use the same pixel grid and materials as the city.
    for(const [a,b] of [[0,760],[890,1550],[1680,2700]]){
      const x=a/3-cam,w=(b-a)/3;rect(x,147,w,33,"#11252e");rect(x,146,w,3,"#97b9a4");rect(x,150,w,2,"#47636a");
      for(let j=0;j<w;j+=12){rect(x+j+2,155,9,1,"#28434c");rect(x+j+6,161,7,1,"#36555c");rect(x+j+1,171,9,1,"#203e47");}
      for(let j=0;j<w;j+=37){rect(x+j,148,18,1,"#e7b879");rect(x+j+8,151,10,1,"#cb7488");}
    }
    for(const p of s.platforms){const x=(p.x-p.w/2)/3-cam,y=p.y/3,w=p.w/3;rect(x,y,w,p.h/3,"#536a66");rect(x-2,y-2,w+4,3,"#d4c58f");rect(x+2,y+3,w-4,p.h/3-4,"#223e45");for(let j=3;j<w-2;j+=4)rect(x+j,y+4,1,p.h/3-6,"#688e8b");}
    for(const p of s.parcels){if(p.found)continue;const x=p.x/3-cam,y=p.y/3+(reduced?0:Math.round(Math.sin(t/200)*2));rect(x-7,y-5,14,10,"#fce5ac");rect(x-6,y-4,12,8,"#ecbf6c");line([x-6,y-4],[x,y],"#b7795c");line([x,y],[x+6,y-4],"#b7795c");rect(x+3,y-3,2,3,"#d05270");if(!reduced){rect(x-10,y-8,1,3,"#ffecc0");rect(x+8,y+6,3,1,"#ffecc0");}}
    const tram=2500/3-cam;rect(tram-30,98,75,46,"#bd5364");rect(tram-28,94,71,5,"#f7d99f");for(let i=0;i<4;i++){rect(tram-23+i*16,103,12,18,"#eccb91");rect(tram-22+i*16,104,10,15,"#9bbba8");}rect(tram+4,102,15,39,"#253e45");rect(tram-28,135,70,3,"#edd8a4");rect(tram-19,142,9,4,"#091c26");rect(tram+25,142,9,4,"#091c26");
    courier(s,t);
    if(!reduced){for(let i=0;i<65;i++){const x=(i*71+t*.19)%344-12,y=(i*43+t*.45)%180;line([x,y],[x-3,y+8],i%3?"#91b5ad55":"#d6d7ac66");}for(let i=0;i<9;i++){const x=(i*47+t*.03)%320;rect(x,148,3,1,"#c2d6c7");}}
    const b=canvas.getBoundingClientRect(),dpr=Math.min(2,globalThis.devicePixelRatio||1),w=Math.max(1,Math.round((b.width||960)*dpr)),h=Math.round(w*9/16);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}ctx.setTransform(w/960,0,0,h/540,0,0);ctx.imageSmoothingEnabled=false;ctx.drawImage(surface,0,0,960,540);
    const label=(v,x,y,size,color="#fff4cf",align="left")=>{ctx.font=`bold ${size}px monospace`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(v,x,y);};
    ctx.fillStyle="#0b2428e8";ctx.fillRect(0,0,960,71);label("RAINLINE",25,34,25);label("雨线快递 / LAST COLLECTION 23:59",25,58,13,"#96c0b0");
    for(let i=0;i<3;i++){ctx.fillStyle=s.parcels[i].found?"#ffd785":"#315455";ctx.fillRect(812+i*41,24,29,21);ctx.strokeStyle="#132e35";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(814+i*41,26);ctx.lineTo(826+i*41,36);ctx.lineTo(839+i*41,26);ctx.stroke();}
    ctx.fillStyle="#0b2428ec";ctx.fillRect(0,498,960,42);label(s.phase==="won"?"DELIVERED / 三封急件，准时送达":s.awaiting?"末班车发车前，还有三封急件。":s.status,23,525,17);
    if(s.phase!=="won"){label(s.cooldown>0?"CHARGING":"DASH →",930,525,15,s.cooldown>0?"#67978c":"#f7ae98","right");}
    if(s.phase==="won"){ctx.fillStyle="#112b32ed";ctx.fillRect(260,154,440,147);label("23:59 / JUST IN TIME",480,205,22,"#ffcf89","center");label("最后一班车，留了一盏灯。",480,253,23,"#fff3d8","center");}
    if(stopped){ctx.fillStyle="#051b27b8";ctx.fillRect(0,0,960,540);label("任务结束 · 雨线已暂停",480,278,25,"#fff4cf","center");}
  }
  return{draw,ready:Promise.resolve(),point(x,y){const b=canvas.getBoundingClientRect();return{x:(x-b.left)*960/b.width,y:(y-b.top)*540/b.height};},get diagnostics(){return{renderer:"pixel-canvas",resolution:[320,180],contexts:destroyed?0:1};},destroy(){destroyed=true;surface.width=surface.height=1;}};
}
