const palettes = {
  warning: { accent: "#f3ad4e", glow: "rgba(243, 143, 61, .52)", mode: "warning" },
  holding: { accent: "#ffe08b", glow: "rgba(255, 195, 72, .64)", mode: "holding" },
  arrival: { accent: "#79d3bf", glow: "rgba(77, 194, 175, .52)", mode: "arrival" },
  success: { accent: "#87d89d", glow: "rgba(83, 196, 132, .54)", mode: "success" },
  quiet: { accent: "#9eb5dc", glow: "rgba(105, 135, 191, .28)", mode: "quiet" },
  denied: { accent: "#d68c86", glow: "rgba(171, 78, 70, .32)", mode: "denied" },
  deferred: { accent: "#aebbe1", glow: "rgba(115, 133, 188, .3)", mode: "deferred" },
  failure: { accent: "#e58c71", glow: "rgba(198, 82, 57, .42)", mode: "failure" },
  prism: { accent: "#70e3d3", glow: "rgba(71, 212, 199, .52)", mode: "prism" },
  voice: { accent: "#8ee7df", glow: "rgba(68, 197, 189, .48)", mode: "voice" },
  time: { accent: "#a7c5ff", glow: "rgba(103, 142, 224, .45)", mode: "time" },
  rail: { accent: "#f0b967", glow: "rgba(240, 126, 75, .52)", mode: "rail" },
  neon: { accent: "#62e7ff", glow: "rgba(195, 65, 230, .54)", mode: "neon" },
  garden: { accent: "#9ee2af", glow: "rgba(72, 181, 133, .5)", mode: "garden" },
  forge: { accent: "#ffad5b", glow: "rgba(232, 76, 53, .54)", mode: "forge" },
  vault: { accent: "#80dfe0", glow: "rgba(51, 151, 164, .48)", mode: "vault" },
  chorus: { accent: "#e4a1f2", glow: "rgba(181, 82, 210, .52)", mode: "chorus" },
  ink: { accent: "#b5c8ff", glow: "rgba(91, 116, 215, .48)", mode: "ink" },
  neutral: { accent: "#e6bd66", glow: "rgba(230, 189, 102, .28)", mode: "neutral" },
};

export function lightProfileFor(token) {
  if (token.startsWith("prism.")) {
    if (token.endsWith("bloom")) return palettes.arrival;
    if (token.endsWith("return")) return palettes.failure;
    if (token.endsWith("lock")) return palettes.holding;
    return palettes.prism;
  }
  if (token.startsWith("voice.")) return token.endsWith("connected") ? palettes.arrival : palettes.voice;
  if (token.startsWith("time.")) return token.endsWith("confirmed") ? palettes.success : palettes.time;
  if (token.startsWith("rail.")) return token.endsWith("stable") ? palettes.success : palettes.rail;
  if (token.startsWith("neon.")) return token.endsWith("arrive") ? palettes.arrival : token.endsWith("abort") ? palettes.failure : palettes.neon;
  if (token.startsWith("garden.")) return token.endsWith("bloom") ? palettes.success : palettes.garden;
  if (token.startsWith("forge.")) return token.endsWith("stable") ? palettes.success : palettes.forge;
  if (token.startsWith("vault.")) return token.endsWith("open") ? palettes.arrival : palettes.vault;
  if (token.startsWith("chorus.")) return token.endsWith("complete") ? palettes.success : palettes.chorus;
  if (token.startsWith("ink.")) return token.endsWith("seal") ? palettes.success : palettes.ink;
  if (token.startsWith("quiet.")) return palettes.quiet;
  if (token.includes("denied")) return palettes.denied;
  if (token.includes("deferred")) return palettes.deferred;
  if (token.includes("failed") || token.includes("abort") || token.includes("error") || token.includes("stale")) return palettes.failure;
  if (token.includes("hold")) return palettes.holding;
  if (token.includes("warning")) return palettes.warning;
  if (token.includes("arrive") || token.includes("connected") || token.includes("delivered")) return palettes.arrival;
  if (token.includes("complete") || token.includes("stable") || token.includes("confirm")) return palettes.success;
  return palettes.neutral;
}

export function applyLight(element, command) {
  if (!command || command.channel !== "light") return;
  const profile = lightProfileFor(command.token);
  element.dataset.sceneLight = profile.mode;
  element.style.setProperty("--scene-accent", profile.accent);
  element.style.setProperty("--scene-glow", profile.glow);
  element.dataset.sceneToken = command.token;
}
