import React from 'react';

interface PikteraMascotProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  mood?: 'happy' | 'celebrating' | 'curious' | 'waving';
  headOnly?: boolean;
  withSpeech?: boolean;
  speechText?: string;
  className?: string;
}

export const PikteraMascot: React.FC<PikteraMascotProps> = ({
  size = 'md',
  mood = 'happy',
  headOnly = false,
  withSpeech = false,
  speechText,
  className = '',
}) => {
  const sizeMap = {
    xs: { width: 32, height: headOnly ? 28 : 36 },
    sm: { width: 48, height: headOnly ? 42 : 56 },
    md: { width: 80, height: headOnly ? 70 : 96 },
    lg: { width: 120, height: headOnly ? 105 : 144 },
    xl: { width: 180, height: headOnly ? 158 : 216 },
    full: { width: 260, height: headOnly ? 228 : 312 },
  };

  const { width, height } = sizeMap[size];
  const isExcited = mood === 'celebrating' || mood === 'waving';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div className="relative inline-block">
        {/* Animated Floating Container */}
        <div className="animate-badge-float relative flex flex-col items-center">
          
          {/* Celebrating Hat or Crown */}
          {mood === 'celebrating' && (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 animate-bounce" style={{ animationDuration: '1.5s' }}>
              <span className="text-xl">👑</span>
            </div>
          )}

          {/* SVG Piktera Robot */}
          <svg
            width={width}
            height={height}
            viewBox={headOnly ? "0 0 100 88" : "0 0 120 144"}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="filter drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]"
            shapeRendering="crispEdges"
          >
            {/* ====== 1. ANTENNA (Animated Wiggle) ====== */}
            <g className="animate-piktera-antenna">
              {/* Left Antenna */}
              <rect x="26" y="2" width="6" height="6" fill="#2F36C9" />
              <rect x="28" y="4" width="2" height="2" fill="#C1FF33" />
              <rect x="30" y="8" width="4" height="4" fill="#000000" />
              <rect x="34" y="12" width="4" height="4" fill="#000000" />
              <rect x="38" y="16" width="4" height="4" fill="#000000" />

              {/* Right Antenna */}
              <rect x="68" y="2" width="6" height="6" fill="#2F36C9" />
              <rect x="70" y="4" width="2" height="2" fill="#FF1784" />
              <rect x="66" y="8" width="4" height="4" fill="#000000" />
              <rect x="62" y="12" width="4" height="4" fill="#000000" />
              <rect x="58" y="16" width="4" height="4" fill="#000000" />
            </g>

            {/* ====== 2. HEAD HOUSING (CRT MONITOR) ====== */}
            {/* Left 3D Shadow Plate (Cobalt Blue) */}
            <path
              d="M12 28 H20 V72 H12 Z"
              fill="#2F36C9"
            />
            <rect x="14" y="32" width="4" height="36" fill="#1E237E" />
            
            {/* Left Ear Knob */}
            <rect x="6" y="42" width="6" height="16" fill="#000000" />
            <rect x="8" y="44" width="4" height="12" fill="#C1FF33" />

            {/* Right Ear Knob */}
            <rect x="88" y="42" width="6" height="16" fill="#000000" />
            <rect x="88" y="44" width="4" height="12" fill="#FF1784" />

            {/* Main Outer Head Frame (Black) */}
            <rect x="18" y="20" width="70" height="56" fill="#000000" />

            {/* Inner TV Bezel (Light Grey Highlight) */}
            <rect x="22" y="24" width="62" height="48" fill="#E2E8F0" />

            {/* Screen Face (Pure White) */}
            <rect x="26" y="28" width="54" height="40" fill="#FFFFFF" />

            {/* ====== 3. FACE EXPRESSION ====== */}
            {/* Left Eye */}
            <rect x="34" y="36" width="10" height="14" fill="#000000" className="animate-robot-blink" />
            {/* Left Eye Glint */}
            <rect x="36" y="38" width="4" height="4" fill="#FFFFFF" />

            {/* Right Eye */}
            <rect x="56" y="36" width="10" height="14" fill="#000000" className="animate-robot-blink" />
            {/* Right Eye Glint */}
            <rect x="58" y="38" width="4" height="4" fill="#FFFFFF" />

            {/* Cute Pixel Smile */}
            <rect x="44" y="56" width="12" height="3" fill="#000000" />
            <rect x="42" y="54" width="3" height="3" fill="#000000" />
            <rect x="55" y="54" width="3" height="3" fill="#000000" />

            {/* Rosy Cheeks */}
            <rect x="30" y="52" width="4" height="3" fill="#FF1784" />
            <rect x="66" y="52" width="4" height="3" fill="#FF1784" />

            {/* ====== 4. BODY & LIMBS (If not headOnly) ====== */}
            {!headOnly && (
              <>
                {/* Neck */}
                <rect x="46" y="76" width="8" height="6" fill="#000000" />
                <rect x="48" y="78" width="4" height="4" fill="#E2E8F0" />

                {/* Torso Outer Frame */}
                <rect x="34" y="82" width="32" height="30" fill="#000000" />
                <rect x="37" y="85" width="26" height="24" fill="#E2E8F0" />

                {/* Torso Belly Screen (Piktera Gradient Multi-color block) */}
                <rect x="41" y="89" width="18" height="14" fill="#000000" />
                <rect x="42" y="90" width="8" height="6" fill="#C1FF33" />
                <rect x="50" y="90" width="8" height="6" fill="#FF1784" />
                <rect x="42" y="96" width="8" height="6" fill="#2F36C9" />
                <rect x="50" y="96" width="8" height="6" fill="#FACC15" />

                {/* Left Arm & Hand (Animated Sway) */}
                <g className="animate-piktera-left-arm">
                  <rect x="26" y="86" width="8" height="6" fill="#000000" />
                  <rect x="24" y="92" width="6" height="12" fill="#000000" />
                  <rect x="22" y="104" width="8" height="6" fill="#2F36C9" />
                </g>

                {/* Right Arm Holding Arrow Staff (ANIMATED WAVING HAND & WAND) */}
                <g className={isExcited ? "animate-piktera-cheer-arm" : "animate-piktera-arm"}>
                  <rect x="66" y="86" width="8" height="6" fill="#000000" />
                  <rect x="70" y="90" width="6" height="10" fill="#000000" />
                  <rect x="72" y="100" width="6" height="6" fill="#2F36C9" />

                  {/* PIXEL ARROW STAFF (Wand) */}
                  {/* Staff Handle */}
                  <rect x="76" y="98" width="5" height="22" fill="#000000" />
                  <rect x="77" y="100" width="3" height="18" fill="#E2E8F0" />
                  <rect x="76" y="116" width="5" height="4" fill="#FF1784" />

                  {/* Arrow Head (Pointing Up-Right) */}
                  <path
                    d="M72 96 H84 V90 H90 V84 H96 V72 H84 V78 H78 V84 H72 Z"
                    fill="#000000"
                  />
                  <path
                    d="M74 94 H82 V88 H88 V82 H94 V74 H86 V80 H80 V86 H74 Z"
                    fill="#FFFFFF"
                  />
                  {/* Accent inside Arrow */}
                  <rect x="86" y="78" width="4" height="4" fill="#C1FF33" />
                </g>

                {/* Left Leg & Foot */}
                <rect x="38" y="112" width="8" height="14" fill="#000000" />
                <rect x="40" y="114" width="4" height="10" fill="#2F36C9" />
                <rect x="34" y="126" width="14" height="8" fill="#000000" />
                <rect x="36" y="128" width="10" height="4" fill="#C1FF33" />

                {/* Right Leg & Foot */}
                <rect x="54" y="112" width="8" height="14" fill="#000000" />
                <rect x="56" y="114" width="4" height="10" fill="#2F36C9" />
                <rect x="52" y="126" width="14" height="8" fill="#000000" />
                <rect x="54" y="128" width="10" height="4" fill="#FF1784" />
              </>
            )}
          </svg>
        </div>
      </div>

      {/* Speech Bubble (Optional) */}
      {withSpeech && (
        <div className="neo-card-sm px-3 py-1.5 bg-[#FFF8F0] text-[#000000] text-xs font-mono font-bold flex items-center gap-1.5 animate-in fade-in zoom-in-95" style={{ boxShadow: '2px 2px 0px #000000' }}>
          <span className="text-[#2F36C9] font-black">✔️</span>
          <span>{speechText || 'Ready to poll!'}</span>
        </div>
      )}
    </div>
  );
};
