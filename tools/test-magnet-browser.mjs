import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { magnetTarget } from "./magnet-replays.mjs";
import { buildReviewedPack } from "../apps/codex-stage/packs/build.js";
import { createCodexStageInjectorSource } from "../packages/codex-stage/src/injector.js";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const origin = process.env.STAGE_ORIGIN || "http://127.0.0.1:4177", out = new URL("../output/magnet-qa/", import.meta.url), errors = [], report = {};
await mkdir(out, { recursive: true });
async function setup(page, fallback = false) {
  page.on("pageerror", e => errors.push(e.message)); await page.goto(`${origin}/apps/codex-stage/studio/magnet-catalog.js`);
  await page.clock.install({ time: new Date("2026-09-29T00:00:00Z") }); await page.clock.pauseAt(new Date("2026-09-29T00:00:01Z"));
  await page.evaluate(async fallback => {
    document.body.replaceChildren(); document.body.style.cssText = "margin:0;background:#b8d9db";
    const meta = document.createElement("meta"); meta.name = "viewport"; meta.content = "width=device-width,initial-scale=1"; document.head.append(meta);
    const canvas = document.createElement("canvas"); canvas.tabIndex = 0; canvas.style.cssText = "display:block;width:100vw;aspect-ratio:16/9;touch-action:none"; document.body.append(canvas);
    if (fallback) { const get = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type.startsWith("webgl") ? null : get.call(this, type, ...args); }; }
    window.qa = { audio: 0 }; const start = OscillatorNode.prototype.start; OscillatorNode.prototype.start = function(...args) { qa.audio++; return start.apply(this, args); };
    const { STUDIO_PACKS } = await import("/apps/codex-stage/studio/registry.js"), { MAGNET_CATALOG } = await import("/apps/codex-stage/studio/magnet-catalog.js"), { createStudioRuntime } = await import("/apps/codex-stage/studio/runtime.js"), p = STUDIO_PACKS["magnet-rampage"];
    qa.runtime = createStudioRuntime(canvas, MAGNET_CATALOG[0], o => qa.world = p.create(o), p.paint, {}, (...args) => qa.painter = p.createPainter(...args)); qa.runtime.start(); await qa.painter.ready;
  }, fallback); await page.clock.runFor(20);
}
const scene = page => page.evaluate(() => JSON.parse(JSON.stringify(qa.world.scene)));
const shot = (page, name) => page.locator("canvas").screenshot({ path: new URL(`${name}.png`, out).pathname });
async function move(page, world) {
  const p = await page.evaluate(w => qa.painter.projectWorld(w.x, w.y), world), r = await page.locator("canvas").boundingBox();
  return { x: r.x + Math.max(15, Math.min(945, p.x)) / 960 * r.width, y: r.y + Math.max(75, Math.min(515, p.y)) / 540 * r.height };
}
async function freeze(page) {
  await page.evaluate(() => qa.runtime.stop());
  const read = () => page.evaluate(() => ({ state: qa.world.scene, audio: qa.audio, cp: qa.runtime.checkpoint, pixels: document.querySelector("canvas").toDataURL() }));
  const before = await read(); await page.clock.runFor(500); await page.keyboard.press("ArrowRight"); await page.mouse.click(200, 180); assert.deepEqual(await read(), before);
}
try {
  const page = await browser.newPage({ viewport: { width: 1152, height: 648 }, deviceScaleFactor: 2 }); await setup(page); await shot(page, "start");
  assert.equal(await page.evaluate(() => qa.painter.diagnostics.renderer), "three-webgl2");
  assert.equal(await page.locator("canvas").evaluate(c => c.width), 2304);
  await page.evaluate(() => qa.runtime.setMuted(false)); const first = await move(page, { x: 280, y: 390 }); await page.mouse.click(first.x, first.y);
  const stages = new Set();
  for (let n = 0; n < 1000 && (await scene(page)).phase !== "won"; n++) {
    const s = await scene(page), target = magnetTarget(s); if (target) { const p = await move(page, target); await page.mouse.move(p.x, p.y); }
    await page.clock.runFor(240); if ([4, 16, 30].includes(n)) await shot(page, `growth-${n}`);
    if(!stages.has(s.mode)){stages.add(s.mode);await shot(page,`city-${s.mode}`);console.log(`Mouse route: ${s.mode}, ${Math.round(s.time/1000)}s`);}
  }
  const result = await scene(page); assert.equal(result.phase, "won", JSON.stringify({player:result.player,mode:result.mode,power:result.power})); assert.equal(result.delivered,true);assert.ok(stages.has("return")&&stages.has("recycle"));assert.ok(await page.evaluate(() => qa.audio > 0));
  await shot(page, "won"); const colors = await page.locator("canvas").evaluate(c => { const p = c.getContext("2d").getImageData(0, 0, c.width, c.height).data, colors = new Set(); for (let i = 0; i < p.length; i += 128) colors.add(`${p[i] >> 4},${p[i+1] >> 4},${p[i+2] >> 4}`); return colors.size; }); assert.ok(colors > 80);
  report.mouse = { time: result.time, collected: result.collected, hits: result.hits, trafficHits:result.trafficHits,busDrops:result.busDrops,stages:[...stages],colors, diagnostics: await page.evaluate(() => qa.painter.diagnostics) }; await freeze(page); await page.close();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: "reduce" }), touch = await ctx.newPage(); await setup(touch); await touch.evaluate(() => qa.runtime.setReduced(true));
  const session = await ctx.newCDPSession(touch), a = await move(touch, { x: 330, y: 390 });
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...a, id: 1 }] }); await touch.clock.runFor(1600);
  await session.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] }); const p = (await scene(touch)).player,cpTouch=await touch.evaluate(()=>qa.runtime.checkpoint);
  assert.equal(p.vx,0);await touch.clock.runFor(300);const settled=(await scene(touch)).player;assert.ok(Math.hypot(settled.x-p.x,settled.y-p.y)<25);assert.deepEqual(await touch.evaluate(()=>qa.runtime.checkpoint),cpTouch); assert.ok((await scene(touch)).collected > 0); assert.equal(await touch.evaluate(() => qa.audio), 0); await shot(touch, "touch-reduced"); await freeze(touch); await ctx.close(); report.touchMuteCancel = true;
  const fallback = await browser.newPage({ viewport: { width: 960, height: 540 } }); await setup(fallback, true); assert.equal(await fallback.evaluate(() => qa.painter.diagnostics.renderer), "canvas-fallback");
  await fallback.locator("canvas").focus(); await fallback.keyboard.down("ArrowRight"); await fallback.clock.runFor(1100); await fallback.keyboard.up("ArrowRight"); assert.ok((await scene(fallback)).collected > 0); await shot(fallback, "fallback"); await freeze(fallback); await fallback.close(); report.keyboardFallback = true;
  const app = await browser.newPage({ viewport: { width: 1440, height: 1000 } }), requests = []; app.on("pageerror", e => errors.push(e.message)); app.on("request", r => requests.push(r.url()));
  await app.goto(`${origin}/codex-stage?game=magnet-rampage`); await app.waitForFunction(() => document.querySelector("#game-title")?.textContent === "磁力暴走"); await app.locator("#stage-canvas").focus(); await app.keyboard.down("ArrowRight"); await app.waitForTimeout(1500); await app.keyboard.up("ArrowRight");
  assert.match(await app.locator("#stage-live").textContent(), /磁力/); await app.locator("#expand-stage").click(); await app.screenshot({ path: new URL("app.png", out).pathname }); await app.keyboard.press("Escape"); await app.locator("#stop").click();
  const cp = await app.evaluate(() => JSON.parse(localStorage.getItem("agent-stage:checkpoint:v1:magnet-rampage"))); assert.ok(cp.data.collected.length > 0);
  await app.reload(); await app.waitForTimeout(300); await app.setViewportSize({ width: 390, height: 844 }); await app.locator("#stage-canvas").scrollIntoViewIfNeeded(); assert.equal(await app.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true); await app.screenshot({ path: new URL("app-mobile.png", out).pathname });
  await app.context().setOffline(true); await app.locator("#demo").click(); await app.waitForTimeout(150); await app.locator("#stop").click(); assert.ok(!requests.some(u => /^https?:/.test(u) && !u.startsWith(origin))); await app.close(); report.offlineSave = true;
  const dock = await browser.newPage({ viewport: { width: 1100, height: 850 } }); dock.on("pageerror", e => errors.push(e.message)); await dock.goto(`${origin}/apps/codex-stage/studio/magnet-catalog.js`);
  await dock.setContent('<div id="shell" style="width:220px">Codex shell fixture</div><div id="dream-skin">Theme fixture</div>'); await dock.evaluate(createCodexStageInjectorSource({ lazy: true }));
  await dock.evaluate(() => { const s = document.querySelector("agent-stage-dock").shadowRoot.querySelector("[data-game]"); s.value = "magnet-rampage"; s.dispatchEvent(new Event("change")); window.__AGENT_STAGE_CODEX_DOCK__.dispatch({ type: "turn.started", runId: "magnet", spanId: "magnet", operation: { family: "turn" } }); });
  for (const r of await dock.evaluate(() => window.__AGENT_STAGE_CODEX_DOCK__.pendingPacks())) { const p = buildReviewedPack(r.id); await dock.evaluate(`window.__AGENT_STAGE_CODEX_DOCK__.acceptPack(${r.request},${JSON.stringify(r.id)},${p.factory})`); }
  await dock.waitForFunction(() => window.__AGENT_STAGE_CODEX_DOCK__.snapshot()?.id === "magnet-rampage"); await dock.locator("agent-stage-dock canvas").focus(); await dock.keyboard.down("ArrowRight"); await dock.waitForTimeout(1600); await dock.keyboard.up("ArrowRight");
  assert.ok((await dock.evaluate(() => window.__AGENT_STAGE_CODEX_DOCK__.snapshot())).collected > 0); await dock.screenshot({ path: new URL("dock.png", out).pathname });
  await dock.evaluate(() => window.__AGENT_STAGE_CODEX_DOCK__.dispatch({ type: "turn.completed", runId: "magnet", operation: { family: "turn" } }));
  const state = await dock.evaluate(() => window.__AGENT_STAGE_CODEX_DOCK__.snapshot()), pixels = await dock.locator("agent-stage-dock canvas").evaluate(c => c.toDataURL()); await dock.waitForTimeout(200); assert.equal(state.active, false); assert.deepEqual(await dock.evaluate(() => window.__AGENT_STAGE_CODEX_DOCK__.snapshot()), state); assert.equal(await dock.locator("agent-stage-dock canvas").evaluate(c => c.toDataURL()), pixels);
  await dock.evaluate(() => window.__AGENT_STAGE_CODEX_DOCK__.cleanup()); assert.equal(await dock.locator("#shell").evaluate(e => e.offsetWidth), 220); assert.equal(await dock.locator("#dream-skin").textContent(), "Theme fixture"); await dock.close(); report.mockDock = true;
  assert.deepEqual(errors, []); console.log(JSON.stringify(report));
} finally { await browser.close(); await writeFile(new URL("report.json", out), JSON.stringify({ ...report, errors }, null, 2)); }
