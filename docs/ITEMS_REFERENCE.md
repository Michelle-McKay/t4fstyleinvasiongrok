# Items tab: reference notes (5 tabs) mapped to our game

Notes taken from screenshots of a commercial game's Items > Store (Special, Resources, Speed Up, War, Chests), for design reference only. Names, prices and art are our own. Reference and research only, nothing here is in the game (a first build was rolled back). Status: **Designed** means a worked design existed in the rolled-back build, **Maybe** is undecided, **No** is skipped with the reason. Vocabulary (Rations/Fuel/Power/Alloy/Cash vs Food/Oil/Energy/Steel) is to be revised at the end of the project.

## Special
| Reference idea | Our version | Status |
|---|---|---|
| VIP points 100 / 300 / 1,000 | VIP point items, real money only | Designed |
| VIP timed passes 1, 7, 30 days | None, VIP is permanent | No |
| Hero XP bonus +25% | 25% Hero XP Bonus, 24h | Designed |
| Hero XP items (default and per hero) | XP items already exist in packs; one hero per player | No |
| Gathering boost 24h / 7d +50% | Same | Designed |
| Upkeep reduction 25% / 50% for 24h / 5d | The game has no upkeep | No |
| Random, Advanced, Epic teleports | Random and Advanced Teleport; every move spends one | Designed |
| Hero rename, player rename, captured hero rename | Commander Rename | Designed |
| Hero skill reset, hunting skill reset | Skill Reset, Hunting Skill Reset | Designed |
| Hero resurrection | Hero Rescue (frees a captured hero) | Designed |
| Daily chance, VIP chance | Daily Exercise Chance; VIP Chance is out (no VIP daily chests) | Designed / No |
| Alliance rename, alliance card | Alliance Rename, Alliance Tag Card | Designed |
| Building move | Building Move (empty plot, same kind) | Designed |
| Gear bag | No gear storage limit exists yet | Maybe |
| Bookmarks | +5 bookmark slots | Designed |
| Rally token | Tactical Coordination Tokens already sold | No |
| Torch, Code of War, Iron fetters, Sacrificial dagger | Tied to capturing enemy heroes, not in our game | No |
| Gem tools (Apprentice, Expert, Master) | Forge gems work without tools | Maybe |
| Update / reset march preset | No march presets yet | Maybe |
| Evolution reset | No evolution system | No |

## Resources
| Reference idea | Our version | Status |
|---|---|---|
| Food, Wood, Stone, Iron, Silver lots, 4 to 5 sizes each | Rations, Fuel, Power, Alloy, Cash (in-game names; Food/Oil/Energy/Steel are the same five), four sizes | Designed |
| Stamina lots | 60 and 120 stamina | Designed |
| Hero-specific XP stone | One hero, covered by XP items | No |

## Speed Up
| Reference idea | Our version | Status |
|---|---|---|
| Slips 1m, 15m, 60m, 3h, 8h, 15h, 24h, 3d | 5m, 15m, 1h, 3h, 8h, 15h, 24h, 3d | Designed |
| March speed up 25% / 50% | Same, 24h | Designed |

## War
| Reference idea | Our version | Status |
|---|---|---|
| Peace shield 8h / 24h / 3d | 8h shield stays free; 24h and 3d items | Designed |
| Anti scout 24h / 7d | Same | Designed |
| Attack boost +20% 12h / 24h | Same | Designed |
| Defense boost +20% 12h / 24h | Wall HP +20% | Designed |
| March size boost 25% / 50% 4h | Same | Designed |
| March recall | Recalls columns that have not fought | Designed |
| Fake army, Cryptokiller's disguise | No scouting disguise system | Maybe |
| Hero energy items (per hero, 1K to 20K) | Stamina items cover it | No |
| Heroes attack boost 15 / 30 min | Covered by Attack boosts | No |

## Chests
| Reference idea | Our version | Status |
|---|---|---|
| Material chests (normal, special, rare, epic, beginner) | Material Chest, Basic to Rare | Designed |
| Gem chests (normal to epic) | Gem Chest, Basic to Rare, Basic gems only | Designed |
| Resource chest, speed up chest | Same | Designed |
| Attack chest, defense chest (basic and full) | Attack Chest, Defense Chest | Designed |
| Escape chests (basic, normal, advanced) | Three Escape Chests (teleports) | Designed |
| XP chest | XP Chest, one Grand XP item | Designed |

## My Items (the bag in the reference)
Same five sub-tabs as the store (Special, Resources, Speed Up, War, Chests). Each owned item is a square icon in a four-column grid with its count in the corner and its size or duration in the top corner (5K, 15M, 1M); an item with zero left stays visible greyed (the chests show 1, 2, 3 with a 0). Expired timed items (for example a teleport pass) stay in the grid marked Expired. There are also job-specific speed-ups, such as a hammer one that only speeds up building (3M, count 3).

