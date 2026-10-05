# Releasing Agent Stage for Codex

This checklist produces an artifact that a non-developer can use without Node, npm, or a repository checkout.

## Before publishing

1. Run complete Node/Python tests, build all reviewed packs, run collection/browser and native companion tests. Inspect desktop/narrow screenshots. Do not publish untested third-party executable packs.
2. Build the DMG and verify the checksum.
   Run `node tools/test-macos-release.mjs` against the actual ZIP. It extracts to a space-containing temporary path, tests the real distribution CLI, uses only the bundled Node with an isolated HOME/minimal PATH, verifies both architectures and 95 pack digests, preserves unrelated hooks, and starts the real web-server CLI. It does not install launchd services or claim to replace a clean-machine installation.
3. Unzip the ZIP on a clean macOS account, double-click **Install Agent Stage.command**, then Check. Test with a new real Codex turn, interrupt, overlapping chats, pause and uninstall. Native window health is required; CDP is optional.
4. Record the tested Codex version, bundled Node version/checksums/licenses, unsigned first-open instructions, and the distinction between 100 source works and 95 integrated packs.
5. Run the native companion with `NATIVE_QA_LAUNCHD=1`, including the zipper's real native drag input, then run `node tools/test-installed-companion-performance.mjs` with Codex foreground. Directly spawned test windows do not validate the installed launchd resource policy. Require sustained 50+ FPS and P95 frame/input gaps below 35ms; retain local reports, not tokens or task content. See [performance verification](COMPANION_PERFORMANCE.zh-CN.md).

```bash
npm test
npm run verify
npm run audit:public
node tools/build-game-packs.mjs
bash macos/scripts/build-agent-stage-release.sh
node tools/test-macos-release.mjs
(cd dist && shasum -a 256 -c Agent-Stage-for-Codex.dmg.sha256)
```

## Upload

Attach all three files to the GitHub Release:

- `dist/Agent-Stage-for-Codex.dmg`
- `dist/Agent-Stage-for-Codex.zip`
- `dist/Agent-Stage-for-Codex.dmg.sha256`

ZIP and DMG contain Install, Open, Check, Uninstall, Pause, Resume and optional Open Live Game commands. The hidden `.agent-stage` directory includes public project files and official Node binaries for both Mac architectures. Bundling downloads them from nodejs.org, verifies SHA-256, and retains LICENSE/provenance. Users download no dependencies during installation. No proprietary Codex runtime is redistributed. Review runtime provenance before publishing.

The visible `RELEASE.json` records package version, build time, platform, game count, process policy, signing status and runtime provenance. `README.md` in the archive is the bilingual end-user guide. Use `docs/RELEASE_NOTES_MAC_BETA.md` as the release body. Version tags must match package.json; beta/prerelease versions are published with GitHub's prerelease flag. No Apple signing/notarization is currently configured, and no script disables Gatekeeper.

`tools/distribution.mjs` uses an explicit root allowlist. It excludes local outputs, work, caches, environment files, private hook/state files, credential directories, logs and symlinks. `npm run audit:public` checks that public file set for common credential patterns, personal Mac home paths and oversized Git blobs, without printing matched secret values. This is not a comprehensive secret scanner or a substitute for asset-license review. Confirm GitHub owner, repository name and public scope before the first push. Stage only reviewed public files; do not force-add ignored content.

After publication, download the ZIP and checksums from the real GitHub Release, verify their hashes, preserve unrelated hooks and local preferences, uninstall only the installed runtime, then install the downloaded ZIP. Keep the development checkout and a recovery archive until real task-start/task-end and native-window performance checks pass. Record this as a reinstall on an existing Mac, not as a clean-OS or first-open Gatekeeper test.

Pushing an `agent-stage-v*` tag runs tests and validators on macOS, builds ZIP/DMG, verifies checksums and attaches all artifacts to a GitHub Release. Local artifacts alone do not mean a release has been published.

## Support path

Ask users to run **Check Agent Stage.command**. It distinguishes runtime, hooks, companion, native window and optional CDP. Missing CDP is normal in default native-window mode. It prints no task content or token.
