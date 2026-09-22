import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Play, CheckCircle2, XCircle, ArrowRight, Zap, Clock } from 'lucide-react';
import { GameDifficulty, Pokemon } from '../../types/pokemon';
import { CURATED_POKEMON } from '../../data/pokemonData';
import { sound } from '../../utils/audio';

interface CryGameProps {
  difficulty?: GameDifficulty;
  onScoreEarned: (points: number, isCorrect: boolean, timeRemaining: number) => void;
  onAdvanceMilestone: () => void;
}

export const CryGame: React.FC<CryGameProps> = ({
  difficulty = 'easy',
  onScoreEarned,
  onAdvanceMilestone,
}) => {
  const maxTime = difficulty === 'menacing' ? 60 : difficulty === 'extreme' ? 30 : 15;
  const [isStarted, setIsStarted] = useState(false);
  const [correctPokemon, setCorrectPokemon] = useState<Pokemon>(CURATED_POKEMON[0]);
  const [options, setOptions] = useState<Pokemon[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [timeLeft, setTimeLeft] = useState(maxTime);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const loadQuestion = () => {
    setIsAnswered(false);
    setSelectedId(null);
    setTimeLeft(maxTime);

    // Pick random target
    const target = CURATED_POKEMON[Math.floor(Math.random() * CURATED_POKEMON.length)];
    const others = CURATED_POKEMON.filter((p) => p.id !== target.id);
    const shuffledOthers = [...others].sort(() => Math.random() - 0.5).slice(0, 3);
    const opts = [target, ...shuffledOthers].sort(() => Math.random() - 0.5);

    setCorrectPokemon(target);
    setOptions(opts);

    // Play cry with slight delay
    setTimeout(() => {
      triggerCry(target);
    }, 400);
  };

  const triggerCry = (poke: Pokemon) => {
    setIsPlayingAudio(true);
    sound.playPokemonCry(poke.cryUrl, poke.id);
    setTimeout(() => {
      setIsPlayingAudio(false);
    }, 800);
  };

  useEffect(() => {
    // Only load question when game is started
    if (isStarted) {
      loadQuestion();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStarted]);

  const handleSelectAnswerRef = useRef<(poke: Pokemon | null) => void>(() => {});

  // Timer Tick
  useEffect(() => {
    if (!isStarted || isAnswered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, parseFloat((prev - 0.1).toFixed(1)));
        if (next <= 0) {
          clearInterval(timerRef.current!);
          setTimeout(() => {
            handleSelectAnswerRef.current(null); // Time out
          }, 0);
          return 0;
        }
        return next;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStarted, isAnswered, correctPokemon]);

  const handleStartGame = () => {
    sound.playButtonPress();
    setIsStarted(true);
  };

  const handleSelectAnswer = (poke: Pokemon | null) => {
    if (isAnswered) return;
    setIsAnswered(true);

    if (poke) {
      setSelectedId(poke.id);
      const isCorrect = poke.id === correctPokemon.id;
      if (isCorrect) {
        sound.playCorrect();
        // Quicker answers = exponentially higher score!
        const speedFactor = timeLeft / maxTime;
        const speedBonus = Math.round(speedFactor * 450);
        const totalPoints = 250 + speedBonus;
        onScoreEarned(totalPoints, true, timeLeft);
        onAdvanceMilestone();
      } else {
        sound.playWrong();
        onScoreEarned(0, false, 0);
      }
    } else {
      // Time out
      sound.playWrong();
      onScoreEarned(0, false, 0);
    }
  };

  handleSelectAnswerRef.current = handleSelectAnswer;

  const timePct = (timeLeft / maxTime) * 100;

  if (!isStarted) {
    return (
      <div className="w-full max-w-xl mx-auto flex flex-col items-center">
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-4 shadow-lg shadow-amber-950">
            <Volume2 className="w-8 h-8" />
          </div>

          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider mb-2">
            Audio Cry Challenge
          </span>

          <h3 className="text-2xl font-black font-display text-white mb-2">
            Who Cries That Sound?
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
            Test your acoustic knowledge! Make sure your device sound is turned on. When you start, you will hear an authentic Pokémon cry and have 12 seconds to choose the correct Pokémon.
          </p>

          <button
            id="btn-start-cry-game"
            onClick={handleStartGame}
            className="py-3.5 px-8 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-display font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-950/60 transition-all hover:scale-105 active:scale-95 flex items-center gap-2.5"
          >
            <Volume2 className="w-4 h-4" />
            <span>Start Cry Challenge</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Header Info */}
      <div className="w-full flex items-center justify-between px-2 mb-3">
        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold font-display flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5" />
          <span>Pokémon Cry / Sound Quiz</span>
        </span>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>{timeLeft.toFixed(1)}s</span>
        </div>
      </div>

      {/* Timer Bar */}
      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mb-4 border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-100"
          style={{ width: `${timePct}%` }}
        />
      </div>

      {/* Cry Player Stage */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center mb-5 relative overflow-hidden">
        {/* Background audio ripples */}
        <div className="relative my-4 flex items-center justify-center">
          {isPlayingAudio && (
            <>
              <div className="absolute w-36 h-36 rounded-full border-2 border-amber-400/40 animate-ping"></div>
              <div className="absolute w-48 h-48 rounded-full border border-amber-500/20 animate-pulse"></div>
            </>
          )}

          <button
            id="btn-play-cry"
            onClick={() => {
              sound.playButtonPress();
              triggerCry(correctPokemon);
            }}
            className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all shadow-xl ${
              isPlayingAudio
                ? 'bg-amber-500 text-slate-950 scale-105 shadow-amber-500/50'
                : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white hover:scale-105 active:scale-95 shadow-orange-500/30'
            }`}
          >
            <Volume2 className="w-10 h-10 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {isPlayingAudio ? 'Playing...' : 'Play Cry'}
            </span>
          </button>
        </div>

        <p className="text-xs text-slate-400 text-center max-w-sm mt-2">
          Listen carefully to the authentic Pokémon cry soundwave. The faster you lock in your answer, the higher your score multiplier!
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
              id={`cry-option-${opt.id}`}
              disabled={isAnswered}
              onClick={() => {
                sound.playButtonPress();
                handleSelectAnswer(opt);
              }}
              className={`p-3.5 rounded-xl border flex items-center gap-2.5 transition-all text-left ${btnClasses}`}
            >
              <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                {idx + 1}
              </span>
              <span className="text-sm font-bold font-display truncate flex-1">{opt.displayName}</span>
              {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {isAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Next Question Button */}
      {isAnswered && (
        <button
          id="btn-next-cry"
          onClick={() => {
            sound.playButtonPress();
            loadQuestion();
          }}
          className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-display font-bold text-sm flex items-center gap-2 shadow-lg shadow-rose-500/30 transition-all hover:scale-105"
        >
          <span>Next Sound Quiz</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
