'use strict';
/* IRON MARCH — city scene: organic ground islands, winding roads, scenery and a horizon behind the base plots.
   Painted images (city_backdrop_N, city_horizon, city_pad_*, city_deco_*) are used when they are in the manifest; otherwise everything is drawn in code. */
const cityImg = k => (typeof ART !== 'undefined' && ART.file) ? ART.file(k) : null;
const cityTier = () => Math.max(1, Math.min(3, Math.ceil(tierOf(ccLevel()) / 2)));
function cityRand(seed) { let s = 2166136261; for (const c of seed) s = Math.imul(s ^ c.charCodeAt(0), 16777619); return () => { s = Math.imul(s ^ (s >>> 15), 2246822507); s ^= s >>> 13; return ((s >>> 0) % 10000) / 10000; }; }
/* Irregular outline as a clip-path: points walk round the rectangle with a little wobble, so the ground reads as an island, not a box. */
function cityOutline(seed, wob, pull) {
  const r = cityRand(seed), pts = [], n = 7;
  const edge = (t, side) => side === 0 ? [t, 0] : side === 1 ? [100, t] : side === 2 ? [100 - t, 100] : [0, 100 - t];
  for (let side = 0; side < 4; side++) for (let k = 0; k < n; k++) {
    const t = (k + .5) * 100 / n + (r() - .5) * 6, w = (r() * wob), [x, y] = edge(t, side), dx = (50 - x) * pull, dy = (50 - y) * pull * 1.6;
    const nx = side === 1 ? -1 : side === 3 ? 1 : 0, ny = side === 0 ? 1 : side === 2 ? -1 : 0;
    pts.push(`${(x + dx + nx * w * .6).toFixed(1)}% ${(y + dy + ny * w).toFixed(1)}%`);
  }
  return `polygon(${pts.join(',')})`;
}
function cityRoads(kind) {
  const paths = kind === 'cnc'
    ? ['M-4 17C22 7 38 29 60 21S92 9 104 23', 'M-4 43C20 53 44 33 66 45S96 55 104 41', 'M-4 69C24 59 40 79 62 71S92 83 104 67', 'M52 -4C44 30 60 50 50 70S46 90 52 104']
    : ['M-4 24C26 14 40 36 64 28S94 18 104 30', 'M-4 56C22 66 46 46 68 58S96 68 104 54', 'M46 -4C58 28 42 52 54 74S50 92 46 104'];
  const c = kind === 'cnc' ? ['#39424a', '#8d9aa2', '#c9d2d6'] : ['#7a6a48', '#a3916a', '#bda884'];
  return `<svg class="croads" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${paths.map(d => `<path d="${d}" fill="none" stroke="${c[1]}" stroke-width="13" stroke-linecap="round" vector-effect="non-scaling-stroke"/><path d="${d}" fill="none" stroke="${c[0]}" stroke-width="10" stroke-linecap="round" vector-effect="non-scaling-stroke"/>${kind === 'cnc' ? `<path d="${d}" fill="none" stroke="${c[2]}" stroke-width="1.4" stroke-dasharray="7 9" vector-effect="non-scaling-stroke" opacity=".7"/>` : ''}`).join('')}</svg>`;
}
/* Scenery: painted sprite when it exists, else a small CSS/SVG piece. Positions are seeded so the city looks the same every visit. */
function cityDecor(kind) {
  const r = cityRand('deco' + kind), out = [];
  const set = kind === 'cnc' ? ['lamp', 'flag', 'sandbag', 'tree_1', 'tree_3', 'bush', 'rock_1', 'crates'] : ['tree_1', 'tree_2', 'tree_3', 'rock_1', 'rock_2', 'bush', 'barrel', 'water', 'fence'];
  const slots = [[2, 4], [92, 6], [3, 30], [93, 33], [2, 58], [92, 60], [4, 86], [90, 88], [47, 2], [48, 94], [24, 96], [72, 95]];
  slots.forEach(([x, y], i) => {
    const k = set[Math.floor(r() * set.length)], img = cityImg('city_deco_' + k), s = 26 + Math.round(r() * 12), px = x + (r() - .5) * 4, py = y + (r() - .5) * 4;
    out.push(`<span class="cd ${img ? '' : 'v ' + k.replace(/_\d/, '')}" style="left:${px}%;top:${py}%;width:${s}px;height:${s}px">${img ? `<img src="${img}" alt="">` : ''}</span>`);
  });
  return out.join('');
}
function cityHorizon() {
  const img = cityImg('city_horizon');
  if (img) return `<div class="chz"><img src="${img}" alt=""></div>`;
  return `<svg class="chz" viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="chs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#aac4d4"/><stop offset="1" stop-color="#e6ece2"/></linearGradient></defs><rect width="400" height="100" fill="url(#chs)"/><path d="M0 70Q40 40 90 62T190 56T300 60T400 50V100H0z" fill="#9db4b0"/><path d="M0 82Q60 58 120 76T250 70T400 72V100H0z" fill="#7f9a7c"/><g fill="#8fa6a8" opacity=".9"><rect x="250" y="44" width="6" height="16"/><rect x="259" y="38" width="7" height="22"/><rect x="269" y="47" width="6" height="13"/><rect x="300" y="42" width="8" height="18"/></g></svg>`;
}
/* Whole scene: horizon + two islands. `grid(ar)` returns the plot buttons. */
function cityScene(grid) {
  const t = cityTier(), bd = cityImg('city_backdrop_' + t), padE = cityImg('city_pad_empty'), padL = cityImg('city_pad_locked'), gi = cityImg('city_ground_inner'), gr = cityImg('city_ground_res');
  const vars = [`--pad:${padE ? `url(${padE}) center/contain no-repeat` : 'radial-gradient(closest-side,rgba(255,255,255,.14),rgba(255,255,255,.04) 70%,transparent)'}`, bd ? `--bd:url(${bd}) center/cover no-repeat,#c9b48c` : ''].filter(Boolean).join(';');
  const isle = (kind, title, ar, img) => {
    const rim = cityOutline('rim' + kind, 5, 0), fill = cityOutline('fill' + kind, 5, .07);
    return `<div class="isle ${kind}"><div class="irim" style="clip-path:${rim}"></div><div class="ifill" style="clip-path:${fill}${img ? `;background-image:url(${img});background-size:100% 100%` : ''}"></div>${cityRoads(kind)}${cityDecor(kind)}<div class="zt">${title}</div><div class="grid5">${grid(ar)}</div></div>`;
  };
  return `<div class="cityscape" style="${vars}">${cityHorizon()}${isle('cnc', 'Command zone · inner compound', 'in', gi)}${isle('fld', 'Fields and industry · outer ring', 'out', gr)}</div>`;
}
/* Per-plot drift so lots sit like a settled town: odd rows shift sideways and each lot wobbles a little. */
function cityDrift(ar, i) { const r = cityRand(ar + i), row = Math.floor(i / 5), sh = row % 2 ? 14 : -4; return `--dx:${(sh + (r() - .5) * 8).toFixed(1)}px;--dy:${((r() - .5) * 10).toFixed(1)}px`; }
