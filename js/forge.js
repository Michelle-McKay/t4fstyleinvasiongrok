'use strict';
/* IRON MARCH — the Forge: six rooms, gems and sockets, and the alliance store. Spec: docs/FORGE_GEMS.md.
   Rooms: Gear Sets, Equipment, Workshop, Smelter, Blueprints, Vault. Opened from Hero › Forge or the Forge building. */
const FORGE_ROOMS = [['sets', 'Gear Sets'], ['equip', 'Equipment'], ['bench', 'Workshop'], ['smelt', 'Smelter'], ['arch', 'Blueprints'], ['vault', 'Vault']];
const EQ_FILTERS = [['all', 'Entire list', null], ['helmet', 'Helmets', ['helmet']], ['armor', 'Armor', ['chest']], ['boots', 'Boots', ['boots']], ['weapon', 'Weapons', ['weapon']], ['acc', 'Accessories', ['accessory']]];
Object.assign(UI, { fr: 'sets', eqf: 'all', gsel: {}, sk: null, setOpen: {}, setTab: 'week' });

const pctT = v => '+' + (v * 100).toFixed(1).replace(/\.0$/, '') + '%';
const pieceName = p => qName(p.grade) + ' ' + pieceTitle(p) + (p.stars ? ' ' + '★'.repeat(p.stars) : '');
const noForge = () => `<div class="panel" style="border-color:var(--signal)"><div class="bd"><div class="h1">No Forge</div><div class="sub mt">Build a Forge on an empty inner plot to use this room.</div></div></div>`;
const recipeHave = rec => { if (!rec) return 'Recipe: category materials (no named recipe for this slot yet). The craft spends four tier materials.'; const n = nmNeed(rec); return 'Recipe (spent with the four tier materials): ' + Object.keys(n).map(k => `<span class="${(S.nm[k] || 0) >= n[k] ? 'up' : 'dn'}">${n[k] > 1 ? n[k] + 'x ' : ''}${k} (${S.nm[k] || 0})</span>`).join(', '); };
const nmPanel = () => { const ks = Object.keys(S.nm).filter(k => S.nm[k] > 0).sort(); return `<div class="panel"><div class="hd"><h3>Named materials</h3><span class="tag">${ks.reduce((a, k) => a + S.nm[k], 0)} in stock</span></div><div class="bd"><div class="sub">Basic names drop from regular tiles, quests and alliance chests. A set's own names and the shared monster names drop from monster loot tiles; holiday names only from that holiday's monster.</div><div class="flex wrap mt">${ks.map(k => `<span class="tag">${k} <b class="num">${S.nm[k]}</b></span>`).join('') || '<span class="sub">None yet.</span>'}</div></div></div>`; };
const gemKeys = () => Object.keys(S.gems).filter(k => S.gems[k] > 0).sort((a, b) => { const x = gemSplit(a), y = gemSplit(b); return (gemIsSet(x[0]) - gemIsSet(y[0])) || x[0].localeCompare(y[0]) || x[1] - y[1]; });
const gemLabel = k => { const [kd, t] = gemSplit(k); return `<span style="color:${QUALITY[t].col}">${gemTierName(t)}</span> · ${gemName(kd)}`; };
const gemLine = k => { const [kd, t] = gemSplit(k), g = GEMS[kd]; return `${pctT(gemPower(kd, t))} ${GEM_DESC[kd] || g.lab}${g.syn ? ' (' + 'full set worn, all level 6' + ')' : ''}`; };
const stoneBtn = k => { const [kd, t] = gemSplit(k); return `<i class="ui">${stoneSVG(kd, t)}</i>`; };
/* the one socket of a piece: filled (tap to remove when bench=true), open, or locked until its first Vault star */
function socketStrip(p, bench) {
  const g = p.gem, open = socketOpen(p); let h = '<div class="flex" style="gap:4px;margin-top:3px">';
  if (g && open) { const [kd, t] = gemSplit(g); h += bench ? `<button class="sock on" data-a="unsock" data-id="${p.id}" title="Remove ${gemName(kd)}"><i class="ui">${stoneSVG(kd, t)}</i></button>` : `<span class="sock on"><i class="ui">${stoneSVG(kd, t)}</i></span>`; }
  else if (open) h += `<span class="sock"><i class="ui">${emptySocket()}</i></span>`;
  else h += `<span class="sock lk" title="The socket opens at ${GEM_SOCKET_STARS} star in the Vault"><i class="ui">${lockedSocket()}</i></span>`;
  return h + '</div>';
}
function gemBonusText(p) {
  if (!socketOpen(p)) return `Socket opens at ${GEM_SOCKET_STARS} star in the Vault.`;
  if (!p.gem) return 'No gem socketed.';
  const [kd, t] = gemSplit(p.gem), g = GEMS[kd], r = pieceGems(p), live = Object.keys(r).some(k => r[k] > 0);
  return `${gemLabel(p.gem)}: ${gemLine(p.gem)}` + (g.syn && !live ? ' · <span class="mut">waiting for more of the set</span>' : '');
}
function pieceRow(p, opt) {
  opt = opt || {}; const w = S.gear.worn[p.slot] === p.id, lk = setLocked(p);
  return `<div class="it"><i class="ui big">${gearSVG(p.slot, p.grade, p.set)}</i><div class="grow"><b class="h" style="font-size:15px">${pieceName(p)}</b><div class="sub">${pieceText(p)}${p.stars ? ' · ' + STAR_PCT * p.stars * 100 + '% star bonus' : ''}</div>${socketStrip(p, false)}${opt.gems ? `<div class="sub">${gemBonusText(p)}</div>` : ''}</div>${opt.extra || (lk && !w ? `<button class="btn sm" disabled>Hero Lv ${pieceLv(p)}</button>` : `<button class="btn sm ${w ? 'line' : 'pri'}" data-a="${w ? 'rack' : 'wear'}" data-id="${p.id}">${w ? 'Remove' : 'Equip'}</button>`)}</div>`;
}
const setIds = gearSetIds;
const slotsOwned = id => new Set(S.gear.pieces.filter(p => p.set === id).map(p => p.slot)).size;

