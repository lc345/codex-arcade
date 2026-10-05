import { createThree } from "../vendor/three.js";

export function createAppliancePainter(canvas) {
  const T = createThree(), c = canvas.getContext("2d"), surface = document.createElement("canvas"), scene = new T.Scene();
  const camera = new T.OrthographicCamera(-13.9, 13.9, 7.82, -7.82, .1, 70);
  camera.position.set(10, 18, 20); camera.lookAt(0, .25, 0); camera.updateMatrixWorld();
  const geometries = new Set(), materials = new Set(), textures = new Set(), models = new Map(), pickables = [];
  const ray = new T.Raycaster(), floorPlane = new T.Plane(new T.Vector3(0, 1, 0), 0);
  let renderer, lost = false, destroyed = false, current, draws = 0;
  const box = new T.BoxGeometry(1, 1, 1), cylinder = new T.CylinderGeometry(1, 1, 1, 24), sphere = new T.SphereGeometry(1, 16, 10);
  [box, cylinder, sphere].forEach(g => geometries.add(g));
  function mat(color, options = {}) { const m = new T.MeshStandardMaterial({ color, roughness: .56, metalness: .12, ...options }); materials.add(m); return m; }
  const white = mat(0xf5f5ec), teal = mat(0x2caaa1), red = mat(0xe64945), yellow = mat(0xfbd546), ink = mat(0x243840), rubber = mat(0x243840, { roughness: .93 }), steel = mat(0xaebcbe, { metalness: .65 }), blue = mat(0x659ee8), lime = mat(0xc3ed75), pink = mat(0xed9ebd);
  const glow = mat(0xf8e289, { emissive: 0xf8d05c, emissiveIntensity: .5 });
  function mesh(parent, geo, material, x, y, z, sx, sy, sz) { const o = new T.Mesh(geo, material); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; }
  const cube = (p, m, x, y, z, w, h, d) => mesh(p, box, m, x, y, z, w, h, d);
  const tube = (p, m, x, y, z, r, h) => mesh(p, cylinder, m, x, y, z, r, h, r);
  const ball = (p, m, x, y, z, r) => mesh(p, sphere, m, x, y, z, r, r, r);
  function rod(p, m, a, b, r = .05) { const v = new T.Vector3(...b).sub(new T.Vector3(...a)), o = tube(p, m, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, r, v.length()); o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v.normalize()); return o; }
  function placard(text, color, bg, width, height) {
    const a = document.createElement("canvas"); a.width = 384; a.height = 96; const d = a.getContext("2d"); d.fillStyle = bg; d.fillRect(0, 0, 384, 96); d.fillStyle = color; d.textAlign = "center"; d.textBaseline = "middle"; d.font = "800 46px system-ui"; d.fillText(text, 192, 50);
    const texture = new T.CanvasTexture(a); texture.colorSpace = T.SRGBColorSpace; textures.add(texture);
    const geo = new T.PlaneGeometry(width, height); geometries.add(geo); const material = new T.MeshBasicMaterial({ map: texture }); materials.add(material); return new T.Mesh(geo, material);
  }
  const tile = document.createElement("canvas"); tile.width = tile.height = 256; const tc = tile.getContext("2d");
  tc.fillStyle = "#e9eeeb"; tc.fillRect(0, 0, 256, 256); tc.fillStyle = "#dce7e5"; tc.fillRect(0, 0, 128, 128); tc.fillRect(128, 128, 128, 128); tc.strokeStyle = "#b5c5c3"; tc.lineWidth = 2; tc.strokeRect(1, 1, 254, 254); tc.beginPath(); tc.moveTo(128, 0); tc.lineTo(128, 256); tc.moveTo(0, 128); tc.lineTo(256, 128); tc.stroke();
  const floorTiles = document.createElement("canvas"); floorTiles.width = 1024; floorTiles.height = 640; const fd = floorTiles.getContext("2d"); for (let x = 0; x < 8; x++) for (let y = 0; y < 5; y++) fd.drawImage(tile, x * 128, y * 128, 128, 128);
  const tileMap = new T.CanvasTexture(floorTiles); tileMap.colorSpace = T.SRGBColorSpace; textures.add(tileMap);
  cube(scene, mat(0xffffff, { map: tileMap, roughness: .9 }), 0, -.1, 0, 16.5, .18, 10.5);
  cube(scene, teal, 0, -.4, 0, 16.8, .42, 10.8); cube(scene, white, 0, 1.1, -5.2, 16.5, 2.4, .2); cube(scene, white, -8.2, 1.1, 0, .2, 2.4, 10.5);
  cube(scene, red, 0, 1.65, -5.06, 16.2, .32, .05); cube(scene, teal, -8.04, .5, 0, .06, .65, 10.1);
  const shop = placard("GOOD NIGHT / 24", "#ffffff", "#e64945", 4.6, .9); shop.position.set(-3.8, 2, -5); scene.add(shop);
  for (const x of [-6.6, -.1, 2.5]) {
    for (const z of [-4.6]) { for (const dx of [-.8, .8]) cube(scene, red, x + dx, .85, z, .07, 1.6, .7); for (const y of [.3, .85, 1.4]) { cube(scene, steel, x, y, z, 1.7, .06, .8); for (let i = 0; i < 3; i++) { cube(scene, i % 2 ? white : teal, x - .5 + i * .5, y + .22, z, .34, .37, .42); tube(scene, ink, x - .5 + i * .5, y + .43, z, .1, .035); } } }
  }
  cube(scene, red, -7.4, .42, 3.4, .7, .85, 2); cube(scene, white, -7.4, .9, 3.4, .85, .12, 2.15);
  for (const z of [-3.45, 3.45]) { cube(scene, teal, 4, .42, z, .25, .85, 3.5); cube(scene, steel, 4, .9, z, .32, .08, 3.5); }
  for (const z of [-1.65, 1.65]) { cube(scene, steel, 4, 1.65, z, .36, 3.3, .18); cube(scene, yellow, 3.8, .12, z, .4, .16, .3); }
  cube(scene, teal, 4, 3.4, 0, .5, .25, 3.6);
  const gate = new T.Group(); scene.add(gate); cube(gate, mat(0xb8e5df, { transparent: true, opacity: .42, metalness: .1 }), 0, 1.2, 0, .15, 2.4, 3.1);
  for (const z of [-1.5, -.75, 0, .75, 1.5]) cube(gate, steel, 0, 1.2, z, .18, 2.4, .04); cube(gate, red, -.1, .8, 0, .03, .24, 3.1);
  const exitSign = placard("维修出口", "#ffffff", "#239c8f", 2.4, .64); exitSign.position.set(6.2, 1.9, -4.97); scene.add(exitSign);
  cube(scene, mat(0xbedfce), 6.65, .02, 0, 2.3, .04, 2.7); for (let i = 0; i < 3; i++) { const arrow = cube(scene, white, 5.9 + i * .52, .055, 0, .3, .02, .3); arrow.rotation.y = Math.PI / 4; }
  cube(scene, steel, 7.4, .55, -2.4, 1.25, .12, 1.3); for (const x of [6.95, 7.85]) for (const z of [-2.85, -1.95]) tube(scene, ink, x, .25, z, .07, .5);
  const plate = cube(scene, yellow, 2.65, .035, -.7, 2, .08, 1.4); for (let i = 0; i < 7; i++) cube(scene, ink, 1.76 + i * .27, .08, -1.28, .12, .015, .16);
  const sensor = ball(scene, yellow, 3.75, .62, -2, .23); cube(scene, ink, 3.96, .62, -2, .15, .7, .6);
  const pedal = cube(scene, red, 3.63, .09, 1.8, .75, .18, .75); cube(scene, white, 3.63, .19, 1.8, .35, .03, .08);
  function wheel(p, x, y, z, r = .14) { const w = tube(p, rubber, x, y, z, r, .1); w.rotation.x = Math.PI / 2; const cap = tube(p, steel, x, y, z + .055, r * .45, .018); cap.rotation.x = Math.PI / 2; return w; }
  function build(id) {
    const group = new T.Group(), moving = {}; group.userData.entity = id; scene.add(group);
    if (id === "lamp") {
      tube(group, teal, 0, -.5, 0, .37, .14); tube(group, steel, 0, -.34, 0, .065, .22);
      rod(group, teal, [0, -.3, 0], [-.17, .14, 0], .055); rod(group, teal, [-.17, .14, 0], [.2, .48, 0], .045); for (const [x, y] of [[0, -.3], [-.17, .14], [.2, .48]]) ball(group, steel, x, y, 0, .09);
      const shadeGeo = new T.CylinderGeometry(.15, .32, .32, 24, 1, true); geometries.add(shadeGeo); const shade = mesh(group, shadeGeo, teal, .26, .44, 0, 1, 1, 1); shade.rotation.z = -Math.PI / 2;
      const bulb = tube(group, glow, .44, .44, 0, .24, .03); bulb.rotation.z = -Math.PI / 2; moving.bulb = bulb;
      cube(group, ink, -.13, -.4, .12, .14, .06, .09);
    } else if (id === "fan") {
      tube(group, white, 0, -.55, 0, .43, .13); tube(group, steel, 0, -.17, 0, .065, .66);
      const cage = new T.TorusGeometry(.46, .035, 6, 32); geometries.add(cage); const outer = mesh(group, cage, teal, .08, .32, 0, 1, 1, 1); outer.rotation.y = Math.PI / 2;
      const blades = new T.Group(); blades.position.set(.08, .32, 0); group.add(blades); for (let i = 0; i < 4; i++) { const b = cube(blades, yellow, 0, .23 * Math.cos(i * Math.PI / 2), .23 * Math.sin(i * Math.PI / 2), .06, .34, .13); b.rotation.x = i * Math.PI / 2; }
      for (let i = 0; i < 8; i++) rod(group, steel, [.14, .32, 0], [.14, .32 + .45 * Math.cos(i * Math.PI / 4), .45 * Math.sin(i * Math.PI / 4)], .009);
      ball(group, teal, .17, .32, 0, .11); moving.blades = blades;
    } else if (id === "vacuum") {
      tube(group, rubber, 0, -.05, 0, .57, .35); tube(group, teal, 0, .1, 0, .54, .28); tube(group, white, 0, .25, 0, .36, .08);
      cube(group, ink, .45, .15, 0, .08, .15, .45); for (const z of [-.14, .14]) ball(group, blue, .51, .17, z, .045);
      for (const z of [-.53, .53]) wheel(group, 0, -.12, z, .16);
      const brush = new T.Group(); brush.position.set(.5, -.2, -.34); group.add(brush); for (let i = 0; i < 3; i++) { const o = cube(brush, red, 0, 0, 0, .45, .03, .045); o.rotation.y = i * Math.PI / 3; } moving.brush = brush;
    } else if (id === "vendor") {
      cube(group, red, 0, 0, 0, 1.25, 2.2, 1.05); cube(group, white, 0, .95, .55, 1.1, .18, .035); cube(group, ink, -.1, .25, .54, .85, 1.05, .045);
      for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) { tube(group, [teal, yellow, pink][(x + y) % 3], -.36 + x * .25, -.06 + y * .28, .58, .075, .2); cube(group, steel, -.36 + x * .25, -.18 + y * .28, .62, .19, .035, .08); }
      cube(group, ink, .47, .32, .56, .12, .55, .06); for (let i = 0; i < 3; i++) ball(group, yellow, .47, .47 - i * .15, .61, .035);
      cube(group, ink, 0, -.7, .55, .76, .3, .08); cube(group, steel, 0, -.89, .69, .8, .05, .3); moving.nozzle = new T.Group(); group.add(moving.nozzle);
      tube(moving.nozzle, steel, 0, -.8, 0, .24, .24); cube(moving.nozzle, yellow, .52, -.78, 0, .92, .11, .35); cube(moving.nozzle, ink, .86, -.77, 0, .1, .2, .38);
    } else if (id === "rack") {
      for (const x of [-.58, .58]) for (const z of [-.28, .28]) { cube(group, red, x, 0, z, .06, 1.5, .06); wheel(group, x, -.67, z, .13); }
      for (const y of [-.48, .1, .67]) { cube(group, white, 0, y, 0, 1.25, .06, .7); for (const x of [-.36, .1, .4]) { cube(group, x < 0 ? yellow : teal, x, y + .17, 0, .25, .29, .36); cube(group, white, x, y + .18, .19, .13, .12, .02); } }
    } else if (id === "robot") {
      cube(group, white, 0, 0, 0, .48, .42, .4); cube(group, red, 0, -.2, 0, .52, .08, .42); cube(group, ink, .02, .18, .23, .39, .2, .04);
      for (const x of [-.12, .12]) ball(group, blue, x, .2, .27, .037); rod(group, steel, [0, .27, 0], [0, .45, 0], .02); ball(group, yellow, 0, .46, 0, .065);
      for (const z of [-.24, .24]) wheel(group, 0, -.22, z, .12); cube(group, yellow, -.27, 0, 0, .1, .25, .16);
    } else {
      tube(group, [teal, red, yellow][Number(id.slice(3)) % 3], 0, 0, 0, .16, .4); tube(group, steel, 0, .21, 0, .15, .025); tube(group, white, 0, 0, 0, .163, .12);
    }
    group.traverse(o => { if (o.isMesh) { o.userData.entity = id; pickables.push(o); } }); models.set(id, { group, moving }); return models.get(id);
  }
  for (const id of ["lamp", "fan", "vacuum", "vendor", "rack", "robot"]) build(id);
  const guard = new T.Group(); scene.add(guard); const legs = [];
  for (const z of [-.21, .21]) { const leg = new T.Group(); leg.position.z = z; guard.add(leg); cube(leg, ink, 0, .3, 0, .13, .5, .15); cube(leg, yellow, .1, .1, 0, .4, .18, .22); legs.push(leg); }
  cube(guard, yellow, 0, .89, 0, .5, .6, .55); cube(guard, white, 0, 1.4, 0, .57, .43, .65); cube(guard, ink, .3, 1.42, 0, .04, .21, .49); cube(guard, blue, .33, 1.42, 0, .03, .07, .31); tube(guard, red, 0, 1.66, 0, .11, .13);
  for (const z of [-.4, .4]) rod(guard, steel, [0, 1.06, z], [.1, .62, z], .06);
  function cone(color, range, spread) {
    const g = new T.BufferGeometry(); const vertices = [0, .045, 0, range, .045, -range * spread, range, .045, range * spread]; g.setAttribute("position", new T.Float32BufferAttribute(vertices, 3)); g.computeVertexNormals(); geometries.add(g);
    const m = new T.MeshBasicMaterial({ color, transparent: true, opacity: .17, depthWrite: false, side: T.DoubleSide }); materials.add(m); const o = new T.Mesh(g, m); scene.add(o); return o;
  }
  const lampBeam = cone(0xfbdd5a, 6.5, .19), fanBeam = cone(0x50cad4, 7, .26), sight = cone(0xf36a62, 3.4, .8);
  const sightVertices = new Float32Array(30 * 9); sight.geometry.setAttribute("position", new T.Float32BufferAttribute(sightVertices, 3));
  fanBeam.geometry.setAttribute("position", new T.Float32BufferAttribute([0, .045, -.65, 7, .045, -2.05, 7, .045, 2.05, 0, .045, -.65, 7, .045, 2.05, 0, .045, .65], 3));
  const ringGeo = new T.TorusGeometry(.7, .025, 6, 40); geometries.add(ringGeo); const ringMat = new T.MeshBasicMaterial({ color: 0xffd440, depthWrite: false }); materials.add(ringMat);
  const ring = new T.Mesh(ringGeo, ringMat); ring.rotation.x = -Math.PI / 2; scene.add(ring);
  const targetMarker = new T.Mesh(ringGeo, mat(0x388eaa, { transparent: true, opacity: .55 })); targetMarker.rotation.x = -Math.PI / 2; targetMarker.scale.setScalar(.4); scene.add(targetMarker);
  const aimLine = cube(scene, red, 0, .2, 0, 4.3, .025, .035);
  const spark = ball(scene, glow, 0, 0, 0, .11);
  const papers = Array.from({ length: 7 }, (_, i) => cube(scene, i % 2 ? white : pink, 0, 0, 0, .23, .015, .31));
  scene.background = new T.Color(0xe0e8e7); scene.add(new T.HemisphereLight(0xffffff, 0x557770, 2));
  const sun = new T.DirectionalLight(0xfff4db, 2.8); sun.position.set(-5, 14, 8); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 12, bottom: -12, near: 1, far: 40 }); sun.shadow.bias = -.001; scene.add(sun);
  function contextLost(e) { e.preventDefault(); lost = true; } surface.addEventListener("webglcontextlost", contextLost);
  try { renderer = new T.WebGLRenderer({ canvas: surface, antialias: true, powerPreference: "low-power" }); renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap; renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; } catch { lost = true; }
  const label = (v, x, y, size = 16, color = "#233c42", align = "left") => { c.font = `700 ${size}px system-ui`; c.textAlign = align; c.textBaseline = "middle"; c.fillStyle = color; c.fillText(v, x, y); };
  const rect = (x, y, w, h, color) => { c.fillStyle = color; c.fillRect(x, y, w, h); };
  function project(x, y, z) { const p = new T.Vector3(x, y, z).project(camera); return { x: (p.x + 1) * 480, y: (1 - p.y) * 270 }; }
  function tag(text, x, y, z, color = "#233c42") { const p = project(x, y, z); c.font = "700 12px system-ui"; const w = c.measureText(text).width + 14; rect(p.x - w / 2, p.y - 10, w, 21, "#fffffff0"); label(text, p.x, p.y + .5, 12, color, "center"); }
  function draw(world, { reduced = false, stopped = false } = {}) {
    if (destroyed) return; const s = current = world.scene, b = canvas.getBoundingClientRect(), dpr = Math.min(globalThis.devicePixelRatio || 1, 2), w = Math.max(1, Math.round((b.width || 960) * dpr)), h = Math.round(w * 9 / 16);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    if (surface.width !== w || surface.height !== h) renderer?.setSize(w, h, false);
    c.setTransform(w / 960, 0, 0, h / 540, 0, 0);
    for (const e of s.objects) { const m = models.get(e.id) ?? build(e.id); m.group.visible = true; m.group.position.set(e.x, e.y, e.z);
      if (e.id.startsWith("can")) m.group.quaternion.set(e.rotation.x, e.rotation.y, e.rotation.z, e.rotation.w); else m.group.rotation.y = e.id === "vendor" ? 0 : -e.angle;
      if (m.moving.blades) m.moving.blades.rotation.x = reduced ? 0 : e.on ? s.time / 36 : 0;
      if (m.moving.bulb) m.moving.bulb.material = e.on ? glow : white;
      if (m.moving.brush) m.moving.brush.rotation.y = reduced ? 0 : s.time / 90 * Math.min(1, e.speed);
      if (m.moving.nozzle) m.moving.nozzle.rotation.y = -e.angle;
    }
    for (const [id, m] of models) if (!s.objects.some(e => e.id === id)) m.group.visible = false;
    gate.position.set(4, s.gate * 2.8, 0); plate.material = s.plate ? lime : yellow; sensor.material = s.light ? glow : yellow; pedal.material = s.pulse > 0 ? lime : red;
    const lamp = s.devices[0], fan = s.devices[1], d = s.devices.find(e => e.id === s.selected);
    lampBeam.visible = lamp.on && s.carry !== "lamp"; lampBeam.position.set(lamp.x, 0, lamp.z); lampBeam.rotation.y = -lamp.angle;
    fanBeam.visible = fan.on; fanBeam.position.set(fan.x, 0, fan.z); fanBeam.rotation.y = -fan.angle;
    papers.forEach((p, i) => { p.visible = fan.on && !reduced; const t = (s.time / 1700 + i / 7) % 1, side = Math.sin(i * 3) * .7; p.position.set(fan.x + Math.cos(fan.angle) * (1 + t * 5) - Math.sin(fan.angle) * side, .18 + Math.sin(t * Math.PI) * .8, fan.z + Math.sin(fan.angle) * (1 + t * 5) + Math.cos(fan.angle) * side); p.rotation.set(t * 4, i + t * 3, t); });
    guard.position.set(s.guard.x, 0, s.guard.z); guard.rotation.y = -s.guard.angle; legs.forEach((l, i) => l.rotation.z = reduced || s.planning || s.awaiting ? 0 : Math.sin(s.time / 150 + i * Math.PI) * .2);
    // Draw the same angular range and occlusion used by detection, not a decorative cone.
    const rays = []; for (let i = 0; i <= 30; i++) { const angle = s.guard.angle + Math.acos(.58) * (i / 15 - 1); let radius = 3.4;
      for (let r = .2; r <= 3.4; r += .2) if (!world.clearLine(s.guard, { x: s.guard.x + Math.cos(angle) * r, z: s.guard.z + Math.sin(angle) * r })) { radius = r; break; }
      rays.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
    }
    const sv = sight.geometry.attributes.position.array; for (let i = 0; i < 30; i++) sv.set([0, .045, 0, rays[i][0], .045, rays[i][1], rays[i + 1][0], .045, rays[i + 1][1]], i * 9); sight.geometry.attributes.position.needsUpdate = true; sight.geometry.computeBoundingSphere();
    sight.position.set(s.guard.x, .01, s.guard.z); sight.rotation.y = 0; sight.material.opacity = s.guard.watching ? .3 : .11;
    ring.position.set(d.x, .065, d.z); ring.scale.setScalar(s.selected === "vendor" ? 1.35 : 1);
    targetMarker.visible = Boolean(s.target); if (s.target) targetMarker.position.set(s.target.x, .055, s.target.z);
    aimLine.visible = s.selected === "vendor"; aimLine.position.set(d.x + Math.cos(d.angle) * 2.15, .25, d.z + Math.sin(d.angle) * 2.15); aimLine.rotation.y = -d.angle;
    spark.visible = !reduced && s.transfer && s.time - s.transfer.at < 450; if (spark.visible) { const t = (s.time - s.transfer.at) / 450, to = s.devices.find(e => e.id === s.transfer.to); spark.position.set(s.transfer.x + (to.x - s.transfer.x) * t, .8 + Math.sin(t * Math.PI) * 1.6, s.transfer.z + (to.z - s.transfer.z) * t); }
    if (renderer && !lost) { renderer.render(scene, camera); draws = renderer.info.render.calls; c.drawImage(surface, 0, 0, 960, 540); }
    else { rect(0, 0, 960, 540, "#dce6e5"); label("3D 渲染不可用", 480, 240, 26, "#233c42", "center"); label("请使用支持 WebGL 的浏览器", 480, 279, 17, "#536768", "center"); }
    if (renderer && !lost) {
      tag("光敏", 3.8, 1.08, -2, s.light ? "#298867" : "#60563a"); tag("配重", 2.65, .12, -.7); tag(s.pulse > 0 ? `${Math.ceil(s.pulse)}s` : "检修", 3.63, .25, 1.8);
      tag("维修出口", 6.7, .1, 0, "#218878");
      const robot = s.objects.find(e => e.id === "robot"); if (!s.carry) tag("待修机器人", robot.x, robot.y + .65, robot.z, "#b64739");
      for (let i = 0; i < 4; i++) { const e = s.devices[i]; if (s.carry === e.id) continue; const p = project(e.x, e.y + e.h / 2 + .18, e.z); c.beginPath(); c.arc(p.x, p.y, 10, 0, Math.PI * 2); c.fillStyle = e.id === s.selected ? "#ffdc4a" : "#ffffff"; c.fill(); label(String(i + 1), p.x, p.y, 12, "#233c42", "center"); }
    }
    rect(0, 0, 960, 60, "#f9faf5f2"); rect(0, 0, 8, 60, "#e64945"); label("电器成精了", 25, 25, 25); label("AFTER HOURS / APPLIANCE ESCAPE", 26, 48, 10, "#638080");
    label(s.phase === "won" ? "安全送达" : s.planning ? "时间暂停" : s.awaiting ? "打烊之后" : s.guard.watching ? "正在暴露" : "巡检中", 941, 20, 15, s.guard.alarm > 50 ? "#db453a" : "#396967", "right");
    rect(786, 39, 155, 7, "#d5e2dc"); rect(786, 39, 155 * s.guard.alarm / 100, 7, "#e64945");
    if (s.noise && s.noise.until > s.time && !reduced) { const p = project(s.noise.x, .1, s.noise.z), t = 1 - (s.noise.until - s.time) / 1800; c.strokeStyle = `rgba(229,83,58,${(1 - t) * .6})`; c.lineWidth = 2; c.beginPath(); c.ellipse(p.x, p.y, 15 + t * 42, 7 + t * 20, 0, 0, Math.PI * 2); c.stroke(); }
    rect(0, 466, 960, 74, "#f9faf5f5");
    const names = ["台灯", "风扇", "扫地机", "售货机"];
    for (let i = 0; i < 4; i++) { const e = s.devices[i], near = Math.hypot(e.x - d.x, e.z - d.z) <= 5.6 && s.carry !== e.id, x = i * 155;
      if (e.id === s.selected) { rect(x + 5, 473, 145, 58, "#e5efe9"); rect(x + 5, 473, 145, 3, "#289e93"); }
      label(`${i + 1}  ${names[i]}`, x + 18, 493, 16, near ? "#233c42" : "#a4aeac"); label(e.id === s.selected ? "电流所在" : s.carry === e.id ? "载运中" : near ? "可附身" : "超出距离", x + 18, 516, 11, "#68817c");
    }
    rect(628, 480, 129, 44, "#e4ece7"); label(s.planning ? "继续时间" : "停下思考", 692, 502, 15, "#355951", "center");
    rect(772, 480, 173, 44, "#278e83"); label(s.primaryLabel, 858, 502, 17, "#ffffff", "center");
    if (["won", "lost"].includes(s.phase)) { rect(200, 180, 560, 174, "#f8faf4f5"); rect(200, 180, 8, 174, s.phase === "won" ? "#2d9b82" : "#e64945"); label(s.phase === "won" ? "今晚，不报废。" : "露馅了。", 480, 232, 35, "#233c42", "center"); label(s.phase === "won" ? `通行方式：${s.route}` : "停下、借物遮挡，或者把巡检机引走。", 480, 288, 18, "#5b7570", "center"); label(s.phase === "won" ? "机器人抵达维修区" : "可以立即重新营业", 480, 324, 13, "#68817c", "center"); }
    if (stopped) { rect(0, 61, 960, 37, "#f8faf2eb"); label("任务结束 · 卖场已暂停", 480, 80, 17, "#355951", "center"); }
  }
  return { draw, project, ready: Promise.resolve(),
    point(clientX, clientY) { const b = canvas.getBoundingClientRect(), x = (clientX - b.left) * 960 / b.width, y = (clientY - b.top) * 540 / b.height, result = { x, y };
      if (!current || y >= 466 || lost || !renderer) return result;
      for (const e of current.devices) { const p = project(e.x, e.y + e.h / 2 + .18, e.z); if (current.carry !== e.id && Math.hypot(x - p.x, y - p.y) < 14) result.entity = e.id; }
      ray.setFromCamera(new T.Vector2(x / 480 - 1, 1 - y / 270), camera); scene.updateMatrixWorld(true);
      const hit = ray.intersectObjects(pickables, false).find(h => h.object.parent?.visible && current.devices.some(e => e.id === h.object.userData.entity)); if (hit && !result.entity) result.entity = hit.object.userData.entity;
      const point = new T.Vector3(); if (ray.ray.intersectPlane(floorPlane, point)) result.floor = { x: point.x, z: point.z }; return result;
    },
    get diagnostics() { return { renderer: renderer && !lost ? "three-orthographic" : "unavailable", contexts: renderer && !destroyed ? 1 : 0, drawCalls: draws, textures: textures.size, models: models.size, bufferSize: [surface.width, surface.height] }; },
    destroy() { if (destroyed) return; destroyed = true; surface.removeEventListener("webglcontextlost", contextLost); for (const g of geometries) g.dispose(); for (const m of materials) m.dispose(); for (const t of textures) t.dispose(); renderer?.dispose(); renderer?.forceContextLoss(); renderer = null; scene.clear(); models.clear(); surface.width = surface.height = 1; },
  };
}
