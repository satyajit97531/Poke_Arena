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
  QrCode,
  Camera,
  Clock,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { Achievement, Pokemon, ShopItem, TrainerAccount, FriendRequest } from '../types/pokemon';
import { ACHIEVEMENTS_LIST, KANTO_BADGES } from '../data/achievements';
import { CURATED_POKEMON, OFFICIAL_ARTWORK_URL } from '../data/pokemonData';
import { SHOP_ITEMS } from '../data/shopItems';
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
  initialTab?: 'profile' | 'avatars' | 'friends' | 'battles';
  onOpenAchievements?: () => void;
  onOpenBadges?: (region?: string) => void;
  onOpenShop?: () => void;
  onStartDuelWithFriend?: (friendName: string, roomCode?: string) => void;
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
  onStartDuelWithFriend,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'avatars' | 'friends' | 'battles'>(initialTab);
  const [avatarFilter, setAvatarFilter] = useState<'all' | 'unlocked' | 'champions' | 'gym_leaders' | 'special'>('all');
  const [inspectTrainer, setInspectTrainer] = useState<TrainerAvatar | null>(null);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);
  const [newFriendName, setNewFriendName] = useState('');
  const [copiedUsername, setCopiedUsername] = useState(false);
  const [friendError, setFriendError] = useState('');
  const [friendSuccess, setFriendSuccess] = useState('');
  const [copiedTrainerCode, setCopiedTrainerCode] = useState(false);
  const [challengeToast, setChallengeToast] = useState<string | null>(null);
  const [achFilter, setAchFilter] = useState<'all' | 'badges' | 'speed' | 'modes' | 'streak' | 'collector'>('all');

  // Friend System Extended State
  const [friendSubTab, setFriendSubTab] = useState<'friends' | 'received' | 'sent'>('friends');
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [onlineStatusMap, setOnlineStatusMap] = useState<Record<string, boolean>>({});
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrActiveTab, setQrActiveTab] = useState<'my_qr' | 'scan_qr'>('my_qr');
  const [scannedInput, setScannedInput] = useState('');
  const [friendActionLoading, setFriendActionLoading] = useState<string | null>(null);
  const [confirmRemoveFriend, setConfirmRemoveFriend] = useState<string | null>(null);
  const [challengeRoomInfo, setChallengeRoomInfo] = useState<{ friendName: string; roomCode: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);

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

  // Sync and poll friend requests & friend roster
  const loadFriendData = React.useCallback(async () => {
    try {
      const uname = account.username || account.displayName;
      const friendsParam = encodeURIComponent(JSON.stringify(account.friends || []));
      const res = await fetch(`/api/friends/data/${encodeURIComponent(account.id)}?username=${encodeURIComponent(uname)}&friends=${friendsParam}`);
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.friends)) {
          if (JSON.stringify(data.friends) !== JSON.stringify(account.friends || [])) {
            const updated = { ...account, friends: data.friends };
            saveActiveAccount(updated);
            onAccountUpdated(updated);
          }
        }
        if (data.onlineStatus && typeof data.onlineStatus === 'object') {
          setOnlineStatusMap(data.onlineStatus);
        }
        setReceivedRequests(data.received || []);
        setSentRequests(data.sent || []);
      }
    } catch (err) {
      console.error('Error fetching friend system data:', err);
    }
  }, [account, onAccountUpdated]);

  useEffect(() => {
    if (isOpen && activeTab === 'friends') {
      loadFriendData();
      const interval = setInterval(loadFriendData, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, activeTab, loadFriendData]);

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

  // Send friend request by User ID, @username, or display name
  const handleSendFriendRequest = async (targetQuery: string) => {
    const clean = targetQuery.trim().replace(/^@/, '');
    if (!clean) {
      setFriendError('Please enter a Trainer ID or username.');
      return;
    }
    const myUname = (account.username || account.displayName).toLowerCase().replace(/\s+/g, '_');
    if (clean.toLowerCase() === myUname || clean === account.id) {
      setFriendError('You cannot send a friend request to yourself.');
      return;
    }
    if ((account.friends || []).length >= 100) {
      setFriendError('You have reached the maximum limit of 100 friends.');
      return;
    }
    if ((account.friends || []).some((f) => f.toLowerCase() === clean.toLowerCase())) {
      setFriendError(`@${clean} is already on your friends list!`);
      return;
    }

    setFriendError('');
    setFriendSuccess('');
    setFriendActionLoading('send');

    try {
      const res = await fetch('/api/friends/send-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: account.id,
          fromUsername: account.username || account.displayName.toLowerCase().replace(/\s+/g, '_'),
          fromDisplayName: account.displayName,
          fromAvatarId: account.avatarId || 25,
          targetQuery: clean,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFriendError(data.error || 'Failed to send friend request.');
        sound.playWrong();
        return;
      }

      sound.playCorrect();
      setNewFriendName('');
      setScannedInput('');
      setFriendSuccess(data.message || `Friend request sent to @${clean}!`);
      setChallengeToast(`Friend request dispatched to @${clean}!`);
      setTimeout(() => setChallengeToast(null), 3000);
      loadFriendData();
      setFriendSubTab('sent');
      setTimeout(() => setFriendSuccess(''), 4000);
    } catch {
      setFriendError('Network error connecting to friend server.');
      sound.playWrong();
    } finally {
      setFriendActionLoading(null);
    }
  };

  const handleAddFriendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendFriendRequest(newFriendName);
  };

  // Respond to friend request (Accept or Reject)
  const handleRespondFriendRequest = async (requestId: string, action: 'accept' | 'reject') => {
    setFriendActionLoading(requestId);
    setFriendError('');
    setFriendSuccess('');
    try {
      const res = await fetch('/api/friends/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          action,
          userId: account.id,
          username: account.username || account.displayName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (action === 'accept') {
          sound.playFanfare();
          triggerConfetti();
          setFriendSuccess(data.message || 'Friend request accepted!');
          if (data.friendName) {
            const currentFriends = account.friends || [];
            if (!currentFriends.includes(data.friendName) && currentFriends.length < 100) {
              const updatedAcc = { ...account, friends: [...currentFriends, data.friendName] };
              saveActiveAccount(updatedAcc);
              onAccountUpdated(updatedAcc);
            }
          }
        } else {
          sound.playButtonBack();
          setFriendSuccess('Friend request rejected.');
        }
        loadFriendData();
        setTimeout(() => setFriendSuccess(''), 3000);
      } else {
        setFriendError(data.error || 'Failed to resolve request.');
        sound.playWrong();
      }
    } catch {
      setFriendError('Network error resolving friend request.');
      sound.playWrong();
    } finally {
      setFriendActionLoading(null);
    }
  };

  // Cancel sent friend request
  const handleCancelSentRequest = async (requestId: string) => {
    setFriendActionLoading(requestId);
    try {
      const res = await fetch('/api/friends/cancel-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (data.success) {
        sound.playButtonBack();
        setFriendSuccess('Friend request cancelled.');
        loadFriendData();
        setTimeout(() => setFriendSuccess(''), 3000);
      }
    } catch {
      setFriendError('Failed to cancel request.');
    } finally {
      setFriendActionLoading(null);
    }
  };

  // Remove friend from roster
  const handleRemoveFriend = async (name: string) => {
    sound.playButtonBack();
    const currentFriends = account.friends || [];
    const updatedFriends = currentFriends.filter((f) => f !== name);
    const updatedAcc: TrainerAccount = {
      ...account,
      friends: updatedFriends,
    };
    saveActiveAccount(updatedAcc);
    onAccountUpdated(updatedAcc);
    setConfirmRemoveFriend(null);

    try {
      await fetch('/api/friends/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: account.id,
          username: account.username || account.displayName,
          friendName: name,
        }),
      });
    } catch {
      // offline fallback already handled
    }
    setFriendSuccess(`Removed ${name} from your friends.`);
    setTimeout(() => setFriendSuccess(''), 3000);
  };

  // Send 1v1 Battle Challenge to friend
  const handleChallengeFriend = async (friendName: string) => {
    sound.playClick();
    setFriendActionLoading(`challenge_${friendName}`);
    try {
      const res = await fetch('/api/friends/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: account.id,
          fromUsername: account.username || account.displayName,
          fromDisplayName: account.displayName,
          fromAvatarId: account.avatarId || 25,
          toFriendName: friendName,
          difficulty: 'extreme',
        }),
      });
      const data = await res.json();
      if (data.success && data.roomCode) {
        sound.playFanfare();
        setChallengeRoomInfo({ friendName, roomCode: data.roomCode });
      } else {
        setFriendError(data.error || 'Failed to dispatch challenge.');
      }
    } catch {
      setFriendError('Network error creating battle challenge.');
    } finally {
      setFriendActionLoading(null);
    }
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

  const handleUnlockTrainerWithTokens = (trainer: TrainerAvatar) => {
    const currentTokens = account.battleTokens ?? 0;
    if (currentTokens < trainer.tokenCost) return;
    sound.playButtonPress();
    const nextTokens = currentTokens - trainer.tokenCost;
    const nextUnlockedTrainers = Array.from(
      new Set([...(account.unlockedTrainerAvatars || ['red', 'pikachu']), trainer.id])
    );
    const updated: TrainerAccount = {
      ...account,
      battleTokens: nextTokens,
      unlockedTrainerAvatars: nextUnlockedTrainers,
      trainerAvatarId: trainer.id,
      avatarId: trainer.numericId || 25,
    };
    saveActiveAccount(updated);
    onAccountUpdated(updated);
    sound.playTrophyUnlock();
    confetti({ particleCount: 45, spread: 70, origin: { y: 0.6 } });
    setInspectTrainer(null);
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
              <span>Friends ({(account.friends || []).length}/100)</span>
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
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-white">Trainer Account</h5>
                    <p className="text-[11px] text-slate-400">
                      Signed in as <span className="text-purple-300 font-semibold font-mono">@{account.username || account.displayName.toLowerCase().replace(/\s+/g, '_')}</span>
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
                      {TRAINER_AVATARS.filter((t) => isTrainerUnlocked(t)).length} / {TRAINER_AVATARS.length} Unlocked
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Equip iconic Pokémon Trainers (Red, Blue, Brock, Misty, Cynthia, Ash & more) or Pikachu. Tap any locked trainer to view requirements or unlock with Battle Tokens!
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
                    { id: 'all', label: 'All Trainers & Pikachu' },
                    { id: 'unlocked', label: 'My Unlocked' },
                    { id: 'champions', label: 'Champions & Monarchs' },
                    { id: 'gym_leaders', label: 'Gym Leaders' },
                    { id: 'special', label: 'Special & Coordinators' },
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
                {TRAINER_AVATARS.filter((trainer) => {
                  if (avatarFilter === 'unlocked') return isTrainerUnlocked(trainer);
                  const cat = trainer.category || (trainer.role.toLowerCase().includes('champion') ? 'champion' : trainer.role.toLowerCase().includes('gym') ? 'gym_leader' : 'coordinator_special');
                  if (avatarFilter === 'champions') return cat === 'champion';
                  if (avatarFilter === 'gym_leaders') return cat === 'gym_leader';
                  if (avatarFilter === 'special') return cat === 'coordinator_special';
                  return true;
                }).map((trainer) => {
                  const isUnlocked = isTrainerUnlocked(trainer);
                  const isEquipped = isTrainerEquipped(trainer);
                  const frameStyle = trainer.frameBorder || getTrainerFrameBorder(trainer.rarity);
                  const badgeStyle = trainer.badgeClass || getTrainerBadgeClass(trainer.rarity);

                  return (
                    <div
                      key={`trainer-avatar-${trainer.id}`}
                      onClick={() => {
                        sound.playButtonPress();
                        if (isUnlocked) {
                          handleEquipTrainer(trainer);
                        } else {
                          setInspectTrainer(trainer);
                        }
                      }}
                      className={`relative flex flex-col items-center p-3 rounded-2xl cursor-pointer transition-all hover:scale-[1.03] active:scale-[0.98] ${
                        frameStyle
                      } ${
                        isEquipped
                          ? 'ring-2 ring-rose-400 shadow-xl shadow-rose-950'
                          : isUnlocked
                          ? 'hover:brightness-110'
                          : 'opacity-70 hover:opacity-100'
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
                        ) : isUnlocked ? (
                          <span className="text-[10px] font-bold text-emerald-400">
                            Tap to Equip
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-400 flex items-center justify-center gap-1">
                            <Info className="w-2.5 h-2.5" /> {trainer.tokenCost} BT
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Locked Trainer Inspector Modal */}
              {inspectTrainer && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/40 shadow-2xl flex flex-col sm:flex-row items-center gap-4">
                  <div className={`w-24 h-24 rounded-2xl p-2 flex items-center justify-center shrink-0 ${inspectTrainer.frameBorder || getTrainerFrameBorder(inspectTrainer.rarity)}`}>
                    <img
                      src={inspectTrainer.spriteUrl}
                      alt={inspectTrainer.name}
                      className="max-h-20 w-auto object-contain drop-shadow"
                    />
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                      <h4 className="text-lg font-bold font-display text-white">
                        {inspectTrainer.name}
                      </h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${inspectTrainer.badgeClass || getTrainerBadgeClass(inspectTrainer.rarity)}`}>
                        {inspectTrainer.rarity}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-950 text-slate-300 border border-slate-800">
                        {inspectTrainer.region} Region
                      </span>
                    </div>

                    <p className="text-xs text-amber-300/90 font-medium mb-1">
                      {inspectTrainer.title}
                    </p>

                    <div className="text-xs text-slate-300 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 mb-2">
                      <p className="mb-1 text-slate-200">{inspectTrainer.description || inspectTrainer.role}</p>
                      <div className="text-[11px] text-amber-400 flex items-center gap-1">
                        <Info className="w-3 h-3 shrink-0" />
                        <span>How to Unlock: {inspectTrainer.howToUnlock}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                    {inspectTrainer.tokenCost > 0 && (
                      <button
                        type="button"
                        disabled={(account.battleTokens ?? 0) < inspectTrainer.tokenCost}
                        onClick={() => handleUnlockTrainerWithTokens(inspectTrainer)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${
                          (account.battleTokens ?? 0) >= inspectTrainer.tokenCost
                            ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer shadow-amber-950'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>Unlock for {inspectTrainer.tokenCost} BT</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setInspectTrainer(null)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Friends Tab with 3 Subtabs (Friends, Received, Sent) */}
          {activeTab === 'friends' && (
            <div className="space-y-4">
              {/* User's Trainer Identity & Quick QR Buttons */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold font-display text-white flex items-center gap-2 flex-wrap">
                      <span>Trainer ID & Username</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                        Max 100 Friends
                      </span>
                    </h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 font-mono text-xs">
                        ID: <strong className="text-amber-400">{account.id}</strong>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-purple-500/40 text-purple-300 font-mono text-xs font-bold">
                        @{account.username || account.displayName.toLowerCase().replace(/\s+/g, '_')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playButtonPress();
                      setQrActiveTab('my_qr');
                      setIsQrModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-950/30"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>My QR Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playButtonPress();
                      setQrActiveTab('scan_qr');
                      setIsQrModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Scan / Add QR</span>
                  </button>
                </div>
              </div>

              {/* Add Friend by ID or Username */}
              <form onSubmit={handleAddFriendSubmit} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold font-display text-white flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-emerald-400" />
                    <span>Send Friend Request</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {(account.friends || []).length}/100 Friends
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Search by Trainer ID (e.g. <span className="font-mono text-slate-300">{account.id}</span>) or unique <span className="text-purple-300 font-mono">@username</span>.
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
                      placeholder="Enter Trainer ID or @username..."
                      disabled={(account.friends || []).length >= 100}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={friendActionLoading === 'send' || !newFriendName.trim() || (account.friends || []).length >= 100}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0"
                  >
                    {friendActionLoading === 'send' ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Send Request</span>
                  </button>
                </div>

                {(account.friends || []).length >= 100 && (
                  <p className="text-xs text-amber-400 font-medium">
                    Maximum limit of 100 friends reached! Remove an existing friend to add more.
                  </p>
                )}

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

              {/* 3 Subtabs Navigation: Friends, Received, Sent */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.playButtonPress();
                    setFriendSubTab('friends');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    friendSubTab === 'friends'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Friends ({(account.friends || []).length}/100)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playButtonPress();
                    setFriendSubTab('received');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all relative ${
                    friendSubTab === 'received'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Received Friend Requests</span>
                  {receivedRequests.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                      {receivedRequests.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playButtonPress();
                    setFriendSubTab('sent');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all relative ${
                    friendSubTab === 'sent'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Sent Friend Requests</span>
                  {sentRequests.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-purple-500 text-white font-black text-[10px] flex items-center justify-center">
                      {sentRequests.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Subtab 1: Friends Roster */}
              {friendSubTab === 'friends' && (
                <div className="space-y-2.5">
                  {(!account.friends || account.friends.length === 0) ? (
                    <div className="p-8 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-center">
                      <Users className="w-9 h-9 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 mb-1 font-semibold">You don&apos;t have any friends added yet.</p>
                      <p className="text-[11px] text-slate-500">
                        Share your unique QR code or enter a Trainer ID / @username above to add friends!
                      </p>
                      <div className="mt-3.5 flex flex-wrap justify-center items-center gap-1.5">
                        <span className="text-[11px] text-slate-400">Quick Add:</span>
                        {['Trainer Blue', 'Champion Cynthia', 'Gym Leader Brock'].map((suggested) => (
                          <button
                            key={suggested}
                            type="button"
                            onClick={() => {
                              setNewFriendName(suggested);
                              handleSendFriendRequest(suggested);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700/70 transition-all flex items-center gap-1 shadow-sm"
                          >
                            <UserPlus className="w-3 h-3 text-emerald-400" />
                            <span>{suggested}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {account.friends.map((friendName) => {
                        const isOnline = Boolean(onlineStatusMap[friendName]);
                        return (
                        <div
                          key={friendName}
                          className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative shrink-0">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-300 flex items-center justify-center font-bold font-display text-sm">
                                {friendName.charAt(0).toUpperCase()}
                              </div>
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
                                  isOnline
                                    ? 'bg-emerald-400 shadow-sm shadow-emerald-500/60 animate-pulse'
                                    : 'bg-slate-600'
                                }`}
                                title={isOnline ? 'Online' : 'Offline'}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h5 className="text-xs sm:text-sm font-bold text-white truncate">{friendName}</h5>
                                {isOnline ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Online
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[9px] text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                                    Offline
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-purple-300 font-mono truncate block">
                                @{friendName.toLowerCase().replace(/\s+/g, '_')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* 1v1 Battle Challenge Button */}
                            <button
                              type="button"
                              onClick={() => handleChallengeFriend(friendName)}
                              disabled={friendActionLoading === `challenge_${friendName}`}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1 transition-all"
                              title="Challenge friend to 1v1 Battle"
                            >
                              <Swords className="w-3.5 h-3.5" />
                              <span>Challenge</span>
                            </button>

                            {/* Remove Friend Button */}
                            {confirmRemoveFriend === friendName ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFriend(friendName)}
                                  className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmRemoveFriend(null)}
                                  className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 text-[11px]"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmRemoveFriend(friendName)}
                                className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all"
                                title="Remove Friend"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Subtab 2: Received Friend Requests */}
              {friendSubTab === 'received' && (
                <div className="space-y-2.5">
                  {receivedRequests.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-center">
                      <Mail className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-semibold">no friend requests received</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {receivedRequests.map((req) => (
                        <div
                          key={req.id}
                          className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 text-cyan-300 flex items-center justify-center font-bold text-sm">
                              {req.fromDisplayName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="text-sm font-bold text-white">{req.fromDisplayName}</h5>
                                <span className="text-[10px] text-purple-300 font-mono">@{req.fromUsername}</span>
                              </div>
                              <p className="text-[10px] text-slate-400">
                                Sent a friend request • {new Date(req.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRespondFriendRequest(req.id, 'accept')}
                              disabled={friendActionLoading === req.id}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition-all shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRespondFriendRequest(req.id, 'reject')}
                              disabled={friendActionLoading === req.id}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-all border border-slate-700"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Subtab 3: Sent Friend Requests */}
              {friendSubTab === 'sent' && (
                <div className="space-y-2.5">
                  {sentRequests.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-center">
                      <Send className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-semibold">u haven&apos;t send any friend requests</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sentRequests.map((req) => (
                        <div
                          key={req.id}
                          className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center font-bold text-xs">
                              @{req.toUsername.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="text-xs sm:text-sm font-bold text-white">To: @{req.toUsername}</h5>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Pending approval
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400">
                                Dispatched • {new Date(req.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCancelSentRequest(req.id)}
                            disabled={friendActionLoading === req.id}
                            className="text-xs text-slate-400 hover:text-rose-400 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 transition-all flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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
                    Challenge friends to 1v1 duels or enter the online PvP arena to record your match history!
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

          {/* QR Code & Scanner Modal */}
          {isQrModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-base font-bold text-white font-display">Friend QR Code</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsQrModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Switcher: My QR vs Scan/Enter */}
                <div className="flex gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setQrActiveTab('my_qr')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      qrActiveTab === 'my_qr'
                        ? 'bg-cyan-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    My QR Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrActiveTab('scan_qr')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      qrActiveTab === 'scan_qr'
                        ? 'bg-cyan-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Scan / Add by QR
                  </button>
                </div>

                {qrActiveTab === 'my_qr' ? (
                  <div className="text-center space-y-3 py-1">
                    <div className="p-4 bg-slate-950 rounded-2xl border-2 border-cyan-500/40 inline-block mx-auto shadow-lg shadow-cyan-950/40">
                      <QRCodeSVG
                        value={`${window.location.origin}${window.location.pathname}?addFriend=${encodeURIComponent(account.username || account.id)}`}
                        size={170}
                        bgColor="#020617"
                        fgColor="#38bdf8"
                        level="M"
                      />
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white">{account.displayName}</h4>
                      <p className="text-xs text-purple-300 font-mono">
                        @{account.username || account.displayName.toLowerCase().replace(/\s+/g, '_')}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">Trainer ID: {account.id}</p>
                    </div>

                    <div className="flex gap-2 justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          sound.playButtonPress();
                          navigator.clipboard.writeText(account.id);
                          setCopiedUserId(true);
                          setTimeout(() => setCopiedUserId(false), 2000);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5"
                      >
                        {copiedUserId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedUserId ? 'ID Copied!' : 'Copy ID'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          sound.playButtonPress();
                          const link = `${window.location.origin}${window.location.pathname}?addFriend=${encodeURIComponent(account.username || account.id)}`;
                          navigator.clipboard.writeText(link);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 py-1">
                    <p className="text-xs text-slate-300">
                      Scan a trainer&apos;s QR code or paste their friend link / Trainer ID below to add them instantly:
                    </p>

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={scannedInput}
                        onChange={(e) => setScannedInput(e.target.value)}
                        placeholder="Paste QR code text, link, or Trainer ID..."
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-cyan-500"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          let clean = scannedInput.trim();
                          if (clean.includes('addFriend=')) {
                            try {
                              const url = new URL(clean, window.location.origin);
                              clean = url.searchParams.get('addFriend') || clean;
                            } catch {
                              // ignore
                            }
                          }
                          if (clean) {
                            handleSendFriendRequest(clean);
                            setIsQrModalOpen(false);
                          }
                        }}
                        disabled={!scannedInput.trim()}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Send Friend Request Now</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 1v1 Battle Challenge Dispatched Dialog */}
          {challengeRoomInfo && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-sm bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
                  <Swords className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-lg font-bold font-display text-white">1v1 Battle Dispatched!</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Challenged <strong className="text-amber-300">{challengeRoomInfo.friendName}</strong> to an Extreme 1v1 Battle!
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Battle Room Code</span>
                  <span className="text-xl font-mono font-black text-amber-400 tracking-wider">
                    {challengeRoomInfo.roomCode}
                  </span>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playTrophyUnlock();
                      if (onStartDuelWithFriend) {
                        onStartDuelWithFriend(challengeRoomInfo.friendName, challengeRoomInfo.roomCode);
                      }
                      setChallengeRoomInfo(null);
                      onClose();
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40"
                  >
                    <Swords className="w-4 h-4" />
                    <span>Enter Battle Arena Now</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(challengeRoomInfo.roomCode);
                      sound.playButtonPress();
                      setChallengeRoomInfo(null);
                    }}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Copy Room Code & Close
                  </button>
                </div>
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
