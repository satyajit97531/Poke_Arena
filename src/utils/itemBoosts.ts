import { TrainerAccount } from '../types/pokemon';
import { addExpToAccount } from './expSystem';
import { saveActiveAccount } from './accounts';

export type BoostType =
  | 'double_trophies' // x2 Trophies for 5 minutes
  | 'double_tokens'   // x2 Coins (Battle Tokens) for 5 minutes
  | 'double_exp'      // x2 EXP for 5 minutes
  | 'extra_time'      // +10s on question countdowns for 5 minutes
  | 'streak_shield'   // Protects streak on wrong guess for 5 minutes
  | 'lunar_hints'     // Highlights type & region clues for 5 minutes
  | 'mega_score';     // x2 Score in sub-games and quiz for 5 minutes

export interface ActiveBoost {
  type: BoostType;
  name: string;
  icon: string;
  expiresAt: number; // Unix timestamp ms
  durationMinutes: number;
}

const STORAGE_BOOSTS_KEY = 'poke_quiz_active_boosts_v2';

export function getActiveBoosts(): ActiveBoost[] {
  try {
    const raw = localStorage.getItem(STORAGE_BOOSTS_KEY);
    if (!raw) return [];
    const list: ActiveBoost[] = JSON.parse(raw);
    const now = Date.now();
    // Filter out expired boosts
    const valid = list.filter((b) => b.expiresAt > now);
    if (valid.length !== list.length) {
      localStorage.setItem(STORAGE_BOOSTS_KEY, JSON.stringify(valid));
    }
    return valid;
  } catch {
    return [];
  }
}

export function isBoostActive(type: BoostType): boolean {
  return getActiveBoosts().some((b) => b.type === type);
}

export function getBoostRemainingSeconds(type: BoostType): number {
  const boost = getActiveBoosts().find((b) => b.type === type);
  if (!boost) return 0;
  return Math.max(0, Math.floor((boost.expiresAt - Date.now()) / 1000));
}

export function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function activateTimedBoost(
  type: BoostType,
  name: string,
  icon: string,
  minutes: number = 5
): ActiveBoost {
  const current = getActiveBoosts().filter((b) => b.type !== type);
  const expiresAt = Date.now() + minutes * 60 * 1000;
  const newBoost: ActiveBoost = {
    type,
    name,
    icon,
    expiresAt,
    durationMinutes: minutes,
  };
  current.push(newBoost);
  localStorage.setItem(STORAGE_BOOSTS_KEY, JSON.stringify(current));
  return newBoost;
}

export function consumeInventoryItem(
  account: TrainerAccount,
  itemId: string,
  quantity: number = 1
): { updatedAccount: TrainerAccount; success: boolean } {
  const inventory = { ...(account.inventory || {}) };
  const currentQty = inventory[itemId] || 0;
  if (currentQty < quantity) {
    return { updatedAccount: account, success: false };
  }

  const nextQty = currentQty - quantity;
  if (nextQty <= 0) {
    delete inventory[itemId];
  } else {
    inventory[itemId] = nextQty;
  }

  const updatedAccount: TrainerAccount = {
    ...account,
    inventory,
  };

  saveActiveAccount(updatedAccount);
  return { updatedAccount, success: true };
}

export interface ItemUsageResult {
  success: boolean;
  message: string;
  updatedAccount: TrainerAccount;
  boostActivated?: BoostType;
  leveledUp?: boolean;
}

/**
 * Handle using an item from the trainer bag.
 */
