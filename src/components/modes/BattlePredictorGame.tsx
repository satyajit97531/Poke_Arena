import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Zap, Shield, Trophy, ArrowRight, CheckCircle2, XCircle, Flame, Clock } from 'lucide-react';
import { GameDifficulty, Pokemon } from '../../types/pokemon';
import { BattleMatchup, generateRandomMatchup } from '../../utils/battleEngine';
import { sound } from '../../utils/audio';

interface BattlePredictorGameProps {
  difficulty?: GameDifficulty;
  onScoreEarned: (points: number, isPerfect: boolean) => void;
  onAdvanceMilestone: () => void;
}

export const BattlePredictorGame: React.FC<BattlePredictorGameProps> = ({
  difficulty = 'normal',
  onScoreEarned,
  onAdvanceMilestone,
}) => {
  const isExtreme = difficulty === 'extreme';
  const timeLimit = isExtreme ? 30 : 20;

  const [matchup, setMatchup] = useState<BattleMatchup>(() => generateRandomMatchup(isExtreme));
  const [selectedWinner, setSelectedWinner] = useState<'A' | 'B' | null>(null);
  const [hasRevealed, setHasRevealed] = useState(false);
  const [roundNumber, setRoundNumber] = useState(1);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [timerActive, setTimerActive] = useState(true);

  const handleTimeOutRef = useRef<() => void>(() => {});

  const handleTimeOut = () => {
    if (hasRevealed) return;
    setTimerActive(false);
    setHasRevealed(true);
    sound.playWrong();
    setStreak(0);
  };

  handleTimeOutRef.current = handleTimeOut;

  // Timer countdown
  useEffect(() => {
    if (!timerActive || hasRevealed) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, parseFloat((prev - 0.1).toFixed(1)));
        if (next <= 0) {
          clearInterval(interval);
          setTimeout(() => {
            handleTimeOutRef.current();
          }, 0);
          return 0;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [timerActive, hasRevealed]);

  const handleSelect = (choice: 'A' | 'B') => {
    if (hasRevealed) return;
    setSelectedWinner(choice);
    setHasRevealed(true);
    setTimerActive(false);

    const isCorrect = choice === matchup.winner;
    if (isCorrect) {
      sound.playCorrect();
      sound.playTrophyUnlock();
      const speedBonus = Math.round(timeLeft * 20);
      const points = 300 + speedBonus;
      setStreak((s) => s + 1);
      onScoreEarned(points, true);
      onAdvanceMilestone();
    } else {
      sound.playWrong();
      setStreak(0);
      onScoreEarned(50, false);
    }
  };

  const handleNextMatch = () => {
    sound.playButtonPress();
    setMatchup(generateRandomMatchup(isExtreme));
    setSelectedWinner(null);
    setHasRevealed(false);
    setTimeLeft(timeLimit);
    setTimerActive(true);
    setRoundNumber((r) => r + 1);
  };

  const isUserCorrect = selectedWinner === matchup.winner;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* Top Header Card */}
      <div className="w-full flex items-center justify-between px-4 py-2 mb-4 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-red-500/30">
            <Swords className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-display font-black text-white uppercase tracking-wider">
              Battle Predictor
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">
              Round {roundNumber} • Match Prediction
            </p>
          </div>
        </div>

        {/* Timer Pill */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border transition-colors ${
              timeLeft <= 5
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : 'bg-slate-800/80 text-amber-300 border-amber-500/30'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{timeLeft.toFixed(1)}s</span>
          </div>

          {streak > 1 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold font-mono">
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              <span>{streak}x Streak</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Clash Stadium Arena */}
      <div className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/80 border border-white/10 shadow-2xl p-6 md:p-8">
        {/* Subtle Background Arena Effects */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/30 via-transparent to-transparent" />

        {/* Arena VS Badge */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-red-600 via-amber-500 to-yellow-400 p-0.5 shadow-2xl shadow-amber-500/50 flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
              <span className="font-display font-black text-xl italic tracking-tighter bg-gradient-to-r from-red-400 to-yellow-300 bg-clip-text text-transparent">
                VS
              </span>
            </div>
          </div>
        </div>

        {/* 2 Contenders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {/* Contender A (Red Corner) */}
          <ContenderCard
            contender={matchup.pokemonA}
            corner="RED CORNER"
            cornerGradient="from-rose-500/10 to-red-600/5 hover:border-red-500/50"
            accentColor="border-red-500/30 text-rose-400"
            btnColor="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
            isSelected={selectedWinner === 'A'}
            isWinner={matchup.winner === 'A'}
            hasRevealed={hasRevealed}
            winProb={matchup.winProbabilityA}
            onSelect={() => handleSelect('A')}
          />

          {/* Contender B (Blue Corner) */}
          <ContenderCard
            contender={matchup.pokemonB}
            corner="BLUE CORNER"
            cornerGradient="from-blue-500/10 to-indigo-600/5 hover:border-blue-500/50"
            accentColor="border-blue-500/30 text-cyan-400"
            btnColor="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            isSelected={selectedWinner === 'B'}
            isWinner={matchup.winner === 'B'}
            hasRevealed={hasRevealed}
            winProb={matchup.winProbabilityB}
            onSelect={() => handleSelect('B')}
          />
        </div>

        {/* Reveal Results Banner */}
        <AnimatePresence>
          {hasRevealed && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 p-5 rounded-2xl bg-slate-900/90 border border-white/10 backdrop-blur-xl flex flex-col items-center text-center shadow-2xl relative z-20"
            >
              <div className="flex items-center gap-2 mb-2">
                {isUserCorrect ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 animate-bounce" />
                    <span className="text-emerald-400 font-display font-black text-lg tracking-wide uppercase">
                      PREDICTION ACCURATE! +350 PTS
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-rose-400" />
                    <span className="text-rose-400 font-display font-black text-lg tracking-wide uppercase">
                      INCORRECT PREDICTION
                    </span>
                  </>
                )}
              </div>

              {/* Match Winner Announcement */}
              <p className="text-base text-white font-semibold mb-2">
                Winner:{' '}
                <span className="text-amber-400 font-bold font-display">
                  {matchup.winner === 'A'
                    ? matchup.pokemonA.displayName
                    : matchup.pokemonB.displayName}
                </span>{' '}
                ({matchup.winner === 'A' ? matchup.winProbabilityA : matchup.winProbabilityB}% Win Rate)
              </p>

              {/* Tactical Reason */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-slate-300 max-w-xl mb-4 leading-relaxed">
                <span className="text-amber-400 font-bold uppercase tracking-wider mr-1">
                  Tactical Breakdown:
                </span>
                {matchup.primaryReason}
              </div>

              {/* Next Match Button */}
              <button
                id="btn-next-battle"
                onClick={handleNextMatch}
                className="py-3 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-display font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95"
              >
                <span>Next Battle Clash</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

interface ContenderCardProps {
  contender: Pokemon;
  corner: string;
  cornerGradient: string;
  accentColor: string;
  btnColor: string;
  isSelected: boolean;
  isWinner: boolean;
  hasRevealed: boolean;
  winProb: number;
  onSelect: () => void;
}

const ContenderCard: React.FC<ContenderCardProps> = ({
  contender,
  corner,
  cornerGradient,
  accentColor,
  btnColor,
  isSelected,
  isWinner,
  hasRevealed,
  winProb,
  onSelect,
}) => {
  return (
    <div
      className={`relative rounded-2xl p-5 border transition-all flex flex-col items-center bg-slate-900/40 backdrop-blur-sm ${cornerGradient} ${
        hasRevealed && isWinner
          ? 'ring-2 ring-emerald-400 border-emerald-400/50 bg-emerald-500/10'
          : hasRevealed && !isWinner
          ? 'opacity-60 border-slate-800'
          : 'border-white/10'
      }`}
    >
      {/* Corner Tag */}
      <div className="w-full flex items-center justify-between mb-3">
        <span className={`text-[10px] font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full border ${accentColor}`}>
          {corner}
        </span>
        {contender.isLegendary && (
          <span className="text-[10px] font-bold font-mono text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
            ★ LEGENDARY
          </span>
        )}
      </div>

      {/* Pokemon Artwork */}
      <div className="relative w-36 h-36 md:w-44 md:h-44 flex items-center justify-center my-2">
        <img
          src={contender.artwork}
          alt={contender.displayName}
          className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)] transition-transform duration-300 hover:scale-105"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Pokemon Name & Species */}
      <h3 className="text-xl font-display font-black text-white tracking-wide">
        {contender.displayName}
      </h3>
      <p className="text-xs text-slate-400 mb-3">{contender.species}</p>

      {/* Types */}
      <div className="flex items-center gap-1.5 mb-4">
        {contender.types.map((type) => (
          <span
            key={type}
            className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-800 text-slate-200 border border-white/10"
          >
            {type}
          </span>
        ))}
      </div>

      {/* Key Move & Height/Weight */}
      <div className="w-full grid grid-cols-2 gap-2 text-center text-[11px] font-mono text-slate-400 py-2 px-3 rounded-xl bg-slate-950/40 border border-white/5 mb-4">
        <div>
          <span className="block text-[9px] uppercase tracking-wider text-slate-500">Weight</span>
          <span className="text-slate-200 font-bold">{(contender.weight / 10).toFixed(1)} kg</span>
        </div>
        <div>
          <span className="block text-[9px] uppercase tracking-wider text-slate-500">Move</span>
          <span className="text-slate-200 font-bold truncate block">{contender.moves?.[0] || 'Tackle'}</span>
        </div>
      </div>

      {/* Prediction Action or Win Rate Bar */}
      {!hasRevealed ? (
        <button
          id={`btn-predict-${contender.name}`}
          onClick={onSelect}
          className={`w-full py-3 px-4 rounded-xl text-white font-display font-bold text-sm uppercase tracking-wider shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${btnColor}`}
        >
          Predict {contender.displayName} Wins
        </button>
      ) : (
        <div className="w-full flex flex-col items-center">
          <div className="w-full flex justify-between text-xs font-mono font-bold text-slate-300 mb-1">
            <span>Win Probability</span>
            <span className={isWinner ? 'text-emerald-400' : 'text-slate-400'}>{winProb}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ${
                isWinner ? 'bg-emerald-400 shadow-md shadow-emerald-400/50' : 'bg-slate-600'
              }`}
              style={{ width: `${winProb}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
