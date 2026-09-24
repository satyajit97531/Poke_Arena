import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Sparkles, Eye, Compass, Info, Target, Scissors, Zap, Skull, ShieldCheck, Flame, Lightbulb } from 'lucide-react';
import { GameDifficulty, MainGameMode, Pokemon, ShadowCropType } from '../types/pokemon';
import { POKEMON_TYPES, REGIONS } from '../utils/pokemonTypes';
import { getOneLinePokemonHint, getEvolutionStageHint } from '../utils/extremeClues';
import { sound } from '../utils/audio';

interface SilhouetteStageProps {
  pokemon: Pokemon;
  isRevealed: boolean;
  timeLeft: number;
  maxTime: number;
  mode: MainGameMode;
  difficulty: GameDifficulty;
  shadowCrop?: ShadowCropType;
  lives: number;
  revealedHints: {
    types: boolean;
    region: boolean;
    category: boolean;
    initialLetter: boolean;
  };
  onRevealHint: (hintKey: 'region' | 'category' | 'initialLetter') => void;
  lastPointsEarned?: number;
  lastMultiplier?: number;
}

export const SilhouetteStage: React.FC<SilhouetteStageProps> = ({
  pokemon,
  isRevealed,
  timeLeft,
  maxTime,
  mode,
  difficulty,
  shadowCrop = 'full',
  lives,
  revealedHints,
  onRevealHint,
  lastPointsEarned,
  lastMultiplier,
}) => {
  const primaryType = pokemon.types[0];
  const primaryMeta = POKEMON_TYPES[primaryType] || POKEMON_TYPES.normal;
  const regionData = REGIONS.find((r) => r.id === pokemon.region);

  const timePercent = maxTime > 0 ? Math.max(0, Math.min(100, (timeLeft / maxTime) * 100)) : 100;
  const isUrgent = mode !== 'zen' && timeLeft <= 4 && !isRevealed;

  // Medium Difficulty: Upper or Lower body half
  let clipStyle: React.CSSProperties = {};
  let transformStyle: React.CSSProperties = {};

  if (!isRevealed) {
    if (difficulty === 'medium') {
      if (shadowCrop === 'upper') {
        clipStyle = { clipPath: 'polygon(0% 0%, 100% 0%, 100% 50%, 0% 50%)' };
      } else {
        clipStyle = { clipPath: 'polygon(0% 50%, 100% 50%, 100% 100%, 0% 100%)' };
      }
    } else if (difficulty === 'hard') {
      // Hard Difficulty: Specific zoomed body part
      if (shadowCrop === 'head') {
        transformStyle = { transform: 'scale(2.6)', transformOrigin: '50% 15%' };
      } else if (shadowCrop === 'tail') {
        transformStyle = { transform: 'scale(2.6)', transformOrigin: '82% 75%' };
      } else if (shadowCrop === 'arm') {
        transformStyle = { transform: 'scale(2.6)', transformOrigin: '18% 48%' };
      } else if (shadowCrop === 'leg') {
        transformStyle = { transform: 'scale(2.6)', transformOrigin: '50% 88%' };
      } else {
        transformStyle = { transform: 'scale(2.4)', transformOrigin: '50% 30%' };
      }
    }
  }

  return (
    <div className="w-full relative flex flex-col items-center">
      {/* Top Status Bar: Timer or Lives + Difficulty Badge */}
      <div className="w-full max-w-xl flex items-center justify-between px-2 mb-3">
        {/* Left: Round Mode Indicator */}
        <div className="flex items-center gap-2">
          {mode === 'survival' ? (
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-full">
              <span className="text-xs text-slate-400 font-medium">Lives:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((ballIndex) => (
                  <div
                    key={ballIndex}
                    className={`w-5 h-5 rounded-full border border-slate-900 transition-all ${
                      ballIndex <= lives
                        ? 'bg-gradient-to-b from-rose-500 via-rose-600 to-white shadow-sm shadow-rose-500/50 scale-100'
                        : 'bg-slate-700/50 opacity-30 scale-90'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : mode === 'zen' ? (
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Zen Practice</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-full">
              <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-rose-500 animate-spin' : 'text-slate-400'}`} />
              <span className="text-xs text-slate-400">Time:</span>
              <span className={`text-sm font-bold font-display ${isUrgent ? 'text-rose-400 animate-pulse' : 'text-slate-100'}`}>
                {timeLeft.toFixed(1)}s
              </span>
            </div>
          )}
        </div>

        {/* Right: Difficulty & National Dex ID badge */}
        <div className="flex items-center gap-2">
          {difficulty === 'medium' && (
            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Scissors className="w-3 h-3" />
              <span>Medium ({shadowCrop === 'upper' ? 'Upper Half' : 'Lower Half'})</span>
            </span>
          )}

          {difficulty === 'hard' && (
            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
              <Target className="w-3 h-3 text-rose-400" />
              <span>Hard ({shadowCrop.toUpperCase()} ONLY)</span>
            </span>
          )}

          {difficulty === 'extreme' && (
            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
              <Skull className="w-3 h-3 text-purple-400" />
              <span>Extreme</span>
            </span>
          )}

          {difficulty === 'menacing' && (
            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
              <Flame className="w-3 h-3 text-red-400" />
              <span>Menacing</span>
            </span>
          )}

          <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
            {isRevealed ? `#${String(pokemon.id).padStart(4, '0')}` : 'National Dex ???'}
          </span>
        </div>
      </div>

      {/* Timer Bar for Classic / Blitz / Survival / Menacing */}
      {mode !== 'zen' && (
        <div className="w-full max-w-xl h-2 bg-slate-900/90 rounded-full overflow-hidden border border-slate-800/80 mb-3 relative">
          <motion.div
            className={`h-full rounded-full transition-colors ${
              timePercent < 25
                ? 'bg-rose-500 shadow-sm shadow-rose-500'
                : timePercent < 50
                ? 'bg-amber-400'
                : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
            }`}
            animate={{ width: `${timePercent}%` }}
            transition={{ ease: 'linear', duration: 0.1 }}
          />
        </div>
      )}

      {/* 1-Line Normal Hint for Hard Difficulty Mode */}
      {!isRevealed && difficulty === 'hard' && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl mx-auto mb-2.5 px-3.5 py-1.5 rounded-xl flex items-center justify-center gap-2 text-center shadow-md backdrop-blur-md bg-rose-950/60 border border-rose-500/40 text-rose-200"
        >
          <Lightbulb className="w-4 h-4 shrink-0 animate-pulse text-amber-400" />
          <div className="text-xs sm:text-sm font-medium">
            <span className="opacity-80">Hint:</span>{' '}
            <strong className="text-white font-bold tracking-wide">
              {getOneLinePokemonHint(pokemon)}
            </strong>
          </div>
        </motion.div>
      )}

      {/* Main Silhouette Arena Display */}
      <div className="relative w-full max-w-xl aspect-[4/3] max-h-[360px] sm:max-h-[400px] rounded-2xl bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-900/90 border border-slate-800 shadow-2xl flex flex-col items-center justify-center p-6 overflow-hidden">
        {/* Dynamic Background Glow according to Primary Type */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20 transition-all duration-700"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${primaryMeta.glowColor} 0%, transparent 70%)`,
          }}
        />

        {/* Ambient Reticle or Ring Pattern */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
          {difficulty === 'hard' ? (
            <div className="w-56 h-56 rounded-full border-2 border-dashed border-rose-500/60 animate-pulse"></div>
          ) : (
            <>
              <div className="w-72 h-72 rounded-full border border-dashed border-slate-700 animate-pulse-ring"></div>
              <div className="absolute w-48 h-48 rounded-full border border-slate-800"></div>
            </>
          )}
        </div>

        {/* Floating Reveal Score Bonus */}
        <AnimatePresence>
          {isRevealed && lastPointsEarned && lastPointsEarned > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: -20, scale: 1.1 }}
              exit={{ opacity: 0 }}
              className="absolute top-4 right-4 z-20 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-display font-extrabold px-3 py-1 rounded-full text-sm shadow-lg shadow-orange-500/30 flex items-center gap-1.5"
            >
              <span>+{lastPointsEarned} pts</span>
              {lastMultiplier && lastMultiplier > 1 && (
                <span className="text-[10px] bg-white/20 px-1 rounded">{lastMultiplier}x</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pokemon Image (Silhouette vs Revealed with Crop / Zoom) OR Extreme/Menacing Classified 1-Line Intel */}
        <div className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden">
          {!isRevealed && (difficulty === 'extreme' || difficulty === 'menacing') ? (
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-3 sm:p-5 text-center">
              {difficulty === 'menacing' ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold font-display uppercase tracking-wider mb-3">
                  <Flame className="w-3.5 h-3.5 text-red-400" />
                  <span>Menacing Classified Dossier</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold font-display uppercase tracking-wider mb-3">
                  <Skull className="w-3.5 h-3.5 text-purple-400" />
                  <span>Extreme Classified Dossier</span>
                </div>
              )}

              <div
                className={`w-full max-w-md bg-slate-950/90 border ${
                  difficulty === 'menacing'
                    ? 'border-red-500/40 shadow-red-950/30'
                    : 'border-purple-500/40 shadow-purple-950/30'
                } rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col items-center justify-center text-center`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb
                    className={`w-5 h-5 ${
                      difficulty === 'menacing' ? 'text-red-400' : 'text-amber-400'
                    } animate-pulse shrink-0`}
                  />
                  <span className="text-xs uppercase font-bold tracking-widest text-slate-400">
                    Main Pokémon Clue
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-black font-display text-white tracking-wide leading-snug my-2">
                  &ldquo;{getOneLinePokemonHint(pokemon)}&rdquo;
                </p>

                {difficulty === 'menacing' && (
                  <div className="mt-2.5 px-3.5 py-1.5 rounded-xl bg-red-950/80 border border-red-500/30 flex items-center justify-center gap-2 text-xs sm:text-sm text-red-200">
                    <span className="text-red-400 font-bold uppercase tracking-wider text-[11px]">
                      Evolution Stage:
                    </span>
                    <strong className="text-white font-black tracking-wide">
                      {getEvolutionStageHint(pokemon)}
                    </strong>
                  </div>
                )}

                <p
                  className={`text-xs ${
                    difficulty === 'menacing' ? 'text-red-300/80' : 'text-purple-300/80'
                  } mt-2.5 font-medium`}
                >
                  {difficulty === 'menacing'
                    ? 'Zero options provided! Type the exact Pokémon name below.'
                    : '4 options provided below! Identify the matching Pokémon.'}
                </p>
              </div>
            </div>
          ) : (
            <div
              className="w-full h-full flex items-center justify-center transition-all duration-500"
              style={!isRevealed ? { ...clipStyle, ...transformStyle } : {}}
            >
              <motion.img
                key={pokemon.id}
                src={pokemon.artwork}
                alt={isRevealed ? pokemon.displayName : 'Mystery Pokémon Silhouette'}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{
                  scale: isRevealed ? [1, 1.06, 1] : 1,
                  opacity: 1,
                }}
                transition={{ duration: 0.4 }}
                className={`max-h-[220px] sm:max-h-[260px] w-auto max-w-[85%] object-contain select-none drop-shadow-2xl ${
                  isRevealed ? 'pokemon-revealed' : 'pokemon-silhouette'
                }`}
              />
            </div>
          )}

          {/* Medium Cut Indicator Line */}
          {!isRevealed && difficulty === 'medium' && (
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 border-b border-dashed border-amber-400/40 pointer-events-none flex items-center justify-center">
              <span className="text-[9px] uppercase tracking-widest text-amber-300/80 bg-slate-950/80 px-2 py-0.5 rounded-full border border-amber-500/30">
                {shadowCrop === 'upper' ? '▲ Upper Body Slice' : '▼ Lower Body Slice'}
              </span>
            </div>
          )}

          {/* Hard Mode Target Crosshairs */}
          {!isRevealed && difficulty === 'hard' && (
            <div className="absolute inset-0 pointer-events-none border border-rose-500/20 rounded-xl m-2 flex items-center justify-center">
              <div className="text-[9px] uppercase tracking-widest text-rose-400/90 font-bold bg-slate-950/90 px-2.5 py-1 rounded-full border border-rose-500/40 shadow-md">
                Hard Mode: {shadowCrop.toUpperCase()} Target Reticle
              </div>
            </div>
          )}
        </div>

        {/* Revealed Name & Species overlay on reveal */}
        <AnimatePresence>
          {isRevealed && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-3 inset-x-4 z-20 flex flex-col items-center text-center bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-xl py-2 px-3 shadow-lg"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-rose-400">
                  #{String(pokemon.id).padStart(4, '0')}
                </span>
                <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white capitalize">
                  {pokemon.displayName}
                </h2>
              </div>
              <p className="text-xs text-slate-400 line-clamp-1 max-w-md">
                {pokemon.flavorText || pokemon.species}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Prominent Elemental Type Hints (Shown in Easy, Medium, Hard, and Extreme; Hidden in Menacing unrevealed) */}
      {(isRevealed || difficulty !== 'menacing') && (
        <div className="w-full max-w-xl mt-4 flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Elemental Type Hints:</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {pokemon.types.map((typeKey) => {
              const meta = POKEMON_TYPES[typeKey] || POKEMON_TYPES.normal;
              const Icon = meta.icon;

              return (
                <motion.div
                  key={typeKey}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border ${meta.borderColor} ${meta.badgeBg} ${meta.textColor} shadow-md shadow-black/40`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider font-display">
                    {meta.name}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Extra Unlockable Hints Drawer (Region, Category, First Letter - Hidden in Extreme and Menacing) */}
      {!isRevealed && difficulty !== 'extreme' && difficulty !== 'menacing' && (
        <div className="w-full max-w-xl mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-center gap-2">
          {revealedHints.region ? (
            <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-medium">
              <Compass className="w-3.5 h-3.5" />
              <span>Region: {regionData?.name || pokemon.region} (Gen {pokemon.generation})</span>
            </span>
          ) : (
            <button
              id="btn-hint-region"
              onClick={() => {
                sound.playClick();
                onRevealHint('region');
              }}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-slate-500" />
              <span>Hint: Region (-20 pts)</span>
            </button>
          )}

          {revealedHints.category ? (
            <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 font-medium">
              <Info className="w-3.5 h-3.5" />
              <span>Species: {pokemon.species}</span>
            </span>
          ) : (
            <button
              id="btn-hint-category"
              onClick={() => {
                sound.playClick();
                onRevealHint('category');
              }}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>Hint: Species (-20 pts)</span>
            </button>
          )}

          {revealedHints.initialLetter ? (
            <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold font-mono">
              <Eye className="w-3.5 h-3.5" />
              <span>Starts with: &quot;{pokemon.displayName.charAt(0)}&quot;</span>
            </span>
          ) : (
            <button
              id="btn-hint-letter"
              onClick={() => {
                sound.playClick();
                onRevealHint('initialLetter');
              }}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Hint: 1st Letter (-30 pts)</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
