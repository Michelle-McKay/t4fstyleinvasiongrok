'use strict';
/* IRON MARCH — art v3 for everything that is not a building: troops, wall crews, heroes, gear, monsters, terrain, march tokens and HUD icons.
   Same toolkit and light as art2 (64x64, light from the upper left, five material tiers). Loaded after art4. */

/* extra gradients, injected into the shared defs so svgSprite() and inline SVG both see them */
(function () {
  const d = document.querySelector('svg defs'); if (!d || d.querySelector('#uMetal')) return;
  d.insertAdjacentHTML('beforeend',
    `<linearGradient id="uMetal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></linearGradient>
     <linearGradient id="uSheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".3"/><stop offset=".25" stop-color="#fff" stop-opacity=".28"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity=".2"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></linearGradient>
     <linearGradient id="uGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bff3fb"/><stop offset=".5" stop-color="#3f9db0"/><stop offset="1" stop-color="#0f3a47"/></linearGradient>
     <linearGradient id="uGlassW" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe9b0"/><stop offset=".5" stop-color="#d9a24a"/><stop offset="1" stop-color="#6b3f12"/></linearGradient>
     <radialGradient id="uSky" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#5ec4d4" stop-opacity=".28"/><stop offset="1" stop-color="#5ec4d4" stop-opacity="0"/></radialGradient>
     <radialGradient id="uFire" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff3c0"/><stop offset=".35" stop-color="#ffb347"/><stop offset="1" stop-color="#e07a2f" stop-opacity="0"/></radialGradient>
     <radialGradient id="uPlasma" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e8ffff"/><stop offset=".4" stop-color="#5ec4d4"/><stop offset="1" stop-color="#5ec4d4" stop-opacity="0"/></radialGradient>
     <radialGradient id="uDisc" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#3c474e"/><stop offset="1" stop-color="#12171a"/></radialGradient>
     <radialGradient id="uVig" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>`);
})();

/* ---------------- shading helpers ---------------- */
const sp = (pts, f, sw) => P(pts, f, KI, sw || .6) + P(pts, 'url(#uMetal)');           // shaded polygon
const sr = (x, y, w, h, f, rx, sw) => RC(x, y, w, h, f, KI, sw || .6, rx) + RC(x, y, w, h, 'url(#uMetal)', null, 0, rx); // shaded rect
const sc = (x, y, w, h, f, rx) => RC(x, y, w, h, f, KI, .6, rx) + RC(x, y, w, h, 'url(#uSheen)', null, 0, rx);        // shaded cylinder (horizontal sheen)
const se = (x, y, rx, ry, f) => EL(x, y, rx, ry, f, `stroke="${KI}" stroke-width=".6"`) + EL(x, y, rx, ry, 'url(#uMetal)');
const hl = (x1, y1, x2, y2) => LN(x1, y1, x2, y2, 'rgba(255,255,255,.55)', .7);       // edge highlight
const svgU = (inner, cls) => `<svg viewBox="0 0 64 64" class="bsvg ${cls || ''}" aria-hidden="true">${inner}</svg>`;
const shadow = (rx, cx, cy) => EL(cx || 32, cy || 57, rx || 22, 3.6, 'rgba(0,0,0,.5)');
const rivets = (x, y, n, gap, c) => Array.from({ length: n }, (_, i) => CI(x + i * gap, y, .55, c || 'rgba(255,255,255,.55)')).join('');
const tint = c => c;
/* per-tier palette for troops: 1 scrap, 2 issue, 3 reinforced, 4 elite */
const UP = [null,
  { b: '#7f7c58', d: '#3c3a28', l: '#aaa57c', a: '#a5744a', g: '#5b5f52', cloth: '#5c5a3c', vis: '#c9b070', trim: '#6a4a2a' },
  { b: '#8b959a', d: '#333c41', l: '#c3cbce', a: '#8ea36a', g: '#5c676d', cloth: '#4b5a3a', vis: '#e2d29a', trim: '#5c676d' },
  { b: '#6d8290', d: '#222b31', l: '#a9bfca', a: BR, g: '#3c4a54', cloth: '#2f3d46', vis: '#8adbe8', trim: BR },
  { b: '#3e4a52', d: '#0f1417', l: '#7f939e', a: '#f0b95a', g: '#1e262b', cloth: '#171e23', vis: '#9ff0fb', trim: '#f0b95a' }];
const gl = (x, y, r, id) => glow(x, y, r, id || 'gGI');
const uCache = {};
const memo = (k, f) => uCache[k] || (uCache[k] = f());

