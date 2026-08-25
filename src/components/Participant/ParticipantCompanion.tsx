import React, { useState, useEffect } from 'react';
import { useEvent } from '../../context/EventContext';
import { Sparkles, Trophy, LogOut, CheckCircle2 } from 'lucide-react';

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
      {/* 2D Ambient Floating Pixel Companion in Background */}
      <div 
        aria-hidden="true"
        className="fixed bottom-6 right-4 sm:right-8 z-0 pointer-events-none select-none opacity-20 hover:opacity-40 transition-opacity duration-300 hidden sm:flex flex-col items-center animate-pulse"
      >
        <div 
          className="w-12 h-12 rounded-lg border-2 border-[#1E1E1E] flex items-center justify-center text-2xl transform rotate-6 hover:rotate-0 transition-transform"
          style={{ backgroundColor: bgColor, boxShadow: '2px 2px 0px #1E1E1E' }}
        >
          {emoji}
        </div>
        <div className="text-[9px] font-bold text-[#1E1E1E] bg-[#FACC15] px-2 py-0.5 rounded-md mt-1 border-2 border-[#1E1E1E] font-mono">
          2D Buddy
        </div>
      </div>

      {/* Main Top Companion HUD Bar */}
      <div className="w-full max-w-md mx-auto px-3 pt-3 pb-1 relative z-10">
        <div className="neo-card-sm p-2.5 flex items-center justify-between gap-2.5 transition-all">
          
          {/* Left: Interactive Avatar with Speech */}
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={handleTapCompanion}
              title="Klik maskot 2D untuk sapaan & kirim reaksi!"
              className={`relative shrink-0 w-10 h-10 rounded-lg border-2 border-[#1E1E1E] flex items-center justify-center text-xl transition-all cursor-pointer active:scale-90 group ${
                isBouncing 
                  ? 'animate-bounce ring-4 ring-[#4F46E5]/40' 
                  : petMood === 'urgent'
                  ? 'animate-ping duration-1000'
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: bgColor, boxShadow: '2px 2px 0px #1E1E1E' }}
            >
              <span className="select-none transition-transform duration-200 group-hover:scale-110">
                {emoji}
              </span>

              {/* Online Pulse Dot */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#34D399] rounded-md border-2 border-[#1E1E1E] flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
              </div>

              {/* Mood Sparkle Badge */}
              {petMood === 'cheer' && (
                <div className="absolute -bottom-1 -left-1 text-[10px] bg-[#FACC15] rounded-md w-4 h-4 flex items-center justify-center border-2 border-[#1E1E1E]">
                  ✨
                </div>
              )}
            </button>

            {/* Speech Text & Participant Nickname */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5 truncate">
                <span className="text-xs font-black text-[#1E1E1E] truncate">
                  {name}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399] shrink-0 inline" />
              </div>

              {/* Dynamic Companion Quote */}
              <div 
                onClick={handleTapCompanion}
                className="text-[11px] font-bold text-gray-500 truncate flex items-center space-x-1 cursor-pointer hover:text-[#4F46E5] transition-colors mt-0.5"
              >
                <Sparkles className="w-2.5 h-2.5 text-[#FACC15] shrink-0 animate-spin" />
                <span className="truncate">{speechText}</span>
              </div>
            </div>
          </div>

          {/* Right: Score (if Quiz Mode) or Exit Button */}
          <div className="flex items-center space-x-1.5 shrink-0">
            {isQuizMode && currentParticipant?.score !== undefined ? (
              <div className="neo-badge bg-[#FACC15] text-[#1E1E1E] text-xs">
                <Trophy className="w-3.5 h-3.5" />
                <span className="font-mono">{currentParticipant.score} pts</span>
              </div>
            ) : (
              <button
                onClick={leaveRoom}
                className="neo-btn bg-white text-gray-400 hover:text-[#1E1E1E] hover:bg-[#FB7185]/20 text-[11px] px-2 py-1"
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
