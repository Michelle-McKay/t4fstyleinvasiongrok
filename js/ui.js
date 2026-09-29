'use strict';
/* IRON MARCH — UI: map canvas, dock, sheets, desk, pages. */
const $ = s => document.querySelector(s);
const ICON = {
  map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
  base: '<path d="M3 20V9l5-3v14M8 20V4l6 3v13M14 20V10l7 2v8M2 20h20"/>',
  train: '<path d="M6 7l6 5-6 5M13 7l6 5-6 5"/>',
  lab: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M8 15h8"/>',
  med: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
  march: '<path d="M5 21V4M5 5h13l-3 4 3 4H5"/>',
  vault: '<rect x="3" y="4" width="18" height="16"/><circle cx="12" cy="12" r="4"/><path d="M12 8v2M12 14v2M8 12h2M14 12h2"/>',
  rations: '<path d="M12 3v18M12 8c-3 0-4-2-4-4 3 0 4 2 4 4zm0 0c3 0 4-2 4-4-3 0-4 2-4 4zM12 14c-3 0-4-2-4-4 3 0 4 2 4 4zm0 0c3 0 4-2 4-4-3 0-4 2-4 4z"/>',
  fuel: '<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/>',
  power: '<path d="M13 2L5 14h6l-1 8 8-12h-6z"/>',
  alloy: '<path d="M4 16l3-8h10l3 8zM2 20h20"/>',
  cash: '<rect x="3" y="7" width="18" height="10"/><circle cx="12" cy="12" r="2.5"/>',
  dia: '<path d="M12 3l8 7-8 11-8-11z"/>'
};
const ICOL = { rations: '#8ea36a', fuel: '#e07a2f', power: '#5ec4d4', alloy: '#9aa4a8', cash: '#e0a44a', dia: '#5ec4d4' };
const svg = (n, cls) => `<svg viewBox="0 0 24 24" fill="none" stroke="${ICOL[n] || 'currentColor'}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" ${cls ? 'class="' + cls + '"' : ''}>${ICON[n]}</svg>`;
const UI = {
  page: 'map', desk: null, sheet: null, comp: { inf: 0, arm: 0, air: 0, siege: 0, hero: false }, rcomp: { inf: 0, arm: 0, air: 0, siege: 0, hero: false },
  tr: { cls: 'inf', tier: 1, n: 0 }, wl: { cls: 'sent', tier: 1, n: 0 }, lab: 'combat', med: 'depot', mt: 'cols', vt: 'forge', fg: 3,
  cr: { slot: 'weapon', sel: {}, shard: '', stat: 'training' }, rl: { target: 'citadel', wait: 0, slots: 0 }, sel: null, dirty: true, cover: false
};

/* ---------------- helpers ---------------- */
function toast(m, k) { const t = document.createElement('div'); t.className = 'toast ' + (k || ''); t.textContent = m; const box = $('#toasts'); box.appendChild(t); while (box.children.length > 4) box.firstChild.remove(); setTimeout(() => t.remove(), 3800); }
let actx = null;
function tone() { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const o = actx.createOscillator(), g = actx.createGain(); o.type = 'square'; o.frequency.value = 880; g.gain.value = 0.05; o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + 0.14); } catch (e) { } }
UIH.toast = toast; UIH.tone = tone; UIH.dirty = () => { UI.dirty = true; };
const D = () => { UI.dirty = true; };
function run(e, ok) { if (e) toast(e, 'warn'); else if (ok) toast(ok, 'good'); D(); return !e; }
const tm = (end, both) => end > 1e15 ? '<span class="mut">on station</span>' : `<span class="t num" data-end="${end}" data-b="${both ? 1 : 0}">${tmText(end, both)}</span>`;
function tmText(end, both) { const s = Math.max(0, (end - Date.now()) / 1000); return fmtT(s) + (both ? ' <span class="mut">(' + fmtT(s * DRILL) + ' sheet)</span>' : ''); }
const dualT = sheet => `${fmtT(sheet)} sheet · <b class="br">${fmtT(sheet / DRILL)}</b>`;
const costTxt = c => Object.keys(c).filter(r => c[r] > 0).map(r => `<span class="${S.res[r] + 0.5 < c[r] ? 'sg' : ''}">${svg(r, 'ic')}${fmtN(c[r])}</span>`).join(' ');
const ic = 'style="width:13px;height:13px;vertical-align:-2px"';
function costHTML(c) { return Object.keys(c).filter(r => c[r] > 0).map(r => `<span class="${gapOf(c, r) ? 'sg' : ''}"><svg viewBox="0 0 24 24" fill="none" stroke="${ICOL[r]}" stroke-width="2" ${ic}>${ICON[r]}</svg> ${fmtN(c[r])}</span>`).join(' '); }
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

/* ---------------- top bar, ticker, dock ---------------- */
function watchPhrase() { const h = new Date().getHours(); return h >= 5 && h < 8 ? ['Dawn wash', 'dawn'] : h >= 8 && h < 17 ? ['Day watch', 'day'] : h >= 17 && h < 20 ? ['Dusk wash', 'dusk'] : ['Night telemetry', 'night']; }
function renderTop() {
  const [ph, cl] = watchPhrase(); document.body.className = 'wash-' + cl; $('#watch').textContent = ph;
  $('#cc').innerHTML = `Command Center <b class="num">${ccLevel()}</b>`;
  $('#dia').innerHTML = svg('dia').replace('<svg', '<svg width="15" height="15"') + `<b class="num">${fmtN(S.dia)}</b>`;
  const cap = storeCap();
  $('#res').innerHTML = RES.map(r => `<div title="${RESN[r]}">${svg(r)}<span class="${S.res[r] >= cap - 1 ? 'full' : ''}">${fmtN(S.res[r])}</span></div>`).join('');
  $('#alarm').className = S.incoming.length ? 'on' : '';
  const set = setBonus(), au = $('#aura'); if (set) { au.className = 'on'; au.style.boxShadow = `inset 0 0 0 2px ${SETS[set].aura}66, inset 0 0 40px ${SETS[set].aura}33`; } else au.className = '';
}
function renderTicker() {
  const now = Date.now(), p = [];
  for (const j of S.jobs) p.push(`${({ build: 'Build', train: 'Train', res: 'Lab', heal: 'Heal', wall: 'Wall' })[j.kind]} ${j.why} <b>${fmtT((j.end - now) / 1000)}</b>`);
  for (const m of S.marches) p.push(`${marchName(m)} ${m.phase === 'stay' ? '<b>station</b>' : '<b>' + fmtT((m.end - now) / 1000) + '</b>'}`);
  for (const i of S.incoming) p.push(`<span class="sg">Contact ${i.name} <b class="sg">${fmtT((i.end - now) / 1000)}</b></span>`);
  if (S.shield.until > now) p.push(`Shield <b>${fmtT((S.shield.until - now) / 1000)}</b>`);
  $('#ticker').innerHTML = p.length ? p.join(' · ') : 'All quiet';
}
const TABS = [['map', 'Map'], ['base', 'Base'], ['train', 'Train'], ['lab', 'Lab'], ['med', 'Med'], ['march', 'March'], ['vault', 'Vault']];
function renderDock() { $('#dock').innerHTML = TABS.map(([k, n]) => `<button data-a="dock" data-k="${k}" class="${(UI.desk ? UI.desk : UI.page) === k ? 'on' : ''}">${svg(k).replace(/stroke="[^"]+"/, 'stroke="currentColor"')}<span>${n}</span></button>`).join(''); }

