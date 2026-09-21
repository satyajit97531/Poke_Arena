import { TrainerAccount } from '../types/pokemon';
import { getISTDateString, getTimeUntilNextISTMidnight } from './dailyStreak';
import { evaluateAchievements, saveActiveAccount } from './accounts';

export interface DailyMissionTemplate {
  id: string;
  title: string;
  description: string;
  target: number;
  rewardTokens: number;
  rewardExp: number;
  category: 'games' | 'types' | 'speed' | 'streak' | 'battle' | 'score';
}

export const DAILY_MISSION_TEMPLATES: DailyMissionTemplate[] = [
  {
    id: 'daily_games',
    title: 'Daily Training Session',
    description: 'Play 3 quiz or sub-game rounds in any mode.',
    target: 3,
    rewardTokens: 150,
    rewardExp: 50,
    category: 'games',
  },
  {
    id: 'daily_types',
    title: 'Elemental Affinity',
    description: 'Correctly identify 5 Fire, Water, or Grass-type Pokémon.',
    target: 5,
    rewardTokens: 200,
    rewardExp: 75,
    category: 'types',
  },
  {
    id: 'daily_speed',
    title: 'Lightning Reflexes',
    description: 'Correctly guess a Pokémon with 10+ seconds on the clock.',
    target: 1,
    rewardTokens: 150,
    rewardExp: 50,
    category: 'speed',
  },
  {
    id: 'daily_streak',
    title: 'Focus Mastery',
    description: 'Build a streak of 5 consecutive correct answers.',
    target: 5,
    rewardTokens: 250,
    rewardExp: 100,
    category: 'streak',
  },
  {
    id: 'daily_battle',
    title: 'Colosseum Gladiator',
    description: 'Complete a 1v1 PvP Duel or Battle Predictor simulation.',
    target: 1,
    rewardTokens: 200,
    rewardExp: 80,
    category: 'battle',
  },
  {
    id: 'daily_score',
    title: 'Apex Scorer',
    description: 'Score 1,000+ total points in games today.',
    target: 1000,
    rewardTokens: 300,
    rewardExp: 120,
    category: 'score',
  },
];

export interface ActiveDailyMission extends DailyMissionTemplate {
  progress: number;
  completed: boolean;
  claimed: boolean;
}

export const ALL_MISSIONS_BONUS = {
  tokens: 500,
  trophyPoints: 200,
  exp: 250,
};

/**
 * Returns today's active missions for the trainer account.
 * Automatically resets every 24 hours at 00:00:00 IST (Indian Standard Time).
 */
export function getTodayDailyMissions(account: TrainerAccount): {
  missions: ActiveDailyMission[];
  dateIST: string;
  allClaimed: boolean;
  allCompleted: boolean;
  canClaimAllBonus: boolean;
  hasUnclaimedRewards: boolean;
  unclaimedCount: number;
  timeUntilReset: string;
} {
  const todayIST = getISTDateString();
  const resetCountdown = getTimeUntilNextISTMidnight();

  const isCurrentDay = account.dailyMissions?.dateIST === todayIST;
  const storedMissions = isCurrentDay ? account.dailyMissions?.missions || {} : {};

  const missions: ActiveDailyMission[] = DAILY_MISSION_TEMPLATES.map((tmpl) => {
    const record = storedMissions[tmpl.id] || { progress: 0, completed: false, claimed: false };
    const progress = Math.min(tmpl.target, record.progress || 0);
    const completed = progress >= tmpl.target || Boolean(record.completed);
    const claimed = Boolean(record.claimed);

    return {
      ...tmpl,
      progress,
      completed,
      claimed,
    };
  });

  const allCompleted = missions.every((m) => m.completed);
  const allMissionsClaimed = missions.every((m) => m.claimed);
  const bonusClaimed = Boolean(isCurrentDay && account.dailyMissions?.allClaimed);
  const canClaimAllBonus = allCompleted && !bonusClaimed;

  const unclaimedCount = missions.filter((m) => m.completed && !m.claimed).length + (canClaimAllBonus ? 1 : 0);
  const hasUnclaimedRewards = unclaimedCount > 0;

  return {
    missions,
    dateIST: todayIST,
    allClaimed: allMissionsClaimed && bonusClaimed,
    allCompleted,
    canClaimAllBonus,
    hasUnclaimedRewards,
    unclaimedCount,
    timeUntilReset: resetCountdown.formatted,
  };
}

/**
 * Updates daily mission progress based on gameplay events
 */
