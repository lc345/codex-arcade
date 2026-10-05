import { createDemolitionWorld } from "../apps/codex-stage/studio/marble-demolition.js";
export const TOWN_ROUTE = [13,14,19,18,11,7,6,1,2,10,17,16,21,22,15];
export function finishFlight(g) { for (let n = 0; n < 1000 && g.scene.mode === "flight"; n++) g.step(1000 / 120); }
export function bestMarbleShot(checkpoint) {
  let best;
  for (let x = 220; x <= 740; x += 16) {
    const g = createDemolitionWorld({ checkpoint }); g.pointer("down", x, 250); g.pointer("up", x, 250); finishFlight(g);
    const value = g.scene.destroyed * 20 + g.scene.blocks.reduce((n, p) => n + p.maxHp - p.hp, 0);
    if (!best || value > best.value) best = { x, y: 250, value, won: ["upgrade", "complete"].includes(g.scene.mode) }; g.destroy();
  }
  return best;
}
export function demolish(g) {
  const route = [];
  for (let n = 0; n < 24 && g.scene.phase !== "won"; n++) {
    if (g.scene.phase === "lost") throw Error(`No more shots in block ${g.scene.chapter + 1}`);
    if (g.scene.mode === "upgrade") { g.primary(); continue; }
    const aim = bestMarbleShot(g.checkpoint()); route.push(aim); g.pointer("down", aim.x, aim.y); g.pointer("up", aim.x, aim.y); finishFlight(g);
  }
  if (g.scene.phase !== "won") throw Error("Demolition incomplete"); return route;
}
