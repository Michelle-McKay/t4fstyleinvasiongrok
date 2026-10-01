# Alliance reference notes

Source: three reference screenshots from a commercial game (Join an Alliance list, alliance home menu, alliance home menu scrolled). Layout and feature ideas only. Names, banners, icons and art must stay original. Not everything here is meant to be built; this is the noted list.

## What the reference shows

**Join an Alliance (list popup)**
- Banner: join bonus, plus shortcuts to Alliance Help, Alliance Store, Alliance Event.
- One row per alliance: tag + name, leader, emblem on a hanging banner, members (22/100), gift level, language, power rank, kills rank, activity ("Active"), and a Join button (Apply if approval is required).
- Search box, Filter button, paging. Tabs on the screen behind: Create, Join, Invites.

**Alliance home**
- Header: tag + name, a short notice ("anyone who intends to be active may join"), big emblem banner with leader name and total alliance power, side stats (Gift Level, Members, Alliance War).
- Quick buttons: Mail All, Applicant (review join requests).
- Menu rows: Alliance Monster, Alliance News, Alliance Store, Alliance Comments, Resource Help, Reinforce, Alliance Help (badge count), Summary & Stats, Manage Alliance, Leave Alliance.
- Chat strip pinned above the dock, with unread counters.

## Mapped to our game

Our resources: Food / Oil / Energy / Steel / Cash. Troops: Rock / Paper / Scissors. Our UI calls the dock tab "Guild" (`alliance` drawer in `js/ui.js`).

| Reference feature | Our game today | Status |
|---|---|---|
| Alliance Store | Guild › Store (mystery chests for alliance points, `allianceStoreHTML`) | Have |
| Alliance Monster (shared monster hunt) | Monster kills drop shared gift chests, Guild › Chests (`docs/MONSTER_HUNTING.md`) | Partly: chests yes, no shared monster to hit together |
| Reinforce | Guild › Embassy: call allies' troops, capacity, tier (`callAllies`, `embassyHTML`) | Have (we only send help to us; no "send my troops to an ally") |
| Alliance Help | "Ask help" on jobs, help clicks capped by Command Center (`askHelp`) | Partly: no list of allies' open requests to help in one tap, no Help All |
| Alliance War / rally | Guild › Rally, Throne (`marchRally`, `throneHTML`) | Have |
| Gift Level | Gift chests from pack purchases and monster kills | Partly: no alliance gift level that grows |
| Members count / list | Alliance tab shows tiles and score only | Gap |
| Resource Help (ask allies for Food/Oil/Energy/Steel/Cash) | None | Gap |
| Alliance News (feed of joins, kills, tile captures, throne changes) | Mail log and notes exist, nothing alliance-wide | Gap |
| Alliance Comments (message board) | Read-only chat strip at the bottom | Gap (needs real players to mean anything) |
| Summary & Stats (power, kills, tiles, contributions per member) | `score` and tile count only | Gap |
| Manage Alliance (ranks R1-R5, notice, recolor, disband) | Recolor and disband in Alliance tab; R5/R4 appointed in Vault after throne | Partly: no notice text, no rank editing screen |
| Leave Alliance | Disband only | Gap |
| Join list with search/filter, applicants | Five local rival alliances, one home alliance | Gap (single-player build; browse could list the five rival alliances) |
| Mail All | None | Gap (low value without real members) |
| Join bonus banner | Welcome prize only | Gap (cheap) |

## Alliance Help reference (two more screenshots)

- Intro text: help speeds up allies' timers; the higher your Stronghold level, the more times you can receive help (help slots scale with Stronghold). A popup repeats this and lists what qualifies: **buildings, research and troop healing**.
- Top bar: **Daily Funds and Loyalty** counter (0/10,000): helping earns alliance funds and loyalty, capped per day.
- List of allies' open requests. Each row: rank numeral (I to V), member name, what they want ("Help me build Lv.18 Wall", "research Lv.4 Energy Recovery", "heal 200,000 soldiers"), a progress bar with a count (13/22 helps received of the slots it can take), and a **Help** button.
- Bottom buttons: **More Information** (the popup) and **Help All** (answer every open request in one tap).
- The home menu shows a red badge with the number of open requests.

