export type PokemonType =
  | 'normal'
  | 'fire'
  | 'water'
  | 'grass'
  | 'electric'
  | 'ice'
  | 'fighting'
  | 'poison'
  | 'ground'
  | 'flying'
  | 'psychic'
  | 'bug'
  | 'rock'
  | 'ghost'
  | 'dragon'
  | 'steel'
  | 'dark'
  | 'fairy';

export type RegionId =
  | 'all'
  | 'kanto'
  | 'johto'
  | 'hoenn'
  | 'sinnoh'
  | 'unova'
  | 'kalos'
  | 'alola'
  | 'galar'
  | 'paldea'
  | 'hisui';

export type GameDifficulty = 'easy' | 'medium' | 'hard' | 'extreme' | 'menacing';

export type DifficultyMode = 'options' | 'master';

export type ShadowCropType = 'full' | 'upper' | 'lower' | 'head' | 'tail' | 'arm' | 'leg';

export type MainGameMode =
  | 'classic'        // Classic Silhouette Quiz
  | 'silhouette'     // Alias for classic
  | 'legendary'      // Legendary Arena
  | 'evolution'      // Evolution Line Organizer
  | 'cry'            // Guess by Pokémon Cry
  | 'moves'          // Guess by 1, 2, or 3 Moves / Attacks
  | 'move'           // Alias
  | 'battle'         // Battle Predictor / Matchup (Who will win?)
  | 'region_guess'   // Guess Region
  | 'region'         // Alias
  | 'type_guess'     // Guess Types & Vice Versa
  | 'type'           // Alias
  | '1v1'            // 1v1 Challenge with QR code
  | 'blitz'          // 60s Blitz
  | 'survival'       // 3 Lives
  | 'zen';           // Relaxed Practice

export type GameMode = MainGameMode;

export type TypeQuizDirection = 'pokemon_to_types' | 'types_to_pokemon';

export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  spAtk: number;
  spDef: number;
  speed: number;
}

export interface Pokemon {
  id: number;
  name: string;
  displayName: string;
  types: PokemonType[];
  generation: number;
  region: RegionId;
  species: string;
  height: number;
  weight: number;
  flavorText?: string;
  moves?: string[]; // Iconic moves
  stats?: PokemonStats;
  isLegendary?: boolean;
  isMythical?: boolean;
  isParadox?: boolean;
  isStarter?: boolean;
  isRegionalForm?: boolean; // Hisuian, Galarian, Paldean
  artwork: string;
  shinyArtwork?: string;
  cryUrl?: string;
}

export interface QuizQuestion {
  pokemon: Pokemon;
  options: Pokemon[];
  timeLimit: number;
  difficulty?: GameDifficulty;
  shadowCrop?: ShadowCropType;
  revealedHints: {
    types: boolean;
    region: boolean;
    category: boolean;
    initialLetter: boolean;
  };
}

export interface RoundResult {
  questionIndex: number;
  pokemon: Pokemon;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
  pointsEarned: number;
  streakBonus: number;
}

export interface EvolutionChain {
  id: string;
  name: string;
  stageNames: string[];
  stagePokemon: Pokemon[];
}

export interface MoveQuizData {
  moves: string[];
  correctPokemon: Pokemon;
  options: Pokemon[];
}

export interface Trophy {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond' | 'master';
  pokemonId: number;
  pokemonName: string;
  iconName: string;
  unlocked: boolean;
  unlockedAt?: string;
  condition: string;
  progress: number;
  maxProgress: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'wins' | 'streak' | 'modes' | 'speed' | 'collector' | 'badges';
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: string;
  rewardAvatarId?: number;
  rewardSongId?: string;
  rewardTrophyPoints: number;
  isGymBadge?: boolean;
  badgeRegion?: string;
  badgeColor?: string;
}

export interface HighScoreRecord {
  id: string;
  playerName: string;
  score: number;
  accuracy: number;
  streak: number;
  mode: MainGameMode;
  difficulty?: GameDifficulty;
  region: RegionId;
  date: string;
}

