# Forge rooms, hero level gate, gems, sockets and collection sources

Spec: Michelle's "Complete Gear, Gem, Monster Hunting, and Forge Economy" update (2026-10-01). It builds on [HERO_SYSTEM.md](HERO_SYSTEM.md), [CRAFTING.md](CRAFTING.md) and [MONSTER_HUNTING.md](MONSTER_HUNTING.md), which are unchanged except where noted at the end. Code: `js/forge.js` (rooms and UI), `js/engine.js` (rules), `js/data.js` (tables, section "Gems, sockets and the Forge"). **Every number marked placeholder is a default for balancing, not a decision.**

## 1. The Forge (six rooms)
Tapping the Forge building opens Hero › Forge, a room bar with six rooms.

| Room | What it does |
|---|---|
| **Gear Sets** | Set-organised view: Basic Gear, then Weekly sets (12) and Holiday sets (15). Each card shows the 3 / 5 / 7 piece bonus, worn count, pieces owned, shards, whether its monster is on the map now. Tap a set for its seven slots, its Gem Set bonus and a Craft with shard shortcut. |
| **Equipment** | Type-organised view with a filter bar: Entire list, Helmets, Armor (chest, gauntlets, greaves), Boots, Weapons, Accessories. Each row shows tier, stat, socket strip, gem bonuses and Equip / Remove. |
| **Workshop** | The crafting bench: 4-to-1 refine for materials, craft gear, 4-to-1 and mixed craft for gems, and the socket bench. |
| **Smelter** | Dismantling bay. An unworn piece melts into **one material of its own tier** (a quarter of the four it cost) and gives back its gems. Set shards are lost. This is where unwanted gear and failed mixed crafts go. |
| **Blueprints** | Codex of all 27 set blueprints (unknown until you hold a shard of the set), with the monster and week each drops from, plus a table of every collection source. |
| **Vault** | Enhancement Vault: star up finished gear with duplicates, see section 6. |

Workshop, Smelter and Vault need a built Forge. Gear Sets, Equipment and Blueprints are readable without one.

## 2. Hero level gate
- **Basic Gear** (no set) can be worn at any hero level.
- **Set gear** (weekly set, holiday set) needs **hero level 30** to wear (`HERO_SET_LV`). It can be crafted and held before that; the Equip button reads "Hero Lv 30" and the hero screen ignores locked pieces for the red better-gear dot. Set bonuses only count pieces the hero may wear.

## 3. Gems
- **Six tiers** and the **strict 4-to-1 rule**, exactly like materials: four gems of one kind and tier combine into one of the next tier (Forge 3 x tier gates it). Four of a kind is guaranteed and free.
- **Mixed gem craft** (the casino): four different gems sorted lowest to highest tier give the gem in position 1 / 2 / 3 / 4 with 75 / 20 / 4.9 / 0.1 percent (`MIX_ODDS`, shared with gear). The UI prints the exact odds first.
- **Regular gems ("cores")**: Strike (troop attack), Guard (troop health), Bulwark (wall HP), Haste (march speed), Yield (yield), Mend (heal speed). Generic, non-set stats.
- **Monster Gems**: one per gear set, 27 in all (12 weekly monsters, 15 holiday monsters). A Monster Gem gives its set's stat (the stat of the 3-piece bonus; Tracker gems add hunt stamina refund at 4x weight). They are tied to the monster: see section 5.
- Power per gem by tier, **placeholder**: +0.4 / 0.7 / 1.1 / 1.6 / 2.2 / 3.0 percent (`GEM_PCT`). Lapidary research (Crafting tree, 5 levels) adds 4 to 20 percent to gem power.

## 4. Sockets
- Every gear piece has **4 sockets**. **Sockets 1 to 3 open by quality**, **socket 4 opens with the Gemology research** (Crafting tree, `gemology`, one level).
- Open sockets by tier, **placeholder** (`socketsNative`): Basic 1, Common 1, Uncommon 2, Rare 2, Epic 3, Legendary 3. Socket 4 is independent of quality, so a Basic piece with Gemology has sockets 1 and 4 open and 2 and 3 closed.
- **Gem Set bonus**: four Monster Gems of one set in all four sockets of one piece add a bonus to that set's stat, **placeholder** by the lowest tier of the four: 1 / 2 / 3 / 4.5 / 6.5 / 9 percent (`GEMSET_PCT`). All four sockets must be open, so only **Epic or Legendary gear with Gemology** can complete one. Regular cores never form a Gem Set.
- Gems come out of a socket for free (tap it). A smelted or consumed piece returns its gems.
- All gem and star bonuses flow through `wornBonus()` into `mods()`, so they affect real combat, gathering, training, heal and hunt stamina.

