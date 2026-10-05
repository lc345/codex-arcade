# Agent Stage Authoring Checklist

## Narrative

- Name the visual grammar in the program metadata.
- Describe four loop-safe beats: opening, change, reveal, quiet loop.
- Use no fake percentages, fake tool output, or success imagery during active work.

## Interaction

- A one-tap game must accept `tap` immediately and reward every accepted tap.
- Do not require double-tap, hold, precision, or failure recovery unless the program explicitly teaches it and the product requests it.
- Input stays local to the theater. It never reaches Codex or an action authorizer.

## Assets And Privacy

- Pack assets are local, checksum-covered, and licensed; no remote URL, HTML, script, or arbitrary expression.
- User media is identified only by an opaque local media ID. Do not expose file-system paths in UI, traces, or record metadata.
- Do not use prompt, command, tool arguments, output, source content, secrets, real names, or paths.

## Accessibility And Runtime

- Give the canvas a concise accessible label and send a brief live-text update on program/start/interaction/end.
- Test mute and `prefers-reduced-motion`.
- Verify 60fps-friendly bounded drawing, teardown of audio/video resources, and that `createAgentArcadeSource()` contains every new helper it needs.
- Test a narrow Dock and a full Stage Lab view.
