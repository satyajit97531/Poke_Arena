import React from 'react';
import { MainGameMode, RegionId } from '../types/pokemon';
import { REGIONS } from '../utils/pokemonTypes';
import {
  Target,
  Sparkles,
  GitBranch,
  Volume2,
  Swords,
  Compass,
  Layers,
  Crown,
  Users,
  Zap,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface ModeSelectorProps {
  mode: MainGameMode;
  region: RegionId;
  onChangeMode: (mode: MainGameMode) => void;
  onChangeRegion: (region: RegionId) => void;
  roundInfo?: { current: number; total?: number };
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  mode,
  region,
  onChangeMode,
  onChangeRegion,
  roundInfo,
}) => {
  const modes: {
    id: MainGameMode;
    label: string;
    badge?: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'classic', label: 'Silhouette', icon: Target },
    { id: 'legendary', label: 'Legendary Arena', badge: 'Rare', icon: Crown },
    { id: 'evolution', label: 'Evolution Line', badge: 'Puzzle', icon: GitBranch },
    { id: 'cry', label: 'Pokémon Cry', badge: 'Audio', icon: Volume2 },
    { id: 'moves', label: 'Attack Moves', badge: 'Battle', icon: Swords },
    { id: 'region_guess', label: 'Region Guess', icon: Compass },
    { id: 'type_guess', label: 'Type Master', icon: Layers },
    { id: '1v1', label: '1v1 Duel', badge: 'QR Code', icon: Users },
    { id: 'blitz', label: 'Blitz 60s', icon: Zap },
  ];

  const isSilhouetteBased = mode === 'classic' || mode === 'legendary' || mode === 'blitz' || mode === 'survival' || mode === 'zen';

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-2.5 py-1">
      {/* Scrollable Game Modes Bar */}
      <div className="w-full overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800 flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = mode === m.id;

          return (
            <button
              key={m.id}
              id={`mode-tab-${m.id}`}
              onClick={() => {
                sound.playButtonPress();
                onChangeMode(m.id);
              }}
              className={`shrink-0 flex items-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md shadow-rose-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{m.label}</span>
              {m.badge && (
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                    isActive ? 'bg-white/20 text-white' : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {m.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Region Selector (Applicable to silhouette & classic/legendary games) */}
      {isSilhouetteBased && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold uppercase tracking-wider pl-1 shrink-0">
            <Compass className="w-3.5 h-3.5 text-slate-400" />
            <span>Region:</span>
          </div>

          {REGIONS.map((r) => {
            const isSelected = region === r.id;

            return (
              <button
                key={r.id}
                id={`region-pill-${r.id}`}
                onClick={() => {
                  sound.playButtonPress();
                  onChangeRegion(r.id);
                }}
                className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-sm shadow-cyan-900/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {r.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Round Tracker (if Classic Mode) */}
      {mode === 'classic' && (
        <div className="flex items-center justify-between text-xs text-slate-300 px-2 py-0.5">
          <div className="flex items-center gap-1.5 font-bold text-rose-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Round {roundInfo?.current || 1}</span>
            <span className="text-[10px] text-slate-400 font-normal">• Unlimited Endless Rounds</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Endless Streak
          </span>
        </div>
      )}
    </div>
  );
};
