# IRON MARCH

Single-player, browser-only kingdom game in the Invasion: Modern Empire family. One commander, one alliance, a shared 512×1024 tile kingdom, five local rival alliances. No server, no login. State lives in `localStorage`.

## Run
Open `index.html` (or serve the folder statically). Barlow Condensed and Source Sans 3 load from Google Fonts and fall back to system faces offline.

## Layout
- `js/data.js` — constants and pure rules (troops, walls, buildings, research, titles, forge curves, clocks)
- `js/engine.js` — state, world function, job list, marches, combat, rallies, threats, bots, forge, market, 4Hz `tick()`
- `js/art.js` — original procedural art: canvas terrain and feature sprites, SVG buildings with five level tiers
- `js/map.js` — map canvas: inertial pan, pinch and wheel zoom, territory washes with edge lines, citadel beacon, radial tap menu
- `js/ui.js` — frosted HUD, five-tab dock, spring slide-up drawers (Desk, Hero/Forge, Alliance, Mail, Columns), base scene with progress rings and reward bubbles, haptics and audio cues
- `style.css` — the locked palette and instrument-panel look

## Purchases
`js/iap.js` holds the diamond-pack store, bundles and purchase layer. The browser build is sandbox only (no money). See `docs/IAP.md` for the native wrapper, server validation and compliance steps.

## Clocks
Every job stores an absolute end time; a 4Hz tick completes what is due. Nothing is integrated per frame; columns are timers.
Sheet values are shown, drill values run: build, train, research, heal and wall crews divide by 15; occupation, shield, throne hold and rally waits use the occupation clock (4 h sheet → 48 s). Production runs at ×15 and the base panel prints the sheet per-hour figure.

## Interpretation notes
- Forest time is 4 sheet minutes per crossed forest tile, divided by the drill clock (16 s per tile), and scaled by column speed.
- Rally joiners are simulated alliance members. Slots 7–10 consume Tactical Coordination Tokens when the rally is created.
- Prison seals waive the 2500-cash hero ransom. Hall of War orders are spent to lead a rally.
- Bots expand by encampment, scout you, march at you and garrison the throne. Their defenses are synthetic force ratings that grow slowly.
- Gems are collected and counted; they carry no effect yet.
