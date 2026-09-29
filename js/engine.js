'use strict';
/* IRON MARCH — engine: state, world, jobs, marches, combat, threats. No DOM here. */
const FOREVER = 8e15;
const UIH = { toast() { }, dirty() { }, tone() { }, flash() { }, done() { } };
let S = null;
const SAVE_KEY = 'ironmarch.v1';
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const key = (x, y) => x + ',' + y;
const unkey = k => k.split(',').map(Number);

/* ---------------- state ---------------- */
function newState() {
  const now = Date.now();
  const inner = Array(25).fill(null), outer = Array(25).fill(null);
  const put = (arr, i, b, l) => { arr[i] = { b, l }; };
  put(inner, 12, 'cc', 6); put(inner, 7, 'mil', 6); put(inner, 11, 'depot', 4); put(inner, 13, 'treasury', 3); put(inner, 17, 'tech', 4);
  put(inner, 6, 'hall', 3); put(inner, 18, 'prison', 1); put(inner, 8, 'radar', 4); put(inner, 16, 'store', 4); put(inner, 2, 'defense', 4); put(inner, 22, 'market', 1);
  [[0, 'rations'], [1, 'rations'], [2, 'rations'], [5, 'fuel'], [6, 'fuel'], [10, 'power'], [11, 'power'], [15, 'alloy'], [16, 'alloy']].forEach(([i, b]) => put(outer, i, b, 4));
  const bots = [
    { n: 'Black Ridge', tag: 'BRG', cmd: 'Vex Marlow', color: 'ember', x: 340, y: 330, p: 1 },
    { n: 'Kestrel Line', tag: 'KLN', cmd: 'Nora Stahl', color: 'iris', x: 90, y: 560, p: 2 },
    { n: 'Harrow Pact', tag: 'HRW', cmd: 'Cass Odum', color: 'pine', x: 405, y: 700, p: 3 },
    { n: 'Vantage Corps', tag: 'VNT', cmd: 'Ilya Brandt', color: 'frost', x: 170, y: 860, p: 4 },
    { n: 'Cold Anvil', tag: 'CLD', cmd: 'Mira Tesk', color: 'wine', x: 300, y: 950, p: 5 }
  ].map((b, i) => Object.assign(b, { al: i + 1, shieldUntil: 0 }));
  const st = {
    v: 1, seq: 1, t0: now, last: now,
    res: { rations: 20000, fuel: 16000, power: 14000, alloy: 12000, cash: 6000 }, dia: 250, ledger: [],
    base: { x: 120, y: 220 }, plots: { in: inner, out: outer }, builders: 1,
    troops: { inf1: 160, arm1: 70, air1: 45, siege1: 24, inf2: 36 },
    wounded: { inf1: 40, siege1: 8, inf2: 18 }, wall: { sent1: 12, garr1: 8 },
    jobs: [], marches: [], incoming: [], own: {}, encs: {}, nodes: {}, dead: {},
    research: {}, bars: { 1: 6, 2: 2, 3: 1, 4: 0, 5: 0, 6: 0 }, gems: 0, shards: { vanguard: 1, outrider: 0, battery: 1 },
    gear: { pieces: [], worn: {} }, slips: { s5: 2, s60: 0, s480: 0 }, tokens: 1, orders: 3, seals: 1,
    hero: { id: 'ren', rank: 3, captured: false }, shield: { until: 0 }, anti: false,
    throne: { neutral: true, holder: null, holdEnd: 0, ruler: null, ruleUntil: 0, officers: [], colMarch: 0 },
    titles: {}, roster: ['Ada Voss', 'Ivo Hale', 'Ren Kade', 'Tobin Mace', 'Sera Quill', 'Dov Marek', 'Lio Hart'],
    al: [{ n: 'Iron March', tag: 'IRM', color: 'brass' }].concat(bots.map(b => ({ n: b.n, tag: b.tag, color: b.color }))), bots,
    reports: [], log: [], score: 0, view: { x: 120, y: 220 }, market: { day: -1, offers: [] }, daily: '', kills: 0,
    next: { expand: now + 8000, atk: now + 100000, scout: now + 50000, throne: now + 360000, orders: now + 120000 },
    scoutStamps: [], prod: {}, nid: 1
  };
  const A = st.al; // starter territory blobs
  st.own = {};
  const blob = (cx, cy, r, al, seed) => { for (let y = cy - r - 2; y <= cy + r + 2; y++) for (let x = cx - r - 2; x <= cx + r + 2; x++) { const d = Math.hypot(x - cx, y - cy); if (d <= r * (0.72 + hx(x, y, seed) * 0.45)) st.own[key(x, y)] = al; } };
  blob(st.base.x, st.base.y, 5, 0, 21);
  bots.forEach(b => blob(b.x, b.y, 9, b.al, 30 + b.al));
  return st;
}
function save() { try { S.last = Date.now(); localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { } }
function load() { try { const s = localStorage.getItem(SAVE_KEY); if (s) { const o = JSON.parse(s); if (o && o.v === 1) return o; } } catch (e) { } return null; }
function resetGame() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } S = newState(); terrDirty = true; UIH.dirty(); }
function note(m, kind) { S.log.unshift({ t: Date.now(), m, k: kind || 'info' }); if (S.log.length > 80) S.log.length = 80; UIH.toast(m, kind); }
function dchg(n, why) { S.dia += n; S.ledger.unshift({ t: Date.now(), n, why, bal: S.dia }); if (S.ledger.length > 120) S.ledger.length = 120; }

/* ---------------- world ---------------- */
let terrDirty = true;
function terrainAt(x, y) { if (x === TX && y === TY) return 'throne'; const d = Math.hypot(x - TX, y - TY); if (d <= PLAZA_R) return 'plaza'; if (d <= FOREST_R) return 'forest'; return 'wild'; }
const DMAX = Math.hypot(TX, TY);
function gradeAt(x, y) { const d = Math.hypot(x - TX, y - TY); if (d <= FOREST_R) return 6; const t = (d - FOREST_R) / (DMAX - FOREST_R); return 6 - Math.min(5, Math.floor(clamp(t, 0, 1) * 5.999)); }
function featAt(x, y, terr) {
  if (terr !== 'wild' && terr !== 'forest') return null;
  const f = terr === 'forest', r = hx(x, y, 7);
  const resP = f ? 0.012 : 0.016, monP = f ? 0.03 : 0.011, campP = f ? 0.002 : 0.004;
  if (r < resP) return { t: 'res', node: NODE_KEYS[Math.floor(hx(x, y, 8) * 4)] };
  if (r < resP + monP) return { t: 'mon' };
  if (r < resP + monP + campP) return { t: 'camp' };
  return null;
}
function botAt(x, y) { for (const b of S.bots) if (b.x === x && b.y === y) return b; return null; }
function isPBase(x, y) { return S.base.x === x && S.base.y === y; }
function nodeAt(x, y) {
  const k = key(x, y), n = S.nodes[k];
  if (n) { if (n.emptyUntil && Date.now() > n.emptyUntil) { delete S.nodes[k]; } else return n.stock > 0 ? n : null; }
  if (S.dead[k]) return null;
  const terr = terrainAt(x, y), f = featAt(x, y, terr);
  if (!f || f.t !== 'res' || botAt(x, y) || isPBase(x, y)) return null;
  const g = gradeAt(x, y), nn = { res: NODE_RES[f.node], nk: f.node, grade: g, stock: 200 * g, max: 200 * g, rich: false };
  return S.nodes[k] && S.nodes[k].emptyUntil ? null : nn;
}
function tileInfo(x, y) {
  const terr = terrainAt(x, y), k = key(x, y), t = { x, y, terr, grade: gradeAt(x, y), owner: S.own[k], enc: S.encs[k], kind: terr };
  if (isPBase(x, y)) { t.kind = 'pbase'; return t; }
  const b = botAt(x, y); if (b) { t.kind = 'base'; t.bot = b; return t; }
  if (terr === 'plaza' || terr === 'throne') return t;
  const nn = nodeAt(x, y);
  if (nn) { t.kind = 'node'; t.node = nn; t.nk = nn.nk || (nn.res === 'rations' ? 'food' : nn.res === 'fuel' ? 'oil' : nn.res === 'power' ? 'energy' : 'steel'); return t; }
  if (!S.dead[k]) { const f = featAt(x, y, terr); if (f && f.t === 'mon') t.kind = 'monster'; else if (f && f.t === 'camp') t.kind = 'camp'; }
  return t;
}
function forestTiles(x0, y0, x1, y1) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)), seen = new Set(); let c = 0;
  for (let i = 0; i <= n; i++) { const t = n ? i / n : 0, x = Math.round(x0 + (x1 - x0) * t), y = Math.round(y0 + (y1 - y0) * t), k = key(x, y); if (seen.has(k)) continue; seen.add(k); if (terrainAt(x, y) === 'forest') c++; }
  return c;
}
function inForest() { return terrainAt(S.base.x, S.base.y) === 'forest'; }
function legalSpot(x, y) {
  if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return false;
  const t = tileInfo(x, y); return (t.kind === 'wild' || t.kind === 'forest') && !t.enc;
}

