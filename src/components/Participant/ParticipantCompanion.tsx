import React, { useState, useEffect } from 'react';
import { useEvent } from '../../context/EventContext';
import { Sparkles, Trophy, LogOut, CheckCircle2 } from 'lucide-react';

interface ParticipantCompanionProps {
  hasSubmitted?: boolean;
}

export const ParticipantCompanion: React.FC<ParticipantCompanionProps> = ({ hasSubmitted }) => {
  const { currentEvent, currentParticipant, leaveRoom } = useEvent();
  const [speechText, setSpeechText] = useState<string>('');
  const [isBouncing, setIsBouncing] = useState<boolean>(false);
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
        `Siap-siap ya! Sesi segera mulai 🚀`,
        `Nunggu presenter membuka sesi... ☕`,
        `Yuk fokus & raih skor tinggi! ✨`,
      ];
      setSpeechText(waitingQuotes[Math.floor(Math.random() * waitingQuotes.length)]);
    } else if (status === 'ended') {
      setSpeechText(`Sesi selesai! Terima kasih ${name}! 🏆`);
    } else if (hasSubmitted) {
      setSpeechText('Jawabanmu terkirim! Mantap! 🎉');
    } else if (isVotingLocked) {
      setSpeechText('Voting ditutup! Cek hasil di layar 📺');
    } else if (timerRemaining <= 10 && timerRemaining > 0) {
      setSpeechText('Waktu mau habis! Ayo pilih! ⚡');
    } else {
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
    setTimeout(() => setIsBouncing(false), 600);

    const funQuotes = [
      'Aku dukung pilihanmu 100%! ⭐',
      'Fokus & raih peringkat atas! 🔥',
      'Kamu pasti bisa! Semangat! 💪',
      'Keren banget kamu hari ini! ✨',
      'Jangan lupa kirim reaksi cinta! ❤️',
    ];
    const randomQuote = funQuotes[Math.floor(Math.random() * funQuotes.length)];
    setSpeechText(randomQuote);

    // Reset interaction lock after 4 seconds
    setTimeout(() => setHasInteracted(false), 4000);
  };

  if (!currentParticipant) return null;

  return (
    <div className="w-full max-w-md mx-auto px-3 pt-3 pb-1">
      {/* Sleek Top Companion Bar */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2.5 transition-all">
        
        {/* Left: Interactive Avatar Squircle with Speech Bubble */}
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          <button
            type="button"
            onClick={handleTapCompanion}
            title="Klik maskot untuk sapaan seru!"
            className={`relative shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-2xs transition-transform cursor-pointer active:scale-90 ${
              isBouncing ? 'animate-bounce' : 'hover:scale-105'
            }`}
            style={{ backgroundColor: bgColor }}
          >
            <span className="select-none filter drop-shadow-xs">{emoji}</span>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
          </button>

          {/* Speech Text & Participant Nickname */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1.5 truncate">
              <span className="text-xs font-bold text-slate-900 truncate">
                {name}
              </span>
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 inline" />
            </div>

            {/* Dynamic Companion Quote */}
            <div 
              onClick={handleTapCompanion}
              className="text-[11px] font-medium text-slate-600 truncate flex items-center space-x-1 cursor-pointer hover:text-indigo-600 transition-colors"
            >
              <Sparkles className="w-2.5 h-2.5 text-amber-500 shrink-0" />
              <span className="truncate">{speechText}</span>
            </div>
          </div>
        </div>

        {/* Right: Score or Exit Button */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {currentParticipant?.score !== undefined && currentParticipant.score > 0 ? (
            <div className="flex items-center space-x-1 px-2 py-1 bg-amber-50 text-amber-800 rounded-lg text-xs font-bold border border-amber-200">
              <Trophy className="w-3 h-3 text-amber-600" />
              <span className="font-mono-numbers">{currentParticipant.score} pts</span>
            </div>
          ) : (
            <button
              onClick={leaveRoom}
              className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center space-x-1 font-semibold transition-colors px-2 py-1 rounded-lg hover:bg-slate-50 cursor-pointer"
              title="Keluar dari room"
            >
              <LogOut className="w-3 h-3" />
              <span>Exit</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
