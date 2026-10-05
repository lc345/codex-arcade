import { renderTimelineFrame } from "./timeline.js";

const palettes = {
  default: { base: 0x071115, deep: 0x0a1c22, line: 0x58d7c1, accent: 0xf2c36a, secondary: 0x7ce4d1, bloom: 0x1f716d },
  neon: { base: 0x100719, deep: 0x1c0d34, line: 0x58e7ff, accent: 0xff4ec4, secondary: 0xf7cf5e, bloom: 0x6d32bd },
  voice: { base: 0x07151e, deep: 0x0a2a35, line: 0x71ebe1, accent: 0xffcc70, secondary: 0x93b8ff, bloom: 0x1a6c76 },
  time: { base: 0x0a1124, deep: 0x172e52, line: 0xa2c6ff, accent: 0xf4c96b, secondary: 0x7ee1c0, bloom: 0x405aa2 },
  mission: { base: 0x180e12, deep: 0x38202b, line: 0xf2bb68, accent: 0xf17e69, secondary: 0x96dfbd, bloom: 0x854832 },
  paper: { base: 0x16130d, deep: 0x302516, line: 0xf2cb7e, accent: 0xee9c65, secondary: 0x86d9be, bloom: 0x735a30 },
  garden: { base: 0x081916, deep: 0x123b2e, line: 0xa7e7b2, accent: 0xf4d27a, secondary: 0x72d6c0, bloom: 0x3c8b70 },
  forge: { base: 0x1b0a0a, deep: 0x4a1715, line: 0xffc06a, accent: 0xf2674b, secondary: 0x9fe3c4, bloom: 0xa53927 },
  vault: { base: 0x07161e, deep: 0x103844, line: 0x74d9df, accent: 0xf3ca70, secondary: 0x9bc6ff, bloom: 0x26687b },
  chorus: { base: 0x170b24, deep: 0x36144e, line: 0xf0a6ff, accent: 0x6ee5e0, secondary: 0xffd06d, bloom: 0x833ba1 },
  inkwell: { base: 0x0f1325, deep: 0x202d58, line: 0xb5c8ff, accent: 0xf2c777, secondary: 0x8bdbce, bloom: 0x455eaf },
};

const paletteFor = (packId = "") => {
  if (packId.includes("neon") || packId.includes("prism")) return palettes.neon;
  if (packId.includes("voice") || packId.includes("line")) return palettes.voice;
  if (packId.includes("garden")) return palettes.garden;
  if (packId.includes("calendar")) return palettes.time;
  if (packId.includes("forge")) return palettes.forge;
  if (packId.includes("vault")) return palettes.vault;
  if (packId.includes("chorus")) return palettes.chorus;
  if (packId.includes("inkwell")) return palettes.inkwell;
  if (packId.includes("mission") || packId.includes("launch")) return palettes.mission;
  if (packId.includes("mail") || packId.includes("paper") || packId.includes("dispatch")) return palettes.paper;
  return palettes.default;
};

function hash(value) {
  let output = 2166136261;
  for (const character of String(value)) {
    output ^= character.charCodeAt(0);
    output = Math.imul(output, 16777619);
  }
  return output >>> 0;
}

