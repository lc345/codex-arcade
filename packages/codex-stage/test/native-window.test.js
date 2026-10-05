import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../../../macos/scripts/native-game-window.js", import.meta.url), "utf8");
const ctx = vm.createContext({ ObjC: { import() {} } });
vm.runInContext(source, ctx);
const plain = value => JSON.parse(JSON.stringify(value));

test("geometry from the observer must be fresh, finite and owned by the requested process", () => {
  const bounds = { x: 10, y: 20, width: 1000, height: 700 };
  const report = { pid: 123, updatedAt: 1000, bounds };
  assert.deepEqual(plain(ctx.observedWindowBounds(report, 123, 1400)), bounds);
  for (const value of [null, {...report, pid: 456}, {...report, updatedAt: 0}, {...report, updatedAt: 3000}, {...report, bounds: null}, {...report, bounds: {...bounds, width: NaN}}, {...report, bounds: {...bounds, height: 20}}]) {
    assert.equal(ctx.observedWindowBounds(value, 123, 1400), null);
  }
});

test("interactive host reads cached geometry instead of enumerating system windows on its UI thread", () => {
  const body = source.slice(source.indexOf('function observeHost()'), source.indexOf('function placement()'));
  assert.doesNotMatch(body, /readOnscreenWindows\(/);
  assert.match(body, /cachedGeometry\(front\.pid\)/);
});

test("popup chooses the pointer's display, including negative coordinates", () => {
  const screens = [{ x: 0, y: 24, width: 1512, height: 920 }, { x: -1920, y: 0, width: 1920, height: 1080 }];
  const frame = plain(ctx.chooseGameWindowFrame(screens, { x: -800, y: 450 }));
  assert.equal(frame.screenIndex, 1);
  assert.equal(frame.x, -540);
  assert.equal(frame.y, 20);
  assert.equal(frame.width, 520);
  assert.equal(frame.height, 293);
});

test("popup remains entirely inside a small usable display", () => {
  const screen = { x: 40, y: -500, width: 600, height: 500 };
  const frame = ctx.chooseGameWindowFrame([screen], { x: 300, y: -100 });
  assert.ok(frame.x >= screen.x && frame.y >= screen.y);
  assert.ok(frame.x + frame.width <= screen.x + screen.width);
  assert.ok(frame.y + frame.height <= screen.y + screen.height);
});

test("compact popup preserves game aspect ratio, including short displays", () => {
  for (const height of [200, 900]) {
    const screen = { x: 0, y: 0, width: 600, height };
    const frame = ctx.chooseGameWindowFrame([screen], { x: 100, y: 100 }, 1.5);
    assert.ok(frame.width <= 520);
    assert.ok(Math.abs(frame.width / frame.height - 1.5) < 0.01);
    assert.ok(frame.y + frame.height <= height - 20);
  }
});

test("invalid game ratios cannot create oversized or nonfinite windows", () => {
  const screens = [{ x: 0, y: 0, width: 1512, height: 920 }];
  for (const ratio of [0, -1, NaN, Infinity, 999, "secret"]) {
    const frame = ctx.chooseGameWindowFrame(screens, { x: 100, y: 100 }, ratio);
    assert.equal(frame.width, 520);
    assert.equal(frame.height, 293);
  }
});

test("ordered does not mean visible on the active desktop", () => {
  assert.equal(ctx.isGameWindowVisible(true, false, 2), false);
  assert.equal(ctx.isGameWindowVisible(true, true, 0), false);
  assert.equal(ctx.isGameWindowVisible(false, true, 2), false);
  assert.equal(ctx.isGameWindowVisible(true, true, 2), true);
});

const codex = { bundleId: "com.openai.codex", pid: 123, hidden: false };
const hostWindow = { pid: 123, layer: 0, onScreen: true, alpha: 1, bounds: { x: 100, y: 60, width: 1000, height: 700 } };

test("another foreground app, minimized Codex and unknown geometry must hide the game", () => {
  assert.equal(ctx.findCodexWindow({ ...codex, bundleId: "com.apple.finder" }, [hostWindow]), null);
  assert.equal(ctx.findCodexWindow({ ...codex, hidden: true }, [hostWindow]), null);
  assert.equal(ctx.findCodexWindow(codex, [{ ...hostWindow, onScreen: false }]), null);
  assert.equal(ctx.findCodexWindow(codex, []), null);
  assert.equal(ctx.findCodexWindow(null, [hostWindow]), null);
});

test("anchor is the front normal Codex window, never a tooltip or another process", () => {
  const other = { ...hostWindow, pid: 555 }, tooltip = { ...hostWindow, layer: 8 }, second = { ...hostWindow, bounds: { x: 0, y: 0, width: 1400, height: 900 } };
  assert.deepEqual(plain(ctx.findCodexWindow(codex, [other, tooltip, hostWindow, second])), hostWindow.bounds);
  assert.equal(ctx.findCodexWindow(codex, [{ ...hostWindow, bounds: { x: NaN, y: 0, width: 800, height: 600 } }]), null);
});

test("game follows Codex window coordinates instead of the screen or mouse corner", () => {
  const screens = [{ x: 0, y: 24, width: 1512, height: 958 }];
  const anchor = ctx.toAppKitWindowBounds(hostWindow.bounds, 982);
  assert.deepEqual(plain(anchor), { x: 100, y: 222, width: 1000, height: 700 });
  assert.deepEqual(plain(ctx.anchorGameWindowFrame(screens, anchor, 16 / 9)), { screenIndex: 0, x: 560, y: 242, width: 520, height: 293 });
  const moved = ctx.anchorGameWindowFrame(screens, { ...anchor, x: 250, y: 100, width: 800, height: 500 }, 1.5);
  assert.equal(moved.x, 510); assert.equal(moved.y, 120); assert.equal(moved.height, 347);
});

test("multi-screen anchoring stays inside the visible host area and fails closed offscreen", () => {
  const screens = [{ x: 0, y: 24, width: 1512, height: 958 }, { x: -1920, y: -180, width: 1920, height: 1080 }];
  const host = { x: -1800, y: -100, width: 1200, height: 900 };
  const frame = ctx.anchorGameWindowFrame(screens, host, 16 / 9);
  assert.equal(frame.screenIndex, 1); assert.equal(frame.x, -1140); assert.equal(frame.y, -80);
  assert.equal(ctx.anchorGameWindowFrame(screens, { x: 4000, y: 0, width: 800, height: 600 }, 16 / 9), null);
  const clipped = ctx.anchorGameWindowFrame(screens, { x: -2500, y: -400, width: 800, height: 800 }, 16 / 9);
  assert.ok(clipped.width > 0 && clipped.x >= -1920 && clipped.x + clipped.width <= -1700);
});

test("focus loss suspends presentation, not the task or the user's dismissal state", () => {
  const state = { fresh: true, active: true, paused: false, epoch: "one" }, anchor = { x: 0, y: 0, width: 400, height: 225 };
  assert.equal(ctx.gameWindowMode(state, anchor, ""), "visible");
  assert.equal(ctx.gameWindowMode(state, null, ""), "hidden");
  assert.equal(ctx.gameWindowMode(state, anchor, ""), "visible");
  assert.equal(ctx.gameWindowMode(state, anchor, "one"), "dismissed");
  assert.equal(ctx.gameWindowMode({ ...state, epoch: "two" }, anchor, "one"), "visible");
  for (const delta of [{ active: false }, { fresh: false }, { paused: true }]) assert.equal(ctx.gameWindowMode({ ...state, ...delta }, null, ""), "stopped");
});
