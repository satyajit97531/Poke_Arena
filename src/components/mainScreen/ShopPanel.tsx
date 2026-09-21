import React, { useState } from 'react';
import { ShoppingBag, Coins, Sparkles, Gift, ArrowRight, Check } from 'lucide-react';
import { TrainerAccount, ShopItem } from '../../types/pokemon';
import { SHOP_ITEMS } from '../../data/shopItems';
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
  const isBerriesClaimed = account.claimedFreeShopItems?.['free_daily_berries'] === todayIST;
  const balance = account.battleTokens ?? 0;
  // Pick 3 featured hot items to showcase on the main screen
  const featuredItems = SHOP_ITEMS.filter(
    (item) => item.rarity === 'legendary' || item.rarity === 'mythic' || item.id === 'item_rare_candy' || item.id === 'item_tera_orb'
  ).slice(0, 3);

  const handleClaimFreeItem = (itemId: 'free_daily_crate' | 'free_daily_berries') => {
    if (account.claimedFreeShopItems?.[itemId] === todayIST) return;
    sound.playTrophyUnlock();
    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
    const nextInventory = { ...(account.inventory || {}) };
    let nextTokens = balance;

    if (itemId === 'free_daily_crate') {
      nextTokens += 150;
      nextInventory['item_potion'] = (nextInventory['item_potion'] || 0) + 2;
      nextInventory['item_poke_ball'] = (nextInventory['item_poke_ball'] || 0) + 5;
      nextInventory['free_daily_crate'] = (nextInventory['free_daily_crate'] || 0) + 1;
      setPurchaseToast('Claimed Daily Supply Crate: +150 BT & Potions!');
    } else {
      nextInventory['item_oran_berry'] = (nextInventory['item_oran_berry'] || 0) + 5;
      nextInventory['free_daily_berries'] = (nextInventory['free_daily_berries'] || 0) + 5;
      setPurchaseToast('Claimed Wild Oran Berry Bundle: +5 Fresh Berries!');
    }

    const updated: TrainerAccount = {
      ...account,
      battleTokens: nextTokens,
      inventory: nextInventory,
      claimedFreeShopItems: {
        ...(account.claimedFreeShopItems || {}),
        [itemId]: todayIST,
      },
      claimedFreeShopDateIST: todayIST,
    };
    saveActiveAccount(updated);
    onAccountUpdated(updated);
    setTimeout(() => setPurchaseToast(null), 3000);
  };

  const handleQuickBuy = (item: ShopItem) => {
    if (item.cost === 0 || item.category === 'free') {
      if (item.id === 'free_daily_berries') {
        handleClaimFreeItem('free_daily_berries');
      } else {
        handleClaimFreeItem('free_daily_crate');
      }
      return;
    }
    if (balance < item.cost) {
      sound.playWrong();
      setPurchaseToast(`Need ${item.cost - balance} more BT!`);
      setTimeout(() => setPurchaseToast(null), 2500);
      return;
    }
    sound.playButtonPress();
    const nextTokens = balance - item.cost;
    const nextInventory = { ...(account.inventory || {}) };
    nextInventory[item.id] = (nextInventory[item.id] || 0) + (typeof item.rewardValue === 'number' ? item.rewardValue : 1);

    const nextUnlockedTrainers = [...(account.unlockedTrainerAvatars || ['red', 'pikachu'])];
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
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
    setPurchaseToast(`Purchased ${item.name}!`);
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
            <p className="text-[10px] text-slate-400">Items & Battle Exchange</p>
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

      {/* Free Daily Crate Quick Claim */}
      <div className="space-y-1.5">
        <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-purple-500/15 border border-amber-500/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Gift className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <div className="truncate">
              <p className="text-[11px] font-bold text-white truncate">Daily Supply Crate</p>
              <p className="text-[9px] text-amber-300/80">+150 Tokens & Potions</p>
            </div>
          </div>
          <button
            type="button"
            disabled={isCrateClaimed}
            onClick={() => handleClaimFreeItem('free_daily_crate')}
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

        <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-cyan-500/15 border border-emerald-500/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">🫐</span>
            <div className="truncate">
              <p className="text-[11px] font-bold text-white truncate">Wild Oran Berries</p>
              <p className="text-[9px] text-emerald-300/80">+5 Restorative Berries</p>
            </div>
          </div>
          <button
            type="button"
            disabled={isBerriesClaimed}
            onClick={() => handleClaimFreeItem('free_daily_berries')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 ${
              isBerriesClaimed
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110 shadow-sm cursor-pointer'
            }`}
          >
            {isBerriesClaimed ? (
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" /> Claimed
              </span>
            ) : (
              'Claim Free'
            )}
          </button>
        </div>
      </div>

      {/* Featured Items Preview */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 px-0.5">
          <span>Featured Equipment</span>
          <span className="text-amber-400/90">Quick Buy</span>
        </div>

        {featuredItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base shrink-0">{item.icon}</span>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-200 truncate">{item.name}</p>
                <p className="text-[9px] text-slate-400 font-mono flex items-center gap-1">
                  <Coins className="w-2.5 h-2.5 text-amber-400" />
                  {item.cost.toLocaleString()} BT
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleQuickBuy(item)}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-[10px] font-bold transition-all shrink-0 border border-slate-700"
            >
              Buy
            </button>
          </div>
        ))}
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
        <span>Open Poké Mart</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
