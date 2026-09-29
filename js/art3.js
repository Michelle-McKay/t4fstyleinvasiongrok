'use strict';
/* IRON MARCH — building art v2: dispatcher, urban buildings and the 25-level Command Center. */
const b2cache = {};
const oldBld = bldSVG;
bldSVG = function (kind, level) {
  if (kind === 'cc') return ccSVG(Math.max(1, level));
  const t = tierOf(level), ck = kind + ':' + t + ':' + (level >= 25 ? 1 : 0); if (b2cache[ck]) return b2cache[ck];
  const f = RURAL_DRAW[kind] || (typeof URBAN_DRAW !== 'undefined' && URBAN_DRAW[kind]);
  let out;
  if (!f) out = oldBld(kind, level);
  else { const tt = Math.max(1, t); out = svgWrap(f(tt, level) + (level >= 25 ? `<rect x="1" y="6" width="62" height="54" fill="none" stroke="${BR}" stroke-width="2" class="glw" rx="2"/>` : '')); }
  return (b2cache[ck] = out);
};

/* ---------------- urban helpers ---------------- */
const tent = (x, yb, w, h, c, d) => P([[x, yb], [x + w / 2, yb - h], [x + w / 2, yb]], c, KI, .5) + P([[x + w / 2, yb - h], [x + w, yb], [x + w / 2, yb]], d || 'rgba(0,0,0,.35)', KI, .5) + P([[x + w / 2, yb - h], [x + w, yb], [x + w / 2, yb]], 'rgba(0,0,0,.28)') + LN(x + w / 2, yb - h, x + w / 2, yb, 'rgba(0,0,0,.4)', .5) + RC(x + w / 2 - 2, yb - 4.4, 3.4, 4.4, '#12171a');
const truck = (x, yb, c) => RC(x, yb - 6, 11, 6, c || '#5b6b43', KI, .5) + P([[x + 11, yb - 6], [x + 15, yb - 6], [x + 16, yb - 3], [x + 16, yb], [x + 11, yb]], c || '#5b6b43', KI, .5) + RC(x + 12, yb - 5.4, 3, 2, '#9ad6e2') + CI(x + 3, yb, 1.8, KI) + CI(x + 12, yb, 1.8, KI) + RC(x, yb - 6, 11, 1, 'rgba(255,255,255,.25)');
const tank = (x, yb, m) => `${EL(x + 8, yb + 1, 9, 2, 'rgba(0,0,0,.4)')}${RC(x, yb - 4, 16, 4, m.dark === '#0e1113' ? '#26303a' : '#4a5a3a', KI, .5, 1.4)}${P([[x + 3, yb - 4], [x + 5, yb - 8], [x + 12, yb - 8], [x + 13, yb - 4]], '#5b6b43', KI, .5)}${LN(x + 12, yb - 6.4, x + 20, yb - 7.6, KI, 1.4)}${Array.from({ length: 4 }, (_, i) => CI(x + 2.5 + i * 3.6, yb - 1.4, 1.4, '#171c1f')).join('')}`;
const cross = (x, y, s, c) => `<path d="M${x - s / 3} ${y - s}h${2 * s / 3}v${s * 2 / 3}h${s * 2 / 3}v${2 * s / 3}h-${s * 2 / 3}v${s * 2 / 3}h-${2 * s / 3}v-${s * 2 / 3}h-${s * 2 / 3}v-${2 * s / 3}h${s * 2 / 3}z" fill="${c || RED}" stroke="#fff" stroke-width=".6"/>`;
const turret = (x, yb, m, big) => `${RC(x - 4, yb - 3, 8, 3, m.dark, KI, .5)}${P([[x - 3, yb - 3], [x - 2, yb - 6.4], [x + 2, yb - 6.4], [x + 3, yb - 3]], m.f, KI, .5)}${RC(x, yb - 5.4, big ? 10 : 8, 1.6, '#b8c0c3', KI, .4)}`;
const container = (x, yb, c) => RC(x, yb - 6, 12, 6, c, KI, .5) + [2, 4, 6, 8, 10].map(i => LN(x + i, yb - 6, x + i, yb, 'rgba(0,0,0,.3)', .5)).join('') + RC(x, yb - 6, 12, 1, 'rgba(255,255,255,.3)');
/* generic block: floors of windows, door, roof parapet */
function block(t, o) {
  const m = MAT[t], x = o.x == null ? 10 : o.x, w = o.w || 30, fl = o.floors || 1, yb = o.yb || 54, d = o.d || 9, h = fl * 9 + 3;
  let s = box(x, yb, w, h, d, m, { trim: t >= 3 ? m.trim : null, roof: o.roof, rh: o.rh });
  const cols = o.cols || Math.floor((w - 6) / 6);
  for (let f = 0; f < fl; f++) s += wins(x + 3, yb - h + 4 + f * 9 + (f === fl - 1 ? 0 : 0), cols, 1, m, 3.6, 3.2, 2.4, 0, t >= 3);
  if (o.door !== false) s += door(x + (o.doorX == null ? Math.floor(w / 2) - 3 : o.doorX), yb, 6, 7.4);
  return s;
}
const URBAN_DRAW = {
  embassy(t) {
    const m = MAT[t]; let s = pad(t, false);
    const bunting = (x1, x2, y) => `<path d="M${x1} ${y}Q${(x1 + x2) / 2} ${y + 4} ${x2} ${y}" fill="none" stroke="${BR}" stroke-width=".8" stroke-dasharray="2 1.6"/>`;
    const padH = (x, y) => EL(x, y, 8, 3, '#b8c0c3', `stroke="${KI}" stroke-width=".5"`) + `<text x="${x}" y="${y + 1.4}" font-size="4" text-anchor="middle" fill="#3a454c" font-family="sans-serif" font-weight="700">H</text>`;
    if (t === 1) s += tent(6, 46, 28, 20, '#e6e3d6', '#c9c5b3') + flag(38, 46, 28, GRN) + flag(44, 46, 24, BR) + padH(50, 54) + sandbags(8, 54, 6);
    else if (t === 2) s += block(t, { x: 6, w: 34, floors: 1, doorX: 14, roof: 'gable', rh: 6 }) + [44, 50].map((x, i) => flag(x, 56, 30 - i * 4, i ? BR : GRN)).join('') + padH(52, 58) + bunting(8, 38, 34);
    else if (t === 3) s += block(t, { x: 4, w: 36, floors: 2, doorX: 15, roof: 'gable', rh: 8, ridge: BR }) + [8, 14, 20, 26, 32].map(x => RC(x, 40, 2, 14, '#e8eaea', KI, .3)).join('') + [44, 50, 56].map((x, i) => flag(x, 57, 32 - i * 3, [GRN, BR, ICE][i])).join('') + padH(52, 60);
    else { s += block(t, { x: 4, w: 38, floors: 2, doorX: 16 }) + dome(23, 22, 8, '#c9d0d2', m.trim) + [8, 14, 20, 26, 32].map(x => RC(x, 40, 2, 14, '#e8eaea', KI, .3)).join('') + [46, 52, 58].map((x, i) => flag(x, 58, 34 - i * 3, [GRN, BR, ICE][i])).join('') + padH(52, 61) + `<path d="M4 22h38" stroke="${m.trim}" stroke-width="1"/>`; if (t >= 5) s += glow(23, 18, 14) + `<circle cx="52" cy="61" r="9" fill="none" stroke="${ICE}" stroke-width=".8" class="glw"/>`; }
    return s;
  },
  forge(t) {
    const m = MAT[t]; let s = pad(t, false);
    const stack = (x, yb, h) => RC(x, yb - h, 6, h, '#6c7d86', KI, .5) + RC(x, yb - h, 6, h, 'url(#gCyl)') + RC(x - 1, yb - h - 2, 8, 2.4, '#3c474e', KI, .4);
    const anvil = (x, yb) => P([[x, yb - 5], [x + 12, yb - 5], [x + 9, yb - 3], [x + 8, yb], [x + 4, yb], [x + 3, yb - 3]], '#4a555c', KI, .5) + RC(x + 1, yb - 6, 10, 1.4, '#b8c0c3') + CI(x + 6, yb - 8, 1.6, '#ffb84a', 'class="glw"');
    const furnace = (x, yb, w, h) => RC(x, yb - h, w, h, '#5a6a72', KI, .5) + RC(x, yb - h, w, h, 'url(#gF)') + RC(x + w / 2 - 4, yb - 6, 8, 5, '#12171a', KI, .4) + RC(x + w / 2 - 3, yb - 5, 6, 3.4, '#ff8a2a', null, 0, 0).replace('<rect', '<rect class="glw"');
    if (t === 1) s += furnace(8, 54, 18, 16) + stack(20, 38, 16) + anvil(32, 55) + crate(46, 55, 7, '#8a6a3a') + sandbags(8, 58, 4) + glow(17, 50, 8);
    else if (t === 2) s += block(t, { x: 6, w: 32, floors: 1, door: false, roof: 'gable', rh: 5 }) + furnace(10, 56, 12, 12) + stack(28, 38, 18) + anvil(44, 57) + crate(52, 47, 6, '#8a6a3a');
    else if (t === 3) s += block(t, { x: 4, w: 34, floors: 2, door: false }) + furnace(8, 56, 14, 12) + stack(30, 30, 22) + stack(40, 30, 18) + anvil(44, 58) + glow(15, 50, 8);
    else { s += block(t, { x: 4, w: 36, floors: 2, door: false }) + furnace(8, 58, 14, 14) + stack(30, 24, 24) + stack(40, 24, 20) + anvil(44, 59) + `<path d="M6 30h34" stroke="${BR}" stroke-width="1.2"/>` + `<path d="M22 24V30M18 30l4 4 4-4" stroke="#b8c0c3" stroke-width="1" fill="none"/>` + glow(15, 50, 10) + glow(33, 12, 6); if (t >= 5) s += RC(4, 30, 36, 1.4, BR) + CI(33, 12, 4, 'none', `stroke="${BR}" stroke-width=".8" class="glw"`); }
    return s;
  },
  mil(t) {
    const m = MAT[t]; let s = pad(t, false);
    if (t === 1) s += tent(6, 40, 16, 12, '#6b7a4a') + tent(22, 42, 16, 12, '#65744a') + tent(38, 40, 16, 12, '#6b7a4a') + sandbags(8, 52, 8) + truck(38, 56) + flag(58, 30, 16, RED);
    else if (t === 2) s += block(t, { x: 6, w: 34, floors: 1, doorX: 4, roof: 'gable', rh: 6 }) + truck(42, 56) + sandbags(8, 57, 5) + flag(56, 40, 16, RED);
    else if (t === 3) s += block(t, { x: 5, w: 32, floors: 2, doorX: 4, roof: 'gable', rh: 7 }) + RC(38, 44, 14, 12, '#2a3237', KI, .5) + RC(39, 46, 12, 10, '#12171a') + [47, 49, 51, 53].map(y => LN(39, y - 2, 51, y - 2, 'rgba(255,255,255,.12)', .5)).join('') + tank(40, 60, m) + mast(58, 46, 22, m, 1);
    else { s += block(t, { x: 4, w: 34, floors: 2, doorX: 4 }) + box(40, 56, 16, 12, 8, m, { trim: t >= 5 ? BR : m.trim }) + RC(42, 47, 12, 9, '#12171a') + tank(6, 60, m) + mast(58, 40, 24, m, 1) + `<path d="M40 40l8-6 8 6" fill="none" stroke="${BR}" stroke-width="1.2"/>`; if (t >= 5) s += `<circle cx="20" cy="26" r="5" fill="none" stroke="${BR}" stroke-width="1.2"/>${LN(18, 24, 18, 28, BR, 1)}${LN(22, 24, 22, 28, BR, 1)}${LN(18, 26, 22, 26, BR, 1)}` + glow(46, 24, 10); }
    return s;
  },
  depot(t) {
    const m = MAT[t]; let s = pad(t, false);
    if (t === 1) s += tent(8, 46, 26, 20, '#e6e3d6', '#c9c5b3') + cross(21, 36, 4, RED) + [0, 1, 2].map(i => RC(38 + i * 6, 54 - i, 5, 3, '#8a9b6a', KI, .4)).join('') + sandbags(8, 54, 6) + crate(50, 46, 5, '#cfd4d4');
    else if (t === 2) s += block(t, { x: 8, w: 32, floors: 1, roof: 'gable', rh: 6 }) + cross(24, 32, 5, RED) + crate(46, 56, 6, '#cfd4d4') + sandbags(8, 57, 5);
    else if (t === 3) s += block(t, { x: 4, w: 30, floors: 2 }) + cross(19, 32, 5, RED) + RC(38, 48, 18, 8, '#e8eaea', KI, .5) + RC(52, 44, 6, 12, '#e8eaea', KI, .5) + RC(38, 50, 18, 1.4, RED) + CI(42, 57, 2, KI) + CI(53, 57, 2, KI) + RC(54, 45, 3, 2.6, '#9ad6e2');
    else { s += block(t, { x: 4, w: 34, floors: 2 }) + box(40, 56, 18, 11, 8, m) + `<path d="M12 22h20v-4H12z" fill="${m.trim}"/>` + cross(21, 30, 6, RED) + cross(48, 44, 4, RED) + `<circle cx="48" cy="34" r="6" fill="none" stroke="${BR}" stroke-width="1" class="glw"/>` + mast(60, 38, 22, m, 1) + glow(21, 30, 12, 'gGI'); if (t >= 5) s += `<circle cx="21" cy="30" r="9" fill="none" stroke="${BR}" stroke-width="1.2" class="ping" style="transform-origin:21px 30px"/>`; }
    return s;
  },
  treasury(t) {
    const m = MAT[t]; let s = pad(t, false); const vaultDoor = (x, y, r) => `${CI(x, y, r, '#2a3237', `stroke="${BR}" stroke-width="1.4"`)}${CI(x, y, r * .7, '#3c474e', `stroke="${KI}" stroke-width=".6"`)}${CI(x, y, r * .2, BR)}${[0, 1, 2, 3].map(i => LN(x, y, x + Math.cos(i * 1.57 + .4) * r * .6, y + Math.sin(i * 1.57 + .4) * r * .6, '#b8c0c3', 1)).join('')}`;
    const gold = (x, y) => P([[x + 1.4, y], [x + 7, y], [x + 8.4, y + 3], [x, y + 3]], '#f0c25a', KI, .4) + LN(x + 2, y + .7, x + 6, y + .7, '#fff3c0', .6);
    if (t === 1) s += crate(10, 54, 9, '#7a5a2a') + crate(20, 54, 9, '#8a6a3a') + crate(15, 45, 9, '#7a5a2a') + RC(32, 42, 18, 12, '#4a5358', KI, .6) + RC(32, 42, 18, 12, 'url(#gF)') + vaultDoor(41, 48, 4) + P([[6, 36], [30, 36], [34, 44], [4, 44]], '#55663f', KI, .5) + sandbags(34, 58, 6);
    else if (t === 2) s += block(t, { x: 8, w: 34, floors: 1, door: false, roof: 'gable', rh: 5 }) + vaultDoor(25, 47, 6.4) + gold(46, 54) + gold(46, 50.4) + sandbags(8, 58, 5);
    else if (t === 3) s += block(t, { x: 6, w: 36, floors: 2, door: false, roof: 'gable', rh: 8, ridge: BR }) + [10, 18, 26, 34].map(x => RC(x, 34, 2.4, 20, '#cfd4d4', KI, .4)).join('') + vaultDoor(24, 48, 5.6) + gold(46, 55) + gold(50, 51.4);
    else { s += block(t, { x: 4, w: 38, floors: 2, door: false }) + vaultDoor(23, 47, 7.4) + box(44, 56, 14, 10, 7, m, { trim: BR }) + gold(46, 46) + gold(52, 46) + dome(14, 27, 6, '#5a6a72', BR) + dome(32, 27, 6, '#5a6a72', BR) + `<circle cx="23" cy="47" r="10" fill="none" stroke="${ICE}" stroke-width=".8" class="ping" style="transform-origin:23px 47px"/>`; if (t >= 5) s += glow(27, 24, 14) + [0, 1, 2].map(i => gold(6 + i * 8, 58)).join(''); }
    return s;
  },
  tech(t) {
    const m = MAT[t]; let s = pad(t, false);
    if (t === 1) s += tent(6, 40, 24, 18, '#6b7a4a') + crate(34, 54, 8, '#6a6a55') + RC(35, 41, 7, 5, '#12171a', KI, .4) + RC(36, 42, 5, 3, '#5ec4d4', null, 0, 0).replace('<rect', '<rect class="glw"') + RC(44, 46, 8, 8, '#6a6a55', KI, .4) + LN(52, 46, 52, 30, '#b8c0c3', 1.2) + dish(52, 32, 6, m, 1) + sandbags(6, 56, 4);
    else if (t === 2) s += block(t, { x: 6, w: 32, floors: 1, roof: 'gable', rh: 6 }) + dish(46, 38, 7, m, 1) + LN(46, 38, 46, 52, '#b8c0c3', 1.6) + RC(41, 52, 10, 4, m.dark, KI, .5) + sandbags(8, 57, 4);
    else if (t === 3) s += block(t, { x: 4, w: 34, floors: 2 }) + dome(22, 25, 9, '#dfe6e8', BR) + dish(46, 40, 7, m, 1) + LN(46, 40, 46, 52, '#b8c0c3', 1.6) + RC(41, 52, 10, 4, m.dark, KI, .5);
    else { s += block(t, { x: 4, w: 30, floors: 3, cols: 4 }) + box(38, 56, 16, 14, 8, m, { trim: m.trim }) + wins(40, 46, 3, 1, m, 3, 3, 1.6, 0, 1) + dish(20, 12, 6, m, 1) + dish(42, 34, 6, m, 1) + LN(42, 34, 42, 44, '#b8c0c3', 1.4) + `<circle cx="20" cy="12" r="9" fill="none" stroke="${ICE}" stroke-width=".7" class="ping" style="transform-origin:20px 12px"/>`; if (t >= 5) s += `<ellipse cx="46" cy="24" rx="9" ry="3" fill="none" stroke="${ICE}" stroke-width="1.2" class="glw"/><ellipse cx="46" cy="21" rx="6" ry="2" fill="none" stroke="${BR}" stroke-width="1" class="glw"/>` + glow(46, 22, 12, 'gGI'); }
    return s;
  },
  hall(t) {
    const m = MAT[t]; let s = pad(t, false);
    if (t === 1) s += tent(6, 34, 32, 22, '#6b7a4a') + RC(40, 44, 12, 6, '#8a6a3a', KI, .5) + RC(41, 45, 10, 4, '#d9c47a') + LN(43, 46, 49, 48, RED, .8) + flag(56, 30, 20, RED) + sandbags(6, 57, 8);
    else if (t === 2) s += block(t, { x: 6, w: 36, floors: 1, doorX: 15, roof: 'gable', rh: 7 }) + flag(50, 30, 22, RED) + RC(46, 47, 8, 4, '#8a6a3a', KI, .4) + sandbags(8, 58, 5);
    else if (t === 3) s += block(t, { x: 4, w: 38, floors: 2, doorX: 16, roof: 'gable', rh: 8, ridge: BR }) + [8, 40].map(x => RC(x, 29, 2.6, 24, '#cfd4d4', KI, .4)).join('') + [10, 38].map(x => P([[x, 24], [x + 5, 24], [x + 5, 34], [x + 2.5, 31], [x, 34]], RED, KI, .4)).join('') + flag(52, 30, 24, RED);
    else { s += block(t, { x: 4, w: 40, floors: 2, doorX: 17 }) + [10, 36].map(x => P([[x, 22], [x + 6, 22], [x + 6, 36], [x + 3, 32], [x, 36]], t >= 5 ? BR : RED, KI, .4)).join('') + mast(52, 46, 26, m, 1) + dish(52, 24, 5, m, 1) + `<path d="M8 22h28M22 12v10" stroke="${m.trim}" stroke-width="1.2"/>` + P([[18, 12], [22, 6], [26, 12]], m.trim, KI, .4); if (t >= 5) s += glow(22, 10, 12) + `<path d="M22 6l1.3 2.6 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4z" fill="${BR}"/>`; }
    return s;
  },
  prison(t) {
    const m = MAT[t]; let s = pad(t, false); const bars = (x, y, w, h) => Array.from({ length: Math.floor(w / 3) }, (_, i) => LN(x + 1.5 + i * 3, y, x + 1.5 + i * 3, y + h, '#12171a', 1)).join('');
    const tower = (x, yb, h) => RC(x, yb - h, 8, h, m.f, KI, .5) + RC(x, yb - h, 8, h, 'url(#gF)') + RC(x - 2, yb - h - 4, 12, 5, m.roof, KI, .5) + RC(x + 2, yb - h + 2, 4, 3, m.win, KI, .3) + light(x + 4, yb - h - 5.5);
    if (t === 1) s += LN(6, 54, 6, 38, '#6a5a3a', 1.6) + LN(26, 54, 26, 38, '#6a5a3a', 1.6) + LN(46, 54, 46, 38, '#6a5a3a', 1.6) + `<path d="M6 40h40M6 46h40M6 52h40" stroke="#b8c0c3" stroke-width=".7" stroke-dasharray="2 1.4"/>` + RC(50, 24, 8, 22, '#6a5a3a', KI, .5) + RC(48, 20, 12, 5, '#55663f', KI, .5) + LN(52, 46, 52, 56, '#6a5a3a', 1.6) + LN(58, 46, 58, 56, '#6a5a3a', 1.6) + tent(12, 52, 14, 9, '#55663f');
    else if (t === 2) s += block(t, { x: 6, w: 34, floors: 1, door: false, roof: 'gable', rh: 5 }) + bars(10, 42, 24, 8) + tower(46, 56, 22) + sandbags(8, 58, 4);
    else if (t === 3) s += block(t, { x: 4, w: 36, floors: 2, door: false }) + bars(9, 43, 26, 7) + tower(46, 56, 30) + `<path d="M4 58h56" stroke="${RED}" stroke-width="1" stroke-dasharray="2 3"/>` + `<path d="M50 26L34 52" stroke="rgba(255,233,168,.35)" stroke-width="3"/>`;
    else { s += block(t, { x: 4, w: 36, floors: 2, door: false }) + bars(9, 43, 26, 7) + tower(46, 56, 32) + `<path d="M2 58h60" stroke="${ICE}" stroke-width="1.2" class="glw"/><path d="M2 55h60" stroke="${RED}" stroke-width=".8" stroke-dasharray="1 2" class="glw"/>` + `<path d="M50 24L30 52" stroke="rgba(94,196,212,.3)" stroke-width="4"/>`; if (t >= 5) s += RC(4, 30, 36, 1.4, BR); }
    return s;
  },
  radar(t) {
    const m = MAT[t]; let s = pad(t, false);
    if (t === 1) s += tent(6, 46, 20, 16, '#6b7a4a') + LN(40, 52, 34, 58, '#5c676d', 1.6) + LN(40, 52, 46, 58, '#5c676d', 1.6) + LN(40, 52, 40, 36, '#5c676d', 1.6) + dish(40, 36, 10, m, 1) + crate(48, 58, 6, '#6a6a55') + sandbags(6, 57, 4);
    else if (t === 2) s += block(t, { x: 8, w: 24, floors: 1 }) + LN(44, 52, 44, 34, '#b8c0c3', 2) + dish(44, 34, 11, m, 1) + RC(38, 52, 12, 5, m.dark, KI, .5);
    else if (t === 3) s += block(t, { x: 6, w: 22, floors: 1 }) + RC(38, 24, 8, 32, '#8b979d', KI, .5) + RC(38, 24, 8, 32, 'url(#gCyl)') + dish(42, 22, 13, m, 1) + light(42, 8, RED);
    else { s += block(t, { x: 4, w: 22, floors: 1, doorX: 3 }) + RC(32, 26, 6, 30, m.f, KI, .5) + RC(32, 26, 6, 30, 'url(#gCyl)') + dish(35, 22, 12, m, 1) + RC(48, 34, 5, 22, m.f, KI, .5) + dish(50.5, 32, 8, m, 1) + `<circle cx="35" cy="20" r="16" fill="none" stroke="${ICE}" stroke-width=".8" class="ping" style="transform-origin:35px 20px"/>`; if (t >= 5) s = s.replace(dish(35, 22, 12, m, 1), `<circle cx="35" cy="22" r="11" fill="#e9eef0" stroke="${KI}" stroke-width=".7"/><circle cx="35" cy="22" r="11" fill="url(#gCyl)"/>${LN(35, 11, 35, 33, 'rgba(0,0,0,.15)', .6)}${LN(24, 22, 46, 22, 'rgba(0,0,0,.15)', .6)}`) + `<path d="M35 22L60 8" stroke="${ICE}" stroke-width="2" opacity=".5" class="glw"/>` + glow(35, 22, 16, 'gGI'); }
    return s;
  },
  store(t) {
    const m = MAT[t]; let s = pad(t, false); const roll = (x, yb, w, h) => RC(x, yb - h, w, h, '#2a3237', KI, .5) + Array.from({ length: Math.floor(h / 2) }, (_, i) => LN(x, yb - h + 1 + i * 2, x + w, yb - h + 1 + i * 2, 'rgba(255,255,255,.14)', .5)).join('');
    if (t === 1) s += crate(8, 54, 10, '#8a6a3a') + crate(19, 54, 10, '#7a5a2a') + crate(30, 54, 10, '#8a6a3a') + crate(13, 44, 10, '#7a5a2a') + crate(24, 44, 10, '#8a6a3a') + P([[6, 32], [42, 32], [46, 44], [4, 44]], '#55663f', KI, .5) + barrel(50, 54, '#b8613d') + barrel(56, 56, '#3f6f8c') + crate(44, 58, 7, '#6a6a55');
    else if (t === 2) s += block(t, { x: 6, w: 36, floors: 1, door: false, roof: 'vault' }) + roll(14, 54, 16, 11) + crate(46, 56, 8, '#8a6a3a') + crate(46, 48, 8, '#7a5a2a') + sandbags(8, 58, 4);
    else if (t === 3) s += block(t, { x: 4, w: 36, floors: 1, door: false, roof: 'vault' }) + roll(12, 54, 18, 12) + container(42, 56, '#b8613d') + container(42, 50, '#3f6f8c') + container(46, 44, '#8a6a3a');
    else { s += block(t, { x: 4, w: 34, floors: 2, door: false }) + roll(11, 54, 20, 13) + container(42, 58, '#b8613d') + container(42, 52, '#3f6f8c') + container(46, 46, '#8a6a3a') + `<path d="M4 20h38M8 20v8M38 20v8" stroke="${BR}" stroke-width="1.4"/><path d="M24 20v10" stroke="#b8c0c3" stroke-width="1.2"/><rect x="21" y="30" width="6" height="4" fill="#3c474e" stroke="${KI}" stroke-width=".4"/>`; if (t >= 5) s += RC(4, 30, 34, 1.4, BR) + glow(50, 40, 12); }
    return s;
  },
  defense(t) {
    const m = MAT[t]; let s = pad(t, false);
    if (t === 1) s += sandbags(8, 46, 12) + sandbags(10, 52, 11) + RC(24, 34, 12, 7, '#4a5358', KI, .5) + LN(30, 37, 44, 33, KI, 2) + RC(28, 41, 4, 6, '#3c474e') + sandbags(40, 58, 5) + tent(46, 50, 14, 10, '#55663f');
    else if (t === 2) s += box(6, 54, 38, 14, 9, m) + RC(8, 44, 34, 3, m.dark) + turret(24, 40, m) + door(30, 54, 7, 8) + sandbags(46, 56, 4);
    else if (t === 3) s += box(4, 54, 42, 14, 9, m, { trim: m.trim }) + turret(14, 40, m) + turret(34, 40, m, 1) + door(24, 54, 7, 8) + RC(46, 42, 12, 14, m.f, KI, .5) + `<path d="M6 40l-2 14M44 40l2 14" stroke="${RED}" stroke-width="1.4"/>`;
    else { s += box(3, 55, 44, 15, 9, m, { trim: t >= 5 ? BR : m.trim }) + turret(12, 40, m, 1) + turret(28, 40, m, 1) + turret(42, 40, m, 1) + door(21, 55, 8, 9) + `<g><rect x="50" y="34" width="10" height="20" fill="${m.f}" stroke="${KI}" stroke-width=".5"/>${[0, 1].map(i => `<path d="M${52 + i * 5} 34l1.5-7 1.5 7z" fill="#d8dfe1" stroke="${KI}" stroke-width=".4"/><path d="M${52 + i * 5} 34l1.5-3" stroke="${RED}" stroke-width="1"/>`).join('')}</g>`; if (t >= 5) s += `<path d="M2 50Q32 4 62 50" fill="none" stroke="${ICE}" stroke-width="1" stroke-dasharray="3 3" class="glw"/>` + glow(30, 34, 16, 'gGI'); }
    return s;
  },
  market(t) {
    const m = MAT[t]; let s = pad(t, false); const stall = (x, yb, c1, c2, w) => RC(x, yb - 8, w, 8, '#5a4630', KI, .5) + [0, 1, 2, 3].slice(0, Math.floor(w / 4)).map(i => P([[x + i * 4, yb - 12], [x + i * 4 + 4, yb - 12], [x + i * 4 + 5, yb - 8], [x + i * 4 - 1, yb - 8]], i % 2 ? c2 : c1, KI, .4)).join('') + RC(x + 1, yb - 5, w - 2, 2, '#d9c47a') + CI(x + 3, yb - 6.6, 1.2, RED) + CI(x + 6, yb - 6.6, 1.2, GRN);
    const lantern = (x, y, c) => LN(x, y - 5, x, y, '#5c676d', .6) + CI(x, y + 1.4, 2, c || '#ffb84a', 'class="glw"') + CI(x, y + 1.4, 4.4, 'rgba(255,184,74,.28)', 'class="glw"');
    if (t === 1) s += stall(6, 50, '#c45b78', '#e7e4da', 16) + stall(26, 52, '#5c8f9a', '#e7e4da', 16) + stall(44, 50, '#d9c48a', '#8a6a3a', 14) + crate(10, 58, 6, '#7a5a2a') + barrel(52, 58, '#b8613d');
    else if (t === 2) s += block(t, { x: 6, w: 38, floors: 1, door: false, roof: 'gable', rh: 5 }) + [0, 1, 2, 3, 4].map(i => P([[8 + i * 7.4, 36], [15.4 + i * 7.4, 36], [16.4 + i * 7.4, 41], [7 + i * 7.4, 41]], i % 2 ? '#e7e4da' : BR, KI, .4)).join('') + RC(10, 44, 8, 10, '#d9c47a', KI, .4) + RC(28, 44, 8, 10, '#5c8f9a', KI, .4) + crate(48, 58, 6, '#7a5a2a');
    else if (t === 3) s += block(t, { x: 4, w: 40, floors: 2, door: false }) + [0, 1, 2, 3, 4].map(i => P([[6 + i * 7.6, 40], [13.6 + i * 7.6, 40], [14.6 + i * 7.6, 45], [5 + i * 7.6, 45]], i % 2 ? '#e7e4da' : RED, KI, .4)).join('') + lantern(10, 30) + lantern(40, 30) + RC(12, 47, 8, 8, '#d9c47a', KI, .4) + RC(30, 47, 8, 8, '#5c8f9a', KI, .4);
    else { s += block(t, { x: 4, w: 40, floors: 2, door: false }) + [0, 1, 2, 3, 4].map(i => P([[6 + i * 7.6, 40], [13.6 + i * 7.6, 40], [14.6 + i * 7.6, 45], [5 + i * 7.6, 45]], i % 2 ? '#1d2a30' : BR, KI, .4)).join('') + `<rect x="10" y="18" width="24" height="6" fill="#12171a" stroke="${ICE}" stroke-width=".8" class="glw"/>${LN(13, 21, 31, 21, ICE, 1.6, 'class="glw"')}` + lantern(8, 30, ICE) + lantern(42, 30, '#ff7ab0') + RC(12, 47, 8, 8, '#12171a', ICE, .6) + RC(30, 47, 8, 8, '#12171a', BR, .6) + glow(22, 22, 14, 'gGI'); if (t >= 5) s += RC(4, 30, 40, 1.4, BR); }
    return s;
  }
};

