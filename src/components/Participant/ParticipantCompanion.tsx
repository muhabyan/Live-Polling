import React, { useState, useEffect } from 'react';
import { useEvent } from '../../context/EventContext';
import { Sparkles, Trophy, LogOut, CheckCircle2, Zap, Heart } from 'lucide-react';

interface ParticipantCompanionProps {
  hasSubmitted?: boolean;
}

export const ParticipantCompanion: React.FC<ParticipantCompanionProps> = ({ hasSubmitted }) => {
  const { currentEvent, currentParticipant, leaveRoom, sendReaction } = useEvent();
  const [speechText, setSpeechText] = useState<string>('');
  const [isBouncing, setIsBouncing] = useState<boolean>(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const [petMood, setPetMood] = useState<'idle' | 'focus' | 'urgent' | 'cheer' | 'celebrate'>('idle');

  const emoji = currentParticipant?.avatarEmoji || '🦊';
  const name = currentParticipant?.name || 'Attendee';
  const bgColor = currentParticipant?.avatarBg || '#EA580C';

  const timerRemaining = currentEvent?.timerRemainingSeconds ?? 45;
  const isVotingLocked = currentEvent?.isVotingLocked || timerRemaining === 0;
  const status = currentEvent?.status || 'waiting';
  const isQuizMode = currentEvent?.isQuizMode;

  // Dynamic state-driven dialogue & mood
  useEffect(() => {
    if (hasInteracted) return; // user tapped custom speech

    if (status === 'waiting' || status === 'draft') {
      setPetMood('idle');
      const waitingQuotes = [
        `Siap-siap ya! Sesi segera mulai 🚀`,
        `Nunggu presenter membuka sesi... ☕`,
        `Yuk fokus & raih pengalaman seru! ✨`,
      ];
      setSpeechText(waitingQuotes[Math.floor(Math.random() * waitingQuotes.length)]);
    } else if (status === 'ended') {
      setPetMood('celebrate');
      setSpeechText(`Sesi selesai! Terima kasih ${name}! 🏆`);
    } else if (hasSubmitted) {
      setPetMood('cheer');
      setSpeechText('Jawabanmu terkirim! Mantap! 🎉');
    } else if (isVotingLocked) {
      setPetMood('focus');
      setSpeechText('Voting ditutup! Cek hasil di layar 📺');
    } else if (timerRemaining <= 10 && timerRemaining > 0) {
      setPetMood('urgent');
      setSpeechText('Waktu mau habis! Ayo pilih! ⚡');
    } else {
      setPetMood('focus');
      const liveQuotes = [
        'Pilih jawaban paling tepat! 💡',
        'Kira-kira apa jawabannya ya? 🤔',
        'Tentukan pilihanmu sekarang! ✨',
      ];
      setSpeechText(liveQuotes[Math.floor(Math.random() * liveQuotes.length)]);
    }
  }, [status, hasSubmitted, isVotingLocked, timerRemaining, name, hasInteracted]);

  const handleTapCompanion = () => {
    setIsBouncing(true);
    setHasInteracted(true);
    setPetMood('cheer');
    setTimeout(() => setIsBouncing(false), 700);

    // Send a subtle heart burst reaction to stage
    try {
      sendReaction('❤️');
    } catch {}

    const funQuotes = [
      'Aku dukung pilihanmu 100%! ⭐',
      'Fokus & raih peringkat atas! 🔥',
      'Kamu pasti bisa! Semangat! 💪',
      'Keren banget kamu hari ini! ✨',
      'Kirim cinta ke panggung! ❤️',
    ];
    const randomQuote = funQuotes[Math.floor(Math.random() * funQuotes.length)];
    setSpeechText(randomQuote);

    // Reset interaction lock after 4 seconds
    setTimeout(() => setHasInteracted(false), 4000);
  };

  if (!currentParticipant) return null;

  return (
    <>
      {/* 2D Ambient Floating Pixel / VTuber Pet Companion in Background (Pointer-events-none) */}
      <div 
        aria-hidden="true"
        className="fixed bottom-6 right-4 sm:right-8 z-0 pointer-events-none select-none opacity-20 hover:opacity-40 transition-opacity duration-300 hidden sm:flex flex-col items-center animate-pulse"
      >
        <div 
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg border border-white/60 transform rotate-6 hover:rotate-0 transition-transform"
          style={{ backgroundColor: bgColor }}
        >
          {emoji}
        </div>
        <div className="text-[9px] font-bold text-slate-600 bg-white/80 px-2 py-0.5 rounded-full mt-1 border border-slate-200/60 shadow-2xs font-mono">
          2D Buddy
        </div>
      </div>

      {/* Main Top Companion HUD Bar */}
      <div className="w-full max-w-md mx-auto px-3 pt-3 pb-1 relative z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2.5 transition-all">
          
          {/* Left: Interactive 2D Animated Avatar Squircle with Live Breathing & Speech */}
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={handleTapCompanion}
              title="Klik maskot 2D untuk sapaan & kirim reaksi!"
              className={`relative shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-xs transition-all cursor-pointer active:scale-90 group ${
                isBouncing 
                  ? 'animate-bounce ring-4 ring-indigo-400/40' 
                  : petMood === 'urgent'
                  ? 'animate-ping duration-1000'
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: bgColor }}
            >
              {/* 2D Breathing / Idle Motion Container */}
              <span className="select-none filter drop-shadow-xs transition-transform duration-200 group-hover:scale-110">
                {emoji}
              </span>

              {/* Online Pulse Dot */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white shadow-2xs flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
              </div>

              {/* Mood Sparkle Badge */}
              {petMood === 'cheer' && (
                <div className="absolute -bottom-1 -left-1 text-[10px] bg-amber-400 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-xs">
                  ✨
                </div>
              )}
            </button>

            {/* Speech Text & Participant Nickname */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5 truncate">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {name}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 inline" />
              </div>

              {/* Dynamic Companion Quote */}
              <div 
                onClick={handleTapCompanion}
                className="text-[11px] font-medium text-slate-600 truncate flex items-center space-x-1 cursor-pointer hover:text-indigo-600 transition-colors mt-0.5"
              >
                <Sparkles className="w-2.5 h-2.5 text-amber-500 shrink-0 animate-spin" />
                <span className="truncate">{speechText}</span>
              </div>
            </div>
          </div>

          {/* Right: Score (if Quiz Mode) or Exit Button */}
          <div className="flex items-center space-x-1.5 shrink-0">
            {isQuizMode && currentParticipant?.score !== undefined ? (
              <div className="flex items-center space-x-1 px-2 py-1 bg-amber-50 text-amber-800 rounded-xl text-xs font-bold border border-amber-200 shadow-2xs">
                <Trophy className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-mono-numbers">{currentParticipant.score} pts</span>
              </div>
            ) : (
              <button
                onClick={leaveRoom}
                className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center space-x-1 font-semibold transition-colors px-2 py-1 rounded-lg hover:bg-slate-50 cursor-pointer"
                title="Keluar dari room"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
