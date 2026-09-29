'use strict';
/* IRON MARCH — Command Center sheet, per-level upgrade path, tap sequences and the on-screen tap guide. */
function plotOf(b) { let best = null; ['in', 'out'].forEach(ar => S.plots[ar].forEach((p, i) => { if (p && p.b === b && (!best || p.l > best.l)) best = { ar, i, l: p.l }; })); return best; }

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
    const req = ccReqs(to), miss = treeMissing('cc', to), f = 1 + (lvlMax('hall') ? lvlMax('hall') * 0.04 : 0);
    const dHead = Math.floor((500 + to * 400) * f) - Math.floor((500 + L * 400) * f), dQ = Math.floor(to / 5) - Math.floor(L / 5), unlock = CC_ACTIONS.filter(a => a.lv === to);
    const cost = buildCost('cc', to), err = buildErr(area, idx, 'cc');
    h += `<div class="panel mt"><div class="hd"><h3>Next: ${to} · ${nx[0]}</h3>${miss.length ? '<span class="tag sg">Locked</span>' : '<span class="tag br">Ready</span>'}</div><div class="bd">
      <div class="sub">${nx[1]}</div>
      <div class="lbl mt">This level gives</div><div class="rr"><span>Headcount</span><span class="num ox">+${fmtN(dHead)}</span></div><div class="rr"><span>Help clicks</span><span class="num ox">+2</span></div>${dQ ? `<div class="rr"><span>March queue</span><span class="num ox">+1</span></div>` : ''}${unlock.map(a => `<div class="rr"><span>Unlocks ${a.n}</span><span class="num ox">new</span></div>`).join('')}
      <div class="lbl mt">Requirements · rural roots first</div>${treeHTML('cc', to)}
      <div class="lbl mt">Cost</div><div>${costHTML(cost)}</div><div class="sub mt">${dualT(buildSheetSec('cc', to) / (1 + mods().build))}</div>
      <div class="mt">${miss.length ? `<span class="sub sg">Needs ${miss.map(([rb, rl]) => BLD[rb].n + ' ' + rl).join(', ')}.</span>` : err ? `<span class="sub sg">${err}</span>` : payBtn(cost, 'build', { area, idx }, 'Upgrade to ' + to)}</div></div></div>`;
  } else h += `<div class="sub mt ox">Level 25. The citadel is complete.</div>`;
  const rows = UI.ccPath ? CC_LEVELS.map((x, i) => i + 1) : CC_LEVELS.map((x, i) => i + 1).filter(n => n >= L - 1 && n <= L + 4);
  h += `<div class="panel mt"><div class="hd"><h3>Upgrade path</h3><button class="btn sm line" data-a="ccpath">${UI.ccPath ? 'Nearby' : 'All 25'}</button></div><div class="bd">${rows.map(n => { const q = ccReqs(n), st = n <= L ? 'done' : n === to ? 'now' : ''; return `<div class="lvr ${st}"><b class="num">${n}</b><div class="grow"><b class="h" style="font-size:14px">${CC_LEVELS[n - 1][0]}</b><div class="sub">${CC_LEVELS[n - 1][1]}${q.length ? ' Needs ' + q.map(([b, l]) => BLD[b].n + ' ' + l).join(', ') + '.' : ''}</div></div>${n <= L ? '<span class="ox">✓</span>' : ''}</div>`; }).join('')}</div></div>`;
  return h;
}
const _sheetPlot = sheetPlot;
sheetPlot = function (area, idx) {
  const p = S.plots[area][idx]; if (!p) return _sheetPlot(area, idx);
  return p.b === 'cc' ? ccSheet(area, idx, p) : bldSheet(area, idx, p);
};

setInterval(() => { const b = document.querySelector('#sheet [data-a=ccact][data-id=req]'); if (b && b.disabled && Date.now() >= reqReadyAt() && S.plots) UI.dirty = true; }, 500);
Object.assign(A, {
  ccact(d) {
    const id = d.id; let e = null;
    if (id === 'req') e = requisition(); else if (id === 'muster') e = musterAll(); else if (id === 'recall') e = recallAll(); else if (id === 'shield') e = toggleShield();
    else if (id === 'tp') { e = randomTeleport(); if (!e) panTo(S.base.x, S.base.y); }
    run(e);
  },
  reqgo(d) { const t = plotOf(d.b); if (t) sheetOpen({ type: 'plot', area: t.ar, idx: t.i }); else toast(BLD[d.b].n + ' is not built. Tap an empty plot.', 'warn'); },
  ccpath() { UI.ccPath = !UI.ccPath; D(); }
});
