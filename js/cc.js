'use strict';
/* IRON MARCH — Command Center sheet, per-level upgrade path, tap sequences and the on-screen tap guide. */
const SEQ = {
  cc: ['Tap the Command Center plot.', 'Tap an action tile (Requisition, Muster, Recall all, Shield, Relocate). Locked tiles show the level they open at.', 'Read Next level: every requirement shows a tick or a cross. Tap a cross row to jump to that building.', 'Tap Upgrade. If you are short, the button reads "cover N" and spends diamonds for the gap.', 'Watch the ring on the plot. Tap Rush (diamonds), Slip (a speed-up item) or Ask help (alliance).', 'A green bubble shows when it is done. Tap the plot to clear it and see the new look.'],
  mil: ['Tap the Military Complex plot.', 'Tap Open Train.', 'Pick a class, then a tier. Locked tiers say what they need.', 'Set the batch with the steppers, or tap Max.', 'Tap Train. A ring shows on the complex.', 'When the bubble appears, the troops are in the garrison.'],
  tech: ['Tap the Tech Institute plot.', 'Tap Open Lab.', 'Pick a tree tab, then read the requirement line on a card.', 'Tap Research. One lab queue only.', 'Use Rush, Slip or Ask help on the ring if you are in a hurry.'],
  depot: ['Tap the Depot plot.', 'Tap Open Med. The Depot tab lists your wounded.', 'Tap Heal all on a row. Tier 1 is instant, higher tiers take a timer.', 'Beds show used over capacity. Overflow dies, so heal early.'],
  defense: ['Tap the Defense Center plot.', 'Tap Open Wall.', 'Pick a wall class and tier. Tiers unlock with Defense Center level.', 'Set the batch and tap Crew.', 'Crew cap is 40 per Defense Center level.'],
  hall: ['Tap the Hall of War plot.', 'Tap Open Rally.', 'Pick a target, a wait, and extra slots if you have tokens.', 'Fill the column, tap Lead rally. Only you can cancel it.'],
  radar: ['Tap the Radar Station plot.', 'At level 4 or more, tap Anti-Scout to block scouts and see who sent them.', 'Recon research raises scan depth, up to the station level.'],
  store: ['Tap the StoreHouse plot.', 'Read the cap and the protected floor. Raids cannot take the floor.', 'Upgrade to raise both.'],
  treasury: ['Tap the Treasury plot.', 'Each level adds Cash every hour. Upgrade to earn more.'],
  prison: ['Tap the Prison plot.', 'Seals are spent to ransom a captured hero. Tap the seals button to buy five.'],
  market: ['Tap the Black Market plot.', 'Tap Open Market.', 'Three offers a day. Refresh costs 15 diamonds.'],
  rations: ['Tap the plot.', 'Upgrade to raise hourly output. Floating numbers show income.'], fuel: ['Tap the plot.', 'Upgrade to raise hourly output.'], power: ['Tap the plot.', 'Upgrade to raise hourly output.'], alloy: ['Tap the plot.', 'Upgrade to raise hourly output.'],
  empty: ['Tap an empty plot.', 'Tap Build on a building row.', 'A ring shows the build timer. Rush, Slip or Ask help to speed it.', 'Tap the plot again when the bubble shows.']
};
const stepsHTML = (kind, guides) => {
  const list = SEQ[kind] || SEQ.rations;
  return `<div class="panel mt"><div class="hd"><h3>Tap sequence</h3><button class="btn sm line" data-a="seqtoggle">${UI.seqOpen ? 'Hide' : 'Show'}</button></div>${UI.seqOpen ? `<div class="bd"><ol class="seq">${list.map(t => `<li>${t}</li>`).join('')}</ol></div>` : ''}${guides ? `<div class="bd flex wrap">${guides}</div>` : ''}</div>`;
};
function plotOf(b) { let best = null; ['in', 'out'].forEach(ar => S.plots[ar].forEach((p, i) => { if (p && p.b === b && (!best || p.l > best.l)) best = { ar, i, l: p.l }; })); return best; }
const guideBtn = (id, label, extra) => `<button class="btn sm line" data-a="guide" data-id="${id}" ${extra || ''}>${label}</button>`;

