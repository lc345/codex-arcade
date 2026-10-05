# Agent Stage / FinalButton: Historical Architecture

This is the historical overview of the trusted-action and scene-pack modules, not the current installer or product guide. Start with [README](README.md) and [runtime architecture](docs/CODEX_STAGE.md) for the Codex game companion. These protocols remain available for existing integrations. Earlier release-status statements below refer to their implementation stage, not the current GitHub status.

Play a short, local game while your agent works. Task completion immediately stops game input, simulation, animation and sound. The game never controls the agent or receives task contents.

## 三步开始 / Quick Start (macOS)

1. 安装并登录 Codex Desktop。
2. 下载 Release 中的 **Agent-Stage-for-Codex.zip**，解压，双击 **Install Agent Stage.command**。维护者发布前，请勿把此说明当作已有公开下载。
3. 回到 Codex 发一条新消息。任务开始时，Codex 窗口右下角出现独立游戏小窗；切到其他应用或最小化 Codex 时暂停并隐藏，返回继续；完成或中断时停止并收起。

不需要 npm、Python、Godot、Homebrew、Chrome、API Key 或 Speakon 硬件。Release 内置 Apple Silicon 和 Intel 的 Node 运行库，安装过程无需联网下载依赖。使用 macOS 自带 WebKit，不修改 Codex，不需要调试端口。

**源码用户：**拉下仓库后双击根目录 [Install.command](Install.command)。安装器优先复用 Codex 已有的 Node 22+ 运行库；某些 Codex 发行版不带它，此时使用完整 Release，不能承诺任意源码 ZIP 都不需要运行库。macOS 可能要求第一次右键打开或确认安全提示，不会关闭 Gatekeeper。

另有 [Check.command](Check.command)、[Pause.command](Pause.command)、[Resume.command](Resume.command)、[Uninstall.command](Uninstall.command)。小窗默认宽 400 像素，高度按游戏比例调整，只显示游戏画面，没有标题栏、游戏库或工具栏。鼠标移到小窗右上角可显示“换一款游戏”图标，同一任务内随时更换。随机模式下同款满 3 分钟后，在准备/结算界面且停手 5 秒时自动换下一款，不打断进行中的操作。点击游戏后按 Esc 隐藏本轮，下一个任务再次出现，不影响 Agent。默认静音；选游戏和声音设置保留在完整试玩页 `/codex-stage`，首次开声音需要点击。

[安装、升级、排障与 GitHub 发布边界](docs/QUICK_START.zh-CN.md)。这是仅在 Codex 前台显示、跟随其窗口位置的独立小窗，不是 Codex 内部 UI；旧 CDP Dock 保留为实验兼容路径。

## Current Games: 0.11.0

**94 retained games + 6 new games = 100 distinct playable works:** 95 reviewed source packs in the catalog and 5 standalone previews. This is a source inventory milestone, not 100 approved releases. The original 26 remain removed from source, exclusive assets and built packs. Old installed copies and historical DMGs are separate artifacts.

**Limit Break / 极限六式:** Fly a binary wave through crystal corridors, charge alternating wall jumps, rotate two cores through slits, aim dashes through moving shutters, chain timed clicks and held sliders, and brake a spacecraft using recoil. Six distinct control challenges, eighteen demanding rounds, original local art and quick current-round retries. The previous [One More Try](docs/HARDCORE_TEN.zh-CN.md) and [Gauntlet Ten](docs/GAUNTLET_TEN.zh-CN.md) remain available.

- Play: `/codex-stage?collection=extreme-six&game=razor-wings`.
- [New game controls, research references and verification](docs/EXTREME_SIX.zh-CN.md).
- [Generated playable inventory](docs/PLAYABLE_INVENTORY.zh-CN.md).
- [Seven-game curated rotation](docs/CURATED_ROTATION.zh-CN.md).
- [Road to 100 and release checks](docs/ROAD_TO_100.zh-CN.md).

