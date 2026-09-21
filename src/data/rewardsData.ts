export interface TrophyMilestoneReward {
  trophies: number;
  tierName: string;
  rankBadge: string;
  tokens: number;
  rewardTitle: string;
  rewardType: 'tokens' | 'avatar' | 'title' | 'song' | 'badge' | 'frame';
  rewardAvatarId?: number;
  rewardTrainerId?: string;
  rewardSongId?: string;
  description: string;
  badgeColor: string;
}

export interface TrainingBountyReward {
  id: string;
  title: string;
  category: 'battle' | 'knowledge' | 'speed' | 'mastery';
  taskDesc: string;
  tokens: number;
  trophyPointsBonus: number;
  specialItem?: string;
  rewardTrainerId?: string;
  highlight?: boolean;
}

// 1. Trophy Road Scaling all the way up to 100 Lakh (10,000,000 TP)
export const TROPHY_ROAD_REWARDS: TrophyMilestoneReward[] = [
  {
    trophies: 100,
    tierName: 'Novice Trainer',
    rankBadge: '⚪ Poké Ball Rank',
    tokens: 100,
    rewardTitle: 'Trainer Red & Pikachu Mascot',
    rewardType: 'title',
    description: 'Score your first 100 Trophy Points to unlock official trainer status and 100 Battle Tokens.',
    badgeColor: 'from-slate-400 to-slate-600',
  },
  {
    trophies: 250,
    tierName: 'Rising Contender',
    rankBadge: '🔵 Great Ball Rank',
    tokens: 250,
    rewardTitle: 'Rising Spark Profile Title & 250 BT',
    rewardType: 'title',
    description: '250 Trophy Points: Unlocks 250 Battle Tokens and the prestigious "Rising Spark" trainer badge.',
    badgeColor: 'from-blue-500 to-indigo-600',
  },
  {
    trophies: 500,
    tierName: 'Gym Challenger',
    rankBadge: '🟡 Ultra Ball Rank',
    tokens: 500,
    rewardTitle: 'Gym Leader Battle Theme & 500 BT',
    rewardType: 'song',
    rewardSongId: 'gym_leader_battle',
    description: '500 Trophy Points: Unlocks the intense Gym Leader Battle BGM in the Jukebox & 500 Battle Tokens.',
    badgeColor: 'from-yellow-400 to-amber-600',
  },
  {
    trophies: 1000,
    tierName: 'Elite Vanguard',
    rankBadge: '🟣 Master Ball Rank',
    tokens: 1000,
    rewardTitle: 'Ash Ketchum World Monarch & 1,000 BT',
    rewardType: 'avatar',
    rewardTrainerId: 'ash',
    description: '1,000 Trophy Points: Unlocks Ash Ketchum World Monarch Avatar and 1,000 Battle Tokens.',
    badgeColor: 'from-purple-500 to-indigo-700',
  },
  {
    trophies: 2500,
    tierName: 'Dragon Ace',
    rankBadge: '🐉 Dragon Master Rank',
    tokens: 2500,
    rewardTitle: 'Champion Lance Avatar & 2,500 BT',
    rewardType: 'avatar',
    rewardTrainerId: 'lance',
    description: '2,500 Trophy Points: Unlocks Dragon Master Lance avatar, Dragonite Aura, and 2,500 Tokens.',
    badgeColor: 'from-red-500 to-amber-700',
  },
  {
    trophies: 5000,
    tierName: 'Battle Frontier Titan',
    rankBadge: '⚡ Frontier Brain Rank',
    tokens: 5000,
    rewardTitle: 'Steven Stone Avatar & 5,000 BT',
    rewardType: 'avatar',
    rewardTrainerId: 'steven',
    description: '5,000 Trophy Points: Unlocks Hoenn Champion Steven Stone avatar and 5,000 Battle Tokens.',
    badgeColor: 'from-cyan-400 to-blue-700',
  },
  {
    trophies: 10000,
    tierName: 'Regional Sovereign',
    rankBadge: '⭐ Champion Rank I',
    tokens: 10000,
    rewardTitle: 'Cynthia Battle Theme & Avatar',
    rewardType: 'song',
    rewardSongId: 'cynthia_theme',
    rewardTrainerId: 'cynthia',
    description: '10,000 Trophy Points: Supreme Sinnoh Champion Cynthia avatar, Battle Theme, and 10,000 Tokens.',
    badgeColor: 'from-fuchsia-500 to-purple-800',
  },
  {
    trophies: 25000,
    tierName: 'Silver Conference Victor',
    rankBadge: '🏆 Silver Cup Champion',
    tokens: 25000,
    rewardTitle: 'Leon Unbeatable Champion & 25,000 BT',
    rewardType: 'avatar',
    rewardTrainerId: 'leon',
    description: '25,000 Trophy Points: Galar Champion Leon Avatar, Champion Mantle, and 25,000 Battle Tokens.',
    badgeColor: 'from-purple-600 via-pink-600 to-rose-600',
  },
  {
    trophies: 50000,
    tierName: 'Apex Grandmaster',
    rankBadge: '👑 Universal Apex Master',
    tokens: 50000,
    rewardTitle: 'Blue Rival Champion & 50,000 BT',
    rewardType: 'avatar',
    rewardTrainerId: 'blue',
    description: '50,000 Trophy Points: Champion Blue Avatar, Master Profile Frame, and 50,000 Battle Tokens.',
    badgeColor: 'from-amber-400 via-yellow-500 to-orange-600',
  },
  {
    trophies: 100000,
    tierName: '1 Lakh Milestone Emperor',
    rankBadge: '💎 1 Lakh Prestige Badge',
    tokens: 100000,
    rewardTitle: '1 Lakh Trophy Emperor & 100,000 BT',
    rewardType: 'badge',
    description: '100,000 Trophy Points (1 Lakh TP): The historic 1 Lakh Milestone with 100,000 Tokens and Imperial Laurel.',
    badgeColor: 'from-emerald-400 via-teal-500 to-cyan-600',
  },
  {
    trophies: 250000,
    tierName: 'Space-Time Sovereign',
    rankBadge: '🌌 Dialga & Palkia Domain',
    tokens: 250000,
    rewardTitle: 'Space-Time Distortion Frame & 250,000 BT',
    rewardType: 'frame',
    description: '250,000 Trophy Points (2.5 Lakh TP): Master of Space & Time with 250,000 Battle Tokens.',
    badgeColor: 'from-indigo-500 via-purple-600 to-blue-700',
  },
  {
    trophies: 500000,
    tierName: 'Mega Rayquaza Ascendant',
    rankBadge: '🐉 Ozone Delta Emperor',
    tokens: 500000,
    rewardTitle: 'Mega Rayquaza Wings & 500,000 BT',
    rewardType: 'frame',
    description: '500,000 Trophy Points (5 Lakh TP): Delta Stream Emerald Wings and 500,000 Battle Tokens.',
    badgeColor: 'from-emerald-500 via-green-600 to-teal-800',
  },
  {
    trophies: 1000000,
    tierName: '10 Lakh Millionaire Grandmaster',
    rankBadge: '💎 10 Lakh Diamond Crown (1M)',
    tokens: 1000000,
    rewardTitle: '10 Lakh Diamond Crown & 1,000,000 BT',
    rewardType: 'badge',
    description: '1,000,000 Trophy Points (10 Lakh TP): Legendary Diamond Halo and 1,000,000 Battle Tokens!',
    badgeColor: 'from-cyan-300 via-sky-400 to-blue-600',
  },
  {
    trophies: 2500000,
    tierName: 'Ultra Space Overlord',
    rankBadge: '✨ Necrozma Light Prism (25 Lakh)',
    tokens: 2500000,
    rewardTitle: 'Ultra Prism Aura & 2,500,000 BT',
    rewardType: 'frame',
    description: '2,500,000 Trophy Points (25 Lakh TP): Ultra Burst Radiance and 2,500,000 Battle Tokens.',
    badgeColor: 'from-amber-300 via-rose-500 to-purple-700',
  },
  {
    trophies: 5000000,
    tierName: 'Stellar Terastal Monarch',
    rankBadge: '🔮 Terapagos 19-Type Core (50 Lakh)',
    tokens: 5000000,
    rewardTitle: 'Stellar Prism Crown & 5,000,000 BT',
    rewardType: 'badge',
    description: '5,000,000 Trophy Points (50 Lakh TP): All 19 Elemental Tera Jewels and 5,000,000 Battle Tokens.',
    badgeColor: 'from-pink-400 via-purple-500 to-indigo-600',
  },
  {
    trophies: 10000000,
    tierName: '100 Lakh Eternal Pokémon God',
    rankBadge: '🌟 Arceus Judgment Omnipresence (100 Lakh TP)',
    tokens: 10000000,
    rewardTitle: 'Arceus Supreme Creator Godhood & 10,000,000 BT',
    rewardType: 'title',
    description: '10,000,000 Trophy Points (100 Lakh / 1 Crore TP): The absolute zenith of Pokémon history! Eternal Arceus Crown & 10,000,000 BT!',
    badgeColor: 'from-yellow-300 via-amber-400 to-slate-950',
  },
];

