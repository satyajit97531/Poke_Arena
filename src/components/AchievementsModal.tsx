import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Award,
  Sparkles,
  Lock,
  CheckCircle2,
  Trophy,
  Flame,
  Star,
  Swords,
  Shield,
  Coins,
} from 'lucide-react';
import { TrainerAccount, Achievement } from '../types/pokemon';
import { ACHIEVEMENTS_LIST } from '../data/achievements';
import { sound } from '../utils/audio';
import { saveActiveAccount } from '../utils/accounts';
import confetti from 'canvas-confetti';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: TrainerAccount;
  onAccountUpdated: (updated: TrainerAccount) => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose,
  account,
  onAccountUpdated,
}) => {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  if (!isOpen) return null;

  // Filter only standard achievements (exclude gym badges which have their own dedicated modal)
  const standardAchievements = ACHIEVEMENTS_LIST.filter((ach) => !ach.isGymBadge);

  const totalCount = standardAchievements.length;
  const unlockedCount = standardAchievements.filter(
    (ach) => !!account.achievements[ach.id]?.unlocked
  ).length;

  const handleToggleShowcase = (achId: string) => {
    sound.playButtonPress();
    const current = account.showcasedAchievements || [];
    let next: string[];

    if (current.includes(achId)) {
      next = current.filter((id) => id !== achId);
    } else {
      if (current.length >= 3) {
        next = [...current.slice(1), achId];
      } else {
        next = [...current, achId];
      }
      try {
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
    }

    const updatedAcc: TrainerAccount = {
      ...account,
      showcasedAchievements: next,
    };
    saveActiveAccount(updatedAcc);
    onAccountUpdated(updatedAcc);
  };

  const filteredList = standardAchievements.filter((ach) => {
    const isUnlocked = !!account.achievements[ach.id]?.unlocked;
    if (filter === 'unlocked' && !isUnlocked) return false;
    if (filter === 'locked' && isUnlocked) return false;
    if (categoryFilter !== 'all' && ach.category !== categoryFilter) return false;
    return true;
  });

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
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-display text-white">
                  Trainer Achievements
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold uppercase tracking-wider border border-amber-500/30">
                  {unlockedCount}/{totalCount} Completed
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete milestones across all quiz modes, streaks, and battle predictions to unlock prestige badges, avatars, and Trophy Points.
              </p>
            </div>
          </div>

          <button
            id="btn-close-achievements"
            onClick={() => {
              sound.playButtonBack();
              onClose();
            }}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-90px)]">
          {/* Showcase Info Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-950 to-purple-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold font-display text-white flex items-center gap-2">
                  <span>Trainer Card Showcase Pins</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                    {(account.showcasedAchievements || []).length}/3 Pinned
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  Pin up to 3 of your most prestigious unlocked achievements to display proudly on your trainer card!
                </p>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Status filters */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
              {(['all', 'unlocked', 'locked'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setFilter(s);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                    filter === s
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Category filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All Categories' },
                { id: 'wins', label: 'Victory & Wins' },
                { id: 'streak', label: 'Streak' },
                { id: 'collector', label: 'Collector' },
                { id: 'mastery', label: 'Regional Mastery' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setCategoryFilter(cat.id);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl font-bold whitespace-nowrap border transition-all cursor-pointer ${
                    categoryFilter === cat.id
                      ? 'bg-slate-800 text-white border-amber-500/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredList.map((ach) => {
              const userAch = account.achievements[ach.id];
              const isUnlocked = !!userAch?.unlocked;
              const isShowcased = (account.showcasedAchievements || []).includes(ach.id);
              const progressVal = userAch?.progress || 0;
              const maxProgressVal = ach.maxProgress || 1;
              const progressPct = Math.min(100, Math.round((progressVal / maxProgressVal) * 100));

              return (
                <div
                  key={ach.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isUnlocked
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-md shadow-amber-950/20'
                      : 'bg-slate-950/60 border-slate-800/80 opacity-75'
                  }`}
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            isUnlocked
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-slate-900 text-slate-600 border-slate-800'
                          }`}
                        >
                          {isUnlocked ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Lock className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold font-display text-white">
                            {ach.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {ach.category} category
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                        +{ach.rewardTrophyPoints} TP
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-300 mb-3">{ach.description}</p>

                    {/* Progress Bar */}
                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-400">Progress:</span>
                        <span className={isUnlocked ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                          {isUnlocked ? 'Completed' : `${progressVal} / ${maxProgressVal}`}
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isUnlocked
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              : 'bg-gradient-to-r from-amber-500 to-rose-500'
                          }`}
                          style={{ width: `${isUnlocked ? 100 : progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rewards & Showcase Pin */}
                  <div className="pt-2 border-t border-slate-800/60 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Rewards:</span>
                      <div className="flex items-center gap-2">
                        {ach.rewardAvatarId && (
                          <span className="text-rose-400 font-semibold">
                            Avatar #{ach.rewardAvatarId}
                          </span>
                        )}
                        {ach.rewardSongId && (
                          <span className="text-cyan-400 font-semibold">Music Track</span>
                        )}
                        <span className="text-amber-400 font-bold">
                          +{ach.rewardTrophyPoints} TP
                        </span>
                      </div>
                    </div>

                    {isUnlocked && (
                      <button
                        type="button"
                        onClick={() => handleToggleShowcase(ach.id)}
                        className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isShowcased
                            ? 'bg-amber-500/20 border border-amber-400 text-amber-300 hover:bg-rose-500/20 hover:border-rose-400 hover:text-rose-300'
                            : (account.showcasedAchievements || []).length >= 3
                            ? 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-amber-300 hover:border-amber-500'
                            : 'bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {isShowcased
                            ? '★ Pinned to Showcase (Click to Unpin)'
                            : (account.showcasedAchievements || []).length >= 3
                            ? 'Showcase Full (3/3) - Click to Swap'
                            : '+ Pin to Profile Showcase'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
