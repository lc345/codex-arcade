// Frame cadence only: no task text, tool data, screenshots, or input coordinates.
export function createFrameProbe({request = requestAnimationFrame, cancel = cancelAnimationFrame} = {}) {
  const gaps = new Float64Array(300);
  let count = 0, cursor = 0, last = null, frame = null, active = false, disposed = false;
  function tick(now) {
    if (!active) return;
    if (last !== null) { gaps[cursor] = now - last; cursor = (cursor + 1) % gaps.length; count = Math.min(gaps.length, count + 1); }
    last = now; frame = request(tick);
  }
  function setActive(value) {
    const next = Boolean(value) && !disposed;
    if (active === next) return;
    active = next;
    if (frame !== null) cancel(frame);
    frame = null; last = null;
    if (active) { count = 0; cursor = 0; frame = request(tick); }
  }
  return {
    setActive,
    read() {
      const samples = Array.from(gaps.subarray(0, count)).sort((a, b) => a - b);
      const sum = samples.reduce((a, b) => a + b, 0);
      const q = p => samples[Math.floor((count - 1) * p)] ?? null;
      return {running: active, samples: count, fps: sum ? Math.round(10000 * count / sum) / 10 : null, p95: q(.95), p99: q(.99), maxGap: q(1), over25: samples.filter(n => n > 25).length};
    },
    destroy() { setActive(false); disposed = true; },
  };
}
