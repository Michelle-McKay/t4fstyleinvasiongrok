'use strict';
/* IRON MARCH — art v3, part 2: wall crews, hero portraits, gear and bars. Uses the helpers and palettes from art5.js. */

/* ================= WALL CREWS (they never march; drawn as emplacements on a pad) ================= */
const wpad = t => EL(32, 56, 28, 5, 'rgba(0,0,0,.5)') + P([[6, 50], [58, 50], [62, 58], [2, 58]], t >= 3 ? '#39434a' : '#3b3a33', KI, .6) + P([[6, 50], [58, 50], [62, 58], [2, 58]], 'url(#gT)') + (t >= 3 ? `<path d="M4 57h56" stroke="${BR}" stroke-width="1" stroke-dasharray="4 3" opacity=".6"/>` : '');
const bagRow = (x, y, n) => sandbags(x, y, n);
const barrelGun = (x, y, len, c, w) => sr(x, y, len, w || 3, c, .8) + sr(x + len - 4, y - .6, 4.6, (w || 3) + 1.2, '#12171a', .5) + CI(x + len + 1, y + (w || 3) / 2, 1, '#ffe9a8', 'class="blink"');
const WALL = {
  sent: [
    t => { const c = UP[1]; return wpad(1) + bagRow(10, 55, 10) + LN(32, 54, 32, 38, '#5a4630', 2.2) + LN(24, 54, 32, 44, '#5a4630', 1.4) + LN(40, 54, 32, 44, '#5a4630', 1.4) + sr(26, 32, 14, 8, c.g, 1.6) + barrelGun(38, 34.4, 17, '#2a3237', 3) + CI(28, 36, 1.5, RED, 'class="blink"') + sr(22, 28, 6, 5, c.a, 1) + RC(16, 46, 8, 5, '#6a5238', KI, .5) + RC(17, 44.4, 6, 2, '#3c474e', KI, .4); },
    t => { const c = UP[2]; return wpad(2) + sp([[8, 52], [10, 32], [50, 32], [56, 52]], c.b) + P([[10, 32], [50, 32], [52, 36], [9, 36]], 'rgba(255,255,255,.22)') + RC(14, 38, 32, 6, '#0f1417', KI, .5, 1.4) + barrelGun(30, 39.6, 22, '#3c474e', 3) + CI(22, 41, 1.4, '#ffd08a', 'class="glw"') + sp([[6, 32], [10, 28], [52, 28], [56, 32]], c.g) + bagRow(8, 56, 12) + rivets(14, 47, 8, 4.4) + flag(58, 32, 16, GRN); },
    t => { const c = UP[3]; let s = wpad(3); for (const x of [10, 30, 50]) s += sr(x - 2.6, 26, 5.2, 30, c.b, 2) + CI(x, 24, 3.2, c.d, `stroke="${KI}" stroke-width=".6"`) + CI(x, 24, 1.5, ICE, 'class="glw"') + gl(x, 24, 7, 'gGI') + RC(x - 3.4, 42, 6.8, 1.6, c.a); for (const y of [30, 38, 46]) s += `<path d="M10 ${y}L30 ${y - 3}L50 ${y}" stroke="${ICE}" stroke-width="1.3" fill="none" class="glw" opacity=".85"/>` + `<path d="M10 ${y}L30 ${y - 3}L50 ${y}" stroke="#fff" stroke-width=".4" fill="none" opacity=".8"/>`; return s; },
    t => { const c = UP[4]; return wpad(4) + sp([[14, 54], [18, 44], [46, 44], [50, 54]], c.b) + sr(24, 38, 16, 8, c.g, 2) + `<path d="M16 38a16 14 0 0 1 32 0z" fill="${c.g}" stroke="${KI}" stroke-width=".8"/><path d="M16 38a16 14 0 0 1 32 0z" fill="url(#uMetal)"/>` + CI(32, 30, 6, '#0b1c22', `stroke="${BR}" stroke-width="1"`) + CI(32, 30, 3.4, ICE, 'class="glw"') + CI(32, 30, 12, 'url(#uPlasma)', 'class="glw"') + sr(30, 16, 4, 10, c.d, 1) + CI(32, 15, 2.4, '#e8ffff', 'class="glw"') + RC(16, 36.6, 32, 1.4, BR) + rivets(20, 41, 6, 4.8); }
  ],
  bast: [
    t => { const c = UP[1]; let s = wpad(1); for (const [x, y] of [[8, 50], [24, 52], [40, 50]]) s += LN(x, y, x + 12, y - 16, '#7a848a', 2.6) + LN(x + 12, y, x, y - 16, '#7a848a', 2.6) + LN(x + 6, y - 20, x + 6, y + 2, '#7a848a', 2.6) + LN(x + 6, y - 20, x + 6, y - 24, '#c9d0d2', 1.6) + LN(x, y - 16, x - 2, y - 20, '#c9d0d2', 1.2) + LN(x + 12, y - 16, x + 14, y - 20, '#c9d0d2', 1.2); s += sr(46, 40, 14, 6, c.a, 1) + rivets(48, 43, 3, 4); return s; },
    t => { const c = UP[2]; return wpad(2) + sr(14, 44, 34, 10, c.g, 2) + sp([[10, 44], [16, 34], [46, 34], [52, 44]], c.b) + sr(20, 28, 20, 8, c.d, 2) + sr(38, 30, 24, 3, '#c9d0d2', .8) + sr(38, 34, 24, 1.6, ICE, .3) + sr(58, 28.6, 5, 6, c.d, 1) + LN(44, 31.4, 60, 31.4, '#e8ffff', .6) + CI(63, 31.6, 1.6, 'url(#uPlasma)', 'class="glw"') + rivets(16, 49, 7, 4.8) + wheel(20, 54, 3.4) + wheel(42, 54, 3.4); },
    t => { const c = UP[3]; let s = wpad(3) + sr(8, 44, 48, 10, c.g, 2) + sp([[10, 44], [14, 32], [50, 32], [54, 44]], c.b); for (let i = 0; i < 3; i++) s += sr(28, 16 + i * 6, 34, 4.2, c.d, 1.2) + sr(58, 15.4 + i * 6, 5, 5.4, c.b, .8) + CI(63.6, 18 + i * 6, 1.1, '#ffe9a8', 'class="blink"'); s += sr(14, 12, 18, 22, c.b, 2.4) + RC(16, 28, 14, 1.6, c.a) + RC(16, 18, 14, 1.6, c.a) + CI(23, 23, 3.2, c.d, `stroke="${KI}" stroke-width=".6"`) + CI(23, 23, 1.4, c.vis, 'class="glw"') + rivets(12, 49, 9, 5); return s; },
    t => { const c = UP[4]; return wpad(4) + `<path d="M8 50Q32 -6 56 50z" fill="rgba(94,196,212,.16)" stroke="${ICE}" stroke-width="1.2" class="glw"/>` + `<path d="M14 50Q32 6 50 50M22 50Q32 20 42 50" stroke="rgba(94,196,212,.5)" fill="none" stroke-width=".7"/>` + sp([[18, 54], [22, 42], [42, 42], [46, 54]], c.b) + sr(26, 34, 12, 10, c.g, 2) + CI(32, 30, 6, c.d, `stroke="${BR}" stroke-width="1"`) + CI(32, 30, 3, '#e8ffff', 'class="glw"') + gl(32, 30, 10, 'gGI') + RC(20, 46, 24, 1.4, BR) + P([[30, 24], [34, 24], [32, 20]], BR, KI, .3); }
  ],
  sky: [
    t => { const c = UP[1]; let s = wpad(1) + sr(16, 46, 34, 8, '#4a3a26', 1) + sp([[22, 46], [26, 38], [40, 38], [44, 46]], c.g); for (const [dx, dy] of [[0, 0], [7, 3]]) s += `<g transform="rotate(-38 ${30 + dx} ${36 + dy})">${sr(29 + dx, 8 + dy, 3.6, 28, '#2a3237', .8)}${sr(28 + dx, 6 + dy, 5.6, 5, '#12171a', .6)}</g>`; s += sr(24, 32, 16, 8, c.b, 2) + RC(26, 34, 12, 2, c.vis, null, 0, .4).replace('<rect', '<rect class="glw"') + bagRow(8, 56, 10); return s; },
    t => { const c = UP[2]; let s = wpad(2) + sr(14, 46, 36, 8, c.g, 2) + sr(24, 38, 16, 9, c.b, 2); for (const [x, y] of [[20, 0], [34, 2]]) s += `<g transform="rotate(-34 ${x + 6} 40)">${sr(x, 8 + y, 9, 30, c.d, 1.6)}${P([[x, 8 + y], [x + 4.5, 0 + y], [x + 9, 8 + y]], c.a, KI, .6)}${RC(x + 1, 16 + y, 7, 1.4, c.vis)}</g>`; s += CI(32, 42, 3, c.d, `stroke="${BR}" stroke-width=".6"`) + rivets(16, 51, 7, 5); return s; },
    t => { const c = UP[3]; let s = wpad(3) + sr(18, 46, 28, 8, c.g, 2) + sr(28, 22, 8, 26, c.b, 2); s += CI(32, 20, 5, c.d, `stroke="${KI}" stroke-width=".7"`) + CI(32, 20, 2.4, ICE, 'class="glw"') + gl(32, 20, 12, 'gGI'); for (const dx of [-14, 14]) s += sr(32 + dx - 1.6, 30, 3.2, 18, c.g, 1) + CI(32 + dx, 28, 2.6, c.d, `stroke="${KI}" stroke-width=".5"`) + CI(32 + dx, 28, 1.2, ICE, 'class="glw"') + `<path d="M${32 + dx} 28Q32 14 32 20" stroke="${ICE}" fill="none" stroke-width=".9" class="glw" opacity=".9"/>`; s += `<path d="M20 12l5 5-5 5M44 12l-5 5 5 5" stroke="${ICE}" stroke-width="1.1" fill="none" class="glw"/>` + RC(22, 50, 20, 1.4, BR); return s; },
    t => { const c = UP[4]; return wpad(4) + sr(16, 46, 32, 8, c.g, 2) + sp([[24, 46], [28, 20], [36, 20], [40, 46]], c.b) + RC(28, 30, 8, 1.4, BR) + RC(27, 38, 10, 1.4, BR) + P([[28, 20], [32, 12], [36, 20]], c.g, KI, .6) + `<path d="M32 12V5" stroke="rgba(255,240,200,.85)" stroke-width="3" class="glw"/><path d="M32 12V5" stroke="#fff" stroke-width="1"/>` + CI(32, 12, 6, 'url(#uPlasma)', 'class="glw"') + CI(32, 12, 2.2, '#fff') + `<ellipse cx="32" cy="46" rx="14" ry="3" fill="none" stroke="${BR}" stroke-width=".8" class="glw"/>`; }
  ],
  garr: [
    t => { const c = UP[1]; let s = wpad(1) + bagRow(6, 56, 12) + bagRow(9, 51, 9); const guard = (x, f) => sp([[x, 46], [x + 8, 46], [x + 8, 30], [x, 30]], c.cloth) + CI(x + 4, 27, 4.4, c.b, `stroke="${KI}" stroke-width=".6"`) + RC(x + 1, 27, 6.8, 2, '#232522', KI, .3, .8) + (f ? sr(x + 6, 33, 14, 3, '#22282c', .8) : ''); s += guard(16, 1) + guard(38, 0) + sr(46, 32, 12, 3, '#22282c', .8); return s; },
    t => { const c = UP[2]; let s = wpad(2) + sr(4, 40, 56, 14, '#2a2418', 1) + LN(4, 44, 60, 44, 'rgba(255,255,255,.1)', .6); const guard = (x) => sp([[x, 46], [x + 9, 46], [x + 8, 32], [x + 1, 32]], c.cloth) + sr(x + 1.4, 34, 6.4, 6, c.g, 1) + CI(x + 4.6, 27.6, 4.6, c.b, `stroke="${KI}" stroke-width=".6"`) + RC(x + 3, 27, 8, 2.2, '#0f2a32', KI, .3, .8) + sr(x + 5, 35, 12, 3, '#22282c', .8); s += guard(10) + guard(27) + guard(44) + bagRow(4, 56, 14) + sr(2, 46, 60, 3, '#4a3a26', .8); return s; },
    t => { const c = UP[3]; let s = wpad(3); const guard = (x, y, sc) => `<g transform="translate(${x} ${y}) scale(${sc})">` + sp([[0, 26], [7, 26], [7, 12], [0, 12]], c.cloth) + sr(1, 13, 5, 6, c.g, 1) + CI(3.6, 8, 4.4, c.b, `stroke="${KI}" stroke-width=".6"`) + RC(2, 7.4, 7, 2, ICE, null, 0, .8).replace('<rect', '<rect class="glw"') + sr(5, 15, 11, 2.6, '#22282c', .7) + `</g>`; s += guard(12, 22, 1.1) + guard(46, 22, 1.1) + guard(30, 26, 1.2) + `<path d="M6 34c8-4 12-3 20 0s14 3 22 0" stroke="${ICE}" stroke-width="1" fill="none" class="glw" opacity=".6"/>` + sr(17, 42, 4, 12, c.b, 1.2) + sr(43, 42, 4, 12, c.b, 1.2) + RC(17, 44, 4, 1.4, BR) + RC(43, 44, 4, 1.4, BR); return s; },
    t => { const c = UP[4]; let s = wpad(4); const sent = (x, sc) => `<g transform="translate(${x} 0) scale(${sc})" style="transform-origin:center">` + sp([[-4, 52], [-1, 34], [1, 34], [4, 52]], c.d) + sp([[-8, 36], [8, 36], [6, 20], [-6, 20]], c.b) + CI(0, 14, 5.4, c.g, `stroke="${KI}" stroke-width=".7"`) + RC(-3.6, 12.6, 7.2, 2.4, c.vis, null, 0, 1).replace('<rect', '<rect class="glw"') + RC(-6, 26, 12, 1.4, BR) + sr(6, 26, 14, 3, '#12171a', .8) + CI(20, 27.6, 1.1, '#ffe9a8', 'class="blink"') + `</g>`; s += sent(16, 1) + sent(48, 1) + sent(32, 1.05) + `<path d="M6 54h52" stroke="${BR}" stroke-width="1" class="glw"/>`; return s; }
  ]
};
function wallSVG(cls, tier) {
  return memo('w:' + cls + tier, () => {
    const t = clamp(tier | 0, 1, 4);
    let s = EL(32, 34, 30, 28, 'url(#uVig)') + WALL[cls][t - 1](t);
    s += Array.from({ length: t }, (_, i) => P([[4 + i * 4.6, 4], [7.4 + i * 4.6, 4], [5.7 + i * 4.6, 7]], t >= 3 ? BR : '#9aa4a8', KI, .4)).join('');
    return svgU(s, 'unit wallu w-' + cls + ' ut' + t);
  });
}

