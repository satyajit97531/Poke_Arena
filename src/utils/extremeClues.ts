import { Pokemon } from '../types/pokemon';

export interface ExtremeClueData {
  bodyColor: string;
  hasWings: string;
  bodyStance: string;
  hasTail: string;
  weightClass: string;
  heightClass: string;
  habitatClue: string;
}

const WINGED_NAMES = new Set([
  'charizard', 'butterfree', 'beedrill', 'pidgeot', 'fearow', 'zubat', 'golbat', 'crobat',
  'farfetchd', 'dodrio', 'aerodactyl', 'articuno', 'zapdos', 'moltres', 'dragonite', 'mew',
  'noctowl', 'ledian', 'crobat', 'togetic', 'togekiss', 'xatu', 'yanma', 'yanmega', 'skarmory',
  'lugia', 'ho-oh', 'beautifly', 'dustox', 'swellow', 'pelipper', 'ninjask', 'vibrava', 'flygon',
  'altaria', 'tropius', 'salamence', 'latias', 'latios', 'rayquaza', 'staraptor', 'mothim',
  'vespiquen', 'drifblim', 'honchkrow', 'chatot', 'gliscor', 'archeops', 'swanna', 'sigilyph',
  'braviary', 'mandibuzz', 'hydreigon', 'volcarona', 'tornadus', 'thundurus', 'reshiram', 'zekrom',
  'talonflame', 'vivillon', 'hawlucha', 'noivern', 'yveltal', 'decidueye', 'toucannon', 'oricorio',
  'vikavolt', 'celesteela', 'naganadel', 'corviknight', 'frosmoth', 'dragapult', 'iron-jugulis',
  'roaring-moon', 'kilowattrel', 'flamigo', 'bombirdier'
]);

const QUADRUPED_NAMES = new Set([
  'bulbasaur', 'ivysaur', 'venusaur', 'rattata', 'raticate', 'nidoran-f', 'nidoran-m', 'vulpix',
  'ninetales', 'growlithe', 'arcanine', 'ponyta', 'rapidash', 'tauros', 'eevee', 'vaporeon',
  'jolteon', 'flareon', 'espeon', 'umbreon', 'leafeon', 'glaceon', 'sylveon', 'meganium', 'cyndaquil',
  'houndour', 'houndoom', 'raikou', 'entei', 'suicune', 'miltank', 'poochyena', 'mightyena', 'electrike',
  'manectric', 'camerupt', 'torkoal', 'absol', 'torterra', 'shinx', 'luxray', 'hippowdon', 'glaceon',
  'mamoswine', 'terrakion', 'virizion', 'cobalion', 'keldeo', 'mudsdale', 'dubwool', 'yamper', 'boltund',
  'zacian', 'zamazenta', 'glastrier', 'spectrier', 'mabosstiff', 'dachsbun', 'koraidon', 'ting-lu'
]);

const TAILLESS_NAMES = new Set([
  'butterfree', 'beedrill', 'geodude', 'graveler', 'golem', 'magnemite', 'magneton', 'magnezone',
  'hitmonlee', 'hitmonchan', 'koffing', 'weezing', 'jynx', 'electabuzz', 'magmar', 'pinsir',
  'claydol', 'metagross', 'regirock', 'regice', 'registeel', 'spiritomb', 'bronzong', 'rotom',
  'klinklang', 'chandelure', 'cryogonal', 'genesect', 'chesnaught', 'carbink', 'diancie', 'hoopa',
  'oricorio', 'wishiwashi', 'minior', 'dhelmise', 'nihilego', 'xurkitree', 'guzzlord', 'stakataka',
  'blacephalon', 'polteageist', 'falinks', 'pincurchin', 'stonjourner', 'iron-hands', 'gholdengo'
]);