/* ---------------- map ---------------- */
const MAP = { cx: 120, cy: 220, ts: 28, w: 0, h: 0, dpr: 1, tags: [], drag: null, mini: null };
const cv = $('#map'), cx2 = cv.getContext('2d'), mini = $('#mini'), mx = mini.getContext('2d');
function mixHex(a, b, t) { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
const TC = { wild: '#171c1f', forest: mixHex('#0e1113', '#8ea36a', .2), plaza: mixHex('#171c1f', '#e7e4da', .2), throne: mixHex('#0e1113', '#e0a44a', .5), monster: mixHex('#0e1113', '#d4654a', .38), camp: mixHex('#0e1113', '#d4654a', .18), food: mixHex('#0e1113', '#8ea36a', .42), oil: mixHex('#0e1113', '#e07a2f', .42), energy: mixHex('#0e1113', '#5ec4d4', .42), steel: mixHex('#0e1113', '#9aa4a8', .42) };
function resizeMap() { const r = cv.getBoundingClientRect(); MAP.dpr = window.devicePixelRatio || 1; MAP.w = r.width; MAP.h = r.height; cv.width = r.width * MAP.dpr; cv.height = r.height * MAP.dpr; UI.dirty = true; }
function computeTags() {
  const seen = new Set(), tags = [];
  for (const k in S.own) {
    if (seen.has(k)) continue; const o = S.own[k], q = [k], patch = []; seen.add(k);
    while (q.length) { const c = q.pop(); patch.push(c); const [x, y] = unkey(c); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = key(x + dx, y + dy); if (!seen.has(n) && S.own[n] === o) { seen.add(n); q.push(n); } } }
    if (patch.length < 12) continue; let sx = 0, sy = 0; for (const c of patch) { const [x, y] = unkey(c); sx += x; sy += y; } sx /= patch.length; sy /= patch.length;
    let best = null, bd = 1e9; for (const c of patch) { const [x, y] = unkey(c), d = (x - sx) ** 2 + (y - sy) ** 2; if (d < bd) { bd = d; best = [x, y]; } }
    tags.push({ x: best[0], y: best[1], t: S.al[o].tag, c: alColor(o) });
  }
  MAP.tags = tags; terrDirty = false; MAP.mini = null;
}
function drawMini() {
  const w = 66, h = 130, sx = w / W, sy = h / H;
  if (!MAP.mini) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    g.fillStyle = '#171c1f'; g.fillRect(0, 0, w, h);
    g.fillStyle = mixHex('#171c1f', '#8ea36a', .35); g.beginPath(); g.arc(TX * sx, TY * sy, FOREST_R * sx * 1.6, 0, 7); g.fill();
    g.fillStyle = '#e7e4da55'; g.beginPath(); g.arc(TX * sx, TY * sy, 2.2, 0, 7); g.fill(); g.fillStyle = '#e0a44a'; g.fillRect(TX * sx - 1, TY * sy - 1, 2, 2);
    for (const k in S.own) { const [x, y] = unkey(k); g.fillStyle = alColor(S.own[k]); g.globalAlpha = .75; g.fillRect(Math.floor(x * sx), Math.floor(y * sy), 1, 1); } g.globalAlpha = 1;
    MAP.mini = c;
  }
  mx.clearRect(0, 0, w, h); mx.drawImage(MAP.mini, 0, 0);
  mx.strokeStyle = '#e0a44a'; mx.lineWidth = 1; const vw = MAP.w / MAP.ts * sx, vh = MAP.h / MAP.ts * sy; mx.strokeRect(MAP.cx * sx - vw / 2, MAP.cy * sy - vh / 2, Math.max(3, vw), Math.max(3, vh));
  mx.fillStyle = '#e7e4da'; mx.fillRect(S.base.x * sx - 1, S.base.y * sy - 1, 3, 3);
}
function drawMap() {
  if (terrDirty) computeTags();
  const g = cx2, ts = MAP.ts, w = MAP.w, h = MAP.h; g.setTransform(MAP.dpr, 0, 0, MAP.dpr, 0, 0);
  g.fillStyle = '#0e1113'; g.fillRect(0, 0, w, h);
  const x0 = Math.floor(MAP.cx - w / 2 / ts) - 1, x1 = Math.ceil(MAP.cx + w / 2 / ts) + 1, y0 = Math.floor(MAP.cy - h / 2 / ts) - 1, y1 = Math.ceil(MAP.cy + h / 2 / ts) + 1;
  g.textAlign = 'center'; g.textBaseline = 'middle'; const sel = UI.sel, now = Date.now();
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const t = tileInfo(x, y), px = Math.round(w / 2 + (x - MAP.cx) * ts - ts / 2), py = Math.round(h / 2 + (y - MAP.cy) * ts - ts / 2), s = ts - 1;
    let col = TC[t.terr] || TC.wild; if (t.kind === 'node') col = TC[t.nk]; else if (t.kind === 'monster') col = TC.monster; else if (t.kind === 'camp') col = TC.camp;
    g.fillStyle = col; g.fillRect(px, py, s, s);
    if (t.owner != null) { g.globalAlpha = .3; g.fillStyle = alColor(t.owner); g.fillRect(px, py, s, s); g.globalAlpha = 1; }
    if (t.enc) { g.strokeStyle = alColor(t.enc.o); g.setLineDash([3, 3]); g.lineWidth = 1; g.strokeRect(px + 2.5, py + 2.5, s - 5, s - 5); g.setLineDash([]); }
    g.font = '600 13px "Barlow Condensed",sans-serif';
    if (t.kind === 'node') { g.fillStyle = t.node.rich ? '#e0a44a' : '#e7e4da'; g.fillText(String(t.node.grade), px + s / 2, py + s / 2 + 1); if (t.node.rich) { g.strokeStyle = '#e0a44a'; g.lineWidth = 1; g.strokeRect(px + 1.5, py + 1.5, s - 3, s - 3); } }
    else if (t.kind === 'monster') { g.fillStyle = '#d4654a'; g.beginPath(); g.moveTo(px + s / 2, py + 5); g.lineTo(px + s - 6, py + s / 2); g.lineTo(px + s / 2, py + s - 5); g.lineTo(px + 6, py + s / 2); g.fill(); g.fillStyle = '#0e1113'; g.fillText(String(t.grade), px + s / 2, py + s / 2 + 1); }
    else if (t.kind === 'camp') { g.strokeStyle = '#d4654a'; g.lineWidth = 1.5; g.strokeRect(px + 7, py + 7, s - 14, s - 14); }
    else if (t.kind === 'throne') { g.fillStyle = '#e0a44a'; g.fillRect(px + 4, py + 4, s - 8, s - 8); g.fillStyle = '#1a1408'; g.font = '700 14px "Barlow Condensed"'; g.fillText('T', px + s / 2, py + s / 2 + 1); }
    else if (t.kind === 'base') { g.fillStyle = alColor(t.bot.al); g.fillRect(px + 3, py + 3, s - 6, s - 6); g.strokeStyle = '#0e1113'; g.lineWidth = 2; g.strokeRect(px + 5, py + 5, s - 10, s - 10); }
    else if (t.kind === 'pbase') { g.fillStyle = '#e0a44a'; g.fillRect(px + 2, py + 2, s - 4, s - 4); g.fillStyle = '#1a1408'; g.font = '700 14px "Barlow Condensed"'; g.fillText('HQ', px + s / 2, py + s / 2 + 1); }
    if (sel && sel.x === x && sel.y === y) { g.strokeStyle = '#e0a44a'; g.lineWidth = 2; g.strokeRect(px + 1, py + 1, s - 2, s - 2); }
  }
  for (const m of S.marches) { if (m.phase === 'out' || m.phase === 'back') { const f = clamp((now - m.start) / (m.end - m.start), 0, 1), a = m.phase === 'out' ? f : 1 - f; const bx = m.phase === 'out' ? S.base.x : m.tx, by = m.phase === 'out' ? S.base.y : m.ty; const ex = m.phase === 'out' ? m.tx : S.base.x, ey = m.phase === 'out' ? m.ty : S.base.y; const X = w / 2 + (S.base.x + (m.tx - S.base.x) * (m.phase === 'out' ? f : 1 - f) - MAP.cx) * ts, Y = h / 2 + (S.base.y + (m.ty - S.base.y) * (m.phase === 'out' ? f : 1 - f) - MAP.cy) * ts; g.strokeStyle = 'rgba(224,164,74,.5)'; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(w / 2 + (S.base.x - MAP.cx) * ts, h / 2 + (S.base.y - MAP.cy) * ts); g.lineTo(w / 2 + (m.tx - MAP.cx) * ts, h / 2 + (m.ty - MAP.cy) * ts); g.stroke(); g.setLineDash([]); g.fillStyle = '#e0a44a'; g.fillRect(X - 4, Y - 4, 8, 8); } }
  g.font = '700 12px "Barlow Condensed",sans-serif'; g.lineWidth = 3; g.strokeStyle = '#0e1113';
  for (const tg of MAP.tags) { const px = w / 2 + (tg.x - MAP.cx) * ts, py = h / 2 + (tg.y - MAP.cy) * ts; if (px < -30 || py < -10 || px > w + 30 || py > h + 10) continue; g.fillStyle = tg.c; g.strokeText(tg.t, px, py); g.fillText(tg.t, px, py); }
  drawMini(); $('#coord').textContent = `${Math.round(MAP.cx)},${Math.round(MAP.cy)} · base ${S.base.x},${S.base.y}`;
}
function panTo(x, y) { MAP.cx = clamp(x, 0, W - 1); MAP.cy = clamp(y, 0, H - 1); S.view = { x: MAP.cx, y: MAP.cy }; drawMap(); }
function initMap() {
  new ResizeObserver(resizeMap).observe(cv); resizeMap();
  MAP.cx = S.view.x; MAP.cy = S.view.y; let raf = 0;
  const sched = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; drawMap(); }); };
  cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); MAP.drag = { x: e.clientX, y: e.clientY, cx: MAP.cx, cy: MAP.cy, moved: false }; });
  cv.addEventListener('pointermove', e => { const d = MAP.drag; if (!d) return; const dx = e.clientX - d.x, dy = e.clientY - d.y; if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true; if (d.moved) { MAP.cx = clamp(d.cx - dx / MAP.ts, 0, W - 1); MAP.cy = clamp(d.cy - dy / MAP.ts, 0, H - 1); sched(); } });
  const up = e => { const d = MAP.drag; MAP.drag = null; if (!d) return; if (!d.moved) { const r = cv.getBoundingClientRect(), x = Math.round(MAP.cx + (e.clientX - r.left - MAP.w / 2) / MAP.ts), y = Math.round(MAP.cy + (e.clientY - r.top - MAP.h / 2) / MAP.ts); if (x >= 0 && y >= 0 && x < W && y < H) selectTile(x, y); } else S.view = { x: MAP.cx, y: MAP.cy }; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', () => { MAP.drag = null; });
  mini.addEventListener('click', e => { const r = mini.getBoundingClientRect(); panTo((e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H); });
  $('#compass').innerHTML = [['N', 'n'], ['W', 'w'], ['Base', 'b'], ['E', 'e'], ['S', 's'], ['Jump to throne', 't']].map(([n, k]) => `<button class="btn sm glass" data-a="jump" data-k="${k}">${n}</button>`).join('');
}
function selectTile(x, y) { UI.sel = { x, y }; UI.sheet = { type: 'tile', x, y }; if ((y - MAP.cy) * MAP.ts + MAP.h / 2 > MAP.h * 0.4) MAP.cy = clamp(y + 4, 0, H - 1); D(); }

/* ---------------- composer ---------------- */
function compHTML(cn) {
  const c = UI[cn], cap = cn === 'rcomp' ? Math.min(headcount(), rallyCap()) : headcount(), tot = compTotal(c);
  const rows = CLS.map(k => `<div class="flex sp" style="margin:4px 0"><span class="lbl" style="width:66px">${CLSD[k].n}</span><span class="t mut grow">/${fmtN(clsAvail(k))}</span><div class="step"><button data-a="cstep" data-cn="${cn}" data-c="${k}" data-d="-100">«</button><button data-a="cstep" data-cn="${cn}" data-c="${k}" data-d="-10">−</button><b class="num">${c[k]}</b><button data-a="cstep" data-cn="${cn}" data-c="${k}" data-d="10">+</button><button data-a="cstep" data-cn="${cn}" data-c="${k}" data-d="100">»</button></div></div>`).join('');
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
  let h = `<div class="flex sp"><div><div class="h1">${tileLabel(t)}</div><div class="sub num">${x},${y} · grade ${t.grade} · owner ${ownerTxt(t.owner)}${t.enc ? ' · encamping' : ''}</div></div><button class="btn sm line" data-a="closesheet">Close</button></div>`;
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
  h = `<div class="flex sp"><div><div class="h1">${d.n} <span class="br num">${p.l}</span></div><div class="sub">${area === 'in' ? 'Inner' : 'Outer'} plot ${idx + 1} · ${effectText(p.b, p.l)}</div></div><button class="btn sm line" data-a="closesheet">Close</button></div>`;
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
  const side = (s, cl) => `<div class="${cl}"><div class="lbl">${s.name}</div>${s.rows.map(x => `<div class="rr"><span>${x[0]}</span><span class="num">${typeof x[1] === 'number' ? x[1] + (x[2] ? ' <span class="sg">−' + x[2] + '</span>' : '') : x[1]}</span></div>`).join('')}<div class="lbl mt">Boosts</div>${s.boosts.map(x => `<div class="rr"><span>${x[0]}</span><span class="num">${x[1]}</span></div>`).join('') || '<div class="sub">—</div>'}</div>`;
  let wtxt = ''; const wn = r.left.rows.reduce((a, x) => a + (x[3] || 0), 0); if (wn) wtxt = ` · wounded ${wn}`;
  return `<div class="flex sp"><div><div class="h1">${r.title}</div><div class="sub">${r.win == null ? 'Intel' : r.win ? '<span class="ox">Victory</span>' : '<span class="sg">Defeat</span>'}${r.obl ? ' · obliterated' : ''}${wtxt}</div></div><button class="btn sm line" data-a="closesheet">Close</button></div><div class="split mt">${side(r.left, 'me')}${side(r.right, 'them')}</div>${r.joiners ? `<div class="lbl mt">Joiners</div>${r.joiners.map(j => `<div class="rr"><span>${j.name}</span><span class="num">${j.sent} sent · <span class="sg">−${j.lost}</span> · wounded ${j.wounded}</span></div>`).join('')}` : ''}`;
}
function renderSheet() {
  const el = $('#sheet'), s = UI.sheet; if (!s || UI.desk) { el.className = 'sheet glass'; return; }
  el.className = 'sheet glass on';
  el.innerHTML = s.type === 'tile' ? sheetTile(s.x, s.y) : s.type === 'plot' ? sheetPlot(s.area, s.idx) : s.type === 'report' ? sheetReport(s.id) : '';
}

/* ---------------- base page ---------------- */
function renderBase() {
  const hr = hourly(), pl = (ar, n) => S.plots[ar].map((p, i) => {
    const busy = S.jobs.some(j => j.kind === 'build' && j.area === ar && j.idx === i);
    return p ? `<button class="plot ${busy ? 'busy' : ''}" data-a="plot" data-ar="${ar}" data-i="${i}" title="${BLD[p.b].n}"><b>${BLD[p.b].s}</b><i class="num">${p.l}${busy ? '↑' : ''}</i></button>` : `<button class="plot empty" data-a="plot" data-ar="${ar}" data-i="${i}"><b>+</b></button>`;
  }).join('');
  const f = shieldOn(), fs = inForest();
  $('#pg-base').innerHTML = `
  <div class="panel"><div class="hd"><h3>Command Center ${ccLevel()}</h3><span class="tag br">${S.al[0].tag}</span></div><div class="bd">
    <div class="split"><div><div class="lbl">Headcount</div><div class="big num">${fmtN(headcount())}</div></div><div><div class="lbl">March queues</div><div class="big num">${marchQueues()}</div></div><div><div class="lbl">Help clicks</div><div class="big num">${helpCap()}</div></div><div><div class="lbl">StoreHouse</div><div class="big num">${fmtN(storeCap())}</div><div class="sub">protected ${fmtN(protectedFloor())}</div></div></div>
    <div class="sub mt">Per hour, sheet: ${RES.filter(r => hr[r]).map(r => `${RESN[r]} ${fmtN(hr[r])}`).join(' · ')}. Runs at ×${DRILL}.</div>
    <div class="flex wrap mt"><button class="btn ${f ? 'on' : 'line'}" data-a="shield">Peace shield ${S.shield.until > Date.now() ? (fs ? 'up (dead in forest)' : 'up') : 'off'}</button><span class="sub">8 h sheet · ${fmtT(shieldSheet() / OCC)} drill</span></div>
    <div class="flex wrap mt"><button class="btn line" data-a="builder2" ${S.builders >= 2 ? 'disabled' : ''}>${S.builders >= 2 ? 'Two builders' : 'Second builder · 220◆'}</button><button class="btn line" data-a="tpr" ${heroLocked() ? 'disabled' : ''}>Random teleport</button></div>
    ${heroLocked() ? '<div class="sub mt sg">A hero is out. The base cannot teleport.</div>' : ''}
  </div></div>
  ${S.jobs.filter(j => j.kind === 'build').map(j => `<div class="panel"><div class="bd"><div class="lbl">Build ${j.why}</div>${jobCtl(j)}</div></div>`).join('')}
  <div class="panel"><div class="hd"><h3>Inner plots</h3><span class="sub">25</span></div><div class="bd"><div class="grid5">${pl('in')}</div></div></div>
  <div class="panel"><div class="hd"><h3>Outer plots</h3><span class="sub">25</span></div><div class="bd"><div class="grid5">${pl('out')}</div></div></div>`;
}

/* ---------------- desk: train, lab, med ---------------- */
function stepper(act, d, val, extra) { return `<div class="step"><button data-a="${act}" ${extra || ''} data-d="-100">«</button><button data-a="${act}" ${extra || ''} data-d="-10">−</button><b class="num">${val}</b><button data-a="${act}" ${extra || ''} data-d="10">+</button><button data-a="${act}" ${extra || ''} data-d="100">»</button></div>`; }
function renderTrain() {
  const T = UI.tr, cls = T.cls, t = T.tier, cap = batchCap(t); T.n = clamp(T.n, 0, cap);
  const gate = trainGate(t), c = trainCost(cls, t); const cc = {}; for (const r in c) cc[r] = c[r] * T.n; const job = jobsOf('train')[0];
  let h = `<div class="tabs2">${CLS.map(k => `<button class="${k === cls ? 'on' : ''}" data-a="trcls" data-c="${k}">${CLSD[k].n}</button>`).join('')}</div>
  <div class="tabs2">${[1, 2, 3, 4].map(x => `<button class="${x === t ? 'on' : ''}" data-a="trtier" data-t="${x}">T${x}${trainGate(x) ? ' ·' : ''}</button>`).join('')}</div>
  <div class="panel"><div class="hd"><h3>${tierName(cls, t)}</h3><span class="tag">${CLSD[cls].n} T${t}</span></div><div class="bd">
   ${(() => { const s = unitStat(cls, t); return `<div class="sub">Attack ${s.atk.toFixed(0)} · HP ${s.hp.toFixed(0)} · load ${s.load.toFixed(0)} · speed ${Math.round(s.speed)} · ${cls === 'siege' ? 'wall factor 2.2, 0.28 vs field' : `beats ${CLSD[CLSD[cls].beats].n}, loses to ${CLSD[CLSD[cls].loses].n}`}</div>`; })()}
   <div class="sub mt">Per troop: ${dualT(CLSD[cls].train[t - 1])}</div>
   ${gate ? `<div class="sub mt sg">${gate}</div>` : `<div class="flex sp mt"><span class="lbl">Batch (cap ${cap})</span>${stepper('trn', 0, T.n)}</div>
   <div class="mt">${costHTML(cc)}</div><div class="sub mt">Batch time ${dualT(trainSheet(cls, t, T.n))}</div>
   <div class="flex mt wrap"><button class="btn sm line" data-a="trmax">Max</button>${payBtn(cc, 'train', {}, 'Train', 'pri')}</div>`}
  </div></div>`;
  if (job) h += `<div class="panel"><div class="bd"><div class="lbl">Training ${job.why}</div>${jobCtl(job)}</div></div>`;
  h += `<div class="panel"><div class="hd"><h3>Garrison</h3></div><div class="bd">${CLS.map(k => [1, 2, 3, 4].filter(x => S.troops[k + x]).map(x => `<div class="rr"><span>${tierName(k, x)}</span><span class="num">${S.troops[k + x]}</span></div>`).join('')).join('') || '<div class="sub">Empty.</div>'}</div></div>`;
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
    const rows = Object.keys(S.wounded).filter(k => S.wounded[k] > 0).map(k => { const [c, t] = ckSplit(k), n = S.wounded[k], cost = healCost(c, t, n); return `<div class="panel"><div class="bd"><div class="flex sp"><b class="h" style="font-size:17px">${tierName(c, t)}</b><span class="num">${n} wounded</span></div><div class="mt">${costHTML(cost)}</div><div class="flex mt wrap">${t > 1 ? `<span class="sub">${dualT(CLSD[c].train[t - 1] * n * .5 / (1 + mods().heal + rv('repair')))}</span>` : '<span class="sub">instant</span>'}${payBtn(cost, 'heal', { k }, 'Heal all')}</div></div></div>`; }).join('');
    h += rows || '<div class="sub">Nobody wounded.</div>';
  } else {
    const W_ = UI.wl, ws = wallStats(), cap = lvlMax('defense') * 40, job = jobsOf('wall')[0];
    const room = cap - sumCol(S.wall) - (job ? job.n : 0), t = W_.tier; W_.n = clamp(W_.n, 0, Math.max(0, room));
    const cost = {}; for (const r in WALL_COST) cost[r] = Math.round(WALL_COST[r] * WT[t - 1].pow * W_.n / 2);
    h += `<div class="panel"><div class="bd"><div class="split"><div><div class="lbl">Wall HP</div><div class="big num">${fmtN(ws.hp)}</div></div><div><div class="lbl">Wall attack</div><div class="big num">${fmtN(ws.atk)}</div></div></div><div class="sub mt">Radar Station ${lvlMax('radar')} · Defense Center ${lvlMax('defense')} · crew ${sumCol(S.wall)}/${cap}</div></div></div>`;
    h += `<div class="tabs2">${WCLS.map(k => `<button class="${W_.cls === k ? 'on' : ''}" data-a="wlcls" data-c="${k}">${WCLSD[k].n.split(' ')[0]} ${WCLSD[k].n.split(' ')[1].slice(0, 5)}</button>`).join('')}</div><div class="tabs2">${[1, 2, 3, 4].map(x => `<button class="${x === t ? 'on' : ''}" data-a="wltier" data-t="${x}">T${x}${lvlMax('defense') < WALL_GATE[x - 1] ? ' ·' : ''}</button>`).join('')}</div>`;
    const gate = lvlMax('defense') < WALL_GATE[t - 1] ? 'Defense Center ' + WALL_GATE[t - 1] + ' needed.' : null;
    h += `<div class="panel"><div class="hd"><h3>${WCLSD[W_.cls].names[t - 1]}</h3><span class="tag">${WCLSD[W_.cls].counter ? 'counters ' + CLSD[WCLSD[W_.cls].counter].n : 'counters all'}</span></div><div class="bd"><div class="sub">Power ${WT[t - 1].pow} · HP ${WT[t - 1].hp} · load 0 · never marches · ${dualT(WT[t - 1].sec)} each</div>${gate ? `<div class="sub sg mt">${gate}</div>` : `<div class="flex sp mt"><span class="lbl">Batch (room ${room})</span>${stepper('wln', 0, W_.n)}</div><div class="mt">${costHTML(cost)}</div><div class="sub mt">${dualT(WT[t - 1].sec * W_.n)}</div><div class="mt">${payBtn(cost, 'wall', {}, 'Crew')}</div>`}</div></div>`;
    if (job) h += `<div class="panel"><div class="bd"><div class="lbl">Crewing ${job.why}</div>${jobCtl(job)}</div></div>`;
    h += `<div class="panel"><div class="hd"><h3>On the wall</h3></div><div class="bd">${Object.keys(S.wall).filter(k => S.wall[k]).map(k => `<div class="rr"><span>${ckName(k)}</span><span class="num">${S.wall[k]}</span></div>`).join('') || '<div class="sub">Bare wall.</div>'}</div></div>`;
  }
  return h;
}
function renderDesk() {
  const el = $('#desk'); if (!UI.desk) { el.className = 'glass'; return; }
  el.className = 'glass on';
  $('#desktabs').innerHTML = [['train', 'Train'], ['lab', 'Lab'], ['med', 'Med']].map(([k, n]) => `<button class="${UI.desk === k ? 'on' : ''}" data-a="dock" data-k="${k}">${n}</button>`).join('') + `<button class="x" data-a="closedesk">✕</button>`;
  $('#deskbody').innerHTML = UI.desk === 'train' ? renderTrain() : UI.desk === 'lab' ? renderLab() : renderMed();
}

