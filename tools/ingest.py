#!/usr/bin/env python3
"""IRON MARCH: turn AI-generated images into game assets.

  python3 tools/ingest.py incoming/*.png     process files named after asset keys (bld_mil_t1.png ...)
  python3 tools/ingest.py --manifest         only rebuild assets/manifest.json from what is in assets/

For each file it: finds the asset in assets/catalog.json by file name, removes a flat background (magenta,
white, or any single flat colour touching the edges) when the asset needs transparency and the image has none,
shrinks it to the in-game size, saves WebP to assets/<group>/<key>.webp, then rewrites assets/manifest.json.
Needs Pillow (python3 -m pip install pillow). The originals are not kept in the repo."""
import json, os, re, sys
from collections import deque
try:
    from PIL import Image, ImageChops, ImageFilter
except ImportError:
    sys.exit('Pillow is missing: python3 -m pip install pillow')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, 'assets')
CAT = {i['key']: i for i in json.load(open(os.path.join(A, 'catalog.json')))['items']}
FOLDER = {'bld': 'buildings', 'head': 'backdrops', 'troop': 'troops', 'wall': 'walls', 'hero': 'heroes',
          'map': 'map', 'tile': 'tiles', 'pack': 'packs', 'gem': 'packs', 'icon': 'icons', 'skill': 'skills', 'gear': 'gear', 'core': 'cores',
          'vip': 'vip', 'avatar': 'avatars', 'chat': 'chat', 'item': 'items'}

def key_of(path):
    s = os.path.splitext(os.path.basename(path))[0].lower().strip()
    s = re.sub(r'\s*\(\d+\)$', '', s).replace('-', '_').replace(' ', '_')
    return s if s in CAT else None

def flat_bg(im, tol=80):
    """Return (r,g,b) if the four corners share one flat colour, else None."""
    w, h = im.size; px = im.convert('RGB').load(); pts = [(2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3)]
    cs = [px[p] for p in pts]
    for skip in [None, 0, 1, 2, 3]:  # allow one smudged corner
        use = [c for i, c in enumerate(cs) if i != skip]
        if all(max(abs(a - b) for a, b in zip(use[0], c)) <= tol for c in use): return tuple(sum(c[i] for c in use) // len(use) for i in range(3))
    return None

def cut_out(im, bg, tol=64, hollow=False):
    rgb = im.convert('RGB'); diff = ImageChops.difference(rgb, Image.new('RGB', rgb.size, bg))
    r, g, b = diff.split(); d = ImageChops.lighter(ImageChops.lighter(r, g), b)
    cand = d.point(lambda v: 255 if v <= tol else 0)          # pixels close to the background colour
    w, h = cand.size; cp = cand.load(); seen = bytearray(w * h); q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if cp[x, y] == 255 and not seen[y * w + x]: seen[y * w + x] = 1; q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if cp[x, y] == 255 and not seen[y * w + x]: seen[y * w + x] = 1; q.append((x, y))
    while q:                                                   # flood from the border so inside colours survive
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and cp[nx, ny] == 255: seen[ny * w + nx] = 1; q.append((nx, ny))
    mask = Image.new('L', (w, h), 255); mp = mask.load()
    for y in range(h):
        row = y * w
        for x in range(w):
            if seen[row + x] or (hollow and cp[x, y] == 255): mp[x, y] = 0   # hollow frames also lose the enclosed background
    if bg[0] > 150 and bg[2] > 150 and bg[1] < 120: return magenta_key(im, mask)
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))   # shave the halo, soften the edge
    out = im.convert('RGBA'); out.putalpha(mask); return out

