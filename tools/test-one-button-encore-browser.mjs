import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { pinAim, solveBrake } from "./one-button-encore-replays.mjs";
import { createCodexStageInjectorSource } from "../packages/codex-stage/src/injector.js";
import { buildReviewedPack } from "../apps/codex-stage/packs/build.js";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const origin = process.env.STAGE_ORIGIN || "http://127.0.0.1:4176", output = new URL("../output/one-button-encore-qa/", import.meta.url), errors = [], report = {};
const titles = { "bridge-span": "桥就这么长", "orbit-pins": "见缝插签", "last-stop": "最后一厘米", "gravity-shift": "地板辞职了" }, ids = Object.keys(titles);
await mkdir(output, { recursive: true });
async function setup(page, id) {
  page.on("pageerror", e => errors.push(e.message)); await page.goto(`${origin}/apps/codex-stage/studio/encore-catalog.js`);
  await page.clock.install({ time: new Date("2026-09-28T00:00:00Z") }); await page.clock.pauseAt(new Date("2026-09-28T00:00:01Z"));
  await page.evaluate(async id => {
    document.body.replaceChildren(); document.body.style.cssText = "margin:0;background:#dcebe8";
    const meta = document.createElement("meta"); meta.name = "viewport"; meta.content = "width=device-width,initial-scale=1"; document.head.append(meta);
    const canvas = document.createElement("canvas"); canvas.tabIndex = 0; canvas.style.cssText = "display:block;width:100vw;aspect-ratio:16/9;touch-action:none"; document.body.append(canvas);
    window.qa = { audio: 0 }; const start = OscillatorNode.prototype.start; OscillatorNode.prototype.start = function (...args) { qa.audio++; return start.apply(this, args); };
    const { STUDIO_PACKS } = await import("/apps/codex-stage/studio/registry.js"), { ENCORE_CATALOG } = await import("/apps/codex-stage/studio/encore-catalog.js"), { createStudioRuntime } = await import("/apps/codex-stage/studio/runtime.js"), p = STUDIO_PACKS[id];
    qa.runtime = createStudioRuntime(canvas, ENCORE_CATALOG.find(p => p.id === id), o => qa.world = p.create(o), p.paint, {}, (...args) => qa.painter = p.createPainter(...args)); qa.runtime.start(); await qa.painter.ready;
  }, id);
}
const scene = page => page.evaluate(() => JSON.parse(JSON.stringify(qa.world.scene)));
const shot = (page, name) => page.locator("canvas").screenshot({ path: new URL(`${name}.png`, output).pathname });
async function until(page, predicate, max = 1000, ms = 16) {
  for (let i = 0; i < max; i++) { if (predicate(await scene(page))) return; await page.clock.runFor(ms); }
  throw new Error(`Timed out: ${JSON.stringify(await scene(page))}`);
}
async function stopProof(page) {
  await page.evaluate(() => qa.runtime.stop());
  const read = () => page.evaluate(() => ({ cp: qa.runtime.checkpoint, audio: qa.audio, image: document.querySelector("canvas").toDataURL() }));
  const before = await read(); await page.clock.runFor(950); await page.keyboard.press("Space"); await page.mouse.click(200, 200); assert.deepEqual(await read(), before);
}
try {
  for (const id of ids) {
    const page = await browser.newPage({ viewport: { width: 1152, height: 648 }, deviceScaleFactor: 2 }); await setup(page, id); await page.clock.runFor(20); await shot(page, `${id}-start`);
    assert.equal(await page.locator("canvas").evaluate(c => c.width), 2304);
    if (id === "orbit-pins") await page.evaluate(() => qa.runtime.setMuted(false));
    await page.mouse.move(330, 350);
    if (id === "bridge-span") {
      for (let n = 0; n < 10; n++) {
        const s = await scene(page), length = s.target.x + s.target.w / 2 - s.anchor;
        await page.mouse.down(); await page.clock.runFor(Math.max(0, Math.floor(length / .18 - 25))); await until(page, s => s.length >= length - .9, 80, 1); await page.mouse.up();
        await until(page, s => s.progress > n || s.deaths > 0, 200); assert.equal((await scene(page)).progress, n + 1, `bridge ${n + 1}`);
        if (n === 5) await shot(page, `${id}-middle`);
      }
    } else if (id === "orbit-pins") {
      for (let n = 0; n < 18; n++) {
        await until(page, s => s.mode === "ready" && pinAim(s).error <= Math.min(.02, pinAim(s).margin * .7), 1800, 8);
        await page.mouse.click(330, 350); await until(page, s => s.progress > n || s.deaths > 0, 40, 8);
        assert.equal((await scene(page)).progress, n + 1, `pin ${n + 1}`); if (n === 10) await shot(page, `${id}-middle`);
      }
      assert.ok(await page.evaluate(() => qa.audio > 0));
    } else if (id === "last-stop") {
      for (let n = 0; n < 8; n++) {
        await until(page, s => s.mode === "ready", 90); const pick = solveBrake(await page.evaluate(() => qa.world.checkpoint())), start = (await scene(page)).time;
        await page.mouse.down(); await page.clock.runFor(Math.max(0, Math.floor(pick.ticks * 1000 / 120 - 24)));
        await until(page, s => s.time - start + .01 >= pick.ticks * 1000 / 120, 70, 1); await page.mouse.up();
        await until(page, s => s.mode !== "braking", 600); assert.equal((await scene(page)).progress, n + 1, `park ${n + 1}: ${JSON.stringify(await scene(page))}`);
        if (n === 4) await shot(page, `${id}-middle`);
      }
    } else {
      await page.mouse.click(330, 350);
      for (let t = 0; t < 1600 && (await scene(page)).phase === "playing"; t++) {
        const s = await scene(page), target = s.columns[s.progress], desired = target?.ceiling ? 1 : -1;
        if (target && s.gravity !== desired) await page.mouse.click(330, 350);
        await page.clock.runFor(16); if (t === 370) await shot(page, `${id}-middle`);
      }
    }
    assert.equal((await scene(page)).phase, "won", `${id}: ${JSON.stringify(await scene(page))}`); assert.equal((await scene(page)).deaths, 0);
    if (id !== "orbit-pins") assert.equal(await page.evaluate(() => qa.audio), 0);
    await shot(page, `${id}-won`); await stopProof(page); report[`${id}MouseCampaign`] = true; await page.close();
  }
  for (const id of ids) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: "reduce" }), mobile = await context.newPage(); await setup(mobile, id); await mobile.evaluate(() => qa.runtime.setReduced(true));
    const touch = await context.newCDPSession(mobile), p = { x: 160, y: 130, id: 1 };
    if (id === "orbit-pins") await until(mobile, s => pinAim(s).error < .02, 1000, 8);
    await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p] });
    await mobile.clock.runFor(id === "bridge-span" ? 960 : id === "last-stop" ? 450 : 40);
    await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    if (id === "bridge-span") { await until(mobile, s => s.progress === 1 || s.deaths > 0, 160); assert.equal((await scene(mobile)).progress, 1); }
    if (id === "orbit-pins") { await mobile.clock.runFor(180); assert.equal((await scene(mobile)).progress, 1); }
    if (id === "last-stop") { const x = (await scene(mobile)).x; await mobile.clock.runFor(80); assert.ok((await scene(mobile)).x > x); }
    if (id === "gravity-shift") { await mobile.clock.runFor(150); assert.ok((await scene(mobile)).player.y < 400); }
    assert.equal(await mobile.evaluate(() => qa.audio), 0); await shot(mobile, `${id}-touch`); await stopProof(mobile); await context.close(); report[`${id}TouchReduced`] = true;

    const app = await browser.newPage({ viewport: { width: 1440, height: 1000 } }), requests = []; app.on("pageerror", e => errors.push(e.message)); app.on("request", r => requests.push(r.url())); await app.goto(`${origin}/codex-stage?game=${id}`);
    await app.waitForFunction(title => document.querySelector("#game-title")?.textContent === title, titles[id]); await app.waitForTimeout(150);
    assert.equal(await app.locator("#ability").isVisible(), false); assert.equal(await app.locator(".level-strip").isVisible(), false);
    await app.locator("#expand-stage").click(); await app.screenshot({ path: new URL(`${id}-app.png`, output).pathname }); await app.keyboard.press("Escape");
    await app.locator("#stage-canvas").focus(); await app.keyboard.down("Space"); await app.waitForTimeout(120); await app.keyboard.up("Space");
    assert.ok((await app.locator("#stage-live").textContent()).length > 0); await app.locator("#stop").click();
    const cp = await app.evaluate(id => JSON.parse(localStorage.getItem(`agent-stage:checkpoint:v1:${id}`)), id); assert.equal(cp.id, id);
    await app.reload(); await app.waitForTimeout(250); await app.setViewportSize({ width: 390, height: 844 }); await app.locator("canvas").scrollIntoViewIfNeeded(); assert.equal(await app.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await app.screenshot({ path: new URL(`${id}-mobile-app.png`, output).pathname }); assert.ok(!requests.some(u => /^https?:/.test(u) && !u.startsWith(origin)));
    await app.context().setOffline(true); await app.locator("#demo").click(); await app.waitForTimeout(100); await app.locator("#stop").click(); await app.close(); report[`${id}PackOfflineSave`] = true;
  }
  const dock = await browser.newPage({ viewport: { width: 1100, height: 850 } }); dock.on("pageerror", e => errors.push(e.message)); await dock.goto(`${origin}/apps/codex-stage/studio/encore-catalog.js`);
  await dock.setContent('<div id="shell" style="width:220px">Codex shell fixture</div><div id="dream-skin">Theme fixture</div>'); await dock.evaluate(createCodexStageInjectorSource({ lazy: true }));
  for (const id of ids) {
    await dock.evaluate(id => { const s = document.querySelector("agent-stage-dock").shadowRoot.querySelector("[data-game]"); s.value = id; s.dispatchEvent(new Event("change")); window.__AGENT_STAGE_CODEX_DOCK__.dispatch({ type: "turn.started", runId: id, spanId: id, operation: { family: "turn" } }); }, id);
    for (const r of await dock.evaluate(() => window.__AGENT_STAGE_CODEX_DOCK__.pendingPacks())) { const p = buildReviewedPack(r.id); await dock.evaluate(`window.__AGENT_STAGE_CODEX_DOCK__.acceptPack(${r.request}, ${JSON.stringify(r.id)}, ${p.factory})`); }
    await dock.waitForFunction(id => window.__AGENT_STAGE_CODEX_DOCK__.snapshot()?.id === id, id); assert.equal(await dock.locator('[data-action="boost"]').isVisible(), false);
    await dock.locator("agent-stage-dock canvas").focus(); await dock.keyboard.down("Space"); await dock.waitForTimeout(200); await dock.keyboard.up("Space"); await dock.screenshot({ path: new URL(`${id}-dock.png`, output).pathname });
    await dock.evaluate(id => window.__AGENT_STAGE_CODEX_DOCK__.dispatch({ type: "turn.completed", runId: id, operation: { family: "turn" } }), id);
    const snap = await dock.evaluate(() => window.__AGENT_STAGE_CODEX_DOCK__.snapshot()), pixels = await dock.locator("agent-stage-dock canvas").evaluate(c => c.toDataURL()); assert.equal(snap.active, false);
    await dock.waitForTimeout(150); assert.deepEqual(await dock.evaluate(() => window.__AGENT_STAGE_CODEX_DOCK__.snapshot()), snap); assert.equal(await dock.locator("agent-stage-dock canvas").evaluate(c => c.toDataURL()), pixels);
  }
  await dock.evaluate(() => window.__AGENT_STAGE_CODEX_DOCK__.cleanup()); assert.equal(await dock.locator("#shell").evaluate(e => e.offsetWidth), 220); assert.equal(await dock.locator("#dream-skin").textContent(), "Theme fixture"); await dock.close(); report.mockDock = true;
  assert.deepEqual(errors, []); console.log(JSON.stringify(report));
} finally { await browser.close(); await writeFile(new URL("report.json", output), JSON.stringify({ ...report, errors }, null, 2)); }
