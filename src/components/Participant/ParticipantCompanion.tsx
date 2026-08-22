import React, { useState, useEffect } from 'react';
import { useEvent } from '../../context/EventContext';
import { Sparkles, MessageCircle, X } from 'lucide-react';

interface ParticipantCompanionProps {
  hasSubmitted?: boolean;
}

export const ParticipantCompanion: React.FC<ParticipantCompanionProps> = ({ hasSubmitted }) => {
  const { currentEvent, currentParticipant } = useEvent();
  const [speechText, setSpeechText] = useState<string>('');
  const [isBouncing, setIsBouncing] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  const emoji = currentParticipant?.avatarEmoji || '🦊';
  const name = currentParticipant?.name || 'Attendee';
  const bgColor = currentParticipant?.avatarBg || '#EA580C';

  const timerRemaining = currentEvent?.timerRemainingSeconds ?? 45;
  const isVotingLocked = currentEvent?.isVotingLocked || timerRemaining === 0;
  const status = currentEvent?.status || 'waiting';

  // Dynamic state-driven dialogue
  useEffect(() => {
    if (hasInteracted) return; // user tapped custom speech

    if (status === 'waiting' || status === 'draft') {
      const waitingQuotes = [
        `Halo ${name}! Siap-siap ya! 🚀`,
        'Nunggu host mulai sesi... ☕',
        'Yuk pemanasan dulu! ✨',
      ];
      setSpeechText(waitingQuotes[Math.floor(Math.random() * waitingQuotes.length)]);
    } else if (status === 'ended') {
      setSpeechText(`Hebat ${name}! Sesi selesai! 🏆`);
    } else if (hasSubmitted) {
      setSpeechText('Jawabanmu terkirim! Mantap! 🎉');
    } else if (isVotingLocked) {
      setSpeechText('Voting ditutup! Cek layar utama ya 📺');
    } else if (timerRemaining <= 10 && timerRemaining > 0) {
      setSpeechText('Waktu mau habis! Ayo pilih! ⚡');
    } else {
      const liveQuotes = [
        'Pilih yang paling tepat ya! 💡',
        'Kira-kira apa jawabannya? 🤔',
        'Fokus & tentukan pilihanmu! ✨',
      ];
      setSpeechText(liveQuotes[Math.floor(Math.random() * liveQuotes.length)]);
    }
  }, [status, hasSubmitted, isVotingLocked, timerRemaining, name, hasInteracted]);

  const handleTapCompanion = () => {
    setIsBouncing(true);
    setHasInteracted(true);
    setTimeout(() => setIsBouncing(false), 600);

    const funQuotes = [
      'Aku dukung pilihanmu 100%! ⭐',
      'Fokus & raih skor tertinggi! 🔥',
      'Kamu pasti bisa! Semangat! 💪',
      'Keren banget kamu hari ini! ✨',
      'Jangan lupa kirim reaksi ke panggung! ❤️',
    ];
    const randomQuote = funQuotes[Math.floor(Math.random() * funQuotes.length)];
    setSpeechText(randomQuote);

    // Reset interaction lock after 5 seconds so live state resumes
    setTimeout(() => setHasInteracted(false), 5000);
  };

  if (!currentParticipant) return null;

  return (
    <aside 
      aria-label="Mascot Companion"
      className="pointer-events-none fixed bottom-14 right-3 sm:right-6 z-30 flex flex-col items-end animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      {/* Speech Bubble */}
      {!isMinimized && speechText && (
        <div className="pointer-events-auto mb-2 max-w-[200px] sm:max-w-[240px] bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl rounded-br-xs border border-slate-200/90 shadow-md text-xs font-semibold text-slate-800 flex items-start space-x-1.5 animate-in zoom-in-95 duration-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <span className="leading-tight select-none">{speechText}</span>
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="text-slate-400 hover:text-slate-600 p-0.5 ml-1 shrink-0 cursor-pointer"
            title="Sembunyikan pesan"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Expressive Floating Mascot Avatar */}
      <div className="pointer-events-auto flex items-center space-x-1.5">
        {isMinimized && (
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="px-2 py-1 bg-white/90 backdrop-blur-xs border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 shadow-2xs hover:bg-slate-50 cursor-pointer"
          >
            <MessageCircle className="w-3 h-3 inline mr-1 text-indigo-600" />
            <span>Tanya Maskot</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleTapCompanion}
          title={`Maskot ${name} (Klik untuk sapa!)`}
          className={`relative group p-1.5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-md hover:shadow-lg transition-all active:scale-90 cursor-pointer ${
            isBouncing ? 'animate-bounce' : 'hover:scale-105'
          }`}
        >
          {/* Glowing Avatar Squircle */}
          <div 
            className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shadow-xs transition-transform"
            style={{ backgroundColor: bgColor }}
          >
            <span className="select-none filter drop-shadow-xs">
              {emoji}
            </span>
          </div>

          {/* Mini Live Status Indicator Dot */}
          <div className="absolute -top-1 -left-1 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white shadow-2xs animate-pulse" />
        </button>
      </div>
    </aside>
  );
};
