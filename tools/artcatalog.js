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
  'Original design, not a copy of any existing game or franchise. No text, letters, numbers, logos, real flags, watermark, signature or border. Sharp clean edges everywhere, no smeared, melted, blurry or duplicated parts, no floating fragments, no warped perspective, no extra or missing limbs, no fake writing or squiggles that look like letters.';
/* buildings and backdrops */
const STYLE = STYLE_HEAD + 'Bright, clean, modern industrial-military look: modular buildings with smooth painted metal panels in off-white, light grey and warm sand, tidy poured-concrete, safety-orange and brass accents, and softly glowing blue windows and light strips. ' + STYLE_TAIL;
/* units, heroes, creatures, icons, packs */
const STYLE_GEN = STYLE_HEAD + 'Bright, clean, modern industrial-military palette: off-white, light grey and warm sand with safety-orange and brass accents and softly glowing blue lights. ' + STYLE_TAIL;
const CAM = 'Camera: three-quarter overhead, looking down about 40 degrees, front-left corner facing the viewer, the same camera, scale and lighting as every other asset in this set.';
const DIA = 'Footprint: the whole subject sits on ONE perfectly square patch of ground with straight edges and sharp corners, which from the camera angle reads as a diamond that fills the frame, exactly like an isometric map tile. Any fence or wall is straight and follows the edges of that square. No round, oval, hexagonal or octagonal shapes in the outline, and nothing sticks out past the square.';
const BG_T = 'Background: one flat solid magenta (#FF00FF) colour filling the whole frame, no gradient, no floor, no shadow on it. Any shadow inside the subject is a soft neutral grey-brown, never purple, pink or magenta, and no pink, red-violet or magenta colour appears anywhere on the subject itself. Do NOT draw a grey checkerboard pattern (that is a fake transparency grid and cannot be removed).';
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
  embassy: 'gentle green hills with soft flowering shrubs, a pale winding footpath fading into the distance and a broad blue sky with a few white clouds',
  forge: 'a warm red-brown rocky quarry floor with layered stone ledges, a few dark ore veins in the cliff walls and a hazy orange-tinted sky',
  cc: 'wide open green plains with a few small tree clumps, pale blue hills in the distance and a bright sky with light clouds',
  mil: 'a flat sunlit drill-ground of short trimmed grass and packed earth with a low tree line far away and a clear blue sky',
  depot: 'calm green meadow with scattered white wildflowers, a soft treeline and a clear pale sky',
  treasury: 'pale sandstone plains with a few smooth rounded boulders and two distant flat-topped mesas under a clear blue sky',
  tech: 'a high clean plateau of pale grey rock and short grass with distant blue ridges and soft clouds',
  hall: 'broad green fields cut by a long shallow river far away, distant hills and a bright blue sky',
  prison: 'a flat bare gravel plain in pale grey with a few tiny dry shrubs, distant flat hills and a pale hazy sky',
  radar: 'a bright rocky ridge top with short grass falling away to blue valleys far below and a high clear sky',
  store: 'flat dry golden grassland with faint tyre tracks fading to the horizon, distant hazy hills and a clear sky',
  defense: 'an open grey-green plain with low rocky outcrops, distant hills and a clear sky',
  market: 'sunny golden wheat fields with a few poplar trees, distant hills and warm afternoon light',
  rations: 'green farmland in neat stripes fading into golden fields, distant hills and a blue sky',
  fuel: 'a dry ochre plain with small dark oil-stained patches far away, distant low hills and a clear sky',
  power: 'a sunny open green-brown plain with a few tall grass tufts, distant rolling hills and a clear sky',
  alloy: 'a grey rocky mesa top with orange mineral seams in the rock, distant hills and a warm horizon glow'
};
const TROOP_SUBJECT = {
  inf: [
    'a squad of exactly three riot troopers in sand-and-grey riot armour: full-face clear visors, knee and elbow guards, and a tall clear riot shield each, holding batons, standing close together, clearly defensive and unarmed at range',
    'a squad of exactly three modern combat infantry in plain sand-coloured fabric uniforms with a simple plate carrier, an open-face helmet and a rifle each, in a ready stance, no exoskeleton, no glowing parts, no shields',
    'a squad of exactly three soldiers in sleek white-and-grey powered exoskeleton suits: exposed joint pistons, a bulky backpack power pack, angular shoulder plates, a closed blue visor and a heavy rifle each, clearly bulkier and more mechanical than plain infantry',
    'a squad of exactly three elite vanguard soldiers, taller than the other tiers, in polished white full-body exo-armour with thick brass trim, a swept-back helmet crest, glowing blue chest cores and visors and a heavy plasma rifle each, imposing and heroic'
  ],
  arm: [
    'a light armoured scout car: a four-wheeled open-frame vehicle with a small roof-mounted gun, large wheels, clean sand-and-white paint, no cannon',
    'a battle tank: a tracked tank with a single long cannon on a rotating turret and angled armour, clean sand-and-grey paint',
    'a heavy assault mech: a two-legged armoured walker standing upright with twin arm cannons and a small cockpit, clean white and grey panels',
    'a juggernaut: a giant tracked super-tank with three turrets, layered white armour, brass trim and glowing blue vents, far wider and heavier than the battle tank'
  ],
  air: [
    'a small recon drone: a compact four-rotor drone with a camera pod under its body, no weapons, hovering slightly above its shadow',
    'an attack helicopter: a single main rotor and tail rotor, stub wings with rocket pods, clean sand-and-white paint, hovering slightly above its shadow',
    'a heavy gunship: a twin-rotor VTOL aircraft with side-mounted guns and a wide fuselage, white and grey, hovering slightly above its shadow',
    'a stealth bomber: a sleek angular flying wing in pale grey with no rotors, glowing blue engine slits, slightly above its shadow'
  ],
  siege: [
    'a simple siege launcher: a wheeled truck carrying an open rocket rack with six rockets on a tidy frame, clean sand-and-white paint',
    'a plasma mortar: a compact armoured tracked carriage with a short fat barrel wrapped in glowing blue coils',
    'a breach artillery piece: a very long-barrelled howitzer on a reinforced tracked carriage, clean grey and white',
    'a demolition walker: a large four-legged walker carrying a swinging wrecking-ball arm and a siege cannon, white with brass trim'
  ]
};
const TSUF = 'Render style: smooth polished 3D game render with soft shading and clean edges, exactly the same style as the buildings of this set, NOT a comic, NOT a cartoon, NOT cel-shaded, NO black outlines. The unit faces front-left, fills about 80 percent of the frame, and is shown at the same scale and camera as every other unit in the set. A soft neutral shadow directly under it, no ground, no base plate, no text';
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
  ['mon_5', 'Ember Colossus', 'a huge boss creature standing fully upright and tall on two thick legs, twice the height of a hunched brute, with a broad chest and a crown of long curved horns; cool pale-grey and slate-blue armour plates with brass trim, a bright glowing molten-ember core in the chest showing through a cracked plate, two short brass smokestacks on the shoulders venting a little light steam, glowing orange eyes; a clearly different silhouette and colour scheme from the hunched orange-brown Rust Brute (it must NOT be orange-brown and must NOT be hunched), clean stylized design'],
  ['mon_6', 'Iron Wyrm', 'the biggest boss creature, an enormous armoured serpent-like wyrm rearing up with its long segmented body coiled behind it, white and brass armour plates, a wide crest of horns, a glowing ember mouth and glowing orange eyes, far larger and more imposing than every other monster, clean stylized design']
];
const NODES = {
  food: ['Food field', 'a food resource site: wheat crop plots inside the compound', [
    'ONE small square plot of young green seedlings in four short rows and a single wooden hand cart, otherwise bare packed earth',
    'TWO plots of green wheat, six rows each, and one harvest cart',
    'FOUR plots of tall green-gold wheat in a two-by-two grid with a dirt cross path and a small farm truck',
    'four large golden wheat plots, one round grain silo and a tractor',
    'four large golden wheat plots, THREE tall grain silos, two tractors and a small windmill',
    'the richest farmstead: five golden wheat plots filling the compound, FOUR tall silos, a red-roofed barn, three tractors and a windmill'
  ]],
  oil: ['Oil field', 'an oil resource site: dark oil and pumping equipment inside the compound', [
    'ONE small round dark oil pool and three orange barrels, nothing else',
    'ONE pumpjack over an oil pool and four orange barrels',
    'TWO pumpjacks, one round steel storage tank and a small control cabin',
    'a tall steel derrick tower in the centre, two pumpjacks, three round storage tanks and connecting pipes',
    'a derrick, three pumpjacks, four storage tanks, a pipe network and a tall flare stack with a small flame',
    'the biggest oil complex: two derricks, four pumpjacks, six large tanks, a slim distillation tower and a tall flare stack with a bright flame'
  ]],
  energy: ['Energy vein', 'an energy resource site: glowing blue crystals inside the compound', [
    'THREE small glowing blue crystals on bare ground and one tiny cable box',
    'ONE small cluster of five blue crystals with a cable running to a small box',
    'ONE medium crystal outcrop, a small harvester machine and two cable boxes',
    'ONE large crystal formation, a harvester rig with a short arm and two small generators',
    'THREE tall crystal spires with a large harvester rig, three generators and a ring of glowing cables',
    'the richest vein: a colossal central crystal spire surrounded by six smaller spires, three harvester rigs, four generators and thin arcs of blue light between them'
  ]],
  steel: ['Steel vein', 'a steel ore resource site: grey-blue metal ore inside the compound', [
    'ONE small pile of grey-blue ore rocks and a shovel, on bare ground',
    'ONE ore outcrop and one mining cart on a short rail',
    'a shallow mining pit with a small drill rig and one ore cart',
    'a deep stepped open-cast pit with an excavator, a dump truck and two stacks of ore',
    'a large stepped pit with a crane, a conveyor belt running to an ore stack and two trucks',
    'the giant mine: a very deep stepped pit, two cranes, two conveyors, tall ore stacks, three trucks and a glowing furnace'
  ]]
};
const NODEFP = 'Every one of the six levels of a resource uses the IDENTICAL compound: one square fenced compound of packed sand-brown earth with a low fence of pale warm-grey panels and small brass posts (no pink, red or magenta trim), exactly the same size, angle and corner positions in every image, filling the frame width. Only what stands inside the compound changes, and each level clearly holds more, bigger and more advanced equipment than the level before, with the exact counts given';
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
    prompt: make(`A wide scenic backdrop of pure scenery: ${BACKDROP[k]}. Painted, stylized 3D game-background look with soft clean shapes and gentle colour, NOT a photograph and NOT photorealistic. No buildings, no roads, no paved pads, no vehicles, no towers, no fences, no people and no signs anywhere; just natural ground and sky. Composition: sky in the top 30 percent, distant hills or horizon at 30 percent, then calm plain ground filling the lower 70 percent with nothing at all in the centre, interest only near the left and right edges. Slightly raised camera, soft depth haze, no vignette, no frame`, STYLE, BG_O)
  });
  G('troop', 'Troops (16)', 'One unit type per image, transparent, same camera. A squad for infantry and a single vehicle for the rest. Do tier 1 to 4 of a class together and attach tier 1 as a reference.');
  for (const c of Object.keys(D.CLSD)) D.CLSD[c].names.forEach((nm, i) => add('troop', {
    key: `troop_${c}_t${i + 1}`, name: `${nm} (${D.CLSD[c].n} tier ${i + 1})`, size: '1:1, 1024 x 1024', transparent: true, out: 384,
    prompt: make(`${TROOP_SUBJECT[c][i].replace(/^./, x => x.toUpperCase())}. Military unit "${nm}", tier ${i + 1} of 4: each higher tier is clearly larger, better armoured and more advanced than the one before, with a clearly different silhouette. ${TSUF}`, STYLE_GEN, CAM, BG_T)
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
  add('map', { key: 'camp', name: 'Raider camp', size: '1:1, 1024 x 1024', transparent: true, out: 384, prompt: make('A hostile raider camp on the same kind of square compound as the commander bases: one square fenced pad of packed sand-brown earth with a low straight barricade of grey panels along all four edges (NOT a circle, NOT an oval), four dark red-brown tents around a campfire in the middle, a red pennant on a pole and two crates', STYLE_GEN, CAM, DIA, BG_T) });
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
    tiers.forEach((tx, i) => add('map', { key: `node_${nk}_${i + 1}`, name: `${n} tier ${i + 1}`, size: '1:1, 1024 x 1024', transparent: true, out: 256, prompt: make(`${d.replace(/^./, c => c.toUpperCase())}. Richness level ${i + 1} of 6, containing exactly: ${tx}. ${NODEFP}`, STYLE_GEN, CAM, DIA, BG_T) }));
  }
  G('tile', 'Ground tiles (6)', 'Flat, straight top-down textures with NO perspective and NO objects. The game bends them onto the map, so edges must tile seamlessly.');
  const tileStyle = 'Flat top-down view, no perspective, no shadows from tall objects, even bright lighting, seamless tileable texture where the left edge matches the right and the top matches the bottom. Soft, clean, low-contrast so buildings stand out on top of it. ' + BG_O + ' Style: clean stylized-realistic game texture, bright daylight, no text or logos.';
  for (let v = 1; v <= 3; v++) add('tile', { key: `tile_wild_${v}`, name: `Open ground ${v}`, size: '1:1, 1024 x 1024', transparent: false, out: 256, prompt: `Ground texture seen straight from above: ${['warm golden desert sand with fine wind ripples running diagonally and a few tiny pebbles', 'pale grey packed dust and fine gravel with scattered small flat stones, no ripples', 'dry sun-baked tan earth with a fine network of shallow cracks and a few tiny dry tufts'][v - 1]}. The three open-ground textures must clearly differ from each other in colour and pattern. ${tileStyle}` });
  for (let v = 1; v <= 2; v++) add('tile', { key: `tile_forest_${v}`, name: `Forest canopy ${v}`, size: '1:1, 1024 x 1024', transparent: false, out: 256, prompt: `Forest texture seen straight from above: ${['a dense broadleaf forest, round bright-green tree crowns of mixed sizes packed closely with soft shadows between them', 'a conifer forest, small dark blue-green star-shaped pine crowns with a few small clearings of pale grass showing'][v - 1]}. The two forest textures must clearly differ in tree shape and colour. ${tileStyle}` });
  add('tile', { key: 'tile_plaza_1', name: 'Citadel plaza', size: '1:1, 1024 x 1024', transparent: false, out: 256, prompt: `Ground texture seen straight from above: pale concrete plaza paving in large square slabs laid in a running-bond pattern, with a thin brass inlay line forming one large square frame and a small brass compass-star in the centre, very light wear. ${tileStyle}` });
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

  G('vip', 'VIP badges (7)', 'One badge family in seven images. Levels 1 and 2 share image 1, levels 3 and 4 share image 2, 5 and 6 share image 3, 7 and 8 share image 4, 9 and 10 share image 5, level 11 has its own (vip_11) and level 12 has one special badge (vip_12). Every badge has the identical shape, size and layout; only the metal and one small detail change, so they read as a set. Attach the first one you like as a reference when making the rest.');
  const VSHAPE = 'The badge is ONE upright shield crest, symmetrical left to right, about 1 unit wide by 1.15 units tall, with a flat top edge with a shallow centre notch, straight sides and a rounded point at the bottom. It has a thick bevelled outer rim, a smooth recessed inner field, ONE embossed five-pointed star exactly in the centre of the field, and two small identical laurel sprigs curving up the lower left and lower right of the rim. Nothing else: NO wings, NO crown, NO ribbon, NO gems on the rim, NO sparkles, NO rays, NO glow around the badge, NO extra pieces sticking out past the shield outline. Front view, flat-on, perfectly centred, filling about 80 percent of the frame, glossy smooth metal with a soft highlight from the upper left. The outline, proportions, star size and laurel size are IDENTICAL in every badge of this set, only the finish below changes. No numbers, letters or symbols';
  const VIPD = [
    ['vip_1', 'VIP badge 1 (levels 1 and 2)', 'Finish: matte dark bronze rim, slightly darker bronze inner field, star in the same bronze, plain and calm'],
    ['vip_2', 'VIP badge 2 (levels 3 and 4)', 'Finish: polished bronze rim with a brighter bronze star and a thin brass line inside the rim, inner field in bronze'],
    ['vip_3', 'VIP badge 3 (levels 5 and 6)', 'Finish: brushed silver rim, inner field a slightly darker steel grey, star in bright silver'],
    ['vip_4', 'VIP badge 4 (levels 7 and 8)', 'Finish: polished silver rim with a thin brass line inside the rim, inner field a deep soft blue, star in bright silver'],
    ['vip_5', 'VIP badge 5 (levels 9 and 10)', 'Finish: polished warm gold rim, inner field a deep soft blue, star in bright gold, laurel sprigs in gold'],
    ['vip_11', 'VIP badge 11', 'Finish: bright platinum-white rim with a thin gold line inside the rim, inner field a deep soft blue, star in bright platinum. The only extra detail: one small clear-cut blue diamond set in the centre notch of the top edge, no bigger than the star'],
    ['vip_12', 'VIP badge 12 (special, the top level)', 'Finish: bright platinum-white rim with a thicker gold outer edge line, inner field a deep midnight blue, star in polished gold, laurel sprigs in gold. The only extra details: the same small clear-cut blue diamond as level 11 in the top notch, and one thin gold line tracing the inside of the rim. It must look like a very slightly richer version of level 11, NOT a new design, NOT ornate, no added crown or wings'],
  ];
  VIPD.forEach(([key, name, d]) => add('vip', { key, name, size: '1:1, 1024 x 1024', transparent: true, out: 256, prompt: make(`A VIP rank badge for a mobile strategy game. ${VSHAPE}. ${d}`, STYLE_GEN, BG_T) }));
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
  /* ---- screens, alliance, marches, quests, city (Michelle, 2026-09-30) ---- */
  const HEAD = 'Wide header banner, 16:5, nothing that looks like text or letters. The middle third stays calm so a title can sit on it: fill it only with plain open sky, empty road or empty ground in the SAME lighting as the rest, with no small details. It must NOT be a lighter box, panel, overlay, translucent rectangle, fade, vignette or any visible shape with edges: the picture must look like one continuous scene with no seams. The interesting objects sit in the left and right thirds. The picture runs right to every edge of the frame: NO frame, NO border, NO trim, NO panel edge, NO rounded corners, NO dark bars or strips along any edge. Soft light-grey to warm-sand tones.';
  const ICO = (subj, extra) => make(`A single glossy game icon of ${subj}. Front view, bold simple shape that reads at 32 pixels, thick soft dark-blue outline, centred, only the icon${extra ? ', ' + extra : ''}`, STYLE_GEN, BG_T);
  const ICOADD = (grp, key, name, subj, out, extra) => add(grp, { key, name, size: '1:1, 1024 x 1024', transparent: true, out: out || 128, prompt: ICO(subj, extra) });
  const HEADADD = (grp, key, name, scene) => add(grp, { key, name, size: '16:5, 1600 x 500', transparent: false, out: 800, prompt: make(`${scene}. ${HEAD}`, STYLE_GEN, BG_O) });

  G('tab', 'Tab headers, empty states and mail icons (23)', 'Header banners for the Item, Mail, Alliance, Quest, Event, More, Rewards and Help screens (wide, no lettering, calm middle for a title), eight empty-state pictures shown when a list has nothing in it, and seven mail icons.');
  HEADADD('tab', 'tabhead_item', 'Header: Item bag', 'A tidy supply shelf and rolling crate in a bright warehouse, a few labelled-by-colour crates, a brass scale and a stack of glowing time-slips at the edges');
  HEADADD('tab', 'tabhead_boost', 'Header: Boosts', 'A row of glowing energy cells, a small rocket-shaped booster and speed lines, cool teal and orange light');
  HEADADD('tab', 'tabhead_mail', 'Header: Mail', 'A brass mail slot in a steel wall with a few sealed envelopes and paper dispatch scrolls at the edges');
  HEADADD('tab', 'tabhead_alliance', 'Header: Alliance', 'A row of tall banners on a parade ground and a large steel shield with two clasped hands in the far centre, small flags along the edges');
  HEADADD('tab', 'tabhead_quest', 'Header: Quests', 'A commander desk edge with a large rolled objective scroll, a brass compass and a small glowing star medal');
  HEADADD('tab', 'tabhead_event', 'Header: Events', 'A festive control-room stage with bunting made of small flags, a glowing prize crate and soft spotlights');
  HEADADD('tab', 'tabhead_more', 'Header: More', 'A tidy tool wall with a brass gear, a wrench, a clipboard and a small radio, calm and neutral');
  HEADADD('tab', 'tabhead_rewards', 'Header: Rewards', 'A brass trophy shelf with a gold cup, a chest with light spilling out and a few glowing gems at the edges');
  const EMP = { mail: 'an empty steel mailbox with its door open and a single feather-light dust puff', reports: 'an empty steel clipboard with a blank sheet and a magnifying glass', saved: 'an empty brass drawer pulled half open with a star tag on it', contacts: 'a rugged field telephone with the handset resting and a coiled cord', bag: 'an empty open supply crate with a few wood shavings', quests: 'a rolled blank scroll tied with a brass pin and a small compass', alliance: 'a single empty steel banner pole with a folded flag at its foot', rally: 'a rally horn and an empty map table with a pin in it' };
  for (const k of Object.keys(EMP)) add('tab', { key: `empty_${k}`, name: `Empty state: ${k}`, size: '1:1, 1024 x 1024', transparent: true, out: 256, prompt: make(`A friendly empty-state picture: ${EMP[k]}. Front three-quarter view, centred, soft and inviting, only the object`, STYLE_GEN, BG_T) });
  const MAILI = { report_win: 'a folded battle report with a green check and a small gold laurel', report_loss: 'a folded battle report with a red cross and a torn corner', scout: 'a folded report with a small brass telescope on it', system: 'a steel envelope with a blue gear stamped on it', alliance: 'an envelope sealed with a steel shield wax seal', gift: 'a small parcel tied with a brass ribbon', unread: 'a closed cream envelope with a bright red seal dot' };
  for (const k of Object.keys(MAILI)) ICOADD('tab', `mail_${k}`, `Mail icon: ${k.replace('_', ' ')}`, MAILI[k]);

  G('ally', 'Alliance art (38)', 'Sixteen alliance emblems, five rank badges, fifteen feature icons (help, tech, gifts, war, territory, shop, members, donations, chat, rally, embassy, throne, mail, quests, flag), a create-alliance banner and the alliance hall backdrop.');
  const EMB = ['a steel wolf head', 'a golden eagle with spread wings', 'a bear paw', 'a coiled cobra', 'a roaring lion head', 'a crossed sword and wrench', 'a mountain with a rising sun', 'a stylised tank front', 'a lightning bolt over a gear', 'a brass anchor', 'a horned ram skull', 'a stylised fox head', 'a dragon head in profile', 'a five-pointed star inside a ring', 'a crown over crossed rifles', 'a tower with a flag'];
  EMB.forEach((d, i) => add('ally', { key: `ally_emblem_${i + 1}`, name: `Alliance emblem ${i + 1}`, size: '1:1, 1024 x 1024', transparent: true, out: 256, prompt: make(`A heraldic alliance emblem: ${d} on a strong shield-shaped steel plate with a thick brass rim. Front view, symmetrical, bold flat colours with soft glossy shading, no letters, no text, centred, only the emblem`, STYLE_GEN, BG_T) }));
  const RK = ['a plain steel pin with one chevron', 'a steel pin with two chevrons', 'a brass pin with three chevrons and a small star', 'a silver pin with a shield and a star', 'a gold pin with a crown over a star'];
  RK.forEach((d, i) => ICOADD('ally', `ally_rank_${i + 1}`, `Alliance rank R${i + 1}`, `a rank badge: ${d}. Rank ${i + 1} of 5, each clearly grander than the last`));
  const AF = { help: 'two clasped hands giving a wrench', tech: 'a glowing blue circuit-board tablet with a small shield', gifts: 'a parcel with a brass ribbon and a shield tag', war: 'two crossed swords over a shield with a red glow', territory: 'a flag planted on a hex tile', shop: 'a steel market stall awning with a coin', members: 'three helmeted heads in a row', donate: 'a steel donation box with a coin dropping in', chat: 'a speech bubble with a small shield', rally: 'a rally horn with sound waves', embassy: 'a small building with a flag and a handshake', throne: 'an ornate brass-and-steel throne', mail: 'a sealed envelope with a shield', quests: 'a rolled scroll with a shield seal', flag: 'a tall steel flagpole with a folded alliance flag' };
  for (const k of Object.keys(AF)) ICOADD('ally', `ally_${k}`, `Alliance: ${k}`, AF[k]);
  HEADADD('ally', 'ally_create', 'Alliance: create banner', 'A rally of many small tents and flags under a huge unfurled blank banner, a brass trumpet and an open ledger on a table at the edge');
  add('ally', { key: 'ally_hall', name: 'Alliance hall backdrop', size: '9:16, 1080 x 1920', transparent: false, out: 1600, prompt: make('A portrait background scene of a grand alliance hall interior: high steel-and-glass ceiling, rows of tall banners, a large round war table with a glowing map in the centre distance, warm light beams from tall windows. Empty of people, no text. Keep the middle calm so lists can sit on top of it', STYLE_GEN, BG_O) });

  G('march', 'March and map-action art (20)', 'Two screen headers, ten march-type icons and six small march sprites for the world map (top-down-ish, transparent), plus a route end-marker and a dust puff.');
  HEADADD('march', 'marchhead_cols', 'Header: March columns', 'A long armoured column rolling out of a base gate at sunrise seen from the side, banners flying');
  HEADADD('march', 'marchhead_field', 'Header: Field marches', 'A wide open field with a winding road, a distant target flag and a small scout drone overhead');
  const MI = { attack: 'two crossed swords over a red shield', scout: 'a brass telescope and a small eye', rally: 'a rally horn with a red banner', gather: 'a pickaxe and a full supply sack', reinforce: 'a shield with a plus and a helmet', return: 'a curved arrow returning home to a small house', camp: 'a raider tent with a skull flag', monster: 'a snarling beast head with claws', teleport: 'a glowing blue portal ring', trade: 'two crates and a swap arrow' };
  for (const k of Object.keys(MI)) ICOADD('march', `march_${k}`, `March: ${k}`, MI[k]);
  const MM = { troop: 'a short column of three armoured vehicles driving in a line, a small blue pennant on the lead one', scout: 'one fast lightweight scout buggy with a radar dish and a small yellow pennant', attack: 'a heavy armoured column of a tank, an armoured car and a mech, red pennants', rally: 'a large convoy of many mixed armoured vehicles with red and orange banners', gather: 'two open supply trucks loaded with crates, green pennant', return: 'a tired short column of two vehicles with a small white flag, heading home' };
  for (const k of Object.keys(MM)) add('march', { key: `mapmarch_${k}`, name: `Map march: ${k}`, size: '1:1, 1024 x 1024', transparent: true, out: 256, prompt: make(`A small game unit sprite for a world map: ${MM[k]}. High three-quarter overhead view, facing right, compact, readable at 64 pixels, soft ground shadow, only the sprite`, STYLE_GEN, BG_T) });
  ICOADD('march', 'march_target', 'March target marker', 'a glowing red target reticle ring on the ground with four small corner ticks', 256);
  add('march', { key: 'march_dust', name: 'March dust puff', size: '1:1, 1024 x 1024', transparent: true, out: 128, prompt: make('A soft cartoon dust puff cloud, warm sand colour with lighter highlights, three rounded lobes, a little motion streak on the left. Front view, centred, only the puff', STYLE_GEN, BG_T) });

  G('quest', 'Quest tab art (22)', 'Four quest-list headers, ten quest category icons, four reward chests that grow with rank, and four small status pieces.');
  HEADADD('quest', 'questhead_main', 'Header: Main quest', 'A big commander campaign table with a huge rolled objective map, a brass compass and a glowing flag pin marking the goal');
  HEADADD('quest', 'questhead_daily', 'Header: Daily quests', 'A brass sun-dial and a wall calendar page on a clean steel wall with a small glowing checklist clipboard');
  HEADADD('quest', 'questhead_chapter', 'Header: Chapter quests', 'A stack of thick blue chapter books with brass corners and a bookmark ribbon, a glowing star above the top book');
  HEADADD('quest', 'questhead_event', 'Header: Event quests', 'A festive stage with bunting flags and a glowing prize crate under a spotlight');
  const QI = { build: 'a hammer over a small building', train: 'a soldier helmet with a plus', research: 'a glowing flask and a gear', gather: 'a supply crate with a pickaxe', battle: 'crossed swords over a shield', hunt: 'a snarling beast head', alliance: 'a shield with clasped hands', hero: 'a helmeted commander bust with a star', forge: 'an anvil with a glowing ingot', social: 'a speech bubble with a heart' };
  for (const k of Object.keys(QI)) ICOADD('quest', `quest_${k}`, `Quest: ${k}`, QI[k]);
  const QC = ['a plain wooden supply chest with iron straps', 'a bronze-bound chest with a small glowing star', 'a silver-bound chest with a glowing blue gem in the lock and light leaking from the lid', 'a golden chest overflowing with light, diamonds and a floating crown'];
  QC.forEach((d, i) => add('quest', { key: `quest_chest_${i + 1}`, name: `Quest chest ${i + 1}`, size: '1:1, 1024 x 1024', transparent: true, out: 256, prompt: make(`A reward chest: ${d}. Size and richness ${i + 1} of 4, each clearly grander than the last. Front three-quarter view, centred, only the chest`, STYLE_GEN, BG_T) }));
  ICOADD('quest', 'quest_scroll', 'Quest scroll', 'a rolled parchment scroll with a red wax seal and a thin gold ribbon', 128);
  ICOADD('quest', 'quest_done', 'Quest done stamp', 'a round green check-mark stamp with a thin brass ring', 128);
  ICOADD('quest', 'quest_star', 'Quest star', 'a chunky glossy gold five-pointed star', 128);
  ICOADD('quest', 'quest_lock', 'Quest locked', 'a closed steel padlock with a small chain', 128);

  G('city', 'City backdrop, ground and decor (34)', 'Replaces the flat dark background and square street grid: three full-screen backdrops, a horizon strip, three organic ground islands, three plot pads, six construction-site pieces (scaffold wrap, crane, hanging load, beacon, sparks, dust) that the game animates over a plot being built, four winding road pieces and fourteen scenery pieces that make the base feel like one place.');
  const FLAT = 'Flat like a painted decal lying on the ground: NO raised border, NO wall, NO fence, NO kerb standing up, NO thick slab, NO visible side thickness or underside, NO frame, NO rounded-rectangle card, NO rim. The top surface is the only thing visible, and at its edge it just stops (or fades a few pixels) straight into the flat magenta background.';
  const BK = ['a frontier outpost surroundings: dry sandy terrain in warm beige, sparse low green scrub, a handful of small smooth boulders, faint wind-blown dune ripples, and a thin band of pale sky and distant low hills only in the top 8 percent of the frame', 'a maturing base surroundings: soft mixed meadow grass and packed light earth, three small tree groves near the left and right edges, one narrow winding dirt track, a shallow pale-blue river only in the top 15 percent, and low rolling hills under a soft sky above it', 'a lush metropolis surroundings: rich green grass and forest edges down both sides, a wide pale paved boulevard fading up into the distance in the top 20 percent, a faint skyline of slim towers on the horizon line and a bright hazy sky above it'];
  BK.forEach((d, i) => add('city', { key: `city_backdrop_${i + 1}`, name: `City backdrop ${i + 1}`, size: '9:16, 1080 x 1920', transparent: false, out: 1600, prompt: make(`A full-screen portrait background of open terrain seen from above, for a base-building game: ${d}. Camera looks down at about 55 degrees onto the ground, so the terrain fills almost the whole frame and only a thin sky/horizon strip shows at the very top. The middle 60 percent of the image is calm, even, low-contrast ground with no objects at all, because buildings are drawn on top of it. Scenery, rocks and trees appear only in the outer 20 percent along the left, right and bottom edges. Painted, soft and clean, with gentle colour variation and no strong shadows in the middle. Absolutely NO buildings, NO roads in the middle, NO houses, NO vehicles, NO people, NO text, NO grid lines, NO tiles, NO frame or border, NO phone or screenshot chrome`, STYLE_GEN, BG_O) }));
  add('city', { key: 'city_horizon', name: 'City horizon strip', size: '16:5, 1600 x 500', transparent: false, out: 800, prompt: make('A wide, flat horizon panorama seen straight on at eye level, in three horizontal bands from top to bottom. Top band (top 40 percent): a warm pale cream sky with three soft flat clouds. Middle band (next 30 percent): two overlapping layers of soft pale-blue rolling hills, and nothing standing on or in front of the hills: the hills are smooth bare shapes only. Bottom band (bottom 30 percent): plain flat warm sand colour (#E8D9B8), completely empty, with a soft fade from the hills into it. STRICTLY NOTHING ELSE: NO crates, NO machines, NO buildings or towers or antennas of any size, far or near, NO vehicles, NO roads, NO fences, NO objects of any kind in front of the hills, NO wedge, triangle, dark corner, vignette or shadow anywhere (all four corners as light as the rest), NO sun disc, NO birds. Every layer runs the full width of the image and is symmetrical enough to tile sideways. Wide banner, 16:5, the picture runs to every edge with no frame, no border and no trim', STYLE_GEN, BG_O) });
  const GI = {
    inner: 'a large natural-looking patch of ground for the inner command compound. Surface: smooth pale warm-grey concrete, a few hairline expansion joints and two faint painted light-blue guide lines. NO grass, NO plants, NO stones on it',
    res: 'a large natural-looking patch of ground for the resource district. Surface: packed warm sand-coloured earth with a few soft curved tyre tracks and tiny scattered pebbles. Two or three small grass tufts allowed only right at the edge',
    outer: 'a large natural-looking patch of ground for the outer ring. Surface: cracked pale grey asphalt with a few small weeds pushing through the cracks and a little light rubble. No sandbags, no walls'
  };
  for (const k of Object.keys(GI)) add('city', { key: `city_ground_${k}`, name: `City ground: ${k}`, size: '1:1, 1024 x 1024', transparent: true, out: 512, prompt: make(`${GI[k]}. Shape: ONE wobbly organic blob, like a hand-drawn island or a puddle, about 30 percent wider than tall, with soft irregular rounded lobes and shallow bays, NOT a square, NOT a diamond, NOT a symmetrical clover or plus shape, NOT a circle, no straight edges, no corners. The blob fills about 90 percent of the frame width. Seen from a high overhead camera (about 60 degrees down) so the surface is clearly visible. ${FLAT} The edge is a soft irregular natural edge where the surface simply ends. No buildings, no objects, no fence, no text`, STYLE_GEN, BG_T) });
  const PD = {
    empty: 'an empty building plot pad: one flat square slab of pale warm-grey concrete, 92 percent of the diamond width. The slab is very thin. A thin brass L-shaped corner marker is painted flat at each of the four corners and a small faint plus sign is painted in the exact centre. Completely empty otherwise',
    build: 'a building plot that is a whole construction site: the same flat square concrete slab, but now the entire square is a working site. Along ALL FOUR edges runs a low continuous safety barrier of orange-and-white striped panels with a small amber warning lamp on a post at each of the four corners. The slab surface has faint yellow-and-black hazard stripes painted along the inside of the barrier. Near the two back edges lie neat stacks of pale planks, a pile of grey steel beams and a few closed orange paint drums. The centre of the slab, about 45 percent of the width, is left as a clean flat bare foundation area with a few short steel rebar stubs sticking up at its corners, because a building is drawn on top of it. NO building, NO scaffold, NO crane in this image (those are separate images)',
    locked: 'a locked building plot: the same flat square concrete slab, cracked in two places with a little light rubble and tiny weeds on one half only, and a small red padlock sign on a short grey post near the back corner. NO fence, NO wall around the slab'
  };
  for (const k of Object.keys(PD)) add('city', { key: `city_pad_${k}`, name: `City pad: ${k}`, size: '1:1, 1024 x 1024', transparent: true, out: 256, prompt: make(`${PD[k]}. Shape: a perfect square with sharp corners viewed at an isometric angle, so it reads as a flat diamond (rhombus) about twice as wide as tall, centred, filling the frame width with a small margin, all four edges straight. ${FLAT} The slab is drawn as a thin flat plate with at most a hair-thin lighter edge line on its top surface; it must NOT look like a box, tray or raised platform. High overhead camera (about 45 degrees down)`, STYLE_GEN, BG_T) });
  const CB = 'Camera: the same high isometric three-quarter overhead camera as the plot pads (about 45 degrees down, front-left corner facing the viewer). ';
  const CBADD = (key, name, size, out, subj) => add('city', { key, name, size, transparent: true, out, prompt: make(`${subj}. ${CB}Centred with nothing else in the image, standing directly on the magenta background: NO ground, NO slab, NO base plate, NO diamond tile under it, NO text. Sharp clean shapes with a soft neutral shadow only directly beside it`, STYLE_GEN, BG_T) });
  CBADD('city_build_scaffold', 'Build: scaffold wrap', '1:1, 1024 x 1024', 384, 'An open steel scaffold cage that wraps around an empty square building footprint: four straight faces of pale grey metal scaffolding, three levels tall with wooden walkway planks on each level, diagonal cross braces, ladders on one face, and partial green safety netting hung on only about a third of the faces so most of the frame stays see-through. The cage is exactly a square in plan (a diamond in this view), about 75 percent of the frame width, and its inside is completely empty and open so a building can be seen through it');
  CBADD('city_build_crane', 'Build: tower crane', '1:1, 1024 x 1024', 384, 'A single small tower crane: one slim square lattice mast in yellow-orange steel on a small square concrete footing, a horizontal jib arm reaching to the right with a counterweight block on the short left end, a tiny operator cab under the jib, and a thin cable with an EMPTY hook hanging from the jib about a third of the way along. Tall and narrow, filling about 90 percent of the frame height');
  CBADD('city_build_load', 'Build: hanging load', '1:1, 1024 x 1024', 192, 'A bundle of steel beams strapped together with two orange lifting slings meeting at a single hook, hanging from a short straight cable going straight up out of the top of the image, the bundle in the lower half and perfectly level');
  CBADD('city_build_beacon', 'Build: warning beacon', '1:1, 1024 x 1024', 96, 'A small round amber rotating warning beacon glowing brightly on top of a short grey post with a small square base, the light visibly lit with a soft warm glow and a few short light rays');
  CBADD('city_build_sparks', 'Build: weld sparks', '1:1, 1024 x 1024', 128, 'A single burst of bright welding sparks: a small white-hot core with about twenty thin yellow-orange spark streaks flying outwards in all directions, each streak with a fading tail, on the plain background with no tool and no metal');
  CBADD('city_build_dust', 'Build: dust puff', '1:1, 1024 x 1024', 128, 'A single soft round puff of pale sand-coloured construction dust: a rounded cloud of three overlapping lobes with soft feathered edges, semi-transparent looking, no debris, no ground');
  const RDC = 'Shape: the tile is a perfect flat diamond (isometric square, twice as wide as tall) that fills the frame width. The whole tile surface is plain warm sand-coloured ground, and the road is painted onto it. Road surface: smooth mid-grey asphalt, about one quarter of the tile width across, with a dashed white centre line. Road edges have only a thin painted pale line flush with the surface, NOT raised kerbs. The road always meets the tile edge exactly at the MIDDLE of that edge, so neighbouring tiles line up. Only tiny sand-coloured pebbles allowed beside the road: NO grass, NO bushes, NO trees, NO lights, NO markers, NO vehicles, NO text';
  const RD = {
    straight: 'A straight road tile: the road runs perfectly straight from the middle of the upper-left edge to the middle of the lower-right edge of the diamond, parallel to the diamond sides, no bend',
    curve: 'A curved road tile: the road enters at the middle of the upper-left edge and leaves at the middle of the upper-right edge, following one smooth quarter-circle arc whose curve is clearly visible, the dashed centre line following the same arc. The outside corner of the arc bulges towards the bottom of the tile',
    junction: 'A three-way T-junction tile: roads enter at the middle of the upper-left, upper-right and lower-right edges and meet in the centre in a small plain grey square with no island, no roundabout, dashed lines stopping short of the junction. The lower-left edge has no road',
    end: 'A dead-end road tile: the road enters at the middle of the upper-left edge, runs to the centre and ends in a small round grey turning circle with a single small red-and-white barrier post at the end. The other three edges have no road'
  };
  for (const k of Object.keys(RD)) add('city', { key: `city_road_${k}`, name: `City road: ${k}`, size: '1:1, 1024 x 1024', transparent: true, out: 256, prompt: make(`${RD[k]}. ${RDC}. ${FLAT} High overhead camera (about 45 degrees down)`, STYLE_GEN, BG_T) });
  const DC = { tree_1: 'a single round leafy green tree with a short brown trunk', tree_2: 'a single tall slim green pine tree', tree_3: 'a small cluster of exactly three young green trees close together', rock_1: 'a single mid-size smooth grey boulder with a little moss on top', rock_2: 'a cluster of exactly four small grey rocks of different sizes', fence: 'a short straight section of light steel mesh fence, two posts and four panels', lamp: 'a single tall slim street lamp with a soft warm glow', sandbag: 'a small neat wall of stacked sandbags, two rows high, about six bags long', crates: 'a neat stack of three pale wooden supply crates, two on the bottom and one on top', water: 'a small steel water tower: a round tank on four slim legs', barrel: 'two safety-orange fuel barrels standing side by side', flag: 'a single tall flagpole with a plain blue banner with no symbol', pond: 'a small round pond of clear blue water with a few reeds at the edge', bush: 'a single low round green bush with a few small white flowers' };
  for (const k of Object.keys(DC)) add('city', { key: `city_deco_${k}`, name: `City decor: ${k.replace('_', ' ')}`, size: '1:1, 1024 x 1024', transparent: true, out: 256, prompt: make(`A single piece of scenery for a base-building game: ${DC[k]}. The object fills about 70 percent of the frame, centred, with only a small soft shadow directly under it on the right. NO ground slab, NO base plate, NO grass patch, NO pad, NO diamond, NO tile under it: the object stands directly on the flat magenta background. Only this one object, nothing else. Camera: three-quarter overhead about 40 degrees down`, STYLE_GEN, BG_T) });

  return { style: { style: STYLE, camera: CAM, transparent: BG_T, opaque: BG_O, pad: PAD }, groups, items };
}

function write() {
  const c = build();
  fs.writeFileSync(path.join(root, 'assets/catalog.json'), JSON.stringify({ v: 2, count: c.items.length, groups: c.groups, items: c.items.map(({ prompt, ...r }) => r) }, null, 1) + '\n');
  console.log(c.items.length + ' assets in ' + c.groups.length + ' groups');
}
module.exports = { build };
if (require.main === module) write();
