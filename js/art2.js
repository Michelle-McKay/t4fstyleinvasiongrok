'use strict';
/* IRON MARCH — building art v2: shaded 2.5D vector toolkit. Replaces bldSVG/ccSVG from art.js.
   64x64 viewBox, light from upper left, five material tiers (scrap, concrete, reinforced, tech, fortified). */
const MAT = [null,
  { f: '#8a8a6e', s: '#5e5e46', t: '#a09c76', trim: '#6a4a2a', win: '#d9c47a', roof: '#5b6b43', dark: '#2a2a20' },
  { f: '#b0b6b7', s: '#7c8385', t: '#cfd4d4', trim: '#5c676d', win: '#e2d29a', roof: '#6b747a', dark: '#2a3237' },
  { f: '#9aa7ad', s: '#66737a', t: '#bccad0', trim: '#e0a44a', win: '#8adbe8', roof: '#4a555c', dark: '#22292e' },
  { f: '#6c7d86', s: '#445158', t: '#8ea0ab', trim: '#e0a44a', win: '#5ec4d4', roof: '#2f3a41', dark: '#171c1f' },
  { f: '#4c5a62', s: '#2d383e', t: '#65777f', trim: '#f0b95a', win: '#9ff0fb', roof: '#1e262b', dark: '#0e1113' }];
