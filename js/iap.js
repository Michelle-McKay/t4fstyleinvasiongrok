'use strict';
/* IRON MARCH — in-app purchase layer.
   Real money moves ONLY through the platform stores (Apple StoreKit / Google Play Billing) inside a native wrapper.
   In a plain browser this runs in SANDBOX mode: no payment, clearly labelled, for demos and testing.
   Fulfilment is idempotent per transaction id. See docs/IAP.md for wrapper, server validation and compliance steps. */
const IAP_CONFIG = {
  provider: 'auto',            // 'auto' | 'sandbox' | 'native'
  validatorUrl: '',            // your receipt-validation endpoint (required for production, see docs/IAP.md)
  termsUrl: '#terms', privacyUrl: '#privacy', refundUrl: '#refunds', supportEmail: 'support@example.com'
};
/* Product ids must match App Store Connect and Play Console exactly. All are consumables. */
const IAP_CATALOG = [
  { id: 'com.ironmarch.dia.100', group: 'dia', n: 'Handful', dia: 100, usd: 0.99, gem: 1 },
  { id: 'com.ironmarch.dia.550', group: 'dia', n: 'Pouch', dia: 500, bonus: 50, usd: 4.99, gem: 2 },
  { id: 'com.ironmarch.dia.1200', group: 'dia', n: 'Crate', dia: 1000, bonus: 200, usd: 9.99, gem: 3, tag: 'Popular' },
  { id: 'com.ironmarch.dia.2600', group: 'dia', n: 'Strongbox', dia: 2000, bonus: 600, usd: 19.99, gem: 4 },
  { id: 'com.ironmarch.dia.6800', group: 'dia', n: 'Arsenal', dia: 5000, bonus: 1800, usd: 49.99, gem: 5, tag: 'Best value' },
  { id: 'com.ironmarch.dia.14500', group: 'dia', n: 'Sovereign Vault', dia: 10000, bonus: 4500, usd: 99.99, gem: 6 },
  { id: 'com.ironmarch.pack.starter', group: 'pack', n: 'Starter Pack', once: true, usd: 2.99, dia: 300, give: { s60: 2, tokens: 1, rations: 20000, alloy: 10000 }, tag: 'One time', art: 'starter' },
  { id: 'com.ironmarch.pack.warpath', group: 'pack', n: 'Warpath Pack', usd: 7.99, dia: 400, give: { s480: 2, s60: 4, tokens: 3 }, art: 'warpath' },
  { id: 'com.ironmarch.pack.foundry', group: 'pack', n: 'Foundry Pack', usd: 14.99, dia: 800, give: { bars: { 2: 6, 3: 3, 4: 1 }, shard: 'battery', rations: 60000, fuel: 50000, power: 50000, alloy: 40000 }, art: 'foundry' }
];
const IAP_GIVE_TXT = { s5: '5-minute slip', s60: '1-hour slip', s480: '8-hour slip', tokens: 'Coordination token', rations: 'Rations', fuel: 'Fuel', power: 'Power', alloy: 'Alloy', cash: 'Cash' };
function iapEnsure() { S.iap = S.iap || { tx: {}, first: {}, once: {}, hist: [] }; return S.iap; }
function iapProduct(id) { return IAP_CATALOG.find(p => p.id === id); }
function iapContents(p) {
  const first = !iapEnsure().first[p.id] && p.group === 'dia', base = (p.dia || 0) + (p.bonus || 0), c = [];
  c.push(`${fmtN(base)} diamonds${p.bonus ? ` (${p.dia} + ${p.bonus} bonus)` : ''}`);
  if (first) c.push(`First purchase: +${fmtN(p.dia)} bonus diamonds`);
  if (p.give) for (const k in p.give) { if (k === 'bars') for (const g in p.give.bars) c.push(`${p.give.bars[g]} grade-${g} bars`); else if (k === 'shard') c.push(`1 ${SETS[p.give.shard].n} shard`); else if (RES.includes(k)) c.push(fmtN(p.give[k]) + ' ' + RESN[k]); else c.push(p.give[k] + '× ' + IAP_GIVE_TXT[k]); }
  return c;
}
/* Idempotent fulfilment: a transaction id can only ever pay out once. */
function iapFulfill(id, txId, src) {
  const p = iapProduct(id), st = iapEnsure(); if (!p) return 'Unknown product.';
  if (!txId) return 'Missing transaction.'; if (st.tx[txId]) return 'Already applied.';
  if (p.once && st.once[id]) return 'That pack is one per commander.';
  let dia = (p.dia || 0) + (p.bonus || 0); if (p.group === 'dia' && !st.first[id]) { dia += p.dia; st.first[id] = 1; }
  st.tx[txId] = Date.now(); if (p.once) st.once[id] = 1;
  dchg(dia, `${src === 'sandbox' ? 'Sandbox ' : ''}Purchase: ${p.n}`); if (p.give) grant(p.give);
  st.hist.unshift({ t: Date.now(), id, n: p.n, tx: txId, src, dia }); if (st.hist.length > 40) st.hist.length = 40;
  note(`${p.n} delivered: ${fmtN(dia)} diamonds.`, 'good'); return null;
}
/* ---------------- providers ---------------- */
const IAP = {
  mode() { return IAP_CONFIG.provider === 'sandbox' ? 'sandbox' : (window.CdvPurchase && IAP_CONFIG.provider !== 'sandbox') ? 'native' : 'sandbox'; },
  ready: false, native: {},
  price(p) {
    if (IAP.mode() === 'native') { const o = IAP.native[p.id]; if (o) return o; }
    return '$' + p.usd.toFixed(2);
  },
  init() {
    if (IAP.mode() !== 'native' || IAP.ready) return; IAP.ready = true;
    /* cordova-plugin-purchase v13 (works inside a Capacitor or Cordova wrapper). Needs device testing. */
    const { store, ProductType } = CdvPurchase, plat = store.defaultPlatform();
    store.register(IAP_CATALOG.map(p => ({ id: p.id, type: ProductType.CONSUMABLE, platform: plat })));
    if (IAP_CONFIG.validatorUrl) store.validator = IAP_CONFIG.validatorUrl;
    store.when().productUpdated(() => { for (const p of IAP_CATALOG) { const pr = store.get(p.id, plat), o = pr && pr.getOffer(); if (o && o.pricing) IAP.native[p.id] = o.pricing.price; } UI.dirty = true; })
      .approved(t => t.verify()).verified(r => r.finish())
      .finished(t => { const tx = t.transactionId; t.products.forEach(pr => { const e = iapFulfill(pr.id, tx, 'store'); if (e && e !== 'Already applied.') toast(e, 'warn'); UI.dirty = true; }); });
    store.error(e => toast('Store: ' + (e.message || 'purchase failed'), 'warn'));
    store.initialize([plat]);
  },
  buy(id) {
    const p = iapProduct(id); if (!p) return Promise.resolve('Unknown product.');
    if (p.once && iapEnsure().once[id]) return Promise.resolve('That pack is one per commander.');
    if (IAP.mode() === 'native') { const { store } = CdvPurchase, pr = store.get(id, store.defaultPlatform()), o = pr && pr.getOffer(); if (!o) return Promise.resolve('Store product unavailable. Try again later.'); return store.order(o).then(e => e ? (e.message || 'Purchase cancelled.') : null); }
    return Promise.resolve(iapFulfill(id, 'sbx-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8), 'sandbox'));
  },
  restore() { if (IAP.mode() === 'native') return CdvPurchase.store.restorePurchases().then(() => null); return Promise.resolve('Sandbox: nothing to restore. Diamond packs are consumable.'); }
};

/* ---------------- art ---------------- */
function gemSVG(n) {
  const g = (x, y, s, c) => `<polygon points="${x},${y - s} ${x + s * .8},${y - s * .2} ${x},${y + s} ${x - s * .8},${y - s * .2}" fill="${c}" stroke="#0e1113" stroke-width=".8"/><polygon points="${x},${y - s} ${x + s * .8},${y - s * .2} ${x},${y - s * .2}" fill="rgba(255,255,255,.35)"/>`;
  const pos = [[32, 40, 9], [20, 44, 7], [44, 44, 7], [26, 30, 6], [40, 30, 6], [32, 22, 7], [14, 36, 5], [50, 36, 5]];
  return `<svg viewBox="0 0 64 56" class="gm"><ellipse cx="32" cy="50" rx="24" ry="4" fill="rgba(0,0,0,.5)"/>${pos.slice(0, Math.min(8, n + 2)).map(([x, y, s], i) => g(x, y, s + (n > 4 ? 1 : 0), i % 2 ? '#3aa3b8' : '#5ec4d4')).join('')}</svg>`;
}
function packArt(a) {
  const b = { starter: '<rect x="12" y="24" width="40" height="24" fill="#4a4d44" stroke="#0e1113"/><path d="M12 30h40" stroke="#e0a44a" stroke-width="3"/><rect x="28" y="24" width="8" height="24" fill="#e0a44a"/><path d="M20 24l12-10 12 10" fill="#5b5f52" stroke="#0e1113"/>', warpath: '<path d="M10 44l14-26 14 26z" fill="#4b5a3a" stroke="#0e1113"/><path d="M28 44l14-20 14 20z" fill="#5c676d" stroke="#0e1113"/><rect x="30" y="8" width="2" height="18" fill="#b8c0c3"/><polygon points="32,8 46,13 32,18" fill="#d4654a"/>', foundry: '<rect x="10" y="30" width="36" height="18" fill="#3c474e" stroke="#0e1113"/><rect x="14" y="12" width="9" height="20" fill="#59646a" stroke="#0e1113"/><rect x="26" y="20" width="9" height="12" fill="#59646a" stroke="#0e1113"/><rect x="20" y="38" width="12" height="10" fill="#e07a2f"/><polygon points="44,48 46,42 58,42 60,48" fill="#9aa4a8" stroke="#0e1113"/>' }[a] || '';
  return `<svg viewBox="0 0 64 56" class="gm"><ellipse cx="32" cy="51" rx="26" ry="4" fill="rgba(0,0,0,.5)"/>${b}</svg>`;
}

/* ---------------- store UI ---------------- */
function iapCard(p) {
  const done = p.once && iapEnsure().once[p.id], first = p.group === 'dia' && !iapEnsure().first[p.id];
  return `<button class="pk ${p.tag === 'Best value' ? 'hot' : ''}" data-a="iapopen" data-id="${p.id}" ${done ? 'disabled' : ''}>${p.tag ? `<em class="pt">${p.tag}</em>` : ''}${p.group === 'dia' ? gemSVG(p.gem) : packArt(p.art)}<b class="pn">${p.n}</b><span class="pd num">${p.group === 'dia' ? fmtN((p.dia || 0) + (p.bonus || 0)) + '◆' : fmtN(p.dia) + '◆ +'}</span><span class="ps">${p.group === 'dia' ? (first ? 'First buy ×2 bonus' : p.bonus ? `+${p.bonus} bonus` : 'Diamonds') : (done ? 'Owned' : 'Bundle')}</span><span class="pp">${done ? 'Bought' : IAP.price(p)}</span></button>`;
}
function iapHTML() {
  IAP.init(); const sb = IAP.mode() === 'sandbox';
  return `${sb ? `<div class="panel" style="border-color:var(--brass)"><div class="bd sub"><b class="br">Demo build.</b> Purchases run in sandbox mode: no money is charged and prices are placeholders. Real purchases run through the App Store or Google Play in the store app.</div></div>` : ''}
  <div class="panel"><div class="hd"><h3>Diamonds</h3><b class="num br">${fmtN(S.dia)}◆</b></div><div class="bd"><div class="pkg">${IAP_CATALOG.filter(p => p.group === 'dia').map(iapCard).join('')}</div></div></div>
  <div class="panel"><div class="hd"><h3>Bundles</h3></div><div class="bd"><div class="pkg">${IAP_CATALOG.filter(p => p.group === 'pack').map(iapCard).join('')}</div></div></div>
  <div class="flex wrap mb"><button class="btn sm line" data-a="iaprestore">Restore purchases</button><button class="btn sm line" data-a="iaphist">History</button><span class="sub">Prices are set and charged by the store. Diamonds have no cash value.</span></div>`;
}
function sheetIap(id) {
  const p = iapProduct(id); if (!p) return ''; const sb = IAP.mode() === 'sandbox';
  return `<div class="flex sp"><div class="flex">${p.group === 'dia' ? gemSVG(p.gem) : packArt(p.art)}<div><div class="h1">${p.n}</div><div class="sub">${p.group === 'dia' ? 'Diamond pack' : 'Bundle'}${p.once ? ' · one per commander' : ''}</div></div></div><button class="btn sm line" data-a="closesheet">Close</button></div>
  <div class="panel mt"><div class="hd"><h3>You receive</h3></div><div class="bd">${iapContents(p).map(c => `<div class="rr"><span>${c}</span></div>`).join('')}<div class="sub mt">Contents are fixed. Nothing here is random.</div></div></div>
  <div class="flex sp mt"><b class="big num">${IAP.price(p)}</b><button class="btn pri tall" data-a="iapbuy" data-id="${p.id}">${sb ? 'Confirm · no charge' : 'Buy'}</button></div>
  <div class="sub mt">${sb ? 'Demo build: nothing is charged.' : 'Payment and taxes are handled by your store account.'} Purchases are final except where the store or local law provides refunds. <a href="${IAP_CONFIG.termsUrl}" class="br">Terms</a> · <a href="${IAP_CONFIG.privacyUrl}" class="br">Privacy</a> · <a href="${IAP_CONFIG.refundUrl}" class="br">Refunds</a></div>`;
}
function iapHistHTML() { const h = iapEnsure().hist; return `<div class="panel"><div class="hd"><h3>Purchase history</h3></div><div class="bd">${h.map(x => `<div class="rr"><span>${x.n}${x.src === 'sandbox' ? ' (sandbox)' : ''}</span><span class="num">${new Date(x.t).toLocaleDateString()} · +${fmtN(x.dia)}◆</span></div>`).join('') || '<div class="sub">No purchases yet.</div>'}</div></div>`; }
Object.assign(A, {
  iapopen(d) { sheetOpen({ type: 'iap', id: d.id }); },
  iapbuy(d) { IAP.buy(d.id).then(e => { if (e) toast(e, 'warn'); else { hap([16, 50, 16]); beep(760, .12, .05); beep(1140, .18, .05); UI.sheet = null; } UI.dirty = true; }); },
  iaprestore() { IAP.restore().then(e => { toast(e || 'Restore requested. Purchases will re-apply.', e ? 'info' : 'good'); }); },
  iaphist() { UI.iapHist = !UI.iapHist; UI.dirty = true; }
});
DR.hero.body = t => ({ forge: forgeHTML, heroes: heroesHTML, store: () => iapHTML() + (UI.iapHist ? iapHistHTML() : '') + storeHTML().replace('<h3>Packs</h3>', '<h3>Spend diamonds: crates</h3>'), market: marketHTML, ledger: ledgerHTML })[t]();
