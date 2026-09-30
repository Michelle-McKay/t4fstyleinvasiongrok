'use strict';
/* IRON MARCH — art v3, part 3: monsters, raider camps, ground tiles, march tokens and resource icons. Replaces the versions in art.js / art4.js. */

/* ================= MONSTERS ================= */
const MN = { hide: '#4a3a34', hide2: '#6a5044', dark: '#211712', ember: '#ff7a3a', hot: '#ffd08a', bone: '#e8dcc0' };
const eyeGlow = (x, y, r) => EL(x, y, r * 1.5, r, '#ff9a4a', 'class="glw"') + EL(x, y, r * .6, r * .8, '#fff3c0') + CI(x, y, r * 3, 'url(#gGA)', 'class="glw"');
function ashHound() {
  let s = EL(32, 54, 24, 4.4, 'rgba(0,0,0,.5)');
  const leg = (x, back, far) => P([[x, 38], [x + 6, 38], [x + 7, 46], [x + 10, 53], [x + 3, 53], [x + 2, 47]], far ? '#2c201b' : MN.hide, KI, .6) + (far ? '' : P([[x, 38], [x + 6, 38], [x + 7, 46], [x + 2, 47]], 'url(#gCyl)')) + (far ? '' : P([[x + 3, 53], [x + 10, 53], [x + 11, 55], [x + 2, 55]], MN.dark, KI, .4));
  s += leg(15, 1, 1) + leg(36, 0, 1);
  // tail
  s += `<path d="M13 32c-6-3-9-9-7-15 3 5 8 7 12 10z" fill="${MN.hide}" stroke="${KI}" stroke-width=".7"/><path d="M6 17l3 3M9 20l2 1" stroke="${MN.ember}" stroke-width=".8"/>`;
  // body
  s += `<path d="M12 38c-2-8 3-15 13-16 8-1 14 1 19 6l2 10c-6 5-16 6-24 5z" fill="${MN.hide}" stroke="${KI}" stroke-width=".9"/><path d="M12 38c-2-8 3-15 13-16 8-1 14 1 19 6l2 10c-6 5-16 6-24 5z" fill="url(#uMetal)"/>`;
  s += `<path d="M16 42c8 4 18 3 26-1" stroke="rgba(0,0,0,.35)" stroke-width="3" fill="none"/>`;
  // ember cracks
  s += `<path d="M20 30l4 3-2 4 5 2M30 27l3 4-3 3" stroke="${MN.ember}" stroke-width="1.1" fill="none" stroke-linecap="round" class="glw"/>`;
  // back spikes
  for (let i = 0; i < 6; i++) { const x = 16 + i * 5.2, y = 26.6 - Math.sin(i / 5 * 3.14) * 2.4; s += P([[x, y + 1], [x + 2.4, y - 5.6], [x + 4.6, y + 1]], MN.bone, KI, .5); }
  // near legs
  s += leg(12, 1, 0) + leg(32, 0, 0);
  // head
  s += `<path d="M40 22c6-1 11 1 14 5l6 3-2 4-8 1 5 2-3 4-9 1c-4 0-7-4-7-9z" fill="${MN.hide2}" stroke="${KI}" stroke-width=".9"/><path d="M40 22c6-1 11 1 14 5l6 3-2 4-8 1 5 2-3 4-9 1c-4 0-7-4-7-9z" fill="url(#uMetal)"/>`;
  s += `<path d="M46 32l3 4 2-3 2 3 2-4" fill="${MN.bone}" stroke="${KI}" stroke-width=".5"/><path d="M50 30l7 1" stroke="${KI}" stroke-width=".8"/>` + P([[41, 22], [42, 14], [46, 21]], MN.bone, KI, .5) + P([[47, 21], [50, 14], [52, 22]], MN.bone, KI, .5);
  s += eyeGlow(49.5, 27, 1.5) + CI(60, 30.6, 1, KI);
  return s;
}
function rustBrute() {
  let s = EL(32, 55, 26, 5, 'rgba(0,0,0,.55)');
  s += P([[19, 40], [28, 40], [28, 54], [16, 54]], MN.hide, KI, .7) + P([[34, 40], [45, 40], [48, 54], [34, 54]], MN.hide, KI, .7) + P([[15, 53], [29, 53], [30, 56], [14, 56]], MN.dark, KI, .5) + P([[34, 53], [49, 53], [50, 56], [33, 56]], MN.dark, KI, .5);
  // long arms
  s += `<path d="M14 24c-7 6-9 16-6 25l8 1c-1-8 0-14 6-20z" fill="${MN.hide}" stroke="${KI}" stroke-width=".8"/><path d="M14 24c-7 6-9 16-6 25l8 1c-1-8 0-14 6-20z" fill="url(#gCyl)"/>`;
  s += CI(11.6, 51, 6, MN.hide2, `stroke="${KI}" stroke-width=".8"`) + CI(9.6, 49.6, 1.4, 'rgba(255,255,255,.3)');
  // torso
  s += `<path d="M18 26c4-6 24-6 30 0l4 16c-2 5-10 6-19 6s-17-1-19-6z" fill="${MN.hide}" stroke="${KI}" stroke-width=".9"/><path d="M18 26c4-6 24-6 30 0l4 16c-2 5-10 6-19 6s-17-1-19-6z" fill="url(#uMetal)"/>`;
  s += `<path d="M24 36q9 6 18 0M26 42q7 4 14 0" stroke="rgba(0,0,0,.4)" stroke-width="1.4" fill="none"/><path d="M28 30l3 5-2 3M38 31l-2 4 3 3" stroke="${MN.ember}" stroke-width="1" fill="none" class="glw"/>`;
  // scrap plate pauldron and chain
  s += sp([[14, 22], [30, 20], [32, 28], [16, 32]], '#7a6a56') + rivets(18, 25, 3, 5, '#e8dcc0') + `<path d="M22 21l3 8" stroke="${RED}" stroke-width="1.2"/>` + `<path d="M28 32q8 8 16 0" stroke="#8b979d" stroke-width="1.6" fill="none" stroke-dasharray="2 1.4"/>`;
  s += `<path d="M46 24c6 6 8 16 6 25l-8 1c1-8 0-14-5-20z" fill="${MN.hide}" stroke="${KI}" stroke-width=".8"/>` + CI(49.6, 51, 6.6, MN.hide2, `stroke="${KI}" stroke-width=".8"`);
  // head
  s += `<path d="M24 20c0-8 5-11 10-11s10 3 10 11c0 5-4 8-10 8s-10-3-10-8z" fill="${MN.hide2}" stroke="${KI}" stroke-width=".9"/><path d="M24 20c0-8 5-11 10-11s10 3 10 11c0 5-4 8-10 8s-10-3-10-8z" fill="url(#uMetal)"/>`;
  s += P([[25, 14], [20, 4], [30, 11]], MN.bone, KI, .6) + P([[43, 14], [48, 4], [38, 11]], MN.bone, KI, .6);
  s += `<path d="M27 20l5 2 5-2" stroke="${KI}" stroke-width="1.4" fill="none"/>` + eyeGlow(29.4, 18.6, 1.7) + eyeGlow(38.6, 18.6, 1.7);
  s += `<path d="M27 24.6l2 3 2-3 2 3 2-3 2 3 2-3" fill="${MN.bone}" stroke="${KI}" stroke-width=".5"/><path d="M26 24.4h16" stroke="${KI}" stroke-width=".9"/>`;
  return s;
}
function emberColossus() {
  let s = EL(32, 57, 29, 5, 'rgba(0,0,0,.6)') + CI(32, 40, 30, 'url(#gGA)', 'class="glw"');
  const leg = x => P([[x, 40], [x + 11, 40], [x + 12, 54], [x - 2, 54]], '#2c1e19', KI, .8) + P([[x, 40], [x + 11, 40], [x + 12, 54], [x - 2, 54]], 'url(#gCyl)') + P([[x - 4, 53], [x + 14, 53], [x + 15, 57], [x - 5, 57]], '#150f0c', KI, .6) + `<path d="M${x + 3} 44l3 4-2 4" stroke="${MN.ember}" stroke-width="1.2" fill="none" class="glw"/>`;
  s += leg(14) + leg(37);
  s += `<path d="M4 20c-4 10-4 22 0 32l10 1c-2-10-2-18 4-26z" fill="#33231d" stroke="${KI}" stroke-width=".9"/><path d="M4 20c-4 10-4 22 0 32l10 1c-2-10-2-18 4-26z" fill="url(#gCyl)"/>` + CI(8, 52, 7.4, '#3a2a24', `stroke="${KI}" stroke-width=".9"`) + `<path d="M5 49l3 3M9 48l-1 5" stroke="${MN.ember}" stroke-width="1" class="glw"/>`;
  s += `<path d="M60 20c4 10 4 22 0 32l-10 1c2-10 2-18-4-26z" fill="#33231d" stroke="${KI}" stroke-width=".9"/>` + CI(56, 52, 7.4, '#3a2a24', `stroke="${KI}" stroke-width=".9"`);
  s += `<path d="M12 26c4-8 36-8 40 0l3 16c-2 6-10 8-23 8s-21-2-23-8z" fill="#3a2922" stroke="${KI}" stroke-width="1"/><path d="M12 26c4-8 36-8 40 0l3 16c-2 6-10 8-23 8s-21-2-23-8z" fill="url(#uMetal)"/>`;
  s += `<path d="M20 30l6 5-3 5 5 4M44 30l-5 6 3 5M32 26v8" stroke="${MN.ember}" stroke-width="1.5" fill="none" stroke-linecap="round" class="glw"/><path d="M20 30l6 5-3 5 5 4M44 30l-5 6 3 5M32 26v8" stroke="${MN.hot}" stroke-width=".5" fill="none"/>`;
  s += CI(32, 39, 6, '#3a0f08', `stroke="${MN.ember}" stroke-width="1.2"`) + CI(32, 39, 3.4, MN.hot, 'class="glw"') + CI(32, 39, 12, 'url(#uFire)', 'class="glw"');
  // pauldron spikes
  for (const [x, y, d] of [[10, 24, -1], [18, 19, -1], [54, 24, 1], [46, 19, 1]]) s += P([[x - 4, y + 8], [x + d * 3, y - 8], [x + 4, y + 8]], '#2a1c17', KI, .7) + P([[x - 4, y + 8], [x + d * 3, y - 8], [x, y + 8]], 'rgba(255,140,70,.35)');
  // head + crown
  s += `<path d="M24 20c0-8 4-11 8-11s8 3 8 11c0 5-3 7-8 7s-8-2-8-7z" fill="#4a3329" stroke="${KI}" stroke-width=".9"/>` + P([[24, 14], [22, 4], [28, 10], [32, 2], [36, 10], [42, 4], [40, 14]], '#5a3a2c', KI, .7) + P([[24, 14], [22, 4], [28, 10]], 'rgba(255,160,90,.4)');
  s += eyeGlow(28.6, 18, 1.7) + eyeGlow(35.4, 18, 1.7) + `<path d="M27 23.4q5 3 10 0" stroke="${MN.ember}" stroke-width="1.4" fill="none" class="glw"/>`;
  // embers
  s += [[14, 12], [50, 10], [56, 30], [8, 34]].map(([x, y], i) => CI(x, y, 1, '#ffb347', `class="${i % 2 ? 'glw' : 'blink'}"`)).join('');
  return s;
}
const monsterArt3 = g => g >= 5 ? emberColossus() : g >= 3 ? rustBrute() : ashHound();
monsterArt = monsterArt3;
FEAT.monster = FEAT2.monster = g => svgSprite('mn_' + clamp(g || 1, 1, 6), monsterArt3(g), 96);

