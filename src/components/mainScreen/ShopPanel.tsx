import React, { useState } from 'react';
import { ShoppingBag, Coins, Gift, ArrowRight, Check, User } from 'lucide-react';
import { TrainerAccount } from '../../types/pokemon';
import { TRAINER_AVATARS, TrainerAvatar } from '../../data/trainerAvatars';
import { getISTDateString } from '../../utils/dailyStreak';
import { sound } from '../../utils/audio';
import { saveActiveAccount } from '../../utils/accounts';
import confetti from 'canvas-confetti';

interface ShopPanelProps {
  account: TrainerAccount;
  onAccountUpdated: (updated: TrainerAccount) => void;
  onOpenFullShop: () => void;
}

export const ShopPanel: React.FC<ShopPanelProps> = ({
  account,
  onAccountUpdated,
  onOpenFullShop,
}) => {
  const [purchaseToast, setPurchaseToast] = useState<string | null>(null);

  const todayIST = getISTDateString();
  const isCrateClaimed = account.claimedFreeShopItems?.['free_daily_crate'] === todayIST;
  const balance = account.battleTokens ?? 0;

  // Pick 3 featured avatars to showcase on the main screen
  const featuredAvatars = TRAINER_AVATARS.filter(
    (t) => t.id === 'cynthia' || t.id === 'red' || t.id === 'ash'
  );

  const handleClaimFreeDailyCrate = () => {
    if (isCrateClaimed) return;
    sound.playTrophyUnlock();
    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } catch {
      // ignore
    }

    const nextTokens = balance + 150;
    const nextInventory = { ...(account.inventory || {}) };
    nextInventory['free_daily_crate'] = (nextInventory['free_daily_crate'] || 0) + 1;

    const updated: TrainerAccount = {
      ...account,
      battleTokens: nextTokens,
      inventory: nextInventory,
      claimedFreeShopItems: {
        ...(account.claimedFreeShopItems || {}),
        free_daily_crate: todayIST,
      },
      claimedFreeShopDateIST: todayIST,
    };
    saveActiveAccount(updated);
    onAccountUpdated(updated);
    setPurchaseToast('Claimed Daily Poké Supply Crate: +150 Coins (BT)!');
    setTimeout(() => setPurchaseToast(null), 3000);
  };

  const handleEquipAvatar = (trainer: TrainerAvatar) => {
    sound.playButtonPress();
    const updated: TrainerAccount = {
      ...account,
      trainerAvatarId: trainer.id,
      avatarId: trainer.numericId || 25,
    };
    saveActiveAccount(updated);
    onAccountUpdated(updated);
    setPurchaseToast(`Equipped ${trainer.name}!`);
    setTimeout(() => setPurchaseToast(null), 2500);
  };

  const handleBuyAvatar = (trainer: TrainerAvatar) => {
    if (balance < trainer.tokenCost) {
      sound.playWrong();
      setPurchaseToast(`Need ${trainer.tokenCost - balance} more BT!`);
      setTimeout(() => setPurchaseToast(null), 2500);
      return;
    }
    sound.playButtonPress();
    const nextTokens = balance - trainer.tokenCost;
    const nextUnlocked = Array.from(
      new Set([...(account.unlockedTrainerAvatars || ['red', 'pikachu']), trainer.id])
    );
    const updated: TrainerAccount = {
      ...account,
      battleTokens: nextTokens,
      unlockedTrainerAvatars: nextUnlocked,
      trainerAvatarId: trainer.id,
      avatarId: trainer.numericId || 25,
    };
    saveActiveAccount(updated);
    onAccountUpdated(updated);
    sound.playTrophyUnlock();
    try {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
    setPurchaseToast(`Unlocked ${trainer.name}!`);
    setTimeout(() => setPurchaseToast(null), 2500);
  };

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3 transition-all hover:border-slate-700">
      {/* Header with Title and Tokens */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black font-display text-white uppercase tracking-wider">
              Poké Mart
            </h3>
            <p className="text-[10px] text-slate-400">Avatars & Daily Coin Gift</p>
          </div>
        </div>

        {/* Currency Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold shadow-inner">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span>{balance.toLocaleString()}</span>
          <span className="text-[9px] text-amber-400/80">BT</span>
        </div>
      </div>

      {purchaseToast && (
        <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold text-center animate-bounce">
          {purchaseToast}
        </div>
      )}

      {/* Free Daily Poké Supply Crate Quick Claim */}
      <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-purple-500/15 border border-amber-500/30 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Gift className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <div className="truncate">
            <p className="text-[11px] font-bold text-white truncate">Daily Poké Supply Crate</p>
            <p className="text-[9px] text-amber-300/80">+150 Free Coin Gift (BT)</p>
          </div>
        </div>
        <button
          type="button"
          disabled={isCrateClaimed}
          onClick={handleClaimFreeDailyCrate}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 ${
            isCrateClaimed
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
              : 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 hover:brightness-110 shadow-sm cursor-pointer'
          }`}
        >
          {isCrateClaimed ? (
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-400" /> Claimed
            </span>
          ) : (
            'Claim Free'
          )}
        </button>
      </div>

      {/* Featured Trainer Avatars Preview */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 px-0.5">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3 text-amber-400" />
            <span>Featured Avatars</span>
          </span>
          <span className="text-amber-400/90 text-[10px]">101 In Mart</span>
        </div>

        {featuredAvatars.map((trainer) => {
          const unlockedList = account.unlockedTrainerAvatars || ['red', 'pikachu'];
          const isUnlocked = trainer.isDefaultUnlocked || unlockedList.includes(trainer.id);
          const isEquipped = account.trainerAvatarId === trainer.id || (trainer.id === 'pikachu' && account.avatarId === 25 && !account.trainerAvatarId);
          const canAfford = balance >= trainer.tokenCost;

          return (
            <div
              key={trainer.id}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors gap-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={trainer.spriteUrl}
                  alt={trainer.name}
                  className="w-7 h-7 object-contain shrink-0"
                />
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-200 truncate">{trainer.name}</p>
                  <p className="text-[9px] text-slate-400 truncate">{trainer.role}</p>
                </div>
              </div>

              {isEquipped ? (
                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-bold">
                  Active
                </span>
              ) : isUnlocked ? (
                <button
                  type="button"
                  onClick={() => handleEquipAvatar(trainer)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold transition-all shrink-0 border border-slate-700"
                >
                  Equip
                </button>
              ) : trainer.tokenCost > 0 ? (
                <button
                  type="button"
                  disabled={!canAfford}
                  onClick={() => handleBuyAvatar(trainer)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 border ${
                    canAfford
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400'
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                  }`}
                >
                  {trainer.tokenCost.toLocaleString()} BT
                </button>
              ) : (
                <span className="text-[9px] text-amber-300 font-semibold truncate max-w-[80px]">
                  Trophy Road
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Open Poké Mart Button */}
      <button
        type="button"
        onClick={() => {
          sound.playButtonPress();
          onOpenFullShop();
        }}
        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 hover:from-amber-500/30 to-rose-500/20 hover:to-rose-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm cursor-pointer"
      >
        <span>Open Poké Mart (Avatars & Crate)</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
