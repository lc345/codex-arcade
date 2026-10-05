import test from "node:test";
import assert from "node:assert/strict";
import { prepareRapier } from "./vendor/rapier.js";
import { createApplianceWorld } from "./studio/appliance-escape.js";
import { rescueAppliance, driveApplianceTo } from "../../tools/appliance-replay.mjs";

await prepareRapier();
const tick = (g, seconds) => { for (let i = 0; i < seconds * 120; i++) g.step(1000 / 120); };

test("appliances wait for a player, limit possession range and reject invalid commands", () => {
  const g = createApplianceWorld(); const before = g.checkpoint(); tick(g, 20);
  assert.deepEqual(g.checkpoint(), before); assert.equal(g.possess("vendor"), false);
  assert.equal(g.possess("vacuum"), true); assert.equal(g.aim(Infinity, 0), false);
  assert.equal(g.drive(NaN, 0), false); assert.equal(g.possess("secret-command"), false);
  assert.equal(g.scene.score, 0); g.destroy();
});

test("appliance movement collides with a closed gate instead of teleporting through it", () => {
  const g = createApplianceWorld(); g.possess("vacuum"); g.drive(7, 2.4); tick(g, 10);
  const v = g.scene.devices.find(d => d.id === "vacuum"); assert.ok(v.x < 3.5); assert.equal(g.scene.phase, "playing"); g.destroy();
});

test("appliance thinking and task stop freeze physics, noise, alerts and reject stopped input", () => {
  const events = [], g = createApplianceWorld({ onEvent: e => events.push(e) }); g.possess("vacuum"); g.drive(-4, 3); tick(g, .5);
  g.secondary(); const paused = g.checkpoint(); tick(g, 5); assert.deepEqual(g.checkpoint(), paused);
  g.secondary(); tick(g, .2); g.stop(); const stopped = g.checkpoint(), count = events.length;
  tick(g, 3); assert.deepEqual(g.checkpoint(), stopped);
  for (const result of [g.primary(), g.secondary(), g.drive(0, 0), g.possess("lamp"), g.aim(0, 0), g.key(" ", true), g.retry()]) assert.equal(result, false);
  assert.equal(events.length, count); g.destroy();
});

test("appliance save is bounded, privacy-safe and malformed bodies cannot enter the room", () => {
  const g = createApplianceWorld(); g.possess("vacuum"); g.drive(-4, 3); tick(g, .4); g.stop(); const saved = g.checkpoint();
  assert.ok(JSON.stringify(saved).length < 8192);
  const h = createApplianceWorld({ checkpoint: { ...saved, prompt: "PRIVATE_PROMPT", path: "/private/file" } });
  assert.ok(!JSON.stringify(h.checkpoint()).includes("PRIVATE_PROMPT")); assert.equal(h.scene.selected, "vacuum");
  assert.deepEqual(h.checkpoint(), saved); h.destroy();
  const bad = createApplianceWorld({ checkpoint: { ...saved, selected: "execute-tool" } }); assert.equal(bad.scene.selected, "lamp"); assert.equal(bad.scene.awaiting, true); bad.destroy(); g.destroy();
});

for (const route of ["light", "fan", "can"]) test(`appliance ${route} route wins through only legal controls and physical contacts`, () => {
  const g = createApplianceWorld(), result = rescueAppliance(g, route);
  assert.equal(result.phase, "won"); assert.equal(g.scene.score, 1000); assert.equal(g.scene.progress, 1);
  assert.ok(g.scene.objects.find(e => e.id === "robot").x > 5.65);
  assert.equal(result.route, { light: "光敏线路", fan: "货架配重", can: "检修踏板" }[route]);
  g.stop(); const saved = g.checkpoint(), h = createApplianceWorld({ checkpoint: saved }); assert.equal(h.scene.phase, "won"); h.destroy(); g.destroy();
});

test("lamp must be moved into range; fan physically pushes a rack onto the plate", () => {
  const g = createApplianceWorld(); g.aim(3.8, -2); g.primary(); tick(g, 2); assert.equal(g.scene.light, false); assert.equal(g.scene.gate, 0);
  g.possess("fan"); g.primary(); tick(g, 4); assert.ok(g.scene.objects.find(e => e.id === "rack").x > 1.7); assert.ok(g.scene.routes.includes("货架配重")); g.destroy();
});

