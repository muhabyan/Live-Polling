import React, { useEffect, useRef, useState } from 'react';
import { useEvent } from '../../context/EventContext';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { 
  Users, 
  Clock, 
  Sparkles, 
  Maximize, 
  Star,
  MessageSquare,
  Radio,
  Sun,
  Moon
} from 'lucide-react';
import { BrandLogo } from '../Shared/BrandLogo';
import { PikteraMascot } from '../Shared/PikteraMascot';
import { ParticipantCreditsRoll } from './ParticipantCreditsRoll';

export const ProjectorDisplay: React.FC = () => {
  const { currentEvent, fireConfetti, setActiveView, isHost } = useEvent();
  const miniQrRef = useRef<HTMLCanvasElement | null>(null);
  const lobbyQrRef = useRef<HTMLCanvasElement | null>(null);
  const hasFiredFinaleConfettiRef = useRef(false);

  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
  };

  // Press ESC to exit Projector mode
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
        confetti({
          particleCount: 70,
          angle: 60,
          spread: 60,
          origin: { x: 0.05, y: 0.85 },
          colors: ['#C1FF33', '#FF1784', '#2F36C9', '#FACC15', '#000000'],
        });
        confetti({
          particleCount: 70,
          angle: 120,
          spread: 60,
          origin: { x: 0.95, y: 0.85 },
          colors: ['#C1FF33', '#FF1784', '#2F36C9', '#FACC15', '#000000'],
        });
      }
    } else {
      hasFiredFinaleConfettiRef.current = false;
    }
  }, [currentEvent?.status]);

  // Render QR Codes
  useEffect(() => {
    if (currentEvent) {
      const joinUrl = `${window.location.origin}/?code=${currentEvent.roomCode}`;
      if (miniQrRef.current) {
        QRCode.toCanvas(miniQrRef.current, joinUrl, {
          width: 72,
          margin: 1,
          color: { dark: '#000000', light: '#FFFFFF' },
        });
      }
      if (lobbyQrRef.current) {
        QRCode.toCanvas(lobbyQrRef.current, joinUrl, {
          width: 200,
          margin: 1,
          color: { dark: '#000000', light: '#FFFFFF' },
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
      <div className="min-h-screen-dvh flex items-center justify-center p-8 text-center bg-dot-grid">
        <div className="neo-card p-8 max-w-md mx-auto">
          <Radio className="w-16 h-16 text-[#2F36C9] mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl sm:text-3xl font-black mb-2 font-heading uppercase">No Active Presentation</h2>
          <p className="text-gray-500 mb-6 text-sm font-mono">Launch a session from Presenter Controls or Admin Studio.</p>
          <button
            onClick={() => setActiveView(isHost ? 'presenter' : 'participant')}
            className="neo-btn px-5 py-2.5 bg-[#C1FF33] text-[#000000] font-black text-xs"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Calculate vote counts
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
    { bg: 'bg-[#2F36C9]', hex: '#2F36C9', text: 'text-white' },
    { bg: 'bg-[#0D9488]', hex: '#0D9488', text: 'text-white' },
    { bg: 'bg-[#FF1784]', hex: '#FF1784', text: 'text-white' },
    { bg: 'bg-[#D97706]', hex: '#D97706', text: 'text-white' },
    { bg: 'bg-[#7C3AED]', hex: '#7C3AED', text: 'text-white' },
  ];

  const isDark = theme === 'dark';

  return (
    <div className={`w-full min-h-screen-dvh flex flex-col justify-between select-none relative overflow-hidden transition-colors ${
      isDark ? 'bg-dot-grid-dark text-white' : 'bg-dot-grid text-[#000000]'
    }`}>
      {/* Inner content bounded at 1280px for readability on wide projectors */}
      <div className="w-full max-w-screen-xl mx-auto flex flex-col justify-between min-h-screen-dvh p-4 sm:p-6 lg:p-10">
      
      {/* Top Projector Stage Bar */}
      <header className="flex items-center justify-between pb-2 sm:pb-4 gap-3 relative z-10">
        
        {/* Left: Branding & Progress */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <BrandLogo size="sm" showText={true} theme={isDark ? 'dark' : 'light'} />
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-[11px] font-black uppercase tracking-widest font-mono ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {currentEvent.title}
              </span>
              {currentEvent.status === 'live' ? (
                <span className="neo-badge bg-[#C1FF33] text-[#000000] font-mono">
                  Q {currentEvent.currentQuestionIndex + 1} / {currentEvent.questions.length}
                </span>
              ) : currentEvent.status === 'waiting' ? (
                <span className="neo-badge bg-[#C1FF33] text-[#000000] font-mono">
                  Lobby
                </span>
              ) : null}
            </div>
            <div className="text-xs font-bold text-gray-500 font-mono">
              Live Stage
            </div>
          </div>

          {/* Connected Participants Counter */}
          <div className={`neo-badge ${isDark ? 'bg-[#1a1a2e] text-white' : 'bg-white text-[#000000]'} text-xs`}>
            <Users className="w-3.5 h-3.5 text-[#2F36C9]" />
            <span className="font-mono font-black text-sm">
              {currentEvent.participants.length}
            </span>
            <span className="text-gray-400 font-normal hidden sm:inline">joined</span>
          </div>
        </div>

        {/* Right: Join Instructions & Mini QR Code & Theme Toggle */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {currentEvent.status !== 'ended' ? (
            <div className={`rounded-xl border-2 border-[#000000] px-3.5 py-2 flex items-center space-x-3 ${
              isDark ? 'bg-[#1a1a2e]' : 'bg-white'
            }`} style={{ boxShadow: '3px 3px 0px #000000' }}>
              <div>
                <div className="text-[10px] uppercase font-black tracking-wider text-gray-500 font-mono">
                  Join at <strong className="text-[#2F36C9] normal-case font-bold">{window.location.host}</strong>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-gray-500 font-mono">PIN:</span>
                  <span className={`text-xl sm:text-2xl font-black font-mono tracking-widest ${
                    isDark ? 'text-white' : 'text-[#000000]'
                  }`}>
                    {currentEvent.roomCode}
                  </span>
                </div>
              </div>
              <div className="bg-white p-0.5 rounded-md border-2 border-[#000000] shrink-0">
                <canvas ref={miniQrRef} className="w-11 h-11 sm:w-12 sm:h-12" />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-[#000000] px-3.5 py-2 bg-[#FF1784] text-white flex items-center space-x-2" style={{ boxShadow: '3px 3px 0px #000000' }}>
              <span className="text-xs font-black uppercase tracking-wider font-mono">
                Session Finished • Closed
              </span>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`neo-btn p-2.5 ${isDark ? 'bg-[#1a1a2e] text-white' : 'bg-white text-[#000000]'}`}
            title={isDark ? 'Light Mode' : 'Dark Mode'}
          >
            {isDark ? <Sun className="w-4 h-4 text-[#C1FF33]" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleFullScreen}
            className={`neo-btn p-2.5 ${isDark ? 'bg-[#1a1a2e] text-white' : 'bg-white text-[#000000]'}`}
            title="Toggle Fullscreen"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 0. LOBBY WAITING STAGE */}
      {currentEvent.status === 'waiting' ? (
        <main className="my-auto py-6 sm:py-8 max-w-4xl mx-auto w-full text-center relative z-10">
          <div className={`neo-card p-6 sm:p-10 text-center relative overflow-hidden ${
            isDark ? 'bg-[#1a1a2e]' : 'bg-white'
          }`}>
            
            {/* Header Badge */}
            <div className="inline-flex items-center space-x-2 neo-badge bg-[#C1FF33] text-[#000000] text-xs font-black uppercase mb-4 animate-pulse">
              <Radio className="w-3.5 h-3.5" />
              <span>Live Room Open • Scan & Join</span>
            </div>

            <div className="flex items-center justify-center space-x-3 mb-2">
              <h1 className={`text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight font-heading uppercase ${
                isDark ? 'text-white' : 'text-[#000000]'
              }`}>
                {currentEvent.title}
              </h1>
              <PikteraMascot size="sm" mood="happy" headOnly={false} />
            </div>

            <p className="text-xs sm:text-sm max-w-lg mx-auto mb-6 text-gray-500 font-mono font-bold">
              Join the live interaction from your phone. Polling will begin shortly.
            </p>

            {/* Giant QR & PIN Display */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 my-4">
              <div className="bg-white p-3 rounded-xl border-2 border-[#000000]" style={{ boxShadow: '4px 4px 0px #000000' }}>
                <canvas ref={lobbyQrRef} className="w-44 h-44 sm:w-52 sm:h-52" />
              </div>

              <div className="text-left space-y-3">
                <div className={`p-3.5 rounded-xl border-2 border-[#000000] ${
                  isDark ? 'bg-[#252542]' : 'bg-[#FFF8F0]'
                }`} style={{ boxShadow: '3px 3px 0px #000000' }}>
                  <div className="text-[11px] uppercase font-black tracking-wider mb-0.5 text-gray-500 font-mono">
                    1. Open on your mobile
                  </div>
                  <div className="text-base sm:text-lg font-black text-[#2F36C9] font-mono">
                    {window.location.host}
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border-2 border-[#000000] ${
                  isDark ? 'bg-[#252542]' : 'bg-[#FFF8F0]'
                }`} style={{ boxShadow: '3px 3px 0px #000000' }}>
                  <div className="text-[11px] uppercase font-black tracking-wider mb-0.5 text-gray-500 font-mono">
                    2. Enter Room PIN
                  </div>
                  <div className={`text-2xl sm:text-3xl font-black font-mono tracking-widest ${
                    isDark ? 'text-white' : 'text-[#000000]'
                  }`}>
                    {currentEvent.roomCode}
                  </div>
                </div>
              </div>
            </div>

            {/* Connected Participants Counter & Credits Roll */}
            <div className="mt-6 pt-5 border-t-2 border-[#000000]/10 flex flex-col items-center justify-center w-full">
              <div className="flex items-center space-x-2 text-xs sm:text-sm font-bold mb-3 font-mono">
                <Users className="w-4 h-4 text-[#2F36C9]" />
                <span className={`font-black ${isDark ? 'text-white' : 'text-[#000000]'}`}>
                  {currentEvent.participants.length}
                </span>
                <span>attendees connected to room</span>
              </div>

              <ParticipantCreditsRoll
                participants={currentEvent.participants}
                theme={theme}
                maxHeight="max-h-[160px] sm:max-h-[220px]"
                isQuizMode={currentEvent.isQuizMode}
                title="Live Attendees"
              />
            </div>

          </div>
        </main>
      ) : currentEvent.status === 'ended' ? (
        /* GRAND FINALE — Balanced landscape, vertically centered & rich */
        <main className="my-auto py-4 sm:py-6 w-full relative z-10 flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row gap-6 items-stretch">

            {/* LEFT COLUMN: Fixed summary stage */}
            <div className={`lg:w-[320px] xl:w-[360px] shrink-0 rounded-2xl border-4 border-[#000000] p-6 flex flex-col justify-between gap-5 ${
              isDark ? 'bg-[#1a1a2e]' : 'bg-white'
            }`} style={{ boxShadow: '6px 6px 0px #000000' }}>

              {/* Mascot + badge + title */}
              <div className="flex flex-col items-center text-center gap-3">
                <PikteraMascot size="md" mood="celebrating" />
                <span className="neo-badge bg-[#C1FF33] text-[#000000] text-xs font-black uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Session Concluded</span>
                </span>
                <h1 className={`text-2xl sm:text-3xl font-black tracking-tight font-heading uppercase leading-tight ${
                  isDark ? 'text-white' : 'text-[#000000]'
                }`}>
                  {currentEvent.title}
                </h1>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className={`rounded-xl border-2 border-[#000000] p-3 text-center ${
                  isDark ? 'bg-[#252542]' : 'bg-[#FFF8F0]'
                }`} style={{ boxShadow: '3px 3px 0 #000' }}>
                  <span className="block text-2xl sm:text-3xl font-black font-mono text-[#2F36C9]">
                    {currentEvent.participants.length}
                  </span>
                  <span className="text-[10px] font-black uppercase font-mono text-gray-500">Peserta</span>
                </div>
                <div className={`rounded-xl border-2 border-[#000000] p-3 text-center ${
                  isDark ? 'bg-[#252542]' : 'bg-[#FFF8F0]'
                }`} style={{ boxShadow: '3px 3px 0 #000' }}>
                  <span className="block text-2xl sm:text-3xl font-black font-mono text-[#FF1784]">
                    {currentEvent.responses.length}
                  </span>
                  <span className="text-[10px] font-black uppercase font-mono text-gray-500">Respon</span>
                </div>
                <div className={`rounded-xl border-2 border-[#000000] p-3 text-center ${
                  isDark ? 'bg-[#252542]' : 'bg-[#FFF8F0]'
                }`} style={{ boxShadow: '3px 3px 0 #000' }}>
                  <span className={`block text-2xl sm:text-3xl font-black font-mono ${isDark ? 'text-white' : 'text-[#000000]'}`}>
                    {currentEvent.questions.length}
                  </span>
                  <span className="text-[10px] font-black uppercase font-mono text-gray-500">Soal</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Question results — rich & prominent */}
            <div className="flex-1 overflow-y-auto space-y-4 max-h-[600px] pr-1"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#C1FF33 transparent' }}>

              {currentEvent.questions.map((q, qIdx) => {
                const qResponses = currentEvent.responses.filter(r => r.questionId === q.id);
                const totalQResponses = qResponses.length;

                return (
                  <div key={q.id} className={`rounded-2xl border-4 border-[#000000] p-5 sm:p-7 space-y-4 ${
                    isDark ? 'bg-[#1a1a2e]' : 'bg-white'
                  }`} style={{ boxShadow: '6px 6px 0px #000000' }}>

                    {/* Question header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="neo-badge bg-[#2F36C9] text-white text-sm font-mono shrink-0 px-3 py-1">
                          {String(qIdx + 1).padStart(2, '0')}
                        </span>
                        <h3 className={`text-lg sm:text-2xl font-black tracking-tight leading-snug ${
                          isDark ? 'text-white' : 'text-[#000000]'
                        }`}>
                          {q.title}
                        </h3>
                      </div>
                      <span className={`shrink-0 text-sm font-black font-mono px-3 py-1.5 rounded-xl border-2 border-[#000000] ${
                        isDark ? 'bg-[#252542] text-white' : 'bg-gray-50 text-[#000000]'
                      }`}>
                        {totalQResponses} suara
                      </span>
                    </div>

                    {/* ── MULTIPLE CHOICE ── */}
                    {q.type === 'multiple_choice' && (() => {
                      const counts: Record<string, number> = {};
                      qResponses.forEach(r => {
                        (r.selectedOptionIds || []).forEach(optId => {
                          counts[optId] = (counts[optId] || 0) + 1;
                        });
                      });
                      const sorted = (q.options || [])
                        .map(o => ({ ...o, count: counts[o.id] || 0 }))
                        .sort((a, b) => b.count - a.count);
                      const topCount = sorted[0]?.count || 0;

                      if (totalQResponses === 0) return <div className="text-sm text-gray-400 italic font-mono">Belum ada jawaban.</div>;

                      const barColors = [
                        'bg-[#C1FF33]', 'bg-[#2F36C9]', 'bg-[#FF1784]', 'bg-[#0D9488]', 'bg-[#D97706]', 'bg-[#7C3AED]'
                      ];

                      return (
                        <div className="space-y-3">
                          {sorted.map((opt, i) => {
                            const pct = totalQResponses > 0 ? Math.round((opt.count / totalQResponses) * 100) : 0;
                            const isWinner = opt.count === topCount && topCount > 0;
                            return (
                              <div key={opt.id} className={`relative overflow-hidden rounded-xl border-2 border-[#000000] transition-all ${
                                isWinner
                                  ? (isDark ? 'bg-[#C1FF33]/10' : 'bg-[#C1FF33]/20')
                                  : (isDark ? 'bg-[#252542]' : 'bg-gray-50')
                              }`} style={{ boxShadow: isWinner ? '4px 4px 0px #000' : 'none' }}>
                                <div
                                  className={`absolute inset-y-0 left-0 ${barColors[i % barColors.length]} opacity-25 transition-all duration-1000`}
                                  style={{ width: `${pct}%` }}
                                />
                                <div className="relative z-10 flex items-center justify-between gap-4 px-4 py-3 sm:py-4">
                                  <div className="flex items-center gap-3 min-w-0">
                                    {isWinner && <span className="text-xl shrink-0">🏆</span>}
                                    <span className={`font-black leading-tight ${
                                      isWinner
                                        ? 'text-lg sm:text-xl text-[#000000]'
                                        : `text-base sm:text-lg ${isDark ? 'text-white/80' : 'text-[#1E1E1E]/70'}`
                                    }`}>
                                      {opt.text}
                                    </span>
                                  </div>
                                  <div className="flex items-baseline gap-2 shrink-0">
                                    <span className={`font-black font-mono ${
                                      isWinner ? 'text-3xl sm:text-4xl text-[#2F36C9]' : `text-xl sm:text-2xl ${isDark ? 'text-white/60' : 'text-[#000000]/50'}`
                                    }`}>
                                      {pct}%
                                    </span>
                                    <span className={`text-sm font-mono font-bold ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                                      ({opt.count})
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* ── TRUE/FALSE ── */}
                    {q.type === 'true_false' && (() => {
                      const opts = q.options || [{ id: 'tf-1', text: 'True' }, { id: 'tf-2', text: 'False' }];
                      const opt0 = opts[0];
                      const opt1 = opts[1];
                      const counts: Record<string, number> = {};
                      qResponses.forEach(r => {
                        (r.selectedOptionIds || []).forEach(id => {
                          counts[id] = (counts[id] || 0) + 1;
                        });
                      });
                      const c0 = counts[opt0?.id] || 0;
                      const c1 = counts[opt1?.id] || 0;
                      const total = c0 + c1;
                      const p0 = total > 0 ? Math.round((c0 / total) * 100) : 0;
                      const p1 = total > 0 ? 100 - p0 : 0;
                      const leader = total === 0 ? -1 : c0 > c1 ? 0 : c1 > c0 ? 1 : -1;

                      if (total === 0) return <div className="text-sm text-gray-400 italic font-mono">Belum ada jawaban.</div>;

                      return (
                        <div className="space-y-4">
                          <div className="flex h-6 rounded-xl border-2 border-[#000000] overflow-hidden">
                            <div className="h-full bg-emerald-400 transition-all duration-1000" style={{ width: `${p0}%` }} />
                            <div className="h-full bg-rose-400 flex-1 transition-all duration-1000" />
                          </div>
                          <div className="grid grid-cols-2 gap-4 sm:gap-6">
                            {[opt0, opt1].map((opt, idx) => {
                              const count = idx === 0 ? c0 : c1;
                              const pct = idx === 0 ? p0 : p1;
                              const isLeader = leader === idx;
                              const isLoser = leader !== -1 && !isLeader;
                              return (
                                <div
                                  key={opt?.id || idx}
                                  className={`relative overflow-hidden rounded-2xl border-4 p-6 sm:p-8 text-center transition-all duration-500 flex flex-col items-center justify-center ${
                                    idx === 0
                                      ? (isDark ? 'bg-emerald-900/40 border-emerald-500' : 'bg-emerald-50 border-emerald-400')
                                      : (isDark ? 'bg-rose-900/40 border-rose-500' : 'bg-rose-50 border-rose-400')
                                  } ${isLoser ? 'opacity-55' : 'opacity-100'}`}
                                  style={{ boxShadow: isLeader ? '6px 6px 0px #000' : '3px 3px 0px #000' }}
                                >
                                  <div
                                    className={`absolute inset-y-0 left-0 transition-all duration-1000 ${idx === 0 ? 'bg-emerald-400/20' : 'bg-rose-400/20'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                  <div className="relative z-10 flex flex-col items-center gap-2">
                                    <div className={`rounded-xl border-2 border-[#000000] flex items-center justify-center font-black ${
                                      idx === 0 ? 'bg-emerald-400 text-[#000000]' : 'bg-rose-400 text-[#000000]'
                                    } ${isLeader ? 'w-14 h-14 text-3xl' : 'w-10 h-10 text-xl'}`}>
                                      {idx === 0 ? '✓' : '✕'}
                                    </div>
                                    <span className={`font-black leading-tight ${
                                      isLeader
                                        ? (isDark ? 'text-white text-2xl sm:text-3xl' : 'text-[#000000] text-2xl sm:text-3xl')
                                        : (isDark ? 'text-white/70 text-lg sm:text-xl' : 'text-[#1E1E1E]/70 text-lg sm:text-xl')
                                    }`}>
                                      {opt?.text || (idx === 0 ? 'True' : 'False')}
                                    </span>
                                    {isLeader && <span className="text-xl">🏆</span>}
                                    <div className="flex items-baseline gap-2 mt-2">
                                      <span className={`font-black font-mono ${
                                        isLeader ? 'text-4xl sm:text-5xl text-[#2F36C9]' : `text-2xl sm:text-3xl ${isDark ? 'text-white/50' : 'text-[#000000]/40'}`
                                      }`}>
                                        {pct}%
                                      </span>
                                      <span className={`font-mono font-bold text-sm ${isLeader ? 'text-[#000000]' : 'text-gray-500'}`}>
                                        {count} suara
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* ── RATING ── */}
                    {q.type === 'rating' && (() => {
                      const avg = totalQResponses > 0
                        ? (qResponses.reduce((acc, r) => acc + (r.ratingValue || 0), 0) / totalQResponses).toFixed(1)
                        : '0.0';
                      const pct = Math.min(100, Math.round((parseFloat(avg) / (q.ratingMax || 5)) * 100));
                      return (
                        <div className="flex items-center gap-5">
                          <div className={`rounded-2xl border-4 border-[#000000] px-6 py-4 text-center shrink-0 ${
                            isDark ? 'bg-[#252542]' : 'bg-[#FFF8F0]'
                          }`} style={{ boxShadow: '4px 4px 0px #000' }}>
                            <span className="block text-5xl sm:text-6xl font-black font-mono text-[#2F36C9]">{avg}</span>
                            <span className="text-xs font-black font-mono text-gray-500">/ {q.ratingMax || 5}.0</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex h-8 rounded-xl border-2 border-[#000000] overflow-hidden">
                              <div className="h-full bg-[#C1FF33] transition-all duration-1000" style={{ width: `${pct}%` }} />
                              <div className="h-full flex-1 bg-gray-100" />
                            </div>
                            <p className={`mt-2 text-sm font-bold font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              Rata-rata dari {totalQResponses} responden
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* ── WORD CLOUD ── */}
                    {q.type === 'word_cloud' && (() => {
                      const wordMap: Record<string, number> = {};
                      qResponses.forEach(r => {
                        const w = (r.textResponse || '').trim().toLowerCase();
                        if (w) wordMap[w] = (wordMap[w] || 0) + 1;
                      });
                      const topWords = Object.keys(wordMap).sort((a, b) => wordMap[b] - wordMap[a]).slice(0, 6);
                      const maxW = Math.max(...topWords.map(w => wordMap[w]), 1);
                      const bgPalette = ['bg-[#C1FF33] text-[#000000]', 'bg-[#2F36C9] text-white', 'bg-[#FF1784] text-white', 'bg-[#0D9488] text-white'];
                      return (
                        <div className="flex flex-wrap items-center gap-3">
                          {topWords.length > 0 ? topWords.map((word, i) => (
                            <span
                              key={word}
                              className={`inline-flex items-center gap-1.5 font-black rounded-xl border-2 border-[#000000] px-4 py-2 ${bgPalette[i % bgPalette.length]}`}
                              style={{ fontSize: `${0.85 + (wordMap[word] / maxW) * 0.75}rem`, boxShadow: '3px 3px 0px #000' }}
                            >
                              {word} <span className="text-xs opacity-70 font-mono">({wordMap[word]})</span>
                            </span>
                          )) : <div className="text-sm text-gray-400 italic font-mono">Belum ada kata.</div>}
                        </div>
                      );
                    })()}

                    {/* ── OPEN TEXT ── */}
                    {q.type === 'open_text' && (
                      <div className={`rounded-xl border-2 border-[#000000] p-4 ${isDark ? 'bg-[#252542]' : 'bg-gray-50'}`}>
                        <p className={`text-base sm:text-lg italic font-mono ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                          {totalQResponses > 0
                            ? `"${qResponses[qResponses.length - 1]?.textResponse || ''}"`
                            : 'Belum ada tanggapan.'}
                        </p>
                        {totalQResponses > 1 && (
                          <p className="text-xs text-gray-400 font-mono mt-2">+{totalQResponses - 1} respons lainnya</p>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

          </div>

          {/* Full-width All Attendees Roll Bar across bottom */}
          {currentEvent.participants.length > 0 && (
            <div className="w-full pt-1">
              <ParticipantCreditsRoll
                participants={currentEvent.participants}
                theme={theme}
                maxHeight="max-h-[140px] sm:max-h-[170px]"
                isQuizMode={currentEvent.isQuizMode}
                title="All Attendees"
              />
            </div>
          )}

        </main>
      ) : (
        /* Main Question & Live Results Visualizer */
        <main className="my-auto py-6 sm:py-8 max-w-5xl mx-auto w-full relative z-10">
          
          {/* Question Title */}
          <div className="mb-6 sm:mb-10 text-center">
            <h2 className={`text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight max-w-4xl mx-auto font-heading uppercase ${
              isDark ? 'text-white' : 'text-[#000000]'
            }`}>
              {currentQ?.title}
            </h2>
            {currentQ?.subtitle && (
              <p className="text-sm sm:text-base mt-2 max-w-2xl mx-auto text-gray-500 font-mono">
                {currentQ.subtitle}
              </p>
            )}
          </div>

          {/* 1a. MULTIPLE CHOICE VISUALIZER */}
          {currentQ && currentQ.type === 'multiple_choice' && (
            <div className="space-y-3 sm:space-y-4 max-w-3xl mx-auto">
              {(currentQ.options || []).map((opt, idx) => {
                const count = optionStats[opt.id] || 0;
                const pct = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
                const color = colors[idx % colors.length];
                const isCorrect = opt.isCorrect;
                const isRevealed = currentEvent.revealAnswer;
                const showResults = currentEvent.showResultsOnProjector;

                return (
                  <div
                    key={opt.id}
                    className={`relative overflow-hidden rounded-xl border-2 border-[#000000] transition-all p-4 sm:p-5 ${
                      isRevealed && isCorrect
                        ? 'bg-[#C1FF33]/20'
                        : isRevealed && !isCorrect
                        ? 'bg-gray-100 opacity-40'
                        : isDark
                        ? 'bg-[#252542]'
                        : 'bg-white'
                    }`}
                    style={{ boxShadow: '4px 4px 0px #000000' }}
                  >
                    <div
                      className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${
                        isRevealed && isCorrect
                          ? 'bg-[#C1FF33]/40'
                          : `${color.bg} opacity-20`
                      }`}
                      style={{ width: showResults ? `${pct}%` : '0%' }}
                    />
                    <div className="relative z-10 flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 pr-2">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 border-[#000000] flex items-center justify-center font-black text-sm sm:text-base shrink-0 ${
                          isRevealed && isCorrect ? 'bg-[#C1FF33] text-[#000000]' : `${color.bg} text-white`
                        }`}>
                          {isRevealed && isCorrect ? '✓' : ['A', 'B', 'C', 'D', 'E', 'F'][idx] || idx + 1}
                        </div>
                        <span className={`text-base sm:text-xl font-bold leading-snug ${
                          isDark ? 'text-white' : 'text-[#000000]'
                        }`}>
                          {opt.text}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                        {showResults ? (
                          <>
                            <span className={`text-xl sm:text-3xl font-black font-mono tracking-tight ${
                              isDark ? 'text-white' : 'text-[#000000]'
                            }`}>{pct}%</span>
                            <span className="text-xs sm:text-sm text-gray-500 font-mono">({count})</span>
                          </>
                        ) : (
                          <span className="neo-badge bg-white text-[#000000] text-xs font-mono">●●●</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 1b. TRUE/FALSE — DYNAMIC DUAL CARD (winner grows bigger) */}
          {currentQ && currentQ.type === 'true_false' && (() => {
            const opts = currentQ.options || [{ id: 'tf-1', text: 'True', isCorrect: true }, { id: 'tf-2', text: 'False', isCorrect: false }];
            const opt0 = opts[0];
            const opt1 = opts[1];
            const c0 = optionStats[opt0?.id] || 0;
            const c1 = optionStats[opt1?.id] || 0;
            const total = c0 + c1;
            const p0 = total > 0 ? Math.round((c0 / total) * 100) : 50;
            const p1 = total > 0 ? 100 - p0 : 50;
            const showResults = currentEvent.showResultsOnProjector;
            const isRevealed = currentEvent.revealAnswer;

            // Leader: 0 = opt0 wins, 1 = opt1 wins, -1 = tie
            const leader = total === 0 ? -1 : c0 > c1 ? 0 : c1 > c0 ? 1 : -1;

            const cardClass = (idx: number) => {
              const isLeader = leader === idx;
              const isLoser = leader !== -1 && leader !== idx;
              const bgColor = idx === 0 ? (isRevealed ? 'bg-emerald-100 border-emerald-500' : isDark ? 'bg-emerald-900/40' : 'bg-emerald-50') : (isRevealed ? 'bg-rose-100 border-rose-400' : isDark ? 'bg-rose-900/40' : 'bg-rose-50');
              return [
                'relative overflow-hidden rounded-2xl border-4 transition-all duration-700 flex flex-col items-center justify-center text-center p-5 sm:p-8',
                bgColor,
                isLeader ? 'shadow-[6px_6px_0px_#000]' : 'shadow-[3px_3px_0px_#000]',
                isLoser ? 'opacity-60' : 'opacity-100',
              ].join(' ');
            };

            const iconClass = (idx: number) => {
              const isLeader = leader === idx;
              return [
                'rounded-xl border-2 border-[#000000] flex items-center justify-center font-black mb-3 transition-all duration-700',
                idx === 0 ? 'bg-emerald-400 text-[#000000]' : 'bg-rose-400 text-[#000000]',
                isLeader ? 'w-14 h-14 text-3xl' : 'w-10 h-10 text-xl',
              ].join(' ');
            };

            return (
              <div className="max-w-4xl mx-auto w-full space-y-4">
                {/* Dual split bar */}
                <div className="flex h-5 rounded-xl border-2 border-[#000000] overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-1000"
                    style={{ width: showResults ? `${p0}%` : '50%' }}
                  />
                  <div className="h-full bg-rose-400 flex-1 transition-all duration-1000" />
                </div>

                {/* Dual cards */}
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  {[opt0, opt1].map((opt, idx) => {
                    const count = idx === 0 ? c0 : c1;
                    const pct = idx === 0 ? p0 : p1;
                    const isLeader = leader === idx;

                    return (
                      <div key={opt?.id || idx} className={cardClass(idx)}>
                        {/* Fill bar */}
                        {showResults && (
                          <div
                            className={`absolute inset-y-0 left-0 transition-all duration-1000 ${
                              idx === 0 ? 'bg-emerald-400/25' : 'bg-rose-400/25'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        )}
                        <div className="relative z-10 flex flex-col items-center">
                          <div className={iconClass(idx)}>
                            {idx === 0 ? '✓' : '✕'}
                          </div>
                          <span className={`font-black leading-tight transition-all duration-700 ${
                            isLeader
                              ? (isDark ? 'text-white text-3xl sm:text-4xl' : 'text-[#000000] text-3xl sm:text-4xl')
                              : (isDark ? 'text-white/80 text-xl sm:text-2xl' : 'text-[#1E1E1E]/80 text-xl sm:text-2xl')
                          }`}>
                            {opt?.text || (idx === 0 ? 'True' : 'False')}
                          </span>
                          {isLeader && total > 0 && <span className="mt-1 text-xl">🏆</span>}
                          {showResults && total > 0 && (
                            <div className="mt-3 flex items-baseline gap-2">
                              <span className={`font-black font-mono transition-all duration-700 ${
                                isLeader ? 'text-3xl sm:text-5xl text-[#2F36C9]' : 'text-xl sm:text-2xl text-[#2F36C9]/70'
                              }`}>
                                {pct}%
                              </span>
                              <span className={`font-mono font-bold ${
                                isLeader ? 'text-sm text-[#000000]' : 'text-xs text-gray-500'
                              }`}>
                                {count} suara
                              </span>
                            </div>
                          )}
                          {!showResults && (
                            <span className="mt-3 neo-badge bg-white text-[#000000] text-sm font-mono">●●●</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* 2. WORD CLOUD VISUALIZER */}
          {currentQ && currentQ.type === 'word_cloud' && (
            <div className={`max-w-4xl mx-auto min-h-[300px] flex flex-wrap items-center justify-center gap-3 sm:gap-5 p-6 neo-card ${
              isDark ? 'bg-[#1a1a2e]' : 'bg-white'
            }`}>
              {!currentEvent.showResultsOnProjector ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-10 h-10 text-[#2F36C9] mx-auto mb-2 animate-pulse" />
                  <p className="text-lg font-black uppercase font-heading">Word Cloud sedang dikumpulkan</p>
                  <p className="text-xs text-gray-400 mt-1 font-mono">{totalResponses} kata masuk • Hasil disembunyikan oleh presenter</p>
                </div>
              ) : wordCloudWords.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-10 h-10 text-[#C1FF33] mx-auto mb-2 animate-bounce" />
                  <p className="text-lg font-black uppercase font-heading">Audience Word Cloud Active</p>
                  <p className="text-xs text-gray-400 mt-1 font-mono">Submit keywords on your device to watch the cloud grow live.</p>
                </div>
              ) : (
                wordCloudWords.map((item, idx) => {
                  const scale = Math.max(1, (item.count / maxWordCount) * 2.8);
                  const color = colors[idx % colors.length];
                  return (
                    <span
                      key={item.text}
                      className={`inline-block font-black rounded-lg border-2 border-[#000000] px-3.5 py-1.5 ${color.bg} text-white animate-in fade-in zoom-in-75`}
                      style={{
                        boxShadow: '3px 3px 0px #000000',
                        fontSize: `${Math.min(2.5, 0.9 + scale * 0.45)}rem`,
                      }}
                    >
                      {item.text} <span className="text-xs opacity-75 font-mono">({item.count})</span>
                    </span>
                  );
                })
              )}
            </div>
          )}

          {/* 3. RATING SCALE VISUALIZER */}
          {currentQ && currentQ.type === 'rating' && (() => {
            const style = currentQ.ratingStyle || 'numeric';
            const maxVal = currentQ.ratingMax || 5;
            const minVal = currentQ.ratingMin || 1;
            const range = Array.from({ length: maxVal - minVal + 1 }, (_, i) => maxVal - i);
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
              <div className={`max-w-3xl mx-auto neo-card p-6 sm:p-8 text-center ${
                isDark ? 'bg-[#1a1a2e]' : 'bg-white'
              }`}>
                
                {!currentEvent.showResultsOnProjector ? (
                  <div className="py-8">
                    <Star className="w-12 h-12 text-[#C1FF33] mx-auto mb-2 animate-pulse" />
                    <h3 className="text-xl font-black mb-1 font-heading uppercase">Voting Rating Berlangsung</h3>
                    <p className="text-xs text-gray-400 font-mono">{totalResponses} audiens telah memberi nilai • Hasil disembunyikan</p>
                  </div>
                ) : (
                  <>
                    {/* Main Average Score Display */}
                    <div className="mb-6">
                      <div className="text-5xl sm:text-7xl font-black font-mono text-[#2F36C9] mb-1">
                        {ratingStats.avg} <span className="text-xl sm:text-3xl text-gray-400">/ {maxVal}.0</span>
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-wider font-mono">
                        {currentQ.ratingMinLabel && currentQ.ratingMaxLabel ? (
                          <span>{currentQ.ratingMinLabel} ➔ {currentQ.ratingMaxLabel}</span>
                        ) : (
                          <span>Rata-Rata Respon Audiens</span>
                        )}
                      </div>
                    </div>

                    {/* Star visualizer */}
                    {style === 'stars' && (
                      <div className="flex items-center justify-center space-x-1.5 mb-6">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-7 h-7 sm:w-9 sm:h-9 ${
                              s <= Math.round(Number(ratingStats.avg))
                                ? 'fill-[#C1FF33] text-[#000000]'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Breakdown Bars */}
                    <div className="space-y-2.5 max-w-lg mx-auto">
                      {range.map((stepVal) => {
                        const count = ratingStats.counts[stepVal - 1] || 0;
                        const pct = ratingStats.totalRatings > 0 ? Math.round((count / ratingStats.totalRatings) * 100) : 0;
                        const stepLabel = getStepLabel(stepVal);

                        return (
                          <div key={stepVal} className="flex items-center space-x-3 text-xs sm:text-sm font-bold">
                            <span className="w-28 sm:w-36 text-right truncate" title={stepLabel}>
                              {style === 'emoji' ? emojis[stepVal - 1] || stepVal : `${stepVal} • ${stepLabel}`}
                            </span>
                            <div className="flex-1 h-4 rounded-md border-2 border-[#000000] bg-white overflow-hidden">
                              <div
                                className="bg-[#C1FF33] h-full transition-all duration-700"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-14 text-left font-mono text-xs">
                              {pct}% <span className="text-gray-400">({count})</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

              </div>
            );
          })()}

          {/* 4. OPEN TEXT */}
          {currentQ && currentQ.type === 'open_text' && (
            <div className="max-w-3xl mx-auto">
              {!currentEvent.showResultsOnProjector ? (
                <div className="neo-card p-8 text-center">
                  <MessageSquare className="w-10 h-10 text-[#2F36C9] mx-auto mb-2.5 animate-pulse" />
                  <p className="text-lg font-black font-heading uppercase">Tanggapan Terbuka Sedang Dikumpulkan</p>
                  <p className="text-xs text-gray-400 mt-1 font-mono">{responses.length} tanggapan masuk • Hasil disembunyikan oleh presenter</p>
                </div>
              ) : responses.length === 0 ? (
                <div className="neo-card p-8 text-center">
                  <MessageSquare className="w-10 h-10 text-gray-400 mx-auto mb-2.5 animate-pulse" />
                  <p className="text-lg font-black font-heading uppercase">Waiting for open submissions...</p>
                  <p className="text-xs text-gray-400 mt-1 font-mono">Live responses will appear here as they are typed.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {responses.map((r) => (
                    <div
                      key={r.id}
                      className="neo-card p-4 flex flex-col justify-between"
                    >
                      <p className="text-sm sm:text-base font-bold leading-relaxed mb-2">
                        "{r.textResponse}"
                      </p>
                      <div className="flex items-center justify-between text-xs pt-2 border-t-2 border-[#000000]/10 font-mono">
                        <span className="font-black text-[#2F36C9]">{r.participantName}</span>
                        <span className="text-gray-400">Just now</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {/* Bottom Status Bar */}
      {currentEvent.status === 'live' && (
        <footer className="flex items-center justify-between pt-4 sm:pt-6 border-t-2 border-[#000000] text-sm relative z-10">
          <div className="flex items-center space-x-2">
            <div className={`neo-badge ${isDark ? 'bg-[#1a1a2e] text-white' : 'bg-white text-[#000000]'} text-xs sm:text-sm`}>
              <Users className="w-4 h-4 text-[#2F36C9]" />
              <span className="font-mono font-black text-sm sm:text-base">{totalResponses}</span>
              <span className="text-gray-400 font-normal">/ {totalParticipants} ({responsePercentage}%)</span>
            </div>

            {currentEvent.isVotingLocked && (
              <span className="neo-badge bg-[#FF1784] text-white text-xs">
                Voting Closed
              </span>
            )}
          </div>

          {/* Live Timer Badge */}
          <div className="neo-badge bg-[#000000] text-white px-4 py-1.5 text-lg sm:text-xl font-mono">
            <Clock className="w-4 h-4" />
            <span>
              {(() => {
                const remaining = currentEvent.timerRemainingSeconds ?? (currentQ?.timerSeconds || 45);
                const mins = Math.floor(remaining / 60);
                const secs = remaining % 60;
                return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
              })()}
            </span>
          </div>
        </footer>
      )}
      </div>
    </div>
  );
};
