import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Target, Crown, Play, Sparkles, Clock, Flame, Zap, Swords } from 'lucide-react';
import { Header } from './components/Header';
import { SilhouetteStage } from './components/SilhouetteStage';
import { AnswerOptions } from './components/AnswerOptions';
import { ModeSelector } from './components/ModeSelector';
import { DifficultySelector } from './components/DifficultySelector';
import { ProfileModal } from './components/ProfileModal';
import { PokeMartModal } from './components/PokeMartModal';
import { GymBadgesModal } from './components/GymBadgesModal';
import { AchievementsModal } from './components/AchievementsModal';
import { SongSelectorModal } from './components/SongSelectorModal';
import { ScoreboardModal } from './components/ScoreboardModal';
import { GameOverModal } from './components/GameOverModal';
import { TrophyRoomModal } from './components/TrophyRoomModal';
import { DailyMissionsModal } from './components/DailyMissionsModal';
import { TrophyRoadPanel } from './components/mainScreen/TrophyRoadPanel';
import { ShopPanel } from './components/mainScreen/ShopPanel';
import { BadgesPanel } from './components/mainScreen/BadgesPanel';
import { AchievementsPanel } from './components/mainScreen/AchievementsPanel';
import { AuthGate } from './components/AuthGate';

// Sub-Game Modes
import { EvolutionGame } from './components/modes/EvolutionGame';
import { CryGame } from './components/modes/CryGame';
import { MoveGame } from './components/modes/MoveGame';
import { RegionGame } from './components/modes/RegionGame';
import { TypeGame } from './components/modes/TypeGame';
import { Duel1v1Game } from './components/modes/Duel1v1Game';
import { BattlePredictorGame } from './components/modes/BattlePredictorGame';

import {
  BattleRecord,
  DifficultyMode,
  GameDifficulty,
  HighScoreRecord,
  MainGameMode,
  Pokemon,
  QuizQuestion,
  RegionId,
  RoundResult,
  TrainerAccount,
  Trophy,
} from './types/pokemon';
import { INITIAL_TROPHIES } from './data/trophies';
import { calculateScore, generateQuestion } from './utils/gameEngine';
import {
  addHighScore,
  getStoredHighScores,
} from './utils/storage';
import { getActiveAccount, saveActiveAccount, evaluateAchievements, createDefaultAccount, addBattleToHistory } from './utils/accounts';
import { sound } from './utils/audio';
import { checkAndUpdateDailyStreak } from './utils/dailyStreak';
import { recordDailyMissionEvent } from './utils/dailyMissions';
import { isBoostActive } from './utils/itemBoosts';
import { addExpToAccount } from './utils/expSystem';

