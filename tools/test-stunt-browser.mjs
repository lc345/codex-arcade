import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const origin = process.env.STAGE_ORIGIN || "http://127.0.0.1:4175", out = new URL("../output/stunt-qa/", import.meta.url), errors = [], report = {};
await mkdir(out, { recursive: true });
async function setup(page, fallback = false) {
  page.on("pageerror", e => errors.push(e.message));
  await page.goto(`${origin}/apps/codex-stage/studio/stunt-catalog.js`);
  await page.clock.install({ time: new Date("2026-09-20T00:00:00Z") }); await page.clock.pauseAt(new Date("2026-09-20T00:00:01Z"));
  await page.evaluate(async fallback => {
    document.body.replaceChildren(); document.body.style.cssText = "margin:0;background:#283e43";
    const meta = document.createElement("meta"); meta.name = "viewport"; meta.content = "width=device-width,initial-scale=1"; document.head.append(meta);
    const canvas = document.createElement("canvas"); canvas.tabIndex = 0; canvas.style.cssText = "display:block;width:100vw;aspect-ratio:16/9;touch-action:none"; document.body.append(canvas);
    window.qa = { audio: 0, stoppedVoices: 0 };
    for (const Proto of [OscillatorNode, AudioBufferSourceNode]) { const start = Proto.prototype.start, stop = Proto.prototype.stop; Proto.prototype.start = function (...args) { qa.audio++; return start.apply(this, args); }; Proto.prototype.stop = function (...args) { qa.stoppedVoices++; return stop.apply(this, args); }; }
    if (fallback) { const { STUDIO_ART } = await import("/apps/codex-stage/studio/assets.js"); STUDIO_ART["temp-stunt"] = "data:image/webp;base64,broken"; }
    const { STUDIO_PACKS } = await import("/apps/codex-stage/studio/registry.js"), { STUNT_CATALOG } = await import("/apps/codex-stage/studio/stunt-catalog.js"), { createStudioRuntime } = await import("/apps/codex-stage/studio/runtime.js"), pack = STUDIO_PACKS["temp-stunt"];
    qa.runtime = createStudioRuntime(canvas, STUNT_CATALOG[0], options => qa.world = pack.create(options), pack.paint, {}, (...args) => qa.painter = pack.createPainter(...args));
    qa.runtime.start(); await qa.painter.ready; qa.painter.draw(qa.world);
  }, fallback); await page.clock.runFor(50);
}
async function coords(page, x, y) { const b = await page.locator("canvas").boundingBox(); return { x: b.x + x * b.width / 960, y: b.y + y * b.height / 540 }; }
async function click(page, x, y) { const p = await coords(page, x, y); await page.mouse.click(p.x, p.y); }
async function shoot(page, dx = 95, dy = 40) { const a = await coords(page, 145, 326), b = await coords(page, 145 - dx, 326 + dy); await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(b.x, b.y, { steps: 5 }); await page.mouse.up(); }
const png = page => page.locator("canvas").evaluate(c => c.toDataURL());
async function pixels(page) { return page.locator("canvas").evaluate(canvas => { const d = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data, colors = new Set(); let alpha = 0; for (let i = 0; i < d.length; i += 32) { colors.add(`${d[i]},${d[i + 1]},${d[i + 2]}`); if (d[i + 3]) alpha++; } return { colors: colors.size, opaque: alpha / (d.length / 32) }; }); }
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 810 } }); await setup(page);
  report.pixels = await pixels(page); assert.ok(report.pixels.colors > 2000); assert.equal(report.pixels.opaque, 1);
  assert.equal(await page.evaluate(() => qa.painter.diagnostics.assetLoaded), true);
  await page.screenshot({ path: new URL("stunt-start.png", out).pathname });
  await page.clock.runFor(750); assert.equal(await page.evaluate(() => qa.world.scene.mode), "ready"); assert.equal(await page.evaluate(() => qa.world.scene.player.x), 145);
  await click(page, 399, 60); assert.equal(await page.evaluate(() => qa.world.scene.challenge), 1);
  await shoot(page); await page.clock.runFor(330); const airborne = await png(page);
  await page.screenshot({ path: new URL("stunt-flight.png", out).pathname });
  await page.clock.runFor(100); assert.notEqual(await png(page), airborne); assert.equal(await page.evaluate(() => qa.audio), 0);
  await page.evaluate(() => qa.runtime.setPaused(true)); const paused = await page.evaluate(() => qa.world.checkpoint()); await page.clock.runFor(1000); assert.deepEqual(await page.evaluate(() => qa.world.checkpoint()), paused);
  await page.evaluate(() => { qa.runtime.setPaused(false); qa.runtime.stop(); });
  const stopped = await page.evaluate(() => ({ cp: qa.world.checkpoint(), audio: qa.audio, png: document.querySelector("canvas").toDataURL() }));
  await page.clock.runFor(1000); await page.keyboard.press("Enter"); await click(page, 430, 114);
  assert.deepEqual(await page.evaluate(() => ({ cp: qa.world.checkpoint(), audio: qa.audio, png: document.querySelector("canvas").toDataURL() })), stopped);
  await page.evaluate(() => { qa.runtime.restoreCheckpoint(qa.world.checkpoint()); qa.runtime.start(); }); await page.clock.runFor(5000);
  assert.equal(await page.evaluate(() => qa.world.scene.phase), "won"); assert.equal(await page.evaluate(() => qa.world.scene.badges[0]), true); assert.equal(await page.evaluate(() => qa.world.scene.challengePassed), true); report.stopAndResume = true;
  await page.screenshot({ path: new URL("stunt-wrap.png", out).pathname });
  await page.keyboard.press("r"); await page.keyboard.press("3"); assert.match(await page.evaluate(() => qa.world.scene.status), /复印机救场/); await shoot(page, 55, 10); await page.clock.runFor(750); await page.screenshot({ path: new URL("stunt-copier.png", out).pathname }); await page.clock.runFor(5000);
  assert.equal(await page.evaluate(() => qa.world.scene.phase), "won"); assert.equal(await page.evaluate(() => qa.world.scene.bounced), true); assert.equal(await page.evaluate(() => qa.world.scene.badges[1]), true); report.copier = report.challenges = true;
  await page.keyboard.press("r"); await page.evaluate(() => qa.runtime.setMuted(false)); await page.waitForTimeout(100);
  await shoot(page, 70, 35); await page.clock.runFor(334); await click(page, 430, 114);
  assert.equal(await page.evaluate(() => qa.world.scene.attached), 0); await page.clock.runFor(250);
  await page.screenshot({ path: new URL("stunt-hook.png", out).pathname }); await click(page, 430, 114); await page.clock.runFor(6000);
  assert.equal(await page.evaluate(() => qa.world.scene.phase), "won"); assert.equal(await page.evaluate(() => qa.world.scene.catches), 1); assert.ok(await page.evaluate(() => qa.audio) > 0); report.rescue = report.audio = true;
  await page.keyboard.press("r"); await page.keyboard.press("b"); assert.equal(await page.evaluate(() => qa.world.scene.slow), true);
  await page.keyboard.press("ArrowRight"); assert.equal(await page.evaluate(() => qa.world.scene.aim.x), 73);
  await page.keyboard.press("Space"); await page.clock.runFor(600); assert.equal(await page.evaluate(() => qa.world.scene.mode), "flight");
  const voices = await page.evaluate(() => qa.stoppedVoices); await page.evaluate(() => qa.runtime.stop()); assert.ok(await page.evaluate(() => qa.stoppedVoices) >= voices);
  await page.evaluate(() => qa.runtime.destroy()); assert.equal(await page.evaluate(() => qa.painter.diagnostics.contexts), 0); await page.close();

  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  const mobile = await context.newPage(); await setup(mobile); await mobile.evaluate(() => qa.runtime.setReduced(true));
  const session = await context.newCDPSession(mobile), a = await coords(mobile, 145, 326), b = await coords(mobile, 50, 366);
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...a, id: 1 }] });
  await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...b, id: 1 }] });
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await mobile.clock.runFor(420); await mobile.screenshot({ path: new URL("stunt-touch.png", out).pathname }); await mobile.clock.runFor(6000);
  assert.equal(await mobile.evaluate(() => qa.world.scene.phase), "won"); report.mobile = await pixels(mobile); await mobile.evaluate(() => qa.runtime.destroy()); await context.close();

  const fallback = await browser.newPage(); await setup(fallback, true); assert.equal(await fallback.evaluate(() => qa.painter.diagnostics.assetLoaded), false);
  await shoot(fallback); await fallback.clock.runFor(6000); assert.equal(await fallback.evaluate(() => qa.world.scene.phase), "won"); report.fallback = true; await fallback.evaluate(() => qa.runtime.destroy()); await fallback.close();

  const app = await browser.newPage({ viewport: { width: 1440, height: 1050 } }), requests = [];
  app.on("pageerror", e => errors.push(e.message)); app.on("request", r => requests.push(r.url()));
  await app.goto(`${origin}/codex-stage?game=temp-stunt`); await app.waitForFunction(() => document.querySelector("#fire")?.textContent === "开拍");
  assert.equal(await app.locator("#game-title").textContent(), "临时替身"); assert.match(await app.locator("canvas").getAttribute("aria-label"), /吊灯/);
  await app.screenshot({ path: new URL("stunt-app.png", out).pathname });
  await app.locator("#ability").click(); await shoot(app); await app.waitForTimeout(200); await app.locator("#stop").click();
  const saved = await app.evaluate(() => JSON.parse(localStorage.getItem("agent-stage:checkpoint:v1:temp-stunt"))); assert.equal(saved.mode, "flight"); assert.equal(saved.limbs.length, 10); assert.equal(saved.slow, true);
  await app.reload(); await app.waitForFunction(() => document.querySelector("#fire")?.textContent === "抓吊灯");
  await app.locator("#expand-stage").click(); await app.screenshot({ path: new URL("stunt-expanded.png", out).pathname }); await app.keyboard.press("Escape");
  await app.waitForFunction(() => document.querySelector("#fire")?.textContent === "再拍一条");
  await app.locator("#retry").click();
  await app.setViewportSize({ width: 390, height: 844 }); await app.screenshot({ path: new URL("stunt-app-mobile.png", out).pathname }); assert.equal(await app.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.ok(requests.some(u => u.endsWith("/packs/built/temp-stunt.js"))); assert.ok(!requests.some(u => /^https?:/.test(u) && !u.startsWith(origin)));
  report.app = { offline: true, save: true, reload: true, accessibleText: true, noOverflow: true };
  await app.close(); assert.deepEqual(errors, []); console.log(JSON.stringify(report));
} finally { await browser.close(); await writeFile(new URL("report.json", out), JSON.stringify({ ...report, errors }, null, 2)); }
