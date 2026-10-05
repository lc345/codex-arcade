export function createSlingSound() {
  let context, muted = true;
  const voices = new Set();
  function stop() { for (const voice of voices) { try { voice.stop(); } catch {} } voices.clear(); }
  function play(kind, material) {
    if (muted || voices.size > 20) return;
    context ??= new AudioContext();
    if (context.state !== "running") return;
    const now = context.currentTime;
    function note(hz, endHz, duration, volume, type = "sine", delay = 0) {
      const voice = context.createOscillator(), gain = context.createGain();
      voice.type = type; voice.frequency.setValueAtTime(hz, now + delay); voice.frequency.exponentialRampToValueAtTime(endHz, now + delay + duration);
      gain.gain.setValueAtTime(0, now); gain.gain.setValueAtTime(volume, now + delay); gain.gain.exponentialRampToValueAtTime(.001, now + delay + duration);
      voice.connect(gain).connect(context.destination); voices.add(voice);
      voice.onended = () => { voices.delete(voice); voice.disconnect(); gain.disconnect(); };
      voice.start(now + delay); voice.stop(now + delay + duration + .02);
    }
    if (kind === "tin-step") note(110, 65, .045, .009, "triangle");
    else if (kind === "tin-pickup") [660, 990].forEach((hz,i)=>note(hz,hz,.2,.018,"sine",i*.08));
    else if (kind === "tin-magnet") { note(130, 280, .2, .018, "triangle"); note(620, 460, .12, .009); }
    else if (kind === "tin-grapple") { note(1450, 480, .07, .018, "triangle"); note(260, 990, .32, .014); }
    else if (kind === "tin-repair") [262, 392, 523, 659].forEach((hz,i)=>note(hz,hz,.28,.02,"triangle",i*.13));
    else if (kind === "tin-win") [392, 523, 659, 784, 1047].forEach((hz,i)=>note(hz,hz,.4,.02,"sine",i*.16));
    else if (kind === "tin-denied" || kind === "tin-alert") note(280, 190, .14, .016, "triangle");
    else if (kind === "tin-rescue") { note(220, 330, .22, .015); note(440, 660, .2, .012, "sine", .15); }
    else if (kind === "tin-switch") note(880, 740, .07, .012);
    else if (kind === "raft-hook") { note(750, 1600, .08, .022, "triangle"); note(320, 270, .11, .012); }
    else if (kind === "raft-install") { note(120, 70, .065, .035, "triangle"); note(660, 880, .18, .021, "sine", .055); }
    else if (kind === "raft-clunk") note(240, 90, .07, .026, "triangle");
    else if (kind === "raft-gasp") { note(300, 470, .15, .018, "triangle"); note(450, 230, .14, .013, "sine", .1); }
    else if (kind === "raft-horn") { note(220, 240, .26, .025, "triangle"); note(293, 310, .25, .012, "triangle", .05); }
    else if (kind === "raft-anchor" || kind === "raft-brake") note(370, 95, .24, .017, "triangle");
    else if (kind === "raft-chute") note(1300, 300, .4, .015);
    else if (kind === "raft-catch") [660, 990].forEach((hz, i) => note(hz, hz, .18, .025, "sine", i * .09));
    else if (kind === "raft-bump") { note(150, 70, .16, .035, "triangle"); note(700, 130, .1, .016); }
    else if (kind === "raft-splash") { note(430, 110, .29, .025, "sine"); note(700, 160, .21, .014, "triangle", .06); }
    else if (kind === "raft-clear") [392, 523, 659, 784].forEach((hz, i) => note(hz, hz, .25, .024, "triangle", i * .12));
    else if (kind === "cargo-grab") { note(130, 320, .16, .023, "triangle"); note(880, 660, .06, .012); }
    else if (kind === "cargo-release") note(380, 140, .18, .018);
    else if (kind === "cargo-brake") { note(220, 72, .25, .025, "triangle"); note(700, 200, .15, .01); }
    else if (kind === "cargo-impact") { note(material === "heavy" ? 75 : 170, 45, .14, .035, "triangle"); note(1350, 510, .06, .008); }
    else if (kind === "cargo-damage") { note(220, 90, .18, .03, "triangle"); note(1200, 400, .1, .013); }
    else if (kind === "cargo-dock") [440, 660, 880].forEach((hz, i) => note(hz, hz, .19, .023, "sine", i * .07));
    else if (kind === "cargo-clear") [523, 659, 784, 1047].forEach((hz, i) => note(hz, hz, .28, .025, "sine", i * .11));
    else if (kind === "fold-paper") { note(360, 190, .17, .025, "triangle"); note(850, 470, .11, .009); }
    else if (kind === "fold-lock") { note(550, 360, .055, .028, "triangle"); note(1100, 880, .08, .01); }
    else if (kind === "fold-depart") [392, 523].forEach((hz, i) => note(hz, hz, .19, .018, "sine", i * .1));
    else if (kind === "fold-step") note(160, 100, .035, .012, "triangle");
    else if (kind === "fold-lantern") [784, 1175].forEach((hz, i) => note(hz, hz, .28, .021, "sine", i * .09));
    else if (kind === "fold-arrive") [523, 659, 784, 1047].forEach((hz, i) => note(hz, hz, .37, .025, "sine", i * .12));
    else if (kind === "fold-blocked") { note(330, 280, .17, .018); note(220, 220, .18, .01, "sine", .13); }
    else if (kind === "mech-shot") { note(620, 170, .045, .018, "triangle"); note(95, 65, .045, .012); }
    else if (kind === "mech-dash") { note(160, 660, .13, .018, "triangle"); note(330, 100, .18, .014); }
    else if (kind === "mech-pulse") { note(130, 520, .3, .03); note(650, 180, .4, .015, "triangle"); }
    else if (kind === "mech-shield") { note(1760, 1400, .12, .012); note(880, 690, .1, .015); }
    else if (kind === "mech-hurt") { note(180, 90, .2, .033, "triangle"); note(73, 52, .23, .025); }
    else if (kind === "mech-boom") { note(95, 28, .35, .055, "triangle"); note(240, 70, .15, .025); }
    else if (kind === "mech-break") { note(260, 85, .12, .021, "triangle"); note(1300, 600, .08, .01); }
    else if (kind === "mech-warn") { note(430, 430, .1, .014); note(520, 520, .1, .012, "sine", .15); }
    else if (kind === "mech-clear") [392, 494, 587].forEach((hz, i) => note(hz, hz, .2, .021, "triangle", i * .08));
    else if (kind === "courier-hook") { note(1650, 780, .045, .028, "triangle"); note(620, 610, .13, .021); }
    else if (kind === "courier-release") { note(380, 1100, .16, .014, "triangle"); note(930, 1600, .13, .007); }
    else if (kind === "courier-land") { note(120, 58, .09, .035, "triangle"); note(240, 110, .055, .012); }
    else if (kind === "courier-stamp") [1047, 1568].forEach((hz, i) => note(hz, hz, .14, .025, "sine", i * .05));
    else if (kind === "courier-checkpoint") [440, 554, 659].forEach((hz, i) => note(hz, hz, .22, .025, "triangle", i * .075));
    else if (kind === "courier-glass") [1780, 2640, 3510, 4300].forEach((hz, i) => note(hz, hz * .7, .16, .016, "sine", i * .024));
    else if (kind === "courier-fall") note(360, 180, .28, .019, "triangle");
    else if (kind === "courier-recover") { note(350, 560, .19, .021); note(700, 840, .16, .011, "sine", .11); }
    else if (kind === "beat") { const frequency = [261.63, 329.63, 392, 523.25][Number(material) % 4] ?? 261.63; note(frequency, frequency, .22, .055, "triangle"); note(frequency * 2, frequency * 2, .1, .018); }
    else if (kind === "metronome") note(1300, 650, .03, .012, "sine");
    else if (kind === "launch") { note(280, 70, .24, .09, "triangle"); note(900, 240, .13, .025); }
    else if (kind === "boost") note(200, 1600, .25, .045, "triangle");
    else if (kind === "laser") note(1000, 240, .055, .015, "triangle");
    else if (kind === "shield") { note(180, 500, .4, .04); note(360, 1000, .35, .02); }
    else if (kind === "magnet") { note(110, 220, .25, .035, "triangle"); note(440, 330, .2, .03, "sine", .1); }
    else if (kind === "chime" || kind === "powerup") [659, 988, 1318].forEach((hz, i) => note(hz, hz, .22, .035, "sine", i * .06));
    else if (kind === "slice") { note(1600, 500, .09, .028, "triangle"); note(2000, 2800, .075, .018); }
    else if (kind === "slow") { note(700, 130, .55, .035); note(1050, 195, .5, .025); }
    else if (kind === "jump") note(220, 650, .14, .035, "triangle");
    else if (kind === "glide") { note(360, 720, .4, .025); note(540, 1080, .4, .015); }
    else if (kind === "flipper") { note(120, 65, .055, .04, "triangle"); note(240, 150, .06, .018); }
    else if (kind === "bell") [800, 1600, 2370].forEach((hz, i) => note(hz, hz * .99, .35 - i * .06, .025 / (i + 1)));
    else if (kind === "brake") note(420, 180, .21, .025, "triangle");
    else if (kind === "lumen") { note(880, 880, .27, .03); note(1320, 1320, .3, .015, "sine", .05); }
    else if (kind === "rocket") note(280, 1100, .16, .025, "triangle");
    else if (kind === "intercept") { note(140, 55, .23, .045, "triangle"); note(440, 220, .2, .02); }
    else if (kind === "win") [523, 659, 784, 1047].forEach((hz, i) => note(hz, hz, .3, .055, "sine", i * .1));
    else if (kind === "lose") { note(280, 170, .23, .04, "triangle"); }
    else if (kind === "break" && material === "glass") [1450, 2200, 3100].forEach((hz, i) => note(hz, hz * .85, .13, .018, "sine", i * .025));
    else if (kind === "break" && material === "target") { note(700, 1000, .12, .06); note(1200, 1300, .14, .025, "sine", .06); }
    else if (kind === "impact" || kind === "break" || kind === "explode") {
      if (voices.size > 16) return;
      const duration = kind === "explode" ? .4 : .085;
      const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2;
      const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
      source.buffer = buffer; filter.type = "lowpass"; filter.frequency.value = kind === "explode" ? 600 : material === "metal" ? 2800 : 950; gain.gain.value = kind === "explode" ? .24 : .07;
      source.connect(filter).connect(gain).connect(context.destination); voices.add(source);
      source.onended = () => { voices.delete(source); source.disconnect(); filter.disconnect(); gain.disconnect(); }; source.start();
      if (kind === "explode") note(100, 30, .32, .11, "sine");
    }
  }
  return {
    play, stop,
    setMuted(value) { muted = Boolean(value); if (muted) stop(); },
    unlock() { if (muted) return; context ??= new AudioContext(); context.resume().catch(() => {}); },
    destroy() { stop(); context?.close().catch(() => {}); },
  };
}
