import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const origin = process.env.STAGE_ORIGIN || "http://127.0.0.1:4175", out = new URL("../output/shadow-qa/", import.meta.url), errors = [], report = {};
await mkdir(out, { recursive: true });
async function setup(page, fallback = false) {
  page.on("pageerror", e => errors.push(e.message));
  await page.goto(`${origin}/apps/codex-stage/studio/shadow-catalog.js`);
  await page.clock.install({ time: new Date("2026-09-20T00:00:00Z") }); await page.clock.pauseAt(new Date("2026-09-20T00:00:01Z"));
  await page.evaluate(async fallback => {
    document.body.replaceChildren(); document.body.style.cssText = "margin:0;background:#33434a";
    const meta = document.createElement("meta"); meta.name = "viewport"; meta.content = "width=device-width,initial-scale=1"; document.head.append(meta);
    const canvas = document.createElement("canvas"); canvas.tabIndex = 0; canvas.style.cssText = "display:block;width:100vw;aspect-ratio:16/9;touch-action:none"; document.body.append(canvas);
    window.qa = { audio: 0, stoppedVoices: 0 };
    for (const Proto of [OscillatorNode, AudioBufferSourceNode]) { const start = Proto.prototype.start, stop = Proto.prototype.stop; Proto.prototype.start = function (...args) { qa.audio++; return start.apply(this, args); }; Proto.prototype.stop = function (...args) { qa.stoppedVoices++; return stop.apply(this, args); }; }
    if (fallback) { const { STUDIO_ART } = await import("/apps/codex-stage/studio/assets.js"); STUDIO_ART["shadow-crew"] = "data:image/webp;base64,broken"; }
    const { STUDIO_PACKS } = await import("/apps/codex-stage/studio/registry.js"), { SHADOW_CATALOG } = await import("/apps/codex-stage/studio/shadow-catalog.js"), { createStudioRuntime } = await import("/apps/codex-stage/studio/runtime.js"), pack = STUDIO_PACKS["shadow-crew"];
    qa.runtime = createStudioRuntime(canvas, SHADOW_CATALOG[0], options => qa.world = pack.create(options), pack.paint, {}, (...args) => qa.painter = pack.createPainter(...args));
    qa.runtime.start(); await qa.painter.ready; qa.painter.draw(qa.world);
  }, fallback); await page.clock.runFor(50);
}
async function coords(page, x, y) { const b = await page.locator("canvas").boundingBox(); return { x: b.x + x * b.width / 960, y: b.y + y * b.height / 540 }; }
async function click(page, x, y) { const p = await coords(page, x, y); await page.mouse.click(p.x, p.y); }
async function drag(page, x, y, dx, dy) { const a = await coords(page, x, y), b = await coords(page, x + dx, y + dy); await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(b.x, b.y, { steps: 6 }); await page.mouse.up(); }
async function zoom(page, value) { const z = await page.evaluate(() => qa.world.scene.zoom); await drag(page, 270 + (z - 1.15) / 1.85 * 330, 507, (value - z) / 1.85 * 330, 0); }
const png = page => page.locator("canvas").evaluate(c => c.toDataURL());
async function pixels(page) { return page.locator("canvas").evaluate(canvas => { const d = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data, colors = new Set(); let alpha = 0; for (let i = 0; i < d.length; i += 32) { colors.add(`${d[i]},${d[i + 1]},${d[i + 2]}`); if (d[i + 3]) alpha++; } return { colors: colors.size, opaque: alpha / (d.length / 32) }; }); }
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 810 } }); await setup(page);
  report.pixels = await pixels(page); assert.ok(report.pixels.colors > 2000); assert.equal(report.pixels.opaque, 1);
  assert.equal(await page.evaluate(() => qa.painter.diagnostics.assetLoaded), true);
  await page.screenshot({ path: new URL("shadow-start.png", out).pathname });
  await zoom(page, 2.9); await drag(page, 480, 450, -5, 0); await page.keyboard.press("Space"); await page.clock.runFor(2800);
  const moving = await png(page); await page.clock.runFor(100); assert.notEqual(await png(page), moving); assert.equal(await page.evaluate(() => qa.audio), 0);
  await page.screenshot({ path: new URL("shadow-bridge.png", out).pathname });
  await page.evaluate(() => qa.runtime.setPaused(true)); const paused = await page.evaluate(() => qa.world.checkpoint()); await page.clock.runFor(1000); assert.deepEqual(await page.evaluate(() => qa.world.checkpoint()), paused);
  await page.evaluate(() => { qa.runtime.setPaused(false); qa.runtime.stop(); });
  const stopped = await page.evaluate(() => ({ cp: qa.world.checkpoint(), audio: qa.audio, png: document.querySelector("canvas").toDataURL() }));
  await page.clock.runFor(1000); await page.keyboard.press("Enter"); await drag(page, 475, 450, 30, 0);
  assert.deepEqual(await page.evaluate(() => ({ cp: qa.world.checkpoint(), audio: qa.audio, png: document.querySelector("canvas").toDataURL() })), stopped);
  await page.evaluate(() => { qa.runtime.restoreCheckpoint(qa.world.checkpoint()); qa.runtime.start(); }); await page.clock.runFor(14000);
  assert.equal(await page.evaluate(() => qa.world.scene.phase), "won"); report.stopAndResume = true;
  await page.screenshot({ path: new URL("shadow-finish.png", out).pathname });
  await page.keyboard.press("Space"); assert.equal(await page.evaluate(() => qa.world.scene.level), 1);
  await zoom(page, 2.2); await drag(page, 480, 450, -80, 0); await page.keyboard.press("Space"); await page.clock.runFor(7000);
  assert.equal(await page.evaluate(() => qa.world.scene.rest), 1); assert.equal(await page.evaluate(() => qa.world.scene.mode), "edit");
  await page.screenshot({ path: new URL("shadow-relay.png", out).pathname });
  await drag(page, 400, 450, 139, 0); await page.keyboard.press("Space"); await page.clock.runFor(10000);
  assert.equal(await page.evaluate(() => qa.world.scene.phase), "won"); report.relay = true;
  await page.keyboard.press("Space"); assert.equal(await page.evaluate(() => qa.world.scene.level), 2);
  await zoom(page, 1.8); await page.keyboard.press("Space"); await page.clock.runFor(18000);
  assert.equal(await page.evaluate(() => qa.world.scene.phase), "won"); report.threeChapters = true;
  await page.evaluate(() => qa.runtime.setLevel(2)); await click(page, 796, 500); assert.equal(await page.evaluate(() => qa.world.scene.prop.kind), "comb");
  await zoom(page, 1.75); await page.keyboard.press("Space"); await page.clock.runFor(6000);
  await page.screenshot({ path: new URL("shadow-comb.png", out).pathname }); await page.clock.runFor(14000);
  assert.equal(await page.evaluate(() => qa.world.scene.phase), "won"); report.comb = true;
  await page.evaluate(() => { qa.runtime.setLevel(2); qa.runtime.setMuted(false); }); await click(page, 883, 500);
  await zoom(page, 1.75); await drag(page, 480, 450, 0, 1.2); await drag(page, 480, 419.2, 39.6, 0);
  assert.ok(Math.abs(await page.evaluate(() => qa.world.scene.prop.angle) - .22) < .01);
  await page.keyboard.press("Space"); await page.clock.runFor(4800); await page.screenshot({ path: new URL("shadow-scissors.png", out).pathname }); await page.clock.runFor(15200);
  assert.equal(await page.evaluate(() => qa.world.scene.phase), "won"); assert.ok(await page.evaluate(() => qa.audio) > 0); report.scissors = report.audio = true;
  await page.evaluate(() => qa.runtime.setLevel(0)); await page.locator("canvas").focus(); await page.keyboard.press("Space"); await page.clock.runFor(7000);
  assert.equal(await page.evaluate(() => qa.world.scene.phase), "lost"); await page.keyboard.press("r"); assert.equal(await page.evaluate(() => qa.world.scene.mode), "edit");
  const voices = await page.evaluate(() => qa.stoppedVoices); await page.evaluate(() => qa.runtime.stop()); assert.ok(await page.evaluate(() => qa.stoppedVoices) >= voices);
  await page.evaluate(() => qa.runtime.destroy()); assert.equal(await page.evaluate(() => qa.painter.diagnostics.contexts), 0); await page.close();

  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  const mobile = await context.newPage(); await setup(mobile); await mobile.evaluate(() => qa.runtime.setReduced(true));
  const session = await context.newCDPSession(mobile);
  async function touchDrag(x, y, dx, dy) { const a = await coords(mobile, x, y), b = await coords(mobile, x + dx, y + dy); await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...a, id: 1 }] }); await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...b, id: 1 }] }); await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); }
  await touchDrag(270 + .2 / 1.85 * 330, 507, 1.55 / 1.85 * 330, 0); await touchDrag(480, 450, -5, 0);
  await mobile.evaluate(() => qa.runtime.input("tap")); await mobile.clock.runFor(4800); await mobile.screenshot({ path: new URL("shadow-touch.png", out).pathname }); await mobile.clock.runFor(14000);
  assert.equal(await mobile.evaluate(() => qa.world.scene.phase), "won"); report.mobile = await pixels(mobile); await mobile.evaluate(() => qa.runtime.destroy()); await context.close();

  const fallback = await browser.newPage(); await setup(fallback, true); assert.equal(await fallback.evaluate(() => qa.painter.diagnostics.assetLoaded), false);
  await zoom(fallback, 2.9); await drag(fallback, 480, 450, -5, 0); await fallback.keyboard.press("Space"); await fallback.clock.runFor(18000);
  assert.equal(await fallback.evaluate(() => qa.world.scene.phase), "won"); report.fallback = true; await fallback.evaluate(() => qa.runtime.destroy()); await fallback.close();

  const app = await browser.newPage({ viewport: { width: 1440, height: 1050 } }), requests = [];
  app.on("pageerror", e => errors.push(e.message)); app.on("request", r => requests.push(r.url()));
  await app.goto(`${origin}/codex-stage?game=shadow-crew`); await app.waitForFunction(() => document.querySelector("#fire")?.textContent === "出发");
  assert.equal(await app.locator("#game-title").textContent(), "影子施工队"); assert.match(await app.locator("canvas").getAttribute("aria-label"), /影子/);
  await app.screenshot({ path: new URL("shadow-app.png", out).pathname }); await app.locator("#fire").click(); await app.waitForTimeout(200); await app.locator("#stop").click();
  const saved = await app.evaluate(() => JSON.parse(localStorage.getItem("agent-stage:checkpoint:v1:shadow-crew"))); assert.equal(saved.mode, "walk"); assert.ok(saved.player[0] > 116);
  await app.reload(); await app.waitForFunction(() => document.querySelector("#fire")?.textContent === "停步");
  await app.locator("#expand-stage").click(); await app.screenshot({ path: new URL("shadow-expanded.png", out).pathname }); await app.keyboard.press("Escape");
  await app.locator("#retry").click(); await app.setViewportSize({ width: 390, height: 844 }); await app.locator("canvas").scrollIntoViewIfNeeded();
  await app.screenshot({ path: new URL("shadow-app-mobile.png", out).pathname }); assert.equal(await app.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.ok(requests.some(u => u.endsWith("/packs/built/shadow-crew.js"))); assert.ok(!requests.some(u => /^https?:/.test(u) && !u.startsWith(origin)));
  report.app = { offline: true, save: true, reload: true, accessibleText: true, noOverflow: true };
  await app.close(); assert.deepEqual(errors, []); console.log(JSON.stringify(report));
} finally { await browser.close(); await writeFile(new URL("report.json", out), JSON.stringify({ ...report, errors }, null, 2)); }
