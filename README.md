# IRON MARCH

Single-player, browser-only kingdom game in the Invasion: Modern Empire family. One commander, one alliance, a shared 512×1024 tile kingdom, five local rival alliances. No server, no login. State lives in `localStorage`.

## Run
Open `index.html` (or serve the folder statically). Barlow Condensed and Source Sans 3 load from Google Fonts and fall back to system faces offline.

## Layout
- `js/data.js` — constants and pure rules (troops, walls, buildings, research, titles, forge curves, clocks)
- `js/engine.js` — state, world function, job list, marches, combat, rallies, threats, bots, forge, market, 4Hz `tick()`
- `js/art.js` — sprite helpers and the first-generation art (kept as fallback)
- `js/art2.js`, `js/art3.js` — building art v2: shaded 2.5D SVG toolkit, five material tiers, 15 buildings and 25 Command Center looks
- `js/art4.js` — map feature art v2: forest, wild ground, resource nodes by grade, monsters, camps, bases (same art for player and enemy, five levels), citadel
- `js/assets.js` — painted-art loader: uses images from `assets/` when `assets/manifest.json` lists them, otherwise the vector art (see `docs/ART_SPEC.md`)
- `tools/artcatalog.js` lists every paintable asset with its AI prompt; `tools/ingest.py` resizes, cuts backgrounds and updates the manifest
- `js/bld.js` — per-building sheets: details, options, upgrade requirement tree rooted in the rural buildings
- `js/art5.js` — art v3 troops: 16 unit sprites (4 classes × 4 tiers), shared shading helpers and tier palettes
- `js/art6.js` — art v3 wall crews (16), hero portraits, gear icons for all five slots by grade and set, bar icons
- `js/art7.js` — art v3 monsters, raider camp, ground tiles (wild, forest, plaza), march tokens, filled resource icons
- `art.css` — hooks that place the unit, hero and gear art inside panels
- `js/map.js` — map canvas: inertial pan, pinch and wheel zoom, territory washes with edge lines, citadel beacon, radial tap menu
- `js/cc.js` — Command Center sheet: 25-level upgrade path with prerequisites, action tiles, tap sequences and the on-screen tap guide
- `js/ui.js` — frosted HUD, five-tab dock, spring slide-up drawers (Desk, Hero/Forge, Alliance, Mail, Columns), base scene with progress rings and reward bubbles, haptics and audio cues
- `style.css` — the locked palette and instrument-panel look

## Docs
`docs/TAP_SEQUENCES.md` lists every click per building (design reference, not in the game). `docs/ART_SPEC.md` is the brief for real art. `docs/IAP.md` covers store purchases.

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
