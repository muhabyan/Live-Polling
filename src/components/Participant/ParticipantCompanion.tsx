import React, { useState, useEffect } from 'react';
import { useEvent } from '../../context/EventContext';
import { Sparkles, Trophy, LogOut, CheckCircle2 } from 'lucide-react';
import { PikteraMascot } from '../Shared/PikteraMascot';

interface ParticipantCompanionProps {
  hasSubmitted?: boolean;
}

export const ParticipantCompanion: React.FC<ParticipantCompanionProps> = ({ hasSubmitted }) => {
  const { currentEvent, currentParticipant, leaveRoom, sendReaction } = useEvent();
  const [speechText, setSpeechText] = useState<string>('');
  const [isBouncing, setIsBouncing] = useState<boolean>(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const [petMood, setPetMood] = useState<'idle' | 'focus' | 'urgent' | 'cheer' | 'celebrate'>('idle');

  const emoji = currentParticipant?.avatarEmoji || '🤖';
  const name = currentParticipant?.name || 'Attendee';
  const bgColor = currentParticipant?.avatarBg || '#2F36C9';

  const timerRemaining = currentEvent?.timerRemainingSeconds ?? 45;
  const isVotingLocked = currentEvent?.isVotingLocked || timerRemaining === 0;
  const status = currentEvent?.status || 'waiting';
  const isQuizMode = currentEvent?.isQuizMode;

  // Dynamic state-driven dialogue & mood
  useEffect(() => {
    if (hasInteracted) return;

    if (status === 'waiting' || status === 'draft') {
      setPetMood('idle');
      const waitingQuotes = [
        `Siap-siap ya! Sesi segera mulai 🚀`,
        `Nunggu presenter membuka sesi... ☕`,
        `Piktera siap mencatat suaramu! ✨`,
      ];
      setSpeechText(waitingQuotes[Math.floor(Math.random() * waitingQuotes.length)]);
    } else if (status === 'ended') {
      setPetMood('celebrate');
      setSpeechText(`Sesi selesai! Terima kasih ${name}! 🏆`);
    } else if (hasSubmitted) {
      setPetMood('cheer');
      setSpeechText('Jawabanmu terkirim ke panggung! 🎉');
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

    try {
      sendReaction('❤️');
    } catch {}

    const funQuotes = [
      'Piktera dukung pilihanmu 100%! ⭐',
      'Fokus & raih peringkat atas! 🔥',
      'Kamu pasti bisa! Semangat! 💪',
      'Keren banget kamu hari ini! ✨',
      'Kirim cinta ke panggung! ❤️',
    ];
    const randomQuote = funQuotes[Math.floor(Math.random() * funQuotes.length)];
    setSpeechText(randomQuote);

    setTimeout(() => setHasInteracted(false), 4000);
  };

  if (!currentParticipant) return null;

  return (
    <div className="w-full max-w-md mx-auto px-3 pt-3 pb-1 relative z-10 select-none">
      <div className="neo-card p-3 flex items-center justify-between gap-3 transition-all bg-white">
        
        {/* Left: Full-body Animated Piktera Robot Companion (Not just an avatar photo) */}
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={handleTapCompanion}
            title="Ketuk maskot Piktera untuk sapaan & reaksi!"
            className={`relative shrink-0 transition-transform cursor-pointer active:scale-90 group ${
              isBouncing ? 'animate-bounce' : 'hover:scale-105'
            }`}
          >
            {/* Full Formed Animated Piktera Robot Mascot with Moving Waving Hand */}
            <PikteraMascot
              size="sm"
              mood={petMood === 'celebrate' || petMood === 'cheer' ? 'celebrating' : petMood === 'urgent' ? 'curious' : 'happy'}
              headOnly={false}
            />
          </button>

          {/* Speech Bubble & Participant Persona Tag */}
          <div className="min-w-0 flex-1 space-y-1">
            {/* Participant Name & Avatar Badge */}
            <div className="flex items-center space-x-1.5 truncate">
              <span 
                className="w-5 h-5 rounded-md border-2 border-[#000000] flex items-center justify-center text-[11px] text-white shrink-0 font-mono font-bold"
                style={{ backgroundColor: bgColor }}
              >
                {emoji}
              </span>
              <span className="text-xs font-black text-[#000000] truncate font-mono">
                {name}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2F36C9] shrink-0 inline" />
            </div>

            {/* Dynamic Interactive Companion Dialogue Bubble */}
            <div 
              onClick={handleTapCompanion}
              className="p-1.5 bg-[#FFF8F0] border-2 border-[#000000] rounded-lg text-[11px] font-bold text-[#000000] truncate flex items-center space-x-1.5 cursor-pointer hover:bg-[#C1FF33]/30 transition-colors font-mono"
              style={{ boxShadow: '2px 2px 0px #000000' }}
            >
              <Sparkles className="w-3 h-3 text-[#2F36C9] shrink-0 animate-spin" />
              <span className="truncate">{speechText}</span>
            </div>
          </div>
        </div>

        {/* Right: Score (if Quiz Mode) or Exit Button */}
        <div className="flex flex-col items-end space-y-1.5 shrink-0">
          {isQuizMode && currentParticipant?.score !== undefined ? (
            <div className="neo-badge bg-[#C1FF33] text-[#000000] text-xs font-mono">
              <Trophy className="w-3 h-3 text-[#000000]" />
              <span>{currentParticipant.score} pts</span>
            </div>
          ) : null}

          <button
            onClick={leaveRoom}
            className="neo-btn bg-white text-gray-600 hover:text-white hover:bg-[#FF1784] text-[10px] px-2 py-0.5"
            title="Keluar dari room"
          >
            <LogOut className="w-3 h-3" />
            <span>Exit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
