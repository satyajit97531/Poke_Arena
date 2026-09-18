import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, BarChart2, Award, User, Flame, Compass, Trophy, Database, Sparkles, RefreshCw } from 'lucide-react';
import { HighScoreRecord, TrainerAccount } from '../types/pokemon';
import { REGIONS } from '../utils/pokemonTypes';
import { getAllAccounts } from '../utils/accounts';
import { cleanHighScores } from '../utils/storage';
import { OFFICIAL_ARTWORK_URL } from '../data/pokemonData';
import { sound } from '../utils/audio';

interface ScoreboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  highScores: HighScoreRecord[];
  account: TrainerAccount;
}

const BOT_NAMES = new Set(['cynthia', 'leon', 'steven', 'nemona', 'blue', 'lance']);
const BOT_IDS = new Set(['1', '2', '3', '4', '5', '6']);

export const ScoreboardModal: React.FC<ScoreboardModalProps> = ({
  isOpen,
  onClose,
  highScores,
  account,
}) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'trainers' | 'regions'>('leaderboard');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [cloudTrainers, setCloudTrainers] = useState<TrainerAccount[]>([]);
  const [cloudScores, setCloudScores] = useState<HighScoreRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchScoresAndTrainers = () => {
    setIsLoading(true);
    Promise.all([
      fetch('/api/leaderboard')
        .then((res) => res.json())
        .catch(() => ({ trainers: [] })),
      fetch('/api/highscores')
        .then((res) => res.json())
        .catch(() => ({ scores: [] })),
    ])
      .then(([lbData, hsData]) => {
        if (lbData?.trainers && Array.isArray(lbData.trainers)) {
          setCloudTrainers(lbData.trainers);
        }
        if (hsData?.scores && Array.isArray(hsData.scores)) {
          setCloudScores(cleanHighScores(hsData.scores));
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchScoresAndTrainers();
  }, [isOpen]);

  if (!isOpen) return null;

  const allAccounts = getAllAccounts();
  // Merge cloud accounts with local accounts, deduplicating by ID/email/username
  const combinedMap = new Map<string, TrainerAccount>();
  cloudTrainers.forEach((t) => {
    const key = t.email || t.id || t.displayName;
    combinedMap.set(key, t);
  });
  allAccounts.forEach((t) => {
    const key = t.email || t.id || t.displayName;
    if (!combinedMap.has(key)) {
      combinedMap.set(key, t);
    }
  });
  // Ensure current active account is represented
  const activeKey = account.email || account.id || account.displayName;
  combinedMap.set(activeKey, account);

  // ONLY trainers who have ACTUALLY played (totalGames > 0, totalScore > 0, totalGuesses > 0, or trophyPoints > 0)
  const sortedAccounts = Array.from(combinedMap.values())
    .filter((acc) => {
      const hasPlayed =
        (acc.totalGames || 0) > 0 ||
        (acc.totalScore || 0) > 0 ||
        (acc.totalGuesses || 0) > 0 ||
        (acc.trophyPoints || 0) > 0 ||
        (acc.highScores && Object.keys(acc.highScores).length > 0);
      return hasPlayed;
    })
    .sort((a, b) => (b.trophyPoints || 0) - (a.trophyPoints || 0) || (b.totalScore || 0) - (a.totalScore || 0));

  // Build Real High Scores list from:
  // 1) Stored local high scores (cleaned of bot seeds)
  // 2) Cloud-fetched high scores (cleaned of bot seeds)
  // 3) Leaderboard players who have actually played
  const rawScores: HighScoreRecord[] = [
    ...cleanHighScores(highScores),
    ...cleanHighScores(cloudScores),
  ];

  // Synthesize mode records for real leaderboard players who have played
  sortedAccounts.forEach((acc) => {
    const pName = acc.displayName || acc.username || 'Trainer';
    const accAccuracy = acc.totalGuesses > 0 ? Math.round((acc.totalCorrect / acc.totalGuesses) * 100) : 100;
    const dateStr = (acc.createdAt || new Date().toISOString()).split('T')[0];

    if (acc.highScores && typeof acc.highScores === 'object') {
      Object.entries(acc.highScores).forEach(([m, s]) => {
        const numScore = Number(s);
        if (numScore > 0) {
          rawScores.push({
            id: `trainer_${acc.id}_${m}`,
            playerName: pName,
            score: numScore,
            accuracy: accAccuracy,
            streak: acc.bestStreak || 0,
            mode: m as any,
            region: 'all',
            date: dateStr,
          });
        }
      });
    }

    if ((acc.totalScore || 0) > 0) {
      rawScores.push({
        id: `trainer_${acc.id}_career`,
        playerName: pName,
        score: acc.totalScore,
        accuracy: accAccuracy,
        streak: acc.bestStreak || 0,
        mode: 'classic',
        region: 'all',
        date: dateStr,
      });
    }
  });

  // Deduplicate and filter out non-real players
  const dedupMap = new Map<string, HighScoreRecord>();
  rawScores.forEach((r) => {
    if (!r) return;
    if (BOT_IDS.has(String(r.id))) return;
    const nameLower = String(r.playerName || '').toLowerCase().trim();
    if (BOT_NAMES.has(nameLower) || !nameLower) return;
    if (typeof r.score !== 'number' || r.score <= 0) return;

    // Use player + mode + score to deduplicate identical records
    const key = `${nameLower}_${r.mode || 'classic'}_${r.score}`;
    if (!dedupMap.has(key)) {
      dedupMap.set(key, r);
    }
  });

  const sortedRealScores = Array.from(dedupMap.values()).sort((a, b) => b.score - a.score);

  const filteredScores = sortedRealScores.filter((s) => {
    if (modeFilter === 'all') return true;
    return s.mode === modeFilter;
  });

  const accuracy = account.totalGuesses > 0
    ? Math.round((account.totalCorrect / account.totalGuesses) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-display text-white">
                  Trainer Hall of Fame & Leaderboards
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Live Players Only
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Verified high scores and rankings of real trainers who have actively played.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-refresh-scoreboard"
              title="Refresh Leaderboard"
              onClick={() => {
                sound.playButtonPress();
                fetchScoresAndTrainers();
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            <button
              id="btn-close-scoreboard"
              onClick={() => {
                sound.playButtonBack();
                onClose();
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              id="tab-leaderboard"
              onClick={() => {
                sound.playButtonPress();
                setActiveTab('leaderboard');
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>High Scores ({filteredScores.length})</span>
            </button>

            <button
              id="tab-trainers"
              onClick={() => {
                sound.playButtonPress();
                setActiveTab('trainers');
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'trainers'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Trainer Rankings ({sortedAccounts.length})</span>
            </button>

            <button
              id="tab-regions"
              onClick={() => {
                sound.playButtonPress();
                setActiveTab('regions');
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'regions'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Regional Mastery</span>
            </button>
          </div>

          {activeTab === 'leaderboard' && (
            <div className="flex items-center gap-1">
              {['all', 'classic', 'blitz', 'survival', 'legendary'].map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    sound.playButtonPress();
                    setModeFilter(m);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] capitalize ${
                    modeFilter === m ? 'bg-slate-700 text-white font-bold' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab Contents */}
        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'leaderboard' && (
            <div className="w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Trainer</th>
                    <th className="py-2.5 px-3">Score</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3">Accuracy</th>
                    <th className="py-2.5 px-3">Streak</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredScores.map((row, idx) => {
                    const isCurrent =
                      row.playerName?.toLowerCase().trim() === account.displayName?.toLowerCase().trim() ||
                      row.playerName?.toLowerCase().trim() === account.username?.toLowerCase().trim();

                    return (
                      <tr
                        key={row.id || `${row.playerName}_${idx}`}
                        className={`transition-colors ${
                          isCurrent ? 'bg-amber-500/10 font-semibold' : 'hover:bg-slate-900/50'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-400">
                          {idx + 1 <= 3 ? (
                            <span
                              className={`inline-block w-5 h-5 rounded-full text-center leading-5 text-[11px] font-black ${
                                idx === 0
                                  ? 'bg-yellow-500 text-black'
                                  : idx === 1
                                  ? 'bg-slate-300 text-black'
                                  : 'bg-amber-700 text-white'
                              }`}
                            >
                              {idx + 1}
                            </span>
                          ) : (
                            idx + 1
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{row.playerName}</span>
                            {isCurrent && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-bold uppercase">
                                You
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-display font-bold text-amber-400 text-sm">
                          {row.score.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 capitalize">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-medium">
                            {row.mode}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">{row.accuracy}%</td>
                        <td className="py-2.5 px-3 font-mono text-orange-400 font-semibold">
                          {row.streak}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">{row.date}</td>
                      </tr>
                    );
                  })}
                  {filteredScores.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Award className="w-8 h-8 text-slate-600 mb-1" />
                          <span className="font-semibold text-slate-300 text-sm">
                            No Scores Recorded for Real Players Yet
                          </span>
                          <span className="text-xs text-slate-500 max-w-sm">
                            Non-real player ranks have been purged. Play a match in{' '}
                            <span className="text-cyan-400 font-bold capitalize">{modeFilter}</span> mode
                            to set the first high score on the board!
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'trainers' && (
            <div className="w-full space-y-3">
              <div className="text-xs text-slate-400 mb-2">
                Leaderboard ranking of real trainers who have played, ordered by limitless Trophy Points (TP):
              </div>

              {sortedAccounts.length === 0 ? (
                <div className="p-10 text-center text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
                  <Trophy className="w-10 h-10 text-slate-600 mb-2" />
                  <h4 className="text-sm font-bold text-slate-300">No Ranked Trainers Yet</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md">
                    Non-real players have been removed. Trainers will appear here once they complete a game and earn points!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedAccounts.map((acc, rankIdx) => {
                    const isCurrent = acc.id === account.id || (account.email && acc.email === account.email);

                    return (
                      <div
                        key={acc.id || acc.email}
                        className={`p-3.5 rounded-xl border flex items-center justify-between ${
                          isCurrent
                            ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
                            : 'bg-slate-950/60 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black font-display ${
                              rankIdx === 0
                                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/30'
                                : rankIdx === 1
                                ? 'bg-slate-300 text-slate-950'
                                : rankIdx === 2
                                ? 'bg-amber-700 text-white'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {rankIdx + 1}
                          </span>

                          <img
                            src={OFFICIAL_ARTWORK_URL(acc.avatarId || 25)}
                            alt={acc.displayName}
                            className="w-10 h-10 object-contain drop-shadow"
                          />

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white">{acc.displayName}</h4>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                                Lv.{acc.level || 1}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-bold uppercase">
                                  You
                                </span>
                              )}
                              {acc.email && (
                                <span
                                  className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-0.5"
                                  title={`MongoDB Account: ${acc.email}`}
                                >
                                  <Database className="w-2.5 h-2.5 text-emerald-400" />
                                  Cloud
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400">{acc.title || 'Pokémon Trainer'}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-black font-display text-amber-400">
                            {(acc.trophyPoints || 0).toLocaleString()} <span className="text-xs text-amber-400/80">TP</span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {acc.totalWins || 0} Wins • {acc.totalGames || 0} Played
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'regions' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {REGIONS.filter((r) => r.id !== 'all').map((reg) => {
                const data = account.regionalMastery[reg.id] || { correct: 0, total: 0 };
                const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;

                return (
                  <div
                    key={reg.id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-bold font-display text-white">{reg.name}</h4>
                        <span className="text-[11px] text-slate-500">{reg.title}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-cyan-400">{pct}%</span>
                    </div>

                    <div className="w-full">
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-1.5">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>{data.correct} correct guesses</span>
                        <span>{reg.range}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

