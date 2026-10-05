import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const origin = process.env.STAGE_ORIGIN || "http://127.0.0.1:4175", out = new URL("../output/yesterday-qa/", import.meta.url), errors = [], report = {};
await mkdir(out, { recursive: true });
async function setup(page, fallback = false) {
  page.on("pageerror", e => errors.push(e.message));
  await page.goto(`${origin}/apps/codex-stage/studio/yesterday-catalog.js`);
  await page.clock.install({ time: new Date("2026-09-20T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-09-20T00:00:01Z"));
  await page.evaluate(async fallback => {
    document.body.replaceChildren(); document.body.style.cssText = "margin:0;background:#a8d9ee";
    const meta = document.createElement("meta"); meta.name = "viewport"; meta.content = "width=device-width,initial-scale=1"; document.head.append(meta);
    const canvas = document.createElement("canvas"); canvas.tabIndex = 0; canvas.style.cssText = "display:block;width:100vw;aspect-ratio:16/9;touch-action:none"; document.body.append(canvas);
    window.qa = { audio: 0 };
    for (const Proto of [OscillatorNode, AudioBufferSourceNode]) { const start = Proto.prototype.start; Proto.prototype.start = function (...args) { qa.audio++; return start.apply(this, args); }; }
    if (fallback) { const { STUDIO_ART } = await import("/apps/codex-stage/studio/assets.js"); STUDIO_ART["yesterday-express"] = "data:image/jpeg;base64,broken"; }
    const { STUDIO_PACKS } = await import("/apps/codex-stage/studio/registry.js"), { YESTERDAY_CATALOG } = await import("/apps/codex-stage/studio/yesterday-catalog.js"), { createStudioRuntime } = await import("/apps/codex-stage/studio/runtime.js"), pack = STUDIO_PACKS["yesterday-express"];
    qa.runtime = createStudioRuntime(canvas, YESTERDAY_CATALOG[0], opts => qa.world = pack.create(opts), pack.paint, {}, (...args) => qa.painter = pack.createPainter(...args));
    qa.runtime.start(); await qa.painter.ready; qa.painter.draw(qa.world);
  }, fallback);
  await page.clock.runFor(50);
}
async function point(page, x, y) { const b = await page.locator("canvas").boundingBox(); return { x: b.x + x * b.width / 960, y: b.y + y * b.height / 540 }; }
async function click(page, x, y) { const p = await point(page, x, y); await page.mouse.click(p.x, p.y); }
async function node(page, index) { const n = await page.evaluate(index => qa.world.scene.nodes[index], index); await click(page, n.x, n.y - 24); }
async function record(page, index) { await node(page, index); await click(page, 830, 500); await page.clock.runFor(7000); }
async function pixels(page) {
  return page.locator("canvas").evaluate(canvas => {
    const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data, colors = new Set(); let light = 0;
    for (let i = 0; i < data.length; i += 32) { const r = data[i], g = data[i + 1], b = data[i + 2]; colors.add(`${r},${g},${b}`); if (r + g + b > 300) light++; }
    return { colors: colors.size, lightFraction: light / (data.length / 32) };
  });
}
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } }); await setup(page);
  assert.equal(await page.evaluate(() => qa.painter.diagnostics.assetLoaded), true);
  report.pixels = await pixels(page); assert.ok(report.pixels.colors > 500); assert.ok(report.pixels.lightFraction > .7);
  await page.screenshot({ path: new URL("yesterday-first-desktop.png", out).pathname });
  await record(page, 1); assert.equal(await page.evaluate(() => qa.world.plates().A), true);
  await node(page, 5); const before = await page.locator("canvas").evaluate(c => c.toDataURL()); await page.clock.runFor(800);
  assert.notEqual(await page.locator("canvas").evaluate(c => c.toDataURL()), before, "courier and clock visibly move");
  await page.screenshot({ path: new URL("yesterday-bridge-desktop.png", out).pathname });
  await page.clock.runFor(5000); assert.equal(await page.evaluate(() => qa.world.scene.completed), true);
  await click(page, 830, 500); await page.clock.runFor(50); assert.equal(await page.evaluate(() => qa.world.scene.level), 1);
  await record(page, 1); await record(page, 2); await node(page, 7); await page.clock.runFor(2400);
  await page.screenshot({ path: new URL("yesterday-lift-desktop.png", out).pathname });
  await page.clock.runFor(6000); assert.equal(await page.evaluate(() => qa.world.scene.completed), true);
  assert.equal(await page.evaluate(() => qa.audio), 0);
  await page.evaluate(() => qa.runtime.setMuted(false)); await page.waitForTimeout(100); await click(page, 830, 500); await page.clock.runFor(100);
  assert.ok(await page.evaluate(() => qa.audio) > 0); report.sound = true;
  await record(page, 1); await record(page, 6); assert.equal(await page.evaluate(() => qa.world.scene.parcel.owner), 1);
  await node(page, 7); await page.clock.runFor(1900);
  await page.screenshot({ path: new URL("yesterday-handoff-desktop.png", out).pathname });
  await page.evaluate(() => qa.runtime.setPaused(true)); const paused = await page.evaluate(() => qa.world.checkpoint());
  await page.clock.runFor(1000); assert.deepEqual(await page.evaluate(() => qa.world.checkpoint()), paused);
  await page.evaluate(() => qa.runtime.setPaused(false)); await page.clock.runFor(1000); await node(page, 9); await page.clock.runFor(1000);
  await page.evaluate(() => qa.runtime.stop()); const stopped = await page.evaluate(() => ({ cp: qa.world.checkpoint(), audio: qa.audio, png: document.querySelector("canvas").toDataURL() }));
  await page.clock.runFor(2000); await page.keyboard.press("Enter"); await click(page, 830, 500);
  assert.deepEqual(await page.evaluate(() => ({ cp: qa.world.checkpoint(), audio: qa.audio, png: document.querySelector("canvas").toDataURL() })), stopped);
  await page.evaluate(() => { qa.runtime.restoreCheckpoint(qa.world.checkpoint()); qa.runtime.start(); }); await page.clock.runFor(6000);
  assert.equal(await page.evaluate(() => qa.world.scene.phase), "won");
  await page.screenshot({ path: new URL("yesterday-delivered.png", out).pathname });
  report.chapters = 3; report.lifecycle = true; await page.evaluate(() => qa.runtime.destroy()); assert.equal(await page.evaluate(() => qa.painter.diagnostics.contexts), 0); await page.close();

  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, reducedMotion: "reduce" });
  const mobile = await context.newPage(); await setup(mobile); await mobile.evaluate(() => qa.runtime.setReduced(true));
  for (const [x, y] of [[110, 326], [830, 500]]) { const p = await point(mobile, x, y); await mobile.touchscreen.tap(p.x, p.y); }
  await mobile.clock.runFor(1500); const target = await point(mobile, 840, 326); await mobile.touchscreen.tap(target.x, target.y); await mobile.clock.runFor(1500);
  assert.equal(await mobile.evaluate(() => qa.world.scene.records.length), 1); report.mobile = await pixels(mobile);
  await mobile.screenshot({ path: new URL("yesterday-mobile.png", out).pathname }); await mobile.clock.runFor(6000);
  assert.equal(await mobile.evaluate(() => qa.world.scene.completed), true); await mobile.evaluate(() => qa.runtime.destroy()); await context.close();

  const fallback = await browser.newPage({ viewport: { width: 960, height: 540 } }); await setup(fallback, true);
  assert.equal(await fallback.evaluate(() => qa.painter.diagnostics.assetLoaded), false); await record(fallback, 1); await node(fallback, 5); await fallback.clock.runFor(7000);
  assert.equal(await fallback.evaluate(() => qa.world.scene.completed), true); report.noAssetFallback = true; await fallback.evaluate(() => qa.runtime.destroy()); await fallback.close();

  const app = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); app.on("pageerror", e => errors.push(e.message));
  const requests = []; app.on("request", r => requests.push(r.url()));
  await app.goto(`${origin}/codex-stage?game=yesterday-express`); await app.waitForFunction(() => document.querySelector("#fire")?.textContent.includes("留下分身"));
  assert.equal(await app.locator("#game-title").textContent(), "昨天的快递员"); assert.match(await app.locator("canvas").getAttribute("aria-label"), /分身/);
  await click(app, 110, 326); await app.locator("#fire").click(); await app.waitForTimeout(1300);
  await app.locator("#stop").click(); const saved = await app.evaluate(() => JSON.parse(localStorage.getItem("agent-stage:checkpoint:v1:yesterday-express")));
  assert.equal(saved.records.length, 1); assert.equal(saved.actors[0].node, 1);
  await app.reload(); await app.waitForFunction(() => document.querySelector("#stage-live")?.textContent.includes("红色信箱"));
  await app.screenshot({ path: new URL("yesterday-app.png", out).pathname });
  await app.locator("#expand-stage").click(); await app.screenshot({ path: new URL("yesterday-expanded.png", out).pathname }); await app.keyboard.press("Escape");
  await app.setViewportSize({ width: 390, height: 844 }); await app.screenshot({ path: new URL("yesterday-app-mobile.png", out).pathname });
  assert.equal(await app.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.ok(requests.some(u => u.endsWith("/packs/built/yesterday-express.js"))); assert.ok(!requests.some(u => /^https?:/.test(u) && !u.startsWith(origin)));
  report.app = { saved: true, restoredAfterReload: true, noHorizontalOverflow: true, offlineAssets: true, screenReaderText: true };
  await app.close(); assert.deepEqual(errors, []); console.log(JSON.stringify(report));
} finally { await browser.close(); await writeFile(new URL("report.json", out), JSON.stringify({ ...report, errors }, null, 2)); }
