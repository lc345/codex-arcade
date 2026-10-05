const DIAL_DECISIONS = {
  approve_once: { type: "HOLD_COMPLETE" },
  defer: { type: "DEFER", method: "dial" },
  deny: { type: "DENY", method: "dial" },
};

export function getProfilePresentation(profile, dialChoice = "approve_once") {
  if (profile === "tap-three") {
    return {
      gesture: "Triple tap to approve",
      sealLabel: "Tap 3x",
      caption: "Three short, separate taps approve once. A pause resets the sequence.",
      showStageActions: false,
      showDial: false,
      tapSequence: 3,
      quickPress: "tap_sequence",
      holdEvent: { type: "HOLD_COMPLETE" },
    };
  }

  if (profile === "pulse") {
    return {
      gesture: "Tap replay + double tap deny + hold",
      sealLabel: "Hold",
      caption: "Tap replays the scene. Double tap denies. Hold to approve once.",
      showStageActions: false,
      showDial: false,
      quickPress: "replay",
      doublePress: "deny",
      holdEvent: { type: "HOLD_COMPLETE" },
    };
  }

  if (profile === "seal-one") {
    return {
      gesture: "Tap details + hold",
      sealLabel: "Hold to approve",
      caption: "Tap for details. Hold to commit once.",
      showStageActions: false,
      showDial: false,
      quickPress: "reveal",
      holdEvent: { type: "HOLD_COMPLETE" },
    };
  }

  if (profile === "seal-dial") {
    const decision = DIAL_DECISIONS[dialChoice] ?? DIAL_DECISIONS.approve_once;
    return {
      gesture: `Dial: ${dialChoice.replace(/_/g, " ")}`,
      sealLabel: "Hold to commit",
      caption: "Choose an outcome, then hold the center seal to commit it.",
      showStageActions: false,
      showDial: true,
      quickPress: "cancel",
      holdEvent: decision,
    };
  }

  return {
    gesture: "Hold + deny",
    sealLabel: "Hold to approve",
    caption: "Hold the seal to approve. Use the side controls to defer or deny.",
    showStageActions: true,
    showDial: false,
    quickPress: "cancel",
    holdEvent: { type: "HOLD_COMPLETE" },
  };
}