test("cans have cooldown and make real noise; missing the pedal does not grant a gate", () => {
  const g = createApplianceWorld(); g.possess("vacuum"); driveApplianceTo(g, -3, 2.5); assert.equal(g.possess("vendor"), true); g.aim(2, 4.5); assert.equal(g.primary(), true); assert.equal(g.primary(), false);
  assert.ok(g.scene.guard.investigate > 0); assert.ok(g.scene.objects.some(e => e.id.startsWith("can")));
  tick(g, 2); assert.equal(g.scene.gate, 0); assert.equal(g.scene.score, 0);
  g.aim(3.63, 1.8); g.primary(); tick(g, 2); assert.ok(g.scene.pulse > 0); assert.ok(g.scene.gate > .9);
  tick(g, 18); assert.equal(g.scene.pulse, 0); assert.equal(g.scene.gate, 0); g.destroy();
});

test("carried objects resume with a real fixed joint, and cannot be unloaded through a closed gate", () => {
  const g = createApplianceWorld(); g.possess("vacuum"); driveApplianceTo(g, -6, 2.5); g.primary(); assert.equal(g.scene.carry, "robot");
  driveApplianceTo(g, 2.7, .7); g.stop(); const h = createApplianceWorld({ checkpoint: g.checkpoint() });
  h.drive(7, .7); tick(h, 3); assert.ok(h.scene.devices[2].x < 3.5); assert.equal(h.scene.carry, "robot");
  assert.equal(h.primary(), false); assert.equal(h.scene.carry, "robot"); h.destroy(); g.destroy();
});

test("pointer cancellation cannot activate devices, and keyboard can switch and rotate them", () => {
  const g = createApplianceWorld(); g.pointer("down", 850, 500); g.cancel(); assert.equal(g.pointer("up", 850, 500), false); assert.equal(g.scene.devices[0].on, false);
  g.key("2", true); assert.equal(g.scene.selected, "fan"); const a = g.scene.devices[1].angle; g.key("ArrowRight", true); assert.ok(g.scene.devices[1].angle > a); g.key(" ", true); assert.equal(g.scene.devices[1].on, true); g.destroy();
});

test("an active lamp aimed away from the sensor attracts the inspector to its light", () => {
  const g = createApplianceWorld(); g.aim(1, -2.7); g.primary(); tick(g, .2);
  assert.ok(g.scene.guard.investigate > 0); assert.ok(g.scene.guard.target); assert.equal(g.scene.light, false); g.destroy();
});

test("off-canvas releases never activate an appliance", () => {
  const g = createApplianceWorld(); g.pointer("down", 850, 500); assert.equal(g.pointer("up", 1100, 500), false); assert.equal(g.scene.devices[0].on, false); g.destroy();
});

test("shelf occludes sight and a witnessed active appliance can really lose, then retry", () => {
  const base = createApplianceWorld(); assert.equal(base.clearLine({ x: -2, z: -.7 }, { x: 2, z: -.7 }), false); assert.equal(base.clearLine({ x: -2, z: 1 }, { x: 2, z: 1 }), true);
  const cp = base.checkpoint(); cp.selected = "fan"; cp.awaiting = false; cp.body.find(b => b[0] === "fan")[15] = true;
  cp.guard = { x: -.5, z: -.7, angle: Math.PI, leg: 0, alarm: 99.9, investigate: 2, target: { x: -.5, z: -.7 }, watching: true };
  const g = createApplianceWorld({ checkpoint: cp }); tick(g, .1); assert.equal(g.scene.phase, "lost"); assert.equal(g.scene.score, 0);
  assert.equal(g.retry(), true); assert.equal(g.scene.phase, "playing"); assert.equal(g.scene.guard.alarm, 0); assert.equal(g.scene.awaiting, true); base.destroy(); g.destroy();
});

test("appliance recovery rejects injected bodies, fake wins and unbounded transforms", () => {
  const base = createApplianceWorld(), cp = base.checkpoint();
  for (const mutate of [v => v.body[0][0] = "private-command", v => v.body[0][4] = Infinity, v => v.body.push(v.body[0]), v => v.phase = "won", v => v.carry = "vendor", v => v.guard.target = { x: 999, z: 2 }]) {
    const v = structuredClone(cp); mutate(v); const g = createApplianceWorld({ checkpoint: v }); assert.deepEqual(g.checkpoint(), cp); g.destroy();
  }
  base.destroy();
});