/* ================= RAIDER CAMP ================= */
function campArt3() {
  let s = EL(32, 55, 28, 6, 'rgba(0,0,0,.5)') + P([[3, 46], [10, 55], [54, 55], [61, 46], [32, 40]], '#3a3320', KI, .6) + P([[3, 46], [10, 55], [54, 55], [61, 46], [32, 40]], 'url(#gT)');
  // palisade
  const stake = (x, y, h) => P([[x - 1.6, y], [x - 1.6, y - h], [x, y - h - 3.4], [x + 1.6, y - h], [x + 1.6, y]], '#6a4c30', KI, .5) + P([[x - 1.6, y], [x - 1.6, y - h], [x, y - h - 3.4], [x, y]], 'rgba(255,255,255,.14)');
  for (let i = 0; i < 9; i++) s += stake(6 + i * 6.2, 38 + Math.abs(i - 4) * -0 + (i === 0 || i === 8 ? 6 : 0), 12);
  s += LN(6, 32, 56, 32, '#3a2a1c', 1.2);
  // tents
  s += tent(6, 51, 24, 20, '#5a3328', 'rgba(0,0,0,.42)') + tent(30, 53, 26, 22, '#4a2a22', 'rgba(0,0,0,.42)') + P([[18, 38], [18, 51], [10, 51]], 'rgba(0,0,0,.25)');
  s += P([[15, 51], [18, 45], [21, 51]], '#0d0806', KI, .4) + P([[39, 53], [43, 46], [47, 53]], '#0d0806', KI, .4) + LN(18, 31, 18, 34, '#e8dcc0', 1);
  // watch tower + banner
  s += RC(50, 16, 2.4, 22, '#4a3a26', KI, .4) + RC(58, 16, 2.4, 22, '#4a3a26', KI, .4) + RC(47, 12, 16, 5, '#5a4630', KI, .5) + P([[46, 12], [55, 5], [64, 12]], '#3a2a1c', KI, .5) + LN(55, 5, 55, -1, '#9aa4a8', 1) + P([[55, -1], [64, 2], [55, 5]], RED, KI, .4) + CI(58.6, 2.4, 1.1, '#f0d6b0');
  // fire + smoke
  s += `<path d="M28 52l-3 4M28 52l3 4" stroke="#3a2a1c" stroke-width="1.8"/><path d="M28 51q-4-6 0-11 4 4 0 11z" fill="#ffb347" class="flm"/><path d="M28 50q-2-4 0-7 2 3 0 7z" fill="#fff3c0" class="flm"/>` + glow(28, 46, 9) + `<circle cx="29" cy="34" r="2.2" fill="rgba(180,180,180,.35)" class="smoke"/><circle cx="31" cy="30" r="2.8" fill="rgba(160,160,160,.22)" class="smoke"/>`;
  s += barrel(56, 56, '#5a3328') + crate(2, 57, 6, '#6a4a2a') + `<circle cx="44" cy="56" r="1.4" fill="${MN.bone}"/><path d="M42 56h5" stroke="${MN.bone}" stroke-width=".8"/>`;
  return s;
}
campArt = campArt3;
FEAT.camp = FEAT2.camp = () => svgSprite('camp3', campArt3(), 96);

