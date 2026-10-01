'use strict';
/* IRON MARCH — game-wide layout editor. The Edit pill (bottom left) turns it on and off.
   While on: tap anything to select it (Parent / Child refine what is selected), then drag to move, Smaller / Bigger, Hide, Front / Back,
   change what tapping it does, or add any painted piece from the art library to the screen you are on.
   Everything is stored on the device; Copy gives the whole layout as text. The map's tiles, monsters and ground are drawn on a canvas, so those stay as they are. */
const ED = { on: false, drag: null, cand: null, sel: null, piece: null, pal: false, grp: 'city', min: false, data: (() => { try { const d = JSON.parse(localStorage.getItem('im_edit1')); if (d && d.o && d.add) return d; } catch (e) { } return { o: {}, add: {} }; })() };
(() => {
  const $1 = (s, r) => (r || document).querySelector(s), clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  const persist = () => { try { localStorage.setItem('im_edit1', JSON.stringify(ED.data)); } catch (e) { } };
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
    for (const p in ED.data.o) { const v = ED.data.o[p], r = []; if (v.x || v.y) r.push(`translate:${v.x || 0}px ${v.y || 0}px`); if (v.s && v.s !== 1) r.push(`scale:${v.s}`); if (v.z) r.push(`z-index:${v.z}`); if (v.p) r.push('position:relative'); if (r.length) c += `${p}{${r.join(';')}}\n`; if (v.h) c += `${p}{opacity:0!important;pointer-events:none!important}\nhtml.editing ${p}{opacity:.3!important;pointer-events:auto!important}\n`; }
    if (ED.on && ED.sel) c += `html.editing ${ED.sel}{outline:2px solid #e0a44a!important;outline-offset:2px;touch-action:none}\n`;
    let st = $1('#edcss'); if (!st) { st = document.createElement('style'); st.id = 'edcss'; document.head.appendChild(st); } if (st.textContent !== c) st.textContent = c;
  }
  /* ---------- wiring and added pieces (re-applied after every repaint) ---------- */
  function wire() {
    for (const p in ED.data.o) { const a = ED.data.o[p].a; if (a === undefined || a === '') continue; let els = []; try { els = document.querySelectorAll(p); } catch (e) { } els.forEach(el => { if (a === 'none') { el.removeAttribute('data-a'); return; } const o = LAY_ACTS[a]; if (!o) return; for (const k in o) el.setAttribute('data-' + k, o[k]); }); }
  }
  function layers() {
    hosts().forEach(([key, sel]) => {
      const host = $1(sel); if (!host) return; if (getComputedStyle(host).position === 'static') host.classList.add('edhost');
      let L = host.querySelector(':scope>.edlayer'); const list = ED.data.add[key] || [];
      if (!list.length) { if (L) L.remove(); return; }
      const h = list.map(p => { const f = ART.file(p.k); return f ? `<img class="edpiece ${p.a ? 'wired' : ''}" data-pid="${p.id}" data-pkey="${key}" ${ED.on ? '' : layAttrs(p.a)} src="${f}" alt="" style="left:${p.x}%;top:${p.y}px;width:${p.s}px;${p.z ? 'z-index:' + p.z : ''}">` : ''; }).join('');
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
  document.addEventListener('pointerdown', e => {
    if (!ED.on) return; const t = pick(e.target); if (!t) return;
    const isSel = t.classList.contains('edpiece') ? ED.piece && ED.piece.id === t.dataset.pid : ED.sel && elOf(ED.sel) === t;
    ED.cand = { t, x: e.clientX, y: e.clientY, pid: e.pointerId, isSel, moved: false };
    if (isSel) { const o = t.classList.contains('edpiece') ? null : ov(ED.sel); const pc = ED.piece && piece(ED.piece.key, ED.piece.id); ED.drag = { t, pid: e.pointerId, sx: e.clientX, sy: e.clientY, ox: o ? o.x || 0 : 0, oy: o ? o.y || 0 : 0, pc, started: false }; if (pc) { const hr = t.parentElement.parentElement.getBoundingClientRect(), r = t.getBoundingClientRect(); ED.drag.gx = e.clientX - r.left; ED.drag.gy = e.clientY - r.top; } try { t.setPointerCapture(e.pointerId); } catch (x) { } }
  }, true);
  document.addEventListener('pointermove', e => {
    const d = ED.drag; if (ED.cand && Math.hypot(e.clientX - ED.cand.x, e.clientY - ED.cand.y) > 8) ED.cand.moved = true;
    if (!d || e.pointerId !== d.pid) return; if (!d.started && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 6) return; d.started = true; e.preventDefault();
    if (d.pc) { const host = d.t.parentElement.parentElement, hr = host.getBoundingClientRect(); d.nx = clampN((e.clientX - d.gx - hr.left) / hr.width * 100, 0, 96); d.ny = Math.round(e.clientY - d.gy - hr.top + host.scrollTop); d.t.style.left = d.nx + '%'; d.t.style.top = d.ny + 'px'; }
    else { d.nx = d.ox + e.clientX - d.sx; d.ny = d.oy + e.clientY - d.sy; d.t.style.translate = `${d.nx}px ${d.ny}px`; }
  }, { capture: true, passive: false });
  const up = e => {
    const c = ED.cand, d = ED.drag; ED.cand = null; ED.drag = null; if (!ED.on) return;
    if (d && d.started) { if (d.pc) { d.pc.x = +d.nx.toFixed(1); d.pc.y = d.ny; } else { const o = ov(ED.sel); o.x = Math.round(d.nx); o.y = Math.round(d.ny); d.t.style.translate = ''; } persist(); apply(); hap(8); return; }
    if (c && !c.moved && e.type === 'pointerup') { if (c.isSel) { /* tap on the selected one: select again, nothing else */ } selectEl(c.t); }
  };
  document.addEventListener('pointerup', up, true); document.addEventListener('pointercancel', up, true);
  document.addEventListener('click', e => { if (ED.on && !e.target.closest('.edui') && !e.target.closest('.isle .plot, .isle .cd') && e.target.tagName !== 'CANVAS') { e.stopPropagation(); e.preventDefault(); } }, true);
  /* ---------- panel ---------- */
  const mk = (tag, cls, html) => { const x = document.createElement(tag); x.className = cls; x.innerHTML = html; return x; };
  const pill = mk('button', 'edui edpill', '✎ <span>Edit</span>'); document.body.appendChild(pill);
  const panel = mk('div', 'edui edbar', ''); document.body.appendChild(panel); panel.hidden = true;
  const labelOf = p => { const e = elOf(p); return e ? (e.getAttribute('aria-label') || e.title || (e.textContent || '').trim().slice(0, 18) || seg(e).split(':')[0]) : '—'; };
  function bar() {
    pill.classList.toggle('on', ED.on); panel.hidden = !ED.on; document.documentElement.classList.toggle('editing', ED.on); if (!ED.on) return;
    const [key] = screenKey(), pc = ED.piece && piece(ED.piece.key, ED.piece.id), o = ED.sel ? ED.data.o[ED.sel] || {} : {}, a = pc ? pc.a : o.a, groups = [...new Set(Object.keys(ART.f).map(k => k.split('_')[0]))].sort();
    let h = `<div class="edrow"><b>Edit · ${key.replace(/^(page|drawer|sheet):/, '$1 ')}</b><button data-ed="min">${ED.min ? '▴' : '▾'}</button><button data-ed="done" class="pri">Done</button></div>`;
    if (!ED.min) {
      if (ED.sel || pc) {
        h += `<div class="edrow"><b class="edsel">${pc ? pc.k.replace(/^city_deco_/, '') : labelOf(ED.sel)}</b>${pc ? '' : '<button data-ed="parent">Parent ▲</button><button data-ed="child">Child ▼</button>'}<button data-ed="sm">Smaller</button><button data-ed="bg">Bigger</button>${pc ? '' : `<button data-ed="hide">${o.h ? 'Show' : 'Hide'}</button>`}<button data-ed="front">Front</button><button data-ed="back">Back</button>`;
        h += `<select data-ed="wire"><option value="">Tap: as before</option><option value="none" ${a === 'none' ? 'selected' : ''}>Tap: does nothing</option>${Object.keys(LAY_ACTS).map(x => `<option ${a === x ? 'selected' : ''}>${x}</option>`).join('')}</select>`;
        h += pc ? '<button data-ed="del">Delete</button>' : '<button data-ed="undo">Reset this</button>';
        h += '</div>';
      } else h += '<div class="edrow ed-hint">Tap anything to select it, then drag it. On the base, plots and trees drag directly.</div>';
      h += `<div class="edrow"><button data-ed="add" class="${ED.pal ? 'pri' : ''}">Add art</button><button data-ed="copy">Copy</button><button data-ed="reset">Reset all</button></div>`;
      if (ED.pal) h += `<div class="edrow"><select data-ed="grp">${groups.map(x => `<option ${x === ED.grp ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div class="edgrid">${Object.keys(ART.f).filter(k => k.split('_')[0] === ED.grp).map(k => `<button data-ed="put" data-k="${k}"><img src="${ART.f[k]}" alt="${k}" loading="lazy"></button>`).join('')}</div>`;
    }
    if (panel.dataset.h !== h) { const sc = panel.querySelector('.edgrid'); const st = sc ? sc.scrollTop : 0; panel.innerHTML = h; panel.dataset.h = h; const g = panel.querySelector('.edgrid'); if (g) g.scrollTop = st; }
  }
  const setOn = v => { ED.on = v; ED.sel = null; ED.piece = null; ED.pal = false; ED.drag = ED.cand = null; LAY.on = v; document.documentElement.classList.toggle('laying', v); LAY.sel = null; LAY.pal = false; if (typeof D === 'function') D(); apply(); bar(); if (v) toast('Edit mode on. Tap something to select it.', 'info'); };
  pill.addEventListener('click', () => setOn(!ED.on));
  A.layout = () => setOn(!ED.on);
  const sizeOf = () => { const pc = ED.piece && piece(ED.piece.key, ED.piece.id); return pc; };
  const act = {
    done() { setOn(false); }, min() { ED.min = !ED.min; bar(); },
    parent() { const e = elOf(ED.sel); if (e && e.parentElement && e.parentElement.id !== 'app' && e.parentElement.tagName !== 'BODY') selectEl(e.parentElement); },
    child() { const e = elOf(ED.sel); if (e && e.firstElementChild) selectEl(e.firstElementChild); },
    sm(f) { f = f || .85; const pc = sizeOf(); if (pc) pc.s = Math.round(clampN(pc.s * f, 12, 400)); else if (ED.sel) { const o = ov(ED.sel); o.s = +clampN((o.s || 1) * f, .2, 4).toFixed(2); } persist(); apply(); bar(); },
    bg() { act.sm(1.18); },
    hide() { if (!ED.sel) return; const o = ov(ED.sel); o.h = !o.h; persist(); apply(); bar(); },
    front() { z(5); }, back() { z(-5); },
    undo() { if (ED.sel) { delete ED.data.o[ED.sel]; persist(); apply(); bar(); } },
    del() { const pc = sizeOf(); if (!pc) return; ED.data.add[ED.piece.key] = ED.data.add[ED.piece.key].filter(x => x.id !== pc.id); ED.piece = null; persist(); apply(); bar(); },
    add() { ED.pal = !ED.pal; bar(); },
    copy() { const json = JSON.stringify({ ed: ED.data, lay: LAY.data }), ok = () => toast('Layout copied. Paste it into the chat.', 'good'); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(json).then(ok, () => prompt('Copy this layout:', json)); else prompt('Copy this layout:', json); },
    reset() { if (!confirm('Put every screen back how it started and remove added pieces?')) return; ED.data = { o: {}, add: {} }; LAY.data = { slots: { cnc: {}, fld: {} }, decor: { cnc: {}, fld: {} }, extra: { cnc: [], fld: [] }, hide: { cnc: {}, fld: {} } }; ED.sel = null; ED.piece = null; persist(); laySave(); layApply(); CITY_GROUND.cnc = CITY_GROUND.fld = null; document.querySelectorAll('.edlayer').forEach(x => x.remove()); if (typeof D === 'function') D(); apply(); bar(); },
    put(b) { const [key, sel] = screenKey(), host = $1(sel); if (!host) return; const id = 'p' + Date.now().toString(36); (ED.data.add[key] = ED.data.add[key] || []).push({ id, k: b.dataset.k, x: 30, y: Math.round(host.scrollTop + 80), s: 64, a: '', z: 0 }); ED.piece = { key, id }; ED.sel = null; ED.pal = false; persist(); apply(); bar(); }
  };
  function z(d) { const pc = sizeOf(); if (pc) pc.z = (pc.z || 0) + d; else if (ED.sel) { const o = ov(ED.sel); o.z = (o.z || 0) + d; const e = elOf(ED.sel); if (e && getComputedStyle(e).position === 'static') o.p = 1; } persist(); apply(); }
  panel.addEventListener('click', e => { const b = e.target.closest('button[data-ed]'); if (b && act[b.dataset.ed]) act[b.dataset.ed](b); });
  panel.addEventListener('change', e => {
    const s = e.target.closest('select[data-ed]'); if (!s) return;
    if (s.dataset.ed === 'grp') { ED.grp = s.value; s.blur(); bar(); }
    if (s.dataset.ed === 'wire') { const pc = sizeOf(); if (pc) pc.a = s.value; else if (ED.sel) ov(ED.sel).a = s.value; persist(); s.blur(); if (typeof D === 'function') D(); apply(); bar(); toast(s.value ? (s.value === 'none' ? 'Tapping it does nothing.' : 'Tapping it will: ' + s.value) : 'Tap works as before.', 'good'); }
  });
  /* re-apply after every repaint of the game screens */
  let q = 0; new MutationObserver(ms => { if (ms.every(m => (m.target.closest && m.target.closest('.edlayer')) || [...m.addedNodes].every(n => n.classList && n.classList.contains('edlayer')))) return; if (!q) q = requestAnimationFrame(() => { q = 0; apply(); if (ED.on && !panel.contains(document.activeElement)) bar(); }); }).observe($1('#app'), { childList: true, subtree: true });
  apply();
})();
