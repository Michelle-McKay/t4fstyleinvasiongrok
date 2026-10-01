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
  hunt: { n: 'Hunter\'s instinct', tree: 'field', max: 10, a: 0, b: 0, req: [], what: 'better monster drops (max research moves a level 6 spread to 50 / 35 / 14.3 / 0.7)', c: 'power' },
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
  wh: { n: 'Warehousing', tree: 'ops', max: 10, a: 3, b: 40, req: [], what: 'StoreHouse cap', c: 'alloy' },
  gemology: { n: 'Gemology', tree: 'craft', max: 1, a: 0, b: 0, req: [], what: 'opens socket 4 on every gear piece, needed to finish a Gem Set bonus', c: 'power', big: 8 },
  lapidary: { n: 'Lapidary', tree: 'craft', max: 5, a: 4, b: 20, req: [['gemology', 1]], what: 'gem power', c: 'alloy', big: 2 }
};
const TREES = [['combat', 'Combat'], ['field', 'Field'], ['defense', 'Defense'], ['troops', 'Troops'], ['econ', 'Economy'], ['ops', 'Operations'], ['craft', 'Crafting']];
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
/* Five gear slots (spec 2026-10-01): Helmet, Armor, Footwear, Weapon, Accessory. What a piece does comes from its category (Basic gear) or its set, not from its slot. */
const SLOTS = ['helmet', 'chest', 'weapon', 'boots', 'accessory'];
const SLOT_NAME = { helmet: 'Helmet', chest: 'Armor', boots: 'Footwear', weapon: 'Weapon', accessory: 'Accessory' };
/* Stat vocabulary. Values are fractions (0.05 = +5%). */
const STAT_LAB = { atk: 'troop attack', hp: 'troop health', atk_inf: 'Rock (infantry) attack', atk_arm: 'Paper (armor) attack', atk_air: 'Scissors (aircraft) attack', atk_siege: 'siege attack', hp_inf: 'Rock (infantry) health', hp_arm: 'Paper (armor) health', hp_air: 'Scissors (aircraft) health', hp_siege: 'siege health',
  wallHp: 'wall HP', wallAtk: 'wall trap attack', march: 'march speed', yld: 'yield', heal: 'heal speed', gather: 'gathering speed', load: 'troop load', build: 'construction speed', research: 'research speed', train: 'troop training speed', trap: 'trap training speed',
  prod_rations: 'food production', prod_fuel: 'oil production', prod_power: 'energy production', prod_alloy: 'steel production', prod_cash: 'cash production', huntCost: 'monster energy cost cut', heroAtk: 'hero attack', refund: 'hunt stamina refund' };