def square(im, pad=0.04):
    """Crop to the visible pixels, then centre on a square canvas so every sprite sits the same way in its cell."""
    if im.mode != 'RGBA': return im
    bb = im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    if not bb: return im
    im = im.crop(bb); side = round(max(im.size) * (1 + 2 * pad)); out = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    out.paste(im, ((side - im.width) // 2, (side - im.height) // 2)); return out

def magenta_key(im, mask):
    """Chroma key for the magenta fallback background: also clears magenta trapped inside the art (gaps in gantries,
    between lamps), fades the purple shadow edge, and removes the magenta cast from edge pixels."""
    rgb = im.convert('RGB'); r, g, b = rgb.split()
    m = ImageChops.subtract(ImageChops.darker(r, b), g)                       # how magenta a pixel is
    a = m.point(lambda v: 255 if v <= 28 else 0 if v >= 64 else int(255 * (64 - v) / 36))
    a = ImageChops.darker(a, mask.filter(ImageFilter.MinFilter(3)))
    edge = a.point(lambda v: 255 if v < 250 else 0).filter(ImageFilter.MaxFilter(9))   # pixels near the cut
    m2 = ImageChops.multiply(m.point(lambda v: v if v > 8 else 0), edge.point(lambda v: 255 if v else 0))
    r = ImageChops.subtract(r, m2); b = ImageChops.subtract(b, m2)
    out = Image.merge('RGB', (r, g, b)).convert('RGBA'); out.putalpha(a.filter(ImageFilter.GaussianBlur(0.6))); return out

def has_alpha(im):
    return im.mode in ('RGBA', 'LA') and im.getchannel('A').getextrema()[0] < 250

def process(path):
    k = key_of(path)
    if not k: return ('skip', os.path.basename(path), 'name is not in assets/catalog.json')
    it = CAT[k]; im = Image.open(path); im.load(); note = ''
    if it['transparent']:
        if has_alpha(im): note = 'kept transparency'
        else:
            bg = flat_bg(im)
            if bg is None: note = 'WARNING background is not one flat colour, left as is'
            else: im = cut_out(im, bg, hollow=bool(it.get('hollow'))); note = 'background removed'
    else:
        im = im.convert('RGB')
        if it['size'].startswith('1:1') and im.width != im.height:  # not square: centre-crop so it does not stretch
            n = min(im.size); l, t = (im.width - n) // 2, (im.height - n) // 2; im = im.crop((l, t, l + n, t + n)); note = 'centre-cropped to square'
    if it['transparent'] and it['size'].startswith('1:1'): im = square(im)
    m = it['out']; sc = m / max(im.size)
    if sc < 1: im = im.resize((round(im.width * sc), round(im.height * sc)), Image.LANCZOS)
    d = os.path.join(A, FOLDER[it['group']]); os.makedirs(d, exist_ok=True)
    dst = os.path.join(d, k + '.webp'); im.save(dst, 'WEBP', quality=88, method=6)
    return ('ok', k, f'{im.width}x{im.height}, {os.path.getsize(dst) // 1024} KB, {note}')

LOOK = 'clean'   # art direction of the images being added; older dark images are not in the manifest's "clean" list

def manifest(added=()):
    try: clean = set(json.load(open(os.path.join(A, 'manifest.json'))).get(LOOK, []))
    except Exception: clean = set()
    clean |= set(added); files = {}
    for d in sorted(set(FOLDER.values())):
        p = os.path.join(A, d)
        if os.path.isdir(p):
            for f in sorted(os.listdir(p)):
                k, ext = os.path.splitext(f)
                if k in CAT and ext in ('.webp', '.png'): files[k] = f'assets/{d}/{f}'
    json.dump({'v': 2, '_comment': 'Written by tools/ingest.py. files maps an asset key from assets/catalog.json to its image; clean lists the keys made in the current bright clean-industrial look (the rest are the old dark look, kept until replaced).', 'files': files, LOOK: sorted(k for k in clean if k in files)},
              open(os.path.join(A, 'manifest.json'), 'w'), indent=1); open(os.path.join(A, 'manifest.json'), 'a').write('\n')
    return files

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if a != '--manifest']
    added = []
    for p in args:
        try: st, k, msg = process(p)
        except Exception as e: st, k, msg = 'FAIL', os.path.basename(p), str(e)
        print(f'{st:4} {k}: {msg}')
        if st == 'ok': added.append(k)
    f = manifest(added); print(f'manifest: {len(f)} of {len(CAT)} assets have painted art')
