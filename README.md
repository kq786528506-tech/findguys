# Find Guys · Little hidden worlds

A mobile portrait hidden-character game built with TypeScript, HTML, CSS and Canvas 2D. The game starts immediately, without a home screen. All game text is English.

## Play

Play online: **https://kq786528506-tech.github.io/findguys/**


Double-click `Play-FindGuys.cmd`, or open `dist/FindGuys.html` in Chrome, Edge or Safari. This standalone file embeds its illustrations, fonts and game code and runs offline. No installation or server is needed.

For a local development preview:

```powershell
npm install
npm run dev
```

Open the local address printed by Vite. On a phone on the same Wi-Fi, use the printed Network address. The game always stays in a portrait frame, including on desktop or landscape screens.

## Four little worlds

- **Cozy Courtyard:** opening shutters, a wind spinner that clears the flowers, and a visitor revealed by golden-hour light.
- **Rainy Glasshouse:** swipe to wipe misted glass, turn the valve to reveal a pond visitor, and watch the rain clear.
- **Lantern Market:** tap or drag a crate, light a lantern, and change the breeze.
- **Moonflower Garden:** tap or drag the telescope, connect three stars, and search under silver midnight light.

Each world contains six fixed, color-camouflaged characters. Objects with a small plus badge are interactive. Interactions uncover a hiding place; the player must still find and tap the character.

## Controls and rules

- Drag the illustration to explore. Pinch or scroll to zoom. Double-tap to switch zoom. Overview resets the camera.
- Tap a hidden character to collect it. Misses have no penalty.
- Two hints per round provide a clue and highlight a region.
- Time of day and weather change automatically after 65 and 35 seconds of active play. Their buttons also allow manual changes.
- Relaxed play has no time limit. The clock button starts an optional fresh 120-second challenge.
- Finding a character awards 100 points. Finds within 12 seconds build a combo worth up to 100 extra points per find. Timed wins add 5 points per remaining second.
- One to three stars reflect the number of hints preserved. Best scores, stars, current world and preferences are stored locally where browser storage is available.
- Pause, menus and switching to another browser tab pause active gameplay. Time-up allows unlimited continuation.
- Sound and reduced animation preferences are available in the pause menu. Sound begins after the first interaction, respecting browser audio rules.

## Build and validation

```powershell
npm run build
npm test
```

`npm run build` checks TypeScript, builds `dist/index.html` with companion files, and creates the self-contained `dist/FindGuys.html`. The distribution includes local fonts and their OFL licenses. Nothing is fetched from a CDN at runtime.

`npm test` launches Chrome and verifies touch input, all 24 targets and all eight mechanisms through the actual pointer handlers, pause, hints, records, narrow phones and desktop portrait layout. It also verifies challenge timeout, automatic environment changes and the offline standalone file. Screenshots and reports are written to `test-results/`.

## Project structure

- `src/main.ts`: interface, flow, scoring, persistence and feedback.
- `src/world.ts`: Canvas renderer, camera, gestures, weather, target hit tests and mechanisms.
- `src/levels.ts`: target placements, clues, scene rules and mechanism configuration.
- `src/audio.ts`: local Web Audio sound effects and gentle procedural ambience.
- `public/art`: four optimized WebP illustrations, generated with Dreamina 5.0 Lite.
- `public/fonts`: DM Sans and Fraunces with OFL license notices.
- `Design`: approved concept images, compressed for project size.
- `art-source`: generation provenance and original illustration exports.

## GitHub Pages

The production static site is served from `main:/docs`. Source files remain at the repository root.

```powershell
npm ci
npm run build:pages
npm test
```

Commit the updated source and `docs/` directory to `main`. GitHub Pages publishes that folder automatically. The Vite base path is relative, so images, scripts and fonts work under `/findguys/` without a domain-specific build.

The public repository includes the optimized game illustrations. Large original generation exports, installed dependencies, local test reports and release archives are excluded. The previous Unity version is preserved in GitHub commit history.
