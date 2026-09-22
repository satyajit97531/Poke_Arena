import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, CheckCircle2, XCircle, ArrowRight, RefreshCw, Trophy, Clock, Play, GitBranch, Scissors, Target, Skull, Flame, Shield } from 'lucide-react';
import { EvolutionChain, GameDifficulty, Pokemon } from '../../types/pokemon';
import { EVOLUTION_CHAINS } from '../../data/pokemonData';
import { sound } from '../../utils/audio';

interface EvolutionGameProps {
  difficulty?: GameDifficulty;
  onScoreEarned: (points: number, isPerfect: boolean) => void;
  onAdvanceMilestone: () => void;
}

function generateShuffledDeck(): number[] {
  const indices = EVOLUTION_CHAINS.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

// Crop and zoom configurations for each evolution slot based on difficulty
function getSlotCropStyle(
  slotIndex: number,
  diff: GameDifficulty,
  isRevealed: boolean
): {
  clipStyle: React.CSSProperties;
  transformStyle: React.CSSProperties;
  badge: string | null;
  cutType: 'upper' | 'lower' | 'left' | 'target' | null;
} {
  if (isRevealed) {
    return {
      clipStyle: {},
      transformStyle: {},
      badge: null,
      cutType: null,
    };
  }

  if (diff === 'easy') {
    return {
      clipStyle: {},
      transformStyle: {},
      badge: null,
      cutType: null,
    };
  }

  if (diff === 'medium') {
    // Only half part of shadowed pictures of the complete evolution line is visible
    const isUpper = slotIndex % 2 === 0;
    return {
      clipStyle: isUpper
        ? { clipPath: 'polygon(0% 0%, 100% 0%, 100% 50%, 0% 50%)' }
        : { clipPath: 'polygon(0% 50%, 100% 50%, 100% 100%, 0% 100%)' },
      transformStyle: {},
      badge: isUpper ? '▲ Upper Half' : '▼ Lower Half',
      cutType: isUpper ? 'upper' : 'lower',
    };
  }

  if (diff === 'hard') {
    // Half part with alternating cuts
    if (slotIndex === 0) {
      return {
        clipStyle: { clipPath: 'polygon(0% 0%, 100% 0%, 100% 50%, 0% 50%)' },
        transformStyle: {},
        badge: '▲ Upper Half',
        cutType: 'upper',
      };
    } else if (slotIndex === 1) {
      return {
        clipStyle: { clipPath: 'polygon(0% 50%, 100% 50%, 100% 100%, 0% 100%)' },
        transformStyle: {},
        badge: '▼ Lower Half',
        cutType: 'lower',
      };
    } else {
      return {
        clipStyle: { clipPath: 'polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)' },
        transformStyle: {},
        badge: '◄ Left Half',
        cutType: 'left',
      };
    }
  }

  if (diff === 'extreme') {
    // Extreme difficulty: only one part of the body is visible
    if (slotIndex === 0) {
      return {
        clipStyle: {},
        transformStyle: { transform: 'scale(2.6)', transformOrigin: '50% 18%' },
        badge: 'Head Target',
        cutType: 'target',
      };
    } else if (slotIndex === 1) {
      return {
        clipStyle: {},
        transformStyle: { transform: 'scale(2.6)', transformOrigin: '50% 84%' },
        badge: 'Base Target',
        cutType: 'target',
      };
    } else {
      return {
        clipStyle: {},
        transformStyle: { transform: 'scale(2.6)', transformOrigin: '22% 48%' },
        badge: 'Body Target',
        cutType: 'target',
      };
    }
  }

  return { clipStyle: {}, transformStyle: {}, badge: null, cutType: null };
}

export const EvolutionGame: React.FC<EvolutionGameProps> = ({
  difficulty = 'easy',
  onScoreEarned,
  onAdvanceMilestone,
}) => {
  const isExtreme = difficulty === 'extreme';
  const initialTimeLimit =
    difficulty === 'menacing'
      ? 60
      : difficulty === 'extreme'
      ? 30
      : difficulty === 'hard'
      ? 18
      : difficulty === 'medium'
      ? 22
      : 25;

  const [isStarted, setIsStarted] = useState(false);
  const [deck, setDeck] = useState<number[]>(() => generateShuffledDeck());
  const [deckIndex, setDeckIndex] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [roundTimer, setRoundTimer] = useState(initialTimeLimit);
  const [timerActive, setTimerActive] = useState(false);

  const currentChainIndex = deck[deckIndex % deck.length] ?? 0;
  const chain: EvolutionChain = EVOLUTION_CHAINS[currentChainIndex] || EVOLUTION_CHAINS[0];

  const [currentSlots, setCurrentSlots] = useState<Pokemon[]>(() => {
    const initialChain = EVOLUTION_CHAINS[deck[0] ?? 0] || EVOLUTION_CHAINS[0];
    const shuffled = [...initialChain.stagePokemon].sort(() => Math.random() - 0.5);
    if (shuffled.every((p, idx) => p.name === initialChain.stagePokemon[idx].name)) {
      shuffled.reverse();
    }
    return shuffled;
  });

  // Keep a ref to handleCheck so timer interval does not call stale or in-render setState
  const handleCheckRef = useRef<(timedOut?: boolean) => void>(() => {});

  // Initialize randomized slots
  const loadNextChain = (nextDeckIdx: number, autoStart: boolean = true) => {
    let currentDeck = deck;
    let targetIdx = nextDeckIdx;
    if (nextDeckIdx >= deck.length) {
      currentDeck = generateShuffledDeck();
      setDeck(currentDeck);
      targetIdx = 0;
    }
    const selectedChainIndex = currentDeck[targetIdx % currentDeck.length];
    const nextChain = EVOLUTION_CHAINS[selectedChainIndex];
    const shuffled = [...nextChain.stagePokemon].sort(() => Math.random() - 0.5);
    // ensure not in exact order initially
    if (shuffled.every((p, idx) => p.name === nextChain.stagePokemon[idx].name)) {
      shuffled.reverse();
    }
    setDeckIndex(targetIdx);
    setRoundNumber((prev) => prev + 1);
    setCurrentSlots(shuffled);
    setSelectedIndex(null);
    setStatus('idle');
    setRoundTimer(initialTimeLimit);
    setTimerActive(autoStart);
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

  handleCheckRef.current = handleCheck;

  // Timer countdown (only active when game is started)
  useEffect(() => {
    if (!isStarted || !timerActive || status !== 'idle') return;

    const interval = setInterval(() => {
      setRoundTimer((prev) => {
        const next = Math.max(0, parseFloat((prev - 0.1).toFixed(1)));
        if (next <= 0) {
          clearInterval(interval);
          // Defer timeout handler outside state updater to prevent setState-in-render errors
          setTimeout(() => {
            handleCheckRef.current(true);
          }, 0);
          return 0;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isStarted, timerActive, status]);

  const handleStartGame = () => {
    sound.playButtonPress();
    setIsStarted(true);
    setTimerActive(true);
  };

  // Reset game state when difficulty changes so the Start button returns,
  // exactly matching the Silhouette game mode behavior
  useEffect(() => {
    setIsStarted(false);
    setTimerActive(false);
    setStatus('idle');
    setSelectedIndex(null);
    setRoundTimer(initialTimeLimit);
    const selectedChainIndex = deck[deckIndex % deck.length] ?? 0;
    const currentChain = EVOLUTION_CHAINS[selectedChainIndex] || EVOLUTION_CHAINS[0];
    const shuffled = [...currentChain.stagePokemon].sort(() => Math.random() - 0.5);
    if (shuffled.every((p, idx) => p.name === currentChain.stagePokemon[idx].name)) {
      shuffled.reverse();
    }
    setCurrentSlots(shuffled);
  }, [difficulty]);

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
            Shadow Silhouette Challenge • Endless Mode
          </span>

          <h3 className="text-2xl font-black font-display text-white mb-2">
            Evolution Line Organizer
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
            Analyze the shadowed Pokémon silhouettes! In Easy mode full silhouettes are visible, in Medium and Hard modes only half-body slices are visible, and in Extreme mode only one body part is shown. Click and swap cards into their sequential evolutionary order from Base Stage ➔ Middle ➔ Final form!
          </p>

          <button
            id="btn-start-evolution-game"
            onClick={handleStartGame}
            className="py-3.5 px-8 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-display font-black text-sm uppercase tracking-wider shadow-xl shadow-cyan-950/60 transition-all hover:scale-105 active:scale-95 flex items-center gap-2.5 cursor-pointer"
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
            Round {roundNumber} (Endless)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
              difficulty === 'easy'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : difficulty === 'medium'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : difficulty === 'hard'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-purple-500/25 text-purple-300 border-purple-500/40'
            }`}
          >
            {difficulty === 'easy' && <Shield className="w-3 h-3" />}
            {difficulty === 'medium' && <Scissors className="w-3 h-3" />}
            {difficulty === 'hard' && <Target className="w-3 h-3" />}
            {(difficulty === 'extreme' || difficulty === 'menacing') && <Skull className="w-3 h-3" />}
            <span>
              {difficulty === 'easy'
                ? 'Full Shadow'
                : difficulty === 'medium' || difficulty === 'hard'
                ? 'Half-Body Shadow'
                : '1 Body Part Shadow'}
            </span>
          </span>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{roundTimer.toFixed(1)}s</span>
          </div>
        </div>
      </div>

      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center">
        <h3 className="text-xl font-bold font-display text-white mb-1">
          {status !== 'idle' ? chain.name : 'Mystery Evolution Line'}
        </h3>
        <p className="text-xs text-slate-400 mb-6 text-center">
          {status === 'idle'
            ? difficulty === 'easy'
              ? 'Analyze the full shadowed silhouettes and click two cards to swap them into sequential evolutionary order!'
              : difficulty === 'medium' || difficulty === 'hard'
              ? 'Only half of each shadowed Pokémon is visible! Swap cards into sequential evolutionary order.'
              : 'Extreme Difficulty: Only one body part of each shadowed Pokémon is visible! Swap cards into sequential order.'
            : 'Evolution line results revealed below!'}
        </p>

        {/* Evolution Slots */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {currentSlots.map((poke, idx) => {
            const isSelected = selectedIndex === idx;
            const stageInfo = getStageBadge(poke);
            const isSlotCorrect = status !== 'idle' && chain.stagePokemon[idx].name === poke.name;
            const cropInfo = getSlotCropStyle(idx, difficulty, status !== 'idle');

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

                <div className="w-28 h-28 flex items-center justify-center relative my-2 overflow-hidden rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="w-20 h-20 rounded-full bg-slate-800/40 -z-0 absolute"></div>

                  {/* Dashed line cut overlay for half-body modes */}
                  {status === 'idle' && (cropInfo.cutType === 'upper' || cropInfo.cutType === 'lower') && (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-b border-dashed border-amber-400/50 pointer-events-none z-20" />
                  )}
                  {status === 'idle' && cropInfo.cutType === 'left' && (
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-r border-dashed border-amber-400/50 pointer-events-none z-20" />
                  )}

                  {/* Reticle overlay for extreme one body part target */}
                  {status === 'idle' && cropInfo.cutType === 'target' && (
                    <div className="absolute inset-1 pointer-events-none border border-purple-500/30 rounded-lg flex items-center justify-center z-20">
                      <div className="w-12 h-12 rounded-full border border-dashed border-purple-400/50 animate-pulse" />
                    </div>
                  )}

                  <div
                    className="w-full h-full flex items-center justify-center transition-all duration-500 relative z-10"
                    style={{ ...cropInfo.clipStyle, ...cropInfo.transformStyle }}
                  >
                    <img
                      src={poke.artwork}
                      alt={status !== 'idle' ? poke.displayName : 'Mystery Pokémon Silhouette'}
                      className={`max-h-24 w-auto object-contain select-none transition-all duration-500 ${
                        status !== 'idle' ? 'pokemon-revealed' : 'pokemon-silhouette'
                      }`}
                    />
                  </div>

                  {/* Small crop badge for clarity */}
                  {status === 'idle' && cropInfo.badge && (
                    <span className="absolute bottom-1 right-1 z-20 text-[8px] font-bold px-1 py-0.2 rounded bg-slate-950/90 text-slate-300 border border-slate-700/80 uppercase tracking-tighter">
                      {cropInfo.badge}
                    </span>
                  )}
                </div>

                <div className="text-center mt-2 w-full">
                  <h4 className="text-sm font-bold font-display text-white">
                    {status !== 'idle' ? poke.displayName : '???'}
                  </h4>

                  {/* Stages HIDDEN before submission; REVEALED after submission */}
                  {status === 'idle' ? (
                    <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
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
                loadNextChain(deckIndex + 1, true);
              }}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-display font-bold text-sm flex items-center gap-2 shadow-lg shadow-rose-500/30 transition-all hover:scale-105"
            >
              <span>Next Evolution Line (Round {roundNumber + 1})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
