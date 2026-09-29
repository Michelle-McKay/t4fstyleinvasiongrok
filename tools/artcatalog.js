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

/* ---------- shared style (v2: bright, clean industrial) ---------- */
const STYLE_HEAD = 'Style: clean, polished, stylized-realistic game-asset render for a modern mobile base-building strategy game, like a high-end 3D render with crisp edges and smooth shading. ';
const STYLE_TAIL =
  'Bright daylight, high-key lighting, soft ambient light with a gentle shadow falling to the lower right. Saturated, readable colours with strong contrast and a crisp silhouette that still reads at small size. ' +
  'Everything is tidy and well kept: clean surfaces, neat surroundings. No rust, no grime, no dirt streaks, no scrap, no debris, no clutter, not dark, not gritty, not post-apocalyptic. ' +
  'Original design, not a copy of any existing game or franchise. No text, letters, numbers, logos, real flags, watermark, signature or border.';
/* buildings and backdrops */
const STYLE = STYLE_HEAD + 'Bright, clean, modern industrial-military look: modular buildings with smooth painted metal panels in off-white, light grey and warm sand, tidy poured-concrete, safety-orange and brass accents, and softly glowing blue windows and light strips. ' + STYLE_TAIL;
/* units, heroes, creatures, icons, packs */
const STYLE_GEN = STYLE_HEAD + 'Bright, clean, modern industrial-military palette: off-white, light grey and warm sand with safety-orange and brass accents and softly glowing blue lights. ' + STYLE_TAIL;
const CAM = 'Camera: three-quarter overhead, looking down about 40 degrees, front-left corner facing the viewer, the same camera, scale and lighting as every other asset in this set.';
const BG_T = 'Background: one flat solid magenta (#FF00FF) colour filling the whole frame, no gradient, no floor, no shadow on it. Do NOT draw a grey checkerboard pattern (that is a fake transparency grid and cannot be removed).';
const BG_O = 'Fill the whole frame, no transparent areas.';
const PAD = 'Place the building complex on one clean, flat, square light-concrete pad with a thin edge (the same pad size in every image of this set), centred, filling about 85 percent of the frame. Nothing may extend past the pad. No vehicles, people, banners, flag poles or separate structures unless named.';

