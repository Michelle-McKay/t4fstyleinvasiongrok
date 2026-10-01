'use strict';
/* IRON MARCH — rules and constants. Pure data and pure functions. */
const DRILL = 15;            // sheet seconds per drill second (train, build, research, heal, walls)
const OCC = 300;             // occupation clock: 4h sheet -> 48s drill
const W = 512, H = 1024, TX = 256, TY = 512;
const FOREST_R = 56, PLAZA_R = 5;
const RES = ['rations', 'fuel', 'power', 'alloy', 'cash'];
const RESN = { rations: 'Rations', fuel: 'Fuel', power: 'Power', alloy: 'Alloy', cash: 'Cash' };
const DIA_RATE = { rations: 500, fuel: 400, power: 400, alloy: 250, cash: 300 };
const NODE_RES = { food: 'rations', oil: 'fuel', energy: 'power', steel: 'alloy' };
const NODE_KEYS = ['food', 'oil', 'energy', 'steel'];
const STD = {
  brass: '#e0a44a', signal: '#d4654a', oxide: '#8ea36a', glacier: '#5ec4d4', ember: '#e07a2f', wine: '#c45b78',
  sand: '#d9c48a', pine: '#2f8f6a', frost: '#8eb7e0', rust: '#b85a3c', iris: '#8d78c9', lime: '#c5d15a'
};
const STD_KEYS = Object.keys(STD);
const RES_TINT = { rations: '#8ea36a', fuel: '#e07a2f', power: '#5ec4d4', alloy: '#9aa4a8', cash: '#e0a44a' };

const CLS = ['inf', 'arm', 'air', 'siege'];
const CLSD = {
  inf: { n: 'Infantry', names: ['Riot Troopers', 'Combat Infantry', 'Exo-Soldiers', 'Elite Vanguard'], atk: 10, hp: 80, pow: 8, load: 40, pace: 1, train: [15, 45, 120, 300], cost: { rations: 30, alloy: 10 }, beats: 'air', loses: 'arm' },
  arm: { n: 'Armor', names: ['Scout Cars', 'Battle Tanks', 'Heavy Assault Mechs', 'Juggernaut Armor'], atk: 14, hp: 150, pow: 14, load: 55, pace: 0.9, train: [15, 45, 120, 300], cost: { fuel: 30, alloy: 20 }, beats: 'inf', loses: 'air' },
  air: { n: 'Aircraft', names: ['Recon Drones', 'Attack Helicopters', 'Heavy Gunships', 'Stealth Bombers'], atk: 12, hp: 110, pow: 12, load: 30, pace: 1.15, train: [15, 45, 120, 300], cost: { fuel: 25, power: 25 }, beats: 'arm', loses: 'inf' },
  siege: { n: 'Siege', names: ['Siege Engines', 'Plasma Mortars', 'Breach Artillery', 'Demolition Walkers'], atk: 18, hp: 60, pow: 22, load: 160, pace: 0.75, train: [35, 105, 270, 720], cost: { power: 30, alloy: 30, cash: 5 } }
};
const TSTAT = [1, 1.8, 3.2, 5.4], TCOST = [1, 3, 8, 18], TSPEED = [180, 157, 133, 110], TLOAD = [1, 1.5, 2.2, 3.2];
const WCLS = ['sent', 'bast', 'sky'];
const WCLSD = {
  sent: { n: 'Perimeter Sentinels', counter: 'inf', names: ['Automated Point-Guns', 'Hardened Bunker Guards', 'Laser-Grid Interceptors', 'Perimeter Plasma Emplacements'] },
  bast: { n: 'Fortress Bastions', counter: 'arm', names: ['Anti-Tank Spike Traps', 'Railgun Turrets', 'Heavy Siege-Breaker Batteries', 'Quantum Shield Emplacements'] },
  sky: { n: 'Sky-Watch Interceptors', counter: 'air', names: ['Flak Cannons', 'SAM Nests', 'EMP Defense Grids', 'Orbital Laser Nodes'] },
};
const WT = [{ pow: 15, hp: 50, sec: 20 }, { pow: 35, hp: 120, sec: 60 }, { pow: 85, hp: 280, sec: 180 }, { pow: 200, hp: 650, sec: 420 }];
const WALL_GATE = [1, 6, 12, 18];              // Defense Center level per wall tier
const WALL_COST = { rations: 12, alloy: 14, power: 10 };
const TIER_GATE = [
  { mil: 0, tech: 0, doc: null },
  { mil: 6, tech: 0, doc: 'doc2' },
  { mil: 12, tech: 8, doc: 'doc3' },
  { mil: 18, tech: 12, doc: 'doc4' }
];