/* ================= INFANTRY ================= */
function soldierHuman(t) {
  const c = UP[t]; let s = shadow(16);
  // rear leg, front leg
  s += sp([[23, 39], [30, 39], [30, 52], [21, 52], [22, 45]], c.cloth) + sr(19.5, 51, 11, 5, '#171b1d', 1.6);
  s += sp([[33, 39], [40, 39], [41, 52], [33, 52]], c.cloth) + sr(32.5, 51, 11.5, 5, '#171b1d', 1.6);
  s += RC(33, 44, 8, 3, c.d, KI, .4, 1) + RC(23, 44, 7, 3, c.d, KI, .4, 1);   // knee pads
  // torso and vest
  s += sp([[21.5, 21], [42.5, 21], [41, 41], [23, 41]], c.cloth);
  s += sp([[24, 22], [40, 22], [39, 38], [25, 38]], c.b);
  s += sr(27, 24, 10, 9, c.g, 1.6) + hl(27.6, 24.6, 36.4, 24.6) + RC(28.5, 34.5, 7, 2.5, c.d, KI, .4, .6);
  s += RC(23, 38.5, 18, 3, c.d, KI, .5) + RC(31, 38.5, 3, 3, c.a, KI, .3);
  s += sr(24.5, 39.5, 4.5, 4.5, c.a, .8, .4) + sr(35.5, 39.5, 4.5, 4.5, c.a, .8, .4);
  // rear arm
  s += sp([[20.5, 22], [25, 22], [27, 33], [23, 35]], c.cloth) + CI(24.4, 34.6, 2.2, '#2a2a26');
  // head + helmet
  s += RC(29.5, 19, 5, 3.6, '#a98362', KI, .4, 1.2);
  s += `<path d="M25 15.5a7 7 0 0 1 14 0v2.5H25z" fill="${c.b}" stroke="${KI}" stroke-width=".7"/><path d="M25 15.5a7 7 0 0 1 14 0v2.5H25z" fill="url(#uMetal)"/>`;
  s += RC(30, 14.5, 9, 3.4, t >= 2 ? '#0f2a32' : '#232522', KI, .4, 1.2) + RC(31, 15.2, 7, 1.4, c.vis, null, 0, .6).replace('<rect', '<rect class="glw"');
  s += LN(27.5, 11.5, 36, 9.6, 'rgba(255,255,255,.5)', .8);
  // front arm + weapon
  s += sp([[38.5, 22], [43, 23], [48, 32], [43.6, 35]], c.cloth) + CI(45.8, 33.6, 2.4, '#2a2a26');
  if (t === 1) { // riot shield + baton
    s += `<path d="M42 17c6-2 11 0 11 4v22c0 4-5 7-11 6z" fill="rgba(140,200,215,.5)" stroke="${KI}" stroke-width=".9"/><path d="M42 17c6-2 11 0 11 4v22c0 4-5 7-11 6z" fill="url(#uGlass)" opacity=".55"/>`;
    s += LN(44, 22, 51, 21, 'rgba(255,255,255,.6)', .9) + RC(41.4, 26, 2, 12, c.d, KI, .4) + RC(50.6, 16, 2.6, 3, c.a, KI, .3);
    s += sp([[36, 33], [39, 34], [33, 46], [30.5, 44.5]], '#3c3a28');
  } else { // issue rifle
    s += sr(31, 30, 26, 4.6, '#22282c', 1) + sr(41, 33, 5, 5, '#22282c', .8) + sr(52, 29.2, 9, 2.2, '#3c474e', .6) + sr(35, 27.6, 8, 2.6, '#12171a', .8);
    s += RC(36.4, 28.2, 5, 1.4, c.vis, null, 0, .4).replace('<rect', '<rect class="glw"');
    s += hl(31.6, 30.7, 55, 30.7) + CI(60.5, 30.4, 1.2, '#ffe9a8', 'class="blink"');
  }
  return s;
}
function exoSoldier(t) {
  const c = UP[t], big = t === 4; let s = shadow(19);
  const hi = LN;
  // backpack with vents
  s += sp([[14, 22], [22, 20], [23, 40], [14, 42]], c.d) + RC(15.6, 25, 5, 2, c.vis, null, 0, .4).replace('<rect', '<rect class="glw"') + RC(15.6, 29, 5, 2, c.vis, null, 0, .4).replace('<rect', '<rect class="glw"');
  if (big) s += LN(15, 20, 12, 8, '#b8c0c3', 1) + CI(12, 8, 1.3, RED, 'class="blink"');
  // legs: hydraulic
  s += sp([[22, 39], [30, 39], [31, 45], [29, 53], [21, 53], [22, 46]], c.b) + sr(19, 52, 13, 5.4, c.d, 1.8) + sr(23.5, 44.5, 5, 3.2, c.g, 1.2) + LN(28.5, 40.5, 27, 51, '#b8c0c3', 1.1);
  s += sp([[34, 39], [43, 39], [43, 45], [44.6, 53], [35, 53]], c.b) + sr(33, 52, 14, 5.4, c.d, 1.8) + sr(36, 44.5, 5.5, 3.2, c.g, 1.2) + LN(34.5, 40.5, 36, 51, '#b8c0c3', 1.1);
  if (t >= 3) s += RC(22, 46.6, 8, 1.2, c.a) + RC(34, 46.6, 9, 1.2, c.a);
  // torso, chest plate, core
  s += sp([[20, 19.5], [44.5, 19.5], [42.5, 41], [22, 41]], c.b);
  s += sp([[24, 22], [41, 22], [40, 36], [25.5, 36]], c.g) + hl(24.8, 22.7, 40.4, 22.7);
  s += CI(32.6, 29, 3.4, '#0b1c22', `stroke="${c.a}" stroke-width=".9"`) + CI(32.6, 29, 1.9, t === 4 ? '#ffd08a' : c.vis, 'class="glw"') + gl(32.6, 29, 6.6, t === 4 ? 'gGA' : 'gGI');
  s += RC(22.6, 38, 19, 3, c.d, KI, .4) + RC(26, 38.4, 12, 1, c.a);
  // pauldrons
  s += sp([[15.5, 22], [24, 18], [26, 25], [17, 29]], c.b) + (t >= 3 ? RC(17, 22.6, 8, 1.4, c.a).replace('<rect', '<rect transform="rotate(-18 21 23)"') : '');
  s += sp([[40, 19], [49, 20], [50, 28], [42, 26]], big ? c.a : c.b) + hl(40.6, 19.7, 48.6, 20.6);
  if (big) s += RC(44, 24, 2, 8, c.d) + P([[42, 12], [46, 12], [46, 17], [42, 17]], c.d, KI, .5) + LN(44, 12, 44, 6, '#b8c0c3', 1);
  // head with visor
  s += RC(29, 17, 6, 3, c.d, KI, .4, 1);
  s += `<path d="M24.5 14.6a7.6 7.6 0 0 1 15.2 0v3H24.5z" fill="${c.b}" stroke="${KI}" stroke-width=".8"/><path d="M24.5 14.6a7.6 7.6 0 0 1 15.2 0v3H24.5z" fill="url(#uMetal)"/>`;
  s += RC(29.4, 13.4, 11, 3.4, '#061418', KI, .4, 1.4) + RC(30.6, 14.2, 8.6, 1.6, c.vis, null, 0, .8).replace('<rect', '<rect class="glw"');
  if (t >= 3) s += RC(24.5, 11, 15, 1.2, c.a) + P([[30, 6.8], [34, 6.8], [32, 10]], c.a, KI, .3);
  // arms + heavy rifle
  s += sp([[38, 24], [45, 25], [49, 34], [43, 36]], c.b) + sr(43, 32, 6, 6, c.d, 2);
  s += sr(28, 30.4, 24, 6, c.d, 1.4) + sr(36, 27.5, 11, 3.6, c.g, 1) + sr(51, 31.4, 8, 3.4, c.g, .8) + RC(53, 32.3, 5, 1.2, c.vis, null, 0, .4).replace('<rect', '<rect class="glw"');
  s += RC(30, 32, 9, 1.4, c.a, null, 0, .4) + CI(59.6, 33, 1.4, '#ffe9a8', 'class="blink"') + gl(59.6, 33, 3, 'gGA');
  s += sp([[20.4, 24], [26, 24], [29, 34], [24, 36.6]], c.b) + CI(26.4, 35, 2.2, c.d, `stroke="${KI}" stroke-width=".5"`);
  return s;
}
const UNIT = {
  inf: t => t <= 2 ? soldierHuman(t) : exoSoldier(t)
};

