# Agent Stage Packs

Agent Stage turns a real agent action into a short, replayable sensory scene. A Stage Pack is **expression**, never authority: it can choose light, sound, screen copy and spoken copy, but it cannot change the action card, risk, device gesture, expiry, or the allowed decision outcomes.

## The two layers

The FinalButton protocol owns the immutable semantic layer:

- the validated action, target, risk, impact, expiry and `actionDigest`;
- the device contract: `holdMs`, available outcomes and device profile;
- the actual executor, policy and one-time decision verification.

A Stage Pack owns the experience layer:

- `cue`: get attention with light or a short sound;
- `context`: describe what is happening;
- `preview`: explain the consequence in a safe summary;
- `decision`: accompany the already-defined decision gesture;
- `resolution`: acknowledge success, failure, denial, deferral or expiry.

The runtime accepts only `light`, `audio`, `speech`, and `screen` commands. A `control` command is invalid by design. This keeps a community theme from making an irreversible call look like a harmless tap, or from inventing a new way to approve it.

## A V2 pack

Place a shareable package in a directory with these public files:

```text
scene-packs/your-pack/
  scene.json
  preview.json
  README.md
  LICENSE
  assets/
```

`assets/` is optional, but all listed assets must be local PNG, WebP, constrained SVG, WAV or MP3 files. There are no remote URLs, scripts, HTML, expressions, DOM APIs, or control commands in a Scene Pack.

```json
{
  "schemaVersion": "2",
  "id": "community-dispatch",
  "version": "0.1.0",
  "license": "Apache-2.0",
  "locales": ["zh-CN", "en"],
  "assets": [],
  "assetDigest": "sha256 of the normalized asset manifest",
  "contentDigest": "sha256 of this pack excluding contentDigest",
  "matches": {
    "categories": ["communication.send"],
    "states": ["waiting", "succeeded"]
  },
  "variants": [
    {
      "id": "ready",
      "when": [{ "field": "timeOfDay", "op": "eq", "value": "day" }],
      "beats": [
        {
          "phase": "cue",
          "commands": [
            { "channel": "light", "token": "community.ready", "durationMs": 420 },
            { "channel": "audio", "cue": "community.ready", "gain": "quiet" }
          ]
        },
        {
          "phase": "context",
          "commands": [
            { "channel": "screen", "template": "一条消息已准备好。", "slots": [] }
          ]
        }
      ],
      "timeline": {
          "durationMs": 1400,
          "tracks": [
            { "atMs": 0, "command": "spawn", "id": "message", "kind": "envelope", "anchor": "actor" },
            { "atMs": 160, "command": "path", "id": "message", "from": "actor", "to": "recipient", "arc": 0.2, "durationMs": 900 },
            { "atMs": 980, "command": "text", "id": "target", "slot": "recipientLabel", "anchor": "recipient" }
          ]
        }
    }
  ]
}
```

Validate it before sharing:

```bash
node packages/stage-core-ts/src/cli.js verify scene-packs/your-pack
node packages/stage-core-ts/src/cli.js preview scene-packs/your-pack
node packages/stage-core-ts/src/cli.js simulate scene-packs/your-pack succeeded
node packages/stage-core-ts/src/cli.js digest scene-packs/your-pack
```

The formal shape is [`stage-pack.schema.json`](../spec/schemas/stage-pack.schema.json). `createScenePack()` is the runtime validator used by the simulator and the CLI. `agent-stage digest` prints the asset entries with their SHA-256 values plus the `assetDigest` and `contentDigest` to place into `scene.json`; CI then recomputes them and rejects any changed resource or manifest. V1 packs remain readable for compatibility, but new community submissions should use V2.

## Variants, not random noise

Each pack can provide several variants. The Stage runtime chooses only from variants whose `when` conditions match the trusted event facts:

| Field | Values |
| --- | --- |
| `timeOfDay` | `day`, `night` |
| `privacyMode` | `summary-only`, `full` |
| `recipientCount` | numeric comparisons |
| `risk` | `low`, `medium`, `high`, `critical` |
| `status` | `waiting`, `holding`, `executing`, `succeeded`, `failed`, `denied`, `deferred`, `expired`, `stale` |

Packs have an optional integer `priority` from `-1000` to `1000`. A contextual pack such as `quiet-night` can take precedence over a general theme only when it has an eligible variant. A runtime also avoids immediately repeating the last eligible variant for the same action category, status and pack.

## Privacy and presentation records

`summary-only` is the default. In that mode Stage template slots never receive raw title, summary, impact or target fields. They resolve to category-level language such as “一条消息” and “一位收件人”. The trusted Action Card remains the place for the user to inspect the exact details.

Each render creates an `ActionPresentationRecord`: action digest, chosen pack/version/variant, locked interaction contract, visible transcript, timestamp and digest. A presenter can pass its compact `ActionPresentationProof` into `createSignedDecision`. The signed decision then records not only *what* was approved, but which sensory representation was on stage when it was approved.

## Timeline vocabulary

The renderer receives only bounded high-level commands: `spawn`, `move`, `path`, `fade`, `scale`, `text`, `particle`, `holdProgress`, `orbit`, `pulse`, `rotate`, and `shake`. Coordinates are semantic anchors (`actor`, `recipient`, `center`, `top`, `bottom`, `left`, `right`), never arbitrary DOM access.

`orbit`, `pulse`, `rotate`, and `shake` are for staging a story rather than pretending every action is a delivery: a schedule can grow from seed to bloom, a release can be forged, a call can wake a switchboard, and a file grant can open a vault. They accept only numeric bounds, object ids and semantic anchors. They cannot read data, invoke code, or add approval behavior. `text` remains limited to the five privacy-safe Stage Event slots. A daytime timeline lasts at most 8 seconds; a variant selected for `timeOfDay: night` lasts at most 1 second.

## Composition vocabulary

Scene Packs are the v0.1 executable unit. Their tokens deliberately leave room for independently shared collections:

- **Sound Pack:** owns cue names such as `paper.stamp` or `mission.launch` and maps them to synthesized or device-native sounds.
- **Light Pack:** owns light token names and their choreography on a ring, strip, screen edge or device LED.
- **Theme Pack:** owns the visual palette and voice tone of several scenes.

The browser simulator supplies neutral fallbacks for unknown light and audio tokens, so a scene remains understandable while a device-specific renderer is being built. A Speakon, Stream Deck or M5Stack bridge can implement the same tokens without changing the signed approval contract.

## Contribution bar

Good Stage contributions are small, specific and testable:

1. Choose a stable action category and state set.
2. Use clear, short copy. Do not repeat the entire card through speech.
3. Use a non-color cue for high-risk states: a screen icon, spoken phrase, rhythm or haptic pattern.
4. Include `waiting`, `succeeded`, and at least one non-success resolution where relevant.
5. Keep audio brief and privacy-safe; never put secrets or raw provider payloads in a pack.
6. Include `preview.json`, `README.md`, a clear asset license, and run the verifier.

See the official examples in [`scene-packs`](../scene-packs): `inkwell-atelier`, `switchboard`, `chorus-room`, `time-garden`, `release-forge`, and `vault-ritual` demonstrate story-first task metaphors alongside `mail-flight`, `prism-relay`, `open-line`, `voice-orbit`, `city-dispatch`, `paper-courier`, `calendar-orbit`, `mission-control`, `launch-rail`, and `quiet-night`.
