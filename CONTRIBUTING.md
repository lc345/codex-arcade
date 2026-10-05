# Contributing to Agent Stage

Contribute a game, improve an existing one, or help test the macOS install. Open an issue before changing lifecycle protocols, privacy boundaries or digest semantics. Historical Scene Packs and trusted-action modules remain compatible but are not the main player experience.

For games, start with [Arcade Five](docs/ARCADE_FIVE.zh-CN.md), the current [playable inventory](docs/PLAYABLE_INVENTORY.zh-CN.md) and the [game-director Skill](skills/agent-stage-microgame-director/SKILL.md). Studio 20 is historical, not the supported starting template. Gameplay code is reviewed as first-party code before shipping; the app does not install arbitrary community JavaScript. Include distinct mechanics, playable levels, licensed local artwork, legal-input replays and desktop/mobile screenshots. A passing test proves a rule, not that a game is enjoyable: include playtest feedback before requesting official catalog inclusion.

Test a 400px game-only window, real pointer input, mute, pause/resume and task completion during loading. Mac performance must include the installed launchd path, not just a browser tab. Never set the UI host's ProcessType to Background. See [performance acceptance](docs/COMPANION_PERFORMANCE.zh-CN.md). Do not include output directories, private hook configurations, task logs or local tokens in a PR.

For a compact five-game example, see [Arcade Five](docs/ARCADE_FIVE.zh-CN.md) and `apps/codex-stage/arcade-five/`. Its worlds, painters and sound palettes stay distinct while lifecycle and input cleanup are shared. See the [100-game roadmap](docs/ROAD_TO_100.zh-CN.md) for acceptance gates and the difference between prototypes, catalog entries and released games. New content must not silently expand the default random or curated pools.

For ball sports and timing toys, see [Sports Ten](docs/SPORTS_TEN.zh-CN.md). The ten worlds each have three legal-input completion replays, failure checks, local artwork provenance, touch cancellation and task-stop checks. A game must require player judgment; add a negative test for passive or indiscriminate input where relevant. Do not count levels or palette swaps as separate games.

For non-sports, pointer-first miniatures, see [Odd Ten](docs/ODD_TEN.zh-CN.md). Its ten independent worlds include keyboard pointer routing, limited-palette pixel art, editable original SVG scenery and three isolated Matter packs. Keep visible goal boundaries synchronized with rule geometry, test actual mouse completions, and distinguish a simulated Dock test from a live Codex installation.

For approachable but more demanding games, see [Challenge Ten](docs/CHALLENGE_TEN.zh-CN.md). Keep timing windows achievable across frame rates, make geometry match the stroke or collision that the player sees, hide memory answers after the preview, and score settled physics outcomes rather than clicks. Its ten games use distinct art directions and three-round public-input replays; four generated backdrops include their original prompts and all assets have hash-bound provenance. A new preview does not automatically join the stable or curated rotation.

Before opening a pull request:

1. Add tests for behavior changes.
2. Run the TypeScript and Python suites.
3. Run `node packages/core-ts/src/cli.ts verify recipes` for recipe changes.
4. Run `node packages/stage-core-ts/src/cli.js verify scene-packs/your-pack` for every new V2 Scene Pack.
5. Add `scene.json`, `preview.json`, `README.md`, `LICENSE`, and only licensed local assets to a new Scene Pack.
6. Do not add provider credentials, production receipts, personal data, unlicensed audio/portraits/brand assets, or secrets to examples.

Protocol changes need an explanation of compatibility and a test vector. Scene Packs cannot add executable code, remote resources, arbitrary SVG behavior, or commands that alter confirmation, risk, targets, expiry, or outcomes.
