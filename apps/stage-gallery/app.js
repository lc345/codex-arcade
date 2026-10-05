import { createStageEvent, createScenePack, StageRuntime } from "/packages/stage-core-ts/src/index.js";
import { createStageRenderer } from "/packages/stage-web/src/index.js";

const gallery = document.querySelector("#gallery");
const soundToggle = document.querySelector("#sound");

function stageEventFor(pack, status) {
  const category = pack.matches.categories[0];
  const isMail = category === "communication.send";
  return createStageEvent({
    request: {
      actionDigest: "b".repeat(64),
      action: { category, risk: "medium" },
      card: { title: "Quarterly review", summary: "A Gallery preview.", target: "Morgan Lee", impact: "Sends one message." },
    },
    status,
    contract: { holdMs: 1200, allowedOutcomes: ["approve_once", "deny", "defer"], deviceProfile: "browser-virtual-device" },
    descriptor: {
      actionKind: isMail ? "email.send" : category,
      channel: isMail ? "email" : "generic",
      actorLabel: "You",
      recipientLabel: "Morgan Lee",
      recipientCount: 1,
      actionSummary: "Quarterly review",
    },
    context: {
      privacyMode: "summary-only",
      locale: "zh-CN",
      timeOfDay: pack.id === "quiet-night" ? "night" : "day",
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      deviceCapabilities: ["screen", "light", "audio"],
      selectionSeed: "b".repeat(64),
    },
  });
}

function playPreviewTone(presentation) {
  if (!soundToggle.checked || !presentation.commands.some((command) => command.channel === "audio")) return;
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = presentation.record.scene.variantId.includes("failed") ? 180 : 520;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.05, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.24);
}

async function loadCard(entry) {
  const sceneUrl = new URL(`${entry.path}/scene.json`, import.meta.url);
  const pack = createScenePack(await (await fetch(sceneUrl)).json());
  const initialStatus = entry.preview?.status ?? pack.matches.states[0];
  const card = document.createElement("article");
  card.className = "pack-card";
  card.innerHTML = `
    <canvas width="640" height="300" aria-label="${pack.id} animated scene preview"></canvas>
    <div class="card-body">
      <div class="card-top"><h2>${pack.id}</h2><span>v${pack.version}</span></div>
      <p>${pack.matches.categories.join(" · ")}</p>
      <div class="controls">
        <label>Lifecycle <select>${pack.matches.states.map((status) => `<option value="${status}"${status === initialStatus ? " selected" : ""}>${status}</option>`).join("")}</select></label>
        <button type="button">Replay</button>
      </div>
      <dl><div><dt>Languages</dt><dd>${(pack.locales ?? ["legacy"]).join(", ")}</dd></div><div><dt>Devices</dt><dd>Web · Bridge · Speakon</dd></div></dl>
      <code>npx agent-stage preview ./scene-packs/${pack.id}</code>
      <code>npm install @agent-stage/core @agent-stage/web</code>
      <a href="${sceneUrl}" target="_blank" rel="noreferrer">View scene.json</a>
    </div>`;
  const canvas = card.querySelector("canvas");
  const select = card.querySelector("select");
  const replay = card.querySelector("button");
  const renderer = createStageRenderer(canvas, { onCaption: () => {} });

  async function render() {
    const event = stageEventFor(pack, select.value);
    const presentation = await new StageRuntime({ packs: [pack] }).present(event);
    renderer.render(presentation, { slots: event.slots, reducedMotion: event.context.reducedMotion });
    playPreviewTone(presentation);
  }

  select.addEventListener("change", () => void render());
  replay.addEventListener("click", () => void render());
  await render();
  return card;
}

try {
  const manifest = await (await fetch("/apps/stage-gallery/packs.json")).json();
  const cards = await Promise.all(manifest.packs.map(loadCard));
  cards.forEach((card) => gallery.append(card));
} catch (error) {
  console.error(error);
  gallery.textContent = "The Gallery manifest could not be loaded. Run `agent-stage gallery scene-packs apps/stage-gallery/packs.json`.";
}
