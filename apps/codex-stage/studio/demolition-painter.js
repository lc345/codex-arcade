import { createOneButtonCanvas } from "./one-button-painters.js";

export function createDemolitionPainter(canvas){
  const k=createOneButtonCanvas(canvas),{c,box,line,oval,text,poly}=k, ink="#282d32",white="#eff5ed",yellow="#f8d86a",coral="#ee856b",mint="#79cdb4";
  function module(kind,x,y,size=1){c.save();c.translate(x,y);c.scale(size,size);if(kind==="split"){line([[0,12],[0,-4],[-15,-17]],coral,4);line([[0,-4],[15,-17]],coral,4);for(const px of[-15,15])oval(px,-17,5,5,coral);}else if(kind==="charge")poly([[-4,-23],[14,-23],[3,-3],[16,-3],[-8,24],[-3,4],[-15,4]],yellow);else{box(-15,-13,30,26,mint);box(-18,5,36,9,ink);}c.restore();}
  return k.renderer((s,{reduced,stopped})=>{
    box(0,0,960,540,ink);box(0,85,179,415,"#3c383f");box(781,85,179,415,"#363d3c");
    for(let i=0;i<14;i++){const x=i%2?28:101,y=100+Math.floor(i/2)*53;box(x,y,48,31,i%3?"#756879":"#638493",2);box(x+6,y+7,8,10,i%3?"#8caaa8":yellow);box(x+22,y+7,8,10,"#8caaa8");}
    box(192,99,576,393,"#203035");for(let x=208;x<767;x+=24)line([[x,100],[x,487]],"#2d4245",1);for(let y=109;y<490;y+=24)line([[196,y],[765,y]],"#2d4245",1);
    for(const x of[182,773]){box(x,95,6,401,mint);for(let y=102;y<495;y+=22)box(x-4,y,14,5,ink);}box(182,90,597,9,mint);
    for(const[x,y]of[[262,225],[698,225],[290,365],[670,365]]){oval(x+3,y+4,19,19,"#14262b");oval(x,y,17,17,"#789d99");oval(x,y,12,12,"#344f56");box(x-5,y-5,10,10,mint);}
    s.blocks.forEach(p=>{if(!p.hp)return;const color=p.metal?"#7ea5b8":p.maxHp===2?"#b38bb1":coral;box(p.x-24,p.y-13,49,30,"#101d29");box(p.x-24,p.y-17,49,30,color);box(p.x-24,p.y-17,49,5,p.metal?"#bed9df":"#ffb995");for(const dx of[-13,3]){box(p.x+dx,p.y-7,9,11,p.hp>1?"#69596b":"#fff0b0");box(p.x+dx,p.y-2,9,2,color);}if(p.metal){box(p.x+18,p.y-10,2,18,white);box(p.x-22,p.y+9,43,2,"#55798f");}if(p.hp<p.maxHp)line([[p.x+8,p.y-15],[p.x+2,p.y-3],[p.x+8,p.y+10]],ink,3);});
    for(const b of s.balls){if(!reduced)line([[b.x,b.y],[b.x-b.vx*1.8,b.y-b.vy*1.8]],b.child?"#ee856b70":"#f8d86a70",b.child?4:7);oval(b.x+2,b.y+2,b.child?5:8,b.child?5:8,"#13212b");oval(b.x,b.y,b.child?5:7,b.child?5:7,b.child?coral:yellow);oval(b.x-2,b.y-2,2,2,white);}
    if(!reduced){for(const p of s.sparks){const t=1-p.life/430;for(let i=0;i<6;i++){const a=i*Math.PI/3;box(p.x+Math.cos(a)*t*38,p.y+Math.sin(a)*t*38,Math.max(1,6*(1-t)),Math.max(1,6*(1-t)),p.metal?mint:coral);}}for(const b of s.bolts)line([[b.x,b.y],[(b.x+b.tx)/2+8,(b.y+b.ty)/2-10],[b.tx,b.ty]],yellow,3);}
    const dx=s.aim.x-480,dy=s.aim.y-468,len=Math.hypot(dx,dy),ang=Math.atan2(dy,dx);if(s.mode==="aim"){for(let n=1;n<=8;n++)oval(480+dx/len*n*20,468+dy/len*n*20,2,2,"#dbe9cf88");}
    oval(480,478,24,9,"#15272a");c.save();c.translate(480,468);c.rotate(ang);box(-6,-12,34,24,"#8fb8ae",3);box(17,-9,12,18,yellow,2);c.restore();oval(480,468,11,11,mint);oval(480,468,4,4,ink);
    text("MODULES",870,113,12,mint,"center");s.modules.forEach((m,i)=>{module(m,855,161+i*57,.55);text({split:"分裂",charge:"导电",heavy:"重击"}[m],886,163+i*57,14,white,"center");});if(!s.modules.length)text("原装弹珠",870,154,14,"#9fb5b7","center");
    text("COMBO",870,333,12,mint,"center");text(String(s.combo).padStart(2,"0"),870,377,47,yellow,"center");text(`${s.destroyed} / ${s.blocks.length}`,870,452,19,white,"center");
    box(0,0,960,81,white);text("弹珠拆迁队",25,32,29,ink);text("RICOCHET / REWIRE / REBUILD",27,63,10,"#557879");text(`0${s.chapter+1} / 03`,932,33,26,ink,"right");text("街区清理",932,63,12,"#557879","right");
    box(0,503,960,37,white);text(stopped?"拆迁暂停":s.phase==="lost"?"差几块，再来一发。":s.phase==="won"?"清空。收工。":`剩余 ${s.shots} 发`,24,523,14,ink);text(`${s.score} 分`,933,523,15,ink,"right");
    if(s.mode==="upgrade"){box(205,160,550,277,"#182930ef",4);text("给下一发，加点想法。",480,194,25,white,"center");s.offers.forEach((kind,i)=>{const x=343+i*273;box(x-116,230,232,175,s.selected===i?"#405d60":"#30454d",4);module(kind,x,276);text({split:"碰撞后分裂",charge:"金属间导电",heavy:"重击破甲"}[kind],x,330,21,white,"center");text({split:"一发变三路",charge:"邻近楼块连锁受损",heavy:"每次碰撞多拆一层"}[kind],x,368,13,mint,"center");});}
    if(s.phase==="won"||s.phase==="lost"){box(309,220,342,98,"#eff5edef",4);text(s.phase==="won"?"三个街区，全部清空。":"弹珠用完了。",480,256,24,ink,"center");text(s.phase==="won"?`最大连击 ${s.maxCombo}`:"模块还在，重试这一块。",480,291,14,"#557879","center");}
  });
}