## 5. Collection ecosystem
| Source | What it gives |
|---|---|
| **Regular world tiles** | Generic materials and cores only. Tier weights 40 / 30 / 20 / 10 for Levels 1 to 4 (cut off at the tile level and rescaled, `TILE_W`), so mostly Levels 1 to 3, sometimes 4. Expected finds per full tile `0.5 + 0.25 x level`, half materials, half cores. **Level 5 and 6 tiles**: a 5 percent chance per gather of a **once-a-week Epic jackpot** (`TILE_J5`). **Level 6 tiles**: a 0.1 percent chance per gather of a **6-pack of Gold** (3 Legendary materials + 3 Legendary cores, `TILE_J6`). |
| **Monster-spawned tiles** | Left behind when a monster dies, same level as the monster, one tile look per monster. The **only source of set shards and Monster Gems**, plus regular finds as above (no jackpots). Gem tier uses the monster drop spread (strict ceiling: own level or lower, Legendary only from level 6, Hunter's instinct research shifts it). Expected Monster Gems per full tile `0.6 + 0.3 x level`; shard chance `30% + 10% x level` (max 90%). A holiday tile gives its **event shard**, and also a shard of one of the week's regular sets. |
| **Alliance Store** (Guild › Store) | Mystery chests for alliance points: 3 finds, each a material or core, Level 1 (65%) or Level 2 (35%). 50 points each. Points come from opening alliance chests (5 x chest level, 15 per gift). Never Monster Gems. |
| **Alliance P2W gifts** | When an ally buys a pack, a shared gift chest drops for the whole alliance: 2 materials and 2 cores of Level 3 (70%) or Level 4 (30%) plus supplies. In this single-player build allies are simulated: about one in six allied chests is a gift. **Payments stay in sandbox; nothing here touches real money.** |
| **Quests and dailies** | Material pouches and bags of basic cores (Level 1, sometimes 2) on the daily exercise, forging, three hunt wins and socketing a first gem. |

## 6. Enhancement Vault
Star a piece up to 5 stars. **Star N+1 consumes N+1 duplicates** (same slot, set and tier, not worn), `2,000 x (N+1)` alloy and needs Forge `3 + N` (placeholder). Each star adds 8 percent to the piece's own bonus (`STAR_PCT`). Gems on consumed duplicates return to stock.

## 7. Changes to earlier systems
- **Shards moved to the loot tile.** Killing a monster no longer carries a shard home; gathering the tile it leaves does (camps drop none). Monster kills still give materials, XP, the instant pocket and the alliance chest. This makes the monster tile the exclusive source of set gear materials as the spec says. [MONSTER_HUNTING.md](MONSTER_HUNTING.md) is updated.
- Old saves: the single "gems" counter becomes cores (one Strike core each); pieces get `gems` and `stars` on demand.

## 8. Open items (placeholders)
- Every value in `data.js` section "Gems, sockets and the Forge": gem power, Gem Set power, sockets per tier, star bonus and costs, tile weights, jackpot odds, store cost and rolls.
- Smelter return (one material of the piece's tier) and whether a Basic piece should return less.
- Whether Monster Gems should also drop from the kill itself (the brief says both "monsters drop gems" and "the monster tile is the exclusive source"; built as tile-only).
- Gem set bonus across two pieces, and a research that opens sockets 2 and 3 early.
- Alliance points sources and price.

## 9. Art
New prompts in the checklist (`tools/artcatalog.js`): 6 Forge room interiors, socket and star pieces, blueprint cards, store and gift chests, alliance points icon (group "Forge rooms, sockets and chests"), 27 Monster Gem icons (group "Monster Gems") and the 6 core icons. The gear icon prompts now show four sockets (open by quality, the fourth always capped for research); no gear art had been painted yet, so nothing needs redoing. All pieces share one shape, camera, light and size and are built to be animated (glint sweep, socket pulse, chest open).
