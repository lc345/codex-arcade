export function createMagnetSound() {
  let ctx, muted = true, disposed = false, count = 0, last = -1;
  const voices = new Set();
  function stop() { for (const o of voices) { try { o.stop(); } catch {} } voices.clear(); }
  function play(type) {
    if (muted || disposed || !type.startsWith("magnet-")) return;
    ctx ??= new AudioContext(); if (ctx.state !== "running") return;
    const time = ctx.currentTime; if (type === "magnet-catch" && time - last < .035) return; last = time;
    function note(f, end, duration, delay = 0, wave = "sine", volume = .025) {
      if (voices.size >= 18) return;
      const o = ctx.createOscillator(), gain = ctx.createGain(); o.type = wave;
      o.frequency.setValueAtTime(f, time + delay); o.frequency.exponentialRampToValueAtTime(end, time + delay + duration);
      gain.gain.setValueAtTime(0, time); gain.gain.linearRampToValueAtTime(volume, time + delay + .004); gain.gain.exponentialRampToValueAtTime(.0001, time + delay + duration);
      o.connect(gain).connect(ctx.destination); voices.add(o); o.onended = () => { voices.delete(o); o.disconnect(); gain.disconnect(); }; o.start(time + delay); o.stop(time + delay + duration + .01);
    }
    if (type === "magnet-catch") { const f = [523, 659, 784, 1046, 1175][count++ % 5]; note(f, f * 1.3, .07, 0, "triangle", .023); note(120, 70, .04); }
    if (type === "magnet-big") { note(150, 50, .18, 0, "triangle", .05); note(700, 1050, .2, .04); }
    if (type === "magnet-crash") { note(180, 35, .2, 0, "sawtooth", .015); note(720, 100, .12, .025, "triangle"); }
    if (type === "magnet-horn") { note(220,220,.18,0,"triangle",.023); note(277,277,.18,0,"triangle",.016); note(220,220,.18,.24,"triangle",.023); }
    if (type === "magnet-tow") { note(90,60,.18,0,"triangle",.04); [392,523,659].forEach((f,i)=>note(f,f,.22,.15+i*.1)); }
    if (type === "magnet-lost-bus") { note(392,196,.3,0,"triangle",.03); note(196,98,.3,.14,"triangle",.03); }
    if (type === "magnet-delivery") { note(70,35,.7,0,"sawtooth",.018); note(180,45,.35,.8,"triangle",.05); note(100,40,.25,1.6,"triangle",.035); }
    if (type === "magnet-upgrade" || type === "magnet-win") [523, 659, 784, 1046].forEach((f, i) => note(f, f, .23, i * .075, "triangle", .024));
  }
  return { play, stop, setMuted(v) { muted = !!v; if (muted) stop(); }, unlock() { if (muted || disposed) return; ctx ??= new AudioContext(); ctx.resume().catch(() => {}); }, destroy() { if (disposed) return; disposed = true; stop(); ctx?.close().catch(() => {}); } };
}