export function recordDailyMissionEvent(
  account: TrainerAccount,
  events: {
    gamePlayed?: boolean;
    isCorrect?: boolean;
    pokemonTypes?: string[];
    timeRemaining?: number;
    streak?: number;
    battleCompleted?: boolean;
    scoreEarned?: number;
  }
): TrainerAccount {
  const todayIST = getISTDateString();
  const isCurrentDay = account.dailyMissions?.dateIST === todayIST;

  // If new IST day, reset missions
  const currentRecord = isCurrentDay && account.dailyMissions
    ? { ...account.dailyMissions.missions }
    : {};

  let changed = !isCurrentDay;

  DAILY_MISSION_TEMPLATES.forEach((tmpl) => {
    const prev = currentRecord[tmpl.id] || { progress: 0, completed: false, claimed: false };
    let newProgress = prev.progress;

    if (tmpl.id === 'daily_games' && events.gamePlayed) {
      newProgress += 1;
    } else if (tmpl.id === 'daily_types' && events.isCorrect && events.pokemonTypes) {
      const isElemental = events.pokemonTypes.some((t) =>
        ['fire', 'water', 'grass'].includes(t.toLowerCase())
      );
      if (isElemental) newProgress += 1;
    } else if (tmpl.id === 'daily_speed' && events.isCorrect && (events.timeRemaining || 0) >= 10) {
      newProgress = 1;
    } else if (tmpl.id === 'daily_streak' && (events.streak || 0) > 0) {
      newProgress = Math.max(newProgress, events.streak || 0);
    } else if (tmpl.id === 'daily_battle' && events.battleCompleted) {
      newProgress += 1;
    } else if (tmpl.id === 'daily_score' && (events.scoreEarned || 0) > 0) {
      newProgress += events.scoreEarned || 0;
    }

    newProgress = Math.min(tmpl.target, newProgress);
    const completed = newProgress >= tmpl.target;

    if (newProgress !== prev.progress || completed !== prev.completed) {
      currentRecord[tmpl.id] = {
        progress: newProgress,
        completed,
        claimed: prev.claimed,
      };
      changed = true;
    } else if (!currentRecord[tmpl.id]) {
      currentRecord[tmpl.id] = prev;
    }
  });

  if (!changed) return account;

  const updated: TrainerAccount = {
    ...account,
    dailyMissions: {
      dateIST: todayIST,
      missions: currentRecord,
      allClaimed: isCurrentDay ? account.dailyMissions?.allClaimed : false,
    },
  };

  saveActiveAccount(updated);
  return updated;
}

/**
 * Claim reward for a single completed daily mission
 */
export function claimDailyMission(
  account: TrainerAccount,
  missionId: string
): { updatedAccount: TrainerAccount; rewardTokens: number; rewardExp: number; newUnlocks: string[] } {
  const tmpl = DAILY_MISSION_TEMPLATES.find((t) => t.id === missionId);
  if (!tmpl) {
    return { updatedAccount: account, rewardTokens: 0, rewardExp: 0, newUnlocks: [] };
  }

  const todayIST = getISTDateString();
  const missions = account.dailyMissions?.missions ? { ...account.dailyMissions.missions } : {};
  const current = missions[missionId] || { progress: 0, completed: false, claimed: false };

  if (!current.completed || current.claimed) {
    return { updatedAccount: account, rewardTokens: 0, rewardExp: 0, newUnlocks: [] };
  }

  missions[missionId] = {
    ...current,
    claimed: true,
  };

  const updatedTokens = (account.battleTokens || 0) + tmpl.rewardTokens;
  const updatedExp = (account.exp || 0) + tmpl.rewardExp;

  const intermediateAccount: TrainerAccount = {
    ...account,
    battleTokens: updatedTokens,
    exp: updatedExp,
    dailyMissions: {
      dateIST: todayIST,
      missions,
      allClaimed: account.dailyMissions?.allClaimed,
    },
  };

  const { updatedAccount, newUnlocks } = evaluateAchievements(intermediateAccount, {
    dailyClaimed: true,
  });

  saveActiveAccount(updatedAccount);
  return {
    updatedAccount,
    rewardTokens: tmpl.rewardTokens,
    rewardExp: tmpl.rewardExp,
    newUnlocks,
  };
}

/**
 * Claim the grand bonus for completing all 6 daily missions
 */
export function claimAllDailyMissionsBonus(account: TrainerAccount): {
  updatedAccount: TrainerAccount;
  bonusTokens: number;
  bonusTP: number;
  bonusExp: number;
  newUnlocks: string[];
} {
  const { allCompleted, canClaimAllBonus } = getTodayDailyMissions(account);
  if (!allCompleted || !canClaimAllBonus) {
    return {
      updatedAccount: account,
      bonusTokens: 0,
      bonusTP: 0,
      bonusExp: 0,
      newUnlocks: [],
    };
  }

  const todayIST = getISTDateString();
  const missions = account.dailyMissions?.missions ? { ...account.dailyMissions.missions } : {};

  const intermediateAccount: TrainerAccount = {
    ...account,
    battleTokens: (account.battleTokens || 0) + ALL_MISSIONS_BONUS.tokens,
    trophyPoints: (account.trophyPoints || 0) + ALL_MISSIONS_BONUS.trophyPoints,
    exp: (account.exp || 0) + ALL_MISSIONS_BONUS.exp,
    dailyMissions: {
      dateIST: todayIST,
      missions,
      allClaimed: true,
    },
  };

  const { updatedAccount, newUnlocks } = evaluateAchievements(intermediateAccount, {
    dailyCompleted: true,
    dailyClaimed: true,
  });

  saveActiveAccount(updatedAccount);
  return {
    updatedAccount,
    bonusTokens: ALL_MISSIONS_BONUS.tokens,
    bonusTP: ALL_MISSIONS_BONUS.trophyPoints,
    bonusExp: ALL_MISSIONS_BONUS.exp,
    newUnlocks,
  };
}
