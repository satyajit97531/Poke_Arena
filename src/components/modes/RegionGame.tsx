import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, CheckCircle2, XCircle, ArrowRight, MapPin } from 'lucide-react';
import { Pokemon, RegionId } from '../../types/pokemon';
import { CURATED_POKEMON } from '../../data/pokemonData';
import { REGIONS } from '../../utils/pokemonTypes';
import { sound } from '../../utils/audio';

interface RegionGameProps {
  onScoreEarned: (points: number, isCorrect: boolean) => void;
  onAdvanceMilestone: () => void;
}

export const RegionGame: React.FC<RegionGameProps> = ({
  onScoreEarned,
  onAdvanceMilestone,
}) => {
  const [currentPokemon, setCurrentPokemon] = useState<Pokemon>(CURATED_POKEMON[0]);
  const [selectedRegion, setSelectedRegion] = useState<RegionId | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const playableRegions = REGIONS.filter((r) => r.id !== 'all');

  const loadQuestion = () => {
    setIsAnswered(false);
    setSelectedRegion(null);
    const target = CURATED_POKEMON[Math.floor(Math.random() * CURATED_POKEMON.length)];
    setCurrentPokemon(target);
  };

  useEffect(() => {
    loadQuestion();
  }, []);

  const handleSelect = (regId: RegionId) => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedRegion(regId);

    const isCorrect = regId === currentPokemon.region;
    if (isCorrect) {
      sound.playCorrect();
      onScoreEarned(200, true);
      onAdvanceMilestone();
    } else {
      sound.playWrong();
      onScoreEarned(0, false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Header Info */}
      <div className="w-full flex items-center justify-between px-2 mb-3">
        <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold font-display flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5" />
          <span>Regional Origin Guesser</span>
        </span>
      </div>

      {/* Pokémon Showcase */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center mb-5 relative">
        <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-2">
          Which Region Does This Pokémon Hail From?
        </span>

        <div className="w-36 h-36 flex items-center justify-center my-2 relative">
          <div className="w-32 h-32 rounded-full bg-slate-950/80 -z-0 absolute"></div>
          <motion.img
            key={currentPokemon.id}
            src={currentPokemon.artwork}
            alt={currentPokemon.displayName}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-h-32 w-auto object-contain drop-shadow-xl select-none"
          />
        </div>

        <h3 className="text-2xl font-black font-display text-white mt-1">
          {currentPokemon.displayName}
        </h3>
        <p className="text-xs text-slate-400">{currentPokemon.species}</p>
      </div>

      {/* 9 Region Choice Grid */}
      <div className="w-full grid grid-cols-3 gap-2.5 mb-4">
        {playableRegions.map((reg) => {
          const isSelected = selectedRegion === reg.id;
          const isCorrect = reg.id === currentPokemon.region;

          let btnClasses = 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200';
          if (isAnswered) {
            if (isCorrect) {
              btnClasses = 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold';
            } else if (isSelected) {
              btnClasses = 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold';
            } else {
              btnClasses = 'bg-slate-950/40 border-slate-900 opacity-40 text-slate-500';
            }
          }

          return (
            <button
              key={reg.id}
              id={`region-choice-${reg.id}`}
              disabled={isAnswered}
              onClick={() => {
                sound.playButtonPress();
                handleSelect(reg.id);
              }}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${btnClasses}`}
            >
              <span className="text-sm font-bold font-display">{reg.name}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{reg.title}</span>
            </button>
          );
        })}
      </div>

      {/* Next Question Button */}
      {isAnswered && (
        <button
          id="btn-next-region"
          onClick={() => {
            sound.playButtonPress();
            loadQuestion();
          }}
          className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-display font-bold text-sm flex items-center gap-2 shadow-lg shadow-rose-500/30 transition-all hover:scale-105"
        >
          <span>Next Region Round</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
