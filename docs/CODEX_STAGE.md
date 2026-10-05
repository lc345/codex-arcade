# Codex Execution Arcade

Agent Stage displays a small game-only macOS window while Codex works. The current catalog has 100 unique games: 95 reviewed compiled packs and five local engine pages. All 100 participate in the default shuffle; 93 are preview and seven are curated stable entries. Those labels are not a claim of universal hardware compatibility.

## Install and lifecycle

Use the full Release ZIP and double-click **Install Agent Stage.command**. No development runtime, engine or debug port is needed. See [installation](QUICK_START.zh-CN.md).

1. Codex `UserPromptSubmit` reaches the local hook collector and starts a run.
2. The authenticated loopback daemon emits a privacy-filtered activity event.
3. The native WebKit companion shows a roughly 520px game window at Codex's lower-right corner, only while Codex is foreground. It shrinks to fit smaller host windows.
4. Thinking and tool calls leave the game running. Manual shuffle is available; after three minutes, automatic rotation waits for a safe idle/result state and five seconds without input.
5. `Stop` or `Interrupt` ends the matching run. The host cancels loading, simulation, input, animation and audio; the popup closes when no active run remains.

Switching applications hides and pauses the window. Returning to Codex resumes it. Closing the game or losing a round cannot cancel, approve or otherwise control the Agent. Scores never represent Agent progress.

## Implementation map

| Path | Responsibility |
| --- | --- |
| `packages/codex-stage/src` | Hooks, activity collection, authenticated daemon, optional CDP compatibility |
| `macos/scripts` | Installer, service lifecycle, diagnostics and release packaging |
| `macos` | Native WebKit game companion |
| `apps/codex-stage/live-turns.js` | Active-run lifecycle |
| `apps/codex-stage/rotation.js` | Manual and idle-safe game switching |
| `apps/codex-stage/packs` | Reviewed pack compiler, integrity manifests and loader |
| `apps/codex-stage/standalone` | Local engine adapters |
| `apps/press-lab/server.js` | Shared local HTTP server; folder name retained for compatibility |

The default path does not inject into Codex or modify its files, theme or configuration beyond the project's own hooks. Experimental CDP/Shadow DOM code is retained for compatibility but is not an installation prerequisite. The UI host runs with launchd `ProcessType=Interactive`; Background scheduling caused severe frame throttling on the installed path.

## Privacy and trust

The hook input is filtered before it becomes an ActivityEvent. Games never receive prompts, raw commands, file contents, paths or tool output. Input stays local to gameplay. Server bindings are loopback-only, authenticated events require a random local token, and state files are private to the user.

Game code is reviewed application code, not arbitrary downloaded community JavaScript. Assets and vendor libraries are local with licenses and provenance. Scene Pack v1/v2/v3 and FinalButton/ActionProof remain separate compatibility modules; they cannot authorize a real action through a game.

## Development and verification

```sh
node apps/press-lab/server.js
node tools/build-game-packs.mjs
npm test
npm run verify
```

Open `http://127.0.0.1:4173/codex-stage`. Node 22+ is needed for source development; full Mac Releases include their own runtime. Browser simulations test the game host, not actual Codex hooks or macOS scheduling.

Use [Arcade Five](ARCADE_FIVE.zh-CN.md) as a small authoring example, the [inventory](PLAYABLE_INVENTORY.zh-CN.md) for the current roster, and [performance acceptance](COMPANION_PERFORMANCE.zh-CN.md) for real installed-window tests. Keep local QA reports out of Git. An isolated extraction test is not a fresh-user macOS installation or a notarization test.
