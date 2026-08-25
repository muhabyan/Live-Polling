import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  theme?: 'light' | 'dark';
  iconStyle?: 'black' | 'pink';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  theme = 'light',
  iconStyle = 'black',
  className = '',
}) => {
  // Tight aspect ratio matching 70x82 pixel grid
  const iconSizes = {
    sm: 'w-[18px] h-[22px]',
    md: 'w-[26px] h-[31px]',
    lg: 'w-[36px] h-[43px]',
    xl: 'w-[48px] h-[57px]',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const isDark = theme === 'dark';
  const fillColor = isDark ? '#FFFFFF' : '#000000';

  return (
    <div className={`inline-flex items-center gap-1 sm:gap-1.5 select-none ${className}`}>
      {/* Piktera Pixel 'P' Icon with Arrow Inside */}
      <div className={`${iconSizes[size]} shrink-0 relative flex items-center justify-center`}>
        <svg
          viewBox="0 0 70 82"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          shapeRendering="crispEdges"
        >
          {iconStyle === 'pink' ? (
            <>
              {/* Pink Card Container */}
              <rect width="70" height="82" rx="10" fill="#FF1784" stroke="#000000" strokeWidth="4" />
              {/* Inner 'P' shape in Black */}
              {/* Left Spine */}
              <rect x="10" y="10" width="12" height="62" fill="#000000" />
              {/* Top loop bar */}
              <rect x="22" y="10" width="38" height="12" fill="#000000" />
              {/* Right loop edge */}
              <rect x="48" y="22" width="12" height="20" fill="#000000" />
              {/* Mid loop bar */}
              <rect x="22" y="42" width="38" height="12" fill="#000000" />
              {/* Upward Arrow in White */}
              <rect x="31" y="26" width="8" height="12" fill="#FFFFFF" />
              <polygon points="35,16 23,27 47,27" fill="#FFFFFF" />
            </>
          ) : (
            <>
              {/* Standard Pixel Grid 'P' */}
              {/* Col 0 (Left vertical spine: 7 square blocks) */}
              <rect x="0" y="0" width="10" height="10" fill={fillColor} />
              <rect x="0" y="12" width="10" height="10" fill={fillColor} />
              <rect x="0" y="24" width="10" height="10" fill={fillColor} />
              <rect x="0" y="36" width="10" height="10" fill={fillColor} />
              <rect x="0" y="48" width="10" height="10" fill={fillColor} />
              <rect x="0" y="60" width="10" height="10" fill={fillColor} />
              <rect x="0" y="72" width="10" height="10" fill={fillColor} />

              {/* Row 0 (Top horizontal bar: Cols 1, 2, 3, 4, 5) */}
              <rect x="12" y="0" width="10" height="10" fill={fillColor} />
              <rect x="24" y="0" width="10" height="10" fill={fillColor} />
              <rect x="36" y="0" width="10" height="10" fill={fillColor} />
              <rect x="48" y="0" width="10" height="10" fill={fillColor} />
              <rect x="60" y="0" width="10" height="10" fill={fillColor} />

              {/* Col 5 (Right loop vertical edge: Rows 1, 2, 3) */}
              <rect x="60" y="12" width="10" height="10" fill={fillColor} />
              <rect x="60" y="24" width="10" height="10" fill={fillColor} />
              <rect x="60" y="36" width="10" height="10" fill={fillColor} />

              {/* Row 3 (Middle horizontal bar: Cols 1, 2, 3, 4) */}
              <rect x="12" y="36" width="10" height="10" fill={fillColor} />
              <rect x="24" y="36" width="10" height="10" fill={fillColor} />
              <rect x="36" y="36" width="10" height="10" fill={fillColor} />
              <rect x="48" y="36" width="10" height="10" fill={fillColor} />

              {/* Center Upward Pixel Arrow (Solid Arrow pointing UP) */}
              {/* Arrow Stem */}
              <rect x="30" y="21" width="10" height="11" fill={fillColor} />
              {/* Arrow Head */}
              <polygon points="35,9 18,22 52,22" fill={fillColor} />
            </>
          )}
        </svg>
      </div>

      {/* Brand Text: IKTERA immediately adjacent to P */}
      {showText && (
        <div className="flex items-center leading-none">
          <span className={`font-black tracking-tight font-heading ${textSizes[size]} ${isDark ? 'text-white' : 'text-[#000000]'}`}>
            IKTERA
          </span>
          {/* Live Lime Green Pulse Dot */}
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#C1FF33] border border-[#000000] ml-1 sm:ml-1.5 animate-pulse" />
        </div>
      )}
    </div>
  );
};
