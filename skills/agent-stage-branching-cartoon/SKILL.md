---
name: agent-stage-branching-cartoon
description: Create or review original, privacy-safe branching cartoon shorts for Agent Stage. Use when adding an interactive short, recurring character, split route, storyboard, or local animation pack in apps/codex-stage or a future Speakon stage pack.
---

# Agent Stage Branching Cartoon

Make a small interactive episode that is entertaining while an agent works. It is never a visualization of hidden work and must be able to stop at any instant.

## Workflow

1. Read `apps/codex-stage/arcade.js`, the Story Director skill, and [story-patterns.md](references/story-patterns.md).
2. Pick one visual grammar and a character with a visible desire. Do not imitate a named studio or reuse a familiar character.
3. Write a three-beat episode: hook, fork, consequence. Each beat needs a stable loop pose so the runtime can stop cleanly.
4. Define no more than two local choices at a fork: `tap` for the first route and `doubleTap` for the second. Choices alter only entertainment state.
5. Represent the route as a small deterministic array. Do not use prompts, tool arguments, source files, names, paths, output, or a real result.
6. Implement Canvas states and sound cues, then add tests before code for program metadata, choice order, rejected gestures, and CDP source serialization.
7. Check mute, reduced motion, keyboard input, narrow Dock layout, and exit while any chapter is active.

## Narrative Contract

- A branch should reveal a different scene, not merely recolor the same scene.
- The ending is a quiet cut-away when the turn stops, never a reward that implies Codex succeeded.
- A serial may remember only local, user-owned play state. It must never be tied to model reasoning or task success.
- Keep dialogue optional and generic. The visual story has to read without sound.

## Implementation Shape

Use a program entry with `kind: "short"`, `interactive: true`, and a unique `grammar`. Add its session state in `createGameSession()`, declare choices through `programControls()`, and render it in `createAgentArcade()`. Include every external helper in `createAgentArcadeSource()`.

Read [story-patterns.md](references/story-patterns.md) when designing a new episode or reviewing continuity across a series.
