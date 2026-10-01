# Forge rooms, hero level gate, gems, sockets and collection sources

Spec: Michelle's gear, gem, monster hunting and Forge messages of 2026-10-01 (16:30, 16:35 master blueprint, 18:08 "finalized" gear catalog). Where they conflict, the latest wins; section 0 lists what changed. It builds on [HERO_SYSTEM.md](HERO_SYSTEM.md), [CRAFTING.md](CRAFTING.md) and [MONSTER_HUNTING.md](MONSTER_HUNTING.md), which are unchanged except where noted at the end. Code: `js/forge.js` (rooms and UI), `js/engine.js` (rules), `js/data.js` (tables, section "Gems, sockets and the Forge"). **Every number marked placeholder is a default for balancing, not a decision.**

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

## 1. The Forge (six rooms)
Tapping the Forge building opens Hero › Forge, a room bar with six rooms.

| Room | What it does |
|---|---|
| **Gear Sets** | Set-organised view with three tabs: Basic Gear (13 categories), Regular Sets (12) and Holiday Sets (6). Each card shows hero level, stats, the 2 / 3 / 5 piece bonus, worn count, pieces owned and shards; tap a set for its five slots, core materials, source monsters, Gem Set bonus and a Craft with shard shortcut. |
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

## 3. Gems
- **Six tiers** (Raw Shard, Calibrated Core, Prism Matrix, Hyper-Lens, Singularity Crystal, Omega Diamond) and the **strict 4-to-1 rule**, exactly like materials: four gems of one kind and tier combine into one of the next tier (Forge 3 x tier gates it). Four of a kind is guaranteed and free.
- **Mixed gem craft** (the casino): four different gems sorted lowest to highest tier give the gem in position 1 / 2 / 3 / 4 with 75 / 20 / 4.9 / 0.1 percent (`MIX_ODDS`, shared with gear). The UI prints the exact odds first.
- **Regular gems ("cores")**: Strike (troop attack), Guard (troop health), Bulwark (wall HP), Haste (march speed), Yield (yield), Mend (heal speed). Generic, non-set stats.
- **Monster Gems**: one per monster, 27 in all (12 weekly, 15 holiday). A Monster Gem gives the first stat of its monster's gear set. They are tied to the monster: see section 5.
- Power per gem by tier, **placeholder**: +0.4 / 0.7 / 1.1 / 1.6 / 2.2 / 3.0 percent (`GEM_PCT`). Lapidary research (Crafting tree, 5 levels) adds 4 to 20 percent to gem power.

## 4. Sockets
- Every gear piece has **4 sockets**. **Sockets 1 to 3 open by quality**, **socket 4 opens with the Gemology research** (Crafting tree, `gemology`, one level).
- Open sockets by quality, **placeholder** (`socketsNative`): Grey 1, White 1, Green 2, Blue 2, Purple 3, Gold 3. Socket 4 is independent of quality, so a Grey piece with Gemology has sockets 1 and 4 open and 2 and 3 closed.
- **Gem Set bonus**: four Monster Gems of one set in all four sockets of one piece add a bonus to that set's stat, **placeholder** by the lowest tier of the four: 1 / 2 / 3 / 4.5 / 6.5 / 9 percent (`GEMSET_PCT`). All four sockets must be open, so only **Purple or Gold gear with Gemology** can complete one. The Gem Set bonus is the first stat of the monster's set. Regular cores never form a Gem Set.
- Gems come out of a socket for free (tap it). A smelted or consumed piece returns its gems.
- All gem and star bonuses flow through `wornBonus()` into `mods()`, so they affect real combat, gathering, training, heal and hunt stamina.