function random(seed, index) {
  let value = (seed + index * 374761393) >>> 0;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

function cappedResolution() {
  return Math.min(globalThis.devicePixelRatio || 1, 2);
}

function createLabel(PIXI, text, size = 13, color = 0xf4f1e8) {
  const label = new PIXI.Text({
    text,
    style: {
      fill: color,
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: size,
      fontWeight: "600",
      dropShadow: { color: 0x000000, alpha: 0.42, blur: 3, distance: 1 },
    },
    anchor: 0.5,
  });
  return label;
}

function drawAnchor(PIXI, palette) {
  const container = new PIXI.Container();
  const halo = new PIXI.Graphics().circle(0, 0, 40).fill({ color: palette.secondary, alpha: 0.055 });
  const ring = new PIXI.Graphics().circle(0, 0, 22).stroke({ color: palette.secondary, width: 1, alpha: 0.28 });
  const core = new PIXI.Graphics().circle(0, 0, 4).fill({ color: palette.accent, alpha: 1 });
  const label = createLabel(PIXI, "", 12, 0xd6ded8);
  label.y = 52;
  container.addChild(halo, ring, core, label);
  return { container, halo, ring, core, label };
}

function drawEnvelope(PIXI, palette) {
  const graphic = new PIXI.Graphics();
  graphic.roundRect(-28, -18, 56, 36, 5).fill({ color: palette.accent, alpha: 0.96 }).stroke({ color: 0x1a1310, width: 1.4, alpha: 0.9 });
  graphic.moveTo(-25, -14).lineTo(0, 3).lineTo(25, -14).stroke({ color: 0x21170e, width: 1.5, alpha: 0.9 });
  return graphic;
}

function drawPortal(PIXI, palette) {
  const graphic = new PIXI.Graphics();
  for (let index = 0; index < 3; index += 1) {
    graphic.arc(0, 0, 46 - index * 10, index * 1.6, index * 1.6 + Math.PI * 1.22).stroke({
      color: [palette.secondary, palette.accent, 0xff8aa9][index], width: 2, alpha: 0.88,
    });
  }
  graphic.circle(0, 0, 26).fill({ color: palette.line, alpha: 0.11 });
  return graphic;
}

function drawComet(PIXI, palette) {
  const container = new PIXI.Container();
  const tail = new PIXI.Graphics().poly([-108, -5, 0, -6, 0, 6, -108, 5]).fill({ color: palette.secondary, alpha: 0.28 });
  const core = new PIXI.Graphics().circle(0, 0, 15).fill({ color: 0xfff0b7, alpha: 1 }).circle(0, 0, 24).stroke({ color: palette.accent, width: 1.5, alpha: 0.52 });
  container.addChild(tail, core);
  return container;
}

function drawOrb(PIXI, palette) {
  const container = new PIXI.Container();
  const halo = new PIXI.Graphics().circle(0, 0, 28).fill({ color: palette.secondary, alpha: 0.1 });
  const core = new PIXI.Graphics().circle(0, 0, 17).fill({ color: palette.secondary, alpha: 0.95 }).circle(0, 0, 27).stroke({ color: palette.accent, width: 1.5, alpha: 0.82 });
  container.addChild(halo, core);
  return container;
}

function drawPhone(PIXI, palette) {
  const graphic = new PIXI.Graphics();
  graphic.moveTo(-19, -15).bezierCurveTo(-8, -4, 8, 4, 19, 15).stroke({ color: palette.accent, width: 9, alpha: 1, cap: "round" });
  graphic.moveTo(-20, -15).lineTo(-12, -25).moveTo(20, 15).lineTo(12, 25).stroke({ color: palette.line, width: 4, alpha: 1, cap: "round" });
  return graphic;
}

function drawWave(PIXI, palette) {
  const graphic = new PIXI.Graphics();
  for (let index = 0; index < 3; index += 1) {
    const radius = 18 + index * 10;
    graphic.arc(0, 0, radius, -Math.PI * 0.74, Math.PI * 0.74).stroke({ color: palette.secondary, width: 2 - index * 0.25, alpha: 0.84 - index * 0.2 });
  }
  return graphic;
}

function drawCalendar(PIXI, palette) {
  const graphic = new PIXI.Graphics();
  graphic.roundRect(-24, -21, 48, 42, 6).fill({ color: 0xd8e7ff, alpha: 0.95 }).stroke({ color: palette.line, width: 1, alpha: 0.75 });
  graphic.rect(-24, -21, 48, 11).fill({ color: 0x5d88c5, alpha: 1 });
  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 3; column += 1) graphic.circle(-11 + column * 11, 1 + row * 9, 2.2).fill({ color: 0x173353, alpha: 0.95 });
  }
  return graphic;
}

