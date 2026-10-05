# Arcade Collection

The current roster is [100 unique games](PLAYABLE_INVENTORY.zh-CN.md), not 100 levels or palette swaps. The original 26 games are retired and cannot be selected or built. `retired-games.json` is retained as a regression fixture, not a playable list.

- [Install on macOS](QUICK_START.zh-CN.md)
- [Runtime architecture and task lifecycle](CODEX_STAGE.md)
- [Contribute a game](../CONTRIBUTING.md)
- [Five-game reference implementation](ARCADE_FIVE.zh-CN.md)
- [Asset and library licenses](ASSET_LICENSES.md)
- [Release acceptance](RELEASING_CODEX_STAGE.md)

The default popup samples all 100 games without repetition within a shuffle cycle. Hover the upper-right corner to change games manually. Idle-safe rotation can change a game during long tasks without interrupting an active move. Task completion cancels the game, including pending loads and audio.

For each contribution, test playable goals and failure/retry through legal input, the 400px popup, mouse/touch/keyboard where supported, mute, reduced effects, pause and immediate task-end cleanup. A passing simulation does not establish that a game is fun or works smoothly in the installed native window.
