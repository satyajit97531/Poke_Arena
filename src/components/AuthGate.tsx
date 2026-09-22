import React, { useState } from 'react';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TrainerAccount } from '../types/pokemon';
import { saveActiveAccount } from '../utils/accounts';
import { sound } from '../utils/audio';
import { isValidEmail, getEmailValidationError } from '../utils/validation';

interface AuthGateProps {
  onAuthenticated: (account: TrainerAccount) => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticated }) => {
  const [tab, setTab] = useState<'signup' | 'login'>('signup');

  // Form inputs
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);

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

  // Sign Up Handler (Direct email + password + nickname registration)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setEmailTouched(true);

    const cleanEmail = email.trim().toLowerCase();
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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          displayName: displayName.trim() || cleanEmail.split('@')[0],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.isExisting) {
          setError('This email is already registered! Please switch to Log In.');
        } else {
          setError(data.error || 'Failed to create trainer account.');
        }
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
      setError('Server connection error. Please make sure the server is reachable.');
      sound.playWrong();
    } finally {
      setIsLoading(false);
    }
  };

  // Log In Handler (Direct email + password authentication, loads saved progression)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setEmailTouched(true);

    const cleanEmail = email.trim().toLowerCase();
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
      setError('Please enter your password.');
      sound.playWrong();
      return;
    }

    setIsLoading(true);
    sound.playButtonPress();

    try {
      const res = await fetch('/api/auth/login', {
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
          setError('No trainer account found with this email. Please check your email or sign up.');
        } else {
          setError(data.error || 'Invalid email or password.');
        }
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
      setError('Server error during log in. Please try again.');
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
        <div className="flex flex-col items-center text-center mb-6">
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
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xs">
            Sign in with your email & password to save each session's progression, rank, trophies, and achievements.
          </p>
        </div>

        {/* Tab Switcher (Sign Up vs Log In) */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800/80 mb-6">
          <button
            type="button"
            id="tab-btn-signup"
            onClick={() => {
              sound.playButtonPress();
              setTab('signup');
              setShowPassword(false);
              setEmailTouched(false);
              setError('');
              setSuccessMessage('');
            }}
            className={`py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'signup'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sign Up</span>
          </button>
          <button
            type="button"
            id="tab-btn-login"
            onClick={() => {
              sound.playButtonPress();
              setTab('login');
              setShowPassword(false);
              setEmailTouched(false);
              setError('');
              setSuccessMessage('');
            }}
            className={`py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'login'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Log In</span>
          </button>
        </div>

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
                    setTab('login');
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

        {/* ================= SIGN UP FORM ================= */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp} noValidate className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Trainer Email Address
                </label>
                {isEmailValid ? (
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Valid email
                  </span>
                ) : showEmailError ? (
                  <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    {isEmailEmpty ? 'Email is required' : 'Invalid email format'}
                  </span>
                ) : null}
              </div>
              <div className="relative">
                <Mail className={`w-4 h-4 absolute left-3 top-3.5 transition-colors ${
                  isEmailValid ? 'text-emerald-400' : showEmailError ? 'text-rose-400' : 'text-slate-400'
                }`} />
                <input
                  id="input-signup-email"
                  type="email"
                  required
                  placeholder="trainer@pokemon.com"
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
                {isEmailValid && (
                  <div className="absolute right-3 top-3 text-emerald-400 pointer-events-none">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                {showEmailError && (
                  <div className="absolute right-3 top-3 text-rose-400 pointer-events-none">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                )}
              </div>
              {showEmailError && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{isEmailEmpty ? 'Please enter your email address.' : 'Invalid email. Must be in format user@domain.com'}</span>
                </p>
              )}
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
                  placeholder="At least 4 characters"
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
                  id="btn-signup-toggle-password"
                  onClick={() => {
                    sound.playButtonPress();
                    setShowPassword((prev) => !prev);
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
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
              id="btn-signup-submit"
              disabled={isLoading || (!isEmailEmpty && !isEmailValid)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-display font-bold text-sm uppercase tracking-wider shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : !isEmailEmpty && !isEmailValid ? (
                <>
                  <AlertCircle className="w-4 h-4" />
                  <span>Invalid Email Address</span>
                </>
              ) : (
                <>
                  <span>Create Account & Start</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ================= LOG IN FORM ================= */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} noValidate className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Registered Email
                </label>
                {isEmailValid ? (
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Valid email
                  </span>
                ) : showEmailError ? (
                  <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    {isEmailEmpty ? 'Email is required' : 'Invalid email format'}
                  </span>
                ) : null}
              </div>
              <div className="relative">
                <Mail className={`w-4 h-4 absolute left-3 top-3.5 transition-colors ${
                  isEmailValid ? 'text-emerald-400' : showEmailError ? 'text-rose-400' : 'text-slate-400'
                }`} />
                <input
                  id="input-login-email"
                  type="email"
                  required
                  placeholder="trainer@pokemon.com"
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
                {isEmailValid && (
                  <div className="absolute right-3 top-3 text-emerald-400 pointer-events-none">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                {showEmailError && (
                  <div className="absolute right-3 top-3 text-rose-400 pointer-events-none">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                )}
              </div>
              {showEmailError && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{isEmailEmpty ? 'Please enter your email address.' : 'Invalid email. Must be in format user@domain.com'}</span>
                </p>
              )}
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
                  placeholder="Enter your password"
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
                  id="btn-login-toggle-password"
                  onClick={() => {
                    sound.playButtonPress();
                    setShowPassword((prev) => !prev);
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
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
              id="btn-login-submit"
              disabled={isLoading || (!isEmailEmpty && !isEmailValid)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-display font-bold text-sm uppercase tracking-wider shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Logging In...</span>
                </>
              ) : !isEmailEmpty && !isEmailValid ? (
                <>
                  <AlertCircle className="w-4 h-4" />
                  <span>Invalid Email Address</span>
                </>
              ) : (
                <>
                  <span>Log In & Enter Arena</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Security & Features footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Automatic Progress Sync
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Career Stats & Trophies
          </span>
        </div>
      </motion.div>
    </div>
  );
};