const STAT_KEYS = Object.keys(STAT_LAB);
const zeroStats = () => { const r = {}; for (const k of STAT_KEYS) r[k] = 0; return r; };
/* Basic Gear: 13 categories x 5 slots = 65 items, no set. Quality scales linearly Grey (lo) to Gold (hi), in percent, PER PIECE (OPEN ITEM: per piece or per full set). `lv` = hero level to wear. */
const BASIC = {
  defense: { n: 'General Defense / Traps', lv: 1, st: ['wallHp', 'wallAtk'], lo: 1, hi: 13, mats: 'Scrap Metal, Rivets and Fasteners' },
  attack: { n: 'General Attack', lv: 3, st: ['atk'], lo: 1, hi: 13, mats: 'Reinforced Polymer, Industrial Lubricant' },
  food: { n: 'Food Production', lv: 4, st: ['prod_rations'], lo: 2, hi: 26, mats: 'Hardened Carbon Rods, Electrical Wiring Spools' },
  oil: { n: 'Oil Production', lv: 5, st: ['prod_fuel'], lo: 2, hi: 26, mats: 'Compressed Rubber Gaskets, Tempered Alloy Ingots' },
  energy: { n: 'Energy Production', lv: 6, st: ['prod_power'], lo: 2, hi: 26, mats: 'Electrical Wiring Spools, Precision Springs' },
  steel: { n: 'Steel Production', lv: 7, st: ['prod_alloy'], lo: 2, hi: 26, mats: 'Tempered Alloy Ingots, High-Tension Webbing' },
  cash: { n: 'Cash Production', lv: 9, st: ['prod_cash'], lo: 2, hi: 26, mats: 'Composite Ceramic Plates, Precision Springs' },
  build: { n: 'Construction', lv: 10, st: ['build'], lo: 1.5, hi: 18, mats: 'Rivets and Fasteners, Hardened Carbon Rods' },
  gather: { n: 'Gathering', lv: 12, st: ['gather', 'load'], lo: 2, hi: 24, mats: 'High-Tension Webbing, Compressed Rubber Gaskets' },
  research: { n: 'Research', lv: 15, st: ['research'], lo: 1.5, hi: 18, mats: 'Composite Ceramic Plates, Electrical Wiring Spools' },
  train: { n: 'Troop Training', lv: 21, st: ['train'], lo: 1.5, hi: 18, mats: 'Reinforced Polymer, Industrial Lubricant' },
  trap: { n: 'Wall Trap Training', lv: 23, st: ['trap'], lo: 1.5, hi: 18, mats: 'Scrap Metal, Precision Springs' },
  hunt: { n: 'Monster Hunting', lv: 25, st: ['huntCost', 'heroAtk', 'march'], lo: 2, hi: 26, mats: 'Master-Grade Core Alloy, Tempered Alloy Ingots' }
};
const BASIC_ORDER = Object.keys(BASIC);
/* Set gear: per-piece stat value scale (percent, Grey to Gold) and bonuses at 2, 3 and 5 worn pieces (five slots). OPEN ITEM: all placeholders. */
const SET_RANGE = [1, 8], SET_PCS = [2, 3, 5], SET_BONUS = [0.03, 0.06, 0.10];
/* Regular sets: 12, one monster each (monster id = set id). `st` = the stats every piece of the set gives, `mats` = its core themed monster drops (flavour and codex for now). */
const SETS = {
  rock: { n: '"Rock" Troop Set', cat: 'Troops', lv: 35, st: ['atk_inf', 'hp_inf'], mats: 'Apex Beast Hide, Chitin Scales', mon: 'Armored Juggernaut', aura: '#e0a44a' },
  paper: { n: '"Paper" Troop Set', cat: 'Troops', lv: 36, st: ['atk_arm', 'hp_arm'], mats: 'Gale-Wing Feathers, Hollow Quill', mon: 'Cyber-Raptor', aura: '#5ec4d4' },
  scissors: { n: '"Scissors" Troop Set', cat: 'Troops', lv: 37, st: ['atk_air', 'hp_air'], mats: 'Venom-Sac Residue, Mandible Shards', mon: 'Venom Spitter', aura: '#d4654a' },
  training: { n: 'Higher Quality Training Set', cat: 'Economy', lv: 32, st: ['train'], mats: 'Alpha-Predator Bone, Iron-Sinew', mon: 'Rogue Supply Drone', aura: '#8ea36a' },
  construction: { n: 'Higher Quality Construction Set', cat: 'Economy', lv: 34, st: ['build'], mats: 'Mason-Beast Granite Shards, Adamantite Rivets', mon: 'Data-Golems', aura: '#e07a3a' },
  research: { n: 'Higher Quality Research Set', cat: 'Economy', lv: 40, st: ['research'], mats: 'Sage-Beast Brain-Matter, Luminous Crystal', mon: 'Crystal-Eater Worm', aura: '#a07ad6' },
  siege: { n: 'Siege (Trap-Killer) Set', cat: 'Siege', lv: 39, st: ['atk_siege', 'hp_siege'], mats: 'Behemoth Iron-Plate, Pyre-Core Shard', mon: 'Scrap-Scraper Mech', aura: '#c84a4a' },
  tilehit: { n: 'Tile Hit Attack Set', cat: 'Siege', lv: 47, st: ['atk', 'hp', 'march'], mats: 'Nomad Hide, Quick-Stride Tendon', mon: 'Pack-Hunter Drone', aura: '#b98a52' },
  rally: { n: 'General Rallying Set', cat: 'Siege', lv: 49, st: ['atk', 'hp'], mats: 'War-Chief Sinew, Banner-Cloth', mon: 'War-Boss Behemoth', aura: '#7ab0e0' },
  wrally: { n: 'Wonder Rally Set', cat: 'Wonder', lv: 50, st: ['atk', 'hp'], mats: 'Sovereign Crown Shard, Dragon-Blood Ember', mon: 'Dreadnought Overlord', aura: '#e0c84a' },
  wsolo: { n: 'Wonder Solo Set', cat: 'Wonder', lv: 50, st: ['atk', 'hp', 'march'], mats: 'Phantom-Stalker Pelt, Void-Core Shard', mon: 'Bio-Hazard Pest', aura: '#6fd0a0' },
  wdef: { n: 'Wonder Defense Set', cat: 'Wonder', lv: 50, st: ['wallHp', 'hp', 'march'], mats: 'Bastion-Behemoth Shell, Basalt Core', mon: 'Fortress Automaton', aura: '#8a98a8' }
};
/* Holiday gear sets: 6 sets (defense and attack pairs of Rock / Paper / Scissors) shared by the 15 holiday monsters, three or so monsters per set. */
const HSETS = {
  hs_rpd: { n: 'Rock + Paper Defense Set', lv: 46, st: ['wallHp', 'hp', 'hp_inf', 'hp_arm'], mats: 'Frost-Giant Shards, Winter-Festival Ribbons, Holiday Tinsel Wire' },
  hs_rsd: { n: 'Rock + Scissors Defense Set', lv: 46, st: ['wallHp', 'hp', 'hp_inf', 'hp_air'], mats: 'Solstice Stone, Festival Bell Metal, Holiday Pine Resin' },
  hs_psd: { n: 'Paper + Scissors Defense Set', lv: 46, st: ['wallHp', 'hp', 'hp_arm', 'hp_air'], mats: 'Autumn-Harvest Gold, Harvest-Festival Silk, Holiday Leaf Veins' },
  hs_rpa: { n: 'Rock + Paper Attack Set', lv: 47, st: ['atk', 'hp', 'atk_inf', 'atk_arm'], mats: 'Spring-Blossom Amber, Festival Firecracker Ash, Holiday Silk Threads' },
  hs_rsa: { n: 'Rock + Scissors Attack Set', lv: 47, st: ['atk', 'hp', 'atk_inf', 'atk_air'], mats: 'Summer-Solstice Flare, Festival Spark Core, Holiday Ember Glass' },
  hs_psa: { n: 'Paper + Scissors Attack Set', lv: 47, st: ['atk', 'hp', 'atk_arm', 'atk_air'], mats: 'Equinox Shadow-Weave, Festival Lantern Paper, Holiday Wax Seal' }
};
const HSET_ORDER = Object.keys(HSETS);
for (const k of HSET_ORDER) { HSETS[k].cat = 'Holiday'; HSETS[k].aura = '#e0a44a'; HSETS[k].hgear = true; SETS[k] = HSETS[k]; }
const gearSetIds = () => SET_ORDER.concat(HSET_ORDER);
const gearOf = id => (SETS[id] && SETS[id].gear) || id;           // the gear set a monster's shards belong to
const setLv = id => SETS[id].lv;
const setDesc = id => { const st = SETS[id].st.map(k => STAT_LAB[k]).join(', '); return st + '. Bonus at ' + SET_PCS.map((n, i) => n + ' pieces +' + SET_BONUS[i] * 100 + '%').join(', ') + ' (placeholder)'; };
/* Weekly rotation: 12 regular monsters in four cycles of three. Each week exactly one cycle is on the map, every week, all week. */
const SET_ORDER = ['rock', 'paper', 'scissors', 'training', 'construction', 'research', 'siege', 'tilehit', 'rally', 'wrally', 'wsolo', 'wdef'];
const CYCLE_NAMES = ['Troop week', 'Economy week', 'Siege week', 'Wonder week'];
const WEEK_MS = 7 * 86400000, CYCLE_EPOCH = Date.UTC(2026, 0, 5);   // a Monday, UTC
function huntCycle(now) { return ((Math.floor(((now == null ? Date.now() : now) - CYCLE_EPOCH) / WEEK_MS) % 4) + 4) % 4; }
function activeSets(now) { const c = huntCycle(now); return SET_ORDER.slice(c * 3, c * 3 + 3); }
function weekEnds(now) { now = now == null ? Date.now() : now; return CYCLE_EPOCH + (Math.floor((now - CYCLE_EPOCH) / WEEK_MS) + 1) * WEEK_MS; }

