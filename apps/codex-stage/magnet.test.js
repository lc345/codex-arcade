import test from "node:test";
import assert from "node:assert/strict";
import { createMagnetWorld } from "./studio/magnet-rampage.js";
import { magnetTarget, sweepStreet } from "../../tools/magnet-replays.mjs";
import { buildReviewedPack } from "./packs/build.js";
import { MAGNET_CATALOG } from "./studio/magnet-catalog.js";

const tick = (g, n = 120) => { for (let i = 0; i < n; i++) g.step(1000 / 120); };
const aim = (g, x, y) => g.pointer("move", 480, 270, "mouse", { worldX: x, worldY: y });
test("magnet QA: a blocked driver backs out without changing game state", () => {
  const g = createMagnetWorld();
  const s = structuredClone(g.scene);
  Object.assign(s, { time: 10000, power: 428, radius: 261, mode: "return" });
  Object.assign(s.player, { x: 2064.42, y: 731.15, angle: 3.1077, vx: -1.6, vy: 0 });
  Object.assign(s.items.find(i => i.kind === "bus"), { attached: true, x: 2074.19, y: 921.9 });
  const initial = magnetTarget(s);
  let escaped = false;
  for (let n = 0; n < 30; n++) {
    s.time += 300;
    const before = JSON.stringify(s), next = magnetTarget(s);
    assert.equal(JSON.stringify(s), before);
    if (Math.hypot(next.x - initial.x, next.y - initial.y) > 100) escaped = true;
  }
  assert.ok(escaped, "must not keep steering into the same blocked corner");
  g.destroy();
});
test("magnet: no autoplay, invalid input rejected, one movement gives physical collection", () => {
  const g = createMagnetWorld(); tick(g, 180);
  assert.equal(g.scene.collected, 0);
  assert.equal(g.pointer("down", -1, 200), false);
  assert.equal(aim(g, Infinity, 40), false);
  aim(g, 360, 390); tick(g, 180);
  assert.ok(g.scene.collected >= 3);
  assert.ok(g.scene.player.x > 220);
  assert.ok(g.scene.radius > 22);
  assert.ok(g.scene.items.filter(i => i.attached).every(i => i.part));
  g.destroy();
});
test("magnet: all heavy items are locked initially, touching doesn't grant score", () => {
  const g = createMagnetWorld();
  assert.equal(g.scene.items.find(i => i.kind === "bus").eligible, false);
  aim(g, 1250, 390); assert.equal(g.scene.score, 0); g.destroy();
});
test("magnet: stop freezes state, sound, checkpoint and all inputs", () => {
  const events = [], g = createMagnetWorld({ onEvent: e => events.push(e) });
  aim(g, 360, 390); tick(g, 160); g.stop();
  const before = JSON.stringify(g.scene), cp = g.checkpoint(), count = events.length;
  tick(g, 400); assert.equal(aim(g, 900, 390), false); assert.equal(g.key("d", true), false);
  assert.equal(g.primary(), false); assert.equal(g.retry(), false);
  assert.equal(JSON.stringify(g.scene), before); assert.deepEqual(g.checkpoint(), cp); assert.equal(events.length, count);
  g.destroy();
});
test("magnet: releasing keys and cancelling touch immediately brakes", () => {
  const g = createMagnetWorld(); g.key("a", true); tick(g, 40); g.key("a", false); g.cancel();
  assert.equal(g.scene.player.vx, 0); const x = g.scene.player.x; tick(g, 60); assert.ok(Math.abs(g.scene.player.x - x) < 4, "loose cargo may settle against the braked body, but steering must stop");
  assert.equal(g.pointer("down", 480, 270, "touch", { worldX: 500, worldY: 390 }), true);
  g.cancel(); const cp = g.checkpoint(); tick(g, 40); assert.deepEqual(g.checkpoint(), cp); g.destroy();
});
test("magnet: checkpoints are bounded, do not resume movement, and reject arbitrary data", () => {
  const g = createMagnetWorld(); aim(g, 360, 390); tick(g, 180); g.cancel();
  const cp = g.checkpoint(), restored = createMagnetWorld({ checkpoint: cp });
  assert.equal(restored.scene.collected, g.scene.collected);
  assert.equal(restored.scene.power, g.scene.power); assert.ok(JSON.stringify(cp).length < 8192);
  const p = restored.scene.player.x; tick(restored, 120); assert.equal(restored.scene.player.x, p);
  for (const bad of [{ version: 1, id: "magnet-rampage", data: { phase: "won", score: 999 } }, { ...cp, data: { ...cp.data, collected: [999] } }, { data: "x".repeat(9000) }]) {
    const other = createMagnetWorld({ checkpoint: bad }); assert.equal(other.scene.phase, "playing"); assert.equal(other.scene.score, 0); other.destroy();
  }
  g.destroy(); restored.destroy();
});
test("magnet: a legal city trip collects, returns and recycles the bus before winning", () => {
  const events = [], g = createMagnetWorld({ onEvent: e => events.push(e.type) });
  assert.equal(sweepStreet(g).phase, "won", JSON.stringify({ mode: g.scene.mode, player: g.scene.player, radius: g.scene.radius, power: g.scene.power, hits: g.scene.hits, bus: g.scene.items.find(i => i.kind === "bus"), target: magnetTarget(g.scene) }));
  assert.ok(g.scene.items.find(i => i.kind === "bus").attached);
  assert.equal(g.scene.delivered, true);
  assert.ok(Math.hypot(g.scene.player.x - g.scene.depot.x, g.scene.player.y - g.scene.depot.y) < 170);
  for (const type of ["catch", "big", "upgrade", "tow", "delivery", "win"]) assert.ok(events.includes(`magnet-${type}`));
  assert.equal(events.filter(e => e === "magnet-win").length, 1);
  const cp = g.checkpoint(); assert.equal(g.scene.power, new Set(cp.data.seen).size ? cp.data.seen.reduce((n, id) => n + g.scene.items[id].mass, 0) : 0);
  const restored = createMagnetWorld({ checkpoint: cp }); assert.equal(restored.scene.phase, "won");
  const at = { ...restored.scene.player }; tick(restored, 150); assert.deepEqual(restored.scene.player, at);
  restored.primary(); assert.equal(restored.scene.power, 0); assert.equal(restored.scene.phase, "playing"); g.destroy(); restored.destroy();
});
test("magnet city: the larger map has connected roads, safe bays and noncollectible moving traffic", () => {
  const g = createMagnetWorld(); assert.ok(g.scene.city.width * g.scene.city.height >= 1400 * 780 * 4);
  assert.equal(g.scene.city.zones.length, 3); assert.ok(g.scene.roads.length >= 5);
  assert.ok(g.scene.traffic.some(t => t.kind === "truck"));
  const before = g.scene.traffic.map(t => [t.x, t.y]); aim(g, 360, 390); tick(g, 120);
  assert.notDeepEqual(g.scene.traffic.map(t => [t.x, t.y]), before);
  assert.ok(g.scene.traffic.every(t => !g.scene.items.some(i => i.id === t.id))); g.destroy();
});
test("magnet city: every stage restores safely and task completion freezes the recycling finale", () => {
  const g = createMagnetWorld(), modes = new Set();
  let samples = 0;
  for (let n = 0; n < 180 * 120 && !g.scene.delivered; n++) {
    if (n % 36 === 0) { const p = magnetTarget(g.scene); if (p) aim(g, p.x, p.y); }
    tick(g, 1); modes.add(g.scene.mode);
    if (n % 240 === 0) {
      const restored = createMagnetWorld({ checkpoint: g.checkpoint() });
      assert.equal(restored.scene.power, g.scene.power);
      assert.equal(restored.scene.mode, g.scene.mode);
      const before = { ...restored.scene.player }; tick(restored, 30);
      assert.equal(restored.scene.player.vx, 0);
      assert.equal(restored.scene.trafficTime, 0);
      assert.equal(restored.scene.collected, g.scene.collected);
      assert.deepEqual(restored.scene.player, before); restored.destroy(); samples++;
    }
  }
  for (const mode of ["collect", "find-bus", "return", "recycle"]) assert.ok(modes.has(mode), JSON.stringify({ missing: mode, mode: g.scene.mode, player: g.scene.player, radius: g.scene.radius, power: g.scene.power, bus: g.scene.items.find(i => i.kind === "bus"), target: magnetTarget(g.scene) }));
  assert.ok(samples > 10); assert.equal(g.scene.phase, "playing");
  g.stop(); const frozen = JSON.stringify(g.scene), cp = g.checkpoint(); tick(g, 600);
  assert.equal(JSON.stringify(g.scene), frozen);
  const restored = createMagnetWorld({ checkpoint: cp });
  assert.equal(restored.scene.phase, "won"); assert.equal(restored.scene.delivered, true);
  restored.destroy(); g.destroy();
});
test("magnet city: old bus checkpoints migrate to an unfinished return trip, never a free win", () => {
  const ids = Array.from({ length: 41 }, (_, i) => i);
  const g = createMagnetWorld({ checkpoint: { version: 1, id: "magnet-rampage", data: { seen: ids, collected: ids } } });
  assert.equal(g.scene.phase, "playing"); assert.equal(g.scene.mode, "return"); assert.equal(g.scene.delivered, false);
  const cp = g.checkpoint(); assert.equal(cp.version, 2); assert.equal(cp.data.zone, 2);
  assert.ok(g.scene.player.x > 1900); tick(g, 360); assert.equal(g.scene.phase, "playing");
  const restored = createMagnetWorld({ checkpoint: cp }); assert.equal(restored.scene.mode, "return"); assert.deepEqual(restored.scene.player, g.scene.player); g.destroy(); restored.destroy();
});
test("magnet city: forged delivery, off-map cargo and unsafe save positions are rejected", () => {
  const cp = createMagnetWorld().checkpoint();
  for (const data of [{ ...cp.data, delivered: true }, { ...cp.data, zone: 999 }, { ...cp.data, busLoose: { x: Infinity, y: 0 } }]) {
    const g = createMagnetWorld({ checkpoint: { ...cp, data } }); assert.equal(g.scene.delivered, false); assert.equal(g.scene.power, 0); assert.equal(g.scene.player.x, 180); g.destroy();
  }
});
test("magnet city: a heavy truck collision can detach a carried bus without erasing magnet growth", () => {
  const ids=Array.from({length:41},(_,i)=>i),events=[];
  const g=createMagnetWorld({checkpoint:{version:1,id:"magnet-rampage",data:{seen:ids,collected:ids}},onEvent:e=>events.push(e.type)});
  for(const [x,y]of [[2400,1260],[1450,1260]]) { aim(g,x,y);for(let n=0;n<8000&&Math.hypot(g.scene.player.x-x,g.scene.player.y-y)>30;n++)tick(g,1); }
  g.cancel();tick(g,3000);
  assert.ok(g.scene.trafficHits>0);assert.ok(g.scene.busDrops>0);assert.ok(events.includes("magnet-lost-bus"));
  assert.equal(g.scene.power,428);assert.equal(g.scene.delivered,false);assert.equal(g.scene.mode,"recover");
  const cp=g.checkpoint(),restored=createMagnetWorld({checkpoint:cp});assert.equal(restored.scene.mode,"recover");assert.equal(restored.scene.trafficGrace,2.5);
  g.stop();const state=JSON.stringify(g.scene);tick(g,300);assert.equal(JSON.stringify(g.scene),state);g.destroy();restored.destroy();
});
test("magnet: factory is offline, bounded and kept out of the stable random pool", () => {
  assert.equal(MAGNET_CATALOG[0].release, "preview");
  const pack = buildReviewedPack("magnet-rampage");
  assert.ok(pack.manifest.bytes < 1600000); assert.deepEqual(pack.manifest.permissions, []);
  assert.match(pack.source, /createMagnetSound/); assert.match(pack.source, /createVarietyStage/);
  assert.equal(pack.source.includes("https://"), false); assert.doesNotThrow(() => new Function(`return ${pack.factory}`));
});