/* ---------------- levels and vectors ---------------- */
function allPlots() { const a = []; ['in', 'out'].forEach(ar => S.plots[ar].forEach((p, i) => { if (p) a.push({ ar, i, b: p.b, l: p.l }); })); return a; }
function lvlSum(b) { let s = 0; for (const p of allPlots()) if (p.b === b) s += p.l; return s; }
function lvlMax(b) { let s = 0; for (const p of allPlots()) if (p.b === b) s = Math.max(s, p.l); return s; }
function hasB(b) { return allPlots().some(p => p.b === b && p.l > 0); }
const R = id => S.research[id] || 0;
const rv = id => lin(R(id), RS[id].a, RS[id].b, RS[id].max);
function ccLevel() { return lvlMax('cc'); }
function headcount() { const L = ccLevel(), h = lvlMax('hall'); return Math.floor((500 + L * 400) * (1 + (h ? h * 0.04 : 0))); }
function marchQueues() { return 1 + Math.floor(ccLevel() / 5); }
function helpCap() { return 4 + ccLevel() * 2; }
function storeSum() { return lvlSum('store'); }
function storeCap() { const L = storeSum(); return L > 0 ? Math.floor(8000 * Math.pow(L, 1.22) * (1 + rv('wh'))) : 8000; }
function protectedFloor() { return 1200 * storeSum(); }
function bedCap() { return Math.floor(500 * lvlSum('depot') * (1 + rv('beds'))); }
function woundedTotal() { let s = 0; for (const k in S.wounded) s += S.wounded[k]; return s; }
function sumCol(c) { let s = 0; for (const k in c) s += c[k]; return s; }
function clsAvail(cls) { let s = 0; for (let t = 1; t <= 4; t++) s += S.troops[cls + t] || 0; return s; }
function heroLocked() { return S.marches.some(m => m.hero); }
function heroOn() { return !S.hero.captured; }

function slotPiece(slot) { const id = S.gear.worn[slot]; return id ? S.gear.pieces.find(p => p.id === id) : null; }
function setBonus() { const w = SLOTS.map(slotPiece); if (w.some(p => !p)) return null; const s = w[0].set; if (!s || w.some(p => p.set !== s)) return null; return s; }
function mods(withHero) {
  const m = { atk: {}, hp: 1, yld: {}, gather: 0, load: rv('load'), march: rv('march'), train: 0, build: rv('build'), heal: rv('restore'), wallAtk: rv('perim'), wallHp: rv('bulk'), helmet: 0 };
  const T = TITLES[S.titles.you] ? S.titles.you : null;
  const set = setBonus();
  const wp = slotPiece('weapon'), cp = slotPiece('chest'), hp = slotPiece('helmet'), bp = slotPiece('boots'), ap = slotPiece('accessory');
  let hpAdd = rv('plating') + (cp ? piecePct('chest', cp.grade) : 0);
  let marchAtk = 0, yAdd = 0;
  if (T === 'blade') marchAtk += 0.08; if (T === 'coward') marchAtk -= 0.08;
  if (T === 'bulwark') hpAdd += 0.08; if (T === 'brittle') hpAdd -= 0.08;
  if (T === 'provisioner') { yAdd += 0.10; m.gather += 0.10; } if (T === 'burden') { yAdd -= 0.10; m.gather -= 0.10; }
  if (T === 'sluggard') m.march -= 0.08;
  if (heroOn() && S.hero.id === 'ada') yAdd += 0.03 * S.hero.rank;
  if (set === 'battery') yAdd += 0.15;
  if (heroOn() && S.hero.id === 'ren' && withHero) marchAtk += 0.03 * S.hero.rank;
  if (bp) { const p = piecePct('boots', bp.grade); m.march += p; m.gather += p; }
  m.gather += rv('gather');
  if (hp) m.helmet = piecePct('helmet', hp.grade);
  m.train = rv('logi') + rv('trainspd') + (T === 'drillmaster' ? 0.08 : 0);
  if (ap) { const p = piecePct('accessory', ap.grade); if (ap.stat === 'training') m.train += p; else yAdd += p; }
  if (heroOn() && S.hero.id === 'ivo') m.heal += 0.04 * S.hero.rank;
  m.hp = 1 + hpAdd;
  for (const c of CLS) m.atk[c] = (1 + rv('atk_' + c)) * (1 + (wp ? piecePct('weapon', wp.grade) : 0)) * (1 + (set === 'vanguard' || set === 'outrider' ? 0.15 : 0)) * (1 + marchAtk);
  for (const r of RES) m.yld[r] = 1 + (RS['y_' + r] ? rv('y_' + r) : 0) + yAdd;
  m.marchAtk = marchAtk; m.hpAdd = hpAdd; m.set = set;
  return m;
}

/* ---------------- combat ---------------- */
function mkSide(col, atkM, hpM, wall, syn) {
  const units = [];
  for (const k in col) { if (!col[k]) continue; const [c, t] = ckSplit(k), st = unitStat(c, t); units.push({ k, c, t, n: col[k], atk: st.atk * (atkM[c] || 1), hp: st.hp * hpM }); }
  return { units, wall: wall || null, syn: syn || null };
}
function mixOf(side) {
  const mix = {}; let tot = 0;
  for (const u of side.units) { mix[u.c] = (mix[u.c] || 0) + u.n * u.hp; tot += u.n * u.hp; }
  if (side.wall) { mix.wall = side.wall.hp; tot += side.wall.hp; }
  if (side.syn) { for (const c of CLS) mix[c] = (mix[c] || 0) + side.syn.H / 4; tot += side.syn.H; }
  if (tot <= 0) return {};
  for (const k in mix) mix[k] /= tot; return mix;
}
function fight(A, D) {
  const aMix = mixOf(A), dMix = mixOf(D); let Sa = 0, Ha = 0, Sd = 0, Hd = 0;
  for (const u of A.units) { let m = 0; for (const c of CLS) m += (dMix[c] || 0) * matchup(u.c, c); m += (dMix.wall || 0) * matchup(u.c, 'wall'); Sa += u.n * u.atk * m; Ha += u.n * u.hp; }
  for (const u of D.units) { let m = 0; for (const c of CLS) m += (aMix[c] || 0) * matchup(u.c, c); Sd += u.n * u.atk * m; Hd += u.n * u.hp; }
  if (D.wall) { let cm = 1; const crew = D.wall.crew || {}; let ct = 0; for (const k in crew) ct += crew[k]; if (ct) for (const k in crew) { const c = WCLSD[ckSplit(k)[0]].counter; if (c) cm += 0.55 * (crew[k] / ct) * (aMix[c] || 0); } Sd += D.wall.atk * cm; Hd += D.wall.hp; }
  if (D.syn) { Sd += D.syn.S; Hd += D.syn.H; }
  if (A.syn) { Sa += A.syn.S; Ha += A.syn.H; }
  const q = (Sd * Hd) <= 0 ? 1e9 : (Sa * Ha) / (Sd * Hd), win = q > 1;
  const platA = A.plating || 0, platD = D.plating || 0;
  let fa = win ? 0.14 * clamp(1 / Math.sqrt(q), 0.15, 1) : Math.min(1, 0.48 * clamp(Math.sqrt(1 / q), 1, 2.1));
  let fd = win ? Math.min(1, 0.48 * clamp(Math.sqrt(q), 1, 2.1)) : 0.14 * clamp(Math.sqrt(q), 0.15, 1);
  fa /= (1 + platA); fd /= (1 + platD);
  if (Sd <= 0 && Hd <= 0) fd = 1;
  return { q, win, Sa, Sd, Ha, Hd, fa, fd };
}
function applyLoss(col, frac) {
  const left = {}, lost = {}, wounded = {}, dead = {};
  for (const k in col) { const n = col[k]; let l = frac >= 1 ? n : Math.min(n, Math.round(n * frac)); if (frac > 0 && l === 0 && n >= 1 && frac >= 0.5 / n) l = 1; const w = Math.round(l * 0.8); if (n - l > 0) left[k] = n - l; if (l) { lost[k] = l; wounded[k] = w; dead[k] = l - w; } }
  return { left, lost, wounded, dead };
}
function synDef(S_, H_) { return { S: S_, H: H_ }; }
function monsterSyn(g, camp) { const f = camp ? 0.5 : 1; return synDef(150 * Math.pow(g, 1.8) * f, 1500 * Math.pow(g, 1.8) * f); }
function botScale() { return 1 + (Date.now() - S.t0) / 60000 * 0.012; }
function botSyn(b, f) { f = f || 1; const s = botScale(); return synDef(900 * Math.pow(b.p, 1.5) * s * f, 11000 * Math.pow(b.p, 1.5) * s * f); }
function citadelSide() { return mkSide({ inf2: 60, arm1: 16 }, {}, 1); }
function wallStats() {
  const m = mods(), Rr = lvlMax('radar'), DC = lvlMax('defense'); let cAtk = 0, cHp = 0, crew = {};
  for (const k in S.wall) { const n = S.wall[k]; if (!n) continue; const t = ckSplit(k)[1]; cAtk += n * WT[t - 1].pow; cHp += n * WT[t - 1].hp; crew[k] = n; }
  const hp = (Math.floor(1400 * Rr * (1 + m.wallHp)) + cHp * (1 + m.wallHp)) * (1 + m.helmet);
  const atk = (Math.floor(90 * Rr * (1 + m.wallAtk)) + DC * 40 + 0.25 * cAtk * (1 + m.wallAtk)) * (1 + m.helmet);
  return { hp, atk, crew, crewN: sumCol(crew) };
}
function playerDefSide() { const m = mods(); const w = wallStats(); return Object.assign(mkSide(S.troops, m.atk, m.hp, w), { plating: rv('plating') }); }
function attackerSide(col, hero) { const m = mods(hero); return Object.assign(mkSide(col, m.atk, m.hp), { plating: rv('plating') }); }
function unitRows(side, res) { return side.units.map(u => [tierName(u.c, u.t), u.n, (res.lost && res.lost[u.k]) || 0, (res.wounded && res.wounded[u.k]) || 0]); }
function boostRows(hero) {
  const m = mods(hero), avg = CLS.reduce((a, c) => a + m.atk[c], 0) / 4;
  const rows = [['Troop attack', '+' + Math.round((avg - 1) * 100) + '%'], ['Troop health', '+' + Math.round((m.hp - 1) * 100) + '%'], ['March speed', (m.march >= 0 ? '+' : '') + Math.round(m.march * 100) + '%']];
  if (hero && heroOn()) rows.push(['Hero', HEROES[S.hero.id].n + ' r' + S.hero.rank]);
  if (m.set) rows.push(['Set', SETS[m.set].n]);
  return rows;
}
function pushReport(r) { r.id = S.nid++; r.t = Date.now(); S.reports.unshift(r); if (S.reports.length > 30) S.reports.length = 30; return r; }
function synRows(name, n, lost) { return [[name, n, lost || 0, 0]]; }