function drawOrbit(PIXI, palette) {
  const graphic = new PIXI.Graphics();
  graphic.ellipse(0, 0, 46, 18).stroke({ color: palette.line, width: 1.5, alpha: 0.82 });
  graphic.ellipse(0, 0, 32, 12).stroke({ color: palette.secondary, width: 1.5, alpha: 0.55 });
  graphic.circle(0, 0, 5).fill({ color: palette.accent, alpha: 1 });
  return graphic;
}

function drawRocket(PIXI, palette) {
  const graphic = new PIXI.Graphics();
  graphic.poly([25, 0, -10, -17, -22, 0, -10, 17]).fill({ color: palette.accent, alpha: 1 });
  graphic.circle(8, 0, 5).fill({ color: palette.line, alpha: 1 });
  graphic.poly([-20, 0, -39, -8, -33, 0, -39, 8]).fill({ color: 0xf27d57, alpha: 1 });
  return graphic;
}

function drawBeacon(PIXI, palette) {
  const graphic = new PIXI.Graphics();
  graphic.circle(0, 0, 8).fill({ color: palette.secondary, alpha: 1 });
  for (let index = 0; index < 3; index += 1) graphic.circle(0, 0, 18 + index * 11).stroke({ color: palette.secondary, width: 1.5, alpha: 0.68 - index * 0.17 });
  return graphic;
}

function drawDrone(PIXI, palette) {
  const container = new PIXI.Container();
  const wings = new PIXI.Graphics().poly([-28, 0, -8, -9, 0, 0, -8, 9]).fill({ color: palette.line, alpha: 0.8 })
    .poly([28, 0, 8, -9, 0, 0, 8, 9]).fill({ color: palette.line, alpha: 0.8 });
  const body = new PIXI.Graphics().poly([0, -18, 16, 0, 0, 18, -16, 0]).fill({ color: palette.accent, alpha: 1 })
    .poly([0, -9, 9, 0, 0, 9, -9, 0]).fill({ color: 0xfff4c9, alpha: 0.92 });
  container.addChild(wings, body);
  return container;
}

function drawVault(PIXI, palette) {
  const graphic = new PIXI.Graphics();
  graphic.roundRect(-30, -30, 60, 60, 10).stroke({ color: palette.secondary, width: 2, alpha: 0.8 });
  graphic.roundRect(-20, -20, 40, 40, 7).stroke({ color: palette.accent, width: 2, alpha: 0.95 });
  graphic.circle(0, 0, 8).fill({ color: palette.accent, alpha: 0.9 });
  return graphic;
}

function drawShard(PIXI, palette) {
  const graphic = new PIXI.Graphics();
  graphic.poly([0, -20, 14, 0, 0, 22, -14, 0]).fill({ color: palette.secondary, alpha: 0.9 });
  graphic.poly([0, -12, 8, 0, 0, 13, -8, 0]).fill({ color: palette.accent, alpha: 0.8 });
  return graphic;
}

function drawBeam(PIXI, palette) {
  const graphic = new PIXI.Graphics();
  graphic.rect(-84, -2, 168, 4).fill({ color: palette.line, alpha: 0.48 });
  graphic.rect(-54, -6, 108, 12).fill({ color: palette.secondary, alpha: 0.1 });
  return graphic;
}

