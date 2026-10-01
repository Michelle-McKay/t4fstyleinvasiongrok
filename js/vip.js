'use strict';
/* IRON MARCH — VIP: 15 permanent levels. Spec: docs/VIP.md.
   Points come ONLY from real-money packs (100 points per $1.00, see iap.js) and Alliance Store purchases. No daily login points, no timers, no decay.
   Each stat below is the TOTAL at that level; a stat a level does not list carries over from the highest earlier level that does. */
const VIP_PER_USD = 100;
const VIP_AP_RATE = 1;            // OPEN ITEM: VIP points per alliance point spent in the Alliance Store (a 50-point chest gives 50)
const VIP_COUNT_DIAMONDS = true;  // set false to count only themed packs, not plain diamond packs
const VIP_STATS = [['build', 'Build Speed'], ['research', 'Research Speed'], ['gather', 'Gathering Speed'], ['train', 'Troop Training Speed'], ['atk', 'Troop Attack'], ['def', 'Troop Defense'], ['hp', 'Troop HP'], ['rallyAtk', 'Rally Attack'], ['rallyHp', 'Rally HP']];
const VIP_LEVELS = [   // [points, usd, {stat: percent}, free build queue 2]
  [100, 1, { build: 5, gather: 5 }],
  [500, 5, { build: 8, research: 5 }],
  [1500, 15, { build: 10, research: 8, train: 5 }],
  [4000, 40, { build: 12, research: 10, gather: 10 }],
  [10000, 100, { build: 15 }, 1],
  [25000, 250, { research: 15, train: 10, atk: 5 }],
  [50000, 500, { build: 20, research: 18, def: 8 }],
  [100000, 1000, { build: 25, research: 20, atk: 10 }],
  [200000, 2000, { build: 30, research: 25, hp: 12 }],
  [350000, 3500, { build: 33, research: 28, atk: 15, def: 15 }],
  [550000, 5500, { build: 35, research: 30, atk: 18 }],
  [800000, 8000, { build: 40, research: 35, hp: 20, rallyAtk: 10 }],
  [1100000, 11000, { build: 45, research: 40, atk: 25 }],
  [1300000, 13000, { build: 50, research: 45, atk: 30, rallyHp: 20 }],
  [1500000, 15000, { build: 60, research: 50, atk: 35, def: 35, hp: 35 }]
];
const VIP_MAX = VIP_LEVELS.length;
function vipEnsure() { S.vip = S.vip || { pts: 0, log: [] }; return S.vip; }
const vipPts = () => vipEnsure().pts;
function vipLevel(pts) { pts = pts == null ? vipPts() : pts; let l = 0; while (l < VIP_MAX && pts >= VIP_LEVELS[l][0]) l++; return l; }
/* totals at a level, with carry-over: { build: 0.05, ... } as fractions */
function vipTotals(level) {
  const t = {}; for (const [k] of VIP_STATS) t[k] = 0;
  for (let i = 0; i < level; i++) for (const k in VIP_LEVELS[i][2]) t[k] = VIP_LEVELS[i][2][k] / 100;
  return t;
}
const vipBonus = () => vipTotals(vipLevel());
const vipQueue2 = () => vipLevel() >= 5;
const buildSlots = () => Math.max(S.builders, vipQueue2() ? 2 : 1);
/* perks gained AT a level (what is new), as text rows */
function vipPerkRows(level) {
  const rows = [], t = vipTotals(level);
  for (const [k, n] of VIP_STATS) if (t[k]) rows.push(`${n}: +${Math.round(t[k] * 100)}%`);
  if (level >= 5) rows.push('Free Build Queue 2 (permanent)');
  return rows;
}
function vipAdd(n, src) {
  n = Math.floor(n); if (!(n > 0)) return; const v = vipEnsure(), before = vipLevel();
  v.pts += n; v.log.unshift({ t: Date.now(), n, src }); if (v.log.length > 20) v.log.length = 20;
  const after = vipLevel();
  if (after > before) { note(`VIP ${after} reached. It stays for good.`, 'good'); if (typeof UI !== 'undefined') UI.vipSel = after; }
}
