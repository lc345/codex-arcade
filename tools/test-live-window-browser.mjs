import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { createCodexStageDaemon } from "../packages/codex-stage/src/daemon.js";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const token = "a".repeat(48), daemon = createCodexStageDaemon({ token });
const { port } = await daemon.start({ port: 0 });
const endpoint = `http://127.0.0.1:${port}`;
const origin = process.env.STAGE_ORIGIN || "http://127.0.0.1:4180";
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const out = new URL("../output/live-window-qa/", import.meta.url).pathname;
await mkdir(out, { recursive: true });
const errors = [], hash = buffer => createHash("sha256").update(buffer).digest("hex");
try {
  for (const { viewport, game } of [
    { viewport: { width: 400, height: 225 }, game: "toast-hop" },
    { viewport: { width: 320, height: 180 }, game: "toast-hop" },
    { viewport: { width: 400, height: 267 }, game: "return-fire" },
  ]) {
    const page = await browser.newPage({ viewport });
    page.on("pageerror", e => errors.push(e.message));
    const post = event => fetch(`${endpoint}/v1/hooks`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ hook_event_name: event, session_id: "browser-qa", turn_id: String(viewport.width), prompt: "PRIVATE NEVER DISPLAY" }) });
    await post("UserPromptSubmit");
    await page.goto(`${origin}/codex-stage?popup=1&game=${game}#${new URLSearchParams({ token, daemon: endpoint })}`);
    await page.waitForFunction(() => document.querySelector("#agent-status").textContent === "Agent 工作中" && !document.querySelector("#retry").disabled);
    await page.waitForTimeout(450);
    assert.equal(new URL(page.url()).hash, "");
    for (const selector of [".masthead", "#library-drawer", ".game-heading", ".game-bar", ".level-strip", ".bottom-bar"]) {
      assert.equal(await page.locator(selector).isHidden(), true, `${selector} must not appear in the game-only popup`);
    }
    assert.equal(await page.locator("#demo").isHidden(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal((await page.locator("body").textContent()).includes("PRIVATE"), false);
    const canvas = page.locator("canvas"), box = await canvas.boundingBox();
    assert.ok(box.x < 1 && box.y < 1 && Math.abs(box.width - viewport.width) < 1 && Math.abs(box.height - viewport.height) < 1, "canvas fills the compact window");
    assert.equal(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight), true);
    const ratio = await canvas.evaluate(c => c.width / c.height);
    assert.ok(Math.abs(box.width / box.height - ratio) < 0.01, "canvas is not stretched");
    const before = hash(await canvas.screenshot());
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down(); await page.waitForTimeout(240); await page.mouse.up();
    await page.waitForTimeout(200);
    assert.notEqual(hash(await canvas.screenshot()), before);
    await page.screenshot({ path: `${out}${game}-${viewport.width}.png` });
    await post("Stop");
    await page.waitForFunction(() => document.querySelector("#retry").disabled);
    await page.waitForTimeout(150);
    const frozen = hash(await canvas.screenshot());
    await page.mouse.click(box.x + 40, box.y + 40);
    await page.waitForTimeout(400);
    assert.equal(hash(await canvas.screenshot()), frozen);
    await post("UserPromptSubmit");
    await page.waitForFunction(() => !document.querySelector("#retry").disabled);
    await canvas.focus();
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => document.documentElement.dataset.stageDismissSerial), "1");
    await page.waitForFunction(() => document.querySelector("#retry").disabled);
    await post("Stop");
    await page.close();
  }
  const lab = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await lab.goto(`${origin}/codex-stage?game=toast-hop`);
  assert.equal(await lab.locator(".masthead").isVisible(), true);
  assert.equal(await lab.locator(".game-bar").isVisible(), true);
  await lab.close();
  assert.deepEqual(errors, []);
  const report = { lateStart: true, mouseInput: true, taskEndFrozen: true, gameOnly: true, aspectRatio: true, escapeDismiss: true, fullLabPreserved: true, errors, syntheticHooks: true };
  await writeFile(`${out}report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally { await browser.close(); await daemon.stop(); }