export function useItemFromInventory(
  account: TrainerAccount,
  itemId: string
): ItemUsageResult {
  const inventory = account.inventory || {};
  const qty = inventory[itemId] || 0;
  if (qty <= 0) {
    return {
      success: false,
      message: "You do not have any of this item in your bag!",
      updatedAccount: account,
    };
  }

  // 1. Water Stone -> x2 Trophies for 5 minutes
  if (itemId === 'item_water_stone') {
    const { updatedAccount } = consumeInventoryItem(account, itemId);
    activateTimedBoost('double_trophies', 'Aquatic Surge (x2 Trophies)', '💧', 5);
    return {
      success: true,
      message: 'Activated Aquatic Surge! You earn x2 Trophies (TP) for the next 5 minutes.',
      updatedAccount,
      boostActivated: 'double_trophies',
    };
  }

  // 2. Fire Stone -> x2 Coins (Battle Tokens) for 5 minutes
  if (itemId === 'item_fire_stone' || itemId === 'item_amulet_coin') {
    const { updatedAccount } = consumeInventoryItem(account, itemId);
    activateTimedBoost('double_tokens', 'Blazing Prosperity (x2 Coins)', '🔥', 5);
    return {
      success: true,
      message: 'Activated Blazing Prosperity! You earn x2 Battle Tokens for the next 5 minutes.',
      updatedAccount,
      boostActivated: 'double_tokens',
    };
  }

  // 3. Thunder Stone -> x2 EXP for 5 minutes
  if (itemId === 'item_thunder_stone' || itemId === 'item_exp_share') {
    const { updatedAccount } = consumeInventoryItem(account, itemId);
    activateTimedBoost('double_exp', 'Thunderous Surge (x2 EXP)', '⚡', 5);
    return {
      success: true,
      message: 'Activated Thunderous Surge! You earn x2 EXP towards leveling up for the next 5 minutes.',
      updatedAccount,
      boostActivated: 'double_exp',
    };
  }

  // 4. Ice Stone -> Cryo Freeze (+10s Time Boost) for 5 minutes
  if (itemId === 'item_ice_stone') {
    const { updatedAccount } = consumeInventoryItem(account, itemId);
    activateTimedBoost('extra_time', 'Cryo Freeze (+10s Timer)', '❄️', 5);
    return {
      success: true,
      message: 'Activated Cryo Freeze! +10 extra seconds added to all quiz questions for 5 minutes.',
      updatedAccount,
      boostActivated: 'extra_time',
    };
  }

  // 5. Moon Stone -> Lunar Sight (Hints automatically revealed) for 5 minutes
  if (itemId === 'item_moon_stone') {
    const { updatedAccount } = consumeInventoryItem(account, itemId);
    activateTimedBoost('lunar_hints', 'Lunar Sight (Auto Hints)', '🌙', 5);
    return {
      success: true,
      message: 'Activated Lunar Sight! Pokémon types and regions are revealed automatically for 5 minutes.',
      updatedAccount,
      boostActivated: 'lunar_hints',
    };
  }

  // 6. Sun Stone -> Streak Shield & Double Trophies for 5 minutes
  if (itemId === 'item_sun_stone') {
    const { updatedAccount } = consumeInventoryItem(account, itemId);
    activateTimedBoost('streak_shield', 'Solar Radiance (Streak Shield)', '☀️', 5);
    return {
      success: true,
      message: 'Activated Solar Radiance! Your quiz win streak is shielded from wrong guesses for 5 minutes.',
      updatedAccount,
      boostActivated: 'streak_shield',
    };
  }

  // 7. Leaf Stone -> Verdant Vitality (Survival Mode Shield) for 5 minutes
  if (itemId === 'item_leaf_stone') {
    const { updatedAccount } = consumeInventoryItem(account, itemId);
    activateTimedBoost('streak_shield', 'Verdant Guard (Shield)', '🍃', 5);
    return {
      success: true,
      message: 'Activated Verdant Guard! Protects your combo and gives 5 minutes of streak resilience.',
      updatedAccount,
      boostActivated: 'streak_shield',
    };
  }

  // 8. Rare Candy -> Instantly awards +500 EXP
  if (itemId === 'item_rare_candy') {
    const { updatedAccount: accAfterConsume } = consumeInventoryItem(account, itemId);
    const { updatedAccount, leveledUp, newLevel } = addExpToAccount(accAfterConsume, 500);
    saveActiveAccount(updatedAccount);
    return {
      success: true,
      message: leveledUp
        ? `Ate a Rare Candy! Gained +500 EXP and Leveled Up to Lv.${newLevel}! 🎉`
        : `Ate a Rare Candy! Gained +500 EXP towards your next level!`,
      updatedAccount,
      leveledUp,
    };
  }

  // 9. Lucky Egg -> x2 Trophies AND x2 EXP for 5 minutes!
  if (itemId === 'item_lucky_egg') {
    const { updatedAccount } = consumeInventoryItem(account, itemId);
    activateTimedBoost('double_trophies', 'Lucky Harvest (x2 Trophies)', '🥚', 5);
    activateTimedBoost('double_exp', 'Lucky Harvest (x2 EXP)', '🥚', 5);
    return {
      success: true,
      message: 'Activated Lucky Harvest! Both x2 Trophies and x2 EXP active for the next 5 minutes!',
      updatedAccount,
      boostActivated: 'double_trophies',
    };
  }

  // 10. Focus Sash or Clefairy Doll -> Streak Shield for 5 minutes
  if (itemId === 'item_focus_sash' || itemId === 'item_poke_doll') {
    const { updatedAccount } = consumeInventoryItem(account, itemId);
    activateTimedBoost('streak_shield', 'Focus Endure (Streak Shield)', '🥋', 5);
    return {
      success: true,
      message: 'Focus Sash / Doll equipped! Protects your quiz streak from breaking for 5 minutes.',
      updatedAccount,
      boostActivated: 'streak_shield',
    };
  }

  // 11. Poké Ball, Great Ball, Ultra Ball, Master Ball
  // When used directly from the bag: adds an immediate boost or in-quiz reserve!
  if (itemId === 'item_poke_ball' || itemId === 'item_great_ball' || itemId === 'item_ultra_ball' || itemId === 'item_master_ball') {
    return {
      success: true,
      message: `${itemId.replace('item_', '').replace('_', ' ').toUpperCase()} is ready! You can throw it during any live quiz question to eliminate wrong options or auto-catch!`,
      updatedAccount: account,
    };
  }

  // 12. Generic Medicine / Potions
  if (itemId.includes('potion') || itemId.includes('revive') || itemId.includes('heal')) {
    const { updatedAccount } = consumeInventoryItem(account, itemId);
    const { updatedAccount: accWithExp } = addExpToAccount(updatedAccount, 100);
    saveActiveAccount(accWithExp);
    return {
      success: true,
      message: `Used restorative medicine! Restored trainer vitality and awarded +100 bonus EXP.`,
      updatedAccount: accWithExp,
    };
  }

  // Default fallback: convert item usage into bonus EXP
  const { updatedAccount } = consumeInventoryItem(account, itemId);
  const { updatedAccount: accWithExp, leveledUp, newLevel } = addExpToAccount(updatedAccount, 150);
  saveActiveAccount(accWithExp);

  return {
    success: true,
    message: leveledUp
      ? `Used item! Gained +150 EXP and reached Level ${newLevel}! 🎉`
      : `Used item! Converted into +150 bonus Trainer EXP.`,
    updatedAccount: accWithExp,
    leveledUp,
  };
}
