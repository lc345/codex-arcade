import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { solveToastJump } from "./toast-replay.mjs";
import { createCodexStageInjectorSource } from "../packages/codex-stage/src/injector.js";
import { buildReviewedPack } from "../apps/codex-stage/packs/build.js";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const origin = process.env.STAGE_ORIGIN || "http://127.0.0.1:4175", output = new URL("../output/toast-qa/", import.meta.url), errors = [], report = {};
await mkdir(output, { recursive: true });
const png = p => p.locator("canvas").evaluate(c => c.toDataURL());
async function setup(page) {
  page.on("pageerror", e => errors.push(e.message)); await page.goto(`${origin}/apps/codex-stage/studio/toast-catalog.js`);
  await page.clock.install({ time: new Date("2026-09-20T00:00:00Z") }); await page.clock.pauseAt(new Date("2026-09-20T00:00:01Z"));
  await page.evaluate(async () => {
    document.body.replaceChildren(); document.body.style.cssText = "margin:0;background:#afd8c6"; const meta = document.createElement("meta"); meta.name = "viewport"; meta.content = "width=device-width,initial-scale=1"; document.head.append(meta);
    const canvas = document.createElement("canvas"); canvas.tabIndex = 0; canvas.style.cssText = "display:block;width:100vw;aspect-ratio:16/9;touch-action:none"; document.body.append(canvas);
    window.qa = { audio: 0 }; const start = OscillatorNode.prototype.start; OscillatorNode.prototype.start = function (...a) { qa.audio++; return start.apply(this, a); };
    const { STUDIO_PACKS } = await import("/apps/codex-stage/studio/registry.js"), { TOAST_CATALOG } = await import("/apps/codex-stage/studio/toast-catalog.js"), { createStudioRuntime } = await import("/apps/codex-stage/studio/runtime.js"), p = STUDIO_PACKS["toast-hop"];
    qa.runtime = createStudioRuntime(canvas, TOAST_CATALOG[0], o => qa.world = p.create(o), p.paint, {}, (...a) => qa.painter = p.createPainter(...a)); qa.runtime.start(); await qa.painter.ready;
  }); await page.clock.runFor(50);
}
async function point(page) { const b = await page.locator("canvas").boundingBox(); return { x: b.x + b.width * .42, y: b.y + b.height * .6 }; }
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } }); await setup(page);
  assert.equal(await page.evaluate(() => qa.painter.diagnostics.assetLoaded), true);
  const still = await png(page); await page.clock.runFor(500); assert.equal(await png(page), still);
  report.colors = await page.locator("canvas").evaluate(c => { const data = c.getContext("2d").getImageData(0, 0, c.width, c.height).data, colors = new Set(); for (let i = 0; i < data.length; i += 100) colors.add(`${data[i]},${data[i + 1]},${data[i + 2]}`); return colors.size; }); assert.ok(report.colors > 1000);
  await page.screenshot({ path: new URL("toast-start.png", output).pathname }); const p = await point(page); await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.clock.runFor(400);
  assert.ok(await page.evaluate(() => qa.world.scene.charge > .4)); assert.notEqual(await png(page), still); await page.screenshot({ path: new URL("toast-charge.png", output).pathname });
  await page.evaluate(() => document.querySelector("canvas").blur()); await page.mouse.up(); assert.equal(await page.evaluate(() => qa.world.scene.mode), "ready");
  await page.locator("canvas").focus(); await page.evaluate(() => qa.runtime.setMuted(false)); await page.keyboard.down("Space"); await page.clock.runFor(470); await page.keyboard.up("Space"); await page.clock.runFor(100);
  assert.equal(await page.evaluate(() => qa.world.scene.mode), "flight"); await page.evaluate(() => qa.runtime.stop());
  const stopped = await page.evaluate(() => ({ cp: qa.world.checkpoint(), audio: qa.audio, png: document.querySelector("canvas").toDataURL() })); await page.clock.runFor(2000); await page.keyboard.press("Space");
  assert.deepEqual(await page.evaluate(() => ({ cp: qa.world.checkpoint(), audio: qa.audio, png: document.querySelector("canvas").toDataURL() })), stopped);
  await page.evaluate(() => { qa.runtime.restoreCheckpoint(qa.world.checkpoint()); qa.runtime.start(); }); assert.equal(await page.evaluate(() => qa.world.scene.mode), "flight");
  await page.clock.runFor(50); assert.notEqual(await page.evaluate(() => qa.world.scene.player.y), stopped.cp.body[1]); report.stopAndResume = true;
  await page.evaluate(() => qa.runtime.retry()); report.holds = [];
  for (let i = 0; i < 10; i++) {
    const choice = solveToastJump(await page.evaluate(() => qa.world.checkpoint())); report.holds.push(Math.round(choice.ticks * 1000 / 120));
    await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.clock.runFor(Math.round(choice.ticks * 1000 / 120)); await page.mouse.up(); await page.clock.runFor(950);
    assert.equal(await page.evaluate(() => qa.world.scene.index), i + 1, `mouse jump ${i + 1}`);
    if ([3, 7, 9].includes(i)) await page.screenshot({ path: new URL(`toast-table-${i + 1}.png`, output).pathname });
  }
  assert.equal(await page.evaluate(() => qa.world.scene.phase), "won"); assert.ok(await page.evaluate(() => qa.audio) > 0); report.pointerWin = report.audio = true;
  await page.evaluate(() => qa.runtime.retry()); await page.mouse.click(p.x, p.y); await page.clock.runFor(1300); assert.equal(await page.evaluate(() => qa.world.scene.deaths), 1);
  await page.screenshot({ path: new URL("toast-retry.png", output).pathname }); await page.evaluate(() => qa.runtime.destroy()); await page.close();

  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: "reduce" }), mobile = await context.newPage(); await setup(mobile); await mobile.evaluate(() => qa.runtime.setReduced(true));
  const touch = await mobile.context().newCDPSession(mobile), tp = await point(mobile), choice = solveToastJump(await mobile.evaluate(() => qa.world.checkpoint()));
  await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...tp, id: 1 }] }); await mobile.clock.runFor(Math.round(choice.ticks * 1000 / 120)); await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await mobile.clock.runFor(950);
  assert.equal(await mobile.evaluate(() => qa.world.scene.index), 1); assert.equal(await mobile.evaluate(() => qa.audio), 0); report.touchMutedReduced = true;
  await mobile.screenshot({ path: new URL("toast-touch.png", output).pathname }); await mobile.evaluate(() => qa.runtime.destroy()); await context.close();

  const app = await browser.newPage({ viewport: { width: 1440, height: 1000 } }), requests = []; app.on("pageerror", e => errors.push(e.message)); app.on("request", r => requests.push(r.url())); await app.goto(`${origin}/codex-stage?game=toast-hop`);
  await app.waitForFunction(() => document.querySelector("#game-title")?.textContent === "吐司别掉" && document.querySelector("#stage-live")?.textContent.includes("最远"));
  assert.equal(await app.locator("#ability").isVisible(), false, "single-input game must not expose an empty skill button");
  assert.equal(await app.locator(".level-strip").isVisible(), false); await app.locator("#fire").click(); await app.waitForTimeout(400); await app.locator("#stop").click();
  const cp = await app.evaluate(() => JSON.parse(localStorage.getItem("agent-stage:checkpoint:v1:toast-hop"))); assert.equal(cp.mode, "ready");
  await app.reload(); await app.waitForFunction(() => document.querySelector("#stage-live")?.textContent.includes("最远")); await app.locator("#expand-stage").click(); await app.screenshot({ path: new URL("toast-expanded.png", output).pathname }); await app.keyboard.press("Escape");
  await app.setViewportSize({ width: 390, height: 844 }); await app.locator("canvas").scrollIntoViewIfNeeded(); assert.equal(await app.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true); await app.screenshot({ path: new URL("toast-app-mobile.png", output).pathname });
  assert.ok(!requests.some(u => /^https?:/.test(u) && !u.startsWith(origin))); report.offlineSaveReload = true; await app.close();

  const dock = await browser.newPage({ viewport: { width: 1100, height: 850 } }); dock.on("pageerror", e => errors.push(e.message)); await dock.goto(`${origin}/apps/codex-stage/studio/toast-catalog.js`);
  await dock.setContent('<div id="shell" style="width:220px">Codex shell fixture</div><div id="dream-skin">Theme fixture</div>'); await dock.evaluate(createCodexStageInjectorSource({ lazy: true }));
  await dock.evaluate(() => { const s = document.querySelector("agent-stage-dock").shadowRoot.querySelector("[data-game]"); s.value = "toast-hop"; s.dispatchEvent(new Event("change")); window.__AGENT_STAGE_CODEX_DOCK__.dispatch({ type: "turn.started", runId: "toast-qa", spanId: "toast", operation: { family: "turn" } }); });
  for (const request of await dock.evaluate(() => window.__AGENT_STAGE_CODEX_DOCK__.pendingPacks())) { const pack = buildReviewedPack(request.id); await dock.evaluate(`window.__AGENT_STAGE_CODEX_DOCK__.acceptPack(${request.request}, ${JSON.stringify(request.id)}, ${pack.factory})`); }
  await dock.waitForFunction(() => window.__AGENT_STAGE_CODEX_DOCK__.snapshot()?.mode === "ready"); assert.equal(await dock.locator('[data-action="boost"]').isVisible(), false);
  await dock.locator('[data-action="resize"]').click(); const canvas = dock.locator("agent-stage-dock canvas"); await canvas.focus(); await dock.keyboard.down("Space"); await dock.waitForTimeout(450); await dock.keyboard.up("Space");
  await dock.screenshot({ path: new URL("toast-dock.png", output).pathname });
  await dock.evaluate(() => window.__AGENT_STAGE_CODEX_DOCK__.dispatch({ type: "turn.completed", runId: "toast-qa", operation: { family: "turn" } })); const snap = await dock.evaluate(() => window.__AGENT_STAGE_CODEX_DOCK__.snapshot()); const frozen = await canvas.evaluate(c => c.toDataURL()); assert.equal(snap.active, false);
  await dock.waitForTimeout(200); assert.deepEqual(await dock.evaluate(() => window.__AGENT_STAGE_CODEX_DOCK__.snapshot()), snap); assert.equal(await canvas.evaluate(c => c.toDataURL()), frozen);
  await dock.evaluate(() => window.__AGENT_STAGE_CODEX_DOCK__.cleanup()); assert.equal(await dock.locator("#shell").evaluate(e => e.offsetWidth), 220); report.dock = true; await dock.close();
  assert.deepEqual(errors, []); console.log(JSON.stringify(report));
} finally { await browser.close(); await writeFile(new URL("report.json", output), JSON.stringify({ ...report, errors }, null, 2)); }
