import React from 'react';
import { useEvent } from '../../context/EventContext';
import { CheckCircle2, Sparkles, Clock } from 'lucide-react';

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
      <div className="my-auto py-4 sm:py-8 text-center neo-card p-4 sm:p-7 relative overflow-hidden shrink-0">
        
        {/* Animated Check Icon */}
        <div
          className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-lg border-2 border-[#1E1E1E] bg-[#34D399] text-[#1E1E1E] flex items-center justify-center"
          style={{ boxShadow: '4px 4px 0px #1E1E1E' }}
        >
          <CheckCircle2 className="w-9 h-9 sm:w-11 sm:h-11 stroke-[2.5]" />
        </div>

        <h2 className="text-lg sm:text-xl font-black tracking-tight text-[#1E1E1E] mb-1 font-display uppercase">
          Vote Recorded!
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mb-5 max-w-xs mx-auto">
          Your response is now live on the main presentation stage.
        </p>

        {/* Live Status Info */}
        <div className="bg-[#FFF8F0] border-2 border-[#1E1E1E] rounded-lg p-3.5 mb-4">
          <div className="flex items-center justify-center space-x-1.5 text-xs font-bold text-[#1E1E1E] mb-0.5">
            <Clock className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span>Watch the big screen for live results</span>
          </div>
          <p className="text-[11px] text-gray-400 font-mono">
            Next question will load automatically when host advances.
          </p>
        </div>

        {/* Change Answer / Revote button */}
        {!isLocked && timerRemaining > 0 && onRevote && (
          <button
            type="button"
            onClick={onRevote}
            className="neo-btn bg-[#4F46E5]/10 text-[#4F46E5] text-xs px-4 py-1.5 hover:bg-[#4F46E5]/20"
          >
            Change your response ({timerRemaining}s left)
          </button>
        )}
      </div>

      {/* Quick Cheer / Reaction Bar */}
      <div className="neo-card p-3 sm:p-3.5 text-center shrink-0">
        <div className="text-[11px] font-bold text-gray-500 mb-2 flex items-center justify-center space-x-1 font-mono">
          <Sparkles className="w-3 h-3 text-[#4F46E5]" />
          <span>Send a reaction to the speaker</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          {reactionEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg border-2 border-[#1E1E1E] bg-white hover:bg-[#FACC15]/30 active:scale-110 hover:scale-105 transition-all text-lg sm:text-xl flex items-center justify-center cursor-pointer"
              style={{ boxShadow: '2px 2px 0px #1E1E1E' }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