const KI = '#0e1113', BR = '#e0a44a', ICE = '#5ec4d4', RED = '#d4654a', GRN = '#8ea36a';
const P = (pts, fill, st, sw) => `<polygon points="${pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" fill="${fill}"${st ? ` stroke="${st}" stroke-width="${sw || .6}" stroke-linejoin="round"` : ''}/>`;
const RC = (x, y, w, h, fill, st, sw, rx) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${st ? ` stroke="${st}" stroke-width="${sw || .6}"` : ''}${rx ? ` rx="${rx}"` : ''}/>`;
const CI = (x, y, r, fill, extra) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra || ''}/>`;
const EL = (x, y, rx, ry, fill, extra) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra || ''}/>`;
const LN = (x1, y1, x2, y2, c, w, extra) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${c}" stroke-width="${w || 1}" stroke-linecap="round" ${extra || ''}/>`;
/* roofs: pitched, barrel vault, dome, rooftop gear */
function roofFill(m, t) { return t <= 1 ? '#56683f' : t === 2 ? '#7a848a' : t === 3 ? '#4a565d' : t === 4 ? '#2b3a44' : '#1a2126'; }
function gableRoof(x, y, w, d, rh, m, t, ridgeCol) {
  const dx = d * .75, dy = d * .42, ax = x + w / 2, ay = y - rh, c = roofFill(m, t);
  let s = P([[x - 1, y + .6], [ax, ay], [ax + dx, ay - dy], [x - 1 + dx, y - dy + .6]], c, KI, .5) + P([[x - 1, y + .6], [ax, ay], [ax + dx, ay - dy], [x - 1 + dx, y - dy + .6]], 'url(#gT)');
  s += P([[ax, ay], [x + w + 1, y + .6], [x + w + 1 + dx, y - dy + .6], [ax + dx, ay - dy]], c, KI, .5) + P([[ax, ay], [x + w + 1, y + .6], [x + w + 1 + dx, y - dy + .6], [ax + dx, ay - dy]], 'url(#gS)');
  for (let i = 1; i < 6; i++) { const f = i / 6; s += LN(x - 1 + (ax - x + 1) * f + dx * 0, y + .6 + (ay - y - .6) * f, x - 1 + (ax - x + 1) * f + dx, y + .6 + (ay - y - .6) * f - dy, 'rgba(0,0,0,.2)', .4); }
  s += LN(ax, ay, ax + dx, ay - dy, ridgeCol || (t >= 3 ? BR : '#9aa4a8'), 1);
  s += P([[x + w / 2 - w * .32, y + .6 - 1], [ax, ay + 1.6], [x + w / 2 + w * .32, y + .6 - 1]], m.f, null) ;
  return s;
}
function vaultRoof(x, yb, w, h, d, m, t) {
  const dx = d * .75, dy = d * .42, r = w / 2, c = roofFill(m, t), y = yb - h;
  let s = `<path d="M${x} ${y} A${r} ${Math.min(r, h * .9)} 0 0 1 ${x + w} ${y} L${x + w + dx} ${y - dy} A${r} ${Math.min(r, h * .9)} 0 0 0 ${x + dx} ${y - dy}Z" fill="${c}" stroke="${KI}" stroke-width=".5"/>`;
  s += `<path d="M${x} ${y} A${r} ${Math.min(r, h * .9)} 0 0 1 ${x + w} ${y} L${x + w + dx} ${y - dy} A${r} ${Math.min(r, h * .9)} 0 0 0 ${x + dx} ${y - dy}Z" fill="url(#gCyl)"/>`;
  for (let i = 1; i < 6; i++) { const f = i / 6, ang = Math.PI * f, px = x + r - Math.cos(ang) * r, py = y - Math.sin(ang) * Math.min(r, h * .9); s += LN(px, py, px + dx, py - dy, 'rgba(0,0,0,.22)', .4); }
  s += `<path d="M${x} ${y} A${r} ${Math.min(r, h * .9)} 0 0 1 ${x + w} ${y} Z" fill="${m.f}" stroke="${KI}" stroke-width=".5"/><path d="M${x} ${y} A${r} ${Math.min(r, h * .9)} 0 0 1 ${x + w} ${y} Z" fill="url(#gF)"/>`;
  return s;
}
const dome = (cx, cy, r, base, hl) => `<path d="M${cx - r} ${cy}A${r} ${r * .95} 0 0 1 ${cx + r} ${cy}Z" fill="${base || '#c9d0d2'}" stroke="${KI}" stroke-width=".6"/><path d="M${cx - r} ${cy}A${r} ${r * .95} 0 0 1 ${cx + r} ${cy}Z" fill="url(#gCyl)"/><ellipse cx="${cx - r * .35}" cy="${cy - r * .55}" rx="${r * .28}" ry="${r * .14}" fill="rgba(255,255,255,.55)" transform="rotate(-25 ${cx - r * .35} ${cy - r * .55})"/><path d="M${cx - r} ${cy}h${2 * r}" stroke="${hl || '#5c676d'}" stroke-width="1.4"/>`;
function roofGear(x, y, w, d, t, seed) {
  const r = srand(seed || 7), dx = d * .75, dy = d * .42; let s = '';
  for (let i = 0; i < Math.max(1, Math.floor(w / 12)); i++) { const px = x + 3 + r() * (w - 9) + dx * .35, py = y - dy * .5 - r() * 1.2; s += RC(px, py - 2.4, 3.6, 2.4, '#8a949a', KI, .4, .3) + RC(px, py - 2.4, 3.6, .8, 'rgba(255,255,255,.4)') + LN(px + .6, py - 1.4, px + 3, py - 1.4, 'rgba(0,0,0,.35)', .4); }
  if (t >= 2) s += CI(x + w * .3 + dx * .4, y - dy * .6 - 1, 1.2, '#b8c0c3', `stroke="${KI}" stroke-width=".3"`);
  return s;
}
/* shaded box: (x, yb) is the front-bottom-left corner. Chamfered, panelled, with cornice, plinth and cast shadow. */
function box(x, yb, w, h, d, m, o) {
  o = o || {}; const dx = d * 0.75, dy = d * 0.42, y = yb - h, cr = Math.min(1.4, h / 7, w / 7);
  let s = `<path d="M${x + 2} ${yb} L${x + w + dx + 6} ${yb - dy + 3} L${x + w + dx + 6} ${yb + 2.4} L${x + 2} ${yb + 2.4}Z" fill="rgba(0,0,0,.32)" filter="url(#fBlur)"/>`;
  const side = [[x + w, y], [x + w + dx, y - dy], [x + w + dx, yb - dy], [x + w, yb]];
  s += P(side, o.s || m.s, KI, .5) + P(side, 'url(#gS)');
  for (let i = 1; i < 3; i++) s += LN(x + w + dx * i / 3, y - dy * i / 3 + 1, x + w + dx * i / 3, yb - dy * i / 3 - 1, 'rgba(0,0,0,.22)', .5);
  s += RC(x, y, w, h, o.f || m.f, KI, .5, cr) + RC(x, y, w, h, 'url(#gF)', null, 0, cr);
  for (let yy = y + 5; yy < yb - 3; yy += 5) s += LN(x + .8, yy, x + w - .8, yy, 'rgba(0,0,0,.11)', .4) + LN(x + .8, yy + .5, x + w - .8, yy + .5, 'rgba(255,255,255,.08)', .4);
  s += LN(x + .7, y + 1.4, x + .7, yb - 1, 'rgba(255,255,255,.28)', .7);
  s += RC(x - .5, yb - 1.8, w + 1, 1.8, 'rgba(0,0,0,.35)') + RC(x, yb - 4, w, 3, 'url(#gAO)');
  const tt = m === MAT[1] ? 1 : m === MAT[2] ? 2 : m === MAT[3] ? 3 : m === MAT[4] ? 4 : 5;
  if (o.roof === 'gable') return s + gableRoof(x, y, w, d, o.rh || Math.max(5, w * .22), m, tt, o.ridge);
  if (o.roof === 'vault') return s + vaultRoof(x, yb - h + 0, w, Math.min(h * .7, 9), d, m, tt);
  const top = [[x, y], [x + dx, y - dy], [x + w + dx, y - dy], [x + w, y]];
  s += P(top, o.t || m.t, KI, .5) + P(top, 'url(#gT)') + P([[x + 1.2, y - .3], [x + dx + .6, y - dy + .5], [x + w + dx - 1.2, y - dy + .5], [x + w - 1, y - .3]], 'none', 'rgba(0,0,0,.18)', .5);
  s += RC(x - .8, y - 1.5, w + 1.6, 2, o.trim || m.trim, KI, .4, .6) + RC(x - .8, y + .4, w + 1.6, .9, 'rgba(0,0,0,.35)');
  if (o.gear !== false && w > 14) s += roofGear(x, y, w, d, tt, Math.floor(x * 7 + w));
  return s;
}
const wins = (x, y, cols, rows, m, cw, ch, gx, gy, lit) => { let s = ''; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const X = x + c * (cw + gx), Y = y + r * (ch + gy); s += RC(X - .4, Y - .4, cw + .8, ch + .8, '#161b1e', null, 0, .5) + RC(X, Y, cw, ch, m.win, null, 0, .4) + RC(X, Y, cw, ch, 'url(#gGlass)', null, 0, .4) + LN(X + .5, Y + ch - .6, X + cw * .55, Y + .5, 'rgba(255,255,255,.4)', .5) + (lit ? RC(X, Y, cw, ch, m.win, null, 0, .4).replace('<rect', '<rect class="glw" opacity=".55"') : ''); } return s; };
const door = (x, yb, w, h) => RC(x - .6, yb - h - .6, w + 1.2, h + .6, '#2a3237', KI, .4, .5) + RC(x, yb - h, w, h, '#0c1012', KI, .3, .4) + RC(x + w / 2 - .3, yb - h, .6, h, 'rgba(255,255,255,.1)') + RC(x + .5, yb - h + .5, w - 1, 1.2, 'rgba(255,255,255,.14)');
const sandbags = (x, y, n) => Array.from({ length: n }, (_, i) => EL(x + i * 4.6 + (Math.floor(i / 4) % 2) * 2, y - Math.floor(i / 4) * 2.6, 3, 1.9, i % 2 ? '#a89466' : '#9a875c', `stroke="${KI}" stroke-width=".5"`)).join('');
const crate = (x, yb, s, c) => RC(x, yb - s, s, s, c || '#8a6a3a', KI, .5) + LN(x, yb - s, x + s, yb, 'rgba(0,0,0,.35)', .6) + LN(x + s, yb - s, x, yb, 'rgba(0,0,0,.35)', .6) + RC(x, yb - s, s, 1, 'rgba(255,255,255,.25)');
const barrel = (x, yb, c) => RC(x - 2.2, yb - 5, 4.4, 5, c || '#b8613d', KI, .5, 1) + EL(x, yb - 5, 2.2, .9, '#d2805a', `stroke="${KI}" stroke-width=".4"`) + LN(x - 2.2, yb - 3.4, x + 2.2, yb - 3.4, 'rgba(0,0,0,.35)', .5);
const mast = (x, yb, h, m, lit) => LN(x, yb, x, yb - h, '#b8c0c3', 1.2) + LN(x - 2, yb - h * .4, x + 2, yb - h * .4, '#b8c0c3', .8) + CI(x, yb - h, 1.5, lit ? RED : '#8a7a55', lit ? 'class="blink"' : '');
const flag = (x, yb, h, c) => LN(x, yb, x, yb - h, '#b8c0c3', 1) + P([[x, yb - h], [x + 8, yb - h + 2.2], [x, yb - h + 4.6]], c || RED, KI, .4);
const dish = (x, y, r, m, spin) => `<g ${spin ? `class="spin" style="transform-origin:${x}px ${y}px"` : ''}>${P([[x - r, y], [x, y - r * .8], [x + r, y]], '#c9d0d2', KI, .5)}<path d="M${x - r} ${y}Q${x} ${y + r * .9} ${x + r} ${y}Z" fill="#9aa4a8" stroke="${KI}" stroke-width=".5"/>${LN(x, y, x + r * .6, y - r * 1.1, '#e7e4da', .8)}</g>`;
const glow = (x, y, r, id) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${id || 'gGA'})" class="glw"/>`;
const light = (x, y, c) => CI(x, y, 1.3, c || '#ffe9a8', 'class="glw"') + CI(x, y, 3, 'rgba(255,233,168,.25)', 'class="glw"');
function pad(t, outer) {
  let s = `<ellipse cx="32" cy="57" rx="30" ry="5.4" fill="rgba(0,0,0,.4)" filter="url(#fBlur)"/>`; const r = srand(t * 977 + (outer ? 5 : 11));
  const shape = outer ? [[3, 20], [61, 20], [63, 58], [1, 58]] : [[3, 18], [61, 18], [63, 58], [1, 58]];
  if (outer) {
    s += P(shape, '#3b3421', KI, .8) + P(shape, 'url(#gT)');
    for (let i = 0; i < 5; i++) s += LN(3 - i * .4, 26 + i * 8, 61 + i * .4, 26 + i * 8, 'rgba(0,0,0,.26)', 1.6) + LN(3 - i * .4, 27 + i * 8, 61 + i * .4, 27 + i * 8, 'rgba(255,240,200,.05)', .8);
    for (let i = 0; i < 26; i++) s += CI(4 + r() * 56, 22 + r() * 36, .5 + r() * .7, r() < .5 ? 'rgba(255,240,200,.07)' : 'rgba(0,0,0,.2)');
    for (const [gx, gy] of [[5, 58], [14, 59], [50, 59], [59, 57]]) s += `<path d="M${gx} ${gy}l-1-4M${gx} ${gy}l.4-5M${gx} ${gy}l1.6-3.6" stroke="#4a6a34" stroke-width=".9" stroke-linecap="round"/>`;
    if (t >= 3) s += P(shape, 'none', '#4c5a62', 1.4);
    return s;
  }
  s += P(shape, t <= 1 ? '#3b3a33' : t === 2 ? '#464d51' : t === 3 ? '#404a4f' : '#2d363b', KI, .8) + P(shape, 'url(#gT)');
  for (let i = 0; i < 34; i++) s += CI(4 + r() * 56, 20 + r() * 38, .4 + r() * .8, r() < .5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.22)');
  if (t <= 1) s += `<path d="M6 55l8-3 6 2 9-2" stroke="rgba(0,0,0,.4)" fill="none" stroke-width="1"/>` + P([[8, 22], [15, 21], [17, 26], [9, 27]], '#4a4638') + P([[44, 50], [52, 49], [53, 54], [45, 55]], '#4a4638') + `<path d="M4 58l-1-4M6 58l.4-5M8 58l1.6-3" stroke="#5a7a3a" stroke-width=".9" stroke-linecap="round"/>`;
  else {
    s += LN(32, 18, 32, 58, 'rgba(255,255,255,.06)', .8) + LN(3, 38, 62, 38, 'rgba(255,255,255,.06)', .8) + P([[3, 55], [61, 55], [63, 58], [1, 58]], t >= 3 ? '#5a666d' : '#5c666a', KI, .5) + LN(3, 55, 61, 55, 'rgba(255,255,255,.25)', .6);
    if (t >= 3) s += `<path d="M5 56.6h54" stroke="${BR}" stroke-width="1" stroke-dasharray="4 3" opacity=".7"/>`;
    s += CI(56, 24, 1.6, 'rgba(0,0,0,.4)', 'stroke="rgba(255,255,255,.12)" stroke-width=".4"') + CI(8, 50, 1.4, 'rgba(0,0,0,.35)');
    if (t >= 5) s += [[5, 20], [59, 20], [3, 56], [61, 56]].map(([x, y]) => CI(x, y, 1.6, BR) + CI(x, y, .6, '#fff3c0')).join('');
  }
  return s;
}
const svgWrap = (inner, cls) => `<svg viewBox="0 0 64 64" class="bsvg ${cls || ''}" aria-hidden="true">${inner}</svg>`;