/* ================= ARMOR ================= */
function wheel(x, y, r, c) { return CI(x, y, r, '#15191b', `stroke="${KI}" stroke-width=".6"`) + CI(x, y, r * .55, c || '#59646a', `stroke="${KI}" stroke-width=".4"`) + CI(x - r * .2, y - r * .25, r * .22, 'rgba(255,255,255,.35)') + CI(x, y, r * .16, KI); }
function scoutCar(t) {
  const c = UP[t]; let s = shadow(25, 32, 56.6);
  s += sp([[8, 44], [10, 32], [20, 30], [29, 22], [45, 22], [50, 32], [58, 35], [58, 46], [8, 47]], c.b);
  s += P([[30, 24], [44, 24], [47, 31], [26, 31]], 'url(#uGlass)', KI, .6) + LN(37, 24, 37, 31, KI, .8) + P([[31, 24.6], [35, 24.6], [33, 30]], 'rgba(255,255,255,.35)');
  s += RC(10, 38, 46, 2, c.d) + RC(12, 40, 42, 5, c.g, KI, .4) + hl(9.6, 32.6, 20, 30.6) + RC(46, 33, 10, 2.4, c.d, KI, .4);
  s += sp([[8, 42], [14, 42], [14, 50], [9, 50]], c.a) + sr(54, 36, 5, 8, c.d, 1);      // ram bar + grille
  for (let i = 0; i < 3; i++) s += LN(55, 38 + i * 2.4, 58, 38 + i * 2.4, '#9aa4a8', .6);
  if (t === 1) s += sp([[19, 33], [24, 33], [24, 41], [19, 41]], c.a) + LN(19, 33, 24, 41, KI, .5) + LN(10, 30, 8, 22, '#9aa4a8', .9) + P([[8, 22], [14, 23.5], [8, 26]], RED, KI, .4);
  // wheels
  s += wheel(19, 49, 7) + wheel(46, 49, 7);
  // roof MG
  s += sr(34, 19.4, 9, 4, c.d, 1) + sr(42, 19.6, 13, 2, '#12171a', .6) + CI(38, 17.5, 3, c.g, `stroke="${KI}" stroke-width=".6"`);
  s += CI(55.6, 20, 1, '#ffe9a8', 'class="blink"');
  return s;
}
function tankTracks(x, w, c) { // 3/4 side tracks
  let s = sr(x, 43, w, 12, '#1c2225', 6, .7);
  for (let i = 0; i < 6; i++) s += CI(x + 6 + i * ((w - 12) / 5), 49, 3.4, '#4a555b', `stroke="${KI}" stroke-width=".5"`) + CI(x + 6 + i * ((w - 12) / 5) - .8, 48.2, .9, 'rgba(255,255,255,.4)');
  s += RC(x + 2, 43.6, w - 4, 1.2, 'rgba(255,255,255,.25)', null, 0, .6);
  return s;
}
function battleTank(t) {
  const c = UP[t]; let s = shadow(27, 32, 57);
  s += tankTracks(6, 50, c);
  s += sp([[8, 42], [14, 34], [50, 34], [56, 42], [56, 45], [8, 45]], c.b);
  s += P([[8, 42], [14, 34], [20, 34], [15, 42]], 'rgba(255,255,255,.18)') + RC(9, 42, 46, 2, c.d) + hl(14, 34.6, 50, 34.6);
  s += rivets(16, 39, 8, 4.4);
  s += sp([[19, 34], [23, 25], [43, 25], [47, 34]], c.b) + hl(23.6, 25.6, 42.4, 25.6);
  s += sr(26, 20.6, 16, 5, c.g, 2) + CI(36, 18, 3.4, c.d, `stroke="${KI}" stroke-width=".6"`) + CI(36, 18, 1.5, c.a) + CI(35.2, 17.2, .8, 'rgba(255,255,255,.55)');
  s += sr(44, 26.4, 19, 4.4, c.g, 1.2) + sr(58, 25.6, 5.4, 6, c.d, 1) + CI(63, 28.6, 1.6, '#ffe9a8', 'class="blink"');
  s += sr(41, 24, 7, 8, c.b, 2) + LN(23, 25, 21, 15, '#b8c0c3', .9);
  s += RC(26, 28, 12, 3, c.d, KI, .4) + RC(28, 28.8, 8, 1.2, c.vis, null, 0, .4).replace('<rect', '<rect class="glw"');
  if (t === 1) s += sp([[6, 40], [11, 40], [11, 45], [6, 45]], c.a);
  return s;
}
function assaultMech(t) {
  const c = UP[t]; let s = shadow(23);
  // legs (digitigrade)
  const leg = (x, front) => sp([[x, 33], [x + 8, 33], [x + 10, 40], [x + 4, 46], [x + 11, 54], [x + 3, 54], [x - 4, 46], [x + 2, 40]], front ? c.b : c.g) + sr(x - 3, 52.4, 17, 4.6, c.d, 1.8) + CI(x + 5, 40, 3.2, c.d, `stroke="${KI}" stroke-width=".5"`) + LN(x + 9, 41, x + 10, 50, '#b8c0c3', 1);
  s += leg(18, false) + leg(34, true);
  // pelvis / torso
  s += sr(20, 30, 26, 7, c.d, 2) + sp([[15, 12], [50, 12], [48, 32], [18, 32]], c.b);
  s += P([[15, 12], [50, 12], [48.5, 17], [16.5, 17]], 'rgba(255,255,255,.2)') + hl(16, 12.7, 49, 12.7);
  s += `<path d="M24 16h18l-2 9H26z" fill="url(#uGlass)" stroke="${KI}" stroke-width=".8"/>` + P([[26, 16.6], [32, 16.6], [28, 23]], 'rgba(255,255,255,.45)') + gl(33, 20.6, 8, 'gGI');
  s += RC(26, 26.6, 14, 1.6, c.a) + rivets(19, 29, 3, 3.4) + rivets(41, 29, 3, 3.4);
  // shoulder pods
  s += sr(8, 12, 10, 14, c.g, 2) + [0, 1, 2, 3].map(i => CI(11 + (i % 2) * 4.4, 15.4 + Math.floor(i / 2) * 5.4, 1.5, '#0b1114')).join('') + sr(47, 14, 9, 10, c.g, 2) + CI(51.4, 18, 2, c.a, `stroke="${KI}" stroke-width=".5"`);
  // arm cannons
  s += sr(4, 23, 8, 11, c.b, 2) + sr(0.6, 28, 6, 3.4, c.d, .8) + sr(52, 23, 10, 9, c.b, 2) + sr(58, 25.4, 6, 3.6, c.d, .8) + RC(56, 26, 2, 1.4, c.vis, null, 0, .4).replace('<rect', '<rect class="glw"');
  if (t >= 4) s += P([[16, 8], [22, 4], [26, 12]], c.a, KI, .5) + P([[40, 12], [44, 4], [50, 8]], c.a, KI, .5);
  return s;
}
function juggernaut(t) {
  const c = UP[t]; let s = shadow(30, 32, 58);
  s += tankTracks(2, 60, c);
  s += sp([[3, 43], [10, 31], [56, 31], [62, 43], [62, 46], [3, 46]], c.b);
  s += sp([[3, 43], [10, 31], [18, 31], [11, 43]], c.a) + RC(4, 42.6, 57, 2.2, c.d) + rivets(14, 37, 9, 4.6);
  // main casemate
  s += sp([[12, 31], [17, 20], [47, 20], [52, 31]], c.g) + hl(17.6, 20.6, 46.4, 20.6);
  s += RC(14, 27.6, 36, 2, c.a) + RC(20, 23, 10, 3, c.d, KI, .4, .8) + RC(22, 23.8, 6, 1.2, c.vis, null, 0, .4).replace('<rect', '<rect class="glw"');
  // twin turret
  s += sr(24, 12, 20, 9, c.b, 2.4) + sr(20, 14, 8, 6, c.g, 1.4) + CI(34, 10.6, 3.4, c.d, `stroke="${KI}" stroke-width=".6"`) + CI(34, 10.6, 1.4, c.a, 'class="glw"');
  s += sr(42, 13, 21, 3.8, c.d, 1) + sr(42, 17.4, 21, 3.8, c.d, 1) + sr(58, 12, 5, 4.8, c.b, .8) + sr(58, 16.4, 5, 4.8, c.b, .8) + hl(43, 13.6, 58, 13.6);
  s += CI(63.4, 14.6, 1.4, '#ffe9a8', 'class="blink"') + CI(63.4, 19, 1.4, '#ffe9a8', 'class="blink"');
  // side armour skirts + exhaust
  s += sr(8, 36.4, 46, 5, c.d, 1.2) + sr(8, 18, 6, 12, c.d, 1) + LN(11, 18, 11, 8, '#b8c0c3', 1) + CI(11, 8, 1.3, RED, 'class="blink"');
  if (t >= 4) s += RC(3, 42, 59, 1.4, c.a) + gl(56, 34, 6, 'gGA');
  return s;
}
UNIT.arm = t => [scoutCar, battleTank, assaultMech, juggernaut][t - 1](t);

