import { createLastStopWorld } from "../apps/codex-stage/studio/last-stop.js";
export const encoreTick = g => g.step(1000 / 120);
export function crossBridges(g) {
  const route = [];
  for (let i = 0; i < 10; i++) {
    const length = g.scene.target.x + g.scene.target.w / 2 - g.scene.anchor, ticks = Math.round(length / 1.5); route.push(ticks);
    g.key(" ", true); for (let n = 0; n < ticks; n++) encoreTick(g); g.key(" ", false);
    for (let n = 0; n < 250 && g.scene.progress === i && !g.scene.deaths; n++) encoreTick(g);
    if (g.scene.progress !== i + 1) throw new Error(`Bridge ${i + 1} failed`);
  }
  return route;
}
export function pinAim(s) {
  const tau = Math.PI * 2, pins = s.pins.slice().sort((a, b) => a - b); let gap = 0, middle = 0;
  for (let i = 0; i < pins.length; i++) { const next = i === pins.length - 1 ? pins[0] + tau : pins[i + 1], width = next - pins[i]; if (width > gap) { gap = width; middle = (pins[i] + width / 2) % tau; } }
  let angle = s.angle;
  const direction = s.progress >= 6 && s.progress < 12 ? -1 : 1;
  for (let n = 1; n <= 16; n++) angle += direction * (1.05 + s.progress * .037 + Math.sin((s.time + n * 1000 / 120) / 1150) * .22) / 120;
  const target = Math.PI / 2 - angle;
  return { error: Math.abs(Math.atan2(Math.sin(target - middle), Math.cos(target - middle))), margin: gap / 2 - .18 };
}
export function fillOrbit(g) {
  const route = [];
  for (let i = 0; i < 18; i++) {
    let n = 0;
    while ((g.scene.mode !== "ready" || pinAim(g.scene).error > Math.min(.014, pinAim(g.scene).margin * .6)) && n++ < 1700) encoreTick(g);
    if (n >= 1700) throw new Error(`No legal gap for pin ${i + 1}`);
    route.push(Math.round(g.scene.time)); g.primary();
    for (let t = 0; t < 80 && g.scene.progress === i && !g.scene.deaths; t++) encoreTick(g);
    if (g.scene.progress !== i + 1) throw new Error(`Pin ${i + 1} collided`);
  }
  return route;
}
export function solveBrake(checkpoint) {
  const hits = [];
  for (let hold = 1; hold < 290; hold++) {
    const g = createLastStopWorld({ checkpoint }); g.key(" ", true);
    for (let n = 0; n < hold && g.scene.phase === "playing"; n++) encoreTick(g); g.key(" ", false);
    for (let n = 0; n < 650 && g.scene.mode === "braking"; n++) encoreTick(g);
    if (g.scene.mode === "parked") hits.push({ ticks: hold, error: Math.abs(g.scene.x - g.scene.target.x) }); g.destroy();
  }
  if (!hits.length) throw new Error(`No brake solution: ${JSON.stringify(checkpoint)}`);
  hits.sort((a, b) => a.error - b.error); return { ...hits[0], window: hits.length * 1000 / 120 };
}
export function parkAll(g) {
  const route = [];
  for (let i = 0; i < 8; i++) {
    while (g.scene.mode === "parked") encoreTick(g);
    const pick = solveBrake(g.checkpoint()); route.push(pick); g.key(" ", true); for (let n = 0; n < pick.ticks; n++) encoreTick(g); g.key(" ", false);
    for (let n = 0; n < 650 && g.scene.mode === "braking"; n++) encoreTick(g);
    if (g.scene.progress !== i + 1) throw new Error(`Parking ${i + 1} missed`);
  }
  return route;
}
export function flipCourse(g) {
  const route = []; g.primary();
  for (let t = 0; t < 6000 && g.scene.phase === "playing"; t++) {
    const target = g.scene.columns[g.scene.progress], desired = target?.ceiling ? 1 : -1;
    if (target && g.scene.gravity !== desired) { g.primary(); route.push({ time: Math.round(g.scene.time), gate: g.scene.progress + 1 }); }
    encoreTick(g);
  }
  if (g.scene.phase !== "won") throw new Error(`Gravity failed at gate ${g.scene.progress + 1}`); return route;
}
