export function createShadowSound() {
  let context, muted = true, disposed = false; const voices = new Set(), last = new Map();
  function stop() { for (const o of voices) { try { o.stop(); } catch {} } voices.clear(); }
  function play(kind) {
    if (muted || disposed || !kind.startsWith("shadow-") || voices.size > 16) return;
    context ??= new AudioContext(); if (context.state !== "running") return;
    const t = context.currentTime; if (t - (last.get(kind) ?? -100) < .08) return; last.set(kind, t);
    function tone(a, z, d, volume = .025, delay = 0) {
      const o = context.createOscillator(), g = context.createGain(); o.type = kind === "shadow-step" ? "triangle" : "sine";
      o.frequency.setValueAtTime(a, t + delay); o.frequency.exponentialRampToValueAtTime(z, t + delay + d);
      g.gain.setValueAtTime(0, t); g.gain.setValueAtTime(volume, t + delay); g.gain.exponentialRampToValueAtTime(.0001, t + delay + d);
      o.connect(g).connect(context.destination); voices.add(o); o.onended = () => { voices.delete(o); o.disconnect(); g.disconnect(); }; o.start(t + delay); o.stop(t + delay + d + .02);
    }
    if (kind === "shadow-step") tone(180, 100, .045, .014);
    if (kind === "shadow-place") { tone(510, 760, .08); tone(1010, 960, .1, .009); }
    if (kind === "shadow-start") tone(390, 540, .12, .02);
    if (kind === "shadow-undo") tone(660, 280, .15);
    if (kind === "shadow-checkpoint") [440, 660].forEach((f, i) => tone(f, f, .24, .025, i * .13));
    if (kind === "shadow-win") [523, 659, 784, 1046].forEach((f, i) => tone(f, f, .3, .027, i * .14));
    if (kind === "shadow-fall") tone(340, 90, .4, .03);
  }
  return { play, stop, setMuted(v) { muted = Boolean(v); if (muted) stop(); }, unlock() { if (muted || disposed) return; context ??= new AudioContext(); context.resume().catch(() => {}); }, destroy() { if (disposed) return; disposed = true; stop(); context?.close().catch(() => {}); } };
}