/* ---------------- Command Center v2: 25 distinct looks ---------------- */
ccSVG = function (L) {
  const ck = 'cc2:' + L; if (b2cache[ck]) return b2cache[ck];
  const has = n => L >= n, t = Math.max(1, tierOf(L)), m = MAT[t]; let s = pad(t, false);
  if (L === 1) s += tent(9, 52, 32, 26, '#6b7a4a') + crate(44, 56, 7) + crate(51, 56, 6, '#7a5a2a') + flag(56, 46, 26, RED) + sandbags(8, 56, 6) + mast(50, 44, 18, m, 0);
  else if (L === 2) s += tent(5, 50, 28, 22, '#6b7a4a') + tent(28, 54, 30, 24, '#65744a') + crate(6, 58, 7) + crate(14, 58, 6, '#7a5a2a') + barrel(58, 58, '#b8613d') + flag(60, 40, 22, RED);
  else if (L <= 4) {
    s += box(9, 54, 32, 15, 10, { f: '#8a8a6e', s: '#5e5e46', t: '#5b6b43' }) + P([[7, 39], [25, 28], [51, 28], [43, 39]], '#5b6b43', KI, .5) + P([[7, 39], [25, 28], [51, 28], [43, 39]], 'url(#gT)') + door(22, 54, 8, 9) + RC(12, 44, 6, 5, '#d9c47a', KI, .4) + RC(32, 44, 6, 5, '#d9c47a', KI, .4) + flag(52, 40, 24, RED);
    if (L === 4) s += sandbags(6, 58, 10) + RC(46, 48, 9, 8, '#3c474e', KI, .5) + CI(50.5, 51, 1.4, RED, 'class="blink"') + barrel(58, 57, '#b8613d');
  } else {
    const floors = 1 + has(6) + has(10) + has(15) + has(20), w = has(12) ? 32 : 28, x = has(17) ? 16 : 9, yb = 52, fh = 7.4, h = floors * fh + 3, top = yb - h;
    if (has(17)) s += `<path d="M3 ${yb}V${yb - 10}q7-9 14 0V${yb}z" fill="${m.f}" stroke="${KI}" stroke-width=".6"/><path d="M3 ${yb}V${yb - 10}q7-9 14 0V${yb}z" fill="url(#gCyl)"/>${RC(6, yb - 7, 8, 7, '#12171a')}`;
    if (has(12)) s += box(x + w + 2, yb + 1, 10, 11, 6, m, { trim: t >= 3 ? m.trim : null }) + wins(x + w + 4, yb - 7, 2, 1, m, 3, 3, 1.4, 0, t >= 3);
    s += box(x, yb, w, h, 9, m, { trim: t >= 3 ? m.trim : null });
    for (let f = 0; f < floors; f++) s += wins(x + 3, yb - h + 4 + f * fh, Math.floor((w - 6) / 5.6), 1, m, 3.4, 2.8, 2.2, 0, has(10));
    s += door(x + w / 2 - 3, yb, 6, 7);
    if (t >= 4) s += RC(x, top - 1.2, w, 1.4, m.trim);
    if (has(11)) s += [0, 1, 2].map(i => P([[4 + i * 9, 60], [12 + i * 9, 60], [11 + i * 9, 56], [3 + i * 9, 56]], '#1d5670', KI, .4) + LN(7.5 + i * 9, 56, 7.5 + i * 9, 60, 'rgba(94,196,212,.6)', .5)).join('');
    if (has(8)) s += RC(1, 55, 62, 3, has(20) ? '#3a454c' : '#6b747a', KI, .5) + RC(1, 55, 62, 3, 'url(#gF)') + RC(x + w / 2 - 5, 55, 10, 3, '#12171a') + (has(15) ? RC(1, 55, 62, .9, BR) : '');
    if (has(13)) s += [4, 60].map(px => RC(px - 2.6, 44, 5.2, 12, m.f, KI, .5) + RC(px - 2.6, 44, 5.2, 12, 'url(#gCyl)') + RC(px - 3.6, 41, 7.2, 3.4, m.roof, KI, .5) + light(px, 43));
    if (has(16)) s += [x + 5, x + w - 5].map(px => turret(px, 55, m));
    if (has(7)) s += mast(x + w - 3, top, 15, m, 1);
    if (has(9)) s += `<ellipse cx="${x + 8}" cy="${top - 1.6}" rx="6" ry="2.6" fill="#2a3237" stroke="${BR}" stroke-width=".8"/><path d="M${x + 6} ${top - 3}v2.8M${x + 10} ${top - 3}v2.8M${x + 6} ${top - 1.6}h4" stroke="${BR}" stroke-width=".8"/>`;
    if (has(14)) s += dish(x + w * .5, top - 3, 6, m, 1);
    if (has(19)) s += `<path d="M${x + w * .5 - 6} ${top - 8}a6 5 0 0 1 12 0z" fill="${m.roof}" stroke="${ICE}" stroke-width=".8"/>`;
    if (has(21)) s += LN(x + 3, top, x - 1, top - 8, '#b8c0c3', 1.2) + `<ellipse cx="${x - 3}" cy="${top - 11}" rx="6" ry="2.8" transform="rotate(-25 ${x - 3} ${top - 11})" fill="#dfe6e8" stroke="${KI}" stroke-width=".6"/>`;
    if (has(23)) s += LN(x + w / 2, top, x + w / 2, top - 16, '#dfe6e8', 2) + CI(x + w / 2, top - 17, 2.2, BR, 'class="glw"') + glow(x + w / 2, top - 17, 9);
    if (has(24)) s += [x + 4, x + w - 7].map(px => P([[px, top + 3], [px + 4, top + 3], [px + 4, top + 13], [px + 2, top + 11], [px, top + 13]], BR, KI, .4)).join('');
    if (has(22)) s += `<ellipse cx="${x + w / 2}" cy="58.6" rx="7" ry="2.2" fill="#12171a" stroke="${ICE}" stroke-width=".8"/>${glow(x + w / 2, 58, 9, 'gGI')}${CI(x + w / 2, 58, 2, ICE, 'class="glw"')}`;
    if (has(18)) s += [3, 61].map(px => LN(px, 56, px, 30, '#c9d0d2', 1.4) + CI(px, 30, 2.4, ICE, 'class="glw"')).join('') + `<path d="M3 30Q32 ${has(25) ? -6 : 2} 61 30" fill="none" stroke="${ICE}" stroke-width=".9" stroke-dasharray="3 3" class="glw"/>`;
    if (has(20)) s += [[x + 2, top + 2], [x + w - 2, top + 2], [x + 2, yb - 3], [x + w - 2, yb - 3]].map(([a, b]) => CI(a, b, .8, m.trim)).join('');
    if (L === 25) s += `<circle cx="${x + w / 2}" cy="${top - 17}" r="10" fill="none" stroke="${BR}" stroke-width="1.2" class="ping" style="transform-origin:${x + w / 2}px ${top - 17}px"/><rect x="1" y="6" width="62" height="54" fill="none" stroke="${BR}" stroke-width="2" class="glw" rx="2"/>`;
  }
  return (b2cache[ck] = svgWrap(s));
};