/* ---------- content ---------- */
const TIERS = {
  1: 'Upgrade tier 1 of 5, "starter": a small, compact, tidy prefab site. Simple flat-roofed modular blocks in off-white and light grey panels, a few clean details, one accent colour. The plainest of the five.',
  2: 'Upgrade tier 2 of 5, "expanded": the same site, larger, with more modules, neat concrete and painted-metal panels, safety-orange trim and simple rooftop equipment.',
  3: 'Upgrade tier 3 of 5, "reinforced": larger again, multi-part, brass trim, solar panels, floodlights and rooftop equipment, clearly a well-funded facility.',
  4: 'Upgrade tier 4 of 5, "advanced": high-tech, with tall glass sections, solar arrays, antennas and glowing blue light strips along the roofs and doors.',
  5: 'Upgrade tier 5 of 5, "flagship": the grandest version, the same site at its largest, gleaming white and light steel with brass accents, glowing blue energy accents, impressive but still tidy.'
};
const BLD_SUBJECT = {
  cc: "The player's Command Center headquarters: a central operations building with a wide entrance, a radio mast and a flag, set inside a tidy compound",
  mil: 'A Military Complex: neat barracks blocks around a paved drill yard, a vehicle bay and a small watch tower',
  depot: 'A Depot: a clean field hospital and medical supply building with a wide entrance canopy and a teal plus sign (no red cross)',
  treasury: 'A Treasury: a solid strongroom building with a big round vault door and a covered loading bay with sealed crates',
  tech: 'A Tech Institute: a modern research lab building with glass sections, a satellite dish and rooftop antennas',
  hall: 'A Hall of War: a large command hall with tall windows and a wide entrance stairway, and a briefing terrace',
  prison: 'A Prison: a secure detention block with a fenced yard, guard towers and a clean gatehouse',
  radar: 'A Radar Station: a control building topped with a large radar dish, plus a slim antenna mast',
  store: 'A StoreHouse: a large warehouse with a loading dock and neatly stacked shipping containers',
  defense: 'A Defense Center: a low reinforced command bunker with gun turrets on its roof corners and clean concrete barriers',
  market: 'A Black Market: a tidy trading hall with a striped awning, a row of covered stalls and hanging lanterns',
  rations: 'A Rations farm: neat green crop rows, irrigation lines, a grain silo, a barn and a greenhouse',
  fuel: 'A Fuel refinery: a pumpjack, round storage tanks, tidy pipework and a small distillation tower',
  power: 'A Power Cells plant: a solar panel array, small wind turbines, battery containers and a generator hall',
  alloy: 'An Alloy foundry: a modern smelter hall with a chimney stack, glowing metal chute, ingot stacks and an overhead crane'
};
const BACKDROP = {
  cc: 'a clean, bright headquarters plain with tidy roads and radio masts far away',
  mil: 'a bright training ground with painted lines, tidy barracks blocks and clear distance',
  depot: 'a calm, clean medical campus with pale tents and clear sky',
  treasury: 'a bright paved compound with neat guard posts and a clear blue sky',
  tech: 'a bright high plateau with clean antenna towers and soft blue sky',
  hall: 'a spotless parade ground with tidy barracks and a broad blue sky',
  prison: 'a bright gravel plain with tidy fencing and watchtowers in the distance',
  radar: 'a bright ridge line with clean radio towers and a dish array, blue sky',
  store: 'a clean logistics yard with neat container stacks and trucks far away',
  defense: 'a bright open front with clean concrete barriers and a clear sky',
  market: 'a sunny crossroads with clean awnings and lanterns, warm light',
  rations: 'green farmland fading into clean golden fields, a windmill far away, blue sky',
  fuel: 'a bright industrial plain with tidy tanks and distant pumpjacks, clear sky',
  power: 'a sunny plain with far rows of solar panels and wind turbines, clear sky',
  alloy: 'a bright industrial park with clean chimneys and a warm horizon glow'
};
const TROOP_SUBJECT = {
  inf: [
    'a squad of three riot troopers in clean grey-and-sand riot armour with clear shields and helmets',
    'a squad of three modern combat infantry in clean sand-coloured uniforms with plate carriers, helmets and rifles',
    'a squad of three soldiers in sleek white-and-grey powered exoskeleton suits with visors and rifles',
    'a squad of three elite vanguard soldiers in polished white exo-armour with brass trim and glowing blue visors'
  ],
  arm: [
    'a light armoured scout car with a roof-mounted gun and large wheels, clean sand-and-white paint',
    'a battle tank with a long cannon and angled armour, clean sand-and-grey paint',
    'a heavy assault mech: a two-legged armoured walker with twin arm cannons, clean white and grey panels',
    'a juggernaut: a giant multi-turret tracked super-tank with layered white armour, brass trim and glowing blue vents'
  ],
  air: [
    'a small recon drone, a compact quad-rotor with a camera pod, hovering slightly above its shadow',
    'an attack helicopter with stub wings and rocket pods, clean sand-and-white paint, hovering slightly above its shadow',
    'a heavy gunship: a twin-rotor VTOL with side guns, white and grey, hovering slightly above its shadow',
    'a stealth bomber: a sleek angular flying wing in pale grey with glowing blue engine slits, slightly above its shadow'
  ],
  siege: [
    'a simple siege launcher: a truck-mounted rocket rack with a tidy frame, clean sand-and-white paint',
    'a plasma mortar: a compact armoured carriage with a glowing blue coil barrel',
    'a breach artillery piece: a long-barrelled howitzer on a reinforced tracked carriage, clean grey and white',
    'a demolition walker: a large four-legged walker carrying a wrecking arm and a siege cannon, white with brass trim'
  ]
};
const WALL_SUBJECT = {
  sent: [
    'an automated point-gun: a small clean auto-turret on a low concrete mount',
    'a hardened bunker with firing slits and a mounted gun, clean concrete and light grey panels',
    'a laser-grid interceptor: two pylons projecting glowing blue laser lattices',
    'a perimeter plasma emplacement: a heavy white armoured cannon pod with a glowing blue core and brass trim'
  ],
  bast: [
    'a row of anti-tank barriers: clean steel hedgehogs and spiked blocks on a light pad',
    'a railgun turret: a long twin-rail cannon on a clean concrete emplacement',
    'a siege-breaker battery: several heavy gun barrels behind clean armoured shields',
    'a quantum shield emplacement: a bunker with a glowing blue energy dome and emitters'
  ],
  sky: [
    'a flak cannon: a quad-barrel anti-aircraft gun on a clean round mount',
    'a SAM nest: surface-to-air missile launchers on a clean platform',
    'an EMP defense grid: tall clean antenna pylons with glowing blue arcs',
    'an orbital laser node: a tall white tower with a glowing blue beam to the sky, brass trim'
  ],
  garr: [
    'a squad of base guards in clean uniforms and helmets at a low concrete post',
    'a reinforced guard position: soldiers behind clean concrete walls with a mounted gun',
    'an elite perimeter division: armoured soldiers with shields at a checkpoint barrier',
    'automated command sentinels: tall white guard robots in a line, glowing blue eyes, brass trim'
  ]
};
const HERO_SUBJECT = {
  ada: ['Ada Voss, the Quartermaster: a confident woman in her thirties with goggles pushed up on a khaki cap, dark hair tied back, a clean olive field jacket with a brass zip, a practical supply-officer look', '#8ea36a', '#dfe8cf'],
  ivo: ['Ivo Hale, the Surgeon: a calm older man with grey hair and a trimmed grey beard, round glasses, a headlamp on his forehead, a surgical mask pulled down at the neck and a crisp white coat with a teal plus sign patch', '#5ec4d4', '#d8eef2'],
  ren: ['Ren Kade, the Marshal: a hard-eyed commander with a scar on his cheek, a peaked officer cap, a high-collared clean navy greatcoat with brass epaulettes', '#e0a44a', '#f4e6c8']
};
const MONSTERS = [
  ['mon_1', 'Ash Hound', 'a small hostile creature, a lean hound-like beast with pale grey armour plates and glowing orange eyes, crouched to attack, clean stylized design'],
  ['mon_3', 'Rust Brute', 'a mid-sized hostile creature, a hulking brute with orange-brown armoured hide, bone-white spurs, thick arms and glowing orange eyes, clean stylized design'],
  ['mon_5', 'Ember Colossus', 'a huge boss creature, a towering armoured colossus with a glowing ember core visible through cracks, a horned skull crown and glowing orange eyes, clean stylized design']
];
const NODES = {
  food: ['Food field', 'a resource field of crops: a fenced field of bright green-gold wheat rows and a harvest cart', ['a small patch of crops', 'a modest field of crops', 'a healthy field with a cart', 'a large rich field with silos and a tractor', 'a huge lush farmstead with silos, tractors and a windmill']],
  oil: ['Oil field', 'an oil resource site: a clean pumpjack site with dark oil pools and barrels', ['a single small oil seep with a few barrels', 'a small pumpjack and barrels', 'two pumpjacks with a storage tank', 'a busy derrick cluster with tanks and pipes', 'a large oil complex with derricks, tanks and a flare stack']],
  energy: ['Energy vein', 'an energy resource site: glowing blue energy crystals rising out of the ground', ['a few small glowing crystals', 'a small crystal cluster', 'a larger crystal outcrop with a cable rig', 'a big crystal formation with a harvester rig', 'a huge crystal spire field with a harvester and generators']],
  steel: ['Steel vein', 'a steel ore resource site: light grey-blue metal ore veins and a clean ore pile', ['a small pile of ore', 'an ore outcrop with a mining cart', 'a mining pit with a drill rig', 'a big open-cast mine with machines and ore stacks', 'a large mine complex with cranes and conveyors']]
};
const ICONS = {
  map: 'a folded map with a brass pin', base: 'a small clean fortified base building', train: 'crossed rifles with a chevron', lab: 'a glass flask with a glowing blue liquid',
  med: 'a first-aid case with a teal plus sign (no red cross)', march: 'a marching column flag on a pole', vault: 'a steel vault door with a brass wheel', hero: 'a commander helmet with a brass badge',
  alliance: 'two clasped hands over a steel shield', more: 'three brass dots in a steel plate', mail: 'a sealed envelope with a wax stamp',
  rations: 'a sheaf of golden wheat', fuel: 'an orange fuel drum with a flame', power: 'a blue battery cell with a lightning bolt', alloy: 'a stack of steel ingots',
  cash: 'a bundle of banknotes with a brass band', dia: 'a brilliant blue cut diamond', gift: 'a wrapped supply gift box with a brass ribbon', events: 'a brass calendar star badge',
  crate: 'a supply crate with a parachute', handshake: 'two hands shaking, a partnership symbol'
};
const GEM_COUNT = ['a few loose', 'a small pile of', 'a handful heap of', 'a big heap of', 'a large mound of', 'an overflowing treasure hoard of'];