const BLD = {
  cc: { n: 'Command Center', s: 'CC', inner: 1, unique: 1, w: 2.0 },
  mil: { n: 'Military Complex', s: 'MC', inner: 1, w: 1.2, wing: 'train' },
  depot: { n: 'Depot', s: 'DP', inner: 1, w: 1, wing: 'med' },
  treasury: { n: 'Treasury', s: 'TR', inner: 1, w: 1 },
  tech: { n: 'Tech Institute', s: 'TI', inner: 1, w: 1.2, wing: 'lab' },
  hall: { n: 'Hall of War', s: 'HW', inner: 1, w: 1, wing: 'rally' },
  prison: { n: 'Prison', s: 'PR', inner: 1, w: 0.8 },
  radar: { n: 'Radar Station', s: 'RS', inner: 1, w: 1 },
  store: { n: 'StoreHouse', s: 'SH', inner: 1, w: 0.9 },
  defense: { n: 'Defense Center', s: 'DC', inner: 1, w: 1.1, wing: 'wall' },
  market: { n: 'Black Market', s: 'BM', inner: 1, w: 0.8, wing: 'market' },
  embassy: { n: 'Embassy', s: 'EM', inner: 1, w: 1, wing: 'embassy' },
  forge: { n: 'Forge', s: 'FG', inner: 1, w: 1, wing: 'forge' },
  rations: { n: 'Rations', s: 'RA', res: 'rations', rate: 900, w: 0.8 },
  fuel: { n: 'Fuel', s: 'FU', res: 'fuel', rate: 720, w: 0.8 },
  power: { n: 'Power Cells', s: 'PC', res: 'power', rate: 720, w: 0.8 },
  alloy: { n: 'Alloy', s: 'AL', res: 'alloy', rate: 480, w: 0.8 }
};
const INNER_KEYS = Object.keys(BLD).filter(k => BLD[k].inner);
const OUTER_KEYS = Object.keys(BLD).filter(k => BLD[k].res);
const BASE_COST = { rations: 500, fuel: 380, power: 340, alloy: 260, cash: 120 };
const BUILD_GROWTH = 1.32;   // top-level costs must stay under the StoreHouse cap (see storeCapAt)
function buildCost(b, lv) { const c = {}; for (const r of RES) c[r] = Math.round(BASE_COST[r] * BLD[b].w * Math.pow(BUILD_GROWTH, lv - 1)); return c; }
function buildSheetSec(b, lv) { return Math.round(90 * Math.pow(1.42, lv - 1) * (b === 'cc' ? 1.6 : 1)); }

