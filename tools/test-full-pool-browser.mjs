import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { STANDALONE_CATALOG } from "../apps/codex-stage/collection/standalone-catalog.js";
import { createCodexStageDaemon } from "../packages/codex-stage/src/daemon.js";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const token = "b".repeat(48), daemon = createCodexStageDaemon({ token });
const { port } = await daemon.start({ port: 0 });
const endpoint = `http://127.0.0.1:${port}`, origin = process.env.STAGE_ORIGIN || "http://127.0.0.1:4180";
const out = new URL("../output/full-pool-qa/", import.meta.url).pathname;
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", args: ["--enable-unsafe-swiftshader"] });
const errors = [], results = [];
const hash = data => createHash("sha256").update(data).digest("hex");
try {
  for (const game of STANDALONE_CATALOG) {
    const context = await browser.newContext({ viewport: { width: 400, height: Math.round(game.canvasHeight / 2.4) } });
    const page = await context.newPage();
    page.on("pageerror", e => errors.push([game.id, e.message]));
    const post = async event => {
      const response = await fetch(`${endpoint}/v1/hooks`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ hook_event_name: event, session_id: "full-pool-qa", turn_id: game.id, prompt: "PRIVATE NEVER FORWARD" }) });
      assert.equal(response.status, 202);
    };
    await post("UserPromptSubmit");
    await page.goto(`${origin}/codex-stage?popup=1&game=${game.id}#${new URLSearchParams({ token, daemon: endpoint })}`);
    const outer = page.locator("iframe.standalone-game");
    await outer.waitFor();
    await page.waitForFunction(name => {
      const p = document.querySelector("iframe.standalone-game")?.contentWindow?.[name];
      const s = p?.state(); return s === "playing" || s?.active;
    }, game.pilot, { timeout: 60000 });
    await page.waitForTimeout(700);
    const frame = await (await outer.elementHandle()).contentFrame();
    assert.equal(await frame.locator("header").isVisible(), false);
    assert.equal(await frame.locator("footer").isVisible(), false);
    assert.equal(await outer.getAttribute("src"), game.entry);
    assert.equal(await frame.evaluate(() => location.hash), "");
    const box = await outer.boundingBox();
    assert.ok(Math.abs(box.width - 400) < 1 && box.x < 1 && box.y < 1);
    // Keep a reference after removal to prove stop/destroy ran, not just CSS hiding.
    await page.evaluate(name => { window.qaGame = document.querySelector("iframe.standalone-game").contentWindow[name]; }, game.pilot);
    if (game.id === "cart-downhill") await frame.locator("#drive").click();
    if (["last-beacon", "grab-go"].includes(game.id)) await frame.locator(game.id === "last-beacon" ? "#enter" : "#continue").click();
    const playingFrame = game.id === "godot-junk" ? await (await frame.locator("iframe").elementHandle()).contentFrame() : frame;
    const gameCanvas = playingFrame.locator("canvas").first();
    if (game.id !== "godot-junk") {
      const dimensions = await gameCanvas.evaluate(c => ({ width: c.width, logical: c.getBoundingClientRect().width, scale: Number(document.documentElement.dataset.stageRenderScale) }));
      assert.ok(dimensions.scale > 0 && dimensions.scale <= 400 / 960 + .001);
      assert.ok(dimensions.width <= 802, `${game.id} must not render a desktop-sized buffer in a 400px popup`);
    }
    const canvasBox = await gameCanvas.boundingBox();
    const before = hash(await page.screenshot());
    await page.mouse.move(canvasBox.x + canvasBox.width * .55, canvasBox.y + canvasBox.height * .6);
    await page.mouse.down(); await page.waitForTimeout(500); await page.mouse.up();
    await page.waitForTimeout(450);
    const shot = await page.screenshot({ path: `${out}${game.id}.png` });
    assert.notEqual(hash(shot), before, `${game.id} responds and renders`);
    if (game.id === "cart-downhill" && process.env.UPDATE_GAME_COVERS === "1") {
      await mkdir(new URL("../apps/codex-stage/standalone/covers/", import.meta.url), { recursive: true });
      await page.screenshot({ path: new URL("../apps/codex-stage/standalone/covers/cart-downhill.png", import.meta.url).pathname });
    }
    await post("Stop");
    await outer.waitFor({ state: "detached" });
    const stopped = await page.evaluate(() => window.qaGame.state());
    assert.ok(stopped === "stopped" || stopped.disposed && !stopped.rendering && stopped.voices === 0);
    await page.waitForTimeout(300);
    assert.equal(await page.locator("iframe").count(), 0);
    await post("UserPromptSubmit");
    await outer.waitFor();
    await page.waitForFunction(name => {
      const p = document.querySelector("iframe.standalone-game")?.contentWindow?.[name];
      const s = p?.state(); return s === "playing" || s?.active;
    }, game.pilot, { timeout: 60000 });
    const again = await (await outer.elementHandle()).contentFrame();
    const target = game.id === "godot-junk" ? await (await again.locator("iframe").elementHandle()).contentFrame() : again;
    await target.locator("canvas").first().focus();
    await page.keyboard.press("Escape");
    await outer.waitFor({ state: "detached" });
    assert.equal(await page.evaluate(() => document.documentElement.dataset.stageDismissSerial), "1");
    await post("Stop");
    // A task ending during page/engine boot must also tear down its frame.
    await post("UserPromptSubmit");
    await outer.waitFor();
    await post("Interrupt");
    await outer.waitFor({ state: "detached" });
    await page.waitForTimeout(300);
    assert.equal(await page.locator("iframe").count(), 0);
    results.push({ id: game.id, loaded: true, pointerInput: true, stopped, gameOnly: true, escapeDismiss: true, bootInterrupt: true });
    await context.close();
  }
  // The native popup ignores a previous manually pinned browser preference.
  const page = await browser.newPage();
  await page.addInitScript(() => localStorage.setItem("agent-stage-arcade-settings", JSON.stringify({ game: "toast-hop", mode: "game" })));
  await page.goto(`${origin}/codex-stage?popup=1`);
  assert.equal(await page.locator("#random").isChecked(), true);
  await page.close();
  assert.deepEqual(errors, []);
  await writeFile(`${out}report.json`, JSON.stringify({ results, errors, syntheticHooks: true }, null, 2));
  console.log(JSON.stringify({ games: results.length, errors, results }));
} finally { await browser.close(); await daemon.stop(); }