/* ---------- room 1: Gear Sets ---------- */
function roomSets() {
  const cnt = setCounts(), act = activeSets(), hol = activeHolidays();
  const tabs = `<div class="tabs2">${[['basic', 'Basic Gear'], ['week', 'Regular Sets'], ['hol', 'Holiday Sets']].map(([k, n]) => `<button class="${UI.setTab === k ? 'on' : ''}" data-a="settab" data-k="${k}">${n}</button>`).join('')}</div>`;
  const head = `<div class="panel"><div class="hd"><h3>Gear Sets</h3><span class="tag">Hero Lv ${heroLv()}</span></div><div class="bd"><div class="sub">Five slots: Helmet, Armor, Footwear, Weapon, Accessory. Every piece takes exactly four materials. Set gear unlocks at its set's hero level (Lv 32 to 50); Basic gear unlocks by category from Lv 1 to 25. Set bonuses (and set synergy gems) work only with all five pieces of one set worn and every piece at level 6 (Legendary).</div></div></div>`;
  if (UI.setTab === 'basic') return head + tabs + `<div class="panel"><div class="hd"><h3>Basic Gear</h3><span class="tag">13 categories · 65 items</span></div><div class="bd">${BASIC_ORDER.map(id => { const b = BASIC[id], bi = SLOTS.map(sl => [sl, basicOf(id, sl)]), own = S.gear.pieces.filter(p => !p.set && p.cat === id), ok = heroLv() >= b.lv;
    return `<div class="rwrow"><div class="grow"><b>${b.n}</b> <span class="tag ${ok ? 'br' : ''}">Hero Lv ${b.lv}</span><div class="sub">${b.st.map(k => STAT_LAB[k]).join(', ')} · +${bi[0][1].vals[0]}% (Grey) to +${bi[0][1].vals[5]}% (Gold) per piece</div>${bi.filter(x => x[1].n).map(x => `<div class="sub"><b>${x[1].n}</b> (${SLOT_NAME[x[0]]}): ${x[1].mats}</div>`).join('')}<div class="sub">${bi.some(x => x[1].n) ? '' : 'Materials: ' + b.mats + ' · '} owned ${new Set(own.map(p => p.slot)).size}/5 slots</div></div><button class="btn sm" data-a="forgecat" data-id="${id}">Craft</button></div>`; }).join('')}</div></div>`;
  const ids = UI.setTab === 'hol' ? HSET_ORDER : SET_ORDER;
  const card = id => {
    const sp = SETS[id], n = cnt[id] || 0, open = UI.setOpen[id], live = !sp.hgear && act.includes(id), ok = heroLv() >= sp.lv;
    const mons = sp.hgear ? HOLIDAYS.filter(h => SETS['h_' + h.id].gear === id).map(h => h.mon).join(', ') : sp.mon;
    let h = `<div class="rwrow"><div class="grow"><button class="linkish" data-a="setopen" data-id="${id}"><b>${sp.n}</b></button> <span class="tag ${ok ? 'br' : ''}">Hero Lv ${sp.lv}</span> ${live ? '<span class="tag br">monster live</span>' : ''}<div class="sub">${sp.st.map(k => STAT_LAB[k]).join(', ')}</div><div class="sub"><span class="${setMaxed(id) ? 'up' : 'mut'}">full set + all level 6</span> · worn ${n}/5 · owned ${slotsOwned(id)}/5 · ${S.shards[id] || 0} shards</div></div><span class="num br">${n}/5</span></div>`;
    if (open) h += `<div class="bd"><div class="sub">${sp.hgear ? 'Dropped by' : 'Monster'}: <b>${mons}</b>. Their loot tiles drop ${sp.n} shards and set gems.</div><div class="sub">Core materials: ${sp.mats}</div>${SLOTS.filter(sl => setItemOf(id, sl).n).map(sl => { const si = setItemOf(id, sl); return `<div class="sub"><b>${si.n}</b> (${SLOT_NAME[sl]}, Hero Lv ${si.lv}): ${si.mats}</div>`; }).join('')}<div class="flex wrap mt">${SLOTS.map(sl => { const own = S.gear.pieces.filter(p => p.set === id && p.slot === sl).sort((a, b) => b.grade - a.grade)[0]; return `<span class="tag ${own ? 'br' : ''}">${SLOT_NAME[sl]}${own ? ' · ' + qName(own.grade) : ''}</span>`; }).join('')}</div>
      <div class="sub mt">${setDesc(id)}</div><div class="sub mt"><b>${sp.n} gems</b> (monster tiles only; one gem per piece):</div>${GEM_SETS[id].map(gid => `<div class="sub">${GEMS[gid].n}: ${GEM_DESC[gid] || GEMS[gid].lab}, ${GEMS[gid].lo}% to ${GEMS[gid].hi}%</div>`).join('')}
      <div class="flex mt"><button class="btn sm" data-a="forgego" data-id="${id}">Craft with shard</button></div></div>`;
    return h;
  };
  return head + tabs + `<div class="panel"><div class="bd">${ids.map(card).join('')}</div></div>`;
}

