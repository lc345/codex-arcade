import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { createStageServer } from "../apps/press-lab/server.js";

// Capture a public demo, never the user's desktop, history, or installed hooks.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const server = createStageServer();
const { port } = await server.start({ port: 0 });
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const origin = `http://127.0.0.1:${port}`;
  await page.route("**/*", route => route.request().url().startsWith(origin + "/") ? route.continue() : route.abort());
  await page.clock.install({ time: new Date("2026-10-05T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-10-05T00:00:01Z"));
  await page.goto(`${origin}/tools/fixtures/readme-preview.html`);
  await page.evaluate(async () => {
    const { STUDIO_PACKS } = await import("/apps/codex-stage/studio/registry.js");
    const { TOAST_CATALOG } = await import("/apps/codex-stage/studio/toast-catalog.js");
    const { createStudioRuntime } = await import("/apps/codex-stage/studio/runtime.js");
    const pack = STUDIO_PACKS["toast-hop"];
    const demo = window.demo = {};
    demo.runtime = createStudioRuntime(document.querySelector("canvas"), TOAST_CATALOG[0],
      options => demo.world = pack.create(options), pack.paint, {},
      (...args) => demo.painter = pack.createPainter(...args));
    demo.runtime.setMuted(true);
    demo.runtime.start();
    await demo.painter.ready;
  });
  await page.clock.runFor(50);
  const canvas = page.locator("canvas");
  await canvas.focus();
  await page.keyboard.down("Space");
  await page.clock.runFor(470);
  await page.keyboard.up("Space");
  await page.clock.runFor(170);
  assert.equal(await page.evaluate(() => demo.world.scene.mode), "flight");
  assert.equal(await page.evaluate(() => demo.painter.diagnostics.assetLoaded), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 1280);
  assert.ok(await canvas.evaluate(c => {
    const pixels = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    const colors = new Set();
    for (let i = 0; i < pixels.length; i += 100) colors.add(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`);
    return colors.size > 1000;
  }));
  assert.deepEqual(errors, []);
  await mkdir(new URL("../docs/media/", import.meta.url), { recursive: true });
  const path = new URL("../docs/media/readme-preview.png", import.meta.url).pathname;
  await page.screenshot({ path });
  await page.evaluate(() => demo.runtime.destroy());
  console.log(JSON.stringify({ image: "docs/media/readme-preview.png", illustratedWorkspace: true, realGameplay: "toast-hop", capturedPhase: "flight", privateData: false }));
} finally {
  await browser?.close();
  await server.stop();
}
