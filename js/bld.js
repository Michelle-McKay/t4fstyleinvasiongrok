'use strict';
/* IRON MARCH — building sheets: details, options and upgrade roots specific to each building. */
const TIER_NAMES = ['Empty lot', 'Makeshift', 'Concrete', 'Reinforced', 'Advanced', 'Fortified'];
function treeNodes(b, to, depth) {
  return bldReqs(b, to).map(([rb, rl]) => { const have = lvlMax(rb), ok = have >= rl; return { b: rb, l: rl, have, ok, kids: !ok && depth < 3 ? treeNodes(rb, rl, depth + 1) : [] }; });
}
function treeHTML(b, to) {
  const nodes = treeNodes(b, to, 1); if (!nodes.length) return '<div class="sub">No requirements. This is a root: raise it to feed the buildings above.</div>';
  const row = (n, d) => `<button class="rq ${n.ok ? 'ok' : 'no'}" style="margin-left:${d * 14}px;width:calc(100% - ${d * 14}px)" data-a="reqgo" data-b="${n.b}"><span>${d ? '└ ' : ''}${n.ok ? '✓' : '✗'} ${BLD[n.b].n} ${n.l}${BLD[n.b].res ? ' <em class="rt">root</em>' : ''}</span><span class="num">${n.have}/${n.l}</span></button>` + n.kids.map(k => row(k, d + 1)).join('');
  return nodes.map(n => row(n, 0)).join('');
}
function treeMissing(b, to) { return bldReqs(b, to).filter(([rb, rl]) => lvlMax(rb) < rl); }
function yieldBreak(r) {
  const y = mods().yld[r] - 1, res = RS['y_' + r] ? rv('y_' + r) : 0; return { res, other: y - res, total: y };
}
function fillBar(r) {
  const cap = storeCap(), v = S.res[r], per = (hourly()[r] || 0) * DRILL / 3600, eta = per > 0 && v < cap ? (cap - v) / per : 0;
  return `<div class="flex sp mt"><span class="lbl">${RESN[r]} in store</span><b class="num">${fmtN(v)} / ${fmtN(cap)}</b></div><div class="bar mt"><i style="width:${Math.min(100, v / cap * 100)}%;background:${ICOL[r]}"></i></div><div class="sub">${v >= cap - 1 ? 'Full. Output is being wasted.' : eta ? 'Full in ' + fmtT(eta) + ' at the drill clock.' : 'Not producing.'}</div>`;
}
const stat = (l, v) => `<div class="rr"><span>${l}</span><span class="num">${v}</span></div>`;
const act = (id, n, sub, extra, dis) => `<button class="act" data-a="bact" data-id="${id}" ${extra || ''} ${dis ? 'disabled' : ''}><b>${n}</b><span>${sub}</span></button>`;