/* Holiday monsters: one full week from the holiday date, every year. Each holiday has one monster and one limited gear set
   (id 'h_' + holiday id). Event shards persist, so an unfinished set can be finished when the event returns.
   Fixed and rule-based dates are computed; lunar and Hindu dates are tabled per year (HOL_TABLE, 2026-2035, from the standard
   lunar calendars; Eid dates can move a day with moon sighting). OPEN ITEM: extend the table each year after 2035. */
const HOL_TABLE = {
  cny: {2026: '02-17', 2027: '02-06', 2028: '01-26', 2029: '02-13', 2030: '02-03', 2031: '01-23', 2032: '02-11', 2033: '01-31', 2034: '02-19', 2035: '02-08'},
  mid: {2026: '09-25', 2027: '09-15', 2028: '10-03', 2029: '09-22', 2030: '09-12', 2031: '10-01', 2032: '09-19', 2033: '09-08', 2034: '09-27', 2035: '09-16'},
  eid: {2026: '03-20|05-27', 2027: '03-09|05-16', 2028: '02-26|05-05', 2029: '02-14|04-24', 2030: '02-04|04-13', 2031: '01-24|04-02', 2032: '01-14|03-22', 2033: '01-02|03-11|12-23', 2034: '03-01|12-12', 2035: '02-18|12-01'},
  holi: {2026: '03-04', 2027: '03-22', 2028: '03-11', 2029: '03-01', 2030: '03-20', 2031: '03-09', 2032: '03-27', 2033: '03-16', 2034: '03-05', 2035: '03-24'},
  diwali: {2026: '11-08', 2027: '10-29', 2028: '10-17', 2029: '11-05', 2030: '10-26', 2031: '11-14', 2032: '11-02', 2033: '10-22', 2034: '11-10', 2035: '10-30'}
};
const nthWd = (y, m, wd, n) => { const f = new Date(y, m, 1).getDay(); return new Date(y, m, 1 + ((wd - f + 7) % 7) + (n - 1) * 7); };
const lastWd = (y, m, wd) => { const l = new Date(y, m + 1, 0); return new Date(y, m, l.getDate() - ((l.getDay() - wd + 7) % 7)); };
const tabDates = (k, y) => { const v = HOL_TABLE[k][y]; return v ? v.split('|').map(md => new Date(y, +md.slice(0, 2) - 1, +md.slice(3))) : []; };
const HOLIDAYS = [
  { id: 'newyear', n: "New Year's Day", reg: 'North America', mon: 'Countdown Colossus', set: 'Countdown', aura: '#f0d878', d: y => [new Date(y, 0, 1)] },
  { id: 'valentine', n: "Valentine's Day", reg: 'North America', mon: 'Heartforge Hound', set: 'Heartstring', aura: '#e0607a', d: y => [new Date(y, 1, 14)] },
  { id: 'stpat', n: "St. Patrick's Day", reg: 'North America', mon: 'Clover Golem', set: 'Clover', aura: '#4fb868', d: y => [new Date(y, 2, 17)] },
  { id: 'memorial', n: 'Memorial / Victoria Day', reg: 'Canada, US', mon: 'Poppy Sentinel', set: 'Poppy', aura: '#d04040', d: y => [new Date(y, 4, 24 - ((new Date(y, 4, 24).getDay() + 6) % 7)), lastWd(y, 4, 1)] },
  { id: 'canada', n: 'Canada Day', reg: 'Canada', mon: 'Maple Moose', set: 'Maple', aura: '#e04a3a', d: y => [new Date(y, 6, 1)] },
  { id: 'july4', n: 'Independence Day', reg: 'US', mon: 'Sparkler Bison', set: 'Sparkler', aura: '#5a8ae0', d: y => [new Date(y, 6, 4)] },
  { id: 'thanks', n: 'Thanksgiving', reg: 'Canada (Oct), US (Nov)', mon: 'Harvest Gobbler', set: 'Harvest', aura: '#d49a3a', d: y => [nthWd(y, 9, 1, 2), nthWd(y, 10, 4, 4)] },
  { id: 'halloween', n: 'Halloween', reg: 'North America', mon: 'Lantern Wraith', set: 'Hollow', aura: '#e0802a', d: y => [new Date(y, 9, 31)] },
  { id: 'xmas', n: 'Christmas / Winter Holidays', reg: 'International', mon: 'Frostback Yeti', set: 'Evergreen', aura: '#6fb8d8', d: y => [new Date(y, 11, 25)] },
  { id: 'cny', n: 'Chinese New Year / Spring Festival', reg: 'East Asia', mon: 'Festival Lion', set: 'Festival', aura: '#e0382a', d: y => tabDates('cny', y) },
  { id: 'diwali', n: 'Diwali', reg: 'South Asia', mon: 'Lamp Phoenix', set: 'Diya', aura: '#f0a830', d: y => tabDates('diwali', y) },
  { id: 'eid', n: 'Eid al-Fitr / Eid al-Adha', reg: 'International', mon: 'Crescent Oryx', set: 'Crescent', aura: '#3ab8a0', d: y => tabDates('eid', y) },
  { id: 'holi', n: 'Holi', reg: 'South Asia', mon: 'Pigment Chameleon', set: 'Gulal', aura: '#d84aa8', d: y => tabDates('holi', y) },
  { id: 'muertos', n: 'Día de los Muertos', reg: 'Mexico, Latin America', mon: 'Marigold Spirit-Hound', set: 'Marigold', aura: '#f0a020', d: y => [new Date(y, 10, 1)] },
  { id: 'midautumn', n: 'Mid-Autumn / Moon Festival', reg: 'East Asia', mon: 'Moonlit Hare', set: 'Moonlight', aura: '#c8d8f0', d: y => tabDates('mid', y) }
];
/* Holiday monsters are monster-only entries in SETS ('h_' + holiday id): `gear` points at the holiday gear set their tile's shards belong to. */
HOLIDAYS.forEach((h, i) => { const g = HSET_ORDER[i % HSET_ORDER.length]; SETS['h_' + h.id] = { n: h.set, cat: 'Event · ' + h.n, mon: h.mon, hol: h.id, aura: h.aura, gear: g, monOnly: true }; });
const HOL_DAYS = 7;
function holidayStarts(h, y) { return h.d(y).map(d => d.getTime()); }
/* every window (start ms) of one holiday that could touch `now`: this year and last (a week can cross New Year) */
function holidayWindows(h, now) { const y = new Date(now).getFullYear(), r = []; for (const yy of [y - 1, y]) for (const t of holidayStarts(h, yy)) r.push(t); return r; }
const HUNT_PREVIEW = { holiday: (typeof location !== 'undefined' && (/[?&]holiday=(\w+)/.exec(location.search) || [])[1]) || null };   // demo only: forces one holiday monster on (URL ?holiday=halloween or the Hunt tab)
function activeHolidays(now) {
  now = now == null ? Date.now() : now; const out = [];
  for (const h of HOLIDAYS) if (holidayWindows(h, now).some(t => now >= t && now < t + HOL_DAYS * 86400000)) out.push(h.id);
  if (HUNT_PREVIEW.holiday && !out.includes(HUNT_PREVIEW.holiday)) out.push(HUNT_PREVIEW.holiday);
  return out;
}
function nextHolidayStart(h, now) { const y = new Date(now).getFullYear(); let best = null; for (const yy of [y, y + 1]) for (const t of holidayStarts(h, yy)) if (t > now && (best == null || t < best)) best = t; return best; }
/* Holiday monsters appear in place of this share of the map's monster packs during the event week. */
const HOL_SHARE = 0.3;
/* Monster id at a tile: a holiday monster ('h_..' set id) or one of this week's three regular monsters. */
function monsterIdAt(x, y, now) {
  const hol = activeHolidays(now);
  if (hol.length && hx(x, y, 11) < HOL_SHARE) return 'h_' + hol[Math.floor(hx(x, y, 12) * hol.length)];
  const act = activeSets(now); return act[Math.floor(hx(x, y, 13) * 3)];
}

