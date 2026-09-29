'use strict';
/* IRON MARCH — UI: HUD, dock, drawers, sheets, base scene. Map lives in map.js, art in art.js. */
const $ = s => document.querySelector(s);
const ICON = {
  map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
  base: '<path d="M3 20V9l5-3v14M8 20V4l6 3v13M14 20V10l7 2v8M2 20h20"/>',
  train: '<path d="M6 7l6 5-6 5M13 7l6 5-6 5"/>',
  lab: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M8 15h8"/>',
  med: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
  march: '<path d="M5 21V4M5 5h13l-3 4 3 4H5"/>',
  vault: '<rect x="3" y="4" width="18" height="16"/><circle cx="12" cy="12" r="4"/><path d="M12 8v2M12 14v2M8 12h2M14 12h2"/>',
  hero: '<path d="M4 9h13l3-3v5h-4l-2 3v3h3v3H7v-3h3v-3L7 12H4z"/>',
  alliance: '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M12 8l1.4 2.8 3.1.4-2.3 2.1.6 3.1-2.8-1.5-2.8 1.5.6-3.1-2.3-2.1 3.1-.4z"/>',
  more: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
  mail: '<rect x="3" y="5" width="18" height="14"/><path d="M3 7l9 7 9-7"/>',
  rations: '<path d="M12 3v18M12 8c-3 0-4-2-4-4 3 0 4 2 4 4zm0 0c3 0 4-2 4-4-3 0-4 2-4 4zM12 14c-3 0-4-2-4-4 3 0 4 2 4 4zm0 0c3 0 4-2 4-4-3 0-4 2-4 4z"/>',
  fuel: '<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/>',
  power: '<path d="M13 2L5 14h6l-1 8 8-12h-6z"/>',
  alloy: '<path d="M4 16l3-8h10l3 8zM2 20h20"/>',
  cash: '<rect x="3" y="7" width="18" height="10"/><circle cx="12" cy="12" r="2.5"/>',
  dia: '<path d="M12 3l8 7-8 11-8-11z"/>'
};
const ICOL = { rations: '#8ea36a', fuel: '#e07a2f', power: '#5ec4d4', alloy: '#9aa4a8', cash: '#e0a44a', dia: '#5ec4d4' };
const svg = (n, cls) => typeof RESICON !== 'undefined' && RESICON[n] ? resSvg(n, cls) : `<svg viewBox="0 0 24 24" fill="none" stroke="${ICOL[n] || 'currentColor'}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" ${cls ? 'class="' + cls + '"' : ''}>${ICON[n]}</svg>`;
const UI = {
  page: 'map', drawer: null, dt: { more: 'menu', desk: 'train', hero: 'forge', alliance: 'throne', mail: 'rep', march: 'cols' }, sheet: null,
  comp: { inf: 0, arm: 0, air: 0, siege: 0, hero: false }, rcomp: { inf: 0, arm: 0, air: 0, siege: 0, hero: false },
  tr: { cls: 'inf', tier: 1, n: 0 }, wl: { cls: 'sent', tier: 1, n: 0 }, lab: 'combat', med: 'depot', fg: 3,
  cr: { slot: 'weapon', sel: {}, shard: '', stat: 'training' }, rl: { target: 'citadel', wait: 0, slots: 0 }, sel: null, dirty: true, ready: {}, flyAt: 0, chips: '', plate: '', pills: '', qbar: '', prod: '', dbtn: ''
};

/* ---------------- feedback: toast, tone, haptics ---------------- */
let actx = null;
const setOn = k => !(S && S.set) || S.set[k] !== false;
function toast(m, k) { const t = document.createElement('div'); t.className = 'toast ' + (k || ''); t.textContent = m; const box = $('#toasts'); box.appendChild(t); while (box.children.length > 4) box.firstChild.remove(); setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 260); }, 3400); }
function beep(f, d, v, type) { if (!setOn('snd')) return; try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const o = actx.createOscillator(), g = actx.createGain(); o.type = type || 'sine'; o.frequency.value = f; g.gain.value = v; g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + d); o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + d); } catch (e) { } }
function tone() { beep(880, 0.14, 0.05, 'square'); }
function snd() { beep(1500, 0.035, 0.03); }
function hap(p) { if (!setOn('hap')) return; try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { } }
function flash(kind) { const a = $('#alarm'); a.classList.remove('flash'); void a.offsetWidth; a.classList.add('flash'); hap([70, 50, 70, 50, 90]); tone(); setTimeout(() => a.classList.remove('flash'), 2800); }
UIH.toast = toast; UIH.tone = tone; UIH.flash = flash; UIH.dirty = () => { UI.dirty = true; };
UIH.done = j => {
  const first = b => { for (const ar of ['in', 'out']) { const i = S.plots[ar].findIndex(p => p && p.b === b && p.l > 0); if (i >= 0) return ar + i; } return null; };
  let k = null, txt = '✓';
  if (j.kind === 'build') { k = j.area + j.idx; txt = 'L' + j.to; } else if (j.kind === 'train') { k = first('mil'); txt = '+' + j.n; } else if (j.kind === 'res') { k = first('tech'); txt = 'Done'; } else if (j.kind === 'heal') { k = first('depot'); txt = '+' + j.n; } else if (j.kind === 'wall') { k = first('defense'); txt = '+' + j.n; }
  if (k) UI.ready[k] = txt; hap([12, 40, 12]); beep(660, 0.12, 0.04); beep(990, 0.16, 0.04);
};
const D = () => { UI.dirty = true; };
function run(e, ok) { if (e) { toast(e, 'warn'); hap([30, 40, 30]); } else { if (ok) toast(ok, 'good'); hap(14); } D(); return !e; }
const tm = (end, both) => end > 1e15 ? '<span class="mut">on station</span>' : `<span class="t num" data-end="${end}" data-b="${both ? 1 : 0}">${tmText(end, both)}</span>`;
function tmText(end, both) { const s = Math.max(0, (end - Date.now()) / 1000); return fmtT(s) + (both ? ' <span class="mut">(' + fmtT(s * DRILL) + ' sheet)</span>' : ''); }
const dualT = sheet => `${fmtT(sheet)} sheet · <b class="br">${fmtT(sheet / DRILL)}</b>`;
const costTxt = c => Object.keys(c).filter(r => c[r] > 0).map(r => `<span class="${S.res[r] + 0.5 < c[r] ? 'sg' : ''}">${svg(r, 'ic')}${fmtN(c[r])}</span>`).join(' ');
const ic = 'style="width:13px;height:13px;vertical-align:-2px"';
function costHTML(c) { return Object.keys(c).filter(r => c[r] > 0).map(r => `<span class="${gapOf(c, r) ? 'sg' : ''}">${resSvg(r).replace('<svg', '<svg ' + ic)} ${fmtN(c[r])}</span>`).join(' '); }
function gapOf(c, r) { return Math.floor(S.res[r]) < c[r]; }
function payBtn(cost, act, data, label, cls) {
  const g = gaps(cost), d = g ? diaFor(g) : 0; const dd = Object.entries(data).map(([k, v]) => `data-${k}="${v}"`).join(' ');
  if (!g) return `<button class="btn ${cls || 'pri'}" data-a="${act}" ${dd}>${label}</button>`;
  return `<button class="btn line" data-a="${act}" ${dd} data-cover="1" ${S.dia < d ? 'disabled' : ''}>${label} · cover ${d}${svg('dia', 'ic').replace('<svg', '<svg ' + ic)}</button>`;
}
function jobCtl(j) {
  const rush = rushCost(j.end), slips = S.slips.s5 + S.slips.s60 + S.slips.s480, cap = helpCap(), canHelp = j.kind !== 'march';
  return `<div class="flex wrap mt"><span>${tm(j.end, true)}</span>
  <button class="btn sm" data-a="rush" data-id="${j.id}" ${S.dia < rush ? 'disabled' : ''}>Rush ${rush}◆</button>
  <button class="btn sm" data-a="slip" data-id="${j.id}" ${slips ? '' : 'disabled'}>Slip (${slips})</button>
  ${canHelp && j.ask !== undefined ? `<button class="btn sm" data-a="help" data-id="${j.id}" ${j.ask ? 'disabled' : ''}>${j.ask ? 'Help ' + j.helps + '/' + cap : 'Ask help'}</button>` : ''}</div>`;
}
function ownerTxt(o) { return o == null ? 'neutral' : `<span style="color:${alColor(o)}">${S.al[o].tag} ${S.al[o].n}</span>`; }
function previewCol(c) { const col = {}; for (const cl of CLS) { let n = c[cl] || 0; for (let t = 4; t >= 1 && n > 0; t--) { const a = Math.min(n, S.troops[cl + t] || 0); if (a) { col[cl + t] = a; n -= a; } } } return col; }
function estOut(kind, tx, ty, c) {
  const col = previewCol(c); if (!sumCol(col)) return null; const st = colStats(col);
  const dist = Math.hypot(tx - S.base.x, ty - S.base.y), f = forestTiles(S.base.x, S.base.y, tx, ty);
  return { ms: legMs(dist, st.speed, f), f, st, col };
}
function oddsText(D_, col, hero) { if (!sumCol(col)) return ''; const r = fight(attackerSide(col, hero), D_); const q = r.q; return q > 4 ? '<span class="ox">Overwhelming</span>' : q > 1.6 ? '<span class="ox">Favourable</span>' : q > 0.8 ? '<span class="br">Even</span>' : q > 0.35 ? '<span class="sg">Poor</span>' : '<span class="sg">Suicide</span>'; }


