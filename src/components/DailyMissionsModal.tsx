import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Target,
  X,
  Clock,
  CheckCircle2,
  Gift,
  Coins,
  Zap,
  Trophy,
  Flame,
  Swords,
  Gamepad2,
  Sparkles,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TrainerAccount } from '../types/pokemon';
import {
  getTodayDailyMissions,
  claimDailyMission,
  claimAllDailyMissionsBonus,
  ActiveDailyMission,
  ALL_MISSIONS_BONUS,
} from '../utils/dailyMissions';
import { getTimeUntilNextISTMidnight } from '../utils/dailyStreak';
import { sound } from '../utils/audio';

interface DailyMissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: TrainerAccount;
  onAccountUpdate?: (updated: TrainerAccount) => void;
  onAccountUpdated?: (updated: TrainerAccount) => void;
}

export const DailyMissionsModal: React.FC<DailyMissionsModalProps> = ({
  isOpen,
  onClose,
  account,
  onAccountUpdate,
  onAccountUpdated,
}) => {
  const handleUpdate = onAccountUpdated || onAccountUpdate || (() => {});
  const [timeUntilReset, setTimeUntilReset] = useState(() => getTimeUntilNextISTMidnight().formatted);
  const [claimedNotice, setClaimedNotice] = useState<string | null>(null);

  // Live ticking countdown to 00:00:00 IST
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTimeUntilReset(getTimeUntilNextISTMidnight().formatted);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Lock background scroll
  useEffect(() => {
    if (isOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const {
    missions,
    allCompleted,
    canClaimAllBonus,
    allClaimed,
    dateIST,
  } = getTodayDailyMissions(account);

  const completedCount = missions.filter((m) => m.completed).length;

  const handleClaimSingle = (mission: ActiveDailyMission) => {
    sound.playTrophyUnlock();
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    const { updatedAccount, rewardTokens, rewardExp } = claimDailyMission(account, mission.id);
    handleUpdate(updatedAccount);
    setClaimedNotice(`Claimed +${rewardTokens} Battle Tokens & +${rewardExp} EXP!`);
    setTimeout(() => setClaimedNotice(null), 3000);
  };

  const handleClaimGrandBonus = () => {
    sound.playFanfare();
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
    const { updatedAccount, bonusTokens, bonusTP, bonusExp } = claimAllDailyMissionsBonus(account);
    handleUpdate(updatedAccount);
    setClaimedNotice(`Grand Bonus Claimed! +${bonusTokens} BT, +${bonusTP} TP, +${bonusExp} EXP!`);
    setTimeout(() => setClaimedNotice(null), 4000);
  };

  const getMissionIcon = (category: string) => {
    switch (category) {
      case 'games':
        return <Gamepad2 className="w-5 h-5 text-indigo-400" />;
      case 'types':
        return <Flame className="w-5 h-5 text-orange-400" />;
      case 'speed':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'streak':
        return <Target className="w-5 h-5 text-cyan-400" />;
      case 'battle':
        return <Swords className="w-5 h-5 text-rose-400" />;
      case 'score':
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div
      id="daily-missions-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-hidden overscroll-contain"
      onClick={onClose}
      onWheel={(e) => e.stopPropagation()}
    >
      <motion.div
        id="daily-missions-modal-card"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] overscroll-contain"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black font-display text-white tracking-tight">
                  Daily Missions
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold">
                  {completedCount}/{missions.length} Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>Resets every 24h</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400 font-semibold font-mono">IST (Indian Standard Time)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live IST Countdown Pill */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-cyan-300"
              title={`Next 24h reset at 00:00:00 IST (Date: ${dateIST})`}
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Resets in:</span>
              <span className="font-bold text-white">{timeUntilReset}</span>
            </div>

            <button
              id="btn-close-daily-missions"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Container */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-4">
          {/* Mobile Reset Indicator */}
          <div className="flex sm:hidden items-center justify-between px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] font-mono">
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              Reset at 00:00 IST:
            </span>
            <span className="font-bold text-cyan-300">{timeUntilReset}</span>
          </div>

          {/* Toast Notice */}
          <AnimatePresence>
            {claimedNotice && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                <span>{claimedNotice}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grand Completion Bounty Box */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              canClaimAllBonus
                ? 'bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20 border-amber-500/50 shadow-lg shadow-amber-500/10 animate-pulse'
                : allClaimed
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black font-display text-white">
                      All Missions Grand Bounty
                    </h3>
                    {allClaimed ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                        Claimed for Today
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                        {completedCount}/6 Complete
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 text-amber-400 font-bold font-mono">
                      <Coins className="w-3 h-3" /> +{ALL_MISSIONS_BONUS.tokens} BT
                    </span>
                    <span className="flex items-center gap-1 text-yellow-300 font-bold font-mono">
                      <Trophy className="w-3 h-3" /> +{ALL_MISSIONS_BONUS.trophyPoints} TP
                    </span>
                    <span className="flex items-center gap-1 text-cyan-300 font-bold font-mono">
                      <Zap className="w-3 h-3" /> +{ALL_MISSIONS_BONUS.exp} EXP
                    </span>
                  </div>
                </div>
              </div>

              {canClaimAllBonus ? (
                <button
                  id="btn-claim-grand-bounty"
                  type="button"
                  onClick={handleClaimGrandBonus}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-xs transition-all hover:scale-105 active:scale-95 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>Claim Grand Bounty!</span>
                </button>
              ) : allClaimed ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Completed</span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 font-mono">
                  Finish all 6 missions to unlock
                </div>
              )}
            </div>
          </div>

          {/* Missions List */}
          <div className="space-y-3">
            {missions.map((mission) => {
              const percent = Math.min(100, Math.round((mission.progress / mission.target) * 100));

              return (
                <div
                  key={mission.id}
                  id={`daily-mission-card-${mission.id}`}
                  className={`p-4 rounded-2xl border transition-all ${
                    mission.claimed
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-80'
                      : mission.completed
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                        {getMissionIcon(mission.category)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                            {mission.title}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {mission.description}
                        </p>
                      </div>
                    </div>

                    {/* Reward & Action */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden xs:block">
                        <div className="flex items-center gap-1 text-amber-400 font-mono font-bold text-xs">
                          <Coins className="w-3 h-3" />
                          <span>+{mission.rewardTokens}</span>
                        </div>
                        <div className="text-[10px] text-cyan-400 font-mono">
                          +{mission.rewardExp} EXP
                        </div>
                      </div>

                      {mission.claimed ? (
                        <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Claimed</span>
                        </div>
                      ) : mission.completed ? (
                        <button
                          id={`btn-claim-mission-${mission.id}`}
                          type="button"
                          onClick={() => handleClaimSingle(mission)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-1 cursor-pointer"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          <span>Claim</span>
                        </button>
                      ) : (
                        <div className="text-right font-mono text-xs text-slate-400 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800/80">
                          <span className="font-bold text-white">{mission.progress}</span>
                          <span className="text-slate-600">/</span>
                          <span>{mission.target}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          mission.claimed
                            ? 'bg-emerald-500'
                            : mission.completed
                            ? 'bg-amber-400'
                            : 'bg-cyan-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0 w-8 text-right">
                      {percent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Automatic refresh daily at 00:00:00 IST
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
