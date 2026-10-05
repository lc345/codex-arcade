import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { createStageServer } from "../apps/press-lab/server.js";
import { solveToastJump } from "./toast-replay.mjs";

// Capture a public demo, never the user's desktop, history, or installed hooks.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const ffmpeg = process.env.FFMPEG_PATH || "ffmpeg";
execFileSync(ffmpeg, ["-hide_banner", "-version"], { stdio: "ignore" });
const frames = await mkdtemp(join(tmpdir(), "agent-stage-readme-"));
const server = createStageServer();
const { port } = await server.start({ port: 0 });
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
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
  assert.equal((await canvas.boundingBox()).width, 680);
  assert.equal(await page.evaluate(() => demo.painter.diagnostics.assetLoaded), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 1280);
  assert.ok(await canvas.evaluate(c => {
    const pixels = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    const colors = new Set();
    for (let i = 0; i < pixels.length; i += 100) colors.add(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`);
    return colors.size > 1000;
  }));
  await mkdir(new URL("../docs/media/", import.meta.url), { recursive: true });
  const poster = new URL("../docs/media/readme-preview.png", import.meta.url).pathname;
  const gif = new URL("../docs/media/readme-preview.gif", import.meta.url).pathname;
  const fps = 20, frameMs = 1000 / fps;
  let frame = 0;
  async function advance(duration) {
    for (let remaining = duration; remaining > 0; remaining -= frameMs) {
      await page.clock.runFor(Math.min(frameMs, remaining));
      await page.screenshot({ path: join(frames, `${String(frame++).padStart(5, "0")}.png`) });
    }
  }
  async function caption(step, title, detail) {
    await page.evaluate(({ step, title, detail }) => {
      document.querySelector("[data-step]").textContent = step;
      document.querySelector("[data-caption]").textContent = title;
      document.querySelector("[data-detail]").textContent = detail;
    }, { step, title, detail });
  }
  await advance(850);
  for (let jump = 0; jump < 3; jump++) {
    const choice = solveToastJump(await page.evaluate(() => demo.world.checkpoint()));
    await caption("02 / PLAY WHILE CODEX WORKS", "Hold. Aim. Let it fly.", "Real keyboard input. Real game physics.");
    await canvas.focus();
    await page.keyboard.down("Space");
    await advance(Math.round(choice.ticks * 1000 / 120));
    await page.keyboard.up("Space");
    await advance(150);
    assert.equal(await page.evaluate(() => demo.world.scene.mode), "flight");
    if (jump === 1) await page.screenshot({ path: poster });
    await advance(850);
    assert.equal(await page.evaluate(() => demo.world.scene.index), jump + 1);
    await caption("02 / PLAY WHILE CODEX WORKS", "One more jump?", "Your task keeps running in the background.");
    await advance(600);
  }
  await page.evaluate(() => {
    demo.runtime.stop();
    document.body.dataset.phase = "complete";
    document.querySelector("[data-task-status]").textContent = "Task complete";
    document.querySelector("[data-tool-status]").textContent = "Checks passed";
    document.querySelector(".composer small").textContent = "Ready for your next task";
  });
  await caption("03 / TASK COMPLETED", "Done means done.", "The game stops and gets out of your way.");
  const stopped = await page.evaluate(() => JSON.stringify(demo.world.snapshot()));
  await advance(1600);
  await page.keyboard.press("Space");
  assert.equal(await page.evaluate(() => JSON.stringify(demo.world.snapshot())), stopped);
  assert.equal(await canvas.isVisible(), false);
  assert.deepEqual(errors, []);
  await page.evaluate(() => demo.runtime.destroy());
  execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
    "-i", join(frames, "%05d.png"), "-filter_complex",
    "split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle",
    "-loop", "0", gif], { timeout: 120000 });
  const bytes = (await stat(gif)).size;
  assert.ok(bytes < 8 * 1024 * 1024, "README GIF must remain below 8 MiB");
  const report = { image: "docs/media/readme-preview.gif", poster: "docs/media/readme-preview.png", width: 1280, height: 800,
    gameWidth: 680, frames: frame, fps, duration: frame / fps, bytes, illustratedWorkspace: true, simulatedLifecycle: true,
    realGameplay: "toast-hop", successfulJumps: 3, stoppedAndHidden: true, privateData: false };
  await mkdir(new URL("../output/readme-preview/", import.meta.url), { recursive: true });
  await writeFile(new URL("../output/readme-preview/report.json", import.meta.url), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report));
} finally {
  await browser?.close();
  await server.stop();
  await rm(frames, { recursive: true, force: true });
}
