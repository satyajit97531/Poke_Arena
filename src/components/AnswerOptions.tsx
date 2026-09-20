import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Check, X, ArrowRight, Keyboard, Search, Skull } from 'lucide-react';
import { DifficultyMode, GameDifficulty, Pokemon } from '../types/pokemon';
import { sound } from '../utils/audio';

interface AnswerOptionsProps {
  options: Pokemon[];
  correctPokemon: Pokemon;
  selectedAnswer: string | null;
  isRevealed: boolean;
  onSelectAnswer: (pokemon: Pokemon) => void;
  onNextQuestion: () => void;
  difficultyMode: DifficultyMode;
  onToggleDifficulty: () => void;
  difficulty?: GameDifficulty;
}

export const AnswerOptions: React.FC<AnswerOptionsProps> = ({
  options,
  correctPokemon,
  selectedAnswer,
  isRevealed,
  onSelectAnswer,
  onNextQuestion,
  difficultyMode,
  onToggleDifficulty,
  difficulty,
}) => {
  const [typedInput, setTypedInput] = useState('');
  const isExtreme = difficulty === 'extreme';
  const effectiveMode: DifficultyMode = isExtreme ? 'master' : difficultyMode;

  // Keyboard navigation for options (1, 2, 3, 4) or Enter for next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isRevealed) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onNextQuestion();
        }
        return;
      }

      if (effectiveMode === 'options') {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= options.length) {
          e.preventDefault();
          onSelectAnswer(options[num - 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRevealed, effectiveMode, options, onSelectAnswer, onNextQuestion]);

  // Master mode manual submit
  const handleMasterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedInput.trim() || isRevealed || !correctPokemon) return;

    const normalized = typedInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const correctNormalized = (correctPokemon.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const displayNormalized = (correctPokemon.displayName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const isMatch = normalized === correctNormalized || normalized === displayNormalized;

    const matchedPokemon: Pokemon = {
      ...correctPokemon,
      id: isMatch ? correctPokemon.id : -99999,
      name: isMatch ? correctPokemon.name : typedInput.trim(),
      displayName: typedInput.trim(),
    };

    onSelectAnswer(matchedPokemon);
    setTypedInput('');
  };

  return (
    <div className="w-full max-w-xl mt-5 flex flex-col items-center gap-3">
      {/* If already revealed, show Next Question Call-To-Action Button */}
      {isRevealed ? (
        <motion.button
          id="btn-next-pokemon"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => {
            sound.playClick();
            onNextQuestion();
          }}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-display font-bold text-lg shadow-xl shadow-rose-500/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>Next Pokémon</span>
          <ArrowRight className="w-5 h-5" />
          <span className="text-xs bg-white/20 font-mono py-0.5 px-2 rounded ml-2 font-normal hidden sm:inline">
            Press Space / Enter
          </span>
        </motion.button>
      ) : effectiveMode === 'options' ? (
        /* Standard 4 Multiple Choice Grid */
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {options.map((opt, index) => {
            const isSelected = selectedAnswer === opt.name;
            const isCorrect = isRevealed && opt.id === correctPokemon.id;
            const isWrongSelected = isRevealed && isSelected && opt.id !== correctPokemon.id;

            return (
              <motion.button
                key={opt.id}
                id={`btn-option-${index + 1}`}
                whileHover={{ scale: isRevealed ? 1 : 1.02 }}
                whileTap={{ scale: isRevealed ? 1 : 0.98 }}
                onClick={() => {
                  if (!isRevealed) {
                    onSelectAnswer(opt);
                  }
                }}
                disabled={isRevealed}
                className={`relative w-full py-3 px-4 rounded-xl border text-left font-display font-semibold transition-all flex items-center justify-between overflow-hidden shadow-sm ${
                  isCorrect
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-emerald-500/30 ring-2 ring-emerald-500'
                    : isWrongSelected
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-rose-500/30 ring-2 ring-rose-500'
                    : isSelected
                    ? 'bg-slate-800 border-slate-600 text-white'
                    : 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-800 hover:border-slate-700 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs font-mono flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <span className="text-base sm:text-lg tracking-wide capitalize">
                    {opt.displayName}
                  </span>
                </div>

                {isCorrect && (
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
                {isWrongSelected && (
                  <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold">
                    <X className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      ) : (
        /* Hardcore Master Mode / Extreme Manual Typing */
        <form onSubmit={handleMasterSubmit} className="w-full flex flex-col gap-2">
          {isExtreme && (
            <div className="flex items-center justify-center gap-1.5 py-1 px-3 bg-purple-500/15 border border-purple-500/30 rounded-xl text-purple-300 text-xs font-semibold mb-1">
              <Skull className="w-3.5 h-3.5 text-purple-400" />
              <span>Extreme Mode: Zero options provided! Type Pokémon name using physical clues</span>
            </div>
          )}
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              id="input-master-pokemon"
              type="text"
              autoFocus
              placeholder={isExtreme ? "Type Pokémon name manually (e.g. Charizard, Lucario)..." : "Type Pokémon name (e.g. Tinkaton, Lucario)..."}
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              disabled={isRevealed}
              className={`w-full pl-12 pr-28 py-3.5 rounded-xl bg-slate-900 border text-white placeholder-slate-500 focus:outline-none focus:ring-1 font-display font-medium text-lg ${
                isExtreme
                  ? 'border-purple-500/50 focus:border-purple-400 focus:ring-purple-400'
                  : 'border-slate-700 focus:border-rose-500 focus:ring-rose-500'
              }`}
            />
            <button
              type="submit"
              disabled={!typedInput.trim() || isRevealed}
              className={`absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg disabled:opacity-40 text-white font-display font-bold text-sm transition-colors ${
                isExtreme ? 'bg-purple-600 hover:bg-purple-500' : 'bg-rose-500 hover:bg-rose-600'
              }`}
            >
              Guess
            </button>
          </div>
          <p className="text-xs text-slate-400 text-center">
            {isExtreme
              ? 'Spelling counts! Match the official English name and press Enter.'
              : 'Master Mode: Spelling matters! Type exact English name and hit Enter.'}
          </p>
        </form>
      )}

      {/* Difficulty Mode Switcher (Hidden in Extreme difficulty since Extreme requires manual typing) */}
      {!isExtreme && (
        <div className="w-full flex items-center justify-between text-xs text-slate-500 px-1 pt-1">
          <div className="flex items-center gap-1.5 hidden sm:flex">
            <Keyboard className="w-3.5 h-3.5" />
            <span>Hotkeys: Press [1], [2], [3], [4] on keyboard</span>
          </div>

          <button
            id="btn-toggle-difficulty"
            onClick={() => {
              sound.playClick();
              onToggleDifficulty();
            }}
            className="ml-auto text-xs font-semibold text-rose-400 hover:text-rose-300 underline underline-offset-4 decoration-rose-500/40 transition-colors"
          >
            Switch to {difficultyMode === 'options' ? 'Master Mode (Type Name)' : 'Multiple Choice Mode'}
          </button>
        </div>
      )}
    </div>
  );
};
