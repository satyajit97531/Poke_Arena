import React, { useState, useEffect } from 'react';
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
  Package,
  Zap,
  User,
  Info,
  Trophy,
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
import {
  getActiveBoosts,
  useItemFromInventory,
  formatSeconds,
  ActiveBoost,
} from '../utils/itemBoosts';
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
  const [shopToast, setShopToast] = useState<string | null>(null);
  const [activeBoosts, setActiveBoosts] = useState<ActiveBoost[]>(getActiveBoosts());

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBoosts(getActiveBoosts());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleUseItem = (itemId: string) => {
    sound.playButtonPress();
    const res = useItemFromInventory(account, itemId);
    if (!res.success) {
      sound.playWrong();
      setShopToast(res.message);
      setTimeout(() => setShopToast(null), 2500);
      return;
    }

    if (res.leveledUp) {
      sound.playTrophyUnlock();
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
    } else {
      sound.playTrophyUnlock();
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
    }

    setActiveBoosts(getActiveBoosts());
    onAccountUpdated(res.updatedAccount);
    setShopToast(res.message);
    setTimeout(() => setShopToast(null), 3500);
  };

  if (!isOpen) return null;

  const todayIST = getISTDateString();
  const timeUntilReset = getTimeUntilNextISTMidnight();
  const balance = account.battleTokens ?? 0;

  const isFreeItemClaimedToday = (itemId: string): boolean => {
    return account.claimedFreeShopItems?.[itemId] === todayIST;
  };

  const handleClaimFreeItem = (item: ShopItem) => {
    if (isFreeItemClaimedToday(item.id)) return;

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

    const nextInventory = { ...(account.inventory || {}) };
    let nextTokens = balance;

    if (item.id === 'free_daily_crate') {
      nextTokens += 150;
      nextInventory['item_potion'] = (nextInventory['item_potion'] || 0) + 2;
      nextInventory['item_poke_ball'] = (nextInventory['item_poke_ball'] || 0) + 5;
      nextInventory['free_daily_crate'] = (nextInventory['free_daily_crate'] || 0) + 1;
      setShopToast('Claimed Daily Poké Supply Crate: +150 BT, 2 Potions & 5 Poké Balls!');
    } else if (item.id === 'free_daily_berries') {
      nextInventory['item_oran_berry'] = (nextInventory['item_oran_berry'] || 0) + 5;
      nextInventory['free_daily_berries'] = (nextInventory['free_daily_berries'] || 0) + 5;
      setShopToast('Claimed Wild Oran Berry Bundle: +5 Fresh Restorative Berries!');
    } else {
      if (item.rewardType === 'tokens') {
        nextTokens += typeof item.rewardValue === 'number' ? item.rewardValue : 100;
      } else {
        nextInventory[item.id] =
          (nextInventory[item.id] || 0) +
          (typeof item.rewardValue === 'number' ? item.rewardValue : 1);
      }
      setShopToast(`Claimed ${item.name}!`);
    }

    const updated: TrainerAccount = {
      ...account,
      battleTokens: nextTokens,
      inventory: nextInventory,
      claimedFreeShopItems: {
        ...(account.claimedFreeShopItems || {}),
        [item.id]: todayIST,
      },
      claimedFreeShopDateIST: todayIST,
    };

    saveActiveAccount(updated);
    onAccountUpdated(updated);
    setTimeout(() => setShopToast(null), 3200);
  };

  const handleBuyShopItem = (item: ShopItem) => {
    if (item.cost === 0 || item.category === 'free') {
      handleClaimFreeItem(item);
      return;
    }

    if (balance < item.cost) {
      sound.playWrong();
      setShopToast(`Insufficient Battle Tokens! Need ${item.cost - balance} more BT.`);
      setTimeout(() => setShopToast(null), 2500);
      return;
    }

    sound.playButtonPress();
    const nextTokens = balance - item.cost;
    const nextInventory = { ...(account.inventory || {}) };
    nextInventory[item.id] =
      (nextInventory[item.id] || 0) +
      (typeof item.rewardValue === 'number' ? item.rewardValue : 1);

    const nextUnlockedTrainers = [
      ...(account.unlockedTrainerAvatars || ['red', 'pikachu']),
    ];
    if (item.rewardType === 'avatar' && typeof item.rewardValue === 'string') {
      if (!nextUnlockedTrainers.includes(item.rewardValue)) {
        nextUnlockedTrainers.push(item.rewardValue);
      }
    }

    const updated: TrainerAccount = {
      ...account,
      battleTokens: nextTokens,
      inventory: nextInventory,
      unlockedTrainerAvatars: nextUnlockedTrainers,
    };

    saveActiveAccount(updated);
    onAccountUpdated(updated);
    sound.playTrophyUnlock();
    try {
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
    setShopToast(`Successfully purchased ${item.name}!`);
    setTimeout(() => setShopToast(null), 3000);
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
      new Set([...(account.unlockedTrainerAvatars || ['red', 'pikachu']), trainer.id])
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
                  Poké Mart & Battle Exchange
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold uppercase tracking-wider border border-amber-500/30">
                  Official League Shop
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Spend Battle Tokens earned in quiz matches and 1v1 arenas for items, Mega Stones, and trainer gear.
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

          {/* Daily Free Supplies Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-purple-500/15 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold font-display text-white flex items-center gap-2">
                  <span>Complimentary Daily Trainer Supplies</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    Free Daily
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  Claim your free daily care packages every 24 hours. Resets in{' '}
                  <span className="text-amber-300 font-mono font-bold">
                    {timeUntilReset.formatted} (IST)
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>

          {/* Active Item Buffs Banner */}
          {activeBoosts.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-blue-950/50 border border-cyan-500/40 flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>Active Combat & Resource Buffs:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {activeBoosts.map((b) => {
                  const remaining = Math.max(0, Math.floor((b.expiresAt - Date.now()) / 1000));
                  return (
                    <div
                      key={b.type}
                      className="px-2.5 py-1 rounded-xl bg-cyan-900/50 border border-cyan-400/40 text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <span>{b.icon}</span>
                      <span className="font-bold text-white">{b.name}</span>
                      <span className="font-mono text-amber-300 font-bold bg-slate-950/80 px-1.5 py-0.5 rounded text-[11px]">
                        {formatSeconds(remaining)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Shop Rarity & Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {(
              [
                { id: 'all', label: 'All Items' },
                { id: 'bag', label: '🎒 Bag & Usable' },
                { id: 'avatars', label: '👤 Trainer Avatars (101)' },
                { id: 'free', label: 'Free Daily' },
                { id: 'normal', label: 'Normal' },
                { id: 'rare', label: 'Rare' },
                { id: 'super_rare', label: 'Super Rare' },
                { id: 'mythic', label: 'Mythical' },
                { id: 'legendary', label: 'Legendary' },
              ] as const
            ).map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => {
                  sound.playButtonPress();
                  setShopFilter(pill.id);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap border transition-all cursor-pointer ${
                  shopFilter === pill.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-950'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Items / Avatars Grid */}
          {shopFilter === 'avatars' ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-500/20 via-slate-900 to-amber-500/20 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-white text-sm">League Trainer Roster (101 Iconic Avatars)</h4>
                    <p className="text-slate-400 text-[11px]">
                      Gym Leaders, Elite Four masters, Regional Champions, and Ash Ketchum. Some unlock free via Trophy Road & Gym Badges, and others via Battle Tokens!
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Unlocked</span>
                  <span className="font-mono text-xs font-black text-amber-300">
                    {(account.unlockedTrainerAvatars || ['red', 'pikachu']).length} / {TRAINER_AVATARS.length}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[480px] overflow-y-auto pr-1">
                {TRAINER_AVATARS.map((trainer) => {
                  const unlockedList = account.unlockedTrainerAvatars || ['red', 'pikachu'];
                  const isUnlocked = trainer.isDefaultUnlocked || unlockedList.includes(trainer.id);
                  const isEquipped = account.trainerAvatarId === trainer.id || (trainer.id === 'pikachu' && account.avatarId === 25 && !account.trainerAvatarId);
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
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase border ${badgeStyle}`}>
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
                          <div className="text-[10px] text-amber-300/90 font-medium line-clamp-2 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
                            {trainer.howToUnlock}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : shopFilter === 'bag' && SHOP_ITEMS.filter((item) => (account.inventory?.[item.id] || 0) > 0).length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/50 space-y-3">
              <Package className="w-12 h-12 text-slate-600 mx-auto animate-bounce" />
              <h3 className="text-base font-bold text-white">Your Bag is Empty</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                You don't have any usable items in your inventory yet. Purchase evolution stones, Rare Candies, or Potions from the Mart to unlock powerful timed boosts like 2x Trophies and 2x Coins!
              </p>
              <button
                type="button"
                onClick={() => setShopFilter('all')}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 cursor-pointer shadow-md shadow-amber-950"
              >
                Browse All Poké Mart Items
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {SHOP_ITEMS.filter((item) => {
                if (shopFilter === 'all') return true;
                if (shopFilter === 'bag') return (account.inventory?.[item.id] || 0) > 0;
                if (shopFilter === 'free') return item.cost === 0 || item.category === 'free';
                return item.rarity === shopFilter;
              }).map((item) => {
                const isFreeItem = item.cost === 0 || item.category === 'free';
                const isClaimedToday = isFreeItem && isFreeItemClaimedToday(item.id);
                const canAfford = balance >= item.cost;
                const ownedCount = account.inventory?.[item.id] || 0;
                const isUsable = ownedCount > 0 && item.rewardType !== 'avatar';
                const isTrainerUnlocked =
                  item.rewardType === 'avatar' &&
                  typeof item.rewardValue === 'string' &&
                  (account.unlockedTrainerAvatars || []).includes(item.rewardValue);

                const rarityBadgeClass =
                  item.rarity === 'legendary'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                    : item.rarity === 'mythic'
                    ? 'bg-pink-500/20 text-pink-300 border-pink-400/50'
                    : item.rarity === 'super_rare'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-400/50'
                    : item.rarity === 'rare'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                    : isFreeItem
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                    : 'bg-slate-800 text-slate-300 border-slate-700';

                const cardBorderClass =
                  item.rarity === 'legendary'
                    ? 'border-amber-400/60 shadow-lg shadow-amber-950/40 bg-gradient-to-b from-amber-500/10 to-slate-950'
                    : item.rarity === 'mythic'
                    ? 'border-pink-400/60 shadow-lg shadow-pink-950/40 bg-gradient-to-b from-pink-500/10 to-slate-950'
                    : item.rarity === 'super_rare'
                    ? 'border-purple-400/60 shadow-md shadow-purple-950/40 bg-gradient-to-b from-purple-500/10 to-slate-950'
                    : item.rarity === 'rare'
                    ? 'border-cyan-400/60 shadow-md shadow-cyan-950/40 bg-gradient-to-b from-cyan-500/10 to-slate-950'
                    : isFreeItem
                    ? 'border-emerald-500/50 shadow-md shadow-emerald-950/30 bg-gradient-to-b from-emerald-500/10 to-slate-950'
                    : 'border-slate-800 bg-slate-950/80';

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${cardBorderClass}`}
                  >
                    <div>
                      {/* Header with rarity badge & category */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${rarityBadgeClass}`}
                        >
                          {isFreeItem ? 'FREE DAILY' : item.rarity.replace('_', ' ')}
                        </span>
                        {ownedCount > 0 && !isFreeItem && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                            Owned: {ownedCount}
                          </span>
                        )}
                        {isClaimedToday && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Claimed Today
                          </span>
                        )}
                      </div>

                      {/* Icon & Title */}
                      <div className="flex items-center gap-3 my-2">
                        <span className="text-3xl p-2 bg-slate-900 rounded-xl border border-slate-800 shrink-0 select-none">
                          {item.icon}
                        </span>
                        <div className="overflow-hidden">
                          <h4 className="text-sm font-bold text-white truncate">
                            {item.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {item.category} item
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-400 line-clamp-2 my-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Price & Action Button */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between mt-2 gap-2">
                      <div className="flex items-center gap-1.5 font-bold font-mono text-amber-400 shrink-0">
                        <Coins className="w-4 h-4" />
                        <span className="text-sm">
                          {item.cost === 0 ? 'FREE' : `${item.cost.toLocaleString()} BT`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Use Item Button if owned */}
                        {isUsable && (
                          <button
                            type="button"
                            onClick={() => handleUseItem(item.id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110 active:scale-95 shadow-md shadow-emerald-950 cursor-pointer"
                            title="Activate this item's buff!"
                          >
                            <Zap className="w-3 h-3 text-slate-950 fill-slate-950" />
                            <span>Use</span>
                          </button>
                        )}

                        {isTrainerUnlocked ? (
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Owned
                          </span>
                        ) : isFreeItem ? (
                          <button
                            type="button"
                            disabled={isClaimedToday}
                            onClick={() => handleClaimFreeItem(item)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                              isClaimedToday
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
                                : 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 hover:brightness-110 active:scale-95 shadow-md shadow-amber-950 cursor-pointer'
                            }`}
                          >
                            {isClaimedToday ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Claimed</span>
                              </>
                            ) : (
                              <>
                                <Gift className="w-3.5 h-3.5" />
                                <span>Claim Free</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!canAfford}
                            onClick={() => handleBuyShopItem(item)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                              canAfford
                                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95 shadow-md shadow-amber-950 cursor-pointer'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                            }`}
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>{canAfford ? 'Buy' : 'Need BT'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
