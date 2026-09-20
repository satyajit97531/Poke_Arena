import { EvolutionChain } from '../types/pokemon';

const OFFICIAL_ARTWORK_URL = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

export const EXTENDED_EVOLUTION_CHAINS: EvolutionChain[] = [
  // Gen 1 Starters & Icons
  {
    id: 'bulbasaur_line',
    name: 'Venusaur Line',
    stageNames: ['Bulbasaur', 'Ivysaur', 'Venusaur'],
    stagePokemon: [
      { id: 1, name: 'bulbasaur', displayName: 'Bulbasaur', types: ['grass', 'poison'], generation: 1, region: 'kanto', species: 'Seed Pokémon', height: 7, weight: 69, artwork: OFFICIAL_ARTWORK_URL(1) },
      { id: 2, name: 'ivysaur', displayName: 'Ivysaur', types: ['grass', 'poison'], generation: 1, region: 'kanto', species: 'Seed Pokémon', height: 10, weight: 130, artwork: OFFICIAL_ARTWORK_URL(2) },
      { id: 3, name: 'venusaur', displayName: 'Venusaur', types: ['grass', 'poison'], generation: 1, region: 'kanto', species: 'Seed Pokémon', height: 20, weight: 1000, artwork: OFFICIAL_ARTWORK_URL(3) },
    ],
  },
  {
    id: 'charmander_line',
    name: 'Charizard Line',
    stageNames: ['Charmander', 'Charmeleon', 'Charizard'],
    stagePokemon: [
      { id: 4, name: 'charmander', displayName: 'Charmander', types: ['fire'], generation: 1, region: 'kanto', species: 'Lizard Pokémon', height: 6, weight: 85, artwork: OFFICIAL_ARTWORK_URL(4) },
      { id: 5, name: 'charmeleon', displayName: 'Charmeleon', types: ['fire'], generation: 1, region: 'kanto', species: 'Flame Pokémon', height: 11, weight: 190, artwork: OFFICIAL_ARTWORK_URL(5) },
      { id: 6, name: 'charizard', displayName: 'Charizard', types: ['fire', 'flying'], generation: 1, region: 'kanto', species: 'Flame Pokémon', height: 17, weight: 905, artwork: OFFICIAL_ARTWORK_URL(6) },
    ],
  },
  {
    id: 'squirtle_line',
    name: 'Blastoise Line',
    stageNames: ['Squirtle', 'Wartortle', 'Blastoise'],
    stagePokemon: [
      { id: 7, name: 'squirtle', displayName: 'Squirtle', types: ['water'], generation: 1, region: 'kanto', species: 'Tiny Turtle Pokémon', height: 5, weight: 90, artwork: OFFICIAL_ARTWORK_URL(7) },
      { id: 8, name: 'wartortle', displayName: 'Wartortle', types: ['water'], generation: 1, region: 'kanto', species: 'Turtle Pokémon', height: 10, weight: 225, artwork: OFFICIAL_ARTWORK_URL(8) },
      { id: 9, name: 'blastoise', displayName: 'Blastoise', types: ['water'], generation: 1, region: 'kanto', species: 'Shellfish Pokémon', height: 16, weight: 855, artwork: OFFICIAL_ARTWORK_URL(9) },
    ],
  },
  {
    id: 'caterpie_line',
    name: 'Butterfree Line',
    stageNames: ['Caterpie', 'Metapod', 'Butterfree'],
    stagePokemon: [
      { id: 10, name: 'caterpie', displayName: 'Caterpie', types: ['bug'], generation: 1, region: 'kanto', species: 'Worm Pokémon', height: 3, weight: 29, artwork: OFFICIAL_ARTWORK_URL(10) },
      { id: 11, name: 'metapod', displayName: 'Metapod', types: ['bug'], generation: 1, region: 'kanto', species: 'Cocoon Pokémon', height: 7, weight: 99, artwork: OFFICIAL_ARTWORK_URL(11) },
      { id: 12, name: 'butterfree', displayName: 'Butterfree', types: ['bug', 'flying'], generation: 1, region: 'kanto', species: 'Butterfly Pokémon', height: 11, weight: 320, artwork: OFFICIAL_ARTWORK_URL(12) },
    ],
  },
  {
    id: 'pidgey_line',
    name: 'Pidgeot Line',
    stageNames: ['Pidgey', 'Pidgeotto', 'Pidgeot'],
    stagePokemon: [
      { id: 16, name: 'pidgey', displayName: 'Pidgey', types: ['normal', 'flying'], generation: 1, region: 'kanto', species: 'Tiny Bird Pokémon', height: 3, weight: 18, artwork: OFFICIAL_ARTWORK_URL(16) },
      { id: 17, name: 'pidgeotto', displayName: 'Pidgeotto', types: ['normal', 'flying'], generation: 1, region: 'kanto', species: 'Bird Pokémon', height: 11, weight: 300, artwork: OFFICIAL_ARTWORK_URL(17) },
      { id: 18, name: 'pidgeot', displayName: 'Pidgeot', types: ['normal', 'flying'], generation: 1, region: 'kanto', species: 'Bird Pokémon', height: 15, weight: 395, artwork: OFFICIAL_ARTWORK_URL(18) },
    ],
  },
  {
    id: 'pikachu_family',
    name: 'Pikachu Line',
    stageNames: ['Pichu', 'Pikachu', 'Raichu'],
    stagePokemon: [
      { id: 172, name: 'pichu', displayName: 'Pichu', types: ['electric'], generation: 2, region: 'johto', species: 'Tiny Mouse Pokémon', height: 3, weight: 20, artwork: OFFICIAL_ARTWORK_URL(172) },
      { id: 25, name: 'pikachu', displayName: 'Pikachu', types: ['electric'], generation: 1, region: 'kanto', species: 'Mouse Pokémon', height: 4, weight: 60, artwork: OFFICIAL_ARTWORK_URL(25) },
      { id: 26, name: 'raichu', displayName: 'Raichu', types: ['electric'], generation: 1, region: 'kanto', species: 'Mouse Pokémon', height: 8, weight: 300, artwork: OFFICIAL_ARTWORK_URL(26) },
    ],
  },
  {
    id: 'abra_line',
    name: 'Alakazam Line',
    stageNames: ['Abra', 'Kadabra', 'Alakazam'],
    stagePokemon: [
      { id: 63, name: 'abra', displayName: 'Abra', types: ['psychic'], generation: 1, region: 'kanto', species: 'Psi Pokémon', height: 9, weight: 195, artwork: OFFICIAL_ARTWORK_URL(63) },
      { id: 64, name: 'kadabra', displayName: 'Kadabra', types: ['psychic'], generation: 1, region: 'kanto', species: 'Psi Pokémon', height: 13, weight: 565, artwork: OFFICIAL_ARTWORK_URL(64) },
      { id: 65, name: 'alakazam', displayName: 'Alakazam', types: ['psychic'], generation: 1, region: 'kanto', species: 'Psi Pokémon', height: 15, weight: 480, artwork: OFFICIAL_ARTWORK_URL(65) },
    ],
  },
  {
    id: 'machop_line',
    name: 'Machamp Line',
    stageNames: ['Machop', 'Machoke', 'Machamp'],
    stagePokemon: [
      { id: 66, name: 'machop', displayName: 'Machop', types: ['fighting'], generation: 1, region: 'kanto', species: 'Superpower Pokémon', height: 8, weight: 195, artwork: OFFICIAL_ARTWORK_URL(66) },
      { id: 67, name: 'machoke', displayName: 'Machoke', types: ['fighting'], generation: 1, region: 'kanto', species: 'Superpower Pokémon', height: 15, weight: 705, artwork: OFFICIAL_ARTWORK_URL(67) },
      { id: 68, name: 'machamp', displayName: 'Machamp', types: ['fighting'], generation: 1, region: 'kanto', species: 'Superpower Pokémon', height: 16, weight: 1300, artwork: OFFICIAL_ARTWORK_URL(68) },
    ],
  },
  {
    id: 'geodude_line',
    name: 'Golem Line',
    stageNames: ['Geodude', 'Graveler', 'Golem'],
    stagePokemon: [
      { id: 74, name: 'geodude', displayName: 'Geodude', types: ['rock', 'ground'], generation: 1, region: 'kanto', species: 'Rock Pokémon', height: 4, weight: 200, artwork: OFFICIAL_ARTWORK_URL(74) },
      { id: 75, name: 'graveler', displayName: 'Graveler', types: ['rock', 'ground'], generation: 1, region: 'kanto', species: 'Rock Pokémon', height: 10, weight: 1050, artwork: OFFICIAL_ARTWORK_URL(75) },
      { id: 76, name: 'golem', displayName: 'Golem', types: ['rock', 'ground'], generation: 1, region: 'kanto', species: 'Megaton Pokémon', height: 14, weight: 3000, artwork: OFFICIAL_ARTWORK_URL(76) },
    ],
  },
  {
    id: 'gengar_family',
    name: 'Gengar Line',
    stageNames: ['Gastly', 'Haunter', 'Gengar'],
    stagePokemon: [
      { id: 92, name: 'gastly', displayName: 'Gastly', types: ['ghost', 'poison'], generation: 1, region: 'kanto', species: 'Gas Pokémon', height: 13, weight: 1, artwork: OFFICIAL_ARTWORK_URL(92) },
      { id: 93, name: 'haunter', displayName: 'Haunter', types: ['ghost', 'poison'], generation: 1, region: 'kanto', species: 'Gas Pokémon', height: 16, weight: 1, artwork: OFFICIAL_ARTWORK_URL(93) },
      { id: 94, name: 'gengar', displayName: 'Gengar', types: ['ghost', 'poison'], generation: 1, region: 'kanto', species: 'Shadow Pokémon', height: 15, weight: 405, artwork: OFFICIAL_ARTWORK_URL(94) },
    ],
  },
  {
    id: 'dratini_line',
    name: 'Dragonite Line',
    stageNames: ['Dratini', 'Dragonair', 'Dragonite'],
    stagePokemon: [
      { id: 147, name: 'dratini', displayName: 'Dratini', types: ['dragon'], generation: 1, region: 'kanto', species: 'Dragon Pokémon', height: 18, weight: 33, artwork: OFFICIAL_ARTWORK_URL(147) },
      { id: 148, name: 'dragonair', displayName: 'Dragonair', types: ['dragon'], generation: 1, region: 'kanto', species: 'Dragon Pokémon', height: 40, weight: 165, artwork: OFFICIAL_ARTWORK_URL(148) },
      { id: 149, name: 'dragonite', displayName: 'Dragonite', types: ['dragon', 'flying'], generation: 1, region: 'kanto', species: 'Dragon Pokémon', height: 22, weight: 2100, artwork: OFFICIAL_ARTWORK_URL(149) },
    ],
  },

  // Gen 2 (Johto)
  {
    id: 'chikorita_line',
    name: 'Meganium Line',
    stageNames: ['Chikorita', 'Bayleef', 'Meganium'],
    stagePokemon: [
      { id: 152, name: 'chikorita', displayName: 'Chikorita', types: ['grass'], generation: 2, region: 'johto', species: 'Leaf Pokémon', height: 9, weight: 64, artwork: OFFICIAL_ARTWORK_URL(152) },
      { id: 153, name: 'bayleef', displayName: 'Bayleef', types: ['grass'], generation: 2, region: 'johto', species: 'Leaf Pokémon', height: 12, weight: 158, artwork: OFFICIAL_ARTWORK_URL(153) },
      { id: 154, name: 'meganium', displayName: 'Meganium', types: ['grass'], generation: 2, region: 'johto', species: 'Herb Pokémon', height: 18, weight: 1005, artwork: OFFICIAL_ARTWORK_URL(154) },
    ],
  },
  {
    id: 'cyndaquil_line',
    name: 'Typhlosion Line',
    stageNames: ['Cyndaquil', 'Quilava', 'Typhlosion'],
    stagePokemon: [
      { id: 155, name: 'cyndaquil', displayName: 'Cyndaquil', types: ['fire'], generation: 2, region: 'johto', species: 'Fire Mouse Pokémon', height: 5, weight: 79, artwork: OFFICIAL_ARTWORK_URL(155) },
      { id: 156, name: 'quilava', displayName: 'Quilava', types: ['fire'], generation: 2, region: 'johto', species: 'Volcano Pokémon', height: 9, weight: 190, artwork: OFFICIAL_ARTWORK_URL(156) },
      { id: 157, name: 'typhlosion', displayName: 'Typhlosion', types: ['fire'], generation: 2, region: 'johto', species: 'Volcano Pokémon', height: 17, weight: 795, artwork: OFFICIAL_ARTWORK_URL(157) },
    ],
  },
  {
    id: 'totodile_line',
    name: 'Feraligatr Line',
    stageNames: ['Totodile', 'Croconaw', 'Feraligatr'],
    stagePokemon: [
      { id: 158, name: 'totodile', displayName: 'Totodile', types: ['water'], generation: 2, region: 'johto', species: 'Big Jaw Pokémon', height: 6, weight: 95, artwork: OFFICIAL_ARTWORK_URL(158) },
      { id: 159, name: 'croconaw', displayName: 'Croconaw', types: ['water'], generation: 2, region: 'johto', species: 'Big Jaw Pokémon', height: 11, weight: 250, artwork: OFFICIAL_ARTWORK_URL(159) },
      { id: 160, name: 'feraligatr', displayName: 'Feraligatr', types: ['water'], generation: 2, region: 'johto', species: 'Big Jaw Pokémon', height: 23, weight: 888, artwork: OFFICIAL_ARTWORK_URL(160) },
    ],
  },
  {
    id: 'larvitar_line',
    name: 'Tyranitar Line',
    stageNames: ['Larvitar', 'Pupitar', 'Tyranitar'],
    stagePokemon: [
      { id: 246, name: 'larvitar', displayName: 'Larvitar', types: ['rock', 'ground'], generation: 2, region: 'johto', species: 'Rock Skin Pokémon', height: 6, weight: 720, artwork: OFFICIAL_ARTWORK_URL(246) },
      { id: 247, name: 'pupitar', displayName: 'Pupitar', types: ['rock', 'ground'], generation: 2, region: 'johto', species: 'Hard Shell Pokémon', height: 12, weight: 1520, artwork: OFFICIAL_ARTWORK_URL(247) },
      { id: 248, name: 'tyranitar', displayName: 'Tyranitar', types: ['rock', 'dark'], generation: 2, region: 'johto', species: 'Armor Pokémon', height: 20, weight: 2020, artwork: OFFICIAL_ARTWORK_URL(248) },
    ],
  },

  // Gen 3 (Hoenn)
  {
    id: 'treecko_line',
    name: 'Sceptile Line',
    stageNames: ['Treecko', 'Grovyle', 'Sceptile'],
    stagePokemon: [
      { id: 252, name: 'treecko', displayName: 'Treecko', types: ['grass'], generation: 3, region: 'hoenn', species: 'Wood Gecko Pokémon', height: 5, weight: 50, artwork: OFFICIAL_ARTWORK_URL(252) },
      { id: 253, name: 'grovyle', displayName: 'Grovyle', types: ['grass'], generation: 3, region: 'hoenn', species: 'Wood Gecko Pokémon', height: 9, weight: 216, artwork: OFFICIAL_ARTWORK_URL(253) },
      { id: 254, name: 'sceptile', displayName: 'Sceptile', types: ['grass'], generation: 3, region: 'hoenn', species: 'Forest Pokémon', height: 17, weight: 522, artwork: OFFICIAL_ARTWORK_URL(254) },
    ],
  },
  {
    id: 'torchic_line',
    name: 'Blaziken Line',
    stageNames: ['Torchic', 'Combusken', 'Blaziken'],
    stagePokemon: [
      { id: 255, name: 'torchic', displayName: 'Torchic', types: ['fire'], generation: 3, region: 'hoenn', species: 'Chick Pokémon', height: 4, weight: 25, artwork: OFFICIAL_ARTWORK_URL(255) },
      { id: 256, name: 'combusken', displayName: 'Combusken', types: ['fire', 'fighting'], generation: 3, region: 'hoenn', species: 'Young Fowl Pokémon', height: 9, weight: 195, artwork: OFFICIAL_ARTWORK_URL(256) },
      { id: 257, name: 'blaziken', displayName: 'Blaziken', types: ['fire', 'fighting'], generation: 3, region: 'hoenn', species: 'Blaze Pokémon', height: 19, weight: 520, artwork: OFFICIAL_ARTWORK_URL(257) },
    ],
  },
  {
    id: 'mudkip_line',
    name: 'Swampert Line',
    stageNames: ['Mudkip', 'Marshtomp', 'Swampert'],
    stagePokemon: [
      { id: 258, name: 'mudkip', displayName: 'Mudkip', types: ['water'], generation: 3, region: 'hoenn', species: 'Mud Fish Pokémon', height: 4, weight: 76, artwork: OFFICIAL_ARTWORK_URL(258) },
      { id: 259, name: 'marshtomp', displayName: 'Marshtomp', types: ['water', 'ground'], generation: 3, region: 'hoenn', species: 'Mud Fish Pokémon', height: 7, weight: 280, artwork: OFFICIAL_ARTWORK_URL(259) },
      { id: 260, name: 'swampert', displayName: 'Swampert', types: ['water', 'ground'], generation: 3, region: 'hoenn', species: 'Mud Fish Pokémon', height: 15, weight: 819, artwork: OFFICIAL_ARTWORK_URL(260) },
    ],
  },
  {
    id: 'bagon_line',
    name: 'Salamence Line',
    stageNames: ['Bagon', 'Shelgon', 'Salamence'],
    stagePokemon: [
      { id: 371, name: 'bagon', displayName: 'Bagon', types: ['dragon'], generation: 3, region: 'hoenn', species: 'Rock Head Pokémon', height: 6, weight: 421, artwork: OFFICIAL_ARTWORK_URL(371) },
      { id: 372, name: 'shelgon', displayName: 'Shelgon', types: ['dragon'], generation: 3, region: 'hoenn', species: 'Endurance Pokémon', height: 11, weight: 1105, artwork: OFFICIAL_ARTWORK_URL(372) },
      { id: 373, name: 'salamence', displayName: 'Salamence', types: ['dragon', 'flying'], generation: 3, region: 'hoenn', species: 'Dragon Pokémon', height: 15, weight: 1026, artwork: OFFICIAL_ARTWORK_URL(373) },
    ],
  },
  {
    id: 'beldum_line',
    name: 'Metagross Line',
    stageNames: ['Beldum', 'Metang', 'Metagross'],
    stagePokemon: [
      { id: 374, name: 'beldum', displayName: 'Beldum', types: ['steel', 'psychic'], generation: 3, region: 'hoenn', species: 'Iron Ball Pokémon', height: 6, weight: 952, artwork: OFFICIAL_ARTWORK_URL(374) },
      { id: 375, name: 'metang', displayName: 'Metang', types: ['steel', 'psychic'], generation: 3, region: 'hoenn', species: 'Iron Claw Pokémon', height: 12, weight: 2025, artwork: OFFICIAL_ARTWORK_URL(375) },
      { id: 376, name: 'metagross', displayName: 'Metagross', types: ['steel', 'psychic'], generation: 3, region: 'hoenn', species: 'Iron Leg Pokémon', height: 16, weight: 5500, artwork: OFFICIAL_ARTWORK_URL(376) },
    ],
  },

  // Gen 4 (Sinnoh)
  {
    id: 'turtwig_line',
    name: 'Torterra Line',
    stageNames: ['Turtwig', 'Grotle', 'Torterra'],
    stagePokemon: [
      { id: 387, name: 'turtwig', displayName: 'Turtwig', types: ['grass'], generation: 4, region: 'sinnoh', species: 'Tiny Leaf Pokémon', height: 4, weight: 102, artwork: OFFICIAL_ARTWORK_URL(387) },
      { id: 388, name: 'grotle', displayName: 'Grotle', types: ['grass'], generation: 4, region: 'sinnoh', species: 'Grove Pokémon', height: 11, weight: 970, artwork: OFFICIAL_ARTWORK_URL(388) },
      { id: 389, name: 'torterra', displayName: 'Torterra', types: ['grass', 'ground'], generation: 4, region: 'sinnoh', species: 'Continent Pokémon', height: 22, weight: 3100, artwork: OFFICIAL_ARTWORK_URL(389) },
    ],
  },
  {
    id: 'chimchar_line',
    name: 'Infernape Line',
    stageNames: ['Chimchar', 'Monferno', 'Infernape'],
    stagePokemon: [
      { id: 390, name: 'chimchar', displayName: 'Chimchar', types: ['fire'], generation: 4, region: 'sinnoh', species: 'Chimp Pokémon', height: 5, weight: 64, artwork: OFFICIAL_ARTWORK_URL(390) },
      { id: 391, name: 'monferno', displayName: 'Monferno', types: ['fire', 'fighting'], generation: 4, region: 'sinnoh', species: 'Playful Pokémon', height: 9, weight: 220, artwork: OFFICIAL_ARTWORK_URL(391) },
      { id: 392, name: 'infernape', displayName: 'Infernape', types: ['fire', 'fighting'], generation: 4, region: 'sinnoh', species: 'Flame Pokémon', height: 12, weight: 350, artwork: OFFICIAL_ARTWORK_URL(392) },
    ],
  },
  {
    id: 'piplup_line',
    name: 'Empoleon Line',
    stageNames: ['Piplup', 'Prinplup', 'Empoleon'],
    stagePokemon: [
      { id: 393, name: 'piplup', displayName: 'Piplup', types: ['water'], generation: 4, region: 'sinnoh', species: 'Penguin Pokémon', height: 4, weight: 52, artwork: OFFICIAL_ARTWORK_URL(393) },
      { id: 394, name: 'prinplup', displayName: 'Prinplup', types: ['water'], generation: 4, region: 'sinnoh', species: 'Penguin Pokémon', height: 8, weight: 230, artwork: OFFICIAL_ARTWORK_URL(394) },
      { id: 395, name: 'empoleon', displayName: 'Empoleon', types: ['water', 'steel'], generation: 4, region: 'sinnoh', species: 'Emperor Pokémon', height: 17, weight: 845, artwork: OFFICIAL_ARTWORK_URL(395) },
    ],
  },
  {
    id: 'gible_line',
    name: 'Garchomp Line',
    stageNames: ['Gible', 'Gabite', 'Garchomp'],
    stagePokemon: [
      { id: 443, name: 'gible', displayName: 'Gible', types: ['dragon', 'ground'], generation: 4, region: 'sinnoh', species: 'Land Shark Pokémon', height: 7, weight: 205, artwork: OFFICIAL_ARTWORK_URL(443) },
      { id: 444, name: 'gabite', displayName: 'Gabite', types: ['dragon', 'ground'], generation: 4, region: 'sinnoh', species: 'Cave Pokémon', height: 14, weight: 560, artwork: OFFICIAL_ARTWORK_URL(444) },
      { id: 445, name: 'garchomp', displayName: 'Garchomp', types: ['dragon', 'ground'], generation: 4, region: 'sinnoh', species: 'Mach Pokémon', height: 19, weight: 950, artwork: OFFICIAL_ARTWORK_URL(445) },
    ],
  },
  {
    id: 'sinnoh_lucario',
    name: 'Lucario Line',
    stageNames: ['Riolu', 'Lucario'],
    stagePokemon: [
      { id: 447, name: 'riolu', displayName: 'Riolu', types: ['fighting'], generation: 4, region: 'sinnoh', species: 'Emanation Pokémon', height: 7, weight: 202, artwork: OFFICIAL_ARTWORK_URL(447) },
      { id: 448, name: 'lucario', displayName: 'Lucario', types: ['fighting', 'steel'], generation: 4, region: 'sinnoh', species: 'Aura Pokémon', height: 12, weight: 540, artwork: OFFICIAL_ARTWORK_URL(448) },
    ],
  },

  // Gen 5 & 6 (Unova / Kalos)
  {
    id: 'froakie_line',
    name: 'Greninja Line',
    stageNames: ['Froakie', 'Frogadier', 'Greninja'],
    stagePokemon: [
      { id: 656, name: 'froakie', displayName: 'Froakie', types: ['water'], generation: 6, region: 'kalos', species: 'Bubble Frog Pokémon', height: 3, weight: 70, artwork: OFFICIAL_ARTWORK_URL(656) },
      { id: 657, name: 'frogadier', displayName: 'Frogadier', types: ['water'], generation: 6, region: 'kalos', species: 'Bubble Frog Pokémon', height: 6, weight: 109, artwork: OFFICIAL_ARTWORK_URL(657) },
      { id: 658, name: 'greninja', displayName: 'Greninja', types: ['water', 'dark'], generation: 6, region: 'kalos', species: 'Ninja Pokémon', height: 15, weight: 400, artwork: OFFICIAL_ARTWORK_URL(658) },
    ],
  },

  // Gen 7 & 8 (Alola / Galar)
  {
    id: 'rowlet_line',
    name: 'Decidueye Line',
    stageNames: ['Rowlet', 'Dartrix', 'Decidueye'],
    stagePokemon: [
      { id: 722, name: 'rowlet', displayName: 'Rowlet', types: ['grass', 'flying'], generation: 7, region: 'alola', species: 'Grass Quill Pokémon', height: 3, weight: 15, artwork: OFFICIAL_ARTWORK_URL(722) },
      { id: 723, name: 'dartrix', displayName: 'Dartrix', types: ['grass', 'flying'], generation: 7, region: 'alola', species: 'Blade Quill Pokémon', height: 7, weight: 160, artwork: OFFICIAL_ARTWORK_URL(723) },
      { id: 724, name: 'decidueye', displayName: 'Decidueye', types: ['grass', 'ghost'], generation: 7, region: 'alola', species: 'Arrow Quill Pokémon', height: 16, weight: 366, artwork: OFFICIAL_ARTWORK_URL(724) },
    ],
  },
  {
    id: 'galar_dragapult',
    name: 'Dragapult Line',
    stageNames: ['Dreepy', 'Drakloak', 'Dragapult'],
    stagePokemon: [
      { id: 885, name: 'dreepy', displayName: 'Dreepy', types: ['dragon', 'ghost'], generation: 8, region: 'galar', species: 'Lingering Pokémon', height: 5, weight: 20, artwork: OFFICIAL_ARTWORK_URL(885) },
      { id: 886, name: 'drakloak', displayName: 'Drakloak', types: ['dragon', 'ghost'], generation: 8, region: 'galar', species: 'Caretaker Pokémon', height: 14, weight: 110, artwork: OFFICIAL_ARTWORK_URL(886) },
      { id: 887, name: 'dragapult', displayName: 'Dragapult', types: ['dragon', 'ghost'], generation: 8, region: 'galar', species: 'Stealth Pokémon', height: 30, weight: 500, artwork: OFFICIAL_ARTWORK_URL(887) },
    ],
  },

  // Gen 9 & Hisui
  {
    id: 'paldea_fire',
    name: 'Skeledirge Line',
    stageNames: ['Fuecoco', 'Crocalor', 'Skeledirge'],
    stagePokemon: [
      { id: 909, name: 'fuecoco', displayName: 'Fuecoco', types: ['fire'], generation: 9, region: 'paldea', species: 'Fire Croc Pokémon', height: 4, weight: 98, artwork: OFFICIAL_ARTWORK_URL(909) },
      { id: 910, name: 'crocalor', displayName: 'Crocalor', types: ['fire'], generation: 9, region: 'paldea', species: 'Fire Croc Pokémon', height: 10, weight: 307, artwork: OFFICIAL_ARTWORK_URL(910) },
      { id: 911, name: 'skeledirge', displayName: 'Skeledirge', types: ['fire', 'ghost'], generation: 9, region: 'paldea', species: 'Singer Pokémon', height: 16, weight: 3265, artwork: OFFICIAL_ARTWORK_URL(911) },
    ],
  },
  {
    id: 'paldea_tinkaton',
    name: 'Tinkaton Line',
    stageNames: ['Tinkatink', 'Tinkatuff', 'Tinkaton'],
    stagePokemon: [
      { id: 957, name: 'tinkatink', displayName: 'Tinkatink', types: ['fairy', 'steel'], generation: 9, region: 'paldea', species: 'Metalsmith Pokémon', height: 4, weight: 89, artwork: OFFICIAL_ARTWORK_URL(957) },
      { id: 958, name: 'tinkatuff', displayName: 'Tinkatuff', types: ['fairy', 'steel'], generation: 9, region: 'paldea', species: 'Hammer Pokémon', height: 7, weight: 591, artwork: OFFICIAL_ARTWORK_URL(958) },
      { id: 959, name: 'tinkaton', displayName: 'Tinkaton', types: ['fairy', 'steel'], generation: 9, region: 'paldea', species: 'Hammer Pokémon', height: 7, weight: 1128, artwork: OFFICIAL_ARTWORK_URL(959) },
    ],
  },
  {
    id: 'hisui_kleavor',
    name: 'Kleavor Ancient Evolution',
    stageNames: ['Scyther', 'Kleavor'],
    stagePokemon: [
      { id: 123, name: 'scyther', displayName: 'Scyther', types: ['bug', 'flying'], generation: 1, region: 'kanto', species: 'Mantis Pokémon', height: 15, weight: 560, artwork: OFFICIAL_ARTWORK_URL(123) },
      { id: 900, name: 'kleavor', displayName: 'Kleavor', types: ['bug', 'rock'], generation: 8, region: 'hisui', species: 'Axe Pokémon', height: 18, weight: 890, artwork: OFFICIAL_ARTWORK_URL(900) },
    ],
  },
  {
    id: 'hisui_ursaluna',
    name: 'Ursaluna Ancient Evolution',
    stageNames: ['Teddiursa', 'Ursaring', 'Ursaluna'],
    stagePokemon: [
      { id: 216, name: 'teddiursa', displayName: 'Teddiursa', types: ['normal'], generation: 2, region: 'johto', species: 'Little Bear Pokémon', height: 6, weight: 88, artwork: OFFICIAL_ARTWORK_URL(216) },
      { id: 217, name: 'ursaring', displayName: 'Ursaring', types: ['normal'], generation: 2, region: 'johto', species: 'Hibernator Pokémon', height: 18, weight: 1258, artwork: OFFICIAL_ARTWORK_URL(217) },
      { id: 901, name: 'ursaluna', displayName: 'Ursaluna', types: ['ground', 'normal'], generation: 8, region: 'hisui', species: 'Peat Pokémon', height: 24, weight: 2900, artwork: OFFICIAL_ARTWORK_URL(901) },
    ],
  },
];