export interface PlayerProfile {
  name: string;
  totalGames: number;
  totalWins: number;
  totalGuesses: number;
  totalCorrect: number;
  bestStreak: number;
  totalScore: number;
  trophies?: Trophy[];
  highScores?: Record<string, number>;
  regionalMastery: Record<RegionId, { correct: number; total: number }>;
}

export type AvatarRarity = 'normal' | 'rare' | 'super_rare' | 'epic' | 'mythic' | 'legendary';

export interface TrainerAvatarInfo {
  id: string; // e.g. '25' or 'red'
  numericId?: number;
  name: string;
  title: string;
  rarity: AvatarRarity;
  unlockDesc: string;
  imageUrl: string;
  category: 'pokemon' | 'hisui' | 'trainer';
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: 'ball' | 'medicine' | 'evolution' | 'held' | 'key' | 'trainer' | 'free';
  rarity: AvatarRarity;
  cost: number; // 0 = free
  icon: string;
  rewardType: 'item' | 'tokens' | 'avatar';
  rewardValue?: string | number;
  claimIntervalDays?: number; // 1 for daily free claim
}

export interface TrophyMilestone {
  tpRequired: number;
  title: string;
  badgeName: string;
  badgeIcon: string;
  badgeColor: string;
  bgmTitle: string;
  bgmId: string;
  tokens: number;
  description: string;
}

export interface TrainerAccount {
  id: string;
  email?: string;
  username: string;
  pin: string;
  displayName: string;
  avatarId: number; // Pokemon ID for profile picture
  trainerAvatarId?: string; // e.g. 'red', 'blue', 'leaf', 'ash', 'misty', 'dawn', 'brock'
  title: string;
  level: number;
  exp: number;
  trophyPoints: number; // Limitless trophy progression
  unlockedAvatars: number[];
  unlockedTrainerAvatars?: string[];
  unlockedSongIds: string[];
  activeSongId: string;
  totalGames: number;
  totalWins: number;
  totalCorrect: number;
  totalGuesses: number;
  bestStreak: number;
  totalScore: number;
  highScores: Record<string, number>;
  regionalMastery: Record<RegionId, { correct: number; total: number }>;
  achievements: Record<string, { progress: number; unlocked: boolean; unlockedAt?: string }>;
  trophies: Record<string, { progress: number; unlocked: boolean; unlockedAt?: string }>;
  showcasedAchievements?: string[];
  flexItems?: string[]; // Up to 3 item IDs showcased in profile to flex
  // Battle History (FIFO, maximum 25 battles)
  battleHistory?: BattleRecord[];
  // Daily Missions resetting every 24 hours IST
  dailyMissions?: {
    dateIST: string;
    missions: Record<string, { progress: number; completed: boolean; claimed: boolean }>;
    allClaimed?: boolean;
  };
  // Daily Streak in Indian Standard Time (IST - UTC+5:30)
  dailyStreak: number;
  lastLoginDateIST: string;
  claimedDailyStreakDays: number[];
  // In-game Currency won in 1v1 duels & daily claims
  battleTokens: number;
  inventory: Record<string, number>; // item_id -> quantity
  claimedFreeShopDateIST?: string;
  claimedFreeShopItems?: Record<string, string>; // item_id -> dateString YYYY-MM-DD in IST
  createdAt: string;
}

export interface BattleRecord {
  id: string;
  opponentName: string;
  opponentAvatarId?: number | string;
  playerScore: number;
  opponentScore: number;
  result: 'victory' | 'defeat' | 'draw';
  mode: string;
  timestamp: string;
  rewardTokens?: number;
  rewardTP?: number;
}

export interface DuelRoomConfig {
  roomId: string;
  hostName: string;
  guestName?: string;
  rounds: number;
  timeLimit: number;
  difficulty: GameDifficulty;
  mode: MainGameMode;
  region: RegionId;
  questions: Pokemon[];
  hostScores: number[];
  guestScores: number[];
  currentRound: number;
  status: 'waiting' | 'in_progress' | 'completed';
}

