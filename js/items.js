'use strict';
/* IRON MARCH — Items: the Special and Speed Up store tabs, the item bag and what each item does. Catalog: ITEMS in js/data.js. Spec: docs/ITEMS.md.
   Diamond items are bought into the bag (S.itm) and used from it. VIP point items are real money only (sandbox in the demo) and go through js/iap.js. */
IAP_CATALOG.push(...ITEMS.filter(i => i.vip).map(i => ({ id: 'com.ironmarch.vip.' + i.vip, group: 'vip', n: i.n, usd: i.usd, itm: i.id })));
const iapOfItem = id => IAP_CATALOG.find(p => p.itm === id);
const itemDef = id => ITEMS.find(i => i.id === id);
/* new saves and old saves alike start with a small stock so teleports and one respec work out of the box */
function itmEnsure() { if (!S.itm) S.itm = { tp_rand: 2, tp_adv: 1, sk_reset: 1 }; if (!S.buf) S.buf = {}; return S.itm; }
const itmQty = id => itmEnsure()[id] || 0;
function itmTake(id) { const b = itmEnsure(); if ((b[id] || 0) < 1) return false; b[id]--; if (!b[id]) delete b[id]; return true; }
const bkCap = () => ITEM_BK.base + ITEM_BK.per * ((S.bkPlus || 0));
function itmBuy(id) {
  const it = itemDef(id); if (!it || it.usd) return 'Not for sale here.'; if (S.dia < it.cost) return 'Short of diamonds.';
  dchg(-it.cost, it.n); const b = itmEnsure(); b[id] = (b[id] || 0) + 1; return null;
}
function bufLeftMs(k) { const b = S.buf && S.buf[k]; return b && b.until > Date.now() ? b.until - Date.now() : 0; }
function itmBuff(it) {
  itmEnsure(); const cur = S.buf[it.buf], ms = it.sheet / DRILL * 1000, live = cur && cur.until > Date.now();
  S.buf[it.buf] = { until: (live ? cur.until : Date.now()) + ms, pct: Math.max(live ? cur.pct : 0, it.pct) };
  note(`${it.n} is running.`, 'good'); return null;
}
/* teleports: every move of the base spends one. A random landing uses a Random Teleport, a chosen spot uses an Advanced Teleport. The novice-kingdom hop has its own limit and stays free. */
let _tpRandom = false;
const _doTeleport = doTeleport, _randomTeleport = randomTeleport;
doTeleport = function (x, y) {
  const k = tpKind(x, y); if (k.err) return k.err; if (k.kind === 'novice') return _doTeleport(x, y);
  const id = _tpRandom ? 'tp_rand' : 'tp_adv'; if (itmQty(id) < 1) return `Needs a ${itemDef(id).n}. Buy one in Items > Special.`;
  const e = _doTeleport(x, y); if (!e) itmTake(id); return e;
};
randomTeleport = function () {
  if (itmQty('tp_rand') < 1) return 'Needs a Random Teleport. Buy one in Items > Special.';
  _tpRandom = true; try { return _randomTeleport(); } finally { _tpRandom = false; }
};
/* a skill reset now costs an item (it was free while the economy was open) */
const _skReset = skReset;
skReset = function () { if (itmQty('sk_reset') < 1) return 'Needs a Skill Reset. Buy one in Items > Special.'; itmTake('sk_reset'); return _skReset(); };
function movable() {
  const out = []; for (const area of ['in', 'out']) S.plots[area].forEach((p, i) => { if (p && p.b !== 'cc' && !S.jobs.some(j => j.kind === 'build' && j.area === area && j.idx === i)) out.push([area, i, p]); }); return out;
}
function moveBuilding(area, from, to) {
  const p = S.plots[area][from]; if (!p || S.plots[area][to]) return 'Pick an empty plot.';
  if (S.jobs.some(j => j.kind === 'build' && j.area === area && j.idx === from)) return 'That building is being built.';
  if (itmQty('bmove') < 1) return 'Needs a Building Move.';
  itmTake('bmove'); S.plots[area][to] = p; S.plots[area][from] = null; note(`${BLD[p.b].n} moved to plot ${to + 1}.`, 'good'); return null;
}
function openChest(it) {
  const o = it.open, got = [];
  if (o.mats) { matAdd(o.mats[0], o.mats[1]); got.push(`${o.mats[1]} ${matName(o.mats[0])}`); }
  if (o.gems) { for (let i = 0; i < o.gems[1]; i++) gemAdd(gemKey(coreKind(), o.gems[0]), 1); got.push(`${o.gems[1]} ${gemTierName(o.gems[0])} Basic gems`); }
  if (o.grant) { grant(o.grant); got.push('supplies'); }
  if (o.items) { const b = itmEnsure(); for (const k in o.items) { b[k] = (b[k] || 0) + o.items[k]; got.push(`${o.items[k]}× ${itemDef(k).n}`); } }
  if (o.xpi) for (const k in o.xpi) { xpiGive(k, o.xpi[k]); got.push(`${o.xpi[k]}× ${XPI.find(x => x.id === k).n}`); }
  note(`${it.n}: ${got.join(', ')}.`, 'good'); return null;
}
/* using an item from the bag */
function itmUse(id) {
  const it = itemDef(id); if (!it) return 'No such item.'; if (itmQty(id) < 1) return 'None in the bag.';
  if (it.buf) { itmTake(id); return itmBuff(it); }
  if (it.res) { const room = storeCap() - S.res[it.res]; if (room < 1) return 'The StoreHouse is full.'; itmTake(id); const a = addRes(it.res, it.amt); note(`+${fmtN(a)} ${RESN[it.res]}${a < it.amt ? ' (StoreHouse full, the rest is lost)' : ''}.`, 'good'); return null; }
  if (it.stam) { stamTick(Date.now()); if (S.stam.v >= stamMax()) return 'Stamina is already full.'; itmTake(id); S.stam.v = Math.min(stamMax(), S.stam.v + it.stam); note(`Stamina ${S.stam.v}/${stamMax()}.`, 'good'); return null; }
  if (it.shield) { if (shieldOut()) return 'Recall the columns first. A shield cannot rise with marches out.'; itmTake(id); S.shield.until = Date.now() + it.shield / OCC * 1000; note(it.n + ' is up.', 'good'); return null; }
  if (it.recall) { const e = recallAll(); if (!e) itmTake(id); return e; }
  if (it.open) { itmTake(id); return openChest(it); }
  if (id === 'rescue') { if (!S.hero.captured) return 'No hero is captured.'; itmTake(id); S.hero.captured = false; note(heroName() + ' is back.', 'good'); return null; }
  if (id === 'daily_chance') { if (S.daily !== new Date().toDateString()) return 'The daily exercise is ready, run it first.'; itmTake(id); S.daily = ''; note('Daily exercise can run again.', 'good'); return null; }
  if (id === 'bookmarks') { if (bkCap() >= ITEM_BK.max) return 'Bookmarks are at the maximum.'; itmTake(id); S.bkPlus = (S.bkPlus || 0) + 1; note(`Bookmark slots: ${bkCap()}.`, 'good'); return null; }
  if (id === 'sk_reset') { const e = skReset(); return e; }
  if (id === 'sk_hunt') { itmTake(id); for (const k in (S.hero.sk || {})) { const n = skNode(k); if (n && n.pool === 'hunt') delete S.hero.sk[k]; } note('Hunting skills refunded.', 'good'); return null; }
  if (id === 'rn_cmd' || id === 'rn_ally' || id === 'tag_card') {
    const cur = id === 'rn_cmd' ? heroName() : id === 'rn_ally' ? S.al[0].n : S.al[0].tag;
    let v = prompt(id === 'tag_card' ? 'New alliance tag (3 letters or numbers)' : 'New name (2 to 20 characters)', cur); if (v == null) return 'Cancelled.';
    v = v.trim().replace(/\s+/g, ' ');
    if (id === 'tag_card') { v = v.toUpperCase(); if (!/^[A-Z0-9]{3}$/.test(v)) return 'A tag is exactly 3 letters or numbers.'; if (S.al.some((a, i) => i && a.tag === v)) return 'A rival already uses that tag.'; S.al[0].tag = v; }
    else { if (v.length < 2 || v.length > 20) return 'Use 2 to 20 characters.'; if (id === 'rn_cmd') { S.names = S.names || {}; S.names.hero = v; } else S.al[0].n = v; }
    itmTake(id); terrDirty = true; note('Renamed to ' + v + '.', 'good'); return null;
  }
  if (id === 'bmove') { UI.mv = { area: 'in', from: '', to: '' }; UI.dt.item = 'bag'; return null; }
  if (id === 'tp_rand') { UI.drawer = null; UI.page = 'map'; const e = randomTeleport(); if (!e) panTo(S.base.x, S.base.y); return e; }
  if (id === 'tp_adv') { UI.drawer = null; UI.page = 'map'; toast('Tap open ground on the map, then Teleport.'); return null; }
  return 'Cannot use that here.';
}
/* ---------------- screen ---------------- */
function itmIcon(it) {
  const f = typeof ART !== 'undefined' && ART.file('sitem_' + (it.ico || it.id));
  if (f) return `<div class="rwic itic"><img class="iticon" src="${f}" alt="" draggable="false"></div>`;
  return `<div class="rwic itic"><svg viewBox="0 0 48 48"><rect x="4" y="4" width="40" height="40" rx="8" fill="${it.vip ? '#2e4d7a' : it.buf ? '#7a5a1c' : '#3a4a52'}" stroke="#d9b45a" stroke-width="2"/><text x="24" y="30" text-anchor="middle" font-size="${it.g.length > 3 ? 11 : 15}" font-weight="700" fill="#f1ead2" font-family="sans-serif">${it.g}</text></svg></div>`;
}
const fmtBuf = ms => fmtT(ms / 1000);
function itmRow(it) {
  const have = itmQty(it.id), usd = it.usd ? IAP.price(iapOfItem(it.id)) : null;
  const buy = it.usd ? `<button class="btn sm pri" data-a="itmiap" data-id="${it.id}">${usd}</button>` : `<button class="btn sm" data-a="itmbuy" data-id="${it.id}" ${S.dia < it.cost ? 'disabled' : ''}>${fmtN(it.cost)}◆</button>`;
  const dur = it.buf ? ` Lasts ${dual(it.sheet, DRILL)}.` : it.shield ? ` Lasts ${dual(it.shield, OCC)}.` : '';
  return `<div class="rwrow">${itmIcon(it)}<div class="grow"><b>${it.n}</b>${!it.usd && have ? ` <span class="num br">×${have}</span>` : ''}<div class="sub">${it.d}${dur}</div></div>${buy}</div>`;
}
function itmBuffs() {
  const rows = Object.keys(S.buf || {}).filter(k => bufLeftMs(k)).map(k => `<div class="rwrow"><div class="grow"><b>${{ xp: 'Hero XP', gather: 'Gathering speed', march: 'March speed', atk: 'Attack', def: 'Defense', size: 'March size', anti: 'Anti-scout' }[k]}${k === 'anti' ? '' : ' +' + Math.round(S.buf[k].pct * 100) + '%'}</b></div><span class="num br">${fmtBuf(bufLeftMs(k))}</span></div>`);
  return rows.length ? `<div class="panel"><div class="hd"><h3>Running boosts</h3></div><div class="bd">${rows.join('')}</div></div>` : '';
}
function movePanel() {
  const mv = UI.mv; if (!mv) return '';
  const mvb = movable().filter(([a]) => a === mv.area), empty = S.plots[mv.area].map((p, i) => p ? -1 : i).filter(i => i >= 0);
  return `<div class="panel"><div class="hd"><h3>Move a building</h3><button class="btn sm line" data-a="mvclose">Close</button></div><div class="bd">
  <div class="flex wrap mb"><button class="btn sm ${mv.area === 'in' ? 'pri' : 'line'}" data-a="mvarea" data-k="in">Inner plots</button><button class="btn sm ${mv.area === 'out' ? 'pri' : 'line'}" data-a="mvarea" data-k="out">Outer plots</button></div>
  <div class="flex wrap"><select data-a="mvfrom">${'<option value="">Building</option>' + mvb.map(([a, i, p]) => `<option value="${i}" ${String(mv.from) === String(i) ? 'selected' : ''}>${BLD[p.b].n} ${p.l} (plot ${i + 1})</option>`).join('')}</select>
  <select data-a="mvto">${'<option value="">Empty plot</option>' + empty.map(i => `<option value="${i}" ${String(mv.to) === String(i) ? 'selected' : ''}>Plot ${i + 1}</option>`).join('')}</select>
  <button class="btn pri" data-a="mvgo" ${mv.from === '' || mv.to === '' ? 'disabled' : ''}>Move</button></div>${empty.length ? '' : '<div class="sub mt">No empty plot of this kind.</div>'}</div></div>`;
}
const _itemHTML = itemHTML;
function itemHTML2(t) {
  itmEnsure();
  const cats = { spec: ['special', 'Special'], res: ['res', 'Resources'], war: ['war', 'War'], chest: ['chest', 'Chests'] }, tab = cats[t];
  if (tab) return `<div class="panel"><div class="hd"><h3>${tab[1]}</h3><b class="num br">${fmtN(S.dia)}◆</b></div><div class="bd">${ITEMS.filter(i => i.cat === tab[0]).map(itmRow).join('')}<div class="sub mt">${t === 'spec' ? `${IAP.mode() === 'sandbox' ? '<b class="br">Demo build:</b> VIP point items are sandbox, no money is charged. ' : ''}VIP is permanent: points come only from real-money items and the Alliance Store, and there are no timed VIP passes.` : t === 'chest' ? 'Chests go to the bag. Open them with Use.' : 'Bought items go to the bag. Use them from there.'}</div></div></div>`;
  if (t === 'boost') return itmBuffs() + _itemHTML(t) + `<div class="panel"><div class="hd"><h3>March speed</h3></div><div class="bd">${ITEMS.filter(i => i.cat === 'speed').map(itmRow).join('')}</div></div>`;
  const mine = ITEMS.filter(i => !i.usd && itmQty(i.id));
  const bag = `<div class="panel"><div class="hd"><h3>My items</h3></div><div class="bd">${mine.map(it => `<div class="rwrow">${itmIcon(it)}<div class="grow"><b>${it.n}</b> <span class="num br">×${itmQty(it.id)}</span><div class="sub">${it.d}</div></div><button class="btn sm pri" data-a="itmuse" data-id="${it.id}">Use</button></div>`).join('') || '<div class="sub">Nothing yet. Buy items in the Special and Speed Up tabs.</div>'}</div></div>`;
  return itmBuffs() + movePanel() + bag + _itemHTML(t);
}
DR.item = { tabs: [['bag', 'Bag'], ['spec', 'Special'], ['res', 'Resources'], ['boost', 'Speed Up'], ['war', 'War'], ['chest', 'Chests']], body: itemHTML2 };
Object.assign(A, {
  itmbuy(d) { run(itmBuy(d.id), 'Added to the bag.'); },
  itmiap(d) { const p = iapOfItem(d.id); IAP.buy(p.id).then(e => { if (e) toast(e, 'warn'); else { hap([16, 50, 16]); } UI.dirty = true; D(); }); },
  itmuse(d) { const e = itmUse(d.id); if (e === 'Cancelled.') return D(); run(e); },
  mvclose() { UI.mv = null; D(); }, mvarea(d) { UI.mv = { area: d.k, from: '', to: '' }; D(); },
  mvfrom(d, el) { UI.mv.from = el.value; D(); }, mvto(d, el) { UI.mv.to = el.value; D(); },
  mvgo() { const m = UI.mv; if (run(moveBuilding(m.area, +m.from, +m.to), 'Building moved.')) UI.mv = null; D(); }
});