/* ---------------- economy ---------------- */
function gaps(cost) { const g = {}; let any = false; for (const r in cost) { const d = cost[r] - Math.floor(S.res[r]); if (d > 0) { g[r] = d; any = true; } } return any ? g : null; }
function diaFor(g) { let d = 0; for (const r in g) d += Math.ceil(g[r] / DIA_RATE[r]); return d; }
function pay(cost, cover, why) {
  const g = gaps(cost);
  if (g) { if (!cover) return 'Short of ' + Object.keys(g).map(r => RESN[r]).join(', ') + '.'; const d = diaFor(g); if (S.dia < d) return 'Short of diamonds.'; dchg(-d, 'Covered gap: ' + why); }
  for (const r in cost) S.res[r] = Math.max(0, S.res[r] - cost[r]);
  return null;
}
function addRes(r, n) { const cap = storeCap(); const room = Math.max(0, cap - S.res[r]); const a = Math.min(room, n); S.res[r] += a; return a; }
function produce(dt) {
  const m = mods(), cap = storeCap();
  for (const p of allPlots()) {
    if (p.l <= 0) continue; const d = BLD[p.b];
    let rate = 0, r = null;
    if (d.res) { r = d.res; rate = d.rate * p.l * m.yld[r]; } else if (p.b === 'treasury') { r = 'cash'; rate = 480 * p.l * m.yld.cash; }
    if (r && S.res[r] < cap) S.res[r] = Math.min(cap, S.res[r] + rate / 3600 * DRILL * dt);
  }
}
function hourly() { const m = mods(), o = {}; for (const p of allPlots()) { if (p.l <= 0) continue; const d = BLD[p.b]; if (d.res) o[d.res] = (o[d.res] || 0) + d.rate * p.l * m.yld[d.res]; else if (p.b === 'treasury') o.cash = (o.cash || 0) + 480 * p.l * m.yld.cash; } return o; }

/* ---------------- timed jobs (build, train, research, heal, wall) ---------------- */
const JOB_LIMIT = { build: () => S.builders, train: () => 1, res: () => 1, heal: () => 1, wall: () => 1 };
function jobsOf(kind) { return S.jobs.filter(j => j.kind === kind); }
function addJob(kind, sheetSec, extra, why) {
  if (jobsOf(kind).length >= JOB_LIMIT[kind]()) return kind === 'build' ? 'Builders are busy.' : 'That queue is busy.';
  const now = Date.now(); let ms = sheetSec / DRILL * 1000; const dur = Math.max(1000, ms);
  const j = Object.assign({ id: S.nid++, kind, start: now, end: now + dur, dur, helps: 0, ask: false, nextHelp: 0, why }, extra); S.jobs.push(j); return null;
}
function buildErr(area, idx, b) {
  const p = S.plots[area][idx]; const cc = ccLevel();
  if (p && S.jobs.some(j => j.kind === 'build' && j.area === area && j.idx === idx)) return 'That plot is already under work.';
  const to = (p ? p.l : 0) + 1; b = p ? p.b : b;
  if (!b) return 'Pick a building first.';
  if (area === 'in' && !BLD[b].inner) return 'That belongs on an outer plot.';
  if (area === 'out' && !BLD[b].res) return 'That belongs on an inner plot.';
  if (!p && BLD[b].unique && allPlots().some(x => x.b === b)) return 'One Command Center only.';
  if (to > 25) return 'Level 25 is the ceiling.';
  if (b !== 'cc' && to > cc) return 'Raise the Command Center first.';
  return null;
}
function startBuild(area, idx, b, cover) {
  const e = buildErr(area, idx, b); if (e) return e;
  let p = S.plots[area][idx]; const to = (p ? p.l : 0) + 1; b = p ? p.b : b;
  if (jobsOf('build').length >= S.builders) return 'Builders are busy.';
  const pe = pay(buildCost(b, to), cover, BLD[b].n + ' ' + to); if (pe) return pe;
  const sec = buildSheetSec(b, to) / (1 + mods().build);
  if (!p) S.plots[area][idx] = { b, l: 0 };
  addJob('build', sec, { area, idx, b, to }, BLD[b].n + ' ' + to); return null;
}
function trainGate(t) {
  if (t === 1) return null; const g = TIER_GATE[t - 1];
  if (!R(g.doc)) return RS[g.doc].n + ' first.';
  if (lvlMax('mil') < g.mil) return 'Military Complex ' + g.mil + ' needed.';
  if (g.tech && lvlMax('tech') < g.tech) return 'Tech Institute ' + g.tech + ' needed.';
  return null;
}
function batchCap(t) { return Math.floor(lvlSum('mil') * 40 / t); }
function trainSheet(cls, t, n) { const m = mods(); return CLSD[cls].train[t - 1] * n * Math.max(0.2, 1 - m.train); }
function startTrain(cls, t, n, cover) {
  if (n <= 0) return 'Set a batch first.'; const g = trainGate(t); if (g) return g;
  if (n > batchCap(t)) return 'Batch cap is ' + batchCap(t) + '.';
  if (jobsOf('train').length) return 'The training queue is busy.';
  const c = trainCost(cls, t); for (const r in c) c[r] *= n;
  const pe = pay(c, cover, 'Train'); if (pe) return pe;
  return addJob('train', trainSheet(cls, t, n), { cls, t, n }, n + ' ' + tierName(cls, t));
}
function startWall(cls, t, n, cover) {
  if (n <= 0) return 'Set a batch first.'; if (lvlMax('defense') < WALL_GATE[t - 1]) return 'Defense Center ' + WALL_GATE[t - 1] + ' needed.';
  const cap = lvlMax('defense') * 40, have = sumCol(S.wall) + (jobsOf('wall')[0] ? jobsOf('wall')[0].n : 0);
  if (have + n > cap) return 'Crew cap is ' + cap + '.';
  if (jobsOf('wall').length) return 'The wall queue is busy.';
  const c = {}; for (const r in WALL_COST) c[r] = Math.round(WALL_COST[r] * WT[t - 1].pow * n / 2);
  const pe = pay(c, cover, 'Wall crew'); if (pe) return pe;
  return addJob('wall', WT[t - 1].sec * n, { cls, t, n }, n + ' ' + WCLSD[cls].names[t - 1]);
}
function healCost(cls, t, n) { const c = trainCost(cls, t), o = {}; for (const r in c) o[r] = Math.round(c[r] * 0.4 * n); return o; }
function startHeal(cls, t, n, cover) {
  const k = ck(cls, t); n = Math.min(n, S.wounded[k] || 0); if (n <= 0) return 'Nobody wounded there.';
  const pe = pay(healCost(cls, t, n), cover, 'Heal'); if (pe) return pe;
  if (t === 1) { S.wounded[k] -= n; S.troops[k] = (S.troops[k] || 0) + n; if (!S.wounded[k]) delete S.wounded[k]; return null; }
  if (jobsOf('heal').length) { for (const r in healCost(cls, t, n)) S.res[r] += healCost(cls, t, n)[r]; return 'The heal queue is busy.'; }
  S.wounded[k] -= n; if (!S.wounded[k]) delete S.wounded[k];
  const sec = CLSD[cls].train[t - 1] * n * 0.5 / (1 + mods().heal + rv('repair'));
  return addJob('heal', sec, { cls, t, n }, n + ' ' + tierName(cls, t));
}
function researchGate(id) {
  const d = RS[id], lv = R(id);
  if (lv >= d.max) return 'Maxed.';
  if (!hasB('tech')) return 'Build a Tech Institute.';
  for (const [r, l] of d.req) if (R(r) < l) return RS[r].n + ' ' + l + ' first.';
  if (id === 'recon' && lv + 1 > lvlMax('radar')) return 'Radar Station ' + (lv + 1) + ' needed.';
  return null;
}
function startResearch(id, cover) {
  const g = researchGate(id); if (g) return g; if (jobsOf('res').length) return 'The lab is busy.';
  const to = R(id) + 1, pe = pay(researchCost(id, to), cover, RS[id].n); if (pe) return pe;
  return addJob('res', researchSheetSec(id, to), { id, to }, RS[id].n + ' ' + to);
}
function finishJob(j) {
  UIH.done(j);
  if (j.kind === 'build') { S.plots[j.area][j.idx] = { b: j.b, l: j.to }; note(BLD[j.b].n + ' is now level ' + j.to + '.', 'good'); }
  else if (j.kind === 'train') { const k = ck(j.cls, j.t); S.troops[k] = (S.troops[k] || 0) + j.n; note(j.n + ' ' + tierName(j.cls, j.t) + ' are on the line.', 'good'); }
  else if (j.kind === 'res') { S.research[j.id] = j.to; note(RS[j.id].n + ' ' + j.to + ' is done.', 'good'); }
  else if (j.kind === 'heal') { const k = ck(j.cls, j.t); S.troops[k] = (S.troops[k] || 0) + j.n; note(j.n + ' ' + tierName(j.cls, j.t) + ' are back on their feet.', 'good'); }
  else if (j.kind === 'wall') { const k = ck(j.cls, j.t); S.wall[k] = (S.wall[k] || 0) + j.n; note(j.n + ' ' + WCLSD[j.cls].names[j.t - 1] + ' are up.', 'good'); }
}
function remSheet(end) { return Math.max(0, (end - Date.now()) / 1000 * DRILL); }
function rushCost(end) { return Math.ceil(remSheet(end) / 30); }
function rushJob(id) {
  const j = S.jobs.find(x => x.id === id) || S.marches.find(x => x.id === id); if (!j) return 'Nothing to rush.';
  if (j.kind === 'rally' && j.phase !== 'wait') return 'A launched column takes no speed-up.';
  if (j.end > 1e15) return 'Nothing to rush.';
  const c = rushCost(j.end); if (!c) return null; if (S.dia < c) return 'Short of diamonds.';
  dchg(-c, 'Rush timer'); j.end = Date.now(); return null;
}
function slipJob(id, which) {
  const j = S.jobs.find(x => x.id === id) || S.marches.find(x => x.id === id); if (!j) return 'Nothing to speed up.';
  if (j.kind === 'rally' && j.phase !== 'wait') return 'A launched column takes no speed-up.';
  if (j.end > 1e15) return 'Nothing to speed up.';
  const rem = remSheet(j.end), order = ['s5', 's60', 's480'];
  let use = which; if (!use) use = order.find(s => S.slips[s] > 0 && SLIPS.find(x => x.id === s).sec >= rem) || order.slice().reverse().find(s => S.slips[s] > 0);
  if (!use || !S.slips[use]) return 'No slips in the rack.';
  S.slips[use]--; j.end -= SLIPS.find(x => x.id === use).sec / DRILL * 1000; return null;
}
function askHelp(id) { const j = S.jobs.find(x => x.id === id); if (!j) return 'Nothing to help.'; if (j.ask) return 'Help already asked.'; j.ask = true; j.nextHelp = Date.now() + 1200; return null; }