/* Monster drop table. A monster of level L drops only materials of tier L or lower (strict ceiling).
   DROP_MAX is the Level 6 spread with the hunting research maxed: Basic/Common/Uncommon 50% together, Rare 35, Epic 14.3, Legendary 0.7.
   DROP_BASE is the same shape with no research. Lower-level monsters use the same weights cut off at their level and rescaled. */
const DROP_MAX = [25, 15, 10, 35, 14.3, 0.7], DROP_BASE = [32, 20, 13, 29, 5.5, 0.5];
function dropWeights(L, research) { const t = Math.max(0, Math.min(1, (research || 0) / 10)), w = []; for (let i = 0; i < L; i++) w.push(DROP_BASE[i] + (DROP_MAX[i] - DROP_BASE[i]) * t); return w; }
function dropOdds(L, research) { const w = dropWeights(L, research), s = w.reduce((a, b) => a + b, 0); return w.map(x => x / s); }
/* Hunt stamina: higher-level monsters cost more. Regenerates 1 per 20 drill seconds (5 sheet minutes). */
const STAM_MAX = 120, STAM_REGEN_MS = 20000;
const stamCost = L => 10 + 4 * (L - 1);
/* Hunt streak: a win within STREAK_MS of the last keeps the streak. Every 3 in a row adds one extra material roll (max +3). */
const STREAK_MS = 600000;
/* Alliance gift chests from monster kills: level 1-6, larger chests at higher levels. Shared with the whole alliance. */
const CHEST_LIFE_MS = 24 * 3600000, CHEST_MAX = 40;

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
/* Quality tiers: the six named tiers ARE the gear/material grades 1-6 (no parallel system). */
const QUALITY = [null, { n: 'Basic', c: 'Grey', col: '#9aa4a8' }, { n: 'Common', c: 'White', col: '#e6ebee' }, { n: 'Uncommon', c: 'Green', col: '#6fb35a' }, { n: 'Rare', c: 'Blue', col: '#4f9ae0' }, { n: 'Epic', c: 'Purple', col: '#9a6ad6' }, { n: 'Legendary', c: 'Gold', col: '#e0a44a' }];
const qName = g => QUALITY[g].n;
const qFull = g => QUALITY[g].n + ' (' + QUALITY[g].c + ')';
/* 4-to-1: four identical materials make one of the next tier (4^5 = 1,024 Basic = 1 Legendary). Four identical materials craft gear of exactly that tier, 100% guaranteed.
   Mixed craft ("casino"): the four inputs are sorted lowest to highest. Output is the lowest input 75%, second-lowest 20%, third 4.9%, highest 0.1%. */
