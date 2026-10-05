import { createSwingWorld } from "../apps/codex-stage/studio/swing-post.js";
export const oneTick = g => g.step(1000 / 120);
export function stackTower(g) {
  for (let floor = 0; floor < 12; floor++) {
    let wait = 0;
    while (Math.abs(g.scene.moving.x - g.scene.top.x) > 1.6 && wait++ < 2000) oneTick(g);
    if (wait >= 2000) throw new Error("No tower alignment window");
    g.primary(); for (let t = 0; t < 150 && g.scene.progress === floor && !g.scene.deaths; t++) oneTick(g);
    if (g.scene.progress !== floor + 1) throw new Error(`Floor ${floor + 1} failed`);
  }
  return g.snapshot();
}
export function crossPresses(g) {
  const inputs = []; let pressed = false, crossing = -1;
  for (let t = 0; t < 18000 && g.scene.phase === "playing"; t++) {
    const s = g.scene, gate = s.gates[s.progress]; let run = !gate;
    if (gate) {
      const waitingLine = gate.x - gate.w / 2 - 23;
      if (s.x < waitingLine) run = true;
      else { if (gate.phase < .09) crossing = gate.id; run = crossing === gate.id; }
    }
    if (run !== pressed) { pressed = run; g.key(" ", run); inputs.push({ t, down: run }); }
    oneTick(g); if (g.scene.deaths) throw new Error(`Crushed at ${g.scene.progress}`);
  }
  g.key(" ", false);
  if (g.scene.phase !== "won") throw new Error("Press course timed out"); return inputs;
}
export function solveSwing(checkpoint) {
  const hits = [];
  for (let ticks = 20; ticks < 130; ticks++) {
    const probe = createSwingWorld({ checkpoint }); probe.key(" ", true);
    for (let t = 0; t < ticks; t++) oneTick(probe); probe.key(" ", false);
    for (let t = 0; t < 200 && probe.scene.mode === "flight"; t++) oneTick(probe);
    if (probe.scene.mode === "delivered") hits.push({ ticks, error: Math.abs(probe.scene.parcel.x - probe.scene.target.x) });
    probe.destroy();
  }
  if (!hits.length) throw new Error(`No physical delivery for round ${checkpoint.data.progress + 1}`);
  // Favor a continuous release window over an isolated, perfectly centered tick.
  const windows = [];
  for (const hit of hits) { const previous = windows.at(-1); if (previous && previous.at(-1).ticks === hit.ticks - 1) previous.push(hit); else windows.push([hit]); }
  windows.sort((a, b) => b.length - a.length);
  const widest = windows[0];
  return { ...widest[Math.floor((widest.length - 1) / 2)], window: widest.length * 1000 / 120 };
}
export function deliverPost(g) {
  const route = [];
  for (let round = 0; round < 8; round++) {
    for (let t = 0; t < 80 && g.scene.mode === "delivered"; t++) oneTick(g);
    const pick = solveSwing(g.checkpoint()); route.push(pick); g.key(" ", true);
    const remaining = Math.max(0, pick.ticks - Math.round(g.scene.roundTime / (1000 / 120)));
    for (let t = 0; t < remaining; t++) oneTick(g); g.key(" ", false);
    for (let t = 0; t < 200 && g.scene.mode === "flight"; t++) oneTick(g);
    if (g.scene.progress !== round + 1) throw new Error(`Delivery ${round + 1} failed`);
  }
  return route;
}
