# README Preview

`readme-preview.gif` is an animated documentation illustration, not a capture of the Codex application or a user's desktop. The workspace, task text and task lifecycle are public demonstration content. The game is the actual `toast-hop` renderer, driven by legal keyboard input through three successful jumps, then stopped and hidden when the simulated task completes. Progress is never assigned or fabricated.

The game viewport is enlarged to 680 x 382.5 CSS pixels for readability in GitHub's README column. This does not change the installed companion's default size. `readme-preview.png` is a static alternative captured mid-jump from the same recording.

- Composition: [public HTML fixture](../../tools/fixtures/readme-preview.html).
- Capture: [Playwright rendering script](../../tools/render-readme-preview.mjs).
- Game artwork: existing project assets; see [asset provenance](../ASSET_LICENSES.md).
- Output: 1280 x 800 looping GIF at 20 fps, plus a PNG poster. The GIF has an 8 MiB size budget. No desktop capture, private task data, installed hooks, or external network requests are used.
- Original composition and generated screenshot: Apache-2.0, with game assets retaining their documented terms.

To regenerate with Playwright, a compatible Chromium browser and FFmpeg available (authoring tools only, not end-user installation requirements):

```sh
node tools/render-readme-preview.mjs
```

`PLAYWRIGHT_MODULE` can identify an existing Playwright module, `CHROME_PATH` an existing browser executable, and `FFMPEG_PATH` an existing FFmpeg executable. The script starts and closes its own loopback preview server, checks loaded artwork and nonblank pixels, verifies each jump and task-end freezing, encodes an optimized GIF, and removes temporary frames. A local report is written to the ignored `output/readme-preview/report.json`.
