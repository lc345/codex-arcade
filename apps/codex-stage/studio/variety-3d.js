import { createThree } from "../vendor/three.js";

// A single offscreen Three surface follows the host's RAF and composites into its canvas.
export function createVarietyStage(canvas, config) {
  const T = createThree(), surface = document.createElement("canvas"), c = canvas.getContext("2d"), scene = new T.Scene();
  const camera = new T.OrthographicCamera(-config.width / 2, config.width / 2, config.width * 9 / 32, -config.width * 9 / 32, .1, 100);
  camera.position.set(...config.eye); camera.lookAt(...(config.target || [0, 0, 0])); camera.updateMatrixWorld(); scene.background = new T.Color(config.background);
  const materials = new Map(), geometries = { box: new T.BoxGeometry(1,1,1), ball: new T.SphereGeometry(1,16,12), cylinder: new T.CylinderGeometry(1,1,1,16), cone: new T.ConeGeometry(1,1,4) };
  let renderer, lost = false, disposed = false, draws = 0, size = "";
  scene.add(new T.HemisphereLight(0xffffff, 0x63868b, 2.6)); const sun = new T.DirectionalLight(0xfff1d3, 3); sun.position.set(-5, 12, 8); sun.castShadow = true;
  sun.shadow.mapSize.set(1024,1024); Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: .1, far: 40 }); sun.shadow.normalBias = .025; scene.add(sun);
  const lostContext = e => { e.preventDefault(); lost = true; }; surface.addEventListener("webglcontextlost", lostContext);
  try { renderer = new T.WebGLRenderer({ canvas: surface, antialias: true, alpha: false, powerPreference: "low-power" }); renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap; renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; } catch { lost = true; }
  function mat(color) { if (!materials.has(color)) materials.set(color, new T.MeshStandardMaterial({ color, roughness: .8, metalness: .03 })); return materials.get(color); }
  function shape(parent, kind, color, x, y, z, sx, sy, sz) { const mesh = new T.Mesh(geometries[kind], mat(color)); mesh.position.set(x,y,z); mesh.scale.set(sx,sy,sz); mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh; }
  const box = (p,color,x,y,z,sx,sy,sz) => shape(p,"box",color,x,y,z,sx,sy,sz);
  function group(parent = scene) { const g = new T.Group(); parent.add(g); return g; }
  function project(x,y,z) { const p = new T.Vector3(x,y,z).project(camera); return { x:(p.x+1)*480, y:(1-p.y)*270 }; }
  function point(clientX,clientY) { const r=canvas.getBoundingClientRect(); return { x:(clientX-r.left)*960/r.width,y:(clientY-r.top)*540/r.height }; }
  function planePoint(p, axis = "y") { const ray = new T.Raycaster(); ray.setFromCamera(new T.Vector2(p.x/480-1,1-p.y/270),camera); return ray.ray.intersectPlane(new T.Plane(axis === "y" ? new T.Vector3(0,1,0) : new T.Vector3(0,0,1),0),new T.Vector3()); }
  function text(value,x,y,size,color="#263e47",align="left",weight=600) { c.font=`${weight} ${size}px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif`; c.fillStyle=color; c.textAlign=align; c.textBaseline="middle"; c.fillText(value,x,y); }
  function draw(hud, fallback) {
    if(disposed)return; const r=canvas.getBoundingClientRect(),dpr=Math.min(2,globalThis.devicePixelRatio||1),w=Math.max(1,Math.round((r.width||960)*dpr)),h=Math.round(w*9/16),key=`${w}:${h}`;
    if(size!==key){canvas.width=w;canvas.height=h;renderer?.setSize(w,h,false);size=key;} c.setTransform(w/960,0,0,h/540,0,0);
    if(renderer&&!lost){renderer.render(scene,camera);draws=renderer.info.render.calls;c.drawImage(surface,0,0,960,540);}else{c.fillStyle=config.background;c.fillRect(0,0,960,540);fallback?.();}hud();
  }
  return { T,c,scene,camera,shape,box,group,project,point,planePoint,text,draw,ready:Promise.resolve(),
    get diagnostics(){return{renderer:renderer&&!lost?"three-webgl2":"canvas-fallback",contexts:disposed?0:renderer?1:0,drawCalls:draws,geometries:Object.keys(geometries).length,materials:materials.size};},
    destroy(){if(disposed)return;disposed=true;surface.removeEventListener("webglcontextlost",lostContext);for(const g of Object.values(geometries))g.dispose();for(const m of materials.values())m.dispose();renderer?.dispose();renderer?.forceContextLoss();scene.clear();surface.width=surface.height=1;}
  };
}
