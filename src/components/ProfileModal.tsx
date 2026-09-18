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
  Radio
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Achievement, TrainerAccount } from '../types/pokemon';
import { ACHIEVEMENTS_LIST } from '../data/achievements';
import { OFFICIAL_ARTWORK_URL } from '../data/pokemonData';
import { createDefaultAccount, getAllAccounts, saveActiveAccount, saveAllAccounts, setActiveAccountId, syncAccountToMongo } from '../utils/accounts';
import { sound } from '../utils/audio';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: TrainerAccount;
  onAccountUpdated: (acc: TrainerAccount) => void;
  onLogout?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  account,
  onAccountUpdated,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'avatars' | 'achievements'>('profile');

  // Edit Profile Form
  const [editName, setEditName] = useState(account.displayName);
  const [editTitle, setEditTitle] = useState(account.title);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // MongoDB Authentication & Account Management State
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [signupStep, setSignupStep] = useState<'details' | 'otp'>('details');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
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

  // Email format validator
  const isValidEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email.trim());
  };

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

  // Step 1: Request Signup OTP
  const handleRequestSignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const cleanEmail = authEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setAuthError('Please enter an email address.');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setAuthError('Please enter a valid email address (e.g., trainer@pokemon.com).');
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
    if (!cleanEmail) {
      setAuthError('Please enter your email.');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setAuthError('Please enter a valid email address.');
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

  // Collect all available avatars to display
  const standardAvatars = [25, 1, 4, 7, 6, 9, 94, 150, 448, 493, 658, 815, 887, 959, 1007, 1008];

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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 p-0.5 shadow-lg">
              <img
                src={OFFICIAL_ARTWORK_URL(account.avatarId)}
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
                {account.email && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    Verified Trainer
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>{account.title}</span>
                <span>•</span>
                <span className="text-amber-400 font-bold">{account.trophyPoints.toLocaleString()} TP</span>
                {account.email && (
                  <>
                    <span>•</span>
                    <span className="text-slate-400">{account.email}</span>
                  </>
                )}
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'avatars'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Earned Avatars ({account.unlockedAvatars.length})</span>
            </button>

            <button
              id="tab-profile-achievements"
              onClick={() => {
                sound.playButtonPress();
                setActiveTab('achievements');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'achievements'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Achievements</span>
            </button>

          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono">
              {Object.values(account.achievements || {}).filter((a) => a.unlocked).length} Achievements
            </span>
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

              {/* Cloud Sync Status Banner if logged in */}
              {account.email && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-white">MongoDB Cloud Synced Account</h4>
                      <p className="text-[11px] text-slate-400">
                        Linked to <strong className="text-emerald-300">{account.email}</strong> in database{' '}
                        <code className="text-slate-300 font-mono">Pokemon_Arena</code>.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleManualSync}
                    disabled={isAuthLoading}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAuthLoading ? 'animate-spin' : ''}`} />
                    <span>Sync Now</span>
                  </button>
                </div>
              )}

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
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-white">Trainer Account</h5>
                    <p className="text-[11px] text-slate-400">
                      Signed in as <span className="text-rose-400 font-semibold">{account.email || account.displayName}</span>
                    </p>
                  </div>
                  <button
                    id="btn-logout-trainer"
                    type="button"
                    onClick={() => {
                      sound.playButtonBack();
                      onLogout();
                      onClose();
                    }}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all hover:scale-105 active:scale-95"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. Earned Avatars Vault */}
          {activeTab === 'avatars' && (
            <div>
              <div className="mb-4">
                <h3 className="text-base font-bold font-display text-white">Earned Pokémon Profile Avatars</h3>
                <p className="text-xs text-slate-400">
                  Click any unlocked Pokémon avatar to set it as your trainer profile picture. Unlock more by conquering achievements and specific game modes!
                </p>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {standardAvatars.map((pokeId) => {
                  const isUnlocked = account.unlockedAvatars.includes(pokeId);
                  const isEquipped = account.avatarId === pokeId;

                  return (
                    <button
                      key={pokeId}
                      disabled={!isUnlocked}
                      onClick={() => handleEquipAvatar(pokeId)}
                      className={`relative flex flex-col items-center p-3 rounded-2xl border transition-all ${
                        isEquipped
                          ? 'bg-rose-500/20 border-rose-400 ring-2 ring-rose-500/50 shadow-lg shadow-rose-950'
                          : isUnlocked
                          ? 'bg-slate-950/70 border-slate-800 hover:border-slate-600 hover:scale-105'
                          : 'bg-slate-950/30 border-slate-900 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <div className="w-16 h-16 flex items-center justify-center relative my-1">
                        <img
                          src={OFFICIAL_ARTWORK_URL(pokeId)}
                          alt="Avatar"
                          className={`max-h-14 w-auto object-contain drop-shadow ${
                            isUnlocked ? '' : 'filter grayscale brightness-25'
                          }`}
                        />
                        {!isUnlocked && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Lock className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                      </div>

                      {isEquipped && (
                        <span className="text-[9px] uppercase tracking-wider font-bold text-rose-400 mt-1">
                          Equipped
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Achievements Tab */}
          {activeTab === 'achievements' && (
            <div className="space-y-3">
              <div className="mb-2">
                <h3 className="text-base font-bold font-display text-white">Trainer Achievements</h3>
                <p className="text-xs text-slate-400">
                  Conquer achievements to earn exclusive Pokémon profile avatars, background music songs, and limitless Trophy Points!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ACHIEVEMENTS_LIST.map((ach) => {
                  const record = account.achievements[ach.id] || { progress: 0, unlocked: false };
                  const isUnlocked = record.unlocked;

                  return (
                    <div
                      key={ach.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                        isUnlocked
                          ? 'bg-emerald-500/10 border-emerald-500/30 shadow-md shadow-emerald-950/20'
                          : 'bg-slate-950/60 border-slate-800/80'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="text-sm font-bold font-display text-white flex items-center gap-1.5">
                            {isUnlocked ? (
                              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            )}
                            <span>{ach.title}</span>
                          </h4>

                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            +{ach.rewardTrophyPoints} TP
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mb-2">{ach.description}</p>
                      </div>

                      {/* Reward preview */}
                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Reward:</span>
                        <div className="flex items-center gap-2">
                          {ach.rewardAvatarId && (
                            <span className="text-rose-400 font-semibold">Avatar #{ach.rewardAvatarId}</span>
                          )}
                          {ach.rewardSongId && (
                            <span className="text-cyan-400 font-semibold">Song Track</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Accounts tab removed - Authentication is now handled at start gate */}
          {false && (
            <div className="space-y-6">
              {/* MongoDB Atlas Connectivity Indicator */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold font-display text-white flex items-center gap-2">
                      <span>MongoDB Database: Pokemon_Arena</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                        {mongoStatus.connected ? 'Active Atlas Cluster' : 'Connecting...'}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Sign up with email to generate an OTP code and permanently sync your career rank.
                    </p>
                  </div>
                </div>

                {account.email && (
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                    title="Sign out of MongoDB account"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                )}
              </div>

              {/* Mode Toggle: Sign Up (with OTP) vs Log In (Direct without OTP) */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  onClick={() => {
                    sound.playButtonPress();
                    setAuthMode('signup');
                    setSignupStep('details');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    authMode === 'signup'
                      ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>First-Time Sign Up (Email + OTP)</span>
                </button>

                <button
                  onClick={() => {
                    sound.playButtonPress();
                    setAuthMode('login');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    authMode === 'login'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log In (Email & Password)</span>
                </button>
              </div>

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
                            type="password"
                            required
                            minLength={4}
                            placeholder="••••••••"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-rose-500"
                          />
                          <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
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
                        type="password"
                        required
                        placeholder="••••••••"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-500"
                      />
                      <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
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
