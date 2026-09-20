import React, { useState } from 'react';
import { Shield, Award, ChevronRight, Sparkles } from 'lucide-react';
import { TrainerAccount } from '../../types/pokemon';
import { ALL_REGIONAL_BADGES, GymBadgeInfo } from '../../data/regionalBadges';
import { sound } from '../../utils/audio';

interface BadgesPanelProps {
  account: TrainerAccount;
  onOpenBadgesModal: (region?: string) => void;
}

const REGION_LIST = ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola', 'Galar', 'Paldea'];

export const BadgesPanel: React.FC<BadgesPanelProps> = ({
  account,
  onOpenBadgesModal,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('Kanto');

  const badges = ALL_REGIONAL_BADGES[selectedRegion] || ALL_REGIONAL_BADGES['Kanto'];
  
  // Calculate total badges unlocked
  let totalBadgesCount = 0;
  let unlockedBadgesCount = 0;
  Object.values(ALL_REGIONAL_BADGES).forEach((list) => {
    list.forEach((b) => {
      totalBadgesCount++;
      if (account.achievements?.[b.id]?.unlocked) {
        unlockedBadgesCount++;
      }
    });
  });

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3 transition-all hover:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black font-display text-white uppercase tracking-wider">
              Gym Badges
            </h3>
            <p className="text-[10px] text-slate-400">All 9 Regions (72 Badges)</p>
          </div>
        </div>

        {/* Count Pill */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-xs font-bold">
          <Award className="w-3.5 h-3.5 text-purple-400" />
          <span>{unlockedBadgesCount}</span>
          <span className="text-[10px] text-slate-500">/{totalBadgesCount}</span>
        </div>
      </div>

      {/* Region Switcher Pills */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
        {REGION_LIST.map((reg) => (
          <button
            key={reg}
            type="button"
            onClick={() => {
              sound.playButtonPress();
              setSelectedRegion(reg);
            }}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all shrink-0 ${
              selectedRegion === reg
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {reg}
          </button>
        ))}
      </div>

      {/* Badges Grid for Selected Region */}
      <div className="grid grid-cols-4 gap-1.5 p-2 rounded-xl bg-slate-950/70 border border-slate-800">
        {badges.map((badge) => {
          const isUnlocked = Boolean(account.achievements?.[badge.id]?.unlocked);
          return (
            <div
              key={badge.id}
              onClick={() => {
                sound.playButtonPress();
                onOpenBadgesModal(selectedRegion);
              }}
              title={`${badge.name} - ${badge.town} (${badge.gymLeader})`}
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all cursor-pointer ${
                isUnlocked
                  ? 'bg-slate-900 border-amber-500/50 shadow-sm shadow-amber-950/50 hover:scale-105'
                  : 'bg-slate-900/40 border-slate-800/80 opacity-60 hover:opacity-100'
              }`}
            >
              <span className="text-xl leading-none my-0.5">{badge.emoji}</span>
              <span className="text-[9px] font-bold text-slate-300 truncate w-full text-center">
                {badge.name.replace(' Badge', '')}
              </span>
            </div>
          );
        })}
      </div>

      {/* Open All 9 Regions Button */}
      <button
        type="button"
        onClick={() => {
          sound.playButtonPress();
          onOpenBadgesModal(selectedRegion);
        }}
        className="w-full py-2 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
      >
        <span>Inspect All 9 Regions & Crests</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