/* ================= GROUND TILES ================= */
const spk = (g, r, n, cols, s0, s1) => { for (let i = 0; i < n; i++) rc(g, Math.floor(r() * 64), Math.floor(r() * 64), s0 + r() * (s1 - s0), 1 + r() * (s1 - s0) * .6, cols[Math.floor(r() * cols.length)]); };
const pebble = (g, x, y, s, c) => { ell(g, x + 1, y + s * .5, s * 1.1, s * .5, 'rgba(0,0,0,.38)'); const gr = g.createLinearGradient(x - s, y - s, x + s, y + s); gr.addColorStop(0, c[0]); gr.addColorStop(1, c[1]); g.beginPath(); g.ellipse(x, y, s, s * .78, 0, 0, 7); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = .6; g.stroke(); rc(g, x - s * .5, y - s * .55, s * .7, .9, 'rgba(255,255,255,.28)'); };
const tuft = (g, x, y, c) => { g.strokeStyle = c; g.lineWidth = .9; g.lineCap = 'round'; g.beginPath(); for (const d of [-2.4, -.8, 1, 2.6]) { g.moveTo(x, y); g.lineTo(x + d, y - 3 - Math.abs(d) * .4); } g.stroke(); };
TERRAIN.wild = v => mk('wild3_' + v, (g, n, r) => {
  const tone = [['#2a2f2b', '#242a27'], ['#2d302a', '#262a25'], ['#292f2f', '#232929'], ['#2c2e28', '#252722']][v % 4];
  rc(g, 0, 0, n, n, tone[0]);
  for (let i = 0; i < 3; i++) { const x = 12 + r() * 40, y = 12 + r() * 40; const gr = g.createRadialGradient(x, y, 1, x, y, 18 + r() * 8); gr.addColorStop(0, tone[1]); gr.addColorStop(1, tone[0]); g.globalAlpha = .55; g.fillStyle = gr; g.fillRect(0, 0, 64, 64); g.globalAlpha = 1; }
  spk(g, r, 90, ['rgba(255,255,255,.035)', 'rgba(0,0,0,.18)', 'rgba(120,110,80,.06)'], 1, 3);
  // dry-earth cracks
  g.strokeStyle = 'rgba(0,0,0,.34)'; g.lineWidth = .9; g.lineCap = 'round'; g.lineJoin = 'round';
  for (let k = 0; k < 2 + (v % 2); k++) { g.beginPath(); let x = 6 + r() * 52, y = 6 + r() * 52; g.moveTo(x, y); for (let j = 0; j < 5; j++) { x += (r() - .5) * 16; y += (r() - .5) * 16; g.lineTo(clamp(x, 1, 63), clamp(y, 1, 63)); if (r() < .3) { g.moveTo(x, y); g.lineTo(clamp(x + (r() - .5) * 9, 1, 63), clamp(y + (r() - .5) * 9, 1, 63)); g.moveTo(x, y); } } g.stroke(); }
  g.strokeStyle = 'rgba(255,255,255,.04)'; g.lineWidth = .6; g.beginPath(); g.moveTo(8, 9); g.lineTo(30, 14); g.stroke();
  // scorched patch
  if (v === 2) { ell(g, 32, 34, 11, 6, 'rgba(0,0,0,.22)'); ell(g, 32, 34, 6, 3.2, 'rgba(0,0,0,.2)'); }
  // dead grass tufts
  for (let i = 0; i < 4 + (v % 2) * 2; i++) tuft(g, 6 + r() * 52, 12 + r() * 46, r() < .5 ? '#5c6a3c' : '#6a6a40');
  // rocks / debris
  if (v === 0 || v === 4) { pebble(g, 18, 40, 5, ['#6b747a', '#3a4247']); pebble(g, 27, 45, 3, ['#79828a', '#454c52']); pebble(g, 46, 24, 3.4, ['#6b747a', '#3a4247']); }
  else if (v === 5) { g.save(); g.translate(36, 36); g.rotate(-.35); ell(g, 1, 2, 7, 2, 'rgba(0,0,0,.35)'); rc(g, -6, -2.4, 12, 5, '#3f3a34'); rc(g, -6, -2.4, 12, 1.2, '#5a5044'); for (const x of [-3.6, 3]) rc(g, x, -.8, 1, 1, '#a89460'); g.restore(); pebble(g, 12, 18, 3, ['#79828a', '#454c52']); }
  else if (v === 3 || v === 7) { pebble(g, 44, 42, 4.4, ['#6b747a', '#3a4247']); pebble(g, 22, 22, 2.8, ['#79828a', '#454c52']); pebble(g, 15, 50, 2.2, ['#79828a', '#454c52']); }
}, 64);
TERRAIN.forest = v => mk('forest3_' + v, (g, n, r) => {
  const gr = g.createLinearGradient(0, 0, n, n); gr.addColorStop(0, '#15271d'); gr.addColorStop(1, '#0d1913'); rc(g, 0, 0, n, n, gr);
  for (let i = 0; i < 6; i++) ell(g, r() * 64, r() * 64, 8 + r() * 10, 5 + r() * 6, 'rgba(60,90,40,.18)');
  spk(g, r, 60, ['rgba(140,180,90,.09)', 'rgba(0,0,0,.25)'], 1, 2);
  const trees = Array.from({ length: 10 }, () => ({ x: 8 + r() * 48, y: 16 + r() * 42, s: .78 + r() * .55, k: r() < .48, h: r() })).sort((a, b) => a.y - b.y);
  for (const t of trees) {
    ell(g, t.x + 3.6, t.y + 1, 9.5 * t.s, 3.4 * t.s, 'rgba(0,0,0,.5)'); rc(g, t.x - 1.2, t.y - 4.4 * t.s, 2.4, 5.4 * t.s, '#3a2a1c'); rc(g, t.x - 1.2, t.y - 4.4 * t.s, .9, 5.4 * t.s, 'rgba(255,255,255,.12)');
    if (t.k) for (let i = 0; i < 3; i++) { const yy = t.y - 5 * t.s - i * 5.6 * t.s, w = (9.4 - i * 2.3) * t.s, grd = g.createLinearGradient(t.x - w, yy, t.x + w, yy); grd.addColorStop(0, '#3a6a3e'); grd.addColorStop(.42, '#43794a'); grd.addColorStop(1, '#16371f'); poly(g, [[t.x - w, yy], [t.x, yy - 8 * t.s], [t.x + w, yy]], grd, 'rgba(5,15,8,.7)'); rc(g, t.x - w * .3, yy - 5.4 * t.s, w * .34, .8, 'rgba(210,240,160,.35)'); }
    else { const yy = t.y - 9.6 * t.s, rad = 9.8 * t.s, grd = g.createRadialGradient(t.x - 3.4, yy - 3.4, 1, t.x, yy, rad); grd.addColorStop(0, t.h < .3 ? '#93a24e' : '#6f9a4c'); grd.addColorStop(.5, '#3f7538'); grd.addColorStop(1, '#173a24'); g.beginPath(); g.arc(t.x, yy, rad, 0, 7); g.fillStyle = grd; g.fill(); g.strokeStyle = 'rgba(5,15,8,.6)'; g.lineWidth = .7; g.stroke(); for (let k = 0; k < 6; k++) rc(g, t.x - rad * .6 + r() * rad * 1.1, yy - rad * .6 + r() * rad * 1.1, 2, 1.4, 'rgba(220,245,160,.24)'); ell(g, t.x + rad * .3, yy + rad * .5, rad * .6, rad * .3, 'rgba(0,0,0,.18)'); }
  }
}, 64);
TERRAIN.plaza = v => mk('plaza3_' + v, (g, n, r) => {
  rc(g, 0, 0, n, n, '#363d42');
  for (const [x, y, w, h] of [[0, 0, 32, 32], [32, 0, 32, 32], [0, 32, 32, 32], [32, 32, 32, 32]]) { const tn = 4 + Math.floor(r() * 8); rc(g, x + 1, y + 1, w - 2, h - 2, `rgb(${50 + tn},${58 + tn},${64 + tn})`); rc(g, x + 1, y + 1, w - 2, 1.4, 'rgba(255,255,255,.1)'); rc(g, x + 1, y + 1, 1.4, h - 2, 'rgba(255,255,255,.07)'); rc(g, x + 1, y + h - 2, w - 2, 1.2, 'rgba(0,0,0,.28)'); }
  g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(32, 0); g.lineTo(32, 64); g.moveTo(0, 32); g.lineTo(64, 32); g.stroke(); g.strokeRect(.7, .7, 62.6, 62.6);
  spk(g, r, 90, ['rgba(255,255,255,.05)', 'rgba(0,0,0,.14)'], 1, 2.4);
  g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = .7; g.beginPath(); let x = 6 + r() * 20, y = 6 + r() * 20; g.moveTo(x, y); for (let j = 0; j < 4; j++) { x += 3 + r() * 6; y += (r() - .3) * 8; g.lineTo(x, y); } g.stroke();
  if (v % 2) ell(g, 40, 22, 7, 4, 'rgba(0,0,0,.22)');
  if (v === 0) for (const [cx, cy] of [[6, 6], [58, 6], [6, 58], [58, 58]]) { g.beginPath(); g.arc(cx, cy, 2.6, 0, 7); g.fillStyle = '#e0a44a'; g.fill(); g.strokeStyle = '#3a2a10'; g.lineWidth = .7; g.stroke(); rc(g, cx - 1, cy - 1.4, 1.2, 1, 'rgba(255,255,255,.7)'); }
  if (v === 1) { g.fillStyle = 'rgba(224,164,74,.28)'; for (const [cx, cy, d] of [[3, 3, 1], [61, 61, -1]]) { g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + d * 12, cy); g.lineTo(cx, cy + d * 12); g.fill(); } }
}, 64);
for (const k in SP) if (/^(wild|forest|plaza)\d?$|^(wild|forest)2_/.test(k)) delete SP[k];

