import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, BarChart2, Award, Trophy, Zap, RefreshCw, Flame, UserCheck } from 'lucide-react';
import { HighScoreRecord, TrainerAccount } from '../types/pokemon';
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

const BOT_NAMES = new Set([
  'cynthia', 'champion cynthia', 'champion_cynthia',
  'leon', 'champion leon', 'champion_leon',
  'steven', 'steven stone', 'steven_stone',
  'nemona',
  'blue', 'trainer blue', 'trainer_blue',
  'lance', 'dragon master lance', 'dragon_master_lance',
  'brock', 'gym leader brock', 'gym_leader_brock',
  'misty',
  'ash', 'ash ketchum', 'ash_ketchum',
  'red', 'trainer red', 'trainer_red',
]);
const BOT_IDS = new Set([
  'acc_blue', 'acc_cynthia', 'acc_brock', 'acc_red', 'acc_ash',
  'acc_misty', 'acc_steven', 'acc_leon', 'acc_lance',
  '1', '2', '3', '4', '5', '6'
]);

export const ScoreboardModal: React.FC<ScoreboardModalProps> = ({
  isOpen,
  onClose,
  highScores,
  account,
}) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'trainers' | 'levels'>('leaderboard');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [cloudTrainers, setCloudTrainers] = useState<TrainerAccount[]>([]);
  const [cloudScores, setCloudScores] = useState<HighScoreRecord[]>([]);
  const [serverUserRank, setServerUserRank] = useState<{
    trophyRank: number;
    levelRank: number;
    scoreRank: number;
    totalTrainers: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fix background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const fetchScoresAndTrainers = () => {
    setIsLoading(true);
    const userQuery = account.id
      ? `?userId=${encodeURIComponent(account.id)}`
      : account.email
      ? `?email=${encodeURIComponent(account.email)}`
      : `?username=${encodeURIComponent(account.username)}`;

    Promise.all([
      fetch(`/api/leaderboard${userQuery}`)
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
        if (lbData?.userRank) {
          setServerUserRank(lbData.userRank);
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
    const key = t.email || t.id || t.displayName || t.username;
    combinedMap.set(key, t);
  });
  allAccounts.forEach((t) => {
    const key = t.email || t.id || t.displayName || t.username;
    if (!combinedMap.has(key)) {
      combinedMap.set(key, t);
    }
  });
  // Ensure current active account is represented
  const activeKey = account.email || account.id || account.displayName || account.username;
  combinedMap.set(activeKey, account);

  // Filter real trainers who have played
  const allValidTrainers = Array.from(combinedMap.values()).filter((acc) => {
    if (!acc) return false;
    const accId = String(acc.id || '');
    const uName = String(acc.username || '').toLowerCase().trim();
    const dName = String(acc.displayName || '').toLowerCase().trim();
    if (BOT_IDS.has(accId)) return false;
    if (BOT_NAMES.has(uName) || BOT_NAMES.has(dName)) return false;
    return (
      (acc.totalGames || 0) > 0 ||
      (acc.totalScore || 0) > 0 ||
      (acc.totalGuesses || 0) > 0 ||
      (acc.trophyPoints || 0) > 0 ||
      (acc.highScores && Object.keys(acc.highScores).length > 0)
    );
  });

  // 1. Ranked by limitless Trophy Points & Score
  const sortedAccountsByTrophies = [...allValidTrainers].sort(
    (a, b) =>
      (b.trophyPoints || 0) - (a.trophyPoints || 0) ||
      (b.totalScore || 0) - (a.totalScore || 0) ||
      (b.level || 1) - (a.level || 1)
  );

  // 2. Ranked by Level & EXP (Replaces Regional Mastery)
  const sortedAccountsByLevel = [...allValidTrainers].sort(
    (a, b) =>
      (b.level || 1) - (a.level || 1) ||
      (b.exp || 0) - (a.exp || 0) ||
      (b.trophyPoints || 0) - (a.trophyPoints || 0)
  );

  // Top 100 lists
  const top100Trainers = sortedAccountsByTrophies.slice(0, 100);
  const top100ByLevel = sortedAccountsByLevel.slice(0, 100);

  // User rank calculations
  const userTrophyIndex = sortedAccountsByTrophies.findIndex(
    (a) =>
      a.id === account.id ||
      (account.email && a.email === account.email) ||
      (account.username && a.username === account.username)
  );
  const userTrophyRank =
    serverUserRank?.trophyRank || (userTrophyIndex !== -1 ? userTrophyIndex + 1 : sortedAccountsByTrophies.length + 1);

  const userLevelIndex = sortedAccountsByLevel.findIndex(
    (a) =>
      a.id === account.id ||
      (account.email && a.email === account.email) ||
      (account.username && a.username === account.username)
  );
  const userLevelRank =
    serverUserRank?.levelRank || (userLevelIndex !== -1 ? userLevelIndex + 1 : sortedAccountsByLevel.length + 1);

  // Build Real High Scores list
  const rawScores: HighScoreRecord[] = [
    ...cleanHighScores(highScores),
    ...cleanHighScores(cloudScores),
  ];

  // Synthesize mode records for real leaderboard players
  allValidTrainers.forEach((acc) => {
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

  // Deduplicate and filter out bots
  const dedupMap = new Map<string, HighScoreRecord>();
  rawScores.forEach((r) => {
    if (!r) return;
    if (BOT_IDS.has(String(r.id))) return;
    const nameLower = String(r.playerName || '').toLowerCase().trim();
    if (BOT_NAMES.has(nameLower) || !nameLower) return;
    if (typeof r.score !== 'number' || r.score <= 0) return;

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

  // Top 100 High Scores
  const top100Scores = filteredScores.slice(0, 100);

  // Calculate user's best high score rank in this mode
  const userHighScoreIndex = filteredScores.findIndex(
    (s) =>
      s.playerName?.toLowerCase().trim() === account.displayName?.toLowerCase().trim() ||
      s.playerName?.toLowerCase().trim() === account.username?.toLowerCase().trim()
  );
  const userHighScoreRank = userHighScoreIndex !== -1 ? userHighScoreIndex + 1 : null;
  const userBestScore = userHighScoreIndex !== -1 ? filteredScores[userHighScoreIndex] : null;

  return (
    <div
      id="scoreboard-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-hidden overscroll-contain"
      onClick={onClose}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <motion.div
        id="scoreboard-modal-card"
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden overscroll-contain"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 font-black">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black font-display text-white tracking-tight">
                  Trainer Hall of Fame & Leaderboards
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  Top 100 Global
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Verified high scores, trophy points, and trainer level rankings across all players.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-refresh-scoreboard"
              title="Refresh Leaderboards"
              type="button"
              onClick={() => {
                sound.playButtonPress();
                fetchScoresAndTrainers();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            <button
              id="btn-close-scoreboard"
              type="button"
              onClick={() => {
                sound.playButtonBack();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs navigation */}
        <div className="px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 text-xs shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              id="tab-leaderboard"
              type="button"
              onClick={() => {
                sound.playButtonPress();
                setActiveTab('leaderboard');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>High Scores ({top100Scores.length})</span>
            </button>

            <button
              id="tab-trainers"
              type="button"
              onClick={() => {
                sound.playButtonPress();
                setActiveTab('trainers');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'trainers'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Trainer Rankings ({top100Trainers.length})</span>
            </button>

            <button
              id="tab-levels"
              type="button"
              onClick={() => {
                sound.playButtonPress();
                setActiveTab('levels');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'levels'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Level Rankings ({top100ByLevel.length})</span>
            </button>
          </div>

          {activeTab === 'leaderboard' && (
            <div className="flex items-center gap-1">
              {['all', 'classic', 'blitz', 'survival', 'legendary'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    sound.playButtonPress();
                    setModeFilter(m);
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] capitalize cursor-pointer transition-colors ${
                    modeFilter === m
                      ? 'bg-slate-700 text-white font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab Contents: scroll-contained */}
        <div
          id="scoreboard-scrollable-body"
          className="p-4 sm:p-5 overflow-y-auto flex-1 overscroll-contain space-y-4"
          onWheel={(e) => e.stopPropagation()}
        >
          {/* TAB 1: HIGH SCORES */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-3">
              {/* Sticky User High Score Banner */}
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-300 font-semibold">Your High Score Standing:</span>
                    <div className="text-white font-bold text-xs mt-0.5">
                      {userHighScoreRank ? (
                        <span>
                          Rank <span className="text-cyan-400 font-mono font-black">#{userHighScoreRank}</span> of {filteredScores.length} players
                          {userBestScore && ` • Score: ${userBestScore.score.toLocaleString()} (${userBestScore.accuracy}% Acc)`}
                        </span>
                      ) : (
                        <span className="text-slate-400">Play a match in this mode to record your rank!</span>
                      )}
                    </div>
                  </div>
                </div>
                {userHighScoreRank && userHighScoreRank <= 100 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                    In Top 100
                  </span>
                )}
                {userHighScoreRank && userHighScoreRank > 100 && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
                    Top {Math.round((userHighScoreRank / filteredScores.length) * 100)}%
                  </span>
                )}
              </div>

              <div className="w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-3">#</th>
                      <th className="py-3 px-3">Trainer</th>
                      <th className="py-3 px-3">Score</th>
                      <th className="py-3 px-3">Mode</th>
                      <th className="py-3 px-3">Accuracy</th>
                      <th className="py-3 px-3">Streak</th>
                      <th className="py-3 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {top100Scores.map((row, idx) => {
                      const isCurrent =
                        row.playerName?.toLowerCase().trim() === account.displayName?.toLowerCase().trim() ||
                        row.playerName?.toLowerCase().trim() === account.username?.toLowerCase().trim();

                      return (
                        <tr
                          key={row.id || `${row.playerName}_${idx}`}
                          className={`transition-colors ${
                            isCurrent ? 'bg-cyan-500/10 font-semibold' : 'hover:bg-slate-900/50'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-400">
                            {idx + 1 <= 3 ? (
                              <span
                                className={`inline-block w-6 h-6 rounded-full text-center leading-6 text-[11px] font-black ${
                                  idx === 0
                                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/30'
                                    : idx === 1
                                    ? 'bg-slate-300 text-slate-950'
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
                    {top100Scores.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Award className="w-8 h-8 text-slate-600 mb-1" />
                            <span className="font-semibold text-slate-300 text-sm">
                              No Scores Recorded Yet
                            </span>
                            <span className="text-xs text-slate-500 max-w-sm">
                              Play a match in{' '}
                              <span className="text-cyan-400 font-bold capitalize">{modeFilter}</span> mode
                              to claim the #1 spot on the leaderboard!
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: TRAINER RANKINGS (By Limitless Trophy Points) */}
          {activeTab === 'trainers' && (
            <div className="w-full space-y-3">
              {/* User Standing Bar (Ensures user can see their ranking even if not in Top 100) */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={OFFICIAL_ARTWORK_URL(account.avatarId || 25)}
                    alt={account.displayName}
                    className="w-9 h-9 object-contain drop-shadow shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{account.displayName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black uppercase">
                        You
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                        Lv.{account.level || 1}
                      </span>
                    </div>
                    <div className="text-slate-400 text-xs mt-0.5">
                      Your Global Trophy Ranking:{' '}
                      <span className="text-amber-400 font-mono font-black text-sm">
                        #{userTrophyRank}
                      </span>{' '}
                      of {Math.max(sortedAccountsByTrophies.length, serverUserRank?.totalTrainers || 1)} players
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-black font-display text-amber-400">
                    {(account.trophyPoints || 0).toLocaleString()} <span className="text-xs">TP</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {account.totalWins || 0} Wins • {account.totalGames || 0} Games
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-400 flex items-center justify-between px-1">
                <span>Top 100 Trainers ordered by limitless Trophy Points (TP):</span>
                <span className="text-slate-500 font-mono">Showing Top 100</span>
              </div>

              {top100Trainers.length === 0 ? (
                <div className="p-10 text-center text-slate-400 bg-slate-950/40 rounded-2xl border border-slate-800 flex flex-col items-center justify-center">
                  <Trophy className="w-10 h-10 text-slate-600 mb-2" />
                  <h4 className="text-sm font-bold text-slate-300">No Ranked Trainers Yet</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md">
                    Complete matches and earn Trophy Points to claim your spot in the Hall of Fame!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {top100Trainers.map((acc, rankIdx) => {
                    const isCurrent =
                      acc.id === account.id ||
                      (account.email && acc.email === account.email) ||
                      (account.username && acc.username === account.username);

                    return (
                      <div
                        key={acc.id || acc.email || acc.username}
                        id={`trainer-rank-row-${rankIdx + 1}`}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors ${
                          isCurrent
                            ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black font-display shrink-0 ${
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
                            className="w-10 h-10 object-contain drop-shadow shrink-0"
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
                            </div>
                            <span className="text-xs text-slate-400">{acc.title || 'Pokémon Trainer'}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
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

          {/* TAB 3: LEVEL RANKINGS (Replaced Regional Mastery) */}
          {activeTab === 'levels' && (
            <div className="w-full space-y-3">
              {/* User Standing Bar for Level */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={OFFICIAL_ARTWORK_URL(account.avatarId || 25)}
                    alt={account.displayName}
                    className="w-9 h-9 object-contain drop-shadow shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{account.displayName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black uppercase">
                        You
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                        Level {account.level || 1}
                      </span>
                    </div>
                    <div className="text-slate-400 text-xs mt-0.5">
                      Your Global Level Ranking:{' '}
                      <span className="text-emerald-400 font-mono font-black text-sm">
                        #{userLevelRank}
                      </span>{' '}
                      of {Math.max(sortedAccountsByLevel.length, serverUserRank?.totalTrainers || 1)} players
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-black font-display text-emerald-400">
                    Lv. {account.level || 1}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {(account.exp || 0).toLocaleString()} Total EXP
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-400 flex items-center justify-between px-1">
                <span>Top 100 Trainers ordered by highest Level & Experience (EXP):</span>
                <span className="text-slate-500 font-mono">Showing Top 100</span>
              </div>

              {top100ByLevel.length === 0 ? (
                <div className="p-10 text-center text-slate-400 bg-slate-950/40 rounded-2xl border border-slate-800 flex flex-col items-center justify-center">
                  <Zap className="w-10 h-10 text-slate-600 mb-2" />
                  <h4 className="text-sm font-bold text-slate-300">No Level Records Yet</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md">
                    Level up your Trainer profile by playing games and completing daily missions!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {top100ByLevel.map((acc, rankIdx) => {
                    const isCurrent =
                      acc.id === account.id ||
                      (account.email && acc.email === account.email) ||
                      (account.username && acc.username === account.username);

                    return (
                      <div
                        key={`lvl_${acc.id || acc.email || acc.username}`}
                        id={`level-rank-row-${rankIdx + 1}`}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors ${
                          isCurrent
                            ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black font-display shrink-0 ${
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
                            className="w-10 h-10 object-contain drop-shadow shrink-0"
                          />

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white">{acc.displayName}</h4>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                                Level {acc.level || 1}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-bold uppercase">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400">{acc.title || 'Pokémon Trainer'}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-base font-black font-display text-emerald-400">
                            Lv. {acc.level || 1}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {(acc.exp || 0).toLocaleString()} EXP
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
