import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { createCodexStageDaemon } from "../packages/codex-stage/src/daemon.js";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const token = "d".repeat(48), daemon = createCodexStageDaemon({ token });
const { port } = await daemon.start({ port: 0 });
const endpoint = `http://127.0.0.1:${port}`, origin = process.env.STAGE_ORIGIN || "http://127.0.0.1:4180";
const browser = await chromium.launch({ headless: true, executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const errors = [], results = [], hash = data => createHash("sha256").update(data).digest("hex");
try {
  for (const game of ["toast-hop", "cart-downhill"]) {
    const page = await browser.newPage({ viewport: { width: 400, height: 225 } });
    page.on("pageerror", error => errors.push(error.message));
    const post = async event => {
      const r = await fetch(`${endpoint}/v1/hooks`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ hook_event_name: event, session_id: "focus-browser", turn_id: game }) });
      assert.equal(r.status, 202);
    };
    const visibility = visible => page.evaluate(visible => {
      window.__agentStageHostVisible = visible;
      window.dispatchEvent(new CustomEvent("agent-stage-host-visibility", { detail: { visible } }));
    }, visible);
    await post("UserPromptSubmit");
    await page.goto(`${origin}/codex-stage?popup=1&game=${game}#${new URLSearchParams({ token, daemon: endpoint })}`);
    await page.waitForFunction(() => !document.querySelector("#fire").disabled);
    let engine;
    if (game === "cart-downhill") {
      await page.waitForFunction(() => document.querySelector("iframe")?.contentWindow.cartPilot?.state().active);
      engine = page.frameLocator("iframe.standalone-game");
      await engine.locator("#drive").click();
      await page.evaluate(() => { window.heldGame = document.querySelector("iframe").contentWindow.cartPilot; });
    } else {
      await page.mouse.move(180, 130); await page.mouse.down(); await page.waitForTimeout(200); await page.mouse.up();
    }
    await visibility(false);
    assert.equal(await page.locator("#agent-status").textContent(), "Agent 工作中");
    assert.equal(await page.locator("#next-game").isDisabled(), true);
    assert.equal(await page.locator("#fire").isDisabled(), true);
    assert.equal(await page.locator("#retry").isDisabled(), true);
    await page.waitForTimeout(300);
    if (engine) {
      const paused = await page.evaluate(() => window.heldGame.state());
      assert.equal(paused.active, true); assert.equal(paused.paused, true); assert.equal(paused.rendering, false); assert.equal(paused.voices, 0);
    }
    const canvas = engine ? engine.locator("canvas").first() : page.locator("#stage-canvas");
    const before = hash(await canvas.screenshot());
    await page.mouse.click(160, 130); await page.waitForTimeout(400);
    assert.equal(hash(await canvas.screenshot()), before, "hidden simulation is frozen and ignores input");
    await visibility(true);
    assert.equal(await page.locator("#next-game").isDisabled(), false);
    if (engine) assert.equal(await page.evaluate(() => window.heldGame.state().disposed), false);
    await page.waitForTimeout(100);
    await visibility(false); await post("Stop");
    await page.waitForFunction(() => document.querySelector("#agent-status").textContent === "Agent 已完成");
    await visibility(true); await page.waitForTimeout(200);
    assert.equal(await page.locator("#next-game").isDisabled(), true);
    assert.equal(await page.locator("#agent-status").textContent(), "Agent 已完成");
    if (engine) { assert.equal(await page.locator("iframe").count(), 0); assert.equal(await page.evaluate(() => window.heldGame.state().disposed), true); }
    await post("UserPromptSubmit");
    await page.waitForFunction(() => !document.querySelector("#next-game").disabled);
    await post("Interrupt"); await page.waitForFunction(() => document.querySelector("#next-game").disabled);
    results.push({ game, pausedNotStopped: true, frozenInput: true, resumeSameGame: true, backgroundCompletion: true, newTask: true });
    await page.close();
  }
  assert.deepEqual(errors, []);
  await mkdir("output/host-focus-qa", { recursive: true });
  await writeFile("output/host-focus-qa/browser.json", JSON.stringify({ results, errors, syntheticHooks: true }, null, 2));
  console.log(JSON.stringify({ results, errors }));
} finally { await browser.close(); await daemon.stop(); }
