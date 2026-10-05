import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createCodexStageInjectorSource } from "../packages/codex-stage/src/injector.js";
import { GAME_CATALOG } from "../apps/codex-stage/collection/catalog.js";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const origin = process.env.STAGE_ORIGIN || "http://127.0.0.1:4175", out = new URL("../output/dice-qa/", import.meta.url), errors = [], report = {};
await mkdir(out, { recursive: true });
const replaySource = await readFile(new URL("./dice-replays.mjs", import.meta.url), "utf8");
async function setup(page, fallback = false) {
  page.on("pageerror", e => errors.push(e.message));
  await page.route("**/tools/dice-replays.mjs", route => route.fulfill({ contentType: "text/javascript", body: replaySource }));
  await page.goto(`${origin}/apps/codex-stage/studio/dice-catalog.js`);
  await page.clock.install({ time: new Date("2026-09-20T00:00:00Z") }); await page.clock.pauseAt(new Date("2026-09-20T00:00:01Z"));
  await page.evaluate(async fallback => {
    document.body.replaceChildren(); document.body.style.cssText = "margin:0;background:#20252a";
    const meta = document.createElement("meta"); meta.name = "viewport"; meta.content = "width=device-width,initial-scale=1"; document.head.append(meta);
    const canvas = document.createElement("canvas"); canvas.tabIndex = 0; canvas.style.cssText = "display:block;width:100vw;aspect-ratio:16/9;touch-action:none"; document.body.append(canvas);
    window.qa = { audio: 0, stoppedVoices: 0 };
    for (const Proto of [OscillatorNode, AudioBufferSourceNode]) { const start = Proto.prototype.start, stop = Proto.prototype.stop; Proto.prototype.start = function (...args) { qa.audio++; return start.apply(this, args); }; Proto.prototype.stop = function (...args) { qa.stoppedVoices++; return stop.apply(this, args); }; }
    if (fallback) { const { STUDIO_ART } = await import("/apps/codex-stage/studio/assets.js"); STUDIO_ART["dice-foundry"] = "data:image/webp;base64,broken"; }
    const { STUDIO_PACKS } = await import("/apps/codex-stage/studio/registry.js"), { DICE_CATALOG } = await import("/apps/codex-stage/studio/dice-catalog.js"), { createStudioRuntime } = await import("/apps/codex-stage/studio/runtime.js"), pack = STUDIO_PACKS["dice-foundry"];
    const { chooseDiceOrder, chooseDiceUpgrade } = await import("/tools/dice-replays.mjs"); Object.assign(qa, { chooseDiceOrder, chooseDiceUpgrade });
    qa.runtime = createStudioRuntime(canvas, DICE_CATALOG[0], options => qa.world = pack.create(options), pack.paint, {}, (...args) => qa.painter = pack.createPainter(...args));
    qa.runtime.start(); await qa.painter.ready; qa.painter.draw(qa.world);
  }, fallback); await page.clock.runFor(50);
}
async function coords(page, x, y) { const b = await page.locator("canvas").boundingBox(); return { x: b.x + x * b.width / 960, y: b.y + y * b.height / 540 }; }
async function click(page, x, y) { const p = await coords(page, x, y); await page.mouse.click(p.x, p.y); }
async function drag(page, from, to) { const a = await coords(page, ...from), b = await coords(page, ...to); await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(b.x, b.y, { steps: 5 }); await page.mouse.up(); }
const commit = page => click(page, 860, 504), png = page => page.locator("canvas").evaluate(c => c.toDataURL());
async function pixels(page) { return page.locator("canvas").evaluate(canvas => { const d = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data, colors = new Set(); let alpha = 0; for (let i = 0; i < d.length; i += 32) { colors.add(`${d[i]},${d[i + 1]},${d[i + 2]}`); if (d[i + 3]) alpha++; } return { colors: colors.size, opaque: alpha / (d.length / 32) }; }); }
async function arrange(page) {
  const choices = await page.evaluate(() => { const s = qa.world.scene; return s.roll.map((r, d) => { const face = s.decks[d][r], keep = [3, 4, 8, 11].includes(face) || r >= 3 && face !== 1 || face === 1 && s.stats.energy < 6; return { d, keep, change: keep !== s.held[d] }; }); });
  for (const v of choices) if (v.change) await click(page, 323 + v.d * 210, 253);
  if (choices.some(v => !v.keep) && await page.evaluate(() => qa.world.scene.rerolls)) { await click(page, 713, 504); await page.clock.runFor(700); }
  const order = await page.evaluate(() => qa.chooseDiceOrder(qa.world));
  for (let slot = 0; slot < 3; slot++) await drag(page, [270 + order[slot] * 210, 266], [242 + slot * 238, 403]);
  assert.deepEqual(await page.evaluate(() => qa.world.scene.slots), order); return page.evaluate(() => qa.world.forecast().final);
}
try {
  const shell = await browser.newPage(); await shell.goto(`${origin}/apps/codex-stage/studio/dice-catalog.js`);
  await shell.setContent("<main>Shell fixture</main>"); await shell.evaluate(createCodexStageInjectorSource({ lazy: true }));
  const picker = shell.locator("agent-stage-dock [data-game]"); await picker.selectOption("dice-foundry", { force: true });
  assert.equal(await shell.locator("agent-stage-dock [data-level]").evaluate(e => e.hidden), true);
  await picker.selectOption("rainline", { force: true }); assert.equal(await shell.locator("agent-stage-dock [data-level]").evaluate(e => e.hidden), false);
  const previews = GAME_CATALOG.filter(g => g.release === "preview").length;
  assert.equal(await shell.locator("agent-stage-dock .brand small").textContent(), `ARCADE / ${GAME_CATALOG.length - previews} + ${previews}`);
  await shell.evaluate(() => window.__AGENT_STAGE_CODEX_DOCK__.cleanup()); await shell.close(); report.dockControls = true;
  const page = await browser.newPage({ viewport: { width: 1440, height: 810 } }); await setup(page);
  report.pixels = await pixels(page); assert.ok(report.pixels.colors > 500); assert.equal(report.pixels.opaque, 1); assert.equal(await page.evaluate(() => qa.painter.diagnostics.assetLoaded), true);
  await page.screenshot({ path: new URL("dice-start.png", out).pathname }); await commit(page); await page.clock.runFor(120);
  const moving = await png(page); await page.clock.runFor(100); assert.notEqual(await png(page), moving);
  await page.evaluate(() => qa.runtime.stop()); const stopped = await page.evaluate(() => ({ cp: qa.world.checkpoint(), audio: qa.audio, png: document.querySelector("canvas").toDataURL() }));
  await page.clock.runFor(1000); await commit(page); await page.keyboard.press("Space"); assert.deepEqual(await page.evaluate(() => ({ cp: qa.world.checkpoint(), audio: qa.audio, png: document.querySelector("canvas").toDataURL() })), stopped);
  await page.evaluate(() => { qa.runtime.restoreCheckpoint(qa.world.checkpoint()); qa.runtime.start(); }); await page.clock.runFor(700);
  assert.deepEqual(await page.evaluate(() => qa.world.scene.roll), stopped.cp.roll); report.rollResume = true;
  const expected = await arrange(page); await page.clock.runFor(50); await page.screenshot({ path: new URL("dice-arranged.png", out).pathname });
  await commit(page); await page.clock.runFor(890); await page.screenshot({ path: new URL("dice-impact.png", out).pathname });
  await page.evaluate(() => qa.runtime.setPaused(true)); const paused = await page.evaluate(() => qa.world.checkpoint()); await page.clock.runFor(500); assert.deepEqual(await page.evaluate(() => qa.world.checkpoint()), paused);
  await page.evaluate(() => { qa.runtime.setPaused(false); qa.runtime.stop(); qa.runtime.restoreCheckpoint(qa.world.checkpoint()); qa.runtime.start(); }); await page.clock.runFor(1800);
  assert.deepEqual(await page.evaluate(() => qa.world.scene.stats), expected); assert.equal(await page.evaluate(() => qa.audio), 0); report.resolutionResume = true;
  await page.evaluate(() => qa.runtime.setMuted(false));
  let rounds = 1, upgrades = 0; const seen = new Set([0]);
  for (let guard = 0; guard < 70; guard++) {
    const mode = await page.evaluate(() => qa.world.scene.mode); if (["clear", "lost"].includes(mode)) break;
    if (mode === "ready") { await commit(page); await page.clock.runFor(700); }
    if (await page.evaluate(() => qa.world.scene.mode === "plan")) {
      const next = await arrange(page); await commit(page); await page.clock.runFor(2450);
      assert.deepEqual(await page.evaluate(() => qa.world.scene.stats), next); seen.add(await page.evaluate(() => qa.world.scene.level)); rounds++;
    }
    if (await page.evaluate(() => qa.world.scene.mode === "reward")) {
      const u = await page.evaluate(() => qa.chooseDiceUpgrade(qa.world)); await click(page, 250 + u.offer * 210, 250); await page.clock.runFor(50);
      if (!upgrades) await page.screenshot({ path: new URL("dice-workshop.png", out).pathname });
      await click(page, 310 + u.face * 66, 341 + u.die * 48); assert.equal(await page.evaluate(() => qa.world.scene.mode), "between");
      if (!upgrades) { const installed = await page.evaluate(() => qa.world.scene.decks); await click(page, 713, 504); assert.equal(await page.evaluate(() => qa.world.scene.mode), "reward"); await click(page, 310 + u.face * 66, 341 + u.die * 48); assert.deepEqual(await page.evaluate(() => qa.world.scene.decks), installed); await page.clock.runFor(50); await page.screenshot({ path: new URL("dice-installed.png", out).pathname }); }
      await commit(page); upgrades++;
    }
  }
  assert.equal(await page.evaluate(() => qa.world.scene.phase), "won"); assert.equal(seen.size, 6); assert.equal(upgrades, 5); assert.ok(await page.evaluate(() => qa.audio) > 0);
  report.campaign = { encounters: seen.size, rounds, upgrades, audio: true, legalPointerInput: true };
  await page.clock.runFor(50); await page.screenshot({ path: new URL("dice-victory.png", out).pathname });
  const voices = await page.evaluate(() => qa.stoppedVoices); await page.evaluate(() => qa.runtime.stop()); assert.ok(await page.evaluate(() => qa.stoppedVoices) >= voices);
  await page.evaluate(() => qa.runtime.destroy()); assert.equal(await page.evaluate(() => qa.painter.diagnostics.contexts), 0); await page.close();

  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  const mobile = await context.newPage(); await setup(mobile); await mobile.evaluate(() => qa.runtime.setReduced(true));
  const start = await coords(mobile, 860, 504); await mobile.touchscreen.tap(start.x, start.y); await mobile.clock.runFor(700);
  const session = await context.newCDPSession(mobile);
  for (let d = 0; d < 3; d++) { const a = await coords(mobile, 270 + 210 * d, 266), b = await coords(mobile, 242 + 238 * d, 403); await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...a, id: 1 }] }); await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...b, id: 1 }] }); await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); }
  assert.deepEqual(await mobile.evaluate(() => qa.world.scene.slots), [0, 1, 2]); const next = await mobile.evaluate(() => qa.world.forecast().final);
  await mobile.clock.runFor(50); await mobile.screenshot({ path: new URL("dice-touch.png", out).pathname }); await mobile.touchscreen.tap(start.x, start.y); await mobile.clock.runFor(2450);
  assert.deepEqual(await mobile.evaluate(() => qa.world.scene.stats), next); report.mobile = await pixels(mobile); await mobile.evaluate(() => qa.runtime.destroy()); await context.close();

  const fallback = await browser.newPage(); await setup(fallback, true); assert.equal(await fallback.evaluate(() => qa.painter.diagnostics.assetLoaded), false);
  await fallback.locator("canvas").focus(); await fallback.keyboard.press("Space"); await fallback.clock.runFor(700);
  for (const key of ["1", "4", "2", "5", "3", "6", "l"]) await fallback.keyboard.press(key);
  assert.deepEqual(await fallback.evaluate(() => qa.world.scene.slots), [0, 1, 2]); assert.equal(await fallback.evaluate(() => qa.world.scene.held[2]), true);
  await fallback.keyboard.press("Space"); await fallback.clock.runFor(2450); assert.notEqual(await fallback.evaluate(() => qa.world.scene.mode), "resolve"); report.fallback = report.keyboard = true; await fallback.evaluate(() => qa.runtime.destroy()); await fallback.close();

  const app = await browser.newPage({ viewport: { width: 1440, height: 1050 } }), requests = [];
  app.on("pageerror", e => errors.push(e.message)); app.on("request", r => requests.push(r.url()));
  await app.goto(`${origin}/codex-stage?game=dice-foundry`); await app.waitForFunction(() => document.querySelector("#fire")?.textContent === "投骰");
  assert.equal(await app.locator("#game-title").textContent(), "骰子改装厂"); assert.match(await app.locator("canvas").getAttribute("aria-label"), /改装|骰/);
  await app.locator("#fire").click(); await app.waitForTimeout(850); await drag(app, [270, 266], [242, 403]); await app.locator("#stop").click();
  const saved = await app.evaluate(() => JSON.parse(localStorage.getItem("agent-stage:checkpoint:v1:dice-foundry"))); assert.equal(saved.mode, "plan"); assert.equal(saved.slots[0], 0);
  await app.reload(); await app.waitForFunction(() => document.querySelector("#stage-live")?.textContent.includes("1/3"));
  await app.screenshot({ path: new URL("dice-app.png", out).pathname }); await app.locator("#expand-stage").click(); await app.screenshot({ path: new URL("dice-expanded.png", out).pathname }); await app.keyboard.press("Escape");
  await app.setViewportSize({ width: 390, height: 844 }); await app.locator("canvas").scrollIntoViewIfNeeded(); await app.screenshot({ path: new URL("dice-app-mobile.png", out).pathname }); assert.equal(await app.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.ok(requests.some(u => u.endsWith("/packs/built/dice-foundry.js"))); assert.ok(!requests.some(u => /^https?:/.test(u) && !u.startsWith(origin)));
  report.app = { offline: true, save: true, reload: true, accessibleText: true, noOverflow: true }; await app.close(); assert.deepEqual(errors, []); console.log(JSON.stringify(report));
} finally { await browser.close(); await writeFile(new URL("report.json", out), JSON.stringify({ ...report, errors }, null, 2)); }
