const cueNotes = {
  "mail.ready": [[349, 0.07], [440, 0.11]],
  "mail.seal": [[330, 0.06], [392, 0.08]],
  "mail.flight": [[440, 0.06], [523, 0.08], [659, 0.14]],
  "mail.delivered": [[659, 0.08], [784, 0.16]],
  "prism.charge": [[262, 0.08], [330, 0.08], [494, 0.15]],
  "prism.lock": [[392, 0.06], [494, 0.08], [587, 0.11]],
  "prism.flight": [[440, 0.05], [554, 0.06], [659, 0.08], [880, 0.15]],
  "prism.arrive": [[587, 0.06], [740, 0.08], [880, 0.16]],
  "voice.ring": [[294, 0.05], [370, 0.06], [294, 0.05], [440, 0.12]],
  "voice.lock": [[392, 0.05], [523, 0.08], [659, 0.1]],
  "voice.bridge": [[330, 0.05], [494, 0.07], [659, 0.1], [784, 0.12]],
  "voice.connected": [[523, 0.07], [659, 0.09], [880, 0.16]],
  "time.tick": [[523, 0.05], [659, 0.05], [784, 0.09]],
  "time.lock": [[330, 0.05], [440, 0.06], [554, 0.1]],
  "time.insert": [[440, 0.05], [523, 0.07], [659, 0.12]],
  "time.confirmed": [[523, 0.06], [659, 0.08], [784, 0.14]],
  "rail.arm": [[165, 0.07], [220, 0.07], [294, 0.1]],
  "rail.lock": [[220, 0.06], [294, 0.07], [392, 0.1]],
  "rail.launch": [[196, 0.05], [294, 0.06], [440, 0.08], [659, 0.16]],
  "rail.stable": [[523, 0.07], [659, 0.09], [880, 0.15]],
  "neon.scan": [[196, 0.05], [294, 0.05], [440, 0.07], [659, 0.1]],
  "neon.lock": [[220, 0.05], [330, 0.06], [494, 0.08], [740, 0.1]],
  "neon.run": [[165, 0.05], [247, 0.05], [370, 0.06], [554, 0.08], [831, 0.13]],
  "neon.arrive": [[392, 0.05], [587, 0.06], [784, 0.08], [1175, 0.16]],
  "neon.abort": [[247, 0.08], [196, 0.1], [147, 0.14]],
  "ink.dip": [[262, 0.07], [330, 0.08], [392, 0.1]],
  "ink.stroke": [[330, 0.05], [440, 0.06], [523, 0.09]],
  "ink.seal": [[440, 0.07], [659, 0.1], [784, 0.15]],
  "switchboard.ring": [[294, 0.06], [440, 0.06], [294, 0.06], [523, 0.1]],
  "switchboard.route": [[220, 0.05], [330, 0.06], [494, 0.08], [659, 0.1]],
  "switchboard.live": [[523, 0.08], [659, 0.08], [784, 0.14]],
  "chorus.hum": [[262, 0.06], [330, 0.06], [392, 0.08]],
  "chorus.join": [[330, 0.06], [440, 0.07], [554, 0.09], [659, 0.12]],
  "chorus.complete": [[494, 0.06], [659, 0.08], [880, 0.15]],
  "garden.seed": [[220, 0.08], [330, 0.08], [440, 0.1]],
  "garden.tend": [[294, 0.05], [392, 0.06], [523, 0.09]],
  "garden.bloom": [[440, 0.07], [554, 0.08], [740, 0.11], [880, 0.16]],
  "forge.arm": [[147, 0.08], [196, 0.08], [247, 0.1]],
  "forge.strike": [[110, 0.05], [165, 0.06], [247, 0.08], [370, 0.11]],
  "forge.stable": [[392, 0.07], [523, 0.08], [659, 0.14]],
  "vault.listen": [[196, 0.07], [247, 0.07], [330, 0.09]],
  "vault.release": [[294, 0.06], [392, 0.07], [523, 0.1]],
  "vault.open": [[440, 0.07], [587, 0.08], [784, 0.15]],
  "line.open": [[392, 0.09], [523, 0.13]],
  "line.connected": [[659, 0.08], [784, 0.16]],
  "dispatch.depart": [[330, 0.07], [440, 0.1]],
  "dispatch.arrive": [[523, 0.08], [659, 0.13]],
  "paper.sort": [[294, 0.06], [370, 0.09]],
  "paper.stamp": [[220, 0.07]],
  "paper.delivered": [[440, 0.09], [587, 0.13]],
  "mission.ready": [[196, 0.1], [247, 0.1], [294, 0.14]],
  "mission.launch": [[294, 0.08], [392, 0.08], [523, 0.16]],
  "mission.complete": [[523, 0.1], [659, 0.15]],
  "error.soft": [[220, 0.15], [165, 0.18]],
};

