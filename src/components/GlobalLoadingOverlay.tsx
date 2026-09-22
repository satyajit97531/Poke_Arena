import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PokeBallSpinner } from './PokeBallSpinner';
import { Sparkles, ShieldCheck } from 'lucide-react';

interface GlobalLoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  subMessage?: string;
}

export const GlobalLoadingOverlay: React.FC<GlobalLoadingOverlayProps> = ({
  isVisible,
  message = 'Initializing Pokémon Arena...',
  subMessage = 'Connecting to Pokédex database & synchronizing trainer dossier...',
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="global-loading-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md px-4 select-none"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute w-96 h-96 rounded-full bg-rose-600/10 blur-3xl pointer-events-none -top-10 -left-10" />
          <div className="absolute w-96 h-96 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none -bottom-10 -right-10" />

          {/* Central HUD Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-slate-900/90 border border-slate-800/80 rounded-3xl p-8 max-w-sm w-full mx-auto shadow-2xl flex flex-col items-center text-center overflow-hidden"
          >
            {/* Top Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5 animate-spin duration-1000" />
              <span>Poké Arena Engine</span>
            </div>

            {/* Poké Ball Spinner Animation */}
            <div className="my-3">
              <PokeBallSpinner size="lg" speed="normal" />
            </div>

            {/* Title / Main Message */}
            <h3 className="text-xl font-black font-display text-white mt-5 mb-2 tracking-wide">
              {message}
            </h3>

            {/* Sub Message / Detail */}
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs font-medium">
              {subMessage}
            </p>

            {/* Animated Loading Bar */}
            <div className="w-48 h-1.5 bg-slate-950 rounded-full overflow-hidden mt-6 border border-slate-800">
              <motion.div
                className="h-full bg-gradient-to-r from-red-500 via-rose-400 to-amber-400"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  ease: 'easeInOut',
                }}
                style={{ width: '60%' }}
              />
            </div>

            {/* Security / System Footer */}
            <div className="mt-5 flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Secure Cloud Sync Active</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
