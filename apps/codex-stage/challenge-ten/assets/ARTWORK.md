# Challenge Ten Artwork

Date: 2026-10-02. Project-original artwork, distributed with this package under Apache-2.0; see LICENSE. No third-party characters, photographs, commercial game sprites or recorded music are used. AI-generated artwork is not a promise of exclusive copyright or universal legal clearance.

## Sources

- Four backgrounds were generated with the imagegen tool from the original prompts below; native output 1536 x 1024, used without modification.
- Six backgrounds are original SVG scenery authored in `../art.js`, rasterized to 960 x 640 by `tools/build-challenge-art.mjs`.
- Live characters, hazards, geometry and effects are original Canvas drawings in `../painter.js`. They follow the simulation; background art never determines collision.
- `covers/` contains 960 x 640 screenshots captured from running games by `tools/test-challenge-ten-browser.mjs`.
- Audio is locally synthesized with per-game oscillator palettes, using `arcade-five/sound.js`. No external audio recordings.
- Matter.js is a separate MIT-licensed code dependency for five physics/collision games, not a source of artwork.
- `provenance.json` binds source, license, documentation, background and cover hashes. Regenerate it after replacing any asset. The build never fetches remote assets.

## Generation Prompts

### freeze-frame

Original output identifier: `exec-db3d6ae8-5192-452e-a983-4858a5a590e6.png`.

Original game environment background, landscape 3:2 aspect ratio. Stylized concept art. Handmade stop-motion miniature factory built of turquoise painted clay and red rubber, crisp macro photography texture, warm white studio daylight, tactile fingerprints and screws, side-on orthographic game camera. A clean EMPTY horizontal production lane across middle from x=0 to x=100%, ground at 78% image height. Background pipes and tiny workbenches occupy upper quarter and far sides only; central lower 65% unobstructed pale mint wall for dynamic character and rotating machinery added in code. Strong red accents and mint ceramic surfaces, physically modeled details, not flat vector, not dark, not blurry, no gradients as decoration. No text, no logos, no characters, no saws, no UI, no border. Art direction: playful industrial stopmotion, entirely original.

### faultline-drill

Original output identifier: `exec-6741fb25-488a-40c4-8a9d-c394052e4d0a.png`.

Original landscape 3:2 game background, underground cross section in expressive linocut printmaking style, vermilion coral strata, charcoal plum rock, golden mineral flecks and mint crystal veins confined to the left and right 15 percent of the frame. A wide unobstructed excavation shaft through the center, subtle terracotta paper texture and coarse hand-carved hatch marks. Flat frontal orthographic side view, no perspective, medium light readable. Small mineral processing equipment and roots only along upper edge. Middle 70 percent kept quiet for a moving drill and obstacle rows added in code, no rocks blocking the center, no vehicles, no characters. Rich ink on textured paper, striking graphic novel geological illustration, not a generic vector UI. No text, no symbols, no logo, no watermark, no border.

### blackout-bridge

Original output identifier: `exec-d40aa854-617d-40a5-b5c9-2ce3ef95cb96.png`.

Original 3:2 landscape game environment. A moonlit flooded garden drawn in beautiful black charcoal and silver scratchboard engraving, high contrast hand etched reeds and willow branches at the extreme left and right edges, a still luminous silver-grey pond filling central 75 percent. Frontal slightly elevated view, deep ink black distance at top and pale etched water toward bottom. Quiet central space for six rows of stepping stones to be drawn in code, do NOT draw stepping stones, bridges, people, animals, UI, lettering, or frames. A small carved stone gate centered far away at the very top. Distinctive monochrome narrative game illustration with tactile crosshatching, readable not photographic blur. No logos or trademark imagery.

### copper-balance

Original output identifier: `exec-594fd2f4-bf8c-4e4c-9bb6-d3c046e1df18.png`.

Original landscape 3:2 game background for a balance-scale packing puzzle. A crisp cyanotype and copper scientific engraving of an antique weighing laboratory, off-white linen sheet on the central table, teal etched shelving and glass apothecary jars relegated to the upper edge and far left/right margins, small rose red wax seals, mint and copper highlights. Straight-on orthographic elevation, an EMPTY center from 20% to 80% width and 20% to 85% height where an interactive brass balance scale and weights will be drawn in code. No balance scale in this background, no people, no letters, numbers, readable labels, logos or border. Highly detailed tactile screen-printed fine crosshatching, scientific museum illustration, clearly distinct from modern flat cartoon games. Mostly ivory and teal with restrained copper. Sharp and readable.
