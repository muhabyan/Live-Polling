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
      <div className="text-center py-4 text-xs text-slate-400 italic">
        Belum ada partisipan yang terhubung.
      </div>
    );
  }

  // If very few participants (<= 4), display prominent, elegant cards with full names
  if (!shouldAnimate) {
    return (
      <div className="w-full max-w-xl mx-auto flex flex-wrap items-center justify-center gap-3 py-3 animate-in fade-in zoom-in-95">
        {participants.map((p, idx) => (
          <div
            key={p.id + '-' + idx}
            className={`flex items-center space-x-2.5 px-4 py-2 rounded-2xl text-xs font-semibold shadow-xs transition-all ${
              isDark
                ? 'bg-slate-800/90 border border-slate-700/80 text-slate-200'
                : 'bg-white border border-slate-200 text-slate-900 shadow-2xs'
            }`}
          >
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 shadow-2xs font-emoji"
              style={{ backgroundColor: p.avatarBg }}
            >
              {p.avatarEmoji || '🦊'}
            </span>
            <div className="min-w-0 text-left">
              <span className={`font-extrabold text-xs block truncate max-w-[160px] leading-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {p.name}
              </span>
              <span className={`text-[10px] block leading-tight font-mono ${
                isDark ? 'text-slate-400' : 'text-slate-500 font-semibold'
              }`}>
                #{idx + 1} Attendee
              </span>
            </div>
            {isQuizMode && p.score !== undefined && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-300 font-black border border-amber-500/20">
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
          <span className={`inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
            isDark
              ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 shadow-xs'
              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
          }`}>
            <Film className="w-3 h-3 text-indigo-400" />
            <span>{title} ({count})</span>
          </span>
          <span className="text-[10px] text-slate-400 hidden sm:inline flex items-center space-x-1">
            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
            <span>Movie Credits Roll</span>
          </span>
        </div>

        {/* Speed & Pause Controls */}
        <div className="flex items-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-1 rounded-md text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
            }`}
            title={isPaused ? 'Resume scroll' : 'Pause scroll'}
          >
            {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3" />}
          </button>
          <button
            onClick={() => setSpeedMultiplier(speedMultiplier === 1 ? 1.5 : speedMultiplier === 1.5 ? 2 : 1)}
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold flex items-center space-x-0.5 cursor-pointer transition-colors ${
              speedMultiplier > 1 
                ? 'bg-indigo-600 text-white' 
                : isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
            }`}
            title="Adjust credit roll speed"
          >
            <FastForward className="w-2.5 h-2.5" />
            <span>{speedMultiplier}x</span>
          </button>
        </div>
      </div>

      {/* Credit Roll Viewport with Cinematic Gradient Masks (Top & Bottom Fade) */}
      <div
        className={`relative ${maxHeight} overflow-hidden rounded-2xl ${
          isDark ? 'bg-slate-900/40 border border-slate-800/80' : 'bg-slate-50/70 border border-slate-200/80'
        }`}
        style={{
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
                className={`flex items-center justify-between space-x-2 px-3 py-2 rounded-xl transition-all ${
                  isDark
                    ? 'bg-slate-800/70 border border-slate-700/60 hover:border-indigo-500/80 hover:bg-slate-800'
                    : 'bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 shadow-2xs font-emoji"
                    style={{ backgroundColor: p.avatarBg }}
                  >
                    {p.avatarEmoji || '🦊'}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {p.name}
                    </p>
                    <span className="text-[9px] text-slate-400 block leading-tight font-mono">
                      #{originalIndex + 1} Attendee
                    </span>
                  </div>
                </div>

                {isQuizMode && p.score !== undefined && (
                  <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 shrink-0 border border-amber-500/20">
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
