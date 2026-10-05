import test from 'node:test';
import assert from 'node:assert/strict';
import { createFrameProbe } from './frame-probe.js';

test('frame probe is bounded, measures jitter, and never counts a hidden interval as a dropped frame', () => {
  let next = null, scheduled = 0, cancelled = 0;
  const probe = createFrameProbe({request: fn => {next = fn; return ++scheduled;}, cancel: () => {next = null; cancelled++;}});
  probe.setActive(true); probe.setActive(true);
  assert.equal(scheduled, 1);
  for (let i = 0; i < 601; i++) next(i * 16);
  assert.equal(probe.read().samples, 300);
  assert.equal(probe.read().fps, 62.5);
  next(601 * 16 + 48);
  assert.equal(probe.read().over25, 1);
  assert.equal(probe.read().maxGap, 64);
  probe.setActive(false);
  assert.equal(cancelled, 1);
  assert.equal(probe.read().running, false);
  probe.setActive(true); next(200000); next(200016);
  assert.equal(probe.read().samples, 1);
  assert.equal(probe.read().maxGap, 16);
  probe.destroy(); probe.setActive(true);
  assert.equal(next, null);
});
