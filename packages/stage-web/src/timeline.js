function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function easeInOut(value) {
  const clamped = clamp(value);
  return clamped * clamped * (3 - 2 * clamped);
}

function pointOnCurve(from, control, to, progress) {
  const t = easeInOut(progress);
  const inverse = 1 - t;
  return {
    x: inverse * inverse * from.x + 2 * inverse * t * control.x + t * t * to.x,
    y: inverse * inverse * from.y + 2 * inverse * t * control.y + t * t * to.y,
  };
}

function defaultAnchors(width, height) {
  return {
    actor: { x: width * 0.2, y: height * 0.68 },
    recipient: { x: width * 0.8, y: height * 0.34 },
    center: { x: width * 0.5, y: height * 0.5 },
    top: { x: width * 0.5, y: height * 0.2 },
    bottom: { x: width * 0.5, y: height * 0.82 },
    left: { x: width * 0.18, y: height * 0.5 },
    right: { x: width * 0.82, y: height * 0.5 },
  };
}

function resolvedElapsed(timeline, elapsedMs, reducedMotion) {
  return timelineElapsed(timeline, elapsedMs, reducedMotion);
}

/** Returns a renderer-neutral frame derived exclusively from a safe Stage timeline. */
export function timelineElapsed(timeline, elapsedMs, reducedMotion = false) {
  if (!timeline || !Number.isInteger(timeline.durationMs) || timeline.durationMs <= 0) return 0;
  if (reducedMotion) return timeline.durationMs;
  if (timeline.loop) return Math.max(0, elapsedMs) % timeline.durationMs;
  return Math.min(Math.max(0, elapsedMs), timeline.durationMs);
}

export function renderTimelineFrame(timeline, elapsedMs, options = {}) {
  const width = options.width ?? 900;
  const height = options.height ?? 460;
  const anchors = { ...defaultAnchors(width, height), ...(options.anchors ?? {}) };
  const elapsed = resolvedElapsed(timeline, elapsedMs, options.reducedMotion);
  const objects = new Map();
  const text = [];
  const particles = [];
  const usedAnchors = new Set();

  for (const track of timeline.tracks) {
    for (const key of [track.anchor, track.from, typeof track.to === "string" ? track.to : undefined]) {
      if (key && anchors[key]) usedAnchors.add(key);
    }
  }

  for (const track of timeline.tracks) {
    if (track.atMs > elapsed) continue;
    if (track.command === "spawn") {
      objects.set(track.id, {
        id: track.id,
        kind: track.kind,
        anchor: track.anchor,
        x: anchors[track.anchor].x,
        y: anchors[track.anchor].y,
        opacity: 1,
        scale: 1,
        rotation: 0,
      });
      continue;
    }
    if (track.command === "move" || track.command === "path") {
      const object = objects.get(track.id);
      if (!object) continue;
      const progress = clamp((elapsed - track.atMs) / Math.max(track.durationMs, 1));
      if (track.command === "move") {
        object.x = anchors[track.from].x + (anchors[track.to].x - anchors[track.from].x) * easeInOut(progress);
        object.y = anchors[track.from].y + (anchors[track.to].y - anchors[track.from].y) * easeInOut(progress);
      } else {
        const from = anchors[track.from];
        const to = anchors[track.to];
        const arc = Math.abs(to.x - from.x) * track.arc;
        const control = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 - arc };
        Object.assign(object, pointOnCurve(from, control, to, progress));
      }
      continue;
    }
    if (track.command === "orbit") {
      const object = objects.get(track.id);
      if (!object) continue;
      const progress = clamp((elapsed - track.atMs) / Math.max(track.durationMs, 1));
      const radius = Math.min(width, height) * track.radius;
      const angle = -Math.PI / 2 + Math.PI * 2 * track.turns * easeInOut(progress);
      object.x = anchors[track.anchor].x + Math.cos(angle) * radius;
      object.y = anchors[track.anchor].y + Math.sin(angle) * radius * 0.58;
      continue;
    }
    if (track.command === "pulse") {
      const object = objects.get(track.id);
      if (!object) continue;
      const progress = clamp((elapsed - track.atMs) / Math.max(track.durationMs, 1));
      const amount = (Math.sin(Math.PI * 2 * track.count * progress - Math.PI / 2) + 1) / 2;
      object.scale = 1 + (track.to - 1) * amount;
      continue;
    }
    if (track.command === "rotate") {
      const object = objects.get(track.id);
      if (object) {
        const progress = clamp((elapsed - track.atMs) / Math.max(track.durationMs, 1));
        object.rotation = Math.PI * 2 * track.turns * easeInOut(progress);
      }
      continue;
    }
    if (track.command === "shake") {
      const object = objects.get(track.id);
      if (object) {
        const progress = clamp((elapsed - track.atMs) / Math.max(track.durationMs, 1));
        const offset = Math.sin(Math.PI * 11 * progress) * track.amplitude * (1 - progress);
        object.x += offset;
        object.y += Math.cos(Math.PI * 7 * progress) * track.amplitude * 0.35 * (1 - progress);
      }
      continue;
    }
    if (track.command === "fade" || track.command === "scale") {
      const object = objects.get(track.id);
      if (object) object[track.command === "fade" ? "opacity" : "scale"] = track.to;
      continue;
    }
    if (track.command === "text") {
      text.push({ id: track.id, text: track.text, anchor: track.anchor, x: anchors[track.anchor].x, y: anchors[track.anchor].y });
      continue;
    }
    if (track.command === "particle") {
      particles.push({ id: track.id, anchor: track.anchor, x: anchors[track.anchor].x, y: anchors[track.anchor].y, atMs: track.atMs });
    }
  }

  return { elapsedMs: elapsed, durationMs: timeline.durationMs, anchors, usedAnchors: [...usedAnchors], objects: [...objects.values()], text, particles };
}
