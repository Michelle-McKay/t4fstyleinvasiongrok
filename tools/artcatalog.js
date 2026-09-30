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
const DIA = 'Footprint: the whole subject sits on ONE perfectly square patch of ground with straight edges and sharp corners, which from the camera angle reads as a diamond that fills the frame, exactly like an isometric map tile. Any fence or wall is straight and follows the edges of that square. No round, oval, hexagonal or octagonal shapes in the outline, and nothing sticks out past the square.';
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
const EXTRA_BLD = {};   // buildings that have art but are not in js/data.js yet
const BLD_SUBJECT = {
  embassy: 'An Embassy: an allied reinforcement post, a wide welcoming hall with a flagpole, a small landing pad for arriving troop transports and a tidy reception courtyard',
  forge: 'A Forge: a bright gear workshop with a large workshop hall, an anvil-and-gear emblem on the wall, a small furnace with a short chimney, a work bench with tools, and crates of finished armour and weapons',
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
  embassy: 'soft green rolling hills under a broad blue sky with light clouds',
  forge: 'warm open plains under a clear sky with a gentle sunlit haze',
  cc: 'wide green plains fading to pale blue hills under a bright sky with light clouds',
  mil: 'open sunlit grassland with distant low hills and a bright blue sky',
  depot: 'calm green meadows with distant soft hills and a clear sky',
  treasury: 'pale rocky plains with distant low mesas under a clear blue sky',
  tech: 'a high clear plateau with distant blue ridges and soft clouds',
  hall: 'broad green fields with distant hills and a bright blue sky',
  prison: 'a bright gravel plain with distant flat hills and a pale sky',
  radar: 'a high bright ridge line falling away to distant valleys, blue sky',
  store: 'flat dry plains with distant hazy hills and a clear sky',
  defense: 'a bright open plain with distant hills and a clear sky',
  market: 'sunny golden fields with distant hills and warm light',
  rations: 'green farmland fading into golden fields with distant hills, blue sky',
  fuel: 'a bright dry plain with distant low hills and a clear sky',
  power: 'a sunny open plain with distant rolling hills and a clear sky',
  alloy: 'a bright rocky plain with distant hills and a warm horizon glow'
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
  ]
};
const HERO_SUBJECT = {
  ada: ['Ada Voss, the Quartermaster: a confident woman in her thirties with goggles pushed up on a khaki cap, dark hair tied back, a clean olive field jacket with a brass zip, a practical supply-officer look', '#8ea36a', '#dfe8cf'],
  ivo: ['Ivo Hale, the Surgeon: a calm older man with grey hair and a trimmed grey beard, round glasses, a headlamp on his forehead, a surgical mask pulled down at the neck and a crisp white coat with a teal plus sign patch', '#5ec4d4', '#d8eef2'],
  ren: ['Ren Kade, the Marshal: a hard-eyed commander with a scar on his cheek, a peaked officer cap, a high-collared clean navy greatcoat with brass epaulettes', '#e0a44a', '#f4e6c8']
};
const MONSTERS = [
  ['mon_1', 'Ash Hound', 'a small hostile creature, a lean hound-like beast with pale grey armour plates and glowing orange eyes, crouched to attack, clean stylized design'],
  ['mon_2', 'Dune Raptor', 'a small-to-mid hostile creature, a fast two-legged raptor-like beast with pale grey and sand armour plates, a long tail, sharp brass claws and glowing orange eyes, running low, a clearly different shape from a hound, clean stylized design'],
  ['mon_3', 'Rust Brute', 'a mid-sized hostile creature, a hulking brute with orange-brown armoured hide, bone-white spurs, thick arms and glowing orange eyes, clean stylized design'],
  ['mon_4', 'Slate Crawler', 'a large hostile creature, a big armoured scorpion-like crawler with slate-blue plates, two heavy claws raised, a curved tail stinger with a glowing orange tip and glowing orange eyes, clean stylized design'],
  ['mon_5', 'Ember Colossus', 'a huge boss creature standing fully upright and tall on two thick legs, twice the height of a hunched brute, with a broad chest and a crown of long curved horns; cool pale-grey and slate-blue armour plates with brass trim, a bright glowing molten-ember core in the chest showing through a cracked plate, two short brass smokestacks on the shoulders venting a little light steam, glowing orange eyes; a clearly different silhouette and colour scheme from the hunched orange-brown brute, clean stylized design'],
  ['mon_6', 'Iron Wyrm', 'the biggest boss creature, an enormous armoured serpent-like wyrm rearing up with its long segmented body coiled behind it, white and brass armour plates, a wide crest of horns, a glowing ember mouth and glowing orange eyes, far larger and more imposing than every other monster, clean stylized design']
];
const NODES = {
  food: ['Food field', 'a resource field of crops: a fenced field of bright green-gold wheat rows and a harvest cart', ['a small patch of crops', 'a modest field of crops', 'a healthy field with a cart', 'a large rich field with silos and a tractor', 'a huge lush farmstead with silos, tractors and a windmill', 'the richest farmstead: sprawling gold wheat fields, many silos, tractors, a barn and a windmill']],
  oil: ['Oil field', 'an oil resource site: a clean pumpjack site with dark oil pools and barrels', ['a single small oil seep with a few barrels', 'a small pumpjack and barrels', 'two pumpjacks with a storage tank', 'a busy derrick cluster with tanks and pipes', 'a large oil complex with derricks, tanks and a flare stack', 'the biggest oil complex: many derricks, large tanks, a small refinery tower and a bright flare stack']],
  energy: ['Energy vein', 'an energy resource site: glowing blue energy crystals rising out of the ground', ['a few small glowing crystals', 'a small crystal cluster', 'a larger crystal outcrop with a cable rig', 'a big crystal formation with a harvester rig', 'a huge crystal spire field with a harvester and generators', 'a colossal crystal spire cluster with several harvester rigs, generators and arcs of blue light']],
  steel: ['Steel vein', 'a steel ore resource site: light grey-blue metal ore veins and a clean ore pile', ['a small pile of ore', 'an ore outcrop with a mining cart', 'a mining pit with a drill rig', 'a big open-cast mine with machines and ore stacks', 'a large mine complex with cranes and conveyors', 'a giant mine complex: cranes, conveyors, tall ore stacks and glowing furnaces']]
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

  const ALL_BLD = Object.assign({}, D.BLD, EXTRA_BLD);
  G('bld', 'Buildings (85)', 'Square, transparent, one building complex on a clean square pad. Lock the look first: make your favourite tier 1 image for one building, then attach it as a reference to every other prompt so the set matches. Do all five tiers of one building together.');
  for (const k of Object.keys(ALL_BLD)) {
    for (let t = 1; t <= 5; t++) add('bld', {
      key: `bld_${k}_t${t}`, name: `${ALL_BLD[k].n} tier ${t}`, size: '1:1, 1024 x 1024', transparent: true, out: 512,
      prompt: make(BLD_SUBJECT[k], TIERS[t], PAD, STYLE, CAM, BG_T)
    });
  }
  G('head', 'Building sheet backdrops (17)', 'The wide scenery behind a building on its info sheet. NO building in it: leave an empty flat patch of ground in the lower centre where the game places the building.');
  for (const k of Object.keys(ALL_BLD)) add('head', {
    key: `head_${k}`, name: `${ALL_BLD[k].n} backdrop`, size: '2:1 wide, 1600 x 800', transparent: false, out: 1000,
    prompt: make(`A wide scenic backdrop of pure scenery: ${BACKDROP[k]}. No buildings, no roads, no paved pads, no vehicles, no towers and no signs anywhere; just soft natural ground and sky. Plain, uncluttered ground in the lower half and bright sky in the upper half, nothing important in the centre. Slightly raised camera, soft depth haze`, STYLE, BG_O)
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
  G('hero', 'Heroes (16)', 'Bust portraits with a clean, bright backdrop, no transparency.');
  for (const id of Object.keys(D.HEROES)) {
    const [d, c1, c2] = HERO_SUBJECT[id];
    add('hero', {
      key: `hero_${id}`, name: `${D.HEROES[id].n}, ${D.HEROES[id].role}`, size: '1:1, 1024 x 1024', transparent: false, out: 512,
      prompt: make(`Head and shoulders character portrait of ${d}. Stylized-realistic game character render, three-quarter view, confident expression, clean detailed skin, fabric and metal, bright soft lighting from the upper left. Simple clean backdrop: a soft gradient of ${c1} into ${c2}`, STYLE_GEN, BG_O)
    });
  }
  const NEWHERO = [
    ['mara', 'Mara Kessel, Infantry commander', "Mara Kessel, an infantry commander: a broad-shouldered woman in her thirties with short dark hair and a scar over one eyebrow, an off-white armoured jacket with orange shoulder trim", '#e0a44a', '#f6e8d0'],
    ['tobias', 'Tobias Renn, Armour commander', "Tobias Renn, an armour commander: a heavyset man in his fifties with a grey moustache, a tank-crew helmet pushed up on his forehead, goggles around his neck and a grey-and-brass jacket", '#8b979d', '#dfe8ec'],
    ['lyra', 'Lyra Okoye, Air commander', "Lyra Okoye, an air commander: a woman in her late twenties with long braided hair, a pilot helmet tucked under her arm and a flight jacket with sky-blue trim", '#5ec4d4', '#e6f5f8'],
    ['dov', 'Dov Arkin, Engineer', "Dov Arkin, an engineer: a lean man in his forties with round glasses, a welding visor flipped up on his head, a tool harness and a safety-orange vest", '#e0873a', '#f6ead6'],
    ['sable', 'Sable Quinn, Scout', "Sable Quinn, a scout: a young woman in a light-grey hooded cloak with slim binoculars on her forehead, sharp eyes and dusty tan gear", '#c9b48a', '#e8efd8'],
    ['hollis', 'Hollis Grey, Logistician', "Hollis Grey, a logistician: a friendly older man with white stubble, a clipboard under his arm, a flat cap and an olive canvas jacket", '#8ea36a', '#f0ecd8'],
    ['nadia', 'Nadia Ferro, Negotiator', "Nadia Ferro, a negotiator: a composed woman in her thirties in a tailored charcoal coat with a brass pin and a slim headset over one ear", '#59646a', '#efe6cc'],
    ['viktor', 'Viktor Aldane, Warlord', "Viktor Aldane, a warlord: an imposing man in his fifties with a silver-streaked beard, ornate white-and-gold armour with a high collar and a commander cape", '#ffc86a', '#fff4dc'],
    ['elena', 'Elena Marrow, Strategist', "Elena Marrow, a strategist: a calm woman in her forties with silver-rimmed glasses, holding a tablet that shows a map, in a white coat with gold trim", '#ffc86a', '#e6f5f8']
  ];
  for (const [id, n, d, c1, c2] of NEWHERO) add('hero', {
    key: `hero_${id}`, name: n, size: '1:1, 1024 x 1024', transparent: false, out: 512,
    prompt: make(`Head and shoulders character portrait of ${d}. Stylized-realistic game character render, three-quarter view, confident expression, clean detailed skin, fabric and metal, bright soft lighting from the upper left. Simple clean backdrop: a soft gradient of ${c1} into ${c2}`, STYLE_GEN, BG_O)
  });
  const RFR = { common: 'plain brushed steel with a thin light-grey edge', rare: 'blue-tinted steel with brass corners and a faint blue glow', epic: 'deep magenta-and-steel with brass filigree corners and a soft magenta glow', legendary: 'bright gold with white inlay, ornate corners and a warm golden glow' };
  for (const r of Object.keys(RFR)) add('hero', {
    key: `heroframe_${r}`, name: `Hero portrait frame: ${r}`, size: '1:1, 1024 x 1024', transparent: true, hollow: true, out: 256,
    prompt: make(`A square hero portrait frame border in ${RFR[r]}, front view, straight edges, even thickness, ornament on the four corners. The whole inside of the frame is one flat solid magenta (#FF00FF) so it can be cut out, and the outside is the same magenta`, STYLE_GEN, BG_T)
  });
  G('map', 'Map features (37)', 'Sprites for the world map, transparent. Shown small, so bold shapes and strong colour. The map is made of diamond (isometric) tiles, so every camp, base, citadel and resource site sits on a square patch that reads as a diamond. Nothing is round, hexagonal or octagonal.');
  for (const [key, n, d] of MONSTERS) add('map', { key, name: n, size: '1:1, 1024 x 1024', transparent: true, out: 384, prompt: make(`${d.replace(/^./, c => c.toUpperCase())}. Original monster design. Only the creature, centred, with a soft shadow`, STYLE_GEN, CAM, BG_T) });
  add('map', { key: 'camp', name: 'Raider camp', size: '1:1, 1024 x 1024', transparent: true, out: 384, prompt: make('A hostile raider camp: a small cluster of dark red-brown tents around a campfire, low straight barricade fencing along the square edges and a red pennant on a pole', STYLE_GEN, CAM, DIA, BG_T) });
  add('map', { key: 'citadel', name: 'Central citadel', size: '1:1, 1024 x 1024', transparent: true, out: 512, prompt: make('The Iron Citadel, a giant white-and-steel fortress with a brass-edged plinth, square walls following the plinth edges, four tall towers one at each corner of the square and a central spire with a bright warm beacon at the top', STYLE_GEN, CAM, DIA, BG_T) });
  const BASES = [
    'A brand-new commander base at its smallest: one small white-and-steel command hut with a brass door and a short radio mast at the back corner, a flagpole, two small supply crates and a low straight fence along the square edges. Wide open empty ground around it',
    'The same commander base, upgraded: the command hut is now a two-storey block with a helipad marking on its roof, a separate small barracks hut and a fuel tank added on the empty ground, a taller radio mast, the low fence now a proper straight wall along the square edges',
    'The same commander base, mid-game: a solid three-storey command building at the centre, two barracks blocks and a workshop with a small crane, a radar dish, sandbag-free clean steel walls along the square edges with a gate on the front-left side and small corner watch posts',
    'The same commander base, late-game: a large command complex with a tall tower, a radar dome, a hangar with an open door, storage tanks and a helipad with a small helicopter, thick steel walls along the square edges with a corner tower at each of the four corners, glowing blue windows',
    'The same commander base at its greatest: a huge fortified command city filling the whole square, a very tall central command tower with a bright beacon on top, a big hangar, two radar domes, rows of barracks, four tall corner towers, thick double walls with brass trim along the square edges, lavish and glowing, clearly the most impressive version'
  ];
  BASES.forEach((d, i) => add('map', { key: `base_${i + 1}`, name: `Commander base level ${i + 1}`, size: '1:1, 1024 x 1024', transparent: true, out: 384, prompt: make(`${d}. Commander base, level ${i + 1} of 5. It is the same base design and the same footprint at every level, only grander, so the five images read as one base growing. Neutral white, grey and warm sand colours with no player colour, the same base is used for the player and for enemy commanders`, STYLE_GEN, CAM, DIA, BG_T) }));
  for (const nk of Object.keys(NODES)) {
    const [n, d, tiers] = NODES[nk];
    tiers.forEach((tx, i) => add('map', { key: `node_${nk}_${i + 1}`, name: `${n} tier ${i + 1}`, size: '1:1, 1024 x 1024', transparent: true, out: 256, prompt: make(`${d.replace(/^./, c => c.toUpperCase())}. Richness level ${i + 1} of 6: ${tx}`, STYLE_GEN, CAM, DIA, BG_T) }));
  }
  G('tile', 'Ground tiles (6)', 'Flat, straight top-down textures with NO perspective and NO objects. The game bends them onto the map, so edges must tile seamlessly.');
  const tileStyle = 'Flat top-down view, no perspective, no shadows from tall objects, even bright lighting, seamless tileable texture where the left edge matches the right and the top matches the bottom. Soft, clean, low-contrast so buildings stand out on top of it. ' + BG_O + ' Style: clean stylized-realistic game texture, bright daylight, no text or logos.';
  for (let v = 1; v <= 3; v++) add('tile', { key: `tile_wild_${v}`, name: `Open ground ${v}`, size: '1:1, 1024 x 1024', transparent: false, out: 256, prompt: `Ground texture: clean light desert sand and packed earth with fine gentle ripples and a few small pebbles, ${['warm sand-tan', 'slightly greyer sand', 'slightly warmer golden sand'][v - 1]}. ${tileStyle}` });
  for (let v = 1; v <= 2; v++) add('tile', { key: `tile_forest_${v}`, name: `Forest canopy ${v}`, size: '1:1, 1024 x 1024', transparent: false, out: 256, prompt: `Forest texture seen straight from above: bright, healthy green tree crowns with soft shadows between them, ${['dense and even', 'slightly broken with lighter ground showing'][v - 1]}. ${tileStyle}` });
  add('tile', { key: 'tile_plaza_1', name: 'Citadel plaza', size: '1:1, 1024 x 1024', transparent: false, out: 256, prompt: `Ground texture: clean pale concrete plaza paving with thin brass inlay lines in a cross pattern. ${tileStyle}` });
  G('pack', 'Pack banners (16)', 'The big picture at the top of each store pack: a clean, bright loot still life with a colour glow behind it. Rarity colours: 1 green, 2 teal, 3 indigo, 4 magenta, 5 gold.');
  const rare = { 1: 'fresh green', 2: 'teal', 3: 'indigo', 4: 'magenta', 5: 'warm gold' };
  /* each pack shows its OWN contents in its own composition, so no two banners look alike */
  const GR = 'green-labelled grain sacks and crates', FU = 'orange fuel drums and jerry cans', PW = 'glowing cyan power cells', AL = 'stacked grey steel ingots', CA = 'bundles of banknotes with paper bands', SL = 'small glowing translucent time-slip cards with a clock symbol and no text', OR = 'sealed folded order scrolls with brass seals', TK = 'chunky brass command tokens';
  const SCENE = {
    recruit: `a single open canvas duffel bag with a few basic supplies spilling out: a folded uniform, a radio, a small ration crate and a handful of coins. Modest and small, one bag only`,
    starter: `a small treasure spread: a pile of sparkling blue diamonds in front, a neat stack of ${SL} beside a small ${GR} and a small ${FU}, laid out on a low steel plinth`,
    builder: `a large brass-and-steel contract folder standing open like a book with a glowing holographic blueprint rising from it, and TWO hard hats and two wrenches crossed in front of it, a builder's helmet with a glowing blue visor on each side. Two of everything`,
    harvest: `a tall heap of ${GR} with wheat ears poking out, next to a stack of ${CA} and a small brass scale, warm farm-harvest mood, no bag`,
    grid: `a cluster of ${FU} at the back with a row of ${PW} in front, thick cables and a small transformer box linking them, electric arcs between the cells`,
    quarter: `five tidy crates in a row along the front, each a different resource: ${GR}, ${FU}, ${PW}, ${AL} and ${CA}, one of each, laid out like an inventory display`,
    chrono: `a large ornate brass pocket-watch standing upright in the centre with its glass face open, surrounded by fanned ${SL} and a few small hourglasses, everything about time`,
    overtime: `an enormous glowing 8-hour time-slip card as tall as a book standing upright, ringed by many fanned ${SL}, a stack of technical blueprint sheets and a glowing circuit-board tablet, heavy and lavish`,
    warpath: `a row of three small detailed armoured vehicles (a tank, an armoured car and a mech) parked in a line on a steel deck, with a fuel drum stack and ${AL} behind them and a map table`,
    marshal: `a commander's briefing table with a large folded strategy map, a fan of ${OR}, several brass wax-style seal medallions and a row of ${TK}, plus a small rank insignia stand`,
    siege: `a heavy siege cannon barrel on a low carriage in the middle, with big piles of ${AL} and stacked ${OR} beside it, a broken model fortress wall in front of it`,
    foundry: `a glowing forge crucible pouring bright molten metal into a mould in the centre, ${AL} stacked on the left, a glowing green energy shard (a small angular crystal fragment) on an anvil, and a full lot of the five supply crates lined up behind`,
    vanguard: `a forged grade-3 assault rifle standing upright on a display stand as the hero, with three glowing gold angular crystal shards floating around it and ${AL} stacked at the base`,
    outrider: `a pair of forged rugged armoured boots standing upright on a display stand as the hero, with three glowing cyan angular crystal shards floating around them and ${AL} stacked at the base`,
    warlord: `a huge open steel war chest overflowing with everything: ${AL}, ${GR}, ${FU}, ${PW}, ${CA}, ${SL}, ${OR}, and a raised gold command banner-less standard on a pole behind it, lavish`,
    sovereign: `a grand open vault door with a treasure hoard inside: heaps of blue diamonds, ${AL}, ${CA}, ${SL} and ${OR}, a forged gold helmet and a forged gold armoured glove on velvet stands, a glowing gold aura, the richest and most lavish banner of all`
  };
  const COMPO = { recruit: 'centred, simple, small', starter: 'low and wide', builder: 'symmetrical, tall centre', harvest: 'tall pyramid heap', grid: 'diagonal line of cells', quarter: 'a straight row', chrono: 'circular composition around a clock', overtime: 'tall centre with fan', warpath: 'diagonal convoy', marshal: 'table seen from above', siege: 'long diagonal cannon', foundry: 'central glow, symmetrical', vanguard: 'one hero object centred, floating shards', outrider: 'one hero object centred, floating shards', warlord: 'overflowing chest, tall', sovereign: 'grand doorway framing the hoard' };
  for (const p of P) add('pack', {
    key: `pack_${p.art}`, name: p.n, size: '4:3, 1600 x 1200', transparent: false, out: 800,
    prompt: make(`Store pack banner artwork for the pack "${p.n}" (${p.blurb.replace(/\.$/, '')}). Show exactly this and nothing generic: ${SCENE[p.art]}. Composition: ${COMPO[p.art]}. Rarity ${p.tier} of 5, so ${['very modest, few items, small', 'modest', 'generous', 'rich and lavish', 'the most lavish and heavily loaded'][p.tier - 1]}, with soft ${rare[p.tier]} light rays and glow behind it. Do NOT draw a duffel bag unless it is named above. Do NOT reuse the same layout as other packs; the scene must look clearly different from a generic pile of crates. Clean light-grey steel floor and wall background, the arrangement fills the middle 75 percent`, STYLE_GEN, BG_O)
  });
  G('gem', 'Diamond pile icons (6)', 'Six sizes of diamond pile for the diamond packs, transparent.');
  GEM_COUNT.forEach((w, i) => add('gem', { key: `gem_${i + 1}`, name: `Diamond pile ${i + 1}`, size: '4:3, 1200 x 900', transparent: true, out: 400, prompt: make(`${w[0].toUpperCase() + w.slice(1)} brilliant blue cut diamonds ${i < 2 ? 'scattered' : 'piled'} on a small clean steel plate. Size ${i + 1} of 6, the biggest is a huge sparkling hoard`, STYLE_GEN, CAM, BG_T) }));
  G('icon', 'HUD icons (21)', 'Small glossy icons, front view, transparent. They replace the flat HUD icons wherever the game shows them, so check the HUD looks right after adding them.');
  for (const k of Object.keys(ICONS)) add('icon', {
    key: `icon_${k}`, name: `Icon: ${k}`, size: '1:1, 1024 x 1024', transparent: true, out: 128,
    prompt: make(`A single glossy game icon of ${ICONS[k]}. Front view, bold simple shape that reads at 32 pixels, thick soft dark-blue outline, bright rich colour, soft highlights from the upper left, centred with a small margin`, STYLE_GEN, BG_T)
  });
  G('skill', 'Hero skill icons (12)', 'Small glossy icons for hero skills and skill tree nodes, front view, transparent, bold shapes that read at 32 pixels.');
  const SKILLS = { attack: 'crossed steel blades with an orange flame between them', defence: 'a steel shield with a brass boss', health: 'a heart with a teal plus inside', speed: 'a rugged boot with small wings', yield: 'a grain sack with a gold coin in front', heal: 'a first-aid case with a glowing teal plus', rally: 'a brass war horn with a pennant', ransom: 'a steel chain with a brass key', scout: 'binoculars with a glowing blue lens', wall: 'a short section of clean steel wall with a turret', counter: 'three arrows chasing each other in a triangle', air: 'a sleek jet seen from above with swept wings' };
  for (const k of Object.keys(SKILLS)) add('skill', { key: `skill_${k}`, name: `Skill icon: ${k}`, size: '1:1, 1024 x 1024', transparent: true, out: 128, prompt: make(`A single glossy game skill icon of ${SKILLS[k]}. Front view, bold simple shape that reads at 32 pixels, thick soft dark-blue outline, bright rich colour, soft highlights from the upper left, centred with a small margin`, STYLE_GEN, BG_T) });

  G('gear', 'Gear icons (30)', 'Five slots in six grades, transparent, front view. Higher grades look grander, and the number of visible round sockets matches the grade rule: grade 1 and 2 none, grade 3 one, grade 4 two, grade 5 three, grade 6 four. Do a whole slot (six grades) together.');
  const GSLOT = { weapon: 'an assault rifle', chest: 'a body-armour vest', helmet: 'a combat helmet', boots: 'a pair of armoured boots', accessory: 'a dog-tag pendant on a chain' };
  const GGRADE = ['plain grey steel, no sockets', 'grey steel with green trim, no sockets', 'blue-trimmed steel with one empty round socket', 'purple-trimmed steel with brass details and two empty round sockets', 'gold-trimmed steel with three empty round sockets and a soft glow', 'radiant white-and-gold with four empty round sockets and a strong glow'];
  for (const sl of Object.keys(GSLOT)) GGRADE.forEach((gd, i) => add('gear', { key: `gear_${sl}_g${i + 1}`, name: `Gear: ${sl}, grade ${i + 1}`, size: '1:1, 1024 x 1024', transparent: true, out: 256, prompt: make(`A single piece of game equipment: ${GSLOT[sl]}, grade ${i + 1} of 6, ${gd}. Front three-quarter view, centred, only the item, clean modern industrial-military design`, STYLE_GEN, BG_T) }));

  G('core', 'Cores, the socket gems (6)', 'The six socket gem types, transparent. The tier (1 to 6) is shown by a glow the game draws in code, so draw one clean cut stone each.');
  const CORES = { strike: 'a faceted orange-red stone with a sharp blade-shaped highlight', guard: 'a faceted deep-blue stone with a shield-shaped highlight', bulwark: 'a faceted steel-grey stone with a brick-pattern facet', haste: 'a faceted yellow stone with a lightning-bolt highlight', yield: 'a faceted green stone with a leaf-shaped highlight', mend: 'a faceted teal-white stone with a plus-shaped highlight' };
  for (const k of Object.keys(CORES)) add('core', { key: `core_${k}`, name: `Core: ${k}`, size: '1:1, 1024 x 1024', transparent: true, out: 256, prompt: make(`A single cut gemstone for a game, ${CORES[k]}, resting on a tiny brass setting. Front three-quarter view, bold and glossy, centred, only the stone`, STYLE_GEN, BG_T) });

  G('vip', 'VIP badges (12)', 'Twelve crest badges, transparent, front view, no numbers or letters. They escalate in material and ornament so each level is clearly grander than the last: bronze for 1 to 3, silver for 4 to 6, gold for 7 to 9, platinum and diamond for 10 to 12.');
  const VIPD = ['a small plain bronze shield crest', 'a bronze shield crest with a small brass star', 'a bronze shield crest with laurel branches', 'a silver shield crest with a blue gem', 'a silver crest with short wings', 'a silver crest with wings and a laurel wreath', 'a gold crest with a red gem and wings', 'a gold crest with a small crown above it', 'a gold crest with a crown, wings and two gems', 'a platinum crest with a crown and glowing blue gems', 'a platinum crest with large wings, a crown and a bright blue diamond', 'a radiant platinum-and-gold crest with a grand crown, huge wings and a glowing diamond, the most impressive of all'];
  VIPD.forEach((d, i) => add('vip', { key: `vip_${i + 1}`, name: `VIP badge ${i + 1}`, size: '1:1, 1024 x 1024', transparent: true, out: 256, prompt: make(`A VIP rank badge: ${d}. VIP level ${i + 1} of 12, front view, glossy metal, centred, only the badge`, STYLE_GEN, BG_T) }));

  G('avatar', 'Avatars and frames (40)', 'Commander avatars are square head-and-shoulders portraits with a plain soft backdrop (the game masks them round). Frames are transparent square borders with the whole inside flat magenta. The 12 hero portraits are reused as avatars, so they are not here.');
  const AVC = ['a young woman with a short black bob and a green cap', 'a bald man with a full beard and aviator sunglasses', 'a woman with a long red ponytail and freckles wearing an orange scarf', 'a man with a buzz cut and a scar wearing a grey turtleneck', 'an older woman with white hair tied up and reading glasses', 'a man with dreadlocks tied back and a brass earring', 'a woman in an olive headscarf wearing a tactical headset', 'a young man with tousled blond hair and a blue scarf', 'a woman with a big natural afro and round sunglasses pushed up', 'a man with a sand-coloured desert scarf wrapped around his neck and goggles on his forehead', 'a woman with one side of her head shaved and a brass earpiece', 'a man with a grey ponytail and an eyepatch'];
  const AVE = ['a winter-ops soldier in a white parka with a fur-trimmed hood and frosted eyelashes', 'a harvest-festival farmer in a straw hat holding a bundle of wheat', 'a night-ops soldier in a black cap with glowing green goggles', 'a spring-festival soldier wearing a flower crown', 'a summer soldier in a sun visor and sunglasses with a big grin', 'an ace pilot in a leather flying helmet and goggles', 'a mech pilot in a sealed helmet with a glowing visor', 'a deep-sea diver in a brass diving helmet'];
  const AVV = ['an officer in a bronze-trimmed cap', 'an officer in a silver-trimmed cap and jacket', 'an officer in gold-trimmed uniform with epaulettes', 'a commander in a gold uniform with a short cape', 'a commander in white-and-gold armour with a high collar', 'a marshal wearing a golden laurel wreath', 'a marshal in platinum armour with softly glowing blue eyes', 'a grand marshal in gold armour with a glowing halo behind the head'];
  const avatarAdd = (key, name, d) => add('avatar', { key, name, size: '1:1, 1024 x 1024', transparent: false, out: 256, prompt: make(`Head and shoulders character portrait of ${d}. Stylized-realistic game character render, facing the viewer, friendly confident expression, bright soft lighting, plain soft pale backdrop`, STYLE_GEN, BG_O) });
  AVC.forEach((d, i) => avatarAdd(`avatar_c${i + 1}`, `Avatar: commander ${i + 1}`, d));
  AVE.forEach((d, i) => avatarAdd(`avatar_e${i + 1}`, `Avatar: event ${i + 1}`, d));
  AVV.forEach((d, i) => avatarAdd(`avatar_v${i + 1}`, `Avatar: VIP ${i + 1}`, d));
  const FRM = ['thin plain steel', 'bronze', 'silver', 'gold', 'steel with orange safety chevrons', 'steel with a glowing blue inner line', 'gold laurel wreath', 'silver spread wings on both sides', 'steel with short brass spikes', 'gold set with small gems', 'platinum with stylised flames', 'a gold crown at the top with ornate platinum sides'];
  FRM.forEach((d, i) => add('avatar', { key: `frame_${i + 1}`, name: `Avatar frame ${i + 1}`, size: '1:1, 1024 x 1024', transparent: true, hollow: true, out: 256, prompt: make(`A square avatar frame border in ${d}, front view, even thickness. The whole inside of the frame is one flat solid magenta (#FF00FF) so it can be cut out, and the outside is the same magenta`, STYLE_GEN, BG_T) }));

  G('chat', 'Chat icons and stickers (16)', 'Four channel icons and twelve stickers, transparent, front view, no letters. Stickers are bold expressive emotes in the same glossy style, worn by a small helmeted mascot face or hand.');
  const CHI = { world: 'a globe with a brass ring around it', alliance: 'a steel shield with two clasped hands', private: 'two overlapping speech bubbles', system: 'a brass megaphone with sound waves' };
  for (const k of Object.keys(CHI)) add('chat', { key: `chat_${k}`, name: `Chat channel: ${k}`, size: '1:1, 1024 x 1024', transparent: true, out: 128, prompt: make(`A single glossy game icon of ${CHI[k]}. Front view, bold simple shape that reads at 32 pixels, thick soft dark-blue outline, bright rich colour, centred with a small margin`, STYLE_GEN, BG_T) });
  const STK = ['a gloved thumbs-up', 'a laughing helmeted face with tears of joy', 'an angry helmeted face with steam from the ears', 'a crying helmeted face', 'a crisp salute', 'a party horn with confetti', 'a glossy red heart with a small wing', 'a shocked helmeted face with wide eyes', 'a fist bump between two gloves', 'a flexing armoured arm', 'a facepalm', 'a sleepy helmeted face with floating bubbles'];
  STK.forEach((d, i) => add('chat', { key: `sticker_${i + 1}`, name: `Sticker ${i + 1}`, size: '1:1, 1024 x 1024', transparent: true, out: 256, prompt: make(`A chat sticker: ${d}. Bold expressive emote, glossy stylised game art, thick soft dark-blue outline, centred, only the emote`, STYLE_GEN, BG_T) }));

  G('item', 'Item icons (18)', 'Icons for pack contents and rewards, transparent, front view, no letters or numbers. Speed-up slips get bigger, brighter and more elaborate with size; hero XP potions grow from a small vial to a huge glowing jug.');
  const SLD = ['a tiny green glowing time-slip card with a small clock', 'a small green glowing time-slip card with a clock', 'a teal glowing time-slip card with a clock and a short ribbon', 'a blue glowing time-slip card with a clock', 'a purple glowing time-slip card with a clock and gold edges', 'a magenta glowing time-slip card with a large clock and gold edges', 'a large orange glowing time-slip card with a large ornate clock', 'a huge golden time-slip card with an ornate clock, wings and a strong glow'];
  ['1m', '5m', '15m', '30m', '1h', '3h', '8h', '24h'].forEach((t, i) => add('item', { key: `item_slip_${t}`, name: `Speed-up slip ${t}`, size: '1:1, 1024 x 1024', transparent: true, out: 128, prompt: make(`A speed-up item: ${SLD[i]}. Size ${i + 1} of 8, so it is visibly bigger and grander than the smaller ones. Front view, centred, only the item`, STYLE_GEN, BG_T) }));
  const XPD = ['a small glass vial of glowing green liquid with a cork', 'a medium blue flask of glowing liquid with a brass cap', 'a large purple bottle of glowing liquid with a brass band', 'a huge golden jug of glowing liquid with a star badge and sparkles'];
  ['s', 'm', 'l', 'h'].forEach((t, i) => add('item', { key: `item_xp_${t}`, name: `Hero XP potion ${t}`, size: '1:1, 1024 x 1024', transparent: true, out: 128, prompt: make(`A hero experience potion: ${XPD[i]}. Size ${i + 1} of 4, each bigger and grander than the last. Front view, centred, only the item`, STYLE_GEN, BG_T) }));
  const CHD = ['a single glossy round casino chip with a brass rim and a star in the middle', 'a neat stack of eight casino chips in red, blue and green with brass rims', 'a tall tower of casino chips in many colours beside a small open brass case full of chips'];
  ['1', '10', '100'].forEach((t, i) => add('item', { key: `item_chip_${t}`, name: `Casino chips ${t}`, size: '1:1, 1024 x 1024', transparent: true, out: 128, prompt: make(`${CHD[i].replace(/^./, c => c.toUpperCase())}. Size ${i + 1} of 3. Front three-quarter view, centred, only the item, no numbers or letters on the chips`, STYLE_GEN, BG_T) }));
  add('item', { key: 'item_skillbook', name: 'Skill book', size: '1:1, 1024 x 1024', transparent: true, out: 128, prompt: make('A brass-bound blue hardcover book with a glowing gold star on the cover and a few glowing pages. Front three-quarter view, centred, only the item', STYLE_GEN, BG_T) });
  add('item', { key: 'item_shard', name: 'Hero shard', size: '1:1, 1024 x 1024', transparent: true, out: 128, prompt: make('A glowing angular crystal shard with a small star inside, cool white-blue light. Front three-quarter view, centred, only the item', STYLE_GEN, BG_T) });
  add('item', { key: 'item_wheel', name: 'Casino wheel', size: '1:1, 1024 x 1024', transparent: true, out: 256, prompt: make('A casino prize wheel: a round white-and-brass wheel divided into many bright colour segments with a small brass pointer at the top and a glowing centre hub. No numbers or letters. Front view, centred, only the wheel', STYLE_GEN, BG_T) });
  return { style: { style: STYLE, camera: CAM, transparent: BG_T, opaque: BG_O, pad: PAD }, groups, items };
}

function write() {
  const c = build();
  fs.writeFileSync(path.join(root, 'assets/catalog.json'), JSON.stringify({ v: 2, count: c.items.length, groups: c.groups, items: c.items.map(({ prompt, ...r }) => r) }, null, 1) + '\n');
  console.log(c.items.length + ' assets in ' + c.groups.length + ' groups');
}
module.exports = { build };
if (require.main === module) write();