/* ---------------- HUD: top bar, ticker, dock, map chips ---------------- */
function watchPhrase() { const h = new Date().getHours(); return h >= 5 && h < 8 ? ['Dawn wash', 'dawn'] : h >= 8 && h < 17 ? ['Day watch', 'day'] : h >= 17 && h < 20 ? ['Dusk wash', 'dusk'] : ['Night telemetry', 'night']; }
const CHIP_ORDER = ['rations', 'fuel', 'alloy', 'power', 'cash'];
const ago = ms => fmtT(Math.max(0, ms) / 1000);
const HUDTXT = { build: 'Constructing', train: 'Training', res: 'Researching', heal: 'Healing', wall: 'Crewing wall' };
function powerScore() { let p = 0; for (const k in S.troops) p += S.troops[k] * (+k.slice(-1) || 1) * 4; for (const ar of ['in', 'out']) for (const b of S.plots[ar]) if (b) p += b.l * 60; return p + S.hero.rank * 300; }
function renderTop() {
  const [ph, cl] = watchPhrase(); document.body.className = 'wash-' + cl;
  const now = Date.now(), L = ccLevel(), cap = storeCap(), hr = hourly(), hero = HEROES[S.hero.id];
  const port = `${heroSVG(S.hero.id)}<i class="lvl num">${L}</i>${S.hero.captured || S.incoming.length ? '<em class="dot"></em>' : ''}`;
  if (port !== UI.plate) { UI.plate = port; $('#port').innerHTML = port; }
  const sh = S.shield.until > now, pw = `<span class="pl">Power</span><b class="num">${fmtN(powerScore())}</b><span class="ps">${sh ? 'Shield ' + ago(S.shield.until - now) : 'No shield'} · ${S.incoming.length ? '<em class="sg">' + S.incoming.length + ' inbound ' + ago(Math.min(...S.incoming.map(i => i.end)) - now) + '</em>' : 'Radar clear'}</span>`;
  if (pw !== UI.pills) { UI.pills = pw; $('#power').innerHTML = pw; }
  $('#power').classList.toggle('alert', S.incoming.length > 0);
  const db = `${svg('dia')}<b class="num">${fmtN(S.dia)}</b><em>+</em>`; if (db !== UI.dbtn) { UI.dbtn = db; $('#dbtn').innerHTML = db; }
  const html = CHIP_ORDER.map(r => { const f = S.res[r] / cap, full = f >= 0.97; return `<button class="chip ${full ? 'full' : ''}" data-a="drawer" data-id="hero" data-tab="store" title="${RESN[r]} ${fmtN(S.res[r])} / ${fmtN(cap)}">${svg(r)}<b class="num">${fmtN(S.res[r])}</b><small class="num">${full ? 'FULL' : '+' + fmtN(hr[r] || 0) + '/h'}</small><i class="mtr"><u style="width:${Math.min(100, f * 100).toFixed(0)}%;background:${ICOL[r]}"></u></i></button>`; }).join('');
  if (html !== UI.chips) { UI.chips = html; $('#chips').innerHTML = html; }
  $('#alarm').classList.toggle('on', S.incoming.length > 0);
  const set = setBonus(), au = $('#aura'); if (set) { au.className = 'on'; au.style.boxShadow = `inset 0 0 0 2px ${SETS[set].aura}66, inset 0 0 40px ${SETS[set].aura}33`; } else au.className = '';
}
/* production bar: the job that finishes first, with Speed Up like the reference HUD */
function renderTicker() {
  const now = Date.now(), js = S.jobs.slice().sort((a, b) => a.end - b.end), show = UI.moreJobs ? js : js.slice(0, 2);
  const row = j => { const f = clamp((now - j.start) / Math.max(1, j.end - j.start), 0, 1); return `<div class="prow"><div class="pbar"><u style="width:${(f * 100).toFixed(1)}%"></u><span>${HUDTXT[j.kind] || j.kind} ${j.why || ''}</span><b class="num">${ago(j.end - now)}</b></div><button class="speed" data-a="rush" data-id="${j.id}">Speed Up</button></div>`; };
  let h = show.map(row).join('');
  if (js.length > 2) h += `<button class="more" data-a="morejobs">${UI.moreJobs ? 'Less ▲' : js.length - 2 + ' More ▼'}</button>`;
  if (!js.length) h = `<div class="prow"><div class="pbar idle"><span>Queues idle</span></div><button class="speed go" data-a="wing" data-w="train">Train</button></div>`;
  if (h !== UI.prod) { UI.prod = h; $('#prod').innerHTML = h; }
}
/* bottom: tips banner (next thing to do) and alliance chat strip */
function tipNow() {
  const now = Date.now(); if (S.incoming.length) { const i = S.incoming.slice().sort((a, b) => a.end - b.end)[0]; return [`Incoming ${i.rally ? 'rally' : 'attack'} from ${i.name}: ${ago(i.end - now)}`, 'data-a="dock" data-k="base"', 1]; }
  if (!S.jobs.some(j => j.kind === 'build')) return ['Build queue empty. Upgrade a building.', 'data-a="dock" data-k="base"']; if (!S.jobs.some(j => j.kind === 'train')) return ['Barracks idle. Train troops.', 'data-a="wing" data-w="train"'];
  if (!S.jobs.some(j => j.kind === 'res')) return ['Lab idle. Start a research.', 'data-a="wing" data-w="lab"']; if (!S.marches.length) return ['Hunt a monster pack to win a rich vein.', 'data-a="dock" data-k="map"'];
  return ['Eliminate the nearest raider camp.', 'data-a="dock" data-k="map"'];
}
function renderQueues() {
  const [t, act, hot] = tipNow(), log = S.log.slice(0, 2);
  const html = `<button class="tips ${hot ? 'hot' : ''}" ${act}><i>TIPS</i><span>${t}</span></button><div class="chat"><svg viewBox="0 0 24 24" class="cico"><path d="M4 5h16v11H9l-5 4z" fill="#5ec4d4" stroke="#0e1113" stroke-width="1.4"/></svg><div>${log.length ? log.map(l => `<p><b>SYSTEM:</b> ${l.m}</p>`).join('') : '<p><b>SYSTEM:</b> All quiet.</p>'}</div><button class="btn sm pri2" data-a="dock" data-k="alliance" aria-label="Alliance">${svg('alliance').replace(/stroke="[^"]+"/, 'stroke="currentColor"')}</button></div>`;
  if (html !== UI.qbar) { UI.qbar = html; $('#qbar').innerHTML = html; }
}
const TABS = [['map', 'World Map'], ['base', 'Base'], ['hero', 'Hero'], ['alliance', 'Alliance'], ['mail', 'Mail'], ['more', 'More']];
function renderDock() {
  const cur = ['hero', 'alliance', 'mail', 'more'].includes(UI.drawer) ? UI.drawer : UI.page, unread = S.reports.filter(r => r.id > (S.readTo || 0)).length;
  $('#dock').innerHTML = TABS.map(([k, n]) => `<button data-a="dock" data-k="${k}" class="${cur === k ? 'on' : ''}">${svg(k).replace(/stroke="[^"]+"/, 'stroke="currentColor"')}${k === 'mail' && unread ? `<em class="bdg">${Math.min(unread, 9)}</em>` : ''}${k === 'base' && Object.keys(UI.ready).length ? `<em class="bdg ok">${Math.min(Object.keys(UI.ready).length, 9)}</em>` : ''}${k === 'hero' && S.hero.captured ? `<em class="bdg">!</em>` : ''}${k === 'alliance' && S.incoming.some(i => i.rally) ? `<em class="bdg">!</em>` : ''}<span>${n}</span></button>`).join('');
  $('#mapchips').innerHTML = `<button class="btn sm glass" data-a="jump" data-k="b">Base</button><button class="btn sm glass" data-a="jump" data-k="t">Throne</button>`;
}

/* ---------------- composer ---------------- */
function compHTML(cn) {
  const c = UI[cn], cap = cn === 'rcomp' ? Math.min(headcount(), rallyCap()) : headcount(), tot = compTotal(c);
  const rows = CLS.map(k => `<div class="flex sp" style="margin:4px 0"><i class="ui">${unitSVG(k, 2, { plate: false })}</i><span class="lbl" style="width:78px">${CLSD[k].n}</span><span class="t mut grow">/${fmtN(clsAvail(k))}</span><div class="step"><button data-a="cstep" data-cn="${cn}" data-c="${k}" data-d="-100">«</button><button data-a="cstep" data-cn="${cn}" data-c="${k}" data-d="-10">−</button><b class="num">${c[k]}</b><button data-a="cstep" data-cn="${cn}" data-c="${k}" data-d="10">+</button><button data-a="cstep" data-cn="${cn}" data-c="${k}" data-d="100">»</button></div></div>`).join('');
  const hero = HEROES[S.hero.id], hb = `<button class="btn sm ${c.hero ? 'on' : 'line'}" data-a="chero" data-cn="${cn}" ${S.hero.captured || heroLocked() ? 'disabled' : ''}>${c.hero ? '✓ ' : ''}Take ${hero.n}</button>`;
  const out = S.marches.filter(m => m.kind !== 'scout').length;
  return `<div class="lbl mt">Column ${tot}/${fmtN(cap)} · Marches ${out}/${marchQueues()}</div>${rows}<div class="flex wrap mt"><button class="btn sm" data-a="best" data-cn="${cn}">Best column</button><button class="btn sm line" data-a="clear" data-cn="${cn}">Clear</button>${hb}</div>`;
}

