import { createToastWorld } from "../apps/codex-stage/studio/toast-hop.js";
export function toastTicks(g, ticks) { for (let i = 0; i < ticks; i++) g.step(1000 / 120); }
export function toastJump(g, ticks) { g.key(" ", true); toastTicks(g, ticks); g.key(" ", false); }

// Explore only public input on independent worlds. Never change a body or award progress.
export function solveToastJump(checkpoint) {
  let best = null, successes = 0;
  for (let hold = 0; hold <= 108; hold++) {
    const candidate = createToastWorld({ checkpoint }); toastJump(candidate, hold);
    for (let i = 0; i < 200 && candidate.scene.mode === "flight"; i++) toastTicks(candidate, 1);
    if (candidate.scene.index === checkpoint.index + 1) {
      successes++; const error = Math.abs(candidate.scene.player.x - candidate.scene.platforms[candidate.scene.index].x);
      if (!best || error < best.error) best = { ticks: hold, error };
    }
    candidate.destroy();
  }
  if (!best) throw new Error(`No legal jump from table ${checkpoint.index}`);
  return { ...best, windowMs: successes * 1000 / 120 };
}
export function serveToast(g) {
  const route = [];
  for (let i = 0; i < 10; i++) {
    const choice = solveToastJump(g.checkpoint()); route.push(choice); toastJump(g, choice.ticks);
    for (let n = 0; n < 200 && g.scene.mode === "flight"; n++) toastTicks(g, 1);
    if (g.scene.index !== i + 1) throw new Error(`Replay failed at table ${i + 1}`);
  }
  return route;
}
