# Monster hunting, holiday monsters and drop rules

Spec: Michelle's "Monster Hunting, Global Holidays, and Drop Mechanics" brief. Code: `js/data.js` (tables and pure rules), `js/engine.js` (`huntSpoils`, stamina, chests), `js/ui.js` (Mission › Hunt, Guild › Chests, hunt report). Built on the gear sets in [CRAFTING.md](CRAFTING.md) and the hero in [HERO_SYSTEM.md](HERO_SYSTEM.md).

## 1. Regular rotation
- 12 regular monsters, one per gear set (`SETS`, ordered by `SET_ORDER`). Each guards exactly one set and its shards. Each leaves its own loot tile on the map.
- **3 are on the map all week, every week.** The 12 form four cycles of three (`huntCycle`): Troop week (Vanguard, Outrider, Marksman), Economy week (Battery, Prospector, Caravan), Builder week (Foundry, Academy, Medic), Fortress week (Bulwark, Breaker, Tracker). The week turns over Monday 00:00 UTC; the cycle repeats every four weeks.
- A monster tile picks one of the week's three from its coordinates (`monsterIdAt`), so the pack positions never change, only who stands on them.
- Set bonuses: Vanguard, Outrider, Battery are the original sets. **The other nine are placeholders** (3/5/7 pieces, values +4-5% / +8-10% / +12-15%) over stats the game already has: ranged and siege attack, gather speed, march speed, build, training, heal, wall HP, plus Tracker, which refunds 15 / 25 / 40% of hunt stamina on a win. OPEN ITEM: real values and rarity.

## 2. Hunt stamina
- Pool of 120, one point back per 20 drill seconds (5 sheet minutes). Cost to hunt a monster: `10 + 4 x (level - 1)`, so level 1 costs 10 and level 6 costs 30. Camps are free.
- Recalling a column before it arrives refunds the whole cost. Tracker gear refunds a share of the cost on every win.
- Tracked in the Hunt tab: spent, refunded, **materials per 10 net stamina**, hunts and wins.

## 3. Victory report
Every win adds this to the report (`huntReportHTML`):
- stamina spent, gear refund and net cost
- materials rolled (carried home with the column). Shards and Monster Gems are **not** carried by the kill: they sit in the monster's loot tile ([FORGE_GEMS.md](FORGE_GEMS.md) section 5)
- **hunt streak**: a win within 10 minutes of the last keeps the streak; every 3 in a row adds one extra material roll (up to +3); a loss resets it
- Commander XP (`XP_FREE.hunt x level`), hero upgrade items (XP item chance `20% + 5% x level`, size by level) and hero fragments (`1 + level`, 10 fragments fuse into a Tiny XP item)
- an **instant resource pocket**, credited at once (the carried loot still rides home with the column)
- an **alliance gift chest** of the monster's level

## 4. Alliance gift chests
Every kill drops a chest for the whole alliance (`S.chests`). Allies' kills add their chests over time (simulated, as with every ally in this single-player build). Chest level 1-6; contents scale with level: two resource lots, `1 + floor(level / 2)` material rolls, a chance at an XP item. Chests expire after 24 hours; the Guild › Chests tab opens one or all.

## 5. Holiday monsters
Each holiday spawns its own monster for **one full week from the holiday date**, every year, replacing 30% of the map's monster packs (`HOL_SHARE`). Several holidays can overlap (Halloween and Día de los Muertos, for example); then each replaced pack picks one at random.
A holiday monster's loot tile gives regular loot (including a shard of one of the week's regular sets) **plus an event shard** (`30% + 10% x level`, max 90%, scaled by how much of the tile one column takes) for that holiday's limited gear set (`SETS['h_' + id]`, 7 pieces). Event shards and crafted pieces persist, so an unfinished set is finished when the event returns. The Hunt tab shows each set's progress.

| Holiday | Date rule | Monster | Event set |
|---|---|---|---|
| New Year's Day | Jan 1 | Countdown Colossus | Countdown |
| Valentine's Day | Feb 14 | Heartforge Hound | Heartstring |
| St. Patrick's Day | Mar 17 | Clover Golem | Clover |
| Memorial / Victoria Day | Victoria Day (Monday before May 25) and Memorial Day (last Monday of May), two weeks, same monster | Poppy Sentinel | Poppy |
| Canada Day | Jul 1 | Maple Moose | Maple |
| Independence Day | Jul 4 | Sparkler Bison | Sparkler |
| Thanksgiving | Canada: 2nd Monday of October; US: 4th Thursday of November | Harvest Gobbler | Harvest |
| Halloween | Oct 31 | Lantern Wraith | Hollow |
| Christmas / Winter Holidays | Dec 25 | Frostback Yeti | Evergreen |
| Chinese New Year / Spring Festival | lunar, tabled | Festival Lion | Festival |
| Diwali | Hindu lunisolar, tabled | Lamp Phoenix | Diya |
| Eid al-Fitr / Eid al-Adha | Islamic lunar, tabled, two weeks a year | Crescent Oryx | Crescent |
| Holi | Hindu lunisolar, tabled | Pigment Chameleon | Gulal |
| Día de los Muertos | Nov 1 | Marigold Spirit-Hound | Marigold |
| Mid-Autumn / Moon Festival | lunar, tabled | Moonlit Hare | Moonlight |

Dates: fixed and weekday-rule holidays are computed for any year. Lunar and Hindu dates are in `HOL_TABLE` for 2026-2035, generated from the standard lunar calendars (Eid can move a day with moon sighting). OPEN ITEM: extend the table each year after 2035. The week starts on the holiday date; `holidayWindows` is the one place to add a lead-in (a Halloween week that ends on Oct 31, say) if wanted.
**Demo preview:** open the game with `?holiday=halloween` (any holiday id) or press Preview next to a holiday in Mission › Hunt. Preview puts that monster on the map now and is not saved.

## 6. Level scaling and the strict ceiling
A monster drops materials of **its own level or lower, never higher**. Only level 6 monsters can drop Legendary (Gold). Higher levels also give more guaranteed rolls (`1 + floor(level / 2)`), bigger chests, more XP, more instant pocket, and cost more stamina.

## 7. Drop-rate spread (`DROP_MAX`, `dropOdds`)
Level 6 monsters with the Hunter's instinct research maxed (Field tree, 10 levels):

| Basic + Common + Uncommon (grey, white, green) | Rare (blue) | Epic (purple) | Legendary (gold) |
|---|---|---|---|
| 50% (25 / 15 / 10) | 35% | 14.3% | **0.7%** |

Design intent: Legendary stays rare and lucky, about one direct level 6 drop a week for a daily hunter, so players lean on the 4-to-1 refining and Legendary gear stays a badge of honor.
- **Lower levels use the same shape cut off at their level and rescaled to 100%.** A level 5 monster has no Legendary roll at all; its spread is the level 5 slice of the table above (about 25 / 15 / 10 / 35 / 14.4 percent at max research).
- **Research** blends from `DROP_BASE` (32 / 20 / 13 / 29 / 5.5 / 0.5, no research) to `DROP_MAX` by `level / 10`. The Hunt tab prints the live odds for every level.
- Camps and gathering do not use this table.

## 8. Art
Monster Gems per set are in [FORGE_GEMS.md](FORGE_GEMS.md). Prompts are in the art checklist (`tools/artcatalog.js`): 9 new regular monsters (plus the original 3), 15 holiday monsters, 27 loot tiles, 15 event shards and the alliance chest (closed and open frames). Same rules as all art: one image per monster with the level drawn in code, same camera, light and size, built so it can be animated later. Until painted images land, the game draws the level-shaped body with an accent in the set colour.
