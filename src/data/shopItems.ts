import { ShopItem } from '../types/pokemon';

export const SHOP_ITEMS: ShopItem[] = [
  // =========================================================================
  // 1. FREE DAILY REWARDS (0 BT) - DAILY COIN GIFT
  // =========================================================================
  {
    id: 'free_daily_crate',
    name: 'Daily Poké Supply Crate',
    description: 'A complimentary trainer care package packed with 150 Battle Tokens for daily coin gifts.',
    category: 'free',
    rarity: 'normal',
    cost: 0,
    icon: '🎁',
    rewardType: 'tokens',
    rewardValue: 150,
    claimIntervalDays: 1,
  },
];
