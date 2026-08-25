import React from 'react';
import { PikteraMascot } from './PikteraMascot';

interface CharacterMascotProps {
  emoji?: string;
  bgColor?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  mood?: 'happy' | 'celebrating' | 'curious' | 'waving';
  className?: string;
  withSpeech?: boolean;
  speechText?: string;
}

interface PersonaInfo {
  name: string;
  wand: string;
  wandColor: string;
  accentColor: string;
  quote: string;
}

const PERSONA_MAP: Record<string, PersonaInfo> = {
  '🤖': { name: 'Piktera', wand: 'arrow', wandColor: '#C1FF33', accentColor: '#2F36C9', quote: 'Piktera siap mencatat suaramu! ✨' },
  '🐲': { name: 'Dragon', wand: '🔥', wandColor: '#FF1784', accentColor: '#059669', quote: 'Semburkan jawaban naga terhebatmu! 🔥' },
  '🦊': { name: 'Fox', wand: '⭐', wandColor: '#FACC15', accentColor: '#EA580C', quote: 'Pilihan cerdik & tak terkalahkan! 🦊' },
  '🐼': { name: 'Panda', wand: '🎋', wandColor: '#C1FF33', accentColor: '#0D9488', quote: 'Tetap tenang dan tepat sasaran! 🐼' },
  '🦁': { name: 'Lion', wand: '👑', wandColor: '#FACC15', accentColor: '#D97706', quote: 'Tunjukkan keberanian rajamu! 🦁' },
  '🐱': { name: 'Neko', wand: '🐾', wandColor: '#FF1784', accentColor: '#FF1784', quote: 'Neko kirim keberuntungan untukmu! 🐾' },
  '🐶': { name: 'Shiba', wand: '🦴', wandColor: '#FACC15', accentColor: '#F59E0B', quote: 'Semangat terus bersama Shiba! 🐶' },
  '🦄': { name: 'Unicorn', wand: '🪄', wandColor: '#FF1784', accentColor: '#9333EA', quote: 'Kekuatan magis menyertai jawabanmu! ⭐' },
  '🦉': { name: 'Owl', wand: '🪶', wandColor: '#C1FF33', accentColor: '#0284C7', quote: 'Pilihan cerdas dan penuh perhitungan! 🦉' },
  '🐯': { name: 'Tiger', wand: '⚡', wandColor: '#FACC15', accentColor: '#E11D48', quote: 'Kekuatan harimau ada di tanganmu! 🐯' },
  '🐧': { name: 'Penguin', wand: '🐟', wandColor: '#0891B2', accentColor: '#0891B2', quote: 'Tetap dingin & raih peringkat atas! 🐧' },
  '🐰': { name: 'Bunny', wand: '🥕', wandColor: '#EA580C', accentColor: '#DB2777', quote: 'Lompat tinggi menuju kemenangan! 🐰' },
};