/* ---------------- march page ---------------- */
function renderMarch() {
  const sub = [['cols', 'Columns'], ['field', 'Field'], ['rally', 'Rally'], ['rep', 'Reports']];
  let h = `<div class="tabs2">${sub.map(([k, n]) => `<button class="${UI.mt === k ? 'on' : ''}" data-a="mtab" data-k="${k}">${n}${k === 'rep' && S.reports.length ? ' ' + S.reports.length : ''}</button>`).join('')}</div>`;
  if (UI.mt === 'cols') {
    if (S.incoming.length) h += `<div class="panel" style="border-color:var(--signal)"><div class="hd"><h3 class="sg">Hostile contact</h3></div><div class="bd">${S.incoming.map(i => `<div class="rr"><span>${i.name}</span><span>${tm(i.end)}</span></div>`).join('')}<div class="sub mt">Shield eats the hit. Unshielded, the wall and garrison take it.${shieldOn() ? '' : ' Shield is down.'}</div></div></div>`;
    h += S.marches.length ? S.marches.map(m => {
      const ph = { out: 'Out', sit: 'Hauling', hold: 'Holding', back: 'Walking home', stay: 'On station', wait: 'Gathering' }[m.phase];
      return `<div class="panel"><div class="bd"><div class="flex sp"><b class="h" style="font-size:18px">${marchName(m)} ${m.kind === 'rally' ? m.tname : m.tx + ',' + m.ty}</b><span class="tag ${m.off ? 'sg' : ''}">${ph}</span></div><div class="sub">${Object.keys(m.col).map(k => m.col[k] + ' ' + ckName(k)).join(', ')}${m.hero ? ' · ' + HEROES[S.hero.id].n : ''}</div>${m.kind === 'rally' && m.phase === 'wait' ? `<div class="sub mt">Joiners in: ${m.joiners.filter(j => j.in).length}/${m.joiners.length} · locked, only you can cancel</div>` : ''}${lootTxt(m)}${m.phase !== 'stay' ? jobCtlM(m) : ''}<div class="flex mt wrap">${m.phase === 'back' ? '' : `<button class="btn sm bad" data-a="recall" data-id="${m.id}">${m.kind === 'rally' && m.phase === 'wait' ? 'Cancel rally' : m.phase === 'stay' || m.phase === 'hold' ? 'Withdraw' : 'Recall'}</button>`}</div></div></div>`;
    }).join('') : '<div class="sub mb">No columns out. Tap the map to send one.</div>';
    h += `<div class="panel"><div class="hd"><h3>Log</h3></div><div class="bd">${S.log.slice(0, 14).map(l => `<div class="rr"><span class="${l.k === 'bad' ? 'sg' : l.k === 'good' ? 'ox' : l.k === 'warn' ? 'br' : ''}">${l.m}</span><span class="mut num">${new Date(l.t).toTimeString().slice(0, 8)}</span></div>`).join('') || '<div class="sub">Nothing yet.</div>'}</div></div>`;
  } else if (UI.mt === 'field') {
    const col = previewCol(UI.comp), e = estOut('field', S.base.x, S.base.y, UI.comp), g = UI.fg; const Dd = mkSide({}, {}, 1, null, monsterSyn(g, true));
    h += `<div class="panel"><div class="hd"><h3>Field march</h3></div><div class="bd"><div class="sub">Fights a seeded camp on a fixed 3600-tile leg, walks home with loot capped by load. Strips the shield.</div><div class="flex sp mt"><span class="lbl">Camp grade</span><div class="step"><button data-a="fg" data-d="-1">−</button><b class="num">${g}</b><button data-a="fg" data-d="1">+</button></div></div><div class="sub mt">Odds ${oddsText(Dd, col, UI.comp.hero) || '—'}${e ? ` · out ${fmtT(e.ms / 1000)}` : ''}</div>${compHTML('comp')}<div class="flex mt"><button class="btn pri tall grow" data-a="launch" data-k="field" ${compTotal(UI.comp) ? '' : 'disabled'}>Send field march</button></div></div></div>`;
  } else if (UI.mt === 'rally') {
    const R_ = UI.rl, hl = lvlMax('hall'), waits = RALLY_WAITS;
    h += `<div class="panel"><div class="hd"><h3>Rally</h3><span class="tag">Hall ${hl} · ${fmtN(rallyCap())} cap</span></div><div class="bd"><div class="sub">Targets: real commander bases and the citadel. Waiting troops are locked. Only you cancel. If you bring no hero, the rally gets no hero, gear, gem or rank bonus.</div>
    <div class="flex wrap mt"><span class="lbl">Target</span><select data-a="rtarget"><option value="citadel" ${R_.target === 'citadel' ? 'selected' : ''}>Citadel</option>${S.bots.map(b => `<option value="${b.al}" ${String(R_.target) === String(b.al) ? 'selected' : ''}>${b.tag} ${b.cmd}</option>`).join('')}</select></div>
    <div class="flex wrap mt"><span class="lbl">Wait</span>${waits.map(([n, s], i) => `<button class="btn sm ${R_.wait === i ? 'on' : 'line'}" data-a="rwait" data-i="${i}">${n}</button>`).join('')}</div><div class="sub mt">${dualScale(Math.max(5000, waits[R_.wait][1] / OCC * 1000))}</div>
    <div class="flex sp mt"><span class="lbl">Extra slots 7–10 · tokens ${S.tokens}</span><div class="step"><button data-a="rslots" data-d="-1">−</button><b class="num">${R_.slots}</b><button data-a="rslots" data-d="1">+</button></div></div><div class="sub">Slots ${6 + R_.slots} of 10 · orders ${S.orders}</div>
    ${compHTML('rcomp')}<div class="flex mt"><button class="btn pri tall grow" data-a="rally" ${compTotal(UI.rcomp) && hl ? '' : 'disabled'}>Lead rally</button></div></div></div>`;
  } else {
    h += S.reports.length ? `<div class="list">${S.reports.map(r => `<div class="it" data-a="report" data-id="${r.id}" style="cursor:pointer"><div class="grow"><b class="h" style="font-size:16px">${r.title}</b><div class="sub">${new Date(r.t).toTimeString().slice(0, 8)} · ${r.win == null ? 'intel' : r.win ? 'victory' : 'defeat'}</div></div><span class="tag ${r.win === false ? 'sg' : r.win ? 'br' : ''}">${r.kind}</span></div>`).join('')}</div>` : '<div class="sub">No reports. A wiped column writes none.</div>';
  }
  return h;
}
function lootTxt(m) { const p = []; for (const r in m.loot.res) p.push(fmtN(m.loot.res[r]) + ' ' + RESN[r]); for (const g in m.loot.bars) p.push(m.loot.bars[g] + '× grade-' + g + ' bar'); if (m.loot.shard) p.push(SETS[m.loot.shard].n + ' shard'); if (m.haul && m.phase === 'sit') p.push('hauling ' + fmtN(m.haul)); return p.length ? `<div class="sub mt">Cargo: ${p.join(', ')}</div>` : ''; }
function jobCtlM(m) {
  if (m.kind === 'rally' && m.phase !== 'wait') return `<div class="flex mt"><span>${tm(m.end, false)}</span><span class="sub">a launched column takes no speed-up</span></div>`;
  return jobCtl(Object.assign({}, m, { ask: undefined, kind: 'march', end: m.end }));
}

