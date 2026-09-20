import { ACHIEVEMENTS_LIST } from '../data/achievements';
import { POKEMON_TRACKS } from '../data/songs';
import { TrainerAccount } from '../types/pokemon';

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
  if (!current.inventory) current.inventory = {};
  if (!current.claimedDailyStreakDays) current.claimedDailyStreakDays = [];
  if (!current.unlockedTrainerAvatars) current.unlockedTrainerAvatars = ['red'];

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
    } else if (ach.id === 'aura_awakening' && (params.streak || 0) >= ach.maxProgress) {
      record.progress = params.streak || 0;
      shouldUnlock = true;
    } else if (ach.id === 'speed_reflexes' && (params.timeRemaining || 0) >= 13.5 && params.isCorrect) {
      record.progress = 1;
      shouldUnlock = true;
    } else if (ach.id === 'evolution_scholar' && params.evolutionOrganized) {
      record.progress = (record.progress || 0) + 1;
      if (record.progress >= ach.maxProgress) shouldUnlock = true;
    } else if (ach.id === 'cry_auditor' && params.cryGuessed) {
      record.progress = (record.progress || 0) + 1;
      if (record.progress >= ach.maxProgress) shouldUnlock = true;
    } else if (ach.id === 'move_master' && params.moveGuessed) {
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
    } else if (ach.id === 'trainer_fellowship' && params.friendAdded) {
      record.progress = 1;
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

      // Award Avatar reward
      if (ach.rewardAvatarId && !acc.unlockedAvatars.includes(ach.rewardAvatarId)) {
        acc.unlockedAvatars.push(ach.rewardAvatarId);
      }

      // Award Song reward
      if (ach.rewardSongId && !acc.unlockedSongIds.includes(ach.rewardSongId)) {
        acc.unlockedSongIds.push(ach.rewardSongId);
      }
    }

    acc.achievements[ach.id] = record;
  });

  const { level, rankTitle } = calculateLevelFromPoints(acc.trophyPoints);
  acc.level = level;
  if (!acc.title || acc.title === 'Rookie Pokémon Trainer') {
    acc.title = rankTitle;
  }

  saveActiveAccount(acc);
  return { updatedAccount: acc, newUnlocks };
}
