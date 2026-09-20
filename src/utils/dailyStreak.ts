import { TrainerAccount } from '../types/pokemon';

export interface DailyStreakReward {
  day: number;
  title: string;
  description: string;
  tokens: number;
  trainerAvatarId?: string;
  trainerAvatarName?: string;
  specialItem?: string;
  badgeName?: string;
  badgeColor?: string;
  iconUrl?: string;
}

export const DAILY_STREAK_REWARDS: DailyStreakReward[] = [
  {
    day: 1,
    title: "Day 1: Pewter Foundation",
    description: "Welcome back! Begin your legendary journey with Gym Leader Brock.",
    tokens: 150,
    trainerAvatarId: 'brock',
    trainerAvatarName: 'Brock',
    badgeName: 'Pewter Granite Pin',
    badgeColor: 'from-stone-500 to-zinc-700',
    specialItem: 'Sturdy Rock Charm',
    iconUrl: 'https://play.pokemonshowdown.com/sprites/trainers/brock.png',
  },
  {
    day: 3,
    title: "Day 3: Cerulean Torrent",
    description: "Keep the momentum going with Water Gym Leader Misty.",
    tokens: 300,
    trainerAvatarId: 'misty',
    trainerAvatarName: 'Misty',
    badgeName: 'Cascade Aquamarine Ring',
    badgeColor: 'from-cyan-400 to-blue-600',
    specialItem: 'Mystic Water Droplet',
    iconUrl: 'https://play.pokemonshowdown.com/sprites/trainers/misty.png',
  },
  {
    day: 7,
    title: "Day 7: Sinnoh Starlet",
    description: "One full week of devotion! Claim Dawn from Twinleaf Town.",
    tokens: 600,
    trainerAvatarId: 'dawn',
    trainerAvatarName: 'Dawn',
    badgeName: 'Sinnoh Ribbon of Fortitude',
    badgeColor: 'from-pink-400 to-rose-600',
    specialItem: 'Contest Master Scarf',
    iconUrl: 'https://play.pokemonshowdown.com/sprites/trainers/dawn.png',
  },
  {
    day: 14,
    title: "Day 14: Champion from Pallet",
    description: "Two weeks strong! Unlock Ash Ketchum and an enormous coin bounty.",
    tokens: 1200,
    trainerAvatarId: 'ash',
    trainerAvatarName: 'Ash Ketchum',
    badgeName: 'Kanto Champion Cap',
    badgeColor: 'from-red-500 to-blue-600',
    specialItem: 'Pikachu Friendship Band',
    iconUrl: 'https://play.pokemonshowdown.com/sprites/trainers/ash.png',
  },
  {
    day: 21,
    title: "Day 21: Viridian Forest Whisper",
    description: "Three weeks of training! Unlock Leaf and the sacred Silph Charm.",
    tokens: 1800,
    trainerAvatarId: 'leaf',
    trainerAvatarName: 'Leaf',
    badgeName: 'Viridian Leaf Sigil',
    badgeColor: 'from-emerald-400 to-teal-700',
    specialItem: 'Silph Scope Relic',
    iconUrl: 'https://play.pokemonshowdown.com/sprites/trainers/green.png',
  },
  {
    day: 25,
    title: "Day 25: Champion Rival's Pride",
    description: "25-Day Milestone! Unlock Blue (Rival) and a massive treasure horde.",
    tokens: 2500,
    trainerAvatarId: 'blue',
    trainerAvatarName: 'Blue (Rival)',
    badgeName: "Oak's Oak-Leaf Pin",
    badgeColor: 'from-purple-500 to-indigo-800',
    specialItem: 'Champion Mantle',
    iconUrl: 'https://play.pokemonshowdown.com/sprites/trainers/blue.png',
  },
  {
    day: 30,
    title: "Day 30+: Sovereign of Mt. Silver",
    description: "Ultimate 30-Day Devotion! Unlock Legendary Trainer Red.",
    tokens: 4000,
    trainerAvatarId: 'red',
    trainerAvatarName: 'Red (Legendary)',
    badgeName: 'Mt. Silver Sun Crest',
    badgeColor: 'from-amber-400 via-rose-500 to-red-700',
    specialItem: 'Master Crown of Kanto',
    iconUrl: 'https://play.pokemonshowdown.com/sprites/trainers/red.png',
  },
];

