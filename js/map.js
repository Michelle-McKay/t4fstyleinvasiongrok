'use strict';
/* IRON MARCH — world map: inertial pan, pinch zoom, sprite terrain, territory, radial menu. */
const MAP = { cx: 120, cy: 220, ts: 36, w: 0, h: 0, dpr: 1, tags: [], ptr: new Map(), drag: null, pinch: null, vx: 0, vy: 0, active: false, mini: null, marks: [], last: 0, drawn: 0, moved: false };
const cv = document.getElementById('map'), cx2 = cv.getContext('2d'), mini = document.getElementById('mini'), mx = mini.getContext('2d');
const TS_MIN = 13, TS_MAX = 64;
const mixHex = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A_ = p(a), B_ = p(b); return '#' + A_.map((v, i) => Math.round(v + (B_[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
function resizeMap() { const r = cv.getBoundingClientRect(); MAP.dpr = Math.min(2, window.devicePixelRatio || 1); MAP.w = r.width; MAP.h = r.height; cv.width = Math.round(r.width * MAP.dpr); cv.height = Math.round(r.height * MAP.dpr); }
const w2sx = x => MAP.w / 2 + (x - MAP.cx) * MAP.ts, w2sy = y => MAP.h / 2 + (y - MAP.cy) * MAP.ts;
const s2wx = px => MAP.cx + (px - MAP.w / 2) / MAP.ts, s2wy = py => MAP.cy + (py - MAP.h / 2) / MAP.ts;
function clampView() { MAP.cx = clamp(MAP.cx, 0, W - 1); MAP.cy = clamp(MAP.cy, 0, H - 1); }
function panTo(x, y) { MAP.cx = x; MAP.cy = y; MAP.vx = MAP.vy = 0; clampView(); S.view = { x: MAP.cx, y: MAP.cy }; }

function computeTags() {
  const seen = new Set(), tags = [];
  for (const k in S.own) {
    if (seen.has(k)) continue; const o = S.own[k], q = [k], patch = []; seen.add(k);
    while (q.length) { const c = q.pop(); patch.push(c); const [x, y] = unkey(c); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = key(x + dx, y + dy); if (!seen.has(n) && S.own[n] === o) { seen.add(n); q.push(n); } } }
    if (patch.length < 12) continue; let sx = 0, sy = 0; for (const c of patch) { const [x, y] = unkey(c); sx += x; sy += y; } sx /= patch.length; sy /= patch.length;
    let best = null, bd = 1e9; for (const c of patch) { const [x, y] = unkey(c), d = (x - sx) ** 2 + (y - sy) ** 2; if (d < bd) { bd = d; best = [x, y]; } }
    tags.push({ x: best[0], y: best[1], t: S.al[o].tag, c: alColor(o), n: patch.length });
  }
  MAP.tags = tags; terrDirty = false; MAP.mini = null;
}
function drawMini() {
  const w = 66, h = 130, sx = w / W, sy = h / H;
  if (!MAP.mini) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    g.fillStyle = '#171c1f'; g.fillRect(0, 0, w, h);
    g.fillStyle = mixHex('#171c1f', '#8ea36a', .4); g.beginPath(); g.arc(TX * sx, TY * sy, FOREST_R * sx * 1.6, 0, 7); g.fill();
    g.fillStyle = '#e7e4da88'; g.beginPath(); g.arc(TX * sx, TY * sy, 2.2, 0, 7); g.fill(); g.fillStyle = '#e0a44a'; g.fillRect(TX * sx - 1, TY * sy - 1, 2, 2);
    for (const k in S.own) { const [x, y] = unkey(k); g.fillStyle = alColor(S.own[k]); g.globalAlpha = .8; g.fillRect(Math.floor(x * sx), Math.floor(y * sy), 1, 1); } g.globalAlpha = 1;
    MAP.mini = c;
  }
  mx.clearRect(0, 0, w, h); mx.drawImage(MAP.mini, 0, 0);
  mx.strokeStyle = '#e0a44a'; mx.lineWidth = 1; const vw = MAP.w / MAP.ts * sx, vh = MAP.h / MAP.ts * sy; mx.strokeRect(MAP.cx * sx - vw / 2, MAP.cy * sy - vh / 2, Math.max(4, vw), Math.max(4, vh));
  mx.fillStyle = '#e7e4da'; mx.fillRect(S.base.x * sx - 1, S.base.y * sy - 1, 3, 3);
  for (const i of S.incoming) { mx.fillStyle = '#d4654a'; const b = S.bots.find(b => b.al === i.bot); if (b) mx.fillRect(b.x * sx - 1, b.y * sy - 1, 3, 3); }
}

function drawMap(now) {
  if (terrDirty) computeTags();
  const g = cx2, ts = MAP.ts, w = MAP.w, h = MAP.h, dpr = MAP.dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.imageSmoothingEnabled = true;
  g.fillStyle = '#0a0d0e'; g.fillRect(0, 0, w, h);
  const x0 = Math.floor(MAP.cx - w / 2 / ts) - 1, x1 = Math.ceil(MAP.cx + w / 2 / ts) + 1, y0 = Math.floor(MAP.cy - h / 2 / ts) - 1, y1 = Math.ceil(MAP.cy + h / 2 / ts) + 1;
  const sz = Math.ceil(ts) + 1, sel = UI.sel, detail = ts >= 22, pulse = (Math.sin(now / 400) + 1) / 2, pulse2 = (Math.sin(now / 900) + 1) / 2;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const late = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const t = tileInfo(x, y), px = Math.floor(w / 2 + (x - MAP.cx) * ts - ts / 2), py = Math.floor(h / 2 + (y - MAP.cy) * ts - ts / 2), v = Math.floor(hx(x, y, 3) * 4);
    const base = t.terr === 'throne' || t.terr === 'plaza' ? 'plaza' : t.terr === 'forest' ? 'forest' : 'wild';
    g.drawImage(terrainSprite(base, v), px, py, sz, sz);
    if (t.owner != null) {
      const c = alColor(t.owner); g.globalAlpha = .17; g.fillStyle = c; g.fillRect(px, py, sz, sz); g.globalAlpha = 1;
      g.fillStyle = c; const e = Math.max(2, ts / 12);
      if (S.own[key(x, y - 1)] !== t.owner) g.fillRect(px, py, sz, e); if (S.own[key(x, y + 1)] !== t.owner) g.fillRect(px, py + sz - e, sz, e);
      if (S.own[key(x - 1, y)] !== t.owner) g.fillRect(px, py, e, sz); if (S.own[key(x + 1, y)] !== t.owner) g.fillRect(px + sz - e, py, e, sz);
    }
    if (t.enc) { g.strokeStyle = alColor(t.enc.o); g.lineWidth = 1.5; g.setLineDash([4, 3]); g.lineDashOffset = -now / 60; g.strokeRect(px + 3, py + 3, sz - 7, sz - 7); g.setLineDash([]); g.globalAlpha = .12 + pulse * .12; g.fillStyle = alColor(t.enc.o); g.fillRect(px, py, sz, sz); g.globalAlpha = 1; }
    let f = null, s = 1;
    if (t.kind === 'node') f = FEAT[t.nk === 'food' ? 'food' : t.nk === 'oil' ? 'oil' : t.nk === 'energy' ? 'energy' : 'steel'](t.node.grade);
    else if (t.kind === 'monster') f = FEAT.monster(t.grade); else if (t.kind === 'camp') f = FEAT.camp();
    else if (t.kind === 'base') { f = FEAT.base(); s = 1.3; } else if (t.kind === 'pbase') { f = FEAT.pbase(ccLevel()); s = 1.6; }
    if (f) late.push([f, px, py, s, t]);
  }
  if (ts >= 20) { g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = 1; g.beginPath(); for (let x = x0; x <= x1; x++) { const px = Math.floor(w / 2 + (x - MAP.cx) * ts - ts / 2) + .5; g.moveTo(px, 0); g.lineTo(px, h); } for (let y = y0; y <= y1; y++) { const py = Math.floor(h / 2 + (y - MAP.cy) * ts - ts / 2) + .5; g.moveTo(0, py); g.lineTo(w, py); } g.stroke(); }
  // features (sorted by row so lower tiles overlap higher)
  for (const [f, px, py, s, t] of late) {
    const dsz = ts * s, ox = px + (ts - dsz) / 2, oy = py + (ts - dsz) / 2 - (s > 1 ? ts * .1 : 0);
    if (t.kind === 'pbase') { g.globalAlpha = .25 + pulse2 * .3; g.strokeStyle = '#e0a44a'; g.lineWidth = 2; g.beginPath(); g.arc(px + ts / 2, py + ts / 2, ts * (.95 + pulse2 * .25), 0, 7); g.stroke(); g.globalAlpha = 1; }
    g.drawImage(f, ox, oy, dsz, dsz);
    if (t.kind === 'base') { g.fillStyle = alColor(t.bot.al); g.fillRect(px + ts * .68, py - ts * .05, ts * .06, ts * .38); g.fillRect(px + ts * .74, py - ts * .05, ts * .22, ts * .16); }
    if (t.kind === 'node') { if (t.node.rich) { g.strokeStyle = `rgba(224,164,74,${.5 + pulse * .5})`; g.lineWidth = 2; g.strokeRect(px + 1, py + 1, sz - 3, sz - 3); }
      if (detail) { const bw = ts * .38; g.fillStyle = 'rgba(10,13,14,.82)'; g.fillRect(px + ts - bw - 2, py + ts - bw - 2, bw, bw); g.fillStyle = t.node.rich ? '#e0a44a' : '#e7e4da'; g.font = `700 ${Math.round(ts * .32)}px "Barlow Condensed",sans-serif`; g.fillText(String(t.node.grade), px + ts - bw / 2 - 2, py + ts - bw / 2 - 1); } else { g.fillStyle = '#e7e4da'; g.font = `700 ${Math.round(ts * .55)}px "Barlow Condensed",sans-serif`; g.fillText(String(t.node.grade), px + ts / 2, py + ts / 2); } }
    if ((t.kind === 'monster' || t.kind === 'camp') && detail) { const bw = ts * .38; g.fillStyle = 'rgba(60,15,10,.9)'; g.fillRect(px + ts - bw - 2, py + ts - bw - 2, bw, bw); g.fillStyle = '#ff9a6a'; g.font = `700 ${Math.round(ts * .32)}px "Barlow Condensed",sans-serif`; g.fillText(String(t.grade), px + ts - bw / 2 - 2, py + ts - bw / 2 - 1); }
  }
  // citadel monument with beacon
  const cxs = w2sx(TX), cys = w2sy(TY);
  if (cxs > -ts * 5 && cxs < w + ts * 5 && cys > -ts * 6 && cys < h + ts * 5) {
    const size = ts * 4.4; g.drawImage(FEAT.citadel(), cxs - size / 2, cys - size / 2, size, size);
    const top = cys - size * .38, gr = g.createRadialGradient(cxs, top, 1, cxs, top, ts * (2.2 + pulse * .8)); gr.addColorStop(0, `rgba(255,214,140,${.75 + pulse * .25})`); gr.addColorStop(1, 'rgba(224,164,74,0)'); g.fillStyle = gr; g.fillRect(cxs - ts * 3.2, top - ts * 3.2, ts * 6.4, ts * 6.4);
    const bm = g.createLinearGradient(0, top, 0, top - ts * 6); bm.addColorStop(0, `rgba(255,220,150,${.35 + pulse * .2})`); bm.addColorStop(1, 'rgba(255,220,150,0)'); g.fillStyle = bm; g.fillRect(cxs - ts * .12, top - ts * 6, ts * .24, ts * 6);
    const th = S.throne; if (th.holder != null) { g.strokeStyle = alColor(th.holder); g.lineWidth = 2; g.globalAlpha = .5 + pulse * .5; g.beginPath(); g.arc(cxs, cys, ts * 2.3, 0, 7); g.stroke(); g.globalAlpha = 1; }
  }
  // marches and incoming
  MAP.marks = [];
  const bx = w2sx(S.base.x), by = w2sy(S.base.y);
  for (const m of S.marches) {
    if (m.kind === 'field') continue; const tx = w2sx(m.tx), ty = w2sy(m.ty); let f = 0, back = m.phase === 'back';
    if (m.phase === 'out') f = clamp((now - m.start) / (m.end - m.start), 0, 1); else if (back) f = 1 - clamp((now - m.start) / (m.end - m.start), 0, 1); else if (m.phase === 'wait') f = 0; else f = 1;
    const X = bx + (tx - bx) * f, Y = by + (ty - by) * f;
    g.strokeStyle = 'rgba(224,164,74,.55)'; g.lineWidth = 1.5; g.setLineDash([5, 5]); g.lineDashOffset = -now / 50 * (back ? -1 : 1); g.beginPath(); g.moveTo(bx, by); g.lineTo(tx, ty); g.stroke(); g.setLineDash([]);
    const ang = Math.atan2(ty - by, tx - bx) + (back ? Math.PI : 0); g.save(); g.translate(X, Y); g.rotate(ang); g.fillStyle = '#e0a44a'; g.strokeStyle = '#1a1408'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(10, 0); g.lineTo(-7, -7); g.lineTo(-3, 0); g.lineTo(-7, 7); g.closePath(); g.fill(); g.stroke(); g.restore();
    MAP.marks.push({ id: m.id, x: X, y: Y });
  }
  for (const i of S.incoming) {
    const b = S.bots.find(b => b.al === i.bot); if (!b) continue; const sx0 = w2sx(b.x), sy0 = w2sy(b.y), f = clamp((now - i.start) / (i.end - i.start), 0, 1), X = sx0 + (bx - sx0) * f, Y = sy0 + (by - sy0) * f;
    g.strokeStyle = `rgba(212,101,74,${.4 + pulse * .5})`; g.lineWidth = i.rally ? 3 : 2; g.setLineDash([6, 4]); g.lineDashOffset = now / 40; g.beginPath(); g.moveTo(sx0, sy0); g.lineTo(bx, by); g.stroke(); g.setLineDash([]);
    const ang = Math.atan2(by - sy0, bx - sx0); g.save(); g.translate(X, Y); g.rotate(ang); g.fillStyle = '#d4654a'; g.strokeStyle = '#0e1113'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(12, 0); g.lineTo(-8, -8); g.lineTo(-3, 0); g.lineTo(-8, 8); g.closePath(); g.fill(); g.stroke(); g.restore();
    g.strokeStyle = `rgba(212,101,74,${1 - pulse})`; g.lineWidth = 2; g.beginPath(); g.arc(X, Y, 10 + pulse * 10, 0, 7); g.stroke();
  }
  if (sel) { const px = w2sx(sel.x) - ts / 2, py = w2sy(sel.y) - ts / 2, L = ts * .3; g.strokeStyle = '#e0a44a'; g.lineWidth = 2.5; g.beginPath(); for (const [ax, ay, dx, dy] of [[px, py, 1, 1], [px + ts, py, -1, 1], [px, py + ts, 1, -1], [px + ts, py + ts, -1, -1]]) { g.moveTo(ax + dx * L, ay); g.lineTo(ax, ay); g.lineTo(ax, ay + dy * L); } g.stroke(); }
  // alliance tags: fade near the viewport edge and at low zoom
  g.font = `700 ${clamp(Math.round(ts * .5), 11, 22)}px "Barlow Condensed",sans-serif`; g.lineJoin = 'round'; g.lineWidth = 4; g.strokeStyle = 'rgba(10,13,14,.9)';
  for (const tg of MAP.tags) { const px = w2sx(tg.x), py = w2sy(tg.y) - (Math.hypot(tg.x - S.base.x, tg.y - S.base.y) < 2.2 || S.bots.some(b => Math.hypot(tg.x - b.x, tg.y - b.y) < 2.2) ? ts * .95 : 0); const edge = Math.min(px, py, w - px, h - py); if (edge < -20) continue; const a = clamp(edge / 70, 0, 1) * (ts < 16 && tg.n < 40 ? 0 : 1); if (a <= 0.02) continue; g.globalAlpha = a; g.strokeText(tg.t, px, py); g.fillStyle = tg.c; g.fillText(tg.t, px, py); } g.globalAlpha = 1;
  // vignette
  const vg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .45, w / 2, h / 2, Math.max(w, h) * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
  drawMini(); document.getElementById('coord').textContent = `${Math.round(MAP.cx)},${Math.round(MAP.cy)} · ×${(ts / 36).toFixed(1)}`;
  positionRadial();
}

/* ---------------- gestures ---------------- */
function zoomAt(px, py, ts) { const wx = s2wx(px), wy = s2wy(py); MAP.ts = clamp(ts, TS_MIN, TS_MAX); MAP.cx = wx - (px - MAP.w / 2) / MAP.ts; MAP.cy = wy - (py - MAP.h / 2) / MAP.ts; clampView(); }
function initMap() {
  new ResizeObserver(resizeMap).observe(cv); resizeMap(); MAP.cx = S.view.x; MAP.cy = S.view.y;
  cv.addEventListener('pointerdown', e => {
    cv.setPointerCapture(e.pointerId); const r = cv.getBoundingClientRect(); MAP.ptr.set(e.pointerId, { x: e.clientX - r.left, y: e.clientY - r.top }); MAP.vx = MAP.vy = 0; MAP.active = true; closeRadial();
    if (MAP.ptr.size === 1) { const p = MAP.ptr.get(e.pointerId); MAP.drag = { x: p.x, y: p.y, cx: MAP.cx, cy: MAP.cy, moved: false, s: [{ t: e.timeStamp, x: p.x, y: p.y }] }; MAP.moved = false; }
    else if (MAP.ptr.size === 2) { const [a, b] = [...MAP.ptr.values()]; MAP.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), ts: MAP.ts }; MAP.drag = null; MAP.moved = true; }
  });
  cv.addEventListener('pointermove', e => {
    const p = MAP.ptr.get(e.pointerId); if (!p) return; const r = cv.getBoundingClientRect(); p.x = e.clientX - r.left; p.y = e.clientY - r.top;
    if (MAP.pinch && MAP.ptr.size >= 2) { const [a, b] = [...MAP.ptr.values()], d = Math.hypot(a.x - b.x, a.y - b.y); zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, MAP.pinch.ts * d / MAP.pinch.d); return; }
    const d = MAP.drag; if (!d) return; const dx = p.x - d.x, dy = p.y - d.y; if (!d.moved && Math.abs(dx) + Math.abs(dy) > 7) { d.moved = true; MAP.moved = true; }
    if (d.moved) { MAP.cx = d.cx - dx / MAP.ts; MAP.cy = d.cy - dy / MAP.ts; clampView(); d.s.push({ t: e.timeStamp, x: p.x, y: p.y }); while (d.s.length > 2 && e.timeStamp - d.s[0].t > 100) d.s.shift(); }
  });
  const up = e => {
    const p = MAP.ptr.get(e.pointerId); MAP.ptr.delete(e.pointerId); const d = MAP.drag;
    if (MAP.ptr.size < 2) MAP.pinch = null;
    if (!d || MAP.ptr.size > 0) { if (!MAP.ptr.size) MAP.active = false; return; }
    MAP.drag = null;
    if (!d.moved) { MAP.active = false; if (p) mapTap(p.x, p.y); return; }
    const a = d.s[0], b = d.s[d.s.length - 1], dt = b.t - a.t;
    if (dt > 0 && dt < 160) { const vx = (b.x - a.x) / dt, vy = (b.y - a.y) / dt; MAP.vx = -vx / MAP.ts; MAP.vy = -vy / MAP.ts; if (Math.hypot(vx, vy) < 0.08) { MAP.vx = MAP.vy = 0; MAP.active = false; } } else MAP.active = false;
    S.view = { x: MAP.cx, y: MAP.cy };
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', e => { MAP.ptr.delete(e.pointerId); MAP.drag = null; MAP.pinch = null; MAP.active = false; });
  cv.addEventListener('wheel', e => { e.preventDefault(); const r = cv.getBoundingClientRect(); zoomAt(e.clientX - r.left, e.clientY - r.top, MAP.ts * Math.exp(-e.deltaY * .0015)); }, { passive: false });
  mini.addEventListener('click', e => { const r = mini.getBoundingClientRect(); panTo((e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H); });
  document.getElementById('compass').innerHTML = [['N', 'n'], ['W', 'w'], ['Base', 'b'], ['E', 'e'], ['S', 's'], ['Jump to throne', 't']].map(([n, k]) => `<button class="btn sm glass" data-a="jump" data-k="${k}">${n}</button>`).join('');
  let prev = performance.now();
  const loop = now => {
    requestAnimationFrame(loop); if (UI.page !== 'map' || document.hidden) { prev = now; return; }
    const dt = Math.min(50, now - prev); if (!MAP.active && now - MAP.drawn < 32 && !UI.dirty) { return; } prev = now;
    if (!MAP.drag && (MAP.vx || MAP.vy)) {
      MAP.cx += MAP.vx * dt; MAP.cy += MAP.vy * dt; const k = Math.exp(-dt / 320); MAP.vx *= k; MAP.vy *= k;
      if (MAP.cx <= 0 || MAP.cx >= W - 1) MAP.vx = 0; if (MAP.cy <= 0 || MAP.cy >= H - 1) MAP.vy = 0; clampView();
      if (Math.hypot(MAP.vx, MAP.vy) * MAP.ts < 0.015) { MAP.vx = MAP.vy = 0; if (!MAP.ptr.size) MAP.active = false; S.view = { x: MAP.cx, y: MAP.cy }; }
    }
    MAP.drawn = now; drawMap(Date.now());
  };
  requestAnimationFrame(loop);
}

/* ---------------- tap, radial menu ---------------- */
function mapTap(px, py) {
  hap(8); snd();
  let best = null, bd = 26; for (const m of MAP.marks) { const d = Math.hypot(m.x - px, m.y - py); if (d < bd) { bd = d; best = m; } }
  if (best) { UI.sel = null; openRadial({ type: 'march', id: best.id, sx: best.x, sy: best.y }); return; }
  const x = Math.round(s2wx(px)), y = Math.round(s2wy(py)); if (x < 0 || y < 0 || x >= W || y >= H) return; selectTile(x, y);
}
function selectTile(x, y) { UI.sel = { x, y }; UI.sheet = null; UI.drawer = null; openRadial({ type: 'tile', x, y }); D(); }
function radialItems(r) {
  if (r.type === 'march') { const m = S.marches.find(x => x.id === r.id); if (!m) return []; const it = [{ l: m.phase === 'stay' || m.phase === 'hold' ? 'Withdraw' : 'Recall', a: 'recall', d: { id: m.id }, c: 'bad', ic: 'march' }]; if (m.phase !== 'stay' && m.phase !== 'back' && !(m.kind === 'rally' && m.phase !== 'wait')) it.push({ l: 'Rush ' + rushCost(m.end) + '◆', a: 'rush', d: { id: m.id }, ic: 'dia' }, { l: 'Slip', a: 'slip', d: { id: m.id }, ic: 'train' }); it.push({ l: 'Columns', a: 'drawer', d: { id: 'march', tab: 'cols' }, ic: 'march' }); return it; }
  const t = tileInfo(r.x, r.y), it = [], d = { x: r.x, y: r.y };
  if (t.kind === 'node') it.push({ l: 'Gather', a: 'qsend', d: { k: 'gather', ...d }, c: 'pri', ic: 'rations' });
  else if (t.kind === 'monster' || t.kind === 'camp') it.push({ l: 'Hunt', a: 'qsend', d: { k: 'hunt', ...d }, c: 'bad', ic: 'march' });
  else if (t.kind === 'wild' || t.kind === 'forest') { if (t.owner !== 0) it.push({ l: 'Encamp', a: 'qsend', d: { k: 'encamp', ...d }, c: 'pri', ic: 'march' }); it.push({ l: 'Teleport', a: 'tp', d, ic: 'map' }); }
  else if (t.kind === 'base') it.push({ l: 'Strike', a: 'qsend', d: { k: 'attack', ...d }, c: 'bad', ic: 'march' }, { l: 'Scout', a: 'scout', d, ic: 'lab' }, { l: 'Rally', a: 'rallyto', d: { t: t.bot.al }, ic: 'train' });
  else if (t.kind === 'throne') it.push({ l: 'Assault', a: 'qsend', d: { k: 'throne', ...d }, c: 'bad', ic: 'march' }, { l: 'Scout', a: 'scout', d, ic: 'lab' }, { l: 'Rally', a: 'rallyto', d: { t: 'citadel' }, ic: 'train' });
  else if (t.kind === 'pbase') it.push({ l: 'Base', a: 'dock', d: { k: 'base' }, c: 'pri', ic: 'base' });
  it.push({ l: 'Details', a: 'details', d, ic: 'vault' }); return it;
}
function openRadial(r) {
  const items = radialItems(r); if (!items.length) return; MAP.radial = r; const el = document.getElementById('radial'); el.className = 'on';
  r.items = items; el.innerHTML = items.map((it, i) => `<button class="rb ${it.c || ''}" style="--i:${i}" data-a="${it.a}" ${Object.entries(it.d || {}).map(([k, v]) => `data-${k}="${v}"`).join(' ')}>${svg(it.ic).replace(/stroke="[^"]+"/, 'stroke="currentColor"')}<span>${it.l}</span></button>`).join('');
  positionRadial();
}
function positionRadial() {
  const r = MAP.radial; if (!r) return; const el = document.getElementById('radial'); let sx, sy;
  if (r.type === 'tile') { sx = w2sx(r.x); sy = w2sy(r.y); } else { sx = r.sx; sy = r.sy; }
  const n = r.items.length, rad = 66, down = sy < rad + 60, mid = down ? 90 : -90, span = Math.min(180, 50 * (n - 1) + 20);
  el.style.left = sx + 'px'; el.style.top = sy + 'px';
  [...el.children].forEach((b, i) => { let a = (n === 1 ? mid : mid - span / 2 + span * i / (n - 1)) * Math.PI / 180; let x = Math.cos(a) * rad, y = Math.sin(a) * rad; const ax = sx + x; if (ax < 34) x += 34 - ax; if (ax > MAP.w - 34) x -= ax - (MAP.w - 34); b.style.transform = `translate(${x - 26}px,${y - 26}px)`; });
}
function closeRadial() { MAP.radial = null; const el = document.getElementById('radial'); el.className = ''; el.innerHTML = ''; }
