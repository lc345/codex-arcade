import assert from "node:assert/strict";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const origin = process.env.STAGE_ORIGIN || "http://127.0.0.1:4175";
try {
  const page = await browser.newPage({ viewport: { width: 1360, height: 940 } });
  for (const [query, ids, title] of [
    ["one-button", ["sky-stack", "press-run", "swing-post"], "叠到天上"],
    ["one-button-2", ["bridge-span", "orbit-pins", "last-stop", "gravity-shift"], "桥就这么长"],
    ["contrast", ["rainline", "ink-archive", "last-lift"], "雨线快递"],
    ["variety", ["marble-demolition", "pocket-town", "clockout-clearout"], "弹珠拆迁队"],
  ]) {
    await page.goto(`${origin}/codex-stage?collection=${query}`); await page.waitForSelector("#game-library [data-game]");
    assert.deepEqual(await page.locator("#game-library [data-game]").evaluateAll(nodes => nodes.map(n => n.dataset.game)), ids);
    await page.waitForFunction(t => document.querySelector("#game-title").textContent === t, title);
    assert.equal(await page.locator(".random-mode").isVisible(), false); assert.equal(await page.locator("#library-drawer").getAttribute("open"), "");
  }
  await page.goto(`${origin}/codex-stage?collection=not-a-collection`); await page.waitForSelector("#game-library [data-game]");
  assert.equal(await page.locator("#game-library [data-game]").count(), 48); assert.equal(await page.locator(".random-mode").isVisible(), true);
  console.log("Collections: one-button, one-button-2, contrast and variety isolated; unknown collection retains full catalog.");
} finally { await browser.close(); }