/* ================= MARCH TOKENS (drawn on the map, replace the plain arrows) ================= */
function domClass(col) {
  const t = {}; for (const k in col || {}) { const c = k.slice(0, -1); t[c] = (t[c] || 0) + col[k] * (+k.slice(-1) || 1); }
  let best = 'inf', bv = -1; for (const c in t) if (t[c] > bv) { bv = t[c]; best = c; } return best;
}
function domTier(col, cls) { let bt = 1, bv = -1; for (const k in col || {}) if (k.slice(0, -1) === cls && col[k] > bv) { bv = col[k]; bt = +k.slice(-1); } return bt; }
function marchToken(cls, tier, hostile) {
  const rim = hostile ? RED : BR, nm = 'tok_' + cls + tier + (hostile ? 'h' : '');
  const inner = `<defs><clipPath id="tk${nm}"><circle cx="32" cy="32" r="26"/></clipPath></defs>` + CI(32, 32, 29.4, 'rgba(0,0,0,.45)', '') + CI(32, 32, 28, 'url(#uDisc)', `stroke="${rim}" stroke-width="3"`) + (hostile ? CI(32, 32, 28, 'rgba(212,101,74,.22)') : '') + CI(32, 32, 24.4, 'none', 'stroke="rgba(255,255,255,.16)" stroke-width=".8"') + `<g clip-path="url(#tk${nm})"><g transform="translate(6.4 7.4) scale(.8)">${stripSvg(unitSVG(cls, tier, { plate: false }))}</g></g>`;
  return svgSprite(nm, inner, 96);
}

