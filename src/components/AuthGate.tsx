import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
  Smartphone,
  Send,
  Check,
  KeyRound,
  Shield,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TrainerAccount } from '../types/pokemon';
import { saveActiveAccount } from '../utils/accounts';
import { sound } from '../utils/audio';
import { isValidEmail, getEmailValidationError } from '../utils/validation';

interface AuthGateProps {
  onAuthenticated: (account: TrainerAccount) => void;
}

const COUNTRY_CODES = [
  { code: '+91', label: '🇮🇳 India (+91)' },
  { code: '+1', label: '🇺🇸 / 🇨🇦 USA / Canada (+1)' },
  { code: '+44', label: '🇬🇧 UK (+44)' },
  { code: '+81', label: '🇯🇵 Japan (+81)' },
  { code: '+61', label: '🇦🇺 Australia (+61)' },
  { code: '+49', label: '🇩🇪 Germany (+49)' },
  { code: '+33', label: '🇫🇷 France (+33)' },
  { code: '+971', label: '🇦🇪 UAE (+971)' },
  { code: '+65', label: '🇸🇬 Singapore (+65)' },
];

export const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticated }) => {
  // Method: Email or Mobile
  const [authMethod, setAuthMethod] = useState<'email' | 'mobile'>('email');

  // Sub-tab for Email (Sign Up or Log In)
  const [emailTab, setEmailTab] = useState<'signup' | 'login'>('signup');

  // Steps
  const [emailSignupStep, setEmailSignupStep] = useState<'details' | 'otp'>('details');
  const [emailLoginStep, setEmailLoginStep] = useState<'credentials' | 'otp'>('credentials');
  const [mobileStep, setMobileStep] = useState<'phone' | 'otp'>('phone');

  // Form inputs
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Mobile inputs
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');

  // OTP inputs
  const [otpCode, setOtpCode] = useState('');

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Resend Countdown Timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Strict email validation helpers
  const cleanEmail = email.trim().toLowerCase();
  const isEmailValid = isValidEmail(cleanEmail);
  const isEmailEmpty = cleanEmail.length === 0;
  const showEmailError = (emailTouched || cleanEmail.length > 0) && !isEmailValid;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
      });
    } catch {
      // ignore
    }
  };

  const getFullPhoneNumber = () => {
    const cleanDigits = phoneNumber.trim().replace(/\D/g, '');
    return `${countryCode}${cleanDigits}`;
  };

  // -------------------------------------------------------------
  // 1. EMAIL SIGNUP: STEP 1 - Request Signup OTP
  // -------------------------------------------------------------
  const handleRequestSignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setEmailTouched(true);

    if (!cleanEmail) {
      setError('Email address is required. Please enter your email to sign up.');
      sound.playWrong();
      return;
    }

    const validationError = getEmailValidationError(cleanEmail);
    if (validationError) {
      setError(validationError);
      sound.playWrong();
      return;
    }

    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters long.');
      sound.playWrong();
      return;
    }

    setIsLoading(true);
    sound.playButtonPress();

    try {
      const res = await fetch('/api/auth/send-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.isExisting) {
          setError('This email is already registered! Switch to Log In to enter Arena.');
        } else {
          setError(data.error || 'Failed to send OTP code.');
        }
        sound.playWrong();
        setIsLoading(false);
        return;
      }

      setSuccessMessage(data.message || `Verification code sent to ${cleanEmail}! Please check your inbox.`);
      setOtpCode('');
      setEmailSignupStep('otp');
      setResendTimer(30);
      sound.playCorrect();
    } catch {
      setError('Server connection error. Please ensure server is reachable.');
      sound.playWrong();
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 1. EMAIL SIGNUP: STEP 2 - Verify OTP & Create Account
  // -------------------------------------------------------------
  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the complete 6-digit OTP code sent to your email.');
      sound.playWrong();
      return;
    }

    setIsLoading(true);
    sound.playButtonPress();

    try {
      const res = await fetch('/api/auth/verify-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          otp: cleanOtp,
          password,
          displayName: displayName.trim() || cleanEmail.split('@')[0],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid or expired OTP code.');
        sound.playWrong();
        setIsLoading(false);
        return;
      }

      const newAccount: TrainerAccount = data.account;
      saveActiveAccount(newAccount);
      sound.playTrophyUnlock();
      triggerConfetti();
      setSuccessMessage(`🎉 Welcome, Trainer ${newAccount.displayName}! Entering Arena...`);

      setTimeout(() => {
        onAuthenticated(newAccount);
      }, 700);
    } catch {
      setError('Server error while verifying signup code. Please try again.');
      sound.playWrong();
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 2. EMAIL LOGIN: STEP 1 - Send Login OTP
  // -------------------------------------------------------------
  const handleRequestLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setEmailTouched(true);

    if (!cleanEmail) {
      setError('Email address is required. Please enter your email to log in.');
      sound.playWrong();
      return;
    }

    const validationError = getEmailValidationError(cleanEmail);
    if (validationError) {
      setError(validationError);
      sound.playWrong();
      return;
    }

    if (!password) {
      setError('Please enter your account password.');
      sound.playWrong();
      return;
    }

    setIsLoading(true);
    sound.playButtonPress();

    try {
      const res = await fetch('/api/auth/send-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.isRegistered === false) {
          setError('No trainer account found with this email. Please check email or Sign Up.');
        } else {
          setError(data.error || 'Failed to send login verification code.');
        }
        sound.playWrong();
        setIsLoading(false);
        return;
      }

      setSuccessMessage(data.message || `Login verification code sent to ${cleanEmail}! Please check your inbox.`);
      setOtpCode('');
      setEmailLoginStep('otp');
      setResendTimer(30);
      sound.playCorrect();
    } catch {
      setError('Server error during log in request. Please try again.');
      sound.playWrong();
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 2. EMAIL LOGIN: STEP 2 - Verify Login OTP
  // -------------------------------------------------------------
  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the complete 6-digit OTP code sent to your email.');
      sound.playWrong();
      return;
    }

    setIsLoading(true);
    sound.playButtonPress();

    try {
      const res = await fetch('/api/auth/verify-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          otp: cleanOtp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid or expired OTP code.');
        sound.playWrong();
        setIsLoading(false);
        return;
      }

      const loggedAccount: TrainerAccount = data.account;
      saveActiveAccount(loggedAccount);
      sound.playCorrect();
      setSuccessMessage(`Welcome back, Trainer ${loggedAccount.displayName}!`);

      setTimeout(() => {
        onAuthenticated(loggedAccount);
      }, 600);
    } catch {
      setError('Server error while verifying login OTP. Please try again.');
      sound.playWrong();
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 3. MOBILE NUMBER: STEP 1 - Send SMS OTP
  // -------------------------------------------------------------
  const handleRequestPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const rawDigits = phoneNumber.trim().replace(/\D/g, '');
    if (rawDigits.length < 8 || rawDigits.length > 15) {
      setError('Please enter a valid mobile number (8 to 15 digits).');
      sound.playWrong();
      return;
    }

    const fullPhone = getFullPhoneNumber();
    setIsLoading(true);
    sound.playButtonPress();

    try {
      const res = await fetch('/api/auth/send-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: fullPhone,
          displayName: displayName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to dispatch SMS verification code.');
        sound.playWrong();
        setIsLoading(false);
        return;
      }

      setSuccessMessage(data.message || `SMS verification code dispatched to ${fullPhone}!`);
      setOtpCode('');
      setMobileStep('otp');
      setResendTimer(30);
      sound.playCorrect();
    } catch {
      setError('Network error connecting to SMS verification gateway.');
      sound.playWrong();
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 3. MOBILE NUMBER: STEP 2 - Verify SMS OTP & Sign In
  // -------------------------------------------------------------
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the 6-digit SMS verification code.');
      sound.playWrong();
      return;
    }

    const fullPhone = getFullPhoneNumber();
    setIsLoading(true);
    sound.playButtonPress();

    try {
      const res = await fetch('/api/auth/verify-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: fullPhone,
          otp: cleanOtp,
          displayName: displayName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid or expired SMS OTP code.');
        sound.playWrong();
        setIsLoading(false);
        return;
      }

      const verifiedAccount: TrainerAccount = data.account;
      saveActiveAccount(verifiedAccount);
      sound.playTrophyUnlock();
      triggerConfetti();
      setSuccessMessage(
        data.isNewAccount
          ? `🎉 Welcome, Trainer ${verifiedAccount.displayName}! Account registered.`
          : `Welcome back, Trainer ${verifiedAccount.displayName}!`
      );

      setTimeout(() => {
        onAuthenticated(verifiedAccount);
      }, 700);
    } catch {
      setError('Server error verifying SMS OTP code.');
      sound.playWrong();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-rose-500 selection:text-white relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10"
      >
        {/* Pokéball Logo */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 via-red-600 to-slate-900 border-4 border-slate-800 shadow-xl shadow-rose-950/60 flex items-center justify-center overflow-hidden mb-3">
            <div className="absolute top-0 inset-x-0 h-1/2 bg-rose-500 border-b-2 border-slate-950" />
            <div className="absolute bottom-0 inset-x-0 h-1/2 bg-white" />
            <div className="absolute w-5 h-5 rounded-full bg-white border-2 border-slate-950 z-10 flex items-center justify-center shadow">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-display">
            POKÉ<span className="text-rose-500">ARENA</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Authenticate to sync career progression, trophies, leaderboards, and battle rank.
          </p>
        </div>

        {/* Primary Auth Method Switcher: Email vs Mobile Number */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-5">
          <button
            type="button"
            id="method-btn-email"
            onClick={() => {
              sound.playButtonPress();
              setAuthMethod('email');
              setError('');
              setSuccessMessage('');
            }}
            className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              authMethod === 'email'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email + OTP</span>
          </button>
          <button
            type="button"
            id="method-btn-mobile"
            onClick={() => {
              sound.playButtonPress();
              setAuthMethod('mobile');
              setError('');
              setSuccessMessage('');
            }}
            className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              authMethod === 'mobile'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile + SMS</span>
          </button>
        </div>

        {/* Email Subtabs (Sign Up vs Log In) */}
        {authMethod === 'email' && (
          <div className="grid grid-cols-2 p-1 bg-slate-950/70 rounded-lg border border-slate-800/80 mb-5">
            <button
              type="button"
              id="tab-btn-signup"
              onClick={() => {
                sound.playButtonPress();
                setEmailTab('signup');
                setEmailSignupStep('details');
                setShowPassword(false);
                setEmailTouched(false);
                setError('');
                setSuccessMessage('');
              }}
              className={`py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                emailTab === 'signup'
                  ? 'bg-slate-800 text-rose-400 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3 h-3" />
              <span>Sign Up</span>
            </button>
            <button
              type="button"
              id="tab-btn-login"
              onClick={() => {
                sound.playButtonPress();
                setEmailTab('login');
                setEmailLoginStep('credentials');
                setShowPassword(false);
                setEmailTouched(false);
                setError('');
                setSuccessMessage('');
              }}
              className={`py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                emailTab === 'login'
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3 h-3" />
              <span>Log In</span>
            </button>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <span>{error}</span>
              {error.includes('already registered') && (
                <button
                  type="button"
                  onClick={() => {
                    setEmailTab('login');
                    setEmailLoginStep('credentials');
                    setShowPassword(false);
                    setError('');
                  }}
                  className="block mt-1 font-bold text-cyan-400 hover:underline"
                >
                  Click here to switch to Log In ➔
                </button>
              )}
            </div>
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span className="flex-1">{successMessage}</span>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* EMAIL AUTHENTICATION: SIGN UP                             */}
        {/* ========================================================= */}
        {authMethod === 'email' && emailTab === 'signup' && (
          <div>
            {emailSignupStep === 'details' ? (
              <form onSubmit={handleRequestSignupOtp} noValidate className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Your Email Address <span className="text-rose-400 font-bold">*</span>
                    </label>
                    {isEmailValid ? (
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Valid email
                      </span>
                    ) : showEmailError ? (
                      <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        {isEmailEmpty ? 'Required' : 'Invalid email'}
                      </span>
                    ) : null}
                  </div>
                  <div className="relative">
                    <Mail
                      className={`w-4 h-4 absolute left-3 top-3.5 transition-colors ${
                        isEmailValid
                          ? 'text-emerald-400'
                          : showEmailError
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }`}
                    />
                    <input
                      id="input-signup-email"
                      type="email"
                      required
                      placeholder="youremail@example.com"
                      value={email}
                      onBlur={() => setEmailTouched(true)}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError('');
                      }}
                      className={`w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-950 border text-white text-sm focus:outline-none transition-all ${
                        isEmailValid
                          ? 'border-emerald-500/80 ring-1 ring-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/50'
                          : showEmailError
                          ? 'border-rose-500 ring-1 ring-rose-500/50 focus:border-rose-500 focus:ring-rose-500'
                          : 'border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    An OTP code will be sent to your email to verify ownership.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Trainer Nickname
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      id="input-signup-nickname"
                      type="text"
                      maxLength={20}
                      placeholder="e.g. Ash Ketchum"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Password <span className="text-slate-400 font-normal">(min 4 characters)</span>
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                    <input
                      id="input-signup-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={4}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError('');
                      }}
                      className="w-full pl-9 pr-11 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-rose-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || (!isEmailEmpty && !isEmailValid)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-display font-bold text-sm uppercase tracking-wider shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Email OTP...</span>
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
              /* Step 2: Enter Email OTP */
              <form onSubmit={handleVerifySignupOtp} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-rose-400" />
                    <h4 className="text-xs font-bold text-slate-200">Enter Email Verification OTP</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmailSignupStep('details')}
                    className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Change Email
                  </button>
                </div>

                <p className="text-xs text-slate-300">
                  We dispatched a 6-digit OTP code to <strong className="text-rose-400">{cleanEmail}</strong>.
                </p>

                <div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-[12px] text-2xl font-mono py-3 rounded-xl bg-slate-950 border border-rose-500/50 text-rose-400 font-black focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Valid for 10 minutes</span>
                  <button
                    type="button"
                    disabled={resendTimer > 0 || isLoading}
                    onClick={handleRequestSignupOtp}
                    className="text-xs text-rose-400 font-bold hover:underline disabled:text-slate-600 cursor-pointer"
                  >
                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend Code'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-display font-bold text-sm uppercase tracking-wider shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying & Registering...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Verify & Complete Sign Up</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* EMAIL AUTHENTICATION: LOG IN WITH OTP                     */}
        {/* ========================================================= */}
        {authMethod === 'email' && emailTab === 'login' && (
          <div>
            {emailLoginStep === 'credentials' ? (
              <form onSubmit={handleRequestLoginOtp} noValidate className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Registered Email Address
                    </label>
                    {isEmailValid ? (
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Valid format
                      </span>
                    ) : showEmailError ? (
                      <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        {isEmailEmpty ? 'Required' : 'Invalid email'}
                      </span>
                    ) : null}
                  </div>
                  <div className="relative">
                    <Mail
                      className={`w-4 h-4 absolute left-3 top-3.5 transition-colors ${
                        isEmailValid
                          ? 'text-emerald-400'
                          : showEmailError
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }`}
                    />
                    <input
                      id="input-login-email"
                      type="email"
                      required
                      placeholder="youremail@example.com"
                      value={email}
                      onBlur={() => setEmailTouched(true)}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError('');
                      }}
                      className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                    <input
                      id="input-login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError('');
                      }}
                      className="w-full pl-9 pr-11 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    An OTP will be sent to your registered email to confirm login.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || (!isEmailEmpty && !isEmailValid)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-display font-bold text-sm uppercase tracking-wider shadow-lg shadow-blue-950/50 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Login Code...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Login OTP Code</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Step 2: Enter Login OTP */
              <form onSubmit={handleVerifyLoginOtp} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-bold text-slate-200">Enter Email Login Code</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmailLoginStep('credentials')}
                    className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Change Email
                  </button>
                </div>

                <p className="text-xs text-slate-300">
                  Enter the 6-digit login verification code sent to{' '}
                  <strong className="text-cyan-300">{cleanEmail}</strong>:
                </p>

                <div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-[12px] text-2xl font-mono py-3 rounded-xl bg-slate-950 border border-cyan-500/50 text-cyan-300 font-black focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Valid for 10 minutes</span>
                  <button
                    type="button"
                    disabled={resendTimer > 0 || isLoading}
                    onClick={handleRequestLoginOtp}
                    className="text-xs text-cyan-400 font-bold hover:underline disabled:text-slate-600 cursor-pointer"
                  >
                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend Code'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-display font-bold text-sm uppercase tracking-wider shadow-lg shadow-blue-950/50 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Login...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Verify & Enter Arena</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* MOBILE NUMBER AUTHENTICATION (SMS OTP)                    */}
        {/* ========================================================= */}
        {authMethod === 'mobile' && (
          <div>
            {mobileStep === 'phone' ? (
              <form onSubmit={handleRequestPhoneOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Mobile Phone Number <span className="text-cyan-400 font-bold">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="px-2.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-cyan-500 shrink-0 cursor-pointer"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>

                    <div className="relative flex-1">
                      <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="tel"
                        required
                        placeholder="98765 43210"
                        value={phoneNumber}
                        onChange={(e) => {
                          setPhoneNumber(e.target.value);
                          if (error) setError('');
                        }}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    A 6-digit SMS verification code will be sent to your mobile phone.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Trainer Nickname <span className="text-slate-400 font-normal">(Optional for new signups)</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      maxLength={20}
                      placeholder="e.g. Master Red"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || phoneNumber.replace(/\D/g, '').length < 8}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-slate-950 font-display font-black text-sm uppercase tracking-wider shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Sending SMS OTP...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send SMS Verification Code</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Step 2: Enter SMS OTP */
              <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-bold text-slate-200">Enter SMS Verification Code</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileStep('phone')}
                    className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Change Number
                  </button>
                </div>

                <p className="text-xs text-slate-300">
                  Enter the 6-digit SMS code sent to{' '}
                  <strong className="text-cyan-300">{getFullPhoneNumber()}</strong>:
                </p>

                <div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-[12px] text-2xl font-mono py-3 rounded-xl bg-slate-950 border border-cyan-500/50 text-cyan-300 font-black focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Valid for 10 minutes</span>
                  <button
                    type="button"
                    disabled={resendTimer > 0 || isLoading}
                    onClick={handleRequestPhoneOtp}
                    className="text-xs text-cyan-400 font-bold hover:underline disabled:text-slate-600 cursor-pointer"
                  >
                    {resendTimer > 0 ? `Resend SMS in ${resendTimer}s` : 'Resend Code'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-slate-950 font-display font-black text-sm uppercase tracking-wider shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying SMS...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Verify & Sign In</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Security & Features footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Secure OTP Verification
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Automatic Progress Sync
          </span>
        </div>
      </motion.div>
    </div>
  );
};