export const getPersonaCustomQuotes = (emoji?: string, name?: string): string[] => {
  const charEmoji = emoji || '🤖';
  const participantName = name || 'Kamu';

  switch (charEmoji) {
    case '🐲':
      return [
        `Aura naga ${participantName} membara! 🔥`,
        'Pilihanmu sekuat naga legendaris! 🐉',
        'Semburkan jawaban paling tepat! ✨',
        'Naga mendukung keputusanmu 100%! 🔥',
      ];
    case '🦊':
      return [
        `Insting cerdik ${participantName} bekerja! 🦊`,
        'Gerak cepat dan tepat seperti rubah! ⚡',
        'Pilihan tak terduga, keren banget! 🌟',
        'Fokus & rebut poin maksimal! 🎯',
      ];
    case '🐼':
      return [
        `Tetap santai tapi fokus ya ${participantName}! 🎋`,
        'Panda yakin jawabanmu yang terbaik! 🐼',
        'Ketenangan membawamu ke puncak! 🍃',
        'Fokus penuh, kita pasti menang! ✨',
      ];
    case '🦁':
      return [
        `Tunjukkan wibawa rajamu, ${participantName}! 👑`,
        'Jangan ragu, mantapkan pilihanmu! 🦁',
        'Keberanianmu luar biasa hari ini! 🔥',
        'Aumkan kemenangan di panggung! 🌟',
      ];
    case '🐱':
      return [
        `Neko lambai-lambai bawa hoki buat ${participantName}! 🐾`,
        'Meow! Jawabanmu pasti tembus! ✨',
        'Kreatif dan lincah banget! 💖',
        'Neko siap dukung kamu terus! 🐱',
      ];
    case '🐶':
      return [
        `Shiba setia menyemangatimu ${participantName}! 🐶`,
        'Semangat terus, jangan kasih kendor! 🦴',
        'Pilihan mantap tanpa ragu! ⭐',
        'Yuk kita amankan posisi atas! 🚀',
      ];
    case '🦄':
      return [
        `Sihir unicorn menyertai ${participantName}! ⭐`,
        'Instingmu ajaib dan visioner! 🦄',
        'Jawabanmu bersinar terang di panggung! ✨',
        'Bintang kemenangan ada di tanganmu! 🪄',
      ];
    case '🦉':
      return [
        `Analisis tajam dari ${participantName}! 🦉`,
        'Keputusan bijak berbuah skor tinggi! 📜',
        'Pikiran tajam, hasil memuaskan! 💡',
        'Mata elangmu melihat jawaban benar! ✨',
      ];
    case '🐯':
      return [
        `Cakar kuat ${participantName} siap beraksi! 🐯`,
        'Terjang semua soal tanpa ragu! ⚡',
        'Energi harimau tak tertandingi! 🔥',
        'Kejar posisi 1 dengan ganas! 🏆',
      ];
    case '🐧':
      return [
        `Gaya keren ${participantName} tak tertandingi! 🐧`,
        'Tetap dingin di bawah tekanan waktu! ❄️',
        'Luncurkan jawaban terbaikmu sekarang! 🐟',
        'Rapi, tenang, dan akurat! 🌟',
      ];
    case '🐰':
      return [
        `Lompat gembira bersama ${participantName}! 🐰`,
        'Cepat dan ceria menuju peringkat satu! 🥕',
        'Telinga bunny menangkap sinyal benar! ✨',
        'Semangat melonjak tinggi! 💖',
      ];
    case '🤖':
    default:
      return [
        `Piktera dukung ${participantName} 100%! ⭐`,
        'Fokus & raih peringkat atas! 🔥',
        'Kamu pasti bisa! Semangat! 💪',
        'Keren banget kamu hari ini! ✨',
        'Kirim sinyal cinta ke panggung! ❤️',
      ];
  }
};