The native companion now shuffles **all 100 retained games**, including previews, without repeats within a bag. Hover the upper-right corner to shuffle during a task. Random mode also advances after three minutes, but only at a ready/result screen after five seconds without input. Tool events never force a switch; task completion cancels both gameplay and pending loads. Previously pinned browser selections do not pin the native companion. The optional curated collection still contains seven favourites; including a preview in the full pool does not mark it release-approved. Other retained collections include [Arcade Five](docs/ARCADE_FIVE.zh-CN.md), [Sports & Toys](docs/SPORTS_TEN.zh-CN.md), [Odd Little Arcade](docs/ODD_TEN.zh-CN.md), [Challenge Arcade](docs/CHALLENGE_TEN.zh-CN.md) and [Century Arcade](docs/CENTURY_TEN.zh-CN.md). Their historical count milestones are not the current inventory.

## Trusted Actions

> **Turn an agent action into a short performance, without letting the performance control the action.**
>
> The agent proposes. A trusted connector prepares the exact effect. A person commits it. A proof remains.

Agent Stage is an open, declarative presentation layer for consequential agent actions. A browser canvas can show an email folding, sealing, flying and arriving; a device can synchronize light, sound, voice and a physical hold. Community contributors create the scene language. They never receive permission to alter the actual action.

FinalButton remains the local, model-agnostic commit layer beneath it: the moment before an AI agent sends a message, adds a calendar event, calls someone, deploys code, deletes a file, or moves money.

It turns a validated tool call into an immutable **Action Request**, binds a trusted **Action Commit** to the provider payload and optional resource version, sends that request to a human-facing presenter, then creates a one-time **Action Decision** and locally verifiable **ActionProof** after execution. Agent Stage adds a community-extensible sensory layer, so a real-world outcome can be communicated through concise light, sound, screen and voice scenes rather than another generic notification.

