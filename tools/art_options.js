'use strict';
/* Building art options generator. Run inside the game page (after all js/*.js load).
   Produces three alternative architectural styles per building, each with a 5-tier upgrade chain
   where every tier visibly adds features. Style A is the game's current art. */
const OPT = (() => {
  const PAL = {
    B: [null,
      { f: '#8f8b7c', s: '#5f5c50', t: '#aeaa9a', trim: '#d9a441', win: '#f0c25a', roof: '#4a4a44', dark: '#1c1c18' },
      { f: '#9a9a94', s: '#66665f', t: '#b9b9b2', trim: '#d9a441', win: '#f0c25a', roof: '#55554f', dark: '#1c1c18' },
      { f: '#7f8480', s: '#4f544f', t: '#a0a5a0', trim: '#e0a44a', win: '#ffd27a', roof: '#3f443f', dark: '#141614' },
      { f: '#5f6a66', s: '#3a4441', t: '#7b8783', trim: '#f0b95a', win: '#ffb84a', roof: '#2b3230', dark: '#0e1110' },
      { f: '#454f50', s: '#283132', t: '#5f6b6c', trim: '#ffcf6a', win: '#ff9f3a', roof: '#1b2122', dark: '#080a0a' }],
    C: [null,
      { f: '#8fa4ae', s: '#5f7480', t: '#b4c6cf', trim: '#5ec4d4', win: '#8adbe8', roof: '#6a7a83', dark: '#1a2328' },
      { f: '#a8bcc6', s: '#6f8591', t: '#cfdde4', trim: '#5ec4d4', win: '#8adbe8', roof: '#7a8b94', dark: '#1a2328' },
      { f: '#7c98a6', s: '#4f6977', t: '#a6c0cd', trim: '#5ec4d4', win: '#7fe3f2', roof: '#4a5f6b', dark: '#141d22' },
      { f: '#5d7787', s: '#37505d', t: '#84a2b1', trim: '#7ff0ff', win: '#7ff0ff', roof: '#2c3f4a', dark: '#0d1418' },
      { f: '#3f5666', s: '#243845', t: '#60808f', trim: '#b6fbff', win: '#b6fbff', roof: '#1a2a33', dark: '#070d10' }],
    D: [null,
      { f: '#8a6a44', s: '#5a4028', t: '#a98358', trim: '#3a2818', win: '#ffd27a', roof: '#6b4a2a', dark: '#22160c' },
      { f: '#96704a', s: '#60442c', t: '#b58a5c', trim: '#3a2818', win: '#ffd27a', roof: '#7a3f2a', dark: '#22160c' },
      { f: '#a3563e', s: '#6e3a2a', t: '#c47358', trim: '#e9d8b4', win: '#ffd27a', roof: '#4a3a34', dark: '#22160c' },
      { f: '#6d747a', s: '#454b50', t: '#8d959b', trim: '#c9a25a', win: '#ffc766', roof: '#3a2a26', dark: '#14100e' },
      { f: '#5a5f66', s: '#383c42', t: '#7b8189', trim: '#e0b45a', win: '#ffc766', roof: '#7a2a24', dark: '#0e0c0c' }]
  };
  const DIM = { mil: [34, 0], depot: [30, 0], treasury: [34, 0], tech: [28, 1], hall: [36, 0], prison: [30, 0], radar: [24, -1], store: [38, -1], defense: [36, -1], market: [32, -1] };
  const RURAL = ['rations', 'fuel', 'power', 'alloy'];
  const star = (cx, cy, r, c) => { const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * .42 : r; pts.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q]); } return P(pts, c, KI, .4); };
  /* kind-specific sign, drawn on the front wall or roof */
  function emblem(k, cx, cy, s, t, m) {
    const g = t >= 4 ? 'class="glw"' : '';
    switch (k) {
      case 'mil': return star(cx, cy, s, BR);
      case 'depot': return cross(cx, cy, s * .8, RED);
      case 'treasury': return CI(cx, cy, s * .8, '#2a3237', `stroke="${BR}" stroke-width="1"`) + CI(cx, cy, s * .35, BR, g) + [0, 1, 2, 3].map(i => LN(cx, cy, cx + Math.cos(i * 1.57) * s * .8, cy + Math.sin(i * 1.57) * s * .8, BR, .6)).join('');
      case 'tech': return `<ellipse cx="${cx}" cy="${cy}" rx="${s}" ry="${s * .4}" fill="none" stroke="${ICE}" stroke-width=".8" ${g}/><ellipse cx="${cx}" cy="${cy}" rx="${s}" ry="${s * .4}" fill="none" stroke="${ICE}" stroke-width=".8" transform="rotate(60 ${cx} ${cy})"/><ellipse cx="${cx}" cy="${cy}" rx="${s}" ry="${s * .4}" fill="none" stroke="${ICE}" stroke-width=".8" transform="rotate(120 ${cx} ${cy})"/>` + CI(cx, cy, 1, ICE);
      case 'hall': return P([[cx - s * .7, cy - s], [cx + s * .7, cy - s], [cx + s * .7, cy], [cx, cy + s * .7], [cx - s * .7, cy]], RED, KI, .5) + LN(cx - s * .3, cy - s * .5, cx + s * .3, cy - s * .5, '#fff3c0', .8) + LN(cx, cy - s * .8, cx, cy + s * .2, '#fff3c0', .8);
      case 'prison': return RC(cx - s * .8, cy - s * .7, s * 1.6, s * 1.4, '#0c1012', KI, .4) + [-.5, 0, .5].map(f => LN(cx + f * s * 1.2, cy - s * .7, cx + f * s * 1.2, cy + s * .7, '#9aa4a8', .9)).join('');
      case 'radar': return dish(cx, cy, s, m, t >= 3);
      case 'store': return crate(cx - s, cy + s * .5, s, '#8a6a3a') + crate(cx, cy + s * .5, s, '#7a5a2a') + crate(cx - s * .5, cy - s * .5, s, '#9a7a44');
      case 'defense': return turret(cx, cy + 3, m, t >= 4);
      case 'market': return [0, 1, 2, 3].map(i => P([[cx - s + i * s * .5, cy - s * .4], [cx - s + (i + 1) * s * .5, cy - s * .4], [cx - s + (i + 1) * s * .5 + .6, cy + s * .2], [cx - s + i * s * .5 - .6, cy + s * .2]], i % 2 ? '#f4f1e6' : RED, KI, .3)).join('');
      case 'rations': return [0, 1, 2].map(i => `<path d="M${cx - 3 + i * 3} ${cy + 3}v-6m0 2l-1.4-1.4m1.4 1.4l1.4-1.4m-1.4-1.4l-1.4-1.4m1.4 1.4l1.4-1.4" stroke="#e0c25a" stroke-width=".8" fill="none"/>`).join('');
      case 'fuel': return `<path d="M${cx} ${cy - s} q${s * .8} ${s * 1.2} 0 ${s * 1.6} q-${s * .8} -${s * .4} 0 -${s * 1.6}z" fill="#ffb347" stroke="${KI}" stroke-width=".4" ${g}/>`;
      case 'power': return P([[cx + 1, cy - s], [cx - s * .6, cy + .5], [cx - .2, cy + .5], [cx - 1, cy + s], [cx + s * .6, cy - .8], [cx + .2, cy - .8]], '#ffe27a', KI, .4);
      case 'alloy': return P([[cx - s, cy + 2], [cx + s, cy + 2], [cx + s * .7, cy - 1.5], [cx - s * .7, cy - 1.5]], '#d8dee0', KI, .4) + LN(cx - s * .6, cy - .8, cx + s * .6, cy - .8, '#fff', .6);
    }
    return '';
  }
  /* yard props by kind and tier, placed at ground level around the building */
  function yard(k, t, m, x, w, yb) {
    let s = '';
    const R = x + w + 3;
    if (k === 'mil') s += t >= 2 ? truck(4, 60) : '', s += t >= 4 ? turret(58, 58, m, t >= 5) : '';
    if (k === 'depot') s += t >= 2 ? crate(R, 58, 5, '#cfd4d4') : '', s += t >= 3 ? RC(R - 8, 52, 12, 6, '#e8eaea', KI, .4) + RC(R - 8, 54, 12, 1.2, RED) : '';
    if (k === 'treasury') s += [0, 1, 2].slice(0, t).map(i => P([[R + i * 2, 58 - i * 3], [R + 7 + i * 2, 58 - i * 3], [R + 8 + i * 2, 60 - i * 3], [R - 1 + i * 2, 60 - i * 3]], '#f0c25a', KI, .3)).join('');
    if (k === 'tech') s += t >= 3 ? mast(58, 58, 8 + t * 3, m, 1) : '';
    if (k === 'hall') s += flag(4, 58, 14 + t * 2, RED) + (t >= 3 ? flag(60, 58, 14 + t * 2, RED) : '');
    if (k === 'prison') s += `<path d="M2 58V44M62 58V44M2 46h60" stroke="#9aa4a8" stroke-width=".7" fill="none"/>` + [8, 14, 20, 26, 32, 38, 44, 50, 56].map(px => LN(px, 46, px, 58, 'rgba(154,164,168,.5)', .5)).join('') + (t >= 3 ? RC(56, 38, 5, 12, m.f, KI, .4) + light(58.5, 38) : '');
    if (k === 'radar') s += t >= 3 ? dish(54, 46, 5, m, 1) + LN(54, 46, 54, 58, '#b8c0c3', 1.2) : '';
    if (k === 'store') s += container(R - 6, 60, t >= 4 ? '#3f6a8a' : '#b8613d') + (t >= 3 ? container(R - 6, 54, '#8a3d2a') : '');
    if (k === 'defense') s += sandbags(4, 59, 4 + t) + (t >= 3 ? barrel(58, 58, '#8a3d2a') : '');
    if (k === 'market') s += crate(4, 59, 5, '#8a6a3a') + barrel(58, 58, '#b8613d') + (t >= 3 ? crate(R - 4, 59, 6, '#7a5a2a') : '');
    return s;
  }
  function roofTop(k, x, w, top, t, m, style) {
    const cx = x + w / 2; let s = '';
    if (['radar', 'tech'].includes(k) && t >= 2) s += dish(cx, top - 3, 3 + t, m, t >= 3);
    if (k === 'defense' && t >= 3) s += turret(cx, top - 1, m, t >= 4);
    if (k === 'mil' && t >= 3) s += mast(x + w - 4, top, 8 + t * 2, m, 1);
    if (k === 'hall' && t >= 4) s += flag(cx, top, 8 + t * 2, RED);
    if (k === 'depot' && t >= 3) s += `<circle cx="${cx}" cy="${top - 5}" r="4" fill="none" stroke="${RED}" stroke-width=".8" ${t >= 4 ? 'class="glw"' : ''}/><path d="M${cx - 2} ${top - 5}h4M${cx} ${top - 7}v4" stroke="${RED}" stroke-width=".8"/>`;
    return s;
  }
  function rural(k, t, m, style) {
    let s = pad(t, true); const x = 12, w = 24, yb = 50;
    const crops = k === 'rations' ? '#8fa64a' : k === 'fuel' ? '#4a4a44' : k === 'power' ? '#1d3a5a' : '#5a5f66';
    /* ground plots that grow with tier */
    for (let i = 0; i < 2 + t; i++) s += P([[4 + i * 3, 56 - i * 1.6], [24 + i * 3, 56 - i * 1.6], [26 + i * 3, 58 - i * 1.6], [2 + i * 3, 58 - i * 1.6]], crops, KI, .3);
    if (t >= 2) s += box(x + 16, yb + 2, 20 + t, 8 + t * 2, 8, m, { trim: m.trim, gear: false }) + wins(x + 19, yb - 8 - t, 2, 1, m, 3, 2.6, 2.2, 0, t >= 3);
    if (k === 'rations' && t >= 3) s += `<path d="M6 40q4-7 8 0v10H6z" fill="${m.f}" stroke="${KI}" stroke-width=".5"/>`;
    if (k === 'fuel' && t >= 2) s += tank(6, 52, m);
    if (k === 'power' && t >= 3) s += mast(10, 50, 14 + t, m, 1);
    if (k === 'alloy' && t >= 3) s += `${RC(50, 20, 6, 30, m.f, KI, .5)}${RC(49, 17, 8, 4, m.roof, KI, .4)}` + (t >= 4 ? `<circle cx="53" cy="12" r="3" fill="rgba(200,200,200,.4)" class="glw"/>` : '');
    if (t === 1) s += tent(30, 52, 22, 16, style === 'D' ? '#8a6a3a' : style === 'C' ? '#7a8b94' : '#6b7a4a', 'rgba(0,0,0,.4)');
    s += emblem(k, t === 1 ? 41 : 30, 38 - t * 1.5, 5 + t * .9, t, m);
    if (style === 'B') s += sandbags(4, 60, 3 + t);
    if (style === 'D') s += [4, 12, 20, 28, 36, 44, 52, 60].map(px => LN(px, 60, px, 55, '#6b4a2a', 1) + LN(px, 57, px + 8, 57, '#8a6a3a', .7)).join('');
    if (style === 'C' && t >= 4) s += `<rect x="1" y="6" width="62" height="54" fill="none" stroke="${ICE}" stroke-width=".8" opacity=".5" rx="2"/>`;
    return s;
  }
  const dims = k => DIM[k] || [30, 0];
  function bunker(k, t) {
    const m = PAL.B[t], [w0, fd] = dims(k), w = Math.min(44, w0 + (t >= 4 ? 4 : 0)), x = t >= 5 ? 10 : 6, yb = 52; let s = pad(t, false);
    if (t === 1) s += `${P([[x + 2, yb], [x + 8, yb - 12], [x + w - 6, yb - 12], [x + w, yb]], '#6b7a4a', KI, .6)}${P([[x + 2, yb], [x + 8, yb - 12], [x + w - 6, yb - 12], [x + w, yb]], 'url(#gT)')}${RC(x + 12, yb - 9, 12, 9, '#0c1012', KI, .4)}${sandbags(x, yb + 4, 7)}${sandbags(x + 6, yb + 1, 5)}`;
    else {
      const fl = Math.max(1, [0, 1, 1, 2, 2, 2][t] + fd), h = fl * 10 + 4, top = yb - h;
      if (t >= 3) s += [x - 3, x + w].map((bx, i) => P([[bx, yb], [bx + 3, yb], [bx + (i ? 0 : 3), yb - h * .55], [bx + (i ? 3 : 0), yb - h * .55]], m.s, KI, .5)).join('');
      s += box(x, yb, w, h, 9, m, { trim: m.trim, gear: t >= 3 });
      for (let f = 0; f < fl; f++) s += wins(x + 4, yb - h + 4 + f * 10, Math.floor((w - 8) / 6), 1, m, 4.4, 1.6, 1.6, 0, t >= 4);
      s += door(x + w / 2 - 3.5, yb, 7, 7.6) + RC(x, yb - 3, w, 1.2, t >= 3 ? BR : '#5a5a50') + (t >= 2 ? [0, 1, 2, 3, 4, 5].map(i => P([[x + 2 + i * 6, yb - 1.8], [x + 5 + i * 6, yb - 1.8], [x + 4 + i * 6, yb - 3], [x + 1 + i * 6, yb - 3]], '#d9a441', null)).join('') : '');
      if (t >= 4) s += [x + 4, x + w - 4].map(fx => LN(fx, top, fx, top - 6, '#b8c0c3', 1) + light(fx, top - 6, '#fff3c0')).join('') + RC(x, top - 1, w, 2.2, 'rgba(0,0,0,.35)');
      if (t >= 5) s += [x - 4, x + w - 2].map(tx => box(tx, yb + 2, 6, h + 6, 4, m, { trim: BR, gear: false }) + RC(tx + 1.4, yb - h - 1, 3, 2, '#0c1012') + CI(tx + 3, yb - h - 4, 1.4, BR, 'class="glw"')).join('') + `<path d="M${x - 4} ${yb + 2}h${w + 8}" stroke="${BR}" stroke-width=".8" class="glw"/>`;
      s += emblem(k, x + w / 2, yb - h + (fl > 1 ? h * .5 : 8) - 2, 3.4, t, m) + roofTop(k, x, w, top, t, m, 'B');
    }
    return s + yard(k, t, m, x, w, yb);
  }
  function glass(k, t) {
    const m = PAL.C[t], [w0, fd] = dims(k), w = Math.max(20, w0 - 6 - (t >= 4 ? 2 : 0)), x = 10, yb = 52; let s = pad(t, false);
    if (t === 1) s += container(x, yb, '#7a8b94') + container(x + 13, yb, '#6a7b84') + container(x + 6, yb - 6, '#8a9ba4') + RC(x + 4, yb - 5, 5, 5, '#0c1012', KI, .3) + LN(x + 22, yb - 12, x + 22, yb - 22, '#b8c0c3', 1) + light(x + 22, yb - 22, ICE);
    else {
      const fl = Math.max(1, [0, 1, 2, 3, 3, 4][t] + fd), fh = 7.6;
      let cw = w, cx = x, cy = yb;
      for (let i = 0; i < (t >= 4 ? 2 : 1); i++) {
        const fls = t >= 4 ? (i === 0 ? Math.ceil(fl * .55) : Math.floor(fl * .5) + 1) : fl, h = fls * fh + 3;
        s += box(cx, cy, cw, h, 8, m, { trim: m.trim, gear: false });
        s += RC(cx + 1.5, cy - h + 3, cw - 3, h - 6, 'rgba(120,220,240,.16)');
        for (let f = 0; f < fls; f++) s += wins(cx + 2.4, cy - h + 3.6 + f * fh, Math.floor((cw - 4) / 3.6), 1, m, 2.6, 4.4, 1, 0, t >= 3);
        for (let c = 1; c < 4; c++) s += LN(cx + cw * c / 4, cy - h + 1, cx + cw * c / 4, cy - 1, 'rgba(255,255,255,.14)', .4);
        cy -= h; cx += 4; cw -= 8;
      }
      s += door(x + w / 2 - 3, yb, 6, 7);
      if (t >= 4) s += mast(cx + cw / 2, cy, 8 + t, m, 1);
      if (t >= 5) s += `<ellipse cx="${cx + cw / 2}" cy="${cy - 9}" rx="9" ry="2.6" fill="none" stroke="${ICE}" stroke-width=".9" class="glw"/>${glow(cx + cw / 2, cy - 9, 12, 'gGI')}<path d="M${cx + cw / 2} ${cy}V${cy - 13}" stroke="#dfe6e8" stroke-width="1.6"/>${CI(cx + cw / 2, cy - 14, 1.8, ICE, 'class="glw"')}`;
      s += emblem(k, x + w / 2, yb - (fl * fh + 3) * (t >= 4 ? .45 : .5) - 1, 3.6, t, m) + roofTop(k, cx, cw, cy, t, m, 'C');
    }
    return s + yard(k, t, m, x, w, yb);
  }
  function frontier(k, t) {
    const m = PAL.D[t], [w0, fd] = dims(k), w = w0 - 2, x = 8, yb = 52; let s = pad(t, false);
    if (t === 1) s += `${P([[x, yb], [x + 6, yb - 14], [x + w - 8, yb - 14], [x + w - 2, yb]], '#7a5a34', KI, .6)}${P([[x, yb], [x + 6, yb - 14], [x + w - 8, yb - 14], [x + w - 2, yb]], 'url(#gT)')}${[0, 1, 2, 3, 4].map(i => LN(x + 4 + i * 6, yb - 1, x + 7 + i * 5, yb - 13, 'rgba(0,0,0,.25)', .5)).join('')}${RC(x + 9, yb - 9, 9, 9, '#1a1208', KI, .4)}${barrel(x + w + 3, 56, '#8a3d2a')}${crate(x + w - 2, 59, 5, '#8a6a3a')}`;
    else {
      const fl = Math.max(1, [0, 1, 1, 2, 2, 2][t] + fd), h = fl * 9 + 4, top = yb - h;
      s += box(x, yb, w, h, 9, m, { trim: m.trim, roof: 'gable', rh: 6 + t, ridge: '#e9d8b4', gear: false });
      for (let f = 0; f < fl; f++) s += wins(x + 4, yb - h + 4 + f * 9, Math.floor((w - 8) / 6.5), 1, m, 3.6, 3.4, 2.9, 0, t >= 3);
      s += door(x + w / 2 - 3, yb, 6.4, 7.6);
      if (t >= 3) s += RC(x + w - 6, top - 13, 4, 12, '#5a3a2a', KI, .5) + RC(x + w - 7, top - 14.4, 6, 2, '#3a2418', KI, .4) + `<path d="M${x + w - 4} ${top - 15}q-2-3 0-5 2-2 0-5" stroke="rgba(220,220,210,.6)" stroke-width="1.4" fill="none" stroke-linecap="round" class="glw"/>`;
      if (t >= 2) s += [x + 3, x + w - 6].map(px => RC(px, yb - 3.6, 3, 3.6, 'rgba(0,0,0,.3)')).join('') + RC(x, yb - 1.4, w, 1.4, '#6b6459', KI, .3);
      if (t >= 4) s += RC(x + 3, top + 2, w - 6, 1, '#c9a25a') + [x + 3, x + w / 2, x + w - 4].map(rx => CI(rx, top + 2.5, .7, '#e0d2a0')).join('') + RC(x - 6, yb - 12, 6, 12, m.f, KI, .5) + P([[x - 7, yb - 12], [x - 3, yb - 17], [x + 1, yb - 12]], m.roof, KI, .5);
      if (t >= 5) s += [x + 4, x + w - 4].map(lx => LN(lx, top + 6, lx, top + 9, '#5a4028', .6) + CI(lx, top + 10, 1.2, '#ffd27a', 'class="glw"') + glow(lx, top + 10, 5)).join('') + RC(x - 3, yb - 4, w + 6, 4, '#4a4f55', KI, .5) + flag(x + w / 2, top - 6, 10, RED);
      s += emblem(k, x + w / 2, top + (fl > 1 ? h * .28 : h * .32) + 1, 3.2, t, m);
      s += roofTop(k, x, w, top - 6 - t, t, m, 'D');
    }
    return s + yard(k, t, m, x, w, yb);
  }
  const STYLES = { B: bunker, C: glass, D: frontier };
  function draw(style, k, t) {
    if (RURAL.includes(k)) { const save = roofFill; return svgWrap(rural(k, t, PAL[style][t], style)); }
    const orig = roofFill;
    if (style === 'D') roofFill = m => m.roof;
    try { return svgWrap(STYLES[style](k, t)); } finally { roofFill = orig; }
  }
  return { draw };
})();