/* ---------- room 2: Equipment ---------- */
function roomEquip() {
  const f = EQ_FILTERS.find(x => x[0] === UI.eqf) || EQ_FILTERS[0], list = S.gear.pieces.filter(p => !f[2] || f[2].includes(p.slot)).sort((a, b) => b.grade - a.grade || SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot));
  return `<div class="panel"><div class="hd"><h3>Equipment</h3><span class="tag">${list.length}</span></div><div class="bd"><div class="tabs2">${EQ_FILTERS.map(x => `<button class="${UI.eqf === x[0] ? 'on' : ''}" data-a="eqf" data-k="${x[0]}">${x[1]}</button>`).join('')}</div>
  <div class="list mt">${list.map(p => pieceRow(p, { gems: 1 })).join('') || '<div class="sub">Nothing here. Craft some in the Workshop.</div>'}</div></div></div>`;
}

/* ---------- room 3: Workshop (4-to-1, craft, gems, sockets) ---------- */
function mixOdds(keys) {
  const m = {}; keys.forEach((k, i) => m[k] = (m[k] || 0) + MIX_ODDS[i]);
  return 'Mixed gem craft, the gamble: ' + Object.keys(m).map(k => `${gemTierName(gemSplit(k)[1])} · ${gemName(gemSplit(k)[0])} ${+(m[k] * 100).toFixed(1)}%`).join(' · ') + '. Hoard four of a kind instead.';
}
function roomBench() {
  if (!hasB('forge')) return noForge();
  const u = gradeUnits(), C = UI.cr, sel = C.sel, selN = sumCol(sel), fl = lvlMax('forge'), odds = craftOddsText(sel), keys = gemKeys(), gs = UI.gsel, gN = sumCol(gs);
  const bars = [1, 2, 3, 4, 5, 6].map(g => `<div class="flex sp" style="margin:4px 0"><i class="ui">${barSVG(g)}</i><span class="lbl" style="width:130px;white-space:normal;line-height:1.1;color:${QUALITY[g].col}">${matName(g)}</span><b class="num grow">${S.bars[g] || 0}</b><div class="step"><button data-a="crsel" data-g="${g}" data-d="-1">−</button><b class="num">${sel[g] || 0}</b><button data-a="crsel" data-g="${g}" data-d="1">+</button></div><button class="btn sm" data-a="refine" data-g="${g}" ${g < 6 && (S.bars[g] || 0) >= 4 && fl >= forgeGate(g) ? '' : 'disabled'}>${g < 6 && fl < forgeGate(g) ? 'Forge ' + forgeGate(g) : 'Combine 4'}</button></div>`).join('');
  const sorted = []; for (const k in gs) for (let i = 0; i < gs[k]; i++) sorted.push(k); sorted.sort((a, b) => gemSplit(a)[1] - gemSplit(b)[1]);
  const mixOk = gN === 4 && !sorted.every(k => k === sorted[0]);
  const gemRows = keys.map(k => { const [kd, t] = gemSplit(k), n = S.gems[k]; return `<div class="flex sp" style="margin:4px 0">${stoneBtn(k)}<div class="grow"><b>${gemLabel(k)}</b> <span class="num br">×${n}</span><div class="sub">${gemLine(k)}${gemIsSet(kd) ? ' · ' + SETS[GEMS[kd].set].n : ''}</div></div><div class="step"><button data-a="gsel" data-k="${k}" data-d="-1">−</button><b class="num">${gs[k] || 0}</b><button data-a="gsel" data-k="${k}" data-d="1">+</button></div><button class="btn sm" data-a="gemcomb" data-k="${k}" ${t < 6 && n >= 4 && fl >= forgeGate(t) ? '' : 'disabled'}>${t < 6 && fl < forgeGate(t) ? 'Forge ' + forgeGate(t) : 'Combine 4'}</button></div>`; }).join('') || '<div class="sub">No gems yet. Gather tiles, hunt monsters, open alliance chests and finish quests.</div>';
  const sp = S.gear.pieces.find(p => p.id === UI.sk), picks = S.gear.pieces.slice().sort((a, b) => b.grade - a.grade);
  const bench = `<div class="panel"><div class="hd"><h3>Socket bench</h3><span class="tag">1 gem per piece</span></div><div class="bd"><div class="sub">A fully upgraded piece (${GEM_SOCKET_STARS} star in the Vault) has one socket and holds one gem at a time. Socketing a second gem swaps the first back into your stock, and gems come out freely. Synergy gems add to every stat of their set once enough of it is worn.</div>
    <div class="flex wrap mt">${picks.map(p => `<button class="btn sm ${UI.sk === p.id ? 'on' : 'line'}" data-a="skpick" data-id="${p.id}"><i class="tic">${gearSVG(p.slot, p.grade, p.set)}</i>${pieceName(p)}</button>`).join('') || '<span class="sub">Craft a piece first.</span>'}</div>
    ${sp ? `<div class="mt"><b>${pieceName(sp)}</b>${socketStrip(sp, true)}<div class="sub">${gemBonusText(sp)}. Tap the socketed gem to take it out.</div><div class="list mt">${keys.map(k => `<div class="it">${stoneBtn(k)}<div class="grow"><b>${gemLabel(k)}</b> <span class="num br">×${S.gems[k]}</span><div class="sub">${gemLine(k)}</div></div><button class="btn sm pri" data-a="sockgem" data-id="${sp.id}" data-k="${k}">Socket</button></div>`).join('') || '<div class="sub">No gems to socket.</div>'}</div></div>` : ''}</div></div>`;
  return `<div class="panel"><div class="hd"><h3>Workshop · Forge ${fl}</h3><span class="tag br">up to ${matName(Math.min(6, Math.floor(fl / 3) + 1))}</span></div><div class="bd"><div class="sub">Four of one tier combine into one of the next tier up, for materials and gems alike, and the next tier needs Forge 3 × the tier below. Four of a kind craft gear of that exact tier, guaranteed. Mixing tiers is a gamble that lands on your lowest input most of the time.</div></div></div>
  <div class="panel"><div class="hd"><h3>Materials</h3><span class="tag">${u}/1024</span></div><div class="bd"><div class="bar"><i style="width:${Math.min(100, u / 1024 * 100)}%"></i><u style="left:50%"></u></div><div class="flex sp sub"><span>0</span><span>512</span><span>1024 = Legendary</span></div><div class="mt">${bars}</div></div></div>
  ${nmPanel()}
  <div class="panel"><div class="hd"><h3>Craft gear</h3><span class="tag ${selN === 4 ? 'br' : ''}">${selN}/4 materials</span></div><div class="bd"><div class="tabs2">${SLOTS.map(s => `<button class="${C.slot === s ? 'on' : ''}" data-a="crslot" data-s="${s}"><i class="tic">${gearSVG(s, 3)}</i>${s}</button>`).join('')}</div>
  <div class="flex wrap mb"><span class="lbl">Shard</span><button class="btn sm ${!C.shard ? 'on' : 'line'}" data-a="crshard" data-s="">None (Basic gear)</button>${gearSetIds().filter(s => S.shards[s] > 0 || C.shard === s).map(s => `<button class="btn sm ${C.shard === s ? 'on' : 'line'}" data-a="crshard" data-s="${s}">${SETS[s].n} ${S.shards[s] || 0}</button>`).join('') || '<span class="sub">No shards yet. Gather a monster tile.</span>'}</div>
  ${C.shard ? '' : `<div class="flex mb"><span class="lbl">Category</span><select data-a="crcat" style="flex:1">${BASIC_ORDER.map(id => { const b = basicOf(id, C.slot); return `<option value="${id}" ${C.cat === id ? 'selected' : ''}>Lv ${b.lv} · ${b.n || b.kind} (+${b.vals[0]}% to +${b.vals[5]}%)</option>`; }).join('')}</select></div><div class="sub mb">${recipeHave(C.shard ? setItemOf(C.shard, C.slot).recipe : basicOf(C.cat, C.slot).recipe)}</div>`}
  <div class="sub">${odds}</div><div class="sub">${C.shard ? SETS[C.shard].n + ': ' + SETS[C.shard].st.map(k => STAT_LAB[k]).join(', ') + ' +' + +setPiecePct(C.shard, 1).toFixed(1) + '% (Basic) to +' + +setPiecePct(C.shard, 6).toFixed(1) + '% (Legendary) per piece; wear from hero Lv ' + SETS[C.shard].lv : BASIC[C.cat].n + ': ' + BASIC[C.cat].st.map(k => STAT_LAB[k]).join(', ') + '; wear from hero Lv ' + BASIC[C.cat].lv}. Needs four materials of the quality you want.</div>
  <div class="flex mt"><button class="btn pri" data-a="craft" ${selN === 4 ? '' : 'disabled'}>Refine into gear</button><button class="btn line" data-a="crclear">Clear</button></div></div></div>
  <div class="panel"><div class="hd"><h3>Gems</h3><span class="tag">${gemTotal()} in stock</span></div><div class="bd"><div class="sub">Basic gems (25 kinds) drop anywhere and each boosts one thing. Set gems (4 per monster set) only come from the loot tiles monsters leave behind, and the fourth is a synergy gem. A piece holds one gem at a time. Same six tiers, same 4-to-1.</div><div class="mt">${gemRows}</div>
  <div class="sub mt">${gN === 4 ? (mixOk ? mixOdds(sorted) : 'Four of a kind: use Combine, it is free and guaranteed.') : 'Pick four gems with the steppers to gamble a mix (' + gN + '/4).'}</div>
  <div class="flex mt"><button class="btn pri" data-a="gemmix" ${mixOk ? '' : 'disabled'}>Gamble the mix</button><button class="btn line" data-a="gclear">Clear</button></div></div></div>${bench}`;
}

