# Agent Stage Scene Packs

This directory is the source tree for the first Agent Stage Gallery. Each subdirectory is an independently reviewable Scene Pack and can be moved into a dedicated `agent-stage/scene-packs` repository without changing its format.

Each V2 package contains `scene.json`, `preview.json`, `README.md`, `LICENSE`, and optional local `assets/`. Run the following before opening a PR:

```bash
node ../packages/stage-core-ts/src/cli.js digest your-pack
node ../packages/stage-core-ts/src/cli.js verify your-pack
```

See [`docs/STAGE_PACKS.md`](../docs/STAGE_PACKS.md) for the declarative timeline vocabulary, privacy slots, asset rules, and contribution constraints.

The starter shelf intentionally spans different agent work: `inkwell-atelier` turns a send into writing and sealing; `switchboard` turns a call into a live routing story; `chorus-room` turns team chat into a room of voices; `time-garden` grows a calendar moment; `release-forge` tempers a deploy; and `vault-ritual` reveals an access grant. These sit alongside the original transit-oriented packs. Each one changes the performance only, never the action or confirmation contract.
