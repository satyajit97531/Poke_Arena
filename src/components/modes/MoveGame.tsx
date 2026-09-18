import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, CheckCircle2, XCircle, ArrowRight, Sparkles, Target, Zap } from 'lucide-react';
import { Pokemon } from '../../types/pokemon';
import { CURATED_POKEMON } from '../../data/pokemonData';
import { sound } from '../../utils/audio';

interface MoveGameProps {
  onScoreEarned: (points: number, isCorrect: boolean) => void;
  onAdvanceMilestone: () => void;
}

export const MoveGame: React.FC<MoveGameProps> = ({
  onScoreEarned,
  onAdvanceMilestone,
}) => {
  const [level, setLevel] = useState(1);
  const [movesCount, setMovesCount] = useState<1 | 2 | 3>(1);
  const [currentMoves, setCurrentMoves] = useState<string[]>([]);
  const [correctPokemon, setCorrectPokemon] = useState<Pokemon>(CURATED_POKEMON[0]);
  const [options, setOptions] = useState<Pokemon[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // Generate question according to current moves count
  const loadQuestion = (currentLvl: number) => {
    setIsAnswered(false);
    setSelectedId(null);

    // Moves count increases: Lvl 1-3 => 1 move; Lvl 4-6 => 2 moves; Lvl 7+ => 3 moves
    const count: 1 | 2 | 3 = currentLvl <= 3 ? 1 : currentLvl <= 6 ? 2 : 3;
    setMovesCount(count);

    // Candidates that have at least `count` moves defined
    const candidates = CURATED_POKEMON.filter((p) => p.moves && p.moves.length >= count);
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    const chosenMoves = [...(target.moves || [])].slice(0, count);

    // Pick 3 decoys that DO NOT have all `chosenMoves`
    const decoys = CURATED_POKEMON.filter((p) => {
      if (p.id === target.id) return false;
      const pMoves = p.moves || [];
      // If decoy possesses all chosen moves, exclude it to avoid ambiguity
      const hasAll = chosenMoves.every((m) => pMoves.includes(m));
      return !hasAll;
    });

    const shuffledDecoys = [...decoys].sort(() => Math.random() - 0.5).slice(0, 3);
    const opts = [target, ...shuffledDecoys].sort(() => Math.random() - 0.5);

    setCorrectPokemon(target);
    setCurrentMoves(chosenMoves);
    setOptions(opts);
  };

  useEffect(() => {
    loadQuestion(1);
  }, []);

  const handleSelectAnswer = (poke: Pokemon) => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedId(poke.id);

    const isCorrect = poke.id === correctPokemon.id;
    if (isCorrect) {
      sound.playCorrect();
      const points = 200 * movesCount;
      onScoreEarned(points, true);
      onAdvanceMilestone();
    } else {
      sound.playWrong();
      onScoreEarned(0, false);
    }
  };

  const handleNext = () => {
    sound.playButtonPress();
    const nextLvl = level + 1;
    setLevel(nextLvl);
    loadQuestion(nextLvl);
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Header Info */}
      <div className="w-full flex items-center justify-between px-2 mb-3">
        <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold font-display flex items-center gap-1.5">
          <Swords className="w-3.5 h-3.5 text-rose-400" />
          <span>Move & Attack Arsenal Guesser</span>
        </span>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Stage {level} ({movesCount} {movesCount === 1 ? 'Move' : 'Moves'})</span>
        </div>
      </div>

      {/* Attack Showcase Arena */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center mb-5 relative overflow-hidden">
        <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-3 flex items-center gap-1">
          <Target className="w-3.5 h-3.5 text-rose-400" />
          <span>Which Pokémon Can Learn {movesCount === 1 ? 'This Attack' : `These ${movesCount} Attacks`}?</span>
        </span>

        {/* Moves Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 my-3">
          {currentMoves.map((moveName, idx) => (
            <motion.div
              key={idx}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500/20 via-orange-500/20 to-amber-500/20 border border-rose-500/40 text-rose-200 font-display font-black text-sm tracking-wide shadow-md shadow-rose-950 flex items-center gap-2"
            >
              <Swords className="w-4 h-4 text-amber-400" />
              <span>{moveName}</span>
            </motion.div>
          ))}
        </div>

        <p className="text-xs text-slate-400 text-center max-w-sm mt-2">
          {movesCount === 1
            ? 'Only ONE of the four Pokémon below can wield this move!'
            : `Only ONE of the four Pokémon below can master ALL ${movesCount} of these attacks!`}
        </p>

        {/* Revealed card on answer */}
        <AnimatePresence>
          {isAnswered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-xl p-3 w-full max-w-sm"
            >
              <img
                src={correctPokemon.artwork}
                alt={correctPokemon.displayName}
                className="w-14 h-14 object-contain drop-shadow"
              />
              <div>
                <span className="text-[10px] font-mono text-rose-400">#{correctPokemon.id}</span>
                <h4 className="text-base font-black font-display text-white">{correctPokemon.displayName}</h4>
                <p className="text-[11px] text-slate-400">{correctPokemon.species}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4 Pokémon Choice Options */}
      <div className="w-full grid grid-cols-2 gap-3 mb-4">
        {options.map((opt, idx) => {
          const isSelected = selectedId === opt.id;
          const isCorrect = opt.id === correctPokemon.id;

          let btnClasses = 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200';
          if (isAnswered) {
            if (isCorrect) {
              btnClasses = 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold shadow-md shadow-emerald-950';
            } else if (isSelected) {
              btnClasses = 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold';
            } else {
              btnClasses = 'bg-slate-950/40 border-slate-900 opacity-40 text-slate-500';
            }
          }

          return (
            <button
              key={opt.id}
              id={`move-option-${opt.id}`}
              disabled={isAnswered}
              onClick={() => {
                sound.playButtonPress();
                handleSelectAnswer(opt);
              }}
              className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${btnClasses}`}
            >
              <img
                src={opt.artwork}
                alt={opt.displayName}
                className="w-10 h-10 object-contain shrink-0 drop-shadow"
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold font-display block truncate">{opt.displayName}</span>
                <span className="text-[10px] text-slate-500 uppercase">{opt.region}</span>
              </div>
              {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {isAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Next Question Button */}
      {isAnswered && (
        <button
          id="btn-next-move"
          onClick={handleNext}
          className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-display font-bold text-sm flex items-center gap-2 shadow-lg shadow-rose-500/30 transition-all hover:scale-105"
        >
          <span>Next Attack Round</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