function drawStoryObject(PIXI, kind, palette) {
  const graphic = new PIXI.Graphics();
  if (kind === "inkwell") {
    graphic.roundRect(-20, -7, 40, 30, 8).fill({ color: palette.secondary, alpha: 0.88 }).roundRect(-12, -21, 24, 19, 5).fill({ color: palette.line, alpha: 0.92 });
    graphic.moveTo(6, -39).lineTo(-6, -10).stroke({ color: palette.accent, width: 4, alpha: 1, cap: "round" });
    return graphic;
  }
  if (kind === "quill") {
    graphic.moveTo(-18, 26).bezierCurveTo(-7, -26, 28, -31, 15, 12).stroke({ color: palette.accent, width: 4, alpha: 0.96, cap: "round" });
    graphic.moveTo(-7, -8).lineTo(18, -25).moveTo(-3, 0).lineTo(23, -10).stroke({ color: palette.secondary, width: 2, alpha: 0.8 });
    return graphic;
  }
  if (kind === "glyph") {
    graphic.roundRect(-32, -22, 64, 44, 7).fill({ color: 0xf7f0d8, alpha: 0.96 }).stroke({ color: palette.line, width: 1.2, alpha: 0.7 });
    for (let index = 0; index < 4; index += 1) graphic.rect(-18, -10 + index * 7, 34 - index * 4, 2).fill({ color: palette.deep, alpha: 0.58 });
    return graphic;
  }
  if (kind === "switchboard") {
    graphic.roundRect(-48, -34, 96, 68, 10).fill({ color: palette.deep, alpha: 0.96 }).stroke({ color: palette.line, width: 2, alpha: 0.85 });
    for (let row = 0; row < 2; row += 1) for (let column = 0; column < 4; column += 1) graphic.circle(-27 + column * 18, -12 + row * 24, 4).fill({ color: (row + column) % 2 ? palette.secondary : palette.accent, alpha: 0.95 });
    return graphic;
  }
  if (kind === "dial" || kind === "clock") {
    graphic.circle(0, 0, 34).fill({ color: palette.deep, alpha: 0.75 }).stroke({ color: palette.accent, width: 2, alpha: 0.92 });
    for (let index = 0; index < 12; index += 1) {
      const angle = index / 12 * Math.PI * 2;
      graphic.moveTo(Math.cos(angle) * 25, Math.sin(angle) * 25).lineTo(Math.cos(angle) * 30, Math.sin(angle) * 30).stroke({ color: palette.secondary, width: 1.5, alpha: 0.82 });
    }
    graphic.moveTo(0, 0).lineTo(0, -19).moveTo(0, 0).lineTo(15, 7).stroke({ color: palette.line, width: 2.5, alpha: 0.9, cap: "round" });
    return graphic;
  }
  if (kind === "seed") {
    graphic.ellipse(0, 0, 13, 19).fill({ color: palette.accent, alpha: 0.98 }).stroke({ color: palette.line, width: 1, alpha: 0.75 });
    return graphic;
  }
  if (kind === "sprout") {
    graphic.moveTo(0, 24).lineTo(0, -16).stroke({ color: palette.secondary, width: 4, alpha: 0.96, cap: "round" });
    graphic.ellipse(-12, -11, 13, 7).fill({ color: palette.accent, alpha: 0.95 }).ellipse(12, -2, 13, 7).fill({ color: palette.line, alpha: 0.9 });
    return graphic;
  }
  if (kind === "bloom") {
    for (let index = 0; index < 6; index += 1) {
      const angle = index / 6 * Math.PI * 2;
      graphic.circle(Math.cos(angle) * 19, Math.sin(angle) * 19, 13).fill({ color: index % 2 ? palette.secondary : palette.accent, alpha: 0.9 });
    }
    graphic.circle(0, 0, 13).fill({ color: palette.line, alpha: 1 });
    return graphic;
  }
  if (kind === "forge") {
    graphic.roundRect(-44, -26, 88, 52, 10).fill({ color: palette.deep, alpha: 0.94 }).stroke({ color: palette.accent, width: 2, alpha: 0.9 });
    graphic.arc(0, 11, 19, Math.PI, Math.PI * 2).fill({ color: palette.secondary, alpha: 0.85 });
    graphic.poly([-12, 11, 0, -13, 12, 11]).fill({ color: palette.line, alpha: 0.95 });
    return graphic;
  }
  if (kind === "anvil") {
    graphic.poly([-35, 12, -17, 1, -4, 1, 5, -11, 35, -11, 18, 2, 16, 14, -18, 14]).fill({ color: palette.secondary, alpha: 0.94 }).stroke({ color: palette.line, width: 1.5, alpha: 0.8 });
    return graphic;
  }
  if (kind === "shield") {
    graphic.poly([0, -34, 28, -19, 23, 18, 0, 34, -23, 18, -28, -19]).fill({ color: palette.secondary, alpha: 0.24 }).stroke({ color: palette.accent, width: 2.5, alpha: 0.96 });
    return graphic;
  }
  if (kind === "lock") {
    graphic.roundRect(-20, -1, 40, 30, 6).fill({ color: palette.secondary, alpha: 0.92 }).stroke({ color: palette.line, width: 1.5, alpha: 0.8 });
    graphic.arc(0, -1, 13, Math.PI, Math.PI * 2).stroke({ color: palette.accent, width: 5, alpha: 0.96 });
    graphic.circle(0, 13, 4).fill({ color: palette.deep, alpha: 1 });
    return graphic;
  }
  if (kind === "document") return drawStoryObject(PIXI, "glyph", palette);
  if (kind === "chorus") {
    for (const [x, y, size] of [[-24, 5, 16], [0, -15, 21], [26, 8, 15]]) {
      graphic.roundRect(x - size, y - size * 0.62, size * 2, size * 1.24, size * 0.45).fill({ color: palette.secondary, alpha: 0.74 });
      graphic.poly([x - size * 0.3, y + size * 0.55, x, y + size * 1.1, x + size * 0.22, y + size * 0.55]).fill({ color: palette.secondary, alpha: 0.74 });
    }
    return graphic;
  }
  return graphic.circle(0, 0, 13).fill({ color: palette.accent, alpha: 0.9 });
}

