import React from 'react';
import { Volume2, VolumeX, Trophy, BarChart2, Sparkles, Music, User, Coins, ShoppingBag } from 'lucide-react';
import { MainGameMode, RegionId, TrainerAccount } from '../types/pokemon';
import { REGIONS } from '../utils/pokemonTypes';
import { getAccountAvatarUrl } from '../data/trainerAvatars';
import { sound } from '../utils/audio';

interface HeaderProps {
  score?: number;
  streak?: number;
  multiplier?: number;
  mode: MainGameMode;
  region: RegionId;
  account: TrainerAccount;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenProfile: () => void;
  onOpenTrophyRoad?: () => void;
  onOpenShop?: () => void;
  onOpenJukebox: () => void;
  onOpenScoreboard: () => void;
  onChangeMode: (mode: MainGameMode) => void;
  onChangeRegion: (region: RegionId) => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  region,
  account,
  isMuted,
  onToggleMute,
  onOpenProfile,
  onOpenTrophyRoad,
  onOpenShop,
  onOpenJukebox,
  onOpenScoreboard,
}) => {
  const currentRegion = REGIONS.find((r) => r.id === region) || REGIONS[0];
  const battleTokens = account.battleTokens ?? 0;
  const avatarUrl = getAccountAvatarUrl(account);

  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 py-2.5">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 via-red-600 to-slate-900 border-2 border-slate-700 shadow-md shadow-rose-950/50 flex items-center justify-center overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1/2 bg-rose-500 border-b border-slate-950"></div>
              <div className="absolute bottom-0 inset-x-0 h-1/2 bg-white"></div>
              <div className="absolute w-3 h-3 rounded-full bg-white border-2 border-slate-950 z-10 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-slate-400 animate-ping"></div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-black tracking-tight text-white font-display flex items-center gap-1">
                  POKÉ<span className="text-rose-500">ARENA</span>
                </h1>
                <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  Gen 1-9
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="capitalize text-slate-300 font-medium">{mode} Mode</span>
                {(mode === 'classic' || mode === 'silhouette') && (
                  <>
                    <span>•</span>
                    <span className="text-cyan-400 font-medium">{currentRegion.name}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick Profile Pill on Mobile */}
          <button
            onClick={() => {
              sound.playButtonPress();
              onOpenProfile();
            }}
            className="flex md:hidden items-center gap-1.5 p-1 rounded-full bg-slate-900 border border-slate-800"
          >
            <img
              src={avatarUrl}
              alt="Trainer Avatar"
              className="w-7 h-7 rounded-full object-contain bg-slate-950 p-0.5"
            />
            <span className="text-xs font-bold font-display text-white pr-2">{account.displayName}</span>
          </button>
        </div>

        {/* Center: Battle Tokens & Direct Poké Mart Quick Launch */}
        <div className="hidden md:flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-full px-4 py-1.5 shadow-inner">
          {/* Battle Tokens Currency */}
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={onOpenShop || onOpenProfile}
            title="Battle Tokens (Spend in Poké Mart!)"
          >
            <div className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Coins className="w-2.5 h-2.5 text-amber-400" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tokens:</span>
            <span className="text-xs font-bold font-mono text-amber-300 group-hover:text-amber-200 transition-colors">
              {battleTokens.toLocaleString()} BT
            </span>
          </div>

          <span className="text-slate-700">|</span>

          {/* Quick Poké Mart Shortcut */}
          <button
            type="button"
            onClick={onOpenShop || onOpenProfile}
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer"
            title="Open Poké Mart"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Poké Mart</span>
          </button>
        </div>

        {/* Right Tools: Profile Avatar, Limitless Trophies, Jukebox BGM, Leaderboards */}
        <div className="flex items-center justify-between w-full md:w-auto gap-2">
          {/* Trainer Profile Card */}
          <button
            id="header-btn-trainer-profile"
            onClick={() => {
              sound.playButtonPress();
              onOpenProfile();
            }}
            className="flex items-center gap-2 py-1 pl-1 pr-2.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-all hover:scale-105 active:scale-95 text-left group"
            title="Trainer Profile, Shop & Badges"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 p-0.5 shadow-sm overflow-hidden flex items-center justify-center">
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full rounded-full object-contain bg-slate-950 p-0.5"
              />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1 leading-none">
                <span className="text-xs font-bold text-white group-hover:text-rose-400 transition-colors">
                  {account.displayName}
                </span>
                <span className="text-[9px] px-1 rounded bg-rose-500/20 text-rose-300 font-bold">
                  Lv.{account.level}
                </span>
              </div>
            </div>
          </button>

          {/* Limitless Trophy Progression Button - Redirects to Trophy Road */}
          <button
            id="header-btn-trophies"
            onClick={() => {
              sound.playButtonPress();
              if (onOpenTrophyRoad) {
                onOpenTrophyRoad();
              } else {
                onOpenProfile();
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Click to redirect to 100 Lakh Trophy Road!"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono font-bold">{account.trophyPoints.toLocaleString()}</span>
            <span className="text-[10px] text-amber-400/80 font-bold hidden sm:inline">TP</span>
          </button>

          {/* BGM Chiptune Jukebox */}
          <button
            id="header-btn-jukebox"
            onClick={() => {
              sound.playButtonPress();
              onOpenJukebox();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
            title="Music & BGM Jukebox"
          >
            <Music className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline text-[11px]">BGM</span>
          </button>

          {/* Scoreboard / Leaderboards Button */}
          <button
            id="header-btn-scoreboard"
            onClick={() => {
              sound.playButtonPress();
              onOpenScoreboard();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
            title="Leaderboards & Career Records"
          >
            <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline text-[11px]">Ranks</span>
          </button>

          {/* Sound Toggle Button */}
          <button
            id="header-btn-sound"
            onClick={() => {
              sound.playButtonPress();
              onToggleMute();
            }}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              isMuted
                ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
            }`}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
