---
name: agent-stage-story-director
description: Design, implement, review, or contribute privacy-safe Agent Stage short films, animated execution stories, sound cues, and one-tap mini-games. Use for work on apps/codex-stage, Activity Story Packs, Scene Packs, Codex execution theater, or Speakon idle/play experiences where an agent's active time should feel like an original story rather than a progress indicator.
---

# Agent Stage Story Director

Create small worlds that run while an agent works. The experience is entertainment and ambient feedback, never a claim about tool progress or a control surface for the agent.

## Workflow

1. Read the relevant renderer and `references/authoring-checklist.md`.
   - For route-based shorts, also read `../agent-stage-branching-cartoon/SKILL.md`.
   - For gameplay, also read `../agent-stage-microgame-director/SKILL.md`.
2. Pick one visual grammar. Do not default to an object travelling from left to right.
3. Write four beats: opening, change, reveal, quiet loop. A loop must still make sense if the task ends after one second or lasts twenty minutes.
4. Use only safe lifecycle metadata: opaque run/span IDs, generic tool family, locale, reduced-motion and mute settings. Never render prompts, paths, commands, output, file names, names, or success before a real completion event.
5. Build the smallest deterministic state machine that supports the beats. For games, every accepted input must visibly improve the scene; no timing gates, death state, or hidden gesture unless the product explicitly calls for it.
6. Add/adjust tests before implementation. Exercise program selection, state advance, input, mute/reduced-motion fallback, and source serialization for the CDP dock.
7. Verify desktop and narrow layouts, keyboard/screen-reader text, and the embedded CDP source.

## Choose A Medium

- **Canvas 2D:** default for the injected Codex Dock. Keep it self-contained and serializable by `createAgentArcadeSource()`.
- **PixiJS:** use for a richer standalone Stage Lab renderer, many particles, filters, or asset lifecycle management. Read the `pixijs` routing skill first, then its relevant sub-skill.
- **Rive:** consider only for a supplied, locally bundled state-machine asset. Never load a remote Rive URL in a Dock or Pack.
- **Original video:** user-supplied clips stay local under the Media Library and are selected by opaque ID. First-party clips need a reviewed source file, hash, and license record.

## Story Rules

- Make a scene about transformation, rhythm, atmosphere, collage, stagecraft, world-building, or a tiny ritual. Avoid reusing the same transit metaphor.
- Sound is an optional layer, not the sole signal. Mute must leave the story readable.
- Reduced motion may shorten a story to a stable tableau, but it must retain its label and state.
- A work turn can end at any moment. Fade or settle; do not show a success animation unless a genuine completion event arrives.
- Treat a game as a toy, not a productivity test. One tap should be enough to play immediately.

## Definition Of Done

Use the checklist in [references/authoring-checklist.md](references/authoring-checklist.md) before committing a new program or pack.
