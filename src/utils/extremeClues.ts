import { Pokemon } from '../types/pokemon';
import pokemonEvolutionStages from '../data/pokemonEvolutionStages.json';

const stagesMap: Record<string, string> = pokemonEvolutionStages as Record<string, string>;

export interface ExtremeClueData {
  bodyColor: string;
  hasWings: string;
  bodyStance: string;
  hasTail: string;
  weightClass: string;
  heightClass: string;
  habitatClue: string;
}

// Canonical physical overrides for accurate clue matching
const EXACT_POKEMON_TRAITS: Record<
  string,
  {
    color: string;
    wings: boolean;
    stance: 'Bipedal' | 'Quadruped' | 'Avian / Airborne' | 'Aquatic / Serpentine' | 'Floating / Levitation';
    tail: boolean;
  }
> = {
  // Gen 1
  bulbasaur: { color: 'Teal Green with Dark Green Spots', wings: false, stance: 'Quadruped', tail: false },
  ivysaur: { color: 'Blue-Green with Pink Bud', wings: false, stance: 'Quadruped', tail: false },
  venusaur: { color: 'Teal Blue-Green with Giant Pink Flower', wings: false, stance: 'Quadruped', tail: false },
  charmander: { color: 'Warm Coral Orange & Pale Cream', wings: false, stance: 'Bipedal', tail: true },
  charmeleon: { color: 'Deep Flame Crimson Red', wings: false, stance: 'Bipedal', tail: true },
  charizard: { color: 'Bright Fiery Orange & Cerulean Wing Membrane', wings: true, stance: 'Bipedal', tail: true },
  squirtle: { color: 'Light Sky Blue & Brown Shell', wings: false, stance: 'Bipedal', tail: true },
  wartortle: { color: 'Indigo Blue with Fluffy White Ears & Tail', wings: false, stance: 'Bipedal', tail: true },
  blastoise: { color: 'Cobalt Blue with Brown Shell & Silver Cannons', wings: false, stance: 'Bipedal', tail: true },
  pikachu: { color: 'Vibrant Electric Yellow with Brown Back Stripes', wings: false, stance: 'Bipedal', tail: true },
  raichu: { color: 'Rich Orange-Bronze & White Belly', wings: false, stance: 'Bipedal', tail: true },
  butterfree: { color: 'Purple Body with White Wings & Cyan Accents', wings: true, stance: 'Avian / Airborne', tail: false },
  beedrill: { color: 'Yellow & Black Striped Body with Silver Stingers', wings: true, stance: 'Avian / Airborne', tail: false },
  pidgeot: { color: 'Warm Brown, Cream & Crimson Feather Crest', wings: true, stance: 'Avian / Airborne', tail: true },
  psyduck: { color: 'Bright Daffodil Yellow with Pale Cream Bill', wings: false, stance: 'Bipedal', tail: true },
  golduck: { color: 'Deep Cerulean Blue with Red Forehead Gem', wings: false, stance: 'Bipedal', tail: true },
  arcanine: { color: 'Fiery Orange with Black Tiger Stripes & Sandy Mane', wings: false, stance: 'Quadruped', tail: true },
  alakazam: { color: 'Golden Yellow with Brown Armor & Silver Spoons', wings: false, stance: 'Bipedal', tail: false },
  machamp: { color: 'Slate Gray-Blue with Golden Belt', wings: false, stance: 'Bipedal', tail: false },
  gengar: { color: 'Deep Shadow Purple with Crimson Red Eyes', wings: false, stance: 'Bipedal', tail: true },
  gyarados: { color: 'Cobalt Ocean Blue & Pale Cream Underbelly', wings: false, stance: 'Aquatic / Serpentine', tail: true },
  magikarp: { color: 'Bright Flame Orange with Golden Crown Fin', wings: false, stance: 'Aquatic / Serpentine', tail: true },
  lapras: { color: 'Light Sky Blue with Gray Spiked Shell', wings: false, stance: 'Aquatic / Serpentine', tail: true },
  eevee: { color: 'Chestnut Brown with Fluffy Cream Neck Ruff', wings: false, stance: 'Quadruped', tail: true },
  vaporeon: { color: 'Aquatic Sky Blue with White Neck Fin', wings: false, stance: 'Quadruped', tail: true },
  jolteon: { color: 'Bright Voltage Yellow with Spiky White Collar', wings: false, stance: 'Quadruped', tail: false },
  flareon: { color: 'Flame Orange with Plentiful Cream Fur Collar', wings: false, stance: 'Quadruped', tail: true },
  snorlax: { color: 'Dark Navy Blue-Teal with Cream Face & Belly', wings: false, stance: 'Bipedal', tail: false },
  articuno: { color: 'Icy Sky Blue with Long Streaming Cyan Tail', wings: true, stance: 'Avian / Airborne', tail: true },
  zapdos: { color: 'Electric Spiky Yellow & Stark Black Feathers', wings: true, stance: 'Avian / Airborne', tail: true },
  moltres: { color: 'Golden Amber Body with Blazing Fiery Wings', wings: true, stance: 'Avian / Airborne', tail: true },
  dragonite: { color: 'Rich Golden Amber Orange with Teal Wing Undersides', wings: true, stance: 'Bipedal', tail: true },
  mewtwo: { color: 'Pale Silver-Lilac with Deep Purple Tail & Abdomen', wings: false, stance: 'Bipedal', tail: true },
  mew: { color: 'Soft Powder Pink with Azure Blue Eyes', wings: false, stance: 'Bipedal', tail: true },

  // Gen 2
  typhlosion: { color: 'Dark Navy Blue Back with Cream Front & Flame Collar', wings: false, stance: 'Bipedal', tail: false },
  ampharos: { color: 'Bright Light Yellow with Black Bands & Red Orbs', wings: false, stance: 'Bipedal', tail: true },
  espeon: { color: 'Mystic Lilac Lavender with Ruby Forehead Gem', wings: false, stance: 'Quadruped', tail: true },
  umbreon: { color: 'Midnight Obsidian Black with Glowing Yellow Rings', wings: false, stance: 'Quadruped', tail: true },
  scizor: { color: 'Metallic Crimson Red with Black Neck Accents', wings: true, stance: 'Bipedal', tail: false },
  scyther: { color: 'Emerald Green with Cream Scythe Blades', wings: true, stance: 'Bipedal', tail: false },
  heracross: { color: 'Deep Indigo Blue Chitin with Sturdy Horn', wings: true, stance: 'Bipedal', tail: false },
  tyranitar: { color: 'Armor Olive Green with Charcoal Core Diamond', wings: false, stance: 'Bipedal', tail: true },
  lugia: { color: 'Silvery Pearl White with Deep Navy Blue Fins', wings: true, stance: 'Avian / Airborne', tail: true },
  'ho-oh': { color: 'Rainbow Gold, Crimson Red, Emerald Green & White', wings: true, stance: 'Avian / Airborne', tail: true },
  suicune: { color: 'Sky Blue with Lavender Crystal Mane & White Ribbons', wings: false, stance: 'Quadruped', tail: true },
  raikou: { color: 'Electric Yellow with Black Stripes & Purple Rain Cloud', wings: false, stance: 'Quadruped', tail: true },
  entei: { color: 'Earth Brown with Red/Yellow Faceplate & Gray Cloud', wings: false, stance: 'Quadruped', tail: true },
  celebi: { color: 'Forest Fairy Green with Blue Antenna Tips', wings: true, stance: 'Floating / Levitation', tail: false },

  // Gen 3
  sceptile: { color: 'Forest Grass Green with Red Underbelly & Bushy Tail', wings: false, stance: 'Bipedal', tail: true },
  blaziken: { color: 'Ochre Red & Cream with Fiery Ankle Feathers', wings: false, stance: 'Bipedal', tail: false },
  swampert: { color: 'Cobalt Mud Blue with Orange Gills & Black Fins', wings: false, stance: 'Quadruped', tail: true },
  gardevoir: { color: 'White Dress Body with Emerald Green Hair & Red Horn', wings: false, stance: 'Bipedal', tail: false },
  flygon: { color: 'Desert Jade Green with Red Lens Goggles', wings: true, stance: 'Bipedal', tail: true },
  milotic: { color: 'Cream Body with Iridescent Pink & Cyan Tail Scale Ribbons', wings: false, stance: 'Aquatic / Serpentine', tail: true },
  salamence: { color: 'Sky Azure Blue with Crimson Crescent Wings', wings: true, stance: 'Quadruped', tail: true },
  metagross: { color: 'Iron Turquoise Blue with Silver Chrome X-Face', wings: false, stance: 'Quadruped', tail: false },
  kyogre: { color: 'Deep Ocean Trench Blue with Red Rune Patterns', wings: false, stance: 'Aquatic / Serpentine', tail: true },
  groudon: { color: 'Magma Crimson Red with Black Tectonic Lines', wings: false, stance: 'Bipedal', tail: true },
  rayquaza: { color: 'Radiant Jade Emerald Green with Golden Glyphs', wings: false, stance: 'Avian / Airborne', tail: true },

  // Gen 4
  torterra: { color: 'Earth Brown & Leaf Green with Bonsai Oak Tree', wings: false, stance: 'Quadruped', tail: true },
  infernape: { color: 'Warm Chestnut Brown & White with Crown Flame', wings: false, stance: 'Bipedal', tail: true },
  empoleon: { color: 'Midnight Navy Blue & Charcoal with Golden Trident', wings: true, stance: 'Bipedal', tail: true },
  luxray: { color: 'Jet Black & Electric Blue with Gold Star Tail', wings: false, stance: 'Quadruped', tail: true },
  lucario: { color: 'Cobalt Steel Blue & Jet Black with Golden Torso', wings: false, stance: 'Bipedal', tail: true },
  garchomp: { color: 'Navy Blue & Dark Slate with Crimson/Gold Underbelly', wings: true, stance: 'Bipedal', tail: true },
  togekiss: { color: 'Pure Cloud White with Red & Blue Triangle Spots', wings: true, stance: 'Avian / Airborne', tail: true },
  dialga: { color: 'Deep Metallic Cobalt Blue with Diamond Silver Armor', wings: false, stance: 'Quadruped', tail: true },
  palkia: { color: 'Lustrous Pearl White with Lavender Purple Accents', wings: true, stance: 'Bipedal', tail: true },
  giratina: { color: 'Ghostly Platinum Gray, Gold Collar & Crimson Ribbons', wings: true, stance: 'Floating / Levitation', tail: true },
  darkrai: { color: 'Pitch Obsidian Black with White Ghostly Plume & Red Collar', wings: false, stance: 'Floating / Levitation', tail: false },
  arceus: { color: 'Pure Divine Celestial White with Golden Wheel of Creation', wings: false, stance: 'Quadruped', tail: true },

  // Gen 5
  serperior: { color: 'Regal Emerald Green & Pale Gold Collar', wings: false, stance: 'Aquatic / Serpentine', tail: true },
  chandelure: { color: 'Glass Indigo Blue & Black with Purple Spirit Flames', wings: false, stance: 'Floating / Levitation', tail: false },
  haxorus: { color: 'Armor Olive Gold with Crimson Axe Tusks', wings: false, stance: 'Bipedal', tail: true },
  hydreigon: { color: 'Dark Indigo & Black with Six Purple Wing Flaps', wings: true, stance: 'Avian / Airborne', tail: true },
  volcarona: { color: 'White Fluffy Body & Cyan Eyes with Six Fiery Orange Wings', wings: true, stance: 'Avian / Airborne', tail: false },
  reshiram: { color: 'Pure Pristine Snow White with Turbine Tail Engine', wings: true, stance: 'Bipedal', tail: true },
  zekrom: { color: 'Deep Matte Jet Black with Electric Generator Tail', wings: true, stance: 'Bipedal', tail: true },

  // Gen 6
  greninja: { color: 'Dark Shinobi Blue with Pink Tongue Scarf', wings: false, stance: 'Bipedal', tail: false },
  talonflame: { color: 'Ember Orange & Black with Yellow Flame Beak', wings: true, stance: 'Avian / Airborne', tail: true },
  aegislash: { color: 'Golden Bronze Sword & Shield with Violet Spirit Ribbon', wings: false, stance: 'Floating / Levitation', tail: false },
  sylveon: { color: 'Pastel Pink & Cream White with Blue Ribbon Bows', wings: false, stance: 'Quadruped', tail: true },
  xerneas: { color: 'Midnight Blue & Black with Rainbow Iridescent Antlers', wings: false, stance: 'Quadruped', tail: true },
  yveltal: { color: 'Destruction Crimson Red with Black Veins & Claws', wings: true, stance: 'Avian / Airborne', tail: true },

  // Gen 7
  decidueye: { color: 'Forest Brown & Leaf Green with Feather Arrow Quiver', wings: true, stance: 'Bipedal', tail: true },
  incineroar: { color: 'Tiger Crimson Red & Black with Fiery Flame Belt', wings: false, stance: 'Bipedal', tail: true },
  mimikyu: { color: 'Pale Rag Beige with Inky Scribble Face', wings: false, stance: 'Bipedal', tail: true },
  solgaleo: { color: 'Solar Radiant White with Golden Sunburst Mane', wings: false, stance: 'Quadruped', tail: true },
  lunala: { color: 'Lunar Deep Violet & Gold with Crescent Wings', wings: true, stance: 'Avian / Airborne', tail: true },

  // Gen 8
  cinderace: { color: 'Athletic Pure White & Flame Orange with Navy Pants', wings: false, stance: 'Bipedal', tail: true },
  corviknight: { color: 'Hardened Glossy Raven Black & Metallic Steel', wings: true, stance: 'Avian / Airborne', tail: true },
  toxtricity: { color: 'Punk Rocker Violet & Electric Yellow Chest', wings: false, stance: 'Bipedal', tail: true },
  dragapult: { color: 'Stealth Bomber Dark Teal & Yellow Underbelly', wings: false, stance: 'Avian / Airborne', tail: true },
  zacian: { color: 'Cyan Blue with Crimson Braids & Golden Ancient Sword', wings: false, stance: 'Quadruped', tail: true },
  zamazenta: { color: 'Magenta Red with Navy Mane & Golden Crown Shield', wings: false, stance: 'Quadruped', tail: true },

  // Gen 9 & Hisui
  tinkaton: { color: 'Baby Pastel Pink with Colossal Silver-Gray Steel Hammer', wings: false, stance: 'Bipedal', tail: false },
  ceruledge: { color: 'Midnight Indigo Armor with Cyan Spectral Blade Flames', wings: false, stance: 'Bipedal', tail: false },
  armarouge: { color: 'Golden Armor & Fire Crimson Red with Pauldrons', wings: false, stance: 'Bipedal', tail: false },
  baxcalibur: { color: 'Arctic Glacial Gray with Cybernetic Dorsal Ice Axe', wings: false, stance: 'Bipedal', tail: true },
  koraidon: { color: 'Ancient Scarlet Crimson, White Feathers & Blue Plumes', wings: false, stance: 'Quadruped', tail: true },
  miraidon: { color: 'Futuristic Metallic Violet, Neon Cyan & Jet Engines', wings: false, stance: 'Quadruped', tail: true },

  // Hisui
  ursaluna: { color: 'Dark Peat Bog Brown with Full-Moon Golden Forehead', wings: false, stance: 'Quadruped', tail: true },
  kleavor: { color: 'Flint Stone Gray & Wood Timber Brown with Obsidian Stone Axes', wings: true, stance: 'Bipedal', tail: false },
  overqwil: { color: 'Jet Black with Toxic Poison Needles & Sea Green Underbelly', wings: false, stance: 'Aquatic / Serpentine', tail: true },
  basculegion: { color: 'Deep River Jade Green with Crimson Spirit Ghost Souls', wings: false, stance: 'Aquatic / Serpentine', tail: true },
  sneasler: { color: 'Pale Lilac-Gray & Bright Cyan with Golden Feather Plume', wings: false, stance: 'Bipedal', tail: false },
  wyrdeer: { color: 'Pure Winter Snow White with Pale Slate Horn Orbs', wings: false, stance: 'Quadruped', tail: true },
  enamorus: { color: 'Spring Petal Pink & White Cloud Coil with Serpentine Crest', wings: true, stance: 'Floating / Levitation', tail: true },
};