/* ---------------- tile sheet ---------------- */
function tileLabel(t) {
  if (t.kind === 'node') return `${({ food: 'Food', oil: 'Oil', energy: 'Energy', steel: 'Steel' })[t.nk]} vein${t.node.rich ? ' · rich' : ''}`;
  return ({ wild: 'Wild plain', forest: 'Forest', plaza: 'Plaza', throne: 'Throne', monster: 'Monster pack', camp: 'Camp', base: 'Commander base', pbase: 'Your base' })[t.kind];
}
function sheetTile(x, y) {
  const t = tileInfo(x, y), c = UI.comp, tot = compTotal(c), col = previewCol(c);
  const spr = t.kind === 'monster' ? FEAT.monster(t.grade) : t.kind === 'camp' ? FEAT.camp() : t.kind === 'node' ? FEAT[t.nk === 'food' ? 'food' : t.nk === 'oil' ? 'oil' : t.nk === 'energy' ? 'energy' : 'steel'](t.node.grade) : t.kind === 'base' ? FEAT.base() : t.kind === 'pbase' ? FEAT.pbase(ccLevel()) : null;
  let img = ''; try { if (spr) img = `<div class="tport"><img src="${spr.toDataURL()}" alt=""><i class="num">${t.grade ? 'Lv ' + t.grade : ''}</i></div>`; } catch (e) { }
  const dist = Math.hypot(x - S.base.x, y - S.base.y);
  let h = `<button class="xclose" data-a="closesheet" aria-label="Close">✕</button><div class="h1">${tileLabel(t)}</div><div class="sub">${t.kind === 'base' ? t.bot.cmd + ' · ' : ''}Grade ${t.grade}</div><div class="coord"><b class="num">X:${x} Y:${y}</b><button class="btn sm share" data-a="sharexy" data-x="${x}" data-y="${y}" aria-label="Copy coordinates">⧉</button></div><div class="tinfo">${img}<div class="grow"><div class="rr"><span class="mut">Ownership</span><span class="num">${ownerTxt(t.owner)}</span></div><div class="rr"><span class="mut">Distance</span><span class="num">${dist.toFixed(1)} tiles</span></div>${t.kind === 'base' ? `<div class="rr"><span class="mut">Owner</span><span class="num">${t.bot.cmd}</span></div><div class="rr"><span class="mut">Alliance</span><span class="num">${ownerTxt(t.bot.al)}</span></div><div class="rr"><span class="mut">Shield</span><span class="num">${t.bot.shieldUntil > Date.now() ? 'Up' : 'Down'}</span></div>` : ''}${t.enc ? '<div class="rr"><span class="mut">Status</span><span class="num">Encamping</span></div>' : ''}</div></div>`;
  const acts = [];
  const eo = k => estOut(k, x, y, c);
  const eta = (k) => { const e = eo(k); return e ? `<div class="sub mt">Out <b class="num br">${fmtT(e.ms / 1000)}</b> · forest tiles ${e.f}${e.f ? ' (' + fmtT(e.f * 240) + ' sheet)' : ''} · speed ${Math.round(e.st.speed)}</div>` : ''; };
  if (t.kind === 'node') {
    h += `<div class="sub mt">Stock <b class="num">${fmtN(t.node.stock)}</b>/${fmtN(t.node.max)} ${RESN[t.node.res]} · full haul sits 8 drill seconds</div>`;
    const e = eo(); if (e) h += `<div class="sub">Column load <b class="num">${fmtN(e.st.load)}</b></div>`;
    h += compHTML('comp') + eta('gather') + `<div class="flex mt"><button class="btn pri tall grow" data-a="launch" data-k="gather" ${tot ? '' : 'disabled'}>Send gather</button></div>`;
  } else if (t.kind === 'monster' || t.kind === 'camp') {
    const camp = t.kind === 'camp', Dd = mkSide({}, {}, 1, null, monsterSyn(t.grade, camp));
    h += `<div class="sub mt">Odds ${oddsText(Dd, col, c.hero) || '—'} · a dead pack leaves a rich vein · hunting strips the shield</div>` + compHTML('comp') + eta('hunt') + `<div class="flex mt"><button class="btn pri tall grow" data-a="launch" data-k="hunt" ${tot ? '' : 'disabled'}>Send hunt</button></div>`;
  } else if (t.kind === 'wild' || t.kind === 'forest') {
    const tk = tpKind(x, y);
    if (t.owner === 0) h += `<div class="sub mt">Your alliance owns this tile. No encamp needed.</div>`;
    else { const pw = colStats(col).power, flip = t.owner != null || (t.enc && t.enc.o !== 0); h += `<div class="sub mt">Occupation ${dualScale(occDurMs(pw, flip))}${flip ? ' · enemy color ×2.6' : ''} · claim 10 · flip 25${flip ? ' · fights on arrival' : ''}</div>` + compHTML('comp') + eta('encamp') + `<div class="flex mt"><button class="btn pri tall grow" data-a="launch" data-k="encamp" ${tot ? '' : 'disabled'}>Encamp</button></div>`; }
    h += `<div class="flex mt wrap">${tk.err ? `<span class="sub">${tk.err}</span>` : `<button class="btn line" data-a="tp" data-x="${x}" data-y="${y}">${tk.kind === 'alliance' ? 'Alliance teleport' : tk.kind === 'advanced' ? 'Advanced teleport' : 'Teleport'}</button>${t.terr === 'forest' ? '<span class="sub">strips the shield</span>' : ''}`}</div>`;
  } else if (t.kind === 'base') {
    const b = t.bot, sh = b.shieldUntil > Date.now(); h += `<div class="sub mt">${b.cmd} · ${b.n} · ${sh ? 'shielded' : 'exposed'}</div>` + compHTML('comp') + eta('attack') + `<div class="flex mt wrap"><button class="btn pri grow" data-a="launch" data-k="attack" ${tot && !sh ? '' : 'disabled'}>Send strike</button><button class="btn line" data-a="scout" data-x="${x}" data-y="${y}">Scout</button><button class="btn line" data-a="rallyto" data-t="${b.al}">Rally</button></div>`;
  } else if (t.kind === 'throne') {
    const th = S.throne; h += `<div class="sub mt">${th.ruler != null ? alName(th.ruler) + ' rules · ' + (th.ruleUntil ? tm(th.ruleUntil, true) : '') : th.holder != null ? alName(th.holder) + ' holds · ' + tm(th.holdEnd, true) : th.neutral ? 'Neutral garrison: about 60 tier-2 infantry and 16 tier-1 armor.' : 'Empty.'}</div><div class="sub">Hold 6 sheet hours (72s) to rule 3 sheet days. Any alliance may put troops in.</div>` + compHTML('comp') + eta('throne') + `<div class="flex mt wrap"><button class="btn pri grow" data-a="launch" data-k="throne" ${tot && th.holder !== 0 ? '' : 'disabled'}>Assault and hold</button><button class="btn line" data-a="scout" data-x="${x}" data-y="${y}">Scout</button><button class="btn line" data-a="rallyto" data-t="citadel">Rally</button></div>`;
  } else if (t.kind === 'pbase') h += `<div class="sub mt">Command Center ${ccLevel()} · shield ${shieldOn() ? 'up' : 'down'}${inForest() ? ' · in the forest, shields do nothing' : ''}</div><div class="flex mt"><button class="btn" data-a="dock" data-k="base">Open base</button></div>`;
  else if (t.kind === 'plaza') h += `<div class="sub mt">Plaza. Nothing to take here.</div>`;
  return h;
}
function dualScale(ms) { return `${fmtT(ms / 1000 * OCC)} sheet · <b class="br">${fmtT(ms / 1000)}</b>`; }

/* ---------------- plot sheet ---------------- */
function effectText(b, l) {
  if (b === 'cc') return `Headcount ${fmtN(headcount())} · queues ${marchQueues()} · help clicks ${helpCap()}`;
  if (BLD[b].res) return `${fmtN(BLD[b].rate * l * mods().yld[BLD[b].res])} ${RESN[BLD[b].res]}/h sheet`;
  if (b === 'treasury') return `${fmtN(480 * l)} Cash/h sheet`;
  if (b === 'store') return `Cap ${fmtN(storeCap())} · protected ${fmtN(protectedFloor())}`;
  if (b === 'depot') return `Beds ${woundedTotal()}/${fmtN(bedCap())}`;
  if (b === 'mil') return `Batch cap ${batchCap(1)} at tier 1`;
  if (b === 'defense') return `Crew cap ${l * 40}`;
  if (b === 'radar') return `Wall base HP ${fmtN(1400 * l)} · scan up to ${l}`;
  if (b === 'hall') return `Rally of ${fmtN(4000 * l)} · orders ${S.orders}/${l}`;
  if (b === 'prison') return `Restraint seals ${S.seals}/${l}`;
  return '';
}
function sheetPlot(area, idx) {
  const p = S.plots[area][idx], job = S.jobs.find(j => j.kind === 'build' && j.area === area && j.idx === idx);
  let h = '';
  if (!p) {
    h = `<div class="flex sp"><div class="h1">Empty plot</div><button class="btn sm line" data-a="closesheet">Close</button></div><div class="sub mb">Pick a building. Command Center is the level ceiling.</div><div class="list">`;
    for (const b of (area === 'in' ? INNER_KEYS : OUTER_KEYS)) { if (BLD[b].unique) continue; h += `<div class="it"><div class="grow"><b class="h" style="font-size:16px">${BLD[b].n}</b><div class="sub">${costHTML(buildCost(b, 1))} · ${dualT(buildSheetSec(b, 1) / (1 + mods().build))}</div></div>${payBtn(buildCost(b, 1), 'build', { area, idx, b }, 'Build')}</div>`; }
    return h + '</div>';
  }
  const d = BLD[p.b], to = p.l + 1;
  h = `<div class="flex"><div class="pv">${bldSVG(p.b, p.l)}</div><div class="grow"><div class="h1">${d.n} <span class="br num">${p.l}</span></div><div class="sub">${area === 'in' ? 'Inner' : 'Outer'} plot ${idx + 1} · ${['Empty lot', 'Makeshift', 'Concrete', 'Reinforced', 'Advanced', 'Fortified'][tierOf(p.l)]}</div><div class="sub">${effectText(p.b, p.l)}</div></div><button class="btn sm line" data-a="closesheet">Close</button></div>`;
  if (job) h += `<div class="panel mt"><div class="bd"><div class="lbl">Building to level ${job.to}</div>${jobCtl(job)}</div></div>`;
  else {
    const err = buildErr(area, idx, p.b);
    if (err) h += `<div class="sub mt sg">${err}</div>`;
    else h += `<div class="mt"><div class="lbl">Upgrade to ${to}</div><div class="mb">${costHTML(buildCost(p.b, to))}</div><div class="sub mb">${dualT(buildSheetSec(p.b, to) / (1 + mods().build))}</div>${payBtn(buildCost(p.b, to), 'build', { area, idx }, 'Upgrade')}</div>`;
  }
  if (d.wing) h += `<div class="flex mt"><button class="btn line" data-a="wing" data-w="${d.wing}">Open ${({ train: 'Train', lab: 'Lab', med: 'Med', wall: 'Wall', rally: 'Rally', market: 'Market' })[d.wing]}</button></div>`;
  if (p.b === 'radar') h += `<div class="flex mt"><button class="btn ${S.anti ? 'on' : 'line'}" data-a="anti" ${p.l >= 4 ? '' : 'disabled'}>Anti-Scout ${S.anti ? 'on' : 'off'}</button><span class="sub">${p.l >= 4 ? 'Blocked scouts are named, no garrison data.' : 'Needs Radar Station 4.'}</span></div>`;
  if (p.b === 'hall') h += `<div class="flex mt"><span class="sub">Orders ${S.orders}/${p.l}</span><button class="btn sm" data-a="buyorders">5 orders · 80◆</button></div>`;
  if (p.b === 'prison') h += `<div class="flex mt"><span class="sub">Seals ${S.seals}/${p.l}</span><button class="btn sm" data-a="buyseals">5 seals · 60◆</button></div>`;
  return h;
}
function sheetReport(id) {
  const r = S.reports.find(x => x.id === id); if (!r) return '<div class="sub">Report gone.</div>';
  const side = (s, cl) => `<div class="${cl}"><div class="lbl">${s.name}</div>${s.rows.map(x => `<div class="rr"><span class="wi">${nameIcon(x[0])}${x[0]}</span><span class="num">${typeof x[1] === 'number' ? x[1] + (x[2] ? ' <span class="sg">−' + x[2] + '</span>' : '') : x[1]}</span></div>`).join('')}<div class="lbl mt">Boosts</div>${s.boosts.map(x => `<div class="rr"><span>${x[0]}</span><span class="num">${x[1]}</span></div>`).join('') || '<div class="sub">—</div>'}</div>`;
  let wtxt = ''; const wn = r.left.rows.reduce((a, x) => a + (x[3] || 0), 0); if (wn) wtxt = ` · wounded ${wn}`;
  return `<div class="flex sp"><div><div class="h1">${r.title}</div><div class="sub">${r.win == null ? 'Intel' : r.win ? '<span class="ox">Victory</span>' : '<span class="sg">Defeat</span>'}${r.obl ? ' · obliterated' : ''}${wtxt}</div></div><button class="xclose" data-a="closesheet" aria-label="Close">✕</button></div><div class="sub">${new Date(r.t).toLocaleString()}</div><div class="split mt">${side(r.left, 'me')}${side(r.right, 'them')}</div>${r.joiners ? `<div class="lbl mt">Joiners</div>${r.joiners.map(j => `<div class="rr"><span>${j.name}</span><span class="num">${j.sent} sent · <span class="sg">−${j.lost}</span> · wounded ${j.wounded}</span></div>`).join('')}` : ''}<div class="flex sp mt"><button class="btn pri" data-a="rsave" data-id="${r.id}" data-close="1">${r.saved ? 'Saved ★' : 'Save'}</button><button class="btn dangr" data-a="rdel" data-id="${r.id}">Delete</button></div>`;
}
function renderSheet() {
  const el = $('#sheet'), s = UI.sheet, open = !!s && !UI.drawer;
  if (open) el.innerHTML = s.type === 'tile' ? sheetTile(s.x, s.y) : s.type === 'plot' ? sheetPlot(s.area, s.idx) : s.type === 'report' ? sheetReport(s.id) : s.type === 'iap' ? sheetIap(s.id) : '';
  el.classList.toggle('on', open);
  $('#scrim').classList.toggle('on', open || !!UI.drawer);
}

