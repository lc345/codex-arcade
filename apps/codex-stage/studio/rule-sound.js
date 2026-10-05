export function createRuleSound() {
  let context, muted = true, disposed = false;
  const voices = new Set(), last = new Map();
  function stop() { for (const o of voices) { try { o.stop(); } catch {} } voices.clear(); }
  function play(kind) {
    if (muted || disposed || !kind.startsWith("rules-") || voices.size > 24) return;
    context ??= new AudioContext(); if (context.state !== "running") return;
    const t = context.currentTime; if (t - (last.get(kind) ?? -100) < .06) return; last.set(kind, t);
    function tone(hz, end, duration, gain, type = "triangle", delay = 0) {
      const o = context.createOscillator(), v = context.createGain(); o.type = type; o.frequency.setValueAtTime(hz, t + delay); o.frequency.exponentialRampToValueAtTime(end, t + delay + duration);
      v.gain.setValueAtTime(0, t); v.gain.setValueAtTime(gain, t + delay); v.gain.exponentialRampToValueAtTime(.0001, t + delay + duration);
      o.connect(v).connect(context.destination); voices.add(o); o.onended = () => { voices.delete(o); o.disconnect(); v.disconnect(); }; o.start(t + delay); o.stop(t + delay + duration + .02);
    }
    function noise(duration, gain) {
      const b = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate), a = b.getChannelData(0); let seed = 71;
      for (let i = 0; i < a.length; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; a[i] = (seed / 2147483648 - 1) * (1 - i / a.length) ** 2; }
      const o = context.createBufferSource(), f = context.createBiquadFilter(), v = context.createGain(); o.buffer = b; f.type = "lowpass"; f.frequency.value = 1600; v.gain.value = gain;
      o.connect(f).connect(v).connect(context.destination); voices.add(o); o.onended = () => { voices.delete(o); o.disconnect(); f.disconnect(); v.disconnect(); }; o.start(t);
    }
    if (kind === "rules-select") tone(650, 930, .04, .02);
    if (kind === "rules-mirror") { tone(1650, 1500, .2, .022, "sine"); tone(2220, 2100, .13, .012, "sine"); }
    if (kind === "rules-swap") { tone(260, 990, .13, .026); tone(990, 260, .13, .026, "triangle", .09); }
    if (kind === "rules-portal") { tone(130, 1300, .27, .025, "sine"); tone(520, 1040, .22, .013); }
    if (kind === "rules-link") [440, 660].forEach((f, i) => tone(f, f, .21, .028, "sine", i * .1));
    if (kind === "rules-push" || kind === "rules-step") { tone(140, 60, .1, .036); noise(.05, .017); }
    if (kind === "rules-undo") tone(850, 230, .16, .023);
    if (kind === "rules-commit") [220, 330, 440].forEach((f, i) => tone(f, f, .12, .025, "triangle", i * .08));
    if (kind === "rules-shot") { tone(370, 55, .16, .042, "sawtooth"); noise(.09, .045); }
    if (kind === "rules-hit") { tone(640, 80, .09, .028); noise(.09, .045); }
    if (kind === "rules-blast") { tone(90, 35, .4, .05, "sine"); noise(.4, .09); }
    if (kind === "rules-win") [523, 659, 784, 1046].forEach((f, i) => tone(f, f, .27, .032, "triangle", i * .09));
    if (kind === "rules-lose") [293, 246, 196].forEach((f, i) => tone(f, f, .27, .032, "triangle", i * .12));
  }
  return { play, stop, setMuted(v) { muted = Boolean(v); if (muted) stop(); }, unlock() { if (disposed || muted) return; context ??= new AudioContext(); context.resume().catch(() => {}); }, destroy() { if (disposed) return; disposed = true; stop(); context?.close().catch(() => {}); } };
}
