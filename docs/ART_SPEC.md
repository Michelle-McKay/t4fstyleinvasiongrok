# Art spec: real assets for Iron March

The game ships with code-drawn vector art. It works, but it is not final-quality. To use real art, add image files and list them in `assets/manifest.json`. Anything you do not list keeps the vector version, so you can replace art a piece at a time.

## Who can make it
- **A game artist (recommended for a store launch).** Best quality and consistency, and clear ownership. Give them this spec.
- **An image-generation tool, edited by an artist.** Fast for concepts and first passes. Keep one fixed style prompt and seed style, generate on a plain background, then clean up and remove backgrounds.
- **A 3D pipeline.** Model once, render every building from one fixed camera. Best for consistency across 15 buildings by 5 tiers.

Things to settle before release, ideally with a lawyer:
- **Licence terms:** check your tool's terms allow commercial use in a paid or free-to-play app.
- **Ownership:** copyright ownership of purely AI-generated images is unsettled in some countries. Human-made or heavily human-edited art is safer.
- **Style and IP:** do not prompt for another game's characters, logos, buildings or a living artist's style.
- **Store disclosure:** Apple and Google may ask about AI-generated content, so keep records of what was generated and how.

## Camera and style (all images)
- Three-quarter top-down view, about 35 degrees. Front-left facing, light from the upper left, soft shadow falling to the lower right.
- Grounded on a small contact shadow or thin pad. Transparent background.
- Palette to match the UI: near-black steel and concrete, brass (#e0a44a) trim and accents, glacier blue (#5ec4d4) lights and screens, oxide green (#8ea36a) for crops and vegetation, signal red (#d4654a) for danger marks. No neon, no pastel.
- Post-apocalyptic military, not fantasy and not cartoon. Weathered, practical shapes.
- Same camera, scale and lighting across every file, so they sit together on the base grid.

## Files: buildings
Size 512 x 512, transparent WebP or PNG, building centered with about 8% margin. Base cell art fills the square; keep the ground pad inside the frame.

Five tiers per building, chosen by level: t1 = levels 1 to 4 (makeshift scrap and tarps), t2 = 5 to 9 (poured concrete), t3 = 10 to 14 (reinforced, brass trim), t4 = 15 to 19 (advanced, lit glass and screens), t5 = 20 to 25 (fortified, brass, glowing).

Filename pattern: `assets/buildings/<kind>_t<1-5>.webp`

| kind | building |
|---|---|
| `mil` | Military Complex |
| `depot` | Depot (medical) |
| `treasury` | Treasury |
| `tech` | Tech Institute |
| `hall` | Hall of War |
| `prison` | Prison |
| `radar` | Radar Station |
| `store` | StoreHouse |
| `defense` | Defense Center |
| `market` | Black Market |
| `rations` | Rations (rural: farm) |
| `fuel` | Fuel (rural: refinery) |
| `power` | Power Cells (rural: solar and wind) |
| `alloy` | Alloy (rural: foundry) |

Command Center has 25 looks: `assets/buildings/cc_L01.webp` to `cc_L25.webp`. See `js/data.js` (`CC_LEVELS`) for the name and description of each level, for example L1 Field Tent, L10 Operations Tower, L25 Iron Citadel HQ.

## Files: map sprites
Size 256 x 256, transparent, drawn straight-on top-down with a little 3/4 tilt, centered. They are shown about 36 px wide, so keep silhouettes bold and readable.

| Name (used in the manifest) | What |
|---|---|
| `nd_food1` to `nd_food5` | food vein by tier (grade 1-2, 3, 4, 5, 6) |
| `nd_oil1` to `nd_oil5` | oil vein |
| `nd_energy1` to `nd_energy5` | energy vein |
| `nd_steel1` to `nd_steel5` | steel vein |
| `mn_1`, `mn_3`, `mn_5` | monster pack: small (grade 1-2), mid (3-4), large (5-6) |
| `camp2` | raider camp |
| `outpost2` | rival commander base (flag color is added by the game) |
| `hq_1` to `hq_25` | your base by Command Center level |
| `cit2` | central citadel, 512 x 512, with a beacon |

Terrain tiles (wild, forest, plaza) are currently drawn in code.

## Manifest
`assets/manifest.json`:

```json
{
  "buildings": {
    "rations": { "t1": "assets/buildings/rations_t1.webp", "t2": "assets/buildings/rations_t2.webp" },
    "cc": { "L01": "assets/buildings/cc_L01.webp" }
  },
  "map": {
    "camp2": "assets/map/camp.webp",
    "cit2": "assets/map/citadel.webp"
  }
}
```
Missing entries fall back to the built-in art.

## UI icons and store listing
Separate from the above and needed for release: app icon (1024 x 1024), store screenshots, and a feature graphic for Google Play. Use original artwork and the game's own name and marks only.
