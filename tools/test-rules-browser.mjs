import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const origin = process.env.STAGE_ORIGIN || "http://127.0.0.1:4175", out = new URL("../output/rules-qa/", import.meta.url), errors = [], report = {};
await mkdir(out, { recursive: true });
async function setup(page, fallback = false) {
  page.on("pageerror", e => errors.push(e.message));
  await page.goto(`${origin}/apps/codex-stage/studio/rule-catalog.js`);
  await page.clock.install({ time: new Date("2026-09-20T00:00:00Z") }); await page.clock.pauseAt(new Date("2026-09-20T00:00:01Z"));
  await page.evaluate(async fallback => {
    document.body.replaceChildren(); document.body.style.cssText = "margin:0;background:#eaf0e9";
    const meta = document.createElement("meta"); meta.name = "viewport"; meta.content = "width=device-width,initial-scale=1"; document.head.append(meta);
    const canvas = document.createElement("canvas"); canvas.tabIndex = 0; canvas.style.cssText = "display:block;width:100vw;aspect-ratio:16/9;touch-action:none"; document.body.append(canvas);
    window.qa = { audio: 0 };
    for (const Proto of [OscillatorNode, AudioBufferSourceNode]) { const start = Proto.prototype.start; Proto.prototype.start = function (...args) { qa.audio++; return start.apply(this, args); }; }
    if (fallback) { const { STUDIO_ART } = await import("/apps/codex-stage/studio/assets.js"); STUDIO_ART["rule-smuggler"] = "data:image/webp;base64,broken"; }
    const { STUDIO_PACKS } = await import("/apps/codex-stage/studio/registry.js"), { RULE_CATALOG } = await import("/apps/codex-stage/studio/rule-catalog.js"), { createStudioRuntime } = await import("/apps/codex-stage/studio/runtime.js"), pack = STUDIO_PACKS["rule-smuggler"];
    qa.runtime = createStudioRuntime(canvas, RULE_CATALOG[0], options => qa.world = pack.create(options), pack.paint, {}, (...args) => qa.painter = pack.createPainter(...args));
    qa.runtime.start(); await qa.painter.ready; qa.painter.draw(qa.world);
  }, fallback); await page.clock.runFor(50);
}
async function coords(page, x, y) { const b = await page.locator("canvas").boundingBox(); return { x: b.x + x * b.width / 960, y: b.y + y * b.height / 540 }; }
async function click(page, x, y) { const p = await coords(page, x, y); await page.mouse.click(p.x, p.y); }
const cell = (page, x, y) => click(page, 103 + x * 68, 123 + y * 64);
const card = (page, n) => click(page, 96 + (n - 1) * 151, 480);
const commit = page => click(page, 825, 373);
async function pixels(page) { return page.locator("canvas").evaluate(canvas => { const d = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data, colors = new Set(); let alpha = 0; for (let i = 0; i < d.length; i += 32) { colors.add(`${d[i]},${d[i + 1]},${d[i + 2]}`); if (d[i + 3]) alpha++; } return { colors: colors.size, opaque: alpha / (d.length / 32) }; }); }
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 810 } }); await setup(page);
  report.pixels = await pixels(page); assert.ok(report.pixels.colors > 500); assert.equal(report.pixels.opaque, 1);
  assert.equal(await page.evaluate(() => qa.painter.diagnostics.assetLoaded), true);
  await page.screenshot({ path: new URL("rules-start.png", out).pathname });
  await cell(page, 5, 1); await card(page, 4); await cell(page, 0, 1); await cell(page, 5, 3);
  assert.equal(await page.evaluate(() => qa.world.forecast().win), true);
  await page.keyboard.press("b"); assert.equal(await page.evaluate(() => qa.world.scene.energy), 2);
  await cell(page, 0, 1); await cell(page, 5, 3); await page.clock.runFor(50);
  await page.screenshot({ path: new URL("rules-reflection-preview.png", out).pathname });
  await commit(page); await page.clock.runFor(290); const before = await page.locator("canvas").evaluate(c => c.toDataURL());
  await page.clock.runFor(100); assert.notEqual(await page.locator("canvas").evaluate(c => c.toDataURL()), before);
  await page.screenshot({ path: new URL("rules-projectile.png", out).pathname });
  assert.equal(await page.evaluate(() => qa.audio), 0);
  await page.evaluate(() => qa.runtime.setPaused(true)); const cp = await page.evaluate(() => qa.world.checkpoint()); await page.clock.runFor(1000); assert.deepEqual(await page.evaluate(() => qa.world.checkpoint()), cp);
  await page.evaluate(() => { qa.runtime.setPaused(false); qa.runtime.stop(); });
  const stopped = await page.evaluate(() => ({ cp: qa.world.checkpoint(), audio: qa.audio, png: document.querySelector("canvas").toDataURL() }));
  await page.clock.runFor(1000); await page.keyboard.press("Enter"); await cell(page, 3, 2); await commit(page);
  assert.deepEqual(await page.evaluate(() => ({ cp: qa.world.checkpoint(), audio: qa.audio, png: document.querySelector("canvas").toDataURL() })), stopped);
  await page.evaluate(() => { qa.runtime.restoreCheckpoint(qa.world.checkpoint()); qa.runtime.start(); }); await page.clock.runFor(4000);
  assert.equal(await page.evaluate(() => qa.world.scene.mode), "clear"); report.stopAndResume = true;
  await commit(page); await card(page, 3); await cell(page, 2, 2); await cell(page, 4, 3); await card(page, 4); await cell(page, 0, 2); await cell(page, 6, 3);
  assert.equal(await page.evaluate(() => qa.world.forecast().win), true); await page.clock.runFor(100);
  await page.screenshot({ path: new URL("rules-portal-preview.png", out).pathname });
  await page.evaluate(() => qa.runtime.setMuted(false)); await page.waitForTimeout(100); await commit(page); await page.clock.runFor(4000);
  assert.ok(await page.evaluate(() => qa.audio) > 0); assert.equal(await page.evaluate(() => qa.world.scene.mode), "clear"); report.audio = true;
  await commit(page); await card(page, 5); await cell(page, 0, 1); await cell(page, 0, 0); await card(page, 1); await cell(page, 5, 3); await card(page, 4); await cell(page, 6, 3); await cell(page, 5, 2);
  assert.equal(await page.evaluate(() => qa.world.forecast().remaining), 1);
  await page.clock.runFor(80); await page.screenshot({ path: new URL("rules-armor-preview.png", out).pathname });
  await commit(page); await page.clock.runFor(760); await page.screenshot({ path: new URL("rules-chain-reaction.png", out).pathname }); await page.clock.runFor(4000);
  await card(page, 3); await cell(page, 3, 0); await cell(page, 5, 0); assert.equal(await page.evaluate(() => qa.world.forecast().win), true);
  await commit(page); await page.clock.runFor(3000); assert.equal(await page.evaluate(() => qa.world.scene.phase), "won"); report.encounters = 3;
  await page.screenshot({ path: new URL("rules-victory.png", out).pathname }); await page.evaluate(() => qa.runtime.destroy()); assert.equal(await page.evaluate(() => qa.painter.diagnostics.contexts), 0); await page.close();

  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  const mobile = await context.newPage(); await setup(mobile); await mobile.evaluate(() => qa.runtime.setReduced(true));
  for (const [x, y] of [[443, 187], [549, 480], [103, 187], [443, 315]]) { const p = await coords(mobile, x, y); await mobile.touchscreen.tap(p.x, p.y); }
  assert.equal(await mobile.evaluate(() => qa.world.forecast().win), true); await mobile.clock.runFor(100); await mobile.screenshot({ path: new URL("rules-touch-preview.png", out).pathname });
  const button = await coords(mobile, 825, 373); await mobile.touchscreen.tap(button.x, button.y); await mobile.clock.runFor(4000); assert.equal(await mobile.evaluate(() => qa.world.scene.mode), "clear");
  report.mobile = await pixels(mobile); await mobile.evaluate(() => qa.runtime.destroy()); await context.close();

  const fallback = await browser.newPage(); await setup(fallback, true); assert.equal(await fallback.evaluate(() => qa.painter.diagnostics.assetLoaded), false);
  await cell(fallback, 5, 1); await card(fallback, 4); await cell(fallback, 0, 1); await cell(fallback, 5, 3); await commit(fallback); await fallback.clock.runFor(4000);
  assert.equal(await fallback.evaluate(() => qa.world.scene.mode), "clear"); report.fallback = true; await fallback.evaluate(() => qa.runtime.destroy()); await fallback.close();

  const app = await browser.newPage({ viewport: { width: 1440, height: 1050 } }), requests = [];
  app.on("pageerror", e => errors.push(e.message)); app.on("request", r => requests.push(r.url()));
  await app.goto(`${origin}/codex-stage?game=rule-smuggler`); await app.waitForFunction(() => document.querySelector("#fire")?.textContent === "执行回合");
  assert.equal(await app.locator("#game-title").textContent(), "规则走私者"); assert.match(await app.locator("canvas").getAttribute("aria-label"), /规则牌/);
  await cell(app, 5, 1); await card(app, 4); await cell(app, 0, 1); await cell(app, 5, 3); await app.locator("#stop").click();
  const saved = await app.evaluate(() => JSON.parse(localStorage.getItem("agent-stage:checkpoint:v1:rule-smuggler"))); assert.equal(saved.energy, 1); assert.equal(saved.board.m.length, 1); assert.equal(saved.history.length, 2);
  await app.reload(); await app.waitForFunction(() => document.querySelector("#stage-live")?.textContent.includes("预计清场"));
  await app.screenshot({ path: new URL("rules-app.png", out).pathname }); await app.locator("#expand-stage").click(); await app.screenshot({ path: new URL("rules-expanded.png", out).pathname }); await app.keyboard.press("Escape");
  await app.setViewportSize({ width: 390, height: 844 }); await app.screenshot({ path: new URL("rules-app-mobile.png", out).pathname }); assert.equal(await app.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.ok(requests.some(u => u.endsWith("/packs/built/rule-smuggler.js"))); assert.ok(!requests.some(u => /^https?:/.test(u) && !u.startsWith(origin)));
  report.app = { offline: true, save: true, reload: true, accessibleText: true, noOverflow: true };
  await app.close(); assert.deepEqual(errors, []); console.log(JSON.stringify(report));
} finally { await browser.close(); await writeFile(new URL("report.json", out), JSON.stringify({ ...report, errors }, null, 2)); }
