// These controllers read the room, but use only controls available to the player.
export function applianceTicks(g, seconds) { for (let i = 0; i < seconds * 120; i++) g.step(1000 / 120); }
export function driveApplianceTo(g, x, z, limit = 14) {
  if (!g.drive(x, z)) throw new Error("Drive rejected");
  for (let i = 0; i < limit * 120; i++) {
    g.step(1000 / 120); const v = g.scene.devices.find(d => d.id === "vacuum");
    if (g.scene.phase !== "playing" || Math.hypot(v.x - x, v.z - z) < .18) return;
  }
  throw new Error(`Blocked at ${JSON.stringify(g.scene.devices.find(d => d.id === "vacuum"))}, heading to ${x},${z}`);
}
export function rescueAppliance(g, route = "light") {
  const command = result => { if (!result) throw new Error(g.scene.status); };
  if (route === "fan") { command(g.possess("fan")); command(g.primary()); }
  command(g.possess("vacuum"));
  if (route === "light") {
    driveApplianceTo(g, -5.5, -1.5); command(g.primary());
    driveApplianceTo(g, -2.5, -2.7); command(g.primary()); applianceTicks(g, .4);
    command(g.possess("lamp")); command(g.aim(3.8, -2)); command(g.primary()); command(g.possess("vacuum"));
    driveApplianceTo(g, -5.8, -1.6);
  }
  driveApplianceTo(g, -6, 2.5); command(g.primary());
  if (route === "fan") { for (let i = 0; i < 1200 && !g.scene.plate; i++) g.step(1000 / 120); command(g.possess("fan")); command(g.primary()); command(g.possess("vacuum")); }
  driveApplianceTo(g, -3, 2.4); driveApplianceTo(g, -.8, 1.3);
  if (route === "can") { command(g.possess("vendor")); command(g.aim(3.63, 1.8)); command(g.primary()); applianceTicks(g, 1.5); command(g.possess("vacuum")); }
  driveApplianceTo(g, 2.8, .7); driveApplianceTo(g, 6.7, .7);
  return { phase: g.scene.phase, route: g.scene.route, alarm: g.scene.guard.alarm, time: g.scene.time };
}
