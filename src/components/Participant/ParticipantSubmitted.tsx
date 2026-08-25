import React from 'react';
import { useEvent } from '../../context/EventContext';
import { Sparkles, Clock, Check } from 'lucide-react';
import { PikteraMascot } from '../Shared/PikteraMascot';

interface ParticipantSubmittedProps {
  onRevote?: () => void;
}

export const ParticipantSubmitted: React.FC<ParticipantSubmittedProps> = ({ onRevote }) => {
  const { currentEvent, sendReaction } = useEvent();
  const reactionEmojis = ['👏', '🔥', '❤️', '💡', '🚀', '🎉'];

  const timerRemaining = currentEvent?.timerRemainingSeconds ?? 0;
  const isLocked = currentEvent?.isVotingLocked || timerRemaining === 0;

  return (
    <div className="w-full max-w-md mx-auto px-3 py-2 flex flex-col justify-between flex-1 gap-3 min-h-0 overflow-y-auto">
      {/* Main Success Confirmation Card */}
      <div className="my-auto py-5 sm:py-8 text-center neo-card p-4 sm:p-7 relative overflow-hidden shrink-0 bg-white">
        
        {/* Animated Celebrating Piktera Robot Mascot */}
        <div className="flex justify-center mb-3 sm:mb-4">
          <PikteraMascot size="md" mood="celebrating" headOnly={false} />
        </div>

        <div className="inline-flex items-center space-x-1 neo-badge bg-[#C1FF33] text-[#000000] text-xs mb-2 font-mono">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>Jawaban Terkirim!</span>
        </div>

        <h2 className="text-lg sm:text-xl font-black tracking-tight text-[#000000] mb-1 font-heading uppercase">
          Vote Recorded!
        </h2>
        <p className="text-xs text-gray-600 mb-5 max-w-xs mx-auto font-mono">
          Pilihanmu sudah tercatat dan langsung ditampilkan ke layar utama panggung.
        </p>

        {/* Live Status Info */}
        <div className="bg-[#FFF8F0] border-2 border-[#000000] rounded-xl p-3.5 mb-4" style={{ boxShadow: '2px 2px 0px #000000' }}>
          <div className="flex items-center justify-center space-x-1.5 text-xs font-bold text-[#000000] mb-0.5 font-mono">
            <Clock className="w-3.5 h-3.5 text-[#2F36C9]" />
            <span>Lihat layar panggung untuk hasil voting live</span>
          </div>
          <p className="text-[11px] text-gray-500 font-mono mt-0.5">
            Pertanyaan berikutnya akan otomatis muncul saat host berganti soal.
          </p>
        </div>

        {/* Change Answer / Revote button */}
        {!isLocked && timerRemaining > 0 && onRevote && (
          <button
            type="button"
            onClick={onRevote}
            className="neo-btn bg-[#FFF8F0] text-[#2F36C9] hover:bg-[#C1FF33] text-xs px-4 py-1.5 font-mono"
          >
            Ubah jawaban ({timerRemaining}s tersisa)
          </button>
        )}
      </div>

      {/* Quick Cheer / Reaction Bar */}
      <div className="neo-card p-3 sm:p-3.5 text-center shrink-0 bg-white">
        <div className="text-[11px] font-bold text-gray-600 mb-2 flex items-center justify-center space-x-1 font-mono">
          <Sparkles className="w-3 h-3 text-[#2F36C9]" />
          <span>Kirim reaksi live ke presenter</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          {reactionEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg border-2 border-[#000000] bg-white hover:bg-[#C1FF33] active:scale-110 hover:scale-105 transition-all text-lg sm:text-xl flex items-center justify-center cursor-pointer"
              style={{ boxShadow: '2px 2px 0px #000000' }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
