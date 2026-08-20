import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  theme = 'light',
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center space-x-2.5 select-none ${className}`}>
      {/* Sleek StageSync Geometric Wave Logo */}
      <div className={`${iconSizes[size]} shrink-0 relative flex items-center justify-center`}>
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          <defs>
            <linearGradient id="stageSyncGradient" x1="2" y1="2" x2="38" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4F46E5" />
              <stop offset="0.5" stopColor="#3B82F6" />
              <stop offset="1" stopColor="#06B6D4" />
            </linearGradient>
            <linearGradient id="waveHighlight" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" stopOpacity="0.3" />
              <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Rounded Squircle Container */}
          <rect width="40" height="40" rx="11" fill="url(#stageSyncGradient)" />
          <rect width="40" height="40" rx="11" fill="url(#waveHighlight)" />

          {/* Dynamic Soundstage Frequency Nodes */}
          {/* Bar 1 */}
          <rect x="8.5" y="16" width="3.5" height="8" rx="1.75" fill="#FFFFFF" fillOpacity="0.85" />
          {/* Bar 2 */}
          <rect x="14.5" y="10" width="3.5" height="20" rx="1.75" fill="#FFFFFF" />
          {/* Bar 3 */}
          <rect x="20.5" y="7" width="3.5" height="26" rx="1.75" fill="#FFFFFF" />
          {/* Bar 4 */}
          <rect x="26.5" y="13" width="3.5" height="14" rx="1.75" fill="#FFFFFF" />
          {/* Live Sync Node Pulse */}
          <circle cx="32" cy="8" r="2.5" fill="#34D399" />
          <circle cx="32" cy="8" r="4.5" stroke="#34D399" strokeWidth="1" strokeOpacity="0.6" className="animate-ping" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <div className={`font-black tracking-tight ${textSizes[size]} ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Stage<span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Sync</span>
          </div>
          <span className={`text-[9px] uppercase tracking-widest font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Audience Engagement
          </span>
        </div>
      )}
    </div>
  );
};
