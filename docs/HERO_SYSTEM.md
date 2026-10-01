# Invasion: Hero System Design Summary

## 1. Core concept
- One hero only per player, never more.
- Player picks from full-body animated avatars (cosmetic only, identical stats).
- Hero levels 1 to 50.
- Design reference: Game of War: Fire Age, Mobile Strike, Vikings: War of Clans.

## 2. Hero XP curve (blueprint: Game of War: Fire Age)
Each row is the XP needed to go from that level to the next.
Levels 1-6 and 43-49 come from a fan guide for the original game. Levels 7-42 are interpolated.

| Level | XP to next | Total XP so far |
|---|---|---|
| 1 | 10,000 | 10,000 |
| 2 | 20,000 | 30,000 |
| 3 | 30,000 | 60,000 |
| 4 | 40,000 | 100,000 |
| 5 | 50,000 | 150,000 |
| 6 | 60,000 | 210,000 |
| 7 | 70,000 | 280,000 |
| 8 | 80,000 | 360,000 |
| 9 | 90,000 | 450,000 |
| 10 | 100,000 | 550,000 |
| 11 | 120,000 | 670,000 |
| 12 | 130,000 | 800,000 |
| 13 | 150,000 | 950,000 |
| 14 | 175,000 | 1,125,000 |
| 15 | 200,000 | 1,325,000 |
| 16 | 230,000 | 1,555,000 |
| 17 | 260,000 | 1,815,000 |
| 18 | 300,000 | 2,115,000 |
| 19 | 340,000 | 2,455,000 |
| 20 | 390,000 | 2,845,000 |
| 21 | 450,000 | 3,295,000 |
| 22 | 510,000 | 3,805,000 |
| 23 | 590,000 | 4,395,000 |
| 24 | 670,000 | 5,065,000 |
| 25 | 770,000 | 5,835,000 |
| 26 | 880,000 | 6,715,000 |
| 27 | 1,000,000 | 7,715,000 |
| 28 | 1,150,000 | 8,865,000 |
| 29 | 1,310,000 | 10,175,000 |
| 30 | 1,500,000 | 11,675,000 |
| 31 | 1,720,000 | 13,395,000 |
| 32 | 1,960,000 | 15,355,000 |
| 33 | 2,240,000 | 17,595,000 |
| 34 | 2,570,000 | 20,165,000 |
| 35 | 2,930,000 | 23,095,000 |
| 36 | 3,360,000 | 26,455,000 |
| 37 | 3,840,000 | 30,295,000 |
| 38 | 4,390,000 | 34,685,000 |
| 39 | 5,020,000 | 39,705,000 |
| 40 | 5,740,000 | 45,445,000 |
| 41 | 6,560,000 | 52,005,000 |
| 42 | 7,500,000 | 59,505,000 |
| 43 | 10,000,000 | 69,505,000 |
| 44 | 15,000,000 | 84,505,000 |
| 45 | 20,000,000 | 104,505,000 |
| 46 | 50,000,000 | 154,505,000 |
| 47 | 50,000,000 | 204,505,000 |
| 48 | 100,000,000 | 304,505,000 |
| 49 | 200,000,000 | 504,505,000 |

- Total to reach level 50: about 504.5 million XP (fits in a 32-bit int; use long if you add headroom).
- Levels 46-49 are about 400M of the total, roughly 80% of the cost.

## 3. Gear (7 pieces = 1 set)
Helm, Chest Armor, Gauntlets, Greaves, Boots, Weapon, Amulet.
- Full 7-piece set triggers the set bonus.
- Optional partial bonuses at 3 and 5 pieces.

## 4. Hero screen layout
- Top bar: name, level, XP bar, hero power.
- Center: full-body animated avatar in idle pose (tap to play a flex or attack animation).
- Left column: Helm, Chest Armor, Gauntlets, Greaves.
- Right column: Weapon, Boots, Amulet, set progress indicator (e.g. 5/7).
- Below the hero: core stats (Attack, Defense, HP, Leadership) with green "+" gear bonuses.
- Bottom tabs: Gear, Skills, Avatar, Inventory.
- Red dots for better gear, ready level-ups, unspent skill points.
- Tapping a slot: equipped item stats plus Upgrade button, and a scrollable list of owned gear with green/red comparison arrows.

## 5. XP item monetization
Target: about $10,000 to take a hero from level 1 to 50 using XP items alone.
Every pack holds 5 items. Bigger packs give a better rate.

| Pack | Item XP | Pack XP | Price | $ per 100k XP |
|---|---|---|---|---|
| Tiny | 10,000 | 50,000 | $1.49 | $2.98 |
| Small | 50,000 | 250,000 | $6.99 | $2.80 |
| Medium | 100,000 | 500,000 | $12.99 | $2.60 |
| Large | 250,000 | 1,250,000 | $29.99 | $2.40 |
| Huge | 500,000 | 2,500,000 | $54.99 | $2.20 |
| Grand | 1,000,000 | 5,000,000 | $99.99 | $2.00 |

Full climb (504.5M XP) by pack type:
- Grand only: about $10,090
- Huge only: about $11,100
- Large only: about $12,100
- Medium only: about $13,100
- Small only: about $14,100
- Tiny only: about $15,000

