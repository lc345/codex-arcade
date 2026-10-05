import { renderTimelineFrame, timelineElapsed } from "./timeline.js";

function resizeCanvas(canvas) {
  const bounds = canvas.getBoundingClientRect();
  const ratio = globalThis.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(bounds.width * ratio));
  const height = Math.max(1, Math.round(bounds.height * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  return { width: bounds.width, height: bounds.height, ratio };
}

function drawAnchor(context, point, label, color) {
  context.save();
  context.fillStyle = color;
  context.globalAlpha = 0.18;
  context.beginPath();
  context.arc(point.x, point.y, 42, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;
  context.fillStyle = color;
  context.beginPath();
  context.arc(point.x, point.y, 5, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(244, 241, 233, .76)";
  context.font = "600 13px system-ui";
  context.textAlign = "center";
  context.fillText(label, point.x, point.y + 64);
  context.restore();
}

function drawEnvelope(context, object) {
  const size = 28 * object.scale;
  context.save();
  context.translate(object.x, object.y);
  context.globalAlpha = object.opacity;
  context.fillStyle = "#f4d18a";
  context.strokeStyle = "#1c1710";
  context.lineWidth = 1.5;
  context.beginPath();
  context.roundRect(-size, -size * 0.66, size * 2, size * 1.32, 5);
  context.fill();
  context.stroke();
  context.beginPath();
  context.moveTo(-size + 2, -size * 0.56);
  context.lineTo(0, 0);
  context.lineTo(size - 2, -size * 0.56);
  context.stroke();
  context.restore();
}

function drawPortal(context, object, elapsed) {
  const radius = 46 * object.scale;
  context.save();
  context.translate(object.x, object.y);
  context.globalAlpha = object.opacity;
  context.lineWidth = 2;
  for (let index = 0; index < 3; index += 1) {
    const rotation = elapsed / 780 + index * (Math.PI * 2 / 3);
    context.strokeStyle = ["#66e1d0", "#efbd62", "#e37a96"][index];
    context.beginPath();
    context.arc(0, 0, radius - index * 10, rotation, rotation + Math.PI * 1.16);
    context.stroke();
  }
  context.globalAlpha *= 0.16;
  context.fillStyle = "#62d8d1";
  context.beginPath();
  context.arc(0, 0, radius * .68, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawComet(context, object) {
  const size = 15 * object.scale;
  context.save();
  context.translate(object.x, object.y);
  context.globalAlpha = object.opacity;
  const tail = context.createLinearGradient(-110 * object.scale, 0, 0, 0);
  tail.addColorStop(0, "rgba(78, 224, 210, 0)");
  tail.addColorStop(.76, "rgba(99, 226, 211, .28)");
  tail.addColorStop(1, "rgba(247, 200, 106, .9)");
  context.fillStyle = tail;
  context.beginPath();
  context.moveTo(-110 * object.scale, -5 * object.scale);
  context.lineTo(0, -size * .45);
  context.lineTo(0, size * .45);
  context.lineTo(-110 * object.scale, 5 * object.scale);
  context.closePath();
  context.fill();
  context.fillStyle = "#fff3c7";
  context.shadowColor = "#efd177";
  context.shadowBlur = 18;
  context.beginPath();
  context.arc(0, 0, size, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawOrb(context, object, elapsed) {
  const radius = 18 * object.scale;
  context.save();
  context.translate(object.x, object.y);
  context.globalAlpha = object.opacity;
  context.fillStyle = "#8fe8d8";
  context.shadowColor = "#67d8cf";
  context.shadowBlur = 22;
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(255, 235, 173, .9)";
  context.lineWidth = 1.5;
  context.beginPath();
  context.arc(0, 0, radius + 9 + Math.sin(elapsed / 180) * 3, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function drawPhone(context, object) {
  const size = 22 * object.scale;
  context.save();
  context.translate(object.x, object.y);
  context.rotate(-.72);
  context.globalAlpha = object.opacity;
  context.strokeStyle = "#f3c873";
  context.lineWidth = 8 * object.scale;
  context.lineCap = "round";
  context.shadowColor = "rgba(242, 194, 94, .62)";
  context.shadowBlur = 18;
  context.beginPath();
  context.moveTo(-size * .72, -size * .5);
  context.quadraticCurveTo(-size * .28, -size * .1, 0, 0);
  context.quadraticCurveTo(size * .28, size * .1, size * .72, size * .5);
  context.stroke();
  context.strokeStyle = "#13212a";
  context.lineWidth = 3 * object.scale;
  context.beginPath();
  context.moveTo(-size * .72, -size * .5);
  context.lineTo(-size * .46, -size * .83);
  context.moveTo(size * .72, size * .5);
  context.lineTo(size * .46, size * .83);
  context.stroke();
  context.restore();
}

function drawWave(context, object, elapsed) {
  const radius = 18 * object.scale;
  context.save();
  context.translate(object.x, object.y);
  context.globalAlpha = object.opacity;
  context.strokeStyle = "#98f0e1";
  context.lineWidth = 1.8 * object.scale;
  context.shadowColor = "#54d4c4";
  context.shadowBlur = 16;
  for (let index = 0; index < 3; index += 1) {
    const pulse = radius + index * 9 + Math.sin(elapsed / 155 + index) * 3;
    context.globalAlpha = object.opacity * (.78 - index * .18);
    context.beginPath();
    context.arc(0, 0, pulse, -Math.PI * .72, Math.PI * .72);
    context.stroke();
  }
  context.restore();
}

function drawCalendar(context, object) {
  const width = 46 * object.scale;
  const height = 42 * object.scale;
  context.save();
  context.translate(object.x, object.y);
  context.globalAlpha = object.opacity;
  context.fillStyle = "#d8e7ff";
  context.shadowColor = "rgba(115, 175, 243, .68)";
  context.shadowBlur = 18;
  context.beginPath();
  context.roundRect(-width / 2, -height / 2, width, height, 6 * object.scale);
  context.fill();
  context.fillStyle = "#5a86bd";
  context.fillRect(-width / 2, -height / 2, width, height * .27);
  context.fillStyle = "#173353";
  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      context.beginPath();
      context.arc(-width * .23 + column * width * .23, height * .06 + row * height * .2, 2.2 * object.scale, 0, Math.PI * 2);
      context.fill();
    }
  }
  context.restore();
}

function drawOrbit(context, object, elapsed) {
  const radius = 46 * object.scale;
  context.save();
  context.translate(object.x, object.y);
  context.globalAlpha = object.opacity;
  context.strokeStyle = "rgba(129, 170, 246, .76)";
  context.lineWidth = 1.5 * object.scale;
  for (let index = 0; index < 2; index += 1) {
    context.save();
    context.rotate(elapsed / 860 + index * Math.PI / 2);
    context.scale(1, .42 + index * .18);
    context.beginPath();
    context.arc(0, 0, radius - index * 10, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }
  context.fillStyle = "#a4c9ff";
  context.shadowColor = "#719ee3";
  context.shadowBlur = 22;
  context.beginPath();
  context.arc(0, 0, 4 * object.scale, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawRocket(context, object) {
  const size = 25 * object.scale;
  context.save();
  context.translate(object.x, object.y);
  context.rotate(.2);
  context.globalAlpha = object.opacity;
  context.fillStyle = "#f3d387";
  context.shadowColor = "rgba(246, 156, 74, .72)";
  context.shadowBlur = 18;
  context.beginPath();
  context.moveTo(size, 0);
  context.quadraticCurveTo(0, -size * .65, -size * .75, 0);
  context.quadraticCurveTo(0, size * .65, size, 0);
  context.fill();
  context.fillStyle = "#2b3d55";
  context.beginPath();
  context.arc(size * .22, 0, size * .18, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#f27d57";
  context.beginPath();
  context.moveTo(-size * .68, 0);
  context.lineTo(-size * 1.25, -size * .26);
  context.lineTo(-size * 1.1, 0);
  context.lineTo(-size * 1.25, size * .26);
  context.closePath();
  context.fill();
  context.restore();
}

function drawBeacon(context, object, elapsed) {
  const radius = 15 * object.scale;
  context.save();
  context.translate(object.x, object.y);
  context.globalAlpha = object.opacity;
  context.fillStyle = "#9df0ca";
  context.shadowColor = "#57d798";
  context.shadowBlur = 20;
  context.beginPath();
  context.arc(0, 0, radius * .45, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(136, 238, 181, .72)";
  context.lineWidth = 1.5 * object.scale;
  for (let index = 0; index < 3; index += 1) {
    context.globalAlpha = object.opacity * (.72 - index * .18);
    context.beginPath();
    context.arc(0, 0, radius + index * 12 + Math.sin(elapsed / 180 + index) * 3, 0, Math.PI * 2);
    context.stroke();
  }
  context.restore();
}

function drawDrone(context, object, elapsed) {
  const size = 20 * object.scale;
  context.save();
  context.translate(object.x, object.y);
  context.rotate(Math.sin(elapsed / 170) * .1);
  context.globalAlpha = object.opacity;
  context.fillStyle = "#f15bbc";
  context.beginPath();
  context.moveTo(0, -size);
  context.lineTo(size, 0);
  context.lineTo(0, size);
  context.lineTo(-size, 0);
  context.closePath();
  context.fill();
  context.fillStyle = "#fff0c1";
  context.beginPath();
  context.moveTo(0, -size * .45);
  context.lineTo(size * .45, 0);
  context.lineTo(0, size * .45);
  context.lineTo(-size * .45, 0);
  context.closePath();
  context.fill();
  context.strokeStyle = "#55e4ff";
  context.lineWidth = 3 * object.scale;
  context.beginPath();
  context.moveTo(-size * 1.6, 0);
  context.lineTo(-size * .55, 0);
  context.moveTo(size * .55, 0);
  context.lineTo(size * 1.6, 0);
  context.stroke();
  context.restore();
}

function drawVault(context, object, elapsed) {
  const size = 30 * object.scale;
  context.save();
  context.translate(object.x, object.y);
  context.rotate(elapsed / 900);
  context.globalAlpha = object.opacity;
  context.strokeStyle = "#63e7ff";
  context.lineWidth = 2 * object.scale;
  context.strokeRect(-size, -size, size * 2, size * 2);
  context.strokeStyle = "#ff58c7";
  context.strokeRect(-size * .65, -size * .65, size * 1.3, size * 1.3);
  context.fillStyle = "#f7ce5f";
  context.beginPath();
  context.arc(0, 0, size * .23, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawShard(context, object) {
  const size = 20 * object.scale;
  context.save();
  context.translate(object.x, object.y);
  context.globalAlpha = object.opacity;
  context.fillStyle = "#5be7ff";
  context.beginPath();
  context.moveTo(0, -size);
  context.lineTo(size * .7, 0);
  context.lineTo(0, size);
  context.lineTo(-size * .7, 0);
  context.closePath();
  context.fill();
  context.restore();
}

function drawBeam(context, object, elapsed) {
  const width = 160 * object.scale;
  context.save();
  context.translate(object.x, object.y);
  context.globalAlpha = object.opacity * (.5 + Math.sin(elapsed / 130) * .2);
  context.fillStyle = "#62e7ff";
  context.fillRect(-width / 2, -2 * object.scale, width, 4 * object.scale);
  context.fillStyle = "rgba(255, 78, 196, .18)";
  context.fillRect(-width / 3, -6 * object.scale, width * .66, 12 * object.scale);
  context.restore();
}

function drawStoryObject(context, object) {
  const size = 30 * object.scale;
  context.save();
  context.translate(object.x, object.y);
  context.rotate(object.rotation ?? 0);
  context.globalAlpha = object.opacity;
  context.lineWidth = 2 * object.scale;
  context.strokeStyle = "#b5d9f4";
  context.fillStyle = "#f1c96f";
  if (object.kind === "inkwell") {
    context.fillRect(-size * .56, -size * .06, size * 1.12, size * .82);
    context.strokeRect(-size * .3, -size * .55, size * .6, size * .48);
    context.beginPath(); context.moveTo(size * .18, -size * 1.08); context.lineTo(-size * .18, -size * .12); context.stroke();
  } else if (object.kind === "quill") {
    context.beginPath(); context.moveTo(-size * .52, size * .76); context.quadraticCurveTo(size * .1, -size, size * .62, -size * .34); context.stroke();
  } else if (object.kind === "glyph" || object.kind === "document") {
    context.fillStyle = "#f7f0d8"; context.fillRect(-size, -size * .7, size * 2, size * 1.4);
    context.strokeStyle = "#435274"; for (let index = 0; index < 4; index += 1) { context.beginPath(); context.moveTo(-size * .58, -size * .32 + index * size * .24); context.lineTo(size * (.52 - index * .08), -size * .32 + index * size * .24); context.stroke(); }
  } else if (object.kind === "switchboard") {
    context.fillStyle = "#1c3140"; context.fillRect(-size * 1.35, -size, size * 2.7, size * 2);
    for (let row = 0; row < 2; row += 1) for (let column = 0; column < 4; column += 1) { context.fillStyle = (row + column) % 2 ? "#ffcf72" : "#7ce4d1"; context.beginPath(); context.arc(-size * .76 + column * size * .5, -size * .36 + row * size * .78, size * .12, 0, Math.PI * 2); context.fill(); }
  } else if (object.kind === "dial" || object.kind === "clock") {
    context.beginPath(); context.arc(0, 0, size, 0, Math.PI * 2); context.stroke(); context.beginPath(); context.moveTo(0, 0); context.lineTo(0, -size * .62); context.moveTo(0, 0); context.lineTo(size * .45, size * .24); context.stroke();
  } else if (object.kind === "seed") {
    context.beginPath(); context.ellipse(0, 0, size * .38, size * .58, 0, 0, Math.PI * 2); context.fill();
  } else if (object.kind === "sprout") {
    context.strokeStyle = "#81d7b1"; context.lineWidth = 4 * object.scale; context.beginPath(); context.moveTo(0, size * .75); context.lineTo(0, -size * .5); context.stroke(); context.fillStyle = "#f1c96f"; context.beginPath(); context.ellipse(-size * .4, -size * .26, size * .42, size * .22, -.4, 0, Math.PI * 2); context.ellipse(size * .4, size * .04, size * .42, size * .22, .4, 0, Math.PI * 2); context.fill();
  } else if (object.kind === "bloom") {
    for (let index = 0; index < 6; index += 1) { const angle = index / 6 * Math.PI * 2; context.beginPath(); context.arc(Math.cos(angle) * size * .62, Math.sin(angle) * size * .62, size * .42, 0, Math.PI * 2); context.fill(); } context.fillStyle = "#b5d9f4"; context.beginPath(); context.arc(0, 0, size * .4, 0, Math.PI * 2); context.fill();
  } else if (object.kind === "forge") {
    context.fillStyle = "#3e1b1d"; context.fillRect(-size * 1.35, -size * .8, size * 2.7, size * 1.6); context.fillStyle = "#f36c4d"; context.beginPath(); context.arc(0, size * .3, size * .56, Math.PI, Math.PI * 2); context.fill();
  } else if (object.kind === "anvil") {
    context.fillStyle = "#9dbccb"; context.beginPath(); context.moveTo(-size, size * .4); context.lineTo(-size * .32, 0); context.lineTo(size * .22, 0); context.lineTo(size, -size * .3); context.lineTo(size * .55, size * .4); context.closePath(); context.fill();
  } else if (object.kind === "shield") {
    context.beginPath(); context.moveTo(0, -size); context.lineTo(size * .76, -size * .48); context.lineTo(size * .58, size * .58); context.lineTo(0, size); context.lineTo(-size * .58, size * .58); context.lineTo(-size * .76, -size * .48); context.closePath(); context.stroke();
  } else if (object.kind === "lock") {
    context.fillStyle = "#8bc4d2"; context.fillRect(-size * .68, -size * .06, size * 1.36, size); context.beginPath(); context.arc(0, -size * .06, size * .42, Math.PI, Math.PI * 2); context.stroke();
  } else if (object.kind === "chorus") {
    for (const [x, y] of [[-size * .72, size * .16], [0, -size * .46], [size * .74, size * .24]]) { context.fillStyle = "#cf9feb"; context.fillRect(x - size * .36, y - size * .24, size * .72, size * .48); }
  }
  context.restore();
}

function drawParticles(context, particles, elapsed) {
  for (const particle of particles) {
    context.save();
    context.fillStyle = "rgba(245, 199, 105, .7)";
    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI * 2 * index) / 6 + elapsed / 500;
      const radius = 16 + (elapsed % 300) / 18;
      context.beginPath();
      context.arc(particle.x + Math.cos(angle) * radius, particle.y + Math.sin(angle) * radius, 2, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }
}

function drawFrame(context, frame, labels) {
  const width = context.canvas.width / (globalThis.devicePixelRatio || 1);
  const height = context.canvas.height / (globalThis.devicePixelRatio || 1);
  context.clearRect(0, 0, width, height);
  const background = context.createRadialGradient(width * 0.5, height * 0.42, 10, width * 0.5, height * 0.5, width * 0.7);
  background.addColorStop(0, "#183d43");
  background.addColorStop(.5, "#111c24");
  background.addColorStop(1, "#090d12");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);
  context.save();
  context.strokeStyle = "rgba(133, 219, 207, .07)";
  context.lineWidth = 1;
  for (let x = 0; x < width; x += 44) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x + height * .42, height);
    context.stroke();
  }
  context.restore();
  if (frame.usedAnchors.includes("actor")) drawAnchor(context, frame.anchors.actor, labels.actorLabel, "#f0bc58");
  if (frame.usedAnchors.includes("recipient")) drawAnchor(context, frame.anchors.recipient, labels.recipientLabel, "#72d0b1");
  for (const object of frame.objects) {
    if (object.kind === "envelope") drawEnvelope(context, object);
    if (object.kind === "portal") drawPortal(context, object, frame.elapsedMs);
    if (object.kind === "comet") drawComet(context, object);
    if (object.kind === "orb") drawOrb(context, object, frame.elapsedMs);
    if (object.kind === "phone") drawPhone(context, object);
    if (object.kind === "wave") drawWave(context, object, frame.elapsedMs);
    if (object.kind === "calendar") drawCalendar(context, object);
    if (object.kind === "orbit") drawOrbit(context, object, frame.elapsedMs);
    if (object.kind === "rocket") drawRocket(context, object);
    if (object.kind === "beacon") drawBeacon(context, object, frame.elapsedMs);
    if (object.kind === "drone") drawDrone(context, object, frame.elapsedMs);
    if (object.kind === "vault") drawVault(context, object, frame.elapsedMs);
    if (object.kind === "shard") drawShard(context, object);
    if (object.kind === "beam") drawBeam(context, object, frame.elapsedMs);
    if (["inkwell", "quill", "glyph", "switchboard", "dial", "clock", "seed", "sprout", "bloom", "forge", "anvil", "shield", "lock", "document", "chorus"].includes(object.kind)) drawStoryObject(context, object);
  }
  drawParticles(context, frame.particles, frame.elapsedMs);
  for (const item of frame.text) {
    context.save();
    context.fillStyle = "#f8f3e7";
    context.font = "650 16px system-ui";
    context.textAlign = "center";
    context.fillText(item.text, item.x, item.y - 62);
    context.restore();
  }
}

export function createCanvasStageRenderer(canvas, options = {}) {
  const context = canvas.getContext("2d");
  let animationFrame = null;
  let active = null;

  function stop() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = null;
    active = null;
  }

  function render(presentation, renderOptions = {}) {
    stop();
    if (!presentation?.timeline) return;
    const size = resizeCanvas(canvas);
    context.setTransform(size.ratio, 0, 0, size.ratio, 0, 0);
    const reducedMotion = renderOptions.reducedMotion ?? options.reducedMotion ?? globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    const labels = renderOptions.slots ?? { actorLabel: "You", recipientLabel: "a recipient" };
    const startedAt = performance.now();
    active = { presentation, labels, reducedMotion, startedAt };

    const paint = (now) => {
      if (!active) return;
      const rawElapsed = active.reducedMotion ? active.presentation.timeline.durationMs : now - active.startedAt;
      const elapsed = timelineElapsed(active.presentation.timeline, rawElapsed, active.reducedMotion);
      const frame = renderTimelineFrame(active.presentation.timeline, elapsed, { width: size.width, height: size.height, reducedMotion: active.reducedMotion });
      drawFrame(context, frame, active.labels);
      if (options.onCaption) options.onCaption(frame.text.map((item) => item.text).join(" "));
      if (!active.reducedMotion && (active.presentation.timeline.loop || rawElapsed < active.presentation.timeline.durationMs)) animationFrame = requestAnimationFrame(paint);
    };
    animationFrame = requestAnimationFrame(paint);
  }

  function clear() {
    stop();
    const size = resizeCanvas(canvas);
    context.setTransform(size.ratio, 0, 0, size.ratio, 0, 0);
    context.clearRect(0, 0, size.width, size.height);
  }

  return { render, clear, stop };
}
