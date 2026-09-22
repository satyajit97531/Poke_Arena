import { ACHIEVEMENTS_LIST } from '../data/achievements';
import { POKEMON_TRACKS } from '../data/songs';
import { TrainerAccount, BattleRecord } from '../types/pokemon';
import { calculateLevelFromExp, getRankTitleForLevel } from './expSystem';

const STORAGE_ACCOUNTS_KEY = 'poke_quiz_accounts_v2';
const STORAGE_ACTIVE_ID_KEY = 'poke_quiz_active_account_id_v2';

export function createDefaultAccount(username: string = 'Trainer Red', pin: string = '1234'): TrainerAccount {
  return {
    id: 'acc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    username: username.toLowerCase().trim(),
    pin,
    displayName: username.trim(),
    avatarId: 25, // Pikachu
    title: 'Rookie Pokémon Trainer',
    level: 1,
    exp: 0,
    trophyPoints: 100,
    unlockedAvatars: [25, 1, 4, 7], // Pikachu, Bulbasaur, Charmander, Squirtle default
    unlockedSongIds: ['pallet_town'],
    activeSongId: 'pallet_town',
    totalGames: 0,
    totalWins: 0,
    totalCorrect: 0,
    totalGuesses: 0,
    bestStreak: 0,
    totalScore: 0,
    highScores: {},
    regionalMastery: {
      all: { correct: 0, total: 0 },
      kanto: { correct: 0, total: 0 },
      johto: { correct: 0, total: 0 },
      hoenn: { correct: 0, total: 0 },
      sinnoh: { correct: 0, total: 0 },
      unova: { correct: 0, total: 0 },
      kalos: { correct: 0, total: 0 },
      alola: { correct: 0, total: 0 },
      galar: { correct: 0, total: 0 },
      hisui: { correct: 0, total: 0 },
      paldea: { correct: 0, total: 0 },
    },
    achievements: {},
    trophies: {},
    showcasedAchievements: [],
    flexItems: [],
    friends: ['Trainer Blue', 'Champion Cynthia', 'Gym Leader Brock'],
    dailyStreak: 1,
    lastLoginDateIST: '',
    claimedDailyStreakDays: [],
    battleTokens: 250,
    inventory: {},
    unlockedTrainerAvatars: ['red'],
    createdAt: new Date().toISOString(),
  };
}

export function getAllAccounts(): TrainerAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAllAccounts(accounts: TrainerAccount[]): void {
  try {
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // ignore
  }
}

export function getActiveAccount(): TrainerAccount {
  const accounts = getAllAccounts();
  const activeId = localStorage.getItem(STORAGE_ACTIVE_ID_KEY);

  let current = accounts.find((a) => a.id === activeId);
  if (!current) {
    if (accounts.length > 0) {
      current = accounts[0];
      localStorage.setItem(STORAGE_ACTIVE_ID_KEY, current.id);
    } else {
      current = createDefaultAccount('Red');
      accounts.push(current);
      saveAllAccounts(accounts);
      localStorage.setItem(STORAGE_ACTIVE_ID_KEY, current.id);
    }
  }

  // Ensure newer fields are initialized
  if (typeof current.dailyStreak !== 'number') current.dailyStreak = 1;
  if (typeof current.battleTokens !== 'number') current.battleTokens = 250;
  if (typeof current.exp !== 'number') current.exp = 0;
  if (!current.inventory) current.inventory = {};
  if (!current.flexItems) current.flexItems = [];
  if (!current.claimedDailyStreakDays) current.claimedDailyStreakDays = [];
  if (!current.unlockedTrainerAvatars) current.unlockedTrainerAvatars = ['red'];

  // Recalculate level purely based on EXP
  const expCalc = calculateLevelFromExp(current.exp || 0);
  current.level = expCalc.level;
  if (!current.title || current.title === 'Rookie Pokémon Trainer') {
    current.title = expCalc.rankTitle;
  }

  return current;
}

export function setActiveAccountId(id: string): void {
  localStorage.setItem(STORAGE_ACTIVE_ID_KEY, id);
}

