import React, { useEffect, useRef, useState } from 'react';
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
  HelpCircle,
  Sun,
  Moon
} from 'lucide-react';
import { BrandLogo } from '../Shared/BrandLogo';

// Cute Animated Floating Mascot (PulseBot)
const PulseBotMascot: React.FC<{ theme: 'light' | 'dark'; size?: 'sm' | 'md' | 'lg'; mood?: 'happy' | 'celebrating' | 'curious' }> = ({
  theme,
  size = 'md',
  mood = 'celebrating'
}) => {
  const sizeClasses = size === 'sm' ? 'w-12 h-12' : size === 'lg' ? 'w-20 h-20 sm:w-24 sm:h-24' : 'w-16 h-16 sm:w-20 sm:h-20';
  
  return (
    <div className="relative inline-block select-none group pointer-events-auto">
      {/* Floating Animated Character */}
      <div className="animate-badge-float relative flex flex-col items-center">
        
        {/* Little Party Crown or Star Antenna */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 animate-bounce" style={{ animationDuration: '2.5s' }}>
          <span className="text-xl sm:text-2xl drop-shadow-sm">{mood === 'celebrating' ? '👑' : '✨'}</span>
        </div>

        {/* Character Body (Cute Round Capsule) */}
        <div className={`${sizeClasses} rounded-3xl flex items-center justify-center relative shadow-lg transition-all duration-500 ${
          theme === 'light'
            ? 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 text-white border-2 border-white ring-4 ring-indigo-100 shadow-indigo-200/60'
            : 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white border-2 border-indigo-400/40 ring-4 ring-indigo-500/20 shadow-indigo-950'
        }`}>
          {/* Eyes & Blinking Animation */}
          <div className="flex items-center space-x-3.5 z-10">
            {/* Left Eye */}
            <div className="w-2.5 h-3.5 bg-white rounded-full relative overflow-hidden animate-pulse">
              <div className="w-1.5 h-1.5 bg-slate-900 rounded-full absolute top-0.5 right-0.5" />
            </div>
            {/* Right Eye */}
            <div className="w-2.5 h-3.5 bg-white rounded-full relative overflow-hidden animate-pulse">
              <div className="w-1.5 h-1.5 bg-slate-900 rounded-full absolute top-0.5 right-0.5" />
            </div>
          </div>

          {/* Cute Smile */}
          <div className="absolute bottom-3.5 sm:bottom-4 left-1/2 -translate-x-1/2 w-4 sm:w-5 h-2 border-b-[2.5px] border-white rounded-full" />

          {/* Rosy Cheeks */}
          <div className="absolute bottom-4 left-2 sm:left-3 w-2 h-1.5 bg-rose-400/90 rounded-full blur-[0.5px]" />
          <div className="absolute bottom-4 right-2 sm:right-3 w-2 h-1.5 bg-rose-400/90 rounded-full blur-[0.5px]" />

          {/* Floating Sparkles */}
          <div className="absolute -right-2.5 -top-1 text-xs animate-spin" style={{ animationDuration: '6s' }}>✨</div>
          <div className="absolute -left-2.5 top-3 text-xs animate-bounce" style={{ animationDuration: '2s' }}>⭐</div>
        </div>

        {/* Soft Grounding Shadow underneath */}
        <div className={`w-12 sm:w-16 h-2 rounded-full mt-2 blur-xs transition-all duration-300 ${
          theme === 'light' ? 'bg-indigo-950/10' : 'bg-black/40'
        }`} />
      </div>
    </div>
  );
};

export const ProjectorDisplay: React.FC = () => {
  const { currentEvent, fireConfetti, setActiveView, isHost } = useEvent();
  const miniQrRef = useRef<HTMLCanvasElement | null>(null);
  const lobbyQrRef = useRef<HTMLCanvasElement | null>(null);
  const hasFiredFinaleConfettiRef = useRef(false);

  // Default to Putih Mahal (Light Theme) with localStorage memory
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('pulselive_projector_theme') as 'light' | 'dark') || 'light';
  });

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('pulselive_projector_theme', next);
  };

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
      <div className={`min-h-screen-dvh flex items-center justify-center p-8 text-center transition-colors duration-500 ${
        theme === 'light' ? 'bg-stage-mesh-light text-slate-900' : 'bg-[#070B14] text-white'
      }`}>
        <div>
          <Radio className="w-16 h-16 text-indigo-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 font-display">No Active Presentation</h2>
          <p className="text-slate-500 mb-6 text-sm">Launch a session from Presenter Controls or Admin Studio.</p>
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
    <div className={`w-full min-h-screen-dvh flex flex-col justify-between p-4 sm:p-6 lg:p-10 select-none relative overflow-hidden transition-colors duration-500 ${
      theme === 'light' ? 'bg-stage-mesh-light text-slate-900' : 'bg-stage-mesh text-white'
    }`}>
      
      {/* Floating Ambient Motion Elements in Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <div className="absolute top-16 left-12 animate-badge-float opacity-30 text-2xl" style={{ animationDuration: '6s' }}>
          ⭐
        </div>
        <div className="absolute top-24 right-20 animate-ambient-drift opacity-25 text-3xl" style={{ animationDuration: '8s' }}>
          ✨
        </div>
        <div className="absolute bottom-20 left-16 animate-ambient-drift-reverse opacity-20 text-2xl" style={{ animationDuration: '7s' }}>
          🎉
        </div>
        <div className="absolute bottom-24 right-16 animate-badge-float opacity-25 text-2xl" style={{ animationDuration: '5s' }}>
          💫
        </div>
      </div>

      {/* Top Projector Stage Bar */}
      <header className={`flex items-center justify-between pb-4 sm:pb-6 border-b gap-3 relative z-10 transition-colors ${
        theme === 'light' ? 'border-slate-200' : 'border-slate-800/80'
      }`}>
        
        {/* Left: Branding & Session Progress & Live Participants */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <BrandLogo size="sm" showText={false} theme={theme === 'light' ? 'light' : 'dark'} />
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-[11px] font-bold uppercase tracking-widest ${
                theme === 'light' ? 'text-slate-600' : 'text-slate-400'
              }`}>
                {currentEvent.title}
              </span>
              {currentEvent.status === 'live' ? (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                  theme === 'light' ? 'bg-slate-200 text-slate-800' : 'bg-slate-800 text-slate-300'
                }`}>
                  Q {currentEvent.currentQuestionIndex + 1} / {currentEvent.questions.length}
                </span>
              ) : currentEvent.status === 'ended' ? (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  Grand Finale
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold">
                  Lobby
                </span>
              )}
            </div>
            <div className={`text-xs font-medium ${theme === 'light' ? 'text-slate-500' : 'text-slate-500'}`}>
              Live Interactive Screen
            </div>
          </div>

          {/* Connected Participants Counter Badge on Projector */}
          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-colors ${
            theme === 'light'
              ? 'bg-white border border-slate-200 text-slate-800'
              : 'bg-slate-800/90 border border-slate-700/80 text-slate-200'
          }`}>
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span className={`font-mono-numbers font-bold text-sm ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              {currentEvent.participants.length}
            </span>
            <span className="text-slate-400 text-xs hidden sm:inline">joined</span>
          </div>
        </div>

        {/* Right: Join Instructions & Mini QR Code & Theme Toggle */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className={`rounded-2xl px-3.5 py-2 flex items-center space-x-3 shadow-sm transition-colors ${
            theme === 'light'
              ? 'bg-white border border-slate-200'
              : 'bg-slate-800/90 border border-slate-700/80'
          }`}>
            <div>
              <div className={`text-[10px] uppercase font-bold tracking-wider ${
                theme === 'light' ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Join at <strong className="text-indigo-600 dark:text-indigo-400 normal-case">{window.location.host}</strong>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-slate-400">PIN:</span>
                <span className={`text-xl sm:text-2xl font-black font-mono-numbers tracking-widest ${
                  theme === 'light' ? 'text-slate-900' : 'text-white'
                }`}>
                  {currentEvent.roomCode}
                </span>
              </div>
            </div>
            <div className="bg-white p-0.5 rounded-lg shrink-0 shadow-xs border border-slate-100">
              <canvas ref={miniQrRef} className="w-11 h-11 sm:w-12 sm:h-12" />
            </div>
          </div>

          {/* Theme Toggle (Putih Mahal vs Dark Mode) */}
          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-xl transition-all cursor-pointer shadow-xs ${
              theme === 'light'
                ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
            }`}
            title={theme === 'light' ? 'Ganti ke Dark Mode' : 'Ganti ke Putih Mahal'}
          >
            {theme === 'light' ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleFullScreen}
            className={`p-2.5 rounded-xl transition-colors cursor-pointer shadow-xs ${
              theme === 'light'
                ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Toggle Fullscreen"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 0. LOBBY WAITING STAGE (When session is in lobby waiting to start) */}
      {currentEvent.status === 'waiting' ? (
        <main className="my-auto py-6 sm:py-8 max-w-4xl mx-auto w-full text-center relative z-10">
          <div className={`rounded-3xl p-6 sm:p-10 shadow-xl backdrop-blur-xl relative overflow-hidden transition-colors ${
            theme === 'light'
              ? 'bg-white/95 border border-slate-200 shadow-slate-200/50'
              : 'bg-slate-900/80 border border-slate-800/90 shadow-2xl'
          }`}>
            
            {/* Header Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold uppercase tracking-wider mb-4 animate-pulse">
              <Radio className="w-3.5 h-3.5" />
              <span>Live Room Open • Scan & Join</span>
            </div>

            <div className="flex items-center justify-center space-x-3 mb-2">
              <h1 className={`text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-display ${
                theme === 'light' ? 'text-slate-900' : 'text-white'
              }`}>
                {currentEvent.title}
              </h1>
              <PulseBotMascot theme={theme} size="sm" mood="happy" />
            </div>

            <p className={`text-xs sm:text-sm max-w-lg mx-auto mb-6 ${
              theme === 'light' ? 'text-slate-500' : 'text-slate-400'
            }`}>
              Join the live interaction from your phone. Polling will begin shortly.
            </p>

            {/* Giant QR & PIN Display */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 my-4">
              <div className="bg-white p-3 rounded-2xl shadow-lg border border-slate-100">
                <canvas ref={lobbyQrRef} className="w-44 h-44 sm:w-52 sm:h-52" />
              </div>

              <div className="text-left space-y-3">
                <div className={`p-3.5 rounded-2xl border transition-colors ${
                  theme === 'light'
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-slate-800/80 border-slate-700/80'
                }`}>
                  <div className={`text-[11px] uppercase font-bold tracking-wider mb-0.5 ${
                    theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    1. Open on your mobile
                  </div>
                  <div className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    {window.location.host}
                  </div>
                </div>

                <div className={`p-3.5 rounded-2xl border transition-colors ${
                  theme === 'light'
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-slate-800/80 border-slate-700/80'
                }`}>
                  <div className={`text-[11px] uppercase font-bold tracking-wider mb-0.5 ${
                    theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    2. Enter Room PIN
                  </div>
                  <div className={`text-2xl sm:text-3xl font-black font-mono-numbers tracking-widest ${
                    theme === 'light' ? 'text-slate-900' : 'text-white'
                  }`}>
                    {currentEvent.roomCode}
                  </div>
                </div>
              </div>
            </div>

            {/* Connected Participants Counter & Avatar Bar */}
            <div className={`mt-6 pt-5 border-t flex flex-col items-center justify-center ${
              theme === 'light' ? 'border-slate-100' : 'border-slate-800'
            }`}>
              <div className={`flex items-center space-x-2 text-xs sm:text-sm font-bold mb-2.5 ${
                theme === 'light' ? 'text-slate-700' : 'text-slate-300'
              }`}>
                <Users className="w-4 h-4 text-indigo-500" />
                <span className={`text-sm sm:text-base font-mono-numbers ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {currentEvent.participants.length}
                </span>
                <span>attendees ready in lobby</span>
              </div>

              {currentEvent.participants.length > 0 ? (
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg max-h-20 overflow-y-auto scrollbar-none py-1">
                  {currentEvent.participants.slice(-12).reverse().map((p) => (
                    <div
                      key={p.id}
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs animate-in fade-in zoom-in-95 ${
                        theme === 'light'
                          ? 'bg-white border border-slate-200 text-slate-800 shadow-2xs'
                          : 'bg-slate-800/90 border border-slate-700 text-slate-200'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px]" style={{ backgroundColor: p.avatarBg }}>
                        {p.avatarEmoji || '👋'}
                      </span>
                      <span className="font-semibold">{p.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Scan QR code above with your camera to join instantly.</p>
              )}
            </div>

          </div>
        </main>
      ) : currentEvent.status === 'ended' ? (
        /* GRAND FINALE / BORDERLESS EDITORIAL KEYNOTE STAGE */
        <main className="my-auto py-6 sm:py-10 max-w-5xl mx-auto w-full animate-in fade-in zoom-in-95 duration-700 relative z-10">
          
          {/* Ambient Lighting in Deep Background */}
          <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-ambient-drift" />
          <div className="absolute -top-32 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-ambient-drift-reverse" />

          {/* Hero Header with Mascot */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center justify-center mb-3">
              <PulseBotMascot theme={theme} size="lg" mood="celebrating" />
              <span className="inline-flex items-center space-x-1.5 px-3.5 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full text-[11px] font-extrabold text-amber-600 dark:text-amber-300 uppercase tracking-widest mt-4 shadow-xs">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Session Concluded</span>
              </span>
            </div>

            <h1 className={`text-4xl sm:text-6xl font-black tracking-tight font-display ${
              theme === 'light' ? 'text-slate-900' : 'text-white'
            }`}>
              {currentEvent.title}
            </h1>

            {/* Editorial Stats Line (Borderless, Clean Numbers) */}
            <div className="flex items-center justify-center space-x-8 sm:space-x-14 my-8">
              <div>
                <span className={`block text-3xl sm:text-5xl font-black font-mono-numbers tracking-tight ${
                  theme === 'light' ? 'text-slate-900' : 'text-white'
                }`}>
                  {currentEvent.participants.length}
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Peserta</span>
              </div>
              <div className={`w-px h-10 ${theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'}`} />
              <div>
                <span className={`block text-3xl sm:text-5xl font-black font-mono-numbers tracking-tight ${
                  theme === 'light' ? 'text-slate-900' : 'text-white'
                }`}>
                  {currentEvent.responses.length}
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Respon</span>
              </div>
              <div className={`w-px h-10 ${theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'}`} />
              <div>
                <span className={`block text-3xl sm:text-5xl font-black font-mono-numbers tracking-tight ${
                  theme === 'light' ? 'text-slate-900' : 'text-white'
                }`}>
                  {currentEvent.questions.length}/{currentEvent.questions.length}
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">Soal Selesai</span>
              </div>
            </div>
          </div>

          {/* Open Editorial Question Results (Borderless, Clean Linear Rows) */}
          <div className="space-y-6 max-w-4xl mx-auto">
            {currentEvent.questions.map((q, qIdx) => {
              const qResponses = currentEvent.responses.filter(r => r.questionId === q.id);
              const totalQResponses = qResponses.length;

              return (
                <div key={q.id} className={`border-b pb-5 ${theme === 'light' ? 'border-slate-200' : 'border-slate-800/80'}`}>
                  <div className="flex items-baseline justify-between gap-4 mb-2.5">
                    <div className="flex items-baseline space-x-2.5 min-w-0">
                      <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400 shrink-0">
                        0{qIdx + 1}
                      </span>
                      <h3 className={`text-base sm:text-lg font-bold tracking-tight truncate ${
                        theme === 'light' ? 'text-slate-900' : 'text-white'
                      }`}>
                        {q.title}
                      </h3>
                    </div>
                    <span className={`text-xs font-mono shrink-0 ${
                      theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      {totalQResponses} respon
                    </span>
                  </div>

                  {/* 1. Multiple Choice & True/False: Fluid Linear Bar */}
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
                        <div className={`flex-1 h-3 rounded-full overflow-hidden relative ${
                          theme === 'light' ? 'bg-slate-200' : 'bg-slate-800/60'
                        }`}>
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${topPct}%` }}
                          />
                        </div>
                        <div className="text-sm font-bold shrink-0 flex items-center space-x-2">
                          <span className={theme === 'light' ? 'text-slate-800' : 'text-white'}>{topOpt.text}</span>
                          <span className={`font-mono font-black ${theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'}`}>{topPct}%</span>
                          <span className="text-xs text-slate-400 font-mono">({topCount} suara)</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic">Belum ada jawaban.</div>
                    );
                  })()}

                  {/* 2. Rating */}
                  {q.type === 'rating' && (() => {
                    const avg = totalQResponses > 0
                      ? (qResponses.reduce((acc, r) => acc + (r.ratingValue || 0), 0) / totalQResponses).toFixed(1)
                      : '0.0';
                    const pct = Math.min(100, Math.round((parseFloat(avg) / (q.ratingMax || 5)) * 100));

                    return (
                      <div className="flex items-center space-x-4">
                        <div className={`flex-1 h-3 rounded-full overflow-hidden relative ${
                          theme === 'light' ? 'bg-slate-200' : 'bg-slate-800/60'
                        }`}>
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="text-sm font-bold shrink-0 flex items-center space-x-2">
                          <span className={theme === 'light' ? 'text-slate-700' : 'text-slate-300'}>Skor:</span>
                          <span className={`font-mono font-black ${theme === 'light' ? 'text-amber-600' : 'text-amber-400'}`}>{avg}</span>
                          <span className="text-xs text-slate-400">/ {q.ratingMax || 5}.0</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 3. Word Cloud */}
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
                            <span key={word} className={`px-3 py-1 rounded-full text-xs font-bold ${
                              theme === 'light'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs'
                                : 'bg-indigo-500/20 text-indigo-200'
                            }`}>
                              #{word} ({wordMap[word]})
                            </span>
                          ))
                        ) : (
                          <div className="text-xs text-slate-400 italic">Belum ada kata.</div>
                        )}
                      </div>
                    );
                  })()}

                  {/* 4. Open Text */}
                  {q.type === 'open_text' && (
                    <div className={`text-sm italic ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
                      {totalQResponses > 0
                        ? `"${qResponses[qResponses.length - 1]?.textResponse || ''}"`
                        : 'Belum ada tanggapan.'}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* Flowing Participant Avatars at Bottom */}
          {currentEvent.participants.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-8 pt-4">
              <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400 mr-2">
                Partisipan:
              </span>
              {currentEvent.participants.map((p) => (
                <span
                  key={p.id}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-xs ${
                    theme === 'light'
                      ? 'bg-white border border-slate-200 text-slate-700'
                      : 'bg-slate-800/40 border border-slate-700/40 text-slate-200'
                  }`}
                >
                  <span>{p.avatarEmoji || '👋'}</span>
                  <span className={`font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{p.name}</span>
                </span>
              ))}
            </div>
          )}

        </main>
      ) : (
        /* Main Question & Live Results Visualizer */
        <main className="my-auto py-6 sm:py-8 max-w-5xl mx-auto w-full relative z-10">
          
          {/* Large Distance-Readable Question Title */}
          <div className="mb-6 sm:mb-10 text-center">
            <h2 className={`text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto font-display drop-shadow-xs ${
              theme === 'light' ? 'text-slate-900' : 'text-white'
            }`}>
              {currentQ?.title}
            </h2>
            {currentQ?.subtitle && (
              <p className={`text-sm sm:text-base mt-2 max-w-2xl mx-auto ${
                theme === 'light' ? 'text-slate-500' : 'text-slate-400'
              }`}>
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
                    className={`relative overflow-hidden rounded-2xl border transition-all duration-300 p-4 sm:p-5 ${
                      isRevealed && isCorrect
                        ? theme === 'light'
                          ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400/40 shadow-sm'
                          : 'border-emerald-400 bg-emerald-950/60 ring-2 ring-emerald-500/30'
                        : isRevealed && !isCorrect
                        ? theme === 'light'
                          ? 'border-slate-200 bg-slate-100 opacity-40'
                          : 'border-slate-800/80 bg-slate-900/40 opacity-40'
                        : theme === 'light'
                        ? 'border-slate-200 bg-white shadow-xs hover:border-slate-300'
                        : 'border-slate-700/80 bg-slate-800/60 shadow-lg'
                    }`}
                  >
                    {/* Real-time Percentage Bar Fill (Only expands when showResults is true) */}
                    <div
                      className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${
                        isRevealed && isCorrect
                          ? 'bg-emerald-400 opacity-20'
                          : theme === 'light'
                          ? `${color.bg} opacity-15`
                          : `${color.bg} opacity-25`
                      }`}
                      style={{ width: showResults ? `${pct}%` : '0%' }}
                    />

                    {/* Option Content */}
                    <div className="relative z-10 flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 pr-2">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-sm sm:text-base shrink-0 shadow-xs ${
                          isRevealed && isCorrect ? 'bg-emerald-500 text-white' : `${color.bg} text-white`
                        }`}>
                          {isRevealed && isCorrect ? '✓' : ['A', 'B', 'C', 'D', 'E', 'F'][idx] || idx + 1}
                        </div>
                        <span className={`text-base sm:text-xl font-bold leading-snug ${
                          theme === 'light' ? 'text-slate-900' : 'text-white'
                        }`}>
                          {opt.text}
                        </span>
                      </div>

                      {/* Vote Count & Percent */}
                      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                        {showResults ? (
                          <>
                            <span className={`text-xl sm:text-3xl font-black font-mono-numbers tracking-tight ${
                              theme === 'light' ? 'text-slate-900' : 'text-white'
                            }`}>
                              {pct}%
                            </span>
                            <span className="text-xs sm:text-sm text-slate-400 font-mono-numbers">
                              ({count})
                            </span>
                          </>
                        ) : (
                          <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-md ${
                            theme === 'light'
                              ? 'text-slate-400 bg-slate-100 border border-slate-200'
                              : 'text-slate-500 bg-slate-900/60'
                          }`}>
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
            <div className={`max-w-4xl mx-auto min-h-[300px] flex flex-wrap items-center justify-center gap-3 sm:gap-5 p-6 rounded-3xl border backdrop-blur-md transition-colors ${
              theme === 'light'
                ? 'bg-white/90 border-slate-200 shadow-sm'
                : 'bg-slate-800/40 border-slate-700/60'
            }`}>
              {!currentEvent.showResultsOnProjector ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-10 h-10 text-indigo-500 mx-auto mb-2 animate-pulse" />
                  <p className={`text-lg font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Word Cloud sedang dikumpulkan</p>
                  <p className="text-xs text-slate-400 mt-1">{totalResponses} kata masuk • Hasil disembunyikan oleh presenter</p>
                </div>
              ) : wordCloudWords.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-10 h-10 text-indigo-500 mx-auto mb-2 animate-bounce" />
                  <p className={`text-lg font-bold ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>Audience Word Cloud Active</p>
                  <p className="text-xs text-slate-400 mt-1">Submit keywords on your device to watch the cloud grow live.</p>
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
                        opacity: Math.max(0.75, item.count / maxWordCount),
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
              <div className={`max-w-3xl mx-auto rounded-3xl p-6 sm:p-8 text-center backdrop-blur-md border transition-colors ${
                theme === 'light'
                  ? 'bg-white/90 border-slate-200 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700'
              }`}>
                
                {!currentEvent.showResultsOnProjector ? (
                  <div className="py-8">
                    <Star className="w-12 h-12 text-amber-500 mx-auto mb-2 animate-pulse" />
                    <h3 className={`text-xl font-bold mb-1 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Voting Rating Berlangsung</h3>
                    <p className="text-xs text-slate-400">{totalResponses} audiens telah memberi nilai • Hasil disembunyikan</p>
                  </div>
                ) : (
                  <>
                    {/* Main Average Score Display */}
                    <div className="mb-6">
                      <div className="text-5xl sm:text-7xl font-black font-mono-numbers text-amber-500 dark:text-amber-400 mb-1 drop-shadow-xs">
                        {ratingStats.avg} <span className={`text-xl sm:text-3xl font-semibold ${theme === 'light' ? 'text-slate-400' : 'text-slate-400'}`}>/ {maxVal}.0</span>
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
                              s <= Math.round(Number(ratingStats.avg))
                                ? 'fill-amber-400 text-amber-400'
                                : theme === 'light' ? 'text-slate-200' : 'text-slate-700'
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
                          <div key={stepVal} className={`flex items-center space-x-3 text-xs sm:text-sm font-semibold ${
                            theme === 'light' ? 'text-slate-700' : 'text-slate-300'
                          }`}>
                            <span className="w-28 sm:w-36 text-right truncate font-bold" title={stepLabel}>
                              {style === 'emoji' ? emojis[stepVal - 1] || stepVal : `${stepVal} • ${stepLabel}`}
                            </span>
                            <div className={`flex-1 h-3.5 rounded-full overflow-hidden p-0.5 ${
                              theme === 'light' ? 'bg-slate-100 border border-slate-200' : 'bg-slate-700/80'
                            }`}>
                              <div
                                className="bg-amber-400 h-full rounded-full transition-all duration-700 shadow-xs"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-14 text-left font-mono-numbers text-xs">
                              {pct}% <span className="text-slate-400">({count})</span>
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

          {/* 4. OPEN TEXT WATERFALL */}
          {currentQ && currentQ.type === 'open_text' && (
            <div className="max-w-3xl mx-auto">
              {!currentEvent.showResultsOnProjector ? (
                <div className={`border rounded-2xl p-8 text-center ${
                  theme === 'light'
                    ? 'bg-white border-slate-200 text-slate-500 shadow-sm'
                    : 'bg-slate-800/50 border-slate-700/80 text-slate-400'
                }`}>
                  <MessageSquare className="w-10 h-10 text-indigo-500 mx-auto mb-2.5 animate-pulse" />
                  <p className={`text-lg font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Tanggapan Terbuka Sedang Dikumpulkan</p>
                  <p className="text-xs text-slate-400 mt-1">{responses.length} tanggapan masuk • Hasil disembunyikan oleh presenter</p>
                </div>
              ) : responses.length === 0 ? (
                <div className={`border rounded-2xl p-8 text-center ${
                  theme === 'light'
                    ? 'bg-white border-slate-200 text-slate-500 shadow-sm'
                    : 'bg-slate-800/50 border-slate-700/80 text-slate-400'
                }`}>
                  <MessageSquare className="w-10 h-10 text-slate-400 mx-auto mb-2.5 animate-pulse" />
                  <p className="text-lg font-bold">Waiting for open audience submissions...</p>
                  <p className="text-xs text-slate-400 mt-1">Live responses will appear here as they are typed.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-none">
                  {responses.map((r) => (
                    <div
                      key={r.id}
                      className={`p-4 rounded-2xl border shadow-xs flex flex-col justify-between animate-in fade-in ${
                        theme === 'light'
                          ? 'bg-white border-slate-200 text-slate-900'
                          : 'bg-slate-800/80 border-slate-700 text-white'
                      }`}
                    >
                      <p className="text-sm sm:text-base font-semibold leading-relaxed mb-2">
                        "{r.textResponse}"
                      </p>
                      <div className={`flex items-center justify-between text-xs pt-2 border-t ${
                        theme === 'light' ? 'border-slate-100 text-slate-400' : 'border-slate-700/60 text-slate-400'
                      }`}>
                        <span className="font-bold text-indigo-600 dark:text-indigo-300">{r.participantName}</span>
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

      {/* Bottom Status Bar: Response Rate & Big Countdown (Only rendered during live active polling) */}
      {currentEvent.status === 'live' && (
        <footer className={`flex items-center justify-between pt-4 sm:pt-6 border-t text-sm relative z-10 transition-colors ${
          theme === 'light' ? 'border-slate-200' : 'border-slate-800/80'
        }`}>
          
          {/* Total Responses Badge */}
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition-colors ${
              theme === 'light'
                ? 'bg-white border border-slate-200 text-slate-700'
                : 'bg-slate-800/90 border border-slate-700/80 text-slate-200'
            }`}>
              <Users className="w-4 h-4 text-indigo-500" />
              <span className={`font-mono-numbers text-sm sm:text-base font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{totalResponses}</span>
              <span className="text-slate-400">/ {totalParticipants} answered ({responsePercentage}%)</span>
            </div>

            {currentEvent.isVotingLocked && (
              <span className="px-2.5 py-1 bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold">
                Voting Closed
              </span>
            )}
          </div>

          {/* Live Timer Badge */}
          <div className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl shadow-xs transition-colors ${
            theme === 'light'
              ? 'bg-white border border-slate-200'
              : 'bg-slate-800/90 border border-slate-700/80'
          }`}>
            <Clock className={`w-4 h-4 ${(currentEvent.timerRemainingSeconds ?? 45) <= 5 && currentEvent.isTimerRunning ? 'text-rose-500 animate-spin' : 'text-slate-400'}`} />
            <span className={`text-lg sm:text-xl font-bold font-mono-numbers tracking-wider ${
              theme === 'light' ? 'text-slate-900' : 'text-white'
            }`}>
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

