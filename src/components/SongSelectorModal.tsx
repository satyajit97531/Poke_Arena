import React from 'react';
import { motion } from 'motion/react';
import { X, Music, Play, Check, Lock, Volume2, VolumeX } from 'lucide-react';
import { POKEMON_TRACKS, SongTrack } from '../data/songs';
import { sound } from '../utils/audio';

interface SongSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  unlockedSongIds: string[];
  activeSongId: string;
  onSelectSong: (songId: string) => void;
}

export const SongSelectorModal: React.FC<SongSelectorModalProps> = ({
  isOpen,
  onClose,
  unlockedSongIds,
  activeSongId,
  onSelectSong,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-white">Chiptune Jukebox & BGM</h3>
              <p className="text-xs text-slate-400">Unlock authentic regional battle tracks through achievements</p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playButtonBack();
              onClose();
            }}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Songs List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {POKEMON_TRACKS.map((track) => {
            const isUnlocked = unlockedSongIds.includes(track.id);
            const isActive = activeSongId === track.id;

            return (
              <div
                key={track.id}
                onClick={() => {
                  if (isUnlocked) {
                    sound.playButtonPress();
                    onSelectSong(track.id);
                  }
                }}
                className={`p-4 rounded-xl border flex flex-col gap-2.5 transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 border-cyan-400 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-950'
                    : isUnlocked
                    ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700 cursor-pointer'
                    : 'bg-slate-950/40 border-slate-900/90'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : isUnlocked
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-slate-900 text-slate-600'
                      }`}
                    >
                      {isActive ? (
                        <Volume2 className="w-5 h-5 animate-pulse" />
                      ) : isUnlocked ? (
                        <Music className="w-5 h-5" />
                      ) : (
                        <Lock className="w-5 h-5 text-amber-500/80" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold font-display text-white">{track.title}</h4>
                        {isActive && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950">
                            Playing
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{track.origin}</p>
                    </div>
                  </div>

                  {isUnlocked ? (
                    <button
                      id={`btn-select-song-${track.id}`}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-transform active:scale-95 ${
                        isActive
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {isActive ? 'Current Track' : 'Play Track'}
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-400 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 shrink-0 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Locked
                    </span>
                  )}
                </div>

                {/* How to Achieve & Unlock Information */}
                <div
                  className={`text-xs px-3 py-2 rounded-lg flex items-start gap-2 ${
                    isUnlocked
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/10 border border-amber-500/20 text-amber-200'
                  }`}
                >
                  <span className="font-bold shrink-0">
                    {isUnlocked ? '✓ Unlocked:' : '🎯 How to Achieve:'}
                  </span>
                  <span className="font-medium text-slate-300">
                    {track.unlockCondition || 'Available through Trainer Achievements'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
