import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  Award,
  Shield,
  Check,
  Lock,
  Sparkles,
  LogIn,
  UserPlus,
  Trophy,
  KeyRound,
  Mail,
  Database,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  LogOut,
  Send,
  Radio,
  Medal,
  Copy,
  Swords,
  Star,
  Plus,
  Trash2,
  CheckCheck,
  Coins,
  ShoppingBag,
  Info,
  Flame,
  Calendar,
  Tag,
  Package,
  Camera,
  Clock,
  Eye,
  EyeOff,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Achievement, Pokemon, ShopItem, TrainerAccount } from '../types/pokemon';
import { ACHIEVEMENTS_LIST, KANTO_BADGES } from '../data/achievements';
import { CURATED_POKEMON, OFFICIAL_ARTWORK_URL } from '../data/pokemonData';
import { ALL_REGIONAL_BADGES, GymBadgeInfo } from '../data/regionalBadges';
import { TROPHY_ROAD_REWARDS, TRAINING_BOUNTIES_REWARDS, TrophyMilestoneReward, TrainingBountyReward } from '../data/rewardsData';
import { TRAINER_AVATARS, TrainerAvatar, getAccountAvatarUrl, getAccountAvatarName, getTrainerFrameBorder, getTrainerBadgeClass } from '../data/trainerAvatars';
import { createDefaultAccount, getAllAccounts, saveActiveAccount, saveAllAccounts, setActiveAccountId, syncAccountToMongo, evaluateAchievements } from '../utils/accounts';
import { sound } from '../utils/audio';
import { isValidEmail, getEmailValidationError } from '../utils/validation';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: TrainerAccount;
  onAccountUpdated: (acc: TrainerAccount) => void;
  onLogout?: () => void;
  initialTab?: 'profile' | 'avatars' | 'battles';
  onOpenAchievements?: () => void;
  onOpenBadges?: (region?: string) => void;
  onOpenShop?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  account,
  onAccountUpdated,
  onLogout,
  initialTab = 'profile',
  onOpenAchievements,
  onOpenBadges,
  onOpenShop,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'avatars' | 'battles'>(
    initialTab === 'avatars' || initialTab === 'battles' ? initialTab : 'profile'
  );
  const [avatarFilter, setAvatarFilter] = useState<'all' | 'champions' | 'gym_leaders' | 'special'>('all');

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab === 'avatars' || initialTab === 'battles' ? initialTab : 'profile');
    }
  }, [isOpen, initialTab]);
  const [copiedUsername, setCopiedUsername] = useState(false);
  const [copiedTrainerCode, setCopiedTrainerCode] = useState(false);
  const [achFilter, setAchFilter] = useState<'all' | 'badges' | 'speed' | 'modes' | 'streak' | 'collector'>('all');

  // Edit Profile Form
  const [editName, setEditName] = useState(account.displayName);
  const [editTitle, setEditTitle] = useState(account.title);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // MongoDB Authentication & Account Management State
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [signupStep, setSignupStep] = useState<'details' | 'otp'>('details');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [previewOtp, setPreviewOtp] = useState<string | null>(null);

  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // MongoDB connection status
  const [mongoStatus, setMongoStatus] = useState<{ connected: boolean; checked: boolean; error: string | null }>({
    connected: false,
    checked: false,
    error: null,
  });

  // Logout confirmation state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Reset logout confirmation when modal closes or active tab changes
  useEffect(() => {
    if (!isOpen) {
      setShowLogoutConfirm(false);
    }
  }, [isOpen]);

  useEffect(() => {
    setShowLogoutConfirm(false);
  }, [activeTab]);

  // Check MongoDB connection status when modal opens
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setMongoStatus({
          connected: !!data.mongodbConnected,
          checked: true,
          error: data.error || null,
        });
      })
      .catch(() => {
        setMongoStatus({
          connected: false,
          checked: true,
          error: 'Could not reach server',
        });
      });
  }, [isOpen]);

  // Handle Resend OTP timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  if (!isOpen) return null;

  const allAccounts = getAllAccounts();

  // Trigger confetti effect
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
      });
    } catch {
      // ignore
    }
  };

  // Save profile changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playButtonPress();
    const updated: TrainerAccount = {
      ...account,
      displayName: editName.trim() || account.displayName,
      title: editTitle.trim() || account.title,
    };
    saveActiveAccount(updated);
    onAccountUpdated(updated);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  // Select earned avatar
  const handleEquipAvatar = (avatarId: number) => {
    if (!account.unlockedAvatars.includes(avatarId)) return;
    sound.playButtonPress();
    const updated: TrainerAccount = {
      ...account,
      avatarId,
    };
    saveActiveAccount(updated);
    onAccountUpdated(updated);
  };

  // Toggle achievement / badge showcase pin (up to 3)
  const handleToggleShowcase = (achId: string) => {
    sound.playButtonPress();
    const current = account.showcasedAchievements || [];
    let next: string[];
    if (current.includes(achId)) {
      next = current.filter((id) => id !== achId);
    } else {
      if (current.length >= 3) {
        next = [...current.slice(1), achId];
      } else {
        next = [...current, achId];
      }
    }
    const updatedAcc: TrainerAccount = {
      ...account,
      showcasedAchievements: next,
    };
    saveActiveAccount(updatedAcc);
    onAccountUpdated(updatedAcc);
  };

  // Step 1: Request Signup OTP
  const handleRequestSignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const cleanEmail = authEmail.trim().toLowerCase();
    const validationError = getEmailValidationError(cleanEmail);
    if (validationError) {
      setAuthError(validationError);
      return;
    }

    if (!authPassword || authPassword.length < 4) {
      setAuthError('Password must be at least 4 characters long.');
      return;
    }

    setIsAuthLoading(true);
    sound.playButtonPress();

    try {
      const response = await fetch('/api/auth/send-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.error || 'Failed to send OTP code.');
        setIsAuthLoading(false);
        return;
      }

      setAuthSuccess(data.message || `Verification code generated for ${cleanEmail}!`);
      if (data.previewOtp) {
        setPreviewOtp(data.previewOtp);
      }
      setSignupStep('otp');
      setResendTimer(30);
      sound.playCorrect();
    } catch (err) {
      setAuthError('Network error connecting to Pokémon Arena server. Please check your connection.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Step 2: Verify Signup OTP & Complete Registration
  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const cleanEmail = authEmail.trim().toLowerCase();
    const cleanOtp = authOtp.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      setAuthError('Please enter the 6-digit OTP code.');
      return;
    }

    setIsAuthLoading(true);
    sound.playButtonPress();

    try {
      const response = await fetch('/api/auth/verify-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          otp: cleanOtp,
          password: authPassword,
          displayName: authDisplayName.trim() || cleanEmail.split('@')[0],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.error || 'Invalid or expired OTP code.');
        setIsAuthLoading(false);
        return;
      }

      // Success: Save account & make active
      const newAcc: TrainerAccount = data.account;
      saveActiveAccount(newAcc);
      onAccountUpdated(newAcc);
      setEditName(newAcc.displayName);
      setEditTitle(newAcc.title);

      sound.playTrophyUnlock();
      triggerConfetti();
      setAuthSuccess('🎉 Account successfully registered in MongoDB Atlas!');
      setTimeout(() => {
        setActiveTab('profile');
      }, 1000);
    } catch (err) {
      setAuthError('Server error while verifying OTP.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Handle Login (Direct email & password verification, NO OTP required)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const cleanEmail = authEmail.trim().toLowerCase();
    const validationError = getEmailValidationError(cleanEmail);
    if (validationError) {
      setAuthError(validationError);
      return;
    }

    if (!authPassword) {
      setAuthError('Please enter your password.');
      return;
    }

    setIsAuthLoading(true);
    sound.playButtonPress();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: authPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.error || 'Invalid email or password.');
        setIsAuthLoading(false);
        return;
      }

      // Successful login
      const loggedAcc: TrainerAccount = data.account;
      saveActiveAccount(loggedAcc);
      onAccountUpdated(loggedAcc);
      setEditName(loggedAcc.displayName);
      setEditTitle(loggedAcc.title);

      sound.playCorrect();
      setAuthSuccess(`Welcome back, Trainer ${loggedAcc.displayName}!`);
      setTimeout(() => {
        setActiveTab('profile');
      }, 800);
    } catch (err) {
      setAuthError('Network error logging in. Please try again.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Sync active account with MongoDB manually
  const handleManualSync = async () => {
    sound.playButtonPress();
    setIsAuthLoading(true);
    const success = await syncAccountToMongo(account);
    setIsAuthLoading(false);
    if (success) {
      setIsSavedNotice(true);
      setTimeout(() => setIsSavedNotice(false), 2000);
    }
  };

  // Log Out / Switch to Guest
  const handleLogout = () => {
    sound.playButtonBack();
    const guestAcc = createDefaultAccount('Trainer Red');
    saveActiveAccount(guestAcc);
    onAccountUpdated(guestAcc);
    setEditName(guestAcc.displayName);
    setEditTitle(guestAcc.title);
    setAuthEmail('');
    setAuthPassword('');
    setAuthOtp('');
  };

  // Switch local device account
  const handleSwitchAccount = (targetId: string) => {
    sound.playButtonPress();
    const target = allAccounts.find((a) => a.id === targetId);
    if (target) {
      setActiveAccountId(target.id);
      onAccountUpdated(target);
      setEditName(target.displayName);
      setEditTitle(target.title);
      setActiveTab('profile');
    }
  };

  // Copy Username handler
  const handleCopyUsername = () => {
    sound.playButtonPress();
    const uname = account.username || account.displayName.toLowerCase().replace(/\s+/g, '_');
    navigator.clipboard.writeText(uname);
    setCopiedUsername(true);
    setTimeout(() => setCopiedUsername(false), 2000);
  };

  // Helper to determine avatar rarity, frames, and unlock requirements
  const getAvatarInfo = (poke: Pokemon) => {
    if (poke.isMythical || [151, 251, 385, 386, 490, 491, 492, 493, 494].includes(poke.id)) {
      return {
        rarity: 'Mythical' as const,
        frameBorder: 'border-2 border-pink-400/90 shadow-lg shadow-pink-500/25 bg-gradient-to-b from-pink-500/20 via-purple-950/40 to-slate-950 ring-1 ring-pink-400/40',
        badgeClass: 'bg-pink-500/25 text-pink-300 border-pink-400/50',
        badgeGlow: 'shadow-pink-500/30',
        howToAchieve: 'Reach Trainer Level 10, earn 5,000 Trophy Points, or unlock via 1v1 Battle Tokens.',
        tokenCost: 1000,
      };
    }
    if (poke.isLegendary || [144, 145, 146, 150, 249, 250, 382, 383, 384, 483, 484, 487, 643, 644, 716, 717, 718, 785, 786, 787, 788, 791, 792, 888, 889, 905, 1007, 1008].includes(poke.id)) {
      return {
        rarity: 'Legendary' as const,
        frameBorder: 'border-2 border-amber-400/90 shadow-lg shadow-amber-500/25 bg-gradient-to-b from-amber-500/25 via-yellow-950/40 to-slate-950 ring-1 ring-amber-400/40',
        badgeClass: 'bg-amber-500/25 text-amber-300 border-amber-400/50',
        badgeGlow: 'shadow-amber-500/30',
        howToAchieve: 'Conquer a 10-question streak in Legendary Arena mode.',
        tokenCost: 750,
      };
    }
    if (poke.region === 'hisui' || poke.isRegionalForm) {
      return {
        rarity: 'Epic (Hisui/Regional)' as const,
        frameBorder: 'border-2 border-indigo-400/85 shadow-md shadow-indigo-900/40 bg-gradient-to-b from-indigo-500/20 via-violet-950/40 to-slate-950 ring-1 ring-indigo-400/30',
        badgeClass: 'bg-indigo-500/25 text-indigo-300 border-indigo-400/50',
        badgeGlow: 'shadow-indigo-500/30',
        howToAchieve: 'Identify 5 Hisuian or Regional Form Pokémon in quiz modes.',
        tokenCost: 450,
      };
    }
    if ([6, 9, 3, 658, 448, 149, 248, 373, 376, 445, 635, 706, 887, 94, 130, 212, 196, 197].includes(poke.id) || (poke.height && poke.height > 15)) {
      return {
        rarity: 'Rare' as const,
        frameBorder: 'border-2 border-cyan-400/75 shadow-md shadow-cyan-950 bg-gradient-to-b from-cyan-500/20 via-blue-950/40 to-slate-950 ring-1 ring-cyan-400/30',
        badgeClass: 'bg-cyan-500/25 text-cyan-300 border-cyan-400/50',
        badgeGlow: 'shadow-cyan-500/30',
        howToAchieve: 'Win 3 1v1 Duels or maintain a 3-day daily streak in IST.',
        tokenCost: 250,
      };
    }
    return {
      rarity: 'Common' as const,
      frameBorder: 'border border-slate-700/80 bg-slate-950/80 shadow-sm',
      badgeClass: 'bg-slate-800/80 text-slate-300 border-slate-700',
      badgeGlow: '',
      howToAchieve: 'Unlocked by default for all registered trainers!',
      tokenCost: 0,
    };
  };

  const isTrainerUnlocked = (trainer: TrainerAvatar) => {
    if (trainer.isDefaultUnlocked) return true;
    const unlockedList = account.unlockedTrainerAvatars || ['red', 'pikachu'];
    return unlockedList.includes(trainer.id);
  };

  const isTrainerEquipped = (trainer: TrainerAvatar) => {
    if (trainer.id === 'pikachu') {
      return account.trainerAvatarId === 'pikachu' || (account.avatarId === 25 && !account.trainerAvatarId);
    }
    return account.trainerAvatarId === trainer.id;
  };

  const handleEquipTrainer = (trainer: TrainerAvatar) => {
    if (!isTrainerUnlocked(trainer)) return;
    sound.playButtonPress();
    const updated: TrainerAccount = {
      ...account,
      trainerAvatarId: trainer.id,
      avatarId: trainer.numericId || 25,
    };
    saveActiveAccount(updated);
    onAccountUpdated(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 p-0.5 shadow-lg overflow-hidden flex items-center justify-center">
              <img
                src={getAccountAvatarUrl(account)}
                alt="Trainer Avatar"
                className="w-full h-full rounded-2xl object-contain bg-slate-950 p-1"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-display text-white">{account.displayName}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                  Level {account.level}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-semibold border border-purple-500/30">
                  @{account.username || account.displayName.toLowerCase().replace(/\s+/g, '_')}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{account.title}</span>
                <span>•</span>
                <span className="text-amber-400 font-bold">{account.trophyPoints.toLocaleString()} TP</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">Trainer Code Active</span>
              </p>
            </div>
          </div>

          <button
            id="btn-close-profile"
            onClick={() => {
              sound.playButtonBack();
              onClose();
            }}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 py-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 text-xs overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <button
              id="tab-profile-pass"
              onClick={() => {
                sound.playButtonPress();
                setActiveTab('profile');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
                activeTab === 'profile'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Trainer Profile</span>
            </button>

            <button
              id="tab-profile-avatars"
              onClick={() => {
                sound.playButtonPress();
                setActiveTab('avatars');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
                activeTab === 'avatars'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Avatars</span>
            </button>

            <button
              id="tab-profile-battles"
              onClick={() => {
                sound.playButtonPress();
                setActiveTab('battles');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
                activeTab === 'battles'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Battle History ({(account.battleHistory || []).length}/25)</span>
            </button>
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="p-5 overflow-y-auto flex-1">
          {/* 1. Trainer Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              {/* Level & Unlimited Trophy Progress */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold tracking-widest text-slate-400">
                      Limitless Trophy Progression
                    </span>
                    <h3 className="text-2xl font-black font-display text-white">
                      {account.trophyPoints.toLocaleString()} <span className="text-sm text-amber-400">TP</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Trophies increase without limit as you win games and conquer challenges.
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400">Trainer Division:</span>
                  <div className="text-base font-bold font-display text-rose-400">{account.title}</div>
                </div>
              </div>

              {/* Showcased Achievements Showcase (Up to 3 to show off to others) */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h4 className="text-sm font-bold font-display text-white">Showcased Achievements</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      {(account.showcasedAchievements || []).length}/3 Showcased
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playButtonPress();
                      if (onOpenAchievements) {
                        onOpenAchievements();
                        onClose();
                      }
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold hover:underline"
                  >
                    Select Achievements ➔
                  </button>
                </div>

                {(!account.showcasedAchievements || account.showcasedAchievements.length === 0) ? (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-dashed border-slate-800 text-center">
                    <p className="text-xs text-slate-400 mb-2">
                      You haven&apos;t pinned any achievements yet! You can select up to 3 achievements to show off to other trainers.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playButtonPress();
                        if (onOpenAchievements) {
                          onOpenAchievements();
                          onClose();
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all"
                    >
                      Browse & Pin Achievements
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {account.showcasedAchievements.map((achId) => {
                      const ach = ACHIEVEMENTS_LIST.find((a) => a.id === achId);
                      if (!ach) return null;
                      return (
                        <div
                          key={achId}
                          className="p-3 rounded-xl bg-gradient-to-b from-amber-500/10 to-slate-950/90 border border-amber-500/40 text-left relative group"
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleShowcase(achId)}
                            title="Remove from showcase"
                            className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 p-1 rounded-md bg-slate-950/80 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="flex items-center gap-1.5 mb-1">
                            <Award className="w-4 h-4 text-amber-400 shrink-0" />
                            <span className="text-xs font-bold text-white truncate pr-5">{ach.title}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2">{ach.description}</p>
                          <span className="text-[10px] text-amber-400 font-mono font-bold block mt-1.5">
                            +{ach.rewardTrophyPoints} TP
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Official Kanto Gym Badges Case */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Medal className="w-4 h-4 text-purple-400" />
                    <h4 className="text-sm font-bold font-display text-white">Kanto Gym Badge Case</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                      {KANTO_BADGES.filter((b) => account.achievements[b.id]?.unlocked).length}/8 Earned
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playButtonPress();
                      if (onOpenBadges) {
                        onOpenBadges('Kanto');
                        onClose();
                      }
                    }}
                    className="text-xs text-purple-400 hover:text-purple-300 font-semibold hover:underline"
                  >
                    View Lore & Leader Details ➔
                  </button>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {KANTO_BADGES.map((badge) => {
                    const isEarned = account.achievements[badge.id]?.unlocked;
                    return (
                      <div
                        key={badge.id}
                        title={`${badge.name} - ${badge.gymLeader} (${isEarned ? 'Earned' : 'Locked'})`}
                        className={`flex flex-col items-center p-2 rounded-xl border transition-all text-center ${
                          isEarned
                            ? 'bg-purple-500/15 border-purple-400/50 shadow-sm shadow-purple-950/50'
                            : 'bg-slate-900/40 border-slate-800/80 opacity-40 grayscale'
                        }`}
                      >
                        <span className="text-2xl select-none mb-1">{badge.emoji}</span>
                        <span className="text-[10px] font-bold text-slate-200 truncate w-full">
                          {badge.name.replace(' Badge', '')}
                        </span>
                        <span className="text-[9px] text-slate-400 truncate w-full">{badge.gymLeader}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Edit Profile Details Form */}
              <form onSubmit={handleSaveProfile} className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h4 className="text-sm font-bold font-display text-white">Edit Trainer Identity</h4>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Trainer Name</label>
                  <input
                    type="text"
                    maxLength={20}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-medium focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Custom Title / Slogan</label>
                  <input
                    type="text"
                    maxLength={30}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-medium focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-display font-bold text-xs uppercase tracking-wider shadow-md shadow-rose-950 transition-all hover:scale-105"
                  >
                    Save Changes
                  </button>

                  {isSavedNotice && (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      <span>Profile Updated!</span>
                    </span>
                  )}
                </div>
              </form>

              {/* Trainer Authentication & Sign Out */}
              {onLogout && (
                <div className="pt-4 border-t border-slate-800/80">
                  {!showLogoutConfirm ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h5 className="text-xs font-bold text-white">Trainer Account</h5>
                        <p className="text-[11px] text-slate-400">
                          Signed in as <span className="text-purple-300 font-semibold font-mono">@{account.username || account.displayName.toLowerCase().replace(/\s+/g, '_')}</span>
                          {account.email && (
                            <span className="text-slate-500 font-mono text-[10px] ml-1.5">({account.email})</span>
                          )}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          {mongoStatus.connected ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              MongoDB Atlas Synced
                            </span>
                          ) : (
                            <span
                              title={mongoStatus.error || 'Running in local storage & memory mode. Add 0.0.0.0/0 to Atlas Network Access for cloud sync.'}
                              className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-300/90 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 cursor-help"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              Local & In-Memory Mode
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        id="btn-logout-trainer"
                        type="button"
                        onClick={() => {
                          sound.playButtonPress();
                          setShowLogoutConfirm(true);
                        }}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer self-start sm:self-auto"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-400" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-white flex items-center gap-2">
                            <span>Confirm Log Out</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                              @{account.username || account.displayName}
                            </span>
                          </h5>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            Are you sure you want to log out? Your cloud data is saved on MongoDB Atlas, but you will need to sign in again to access cloud sync.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-rose-900/40">
                        <button
                          id="btn-cancel-logout"
                          type="button"
                          onClick={() => {
                            sound.playButtonBack();
                            setShowLogoutConfirm(false);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          id="btn-confirm-logout"
                          type="button"
                          onClick={() => {
                            sound.playButtonBack();
                            onLogout();
                            onClose();
                          }}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-md shadow-rose-950/50 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Confirm Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. Earned Avatars Vault */}
          {activeTab === 'avatars' && (() => {
            const unlockedTrainers = TRAINER_AVATARS.filter((trainer) => isTrainerUnlocked(trainer));
            const displayedAvatars = unlockedTrainers.filter((trainer) => {
              if (avatarFilter === 'all') return true;
              const cat = trainer.category || (trainer.role.toLowerCase().includes('champion') ? 'champion' : trainer.role.toLowerCase().includes('gym') ? 'gym_leader' : 'coordinator_special');
              if (avatarFilter === 'champions') return cat === 'champion';
              if (avatarFilter === 'gym_leaders') return cat === 'gym_leader';
              if (avatarFilter === 'special') return cat === 'coordinator_special';
              return true;
            });

            return (
              <div className="space-y-4">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <div>
                    <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>My Unlocked Avatars</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        {unlockedTrainers.length} Unlocked
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Your personal collection of unlocked avatars. Tap any avatar to equip it. Browse and unlock all 101 iconic trainers anytime in the Poké Mart!
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onOpenShop && (
                      <button
                        type="button"
                        onClick={() => {
                          sound.playButtonPress();
                          onOpenShop();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/40 cursor-pointer transition-all hover:scale-105 active:scale-95"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Poké Mart</span>
                      </button>
                    )}
                    <div className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span>{account.battleTokens ?? 0} BT</span>
                    </div>
                  </div>
                </div>

                {/* Avatar Filter Chips */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  {[
                    { id: 'all', label: `All Unlocked (${unlockedTrainers.length})` },
                    { id: 'champions', label: 'Champions & Monarchs' },
                    { id: 'gym_leaders', label: 'Gym Leaders' },
                    { id: 'special', label: 'Special & Coordinators' },
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => {
                        sound.playButtonPress();
                        setAvatarFilter(chip.id as any);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap border transition-all cursor-pointer ${
                        avatarFilter === chip.id
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-950'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Avatars Grid or Empty State */}
                {displayedAvatars.length === 0 ? (
                  <div className="py-12 px-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">No Unlocked Avatars in this Category</h4>
                      <p className="text-xs text-slate-400 max-w-sm mt-1">
                        All 101 iconic Pokémon trainers are available in the Poké Mart for unlocking with Battle Tokens!
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setAvatarFilter('all')}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                      >
                        Show All Unlocked
                      </button>
                      {onOpenShop && (
                        <button
                          type="button"
                          onClick={() => {
                            sound.playButtonPress();
                            onOpenShop();
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Open Poké Mart</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[460px] overflow-y-auto pr-1">
                    {displayedAvatars.map((trainer) => {
                      const isEquipped = isTrainerEquipped(trainer);
                      const frameStyle = trainer.frameBorder || getTrainerFrameBorder(trainer.rarity);
                      const badgeStyle = trainer.badgeClass || getTrainerBadgeClass(trainer.rarity);

                      return (
                        <div
                          key={`trainer-avatar-${trainer.id}`}
                          onClick={() => {
                            handleEquipTrainer(trainer);
                          }}
                          className={`relative flex flex-col items-center p-3 rounded-2xl cursor-pointer transition-all hover:scale-[1.03] active:scale-[0.98] ${frameStyle} ${
                            isEquipped
                              ? 'ring-2 ring-rose-400 shadow-xl shadow-rose-950 bg-rose-500/10'
                              : 'hover:brightness-110'
                          }`}
                        >
                          {/* Rarity Tag & Region */}
                          <div className="w-full flex items-center justify-between gap-1 mb-1">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider border ${badgeStyle}`}>
                              {trainer.rarity}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-slate-950 text-slate-300 border border-slate-800">
                              {trainer.region}
                            </span>
                          </div>

                          {/* Trainer Avatar Sprite */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center relative my-1">
                            <img
                              src={trainer.spriteUrl}
                              alt={trainer.name}
                              className="max-h-16 sm:max-h-18 w-auto object-contain drop-shadow-md transition-all"
                            />
                          </div>

                          {/* Name & Title */}
                          <span className="text-xs font-bold text-white text-center truncate w-full mt-1">
                            {trainer.name}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate w-full text-center">
                            {trainer.title}
                          </span>

                          {/* Status footer */}
                          <div className="w-full mt-2 pt-1.5 border-t border-slate-800/80 text-center">
                            {isEquipped ? (
                              <span className="text-[10px] uppercase tracking-wider font-extrabold text-rose-400 flex items-center justify-center gap-1">
                                <Check className="w-3 h-3 text-rose-400" /> Equipped
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-1">
                                <Check className="w-3 h-3" /> Tap to Equip
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* 4. Battle History Tab (FIFO 25 Battles) */}
          {activeTab === 'battles' && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Battles</div>
                  <div className="text-lg font-black font-display text-white mt-0.5">
                    {(account.battleHistory || []).length}
                    <span className="text-xs text-slate-500 font-mono"> / 25</span>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <div className="text-[10px] uppercase font-bold text-emerald-400">Victories</div>
                  <div className="text-lg font-black font-display text-emerald-400 mt-0.5">
                    {(account.battleHistory || []).filter((b) => b.result === 'victory').length}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center">
                  <div className="text-[10px] uppercase font-bold text-rose-400">Defeats</div>
                  <div className="text-lg font-black font-display text-rose-400 mt-0.5">
                    {(account.battleHistory || []).filter((b) => b.result === 'defeat').length}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
                  <div className="text-[10px] uppercase font-bold text-amber-400">Win Rate</div>
                  <div className="text-lg font-black font-display text-amber-300 mt-0.5">
                    {(account.battleHistory || []).length > 0
                      ? `${Math.round(
                          ((account.battleHistory || []).filter((b) => b.result === 'victory').length /
                            (account.battleHistory || []).length) *
                            100
                        )}%`
                      : '0%'}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Swords className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Your last 25 battles are saved in FIFO sequence (first in, first out).</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                  Max 25 logs
                </span>
              </div>

              {/* Battles List */}
              {(!account.battleHistory || account.battleHistory.length === 0) ? (
                <div className="p-10 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-center flex flex-col items-center justify-center">
                  <Swords className="w-10 h-10 text-slate-600 mb-2" />
                  <h4 className="text-sm font-bold text-slate-300">No Battles in Log Yet</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Enter 1v1 duels or the online PvP arena to record your match history!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {account.battleHistory.map((b, idx) => {
                    const isVictory = b.result === 'victory';
                    const isDraw = b.result === 'draw';
                    return (
                      <div
                        key={b.id || `battle_${idx}`}
                        className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                          isVictory
                            ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50'
                            : isDraw
                            ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50'
                            : 'bg-rose-500/10 border-rose-500/30 hover:border-rose-500/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                              isVictory
                                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                                : isDraw
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-rose-600 text-white'
                            }`}
                          >
                            {b.result}
                          </span>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="text-sm font-bold text-white">vs. {b.opponentName}</h5>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium capitalize">
                                {b.mode || '1v1 Duel'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {new Date(b.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                          <div className="text-left sm:text-right">
                            <div className="text-xs text-slate-400">Final Score</div>
                            <div className="text-sm font-black font-mono">
                              <span className={isVictory ? 'text-emerald-400' : 'text-slate-300'}>
                                {b.playerScore}
                              </span>
                              <span className="text-slate-500 mx-1">-</span>
                              <span className={!isVictory && !isDraw ? 'text-rose-400' : 'text-slate-400'}>
                                {b.opponentScore}
                              </span>
                            </div>
                          </div>

                          {(b.rewardTokens || b.rewardTP) ? (
                            <div className="flex items-center gap-1.5 shrink-0">
                              {b.rewardTokens ? (
                                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/40">
                                  +{b.rewardTokens} BT
                                </span>
                              ) : null}
                              {b.rewardTP ? (
                                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/40">
                                  +{b.rewardTP} TP
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Unused legacy auth block */}
          {false && (
            <div className="space-y-6">
              {/* Error and Success Banners */}
              {authError && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span>{authError}</span>
                    {authError.includes('already registered') && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setAuthError('');
                        }}
                        className="block mt-1.5 text-xs text-cyan-400 font-bold hover:underline"
                      >
                        Click here to switch to Log In ➔
                      </button>
                    )}
                    {authError.includes('No trainer account found') && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('signup');
                          setSignupStep('details');
                          setAuthError('');
                        }}
                        className="block mt-1.5 text-xs text-rose-400 font-bold hover:underline"
                      >
                        Click here to Sign Up instead ➔
                      </button>
                    )}
                  </div>
                </div>
              )}

              {authSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{authSuccess}</span>
                </div>
              )}

              {/* ----------------- SIGN UP FORM (WITH OTP) ----------------- */}
              {authMode === 'signup' && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                  {signupStep === 'details' ? (
                    <form onSubmit={handleRequestSignupOtp} className="space-y-3.5">
                      <div className="flex items-center gap-2 mb-1">
                        <UserPlus className="w-4 h-4 text-rose-500" />
                        <h4 className="text-sm font-bold font-display text-white">Create Trainer Account & Send OTP</h4>
                      </div>

                      <p className="text-xs text-slate-400">
                        Enter your valid email address. A 6-digit one-time password (OTP) will be sent to verify your email before registering your trainer card into MongoDB.
                      </p>

                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Trainer Display Name</label>
                        <input
                          type="text"
                          required
                          maxLength={20}
                          placeholder="e.g. Satyajit, Red, Cynthia"
                          value={authDisplayName}
                          onChange={(e) => setAuthDisplayName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs text-slate-400">Email Address (Valid & Unique)</label>
                          {authEmail && (
                            <span className={`text-[10px] font-bold ${isValidEmail(authEmail) ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {isValidEmail(authEmail) ? '✓ Valid format' : 'Invalid email'}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="email"
                            required
                            placeholder="trainer@example.com"
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-rose-500"
                          />
                          <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Account Password (Min 4 characters)</label>
                        <div className="relative">
                          <input
                            type={showAuthPassword ? 'text' : 'password'}
                            required
                            minLength={4}
                            placeholder="••••••••"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-rose-500"
                          />
                          <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowAuthPassword((prev) => !prev)}
                            title={showAuthPassword ? 'Hide password' : 'Show password'}
                            aria-label={showAuthPassword ? 'Hide password' : 'Show password'}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            {showAuthPassword ? (
                              <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                            ) : (
                              <Eye className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isAuthLoading}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-display font-black text-xs uppercase tracking-wider shadow-md shadow-rose-950 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isAuthLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Generating & Sending OTP...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Send Verification Code (OTP)</span>
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    /* Step 2: Enter OTP Code */
                    <form onSubmit={handleVerifySignupOtp} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-cyan-400" />
                          <h4 className="text-sm font-bold font-display text-white">Enter 6-Digit Email OTP</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSignupStep('details')}
                          className="text-[11px] text-slate-400 hover:text-white underline"
                        >
                          Change Email
                        </button>
                      </div>

                      <p className="text-xs text-slate-300">
                        We sent a verification code to <strong className="text-cyan-300">{authEmail}</strong>. Enter it below to complete registration:
                      </p>

                      {/* Preview OTP helper if running without external SMTP server */}
                      {previewOtp && (
                        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs text-cyan-300">
                            <Radio className="w-4 h-4 animate-pulse text-cyan-400" />
                            <span>Preview OTP: <strong className="font-mono text-sm tracking-widest text-white">{previewOtp}</strong></span>
                          </div>
                          <button
                            type="button"
                            onClick={() => previewOtp && setAuthOtp(previewOtp)}
                            className="text-[11px] px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/40"
                          >
                            Auto-fill Code
                          </button>
                        </div>
                      )}

                      <div>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="• • • • • •"
                          value={authOtp}
                          onChange={(e) => setAuthOtp(e.target.value.replace(/\D/g, ''))}
                          className="w-full text-center tracking-[12px] text-2xl font-mono py-3 rounded-xl bg-slate-900 border border-cyan-500/50 text-cyan-300 font-black focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                          Expires in 10 minutes
                        </span>
                        <button
                          type="button"
                          disabled={resendTimer > 0 || isAuthLoading}
                          onClick={handleRequestSignupOtp}
                          className="text-xs text-cyan-400 font-bold hover:underline disabled:text-slate-600"
                        >
                          {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend Code'}
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={isAuthLoading || authOtp.length !== 6}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-display font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-950 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isAuthLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Verifying in MongoDB...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Verify & Complete Signup</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* ----------------- LOG IN FORM (DIRECT - NO OTP) ----------------- */}
              {authMode === 'login' && (
                <form onSubmit={handleLogin} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-3.5">
                  <div className="flex items-center gap-2 mb-1">
                    <LogIn className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-sm font-bold font-display text-white">Log In to MongoDB Trainer Account</h4>
                  </div>

                  <p className="text-xs text-slate-400">
                    Enter your registered email and password. Log in checks MongoDB directly without requiring an OTP.
                  </p>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-slate-400">Email Address</label>
                      {authEmail && (
                        <span className={`text-[10px] font-bold ${isValidEmail(authEmail) ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {isValidEmail(authEmail) ? '✓ Valid format' : 'Invalid email'}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="trainer@example.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-500"
                      />
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showAuthPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-500"
                      />
                      <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowAuthPassword((prev) => !prev)}
                        title={showAuthPassword ? 'Hide password' : 'Show password'}
                        aria-label={showAuthPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {showAuthPassword ? (
                          <EyeOff className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-display font-black text-xs uppercase tracking-wider shadow-md shadow-blue-950 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isAuthLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Authenticating with MongoDB...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Log In</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Local Saved Accounts Switcher */}
              {allAccounts.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold font-display uppercase tracking-wider text-slate-400 mb-2.5">
                    Saved Accounts on This Device
                  </h4>
                  <div className="space-y-2">
                    {allAccounts.map((acc) => (
                      <div
                        key={acc.id}
                        onClick={() => handleSwitchAccount(acc.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          acc.id === account.id
                            ? 'bg-rose-500/20 border-rose-400 shadow-md shadow-rose-950'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={OFFICIAL_ARTWORK_URL(acc.avatarId)}
                            alt={acc.displayName}
                            className="w-10 h-10 object-contain drop-shadow"
                          />
                          <div>
                            <div className="text-sm font-bold text-white flex items-center gap-2">
                              <span>{acc.displayName}</span>
                              {acc.email && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                                  {acc.email}
                                </span>
                              )}
                              {acc.id === account.id && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">
                              Level {acc.level} • {acc.trophyPoints.toLocaleString()} TP
                            </p>
                          </div>
                        </div>

                        {acc.id !== account.id && (
                          <span className="text-xs text-rose-400 font-bold hover:underline flex items-center gap-1">
                            <span>Switch</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
