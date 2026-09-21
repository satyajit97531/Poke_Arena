import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Swords,
  Users,
  QrCode,
  Play,
  Trophy,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Copy,
  Check,
  Award,
  Sparkles,
  Flame,
  Timer,
  Send,
  Coins,
  RefreshCw,
  KeyRound,
  Shield,
  Smartphone,
  Radio,
  Share2,
  Skull,
  Search,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BattleRecord, GameDifficulty, RegionId } from '../../types/pokemon';
import { sound } from '../../utils/audio';

interface Duel1v1GameProps {
  currentTrainerName: string;
  onScoreEarned: (points: number) => void;
  onAdvanceMilestone: () => void;
  onTokensEarned?: (tokens: number) => void;
  onBattleFinished?: (battle: Omit<BattleRecord, 'id' | 'timestamp'>) => void;
  initialRoomCode?: string | null;
}

interface DuelPlayer {
  id: string;
  name: string;
  avatarId: number;
  score: number;
  baseScore: number;
  speedScore: number;
  answers: boolean[];
  times: number[];
}

interface DuelQuestion {
  targetId: number;
  targetName: string;
  displayName: string;
  types: string[];
  species: string;
  height: number;
  weight: number;
  moves: string[];
  artwork: string;
  options: Array<{ id: number; displayName: string; types: string[] }>;
  correctOptionId: number;
}

interface DuelRoomState {
  code: string;
  host: DuelPlayer;
  guest: DuelPlayer | null;
  rounds: number;
  timeLimit: number;
  difficulty: string;
  region: string;
  status: 'waiting' | 'in_progress' | 'round_reveal' | 'finished';
  questions: DuelQuestion[];
  currentRoundIdx: number;
  roundStartTime: number;
  firstAnswerer: { playerId: string; playerName: string; timeTaken: number } | null;
  roundAnswers: Record<string, {
    playerId: string;
    playerName: string;
    choiceId: number;
    isCorrect: boolean;
    timeTaken: number;
    timeRemaining: number;
    pointsEarned: number;
    speedTier: string;
    isFirst: boolean;
  }>;
  lastRoundBreakdown: {
    firstAnswerer: { playerId: string; playerName: string; timeTaken: number } | null;
    roundIdx: number;
    correctPokemon: { id: number; displayName: string; artwork: string; types: string[] };
    answers: Record<string, {
      playerName: string;
      isCorrect: boolean;
      timeTaken: number;
      pointsEarned: number;
      isFirst: boolean;
    }>;
  } | null;
  createdAt: number;
}

