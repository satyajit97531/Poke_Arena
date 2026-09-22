import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  X,
  ShoppingBag,
  Coins,
  Sparkles,
  Check,
  CheckCircle2,
  Gift,
  Clock,
  User,
  Search,
  Crown,
  ShieldCheck,
} from 'lucide-react';
import { TrainerAccount, ShopItem } from '../types/pokemon';
import { SHOP_ITEMS } from '../data/shopItems';
import {
  TRAINER_AVATARS,
  TrainerAvatar,
  getTrainerFrameBorder,
  getTrainerBadgeClass,
} from '../data/trainerAvatars';
import { getISTDateString, getTimeUntilNextISTMidnight } from '../utils/dailyStreak';
import { sound } from '../utils/audio';
import { saveActiveAccount } from '../utils/accounts';
import confetti from 'canvas-confetti';

interface PokeMartModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: TrainerAccount;
  onAccountUpdated: (updated: TrainerAccount) => void;
}

export const PokeMartModal: React.FC<PokeMartModalProps> = ({
  isOpen,
  onClose,
  account,
  onAccountUpdated,
}) => {
  const [shopFilter, setShopFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [shopToast, setShopToast] = useState<string | null>(null);

  const unlockedList = account?.unlockedTrainerAvatars || ['red', 'pikachu'];

  const filteredAvatars = useMemo(() => {
    return TRAINER_AVATARS.filter((trainer) => {
      const isUnlocked = trainer.isDefaultUnlocked || unlockedList.includes(trainer.id);

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = trainer.name.toLowerCase().includes(q);
        const matchRole = trainer.role.toLowerCase().includes(q);
        const matchRegion = trainer.region.toLowerCase().includes(q);
        if (!matchName && !matchRole && !matchRegion) return false;
      }

      // Filter tabs
      if (shopFilter === 'all') return true;
      if (shopFilter === 'unlocked') return isUnlocked;
      if (shopFilter === 'champions') {
        return (
          trainer.rarity === 'legendary' ||
          trainer.rarity === 'mythic' ||
          trainer.role.toLowerCase().includes('champion')
        );
      }
      if (shopFilter === 'gym_leaders') {
        return (
          trainer.role.toLowerCase().includes('leader') ||
          trainer.role.toLowerCase().includes('elite four')
        );
      }
      // Region specific filter
      return trainer.region.toLowerCase() === shopFilter.toLowerCase();
    });
  }, [searchQuery, shopFilter, unlockedList]);

  if (!isOpen) return null;

  const todayIST = getISTDateString();
  const timeUntilReset = getTimeUntilNextISTMidnight();
  const balance = account?.battleTokens ?? 0;

  // The only shop item retained is the Daily Poké Supply Crate for coin gifts
  const dailyCrateItem: ShopItem = SHOP_ITEMS.find((i) => i.id === 'free_daily_crate') || {
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
  };

  const isDailyCrateClaimedToday = account?.claimedFreeShopItems?.['free_daily_crate'] === todayIST;

  const handleClaimDailyCrate = () => {
    if (isDailyCrateClaimedToday) return;

    sound.playTrophyUnlock();
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#ef4444', '#10b981', '#6366f1'],
      });
    } catch {
      // ignore
    }

    const nextTokens = balance + 150;
    const nextInventory = { ...(account?.inventory || {}) };
    nextInventory['free_daily_crate'] = (nextInventory['free_daily_crate'] || 0) + 1;

    const updated: TrainerAccount = {
      ...account,
      battleTokens: nextTokens,
      inventory: nextInventory,
      claimedFreeShopItems: {
        ...(account?.claimedFreeShopItems || {}),
        free_daily_crate: todayIST,
      },
      claimedFreeShopDateIST: todayIST,
    };

    saveActiveAccount(updated);
    onAccountUpdated(updated);
    setShopToast('Claimed Daily Poké Supply Crate: +150 Battle Tokens Daily Coin Gift!');
    setTimeout(() => setShopToast(null), 3200);
  };

  const handleBuyTrainerAvatar = (trainer: TrainerAvatar) => {
    if (balance < trainer.tokenCost) {
      sound.playWrong();
      setShopToast(`Insufficient Battle Tokens! Need ${trainer.tokenCost - balance} more BT.`);
      setTimeout(() => setShopToast(null), 2500);
      return;
    }

    sound.playButtonPress();
    const nextTokens = balance - trainer.tokenCost;
    const nextUnlockedTrainers = Array.from(
      new Set([...(account?.unlockedTrainerAvatars || ['red', 'pikachu']), trainer.id])
    );

    const updated: TrainerAccount = {
      ...account,
      battleTokens: nextTokens,
      unlockedTrainerAvatars: nextUnlockedTrainers,
      trainerAvatarId: trainer.id,
      avatarId: trainer.numericId || 25,
    };

    saveActiveAccount(updated);
    onAccountUpdated(updated);
    sound.playTrophyUnlock();
    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
    setShopToast(`Unlocked & equipped Avatar: ${trainer.name}!`);
    setTimeout(() => setShopToast(null), 3000);
  };

  const handleEquipTrainerAvatar = (trainer: TrainerAvatar) => {
    sound.playButtonPress();
    const updated: TrainerAccount = {
      ...account,
      trainerAvatarId: trainer.id,
      avatarId: trainer.numericId || 25,
    };
    saveActiveAccount(updated);
    onAccountUpdated(updated);
    setShopToast(`Equipped ${trainer.name} as active avatar!`);
    setTimeout(() => setShopToast(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-display text-white">
                  Poké Mart & Avatar Exchange
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold uppercase tracking-wider border border-amber-500/30">
                  Official League Shop
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Claim your daily Poké supply crate for free coin gifts, and unlock iconic League Trainer Avatars with your Battle Tokens.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Currency Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-sm font-bold shadow-inner">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{balance.toLocaleString()}</span>
              <span className="text-[10px] text-amber-400/80">BT</span>
            </div>

            <button
              id="btn-close-pokemart"
              onClick={() => {
                sound.playButtonBack();
                onClose();
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-90px)]">
          {/* Toast Notification */}
          {shopToast && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 shadow-lg animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{shopToast}</span>
            </div>
          )}

          {/* Daily Poké Supply Crate Featured Card (Daily Coin Gift) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-purple-500/15 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/30 to-rose-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                🎁
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold font-display text-white">
                    {dailyCrateItem.name}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                    <Gift className="w-3 h-3" /> Daily Coin Gift
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Complimentary daily gift package rewarding{' '}
                  <span className="text-amber-300 font-bold">+150 Battle Tokens (Coins)</span> every 24 hours.
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1 font-mono">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Resets in: <strong className="text-amber-300">{timeUntilReset.formatted}</strong> (Midnight IST)</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={isDailyCrateClaimedToday}
              onClick={handleClaimDailyCrate}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
                isDailyCrateClaimedToday
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700/60'
                  : 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 hover:brightness-110 active:scale-95 shadow-lg shadow-amber-950 cursor-pointer'
              }`}
            >
              {isDailyCrateClaimedToday ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Claimed Today (+150 BT)</span>
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 text-slate-950" />
                  <span>Claim Free Coins (+150 BT)</span>
                </>
              )}
            </button>
          </div>

          {/* Tab Filters */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs max-w-full">
              {(
                [
                  { id: 'all', label: 'All Avatars (101)' },
                  { id: 'unlocked', label: '✅ Unlocked' },
                  { id: 'champions', label: '👑 Champions' },
                  { id: 'gym_leaders', label: '🏅 Gym Leaders' },
                  { id: 'kanto', label: 'Kanto' },
                  { id: 'johto', label: 'Johto' },
                  { id: 'hoenn', label: 'Hoenn' },
                  { id: 'sinnoh', label: 'Sinnoh' },
                  { id: 'unova', label: 'Unova' },
                  { id: 'kalos', label: 'Kalos' },
                  { id: 'alola', label: 'Alola' },
                  { id: 'galar', label: 'Galar' },
                  { id: 'paldea', label: 'Paldea' },
                  { id: 'daily_only', label: '🎁 Daily Crate Only' },
                ] as const
              ).map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => {
                    sound.playButtonPress();
                    setShopFilter(pill.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap border transition-all cursor-pointer text-xs ${
                    shopFilter === pill.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-950'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search avatars..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          {/* Content Views */}
          {shopFilter === 'daily_only' ? (
            /* Focused Daily Crate View */
            <div className="p-8 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-950 text-center space-y-4 max-w-xl mx-auto my-4 shadow-xl">
              <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center text-4xl mx-auto shadow-inner">
                🎁
              </div>
              <h3 className="text-xl font-bold font-display text-white">Daily Poké Supply Crate</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                The Poké Mart's official daily gift package. Come back every 24 hours to collect 150 Battle Tokens to unlock exclusive Gym Leader and Champion Avatars!
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-amber-300">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Next Daily Refresh: <strong>{timeUntilReset.formatted}</strong></span>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isDailyCrateClaimedToday}
                  onClick={handleClaimDailyCrate}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    isDailyCrateClaimedToday
                      ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 hover:brightness-110 shadow-lg shadow-amber-950 cursor-pointer'
                  }`}
                >
                  {isDailyCrateClaimedToday ? '✓ Claimed Today (+150 BT)' : '🎁 Claim Free Coin Gift (+150 BT)'}
                </button>
              </div>
            </div>
          ) : (
            /* Avatars Grid View */
            <div className="space-y-3">
              {/* Status Header */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-500/20 via-slate-900 to-amber-500/20 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <User className="w-5 h-5 text-amber-400 shrink-0" />
                  <div className="truncate">
                    <h4 className="font-bold text-white text-sm truncate">
                      League Trainer Roster ({filteredAvatars.length} Avatars)
                    </h4>
                    <p className="text-slate-400 text-[11px] truncate">
                      Gym Leaders, Elite Four masters, Regional Champions, and Ash Ketchum. Unlock via Battle Tokens or Trophy Road!
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Unlocked</span>
                  <span className="font-mono text-xs font-black text-amber-300">
                    {unlockedList.length} / {TRAINER_AVATARS.length}
                  </span>
                </div>
              </div>

              {filteredAvatars.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/50 space-y-2">
                  <User className="w-10 h-10 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-white">No Avatars Found</h4>
                  <p className="text-xs text-slate-400">
                    Try adjusting your search or region filter to browse other avatars.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto pr-1">
                  {filteredAvatars.map((trainer) => {
                    const isUnlocked = trainer.isDefaultUnlocked || unlockedList.includes(trainer.id);
                    const isEquipped =
                      account.trainerAvatarId === trainer.id ||
                      (trainer.id === 'pikachu' && account.avatarId === 25 && !account.trainerAvatarId);
                    const frameStyle = trainer.frameBorder || getTrainerFrameBorder(trainer.rarity);
                    const badgeStyle = trainer.badgeClass || getTrainerBadgeClass(trainer.rarity);
                    const canAfford = balance >= trainer.tokenCost;

                    return (
                      <div
                        key={`shop-trainer-${trainer.id}`}
                        className={`relative flex flex-col p-3 rounded-2xl transition-all border ${frameStyle} ${
                          isEquipped ? 'ring-2 ring-rose-400 shadow-xl shadow-rose-950/40' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase border ${badgeStyle}`}
                          >
                            {trainer.rarity}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-slate-950 text-slate-300 border border-slate-800">
                            {trainer.region}
                          </span>
                        </div>

                        <div className="w-full h-20 flex items-center justify-center my-1 relative">
                          <img
                            src={trainer.spriteUrl}
                            alt={trainer.name}
                            className={`max-h-18 w-auto object-contain drop-shadow transition-all ${
                              isUnlocked ? '' : 'filter grayscale contrast-125 brightness-45'
                            }`}
                          />
                        </div>

                        <h4 className="text-xs font-bold text-white truncate text-center mb-0.5">
                          {trainer.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate text-center mb-2">
                          {trainer.role}
                        </p>

                        <div className="mt-auto pt-2 border-t border-slate-800/80 flex flex-col gap-1.5">
                          {isUnlocked ? (
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Unlocked
                              </span>
                              {isEquipped ? (
                                <span className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                                  Active
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleEquipTrainerAvatar(trainer)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold cursor-pointer"
                                >
                                  Equip
                                </button>
                              )}
                            </div>
                          ) : trainer.tokenCost > 0 ? (
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[11px] font-mono font-bold text-amber-400">
                                {trainer.tokenCost.toLocaleString()} BT
                              </span>
                              <button
                                type="button"
                                disabled={!canAfford}
                                onClick={() => handleBuyTrainerAvatar(trainer)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                                  canAfford
                                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer shadow-sm'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                }`}
                              >
                                <span>Unlock</span>
                              </button>
                            </div>
                          ) : (
                            <div className="text-[10px] text-amber-300/90 font-medium line-clamp-2 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800 text-center">
                              {trainer.howToUnlock || 'Trophy Road Reward'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