/**
 * Returns YYYY-MM-DD in Indian Standard Time (IST - UTC + 5:30)
 */
export function getISTDateString(date: Date = new Date()): string {
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffsetMs);
  return istDate.toISOString().split('T')[0];
}

/**
 * Returns previous day's YYYY-MM-DD in Indian Standard Time
 */
export function getISTYesterdayDateString(date: Date = new Date()): string {
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const yesterday = new Date(date.getTime() + istOffsetMs - 24 * 60 * 60 * 1000);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Calculates countdown time to next 00:00:00 IST
 */
export function getTimeUntilNextISTMidnight(): { hours: number; minutes: number; seconds: number; formatted: string } {
  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffsetMs);

  // Next midnight in IST
  const nextMidnightIST = new Date(istNow);
  nextMidnightIST.setUTCHours(24, 0, 0, 0);

  const diffMs = Math.max(0, nextMidnightIST.getTime() - istNow.getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  const pad = (n: number) => n.toString().padStart(2, '0');
  return {
    hours,
    minutes,
    seconds,
    formatted: `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`,
  };
}

/**
 * Updates daily streak in 24h IST cycle and checks for uncollected rewards
 */
export function checkAndUpdateDailyStreak(account: TrainerAccount): {
  updatedAccount: TrainerAccount;
  isNewDay: boolean;
  unclaimedRewards: DailyStreakReward[];
} {
  const todayIST = getISTDateString();
  const yesterdayIST = getISTYesterdayDateString();

  let streak = account.dailyStreak || 0;
  const lastLogin = account.lastLoginDateIST || '';
  const claimedDays = account.claimedDailyStreakDays || [];
  let isNewDay = false;

  if (!lastLogin) {
    // First time opening with IST system
    streak = 1;
    isNewDay = true;
  } else if (lastLogin === todayIST) {
    // Already logged in today IST
    isNewDay = false;
  } else if (lastLogin === yesterdayIST) {
    // Consecutive day in IST
    streak += 1;
    isNewDay = true;
  } else {
    // Missed a day or more: reset streak to 1
    streak = 1;
    isNewDay = true;
  }

  const updatedAccount: TrainerAccount = {
    ...account,
    dailyStreak: streak,
    lastLoginDateIST: todayIST,
    claimedDailyStreakDays: claimedDays,
    battleTokens: account.battleTokens ?? 200, // Initial bonus if new
    inventory: account.inventory || {},
    unlockedTrainerAvatars: account.unlockedTrainerAvatars || [],
  };

  // Find rewards that user has earned up to their current streak but hasn't claimed yet
  const unclaimedRewards = DAILY_STREAK_REWARDS.filter(
    (r) => r.day <= streak && !claimedDays.includes(r.day)
  );

  return { updatedAccount, isNewDay, unclaimedRewards };
}

/**
 * Claims a daily streak reward
 */
export function claimStreakReward(
  account: TrainerAccount,
  day: number
): { updatedAccount: TrainerAccount; reward: DailyStreakReward | null } {
  const reward = DAILY_STREAK_REWARDS.find((r) => r.day === day);
  if (!reward) return { updatedAccount: account, reward: null };

  const alreadyClaimed = (account.claimedDailyStreakDays || []).includes(day);
  if (alreadyClaimed) return { updatedAccount: account, reward: null };

  const nextClaimedDays = [...(account.claimedDailyStreakDays || []), day];
  const nextTokens = (account.battleTokens || 0) + reward.tokens;
  const nextTrainerAvatars = [...(account.unlockedTrainerAvatars || [])];

  if (reward.trainerAvatarId && !nextTrainerAvatars.includes(reward.trainerAvatarId)) {
    nextTrainerAvatars.push(reward.trainerAvatarId);
  }

  const nextInventory = { ...(account.inventory || {}) };
  if (reward.specialItem) {
    nextInventory[reward.specialItem] = (nextInventory[reward.specialItem] || 0) + 1;
  }

  const updatedAccount: TrainerAccount = {
    ...account,
    battleTokens: nextTokens,
    claimedDailyStreakDays: nextClaimedDays,
    unlockedTrainerAvatars: nextTrainerAvatars,
    inventory: nextInventory,
  };

  return { updatedAccount, reward };
}