/* ---------------- base scene ---------------- */
const RING_C = 94.25;
const icoStroke = n => svg(n).replace(/stroke="[^"]+"/, 'stroke="currentColor"');
function ringHTML(j, pos, icon) {
  const f = clamp((Date.now() - j.start) / Math.max(1, j.end - j.start), 0, 1);
  return `<svg class="ring ${pos}" viewBox="0 0 36 36" data-rs="${j.start}" data-re="${j.end}"><circle cx="18" cy="18" r="16" class="rbg"/><circle cx="18" cy="18" r="15" class="rfg" stroke-dasharray="${RING_C}" stroke-dashoffset="${(RING_C * (1 - f)).toFixed(1)}"/><g transform="translate(10 10) scale(.66)" fill="none" stroke="#e7e4da" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${ICON[icon]}</g></svg>`;
}
const QUEUE_OF = { mil: ['train', 'train'], tech: ['res', 'lab'], depot: ['heal', 'med'], defense: ['wall', 'med'] };
function plotHTML(ar, i, firsts) {
  const p = S.plots[ar][i], outer = ar === 'out';
  if (!p) return `<button class="plot empty ${outer ? 'fld' : 'cnc'}" data-a="plot" data-ar="${ar}" data-i="${i}">${emptyPlotSVG(outer)}</button>`;
  const bj = S.jobs.find(j => j.kind === 'build' && j.area === ar && j.idx === i), q = QUEUE_OF[p.b] && firsts[p.b] === ar + i ? S.jobs.find(j => j.kind === QUEUE_OF[p.b][0]) : null, rdy = UI.ready[ar + i];
  return `<button class="plot ${outer ? 'fld' : 'cnc'} ${bj ? 'busy' : ''} ${p.l >= 25 ? 'max' : ''}" data-a="plot" data-ar="${ar}" data-i="${i}" title="${BLD[p.b].n}">${bldSVG(p.b, p.l)}<span class="lv num">${p.l}</span><span class="nm">${BLD[p.b].n}</span>${bj ? ringHTML(bj, 'tr', 'base') : ''}${q ? ringHTML(q, 'tl', QUEUE_OF[p.b][1]) : ''}${rdy ? `<span class="bub">${rdy}</span>` : ''}</button>`;
}
function renderBase() {
  const hr = hourly(), firsts = {}; for (const ar of ['in', 'out']) S.plots[ar].forEach((p, i) => { if (p && p.l > 0 && !firsts[p.b]) firsts[p.b] = ar + i; });
  const grid = ar => S.plots[ar].map((_, i) => plotHTML(ar, i, firsts)).join(''), f = shieldOn(), fs = inForest();
  $('#pg-base').innerHTML = `
  <div class="qs"><button class="btn sm" data-a="drawer" data-id="desk" data-tab="train">${icoStroke('train')}Train</button><button class="btn sm" data-a="drawer" data-id="desk" data-tab="lab">${icoStroke('lab')}Lab</button><button class="btn sm" data-a="wing" data-w="med">${icoStroke('med')}Med</button><button class="btn sm" data-a="wing" data-w="wall">Wall</button><button class="btn sm" data-a="wing" data-w="rally">Rally</button></div>
  <div class="zone cnc"><div class="zt">Command zone · inner compound</div><div class="grid5">${grid('in')}</div></div>
  <div class="zone fld"><div class="zt">Fields and industry · outer ring</div><div class="grid5">${grid('out')}</div></div>
  <div class="panel"><div class="hd"><h3>Command Center ${ccLevel()}</h3><span class="tag br">${S.al[0].tag}</span></div><div class="bd">
    <div class="split"><div><div class="lbl">Headcount</div><div class="big num">${fmtN(headcount())}</div></div><div><div class="lbl">March queues</div><div class="big num">${marchQueues()}</div></div><div><div class="lbl">Help clicks</div><div class="big num">${helpCap()}</div></div><div><div class="lbl">StoreHouse</div><div class="big num">${fmtN(storeCap())}</div><div class="sub">protected ${fmtN(protectedFloor())}</div></div></div>
    <div class="sub mt">Per hour, sheet: ${RES.filter(r => hr[r]).map(r => `${RESN[r]} ${fmtN(hr[r])}`).join(' · ')}. Runs at ×${DRILL}.</div>
    <div class="flex wrap mt"><button class="btn ${f ? 'on' : 'line'}" data-a="shield">Peace shield ${S.shield.until > Date.now() ? (fs ? 'up (dead in forest)' : 'up') : 'off'}</button><button class="btn line" data-a="builder2" ${S.builders >= 2 ? 'disabled' : ''}>${S.builders >= 2 ? 'Two builders' : 'Second builder · 220◆'}</button><button class="btn line" data-a="tpr" ${heroLocked() ? 'disabled' : ''}>Random teleport</button></div>
    ${heroLocked() ? '<div class="sub mt sg">A hero is out. The base cannot teleport.</div>' : ''}
  </div></div>`;
}
function spawnFly() {
  if (UI.page !== 'base' || UI.drawer || UI.sheet) return;
  const els = [...document.querySelectorAll('.plot:not(.empty)')].filter(e => { const p = S.plots[e.dataset.ar][+e.dataset.i]; return p && p.l > 0 && (BLD[p.b].res || p.b === 'treasury'); });
  if (!els.length) return; const e = els[Math.floor(Math.random() * els.length)], p = S.plots[e.dataset.ar][+e.dataset.i], r = BLD[p.b].res || 'cash', m = mods();
  const amt = Math.round((BLD[p.b].rate || 480) * p.l * m.yld[r] / 3600 * DRILL * 6), s = document.createElement('span'); s.className = 'fly'; s.innerHTML = `+${fmtN(amt)} ${svg(r).replace('<svg', '<svg width="12" height="12"')}`; e.appendChild(s); setTimeout(() => s.remove(), 1700);
}