export default function App() {
  // Active Account State (Supports multiple accounts, customizable avatar, achievements, level & limitless trophies)
  const [account, setAccount] = useState<TrainerAccount>(() => getActiveAccount());

  // Game Configuration State
  const [mode, setMode] = useState<MainGameMode>('classic');
  const [region, setRegion] = useState<RegionId>('all');
  const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');
  const [inputStyle, setInputStyle] = useState<DifficultyMode>('options');
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());

  // Modals State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'profile' | 'avatars' | 'friends' | 'battles'>('profile');
  const [activeDuelRoomCode, setActiveDuelRoomCode] = useState<string | null>(null);
  const [isDailyMissionsOpen, setIsDailyMissionsOpen] = useState(false);
  const [isPokeMartOpen, setIsPokeMartOpen] = useState(false);
  const [isGymBadgesOpen, setIsGymBadgesOpen] = useState(false);
  const [gymBadgesRegion, setGymBadgesRegion] = useState<string>('All');
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isTrophyModalOpen, setIsTrophyModalOpen] = useState(false);
  const [trophyModalView, setTrophyModalView] = useState<'vault' | 'trophy_road' | 'bounties'>('trophy_road');
  const [isJukeboxOpen, setIsJukeboxOpen] = useState(false);
  const [isScoreboardOpen, setIsScoreboardOpen] = useState(false);
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);

  // Score & Game Run State
  const [currentRound, setCurrentRound] = useState(1);
  const totalRounds = 10;
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [lives, setLives] = useState(3);
  const [lastPointsEarned, setLastPointsEarned] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [highScores, setHighScores] = useState<HighScoreRecord[]>(() => getStoredHighScores());

  // Question & Timer State
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [maxTime, setMaxTime] = useState(15);

  // Mode-specific start status (so silhouette & legendary arena modes require pressing Start)
  const [startedModes, setStartedModes] = useState<Record<string, boolean>>({});

  const excludeIdsRef = useRef<Set<number>>(new Set());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const blitzTimeLeftRef = useRef<number>(60);

  // Auto-play active BGM on initial user interaction
  useEffect(() => {
    sound.setBGMTrack(account.activeSongId || 'pallet_town');
  }, [account.activeSongId]);

  // Daily Streak 24h IST cycle check on session start
  useEffect(() => {
    const { updatedAccount, isNewDay } = checkAndUpdateDailyStreak(account);
    if (isNewDay) {
      saveActiveAccount(updatedAccount);
      setAccount(updatedAccount);
    }

    // Auto-route to 1v1 duel if opened via QR code or invite link (?duelRoom=XYZ)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('duelRoom')) {
      setMode('1v1');
    }
    if (urlParams.get('addFriend')) {
      setProfileInitialTab('friends');
      setIsProfileOpen(true);
    }
  }, []);

  const handleTokensEarned = (amount: number) => {
    setAccount((prev) => {
      const next = {
        ...prev,
        battleTokens: (prev.battleTokens || 0) + amount,
      };
      saveActiveAccount(next);
      return next;
    });
  };

  // Confetti helper
  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 75,
        spread: 75,
        origin: { y: 0.65 },
        colors: ['#f43f5e', '#38bdf8', '#fbbf24', '#34d399', '#a855f7'],
      });
    } catch {
      // ignore
    }
  }, []);

  // Generate / Advance Question in Silhouette Modes
  const startNewQuestion = useCallback((nextRoundNum?: number) => {
    setIsRevealed(false);
    setSelectedAnswer(null);
    setLastPointsEarned(0);

    const nextQ = generateQuestion(region, excludeIdsRef.current, difficulty, mode);
    if (!nextQ || !nextQ.pokemon) return;
    excludeIdsRef.current.add(nextQ.pokemon.id);
    setCurrentQuestion(nextQ);

    if (mode === 'blitz') {
      setTimeLeft(blitzTimeLeftRef.current);
      setMaxTime(60);
    } else if (mode === 'survival') {
      setTimeLeft(12);
      setMaxTime(12);
    } else if (mode === 'zen') {
      setTimeLeft(0);
      setMaxTime(0);
    } else {
      setTimeLeft(15);
      setMaxTime(15);
    }

    if (nextRoundNum !== undefined) {
      setCurrentRound(nextRoundNum);
    }
  }, [region, difficulty, mode]);

  // Reset Run
  const handleResetGame = useCallback(() => {
    excludeIdsRef.current.clear();
    setScore(0);
    setStreak(0);
    setLongestStreak(0);
    setMultiplier(1);
    setLives(3);
    setResults([]);
    setCurrentRound(1);
    setIsGameOverOpen(false);

    if (mode === 'blitz') {
      blitzTimeLeftRef.current = 60;
    }

    startNewQuestion(1);
  }, [mode, startNewQuestion]);

  // Game Over Handler
  const handleGameOver = useCallback((finalResults: RoundResult[], finalScore: number, finalStreak: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRevealed(true);

    const correctCount = finalResults.filter((r) => r.isCorrect).length;

    // Check active boosts
    const isDoubleTrophies = isBoostActive('double_trophies');
    const isDoubleExp = isBoostActive('double_exp');
    const isDoubleTokens = isBoostActive('double_tokens');

    // Award career points & check achievements
    const { updatedAccount, newUnlocks } = evaluateAchievements(account, {
      isCorrect: correctCount > 0,
      streak: finalStreak,
      gameMode: mode,
      pointsScored: finalScore,
    });

    const roundTrophies = Math.round(finalScore / 10) * (isDoubleTrophies ? 2 : 1);
    const roundExp = (correctCount * 15 + Math.round(finalScore / 25)) * (isDoubleExp ? 2 : 1);
    const roundTokens = (finalScore > 0 ? Math.round(finalScore / 20) : 0) * (isDoubleTokens ? 2 : 1);

    updatedAccount.totalGames += 1;
    if (correctCount >= 7) updatedAccount.totalWins += 1;
    updatedAccount.totalScore += finalScore;
    updatedAccount.trophyPoints += roundTrophies;
    updatedAccount.battleTokens = (updatedAccount.battleTokens || 0) + roundTokens;

    // Level progression strictly based on EXP
    const expResult = addExpToAccount(updatedAccount, roundExp);
    if (expResult.leveledUp) {
      sound.playTrophyUnlock();
      triggerConfetti();
    }

    if (finalScore > 0) {
      if (!updatedAccount.highScores) updatedAccount.highScores = {};
      if (!updatedAccount.highScores[mode] || finalScore > updatedAccount.highScores[mode]) {
        updatedAccount.highScores[mode] = finalScore;
      }
      const accuracyPct = finalResults.length > 0 ? Math.round((correctCount / finalResults.length) * 100) : 0;
      const updatedHS = addHighScore({
        playerName: updatedAccount.displayName || updatedAccount.username || 'Trainer',
        score: finalScore,
        accuracy: accuracyPct,
        streak: finalStreak,
        mode,
        region,
      });
      setHighScores(updatedHS);
    }

    saveActiveAccount(updatedAccount);
    setAccount({ ...updatedAccount });

    if (newUnlocks.length > 0) {
      sound.playTrophyUnlock();
      triggerConfetti();
    } else {
      sound.playLevelUpSound();
    }

    setIsGameOverOpen(true);
  }, [account, mode, triggerConfetti]);

  // Answer Selected in Silhouette Stage
  const handleSelectAnswer = useCallback((selectedOpt: Pokemon) => {
    if (!currentQuestion || !currentQuestion.pokemon || !selectedOpt || isRevealed) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const isCorrect = selectedOpt.id === currentQuestion.pokemon.id;
    setSelectedAnswer(selectedOpt.name);
    setIsRevealed(true);

    if (isCorrect) {
      sound.playCorrect();
      sound.playReveal();
    } else {
      sound.playWrong();
      sound.playReveal();
    }

    let points = 0;
    let newStreak = streak;
    let newMultiplier = multiplier;
    let newLives = lives;

    // Check active buffs
    const isDoubleTrophies = isBoostActive('double_trophies');
    const isDoubleExp = isBoostActive('double_exp');
    const isDoubleTokens = isBoostActive('double_tokens');
    const hasMegaScore = isBoostActive('mega_score');
    const hasStreakShield = isBoostActive('streak_shield');

    if (isCorrect) {
      newStreak = streak + 1;
      const scoreCalc = calculateScore(timeLeft, maxTime, newStreak, mode);
      // Hard mode bonus multiplier & Mega Score buff
      const difficultyBonus = difficulty === 'hard' ? 1.5 : difficulty === 'medium' ? 1.25 : 1.0;
      const megaMultiplier = hasMegaScore ? 1.5 : 1.0;
      points = Math.round(scoreCalc.points * difficultyBonus * megaMultiplier);
      newMultiplier = scoreCalc.multiplier;

      setStreak(newStreak);
      setLongestStreak((prev) => Math.max(prev, newStreak));
      setMultiplier(newMultiplier);
      setScore((prev) => prev + points);
      setLastPointsEarned(points);

      if (newStreak % 5 === 0) {
        sound.playStreakBonus();
        triggerConfetti();
      }

      if (mode === 'blitz') {
        blitzTimeLeftRef.current = Math.min(60, blitzTimeLeftRef.current + 3);
        setTimeLeft(blitzTimeLeftRef.current);
      }
    } else {
      if (hasStreakShield && streak > 0) {
        // Streak Shield buff preserves the streak!
        newStreak = streak;
        newMultiplier = multiplier;
        setStreak(streak);
      } else {
        newStreak = 0;
        newMultiplier = 1;
        setStreak(0);
        setMultiplier(1);
      }
      setLastPointsEarned(0);

      if (mode === 'survival') {
        newLives = lives - 1;
        setLives(newLives);
      } else if (mode === 'blitz') {
        blitzTimeLeftRef.current = Math.max(0, blitzTimeLeftRef.current - 2);
        setTimeLeft(blitzTimeLeftRef.current);
      }
    }

    const roundResult: RoundResult = {
      questionIndex: currentRound,
      pokemon: currentQuestion.pokemon,
      userAnswer: selectedOpt.displayName,
      isCorrect,
      timeSpent: maxTime - timeLeft,
      pointsEarned: points,
      streakBonus: newMultiplier,
    };
    const updatedResults = [...results, roundResult];
    setResults(updatedResults);

    // Update account stats & check achievements
    const { updatedAccount, newUnlocks } = evaluateAchievements(account, {
      isCorrect,
      streak: newStreak,
      timeRemaining: timeLeft,
      gameMode: mode,
      pokemonTypes: currentQuestion.pokemon.types,
      difficulty,
      pointsScored: points,
    });

    if (isCorrect) {
      updatedAccount.totalCorrect += 1;
      const questionTrophies = Math.round(points / 10) * (isDoubleTrophies ? 2 : 1);
      const questionExp = 25 * (isDoubleExp ? 2 : 1);
      const questionTokens = 5 * (isDoubleTokens ? 2 : 1);

      updatedAccount.trophyPoints += questionTrophies;
      updatedAccount.battleTokens = (updatedAccount.battleTokens || 0) + questionTokens;

      // EXP leveling integration
      const expRes = addExpToAccount(updatedAccount, questionExp);
      if (expRes.leveledUp) {
        sound.playTrophyUnlock();
        triggerConfetti();
      }
    }
    updatedAccount.totalGuesses += 1;
    const withMissions = recordDailyMissionEvent(updatedAccount, {
      gamePlayed: true,
      isCorrect,
      pokemonTypes: currentQuestion.pokemon.types,
      timeRemaining: timeLeft,
      streak: newStreak,
      scoreEarned: points,
    });
    saveActiveAccount(withMissions);
    setAccount({ ...withMissions });

    if (newUnlocks.length > 0) {
      sound.playTrophyUnlock();
      triggerConfetti();
    }

    if (mode === 'survival' && newLives <= 0) {
      setTimeout(() => {
        handleGameOver(updatedResults, score + points, Math.max(longestStreak, newStreak));
      }, 1200);
    } else if (mode === 'classic' && currentRound >= totalRounds) {
      setTimeout(() => {
        handleGameOver(updatedResults, score + points, Math.max(longestStreak, newStreak));
      }, 1200);
    }
  }, [
    currentQuestion,
    isRevealed,
    streak,
    multiplier,
    lives,
    timeLeft,
    maxTime,
    mode,
    difficulty,
    currentRound,
    totalRounds,
    results,
    score,
    longestStreak,
    account,
    handleGameOver,
    triggerConfetti,
  ]);

  // Handle Time-out
  const handleTimeOut = useCallback(() => {
    if (!currentQuestion || isRevealed) return;

    sound.playWrong();
    sound.playReveal();
    setIsRevealed(true);
    setSelectedAnswer(null);
    setStreak(0);
    setMultiplier(1);
    setLastPointsEarned(0);

    let newLives = lives;
    if (mode === 'survival') {
      newLives = lives - 1;
      setLives(newLives);
    }

    const roundResult: RoundResult = {
      questionIndex: currentRound,
      pokemon: currentQuestion.pokemon,
      userAnswer: 'Timed Out',
      isCorrect: false,
      timeSpent: maxTime,
      pointsEarned: 0,
      streakBonus: 1,
    };
    const updatedResults = [...results, roundResult];
    setResults(updatedResults);

    if (mode === 'survival' && newLives <= 0) {
      setTimeout(() => {
        handleGameOver(updatedResults, score, longestStreak);
      }, 1200);
    } else if (mode === 'blitz' && blitzTimeLeftRef.current <= 0) {
      setTimeout(() => {
        handleGameOver(updatedResults, score, longestStreak);
      }, 1000);
    } else if (mode === 'classic' && currentRound >= totalRounds) {
      setTimeout(() => {
        handleGameOver(updatedResults, score, longestStreak);
      }, 1200);
    }
  }, [
    currentQuestion,
    isRevealed,
    lives,
    mode,
    currentRound,
    maxTime,
    results,
    score,
    longestStreak,
    totalRounds,
    handleGameOver,
  ]);

  // Mode-specific Start Handlers
  const handleStartMode = useCallback((targetMode: MainGameMode) => {
    sound.playButtonPress();
    sound.playStreakBonus();
    setStartedModes((prev) => ({ ...prev, [targetMode]: true }));
    if (targetMode === 'classic' || targetMode === 'legendary' || targetMode === 'blitz') {
      handleResetGame();
    }
  }, [handleResetGame]);

  // Mode Change Handler: always reset started states so silhouette & legendary require pressing Start when returned to
  const handleModeChange = useCallback((newMode: MainGameMode) => {
    if (newMode === mode) return;
    sound.playButtonPress();
    if (timerRef.current) clearInterval(timerRef.current);
    // Clear all mode start states
    setStartedModes({});
    // Reset question state if switching to silhouette, legendary, or blitz so it starts fresh upon pressing Start
    if (newMode === 'classic' || newMode === 'legendary' || newMode === 'blitz') {
      setCurrentQuestion(null);
      setIsRevealed(false);
      setSelectedAnswer(null);
    }
    setMode(newMode);
  }, [mode]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('poke_quiz_active_account_id_v2');
    const guest = createDefaultAccount('Trainer');
    guest.email = '';
    setAccount(guest);
    setIsProfileOpen(false);
  }, []);

  // Whenever mode changes, guarantee started modes are cleared and timer is stopped
  useEffect(() => {
    setStartedModes({});
    if (timerRef.current) clearInterval(timerRef.current);
    if (mode === 'classic' || mode === 'legendary' || mode === 'blitz') {
      setCurrentQuestion(null);
      setIsRevealed(false);
      setSelectedAnswer(null);
    } else if (mode === 'survival' || mode === 'zen') {
      handleResetGame();
    }
  }, [mode, handleResetGame]);

  // Timer Tick Engine
  useEffect(() => {
    const isSilhouetteMode = mode === 'classic' || mode === 'legendary' || mode === 'survival' || mode === 'blitz';
    const isModeStarted = (mode === 'classic' || mode === 'legendary' || mode === 'blitz') ? Boolean(startedModes[mode]) : true;
    if (!isSilhouetteMode || isRevealed || !isModeStarted) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      if (mode === 'blitz') {
        blitzTimeLeftRef.current -= 0.1;
        if (blitzTimeLeftRef.current <= 0) {
          blitzTimeLeftRef.current = 0;
          setTimeLeft(0);
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeOut();
          return;
        }
        setTimeLeft(blitzTimeLeftRef.current);
      } else {
        setTimeLeft((prev) => {
          const next = Math.max(0, prev - 0.1);
          if (next <= 4 && next > 0) {
            const wholeSec = Math.floor(next * 10);
            if (wholeSec % 10 === 0) {
              sound.playTick(next <= 2);
            }
          }
          if (next <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            setTimeout(() => {
              handleTimeOut();
            }, 0);
            return 0;
          }
          return next;
        });
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRevealed, mode, handleTimeOut, startedModes]);

  // Re-initialize question when region or difficulty changes during an active game
  useEffect(() => {
    const isSilhouetteMode = mode === 'classic' || mode === 'legendary' || mode === 'survival' || mode === 'blitz' || mode === 'zen';
    if (isSilhouetteMode) {
      const isRequiresStart = mode === 'classic' || mode === 'legendary' || mode === 'blitz';
      if (!isRequiresStart || startedModes[mode]) {
        handleResetGame();
      }
    }
  }, [region, difficulty]);

  // Next Question Handlers (Classic silhouette mode has unlimited rounds)
  const handleNextQuestion = () => {
    if (mode === 'survival' && lives <= 0) {
      handleGameOver(results, score, longestStreak);
      return;
    }
    if (mode === 'blitz' && blitzTimeLeftRef.current <= 0) {
      handleGameOver(results, score, longestStreak);
      return;
    }
    startNewQuestion(currentRound + 1);
  };

  // Hint Revealer
  const handleRevealHint = (hintKey: 'region' | 'category' | 'initialLetter') => {
    if (!currentQuestion) return;
    setCurrentQuestion({
      ...currentQuestion,
      revealedHints: {
        ...currentQuestion.revealedHints,
        [hintKey]: true,
      },
    });
    setScore((prev) => Math.max(0, prev - (hintKey === 'initialLetter' ? 30 : 20)));
  };

  // Sound Toggle Handler
  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Sub-game mode points handler
  const handleSubGameScore = (points: number, isPerfect: boolean = true) => {
    setScore((prev) => prev + points);
    setAccount((prevAccount) => {
      const updated = { ...prevAccount };
      const isDoubleTrophies = isBoostActive('double_trophies');
      const isDoubleExp = isBoostActive('double_exp');
      const isDoubleTokens = isBoostActive('double_tokens');

      const earnedTrophies = Math.round(points / 10) * (isDoubleTrophies ? 2 : 1);
      const earnedTokens = 10 * (isDoubleTokens ? 2 : 1);
      const earnedExp = 30 * (isDoubleExp ? 2 : 1);

      updated.trophyPoints += earnedTrophies;
      updated.battleTokens = (updated.battleTokens || 0) + earnedTokens;
      updated.totalScore += points;
      if (isPerfect) updated.totalCorrect += 1;

      const expRes = addExpToAccount(updated, earnedExp);
      if (expRes.leveledUp) {
        sound.playTrophyUnlock();
        triggerConfetti();
      }

      const withMissions = recordDailyMissionEvent(updated, {
        gamePlayed: true,
        isCorrect: isPerfect,
        scoreEarned: points,
      });

      saveActiveAccount(withMissions);
      return withMissions;
    });
  };

  // Battle Finished Handler (1v1 PvP, Records FIFO 25 battles & Daily Missions)
  const handleBattleFinished = useCallback((battle: Omit<BattleRecord, 'id' | 'timestamp'>) => {
    setAccount((prev) => {
      const { updatedAccount, newUnlocks } = addBattleToHistory(prev, battle);
      const withMissions = recordDailyMissionEvent(updatedAccount, {
        battleCompleted: true,
        scoreEarned: battle.playerScore,
      });
      saveActiveAccount(withMissions);
      if (newUnlocks && newUnlocks.length > 0) {
        sound.playTrophyUnlock();
        triggerConfetti();
      }
      return withMissions;
    });
  }, []);

  // Change BGM Track
  const handleSelectSong = (songId: string) => {
    const updated = { ...account, activeSongId: songId };
    saveActiveAccount(updated);
    setAccount(updated);
    sound.setBGMTrack(songId);
  };

  // Save High Score
  const handleSaveScore = (playerName: string) => {
    const accuracy = results.length > 0 ? Math.round((results.filter((r) => r.isCorrect).length / results.length) * 100) : 0;
    const updated = addHighScore({
      playerName,
      score,
      accuracy,
      streak: longestStreak,
      mode,
      region,
    });
    setHighScores(updated);
  };

  const isSilhouetteMode = mode === 'classic' || mode === 'legendary' || mode === 'survival' || mode === 'blitz' || mode === 'zen';

  // If not logged in with an email account, require login / sign up
  if (!account.email) {
    return <AuthGate onAuthenticated={(acc) => setAccount(acc)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center selection:bg-rose-500 selection:text-white">
      {/* App Header with customizable Profile card, BGM jukebox, Limitless Trophies */}
      <Header
        score={score}
        streak={streak}
        multiplier={multiplier}
        mode={mode}
        region={region}
        account={account}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenProfile={() => {
          setProfileInitialTab('profile');
          setIsProfileOpen(true);
        }}
        onOpenTrophyRoad={() => {
          setTrophyModalView('trophy_road');
          setIsTrophyModalOpen(true);
        }}
        onOpenShop={() => {
          setIsPokeMartOpen(true);
        }}
        onOpenDailyMissions={() => {
          setIsDailyMissionsOpen(true);
        }}
        onOpenJukebox={() => setIsJukeboxOpen(true)}
        onOpenScoreboard={() => setIsScoreboardOpen(true)}
        onChangeMode={handleModeChange}
        onChangeRegion={setRegion}
      />

      {/* Main Container */}
      <main className="w-full max-w-7xl px-3 sm:px-6 py-4 flex-1 flex flex-col items-center justify-between">
        {/* Mode Selector */}
        <ModeSelector
          mode={mode}
          region={region}
          onChangeMode={handleModeChange}
          onChangeRegion={(newReg) => {
            setRegion(newReg);
          }}
          roundInfo={{ current: currentRound, total: mode === 'classic' ? undefined : totalRounds }}
        />

        {/* Difficulty Selector (Easy, Medium: Half-Body, Hard: Body Part & Hisuian/Galarian/Paldean) */}
        {isSilhouetteMode && (
          <DifficultySelector
            difficulty={difficulty}
            onChangeDifficulty={setDifficulty}
          />
        )}

        {/* 1. SILHOUETTE, LEGENDARY ARENA & BLITZ MODES */}
        {isSilhouetteMode && (
          (mode === 'classic' || mode === 'legendary' || mode === 'blitz') && !startedModes[mode] ? (
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start my-auto py-4">
              {/* Left Column: Trophy Road & Shop (Poké Mart) */}
              <div className="lg:col-span-3 flex flex-col gap-4 order-2 lg:order-1 w-full">
                <TrophyRoadPanel
                  account={account}
                  onOpenTrophyRoad={() => {
                    setTrophyModalView('trophy_road');
                    setIsTrophyModalOpen(true);
                  }}
                />
                <ShopPanel
                  account={account}
                  onAccountUpdated={(acc) => setAccount({ ...acc })}
                  onOpenFullShop={() => {
                    setIsPokeMartOpen(true);
                  }}
                />
              </div>

              {/* Center Column: Start Game Arena */}
              <div className="lg:col-span-6 flex flex-col items-center order-1 lg:order-2 w-full">
                <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
                  {/* Glow backdrop */}
                  <div
                    className={`absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl pointer-events-none ${
                      mode === 'legendary' ? 'bg-amber-500/10' : mode === 'blitz' ? 'bg-yellow-500/15' : 'bg-rose-500/10'
                    }`}
                  />
                  <div
                    className={`absolute -bottom-24 -left-24 w-60 h-60 rounded-full blur-3xl pointer-events-none ${
                      mode === 'legendary' ? 'bg-purple-500/10' : mode === 'blitz' ? 'bg-orange-500/15' : 'bg-cyan-500/10'
                    }`}
                  />

                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-xl relative z-10 ${
                      mode === 'legendary'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-amber-950/60'
                        : mode === 'blitz'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 shadow-yellow-950/60'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-rose-950/60'
                    }`}
                  >
                    {mode === 'legendary' ? (
                      <Crown className="w-8 h-8" />
                    ) : mode === 'blitz' ? (
                      <Zap className="w-8 h-8 fill-yellow-400" />
                    ) : (
                      <Target className="w-8 h-8" />
                    )}
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 relative z-10 ${
                      mode === 'legendary'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : mode === 'blitz'
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {mode === 'legendary'
                      ? 'Rare Encounters • 2x Trophy Boost'
                      : mode === 'blitz'
                      ? '60-Second Challenge • Non-Stop Clock'
                      : 'Unlimited Rounds • Endless Streak'}
                  </span>

                  <h3 className="text-2xl sm:text-3xl font-black font-display text-white mb-2 relative z-10">
                    {mode === 'legendary'
                      ? 'Legendary & Mythical Arena'
                      : mode === 'blitz'
                      ? 'Blitz Speed Run (60s)'
                      : "Who's That Pokémon?"}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-6 leading-relaxed relative z-10">
                    {mode === 'legendary'
                      ? 'Face off exclusively against Legendary, Mythical, and Ultra Beast Pokémon from across all 9 generations. Test your knowledge against the rarest silhouettes in the franchise!'
                      : mode === 'blitz'
                      ? 'Can you identify Pokémon at hyper-speed? You have 60 continuous seconds to answer as many Pokémon as possible without stopping. Speed and accuracy build record high scores!'
                      : 'Can you recognize Pokémon exclusively from their mystery shadow? Answer before the 15-second timer runs out to build multiplier streaks and earn limitless trophies!'}
                  </p>

                  {/* Feature Chips */}
                  <div className="grid grid-cols-3 gap-2 w-full max-w-sm mb-6 relative z-10">
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                      <Clock className="w-4 h-4 mx-auto text-amber-400 mb-1" />
                      <span className="text-[11px] font-bold text-slate-300 block">
                        {mode === 'blitz' ? '60 Seconds' : '15 Seconds'}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {mode === 'blitz' ? 'Total Clock' : 'Per Shadow'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                      <Flame className="w-4 h-4 mx-auto text-rose-400 mb-1" />
                      <span className="text-[11px] font-bold text-slate-300 block">Streak Multiplier</span>
                      <span className="text-[9px] text-slate-500">Up to 3.0x</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                      <Sparkles className="w-4 h-4 mx-auto text-cyan-400 mb-1" />
                      <span className="text-[11px] font-bold text-slate-300 block">
                        {mode === 'legendary' ? 'Legendary Only' : 'Gen 1 - 9'}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {mode === 'legendary' ? 'Rare Titans' : mode === 'blitz' ? 'Rapid Fire Queue' : '+ Regional Forms'}
                      </span>
                    </div>
                  </div>

                  <button
                    id={mode === 'legendary' ? 'btn-start-legendary-game' : mode === 'blitz' ? 'btn-start-blitz-game' : 'btn-start-silhouette-game'}
                    type="button"
                    onClick={() => handleStartMode(mode)}
                    className={`py-3.5 px-8 rounded-2xl text-white font-display font-black text-sm uppercase tracking-wider shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2.5 cursor-pointer relative z-10 ${
                      mode === 'legendary'
                        ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-amber-950/60'
                        : mode === 'blitz'
                        ? 'bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 shadow-yellow-950/60'
                        : 'bg-gradient-to-r from-rose-500 via-red-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 shadow-rose-950/60'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>
                      {mode === 'legendary'
                        ? 'Enter Legendary Arena'
                        : mode === 'blitz'
                        ? 'Start 60s Blitz Run'
                        : 'Start Silhouette Challenge'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Right Column: Gym Badges & Achievements */}
              <div className="lg:col-span-3 flex flex-col gap-4 order-3 w-full">
                <BadgesPanel
                  account={account}
                  onOpenBadgesModal={(reg) => {
                    setGymBadgesRegion(reg || 'All');
                    setIsGymBadgesOpen(true);
                  }}
                />
                <AchievementsPanel
                  account={account}
                  onOpenAchievementsModal={() => {
                    setIsAchievementsOpen(true);
                  }}
                />
              </div>
            </div>
          ) : (
            currentQuestion && (
              <div className="w-full flex flex-col items-center my-auto">
                {(mode === 'classic' || mode === 'legendary' || mode === 'blitz') && (
                  <div className="w-full max-w-xl flex items-center justify-between px-2 mb-2">
                    <button
                      id="btn-return-to-start-screen"
                      type="button"
                      onClick={() => {
                        sound.playButtonPress();
                        if (timerRef.current) clearInterval(timerRef.current);
                        setStartedModes((prev) => ({ ...prev, [mode]: false }));
                      }}
                      className="text-xs text-slate-400 hover:text-rose-400 font-semibold flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 cursor-pointer"
                    >
                      ← Exit to Start Screen
                    </button>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {mode === 'legendary'
                        ? 'Legendary & Mythical Arena'
                        : mode === 'blitz'
                        ? 'Blitz Speed Run (60s)'
                        : 'Silhouette Challenge'}
                    </span>
                  </div>
                )}

                <SilhouetteStage
                  pokemon={currentQuestion.pokemon}
                  isRevealed={isRevealed}
                  timeLeft={timeLeft}
                  maxTime={maxTime}
                  mode={mode}
                  difficulty={difficulty}
                  shadowCrop={currentQuestion.shadowCrop}
                  lives={lives}
                  revealedHints={currentQuestion.revealedHints}
                  onRevealHint={handleRevealHint}
                  lastPointsEarned={lastPointsEarned}
                  lastMultiplier={multiplier}
                />

                <AnswerOptions
                  options={currentQuestion.options}
                  correctPokemon={currentQuestion.pokemon}
                  selectedAnswer={selectedAnswer}
                  isRevealed={isRevealed}
                  onSelectAnswer={handleSelectAnswer}
                  onNextQuestion={handleNextQuestion}
                  difficultyMode={inputStyle}
                  difficulty={difficulty}
                  onToggleDifficulty={() => {
                    sound.playButtonPress();
                    setInputStyle((prev) => (prev === 'options' ? 'master' : 'options'));
                  }}
                />
              </div>
            )
          )
        )}

        {/* 2. EVOLUTION LINE ORGANIZER */}
        {mode === 'evolution' && (
          <div className="w-full my-auto py-2">
            <EvolutionGame
              difficulty={difficulty}
              onScoreEarned={handleSubGameScore}
              onAdvanceMilestone={() => {
                setAccount((prevAccount) => {
                  const { updatedAccount, newUnlocks } = evaluateAchievements(prevAccount, { evolutionOrganized: true });
                  saveActiveAccount(updatedAccount);
                  if (newUnlocks.length > 0) {
                    sound.playTrophyUnlock();
                    triggerConfetti();
                  }
                  return updatedAccount;
                });
              }}
            />
          </div>
        )}

        {/* 3. POKÉMON CRY & SOUND GUESSER */}
        {mode === 'cry' && (
          <div className="w-full my-auto py-2">
            <CryGame
              onScoreEarned={(pts, isCorrect, timeRem) => {
                handleSubGameScore(pts, isCorrect);
                if (isCorrect) {
                  setAccount((prevAccount) => {
                    const { updatedAccount, newUnlocks } = evaluateAchievements(prevAccount, { cryGuessed: true, timeRemaining: timeRem });
                    saveActiveAccount(updatedAccount);
                    if (newUnlocks.length > 0) {
                      sound.playTrophyUnlock();
                      triggerConfetti();
                    }
                    return updatedAccount;
                  });
                }
              }}
              onAdvanceMilestone={() => {}}
            />
          </div>
        )}

        {/* 4. ATTACK MOVES ARSENAL GUESSER (1 -> 2 -> 3 Attacks) */}
        {mode === 'moves' && (
          <div className="w-full my-auto py-2">
            <MoveGame
              onScoreEarned={(pts, isCorrect) => {
                handleSubGameScore(pts, isCorrect);
                if (isCorrect) {
                  setAccount((prevAccount) => {
                    const { updatedAccount, newUnlocks } = evaluateAchievements(prevAccount, { moveGuessed: true });
                    saveActiveAccount(updatedAccount);
                    if (newUnlocks.length > 0) {
                      sound.playTrophyUnlock();
                      triggerConfetti();
                    }
                    return updatedAccount;
                  });
                }
              }}
              onAdvanceMilestone={() => {}}
            />
          </div>
        )}

        {/* 5. REGIONAL ORIGIN GUESSER */}
        {mode === 'region_guess' && (
          <div className="w-full my-auto py-2">
            <RegionGame
              onScoreEarned={handleSubGameScore}
              onAdvanceMilestone={() => {}}
            />
          </div>
        )}

        {/* 6. TYPE MASTER & VICE-VERSA */}
        {mode === 'type_guess' && (
          <div className="w-full my-auto py-2">
            <TypeGame
              onScoreEarned={handleSubGameScore}
              onAdvanceMilestone={() => {}}
            />
          </div>
        )}

        {/* 7. 1V1 BATTLE ARENA WITH SCANNABLE QR CODE */}
        {mode === '1v1' && (
          <div className="w-full my-auto py-2">
            <Duel1v1Game
              currentTrainerName={account.displayName}
              initialRoomCode={activeDuelRoomCode || new URLSearchParams(window.location.search).get('duelRoom')}
              onTokensEarned={handleTokensEarned}
              onScoreEarned={(pts) => {
                handleSubGameScore(pts, true);
                setAccount((prevAccount) => {
                  const { updatedAccount, newUnlocks } = evaluateAchievements(prevAccount, { is1v1Win: true, pointsScored: pts });
                  saveActiveAccount(updatedAccount);
                  if (newUnlocks.length > 0) {
                    sound.playTrophyUnlock();
                    triggerConfetti();
                  }
                  return updatedAccount;
                });
              }}
              onBattleFinished={handleBattleFinished}
              onAdvanceMilestone={() => {}}
            />
          </div>
        )}

        {/* 8. BATTLE PREDICTOR (WHO WILL WIN?) */}
        {mode === 'battle' && (
          !startedModes['battle'] ? (
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start my-auto py-4">
              {/* Left Column: Trophy Road & Shop (Poké Mart) */}
              <div className="lg:col-span-3 flex flex-col gap-4 order-2 lg:order-1 w-full">
                <TrophyRoadPanel
                  account={account}
                  onOpenTrophyRoad={() => {
                    setTrophyModalView('trophy_road');
                    setIsTrophyModalOpen(true);
                  }}
                />
                <ShopPanel
                  account={account}
                  onAccountUpdated={(acc) => setAccount({ ...acc })}
                  onOpenFullShop={() => {
                    setIsPokeMartOpen(true);
                  }}
                />
              </div>

              {/* Center Column: Start Game Arena */}
              <div className="lg:col-span-6 flex flex-col items-center order-1 lg:order-2 w-full">
                <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
                  {/* Glow backdrop */}
                  <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl pointer-events-none bg-red-500/15" />
                  <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full blur-3xl pointer-events-none bg-amber-500/15" />

                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-xl relative z-10 bg-gradient-to-br from-red-500/20 to-amber-500/20 text-red-400 border border-red-500/40 shadow-red-950/60">
                    <Swords className="w-8 h-8" />
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 relative z-10 bg-red-500/20 text-red-300 border border-red-500/30">
                    1v1 Matchup Duel • Type Advantage Engine
                  </span>

                  <h3 className="text-2xl sm:text-3xl font-black font-display text-white mb-2 relative z-10">
                    Predict Winner: Who Will Win?
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-6 leading-relaxed relative z-10">
                    Two Pokémon clash in an authentic battle simulation! Analyze base stats, typing matchups, STAB moves, and speed tiers to predict which Pokémon emerges victorious before time runs out.
                  </p>

                  {/* Feature Chips */}
                  <div className="grid grid-cols-3 gap-2 w-full max-w-sm mb-6 relative z-10">
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                      <Clock className="w-4 h-4 mx-auto text-amber-400 mb-1" />
                      <span className="text-[11px] font-bold text-slate-300 block">
                        20 Seconds
                      </span>
                      <span className="text-[9px] text-slate-500">Decision Clock</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                      <Flame className="w-4 h-4 mx-auto text-rose-400 mb-1" />
                      <span className="text-[11px] font-bold text-slate-300 block">Win Streak</span>
                      <span className="text-[9px] text-slate-500">+ Speed Bonus</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                      <Swords className="w-4 h-4 mx-auto text-cyan-400 mb-1" />
                      <span className="text-[11px] font-bold text-slate-300 block">Battle Stats</span>
                      <span className="text-[9px] text-slate-500">Type Multipliers</span>
                    </div>
                  </div>

                  <button
                    id="btn-start-battle-game"
                    type="button"
                    onClick={() => handleStartMode('battle')}
                    className="py-3.5 px-8 rounded-2xl text-white font-display font-black text-sm uppercase tracking-wider shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2.5 cursor-pointer relative z-10 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 shadow-red-950/60"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Start Predict Winner Match</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Gym Badges & Achievements */}
              <div className="lg:col-span-3 flex flex-col gap-4 order-3 w-full">
                <BadgesPanel
                  account={account}
                  onOpenBadgesModal={(reg) => {
                    setGymBadgesRegion(reg || 'All');
                    setIsGymBadgesOpen(true);
                  }}
                />
                <AchievementsPanel
                  account={account}
                  onOpenAchievementsModal={() => {
                    setIsAchievementsOpen(true);
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="w-full my-auto py-2 flex flex-col items-center">
              <div className="w-full max-w-4xl flex items-center justify-between px-2 mb-2">
                <button
                  id="btn-return-to-battle-start"
                  type="button"
                  onClick={() => {
                    sound.playButtonPress();
                    setStartedModes((prev) => ({ ...prev, battle: false }));
                  }}
                  className="text-xs text-slate-400 hover:text-red-400 font-semibold flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 cursor-pointer"
                >
                  ← Exit to Start Screen
                </button>
                <span className="text-[11px] text-slate-500 font-mono">
                  Predict Winner • Battle Simulator
                </span>
              </div>
              <BattlePredictorGame
                onScoreEarned={handleSubGameScore}
                onAdvanceMilestone={() => {
                  setAccount((prevAccount) => {
                    const { updatedAccount, newUnlocks } = evaluateAchievements(prevAccount, { is1v1Win: true });
                    saveActiveAccount(updatedAccount);
                    if (newUnlocks.length > 0) {
                      sound.playTrophyUnlock();
                      triggerConfetti();
                    }
                    return updatedAccount;
                  });
                }}
              />
            </div>
          )
        )}

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-slate-500 flex flex-wrap items-center justify-center gap-3">
          <span>All 9 Generations (Kanto to Paldea)</span>
          <span>•</span>
          <span>Hisuian, Galarian & Paldean Forms Active</span>
          <span>•</span>
          <span>Authentic Synthesized BGM & Audio</span>
        </footer>
      </main>

      {/* 100 Lakh Trophy Road, Vault & Training Bounties Modal */}
      <TrophyRoomModal
        isOpen={isTrophyModalOpen}
        onClose={() => setIsTrophyModalOpen(false)}
        trophies={INITIAL_TROPHIES.map((t) => {
          const userRecord = account.trophies?.[t.id];
          return {
            ...t,
            unlocked: userRecord?.unlocked ?? t.unlocked,
            progress: userRecord?.progress ?? t.progress,
            unlockedAt: userRecord?.unlockedAt,
          };
        })}
        initialView={trophyModalView}
        currentTrophyPoints={account.trophyPoints}
      />

      {/* Independent Poké Mart Modal */}
      <PokeMartModal
        isOpen={isPokeMartOpen}
        onClose={() => setIsPokeMartOpen(false)}
        account={account}
        onAccountUpdated={(acc) => setAccount({ ...acc })}
      />

      {/* Daily Missions Modal (Resets every 24h IST) */}
      <DailyMissionsModal
        isOpen={isDailyMissionsOpen}
        onClose={() => setIsDailyMissionsOpen(false)}
        account={account}
        onAccountUpdated={(acc) => setAccount({ ...acc })}
      />

      {/* Independent Gym Badges Modal */}
      <GymBadgesModal
        isOpen={isGymBadgesOpen}
        onClose={() => setIsGymBadgesOpen(false)}
        account={account}
        initialRegion={gymBadgesRegion}
      />

      {/* Independent Achievements Modal */}
      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
        account={account}
        onAccountUpdated={(acc) => setAccount({ ...acc })}
      />

      {/* Trainer Profile, Accounts & Trainer Avatars Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        account={account}
        onAccountUpdated={(acc) => setAccount({ ...acc })}
        onLogout={handleLogout}
        initialTab={profileInitialTab}
        onOpenShop={() => {
          setIsProfileOpen(false);
          setIsPokeMartOpen(true);
        }}
        onOpenBadges={(reg) => {
          setGymBadgesRegion(reg || 'All');
          setIsProfileOpen(false);
          setIsGymBadgesOpen(true);
        }}
        onOpenAchievements={() => {
          setIsProfileOpen(false);
          setIsAchievementsOpen(true);
        }}
        onStartDuelWithFriend={(friendName, roomCode) => {
          setIsProfileOpen(false);
          setActiveDuelRoomCode(roomCode || null);
          setMode('1v1');
        }}
      />

      {/* Chiptune Jukebox & BGM Track Selector Modal */}
      <SongSelectorModal
        isOpen={isJukeboxOpen}
        onClose={() => setIsJukeboxOpen(false)}
        unlockedSongIds={account.unlockedSongIds}
        activeSongId={account.activeSongId}
        onSelectSong={handleSelectSong}
      />

      {/* Scoreboard & Leaderboards Modal */}
      <ScoreboardModal
        isOpen={isScoreboardOpen}
        onClose={() => setIsScoreboardOpen(false)}
        highScores={highScores}
        account={account}
      />

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={isGameOverOpen}
        score={score}
        mode={mode}
        results={results}
        longestStreak={longestStreak}
        newTrophies={[]}
        defaultPlayerName={account.displayName || account.username || 'Trainer'}
        onPlayAgain={() => {
          setIsGameOverOpen(false);
          setStartedModes({});
          if (mode !== 'classic' && mode !== 'legendary') {
            handleResetGame();
          }
        }}
        onOpenScoreboard={() => {
          setIsGameOverOpen(false);
          setIsScoreboardOpen(true);
        }}
        onSaveScore={handleSaveScore}
      />
    </div>
  );
}
