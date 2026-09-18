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
} from 'lucide-react';
import { DuelRoomConfig, GameDifficulty, Pokemon, RegionId } from '../../types/pokemon';
import { CURATED_POKEMON, getPokemonByRegion } from '../../data/pokemonData';
import { sound } from '../../utils/audio';

interface Duel1v1GameProps {
  currentTrainerName: string;
  onScoreEarned: (points: number) => void;
  onAdvanceMilestone: () => void;
}

interface RoundScoreBreakdown {
  playerName: string;
  isCorrect: boolean;
  basePoints: number;
  quickAnswerPoints: number;
  totalAdded: number;
  timeTaken: number;
  timeLeft: number;
  speedTier: 'instant' | 'fast' | 'moderate' | 'slow' | 'none';
}

export const Duel1v1Game: React.FC<Duel1v1GameProps> = ({
  currentTrainerName,
  onScoreEarned,
  onAdvanceMilestone,
}) => {
  const [stage, setStage] = useState<'create' | 'lobby' | 'battle' | 'results'>('create');
  const [rounds, setRounds] = useState(5);
  const [timeLimit, setTimeLimit] = useState(15);
  const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');
  const [region, setRegion] = useState<RegionId>('all');
  const [room, setRoom] = useState<DuelRoomConfig | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Active battle state
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [activePlayer, setActivePlayer] = useState<'host' | 'guest'>('host');
  const [guestName, setGuestName] = useState('Challenger Gary');
  const [options, setOptions] = useState<Pokemon[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [roundAnswered, setRoundAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);

  // Separate Point Tracking for Player 1 & Player 2
  // Main Points = Base Points + Quick Answer Points
  const [p1Score, setP1Score] = useState(0);
  const [p1BaseScore, setP1BaseScore] = useState(0);
  const [p1SpeedScore, setP1SpeedScore] = useState(0);
  const [p1Answers, setP1Answers] = useState<boolean[]>([]);
  const [p1Times, setP1Times] = useState<number[]>([]);

  const [p2Score, setP2Score] = useState(0);
  const [p2BaseScore, setP2BaseScore] = useState(0);
  const [p2SpeedScore, setP2SpeedScore] = useState(0);
  const [p2Answers, setP2Answers] = useState<boolean[]>([]);
  const [p2Times, setP2Times] = useState<number[]>([]);

  // Round breakdown banner state
  const [lastRoundBreakdown, setLastRoundBreakdown] = useState<RoundScoreBreakdown | null>(null);

  // Live countdown timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timer helper
  const clearActiveTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleCreateRoom = () => {
    sound.playButtonPress();
    const roomId = 'PKMN-' + Math.floor(1000 + Math.random() * 9000);
    const pool = getPokemonByRegion(region);
    const questions = [...pool].sort(() => Math.random() - 0.5).slice(0, rounds);

    const newRoom: DuelRoomConfig = {
      roomId,
      hostName: currentTrainerName,
      guestName: 'Challenger',
      rounds,
      timeLimit,
      difficulty,
      mode: '1v1',
      region,
      questions,
      hostScores: [],
      guestScores: [],
      currentRound: 0,
      status: 'waiting',
    };

    setRoom(newRoom);
    setStage('lobby');
  };

  const roomShareUrl = room ? `${window.location.origin}${window.location.pathname}?duel=${room.roomId}` : '';

  const handleCopyLink = () => {
    sound.playButtonPress();
    navigator.clipboard.writeText(roomShareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleStartBattle = () => {
    if (!room) return;
    sound.playTrophyUnlock();
    setStage('battle');
    setCurrentRoundIdx(0);
    setActivePlayer('host');
    setP1Score(0);
    setP1BaseScore(0);
    setP1SpeedScore(0);
    setP1Answers([]);
    setP1Times([]);

    setP2Score(0);
    setP2BaseScore(0);
    setP2SpeedScore(0);
    setP2Answers([]);
    setP2Times([]);

    setLastRoundBreakdown(null);
    prepareQuestion(room.questions[0]);
  };

  const prepareQuestion = (target: Pokemon) => {
    clearActiveTimer();
    setRoundAnswered(false);
    setSelectedOptionId(null);
    setLastRoundBreakdown(null);
    const roundLimit = room?.timeLimit || 15;
    setTimeLeft(roundLimit);

    const decoys = CURATED_POKEMON.filter((p) => p.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const opts = [target, ...decoys].sort(() => Math.random() - 0.5);
    setOptions(opts);
  };

  // Live Timer Countdown Effect
  useEffect(() => {
    if (stage !== 'battle' || roundAnswered || !room) {
      clearActiveTimer();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, Math.round((prev - 0.1) * 10) / 10);
        if (next <= 0) {
          clearActiveTimer();
          handleTimeOut();
          return 0;
        }
        return next;
      });
    }, 100);

    return () => clearActiveTimer();
  }, [stage, roundAnswered, currentRoundIdx, activePlayer, room?.timeLimit]);

  // Handle Timeout when time runs out
  const handleTimeOut = () => {
    if (roundAnswered || !room) return;
    sound.playWrong();
    setRoundAnswered(true);
    setSelectedOptionId(null);

    const roundLimit = room.timeLimit || 15;
    const currentPlayerName = activePlayer === 'host' ? room.hostName : guestName;

    setLastRoundBreakdown({
      playerName: currentPlayerName,
      isCorrect: false,
      basePoints: 0,
      quickAnswerPoints: 0,
      totalAdded: 0,
      timeTaken: roundLimit,
      timeLeft: 0,
      speedTier: 'none',
    });

    if (activePlayer === 'host') {
      setP1Answers((prev) => [...prev, false]);
      setP1Times((prev) => [...prev, roundLimit]);
    } else {
      setP2Answers((prev) => [...prev, false]);
      setP2Times((prev) => [...prev, roundLimit]);
    }
  };

  // Handle Player Answer Selection with Quicker-Answer Point System
  const handleSelectAnswer = (poke: Pokemon) => {
    if (roundAnswered || !room) return;
    clearActiveTimer();
    setRoundAnswered(true);
    setSelectedOptionId(poke.id);

    const currentTarget = room.questions[currentRoundIdx];
    const isCorrect = poke.id === currentTarget.id;
    const roundLimit = room.timeLimit || 15;
    const timeTaken = Math.max(0.1, Math.round((roundLimit - timeLeft) * 10) / 10);
    const currentPlayerName = activePlayer === 'host' ? room.hostName : guestName;

    if (isCorrect) {
      sound.playCorrect();

      // 1. Base Points for correct answer (remains constant at 250 PTS)
      const basePoints = 250;

      // 2. Quick Answer Points calculated separately based on speed:
      // The quicker the answer (higher remaining time), the more points awarded!
      const speedRatio = Math.max(0, timeLeft / roundLimit);
      const maxQuickBonus = 250; // Up to 250 extra points for instantaneous response
      const quickAnswerPoints = Math.round(speedRatio * maxQuickBonus);

      // 3. Add Quick Answer Points to Base Points to form Main Points
      const totalAdded = basePoints + quickAnswerPoints;

      let speedTier: 'instant' | 'fast' | 'moderate' | 'slow' = 'slow';
      if (speedRatio >= 0.75) speedTier = 'instant';
      else if (speedRatio >= 0.45) speedTier = 'fast';
      else if (speedRatio >= 0.2) speedTier = 'moderate';

      setLastRoundBreakdown({
        playerName: currentPlayerName,
        isCorrect: true,
        basePoints,
        quickAnswerPoints,
        totalAdded,
        timeTaken,
        timeLeft,
        speedTier,
      });

      if (activePlayer === 'host') {
        setP1BaseScore((prev) => prev + basePoints);
        setP1SpeedScore((prev) => prev + quickAnswerPoints);
        setP1Score((prev) => prev + totalAdded);
        setP1Answers((prev) => [...prev, true]);
        setP1Times((prev) => [...prev, timeTaken]);
      } else {
        setP2BaseScore((prev) => prev + basePoints);
        setP2SpeedScore((prev) => prev + quickAnswerPoints);
        setP2Score((prev) => prev + totalAdded);
        setP2Answers((prev) => [...prev, true]);
        setP2Times((prev) => [...prev, timeTaken]);
      }
    } else {
      sound.playWrong();
      setLastRoundBreakdown({
        playerName: currentPlayerName,
        isCorrect: false,
        basePoints: 0,
        quickAnswerPoints: 0,
        totalAdded: 0,
        timeTaken,
        timeLeft,
        speedTier: 'none',
      });

      if (activePlayer === 'host') {
        setP1Answers((prev) => [...prev, false]);
        setP1Times((prev) => [...prev, timeTaken]);
      } else {
        setP2Answers((prev) => [...prev, false]);
        setP2Times((prev) => [...prev, timeTaken]);
      }
    }
  };

  const handleAdvanceTurn = () => {
    sound.playButtonPress();
    if (!room) return;

    if (activePlayer === 'host') {
      // Switch to Guest for same question
      setActivePlayer('guest');
      prepareQuestion(room.questions[currentRoundIdx]);
    } else {
      // Both answered current round! Advance to next round
      if (currentRoundIdx + 1 < room.rounds) {
        const nextIdx = currentRoundIdx + 1;
        setCurrentRoundIdx(nextIdx);
        setActivePlayer('host');
        prepareQuestion(room.questions[nextIdx]);
      } else {
        // Battle finished!
        sound.playTrophyUnlock();
        setStage('results');
        onScoreEarned(p1Score + p2Score);
        onAdvanceMilestone();
      }
    }
  };

  // Calculate speed percentage for visual timer
  const maxLimit = room?.timeLimit || 15;
  const timePercentage = Math.min(100, Math.max(0, (timeLeft / maxLimit) * 100));

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Create Room Stage */}
      {stage === 'create' && (
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mb-3">
            <Swords className="w-6 h-6" />
          </div>

          <h3 className="text-xl font-black font-display text-white mb-1">
            Host 1v1 Battle Arena
          </h3>
          <p className="text-xs text-slate-400 mb-6 text-center max-w-md">
            Challenge your rival with live quick-response scoring. The faster you identify the Pokémon, the more bonus speed points you bank into your main score!
          </p>

          <div className="w-full space-y-4 mb-6">
            {/* Number of Rounds */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Number of Rounds: <span className="text-rose-400 font-bold">{rounds} Rounds</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 5, 10, 15].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      sound.playButtonPress();
                      setRounds(n);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      rounds === n
                        ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-950'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {n} Qs
                  </button>
                ))}
              </div>
            </div>

            {/* Time to Answer in Seconds */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
                <span>Time Per Question: <span className="text-amber-400 font-bold">{timeLimit}s</span></span>
                <span className="text-[11px] text-cyan-400 font-normal">Quicker answer = More points</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 15, 20, 30].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      sound.playButtonPress();
                      setTimeLimit(sec);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      timeLimit === sec
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-950'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Difficulty: <span className="text-cyan-400 font-bold capitalize">{difficulty}</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      sound.playButtonPress();
                      setDifficulty(d);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold uppercase border transition-all ${
                      difficulty === d
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-950'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            id="btn-generate-1v1-room"
            onClick={handleCreateRoom}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-display font-black text-sm uppercase tracking-wider shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            <QrCode className="w-4 h-4" />
            <span>Generate QR Challenge & Room</span>
          </button>
        </div>
      )}

      {/* Lobby with Scannable QR Code */}
      {stage === 'lobby' && room && (
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center">
          <span className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">
            Challenge Invitation Ready
          </span>
          <h3 className="text-2xl font-black font-display text-white mb-2">
            Room Code: <span className="text-cyan-400 font-mono">{room.roomId}</span>
          </h3>

          {/* Scannable QR Code Card */}
          <div className="p-4 bg-white rounded-2xl shadow-xl my-4 flex flex-col items-center">
            <QRCodeSVG value={roomShareUrl} size={180} level="M" />
            <span className="text-[10px] text-slate-600 font-mono font-bold mt-2">
              Scan with camera to accept duel
            </span>
          </div>

          <div className="flex items-center gap-2 mb-5">
            <button
              id="btn-copy-1v1-link"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Direct Link'}</span>
            </button>
          </div>

          {/* Point System Rules Summary */}
          <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs text-left mb-6 space-y-2 text-slate-300">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>1v1 Point System:</span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1 pl-1">
              <div>• <strong className="text-white">Correct Answer Base:</strong> 250 PTS per correct Pokémon</div>
              <div>• <strong className="text-amber-300">Quick Answer Speed Bonus:</strong> Up to +250 PTS calculated separately based on how quickly you lock in!</div>
              <div>• <strong className="text-emerald-400">Main Score:</strong> Base Points + Quick Answer Points = Total Match Points</div>
            </div>
          </div>

          <div className="w-full flex gap-3">
            <button
              onClick={() => setStage('create')}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700"
            >
              Back / Edit Rules
            </button>
            <button
              id="btn-start-1v1-battle"
              onClick={handleStartBattle}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-500/30 flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start Battle Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Live 1v1 Battle Arena */}
      {stage === 'battle' && room && (
        <div className="w-full flex flex-col items-center">
          {/* Dual Scoreboard Header with Separate Quick Points & Main Points */}
          <div className="w-full grid grid-cols-2 gap-3 mb-3">
            {/* Player 1 Card (Host) */}
            <div
              className={`p-3 rounded-xl border flex flex-col items-center transition-all ${
                activePlayer === 'host'
                  ? 'bg-rose-500/20 border-rose-400 ring-2 ring-rose-500/40 shadow-lg shadow-rose-950/40'
                  : 'bg-slate-900/80 border-slate-800 opacity-70'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400">
                  P1: {room.hostName}
                </span>
                {activePlayer === 'host' && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-black animate-pulse">
                    TURN
                  </span>
                )}
              </div>

              {/* Main Points */}
              <div className="text-2xl font-black font-display text-white">
                {p1Score.toLocaleString()} <span className="text-xs text-amber-400 font-bold">PTS</span>
              </div>

              {/* Separate Base Points & Quick Points pill */}
              <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-950/70 px-2 py-0.5 rounded-full border border-slate-800">
                <span className="text-emerald-400 font-semibold" title="Correct Answer Points">
                  {p1BaseScore} Base
                </span>
                <span>+</span>
                <span className="text-amber-400 font-bold flex items-center gap-0.5" title="Quick Answer Speed Bonus">
                  <Zap className="w-2.5 h-2.5 text-amber-400" />
                  {p1SpeedScore} Quick
                </span>
              </div>

              <div className="flex gap-1 mt-1.5">
                {p1Answers.map((ans, i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full ${ans ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-rose-500'}`}
                  />
                ))}
              </div>
            </div>

            {/* Player 2 Card (Challenger) */}
            <div
              className={`p-3 rounded-xl border flex flex-col items-center transition-all ${
                activePlayer === 'guest'
                  ? 'bg-cyan-500/20 border-cyan-400 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-950/40'
                  : 'bg-slate-900/80 border-slate-800 opacity-70'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
                  P2: {guestName}
                </span>
                {activePlayer === 'guest' && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500 text-slate-950 font-black animate-pulse">
                    TURN
                  </span>
                )}
              </div>

              {/* Main Points */}
              <div className="text-2xl font-black font-display text-white">
                {p2Score.toLocaleString()} <span className="text-xs text-amber-400 font-bold">PTS</span>
              </div>

              {/* Separate Base Points & Quick Points pill */}
              <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-950/70 px-2 py-0.5 rounded-full border border-slate-800">
                <span className="text-emerald-400 font-semibold" title="Correct Answer Points">
                  {p2BaseScore} Base
                </span>
                <span>+</span>
                <span className="text-amber-400 font-bold flex items-center gap-0.5" title="Quick Answer Speed Bonus">
                  <Zap className="w-2.5 h-2.5 text-amber-400" />
                  {p2SpeedScore} Quick
                </span>
              </div>

              <div className="flex gap-1 mt-1.5">
                {p2Answers.map((ans, i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full ${ans ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-rose-500'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Question Stage Card */}
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col items-center mb-3 relative overflow-hidden">
            {/* Live Countdown & Speed Bonus Bar */}
            <div className="w-full mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1 text-slate-400 font-medium">
                  <Timer className={`w-3.5 h-3.5 ${timeLeft <= 3 ? 'text-rose-400 animate-spin' : 'text-cyan-400'}`} />
                  <span>Time Remaining:</span>
                  <span
                    className={`font-mono font-bold ${
                      timeLeft <= 3 ? 'text-rose-400 text-sm animate-pulse' : 'text-white'
                    }`}
                  >
                    {timeLeft.toFixed(1)}s
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px]">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span className="text-slate-400">Potential Quick Bonus:</span>
                  <span className="font-mono font-bold text-amber-300">
                    +{Math.round((timeLeft / maxLimit) * 250)} PTS
                  </span>
                </div>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-100 ${
                    timePercentage > 60
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                      : timePercentage > 30
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                      : 'bg-gradient-to-r from-rose-500 to-red-600'
                  }`}
                  style={{ width: `${timePercentage}%` }}
                />
              </div>
            </div>

            <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-1">
              Round {currentRoundIdx + 1} of {room.rounds} • {activePlayer === 'host' ? room.hostName : guestName}&apos;s Turn
            </span>

            {/* Silhouette or Revealed Target */}
            <div className="w-36 h-36 flex items-center justify-center my-2 relative">
              <img
                src={room.questions[currentRoundIdx].artwork}
                alt="Mystery Pokemon"
                className={`max-h-32 w-auto object-contain drop-shadow-xl select-none ${
                  roundAnswered ? 'pokemon-revealed' : 'pokemon-silhouette'
                }`}
              />
            </div>

            {roundAnswered && (
              <h4 className="text-lg font-black font-display text-white">
                {room.questions[currentRoundIdx].displayName}
              </h4>
            )}

            {/* Separate Points Breakdown Banner */}
            {roundAnswered && lastRoundBreakdown && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`w-full mt-3 p-3.5 rounded-xl border ${
                  lastRoundBreakdown.isCorrect
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                }`}
              >
                {lastRoundBreakdown.isCorrect ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Correct Pokémon Identified!
                      </span>
                      <span className="text-xs font-mono font-bold text-cyan-400 bg-slate-950/80 px-2 py-0.5 rounded-full border border-slate-800">
                        Answered in {lastRoundBreakdown.timeTaken.toFixed(1)}s
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800 text-left">
                        <span className="text-[10px] text-slate-400 block">Base Points (Correct)</span>
                        <span className="text-sm font-black font-mono text-white">
                          +{lastRoundBreakdown.basePoints} PTS
                        </span>
                      </div>
                      <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/30 text-left">
                        <span className="text-[10px] text-amber-400 font-semibold block flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-400" />
                          Quick Answer Points
                        </span>
                        <span className="text-sm font-black font-mono text-amber-300">
                          +{lastRoundBreakdown.quickAnswerPoints} PTS
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <span className="text-xs text-slate-300 font-medium">Added to Main Points:</span>
                      <span className="text-base font-black font-display font-mono text-amber-400">
                        +{lastRoundBreakdown.totalAdded} PTS
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold flex items-center gap-1.5 text-rose-400">
                      <XCircle className="w-4 h-4 text-rose-400" />
                      {lastRoundBreakdown.timeTaken >= maxLimit ? "Time Expired!" : "Incorrect Guess"}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      Base: +0 • Quick: +0 = +0 PTS
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* 4 Choices */}
          <div className="w-full grid grid-cols-2 gap-2.5 mb-4">
            {options.map((opt) => {
              const isCorrect = opt.id === room.questions[currentRoundIdx].id;
              const isSelected = selectedOptionId === opt.id;

              let btnClasses = 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200';
              if (roundAnswered) {
                if (isCorrect) {
                  btnClasses = 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold shadow-md shadow-emerald-950';
                } else if (isSelected) {
                  btnClasses = 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold';
                } else {
                  btnClasses = 'bg-slate-950/40 border-slate-900 opacity-40 text-slate-500';
                }
              }

              return (
                <button
                  key={opt.id}
                  disabled={roundAnswered}
                  onClick={() => {
                    sound.playButtonPress();
                    handleSelectAnswer(opt);
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${btnClasses}`}
                >
                  <span className="text-sm font-bold font-display">{opt.displayName}</span>
                  {roundAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {roundAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400" />}
                </button>
              );
            })}
          </div>

          {/* Advance Turn Button */}
          {roundAnswered && (
            <button
              onClick={handleAdvanceTurn}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-display font-bold text-sm flex items-center gap-2 shadow-lg shadow-rose-500/30 hover:scale-105 transition-all"
            >
              <span>{activePlayer === 'host' ? `Pass Turn to ${guestName}` : 'Advance to Next Round'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Results Celebration with Full Breakdown */}
      {stage === 'results' && room && (
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-3">
            <Trophy className="w-8 h-8" />
          </div>

          <span className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">
            1v1 Match Concluded
          </span>

          <h3 className="text-3xl font-black font-display text-white mb-2">
            {p1Score > p2Score ? `${room.hostName} Wins!` : p2Score > p1Score ? `${guestName} Wins!` : "It's a Tie!"}
          </h3>

          {/* Detailed Side-by-Side Breakdown Cards */}
          <div className="w-full grid grid-cols-2 gap-3 my-4">
            {/* Host Final Card */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center">
              <span className="text-xs text-rose-400 font-bold mb-1">{room.hostName}</span>
              <span className="text-3xl font-black font-display text-white mb-2 font-mono">
                {p1Score.toLocaleString()} <span className="text-xs text-amber-400">PTS</span>
              </span>

              <div className="w-full space-y-1.5 text-left text-[11px] pt-2 border-t border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Correct Base:</span>
                  <span className="font-bold text-white font-mono">+{p1BaseScore} PTS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-400 flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5 text-amber-400" /> Quick Bonus:
                  </span>
                  <span className="font-bold text-amber-300 font-mono">+{p1SpeedScore} PTS</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Avg Response:</span>
                  <span className="font-mono">
                    {p1Times.length > 0
                      ? `${(p1Times.reduce((a, b) => a + b, 0) / p1Times.length).toFixed(1)}s`
                      : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Challenger Final Card */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center">
              <span className="text-xs text-cyan-400 font-bold mb-1">{guestName}</span>
              <span className="text-3xl font-black font-display text-white mb-2 font-mono">
                {p2Score.toLocaleString()} <span className="text-xs text-amber-400">PTS</span>
              </span>

              <div className="w-full space-y-1.5 text-left text-[11px] pt-2 border-t border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Correct Base:</span>
                  <span className="font-bold text-white font-mono">+{p2BaseScore} PTS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-400 flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5 text-amber-400" /> Quick Bonus:
                  </span>
                  <span className="font-bold text-amber-300 font-mono">+{p2SpeedScore} PTS</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Avg Response:</span>
                  <span className="font-mono">
                    {p2Times.length > 0
                      ? `${(p2Times.reduce((a, b) => a + b, 0) / p2Times.length).toFixed(1)}s`
                      : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStage('create')}
            className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-display font-bold text-sm shadow-lg shadow-rose-500/30 hover:scale-105 transition-all"
          >
            Rematch / New Challenge
          </button>
        </div>
      )}
    </div>
  );
};