/* ---------- room 4: Smelter ---------- */
function roomSmelt() {
  if (!hasB('forge')) return noForge();
  const list = S.gear.pieces.filter(p => S.gear.worn[p.slot] !== p.id).sort((a, b) => a.grade - b.grade);
  return `<div class="panel"><div class="hd"><h3>Smelter · Dismantling Bay</h3><span class="tag">${list.length} spare</span></div><div class="bd"><div class="sub">Melt unwanted gear, including pieces a mixed craft let down, back into raw material. A smelted piece returns <b>one material of its own tier</b> (a quarter of the four it cost) and all its gems. Set shards are lost. Worn pieces must come off first.</div>
  <div class="list mt">${list.map(p => pieceRow(p, { extra: `<button class="btn sm bad" data-a="smelt" data-id="${p.id}">Smelt → 1 ${matName(p.grade)}</button>` })).join('') || '<div class="sub">Nothing to smelt.</div>'}</div></div></div>`;
}

/* ---------- room 5: Blueprint Archive ---------- */
const seen = id => !!(S.codex[id] || S.shards[id] > 0 || S.gear.pieces.some(p => p.set === id));
function roomArch() {
  const ids = gearSetIds(), found = ids.filter(seen).length;
  const row = id => { const sp = SETS[id], ok = seen(id), live = !sp.hgear && activeSets().includes(id), w = SET_ORDER.indexOf(id);
    const src = sp.hgear ? HOLIDAYS.filter(h => SETS['h_' + h.id].gear === id).map(h => h.mon + ' (' + h.n + ')').join(', ') : sp.mon + ', ' + CYCLE_NAMES[Math.floor(w / 3)];
    return `<div class="rwrow"><div class="grow"><b>${ok ? sp.n : '??? ' + (sp.hgear ? 'holiday set' : 'set')}</b> <span class="tag ${ok ? 'br' : ''}">${ok ? 'discovered' : 'unknown'}</span>${live ? ' <span class="tag br">on the map now</span>' : ''}<div class="sub">Source: ${src}. Gather the loot tile it leaves.</div>${ok ? `<div class="sub">${sp.st.map(k => STAT_LAB[k]).join(', ')} · Hero Lv ${sp.lv} · ${slotsOwned(id)}/5 pieces crafted</div><div class="sub">Core materials: ${sp.mats}</div>${SLOTS.filter(sl => setItemOf(id, sl).n).map(sl => { const si = setItemOf(id, sl); return `<div class="sub"><b>${si.n}</b> (${SLOT_NAME[sl]}, Hero Lv ${si.lv}): ${si.mats}</div>`; }).join('')}` : ''}</div></div>`; };
  return `<div class="panel"><div class="hd"><h3>Blueprint Archive</h3><span class="tag br">${found}/${ids.length}</span></div><div class="bd"><div class="sub">Every set blueprint (12 regular, 6 holiday) with where it drops and your completion. A blueprint is discovered the first time you hold one of its shards. Basic Gear (13 categories) is always known: see Gear Sets.</div></div></div>
  <div class="panel"><div class="hd"><h3>Where gems and materials come from</h3></div><div class="bd">
    ${[['Regular world tiles', 'Generic materials and Basic gems. Mostly Levels 1 to 3, sometimes 4. Level 5 and 6 tiles hide a once-a-week Purple jackpot, and Level 6 tiles a very rare 6-pack of Gold.'],
       ['Monster loot tiles', 'Left behind when a monster is killed, the same level as the monster. The only source of set shards and set gems, plus regular finds.'],
       ['Alliance store', 'Mystery chests for alliance points: reliable Level 1 and 2 materials and Basic gems.'],
       ['Alliance gifts', 'Shared mid-tier (Level 3 and 4) chests that drop when an ally buys a pack.'],
       ['Quests and dailies', 'Steady material pouches and bags of Basic gems.']].map(([a, b]) => `<div class="rr"><span><b>${a}</b><div class="sub">${b}</div></span></div>`).join('')}</div></div>
  <div class="panel"><div class="hd"><h3>Regular sets</h3></div><div class="bd">${SET_ORDER.map(row).join('')}</div></div>
  <div class="panel"><div class="hd"><h3>Holiday sets</h3></div><div class="bd">${HSET_ORDER.map(row).join('')}</div></div>`;
}

