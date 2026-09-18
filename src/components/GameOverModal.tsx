import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy as TrophyIcon, RefreshCw, BarChart2, Flame, Award, ArrowRight, Sparkles } from 'lucide-react';
import { GameMode, RoundResult, Trophy } from '../types/pokemon';
import { OFFICIAL_ARTWORK_URL } from '../data/pokemonData';
import { sound } from '../utils/audio';

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  mode: GameMode;
  results: RoundResult[];
  longestStreak: number;
  newTrophies: Trophy[];
  defaultPlayerName?: string;
  onPlayAgain: () => void;
  onOpenScoreboard: () => void;
  onSaveScore: (playerName: string) => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  score,
  mode,
  results,
  longestStreak,
  newTrophies,
  defaultPlayerName,
  onPlayAgain,
  onOpenScoreboard,
  onSaveScore,
}) => {
  const [playerName, setPlayerName] = useState(defaultPlayerName || 'Trainer');
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setPlayerName(defaultPlayerName || 'Trainer');
      setSaved(false);
    }
  }, [isOpen, defaultPlayerName]);

  if (!isOpen) return null;

  const totalQuestions = results.length;
  const correctCount = results.filter((r) => r.isCorrect).length;
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // Rank determination
  let rank = 'Pokémon Trainee';
  let rankColor = 'text-slate-300';
  if (score >= 5000 || (mode === 'blitz' && correctCount >= 20)) {
    rank = 'Pokémon Master';
    rankColor = 'text-amber-400';
  } else if (score >= 3500 || (mode === 'blitz' && correctCount >= 15)) {
    rank = 'Champion Rank';
    rankColor = 'text-rose-400';
  } else if (score >= 2000 || (mode === 'blitz' && correctCount >= 10)) {
    rank = 'Elite Four';
    rankColor = 'text-cyan-400';
  } else if (score >= 1000 || (mode === 'blitz' && correctCount >= 5)) {
    rank = 'Gym Leader';
    rankColor = 'text-emerald-400';
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saved && playerName.trim()) {
      onSaveScore(playerName.trim());
      setSaved(true);
      sound.playCorrect();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-center flex flex-col items-center"
      >
        {/* Confetti / Sparkle visual decoration */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-xl shadow-rose-500/30 mb-3">
          <Award className="w-8 h-8" />
        </div>

        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Run Completed • {mode.toUpperCase()}
        </span>
        <h2 className="text-3xl font-black font-display text-white mt-1 mb-1">
          {score.toLocaleString()} <span className="text-lg text-amber-400">PTS</span>
        </h2>
        <div className={`text-base font-bold font-display ${rankColor} mb-4 flex items-center gap-1.5`}>
          <Sparkles className="w-4 h-4" />
          <span>{rank}</span>
        </div>

        {/* Bento Stats */}
        <div className="w-full grid grid-cols-3 gap-2 mb-4">
          <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl">
            <span className="text-[11px] text-slate-400 block mb-0.5">Identified</span>
            <span className="text-lg font-bold font-display text-emerald-400">
              {correctCount} / {totalQuestions}
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl">
            <span className="text-[11px] text-slate-400 block mb-0.5">Accuracy</span>
            <span className="text-lg font-bold font-display text-cyan-400">{accuracy}%</span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl">
            <span className="text-[11px] text-slate-400 block mb-0.5">Best Streak</span>
            <span className="text-lg font-bold font-display text-orange-400 flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>{longestStreak}</span>
            </span>
          </div>
        </div>

        {/* Newly Unlocked Trophies Banner */}
        {newTrophies.length > 0 && (
          <div className="w-full bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border border-amber-500/40 rounded-xl p-3 mb-4 text-left">
            <div className="flex items-center gap-2 mb-2 text-amber-300 font-display font-bold text-xs">
              <TrophyIcon className="w-4 h-4 text-amber-400" />
              <span>NEW TROPHIES UNLOCKED! ({newTrophies.length})</span>
            </div>
            <div className="flex flex-col gap-2">
              {newTrophies.map((t) => (
                <div key={t.id} className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-lg p-2">
                  <img
                    src={OFFICIAL_ARTWORK_URL(t.pokemonId)}
                    alt={t.pokemonName}
                    className="w-10 h-10 object-contain drop-shadow"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white">{t.title}</h4>
                    <p className="text-[11px] text-amber-300/80">{t.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit to Hall of Fame */}
        {!saved ? (
          <form onSubmit={handleSave} className="w-full flex items-center gap-2 mb-4">
            <input
              type="text"
              maxLength={15}
              placeholder="Enter Trainer Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-medium focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-display font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Post Score
            </button>
          </form>
        ) : (
          <div className="w-full py-2 px-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
            <span>Score posted to Leaderboard!</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-2.5">
          <button
            id="btn-play-again"
            onClick={() => {
              sound.playClick();
              onPlayAgain();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-display font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Play Again</span>
          </button>

          <button
            id="btn-view-scoreboard"
            onClick={() => {
              sound.playClick();
              onOpenScoreboard();
            }}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-display font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            <span>Scoreboard</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
