import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, CheckCircle2, XCircle, ArrowRight, RefreshCw, Layers } from 'lucide-react';
import { Pokemon, PokemonType, TypeQuizDirection } from '../../types/pokemon';
import { CURATED_POKEMON } from '../../data/pokemonData';
import { POKEMON_TYPES } from '../../utils/pokemonTypes';
import { sound } from '../../utils/audio';

interface TypeGameProps {
  onScoreEarned: (points: number, isCorrect: boolean) => void;
  onAdvanceMilestone: () => void;
}

export const TypeGame: React.FC<TypeGameProps> = ({
  onScoreEarned,
  onAdvanceMilestone,
}) => {
  const [direction, setDirection] = useState<TypeQuizDirection>('pokemon_to_types');
  const [targetPokemon, setTargetPokemon] = useState<Pokemon>(CURATED_POKEMON[0]);
  const [typeOptions, setTypeOptions] = useState<PokemonType[][]>([]);
  const [pokemonOptions, setPokemonOptions] = useState<Pokemon[]>([]);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const loadQuestion = (nextDir?: TypeQuizDirection) => {
    setIsAnswered(false);
    setSelectedAnswerIndex(null);

    const dir = nextDir || direction;
    const target = CURATED_POKEMON[Math.floor(Math.random() * CURATED_POKEMON.length)];
    setTargetPokemon(target);

    if (dir === 'pokemon_to_types') {
      // Generate 4 type combinations, 1 correct
      const correctTypes = target.types;
      const decoys: PokemonType[][] = [];

      // Collect unique other type combinations
      const allCombos = CURATED_POKEMON.map((p) => p.types).filter(
        (t) => t.join('-') !== correctTypes.join('-')
      );
      const shuffledCombos = [...allCombos].sort(() => Math.random() - 0.5);

      const uniqueDecoys = Array.from(new Set(shuffledCombos.map((c) => c.join('-'))))
        .slice(0, 3)
        .map((str) => str.split('-') as PokemonType[]);

      const opts = [correctTypes, ...uniqueDecoys].sort(() => Math.random() - 0.5);
      setTypeOptions(opts);
    } else {
      // Types to Pokémon: target types given, 4 Pokémon options
      const targetTypeKey = target.types.slice().sort().join('-');
      const others = CURATED_POKEMON.filter((p) => p.types.slice().sort().join('-') !== targetTypeKey);
      const shuffledOthers = [...others].sort(() => Math.random() - 0.5).slice(0, 3);
      const opts = [target, ...shuffledOthers].sort(() => Math.random() - 0.5);
      setPokemonOptions(opts);
    }
  };

  useEffect(() => {
    loadQuestion();
  }, [direction]);

  const handleSelectTypeCombo = (idx: number) => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedAnswerIndex(idx);

    const chosen = typeOptions[idx];
    const isCorrect = chosen.join('-') === targetPokemon.types.join('-');
    if (isCorrect) {
      sound.playCorrect();
      onScoreEarned(220, true);
      onAdvanceMilestone();
    } else {
      sound.playWrong();
      onScoreEarned(0, false);
    }
  };

  const handleSelectPokemon = (poke: Pokemon, idx: number) => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedAnswerIndex(idx);

    const isCorrect = poke.id === targetPokemon.id;
    if (isCorrect) {
      sound.playCorrect();
      onScoreEarned(220, true);
      onAdvanceMilestone();
    } else {
      sound.playWrong();
      onScoreEarned(0, false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Header & Direction Switcher */}
      <div className="w-full flex items-center justify-between px-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold font-display flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Type Master & Vice-Versa</span>
          </span>
        </div>

        <button
          id="btn-toggle-direction"
          onClick={() => {
            sound.playButtonPress();
            const next = direction === 'pokemon_to_types' ? 'types_to_pokemon' : 'pokemon_to_types';
            setDirection(next);
            loadQuestion(next);
          }}
          className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
        >
          <RefreshCw className="w-3 h-3 text-cyan-400" />
          <span>Switch: {direction === 'pokemon_to_types' ? 'Types ➔ Pokémon' : 'Pokémon ➔ Types'}</span>
        </button>
      </div>

      {/* Arena Display */}
      {direction === 'pokemon_to_types' ? (
        // Given Pokémon -> Guess Types
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center mb-5 relative">
          <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-2">
            What Are The Exact Elemental Type(s) of:
          </span>

          <div className="w-32 h-32 flex items-center justify-center my-2 relative">
            <img
              src={targetPokemon.artwork}
              alt={targetPokemon.displayName}
              className="max-h-28 w-auto object-contain drop-shadow-xl"
            />
          </div>

          <h3 className="text-2xl font-black font-display text-white mt-1">
            {targetPokemon.displayName}
          </h3>
          <p className="text-xs text-slate-400">Generation {targetPokemon.generation} • {targetPokemon.species}</p>
        </div>
      ) : (
        // Given Types -> Guess Pokémon
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center mb-5 relative">
          <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-3">
            Which Pokémon Possesses This Exact Elemental Typing?
          </span>

          <div className="flex items-center justify-center gap-2.5 my-3">
            {targetPokemon.types.map((typeKey) => {
              const meta = POKEMON_TYPES[typeKey] || POKEMON_TYPES.normal;
              const Icon = meta.icon;
              return (
                <div
                  key={typeKey}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border ${meta.borderColor} ${meta.badgeBg} ${meta.textColor} shadow-lg`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-black font-display uppercase tracking-wider">
                    {meta.name}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-slate-400 mt-2">
            Choose the Pokémon that matches this exact type combination!
          </p>
        </div>
      )}

      {/* Answer Options */}
      {direction === 'pokemon_to_types' ? (
        // 4 Type combinations
        <div className="w-full grid grid-cols-2 gap-3 mb-4">
          {typeOptions.map((typesCombo, idx) => {
            const isSelected = selectedAnswerIndex === idx;
            const isCorrect = typesCombo.join('-') === targetPokemon.types.join('-');

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
                key={idx}
                id={`type-combo-${idx}`}
                disabled={isAnswered}
                onClick={() => {
                  sound.playButtonPress();
                  handleSelectTypeCombo(idx);
                }}
                className={`p-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${btnClasses}`}
              >
                {typesCombo.map((t) => {
                  const meta = POKEMON_TYPES[t] || POKEMON_TYPES.normal;
                  const Icon = meta.icon;
                  return (
                    <span
                      key={t}
                      className={`text-xs px-2.5 py-1 rounded-md font-bold uppercase font-display flex items-center gap-1 border ${meta.borderColor} ${meta.badgeBg} ${meta.textColor}`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{meta.name}</span>
                    </span>
                  );
                })}
              </button>
            );
          })}
        </div>
      ) : (
        // 4 Pokémon Options
        <div className="w-full grid grid-cols-2 gap-3 mb-4">
          {pokemonOptions.map((poke, idx) => {
            const isSelected = selectedAnswerIndex === idx;
            const isCorrect = poke.id === targetPokemon.id;

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
                key={poke.id}
                id={`type-poke-option-${poke.id}`}
                disabled={isAnswered}
                onClick={() => {
                  sound.playButtonPress();
                  handleSelectPokemon(poke, idx);
                }}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${btnClasses}`}
              >
                <img
                  src={poke.artwork}
                  alt={poke.displayName}
                  className="w-10 h-10 object-contain shrink-0 drop-shadow"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold font-display block truncate">{poke.displayName}</span>
                  <span className="text-[10px] text-slate-400">{poke.species}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Next Question Button */}
      {isAnswered && (
        <button
          id="btn-next-type-quiz"
          onClick={() => {
            sound.playButtonPress();
            loadQuestion();
          }}
          className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-display font-bold text-sm flex items-center gap-2 shadow-lg shadow-rose-500/30 transition-all hover:scale-105"
        >
          <span>Next Type Quiz</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
