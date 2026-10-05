# Studio Pack Workflow

Use the current implementation, not an assumed third-party plugin API. Start with `docs/ARCADE_FIVE.zh-CN.md`, `docs/CODEX_STAGE.md` and `docs/PLAYABLE_INVENTORY.zh-CN.md`. The original Studio 20 games were retired.

## Rules and Registration

Each game exports a world factory and a painter. Existing Studio worlds use `createStudioKernel` for fixed-step state, lifecycle and input guards. Pure board/timing rules must not depend on DOM, a clock read or Agent data. Rigid-body games use the reviewed vendored Matter.js engine. Follow `arcade-five/catalog.js` and `packs/build.js` for registration; do not recreate the removed `studio/catalog.js`.

The host owns start, task identity, selection, cache and stop. Factories receive only a Canvas and display callbacks. Preserve stale-load cancellation and the latest-selection epoch. Avoid game-specific changes to the CDP injector: browser and Dock receive the same selected factory from `packs/build.js`.

## Art and Feedback

Make a distinctive visual brief before drawing. Compose actual gameplay pieces, not only a background. Generated environments leave the board area clear; readable state and hit areas remain code-driven. Character atlases require edge/alpha/crop checks in the running game. Record prompts, transformations and licenses in `assets/studio/ARTWORK.md` and `art-manifest.json`.

Use `tools/build-studio-assets.mjs`, `tools/build-game-packs.mjs`, then `tools/build-studio-previews.mjs`. Covers must show real playable frames. Audio belongs to gameplay events, with bounded voices, distinct cues and synchronous stop. A silent player must still understand threats and outcomes.

## Acceptance Evidence

- A legal-input replay for every authored level, through the public world methods. Reading state to choose a move is allowed; changing state to force victory is not.
- Separate tests for failure, invalid input, retries, undo/ability limits and stop. A victory replay is not evidence those boundaries work.
- Real pointer, keyboard and touch checks. Verify first load requests only one pack, hash corruption fails closed, late loads cannot resurrect completed tasks and manual switches cannot leave old voices running.
- Desktop and narrow-window screenshots, animated pixel checks, loaded assets and human inspection. Automated passes do not certify fun or visual taste.
- Existing FinalButton, ActionProof, Stage Pack, Python and old arcade regressions remain intact.

## External Method References

Hypit (`https://github.com/hypit-ai/hypit`) was reviewed on 2026-09-17 as a video workflow reference: composition, asset separation, reproducible variants and previews. This document and the game implementations are independently written. Hypit is not a game engine and no Hypit files are vendored. Its modified Apache-2.0 license has additional redistribution/service conditions; inspect the current LICENSE before any future integration. Do not run its installer, enable paid providers or copy templates as an implicit part of making a game.

The current catalog includes Canvas, Three.js and a Godot web export. The broader roadmap is not a release promise; do not claim a new engine or untrusted-code sandbox exists merely because an adapter boundary exists.
