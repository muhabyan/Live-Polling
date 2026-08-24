import React from 'react';
import { useEvent } from '../../context/EventContext';
import { CheckCircle2, Sparkles, Trophy, Clock } from 'lucide-react';

interface ParticipantSubmittedProps {
  onRevote?: () => void;
}

export const ParticipantSubmitted: React.FC<ParticipantSubmittedProps> = ({ onRevote }) => {
  const { currentEvent, currentParticipant, sendReaction } = useEvent();
  const reactionEmojis = ['👏', '🔥', '❤️', '💡', '🚀', '🎉'];

  const timerRemaining = currentEvent?.timerRemainingSeconds ?? 0;
  const isLocked = currentEvent?.isVotingLocked || timerRemaining === 0;

  return (
    <div className="w-full max-w-md mx-auto px-3 py-2 flex flex-col justify-between flex-1 gap-3 min-h-0 overflow-y-auto">
      {/* Main Success Confirmation Card */}
      <div className="my-auto py-4 sm:py-8 text-center bg-white rounded-2xl p-4 sm:p-7 border border-slate-200/90 shadow-2xs relative overflow-hidden shrink-0">
        
        {/* Animated Check Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
          <CheckCircle2 className="w-9 h-9 sm:w-11 sm:h-11 stroke-[2.5]" />
        </div>

        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 mb-1 font-display">
          Vote Recorded!
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mb-5 max-w-xs mx-auto">
          Your response is now live on the main presentation stage.
        </p>

        {/* Live Status Info */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 mb-4">
          <div className="flex items-center justify-center space-x-1.5 text-xs font-semibold text-slate-700 mb-0.5">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Watch the big screen for live results</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Next question will load automatically when host advances.
          </p>
        </div>

        {/* Change Answer / Revote button */}
        {!isLocked && timerRemaining > 0 && onRevote && (
          <button
            type="button"
            onClick={onRevote}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer py-1"
          >
            Change your response ({timerRemaining}s left)
          </button>
        )}
      </div>

      {/* Quick Cheer / Reaction Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 text-center shadow-2xs shrink-0">
        <div className="text-[11px] font-bold text-slate-500 mb-2 flex items-center justify-center space-x-1">
          <Sparkles className="w-3 h-3 text-indigo-600" />
          <span>Send a reaction to the speaker</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          {reactionEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-125 hover:scale-105 transition-all text-lg sm:text-xl flex items-center justify-center shadow-2xs border border-slate-200/80 cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
