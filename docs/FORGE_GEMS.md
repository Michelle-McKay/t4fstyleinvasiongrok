# Forge rooms, hero level gate, gems, sockets and collection sources

Spec: Michelle's gear, gem, monster hunting and Forge messages of 2026-10-01 (16:30, 16:35 master blueprint, 18:08 "finalized" gear catalog, 18:19 single-gem gem system). Where they conflict, the latest wins; section 0 lists what changed. It builds on [HERO_SYSTEM.md](HERO_SYSTEM.md), [CRAFTING.md](CRAFTING.md) and [MONSTER_HUNTING.md](MONSTER_HUNTING.md), which are unchanged except where noted at the end. Code: `js/forge.js` (rooms and UI), `js/engine.js` (rules), `js/data.js` (tables, section "Gems, sockets and the Forge"). **Every number marked placeholder is a default for balancing, not a decision.**

## 0. What the 18:08 finalized spec changed (against PR #165 and earlier)
- **5 gear slots, not 7**: Helmet, Armor, Footwear, Weapon, Accessory. Gauntlets and Greaves are gone; old pieces in those slots are smelted to one material of their tier on load. What a piece does now comes from its category or set, not its slot.
- **Set bonuses at 2 / 3 / 5 worn pieces** (was 3 / 5 / 7), placeholder +3 / +6 / +10 percent on every stat of the set.
- **Per-set hero level unlocks, not a flat Lv 30**: regular sets Lv 32 to 50, holiday sets Lv 46 and 47, Basic gear categories Lv 1 to 25.
- **12 regular sets replaced** (Vanguard, Outrider and the rest are gone): Rock / Paper / Scissors Troop (Rock = infantry, Paper = armor, Scissors = aircraft, which matches the existing beats chain), Siege, Training, Construction, Research, Tile Hit, General Rally, Wonder Rally, Wonder Solo, Wonder Defense. Old saves map by position (`OLD_SETS` in engine.js).
- **Monsters renamed** to the 16:35 list, one per set: Armored Juggernaut (Rock), Cyber-Raptor (Paper), Venom Spitter (Scissors), Rogue Supply Drone (Training), Data-Golems (Construction), Crystal-Eater Worm (Research), Scrap-Scraper Mech (Siege), Pack-Hunter Drone (Tile Hit), War-Boss Behemoth (Rally), Dreadnought Overlord (Wonder Rally), Bio-Hazard Pest (Wonder Solo), Fortress Automaton (Wonder Defense). The 16:35 message names the themes differently from the 18:08 sets; I paired them by fit and the pairing is an open item. Weekly groups: Troop, Economy, Siege, Wonder week.
- **6 holiday sets shared by the 15 holiday monsters** (Rock+Paper / Rock+Scissors / Paper+Scissors, each as a Defense and an Attack set), three or so monsters per set (assigned in holiday order, `HSETS`). Holiday monster gems stay one per monster (15).
- **Basic Gear: 13 categories** with their own stat and level (section 2b). Basic gear is picked by category when crafting.
- **Tier names**: materials Composite Alloy, Carbon Fiber, Ballistic Polymer, Quantum Circuitry, Nano-Titanium, Aether-Core; gems Raw Shard, Calibrated Core, Prism Matrix, Hyper-Lens, Singularity Crystal, Omega Diamond; gear and the colours stay Grey, White, Green, Blue, Purple, Gold (Basic to Legendary).
- **Not built, flagged**: the catalog says each piece needs 4 material slots made of specific named materials (Scrap Metal, Apex Beast Hide, Frost-Giant Shards...). The game still crafts from four tier materials (4-to-1 stays). The named materials are shown in the Gear Sets and Blueprint Archive rooms as each category's and set's recipe list, but are not separately stocked. OPEN ITEM: decide whether to add named material inventories.

