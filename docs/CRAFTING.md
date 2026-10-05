# Gear crafting and material system

Spec: Michelle's "Hero Gear Crafting & Material System" brief. Built on the existing Forge, the "bars" stockpile and the seven hero gear slots. No parallel system: the six named tiers are the existing grades 1 to 6.

## Tiers (`QUALITY` in js/data.js)
Gear quality: Grey (Basic), White (Common), Green (Uncommon), Blue (Rare), Purple (Epic), Gold (Legendary). Materials use the same six tiers under their own names: Composite Alloy, Carbon Fiber, Ballistic Polymer, Quantum Circuitry, Nano-Titanium, Aether-Core. Gems: Raw Shard, Calibrated Core, Prism Matrix, Hyper-Lens, Singularity Crystal, Omega Diamond.

## Rules (`craft`, `refine` in js/engine.js)
- **4-to-1:** four materials of one tier refine into one of the next (Forge 3 x tier gates it). 1,024 Basic = 1 Legendary.
- **Guaranteed:** four materials of one tier craft a gear piece of exactly that tier, no RNG. The old Forge "grade-up chance" was removed because it contradicted this.
- **Mixed craft (the casino):** sort the four inputs lowest to highest. Output is the input in position 1/2/3/4 with chance **75% / 20% / 4.9% / 0.1%** (`MIX_ODDS`). The brief gave ranges (70-75, 20-24, ~4.9, ~0.1); these defaults sum to 100%. Repeated tiers collapse, so Basic, Basic, Uncommon, Legendary gives Basic 95%, Uncommon 4.9%, Legendary 0.1%. The UI shows the exact odds before you commit.
- **Sources:** monsters drop materials by the strict-ceiling spread (own level or lower, Legendary only from level 6, 0.7% at max research); the loot tile they leave holds shards of the set they guard and set gems: 12 regular monsters, one per set, three on the map each week, plus a limited event set per holiday. Full rules: [MONSTER_HUNTING.md](MONSTER_HUNTING.md). Packs and chests also grant materials. Real-money packs stay sandbox only.

## Art
Material icons `mat_1`..`mat_6` have prompts in the art checklist (same ingot, same angle, only finish and glow change, animatable glint).

## Forge rooms, gems, sockets, hero level 30 gate
See [FORGE_GEMS.md](FORGE_GEMS.md). The Forge now has six rooms; gems follow the same six tiers, 4-to-1 and casino rules; set gear is crafted at any level but worn from hero level 30; every piece has four sockets; unwanted gear melts in the Smelter.

## Confirmed by Michelle (2026-10-02)
- **Every material has six levels, holiday materials included.** Four of one level combine into one of the next, same 4-to-1 rule and the same 75 / 20 / 4.9 / 0.1 mixed odds. Basic and set materials share the six tier names.
- **Chest percentages are independent per-item chances**, not a fixed number of items per 100 chests. Each listed item is rolled on its own at its own percent (`docs/ITEMS_REFERENCE.md` section 5).
- **Boosts start very small**, most of all on low quality and low hero unlock level gear. Set gear now scales with both (`SET_TOP`, `SET_Q` in data.js, see `docs/FORGE_GEMS.md`). Basic gear keeps the percentage ranges from her spec table.
