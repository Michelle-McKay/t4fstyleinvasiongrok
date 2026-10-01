'use strict';
/* IRON MARCH — VIP screen and badge art. Rules and numbers live in js/vip.js. */
/* ---------------- art: painted badge when listed, vector shield otherwise ---------------- */
function vipArtKey(level) { return level <= 10 ? 'vip_' + Math.max(1, Math.ceil(level / 2)) : 'vip_' + level; }
const VIP_METAL = [['#7a5a36', '#4a3520'], ['#a8794a', '#6b4a2a'], ['#b9c0c6', '#6c767d'], ['#d9dfe3', '#2e4d7a'], ['#e0b24a', '#2e4d7a'], ['#f1f3f4', '#2e4d7a']];
function vipBadgeSVG(level) {
  level = Math.max(1, Math.min(VIP_MAX, level | 0)); const f = typeof ART !== 'undefined' && ART.file(vipArtKey(level));
  if (f) return `<div class="vbadge"><img src="${f}" alt="" draggable="false"><i class="num">${level}</i></div>`;
  const [rim, field] = VIP_METAL[level <= 10 ? Math.min(4, Math.ceil(level / 2) - 1) : 5];
  return `<div class="vbadge"><svg viewBox="0 0 64 74"><path d="M6 8h22l4 4 4-4h22v32c0 14-12 24-26 30C18 64 6 54 6 40z" fill="${rim}" stroke="#0e1113" stroke-width="1.5"/><path d="M11 13h17l4 4 4-4h17v26c0 11-9 19-21 25-12-6-21-14-21-25z" fill="${field}"/><path d="M32 22l3.2 6.6 7.2 1-5.2 5 1.3 7.2L32 38.4l-6.5 3.4 1.3-7.2-5.2-5 7.2-1z" fill="${rim}" opacity=".9"/></svg><i class="num">${level}</i></div>`;
}

/* ---------------- screen ---------------- */
function vipHTML() {
  vipEnsure(); const pts = vipPts(), lv = vipLevel(), sel = Math.max(1, Math.min(VIP_MAX, UI.vipSel || Math.min(VIP_MAX, lv + 1)));
  const next = lv < VIP_MAX ? VIP_LEVELS[lv][0] : null, prev = lv ? VIP_LEVELS[lv - 1][0] : 0, pct = next ? Math.min(100, (pts - prev) / (next - prev) * 100) : 100;
  const unlocked = sel <= lv, need = VIP_LEVELS[sel - 1][0], usd = VIP_LEVELS[sel - 1][1];
  const rows = vipPerkRows(sel).map(r => `<div class="vperk">${r}</div>`).join('');
  return `<div class="panel vhead"><div class="bd"><div class="flex">${lv ? vipBadgeSVG(lv) : '<div class="vbadge off"><svg viewBox="0 0 64 74"><path d="M6 8h22l4 4 4-4h22v32c0 14-12 24-26 30C18 64 6 54 6 40z" fill="#2a3338" stroke="#3c474e" stroke-width="1.5"/></svg><i class="num">0</i></div>'}
    <div class="grow"><div class="vline">Total VIP points <b class="num br">${fmtN(pts)}</b> · Current level <b class="num br">${lv}</b></div>
    <div class="vbar"><span style="width:${pct}%"></span><em class="num">${next ? fmtN(pts) + ' / ' + fmtN(next) : 'Top level'}</em></div>
    <div class="sub">${next ? `${fmtN(next - pts)} points to VIP ${lv + 1}` : 'VIP 15 reached. Nothing more to earn.'}</div></div>
    <button class="btn pri" data-a="drawer" data-id="hero" data-tab="store" aria-label="Get VIP points">+</button></div></div></div>
  <div class="panel"><div class="hd"><button class="btn sm line" data-a="vipnav" data-d="-1" ${sel <= 1 ? 'disabled' : ''}>‹</button><h3>VIP ${sel} ${unlocked ? '<span class="tag br">Unlocked</span>' : '<span class="tag">Locked</span>'}</h3><button class="btn sm line" data-a="vipnav" data-d="1" ${sel >= VIP_MAX ? 'disabled' : ''}>›</button></div>
    <div class="bd"><div class="sub">${fmtN(need)} total points (about $${usd.toLocaleString('en-US', { minimumFractionDigits: 2 })} of packs). Perks are cumulative.</div><div class="vperks mt">${rows}</div></div></div>
  <div class="panel"><div class="hd"><h3>How VIP works</h3></div><div class="bd sub">VIP is permanent: once a level is reached it never drops, and there are no timers or daily login chests. Points come only from themed packs (${VIP_PER_USD} points per $1.00) and Alliance Store purchases (${VIP_AP_RATE} point per alliance point spent).${IAP.mode() === 'sandbox' ? ' <b class="br">Demo build:</b> pack purchases are sandbox and still add points so you can test.' : ''}</div></div>
  <div class="flex wrap mb"><button class="btn pri grow tall" data-a="drawer" data-id="hero" data-tab="store">Get VIP points</button><button class="btn line grow tall" data-a="drawer" data-id="alliance" data-tab="astore">Alliance Store</button></div>`;
}
DR.vip = { tabs: [['vip', 'VIP']], body: vipHTML };
DRAWERS.push('vip'); UI.dt.vip = 'vip';
Object.assign(A, { vipnav(d) { UI.vipSel = Math.max(1, Math.min(VIP_MAX, (UI.vipSel || Math.min(VIP_MAX, vipLevel() + 1)) + (+d.d))); D(); } });