/* ---------- room 6: Enhancement Vault ---------- */
function roomVault() {
  if (!hasB('forge')) return noForge();
  const fl = lvlMax('forge'), list = S.gear.pieces.slice().sort((a, b) => b.grade - a.grade || (b.stars || 0) - (a.stars || 0));
  const row = p => { const n = p.stars || 0, d = dupes(p).length, need = n + 1, gate = 3 + n, c = starCost(n);
    const btn = n >= STAR_MAX ? '<span class="tag br">Mastered</span>' : `<button class="btn sm pri" data-a="starup" data-id="${p.id}" ${d >= need && fl >= gate && S.res.alloy >= c.alloy ? '' : 'disabled'}>★ ${n + 1}</button>`;
    return pieceRow(p, { extra: btn }).replace('</div></div><button', `</div><div class="sub">${n >= STAR_MAX ? 'Five stars, the top.' : `Star ${n + 1}: ${need} duplicate${need > 1 ? 's' : ''} (${d} spare) · ${fmtN(c.alloy)} alloy · Forge ${gate}`}</div></div><button`); };
  return `<div class="panel"><div class="hd"><h3>Enhancement Vault</h3><span class="tag">Forge ${fl}</span></div><div class="bd"><div class="sub">Master finished gear. Star N+1 consumes N+1 duplicates (same slot, set and tier, not worn) and alloy, and needs Forge 3 + N. Each star adds ${STAR_PCT * 100}% to the piece's own bonus, up to ${STAR_MAX} stars. Sockets and gems are kept (the duplicates' gems come back to your stock).</div><div class="list mt">${list.map(row).join('') || '<div class="sub">No gear yet.</div>'}</div></div></div>`;
}

