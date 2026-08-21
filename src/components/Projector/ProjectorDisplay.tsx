import React, { useEffect, useRef } from 'react';
import { useEvent } from '../../context/EventContext';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Maximize, 
  Star,
  MessageSquare,
  Radio,
  Trophy,
  Crown,
  Award,
  BarChart3,
  CheckCheck,
  Flame,
  HelpCircle
} from 'lucide-react';
import { BrandLogo } from '../Shared/BrandLogo';

export const ProjectorDisplay: React.FC = () => {
  const { currentEvent, fireConfetti, setActiveView, isHost } = useEvent();
  const miniQrRef = useRef<HTMLCanvasElement | null>(null);
  const lobbyQrRef = useRef<HTMLCanvasElement | null>(null);
  const hasFiredFinaleConfettiRef = useRef(false);

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

  // Trigger celebratory corner stage cannons ONCE when session concludes
  useEffect(() => {
    if (currentEvent?.status === 'ended') {
      if (!hasFiredFinaleConfettiRef.current) {
        hasFiredFinaleConfettiRef.current = true;
        // Fire graceful corner cannons that leave the center clear
        confetti({
          particleCount: 70,
          angle: 60,
          spread: 60,
          origin: { x: 0.05, y: 0.85 },
          colors: ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#38BDF8'],
        });
        confetti({
          particleCount: 70,
          angle: 120,
          spread: 60,
          origin: { x: 0.95, y: 0.85 },
          colors: ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#38BDF8'],
        });
      }
    } else {
      hasFiredFinaleConfettiRef.current = false;
    }
  }, [currentEvent?.status]);

  // Render QR Codes for projector (Mini top bar and Large Lobby stage)
  useEffect(() => {
    if (currentEvent) {
      const joinUrl = `${window.location.origin}/?code=${currentEvent.roomCode}`;
      if (miniQrRef.current) {
        QRCode.toCanvas(miniQrRef.current, joinUrl, {
          width: 72,
          margin: 1,
          color: { dark: '#0F172A', light: '#FFFFFF' },
        });
      }
      if (lobbyQrRef.current) {
        QRCode.toCanvas(lobbyQrRef.current, joinUrl, {
          width: 200,
          margin: 1,
          color: { dark: '#0F172A', light: '#FFFFFF' },
        });
      }
    }
  }, [currentEvent, currentEvent?.status]);

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
        
        {/* Left: Branding & Session Progress & Live Participants */}
        <div className="flex items-center space-x-3 sm:space-x-4">
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

          {/* Connected Participants Counter Badge on Projector */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-200 shadow-sm">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono-numbers font-bold text-white text-sm">
              {currentEvent.participants.length}
            </span>
            <span className="text-slate-400 text-xs hidden sm:inline">joined</span>
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

      {/* 0. LOBBY WAITING STAGE (When session is in lobby waiting to start) */}
      {currentEvent.status === 'waiting' ? (
        <main className="my-auto py-6 sm:py-8 max-w-4xl mx-auto w-full text-center">
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            
            {/* Header Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-full text-xs font-bold uppercase tracking-wider mb-4 animate-pulse">
              <Radio className="w-3.5 h-3.5" />
              <span>Live Room Open • Scan & Join</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-display mb-2">
              {currentEvent.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mb-6">
              Join the live interaction from your phone. Polling will begin shortly.
            </p>

            {/* Giant QR & PIN Display */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 my-4">
              <div className="bg-white p-3 rounded-2xl shadow-xl">
                <canvas ref={lobbyQrRef} className="w-44 h-44 sm:w-52 sm:h-52" />
              </div>

              <div className="text-left space-y-3">
                <div className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl">
                  <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">
                    1. Open on your mobile
                  </div>
                  <div className="text-base sm:text-lg font-bold text-indigo-400 font-mono">
                    {window.location.host}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl">
                  <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">
                    2. Enter Room PIN
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono-numbers tracking-widest">
                    {currentEvent.roomCode}
                  </div>
                </div>
              </div>
            </div>

            {/* Connected Participants Counter & Avatar Bar */}
            <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col items-center justify-center">
              <div className="flex items-center space-x-2 text-xs sm:text-sm font-bold text-slate-300 mb-2.5">
                <Users className="w-4 h-4 text-indigo-400" />
                <span className="text-white text-sm sm:text-base font-mono-numbers">{currentEvent.participants.length}</span>
                <span>attendees ready in lobby</span>
              </div>

              {currentEvent.participants.length > 0 ? (
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg max-h-20 overflow-y-auto scrollbar-none py-1">
                  {currentEvent.participants.slice(-12).reverse().map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center space-x-1.5 px-3 py-1 bg-slate-800/90 border border-slate-700 rounded-full text-xs text-slate-200 animate-in fade-in zoom-in-95"
                    >
                      <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px]" style={{ backgroundColor: p.avatarBg }}>
                        {p.avatarEmoji || '👋'}
                      </span>
                      <span className="font-semibold">{p.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Scan QR code above with your camera to join instantly.</p>
              )}
            </div>

          </div>
        </main>
      ) : currentEvent.status === 'ended' ? (
        /* GRAND FINALE / MODERN VIBRANT STAGE */
        <main className="my-auto py-4 sm:py-6 max-w-6xl mx-auto w-full animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 sm:p-7 lg:p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
            
            {/* Ambient Background Lighting */}
            <div className="absolute -top-32 left-1/3 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-32 right-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Clean Punchy Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-emerald-500/20 border border-amber-500/40 rounded-full text-xs font-extrabold text-amber-300 uppercase tracking-widest mb-2 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Polling Finale</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-display">
                {currentEvent.title}
              </h1>
            </div>

            {/* 2-Column Responsive Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              
              {/* LEFT COLUMN: Metric Badges & Audience Highlights (5 cols) */}
              <div className="lg:col-span-5 space-y-3.5">
                
                {/* 3 Bold Metric Cards */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 bg-gradient-to-b from-indigo-950/60 to-slate-900/90 border border-indigo-500/30 rounded-2xl text-center shadow-lg">
                    <div className="flex items-center justify-center space-x-1 text-indigo-400 mb-0.5">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-extrabold uppercase">Peserta</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white font-mono-numbers">
                      {currentEvent.participants.length}
                    </div>
                  </div>

                  <div className="p-3 bg-gradient-to-b from-emerald-950/60 to-slate-900/90 border border-emerald-500/30 rounded-2xl text-center shadow-lg">
                    <div className="flex items-center justify-center space-x-1 text-emerald-400 mb-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-extrabold uppercase">Respon</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white font-mono-numbers">
                      {currentEvent.responses.length}
                    </div>
                  </div>

                  <div className="p-3 bg-gradient-to-b from-amber-950/60 to-slate-900/90 border border-amber-500/30 rounded-2xl text-center shadow-lg">
                    <div className="flex items-center justify-center space-x-1 text-amber-400 mb-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-extrabold uppercase">Soal</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white font-mono-numbers">
                      {currentEvent.questions.length}/{currentEvent.questions.length}
                    </div>
                  </div>
                </div>

                {/* Audience Roll Call Card */}
                {(() => {
                  const hasQuizScoring = currentEvent.isQuizMode || currentEvent.questions.some(q => (q.points || 0) > 0 || (q.options || []).some(o => o.isCorrect));
                  const sortedParticipants = [...currentEvent.participants].sort((a, b) => (b.score || 0) - (a.score || 0));

                  return (
                    <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                        <span className="flex items-center space-x-1.5">
                          {hasQuizScoring ? <Crown className="w-4 h-4 text-amber-400" /> : <Users className="w-4 h-4 text-indigo-400" />}
                          <span>{hasQuizScoring ? 'Leaderboard' : 'Partisipan'}</span>
                        </span>
                      </div>

                      {sortedParticipants.length > 0 ? (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-none">
                          {sortedParticipants.map((p, idx) => {
                            const pResponses = currentEvent.responses.filter(r => r.participantId === p.id).length;
                            return (
                              <div
                                key={p.id}
                                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                                  hasQuizScoring && idx === 0
                                    ? 'bg-amber-500/20 border-amber-400/80 text-amber-200 shadow-md ring-1 ring-amber-400/40'
                                    : hasQuizScoring && idx === 1
                                    ? 'bg-slate-300/15 border-slate-300/60 text-slate-200'
                                    : hasQuizScoring && idx === 2
                                    ? 'bg-amber-700/20 border-amber-600/60 text-amber-300'
                                    : 'bg-slate-900/90 border-slate-800 text-slate-200'
                                }`}
                              >
                                <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                                  <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0" style={{ backgroundColor: p.avatarBg }}>
                                    {hasQuizScoring ? (idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : p.avatarEmoji || '👋') : (p.avatarEmoji || '👋')}
                                  </span>
                                  <span className="font-bold truncate text-white">{p.name}</span>
                                </div>

                                {hasQuizScoring && p.score !== undefined && p.score > 0 ? (
                                  <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded-md text-xs font-bold text-amber-300 font-mono shrink-0">
                                    {p.score} pts
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/40 rounded-md text-[11px] font-bold text-indigo-300 font-mono shrink-0">
                                    {pResponses}/{currentEvent.questions.length} dijawab
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 text-center py-4">Belum ada peserta.</p>
                      )}
                    </div>
                  );
                })()}

              </div>

              {/* RIGHT COLUMN: Question Results Recap (7 cols) */}
              <div className="lg:col-span-7 space-y-3">
                <div className="p-4 sm:p-5 bg-slate-950/80 border border-slate-800 rounded-2xl">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider mb-3.5">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    <span>Hasil Polling</span>
                  </div>

                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-none">
                    {currentEvent.questions.map((q, qIdx) => {
                      const qResponses = currentEvent.responses.filter(r => r.questionId === q.id);
                      const totalQResponses = qResponses.length;

                      return (
                        <div
                          key={q.id}
                          className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center space-x-2 min-w-0">
                              <span className="px-1.5 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold font-mono shrink-0">
                                Q{qIdx + 1}
                              </span>
                              <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                                {q.title}
                              </h4>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                              {totalQResponses} suara
                            </span>
                          </div>

                          {/* Highlights per Type */}
                          {/* 1. Multiple Choice / True False: Show top choice with animated fill bar */}
                          {(q.type === 'multiple_choice' || q.type === 'true_false') && (() => {
                            const counts: Record<string, number> = {};
                            qResponses.forEach(r => {
                              (r.selectedOptionIds || []).forEach(optId => {
                                counts[optId] = (counts[optId] || 0) + 1;
                              });
                            });
                            const topOptId = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
                            const topOpt = (q.options || []).find(o => o.id === topOptId);
                            const topCount = topOptId ? counts[topOptId] : 0;
                            const topPct = totalQResponses > 0 && topCount ? Math.round((topCount / totalQResponses) * 100) : 0;

                            return (
                              <div className="pt-0.5">
                                {topOpt ? (
                                  <div className="relative overflow-hidden rounded-lg bg-slate-800/80 border border-emerald-500/40 p-2.5 flex items-center justify-between">
                                    <div
                                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/30 to-teal-500/20 transition-all duration-700"
                                      style={{ width: `${topPct}%` }}
                                    />
                                    <span className="relative z-10 text-xs font-bold text-white truncate pr-2">
                                      ✓ {topOpt.text}
                                    </span>
                                    <span className="relative z-10 text-xs font-mono font-black text-emerald-400 shrink-0">
                                      {topPct}% ({topCount})
                                    </span>
                                  </div>
                                ) : (
                                  <div className="text-xs text-slate-500 italic">Belum ada jawaban.</div>
                                )}
                              </div>
                            );
                          })()}

                          {/* 2. Rating Scale: Show average */}
                          {q.type === 'rating' && (() => {
                            const avg = totalQResponses > 0
                              ? (qResponses.reduce((acc, r) => acc + (r.ratingValue || 0), 0) / totalQResponses).toFixed(1)
                              : '0.0';
                            return (
                              <div className="flex items-center justify-between text-xs p-2.5 bg-slate-800/80 border border-amber-500/40 rounded-lg">
                                <span className="font-bold text-amber-300">
                                  Rata-rata: <strong className="text-amber-400 font-mono text-sm">{avg}</strong> / {q.ratingMax || 5}.0
                                </span>
                                {q.ratingMaxLabel && (
                                  <span className="text-[11px] text-slate-400 font-medium truncate">
                                    {q.ratingMaxLabel}
                                  </span>
                                )}
                              </div>
                            );
                          })()}

                          {/* 3. Word Cloud: Show top words */}
                          {q.type === 'word_cloud' && (() => {
                            const wordMap: Record<string, number> = {};
                            qResponses.forEach(r => {
                              const w = (r.textResponse || '').trim().toLowerCase();
                              if (w) wordMap[w] = (wordMap[w] || 0) + 1;
                            });
                            const topWords = Object.keys(wordMap).sort((a, b) => wordMap[b] - wordMap[a]).slice(0, 3);

                            return (
                              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                {topWords.length > 0 ? (
                                  topWords.map((word) => (
                                    <span key={word} className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/40 rounded-md text-xs font-bold text-indigo-300">
                                      {word} ({wordMap[word]})
                                    </span>
                                  ))
                                ) : (
                                  <div className="text-xs text-slate-500 italic">Belum ada kata.</div>
                                )}
                              </div>
                            );
                          })()}

                          {/* 4. Open Text */}
                          {q.type === 'open_text' && (
                            <div className="text-xs text-slate-300 italic pt-0.5">
                              {totalQResponses > 0
                                ? `"${qResponses[qResponses.length - 1]?.textResponse || ''}"`
                                : 'Belum ada tanggapan.'}
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

          </div>
        </main>
      ) : (
        /* Main Question & Live Results Visualizer */
        <main className="my-auto py-6 sm:py-8 max-w-5xl mx-auto w-full">
          
          {/* Large Distance-Readable Question Title */}
          <div className="mb-6 sm:mb-10 text-center">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto font-display drop-shadow-sm">
              {currentQ?.title}
            </h2>
            {currentQ?.subtitle && (
              <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-2xl mx-auto">
                {currentQ.subtitle}
              </p>
            )}
          </div>

          {/* 1. MULTIPLE CHOICE & TRUE/FALSE VISUALIZER */}
          {currentQ && (currentQ.type === 'multiple_choice' || currentQ.type === 'true_false') && (
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
                          {isRevealed && isCorrect ? '✓' : ['A', 'B', 'C', 'D', 'E', 'F'][idx] || idx + 1}
                        </div>
                        <span className="text-base sm:text-xl font-bold text-white leading-snug">
                          {opt.text}
                        </span>
                      </div>

                      {/* Vote Count & Percent */}
                      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                        {currentEvent.showResultsOnProjector && (
                          <>
                            <span className="text-xl sm:text-3xl font-black font-mono-numbers tracking-tight text-white">
                              {pct}%
                            </span>
                            <span className="text-xs sm:text-sm text-slate-400 font-mono-numbers">
                              ({count})
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. WORD CLOUD VISUALIZER */}
          {currentQ && currentQ.type === 'word_cloud' && (
            <div className="max-w-4xl mx-auto min-h-[300px] flex flex-wrap items-center justify-center gap-3 sm:gap-5 p-6 bg-slate-800/40 rounded-3xl border border-slate-700/60 backdrop-blur-md">
              {wordCloudWords.length === 0 ? (
                <div className="text-center text-slate-500 py-12">
                  <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-2 animate-bounce" />
                  <p className="text-lg font-bold text-slate-300">Audience Word Cloud Active</p>
                  <p className="text-xs text-slate-500 mt-1">Submit keywords on your device to watch the cloud grow live.</p>
                </div>
              ) : (
                wordCloudWords.map((item, idx) => {
                  const scale = Math.max(1, (item.count / maxWordCount) * 2.8);
                  const color = colors[idx % colors.length];
                  return (
                    <span
                      key={item.text}
                      className={`inline-block font-extrabold transition-all duration-500 rounded-2xl px-3.5 py-1.5 shadow-md ${color.bg} text-white animate-in fade-in zoom-in-75`}
                      style={{
                        fontSize: `${Math.min(2.5, 0.9 + scale * 0.45)}rem`,
                        opacity: Math.max(0.65, item.count / maxWordCount),
                      }}
                    >
                      {item.text} <span className="text-xs opacity-75 font-mono">({item.count})</span>
                    </span>
                  );
                })
              )}
            </div>
          )}

          {/* 3. VERSATILE RATING & OPINION SCALE VISUALIZER */}
          {currentQ && currentQ.type === 'rating' && (() => {
            const style = currentQ.ratingStyle || 'numeric';
            const maxVal = currentQ.ratingMax || 5;
            const minVal = currentQ.ratingMin || 1;
            const range = Array.from({ length: maxVal - minVal + 1 }, (_, i) => maxVal - i); // Descending for chart
            const emojis = ['😡', '🙁', '😐', '😊', '🤩'];
            const likertDefaults = ['Sangat Tidak Setuju', 'Tidak Setuju', 'Netral', 'Setuju', 'Sangat Setuju'];

            const getStepLabel = (val: number) => {
              const idx = val - minVal;
              if (currentQ.ratingLabels?.[idx]) return currentQ.ratingLabels[idx];
              if (style === 'likert') return likertDefaults[idx] || `Tingkat ${val}`;
              if (val === minVal && currentQ.ratingMinLabel) return currentQ.ratingMinLabel;
              if (val === maxVal && currentQ.ratingMaxLabel) return currentQ.ratingMaxLabel;
              return `Skala ${val}`;
            };

            return (
              <div className="max-w-3xl mx-auto bg-slate-800/60 border border-slate-700 rounded-3xl p-6 sm:p-8 text-center backdrop-blur-md">
                
                {/* Main Average Score Display */}
                <div className="mb-6">
                  <div className="text-5xl sm:text-7xl font-black font-mono-numbers text-amber-400 mb-1 drop-shadow-md">
                    {ratingStats.avg} <span className="text-xl sm:text-3xl text-slate-400 font-semibold">/ {maxVal}.0</span>
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-wider">
                    {currentQ.ratingMinLabel && currentQ.ratingMaxLabel ? (
                      <span>{currentQ.ratingMinLabel} ➔ {currentQ.ratingMaxLabel}</span>
                    ) : (
                      <span>Rata-Rata Respon Audiens</span>
                    )}
                  </div>
                </div>

                {/* Star visualizer only when style is stars */}
                {style === 'stars' && (
                  <div className="flex items-center justify-center space-x-1.5 mb-6 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-7 h-7 sm:w-9 sm:h-9 ${
                          s <= Math.round(Number(ratingStats.avg)) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Breakdown Bars per Rating Step */}
                <div className="space-y-2.5 max-w-lg mx-auto">
                  {range.map((stepVal) => {
                    const count = ratingStats.counts[stepVal - 1] || 0;
                    const pct = ratingStats.totalRatings > 0 ? Math.round((count / ratingStats.totalRatings) * 100) : 0;
                    const stepLabel = getStepLabel(stepVal);

                    return (
                      <div key={stepVal} className="flex items-center space-x-3 text-xs sm:text-sm font-semibold text-slate-300">
                        <span className="w-28 sm:w-36 text-right truncate text-slate-300 font-bold" title={stepLabel}>
                          {style === 'emoji' ? emojis[stepVal - 1] || stepVal : `${stepVal} • ${stepLabel}`}
                        </span>
                        <div className="flex-1 bg-slate-700/80 h-3.5 rounded-full overflow-hidden p-0.5">
                          <div
                            className="bg-amber-400 h-full rounded-full transition-all duration-700 shadow-sm"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-14 text-left font-mono-numbers text-xs text-slate-300">
                          {pct}% <span className="text-slate-500">({count})</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* 4. OPEN TEXT WATERFALL */}
          {currentQ && currentQ.type === 'open_text' && (
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
      )}

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
