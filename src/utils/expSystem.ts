import { GameDifficulty, MainGameMode, TrainerAccount } from '../types/pokemon';

/**
 * Returns the EXP multiplier based on game difficulty.
 * Guaranteed strictly increasing: easy < medium < hard < extreme < menacing
 * The more the increase in difficulty, the greater the EXP obtained.
 */
export function getDifficultyExpMultiplier(difficulty: GameDifficulty = 'easy'): number {
  switch (difficulty) {
    case 'easy':
      return 1.0;
    case 'medium':
      return 1.6;
    case 'hard':
      return 2.6;
    case 'extreme':
      return 4.5;
    case 'menacing':
      return 7.5;
    default:
      return 1.0;
  }
}

/**
 * Calculate EXP awarded across any game mode with difficulty scaling.
 */
export function calculateModeExp(
  mode: MainGameMode | '1v1_battle',
  difficulty: GameDifficulty = 'easy',
  isPerfect: boolean = true,
  isDoubleExp: boolean = false
): number {
  const multiplier = getDifficultyExpMultiplier(difficulty);
  let baseExp = 40;

  switch (mode) {
    case 'classic':
    case 'legendary':
    case 'blitz':
    case 'survival':
    case 'zen':
      baseExp = 35;
      break;
    case 'evolution':
      baseExp = isPerfect ? 120 : 50;
      break;
    case 'cry':
      baseExp = isPerfect ? 110 : 45;
      break;
    case 'moves':
      baseExp = isPerfect ? 115 : 45;
      break;
    case 'region_guess':
      baseExp = isPerfect ? 105 : 40;
      break;
    case 'type_guess':
      baseExp = isPerfect ? 105 : 40;
      break;
    case 'battle':
      baseExp = isPerfect ? 120 : 50;
      break;
    case '1v1':
    case '1v1_battle':
      baseExp = isPerfect ? 220 : 90;
      break;
    default:
      baseExp = 50;
  }

  const calculated = Math.round(baseExp * multiplier);
  return calculated * (isDoubleExp ? 2 : 1);
}

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
