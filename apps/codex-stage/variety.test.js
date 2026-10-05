import test from "node:test";
import assert from "node:assert/strict";
import { createDemolitionWorld } from "./studio/marble-demolition.js";
import { createTownWorld } from "./studio/pocket-town.js";
import { createClearoutWorld } from "./studio/clockout-clearout.js";
import { demolish, finishFlight, TOWN_ROUTE } from "../../tools/variety-replays.mjs";
import { VARIETY_CATALOG } from "./studio/variety-catalog.js";
import { buildReviewedPack } from "./packs/build.js";
const tick = (g, n = 120) => { for (let i = 0; i < n; i++) g.step(1000 / 120); };
for (const create of [createDemolitionWorld, createTownWorld, createClearoutWorld]) {
  test(`${create.name}: idle is safe, input is local, task completion is synchronous`, () => {
    const events = [], g = create({ onEvent: e => events.push(e) }); tick(g);
    assert.equal(g.scene.score, 0); assert.equal(g.pointer("down", -20, 300), false); g.primary(); tick(g, 18); g.stop();
    const before = JSON.stringify(g.scene), cp = g.checkpoint(), n = events.length; tick(g, 300);
    assert.equal(JSON.stringify(g.scene), before); assert.deepEqual(g.checkpoint(), cp); assert.equal(events.length, n);
    assert.equal(g.primary(), false); assert.equal(g.secondary(), false); assert.equal(g.retry(), false); assert.equal(g.key("Enter", true), false); g.destroy();
  });
  test(`${create.name}: untrusted and oversized saves cannot fabricate a win`, () => {
    const original = create(), id = original.scene.id; original.destroy();
    for (const cp of [{ version: 1, id: "wrong", phase: "won" }, { version: 1, id, data: { score: Infinity, phase: "won", command: "secret" } }, { data: "x".repeat(9000) }]) {
      const g = create({ checkpoint: cp }); assert.equal(g.scene.phase, "playing"); assert.equal(g.scene.score, 0); assert.ok(JSON.stringify(g.checkpoint()).length < 8192); assert.equal(JSON.stringify(g.checkpoint()).includes("secret"), false); g.destroy();
    }
  });
}
test("marble: release launches real physics; clicks alone do not destroy blocks", () => {
  const g = createDemolitionWorld(); g.pointer("down", 470, 220); assert.equal(g.scene.score, 0); g.pointer("up", 470, 220);
  assert.equal(g.scene.mode, "flight"); assert.equal(g.scene.score, 0); tick(g, 240); assert.ok(g.scene.destroyed > 0); g.destroy();
});
test("town: remote and occupied cells are rejected; placement and undo change the actual town", () => {
  const g = createTownWorld(); assert.equal(g.place(0), false); assert.equal(g.place(12), false); assert.equal(g.place(13), true);
  assert.equal(g.scene.turn, 1); assert.equal(g.scene.cells[13].type, "home"); assert.equal(g.place(13), false); assert.equal(g.secondary(), true); assert.equal(g.scene.turn, 0); assert.equal(g.scene.cells[13], null); g.destroy();
});
test("clearout: only removable supports can be selected and removing does not count as delivery", () => {
  const g = createClearoutWorld(); assert.equal(g.pull(90), false); assert.equal(g.pull(0), true); assert.equal(g.scene.mode, "settling"); assert.equal(g.scene.progress, 0); assert.equal(g.pull(1), false); tick(g, 60); assert.ok(g.scene.items.some(i => i.y > 160)); g.destroy();
});
test("clearout: all three trucks load through physical contacts and the other support really fails", () => {
  const g = createClearoutWorld();
  for (let chapter = 0; chapter < 3; chapter++) { assert.equal(g.pull(0), true); for (let n = 0; n < 1500 && g.scene.mode === "settling"; n++) tick(g, 1); assert.equal(g.scene.delivered, g.scene.items.length, `truck ${chapter + 1}`); if (chapter < 2) g.primary(); }
  assert.equal(g.scene.phase, "won"); g.destroy();
  const bad = createClearoutWorld(); bad.pull(1); for (let n = 0; n < 1500 && bad.scene.mode === "settling"; n++) tick(bad, 1); assert.equal(bad.scene.phase, "lost"); bad.destroy();
});
test("town: a legal layout opens all homes, shops and the railway; undo can revise a completed town", () => {
  const g = createTownWorld(); for (const i of [13,14,19,18,11,7,6,1,2,10,17,16,21,22,15]) assert.equal(g.place(i), true);
  assert.equal(g.scene.phase, "won"); const loaded = createTownWorld({ checkpoint: g.checkpoint() }); assert.equal(loaded.scene.phase, "won"); assert.equal(loaded.scene.homes, 6); assert.equal(loaded.secondary(), true); assert.equal(loaded.scene.phase, "playing"); g.destroy(); loaded.destroy();
});
test("marble: a legal campaign uses real split and electrical contacts, and restarts cleanly", () => {
  const events = [], g = createDemolitionWorld({ onEvent: e => events.push(e.type) });
  assert.ok(demolish(g).length >= 3); assert.equal(g.scene.phase, "won"); assert.deepEqual(g.scene.modules, ["split", "charge"]);
  assert.ok(events.includes("variety-split")); assert.ok(events.includes("variety-electric"));
  const restored = createDemolitionWorld({ checkpoint: g.checkpoint() }); assert.equal(restored.scene.phase, "won"); restored.primary(); assert.equal(restored.scene.chapter, 0); assert.equal(restored.scene.score, 0); assert.deepEqual(restored.scene.modules, []); g.destroy(); restored.destroy();
});
test("marble: interrupted flight rewinds only its unfinished shot, and misses consume ammunition", () => {
  const g = createDemolitionWorld(), cp = g.checkpoint(); g.pointer("down", 200, 380); g.pointer("up", 200, 380); tick(g, 60);
  assert.deepEqual(g.checkpoint(), cp); const restored = createDemolitionWorld({ checkpoint: g.checkpoint() }); assert.equal(restored.scene.mode, "aim"); assert.equal(restored.scene.shots, 7); assert.equal(restored.scene.score, 0);
  finishFlight(g); assert.equal(g.scene.shots, 6); assert.equal(g.scene.mode, "aim");
  for (let n = 0; n < 6; n++) { g.pointer("down", 200, 380); g.pointer("up", 200, 380); finishFlight(g); }
  assert.equal(g.scene.phase, "lost"); assert.equal(g.scene.progress, 0); g.destroy(); restored.destroy();
});
test("all three cancel a pending pointer without committing the action", () => {
  for (const [create,x,y] of [[createDemolitionWorld,470,220],[createTownWorld,578,280],[createClearoutWorld,498,335]]) {
    const g = create(), cp = g.checkpoint(); assert.equal(g.pointer("down", x,y), true); g.cancel(); assert.equal(g.pointer("up",x,y), false); assert.deepEqual(g.checkpoint(), cp); g.destroy();
  }
});
test("town: every partial layout round-trips, score is earned by neighbors rather than placement count", () => {
  const g = createTownWorld(); for (const cell of TOWN_ROUTE) { g.place(cell); const other = createTownWorld({ checkpoint: g.checkpoint() }); assert.deepEqual(other.scene.cells, g.scene.cells); assert.equal(other.scene.score, g.scene.score); other.destroy(); }
  const bad = createTownWorld(); for (let i = 0; i < 15; i++) bad.place(bad.scene.available[0]); assert.equal(bad.scene.mode, "review"); assert.notEqual(bad.scene.phase, "won"); assert.ok(bad.scene.score < g.scene.score); bad.destroy(); g.destroy();
});
test("clearout: unfinished cargo is retried; completed cargo restores a physically settled tableau", () => {
  const g = createClearoutWorld(); g.pull(0); tick(g,100); const paused = createClearoutWorld({ checkpoint: g.checkpoint() }); assert.equal(paused.scene.mode,"choose"); assert.equal(paused.scene.delivered,0); paused.destroy();
  for (let chapter=0;chapter<3;chapter++) { if (chapter) g.pull(0); for(let n=0;n<1500&&g.scene.mode==="settling";n++) tick(g,1); if(chapter<2)g.primary(); }
  const other = createClearoutWorld({ checkpoint:g.checkpoint() }); assert.equal(other.scene.phase,"won"); assert.equal(other.scene.delivered,5); assert.ok(other.scene.items.every(i=>i.delivered && i.x>other.scene.truck.left && i.x<other.scene.truck.right && i.y>320)); other.destroy();g.destroy();
});
test("variety is opt-in, offline, bounded and embeds only the selected reviewed world", () => {
  for(const game of VARIETY_CATALOG) { assert.equal(game.release,"preview");const p=buildReviewedPack(game.id);assert.deepEqual(p.manifest.permissions,[]);assert.ok(p.manifest.bytes<1600000);assert.match(p.source,/createVarietySound/);assert.equal(p.source.includes("https://"),false);for(const other of VARIETY_CATALOG.filter(g=>g.id!==game.id))assert.equal(p.source.includes(`id: "${other.id}"`),false); }
});
