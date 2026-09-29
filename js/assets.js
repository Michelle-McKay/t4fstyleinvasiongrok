'use strict';
/* IRON MARCH — optional real art. Drop image files into /assets and list them in assets/manifest.json.
   Anything not listed keeps using the built-in vector art. See docs/ART_SPEC.md for names, sizes and style. */
const ART = { m: null };
const artFile = (kind, level) => {
  const b = ART.m && ART.m.buildings && ART.m.buildings[kind]; if (!b) return null;
  return kind === 'cc' ? (b['L' + String(level).padStart(2, '0')] || b['t' + tierOf(level)] || null) : (b['t' + Math.max(1, tierOf(level))] || null);
};
const _vecBld = bldSVG;
bldSVG = function (kind, level) { const f = artFile(kind, Math.max(1, level)); return f ? `<img class="bsvg" src="${f}" alt="" draggable="false">` : _vecBld(kind, level); };
const _vecSprite = svgSprite;
svgSprite = function (name, inner, size) {
  const f = ART.m && ART.m.map && ART.m.map[name]; if (!f) return _vecSprite(name, inner, size);
  const key = 'img:' + name; if (SP[key]) return SP[key]; size = size || 96;
  const c = document.createElement('canvas'); c.width = c.height = size; SP[key] = c; const im = new Image(); im.onload = () => c.getContext('2d').drawImage(im, 0, 0, size, size); im.src = f; return c;
};
try {
  if (location.protocol.startsWith('http')) fetch('assets/manifest.json').then(r => r.ok ? r.json() : null).then(j => {
    if (!j) return; ART.m = j; for (const k in SP) if (/^(nd_|mn_|camp2|outpost2|hq_|cit2)/.test(k)) delete SP[k];
    for (const k in b2cache) delete b2cache[k]; if (typeof UI !== 'undefined') UI.dirty = true;
  }).catch(() => { });
} catch (e) { }
