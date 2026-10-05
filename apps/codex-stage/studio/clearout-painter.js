import { createVarietyStage } from "./variety-3d.js";

export function createClearoutPainter(canvas) {
  const k=createVarietyStage(canvas,{width:16.5,eye:[0,5.85,19],target:[0,3,0],background:"#d9dce6"}),{c,scene,box,shape,group,text}=k;
  const room=group(), props=group(), cargo=[], legs=[], labels=[];let plank,chapter=-1,current;
  const pos=(x,y)=>({x:(x-480)/64,y:(490-y)/64});
  box(room,0x91aaa7,0,-.75,-1,40,.35,18);box(room,0xd9dce6,0,4.3,-1.45,28,10,.25);
  for(let i=0;i<14;i++){const x=-10+i*1.5;box(room,0xbdc2d0,x,3.7,-1.25,.045,7.4,.12);box(room,0xe8edf0,x+.6,5.25,-1.27,1,1.5,.12);box(room,0x76939f,x+.6,5.25,-1.18,.92,1.36,.04);box(room,0xe6ecea,x+.6,5.25,-1.13,.025,1.35,.05);}
  for(let i=0;i<8;i++)box(room,0xadc0b8,-7+i*2,-.565,1.1,1.2,.015,.05);
  function face(g,x,y,z,wide=.25){for(const sign of[-1,1]){shape(g,"ball",0xfff9e9,x+sign*wide/2,y,z,.06,.075,.035);shape(g,"ball",0x3d4656,x+sign*wide/2,y,z+.035,.025,.036,.02);}box(g,0x575968,x,y-.14,z,.09,.023,.024);}
  function item(kind,w,h){const g=group(props),sw=w/64,sh=h/64;
    if(kind==="washer"){box(g,0xf1eee4,0,0,0,sw,sh,.45);box(g,0xd4dfda,0,sh*.37,.238,sw*.93,sh*.17,.04);const door=shape(g,"cylinder",0x6f929b,0,-.05,.255,sw*.31,.06,sw*.31);door.rotation.x=Math.PI/2;const glass=shape(g,"ball",0x365c6c,0,-.05,.3,sw*.235,sw*.235,.045);face(g,0,sh*.31,.284,.24);}
    else if(kind==="tv"){box(g,0xb483a8,0,0,0,sw,sh,.33);box(g,0x3a5f60,-.025,.025,.18,sw*.76,sh*.67,.04);face(g,-.03,.07,.211,.23);for(const x of[-.15,.15])box(g,0x3e4853,x,-sh*.53,0,.06,.1,.2);const antenna=box(g,0x74747f,-.1,sh*.7,-.02,.025,.23,.025);antenna.rotation.z=.5;}
    else if(kind==="box"){box(g,0xe7bd6b,0,0,0,sw,sh,.42);box(g,0xf8e2ad,0,0,.22,.09,sh,.015);box(g,0xf8e2ad,0,sh/2,.02,.09,.015,.41);box(g,0xa88761,-sw*.3,0,.22,.025,sh*.88,.015);face(g,0,.08,.245,.3);}
    else if(kind==="ball"){shape(g,"ball",0xe77862,0,0,0,sw/2,sh/2,sw/2);for(const y of[-.12,.12])box(g,0xf0d686,0,y,sw*.4,sw*.67,.037,.01);}
    else {box(g,0x799b87,0,-sh*.4,0,sw,.06,.32);box(g,0x587977,0,0,0,.04,sh*.8,.04);const shade=shape(g,"cone",0xf0ce76,0,sh*.31,0,sw*.7,sh*.5,sw*.6);shade.rotation.y=Math.PI/4;}
    return g;
  }
  function rebuild(s){props.clear();cargo.length=legs.length=labels.length=0;const mirror=x=>s.chapter===1?960-x:x;
    const a=pos(s.ramp.x,s.ramp.y),ramp=box(props,0x839ca4,a.x,a.y,-.02,s.ramp.w/64,s.ramp.h/64,.8);ramp.rotation.z=-s.ramp.angle;
    const truck=group(props),p=pos(s.truck.x,481);truck.position.set(p.x,p.y,0);const dir=s.chapter===1?-1:1;
    box(truck,0x508c85,0,-.01,0,3.56,.25,1.12);box(truck,0x75aaa0,dir*1.7,.48,-.4,.18,1.55,.28);box(truck,0x75aaa0,-dir*1.74,.13,-.4,.12,.46,.28);
    box(truck,0xefe2c7,dir*2.25,.65,0,1,1.4,1.1);box(truck,0x739fa9,dir*2.25,.93,.56,.75,.6,.03);box(truck,0xe8b652,dir*2.25,.27,.56,.87,.2,.04);box(truck,0xe7705b,dir*2.25,.27,.6,.14,.1,.03);
    for(const x of[-1.07,1.05,2.23*dir]){const wheel=shape(truck,"cylinder",0x3d4750,x,-.32,.49,.31,.18,.31);wheel.rotation.x=Math.PI/2;shape(truck,"ball",0xc3ccc6,x,-.32,.6,.13,.13,.035);}
    const side=box(truck,0x5c9d93,0,.06,.56,3.55,.35,.05);side.castShadow=false;
    plank=box(props,0xdeb278,0,0,0,332/64,17/64,.85);
    s.supports.forEach((p,i)=>{const g=group(props);const v=pos(p.x,p.y),top=v.y+59/64,bottom=-.52;g.position.set(v.x,v.y,0);box(g,i?0x7798c6:0xe5857a,0,(top+bottom)/2-v.y,0,22/64,top-bottom,.5);box(g,0x4d626d,0,bottom-v.y,0,.72,.12,.65);const hand=shape(g,"cylinder",i?0x7798c6:0xe5857a,0,-.56,.43,.24,.12,.24);hand.rotation.x=Math.PI/2;shape(g,"ball",0xf0eee1,0,-.56,.52,.115,.115,.018);legs.push(g);labels.push({x:p.x,y:371});});
    s.items.forEach(p=>cargo.push(item(p.kind,p.w,p.h)));chapter=s.chapter;
    const clock=group(props),bp=pos(mirror(275),132);clock.position.set(bp.x,bp.y,-.8);
    const rim=shape(clock,"cylinder",0x759595,0,0,0,.44,.09,.44);rim.rotation.x=Math.PI/2;
    const dial=shape(clock,"cylinder",0xf0f2ea,0,0,.06,.37,.03,.37);dial.rotation.x=Math.PI/2;
    box(clock,0x354652,0,.12,.09,.024,.24,.025);box(clock,0x354652,.09,-.08,.09,.2,.025,.025);
  }
  function hud(s,stopped){c.fillStyle="#f0f2ea";c.fillRect(0,0,960,79);text("下班清场",24,31,28,"#354652");text(["THE LAST LOAD / 仓库","WRONG WAY ROUND / 反向装车","ONE MORE THING / 还有一件"][s.chapter],26,61,11,"#748d90");text(`${s.delivered} / ${s.items.length} 件`,933,30,25,"#527a75","right");text(`第 ${s.chapter+1} 车`,932,59,12,"#748d90","right");
    c.fillStyle="#f0f2ea";c.fillRect(0,505,960,35);text(stopped?"下班暂停":s.phase==="lost"?"散架可以，散到车外不行。":s.mode==="choose"?"今天，没有叉车。":s.mode==="delivered"||s.phase==="won"?"这一车，稳了。":"它们正在自己找座位。",24,523,14,"#354652");
    if(s.mode==="choose")labels.forEach((p,i)=>{const a=pos(p.x,p.y),v=k.project(a.x,a.y,.5);c.strokeStyle=i===s.selected?"#f9f2bb":"#ffffff99";c.lineWidth=i===s.selected?3:1;c.beginPath();c.arc(v.x,v.y,21,0,Math.PI*2);c.stroke();text(String(i+1),v.x,v.y,17,"#354652","center");});
    if(s.phase==="lost"||s.phase==="won"||s.mode==="delivered"){c.fillStyle="#f0f2eae8";c.fillRect(313,92,334,48);text(s.phase==="lost"?"这车白忙了。":s.phase==="won"?"全员下班。":"装稳了，下一车。",480,117,23,"#354652","center");}
  }
  function fallback(s){const line=(p,color)=>{c.save();c.translate(p.x,p.y);c.rotate(p.angle||0);c.fillStyle=color;c.fillRect(-p.w/2,-p.h/2,p.w,p.h);c.restore();};line(s.ramp,"#839ca4");line(s.plank,"#deb278");s.supports.filter(p=>!p.removed).forEach(p=>line(p,"#e5857a"));s.items.forEach(p=>line(p,p.delivered?"#69ac93":"#bd97ad"));c.fillStyle="#5c9d93";c.fillRect(s.truck.left,473,s.truck.right-s.truck.left,15);}
  return {ready:k.ready,get diagnostics(){return k.diagnostics;},
    draw(world,{reduced=false,stopped=false}={}){current=world.scene;const s=current;if(chapter!==s.chapter)rebuild(s);const p=pos(s.plank.x,s.plank.y);plank.position.set(p.x,p.y,0);plank.rotation.z=-s.plank.angle;legs.forEach((g,i)=>g.visible=!s.supports[i].removed);cargo.forEach((g,i)=>{const item=s.items[i],v=pos(item.x,item.y);g.position.set(v.x,v.y,.03);g.rotation.z=-item.angle;});k.draw(()=>hud(s,stopped),()=>fallback(s));},
    projectSupport(i){const p=current?.supports[i];if(!p)return null;if(k.diagnostics.renderer==="canvas-fallback")return{x:p.x,y:371};const v=pos(p.x,371);return k.project(v.x,v.y,.5);},
    point(x,y){const p=k.point(x,y);if(k.diagnostics.renderer==="canvas-fallback")return p;const v=k.planePoint(p,"z");if(!v)return{x:-1,y:-1};return{x:480+v.x*64,y:490-v.y*64};},destroy:k.destroy};
}
