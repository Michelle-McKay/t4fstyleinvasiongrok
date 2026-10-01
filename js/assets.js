'use strict';
/* IRON MARCH — painted art loader.
   Drop image files into /assets and run `python3 tools/ingest.py` (it writes assets/manifest.json).
   Any asset not listed keeps the built-in vector art, so images can arrive a few at a time.
   Names and sizes: assets/catalog.json (made by tools/artcatalog.js). */
const ART = {
  f: {},                                            // key -> file path, from assets/manifest.json
  ims: {},                                          // path -> loaded Image
  file: k => ART.f[k] || null,
  /* returns a loaded Image or null; starts loading and asks for a redraw when it lands */
  img(path) {
    const c = ART.ims[path]; if (c) return c.complete && c.naturalWidth ? c : null;
    const im = ART.ims[path] = new Image(); im.onload = () => { terrDirty = true; if (/map_slab/.test(path) && typeof CH !== 'undefined') { CH.map.forEach(c => c.stale = true); if (typeof GR !== 'undefined') GR.dirty = true; } if (typeof UI !== 'undefined') UI.dirty = true; }; im.src = path; return null;
  },
  head: kind => ART.file('head_' + kind),
  slabReady() { const f = ART.file('map_slab'), c = f && ART.ims[f]; if (f && !c) ART.img(f); return c && c.complete && c.naturalWidth ? 's' : ''; }
};
const artFile = (kind, level) => ART.file('bld_' + kind + '_t' + Math.max(1, tierOf(level)));
const imgTag = (path, cls) => `<img class="${cls}" src="${path}" alt="" draggable="false" decoding="async">`;

/* ---- buildings ---- */
const _vecBld = bldSVG;
bldSVG = function (kind, level) { const f = artFile(kind, Math.max(1, level)); return f ? imgTag(f, 'bsvg') : _vecBld(kind, level); };

/* ---- map sprites, drawn to canvas once the image has loaded ---- */
const spriteKey = name => {
  let m;
  if ((m = /^nd_([a-z]+)(\d)$/.exec(name))) return 'node_' + m[1];   // one picture per resource, the level is a number drawn in code
  if ((m = /^mn_(\d)$/.exec(name))) return 'mon_' + m[1];
  if ((m = /^hq_(\d+)$/.exec(name))) { const t = Math.max(1, tierOf(+m[1])); return ART.file('base_' + t) ? 'base_' + t : 'bld_cc_t' + t; }
  return { camp2: 'camp', cit2: 'citadel' }[name] || null;
};
const canvasFrom = (key, path, size) => {
  const ck = 'img:' + key + ':' + size; if (SP[ck]) return SP[ck];
  const im = ART.img(path); if (!im) return null;
  const c = document.createElement('canvas'); c.width = c.height = size; c.getContext('2d').drawImage(im, 0, 0, size, size); return (SP[ck] = c);
};
const _vecSprite = svgSprite;
svgSprite = function (name, inner, size) {
  const k = spriteKey(name), f = k && ART.file(k);
  return (f && canvasFrom(k, f, Math.max(size || 96, 128))) || _vecSprite(name, inner, size);
};

/* ---- ground tiles (flat textures the map bends onto the diamond grid) ---- */
const TILE_N = { wild: 3, forest: 2, plaza: 1 };
const _vecTerrain = terrainSprite;
terrainSprite = function (t, v) {
  const n = TILE_N[t], k = n && 'tile_' + t + '_' + (v % n + 1), f = k && ART.file(k);
  if (t === 'wild') { const sf = ART.file('map_slab'), im = sf && ART.img(sf); if (im) { const sk = 'slab:' + (v % 4); if (!SP[sk]) { const c = document.createElement('canvas'); c.width = c.height = 256; const w = im.width * .42, h = im.height * .42, i = v % 4; c.getContext('2d').drawImage(im, im.width * .08 + (i & 1) * w, im.height * .08 + (i >> 1) * h, w, h, 0, 0, 256, 256); // inner part only: the picture's outer edge is slightly darker SP[sk] = c; } return SP[sk]; } }
  return (f && canvasFrom(k, f, 256)) || _vecTerrain(t, v);
};

/* ---- troops, wall crews, heroes ---- */
const _vecUnit = unitSVG;
unitSVG = function (cls, tier, o) { const f = ART.file('troop_' + cls + '_t' + clamp(tier | 0, 1, 4)); return f ? imgTag(f, 'unit u-' + cls + ' ut' + tier) : _vecUnit(cls, tier, o); };
const _vecWall = wallSVG;
wallSVG = function (cls, tier) { const f = ART.file('wall_' + cls + '_t' + clamp(tier | 0, 1, 4)); return f ? imgTag(f, 'unit wallu w-' + cls + ' ut' + tier) : _vecWall(cls, tier); };
const _vecHero = heroSVG;
heroSVG = function (id, o) { const f = ART.file('hero_' + id); return f ? imgTag(f, 'unit hero h-' + id) : _vecHero(id, o); };

const _vecXpi = xpiSVG;
xpiSVG = function (id) { const f = ART.file('xpi_' + id); return f ? imgTag(f, 'unit xpi x' + id) : _vecXpi(id); };
const _vecHF = heroFullSVG;
heroFullSVG = function (id) { const f = ART.file('heroful_' + id); return f ? imgTag(f, 'hfull h-' + id) : _vecHF(id); };

/* ---- HUD and resource icons: painted icons are slotted into the shared RESICON table, so every caller picks them up ---- */
const _vecIcons = {};
function applyIcons() {
  for (const k in _vecIcons) { if (_vecIcons[k] === undefined) delete RESICON[k]; else RESICON[k] = _vecIcons[k]; }
  for (const key in ART.f) if (key.startsWith('icon_')) { const n = key.slice(5); if (!(n in _vecIcons)) _vecIcons[n] = RESICON[n]; RESICON[n] = `<image href="${ART.f[key]}" width="24" height="24" preserveAspectRatio="xMidYMid meet"/>`; }
}

/* ---- store banners and diamond piles (packs.js and iap.js load after this file, so hook on load) ---- */
function hookStore() {
  if (typeof packArtLarge === 'function') { const v = packArtLarge; packArtLarge = p => { const f = ART.file('pack_' + p.art); return f ? imgTag(f, 'pkart painted') : v(p); }; }
  if (typeof gemSVG === 'function') { const v = gemSVG; gemSVG = n => { const f = ART.file('gem_' + clamp(n | 0, 1, 6)); return f ? imgTag(f, 'gm painted') : v(n); }; }
}

/* ---- boot: read the manifest, then redraw everything ---- */
function loadArt() {
  fetch('assets/manifest.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(j => {
    if (!j || !j.files) return;
    ART.f = j.files; applyIcons();
    for (const k in SP) if (!k.startsWith('img:') && /^(nd_|mn_|camp2|outpost2|hq_|cit2|wild|forest|plaza)/.test(k)) delete SP[k];
    for (const k in b2cache) delete b2cache[k];
    terrDirty = true; if (typeof UI !== 'undefined') UI.dirty = true;
  }).catch(() => { });
}
window.addEventListener('load', () => { try { hookStore(); if (location.protocol.startsWith('http')) loadArt(); } catch (e) { } });
