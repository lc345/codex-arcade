import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const origin = process.env.STAGE_ORIGIN || 'http://127.0.0.1:4180';
const errors = [];
try {
  const page = await browser.newPage({viewport: {width: 400, height: 267}, deviceScaleFactor: 2});
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript('window.__agentStageManualProfile = true;');
  await page.addInitScript(await readFile('macos/scripts/native-game-profile.js', 'utf8'));
  await page.goto(`${origin}/codex-stage?popup=1&game=zipper-run`);
  await page.waitForFunction(() => !document.querySelector('#fire').disabled);
  await page.locator('#stage-canvas').click();
  const box = await page.locator('#stage-canvas').boundingBox();
  const move = async y => page.mouse.move(box.x + (480 + Math.sin((y - 118) * .013) * 115) / 960 * box.width, box.y + y / 640 * box.height);
  await move(120); await page.mouse.down();
  const start = performance.now();
  let steps = 0;
  while (performance.now() - start < 14000) {
    await move(120 + (performance.now() - start) * .018); steps++;
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  const report = await page.evaluate(() => window.__agentStageProfile());
  const canvas = page.locator('#stage-canvas');
  await canvas.screenshot({path: 'output/zipper-drag.png'});
  const colors = await canvas.evaluate(c => {const pixels = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, seen = new Set(); for (let i = 0; i < pixels.length; i += 256) seen.add(`${pixels[i]},${pixels[i+1]},${pixels[i+2]}`); return seen.size;});
  assert.ok(colors > 32); assert.deepEqual(errors, []);
  await writeFile(`output/zipper-browser-${process.env.QA_LABEL || 'report'}.json`, JSON.stringify({report, steps, colors, realMouse: true, errors}, null, 2));
  console.log(JSON.stringify({report, steps, colors, realMouse: true}));
} finally { await browser.close(); }