## 5. Collection ecosystem
| Source | What it gives |
|---|---|
| **Regular world tiles** | Generic materials and cores only. Tier weights 40 / 30 / 20 / 10 for Levels 1 to 4 (cut off at the tile level and rescaled, `TILE_W`), so mostly Levels 1 to 3, sometimes 4. Expected finds per full tile `0.5 + 0.25 x level`, half materials, half cores. **Level 5 and 6 tiles**: a 5 percent chance per gather of a **once-a-week Epic jackpot** (`TILE_J5`). **Level 6 tiles**: a 0.1 percent chance per gather of a **6-pack of Gold** (3 Aether-Core + 3 Omega Diamond, `TILE_J6`). |
| **Monster-spawned tiles** | Left behind when a monster dies, same level as the monster, one tile look per monster. The **only source of set shards and Monster Gems**, plus regular finds as above (no jackpots). Gem tier uses the monster drop spread (strict ceiling: own level or lower, Legendary only from level 6, Hunter's instinct research shifts it). Expected Monster Gems per full tile `0.6 + 0.3 x level`; shard chance `30% + 10% x level` (max 90%). A holiday tile gives its **event shard**, and also a shard of one of the week's regular sets. |
| **Alliance Store** (Guild › Store) | Mystery chests for alliance points: 3 finds, each a material or core, Level 1 (65%) or Level 2 (35%). 50 points each. Points come from opening alliance chests (5 x chest level, 15 per gift). Never Monster Gems. |
| **Alliance P2W gifts** | When an ally buys a pack, a shared gift chest drops for the whole alliance: 2 materials and 2 cores of Level 3 (70%) or Level 4 (30%) plus supplies. In this single-player build allies are simulated: about one in six allied chests is a gift. **Payments stay in sandbox; nothing here touches real money.** |
| **Quests and dailies** | Material pouches and bags of basic cores (Level 1, sometimes 2) on the daily exercise, forging, three hunt wins and socketing a first gem. |

## 6. Enhancement Vault
Star a piece up to 5 stars. **Star N+1 consumes N+1 duplicates** (same slot, set and tier, not worn), `2,000 x (N+1)` alloy and needs Forge `3 + N` (placeholder). Each star adds 8 percent to the piece's own bonus (`STAR_PCT`). Gems on consumed duplicates return to stock.

## 7. Changes to earlier systems
- **Shards moved to the loot tile.** Killing a monster no longer carries a shard home; gathering the tile it leaves does (camps drop none). Monster kills still give materials, XP, the instant pocket and the alliance chest. This makes the monster tile the exclusive source of set gear materials as the spec says. [MONSTER_HUNTING.md](MONSTER_HUNTING.md) is updated.
- Old saves: the single "gems" counter becomes Strike cores; gauntlets and greaves are smelted into materials; old sets, shards, gems and loot tiles map to the new sets; old accessories and slot gear become Basic gear categories (`migrateGear`).

## 8. Open items (placeholders)
- Every value in `data.js` section "Gems, sockets and the Forge": gem power, Gem Set power, sockets per tier, star bonus and costs, tile weights, jackpot odds, store cost and rolls.
- Smelter return (one material of the piece's tier) and whether a Basic piece should return less.
- Whether Monster Gems should also drop from the kill itself (the brief says both "monsters drop gems" and "the monster tile is the exclusive source"; built as tile-only).
- Gem set bonus across two pieces, and a research that opens sockets 2 and 3 early.
- Alliance points sources and price.

## 9. Art
New prompts in the checklist (`tools/artcatalog.js`): 6 Forge room interiors, socket and star pieces, blueprint cards, store and gift chests, alliance points icon (group "Forge rooms, sockets and chests"), 27 Monster Gem icons (group "Monster Gems") and the 6 core icons. Gear icons are now 5 slots x 6 tiers = 30 with four sockets (open by quality, the fourth always capped for research); the 12 regular monsters have new names and descriptions, and holiday shards are now 6 (one per holiday set). No gear or monster art had been painted yet, so nothing needs redoing. All pieces share one shape, camera, light and size and are built to be animated (glint sweep, socket pulse, chest open).