function lin(l, a, b, n) { n = n || 10; if (l <= 0) return 0; return (a + (b - a) * (l - 1) / (n - 1)) / 100; }
/* research: id -> {n, tree, max, a, b (percent curve), req, what, cost, sec} */
const RS = {
  atk_inf: { n: 'Infantry attack', tree: 'combat', max: 10, a: 2, b: 30, req: [], what: 'infantry attack', c: 'rations' },
  atk_arm: { n: 'Armor attack', tree: 'combat', max: 10, a: 2, b: 30, req: [], what: 'armor attack', c: 'fuel' },
  atk_air: { n: 'Air attack', tree: 'combat', max: 10, a: 2, b: 30, req: [], what: 'aircraft attack', c: 'power' },
  atk_siege: { n: 'Siege attack', tree: 'combat', max: 10, a: 2, b: 30, req: [], what: 'siege attack', c: 'alloy' },
  plating: { n: 'Troop plating', tree: 'field', max: 10, a: 2, b: 30, req: [], what: 'troop health', c: 'alloy' },
  logi: { n: 'Logistics', tree: 'field', max: 10, a: 1.5, b: 15, req: [], what: 'train time cut', c: 'fuel' },
  recon: { n: 'Recon', tree: 'field', max: 10, a: 0, b: 0, req: [], what: 'scan depth (max: Radar Station level)', c: 'power' },
  bulk: { n: 'Bulkheads', tree: 'defense', max: 10, a: 3, b: 50, req: [], what: 'wall HP', c: 'alloy' },
  perim: { n: 'Perimeter lethality', tree: 'defense', max: 10, a: 3, b: 40, req: [['bulk', 1]], what: 'wall attack', c: 'power' },
  repair: { n: 'Automated depot repair', tree: 'defense', max: 10, a: 2, b: 25, req: [['perim', 1]], what: 'repair speed and raid retention', c: 'cash' },
  doc2: { n: 'Tier 2 Doctrine', tree: 'troops', max: 1, req: [], what: 'unlocks tier 2 troops', c: 'rations', big: 4 },
  doc3: { n: 'Tier 3 Doctrine', tree: 'troops', max: 1, req: [['doc2', 1]], what: 'unlocks tier 3 troops', c: 'rations', big: 14 },
  doc4: { n: 'Tier 4 Doctrine', tree: 'troops', max: 1, req: [['doc3', 1]], what: 'unlocks tier 4 troops', c: 'rations', big: 40 },
  build: { n: 'Construction', tree: 'econ', max: 10, a: 1, b: 20, req: [], what: 'build speed', c: 'alloy' },
  y_rations: { n: 'Food extraction', tree: 'econ', max: 10, a: 2, b: 35, req: [['build', 1]], what: 'rations yield', c: 'rations' },
  y_power: { n: 'Power grid', tree: 'econ', max: 10, a: 2, b: 35, req: [['build', 1]], what: 'power yield', c: 'power' },
  y_alloy: { n: 'Alloy smelting', tree: 'econ', max: 10, a: 2, b: 35, req: [['build', 1]], what: 'alloy yield', c: 'alloy' },
  y_fuel: { n: 'Fuel refining', tree: 'econ', max: 10, a: 2, b: 35, req: [['build', 1]], what: 'fuel yield', c: 'fuel' },
  load: { n: 'Troop load', tree: 'econ', max: 10, a: 3, b: 40, req: [['y_rations', 1]], what: 'column load', c: 'rations' },
  gather: { n: 'Gathering speed', tree: 'econ', max: 10, a: 3, b: 35, req: [['load', 1]], what: 'gather speed', c: 'fuel' },
  march: { n: 'March speed', tree: 'econ', max: 10, a: 1.5, b: 15, req: [['gather', 1]], what: 'march speed', c: 'fuel' },
  trainspd: { n: 'Training speed', tree: 'ops', max: 10, a: 2, b: 30, req: [], what: 'training time cut', c: 'rations' },
  beds: { n: 'Depot beds', tree: 'ops', max: 10, a: 3, b: 40, req: [], what: 'hospital beds', c: 'alloy' },
  restore: { n: 'Restoration', tree: 'ops', max: 10, a: 2, b: 30, req: [['beds', 1]], what: 'tier 2+ heal speed', c: 'power' },
  wh: { n: 'Warehousing', tree: 'ops', max: 10, a: 3, b: 40, req: [], what: 'StoreHouse cap', c: 'alloy' }
};
const TREES = [['combat', 'Combat'], ['field', 'Field'], ['defense', 'Defense'], ['troops', 'Troops'], ['econ', 'Economy'], ['ops', 'Operations']];
function researchCost(id, lv) { const d = RS[id]; const base = 900 * (d.big || 1) * Math.pow(1.5, lv - 1); const c = {}; c[d.c] = Math.round(base); c.cash = Math.round(base * 0.25); if (d.c === 'cash') { delete c.rations; c.cash = Math.round(base * 0.7); } return c; }
function researchSheetSec(id, lv) { const d = RS[id]; return Math.round(240 * (d.big || 1) * Math.pow(1.55, lv - 1)); }

