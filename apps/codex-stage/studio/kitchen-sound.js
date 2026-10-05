export function createKitchenSound() {
  let context, muted = true, disposed = false;
  const voices = new Set(), last = new Map();
  function stop() { for (const node of voices) { try { node.stop(); } catch {} } voices.clear(); }
  function play(kind) {
    if (muted || disposed || !kind.startsWith("kitchen-") || voices.size > 22) return;
    context ??= new AudioContext(); if (context.state !== "running") return;
    const t = context.currentTime, interval = kind === "kitchen-pop" ? .09 : .15;
    if (t - (last.get(kind) ?? -100) < interval) return; last.set(kind, t);
    function tone(hz, end, duration, gain, type = "sine", delay = 0) {
      const o = context.createOscillator(), v = context.createGain(); o.type = type;
      o.frequency.setValueAtTime(hz, t + delay); o.frequency.exponentialRampToValueAtTime(end, t + delay + duration);
      v.gain.setValueAtTime(0, t); v.gain.setValueAtTime(gain, t + delay); v.gain.exponentialRampToValueAtTime(.0001, t + delay + duration);
      o.connect(v).connect(context.destination); voices.add(o); o.onended = () => { voices.delete(o); o.disconnect(); v.disconnect(); };
      o.start(t + delay); o.stop(t + delay + duration + .01);
    }
    function noise(duration, hz, gain) {
      const b = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate), data = b.getChannelData(0); let seed = 375;
      for (let i = 0; i < data.length; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; data[i] = (seed / 2147483648 - 1) * (1 - i / data.length) ** 2; }
      const o = context.createBufferSource(), f = context.createBiquadFilter(), v = context.createGain(); o.buffer = b; f.type = "bandpass"; f.frequency.value = hz; v.gain.value = gain;
      o.connect(f).connect(v).connect(context.destination); voices.add(o); o.onended = () => { voices.delete(o); o.disconnect(); f.disconnect(); v.disconnect(); }; o.start(t);
    }
    if (kind === "kitchen-pop") { tone(520, 130, .055, .025, "triangle"); noise(.03, 2500, .018); }
    if (kind === "kitchen-pan") { tone(170, 760, .09, .026, "triangle"); [627, 1137, 1844].forEach(hz => tone(hz, hz * .97, .35, .012)); }
    if (kind === "kitchen-frost") { noise(.18, 6400, .035); tone(1700, 1200, .13, .012); }
    if (kind === "kitchen-heat") noise(.13, 2000, .025);
    if (kind === "kitchen-steam") { noise(.46, 2200, .075); tone(170, 65, .22, .04); tone(980, 600, .2, .015, "triangle"); }
    if (kind === "kitchen-select") tone(600, 900, .05, .025, "triangle");
    if (kind === "kitchen-build") { tone(150, 75, .08, .035); tone(620, 900, .15, .025, "triangle", .04); }
    if (kind === "kitchen-scrap") { noise(.07, 950, .035); tone(1050, 1250, .12, .013); }
    if (kind === "kitchen-bell" || kind === "kitchen-wave") { [960, 1453, 2050].forEach(hz => tone(hz, hz, .7, .018)); }
    if (kind === "kitchen-upgrade" || kind === "kitchen-clear" || kind === "kitchen-win") [523, 659, 784, 1047].forEach((hz, i) => tone(hz, hz, .2, .026, "triangle", i * .09));
    if (kind === "kitchen-boss" || kind === "kitchen-leak" || kind === "kitchen-lose") { tone(170, 85, .32, .035, "sawtooth"); noise(.2, 500, .035); }
  }
  return { play, stop, setMuted(v) { muted = Boolean(v); if (muted) stop(); }, unlock() { if (disposed || muted) return; context ??= new AudioContext(); context.resume().catch(() => {}); }, destroy() { if (disposed) return; disposed = true; stop(); context?.close().catch(() => {}); } };
}
