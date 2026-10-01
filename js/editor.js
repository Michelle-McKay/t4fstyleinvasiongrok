'use strict';
/* IRON MARCH — game-wide layout editor. The Edit pill (bottom left) turns it on and off.
   While on: tap anything to select it (Parent / Child refine what is selected), then drag to move, Smaller / Bigger, Hide, Front / Back,
   change what tapping it does, or add any painted piece from the art library to the screen you are on.
   Everything is stored on the device; Copy gives the whole layout as text. The map's tiles, monsters and ground are drawn on a canvas, so those stay as they are. */
const ED = { on: false, drag: null, cand: null, sel: null, piece: null, pal: false, grp: 'city', min: false, top: false, snap: false, zoom: { s: 1, x: 0, y: 0 }, pinch: null, hist: [], redo: [], data: (() => { try { const d = JSON.parse(localStorage.getItem('im_edit1')); if (d && d.o && d.add) return d; } catch (e) { } return { o: {}, add: {} }; })() };
(() => {
  const $1 = (s, r) => (r || document).querySelector(s), clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  const store = j => { try { localStorage.setItem('im_edit1', j); } catch (e) { } };
  ED.last = JSON.stringify(ED.data);
  const persist = () => { const j = JSON.stringify(ED.data); if (j !== ED.last) { ED.hist.push(ED.last); if (ED.hist.length > 60) ED.hist.shift(); ED.redo = []; ED.last = j; } store(j); };
  const fromJson = j => { ED.data = JSON.parse(j); ED.last = j; store(j); ED.sel = ED.piece = null; };
  const SKIP = new Set(['on', 'sel', 'busy', 'max', 'empty', 'full', 'hot', 'lifted', 'cd', 'wired', 'edhost', 'free', 'out']);
  const seg = el => { const id = el.id ? '#' + CSS.escape(el.id) : '', cl = [...el.classList].filter(c => !SKIP.has(c) && /^[\w-]+$/.test(c)).slice(0, 2).map(c => '.' + c).join(''); let s = el.tagName.toLowerCase() + id + cl; if (!id) { const same = [...(el.parentElement ? el.parentElement.children : [])].filter(x => x.tagName === el.tagName && [...x.classList].filter(c => !SKIP.has(c) && /^[\w-]+$/.test(c)).slice(0, 2).join() === [...el.classList].filter(c => !SKIP.has(c) && /^[\w-]+$/.test(c)).slice(0, 2).join()); if (same.length > 1) s += ':nth-child(' + (Array.prototype.indexOf.call(el.parentElement.children, el) + 1) + ')'; } return s; };
  function pathOf(el) {
    const parts = []; let e = el;
    while (e && e !== document.body && e !== document.documentElement) { parts.unshift(seg(e)); const sel = parts.join('>'); if (e.id) return sel; try { const m = document.querySelectorAll(parts.join('>')); if (m.length === 1 && m[0] === el && parts.length > 1) return sel; } catch (x) { } e = e.parentElement; }
    return parts.join('>');
  }
  const elOf = p => { try { return p && document.querySelector(p); } catch (e) { return null; } };
  const ov = p => ED.data.o[p] || (ED.data.o[p] = {});
  const screenKey = () => UI.sheet ? ['sheet:' + UI.sheet.type, '#sheet'] : UI.drawer ? ['drawer:' + UI.drawer + ':' + (UI.dt[UI.drawer] || ''), '#dbody'] : ['page:' + UI.page, '#pg-' + UI.page];
  const hosts = () => { const l = [['page:' + UI.page, '#pg-' + UI.page]]; if (UI.drawer) l.push(['drawer:' + UI.drawer + ':' + (UI.dt[UI.drawer] || ''), '#dbody']); if (UI.sheet) l.push(['sheet:' + UI.sheet.type, '#sheet']); return l; };
  const piece = (k, id) => (ED.data.add[k] || []).find(p => p.id === id);
  /* ---------- styles from overrides ---------- */
  function css() {
    let c = '';
    for (const p in ED.data.o) { const v = ED.data.o[p], r = []; if (v.x || v.y) r.push(`translate:${v.x || 0}px ${v.y || 0}px`); if (v.s && v.s !== 1) r.push(`scale:${v.s}`); if (v.r) r.push(`rotate:${v.r}deg`); if (v.o !== undefined && v.o < 1) r.push(`opacity:${v.o}`); if (v.z) r.push(`z-index:${v.z}`); if (v.p) r.push('position:relative'); if (r.length) c += `${p}{${r.join(';')}}\n`; if (v.h) c += `${p}{opacity:0!important;pointer-events:none!important}\nhtml.editing ${p}{opacity:.3!important;pointer-events:auto!important}\n`; if (v.d) c += `html:not(.editing) ${p}{display:none!important}\nhtml.editing ${p}{opacity:.35!important;outline:1px dashed #d9534f!important}\n`; }
    if (ED.on && ED.sel) c += `html.editing ${ED.sel}{outline:2px solid #e0a44a!important;outline-offset:2px;touch-action:none!important}\n`;
    const z = ED.zoom; c += ED.on && z.s !== 1 ? `html.editing #main{transform:translate(${z.x}px,${z.y}px) scale(${z.s});transform-origin:0 0}\n` : '';
    let st = $1('#edcss'); if (!st) { st = document.createElement('style'); st.id = 'edcss'; document.head.appendChild(st); } if (st.textContent !== c) st.textContent = c;
  }
  /* ---------- wiring and added pieces (re-applied after every repaint) ---------- */
  function wire() {
    for (const p in ED.data.o) { const t = ED.data.o[p].t; if (t === undefined || t === '') continue; let els = []; try { els = document.querySelectorAll(p); } catch (e) { } els.forEach(el => { if (!el.firstElementChild && el.textContent !== t) el.textContent = t; }); }
    for (const p in ED.data.o) { const a = ED.data.o[p].a; if (a === undefined || a === '') continue; let els = []; try { els = document.querySelectorAll(p); } catch (e) { } els.forEach(el => { if (a === 'none') { el.removeAttribute('data-a'); return; } const o = LAY_ACTS[a]; if (!o) return; for (const k in o) el.setAttribute('data-' + k, o[k]); }); }
  }
  function layers() {
    hosts().forEach(([key, sel]) => {
      const host = $1(sel); if (!host) return; if (getComputedStyle(host).position === 'static') host.classList.add('edhost');
      let L = host.querySelector(':scope>.edlayer'); const list = ED.data.add[key] || [];
      if (!list.length) { if (L) L.remove(); return; }
      const h = list.map(p => { const f = ART.file(p.k); return f ? `<img class="edpiece ${p.a ? 'wired' : ''}" data-pid="${p.id}" data-pkey="${key}" ${ED.on ? '' : layAttrs(p.a)} src="${f}" alt="" style="left:${p.x}%;top:${p.y}px;width:${p.s}px;${p.z ? 'z-index:' + p.z + ';' : ''}${p.r ? 'rotate:' + p.r + 'deg;' : ''}${p.o !== undefined && p.o < 1 ? 'opacity:' + p.o : ''}">` : ''; }).join('');
      if (!L) { L = document.createElement('div'); L.className = 'edlayer'; host.appendChild(L); } if (L.dataset.h !== h + ED.on + (ED.piece ? ED.piece.id : '')) { L.innerHTML = h; L.dataset.h = h + ED.on + (ED.piece ? ED.piece.id : ''); }
      L.querySelectorAll('.edpiece').forEach(i => i.classList.toggle('sel', !!ED.piece && ED.piece.id === i.dataset.pid));
    });
  }
  const apply = () => { css(); wire(); layers(); };
  /* ---------- picking ---------- */
  function pick(t) {
    if (!t || !t.closest || t.closest('.edui') || t.tagName === 'CANVAS' || t.closest('.isle .plot, .isle .cd') || !t.closest('#app')) return null;
    return t.closest('.edpiece') || t.closest('button,[data-a]') || t.closest('img,svg,input,select,.chip,.panel,.tips,.prow,.rwrow,.fl,h3,p,span,div') || t;
  }
  const selectEl = el => { ED.sel = null; ED.piece = null; if (el) { if (el.classList.contains('edpiece')) ED.piece = { key: el.dataset.pkey, id: el.dataset.pid }; else ED.sel = pathOf(el); } apply(); bar(); };
  /* ---------- gestures ---------- */
  const ptrs = new Map(), Z = () => ED.zoom.s || 1;
  const snapV = v => ED.snap ? Math.round(v / 8) * 8 : v;
  const curPiece = () => ED.piece && piece(ED.piece.key, ED.piece.id);
  const selBox = () => { const pc = curPiece(); const e = pc ? $1(`.edpiece[data-pid="${pc.id}"]`) : elOf(ED.sel); return e ? e.getBoundingClientRect() : null; };
  const baseScale = () => { const pc = curPiece(); return pc ? pc.s : (ED.sel && ED.data.o[ED.sel] && ED.data.o[ED.sel].s) || 1; };
  const baseRot = () => { const pc = curPiece(); return pc ? pc.r || 0 : (ED.sel && ED.data.o[ED.sel] && ED.data.o[ED.sel].r) || 0; };
  function endDragVisual() { const d = ED.drag; if (d && d.started) { if (d.pc) { const pc = d.pc; d.t.style.left = pc.x + '%'; d.t.style.top = pc.y + 'px'; } else d.t.style.translate = ''; } ED.drag = null; }
  function startPinch() {
    const [a, b] = [...ptrs.values()], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, r = selBox(), over = r && mx >= r.left && mx <= r.right && my >= r.top && my <= r.bottom;
    endDragVisual(); ED.cand = null;
    const mr = $1('#main').getBoundingClientRect(); ED.pinch = { bx: mr.left - ED.zoom.x, by: mr.top - ED.zoom.y, obj: !!over, d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, a0: Math.atan2(b.y - a.y, b.x - a.x), mx0: mx, my0: my, s0: baseScale(), r0: baseRot(), z0: { ...ED.zoom }, el: over ? (curPiece() ? $1(`.edpiece[data-pid="${curPiece().id}"]`) : elOf(ED.sel)) : null };
  }
  function movePinch() {
    const p = ED.pinch, [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y) || 1, f = d / p.d0, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    if (p.obj && p.el) { const ang = (Math.atan2(b.y - a.y, b.x - a.x) - p.a0) * 180 / Math.PI; p.ns = clampN(p.s0 * f, curPiece() ? 12 : .2, curPiece() ? 400 : 4); p.nr = Math.round(p.r0 + ang); if (curPiece()) { p.el.style.width = Math.round(p.ns) + 'px'; p.el.style.rotate = p.nr + 'deg'; } else { p.el.style.scale = p.ns; p.el.style.rotate = p.nr + 'deg'; } }
    else { const ns = clampN(p.z0.s * f, 1, 4); const k = ns / p.z0.s; ED.zoom = { s: +ns.toFixed(3), x: Math.round(mx - p.bx - (p.mx0 - p.bx - p.z0.x) * k), y: Math.round(my - p.by - (p.my0 - p.by - p.z0.y) * k) }; if (ns === 1) ED.zoom = { s: 1, x: 0, y: 0 }; css(); }
  }
  function endPinch() {
    const p = ED.pinch; ED.pinch = null; if (!p) return;
    if (p.obj && p.el && p.ns !== undefined) { const pc = curPiece(); p.el.style.width = p.el.style.rotate = p.el.style.scale = ''; if (pc) { pc.s = Math.round(p.ns); pc.r = p.nr; } else if (ED.sel) { const o = ov(ED.sel); o.s = +p.ns.toFixed(2); o.r = p.nr; } persist(); apply(); bar(); }
  }
  document.addEventListener('pointerdown', e => {
    if (!ED.on || e.target.closest('.edui') || e.target.tagName === 'CANVAS') return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) { startPinch(); return; } if (ptrs.size > 2) return;
    const t = pick(e.target); if (!t) return;
    const isSel = t.classList.contains('edpiece') ? ED.piece && ED.piece.id === t.dataset.pid : ED.sel && elOf(ED.sel) === t;
    ED.cand = { t, x: e.clientX, y: e.clientY, pid: e.pointerId, isSel, moved: false };
    if (isSel) { const o = t.classList.contains('edpiece') ? null : ov(ED.sel); const pc = curPiece(); ED.drag = { t, pid: e.pointerId, sx: e.clientX, sy: e.clientY, ox: o ? o.x || 0 : 0, oy: o ? o.y || 0 : 0, pc, started: false }; if (pc) { const r = t.getBoundingClientRect(); ED.drag.gx = e.clientX - r.left; ED.drag.gy = e.clientY - r.top; } try { t.setPointerCapture(e.pointerId); } catch (x) { } }
  }, true);
  document.addEventListener('pointermove', e => {
    if (!ED.on) return; if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ED.pinch) { if (ptrs.size >= 2) { movePinch(); e.preventDefault(); } return; }
    const d = ED.drag; if (ED.cand && Math.hypot(e.clientX - ED.cand.x, e.clientY - ED.cand.y) > 8) ED.cand.moved = true;
    if (!d || e.pointerId !== d.pid) return; if (!d.started && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 6) return; d.started = true; e.preventDefault();
    const s = Z();
    if (d.pc) { const host = d.t.parentElement.parentElement, hr = host.getBoundingClientRect(); d.nx = clampN(Math.round((e.clientX - d.gx - hr.left) / hr.width * 100 / (ED.snap ? 1 : .1)) * (ED.snap ? 1 : .1), 0, 96); d.ny = Math.round(snapV((e.clientY - d.gy - hr.top) / s + host.scrollTop)); d.t.style.left = d.nx + '%'; d.t.style.top = d.ny + 'px'; }
    else { d.nx = snapV(d.ox + (e.clientX - d.sx) / s); d.ny = snapV(d.oy + (e.clientY - d.sy) / s); d.t.style.translate = `${d.nx}px ${d.ny}px`; }
  }, { capture: true, passive: false });
  const up = e => {
    const had = ptrs.delete(e.pointerId); if (!ED.on) return;
    if (ED.pinch) { if (ptrs.size < 2) endPinch(); ED.cand = null; return; }
    const c = ED.cand, d = ED.drag; ED.cand = null; ED.drag = null; if (!had && !c) return;
    if (d && d.started) { if (d.pc) { d.pc.x = +d.nx.toFixed(1); d.pc.y = d.ny; } else { const o = ov(ED.sel); o.x = Math.round(d.nx); o.y = Math.round(d.ny); d.t.style.translate = ''; } persist(); apply(); hap(8); bar(); return; }
    if (c && !c.moved && e.type === 'pointerup') selectEl(c.t);
  };
  document.addEventListener('pointerup', up, true); document.addEventListener('pointercancel', up, true);
  document.addEventListener('click', e => { if (ED.on && !e.target.closest('.edui') && !e.target.closest('.isle .plot, .isle .cd') && e.target.tagName !== 'CANVAS') { e.stopPropagation(); e.preventDefault(); } }, true);
  /* ---------- panel ---------- */
  const mk = (tag, cls, html) => { const x = document.createElement(tag); x.className = cls; x.innerHTML = html; return x; };
  const pill = mk('button', 'edui edpill', '✎ <span>Edit</span>'); document.body.appendChild(pill);
  const panel = mk('div', 'edui edbar', ''); document.body.appendChild(panel); panel.hidden = true;
  const labelOf = p => { const e = elOf(p); return e ? (e.getAttribute('aria-label') || e.title || (e.textContent || '').trim().slice(0, 18) || seg(e).split(':')[0]) : '—'; };
  function bar() {
    pill.classList.toggle('on', ED.on); panel.hidden = !ED.on; panel.classList.toggle('top', ED.top); document.documentElement.classList.toggle('editing', ED.on); if (!ED.on) return;
    const [key] = screenKey(), pc = curPiece(), o = ED.sel ? ED.data.o[ED.sel] || {} : {}, a = pc ? pc.a : o.a, groups = [...new Set(Object.keys(ART.f).map(k => k.split('_')[0]))].sort(), el = ED.sel && elOf(ED.sel), leaf = el && !el.firstElementChild && (el.textContent || '').trim();
    const B = (id, label, cls) => `<button data-ed="${id}" ${cls ? `class="${cls}"` : ''}>${label}</button>`;
    let h = `<div class="edrow"><b>Edit · ${key.replace(/^(page|drawer|sheet):/, '$1 ')}</b>${ED.zoom.s !== 1 ? B('z1', 'Zoom ' + ED.zoom.s.toFixed(1) + '× ✕') : ''}${B('flip', ED.top ? '⇩ Panel' : '⇧ Panel')}${B('min', ED.min ? '▴' : '▾')}${B('done', 'Done', 'pri')}</div>`;
    if (!ED.min) {
      if (ED.sel || pc) {
        h += `<div class="edrow"><b class="edsel">${pc ? pc.k.replace(/^city_deco_/, '') : labelOf(ED.sel)}${o.d ? ' (deleted)' : ''}</b>${pc ? '' : B('parent', 'Parent ▲') + B('child', 'Child ▼')}${B('del', o.d ? 'Restore' : 'Delete', o.d ? 'pri' : 'dng')}${pc ? B('dup', 'Duplicate') : B('hide', o.h ? 'Show' : 'Hide')}</div>`;
        h += `<div class="edrow">${B('nl', '◀')}${B('nu', '▲')}${B('nd', '▼')}${B('nr', '▶')}${B('sm', '－')}${B('bg', '＋')}${B('rl', '⟲')}${B('rr', '⟳')}${B('fm', 'Fade −')}${B('fp', 'Fade +')}</div>`;
        h += `<div class="edrow">${B('front', 'Front')}${B('back', 'Back')}${leaf ? B('ren', 'Rename') : ''}${pc ? '' : B('undo1', 'Reset this')}<select data-ed="wire"><option value="">Tap: as before</option><option value="none" ${a === 'none' ? 'selected' : ''}>Tap: does nothing</option>${Object.keys(LAY_ACTS).map(x => `<option ${a === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>`;
      } else h += '<div class="edrow ed-hint">Tap anything to select it, then drag it. Pinch on it to resize and turn it, pinch elsewhere to zoom the screen. On the base, plots and trees drag directly.</div>';
      h += `<div class="edrow">${B('add', 'Add art', ED.pal ? 'pri' : '')}${B('undo', '↶ Undo')}${B('redo', '↷ Redo')}${B('snap', ED.snap ? 'Snap on' : 'Snap off', ED.snap ? 'pri' : '')}${B('copy', 'Copy')}${B('paste', 'Paste')}${B('reset', 'Reset all')}</div>`;
      if (ED.pal) h += `<div class="edrow"><select data-ed="grp">${groups.map(x => `<option ${x === ED.grp ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div class="edgrid">${Object.keys(ART.f).filter(k => k.split('_')[0] === ED.grp).map(k => `<button data-ed="put" data-k="${k}"><img src="${ART.f[k]}" alt="${k}" loading="lazy"></button>`).join('')}</div>`;
    }
    if (panel.dataset.h !== h) { const sc = panel.querySelector('.edgrid'), st = sc ? sc.scrollTop : 0, ps = panel.scrollTop; panel.innerHTML = h; panel.dataset.h = h; const g = panel.querySelector('.edgrid'); if (g) g.scrollTop = st; panel.scrollTop = ps; }
  }
  const setViewport = on => { const m = $1('meta[name=viewport]'); if (m) m.setAttribute('content', on ? 'width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=yes,maximum-scale=5' : 'width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no'); };
  const setOn = v => { ED.on = v; ED.sel = null; ED.piece = null; ED.pal = false; ED.drag = ED.cand = ED.pinch = null; ptrs.clear(); if (!v) ED.zoom = { s: 1, x: 0, y: 0 }; setViewport(v); LAY.on = v; document.documentElement.classList.toggle('laying', v); LAY.sel = null; LAY.pal = false; if (typeof D === 'function') D(); apply(); bar(); if (v) toast('Edit mode on. Tap something to select it.', 'info'); };
  pill.addEventListener('click', () => setOn(!ED.on));
  A.layout = () => setOn(!ED.on);
  const nudge = (dx, dy) => { const pc = curPiece(); if (pc) { const e = $1(`.edpiece[data-pid="${pc.id}"]`), hw = e ? e.parentElement.parentElement.getBoundingClientRect().width / Z() : 360; pc.x = +clampN(pc.x + dx / hw * 100, 0, 96).toFixed(2); pc.y = Math.round(pc.y + dy); } else if (ED.sel) { const o = ov(ED.sel); o.x = (o.x || 0) + dx; o.y = (o.y || 0) + dy; } persist(); apply(); };
  const size = f => { const pc = curPiece(); if (pc) pc.s = Math.round(clampN(pc.s * f, 12, 400)); else if (ED.sel) { const o = ov(ED.sel); o.s = +clampN((o.s || 1) * f, .2, 4).toFixed(2); } persist(); apply(); bar(); };
  const rot = d => { const pc = curPiece(); if (pc) pc.r = ((pc.r || 0) + d) % 360; else if (ED.sel) { const o = ov(ED.sel); o.r = ((o.r || 0) + d) % 360; } persist(); apply(); };
  const fade = d => { const pc = curPiece(), t = pc || (ED.sel && ov(ED.sel)); if (!t) return; t.o = +clampN((t.o === undefined ? 1 : t.o) + d, .1, 1).toFixed(1); persist(); apply(); };
  function z(d) { const pc = curPiece(); if (pc) pc.z = (pc.z || 0) + d; else if (ED.sel) { const o = ov(ED.sel); o.z = (o.z || 0) + d; const e = elOf(ED.sel); if (e && getComputedStyle(e).position === 'static') o.p = 1; } persist(); apply(); }
  const act = {
    done() { setOn(false); }, min() { ED.min = !ED.min; bar(); }, flip() { ED.top = !ED.top; bar(); }, z1() { ED.zoom = { s: 1, x: 0, y: 0 }; css(); bar(); },
    parent() { const e = elOf(ED.sel); if (e && e.parentElement && e.parentElement.id !== 'app' && e.parentElement.tagName !== 'BODY') selectEl(e.parentElement); },
    child() { const e = elOf(ED.sel); if (e && e.firstElementChild) selectEl(e.firstElementChild); },
    nl() { nudge(-2, 0); }, nr() { nudge(2, 0); }, nu() { nudge(0, -2); }, nd() { nudge(0, 2); },
    sm() { size(.88); }, bg() { size(1.14); }, rl() { rot(-5); }, rr() { rot(5); }, fm() { fade(-.1); }, fp() { fade(.1); },
    hide() { if (!ED.sel) return; const o = ov(ED.sel); o.h = !o.h; persist(); apply(); bar(); },
    front() { z(5); }, back() { z(-5); },
    del() { const pc = curPiece(); if (pc) { ED.data.add[ED.piece.key] = ED.data.add[ED.piece.key].filter(x => x.id !== pc.id); ED.piece = null; } else if (ED.sel) { const o = ov(ED.sel); o.d = !o.d; } persist(); apply(); bar(); },
    dup() { const pc = curPiece(); if (!pc) return; const n = { ...pc, id: 'p' + Date.now().toString(36), x: +clampN(pc.x + 6, 0, 96).toFixed(1), y: pc.y + 24 }; ED.data.add[ED.piece.key].push(n); ED.piece = { key: ED.piece.key, id: n.id }; persist(); apply(); bar(); },
    ren() { if (!ED.sel) return; const e = elOf(ED.sel), t = prompt('New text for this label (empty puts it back):', (ED.data.o[ED.sel] || {}).t || (e ? e.textContent.trim() : '')); if (t === null) return; const o = ov(ED.sel); if (t === '') delete o.t; else o.t = t; persist(); if (typeof D === 'function') D(); apply(); bar(); },
    undo1() { if (ED.sel) { delete ED.data.o[ED.sel]; persist(); apply(); bar(); } },
    undo() { if (!ED.hist.length) return toast('Nothing to undo.', 'info'); ED.redo.push(ED.last); fromJson(ED.hist.pop()); if (typeof D === 'function') D(); apply(); bar(); },
    redo() { if (!ED.redo.length) return toast('Nothing to redo.', 'info'); ED.hist.push(ED.last); fromJson(ED.redo.pop()); if (typeof D === 'function') D(); apply(); bar(); },
    snap() { ED.snap = !ED.snap; bar(); },
    add() { ED.pal = !ED.pal; bar(); },
    copy() { const json = JSON.stringify({ ed: ED.data, lay: LAY.data }), ok = () => toast('Layout copied. Paste it into the chat.', 'good'); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(json).then(ok, () => prompt('Copy this layout:', json)); else prompt('Copy this layout:', json); },
    paste() { const t = prompt('Paste a copied layout here:'); if (!t) return; try { const d = JSON.parse(t); if (d.ed && d.ed.o) { ED.hist.push(ED.last); fromJson(JSON.stringify(d.ed)); } if (d.lay && d.lay.slots) { LAY.data = Object.assign({ extra: { cnc: [], fld: [] }, hide: { cnc: {}, fld: {} } }, d.lay); laySave(); layApply(); CITY_GROUND.cnc = CITY_GROUND.fld = null; } document.querySelectorAll('.edlayer').forEach(x => x.remove()); if (typeof D === 'function') D(); apply(); bar(); toast('Layout loaded.', 'good'); } catch (e) { toast('That does not look like a layout.', 'warn'); } },
    reset() { if (!confirm('Put every screen back how it started and remove added pieces? (Undo can bring it back.)')) return; ED.hist.push(ED.last); fromJson(JSON.stringify({ o: {}, add: {} })); LAY.data = { slots: { cnc: {}, fld: {} }, decor: { cnc: {}, fld: {} }, extra: { cnc: [], fld: [] }, hide: { cnc: {}, fld: {} } }; laySave(); layApply(); CITY_GROUND.cnc = CITY_GROUND.fld = null; document.querySelectorAll('.edlayer').forEach(x => x.remove()); if (typeof D === 'function') D(); apply(); bar(); },
    put(b) { const [key, sel] = screenKey(), host = $1(sel); if (!host) return; const id = 'p' + Date.now().toString(36); (ED.data.add[key] = ED.data.add[key] || []).push({ id, k: b.dataset.k, x: 30, y: Math.round(host.scrollTop + 80), s: 64, a: '', z: 0 }); ED.piece = { key, id }; ED.sel = null; ED.pal = false; persist(); apply(); bar(); }
  };
  panel.addEventListener('click', e => { const b = e.target.closest('button[data-ed]'); if (b && act[b.dataset.ed]) act[b.dataset.ed](b); });
  panel.addEventListener('change', e => {
    const s = e.target.closest('select[data-ed]'); if (!s) return;
    if (s.dataset.ed === 'grp') { ED.grp = s.value; s.blur(); bar(); }
    if (s.dataset.ed === 'wire') { const pc = curPiece(); if (pc) pc.a = s.value; else if (ED.sel) ov(ED.sel).a = s.value; persist(); s.blur(); if (typeof D === 'function') D(); apply(); bar(); toast(s.value ? (s.value === 'none' ? 'Tapping it does nothing.' : 'Tapping it will: ' + s.value) : 'Tap works as before.', 'good'); }
  });
  /* re-apply after every repaint of the game screens */
  let q = 0; new MutationObserver(ms => { if (ms.every(m => (m.target.closest && m.target.closest('.edlayer')) || [...m.addedNodes].every(n => n.classList && n.classList.contains('edlayer')))) return; if (!q) q = requestAnimationFrame(() => { q = 0; apply(); if (ED.on && !panel.contains(document.activeElement)) bar(); }); }).observe($1('#app'), { childList: true, subtree: true });
  apply();
})();
