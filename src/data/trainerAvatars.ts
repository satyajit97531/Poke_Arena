export interface TrainerAvatar {
  id: string; // 'red', 'blue', 'brock', 'misty', 'pikachu', 'ash', etc.
  numericId?: number; // 25 for pikachu
  name: string;
  title: string;
  role: string;
  region: string;
  spriteUrl: string;
  rarity: 'normal' | 'rare' | 'super_rare' | 'epic' | 'mythic' | 'legendary';
  tokenCost: number;
  howToUnlock: string;
  isDefaultUnlocked?: boolean;
}

export const TRAINER_AVATARS: TrainerAvatar[] = [
  // 1. Pikachu (Sole Pokémon retained per explicit user request)
  {
    id: 'pikachu',
    numericId: 25,
    name: 'Pikachu (Official Mascot)',
    title: 'Electric Mouse Pokémon',
    role: 'Partner Pokémon #025',
    region: 'Kanto',
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
    rarity: 'rare',
    tokenCost: 0,
    howToUnlock: 'Default Partner Avatar (Unlocked for all trainers)',
    isDefaultUnlocked: true,
  },
  // 2. Red
  {
    id: 'red',
    name: 'Red',
    title: 'The Living Legend',
    role: 'Mt. Silver Champion & Kanto Sovereign',
    region: 'Kanto',
    spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/red.png',
    rarity: 'legendary',
    tokenCost: 0,
    howToUnlock: 'Default Master Avatar (Unlocked for all trainers)',
    isDefaultUnlocked: true,
  },
  // 3. Blue
  {
    id: 'blue',
    name: 'Blue (Oak)',
    title: 'Eternal Rival & Champion',
    role: 'Viridian Gym Leader / Indigo Champion',
    region: 'Kanto',
    spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/blue.png',
    rarity: 'mythic',
    tokenCost: 1500,
    howToUnlock: 'Win 5 Battle Duels or unlock in Poké Mart for 1,500 BT',
  },
  // 4. Brock
  {
    id: 'brock',
    name: 'Brock',
    title: 'The Rock-Solid Pokémon Trainer',
    role: 'Pewter City Gym Leader',
    region: 'Kanto',
    spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/brock.png',
    rarity: 'rare',
    tokenCost: 750,
    howToUnlock: 'Earn the Boulder Badge or purchase for 750 BT',
  },
  // 5. Misty
  {
    id: 'misty',
    name: 'Misty',
    title: 'The Tomboyish Mermaid',
    role: 'Cerulean City Gym Leader',
    region: 'Kanto',
    spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/misty.png',
    rarity: 'rare',
    tokenCost: 750,
    howToUnlock: 'Earn the Cascade Badge or purchase for 750 BT',
  },
  // 6. Ash Ketchum
  {
    id: 'ash',
    name: 'Ash Ketchum',
    title: 'World Coronation Monarch',
    role: 'Alola Champion & World Monarch',
    region: 'Kanto',
    spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/ash.png',
    rarity: 'legendary',
    tokenCost: 3500,
    howToUnlock: 'Reach 1,000 Trophy Points or purchase for 3,500 BT',
  },
  // 7. Cynthia
  {
    id: 'cynthia',
    name: 'Cynthia',
    title: 'Sinnoh League Champion',
    role: 'Archaeologist & Garchomp Master',
    region: 'Sinnoh',
    spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/cynthia.png',
    rarity: 'legendary',
    tokenCost: 4000,
    howToUnlock: 'Conquer the Sinnoh Gym Badges or purchase for 4,000 BT',
  },
  // 8. Steven Stone
  {
    id: 'steven',
    name: 'Steven Stone',
    title: 'Hoenn Champion & Mineral Master',
    role: 'Steel & Rock Specialist / Devon Heir',
    region: 'Hoenn',
    spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/steven.png',
    rarity: 'epic',
    tokenCost: 2500,
    howToUnlock: 'Score 5,000+ points in Hoenn Quiz or purchase for 2,500 BT',
  },
  // 9. Lance
  {
    id: 'lance',
    name: 'Lance',
    title: 'Dragon Master',
    role: 'Indigo Plateau Champion',
    region: 'Johto',
    spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/lance.png',
    rarity: 'epic',
    tokenCost: 2500,
    howToUnlock: 'Reach 2,500 Trophy Points or purchase for 2,500 BT',
  },
  // 10. Professor Oak
  {
    id: 'oak',
    name: 'Professor Oak',
    title: 'Leading Pokémon Researcher',
    role: 'Pokédex Creator & Mentor',
    region: 'Kanto',
    spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/oak.png',
    rarity: 'super_rare',
    tokenCost: 1200,
    howToUnlock: 'Guess 50 Pokémon correctly or purchase for 1,200 BT',
  },
  // 11. Leon
  {
    id: 'leon',
    name: 'Leon',
    title: 'The Unbeatable Champion',
    role: 'Galar League Champion & Charizard Partner',
    region: 'Galar',
    spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/leon.png',
    rarity: 'epic',
    tokenCost: 2800,
    howToUnlock: 'Achieve a 10x Quiz Streak or purchase for 2,800 BT',
  },
  // 12. Dawn
  {
    id: 'dawn',
    name: 'Dawn',
    title: 'Diamond & Pearl Coordinator',
    role: 'Twinleaf Town Prodigy',
    region: 'Sinnoh',
    spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/dawn.png',
    rarity: 'super_rare',
    tokenCost: 1200,
    howToUnlock: 'Complete any Sinnoh Quiz round or purchase for 1,200 BT',
  },
  // 13. Serena
  {
    id: 'serena',
    name: 'Serena',
    title: 'Kalos Queen Candidate',
    role: 'Master Class Performer',
    region: 'Kalos',
    spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/serena.png',
    rarity: 'super_rare',
    tokenCost: 1200,
    howToUnlock: 'Score 80%+ on Kalos Quiz or purchase for 1,200 BT',
  },
  // 14. Giovanni
  {
    id: 'giovanni',
    name: 'Giovanni',
    title: 'Team Rocket Boss',
    role: 'Viridian Gym Leader & Ground Master',
    region: 'Kanto',
    spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/giovanni.png',
    rarity: 'mythic',
    tokenCost: 2000,
    howToUnlock: 'Win 3 rounds of Shadow silhouette mode or purchase for 2,000 BT',
  },
  // 15. Sabrina
  {
    id: 'sabrina',
    name: 'Sabrina',
    title: 'The Master of Psychic Pokémon',
    role: 'Saffron City Gym Leader',
    region: 'Kanto',
    spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/sabrina.png',
    rarity: 'super_rare',
    tokenCost: 1100,
    howToUnlock: 'Earn the Marsh Badge or purchase for 1,100 BT',
  },
  // 16. Erika
  {
    id: 'erika',
    name: 'Erika',
    title: 'The Nature-Loving Princess',
    role: 'Celadon City Gym Leader',
    region: 'Kanto',
    spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/erika.png',
    rarity: 'rare',
    tokenCost: 800,
    howToUnlock: 'Earn the Rainbow Badge or purchase for 800 BT',
  },
  // 17. Koga
  {
    id: 'koga',
    name: 'Koga',
    title: 'The Poisonous Ninja Master',
    role: 'Fuchsia Gym Leader & Elite Four',
    region: 'Kanto',
    spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/koga.png',
    rarity: 'rare',
    tokenCost: 850,
    howToUnlock: 'Earn the Soul Badge or purchase for 850 BT',
  },
  // 18. Blaine
  {
    id: 'blaine',
    name: 'Blaine',
    title: 'The Hot-Headed Quiz Master',
    role: 'Cinnabar Island Gym Leader',
    region: 'Kanto',
    spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/blaine.png',
    rarity: 'rare',
    tokenCost: 850,
    howToUnlock: 'Answer 20 Fire type questions correctly or purchase for 850 BT',
  },
  // 19. Lt. Surge
  {
    id: 'ltsurge',
    name: 'Lt. Surge',
    title: 'The Lightning American',
    role: 'Vermilion City Gym Leader',
    region: 'Kanto',
    spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/ltsurge.png',
    rarity: 'rare',
    tokenCost: 800,
    howToUnlock: 'Earn the Thunder Badge or purchase for 800 BT',
  },
  // 20. Iris
  {
    id: 'iris',
    name: 'Iris',
    title: 'The Girl Who Knows the Hearts of Dragons',
    role: 'Opelucid Gym Leader & Unova Champion',
    region: 'Unova',
    spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/iris.png',
    rarity: 'epic',
    tokenCost: 2400,
    howToUnlock: 'Score 1,500+ in Unova Quiz or purchase for 2,400 BT',
  },
  // 21. Diantha
  {
    id: 'diantha',
    name: 'Diantha',
    title: 'Grand Duchess of Kalos',
    role: 'Kalos Champion & Movie Star',
    region: 'Kalos',
    spriteUrl: 'https://play.pokemonshowdown.com/sprites/trainers/diantha.png',
    rarity: 'epic',
    tokenCost: 2600,
    howToUnlock: 'Reach 3,000 Trophy Points or purchase for 2,600 BT',
  },
];

export function getAccountAvatarUrl(account: { avatarId?: number; trainerAvatarId?: string } | null | undefined): string {
  if (!account) return 'https://play.pokemonshowdown.com/sprites/trainers/red.png';
  
  if (account.trainerAvatarId) {
    if (account.trainerAvatarId === 'pikachu' || account.trainerAvatarId === '25') {
      return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png';
    }
    const found = TRAINER_AVATARS.find((t) => t.id === account.trainerAvatarId);
    if (found) return found.spriteUrl;
    return `https://play.pokemonshowdown.com/sprites/trainers/${account.trainerAvatarId}.png`;
  }

  if (account.avatarId === 25) {
    return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png';
  }

  // Fallback to Red
  return 'https://play.pokemonshowdown.com/sprites/trainers/red.png';
}

export function getAccountAvatarName(account: { avatarId?: number; trainerAvatarId?: string } | null | undefined): string {
  if (!account) return 'Trainer Red';
  if (account.trainerAvatarId) {
    const found = TRAINER_AVATARS.find((t) => t.id === account.trainerAvatarId);
    if (found) return found.name;
    return account.trainerAvatarId.toUpperCase();
  }
  if (account.avatarId === 25) return 'Pikachu';
  return 'Trainer Red';
}
