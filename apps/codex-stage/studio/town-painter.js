import { createVarietyStage } from "./variety-3d.js";

export function createTownPainter(canvas) {
  const k=createVarietyStage(canvas,{width:12.8,eye:[6.6,8.9,9.4],target:[0,.15,0],background:"#bde2e2"}),{c,scene,box,shape,group,text}=k;
  const city=group(), details=[], streets=[], highlights=[], roofs=[], lamps=[], walkers=[], clouds=[], train=group();let signature="",current;
  const coords=i=>({x:(i%5-2)*1.03,z:(Math.floor(i/5)-2)*1.03});
  box(scene,0x69b3bf,0,-.34,0,200,.12,200);
  const base=box(scene,0x86a995,0,-.15,0,5.5,.25,5.5);base.receiveShadow=true;
  for(let i=0;i<25;i++){const p=coords(i);box(scene,0xdbe4d1,p.x,0,p.z,.99,.12,.99);const g=group();g.position.set(p.x,.078,p.z);for(const [x,z,sx,sz]of[[0,-.46,.9,.035],[0,.46,.9,.035],[-.46,0,.035,.9],[.46,0,.035,.9]])box(g,0x79a393,x,0,z,sx,.01,sz);highlights.push(g);}
  for(let i=0;i<6;i++){const cloud=group();cloud.position.set(-4+i*1.7,-.19,3.7+i%2*.6);box(cloud,0xe9f2e8,0,0,0,.42,.02,.035);clouds.push(cloud);}
  function tree(parent,x,z){box(parent,0x7d7668,x,.24,z,.06,.37,.06);shape(parent,"ball",0x739f6c,x,.46,z,.22,.3,.2);shape(parent,"ball",0x96bb78,x+.1,.48,z+.04,.14,.2,.13);}
  function house(p, color, active, market=false){
    const h=market?.48:.64;box(p,color,0,.12+h/2,0,.62,h,.57);const roof=shape(p,"cone",market?0x507b8e:0xc66465,0,h+.27,0,.48,.32,.43);roof.rotation.y=Math.PI/4;roofs.push(roof);
    for(const x of[-.17,.17]){box(p,active?0xffdb70:0x456b79,x,.5,.294,.11,.17,.018);box(p,0xeef1df,x,.405,.311,.15,.035,.046);}
    box(p,0x426b78,0,.255,.299,.11,.23,.018);box(p,0xe9ede1,0,.135,.4,.23,.05,.22);
    if(market){for(let i=0;i<6;i++)box(p,i%2?0xe9eddf:0xe36e56,-.285+i*.113,.49,.405,.112,.035,.24);box(p,0x5c8b76,0,.22,.51,.58,.11,.16);for(let i=0;i<4;i++)shape(p,"ball",[0xf2c554,0xdb7158,0x8daa63,0xd56d7c][i],-.2+i*.13,.305,.51,.058,.045,.058);}
    else {box(p,0x4b6e78,.18,h+.37,-.12,.08,.32,.09);tree(p,-.34,-.31);}
  }
  function rebuild(s){city.clear();details.length=streets.length=roofs.length=lamps.length=0;
    s.cells.forEach((tile,i)=>{if(!tile)return;const p=coords(i),g=group(city);g.position.set(p.x,.03,p.z);g.userData.index=i;details.push(g);
      box(g,0xb3c7b1,0,.07,0,.97,.05,.97);
      if(tile.type==="home")house(g,[0xe6ad77,0x8cb6be,0xdca7b2][i%3],s.lit.homes.includes(i));
      if(tile.type==="market")house(g,0xf0dca2,s.lit.shops.includes(i),true);
      if(tile.type==="park"){box(g,0x7caf78,0,.105,0,.83,.035,.83);tree(g,-.2,-.13);tree(g,.23,.19);for(const z of[-.31,-.2])box(g,0xd77b63,.22,.25,z,.38,.035,.055);for(let j=0;j<5;j++)shape(g,"ball",0xefb46c,-.3+j*.14,.15,.32,.04,.04,.04);}
      if(tile.type==="rail"||tile.type==="port"){
        const neighbors=[[-1,0,i%5>0?i-1:-1],[1,0,i%5<4?i+1:-1],[0,-1,i-5],[0,1,i+5]].filter(([, ,n])=>n>=0&&n<25&&["rail","port"].includes(s.cells[n]?.type));
        const dirs=neighbors.length?neighbors:[[1,0,-1],[-1,0,-1]];
        for(const[dx,dz]of dirs){for(const sign of[-1,1])box(g,0x637b80,dx*.26+(dz?sign*.105:0),.16,dz*.26+(dx?sign*.105:0),dx?.53:.028,.035,dz?.53:.028);for(let j=0;j<4;j++)box(g,0x9c8775,dx*j*.15,.14,dz*j*.15,dx?.047:.31,.035,dz?.047:.31);}
        if(tile.type==="port"){const depot=group(g);depot.position.set(-.22,0,-.23);depot.scale.set(.65,.65,.65);house(depot,0xf0d7a4,true,true);box(g,0xf2c554,.3,.32,-.28,.06,.45,.06);}
      }
    });
  }
  box(train,0xeb7159,0,.13,0,.26,.2,.4);box(train,0xf3d584,0,.29,-.06,.22,.16,.23);box(train,0x476d7b,0,.32,.055,.17,.075,.018);shape(train,"cylinder",0x435c66,0,.29,.15,.055,.19,.055);
  for(const x of[-.14,.14])for(const z of[-.12,.12])shape(train,"ball",0x3d5155,x,.065,z,.055,.055,.055);
  for(let i=0;i<5;i++){const g=group();shape(g,"ball",0xebc799,0,.19,0,.04,.045,.04);box(g,[0xd96965,0x567e9b,0xe7ba53][i%3],0,.105,0,.065,.13,.055);walkers.push(g);}
  function hud(s){
    c.fillStyle="#f1f6ea";c.fillRect(0,0,960,79);text("口袋小镇",25,31,28);text("A LITTLE PLACE TO COME BACK TO",27,61,10,"#668886");text(`${s.turn} / 15`,930,31,25,"#294f56","right");text(s.phase==="won"?"小镇开门了":"今日用地",930,61,12,"#668886","right");
    const rows=[["亮灯住宅",s.homes,6,"#c16d56"],["开门商店",s.shops,3,"#557f92"],["连通铁道",s.rails,3,"#477e66"]];rows.forEach(([name,n,total,color],i)=>{text(name,23,122+i*62,13,color);text(`${n} / ${total}`,24,148+i*62,22,color);});
    const names={home:"住宅",park:"花园",market:"商店",rail:"铁道"};text(s.nextTile?"下一块":"布局完成",925,119,12,"#668886","right");text(names[s.nextTile]||"可继续调整",925,147,21,"#294f56","right");
    c.fillStyle="#f1f6ea";c.fillRect(0,497,960,43);text(s.phase==="won"?"灯亮了，店开了，末班小火车也出发了。":s.mode==="review"?"还有街区没热闹起来。":`${15-s.turn} 块用地`,24,518,14);text(`${s.score} 分`,933,518,16,"#477e66","right");
  }
  function fallback(s){for(let i=0;i<25;i++){const x=239+i%5*98,y=114+Math.floor(i/5)*68;c.fillStyle=s.cells[i]?{home:"#e6ad77",park:"#7caf78",market:"#f0dca2",rail:"#637b80",port:"#dd755d"}[s.cells[i].type]:"#dbe4d1";c.fillRect(x,y,90,60);text(s.cells[i]?.type?.slice(0,1).toUpperCase()||"+",x+45,y+30,18,"#294f56","center");}}
  return {ready:k.ready,get diagnostics(){return k.diagnostics;},
    draw(world,{reduced=false}={}){current=world.scene;const s=current,key=JSON.stringify(s.log);if(signature!==key){rebuild(s);signature=key;}
      highlights.forEach((g,i)=>{g.visible=s.available.includes(i);g.scale.setScalar(s.cursor===i?1.04:1);});
      for(const g of details){const t=s.pulse?.cell===g.userData.index?Math.min(1,(s.time-s.pulse.at)/320):1;g.scale.y=reduced?1:Math.max(.1,1+Math.sin(t*Math.PI)*.15);}
      const path=[12], seen=new Set([12]), connected=new Set(s.lit.rail);
      const walk=i=>{for(const n of[i%5>0?i-1:-1,i%5<4?i+1:-1,i-5,i+5])if(connected.has(n)&&!seen.has(n)){seen.add(n);path.push(n);walk(n);path.push(i);}};walk(12);
      const ix=(s.time/900)%Math.max(1,path.length-1),a=coords(path[Math.floor(ix)]??12),b=coords(path[Math.min(path.length-1,Math.floor(ix)+1)]??12),f=ix%1;
      train.visible=path.length>1;train.position.set(a.x+(b.x-a.x)*(reduced?0:f),.2,a.z+(b.z-a.z)*(reduced?0:f));train.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);
      walkers.forEach((g,i)=>{g.visible=s.homes>i;const p=coords(s.lit.homes[i]??12);g.position.set(p.x+.4,p.y||.18,p.z+(reduced?0:Math.sin(s.time/1200+i)*.35));});
      clouds.forEach((g,i)=>{g.position.x=-4+i*1.7+(reduced?0:Math.sin(s.time/2500+i)*.1);});k.draw(()=>hud(s),()=>fallback(s));},
    projectTile(i){const p=coords(i);return k.diagnostics.renderer==="canvas-fallback"?{x:284+i%5*98,y:144+Math.floor(i/5)*68}:k.project(p.x,.08,p.z);},
    point(x,y){const p=k.point(x,y);if(k.diagnostics.renderer==="canvas-fallback")return p;if(p.y<80||p.y>495)return{x:-1,y:-1};const v=k.planePoint(p);if(!v)return{x:-1,y:-1};const col=Math.floor(v.x/1.03+2.5),row=Math.floor(v.z/1.03+2.5);if(col<0||col>4||row<0||row>4)return{x:-1,y:-1};return{x:284+col*98,y:144+row*68};},destroy:k.destroy};
}
