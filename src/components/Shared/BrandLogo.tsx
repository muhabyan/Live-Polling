import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showTagline?: boolean;
  theme?: 'light' | 'dark';
  iconStyle?: 'black' | 'pink';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  showTagline = false,
  theme = 'light',
  iconStyle = 'black',
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
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center space-x-2 select-none ${className}`}>
      {/* Piktera Pixel 'P' Icon with Arrow Inside */}
      <div className={`${iconSizes[size]} shrink-0 relative flex items-center justify-center`}>
        <svg
          viewBox="0 0 48 56"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          shapeRendering="crispEdges"
        >
          {iconStyle === 'pink' ? (
            <>
              {/* Pink Card Container */}
              <rect width="48" height="56" rx="8" fill="#FF1784" stroke="#000000" strokeWidth="2.5" />
              {/* Inner 'P' shape in Black */}
              {/* Spine */}
              <rect x="8" y="10" width="8" height="36" fill="#000000" />
              {/* Top loop bar */}
              <rect x="16" y="10" width="22" height="8" fill="#000000" />
              {/* Right loop edge */}
              <rect x="30" y="18" width="8" height="12" fill="#000000" />
              {/* Mid loop bar */}
              <rect x="16" y="28" width="22" height="8" fill="#000000" />
              {/* Upward Arrow in White */}
              <rect x="22" y="20" width="4" height="6" fill="#FFFFFF" />
              <path d="M19 21 L24 15 L29 21 Z" fill="#FFFFFF" />
            </>
          ) : (
            <>
              {/* Standard Black Pixel Grid 'P' */}
              {/* Vertical Left Spine Column (6 blocks) */}
              <rect x="2" y="2" width="7" height="7" fill={isDark ? '#FFFFFF' : '#000000'} />
              <rect x="2" y="10" width="7" height="7" fill={isDark ? '#FFFFFF' : '#000000'} />
              <rect x="2" y="18" width="7" height="7" fill={isDark ? '#FFFFFF' : '#000000'} />
              <rect x="2" y="26" width="7" height="7" fill={isDark ? '#FFFFFF' : '#000000'} />
              <rect x="2" y="34" width="7" height="7" fill={isDark ? '#FFFFFF' : '#000000'} />
              <rect x="2" y="42" width="7" height="7" fill={isDark ? '#FFFFFF' : '#000000'} />

              {/* Top Horizontal Row Blocks */}
              <rect x="10" y="2" width="7" height="7" fill={isDark ? '#FFFFFF' : '#000000'} />
              <rect x="18" y="2" width="7" height="7" fill={isDark ? '#FFFFFF' : '#000000'} />
              <rect x="26" y="2" width="7" height="7" fill={isDark ? '#FFFFFF' : '#000000'} />
              <rect x="34" y="2" width="7" height="7" fill={isDark ? '#FFFFFF' : '#000000'} />

              {/* Right Vertical Blocks for the P-loop */}
              <rect x="34" y="10" width="7" height="7" fill={isDark ? '#FFFFFF' : '#000000'} />
              <rect x="34" y="18" width="7" height="7" fill={isDark ? '#FFFFFF' : '#000000'} />
              <rect x="34" y="26" width="7" height="7" fill={isDark ? '#FFFFFF' : '#000000'} />

              {/* Middle Horizontal Bar */}
              <rect x="10" y="26" width="7" height="7" fill={isDark ? '#FFFFFF' : '#000000'} />
              <rect x="18" y="26" width="7" height="7" fill={isDark ? '#FFFFFF' : '#000000'} />
              <rect x="26" y="26" width="7" height="7" fill={isDark ? '#FFFFFF' : '#000000'} />

              {/* Center Upward Pixel Arrow */}
              <rect x="20" y="16" width="5" height="7" fill={isDark ? '#000000' : '#FFFFFF'} />
              <path d="M15 17 L22.5 10 L30 17 Z" fill={isDark ? '#000000' : '#FFFFFF'} />
              {/* Arrow accent outline */}
              <path d="M15 17 L22.5 10 L30 17" stroke={isDark ? '#FFFFFF' : '#000000'} strokeWidth="1.5" fill="none" />
              <rect x="20" y="16" width="5" height="7" stroke={isDark ? '#FFFFFF' : '#000000'} strokeWidth="1.5" fill="none" />
            </>
          )}
        </svg>
      </div>

      {/* Brand Text: P [from icon] + IKTERA */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center">
            <span className={`font-black tracking-tight font-heading ${textSizes[size]} ${isDark ? 'text-white' : 'text-[#000000]'}`}>
              IKTERA
            </span>
            {/* Live Green Sync Pill */}
            <span className="w-2.5 h-2.5 rounded-full bg-[#C1FF33] border border-[#000000] ml-1.5 animate-pulse" />
          </div>

          {showTagline && (
            <span className={`text-[8px] sm:text-[9px] uppercase tracking-[0.08em] font-black font-heading mt-1 ${isDark ? 'text-gray-400' : 'text-[#000000]'}`}>
              LIVE POLLING DENGAN SENTUHAN PIKSEL.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
