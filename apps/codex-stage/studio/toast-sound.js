export function createToastSound() {
  let context, muted = true, disposed = false; const voices = new Set();
  function stop() { for (const v of voices) { try { v.stop(); } catch {} } voices.clear(); }
  function play(type) {
    if (muted || disposed || !type.startsWith("toast-")) return; context ??= new AudioContext(); if (context.state !== "running") return;
    const t = context.currentTime;
    function tone(a, b, length, volume = .04, delay = 0, wave = "sine") {
      if (voices.size >= 12) return; const o = context.createOscillator(), g = context.createGain(); o.type = wave; o.frequency.setValueAtTime(a, t + delay); o.frequency.exponentialRampToValueAtTime(b, t + delay + length); g.gain.setValueAtTime(0, t); g.gain.setValueAtTime(volume, t + delay); g.gain.exponentialRampToValueAtTime(.0001, t + delay + length); o.connect(g).connect(context.destination); voices.add(o); o.onended = () => { voices.delete(o); o.disconnect(); g.disconnect(); }; o.start(t + delay); o.stop(t + delay + length + .02);
    }
    if (type === "toast-press") tone(170, 90, .12, .018, 0, "triangle");
    if (type === "toast-jump") { tone(200, 730, .12); tone(720, 440, .08, .018, .09); }
    if (["toast-land", "toast-perfect"].includes(type)) { tone(1250, 960, .14, .023); tone(2200, 1600, .08, .008, .015); }
    if (type === "toast-perfect") tone(1760, 1760, .24, .018, .05);
    if (type === "toast-fall") { tone(290, 64, .23, .04, 0, "triangle"); tone(90, 50, .1, .018, .18); }
    if (type === "toast-win") [523, 659, 784, 1046].forEach((f, i) => tone(f, f, .22, .024, i * .1));
  }
  return { play, stop, setMuted(v) { muted = Boolean(v); if (muted) stop(); }, unlock() { if (muted || disposed) return; context ??= new AudioContext(); context.resume().catch(() => {}); }, destroy() { if (disposed) return; disposed = true; stop(); context?.close().catch(() => {}); } };
}
