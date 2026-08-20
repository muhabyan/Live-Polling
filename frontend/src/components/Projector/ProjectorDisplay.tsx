import React, { useEffect, useRef } from 'react';
import { useEvent } from '../../context/EventContext';
import QRCode from 'qrcode';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Maximize, 
  Trophy, 
  Star,
  MessageSquare,
  QrCode,
  Flame,
  Radio
} from 'lucide-react';

export const ProjectorDisplay: React.FC = () => {
  const { currentEvent, fireConfetti } = useEvent();
  const miniQrRef = useRef<HTMLCanvasElement | null>(null);

  const currentQ = currentEvent?.questions[currentEvent.currentQuestionIndex];
  const responses = (currentEvent?.responses || []).filter(r => r.questionId === currentQ?.id);
  const totalResponses = responses.length;
  const totalParticipants = Math.max(currentEvent?.participants.length || 0, totalResponses);
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
        width: 80,
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
      <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center bg-slate-900 text-white p-8 text-center">
        <div>
          <Radio className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-3xl font-extrabold mb-2">No Active Session</h2>
          <p className="text-slate-400">Launch a session from Presenter Controls or Admin Studio.</p>
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
        // Split by comma or whitespace for multi-words
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
    const counts = [0, 0, 0, 0, 0]; // 1 to 5
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
      { bg: 'bg-indigo-500', fill: '#6366f1', light: 'bg-indigo-100', text: 'text-white', border: 'border-indigo-600' },
      { bg: 'bg-emerald-500', fill: '#10b981', light: 'bg-emerald-100', text: 'text-white', border: 'border-emerald-600' },
      { bg: 'bg-amber-500', fill: '#f59e0b', light: 'bg-amber-100', text: 'text-white', border: 'border-amber-600' },
      { bg: 'bg-violet-500', fill: '#8b5cf6', light: 'bg-violet-100', text: 'text-white', border: 'border-violet-600' },
    ];

  return (
    <div className="w-full min-h-[calc(100vh-4.5rem)] bg-slate-900 text-white flex flex-col justify-between p-4 sm:p-8 lg:p-12 select-none relative overflow-hidden">
      
      {/* Decorative Stage Lighting Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Projector Stage Bar */}
      <header className="flex items-center justify-between pb-6 border-b border-slate-800">
        
        {/* Left: Session Branding & Progress */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-slate-900 font-bold text-2xl shadow-sm">
            P
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-300">
                {currentEvent.title}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs font-medium">
                Question {currentEvent.currentQuestionIndex + 1} of {currentEvent.questions.length}
              </span>
            </div>
            <h1 className="text-sm sm:text-base text-slate-500 font-medium">
              Live Projector Feed
            </h1>
          </div>
        </div>

        {/* Right: Join Instructions & Mini QR Code */}
        <div className="flex items-center space-x-4">
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl px-4 py-2.5 flex items-center space-x-4 shadow-md">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Join at <strong className="text-white normal-case">{window.location.host}</strong>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Code:</span>
                <span className="text-2xl font-semibold font-mono tracking-widest text-white">
                  {currentEvent.roomCode}
                </span>
              </div>
            </div>
            <div className="bg-white p-1 rounded-lg shrink-0 shadow-xs">
              <canvas ref={miniQrRef} className="w-14 h-14" />
            </div>
          </div>

          <button
            onClick={toggleFullScreen}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl transition-colors"
            title="Toggle Fullscreen"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Question & Live Results Visualizer */}
      <main className="my-auto py-8 max-w-6xl mx-auto w-full">
        
        {/* Large Distance-Readable Question Title */}
        <div className="mb-10 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white tracking-tight leading-tight max-w-4xl mx-auto drop-shadow-sm">
            {currentQ.title}
          </h2>
          {currentQ.subtitle && (
            <p className="text-base sm:text-lg text-slate-400 mt-3 max-w-2xl mx-auto font-normal">
              {currentQ.subtitle}
            </p>
          )}
        </div>

        {/* 1. MULTIPLE CHOICE & TRUE/FALSE VISUALIZER */}
        {(currentQ.type === 'multiple_choice' || currentQ.type === 'true_false') && (
          <div className="space-y-4 max-w-4xl mx-auto">
            {(currentQ.options || []).map((opt, idx) => {
              const count = optionStats[opt.id] || 0;
              const pct = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
              const color = colors[idx % colors.length];
              const isCorrect = opt.isCorrect;
              const isRevealed = currentEvent.revealAnswer;

              return (
                <div
                  key={opt.id}
                  className={`relative overflow-hidden rounded-xl border transition-all p-5 sm:p-6 ${
                    isRevealed && isCorrect
                      ? 'border-emerald-400 bg-emerald-900/60 ring-4 ring-emerald-500/20'
                      : isRevealed && !isCorrect
                      ? 'border-slate-800 bg-slate-800/40 opacity-50'
                      : 'border-slate-700 bg-slate-800/70 hover:border-slate-600'
                  }`}
                >
                  {/* Real-time Percentage Bar Fill */}
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out opacity-20 ${
                      isRevealed && isCorrect ? 'bg-emerald-400' : color.bg
                    }`}
                    style={{ width: `${pct}%` }}
                  />

                  {/* Option Content */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center space-x-4 pr-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg shadow-sm ${
                        isRevealed && isCorrect ? 'bg-emerald-500 text-white' : `${color.bg} ${color.text}`
                      }`}>
                        {['A', 'B', 'C', 'D', 'E'][idx] || idx + 1}
                      </div>
                      <span className="text-xl sm:text-2xl font-semibold text-white tracking-wide">
                        {opt.text}
                      </span>
                      {isRevealed && isCorrect && (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold uppercase tracking-wider shadow-sm border border-emerald-500/30">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Correct Answer</span>
                        </span>
                      )}
                    </div>

                    {/* Percentage & Vote Count */}
                    <div className="text-right shrink-0">
                      <div className="text-2xl sm:text-3xl font-semibold font-mono-numbers text-white">
                        {pct}%
                      </div>
                      <div className="text-xs text-slate-400 font-semibold font-mono-numbers">
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
          <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-8 min-h-[380px] flex flex-wrap items-center justify-center gap-4 sm:gap-6 shadow-sm relative overflow-hidden">
            {wordCloudWords.length === 0 ? (
              <div className="text-center text-slate-500 py-12">
                <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
                <p className="text-xl font-semibold text-slate-400">Waiting for audience word submissions...</p>
                <p className="text-sm text-slate-500 mt-1">Submit keywords on your mobile device.</p>
              </div>
            ) : (
              wordCloudWords.map((item, idx) => {
                // Scale font size based on frequency
                const sizeWeight = (item.count / maxWordCount);
                const fontSize = Math.max(18, Math.min(64, 18 + sizeWeight * 42));
                const wordColors = [
                  'text-indigo-200 bg-indigo-500/20 border-indigo-500/30',
                  'text-emerald-200 bg-emerald-500/20 border-emerald-500/30',
                  'text-violet-200 bg-violet-500/20 border-violet-500/30',
                  'text-amber-200 bg-amber-500/20 border-amber-500/30',
                ];
                const colorStyle = wordColors[idx % wordColors.length];

                return (
                  <div
                    key={item.text}
                    className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl border backdrop-blur-xs transition-all duration-500 hover:scale-110 shadow-sm ${colorStyle}`}
                    style={{ fontSize: `${fontSize}px`, fontWeight: sizeWeight > 0.5 ? 700 : 500 }}
                  >
                    <span>{item.text}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-mono-numbers">
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
          <div className="max-w-4xl mx-auto bg-slate-800/70 border border-slate-700/80 rounded-2xl p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center mb-8">
              
              {/* Average Score Big Display */}
              <div className="text-center md:border-r border-slate-700 md:pr-8">
                <div className="text-xs uppercase font-semibold tracking-widest text-slate-400 mb-1">
                  Average Rating
                </div>
                <div className="text-6xl sm:text-7xl font-semibold text-amber-500 font-mono-numbers">
                  {ratingStats.avg}
                </div>
                <div className="flex items-center justify-center space-x-1 my-2 text-white">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 ${
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

              {/* Histogram Distribution Bars */}
              <div className="md:col-span-2 space-y-3">
                {[5, 4, 3, 2, 1].map((ratingNumber) => {
                  const count = ratingStats.counts[ratingNumber - 1];
                  const pct = ratingStats.totalRatings > 0 ? Math.round((count / ratingStats.totalRatings) * 100) : 0;

                  return (
                    <div key={ratingNumber} className="flex items-center space-x-3 text-sm">
                      <span className="w-8 font-semibold text-slate-300 font-mono-numbers flex items-center">
                        {ratingNumber}★
                      </span>
                      <div className="flex-1 bg-slate-900 h-5 rounded-full overflow-hidden p-0.5 border border-slate-700">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-xs font-semibold text-slate-400 font-mono-numbers">
                        {pct}%
                      </span>
                      <span className="w-12 text-right text-xs text-slate-500 font-mono-numbers">
                        ({count})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between text-xs font-bold text-slate-400 border-t border-slate-700/80 pt-4">
              <span>{currentQ.ratingMinLabel || '1 = Low'}</span>
              <span>{currentQ.ratingMaxLabel || '5 = High'}</span>
            </div>
          </div>
        )}

        {/* 4. OPEN TEXT WATERFALL VISUALIZER */}
        {currentQ.type === 'open_text' && (
          <div className="max-w-4xl mx-auto">
            {responses.length === 0 ? (
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-12 text-center text-slate-400">
                <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
                <p className="text-xl font-semibold">Waiting for open audience submissions...</p>
                <p className="text-sm text-slate-500 mt-1">Responses appear here live as they are typed.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-2">
                {responses.map((r) => (
                  <div
                    key={r.id}
                    className="p-5 rounded-xl bg-slate-800/80 border border-slate-700 shadow-sm flex flex-col justify-between"
                  >
                    <p className="text-base sm:text-lg font-medium text-white leading-relaxed mb-3">
                      "{r.textResponse}"
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/60">
                      <span className="font-semibold text-slate-300">{r.participantName}</span>
                      <span>Just now</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Status Bar: Response Rate & Timer */}
      <footer className="flex items-center justify-between pt-6 border-t border-slate-800 text-sm">
        
        {/* Total Responses Badge */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-4 py-2 bg-slate-800 rounded-lg font-semibold text-slate-200">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="font-mono-numbers text-base font-semibold text-white">{totalResponses}</span>
            <span className="text-slate-400">/ {totalParticipants} answered ({responsePercentage}%)</span>
          </div>

          {currentEvent.isVotingLocked && (
            <span className="px-3 py-1 bg-slate-700 text-slate-300 border border-slate-600 rounded-lg text-xs font-semibold">
              Voting Closed
            </span>
          )}
        </div>

        {/* Big Live Timer */}
        <div className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-slate-800 border border-slate-700">
          <Clock className={`w-5 h-5 ${currentEvent.timerRemainingSeconds! <= 5 ? 'text-slate-100 animate-spin' : 'text-slate-400'}`} />
          <span className="text-xl sm:text-2xl font-semibold font-mono tracking-widest text-white">
            00:{currentEvent.timerRemainingSeconds! < 10 ? `0${currentEvent.timerRemainingSeconds}` : currentEvent.timerRemainingSeconds}
          </span>
        </div>
      </footer>
    </div>
  );
};
