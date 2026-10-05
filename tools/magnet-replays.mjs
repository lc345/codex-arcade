// This QA planner only issues movement inputs. It never changes the world or score.
const drivers = new WeakMap();
export function magnetTarget(s) {
  if (s.delivered) return null;
  const p = s.player;
  let driver = drivers.get(s);
  if (!driver || s.time < driver.at) {
    driver = { at: s.time, x: p.x, y: p.y, escapes: 0, escapeUntil: 0 };
    drivers.set(s, driver);
  }
  if (s.time < driver.escapeUntil) return driver.escape;
  const target = planTarget(s);
  if (s.time - driver.at >= 3000) {
    const moved = Math.hypot(p.x - driver.x, p.y - driver.y);
    if (target && moved < 40 && Math.hypot(target.x - p.x, target.y - p.y) > 25) {
      // Reverse, then try another heading, as a human would when cargo catches a corner.
      const turns = [Math.PI, Math.PI / 2, -Math.PI / 2];
      const heading = Math.atan2(target.y - p.y, target.x - p.x) + turns[driver.escapes++ % turns.length];
      driver.escape = { x: p.x + Math.cos(heading) * 240, y: p.y + Math.sin(heading) * 240 };
      driver.escapeUntil = s.time + 2200;
    }
    Object.assign(driver, { at: s.time, x: p.x, y: p.y });
  }
  return s.time < driver.escapeUntil ? driver.escape : target;
}

function planTarget(s) {
  const p = s.player, bus = s.items.find(i => i.kind === "bus");
  let goal;
  if (bus.attached) goal = { ...s.depot };
  else if (s.power >= 180) goal = bus;
  else {
    const items = s.items.filter(i => !i.attached && i.eligible && i.cooldown <= s.time);
    goal = items.sort((a, b) => {
      const cost = i => Math.hypot(i.x - p.x, i.y - p.y) / (1 + i.mass / 15);
      return cost(a) - cost(b);
    })[0];
  }
  if (!goal) return null;
  const distance = Math.hypot(goal.x - p.x, goal.y - p.y);
  const radius = Math.min(165, Math.max(24, s.radius * .72)), spacing = 65;
  const blocked = (x, y, r = radius) => x < r + 32 || x > s.city.width - r - 32 || y < r + 32 || y > s.city.height - r - 32 || s.obstacles.some(o => {
    const dx = Math.max(Math.abs(x - o.x) - o.w / 2, 0), dy = Math.max(Math.abs(y - o.y) - o.h / 2, 0);
    return Math.hypot(dx, dy) < r + 4;
  });
  const segment = (a, b) => { const count = Math.ceil(Math.hypot(a.x - b.x, a.y - b.y) / 25); for (let i = 1; i < count; i++) if (blocked(a.x + (b.x-a.x)*i/count, a.y + (b.y-a.y)*i/count)) return false; return true; };
  if (distance < s.radius + (goal.r || 0) + 50 || segment(p, goal)) return { x: goal.x, y: goal.y };
  const cols = Math.floor(s.city.width / spacing), rows = Math.floor(s.city.height / spacing), cells = [];
  for (let y = 1; y < rows; y++) for (let x = 1; x < cols; x++) if (!blocked(x * spacing, y * spacing)) cells.push({ x: x*spacing, y:y*spacing, id:y*cols+x });
  const nearest = q => cells.reduce((best, c) => !best || Math.hypot(c.x-q.x,c.y-q.y) < Math.hypot(best.x-q.x,best.y-q.y) ? c : best, null);
  const start = nearest(p), finish = nearest(goal); if (!start || !finish) return { x: goal.x, y: goal.y };
  const byId = new Map(cells.map(c => [c.id, c])), queue = [start.id], parent = new Map([[start.id,null]]);
  for (let n = 0; n < queue.length && !parent.has(finish.id); n++) {
    const id = queue[n]; for (const offset of [-1, 1, -cols, cols]) { const next = id + offset; if (byId.has(next) && !parent.has(next)) { parent.set(next,id); queue.push(next); } }
  }
  if (!parent.has(finish.id)) return { x: start.x, y: start.y };
  const route = []; for (let id = finish.id; id !== null; id = parent.get(id)) route.push(byId.get(id)); route.reverse();
  let target = route[0]; for (const cell of route) { if (!segment(p,cell)) break; target = cell; }
  return { x: target.x, y: target.y };
}

export function sweepStreet(g, seconds = 180) {
  for (let n = 0; n < seconds * 120 && g.scene.phase !== "won"; n++) {
    if (n % 36 === 0) { const p = magnetTarget(g.scene); if (p) g.pointer("move", 480, 270, "mouse", { worldX: p.x, worldY: p.y }); }
    g.step(1000 / 120);
  }
  return g.snapshot();
}
