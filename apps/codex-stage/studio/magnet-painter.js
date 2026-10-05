import { createVarietyStage } from "./variety-3d.js";

export function createMagnetPainter(canvas) {
  const k = createVarietyStage(canvas, { width: 26, eye: [10, 22, 28], target: [10, 0, 10], background: "#b8d9db" });
  const { T, c, scene, box, shape, group, text } = k, meshes = new Map(), vehicles = new Map(), scenery = group(), objects = group();
  const wheelGeometry = new T.TorusGeometry(1, .18, 6, 12), wheelMaterial = new T.MeshStandardMaterial({ color: "#273840", roughness: .9 });
  let coreGroup = null, crusher, press, ingots, beacon;
  const unit = n => n / 40;
  function wheel(g, x, y, z, radius) { const m = new T.Mesh(wheelGeometry, wheelMaterial); m.position.set(x, y, z); m.scale.setScalar(radius); m.castShadow = true; g.add(m); }
  function model(kind, color) {
    const g = group(objects);
    if (kind === "nut") { const b = shape(g, "cylinder", color, 0, .09, 0, .2, .18, .2); b.rotation.y = .3; shape(g, "cylinder", "#647480", 0, .187, 0, .07, .015, .07); }
    if (kind === "can") { shape(g, "cylinder", color, 0, .19, 0, .2, .38, .2); shape(g, "cylinder", "#e7eef0", 0, .39, 0, .185, .035, .185); box(g, "#f4f6e8", 0, .2, -.201, .16, .15, .015); }
    if (kind === "tool") { box(g, color, 0, .13, 0, .53, .17, .18); box(g, "#c3d5dd", .27, .13, -.1, .22, .18, .15); box(g, "#c3d5dd", .27, .13, .1, .22, .18, .15); }
    if (kind === "bike") {
      wheel(g, -.39, .26, 0, .25); wheel(g, .39, .26, 0, .25);
      const a = box(g, color, -.1, .48, 0, .7, .07, .075); a.rotation.z = -.6;
      const b = box(g, color, .15, .45, 0, .7, .07, .075); b.rotation.z = .8;
      box(g, "#283c45", -.2, .7, 0, .22, .06, .17); box(g, color, .42, .68, 0, .06, .65, .06); box(g, "#283c45", .42, 1, 0, .06, .05, .34);
    }
    if (kind === "vending") {
      box(g, color, 0, .66, 0, .82, 1.32, .62); box(g, "#213c4b", 0, .7, -.322, .56, .8, .02);
      for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) box(g, ["#f5bb50", "#f07262", "#f8f0d0"][col], -.18 + col * .18, .46 + row * .2, -.345, .08, .13, .025);
      box(g, "#eef5e0", 0, 1.16, -.335, .6, .11, .04); box(g, "#283a47", 0, .16, -.335, .42, .09, .04);
    }
    if (kind === "car" || kind === "bus" || kind === "truck") {
      const bus = kind === "bus", truck = kind === "truck", length = truck ? 5.4 : bus ? 3.3 : 2.1, height = bus ? 1.75 : .6;
      box(g, color, 0, .42, 0, length, .52, .85); box(g, bus ? "#f9edd3" : color, -.07, .83, 0, length * .7, height, .79);
      for (const z of [-.405, .405]) { for (let j = 0; j < (bus ? 5 : 2); j++) box(g, "#315865", -.8 * (bus ? 1 : .4) + j * (bus ? .37 : .52), .95, z, bus ? .27 : .37, .37, .025); }
      for (const x of [-length * .33, length * .33]) for (const z of [-.45, .45]) wheel(g, x, .23, z, .23);
      box(g, "#f5da74", length / 2 + .02, .42, 0, .035, .17, .58);
      if (bus) for (const z of [-.406, .406]) for (let j = 0; j < 5; j++) box(g, "#315865", -.9 + j * .42, 1.48, z, .3, .28, .025);
      if (truck) { box(g, "#eceee5", -.65, 1.08, 0, 3.6, 1.75, 1.65); box(g, color, 1.9, .9, 0, 1.15, 1.6, 1.5); box(g, "#32566a", 2.485, 1.15, 0, .025, .65, 1.3); for (const z of [-.83, .83]) for (const x of [-1.9, -1.3, 1.9]) wheel(g, x, .32, z, .31); }
    }
    if (kind === "magnet") {
      box(g, "#213b4a", 0, .18, 0, 1, .22, .9);
      for (const z of [-.45, .45]) { box(g, "#24323b", 0, .12, z, .9, .24, .18); for (let j = 0; j < 5; j++) box(g, "#718692", -.35 + j * .18, .14, z * 1.19, .055, .18, .02); }
      box(g, "#e84846", -.28, .47, 0, .28, .5, .92);
      for (const z of [-.31, .31]) { box(g, "#e84846", .05, .47, z, .64, .5, .27); box(g, "#f5f6e9", .41, .47, z, .2, .5, .27); }
      shape(g, "cylinder", "#efc647", -.25, .82, 0, .13, .18, .13);
    }
    return g;
  }
  function build(s) {
    box(scenery, "#85bda9", 35, -.3, 19.5, 78, .4, 48);
    box(scenery, "#c4cecb", 35, -.03, 19.5, 70, .2, 39);
    for (const road of s.roads) {
      box(scenery, road.y === 1260 ? "#93a4aa" : "#879aa5", unit(road.x), .085, unit(road.y), unit(road.w), .04, unit(road.h));
      const length = unit(road.axis === "x" ? road.w : road.h);
      for (let j = -length/2 + 1; j < length/2; j += 1.8) { const x = unit(road.x) + (road.axis === "x" ? j : 0), z = unit(road.y) + (road.axis === "y" ? j : 0); box(scenery, "#e8e5cc", x, .12, z, road.axis === "x" ? .7 : .075, .012, road.axis === "y" ? .7 : .075); }
    }
    // River, bridge deck and crash rails describe the actual water colliders.
    box(scenery, "#55a8bd", 67.8, .085, 19.5, 4.5, .035, 39);
    box(scenery, "#d0cbc0", 67, .14, 9.75, 6, .18, 10.6);
    for (const z of [4.5,15]) { box(scenery, "#3d6370", 67, .62, z, 6, .17, .12); for (let x = 64; x < 70; x += .9) box(scenery, "#7c9290", x, .35, z, .1, .7, .1); }
    for (let j = 0; j < 7; j++) { box(scenery, "#eae8db", 33, .135, 17 + j * .9, 1.2, .01, .4); box(scenery, "#eae8db", 39.5, .135, 17 + j * .9, 1.2, .01, .4); }
    for (const x of [33,39.5]) for (const z of [16.2,23]) { box(scenery, "#3c5460", x, 1.4, z, .1, 2.8, .1); box(scenery, "#2a4857", x, 2.85, z, .35, .85, .32); shape(scenery, "ball", "#eb7953", x, 3, z-.19, .095,.095,.035); shape(scenery, "ball", "#a2d491", x, 2.65, z-.19, .095,.095,.035); }
    for (const o of s.obstacles.filter(o => o.kind !== "edge")) {
      const x = unit(o.x), z = unit(o.y), w = unit(o.w), d = unit(o.h);
      if (o.kind === "water") continue;
      if (o.kind === "bollard") { box(scenery, "#f0c245", x, .6, z, w, 1.2, d); box(scenery, "#314551", x, .65, z, w + .02, .23, d + .02); continue; }
      const color = o.x < 1500 ? "#799bce" : "#e79279", height = o.y < 300 ? 3.3 : 1.6;
      box(scenery, color, x, height/2, z, w, height, d); box(scenery, "#e6ebe1", x, height+.06, z, w+.2, .2, d+.2);
      for (let j = 0; j < 4; j++) { box(scenery, "#334f5c", x-w*.36+j*w*.24, .8, z+d/2+.02, w*.15, 1.1, .05); box(scenery, j%2 ? "#faf1d8" : "#e96359", x-w*.36+j*w*.24, 1.5, z+d/2+.22, w*.24, .12, .6); if(height>2) box(scenery,"#d1e8de",x-w*.36+j*w*.24,2.6,z+d/2+.025,w*.15,.6,.06); }
      box(scenery, "#577986", x+.5, height+.4, z, .9, .5, .8);
    }
    for (let j = 0; j < 19; j++) { const x = 2+j*3.4, z = j%2 ? 37.8 : 1.5; box(scenery,"#56776c",x,.4,z,.13,.8,.13); shape(scenery,"ball",j%2 ? "#538a6a" : "#7cab74",x,1.15,z,.55,.65,.5); }
    for (let j = 0; j < 7; j++) box(scenery,"#d9e4df",56+j,.125,25,.035,.01,3.1);
    const dx = unit(s.depot.x), dz = unit(s.depot.y);
    box(scenery,"#94b6a3",dx,.095,dz,unit(s.depot.w),.06,unit(s.depot.h));
    for (const z of [dz-7.3,dz+7.3]) box(scenery,"#f0ce5a",dx,.16,z,14.6,.08,.12);
    for (const x of [dx-7.3,dx+7.3]) box(scenery,"#f0ce5a",x,.16,dz,.12,.08,14.6);
    crusher = group(scenery); crusher.position.set(dx,0,dz-5.5);
    box(crusher,"#354e57",0,.3,0,5,.6,2.7); box(crusher,"#32464d",0,.63,0,3.4,.08,2.3);
    for (const x of [-2.2,2.2]) box(crusher,"#d5a336",x,1.65,0,.4,3.3,2.4);
    press = group(crusher); box(press,"#f0bd46",0,3.1,0,4.4,.45,2.4); for (let j=0;j<7;j++) { const b=box(press,"#364b52",-1.6+j*.5,3.34,-1.21,.23,.14,.04); b.rotation.z=.55; }
    beacon = shape(crusher,"ball","#8ddfc6",2.2,3.7,0,.14,.2,.14);
    ingots = group(scenery); ingots.position.set(dx+4,0,dz-5.5); ingots.visible=false;
    for(let j=0;j<6;j++) box(ingots,j%2?"#839dad":"#c2cbd0",(j%3)*.5, .2+Math.floor(j/3)*.4,0,.47,.38,.65);
    coreGroup = model("magnet", "#e84846");
    for (const i of s.items) meshes.set(i.id, model(i.kind, i.color));
    for (const t of s.traffic) { const g=model(t.kind,t.color); if(t.kind==="car") { box(g,"#f2f0d9",.35,1.35,0,.25,.16,.5); box(g,"#f6edb2",1.065,.5,0,.02,.12,.62); } vehicles.set(t.id,g); }
    const sun=scene.children.find(n=>n.isDirectionalLight); if(sun) scene.add(sun.target);
  }
  const projectWorld = (x, y, height = 0) => k.project(unit(x), height, unit(y));
  function draw(world, { reduced = false, stopped = false } = {}) {
    const s = world.scene, compact = canvas.getBoundingClientRect().width < 600; if (!coreGroup) build(s);
    const width = s.camera.width / 40, cx = unit(s.camera.x), cz = unit(s.camera.y);
    Object.assign(k.camera, { left: -width / 2, right: width / 2, top: width * 9 / 32, bottom: -width * 9 / 32 });
    k.camera.position.set(cx, 24, cz + 18); k.camera.lookAt(cx, 0, cz); k.camera.updateProjectionMatrix(); k.camera.updateMatrixWorld();
    const sun=scene.children.find(n=>n.isDirectionalLight); if(sun) { sun.position.set(cx-6,18,cz+8); sun.target.position.set(cx,0,cz); sun.target.updateMatrixWorld(); }
    coreGroup.position.set(unit(s.player.x), .15, unit(s.player.y)); coreGroup.rotation.y = -s.player.angle;
    const recycle=s.deliveryProgress, pull=Math.min(1,recycle*2.5);
    for (const i of s.items) {
      const g = meshes.get(i.id), delivered=s.delivered&&i.attached;
      g.visible=!delivered||recycle<.75;g.scale.setScalar(delivered?Math.max(.06,1-Math.max(0,recycle-.32)*2):1);
      g.position.set(unit(delivered?i.x+(s.depot.x-i.x)*pull:i.x), i.attached ? .24 : .13, unit(delivered?i.y+(s.depot.y-220-i.y)*pull:i.y));
      g.rotation.y=-i.angle;g.rotation.z=i.attached&&!reduced?Math.sin(i.id+s.time*.004)*.025:0;
    }
    press.position.y=s.delivered?-Math.sin(Math.min(1,Math.max(0,(recycle-.25)/.55))*Math.PI)*2.3:0;
    ingots.visible=s.delivered&&recycle>.7;ingots.scale.setScalar(s.delivered?Math.min(1,Math.max(0,(recycle-.7)/.2)):1);
    beacon.scale.setScalar(reduced||stopped?1:1+Math.sin(s.time*.006)*.15);
    for(const t of s.traffic) { const g=vehicles.get(t.id);g.visible=t.visible;g.position.set(unit(t.x),.16,unit(t.y));g.rotation.y=-t.angle; }
    k.draw(() => {
      for(const [name,x,y]of [["回收厂",320,250],["商业街",1480,330],["河岸桥",2450,230]]) { const q=projectWorld(x,y,1);if(q.x>70&&q.x<890&&q.y>100&&q.y<510) text(name,q.x,q.y,17,"#355764","center",750); }
      const truck=s.traffic.find(t=>t.kind==="truck");
      if(truck?.warning) { const q=projectWorld(truck.lane,780,.2); if(q.x>0&&q.x<960&&q.y>100&&q.y<510) { c.fillStyle="rgba(239,180,62,.22)";c.fillRect(q.x-34,85,68,455);text("货车接近",q.x,Math.max(112,q.y-85),18,"#76491b","center",800); } }
      if (!reduced) {
        for (const i of s.items) if (!s.delivered && !i.attached && i.eligible && Math.hypot(i.x - s.player.x, i.y - s.player.y) < s.radius + i.r + 85) {
          const a = projectWorld(s.player.x, s.player.y, .3), b = projectWorld(i.x, i.y, .3); c.strokeStyle = "rgba(66,143,140,.34)"; c.lineWidth = 1.5; c.setLineDash([4, 8]); c.lineDashOffset = -s.time * .025;
          c.beginPath(); c.moveTo(a.x, a.y); c.quadraticCurveTo((a.x + b.x) / 2 + 9, (a.y + b.y) / 2 - 9, b.x, b.y); c.stroke(); c.setLineDash([]);
        }
        for (const [n, t] of s.tracks.entries()) { const p = projectWorld(t.x, t.y); c.globalAlpha = n / s.tracks.length * .12; c.fillStyle = "#233f4c"; c.beginPath(); c.ellipse(p.x, p.y, 4, 2, 0, 0, Math.PI * 2); c.fill(); } c.globalAlpha = 1;
        for (const p of s.sparks) { const q = projectWorld(p.x, p.y, .6); c.globalAlpha = Math.min(1, p.life * 3); c.fillStyle = p.color; c.fillRect(q.x - 2, q.y - 2, 4, 4); } c.globalAlpha = 1;
      }
      const labels = [];
      for (const p of s.popups) { const q = projectWorld(p.x, p.y, 1.3); let y = q.y - (reduced ? 0 : (1 - p.life) * 22); while (labels.some(v => Math.abs(v.x - q.x) < 55 && Math.abs(v.y - y) < 26)) y -= 27; if (y < 90) continue; labels.push({ x: q.x, y }); c.globalAlpha = Math.min(1, p.life * 3); text(p.text, q.x, y, p.large ? 23 : 17, "#203f4b", "center", 800); } c.globalAlpha = 1;
      const p = projectWorld(s.player.x, s.player.y, 1.2); c.strokeStyle = "#f9f7df"; c.lineWidth = 2; c.beginPath(); c.moveTo(p.x - 5, p.y - 11); c.lineTo(p.x, p.y - 5); c.lineTo(p.x + 5, p.y - 11); c.stroke();
      const next = s.items.filter(i => !i.attached && i.need > s.power).sort((a, b) => a.need - b.need)[0];
      if (next) { const q = projectWorld(next.x, next.y, 1.6); if (q.x > 30 && q.x < 920 && q.y > 90 && q.y < 490) { text(`${next.need}`, q.x, q.y, 14, "#364852", "center", 800); c.strokeStyle = "#364852"; c.strokeRect(q.x - 20, q.y - 5, 8, 7); c.beginPath(); c.arc(q.x - 16, q.y - 7, 3, Math.PI, 0); c.stroke(); } }
      const bus=s.items.find(i=>i.kind==="bus"), returning=bus.attached;
      const goal=returning?s.depot:s.power>=180?bus:s.items.filter(i=>i.eligible&&!i.attached).sort((a,b)=>Math.hypot(a.x-s.player.x,a.y-s.player.y)-Math.hypot(b.x-s.player.x,b.y-s.player.y))[0];
      if(goal&&!s.delivered) {
        const q=projectWorld(goal.x,goal.y,1.6),x=Math.max(55,Math.min(900,q.x)),y=Math.max(104,Math.min(355,q.y));
        const off=q.x!==x||q.y!==y,angle=Math.atan2(q.y-270,q.x-480);c.save();c.translate(x,y);c.rotate(off?angle:Math.PI/2);c.fillStyle=returning?"#267a67":"#b04b3d";c.beginPath();c.moveTo(9,0);c.lineTo(-5,-6);c.lineTo(-5,6);c.closePath();c.fill();c.restore();
        text(returning?"回收厂":s.power>=180?(s.mode==="recover"?"接回巴士":"废弃巴士"):"金属",x,y+21,compact?22:15,returning?"#267a67":"#923d31","center",800);
      }
      // A schematic map keeps the distant destination visible while the camera follows the rover.
      const mx=18,my=382,mw=188,mh=116,mapX=x=>mx+x/s.city.width*mw,mapY=y=>my+y/s.city.height*mh;
      c.fillStyle="rgba(238,246,237,.95)";c.fillRect(mx-5,my-5,mw+10,mh+10);c.fillStyle="#b5c6c3";c.fillRect(mx,my,mw,mh);
      for(const r of s.roads){c.fillStyle="#839ba5";c.fillRect(mapX(r.x-r.w/2),mapY(r.y-r.h/2),r.w/s.city.width*mw,r.h/s.city.height*mh);}
      for(const o of s.obstacles){c.fillStyle=o.kind==="water"?"#58a6bf":"#5e7377";c.fillRect(mapX(o.x-o.w/2),mapY(o.y-o.h/2),o.w/s.city.width*mw,o.h/s.city.height*mh);}
      if(returning&&!s.delivered){c.strokeStyle="#f4d568";c.lineWidth=2;c.setLineDash([3,3]);c.beginPath();[[2390,390],[2390,1260],[520,1260],[320,390]].forEach(([x,y],n)=>n?c.lineTo(mapX(x),mapY(y)):c.moveTo(mapX(x),mapY(y)));c.stroke();c.setLineDash([]);}
      c.fillStyle="#286c5c";c.fillRect(mapX(s.depot.x)-4,mapY(s.depot.y)-4,8,8);c.fillStyle="#ffc644";c.fillRect(mapX(bus.x)-4,mapY(bus.y)-3,8,6);
      for(const t of s.traffic.filter(t=>t.visible)){c.fillStyle="#eb6658";c.fillRect(mapX(t.x)-2,mapY(t.y)-2,4,4);}
      c.fillStyle="#fffdf1";c.strokeStyle="#d94140";c.lineWidth=2;c.beginPath();c.arc(mapX(s.player.x),mapY(s.player.y),4,0,Math.PI*2);c.fill();c.stroke();
      c.fillStyle = "rgba(240,247,242,.94)"; c.fillRect(0, 0, 960, compact ? 72 : 63); c.fillStyle = "#e8534c"; c.fillRect(0, 0, 5, compact ? 72 : 63);
      if (compact) {
        text("磁力暴走", 24, 36, 31, "#244652", "left", 850); text(`磁力 ${s.power}`, 400, 36, 31, "#d24d43", "center", 850);
        text(s.delivered?"已交付":returning?"拖回工厂":"回收巴士",655,36,27,"#388c7b","center");text(`${s.progress}/3`,930,36,30,"#244652","right",800);
      } else {
      text("磁力暴走", 24, 24, 22, "#244652", "left", 850); text("CITY HAUL / 城市大搬家", 25, 47, 10, "#597278");
      text(String(s.power).padStart(3, "0"), 250, 28, 30, "#d24d43", "right", 850); text("磁力", 263, 33, 12, "#597278");
      const labels=["01 收集金属","02 接上巴士","03 送回工厂"];
      for(let j=0;j<3;j++){const x=340+j*157,done=s.progress>j;c.fillStyle=done?"#388c7b":"#c4d5d5";c.fillRect(x,24,134,3);text(labels[j],x+67,43,12,done?"#286e63":"#657d80","center");}
      text(`${s.collected} 件`, 930, 29, 18, "#244652", "right", 800);
      }
      if(s.delivered){c.fillStyle="rgba(240,247,242,.95)";c.fillRect(242,416,514,83);text(s.phase==="won"?"巴士回厂，整城收工。":"咔嚓！正在拆解巴士",499,446,25,"#264c51","center",850);text(`回收 ${s.collected} 件 / 磁力 ${s.power}`,499,479,15,"#426e6c","center");}
      if (stopped) { c.fillStyle = "rgba(240,247,242,.93)"; c.fillRect(356, 490, 248, 32); text("任务完成 · 已保存", 480, 506, 14, "#244652", "center"); }
    }, () => {
      // Same projection and hit mapping without WebGL, preserving the playable world.
      c.fillStyle = "#a4b7ba"; c.fillRect(0, 0, 960, 540);
      for(const r of s.roads){const p=projectWorld(r.x,r.y);c.fillStyle="#849ba6";c.fillRect(p.x-r.w/s.camera.width*480,p.y-r.h/s.camera.width*384,r.w/s.camera.width*960,r.h/s.camera.width*768);}
      for (const o of s.obstacles) { const p = projectWorld(o.x, o.y); c.fillStyle = o.kind === "water" ? "#58a6bf" : o.kind === "shop" ? "#829aca" : "#ecc954"; c.fillRect(p.x - o.w / s.camera.width * 480, p.y - o.h / s.camera.width * 384, o.w / s.camera.width * 960, o.h / s.camera.width * 768); }
      for (const i of s.items) { if(s.delivered&&i.attached)continue;const p = projectWorld(i.x, i.y); c.fillStyle = i.color; c.strokeStyle = i.attached ? "#f5f4e8" : "#48616d"; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y, Math.max(4, i.r / s.camera.width * 960), 0, Math.PI * 2); c.fill(); c.stroke(); }
      for(const t of s.traffic.filter(t=>t.visible)){const p=projectWorld(t.x,t.y);c.fillStyle=t.color;c.strokeStyle="#fff7d2";c.lineWidth=2;const w=t.w/s.camera.width*960,h=t.h/s.camera.width*768;c.fillRect(p.x-w/2,p.y-h/2,w,h);c.strokeRect(p.x-w/2,p.y-h/2,w,h);}
      const d=projectWorld(s.depot.x,s.depot.y);c.strokeStyle="#39755e";c.lineWidth=4;c.strokeRect(d.x-100,d.y-80,200,160);
      const p = projectWorld(s.player.x, s.player.y); c.save(); c.translate(p.x, p.y); c.rotate(s.player.angle); c.strokeStyle = "#e84846"; c.lineWidth = 8; c.beginPath(); c.moveTo(10, -10); c.lineTo(-10, -10); c.lineTo(-10, 10); c.lineTo(10, 10); c.stroke(); c.restore();
    });
  }
  return { draw, ready: k.ready, projectWorld,
    point(x, y) { const p = k.point(x, y), hit = k.planePoint(p); return { ...p, worldX: hit ? hit.x * 40 : NaN, worldY: hit ? hit.z * 40 : NaN }; },
    get diagnostics() { return k.diagnostics; },
    destroy() { wheelGeometry.dispose(); wheelMaterial.dispose(); k.destroy(); meshes.clear(); vehicles.clear(); },
  };
}
