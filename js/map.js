'use strict';
/* IRON MARCH — world map: inertial pan, pinch zoom, sprite terrain, territory, radial menu. */
const MAP = { cx: 120, cy: 220, ts: 28, w: 0, h: 0, dpr: 1, tags: [], ptr: new Map(), drag: null, pinch: null, vx: 0, vy: 0, active: false, mini: null, marks: [], last: 0, drawn: 0, moved: false, first: true, zooming: false, now: 0 };
const cv = document.getElementById('map'), cx2 = cv.getContext('2d'), mini = document.getElementById('mini'), mx = mini.getContext('2d');
const TS_MIN = 15, TS_MAX = 52;
const mixHex = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A_ = p(a), B_ = p(b); return '#' + A_.map((v, i) => Math.round(v + (B_[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
function resizeMap() { const r = cv.getBoundingClientRect(); MAP.dpr = Math.min(2, window.devicePixelRatio || 1); MAP.w = r.width; MAP.h = r.height; cv.width = Math.round(r.width * MAP.dpr); cv.height = Math.round(r.height * MAP.dpr); }
/* isometric projection: +x runs down-right, +y runs down-left. Tile is 2·ts wide and ts tall. */
const w2sx = (x, y) => MAP.w / 2 + ((x - MAP.cx) - (y - MAP.cy)) * MAP.ts, w2sy = (x, y) => MAP.h / 2 + ((x - MAP.cx) + (y - MAP.cy)) * MAP.ts / 2;
const sd2w = (dx, dy) => [(dx + 2 * dy) / (2 * MAP.ts), (2 * dy - dx) / (2 * MAP.ts)];
const s2w = (px, py) => { const [a, b] = sd2w(px - MAP.w / 2, py - MAP.h / 2); return [MAP.cx + a, MAP.cy + b]; };
function diamond(g, x, y, ts, k) { k = k || 1; g.moveTo(x, y - ts * .5 * k); g.lineTo(x + ts * k, y); g.lineTo(x, y + ts * .5 * k); g.lineTo(x - ts * k, y); g.closePath(); }
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
  mx.strokeStyle = '#e0a44a'; mx.lineWidth = 1; mx.beginPath(); [[0, 0], [MAP.w, 0], [MAP.w, MAP.h], [0, MAP.h]].forEach(([px, py], i) => { const [a, b] = s2w(px, py); i ? mx.lineTo(a * sx, b * sy) : mx.moveTo(a * sx, b * sy); }); mx.closePath(); mx.stroke();
  mx.fillStyle = '#e7e4da'; mx.fillRect(S.base.x * sx - 1, S.base.y * sy - 1, 3, 3);
  for (const i of S.incoming) { mx.fillStyle = '#d4654a'; const b = S.bots.find(b => b.al === i.bot); if (b) mx.fillRect(b.x * sx - 1, b.y * sy - 1, 3, 3); }
}

/* march token: unit disc with a heading chevron riding the rim. Size follows zoom, clamped so it stays tappable. */
function drawToken(g, X, Y, ang, ts, cls, tier, hostile, now, big) {
  const d = clamp(ts * (big ? 1.25 : 1.05), 30, 58), bob = Math.sin(now / 260 + X * .01) * 1.4;
  g.save(); g.translate(X, Y + bob);
  g.drawImage(marchToken(cls, tier, hostile), -d / 2, -d / 2, d, d);
  g.rotate(ang); g.fillStyle = hostile ? '#d4654a' : '#e0a44a'; g.strokeStyle = '#0e1113'; g.lineWidth = 1.4; g.beginPath();
  g.moveTo(d / 2 + 9, 0); g.lineTo(d / 2 - 2, -6.5); g.lineTo(d / 2 + 1, 0); g.lineTo(d / 2 - 2, 6.5); g.closePath(); g.fill(); g.stroke(); g.restore();
}
function tree(g, x, y, ts, r) { const s = ts * (.3 + r * .9); g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(x, y + s * .35, s * .5, s * .2, 0, 0, 7); g.fill(); g.fillStyle = '#3a2a1a'; g.fillRect(x - s * .05, y - s * .1, s * .1, s * .45); for (const [dy, c, k] of [[.05, '#2c4a26', .5], [-.2, '#3d6a32', .42], [-.42, '#578a45', .3]]) { g.fillStyle = c; g.beginPath(); g.ellipse(x, y + dy * s, s * k, s * k * .8, 0, 0, 7); g.fill(); } }
function rock(g, x, y, ts) { const s = ts * .28; g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(x, y + s * .5, s * .9, s * .3, 0, 0, 7); g.fill(); g.fillStyle = '#7d7466'; g.beginPath(); g.moveTo(x - s, y + s * .4); g.lineTo(x - s * .5, y - s * .5); g.lineTo(x + s * .3, y - s * .7); g.lineTo(x + s, y + s * .3); g.closePath(); g.fill(); g.fillStyle = '#a49a88'; g.beginPath(); g.moveTo(x - s * .5, y - s * .5); g.lineTo(x + s * .3, y - s * .7); g.lineTo(x + s * .1, y - s * .1); g.closePath(); g.fill(); }
/* ---------------- terrain chunk cache ----------------
   Ground, territory washes, bevels, trees and rocks never change while the camera moves, so they are painted once into
   CN×CN tile chunks (at a few fixed zoom levels) and blitted each frame. Features, marches and effects stay live. */
const CN = 6, TLV = [16, 20, 24, 28, 34, 40, 46, 52], CH_BYTES = 72e6;
const CH = { map: new Map(), feats: new Map(), bytes: 0, frame: 0, pool: {}, tv: 0, fver: 0, dpr: 0 };
const lvOf = ts => { let b = TLV[0]; for (const l of TLV) if (Math.abs(l - ts) < Math.abs(b - ts)) b = l; return b; };
/* pre-warped diamond ground tiles per zoom level, so chunk builds are plain axis-aligned blits */
const ATL = new Map(), gdpr = () => Math.min(MAP.dpr, 1.5); // the ground layer is soft art, so it renders at most 1.5x
function tileAtlas(lv, base, v) {
  const dpr = gdpr(), key = lv + base + v + '@' + dpr + (base === 'wild' ? ART.slabReady() : ''); let c = ATL.get(key); if (c) return c;
  const tq = lv, hq = tq / 2; c = document.createElement('canvas'); c.width = Math.ceil(2 * tq * dpr) + 4; c.height = Math.ceil(tq * dpr) + 4;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.setTransform(dpr * tq, dpr * hq, -dpr * tq, dpr * hq, c.width / 2, c.height / 2 - dpr * hq);
  g.drawImage(terrainSprite(base, v), -.015, -.015, 1.03, 1.03);
  if (tq >= 20) { // bevel: light on the upper edges, shade on the lower ones, so tiles read as slabs
    g.setTransform(dpr, 0, 0, dpr, c.width / 2, c.height / 2); g.lineWidth = 1; g.lineCap = 'butt'; g.strokeStyle = 'rgba(255,255,255,.09)'; g.beginPath(); g.moveTo(-tq, 0); g.lineTo(0, -hq); g.lineTo(tq, 0); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,.34)'; g.beginPath(); g.moveTo(-tq, 0); g.lineTo(0, hq); g.lineTo(tq, 0); g.stroke();
  }
  ATL.set(key, c); return c;
}
function chunkSig(cxk, cyk) { // hash of who owns every tile in the chunk and its one-tile border, plus alliance colours
  let h = CH.cv | 0; for (let y = cyk * CN - 1; y <= cyk * CN + CN; y++) for (let x = cxk * CN - 1; x <= cxk * CN + CN; x++) { const o = S.own[x + ',' + y]; h = (Math.imul(h, 31) + (o == null ? 0 : o + 1)) | 0; } return h;
}
function chunkGone(c) { CH.bytes -= c.bytes; (CH.pool[c.lv] = CH.pool[c.lv] || []).push(c.c); if (CH.pool[c.lv].length > 6) CH.pool[c.lv].shift(); }
function refreshChunks() { // ownership or colours changed: only chunks whose own picture changed are marked stale
  CH.cv = 0; for (const a of S.al) for (const ch of String(a.color)) CH.cv = (Math.imul(CH.cv, 31) + ch.charCodeAt(0)) | 0;
  CH.anyStale = false; for (const c of CH.map.values()) { const s = chunkSig(c.cx, c.cy); if (s !== c.sig) c.stale = CH.anyStale = true; }
  CH.fver++; return CH.anyStale;
}
function buildChunk(lv, cxk, cyk, old) {
  const tq = lv, hq = tq / 2, dpr = gdpr(), pad = 4, X0 = cxk * CN, Y0 = cyk * CN, cw = Math.ceil(2 * CN * tq + 2 * pad), chh = Math.ceil(CN * tq + 2 * pad), ox = CN * tq + pad, oy = hq + pad;
  let c = old ? old.c : (CH.pool[lv] && CH.pool[lv].pop());
  if (!c) c = document.createElement('canvas');
  if (c.width !== Math.round(cw * dpr) || c.height !== Math.round(chh * dpr)) { c.width = Math.round(cw * dpr); c.height = Math.round(chh * dpr); }
  const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.imageSmoothingEnabled = true;
  const rim = tq >= 20, ownShow = !MAP.hideTerr;
  for (let ly = 0; ly < CN; ly++) for (let lx = 0; lx < CN; lx++) {
    const x = X0 + lx, y = Y0 + ly; if (x >= W || y >= H) continue;
    const cxp = ox + (lx - ly) * tq, cyp = oy + (lx + ly) * hq, terr = terrainAt(x, y), k = x + ',' + y, owner = S.own[k], v = Math.floor(hx(x, y, 3) * 8);
    const base = terr === 'throne' || terr === 'plaza' ? 'plaza' : terr === 'forest' ? 'forest' : 'wild';
    let fd = 1; // forest density: clumped noise so woods have clearings and thin edges instead of a repeating carpet
    if (base === 'forest') { fd = hx(Math.floor(x / 4), Math.floor(y / 4), 11) * .65 + hx(x, y, 12) * .35; g.fillStyle = mixHex('#14261b', '#1d3a22', hx(x, y, 13)); g.beginPath(); diamond(g, cxp, cyp, tq, 1.01); g.fill(); }
    if (fd >= .3) { const at = tileAtlas(lv, base, v); g.globalAlpha = base === 'forest' ? clamp((fd - .3) / .25, .35, 1) : 1; g.drawImage(at, cxp - at.width / dpr / 2, cyp - at.height / dpr / 2, at.width / dpr, at.height / dpr); g.globalAlpha = 1; }
    else if (tq >= 20 && hx(x, y, 14) < .5) tree(g, cxp + (hx(x, y, 15) - .5) * tq * .8, cyp + (hx(x, y, 16) - .5) * hq * .6, tq, hx(x, y, 17) * .6);
    if (owner != null && ownShow) {
      const col = alColor(owner); g.globalAlpha = .2; g.fillStyle = col; g.beginPath(); diamond(g, cxp, cyp, tq); g.fill(); g.globalAlpha = 1;
      g.strokeStyle = col; g.lineWidth = Math.max(2, tq / 9); g.lineCap = 'round';
      const T = [cxp, cyp - hq], R = [cxp + tq, cyp], B = [cxp, cyp + hq], L = [cxp - tq, cyp];
      const seg = (a, b) => { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); };
      if (S.own[x + ',' + (y - 1)] !== owner) seg(T, R); if (S.own[(x + 1) + ',' + y] !== owner) seg(R, B);
      if (S.own[x + ',' + (y + 1)] !== owner) seg(B, L); if (S.own[(x - 1) + ',' + y] !== owner) seg(L, T);
    }
    if (rim) {
      if (terr === 'wild' && !owner) { const r = hx(x, y, 9); if ((r < .16 || r > .93) && tileInfo(x, y).kind === 'wild') { if (r < .16) tree(g, cxp + (hx(x, y, 4) - .5) * tq * .7, cyp + (hx(x, y, 5) - .5) * hq * .6, tq, r); else rock(g, cxp + (hx(x, y, 6) - .5) * tq * .8, cyp, tq); } }
    }
  }
  const bytes = c.width * c.height * 4, rec = { c, lv, cx: cxk, cy: cyk, sig: chunkSig(cxk, cyk), stale: false, ht: !!MAP.hideTerr, bytes, use: CH.frame, cw, chh, ox, oy };
  if (old) CH.bytes -= old.bytes; CH.bytes += bytes; CH.map.set(lv + ':' + cxk + ',' + cyk, rec); return rec;
}
function chunkFeats(cxk, cyk) { // feature tiles (nodes, monsters, camps, bases) of one chunk; refreshed when the world changes
  const k = cxk + ',' + cyk; let e = CH.feats.get(k); if (e && (e.fv === CH.fver || CH.fbudget-- <= 0)) return e.list;
  const list = [];
  for (let y = cyk * CN; y < cyk * CN + CN; y++) for (let x = cxk * CN; x < cxk * CN + CN; x++) {
    if (x >= W || y >= H) continue; const t = tileInfo(x, y); let f = null, s = 1;
    if (t.kind === 'node') f = (t.node.from && FEAT.loot && FEAT.loot(t.node.from)) || FEAT[t.nk === 'food' ? 'food' : t.nk === 'oil' ? 'oil' : t.nk === 'energy' ? 'energy' : 'steel'](t.node.grade);
    else if (t.kind === 'monster') f = FEAT.monster(t.grade, t.mon); else if (t.kind === 'camp') f = FEAT.camp();
    else if (t.kind === 'base') { f = FEAT.base(t.bot.p); s = 1.6; } else if (t.kind === 'pbase') { f = FEAT.pbase(ccLevel()); s = 1.6; }
    if (f) list.push({ x, y, k: x + y, f, s, t });
  }
  CH.feats.set(k, { list, fv: CH.fver, t: MAP.now }); if (CH.feats.size > 400) CH.feats.delete(CH.feats.keys().next().value); return list;
}
/* The ground lives on its own canvas (#ground) that is larger than the screen. Panning and zooming just move it with a CSS
   transform, which the compositor does for free. It is repainted from chunks only when the view nears its edge or the zoom
   drifts, and missing chunks are built a few milliseconds per frame ahead of time so no single frame pays for them. */
const GR = { cs: [document.getElementById('ground'), document.getElementById('ground2')], gs: [null, null], an: [null, null], front: 0, job: null, mx: 0, my: 0, w: 0, h: 0, dpr: 0, ok: false, ht: false, dirty: true, stamp: 0 };
function worldRect(px0, py0, px1, py1) {
  let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
  for (const [px, py] of [[px0, py0], [px1, py0], [px0, py1], [px1, py1]]) { const [a, b] = s2w(px, py); a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b); }
  return [Math.max(0, Math.floor(a0)), Math.max(0, Math.floor(b0)), Math.min(W - 1, Math.ceil(a1)), Math.min(H - 1, Math.ceil(b1))];
}
/* The back canvas is painted from chunks a little each frame, then swapped to the front. `force` finishes it right now. */
function startJob() {
  const ts = MAP.ts, w = MAP.w, h = MAP.h, mx = GR.mx, my = GR.my, camx = MAP.cx, camy = MAP.cy, list = [];
  const [x0, y0, x1, y1] = worldRect(-mx - ts * 2, -my - ts * 3, w + mx + ts * 2, h + my + ts * 2);
  for (let cy = Math.floor(y0 / CN); cy <= Math.floor(y1 / CN); cy++) for (let cx = Math.floor(x0 / CN); cx <= Math.floor(x1 / CN); cx++) if (cx * CN < W && cy * CN < H) list.push([cx, cy]);
  const d = (p) => Math.hypot(p[0] * CN + CN / 2 - camx, p[1] * CN + CN / 2 - camy); list.sort((p, q) => d(p) - d(q));
  const tgt = GR.ok ? 1 - GR.front : GR.front, g = GR.gs[tgt]; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, GR.cs[tgt].width, GR.cs[tgt].height);
  GR.job = { tgt, camx, camy, ts, lv: lvOf(ts), list, i: 0, miss: false, st: ++GR.stamp };
}
function stepJob(force) {
  let cap = force ? 1e9 : 4; const j = GR.job, dpr = gdpr(), t0 = performance.now(), budget = MAP.first || force ? 1e9 : 4, g = GR.gs[j.tgt], w = MAP.w, h = MAP.h, mx = GR.mx, my = GR.my, ts = j.ts;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  while (j.i < j.list.length) {
    if (performance.now() - t0 > budget || cap-- <= 0) return false;
    const [cx, cy] = j.list[j.i], key = j.lv + ':' + cx + ',' + cy; let c = CH.map.get(key);
    if (!c || c.stale || c.ht !== !!MAP.hideTerr) {
      if (force && !MAP.first) { // no time to build: borrow a chunk of another zoom level (or leave a gap) and repaint properly afterwards
        let f = null; for (const l of TLV) { const o = CH.map.get(l + ':' + cx + ',' + cy); if (o && (!f || Math.abs(l - j.lv) < Math.abs(f.lv - j.lv))) f = o; }
        if (f) { c = f; j.partial = true; } else if (performance.now() - t0 < 8) c = buildChunk(j.lv, cx, cy, c); else { j.partial = true; j.i++; continue; }
      } else c = buildChunk(j.lv, cx, cy, c);
    }
    j.i++; c.use = j.st; const k = ts / c.lv, X0 = cx * CN, Y0 = cy * CN;
    g.drawImage(c.c, mx + w / 2 + ((X0 - j.camx) - (Y0 - j.camy)) * ts - c.ox * k, my + h / 2 + ((X0 - j.camx) + (Y0 - j.camy)) * ts / 2 - c.oy * k, c.cw * k, c.chh * k);
  }
  GR.an[j.tgt] = { ax: j.camx, ay: j.camy, ts }; if (GR.ok && j.tgt !== GR.front) GR.cs[GR.front].style.visibility = 'hidden'; GR.cs[j.tgt].style.visibility = 'visible';
  GR.front = j.tgt; GR.ok = true; GR.dirty = !!j.partial; GR.ht = !!MAP.hideTerr; GR.job = null; MAP.first = false;
  if (CH.bytes > CH_BYTES) { const arr = [...CH.map.entries()].sort((a, b) => a[1].use - b[1].use); for (const [k, c] of arr) { if (CH.bytes < CH_BYTES * .8 || c.use === j.st) break; CH.map.delete(k); chunkGone(c); } }
  return true;
}
function groundStep() {
  const ts = MAP.ts, w = MAP.w, h = MAP.h, dpr = gdpr();
  if (GR.w !== w || GR.h !== h || GR.dpr !== dpr) {
    GR.w = w; GR.h = h; GR.dpr = dpr; GR.mx = Math.round(w * .4); GR.my = Math.round(h * .4); GR.job = null;
    GR.cs.forEach((c, i) => { c.width = Math.round((w + 2 * GR.mx) * dpr); c.height = Math.round((h + 2 * GR.my) * dpr); c.style.width = (w + 2 * GR.mx) + 'px'; c.style.height = (h + 2 * GR.my) + 'px'; c.style.left = -GR.mx + 'px'; c.style.top = -GR.my + 'px'; c.style.visibility = 'hidden'; GR.gs[i] = c.getContext('2d'); GR.gs[i].imageSmoothingEnabled = true; }); GR.ok = false;
  }
  let need = false, urgent = !GR.ok;
  if (GR.ok) {
    const a = GR.an[GR.front], s = ts / a.ts, ax = w2sx(a.ax, a.ay), ay = w2sy(a.ax, a.ay), tx = ax + GR.mx - s * (GR.mx + w / 2), ty = ay + GR.my - s * (GR.my + h / 2);
    const gl = (GR.mx - tx) / s, gt = (GR.my - ty) / s, slack = Math.min(gl, gt, w + 2 * GR.mx - (gl + w / s), h + 2 * GR.my - (gt + h / s));
    if (s < .8 || s > 1.25 || slack < 0) urgent = need = true; else if (slack < GR.mx * .55 || (!MAP.zooming && Math.abs(s - 1) > .05) || GR.dirty || GR.ht !== !!MAP.hideTerr) need = true;
    if (GR.job && slack < GR.mx * .12) urgent = true;
  }
  if ((need || urgent) && !GR.job) startJob();
  if (GR.job) stepJob(urgent);
  const a = GR.an[GR.front], s = ts / a.ts, ax = w2sx(a.ax, a.ay), ay = w2sy(a.ax, a.ay), q = v => Math.round(v * dpr) / dpr;
  GR.cs[GR.front].style.transform = `translate(${q(ax + GR.mx - s * (GR.mx + w / 2))}px,${q(ay + GR.my - s * (GR.my + h / 2))}px) scale(${s})`;
}
function drawMap(now) {
  MAP.now = now; CH.fbudget = 4; if (CH.dpr !== gdpr()) { CH.map.clear(); CH.bytes = 0; CH.pool = {}; CH.dpr = gdpr(); }
  if (terrDirty) { computeTags(); if (refreshChunks()) GR.dirty = true; }
  const foreign = isForeign(), g = cx2, ts = MAP.ts, w = MAP.w, h = MAP.h, dpr = MAP.dpr, hh = ts / 2; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.imageSmoothingEnabled = true;
  g.clearRect(0, 0, w, h);
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const [px, py] of [[-ts * 2, -ts * 3], [w + ts * 2, -ts * 3], [-ts * 2, h + ts * 2], [w + ts * 2, h + ts * 2]]) { const [a, b] = s2w(px, py); x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, b); y1 = Math.max(y1, b); }
  x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(W - 1, Math.ceil(x1)); y1 = Math.min(H - 1, Math.ceil(y1));
  const sel = UI.sel, detail = ts >= 22, pulse = (Math.sin(now / 400) + 1) / 2, pulse2 = (Math.sin(now / 900) + 1) / 2;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  groundStep();
  if (!foreign) for (const k in S.encs) { // encampments in progress: animated dashed ring and pulse
    const [x, y] = unkey(k), cxp = w2sx(x, y), cyp = w2sy(x, y); if (cxp < -ts * 2 || cxp > w + ts * 2 || cyp < -ts * 3 || cyp > h + ts * 2) continue; const en = S.encs[k];
    g.strokeStyle = alColor(en.o); g.lineWidth = 1.5; g.setLineDash([4, 3]); g.lineDashOffset = -now / 60; g.beginPath(); diamond(g, cxp, cyp, ts, .82); g.stroke(); g.setLineDash([]); g.globalAlpha = .12 + pulse * .12; g.fillStyle = alColor(en.o); g.beginPath(); diamond(g, cxp, cyp, ts); g.fill(); g.globalAlpha = 1;
  }
  const late = [];
  for (let cy = Math.floor(y0 / CN); cy <= Math.floor(y1 / CN); cy++) for (let cx = Math.floor(x0 / CN); cx <= Math.floor(x1 / CN); cx++) {
    if (cx * CN >= W || cy * CN >= H) continue;
    for (const it of chunkFeats(cx, cy)) { if (foreign && (it.t.kind === 'pbase' || it.t.kind === 'base')) continue; const cxp = w2sx(it.x, it.y), cyp = w2sy(it.x, it.y); if (cxp < -ts * 3 || cxp > w + ts * 3 || cyp < -ts * 4 || cyp > h + ts * 3) continue; late.push({ k: it.k, f: it.f, cxp, cyp, s: it.s, t: it.t }); }
  }
  // citadel monument joins the depth-sorted list so nearer things overlap it
  const cxs = w2sx(TX, TY), cys = w2sy(TX, TY), csize = ts * 5.2;
  if (cxs > -csize && cxs < w + csize && cys > -csize && cys < h + csize) late.push({ k: TX + TY, cit: true, cxp: cxs, cyp: cys });
  late.sort((a, b) => a.k - b.k);
  for (const it of late) {
    const { f, cxp, cyp, s, t } = it;
    if (it.cit) {
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(cxp, cyp + hh * .5, csize * .42, csize * .17, 0, 0, 7); g.fill();
      g.drawImage(FEAT.citadel(), cxp - csize / 2, cyp - csize * .68, csize, csize);
      const top = cyp - csize * .5, gr = g.createRadialGradient(cxp, top, 1, cxp, top, ts * (2.2 + pulse * .8)); gr.addColorStop(0, `rgba(255,214,140,${.75 + pulse * .25})`); gr.addColorStop(1, 'rgba(224,164,74,0)'); g.fillStyle = gr; g.fillRect(cxp - ts * 3.2, top - ts * 3.2, ts * 6.4, ts * 6.4);
      const bm = g.createLinearGradient(0, top, 0, top - ts * 6); bm.addColorStop(0, `rgba(255,220,150,${.35 + pulse * .2})`); bm.addColorStop(1, 'rgba(255,220,150,0)'); g.fillStyle = bm; g.fillRect(cxp - ts * .12, top - ts * 6, ts * .24, ts * 6);
      const th = S.throne; if (th.holder != null) { g.strokeStyle = alColor(th.holder); g.lineWidth = 2; g.globalAlpha = .5 + pulse * .5; g.beginPath(); g.ellipse(cxp, cyp, ts * 3.2, ts * 1.6, 0, 0, 7); g.stroke(); g.globalAlpha = 1; }
      continue;
    }
    const dsz = ts * 1.5 * s, ox = cxp - dsz / 2, oy = cyp + hh * .55 - dsz;
    g.fillStyle = 'rgba(0,0,0,.32)'; g.beginPath(); g.ellipse(cxp, cyp + hh * .1, dsz * .32, dsz * .13, 0, 0, 7); g.fill();
    if (t.kind === 'pbase') { g.globalAlpha = .25 + pulse2 * .3; g.strokeStyle = '#e0a44a'; g.lineWidth = 2; g.beginPath(); g.ellipse(cxp, cyp, ts * (1.5 + pulse2 * .35), ts * (.75 + pulse2 * .18), 0, 0, 7); g.stroke(); g.globalAlpha = 1; }
    g.drawImage(f, ox, oy, dsz, dsz);
    if (t.kind === 'base') { const fx = cxp + dsz * .22, fy = oy + dsz * .1; g.fillStyle = alColor(t.bot.al); g.fillRect(fx, fy, ts * .06, ts * .5); g.fillRect(fx + ts * .06, fy, ts * .3, ts * .2);
      if (t.bot.shieldUntil > Date.now()) { g.save(); g.strokeStyle = 'rgba(200,235,255,.75)'; g.fillStyle = 'rgba(200,235,255,.14)'; g.lineWidth = 1; g.beginPath(); g.ellipse(cxp, cyp - hh * .2, ts * 1.15, ts * 1.05, 0, Math.PI, 0); g.lineTo(cxp + ts * 1.15, cyp - hh * .2); g.ellipse(cxp, cyp - hh * .2, ts * 1.15, ts * .5, 0, 0, Math.PI); g.closePath(); g.fill(); g.stroke(); for (let k = -2; k <= 2; k++) { g.beginPath(); g.ellipse(cxp, cyp - hh * .2, ts * 1.15 * Math.abs(k) / 3 + .01, ts * 1.05, 0, Math.PI, 0); g.stroke(); } g.restore(); }
      if (ts >= 18) { g.font = `600 ${clamp(Math.round(ts * .42), 10, 15)}px "Barlow Condensed",sans-serif`; const nm = t.bot.cmd, wv = g.measureText(nm).width + 10; g.fillStyle = 'rgba(10,13,14,.78)'; g.fillRect(cxp - wv / 2, cyp + hh * .75, wv, ts * .5); g.fillStyle = alColor(t.bot.al); g.fillText(nm, cxp, cyp + hh * .75 + ts * .26); } }
    const bx = cxp + ts * .5, by = cyp + hh * .5, bw = ts * .44;
    if (t.kind === 'node') { if (t.node.rich) { g.strokeStyle = `rgba(224,164,74,${.5 + pulse * .5})`; g.lineWidth = 2; g.beginPath(); diamond(g, cxp, cyp, ts, .88); g.stroke(); }
      if (detail) { g.fillStyle = 'rgba(10,13,14,.85)'; g.fillRect(bx - bw / 2, by - bw / 2, bw, bw); g.fillStyle = t.node.rich ? '#e0a44a' : '#e7e4da'; g.font = `700 ${Math.round(ts * .34)}px "Barlow Condensed",sans-serif`; g.fillText(String(t.node.grade), bx, by + 1); } else { g.fillStyle = '#e7e4da'; g.strokeStyle = 'rgba(10,13,14,.9)'; g.lineWidth = 3; g.font = `700 ${Math.round(ts * .6)}px "Barlow Condensed",sans-serif`; g.strokeText(String(t.node.grade), cxp, cyp); g.fillText(String(t.node.grade), cxp, cyp); } }
    if ((t.kind === 'monster' || t.kind === 'camp') && ts >= 16) { const w0 = ts * 1.3, x0b = cxp - w0 / 2, y0b = oy - 2; g.fillStyle = '#ff9a6a'; g.font = `700 ${clamp(Math.round(ts * .4), 10, 14)}px "Barlow Condensed",sans-serif`; g.textAlign = 'left'; g.strokeStyle = 'rgba(10,13,14,.9)'; g.lineWidth = 3; g.strokeText('Lv ' + t.grade, x0b, y0b - 6); g.fillText('Lv ' + t.grade, x0b, y0b - 6); g.textAlign = 'center'; g.fillStyle = 'rgba(10,13,14,.85)'; g.fillRect(x0b, y0b, w0, 4); g.fillStyle = '#d4443a'; g.fillRect(x0b, y0b, w0, 4); }
  }
  // marches and incoming
  MAP.marks = [];
  const bx = w2sx(S.base.x, S.base.y), by = w2sy(S.base.x, S.base.y);
  for (const m of foreign ? [] : S.marches) {
    if (m.kind === 'field') continue; const tx = w2sx(m.tx, m.ty), ty = w2sy(m.tx, m.ty); let f = 0, back = m.phase === 'back';
    if (m.phase === 'out') f = clamp((now - m.start) / (m.end - m.start), 0, 1); else if (back) f = 1 - clamp((now - m.start) / (m.end - m.start), 0, 1); else if (m.phase === 'wait') f = 0; else f = 1;
    const X = bx + (tx - bx) * f, Y = by + (ty - by) * f;
    g.strokeStyle = 'rgba(224,164,74,.55)'; g.lineWidth = 1.5; g.setLineDash([5, 5]); g.lineDashOffset = -now / 50 * (back ? -1 : 1); g.beginPath(); g.moveTo(bx, by); g.lineTo(tx, ty); g.stroke(); g.setLineDash([]);
    const ang = Math.atan2(ty - by, tx - bx) + (back ? Math.PI : 0); drawToken(g, X, Y, ang, ts, domClass(m.col), domTier(m.col, domClass(m.col)), false, now);
    MAP.marks.push({ id: m.id, x: X, y: Y });
  }
  for (const i of foreign ? [] : S.incoming) {
    const b = S.bots.find(b => b.al === i.bot); if (!b) continue; const sx0 = w2sx(b.x, b.y), sy0 = w2sy(b.x, b.y), f = clamp((now - i.start) / (i.end - i.start), 0, 1), X = sx0 + (bx - sx0) * f, Y = sy0 + (by - sy0) * f;
    g.strokeStyle = `rgba(212,101,74,${.4 + pulse * .5})`; g.lineWidth = i.rally ? 3 : 2; g.setLineDash([6, 4]); g.lineDashOffset = now / 40; g.beginPath(); g.moveTo(sx0, sy0); g.lineTo(bx, by); g.stroke(); g.setLineDash([]);
    const ang = Math.atan2(by - sy0, bx - sx0); drawToken(g, X, Y, ang, ts, ['inf', 'arm', 'air'][i.id % 3], i.rally ? 4 : 2, true, now, i.rally);
    g.strokeStyle = `rgba(212,101,74,${1 - pulse})`; g.lineWidth = 2; g.beginPath(); g.arc(X, Y, 10 + pulse * 10, 0, 7); g.stroke();
  }
  if (sel) { const sx = w2sx(sel.x, sel.y), sy = w2sy(sel.x, sel.y); g.strokeStyle = 'rgba(224,164,74,' + (.18 + pulse * .14) + ')'; g.lineWidth = 7; g.lineJoin = 'round'; g.beginPath(); diamond(g, sx, sy, ts, .96); g.stroke(); g.strokeStyle = '#e0a44a'; g.lineWidth = 2.5; g.beginPath(); diamond(g, sx, sy, ts, .96); g.stroke(); g.globalAlpha = .12 + pulse * .08; g.fillStyle = '#e0a44a'; g.beginPath(); diamond(g, sx, sy, ts); g.fill(); g.globalAlpha = 1; }
  // alliance tags: fade near the viewport edge and at low zoom
  g.font = `700 ${clamp(Math.round(ts * .55), 11, 22)}px "Barlow Condensed",sans-serif`; g.lineJoin = 'round'; g.lineWidth = 4; g.strokeStyle = 'rgba(10,13,14,.9)';
  for (const tg of MAP.hideTags || foreign ? [] : MAP.tags) { const px = w2sx(tg.x, tg.y), py = w2sy(tg.x, tg.y) - (Math.hypot(tg.x - S.base.x, tg.y - S.base.y) < 2.2 || S.bots.some(b => Math.hypot(tg.x - b.x, tg.y - b.y) < 2.2) ? ts * 1.5 : 0); const edge = Math.min(px, py, w - px, h - py); if (edge < -20) continue; const a = clamp(edge / 70, 0, 1) * (ts < 18 && tg.n < 40 ? 0 : 1); if (a <= 0.02) continue; g.globalAlpha = a; g.strokeText(tg.t, px, py); g.fillStyle = tg.c; g.fillText(tg.t, px, py); } g.globalAlpha = 1;
  // vignette is a static CSS overlay (#pg-map::after)
  hudUpdate(now);
  positionRadial();
}

