import { TrainerAccount } from '../types/pokemon';

/**
 * EXP to level formula:
 * Level 1 -> 2: 100 EXP
 * Level 2 -> 3: 150 EXP
 * Level 3 -> 4: 200 EXP
 * Level L -> L+1: 100 + (L - 1) * 50 EXP
 */
export function getExpRequiredForNextLevel(level: number): number {
  return 100 + Math.max(0, level - 1) * 50;
}

export interface ExpCalculation {
  level: number;
  currentLevelExp: number;
  expNeededForNextLevel: number;
  expToNextLevel: number;
  progressPercent: number;
  rankTitle: string;
}

export function getRankTitleForLevel(level: number): string {
  if (level >= 50) return 'Grand Pokémon Master';
  if (level >= 40) return 'League Champion Star';
  if (level >= 30) return 'Elite Four Veteran';
  if (level >= 20) return 'Gym Leader Master';
  if (level >= 15) return 'Ace Tournament Contender';
  if (level >= 10) return 'Expert Route Trainer';
  if (level >= 5) return 'Gym Challenger';
  return 'Rookie Pokémon Trainer';
}

/**
 * Compute the trainer level and progress solely based on cumulative EXP.
 */
export function calculateLevelFromExp(totalExp: number): ExpCalculation {
  let level = 1;
  let remainingExp = Math.max(0, totalExp || 0);

  while (true) {
    const needed = getExpRequiredForNextLevel(level);
    if (remainingExp >= needed) {
      remainingExp -= needed;
      level += 1;
    } else {
      break;
    }
  }

  const expNeededForNextLevel = getExpRequiredForNextLevel(level);
  const currentLevelExp = remainingExp;
  const expToNextLevel = expNeededForNextLevel - currentLevelExp;
  const progressPercent = Math.min(100, Math.max(0, (currentLevelExp / expNeededForNextLevel) * 100));
  const rankTitle = getRankTitleForLevel(level);

  return {
    level,
    currentLevelExp,
    expNeededForNextLevel,
    expToNextLevel,
    progressPercent,
    rankTitle,
  };
}

/**
 * Add EXP to a trainer account, recomputing level and returning whether a level-up occurred.
 */
export function addExpToAccount(
  account: TrainerAccount,
  amount: number
): {
  updatedAccount: TrainerAccount;
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  expGained: number;
} {
  const currentExp = account.exp || 0;
  const oldCalc = calculateLevelFromExp(currentExp);
  const newExp = currentExp + amount;
  const newCalc = calculateLevelFromExp(newExp);

  const leveledUp = newCalc.level > oldCalc.level;

  const updatedAccount: TrainerAccount = {
    ...account,
    exp: newExp,
    level: newCalc.level,
    title:
      !account.title || account.title === 'Rookie Pokémon Trainer' || account.title === oldCalc.rankTitle
        ? newCalc.rankTitle
        : account.title,
  };

  return {
    updatedAccount,
    leveledUp,
    oldLevel: oldCalc.level,
    newLevel: newCalc.level,
    expGained: amount,
  };
}