/* ---------------- desk: train, lab, med ---------------- */
function stepper(act, d, val, extra) { return `<div class="step"><button data-a="${act}" ${extra || ''} data-d="-100">«</button><button data-a="${act}" ${extra || ''} data-d="-10">−</button><b class="num">${val}</b><button data-a="${act}" ${extra || ''} data-d="10">+</button><button data-a="${act}" ${extra || ''} data-d="100">»</button></div>`; }
function renderTrain() {
  const T = UI.tr, cls = T.cls, t = T.tier, cap = batchCap(t); T.n = clamp(T.n, 0, cap);
  const gate = trainGate(t), c = trainCost(cls, t); const cc = {}; for (const r in c) cc[r] = c[r] * T.n; const job = jobsOf('train')[0];
  let h = `<div class="tabs2">${CLS.map(k => `<button class="${k === cls ? 'on' : ''}" data-a="trcls" data-c="${k}"><i class="tic">${unitSVG(k, 2, { plate: false })}</i>${CLSD[k].n}</button>`).join('')}</div>
  <div class="tabs2">${[1, 2, 3, 4].map(x => `<button class="${x === t ? 'on' : ''}" data-a="trtier" data-t="${x}">T${x}${trainGate(x) ? ' ·' : ''}</button>`).join('')}</div>
  <div class="panel"><div class="hd"><h3>${tierName(cls, t)}</h3><span class="tag">${CLSD[cls].n} T${t}</span></div><div class="bd"><div class="uart">${unitSVG(cls, t)}</div>
   ${(() => { const s = unitStat(cls, t); return `<div class="sub">Attack ${s.atk.toFixed(0)} · HP ${s.hp.toFixed(0)} · load ${s.load.toFixed(0)} · speed ${Math.round(s.speed)} · ${cls === 'siege' ? 'wall factor 2.2, 0.28 vs field' : `beats ${CLSD[CLSD[cls].beats].n}, loses to ${CLSD[CLSD[cls].loses].n}`}</div>`; })()}
   <div class="sub mt">Per troop: ${dualT(CLSD[cls].train[t - 1])}</div>
   ${gate ? `<div class="sub mt sg">${gate}</div>` : `<div class="flex sp mt"><span class="lbl">Batch (cap ${cap})</span>${stepper('trn', 0, T.n)}</div>
   <div class="mt">${costHTML(cc)}</div><div class="sub mt">Batch time ${dualT(trainSheet(cls, t, T.n))}</div>
   <div class="flex mt wrap"><button class="btn sm line" data-a="trmax">Max</button>${payBtn(cc, 'train', {}, 'Train', 'pri')}</div>`}
  </div></div>`;
  if (job) h += `<div class="panel"><div class="bd"><div class="lbl">Training ${job.why}</div>${jobCtl(job)}</div></div>`;
  h += `<div class="panel"><div class="hd"><h3>Garrison</h3></div><div class="bd">${CLS.map(k => [1, 2, 3, 4].filter(x => S.troops[k + x]).map(x => `<div class="rr"><span class="wi"><i class="ui">${unitSVG(k, x, { plate: false })}</i>${tierName(k, x)}</span><span class="num">${S.troops[k + x]}</span></div>`).join('')).join('') || '<div class="sub">Empty.</div>'}</div></div>`;
  return h;
}
function labNode(id) {
  const d = RS[id], lv = R(id), g = researchGate(id), active = jobsOf('res')[0];
  const cur = d.a || d.b ? `+${(rv(id) * 100).toFixed(1).replace(/\.0$/, '')}%` : (id === 'recon' ? 'scan ' + lv : lv ? 'done' : '—');
  const to = lv + 1, cost = to <= d.max ? researchCost(id, to) : null;
  return `<div class="panel"><div class="bd"><div class="flex sp"><b class="h" style="font-size:17px">${d.n}</b><span class="tag ${lv ? 'br' : ''}">${lv}/${d.max}</span></div><div class="sub">${d.what} · now ${cur}${d.req.length ? ' · needs ' + d.req.map(([r, l]) => RS[r].n + ' ' + l).join(', ') : ''}</div>
  ${cost ? `<div class="mt">${costHTML(cost)}</div><div class="sub mt">${dualT(researchSheetSec(id, to))}</div><div class="mt">${g ? `<span class="sub sg">${g}</span>` : active ? '<span class="sub">The lab is busy.</span>' : payBtn(cost, 'research', { id }, 'Research')}</div>` : ''}</div></div>`;
}
function renderLab() {
  const job = jobsOf('res')[0];
  let h = `<div class="tabs2">${TREES.map(([k, n]) => `<button class="${UI.lab === k ? 'on' : ''}" data-a="labtab" data-k="${k}">${n}</button>`).join('')}</div>`;
  if (job) h += `<div class="panel"><div class="bd"><div class="lbl">Researching ${job.why}</div>${jobCtl(job)}</div></div>`;
  return h + Object.keys(RS).filter(id => RS[id].tree === UI.lab).map(labNode).join('');
}
function renderMed() {
  let h = `<div class="tabs2"><button class="${UI.med === 'depot' ? 'on' : ''}" data-a="medtab" data-k="depot">Depot</button><button class="${UI.med === 'wall' ? 'on' : ''}" data-a="medtab" data-k="wall">Wall</button></div>`;
  if (UI.med === 'depot') {
    const beds = bedCap(), used = woundedTotal(), job = jobsOf('heal')[0];
    h += `<div class="panel"><div class="bd"><div class="flex sp"><span class="lbl">Beds</span><b class="num">${used}/${fmtN(beds)}</b></div><div class="bar mt ${used >= beds ? '' : 'ox'}"><i style="width:${Math.min(100, used / Math.max(1, beds) * 100)}%"></i></div><div class="sub mt">Heal costs 40% of train cost. Tier 1 heals at once. Tier 2–4 take half their train time on one queue. A full depot kills the overflow.</div></div></div>`;
    if (job) h += `<div class="panel"><div class="bd"><div class="lbl">Healing ${job.why}</div>${jobCtl(job)}</div></div>`;
    const rows = Object.keys(S.wounded).filter(k => S.wounded[k] > 0).map(k => { const [c, t] = ckSplit(k), n = S.wounded[k], cost = healCost(c, t, n); return `<div class="panel"><div class="bd"><div class="flex sp"><span class="wi"><i class="ui">${unitSVG(c, t, { plate: false })}</i><b class="h" style="font-size:17px">${tierName(c, t)}</b></span><span class="num">${n} wounded</span></div><div class="mt">${costHTML(cost)}</div><div class="flex mt wrap">${t > 1 ? `<span class="sub">${dualT(CLSD[c].train[t - 1] * n * .5 / (1 + mods().heal + rv('repair')))}</span>` : '<span class="sub">instant</span>'}${payBtn(cost, 'heal', { k }, 'Heal all')}</div></div></div>`; }).join('');
    h += rows || '<div class="sub">Nobody wounded.</div>';
  } else {
    const W_ = UI.wl, ws = wallStats(), cap = lvlMax('defense') * 40, job = jobsOf('wall')[0];
    const room = cap - sumCol(S.wall) - (job ? job.n : 0), t = W_.tier; W_.n = clamp(W_.n, 0, Math.max(0, room));
    const cost = {}; for (const r in WALL_COST) cost[r] = Math.round(WALL_COST[r] * WT[t - 1].pow * W_.n / 2);
    h += `<div class="panel"><div class="bd"><div class="split"><div><div class="lbl">Wall HP</div><div class="big num">${fmtN(ws.hp)}</div></div><div><div class="lbl">Wall attack</div><div class="big num">${fmtN(ws.atk)}</div></div></div><div class="sub mt">Radar Station ${lvlMax('radar')} · Defense Center ${lvlMax('defense')} · crew ${sumCol(S.wall)}/${cap}</div></div></div>`;
    h += `<div class="tabs2">${WCLS.map(k => `<button class="${W_.cls === k ? 'on' : ''}" data-a="wlcls" data-c="${k}"><i class="tic">${wallSVG(k, 2)}</i>${WCLSD[k].n.split(' ')[0]} ${WCLSD[k].n.split(' ')[1].slice(0, 5)}</button>`).join('')}</div><div class="tabs2">${[1, 2, 3, 4].map(x => `<button class="${x === t ? 'on' : ''}" data-a="wltier" data-t="${x}">T${x}${lvlMax('defense') < WALL_GATE[x - 1] ? ' ·' : ''}</button>`).join('')}</div>`;
    const gate = lvlMax('defense') < WALL_GATE[t - 1] ? 'Defense Center ' + WALL_GATE[t - 1] + ' needed.' : null;
    h += `<div class="panel"><div class="hd"><h3>${WCLSD[W_.cls].names[t - 1]}</h3><span class="tag">${WCLSD[W_.cls].counter ? 'counters ' + CLSD[WCLSD[W_.cls].counter].n : 'counters all'}</span></div><div class="bd"><div class="uart">${wallSVG(W_.cls, t)}</div><div class="sub">Power ${WT[t - 1].pow} · HP ${WT[t - 1].hp} · load 0 · never marches · ${dualT(WT[t - 1].sec)} each</div>${gate ? `<div class="sub sg mt">${gate}</div>` : `<div class="flex sp mt"><span class="lbl">Batch (room ${room})</span>${stepper('wln', 0, W_.n)}</div><div class="mt">${costHTML(cost)}</div><div class="sub mt">${dualT(WT[t - 1].sec * W_.n)}</div><div class="mt">${payBtn(cost, 'wall', {}, 'Crew')}</div>`}</div></div>`;
    if (job) h += `<div class="panel"><div class="bd"><div class="lbl">Crewing ${job.why}</div>${jobCtl(job)}</div></div>`;
    h += `<div class="panel"><div class="hd"><h3>On the wall</h3></div><div class="bd">${Object.keys(S.wall).filter(k => S.wall[k]).map(k => `<div class="rr"><span class="wi"><i class="ui">${wallSVG(...ckSplit(k))}</i>${ckName(k)}</span><span class="num">${S.wall[k]}</span></div>`).join('') || '<div class="sub">Bare wall.</div>'}</div></div>`;
  }
  return h;
}