/* DOM readouts only touch the page when their text changes; the minimap redraws when the view moved */
const HUD = { utc: '', coord: '', mk: '' };
function hudUpdate(now) {
  const u = document.getElementById('utc'); if (u) { const t = 'UTC ' + new Date().toISOString().slice(5, 19).replace('T', ' '); if (t !== HUD.utc) { HUD.utc = t; u.textContent = t; } }
  const cd = document.getElementById('coord'), fo = isForeign(), vk = viewK(), bx = S.base.x, by = S.base.y, dist = Math.hypot(MAP.cx - bx, MAP.cy - by);
  const km = fo ? 'HOME K' + kHome() : 'KM ' + Math.round(dist), xy = `K${vk} X:${Math.round(MAP.cx)} Y:${Math.round(MAP.cy)}`;
  if (!cd.firstChild) cd.innerHTML = '<button class="cmp" data-a="mhome" aria-label="Go to my base"><svg viewBox="0 0 24 24"><path d="M12 2.5l7 17-7-4.2-7 4.2z"/></svg><i></i></button><span class="km"></span><span class="xy"></span><button data-a="mgo" aria-label="Search coordinates">⌕</button>';
  const ang = Math.round(Math.atan2(w2sy(bx, by) - MAP.h / 2, w2sx(bx, by) - MAP.w / 2) * 90 / Math.PI) * 2 + 90, here = !fo && dist < .8, cm = cd.firstChild, st = (here ? 'h' : fo ? 'f' : ang) + '';
  if (cm.dataset.st !== st) { cm.dataset.st = st; cm.className = 'cmp' + (here ? ' here' : fo ? ' far' : ''); cm.firstChild.style.transform = 'rotate(' + ang + 'deg)'; }
  if (km + xy !== HUD.coord) { HUD.coord = km + xy; cd.children[1].textContent = km; cd.children[2].textContent = xy; }
  const pg = document.getElementById('pg-map'); if (pg.classList.contains('foreign') !== fo) pg.classList.toggle('foreign', fo);
  const mk = MAP.cx.toFixed(1) + MAP.cy.toFixed(1) + MAP.ts.toFixed(1) + S.incoming.length + (MAP.mini ? 1 : 0) + Math.floor(now / 500);
  if (mk !== HUD.mk) { HUD.mk = mk; drawMini(); }
}
/* build the small sprite set during idle time after boot so the first pan or zoom never pays for it */
function prewarmArt() {
  const jobs = []; for (const b of ['wild', 'forest', 'plaza']) for (let v = 0; v < 8; v++) jobs.push(() => terrainSprite(b, v));
  for (const c of ['inf', 'arm', 'air']) for (let t = 1; t <= 4; t++) for (const h of [false, true]) jobs.push(() => marchToken(c, t, h));
  for (const k of ['food', 'oil', 'energy', 'steel']) jobs.push(() => FEAT[k](1)); jobs.push(() => FEAT.monster(1), () => FEAT.camp(), () => FEAT.base(1), () => FEAT.citadel());
  const idle = window.requestIdleCallback || (f => setTimeout(() => f({ timeRemaining: () => 8 }), 30));
  const run = dl => { while (jobs.length && dl.timeRemaining() > 4) { try { jobs.shift()(); } catch (e) { } } if (jobs.length) idle(run); }; idle(run);
}
/* ---------------- gestures ---------------- */
function zoomAt(px, py, ts) { const [wx, wy] = s2w(px, py); MAP.ts = clamp(ts, TS_MIN, TS_MAX); const [a, b] = sd2w(px - MAP.w / 2, py - MAP.h / 2); MAP.cx = wx - a; MAP.cy = wy - b; clampView(); }
function initMap() {
  new ResizeObserver(resizeMap).observe(cv); resizeMap(); prewarmArt(); MAP.cx = S.view.x; MAP.cy = S.view.y;
  cv.addEventListener('pointerdown', e => {
    cv.setPointerCapture(e.pointerId); const r = cv.getBoundingClientRect(); MAP.ptr.set(e.pointerId, { x: e.clientX - r.left, y: e.clientY - r.top }); MAP.vx = MAP.vy = 0; MAP.active = true; closeRadial();
    if (MAP.ptr.size === 1) { const p = MAP.ptr.get(e.pointerId); MAP.drag = { x: p.x, y: p.y, cx: MAP.cx, cy: MAP.cy, moved: false, s: [{ t: e.timeStamp, x: p.x, y: p.y }] }; MAP.moved = false; }
    else if (MAP.ptr.size === 2) { const [a, b] = [...MAP.ptr.values()]; MAP.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), ts: MAP.ts }; MAP.drag = null; MAP.moved = true; MAP.zooming = true; }
  });
  cv.addEventListener('pointermove', e => {
    const p = MAP.ptr.get(e.pointerId); if (!p) return; const r = cv.getBoundingClientRect(); p.x = e.clientX - r.left; p.y = e.clientY - r.top;
    if (MAP.pinch && MAP.ptr.size >= 2) { const [a, b] = [...MAP.ptr.values()], d = Math.hypot(a.x - b.x, a.y - b.y); zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, MAP.pinch.ts * d / MAP.pinch.d); return; }
    const d = MAP.drag; if (!d) return; const dx = p.x - d.x, dy = p.y - d.y; if (!d.moved && Math.abs(dx) + Math.abs(dy) > 7) { d.moved = true; MAP.moved = true; }
    if (d.moved) { const [a, b] = sd2w(dx, dy); MAP.cx = d.cx - a; MAP.cy = d.cy - b; clampView(); d.s.push({ t: e.timeStamp, x: p.x, y: p.y }); while (d.s.length > 2 && e.timeStamp - d.s[0].t > 100) d.s.shift(); }
  });
  const up = e => {
    const p = MAP.ptr.get(e.pointerId); MAP.ptr.delete(e.pointerId); const d = MAP.drag;
    if (MAP.ptr.size < 2) { MAP.pinch = null; MAP.zooming = false; }
    if (!d || MAP.ptr.size > 0) { if (!MAP.ptr.size) MAP.active = false; return; }
    MAP.drag = null;
    if (!d.moved) { MAP.active = false; if (p) mapTap(p.x, p.y); return; }
    const a = d.s[0], b = d.s[d.s.length - 1], dt = b.t - a.t;
    if (dt > 0 && dt < 160) { const vx = (b.x - a.x) / dt, vy = (b.y - a.y) / dt; { const [a, b] = sd2w(vx, vy); MAP.vx = -a; MAP.vy = -b; } if (Math.hypot(vx, vy) < 0.08) { MAP.vx = MAP.vy = 0; MAP.active = false; } } else MAP.active = false;
    S.view = { x: MAP.cx, y: MAP.cy };
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', e => { MAP.ptr.delete(e.pointerId); MAP.drag = null; MAP.pinch = null; MAP.zooming = false; MAP.active = false; });
  cv.addEventListener('wheel', e => { e.preventDefault(); const r = cv.getBoundingClientRect(); zoomAt(e.clientX - r.left, e.clientY - r.top, MAP.ts * Math.exp(-e.deltaY * .0015)); }, { passive: false });
  mini.addEventListener('click', e => { const r = mini.getBoundingClientRect(); panTo((e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H); });
  document.getElementById('compass').innerHTML = `<div class="mbar">${[['World', 'mworld', 'M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z'], ['Mark', 'mmark', 'M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11zM12 8v4'], ['Territory', 'mterr', 'M4 6l8-3 8 3v6l-8 9-8-9z'], ['Off', 'moff', 'M5 21V4M5 5h13l-3 4 3 4H5']].map(([n, a, ic]) => `<button data-a="${a}" class="mb"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${ic}"/></svg><span>${n}</span></button>`).join('')}</div><div class="utc" id="utc"></div>`;
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
  const [wx, wy] = s2w(px, py), x = Math.round(wx), y = Math.round(wy); if (x < 0 || y < 0 || x >= W || y >= H) return;
  if (isForeign() && !['wild', 'forest'].includes(tileInfo(x, y).kind)) { toast('Scouting kingdom ' + viewK() + '. Tap open ground to teleport.'); return; }
  selectTile(x, y);
}
function selectTile(x, y) { UI.sel = { x, y }; UI.sheet = null; UI.drawer = null; openRadial({ type: 'tile', x, y }); D(); }
function radialItems(r) {
  if (r.type === 'march') { const m = S.marches.find(x => x.id === r.id); if (!m) return []; const it = [{ l: m.phase === 'stay' || m.phase === 'hold' ? 'Withdraw' : 'Recall', a: 'recall', d: { id: m.id }, c: 'bad', ic: 'march' }]; if (m.phase !== 'stay' && m.phase !== 'back' && !(m.kind === 'rally' && m.phase !== 'wait')) it.push({ l: 'Rush ' + rushCost(m.end) + '◆', a: 'rush', d: { id: m.id }, ic: 'dia' }, { l: 'Slip', a: 'slip', d: { id: m.id }, ic: 'train' }); it.push({ l: 'Columns', a: 'drawer', d: { id: 'march', tab: 'cols' }, ic: 'march' }); return it; }
  const t = tileInfo(r.x, r.y), it = [], d = { x: r.x, y: r.y };
  if (isForeign()) return [{ l: 'Teleport', a: 'tp', d, c: 'pri', ic: 'map' }, { l: 'Details', a: 'details', d, ic: 'vault' }];
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
  if (r.type === 'tile') { sx = w2sx(r.x, r.y); sy = w2sy(r.x, r.y) - MAP.ts * .3; } else { sx = r.sx; sy = r.sy; }
  const pk = sx + ',' + sy + ',' + r.items.length; if (r.pk === pk) return; r.pk = pk;
  const n = r.items.length, rad = 66, down = sy < rad + 60, mid = down ? 90 : -90, span = Math.min(180, 50 * (n - 1) + 20);
  el.style.left = sx + 'px'; el.style.top = sy + 'px';
  [...el.children].forEach((b, i) => { let a = (n === 1 ? mid : mid - span / 2 + span * i / (n - 1)) * Math.PI / 180; let x = Math.cos(a) * rad, y = Math.sin(a) * rad; const ax = sx + x; if (ax < 34) x += 34 - ax; if (ax > MAP.w - 34) x -= ax - (MAP.w - 34); b.style.transform = `translate(${x - 26}px,${y - 26}px)`; });
}
function closeRadial() { MAP.radial = null; const el = document.getElementById('radial'); el.className = ''; el.innerHTML = ''; }
