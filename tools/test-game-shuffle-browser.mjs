import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createCodexStageDaemon } from "../packages/codex-stage/src/daemon.js";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const daemon = createCodexStageDaemon({ token: "c".repeat(48) });
const { port } = await daemon.start({ port: 0 });
const endpoint = `http://127.0.0.1:${port}`, origin = process.env.STAGE_ORIGIN || "http://127.0.0.1:4180";
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const errors = [], ids = [];
try {
  const page = await browser.newPage({ viewport: { width: 400, height: 267 } });
  page.on("pageerror", e => errors.push(e.message));
  const post = async event => {
    const response = await fetch(`${endpoint}/v1/hooks`, { method: "POST", headers: { authorization: `Bearer ${"c".repeat(48)}`, "content-type": "application/json" }, body: JSON.stringify({ hook_event_name: event, session_id: "shuffle-qa", turn_id: "long-task" }) });
    assert.equal(response.status, 202);
  };
  await post("UserPromptSubmit");
  await page.goto(`${origin}/codex-stage?popup=1&game=cart-downhill#${new URLSearchParams({ token: "c".repeat(48), daemon: endpoint })}`);
  await page.waitForFunction(() => document.querySelector("iframe")?.contentWindow.cartPilot?.state().active);
  await page.evaluate(() => { window.oldGame = document.querySelector("iframe").contentWindow.cartPilot; });
  // Hover exposes a compact button without changing the canvas geometry.
  const box = await page.locator(".playfield").boundingBox();
  await page.mouse.move(box.x + box.width - 20, box.y + 20);
  const button = page.getByRole("button", { name: "换一款游戏" });
  await button.click();
  await page.waitForFunction(() => document.querySelector("#game-title").textContent !== "购物车下坡王");
  assert.equal(await page.evaluate(() => window.oldGame.state().disposed), true);
  assert.equal(await page.locator("#random").isChecked(), true);
  for (let i = 0; i < 8; i++) {
    await page.waitForFunction(() => !/正在加载/.test(document.querySelector("#feedback").textContent), { timeout: 30000 });
    const title = await page.locator("#game-title").textContent(); ids.push(title);
    assert.equal(await page.locator("#agent-status").textContent(), "Agent 工作中");
    await post("PreToolUse");
    assert.equal(await page.locator("#game-title").textContent(), title);
    await page.mouse.move(385, 15); await button.click();
    await page.waitForFunction(old => document.querySelector("#game-title").textContent !== old, title);
  }
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(box.width <= 400);
  // A stop racing the most recent pack load cannot resurrect a game.
  await post("Stop");
  await page.waitForFunction(() => document.querySelector("#next-game").disabled);
  await page.waitForTimeout(1000);
  assert.equal(await page.locator("#agent-status").textContent(), "Agent 已完成");
  assert.equal(await page.locator("iframe").count(), 0);
  const auto = await browser.newPage({ viewport: { width: 400, height: 225 } });
  auto.on("pageerror", e => errors.push(e.message));
  await auto.clock.install();
  await post("UserPromptSubmit");
  await auto.goto(`${origin}/codex-stage?popup=1&game=razor-wings#${new URLSearchParams({ token: "c".repeat(48), daemon: endpoint })}`);
  await auto.waitForFunction(() => !document.querySelector("#fire").disabled);
  // Opt back into random rotation; an explicitly pinned preview never auto-switches.
  await auto.evaluate(() => document.querySelector("#random").click());
  await auto.clock.fastForward(181000);
  await auto.waitForFunction(() => document.querySelector("#game-title").textContent !== "刃隙飞行");
  assert.equal(await auto.locator("#agent-status").textContent(), "Agent 工作中");
  await post("Stop");
  await auto.waitForFunction(() => document.querySelector("#next-game").disabled);
  await auto.close();
  await mkdir("output/shuffle-qa", { recursive: true });
  await page.screenshot({ path: "output/shuffle-qa/stopped.png" });
  assert.deepEqual(errors, []);
  const report = { ids, sameTask: true, oldEngineDisposed: true, stopCancelsLoad: true, automaticQuietBoundary: true, errors };
  await writeFile("output/shuffle-qa/report.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally { await browser.close(); await daemon.stop(); }
