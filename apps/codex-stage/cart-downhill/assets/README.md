# Seaside delivery assets

Original models authored with `tools/art/build-cart-assets.py` in Blender 4.5.14.
No downloaded characters, branded vehicles, commercial game files or external
textures are included. `seaside.blend` is editable; `seaside.glb` is the local
browser asset. `provenance.json` records content and source hashes.

The asset set contains a wire shopping cart with separate wheels, a clay-style
shopper with articulated limbs and head, a cake, crates, fruit, a crossing car,
a market stall and a plaster house. Static geometry is joined by material, while
moving parts retain named nodes. Cloth texture and signs are generated locally
by the Three.js painter. Audio is original Web Audio synthesis, including a
deterministic rolling-noise buffer, and never downloads sound files.

Code, models, textures and synthesized sound source: Apache-2.0, see LICENSE.
Blender is an authoring tool, not a browser dependency. Three.js (MIT) and Rapier
(Apache-2.0) keep their separate notices in `../../vendor/`.