function forgeHTML() {
  const tabs = `<div class="tabs2">${FORGE_ROOMS.map(([k, n]) => `<button class="${UI.fr === k ? 'on' : ''}" data-a="froom" data-k="${k}">${n}</button>`).join('')}</div>`;
  const body = { sets: roomSets, equip: roomEquip, bench: roomBench, smelt: roomSmelt, arch: roomArch, vault: roomVault }[UI.fr] || roomSets;
  return tabs + body();
}

/* ---------- Guild › Store ---------- */
function allianceStoreHTML() {
  const ap = S.ap || 0;
  return `<div class="panel"><div class="hd"><h3>Alliance Store</h3><span class="tag br">${ap} points</span></div><div class="bd"><div class="sub">Alliance points come from opening alliance chests and gifts. Spend them here on mystery chests of reliable Level 1 and Level 2 materials and Basic gems. set gems are never sold: they only drop from monster loot tiles.</div>
  <div class="rwrow"><div class="grow"><b>Mystery chest</b><div class="sub">${STORE_ROLLS} finds: each is a material or a core, Level 1 (${Math.round((1 - STORE_TIER2) * 100)}%) or Level 2 (${Math.round(STORE_TIER2 * 100)}%)</div></div><button class="btn sm pri" data-a="astore" ${ap >= STORE_COST ? '' : 'disabled'}>${STORE_COST} pts</button></div></div></div>`;
}

