'use strict';
/* IRON MARCH — world view (all kingdoms) and the coordinate search pop-up. Reads kingdoms.js; edits nothing else. */
(() => {
  const main = document.getElementById('main'), sel = { k: null };
  const wd = document.createElement('div'); wd.id = 'world'; wd.className = 'kdlg';
  wd.innerHTML = `<div class="kh"><b>World</b><small id="kwn"></small><button class="kx" data-a="wclose" aria-label="Close">✕</button></div><div class="ks"><input id="kwq" type="text" inputmode="numeric" pattern="[0-9]*" placeholder="Kingdom number" autocomplete="off"><button class="btn pri" data-a="wfind">Find</button></div><div class="kgrid" id="kwg"></div><div class="kdet" id="kwd"></div>`;
  const gb = document.createElement('div'); gb.id = 'kgo';
  gb.innerHTML = `<div class="h1" style="font:700 18px/1 var(--head);letter-spacing:.08em;text-transform:uppercase">Search coordinates</div><div class="r3"><div><label for="kgk">K</label><input id="kgk" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off"></div><div><label for="kgx">X</label><input id="kgx" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off"></div><div><label for="kgy">Y</label><input id="kgy" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off"></div></div><div class="sub" id="kge" style="min-height:16px;color:var(--signal)"></div><div class="flex mt wrap"><button class="btn pri grow" data-a="kgo">Go</button><button class="btn line" data-a="kworld">World map</button><button class="btn line" data-a="kgoclose">Cancel</button></div>`;
  main.append(wd, gb);
  const $i = id => document.getElementById(id), num = v => { v = String(v).trim(); return /^\d+$/.test(v) ? +v : NaN; };
  function card(r) {
    const me = r.k === kHome(), on = r.k === sel.k;
    return `<button class="kc${me ? ' me' : ''}${on ? ' sel' : ''}" data-a="wpick" data-k="${r.k}" id="kc${r.k}">${r.isNew ? '<span class="kb">NEW</span>' : ''}${me ? '<span class="kb me">YOU</span>' : ''}<span class="kn">K${r.k}</span><span class="kt">${r.name}</span><span class="ka">${r.ally.tag} · ${r.ally.name}</span><span class="kp ${r.level}">${r.level} pop</span><span class="kd">Opened ${kdDate(r.launched)}</span></button>`;
  }
  function detail() {
    const r = kdGet(sel.k), box = $i('kwd'); if (!r) { box.innerHTML = '<div class="sub">Tap a kingdom, or type a number above.</div>'; return; }
    const me = r.k === kHome(), err = me ? null : novTpErr();
    box.innerHTML = `<div class="flex wrap" style="justify-content:space-between"><b class="h" style="font-size:17px">K${r.k} ${r.name}</b><span class="kp ${r.level}" style="font:700 11px/16px var(--head);padding:0 6px;color:#101315;text-transform:uppercase">${r.level}</span></div><div class="sub">Ruling alliance ${r.ally.name} [${r.ally.tag}] · ${r.pop.toLocaleString('en-US')} commanders · opened ${kdDate(r.launched)}${r.isNew ? ' · newest' : ''}</div><div class="sub">${me ? 'This is your kingdom.' : err ? err : novTpLine()}</div><div class="flex wrap"><button class="btn line grow" data-a="wview" data-k="${r.k}">${me ? 'Go to my base' : 'View map'}</button>${me ? '' : `<button class="btn pri grow" data-a="wtp" data-k="${r.k}" ${err ? 'disabled' : ''}>Teleport here</button>`}</div>`;
  }
  function paint() {
    $i('kwn').textContent = `${KD_LIST().length} kingdoms · novice teleports ${noviceLeft()}/${KD_NOVICE}`;
    $i('kwg').innerHTML = KD_LIST().map(card).join(''); detail();
  }
  function pick(k, scroll) {
    sel.k = k; const g = $i('kwg'); g.querySelectorAll('.sel').forEach(e => e.classList.remove('sel'));
    const c = $i('kc' + k); if (c) { c.classList.add('sel'); if (scroll) c.scrollIntoView({ block: 'center', behavior: 'smooth' }); } detail();
  }
  const openWorld = () => { gb.classList.remove('on'); closeRadial(); UI.sheet = null; UI.drawer = null; sel.k = viewK(); paint(); wd.classList.add('on'); pick(sel.k, false); const c = $i('kc' + sel.k); if (c) c.scrollIntoView({ block: 'center' }); D(); };
  const closeWorld = () => wd.classList.remove('on');
  function goHome() { MAP.kv = null; closeRadial(); UI.sel = null; panTo(S.base.x, S.base.y); D(); }
  Object.assign(A, {
    mworld() { openWorld(); },
    wclose() { closeWorld(); },
    wpick(d) { pick(+d.k, false); },
    wfind() { const k = num($i('kwq').value), r = kdGet(k); if (!r) { toast(isNaN(k) ? 'Type a kingdom number.' : 'Kingdom ' + k + ' does not exist yet.', 'warn'); return; } pick(k, true); },
    wview(d) { const k = +d.k; closeWorld(); closeRadial(); UI.sel = null; if (k === kHome()) { goHome(); return; } MAP.kv = k; MAP.vx = MAP.vy = 0; panTo(TX, TY + 40); D(); toast('Scouting kingdom ' + k + '. Tap open ground to teleport.'); },
    wtp(d) {
      const k = +d.k, e = novTpErr(); if (e) { toast(e, 'warn'); return; }
      MAP.kv = k; let x, y, ok = false; for (let i = 0; i < 2000 && !ok; i++) { x = rint(20, W - 20); y = rint(20, H - 20); ok = legalSpot(x, y) && terrainAt(x, y) === 'wild'; }
      if (!ok) { MAP.kv = null; toast('No landing found.', 'warn'); return; }
      if (run(doTeleport(x, y))) { closeWorld(); closeRadial(); UI.sel = null; panTo(S.base.x, S.base.y); } else MAP.kv = null;
    },
    mhome() { goHome(); },
    mgo() { $i('kgk').value = viewK(); $i('kgx').value = Math.round(MAP.cx); $i('kgy').value = Math.round(MAP.cy); $i('kge').textContent = ''; closeWorld(); gb.classList.add('on'); },
    kgoclose() { gb.classList.remove('on'); },
    kworld() { openWorld(); },
    kgo() {
      const k = num($i('kgk').value), x = num($i('kgx').value), y = num($i('kgy').value), er = t => { $i('kge').textContent = t; };
      if (!kdGet(k)) return er(isNaN(k) ? 'Type a kingdom number.' : 'Kingdom ' + k + ' does not exist yet.');
      if (isNaN(x) || isNaN(y)) return er('Type both X and Y.');
      if (x >= W || y >= H) return er('X runs 0 to ' + (W - 1) + ' and Y runs 0 to ' + (H - 1) + '.');
      gb.classList.remove('on'); closeRadial(); UI.sel = null; MAP.kv = k === kHome() ? null : k; panTo(x, y); D();
    }
  });
})();
