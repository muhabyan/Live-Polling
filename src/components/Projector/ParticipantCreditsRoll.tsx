import React, { useMemo, useState } from 'react';
import { Participant } from '../../types';
import { Film, Sparkles, Play, Pause, FastForward } from 'lucide-react';

interface ParticipantCreditsRollProps {
  participants: Participant[];
  theme?: 'light' | 'dark';
  maxHeight?: string;
  isQuizMode?: boolean;
  title?: string;
  columns?: 1 | 2 | 3 | 4;
}

export const ParticipantCreditsRoll: React.FC<ParticipantCreditsRollProps> = ({
  participants,
  theme = 'dark',
  maxHeight = 'max-h-[280px]',
  isQuizMode = false,
  title = 'Cast & Attendees',
  columns,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<1 | 1.5 | 2>(1);

  const count = participants.length;
  const isDark = theme === 'dark';

  // Determine dynamic column count based on participant total if not manually specified
  const effectiveColumns = useMemo(() => {
    if (columns) return columns;
    if (count > 60) return 4;
    if (count > 25) return 3;
    if (count > 10) return 2;
    return 1;
  }, [columns, count]);

  // Duration calculation: scales smoothly with participant count (approx 1.2s per row)
  const rows = Math.ceil(count / effectiveColumns);
  const animationDuration = Math.max(12, Math.min(60, rows * 1.6)) / speedMultiplier;

  // Duplicated list for seamless infinite loop if more than 4 participants
  const shouldAnimate = count > 6;
  const displayList = useMemo(() => {
    if (!shouldAnimate) return participants;
    // Repeat participants twice for seamless -50% CSS translation loop
    return [...participants, ...participants];
  }, [participants, shouldAnimate]);

  if (count === 0) {
    return (
      <div className="text-center py-4 text-xs font-mono text-gray-400 italic">
        Belum ada partisipan yang terhubung.
      </div>
    );
  }

  // If very few participants (<= 6), display prominent cards
  if (!shouldAnimate) {
    return (
      <div className="w-full max-w-xl mx-auto flex flex-wrap items-center justify-center gap-3 py-3 animate-in fade-in zoom-in-95">
        {participants.map((p, idx) => (
          <div
            key={p.id + '-' + idx}
            className={`flex items-center space-x-2.5 px-4 py-2 rounded-lg border-2 border-[#1E1E1E] text-xs font-bold transition-all ${
              isDark
                ? 'bg-[#1a1a2e] text-white'
                : 'bg-white text-[#1E1E1E]'
            }`}
            style={{ boxShadow: '3px 3px 0px #1E1E1E' }}
          >
            <span
              className="w-7 h-7 rounded-md border-2 border-[#1E1E1E] flex items-center justify-center text-sm shrink-0"
              style={{ backgroundColor: p.avatarBg }}
            >
              {p.avatarEmoji || '🦊'}
            </span>
            <div className="min-w-0 text-left">
              <span className={`font-black text-xs block truncate max-w-[160px] leading-tight ${
                isDark ? 'text-white' : 'text-[#1E1E1E]'
              }`}>
                {p.name}
              </span>
              <span className={`text-[10px] block leading-tight font-mono ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                #{idx + 1} Attendee
              </span>
            </div>
            {isQuizMode && p.score !== undefined && (
              <span className="neo-badge bg-[#FACC15] text-[#1E1E1E] text-[10px] font-mono">
                {p.score} pts
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  }[effectiveColumns];

  return (
    <div className="w-full max-w-4xl mx-auto relative group">
      
      {/* Top Header Badge */}
      <div className="flex items-center justify-between px-2 mb-2">
        <div className="flex items-center space-x-2">
          <span className={`neo-badge ${
            isDark
              ? 'bg-[#4F46E5] text-white'
              : 'bg-[#FACC15] text-[#1E1E1E]'
          }`}>
            <Film className="w-3 h-3" />
            <span>{title} ({count})</span>
          </span>
          <span className="text-[10px] text-gray-400 font-mono hidden sm:inline flex items-center space-x-1">
            <Sparkles className="w-2.5 h-2.5 text-[#FACC15]" />
            <span>Movie Credits Roll</span>
          </span>
        </div>

        {/* Speed & Pause Controls */}
        <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`neo-btn p-1 text-[10px] font-bold ${
              isDark ? 'bg-[#1a1a2e] text-white' : 'bg-white text-[#1E1E1E]'
            }`}
            title={isPaused ? 'Resume scroll' : 'Pause scroll'}
          >
            {isPaused ? <Play className="w-3 h-3 text-[#34D399]" /> : <Pause className="w-3 h-3" />}
          </button>
          <button
            onClick={() => setSpeedMultiplier(speedMultiplier === 1 ? 1.5 : speedMultiplier === 1.5 ? 2 : 1)}
            className={`neo-btn px-1.5 py-0.5 text-[10px] font-mono font-black ${
              speedMultiplier > 1 
                ? 'bg-[#4F46E5] text-white' 
                : isDark ? 'bg-[#1a1a2e] text-white' : 'bg-white text-[#1E1E1E]'
            }`}
            title="Adjust credit roll speed"
          >
            <FastForward className="w-2.5 h-2.5" />
            <span>{speedMultiplier}x</span>
          </button>
        </div>
      </div>

      {/* Credit Roll Viewport */}
      <div
        className={`relative ${maxHeight} overflow-hidden rounded-xl border-2 border-[#1E1E1E] ${
          isDark ? 'bg-[#1a1a2e]' : 'bg-[#FFF8F0]'
        }`}
        style={{
          boxShadow: '4px 4px 0px #1E1E1E',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)',
        }}
      >
        {/* Animated Marquee Strip */}
        <div
          className={`grid ${gridColsClass} gap-2 p-3`}
          style={{
            animation: `movieCreditsRoll ${animationDuration}s linear infinite`,
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {displayList.map((p, idx) => {
            const originalIndex = idx % count;
            return (
              <div
                key={`${p.id}-${idx}`}
                className={`flex items-center justify-between space-x-2 px-3 py-2 rounded-lg border-2 border-[#1E1E1E] transition-all ${
                  isDark
                    ? 'bg-[#252542] text-white'
                    : 'bg-white text-[#1E1E1E]'
                }`}
                style={{ boxShadow: '2px 2px 0px #1E1E1E' }}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <span
                    className="w-6 h-6 rounded-md border-2 border-[#1E1E1E] flex items-center justify-center text-xs shrink-0"
                    style={{ backgroundColor: p.avatarBg }}
                  >
                    {p.avatarEmoji || '🦊'}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-xs font-black truncate leading-tight ${isDark ? 'text-white' : 'text-[#1E1E1E]'}`}>
                      {p.name}
                    </p>
                    <span className="text-[9px] text-gray-400 block leading-tight font-mono">
                      #{originalIndex + 1} Attendee
                    </span>
                  </div>
                </div>

                {isQuizMode && p.score !== undefined && (
                  <span className="neo-badge bg-[#FACC15] text-[#1E1E1E] text-[9px] font-mono shrink-0">
                    {p.score} pts
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