/* ================= HERO PORTRAITS ================= */
const SKIN = { ada: ['#e0b08a', '#b98259', '#7a4e34'], ivo: ['#f0d2b8', '#c9977a', '#8a5a48'], ren: ['#d9a878', '#a8764e', '#6e4630'] };
function faceBase(k, o) {
  const [hi, mid, lo] = SKIN[k]; const gid = 'sk' + k;
  return `<defs><radialGradient id="${gid}" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="${hi}"/><stop offset=".6" stop-color="${mid}"/><stop offset="1" stop-color="${lo}"/></radialGradient></defs>`
    + `<path d="M27 44h10v8H27z" fill="${mid}" stroke="${KI}" stroke-width=".6"/><path d="M27 44h10v4l-5 2-5-2z" fill="rgba(0,0,0,.28)"/>`
    + EL(21.4, 30, 2, 3.4, mid, `stroke="${KI}" stroke-width=".6"`) + EL(42.6, 30, 2, 3.4, lo, `stroke="${KI}" stroke-width=".6"`)
    + `<path d="M22.4 26c0-8 4-13 9.6-13s9.6 5 9.6 13v6c0 6-4 11.4-9.6 11.4S22.4 38 22.4 32z" fill="url(#${gid})" stroke="${KI}" stroke-width=".8"/>`
    + `<path d="M35 20c3 2 5 6 5.2 12 0 5-2 9-5 11 5-1 7.4-6 7.4-11.4V26c0-6-3-11-8.6-13 .6 2.4 .8 5 1 7z" fill="rgba(0,0,0,.2)"/>`;
}
const eye = (x, y, lit) => EL(x, y, 2.4, 1.5, '#f4efe4', `stroke="${KI}" stroke-width=".5"`) + CI(x + .5, y, 1.1, lit || '#2a2018') + CI(x + .9, y - .4, .35, '#fff');
const HERO = {
  ada(o) { // Quartermaster: goggles up, dark tied hair, olive field jacket, brass zip, cap
    let s = `<path d="M16 62c0-10 6-14 16-14s16 4 16 14z" fill="#59683f" stroke="${KI}" stroke-width=".8"/><path d="M16 62c0-10 6-14 16-14s16 4 16 14z" fill="url(#uMetal)"/>`;
    s += `<path d="M24 52l8 5 8-5v6l-8 6-8-6z" fill="#3b4629" stroke="${KI}" stroke-width=".5"/><path d="M32 54v10" stroke="${BR}" stroke-width="1.2"/>` + `<path d="M18 62l5-9M46 62l-5-9" stroke="#7b5a34" stroke-width="2.6"/><rect x="20" y="56" width="6" height="6" fill="#7b5a34" stroke="${KI}" stroke-width=".5"/>`;
    s += `<path d="M20 30c-3 8-1 15 4 18l-1-10zM44 30c3 8 1 15-4 18l1-10z" fill="#2a1d18" stroke="${KI}" stroke-width=".5"/>`;
    s += faceBase('ada');
    s += `<path d="M21.4 26c-1-9 5-14 10.6-14s11.6 5 10.6 14c-3-5-7-7-10.6-7s-7.6 2-10.6 7z" fill="#2a1d18" stroke="${KI}" stroke-width=".7"/>` + `<path d="M25 17c3-3 12-3 14 0" stroke="rgba(255,255,255,.28)" stroke-width="1" fill="none"/>`;
    s += `<path d="M20 20c2-9 8-11 12-11s10 2 12 11c-4-2-8-3-12-3s-8 1-12 3z" fill="#5c6a42" stroke="${KI}" stroke-width=".8"/><path d="M19 20h26v2.6H19z" fill="#4a5734" stroke="${KI}" stroke-width=".6"/>` + P([[29, 14], [35, 14], [32, 18]], BR, KI, .4);
    s += `<rect x="22.4" y="20.4" width="19.2" height="4.6" rx="2.2" fill="#3a2e22" stroke="${KI}" stroke-width=".6"/><ellipse cx="27.4" cy="22.7" rx="3.2" ry="1.9" fill="url(#uGlassW)" stroke="${KI}" stroke-width=".5"/><ellipse cx="36.6" cy="22.7" rx="3.2" ry="1.9" fill="url(#uGlassW)" stroke="${KI}" stroke-width=".5"/>`;
    s += `<path d="M25 28.4q2.4-1.4 4.6 0M34.4 28.4q2.2-1.4 4.6 0" stroke="#2a1d18" stroke-width="1" fill="none"/>` + eye(27.4, 30.6) + eye(36.6, 30.6) + `<path d="M32 31l-1.2 5 2 .4" stroke="rgba(0,0,0,.35)" fill="none" stroke-width=".7"/><path d="M28.8 39.2q3.2 2 6.4 0" stroke="#7a2e2a" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
    return s;
  },
  ivo(o) { // Surgeon: grey hair and beard, round lenses, headlamp, mask at the neck, white coat with red cross
    let s = `<path d="M14 62c0-10 6-14 18-14s18 4 18 14z" fill="#d8dcd8" stroke="${KI}" stroke-width=".8"/><path d="M14 62c0-10 6-14 18-14s18 4 18 14z" fill="url(#uMetal)"/>`;
    s += `<path d="M24 50l8 6 8-6" fill="#b9c0bd" stroke="${KI}" stroke-width=".6"/><path d="M26 47h12l-1 8h-10z" fill="#7fc0cf" stroke="${KI}" stroke-width=".6"/><path d="M26 49h12M26 51h12" stroke="rgba(255,255,255,.5)" stroke-width=".5"/>`;
    s += `<rect x="38" y="55" width="8" height="8" fill="#f4efe4" stroke="${KI}" stroke-width=".5"/><path d="M42 56v6M39 59h6" stroke="${RED}" stroke-width="2"/>`;
    s += faceBase('ivo');
    s += `<path d="M22.4 25c-2-7 4-13 9.6-13s11.6 6 9.6 13c-1-4-4-6.6-9.6-6.6S23.4 21 22.4 25z" fill="#b8bcbc" stroke="${KI}" stroke-width=".7"/><path d="M24 17c3-4 13-4 16 0" stroke="rgba(255,255,255,.5)" stroke-width="1" fill="none"/>`;
    s += `<path d="M23 34c0 9 4 13 9 13s9-4 9-13c-2 4-5 5-9 5s-7-1-9-5z" fill="#c9cccc" stroke="${KI}" stroke-width=".7"/><path d="M28 39.6q4 2.4 8 0" stroke="#4a4a4a" stroke-width="1.1" fill="none" stroke-linecap="round"/><path d="M25 37q7 3 14 0" stroke="rgba(255,255,255,.5)" stroke-width=".7" fill="none"/>`;
    s += `<path d="M24.6 27q3-1.6 5.6 0M33.8 27q2.6-1.6 5.6 0" stroke="#8a8a8a" stroke-width="1.5" fill="none"/>` + eye(27.4, 30) + eye(36.6, 30) + `<circle cx="27.4" cy="30" r="4.2" fill="rgba(180,230,240,.22)" stroke="#2a2a26" stroke-width=".9"/><circle cx="36.6" cy="30" r="4.2" fill="rgba(180,230,240,.22)" stroke="#2a2a26" stroke-width=".9"/><path d="M31.6 30h.8" stroke="#2a2a26" stroke-width=".9"/>`;
    s += `<path d="M32 30.4l-1 4.4 2 .4" stroke="rgba(0,0,0,.3)" fill="none" stroke-width=".7"/>` + `<rect x="27" y="16.4" width="10" height="3.6" rx="1.4" fill="#3c474e" stroke="${KI}" stroke-width=".5"/>` + CI(32, 18.2, 1.8, '#ffe9a8', 'class="glw"') + CI(32, 18.2, 5, 'url(#gGA)', 'class="glw"');
    return s;
  },
  ren(o) { // Marshal: peaked cap, scar, high collar greatcoat with brass epaulettes
    let s = `<path d="M12 62c0-10 6-14 20-14s20 4 20 14z" fill="#3e4a52" stroke="${KI}" stroke-width=".8"/><path d="M12 62c0-10 6-14 20-14s20 4 20 14z" fill="url(#uMetal)"/>`;
    s += `<path d="M22 48l10 6 10-6v8l-10 8-10-8z" fill="#2c353b" stroke="${KI}" stroke-width=".6"/><path d="M22 48l4-3 6 6zM42 48l-4-3-6 6z" fill="#586872" stroke="${KI}" stroke-width=".5"/>`;
    s += `<path d="M12 60l3-7 9 2-2 7zM52 60l-3-7-9 2 2 7z" fill="${BR}" stroke="${KI}" stroke-width=".7"/><path d="M14 59l2-4M17 60l2-4M50 59l-2-4M47 60l-2-4" stroke="#7a5218" stroke-width=".8"/>` + `<path d="M30 56h4M31 59h2" stroke="${BR}" stroke-width="1.4"/>`;
    s += faceBase('ren');
    s += `<path d="M23 34c0 6 3 9 9 9s9-3 9-9c-2 2-5 3-9 3s-7-1-9-3z" fill="rgba(60,40,30,.34)"/>` + `<path d="M22.4 25c0-6 2-9 4-10l1 6zM41.6 25c0-6-2-9-4-10l-1 6z" fill="#2a1d18"/>`;
    s += `<path d="M18 21c1-9 6-13 14-13s13 4 14 13c0 2-2 3-4 3H22c-2 0-4-1-4-3z" fill="#4a565e" stroke="${KI}" stroke-width=".9"/><path d="M18 21c1-9 6-13 14-13s13 4 14 13c0 2-2 3-4 3H22c-2 0-4-1-4-3z" fill="url(#uMetal)"/>`;
    s += `<path d="M18.6 22h26.8l1.6 3.4c-1 1.6-3 2.2-5 2.2H22c-2 0-4-.6-5-2.2z" fill="#1c2226" stroke="${KI}" stroke-width=".7"/><path d="M19 22.6h26" stroke="${BR}" stroke-width=".9"/>` + P([[28.6, 12.4], [35.4, 12.4], [37, 19], [32, 21.6], [27, 19]], BR, KI, .6) + CI(32, 16.4, 1.7, '#7a5218') + `<path d="M28.4 12.6l2-2M35.6 12.6l-2-2" stroke="${BR}" stroke-width=".7"/>`;
    s += `<path d="M24.6 28q2.4-2 5 -.4M34.6 27.6q2.6-1.6 5 .4" stroke="#1c1410" stroke-width="1.6" fill="none" stroke-linecap="round"/>` + eye(27.6, 30.4, '#2a3a2a') + eye(36.6, 30.4, '#2a3a2a');
    s += `<path d="M38.4 26.6l3.4 9" stroke="#c9785c" stroke-width="1.1" stroke-linecap="round"/><path d="M39.2 29.2l2-.8M40.2 32l2-.8" stroke="#e8b8a0" stroke-width=".6"/>` + `<path d="M32 31l-1.4 5.4 2.4.4" stroke="rgba(0,0,0,.35)" fill="none" stroke-width=".8"/><path d="M28 39.4q4 1.4 8 0" stroke="#5a2620" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
    return s;
  }
};
const HERO_BG = { ada: ['#8ea36a', '#2b3520'], ivo: ['#5ec4d4', '#16333a'], ren: ['#e0a44a', '#3a2a12'] };
function heroSVG(id, o) {
  o = o || {}; const k = 'h:' + id + (o.frame === false ? 'n' : '');
  return memo(k, () => {
    const [a, b] = HERO_BG[id];
    const bg = `<defs><radialGradient id="hb${id}" cx=".5" cy=".3" r=".85"><stop offset="0" stop-color="${a}" stop-opacity=".9"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="#0e1113"/></radialGradient><clipPath id="hc${id}"><rect x="2" y="2" width="60" height="60" rx="5"/></clipPath></defs>`;
    let s = bg + `<g clip-path="url(#hc${id})"><rect width="64" height="64" fill="url(#hb${id})"/>`;
    s += `<path d="M0 44L20 30l14 10 12-14 18 14v24H0z" fill="rgba(0,0,0,.28)"/>` + HERO[id]() + `</g>`;
    if (o.frame !== false) s += `<rect x="2" y="2" width="60" height="60" rx="5" fill="none" stroke="${a}" stroke-width="1.6"/><rect x="4" y="4" width="56" height="56" rx="3.5" fill="none" stroke="rgba(255,255,255,.14)" stroke-width=".6"/>` + P([[2, 52], [14, 52], [14, 62], [2, 62]], 'none');
    return svgU(s, 'unit hero h-' + id);
  });
}