export function createAudioRenderer() {
  let context = null;
  let enabled = true;
  let toneKit = null;

  async function unlockTone() {
    const Tone = globalThis.Tone;
    if (!Tone) return false;
    await Tone.start();
    if (!toneKit) {
      const echo = new Tone.PingPongDelay({ delayTime: "16n", feedback: 0.16, wet: 0.18 }).toDestination();
      const synth = new Tone.PolySynth(Tone.Synth).connect(echo);
      synth.set({ volume: -15, oscillator: { type: "sine" }, envelope: { attack: 0.008, decay: 0.08, sustain: 0.18, release: 0.18 } });
      const neon = new Tone.FMSynth({ harmonicity: 2.2, modulationIndex: 10, envelope: { attack: 0.004, decay: 0.12, sustain: 0.06, release: 0.2 } }).toDestination();
      neon.volume.value = -20;
      const noise = new Tone.NoiseSynth({ noise: { type: "pink" }, envelope: { attack: 0.004, decay: 0.06, sustain: 0, release: 0.08 } }).toDestination();
      noise.volume.value = -30;
      toneKit = { Tone, synth, neon, noise };
    }
    return true;
  }

  async function unlock() {
    if (!enabled) return;
    if (await unlockTone()) return;
    if (!globalThis.AudioContext) return;
    context ??= new globalThis.AudioContext();
    if (context.state === "suspended") await context.resume();
  }

  function playFallbackCue(cue, gainName = "normal") {
    if (!context || context.state !== "running") return;
    const notes = cueNotes[cue] ?? cueNotes["dispatch.arrive"];
    const master = context.createGain();
    master.gain.value = gainName === "quiet" ? 0.025 : 0.055;
    master.connect(context.destination);
    let offset = 0;
    for (const [frequency, duration] of notes) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, context.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(1, context.currentTime + offset + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + offset + duration);
      oscillator.connect(gain).connect(master);
      oscillator.start(context.currentTime + offset);
      oscillator.stop(context.currentTime + offset + duration + 0.02);
      offset += duration * 0.72;
    }
  }

  function playToneCue(cue, gainName = "normal") {
    if (!toneKit) return false;
    const notes = cueNotes[cue] ?? cueNotes["dispatch.arrive"];
    const when = toneKit.Tone.now() + 0.015;
    const velocity = gainName === "quiet" ? 0.16 : 0.34;
    let offset = 0;
    for (const [frequency, duration] of notes) {
      toneKit.synth.triggerAttackRelease(frequency, duration, when + offset, velocity);
      offset += duration * 0.72;
    }
    if (cue.startsWith("neon.")) {
      toneKit.neon.triggerAttackRelease(cue.endsWith("abort") ? 82 : 110, "16n", when, gainName === "quiet" ? 0.14 : 0.28);
      toneKit.noise.triggerAttackRelease("32n", when + 0.045, gainName === "quiet" ? 0.1 : 0.22);
    }
    return true;
  }

  function speak(text) {
    if (!enabled || (!context && !toneKit) || !globalThis.speechSynthesis || !text) return;
    globalThis.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 160));
    utterance.lang = "zh-CN";
    utterance.rate = 1.03;
    utterance.volume = 0.42;
    globalThis.speechSynthesis.speak(utterance);
  }

  return {
    unlock,
    setEnabled(value) {
      enabled = Boolean(value);
      if (!enabled && globalThis.speechSynthesis) globalThis.speechSynthesis.cancel();
    },
    render(commands, { voice = false } = {}) {
      if (!enabled) return;
      for (const command of commands.filter((item) => item.channel === "audio")) {
        if (!playToneCue(command.cue, command.gain)) playFallbackCue(command.cue, command.gain);
      }
      if (voice) {
        const spoken = commands.find((item) => item.channel === "speech");
        if (spoken) speak(spoken.text);
      }
    },
  };
}
