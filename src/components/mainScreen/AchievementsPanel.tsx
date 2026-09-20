import React from 'react';
import { Medal, Star, ChevronRight, CheckCircle2 } from 'lucide-react';
import { TrainerAccount } from '../../types/pokemon';
import { ACHIEVEMENTS_LIST } from '../../data/achievements';
import { sound } from '../../utils/audio';

interface AchievementsPanelProps {
  account: TrainerAccount;
  onOpenAchievementsModal: () => void;
}

export const AchievementsPanel: React.FC<AchievementsPanelProps> = ({
  account,
  onOpenAchievementsModal,
}) => {
  // Filter core gameplay achievements (excluding regional badges)
  const coreAchievements = ACHIEVEMENTS_LIST.filter((a) => !a.isGymBadge);
  const unlockedCount = coreAchievements.filter(
    (a) => account.achievements?.[a.id]?.unlocked
  ).length;

  // Pick 3 active or near-completion achievements
  const displayAchievements = coreAchievements
    .sort((a, b) => {
      const aUnlocked = account.achievements?.[a.id]?.unlocked ? 1 : 0;
      const bUnlocked = account.achievements?.[b.id]?.unlocked ? 1 : 0;
      return aUnlocked - bUnlocked;
    })
    .slice(0, 3);

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3 transition-all hover:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Medal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black font-display text-white uppercase tracking-wider">
              Achievements
            </h3>
            <p className="text-[10px] text-slate-400">Milestones & Records</p>
          </div>
        </div>

        {/* Count Pill */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold">
          <Star className="w-3.5 h-3.5 text-cyan-400" />
          <span>{unlockedCount}</span>
          <span className="text-[10px] text-slate-500">/{coreAchievements.length}</span>
        </div>
      </div>

      {/* List of 3 Achievements */}
      <div className="space-y-2">
        {displayAchievements.map((ach) => {
          const userState = account.achievements?.[ach.id];
          const isUnlocked = Boolean(userState?.unlocked);
          const progress = Math.min(ach.maxProgress, userState?.progress || 0);
          const percent = Math.min(100, Math.round((progress / ach.maxProgress) * 100));

          return (
            <div
              key={ach.id}
              className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  {isUnlocked ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Medal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  )}
                  <span className="text-xs font-bold text-slate-200 truncate">{ach.title}</span>
                </div>
                <span className="text-[10px] font-mono text-amber-400 font-bold shrink-0">
                  +{ach.rewardTrophyPoints} TP
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isUnlocked ? 'bg-emerald-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[9px] text-slate-400">
                <span className="truncate">{ach.description}</span>
                <span className="font-mono ml-1 font-semibold">{percent}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* View All Achievements Button */}
      <button
        type="button"
        onClick={() => {
          sound.playButtonPress();
          onOpenAchievementsModal();
        }}
        className="w-full py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
      >
        <span>View All Achievements</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
