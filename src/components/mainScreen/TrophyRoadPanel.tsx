import React from 'react';
import { Trophy, ChevronRight, Sparkles, Award } from 'lucide-react';
import { TrainerAccount } from '../../types/pokemon';
import { TROPHY_ROAD_REWARDS } from '../../data/rewardsData';
import { sound } from '../../utils/audio';

interface TrophyRoadPanelProps {
  account: TrainerAccount;
  onOpenTrophyRoad: () => void;
}

export const TrophyRoadPanel: React.FC<TrophyRoadPanelProps> = ({
  account,
  onOpenTrophyRoad,
}) => {
  const currentTP = account.trophyPoints || 0;

  // Find next milestone from the 100 Lakh progression
  const nextMilestone = TROPHY_ROAD_REWARDS.find((m) => m.trophies > currentTP) || TROPHY_ROAD_REWARDS[TROPHY_ROAD_REWARDS.length - 1];
  const prevMilestone = [...TROPHY_ROAD_REWARDS].reverse().find((m) => m.trophies <= currentTP) || { trophies: 0 };
  
  const span = Math.max(1, nextMilestone.trophies - prevMilestone.trophies);
  const currentProgress = Math.min(100, Math.max(0, ((currentTP - prevMilestone.trophies) / span) * 100));

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md border border-amber-500/30 rounded-2xl p-4 shadow-xl flex flex-col gap-3 transition-all hover:border-amber-400/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-md shadow-amber-950 flex items-center justify-center text-slate-950">
            <Trophy className="w-4 h-4 fill-slate-950" />
          </div>
          <div>
            <h3 className="text-xs font-black font-display text-white uppercase tracking-wider">
              Trophy Road
            </h3>
            <p className="text-[10px] text-amber-400/90 font-medium">100 Lakh Goal (10M TP)</p>
          </div>
        </div>

        {/* Current TP Display */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-xs font-black">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>{currentTP.toLocaleString()}</span>
          <span className="text-[9px] text-amber-400/80">TP</span>
        </div>
      </div>

      {/* Next Milestone Info */}
      <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-400" /> Next Milestone
          </span>
          <span className="font-mono font-bold text-amber-300">
            {nextMilestone.trophies.toLocaleString()} TP
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-rose-500 rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${Math.max(5, currentProgress)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span className="truncate pr-1 text-slate-300 font-semibold">{nextMilestone.rewardTitle}</span>
          <span className="text-amber-400 font-mono font-bold shrink-0">+{nextMilestone.tokens.toLocaleString()} BT</span>
        </div>
      </div>

      {/* Only this button opens the 1 Lakh Trophy Road */}
      <button
        id="btn-inspect-trophy-road"
        type="button"
        onClick={() => {
          sound.playButtonPress();
          onOpenTrophyRoad();
        }}
        className="w-full py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-md shadow-amber-950/20"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Inspect the 1 Lakh Trophy Road</span>
        <ChevronRight className="w-4 h-4 text-amber-400" />
      </button>
    </div>
  );
};
