# Agent Stage

![Agent Stage animated demo: play a jumping game while a task runs, then the game stops and closes](docs/media/readme-preview.gif)

*An illustrated Codex session: project exploration, code changes and tests continue while the real game engine runs in a 520px companion. Not a Codex screen recording; no private conversations. [Static preview](docs/media/readme-preview.png).*

**Your agent works. You play.**

English | [简体中文](README.zh-CN.md)

100 local mini-games for the time you spend waiting for Codex. A small game-only window appears at the bottom-right of Codex while a task runs, then stops and closes when the task finishes or is interrupted. Shuffle games whenever you like during a long task.

**Community project. Not an official OpenAI product. macOS Beta.** No Codex app patching, theme changes or debug port required.

## Install on Mac

**[Download macOS Beta 4](https://github.com/lc345/codex-arcade/releases/tag/agent-stage-v0.11.1-beta.4)**: includes always-visible **shuffle** and **close** buttons in the upper-right corner of the 520px companion. Closing a game does not stop Codex; a new task can show a game again. Automatic appearance and task-end closure were confirmed in a real Desktop task on the maintainer's Apple Silicon Mac; other machines still need testing.

1. Install, open and sign into **Codex Desktop**.
2. Download **[Agent-Stage-for-Codex.zip](https://github.com/lc345/codex-arcade/releases/download/agent-stage-v0.11.1-beta.4/Agent-Stage-for-Codex.zip)**. Double-click to extract it.
3. Open the extracted folder and double-click **Install Agent Stage.command**. Wait for the installer to finish, then return to Codex and send a **new task**.

That is the complete setup. **No terminal commands, npm install, game engine, Python or API key required.** The installer opens Terminal to run its four checks/install steps; leave that window open until it reports success.

The full ZIP includes official Node runtimes for both Apple Silicon and Intel. It downloads no dependencies during installation. You can delete the downloaded folder afterward. The DMG contains the same installer; choose ZIP or DMG, not both.

**Download the named Release asset, not GitHub's “Source code (zip)” or “Code > Download ZIP.”** Source archives are for developers and do not include the bundled runtime.

### First-open security prompt

This beta is **unsigned and unnotarized**. macOS may block the first launch. Verify the source and Release SHA-256 file; only if you trust the download, follow [Apple's instructions](https://support.apple.com/en-us/102445) to allow it in **System Settings > Privacy & Security**. Never disable Gatekeeper globally. Stop and report malware or damaged-file warnings instead of forcing the app to open.

[Installer guide, English and Chinese](macos/README.md) | [Detailed Chinese troubleshooting](docs/QUICK_START.zh-CN.md) | [Documentation index](docs/README.md)

## What happens while you work?

| Action | Companion behavior |
| --- | --- |
| Send a new Codex task | A roughly 520px-wide game appears at Codex's lower-right corner |
| Codex thinks or calls tools | Keep playing; not limited to a particular tool |
| Click shuffle in the upper-right corner | Immediately switch to a different random game |
| Click the upper-right close icon | Close this turn's game without stopping Codex; a new task can show a game again |
| A task runs longer than three minutes | Random mode can rotate at a safe ready/result state after five seconds without input |
| Switch apps or minimize Codex | The companion hides and pauses; return to resume |
| Codex finishes or is interrupted | Input, simulation, animation and sound stop; the companion closes |
| Focus the game and press Escape | Dismiss the game for this turn without stopping Codex |

The popup contains the game and essential HUD, not the full library. **Audio is muted by default.** After installation, open the [local game library](http://127.0.0.1:4173/codex-stage) for browsing and sound settings. A standalone preview does not prove that real Codex task hooks are connected.

## The games

100 unique games: **95 compiled packs + 5 local engine pages**, spanning physics, timing, precision, puzzles, sports and other small arcade experiments. Levels and visual variants are not counted as separate games. The retired original 26 games are not included.

Default shuffle includes all 100, without repeats within a cycle. **Seven entries are curated stable; 93 remain preview.** This is a beta collection, not a claim that every game or every device has passed release acceptance. Many game labels are currently Chinese.

[Full inventory](docs/PLAYABLE_INVENTORY.zh-CN.md) | [Contributing a game](CONTRIBUTING.md)

## Pause, update and uninstall

| File or action | Purpose |
| --- | --- |
| **Pause.command** | Stop showing games without affecting Codex |
| **Resume.command** | Resume the companion, then send a new task |
| **Check Agent Stage.command** | Diagnose the runtime, hooks and services; an unavailable CDP port is normal |
| Run a newer Release installer | Update in place while retaining local progress and preferences |
| **Uninstall Agent Stage.command** | Remove Agent Stage's runtime, service and hooks; retain unrelated hooks and local preferences/media |

These commands are in the full download. After deleting that folder, the installed copy remains at `~/.codex/agent-stage`; check/uninstall commands are also under its `macos/` directory.

If checks pass but an existing chat never opens a game, finish your active work, quit and reopen Codex, then send a new task. A healthy companion and trusted hooks do not prove that an already-open session emitted a task-start event. Confirm both automatic appearance and task-end cleanup in a real task; the browser demo does not test that connection.

## Privacy and compatibility

- Games do not receive conversations, raw commands, file contents, tool output or credentials. Game input cannot control the Agent.
- Event endpoints use authenticated loopback connections. Activity records are not uploaded.
- The installer merges only its own hooks and respects Codex's hook trust mechanism.
- The default display is an independent native WebKit window following Codex, not an alteration of Codex's internal UI.
- The supported integration is **local macOS Codex Desktop**. Remote tasks and environments that disable hooks are not guaranteed.
- Apple Silicon has been tested locally. Intel runtimes are included, but Intel hardware and additional macOS versions still need testing.
- **Windows does not have a one-click installer or automatic companion yet.** The [Windows browser-only experiment](docs/WINDOWS_TESTING.zh-CN.md) is a separate, developer-oriented path.

## Develop locally

You need **Node 22+** for source development. From the repository root:

```sh
node apps/press-lab/server.js
```

Open [localhost:4173/codex-stage](http://127.0.0.1:4173/codex-stage). Reviewed local libraries, game assets and the Godot web export are included; no engine build is needed just to play. Mac source users can also run the root `Install.command` with a suitable Node runtime. Non-developers should use the full Release ZIP.

For validation, use Node 24 and Python 3.12+:

```sh
npm test
npm run verify
npm run audit:public
```

| Directory | Contents |
| --- | --- |
| `apps/codex-stage` | Games, catalog, assets and browser host |
| `packages/codex-stage` | Sanitized activity events, hooks and local daemon |
| `macos` | Installer, native companion, diagnostics and packaging |
| `tools` | Builds, replay tests, performance and release verification |
| `docs` | Architecture, controls, support and contribution guides |
| `games` | Editable Godot game source |
| `skills` | Reusable game-authoring guides |

Caches, logs, task records, private configuration, `dist/`, `output/` and `.tools/` do not belong in Git. Node binaries are shipped only in Release assets. The publication audit checks the allowed file set, common credential patterns, personal paths and oversized Git blobs; it is not a substitute for a full security or asset-license review.

## Contribute

Bring a distinctive game, a better level, original sound or a useful fix. Include legal-input tests, playable goals, failure/retry behavior, licensed local assets, and checks at the 520px popup size and smaller constrained windows. Verify mute, pause and immediate task-end cleanup.

Community gameplay code is reviewed before shipping. The app does not automatically execute arbitrary downloaded plugins.

[Contribution guide](CONTRIBUTING.md) | [Game-authoring Skill](skills/agent-stage-microgame-director/SKILL.md) | [Release process](docs/RELEASING_CODEX_STAGE.md) | [Performance acceptance](docs/COMPANION_PERFORMANCE.zh-CN.md) | [Security policy](SECURITY.md)

FinalButton, ActionProof and Scene Pack modules remain for compatibility. They are not prerequisites for installing or playing the arcade. See the [historical architecture](TRUSTED_ACTIONS.md).

## License

Original project code is [Apache-2.0](LICENSE). Third-party libraries and assets retain their own terms; see the [license and provenance index](docs/ASSET_LICENSES.md). Started by Speakon. No hardware purchase required.