/* ================= AIRCRAFT ================= */
const airShadow = (rx, cx) => EL(cx || 32, 57, rx, 3, 'rgba(0,0,0,.32)');
function reconDrone(t) {
  const c = UP[t]; let s = airShadow(15, 32);
  const rotor = (x, y) => LN(x, y + 3, 32, 32, c.d, 1.6) + EL(x, y + 1, 9, 2.6, 'rgba(200,220,230,.32)', 'class="glw"') + EL(x, y, 9, 2.4, 'rgba(255,255,255,.14)', `stroke="${c.l}" stroke-width=".5"`) + CI(x, y + 1.6, 1.8, c.d, `stroke="${KI}" stroke-width=".4"`);
  s += rotor(14, 22) + rotor(50, 22);
  s += sp([[20, 27], [44, 27], [46, 34], [40, 41], [24, 41], [18, 34]], c.b) + hl(21, 27.8, 43, 27.8);
  s += RC(21, 33.6, 22, 1.5, c.d) + sp([[26, 40], [38, 40], [36, 45], [28, 45]], c.g);
  s += CI(32, 38.6, 4.6, '#0b1c22', `stroke="${c.a}" stroke-width=".8"`) + CI(32, 38.6, 2.5, c.vis, 'class="glw"') + CI(31, 37.6, .9, '#fff') + gl(32, 38.6, 8, 'gGI');
  s += rotor(12, 39) + rotor(52, 39);
  s += LN(32, 27, 32, 18, '#b8c0c3', .9) + CI(32, 17.4, 1.3, RED, 'class="blink"');
  s += RC(28.4, 29.4, 7, 2, c.g, KI, .4, .8);
  return s;
}
function attackHeli(t) {
  const c = UP[t]; let s = airShadow(22, 30);
  s += sr(3, 24, 26, 3.6, c.g, 1.4);                                     // tail boom
  s += sp([[3, 20], [7, 20], [9, 26], [3, 27]], c.b) + EL(5, 23, 2.2, 8.5, 'rgba(210,230,240,.3)', `stroke="${c.l}" stroke-width=".4"`);
  s += `<path d="M24 36c-6 0-9-5-7-11 2-6 8-9 16-9 8 0 14 3 17 9 1 3-3 8-9 9z" fill="${c.b}" stroke="${KI}" stroke-width=".8"/><path d="M24 36c-6 0-9-5-7-11 2-6 8-9 16-9 8 0 14 3 17 9 1 3-3 8-9 9z" fill="url(#uMetal)"/>`;
  s += `<path d="M41 22c6 1 11 4 13 8 1 2-1 4-4 5l-11-1z" fill="url(#uGlass)" stroke="${KI}" stroke-width=".8"/>` + P([[42, 23.6], [49, 25.6], [44, 27]], 'rgba(255,255,255,.55)');
  s += RC(20, 29, 22, 1.4, c.a) + RC(22, 32, 10, 2, c.d, KI, .3, .6);
  // stub wings + rockets
  s += sp([[26, 33], [42, 33], [44, 38], [24, 38]], c.g) + sr(22, 34.6, 12, 3, c.d, 1.4) + sr(36, 35, 12, 3, c.d, 1.4) + P([[47, 35], [51, 36.5], [47, 38]], c.a, KI, .3);
  // mast + main rotor
  s += LN(32, 16, 32, 11, c.d, 2.4) + EL(32, 11, 27, 3.2, 'rgba(210,230,240,.2)', `stroke="${c.l}" stroke-width=".5"`) + EL(32, 11, 19, 2, 'rgba(255,255,255,.12)') + CI(32, 11, 2.4, c.b, `stroke="${KI}" stroke-width=".6"`);
  // skids
  s += LN(22, 42, 46, 42, '#8b979d', 1.3) + LN(26, 37, 25, 42, '#8b979d', 1) + LN(40, 37, 41, 42, '#8b979d', 1);
  s += CI(52, 36.6, 1.2, '#ffe9a8', 'class="blink"') + LN(3, 24, 4, 22, RED, 1.4);
  return s;
}
function gunship(t) {
  const c = UP[t]; let s = airShadow(26);
  const prop = (x, y) => EL(x, y, 6.5, 8.5, 'rgba(210,230,240,.26)', `stroke="${c.l}" stroke-width=".5"`) + EL(x, y, 3.6, 5, 'rgba(255,255,255,.14)') + CI(x, y, 2, c.b, `stroke="${KI}" stroke-width=".5"`);
  s += sr(1, 27, 6, 10, c.g, 1.6) + prop(4, 24) + sr(57, 27, 6, 10, c.g, 1.6) + prop(60, 24);
  s += sp([[5, 30], [59, 30], [61, 34], [3, 34]], c.g);
  s += `<path d="M14 40c-3 0-5-4-3-9 2-6 12-12 22-12s20 6 21 12c1 5-2 9-6 9z" fill="${c.b}" stroke="${KI}" stroke-width=".9"/><path d="M14 40c-3 0-5-4-3-9 2-6 12-12 22-12s20 6 21 12c1 5-2 9-6 9z" fill="url(#uMetal)"/>`;
  s += `<path d="M38 22c7 0 13 3 15 8l-16 1z" fill="url(#uGlass)" stroke="${KI}" stroke-width=".8"/>` + P([[40, 23.4], [48, 25.6], [42, 27.4]], 'rgba(255,255,255,.5)');
  s += RC(15, 31, 32, 1.6, c.a) + [0, 1, 2, 3].map(i => RC(18 + i * 7, 34, 4, 2, c.d, KI, .3)).join('') + gl(50, 30, 6, 'gGI');
  s += sr(24, 40, 18, 4, c.d, 1.4) + sr(41, 41, 14, 2.4, '#12171a', .8) + CI(55.4, 42.2, 1.2, '#ffe9a8', 'class="blink"');
  s += sr(11, 40, 5, 9, c.g, 1) + sr(45, 41, 5, 8, c.g, 1);
  if (t >= 3) s += P([[26, 18], [40, 18], [38, 22], [28, 22]], c.a, KI, .4) + rivets(29, 20, 4, 2.6, 'rgba(0,0,0,.4)');
  return s;
}
function stealthBomber(t) {
  const c = UP[t]; let s = airShadow(26);
  s += sp([[32, 8], [62, 40], [46, 38], [32, 46], [18, 38], [2, 40]], c.b);
  s += P([[32, 8], [62, 40], [46, 38], [32, 46]], 'rgba(0,0,0,.34)') + P([[32, 8], [2, 40], [18, 38], [32, 46]], 'rgba(255,255,255,.1)');
  s += `<path d="M32 12l26 26M32 12L6 38" stroke="${c.a}" stroke-width=".7" fill="none" opacity=".8"/>` + LN(32, 12, 32, 42, 'rgba(0,0,0,.4)', 1);
  s += sp([[28, 22], [36, 22], [37, 34], [27, 34]], c.g) + `<path d="M29.4 23.5h5.2l1 5h-7.2z" fill="url(#uGlass)" stroke="${KI}" stroke-width=".5"/>`;
  s += sp([[20, 36], [26, 34], [27, 41], [21, 42]], c.d) + sp([[38, 34], [44, 36], [43, 42], [37, 41]], c.d);
  s += RC(21, 40.2, 5, 1.2, ICE, null, 0, .4).replace('<rect', '<rect class="glw"') + RC(38, 40.2, 5, 1.2, ICE, null, 0, .4).replace('<rect', '<rect class="glw"');
  s += CI(4, 40, 1.1, RED, 'class="blink"') + CI(60, 40, 1.1, '#8ef0b0', 'class="blink"') + gl(32, 44, 9, 'gGI');
  s += RC(28, 44, 8, 1.8, c.a) + P([[30, 8.6], [34, 8.6], [32, 6]], c.a, KI, .3);
  // hardpoint pods (brass)
  s += sr(12, 33, 4, 6, c.a, 1) + sr(48, 33, 4, 6, c.a, 1);
  return s;
}
UNIT.air = t => [reconDrone, attackHeli, gunship, stealthBomber][t - 1](t);

