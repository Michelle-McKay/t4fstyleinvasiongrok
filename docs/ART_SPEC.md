# Art spec: painted assets for Iron March

The game ships with code-drawn vector art. Painted images replace it one piece at a time: any asset without an image keeps the vector version.

## How it works
1. `tools/artcatalog.js` is the list of every asset (212 today): file key, size, whether it needs a transparent background, and the copy-paste AI prompt. Run `node tools/artcatalog.js` after changing it; it writes `assets/catalog.json`.
2. Generate an image per key and name the file exactly as the key (`bld_mil_t1.png`).
3. `python3 tools/ingest.py path/to/*.png` finds each asset by file name, removes a flat background if the asset needs transparency, shrinks it to the in-game size, saves WebP into `assets/<folder>/` and rewrites `assets/manifest.json`. Commit the result.
4. `js/assets.js` reads the manifest at start-up and swaps the images in.

## Keys
| Key | What | Where it shows |
|---|---|---|
| `bld_<kind>_t1..5` | 14 buildings by upgrade tier (1: lv 1-4, 2: 5-9, 3: 10-14, 4: 15-19, 5: 20-25) | base plots, building sheets |
| `bld_cc_t1..t5` | Command Center per tier (like every building) | base, sheet, map HQ (`hq_N` reuses these by tier) |
| `head_<kind>` | wide backdrop behind a building on its sheet (no building in it) | building sheet header |
| `troop_<inf,arm,air,siege>_t1..4` | 16 troop types | training, garrison, columns |
| `wall_<sent,bast,sky>_t1..4` | 12 wall defenses | defense sheet |
| `hero_<ada,ivo,ren>` | hero portraits | HUD, hero screen |
| `mon_1..6`, `camp`, `citadel`, `node_<food,oil,energy,steel>_1..6` | map sprites | world map |

Map bases (yours and every enemy's) are drawn from the Command Center building art `bld_cc_t1..5`, so they look identical; an enemy's rank 1-5 picks the tier.
| `tile_wild_1..3`, `tile_forest_1..2`, `tile_plaza_1` | flat top-down ground textures | world map |
| `pack_<name>` | 16 store pack banners | pack store, pack pop-out |
| `gem_1..6` | diamond piles | diamond packs |
| `icon_<name>` | painted HUD and resource icons (map, base, train, lab, med, march, vault, hero, alliance, more, mail, rations, fuel, power, alloy, cash, dia, gift, events, crate, handshake) | everywhere the game draws that icon |

## Camera and style
Set in `tools/artcatalog.js` and included in every prompt. Look: bright, clean, modern industrial-military, a polished stylized-realistic game render. Light grey and off-white panels, warm sand, tidy concrete, brass and safety-orange accents, softly glowing blue lights, bright daylight. No rust, grime, clutter or gloom. Camera: three-quarter overhead (about 40 degrees, front-left facing), light from the upper left, soft shadow lower right. Every building stands on the same clean square pad so they sit together on the grid.

The first set of images used a darker, weathered look and is being replaced. `assets/manifest.json` lists the keys made in the current look under `clean`.

## Rules
- **Original art only.** Reference screenshots are for layout and level of detail, never for copying. Do not prompt for another game's characters, logos or buildings, or a living artist's style.
- **Licence and ownership.** Check the image tool's terms allow commercial use. Copyright in purely AI-generated images is unsettled in some countries; keep a record of the tool, date and prompt for each image (the prompts live in this repo). Apple and Google may ask about AI-generated content.
- **Size.** Ingest shrinks images (buildings 512, troops 384, tiles 256, icons 128) so the app stays light.

## Still needed for release
App icon (1024 x 1024), store screenshots and the Google Play feature graphic. Use original artwork and the game's own name and marks only.