/* ---------------- shield ---------------- */
function shieldOn() { return S.shield.until > Date.now() && !inForest(); }
function shieldSheet() { return 8 * 3600; }
function shieldOut() { return S.marches.some(m => m.off || m.phase === 'back'); }
function toggleShield() {
  if (S.shield.until > Date.now()) { S.shield.until = 0; return null; }
  if (shieldOut()) return 'Recall the columns first. A shield cannot rise with marches out.';
  S.shield.until = Date.now() + shieldSheet() / OCC * 1000; note('Peace shield up.', 'good'); return null;
}
function stripShield(why) { if (S.shield.until > Date.now()) { S.shield.until = 0; note('Shield stripped: ' + why + '.', 'warn'); } }

/* ---------------- marches ---------------- */
function colStats(col, m) {
  let load = 0, speed = Infinity, n = 0, power = 0;
  for (const k in col) { const [c, t] = ckSplit(k), st = unitStat(c, t); load += col[k] * st.load; speed = Math.min(speed, st.speed); n += col[k]; power += col[k] * Math.pow(4, t - 1); }
  m = m || mods(); return { load: load * (1 + m.load), speed: speed * (1 + m.march), n, power };
}
function takeClass(cls, n) { const out = {}; for (let t = 4; t >= 1 && n > 0; t--) { const k = cls + t, a = Math.min(n, S.troops[k] || 0); if (a > 0) { out[k] = a; S.troops[k] -= a; n -= a; if (!S.troops[k]) delete S.troops[k]; } } return out; }
function compTotal(c) { return CLS.reduce((a, k) => a + (c[k] || 0), 0); }
function bestComp(cap) {
  const all = []; for (const k in S.troops) if (S.troops[k] > 0) { const [c, t] = ckSplit(k); all.push({ c, t, n: S.troops[k] }); }
  all.sort((a, b) => b.t - a.t || b.n - a.n); const comp = { inf: 0, arm: 0, air: 0, siege: 0 }; let left = cap;
  for (const u of all) { const a = Math.min(left, u.n); comp[u.c] += a; left -= a; if (left <= 0) break; }
  return comp;
}
function occDurMs(power, flip) { const base = 14400 / OCC * 1000; let d = base; if (power > 200) d = clamp(base * Math.pow(200 / power, 0.85), base * 0.04, base); return d * (flip ? 2.6 : 1); }
function legMs(dist, speed, forest) { const ms = Math.max(4000, Math.round(dist / speed * 1000)); const f = forest * 240 / DRILL * 1000 / (speed / 100); return ms + Math.round(f); }
function alName(i) { return S.al[i].n; }
function alColor(i) { return STD[S.al[i].color]; }

