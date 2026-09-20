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
  Users,
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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Achievement, Pokemon, ShopItem, TrainerAccount } from '../types/pokemon';
import { ACHIEVEMENTS_LIST, KANTO_BADGES } from '../data/achievements';
import { CURATED_POKEMON, OFFICIAL_ARTWORK_URL } from '../data/pokemonData';
import { SHOP_ITEMS } from '../data/shopItems';
import { ALL_REGIONAL_BADGES, GymBadgeInfo } from '../data/regionalBadges';
import { TROPHY_ROAD_REWARDS, DAILY_STREAK_REWARDS, TrophyMilestoneReward, DailyStreakReward } from '../data/rewardsData';
import { createDefaultAccount, getAllAccounts, saveActiveAccount, saveAllAccounts, setActiveAccountId, syncAccountToMongo, evaluateAchievements } from '../utils/accounts';
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
  const [activeTab, setActiveTab] = useState<'profile' | 'rewards' | 'avatars' | 'shop' | 'achievements' | 'badges' | 'friends'>('profile');
  const [badgeRegion, setBadgeRegion] = useState<string>('All');
  const [rewardsSubTab, setRewardsSubTab] = useState<'trophy_road' | 'daily_streak'>('trophy_road');
  const [claimedMilestones, setClaimedMilestones] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem(`claimed_milestones_${account.id}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [shopFilter, setShopFilter] = useState<'all' | 'normal' | 'rare' | 'super_rare' | 'epic' | 'mythic' | 'legendary'>('all');
  const [avatarFilter, setAvatarFilter] = useState<'all' | 'unlocked' | 'hisui' | 'legendary' | 'starter'>('all');
  const [inspectAvatar, setInspectAvatar] = useState<{
    pokemon: Pokemon;
    rarity: string;
    unlockRequirement: string;
    frameClass: string;
    badgeClass: string;
    isUnlocked: boolean;
    tokenCost: number;
  } | null>(null);
  const [shopToast, setShopToast] = useState<string | null>(null);
  const [newFriendName, setNewFriendName] = useState('');
  const [copiedUsername, setCopiedUsername] = useState(false);
  const [friendError, setFriendError] = useState('');
  const [friendSuccess, setFriendSuccess] = useState('');
  const [copiedTrainerCode, setCopiedTrainerCode] = useState(false);
  const [challengeToast, setChallengeToast] = useState<string | null>(null);
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

  // Add friend / rival to network with username uniqueness validation
  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setFriendError('');
    setFriendSuccess('');
    const target = newFriendName.trim().replace(/^@/, '');
    if (!target) {
      setFriendError('Please enter a username to add.');
      return;
    }
    const myUname = (account.username || account.displayName).toLowerCase().replace(/\s+/g, '_');
    if (target.toLowerCase() === myUname) {
      setFriendError('You cannot add yourself as a friend.');
      return;
    }
    if ((account.friends || []).some((f) => f.toLowerCase() === target.toLowerCase())) {
      setFriendError(`@${target} is already on your friend list!`);
      return;
    }

    try {
      const res = await fetch(`/api/trainers/by-username/${encodeURIComponent(target)}`);
      const data = await res.json();
      if (!res.ok || !data.exists) {
        setFriendError(`Trainer @${target} was not found. Make sure the username is exact.`);
        return;
      }

      const friendDisplayName = data.trainer.displayName || target;
      const updatedFriends = [...(account.friends || []), friendDisplayName];
      const updatedAcc: TrainerAccount = {
        ...account,
        friends: updatedFriends,
      };
      const { updatedAccount } = evaluateAchievements(updatedAcc, { friendAdded: true });
      saveActiveAccount(updatedAccount);
      onAccountUpdated(updatedAccount);
      setNewFriendName('');
      triggerConfetti();
      sound.playCorrect();
      setFriendSuccess(`Added @${target} (${friendDisplayName}) to your friends roster!`);
      setChallengeToast(`Added ${friendDisplayName} to your Trainer Network!`);
      setTimeout(() => setChallengeToast(null), 3000);
    } catch {
      setFriendError('Network error checking username.');
    }
  };

  // Remove friend / rival from network
  const handleRemoveFriend = (name: string) => {
    sound.playButtonBack();
    const currentFriends = account.friends || [];
    const updatedFriends = currentFriends.filter((f) => f !== name);
    const updatedAcc: TrainerAccount = {
      ...account,
      friends: updatedFriends,
    };
    saveActiveAccount(updatedAcc);
    onAccountUpdated(updatedAcc);
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

  // Challenge friend to 1v1 battle
  const handleChallengeFriend = (friendName: string) => {
    sound.playTrophyUnlock();
    setChallengeToast(`Battle Invitation dispatched to ${friendName}! Enter 1v1 Arena to duel.`);
    setTimeout(() => setChallengeToast(null), 3500);
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

  const isPokemonAvatarUnlocked = (poke: Pokemon) => {
    const info = getAvatarInfo(poke);
    // Common Pokémon are unlocked by default
    if (info.rarity === 'Common') return true;
    // Default starter IDs are unlocked
    if ([25, 1, 4, 7, 133, 152, 155, 158].includes(poke.id)) return true;
    return (account.unlockedAvatars || []).includes(poke.id);
  };

  const handleUnlockAvatarWithTokens = (poke: Pokemon, cost: number) => {
    const currentTokens = account.battleTokens ?? 0;
    if (currentTokens < cost) return;
    sound.playButtonPress();
    const nextTokens = currentTokens - cost;
    const nextUnlocked = Array.from(new Set([...(account.unlockedAvatars || []), poke.id]));
    const updated: TrainerAccount = {
      ...account,
      battleTokens: nextTokens,
      unlockedAvatars: nextUnlocked,
      avatarId: poke.id, // Auto equip
    };
    saveActiveAccount(updated);
    onAccountUpdated(updated);
    sound.playTrophyUnlock();
    confetti({ particleCount: 40, spread: 70, origin: { y: 0.6 } });
    setInspectAvatar(null);
  };

  const handleBuyShopItem = (item: ShopItem) => {
    sound.playButtonPress();
    const currentTokens = account.battleTokens ?? 0;
    if (currentTokens < item.cost) return;

    const nextTokens = currentTokens - item.cost;
    const nextInventory = { ...(account.inventory || {}) };
    nextInventory[item.id] = (nextInventory[item.id] || 0) + (typeof item.rewardValue === 'number' ? item.rewardValue : 1);

    const nextUnlockedTrainers = [...(account.unlockedTrainerAvatars || [])];
    if (item.rewardType === 'avatar' && typeof item.rewardValue === 'string') {
      if (!nextUnlockedTrainers.includes(item.rewardValue)) {
        nextUnlockedTrainers.push(item.rewardValue);
      }
    }

    const updated: TrainerAccount = {
      ...account,
      battleTokens: nextTokens,
      inventory: nextInventory,
      unlockedTrainerAvatars: nextUnlockedTrainers,
    };

    saveActiveAccount(updated);
    onAccountUpdated(updated);
    sound.playTrophyUnlock();
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
    setShopToast(`Successfully purchased ${item.name}!`);
    setTimeout(() => setShopToast(null), 3000);
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
              id="tab-profile-rewards"
              onClick={() => {
                sound.playButtonPress();
                setActiveTab('rewards');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
                activeTab === 'rewards'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Rewards & Streaks</span>
            </button>

            <button
              id="tab-profile-badges"
              onClick={() => {
                sound.playButtonPress();
                setActiveTab('badges');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
                activeTab === 'badges'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Medal className="w-3.5 h-3.5" />
              <span>Gym Badges (9 Regions)</span>
            </button>

            <button
              id="tab-profile-friends"
              onClick={() => {
                sound.playButtonPress();
                setActiveTab('friends');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
                activeTab === 'friends'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Friend List ({(account.friends || []).length})</span>
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
              id="tab-profile-shop"
              onClick={() => {
                sound.playButtonPress();
                setActiveTab('shop');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'shop'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
              <span>Shop</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold flex items-center gap-1">
                <Coins className="w-2.5 h-2.5" />
                {account.battleTokens ?? 0}
              </span>
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
                      setActiveTab('achievements');
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
                        setActiveTab('achievements');
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
                      setActiveTab('badges');
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
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-white">Trainer Account</h5>
                    <p className="text-[11px] text-slate-400">
                      Signed in as <span className="text-purple-300 font-semibold font-mono">@{account.username || account.displayName.toLowerCase().replace(/\s+/g, '_')}</span>
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
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Trainer Profile Avatars</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      {(account.unlockedAvatars || []).length} Unlocked
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Click an unlocked Pokémon avatar to equip it. Tap any locked avatar to view its exact unlock requirements or unlock it using Battle Tokens!
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>{account.battleTokens ?? 0} BT</span>
                  </div>
                </div>
              </div>

              {/* Avatar Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                {(
                  [
                    { id: 'all', label: 'All Pokémon' },
                    { id: 'hisui', label: 'Hisui Region' },
                    { id: 'legendary', label: 'Legendary & Mythical' },
                    { id: 'starter', label: 'Starters & Rare' },
                    { id: 'unlocked', label: 'My Unlocked' },
                  ] as const
                ).map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => {
                      sound.playButtonPress();
                      setAvatarFilter(chip.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap border transition-all ${
                      avatarFilter === chip.id
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-950'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Avatars Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[460px] overflow-y-auto pr-1">
                {CURATED_POKEMON.filter((p) => {
                  if (avatarFilter === 'hisui') return p.region === 'hisui' || p.isRegionalForm;
                  if (avatarFilter === 'legendary') return p.isLegendary || p.isMythical;
                  if (avatarFilter === 'starter') return [1, 4, 7, 25, 133, 152, 155, 158, 252, 255, 258, 387, 390, 393, 495, 498, 501, 650, 653, 656, 722, 725, 728, 810, 813, 816, 906, 909, 912].includes(p.id);
                  if (avatarFilter === 'unlocked') return isPokemonAvatarUnlocked(p);
                  return true;
                }).map((poke) => {
                  const info = getAvatarInfo(poke);
                  const isUnlocked = isPokemonAvatarUnlocked(poke);
                  const isEquipped = account.avatarId === poke.id;

                  return (
                    <div
                      key={`avatar-${poke.id}`}
                      onClick={() => {
                        sound.playButtonPress();
                        if (isUnlocked) {
                          handleEquipAvatar(poke.id);
                        } else {
                          setInspectAvatar({
                            pokemon: poke,
                            rarity: info.rarity,
                            unlockRequirement: info.howToAchieve,
                            frameClass: info.frameBorder,
                            badgeClass: info.badgeClass,
                            isUnlocked: false,
                            tokenCost: info.tokenCost,
                          });
                        }
                      }}
                      className={`relative flex flex-col items-center p-3 rounded-2xl cursor-pointer transition-all hover:scale-[1.03] active:scale-[0.98] ${
                        info.frameBorder
                      } ${
                        isEquipped
                          ? 'ring-2 ring-rose-400 shadow-xl shadow-rose-950'
                          : isUnlocked
                          ? 'hover:brightness-110'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {/* Rarity Tag */}
                      <div className="w-full flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider border ${info.badgeClass}`}>
                          {info.rarity}
                        </span>
                        {poke.region === 'hisui' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/40">
                            HISUI
                          </span>
                        )}
                      </div>

                      {/* Pokémon Artwork */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center relative my-1">
                        <img
                          src={OFFICIAL_ARTWORK_URL(poke.id)}
                          alt={poke.displayName}
                          className={`max-h-16 sm:max-h-18 w-auto object-contain drop-shadow-md transition-all ${
                            isUnlocked ? '' : 'filter grayscale contrast-125 brightness-40'
                          }`}
                        />
                        {!isUnlocked && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 rounded-xl backdrop-blur-[1px]">
                            <Lock className="w-5 h-5 text-amber-400 mb-0.5" />
                            <span className="text-[9px] text-amber-300 font-bold">Locked</span>
                          </div>
                        )}
                      </div>

                      {/* Name & Region */}
                      <span className="text-xs font-bold text-white text-center truncate w-full mt-1">
                        {poke.displayName}
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {poke.region} Region
                      </span>

                      {/* Status footer */}
                      <div className="w-full mt-2 pt-1.5 border-t border-slate-800/80 text-center">
                        {isEquipped ? (
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-rose-400 flex items-center justify-center gap-1">
                            <Check className="w-3 h-3 text-rose-400" /> Equipped
                          </span>
                        ) : isUnlocked ? (
                          <span className="text-[10px] font-bold text-emerald-400">
                            Tap to Equip
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-400 flex items-center justify-center gap-1">
                            <Info className="w-2.5 h-2.5" /> Unlock Info
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Locked Avatar Inspector Modal */}
              {inspectAvatar && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/40 shadow-2xl flex flex-col sm:flex-row items-center gap-4">
                  <div className={`w-24 h-24 rounded-2xl p-2 flex items-center justify-center shrink-0 ${inspectAvatar.frameClass}`}>
                    <img
                      src={OFFICIAL_ARTWORK_URL(inspectAvatar.pokemon.id)}
                      alt={inspectAvatar.pokemon.displayName}
                      className="max-h-20 w-auto object-contain drop-shadow"
                    />
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                      <h4 className="text-lg font-bold font-display text-white">
                        {inspectAvatar.pokemon.displayName}
                      </h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${inspectAvatar.badgeClass}`}>
                        {inspectAvatar.rarity}
                      </span>
                    </div>

                    <div className="text-xs text-amber-300 font-semibold mb-1 flex items-center justify-center sm:justify-start gap-1">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <span>How to Unlock:</span>
                    </div>
                    <p className="text-xs text-slate-300 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                      {inspectAvatar.unlockRequirement}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                    {inspectAvatar.tokenCost > 0 && (
                      <button
                        type="button"
                        disabled={(account.battleTokens ?? 0) < inspectAvatar.tokenCost}
                        onClick={() => handleUnlockAvatarWithTokens(inspectAvatar.pokemon, inspectAvatar.tokenCost)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${
                          (account.battleTokens ?? 0) >= inspectAvatar.tokenCost
                            ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer shadow-amber-950'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>Unlock for {inspectAvatar.tokenCost} BT</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setInspectAvatar(null)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Poké Mart Shop Tab */}
          {activeTab === 'shop' && (
            <div className="space-y-4">
              {/* Currency Balance & Description Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-950 to-purple-500/15 border border-amber-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-lg shadow-amber-950">
                    <Coins className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                      <span>Poké Mart & Battle Exchange</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        1v1 Rewards
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Earn Battle Tokens by winning <span className="text-rose-300 font-semibold">1v1 Duels</span> and spend them here on Normal, Rare, Super Rare, Mythical, and Legendary treasures!
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center sm:items-end shrink-0 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-amber-500/30">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Your Balance</span>
                  <div className="flex items-center gap-2 text-xl font-black font-display text-amber-400 font-mono">
                    <Coins className="w-5 h-5" />
                    <span>{(account.battleTokens ?? 0).toLocaleString()} <span className="text-xs text-amber-300">BT</span></span>
                  </div>
                </div>
              </div>

              {/* Purchase Toast */}
              {shopToast && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 shadow-lg animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{shopToast}</span>
                </div>
              )}

              {/* Shop Rarity Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                {(
                  [
                    { id: 'all', label: 'All Items' },
                    { id: 'normal', label: 'Normal' },
                    { id: 'rare', label: 'Rare' },
                    { id: 'super_rare', label: 'Super Rare' },
                    { id: 'mythic', label: 'Mythical' },
                    { id: 'legendary', label: 'Legendary' },
                  ] as const
                ).map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => {
                      sound.playButtonPress();
                      setShopFilter(pill.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap border transition-all ${
                      shopFilter === pill.id
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-950'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1">
                {SHOP_ITEMS.filter((item) => {
                  if (shopFilter === 'all') return true;
                  return item.rarity === shopFilter;
                }).map((item) => {
                  const canAfford = (account.battleTokens ?? 0) >= item.cost;
                  const ownedCount = account.inventory?.[item.id] || 0;
                  const isTrainerUnlocked = item.rewardType === 'avatar' && typeof item.rewardValue === 'string' && (account.unlockedTrainerAvatars || []).includes(item.rewardValue);

                  const rarityBadgeClass =
                    item.rarity === 'legendary'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                      : item.rarity === 'mythic'
                      ? 'bg-pink-500/20 text-pink-300 border-pink-400/50'
                      : item.rarity === 'super_rare'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-400/50'
                      : item.rarity === 'rare'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                      : 'bg-slate-800 text-slate-300 border-slate-700';

                  const cardBorderClass =
                    item.rarity === 'legendary'
                      ? 'border-amber-400/60 shadow-lg shadow-amber-950/40 bg-gradient-to-b from-amber-500/10 to-slate-950'
                      : item.rarity === 'mythic'
                      ? 'border-pink-400/60 shadow-lg shadow-pink-950/40 bg-gradient-to-b from-pink-500/10 to-slate-950'
                      : item.rarity === 'super_rare'
                      ? 'border-purple-400/60 shadow-md shadow-purple-950/40 bg-gradient-to-b from-purple-500/10 to-slate-950'
                      : item.rarity === 'rare'
                      ? 'border-cyan-400/60 shadow-md shadow-cyan-950/40 bg-gradient-to-b from-cyan-500/10 to-slate-950'
                      : 'border-slate-800 bg-slate-950/80';

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${cardBorderClass}`}
                    >
                      <div>
                        {/* Header with rarity badge & category */}
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${rarityBadgeClass}`}>
                            {item.rarity.replace('_', ' ')}
                          </span>
                          {ownedCount > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                              Owned: {ownedCount}
                            </span>
                          )}
                        </div>

                        {/* Icon & Title */}
                        <div className="flex items-center gap-3 my-2">
                          <span className="text-3xl p-2 bg-slate-900 rounded-xl border border-slate-800 shrink-0">
                            {item.icon}
                          </span>
                          <div className="overflow-hidden">
                            <h4 className="text-sm font-bold text-white truncate">
                              {item.name}
                            </h4>
                            <span className="text-[10px] text-slate-400 capitalize">
                              {item.category} item
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-400 line-clamp-2 my-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Price & Buy Button */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5 font-bold font-mono text-amber-400">
                          <Coins className="w-4 h-4" />
                          <span className="text-sm">{item.cost === 0 ? 'FREE' : `${item.cost} BT`}</span>
                        </div>

                        {isTrainerUnlocked ? (
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Owned
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={!canAfford}
                            onClick={() => handleBuyShopItem(item)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                              canAfford
                                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95 shadow-md shadow-amber-950'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                            }`}
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>{item.cost === 0 ? 'Claim' : canAfford ? 'Buy' : 'Need BT'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Achievements Tab */}
          {activeTab === 'achievements' && (
            <div className="space-y-4">
              {/* Showcase Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-950/60 to-purple-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold font-display text-white flex items-center gap-2">
                      <span>Profile Showcase Space</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                        {(account.showcasedAchievements || []).length}/3 Selected
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Pin up to 3 of your most prestigious achievements to show off directly on your trainer card!
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sound.playButtonPress();
                    setActiveTab('profile');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-black hover:bg-amber-400 shadow-md transition-all shrink-0"
                >
                  View on Profile ➔
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ACHIEVEMENTS_LIST.map((ach) => {
                  const record = account.achievements[ach.id] || { progress: 0, unlocked: false };
                  const isUnlocked = record.unlocked;
                  const isShowcased = (account.showcasedAchievements || []).includes(ach.id);

                  return (
                    <div
                      key={ach.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                        isShowcased
                          ? 'bg-amber-500/15 border-amber-400 shadow-md shadow-amber-950/30 ring-1 ring-amber-500/40'
                          : isUnlocked
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

                          <div className="flex items-center gap-1.5">
                            {isShowcased && (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" />
                                Showcased
                              </span>
                            )}
                            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              +{ach.rewardTrophyPoints} TP
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 mb-2">{ach.description}</p>
                      </div>

                      {/* Reward preview & Showcase Pin Button */}
                      <div className="pt-2 border-t border-slate-800/60 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
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

                        {isUnlocked && (
                          <button
                            type="button"
                            onClick={() => handleToggleShowcase(ach.id)}
                            className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                              isShowcased
                                ? 'bg-amber-500/20 border border-amber-400 text-amber-300 hover:bg-rose-500/20 hover:border-rose-400 hover:text-rose-300'
                                : (account.showcasedAchievements || []).length >= 3
                                ? 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-amber-300 hover:border-amber-500'
                                : 'bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>
                              {isShowcased
                                ? 'Showcased (Click to Remove)'
                                : (account.showcasedAchievements || []).length >= 3
                                ? 'Showcase Full (3/3) - Click to Swap'
                                : '+ Pin to Profile Showcase'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* REWARDS ROAD & DAILY STREAKS TAB */}
          {activeTab === 'rewards' && (
            <div className="space-y-4">
              {/* Sub-tab switcher */}
              <div className="flex items-center gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800 max-w-sm">
                <button
                  id="btn-subtab-trophy-road"
                  onClick={() => {
                    sound.playClick();
                    setRewardsSubTab('trophy_road');
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    rewardsSubTab === 'trophy_road'
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Trophy Road</span>
                </button>

                <button
                  id="btn-subtab-daily-streak"
                  onClick={() => {
                    sound.playClick();
                    setRewardsSubTab('daily_streak');
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    rewardsSubTab === 'daily_streak'
                      ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Daily Streaks</span>
                </button>
              </div>

              {/* 1. TROPHY ROAD CONTENT */}
              {rewardsSubTab === 'trophy_road' && (
                <div className="space-y-4">
                  {/* Summary Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-slate-950 to-yellow-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-lg">
                        <Trophy className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold font-display text-white">Trainer Trophy Road</h4>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                            {account.trophyPoints.toLocaleString()} Total TP
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Earn Trophy Points in all game modes to claim exclusive avatars, Battle Tokens, music tracks, and league frames!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Trophy Road Milestone Ladder */}
                  <div className="space-y-3">
                    {TROPHY_ROAD_REWARDS.map((reward) => {
                      const isReached = account.trophyPoints >= reward.trophies;
                      const isClaimed = claimedMilestones.includes(reward.trophies);
                      const pointsNeeded = Math.max(0, reward.trophies - account.trophyPoints);

                      const handleClaim = () => {
                        if (!isReached || isClaimed) return;
                        sound.playTrophyUnlock();
                        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });

                        const nextTokens = (account.battleTokens || 0) + reward.tokens;
                        const nextAvatars = [...(account.unlockedTrainerAvatars || [])];
                        if (reward.rewardAvatarId && !nextAvatars.includes(String(reward.rewardAvatarId))) {
                          nextAvatars.push(String(reward.rewardAvatarId));
                        }

                        const updatedAcc: TrainerAccount = {
                          ...account,
                          battleTokens: nextTokens,
                          unlockedTrainerAvatars: nextAvatars,
                        };

                        const nextClaimed = [...claimedMilestones, reward.trophies];
                        setClaimedMilestones(nextClaimed);
                        try {
                          localStorage.setItem(`claimed_milestones_${account.id}`, JSON.stringify(nextClaimed));
                        } catch {
                          // ignore
                        }

                        saveActiveAccount(updatedAcc);
                        onAccountUpdated(updatedAcc);
                      };

                      return (
                        <div
                          key={reward.trophies}
                          className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                            isClaimed
                              ? 'bg-slate-950/60 border-slate-800/80 opacity-80'
                              : isReached
                              ? 'bg-amber-500/15 border-amber-400/50 shadow-lg shadow-amber-950/40'
                              : 'bg-slate-950/40 border-slate-800/50 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center shrink-0">
                              <span className="text-base font-black font-mono text-amber-300">
                                {reward.trophies >= 1000 ? `${reward.trophies / 1000}k` : reward.trophies}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase">TP</span>
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-xs font-bold text-slate-300 font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700">
                                  {reward.rankBadge}
                                </span>
                                <h4 className="text-sm font-bold font-display text-white truncate">
                                  {reward.rewardTitle}
                                </h4>
                                <span className="text-[11px] font-bold text-amber-400">
                                  +{reward.tokens} Tokens
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 line-clamp-1">{reward.description}</p>
                            </div>
                          </div>

                          <div className="shrink-0 w-full sm:w-auto text-right">
                            {isClaimed ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Claimed</span>
                              </span>
                            ) : isReached ? (
                              <button
                                onClick={handleClaim}
                                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/40 animate-bounce"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Claim Reward</span>
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900/80 text-slate-500 text-xs font-medium border border-slate-800">
                                <Lock className="w-3.5 h-3.5" />
                                <span>{pointsNeeded} TP needed</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. DAILY STREAK CONTENT */}
              {rewardsSubTab === 'daily_streak' && (
                <div className="space-y-4">
                  {/* Streak Status Card */}
                  {(() => {
                    const streakCount = account.dailyStreak || 1;
                    const streakMultiplier = (1.0 + Math.min(1.0, (streakCount - 1) * 0.1)).toFixed(1);

                    return (
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/20 via-slate-950 to-amber-500/20 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0 shadow-lg">
                            <Flame className="w-6 h-6 fill-current" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-bold font-display text-white">Daily Training Streaks</h4>
                              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                                {streakCount}-Day Streak Active
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Log in every 24 hours (Midnight IST cycle) to keep your streak alive, compound score multipliers, and unlock rare rewards!
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs text-slate-400 block">Active Multiplier:</span>
                          <span className="text-xl font-mono font-black text-amber-300">
                            {streakMultiplier}x Boost
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 30-Day Rewards Ladder Schedule */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {DAILY_STREAK_REWARDS.map((streakItem) => {
                      const cur = account.dailyStreak || 1;
                      const isCompleted = cur >= streakItem.day;
                      const isCurrent = cur === streakItem.day;

                      return (
                        <div
                          key={streakItem.day}
                          className={`p-4 rounded-2xl border transition-all ${
                            isCurrent
                              ? 'bg-rose-500/15 border-rose-400/50 shadow-lg shadow-rose-950/40'
                              : isCompleted
                              ? 'bg-slate-950/60 border-slate-800 opacity-75'
                              : 'bg-slate-950/40 border-slate-800/50 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-mono font-bold text-amber-300">
                                D{streakItem.day}
                              </span>
                              <h4 className="text-xs sm:text-sm font-bold font-display text-white">
                                {streakItem.title}
                              </h4>
                            </div>

                            {isCompleted ? (
                              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Completed</span>
                              </span>
                            ) : isCurrent ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                                Today&apos;s Goal
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono">
                                Upcoming
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-amber-400 font-bold mb-1">
                            <span>+{streakItem.tokens} Tokens</span>
                            <span>•</span>
                            <span>+{streakItem.trophyPointsBonus} TP</span>
                            {streakItem.specialItem && (
                              <>
                                <span>•</span>
                                <span className="text-purple-300 font-normal">{streakItem.specialItem}</span>
                              </>
                            )}
                          </div>

                          <p className="text-xs text-slate-400">{streakItem.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Gym Badges Tab (ALL 9 REGIONS + SPECIAL CRESTS) */}
          {activeTab === 'badges' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-slate-950/60 to-indigo-500/10 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center shrink-0">
                    <Medal className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold font-display text-white flex items-center gap-2">
                      <span>Official Badges of All 9 Pokémon Regions</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40">
                        9 Regions + Special Badges
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Master badges from Kanto, Johto, Hoenn, Sinnoh, Unova, Kalos, Alola, Galar, Paldea, plus Paldea Titans, Team Star, Battle Frontier, and Champion Crests!
                    </p>
                  </div>
                </div>
              </div>

              {/* Regional & Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {['All', 'Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola', 'Galar', 'Paldea', 'Paldea Titans', 'Paldea Team Star', 'Battle Frontier', 'Champion Crests'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      sound.playClick();
                      setBadgeRegion(cat);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                      badgeRegion === cat
                        ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40 shadow-sm'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[55vh] overflow-y-auto pr-1">
                {(() => {
                  const displayBadges: GymBadgeInfo[] = [];
                  Object.entries(ALL_REGIONAL_BADGES).forEach(([regionKey, badges]) => {
                    if (badgeRegion === 'All' || badgeRegion === regionKey) {
                      displayBadges.push(...badges);
                    }
                  });

                  return displayBadges.map((badge) => {
                    const isEarned = !!account.achievements[badge.id]?.unlocked;
                    return (
                      <div
                        key={badge.id}
                        className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
                          isEarned
                            ? 'bg-purple-500/15 border-purple-400/50 shadow-md shadow-purple-950/30'
                            : 'bg-slate-950/60 border-slate-800/80 opacity-60'
                        }`}
                      >
                        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-3xl select-none shrink-0 shadow-inner">
                          {badge.emoji}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="text-sm font-bold font-display text-white flex items-center gap-1.5 truncate">
                              {isEarned ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              )}
                              <span>{badge.name}</span>
                            </h4>
                            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                              +{badge.rewardTrophyPoints} TP
                            </span>
                          </div>

                          <div className="text-[11px] text-purple-300 font-semibold mb-1">
                            {badge.gymLeader} • {badge.town} ({badge.region})
                          </div>

                          <p className="text-xs text-slate-400 mb-2">{badge.description}</p>

                          <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/60">
                            <span className="text-slate-500">Type: {badge.type}</span>
                            <span className={isEarned ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                              {isEarned ? '★ Conquered & Displayed' : 'Locked (Battle in Arena)'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* 5. Friend List Tab */}
          {activeTab === 'friends' && (
            <div className="space-y-4">
              {/* User's Own Unique Username Card */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold font-display text-white flex items-center gap-2">
                      <span>Your Trainer Username</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                        Unique Trainer ID
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Share your unique username with friends so they can add you to their friend network:
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-purple-500/40 text-purple-300 font-mono font-bold text-xs">
                    @{account.username || account.displayName.toLowerCase().replace(/\s+/g, '_')}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUsername}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    {copiedUsername ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUsername ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Add Friend by Specific Username Form */}
              <form onSubmit={handleAddFriend} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold font-display text-white flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  <span>Add Friend by Username</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Type any trainer&apos;s unique username to add them to your friend roster. All usernames in Pokémon Arena are completely unique!
                </p>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={newFriendName}
                      onChange={(e) => {
                        setNewFriendName(e.target.value);
                        setFriendError('');
                        setFriendSuccess('');
                      }}
                      placeholder="Type specific username (e.g. Red, Champion Cynthia, Ash)..."
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Friend</span>
                  </button>
                </div>

                {friendError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{friendError}</span>
                  </div>
                )}

                {friendSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{friendSuccess}</span>
                  </div>
                )}
              </form>

              {/* Friends Roster */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Your Friends ({(account.friends || []).length})
                  </h4>
                </div>

                {(!account.friends || account.friends.length === 0) ? (
                  <div className="p-6 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-center">
                    <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 mb-2">You don&apos;t have any friends added yet.</p>
                    <p className="text-[11px] text-slate-500">
                      Use the form above to add your friends by their unique usernames!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {account.friends.map((friendName) => (
                      <div
                        key={friendName}
                        className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-300 flex items-center justify-center font-bold font-display text-sm">
                            {friendName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h5 className="text-sm font-bold text-white">{friendName}</h5>
                            <span className="text-[11px] text-purple-300 font-mono">
                              @{friendName.toLowerCase().replace(/\s+/g, '_')}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFriend(friendName)}
                          className="text-xs text-slate-500 hover:text-rose-400 px-2.5 py-1 rounded-lg hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all"
                          title="Remove Friend"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
