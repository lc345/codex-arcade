# Century Ten Artwork

Date: 2026-10-02. Original project artwork distributed under Apache-2.0; see LICENSE. No commercial game sprites, characters, photographs or recorded music. AI-generated art does not establish exclusive copyright or universal legal clearance.

## Sources

- Three imagegen backgrounds, native 1536 x 1024 PNG, used without modification; prompts and source identifiers below.
- Seven original graphic backgrounds in `../art.js`, rasterized locally to 960 x 640 by `tools/build-century-art.mjs`.
- Live geometry, characters, silhouettes and effects: original Canvas drawings in `../painter.js`. Visuals follow game state; backgrounds are not collision maps.
- `covers/`: 960 x 640 gameplay screenshots from `tools/test-century-ten-browser.mjs`.
- Sound: local oscillator synthesis with ten palettes, no external recordings.
- Matter.js: separate MIT-licensed code dependency used only by `ink-rail`.
- `provenance.json` binds license, source, documentation, images and covers to SHA-256. The pack build never fetches remote assets.

## Generation Prompts

### ink-rail

Original output identifier: `exec-c7fd958e-f153-4ecb-8f84-7b735f7e9c24.png`.

Original landscape 3:2 game environment illustration. Japanese woodblock-meets-watercolor miniature railway canyon in pale turquoise, terracotta and warm white, layered mountains at far upper quarter, a deep river gorge below. Flat side-on orthographic view. The middle 70 percent of the picture is bright empty sky for a player-drawn railway line, x15% to90% y20% to75% clear. Tiny rail depots only at far left and far right edges, wooden bridge pylons confined to the outermost edges. A delicate river at bottom 15%. No tracks crossing the central empty sky, no vehicle, no characters, no lettering, no UI, no border, no watermark. Detailed tactile rice-paper textures and precise block-print edges, cheerful crisp daylight. The playable cart, rails and obstacles will be drawn in code.

### leak-patrol

Original output identifier: `exec-bf33d27a-ad35-4394-812e-31087d6ad4f1.png`.

Landscape 3:2 original game background. A whimsical submarine maintenance room as hand-painted 1990s adventure animation background, rich cobalt blue and seafoam green with coral-red wheel valves and yellow brass fittings. Frontal orthographic wall. Detailed machinery, riveted frames, large pressure gauges only in the outer 15 percent on left and right and across the top 12 percent. The central 70 percent must be a quiet, empty pale blue metal wall for live pipework and water jets drawn later in code. Floor at 84 percent height with a small shallow reflective puddle, no central pipes or valves, no characters, no text, no logos, no UI or border. Crisp ink outlines, gouache brushwork, witty practical industrial design, bright readable lighting, not photoreal and not a flat vector background.

### fridge-fit

Original output identifier: `exec-de3c7bc4-7e3c-48dd-8a96-fab9beb78477.png`.

Original landscape 3:2 game backdrop in bright mid-century cut-paper collage style with real photographed paper fibers and visible scissor edges. A playful mint and coral kitchen seen from directly above, a large EMPTY pale white tabletop in the central 75 percent of the image for a rectangular fridge-packing game board added in code. Art elements only at far left and right edges and top margin: small gingham towel, wooden spoon, two lettuce leaves, red tomato halves, blue ceramic tiles and paper-cut yellow lemon slices. No refrigerator drawn, no food boxes in center, no text, no labels, no logos, no humans, no UI, no border. Strong handmade collage material quality, crisp soft cast shadows, warm daylight, very distinct from flat vector icons and from watercolor. Leave center x20%-75%, y15%-80% uncluttered and nearly white.
