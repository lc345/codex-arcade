import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const origin = process.env.STAGE_ORIGIN || "http://127.0.0.1:4175", out = new URL("../output/kitchen-qa/", import.meta.url), errors = [], report = {};
await mkdir(out, { recursive: true });
async function setup(page) {
  page.on("pageerror", e => errors.push(e.message));
  await page.goto(`${origin}/apps/codex-stage/studio/kitchen-catalog.js`);
  await page.clock.install({ time: new Date("2026-09-20T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-09-20T00:00:01Z"));
  await page.evaluate(async () => {
    document.body.replaceChildren(); document.body.style.cssText = "margin:0;background:#c9decf";
    const meta = document.createElement("meta"); meta.name = "viewport"; meta.content = "width=device-width,initial-scale=1"; document.head.append(meta);
    const canvas = document.createElement("canvas"); canvas.tabIndex = 0; canvas.style.cssText = "display:block;width:100vw;aspect-ratio:16/9;touch-action:none"; document.body.append(canvas);
    window.qa = { audio: 0 };
    for (const Proto of [OscillatorNode, AudioBufferSourceNode]) { const start = Proto.prototype.start; Proto.prototype.start = function (...args) { qa.audio++; return start.apply(this, args); }; }
    const { STUDIO_PACKS } = await import("/apps/codex-stage/studio/registry.js"), { KITCHEN_CATALOG } = await import("/apps/codex-stage/studio/kitchen-catalog.js"), { createStudioRuntime } = await import("/apps/codex-stage/studio/runtime.js"), pack = STUDIO_PACKS["kitchen-defense"];
    qa.runtime = createStudioRuntime(canvas, KITCHEN_CATALOG[0], opts => qa.world = pack.create(opts), pack.paint, {}, (...args) => qa.painter = pack.createPainter(...args));
    qa.runtime.start(); await qa.painter.ready; qa.painter.draw(qa.world);
  });
  await page.clock.runFor(50);
}
async function point(page, x, y) { const b = await page.locator("canvas").boundingBox(); return { x: b.x + x * b.width / 960, y: b.y + y * b.height / 540 }; }
async function click(page, x, y) { const p = await point(page, x, y); await page.mouse.click(p.x, p.y); }
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
  report.pixels = await pixels(page); assert.ok(report.pixels.colors > 500); assert.ok(report.pixels.lightFraction > .4);
  await click(page, 246, 493); await click(page, 760, 230); await click(page, 462, 493); await click(page, 500, 230);
  assert.deepEqual(await page.evaluate(() => [qa.world.scene.slots[2].tower.kind, qa.world.scene.slots[4].tower.kind, qa.world.scene.coins]), ["heat", "frost", 40]);
  await page.screenshot({ path: new URL("kitchen-prep-desktop.png", out).pathname });
  await click(page, 132, 493); await page.keyboard.press("ArrowLeft"); await page.keyboard.press("ArrowLeft"); await page.keyboard.press("ArrowLeft");
  await page.keyboard.press(" "); assert.equal(await page.evaluate(() => qa.world.scene.mode), "prep", "failed placement must not accidentally start the wave");
  await click(page, 860, 49); await page.clock.runFor(12000);
  assert.equal(await page.evaluate(() => qa.world.scene.mode), "battle");
  assert.ok(await page.evaluate(() => qa.world.scene.combos.steam) > 0);
  await page.screenshot({ path: new URL("kitchen-battle-desktop.png", out).pathname });
  assert.equal(await page.evaluate(() => qa.audio), 0);
  await page.evaluate(() => qa.runtime.setMuted(false)); await page.waitForTimeout(100); await click(page, 846, 494); await page.clock.runFor(300);
  assert.ok(await page.evaluate(() => qa.audio) > 0); report.sound = true;
  await page.evaluate(() => qa.runtime.setPaused(true)); const paused = await page.evaluate(() => JSON.stringify(qa.world.checkpoint()));
  await page.clock.runFor(1000); assert.equal(await page.evaluate(() => JSON.stringify(qa.world.checkpoint())), paused);
  await page.evaluate(() => qa.runtime.setPaused(false));
  for (let n = 0; n < 60 && await page.evaluate(() => qa.world.scene.mode) !== "reward"; n++) await page.clock.runFor(1000);
  assert.equal(await page.evaluate(() => qa.world.scene.mode), "reward"); await page.screenshot({ path: new URL("kitchen-recipes.png", out).pathname });
  await click(page, 250, 265); assert.equal(await page.evaluate(() => qa.world.scene.mode), "prep");
  await click(page, 860, 49); await page.clock.runFor(1200);
  await page.evaluate(() => qa.runtime.stop()); const stopped = await page.evaluate(() => ({ cp: qa.world.checkpoint(), audio: qa.audio, png: document.querySelector("canvas").toDataURL() }));
  await page.clock.runFor(1000); await page.keyboard.press("Enter"); await click(page, 860, 49);
  assert.deepEqual(await page.evaluate(() => ({ cp: qa.world.checkpoint(), audio: qa.audio, png: document.querySelector("canvas").toDataURL() })), stopped);
  report.lifecycle = true; await page.evaluate(() => qa.runtime.destroy()); assert.equal(await page.evaluate(() => qa.painter.diagnostics.contexts), 0); await page.close();

  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, reducedMotion: "reduce" });
  const mobile = await context.newPage(); await setup(mobile); await mobile.evaluate(() => qa.runtime.setReduced(true));
  for (const [x, y] of [[246, 493], [760, 230], [462, 493], [500, 230], [860, 49]]) { const p = await point(mobile, x, y); await mobile.touchscreen.tap(p.x, p.y); }
  await mobile.clock.runFor(12000); assert.ok(await mobile.evaluate(() => qa.world.scene.combos.steam) > 0);
  report.mobile = await pixels(mobile); await mobile.screenshot({ path: new URL("kitchen-mobile.png", out).pathname }); await mobile.evaluate(() => qa.runtime.destroy()); await context.close();

  const app = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); app.on("pageerror", e => errors.push(e.message));
  const requests = []; app.on("request", r => requests.push(r.url()));
  await app.goto(`${origin}/codex-stage?game=kitchen-defense`); await app.waitForFunction(() => document.querySelector("#fire")?.textContent.includes("开餐"));
  assert.equal(await app.locator("#game-title").textContent(), "厨房保卫战");
  await click(app, 246, 493); await click(app, 500, 230); await app.locator("#fire").click(); await app.waitForTimeout(1000);
  await app.locator("#stop").click(); const saved = await app.evaluate(() => JSON.parse(localStorage.getItem("agent-stage:checkpoint:v1:kitchen-defense")));
  assert.equal(saved.mode, "battle"); assert.equal(saved.towers[2][0], "frost");
  await app.reload(); await app.waitForFunction(() => document.querySelector("#fire")?.textContent === "清扫队来袭");
  await app.screenshot({ path: new URL("kitchen-app.png", out).pathname });
  await app.locator("#expand-stage").click(); await app.screenshot({ path: new URL("kitchen-expanded.png", out).pathname }); await app.keyboard.press("Escape");
  await app.setViewportSize({ width: 390, height: 844 }); await app.screenshot({ path: new URL("kitchen-app-mobile.png", out).pathname });
  assert.equal(await app.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.ok(requests.some(u => u.endsWith("/packs/built/kitchen-defense.js"))); assert.ok(!requests.some(u => /^https?:/.test(u) && !u.startsWith(origin)));
  report.app = { saved: true, restoredAfterReload: true, noHorizontalOverflow: true, offlineAssets: true };
  await app.close(); assert.deepEqual(errors, []); console.log(JSON.stringify(report));
} finally { await browser.close(); await writeFile(new URL("report.json", out), JSON.stringify({ ...report, errors }, null, 2)); }