function drawObject(PIXI, kind, palette) {
  if (kind === "envelope") return drawEnvelope(PIXI, palette);
  if (kind === "portal") return drawPortal(PIXI, palette);
  if (kind === "comet") return drawComet(PIXI, palette);
  if (kind === "orb") return drawOrb(PIXI, palette);
  if (kind === "phone") return drawPhone(PIXI, palette);
  if (kind === "wave") return drawWave(PIXI, palette);
  if (kind === "calendar") return drawCalendar(PIXI, palette);
  if (kind === "orbit") return drawOrbit(PIXI, palette);
  if (kind === "rocket") return drawRocket(PIXI, palette);
  if (kind === "beacon") return drawBeacon(PIXI, palette);
  if (kind === "drone") return drawDrone(PIXI, palette);
  if (kind === "vault") return drawVault(PIXI, palette);
  if (kind === "shard") return drawShard(PIXI, palette);
  if (kind === "beam") return drawBeam(PIXI, palette);
  if (["inkwell", "quill", "glyph", "switchboard", "dial", "clock", "seed", "sprout", "bloom", "forge", "anvil", "shield", "lock", "document", "chorus"].includes(kind)) return drawStoryObject(PIXI, kind, palette);
  return new PIXI.Graphics().circle(0, 0, 13).fill({ color: palette.accent, alpha: 0.9 });
}

function animateObject(node, object, elapsed) {
  node.position.set(object.x, object.y);
  node.alpha = object.opacity;
  const pulse = 1 + Math.sin(elapsed / 180 + hash(object.id) % 7) * 0.045;
  node.scale.set(object.scale * pulse);
  node.rotation = object.rotation ?? 0;
  if (object.kind === "portal" || object.kind === "orbit" || object.kind === "vault") node.rotation += elapsed / 900;
  if (object.kind === "wave") node.rotation += Math.sin(elapsed / 220) * 0.12;
  if (object.kind === "drone") node.rotation += Math.sin(elapsed / 170) * 0.1;
  if (object.kind === "beam") node.alpha = object.opacity * (0.5 + Math.sin(elapsed / 130) * 0.22);
}

