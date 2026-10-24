# Repository instructions

## Project structure and architecture

This repository is a dependency-free static browser game. `index.html` is the Japanese-language page shell and declares the DOM elements used by the game; `style.css` owns the dark, responsive presentation and scales the game canvas; `game.js` contains the game state, input handling, simulation, and Canvas renderer. The script is loaded with `defer`, so it queries the page elements directly after HTML parsing.

The game uses a fixed 960 × 540 Canvas coordinate space while CSS scales it to a 16:9 display. The level is wider than the viewport: player and level objects use world coordinates, and `cameraX` translates world positions for rendering. Level geometry and coin locations are defined near the top of `game.js`; `update()` advances physics and collisions, and the drawing functions render the background, level, collectibles, goal, and player.

## Repository-specific conventions

- Keep the implementation in the existing three-file HTML/CSS/vanilla-JavaScript structure; there is no bundler, framework, or dependency manifest.
- 説明は日本語で表示するようにして。Preserve the existing DOM contract when changing markup: `game.js` looks up elements by ID and binds touch controls through `[data-control]`.
- Keyboard and touch input share the `keys` set. Route new movement controls through this shared state so the simulation in `update()` remains input-source independent.
- Keep level positions and physics in Canvas/world units, not CSS pixels. If changing the level width or camera behavior, keep the world bounds, ground platforms, and goal position consistent.
- `resetGame()` initializes mutable play state from the level data; keep restart and initial startup behavior aligned when adding state.
- Keep responsive presentation in the existing mobile media query in `style.css`; the canvas is scaled by CSS and its intrinsic dimensions define the drawing coordinate system.

## Build, test, and lint

There are currently no configured build, test, or lint scripts, and no test suite. For a JavaScript syntax check, run:

```sh
node --check game.js
```

To try the game, open `index.html` in a browser or serve the repository root with a static file server. Verify gameplay in the browser after changing physics, input, collision, or rendering behavior.
