import React, { useEffect, useRef } from 'react';
import { useEvent } from '../../context/EventContext';
import QRCode from 'qrcode';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Maximize, 
  Star,
  MessageSquare,
  Radio
} from 'lucide-react';
import { BrandLogo } from '../Shared/BrandLogo';

export const ProjectorDisplay: React.FC = () => {
  const { currentEvent, fireConfetti, setActiveView, isHost } = useEvent();
  const miniQrRef = useRef<HTMLCanvasElement | null>(null);

  // Press ESC to exit Projector mode anytime cleanly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setActiveView(isHost ? 'presenter' : 'participant');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveView, isHost]);

  const currentQIndex = currentEvent?.currentQuestionIndex ?? 0;
  const currentQ = currentEvent?.questions?.[currentQIndex];
  const responses = (currentEvent?.responses || []).filter(r => r.questionId === currentQ?.id);
  const totalResponses = responses.length;
  const totalParticipants = Math.max(currentEvent?.participants?.length || 0, totalResponses);
  const responsePercentage = totalParticipants > 0 ? Math.round((totalResponses / totalParticipants) * 100) : 0;

  // Trigger confetti when correct answer is revealed
  useEffect(() => {
    if (currentEvent?.revealAnswer) {
      fireConfetti();
    }
  }, [currentEvent?.revealAnswer, fireConfetti]);

  // Render Mini QR Code for projector top corner
  useEffect(() => {
    if (currentEvent && miniQrRef.current) {
      const joinUrl = `${window.location.origin}/?code=${currentEvent.roomCode}`;
      QRCode.toCanvas(miniQrRef.current, joinUrl, {
        width: 72,
        margin: 1,
        color: { dark: '#0F172A', light: '#FFFFFF' },
      });
    }
  }, [currentEvent]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.warn(err));
    } else {
      document.exitFullscreen().catch(err => console.warn(err));
    }
  };

  if (!currentEvent || !currentQ) {
    return (
      <div className="min-h-screen-dvh flex items-center justify-center bg-[#070B14] text-white p-8 text-center">
        <div>
          <Radio className="w-16 h-16 text-indigo-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 font-display">No Active Presentation</h2>
          <p className="text-slate-400 mb-6 text-sm">Launch a session from Presenter Controls or Admin Studio.</p>
          <button
            onClick={() => setActiveView(isHost ? 'presenter' : 'participant')}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Calculate vote counts for Multiple Choice and True/False
  const getOptionStats = () => {
    const counts: Record<string, number> = {};
    (currentQ.options || []).forEach(opt => { counts[opt.id] = 0; });
    responses.forEach(r => {
      (r.selectedOptionIds || []).forEach(optId => {
        counts[optId] = (counts[optId] || 0) + 1;
      });
    });
    return counts;
  };

  const optionStats = getOptionStats();

  // Calculate Word Cloud Frequency
  const getWordCloudData = () => {
    const freq: Record<string, number> = {};
    responses.forEach(r => {
      if (r.textResponse) {
        const words = r.textResponse.split(/[,;\n]+/).map(w => w.trim()).filter(w => w.length > 0);
        words.forEach(w => {
          const cap = w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
          freq[cap] = (freq[cap] || 0) + 1;
        });
      }
    });
    return Object.entries(freq).map(([text, count]) => ({ text, count })).sort((a, b) => b.count - a.count);
  };

  const wordCloudWords = getWordCloudData();
  const maxWordCount = Math.max(...wordCloudWords.map(w => w.count), 1);

  // Calculate Rating Stats
  const getRatingStats = () => {
    const counts = [0, 0, 0, 0, 0];
    let sum = 0;
    let totalRatings = 0;
    responses.forEach(r => {
      if (r.ratingValue && r.ratingValue >= 1 && r.ratingValue <= 5) {
        counts[r.ratingValue - 1]++;
        sum += r.ratingValue;
        totalRatings++;
      }
    });
    const avg = totalRatings > 0 ? (sum / totalRatings).toFixed(1) : '0.0';
    return { counts, avg, totalRatings };
  };

  const ratingStats = getRatingStats();

  const colors = [
    { bg: 'bg-indigo-600', fill: '#4F46E5', text: 'text-white' },
    { bg: 'bg-teal-600', fill: '#0D9488', text: 'text-white' },
    { bg: 'bg-amber-600', fill: '#D97706', text: 'text-white' },
    { bg: 'bg-rose-600', fill: '#E11D48', text: 'text-white' },
    { bg: 'bg-purple-600', fill: '#9333EA', text: 'text-white' },
  ];

  return (
    <div className="w-full min-h-screen-dvh bg-stage-mesh text-white flex flex-col justify-between p-4 sm:p-6 lg:p-10 select-none relative overflow-hidden">
      
      {/* Top Projector Stage Bar */}
      <header className="flex items-center justify-between pb-4 sm:pb-6 border-b border-slate-800/80 gap-3">
        
        {/* Left: Branding & Session Progress */}
        <div className="flex items-center space-x-3">
          <BrandLogo size="sm" showText={false} theme="dark" />
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                {currentEvent.title}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-semibold">
                Q {currentEvent.currentQuestionIndex + 1} / {currentEvent.questions.length}
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Live Interactive Screen
            </div>
          </div>
        </div>

        {/* Right: Join Instructions & Mini QR Code */}
        <div className="flex items-center space-x-3">
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl px-3.5 py-2 flex items-center space-x-3 shadow-lg">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Join at <strong className="text-indigo-400 normal-case">{window.location.host}</strong>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-slate-400">PIN:</span>
                <span className="text-xl sm:text-2xl font-black font-mono-numbers tracking-widest text-white">
                  {currentEvent.roomCode}
                </span>
              </div>
            </div>
            <div className="bg-white p-0.5 rounded-lg shrink-0 shadow-xs">
              <canvas ref={miniQrRef} className="w-11 h-11 sm:w-12 sm:h-12" />
            </div>
          </div>

          <button
            onClick={toggleFullScreen}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Question & Live Results Visualizer */}
      <main className="my-auto py-6 sm:py-8 max-w-5xl mx-auto w-full">
        
        {/* Large Distance-Readable Question Title */}
        <div className="mb-6 sm:mb-10 text-center">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto font-display drop-shadow-sm">
            {currentQ.title}
          </h2>
          {currentQ.subtitle && (
            <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-2xl mx-auto">
              {currentQ.subtitle}
            </p>
          )}
        </div>

        {/* 1. MULTIPLE CHOICE & TRUE/FALSE VISUALIZER */}
        {(currentQ.type === 'multiple_choice' || currentQ.type === 'true_false') && (
          <div className="space-y-3 sm:space-y-4 max-w-3xl mx-auto">
            {(currentQ.options || []).map((opt, idx) => {
              const count = optionStats[opt.id] || 0;
              const pct = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
              const color = colors[idx % colors.length];
              const isCorrect = opt.isCorrect;
              const isRevealed = currentEvent.revealAnswer;

              return (
                <div
                  key={opt.id}
                  className={`relative overflow-hidden rounded-2xl border transition-all duration-300 p-4 sm:p-5 ${
                    isRevealed && isCorrect
                      ? 'border-emerald-400 bg-emerald-950/60 ring-2 ring-emerald-500/30'
                      : isRevealed && !isCorrect
                      ? 'border-slate-800/80 bg-slate-900/40 opacity-40'
                      : 'border-slate-700/80 bg-slate-800/60 shadow-lg'
                  }`}
                >
                  {/* Real-time Percentage Bar Fill */}
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out opacity-25 ${
                      isRevealed && isCorrect ? 'bg-emerald-400' : color.bg
                    }`}
                    style={{ width: `${pct}%` }}
                  />

                  {/* Option Content */}
                  <div className="relative z-10 flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 pr-2">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-sm sm:text-base shrink-0 shadow-xs ${
                        isRevealed && isCorrect ? 'bg-emerald-500 text-white' : `${color.bg} ${color.text}`
                      }`}>
                        {['A', 'B', 'C', 'D', 'E', 'F'][idx] || idx + 1}
                      </div>
                      <span className="text-base sm:text-xl font-bold text-white tracking-wide truncate">
                        {opt.text}
                      </span>
                      {isRevealed && isCorrect && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-500/40 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Correct</span>
                        </span>
                      )}
                    </div>

                    {/* Percentage & Vote Count */}
                    <div className="text-right shrink-0">
                      <div className="text-xl sm:text-2xl font-black font-mono-numbers text-white">
                        {pct}%
                      </div>
                      <div className="text-[11px] text-slate-400 font-semibold font-mono-numbers">
                        {count} {count === 1 ? 'vote' : 'votes'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 2. WORD CLOUD VISUALIZER */}
        {currentQ.type === 'word_cloud' && (
          <div className="bg-slate-800/50 border border-slate-700/80 rounded-3xl p-6 sm:p-10 min-h-[320px] flex flex-wrap items-center justify-center gap-3 sm:gap-5 shadow-lg relative overflow-hidden">
            {wordCloudWords.length === 0 ? (
              <div className="text-center text-slate-500 py-10">
                <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-2.5 animate-pulse" />
                <p className="text-lg font-bold text-slate-300">Waiting for word cloud submissions...</p>
                <p className="text-xs text-slate-500 mt-1">Submit keywords on your mobile device.</p>
              </div>
            ) : (
              wordCloudWords.map((item, idx) => {
                const sizeWeight = (item.count / maxWordCount);
                const fontSize = Math.max(16, Math.min(52, 16 + sizeWeight * 36));
                const wordColors = [
                  'text-indigo-200 bg-indigo-500/20 border-indigo-500/30',
                  'text-teal-200 bg-teal-500/20 border-teal-500/30',
                  'text-purple-200 bg-purple-500/20 border-purple-500/30',
                  'text-amber-200 bg-amber-500/20 border-amber-500/30',
                ];
                const colorStyle = wordColors[idx % wordColors.length];

                return (
                  <div
                    key={item.text}
                    className={`inline-flex items-center space-x-2 px-4 py-2 rounded-2xl border backdrop-blur-xs transition-all duration-300 hover:scale-105 shadow-xs ${colorStyle}`}
                    style={{ fontSize: `${fontSize}px`, fontWeight: sizeWeight > 0.4 ? 800 : 600 }}
                  >
                    <span>{item.text}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20 text-white font-mono-numbers">
                      {item.count}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 3. RATING SCALE VISUALIZER */}
        {currentQ.type === 'rating' && (
          <div className="max-w-3xl mx-auto bg-slate-800/60 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center mb-6">
              
              {/* Average Score Display */}
              <div className="text-center md:border-r border-slate-700 md:pr-6">
                <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">
                  Average Rating
                </div>
                <div className="text-5xl sm:text-6xl font-black text-amber-400 font-mono-numbers">
                  {ratingStats.avg}
                </div>
                <div className="flex items-center justify-center space-x-1 my-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(Number(ratingStats.avg))
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-xs text-slate-400 font-semibold font-mono-numbers">
                  {ratingStats.totalRatings} ratings submitted
                </div>
              </div>

              {/* Histogram Distribution */}
              <div className="md:col-span-2 space-y-2.5">
                {[5, 4, 3, 2, 1].map((ratingNumber) => {
                  const count = ratingStats.counts[ratingNumber - 1];
                  const pct = ratingStats.totalRatings > 0 ? Math.round((count / ratingStats.totalRatings) * 100) : 0;

                  return (
                    <div key={ratingNumber} className="flex items-center space-x-3 text-xs sm:text-sm">
                      <span className="w-7 font-bold text-slate-300 font-mono-numbers">
                        {ratingNumber}★
                      </span>
                      <div className="flex-1 bg-slate-900/80 h-4 rounded-full overflow-hidden border border-slate-700/60">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs font-bold text-slate-400 font-mono-numbers">
                        {pct}%
                      </span>
                      <span className="w-10 text-right text-xs text-slate-500 font-mono-numbers">
                        ({count})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between text-xs font-bold text-slate-400 border-t border-slate-700/80 pt-3">
              <span>{currentQ.ratingMinLabel || '1 (Low)'}</span>
              <span>{currentQ.ratingMaxLabel || '5 (High)'}</span>
            </div>
          </div>
        )}

        {/* 4. OPEN TEXT WATERFALL */}
        {currentQ.type === 'open_text' && (
          <div className="max-w-3xl mx-auto">
            {responses.length === 0 ? (
              <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-8 text-center text-slate-400">
                <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-2.5 animate-pulse" />
                <p className="text-lg font-bold">Waiting for open audience submissions...</p>
                <p className="text-xs text-slate-500 mt-1">Live responses will appear here as they are typed.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-none">
                {responses.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-sm flex flex-col justify-between"
                  >
                    <p className="text-sm sm:text-base font-semibold text-white leading-relaxed mb-2">
                      "{r.textResponse}"
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/60">
                      <span className="font-bold text-indigo-300">{r.participantName}</span>
                      <span>Just now</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Status Bar: Response Rate & Big Countdown */}
      <footer className="flex items-center justify-between pt-4 sm:pt-6 border-t border-slate-800/80 text-sm">
        
        {/* Total Responses Badge */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 px-3.5 py-1.5 bg-slate-800/90 border border-slate-700/80 rounded-xl font-semibold text-slate-200 text-xs sm:text-sm">
            <Users className="w-4 h-4 text-indigo-400" />
            <span className="font-mono-numbers text-sm sm:text-base font-bold text-white">{totalResponses}</span>
            <span className="text-slate-400">/ {totalParticipants} answered ({responsePercentage}%)</span>
          </div>

          {currentEvent.isVotingLocked && (
            <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-bold">
              Voting Closed
            </span>
          )}
        </div>

        {/* Live Timer Badge */}
        <div className="flex items-center space-x-2 px-4 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/80">
          <Clock className={`w-4 h-4 ${(currentEvent.timerRemainingSeconds ?? 45) <= 5 && currentEvent.isTimerRunning ? 'text-rose-400 animate-spin' : 'text-slate-400'}`} />
          <span className="text-lg sm:text-xl font-bold font-mono-numbers tracking-wider text-white">
            {(() => {
              const remaining = currentEvent.timerRemainingSeconds ?? (currentQ?.timerSeconds || 45);
              const mins = Math.floor(remaining / 60);
              const secs = remaining % 60;
              return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            })()}
          </span>
        </div>
      </footer>
    </div>
  );
};