/* ================= GEAR AND BARS ================= */
const GRADE_C = [null, '#9aa4a8', '#8ea36a', '#5ec4d4', '#8d78c9', '#e0a44a', '#e07a2f'];
const GEAR = {
  weapon: c => `<g transform="rotate(-12 32 34)">${sr(6, 30, 44, 5, '#252c31', 1)}${sr(46, 28, 12, 9, '#3c474e', 1.4)}${sr(14, 34, 10, 11, c.d, 1.4)}${sr(26, 24.6, 14, 5, '#12171a', 1)}${RC(28, 26, 10, 1.4, c.g, null, 0, .4).replace('<rect', '<rect class="glw"')}${RC(8, 31.4, 36, 1, 'rgba(255,255,255,.5)')}${sr(2, 29, 7, 7, c.g, 1.4)}${RC(50, 30, 6, 1.6, c.g)}${CI(56, 32.6, 1.3, '#ffe9a8', 'class="blink"')}</g>`,
  chest: c => sp([[14, 16], [26, 12], [32, 15], [38, 12], [50, 16], [52, 30], [46, 54], [32, 58], [18, 54], [12, 30]], c.b) + sp([[24, 22], [40, 22], [40, 44], [32, 48], [24, 44]], c.d) + RC(24, 32, 16, 2, c.g) + RC(30, 22, 4, 26, c.g, null, 0, 1) + CI(32, 30, 3.4, '#0b1c22', `stroke="${c.g}" stroke-width=".9"`) + CI(32, 30, 1.7, c.g, 'class="glw"') + rivets(17, 26, 3, 3.6) + rivets(41, 26, 3, 3.6),
  helmet: c => `<path d="M12 40a20 22 0 0 1 40 0v10H12z" fill="${c.b}" stroke="${KI}" stroke-width=".9"/><path d="M12 40a20 22 0 0 1 40 0v10H12z" fill="url(#uMetal)"/>` + sr(18, 36, 30, 9, '#0b1c22', 4) + RC(21, 39.4, 24, 2.6, c.g, null, 0, 1.3).replace('<rect', '<rect class="glw"') + RC(12, 47, 40, 3, c.d, KI, .5) + LN(32, 18, 32, 34, 'rgba(255,255,255,.28)', 1.4) + P([[26, 10], [38, 10], [36, 17], [28, 17]], c.g, KI, .5) + rivets(15, 48.5, 6, 6.4),
  boots: c => sp([[16, 10], [34, 10], [36, 36], [54, 44], [56, 54], [12, 54], [14, 30]], c.b) + sr(10, 52, 48, 6, c.d, 2.4) + sr(18, 14, 16, 5, c.d, 1.4) + LN(20, 26, 34, 28, c.g, 1.4) + LN(20, 32, 34, 34, c.g, 1.4) + RC(14, 50, 44, 1.6, c.g) + rivets(21, 41, 4, 4) + P([[38, 40], [52, 46], [54, 52], [36, 52]], 'rgba(255,255,255,.14)'),
  accessory: c => `<path d="M14 6c6 10 10 20 18 24 8-4 12-14 18-24" stroke="${c.d}" stroke-width="2.4" fill="none"/><path d="M14 6c6 10 10 20 18 24 8-4 12-14 18-24" stroke="rgba(255,255,255,.3)" stroke-width=".6" fill="none"/>` + `<path d="M32 30l12 8v14l-12 8-12-8V38z" fill="${c.b}" stroke="${KI}" stroke-width=".9"/><path d="M32 30l12 8v14l-12 8-12-8V38z" fill="url(#uMetal)"/><path d="M32 36l7 4.6v8.8l-7 4.6-7-4.6v-8.8z" fill="${c.d}" stroke="${c.g}" stroke-width=".9"/>` + CI(32, 45, 3.2, c.g, 'class="glw"') + gl(32, 45, 10, 'gGI')
};
const GEAR_TINT = g => { const a = GRADE_C[clamp(g | 0, 1, 6)]; return { b: '#5c676d', d: '#22292e', g: a }; };
function gearSVG(slot, grade, set) {
  return memo('g:' + slot + grade + (set || ''), () => {
    const c = GEAR_TINT(grade), a = GRADE_C[clamp(grade | 0, 1, 6)], sa = set && SETS[set] ? SETS[set].aura : null;
    let s = `<defs><radialGradient id="gb${grade}${set || ''}" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="${a}" stop-opacity=".42"/><stop offset="1" stop-color="#0e1113"/></radialGradient></defs><rect x="2" y="2" width="60" height="60" rx="5" fill="url(#gb${grade}${set || ''})" stroke="${a}" stroke-width="1.6"/>`;
    s += `<g transform="translate(6 6) scale(.81)">${GEAR[slot](c)}</g>`;
    s += Array.from({ length: Math.min(6, grade) }, (_, i) => CI(8 + i * 5.2, 58, 1.5, a, `stroke="${KI}" stroke-width=".3"`)).join('');
    if (sa) s += `<path d="M62 2v16L46 2z" fill="${sa}" stroke="${KI}" stroke-width=".5"/>`;
    return svgU(s, 'unit gear g' + grade);
  });
}
function barSVG(g) {
  return memo('b:' + g, () => {
    const a = GRADE_C[clamp(g, 1, 6)];
    let s = EL(32, 52, 24, 4, 'rgba(0,0,0,.45)') + sp([[8, 44], [16, 30], [56, 30], [58, 44]], '#59646a') + sp([[8, 44], [58, 44], [58, 52], [8, 52]], '#3c474e') + P([[8, 44], [16, 30], [26, 30], [18, 44]], 'rgba(255,255,255,.2)');
    s += RC(14, 46, 38, 2, a, null, 0, 1).replace('<rect', '<rect class="glw"') + `<text x="35" y="41" text-anchor="middle" font-family="Barlow Condensed,sans-serif" font-weight="700" font-size="11" fill="${KI}" opacity=".7">${g}</text>`;
    return svgU(s, 'unit bar');
  });
}
const emptySlot = slot => svgU(`<rect x="2" y="2" width="60" height="60" rx="5" fill="rgba(0,0,0,.25)" stroke="#3c474e" stroke-width="1.4" stroke-dasharray="4 3"/><g transform="translate(6 6) scale(.81)" opacity=".22">${GEAR[slot](GEAR_TINT(1))}</g>`, 'unit gear g0');
/* icon for a unit or wall crew by display name (used by battle reports, which store names, not keys) */
function nameIcon(name) {
  for (const c of CLS) { const i = CLSD[c].names.indexOf(name); if (i >= 0) return `<i class="ui">${unitSVG(c, i + 1, { plate: false })}</i>`; }
  for (const c of WCLS) { const i = WCLSD[c].names.indexOf(name); if (i >= 0) return `<i class="ui">${wallSVG(c, i + 1)}</i>`; }
  return '';
}