function marchCheck(comp, hero) {
  const tot = compTotal(comp); if (tot <= 0) return 'Empty column is not a march.';
  if (tot > headcount()) return 'Column is over the headcount of ' + fmtN(headcount()) + '.';
  for (const c of CLS) if ((comp[c] || 0) > clsAvail(c)) return 'Not enough ' + CLSD[c].n.toLowerCase() + ' in garrison.';
  if (S.marches.filter(m => m.kind !== 'scout').length >= marchQueues()) return 'All march queues are out.';
  if (hero) { if (S.hero.captured) return 'The hero is captured.'; if (heroLocked()) return 'The hero is already out.'; }
  return null;
}
function launchMarch(kind, tx, ty, comp, hero, opts) {
  opts = opts || {};
  const e = marchCheck(comp, hero); if (e) return e;
  const t = tileInfo(tx, ty); let off = false, sub = null;
  if (kind === 'gather') { if (t.kind !== 'node') return 'No vein there.'; if (t.owner != null && t.owner !== 0) { /* gathering on rival ground allowed */ } }
  else if (kind === 'hunt') { if (t.kind !== 'monster' && t.kind !== 'camp') return 'Nothing to hunt there.'; off = true; }
  else if (kind === 'encamp') {
    if (!(t.kind === 'wild' || t.kind === 'forest')) return 'Cannot encamp there.';
    if (t.owner === 0) return 'Your alliance already owns that tile.';
    if (t.owner != null || t.enc) { off = true; sub = 'flip'; }
  } else if (kind === 'throne') { if (t.kind !== 'throne') return 'Not the throne.'; off = true; }
  else if (kind === 'attack') { if (t.kind !== 'base' && t.kind !== 'throne') return 'Nothing to attack there.'; if (t.bot && t.bot.shieldUntil > Date.now()) return 'That base is shielded.'; off = true; }
  else if (kind === 'field') off = true;
  if (kind === 'throne' && S.throne.holder === 0) return 'Your alliance already holds the throne.';
  if (off) stripShield(kind === 'hunt' ? 'hunt' : 'offensive march');
  const col = {}; for (const c of CLS) if (comp[c]) Object.assign(col, takeClass(c, comp[c]));
  const m = mods(hero), st = colStats(col, m);
  let outMs, backMs;
  if (kind === 'field') { outMs = Math.max(4000, Math.round(3600 / st.speed * 1000)); backMs = Math.max(3000, Math.round(outMs * 0.6)); tx = S.base.x; ty = S.base.y; }
  else { const dist = Math.hypot(tx - S.base.x, ty - S.base.y), f = forestTiles(S.base.x, S.base.y, tx, ty); outMs = legMs(dist, st.speed, f); backMs = Math.max(3000, Math.round(outMs * 0.6)); }
  const mm = { id: S.nid++, kind, tx, ty, col, hero: !!hero, off, sub, phase: 'out', start: Date.now(), end: Date.now() + outMs, outMs, backMs, loot: { res: {}, bars: {}, gem: 0, shard: null, dia: 0 }, wound: {}, dead: {}, grade: opts.grade || 0 };
  S.marches.push(mm); return null;
}
function marchName(m) { return { gather: 'Gather', hunt: 'Hunt', encamp: 'Encamp', throne: 'Throne', attack: 'Strike', field: 'Field', rally: 'Rally', scout: 'Scout' }[m.kind] || m.kind; }
function rollGrade(L) { const w = []; let tot = 0; for (let d = 1; d <= L; d++) { const x = Math.pow(4, L - d); w.push(x); tot += x; } let r = Math.random() * tot; for (let d = 1; d <= L; d++) { r -= w[d - 1]; if (r <= 0) return d; } return 1; }
function addLootBar(m, g) { m.loot.bars[g] = (m.loot.bars[g] || 0) + 1; }
function rollShard(m, L) { if (Math.random() < Math.min(0.35, 0.04 * L)) m.loot.shard = pick(Object.keys(SETS)); }
function survivors(m) { return sumCol(m.col); }
function wipe(m, why) {
  S.marches = S.marches.filter(x => x !== m);
  if (m.hero) { S.hero.captured = true; note(HEROES[S.hero.id].n + ' is captured. Ransom is 2500 cash.', 'bad'); }
  note('Column lost ' + why + '. No report survived.', 'bad');
}
function absorb(m, res) { m.col = res.left; for (const k in res.wounded) m.wound[k] = (m.wound[k] || 0) + res.wounded[k]; for (const k in res.dead) m.dead[k] = (m.dead[k] || 0) + res.dead[k]; }
function startBack(m) { m.phase = 'back'; m.start = Date.now(); m.end = Date.now() + m.backMs; }
function fightMarch(m, D, title, opts) {
  opts = opts || {};
  const A = attackerSide(m.col, m.hero), before = Object.assign({}, m.col), r = fight(A, D);
  let fd = r.fd, obl = false;
  if (opts.citadel && r.Sa >= 3 * r.Sd) { fd = 1; obl = true; }
  const res = applyLoss(m.col, r.fa); const dres = D.units.length ? applyLoss(Object.fromEntries(D.units.map(u => [u.k, u.n])), fd) : { lost: {}, wounded: {} };
  absorb(m, res);
  const alive = survivors(m) > 0;
  if (!alive) return { r, wiped: true, D, dres };
  const rep = pushReport({
    title, win: r.win, obl, kind: 'battle',
    left: { name: 'You', rows: A.units.map(u => [tierName(u.c, u.t), before[u.k], (res.lost[u.k]) || 0, (res.wounded[u.k]) || 0]), boosts: boostRows(m.hero) },
    right: { name: opts.rightName || 'Defenders', rows: opts.rightRows || unitRows(D, dres), boosts: opts.rightBoosts || [['Force ratio', (1 / Math.max(r.q, 0.01)).toFixed(2)]] },
    joiners: opts.joiners || null
  });
  return { r, wiped: false, rep, D, dres, obl };
}
function arrive(m) {
  const t = tileInfo(m.tx, m.ty);
  if (m.kind === 'gather') {
    const nn = nodeAt(m.tx, m.ty), st = colStats(m.col); if (!nn) { note('The vein was gone. Column heads home.', 'warn'); return startBack(m); }
    const haul = Math.min(nn.stock, Math.floor(st.load)); m.haul = haul; m.hres = nn.res; m.fill = haul / Math.max(1, st.load);
    const sit = Math.max(3000, Math.round(8000 * m.fill / (1 + mods().gather))); m.phase = 'sit'; m.start = Date.now(); m.end = Date.now() + sit; return;
  }
  if (m.kind === 'hunt') {
    const camp = t.kind === 'camp', g = t.grade;
    if (t.kind !== 'monster' && !camp) { note('The pack is gone. Column heads home.', 'warn'); return startBack(m); }
    const D = mkSide({}, {}, 1, null, monsterSyn(g, camp));
    const fr = fightMarch(m, D, (camp ? 'Camp' : 'Monster pack') + ' grade ' + g + ' at ' + m.tx + ',' + m.ty, { rightName: camp ? 'Camp' : 'Pack', rightRows: [[camp ? 'Camp garrison' : 'Monster pack', '—', 0, 0]] });
    if (fr.r.win) {
      S.dead[key(m.tx, m.ty)] = 1; S.kills++; const vg = rollGrade(g), res = pick(RES.slice(0, 4));
      S.nodes[key(m.tx, m.ty)] = { res, nk: Object.keys(NODE_RES).find(k => NODE_RES[k] === res), grade: vg, stock: 600 * vg, max: 600 * vg, rich: true };
      addLootBar(m, rollGrade(g)); rollShard(m, g); if (Math.random() < 0.3) m.loot.dia += g * 2;
      for (const r of [pick(RES.slice(0, 4)), pick(RES)]) m.loot.res[r] = (m.loot.res[r] || 0) + Math.round(g * rnd(500, 1100));
      if (S.kills % 8 === 0) S.hero.rank++;
      if (fr.wiped) { S.marches = S.marches.filter(x => x !== m); if (m.hero) S.hero.captured = true; note('Pack dead, column gone. Rich vein left at ' + m.tx + ',' + m.ty + '.', 'warn'); return; }
      note('Pack dead at ' + m.tx + ',' + m.ty + '. A rich vein is open.', 'good');
    } else { if (fr.wiped) return wipe(m, 'on the hunt'); note('Hunt failed. Column falls back.', 'warn'); }
    return startBack(m);
  }
  if (m.kind === 'field') {
    const g = m.grade || 3, D = mkSide({}, {}, 1, null, monsterSyn(g, true)), fr = fightMarch(m, D, 'Field camp grade ' + g, { rightName: 'Camp', rightRows: [['Seeded camp', '—', 0, 0]] });
    if (fr.wiped) return wipe(m, 'in the field');
    if (fr.r.win) { for (const r of RES) m.loot.res[r] = Math.round(g * rnd(700, 1500)); if (Math.random() < 0.5) addLootBar(m, rollGrade(g)); note('Camp broken. Column walks home.', 'good'); } else note('Camp held. Column walks home.', 'warn');
    return startBack(m);
  }
  if (m.kind === 'encamp') {
    const owner = S.own[key(m.tx, m.ty)], enc = S.encs[key(m.tx, m.ty)]; let flip = false;
    if (owner === 0) { note('Your alliance took that tile first. Column heads home.', 'warn'); return startBack(m); }
    if (owner != null || (enc && enc.o !== 0)) {
      const bot = S.bots.find(b => b.al === (owner != null ? owner : enc.o)), D = mkSide({}, {}, 1, null, botSyn(bot, 0.12));
      const fr = fightMarch(m, D, 'Tile ' + m.tx + ',' + m.ty + ' vs ' + bot.n, { rightName: bot.tag, rightRows: [[bot.n + ' detachment', '—', 0, 0]] });
      if (fr.wiped) return wipe(m, 'at ' + m.tx + ',' + m.ty);
      if (!fr.r.win) { note('Tile hit failed. Their clock keeps running.', 'warn'); return startBack(m); }
      if (enc) { delete S.encs[key(m.tx, m.ty)]; note('Their encampment progress is wiped.', 'good'); }
      flip = owner != null;
    }
    const d = occDurMs(colStats(m.col).power, flip); m.flip = flip; m.phase = 'hold'; m.start = Date.now(); m.end = Date.now() + d; m.holdKind = 'tile';
    S.encs[key(m.tx, m.ty)] = { o: 0, start: m.start, end: m.end, mid: m.id }; terrDirty = true; return;
  }
  if (m.kind === 'throne' || (m.kind === 'attack' && t.kind === 'throne')) {
    const th = S.throne; let D, title, rn;
    if (th.holder != null && th.holder !== 0) { const bot = S.bots.find(b => b.al === th.holder); D = mkSide({}, {}, 1, null, botSyn(bot, 0.6)); title = 'Throne vs ' + bot.n; rn = bot.tag; }
    else if (th.neutral) { D = citadelSide(); title = 'Citadel garrison'; rn = 'Citadel'; }
    else D = mkSide({}, {}, 1, null, synDef(1, 1));
    const fr = fightMarch(m, D, title || 'Throne', { rightName: rn || 'Throne', citadel: true });
    if (fr.wiped) return wipe(m, 'at the citadel');
    if (!fr.r.win) { note('The citadel held. Column falls back.', 'warn'); return startBack(m); }
    th.neutral = false; if (th.holder != null && th.holder !== 0) { th.ruler = null; th.ruleUntil = 0; th.officers = []; S.titles = {}; }
    th.holder = 0; th.holdEnd = Date.now() + 21600 / OCC * 1000; th.ruler = null; th.colMarch = m.id;
    m.kind = 'throne'; m.phase = 'hold'; m.start = Date.now(); m.end = th.holdEnd; m.holdKind = 'throne'; note('Column is in the throne. Hold six hours to rule.', 'good'); return;
  }
  if (m.kind === 'attack') {
    const bot = t.bot, D = mkSide({}, {}, 1, null, botSyn(bot, 1)), fr = fightMarch(m, D, 'Strike on ' + bot.tag + ' ' + bot.cmd, { rightName: bot.tag + ' ' + bot.cmd, rightRows: [['Garrison', '—', 0, 0]] });
    if (fr.wiped) return wipe(m, 'at ' + bot.tag);
    if (fr.r.win) { bot.shieldUntil = Date.now() + 90000; const st = colStats(m.col); let cap = st.load; for (const r of RES.slice(0, 4)) { const a = Math.min(cap / 4, Math.round(bot.p * rnd(2500, 4500))); m.loot.res[r] = a; } note('Base struck. Loot rides home.', 'good'); } else note('Strike failed. Column falls back.', 'warn');
    return startBack(m);
  }
  if (m.kind === 'rally') return arriveRally(m, t);
  startBack(m);
}
function landMarch(m) {
  S.marches = S.marches.filter(x => x !== m);
  for (const k in m.col) S.troops[k] = (S.troops[k] || 0) + m.col[k];
  let over = 0; const beds = bedCap(); let free = Math.max(0, beds - woundedTotal());
  for (const k in m.wound) { const a = Math.min(free, m.wound[k]); if (a > 0) { S.wounded[k] = (S.wounded[k] || 0) + a; free -= a; } over += m.wound[k] - a; }
  const got = []; for (const r in m.loot.res) { const a = addRes(r, m.loot.res[r]); if (a > 0) got.push(fmtN(a) + ' ' + RESN[r]); }
  for (const g in m.loot.bars) { S.bars[g] = (S.bars[g] || 0) + m.loot.bars[g]; got.push(m.loot.bars[g] + ' grade-' + g + ' bar'); }
  if (m.loot.gem) { S.gems += m.loot.gem; got.push('a gem'); }
  if (m.loot.shard) { S.shards[m.loot.shard] = (S.shards[m.loot.shard] || 0) + 1; got.push(SETS[m.loot.shard].n + ' shard'); }
  if (m.loot.dia) { dchg(m.loot.dia, 'Loot'); got.push(m.loot.dia + ' diamonds'); }
  note(marchName(m) + ' column is home' + (got.length ? ': ' + got.join(', ') : '') + (over ? '. ' + over + ' wounded died, beds full' : '') + '.', 'good');
}
function stepMarch(m) {
  const now = Date.now(); if (now < m.end) return;
  if (m.phase === 'wait') { m.phase = 'out'; m.start = now; m.end = now + m.outMs; launchRallyJoiners(m); return; }
  if (m.phase === 'out') return arrive(m);
  if (m.phase === 'sit') {
    const nn = nodeAt(m.tx, m.ty), k = key(m.tx, m.ty);
    if (nn) {
      const h = Math.min(nn.stock, m.haul); nn.stock -= h; m.loot.res[nn.res] = (m.loot.res[nn.res] || 0) + h; S.nodes[k] = nn;
      if (nn.stock <= 0) {
        const L = nn.grade, drain = Math.min(1, h / nn.max * (nn.rich ? 1 : 1));
        if (Math.random() < (0.33 + (0.73 - 0.33) * (L - 1) / 5) * drain) addLootBar(m, rollGrade(L));
        if (Math.random() < Math.min(0.2, 0.02 * L) * drain) m.loot.gem++;
        if (nn.rich) { delete S.nodes[k]; S.dead[k] = 1; } else nn.emptyUntil = Date.now() + 90000;
      }
    }
    return startBack(m);
  }
  if (m.phase === 'hold') {
    if (m.holdKind === 'tile') {
      const k = key(m.tx, m.ty); S.own[k] = 0; delete S.encs[k]; terrDirty = true; S.score += m.flip ? 25 : 10; m.phase = 'stay'; m.end = FOREVER;
      note('Tile ' + m.tx + ',' + m.ty + ' is yours (+' + (m.flip ? 25 : 10) + '). Column stays on station.', 'good'); return;
    }
    if (m.holdKind === 'throne') { m.end = FOREVER; m.phase = 'stay'; return; }
  }
  if (m.phase === 'back') return landMarch(m);
}
function recall(id) {
  const m = S.marches.find(x => x.id === id); if (!m) return 'No such column.';
  if (m.phase === 'back') return 'Already walking home.'; if (m.kind === 'rally') { if (m.phase !== 'wait') return 'A launched column cannot be recalled.'; return cancelRally(m); }
  const now = Date.now(); let back = m.backMs;
  if (m.phase === 'out') { const f = clamp((now - m.start) / m.outMs, 0, 1); back = Math.max(3000, Math.round(m.backMs * f)); m.loot = { res: {}, bars: {}, gem: 0, shard: null, dia: 0 }; }
  if (m.phase === 'sit') { m.loot = { res: {}, bars: {}, gem: 0, shard: null, dia: 0 }; }
  if (m.holdKind === 'tile' && m.phase === 'hold') { const e = S.encs[key(m.tx, m.ty)]; if (e && e.mid === m.id) delete S.encs[key(m.tx, m.ty)]; terrDirty = true; }
  if (m.holdKind === 'throne') { if (S.throne.holder === 0) { S.throne.holder = null; S.throne.holdEnd = 0; } S.throne.colMarch = 0; if (S.throne.ruler === 0) endRule('Column left the throne'); }
  m.phase = 'back'; m.start = now; m.end = now + back; return null;
}
function endRule(why) { const th = S.throne; th.ruler = null; th.ruleUntil = 0; th.officers = []; S.titles = {}; if (th.holder === 0) { th.holder = null; th.holdEnd = 0; } note((why || 'Reign over') + '. Officers and titles clear.', 'warn'); }
function ransom(useSeal) {
  if (!S.hero.captured) return 'No one to ransom.';
  if (useSeal) { if (S.seals < 1) return 'No seals in the rack.'; S.seals--; } else { if (S.res.cash < 2500) return 'Short of cash. Ransom is 2500.'; S.res.cash -= 2500; }
  S.hero.captured = false; note(HEROES[S.hero.id].n + ' is back.', 'good'); return null;
}

