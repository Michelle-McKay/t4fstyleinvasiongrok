'use strict';
/* IRON MARCH — in-app purchase layer.
   Real money moves ONLY through the platform stores (Apple StoreKit / Google Play Billing) inside a native wrapper.
   In a plain browser this runs in SANDBOX mode: no payment, clearly labelled, for demos and testing.
   Fulfilment is idempotent per transaction id. See docs/IAP.md for wrapper, server validation and compliance steps. */
const IAP_CONFIG = {
  provider: 'sandbox',         // pinned to sandbox: real payments need server validation first (docs/IAP.md)
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
  { id: 'com.ironmarch.dia.14500', group: 'dia', n: 'Sovereign Vault', dia: 10000, bonus: 4500, usd: 99.99, gem: 6 }
  /* Themed packs live in js/packs.js and are appended to this catalog. */
];
function iapEnsure() { S.iap = S.iap || { tx: {}, first: {}, once: {}, hist: [] }; return S.iap; }
function iapProduct(id) { return IAP_CATALOG.find(p => p.id === id); }
/* Idempotent fulfilment: a transaction id can only ever pay out once. */
function iapFulfill(id, txId, src) {
  const p = iapProduct(id), st = iapEnsure(); if (!p) return 'Unknown product.';
  if (!txId) return 'Missing transaction.'; if (st.tx[txId]) return 'Already applied.';
  if (p.once && st.once[id]) return 'That pack is one per commander.';
  let dia = (p.dia || 0) + (p.bonus || 0); if (p.group === 'dia' && !st.first[id]) { dia += p.dia; st.first[id] = 1; }
  st.tx[txId] = Date.now(); if (p.once) st.once[id] = 1;
  if (VIP_COUNT_DIAMONDS || p.group !== 'dia') vipAdd(Math.round(p.usd * VIP_PER_USD), p.n);
  dchg(dia, `${src === 'sandbox' ? 'Sandbox ' : ''}Purchase: ${p.n}`); if (p.give) packGrant(p.give);
  st.hist.unshift({ t: Date.now(), id, n: p.n, tx: txId, src, dia }); if (st.hist.length > 40) st.hist.length = 40;
  note(dia ? `${p.n} delivered: ${fmtN(dia)} diamonds.` : `${p.n} delivered.`, 'good'); return null;
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
