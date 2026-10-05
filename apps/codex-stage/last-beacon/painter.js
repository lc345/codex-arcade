import {createThree} from '../vendor/three.js';
import {BEACON_MAP} from './map.js';
import {stagePixelRatio} from '../packs/render-budget.js';

export async function createBattlePainter(canvas,{signal}={}){
  const T=createThree(),scene=new T.Scene(),camera=new T.PerspectiveCamera(65,16/9,.06,450);
  const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  scene.background=new T.Color('#b8d2d5');scene.fog=new T.FogExp2('#b8d2d5',.007);
  const geometries=[],materials=[],textures=[],fighters=[],supplies=new Map(),roofs=[],cameraWalls=[];
  let destroyed=false,frames=0,primed=false,size='',drawCalls=0,crosshair={x:.5,y:.5},lastTime=0;
  const material=(color,roughness=.9,metalness=0)=>{const m=new T.MeshStandardMaterial({color,roughness,metalness});materials.push(m);return m;};
  const m={soil:material('#bfc4a8'),road:material('#5a625e'),line:material('#d1d0b3'),cement:material('#bbc5bd'),steel:material('#45554f',.5,.55),dark:material('#263732'),rust:material('#80504a'),green:material('#4e6454'),blue:material('#477279'),rock:material('#707d73'),trunk:material('#65594a'),leaf:material('#355c40'),water:material('#346d78',.27,.12),white:material('#e2dfc7'),orange:material('#e9a750')};
  const g={box:new T.BoxGeometry(1,1,1),sphere:new T.IcosahedronGeometry(1,1),cylinder:new T.CylinderGeometry(1,1,1,10),cone:new T.ConeGeometry(1,1,9)};geometries.push(...Object.values(g));
  function mesh(geo,mat,at,scale,parent=scene){const n=new T.Mesh(geo,mat);n.position.set(...at);n.scale.set(...scale);n.castShadow=n.receiveShadow=true;parent.add(n);return n;}
  const box=(mat,at,scale,parent)=>mesh(g.box,mat,at,scale,parent);
  const sun=new T.DirectionalLight('#ffeac8',3.1);sun.position.set(-28,45,30);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);Object.assign(sun.shadow.camera,{left:-36,right:36,top:36,bottom:-36,near:1,far:120});sun.shadow.bias=-.0004;sun.shadow.normalBias=.05;scene.add(sun,sun.target);
  scene.add(new T.HemisphereLight('#d9edee','#62705a',1.35));
  let models;
  function dispose(){if(destroyed)return;destroyed=true;new Set(geometries).forEach(v=>v.dispose());new Set(materials).forEach(v=>v.dispose());new Set(textures).forEach(v=>{v.image?.close?.();v.dispose();});scene.clear();renderer.dispose();renderer.forceContextLoss();}
  try{
    const res=await fetch(new URL('./assets/survivor.glb',import.meta.url),{signal});if(!res.ok)throw Error('Missing survivor models');
    const bytes=await res.arrayBuffer();models=await new Promise((resolve,reject)=>new T.GLTFLoader().parse(bytes,'',resolve,reject));
    models.scene.traverse(n=>{if(n.isMesh){geometries.push(n.geometry);materials.push(...(Array.isArray(n.material)?n.material:[n.material]));}});
    const response=await fetch(new URL('./assets/ground.png',import.meta.url),{signal});if(!response.ok)throw Error('Missing ground texture');const bitmap=await createImageBitmap(await response.blob());
    const ground=new T.Texture(bitmap);ground.colorSpace=T.SRGBColorSpace;ground.wrapS=ground.wrapT=T.RepeatWrapping;ground.repeat.set(23,23);ground.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());ground.needsUpdate=true;textures.push(ground);m.soil.map=ground;m.soil.needsUpdate=true;
  }catch(e){dispose();throw e;}
  if(signal?.aborted){dispose();throw Error('Aborted');}
  const originals=new Map(models.scene.children.map(n=>[n.name,n]));
  function clone(name,parent=scene){const source=originals.get(name);if(!source)throw Error('Missing model '+name);const n=source.clone(true);n.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;});parent.add(n);return n;}
  const groundGeometry=new T.PlaneGeometry(142,142);groundGeometry.rotateX(-Math.PI/2);geometries.push(groundGeometry);mesh(groundGeometry,m.soil,[0,-.035,0],[1,1,1]);
  box(m.water,[0,-2,0],[600,1,600]);
  box(m.road,[0,.008,2],[11,.045,124]);box(m.road,[6,.01,-9],[111,.04,9]);
  for(let z=-56;z<=59;z+=7)box(m.line,[0,.037,z],[.13,.012,3]);
  for(let x=-48;x<=53;x+=7)if(Math.abs(x)>8)box(m.line,[x,.039,-9],[3,.012,.12]);
  for(const o of BEACON_MAP.obstacles){
    if(o.kind==='wreck')continue;
    const mat=o.kind==='container'?([m.rust,m.blue,m.green][Number(o.id.split('-')[1])%3]):o.kind==='rock'?m.rock:o.kind==='tower'?m.steel:m.cement;
    const n=mesh(o.kind==='rock'?g.sphere:g.box,mat,[o.x,o.h/2,o.z],[o.w,o.h,o.d]);if(o.kind==='rock')n.scale.multiplyScalar(.63);cameraWalls.push(n);
    if(o.kind==='container'){
      const long=o.w>o.d;for(let j=-.45;j<.5;j+=.075)box(m.steel,[o.x+(long?o.w*j:0),o.h/2+.02,o.z+(long?0:o.d*j)],[long?.055:o.w+.05,o.h+.03,long?o.d+.05:.055]);
      for(const s of [-1,1])box(m.steel,[o.x+(long?o.w*s*.5:0),.18,o.z+(long?0:o.d*s*.5)],[long?.05:o.w,.1,long?o.d:.05]);
    }
    if(o.kind==='barrier'){for(let j=-1;j<=1;j++)box(m.orange,[o.x+(o.w>o.d?j*o.w*.26:0),o.h+.012,o.z+(o.w>o.d?0:j*o.d*.26)],[o.w>o.d?.5:o.w+.02,.025,o.w>o.d?o.d+.02:.5]);}
  }
  for(const b of BEACON_MAP.buildings){
    box(m.cement,[b.x,.045,b.z],[b.w,.09,b.d]);
    const roof=new T.Group();scene.add(roof);roofs.push({b,roof});
    for(const side of [-1,1]){const n=box(m.steel,[b.x+side*b.w*.25,4.8,b.z],[b.w*.54,.12,b.d+.8],roof);n.rotation.z=-side*.2;}
    for(let z=b.z-b.d/2+1;z<b.z+b.d/2;z+=3)for(const side of [-1,1])box(m.dark,[b.x+side*(b.w/2-.12),2,z],[.20,4,.14]);
    for(const side of [-1,1])box(m.rust,[b.x+side*2.1,2,b.z+b.d/2],[.12,4,.24]);
  }
  // A physically legible landmark at the final zone, with no gameplay automation.
  for(const x of [-2,2])for(const z of [-26,-22])box(m.steel,[x,7,z],[.17,14,.17]);
  for(let h=3;h<14;h+=3)box(m.steel,[0,h,-24],[4.4,.12,4.4]);
  mesh(g.sphere,m.white,[0,14,-24],[2.5,1.5,2.5]);box(m.orange,[0,16,-24],[.18,3,.18]);
  for(let i=0;i<34;i++){const a=i*2.4,r=72+(i%5)*8;mesh(g.sphere,i%2?m.rock:m.green,[Math.sin(a)*r,-5,Math.cos(a)*r],[12+i%4*4,7+i%3*5,14]);}
  const trunk=new T.InstancedMesh(g.cylinder,m.trunk,65),foliage=new T.InstancedMesh(g.cone,m.leaf,130),dummy=new T.Object3D();scene.add(trunk,foliage);trunk.castShadow=foliage.castShadow=true;
  for(let i=0;i<65;i++){const a=i*2.399,r=69+i%3*2,x=Math.sin(a)*r,z=Math.cos(a)*r,h=4+i%4*.6;dummy.position.set(x,h*.25,z);dummy.scale.set(.16,h*.5,.16);dummy.updateMatrix();trunk.setMatrixAt(i,dummy.matrix);for(let j=0;j<2;j++){dummy.position.set(x,h*.55+j*h*.24,z);dummy.scale.set(1.5-j*.25,h*.9,1.5-j*.25);dummy.updateMatrix();foliage.setMatrixAt(i*2+j,dummy.matrix);}}
  for(const [x,z]of [[-43,2],[36,13],[-10,-44]]){
    const truck=new T.Group();scene.add(truck);truck.position.set(x,0,z);
    cameraWalls.push(box(m.rust,[0,.75,0],[2.4,.75,4.3],truck),box(m.green,[0,1.6,-1.2],[2.2,1.1,1.5],truck));box(m.dark,[0,1.7,-1.97],[1.85,.6,.025],truck);
    for(const sx of [-1.18,1.18])for(const sz of [-1.3,1.3]){const wheel=mesh(g.cylinder,m.dark,[sx,.48,sz],[.47,.3,.47],truck);wheel.rotation.z=Math.PI/2;}
  }
  const ringMat=new T.MeshBasicMaterial({color:'#48bdeb',transparent:true,opacity:.17,side:T.DoubleSide,depthWrite:false});materials.push(ringMat);
  const ringGeo=new T.CylinderGeometry(1,1,1,128,1,true);geometries.push(ringGeo);const ring=mesh(ringGeo,ringMat,[0,6,-4],[63,12,63]);ring.castShadow=false;
  const lineGeo=new T.BufferGeometry().setFromPoints(Array.from({length:129},(_,i)=>new T.Vector3(Math.sin(i/128*Math.PI*2),0,Math.cos(i/128*Math.PI*2))));geometries.push(lineGeo);
  const ringLineMat=new T.LineBasicMaterial({color:'#8df0ff'});materials.push(ringLineMat);const ringLine=new T.Line(lineGeo,ringLineMat);scene.add(ringLine);
  const tracerGeo=new T.BufferGeometry(),positions=new Float32Array(80*6),colors=new Float32Array(80*6);tracerGeo.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));tracerGeo.setAttribute('color',new T.BufferAttribute(colors,3).setUsage(T.DynamicDrawUsage));geometries.push(tracerGeo);
  const tracerMat=new T.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.95,depthWrite:false});materials.push(tracerMat);const tracers=new T.LineSegments(tracerGeo,tracerMat);tracers.frustumCulled=false;scene.add(tracers);
  const muzzleMat=new T.MeshBasicMaterial({color:'#ffe39b'});materials.push(muzzleMat);
  const aimRay=new T.Raycaster(),desired=new T.Vector3(),look=new T.Vector3(),right=new T.Vector3(),fwd=new T.Vector3();
  function fighter(id){const root=clone('Survivor'),parts={};for(const name of ['Hip','Upper','Head','LegL','LegR','ShinL','ShinR','GunSocket'])parts[name]=root.getObjectByName(name);const weapons={};for(const [key,name]of [['pistol','Pistol'],['rifle','Rifle'],['scatter','Scatter']])weapons[key]=clone(name,parts.GunSocket);
    if(id){root.traverse(n=>{if(n.isMesh&&n.material?.name==='Field fabric'){n.material=n.material.clone();n.material.color.set(['#775958','#526b75','#706541'][id%3]);materials.push(n.material);}});}
    const flash=mesh(g.cone,muzzleMat,[.08,1.25,-1.06],[.13,.42,.13],root);flash.rotation.x=-Math.PI/2;return {root,parts,weapons,flash};}
  function draw(s,{reduced=false,aiming=false}={}){
    if(destroyed)return;const rect=canvas.getBoundingClientRect(),d=stagePixelRatio(canvas,1.65),w=Math.max(1,Math.round(rect.width*d)),h=Math.max(1,Math.round(rect.height*d));if(size!==`${w}:${h}`){size=`${w}:${h}`;renderer.setPixelRatio(1);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
    frames++;const p=s.player,delta=Math.max(0,Math.min(.05,s.time-lastTime));lastTime=s.time;
    while(fighters.length<s.actors.length)fighters.push(fighter(fighters.length));
    s.actors.forEach((a,i)=>{const {root,parts,weapons,flash}=fighters[i],walk=Math.sin(s.time*(a.speed>6?13:10))*Math.min(1,a.speed/4.5),dead=a.hp===0;root.position.set(a.x,0,a.z);root.rotation.set(dead?-(s.phase==='playing'?Math.min(1,(s.time-a.deadAt)*3):1)*Math.PI/2:0,a.yaw,0);root.position.y=dead?.3:0;
      parts.Hip.position.y=.89+(reduced?0:Math.abs(walk)*.028);parts.Upper.rotation.x=a.fire?-.07:a.heal>0?.2:0;parts.Upper.rotation.z=reduced?0:a.flash*.20;parts.LegL.rotation.x=walk*.65;parts.LegR.rotation.x=-walk*.65;parts.ShinL.rotation.x=Math.max(0,-walk)*.62;parts.ShinR.rotation.x=Math.max(0,walk)*.62;
      parts.GunSocket.position.z=-.35+(reduced?0:a.flash*.8);for(const key of Object.keys(weapons))weapons[key].visible=key===a.weapon;flash.visible=a.flash>0&&!dead;flash.scale.x=flash.scale.z=.09+a.flash;root.visible=true;
    });
    for(const l of s.loot){let item=supplies.get(l.id);if(!item){const name=l.kind==='med'?'MedicalCase':l.kind==='rifle'?'Rifle':l.kind==='scatter'?'Scatter':'AmmoBox',root=clone(name);if(l.kind==='rifle'||l.kind==='scatter'){root.rotation.z=Math.PI/2;root.position.y=.26;}else root.position.y=.03;root.position.x=l.x;root.position.z=l.z;item={root};supplies.set(l.id,item);}item.root.visible=!l.taken;}
    for(const {b,roof}of roofs)roof.visible=!(Math.abs(p.x-b.x)<b.w/2+1&&Math.abs(p.z-b.z)<b.d/2+1);
    ring.position.set(s.zone.x,6,s.zone.z);ring.scale.set(Math.max(.01,s.zone.radius),12,Math.max(.01,s.zone.radius));ringLine.position.set(s.zone.x,.09,s.zone.z);ringLine.scale.setScalar(s.zone.radius);
    let n=0;for(const t of s.traces){if(n>=80)break;positions.set([t.from.x,t.from.y,t.from.z,t.to.x,t.to.y,t.to.z],n*6);const c=t.player?[1,.86,.45]:[1,.42,.17];colors.set([...c,...c],n*6);n++;}tracerGeo.setDrawRange(0,n*2);tracerGeo.attributes.position.needsUpdate=tracerGeo.attributes.color.needsUpdate=true;
    fwd.set(Math.sin(p.yaw)*Math.cos(p.pitch),Math.sin(p.pitch),-Math.cos(p.yaw)*Math.cos(p.pitch));right.set(Math.cos(p.yaw),0,Math.sin(p.yaw));
    look.set(p.x,1.35,p.z).addScaledVector(fwd,28);const distance=aiming?2.6:5.1,shoulder=aiming?.48:.82;
    desired.set(p.x,1.95,p.z).addScaledVector(fwd,-distance).addScaledVector(right,shoulder);desired.y+=aiming?.15:.9;
    const anchor=new T.Vector3(p.x,1.65,p.z),offset=desired.clone().sub(anchor),length=offset.length();aimRay.set(anchor,offset.normalize());aimRay.far=length;scene.updateMatrixWorld(true);const walls=aimRay.intersectObjects(cameraWalls,false);if(walls.length)desired.copy(anchor).addScaledVector(offset,Math.max(.45,walls[0].distance-.3));
    if(!primed||reduced||delta===0){camera.position.copy(desired);primed=true;}else camera.position.lerp(desired,1-Math.exp(-18*delta));camera.lookAt(look);camera.fov=aiming?49:65;camera.updateProjectionMatrix();camera.updateMatrixWorld();
    fighters[0].root.visible=camera.position.distanceTo(anchor)>.8;
    const point=new T.Vector3(s.aim.x,s.aim.y,s.aim.z).project(camera);crosshair={x:(point.x+1)/2,y:(1-point.y)/2};
    sun.position.set(p.x-23,42,p.z+18);sun.target.position.set(p.x,0,p.z-7);sun.target.updateMatrixWorld();renderer.render(scene,camera);drawCalls=renderer.info.render.calls;
  }
  return {draw,dispose,crosshair:()=>crosshair,diagnostics:()=>({renderer:'three-webgl2',frames,drawCalls,models:originals.size,textures:renderer.info.memory.textures,geometries:renderer.info.memory.geometries,actors:fighters.length,camera:{x:camera.position.x,y:camera.position.y,z:camera.position.z},crosshair})};
}