const MIX_ODDS = [0.75, 0.20, 0.049, 0.001];
const REQ_COOLDOWN_SHEET = 1800;   // 30 sheet minutes between requisitions
function reqAmounts(L) { return { rations: L * 500, fuel: L * 500, power: L * 400, alloy: L * 300, cash: L * 150 }; }

/* ---------------- Gems, sockets and the Forge (docs/FORGE_GEMS.md) ----------------
   Every piece has 4 sockets. Quality opens 1 to 3 (socketsNative); socket 4 opens with the Gemology research.
   Gems use the same six tiers and the same 4-to-1 and mixed-craft rules as materials.
   Regular gems (the six cores) give one generic stat. Monster gems are tied to one of the 27 gear sets (12 weekly + 15 holiday)
   and give that set's stat; four gems of one monster set in the four sockets of ONE piece complete its Gem Set bonus.
   OPEN ITEM: every value below is a placeholder. */
const SOCKETS = 4, STAR_MAX = 5, STAR_PCT = 0.08;
const CORES = {
  strike: { n: 'Strike core', stat: 'atk', col: '#e0603a' }, guard: { n: 'Guard core', stat: 'hp', col: '#3a64c8' }, bulwark: { n: 'Bulwark core', stat: 'wallHp', col: '#8a98a8' },
  haste: { n: 'Haste core', stat: 'march', col: '#e0c030' }, yield: { n: 'Yield core', stat: 'yld', col: '#4fb868' }, mend: { n: 'Mend core', stat: 'heal', col: '#4fc8b8' }
};
const GEM_PCT = [0.004, 0.007, 0.011, 0.016, 0.022, 0.030];          // one gem, by tier
const GEMSET_PCT = [0.01, 0.02, 0.03, 0.045, 0.065, 0.09];           // Gem Set bonus (4 monster gems in one piece), by the LOWEST tier of the four
const socketsNative = grade => Math.min(3, Math.ceil(grade / 2));    // Basic 1, Common 1, Uncommon 2, Rare 2, Epic 3, Legendary 3
const gemKey = (kind, tier) => kind + ':' + tier;
const gemSplit = k => { const i = k.lastIndexOf(':'); return [k.slice(0, i), +k.slice(i + 1)]; };
const gemIsSet = kind => !CORES[kind];
const gemStatKey = kind => CORES[kind] ? CORES[kind].stat : SETS[gearOf(kind)].st[0];
const gemName = kind => CORES[kind] ? CORES[kind].n : SETS[kind].mon;
const gemCol = kind => CORES[kind] ? CORES[kind].col : SETS[kind].aura;
const gemMon = kind => gemIsSet(kind) ? SETS[kind].mon : null;
const starMul = p => 1 + STAR_PCT * (p.stars || 0);
/* Names: materials, gems and gear quality share the six tiers but have their own names (spec 2026-10-01). */
const MAT_NAMES = [null, 'Composite Alloy', 'Carbon Fiber', 'Ballistic Polymer', 'Quantum Circuitry', 'Nano-Titanium', 'Aether-Core'];
const GEM_TIERS = [null, 'Raw Shard', 'Calibrated Core', 'Prism Matrix', 'Hyper-Lens', 'Singularity Crystal', 'Omega Diamond'];
const matName = t => MAT_NAMES[t], gemTierName = t => GEM_TIERS[t];
/* One piece: the value of each of its stats (a fraction), by tier (and stars). Basic gear uses its category, set gear its set. */
function pieceLv(p) { return p.set ? SETS[p.set].lv : BASIC[p.cat || 'attack'].lv; }
function pieceStatMap(p) {
  const r = {}, [lo, hi] = p.set ? SET_RANGE : [BASIC[p.cat || 'attack'].lo, BASIC[p.cat || 'attack'].hi], v = (lo + (hi - lo) * (p.grade - 1) / 5) / 100 * starMul(p);
  for (const k of (p.set ? SETS[p.set].st : BASIC[p.cat || 'attack'].st)) r[k] = v; return r;
}
const pieceScore = p => { const m = pieceStatMap(p); let t = 0; for (const k in m) t += m[k]; return t; };
const pieceKind = p => p.set ? SETS[p.set].n : BASIC[p.cat || 'attack'].n;
/* Where gems and set materials come from (docs/FORGE_GEMS.md section 5) */
const TILE_W = [40, 30, 20, 10];             // regular world tile: tier weights (Basic..Rare), cut off at the tile level
const TILE_J5 = 0.05, TILE_J6 = 0.001;       // chance per gather: the weekly Level 5 jackpot (tiles 5-6, once a week), the 6-pack Level 6 jackpot (tile 6)
const STORE_COST = 50, STORE_ROLLS = 3, STORE_TIER2 = 0.35;   // alliance store mystery chest: alliance points, rolls, chance a roll is Level 2 (else Level 1)
const GIFT_ROLLS = 2, GIFT_TIER4 = 0.3;      // alliance gift chest from a member's pack purchase: rolls of each kind, chance of Level 4 (else Level 3)