/* ---------------- drawers: desk, hero/forge, alliance, mail, march ---------------- */
function renderDesk_(t) { return t === 'train' ? renderTrain() : t === 'lab' ? renderLab() : renderMed(); }
function marchCols() {
  let h = '';
  if (S.incoming.length) h += `<div class="panel" style="border-color:var(--signal)"><div class="hd"><h3 class="sg">Hostile contact</h3></div><div class="bd">${S.incoming.map(i => `<div class="rr"><span>${i.rally ? 'Rally · ' : ''}${i.name}</span><span>${tm(i.end)}</span></div>`).join('')}<div class="sub mt">Shield eats the hit. Unshielded, the wall and garrison take it.${shieldOn() ? '' : ' Shield is down.'}</div></div></div>`;
  h += S.marches.length ? S.marches.map(m => {
    const ph = { out: 'Out', sit: 'Hauling', hold: 'Holding', back: 'Walking home', stay: 'On station', wait: 'Gathering' }[m.phase];
    return `<div class="panel"><div class="bd"><div class="flex sp"><span class="wi"><i class="ui big">${unitSVG(domClass(m.col), domTier(m.col, domClass(m.col)), { plate: false })}</i><b class="h" style="font-size:18px">${marchName(m)} ${m.kind === 'rally' ? m.tname : m.tx + ',' + m.ty}</b></span><span class="tag ${m.off ? 'sg' : ''}">${ph}</span></div><div class="sub">${Object.keys(m.col).map(k => m.col[k] + ' ' + ckName(k)).join(', ')}${m.hero ? ' · ' + HEROES[S.hero.id].n : ''}</div>${m.kind === 'rally' && m.phase === 'wait' ? `<div class="sub mt">Joiners in: ${m.joiners.filter(j => j.in).length}/${m.joiners.length} · locked, only you can cancel</div>` : ''}${lootTxt(m)}${m.phase !== 'stay' ? jobCtlM(m) : ''}<div class="flex mt wrap">${m.phase === 'back' ? '' : `<button class="btn sm bad" data-a="recall" data-id="${m.id}">${m.kind === 'rally' && m.phase === 'wait' ? 'Cancel rally' : m.phase === 'stay' || m.phase === 'hold' ? 'Withdraw' : 'Recall'}</button>`}<button class="btn sm line" data-a="mjump" data-x="${m.tx}" data-y="${m.ty}">Show</button></div></div></div>`;
  }).join('') : '<div class="sub mb">No columns out. Tap the map, then a radial button.</div>';
  return h;
}
function marchField() {
  const col = previewCol(UI.comp), e = estOut('field', S.base.x, S.base.y, UI.comp), g = UI.fg, Dd = mkSide({}, {}, 1, null, monsterSyn(g, true));
  return `<div class="panel"><div class="hd"><h3>Field march</h3></div><div class="bd"><div class="sub">Fights a seeded camp on a fixed 3600-tile leg, walks home with loot capped by load. Strips the shield.</div><div class="flex sp mt"><span class="lbl">Camp grade</span><div class="step"><button data-a="fg" data-d="-1">−</button><b class="num">${g}</b><button data-a="fg" data-d="1">+</button></div></div><div class="sub mt">Odds ${oddsText(Dd, col, UI.comp.hero) || '—'}${e ? ` · out ${fmtT(e.ms / 1000)}` : ''}</div>${compHTML('comp')}<div class="flex mt"><button class="btn pri tall grow" data-a="launch" data-k="field" ${compTotal(UI.comp) ? '' : 'disabled'}>Send field march</button></div></div></div>`;
}
function marchRally() {
  const R_ = UI.rl, hl = lvlMax('hall'), waits = RALLY_WAITS;
  return `<div class="panel"><div class="hd"><h3>Rally</h3><span class="tag">Hall ${hl} · ${fmtN(rallyCap())} cap</span></div><div class="bd"><div class="sub">Targets: real commander bases and the citadel. Waiting troops are locked. Only you cancel. If you bring no hero, the rally gets no hero, gear, gem or rank bonus.</div>
    <div class="flex wrap mt"><span class="lbl">Target</span><select data-a="rtarget"><option value="citadel" ${R_.target === 'citadel' ? 'selected' : ''}>Citadel</option>${S.bots.map(b => `<option value="${b.al}" ${String(R_.target) === String(b.al) ? 'selected' : ''}>${b.tag} ${b.cmd}</option>`).join('')}</select></div>
    <div class="flex wrap mt"><span class="lbl">Wait</span>${waits.map(([n, s], i) => `<button class="btn sm ${R_.wait === i ? 'on' : 'line'}" data-a="rwait" data-i="${i}">${n}</button>`).join('')}</div><div class="sub mt">${dualScale(Math.max(5000, waits[R_.wait][1] / OCC * 1000))}</div>
    <div class="flex sp mt"><span class="lbl">Extra slots 7–10 · tokens ${S.tokens}</span><div class="step"><button data-a="rslots" data-d="-1">−</button><b class="num">${R_.slots}</b><button data-a="rslots" data-d="1">+</button></div></div><div class="sub">Slots ${6 + R_.slots} of 10 · orders ${S.orders}</div>
    ${compHTML('rcomp')}<div class="flex mt"><button class="btn pri tall grow" data-a="rally" ${compTotal(UI.rcomp) && hl ? '' : 'disabled'}>Lead rally</button></div></div></div>`;
}
function reportsHTML(saved) {
  const rs = S.reports.filter(r => !saved || r.saved);
  return rs.length ? `<div class="list mailist">${rs.map(r => `<div class="it ${r.id > (S.readTo || 0) ? 'unr' : ''}" data-a="report" data-id="${r.id}" style="cursor:pointer"><div class="grow"><b class="h" style="font-size:16px">${r.title}</b><div class="sub">${new Date(r.t).toLocaleString()} · ${r.win == null ? 'intel' : r.win ? 'victory' : 'defeat'}</div></div><span class="tag ${r.win === false ? 'sg' : r.win ? 'br' : ''}">${r.kind}</span><button class="star ${r.saved ? 'on' : ''}" data-a="rsave" data-id="${r.id}" aria-label="Save">★</button></div>`).join('')}</div>` : `<div class="sub">${saved ? 'Nothing saved. Tap the star on a report.' : 'No reports. A wiped column writes none.'}</div>`;
}
const MORE = [['Store', 'Diamonds, packs and settings.', 'vault', 'hero', 'store'], ['Government', 'Check who rules the citadel.', 'alliance', 'alliance', 'throne'], ['Ranks', 'Alliance standing and score.', 'hero', 'alliance', 'ally'], ['Market', 'Three offers a day.', 'cash', 'hero', 'market'], ['Diamond ledger', 'Every diamond gained or spent.', 'dia', 'hero', 'ledger'], ['Settings', 'Sound, haptics, erase save.', 'lab', 'hero', 'store']];
function moreHTML() { return `<div class="morelist">${MORE.map(([n, d, ic, dr, tab]) => `<button class="mrow" data-a="drawer" data-id="${dr}" data-tab="${tab}"><span class="mico">${svg(ic).replace(/stroke="[^"]+"/, 'stroke="currentColor"')}</span><span class="grow"><b>${n}</b><i>${d}</i></span><em>›</em></button>`).join('')}</div>`; }
function logHTML() { return `<div class="panel"><div class="bd">${S.log.slice(0, 40).map(l => `<div class="rr"><span class="${l.k === 'bad' ? 'sg' : l.k === 'good' ? 'ox' : l.k === 'warn' ? 'br' : ''}">${l.m}</span><span class="mut num">${new Date(l.t).toTimeString().slice(0, 8)}</span></div>`).join('') || '<div class="sub">Nothing yet.</div>'}</div></div>`; }
function contactsHTML() {
  return (S.incoming.length ? `<div class="panel" style="border-color:var(--signal)"><div class="hd"><h3 class="sg">Inbound</h3></div><div class="bd">${S.incoming.map(i => `<div class="rr"><span>${i.rally ? 'Rally · ' : ''}${i.name}</span><span>${tm(i.end)}</span></div>`).join('')}</div></div>` : '')
    + `<div class="panel"><div class="hd"><h3>Commanders</h3></div><div class="bd list">${S.bots.map(b => `<div class="it"><span style="width:10px;height:10px;background:${alColor(b.al)};display:inline-block"></span><div class="grow"><b class="h" style="font-size:16px">${b.tag} ${b.cmd}</b><div class="sub">${b.n} · ${b.x},${b.y} · ${b.shieldUntil > Date.now() ? 'shielded' : 'exposed'}</div></div><button class="btn sm line" data-a="mjump" data-x="${b.x}" data-y="${b.y}">Show</button></div>`).join('')}</div></div>`;
}
function heroesHTML() {
  const hero = HEROES[S.hero.id];
  return `<div class="panel"><div class="hd"><h3>Heroes</h3><span class="tag ${S.hero.captured ? 'sg' : ''}">Rank ${S.hero.rank}</span></div><div class="bd">${Object.keys(HEROES).map(k => `<div class="it flex" style="padding:6px 0"><i class="hpt ${S.hero.id === k ? 'on' : ''}">${heroSVG(k)}</i><div class="grow"><b class="h" style="font-size:16px">${HEROES[k].n}</b> <span class="sub">${HEROES[k].role} · ${HEROES[k].d}</span></div><button class="btn sm ${S.hero.id === k ? 'on' : 'line'}" data-a="hero" data-k="${k}">${S.hero.id === k ? 'Stationed' : 'Station'}</button></div>`).join('')}${S.hero.captured ? `<div class="flex wrap mt"><span class="sg">${hero.n} is captured.</span><button class="btn sm" data-a="ransom">Ransom 2500</button><button class="btn sm line" data-a="ransom" data-seal="1">Use seal</button></div>` : heroLocked() ? '<div class="sub mt">The hero is out. The base cannot teleport.</div>' : ''}</div></div>`;
}
function ledgerHTML() { return `<div class="panel"><div class="hd"><h3>Diamond ledger</h3><b class="num br">${S.dia}◆</b></div><div class="bd">${S.ledger.map(l => `<div class="rr"><span>${l.why}</span><span class="num ${l.n < 0 ? 'sg' : 'ox'}">${l.n > 0 ? '+' : ''}${l.n} → ${l.bal}</span></div>`).join('') || '<div class="sub">No entries. A local ledger, not a store.</div>'}</div></div>`; }
function throneHTML() {
  const th = S.throne, king = th.ruler === 0;
  let h = `<div class="panel"><div class="hd"><h3>Throne</h3><span class="tag ${king ? 'br' : ''}">${th.ruler != null ? alName(th.ruler) + ' rules' : th.holder != null ? alName(th.holder) + ' holds' : 'empty'}</span></div><div class="bd"><div class="sub">${th.ruler != null ? 'Reign ends ' : th.holder != null ? 'Hold completes ' : 'Nobody holds the throne. Any alliance may put troops in.'}${th.ruleUntil ? tm(th.ruleUntil, false) + ' drill · 3 sheet days' : th.holdEnd ? tm(th.holdEnd, false) + ' · 6 sheet hours' : ''}</div><div class="sub mt">Score ${S.score}</div><div class="flex mt"><button class="btn sm line" data-a="mjump" data-x="${TX}" data-y="${TY}">Show citadel</button></div></div></div>`;
  if (king) h += `<div class="panel"><div class="hd"><h3>Officers R4</h3><span class="tag">${th.officers.length}/2</span></div><div class="bd">${S.roster.map(n => `<div class="it flex" style="padding:4px 0"><span class="grow">${n}</span><button class="btn sm ${th.officers.includes(n) ? 'on' : 'line'}" data-a="appoint" data-n="${n}">${th.officers.includes(n) ? 'R4' : 'Appoint'}</button></div>`).join('')}</div></div>
    <div class="panel"><div class="hd"><h3>Titles</h3></div><div class="bd">${['You'].concat(S.roster).map(n => { const cur = S.titles[n === 'You' ? 'you' : n]; return `<div class="flex wrap" style="margin:4px 0"><b style="width:74px">${n}</b><select data-a="title" data-n="${n}"><option value="">—</option>${Object.keys(TITLES).map(t => `<option value="${t}" ${cur === t ? 'selected' : ''}>${TITLES[t].n} ${TITLES[t].d}</option>`).join('')}</select></div>`; }).join('')}<div class="sub mt">R5 and the two R4 may grant. When the reign ends, officers and titles clear.</div></div></div>`;
  return h;
}
function allyHTML() {
  const king = S.throne.ruler === 0;
  return `<div class="panel"><div class="hd"><h3>Alliance ${S.al[0].tag}</h3><span class="sub">${Object.values(S.own).filter(o => o === 0).length} tiles · score ${S.score}</span></div><div class="bd"><div class="flex wrap">${STD_KEYS.map(c => `<button class="sw${S.al[0].color === c ? ' on' : ''}" style="background:${STD[c]}" data-a="recolor" data-c="${c}" title="${c}"></button>`).join('')}</div><div class="sub mt">${king ? 'You rule. Pick a standard.' : 'Only the ruling king can recolor.'}</div><div class="flex mt"><button class="btn bad sm" data-a="disband">Disband alliance</button></div></div></div>
  <div class="panel"><div class="hd"><h3>Settings</h3></div><div class="bd flex wrap"><button class="btn sm ${setOn('snd') ? 'on' : 'line'}" data-a="setopt" data-k="snd">Sound ${setOn('snd') ? 'on' : 'off'}</button><button class="btn sm ${setOn('hap') ? 'on' : 'line'}" data-a="setopt" data-k="hap">Haptics ${setOn('hap') ? 'on' : 'off'}</button><button class="btn bad sm" data-a="reset">Reset save</button></div></div>`;
}
const DR = {
  desk: { tabs: [['train', 'Train'], ['lab', 'Lab'], ['med', 'Med']], body: renderDesk_ },
  hero: { tabs: [['forge', 'Forge'], ['heroes', 'Heroes'], ['store', 'Store'], ['market', 'Market'], ['ledger', 'Ledger']], body: t => ({ forge: forgeHTML, heroes: heroesHTML, store: storeHTML, market: marketHTML, ledger: ledgerHTML })[t]() },
  alliance: { tabs: [['throne', 'Throne'], ['rally', 'Rally'], ['ally', 'Alliance']], body: t => ({ throne: throneHTML, rally: marchRally, ally: allyHTML })[t]() },
  mail: { tabs: [['rep', 'Reports'], ['sav', 'Saved'], ['log', 'Log'], ['ctc', 'Contacts']], body: t => ({ rep: reportsHTML, sav: () => reportsHTML(true), log: logHTML, ctc: contactsHTML })[t]() },
  more: { tabs: [['menu', 'More']], body: moreHTML },
  march: { tabs: [['cols', 'Columns'], ['field', 'Field']], body: t => t === 'cols' ? marchCols() : marchField() }
};
function renderDrawer() {
  const el = $('#drawer'), id = UI.drawer; if (!id) { el.classList.remove('on'); return; }
  const d = DR[id], tab = UI.dt[id];
  $('#dtabs').innerHTML = d.tabs.map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-a="dtab" data-k="${k}">${n}</button>`).join('') + `<button class="x" data-a="closedrawer">✕</button>`;
  $('#dbody').innerHTML = d.body(tab); el.classList.add('on');
  if (id === 'mail' && S.reports.length) S.readTo = S.reports[0].id;
}
/* building radial: Upgrade / Info / Function around the tapped plot, with a level diamond, like the reference */
const FUNC_OF = { mil: 'wing:train', tech: 'wing:lab', depot: 'wing:med', defense: 'wing:wall', hall: 'wing:rally', market: 'wing:market' };
function closeBRadial() { const r = $('#bradial'); if (r) r.remove(); }
function openBRadial(ar, i, el) {
  closeBRadial(); const p = S.plots[ar][i], main = $('#main').getBoundingClientRect(), r = el.getBoundingClientRect(), cx = r.left + r.width / 2 - main.left, cy = r.top + r.height / 2 - main.top;
  const job = S.jobs.find(j => j.kind === 'build' && j.area === ar && j.idx === i), f = FUNC_OF[p.b], d = `data-a="bopen" data-ar="${ar}" data-i="${i}"`;
  const btn = (cls, ic, lbl, extra) => `<button class="bt ${cls}" ${d} ${extra || ''}>${svg(ic).replace(/stroke="[^"]+"/, 'stroke="currentColor"')}<span>${lbl}</span></button>`;
  const div = document.createElement('div'); div.id = 'bradial'; div.style.cssText = `left:${clamp(cx, 90, main.width - 90)}px;top:${clamp(cy, 100, main.height - 60)}px`;
  div.innerHTML = `<svg class="bl" viewBox="-100 -110 200 130"><path d="M0 0L-62 -62M0 0L62 -62M-62 -62L62 -62" stroke="#0a0d0e" stroke-width="2" fill="none"/></svg>` + btn('up', 'base', job ? 'Building' : 'Upgrade') + btn('lf', 'vault', 'Info') + (f ? btn('rt', 'lab', 'Function', `data-f="${f}"`) : btn('rt', 'hero', 'Function')) + `<div class="lvd"><i class="num">${p.l}</i><b>${BLD[p.b].n}</b></div>`;
  $('#main').appendChild(div);
}
function sheetOpen(s) { closeBRadial(); UI.sheet = s; UI.drawer = null; closeRadial(); D(); }
function openDrawer(id, tab) { UI.drawer = id; if (tab) UI.dt[id] = tab; UI.sheet = null; closeRadial(); D(); }

function forgeHTML() {
  const u = gradeUnits(), C = UI.cr, sel = C.sel, selN = sumCol(sel);
  const bars = [1, 2, 3, 4, 5, 6].map(g => `<div class="flex sp" style="margin:4px 0"><i class="ui">${barSVG(g)}</i><span class="lbl" style="width:64px;white-space:nowrap">Grade ${g}</span><b class="num grow">${S.bars[g] || 0}</b><div class="step"><button data-a="crsel" data-g="${g}" data-d="-1">−</button><b class="num">${sel[g] || 0}</b><button data-a="crsel" data-g="${g}" data-d="1">+</button></div><button class="btn sm" data-a="refine" data-g="${g}" ${g < 6 && (S.bars[g] || 0) >= 4 ? '' : 'disabled'}>Refine</button></div>`).join('');
  let tw = 0; for (const g in sel) if (sel[g]) tw += sel[g] * sel[g];
  const odds = tw ? Object.keys(sel).filter(g => sel[g]).map(g => `G${g} ${Math.round(sel[g] * sel[g] / tw * 100)}%`).join(' · ') : '—';
  const worn = SLOTS.map(s => { const p = slotPiece(s); return `<div class="rr"><span class="wi"><i class="ui">${p ? gearSVG(s, p.grade, p.set) : emptySlot(s)}</i>${s}</span><span class="num ${p ? 'br' : 'mut'}">${p ? 'G' + p.grade + ' ' + (p.set ? SETS[p.set].n : '') + ' ' + pieceText(p) : 'empty'}</span></div>`; }).join('');
  return `<div class="panel"><div class="hd"><h3>Bars</h3><span class="tag">Gems ${S.gems}</span></div><div class="bd"><div class="flex sp"><span class="lbl">Stockpile</span><b class="num">${u}/1024</b></div><div class="bar mt"><i style="width:${Math.min(100, u / 1024 * 100)}%"></i><u style="left:50%"></u></div><div class="flex sp sub"><span>0</span><span>512</span><span>1024 = grade 6</span></div><div class="mt">${bars}</div><div class="sub">Four of grade N refine into one of N+1.</div></div></div>
  <div class="panel"><div class="hd"><h3>Craft</h3><span class="tag ${selN === 4 ? 'br' : ''}">${selN}/4 bars</span></div><div class="bd"><div class="tabs2">${SLOTS.map(s => `<button class="${C.slot === s ? 'on' : ''}" data-a="crslot" data-s="${s}"><i class="tic">${gearSVG(s, 3)}</i>${s}</button>`).join('')}</div>
  ${C.slot === 'accessory' ? `<div class="flex mb"><span class="lbl">Stamp</span><button class="btn sm ${C.stat === 'training' ? 'on' : 'line'}" data-a="crstat" data-s="training">Training</button><button class="btn sm ${C.stat === 'yield' ? 'on' : 'line'}" data-a="crstat" data-s="yield">Yield</button></div>` : ''}
  <div class="flex wrap mb"><span class="lbl">Shard</span><button class="btn sm ${!C.shard ? 'on' : 'line'}" data-a="crshard" data-s="">None</button>${Object.keys(SETS).map(s => `<button class="btn sm ${C.shard === s ? 'on' : 'line'}" data-a="crshard" data-s="${s}" ${S.shards[s] ? '' : 'disabled'}>${SETS[s].n} ${S.shards[s] || 0}</button>`).join('')}</div>
  <div class="sub">Roll weights each grade by count². Odds ${odds}. The lone bar can still win.</div><div class="sub">${C.slot}: ${C.slot === 'accessory' ? 'stamped stat' : SLOT_WHAT[C.slot]} +${SLOT_CURVE[C.slot][0]}% to +${SLOT_CURVE[C.slot][1]}%</div>
  <div class="flex mt"><button class="btn pri" data-a="craft" ${selN === 4 ? '' : 'disabled'}>Refine into gear</button><button class="btn line" data-a="crclear">Clear</button></div></div></div>
  <div class="panel"><div class="hd"><h3>Worn</h3><span class="tag ${setBonus() ? 'br' : ''}">${setBonus() ? SETS[setBonus()].n + ' set · ' + SETS[setBonus()].d : 'no full set'}</span></div><div class="bd">${worn}</div></div>
  <div class="panel"><div class="hd"><h3>Rack</h3></div><div class="bd list">${S.gear.pieces.map(p => { const w = S.gear.worn[p.slot] === p.id; return `<div class="it"><i class="ui big">${gearSVG(p.slot, p.grade, p.set)}</i><div class="grow"><b class="h" style="font-size:15px">${p.slot} G${p.grade} ${p.set ? SETS[p.set].n : ''}</b><div class="sub">${pieceText(p)}</div></div><button class="btn sm ${w ? 'line' : 'pri'}" data-a="${w ? 'rack' : 'wear'}" data-id="${p.id}">${w ? 'Rack' : 'Wear'}</button></div>`; }).join('') || '<div class="sub">Nothing forged.</div>'}</div></div>`;
}
function storeHTML() {
  return `<div class="panel"><div class="hd"><h3>Packs</h3><b class="num br">${S.dia}◆</b></div><div class="bd list">${DIA_PACKS.map(p => `<div class="it"><div class="grow"><b class="h" style="font-size:16px">${p.n}</b><div class="sub">${p.d}</div></div><button class="btn sm" data-a="pack" data-id="${p.id}" ${S.dia < p.cost ? 'disabled' : ''}>${p.cost}◆</button></div>`).join('')}</div></div>
  <div class="panel"><div class="hd"><h3>Speed-up slips</h3><span class="sub">${S.slips.s5}× 5m · ${S.slips.s60}× 1h · ${S.slips.s480}× 8h</span></div><div class="bd list">${SLIPS.map(s => `<div class="it"><span class="grow">${s.n}</span><button class="btn sm" data-a="slipbuy" data-id="${s.id}" ${S.dia < s.cost ? 'disabled' : ''}>${s.cost}◆</button></div>`).join('')}</div></div>
  <div class="panel"><div class="hd"><h3>Resource crates</h3></div><div class="bd"><div class="sub mb">Rates per diamond: ${RES.map(r => DIA_RATE[r] + ' ' + RESN[r]).join(' · ')}</div><div class="flex wrap">${RES.map(r => `<button class="btn sm line" data-a="crate" data-r="${r}" data-n="10">${RESN[r]} 10◆</button>`).join('')}</div></div></div>
  <div class="panel"><div class="hd"><h3>Orders, seals, tokens</h3></div><div class="bd flex wrap"><button class="btn sm" data-a="buyorders">5 orders 80◆</button><button class="btn sm" data-a="buyseals">5 seals 60◆</button><button class="btn sm" data-a="buytoken">Token 100◆</button><button class="btn sm" data-a="buycrate">Crate ×3 260◆</button><button class="btn sm pri" data-a="daily">Daily exercise</button></div><div class="bd sub">Orders ${S.orders} · seals ${S.seals} · tokens ${S.tokens}</div></div>`;
}
function marketHTML() {
  rollMarket(); return `<div class="panel"><div class="hd"><h3>Black Market</h3><button class="btn sm line" data-a="mrefresh">Refresh 15◆</button></div><div class="bd list">${!hasB('market') ? '<div class="sub sg">Build a Black Market.</div>' : ''}${S.market.offers.map((o, i) => { const it = MARKET_CAT.find(x => x.id === o.id); return `<div class="it"><div class="grow"><b class="h" style="font-size:16px">${it.n}</b></div><button class="btn sm ${o.sold ? 'line' : 'pri'}" data-a="mbuy" data-i="${i}" ${o.sold || S.dia < it.cost ? 'disabled' : ''}>${o.sold ? 'Sold' : it.cost + '◆'}</button></div>`; }).join('')}</div></div>`;
}

/* ---------------- actions ---------------- */
const A = {
  dock(d) {
    const k = d.k; closeRadial();
    if (k === 'hero' || k === 'alliance' || k === 'mail' || k === 'more') { UI.drawer = UI.drawer === k ? null : k; UI.sheet = null; }
    else { UI.drawer = null; UI.page = k; UI.sheet = null; if (k !== 'map') UI.sel = null; }
    D();
  },
  drawer(d) { openDrawer(d.id, d.tab); }, dtab(d) { UI.dt[UI.drawer] = d.k; D(); }, closedrawer() { UI.drawer = null; D(); },
  'plot-cc'() { const t = plotOf('cc'); if (t) { UI.page = 'base'; sheetOpen({ type: 'plot', area: t.ar, idx: t.i }); } },
  sharexy(d) { const t = `X:${d.x} Y:${d.y}`; try { navigator.clipboard.writeText(t); } catch (e) { } toast('Copied ' + t, 'good'); },
  mworld() { if (MAP.ts > TS_MIN + 2) { MAP.zprev = MAP.ts; zoomAt(MAP.w / 2, MAP.h / 2, TS_MIN); } else zoomAt(MAP.w / 2, MAP.h / 2, MAP.zprev || 28); },
  mmark() { S.bk = S.bk || []; const sl = UI.sel; if (sl && !S.bk.some(b => b.x === sl.x && b.y === sl.y)) { S.bk.push({ x: sl.x, y: sl.y }); if (S.bk.length > 6) S.bk.shift(); toast(`Marked ${sl.x},${sl.y}`, 'good'); } else if (S.bk.length) { UI.bki = ((UI.bki || 0) + 1) % S.bk.length; const b = S.bk[UI.bki]; panTo(b.x, b.y); toast(`Mark ${UI.bki + 1}/${S.bk.length}: ${b.x},${b.y}`); } else toast('Select a tile, then tap Mark.'); D(); },
  mterr() { MAP.hideTerr = !MAP.hideTerr; D(); },
  moff() { MAP.hideTags = !MAP.hideTags; D(); },
  rsave(d) { const r = S.reports.find(x => x.id === +d.id); if (r) r.saved = !r.saved; D(); },
  rdel(d) { S.reports = S.reports.filter(x => x.id !== +d.id); UI.sheet = null; D(); },
  mgo() { const v = prompt('Go to X,Y', Math.round(MAP.cx) + ',' + Math.round(MAP.cy)); if (!v) return; const [a, b] = v.split(/[ ,]+/).map(Number); if (isFinite(a) && isFinite(b)) { panTo(clamp(a, 0, W - 1), clamp(b, 0, H - 1)); D(); } },
  closesheet() { UI.sheet = null; UI.sel = null; D(); },
  scrim() { closeBRadial(); if (UI.drawer) UI.drawer = null; else { UI.sheet = null; UI.sel = null; } D(); },
  details(d) { closeRadial(); UI.sel = { x: +d.x, y: +d.y }; UI.sheet = { type: 'tile', x: +d.x, y: +d.y }; UI.drawer = null; D(); },
  qsend(d) {
    const comp = bestComp(headcount()), e = launchMarch(d.k, +d.x, +d.y, comp, false); closeRadial();
    if (run(e, 'Column out: ' + compTotal(comp) + ' troops.')) { UI.sel = null; hap([14, 40, 14]); } else UI.sel = { x: +d.x, y: +d.y };
  },
  mjump(d) { UI.drawer = null; UI.page = 'map'; panTo(+d.x, +d.y); D(); },
  jump(d) { const k = d.k; closeRadial(); if (k === 'n') panTo(MAP.cx, MAP.cy - 60); else if (k === 's') panTo(MAP.cx, MAP.cy + 60); else if (k === 'w') panTo(MAP.cx - 60, MAP.cy); else if (k === 'e') panTo(MAP.cx + 60, MAP.cy); else if (k === 'b') panTo(S.base.x, S.base.y); else panTo(TX, TY); },
  plot(d, el) { delete UI.ready[d.ar + d.i]; const p = S.plots[d.ar][+d.i]; if (p && el && el.getBoundingClientRect) { openBRadial(d.ar, +d.i, el); return; } sheetOpen({ type: 'plot', area: d.ar, idx: +d.i }); UI.page = 'base'; },
  morejobs() { UI.moreJobs = !UI.moreJobs; D(); },
  bopen(d) { closeBRadial(); if (d.f) { const [k, v] = d.f.split(':'); if (k === 'wing') { A.wing({ w: v }); return; } } sheetOpen({ type: 'plot', area: d.ar, idx: +d.i }); UI.page = 'base'; },
  build(d) { run(startBuild(d.area, +d.idx, d.b, !!d.cover)); },
  rush(d) { run(rushJob(+d.id)); closeRadial(); }, slip(d) { run(slipJob(+d.id)); closeRadial(); }, help(d) { run(askHelp(+d.id)); },
  cstep(d) { const c = UI[d.cn], cap = d.cn === 'rcomp' ? Math.min(headcount(), rallyCap()) : headcount(), tot = compTotal(c); c[d.c] = clamp(c[d.c] + +d.d, 0, Math.max(0, Math.min(clsAvail(d.c), cap - (tot - c[d.c])))); D(); },
  best(d) { const c = UI[d.cn]; Object.assign(c, bestComp(d.cn === 'rcomp' ? Math.min(headcount(), rallyCap()) : headcount())); D(); },
  clear(d) { const c = UI[d.cn]; CLS.forEach(k => c[k] = 0); c.hero = false; D(); }, chero(d) { const c = UI[d.cn]; c.hero = !c.hero; D(); },
  launch(d) {
    const s = UI.sheet, c = UI.comp; let x, y;
    if (d.k === 'field') { x = S.base.x; y = S.base.y; } else { x = s.x; y = s.y; }
    const e = launchMarch(d.k, x, y, c, c.hero, { grade: UI.fg }); if (run(e, d.k === 'field' ? 'Field column is out.' : 'Column is out.')) { CLS.forEach(k => c[k] = 0); c.hero = false; if (d.k !== 'field') { UI.sheet = null; UI.sel = null; } }
  },
  scout(d) { run(scoutTarget(+d.x, +d.y)); closeRadial(); },
  tp(d) { if (run(doTeleport(+d.x, +d.y))) { UI.sheet = null; UI.sel = null; closeRadial(); panTo(S.base.x, S.base.y); } },
  tpr() { if (run(randomTeleport())) panTo(S.base.x, S.base.y); },
  shield() { run(toggleShield()); }, anti() { S.anti = !S.anti; D(); }, builder2() { run(buyBuilder(), 'Second builder hired.'); },
  wing(d) { UI.sheet = null; closeRadial(); if (d.w === 'train') openDrawer('desk', 'train'); else if (d.w === 'lab') openDrawer('desk', 'lab'); else if (d.w === 'med') { UI.med = 'depot'; openDrawer('desk', 'med'); } else if (d.w === 'wall') { UI.med = 'wall'; openDrawer('desk', 'med'); } else if (d.w === 'rally') openDrawer('alliance', 'rally'); else openDrawer('hero', 'market'); },
  trcls(d) { UI.tr.cls = d.c; UI.tr.n = 0; D(); }, trtier(d) { UI.tr.tier = +d.t; UI.tr.n = 0; D(); },
  trn(d) { UI.tr.n = clamp(UI.tr.n + +d.d, 0, batchCap(UI.tr.tier)); D(); }, trmax() { UI.tr.n = batchCap(UI.tr.tier); D(); },
  train(d) { const T = UI.tr; run(startTrain(T.cls, T.tier, T.n, !!d.cover)); },
  research(d) { run(startResearch(d.id, !!d.cover)); }, labtab(d) { UI.lab = d.k; D(); },
  medtab(d) { UI.med = d.k; D(); }, heal(d) { const [c, t] = ckSplit(d.k); run(startHeal(c, t, S.wounded[d.k] || 0, !!d.cover)); },
  wlcls(d) { UI.wl.cls = d.c; UI.wl.n = 0; D(); }, wltier(d) { UI.wl.tier = +d.t; UI.wl.n = 0; D(); }, wln(d) { UI.wl.n = Math.max(0, UI.wl.n + +d.d); D(); },
  wall(d) { const w = UI.wl; run(startWall(w.cls, w.tier, w.n, !!d.cover)); },
  recall(d) { run(recall(+d.id)); closeRadial(); }, report(d) { sheetOpen({ type: 'report', id: +d.id }); },
  fg(d) { UI.fg = clamp(UI.fg + +d.d, 1, 6); D(); },
  rtarget(d, el) { UI.rl.target = el.value; D(); }, rwait(d) { UI.rl.wait = +d.i; D(); }, rslots(d) { UI.rl.slots = clamp(UI.rl.slots + +d.d, 0, Math.min(4, S.tokens)); D(); },
  rally() { const c = UI.rcomp; if (run(createRally(UI.rl.target, c, c.hero, RALLY_WAITS[UI.rl.wait][1], UI.rl.slots), 'Rally is up.')) { CLS.forEach(k => c[k] = 0); c.hero = false; UI.rl.slots = 0; openDrawer('march', 'cols'); } },
  rallyto(d) { UI.rl.target = d.t; closeRadial(); openDrawer('alliance', 'rally'); },
  crsel(d) { const s = UI.cr.sel, g = +d.g, tot = sumCol(s); const n = clamp((s[g] || 0) + +d.d, 0, S.bars[g] || 0); if (+d.d > 0 && tot >= 4) return toast('A craft spends exactly four bars.', 'warn'); s[g] = n; if (!n) delete s[g]; D(); },
  crslot(d) { UI.cr.slot = d.s; D(); }, crstat(d) { UI.cr.stat = d.s; D(); }, crshard(d) { UI.cr.shard = d.s; D(); }, crclear() { UI.cr.sel = {}; D(); },
  craft() { const C = UI.cr; if (run(craft(C.slot, C.sel, C.shard || null, C.stat))) { C.sel = {}; C.shard = ''; } },
  refine(d) { run(refine(+d.g)); }, wear(d) { run(wear(+d.id)); }, rack(d) { run(rack(+d.id)); },
  pack(d) { run(buyPack(d.id)); }, slipbuy(d) { run(buySlip(d.id), 'Slips racked.'); }, crate(d) { run(buyRes(d.r, +d.n), 'Crate opened.'); },
  buyorders() { run(buyOrders(), 'Five orders.'); }, buyseals() { run(buySeals(), 'Five seals.'); }, buytoken() { run(buyToken(false), 'Token bought.'); }, buycrate() { run(buyToken(true), 'Three tokens.'); }, daily() { run(daily()); },
  mrefresh() { if (S.dia < 15) return run('Short of diamonds.'); dchg(-15, 'Market refresh'); rollMarket(true); D(); }, mbuy(d) { run(buyMarket(+d.i), 'Bought.'); },
  hero(d) { run(setHero(d.k)); }, ransom(d) { run(ransom(!!d.seal)); },
  recolor(d) { run(recolor(d.c)); }, disband() { if (confirm('Disband the alliance? Every colored tile goes neutral.')) { disband(); D(); } },
  appoint(d) { run(appoint(d.n)); }, title(d, el) { run(grantTitle(d.n, el.value || null)); },
  setopt(d) { S.set[d.k] = !setOn(d.k); D(); },
  reset() { if (confirm('Erase the save and start over?')) { resetGame(); S.set = { snd: true, hap: true }; UI.sheet = null; UI.drawer = null; UI.ready = {}; panTo(S.base.x, S.base.y); D(); } }
};
document.addEventListener('click', e => { if (!e.target.closest('#bradial') && !e.target.closest('.plot')) closeBRadial(); const b = e.target.closest('[data-a]'); if (!b || b.tagName === 'SELECT') return; const f = A[b.dataset.a]; if (f) { hap(6); snd(); f(b.dataset, b); } });
document.addEventListener('change', e => { const b = e.target.closest('select[data-a]'); if (b && A[b.dataset.a]) A[b.dataset.a](b.dataset, b); });
document.addEventListener('pointerdown', () => { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) { } }, { once: true });
$('#scrim').addEventListener('click', () => A.scrim());

/* ---------------- loop ---------------- */
function showPage() { for (const p of ['map', 'base']) $('#pg-' + p).className = 'page' + (UI.page === p ? ' on' : ''); }
function renderAll() {
  UI.dirty = false; if (typeof CH !== 'undefined') CH.fver++; renderTop(); renderQueues(); renderDock(); showPage();
  if (UI.page === 'base') renderBase();
  renderDrawer(); renderSheet();
}
function updateTimers() {
  document.querySelectorAll('[data-end]').forEach(el => { el.innerHTML = tmText(+el.dataset.end, el.dataset.b === '1'); });
  document.querySelectorAll('.ring[data-rs]').forEach(el => { const s = +el.dataset.rs, e = +el.dataset.re, f = clamp((Date.now() - s) / Math.max(1, e - s), 0, 1); el.querySelector('.rfg').setAttribute('stroke-dashoffset', (RING_C * (1 - f)).toFixed(1)); });
}
function boot() {
  S = load() || newState(); S.set = S.set || { snd: true, hap: true }; const el = Math.min(600, (Date.now() - (S.last || Date.now())) / 1000); if (el > 3) produce(el); S.last2 = 0; terrDirty = true;
  initMap(); MAP.cx = S.view.x; MAP.cy = S.view.y; renderAll();
  setInterval(() => {
    tick(); renderTop(); renderTicker(); renderQueues();
    const now = Date.now(); if (now - UI.flyAt > 5500) { UI.flyAt = now; spawnFly(); }
    if (UI.dirty || terrDirty) renderAll(); else updateTimers();
  }, 250);
  setInterval(save, 5000); window.addEventListener('beforeunload', save);
  if (!S.log.length) note('Garrison raised. Tap the map, then a radial button.', 'info');
}
boot();
