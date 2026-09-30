'use strict';
/* IRON MARCH — map feature art v2. Terrain drawn with canvas ops (sync); features rendered from the shared SVG toolkit. */
const stripSvg = s => s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
function svgSprite(name, inner, size) {
  if (SP[name]) return SP[name]; size = size || 96;
  const c = document.createElement('canvas'); c.width = c.height = size; SP[name] = c;
  const defs = document.querySelector('svg defs').innerHTML, src = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}"><defs>${defs}</defs>${inner}</svg>`;
  const img = new Image(); img.onload = () => c.getContext('2d').drawImage(img, 0, 0, size, size); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src); return c;
}
const gradeTier = g => g <= 2 ? 1 : g === 3 ? 2 : g === 4 ? 3 : g === 5 ? 4 : 5;

/* ---------------- terrain ---------------- */
TERRAIN.forest = v => mk('forest2_' + v, (g, n, r) => {
  const gr = g.createLinearGradient(0, 0, n, n); gr.addColorStop(0, '#13221b'); gr.addColorStop(1, '#0c1611'); rc(g, 0, 0, n, n, gr);
  const trees = Array.from({ length: 9 }, () => ({ x: 6 + r() * 52, y: 12 + r() * 48, s: 0.8 + r() * 0.6, k: r() < .45 })).sort((a, b) => a.y - b.y);
  for (const t of trees) {
    ell(g, t.x + 3, t.y + 1, 9 * t.s, 3.2 * t.s, 'rgba(0,0,0,.45)'); rc(g, t.x - 1, t.y - 4 * t.s, 2, 5 * t.s, '#3a2a1c');
    if (t.k) {
      for (let i = 0; i < 3; i++) { const yy = t.y - 5 * t.s - i * 5.5 * t.s, w = (9 - i * 2.2) * t.s, grd = g.createLinearGradient(t.x - w, yy, t.x + w, yy); grd.addColorStop(0, '#356038'); grd.addColorStop(.5, '#457a44'); grd.addColorStop(1, '#173a22'); poly(g, [[t.x - w, yy + 5 * t.s], [t.x, yy - 6 * t.s], [t.x + w, yy + 5 * t.s]], grd, 'rgba(0,0,0,.35)'); }
    } else {
      const yy = t.y - 9 * t.s, rad = 9.5 * t.s, grd = g.createRadialGradient(t.x - 3, yy - 3, 1, t.x, yy, rad); grd.addColorStop(0, '#7ea652'); grd.addColorStop(.5, '#3a6a34'); grd.addColorStop(1, '#183a24'); g.beginPath(); g.arc(t.x, yy, rad, 0, 7); g.fillStyle = grd; g.fill(); g.strokeStyle = 'rgba(0,0,0,.3)'; g.stroke();
      for (let k = 0; k < 4; k++) rc(g, t.x - rad * .6 + r() * rad * 1.1, yy - rad * .6 + r() * rad * 1.1, 2, 1.4, 'rgba(210,240,150,.2)');
    }
  }
}, 64);
TERRAIN.wild = v => mk('wild2_' + v, (g, n, r) => {
  const gr = g.createLinearGradient(0, 0, n, n); gr.addColorStop(0, '#2a2f2c'); gr.addColorStop(1, '#1c2220'); rc(g, 0, 0, n, n, gr);
  for (let i = 0; i < 70; i++) rc(g, r() * n, r() * n, 1 + r() * 3, 1 + r() * 2, r() < .5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.2)');
  for (let i = 0; i < 3; i++) { ell(g, 8 + r() * 48, 8 + r() * 48, 6 + r() * 6, 3 + r() * 3, 'rgba(70,58,38,.28)'); }
  g.lineCap = 'round'; for (let i = 0; i < 14; i++) { const x = 4 + r() * 56, y = 8 + r() * 52; g.strokeStyle = r() < .5 ? '#4a5a34' : '#3a4a2a'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 1, y - 3); g.moveTo(x, y); g.lineTo(x + 1.4, y - 2.6); g.moveTo(x, y); g.lineTo(x + .2, y - 3.6); g.stroke(); }
  if (v % 2 === 0) { const x = 10 + r() * 40, y = 20 + r() * 30; ell(g, x + 1, y + 3, 6, 2, 'rgba(0,0,0,.4)'); poly(g, [[x - 5, y + 2], [x - 3, y - 3], [x + 2, y - 4], [x + 6, y], [x + 5, y + 3]], '#59626a', KI); poly(g, [[x - 3, y - 3], [x + 2, y - 4], [x + 3, y - 1], [x - 2, y]], '#8a949b'); }
  g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 1; g.beginPath(); let x = r() * n, y = r() * n; g.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (r() - .5) * 18; y += (r() - .5) * 18; g.lineTo(x, y); } g.stroke();
}, 64);

