# Items: Special and Speed Up store

Opened from the Item dock tab (Bag, Special, Speed Up). Catalog: `ITEMS` in `js/data.js`. Logic and screen: `js/items.js`. Ideas taken from a reference game's Special store tab; names, prices and effects are our own.

- **Bag.** Diamond items are bought into the bag (`S.itm`) and used from there. A new save starts with 2 Random Teleports, 1 Advanced Teleport and 1 Skill Reset.
- **VIP points.** 100, 300 and 1,000 points for $1, $3 and $10, real money only (sandbox in the demo, see `docs/IAP.md`). They are never sold for diamonds and there are no timed VIP passes, so VIP stays permanent (`docs/VIP.md`).
- **Boosts** (`S.buf`): +25% hero XP (not applied to XP items), +50% gathering for 24 hours or 7 days, +25% and +50% march speed. Durations are sheet time divided by the drill clock; buying the same boost again extends it.
- **Teleports.** Every base move now spends one: a random landing uses a Random Teleport, a chosen spot an Advanced Teleport. The novice-kingdom hop keeps its own limit.
- **Utility.** Commander Rename, Alliance Rename, Alliance Tag Card, Skill Reset (the free respec now costs one), Hunting Skill Reset, Hero Rescue (frees a captured hero without a seal or ransom), Daily Exercise Chance, Bookmarks (+5 slots, max 30), Building Move (swap to an empty plot of the same kind, not while building).

## Left out on purpose
Timed VIP passes and VIP Chance (VIP is permanent, no daily chests), per-hero XP items and hero renames (one hero per player), upkeep reduction (the game has no upkeep), Rally Token (Tactical Coordination Tokens already exist), captured-hero war items (no enemy hero capture), gem tools, march presets and evolution reset (the systems do not exist yet).

## Art
19 icons, group `sitem` in `tools/artcatalog.js`, keys `sitem_<id>`. Until painted files exist the game draws a labelled placeholder plate.