function createParticleBurst(PIXI, id, palette) {
  const seed = hash(id);
  const container = new PIXI.Container();
  const particles = Array.from({ length: 26 }, (_, index) => {
    const graphic = new PIXI.Graphics();
    const colors = [palette.secondary, palette.accent, palette.line, 0xffffff];
    const size = 1.5 + random(seed, index + 1) * 2.8;
    if (index % 3 === 0) graphic.rect(-size, -size, size * 2, size * 2).fill({ color: colors[index % colors.length], alpha: 0.9 });
    else graphic.circle(0, 0, size).fill({ color: colors[index % colors.length], alpha: 0.9 });
    container.addChild(graphic);
    return {
      graphic,
      angle: random(seed, index + 37) * Math.PI * 2,
      speed: 22 + random(seed, index + 71) * 88,
      drift: -18 + random(seed, index + 103) * 36,
    };
  });
  return { container, particles };
}

function updateParticleBurst(burst, particle, elapsed) {
  const age = Math.max(0, elapsed - particle.atMs);
  const progress = Math.min(1, age / 820);
  burst.container.visible = progress < 1;
  burst.container.position.set(particle.x, particle.y);
  for (const item of burst.particles) {
    const distance = item.speed * progress;
    item.graphic.position.set(Math.cos(item.angle) * distance, Math.sin(item.angle) * distance + item.drift * progress * progress);
    item.graphic.alpha = (1 - progress) * (0.7 + Math.sin(progress * Math.PI) * 0.3);
    item.graphic.rotation += 0.05;
  }
}

function drawBackdrop(PIXI, backdrop, grid, haze, palette, width, height) {
  backdrop.clear().rect(0, 0, width, height).fill({ color: palette.base, alpha: 1 });
  backdrop.poly([0, 0, width * 0.78, 0, width * 0.38, height, 0, height]).fill({ color: palette.deep, alpha: 0.84 });
  backdrop.rect(0, height * 0.78, width, height * 0.22).fill({ color: 0x000000, alpha: 0.17 });
  grid.clear();
  for (let x = -height; x < width + height; x += 48) grid.moveTo(x, 0).lineTo(x + height * 0.42, height).stroke({ color: palette.line, width: 1, alpha: 0.06 });
  for (let y = 64; y < height; y += 48) grid.moveTo(0, y).lineTo(width, y).stroke({ color: palette.line, width: 1, alpha: 0.035 });
  haze.clear().circle(width * 0.56, height * 0.44, Math.max(width, height) * 0.33).fill({ color: palette.bloom, alpha: 0.22 });
}

/**
 * A browser-only PixiJS renderer. It consumes the same renderer-neutral frame
 * as the Canvas fallback, so Scene Packs still cannot run code or affect action
 * semantics. The caller can opt into a Canvas fallback when WebGL/WebGPU fails.
 */
