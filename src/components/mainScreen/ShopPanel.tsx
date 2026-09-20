import React, { useState } from 'react';
import { ShoppingBag, Coins, Sparkles, Gift, ArrowRight, Check } from 'lucide-react';
import { TrainerAccount, ShopItem } from '../../types/pokemon';
import { SHOP_ITEMS } from '../../data/shopItems';
import { sound } from '../../utils/audio';
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
  const [claimedCrate, setClaimedCrate] = useState(false);
  const [purchaseToast, setPurchaseToast] = useState<string | null>(null);

  const balance = account.battleTokens ?? 0;
  // Pick 3 featured hot items to showcase on the main screen
  const featuredItems = SHOP_ITEMS.filter(
    (item) => item.rarity === 'legendary' || item.rarity === 'mythic' || item.id === 'item_rare_candy' || item.id === 'item_tera_orb'
  ).slice(0, 3);

  const handleClaimFreeDaily = () => {
    sound.playTrophyUnlock();
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    const nextTokens = balance + 150;
    const nextInventory = { ...(account.inventory || {}) };
    nextInventory['item_potion'] = (nextInventory['item_potion'] || 0) + 2;

    const updated: TrainerAccount = {
      ...account,
      battleTokens: nextTokens,
      inventory: nextInventory,
    };
    onAccountUpdated(updated);
    setClaimedCrate(true);
    setPurchaseToast('Claimed +150 Battle Tokens!');
    setTimeout(() => setPurchaseToast(null), 3000);
  };

  const handleQuickBuy = (item: ShopItem) => {
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
    onAccountUpdated(updated);
    sound.playTrophyUnlock();
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
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
          disabled={claimedCrate}
          onClick={handleClaimFreeDaily}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 ${
            claimedCrate
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 hover:brightness-110 shadow-sm cursor-pointer'
          }`}
        >
          {claimedCrate ? (
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3" /> Claimed
            </span>
          ) : (
            'Claim Free'
          )}
        </button>
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

      {/* Open Full Shop Button */}
      <button
        type="button"
        onClick={() => {
          sound.playButtonPress();
          onOpenFullShop();
        }}
        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 hover:from-amber-500/30 to-rose-500/20 hover:to-rose-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm cursor-pointer"
      >
        <span>Open Full Poké Mart</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
