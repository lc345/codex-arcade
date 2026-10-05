export function createDiceSound() {
  let context, muted = true, disposed = false; const voices = new Set(), last = new Map();
  function stop() { for (const o of voices) { try { o.stop(); } catch {} } voices.clear(); }
  function play(kind) {
    if (muted || disposed || !kind.startsWith("dice-")) return;
    context ??= new AudioContext(); if (context.state !== "running") return;
    const t = context.currentTime; if (t - (last.get(kind) ?? -100) < .065) return; last.set(kind, t);
    function tone(a, z, d, volume = .025, delay = 0, type = "triangle") {
      if (voices.size >= 18) return;
      const o = context.createOscillator(), g = context.createGain(); o.type = type; o.frequency.setValueAtTime(a, t + delay); o.frequency.exponentialRampToValueAtTime(z, t + delay + d);
      g.gain.setValueAtTime(0, t); g.gain.setValueAtTime(volume, t + delay); g.gain.exponentialRampToValueAtTime(.0001, t + delay + d);
      o.connect(g).connect(context.destination); voices.add(o); o.onended = () => { voices.delete(o); o.disconnect(); g.disconnect(); }; o.start(t + delay); o.stop(t + delay + d + .025);
    }
    if (kind === "dice-roll") [0, .075, .17, .29, .44].forEach((d, i) => tone(260 + i * 60, 90, .035, .024 - i * .002, d, "square"));
    if (["dice-land", "dice-place", "dice-lock", "dice-select"].includes(kind)) { tone(660, 220, .055, .026); tone(980, 750, .035, .012, .025); }
    if (kind === "dice-start") { tone(120, 240, .2, .018, 0, "sawtooth"); }
    if (kind === "dice-hit" || kind === "dice-counter") { tone(120, 44, .19, .055, 0, "triangle"); tone(900, 100, .09, .014, 0, "square"); }
    if (kind === "dice-shield") [440, 661].forEach(f => tone(f, f * .9, .26, .017));
    if (kind === "dice-charge") tone(270, 760, .24, .025);
    if (kind === "dice-repair") [550, 825].forEach((f, i) => tone(f, f, .18, .023, i * .1));
    if (kind === "dice-enemy" || kind === "dice-heat") tone(150, 50, .2, .027, 0, "sawtooth");
    if (kind === "dice-win") [392, 523, 659, 784].forEach((f, i) => tone(f, f, .26, .025, i * .11));
    if (kind === "dice-install" || kind === "dice-next") { tone(110, 55, .07, .04); tone(700, 1050, .13, .025, .07); }
    if (kind === "dice-lose") tone(240, 60, .5, .023);
  }
  return { play, stop, setMuted(v) { muted = Boolean(v); if (muted) stop(); }, unlock() { if (muted || disposed) return; context ??= new AudioContext(); context.resume().catch(() => {}); }, destroy() { if (disposed) return; disposed = true; stop(); context?.close().catch(() => {}); } };
}