export function createPixiStageRenderer(canvas, options = {}) {
  const PIXI = globalThis.PIXI;
  let app = null;
  let bootPromise = null;
  let active = null;
  let failed = false;
  let layers = null;
  let objectNodes = new Map();
  let particleBursts = new Map();
  let textNodes = new Map();
  let anchors = null;
  let ambient = [];

  function fallback() {
    if (!failed) {
      failed = true;
      options.onFailure?.(active);
    }
  }

  function createLayers() {
    const root = new PIXI.Container();
    const backdrop = new PIXI.Graphics();
    const grid = new PIXI.Graphics();
    const haze = new PIXI.Graphics();
    const ambientLayer = new PIXI.Container();
    const anchorLayer = new PIXI.Container();
    const particleLayer = new PIXI.Container();
    const objectLayer = new PIXI.Container();
    const textLayer = new PIXI.Container();
    if (PIXI.BlurFilter) haze.filters = [new PIXI.BlurFilter({ strength: 14, quality: 1 })];
    root.addChild(backdrop, grid, haze, ambientLayer, anchorLayer, particleLayer, objectLayer, textLayer);
    app.stage.addChild(root);
    layers = { root, backdrop, grid, haze, ambientLayer, anchorLayer, particleLayer, objectLayer, textLayer, palette: palettes.default };
  }

  function rebuildAmbient() {
    for (const item of ambient) item.graphic.destroy();
    ambient = [];
    layers.ambientLayer.removeChildren();
    const seed = hash(active?.presentation?.record?.scene?.packId ?? "stage");
    for (let index = 0; index < 44; index += 1) {
      const graphic = new PIXI.Graphics();
      const size = 0.8 + random(seed, index) * 1.8;
      if (index % 4 === 0) graphic.rect(-size, -size, size * 2, size * 2).fill({ color: layers.palette.secondary, alpha: 0.7 });
      else graphic.circle(0, 0, size).fill({ color: layers.palette.line, alpha: 0.7 });
      layers.ambientLayer.addChild(graphic);
      ambient.push({
        graphic,
        x: random(seed, index + 100),
        y: random(seed, index + 200),
        speed: 0.2 + random(seed, index + 300) * 0.75,
        phase: random(seed, index + 400) * Math.PI * 2,
      });
    }
  }

  function resetScene() {
    for (const node of objectNodes.values()) node.destroy({ children: true });
    for (const burst of particleBursts.values()) burst.container.destroy({ children: true });
    for (const node of textNodes.values()) node.destroy();
    objectNodes = new Map();
    particleBursts = new Map();
    textNodes = new Map();
    layers.objectLayer.removeChildren();
    layers.particleLayer.removeChildren();
    layers.textLayer.removeChildren();
  }

  function ensureAnchors() {
    if (anchors) return;
    anchors = {
      actor: drawAnchor(PIXI, layers.palette),
      recipient: drawAnchor(PIXI, layers.palette),
    };
    layers.anchorLayer.addChild(anchors.actor.container, anchors.recipient.container);
  }

  function updateAnchors(frame, labels, elapsed) {
    ensureAnchors();
    for (const [key, anchor] of Object.entries(anchors)) {
      const point = frame.anchors[key];
      anchor.container.visible = frame.usedAnchors.includes(key);
      if (!anchor.container.visible) continue;
      anchor.container.position.set(point.x, point.y);
      anchor.label.text = key === "actor" ? labels.actorLabel : labels.recipientLabel;
      anchor.halo.alpha = 0.035 + (Math.sin(elapsed / 520 + (key === "actor" ? 0 : 2)) + 1) * 0.035;
      anchor.ring.rotation = elapsed / 1600 * (key === "actor" ? 1 : -1);
    }
  }

  function updateAmbient(elapsed, width, height) {
    for (const item of ambient) {
      item.graphic.position.set(item.x * width + Math.sin(elapsed / 760 * item.speed + item.phase) * 18, item.y * height + Math.cos(elapsed / 980 * item.speed + item.phase) * 12);
      item.graphic.alpha = 0.18 + (Math.sin(elapsed / 420 * item.speed + item.phase) + 1) * 0.26;
    }
  }

  function updateObjects(frame) {
    const live = new Set();
    for (const object of frame.objects) {
      live.add(object.id);
      let node = objectNodes.get(object.id);
      if (!node || node.__kind !== object.kind) {
        if (node) node.destroy({ children: true });
        node = drawObject(PIXI, object.kind, layers.palette);
        node.__kind = object.kind;
        objectNodes.set(object.id, node);
        layers.objectLayer.addChild(node);
      }
      animateObject(node, object, frame.elapsedMs);
    }
    for (const [id, node] of objectNodes) {
      if (!live.has(id)) {
        node.destroy({ children: true });
        objectNodes.delete(id);
      }
    }
  }

  function updateParticles(frame) {
    const live = new Set();
    for (const particle of frame.particles) {
      live.add(particle.id);
      let burst = particleBursts.get(particle.id);
      if (!burst) {
        burst = createParticleBurst(PIXI, particle.id, layers.palette);
        particleBursts.set(particle.id, burst);
        layers.particleLayer.addChild(burst.container);
      }
      updateParticleBurst(burst, particle, frame.elapsedMs);
    }
    for (const [id, burst] of particleBursts) {
      if (!live.has(id)) {
        burst.container.destroy({ children: true });
        particleBursts.delete(id);
      }
    }
  }

  function updateText(frame) {
    const live = new Set();
    for (const item of frame.text) {
      live.add(item.id);
      let node = textNodes.get(item.id);
      if (!node) {
        node = createLabel(PIXI, item.text, 16, 0xf8f3e7);
        textNodes.set(item.id, node);
        layers.textLayer.addChild(node);
      }
      if (node.text !== item.text) node.text = item.text;
      node.position.set(item.x, item.y - 62);
    }
    for (const [id, node] of textNodes) {
      if (!live.has(id)) {
        node.destroy();
        textNodes.delete(id);
      }
    }
  }

  function paint() {
    if (!active || !app || failed) return;
    const width = app.screen.width || canvas.clientWidth || 1;
    const height = app.screen.height || canvas.clientHeight || 1;
    const rawElapsed = active.reducedMotion ? active.presentation.timeline.durationMs : performance.now() - active.startedAt;
    const frame = renderTimelineFrame(active.presentation.timeline, rawElapsed, {
      width,
      height,
      reducedMotion: active.reducedMotion,
    });
    drawBackdrop(PIXI, layers.backdrop, layers.grid, layers.haze, layers.palette, width, height);
    updateAmbient(frame.elapsedMs, width, height);
    updateAnchors(frame, active.labels, frame.elapsedMs);
    updateObjects(frame);
    updateParticles(frame);
    updateText(frame);
    options.onCaption?.(frame.text.map((item) => item.text).join(" "));
    if (active.reducedMotion || (!active.presentation.timeline.loop && rawElapsed >= frame.durationMs)) app.ticker.stop();
  }

  async function boot() {
    if (app || failed) return app;
    bootPromise ??= (async () => {
      try {
        app = new PIXI.Application();
        await app.init({
          canvas,
          resizeTo: canvas.parentElement ?? canvas,
          autoDensity: true,
          antialias: true,
          backgroundAlpha: 0,
          resolution: cappedResolution(),
          preference: "webgl",
        });
        createLayers();
        app.ticker.add(paint);
        if (active) {
          resetScene();
          layers.palette = paletteFor(active.presentation.record?.scene?.packId);
          rebuildAmbient();
          app.ticker.start();
        }
        return app;
      } catch (error) {
        console.warn("Agent Stage Pixi renderer unavailable; using Canvas fallback.", error);
        fallback();
        return null;
      }
    })();
    return bootPromise;
  }

  function render(presentation, renderOptions = {}) {
    if (!presentation?.timeline) return;
    const reducedMotion = renderOptions.reducedMotion ?? options.reducedMotion ?? globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    active = {
      presentation,
      labels: renderOptions.slots ?? { actorLabel: "You", recipientLabel: "a recipient" },
      reducedMotion,
      startedAt: performance.now(),
    };
    if (failed) {
      options.onFailure?.(active);
      return;
    }
    if (!app) {
      void boot();
      return;
    }
    resetScene();
    layers.palette = paletteFor(presentation.record?.scene?.packId);
    anchors = null;
    layers.anchorLayer.removeChildren();
    rebuildAmbient();
    app.ticker.start();
  }

  function clear() {
    active = null;
    if (!app) return;
    app.ticker.stop();
    resetScene();
    layers.anchorLayer.removeChildren();
    anchors = null;
    layers.backdrop.clear();
    layers.grid.clear();
    layers.haze.clear();
    options.onCaption?.("");
  }

  function stop() {
    active = null;
    app?.ticker.stop();
  }

  return { render, clear, stop };
}