const TITLES = {
  blade: { n: 'Blade', good: 1, d: '+8% march attack' }, bulwark: { n: 'Bulwark', good: 1, d: '+8% staying power' },
  provisioner: { n: 'Provisioner', good: 1, d: '+10% yields and gathering' }, drillmaster: { n: 'Drillmaster', good: 1, d: '−8% training time' },
  coward: { n: 'Coward', good: 0, d: '−8% march attack' }, brittle: { n: 'Brittle', good: 0, d: '−8% staying power' },
  burden: { n: 'Burden', good: 0, d: '−10% yields and gathering' }, sluggard: { n: 'Sluggard', good: 0, d: '−8% march speed' }
};
/* One hero per player, levels 1 to 50. The three avatars are cosmetic only: identical stats (docs/HERO_SYSTEM.md). */
const HEROES = {
  ada: { n: 'Ada Voss', role: 'Avatar', d: 'Cosmetic avatar, same stats as every other' },
  ivo: { n: 'Ivo Hale', role: 'Avatar', d: 'Cosmetic avatar, same stats as every other' },
  ren: { n: 'Ren Kade', role: 'Avatar', d: 'Cosmetic avatar, same stats as every other' }
};
const AVATAR_SWITCH_COST = 0;                  // OPEN ITEM: switching avatars is free for now
const HERO_MAX = 50;                           // OPEN ITEM: cap is a flat 50, not tied to player or base level yet
/* XP needed to go from level N to N+1 (index N-1), blueprint: Game of War: Fire Age. Levels 7-42 are interpolated. */
const HERO_XP = [10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, 120000, 130000, 150000, 175000, 200000, 230000, 260000, 300000, 340000, 390000, 450000, 510000, 590000, 670000, 770000, 880000, 1000000, 1150000, 1310000, 1500000, 1720000, 1960000, 2240000, 2570000, 2930000, 3360000, 3840000, 4390000, 5020000, 5740000, 6560000, 7500000, 10000000, 15000000, 20000000, 50000000, 50000000, 100000000, 200000000];
function heroNeed(lv) { return lv >= HERO_MAX ? 0 : HERO_XP[lv - 1]; }
function heroTotal(lv) { let t = 0; for (let i = 1; i < lv; i++) t += HERO_XP[i - 1]; return t; }
/* XP items. Packs hold 5 each. Item prices never fall below $2.00 per 100k XP (see HERO_SYSTEM.md rules). */
const XPI = [
  { id: 'tiny', n: 'Tiny XP Item', xp: 10000, usd: 1.49 }, { id: 'small', n: 'Small XP Item', xp: 50000, usd: 6.99 },
  { id: 'medium', n: 'Medium XP Item', xp: 100000, usd: 12.99 }, { id: 'large', n: 'Large XP Item', xp: 250000, usd: 29.99 },
  { id: 'huge', n: 'Huge XP Item', xp: 500000, usd: 54.99 }, { id: 'grand', n: 'Grand XP Item', xp: 1000000, usd: 99.99 }
];
const XPI_PACK = 5, XP_MIN_RATE = 2.0;         // items per pack, minimum dollars per 100k XP
/* Free XP, kept roughly flat (about 100k a day in the real game; the drill clock here is faster). No catch-up bonus at higher levels. */
const XP_FREE = { daily: [['tiny', 2], ['small', 1]], hunt: 3000, battle: 1500, buildPerLevel: 400 };
/* Per-level hero stats, identical for every avatar. Leadership raises column load. */
const HERO_STAT = { atk: 0.004, def: 0.004, hp: 0.004, lead: 0.004 };
const SLOTS = ['helmet', 'chest', 'gauntlets', 'greaves', 'weapon', 'boots', 'accessory'];
const SLOT_NAME = { helmet: 'Helm', chest: 'Chest Armor', gauntlets: 'Gauntlets', greaves: 'Greaves', weapon: 'Weapon', boots: 'Boots', accessory: 'Amulet' };
const SLOT_CURVE = { weapon: [1, 12], chest: [1, 12], helmet: [1.5, 15], gauntlets: [1, 10], greaves: [1, 10], boots: [1, 10], accessory: [1, 8] };
const SLOT_WHAT = { weapon: 'troop attack', chest: 'troop health', helmet: 'wall attack and wall HP', gauntlets: 'troop attack', greaves: 'troop health', boots: 'march speed and gathering speed', accessory: '' };
/* Set bonuses at 3, 5 and 7 worn pieces of one set. OPEN ITEM: values and rarity tiers are placeholders. */
const SETS = {
  vanguard: { n: 'Vanguard', d: '+5% / +10% / +15% troop attack', aura: '#e0a44a', b: { 3: { atk: 0.05 }, 5: { atk: 0.10 }, 7: { atk: 0.15 } } },
  outrider: { n: 'Outrider', d: '+5% march speed, +8% / +15% troop attack', aura: '#5ec4d4', b: { 3: { march: 0.05 }, 5: { atk: 0.08 }, 7: { atk: 0.15 } } },
  battery: { n: 'Battery', d: '+5% / +10% / +15% yield', aura: '#8ea36a', b: { 3: { yld: 0.05 }, 5: { yld: 0.10 }, 7: { yld: 0.15 } } }
};
function piecePct(slot, grade) { const [a, b] = SLOT_CURVE[slot]; return (a + (b - a) * (grade - 1) / 5) / 100; }