export async function syncAccountToMongo(account: TrainerAccount): Promise<boolean> {
  if (!account.email) return false;
  try {
    const res = await fetch('/api/account/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function saveActiveAccount(account: TrainerAccount): void {
  const accounts = getAllAccounts();
  const idx = accounts.findIndex((a) => a.id === account.id);
  if (idx >= 0) {
    accounts[idx] = account;
  } else {
    accounts.push(account);
  }
  saveAllAccounts(accounts);
  localStorage.setItem(STORAGE_ACTIVE_ID_KEY, account.id);

  // Background sync if connected with MongoDB account
  if (account.email) {
    syncAccountToMongo(account);
  }
}

// Calculate level dynamically based on limitless trophy points
export function calculateLevelFromPoints(points: number): { level: number; rankTitle: string } {
  const level = Math.max(1, Math.floor(Math.sqrt(points / 25)));
  let rankTitle = 'Rookie Trainer';
  if (level >= 30) rankTitle = 'Grand Pokémon Master';
  else if (level >= 20) rankTitle = 'Champion League Star';
  else if (level >= 15) rankTitle = 'Elite Four Prodigy';
  else if (level >= 10) rankTitle = 'Master Ball Ace';
  else if (level >= 5) rankTitle = 'Gym Leader Veteran';
  return { level, rankTitle };
}

// Check and award achievements upon in-game milestones
export function evaluateAchievements(
  account: TrainerAccount,
  params: {
    isCorrect?: boolean;
    streak?: number;
    timeRemaining?: number;
    gameMode?: string;
    pointsScored?: number;
    pokemonTypes?: string[];
    isPaldeanOrParadox?: boolean;
    evolutionOrganized?: boolean;
    cryGuessed?: boolean;
    moveGuessed?: boolean;
    difficulty?: string;
    friendAdded?: boolean;
    is1v1Win?: boolean;
    battlePredicted?: boolean;
    dailyCompleted?: boolean;
    dailyClaimed?: boolean;
  }
): { updatedAccount: TrainerAccount; newUnlocks: string[] } {
  const acc = { ...account };
  const newUnlocks: string[] = [];

  ACHIEVEMENTS_LIST.forEach((ach) => {
    const record = acc.achievements[ach.id] || { progress: 0, unlocked: false };
    if (record.unlocked) return;

    let shouldUnlock = false;

    if (ach.id === 'first_catch' && params.isCorrect) {
      record.progress = 1;
      shouldUnlock = true;
    } else if (ach.id === 'flame_master' && params.pokemonTypes?.includes('fire') && params.isCorrect) {
      record.progress = (record.progress || 0) + 1;
      if (record.progress >= ach.maxProgress) shouldUnlock = true;
    } else if (ach.id === 'water_sovereign' && params.pokemonTypes?.includes('water') && params.isCorrect) {
      record.progress = (record.progress || 0) + 1;
      if (record.progress >= ach.maxProgress) shouldUnlock = true;
    } else if (ach.id === 'grass_guardian' && params.pokemonTypes?.includes('grass') && params.isCorrect) {
      record.progress = (record.progress || 0) + 1;
      if (record.progress >= ach.maxProgress) shouldUnlock = true;
    } else if (ach.id === 'electric_dynamo' && params.pokemonTypes?.includes('electric') && params.isCorrect) {
      record.progress = (record.progress || 0) + 1;
      if (record.progress >= ach.maxProgress) shouldUnlock = true;
    } else if (ach.id === 'psychic_oracle' && params.pokemonTypes?.includes('psychic') && params.isCorrect) {
      record.progress = (record.progress || 0) + 1;
      if (record.progress >= ach.maxProgress) shouldUnlock = true;
    } else if (ach.id === 'dragon_tamer' && params.pokemonTypes?.includes('dragon') && params.isCorrect) {
      record.progress = (record.progress || 0) + 1;
      if (record.progress >= ach.maxProgress) shouldUnlock = true;
    } else if (ach.id === 'ghost_whisperer' && params.pokemonTypes?.includes('ghost') && params.isCorrect) {
      record.progress = (record.progress || 0) + 1;
      if (record.progress >= ach.maxProgress) shouldUnlock = true;
    } else if (ach.id === 'steel_colossus' && params.pokemonTypes?.includes('steel') && params.isCorrect) {
      record.progress = (record.progress || 0) + 1;
      if (record.progress >= ach.maxProgress) shouldUnlock = true;
    } else if (ach.id === 'ice_monarch' && params.pokemonTypes?.includes('ice') && params.isCorrect) {
      record.progress = (record.progress || 0) + 1;
      if (record.progress >= ach.maxProgress) shouldUnlock = true;
    } else if (ach.id === 'fighting_champion' && params.pokemonTypes?.includes('fighting') && params.isCorrect) {
      record.progress = (record.progress || 0) + 1;
      if (record.progress >= ach.maxProgress) shouldUnlock = true;
    } else if (ach.id === 'fairy_enchanter' && params.pokemonTypes?.includes('fairy') && params.isCorrect) {
      record.progress = (record.progress || 0) + 1;
      if (record.progress >= ach.maxProgress) shouldUnlock = true;
    } else if (ach.id === 'aura_awakening' && (params.streak || 0) >= ach.maxProgress) {
      record.progress = params.streak || 0;
      shouldUnlock = true;
    } else if (ach.id === 'streak_decade' && (params.streak || 0) >= 10) {
      record.progress = Math.max(record.progress || 0, params.streak || 0);
      shouldUnlock = true;
    } else if (ach.id === 'streak_zenith' && (params.streak || 0) >= 15) {
      record.progress = Math.max(record.progress || 0, params.streak || 0);
      shouldUnlock = true;
    } else if (ach.id === 'speed_reflexes' && (params.timeRemaining || 0) >= 13.5 && params.isCorrect) {
      record.progress = 1;
      shouldUnlock = true;
    } else if (ach.id === 'sub_second_sniper' && (params.timeRemaining || 0) >= 14.0 && params.isCorrect) {
      record.progress = 1;
      shouldUnlock = true;
    } else if (ach.id === 'evolution_scholar' && params.evolutionOrganized) {
      record.progress = (record.progress || 0) + 1;
      if (record.progress >= ach.maxProgress) shouldUnlock = true;
    } else if (ach.id === 'evolution_mastermind' && params.evolutionOrganized) {
      record.progress = (record.progress || 0) + 1;
      if (record.progress >= ach.maxProgress) shouldUnlock = true;
    } else if (ach.id === 'cry_auditor' && params.cryGuessed) {
      record.progress = (record.progress || 0) + 1;
      if (record.progress >= ach.maxProgress) shouldUnlock = true;
    } else if (ach.id === 'soundwave_maestro' && params.cryGuessed) {
      record.progress = (record.progress || 0) + 1;
      if (record.progress >= ach.maxProgress) shouldUnlock = true;
    } else if (ach.id === 'move_master' && params.moveGuessed) {
      record.progress = (record.progress || 0) + 1;
      if (record.progress >= ach.maxProgress) shouldUnlock = true;
    } else if (ach.id === 'attack_analyst_elite' && params.moveGuessed) {
      record.progress = (record.progress || 0) + 1;
      if (record.progress >= ach.maxProgress) shouldUnlock = true;
    } else if (ach.id === 'legendary_conqueror' && params.gameMode === 'legendary' && (params.pointsScored || 0) >= 2500) {
      record.progress = params.pointsScored || 0;
      shouldUnlock = true;
    } else if (ach.id === 'extreme_codebreaker' && params.difficulty === 'extreme' && params.isCorrect) {
      record.progress = (record.progress || 0) + 1;
      if (record.progress >= ach.maxProgress) shouldUnlock = true;
    } else if (ach.id === 'blitz_champion' && (params.gameMode === 'blitz' || (params.pointsScored || 0) >= 1000)) {
      record.progress = Math.max(record.progress || 0, params.pointsScored || 0);
      if (record.progress >= ach.maxProgress) shouldUnlock = true;
    } else if (ach.id === 'speed_demon_blitz' && (params.gameMode === 'blitz' || (params.pointsScored || 0) >= 1500)) {
      record.progress = Math.max(record.progress || 0, params.pointsScored || 0);
      if (record.progress >= ach.maxProgress) shouldUnlock = true;
    } else if (ach.id === 'hall_of_fame_legend' && (params.pointsScored || 0) >= 5000) {
      record.progress = params.pointsScored || 0;
      shouldUnlock = true;
    } else if (ach.id === 'trainer_fellowship' && params.friendAdded) {
      record.progress = 1;
      shouldUnlock = true;
    } else if (ach.id === 'battle_predictor_ace' && params.battlePredicted) {
      record.progress = (record.progress || 0) + 1;
      if (record.progress >= ach.maxProgress) shouldUnlock = true;
    } else if (ach.id === 'battle_predictor_oracle' && params.battlePredicted) {
      record.progress = (record.progress || 0) + 1;
      if (record.progress >= ach.maxProgress) shouldUnlock = true;
    } else if (ach.id === 'daily_devotee' && (params.dailyCompleted || params.dailyClaimed)) {
      record.progress = 1;
      shouldUnlock = true;
    } else if (ach.id === 'daily_mastery' && params.dailyClaimed) {
      record.progress = (record.progress || 0) + 1;
      if (record.progress >= ach.maxProgress) shouldUnlock = true;
    } else if (ach.id === 'battle_history_veteran' && (acc.battleHistory?.length || 0) >= 10) {
      record.progress = acc.battleHistory?.length || 0;
      shouldUnlock = true;
    } else if (ach.id === 'century_trainer' && (acc.totalCorrect || 0) >= 100) {
      record.progress = acc.totalCorrect || 0;
      shouldUnlock = true;
    } else if (ach.id === 'grandmaster_guesses' && (acc.totalCorrect || 0) >= 250) {
      record.progress = acc.totalCorrect || 0;
      shouldUnlock = true;
    } else if (ach.id === 'ten_victories' && (acc.totalWins || 0) >= 10) {
      record.progress = acc.totalWins || 0;
      shouldUnlock = true;
    } else if (ach.id === 'twenty_five_victories' && (acc.totalWins || 0) >= 25) {
      record.progress = acc.totalWins || 0;
      shouldUnlock = true;
    } else if (ach.id === 'level_five_milestone' && (acc.level || 1) >= 5) {
      record.progress = acc.level || 1;
      shouldUnlock = true;
    } else if (ach.id === 'level_ten_milestone' && (acc.level || 1) >= 10) {
      record.progress = acc.level || 1;
      shouldUnlock = true;
    } else if (ach.id === 'level_twenty_milestone' && (acc.level || 1) >= 20) {
      record.progress = acc.level || 1;
      shouldUnlock = true;
    } else if (ach.id === 'trophy_hoarder' && (acc.trophyPoints || 0) >= 5000) {
      record.progress = acc.trophyPoints || 0;
      shouldUnlock = true;
    } else if (ach.id === 'trophy_tycoon' && (acc.trophyPoints || 0) >= 10000) {
      record.progress = acc.trophyPoints || 0;
      shouldUnlock = true;
    } else if (ach.id === 'grand_creator' && (acc.trophyPoints || 0) >= 3000) {
      record.progress = acc.trophyPoints || 0;
      shouldUnlock = true;
    } else if (ach.id === 'badge_boulder' && (params.streak || 0) >= 3) {
      record.progress = Math.max(record.progress || 0, params.streak || 0);
      if (record.progress >= ach.maxProgress) shouldUnlock = true;
    } else if (ach.id === 'badge_cascade' && params.pokemonTypes?.includes('water') && params.isCorrect) {
      record.progress = (record.progress || 0) + 1;
      if (record.progress >= ach.maxProgress) shouldUnlock = true;
    } else if (ach.id === 'badge_thunder' && ((params.timeRemaining || 0) >= 13.0 || params.gameMode === 'blitz')) {
      record.progress = 1;
      shouldUnlock = true;
    } else if (ach.id === 'badge_rainbow' && params.isCorrect) {
      record.progress = Math.min(ach.maxProgress, (record.progress || 0) + 1);
      if (record.progress >= ach.maxProgress) shouldUnlock = true;
    } else if (ach.id === 'badge_soul' && (params.streak || 0) >= 8) {
      record.progress = Math.max(record.progress || 0, params.streak || 0);
      shouldUnlock = true;
    } else if (ach.id === 'badge_marsh' && params.difficulty === 'extreme' && params.isCorrect) {
      record.progress = 1;
      shouldUnlock = true;
    } else if (ach.id === 'badge_volcano' && (params.is1v1Win || params.gameMode === 'duel')) {
      record.progress = 1;
      shouldUnlock = true;
    } else if (ach.id === 'badge_earth' && (acc.trophyPoints >= 2000 || acc.totalScore >= 2000)) {
      record.progress = Math.max(acc.trophyPoints, acc.totalScore);
      shouldUnlock = true;
    }

    if (shouldUnlock) {
      record.unlocked = true;
      record.unlockedAt = new Date().toISOString();
      newUnlocks.push(ach.title);

      // Award Trophy Points
      acc.trophyPoints += ach.rewardTrophyPoints;
      // Award Trainer EXP for unlocking achievements
      acc.exp = (acc.exp || 0) + Math.max(50, ach.rewardTrophyPoints * 2);

      // Award Avatar reward
      if (ach.rewardAvatarId && !acc.unlockedAvatars.includes(ach.rewardAvatarId)) {
        acc.unlockedAvatars.push(ach.rewardAvatarId);
      }

      // Award Trainer Avatar rewards from Gym Badges and Achievements
      if (!acc.unlockedTrainerAvatars) acc.unlockedTrainerAvatars = ['red', 'pikachu'];
      const BADGE_TO_TRAINER_MAP: Record<string, string> = {
        badge_boulder: 'brock',
        badge_cascade: 'misty',
        badge_thunder: 'ltsurge',
        badge_rainbow: 'erika',
        badge_soul: 'koga',
        badge_marsh: 'sabrina',
        badge_volcano: 'blaine',
        badge_earth: 'giovanni',
        badge_zephyr: 'falkner',
        badge_hive: 'bugsy',
        badge_plain: 'whitney',
        badge_fog: 'morty',
        badge_storm: 'chuck',
        badge_mineral: 'jasmine',
        badge_glacier: 'pryce',
        badge_rising: 'clair',
        badge_stone: 'roxanne',
        badge_knuckle: 'brawly',
        badge_dynamo: 'wattson',
        badge_heat: 'flannery',
        badge_balance: 'norman',
        badge_feather: 'winona',
        badge_mind: 'tate',
        badge_rain: 'wallace',
        badge_coal: 'roark',
        badge_forest: 'gardenia',
        badge_cobble: 'maylene',
        badge_fen: 'crasherwake',
        badge_relic: 'fantina',
        badge_mine: 'byron',
        badge_icicle: 'candice',
        badge_beacon: 'volkner',
        badge_trio: 'cilan',
        badge_basic: 'lenora',
        badge_insect: 'burgh',
        badge_bolt: 'elesa',
        badge_quake: 'clay',
        badge_jet: 'skyla',
        badge_freeze: 'brycen',
        badge_legend: 'drayden',
        badge_rumble: 'korrina',
        badge_voltage: 'clemont',
        badge_fairy: 'valerie',
      };

      const leaderId = BADGE_TO_TRAINER_MAP[ach.id];
      if (leaderId && !acc.unlockedTrainerAvatars.includes(leaderId)) {
        acc.unlockedTrainerAvatars.push(leaderId);
      }

      // Award Song reward
      if (ach.rewardSongId && !acc.unlockedSongIds.includes(ach.rewardSongId)) {
        acc.unlockedSongIds.push(ach.rewardSongId);
      }
    }

    acc.achievements[ach.id] = record;
  });

  // Trophy Road Milestone Free Avatars Auto-Unlock Check
  const unlockedTrainers = acc.unlockedTrainerAvatars || ['red', 'pikachu'];
  acc.unlockedTrainerAvatars = unlockedTrainers;
  const TROPHY_ROAD_FREE_AVATARS: [number, string][] = [
    [1000, 'erika'],
    [2500, 'lance'],
    [5000, 'jasmine'],
    [7500, 'flannery'],
    [10000, 'dawn'],
    [15000, 'elesa'],
    [20000, 'korrina'],
    [25000, 'iris'],
    [30000, 'diantha'],
    [50000, 'blue'],
    [75000, 'cynthia'],
    [100000, 'ash'],
  ];

  TROPHY_ROAD_FREE_AVATARS.forEach(([reqTP, trainerId]) => {
    if (acc.trophyPoints >= reqTP && !unlockedTrainers.includes(trainerId)) {
      unlockedTrainers.push(trainerId);
    }
  });

  const { level, rankTitle } = calculateLevelFromExp(acc.exp || 0);
  acc.level = level;
  if (!acc.title || acc.title === 'Rookie Pokémon Trainer') {
    acc.title = rankTitle;
  }

  saveActiveAccount(acc);
  return { updatedAccount: acc, newUnlocks };
}

// Add a battle to the trainer's battle history (maximum 25 entries; FIFO)
export function addBattleToHistory(
  account: TrainerAccount,
  battle: Omit<BattleRecord, 'id' | 'timestamp'>
): { updatedAccount: TrainerAccount; newUnlocks: string[] } {
  const newRecord: BattleRecord = {
    id: `battle_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...battle,
  };

  const existing = account.battleHistory || [];
  // Keep up to 25. After the 26th battle, the first/oldest battle is removed from history (FIFO)
  const updatedHistory = [newRecord, ...existing].slice(0, 25);

  const accWithBattle: TrainerAccount = {
    ...account,
    battleHistory: updatedHistory,
    totalGames: (account.totalGames || 0) + 1,
    totalWins: battle.result === 'victory' ? (account.totalWins || 0) + 1 : (account.totalWins || 0),
    battleTokens: (account.battleTokens || 0) + (battle.rewardTokens || 0),
    trophyPoints: (account.trophyPoints || 0) + (battle.rewardTP || 0),
  };

  return evaluateAchievements(accWithBattle, {
    is1v1Win: battle.result === 'victory',
    pointsScored: battle.playerScore,
  });
}