Mapped to us: we already have "Ask help" on a job (`askHelp`, help clicks capped by Command Center level, `helpCap()`), so help slots already scale with a building level. Missing: the list of allies' requests with progress bars, Help All, a daily cap on points earned for helping, and a badge on the Guild tab. Allies are simulated, so the list shows simulated allies' build, research and heal timers; helping them earns alliance points up to a daily cap (the reference's cap is 10,000 funds and loyalty a day; ours would be set against our alliance point income). We also have no troop healing timer to ask help for beyond the Med desk; check before building.

## Summary & Stats reference (three more screenshots)

- **Most Power**: ranked list of every member with their power number.
- **Alliance Stats** (lifetime totals): Throne Owned Time, Troops Killed, Troops Killed (Deaths), Traps Destroyed, Troops Killed Ratio, Cities Destroyed, Battles Won / Lost / Win-Loss Ratio, Wars Won / Lost / War Win-Loss Ratio, Enemy Heroes Captured / Executed, Heroes Escaped, Heroes Lost, Bounties Claimed, Alliance Help (helps given) and Help Ratio, Resources Collected, Gifts Opened, Monster Targets Killed.
- **Leaderboard Ranking**: the alliance's rank among all alliances for each of those stats (shows "Unranked" until it places).

Mapped to us: we keep `S.score` and tile count only. Stats we could track from things that already exist: troops killed and lost (Rock/Paper/Scissors), traps destroyed (our 3 trap types), battles won and lost, throne time (`S.throne`), alliance helps, resources collected (Food/Oil/Energy/Steel/Cash), gifts opened (alliance chests), monster targets killed (`docs/MONSTER_HUNTING.md`). Drop or rename ones we have no system for (heroes captured, executed, escaped, bounties). The Most Power list uses simulated allies' power. The leaderboard would rank us against the five local rival alliances. Cheap to build: counters in state plus one table screen.

## Manage Alliance, ranks, public profile, comments (five more screenshots)

**Manage Alliance** is a short menu: **View Ranks** and **View Public Profile**.

**View Ranks** is a permission table. Columns are ranks R1 to R4 and the leader (R5). Each row is one permission:

| Permission | R1 | R2 | R3 | R4 | Leader |
|---|---|---|---|---|---|
| Receive Alliance Gifts | yes | yes | yes | yes | yes |
| Send Alliance Card | yes | yes | yes | yes | yes |
| Promote Members | | | yes | yes | yes |
| Demote Members | | | yes | yes | yes |
| Kick Members | | | | yes | yes |
| Send Alliance Invite | | | | yes | yes |
| Manage Alliance Invites | | | | yes | yes |
| Purchase From Alliance Store Catalog | | | | yes | yes |
| Manage Block List | | | | yes | yes |
| Change Alliance Headline | | | | yes | yes |
| Change Alliance Description | | | | yes | yes |
| Change Alliance Bulletin | | | | yes | yes |
| Summon Alliance Monster | | | | yes | yes |
| Primary Language | | | | | yes |
| Open Recruitment | | | | | yes |
| Change Alliance Flag | | | | | yes |
| Change Alliance Name / Tag | | | | | yes |
| Transfer Alliance Leadership | | | | | yes |
| Disband Alliance | | | | | yes |

Ranks are strictly nested: each rank keeps everything below it and adds more. R3 can promote and demote; R4 runs members, invites, the store catalog, text fields and summoning the alliance monster; only the leader changes identity, language, recruitment and leadership.

**Public profile** (what outsiders see): Alliance Power, Leader, Members count; emblem, tag + name, headline, Gift Level, Language; four buttons (**Comment**, **Members**, **Stats**, **Leader**); and a long free-text description (the "Alliance Description" permission above).

**Alliance Comments**: a board where visitors post comments on an alliance. Each entry shows the commenter's alliance emblem and a text bubble, with a Post Comment button at the bottom. (The reference screenshot of this one was blanked out with a "demo only" overlay, so entry details are partly hidden.)

Mapped to us: we already have R5 and two R4 officers appointed in the Vault after holding the throne (`js/engine.js`, throne rule). Ranks R1-R3 and the permission checks do not exist. Fits our single-player build only as a read-only table (who can do what, with simulated allies at ranks) and a simple profile page for the player's alliance and the five rival alliances (power, leader, members, gift level, description). Summon Alliance Monster ties to the shared monster idea in the gap list. Comments, invites, block list and kick need real members. Our alliance art catalog already has rank badges (R1 to R5) and emblems.

## Art already planned

`tools/artcatalog.js` group `ally` already has 16 emblems, 5 rank badges and 15 feature icons (help, tech, gifts, war, territory, shop, members, donate, chat, rally, embassy, throne, mail, quests, flag), a create banner and a hall backdrop, plus `icon_apoint`, chests and `tabhead_alliance`. Anything built from the gaps above reuses these first. New icons would be needed only for: News, Resource Help, Summary & Stats, Manage, Leave, Applicant, Alliance Monster, Filter. Each would follow the existing `ICOADD('ally', ...)` rules: same shading, color theme, size and camera as the other ally icons, built so it can be animated later, no text.

## Alliance Store reference (three more screenshots)

- Store hub: alliance-points balance at top, three rows: **Store**, **Catalog**, **Store History**.
- Store page: tip line ("ask the leader or an R4 to get a special item from the Catalog"), then **Basic Boosts** (24-hour +25% production for each of the five resources, unlimited purchases) and **Store Items** (7-day +25% production, teleports, hero skill reset, gem helper, 4-hour +25% march size boost). Each card: item picture, duration badge (24H / 7D / 4H), name, price in alliance points, purchase limit.

### Catalog (leader and R4 stock the Store)
- Header shows the alliance **funds** balance (a shared pool, separate from each member's own points). Tip: "Star your favorite item to let your Alliance Leader and Rank 4 Members know what you need."
- Every item has a star counter (members' wishes) so leaders see what is most wanted. Leaders and R4 spend alliance funds to put items in the Store for members to buy.
- Sections and items:
  - **Special**: VIP points (100), hero XP (50K), 7-day +25% production for each of the five resources, 24h and 7d +50% gathering speed, random / advanced / epic teleport, rename player, hero skill reset, hunting skill reset, hero resurrection, daily chance, alliance rename, building move, gem apprentice, equip hero preset.
  - **Resources**: stamina packs (7K, 30K).
  - **Speed Up**: 1m, 15m, 60m, 3h.
  - **War**: 8h peace shield, 12h +20% attack, 12h +20% defense, 4h +25% march size, fake army, disguise, march recall, 15m +25% heroes attack.
  - **Chests**: normal material chest, normal gem chest.
- Prices run from 5,000 (rename, march recall, 1-minute speed up) to 500,000 (hero resurrection) funds.

### Store History
- Two tabs. **Total**: per member, Funds Earned (contributed to the alliance) and Loyalty Spent (their own points spent in the store). **History**: who bought what, quantity, and how long ago.

### Mapped to us (catalog and history)
- Fits our one-hero, single-player build only partly: allies are simulated, so a leader-stocked catalog means the player (as R5) stocks the store from funds earned by simulated members. A simple version: funds fill from chests and gifts, the player stocks the store, simulated allies "buy" and show in History.
- Items that map cleanly: production boosts for Food/Oil/Energy/Steel/Cash, speed ups, peace shield, attack/defense boosts, march size boost, march recall, teleports, VIP points (already tied to `VIP_AP_RATE`), material and gem chests (we already have `storeChestBuy`). Items with no equivalent yet: stamina packs (hunt stamina exists, `docs/MONSTER_HUNTING.md`), hero resurrection, skill resets, rename, building move, fake army, disguise, equip preset.
- Star counters and Total/History tables only mean something with other members, so they would run on simulated allies.

Mapped to us (store): ours is one mystery-chest button (50 points, `STORE_COST`, `storeChestBuy`) with no shop list. Gaps: a real item list with limits, resource boosts (+25% Food/Oil/Energy/Steel/Cash for 24h and 7d), a march size boost, teleport and reset items, a Catalog the leader stocks, and a purchase history. VIP points still come from points spent here (`VIP_AP_RATE`). Chests stay as one of the items. Boost prices must be balanced against how fast alliance points arrive (5 x chest level, 15 per gift), and nothing here touches real money.

New art needed if built: store hub icons (Store, Catalog, History), one boost icon per resource with an up-arrow (five), a march size boost icon, and duration badges drawn in code. Teleport and hero reset reuse existing item art.

## Open decisions

See the thread reply for the recommended build list. Nothing from this doc is built yet.
