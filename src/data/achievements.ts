import { Achievement } from '../types/pokemon';

const BASE_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_catch',
    title: 'First Catch',
    description: 'Score your first correct Pokémon guess.',
    category: 'wins',
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    rewardAvatarId: 25, // Pikachu
    rewardTrophyPoints: 100,
  },
  {
    id: 'flame_master',
    title: 'Flame Emperor',
    description: 'Correctly identify 5 Fire-type Pokémon.',
    category: 'collector',
    progress: 0,
    maxProgress: 5,
    unlocked: false,
    rewardAvatarId: 6, // Charizard
    rewardSongId: 'gym_leader_battle',
    rewardTrophyPoints: 250,
  },
  {
    id: 'aura_awakening',
    title: 'Aura Guardian',
    description: 'Reach a streak of 7 correct answers in any mode.',
    category: 'streak',
    progress: 0,
    maxProgress: 7,
    unlocked: false,
    rewardAvatarId: 448, // Lucario
    rewardTrophyPoints: 300,
  },
  {
    id: 'tinkaton_forge',
    title: 'Gigaton Hammerer',
    description: 'Correctly guess Tinkaton or identify 3 Steel/Fairy Pokémon.',
    category: 'collector',
    progress: 0,
    maxProgress: 3,
    unlocked: false,
    rewardAvatarId: 959, // Tinkaton
    rewardTrophyPoints: 350,
  },
  {
    id: 'evolution_scholar',
    title: 'Evolution Line Specialist',
    description: 'Successfully organize 3 Evolution lines in correct order.',
    category: 'modes',
    progress: 0,
    maxProgress: 3,
    unlocked: false,
    rewardAvatarId: 887, // Dragapult
    rewardSongId: 'sinnoh_route',
    rewardTrophyPoints: 400,
  },
  {
    id: 'cry_auditor',
    title: 'Soundwave Detective',
    description: 'Correctly identify 5 Pokémon purely by their cries / audio.',
    category: 'modes',
    progress: 0,
    maxProgress: 5,
    unlocked: false,
    rewardAvatarId: 94, // Gengar
    rewardSongId: 'lavender_mystery',
    rewardTrophyPoints: 350,
  },
  {
    id: 'move_master',
    title: 'Move Arsenal Analyst',
    description: 'Solve a 3-attack combo puzzle in Attack Guesser mode.',
    category: 'modes',
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    rewardAvatarId: 658, // Greninja
    rewardTrophyPoints: 400,
  },
  {
    id: 'legendary_conqueror',
    title: 'Apex Arena Champion',
    description: 'Score 2,500+ points in the Legendary Arena.',
    category: 'modes',
    progress: 0,
    maxProgress: 2500,
    unlocked: false,
    rewardAvatarId: 1007, // Koraidon
    rewardSongId: 'area_zero',
    rewardTrophyPoints: 500,
  },
  {
    id: 'speed_reflexes',
    title: 'Mach 2 Reflexes',
    description: 'Answer any question within the first 1.5 seconds.',
    category: 'speed',
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    rewardAvatarId: 815, // Cinderace
    rewardTrophyPoints: 250,
  },
  {
    id: 'duel_victor',
    title: '1v1 Battle Conqueror',
    description: 'Host or complete a 1v1 QR Challenge match.',
    category: 'modes',
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    rewardAvatarId: 150, // Mewtwo
    rewardTrophyPoints: 450,
  },
  {
    id: 'grand_creator',
    title: 'Alpha Domain',
    description: 'Earn 3,000 total Trophy Points across all modes.',
    category: 'collector',
    progress: 0,
    maxProgress: 3000,
    unlocked: false,
    rewardAvatarId: 493, // Arceus
    rewardTrophyPoints: 1000,
  },
  // Extreme Difficulty Achievements
  {
    id: 'extreme_codebreaker',
    title: 'Extreme Codebreaker',
    description: 'Correctly identify 3 Pokémon on Extreme difficulty with zero multiple-choice options.',
    category: 'modes',
    progress: 0,
    maxProgress: 3,
    unlocked: false,
    rewardAvatarId: 150, // Mewtwo
    rewardTrophyPoints: 600,
  },
  {
    id: 'blitz_champion',
    title: '60s Blitz Master',
    description: 'Score 1,000+ points in 60s Blitz mode.',
    category: 'speed',
    progress: 0,
    maxProgress: 1000,
    unlocked: false,
    rewardAvatarId: 815,
    rewardTrophyPoints: 400,
  },
  {
    id: 'trainer_fellowship',
    title: 'Pokémon Networker',
    description: 'Add a rival or friend to your Trainer Friend List.',
    category: 'collector',
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    rewardAvatarId: 25,
    rewardTrophyPoints: 200,
  },
  {
    id: 'extreme_archivist',
    title: 'Extreme Biological Savant',
    description: 'Identify 5 Pokémon correctly in Extreme difficulty with zero multiple-choice options.',
    category: 'modes',
    progress: 0,
    maxProgress: 5,
    unlocked: false,
    rewardAvatarId: 493, // Arceus
    rewardTrophyPoints: 800,
  },
  {
    id: 'badge_connoisseur',
    title: 'Kanto League Qualifier',
    description: 'Earn 4 or more official Kanto Gym Badges.',
    category: 'badges',
    progress: 0,
    maxProgress: 4,
    unlocked: false,
    rewardSongId: 'cynthia_theme',
    rewardTrophyPoints: 600,
  },
  {
    id: 'jukebox_virtuoso',
    title: 'Pokémon Soundscape Maestro',
    description: 'Unlock 5 or more nostalgic Pokémon background music tracks.',
    category: 'collector',
    progress: 0,
    maxProgress: 5,
    unlocked: false,
    rewardSongId: 'driftveil_city',
    rewardTrophyPoints: 350,
  },
  {
    id: 'speed_demon_blitz',
    title: 'Hyper-Velocity Striker',
    description: 'Score 1,500+ points in a single 60s Blitz run.',
    category: 'speed',
    progress: 0,
    maxProgress: 1500,
    unlocked: false,
    rewardAvatarId: 887,
    rewardTrophyPoints: 500,
  },
  {
    id: 'rival_duelist',
    title: 'Colosseum Gladiator',
    description: 'Participate in intense 1v1 PvP Arena rounds and earn speed bonus points.',
    category: 'modes',
    progress: 0,
    maxProgress: 3,
    unlocked: false,
    rewardSongId: 'wild_pokemon_battle',
    rewardTrophyPoints: 450,
  },
];

import { ALL_REGIONAL_BADGES, GymBadgeInfo } from './regionalBadges';
export { ALL_REGIONAL_BADGES };
export type { GymBadgeInfo };

// Automatically convert all regional gym badges into achievements
const ALL_GYM_BADGE_ACHIEVEMENTS: Achievement[] = Object.values(ALL_REGIONAL_BADGES)
  .flat()
  .map((b) => ({
    id: b.id,
    title: b.name,
    description: `${b.town} (${b.gymLeader}): ${b.description}`,
    category: 'badges' as const,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    rewardTrophyPoints: b.rewardTrophyPoints,
    isGymBadge: true,
    badgeRegion: b.region,
    badgeColor: b.color,
  }));

export const ACHIEVEMENTS_LIST: Achievement[] = [
  ...BASE_ACHIEVEMENTS,
  ...ALL_GYM_BADGE_ACHIEVEMENTS,
];

export const KANTO_BADGES: GymBadgeInfo[] = ALL_REGIONAL_BADGES.Kanto;


