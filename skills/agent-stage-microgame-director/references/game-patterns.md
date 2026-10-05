# Microgame Patterns

## Pitch card

```text
title:
one player verb:
tap effect:
optional double-tap modifier:
first-second visual hook:
15-second variation:
gentle loop / interruption frame:
original visual grammar:
```

## Feel checklist

- The first tap must change the scene immediately.
- Every accepted action has animation, a readable state change, and optional sound.
- The player may stop at any time with no lost progress or false task implication.
- A second gesture should be a modifier, not a prerequisite for basic play.
- Score only real gameplay outcomes (hits, solved objectives, successful combos), never raw taps or Agent quality.

## Borrowed ideas, adapted for Agent Stage

- Game design theory: make the core verb and player feeling explicit before implementing a renderer.
- Level design: vary spacing, rhythm, and visual combinations rather than simply speeding up forever.
- Web-game verification: exercise the actual input loop and inspect a browser screenshot after implementation.
- Rigid-body games: use the reviewed, locally bundled Matter.js engine in both the standalone view and Dock. Never download engines or assets at play time.

Sources for the methods: [Game Developer Assistant](https://github.com/pluginagentmarketplace/custom-plugin-game-developer), [OpenAI develop-web-game](https://github.com/openai/skills), and [Phaser Matter documentation](https://docs.phaser.io/phaser/concepts/physics). These are influences, not runtime dependencies or copied game content.
