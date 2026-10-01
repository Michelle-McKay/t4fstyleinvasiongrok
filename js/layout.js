'use strict';
/* IRON MARCH — layout mode: drag plots and scenery on the base page with a finger, add pieces from the art library, and wire a piece to a game action.
   Everything is kept on the device (LAY in city.js). "Copy" gives the whole layout as text so it can be made permanent. */
(() => {
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  const save = () => { laySave(); D(); };
  const extra = () => LAY.sel && LAY.data.extra[LAY.sel.kind].find(e => e.id === LAY.sel.id);
  const groupOf = k => k.split('_')[0];
  window.layBarHTML = () => {
    const sel = LAY.sel, ex = extra(), keys = Object.keys(ART.f);
    const groups = [...new Set(keys.map(groupOf))].sort(), g = LAY.grp || 'city';
    let h = `<div class="laybar"><b>Layout mode</b><span>Drag plots and pieces. Drag bare ground to scroll.</span><button class="btn sm pri" data-a="layout">Done</button><button class="btn sm ${LAY.pal ? 'on' : 'line'}" data-a="layadd">Add</button><button class="btn sm line" data-a="laycopy">Copy</button><button class="btn sm line" data-a="layreset">Reset</button>`;
    if (sel) h += `<div class="laysel"><b>${ex ? ex.k.replace(/^city_deco_/, '') : 'Scenery'}</b>${ex ? `<button class="btn sm line" data-a="laysize" data-d="-1">Smaller</button><button class="btn sm line" data-a="laysize" data-d="1">Bigger</button><select data-a="laywire" aria-label="Tap action"><option value="">Tap does nothing</option>${Object.keys(LAY_ACTS).map(a => `<option ${ex.a === a ? 'selected' : ''}>${a}</option>`).join('')}</select>` : ''}<button class="btn sm line" data-a="laydel">${ex ? 'Delete' : 'Hide'}</button></div>`;
    if (LAY.pal) h += `<div class="laypal"><select data-a="laygrp" aria-label="Art group">${groups.map(x => `<option ${x === g ? 'selected' : ''}>${x}</option>`).join('')}</select><div class="laygrid">${keys.filter(k => groupOf(k) === g).map(k => `<button data-a="layput" data-k="${k}" title="${k}"><img src="${ART.f[k]}" alt="${k}" loading="lazy"></button>`).join('')}</div></div>`;
    return h + '</div>';
  };
  Object.assign(A, {
    layout() { LAY.on = !LAY.on; LAY.drag = null; LAY.sel = null; LAY.pal = false; document.documentElement.classList.toggle('laying', LAY.on); D(); if (LAY.on) toast('Layout mode: drag things where you want them.', 'info'); },
    layreset() { if (!confirm('Put everything back to how it started and remove added pieces?')) return; LAY.data = { slots: { cnc: {}, fld: {} }, decor: { cnc: {}, fld: {} }, extra: { cnc: [], fld: [] }, hide: { cnc: {}, fld: {} } }; LAY.sel = null; layApply(); CITY_GROUND.cnc = CITY_GROUND.fld = null; save(); },
    laycopy() {
      const json = JSON.stringify(LAY.data), done = () => toast('Layout copied. Paste it into the chat.', 'good');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(json).then(done, () => prompt('Copy this layout:', json)); else prompt('Copy this layout:', json);
    },
    layadd() { LAY.pal = !LAY.pal; D(); },
    laygrp(d, el) { el.blur(); LAY.grp = el.value; D(); },
    layput(d) {
      const iles = [...document.querySelectorAll('.isle')], mid = innerHeight * .45;
      const isle = iles.find(i => { const r = i.getBoundingClientRect(); return r.top <= mid && r.bottom >= mid; }) || iles[0], r = isle.getBoundingClientRect(), kind = isle.classList.contains('cnc') ? 'cnc' : 'fld', vh = CITY[kind].vh;
      const e = { id: 'x' + Date.now().toString(36), k: d.k, x: 50, y: +clampN((mid - r.top) / r.height * vh, 4, vh - 4).toFixed(1), s: 44, a: '' };
      LAY.data.extra[kind].push(e); LAY.sel = { kind, id: e.id }; LAY.pal = false; save();
    },
    laysize(d) { const e = extra(); if (!e) return; e.s = Math.round(clampN(e.s * (+d.d > 0 ? 1.2 : .83), 14, 200)); save(); },
    laywire(d, el) { el.blur(); const e = extra(); if (!e) return; e.a = el.value; save(); toast(e.a ? 'Tapping it will: ' + e.a : 'Tapping it does nothing.', 'good'); },
    laydel() { const s = LAY.sel; if (!s) return; if (extra()) LAY.data.extra[s.kind] = LAY.data.extra[s.kind].filter(e => e.id !== s.id); else LAY.data.hide[s.kind][s.id] = 1; LAY.sel = null; save(); }
  });
  document.addEventListener('pointerdown', e => {
    if (!LAY.on) return;
    const el = e.target.closest('.isle .plot, .isle .cd'); if (!el) return;
    const isle = el.closest('.isle'), r = isle.getBoundingClientRect(), kind = isle.classList.contains('cnc') ? 'cnc' : 'fld', plot = el.classList.contains('plot');
    const px = (parseFloat(el.style.left) || 0) / 100 * r.width, py = (parseFloat(el.style.top) || 0) / 100 * r.height;
    LAY.drag = { el, isle, kind, plot, id: plot ? +el.dataset.i : el.dataset.did, ox: e.clientX - r.left - px, oy: e.clientY - r.top - py, pid: e.pointerId, moved: false, sx: e.clientX, sy: e.clientY };
    el.classList.add('lifted'); try { el.setPointerCapture(e.pointerId); } catch (x) { } e.preventDefault();
  }, true);
  document.addEventListener('pointermove', e => {
    const d = LAY.drag; if (!d || e.pointerId !== d.pid) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 6) return;
    const r = d.isle.getBoundingClientRect(), vh = CITY[d.kind].vh;
    const xp = clampN((e.clientX - r.left - d.ox) / r.width * 100, 3, 97), yp = clampN((e.clientY - r.top - d.oy) / r.height * 100, 2, 98);
    d.el.style.left = xp.toFixed(2) + '%'; d.el.style.top = yp.toFixed(2) + '%'; d.moved = true; d.x = xp; d.y = yp / 100 * vh;
    if (!d.plot) d.el.style.zIndex = Math.round(d.y);
    e.preventDefault();
  }, { capture: true, passive: false });
  const end = e => {
    const d = LAY.drag; if (!d || e.pointerId !== d.pid) return;
    d.el.classList.remove('lifted'); LAY.drag = null;
    if (!d.moved) { if (!d.plot) { LAY.sel = LAY.sel && LAY.sel.id === d.id ? null : { kind: d.kind, id: d.id }; D(); } return; }
    const v = [+d.x.toFixed(1), +d.y.toFixed(1)];
    if (d.plot) { LAY.data.slots[d.kind][d.id] = v; CITY[d.kind].slots[d.id] = v; CITY_GROUND[d.kind] = null; const g = d.isle.querySelector('.ground'); if (g) g.src = cityGround(d.kind); }
    else { const x = LAY.data.extra[d.kind].find(q => q.id === d.id); if (x) { x.x = v[0]; x.y = v[1]; } else LAY.data.decor[d.kind][d.id] = v; if (!LAY.sel || LAY.sel.id !== d.id) LAY.sel = { kind: d.kind, id: d.id }; }
    laySave(); hap(8); D();
  };
  document.addEventListener('pointerup', end, true); document.addEventListener('pointercancel', end, true);
})();
