# Items: Special, Resources, Speed Up, War and Chests store

Opened from the Item dock tab (Bag, Special, Resources, Speed Up, War, Chests). Catalog: `ITEMS` in `js/data.js`. Logic and screen: `js/items.js`. Ideas taken from a reference game's Special store tab; names, prices and effects are our own.

- **My Items.** Diamond items are bought into the bag (`S.itm`) and used from the My Items tab: a four-column icon grid with the count in the corner and the same five sub-tabs as the store. Tap an item for its text and a Use button. Slips are listed under Speed Up and are used from the Slip button on a job. A new save starts with 2 Random Teleports, 1 Advanced Teleport and 1 Skill Reset.
- **VIP points.** 100, 300 and 1,000 points for $1, $3 and $10, real money only (sandbox in the demo, see `docs/IAP.md`). They are never sold for diamonds and there are no timed VIP passes, so VIP stays permanent (`docs/VIP.md`).
- **Boosts** (`S.buf`): +25% hero XP (not applied to XP items), +50% gathering for 24 hours or 7 days, +25% and +50% march speed. Durations are sheet time divided by the drill clock; buying the same boost again extends it.
- **Teleports.** Every base move now spends one: a random landing uses a Random Teleport, a chosen spot an Advanced Teleport. The novice-kingdom hop keeps its own limit.
- **Utility.** Commander Rename, Alliance Rename, Alliance Tag Card, Skill Reset (the free respec now costs one), Hunting Skill Reset, Hero Rescue (frees a captured hero without a seal or ransom), Daily Exercise Chance, Bookmarks (+5 slots, max 30), Building Move (swap to an empty plot of the same kind, not while building).

- **Resources.** Four sizes (10K, 50K, 150K, 500K) of each of the five resources at a small bulk discount on the diamond rates (`DIA_RATE`), plus 60 and 120 stamina. Using one adds what the StoreHouse has room for. In-game names are used (Rations, Fuel, Power, Alloy, Cash).
- **Speed Up.** Slips now also come as 15 minutes, 3 hours, 15 hours, 24 hours and 3 days (`SLIPS`), plus the march speed boosts above.
- **War.** 24-hour and 3-day Peace Shield (the free 8-hour toggle stays), 24-hour and 7-day Anti Scout (no Radar level needed), +20% Attack and +20% Defense (Wall HP) for 12 or 24 hours, +25% / +50% March Size for 4 hours, March Recall.
- **Chests.** Bought into the bag, opened with Use: Material and Gem chests (Basic to Rare), Resource, Speed Up, Attack, Defense, three Escape chests (teleports) and an XP Chest (one Grand XP item, 12,000 diamonds, well above the $2 per 100k XP floor). Contents and prices are placeholders to tune.

## Left out on purpose
Timed VIP passes and VIP Chance (VIP is permanent, no daily chests), per-hero XP items and hero renames (one hero per player), upkeep reduction (the game has no upkeep), Rally Token (Tactical Coordination Tokens already exist), captured-hero war items, Fake Army and Disguise (no enemy hero capture or scouting disguise), per-hero Energy items and the 15/30-minute Heroes Attack Boost (one hero, covered by the Attack boosts), the Uncommon XP Stone, gem tools, march presets and evolution reset (the systems do not exist yet).

## Art
One icon per item (one per resource for the resource lots), group `sitem` in `tools/artcatalog.js`, keys `sitem_<id>`. Until painted files exist the game draws a labelled placeholder plate.
