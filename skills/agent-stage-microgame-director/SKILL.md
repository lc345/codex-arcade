---
name: agent-stage-microgame-director
description: Design, implement, and test original compact games for Agent Stage or future Speakon buttons. Use when a request involves arcade mechanics, single-button play, double-tap modifiers, game feel, level variation, Canvas interaction, or activity-time entertainment.
---

# Agent Stage Microgame Director

Build a complete, satisfying compact game that runs locally while an agent is active. Its score and input belong only to the arcade and never control Codex. Decorative motion and points-per-click are not substitutes for actual mechanics.

## Workflow

1. Read `apps/codex-stage/packs/host.js`, `studio/kernel.js`, the closest game in `studio/`, and [game-patterns.md](references/game-patterns.md). Consult [Studio pack workflow](references/studio-packs.md) for build and validation paths. Extend the catalog and shuffle bag without changing mid-task selection.
2. Choose one original player verb. Examples: switch lane, bounce, launch, tune, plant, or steer. Do not clone a named game, its art, sound, characters, or level layout.
3. Prefer direct manipulation when the genre needs it, such as drag-to-aim. Support keyboard access and semantic tap/doubleTap as alternatives, not as limitations on the main experience.
4. Model the smallest deterministic state: score, short feedback windows, a bounded seed, and no dependency on agent output.
5. Design a 5-second teachable loop, real progression, authored levels and a clean interruption frame. Failure may invite immediate retry; never gate Agent work or impose a wait before retry.
6. Add tests first for physics/collision outcomes, accepted/rejected input, winnability, missed shots, source serialization and synchronous stop. Never award score merely for an input. Test browser clicks for unintended bubbling resets.
7. Verify Canvas performance, muted feedback, reduced motion, touch/keyboard input, and a narrow Dock.
8. Prove every new level is winnable through player controls with real physics, not body teleporting or score mutation. Add a controller to `tools/studio-replays.mjs` and assertions in `studio.test.js`; keep the Studio, slingshot and collection browser QA suites passing.

## Mechanics Rule

Use a mature genre only as a mechanical reference:

- Flight arcade: automatic movement plus a lane switch or shield.
- Pinball: autonomous motion plus player-created bumpers or magnets.
- Slingshot physics: drag aim, release, actual collision damage and different ammunition/materials.

The shipped work must have an original title, world, geometry, assets, audio, and progression. Use the reviewed vendored Matter.js engine for rigid-body physics. The Dock stays self-contained: no CDN, runtime package install, or remote asset URLs. Keep licenses and asset provenance with the project.

## Implementation Shape

Keep rules, rendering, audio and input/lifecycle separate. Build selected reviewed packs through `packs/build.js`; never add all games or all assets to the default Dock bootstrap. `createAgentArcadeSource()` without a pack ID remains only a legacy compatibility path. Stop must reject input, freeze physics, cancel RAF and stop audio immediately, including while paused or loading. Exercise pointer drag, touch, keyboard and the lazy Dock in Playwright, and inspect screenshots rather than trusting green structural tests. These reviewed first-party packs run in the host page; do not treat Shadow DOM or a content digest as a sandbox for arbitrary community JavaScript.

Read [game-patterns.md](references/game-patterns.md) before inventing a new game or reviewing whether two games are too similar.
