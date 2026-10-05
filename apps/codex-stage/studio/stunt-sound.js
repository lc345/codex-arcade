export function createStuntSound() {
  let context, muted = true, disposed = false; const voices = new Set(), last = new Map();
  function stop() { for (const v of voices) { try { v.stop(); } catch {} } voices.clear(); }
  function play(kind) {
    if (muted || disposed || !kind.startsWith("stunt-") || voices.size > 20) return;
    context ??= new AudioContext(); if (context.state !== "running") return;
    const t = context.currentTime; if (t - (last.get(kind) ?? -100) < .08) return; last.set(kind, t);
    function tone(from, to, length, level = .03, type = "sine", delay = 0) {
      const o = context.createOscillator(), gain = context.createGain(); o.type = type;
      o.frequency.setValueAtTime(from, t + delay); o.frequency.exponentialRampToValueAtTime(to, t + delay + length);
      gain.gain.setValueAtTime(0, t); gain.gain.setValueAtTime(level, t + delay); gain.gain.exponentialRampToValueAtTime(.0001, t + delay + length);
      o.connect(gain).connect(context.destination); voices.add(o); o.onended = () => { voices.delete(o); o.disconnect(); gain.disconnect(); }; o.start(t + delay); o.stop(t + delay + length + .02);
    }
    function noise(length, level, hz) {
      const b = context.createBuffer(1, Math.ceil(context.sampleRate * length), context.sampleRate), data = b.getChannelData(0); let seed = 172;
      for (let i = 0; i < data.length; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; data[i] = (seed / 2147483648 - 1) * (1 - i / data.length) ** 2; }
      const o = context.createBufferSource(), f = context.createBiquadFilter(), gain = context.createGain(); o.buffer = b; f.type = "lowpass"; f.frequency.value = hz; gain.gain.value = level;
      o.connect(f).connect(gain).connect(context.destination); voices.add(o); o.onended = () => { voices.delete(o); o.disconnect(); f.disconnect(); gain.disconnect(); }; o.start(t);
    }
    if (kind === "stunt-launch") { tone(110, 770, .23, .04, "triangle"); noise(.24, .07, 2500); }
    if (kind === "stunt-hook") { tone(1800, 980, .16, .025); tone(820, 520, .19, .02); }
    if (kind === "stunt-release") tone(620, 310, .12, .025, "triangle");
    if (kind === "stunt-glass") { noise(.3, .075, 7800); [1860, 2400, 3200].forEach((f, i) => tone(f, f * .8, .2, .016, "sine", i * .04)); }
    if (kind === "stunt-bounce") { tone(90, 570, .26, .06, "triangle"); tone(560, 200, .22, .028, "sine", .15); noise(.1, .04, 1900); }
    if (kind === "stunt-thud") { tone(100, 42, .15, .05); noise(.08, .04, 850); }
    if (kind === "stunt-slate") { noise(.08, .07, 3000); tone(220, 110, .08, .03); }
    if (kind === "stunt-win") [392, 494, 587, 784].forEach((f, i) => tone(f, f, .32, .04, "triangle", i * .09));
    if (kind === "stunt-cut") { tone(260, 80, .48, .04, "triangle"); noise(.18, .04, 1000); }
  }
  return { play, stop, setMuted(v) { muted = Boolean(v); if (muted) stop(); }, unlock() { if (disposed || muted) return; context ??= new AudioContext(); context.resume().catch(() => {}); }, destroy() { if (disposed) return; disposed = true; stop(); context?.close().catch(() => {}); } };
}
