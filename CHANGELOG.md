# Changelog

## Agent Stage for Codex 0.11.1-beta.3

- Enlarge the game-only companion from 400px to 520px, retaining responsive sizing and foreground-only placement inside the Codex window bounds.
- Discover the current `codex-cli/bin/codex` layout in both Codex.app and ChatGPT.app while preserving legacy CLI paths.
- Replace the README preview with a clearly labeled illustrated working session, real game input, and task-end cleanup.
- Refresh bilingual installer guidance and explain recovery when an already-open Codex session does not emit task-start hooks.
- Validate a fresh public-source reinstall on the maintainer's Apple Silicon Mac, preserve unrelated hooks/media, and confirm real Desktop task appearance/closure through the maintainer's playtest. This is not a clean-OS, Intel or Windows certification.

## Agent Stage for Codex 0.11.1-beta.2

- Publish an English-first README with a separate Chinese edition and bilingual installation and release instructions.
- Audit the public file set, preserve third-party asset provenance, and exclude local caches, credentials and task records.
- Make the legal-input physics QA driver recover from blocked corners without changing gameplay or win conditions.
- Require both Linux and macOS regression checks before publishing installer assets.

## Agent Stage for Codex 0.11.1-beta.1

- macOS download/unzip/double-click installation with bundled arm64/x86_64 Node runtimes; no npm install or engine downloads for users.
- Fix installed-window throttling: use Interactive rather than Background process policy. Installed-path and native-input tests cover the regression.
- Check existing hook JSON before replacing runtime; preserve unrelated hooks across repeated install/removal. Require fresh window health before reporting success.
- Fix CLI entry detection for filesystem aliases, spaces and URL-encoded paths in downloaded copies; use canonical file URLs for the distribution tool and web preview server.
- Rewrite the public README around games and installation; retain trusted-action architecture separately. Add Windows browser-only experimental instructions.
- All 100 retained games remain in the task shuffle pool; 93 remain preview. This unsigned, unnotarized Mac beta is not a Windows release or proof of all-device acceptance.

## Agent Stage for Codex 0.11.0 (Source Preview)

- Added Limit Break: six precision-action games with eighteen escalating rounds, independent art and sound, same-round retries and safe task-end checkpoints.
- Reached 100 distinct source works after the previous retirement: 95 catalog packs and five standalone previews. This is not a claim of 100 release-approved games; the seven-game default rotation is unchanged.
- Added legal-input replays at 16/33 ms, mouse/touch browser checks, mock Dock lifecycle checks, local art provenance and an updated playable inventory.
- Current installed companions and historical DMGs are not changed by this source update. No public Release was published.

## Agent Stage for Codex 0.7.0

- Expanded the original ten games to twenty games and 63 stages with a first Studio batch: rally, mini-golf, gear puzzles, circuits, cards, tactics, routing, tea service, stealth and rhythm.
- Added ten original local art assets, real gameplay covers, asset provenance, distinct rules and legal-input replays for all thirty new levels.
- Added a reviewed-pack builder, integrity manifests, lightweight Codex bootstrap and one-at-a-time loading with bounded factory references. Late or stale loads cannot restart a completed task.
- Kept deterministic task selection, pinning, immediate stop, muted/reduced-motion play and existing trusted-action protocols compatible.
- Added pointer/touch/browser/Dock regression coverage, same-size integrity corruption checks, ability limits, undo, failed play and accidental-tap tests.
- Updated local installation, release packaging, the reusable game-director Skill and the incremental 1000-game roadmap. Third-party executable pack installation remains disabled pending real sandboxing.
- Known validation limit: this machine's Codex CDP port was unavailable; actual current Desktop injection and a clean-account install are not certified by browser fixture tests.

## Agent Stage for Codex 0.3.9

- Restored Dock reinjection compatibility for current Codex Desktop through the local CDP watchdog and added an updated Dock implementation version.
- Added eight story-driven animated shorts and ten accessible one-tap mini-games, with a direct program picker instead of relying on random rotation.
- Added a local-only user video library for MP4, WebM, and MOV: upload, select, stream to the Dock, and delete without exposing local paths or uploading media.
- Added the reusable `agent-stage-story-director` skill for contributors creating privacy-safe animation, sound, and one-tap play experiences.
- Fixed the Codex Hook Collector for current Node 24 runtimes and added a child-process regression test for the installed stdin-to-daemon path.

## Agent Stage for Codex 0.3.7

- Added a Finder-first macOS distribution: one install command, plus open, check, and uninstall commands.
- The installer now finds a compatible local/Codex Node runtime, installs only named Agent Stage hooks, trusts their exact hashes through the local Codex app-server, and starts the local companion automatically.
- Added a local status report for runtime, hooks, daemon health, and CDP availability.
- Added five original short programs and five one-tap games for Codex execution turns.
- Added a macOS GitHub Release workflow that builds and uploads a DMG and SHA-256 checksum on `agent-stage-v*` tags.

## FinalButton 0.2.0

- Introduced declarative Agent Stage scene packs, presentation records, ActionProof, device profiles, and local bridge examples.