Cost by stretch at $2.00 per 100k: levels 1-30 about $235, 30-45 about $1,855, 45-46 about $400, 46-47 about $1,000, 47-48 about $1,000, 48-49 about $2,000, 49-50 about $4,000.

## 6. Free XP
- Keep earned XP roughly flat, around 100k per day (daily quests, building/research completion, battles, weekly events).
- Free players reach about level 26 in 2 months, about level 40 in 13 months; level 50 takes over a decade.
- Free daily drops can use the same items (e.g. 2 Tiny + 1 Small) so players learn item values.

## 7. Rules to protect the pricing
- XP boosts (like a Gymnos-style building) apply to earned XP only, never to purchased items.
- Never run sales that push any pack below $2.00 per 100k XP; keep sale depth to 20-30% on smaller packs.
- No catch-up mechanics that give bigger free XP at higher levels.
- Single-item sales (if offered) must cost more per item than the same item inside a pack.
- Add a "use max" or multi-use button (level 50 needs up to 200 Grand items).

## 8. Open items
- Level cap tied to player or base level?
- Set bonus values and gear rarity tiers.
- Skill tree and skill points per level.
- Starter pack and limited-time offers.
- Gem pack lineup (separate from XP packs).
- Whether avatar switching is free or costs something.

## 9. Sources
- Hero XP blueprint: unofficial Game of War: Fire Age wiki guide (explainedabout.com). Levels 7-42 are my interpolation, not original data.

---

## 10. How this is built in the game (js/data.js, js/engine.js, js/ui.js, js/packs.js)
- One hero per player. The three existing characters are now avatars with identical stats (Hero > Avatar tab). Old saves convert to level 1.
- XP curve is `HERO_XP` in data.js, copied from the table above (total to level 50 = 504,505,000). XP is stored as progress toward the next level; nothing is lost at the cap.
- Hero stats: Attack, Defense, HP and Leadership each +0.4% per level (`HERO_STAT`), identical for every avatar. Attack and Leadership only apply when the hero marches. Gear bonuses show in green next to them.
- Gear: 7 slots (Helm, Chest Armor, Gauntlets, Greaves, Weapon, Boots, Amulet) made in the Forge as before. Set bonuses apply at 3, 5 and 7 worn pieces of one set. The existing sets (Vanguard, Outrider, Battery) each have one monster, as before.
- Hero screen: Hero tab in the hero drawer, laid out as in section 4. Tap the avatar for a flex, tap again for an attack. Red dots: better gear owned, unspent skill points, XP items waiting in the bag.
- XP items: 6 sizes (10k to 1M XP), packs of 5 sold at the prices in section 5 (sandbox purchases only). Inventory tab has Use and Use max. No single-item sales exist. `xpPackRate()` returns $ per 100k XP; every pack is at or above $2.00.
- Free XP: hunts (3,000 x monster grade), building and research completion (400 x level), and the daily exercise (2 Tiny + 1 Small items). No catch-up scaling. The game's drill clock runs faster than the real game, so the free-XP numbers are placeholders to tune.

- **Gear gates and slots (2026-10-01, supersedes the 7-slot and 3/5/7 text above):** five slots (Helmet, Armor, Footwear, Weapon, Accessory); set bonuses at 2, 3 and 5 pieces; every Basic gear category and every set has its own hero unlock level (Lv 1 to 50). See [FORGE_GEMS.md](FORGE_GEMS.md).

## 11. Open items still placeholders
- Level cap: flat 50 (`HERO_MAX`), not tied to player or base level.
- Set bonus values (`SETS[...].b`) and gear rarity tiers: placeholder values; rarity is the existing grades 1 to 6.
- Skill tree: built (section 12), values are placeholders.
- Starter pack and limited-time offers: not added.
- Gem pack lineup: unchanged. Gems (25 Basic and 72 set gems, one per piece) are now built, see FORGE_GEMS.md.
- Avatar switching: free (`AVATAR_SWITCH_COST = 0`).
- Full-body avatars are vector placeholders until painted art arrives (prompts are in the art checklist).

## 12. Skill trees (built)
- One point per level (49 at level 50). Main tree: 14 tiers, 40 nodes. Hunting tree: root, two branches, three advanced nodes (6 nodes). Everything fits in 46 points.
- A node needs one learned node in the tier above; II and III need the lower level of the same skill. Reset is free (open item).
- Mapping from the reference game: Wood/Stone/Iron/Silver production become Oil/Energy/Steel/Cash; Infantry/Cavalry/Ranged attack become Rock/Paper/Scissors; Troop Defense becomes wall HP; Trap Attack becomes wall trap attack. Hunting "Energy" is our hunt stamina.
- Hunting nodes: Monster Target Debuff (weaker monsters), Energy Cost Reduction (stacks with gear, capped at 50% total), Energy Recovery, Maximum Energy Limit, Hero Attack, Hero Attack Streak (per hunt streak step, up to 10). Hunter's instinct research only affects drops, so nothing overlaps.
- Node values are placeholders (`SK_VAL` in data.js).
