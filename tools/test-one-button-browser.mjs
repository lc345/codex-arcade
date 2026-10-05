import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { crossPresses, solveSwing } from "./one-button-replays.mjs";
import { createPressWorld } from "../apps/codex-stage/studio/press-run.js";
import { createCodexStageInjectorSource } from "../packages/codex-stage/src/injector.js";
import { buildReviewedPack } from "../apps/codex-stage/packs/build.js";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const origin = process.env.STAGE_ORIGIN || "http://127.0.0.1:4175", output = new URL("../output/one-button-qa/", import.meta.url), errors = [], report = {};
await mkdir(output, { recursive: true });
async function setup(page, id) {
  page.on("pageerror", e => errors.push(e.message)); await page.goto(`${origin}/apps/codex-stage/studio/one-button-catalog.js`);
  await page.clock.install({ time: new Date("2026-09-23T00:00:00Z") }); await page.clock.pauseAt(new Date("2026-09-23T00:00:01Z"));
  await page.evaluate(async id => {
    document.body.replaceChildren(); document.body.style.cssText = "margin:0;background:#dcebe8";
    const meta = document.createElement("meta"); meta.name = "viewport"; meta.content = "width=device-width,initial-scale=1"; document.head.append(meta);
    const canvas = document.createElement("canvas"); canvas.tabIndex = 0; canvas.style.cssText = "display:block;width:100vw;aspect-ratio:16/9;touch-action:none"; document.body.append(canvas);
    window.qa = { audio: 0 }; const start = OscillatorNode.prototype.start; OscillatorNode.prototype.start = function (...args) { qa.audio++; return start.apply(this, args); };
    const { STUDIO_PACKS } = await import("/apps/codex-stage/studio/registry.js"), { ONE_BUTTON_CATALOG } = await import("/apps/codex-stage/studio/one-button-catalog.js"), { createStudioRuntime } = await import("/apps/codex-stage/studio/runtime.js"), p = STUDIO_PACKS[id];
    qa.runtime = createStudioRuntime(canvas, ONE_BUTTON_CATALOG.find(p => p.id === id), o => qa.world = p.create(o), p.paint, {}, (...args) => qa.painter = p.createPainter(...args)); qa.runtime.start(); await qa.painter.ready;
  }, id);
}
const scene = page => page.evaluate(() => JSON.parse(JSON.stringify(qa.world.scene)));
const shot = (page, name) => page.locator("canvas").screenshot({ path: new URL(`${name}.png`, output).pathname });
async function stopProof(page) {
  await page.evaluate(() => qa.runtime.stop());
  const before = await page.evaluate(() => ({ cp: qa.runtime.checkpoint, audio: qa.audio, image: document.querySelector("canvas").toDataURL() }));
  await page.clock.runFor(900); await page.keyboard.press("Space"); await page.mouse.click(200, 200);
  assert.deepEqual(await page.evaluate(() => ({ cp: qa.runtime.checkpoint, audio: qa.audio, image: document.querySelector("canvas").toDataURL() })), before);
}
try {
  const tower = await browser.newPage({ viewport: { width: 1152, height: 648 } }); await setup(tower, "sky-stack"); await shot(tower, "stack-start");
  const initial = await tower.locator("canvas").evaluate(c => c.toDataURL()); await tower.clock.runFor(150); assert.notEqual(await tower.locator("canvas").evaluate(c => c.toDataURL()), initial);
  await tower.evaluate(() => qa.runtime.setMuted(false));
  for (let i = 0; i < 12; i++) {
    const s = await scene(tower), speed = 185 + s.progress * 14, first = 270 / speed * 1000, interval = 540 / speed * 1000;
    let when = first; while (when < s.clock) when += interval;
    await tower.clock.runFor(Math.ceil(when - s.clock)); await tower.mouse.click(480, 320); await tower.clock.runFor(450);
    assert.equal((await scene(tower)).progress, i + 1, `mouse floor ${i + 1}`); if (i === 5) await shot(tower, "stack-six");
  }
  assert.equal((await scene(tower)).phase, "won"); assert.ok(await tower.evaluate(() => qa.audio > 0)); await shot(tower, "stack-win");
  await stopProof(tower); report.stackMouseWin = true; await tower.close();

  const press = await browser.newPage({ viewport: { width: 1152, height: 648 } }); await setup(press, "press-run"); await shot(press, "press-start");
  const probe = createPressWorld(), route = crossPresses(probe); probe.destroy(); let elapsed = 0;
  await press.mouse.move(330, 410);
  for (const input of route) {
    const time = Math.round(input.t * 1000 / 120); await press.clock.runFor(Math.max(0, time - elapsed)); elapsed = time;
    if (input.down) await press.mouse.down(); else await press.mouse.up();
  }
  await press.clock.runFor(2000); await press.mouse.up(); assert.equal((await scene(press)).phase, "won"); assert.equal(await press.evaluate(() => qa.audio), 0); await shot(press, "press-win");
  await stopProof(press); report.pressMouseWinMuted = true; await press.close();

  const swing = await browser.newPage({ viewport: { width: 1152, height: 648 } }); await setup(swing, "swing-post"); await shot(swing, "swing-start");
  report.swingDeliveries = 0;
  for (let round = 0; round < 8; round++) {
    const s = await scene(swing), pick = solveSwing(await swing.evaluate(() => qa.world.checkpoint()));
    // Align to the next full swing cycle if the browser has already passed this release.
    const period = 2050 - round * 38; let target = pick.ticks * 1000 / 120;
    while (target < s.roundTime) target += period;
    await swing.mouse.move(400, 320); await swing.mouse.down(); await swing.clock.runFor(Math.max(0, Math.floor(target - s.roundTime - 24)));
    for (let t = 0; t < 50 && (await scene(swing)).roundTime + .01 < target; t++) await swing.clock.runFor(1);
    await swing.mouse.up();
    for (let t = 0; t < 110 && (await scene(swing)).mode === "flight"; t++) await swing.clock.runFor(16);
    assert.equal((await scene(swing)).progress, round + 1, `mouse postal delivery ${round + 1}: ${JSON.stringify(await scene(swing))}`);
    report.swingDeliveries++; await shot(swing, `swing-delivery-${round + 1}`);
    if (round < 7) { for (let i = 0; i < 50 && (await scene(swing)).mode === "delivered"; i++) await swing.clock.runFor(16); }
  }
  await stopProof(swing); await swing.close();

  for (const id of ["sky-stack", "press-run", "swing-post"]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: "reduce" }), mobile = await context.newPage(); await setup(mobile, id); await mobile.evaluate(() => qa.runtime.setReduced(true));
    const touch = await context.newCDPSession(mobile), p = { x: 160, y: 130, id: 1 };
    if (id === "sky-stack") await mobile.clock.runFor(1460);
    await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p] }); await mobile.clock.runFor(id === "swing-post" ? 525 : 90);
    await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    if (id === "press-run") { const x = (await scene(mobile)).x; await mobile.clock.runFor(100); assert.equal((await scene(mobile)).x, x); assert.ok(x > 105); }
    else { await mobile.clock.runFor(450); for (let t = 0; t < 70 && (await scene(mobile)).mode === "flight"; t++) await mobile.clock.runFor(16); assert.equal((await scene(mobile)).progress, 1, `${id} touch: ${JSON.stringify(await scene(mobile))}`); }
    assert.equal(await mobile.evaluate(() => qa.audio), 0); await shot(mobile, `${id}-touch`); await stopProof(mobile); await context.close(); report[`${id}TouchReduced`] = true;

    const app = await browser.newPage({ viewport: { width: 1440, height: 1000 } }), requests = []; app.on("pageerror", e => errors.push(e.message)); app.on("request", r => requests.push(r.url())); await app.goto(`${origin}/codex-stage?game=${id}`);
    await app.waitForFunction(id => document.querySelector(`.game-tile[data-game="${id}"]`)?.getAttribute("aria-pressed") === "true" || document.querySelector("#game-title")?.textContent === ({ "sky-stack": "叠到天上", "press-run": "别被夹扁", "swing-post": "松手邮局" }[id]), id);
    await app.waitForTimeout(150); assert.equal(await app.locator("#ability").isVisible(), false); assert.equal(await app.locator(".level-strip").isVisible(), false);
    await app.locator("#expand-stage").click(); await app.screenshot({ path: new URL(`${id}-app.png`, output).pathname }); await app.keyboard.press("Escape");
    await app.locator("#stop").click(); const cp = await app.evaluate(id => JSON.parse(localStorage.getItem(`agent-stage:checkpoint:v1:${id}`)), id); assert.equal(cp.id, id);
    await app.reload(); await app.waitForTimeout(250); await app.setViewportSize({ width: 390, height: 844 }); await app.locator("canvas").scrollIntoViewIfNeeded(); assert.equal(await app.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await app.screenshot({ path: new URL(`${id}-mobile-app.png`, output).pathname }); assert.ok(!requests.some(u => /^https?:/.test(u) && !u.startsWith(origin))); await app.close(); report[`${id}PackOffline`] = true;
  }

  const dock = await browser.newPage({ viewport: { width: 1100, height: 850 } }); dock.on("pageerror", e => errors.push(e.message)); await dock.goto(`${origin}/apps/codex-stage/studio/one-button-catalog.js`);
  await dock.setContent('<div id="shell" style="width:220px">Codex shell fixture</div><div id="dream-skin">Theme fixture</div>'); await dock.evaluate(createCodexStageInjectorSource({ lazy: true }));
  for (const id of ["sky-stack", "press-run", "swing-post"]) {
    await dock.evaluate(id => { const s = document.querySelector("agent-stage-dock").shadowRoot.querySelector("[data-game]"); s.value = id; s.dispatchEvent(new Event("change")); window.__AGENT_STAGE_CODEX_DOCK__.dispatch({ type: "turn.started", runId: id, spanId: id, operation: { family: "turn" } }); }, id);
    for (const request of await dock.evaluate(() => window.__AGENT_STAGE_CODEX_DOCK__.pendingPacks())) { const pack = buildReviewedPack(request.id); await dock.evaluate(`window.__AGENT_STAGE_CODEX_DOCK__.acceptPack(${request.request}, ${JSON.stringify(request.id)}, ${pack.factory})`); }
    await dock.waitForFunction(id => window.__AGENT_STAGE_CODEX_DOCK__.snapshot()?.id === id, id); assert.equal(await dock.locator('[data-action="boost"]').isVisible(), false);
    await dock.locator("agent-stage-dock canvas").focus(); await dock.keyboard.down("Space"); await dock.waitForTimeout(180); await dock.keyboard.up("Space");
    await dock.screenshot({ path: new URL(`${id}-dock.png`, output).pathname }); await dock.evaluate(id => window.__AGENT_STAGE_CODEX_DOCK__.dispatch({ type: "turn.completed", runId: id, operation: { family: "turn" } }), id);
    const snap = await dock.evaluate(() => window.__AGENT_STAGE_CODEX_DOCK__.snapshot()); assert.equal(snap.active, false); await dock.waitForTimeout(100); assert.deepEqual(await dock.evaluate(() => window.__AGENT_STAGE_CODEX_DOCK__.snapshot()), snap);
  }
  await dock.evaluate(() => window.__AGENT_STAGE_CODEX_DOCK__.cleanup()); assert.equal(await dock.locator("#shell").evaluate(e => e.offsetWidth), 220); await dock.close(); report.mockDock = true;
  assert.deepEqual(errors, []); console.log(JSON.stringify(report));
} finally { await browser.close(); await writeFile(new URL("report.json", output), JSON.stringify({ ...report, errors }, null, 2)); }
