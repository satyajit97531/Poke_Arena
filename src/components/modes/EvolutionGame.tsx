import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, CheckCircle2, XCircle, ArrowRight, RefreshCw, Trophy, Clock, Play, GitBranch } from 'lucide-react';
import { EvolutionChain, Pokemon } from '../../types/pokemon';
import { EVOLUTION_CHAINS } from '../../data/pokemonData';
import { sound } from '../../utils/audio';

interface EvolutionGameProps {
  onScoreEarned: (points: number, isPerfect: boolean) => void;
  onAdvanceMilestone: () => void;
}

export const EvolutionGame: React.FC<EvolutionGameProps> = ({
  onScoreEarned,
  onAdvanceMilestone,
}) => {
  const [isStarted, setIsStarted] = useState(false);
  const [chainIndex, setChainIndex] = useState(0);
  const [currentSlots, setCurrentSlots] = useState<Pokemon[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [roundTimer, setRoundTimer] = useState(20);
  const [timerActive, setTimerActive] = useState(false);

  const chain: EvolutionChain = EVOLUTION_CHAINS[chainIndex % EVOLUTION_CHAINS.length];

  // Initialize randomized slots
  const loadNextChain = (nextIdx: number, autoStart: boolean = true) => {
    const nextChain = EVOLUTION_CHAINS[nextIdx % EVOLUTION_CHAINS.length];
    const shuffled = [...nextChain.stagePokemon].sort(() => Math.random() - 0.5);
    // ensure not in exact order initially
    if (shuffled.every((p, idx) => p.name === nextChain.stagePokemon[idx].name)) {
      shuffled.reverse();
    }
    setChainIndex(nextIdx);
    setCurrentSlots(shuffled);
    setSelectedIndex(null);
    setStatus('idle');
    setRoundTimer(20);
    setTimerActive(autoStart);
  };

  useEffect(() => {
    loadNextChain(0, false);
  }, []);

  // Timer countdown (only active when game is started)
  useEffect(() => {
    if (!isStarted || !timerActive || status !== 'idle') return;
    const interval = setInterval(() => {
      setRoundTimer((prev) => {
        if (prev <= 0.1) {
          clearInterval(interval);
          setTimerActive(false);
          handleCheck(true);
          return 0;
        }
        return Math.max(0, prev - 0.1);
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isStarted, timerActive, status]);

  const handleStartGame = () => {
    sound.playButtonPress();
    setIsStarted(true);
    setTimerActive(true);
  };

  // Click card to swap
  const handleCardClick = (index: number) => {
    if (status !== 'idle') return;
    sound.playButtonPress();

    if (selectedIndex === null) {
      setSelectedIndex(index);
    } else {
      // Swap items at selectedIndex and index
      const updated = [...currentSlots];
      const temp = updated[selectedIndex];
      updated[selectedIndex] = updated[index];
      updated[index] = temp;
      setCurrentSlots(updated);
      setSelectedIndex(null);
    }
  };

  // Check if correct order
  const handleCheck = (timedOut: boolean = false) => {
    if (status !== 'idle') return;

    const isCorrect = !timedOut && currentSlots.every((p, idx) => p.name === chain.stagePokemon[idx].name);

    if (isCorrect) {
      setStatus('correct');
      sound.playCorrect();
      sound.playTrophyUnlock();
      const speedBonus = Math.round(roundTimer * 25);
      const points = 350 + speedBonus;
      onScoreEarned(points, true);
      onAdvanceMilestone();
    } else {
      setStatus('wrong');
      sound.playWrong();
      onScoreEarned(50, false);
    }
    setTimerActive(false);
  };

  // Helper to determine stage name for a pokemon once revealed
  const getStageBadge = (poke: Pokemon) => {
    const stageIndex = chain.stagePokemon.findIndex((p) => p.name === poke.name);
    if (stageIndex === 0) return { label: '🌱 Base Stage', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' };
    if (stageIndex === 1) return { label: '⚡ Middle Stage', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' };
    return { label: '👑 Final Stage', color: 'text-purple-400 bg-purple-500/20 border-purple-500/30' };
  };

  if (!isStarted) {
    return (
      <div className="w-full max-w-xl mx-auto flex flex-col items-center">
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center mb-4 shadow-lg shadow-cyan-950">
            <GitBranch className="w-8 h-8" />
          </div>

          <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider mb-2">
            Unlimited Rounds • Endless Mode
          </span>

          <h3 className="text-2xl font-black font-display text-white mb-2">
            Evolution Line Organizer
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
            Sort scrambled Pokémon into their exact evolutionary order from Base Stage ➔ Middle ➔ Final form! The evolution stages remain hidden until you submit your answer.
          </p>

          <button
            id="btn-start-evolution-game"
            onClick={handleStartGame}
            className="py-3.5 px-8 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-display font-black text-sm uppercase tracking-wider shadow-xl shadow-cyan-950/60 transition-all hover:scale-105 active:scale-95 flex items-center gap-2.5"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start Evolution Challenge</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      {/* Header Info */}
      <div className="w-full flex items-center justify-between px-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold font-display">
            Evolution Line Organizer
          </span>
          <span className="text-xs text-slate-400 font-medium">
            Round {chainIndex + 1} (Endless)
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>{roundTimer.toFixed(1)}s</span>
        </div>
      </div>

      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center">
        <h3 className="text-xl font-bold font-display text-white mb-1">
          {chain.name}
        </h3>
        <p className="text-xs text-slate-400 mb-6 text-center">
          Click any two Pokémon cards to swap their positions until they are in sequential evolution order. Stages will be revealed upon confirmation!
        </p>

        {/* Evolution Slots */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {currentSlots.map((poke, idx) => {
            const isSelected = selectedIndex === idx;
            const stageInfo = getStageBadge(poke);
            const isSlotCorrect = status !== 'idle' && chain.stagePokemon[idx].name === poke.name;

            return (
              <motion.div
                key={poke.id}
                id={`evolution-card-${poke.id}`}
                whileHover={{ scale: status === 'idle' ? 1.03 : 1 }}
                onClick={() => handleCardClick(idx)}
                className={`relative flex flex-col items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-rose-500/20 border-rose-400 shadow-lg shadow-rose-500/30 scale-105 ring-2 ring-rose-400'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                } ${status === 'correct' ? 'border-emerald-500/60 bg-emerald-500/10' : ''}`}
              >
                <div className="w-full flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Slot #{idx + 1}
                  </span>
                  {status !== 'idle' && (
                    <span className={`text-[10px] font-bold ${isSlotCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isSlotCorrect ? '✓ Match' : '✗ Wrong Slot'}
                    </span>
                  )}
                </div>

                <div className="w-28 h-28 flex items-center justify-center relative my-2">
                  <div className="w-24 h-24 rounded-full bg-slate-900/80 -z-0 absolute"></div>
                  <img
                    src={poke.artwork}
                    alt={poke.displayName}
                    className="max-h-24 w-auto object-contain drop-shadow-md select-none"
                  />
                </div>

                <div className="text-center mt-2 w-full">
                  <h4 className="text-sm font-bold font-display text-white">{poke.displayName}</h4>

                  {/* Stages HIDDEN before submission; REVEALED after submission */}
                  {status === 'idle' ? (
                    <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                      {isSelected ? 'Selected to Swap' : 'Position ' + (idx + 1)}
                    </span>
                  ) : (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 mt-1 rounded-full border ${stageInfo.color}`}
                    >
                      {stageInfo.label}
                    </motion.span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Status Message */}
        <AnimatePresence>
          {status !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`w-full p-3 rounded-xl mb-4 text-xs font-bold flex items-center justify-center gap-2 ${
                status === 'correct'
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
              }`}
            >
              {status === 'correct' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>PERFECT! You ordered the evolution line correctly!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Incorrect order! Correct Line: {chain.stageNames.join(' ➔ ')}</span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Controls */}
        <div className="w-full flex items-center justify-center gap-3">
          {status === 'idle' ? (
            <button
              id="btn-confirm-evolution"
              onClick={() => handleCheck(false)}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-slate-950 font-display font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95"
            >
              Confirm Evolution Line
            </button>
          ) : (
            <button
              id="btn-next-evolution"
              onClick={() => {
                sound.playButtonPress();
                loadNextChain(chainIndex + 1, true);
              }}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-display font-bold text-sm flex items-center gap-2 shadow-lg shadow-rose-500/30 transition-all hover:scale-105"
            >
              <span>Next Evolution Line (Round {chainIndex + 2})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
