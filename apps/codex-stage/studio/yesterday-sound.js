export function createYesterdaySound() {
  let context, muted = true, disposed = false;
  const voices = new Set(), last = new Map();
  function stop() { for (const node of voices) { try { node.stop(); } catch {} } voices.clear(); }
  function play(kind) {
    if (muted || disposed || !kind.startsWith("yesterday-") || voices.size > 18) return;
    context ??= new AudioContext(); if (context.state !== "running") return;
    const t = context.currentTime; if (t - (last.get(kind) ?? -100) < .08) return; last.set(kind, t);
    function tone(hz, end, length, gain, type = "sine", delay = 0) {
      const o = context.createOscillator(), v = context.createGain(); o.type = type;
      o.frequency.setValueAtTime(hz, t + delay); o.frequency.exponentialRampToValueAtTime(end, t + delay + length);
      v.gain.setValueAtTime(0, t); v.gain.setValueAtTime(gain, t + delay); v.gain.exponentialRampToValueAtTime(.0001, t + delay + length);
      o.connect(v).connect(context.destination); voices.add(o); o.onended = () => { voices.delete(o); o.disconnect(); v.disconnect(); };
      o.start(t + delay); o.stop(t + delay + length + .01);
    }
    if (kind === "yesterday-select") tone(740, 870, .07, .025, "triangle");
    if (kind === "yesterday-step") { tone(190, 65, .045, .025, "triangle"); tone(1100, 760, .025, .009); }
    if (kind === "yesterday-gate") { tone(190, 240, .2, .025, "triangle"); tone(430, 330, .1, .01); }
    if (kind === "yesterday-pickup") [523, 784].forEach((f, i) => tone(f, f, .13, .025, "triangle", i * .06));
    if (kind === "yesterday-drop") tone(930, 130, .4, .028, "sine");
    if (kind === "yesterday-catch") { tone(170, 95, .12, .04, "triangle"); tone(1046, 1046, .18, .02, "sine", .04); }
    if (kind === "yesterday-rewind") { [0, .08, .16, .24].forEach((d, i) => tone(1000 - i * 120, 180, .12, .018, "sawtooth", d)); tone(120, 75, .07, .03, "triangle", .38); }
    if (kind === "yesterday-delivery") [523, 659, 784, 1047].forEach((f, i) => tone(f, f, .3, .035, "triangle", i * .1));
  }
  return { play, stop, setMuted(v) { muted = Boolean(v); if (muted) stop(); }, unlock() { if (disposed || muted) return; context ??= new AudioContext(); context.resume().catch(() => {}); }, destroy() { if (disposed) return; disposed = true; stop(); context?.close().catch(() => {}); } };
}
