import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const origin = process.env.STAGE_ORIGIN || "http://127.0.0.1:4175", output = new URL("../output/appliance-qa/", import.meta.url), errors = [], report = {};
await mkdir(output, { recursive: true });
async function setup(page) {
  page.on("pageerror", e => errors.push(e.message)); await page.goto(`${origin}/apps/codex-stage/studio/appliance-catalog.js`);
  await page.clock.install({ time: new Date("2026-09-20T00:00:00Z") }); await page.clock.pauseAt(new Date("2026-09-20T00:00:01Z"));
  await page.evaluate(async () => {
    document.body.replaceChildren(); document.body.style.cssText = "margin:0;background:#e0e8e7"; const meta = document.createElement("meta"); meta.name = "viewport"; meta.content = "width=device-width,initial-scale=1"; document.head.append(meta);
    const canvas = document.createElement("canvas"); canvas.tabIndex = 0; canvas.style.cssText = "display:block;width:100vw;aspect-ratio:16/9;touch-action:none"; document.body.append(canvas);
    // A shared Dock canvas may already be sized by the previous game.
    canvas.width = Math.round(canvas.getBoundingClientRect().width * Math.min(devicePixelRatio || 1, 2)); canvas.height = Math.round(canvas.width * 9 / 16);
    window.qa = { audio: 0 }; const start = OscillatorNode.prototype.start; OscillatorNode.prototype.start = function (...args) { qa.audio++; return start.apply(this, args); };
    const { STUDIO_PACKS } = await import("/apps/codex-stage/studio/registry.js"), { APPLIANCE_CATALOG } = await import("/apps/codex-stage/studio/appliance-catalog.js"), { createStudioRuntime } = await import("/apps/codex-stage/studio/runtime.js"), pack = STUDIO_PACKS["appliance-escape"];
    await pack.prepare(); qa.runtime = createStudioRuntime(canvas, APPLIANCE_CATALOG[0], o => qa.world = pack.create(o), pack.paint, {}, (...args) => qa.painter = pack.createPainter(...args)); qa.runtime.start(); await qa.painter.ready;
  }); await page.clock.runFor(50);
}
async function screen(page, x, y) { const b = await page.locator("canvas").boundingBox(); return { x: b.x + x * b.width / 960, y: b.y + y * b.height / 540 }; }
async function click(page, x, y, touch = false) { const p = await screen(page, x, y); if (touch) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y); }
async function ground(page, x, z, touch = false) { const p = await page.evaluate(([x, z]) => qa.painter.project(x, 0, z), [x, z]); await click(page, p.x, p.y, touch); }
const choose = (page, i, touch = false) => click(page, i * 155 + 72, 503, touch), use = (page, touch = false) => click(page, 858, 503, touch);
async function drive(page, x, z, touch = false) {
  const points = await page.evaluate(([x, z]) => { const d = qa.world.scene.devices[2]; return [qa.painter.project(d.x, d.y + .3, d.z), qa.painter.project(x, 0, z)]; }, [x, z]);
  const a = await screen(page, points[0].x, points[0].y), b = await screen(page, points[1].x, points[1].y);
  if (touch) { const session = await page.context().newCDPSession(page); await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...a, id: 1 }] }); await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...b, id: 1 }] }); await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await session.detach(); }
  else { await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(b.x, b.y, { steps: 5 }); await page.mouse.up(); }
  for (let i = 0; i < 60; i++) { await page.clock.runFor(200); const a = await page.evaluate(() => ({ x: qa.world.scene.devices[2].x, z: qa.world.scene.devices[2].z, phase: qa.world.scene.phase, selected: qa.world.scene.selected }));
    assert.equal(a.selected, "vacuum"); if (a.phase !== "playing" || Math.hypot(a.x - x, a.z - z) < .22) return;
  }
  throw new Error(`Pointer drive blocked at ${JSON.stringify(await page.evaluate(() => qa.world.scene.devices[2]))}`);
}
const pixels = page => page.locator("canvas").evaluate(canvas => { const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data, colors = new Set(); let visible = 0; for (let i = 0; i < data.length; i += 64) { colors.add(`${data[i]},${data[i + 1]},${data[i + 2]}`); visible += Number(data[i + 3] > 0); } return { colors: colors.size, opaque: visible / Math.ceil(data.length / 64) }; });
const png = page => page.locator("canvas").evaluate(c => c.toDataURL());
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } }); await setup(page);
  report.renderer = await page.evaluate(() => qa.painter.diagnostics); assert.equal(report.renderer.renderer, "three-orthographic"); assert.equal(report.renderer.contexts, 1); assert.ok(report.renderer.drawCalls > 50);
  assert.deepEqual(report.renderer.bufferSize, [1280, 720], "WebGL surface must match an already-sized shared canvas");
  report.pixels = await pixels(page); assert.ok(report.pixels.colors > 1000); assert.equal(report.pixels.opaque, 1);
  await page.screenshot({ path: new URL("appliance-start.png", output).pathname });
  const positions = await page.evaluate(() => qa.world.scene.devices.map(e => qa.painter.project(e.x, e.y, e.z))); assert.ok(positions.every(p => p.x > 10 && p.x < 950 && p.y > 70 && p.y < 450));
  await click(page, positions[2].x, positions[2].y); assert.equal(await page.evaluate(() => qa.world.scene.selected), "vacuum");
  await use(page); assert.equal(await page.evaluate(() => qa.world.scene.carry), "robot"); await page.clock.runFor(400);
  await page.screenshot({ path: new URL("appliance-carry.png", output).pathname });
  await drive(page, -3, 2.4); await drive(page, -.8, 1.3);
  await choose(page, 3); assert.equal(await page.evaluate(() => qa.world.scene.selected), "vendor"); await ground(page, 3.63, 1.8);
  await page.evaluate(() => qa.runtime.setMuted(false)); await use(page); const moving = await png(page); await page.clock.runFor(300); assert.notEqual(await png(page), moving);
  await page.evaluate(() => qa.runtime.setPaused(true)); const frozen = await page.evaluate(() => qa.world.checkpoint()); await page.clock.runFor(500); assert.deepEqual(await page.evaluate(() => qa.world.checkpoint()), frozen);
  await page.evaluate(() => { qa.runtime.setPaused(false); qa.runtime.stop(); });
  const stopped = await page.evaluate(() => ({ cp: qa.world.checkpoint(), audio: qa.audio, png: document.querySelector("canvas").toDataURL() }));
  await page.clock.runFor(800); await use(page); await page.keyboard.press("Space"); assert.deepEqual(await page.evaluate(() => ({ cp: qa.world.checkpoint(), audio: qa.audio, png: document.querySelector("canvas").toDataURL() })), stopped);
  await page.evaluate(() => { qa.runtime.restoreCheckpoint(qa.world.checkpoint()); qa.runtime.start(); }); await page.clock.runFor(1300);
  assert.ok(await page.evaluate(() => qa.world.scene.gate) > .9); report.stoppedAndResumed = true;
  await page.screenshot({ path: new URL("appliance-open.png", output).pathname }); await choose(page, 2); await drive(page, 2.8, .7); await drive(page, 6.7, .7);
  assert.equal(await page.evaluate(() => qa.world.scene.phase), "won"); assert.equal(await page.evaluate(() => qa.world.scene.route), "检修踏板"); assert.ok(await page.evaluate(() => qa.audio) > 0);
  await page.screenshot({ path: new URL("appliance-finish.png", output).pathname }); report.pointerWin = report.audio = true;
  await page.evaluate(() => qa.runtime.retry()); await choose(page, 1); await use(page); await page.clock.runFor(4000); assert.ok(await page.evaluate(() => qa.world.scene.routes.includes("货架配重")));
  await page.screenshot({ path: new URL("appliance-fan.png", output).pathname }); await page.evaluate(() => qa.runtime.destroy()); assert.equal(await page.evaluate(() => qa.painter.diagnostics.contexts), 0); await page.close();

  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: "reduce" }); const mobile = await context.newPage(); await setup(mobile);
  assert.deepEqual(await mobile.evaluate(() => qa.painter.diagnostics.bufferSize), [780, 439], "WebGL surface must preserve mobile pixel density");
  await mobile.evaluate(() => qa.runtime.setReduced(true)); await choose(mobile, 2, true); await use(mobile, true); assert.equal(await mobile.evaluate(() => qa.world.scene.carry), "robot"); await drive(mobile, -3, 2.4, true);
  await mobile.screenshot({ path: new URL("appliance-touch.png", output).pathname }); report.touch = await pixels(mobile); assert.equal(await mobile.evaluate(() => qa.audio), 0);
  await mobile.evaluate(() => qa.runtime.destroy()); await context.close();

  const app = await browser.newPage({ viewport: { width: 1440, height: 1000 } }), requests = []; app.on("pageerror", e => errors.push(e.message)); app.on("request", r => requests.push(r.url()));
  await app.goto(`${origin}/codex-stage?game=appliance-escape`); await app.waitForFunction(() => document.querySelector("#game-title")?.textContent === "电器成精了" && document.querySelector("#stage-live")?.textContent.includes("台灯"));
  assert.equal(await app.locator(".level-strip").isVisible(), false); await app.locator("canvas").focus(); await app.keyboard.press("2"); await app.keyboard.press("Space"); await app.waitForTimeout(500);
  await app.locator("#stop").click(); const cp = await app.evaluate(() => JSON.parse(localStorage.getItem("agent-stage:checkpoint:v1:appliance-escape"))); assert.equal(cp.selected, "fan"); assert.ok(cp.body.find(a => a[0] === "fan")[15]);
  await app.reload(); await app.waitForFunction(() => document.querySelector("#stage-live")?.textContent.includes("风扇"));
  await app.screenshot({ path: new URL("appliance-app.png", output).pathname }); await app.locator("#expand-stage").click(); await app.screenshot({ path: new URL("appliance-expanded.png", output).pathname }); await app.keyboard.press("Escape");
  await app.setViewportSize({ width: 390, height: 844 }); await app.locator("canvas").scrollIntoViewIfNeeded(); await app.screenshot({ path: new URL("appliance-app-mobile.png", output).pathname }); assert.equal(await app.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.ok(requests.some(u => u.endsWith("/packs/built/appliance-escape.js"))); assert.ok(!requests.some(u => /^https?:/.test(u) && !u.startsWith(origin)));
  report.app = { offline: true, save: true, reload: true, keyboard: true, noOverflow: true }; await app.close(); assert.deepEqual(errors, []); console.log(JSON.stringify(report));
} finally { await browser.close(); await writeFile(new URL("report.json", output), JSON.stringify({ ...report, errors }, null, 2)); }
