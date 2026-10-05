export function createApplianceSound() {
  let context, muted = true, disposed = false; const voices = new Set(), last = new Map();
  function stop() { for (const v of voices) { try { v.stop(); } catch {} } voices.clear(); }
  function play(kind) {
    if (muted || disposed || !kind.startsWith("appliance-")) return; context ??= new AudioContext(); if (context.state !== "running") return;
    const t = context.currentTime; if (t - (last.get(kind) ?? -10) < .09) return; last.set(kind, t);
    function tone(a, b, duration, gain = .035, delay = 0, type = "sine") {
      if (voices.size >= 14) return; const o = context.createOscillator(), g = context.createGain(); o.type = type; o.frequency.setValueAtTime(a, t + delay); o.frequency.exponentialRampToValueAtTime(b, t + delay + duration); g.gain.setValueAtTime(0, t); g.gain.setValueAtTime(gain, t + delay); g.gain.exponentialRampToValueAtTime(.0001, t + delay + duration); o.connect(g).connect(context.destination); voices.add(o); o.onended = () => { voices.delete(o); o.disconnect(); g.disconnect(); }; o.start(t + delay); o.stop(t + delay + duration + .03);
    }
    if (kind === "appliance-transfer") { tone(280, 1200, .12); tone(1100, 640, .16, .02, .09); }
    if (["appliance-switch", "appliance-off", "appliance-pause"].includes(kind)) tone(440, 180, .07, .028, 0, "triangle");
    if (kind === "appliance-load") { tone(100, 60, .09, .05); tone(680, 920, .09, .025, .08); }
    if (kind === "appliance-vend") { tone(160, 100, .22, .025, 0, "sawtooth"); tone(900, 120, .1, .02, .15); }
    if (kind === "appliance-clatter") { tone(620, 110, .06, .02, 0, "triangle"); tone(1600, 350, .06, .008, .07); }
    if (kind === "appliance-bell") [660, 880].forEach((f, i) => tone(f, f, .32, .024, i * .12));
    if (kind === "appliance-caught") [390, 260, 195].forEach((f, i) => tone(f, f * .8, .22, .025, i * .15, "triangle"));
    if (kind === "appliance-win") [523, 659, 784, 1046].forEach((f, i) => tone(f, f, .32, .025, i * .12));
  }
  return { play, stop, setMuted(v) { muted = Boolean(v); if (muted) stop(); }, unlock() { if (muted || disposed) return; context ??= new AudioContext(); context.resume().catch(() => {}); }, destroy() { if (disposed) return; disposed = true; stop(); context?.close().catch(() => {}); } };
}