const RALLY_WAITS = [['5 minutes', 300], ['15 minutes', 900], ['30 minutes', 1800], ['1 hour', 3600], ['8 hours', 28800]];
const DIA_PACKS = [
  { id: 'drop', n: 'Recon Drop', cost: 120, d: 'Rations, fuel and power lot' },
  { id: 'field', n: 'Field Crate', cost: 650, d: 'Full resource lot and two 1-hour slips' },
  { id: 'chest', n: 'War Chest', cost: 1600, d: 'Large lot, slips, tokens and bars' },
  { id: 'reserve', n: 'Sovereign Reserve', cost: 4200, d: 'Depot-filling lot, slips, tokens and a set shard' }
];
const SLIPS = [{ id: 's5', n: 'Five 5-minute slips', cost: 35, sec: 300, q: 5 }, { id: 's60', n: 'Two 1-hour slips', cost: 80, sec: 3600, q: 2 }, { id: 's480', n: 'One 8-hour slip', cost: 220, sec: 28800, q: 1 }];
const MARKET_CAT = [
  { id: 'm_s5', n: 'Five 5-minute slips', cost: 30, give: { s5: 5 } }, { id: 'm_s60', n: 'Two 1-hour slips', cost: 70, give: { s60: 2 } },
  { id: 'm_s480', n: 'One 8-hour slip', cost: 190, give: { s480: 1 } }, { id: 'm_rat', n: 'Rations lot 24k', cost: 40, give: { rations: 24000 } },
  { id: 'm_fuel', n: 'Fuel lot 20k', cost: 40, give: { fuel: 20000 } }, { id: 'm_pow', n: 'Power lot 20k', cost: 40, give: { power: 20000 } },
  { id: 'm_alloy', n: 'Alloy lot 12k', cost: 40, give: { alloy: 12000 } }, { id: 'm_cash', n: 'Cash lot 12k', cost: 40, give: { cash: 12000 } },
  { id: 'm_tok', n: 'Coordination pass', cost: 90, give: { tokens: 1 } }
];

