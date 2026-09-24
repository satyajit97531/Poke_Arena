import React from 'react';
import { GameDifficulty } from '../types/pokemon';
import { Shield, Scissors, Target, Skull, Flame } from 'lucide-react';
import { sound } from '../utils/audio';

interface DifficultySelectorProps {
  difficulty: GameDifficulty;
  onChangeDifficulty: (diff: GameDifficulty) => void;
  allowedDifficulties?: GameDifficulty[];
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  difficulty,
  onChangeDifficulty,
  allowedDifficulties,
}) => {
  const allLevels: { id: GameDifficulty; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'easy', label: 'Easy', desc: 'Full Silhouette (15s)', icon: Shield },
    { id: 'medium', label: 'Medium', desc: 'Half Body Slice (15s)', icon: Scissors },
    { id: 'hard', label: 'Hard', desc: 'Body Part Zoom & 1-Line Hint (15s)', icon: Target },
    { id: 'extreme', label: 'Extreme', desc: '1-Line Clue, Types & 4 Options (30s)', icon: Skull },
    { id: 'menacing', label: 'Menacing', desc: '1-Line Hint, Evolution Stage & Manual Typing (60s)', icon: Flame },
  ];

  const levels = allowedDifficulties
    ? allLevels.filter((lvl) => allowedDifficulties.includes(lvl.id))
    : allLevels;

  return (
    <div className="w-full max-w-xl mx-auto flex items-center justify-between p-1.5 bg-slate-900/90 border border-slate-800 rounded-xl mb-3">
      <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 pl-2 hidden sm:inline">
        Difficulty:
      </span>

      <div className={`grid ${levels.length >= 5 ? 'grid-cols-5' : levels.length === 4 ? 'grid-cols-4' : 'grid-cols-3'} gap-1 sm:gap-1.5 flex-1 sm:flex-initial`}>
        {levels.map((lvl) => {
          const Icon = lvl.icon;
          const isActive = difficulty === lvl.id;

          let activeClasses = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
          if (lvl.id === 'medium') activeClasses = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
          if (lvl.id === 'hard') activeClasses = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
          if (lvl.id === 'extreme') activeClasses = 'bg-purple-500/25 text-purple-300 border-purple-500/50 shadow-purple-950/60';
          if (lvl.id === 'menacing') activeClasses = 'bg-red-500/25 text-red-300 border-red-500/50 shadow-red-950/60';

          return (
            <button
              key={lvl.id}
              id={`difficulty-btn-${lvl.id}`}
              onClick={() => {
                sound.playButtonPress();
                onChangeDifficulty(lvl.id);
              }}
              className={`flex items-center justify-center gap-1 py-1.5 px-1.5 sm:px-2.5 rounded-lg text-[11px] sm:text-xs font-semibold border transition-all ${
                isActive
                  ? `${activeClasses} font-bold shadow-md`
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
              title={lvl.desc}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{lvl.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

