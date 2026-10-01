'use strict';
/* IRON MARCH — city scene: organic ground islands, winding roads, scenery and a horizon behind the base plots.
   Painted images (city_backdrop_N, city_horizon, city_pad_*, city_deco_*) are used when they are in the manifest; otherwise everything is drawn in code. */
const cityImg = k => (typeof ART !== 'undefined' && ART.file) ? ART.file(k) : null;
const cityTier = () => Math.max(1, Math.min(3, Math.ceil(tierOf(ccLevel()) / 2)));
function cityRand(seed) { let s = 2166136261; for (const c of seed) s = Math.imul(s ^ c.charCodeAt(0), 16777619); return () => { s = Math.imul(s ^ (s >>> 15), 2246822507); s ^= s >>> 13; return ((s >>> 0) % 10000) / 10000; }; }
/* ---------- layout: plots sit along the roads, ground is one soft terrain image per zone (baked once, so repaints never flicker) ---------- */
const CITY_W = 100;
const CITY = {
  cnc: {
    vh: 150,
    slots: [[13, 14], [31, 9], [69, 10], [87, 16], [50, 8],
      [11, 40], [30, 38], [70, 39], [89, 42], [50, 43],
      [9, 58], [25, 73], [50, 74], [75, 73], [91, 58],
      [12, 99], [31, 98], [69, 99], [88, 96], [50, 100],
      [13, 126], [31, 124], [69, 125], [87, 127], [50, 143]],
    roads: [
      [[-5, 27], [20, 20], [32, 34], [52, 27]], [[52, 27], [72, 20], [88, 34], [105, 29.5]],
      [[52, 27], [55, 20], [49, 14], [50, 14]],
      [[53, 89], [49, 102], [57, 112], [52, 120]], [[52, 120], [48, 128], [54, 134], [52, 137]],
      [[35, 85], [24, 88], [12, 83], [-5, 87]], [[65, 85], [76, 88], [88, 83], [105, 87.5]],
      [[-5, 112], [18, 106], [34, 116], [52, 112]], [[52, 112], [72, 106], [88, 117], [105, 114.5]]
    ],
    ring: [50, 74, 15, 14]
  },
  fld: { vh: 150, slots: [], roads: [], ring: null },
  wst: { vh: 150, w: 60, bare: true, slots: [], ring: null, roads: [[[65, 27], [48, 22], [25, 32], [-5, 26]], [[65, 87], [48, 90], [25, 84], [-5, 88]], [[65, 112], [48, 108], [25, 116], [-5, 110]]] },
  est: { vh: 150, w: 60, bare: true, slots: [], ring: null, roads: [[[-5, 29.5], [15, 33], [38, 25], [65, 29]], [[-5, 58.5], [18, 55], [40, 62], [65, 58]], [[-5, 87.5], [15, 91], [38, 84], [65, 88]], [[-5, 116.5], [18, 113], [40, 120], [65, 116]]] }
};
(function () { /* fields: three plots west and two east of a winding track, each row bending a little differently */
  const f = CITY.fld, r = cityRand('fld-slots');
  for (let row = 0; row < 5; row++) {
    const xs = [11, 28, 44, 72, 89];
    xs.forEach((x, c) => { const yb = 14 + row * 29, wave = 6 * Math.sin(x / 9 + row * 1.9); f.slots.push([+(x + (r() - .5) * 9 + (row % 2 ? 3 : -2)).toFixed(1), +(yb + wave + (r() - .5) * 6).toFixed(1)]); });
  }
  f.roads = [[[53, 6], [50, 20], [58, 40], [52, 56]], [[52, 56], [46, 72], [58, 86], [53, 100]], [[53, 100], [49, 114], [58, 128], [53, 144]]];
  [28.5, 57.5, 86.5, 115.5].forEach((y, i) => { const d = i % 2 ? -1 : 1; f.roads.push(i === 1 ? [[53, y], [42, y - 2], [30, y + 1], [14, y]] : [[53, y], [38, y - 3 * d], [20, y + 2 * d], [-5, y + d]]); f.roads.push([[56, y + 1], [72, y + 3], [88, y - 2], [105, y + 1]]); });
})();
/* Hand-made layout (Layout button on the base page): dragged positions are kept on the device and laid over the defaults. */
const LAY = { on: false, drag: null, data: (() => { try { const d = JSON.parse(localStorage.getItem('im_layout1')); if (d && d.slots && d.decor) return Object.assign({ extra: { cnc: [], fld: [] }, hide: { cnc: {}, fld: {} } }, d); } catch (e) { } return { slots: { cnc: {}, fld: {} }, decor: { cnc: {}, fld: {} }, extra: { cnc: [], fld: [] }, hide: { cnc: {}, fld: {} } }; })() };
/* what a wired piece can do: label -> the data-* attributes of the game button it stands in for */
const LAY_ACTS = { 'Open Train': { a: 'drawer', id: 'desk', tab: 'train' }, 'Open Lab': { a: 'drawer', id: 'desk', tab: 'lab' }, 'Open Medical': { a: 'wing', w: 'med' }, 'Open Wall': { a: 'wing', w: 'wall' }, 'Open Rally': { a: 'wing', w: 'rally' }, 'Open Items': { a: 'drawer', id: 'item', tab: 'bag' }, 'Open Missions': { a: 'drawer', id: 'mission', tab: 'mis' }, 'Open Mail': { a: 'drawer', id: 'mail', tab: 'rep' }, 'Open Alliance': { a: 'drawer', id: 'alliance', tab: 'throne' }, 'Open Heroes': { a: 'drawer', id: 'hero', tab: 'hero' }, 'Open Settings': { a: 'drawer', id: 'more', tab: 'menu' }, 'Open Rewards': { a: 'drawer', id: 'more', tab: 'rw' }, 'Supply drop': { a: 'supply' }, 'Free diamonds': { a: 'freedia' }, 'World map': { a: 'dock', k: 'map' }, 'Peace shield': { a: 'shield' } };
const layAttrs = a => { const o = LAY_ACTS[a]; return o ? Object.keys(o).map(k => `data-${k === 'a' ? 'a' : k}="${o[k]}"`).join(' ') : ''; };
const CITY_BASE = { cnc: CITY.cnc.slots.map(p => p.slice()), fld: CITY.fld.slots.map(p => p.slice()) };
const laySave = () => { try { localStorage.setItem('im_layout1', JSON.stringify(LAY.data)); } catch (e) { } };
const layApply = () => ['cnc', 'fld'].forEach(k => { CITY[k].slots = CITY_BASE[k].map(p => p.slice()); const o = LAY.data.slots[k] || {}; for (const i in o) if (CITY[k].slots[i]) CITY[k].slots[i] = o[i].slice(); });
layApply();
const bz = (s, t) => { const u = 1 - t; return [0, 1].map(k => u * u * u * s[0][k] + 3 * u * u * t * s[1][k] + 3 * u * t * t * s[2][k] + t * t * t * s[3][k]); };
const roadD = s => `M${s[0][0]} ${s[0][1]}C${s[1][0]} ${s[1][1]} ${s[2][0]} ${s[2][1]} ${s[3][0]} ${s[3][1]}`;
function cityRoadPts(L) { const o = []; L.roads.forEach(s => { for (let i = 0; i <= 12; i++) o.push(bz(s, i / 12)); }); if (L.ring) { const [cx, cy, rx, ry] = L.ring; for (let i = 0; i < 24; i++) o.push([cx + rx * Math.cos(i / 24 * 6.283), cy + ry * Math.sin(i / 24 * 6.283)]); } return o; }
const CITY_GROUND = {};
function cityGround(kind, pano) {
  const ck = kind + (pano ? '*' : ''); if (CITY_GROUND[ck]) return CITY_GROUND[ck];
  const L = CITY[kind], cnc = kind === 'cnc', vh = L.vh, W = L.w || CITY_W, r = cityRand('g' + kind);
  const P = cnc ? { grass: '#9bb06a', grass2: '#86a05a', base: '#c9b88a', apron: '#bdb7a8', apron2: '#d3cdbd', kerb: '#e4dfd0', road: '#555a5f', dash: '#ece4c6', pad: '#d9d3c3', padEdge: '#f3eddb' }
    : { grass: '#9bb06a', grass2: '#86a05a', base: '#c9b88a', apron: '#c9a56a', apron2: '#d8b97d', kerb: '#e0c795', road: '#a9875a', dash: '', pad: '#d9c08a', padEdge: '#f1e0b4' };
  const blob = (cx, cy, rx, ry, n, j) => { const p = []; for (let i = 0; i < n; i++) { const a = i / n * 6.283, k = 1 + (r() - .5) * j; p.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); } return 'M' + p.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L') + 'Z'; };
  let g = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${vh}"><defs>
    <filter id="rough" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="3" seed="${cnc ? 4 : 9}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="9"/><feGaussianBlur stdDeviation=".9"/></filter>
    <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 .25  0 0 0 0 .22  0 0 0 0 .16  0 0 0 .55 -.18" result="d"/><feComposite in="d" in2="SourceGraphic" operator="in"/></filter>
    <filter id="blur"><feGaussianBlur stdDeviation="1.4"/></filter>
    <filter id="blur2"><feGaussianBlur stdDeviation=".5"/></filter>
    </defs>`;
  if (!pano) g += `<g filter="url(#rough)"><path d="${blob(W / 2, vh / 2, 80 + (W < 100 ? 20 : 0), vh / 2 + 2, 18, .16)}" fill="${P.grass}"/><path d="${blob(W / 2, vh / 2, 75 + (W < 100 ? 20 : 0), vh / 2 - 5, 18, .14)}" fill="${P.base}"/></g>`;
  for (let i = 0; !pano && i < 9; i++) g += `<path d="${blob(12 + r() * (W - 24), r() * vh, 7 + r() * 9, 5 + r() * 6, 10, .5)}" fill="${r() < .5 ? P.grass2 : P.base}" opacity=".5" filter="url(#blur)"/>`;
  if (!cnc && !pano) for (let i = 0; i < 6; i++) { const x = 6 + r() * (W - 22), y = 10 + r() * (vh - 30); g += `<path d="${blob(x, y, 10 + r() * 6, 4 + r() * 2, 8, .3)}" fill="#a98652" opacity=".35" filter="url(#blur2)"/>`; }
  if (!cnc && !pano && !L.bare) { const rp = cityRoadPts(L); for (let i = 0, n = 0; i < 300 && n < 6; i++) { const x = 12 + r() * 76, y = 8 + r() * (vh - 16); if (L.slots.some(([sx, sy]) => Math.abs(x - sx) < 20 && Math.abs(y - sy) < 16) || rp.some(([rx, ry]) => Math.hypot(x - rx, y - ry) < 11)) continue; n++; const w = 11 + r() * 5, h = 6 + r() * 3; g += `<g filter="url(#blur2)" opacity=".55"><path d="M${x - w} ${y}L${x} ${y - h}L${x + w} ${y}L${x} ${y + h}Z" fill="#a47c46"/>${[-.6, -.3, 0, .3, .6].map(k => `<path d="M${x - w * (1 - Math.abs(k))} ${y + h * k}L${x + w * (1 - Math.abs(k))} ${y + h * k}" stroke="#c9a56a" stroke-width=".6" opacity=".8" transform="rotate(0)"/>`).join('')}</g>`; } }
  if (!L.bare) g += `<g filter="url(#rough)"><path d="${blob(50, vh / 2, 49, vh / 2 - 9, 20, .12)}" fill="${P.apron}"/></g><path d="${blob(50, vh / 2, 49, vh / 2 - 9, 20, .12)}" fill="#fff" filter="url(#grain)" opacity=".5" transform="translate(0 0)"/>`;
  for (let i = 0; !L.bare && i < 7; i++) g += `<path d="${blob(8 + r() * 84, 8 + r() * (vh - 16), 6 + r() * 8, 4 + r() * 6, 9, .5)}" fill="${r() < .5 ? P.apron2 : P.apron}" opacity=".6" filter="url(#blur)"/>`;
  if (L.ring) { const [cx, cy, rx, ry] = L.ring; g += `<ellipse cx="${cx}" cy="${cy}" rx="${rx + 2}" ry="${ry + 2}" fill="${P.apron2}" opacity=".75" filter="url(#blur2)"/>`; }
  const rd = L.roads.map(roadD);
  const ringD = L.ring ? `M${L.ring[0] - L.ring[2]} ${L.ring[1]}A${L.ring[2]} ${L.ring[3]} 0 1 0 ${L.ring[0] + L.ring[2]} ${L.ring[1]}A${L.ring[2]} ${L.ring[3]} 0 1 0 ${L.ring[0] - L.ring[2]} ${L.ring[1]}` : '';
  const all = rd.concat(ringD ? [ringD] : []);
  const w = cnc ? 4.6 : 3.8;
  g += `<g fill="none" stroke-linecap="round" stroke-linejoin="round"><g opacity=".3" filter="url(#blur2)" transform="translate(.4 .8)">${all.map(d => `<path d="${d}" stroke="#222" stroke-width="${w + 1.6}"/>`).join('')}</g>${all.map(d => `<path d="${d}" stroke="${P.kerb}" stroke-width="${w + 1.4}"/>`).join('')}${all.map(d => `<path d="${d}" stroke="${P.road}" stroke-width="${w}"/>`).join('')}${cnc ? all.map(d => `<path d="${d}" stroke="${P.dash}" stroke-width=".4" stroke-dasharray="2.4 2.6" opacity=".8"/>`).join('') : ''}</g>`;
  g += `<g opacity=".4" filter="url(#grain)">${all.map(d => `<path d="${d}" fill="none" stroke="#fff" stroke-width="${w}"/>`).join('')}</g>`;
  L.slots.forEach(([x, y]) => { const cy = y + 4.2, hw = 7.6, hh = 3.9; g += `<path d="M${x - hw - .6} ${cy + .7}L${x} ${cy - hh + .2}L${x + hw + .6} ${cy + .7}L${x} ${cy + hh + 1.2}Z" fill="#2a2c24" opacity=".28" filter="url(#blur2)"/><path d="M${x - hw} ${cy}L${x} ${cy - hh}L${x + hw} ${cy}L${x} ${cy + hh}Z" fill="${P.pad}" fill-opacity=".55" stroke="${P.padEdge}" stroke-opacity=".6" stroke-width=".4" stroke-linejoin="round"/><path d="M${x - hw + 1.6} ${cy}L${x} ${cy - hh + .8}L${x + hw - 1.6} ${cy}L${x} ${cy + hh - .8}Z" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width=".3" stroke-dasharray="1.2 1"/>`; });
  g += '</svg>';
  return (CITY_GROUND[ck] = 'data:image/svg+xml;utf8,' + encodeURIComponent(g));
}
const citySlot = (ar, i) => { const L = CITY[ar === 'out' ? 'fld' : 'cnc'], [x, y] = L.slots[i] || [50, 50]; return `left:${x}%;top:${(y / L.vh * 100).toFixed(2)}%`; };
/* Scenery: clumps of trees and rocks in the gaps between plots and roads, never on them. Seeded, so the city looks the same every visit. */
const DECOR_SCALE = { tree_1: 1.35, tree_2: 1.45, tree_3: 1.3, rock_1: 1, rock_2: .9, bush: .8, barrel: .65, water: 1.3, fence: 1, lamp: 1.1, flag: 1.1, sandbag: .85, crates: .75 };
function cityDecor(kind) {
  const L = CITY[kind], r = cityRand('deco' + kind), out = [], placed = [], rp = cityRoadPts(L), cnc = kind === 'cnc';
  const free = (x, y, m) => !L.slots.some(([sx, sy]) => Math.abs(x - sx) < 11 + m && Math.abs(y - (sy + 2)) < 10 + m) && !rp.some(([rx, ry]) => Math.hypot(x - rx, y - ry) < 5.5 + m) && !placed.some(([px, py]) => Math.hypot(x - px, y - py) < 4.2);
  const groups = cnc ? [['tree_1', 'tree_3', 'bush'], ['rock_1', 'rock_2', 'bush'], ['lamp', 'flag', 'sandbag', 'crates']] : [['tree_1', 'tree_2', 'tree_3', 'bush'], ['rock_1', 'rock_2', 'bush'], ['barrel', 'crates', 'fence', 'water']];
  const add = (k, x, y) => { placed.push([x, y]); const did = 'd' + placed.length, ov = (LAY.data.decor[kind] || {})[did]; if (ov) { x = ov[0]; y = ov[1]; } if ((LAY.data.hide[kind] || {})[did]) return; const img = cityImg('city_deco_' + k), s = Math.round((24 + Math.round(r() * 10)) * (DECOR_SCALE[k] || 1)); out.push(`<span class="cd ${img ? '' : 'v ' + k.replace(/_\d/, '')} ${LAY.sel && LAY.sel.id === did && LAY.sel.kind === kind ? 'sel' : ''}" data-did="${did}" data-dk="${kind}" style="left:${x.toFixed(1)}%;top:${(y / L.vh * 100).toFixed(2)}%;width:${s}px;height:${s}px;z-index:${Math.round(y)}">${img ? `<img src="${img}" alt="">` : ''}</span>`); };
  for (let c = 0, tries = 0; c < (cnc ? 9 : L.bare ? 6 : 11) && tries < 400; tries++) {
    const x = 2 + r() * 96, y = 4 + r() * (L.vh - 8); if (!free(x, y, 1)) continue;
    const grp = groups[Math.floor(r() * groups.length)], n = grp === groups[2] ? 1 : 2 + Math.floor(r() * 3); c++;
    add(grp[Math.floor(r() * grp.length)], x, y);
    for (let k = 1, t = 0; k < n && t < 20; t++) { const a = r() * 6.28, d = 3 + r() * 4, px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * .8; if (px > 1 && px < 99 && free(px, py, 0)) { add(grp[Math.floor(r() * grp.length)], px, py); k++; } }
  }
  (LAY.data.extra[kind] || []).forEach(e => { const f = cityImg(e.k) || (typeof ART !== 'undefined' && ART.file(e.k)); if (!f) return; out.push(`<span class="cd xtra ${e.a && !LAY.on ? 'wired' : ''} ${LAY.sel && LAY.sel.id === e.id ? 'sel' : ''}" data-did="${e.id}" data-dk="${kind}" ${LAY.on ? '' : layAttrs(e.a)} style="left:${e.x}%;top:${(e.y / L.vh * 100).toFixed(2)}%;width:${e.s}px;height:${e.s}px;z-index:${Math.round(e.y)}"><img src="${f}" alt=""></span>`); });
  return out.join('');
}
function cityHorizon() {
  const img = cityImg('city_horizon');
  if (img) return `<div class="chz"><img src="${img}" alt=""></div>`;
  return `<svg class="chz" viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="chs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#aac4d4"/><stop offset="1" stop-color="#e6ece2"/></linearGradient></defs><rect width="400" height="100" fill="url(#chs)"/><path d="M0 70Q40 40 90 62T190 56T300 60T400 50V100H0z" fill="#9db4b0"/><path d="M0 82Q60 58 120 76T250 70T400 72V100H0z" fill="#7f9a7c"/><g fill="#8fa6a8" opacity=".9"><rect x="250" y="44" width="6" height="16"/><rect x="259" y="38" width="7" height="22"/><rect x="269" y="47" width="6" height="13"/><rect x="300" y="42" width="8" height="18"/></g></svg>`;
}
/* Whole scene: a wide panorama you swipe sideways. West outskirts, the command compound, the fields, east outskirts, each one screen wide
   (the outskirts 0.6 of one), all lying on one painted panorama when city_panorama_N exists. `grid(ar)` returns the plot buttons. */
const CITY_PAN = { wst: .6, cnc: 1, fld: 1, est: .6 };
function cityScene(grid) {
  const t = cityTier(), bd = cityImg('city_backdrop_' + t), pano = cityImg('city_slab');
  const vars = [bd ? `--bd:url(${bd}) center/cover no-repeat,#c9b48c` : ''].filter(Boolean).join(';');
  const isle = (kind, ar) => `<div class="isle ${kind}" style="aspect-ratio:${CITY_W}/${CITY[kind].vh}"><img class="ground" src="${cityGround(kind, !!pano)}" alt="">${cityDecor(kind)}<div class="grid5">${grid(ar)}</div></div>`;
  const side = kind => `<div class="isle side ${kind}" style="aspect-ratio:${CITY[kind].w}/${CITY[kind].vh};width:${CITY[kind].w}cqw"><img class="ground" src="${cityGround(kind, !!pano)}" alt="">${cityDecor(kind)}</div>`;
  return `<div class="cityscape" style="${vars}">${pano ? '' : cityHorizon()}<div class="zbar"><button data-a="pan" data-z="cnc" class="on">Command zone</button><button data-a="pan" data-z="fld">Fields and industry</button><span>swipe ◂ ▸</span></div>
  <div class="cpan" ontouchstart="UI.panTouch=true" ontouchend="UI.panTouch=false" ontouchcancel="UI.panTouch=false"><div class="cworld ${pano ? 'pano' : ''} " style="--cz:${UI.cz || 1};${pano ? `background-image:url(${pano})` : ''}">${side('wst')}${isle('cnc', 'in')}${isle('fld', 'out')}${side('est')}<div class="cclouds" aria-hidden="true"></div></div></div></div>`;
}
/* the swipe position survives repaints: remember it on every scroll and put it back after the page is rebuilt */
function cityPanBar(p) { const x = p.scrollLeft + p.clientWidth * .5, z = x < p.clientWidth * (CITY_PAN.wst + CITY_PAN.cnc) ? 'cnc' : 'fld'; document.querySelectorAll('.zbar button').forEach(b => b.classList.toggle('on', b.dataset.z === z)); }
function cityPanRestore() { const p = document.querySelector('#pg-base .cpan'); if (!p) return; if (typeof UI.panX !== 'number') UI.panX = Math.round(p.clientWidth * CITY_PAN.wst); p.scrollLeft = UI.panX; p.classList.toggle('zoomed', (UI.cz || 1) > 1.01); cityPanBar(p); }
/* pinch to zoom the base: two fingers scale the whole world (CSS zoom keeps the scroll position meaningful) */
(function () {
  let d0 = 0, z0 = 1;
  const dist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY), pan = () => document.querySelector('#pg-base .cpan');
  const apply = (z, p) => { const w = p.querySelector('.cworld'); if (!w) return; const o = UI.cz || 1, cx = p.scrollLeft + p.clientWidth / 2, cy = p.scrollTop + p.clientHeight / 2; UI.cz = z; w.style.setProperty('--cz', z); p.classList.toggle('zoomed', z > 1.01); const r = z / o; p.scrollLeft = cx * r - p.clientWidth / 2; p.scrollTop = cy * r - p.clientHeight / 2; UI.panX = p.scrollLeft; };
  document.addEventListener('touchstart', e => { const p = e.target.closest && e.target.closest('.cpan'); if (!p || e.touches.length !== 2 || (typeof ED !== 'undefined' && ED.on)) return; d0 = dist(e.touches); z0 = UI.cz || 1; UI.panTouch = true; }, { passive: true });
  document.addEventListener('touchmove', e => { if (!d0 || e.touches.length !== 2) return; const p = pan(); if (!p) return; e.preventDefault(); apply(Math.max(1, Math.min(2.4, z0 * dist(e.touches) / d0)), p); }, { passive: false });
  document.addEventListener('touchend', e => { if (e.touches.length < 2) d0 = 0; }, { passive: true });
  document.addEventListener('wheel', e => { const p = e.target.closest && e.target.closest('.cpan'); if (!p || !e.ctrlKey || (typeof ED !== 'undefined' && ED.on)) return; e.preventDefault(); apply(Math.max(1, Math.min(2.4, (UI.cz || 1) * (e.deltaY < 0 ? 1.08 : 1 / 1.08))), p); }, { passive: false });
})();
document.addEventListener('scroll', e => { const t = e.target; if (t && t.classList && t.classList.contains('cpan')) { UI.panX = t.scrollLeft; UI.panAt = Date.now(); cityPanBar(t); } }, true);
/* ---------- moving parts: construction site over a plot being built, working effects on finished buildings ---------- */
/* Painted layers (city_build_scaffold, city_build_crane, city_build_load, city_build_beacon, city_build_sparks, city_build_dust) replace the drawn ones as soon as they are in the manifest. */
/* Animation phase that survives repaints: the base page is rebuilt often, and a CSS loop that restarts each time looks like stutter,
   so every loop gets a negative delay taken from the clock (plus a per-plot offset) and carries on from where it was. */
