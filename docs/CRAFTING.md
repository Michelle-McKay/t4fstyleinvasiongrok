# Gear crafting and material system

Spec: Michelle's "Hero Gear Crafting & Material System" brief. Built on the existing Forge, the "bars" stockpile and the seven hero gear slots. No parallel system: the six named tiers are the existing grades 1 to 6.

## Tiers (`QUALITY` in js/data.js)
1 Basic (grey), 2 Common (white), 3 Uncommon (green), 4 Rare (blue), 5 Epic (purple), 6 Legendary (gold). Used for materials and gear alike; the UI shows names, not "grade N".

## Rules (`craft`, `refine` in js/engine.js)
- **4-to-1:** four materials of one tier refine into one of the next (Forge 3 x tier gates it). 1,024 Basic = 1 Legendary.
- **Guaranteed:** four materials of one tier craft a gear piece of exactly that tier, no RNG. The old Forge "grade-up chance" was removed because it contradicted this.
- **Mixed craft (the casino):** sort the four inputs lowest to highest. Output is the input in position 1/2/3/4 with chance **75% / 20% / 4.9% / 0.1%** (`MIX_ODDS`). The brief gave ranges (70-75, 20-24, ~4.9, ~0.1); these defaults sum to 100%. Repeated tiers collapse, so Basic, Basic, Uncommon, Legendary gives Basic 95%, Uncommon 4.9%, Legendary 0.1%. The UI shows the exact odds before you commit.
- **Sources:** monsters drop 1 + grade/2 materials (tier skewed low) and fixed-set shards: each monster tile guards one gear set (`monsterSet`), so one monster per set. Packs and chests also grant materials. Real-money packs stay sandbox only.

## Art
Material icons `mat_1`..`mat_6` have prompts in the art checklist (same ingot, same angle, only finish and glow change, animatable glint).