export function getExtremeClues(pokemon: Pokemon): ExtremeClueData {
  const normName = pokemon.name.toLowerCase();

  // 1. Body Color Determination
  let bodyColor = 'Neutral Multi-Tone';
  const primaryType = pokemon.types[0];

  switch (primaryType) {
    case 'fire':
      bodyColor = 'Flame Crimson & Fiery Orange';
      break;
    case 'water':
      bodyColor = 'Deep Ocean Blue & Aqua';
      break;
    case 'grass':
      bodyColor = 'Emerald Flora Green';
      break;
    case 'electric':
      bodyColor = 'Bright Voltage Yellow';
      break;
    case 'psychic':
      bodyColor = 'Mystic Magenta & Lavender';
      break;
    case 'ghost':
      bodyColor = 'Spectral Violet & Shadow Indigo';
      break;
    case 'dark':
      bodyColor = 'Midnight Obsidian Black & Slate';
      break;
    case 'dragon':
      bodyColor = 'Royal Azure & Dragon Scale Hues';
      break;
    case 'steel':
      bodyColor = 'Hardened Metallic Silver & Iron Gray';
      break;
    case 'poison':
      bodyColor = 'Toxic Purple & Venom Violet';
      break;
    case 'ice':
      bodyColor = 'Glacial Crystal Blue & Frost White';
      break;
    case 'ground':
      bodyColor = 'Terra Cotta Brown & Sand Gold';
      break;
    case 'rock':
      bodyColor = 'Granite Gray & Earth Stone';
      break;
    case 'bug':
      bodyColor = 'Forest Chitin Green & Amber';
      break;
    case 'fighting':
      bodyColor = 'Brawny Ochre & Russet Tan';
      break;
    case 'fairy':
      bodyColor = 'Ethereal Pastel Pink & Pearl';
      break;
    case 'normal':
      bodyColor = 'Warm Beige & Earth Brown';
      break;
    default:
      bodyColor = 'Prismatic Multi-Hue';
  }

  // 2. Wings Check
  const hasWings =
    pokemon.types.includes('flying') || WINGED_NAMES.has(normName)
      ? 'Yes (Winged Form)'
      : 'No (Wingless)';

  // 3. Body Stance
  let bodyStance = 'Two-Legged (Bipedal)';
  if (QUADRUPED_NAMES.has(normName)) {
    bodyStance = 'Four-Legged (Quadruped)';
  } else if (pokemon.types.includes('flying') && !pokemon.types.includes('fighting')) {
    bodyStance = 'Avian / Airborne';
  } else if (pokemon.types.includes('water') && (normName.includes('fish') || normName.includes('eel') || normName.includes('whale') || normName.includes('seal') || normName.includes('shark'))) {
    bodyStance = 'Aquatic / Swimming';
  }

  // 4. Tail Check
  const hasTail = TAILLESS_NAMES.has(normName) ? 'No Visible Tail' : 'Has Prominent Tail';

  // 5. Weight Class
  let weightClass = 'Medium Weight (30 - 100 kg)';
  if (pokemon.weight < 25) {
    weightClass = 'Lightweight (< 25 kg)';
  } else if (pokemon.weight > 100) {
    weightClass = 'Heavyweight Titan (> 100 kg)';
  }

  // 6. Height Class
  let heightClass = 'Medium Stature (1.0 - 2.0 m)';
  if (pokemon.height < 1.0) {
    heightClass = 'Compact (< 1.0 m)';
  } else if (pokemon.height > 2.0) {
    heightClass = 'Towering / Colossal (> 2.0 m)';
  }

  // 7. Habitat / Nature
  let habitatClue = 'Wanders wild biomes';
  if (pokemon.isLegendary || pokemon.isMythical) {
    habitatClue = 'Mythical sanctuaries & sacred peaks';
  } else if (pokemon.types.includes('water')) {
    habitatClue = 'Lakes, oceans, or river currents';
  } else if (pokemon.types.includes('fire') || pokemon.types.includes('rock') || pokemon.types.includes('ground')) {
    habitatClue = 'Volcanic crags, caves, or scorched badlands';
  } else if (pokemon.types.includes('grass') || pokemon.types.includes('bug')) {
    habitatClue = 'Canopy forests, meadows, and jungles';
  } else if (pokemon.types.includes('ghost') || pokemon.types.includes('dark')) {
    habitatClue = 'Eerie ruins, shadowed towers, and nightfall';
  } else if (pokemon.types.includes('electric') || pokemon.types.includes('steel')) {
    habitatClue = 'Power stations, magnetic ravines, and industrial peaks';
  }

  return {
    bodyColor,
    hasWings,
    bodyStance,
    hasTail,
    weightClass,
    heightClass,
    habitatClue,
  };
}
