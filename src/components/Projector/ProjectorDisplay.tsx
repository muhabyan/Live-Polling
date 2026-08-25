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
  Moon,
  ArrowLeft
} from 'lucide-react';
import { BrandLogo } from '../Shared/BrandLogo';
import { ParticipantCreditsRoll } from './ParticipantCreditsRoll';

// Neo-Brutal Animated Mascot (PulseBot)
const PulseBotMascot: React.FC<{ theme: 'light' | 'dark'; size?: 'sm' | 'md' | 'lg'; mood?: 'happy' | 'celebrating' | 'curious' }> = ({
  theme,
  size = 'md',
  mood = 'celebrating'
}) => {
  const sizeClasses = size === 'sm' ? 'w-12 h-12' : size === 'lg' ? 'w-20 h-20 sm:w-24 sm:h-24' : 'w-16 h-16 sm:w-20 sm:h-20';
  
  return (
    <div className="relative inline-block select-none group pointer-events-auto">
      <div className="animate-badge-float relative flex flex-col items-center">
        
        {/* Crown / Star */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 animate-bounce" style={{ animationDuration: '2.5s' }}>
          <span className="text-xl sm:text-2xl">{mood === 'celebrating' ? '👑' : '✨'}</span>
        </div>

        {/* Character Body (Chunky square with black border & hard shadow) */}
        <div
          className={`${sizeClasses} rounded-xl border-2 border-[#1E1E1E] flex items-center justify-center relative bg-[#4F46E5] text-white`}
          style={{ boxShadow: '4px 4px 0px #1E1E1E' }}
        >
          {/* Eyes */}
          <div className="flex items-center space-x-3 z-10">
            <div className="w-2.5 h-3.5 bg-white rounded-md border border-[#1E1E1E] relative overflow-hidden animate-pulse">
              <div className="w-1.5 h-1.5 bg-[#1E1E1E] rounded-full absolute top-0.5 right-0.5" />
            </div>
            <div className="w-2.5 h-3.5 bg-white rounded-md border border-[#1E1E1E] relative overflow-hidden animate-pulse">
              <div className="w-1.5 h-1.5 bg-[#1E1E1E] rounded-full absolute top-0.5 right-0.5" />
            </div>
          </div>

          {/* Smile */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-4 h-1.5 border-b-2 border-white rounded-full" />

          {/* Cheeks */}
          <div className="absolute bottom-3 left-2 w-2 h-1.5 bg-[#FB7185] rounded-md border border-[#1E1E1E]" />
          <div className="absolute bottom-3 right-2 w-2 h-1.5 bg-[#FB7185] rounded-md border border-[#1E1E1E]" />
        </div>
      </div>
    </div>
  );
};

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
          colors: ['#4F46E5', '#34D399', '#FACC15', '#FB7185', '#60A5FA'],
        });
        confetti({
          particleCount: 70,
          angle: 120,
          spread: 60,
          origin: { x: 0.95, y: 0.85 },
          colors: ['#4F46E5', '#34D399', '#FACC15', '#FB7185', '#60A5FA'],
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
          color: { dark: '#1E1E1E', light: '#FFFFFF' },
        });
      }
      if (lobbyQrRef.current) {
        QRCode.toCanvas(lobbyQrRef.current, joinUrl, {
          width: 200,
          margin: 1,
          color: { dark: '#1E1E1E', light: '#FFFFFF' },
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
      <div className={`min-h-screen-dvh flex items-center justify-center p-8 text-center bg-dot-grid`}>
        <div className="neo-card p-8 max-w-md mx-auto">
          <Radio className="w-16 h-16 text-[#4F46E5] mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl sm:text-3xl font-black mb-2 font-display uppercase">No Active Presentation</h2>
          <p className="text-gray-500 mb-6 text-sm font-mono">Launch a session from Presenter Controls or Admin Studio.</p>
          <button
            onClick={() => setActiveView(isHost ? 'presenter' : 'participant')}
            className="neo-btn px-5 py-2.5 bg-[#FACC15] text-[#1E1E1E] font-black text-xs"
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
    { bg: 'bg-[#4F46E5]', hex: '#4F46E5', text: 'text-white' },
    { bg: 'bg-[#0D9488]', hex: '#0D9488', text: 'text-white' },
    { bg: 'bg-[#D97706]', hex: '#D97706', text: 'text-white' },
    { bg: 'bg-[#E11D48]', hex: '#E11D48', text: 'text-white' },
    { bg: 'bg-[#7C3AED]', hex: '#7C3AED', text: 'text-white' },
  ];

  const isDark = theme === 'dark';

  return (
    <div className={`w-full min-h-screen-dvh flex flex-col justify-between p-4 sm:p-6 lg:p-10 select-none relative overflow-hidden transition-colors ${
      isDark ? 'bg-dot-grid-dark text-white' : 'bg-dot-grid text-[#1E1E1E]'
    }`}>
      
      {/* Top Projector Stage Bar */}
      <header className="flex items-center justify-between pb-4 sm:pb-6 border-b-2 border-[#1E1E1E] gap-3 relative z-10">
        
        {/* Left: Branding & Progress */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {isHost && (
            <button
              onClick={() => setActiveView('admin')}
              className={`neo-btn px-2.5 py-1.5 text-xs font-bold ${
                isDark ? 'bg-[#1a1a2e] text-white' : 'bg-white text-[#1E1E1E]'
              }`}
              title="Kembali ke Admin Dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          )}

          <BrandLogo size="sm" showText={false} theme={isDark ? 'dark' : 'light'} />
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-[11px] font-black uppercase tracking-widest font-mono ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {currentEvent.title}
              </span>
              {currentEvent.status === 'live' ? (
                <span className="neo-badge bg-[#FACC15] text-[#1E1E1E] font-mono">
                  Q {currentEvent.currentQuestionIndex + 1} / {currentEvent.questions.length}
                </span>
              ) : currentEvent.status === 'ended' ? (
                <span className="neo-badge bg-[#FB7185] text-[#1E1E1E] font-mono">
                  Grand Finale
                </span>
              ) : (
                <span className="neo-badge bg-[#34D399] text-[#1E1E1E] font-mono">
                  Lobby
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-gray-500 font-mono">
              Live Stage
            </div>
          </div>

          {/* Connected Participants Counter */}
          <div className={`neo-badge ${isDark ? 'bg-[#1a1a2e] text-white' : 'bg-white text-[#1E1E1E]'} text-xs`}>
            <Users className="w-3.5 h-3.5" />
            <span className="font-mono font-black text-sm">
              {currentEvent.participants.length}
            </span>
            <span className="text-gray-400 font-normal hidden sm:inline">joined</span>
          </div>
        </div>

        {/* Right: Join Instructions & Mini QR Code & Theme Toggle */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className={`rounded-xl border-2 border-[#1E1E1E] px-3.5 py-2 flex items-center space-x-3 ${
            isDark ? 'bg-[#1a1a2e]' : 'bg-white'
          }`} style={{ boxShadow: '3px 3px 0px #1E1E1E' }}>
            <div>
              <div className="text-[10px] uppercase font-black tracking-wider text-gray-500 font-mono">
                Join at <strong className="text-[#4F46E5] normal-case font-bold">{window.location.host}</strong>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-gray-500 font-mono">PIN:</span>
                <span className={`text-xl sm:text-2xl font-black font-mono tracking-widest ${
                  isDark ? 'text-white' : 'text-[#1E1E1E]'
                }`}>
                  {currentEvent.roomCode}
                </span>
              </div>
            </div>
            <div className="bg-white p-0.5 rounded-md border-2 border-[#1E1E1E] shrink-0">
              <canvas ref={miniQrRef} className="w-11 h-11 sm:w-12 sm:h-12" />
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`neo-btn p-2.5 ${isDark ? 'bg-[#1a1a2e] text-white' : 'bg-white text-[#1E1E1E]'}`}
            title={isDark ? 'Light Mode' : 'Dark Mode'}
          >
            {isDark ? <Sun className="w-4 h-4 text-[#FACC15]" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleFullScreen}
            className={`neo-btn p-2.5 ${isDark ? 'bg-[#1a1a2e] text-white' : 'bg-white text-[#1E1E1E]'}`}
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
            <div className="inline-flex items-center space-x-2 neo-badge bg-[#FACC15] text-[#1E1E1E] text-xs font-black uppercase mb-4 animate-pulse">
              <Radio className="w-3.5 h-3.5" />
              <span>Live Room Open • Scan & Join</span>
            </div>

            <div className="flex items-center justify-center space-x-3 mb-2">
              <h1 className={`text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight font-display uppercase ${
                isDark ? 'text-white' : 'text-[#1E1E1E]'
              }`}>
                {currentEvent.title}
              </h1>
              <PulseBotMascot theme={theme} size="sm" mood="happy" />
            </div>

            <p className="text-xs sm:text-sm max-w-lg mx-auto mb-6 text-gray-500 font-mono">
              Join the live interaction from your phone. Polling will begin shortly.
            </p>

            {/* Giant QR & PIN Display */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 my-4">
              <div className="bg-white p-3 rounded-xl border-2 border-[#1E1E1E]" style={{ boxShadow: '4px 4px 0px #1E1E1E' }}>
                <canvas ref={lobbyQrRef} className="w-44 h-44 sm:w-52 sm:h-52" />
              </div>

              <div className="text-left space-y-3">
                <div className={`p-3.5 rounded-xl border-2 border-[#1E1E1E] ${
                  isDark ? 'bg-[#252542]' : 'bg-[#FFF8F0]'
                }`} style={{ boxShadow: '3px 3px 0px #1E1E1E' }}>
                  <div className="text-[11px] uppercase font-black tracking-wider mb-0.5 text-gray-500 font-mono">
                    1. Open on your mobile
                  </div>
                  <div className="text-base sm:text-lg font-black text-[#4F46E5] font-mono">
                    {window.location.host}
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border-2 border-[#1E1E1E] ${
                  isDark ? 'bg-[#252542]' : 'bg-[#FFF8F0]'
                }`} style={{ boxShadow: '3px 3px 0px #1E1E1E' }}>
                  <div className="text-[11px] uppercase font-black tracking-wider mb-0.5 text-gray-500 font-mono">
                    2. Enter Room PIN
                  </div>
                  <div className={`text-2xl sm:text-3xl font-black font-mono tracking-widest ${
                    isDark ? 'text-white' : 'text-[#1E1E1E]'
                  }`}>
                    {currentEvent.roomCode}
                  </div>
                </div>
              </div>
            </div>

            {/* Connected Participants Counter & Credits Roll */}
            <div className="mt-6 pt-5 border-t-2 border-[#1E1E1E]/10 flex flex-col items-center justify-center w-full">
              <div className="flex items-center space-x-2 text-xs sm:text-sm font-bold mb-3 font-mono">
                <Users className="w-4 h-4 text-[#4F46E5]" />
                <span className={`font-black ${isDark ? 'text-white' : 'text-[#1E1E1E]'}`}>
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
        /* GRAND FINALE */
        <main className="my-auto py-6 sm:py-10 max-w-5xl mx-auto w-full relative z-10">
          
          <div className="text-center mb-8">
            <div className="flex flex-col items-center justify-center mb-3">
              <PulseBotMascot theme={theme} size="lg" mood="celebrating" />
              <span className="neo-badge bg-[#FACC15] text-[#1E1E1E] mt-4 text-xs font-black">
                <Sparkles className="w-3 h-3" />
                <span>Session Concluded</span>
              </span>
            </div>

            <h1 className={`text-4xl sm:text-6xl font-black tracking-tight font-display uppercase ${
              isDark ? 'text-white' : 'text-[#1E1E1E]'
            }`}>
              {currentEvent.title}
            </h1>

            {/* Stats Line */}
            <div className="flex items-center justify-center space-x-6 sm:space-x-12 my-8">
              <div className="neo-card p-4 text-center">
                <span className="block text-3xl sm:text-5xl font-black font-mono text-[#4F46E5]">
                  {currentEvent.participants.length}
                </span>
                <span className="text-[11px] font-black uppercase font-mono text-gray-600">Peserta</span>
              </div>
              <div className="neo-card p-4 text-center">
                <span className="block text-3xl sm:text-5xl font-black font-mono text-[#34D399]">
                  {currentEvent.responses.length}
                </span>
                <span className="text-[11px] font-black uppercase font-mono text-gray-600">Respon</span>
              </div>
              <div className="neo-card p-4 text-center">
                <span className="block text-3xl sm:text-5xl font-black font-mono text-[#FACC15]">
                  {currentEvent.questions.length}/{currentEvent.questions.length}
                </span>
                <span className="text-[11px] font-black uppercase font-mono text-gray-600">Soal Selesai</span>
              </div>
            </div>
          </div>

          {/* Question Results Rows */}
          <div className="space-y-4 max-w-4xl mx-auto">
            {currentEvent.questions.map((q, qIdx) => {
              const qResponses = currentEvent.responses.filter(r => r.questionId === q.id);
              const totalQResponses = qResponses.length;

              return (
                <div key={q.id} className="neo-card p-4 space-y-2">
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="flex items-baseline space-x-2.5 min-w-0">
                      <span className="neo-badge bg-[#4F46E5] text-white text-xs font-mono">
                        0{qIdx + 1}
                      </span>
                      <h3 className={`text-base sm:text-lg font-black tracking-tight truncate ${
                        isDark ? 'text-white' : 'text-[#1E1E1E]'
                      }`}>
                        {q.title}
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-gray-500 shrink-0">
                      {totalQResponses} respon
                    </span>
                  </div>

                  {/* Multiple Choice & True/False */}
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

                    return topOpt ? (
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 h-4 rounded-md border-2 border-[#1E1E1E] bg-white overflow-hidden relative">
                          <div
                            className="h-full bg-[#34D399] transition-all duration-1000"
                            style={{ width: `${topPct}%` }}
                          />
                        </div>
                        <div className="text-sm font-black shrink-0 flex items-center space-x-2 font-mono">
                          <span>{topOpt.text}</span>
                          <span className="text-[#4F46E5]">{topPct}%</span>
                          <span className="text-xs text-gray-400">({topCount} suara)</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 italic font-mono">Belum ada jawaban.</div>
                    );
                  })()}

                  {/* Rating */}
                  {q.type === 'rating' && (() => {
                    const avg = totalQResponses > 0
                      ? (qResponses.reduce((acc, r) => acc + (r.ratingValue || 0), 0) / totalQResponses).toFixed(1)
                      : '0.0';
                    const pct = Math.min(100, Math.round((parseFloat(avg) / (q.ratingMax || 5)) * 100));

                    return (
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 h-4 rounded-md border-2 border-[#1E1E1E] bg-white overflow-hidden relative">
                          <div
                            className="h-full bg-[#FACC15] transition-all duration-1000"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="text-sm font-black shrink-0 flex items-center space-x-2 font-mono">
                          <span>Skor:</span>
                          <span className="text-[#D97706]">{avg}</span>
                          <span className="text-xs text-gray-400">/ {q.ratingMax || 5}.0</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Word Cloud */}
                  {q.type === 'word_cloud' && (() => {
                    const wordMap: Record<string, number> = {};
                    qResponses.forEach(r => {
                      const w = (r.textResponse || '').trim().toLowerCase();
                      if (w) wordMap[w] = (wordMap[w] || 0) + 1;
                    });
                    const topWords = Object.keys(wordMap).sort((a, b) => wordMap[b] - wordMap[a]).slice(0, 4);

                    return (
                      <div className="flex flex-wrap items-center gap-2">
                        {topWords.length > 0 ? (
                          topWords.map((word) => (
                            <span key={word} className="neo-badge bg-[#60A5FA] text-[#1E1E1E] text-xs font-mono">
                              #{word} ({wordMap[word]})
                            </span>
                          ))
                        ) : (
                          <div className="text-xs text-gray-400 italic font-mono">Belum ada kata.</div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Open Text */}
                  {q.type === 'open_text' && (
                    <div className="text-sm italic font-mono text-gray-600">
                      {totalQResponses > 0
                        ? `"${qResponses[qResponses.length - 1]?.textResponse || ''}"`
                        : 'Belum ada tanggapan.'}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* End Credits Roll */}
          {currentEvent.participants.length > 0 && (
            <div className="mt-10 pt-6 border-t-2 border-[#1E1E1E]/10 w-full max-w-4xl mx-auto">
              <ParticipantCreditsRoll
                participants={currentEvent.participants}
                theme={theme}
                maxHeight="max-h-[220px] sm:max-h-[300px]"
                isQuizMode={currentEvent.isQuizMode}
                title="Special Thanks & All Attendees"
              />
            </div>
          )}

        </main>
      ) : (
        /* Main Question & Live Results Visualizer */
        <main className="my-auto py-6 sm:py-8 max-w-5xl mx-auto w-full relative z-10">
          
          {/* Question Title */}
          <div className="mb-6 sm:mb-10 text-center">
            <h2 className={`text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight max-w-4xl mx-auto font-display uppercase ${
              isDark ? 'text-white' : 'text-[#1E1E1E]'
            }`}>
              {currentQ?.title}
            </h2>
            {currentQ?.subtitle && (
              <p className="text-sm sm:text-base mt-2 max-w-2xl mx-auto text-gray-500 font-mono">
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
                const showResults = currentEvent.showResultsOnProjector;

                return (
                  <div
                    key={opt.id}
                    className={`relative overflow-hidden rounded-xl border-2 border-[#1E1E1E] transition-all p-4 sm:p-5 ${
                      isRevealed && isCorrect
                        ? 'bg-[#34D399]/20'
                        : isRevealed && !isCorrect
                        ? 'bg-gray-100 opacity-40'
                        : isDark
                        ? 'bg-[#252542]'
                        : 'bg-white'
                    }`}
                    style={{ boxShadow: '4px 4px 0px #1E1E1E' }}
                  >
                    {/* Percentage Bar Fill */}
                    <div
                      className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${
                        isRevealed && isCorrect
                          ? 'bg-[#34D399]/30'
                          : `${color.bg} opacity-20`
                      }`}
                      style={{ width: showResults ? `${pct}%` : '0%' }}
                    />

                    {/* Option Content */}
                    <div className="relative z-10 flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 pr-2">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 border-[#1E1E1E] flex items-center justify-center font-black text-sm sm:text-base shrink-0 ${
                          isRevealed && isCorrect ? 'bg-[#34D399] text-[#1E1E1E]' : `${color.bg} text-white`
                        }`}>
                          {isRevealed && isCorrect ? '✓' : ['A', 'B', 'C', 'D', 'E', 'F'][idx] || idx + 1}
                        </div>
                        <span className={`text-base sm:text-xl font-bold leading-snug ${
                          isDark ? 'text-white' : 'text-[#1E1E1E]'
                        }`}>
                          {opt.text}
                        </span>
                      </div>

                      {/* Vote Count & Percent */}
                      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                        {showResults ? (
                          <>
                            <span className={`text-xl sm:text-3xl font-black font-mono tracking-tight ${
                              isDark ? 'text-white' : 'text-[#1E1E1E]'
                            }`}>
                              {pct}%
                            </span>
                            <span className="text-xs sm:text-sm text-gray-400 font-mono">
                              ({count})
                            </span>
                          </>
                        ) : (
                          <span className="neo-badge bg-white text-[#1E1E1E] text-xs font-mono">
                            ●●●
                          </span>
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
            <div className={`max-w-4xl mx-auto min-h-[300px] flex flex-wrap items-center justify-center gap-3 sm:gap-5 p-6 neo-card ${
              isDark ? 'bg-[#1a1a2e]' : 'bg-white'
            }`}>
              {!currentEvent.showResultsOnProjector ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-10 h-10 text-[#4F46E5] mx-auto mb-2 animate-pulse" />
                  <p className="text-lg font-black uppercase font-display">Word Cloud sedang dikumpulkan</p>
                  <p className="text-xs text-gray-400 mt-1 font-mono">{totalResponses} kata masuk • Hasil disembunyikan oleh presenter</p>
                </div>
              ) : wordCloudWords.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-10 h-10 text-[#FACC15] mx-auto mb-2 animate-bounce" />
                  <p className="text-lg font-black uppercase font-display">Audience Word Cloud Active</p>
                  <p className="text-xs text-gray-400 mt-1 font-mono">Submit keywords on your device to watch the cloud grow live.</p>
                </div>
              ) : (
                wordCloudWords.map((item, idx) => {
                  const scale = Math.max(1, (item.count / maxWordCount) * 2.8);
                  const color = colors[idx % colors.length];
                  return (
                    <span
                      key={item.text}
                      className={`inline-block font-black rounded-lg border-2 border-[#1E1E1E] px-3.5 py-1.5 ${color.bg} text-white animate-in fade-in zoom-in-75`}
                      style={{
                        boxShadow: '3px 3px 0px #1E1E1E',
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
                    <Star className="w-12 h-12 text-[#FACC15] mx-auto mb-2 animate-pulse" />
                    <h3 className="text-xl font-black mb-1 font-display uppercase">Voting Rating Berlangsung</h3>
                    <p className="text-xs text-gray-400 font-mono">{totalResponses} audiens telah memberi nilai • Hasil disembunyikan</p>
                  </div>
                ) : (
                  <>
                    {/* Main Average Score Display */}
                    <div className="mb-6">
                      <div className="text-5xl sm:text-7xl font-black font-mono text-[#D97706] mb-1">
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
                                ? 'fill-[#FACC15] text-[#1E1E1E]'
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
                            <div className="flex-1 h-4 rounded-md border-2 border-[#1E1E1E] bg-white overflow-hidden">
                              <div
                                className="bg-[#FACC15] h-full transition-all duration-700"
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
                  <MessageSquare className="w-10 h-10 text-[#4F46E5] mx-auto mb-2.5 animate-pulse" />
                  <p className="text-lg font-black font-display uppercase">Tanggapan Terbuka Sedang Dikumpulkan</p>
                  <p className="text-xs text-gray-400 mt-1 font-mono">{responses.length} tanggapan masuk • Hasil disembunyikan oleh presenter</p>
                </div>
              ) : responses.length === 0 ? (
                <div className="neo-card p-8 text-center">
                  <MessageSquare className="w-10 h-10 text-gray-400 mx-auto mb-2.5 animate-pulse" />
                  <p className="text-lg font-black font-display uppercase">Waiting for open submissions...</p>
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
                      <div className="flex items-center justify-between text-xs pt-2 border-t-2 border-[#1E1E1E]/10 font-mono">
                        <span className="font-black text-[#4F46E5]">{r.participantName}</span>
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
        <footer className="flex items-center justify-between pt-4 sm:pt-6 border-t-2 border-[#1E1E1E] text-sm relative z-10">
          <div className="flex items-center space-x-2">
            <div className={`neo-badge ${isDark ? 'bg-[#1a1a2e] text-white' : 'bg-white text-[#1E1E1E]'} text-xs sm:text-sm`}>
              <Users className="w-4 h-4 text-[#4F46E5]" />
              <span className="font-mono font-black text-sm sm:text-base">{totalResponses}</span>
              <span className="text-gray-400 font-normal">/ {totalParticipants} ({responsePercentage}%)</span>
            </div>

            {currentEvent.isVotingLocked && (
              <span className="neo-badge bg-[#FB7185] text-[#1E1E1E] text-xs">
                Voting Closed
              </span>
            )}
          </div>

          {/* Live Timer Badge */}
          <div className="neo-badge bg-[#1E1E1E] text-white px-4 py-1.5 text-lg sm:text-xl font-mono">
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
  );
};
