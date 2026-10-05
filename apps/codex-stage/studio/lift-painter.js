import { createThree } from "../vendor/three.js";

export function createLiftPainter(canvas) {
  const T=createThree(),c=canvas.getContext("2d"),surface=document.createElement("canvas"),scene=new T.Scene(),camera=new T.PerspectiveCamera(73,16/9,.06,65);
  const geometries=new Set(),materials=new Set(),textures=new Set(),pickables=[],ray=new T.Raycaster();
  let renderer,lost=false,destroyed=false,current=null,reduced=false,drawCalls=0;
  const box=new T.BoxGeometry(1,1,1),cylinder=new T.CylinderGeometry(1,1,1,12);geometries.add(box);geometries.add(cylinder);
  let seed=1729;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  function texture(kind){
    const a=document.createElement("canvas");a.width=a.height=128;const d=a.getContext("2d");d.fillStyle=kind==="wall"?"#71776b":kind==="floor"?"#6f776d":"#586764";d.fillRect(0,0,128,128);
    if(kind==="wall"){d.fillStyle="#344f46";d.fillRect(0,55,128,73);d.fillStyle="#182c28";d.fillRect(0,53,128,3);for(let j=0;j<5;j++){d.fillStyle="#bec2ae";d.fillRect(0,j*11,128,1);}for(let i=0;i<30;i++){d.fillStyle="#403e32";d.fillRect(rnd()*128,52,rnd()*3,rnd()*55);}}
    if(kind==="floor")for(let y=0;y<8;y++)for(let x=0;x<8;x++){d.fillStyle=(x+y)%2?"#323f3b":"#abb2a0";d.fillRect(x*16+1,y*16+1,15,15);d.fillStyle=(x+y)%2?"#4c5750":"#c4c6ae";d.fillRect(x*16+2,y*16+2,13,1);}
    for(let i=0;i<3300;i++){d.fillStyle=rnd()>.5?`rgba(15,24,17,${rnd()*.19})`:`rgba(224,227,201,${rnd()*.17})`;d.fillRect(rnd()*128,rnd()*128,1+rnd()*3,1+rnd()*2);}
    if(kind==="metal")for(let i=0;i<70;i++){d.fillStyle="#182e2970";d.fillRect(rnd()*128,0,1,128);}
    const t=new T.CanvasTexture(a);t.colorSpace=T.SRGBColorSpace;t.magFilter=1003;textures.add(t);return t;
  }
  function mat(color,map,basic=false){const m=basic?new T.MeshBasicMaterial({color,map}):new T.MeshStandardMaterial({color,map,roughness:.88,metalness:map?.name==="metal"?.35:.05});materials.add(m);return m;}
  const wall=mat(0xe3e3d1,texture("wall")),floor=mat(0xccccbb,texture("floor")),metal=mat(0x9ca79e,texture("metal")),rust=mat(0x803d33),dark=mat(0x1b2b28),brass=mat(0xc4aa73),white=mat(0xe0dfc8),black=mat(0x111915),red=mat(0xe94735,null,true),green=mat(0x8cc58a,null,true),light=mat(0xeee9bb,null,true);
  function mesh(parent,g,m,x,y,z,sx,sy,sz){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);return o;}
  const cube=(m,x,y,z,sx,sy,sz,p=scene)=>mesh(p,box,m,x,y,z,sx,sy,sz);
  const tube=(m,x,y,z,r,h,p=scene)=>mesh(p,cylinder,m,x,y,z,r,h,r);
  function plaque(text,sub,width,height,bg="#d0cbb2",fg="#202e2a"){
    const a=document.createElement("canvas");a.width=256;a.height=128;const d=a.getContext("2d");d.fillStyle=bg;d.fillRect(0,0,256,128);d.strokeStyle=fg;d.lineWidth=3;d.strokeRect(7,7,242,114);d.fillStyle=fg;d.textAlign="center";d.font="bold 37px monospace";d.fillText(text,128,61);d.font="17px monospace";d.fillText(sub,128,96);for(let i=0;i<75;i++){d.fillStyle="#11111124";d.fillRect(rnd()*256,rnd()*128,2,rnd()*10);}const t=new T.CanvasTexture(a);t.colorSpace=T.SRGBColorSpace;t.magFilter=1003;textures.add(t);const geo=new T.PlaneGeometry(width,height);geometries.add(geo);return new T.Mesh(geo,mat(0xffffff,t,true));
  }
  for(let i=0;i<7;i++){
    cube(floor,0,-.12,4-i*2,6,.2,2);
    for(const sign of [-1,1]){cube(wall,sign*3.15,1.7,4-i*2,.2,3.4,2);cube(dark,sign*3.02,.14,4-i*2,.05,.26,2);cube(brass,sign*3.02,1.92,4-i*2,.025,.035,2);}
    cube(metal,0,3.47,4-i*2,6.4,.12,2);cube(dark,0,3.35,4-i*2,6.2,.12,.12);
  }
  cube(wall,0,1.7,5.6,6.4,3.4,.2);cube(wall,0,1.7,-9.1,6.4,3.4,.2);
  for(const sign of [-1,1]){
    cube(wall,sign*2,1.7,-5.1,2,3.4,.3);cube(brass,sign*1.06,1.55,-4.85,.13,3.1,.2);cube(dark,sign*1.22,1.55,-4.89,.05,3.1,.18);
    cube(dark,sign*2.74,2.96,-.2,.11,.12,10);tube(rust,sign*2.86,1.7,4.6,.06,3.4);
    for(let i=0;i<10;i++)cube(brass,sign*2.73,2.96,4-i,.16,.18,.05);
  }
  cube(brass,0,3.03,-4.86,2.28,.18,.22);cube(metal,0,3.28,-5,2.3,.3,.3);
  const indicator=plaque("B1","LAST SERVICE",.86,.43,"#121b16","#edaa74");indicator.position.set(0,3.08,-4.66);scene.add(indicator);
  const exit=plaque("EXIT","GROUND FLOOR",1,.35,"#1f4937","#d1e4b8");exit.position.set(0,2.8,-8.94);scene.add(exit);
  const doors=[];for(const sign of [-1,1]){const group=new T.Group();group.position.set(sign*.49,1.47,-4.93);scene.add(group);cube(metal,0,0,0,.98,2.85,.13,group);for(let i=0;i<9;i++)cube(brass,-.43+i*.105,0,.08,.013,2.8,.015,group);cube(dark,sign*-.42,0,.1,.04,.65,.04,group);doors.push(group);}
  cube(dark,0,.02,-5.05,2.2,.04,.8);for(let i=0;i<12;i++)cube(brass,-1.03+i*.18,.05,-5.05,.025,.02,.8);
  // A porcelain fuse on a tool shelf, a breaker cabinet and a brass call button.
  const fuseGroup=new T.Group();fuseGroup.position.set(-2.68,1.28,.8);scene.add(fuseGroup);cube(rust,0,-.18,0,.62,.11,1.15,fuseGroup);cube(dark,-.26,.03,0,.08,.5,1.15,fuseGroup);
  const fuse=tube(white,.07,.02,0,.105,.48,fuseGroup);fuse.rotation.z=Math.PI/2;for(const x of [-.14,.28]){const cap=tube(brass,x,.02,0,.11,.09,fuseGroup);cap.rotation.z=Math.PI/2;}
  const fuseHit=cube(white,-2.43,1.36,.8,.35,.28,.55);fuseHit.visible=false;fuseHit.userData.entity="fuse";pickables.push(fuseHit);
  const notice=plaque("SPARE","6A / CERAMIC",.72,.36);notice.position.set(-3.015,1.97,.8);notice.rotation.y=Math.PI/2;scene.add(notice);
  const cabinet=new T.Group();cabinet.position.set(2.84,1.57,-1.8);cabinet.rotation.y=-Math.PI/2;scene.add(cabinet);
  cube(rust,0,0,0,.87,1.22,.22,cabinet);cube(dark,0,0,.12,.72,1.07,.035,cabinet);
  for(let j=0;j<3;j++){cube(brass,-.2+j*.2,.19,.15,.08,.34,.08,cabinet);tube(white,-.2+j*.2,.19,.18,.04,.23,cabinet);}
  for(let j=0;j<6;j++)cube(metal,0,-.3+j*.043,.15,.58,.018,.025,cabinet);
  const circuitLamp=cube(red,0,.46,.17,.13,.06,.04,cabinet);
  const panelHit=cube(metal,2.68,1.57,-1.8,.3,1.22,.87);panelHit.visible=false;panelHit.userData.entity="breaker";pickables.push(panelHit);
  const warning=plaque("DANGER","HIGH VOLTAGE",.85,.31,"#bbb88b","#593731");warning.position.set(2.985,2.45,-1.8);warning.rotation.y=-Math.PI/2;scene.add(warning);
  const callPlate=cube(brass,1.27,1.45,-4.83,.25,.55,.05);const button=tube(red,1.27,1.43,-4.77,.07,.045);button.rotation.x=Math.PI/2;callPlate.userData.entity="call";button.userData.entity="call";pickables.push(callPlate,button);
  const dial=plaque("01","NIGHT SHIFT",.46,.32);dial.position.set(-1.6,1.9,-4.89);scene.add(dial);
  // Low-res authored textures, full-height architecture and perspective replace diorama lighting.
  for(const z of [3,-1,-5.8]){cube(dark,0,3.23,z,1.75,.12,.37);cube(light,0,3.15,z,1.5,.025,.18);}
  cube(metal,-1.8,1.5,-8.88,.9,.5,.1);for(let i=0;i<8;i++)cube(dark,-2.16+i*.1,1.5,-8.8,.04,.37,.03);
  scene.add(new T.HemisphereLight(0xe1e2c4,0x26342e,1.25));const lamp=new T.DirectionalLight(0xffe4b0,2.1);lamp.position.set(0,3.1,3);scene.add(lamp);const spill=new T.DirectionalLight(0x90b9a0,.8);spill.position.set(-2,2,-8);scene.add(spill);
  scene.background=new T.Color(0x1e2b24);
  function contextLost(e){e.preventDefault();lost=true;}surface.addEventListener("webglcontextlost",contextLost);
  try{renderer=new T.WebGLRenderer({canvas:surface,antialias:false,powerPreference:"low-power"});renderer.setSize(480,270,false);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;}catch{lost=true;}
  const label=(v,x,y,n=20,color="#eee9ce",align="left")=>{c.font=`${n}px monospace`;c.fillStyle=color;c.textAlign=align;c.textBaseline="middle";c.fillText(v,x,y);};
  function draw(world,{reduced:reduce=false,stopped=false}={}){
    if(destroyed)return;current=world.scene;const s=current;reduced=reduce;const b=canvas.getBoundingClientRect(),dpr=Math.min(2,globalThis.devicePixelRatio||1),w=Math.max(1,Math.round((b.width||960)*dpr)),h=Math.round(w*9/16);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}c.setTransform(w/960,0,0,h/540,0,0);c.imageSmoothingEnabled=false;
    const bob=reduced?0:Math.sin(s.time/105)*Math.min(s.player.speed,1)*.018;
    camera.position.set(s.player.x,1.66+bob,s.player.z);camera.rotation.order="YXZ";camera.rotation.y=s.player.yaw;camera.rotation.x=s.player.pitch;camera.updateMatrixWorld();
    doors.forEach((d,i)=>d.position.x=(i?1:-1)*(.49+s.door*.9));fuseGroup.visible=!s.fuse;circuitLamp.material=s.power?green:red;button.material=s.power?green:red;lamp.intensity=s.power?2.9:2.1;
    if(renderer&&!lost){renderer.render(scene,camera);drawCalls=renderer.info.render.calls;c.drawImage(surface,0,0,960,540);}else{c.fillStyle="#27372e";c.fillRect(0,0,960,540);label("3D 渲染不可用",480,230,28,"#e7e5c9","center");label("请使用支持 WebGL 的浏览器",480,273,18,"#bcc2ae","center");}
    // Fixed scan lines are a material of the presentation, never a flashing overlay.
    if(!reduced){c.fillStyle="#12221912";for(let y=0;y<540;y+=4)c.fillRect(0,y,960,1);}
    c.fillStyle="#091b17db";c.fillRect(0,0,960,68);label("末班电梯",25,29,24);label("LAST LIFT / B1",26,52,12,"#a0b6a0");label(s.phase==="won"?"GROUND":s.power?"POWER ON":"NO POWER",933,31,17,s.power?"#b8dbb0":"#f0b48a","right");
    if(s.phase==="playing"){
      c.strokeStyle="#efefd3bb";c.lineWidth=1;c.beginPath();c.moveTo(473,270);c.lineTo(487,270);c.moveTo(480,263);c.lineTo(480,277);c.stroke();
      if(s.focus){c.fillStyle="#0a2119dd";c.fillRect(318,364,324,43);label(s.focus.title,480,385,22,"#e5efd7","center");}
      if(s.fuse&&!s.power){c.save();c.translate(856,456);c.rotate(-.25);c.fillStyle="#6b735e";c.fillRect(-43,0,73,18);c.fillStyle="#d4d4b8";c.fillRect(-29,-3,48,23);c.fillStyle="#b69657";c.fillRect(-43,-4,15,25);c.fillRect(18,-4,15,25);c.restore();}
    }
    c.fillStyle="#0a1d17eb";c.fillRect(0,498,960,42);label(s.status,25,519,17);label(`${s.progress}/3`,934,519,16,"#b9cbb0","right");
    if(s.phase==="won"){c.fillStyle="#182e22d9";c.fillRect(0,150,960,220);label("05:41",480,214,48,"#efe8b8","center");label("早安，夜班人。",480,286,29,"#e4ecd5","center");label("SHIFT COMPLETE",480,328,14,"#bfcbae","center");}
    if(stopped){c.fillStyle="#06150eca";c.fillRect(0,0,960,540);label("任务结束 · 夜班已暂停",480,275,27,"#e9ead0","center");}
  }
  function project(x,y,z){const v=new T.Vector3(x,y,z).project(camera);return{x:(v.x+1)*480,y:(1-v.y)*270};}
  return{draw,ready:Promise.resolve(),project,
    point(clientX,clientY){const b=canvas.getBoundingClientRect(),x=(clientX-b.left)*960/b.width,y=(clientY-b.top)*540/b.height,result={x,y};if(!current||!renderer||lost)return result;ray.setFromCamera(new T.Vector2(x/480-1,1-y/270),camera);scene.updateMatrixWorld(true);const hits=ray.intersectObjects(pickables,false);const hit=hits.find(h=>!(h.object.userData.entity==="fuse"&&current.fuse));if(hit)result.entity=hit.object.userData.entity;const p=new T.Vector3();if(ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),0),p))result.floor={x:p.x,z:p.z};return result;},
    get diagnostics(){return{renderer:renderer&&!lost?"three-perspective":"unavailable",contexts:renderer&&!destroyed?1:0,camera:"perspective",drawCalls,textures:textures.size};},
    destroy(){if(destroyed)return;destroyed=true;surface.removeEventListener("webglcontextlost",contextLost);for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();renderer?.dispose();renderer?.forceContextLoss();renderer=null;scene.clear();surface.width=surface.height=1;},
  };
}
