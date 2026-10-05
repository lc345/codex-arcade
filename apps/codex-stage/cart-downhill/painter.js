import {createThree} from '../vendor/three.js';
import {roadAt} from './world.js';
import {stagePixelRatio} from '../packs/render-budget.js';

export async function createCartPainter(canvas,{signal}={}){
  const T=createThree(),scene=new T.Scene(),camera=new T.PerspectiveCamera(52,16/9,.1,420);
  scene.background=new T.Color('#acddea');
  const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const materials=[],geometries=[],textures=[],sets=[];let destroyed=false,size='',frames=0,drawCalls=0,primed=false;
  const mat=(color,roughness=.85)=>{const m=new T.MeshStandardMaterial({color,roughness});materials.push(m);return m;};
  const material={grass:mat('#74a558'),road:mat('#637c88'),walk:mat('#e9e4d6'),line:mat('#fafaf1'),sea:mat('#3aafbf',.26),pole:mat('#f9f7e9'),sign:mat('#e95243'),wood:mat('#587f76')};
  const geo={box:new T.BoxGeometry(1,1,1),ball:new T.SphereGeometry(1,20,12),cylinder:new T.CylinderGeometry(1,1,1,16)};geometries.push(...Object.values(geo));
  const mesh=(g,m,at,scale,parent=scene)=>{const n=new T.Mesh(g,m);n.position.set(...at);n.scale.set(...scale);n.castShadow=n.receiveShadow=true;parent.add(n);return n;};
  const box=(m,at,scale,p)=>mesh(geo.box,m,at,scale,p);
  const group=()=>{const g=new T.Group();scene.add(g);return g;};
  const sky=new T.HemisphereLight(0xd9f2ff,0x608554,2.5);scene.add(sky);
  const sun=new T.DirectionalLight(0xffecce,3.4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
  Object.assign(sun.shadow.camera,{left:-24,right:24,top:28,bottom:-28,near:1,far:95});sun.shadow.normalBias=.09;sun.shadow.bias=-.0003;scene.add(sun,sun.target);
  function ribbon(inner,outer,m,y=0){const a=[];for(let d=-14;d<289;d+=2){const r=roadAt(d),r2=roadAt(d+2);const p=[[r.center+inner,r.height+y,-d],[r.center+outer,r.height+y,-d],[r2.center+inner,r2.height+y,-d-2],[r2.center+outer,r2.height+y,-d-2]];for(const i of [0,1,2,1,3,2])a.push(...p[i]);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(a,3));g.computeVertexNormals();geometries.push(g);const n=new T.Mesh(g,m);n.receiveShadow=true;scene.add(n);}
  ribbon(-28,18,material.grass,-.24);ribbon(-5.5,5.5,material.road,.012);ribbon(-6.5,-5.5,material.walk,.055);ribbon(5.5,6.5,material.walk,.055);
  ribbon(-5.43,-5.34,material.line,.025);ribbon(5.34,5.43,material.line,.025);
  box(material.sea,[90,7,-160],[180,.15,620]);
  for(let d=0;d<250;d+=5){const r=roadAt(d);const n=box(material.line,[r.center,r.height+.026,-d],[.10,.012,1.8]);n.rotation.x=-.065;}
  // The coastline and high rear terrain are world geometry, not a flat background plate.
  for(let j=0;j<10;j++)mesh(geo.ball,material.grass,[-35-j%3*13,7,-j*35],[14,18+(j%3)*4,27]);
  function placard(text,color='#d64d41',width=512){const c=document.createElement('canvas');c.width=width;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,width,128);ctx.fillStyle='#fffef3';ctx.font='bold 50px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,width/2,67);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;textures.push(tx);const m=new T.MeshBasicMaterial({map:tx,side:T.DoubleSide});materials.push(m);return m;}
  const signGeometry=new T.PlaneGeometry(1,1);geometries.push(signGeometry);
  for(const [d,label]of [[5,'BON VOYAGE'],[89,'MARCHE'],[180,'PORT AZUR']]){const r=roadAt(d);for(const x of [-5.8,5.8])box(material.pole,[r.center+x,r.height+3,-d],[.14,6,.14]);mesh(signGeometry,placard(label),[r.center,r.height+5.7,-d],[7,1.4,1]);}
  const end=roadAt(261);box(material.walk,[end.center,end.height-.05,-263],[20,.25,28]);
  for(let i=0;i<8;i++){box(i%2?material.sign:material.pole,[-3.5+i,end.height+.075,-254],[.9,.025,.9]);}
  mesh(signGeometry,placard('HAPPY BIRTHDAY','#276961'),[0,end.height+4.6,-276],[9,1.7,1]);
  box(material.wood,[0,end.height+.8,-273],[3,.2,1.5]);for(const x of [-1.25,1.25])box(material.wood,[x,end.height+.35,-273],[.15,.7,1.2]);
  // Bunting is made from simple triangular fabric pieces and stays readable without animation.
  const tg=new T.BufferGeometry();tg.setAttribute('position',new T.Float32BufferAttribute([-.2,0,0,.2,0,0,0,-.45,0],3));tg.computeVertexNormals();geometries.push(tg);
  for(let j=0;j<24;j++){const m=mat(['#f5ce4b','#e96d82','#418eae','#f8f4e4'][j%4]);m.side=T.DoubleSide;mesh(tg,m,[-8+j*.7,end.height+3.1,-270],[1,1,1]);}
  let gltf;
  try{const res=await fetch(new URL('./assets/seaside.glb',import.meta.url),{signal});if(!res.ok)throw new Error('Missing local models');const data=await res.arrayBuffer();gltf=await new Promise((resolve,reject)=>new T.GLTFLoader().parse(data,'',resolve,reject));if(signal?.aborted)throw new DOMException('Stopped','AbortError');}
  catch(error){dispose();throw error;}
  gltf.scene.traverse(n=>{if(n.isMesh){geometries.push(n.geometry);materials.push(...(Array.isArray(n.material)?n.material:[n.material]));n.castShadow=n.receiveShadow=true;}});
  const originals=new Map(gltf.scene.children.map(n=>[n.name,n]));
  const model=name=>{const source=originals.get(name);if(!source)throw new Error('Model missing: '+name);const n=source.clone(true);scene.add(n);return n;};
  const cart=model('Cart'),person=model('Shopper'),wheels=[];
  cart.traverse(n=>{if(!n.isMesh&&n.name.startsWith('Wheel_'))wheels.push({n,base:n.position.clone()});});
  const head=person.getObjectByName('Head'),body=person.getObjectByName('Body'),left=person.getObjectByName('LegL'),right=person.getObjectByName('LegR');
  const cloth=document.createElement('canvas');cloth.width=cloth.height=128;const cx=cloth.getContext('2d');cx.fillStyle='#bccbdc';cx.fillRect(0,0,128,128);cx.strokeStyle='#e0e5ed';cx.lineWidth=1;for(let i=0;i<128;i+=4){cx.beginPath();cx.moveTo(i,0);cx.lineTo(i,128);cx.moveTo(0,i);cx.lineTo(128,i);cx.stroke();}const fabric=new T.CanvasTexture(cloth);fabric.colorSpace=T.SRGBColorSpace;textures.push(fabric);
  person.traverse(n=>{if(n.isMesh&&n.material.name==='Woven indigo'){n.material.map=fabric;n.material.needsUpdate=true;}});
  const cargoMeshes=[],propMeshes=[],cars=[];
  function tint(h,index){h.traverse(n=>{if(n.isMesh&&n.material.name==='Turquoise plaster'){n.material=n.material.clone();n.material.color.set(['#67aaa1','#e89e86','#e1c86b','#86b3ca','#eee9d5'][index%5]);materials.push(n.material);}});}
  for(let d=12,i=0;d<246;d+=16,i++){const r=roadAt(d);const house=model('House');house.position.set(r.center-10,r.height-.3,-d);house.rotation.y=Math.PI/2;const sc=.82+(d%3)*.14;house.scale.setScalar(sc);tint(house,i);sets.push({n:house,d});
    if(d<145){const h=model('House');h.position.set(r.center+10,r.height-.3,-d-6);h.rotation.y=-Math.PI/2;h.scale.setScalar(.83);tint(h,i+2);sets.push({n:h,d:d+6});}
  }
  for(const [d,side]of [[104,-1],[118,1],[149,-1],[161,1]]){const r=roadAt(d),g=model('Stall');g.position.set(r.center+side*5.3,r.height,-d);g.rotation.y=side*Math.PI/2;sets.push({n:g,d});}
  for(let d=14;d<250;d+=15){const r=roadAt(d),g=group();g.position.set(r.center+6.3,r.height,-d);box(material.pole,[0,1.8,0],[.09,3.6,.09],g);const lamp=box(material.sign,[-.3,3.65,0],[.75,.14,.38],g);lamp.rotation.z=.08;sets.push({n:g,d});}
  const pose=(n,p)=>{n.position.set(p.p.x,p.p.y,p.p.z);n.quaternion.set(p.q.x,p.q.y,p.q.z,p.q.w);};
  function draw(s,{reduced=false}={}){
    if(destroyed)return;frames++;
    const r=canvas.getBoundingClientRect(),pixel=stagePixelRatio(canvas,1.75),w=Math.max(1,Math.round(r.width*pixel)),h=Math.max(1,Math.round(r.height*pixel));
    if(size!==w+':'+h){size=w+':'+h;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
    pose(cart,s.cart);pose(person,s.cart);
    const cadence=reduced?0:Math.sin(s.distance*4);left.rotation.x=cadence*.35*Math.min(1,s.speed/4);right.rotation.x=-left.rotation.x;
    body.rotation.z=-s.steer*.10;body.rotation.x=s.braking?.12:0;head.rotation.y=s.hit>.1?.5:Math.sin(s.time*.7)*.10;
    wheels.forEach(({n,base},i)=>{const w=s.wheels[i];n.position.y=-.1-(w?.length??.28);n.rotation.y=w?.steer??0;n.rotation.x=w?.rotation??0;});
    while(cargoMeshes.length<s.cargo.length)cargoMeshes.push(model(s.cargo[cargoMeshes.length].id==='cake'?'Cake':s.cargo[cargoMeshes.length].id==='orange'?'Orange':'Crate'));
    s.cargo.forEach((p,i)=>{pose(cargoMeshes[i],p);if(p.id!=='cake')cargoMeshes[i].scale.setScalar(p.r/(p.id==='orange'?.27:.29));});
    while(propMeshes.length<s.props.length)propMeshes.push(model(s.props[propMeshes.length].id==='orange'?'Orange':'Crate'));
    s.props.forEach((p,i)=>{pose(propMeshes[i],p);propMeshes[i].visible=Math.abs(-p.p.z-s.distance)<58;});
    while(cars.length<s.traffic.length)cars.push(model('TrafficCar'));
    s.traffic.forEach((p,i)=>{pose(cars[i],p);cars[i].visible=Math.abs(p.d-s.distance)<65;});
    sets.forEach(({n,d})=>n.visible=d>s.distance-20&&d<s.distance+80);
    const p=s.cart.p,front=roadAt(s.distance+12),dir=new T.Vector3(front.center-p.x,0,-12).normalize();
    // Portrait uses a tighter shoulder offset and more distance to retain the entire cart.
    const narrow=Math.max(0,Math.min(1,(1.2-camera.aspect)/.65)),behind=8+narrow*2,shoulder=2.7-narrow*1.9;
    const eye=new T.Vector3(p.x-dir.x*behind-dir.z*shoulder,p.y+5.1+narrow*.7,p.z-dir.z*behind+dir.x*shoulder),look=new T.Vector3(p.x+dir.x*10,roadAt(s.distance+10).height+.8,p.z+dir.z*10);
    if(!primed){camera.position.copy(eye);primed=true;}else camera.position.lerp(eye,.18);
    camera.lookAt(look);camera.updateMatrixWorld();sun.position.set(p.x-15,p.y+28,p.z+8);sun.target.position.set(p.x,p.y,p.z-13);sun.target.updateMatrixWorld();
    renderer.render(scene,camera);drawCalls=renderer.info.render.calls;
  }
  function dispose(){if(destroyed)return;destroyed=true;new Set(geometries).forEach(g=>g.dispose());new Set(materials).forEach(m=>m.dispose());new Set(textures).forEach(t=>t.dispose());scene.clear();renderer.dispose();renderer.forceContextLoss();}
  function subjectFrame(){
    const frame={left:1,right:-1,bottom:1,top:-1};
    for(const root of [cart,person])root.traverse(n=>{
      if(!n.isMesh)return;if(!n.geometry.boundingBox)n.geometry.computeBoundingBox();const bounds=n.geometry.boundingBox;
      for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
        const p=new T.Vector3(x,y,z).applyMatrix4(n.matrixWorld).project(camera);frame.left=Math.min(frame.left,p.x);frame.right=Math.max(frame.right,p.x);frame.bottom=Math.min(frame.bottom,p.y);frame.top=Math.max(frame.top,p.y);
      }
    });
    return frame;
  }
  return {draw,dispose,diagnostics:()=>({renderer:'three-webgl2',frames,drawCalls,models:originals.size,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,subjectFrame:subjectFrame()})};
}