/* ---------------- features from the shared toolkit ---------------- */
const nodeDraw = { food: drawRations, oil: drawFuel, energy: drawPower, steel: drawAlloy };
const nodeKey = { food: 'rations', oil: 'fuel', energy: 'power', steel: 'alloy' };
function nodeSprite(nk, g) { const gr = clamp(g || 3, 1, 6), t = gradeTier(gr); return svgSprite('nd_' + nk + gr, nodeDraw[nk](t, t * 5), 96); }
const FEAT2 = {
  food: g => nodeSprite('food', g), oil: g => nodeSprite('oil', g), energy: g => nodeSprite('energy', g), steel: g => nodeSprite('steel', g),
  monster: g => svgSprite('mn_' + clamp(g || 1, 1, 6), monsterArt(g), 96),
  camp: () => svgSprite('camp2', campArt(), 96),
  /* enemy bases look exactly like the player's base: bot rank 1-5 picks the same five levels as Command Center tiers 1-5 */
  base: p => { const L = [1, 5, 10, 15, 20][clamp(p || 1, 1, 5) - 1]; return svgSprite('hq_' + L, stripSvg(ccSVG(L)), 96); },
  pbase: L => svgSprite('hq_' + Math.max(1, L), stripSvg(ccSVG(Math.max(1, L))), 96),
  citadel: () => svgSprite('cit2', citadelArt(), 256)
};
function monsterArt(g) {
  const big = g >= 5, mid = g >= 3, sc = big ? 1.15 : mid ? 1 : .86, body = big ? '#3a1410' : mid ? '#4a1c14' : '#5a2a1c', rim = big ? '#ff6a3a' : RED;
  let s = EL(32, 54, 24 * sc, 6 * sc, 'rgba(0,0,0,.55)');
  s += `<g transform="translate(32 34) scale(${sc}) translate(-32 -34)">`;
  for (let i = 0; i < (big ? 11 : 8); i++) { const a = -Math.PI * 0.95 + i * (Math.PI * 0.95 / (big ? 10 : 7)), x = 32 + Math.cos(a) * 15, y = 34 + Math.sin(a) * 12; s += P([[32 + Math.cos(a) * 9, 34 + Math.sin(a) * 7], [x + Math.cos(a) * 6, y + Math.sin(a) * 6], [32 + Math.cos(a + .35) * 12, 34 + Math.sin(a + .35) * 9]], '#6b2a1a', KI, .5); }
  s += EL(32, 40, 17, 11, body, `stroke="${KI}" stroke-width=".8"`) + EL(32, 40, 17, 11, 'url(#gCyl)') + P([[18, 40], [12, 50], [17, 52], [22, 46]], body, KI, .5) + P([[46, 40], [52, 50], [47, 52], [42, 46]], body, KI, .5);
  s += P([[20, 34], [26, 22], [38, 22], [44, 34], [32, 38]], body, KI, .8) + P([[20, 34], [26, 22], [38, 22], [44, 34], [32, 38]], 'url(#gF)');
  s += P([[24, 24], [22, 15], [28, 22]], '#8a8a7a', KI, .5) + P([[40, 24], [42, 15], [36, 22]], '#8a8a7a', KI, .5);
  s += [26, 38].map(x => `${EL(x, 30, 3.6, 2.6, rim, `class="glw"`)}${EL(x, 30, 1.2, 1.8, '#fff3c0')}${glow(x, 30, 6, 'gGA')}`).join('');
  s += `<path d="M25 35l3 3 4-3 4 3 3-3" fill="none" stroke="#f0d6b0" stroke-width="1.4" stroke-linejoin="round"/>`;
  if (big) s += `<path d="M28 20l2-6 2 6 2-6 2 6" fill="none" stroke="${BR}" stroke-width="1.4"/>`;
  return s + '</g>';
}
function campArt() {
  let s = EL(32, 54, 26, 6, 'rgba(0,0,0,.5)') + P([[6, 44], [12, 50], [52, 50], [58, 44]], '#3a3320', null);
  s += tent(6, 48, 24, 20, '#5a3328', 'rgba(0,0,0,.4)') + tent(30, 50, 26, 22, '#4a2a22', 'rgba(0,0,0,.4)');
  s += LN(46, 28, 46, 10, '#9aa4a8', 1.4) + P([[46, 10], [58, 14], [46, 19]], RED, KI, .5) + `<path d="M50 14l2 1.4-2 1.4" stroke="#fff" fill="none" stroke-width=".8"/>`;
  s += LN(14, 54, 20, 50, '#3a2a1c', 1.6) + LN(20, 54, 14, 50, '#3a2a1c', 1.6) + `<path d="M17 51q-3-5 0-8 3 3 0 8z" fill="#ffb347" class="flm"/><path d="M17 50q-1.4-3 0-5 1.4 2 0 5z" fill="#fff3c0" class="flm"/>` + glow(17, 48, 8) + barrel(56, 56, '#5a3328') + sandbags(28, 58, 5);
  return s;
}
function outpostArt() {
  const m = MAT[3]; let s = EL(32, 56, 28, 6, 'rgba(0,0,0,.55)');
  s += P([[4, 50], [12, 22], [52, 22], [60, 50], [50, 60], [14, 60]], '#2a3237', KI, .8) + P([[4, 50], [12, 22], [52, 22], [60, 50], [50, 60], [14, 60]], 'url(#gT)');
  s += box(14, 50, 26, 14, 9, m, { trim: BR }) + wins(17, 40, 4, 1, m, 3, 3, 2.2, 0, 1) + door(24, 50, 6, 7) + box(42, 52, 10, 20, 6, m) + RC(41, 28, 12, 4, m.roof, KI, .5) + light(47, 26) + mast(20, 36, 14, m, 1);
  return s;
}
function citadelArt() {
  const m = MAT[5]; let s = '';
  s += EL(32, 50, 30, 12, 'rgba(0,0,0,.5)') + P([[32, 8], [58, 22], [58, 44], [32, 58], [6, 44], [6, 22]], '#1e262b', BR, 1.6) + P([[32, 8], [58, 22], [58, 44], [32, 58], [6, 44], [6, 22]], 'url(#gT)');
  s += P([[32, 16], [51, 26], [51, 42], [32, 52], [13, 42], [13, 26]], '#2a3237', 'rgba(224,164,74,.6)', .8);
  for (const [x, y] of [[32, 9], [57, 23], [57, 44], [32, 57], [7, 44], [7, 23]]) s += RC(x - 2, y - 6, 4, 9, m.f, KI, .5) + CI(x, y - 7, 2, BR, 'class="glw"');
  s += box(20, 46, 24, 8, 9, m, { trim: BR }) + box(23, 40, 18, 8, 7, m, { trim: BR }) + box(26, 34, 12, 12, 5, m, { trim: BR });
  s += P([[26, 22], [32, 10], [38, 22]], m.t, KI, .6) + P([[26, 22], [32, 10], [32, 22]], 'rgba(255,255,255,.2)') + RC(30.6, 8, 2.8, 4, BR) + LN(32, 8, 32, 2, '#fff3c0', 1.2);
  s += wins(24, 42, 5, 1, m, 2, 2, 1.8, 0, 1);
  return s;
}
Object.assign(FEAT, { base: FEAT2.base, pbase: FEAT2.pbase, citadel: FEAT2.citadel, monster: FEAT2.monster, camp: FEAT2.camp, food: FEAT2.food, oil: FEAT2.oil, energy: FEAT2.energy, steel: FEAT2.steel });