/* ================= RESOURCE ICONS (filled, duotone) ================= */
const RESICON = {
  rations: `<path d="M12 22V9" stroke="#b9c98a" stroke-width="1.6" stroke-linecap="round"/>` + [7, 11, 15].map((y, i) => `<path d="M12 ${y}c4 0 5.4-2.4 5.4-5.6-3.4 0-5.4 2-5.4 5.6z" fill="${i === 0 ? '#c5d98a' : '#8ea36a'}" stroke="#2a3520" stroke-width=".6"/><path d="M12 ${y}c-4 0-5.4-2.4-5.4-5.6 3.4 0 5.4 2 5.4 5.6z" fill="${i === 0 ? '#d6e6a0' : '#a3b87a'}" stroke="#2a3520" stroke-width=".6"/>`).join('') + `<path d="M12 6c-2-1-2-3 0-3.6 2 .6 2 2.6 0 3.6z" fill="#e6ecb0" stroke="#2a3520" stroke-width=".5"/>`,
  fuel: `<path d="M12 2c4.6 5.4 7 9 7 12.6a7 7 0 0 1-14 0C5 11 7.4 7.4 12 2z" fill="#e07a2f" stroke="#3a1a08" stroke-width=".9"/><path d="M12 2c4.6 5.4 7 9 7 12.6a7 7 0 0 1-14 0C5 11 7.4 7.4 12 2z" fill="url(#gCyl)"/><path d="M12 11c2.4 2.4 3.2 4 3.2 5.6a3.2 3.2 0 0 1-6.4 0c0-1.6.8-3.2 3.2-5.6z" fill="#ffd08a"/><path d="M8.4 8.6c-1.4 2-2 3.6-1.8 5" stroke="rgba(255,255,255,.55)" stroke-width="1" fill="none" stroke-linecap="round"/>`,
  power: `<rect x="5" y="4" width="14" height="17" rx="2" fill="#1d5670" stroke="#0a2a38" stroke-width=".9"/><rect x="5" y="4" width="14" height="17" rx="2" fill="url(#gCyl)"/><rect x="9" y="1.8" width="6" height="3" rx="1" fill="#9aa4a8" stroke="#0a2a38" stroke-width=".6"/><path d="M13.4 7L8.6 13.4h3.2L10.6 19l5-7h-3.4z" fill="#8ff0ff" stroke="#0a2a38" stroke-width=".5" stroke-linejoin="round"/>`,
  alloy: `<path d="M3 17l3-6h12l3 6z" fill="#8b979d" stroke="#151b1e" stroke-width=".8"/><path d="M3 17l3-6h5l-3 6z" fill="rgba(255,255,255,.35)"/><rect x="3" y="17" width="18" height="4" fill="#4c5a62" stroke="#151b1e" stroke-width=".8"/><path d="M7 11l2.4-5h6.6l2.4 5z" fill="#b8c0c3" stroke="#151b1e" stroke-width=".8"/><path d="M7 11l2.4-5h3.2l-2.4 5z" fill="rgba(255,255,255,.5)"/>`,
  cash: `<rect x="2.6" y="6" width="18.8" height="12" rx="1.4" fill="#5a6b3a" stroke="#1c2410" stroke-width=".9"/><rect x="2.6" y="6" width="18.8" height="12" rx="1.4" fill="url(#gF)"/><rect x="4.4" y="7.8" width="15.2" height="8.4" fill="none" stroke="rgba(255,255,255,.35)" stroke-width=".6"/><circle cx="12" cy="12" r="3.6" fill="#e0a44a" stroke="#5a3a08" stroke-width=".8"/><path d="M12 9.8v4.4M10.6 11.2h2.4a.9.9 0 0 1 0 1.8h-2.4" stroke="#5a3a08" stroke-width=".8" fill="none"/>`,
  dia: `<path d="M12 21L2.6 9.4 6 3.6h12l3.4 5.8z" fill="#5ec4d4" stroke="#0a2a38" stroke-width=".9" stroke-linejoin="round"/><path d="M2.6 9.4h18.8M9 3.6l-1.6 5.8L12 21M15 3.6l1.6 5.8L12 21" stroke="#0a2a38" stroke-width=".6" fill="none" stroke-linejoin="round"/><path d="M6 3.6L8.4 9.4H2.6zM12 21l-4.6-11.6h9.2z" fill="rgba(255,255,255,.34)"/><path d="M15 3.6l1.6 5.8h4.8L18 3.6z" fill="rgba(0,60,80,.3)"/>`
};
const resSvg = (n, cls) => `<svg viewBox="0 0 24 24" ${cls ? `class="${cls}"` : ''} aria-hidden="true">${RESICON[n]}</svg>`;