/* ---------------- rallies ---------------- */
function rallyCap() { return 4000 * lvlMax('hall'); }
function createRally(target, comp, hero, waitSec, extraSlots) {
  if (!hasB('hall')) return 'Build a Hall of War.';
  if (S.orders < 1) return 'No operational orders left.';
  const tot = compTotal(comp); if (tot > rallyCap()) return 'Hall of War commands ' + fmtN(rallyCap()) + ' at most.';
  if (tot <= 0) return 'Empty column is not a march.';
  if (tot > headcount()) return 'Column is over the headcount of ' + fmtN(headcount()) + '.';
  for (const c of CLS) if ((comp[c] || 0) > clsAvail(c)) return 'Not enough ' + CLSD[c].n.toLowerCase() + ' in garrison.';
  if (S.marches.filter(m => m.kind !== 'scout').length >= marchQueues()) return 'All march queues are out.';
  if (hero) { if (S.hero.captured) return 'The hero is captured.'; if (heroLocked()) return 'The hero is already out.'; }
  if (extraSlots > S.tokens) return 'Short of Tactical Coordination Tokens.';
  let tx, ty, bot = null;
  if (target === 'citadel') { if (S.throne.holder === 0) return 'Your alliance already holds the throne.'; tx = TX; ty = TY; } else { bot = S.bots.find(b => b.al === +target); if (!bot) return 'Pick a target.'; if (bot.shieldUntil > Date.now()) return 'That base is shielded.'; tx = bot.x; ty = bot.y; }
  S.orders--; S.tokens -= extraSlots; stripShield('rally');
  const col = {}; for (const c of CLS) if (comp[c]) Object.assign(col, takeClass(c, comp[c]));
  const st = colStats(col, mods(hero)), dist = Math.hypot(tx - S.base.x, ty - S.base.y), f = forestTiles(S.base.x, S.base.y, tx, ty);
  const outMs = legMs(dist, st.speed, f), now = Date.now(), wMs = Math.max(5000, waitSec / OCC * 1000);
  const slots = 6 + extraSlots, joiners = [];
  const per = Math.floor(Math.max(0, rallyCap() - tot) / Math.max(1, slots));
  for (let i = 0; i < slots; i++) { const n = Math.min(per, rint(300, 700 + lvlMax('hall') * 60)); if (n < 50) continue; const cls = pick(['inf', 'arm', 'air']), jc = {}; jc[cls + 2] = Math.round(n * 0.7); jc[pick(['inf', 'arm', 'air']) + 1] = Math.round(n * 0.3); joiners.push({ name: S.roster[i % S.roster.length] + (i >= 7 ? ' II' : ''), col: jc, at: now + Math.round(wMs * rnd(0.1, 0.9)), in: false }); }
  const m = { id: S.nid++, kind: 'rally', tx, ty, col, hero: !!hero, off: true, phase: 'wait', start: now, end: now + wMs, outMs, backMs: Math.max(3000, Math.round(outMs * 0.6)), loot: { res: {}, bars: {}, gem: 0, shard: null, dia: 0 }, wound: {}, dead: {}, joiners, target, tname: bot ? bot.tag + ' ' + bot.cmd : 'Citadel', jl: [] };
  S.marches.push(m); note('Rally is up against ' + m.tname + '.', 'info'); return null;
}
function launchRallyJoiners(m) { m.jl = m.joiners.slice(); }
function cancelRally(m) { S.marches = S.marches.filter(x => x !== m); for (const k in m.col) S.troops[k] = (S.troops[k] || 0) + m.col[k]; note('Rally cancelled. Everyone is home.', 'info'); return null; }
function arriveRally(m, t) {
  let D, rn; const isC = t.kind === 'throne' || m.target === 'citadel';
  const joinCol = {}; for (const j of m.jl) for (const k in j.col) joinCol[k] = (joinCol[k] || 0) + j.col[k];
  const total = Object.assign({}, m.col); for (const k in joinCol) total[k] = (total[k] || 0) + joinCol[k];
  const bot = isC ? null : S.bots.find(b => b.al === +m.target);
  if (isC) { const th = S.throne; if (th.holder != null && th.holder !== 0) { const b = S.bots.find(x => x.al === th.holder); D = mkSide({}, {}, 1, null, botSyn(b, 0.6)); rn = b.tag; } else D = citadelSide(); rn = rn || 'Citadel'; }
  else { D = mkSide({}, {}, 1, null, botSyn(bot, 1)); rn = bot.tag + ' ' + bot.cmd; }
  const mm = mods(m.hero); const noHero = !m.hero;
  const atkM = {}; for (const c of CLS) atkM[c] = noHero ? mm.atk[c] / (1 + mm.marchAtk) : mm.atk[c];
  const A = Object.assign(mkSide(total, atkM, mm.hp), { plating: rv('plating') }), r = fight(A, D);
  let fd = r.fd, obl = false; if (isC && r.Sa >= 3 * r.Sd) { fd = 1; obl = true; }
  const res = applyLoss(total, r.fa), before = total;
  // split casualties: leader and joiners take the same fraction
  const own = applyLoss(m.col, r.fa); absorb(m, own);
  const jrows = m.jl.map(j => { const jr = applyLoss(j.col, r.fa); const s = sumCol(j.col), l = sumCol(jr.lost); return { name: j.name, sent: s, lost: l, wounded: sumCol(jr.wounded) }; });
  if (!survivors(m)) { S.marches = S.marches.filter(x => x !== m); if (m.hero) { S.hero.captured = true; note(HEROES[S.hero.id].n + ' is captured. Ransom is 2500 cash.', 'bad'); } note('Rally column is gone. No report survived.', 'bad'); return; }
  pushReport({ title: 'Rally on ' + rn, win: r.win, obl, kind: 'rally', left: { name: 'You + ' + m.jl.length + ' joiners', rows: A.units.map(u => [tierName(u.c, u.t), before[u.k], res.lost[u.k] || 0, res.wounded[u.k] || 0]), boosts: m.hero ? boostRows(true) : [['Hero', 'none: no hero, gear, gem or rank bonus']] }, right: { name: rn, rows: [['Defenders', '—', 0, 0]], boosts: [['Force ratio', (1 / Math.max(r.q, 0.01)).toFixed(2)]] }, joiners: jrows });
  if (r.win) {
    if (isC) { const th = S.throne; th.neutral = false; if (th.holder != null && th.holder !== 0) { th.ruler = null; th.ruleUntil = 0; th.officers = []; S.titles = {}; } th.holder = 0; th.holdEnd = Date.now() + 21600 / OCC * 1000; th.colMarch = m.id; m.kind = 'throne'; m.phase = 'hold'; m.start = Date.now(); m.end = th.holdEnd; m.holdKind = 'throne'; note('Rally took the throne. Hold six hours.', 'good'); return; }
    bot.shieldUntil = Date.now() + 90000; for (const r2 of RES.slice(0, 4)) m.loot.res[r2] = Math.min(colStats(m.col).load / 4, Math.round(bot.p * rnd(3500, 6000)));
    note('Rally won. Survivors walk home.', 'good');
  } else note('Rally failed. Survivors walk home.', 'warn');
  startBack(m);
}