/* ---------- math helpers ---------- */
function hx(x, y, s) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 2246822519)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; h = Math.imul(h, 2246822519); h ^= h >>> 13; return (h >>> 0) / 4294967296; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function fmtN(n) { n = Math.floor(n); if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B'; if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M'; if (n >= 1e4) return Math.floor(n / 1e3) + 'k'; if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'k'; return String(n); }
function fmtT(sec) { sec = Math.max(0, Math.ceil(sec)); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`; }
function dual(sheetSec, scale) { scale = scale || DRILL; return `${fmtT(sheetSec)} sheet · ${fmtT(sheetSec / scale)}`; }
function tierName(cls, t) { return CLSD[cls].names[t - 1]; }
function matchup(a, d) { if (a === 'siege') return d === 'wall' ? 2.2 : 0.28; if (d === 'siege' || a === d) return 1; if (CLSD[a].beats === d) return 1.55; if (CLSD[a].loses === d) return 0.65; return 1; }
function unitStat(cls, t) { const c = CLSD[cls]; return { atk: c.atk * TSTAT[t - 1], hp: c.hp * TSTAT[t - 1], pow: c.pow * TSTAT[t - 1], load: c.load * TLOAD[t - 1], speed: TSPEED[t - 1] * c.pace }; }
function trainCost(cls, t) { const c = {}; for (const r in CLSD[cls].cost) c[r] = CLSD[cls].cost[r] * TCOST[t - 1]; return c; }
function ck(cls, t) { return cls + t; }
function ckSplit(k) { return [k.slice(0, -1), +k.slice(-1)]; }
function ckName(k) { const [c, t] = ckSplit(k); if (WCLSD[c]) return WCLSD[c].names[t - 1]; return tierName(c, t); }

/* ---------------- Command Center upgrade path ---------------- */
const CC_LEVELS = [
  ['Field Tent', 'A tent, a radio and a flag.'], ['Command Post', 'Second tent and a supply stack.'], ['Prefab Hut', 'A proper roof and a door.'], ['Barricaded Hut', 'Sandbags and a diesel generator.'],
  ['Concrete Bunker', 'Poured concrete. A second march queue opens.'], ['Two-Storey Ops', 'Second floor and a briefing room.'], ['Radio Mast', 'Long-range mast with a beacon.'], ['Walled Compound', 'Perimeter wall and a gate.'],
  ['Helipad Deck', 'Roof helipad for fast couriers.'], ['Operations Tower', 'Third floor. A third march queue opens.'], ['Solar Array', 'Panel field beside the block.'], ['East Wing', 'Side wing for staff.'],
  ['Guard Towers', 'Corner towers with floodlights.'], ['Radar Crown', 'Rotating dish on the roof.'], ['War Room', 'Fourth floor. A fourth march queue opens.'], ['Turret Ring', 'Gun turrets on the wall.'],
  ['Hangar Annex', 'Vehicle hangar beside the HQ.'], ['Shield Emitters', 'Emitter posts wrap the compound.'], ['Comms Dome', 'Hardened comms dome.'], ['Fortress Plate', 'Armor plating. A fifth march queue opens.'],
  ['Satellite Uplink', 'Orbital uplink dish.'], ['Reactor Core', 'Glowing reactor in the courtyard.'], ['Command Spire', 'Central spire with a beacon.'], ['Brass Standard', 'Brass banners on every face.'],
  ['Iron Citadel HQ', 'The full fortress. A sixth march queue opens.']
];
const CC_REQ_POOL = ['hall', 'depot', 'tech', 'mil', 'defense', 'radar', 'store', 'treasury', 'prison', 'market'];
const RURAL = ['rations', 'fuel', 'power', 'alloy'];
/* every urban building is fed by one rural root: raise the root to raise the building */
const BLD_ROOT = { store: 'rations', depot: 'rations', treasury: 'power', tech: 'power', radar: 'power', mil: 'alloy', prison: 'alloy', defense: 'alloy', hall: 'fuel', market: 'fuel', embassy: 'fuel', forge: 'alloy' };
function bldReqs(b, to) {
  if (b === 'cc') return ccReqs(to);
  const r = BLD_ROOT[b]; if (!r || to < 3) return []; return [[r, to - 1]];
}
function ccReqs(to) {
  if (to <= 1) return [];
  const rural = RURAL[to % 4], rl = Math.max(1, to - 2);
  const fixed = { 2: [['store', 1]], 3: [['store', 2], ['depot', 1]], 4: [['depot', 2], ['mil', 3]], 5: [['tech', 3], ['hall', 2]], 6: [['defense', 4], ['radar', 4]] };
  if (fixed[to]) return [[rural, rl]].concat(fixed[to]);
  const n = CC_REQ_POOL.length, need = Math.max(1, to - 2), a = (to * 3) % n, b = (to * 5 + 2) % n, c = (to * 7 + 4) % n, out = [[rural, rl], [CC_REQ_POOL[a], need]];
  if (b !== a) out.push([CC_REQ_POOL[b], Math.max(1, need - 1)]);
  if (to >= 15 && c !== a && c !== b) out.push([CC_REQ_POOL[c], Math.max(1, need - 2)]);
  return out;
}
/* actions unlocked by Command Center level */
const CC_ACTIONS = [
  { id: 'req', n: 'Requisition', lv: 1, d: 'Collect supplies. Scales with level.' },
  { id: 'muster', n: 'Muster', lv: 2, d: 'Ask alliance help on every open job.' },
  { id: 'recall', n: 'Recall all', lv: 4, d: 'Pull every column home.' },
  { id: 'shield', n: 'Shield', lv: 5, d: 'Raise or drop the peace shield.' },
  { id: 'tp', n: 'Relocate', lv: 8, d: 'Random teleport to a legal tile.' }
];
/* Embassy: allied members of your kingdom send troops to garrison your base. Forge: gates and improves gear crafting. */
const EMB_PER_LEVEL = 1500;                    // allied troops hosted per Embassy level
const EMB_CALL_MS = 45000;                     // cooldown between reinforcement calls (drill time)
const embTier = L => clamp(1 + Math.floor(L / 8), 1, 3);   // best tier the allies send
const forgeGate = g => 3 * g;                  // Forge level needed to refine grade g bars into g+1
const forgeUp = L => Math.min(0.5, 0.02 * L);  // chance a crafted piece comes out one grade higher
const REQ_COOLDOWN_SHEET = 1800;   // 30 sheet minutes between requisitions
function reqAmounts(L) { return { rations: L * 500, fuel: L * 500, power: L * 400, alloy: L * 300, cash: L * 150 }; }
