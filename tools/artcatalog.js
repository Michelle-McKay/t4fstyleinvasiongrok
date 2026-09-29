#!/usr/bin/env node
'use strict';
/* IRON MARCH — painted-art catalog.
   Single source of truth for every image the game can load: file key, size, transparency and the copy-paste AI prompt.
   Names and descriptions are read from the game data files, so the list follows the game.

   node tools/artcatalog.js            writes assets/catalog.json (sizes and flags, no prompts)
   require('./artcatalog').build()     returns { style, groups, items } for other tools (checklist page, ingest) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');

/* ---------- read game data ---------- */
function loadData() {
  const src = fs.readFileSync(path.join(root, 'js/data.js'), 'utf8').replace(/^'use strict';/, '');
  const ctx = vm.createContext({});
  return vm.runInContext(src + '\n;({CLSD,WCLSD,BLD,CC_LEVELS,HEROES})', ctx);
}
function loadPacks() {
  const s = fs.readFileSync(path.join(root, 'js/packs.js'), 'utf8'), out = [];
  const re = /tier: (\d), n: (?:'([^']*)'|"([^"]*)"),.*?art: '(\w+)', blurb: '([^']*)'/g; let m;
  for (const line of s.split('\n')) { re.lastIndex = 0; if ((m = re.exec(line))) out.push({ tier: +m[1], n: m[2] || m[3], art: m[4], blurb: m[5] }); }
  return out;
}

/* ---------- shared style ---------- */
const STYLE =
  'Painted digital illustration for a mobile military strategy game. Realistic and richly detailed, hand-painted textures, believable weathered materials, ' +
  'cinematic but soft lighting. Post-apocalyptic desert wasteland setting: sun-bleached sand and dust, tan and olive-drab concrete, worn steel, rust, ' +
  'brass fittings, and small glacier-blue lights and screens as the only cool accent. Warm sunlight from the upper left, soft shadow falling to the lower right. ' +
  'Polished high-end mobile game quality with a crisp silhouette that reads at small size. Original design, not a copy of any existing game or franchise. ' +
  'No text, letters, numbers, logos, real flags, watermark, signature or border.';
const CAM = 'Three-quarter overhead camera looking down about 40 degrees, front-left corner facing the viewer, the same camera and scale as every other asset in this set.';
const BG_T = 'Isolated on a transparent background. If your tool cannot make transparency, use one flat solid magenta (#FF00FF) background with no gradient, no floor and no shadow on it; only a small soft contact shadow directly under the subject.';
const BG_O = 'Fill the whole frame, no transparent areas.';

/* ---------- content ---------- */
const TIERS = {
  1: 'Upgrade tier 1 of 5, "makeshift": scrap-metal sheds, patched tarps, sandbags, oil drums, rust and dust, hand-built and improvised.',
  2: 'Upgrade tier 2 of 5, "concrete": tidy poured-concrete blocks, corrugated steel roofs, painted markings, sturdy and utilitarian.',
  3: 'Upgrade tier 3 of 5, "reinforced": steel-plated reinforced concrete, armoured panels, brass trim, floodlights, clearly professional.',
  4: 'Upgrade tier 4 of 5, "advanced": modern military architecture, lit glass, solar panels, antennas, glowing glacier-blue screens and light strips.',
  5: 'Upgrade tier 5 of 5, "fortified": a massive high-tech fortress version, heavy armour, brass banners and trim, glowing glacier-blue energy accents, the grandest look of all.'
};
const BLD_SUBJECT = {
  mil: 'A Military Complex: barracks blocks around a drill yard with a vehicle bay and a watch post',
  depot: 'A Depot: a field hospital and medical supply depot with ambulance bay and tents. No red cross; use a teal plus sign',
  treasury: 'A Treasury: a hardened strongroom building with a vault door, armoured cash crates and a guard booth',
  tech: 'A Tech Institute: a research laboratory building with antenna arrays, a satellite dish and lit lab windows',
  hall: 'A Hall of War: a large command hall with tall windows, flag poles with plain unmarked banners and a briefing terrace',
  prison: 'A Prison: a detention compound with a cell block, fenced yard, razor wire and guard towers',
  radar: 'A Radar Station: a control building topped by a large rotating radar dish, with antenna masts',
  store: 'A StoreHouse: a big warehouse with stacked shipping containers, pallets, a loading dock and a forklift',
  defense: 'A Defense Center: a fortified bunker with gun turrets, thick walls, sandbags and anti-tank obstacles',
  market: 'A Black Market: an improvised bazaar of tarp stalls and awnings with hanging lanterns, crates and shady traders',
  rations: 'A Rations farm: rows of crops, irrigation channels, a grain silo, a barn and a greenhouse',
  fuel: 'A Fuel refinery: a pumpjack, round storage tanks, pipework and a small distillation tower',
  power: 'A Power Cells plant: a solar panel array, wind turbines, battery containers and a generator shed',
  alloy: 'An Alloy foundry: a smelter with glowing molten metal, a smokestack, ingot piles and an overhead crane'
};
const BACKDROP = {
  cc: 'a vast military headquarters plain under a huge desert sky, radio masts far away',
  mil: 'a desert training ground with dust trails, distant vehicle silhouettes and heat haze',
  depot: 'a quiet desert convoy stop with tents, distant ambulance vehicles and clear sky',
  treasury: 'a stark salt flat with distant armoured guard posts and a hard blue sky',
  tech: 'a high desert plateau with antenna towers and a faint aurora-blue glow on the horizon',
  hall: 'a windswept parade ground with rows of unmarked banners and distant barracks',
  prison: 'a barren gravel plain with far-off watchtowers and razor-wire fences',
  radar: 'a desert ridge line at dusk with radio towers and a dish array on the horizon',
  store: 'a dry logistics yard with container stacks and trucks far in the distance',
  defense: 'a rocky desert front line with distant concrete barriers and smoke on the horizon',
  market: 'a dusty desert crossroads at golden hour with distant tents and lanterns',
  rations: 'green-gold farmland fading into desert with irrigation lines and a windmill far away',
  fuel: 'an oil field with distant pumpjacks and a smoky orange haze',
  power: 'a sunny desert with far rows of solar panels and wind turbines on the horizon',
  alloy: 'a rust-red industrial wasteland with distant chimneys and a glowing furnace haze'
};
const TROOP_SUBJECT = {
  inf: [
    'a squad of three riot troopers in heavy riot armour with clear shields, batons and dented helmets, improvised gear',
    'a squad of three modern combat infantry in desert camouflage with assault rifles, plate carriers and helmets',
    'a squad of three soldiers in powered exoskeleton suits with servo joints, visors and heavy rifles',
    'a squad of three elite vanguard soldiers in sleek heavy exo-armour with brass trim, glowing glacier-blue visors and plasma rifles'
  ],
  arm: [
    'a light armoured scout car with a roof-mounted machine gun, oversized off-road wheels and jerry cans',
    'a battle tank with a long cannon, angled steel armour and desert-worn paint',
    'a heavy assault mech: a two-legged armoured walker with twin arm cannons and a cockpit slit',
    'a juggernaut: a colossal multi-turret tracked super-tank with layered armour plates, brass trim and glowing glacier-blue vents'
  ],
  air: [
    'a small recon drone, a compact quad-rotor with a camera pod, hovering slightly above its shadow',
    'an attack helicopter with stub wings, rocket pods and a chin cannon, hovering slightly above its shadow',
    'a heavy gunship: a twin-rotor VTOL transport-gunship with side guns and armoured belly, hovering slightly above its shadow',
    'a stealth bomber: a black angular flying wing with glowing glacier-blue engine slits, slightly above its shadow'
  ],
  siege: [
    'a crude siege engine: a truck-mounted rocket rack and a counterweight arm made from scrap',
    'a plasma mortar: a squat armoured mortar carriage with a glowing glacier-blue coil barrel',
    'a breach artillery piece: a long-barrelled heavy howitzer on a reinforced tracked carriage',
    'a demolition walker: a huge four-legged walker carrying a giant wrecking arm and a siege cannon, brass trim'
  ]
};
const WALL_SUBJECT = {
  sent: [
    'an automated point-gun: a small armoured auto-turret on a sandbagged mount',
    'a hardened bunker with two guards visible behind firing slits and a mounted machine gun',
    'a laser-grid interceptor: pylons projecting glowing glacier-blue laser lattices',
    'a perimeter plasma emplacement: a heavy armoured cannon pod with a glowing glacier-blue plasma core, brass trim'
  ],
  bast: [
    'a field of anti-tank spike traps: steel hedgehogs and spiked barriers on dirt',
    'a railgun turret: a long twin-rail cannon on a concrete emplacement',
    'a siege-breaker battery: several heavy howitzer barrels behind armoured shields',
    'a quantum shield emplacement: a bunker with a glowing glacier-blue energy dome and shield emitters'
  ],
  sky: [
    'a flak cannon: a quad-barrel anti-aircraft gun on a sandbag ring',
    'a SAM nest: surface-to-air missile launchers under camouflage netting',
    'an EMP defense grid: tall antenna pylons with crackling glacier-blue arcs',
    'an orbital laser node: a tall tower with a glowing glacier-blue beam pointing to the sky, brass trim'
  ],
  garr: [
    'a squad of base watchmen in helmets with rifles on a sandbag post',
    'a reinforced trench guard: soldiers in a fortified trench with a sheltered machine gun nest',
    'an elite perimeter division: armoured soldiers with shields and a checkpoint barrier',
    'automated command sentinels: tall armoured guard robots standing in a line, glacier-blue eyes, brass trim'
  ]
};
const HERO_SUBJECT = {
  ada: ['Ada Voss, the Quartermaster: a confident woman in her thirties with goggles pushed up on a khaki cap, dark hair tied back, an olive field jacket with a brass zip, a practical supply-officer look', '#8ea36a', '#2b3520'],
  ivo: ['Ivo Hale, the Surgeon: a calm older man with grey hair and a trimmed grey beard, round glasses, a headlamp on his forehead, a surgical mask pulled down at the neck and a white coat with a teal plus sign patch', '#5ec4d4', '#16333a'],
  ren: ['Ren Kade, the Marshal: a hard-eyed commander with a scar on his cheek, a peaked officer cap, a high-collared dark greatcoat with brass epaulettes', '#e0a44a', '#3a2a12']
};
const MONSTERS = [
  ['mon_1', 'Ash Hound', 'a small hostile wasteland creature, an ash-grey hound-like beast with cracked bone plates, ember-orange eyes, lean and fast, crouched to attack'],
  ['mon_3', 'Rust Brute', 'a mid-sized hostile wasteland creature, a hulking brute with rust-coloured armoured hide, bone spurs, thick arms and glowing orange eyes'],
  ['mon_5', 'Ember Colossus', 'a huge boss-class wasteland creature, a towering armoured colossus with a burning ember-lit core visible through cracks, a horned crown-like skull and glowing orange eyes']
];
const NODES = {
  food: ['Food field', 'a resource field of crops: fenced green-gold wheat rows and a harvest cart', ['a small patch of sparse crops', 'a modest field of crops', 'a healthy field with a cart', 'a large rich field with silos and a tractor', 'a huge lush farmstead with silos, tractors and a windmill']],
  oil: ['Oil field', 'an oil resource site: black crude pools and derricks', ['a single leaking oil seep with a few barrels', 'a small pumpjack and barrels', 'two pumpjacks with a storage tank', 'a busy derrick cluster with tanks and pipes', 'a huge oil complex with towering derricks, tanks and a flare stack']],
  energy: ['Energy vein', 'an energy resource site: glowing glacier-blue energy crystals breaking out of the ground', ['a few small glowing crystals', 'a small crystal cluster', 'a larger crystal outcrop with a cable rig', 'a big crystal formation with a harvester rig', 'a huge glowing crystal spire field with a harvester and generators']],
  steel: ['Steel vein', 'a steel ore resource site: grey-blue metal ore veins and a scrap pile', ['a small pile of ore and scrap', 'an ore outcrop with a mining cart', 'a mining pit with a drill rig', 'a big open-cast mine with machines and ore stacks', 'a huge mine complex with cranes, conveyors and molten metal glow']]
};
const ICONS = {
  map: 'a folded desert battle map with a brass pin', base: 'a small fortified base building', train: 'crossed rifles with a chevron', lab: 'a glass flask with a glowing glacier-blue liquid',
  med: 'a first-aid case with a teal plus sign (no red cross)', march: 'a marching column flag on a pole', vault: 'a heavy steel vault door with a brass wheel', hero: 'a commander helmet with a brass badge',
  alliance: 'two clasped hands over a steel shield', more: 'three brass dots in a steel plate', mail: 'a sealed military envelope with a wax stamp',
  rations: 'a sheaf of golden wheat', fuel: 'an orange fuel drum with a flame', power: 'a glacier-blue battery cell with a lightning bolt', alloy: 'a stack of steel ingots',
  cash: 'a bundle of banknotes with a brass band', dia: 'a brilliant glacier-blue cut diamond', gift: 'a wrapped brass-ribboned supply gift box', events: 'a brass calendar star badge',
  crate: 'a wooden supply crate with a parachute', handshake: 'two hands shaking, a partnership symbol'
};
const GEM_COUNT = ['a few loose', 'a small pile of', 'a handful heap of', 'a big heap of', 'a large mound of', 'an overflowing treasure hoard of'];

/* ---------- build ---------- */
function build() {
  const D = loadData(), P = loadPacks(), items = [], groups = [];
  const add = (group, o) => { items.push(Object.assign({ group }, o)); };
  const make = (subject, bg, extra) => [subject.replace(/\.?$/, '.'), extra, bg].filter(Boolean).join(' ') + ' ' + STYLE;

  const G = (id, title, note) => groups.push({ id, title, note });

  /* buildings */
  G('bld', 'Buildings (70)', 'Square, transparent, one building on a small ground pad, filling about 85 percent of the frame. Do all five tiers of one building together, and give the tool the tier 1 image as a reference for the rest.');
  for (const k of Object.keys(D.BLD)) {
    if (k === 'cc') continue;
    for (let t = 1; t <= 5; t++) add('bld', {
      key: `bld_${k}_t${t}`, name: `${D.BLD[k].n} tier ${t}`, size: '1:1, 1024 x 1024', transparent: true, out: 512,
      prompt: make(`${BLD_SUBJECT[k]}. A single building complex on a small square ground pad, centred, filling about 85 percent of the frame`, BG_T, TIERS[t] + ' ' + CAM)
    });
  }
  /* command center */
  G('cc', 'Command Center (25)', 'Your headquarters at every level, growing from a field tent to the Iron Citadel. Do them in order and attach the previous level as a reference so each one clearly grows from the last.');
  D.CC_LEVELS.forEach(([n, d], i) => {
    const L = i + 1, tier = L <= 4 ? 1 : L <= 9 ? 2 : L <= 14 ? 3 : L <= 19 ? 4 : 5;
    const clean = x => x.replace(/ ?An? \w+ march queue opens\.?/g, '').replace(/^\s+|\s+$/g, ''), prev = D.CC_LEVELS.slice(Math.max(0, i - 3), i).map(x => clean(x[1])).join(' ');
    add('cc', {
      key: `bld_cc_L${String(L).padStart(2, '0')}`, name: `Command Center L${L}: ${n}`, size: '1:1, 1024 x 1024', transparent: true, out: 512,
      prompt: make(`The player's Command Center headquarters at upgrade level ${L} of 25, called "${n}": ${clean(d)} ${L > 1 ? 'It keeps and grows what earlier levels added (' + prev + ').' : 'It is the very first, humblest stage.'} A single base on a small square ground pad, centred, filling about 85 percent of the frame`, BG_T, TIERS[tier] + ' ' + CAM)
    });
  });
  /* backdrops */
  G('head', 'Building sheet backdrops (15)', 'The wide scenery behind a building on its info sheet. NO building in it: leave an empty flat patch of ground in the lower centre where the game places the building.');
  for (const k of Object.keys(D.BLD)) add('head', {
    key: `head_${k}`, name: `${D.BLD[k].n} backdrop`, size: '2:1 wide, 1600 x 800', transparent: false, out: 1000,
    prompt: `A wide scenic backdrop: ${BACKDROP[k]}. Empty flat ground in the lower centre for a building to be placed on, nothing important in the centre, sky in the upper half. Eye-level slightly raised camera, soft depth haze. ${BG_O} ${STYLE}`
  });
  /* troops */
  G('troop', 'Troops (16)', 'One unit type per image, transparent, same camera. Show a squad for infantry and a single vehicle for the rest. Do tier 1 to 4 of a class together.');
  for (const c of Object.keys(D.CLSD)) D.CLSD[c].names.forEach((nm, i) => add('troop', {
    key: `troop_${c}_t${i + 1}`, name: `${nm} (${D.CLSD[c].n} tier ${i + 1})`, size: '1:1, 1024 x 1024', transparent: true, out: 384,
    prompt: make(`${TROOP_SUBJECT[c][i]}. Military unit "${nm}", tier ${i + 1} of 4 (higher tiers look more advanced and imposing)`, BG_T, CAM)
  }));
  /* wall crews */
  G('wall', 'Wall defenses (16)', 'Defensive emplacements that guard your base wall. Transparent, same camera.');
  for (const c of Object.keys(D.WCLSD)) D.WCLSD[c].names.forEach((nm, i) => add('wall', {
    key: `wall_${c}_t${i + 1}`, name: `${nm} (${D.WCLSD[c].n} tier ${i + 1})`, size: '1:1, 1024 x 1024', transparent: true, out: 384,
    prompt: make(`${WALL_SUBJECT[c][i]}. Base defense "${nm}", tier ${i + 1} of 4 (higher tiers look more advanced)`, BG_T, CAM)
  }));
  /* heroes */
  G('hero', 'Heroes (3)', 'Painted bust portraits. These fill the frame with their own dark backdrop, no transparency.');
  for (const id of Object.keys(D.HEROES)) {
    const [d, c1, c2] = HERO_SUBJECT[id];
    add('hero', {
      key: `hero_${id}`, name: `${D.HEROES[id].n}, ${D.HEROES[id].role}`, size: '1:1, 1024 x 1024', transparent: false, out: 512,
      prompt: `Head and shoulders character portrait of ${d}. Semi-realistic painted portrait, three-quarter view, confident expression, detailed skin, fabric and metal, lit from the upper left. Dark vignette background with a soft glow of ${c1} fading into ${c2}. ${BG_O} ${STYLE}`
    });
  }
  /* map features */
  G('map', 'Map features (26)', 'Sprites for the world map, transparent. Shown small, so bold shapes and strong colour.');
  for (const [key, n, d] of MONSTERS) add('map', { key, name: n, size: '1:1, 1024 x 1024', transparent: true, out: 384, prompt: make(`${d.replace(/^./, c => c.toUpperCase())}. Original monster design`, BG_T, CAM) });
  add('map', { key: 'camp', name: 'Raider camp', size: '1:1, 1024 x 1024', transparent: true, out: 384, prompt: make('A hostile raider camp: ragged dark tents, a campfire, barbed fencing, scrap barricades, and a tattered red pennant on a pole', BG_T, CAM) });
  add('map', { key: 'outpost', name: 'Rival commander base', size: '1:1, 1024 x 1024', transparent: true, out: 384, prompt: make('A rival commander base: a small fortified compound with a bunker, watch mast and walls, and a plain unmarked white flag on a pole (the game colours the flag)', BG_T, CAM) });
  add('map', { key: 'citadel', name: 'Central citadel', size: '1:1, 1024 x 1024', transparent: true, out: 512, prompt: make('The Iron Citadel, a giant hexagonal fortress on a brass-edged plinth at the centre of the world, tall corner towers, a central spire with a bright warm beacon at the top', BG_T, CAM) });
  for (const nk of Object.keys(NODES)) {
    const [n, d, tiers] = NODES[nk];
    tiers.forEach((tx, i) => add('map', { key: `node_${nk}_${i + 1}`, name: `${n} tier ${i + 1}`, size: '1:1, 1024 x 1024', transparent: true, out: 256, prompt: make(`${d.replace(/^./, c => c.toUpperCase())}. Richness level ${i + 1} of 5: ${tx}`, BG_T, CAM) }));
  }
  /* terrain */
  G('tile', 'Ground tiles (6)', 'Flat, straight top-down textures with NO perspective and NO objects. The game bends them onto the map, so edges must tile seamlessly.');
  const tileStyle = 'Flat top-down view, no perspective, no shadows from tall objects, even lighting, seamless tileable texture where the left edge matches the right and the top matches the bottom. ' + BG_O + ' ' + STYLE;
  for (let v = 1; v <= 3; v++) add('tile', { key: `tile_wild_${v}`, name: `Wasteland ground ${v}`, size: '1:1, 1024 x 1024', transparent: false, out: 256, prompt: `Ground texture: cracked dry desert wasteland dirt with gravel, dust, a few pebbles and faint tyre tracks, ${['mostly sand-tan', 'greyer with darker cracks', 'reddish clay with scattered stones'][v - 1]}. ${tileStyle}` });
  for (let v = 1; v <= 2; v++) add('tile', { key: `tile_forest_${v}`, name: `Forest canopy ${v}`, size: '1:1, 1024 x 1024', transparent: false, out: 256, prompt: `Forest texture seen straight from above: dense dark-green conifer and scrub canopy with deep shadows between crowns, ${['tight and dark', 'slightly broken with brown ground showing'][v - 1]}. ${tileStyle}` });
  add('tile', { key: 'tile_plaza_1', name: 'Citadel plaza', size: '1:1, 1024 x 1024', transparent: false, out: 256, prompt: `Ground texture: worn grey concrete plaza paving with thin brass inlay lines in a cross pattern and chipped edges. ${tileStyle}` });
  /* packs */
  G('pack', 'Pack banners (16)', 'The big picture at the top of each store pack. A loot still-life on a dark background with a glow. Rarity colours: 1 olive green, 2 teal, 3 indigo, 4 magenta, 5 gold.');
  const rare = { 1: 'olive green', 2: 'teal', 3: 'indigo', 4: 'magenta', 5: 'warm gold' };
  for (const p of P) add('pack', {
    key: `pack_${p.art}`, name: p.n, size: '4:3, 1600 x 1200', transparent: false, out: 800,
    prompt: `Store pack banner artwork for "${p.n}": ${p.blurb.replace(/\.$/, '')}. A dramatic still life of the contents piled together in the centre (crates, supplies, gear and glowing items that match the description), richer and more lavish for higher rarity (rarity ${p.tier} of 5, ${rare[p.tier]} light rays and glow behind it), on a dark steel background. The pile fills the middle 70 percent. ${BG_O} ${STYLE}`
  });
  G('gem', 'Diamond pile icons (6)', 'Six sizes of diamond pile for the diamond packs, transparent.');
  GEM_COUNT.forEach((w, i) => add('gem', { key: `gem_${i + 1}`, name: `Diamond pile ${i + 1}`, size: '4:3, 1200 x 900', transparent: true, out: 400, prompt: make(`${w[0].toUpperCase() + w.slice(1)} brilliant glacier-blue cut diamonds ${i < 2 ? 'scattered' : 'piled'} on a small steel plate. Size ${i + 1} of 6, the biggest is a huge glittering hoard`, BG_T, CAM) }));
  /* icons */
  G('icon', 'HUD icons (21)', 'Small painted icons, front view, transparent. They replace the flat HUD icons wherever the game shows them, so check the HUD looks right after adding them.');
  for (const k of Object.keys(ICONS)) add('icon', {
    key: `icon_${k}`, name: `Icon: ${k}`, size: '1:1, 1024 x 1024', transparent: true, out: 128,
    prompt: `A single glossy painted game icon of ${ICONS[k]}. Front view, bold simple shape that reads at 32 pixels, thick soft dark outline, rich highlights, slight top-left light, centred with a small margin. ${BG_T} ${STYLE}`
  });
  return { style: { style: STYLE, camera: CAM, transparent: BG_T, opaque: BG_O }, groups, items };
}

function write() {
  const c = build();
  fs.writeFileSync(path.join(root, 'assets/catalog.json'), JSON.stringify({ v: 1, count: c.items.length, groups: c.groups, items: c.items.map(({ prompt, ...r }) => r) }, null, 1) + '\n');
  console.log(c.items.length + ' assets in ' + c.groups.length + ' groups');
}
module.exports = { build };
if (require.main === module) write();