/* ---------------- vault page ---------------- */
function renderVault() {
  const tabs = [['forge', 'Forge'], ['store', 'Store'], ['market', 'Market'], ['court', 'Court'], ['ledger', 'Ledger']];
  let h = `<div class="tabs2">${tabs.map(([k, n]) => `<button class="${UI.vt === k ? 'on' : ''}" data-a="vtab" data-k="${k}">${n}</button>`).join('')}</div>`;
  if (UI.vt === 'forge') h += forgeHTML(); else if (UI.vt === 'store') h += storeHTML(); else if (UI.vt === 'market') h += marketHTML(); else if (UI.vt === 'court') h += courtHTML(); else h += `<div class="panel"><div class="hd"><h3>Diamond ledger</h3><b class="num br">${S.dia}◆</b></div><div class="bd">${S.ledger.map(l => `<div class="rr"><span>${l.why}</span><span class="num ${l.n < 0 ? 'sg' : 'ox'}">${l.n > 0 ? '+' : ''}${l.n} → ${l.bal}</span></div>`).join('') || '<div class="sub">No entries. A local ledger, not a store.</div>'}<div class="flex mt"><button class="btn bad sm" data-a="reset">Reset save</button></div></div></div>`;
  return h;
}
function forgeHTML() {
  const u = gradeUnits(), C = UI.cr, sel = C.sel, selN = sumCol(sel);
  const bars = [1, 2, 3, 4, 5, 6].map(g => `<div class="flex sp" style="margin:4px 0"><span class="lbl" style="width:60px">Grade ${g}</span><b class="num grow">${S.bars[g] || 0}</b><div class="step"><button data-a="crsel" data-g="${g}" data-d="-1">−</button><b class="num">${sel[g] || 0}</b><button data-a="crsel" data-g="${g}" data-d="1">+</button></div><button class="btn sm" data-a="refine" data-g="${g}" ${g < 6 && (S.bars[g] || 0) >= 4 ? '' : 'disabled'}>Refine</button></div>`).join('');
  let tw = 0; for (const g in sel) if (sel[g]) tw += sel[g] * sel[g];
  const odds = tw ? Object.keys(sel).filter(g => sel[g]).map(g => `G${g} ${Math.round(sel[g] * sel[g] / tw * 100)}%`).join(' · ') : '—';
  const worn = SLOTS.map(s => { const p = slotPiece(s); return `<div class="rr"><span>${s}</span><span class="num ${p ? 'br' : 'mut'}">${p ? 'G' + p.grade + ' ' + (p.set ? SETS[p.set].n : '') + ' ' + pieceText(p) : 'empty'}</span></div>`; }).join('');
  return `<div class="panel"><div class="hd"><h3>Bars</h3><span class="tag">Gems ${S.gems}</span></div><div class="bd"><div class="flex sp"><span class="lbl">Stockpile</span><b class="num">${u}/1024</b></div><div class="bar mt"><i style="width:${Math.min(100, u / 1024 * 100)}%"></i><u style="left:50%"></u></div><div class="flex sp sub"><span>0</span><span>512</span><span>1024 = grade 6</span></div><div class="mt">${bars}</div><div class="sub">Four of grade N refine into one of N+1.</div></div></div>
  <div class="panel"><div class="hd"><h3>Craft</h3><span class="tag ${selN === 4 ? 'br' : ''}">${selN}/4 bars</span></div><div class="bd"><div class="tabs2">${SLOTS.map(s => `<button class="${C.slot === s ? 'on' : ''}" data-a="crslot" data-s="${s}">${s}</button>`).join('')}</div>
  ${C.slot === 'accessory' ? `<div class="flex mb"><span class="lbl">Stamp</span><button class="btn sm ${C.stat === 'training' ? 'on' : 'line'}" data-a="crstat" data-s="training">Training</button><button class="btn sm ${C.stat === 'yield' ? 'on' : 'line'}" data-a="crstat" data-s="yield">Yield</button></div>` : ''}
  <div class="flex wrap mb"><span class="lbl">Shard</span><button class="btn sm ${!C.shard ? 'on' : 'line'}" data-a="crshard" data-s="">None</button>${Object.keys(SETS).map(s => `<button class="btn sm ${C.shard === s ? 'on' : 'line'}" data-a="crshard" data-s="${s}" ${S.shards[s] ? '' : 'disabled'}>${SETS[s].n} ${S.shards[s] || 0}</button>`).join('')}</div>
  <div class="sub">Roll weights each grade by count². Odds ${odds}. The lone bar can still win.</div><div class="sub">${C.slot}: ${C.slot === 'accessory' ? 'stamped stat' : SLOT_WHAT[C.slot]} +${SLOT_CURVE[C.slot][0]}% to +${SLOT_CURVE[C.slot][1]}%</div>
  <div class="flex mt"><button class="btn pri" data-a="craft" ${selN === 4 ? '' : 'disabled'}>Refine into gear</button><button class="btn line" data-a="crclear">Clear</button></div></div></div>
  <div class="panel"><div class="hd"><h3>Worn</h3><span class="tag ${setBonus() ? 'br' : ''}">${setBonus() ? SETS[setBonus()].n + ' set · ' + SETS[setBonus()].d : 'no full set'}</span></div><div class="bd">${worn}</div></div>
  <div class="panel"><div class="hd"><h3>Rack</h3></div><div class="bd list">${S.gear.pieces.map(p => { const w = S.gear.worn[p.slot] === p.id; return `<div class="it"><div class="grow"><b class="h" style="font-size:15px">${p.slot} G${p.grade} ${p.set ? SETS[p.set].n : ''}</b><div class="sub">${pieceText(p)}</div></div><button class="btn sm ${w ? 'line' : 'pri'}" data-a="${w ? 'rack' : 'wear'}" data-id="${p.id}">${w ? 'Rack' : 'Wear'}</button></div>`; }).join('') || '<div class="sub">Nothing forged.</div>'}</div></div>`;
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
function courtHTML() {
  const th = S.throne, king = th.ruler === 0, hero = HEROES[S.hero.id];
  let h = `<div class="panel"><div class="hd"><h3>Throne</h3><span class="tag ${king ? 'br' : ''}">${th.ruler != null ? alName(th.ruler) + ' rules' : th.holder != null ? alName(th.holder) + ' holds' : 'empty'}</span></div><div class="bd"><div class="sub">${th.ruler != null ? 'Reign ends ' : th.holder != null ? 'Hold completes ' : ''}${th.ruleUntil ? tm(th.ruleUntil, false) + ' drill · 3 sheet days' : th.holdEnd ? tm(th.holdEnd, false) + ' · 6 sheet hours' : ''}</div><div class="sub mt">Score ${S.score}</div></div></div>`;
  h += `<div class="panel"><div class="hd"><h3>Heroes</h3><span class="tag ${S.hero.captured ? 'sg' : ''}">Rank ${S.hero.rank}</span></div><div class="bd">${Object.keys(HEROES).map(k => `<div class="it flex" style="padding:6px 0"><div class="grow"><b class="h" style="font-size:16px">${HEROES[k].n}</b> <span class="sub">${HEROES[k].role} · ${HEROES[k].d}</span></div><button class="btn sm ${S.hero.id === k ? 'on' : 'line'}" data-a="hero" data-k="${k}">${S.hero.id === k ? 'Stationed' : 'Station'}</button></div>`).join('')}${S.hero.captured ? `<div class="flex wrap mt"><span class="sg">${hero.n} is captured.</span><button class="btn sm" data-a="ransom">Ransom 2500</button><button class="btn sm line" data-a="ransom" data-seal="1">Use seal</button></div>` : heroLocked() ? '<div class="sub mt">The hero is out. The base cannot teleport.</div>' : ''}</div></div>`;
  h += `<div class="panel"><div class="hd"><h3>Alliance ${S.al[0].tag}</h3><span class="sub">${Object.values(S.own).filter(o => o === 0).length} tiles</span></div><div class="bd"><div class="flex wrap">${STD_KEYS.map(c => `<button class="sw${S.al[0].color === c ? ' on' : ''}" style="background:${STD[c]}" data-a="recolor" data-c="${c}" title="${c}"></button>`).join('')}</div><div class="sub mt">${king ? 'You rule. Pick a standard.' : 'Only the ruling king can recolor.'}</div><div class="flex mt"><button class="btn bad sm" data-a="disband">Disband alliance</button></div></div></div>`;
  if (king) {
    h += `<div class="panel"><div class="hd"><h3>Officers R4</h3><span class="tag">${th.officers.length}/2</span></div><div class="bd">${S.roster.map(n => `<div class="it flex" style="padding:4px 0"><span class="grow">${n}</span><button class="btn sm ${th.officers.includes(n) ? 'on' : 'line'}" data-a="appoint" data-n="${n}">${th.officers.includes(n) ? 'R4' : 'Appoint'}</button></div>`).join('')}</div></div>
    <div class="panel"><div class="hd"><h3>Titles</h3></div><div class="bd">${['You'].concat(S.roster).map(n => { const cur = S.titles[n === 'You' ? 'you' : n]; return `<div class="flex wrap" style="margin:4px 0"><b style="width:74px">${n}</b><select data-a="title" data-n="${n}"><option value="">—</option>${Object.keys(TITLES).map(t => `<option value="${t}" ${cur === t ? 'selected' : ''}>${TITLES[t].n} ${TITLES[t].d}</option>`).join('')}</select></div>`; }).join('')}<div class="sub mt">R5 and the two R4 may grant. When the reign ends, officers and titles clear.</div></div></div>`;
  }
  return h;
}

/* ---------------- actions ---------------- */
const A = {
  dock(d) { const k = d.k; if (k === 'train' || k === 'lab' || k === 'med') { UI.desk = k; UI.sheet = null; } else { UI.desk = null; UI.page = k; if (k !== 'map') UI.sheet = null; showPage(); } D(); },
  closedesk() { UI.desk = null; D(); }, closesheet() { UI.sheet = null; UI.sel = null; D(); },
  jump(d) { const k = d.k; if (k === 'n') panTo(MAP.cx, MAP.cy - 60); else if (k === 's') panTo(MAP.cx, MAP.cy + 60); else if (k === 'w') panTo(MAP.cx - 60, MAP.cy); else if (k === 'e') panTo(MAP.cx + 60, MAP.cy); else if (k === 'b') panTo(S.base.x, S.base.y); else panTo(TX, TY); },
  plot(d) { UI.sheet = { type: 'plot', area: d.ar, idx: +d.i }; UI.page = 'base'; D(); },
  build(d) { run(startBuild(d.area, +d.idx, d.b, !!d.cover)); },
  rush(d) { run(rushJob(+d.id)); }, slip(d) { run(slipJob(+d.id)); }, help(d) { run(askHelp(+d.id)); },
  cstep(d) { const c = UI[d.cn], cap = d.cn === 'rcomp' ? Math.min(headcount(), rallyCap()) : headcount(), tot = compTotal(c); c[d.c] = clamp(c[d.c] + +d.d, 0, Math.max(0, Math.min(clsAvail(d.c), cap - (tot - c[d.c])))); D(); },
  best(d) { const c = UI[d.cn]; Object.assign(c, bestComp(d.cn === 'rcomp' ? Math.min(headcount(), rallyCap()) : headcount())); D(); },
  clear(d) { const c = UI[d.cn]; CLS.forEach(k => c[k] = 0); c.hero = false; D(); }, chero(d) { const c = UI[d.cn]; c.hero = !c.hero; D(); },
  launch(d) {
    const s = UI.sheet, c = UI.comp; let x, y;
    if (d.k === 'field') { x = S.base.x; y = S.base.y; } else { x = s.x; y = s.y; }
    const e = launchMarch(d.k, x, y, c, c.hero, { grade: UI.fg }); if (run(e, d.k === 'field' ? 'Field column is out.' : 'Column is out.')) { CLS.forEach(k => c[k] = 0); c.hero = false; if (d.k !== 'field') UI.sheet = null; } else if (!e) D();
  },
  scout(d) { run(scoutTarget(+d.x, +d.y)); },
  tp(d) { if (run(doTeleport(+d.x, +d.y))) { UI.sheet = null; UI.sel = null; MAP.cx = S.base.x; MAP.cy = S.base.y; } },
  tpr() { if (run(randomTeleport())) { MAP.cx = S.base.x; MAP.cy = S.base.y; } },
  shield() { run(toggleShield()); }, anti() { S.anti = !S.anti; D(); }, builder2() { run(buyBuilder(), 'Second builder hired.'); },
  wing(d) { UI.sheet = null; if (d.w === 'train') A.dock({ k: 'train' }); else if (d.w === 'lab') A.dock({ k: 'lab' }); else if (d.w === 'med') { UI.med = 'depot'; A.dock({ k: 'med' }); } else if (d.w === 'wall') { UI.med = 'wall'; A.dock({ k: 'med' }); } else if (d.w === 'rally') { UI.mt = 'rally'; A.dock({ k: 'march' }); } else { UI.vt = 'market'; A.dock({ k: 'vault' }); } },
  trcls(d) { UI.tr.cls = d.c; UI.tr.n = 0; D(); }, trtier(d) { UI.tr.tier = +d.t; UI.tr.n = 0; D(); },
  trn(d) { UI.tr.n = clamp(UI.tr.n + +d.d, 0, batchCap(UI.tr.tier)); D(); }, trmax() { UI.tr.n = batchCap(UI.tr.tier); D(); },
  train(d) { const T = UI.tr; run(startTrain(T.cls, T.tier, T.n, !!d.cover)); },
  research(d) { run(startResearch(d.id, !!d.cover)); }, labtab(d) { UI.lab = d.k; D(); },
  medtab(d) { UI.med = d.k; D(); }, heal(d) { const [c, t] = ckSplit(d.k); run(startHeal(c, t, S.wounded[d.k] || 0, !!d.cover)); },
  wlcls(d) { UI.wl.cls = d.c; UI.wl.n = 0; D(); }, wltier(d) { UI.wl.tier = +d.t; UI.wl.n = 0; D(); }, wln(d) { UI.wl.n = Math.max(0, UI.wl.n + +d.d); D(); },
  wall(d) { const w = UI.wl; run(startWall(w.cls, w.tier, w.n, !!d.cover)); },
  mtab(d) { UI.mt = d.k; D(); }, vtab(d) { UI.vt = d.k; D(); },
  recall(d) { run(recall(+d.id)); }, report(d) { UI.sheet = { type: 'report', id: +d.id }; D(); },
  fg(d) { UI.fg = clamp(UI.fg + +d.d, 1, 6); D(); },
  rtarget(d, el) { UI.rl.target = el.value; D(); }, rwait(d) { UI.rl.wait = +d.i; D(); }, rslots(d) { UI.rl.slots = clamp(UI.rl.slots + +d.d, 0, Math.min(4, S.tokens)); D(); },
  rally() { const c = UI.rcomp; if (run(createRally(UI.rl.target, c, c.hero, RALLY_WAITS[UI.rl.wait][1], UI.rl.slots), 'Rally is up.')) { CLS.forEach(k => c[k] = 0); c.hero = false; UI.rl.slots = 0; UI.mt = 'cols'; } },
  rallyto(d) { UI.rl.target = d.t; UI.mt = 'rally'; UI.sheet = null; A.dock({ k: 'march' }); },
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
  reset() { if (confirm('Erase the save and start over?')) { resetGame(); UI.sheet = null; UI.desk = null; MAP.cx = S.base.x; MAP.cy = S.base.y; D(); } }
};
document.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b || b.tagName === 'SELECT') return; const f = A[b.dataset.a]; if (f) f(b.dataset, b); });
document.addEventListener('change', e => { const b = e.target.closest('select[data-a]'); if (b && A[b.dataset.a]) A[b.dataset.a](b.dataset, b); });
document.addEventListener('pointerdown', () => { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) { } }, { once: true });

