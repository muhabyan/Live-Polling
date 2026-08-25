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
      {/* Neo-Brutal Logo: Flat bold squircle with thick black stroke */}
      <div className={`${iconSizes[size]} shrink-0 relative flex items-center justify-center`}>
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Solid squircle with thick black stroke */}
          <rect width="40" height="40" rx="10" fill="#4F46E5" />
          <rect x="1" y="1" width="38" height="38" rx="9" stroke="#1E1E1E" strokeWidth="2" fill="none" />

          {/* Flat frequency bars — no gradient, solid white */}
          <rect x="8"  y="17" width="4" height="7" rx="2" fill="#FACC15" />
          <rect x="14" y="11" width="4" height="19" rx="2" fill="#FFFFFF" />
          <rect x="20" y="7"  width="4" height="26" rx="2" fill="#FACC15" />
          <rect x="26" y="14" width="4" height="13" rx="2" fill="#FFFFFF" />

          {/* Live dot — solid green with black ring */}
          <circle cx="33" cy="7" r="3" fill="#34D399" stroke="#1E1E1E" strokeWidth="1.5" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className={`font-black tracking-tight font-display ${textSizes[size]} ${isDark ? 'text-white' : 'text-[#1E1E1E]'}`}>
            Pulse<span className="text-[#4F46E5]">Live</span>
          </div>
          <span className={`text-[9px] uppercase tracking-[0.15em] font-bold font-mono mt-0.5 ${isDark ? 'text-gray-400' : 'text-[#1E1E1E]/60'}`}>
            Audience Polling
          </span>
        </div>
      )}
    </div>
  );
};
