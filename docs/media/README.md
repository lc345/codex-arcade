# README Preview

`readme-preview.png` is a documentation illustration, not a capture of the Codex application or a user's desktop. The workspace and task text are public demonstration content. The lower-right game is the actual `toast-hop` renderer, captured during a jump using keyboard input at a 400 x 225 CSS-pixel viewport.

- Composition: [public HTML fixture](../../tools/fixtures/readme-preview.html).
- Capture: [Playwright rendering script](../../tools/render-readme-preview.mjs).
- Game artwork: existing project assets; see [asset provenance](../ASSET_LICENSES.md).
- Output: 2560 x 1600 PNG. No desktop capture, private task data, installed hooks, or external network requests are used.
- Original composition and generated screenshot: Apache-2.0, with game assets retaining their documented terms.

To regenerate with Playwright and a compatible Chromium browser available:

```sh
node tools/render-readme-preview.mjs
```

`PLAYWRIGHT_MODULE` can identify an existing Playwright module and `CHROME_PATH` an existing browser executable. The script starts and closes its own loopback preview server, checks that the game's artwork is loaded and the canvas is nonblank, and verifies an in-flight game state before capture.