/* ---------------- scouting ---------------- */
function scoutTarget(x, y) {
  const now = Date.now(); S.scoutStamps = S.scoutStamps.filter(t => now - t < 250); S.scoutStamps.push(now);
  if (S.scoutStamps.length > 4) { if (S.scoutStamps.length === 5) note('Scout packets stutter. Wait a beat.', 'warn'); return null; }
  const t = tileInfo(x, y), depth = R('recon'); let title, rows, boosts = [];
  if (t.kind === 'base') {
    const b = t.bot; title = 'Scout: ' + b.tag + ' ' + b.cmd;
    if (b.p >= 4 && depth < b.p) { pushReport({ title, kind: 'scout', win: null, left: { name: 'You', rows: [], boosts: [] }, right: { name: b.tag, rows: [['Blocked', 'their radar caught the packet', 0, 0]], boosts: [] } }); return null; }
    rows = scoutRows(botSyn(b, 1), depth, b.p);
    if (depth >= 10) boosts.push(['Hero', b.cmd + ' r' + (b.p + 2)]);
  } else if (t.kind === 'throne') { title = 'Scout: Citadel'; const c = citadelSide(); rows = depth >= 1 ? c.units.map(u => [tierName(u.c, u.t), u.n, 0, 0]) : [['Contact', 'unreadable', 0, 0]]; if (S.throne.holder != null && S.throne.holder !== 0) { rows = scoutRows(botSyn(S.bots.find(b => b.al === S.throne.holder), .6), depth, 3); title = 'Scout: Citadel (held)'; } }
  else return 'Nothing to scout there.';
  pushReport({ title, kind: 'scout', win: null, left: { name: 'You', rows: [['Scout packet', 1, 0, 0]], boosts: [['Scan depth', String(depth)]] }, right: { name: 'Target', rows, boosts } });
  note(title + ' filed.', 'info'); return null;
}
function scoutRows(syn, depth, p) {
  const n = Math.round(syn.H / 120); if (depth < 3) return [['Force', n < 300 ? 'light' : n < 900 ? 'medium' : 'heavy', 0, 0]];
  if (depth < 6) return CLS.map(c => [CLSD[c].n, Math.round(n / 4), 0, 0]);
  return CLS.map(c => [tierName(c, Math.min(4, 1 + Math.floor(p / 2))), Math.round(n / 4), 0, 0]);
}

/* ---------------- teleport ---------------- */
function tpKind(x, y) {
  if (heroLocked()) return { err: 'A hero is out. The base is locked.' };
  if (!legalSpot(x, y)) return { err: 'Not a legal landing.' };
  const o = S.own[key(x, y)]; return { kind: o === 0 ? 'alliance' : o != null ? 'advanced' : 'plain', o };
}
function doTeleport(x, y) {
  const k = tpKind(x, y); if (k.err) return k.err;
  const old = key(S.base.x, S.base.y), oldForest = inForest(), incs = S.incoming.slice();
  for (const inc of incs) { if (shieldOn()) { S.incoming = S.incoming.filter(i => i !== inc); S.shield.until = 0; note('The shield ate the hit from ' + inc.name + '.', 'good'); } else hitBase(inc, true); }
  if (k.kind === 'advanced') S.own[old] = k.o;
  S.base = { x, y }; S.view = { x, y }; terrDirty = true;
  if (terrainAt(x, y) === 'forest') stripShield('forest teleport');
  note((k.kind === 'alliance' ? 'Alliance teleport' : k.kind === 'advanced' ? 'Advanced teleport' : 'Teleport') + ' complete.', 'good'); return null;
}
function randomTeleport() {
  const cand = []; for (const k in S.own) { const o = S.own[k]; if (o === 0) continue; const [x, y] = unkey(k); if (!legalSpot(x, y)) continue; let n = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (S.own[key(x + dx, y + dy)] === o) n++; cand.push([n, x, y]); }
  cand.sort((a, b) => a[0] - b[0]); if (cand.length) { const best = cand.filter(c => c[0] === cand[0][0]); const c = pick(best); return doTeleport(c[1], c[2]); }
  for (let i = 0; i < 500; i++) { const x = rint(20, W - 20), y = rint(20, H - 20); if (legalSpot(x, y)) return doTeleport(x, y); } return 'No landing found.';
}
function disband() { for (const k in S.own) if (S.own[k] === 0) delete S.own[k]; for (const k in S.encs) if (S.encs[k].o === 0) delete S.encs[k]; terrDirty = true; note('Alliance disbanded. Every colored tile returns to neutral.', 'warn'); }

/* ---------------- threats and bots ---------------- */
function launchHostile() {
  const bot = pick(S.bots), d = playerDefSide(); let Sd = 0, Hd = 0;
  const Dd = fight(Object.assign(mkSide({ inf1: 100 }, {}, 1)), d); Sd = Dd.Sd; Hd = Dd.Hd;
  const rally = Math.random() < 0.3, r = rnd(0.3, 1.3) * (rally ? 1.6 : 1), k = Math.sqrt(r), Sa = Math.max(600, Sd * k), Ha = Math.max(6000, Hd * k);
  const inc = { id: S.nid++, bot: bot.al, name: bot.tag + ' ' + bot.cmd, rally, start: Date.now(), end: Date.now() + rint(25000, 42000) + (rally ? 15000 : 0), S: Sa, H: Ha, n: Math.round(Ha / 110) };
  S.incoming.push(inc); UIH.flash(rally ? 'rally' : 'attack'); note((rally ? 'Rally inbound: ' : 'Hostile contact: ') + inc.name + ' is marching on you.', 'bad');
}
function hitBase(inc, instant) {
  S.incoming = S.incoming.filter(i => i !== inc);
  if (shieldOn()) { note('Shield holds against ' + inc.name + '.', 'good'); return; }
  const D = playerDefSide(), A = Object.assign(mkSide({}, {}, 1, null, synDef(inc.S, inc.H)), { plating: 0 });
  const before = Object.assign({}, S.troops), wallBefore = Object.assign({}, S.wall), r = fight(A, D);
  const fdef = r.win ? r.fd : r.fd; // defender loss fraction
  const tres = applyLoss(before, fdef), lostAll = { lost: tres.lost, wounded: tres.wounded };
  S.troops = tres.left; let over = 0; let free = Math.max(0, bedCap() - woundedTotal());
  for (const k in tres.wounded) { const a = Math.min(free, tres.wounded[k]); if (a > 0) { S.wounded[k] = (S.wounded[k] || 0) + a; free -= a; } over += tres.wounded[k] - a; }
  const wl = applyLoss(wallBefore, fdef * 0.8), rec = 0.5 + rv('repair'); const nw = {};
  for (const k in wallBefore) { const l = wl.lost[k] || 0, back = Math.round(l * Math.min(0.95, rec)); nw[k] = wallBefore[k] - l + back; if (!nw[k]) delete nw[k]; }
  S.wall = nw;
  let stolen = [];
  if (r.win) { const fl = protectedFloor(), retain = 1 - Math.min(0.9, rv('repair')); for (const rr of RES.slice(0, 4)) { const un = Math.max(0, S.res[rr] - fl), t = Math.floor(un * 0.08 * retain); S.res[rr] -= t; if (t) stolen.push(fmtN(t) + ' ' + RESN[rr]); } }
  const emptied = sumCol(S.troops) === 0 && sumCol(S.wall) === 0;
  let capt = false; if (emptied && r.win && heroOn() && !heroLocked()) { S.hero.captured = true; capt = true; }
  pushReport({ title: (r.win ? 'Base hit by ' : 'Repelled ') + inc.name, win: !r.win, kind: 'defense', left: { name: 'You', rows: Object.keys(before).map(k => [ckName(k), before[k], (tres.lost[k]) || 0, (tres.wounded[k]) || 0]).concat(Object.keys(wallBefore).map(k => [ckName(k) + ' (wall)', wallBefore[k], (wl.lost[k]) || 0, 0])), boosts: [['Wall HP', fmtN(D.wall.hp)], ['Wall attack', fmtN(D.wall.atk)], ['Shield', 'down']] }, right: { name: inc.name, rows: [['Hostile column', inc.n, 0, 0]], boosts: [['Force ratio', r.q.toFixed(2)]] } });
  note(r.win ? 'Base hit by ' + inc.name + (stolen.length ? '. Raided: ' + stolen.join(', ') : '') + (capt ? '. ' + HEROES[S.hero.id].n + ' captured' : '') + '.' : 'Repelled ' + inc.name + '.', r.win ? 'bad' : 'good');
  if (inForest() && !instant) { for (let i = 0; i < 400; i++) { const x = rint(20, W - 20), y = rint(20, H - 20); if (terrainAt(x, y) === 'wild' && legalSpot(x, y)) { S.base = { x, y }; S.view = { x, y }; note('Thrown from the forest to ' + x + ',' + y + '.', 'warn'); break; } } }
}
function botScout() {
  const bot = pick(S.bots), blocked = S.anti && lvlMax('radar') >= 4; UIH.flash('scout');
  const rows = blocked ? [['Blocked', 'no garrison data', 0, 0]] : [['Garrison read', sumCol(S.troops) + ' troops', 0, 0]];
  pushReport({ title: (blocked ? 'Scout blocked: ' : 'Scout read you: ') + bot.tag + ' ' + bot.cmd, kind: 'scout', win: null, left: { name: 'You', rows: [], boosts: [['From', bot.tag + ' ' + bot.cmd + ' at ' + bot.x + ',' + bot.y], ['To', S.base.x + ',' + S.base.y]] }, right: { name: bot.tag, rows, boosts: blocked ? [] : [] } });
  note((blocked ? 'Blocked a scout from ' : 'Scout from ') + bot.tag + ' ' + bot.cmd + (blocked ? ' at ' + bot.x + ',' + bot.y + ' to ' + S.base.x + ',' + S.base.y : ' read your garrison') + '.', blocked ? 'good' : 'warn');
}
function botExpand() {
  const b = pick(S.bots), tiles = []; for (const k in S.own) if (S.own[k] === b.al) tiles.push(k);
  if (tiles.length > 380) return; for (let i = 0; i < 6; i++) { const [x, y] = unkey(pick(tiles)), [dx, dy] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]), nx = x + dx, ny = y + dy, k = key(nx, ny); if (S.own[k] != null || S.encs[k] || !legalSpot(nx, ny) || isPBase(nx, ny)) continue; S.encs[k] = { o: b.al, start: Date.now(), end: Date.now() + rint(35000, 70000) }; return; }
}
function thronePower() {
  const th = S.throne, now = Date.now();
  if (th.holder != null && th.ruler == null && th.holdEnd && now >= th.holdEnd) { th.ruler = th.holder; th.ruleUntil = now + 259200 / OCC * 1000; if (th.holder === 0) { note('Your alliance rules. You are R5. Appoint two R4 officers in the Vault.', 'good'); S.score += 100; } else note(alName(th.holder) + ' now rules the kingdom.', 'warn'); }
  if (th.ruler != null && now >= th.ruleUntil) { const wasMe = th.ruler === 0; if (wasMe) { const m = S.marches.find(x => x.id === th.colMarch); endRule('Your reign is over'); if (m) { m.phase = 'stay'; recallThrone(m); } } else { th.ruler = null; th.ruleUntil = 0; th.holder = null; th.holdEnd = 0; note('The reign of ' + 'a rival alliance is over.', 'info'); } }
  if (now > S.next.throne && th.holder == null && th.ruler == null) { S.next.throne = now + 400000; const b = pick(S.bots); th.neutral = false; th.holder = b.al; th.holdEnd = now + 21600 / OCC * 1000; note(b.n + ' has garrisoned the throne.', 'warn'); }
}
function recallThrone(m) { m.phase = 'back'; m.start = Date.now(); m.end = Date.now() + m.backMs; m.kind = 'attack'; m.holdKind = null; }
function grantTitle(name, id) {
  const th = S.throne; if (th.ruler !== 0) return 'Only the ruling king may grant titles.';
  if (id && !TITLES[id]) return 'Unknown title.'; if (!id) delete S.titles[name]; else S.titles[name === 'You' ? 'you' : name] = id; return null;
}
function appoint(name) {
  const th = S.throne; if (th.ruler !== 0) return 'Only the ruling king appoints officers.';
  const i = th.officers.indexOf(name); if (i >= 0) { th.officers.splice(i, 1); return null; }
  if (th.officers.length >= 2) return 'Two R4 officers only.'; th.officers.push(name); return null;
}
function recolor(c) { if (S.throne.ruler !== 0) return 'Only the ruling king can recolor the alliance.'; S.al[0].color = c; terrDirty = true; return null; }