export const CharacterMascot: React.FC<CharacterMascotProps> = ({
  emoji = '🤖',
  bgColor = '#2F36C9',
  name = 'Attendee',
  size = 'md',
  mood = 'happy',
  className = '',
  withSpeech = false,
  speechText,
}) => {
  // If participant selected Piktera Robot, use full vector PikteraMascot
  if (emoji === '🤖' || name.toLowerCase() === 'piktera') {
    return (
      <PikteraMascot
        size={size}
        mood={mood}
        headOnly={false}
        withSpeech={withSpeech}
        speechText={speechText}
        className={className}
      />
    );
  }

  const persona = PERSONA_MAP[emoji] || {
    name: name,
    wand: '⭐',
    wandColor: '#FACC15',
    accentColor: bgColor,
    quote: 'Semangat terus! Kamu pasti bisa! ✨',
  };

  const isExcited = mood === 'celebrating' || mood === 'waving';

  // Dimension scaling
  const sizeMap = {
    xs: { width: 34, height: 38, headSize: 'w-6 h-6 text-sm', fontSize: 'text-sm' },
    sm: { width: 48, height: 56, headSize: 'w-9 h-9 text-xl', fontSize: 'text-xl' },
    md: { width: 80, height: 96, headSize: 'w-14 h-14 text-3xl', fontSize: 'text-3xl' },
    lg: { width: 120, height: 144, headSize: 'w-20 h-20 text-5xl', fontSize: 'text-5xl' },
    xl: { width: 180, height: 216, headSize: 'w-28 h-28 text-7xl', fontSize: 'text-7xl' },
  };

  const { width, height } = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div className="relative inline-block">
        {/* Floating Animation Container */}
        <div className="animate-badge-float relative flex flex-col items-center">
          
          {/* Celebrating Crown */}
          {mood === 'celebrating' && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 animate-bounce" style={{ animationDuration: '1.5s' }}>
              <span className="text-xl">👑</span>
            </div>
          )}

          {/* Full Custom Character Mascot SVG with Moving Arm & Wand */}
          <svg
            width={width}
            height={height}
            viewBox="0 0 120 144"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="filter drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] overflow-visible"
            shapeRendering="crispEdges"
          >
            {/* ====== 1. CHARACTER HEAD ====== */}
            {/* Outer Head Frame (Black Border) */}
            <rect x="18" y="16" width="70" height="60" rx="10" fill="#000000" />
            {/* Inner Head Surface (Custom Color) */}
            <rect x="21" y="19" width="64" height="54" rx="8" fill={bgColor} />

            {/* Inner Faceplate (Warm Cream) */}
            <rect x="25" y="23" width="56" height="46" rx="6" fill="#FFF8F0" />

            {/* Faceplate Emoji in Center */}
            <foreignObject x="25" y="23" width="56" height="46">
              <div className="w-full h-full flex items-center justify-center select-none">
                <span className="text-2xl filter drop-shadow-[1px_1px_0px_rgba(0,0,0,0.4)]">
                  {emoji}
                </span>
              </div>
            </foreignObject>

            {/* Rosy Cheeks */}
            <rect x="28" y="54" width="6" height="4" rx="2" fill="#FF1784" />
            <rect x="72" y="54" width="6" height="4" rx="2" fill="#FF1784" />

            {/* ====== 2. NECK & BODY ====== */}
            {/* Neck */}
            <rect x="46" y="76" width="14" height="6" fill="#000000" />
            <rect x="48" y="78" width="10" height="4" fill="#E2E8F0" />

            {/* Torso Outer Frame */}
            <rect x="32" y="82" width="42" height="30" rx="6" fill="#000000" />
            <rect x="35" y="85" width="36" height="24" rx="4" fill={bgColor} />

            {/* Torso Belly Plate (Cream Accent + Symbol) */}
            <rect x="41" y="89" width="24" height="16" rx="3" fill="#FFF8F0" />
            <foreignObject x="41" y="89" width="24" height="16">
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-[10px] font-black font-mono text-[#000000]">
                  {persona.name.substring(0, 3).toUpperCase()}
                </span>
              </div>
            </foreignObject>

            {/* ====== 3. LEFT ARM (Animated Sway) ====== */}
            <g className="animate-piktera-left-arm">
              <rect x="24" y="86" width="8" height="6" fill="#000000" />
              <rect x="22" y="92" width="6" height="12" fill="#000000" />
              <rect x="20" y="104" width="8" height="8" rx="2" fill={bgColor} stroke="#000000" strokeWidth="2" />
            </g>

            {/* ====== 4. RIGHT ARM & CHARACTER SIGNATURE WAND (ANIMATED WAVING HAND) ====== */}
            <g className={isExcited ? "animate-piktera-cheer-arm" : "animate-piktera-arm"}>
              {/* Shoulder & Arm */}
              <rect x="74" y="86" width="8" height="6" fill="#000000" />
              <rect x="78" y="90" width="6" height="10" fill="#000000" />
              {/* Hand / Paw */}
              <rect x="80" y="100" width="8" height="8" rx="2" fill={bgColor} stroke="#000000" strokeWidth="2" />

              {/* Character Signature Wand Staff */}
              <rect x="84" y="94" width="5" height="26" fill="#000000" />
              <rect x="85" y="96" width="3" height="22" fill="#E2E8F0" />
              <rect x="84" y="118" width="5" height="4" fill={persona.accentColor} />

              {/* Wand Head (Emoji Icon e.g. Flame for Dragon, Star for Fox, Bamboo for Panda) */}
              <rect x="78" y="70" width="22" height="22" rx="4" fill="#000000" />
              <rect x="80" y="72" width="18" height="18" rx="3" fill="#FFF8F0" />
              <foreignObject x="78" y="70" width="22" height="22">
                <div className="w-full h-full flex items-center justify-center text-xs">
                  <span>{persona.wand}</span>
                </div>
              </foreignObject>
            </g>

            {/* ====== 5. LEGS & FEET ====== */}
            {/* Left Leg */}
            <rect x="38" y="112" width="8" height="14" fill="#000000" />
            <rect x="40" y="114" width="4" height="10" fill={bgColor} />
            <rect x="34" y="126" width="14" height="8" rx="2" fill="#000000" />
            <rect x="36" y="128" width="10" height="4" fill="#C1FF33" />

            {/* Right Leg */}
            <rect x="60" y="112" width="8" height="14" fill="#000000" />
            <rect x="62" y="114" width="4" height="10" fill={bgColor} />
            <rect x="58" y="126" width="14" height="8" rx="2" fill="#000000" />
            <rect x="60" y="128" width="10" height="4" fill="#FF1784" />
          </svg>
        </div>
      </div>

      {/* Speech Bubble (Optional) */}
      {withSpeech && (
        <div className="neo-card-sm px-3 py-1.5 bg-[#FFF8F0] text-[#000000] text-xs font-mono font-bold flex items-center gap-1.5 animate-in fade-in zoom-in-95" style={{ boxShadow: '2px 2px 0px #000000' }}>
          <span className="text-[#2F36C9] font-black">✔️</span>
          <span>{speechText || persona.quote}</span>
        </div>
      )}
    </div>
  );
};