/* ---------------- loop ---------------- */
function showPage() { for (const p of ['map', 'base', 'march', 'vault']) $('#pg-' + p).className = 'page' + (UI.page === p ? ' on' : ''); }
function renderAll() {
  UI.dirty = false; renderTop(); renderDock(); showPage();
  if (UI.page === 'base') renderBase(); else if (UI.page === 'march') $('#pg-march').innerHTML = renderMarch(); else if (UI.page === 'vault') $('#pg-vault').innerHTML = renderVault();
  renderDesk(); renderSheet(); if (UI.page === 'map' && !UI.desk) drawMap();
}
function updateTimers() { document.querySelectorAll('[data-end]').forEach(el => { el.innerHTML = tmText(+el.dataset.end, el.dataset.b === '1'); }); }
function boot() {
  S = load() || newState(); const el = Math.min(600, (Date.now() - (S.last || Date.now())) / 1000); if (el > 3) produce(el); S.last2 = 0; terrDirty = true;
  initMap(); MAP.cx = S.view.x; MAP.cy = S.view.y; renderAll();
  setInterval(() => { tick(); renderTop(); renderTicker(); if (UI.dirty || terrDirty) renderAll(); else { updateTimers(); if (UI.page === 'map' && !UI.desk && S.marches.some(m => m.phase === 'out' || m.phase === 'back')) drawMap(); } }, 250);
  setInterval(save, 5000); window.addEventListener('beforeunload', save);
  if (!S.log.length) note('Garrison raised. Tap the map, send a column.', 'info');
}
boot();
