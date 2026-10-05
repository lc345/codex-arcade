export const ACTION_CATALOG = {
  "email-send": {
    label: "Email",
    eyebrow: "External message",
    mark: "MAIL",
    scenes: ["mail-flight", "prism-relay", "paper-courier", "neon-run", "inkwell-atelier"],
  },
  "phone-call": {
    label: "Call",
    eyebrow: "Live voice",
    mark: "CALL",
    scenes: ["open-line", "voice-orbit", "switchboard"],
  },
  "slack-send": {
    label: "Slack",
    eyebrow: "Team signal",
    mark: "CHAT",
    scenes: ["city-dispatch", "prism-relay", "paper-courier", "neon-run", "chorus-room"],
  },
  "calendar-create": {
    label: "Calendar",
    eyebrow: "Schedule change",
    mark: "TIME",
    scenes: ["paper-courier", "calendar-orbit", "time-garden"],
  },
  deploy: {
    label: "Deploy",
    eyebrow: "Production change",
    mark: "SHIP",
    scenes: ["mission-control", "launch-rail", "release-forge"],
  },
  "file-share": {
    label: "File",
    eyebrow: "Access grant",
    mark: "FILE",
    scenes: ["paper-courier", "prism-relay", "city-dispatch", "neon-run", "vault-ritual"],
  },
};

export const SCENE_CATALOG = {
  "mail-flight": { title: "Mail Flight", detail: "Fold, seal, and arc a letter across the stage.", family: "paper" },
  "prism-relay": { title: "Prism Relay", detail: "Charge a photon and send it through a rotating gate.", family: "prism" },
  "paper-courier": { title: "Paper Courier", detail: "A tactile courier story with stamps and delivery trails.", family: "paper" },
  "open-line": { title: "Open Line", detail: "A restrained connection cue for a live voice action.", family: "line" },
  "voice-orbit": { title: "Voice Orbit", detail: "Two voices trade luminous pulses around a shared orbit.", family: "voice" },
  "city-dispatch": { title: "City Dispatch", detail: "Route a team signal through a living control map.", family: "city" },
  "calendar-orbit": { title: "Time Orbit", detail: "Lock a new moment into a small planetary schedule.", family: "time" },
  "mission-control": { title: "Mission Control", detail: "A deliberate mission window for consequential releases.", family: "mission" },
  "launch-rail": { title: "Launch Rail", detail: "Build pressure, ignite, and send a release downrange.", family: "launch" },
  "neon-run": { title: "Neon Run", detail: "Launch a data courier through a vivid city-scale signal lane.", family: "neon" },
  "inkwell-atelier": { title: "Inkwell Atelier", detail: "A letter is composed as ink, rhythm, and a closing seal.", family: "story" },
  switchboard: { title: "Switchboard", detail: "A live call wakes a human switchboard and finds a safe line.", family: "story" },
  "chorus-room": { title: "Chorus Room", detail: "A team signal gathers a small room of voices before it lands.", family: "story" },
  "time-garden": { title: "Time Garden", detail: "A new moment is planted, tended, and blooms into the schedule.", family: "story" },
  "release-forge": { title: "Release Forge", detail: "A production change is heated, struck, and shielded before release.", family: "story" },
  "vault-ritual": { title: "Vault Ritual", detail: "Access is revealed through a deliberate vault-opening ceremony.", family: "story" },
};

export const GESTURE_CATALOG = [
  { id: "seal-duo", title: "Hold ring", detail: "Hold to approve. Details, later, and deny stay separate.", mark: "HOLD" },
  { id: "seal-one", title: "Pocket seal", detail: "Tap for context, then hold one compact physical control.", mark: "SEAL" },
  { id: "pulse", title: "Pulse", detail: "Tap replays, double tap denies, long press approves.", mark: "PULSE" },
  { id: "seal-dial", title: "Decision dial", detail: "Choose approve, later, or deny, then hold to commit it.", mark: "DIAL" },
  { id: "tap-three", title: "Triple tap", detail: "Three distinct taps form one deliberate approval gesture.", mark: "TAP 3" },
];

export function scenesForAction(recipeId) {
  return ACTION_CATALOG[recipeId]?.scenes ?? [];
}

export function defaultSceneForAction(recipeId) {
  return scenesForAction(recipeId)[0] ?? "quiet-night";
}
