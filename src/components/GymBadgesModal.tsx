import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Medal,
  Lock,
  CheckCircle2,
  Sparkles,
  Trophy,
  Shield,
} from 'lucide-react';
import { TrainerAccount } from '../types/pokemon';
import { ALL_REGIONAL_BADGES, GymBadgeInfo } from '../data/regionalBadges';
import { sound } from '../utils/audio';

interface GymBadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: TrainerAccount;
  initialRegion?: string;
}

const REGION_CATEGORIES = [
  'All',
  'Kanto',
  'Johto',
  'Hoenn',
  'Sinnoh',
  'Unova',
  'Kalos',
  'Alola',
  'Galar',
  'Paldea',
  'Paldea Titans',
  'Paldea Team Star',
  'Battle Frontier',
  'Champion Crests',
] as const;

export const GymBadgesModal: React.FC<GymBadgesModalProps> = ({
  isOpen,
  onClose,
  account,
  initialRegion = 'All',
}) => {
  const [badgeRegion, setBadgeRegion] = useState<string>(initialRegion);

  useEffect(() => {
    if (isOpen && initialRegion) {
      setBadgeRegion(initialRegion);
    }
  }, [isOpen, initialRegion]);

  if (!isOpen) return null;

  // Calculate total badges and earned badges
  let totalBadgesCount = 0;
  let earnedBadgesCount = 0;

  Object.values(ALL_REGIONAL_BADGES).forEach((badges) => {
    badges.forEach((badge) => {
      totalBadgesCount++;
      if (account.achievements[badge.id]?.unlocked) {
        earnedBadgesCount++;
      }
    });
  });

  const displayBadges: GymBadgeInfo[] = [];
  Object.entries(ALL_REGIONAL_BADGES).forEach(([regionKey, badges]) => {
    if (badgeRegion === 'All' || badgeRegion === regionKey) {
      displayBadges.push(...badges);
    }
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
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center shadow-lg shrink-0">
              <Medal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-display text-white">
                  Regional Gym Badges & Crests
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold uppercase tracking-wider border border-purple-500/30">
                  {earnedBadgesCount}/{totalBadgesCount} Conquered
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Conquer gym leaders across all 9 official Pokémon regions, Island Trials, and Frontier Facilities to earn League Badges.
              </p>
            </div>
          </div>

          <button
            id="btn-close-badges"
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
          {/* Progress Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/20 via-slate-950 to-indigo-500/10 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold font-display text-white flex items-center gap-2">
                <span>League Challenge Progression</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  {Math.round((earnedBadgesCount / Math.max(1, totalBadgesCount)) * 100)}% Complete
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Badges automatically unlock as you achieve regional victory milestones in Quiz and Battle modes.
              </p>
            </div>
            <div className="w-full sm:w-48 bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden shrink-0">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-500"
                style={{
                  width: `${Math.min(100, (earnedBadgesCount / Math.max(1, totalBadgesCount)) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Regional Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {REGION_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setBadgeRegion(cat);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                  badgeRegion === cat
                    ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {displayBadges.map((badge) => {
              const isEarned = !!account.achievements[badge.id]?.unlocked;
              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
                    isEarned
                      ? 'bg-purple-500/15 border-purple-400/50 shadow-md shadow-purple-950/30'
                      : 'bg-slate-950/60 border-slate-800/80 opacity-70'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-3xl select-none shrink-0 shadow-inner">
                    {badge.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-sm font-bold font-display text-white flex items-center gap-1.5 truncate">
                        {isEarned ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        )}
                        <span>{badge.name}</span>
                      </h4>
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                        +{badge.rewardTrophyPoints} TP
                      </span>
                    </div>

                    <div className="text-[11px] text-purple-300 font-semibold mb-1">
                      {badge.gymLeader} • {badge.town} ({badge.region})
                    </div>

                    <p className="text-xs text-slate-400 mb-2">{badge.description}</p>

                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/60">
                      <span className="text-slate-500">Type: {badge.type}</span>
                      <span
                        className={
                          isEarned ? 'text-emerald-400 font-bold' : 'text-slate-500'
                        }
                      >
                        {isEarned ? '★ Conquered' : 'Locked (Battle in Arena)'}
                      </span>
                    </div>
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