| Reference idea | Our version | Status |
|---|---|---|
| Bag split into the same five tabs | Our bag is one list today | Maybe |
| Icon grid with count in the corner | List rows today | Maybe |
| Job-specific speed-ups (building only) | Slips work on any job | Maybe |
| Expired timed items | Our items do not expire | No |

# Michelle's current store spec (2026-10-01)

Her updated list, recorded as written. Reference only, nothing here is built. Prices are in Gold (the game's premium currency is called diamonds in code today; the name is part of the vocabulary revision at the end). Resource mapping from the reference game: Wood is Energy, Stone is Oil, Iron is Steel, Silver is Cash, Stamina is Chips, Food stays Food. In code these are Rations, Fuel, Power, Alloy and Cash (`NODE_RES`), and hunting stamina; the names get settled in the vocabulary revision.

**Open conflict:** the Special tab lists VIP 1 Day, 7 Days and 30 Days, but the standing rule is that VIP is permanent and unlocks only by spending real money (`docs/VIP.md`). The 100, 300 and 1,000 VIP point lines are also priced in Gold here, while the rule says money only. Waiting on Michelle to say which way to go.

## 1. Special
| Item | Gold |
|---|---|
| 100 VIP Points | 150 |
| 300 VIP Points | 400 |
| 1,000 VIP Points | 1,000 |
| VIP 1 Day | 250 |
| VIP 7 Days | 1,500 |
| VIP 30 Days | 4,000 |
| 25% Hero XP Bonus | 2,000 |
| 50,000 Hero XP | 400 |
| 200,000 Hero XP | 1,500 |
| 1,000,000 Hero XP | 5,000 |
| 5,000,000 Hero XP | 18,000 |
| Random Teleport | 500 |
| Advanced Teleport | 1,500 |
| Hero Rename | 2,000 |
| Rename Player | 40 |
| Captured Hero Rename | 2,000 |
| Hero Skill Reset | 1,000 |
| Hunting Skill Reset | 1,000 |
| Hero Resurrection | 6,000 |
| Daily Chance | 800 |
| VIP Chance | 1,000 |
| Alliance Rename | 200 |
| Alliance Card | 100 |
| Building Move | 500 |
| Gear Bag | 1,000 |
| Bookmarks | 1,000 |
| Rally Token | 25 |
| Torch | 20 |
| Iron fetters | 15 |
| Code of War | 15 |
| Gem Apprentice | 400 |
| Gem Expert | 2,000 |
| Gem Master | 4,000 |
| Update March Preset | 1,000 |
| Reset March Preset | 2,000 |

## 2. Resources
| Item | Gold |
|---|---|
| 30,000 / 150,000 / 500,000 / 2,000,000 / 6,000,000 Food | 40 / 160 / 400 / 1,200 / 3,300 |
| 10,000 / 50,000 / 150,000 / 500,000 / 1,500,000 Energy | 40 / 160 / 400 / 1,200 / 3,300 |
| 10,000 / 50,000 / 150,000 / 500,000 / 1,500,000 Oil | 40 / 160 / 400 / 1,200 / 3,300 |
| 10,000 / 50,000 / 150,000 / 500,000 / 1,500,000 Steel | 40 / 160 / 400 / 1,200 / 3,300 |
| 3,000 / 15,000 / 50,000 / 200,000 / 600,000 Cash | 40 / 160 / 400 / 1,200 / 3,300 |
| 7,000 / 30,000 / 90,000 / 250,000 / 600,000 Chips | 200 / 750 / 1,800 / 4,000 / 9,500 |

## 3. Speed Up
| Item | Gold |
|---|---|
| 1-Minute Speed Up | 5 |
| 15-Minute Speed Up | 70 |
| 60-Minute Speed Up | 130 |
| 3-Hour Speed Up | 300 |
| 8-Hour Speed Up | 650 |
| 15-Hour Speed Up | 1,000 |
| 24-Hour Speed Up | 1,500 |
| 3-Day Speed Up | 4,400 |
| 25% March Speed Up | 500 |
| 50% March Speed Up | 900 |

## 4. War
| Item | Gold |
|---|---|
| 8-Hour Peace Shield | 500 |
| 24-Hour Peace Shield | 1,000 |
| 3-Day Peace Shield | 2,500 |
| 24-Hour Anti Scout | 600 |
| 7-Day Anti Scout | 3,000 |
| 12-Hour +20% Attack Boost | 250 |
| 12-Hour +20% Defense Boost | 250 |
| 24-Hour +20% Attack Boost | 400 |
| 24-Hour +20% Defense Boost | 400 |
| 4-Hour 25% March Size Boost | 2,400 |
| 4-Hour 50% March Size Boost | 5,000 |
| Fake Army | 200 |
| March Recall | 40 |
| 1,000 Default Hero Energy | 250 |
| 2,000 Default Hero Energy | 475 |
| 24-Hour +50% Gathering Speed Boost | 600 |
| 7-Day +50% Gathering Speed Boost | 5,000 |
| 24-Hour -25% Upkeep Reduction | 500 |
| 5-Day -25% Upkeep Reduction | 2,000 |
| 24-Hour -50% Upkeep Reduction | 2,000 |
| 5-Day -50% Upkeep Reduction | 8,000 |

## 5. Chests
Prices and the other chests are still to come. Drop tables received so far (per item chance, as Michelle sent them; the number of items in each level is not given yet, so the chances are not yet checked to add up to 100%):

| Chest | Level 1 / Tier 1 | Level 2 / Tier 2 | Level 3 / Tier 3 | Tier 4 | Tier 5 | Tier 6 |
|---|---|---|---|---|---|---|
| Normal Material Chest | 2.5% | 1.458% | 0.208% | n/a | n/a | n/a |
| Special Material Chest | 2.5% | 1.458% | 0.208% | n/a | n/a | n/a |
| Rare Material Chest | 2.5% | 1.458% | 0.208% | n/a | n/a | n/a |
| Epic Material Chest | 2.083% | 1.042% | 0.625% | 0.292% | 0.104% | 0.021% (top-tier legendary crafting items) |

Notes: the first three chests are given with the same three figures, so it is not yet clear how Special and Rare differ from Normal (probably which item levels sit in each tier); to confirm with Michelle. In our game the nearest match is the forge material grades (Basic to Legendary, six grades), see `STORE_TIER2` and `pouch()` in `js/engine.js` for the current alliance-store chest rolls.

## Notes for the later build (things her list needs that the game lacks)
Upkeep (no upkeep system today), Hero Resurrection and Captured Hero Rename (heroes are captured, not killed, and enemy heroes are not captured), Torch, Iron fetters and Code of War, Gear Bag (no gear storage limit), Gem tools, March presets, Fake Army, and Default Hero Energy (the game has stamina, shown as Chips in her mapping). Per-hero XP items from the reference are already dropped from her list.

### Gem Chests (drop tables received 2026-10-01)
Per-item chances as Michelle sent them. Troop names map to ours: Infantry = Rock, Cavalry = Paper, Ranged = Scissors. "Level" is the gem quality tier (1 Raw Shard to 6 Omega Diamond in our forge). The Normal Gem Chest's per-level lists were given with kinds: Level 1 has 7 gem kinds (Rock, Paper, Scissors, Siege, Traps, Defense, Health), Level 2 has 5 (Scissors, Siege, Traps, Defense, Health), Level 3 has 7 (same kinds as Level 1). The other three chests are given per level only.

| Chest | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Tier 5 | Tier 6 |
|---|---|---|---|---|---|---|
| Normal Gem Chest | Level 1 gems, 8.571% each | Level 2 gems, 5.0% each | Level 3 gems, 0.714% each | n/a | n/a | n/a |
| Uncommon Gem Chest | Level 2 gems, 8.571% each | Level 3 gems, 5.0% each | Level 4 gems, 0.714% each | n/a | n/a | n/a |
| Rare Gem Chest | Level 3 gems, 8.571% each | Level 4 gems, 5.0% each | Level 5 gems, 0.714% each | n/a | n/a | n/a |
| Epic Gem Chest | Level 1, 7.143% each | Level 2, 3.571% each | Level 3, 2.143% each | Level 4, 1.000% each | Level 5, 0.357% each | Level 6, 0.071% each |

Check: Normal Gem Chest as listed adds up to 7 x 8.571 + 5 x 5.0 + 7 x 0.714 = 60.0 + 25.0 + 5.0 = 90.0%, not 100%, so one list or count is probably missing something (for example a Level 2 kind or an extra block); to confirm with Michelle.

Mismatches with our gem system (`docs/FORGE_GEMS.md`, `BASIC_GEMS` in `js/data.js`):
- Her chests mix gem kinds per level (Level 2 has 5 kinds, Levels 1 and 3 have 7). Ours has 25 Basic gem kinds, all available at every one of the six quality levels, so a chest would roll a kind and a level separately.
- Her kinds are 7 (Rock, Paper, Scissors, Siege, Traps, Defense, Health). Ours has Rock, Paper and Scissors Strike and Guard gems, Siege Breaker, Iron-Plate (defense), Vitality (health) and 18 more (production, build, research, training, hunting, march). Traps has no single match (closest is Ordnance, trap training speed).
- Set gems (72, one family per set) never come from store or quest chests in our rules; her tables only list Basic-type kinds, so that fits.
- Our alliance-store chest today rolls Level 1 (65%) or Level 2 (35%) only; her Epic Gem Chest reaches Level 6.