/* ================= SIEGE ================= */
function siegeEngine(t) {
  const c = UP[t]; let s = shadow(26);
  s += sr(6, 42, 40, 5, '#4a3a26', 1) + LN(8, 44, 44, 44, 'rgba(255,255,255,.2)', .6);
  s += wheel(14, 50, 7, c.a) + wheel(38, 50, 7, c.a);
  s += sp([[10, 42], [14, 24], [18, 24], [16, 42]], '#5a4630') + sp([[32, 42], [34, 24], [38, 24], [38, 42]], '#5a4630') + sr(10, 22.6, 30, 3.4, '#6a5238', 1);
  // throwing arm
  s += `<g transform="rotate(-26 26 24)">${sr(24.6, 4, 3.8, 34, '#7c6238', 1)}${sr(18, 32, 17, 11, c.g, 2)}${rivets(20, 35, 4, 4)}${LN(24.6, 5, 24.6, 34, 'rgba(255,255,255,.35)', .6)}</g>`;
  s += `<path d="M31.4 7.6q10 4 12 16" stroke="#3c2f1c" stroke-width=".9" fill="none"/>` + `<circle cx="47" cy="26" r="4.4" fill="${c.g}" stroke="${KI}" stroke-width=".7"/><circle cx="46" cy="25" r="1.2" fill="rgba(255,255,255,.4)"/>`;
  s += sr(38, 34, 16, 9, '#4a555b', 1) + rivets(41, 37, 3, 4) + LN(38, 43, 22, 47, '#3c2f1c', 1);
  s += RC(48, 41, 12, 6, '#6a5238', KI, .5) + CI(52, 39, 2.6, '#3c474e', `stroke="${KI}" stroke-width=".5"`) + CI(58, 39, 2.6, '#3c474e', `stroke="${KI}" stroke-width=".5"`);
  return s;
}
function plasmaMortar(t) {
  const c = UP[t]; let s = shadow(26);
  s += sr(4, 44, 50, 7, c.g, 2) + sp([[8, 44], [12, 36], [46, 36], [50, 44]], c.b) + hl(12, 36.8, 46, 36.8) + rivets(14, 41, 8, 4);
  s += sr(3, 47, 54, 8, '#1c2225', 4) + [0, 1, 2, 3, 4, 5].map(i => CI(9 + i * 8.4, 51, 3, '#4a555b', `stroke="${KI}" stroke-width=".4"`)).join('');
  // mortar tube on trunnion
  s += `<g transform="rotate(-42 28 34)">${sr(21, 8, 14, 28, c.b, 3)}${sr(19.6, 8, 17, 5, c.g, 2)}${RC(21, 17, 14, 1.6, c.a)}${RC(21, 22, 14, 1.6, c.a)}${RC(23, 31, 10, 4, c.d, KI, .4)}</g>`;
  s += CI(28, 34, 5, c.d, `stroke="${KI}" stroke-width=".7"`) + CI(28, 34, 2, c.a);
  // plasma flare at muzzle
  const mx = 28 + Math.sin(42 * Math.PI / 180) * 26, my = 34 - Math.cos(42 * Math.PI / 180) * 26;
  s += CI(mx + 1, my - 1, 8, 'url(#uPlasma)', 'class="glw"') + CI(mx + 1, my - 1, 2.6, '#fff');
  s += sr(40, 28, 14, 9, c.g, 1.4) + [0, 1, 2].map(i => CI(44 + i * 4.2, 32.6, 1.4, ICE, 'class="glw"')).join('') + RC(41, 29, 12, 1.2, c.a);
  s += sr(46, 22, 12, 8, '#5a4630', 1) + LN(46, 26, 58, 26, 'rgba(0,0,0,.35)', .6);
  return s;
}
function breachArtillery(t) {
  const c = UP[t]; let s = shadow(28, 30, 57);
  // outrigger trails
  s += sp([[2, 55], [18, 47], [22, 50], [8, 57]], c.g) + sp([[36, 47], [52, 55], [56, 55], [40, 50]], c.g);
  s += sr(12, 40, 34, 8, c.g, 2) + wheel(18, 50, 6.5, c.a) + wheel(40, 50, 6.5, c.a);
  s += sp([[14, 41], [16, 28], [40, 28], [42, 41]], c.b) + hl(16.6, 28.8, 39.4, 28.8) + RC(16, 35, 24, 1.6, c.a);
  s += sp([[18, 28], [24, 20], [38, 20], [40, 28]], c.g) + RC(26, 22, 10, 3, c.d, KI, .4, .8) + RC(27.4, 22.8, 7, 1.2, c.vis, null, 0, .4).replace('<rect', '<rect class="glw"');
  // long barrel with recoil cylinders
  s += `<g transform="rotate(-14 32 27)">${sr(30, 22, 30, 7, c.b, 2)}${sr(50, 20.4, 12, 10.2, c.g, 1.6)}${sr(58, 21, 5, 9, c.d, 1.4)}${sr(34, 17, 22, 3, c.d, 1.2)}${sr(34, 30.8, 22, 3, c.d, 1.2)}${RC(41, 22, 2, 7, c.a)}${RC(46, 22, 2, 7, c.a)}</g>`;
  s += CI(60.6, 15, 3.4, 'url(#uFire)', 'class="glw"') + sr(4, 36, 10, 6, '#5a4630', .8) + P([[6, 36], [9, 32], [12, 36]], c.a, KI, .3);
  s += LN(18, 28, 14, 14, '#b8c0c3', .8) + CI(14, 14, 1.2, RED, 'class="blink"');
  return s;
}
function demoWalker(t) {
  const c = UP[t]; let s = shadow(24);
  const leg = (x, back) => (back ? '' : '') + sp([[x, 32], [x + 5, 32], [x + 10, 44], [x + 14, 54], [x + 9, 54], [x + 4, 44]], back ? c.g : c.b) + CI(x + 3, 36, 2.6, c.d, `stroke="${KI}" stroke-width=".5"`) + sr(x + 6, 53, 11, 3.6, c.d, 1.4);
  s += leg(14, true) + leg(38, true);
  s += sp([[8, 32], [14, 20], [50, 20], [56, 32], [50, 42], [14, 42]], c.b);
  s += P([[8, 32], [14, 20], [24, 20], [17, 32]], 'rgba(255,255,255,.16)') + hl(14.6, 20.7, 49.4, 20.7);
  s += leg(6, false) + leg(44, false);
  s += RC(12, 31, 40, 2, c.a) + rivets(15, 25, 8, 4.6) + sr(22, 33.6, 20, 6, c.d, 1.4);
  // core
  s += CI(32, 28, 5, '#2a0f0b', `stroke="${c.a}" stroke-width=".9"`) + CI(32, 28, 2.6, '#ffb347', 'class="glw"') + gl(32, 28, 9, 'gGA');
  // siege ram / cannon
  s += sr(38, 22, 24, 8, c.g, 2) + sr(58, 20, 5, 12, c.d, 1.4) + sr(44, 19, 8, 4, c.b, 1) + RC(41, 23.6, 2, 5, c.a) + RC(48, 23.6, 2, 5, c.a);
  s += CI(63, 26, 3, 'url(#uFire)', 'class="glw"');
  s += sr(20, 12, 6, 9, c.d, 1) + sr(28, 10, 6, 11, c.d, 1) + [22, 30].map(x => CI(x + 1.6, 12 - (x > 25 ? 2 : 0), 1.2, '#ffb347', 'class="blink"')).join('');
  return s;
}
UNIT.siege = t => [siegeEngine, plasmaMortar, breachArtillery, demoWalker][t - 1](t);

const FIT = { arm2: .95, arm3: .88, arm4: .94, air3: .92, siege2: .95 };
/* public: unitSVG('inf', 3) -> full SVG string; tier plate shows a small tier pip row */
function unitSVG(cls, tier, o) {
  o = o || {}; const k = 'u:' + cls + tier + (o.plate === false ? 'n' : '');
  return memo(k, () => {
    const t = clamp(tier | 0, 1, 4); let s = '';
    if (o.plate !== false) s += EL(32, 34, 30, 28, 'url(#uVig)') + `<path d="M4 58h56" stroke="${t >= 3 ? BR : '#3c474e'}" stroke-width="1" opacity=".5"/>`;
    const k2 = FIT[cls + t]; s += k2 ? `<g transform="translate(${32 - 32 * k2} ${57 - 57 * k2}) scale(${k2})">${UNIT[cls](t)}</g>` : UNIT[cls](t);
    if (o.plate !== false) s += Array.from({ length: t }, (_, i) => P([[4 + i * 4.6, 4], [7.4 + i * 4.6, 4], [5.7 + i * 4.6, 7]], t >= 3 ? BR : '#9aa4a8', KI, .4)).join('');
    return svgU(s, 'unit u-' + cls + ' ut' + t);
  });
}