Created by [Speakon](https://speakon.ai) as an open project. FinalButton does not require Speakon hardware.

## Get Agent Stage for Codex

**Release packaging is available, but this workspace update has not been published to GitHub.** Release ZIP and DMG include both macOS Node architectures. Double-click **Install Agent Stage.command** once. The native WebKit companion automatically appears during Codex turns, without a CDP endpoint, browser installation, account, cloud service or hardware. **Open Live Game.command** remains a browser fallback.

**From this source tree:** double-click [Install-Agent-Stage.command](macos/Install-Agent-Stage.command), or run:

```bash
bash macos/scripts/install-agent-stage-macos.sh
```

The default native window does **not** need CDP. The experimental embedded Dock still needs a verified local CDP endpoint (default `127.0.0.1:9341`). **Check Agent Stage.command** distinguishes the two and reports native window health. The runtime uses only loopback services. Full installation details are in the [macOS guide](macos/README.md).

The full task pool combines **95 compiled packs and five local engine-page adapters**. The latter preserve their existing game mechanics and local checkpoints, show only their playable scene and essential game HUD, and are destroyed on task completion or interruption, including during loading. Matter.js, Three.js and Rapier are bundled locally for games that need them; board and timing games use their own deterministic rules. The trusted host loads only the selected game and caches at most two factories. Checkpoints contain bounded game progress, never task data. The five page URLs are a fixed first-party allowlist; they receive no hook token or task contents. Community JavaScript installation is deliberately not enabled: Shadow DOM is not a security sandbox. Existing uploaded videos remain on disk, but the current interface exposes games only. FinalButton and Action Stage remain compatible. Updating source does not upgrade an installed companion or an older DMG.

Maintainers can publish the same user-ready DMG by pushing an `agent-stage-v*` tag; the [release guide](docs/RELEASING_CODEX_STAGE.md) documents the automatic GitHub Release workflow.

## The moment

![FinalButton physical console](apps/press-lab/finalbutton-console.png)

**AI can run the workflow. The final consequential action stays human.**

<table>
  <tr><td><strong>1. Agent proposes</strong></td><td>Validated tool arguments render a trusted action card.</td></tr>
  <tr><td><strong>2. Connector prepares</strong></td><td>A trusted provider payload is hashed into a commit; optional state witnesses capture the resource version.</td></tr>
  <tr><td><strong>3. Person commits</strong></td><td>A physical or local UI uses a deliberate gesture such as a 2-second hold.</td></tr>
  <tr><td><strong>4. Executor rechecks</strong></td><td>A changed provider payload or resource version fails closed before the side effect.</td></tr>
  <tr><td><strong>5. Proof remains</strong></td><td>Request, decision, outcome and a locally verifiable receipt proof become one ActionProof.</td></tr>
</table>

## Run Stage Lab

Stage Lab is the working browser simulator. It is an action director: select an agent work type, choose a scene from that action's curated shelf, then choose the confirmation grammar that suits the hardware. Email, calls, Slack, calendar changes, deployments, and file sharing all keep the same trusted action contract while using different light, sound, canvas, and gesture language. It includes compact hold, tap-to-reveal, replay/double-tap, decision dial, and triple-tap profiles; interrupted holds; denial; deferral; synthetic sound; privacy modes; and receipt-bound presentation replay.

```bash
node apps/press-lab/server.js
# Open http://127.0.0.1:4173
```

It starts with an email action. `Mail Flight`, `Prism Relay`, and `Paper Courier` are three distinct ways to perform exactly the same proposed email. Try `Voice Orbit` for a phone call, `Time Orbit` for a calendar action, or `Launch Rail` for a deployment. No real side effect is sent.

The right panel separates scene direction from confirmation. Use **Privacy** to see the Stage redact or reveal contextual language, or **Preview** to inspect an outcome animation without releasing the action. The Action Card and its confirmation contract do not change when the scene changes.

## Why it is more than HITL

Most agent frameworks can pause a run and ask a person yes/no. FinalButton is the protocol for what that yes is actually bound to:

- **Trusted commit binding:** the presenter sees cards derived by integration code, while the provider adapter checks the exact payload digest before it acts.
- **State witnesses:** a deploy, CRM write, or calendar edit can record the resource version it was reviewed against. If the state changes while waiting, the approval becomes `stale` and cannot execute.
- **ActionProof receipts:** every result carries a receipt digest plus local signature. Hosts can detect a changed action, decision, outcome or error after the fact.

This is deliberately small enough for a Stream Deck or Speakon button, but concrete enough for an MCP proxy, an agent framework, or a provider connector to agree on the same final human moment. Read [ActionProof](docs/ACTION_PROOF.md) for the product and ecosystem model.

## Around any tool

FinalButton sits at the **side-effect boundary**, not in the model prompt. That is why it works with OpenAI, Anthropic, Gemini, local models, ordinary scripts and workflow engines alike.

```ts
const receipt = await guard.run(callCustomer, { to: "Alex Chen", purpose: "Confirm the demo" }, {
  execute: (commit) => {
    const payload = { to: "Alex Chen", purpose: "Confirm the demo", aiDisclosure: true };
    assertCommitPayload(commit, payload);
    return telephony.placeCall(payload);
  },
});
```

The Guard validates arguments, derives the card and commit from developer-owned code, evaluates policy, waits for a matching decision, rechecks optional state witnesses, and invokes the executor exactly once. The complete examples are in [TypeScript](examples/typescript/phone-call.ts) and [Python](examples/python/phone_call.py).

## Protocol

The protocol source of truth is JSON Schema in [`spec/schemas`](spec/schemas). Version `0.2` has four objects:

- `ActionRequest`: immutable description of a validated side effect, its actor, risk, target, impact, expiry, an Action Commit, and SHA-256 `actionDigest`.
- `PolicyDecision`: `allow`, `require_approval`, or `deny`, decided by application policy rather than a model.
- `ActionDecision`: `approve_once`, `deny`, `defer`, `expired`, or `request_details`; HMAC-bound to one request digest and optionally to the presentation proof that was shown.
- `ActionReceipt`: the resulting decision plus execution status: `succeeded`, `failed`, `denied`, `deferred`, `expired`, `blocked`, or `stale`, with a locally verifiable receipt proof.
- `ActionPresentationRecord`: a replayable Stage rendering of the action digest, selected pack/variant, locked device contract, transcript and digest.

The lifecycle is:

```text
proposed -> waiting -> presented -> decided -> executing -> succeeded | failed | stale | expired
```

An `ActionDefinition` is deliberately owned by the developer. It validates the tool arguments and derives the title, summary, target, impact and rollback copy. The model never gets to make a destructive action look harmless in the consent UI.

Read the full [protocol](docs/PROTOCOL.md), [device profile](docs/DEVICE_PROFILES.md), and [security boundaries](docs/SECURITY_MODEL.md).

## Agent Stage

Agent Stage gives community contributors an expressive surface without giving them approval authority. `StageEvent` is derived by trusted presenter code from an Action Request and locked confirmation contract. A Scene Pack sees only privacy-safe slots such as `actorLabel`, `recipientLabel`, `recipientCount`, `actionSummary`, and `status`; `summary-only` never carries a real address, body, or private name to a community pack.

V2 packs keep the familiar `cue -> context -> preview -> decision -> resolution` beats, then add a short Canvas timeline: `spawn`, `move`, `path`, `fade`, `scale`, `text`, `particle`, and `holdProgress`. They may reference only local PNG/WebP, constrained SVG, WAV, or MP3 assets. There are no remote URLs, scripts, HTML, expressions, or control commands. A normal scene is limited to eight seconds; a night scene to one.

The official packs include [Inkwell Atelier](scene-packs/inkwell-atelier/scene.json), [Switchboard](scene-packs/switchboard/scene.json), [Chorus Room](scene-packs/chorus-room/scene.json), [Time Garden](scene-packs/time-garden/scene.json), [Release Forge](scene-packs/release-forge/scene.json), and [Vault Ritual](scene-packs/vault-ritual/scene.json), plus [Mail Flight](scene-packs/mail-flight/scene.json), [Prism Relay](scene-packs/prism-relay/scene.json), [Neon Run](scene-packs/neon-run/scene.json), [Open Line](scene-packs/open-line/scene.json), [Voice Orbit](scene-packs/voice-orbit/scene.json), [City Dispatch](scene-packs/city-dispatch/scene.json), [Paper Courier](scene-packs/paper-courier/scene.json), [Calendar Orbit](scene-packs/calendar-orbit/scene.json), [Mission Control](scene-packs/mission-control/scene.json), [Launch Rail](scene-packs/launch-rail/scene.json), and [Quiet Night](scene-packs/quiet-night/scene.json). Stage Lab uses PixiJS for the live particle renderer and Tone.js for interactive audio, while preserving its Canvas fallback. Open the local Gallery after starting the server: `http://127.0.0.1:4173/gallery`.

```bash
# Validate Scene Pack schema, bundle files, local assets, and SVG restrictions.
node packages/stage-core-ts/src/cli.js verify scene-packs

# Inspect a pack's declared preview or render a privacy-safe simulated event.
node packages/stage-core-ts/src/cli.js preview scene-packs/mail-flight
node packages/stage-core-ts/src/cli.js simulate scene-packs/mail-flight succeeded
```

Build a scene, sound, light or renderer contribution with the [Agent Stage Pack guide](docs/STAGE_PACKS.md). The simulator and Gallery run without hardware. `@agent-stage/bridge` sends only descriptions and semantic gestures to a registered device; FinalButton alone verifies and signs a decision.

For execution-theater contributions, use the bundled [Agent Stage Story Director skill](skills/agent-stage-story-director/SKILL.md) for the shared safety contract, [Branching Cartoon](skills/agent-stage-branching-cartoon/SKILL.md) for route-based shorts, and [Microgame Director](skills/agent-stage-microgame-director/SKILL.md) for compact games. They guide original visual grammar, continuity, local assets, input design, and the privacy/accessibility checks required for the Codex Dock.

## Device language

FinalButton standardizes the semantic intent, not a specific switch:

- `reveal`: show or speak the trusted action card.
- `approve_once`: deliberately approve exactly one request.
- `deny`: explicitly prevent the request.
- `defer`: leave it unexecuted for later.

The official profiles map those intents differently:

| Profile | Controls | Best fit |
| --- | --- | --- |
| Seal One | Tap to reveal; hold to approve; release cancels | One-button hardware |
| Seal Duo | Hold the seal to approve; second button denies | Press Lab, Stream Deck, Speakon |
| Seal Dial | Select scope with dial; hold to commit | M5Stack or a dedicated desktop controller |
| Pulse | Tap to replay; double tap to deny; long press to approve | A compact ambient control |
| Triple Tap | Three deliberate short taps approve once | A button with no reliable long-press signal |

Lights always combine color, motion and non-color feedback. The ring breathes while waiting, fills during a hold, turns green only after the executor reports success, and fades after a refusal or expiry. A color alone is never an approval signal.

## MCP proxy

The reference proxy in [`examples/mcp-proxy`](examples/mcp-proxy) wraps any line-oriented stdio MCP server. Every unknown tool is high-risk by default; it does **not** trust MCP annotations as authorization.

```bash
export FINALBUTTON_UPSTREAM_COMMAND="node"
export FINALBUTTON_UPSTREAM_ARGS='["./your-mcp-server.js"]'
export FINALBUTTON_UPSTREAM_NAME="your-server"
export FINALBUTTON_PRESENT_COMMAND="node"
export FINALBUTTON_PRESENT_ARGS='["examples/mcp-proxy/approve-demo-presenter.js"]'
node examples/mcp-proxy/finalbutton-mcp-proxy.js
```

Configure your agent to use the proxy command in place of the upstream MCP command. The included presenter automatically approves **for a demo only**. A real presenter should render the Action Request through Press Lab, Stream Deck, M5Stack, or a Speakon bridge and output a deliberate decision. See the [MCP guide](docs/MCP_PROXY.md).

## Recipes

A recipe packages action-card copy, default risk, hold duration and device tone. The working Lab includes [phone call](recipes/phone-call/recipe.json), [Slack message](recipes/slack-send/recipe.json), [calendar invite](recipes/calendar-create/recipe.json), [production deploy](recipes/deploy/recipe.json), and [file share](recipes/file-share/recipe.json), alongside its email action.

Validate a recipe before sharing it:

```bash
node packages/core-ts/src/cli.ts verify recipes
```

The next contribution can be an n8n, Home Assistant, CRM, robotics or personal automation recipe. Start with the [recipe guide](docs/RECIPES.md).

## Framework patterns

The core integration is framework-neutral. Framework adapters resume their own state after FinalButton returns a decision:

- [LangGraph pattern](examples/langgraph/README.md)
- [Pydantic AI pattern](examples/pydantic-ai/README.md)
- [MCP proxy](examples/mcp-proxy/finalbutton-mcp-proxy.js)

## Important safety boundary

FinalButton protects against a model taking a side effect without a human sign-off. It is **not** a replacement for authentication, authorization, sandboxing, rate limits, provider permissions, legal compliance, or secure hardware attestation. Keep those controls inside the side-effect executor. The local HMAC is an integrity binding for a local trusted presenter, not proof of a particular human identity.

This distinction is also reflected in the [Pydantic AI human-in-the-loop documentation](https://pydantic.dev/docs/ai/tools-toolsets/deferred-tools/) and the [MCP tool specification](https://modelcontextprotocol.io/specification/2025-06-18/server/tools/).

## Development

The trusted core has no framework runtime dependency. The browser Lab installs `pixi.js` for accelerated rendering and `tone` for interactive audio.

```bash
node --test packages/core-ts/test/*.test.ts packages/stage-core-ts/test/*.test.ts packages/stage-web/test/*.test.js packages/stage-bridge/test/*.test.js apps/press-lab/*.test.js apps/press-lab/renderers/*.test.js
PYTHONPATH=packages/core-py python3 -m unittest discover -s packages/core-py/tests -v
node packages/core-ts/src/cli.ts verify recipes
node packages/core-ts/src/cli.ts verify scene-packs
node packages/stage-core-ts/src/cli.js verify scene-packs
```

Node 22+ is required for native TypeScript type stripping in the reference SDK. Python 3.10+ is required for the Python SDK.

## Works with FinalButton

Projects can use this badge once they validate tool arguments, derive their Action Cards from trusted integration code, and execute side effects only through an unexpired one-time decision:

```md
[![Works with FinalButton](https://img.shields.io/badge/Works%20with-FinalButton-f0b84f)](https://github.com/your-org/finalbutton)
```

## Contributing

Issues, device profiles, presenters, recipes, docs and adapters are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md) first.

Licensed under [Apache-2.0](LICENSE).