/* ---------------- Command Center sheet ---------------- */
function ccSheet(area, idx, p) {
  const L = p.l, to = L + 1, job = S.jobs.find(j => j.kind === 'build' && j.area === area && j.idx === idx), lv = CC_LEVELS[Math.max(0, L - 1)], nx = CC_LEVELS[to - 1];
  const now = Date.now(), reqRdy = reqReadyAt();
  const acts = CC_ACTIONS.map(a => {
    const locked = L < a.lv; let sub = a.d, dis = locked;
    if (locked) sub = `Opens at CC ${a.lv}`;
    else if (a.id === 'req') { if (now < reqRdy) { dis = true; sub = 'Ready in ' + tm(reqRdy, false); } else { const am = reqAmounts(L); sub = `${fmtN(am.rations)} ${RESN.rations} +4 more`; } }
    else if (a.id === 'shield') sub = S.shield.until > now ? 'Shield up. Tap to drop.' : shieldOut() ? 'Recall columns first.' : a.d;
    else if (a.id === 'tp') { if (heroLocked()) { dis = true; sub = 'A hero is out.'; } }
    else if (a.id === 'recall') { if (!S.marches.some(m => m.phase !== 'back')) { dis = true; sub = 'No column out.'; } }
    return `<button class="act ${locked ? 'lk' : ''}" data-a="ccact" data-id="${a.id}" ${dis ? 'disabled' : ''}><b>${a.n}</b><span>${sub}</span></button>`;
  }).join('');
  let h = `<div class="flex"><div class="pv">${bldSVG('cc', L)}</div><div class="grow"><div class="h1">Command Center <span class="br num">${L}</span></div><div class="sub"><b class="br">${lv[0]}</b> · ${lv[1]}</div><div class="sub">Headcount ${fmtN(headcount())} · queues ${marchQueues()} · help ${helpCap()}</div></div><button class="btn sm line" data-a="closesheet">Close</button></div>`;
  h += `<div class="lbl mt">Command actions</div><div class="acts">${acts}</div>`;
  if (job) h += `<div class="panel mt"><div class="bd"><div class="lbl">Building to level ${job.to}</div>${jobCtl(job)}</div></div>`;
  else if (to <= 25) {
    const req = ccReqs(to).map(([b, l]) => ({ b, l, have: lvlMax(b), ok: lvlMax(b) >= l })), miss = req.filter(r => !r.ok), f = 1 + (lvlMax('hall') ? lvlMax('hall') * 0.04 : 0);
    const dHead = Math.floor((500 + to * 400) * f) - Math.floor((500 + L * 400) * f), dQ = Math.floor(to / 5) - Math.floor(L / 5), unlock = CC_ACTIONS.filter(a => a.lv === to);
    const cost = buildCost('cc', to), err = buildErr(area, idx, 'cc');
    h += `<div class="panel mt"><div class="hd"><h3>Next: ${to} · ${nx[0]}</h3>${miss.length ? '<span class="tag sg">Locked</span>' : '<span class="tag br">Ready</span>'}</div><div class="bd">
      <div class="sub">${nx[1]}</div>
      <div class="lbl mt">This level gives</div><div class="rr"><span>Headcount</span><span class="num ox">+${fmtN(dHead)}</span></div><div class="rr"><span>Help clicks</span><span class="num ox">+2</span></div>${dQ ? `<div class="rr"><span>March queue</span><span class="num ox">+1</span></div>` : ''}${unlock.map(a => `<div class="rr"><span>Unlocks ${a.n}</span><span class="num ox">new</span></div>`).join('')}
      <div class="lbl mt">Requirements</div>${req.length ? req.map(r => `<button class="rq ${r.ok ? 'ok' : 'no'}" data-a="reqgo" data-b="${r.b}"><span>${r.ok ? '✓' : '✗'} ${BLD[r.b].n} ${r.l}</span><span class="num">${r.have}/${r.l}</span></button>`).join('') : '<div class="sub">None.</div>'}
      <div class="lbl mt">Cost</div><div>${costHTML(cost)}</div><div class="sub mt">${dualT(buildSheetSec('cc', to) / (1 + mods().build))}</div>
      <div class="mt">${miss.length ? `<span class="sub sg">Needs ${miss.map(r => BLD[r.b].n + ' ' + r.l).join(', ')}.</span>` : err ? `<span class="sub sg">${err}</span>` : payBtn(cost, 'build', { area, idx }, 'Upgrade to ' + to)}</div></div></div>`;
  } else h += `<div class="sub mt ox">Level 25. The citadel is complete.</div>`;
  const rows = UI.ccPath ? CC_LEVELS.map((x, i) => i + 1) : CC_LEVELS.map((x, i) => i + 1).filter(n => n >= L - 1 && n <= L + 4);
  h += `<div class="panel mt"><div class="hd"><h3>Upgrade path</h3><button class="btn sm line" data-a="ccpath">${UI.ccPath ? 'Nearby' : 'All 25'}</button></div><div class="bd">${rows.map(n => { const q = ccReqs(n), st = n <= L ? 'done' : n === to ? 'now' : ''; return `<div class="lvr ${st}"><b class="num">${n}</b><div class="grow"><b class="h" style="font-size:14px">${CC_LEVELS[n - 1][0]}</b><div class="sub">${CC_LEVELS[n - 1][1]}${q.length ? ' Needs ' + q.map(([b, l]) => BLD[b].n + ' ' + l).join(', ') + '.' : ''}</div></div>${n <= L ? '<span class="ox">✓</span>' : ''}</div>`; }).join('')}</div></div>`;
  h += stepsHTML('cc', guideBtn('upgrade', 'Show me: upgrade', `data-ar="${area}" data-i="${idx}"`) + guideBtn('requisition', 'Show me: requisition'));
  return h;
}
const _sheetPlot = sheetPlot;
sheetPlot = function (area, idx) {
  const p = S.plots[area][idx]; if (!p) return _sheetPlot(area, idx) + stepsHTML('empty');
  if (p.b === 'cc') return ccSheet(area, idx, p);
  const g = guideBtn('upgrade', 'Show me: upgrade', `data-ar="${area}" data-i="${idx}"`) + (p.b === 'mil' ? guideBtn('train', 'Show me: train') : '') + (p.b === 'tech' ? guideBtn('research', 'Show me: research') : '');
  return _sheetPlot(area, idx) + stepsHTML(p.b, g);
};