// 2. Training Quests & Battle Bounties (Replaced daily streak rewards per user request)
export const TRAINING_BOUNTIES_REWARDS: TrainingBountyReward[] = [
  {
    id: 'bounty_warmup',
    title: 'Warmup Gym Quiz',
    category: 'battle',
    taskDesc: 'Answer 5 questions correctly in any quiz mode to complete morning training.',
    tokens: 150,
    trophyPointsBonus: 100,
    specialItem: 'Oran Berry Pack',
  },
  {
    id: 'bounty_streak_ace',
    title: 'Combo Striker',
    category: 'speed',
    taskDesc: 'Achieve a 5x or higher answer streak in Classic or Blitz Mode.',
    tokens: 250,
    trophyPointsBonus: 150,
    specialItem: 'Super Potion',
  },
  {
    id: 'bounty_cry_specialist',
    title: 'Acoustic Identifier',
    category: 'knowledge',
    taskDesc: 'Identify a Pokémon correctly in the Audio Cry Quiz challenge.',
    tokens: 300,
    trophyPointsBonus: 200,
    specialItem: 'Cleanse Tag',
  },
  {
    id: 'bounty_silhouette_hunter',
    title: 'Shadow Tracker',
    category: 'mastery',
    taskDesc: 'Identify 3 Pokémon in Silhouette or Hardcore Zoom Crop mode.',
    tokens: 400,
    trophyPointsBonus: 250,
    specialItem: 'Silph Scope Focus',
  },
  {
    id: 'bounty_evolution_scholar',
    title: 'Evolution Specialist',
    category: 'knowledge',
    taskDesc: 'Complete a full stage guess in the Evolution Chain quiz.',
    tokens: 450,
    trophyPointsBonus: 300,
    specialItem: 'Thunder Stone',
  },
  {
    id: 'bounty_pvp_champion',
    title: '1v1 Arena Victor',
    category: 'battle',
    taskDesc: 'Compete in a 1v1 multiplayer battle duel via room code or matchmaking.',
    tokens: 600,
    trophyPointsBonus: 400,
    specialItem: 'Rare Candy',
    highlight: true,
  },
  {
    id: 'bounty_legendary_spotter',
    title: 'Legendary Scout',
    category: 'mastery',
    taskDesc: 'Encounter and correctly identify any Mythical or Legendary Pokémon.',
    tokens: 800,
    trophyPointsBonus: 500,
    specialItem: 'Master Ball',
    highlight: true,
  },
  {
    id: 'bounty_speed_demon',
    title: 'Blitz Speedrun',
    category: 'speed',
    taskDesc: 'Answer within 3 seconds with 100% accuracy in Blitz Time Attack.',
    tokens: 1000,
    trophyPointsBonus: 750,
    specialItem: 'Focus Sash',
    highlight: true,
  },
  {
    id: 'bounty_regional_conqueror',
    title: 'Regional Master',
    category: 'knowledge',
    taskDesc: 'Score 1,500+ points on any specific Generation (Kanto through Paldea).',
    tokens: 1500,
    trophyPointsBonus: 1000,
    specialItem: 'Lucky Egg',
    highlight: true,
  },
  {
    id: 'bounty_supreme_titan',
    title: 'Supreme Training Bounty',
    category: 'mastery',
    taskDesc: 'Master all training disciplines to claim the grand bounty prize.',
    tokens: 2500,
    trophyPointsBonus: 1500,
    specialItem: 'Golden Bottle Cap & Arceus Plate',
    highlight: true,
  },
];

// Aliases for compatibility
export const DAILY_STREAK_REWARDS = TRAINING_BOUNTIES_REWARDS;
export type DailyStreakReward = TrainingBountyReward;