const DETAILS = {
  rural(p, ar, i) {
    const d = BLD[p.b], r = d.res, y = yieldBreak(r), hr = d.rate * p.l * (1 + y.total), same = allPlots().filter(x => x.b === p.b);
    return stat('Output per hour (sheet)', fmtN(hr)) + stat('Base', fmtN(d.rate * p.l)) + stat('Yield bonus', `+${(y.total * 100).toFixed(0)}% (research ${(y.res * 100).toFixed(0)}%, hero/title/gear ${(y.other * 100).toFixed(0)}%)`) + stat('Running at', `×${DRILL} · ${(hr * DRILL / 3600).toFixed(1)} per second`) + stat('Plots of this kind', `${same.length} · levels ${same.reduce((a, x) => a + x.l, 0)}`) + fillBar(r);
  },
  treasury(p) { const y = yieldBreak('cash'); return stat('Cash per hour (sheet)', fmtN(480 * p.l * (1 + y.total))) + stat('Per level', '480') + stat('Yield bonus', `+${(y.total * 100).toFixed(0)}%`) + fillBar('cash'); },
  store(p) {
    const Ls = storeSum(), cap = storeCap(), fl = protectedFloor();
    return stat('Total StoreHouse levels', Ls) + stat('Cap per resource', fmtN(cap)) + stat('Protected floor', fmtN(fl)) + stat('Warehousing research', '+' + (rv('wh') * 100).toFixed(0) + '%') + RES.map(r => `<div class="flex sp mt"><span class="lbl">${RESN[r]}</span><span class="num">${fmtN(S.res[r])}</span></div><div class="bar mt"><i style="width:${Math.min(100, S.res[r] / cap * 100)}%;background:${ICOL[r]}"></i><u style="left:${Math.min(100, fl / cap * 100)}%"></u></div>`).join('') + `<div class="sub mt">The white tick is the protected floor. Raids cannot take below it.</div>`;
  },
  depot(p) {
    const beds = bedCap(), used = woundedTotal();
    return stat('Beds', `${used} / ${fmtN(beds)}`) + `<div class="bar mt ${used >= beds ? '' : 'ox'}"><i style="width:${Math.min(100, used / Math.max(1, beds) * 100)}%"></i></div>` + Object.keys(S.wounded).filter(k => S.wounded[k] > 0).map(k => stat(ckName(k), S.wounded[k])).join('') + stat('Heal speed bonus', '+' + ((mods().heal + rv('repair')) * 100).toFixed(0) + '%') + '<div class="sub mt">A full depot kills the overflow. Tier 1 heals at once.</div>';
  },
  mil(p) {
    return stat('Total Military Complex levels', lvlSum('mil')) + [1, 2, 3, 4].map(t => stat('Tier ' + t + ' batch cap', batchCap(t) + (trainGate(t) ? ` · ${trainGate(t)}` : ' · open'))).join('') + stat('Training time bonus', '−' + (mods().train * 100).toFixed(0) + '%') + (jobsOf('train')[0] ? `<div class="sub mt">Training ${jobsOf('train')[0].why} · ${tm(jobsOf('train')[0].end, false)}</div>` : '<div class="sub mt">Queue is free.</div>');
  },
  tech(p) {
    const cand = Object.keys(RS).filter(id => !researchGate(id)).slice(0, 3), job = jobsOf('res')[0];
    return stat('Tier 3 troops need', 'Tech Institute 8') + stat('Tier 4 troops need', 'Tech Institute 12') + stat('Current research', job ? job.why : 'idle') + (job ? `<div class="sub">${tm(job.end, false)}</div>` : '') + '<div class="lbl mt">Ready to research</div>' + (cand.map(id => `<div class="rr"><span>${RS[id].n} ${R(id) + 1}</span><span class="num">${RS[id].what}</span></div>`).join('') || '<div class="sub">Nothing ready. Check requirements in the Lab.</div>');
  },
  hall(p) { return stat('Rally size', fmtN(rallyCap())) + stat('Operational orders', `${S.orders} / ${p.l}`) + stat('Headcount bonus', '+' + (p.l * 4) + '% to march size') + stat('Tokens', S.tokens) + '<div class="sub mt">Leading a rally costs one order. Orders come back over time.</div>'; },
  prison(p) { return stat('Restraint seals', `${S.seals} / ${p.l}`) + stat('Hero', S.hero.captured ? HEROES[S.hero.id].n + ' captured' : 'safe') + '<div class="sub mt">A seal frees a captured hero instead of paying 2500 cash.</div>'; },
  radar(p) {
    const w = wallStats(); return stat('Scan depth', `${R('recon')} / ${p.l}`) + stat('Wall base HP', fmtN(1400 * p.l * (1 + mods().wallHp))) + stat('Wall attack base', fmtN(90 * p.l * (1 + mods().wallAtk))) + stat('Anti-Scout', p.l >= 4 ? (S.anti ? 'on' : 'off') : 'needs level 4') + stat('Wall totals', `HP ${fmtN(w.hp)} · atk ${fmtN(w.atk)}`) + '<div class="sub mt">Scan 10 is the only scan that names a defending hero.</div>';
  },
  defense(p) { const w = wallStats(); return stat('Crew', `${w.crewN} / ${p.l * 40}`) + stat('Wall HP', fmtN(w.hp)) + stat('Wall attack', fmtN(w.atk)) + WT.map((x, i) => stat('Wall tier ' + (i + 1), p.l >= WALL_GATE[i] ? 'open' : 'Defense Center ' + WALL_GATE[i])).join(''); },
  market(p) { rollMarket(); return S.market.offers.map(o => { const it = MARKET_CAT.find(x => x.id === o.id); return stat(it.n, o.sold ? 'sold' : it.cost + '◆'); }).join('') + '<div class="sub mt">Three offers a day. Refresh costs 15 diamonds.</div>'; }
};
function actionsFor(p, ar, i) {
  const b = p.b, d = BLD[b], now = Date.now(), a = [];
  if (d.res || b === 'treasury') { const rdy = harvestReadyAt(ar, i), cool = now < rdy; a.push(act('harvest', b === 'treasury' ? 'Audit' : 'Harvest', cool ? 'Ready in ' + tm(rdy, false) : 'Collect one minute of output now.', `data-ar="${ar}" data-i="${i}"`, cool)); a.push(act('cc', 'Root path', 'See what this feeds.')); }
  if (b === 'store') a.push(act('lab:ops', 'Warehousing', 'Research more capacity.'));
  if (b === 'depot') { a.push(act('healt1', 'Heal tier 1', 'All tier 1 wounded, instantly.', '', !Object.keys(S.wounded).some(k => k.endsWith('1') && S.wounded[k] > 0))); a.push(act('wing:med', 'Open Med', 'Full wounded list.')); a.push(act('lab:ops', 'Depot beds', 'Research more beds.')); }
  if (b === 'mil') { a.push(act('wing:train', 'Open Train', 'Pick class, tier, batch.')); a.push(act('lab:troops', 'Doctrines', 'Unlock higher tiers.')); }
  if (b === 'tech') { a.push(act('wing:lab', 'Open Lab', 'All six trees.')); a.push(act('lab:field', 'Recon', 'Raise scan depth.')); }
  if (b === 'hall') { a.push(act('wing:rally', 'Open Rally', 'Lead a rally.')); a.push(act('buyorders', '5 orders', '80 diamonds.')); }
  if (b === 'prison') { a.push(act('buyseals', '5 seals', '60 diamonds.')); if (S.hero.captured) a.push(act('ransom', 'Free hero', 'Use a seal.')); }
  if (b === 'radar') { a.push(act('anti', 'Anti-Scout', p.l >= 4 ? (S.anti ? 'On. Tap to turn off.' : 'Off. Tap to turn on.') : 'Needs level 4.', '', p.l < 4)); a.push(act('lab:field', 'Recon', 'Research scan depth.')); }
  if (b === 'defense') { a.push(act('wing:wall', 'Open Wall', 'Crew the wall.')); a.push(act('lab:defense', 'Bulkheads', 'Research wall HP.')); }
  if (b === 'market') { a.push(act('wing:market', 'Open Market', 'Today\'s offers.')); }
  return a.join('');
}
function nextGives(p) {
  const b = p.b, L = p.l, d = BLD[b], y = mods().yld, out = [];
  if (d.res) out.push(`+${fmtN(d.rate * y[d.res])} ${RESN[d.res]} per hour (sheet)`);
  else if (b === 'treasury') out.push(`+${fmtN(480 * y.cash)} Cash per hour`);
  else if (b === 'store') { const Ls = storeSum(); out.push(`Cap +${fmtN(Math.floor(8000 * Math.pow(Ls + 1, 1.22) * (1 + rv('wh'))) - storeCap())}`, 'Protected floor +1200'); }
  else if (b === 'depot') out.push(`Beds +${fmtN(500 * (1 + rv('beds')))}`);
  else if (b === 'mil') out.push('Batch cap +40 at tier 1');
  else if (b === 'defense') out.push('Crew cap +40', 'Wall attack +40'), L + 1 >= 6 && out.push(L + 1 === 6 ? 'Opens wall tier 2' : L + 1 === 12 ? 'Opens wall tier 3' : L + 1 === 18 ? 'Opens wall tier 4' : '');
  else if (b === 'radar') out.push('Wall base HP +1400', 'Wall base attack +90', 'Scan depth cap +1', L + 1 === 4 ? 'Unlocks Anti-Scout' : '');
  else if (b === 'hall') out.push('Rally size +4000', 'Orders cap +1', 'March headcount +4%');
  else if (b === 'prison') out.push('Seal cap +1');
  else if (b === 'tech') out.push(L + 1 === 8 ? 'Opens tier 3 troops' : L + 1 === 12 ? 'Opens tier 4 troops' : 'Research access', '');
  else if (b === 'market') out.push('Longer shelf of offers');
  return out.filter(Boolean);
}
function feedsHTML(p) {
  const b = p.b; let rows = [];
  if (BLD[b].res) { for (const u in BLD_ROOT) if (BLD_ROOT[u] === b) { const t = plotOf(u); rows.push(`<div class="rr"><span>${BLD[u].n}</span><span class="num">${t ? 'level ' + t.l + ' · next needs ' + b + ' ' + Math.max(0, (t.l + 1) - 1) : 'not built'}</span></div>`); } }
  else if (BLD_ROOT[b]) rows.push(`<div class="rr"><span>Fed by</span><span class="num">${BLD[BLD_ROOT[b]].n} ≥ level − 1</span></div>`);
  const cc = ccLevel(), need = []; for (let n = cc + 1; n <= Math.min(25, cc + 6); n++) for (const [rb, rl] of ccReqs(n)) if (rb === b) need.push(`CC ${n} needs ${rl}`);
  if (need.length) rows.push(`<div class="rr"><span>Command Center path</span><span class="num">${need.slice(0, 4).join(' · ')}</span></div>`);
  return rows.length ? `<div class="panel mt"><div class="hd"><h3>${BLD[b].res ? 'Root of' : 'Path'}</h3></div><div class="bd">${rows.join('')}</div></div>` : '';
}
function bldSheet(area, idx, p) {
  const b = p.b, d = BLD[b], L = p.l, to = L + 1, job = S.jobs.find(j => j.kind === 'build' && j.area === area && j.idx === idx), tier = tierOf(L);
  const det = DETAILS[d.res ? 'rural' : b], acts = actionsFor(p, area, idx);
  let h = `<div class="flex"><div class="pv">${bldSVG(b, L)}</div><div class="grow"><div class="h1">${d.n} <span class="br num">${L}</span></div><div class="sub"><b class="br">${TIER_NAMES[tier]}</b> · ${area === 'in' ? 'Urban' : 'Rural'} plot ${idx + 1}</div><div class="sub">${effectText(b, L)}</div></div><button class="btn sm line" data-a="closesheet">Close</button></div>`;
  if (acts) h += `<div class="lbl mt">Options</div><div class="acts">${acts}</div>`;
  if (det) h += `<div class="panel mt"><div class="hd"><h3>Details</h3></div><div class="bd">${det(p, area, idx)}</div></div>`;
  if (job) h += `<div class="panel mt"><div class="bd"><div class="lbl">Building to level ${job.to}</div>${jobCtl(job)}</div></div>`;
  else if (to <= 25) {
    const miss = treeMissing(b, to), err = buildErr(area, idx, b), cost = buildCost(b, to), gives = nextGives(p);
    h += `<div class="panel mt"><div class="hd"><h3>Next: level ${to}</h3>${miss.length ? '<span class="tag sg">Locked</span>' : '<span class="tag br">Ready</span>'}</div><div class="bd">${gives.length ? `<div class="lbl">Gives</div>${gives.map(g => `<div class="rr"><span>${g}</span><span class="num ox">new</span></div>`).join('')}` : ''}<div class="lbl mt">Requirements</div>${treeHTML(b, to)}<div class="lbl mt">Cost</div><div>${costHTML(cost)}</div><div class="sub mt">${dualT(buildSheetSec(b, to) / (1 + mods().build))}</div><div class="mt">${miss.length ? `<span class="sub sg">Needs ${miss.map(([rb, rl]) => BLD[rb].n + ' ' + rl).join(', ')}.</span>` : err ? `<span class="sub sg">${err}</span>` : payBtn(cost, 'build', { area, idx }, 'Upgrade to ' + to)}</div></div></div>`;
  } else h += '<div class="sub mt ox">Level 25. Fully built.</div>';
  h += feedsHTML(p);
  return h;
}
Object.assign(A, {
  bact(d, el) {
    const id = d.id, ar = d.ar, i = d.i; let e = null;
    if (id === 'harvest') e = harvestPlot(ar, +i);
    else if (id === 'cc') { const t = plotOf('cc'); if (t) { sheetOpen({ type: 'plot', area: t.ar, idx: t.i }); return; } }
    else if (id.startsWith('wing:')) { A.wing({ w: id.slice(5) }); return; }
    else if (id.startsWith('lab:')) { UI.lab = id.slice(4); openDrawer('desk', 'lab'); return; }
    else if (id === 'healt1') { const names = Object.keys(S.wounded).filter(k => k.endsWith('1') && S.wounded[k] > 0); for (const k of names) { const [c, t] = ckSplit(k); e = startHeal(c, t, S.wounded[k], false) || e; } }
    else if (id === 'buyorders') e = buyOrders(); else if (id === 'buyseals') e = buySeals(); else if (id === 'ransom') e = ransom(true); else if (id === 'anti') { S.anti = !S.anti; }
    run(e);
  }
});