/* ---------------- tap guide ---------------- */
function plotSel(ar, i) { return `.plot[data-ar="${ar}"][data-i="${i}"]`; }
const onBase = () => ({ sel: '#dock [data-k=base]', t: 'Open Base.', skip: () => UI.page === 'base' });
const GUIDES = {
  upgrade: (ar, i) => [onBase(), { sel: plotSel(ar, i), t: 'Tap the building.', skip: () => UI.sheet && UI.sheet.type === 'plot' && UI.sheet.area === ar && UI.sheet.idx === +i }, { sel: '#sheet [data-a=build]', t: 'Tap Upgrade. When short, the button says "cover" and spends diamonds for the gap.', alt: { sel: '#sheet .rq.no', t: 'Upgrade is locked. Tap a red requirement to jump to that building and raise it first.' } }, { sel: '#sheet [data-a=help],#sheet [data-a=slip],#sheet [data-a=rush]', t: 'Optional: tap Ask help, Slip or Rush to cut the timer. Or skip.' }, { sel: null, t: 'A ring fills on the building. When a green bubble shows, tap the building to clear it.' }],
  requisition: () => { const c = plotOf('cc'); return [onBase(), { sel: c ? plotSel(c.ar, c.i) : null, t: 'Tap the Command Center.', skip: () => UI.sheet && UI.sheet.type === 'plot' && S.plots[UI.sheet.area][UI.sheet.idx] && S.plots[UI.sheet.area][UI.sheet.idx].b === 'cc' }, { sel: '#sheet [data-a=ccact][data-id=req]', t: 'Tap Requisition to collect supplies.' }, { sel: null, t: 'Supplies scale with level and come back every 30 sheet minutes.' }]; },
  train: () => { const c = plotOf('mil'); return [onBase(), { sel: c ? plotSel(c.ar, c.i) : null, t: 'Tap the Military Complex.', skip: () => UI.drawer === 'desk' || (UI.sheet && UI.sheet.type === 'plot' && S.plots[UI.sheet.area][UI.sheet.idx] && S.plots[UI.sheet.area][UI.sheet.idx].b === 'mil') }, { sel: '#sheet [data-a=wing][data-w=train]', t: 'Tap Open Train.', skip: () => UI.drawer === 'desk' }, { sel: '#drawer [data-a=trmax]', t: 'Tap Max to fill the batch.' }, { sel: '#drawer [data-a=train]', t: 'Tap Train.' }, { sel: null, t: 'A ring shows on the complex. A bubble shows when the troops arrive.' }]; },
  research: () => { const c = plotOf('tech'); return [onBase(), { sel: c ? plotSel(c.ar, c.i) : null, t: 'Tap the Tech Institute.', skip: () => UI.drawer === 'desk' || (UI.sheet && UI.sheet.type === 'plot' && S.plots[UI.sheet.area][UI.sheet.idx] && S.plots[UI.sheet.area][UI.sheet.idx].b === 'tech') }, { sel: '#sheet [data-a=wing][data-w=lab]', t: 'Tap Open Lab.', skip: () => UI.drawer === 'desk' }, { sel: '#drawer [data-a=research]', t: 'Tap Research on a card.' }, { sel: null, t: 'One lab queue. Use Rush, Slip or Ask help on the ring.' }]; }
};
function applyGuide() {
  document.querySelectorAll('.gd').forEach(e => e.classList.remove('gd'));
  const h = $('#hint'), g = UI.guide; if (!g) { h.className = ''; return; }
  let st = g.steps[g.i]; while (st && st.skip && st.skip()) { g.i++; st = g.steps[g.i]; }
  if (!st) { UI.guide = null; h.className = ''; return; }
  let el = st.sel ? document.querySelector(st.sel) : null, txt = st.t;
  if (!el && st.alt) { el = document.querySelector(st.alt.sel); if (el) txt = st.alt.t; }
  h.innerHTML = `<b class="br">Step ${g.i + 1}/${g.steps.length}</b> ${txt}<span class="hb"><button data-a="guideskip">Skip</button>${el || st.sel ? '' : '<button class="pri" data-a="guidenext">Got it</button>'}</span>`;
  h.className = 'on';
  if (el) { el.classList.add('gd'); const r = el.getBoundingClientRect(), hh = h.offsetHeight, top = r.top > hh + 90 ? r.top - hh - 10 : Math.min(innerHeight - hh - 70, r.bottom + 10); h.style.top = Math.max(60, top) + 'px'; }
  else h.style.top = (innerHeight - h.offsetHeight - 70) + 'px';
}
document.addEventListener('click', e => { const g = UI.guide; if (!g) return; const st = g.steps[g.i]; if (st && st.sel && e.target.closest(st.sel)) setTimeout(() => { g.i++; UI.dirty = true; }, 0); }, true);
setInterval(() => { applyGuide(); const b = document.querySelector('#sheet [data-a=ccact][data-id=req]'); if (b && b.disabled && Date.now() >= reqReadyAt() && S.plots) UI.dirty = true; }, 250);
Object.assign(A, {
  ccact(d) {
    const id = d.id; let e = null;
    if (id === 'req') e = requisition(); else if (id === 'muster') e = musterAll(); else if (id === 'recall') e = recallAll(); else if (id === 'shield') e = toggleShield();
    else if (id === 'tp') { e = randomTeleport(); if (!e) panTo(S.base.x, S.base.y); }
    run(e);
  },
  reqgo(d) { const t = plotOf(d.b); if (t) sheetOpen({ type: 'plot', area: t.ar, idx: t.i }); else toast(BLD[d.b].n + ' is not built. Tap an empty plot.', 'warn'); },
  ccpath() { UI.ccPath = !UI.ccPath; D(); }, seqtoggle() { UI.seqOpen = !UI.seqOpen; D(); },
  guide(d) { const f = GUIDES[d.id]; UI.guide = { id: d.id, i: 0, steps: f(d.ar, d.i) }; D(); setTimeout(applyGuide, 50); },
  guideskip() { UI.guide = null; D(); }, guidenext() { if (UI.guide) UI.guide.i++; D(); }
});