/* ---------------- rural ---------------- */
function drawRations(t, L) {
  const m = MAT[t]; let s = pad(t, true);
  const rows = (n, y0, hgt, col) => Array.from({ length: n }, (_, r) => { const y = y0 + r * hgt; return P([[6 - r * .2, y], [40 + r * .4, y], [42 + r * .4, y + hgt - 1.6], [4 - r * .2, y + hgt - 1.6]], '#2a2412', null) + Array.from({ length: 12 }, (_, k) => { const x = 8 + k * 2.9 + r * .3; return LN(x, y + hgt - 2, x, y + 1, col || GRN, 1.3) + CI(x, y + .6, 1, t >= 3 ? '#e7d27a' : '#d9c48a'); }).join(''); }).join('');
  if (t === 1) { s += rows(3, 22, 8) + LN(3, 21, 41, 21, '#7a5a2a', 1.2) + Array.from({ length: 8 }, (_, i) => LN(3 + i * 5, 21, 3 + i * 5, 25, '#7a5a2a', 1.4)).join('') + `<g>${LN(50, 44, 50, 30, '#7a5a2a', 1.6)}${LN(45, 34, 55, 34, '#7a5a2a', 1.6)}${CI(50, 29, 3, '#d9c48a', `stroke="${KI}" stroke-width=".5"`)}${P([[45, 34], [55, 34], [53, 42], [47, 42]], '#6b5a3a', KI, .4)}</g>` + barrel(56, 54, '#3f6f8c') + crate(46, 56, 6); }
  else if (t === 2) s += rows(3, 22, 8) + box(44, 54, 15, 13, 8, m) + P([[42, 41], [51.5, 33], [61, 41]], m.roof, KI, .5) + door(49, 54, 5, 7) + `<path d="M46 37h11" stroke="${m.trim}" stroke-width="1"/>` + barrel(40, 56, '#3f6f8c');
  else if (t === 3) s += rows(3, 22, 7.5) + box(46, 54, 10, 14, 6, m) + P([[46, 40], [51, 35], [56, 40]], m.roof, KI, .5) + `<rect x="47" y="24" width="8" height="16" fill="#b8c0c3" stroke="${KI}" stroke-width=".5"/><ellipse cx="51" cy="24" rx="4" ry="1.6" fill="#d8dfe1" stroke="${KI}" stroke-width=".5"/>` + RC(47, 28, 8, 1, 'rgba(0,0,0,.25)') + RC(47, 33, 8, 1, 'rgba(0,0,0,.25)') + P([[8, 56], [22, 56], [24, 60], [6, 60]], '#2b3236') + RC(10, 50, 9, 5, '#b8412a', KI, .4) + CI(11.5, 56, 2.2, KI) + CI(17.5, 56, 2.2, KI);
  else { const g = (x, y, w) => `<path d="M${x} ${y}q${w / 2} -10 ${w} 0v9h-${w}z" fill="rgba(140,230,190,.32)" stroke="${t >= 5 ? BR : '#cfe5e0'}" stroke-width="1"/>${Array.from({ length: 3 }, (_, i) => LN(x + 2 + i * (w - 4) / 2, y + 8, x + 2 + i * (w - 4) / 2, y - 2, GRN, 2)).join('')}${LN(x + w / 2, y - 5, x + w / 2, y + 9, '#cfe5e0', .7)}`; s += g(4, 32, 26) + g(4, 44, 26) + g(34, 32, 24) + `<rect x="36" y="46" width="22" height="10" fill="${m.f}" stroke="${KI}" stroke-width=".5"/>${wins(38, 48, 4, 1, m, 3.5, 3, 1.5, 0, 1)}${P([[36, 46], [40, 42], [62, 42], [58, 46]], m.t, KI, .5)}${Array.from({ length: t >= 5 ? 3 : 2 }, (_, i) => `${RC(8 + i * 8, 21, 4, 10, '#dfe7e4', KI, .4)}${RC(8.6 + i * 8, 22, 2.8, 2, '#8ef0b0', null, 0, 0).replace('<rect', '<rect class="glw"')}${RC(8.6 + i * 8, 26, 2.8, 2, '#8ef0b0', null, 0, 0).replace('<rect', '<rect class="glw"')}`).join('')}${t >= 5 ? `${glow(50, 30, 12, 'gGG')}${CI(50, 30, 2.4, '#8ef0b0', 'class="glw"')}` : ''}`; }
  return s;
}
function drawFuel(t, L) {
  const m = MAT[t]; let s = pad(t, true); const tank = (cx, yb, r, h, c) => `${EL(cx, yb, r, r * .38, 'rgba(0,0,0,.4)')}<path d="M${cx - r} ${yb - h}v${h}a${r} ${r * .38} 0 0 0 ${r * 2} 0v-${h}z" fill="${c}" stroke="${KI}" stroke-width=".6"/><path d="M${cx - r} ${yb - h}v${h}a${r} ${r * .38} 0 0 0 ${r * 2} 0v-${h}z" fill="url(#gCyl)"/>${EL(cx, yb - h, r, r * .38, '#c9d0d2', `stroke="${KI}" stroke-width=".6"`)}${RC(cx - r, yb - h * .5, r * 2, 1, 'rgba(0,0,0,.3)')}`;
  if (t === 1) s += barrel(12, 50, '#b8613d') + barrel(18, 52, '#3f6f8c') + barrel(24, 50, '#b8613d') + barrel(15, 45, '#8a4a2a') + barrel(21, 46, '#b8613d') + LN(36, 52, 36, 34, '#4a3a2a', 2) + P([[30, 34], [42, 34], [40, 38], [32, 38]], '#4a3a2a', KI, .4) + LN(36, 38, 36, 52, '#222', 1) + `<path d="M36 44q8 0 10 8" stroke="#2b2b2b" fill="none" stroke-width="1.6"/>` + RC(44, 50, 12, 8, '#7a5a2a', KI, .5) + `<path d="M44 50l6-5 6 5" fill="#5b6b43" stroke="${KI}" stroke-width=".5"/>`;
  else if (t === 2) s += tank(16, 52, 8, 16, '#8a4a2a') + `<g class="pj">${LN(40, 52, 40, 32, '#4a5358', 2.4)}<path d="M32 30l16 4" stroke="#5c676d" stroke-width="2.4"/>${LN(48, 34, 48, 44, '#222', 1)}</g>` + RC(36, 50, 10, 6, '#3c474e', KI, .5) + barrel(54, 54);
  else if (t === 3) s += tank(14, 50, 8, 15, '#7a848a') + tank(30, 54, 8, 15, '#7a848a') + `<path d="M4 58h56" stroke="#3c474e" stroke-width="2.4"/><path d="M22 47v-6h14v9" stroke="#5c676d" fill="none" stroke-width="1.6"/>` + LN(48, 54, 48, 22, '#9aa4a8', 1.6) + P([[44, 30], [48, 22], [52, 30]], 'none', '#9aa4a8', 1.2) + LN(44, 38, 52, 38, '#9aa4a8', 1) + LN(43, 46, 53, 46, '#9aa4a8', 1) + CI(48, 21, 1.6, RED, 'class="blink"') + RC(44, 52, 8, 5, m.dark, KI, .4);
  else { s += tank(14, 54, 8, 18, m.f) + tank(30, 54, 8, 18, m.f) + `<rect x="44" y="14" width="7" height="40" fill="${m.s}" stroke="${KI}" stroke-width=".6"/>${RC(44, 14, 7, 40, 'url(#gCyl)')}${[22, 30, 38, 46].map(y => RC(43, y, 9, 1.4, '#c9d0d2', KI, .3)).join('')}${LN(44, 20, 30, 34, '#b8c0c3', 1.4)}${LN(22, 36, 22, 44, '#b8c0c3', 1.2)}<g class="flm"><path d="M47.5 14q-4-5 0-9 4 4 0 9z" fill="#ffb347"/><path d="M47.5 12q-2-3 0-6 2 3 0 6z" fill="#fff3c0"/></g>` + (t >= 5 ? `${RC(4, 56, 56, 2, BR)}${glow(47.5, 8, 12)}` : ''); }
  return s;
}
function drawPower(t, L) {
  const m = MAT[t]; let s = pad(t, true);
  const panel = (x, y, w, h, c) => `${P([[x + 3, y], [x + w + 3, y], [x + w, y + h], [x, y + h]], c || '#1d5670', KI, .5)}${P([[x + 3, y], [x + w + 3, y], [x + w, y + h], [x, y + h]], 'url(#gF)')}${LN(x + w / 2 + 1.5, y, x + w / 2, y + h, 'rgba(94,196,212,.6)', .6)}${LN(x + 1.5, y + h / 2, x + w + 1.5, y + h / 2, 'rgba(94,196,212,.6)', .6)}${LN(x + w * .3, y + 1, x + w * .55, y + 1, 'rgba(255,255,255,.5)', 1)}`;
  const turb = (x, yb, h, sc) => `${LN(x, yb, x, yb - h, '#e7e4da', 1.8 * sc)}<g class="spin" style="transform-origin:${x}px ${yb - h}px">${P([[x, yb - h], [x - 1.1 * sc, yb - h - 12 * sc], [x + 1.1 * sc, yb - h - 12 * sc]], '#f3f1ea', KI, .4)}${P([[x, yb - h], [x + 10 * sc, yb - h + 6 * sc], [x + 9 * sc, yb - h + 7.6 * sc]], '#f3f1ea', KI, .4)}${P([[x, yb - h], [x - 10 * sc, yb - h + 6 * sc], [x - 9 * sc, yb - h + 7.6 * sc]], '#f3f1ea', KI, .4)}</g>${CI(x, yb - h, 1.6, '#c9d0d2', `stroke="${KI}" stroke-width=".4"`)}`;
  if (t === 1) s += panel(6, 26, 12, 9, '#24506a') + panel(22, 26, 12, 9, '#24506a') + LN(12, 35, 12, 42, '#5c676d', 1.4) + LN(28, 35, 28, 42, '#5c676d', 1.4) + RC(38, 44, 10, 7, '#3c474e', KI, .5) + RC(40, 40, 6, 4, '#8a3a2a', KI, .4) + RC(46, 47, 12, 6, '#5b6b43', KI, .5) + LN(8, 50, 34, 50, '#222', 1);
  else if (t === 2) s += panel(5, 24, 13, 9) + panel(21, 24, 13, 9) + panel(5, 38, 13, 9) + panel(21, 38, 13, 9) + box(41, 54, 14, 12, 7, m) + P([[40, 42], [48, 37], [57, 42]], m.roof, KI, .5) + door(46, 54, 4, 6);
  else if (t === 3) s += panel(4, 30, 13, 9) + panel(20, 30, 13, 9) + panel(4, 44, 13, 9) + panel(20, 44, 13, 9) + turb(46, 54, 26, 1) + box(50, 56, 9, 8, 5, m);
  else { s += panel(4, 32, 14, 9, '#164a63') + panel(20, 32, 14, 9, '#164a63') + panel(4, 46, 14, 9, '#164a63') + panel(20, 46, 14, 9, '#164a63') + turb(44, 50, 28, 1) + turb(56, 48, 20, .8) + box(38, 58, 12, 9, 6, m, { trim: t >= 5 ? BR : null }) + wins(40, 51, 3, 1, m, 2.6, 2.4, 1.2, 0, 1); if (t >= 5) s += `${glow(48, 26, 14, 'gGI')}<path d="M38 22q10-6 20 0" stroke="${ICE}" stroke-width="1" fill="none" class="ping"/>`; }
  return s;
}
function drawAlloy(t, L) {
  const m = MAT[t]; let s = pad(t, true); const ingot = (x, y, c) => P([[x + 1.4, y], [x + 7, y], [x + 8.4, y + 3], [x, y + 3]], c || '#b8c0c3', KI, .4) + LN(x + 2, y + .7, x + 6, y + .7, 'rgba(255,255,255,.7)', .6);
  const smoke = x => `<circle class="smoke" cx="${x}" cy="12" r="4" fill="rgba(200,200,200,.3)"/><circle class="smoke" style="animation-delay:1s" cx="${x + 2}" cy="14" r="3" fill="rgba(200,200,200,.25)"/>`;
  if (t === 1) s += box(8, 50, 18, 13, 8, { f: '#6b5a4a', s: '#463a30', t: '#7d6a58' }) + P([[6, 37], [17, 29], [28, 37]], '#5b6b43', KI, .5) + RC(11, 42, 8, 8, '#e07a2f', KI, .5).replace('<rect', '<rect class="glw"') + LN(40, 52, 50, 52, '#222', 2) + RC(41, 46, 8, 6, '#3c474e', KI, .5) + EL(45, 46, 5, 1.6, '#5c676d', `stroke="${KI}" stroke-width=".4"`) + ingot(46, 54) + ingot(52, 56, '#9aa4a8') + `<path d="M14 29V18" stroke="#5c676d" stroke-width="3"/>` + smoke(14);
  else if (t === 2) s += box(6, 54, 26, 15, 9, m) + door(12, 54, 8, 8) + RC(24, 48, 5, 4, '#e07a2f', null, 0, 0).replace('<rect', '<rect class="glw"') + RC(38, 22, 7, 32, '#5c676d', KI, .6) + RC(38, 22, 7, 32, 'url(#gCyl)') + RC(37, 20, 9, 3, '#3c474e', KI, .5) + smoke(41) + ingot(48, 54) + ingot(48, 50, '#c9d0d2') + ingot(53, 54);
  else if (t === 3) s += box(4, 56, 30, 17, 10, m, { trim: m.trim }) + RC(9, 48, 10, 8, '#12171a', KI, .4) + RC(11, 51, 6, 4, '#ff8a3a', null, 0, 0).replace('<rect', '<rect class="glw"') + RC(40, 18, 8, 38, '#5c676d', KI, .6) + RC(40, 18, 8, 38, 'url(#gCyl)') + RC(39, 16, 10, 3, '#3c474e', KI, .5) + smoke(44) + `<path d="M4 20h34M6 20v8M34 20v8" stroke="#e0a44a" stroke-width="1.4"/><rect x="18" y="24" width="7" height="4" fill="#3c474e" stroke="${KI}" stroke-width=".4"/>` + ingot(52, 55) + ingot(52, 51, '#c9d0d2');
  else { s += box(3, 56, 34, 20, 11, m, { trim: t >= 5 ? BR : m.trim }) + RC(8, 46, 12, 10, '#12171a', KI, .4) + RC(9.5, 49, 9, 6, '#ff9a3a', null, 0, 0).replace('<rect', '<rect class="glw"') + wins(24, 40, 3, 1, m, 3.4, 3, 1.4, 0, 1) + [42, 51].map(x => RC(x, 14, 6, 42, '#4a5358', KI, .6) + RC(x, 14, 6, 42, 'url(#gCyl)') + RC(x - 1, 12, 8, 3, '#2f373c', KI, .5)).join('') + smoke(45) + smoke(54) + `<path d="M3 16h38M5 16v8M37 16v8" stroke="${BR}" stroke-width="1.6"/><path d="M20 16v10" stroke="#b8c0c3" stroke-width="1.2"/><rect x="17" y="26" width="6" height="4" fill="#ff9a3a" class="glw"/>` + ingot(54, 58) + ingot(54, 54, '#e7e4da') + ingot(48, 58, '#c9d0d2'); if (t >= 5) s += glow(20, 50, 16); }
  return s;
}
/* fallback wrappers so the rest of the game keeps working while urban art is built out below */
const RURAL_DRAW = { rations: drawRations, fuel: drawFuel, power: drawPower, alloy: drawAlloy };
