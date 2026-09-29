'use strict';
/* IRON MARCH — kingdoms: simulated rival kingdoms, view/teleport rules. No server yet, so everything here is derived
   deterministically from the kingdom number. To move to real data, replace KD_LIST() and keep the same row shape:
   { k, name, ally: {tag, name}, pop, level: 'High'|'Medium'|'Low', launched: ms, isNew }. */
const KD_HOME_DEFAULT = 12, KD_COUNT = 48, KD_NOVICE = 2, KD_NOVICE_MAXCC = 5;
const KD_ADJ = ['Iron', 'Ash', 'Cinder', 'Slate', 'Rust', 'Frost', 'Ember', 'Brass', 'Storm', 'Dust', 'Coal', 'Steel'];
const KD_NOUN = ['Reach', 'Basin', 'Marches', 'Frontier'];
const KD_ALLY = ['Iron Wolves', 'Dust Devils', 'Ember Guard', 'Night Owls', 'Steel Rain', 'Cold Front', 'Red Tide', 'Black Sun', 'Long Watch', 'Ash Kings', 'Rust Legion', 'Grey Ravens', 'Storm Union', 'Coal Crown', 'Signal Fire', 'Deep Roots'];
const kdHash = (n, s) => { let h = (n * 2654435761 + s * 40503) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13; return (h >>> 0) / 4294967296; };
const KD_EPOCH = Date.UTC(2026, 0, 5), KD_DAY = 86400000;
let kdCache = null;
function KD_LIST() {
  if (kdCache) return kdCache;
  kdCache = [];
  for (let k = 1; k <= KD_COUNT; k++) {
    const idx = (k * 7) % KD_COUNT, an = KD_ALLY[Math.floor(kdHash(k, 2) * KD_ALLY.length)], newest = k >= KD_COUNT - 1;
    const pop = Math.round(newest ? 1200 + kdHash(k, 3) * 3600 : (5000 + kdHash(k, 3) * 40000) * (1 - (k / KD_COUNT) * .45));
    kdCache.push({ k, name: KD_ADJ[idx % 12] + ' ' + KD_NOUN[Math.floor(idx / 12)], ally: k === KD_COUNT ? { tag: '---', name: 'Unclaimed' } : { tag: an.split(' ').map(w => w[0]).join('') + an.split(' ')[1].slice(1, 3).toUpperCase(), name: an }, pop, level: pop < 12000 ? 'Low' : pop < 26000 ? 'Medium' : 'High', launched: KD_EPOCH + (k - 1) * 5 * KD_DAY, isNew: k === KD_COUNT });
  }
  return kdCache;
}
const kdGet = k => KD_LIST()[k - 1] || null;
function kHome() { if (S.kingdom == null) { S.kingdom = KD_HOME_DEFAULT; S.novice = KD_NOVICE; } return S.kingdom; }
const viewK = () => MAP.kv == null ? kHome() : MAP.kv;
const isForeign = () => viewK() !== kHome();
const noviceLeft = () => { kHome(); return S.novice == null ? KD_NOVICE : S.novice; };
function novTpErr() {
  if (ccLevel() > KD_NOVICE_MAXCC) return 'Only Command Center ' + KD_NOVICE_MAXCC + ' and lower can teleport between kingdoms.';
  if (noviceLeft() <= 0) return 'Both novice teleports are used.';
  if (S.marches.length) return 'Recall your columns before leaving the kingdom.';
  return null;
}
const novTpLine = () => `Novice teleports left: <b class="num">${noviceLeft()}</b> of ${KD_NOVICE}. They never expire.`;
const kdDate = ms => new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
