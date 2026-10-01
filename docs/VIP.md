# VIP

15 permanent levels. Rules and numbers: `js/vip.js`. Screen and badge art: `js/vipui.js`. Opened from the profile sheet or More > VIP.

- **Permanent.** A level never drops. No timers, no daily login chest, no login streak points.
- **Points.** Only real-money packs (100 VIP points per $1.00, from the pack's USD price in `js/iap.js`) and Alliance Store purchases (1 VIP point per alliance point spent; open item, `VIP_AP_RATE`). Plain diamond packs count too (`VIP_COUNT_DIAMONDS`, set false to count themed packs only). Sandbox purchases add points so the flow can be tested. Payments stay sandbox until server validation exists (`docs/IAP.md`); VIP points are in the local save like diamonds, so move them server side with the balance.
- **Thresholds** (points / USD): 100/$1, 500/$5, 1.5k/$15, 4k/$40, 10k/$100, 25k/$250, 50k/$500, 100k/$1k, 200k/$2k, 350k/$3.5k, 550k/$5.5k, 800k/$8k, 1.1M/$11k, 1.3M/$13k, 1.5M/$15k.
- **Perks.** Each stat in the table is the total at that level; an unlisted stat carries over from the highest earlier level that lists it. VIP 5 gives a permanent free second builder (`buildSlots()`).
- **Where each stat lands.** Construction, Research, Gathering and Training speed and Troop Attack and Troop Health feed `mods()`. Troop Defense is Wall HP, as in the hero skill tree (`G.wallHp`). Rally Attack and Rally Health apply to rally columns only (`fightMarch`). Research is still capped at 60% in total.

## Badge art
10 images for 15 levels (`tools/artcatalog.js`, group `vip`): `vip_1` to `vip_5` cover two levels each (1-10), `vip_11` to `vip_15` one each. Same shield for all; 11 to 15 differ by one tiny detail each. The level number is drawn in code. Until painted files exist the game draws a vector shield.