/* ---------------- market, forge, daily ---------------- */
function dayStamp() { const d = new Date(); return d.getFullYear() * 1000 + d.getMonth() * 40 + d.getDate(); }
function rollMarket(force) {
  const ds = dayStamp(); if (S.market.day === ds && !force) return;
  const pool = MARKET_CAT.slice(), o = []; for (let i = 0; i < 3; i++) { const j = Math.floor(Math.random() * pool.length); o.push({ id: pool[j].id, sold: false }); pool.splice(j, 1); }
  S.market = { day: ds, offers: o };
}
function buyMarket(i) {
  const o = S.market.offers[i]; if (!o || o.sold) return 'Sold.'; if (!hasB('market')) return 'Build a Black Market.';
  const it = MARKET_CAT.find(x => x.id === o.id); if (S.dia < it.cost) return 'Short of diamonds.';
  dchg(-it.cost, 'Black Market: ' + it.n); grant(it.give); o.sold = true; return null;
}
function grant(g) { for (const k in g) { if (RES.includes(k)) addRes(k, g[k]); else if (k === 'tokens') S.tokens += g[k]; else if (S.slips[k] != null) S.slips[k] += g[k]; else if (k === 'dia') dchg(g[k], 'Grant'); else if (k === 'bars') for (const gg in g[k]) S.bars[gg] = (S.bars[gg] || 0) + g[k][gg]; else if (k === 'shard') S.shards[g[k]]++; } }
function buyPack(id) {
  const p = DIA_PACKS.find(x => x.id === id); if (S.dia < p.cost) return 'Short of diamonds.'; dchg(-p.cost, p.n);
  const g = { drop: { rations: 12000, fuel: 9000, power: 9000 }, field: { rations: 30000, fuel: 24000, power: 24000, alloy: 16000, cash: 8000, s60: 2 }, chest: { rations: 70000, fuel: 60000, power: 60000, alloy: 40000, cash: 20000, s60: 3, s480: 1, tokens: 3, bars: { 2: 4, 3: 2 } }, reserve: { rations: 160000, fuel: 140000, power: 140000, alloy: 100000, cash: 60000, s480: 4, s60: 6, tokens: 6, bars: { 3: 4, 4: 2 }, shard: 'vanguard' } }[id];
  grant(g); note(p.n + ' opened.', 'good'); return null;
}
function buySlip(id) { const s = SLIPS.find(x => x.id === id); if (S.dia < s.cost) return 'Short of diamonds.'; dchg(-s.cost, s.n); S.slips[id] += s.q; return null; }
function buyRes(r, n) { const c = n; if (S.dia < c) return 'Short of diamonds.'; if (S.res[r] >= storeCap()) return 'StoreHouse is full.'; dchg(-c, 'Crate: ' + RESN[r]); addRes(r, c * DIA_RATE[r]); return null; }
function buyBuilder() { if (S.builders >= 2) return 'Second builder already hired.'; if (S.dia < 220) return 'Short of diamonds.'; dchg(-220, 'Second builder'); S.builders = 2; return null; }
function buyOrders() { if (S.dia < 80) return 'Short of diamonds.'; dchg(-80, 'Operational orders x5'); S.orders += 5; return null; }
function buySeals() { if (S.dia < 60) return 'Short of diamonds.'; dchg(-60, 'Restraint seals x5'); S.seals += 5; return null; }
function buyToken(crate) { const c = crate ? 260 : 100; if (S.dia < c) return 'Short of diamonds.'; dchg(-c, crate ? 'Coordination Crate' : 'Coordination token'); S.tokens += crate ? 3 : 1; return null; }
function daily() { const d = new Date().toDateString(); if (S.daily === d) return 'Exercise already run today.'; S.daily = d; S.tokens++; dchg(60, 'Daily exercise'); note('Daily exercise done: 1 token, 60 diamonds.', 'good'); return null; }
function gradeUnits() { let u = 0; for (let g = 1; g <= 6; g++) u += (S.bars[g] || 0) * Math.pow(4, g - 1); return u; }
function refine(g) { if (g >= 6) return 'Grade 6 is the top.'; if ((S.bars[g] || 0) < 4) return 'Four bars of grade ' + g + ' needed.'; S.bars[g] -= 4; S.bars[g + 1] = (S.bars[g + 1] || 0) + 1; return null; }
function craft(slot, sel, shard, stat) {
  const tot = sumCol(sel); if (tot !== 4) return 'A craft spends exactly four bars.';
  for (const g in sel) if ((S.bars[g] || 0) < sel[g]) return 'Not enough grade ' + g + ' bars.';
  if (slot === 'accessory' && !stat) return 'Stamp Training or Yield.';
  if (shard && !(S.shards[shard] > 0)) return 'No such shard.';
  for (const g in sel) S.bars[g] -= sel[g]; if (shard) S.shards[shard]--;
  let tw = 0; const ws = []; for (const g in sel) { const w = sel[g] * sel[g]; ws.push([+g, w]); tw += w; }
  let r = Math.random() * tw, grade = ws[0][0]; for (const [g, w] of ws) { r -= w; if (r <= 0) { grade = g; break; } }
  const p = { id: S.nid++, slot, grade, set: shard || null, stat: slot === 'accessory' ? stat : null }; S.gear.pieces.push(p); note('Forged ' + slot + ' grade ' + grade + '.', 'good'); return null;
}
function wear(id) { const p = S.gear.pieces.find(x => x.id === id); if (!p) return 'No such piece.'; S.gear.worn[p.slot] = id; return null; }
function rack(id) { const p = S.gear.pieces.find(x => x.id === id); if (!p) return 'No such piece.'; if (S.gear.worn[p.slot] === id) delete S.gear.worn[p.slot]; return null; }
function pieceText(p) { const pc = (piecePct(p.slot, p.grade) * 100).toFixed(1).replace(/\.0$/, ''); return p.slot === 'accessory' ? '+' + pc + '% ' + (p.stat === 'training' ? 'training speed' : 'yield') : '+' + pc + '% ' + SLOT_WHAT[p.slot]; }
function setHero(id) { if (heroLocked()) return 'The hero is out.'; if (S.hero.captured) return 'The hero is captured.'; S.hero.id = id; return null; }

/* ---------------- tick ---------------- */
function tick() {
  const now = Date.now(); let dt = S.last2 ? Math.min(5, (now - S.last2) / 1000) : 0.25; S.last2 = now; let ch = false;
  produce(dt);
  for (const j of S.jobs.slice()) {
    if (j.ask && j.helps < helpCap() && now >= j.nextHelp) { j.end -= Math.max(1000, j.dur * 0.01); j.helps++; j.nextHelp = now + 1100; ch = true; }
    if (now >= j.end) { S.jobs = S.jobs.filter(x => x !== j); finishJob(j); ch = true; }
  }
  for (const m of S.marches.slice()) {
    if (m.kind === 'rally' && m.phase === 'wait') { for (const j of m.joiners) if (!j.in && now >= j.at) { j.in = true; ch = true; } }
    if (now >= m.end) { stepMarch(m); ch = true; }
  }
  for (const inc of S.incoming.slice()) if (now >= inc.end) { hitBase(inc); ch = true; }
  for (const k in S.encs) { const e = S.encs[k]; if (e.o !== 0 && now >= e.end) { const cur = S.own[k]; if (cur == null || cur === e.o) S.own[k] = e.o; delete S.encs[k]; terrDirty = true; ch = true; } }
  if (now > S.next.expand) { S.next.expand = now + rint(9000, 16000); botExpand(); ch = true; }
  if (now > S.next.atk) { S.next.atk = now + rint(110000, 200000); launchHostile(); ch = true; }
  if (now > S.next.scout) { S.next.scout = now + rint(70000, 150000); botScout(); ch = true; }
  if (now > S.next.orders) { S.next.orders = now + 120000; if (S.orders < lvlMax('hall')) { S.orders++; ch = true; } if (S.seals < lvlMax('prison')) S.seals++; }
  thronePower();
  if (S.shield.until && now >= S.shield.until) { S.shield.until = 0; note('Peace shield expired.', 'info'); ch = true; }
  for (const b of S.bots) if (b.shieldUntil && now > b.shieldUntil) b.shieldUntil = 0;
  if (ch) UIH.dirty();
}