/* ---------- build ---------- */
function build() {
  const D = loadData(), P = loadPacks(), items = [], groups = [];
  const add = (group, o) => { items.push(Object.assign({ group }, o)); };
  const make = (subject, ...rest) => [subject.replace(/\.?$/, '.'), ...rest].filter(Boolean).join(' ');
  const G = (id, title, note) => groups.push({ id, title, note });

  G('bld', 'Buildings (75)', 'Square, transparent, one building complex on a clean square pad. Lock the look first: make your favourite tier 1 image for one building, then attach it as a reference to every other prompt so the set matches. Do all five tiers of one building together.');
  for (const k of Object.keys(D.BLD)) {
    for (let t = 1; t <= 5; t++) add('bld', {
      key: `bld_${k}_t${t}`, name: `${D.BLD[k].n} tier ${t}`, size: '1:1, 1024 x 1024', transparent: true, out: 512,
      prompt: make(BLD_SUBJECT[k], TIERS[t], PAD, STYLE, CAM, BG_T)
    });
  }
  G('head', 'Building sheet backdrops (15)', 'The wide scenery behind a building on its info sheet. NO building in it: leave an empty flat patch of ground in the lower centre where the game places the building.');
  for (const k of Object.keys(D.BLD)) add('head', {
    key: `head_${k}`, name: `${D.BLD[k].n} backdrop`, size: '2:1 wide, 1600 x 800', transparent: false, out: 1000,
    prompt: make(`A wide scenic backdrop: ${BACKDROP[k]}. Empty flat clean ground in the lower centre for a building to be placed on, nothing important in the centre, bright sky in the upper half. Slightly raised camera, soft depth haze`, STYLE, BG_O)
  });
  G('troop', 'Troops (16)', 'One unit type per image, transparent, same camera. A squad for infantry and a single vehicle for the rest. Do tier 1 to 4 of a class together and attach tier 1 as a reference.');
  for (const c of Object.keys(D.CLSD)) D.CLSD[c].names.forEach((nm, i) => add('troop', {
    key: `troop_${c}_t${i + 1}`, name: `${nm} (${D.CLSD[c].n} tier ${i + 1})`, size: '1:1, 1024 x 1024', transparent: true, out: 384,
    prompt: make(`${TROOP_SUBJECT[c][i].replace(/^./, x => x.toUpperCase())}. Military unit "${nm}", tier ${i + 1} of 4 (higher tiers look more advanced and imposing). Only the unit, centred, on no ground`, STYLE_GEN, CAM, BG_T)
  }));
  G('wall', 'Wall defenses (16)', 'Defensive emplacements that guard your base wall. Transparent, same camera.');
  for (const c of Object.keys(D.WCLSD)) D.WCLSD[c].names.forEach((nm, i) => add('wall', {
    key: `wall_${c}_t${i + 1}`, name: `${nm} (${D.WCLSD[c].n} tier ${i + 1})`, size: '1:1, 1024 x 1024', transparent: true, out: 384,
    prompt: make(`${WALL_SUBJECT[c][i].replace(/^./, x => x.toUpperCase())}. Base defense "${nm}", tier ${i + 1} of 4 (higher tiers look more advanced). Only the emplacement, centred, on a small clean pad`, STYLE_GEN, CAM, BG_T)
  }));
  G('hero', 'Heroes (3)', 'Bust portraits with a clean, bright backdrop, no transparency.');
  for (const id of Object.keys(D.HEROES)) {
    const [d, c1, c2] = HERO_SUBJECT[id];
    add('hero', {
      key: `hero_${id}`, name: `${D.HEROES[id].n}, ${D.HEROES[id].role}`, size: '1:1, 1024 x 1024', transparent: false, out: 512,
      prompt: make(`Head and shoulders character portrait of ${d}. Stylized-realistic game character render, three-quarter view, confident expression, clean detailed skin, fabric and metal, bright soft lighting from the upper left. Simple clean backdrop: a soft gradient of ${c1} into ${c2}`, STYLE_GEN, BG_O)
    });
  }
  G('map', 'Map features (26)', 'Sprites for the world map, transparent. Shown small, so bold shapes and strong colour.');
  for (const [key, n, d] of MONSTERS) add('map', { key, name: n, size: '1:1, 1024 x 1024', transparent: true, out: 384, prompt: make(`${d.replace(/^./, c => c.toUpperCase())}. Original monster design. Only the creature, centred, with a soft shadow`, STYLE_GEN, CAM, BG_T) });
  add('map', { key: 'camp', name: 'Raider camp', size: '1:1, 1024 x 1024', transparent: true, out: 384, prompt: make('A hostile raider camp: a small cluster of dark red-brown tents around a campfire, low barricade fencing and a red pennant on a pole, on a small round patch of ground', STYLE_GEN, CAM, BG_T) });
  add('map', { key: 'outpost', name: 'Rival commander base', size: '1:1, 1024 x 1024', transparent: true, out: 384, prompt: make('A rival commander base: a small clean fortified compound with a bunker, a watch mast, low walls and a plain unmarked white flag on a pole (the game colours the flag), on a small square pad', STYLE_GEN, CAM, BG_T) });
  add('map', { key: 'citadel', name: 'Central citadel', size: '1:1, 1024 x 1024', transparent: true, out: 512, prompt: make('The Iron Citadel, a giant hexagonal white-and-steel fortress on a brass-edged plinth at the centre of the world, tall corner towers, a central spire with a bright warm beacon at the top', STYLE_GEN, CAM, BG_T) });
  for (const nk of Object.keys(NODES)) {
    const [n, d, tiers] = NODES[nk];
    tiers.forEach((tx, i) => add('map', { key: `node_${nk}_${i + 1}`, name: `${n} tier ${i + 1}`, size: '1:1, 1024 x 1024', transparent: true, out: 256, prompt: make(`${d.replace(/^./, c => c.toUpperCase())}. Richness level ${i + 1} of 5: ${tx}. On a small round patch of ground`, STYLE_GEN, CAM, BG_T) }));
  }
  G('tile', 'Ground tiles (6)', 'Flat, straight top-down textures with NO perspective and NO objects. The game bends them onto the map, so edges must tile seamlessly.');
  const tileStyle = 'Flat top-down view, no perspective, no shadows from tall objects, even bright lighting, seamless tileable texture where the left edge matches the right and the top matches the bottom. Soft, clean, low-contrast so buildings stand out on top of it. ' + BG_O + ' Style: clean stylized-realistic game texture, bright daylight, no text or logos.';
  for (let v = 1; v <= 3; v++) add('tile', { key: `tile_wild_${v}`, name: `Open ground ${v}`, size: '1:1, 1024 x 1024', transparent: false, out: 256, prompt: `Ground texture: clean light desert sand and packed earth with fine gentle ripples and a few small pebbles, ${['warm sand-tan', 'slightly greyer sand', 'slightly warmer golden sand'][v - 1]}. ${tileStyle}` });
  for (let v = 1; v <= 2; v++) add('tile', { key: `tile_forest_${v}`, name: `Forest canopy ${v}`, size: '1:1, 1024 x 1024', transparent: false, out: 256, prompt: `Forest texture seen straight from above: bright, healthy green tree crowns with soft shadows between them, ${['dense and even', 'slightly broken with lighter ground showing'][v - 1]}. ${tileStyle}` });
  add('tile', { key: 'tile_plaza_1', name: 'Citadel plaza', size: '1:1, 1024 x 1024', transparent: false, out: 256, prompt: `Ground texture: clean pale concrete plaza paving with thin brass inlay lines in a cross pattern. ${tileStyle}` });
  G('pack', 'Pack banners (16)', 'The big picture at the top of each store pack: a clean, bright loot still life with a colour glow behind it. Rarity colours: 1 green, 2 teal, 3 indigo, 4 magenta, 5 gold.');
  const rare = { 1: 'fresh green', 2: 'teal', 3: 'indigo', 4: 'magenta', 5: 'warm gold' };
  for (const p of P) add('pack', {
    key: `pack_${p.art}`, name: p.n, size: '4:3, 1600 x 1200', transparent: false, out: 800,
    prompt: make(`Store pack banner artwork for "${p.n}": ${p.blurb.replace(/\.$/, '')}. A tidy, attractive still life of the contents arranged together in the centre (crates, supplies, gear and glowing items that match the description), richer and more lavish for higher rarity (rarity ${p.tier} of 5), with soft ${rare[p.tier]} light rays and glow behind it on a clean light-grey steel background. The arrangement fills the middle 70 percent`, STYLE_GEN, BG_O)
  });
  G('gem', 'Diamond pile icons (6)', 'Six sizes of diamond pile for the diamond packs, transparent.');
  GEM_COUNT.forEach((w, i) => add('gem', { key: `gem_${i + 1}`, name: `Diamond pile ${i + 1}`, size: '4:3, 1200 x 900', transparent: true, out: 400, prompt: make(`${w[0].toUpperCase() + w.slice(1)} brilliant blue cut diamonds ${i < 2 ? 'scattered' : 'piled'} on a small clean steel plate. Size ${i + 1} of 6, the biggest is a huge sparkling hoard`, STYLE_GEN, CAM, BG_T) }));
  G('icon', 'HUD icons (21)', 'Small glossy icons, front view, transparent. They replace the flat HUD icons wherever the game shows them, so check the HUD looks right after adding them.');
  for (const k of Object.keys(ICONS)) add('icon', {
    key: `icon_${k}`, name: `Icon: ${k}`, size: '1:1, 1024 x 1024', transparent: true, out: 128,
    prompt: make(`A single glossy game icon of ${ICONS[k]}. Front view, bold simple shape that reads at 32 pixels, thick soft dark-blue outline, bright rich colour, soft highlights from the upper left, centred with a small margin`, STYLE_GEN, BG_T)
  });
  return { style: { style: STYLE, camera: CAM, transparent: BG_T, opaque: BG_O, pad: PAD }, groups, items };
}

function write() {
  const c = build();
  fs.writeFileSync(path.join(root, 'assets/catalog.json'), JSON.stringify({ v: 2, count: c.items.length, groups: c.groups, items: c.items.map(({ prompt, ...r }) => r) }, null, 1) + '\n');
  console.log(c.items.length + ' assets in ' + c.groups.length + ' groups');
}
module.exports = { build };
if (require.main === module) write();
