# Odd Ten: Original Scenery

All artwork in this batch was authored for this project. No commercial game sprites, portraits, recordings or third-party music are included. License: Apache-2.0, matching `LICENSE` in this directory.

The editable source is `../art.js`. `tools/build-odd-art.mjs` creates the local SVG scenes and rasterizes them at 960 x 640 with Chromium. Only the selected game's PNG is embedded in its reviewed pack. `../painter.js` draws the interactive objects, colliders' visible boundaries, characters and feedback over these scenes. `covers/` contains actual playable Canvas screenshots, not conceptual mockups.

| ID | Art direction |
| --- | --- |
| velvet-vault | Burgundy Art Deco wallpaper, machined metal safe, a rotating brass dial |
| power-wash | A colorful original mural under layers of street grime |
| zipper-run | Denim weave, stitched pockets, curved metal zipper teeth |
| alarm-alley | Limited-palette pixel clocks on a nighttime shelf |
| lunar-lease | Restrained lunar landscape, utilitarian lander and descent instruments |
| jelly-shift | Soft cel-shaded jelly, mint and rose candy architecture |
| baggage-boogie | Editorial airport illustration, tagged cases and color-coded gates |
| fuse-salon | Technical blueprint, fuse timers and a clearly distinct live power cable |
| tower-unplug | Woodcut workshop, grained timber and a small painted rooftop |
| sugar-snip | Cut-paper confectionery, wrapped candy and a moving sugar tin |

Sound is synthesized locally using Web Audio. There are no audio samples or music licensing dependencies. The common renderer and synthesized voice lifecycle are reused from Arcade Five; rules and scene painters are independently authored for each new game. Matter.js 0.20.0 retains its MIT license in the three physics packs.

`provenance.json` records source, SVG, PNG, cover, license and documentation hashes. Rebuild it after capturing covers: `node tools/build-odd-manifest.mjs`.