export function getExtremeClues(pokemon: Pokemon): ExtremeClueData {
  const normName = pokemon.name.toLowerCase();
  const known = EXACT_POKEMON_TRAITS[normName];

  // 1. Body Color Determination
  let bodyColor = '';
  if (known) {
    bodyColor = known.color;
  } else {
    // Precise type-informed fallback when not explicitly in the map
    const primaryType = pokemon.types[0];
    switch (primaryType) {
      case 'fire':
        bodyColor = 'Flame Crimson & Fiery Orange';
        break;
      case 'water':
        bodyColor = 'Deep Ocean Blue & Aqua';
        break;
      case 'grass':
        bodyColor = 'Emerald Flora Green & Verdant Leaves';
        break;
      case 'electric':
        bodyColor = 'Bright Voltage Yellow & Golden Spark';
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
        // If bug also has steel or fire, avoid naive green
        if (pokemon.types.includes('steel')) {
          bodyColor = 'Hardened Metallic Crimson & Steel Plate';
        } else if (pokemon.types.includes('fire')) {
          bodyColor = 'White Chitin with Blazing Orange Wings';
        } else {
          bodyColor = 'Forest Chitin Green & Amber';
        }
        break;
      case 'fighting':
        bodyColor = 'Brawny Ochre & Russet Tan';
        break;
      case 'fairy':
        bodyColor = 'Ethereal Pastel Pink & Pearl White';
        break;
      case 'normal':
        bodyColor = 'Warm Beige & Earth Brown';
        break;
      default:
        bodyColor = 'Prismatic Multi-Hue';
    }
  }

  // 2. Wings Check
  let hasWings = 'No (Wingless)';
  if (known) {
    hasWings = known.wings ? 'Yes (Winged Form)' : 'No (Wingless)';
  } else if (pokemon.types.includes('flying')) {
    hasWings = 'Yes (Winged Form)';
  }

  // 3. Body Stance
  let bodyStance = 'Two-Legged (Bipedal)';
  if (known) {
    bodyStance = known.stance;
  } else if (pokemon.types.includes('flying')) {
    bodyStance = 'Avian / Airborne';
  }

  // 4. Tail Check
  let hasTail = 'Has Prominent Tail';
  if (known) {
    hasTail = known.tail ? 'Has Prominent Tail' : 'No Visible Tail';
  }

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
  } else if (pokemon.region === 'hisui') {
    habitatClue = 'Untamed ancient wilderness of prehistoric Sinnoh';
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

/**
 * Normal 1-line hint for Menacing difficulty.
 * Examples:
 * - Pikachu -> "Electric Mouse Pokémon"
 * - Piplup -> "A baby penguin Pokémon"
 */
export function getOneLinePokemonHint(pokemon: {
  id?: number;
  name?: string;
  displayName?: string;
  species?: string;
  types?: string[];
  flavorText?: string;
} | null | undefined): string {
  if (!pokemon) return 'A mysterious Pokémon';

  const rawName = (pokemon.name || pokemon.displayName || '').toLowerCase().trim();

  // Canonical examples requested by user
  if (rawName === 'pikachu') {
    return 'Electric Mouse Pokémon';
  }
  if (rawName === 'piplup') {
    return 'A baby penguin Pokémon';
  }

  const types = pokemon.types || [];
  const primaryType = types[0] ? types[0].charAt(0).toUpperCase() + types[0].slice(1).toLowerCase() : '';
  const secondaryType = types[1] ? types[1].charAt(0).toUpperCase() + types[1].slice(1).toLowerCase() : '';

  let species = (pokemon.species || '').trim();
  // Strip trailing "Pokémon" or "Pokemon" to avoid duplicate words
  species = species.replace(/\s*pok[eé]mon\s*$/i, '').trim();

  if (!species) {
    if (primaryType && secondaryType) {
      return `${primaryType} & ${secondaryType} type Pokémon`;
    }
    if (primaryType) {
      return `${primaryType} type Pokémon`;
    }
    return 'A mysterious Pokémon';
  }

  const lowerSpecies = species.toLowerCase();

  // If species already starts with or contains the primary type (e.g. Fire Mouse for Cyndaquil)
  if (primaryType && lowerSpecies.startsWith(primaryType.toLowerCase())) {
    return `${species} Pokémon`;
  }

  // Specific common animal types
  if (lowerSpecies === 'penguin') {
    return 'A penguin Pokémon';
  }
  if (lowerSpecies === 'mouse') {
    return `${primaryType ? primaryType + ' ' : ''}Mouse Pokémon`;
  }

  if (primaryType) {
    return `${primaryType} ${species} Pokémon`;
  }

  return `${species} Pokémon`;
}

/**
 * Returns the evolution stage hint of a Pokémon (e.g. Baby, Basic / Unevolved, Middle Evolution, Final Evolution, Single-Stage).
 */
export function getEvolutionStageHint(pokemon: {
  id?: number;
  name?: string;
  displayName?: string;
} | null | undefined): string {
  if (!pokemon) return 'Basic Pokémon (Unevolved)';

  if (pokemon.id && stagesMap[String(pokemon.id)]) {
    return stagesMap[String(pokemon.id)];
  }

  const cleanName = (pokemon.name || pokemon.displayName || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  if (cleanName && stagesMap[cleanName]) {
    return stagesMap[cleanName];
  }

  return 'Basic Pokémon (Unevolved)';
}

