export function createOneButtonSound(id) {
  let context, muted = true, disposed = false; const voices = new Set();
  function stop() { for (const v of voices) { try { v.stop(); } catch {} } voices.clear(); }
  function play(type) {
    if (muted || disposed || !type.startsWith("precision-")) return; context ??= new AudioContext(); if (context.state !== "running") return;
    const t = context.currentTime, mechanical = ["press-run", "last-stop", "gravity-shift"].includes(id);
    function tone(f, end, length, delay = 0, wave = "sine", volume = .035) {
      if (voices.size >= 12) return; const o = context.createOscillator(), g = context.createGain(); o.type = wave;
      o.frequency.setValueAtTime(f, t + delay); o.frequency.exponentialRampToValueAtTime(end, t + delay + length);
      g.gain.setValueAtTime(0, t); g.gain.setValueAtTime(volume, t + delay); g.gain.exponentialRampToValueAtTime(.0001, t + delay + length);
      o.connect(g).connect(context.destination); voices.add(o); o.onended = () => { voices.delete(o); o.disconnect(); g.disconnect(); }; o.start(t + delay); o.stop(t + delay + length + .025);
    }
    if (type === "precision-stack") { tone(170, 75, .12, 0, "triangle"); tone(720, 340, .05, .01, "sine", .02); }
    if (type === "precision-stretch") tone(240, 680, .15, 0, "triangle", .015);
    if (type === "precision-bridge") { tone(140, 60, .15, 0, "triangle"); tone(420, 250, .09, .06); }
    if (type === "precision-pin") { tone(1400, 650, .055, 0, "sine", .024); tone(330, 110, .07, 0, "triangle", .02); }
    if (type === "precision-brake") tone(210, 65, .22, 0, "sawtooth", .012);
    if (type === "precision-park") { tone(620, 620, .06, 0, "square", .013); tone(930, 930, .14, .08); }
    if (type === "precision-flip") tone(id === "gravity-shift" ? 180 : 300, 840, .1, 0, "triangle", .025);
    if (type === "precision-gate") { tone(820, 820, .07, 0, "square", .015); tone(1240, 1240, .09, .06, "sine", .02); }
    if (type === "precision-delivery") { tone(940, 940, .15); tone(1410, 1410, .14, .07); }
    if (type === "precision-perfect") { tone(780, 780, .12); tone(1170, 1170, .18, .08); }
    if (type === "precision-fail") { tone(mechanical ? 90 : 280, 42, .24, 0, "triangle", .05); tone(180, 65, .13, .09, mechanical ? "sawtooth" : "sine", .013); }
    if (type === "precision-win") [523, 659, 784, 1046].forEach((f, i) => tone(f, f, .19, i * .09, "sine", .022));
  }
  return { play, stop, setMuted(v) { muted = Boolean(v); if (muted) stop(); }, unlock() { if (muted || disposed) return; context ??= new AudioContext(); context.resume().catch(() => {}); }, destroy() { if (disposed) return; disposed = true; stop(); context?.close().catch(() => {}); } };
}
