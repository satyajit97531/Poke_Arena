import React from 'react';

interface PokeBallSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  speed?: 'normal' | 'fast' | 'slow';
}

export const PokeBallSpinner: React.FC<PokeBallSpinnerProps> = ({
  size = 'md',
  className = '',
  speed = 'normal',
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
  };

  const speedClass = {
    slow: 'duration-1000',
    normal: 'duration-700',
    fast: 'duration-500',
  }[speed];

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Outer Glow Halo */}
      <div className={`absolute inset-0 rounded-full bg-rose-500/20 blur-xl animate-pulse pointer-events-none`} />

      {/* Rotating Poké Ball Container */}
      <div
        className={`${sizeMap[size]} rounded-full relative shadow-2xl animate-spin ${speedClass} overflow-hidden border-[2.5px] border-slate-950 flex flex-col`}
        style={{
          boxShadow: '0 0 25px rgba(239, 68, 68, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.4)',
        }}
      >
        {/* Top Half: Classic Crimson Red */}
        <div className="w-full h-1/2 bg-gradient-to-b from-red-500 to-rose-600 relative overflow-hidden">
          {/* Subtle 3D Curved Highlight */}
          <div className="absolute top-1 left-2 right-2 h-2 rounded-full bg-white/30 blur-[1px]" />
        </div>

        {/* Center Band: Deep Slate/Black */}
        <div className="w-full h-[14%] bg-slate-950 shrink-0 z-10" />

        {/* Bottom Half: Pure White / Light Slate */}
        <div className="w-full h-1/2 bg-gradient-to-b from-slate-100 to-slate-200" />

        {/* Center Button Component */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center">
          {/* Outer Black Bezel Ring */}
          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-slate-950 flex items-center justify-center shadow-md">
            {/* Middle Metallic Ring */}
            <div className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-slate-200 border border-slate-400 flex items-center justify-center">
              {/* Inner Pulsing Core Button */}
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white shadow-inner animate-pulse ring-1 ring-cyan-400/60" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