function fxPhase(sec, seed, k) { const r = cityRand((seed || '') + k)(); return `animation-delay:-${(((Date.now() / 1000) % sec) + r * sec).toFixed(2)}s`; }
function buildFX(seed) {
  const sc = cityImg('city_build_scaffold'), cr = cityImg('city_build_crane'), ld = cityImg('city_build_load'), bc = cityImg('city_build_beacon'), sp = cityImg('city_build_sparks'), du = cityImg('city_build_dust');
  const PER = { 'cf-crane': 12, 'cf-load': 8, 'cf-beacon': 2.4, 'cf-spark': 7, 'cf-dust': 6 }, ph = cls => PER[cls] ? ';' + fxPhase(PER[cls], seed, cls) : '';
  const im = (u, cls, st) => `<img class="${cls}" style="${st}${ph(cls)}" src="${u}" alt="">`;
  return `<span class="cfx" aria-hidden="true">
    ${sc ? im(sc, 'cf-scaf', 'left:8%;top:10%;width:84%') : `<svg class="cf-scaf" viewBox="0 0 100 100"><path d="M50 14 L90 44 L50 74 L10 44 Z" fill="none" stroke="#e8842a" stroke-width="2" stroke-dasharray="6 4"/><g stroke="#d9dde0" stroke-width="1.6" fill="none"><path d="M18 44 V20 M50 74 V50 M82 44 V20 M50 14 V-4"/><path d="M18 26 L50 50 L82 26 M18 38 L50 62 L82 38"/></g></svg>`}
    ${cr ? im(cr, 'cf-crane', 'right:-4%;top:-6%;width:40%') : `<svg class="cf-crane" viewBox="0 0 40 60"><g stroke="#e8a12a" stroke-width="2" fill="none"><path d="M30 58 V8 M26 58 V8 M26 20 H30 M26 34 H30 M26 46 H30"/></g><g class="cf-jib"><path d="M4 8 H38" stroke="#e8a12a" stroke-width="2.4"/><rect x="34" y="6" width="5" height="5" fill="#8b979d"/></g></svg>`}
    ${ld ? im(ld, 'cf-load', 'right:20%;top:6%;width:18%') : `<svg class="cf-load" viewBox="0 0 20 30"><path d="M10 0 V16" stroke="#333" stroke-width="1"/><rect x="3" y="16" width="14" height="5" fill="#8b979d" stroke="#5f6b72" stroke-width=".8"/><rect x="5" y="21" width="10" height="4" fill="#a4afb4" stroke="#5f6b72" stroke-width=".8"/></svg>`}
    ${bc ? im(bc, 'cf-beacon', 'left:4%;top:10%;width:14%') : `<svg class="cf-beacon" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#ffb02e"/><circle cx="5" cy="5" r="1.6" fill="#fff4c9"/></svg>`}
    ${sp ? im(sp, 'cf-spark', 'left:26%;top:38%;width:18%') : `<svg class="cf-spark" viewBox="0 0 20 20"><g stroke="#ffd27a" stroke-width="1.4" stroke-linecap="round"><path d="M10 2 V7 M10 13 V18 M2 10 H7 M13 10 H18 M4.5 4.5 L8 8 M12 12 L15.5 15.5 M15.5 4.5 L12 8 M8 12 L4.5 15.5"/></g><circle cx="10" cy="10" r="2" fill="#fff"/></svg>`}
    ${du ? im(du, 'cf-dust', 'left:58%;top:62%;width:26%') : `<svg class="cf-dust" viewBox="0 0 30 20"><g fill="#d8c9a4"><circle cx="9" cy="12" r="6"/><circle cx="16" cy="9" r="7"/><circle cx="22" cy="12" r="5.5"/></g></svg>`}
  </span>`;
}
/* working buildings: smoke from producers, blinking lights, a turning radar */
function workFX(b, l) {
  if (!l) return '';
  const B = BLD[b], out = [];
  if (B.res || b === 'treasury' || b === 'alloy' || b === 'forge') out.push('<i class="wf-smoke" style="left:62%;top:14%"></i><i class="wf-smoke d2" style="left:62%;top:14%"></i>');
  if (b === 'radar') out.push('<i class="wf-radar" style="left:44%;top:6%"></i>');
  out.push(`<i class="wf-led" style="left:${b === 'power' ? 30 : 74}%;top:${b === 'power' ? 40 : 34}%"></i>`);
  return `<span class="wfx" aria-hidden="true">${out.join('')}</span>`;
}
