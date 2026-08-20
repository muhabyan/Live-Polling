import React from 'react';
import { useEvent } from '../../context/EventContext';
import { CheckCircle2, Sparkles, Trophy, Clock, Heart } from 'lucide-react';

interface ParticipantSubmittedProps {
  onRevote?: () => void;
}

export const ParticipantSubmitted: React.FC<ParticipantSubmittedProps> = ({ onRevote }) => {
  const { currentEvent, currentParticipant, sendReaction } = useEvent();
  const reactionEmojis = ['👏', '🔥', '❤️', '💡', '🚀', '🎉'];

  const currentQ = currentEvent?.questions[currentEvent.currentQuestionIndex];
  const timerRemaining = currentEvent?.timerRemainingSeconds ?? 0;

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 flex flex-col justify-between min-h-[calc(100vh-6rem)]">
      
      {/* Top Participant Pill */}
      <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2.5">
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-xs"
            style={{ backgroundColor: currentParticipant?.avatarBg || '#2563EB' }}
          >
            {currentParticipant?.avatarEmoji || '🚀'}
          </div>
          <span className="text-xs font-bold text-slate-800">
            {currentParticipant?.name || 'Attendee'}
          </span>
        </div>

        {currentParticipant?.score !== undefined && (
          <div className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>{currentParticipant.score} pts</span>
          </div>
        )}
      </div>

      {/* Main Success Confirmation Card */}
      <div className="my-auto py-8 text-center bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        
        {/* Animated Check Icon */}
        <div className="w-20 h-20 mx-auto mb-5 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm animate-bounce">
          <CheckCircle2 className="w-10 h-10 stroke-[2]" />
        </div>

        <h2 className="text-xl font-semibold tracking-tight text-slate-900 mb-1">
          Answer Submitted!
        </h2>
        <p className="text-sm font-medium text-slate-500 mb-6">
          Your vote is recorded in the live tally on the main stage.
        </p>

        {/* Live Status Info */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-slate-600 mb-1">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Look at the presenter's screen for real-time results</span>
          </div>
          <p className="text-[11px] text-slate-400">
            The next question will automatically display here when the presenter advances.
          </p>
        </div>

        {/* Change Answer / Revote if voting not locked */}
        {!currentEvent?.isVotingLocked && timerRemaining > 0 && onRevote && (
          <button
            type="button"
            onClick={onRevote}
            className="text-xs font-medium text-slate-700 hover:text-slate-900 hover:underline"
          >
            Change your response ({timerRemaining}s left)
          </button>
        )}
      </div>

      {/* Quick Cheer / Reaction Bar */}
      <div className="bg-white/90 backdrop-blur-xs border border-slate-200 rounded-xl p-4 text-center shadow-sm">
        <div className="text-xs font-semibold text-slate-600 mb-2.5 flex items-center justify-center space-x-1">
          <Sparkles className="w-3.5 h-3.5 text-slate-400" />
          <span>Cheer the stage</span>
        </div>
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          {reactionEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              className="w-10 h-10 rounded-lg bg-slate-50 hover:bg-slate-100 active:scale-125 hover:scale-110 transition-all text-xl flex items-center justify-center shadow-sm border border-slate-200"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