Object.assign(A, {
  froom(d) { UI.fr = d.k; D(); }, settab(d) { UI.setTab = d.k; D(); }, setopen(d) { UI.setOpen[d.id] = !UI.setOpen[d.id]; D(); }, eqf(d) { UI.eqf = d.k; D(); },
  forgego(d) { UI.cr.shard = d.id; UI.fr = 'bench'; D(); }, forgecat(d) { UI.cr.shard = ''; UI.cr.cat = d.id; UI.fr = 'bench'; D(); },
  gsel(d) { const s = UI.gsel, tot = sumCol(s), n = clamp((s[d.k] || 0) + +d.d, 0, S.gems[d.k] || 0); if (+d.d > 0 && tot >= 4) return toast('A mix spends exactly four gems.', 'warn'); s[d.k] = n; if (!n) delete s[d.k]; D(); },
  gclear() { UI.gsel = {}; D(); },
  gemcomb(d) { run(gemCombine(d.k), 'Combined into one gem of the next tier.'); },
  gemmix() { if (run(gemMix(UI.gsel))) UI.gsel = {}; },
  skpick(d) { UI.sk = +d.id; D(); }, sockgem(d) { run(socketGem(+d.id, d.k)); }, unsock(d) { run(unsocketGem(+d.id)); },
  smelt(d) { run(smelt(+d.id)); }, starup(d) { run(starUp(+d.id)); },
  astore() { run(storeChestBuy()); }
});