## 0b. What the 18:19 gem spec changed (against the 18:08 build, PR #166)
- **One socket, one gem.** A fully upgraded piece has a single gem socket and holds one gem at a time; the socket was 4 sockets opened by quality and the Gemology research. Gems come out freely and are never destroyed. Socketing over a filled socket swaps the old gem back into stock.
- **"Fully upgraded" is built as 1 star in the Enhancement Vault** (`GEM_SOCKET_STARS = 1`, **placeholder**: the spec does not say what fully upgraded means).
- **Gemology research removed** (nothing left for it to open). Lapidary (gem power) stays and no longer needs Gemology.
- **Gem Set bonus removed.** The 4th gem of every set is now its **Set Synergy** gem (holiday sets: Full-Set Synergy).
- **97 gem types, not 33**: 25 Basic gems (replace the 6 cores), 12 regular sets x 4 = 48, 6 holiday sets x 4 = 24. The 27 per-monster Monster Gems became the 18 set gem families (the 15 holiday monsters share the 6 holiday sets).
- **Scaling** (Grey to Gold): Basic gems have their own curves (1 to 13, 1.5 to 18, 2 to 24 or 2 to 26 percent). Set gems use exact curves from 19:04 (`SET_GEM_CURVES`): Rock, Paper, Scissors, Siege, Tile Hit and Rally 2 / 4.5 / 8 / 12.5 / 18 / 25; Training, Construction and Research top out at 24; the three Wonder sets 2.5 / 5.5 / 9.5 / 15 / 22 / 30; holiday sets 3 / 6.5 / 11 / 17 / 25 / 35. The earlier "high-tier = hero Lv 47+" guess is gone.

## 1. The Forge (six rooms)
Tapping the Forge building opens Hero › Forge, a room bar with six rooms.

| Room | What it does |
|---|---|
| **Gear Sets** | Set-organised view with three tabs: Basic Gear (13 categories), Regular Sets (12) and Holiday Sets (6). Each card shows hero level, stats, the 2 / 3 / 5 piece bonus, worn count, pieces owned and shards; tap a set for its five slots, core materials, source monsters, Set Synergy gem and a Craft with shard shortcut. |
| **Equipment** | Type-organised view with a filter bar: Entire list, Helmets, Armor (chest, gauntlets, greaves), Boots, Weapons, Accessories. Each row shows tier, stat, socket strip, gem bonuses and Equip / Remove. |
| **Workshop** | The crafting bench: 4-to-1 refine for materials, craft gear, 4-to-1 and mixed craft for gems, and the socket bench. |
| **Smelter** | Dismantling bay. An unworn piece melts into **one material of its own tier** (a quarter of the four it cost) and gives back its gems. Set shards are lost. This is where unwanted gear and failed mixed crafts go. |
| **Blueprints** | Codex of all 18 set blueprints (12 regular, 6 holiday) (unknown until you hold a shard of the set), with the monster and week each drops from, plus a table of every collection source. |
| **Vault** | Enhancement Vault: star up finished gear with duplicates, see section 6. |

Workshop, Smelter and Vault need a built Forge. Gear Sets, Equipment and Blueprints are readable without one.

## 2. Hero level gates
- Every category and set has its own unlock level (`BASIC[..].lv`, `SETS[..].lv`); a piece can be crafted and held at any level but worn only once the hero reaches it. The Equip button reads "Hero Lv N". Worn pieces above the hero's level stop counting.
- Regular sets: Training 32, Construction 34, Rock 35, Paper 36, Scissors 37, Siege 39, Research 40, Tile Hit 47, Rally 49, Wonder Rally / Solo / Defense 50. Holiday: defense sets 46, attack sets 47.

## 2b. Basic Gear (13 categories x 5 slots = 65 items)
Stat per piece scales linearly Grey to Gold. **OPEN ITEM: the spec table does not say whether the percentage is per piece or per full five-piece category; built per piece.**