export const Duel1v1Game: React.FC<Duel1v1GameProps> = ({
  currentTrainerName,
  onScoreEarned,
  onAdvanceMilestone,
  onTokensEarned,
  onBattleFinished,
  initialRoomCode,
}) => {
  // Navigation Tabs in Lobby
  const [lobbyTab, setLobbyTab] = useState<'matchmake' | 'create' | 'join'>('matchmake');

  // Creation Config
  const [rounds, setRounds] = useState(5);
  const [timeLimit, setTimeLimit] = useState(15);
  const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');
  const [region, setRegion] = useState<RegionId>('all');

  // Input for entering room code
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Active Session State
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [room, setRoom] = useState<DuelRoomState | null>(null);
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(null);
  const [hasAnsweredThisRound, setHasAnsweredThisRound] = useState(false);
  const [typedGuess, setTypedGuess] = useState('');

  // Polling ref and timers
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isSearchingMatch, setIsSearchingMatch] = useState(false);
  const [searchTimer, setSearchTimer] = useState(0);

  // Derive QR Join URL
  const joinUrl = room
    ? `${window.location.origin}${window.location.pathname}?duelRoom=${room.code}`
    : '';

  // Calculate Remaining Time from room.roundStartTime
  const [localTimeRemaining, setLocalTimeRemaining] = useState(15);

  // Auto-join from URL parameter if present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('duelRoom') || initialRoomCode;
    if (roomParam && !room) {
      handleJoinRoom(roomParam.trim().toUpperCase());
    }
  }, [initialRoomCode]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Poll active room state
  useEffect(() => {
    if (!room?.code) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/duel/room/${room.code}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.room) {
          const updated: DuelRoomState = data.room;

          // If new round index started, reset local choice
          if (updated.currentRoundIdx !== room.currentRoundIdx) {
            setSelectedChoiceId(null);
            setHasAnsweredThisRound(false);
            setTypedGuess('');
          }

          setRoom(updated);

          // If game finished, award scores & log battle history
          if (updated.status === 'finished' && room.status !== 'finished') {
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            sound.playFanfare();
            const me = updated.host.id === myPlayerId ? updated.host : updated.guest;
            const opponent = updated.host.id === myPlayerId ? updated.guest : updated.host;
            if (me) {
              onScoreEarned(me.score);
              onAdvanceMilestone();
              const tokens = Math.max(50, Math.floor(me.score / 5));
              if (onTokensEarned) {
                onTokensEarned(tokens);
              }
              if (onBattleFinished) {
                const oppScore = opponent?.score || 0;
                const result = me.score > oppScore ? 'victory' : me.score === oppScore ? 'draw' : 'defeat';
                onBattleFinished({
                  mode: '1v1 PvP Duel',
                  opponentName: opponent?.name || 'Rival Trainer',
                  opponentAvatarId: opponent?.avatarId ? String(opponent.avatarId) : undefined,
                  playerScore: me.score,
                  opponentScore: oppScore,
                  result,
                  rewardTokens: tokens,
                  rewardTP: me.score,
                });
              }
            }
          }
        }
      } catch (err) {
        console.error('Error polling duel room:', err);
      }
    };

    pollIntervalRef.current = setInterval(fetchRoom, 750);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [room?.code, room?.currentRoundIdx, room?.status, myPlayerId]);

  // Countdown timer when round in progress
  useEffect(() => {
    if (room?.status !== 'in_progress' || !room.roundStartTime) return;

    const timer = setInterval(() => {
      const elapsed = (Date.now() - room.roundStartTime) / 1000;
      const left = Math.max(0, Math.ceil(room.timeLimit - elapsed));
      setLocalTimeRemaining(left);
    }, 200);

    return () => clearInterval(timer);
  }, [room?.status, room?.roundStartTime, room?.timeLimit]);

  // Handle Matchmaking timer
  useEffect(() => {
    let t: NodeJS.Timeout | null = null;
    if (isSearchingMatch) {
      t = setInterval(() => setSearchTimer((s) => s + 1), 1000);
    } else {
      setSearchTimer(0);
    }
    return () => {
      if (t) clearInterval(t);
    };
  }, [isSearchingMatch]);

  // 1. Create Room Action
  const handleCreateRoom = async () => {
    sound.playClick();
    setJoinError(null);
    try {
      const res = await fetch('/api/duel/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: currentTrainerName,
          rounds,
          timeLimit,
          difficulty,
          region,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMyPlayerId(data.playerId);
        setRoom(data.room);
      } else {
        setJoinError(data.error || 'Failed to create room.');
      }
    } catch (err) {
      setJoinError('Network error connecting to duel server.');
    }
  };

  // 2. Join Room Action
  const handleJoinRoom = async (codeToJoin?: string) => {
    sound.playClick();
    const targetCode = (codeToJoin || inputRoomCode).trim().toUpperCase();
    if (!targetCode) {
      setJoinError('Please enter a valid Room Code (e.g. PKMN-1234)');
      return;
    }
    setJoinError(null);
    try {
      const res = await fetch('/api/duel/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: targetCode,
          playerName: currentTrainerName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMyPlayerId(data.playerId);
        setRoom(data.room);
      } else {
        setJoinError(data.error || 'Failed to join room.');
      }
    } catch (err) {
      setJoinError('Network error connecting to duel room.');
    }
  };

  // 3. Random Matchmaking Action
  const handleRandomMatch = async () => {
    sound.playClick();
    setIsSearchingMatch(true);
    setJoinError(null);
    try {
      const res = await fetch('/api/duel/random-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: currentTrainerName,
          difficulty,
          region,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMyPlayerId(data.playerId);
        setRoom(data.room);
        if (data.matched) {
          setIsSearchingMatch(false);
          sound.playLevelUp();
        }
      } else {
        setIsSearchingMatch(false);
        setJoinError(data.error || 'Matchmaking error.');
      }
    } catch (err) {
      setIsSearchingMatch(false);
      setJoinError('Network error during matchmaking.');
    }
  };

  // 4. Submit Answer Action
  const handleSelectAnswer = async (choiceId: number) => {
    if (!room || room.status !== 'in_progress' || hasAnsweredThisRound || !myPlayerId) return;

    sound.playClick();
    setSelectedChoiceId(choiceId);
    setHasAnsweredThisRound(true);

    const elapsed = Math.max(0.2, (Date.now() - room.roundStartTime) / 1000);
    const remaining = Math.max(0, room.timeLimit - elapsed);

    try {
      const res = await fetch(`/api/duel/room/${room.code}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: myPlayerId,
          playerName: currentTrainerName,
          choiceId,
          timeTaken: Number(elapsed.toFixed(2)),
          timeRemaining: Number(remaining.toFixed(2)),
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.isCorrect) {
          sound.playCorrect();
        } else {
          sound.playWrong();
        }
        if (data.room) {
          setRoom(data.room);
        }
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
    }
  };

  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedGuess.trim() || hasAnsweredThisRound || isReveal || !curQ) return;
    const clean = typedGuess.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const matched = curQ.options.find(
      (o) =>
        o.displayName.toLowerCase().replace(/[^a-z0-9]/g, '') === clean ||
        ('name' in o && typeof (o as any).name === 'string' && (o as any).name.toLowerCase().replace(/[^a-z0-9]/g, '') === clean)
    );
    if (matched) {
      handleSelectAnswer(matched.id);
    } else {
      handleSelectAnswer(0);
    }
  };

  // 5. Leave Battle
  const handleLeaveRoom = async () => {
    sound.playClick();
    if (room?.code) {
      try {
        await fetch(`/api/duel/room/${room.code}/leave`, { method: 'POST' });
      } catch {
        // ignore
      }
    }
    setRoom(null);
    setMyPlayerId(null);
    setSelectedChoiceId(null);
    setHasAnsweredThisRound(false);
    setIsSearchingMatch(false);
  };

  // =========================================================================
  // VIEW 1: LOBBY (Create, Join, or Find Random Match)
  // =========================================================================
  if (!room) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-5 p-3 sm:p-5">
        {/* Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-red-600/20 via-slate-900 to-amber-600/20 border border-red-500/30 text-center relative overflow-hidden shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Swords className="w-3.5 h-3.5" />
            <span>Real-Time Multi-Device 1v1 PvP Arena</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
            Pokémon Trainer Colosseum
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto mt-1">
            Duel rival trainers in real-time across two different devices. Scan the QR code, share your Room Code, or jump straight into Random Matchmaking!
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-center p-1.5 rounded-2xl bg-slate-900 border border-slate-800 max-w-md mx-auto">
          <button
            id="tab-duel-matchmake"
            onClick={() => {
              sound.playClick();
              setLobbyTab('matchmake');
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              lobbyTab === 'matchmake'
                ? 'bg-gradient-to-r from-amber-500 to-red-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Random Match</span>
          </button>

          <button
            id="tab-duel-create"
            onClick={() => {
              sound.playClick();
              setLobbyTab('create');
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              lobbyTab === 'create'
                ? 'bg-gradient-to-r from-amber-500 to-red-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Host & QR</span>
          </button>

          <button
            id="tab-duel-join"
            onClick={() => {
              sound.playClick();
              setLobbyTab('join');
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              lobbyTab === 'join'
                ? 'bg-gradient-to-r from-amber-500 to-red-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Enter Code</span>
          </button>
        </div>

        {joinError && (
          <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs text-center font-medium">
            {joinError}
          </div>
        )}

        {/* TAB 1: RANDOM MATCHMAKING */}
        {lobbyTab === 'matchmake' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-6 max-w-xl mx-auto shadow-xl"
          >
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Zap className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-bold font-display text-white">Instant Global Matchmaking</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Find another online trainer right now. Fast synchronized 5-round battle with live first-answer indicators!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto text-left">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => {
                    const d = e.target.value as GameDifficulty;
                    setDifficulty(d);
                    if (d === 'extreme' || d === 'menacing') setTimeLimit(30);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-2.5 outline-none focus:border-amber-500"
                >
                  <option value="easy">Easy (15s)</option>
                  <option value="medium">Medium (12s)</option>
                  <option value="hard">Hard (8s)</option>
                  <option value="extreme">Extreme (30s - 4 Options & Classified Dossier)</option>
                  <option value="menacing">Menacing (30s - Manual Typing & Classified Dossier)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Region Pool
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value as RegionId)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-2.5 outline-none focus:border-amber-500 capitalize"
                >
                  <option value="all">All 9 Regions (1025)</option>
                  <option value="kanto">Kanto</option>
                  <option value="johto">Johto</option>
                  <option value="hoenn">Hoenn</option>
                  <option value="sinnoh">Sinnoh</option>
                  <option value="unova">Unova</option>
                  <option value="kalos">Kalos</option>
                  <option value="alola">Alola</option>
                  <option value="galar">Galar</option>
                  <option value="paldea">Paldea</option>
                </select>
              </div>
            </div>

            <button
              id="btn-find-random-opponent"
              onClick={handleRandomMatch}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-500 via-amber-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white font-extrabold text-base shadow-xl shadow-red-950/40 flex items-center justify-center gap-3 transition-all transform active:scale-95"
            >
              <Zap className="w-5 h-5 fill-white" />
              <span>Find Random Opponent Now</span>
            </button>
          </motion.div>
        )}

        {/* TAB 2: HOST PRIVATE ROOM & QR */}
        {lobbyTab === 'create' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6 max-w-xl mx-auto shadow-xl"
          >
            <div className="text-center">
              <h3 className="text-xl font-bold font-display text-white flex items-center justify-center gap-2">
                <QrCode className="w-5 h-5 text-amber-400" />
                <span>Host Custom Room & QR Code</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure your duel rules and invite a friend on another phone or computer.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Rounds
                </label>
                <div className="flex gap-2">
                  {[5, 10, 15].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRounds(r)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        rounds === r
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {r} Qs
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Time Limit
                </label>
                <div className="flex gap-2">
                  {[10, 15, 20, 30].map((s) => (
                    <button
                      key={s}
                      onClick={() => setTimeLimit(s)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        timeLimit === s
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {s}s
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => {
                    const d = e.target.value as GameDifficulty;
                    setDifficulty(d);
                    if (d === 'extreme' || d === 'menacing') setTimeLimit(30);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-2.5 outline-none focus:border-amber-500"
                >
                  <option value="easy">Easy (Classic Options - 15s)</option>
                  <option value="medium">Medium (Close Decoys - 12s)</option>
                  <option value="hard">Hard (Fast Pace - 8s)</option>
                  <option value="extreme">Extreme (Classified Dossier & 4 Options - 30s)</option>
                  <option value="menacing">Menacing (Classified Dossier & Manual Typing - 30s)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Pokémon Pool
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value as RegionId)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-2.5 outline-none focus:border-amber-500 capitalize"
                >
                  <option value="all">All 9 Regions (1025)</option>
                  <option value="kanto">Kanto</option>
                  <option value="johto">Johto</option>
                  <option value="hoenn">Hoenn</option>
                  <option value="sinnoh">Sinnoh</option>
                  <option value="unova">Unova</option>
                  <option value="kalos">Kalos</option>
                  <option value="alola">Alola</option>
                  <option value="galar">Galar</option>
                  <option value="paldea">Paldea</option>
                </select>
              </div>
            </div>

            <button
              id="btn-create-duel-room"
              onClick={handleCreateRoom}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-500 via-amber-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white font-extrabold text-base shadow-xl shadow-red-950/40 flex items-center justify-center gap-3 transition-all transform active:scale-95"
            >
              <QrCode className="w-5 h-5" />
              <span>Create Battle Room & Generate QR</span>
            </button>
          </motion.div>
        )}

        {/* TAB 3: ENTER ROOM CODE */}
        {lobbyTab === 'join' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-6 max-w-xl mx-auto shadow-xl"
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
              <Smartphone className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold font-display text-white">Join with Room Code</h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter the 4-digit or custom Room Code shown on your rival's screen.
              </p>
            </div>

            <div className="max-w-xs mx-auto">
              <input
                id="input-room-code"
                type="text"
                placeholder="e.g. PKMN-1234"
                value={inputRoomCode}
                onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleJoinRoom();
                }}
                className="w-full bg-slate-950 border-2 border-slate-700 focus:border-amber-500 rounded-2xl py-3.5 px-4 text-center text-lg font-mono font-bold tracking-widest text-white uppercase outline-none shadow-inner"
              />
            </div>

            <button
              id="btn-join-duel-room"
              onClick={() => handleJoinRoom()}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-base shadow-xl shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <Swords className="w-5 h-5" />
              <span>Connect & Enter Battle</span>
            </button>
          </motion.div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: WAITING LOBBY (Host created room or waiting for random match)
  // =========================================================================
  if (room.status === 'waiting') {
    return (
      <div className="w-full max-w-xl mx-auto p-4 sm:p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-6 shadow-2xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider animate-pulse">
            <Radio className="w-3.5 h-3.5" />
            <span>Waiting for Opponent to Connect</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Your Battle Room Code:</span>
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-slate-950 border-2 border-amber-500/50 shadow-inner">
              <span className="text-2xl sm:text-3xl font-mono font-black text-amber-300 tracking-wider">
                {room.code}
              </span>
              <button
                onClick={() => {
                  sound.playClick();
                  navigator.clipboard.writeText(room.code);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Copy Room Code"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* QR Code */}
          <div className="p-4 rounded-2xl bg-white w-fit mx-auto shadow-2xl border-4 border-slate-800">
            <QRCodeSVG value={joinUrl || room.code} size={180} level="H" includeMargin={false} />
          </div>

          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Scan this QR code with any smartphone camera, or enter room code <strong className="text-white font-mono">{room.code}</strong> on another device to play against each other in real-time!
          </p>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Rounds: <strong className="text-white">{room.rounds}</strong></span>
            <span>Time: <strong className="text-white">{room.timeLimit}s</strong></span>
            <span>Pool: <strong className="text-white capitalize">{room.region}</strong></span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                sound.playClick();
                navigator.clipboard.writeText(joinUrl);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>{copiedLink ? 'Link Copied!' : 'Copy Direct Link'}</span>
            </button>

            <button
              onClick={handleLeaveRoom}
              className="py-3 px-5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold border border-red-500/30 transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: MATCH FINISHED SUMMARY
  // =========================================================================
  if (room.status === 'finished') {
    const isHost = room.host.id === myPlayerId;
    const me = isHost ? room.host : room.guest;
    const opponent = isHost ? room.guest : room.host;
    const isWinner = me && opponent && me.score > opponent.score;
    const isDraw = me && opponent && me.score === opponent.score;

    return (
      <div className="w-full max-w-xl mx-auto p-4 sm:p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-6 shadow-2xl relative overflow-hidden"
        >
          {/* Header Banner */}
          <div className="space-y-2">
            <div className="text-4xl sm:text-5xl select-none">
              {isWinner ? '🏆' : isDraw ? '🤝' : '⚔️'}
            </div>
            <h2 className={`text-2xl sm:text-3xl font-black font-display tracking-tight ${
              isWinner ? 'text-amber-300' : isDraw ? 'text-slate-300' : 'text-rose-400'
            }`}>
              {isWinner ? 'COLOSSEUM VICTORY!' : isDraw ? 'HONORABLE DRAW!' : 'BATTLE DEFEAT'}
            </h2>
            <p className="text-xs text-slate-400">
              {isWinner
                ? `Sensational duel! You triumphed over ${opponent?.name || 'your rival'}!`
                : isDraw
                ? 'Dead heat! Both trainers demonstrated exceptional Pokémon acumen!'
                : `A valiant effort against ${opponent?.name || 'your rival'}. Train hard and rematch!`}
            </p>
          </div>

          {/* Head-to-head Score Comparison Card */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 grid grid-cols-2 gap-4 divide-x divide-slate-800">
            <div className="text-center space-y-1">
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                {me?.name || 'You'} (YOU)
              </span>
              <div className="text-3xl font-mono font-black text-white">
                {me?.score || 0}
              </div>
              <div className="text-[10px] text-slate-400">
                Base: {me?.baseScore || 0} • Speed: {me?.speedScore || 0}
              </div>
            </div>

            <div className="text-center space-y-1">
              <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider block">
                {opponent?.name || 'Rival'}
              </span>
              <div className="text-3xl font-mono font-black text-white">
                {opponent?.score || 0}
              </div>
              <div className="text-[10px] text-slate-400">
                Base: {opponent?.baseScore || 0} • Speed: {opponent?.speedScore || 0}
              </div>
            </div>
          </div>

          {/* Rewards Earned Callout */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-amber-500/30 flex items-center justify-around text-xs">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>+{me?.score || 0} Trophy Points</span>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>+{Math.max(50, Math.floor((me?.score || 0) / 5))} Battle Tokens</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleLeaveRoom}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-red-950/40 flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <Swords className="w-4 h-4" />
              <span>Return to Arena Lobby</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 4: ACTIVE BATTLE (In Progress or Round Reveal)
  // =========================================================================
  const curQ = room.questions[room.currentRoundIdx];
  const isHost = room.host.id === myPlayerId;
  const myPlayer = isHost ? room.host : room.guest;
  const rivalPlayer = isHost ? room.guest : room.host;
  const myAnswer = myPlayerId ? room.roundAnswers[myPlayerId] : null;
  const isReveal = room.status === 'round_reveal';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 p-3 sm:p-5 select-none">
      {/* Head-to-Head Live Scoreboard Header */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-2xl relative overflow-hidden">
        {/* Host Info */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/30 to-indigo-600/30 border border-blue-500/50 flex items-center justify-center overflow-hidden">
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${room.host.avatarId}.png`}
              alt={room.host.name}
              className="w-10 h-10 object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate max-w-[100px] sm:max-w-[140px]">
                {room.host.name}
              </span>
              {isHost && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                  YOU
                </span>
              )}
            </div>
            <div className="text-lg sm:text-xl font-mono font-black text-amber-300">
              {room.host.score} <span className="text-[10px] text-slate-400 font-normal">pts</span>
            </div>
          </div>
        </div>

        {/* Center: Round & Sync Timer */}
        <div className="text-center px-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Round {room.currentRoundIdx + 1} / {room.rounds}
          </div>
          <div className={`text-2xl sm:text-3xl font-mono font-black ${
            localTimeRemaining <= 3 ? 'text-red-500 animate-ping' : 'text-white'
          }`}>
            {isReveal ? 'REVEAL' : `${localTimeRemaining}s`}
          </div>
        </div>

        {/* Rival Info */}
        <div className="flex items-center gap-3 text-right">
          <div>
            <div className="flex items-center justify-end gap-1.5">
              {!isHost && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                  YOU
                </span>
              )}
              <span className="text-xs font-bold text-white truncate max-w-[100px] sm:max-w-[140px]">
                {room.guest?.name || 'Rival'}
              </span>
            </div>
            <div className="text-lg sm:text-xl font-mono font-black text-amber-300">
              {room.guest?.score || 0} <span className="text-[10px] text-slate-400 font-normal">pts</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/30 to-amber-600/30 border border-red-500/50 flex items-center justify-center overflow-hidden">
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${room.guest?.avatarId || 6}.png`}
              alt={room.guest?.name || 'Rival'}
              className="w-10 h-10 object-contain"
            />
          </div>
        </div>
      </div>

      {/* Real-time "Who Answered First" Alert Banner */}
      <AnimatePresence>
        {room.firstAnswerer && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-lg ${
              room.firstAnswerer.playerId === myPlayerId
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 fill-current" />
              <span>
                {room.firstAnswerer.playerId === myPlayerId
                  ? `⚡ You answered first in ${room.firstAnswerer.timeTaken}s! (+150 Quick Reflex Bonus)`
                  : `⚡ ${room.firstAnswerer.playerName} locked in first in ${room.firstAnswerer.timeTaken}s!`}
              </span>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-900/60 border border-white/10">
              First Buzzer
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Question Stage */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 text-center space-y-5 shadow-2xl relative">
        {/* Silhouette or Revealed Pokémon */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto flex items-center justify-center">
          <img
            src={curQ.artwork}
            alt={curQ.displayName}
            className={`w-full h-full object-contain transition-all duration-500 ${
              isReveal ? 'brightness-100 drop-shadow-2xl scale-105' : 'brightness-0 contrast-200 opacity-90'
            }`}
          />

          {isReveal && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-2 px-4 py-1 rounded-full bg-slate-950/90 border border-amber-500/40 text-amber-300 font-display font-extrabold text-sm sm:text-base shadow-xl"
            >
              #{curQ.targetId} {curQ.displayName}
            </motion.div>
          )}
        </div>

        {/* Clues */}
        <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
          {curQ.types.map((t) => (
            <span
              key={t}
              className="px-3 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-700 capitalize font-medium"
            >
              {t} Type
            </span>
          ))}
          <span className="px-3 py-1 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700">
            {curQ.species}
          </span>
        </div>

        {/* Classified Dossier for Extreme / Menacing */}
        {(room.difficulty === 'extreme' || room.difficulty === 'menacing') && (
          <div
            className={`p-3.5 rounded-2xl border text-xs max-w-lg mx-auto ${
              room.difficulty === 'menacing'
                ? 'bg-red-950/40 border-red-500/40 text-red-200'
                : 'bg-purple-950/40 border-purple-500/40 text-purple-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10">
              <span className="flex items-center gap-1.5 font-mono font-black uppercase text-[11px] tracking-wider">
                {room.difficulty === 'menacing' ? (
                  <>
                    <Skull className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-red-400">Classified Dossier // Menacing Protocol</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-purple-400">Classified Dossier // Extreme Protocol</span>
                  </>
                )}
              </span>
              <span className="px-2 py-0.5 rounded bg-black/40 text-[10px] font-mono">30s Limit</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-left text-[11px]">
              <div className="bg-black/30 p-2 rounded-xl">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Category</span>
                <span className="font-semibold">{curQ.species || 'Unknown'}</span>
              </div>
              <div className="bg-black/30 p-2 rounded-xl">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Height / Weight</span>
                <span className="font-semibold">
                  {(curQ.height / 10).toFixed(1)}m / {(curQ.weight / 10).toFixed(1)}kg
                </span>
              </div>
              <div className="bg-black/30 p-2 rounded-xl col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Primary Type</span>
                <span className="font-semibold capitalize">{curQ.types.join(' / ')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Menacing: Manual Typing Input / Extreme & Others: 4 Options Grid */}
        {room.difficulty === 'menacing' ? (
          <form onSubmit={handleTypedSubmit} className="max-w-md mx-auto pt-2 space-y-3">
            <div className="relative">
              <input
                type="text"
                id="duel-menacing-input"
                value={typedGuess}
                onChange={(e) => setTypedGuess(e.target.value)}
                disabled={hasAnsweredThisRound || isReveal}
                placeholder={hasAnsweredThisRound ? 'Guess Locked In' : 'Type exact Pokémon name...'}
                autoFocus
                className="w-full bg-slate-950 border-2 border-red-500/50 rounded-2xl px-5 py-3.5 text-white placeholder-slate-500 font-bold text-center tracking-wide outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/20 text-base"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-black text-red-400 uppercase tracking-widest px-2 py-1 rounded bg-red-950/80 border border-red-800/60">
                Type Name
              </span>
            </div>

            <button
              type="submit"
              id="btn-submit-menacing-duel"
              disabled={!typedGuess.trim() || hasAnsweredThisRound || isReveal}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-sm shadow-lg shadow-red-950/40 flex items-center justify-center gap-2 transition-all transform active:scale-98"
            >
              <Send className="w-4 h-4" />
              <span>Lock In Menacing Guess</span>
            </button>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto pt-2">
            {curQ.options.map((opt) => {
              const isSelected = selectedChoiceId === opt.id;
              const isCorrect = opt.id === curQ.correctOptionId;

              let btnClass = 'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-amber-500/50';

              if (isReveal) {
                if (isCorrect) {
                  btnClass = 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-black shadow-lg shadow-emerald-950/40';
                } else if (isSelected) {
                  btnClass = 'bg-red-500/20 border-red-400 text-red-300 line-through';
                } else {
                  btnClass = 'bg-slate-950/40 border-slate-800/60 opacity-40 text-slate-500';
                }
              } else if (isSelected) {
                btnClass = 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold';
              }

              return (
                <button
                  key={opt.id}
                  id={`duel-option-${opt.id}`}
                  disabled={hasAnsweredThisRound || isReveal}
                  onClick={() => handleSelectAnswer(opt.id)}
                  className={`p-4 rounded-2xl border text-sm sm:text-base font-medium flex items-center justify-between transition-all transform active:scale-98 ${btnClass}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-mono font-bold text-slate-400">
                      #{opt.id}
                    </span>
                    <span className="font-bold">{opt.displayName}</span>
                  </div>

                  {isReveal && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                  {isReveal && !isCorrect && isSelected && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Live Status indicator */}
        <div className="text-xs text-slate-400 pt-2 flex items-center justify-center gap-3">
          {hasAnsweredThisRound && !isReveal && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              <Check className="w-3.5 h-3.5" />
              <span>You locked in! Waiting for {rivalPlayer?.name || 'rival'} to answer...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
