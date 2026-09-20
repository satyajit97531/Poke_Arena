import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy as TrophyIcon, Sparkles, Lock, CheckCircle2, Award, Filter, Flame, Calendar, Gift, Zap, Swords } from 'lucide-react';
import { Trophy } from '../types/pokemon';
import { OFFICIAL_ARTWORK_URL, SHINY_ARTWORK_URL } from '../data/pokemonData';
import { TROPHY_ROAD_REWARDS, TRAINING_BOUNTIES_REWARDS } from '../data/rewardsData';
import { sound } from '../utils/audio';

interface TrophyRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  trophies: Trophy[];
  initialView?: 'vault' | 'trophy_road' | 'bounties';
  currentTrophyPoints?: number;
}

export const TrophyRoomModal: React.FC<TrophyRoomModalProps> = ({
  isOpen,
  onClose,
  trophies,
  initialView = 'trophy_road',
  currentTrophyPoints = 0,
}) => {
  const [viewMode, setViewMode] = useState<'vault' | 'trophy_road' | 'bounties'>(initialView);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedTrophy, setSelectedTrophy] = useState<Trophy | null>(null);

  useEffect(() => {
    if (isOpen && initialView) {
      setViewMode(initialView);
    }
  }, [isOpen, initialView]);

  if (!isOpen) return null;

  const unlockedCount = trophies.filter((t) => t.unlocked).length;
  const filteredTrophies = trophies.filter((t) => {
    if (filter === 'unlocked') return t.unlocked;
    if (filter === 'locked') return !t.unlocked;
    return true;
  });

  const formatTrophyCount = (val: number) => {
    if (val >= 10000000) return `${val / 100000} Lakh (10M)`;
    if (val >= 100000) return `${val / 100000} Lakh`;
    if (val >= 1000) return `${val / 1000}k`;
    return val.toLocaleString();
  };

  const getTierBadge = (tier: Trophy['tier']) => {
    switch (tier) {
      case 'bronze':
        return { label: 'Bronze', bg: 'bg-amber-700/20 text-amber-500 border-amber-600/40' };
      case 'silver':
        return { label: 'Silver', bg: 'bg-slate-300/20 text-slate-200 border-slate-300/40' };
      case 'gold':
        return { label: 'Gold', bg: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/40' };
      case 'diamond':
        return { label: 'Diamond', bg: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40' };
      case 'master':
        return { label: 'Master Ball', bg: 'bg-purple-600/20 text-purple-300 border-purple-500/40' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <TrophyIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
                <span>Rare Pokémon Trophy Vault</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {unlockedCount}/{trophies.length} Unlocked
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Unlock prestigious trophies, shiny Pokémon showcases, and legendary crests by conquering challenges.
              </p>
            </div>
          </div>

          <button
            id="btn-close-trophies"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-5 py-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 text-xs overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                sound.playClick();
                setViewMode('vault');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                viewMode === 'vault'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrophyIcon className="w-3.5 h-3.5" />
              <span>Trophy Vault ({unlockedCount}/{trophies.length})</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setViewMode('trophy_road');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                viewMode === 'trophy_road'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              <span>100 Lakh Trophy Road ({TROPHY_ROAD_REWARDS.length})</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setViewMode('bounties');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                viewMode === 'bounties'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Training Bounties ({TRAINING_BOUNTIES_REWARDS.length})</span>
            </button>
          </div>

          {viewMode === 'vault' && (
            <div className="flex items-center gap-1 shrink-0 ml-2">
              {(['all', 'unlocked', 'locked'] as const).map((f) => (
                <button
                  key={f}
                  id={`trophy-filter-${f}`}
                  onClick={() => {
                    sound.playClick();
                    setFilter(f);
                  }}
                  className={`px-2.5 py-1 rounded-md capitalize font-medium transition-all ${
                    filter === f
                      ? 'bg-slate-800 text-amber-300 font-bold border border-slate-700'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View 1: Trophies Grid */}
        {viewMode === 'vault' && (
          <div className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
            {filteredTrophies.map((trophy) => {
              const tierBadge = getTierBadge(trophy.tier);
              const artworkUrl = trophy.id === 'total_score_10000'
                ? SHINY_ARTWORK_URL(trophy.pokemonId)
                : OFFICIAL_ARTWORK_URL(trophy.pokemonId);

              return (
                <div
                  key={trophy.id}
                  id={`trophy-card-${trophy.id}`}
                  onClick={() => setSelectedTrophy(trophy)}
                  className={`relative rounded-xl border p-4 flex flex-col justify-between transition-all cursor-pointer group ${
                    trophy.unlocked
                      ? 'bg-gradient-to-b from-slate-850 to-slate-900 border-amber-500/40 hover:border-amber-400/80 shadow-lg shadow-amber-950/20 hover:scale-[1.02]'
                      : 'bg-slate-950/60 border-slate-800/80 opacity-75 hover:opacity-100 hover:border-slate-700'
                  }`}
                >
                  {/* Holographic shimmer for unlocked */}
                  {trophy.unlocked && (
                    <div className="absolute inset-0 holographic-shine rounded-xl pointer-events-none opacity-40"></div>
                  )}

                  {/* Card Top: Tier and Status */}
                  <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tierBadge.bg}`}>
                      {tierBadge.label}
                    </span>

                    {trophy.unlocked ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Unlocked</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Lock className="w-3 h-3" />
                        <span>Locked</span>
                      </span>
                    )}
                  </div>

                  {/* Trophy Showcase Artwork */}
                  <div className="relative my-2 w-full h-28 flex items-center justify-center">
                    <div className="absolute w-24 h-24 rounded-full bg-slate-800/50 -z-0"></div>
                    <img
                      src={artworkUrl}
                      alt={trophy.pokemonName}
                      className={`max-h-24 w-auto object-contain transition-transform group-hover:scale-110 drop-shadow-md ${
                        trophy.unlocked ? '' : 'filter grayscale brightness-[0.25] contrast-200'
                      }`}
                    />
                    {!trophy.unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="p-2 rounded-full bg-slate-900/90 border border-slate-700 text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: Title & Condition */}
                  <div className="relative z-10">
                    <h3 className="text-base font-bold font-display text-white group-hover:text-amber-300 transition-colors">
                      {trophy.title}
                    </h3>
                    <p className="text-xs text-slate-400 mb-2">{trophy.subtitle}</p>

                    <div className="text-[11px] text-slate-300 bg-slate-950/70 border border-slate-800/80 rounded-lg p-2">
                      <p className="text-slate-400 font-medium mb-1">Requirement: {trophy.condition}</p>
                      {/* Progress Bar if not unlocked */}
                      {!trophy.unlocked && trophy.maxProgress > 1 && (
                        <div className="w-full">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>Progress</span>
                            <span>{trophy.progress} / {trophy.maxProgress}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full transition-all"
                              style={{ width: `${Math.min(100, (trophy.progress / trophy.maxProgress) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View 2: Trophy Road Milestones & Rewards up to 100 Lakh (10M TP) */}
        {viewMode === 'trophy_road' && (
          <div className="p-5 overflow-y-auto space-y-3 flex-1 no-scrollbar">
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-500/40 text-xs text-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Gift className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-white text-sm">100 Lakh Trophy Road (10,000,000 TP Goal)</h4>
                  <p className="text-[11px] text-slate-400">
                    Climb through all 9 Pokémon Leagues to unlock legendary avatars, Battle Tokens, master spheres, and celestial titles!
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 block uppercase">Current TP</span>
                <span className="font-mono text-xs font-black text-amber-300">
                  {currentTrophyPoints.toLocaleString()} TP
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              {TROPHY_ROAD_REWARDS.map((reward) => {
                const isReached = currentTrophyPoints >= reward.trophies;
                return (
                  <div
                    key={reward.trophies}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                      isReached
                        ? 'bg-amber-500/15 border-amber-400/50 shadow-md shadow-amber-950/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-12 rounded-xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs font-black font-mono text-amber-300 leading-tight">
                          {formatTrophyCount(reward.trophies)}
                        </span>
                        <span className="text-[8px] font-bold text-slate-500 uppercase">TP Milestone</span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-xs font-bold text-slate-300 font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700">
                            {reward.rankBadge}
                          </span>
                          <h4 className="text-sm font-bold font-display text-white truncate">
                            {reward.rewardTitle}
                          </h4>
                          <span className="text-xs font-bold text-amber-400">
                            +{reward.tokens.toLocaleString()} Tokens
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1">{reward.description}</p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {isReached ? (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Reached
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0">
                          {reward.trophies.toLocaleString()} TP Required
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* View 3: Training Bounties & Daily Quests */}
        {viewMode === 'bounties' && (
          <div className="p-5 overflow-y-auto space-y-3 flex-1 no-scrollbar">
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-slate-300 flex items-center gap-2.5">
              <Swords className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                Complete daily training bounties across all quiz modes, gym challenges, and 1v1 duels to earn high-tier rewards, Battle Tokens, and rare trainer artifacts!
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TRAINING_BOUNTIES_REWARDS.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-mono font-bold text-amber-300">
                          {item.day}
                        </span>
                        <h4 className="text-xs font-bold font-display text-white">
                          {item.title}
                        </h4>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800">
                        Day {item.day}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-amber-400 font-bold mb-1.5 flex-wrap">
                      <span>+{item.tokens.toLocaleString()} Tokens</span>
                      <span>•</span>
                      <span>+{item.trophyPointsBonus.toLocaleString()} TP</span>
                      {item.specialItem && (
                        <>
                          <span>•</span>
                          <span className="text-purple-300 font-medium">{item.specialItem}</span>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detail Modal Overlay for Selected Trophy */}
        <AnimatePresence>
          {selectedTrophy && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-30 p-6 flex items-center justify-center"
              onClick={() => setSelectedTrophy(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                className="max-w-md w-full bg-slate-900 border border-amber-500/50 rounded-2xl p-6 shadow-2xl relative flex flex-col items-center text-center"
              >
                <button
                  onClick={() => setSelectedTrophy(null)}
                  className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="w-36 h-36 relative flex items-center justify-center mb-4">
                  <div className="absolute inset-0 rounded-full bg-amber-500/10 border border-amber-500/30 animate-pulse"></div>
                  <img
                    src={OFFICIAL_ARTWORK_URL(selectedTrophy.pokemonId)}
                    alt={selectedTrophy.pokemonName}
                    className={`max-h-32 w-auto object-contain drop-shadow-xl ${
                      selectedTrophy.unlocked ? '' : 'filter grayscale brightness-25'
                    }`}
                  />
                </div>

                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-2">
                  {selectedTrophy.tier.toUpperCase()} TROPHY
                </span>

                <h3 className="text-2xl font-black font-display text-white mb-1">
                  {selectedTrophy.title}
                </h3>
                <p className="text-sm text-amber-400 font-medium mb-3">
                  {selectedTrophy.subtitle} • {selectedTrophy.pokemonName}
                </p>

                <p className="text-sm text-slate-300 mb-4 bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                  {selectedTrophy.description}
                </p>

                <div className="w-full text-xs text-left bg-slate-800/60 rounded-xl p-3 flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Unlock Condition:</span>
                    <span className="text-white font-medium">{selectedTrophy.condition}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className={selectedTrophy.unlocked ? 'text-emerald-400 font-bold' : 'text-slate-400 font-bold'}>
                      {selectedTrophy.unlocked ? 'Unlocked' : 'Locked'}
                    </span>
                  </div>
                  {selectedTrophy.unlockedAt && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Date Achieved:</span>
                      <span className="text-slate-300">{new Date(selectedTrophy.unlockedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