| Category | Lv | Stat(s) | Grey to Gold |
|---|---|---|---|
| General Defense / Traps | 1 | wall HP, wall trap attack | 1 to 13% |
| General Attack | 3 | troop attack | 1 to 13% |
| Food / Oil / Energy / Steel / Cash Production | 4 / 5 / 6 / 7 / 9 | that resource's production | 2 to 26% |
| Construction | 10 | construction speed | 1.5 to 18% |
| Gathering | 12 | gathering speed, troop load | 2 to 24% |
| Research | 15 | research speed | 1.5 to 18% |
| Troop Training | 21 | troop training speed | 1.5 to 18% |
| Wall Trap Training | 23 | trap training speed | 1.5 to 18% |
| Monster Hunting | 25 | monster energy (stamina) cost cut, hero attack, march speed | 2 to 26% |

Set pieces give every stat of their set at 1 to 8 percent per piece (placeholder, `SET_RANGE`). All of it flows through `wornBonus()` into `mods()`: per-class attack and health, production per resource, build / research / training / trap speed, hunt stamina cost (`huntStam`, stamina is cut up front instead of refunded), wall stats.

## 2c. Named Basic gear per slot (Michelle, 2026-10-01 19:01)
- Basic gear now has a **named item per category and slot**. The **Helmet list is in** (13 items, `BASIC_ITEMS.helmet` in `js/data.js`): Barricaded Face-Plate, Standard-Issue Combat Helmet, Hydroponic Overseer's Mask, Refinery-Operator Respirator, Power-Grid Grounding Helm, Foundry-Worker Shield Mask, Ledger-Keeper's Visor, Contractor's Hardhat, Hauler's Visor, Data-Scribe Visor, Drillmaster's Headset, Ordnance-Assembler Mask, Tracker's Night-Vision Hood. Other slots keep the generic category name until their lists arrive; to add a slot, add its list to `BASIC_ITEMS` (name, four recipe materials, optional `{lv, st, vals}` override).
- **Armor / Chest list is in** (2026-10-01 19:02): 13 Basic armor items (`BASIC_ITEMS.chest`), 12 regular set items and 6 holiday set items (`SET_ITEMS.chest`, name plus recipe string with `2x`, unlocks match each set's level). Shared monster materials (Tough Chitin, Beast Sinew, Sharp Claws, Thick Hide, Hollow Horns, Raw Muscle Tissue) are plain names in the recipes. 31 named armor pieces; Helmet and Armor are done, Footwear, Weapon and Accessory still use generic names.
- **Per-tier values are not linear** (`BASIC_CURVES`): 1 / 2.5 / 4.5 / 7 / 10 / 13, 2 / 5 / 9 / 14 / 20 / 26, 1.5 / 3.5 / 6 / 9.5 / 13.5 / 18, 2 / 4.5 / 8 / 12.5 / 18 / 24. They apply to every slot of the category for now (the helmet list is the only one received); a slot can override with `vals`.
- **Recipes** are four named materials, a repeat means 2x (e.g. 2x Scrap Metal). They are shown in Gear Sets, the Workshop and the art prompts. **Not enforced yet:** the craft still spends four tier materials; the named materials are not stocked or dropped (OPEN ITEM: decide how they are earned).
- Hunt hood stats map to Monster energy cost, Hero attack and march speed.

## 3. Gems
- **Six tiers** (Raw Shard, Calibrated Core, Prism Matrix, Hyper-Lens, Singularity Crystal, Omega Diamond) and the **strict 4-to-1 rule**, exactly like materials: four gems of one kind and tier combine into one of the next tier (Forge 3 x tier gates it). Four of a kind is guaranteed and free.
- **Mixed gem craft** (the casino): four different gems sorted lowest to highest tier give the gem in position 1 / 2 / 3 / 4 with 75 / 20 / 4.9 / 0.1 percent (`MIX_ODDS`, shared with gear). The UI prints the exact odds first.
- **Basic gems (25)** drop anywhere (regular tiles, alliance store, gifts, quests, monster tiles) and boost one thing each. Range by tier, Grey to Gold (exact non-linear tier values from 19:04, e.g. 1 / 2.5 / 4.5 / 7 / 10 / 13, the curves in `BASIC_CURVES`; the table shows the Grey and Gold ends):

| Gem | Boost | Range |
|---|---|---|
| Iron-Plate Gem | General troop defense | 1% to 13% |
| Vitality Gem | General troop health | 1% to 13% |
| Vanguard Gem | General troop attack | 1% to 13% |
| "Rock" Strike Gem | "Rock" troop attack | 1.5% to 18% |
| "Rock" Guard Gem | "Rock" troop defense | 1.5% to 18% |
| "Paper" Strike Gem | "Paper" troop attack | 1.5% to 18% |
| "Paper" Guard Gem | "Paper" troop defense | 1.5% to 18% |
| "Scissors" Strike Gem | "Scissors" troop attack | 1.5% to 18% |
| "Scissors" Guard Gem | "Scissors" troop defense | 1.5% to 18% |
| Siege Breaker Gem | Siege attack (wall traps) | 1.5% to 18% |
| Builder's Gem | Construction speed | 1.5% to 18% |
| Scribe's Gem | Research speed | 1.5% to 18% |
| Drillmaster's Gem | Troop training speed | 1.5% to 18% |
| Ordnance Gem | Trap training speed | 1.5% to 18% |
| Hauler's Gem | Gathering speed and troop load | 2% to 24% |
| Agri Gem | Food production speed | 2% to 26% |
| Petro Gem | Oil production speed | 2% to 26% |
| Grid Gem | Energy production speed | 2% to 26% |
| Foundry Gem | Steel production speed | 2% to 26% |
| Ledger Gem | Cash production speed | 2% to 26% |
| Tracker's Gem | Monster energy cost reduction | 1% to 13% |
| Hunter's Gem | Hero attack and monster damage | 1.5% to 18% |
| March Gem | Hero march speed | 2% to 24% |
| Tile Strike Gem | Tile hit attack | 1.5% to 18% |
| Rally Banner Gem | General rally attack | 1.5% to 18% |

- **Set gems (72)**: four per gear set, **monster loot tiles only**. The first three boost the set's themes, the fourth is the **Set Synergy** gem. Ranges are the same for all four gems of a set:

| Set | Gems | Range |
|---|---|---|
| "Rock" Troop Set | Titan Core Gem (Attack); Titan Shell Gem (Health); Titan Impact Gem (Charge speed); Titan Crest Gem (Set synergy) | 2% to 25% |
| "Paper" Troop Set | Gale Quill Gem (Attack); Gale Plume Gem (Health); Gale Wind Gem (Movement speed); Gale Crest Gem (Set synergy) | 2% to 25% |
| "Scissors" Troop Set | Stalker Fang Gem (Attack); Stalker Chitin Gem (Health); Stalker Venom Gem (Lethality); Stalker Crest Gem (Set synergy) | 2% to 25% |
| Siege (Trap-Killer) Set | Breaker Hammer Gem (Siege attack); Breaker Plating Gem (Defense); Breaker Piston Gem (Destruction speed); Breaker Core Gem (Set synergy) | 2% to 25% |
| Higher Quality Training Set | Alpha Sinew Gem (Training speed); Alpha Whistle Gem (Capacity); Alpha Drum Gem (Cost reduction); Alpha Core Gem (Set synergy) | 2% to 25% |
| Higher Quality Construction Set | Mason Granite Gem (Construction speed); Mason Rivet Gem (Upkeep efficiency); Mason Mallet Gem (Worker efficiency); Mason Core Gem (Set synergy) | 2% to 25% |
| Higher Quality Research Set | Sage Crystal Gem (Research speed); Sage Brain Gem (Cost reduction); Sage Quill Gem (Output boost); Sage Core Gem (Set synergy) | 2% to 25% |
| Tile Hit Attack Set | Nomad Spear Gem (Tile attack); Nomad Hide Gem (Tile health); Nomad Trail Gem (Tile march speed); Nomad Core Gem (Set synergy) | 2.5% to 30% |
| General Rallying Set | Warlord Banner Gem (Rally attack); Warlord Horn Gem (Rally capacity); Warlord Armor Gem (Rally health); Warlord Core Gem (Set synergy) | 2.5% to 30% |
| Wonder Rally Set | Sovereign Crown Gem (Wonder rally attack); Sovereign Ember Gem (Wonder rally health); Sovereign Gold Gem (Wonder march speed); Sovereign Core Gem (Set synergy) | 2.5% to 30% |
| Wonder Solo Set | Phantom Hood Gem (Wonder solo attack); Phantom Void Gem (Wonder solo health); Phantom Stride Gem (Wonder solo march speed); Phantom Core Gem (Set synergy) | 2.5% to 30% |
| Wonder Defense Set | Bastion Wall Gem (Wonder defense); Bastion Stone Gem (Wonder health); Bastion Anchor Gem (Reinforcement speed); Bastion Core Gem (Set synergy) | 2.5% to 30% |
| Rock + Paper Defense Set | Frost Shield Gem (Rock and Paper defense); Frost Ribbon Gem (Base defense health); Frost Tinsel Gem (Garrison capacity); Yule Core Gem (Full-set synergy: wall defense and trap survival) | 3% to 35% |
| Rock + Scissors Defense Set | Solstice Wall Gem (Rock and Scissors defense); Solstice Bell Gem (Base defense health); Solstice Resin Gem (Reinforcement travel speed); Solstice Core Gem (Full-set synergy: rally damage mitigation) | 3% to 35% |
| Paper + Scissors Defense Set | Harvest Ward Gem (Paper and Scissors defense); Harvest Silk Gem (Base defense health); Harvest Leaf Gem (Base shield duration); Harvest Core Gem (Full-set synergy: enemy attack reduction) | 3% to 35% |
| Rock + Paper Attack Set | Spring Strike Gem (Rock and Paper attack); Spring Ash Gem (Combat health); Spring Thread Gem (Hero world map march speed); Spring Core Gem (Full-set synergy: critical damage for Rock and Paper) | 3% to 35% |
| Rock + Scissors Attack Set | Summer Assault Gem (Rock and Scissors attack); Summer Spark Gem (Combat health); Summer Glass Gem (Rally assembly speed); Summer Core Gem (Full-set synergy: PvP troop lethality) | 3% to 35% |
| Paper + Scissors Attack Set | Equinox Blitz Gem (Paper and Scissors attack); Equinox Paper Gem (Combat health); Equinox Seal Gem (Troop lethality); Equinox Core Gem (Full-set synergy: stacking damage aura) | 3% to 35% |

- A gem's effect is its percent for its tier, times (1 + Lapidary research), added to the stats listed in `GEMS[id].as` (`js/data.js`). Effects the game has no stat for yet (capacity, cost reduction, lethality, reinforcement speed, shield duration, critical damage...) feed the **nearest existing stat** and the label shows the spec's wording. **OPEN ITEM:** build those stats for real.
- **Set Synergy**: adds its percent to every stat of its set while 2 or more pieces of the set are worn (Full-Set Synergy of a holiday set: all 5 worn). **Placeholder** activation rule.

- Holiday gems carry Michelle's fuller effect text (`GEM_DESC`, 19:05), shown in the Workshop and Gear Sets and used in the art prompts. Mechanics are unchanged (nearest stat). The synergy core currently needs all 5 pieces of the holiday set worn; her text says "with the matching gear", which may mean fewer. OPEN ITEM.

## 4. The gem socket
- A piece with **1 star** (`GEM_SOCKET_STARS`, placeholder for "fully upgraded") has **one socket** holding **one gem of one type**. Below that the socket is locked and shown capped.
- Gems come out for free (tap the socketed gem in the Workshop's socket bench); a new gem swaps the old one back to stock. A smelted or consumed piece returns its gem.
- All gem and star bonuses flow through `wornBonus()` into `mods()`, so they affect real combat, gathering, training, heal and hunt stamina.

## 5. Collection ecosystem
| Source | What it gives |
|---|---|
| **Regular world tiles** | Generic materials and Basic gems only. Tier weights 40 / 30 / 20 / 10 for Levels 1 to 4 (cut off at the tile level and rescaled, `TILE_W`), so mostly Levels 1 to 3, sometimes 4. Expected finds per full tile `0.5 + 0.25 x level`, half materials, half cores. **Level 5 and 6 tiles**: a 5 percent chance per gather of a **once-a-week Epic jackpot** (`TILE_J5`). **Level 6 tiles**: a 0.1 percent chance per gather of a **6-pack of Gold** (3 Aether-Core + 3 Omega Diamond, `TILE_J6`). |
| **Monster-spawned tiles** | Left behind when a monster dies, same level as the monster, one tile look per monster. The **only source of set shards and set gems**, plus regular finds as above (no jackpots). Gem tier uses the monster drop spread (strict ceiling: own level or lower, Legendary only from level 6, Hunter's instinct research shifts it). Expected set gems per full tile `0.6 + 0.3 x level`; shard chance `30% + 10% x level` (max 90%). A holiday tile gives its **event shard**, and also a shard of one of the week's regular sets. |
| **Alliance Store** (Guild › Store) | Mystery chests for alliance points: 3 finds, each a material or Basic gem, Level 1 (65%) or Level 2 (35%). 50 points each. Points come from opening alliance chests (5 x chest level, 15 per gift). Never set gems. |
| **Alliance P2W gifts** | When an ally buys a pack, a shared gift chest drops for the whole alliance: 2 materials and 2 Basic gems of Level 3 (70%) or Level 4 (30%) plus supplies. In this single-player build allies are simulated: about one in six allied chests is a gift. **Payments stay in sandbox; nothing here touches real money.** |
| **Quests and dailies** | Material pouches and bags of Basic gems (Level 1, sometimes 2) on the daily exercise, forging, three hunt wins and socketing a first gem. |

## 6. Enhancement Vault
Star a piece up to 5 stars. **Star N+1 consumes N+1 duplicates** (same slot, set and tier, not worn), `2,000 x (N+1)` alloy and needs Forge `3 + N` (placeholder). Each star adds 8 percent to the piece's own bonus (`STAR_PCT`). Gems on consumed duplicates return to stock.

## 7. Changes to earlier systems
- **Shards moved to the loot tile.** Killing a monster no longer carries a shard home; gathering the tile it leaves does (camps drop none). Monster kills still give materials, XP, the instant pocket and the alliance chest. This makes the monster tile the exclusive source of set gear materials as the spec says. [MONSTER_HUNTING.md](MONSTER_HUNTING.md) is updated.
- Old saves: the single "gems" counter becomes Vanguard gems; old cores become Basic gems (Strike to Vanguard, Guard and Mend to Vitality, Bulwark to Iron-Plate, Haste to March, Yield to Agri); old set gems become the first gem of that set; a piece's old four gems become one (the highest tier stays socketed, the rest return to stock); gauntlets and greaves are smelted into materials; old sets, shards, gems and loot tiles map to the new sets; old accessories and slot gear become Basic gear categories (`migrateGear`).

## 8. Open items (placeholders)
- Every value in `data.js` section "Gems, sockets and the Forge": gem ranges, the star that opens the socket, star bonus and costs, tile weights, jackpot odds, store cost and rolls.
- Smelter return (one material of the piece's tier) and whether a Basic piece should return less.
- Whether set gems should also drop from the kill itself (the brief says both "monsters drop gems" and "the monster tile is the exclusive source"; built as tile-only).
- What "fully upgraded" means for the gem socket, the nearest-stat mapping of gem effects, and the synergy activation rule.
- Alliance points sources and price.

## 9. Art
New prompts in the checklist (`tools/artcatalog.js`): 6 Forge room interiors, socket and star pieces, blueprint cards, store and gift chests, alliance points icon (group "Forge rooms, sockets and chests"), 72 set gem icons (group "Set gems") and 25 Basic gem icons (group "Basic gems"). Gear icons are 5 slots x 6 tiers = 30 with ONE socket position, drawn capped; the research-locked socket and the Gem Set ring were removed, a Set Synergy glow ring was added; the 12 regular monsters have new names and descriptions, and holiday shards are now 6 (one per holiday set). No gear or monster art had been painted yet, so nothing needs redoing. All pieces share one shape, camera, light and size and are built to be animated (glint sweep, socket pulse, chest open).
