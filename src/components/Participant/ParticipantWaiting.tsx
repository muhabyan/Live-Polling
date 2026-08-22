import React from 'react';
import { useEvent } from '../../context/EventContext';
import { Users, Clock, Sparkles, LogOut, CheckCircle2 } from 'lucide-react';

export const ParticipantWaiting: React.FC = () => {
  const { currentEvent, currentParticipant, leaveRoom, sendReaction } = useEvent();

  const reactionEmojis = ['👏', '🔥', '❤️', '💡', '🚀', '✨', '🎉'];

  return (
    <div className="w-full max-w-md mx-auto px-3 py-2 flex flex-col justify-between flex-1 gap-4">
      {/* Main Waiting Card */}
      <div className="my-auto py-6 sm:py-8 text-center bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/90 shadow-2xs relative overflow-hidden">
        
        {/* Pulsing Animated Wave Radar */}
        <div className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-indigo-400/20 animate-ping opacity-60" />
          <div className="absolute inset-2 rounded-full bg-indigo-100/70 animate-pulse" />
          <div className="relative w-14 h-14 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs font-bold text-2xl">
            <Clock className="w-7 h-7 animate-pulse" />
          </div>
        </div>

        <div className="inline-block px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md text-[11px] font-bold text-indigo-700 mb-2.5">
          Lobby Waiting Room
        </div>

        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 mb-1.5 leading-snug font-display">
          {currentEvent?.title || 'Waiting for Presenter to Begin'}
        </h2>

        <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto mb-5">
          Questions will appear here automatically when the host starts the session.
        </p>

        {/* Live Participant Counter */}
        <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-600">
          <Users className="w-3.5 h-3.5 text-indigo-600" />
          <span className="font-mono-numbers font-bold text-slate-900">
            {currentEvent?.participants.length || 1}
          </span>
          <span className="text-slate-500">participants connected</span>
        </div>
      </div>

      {/* Tap to Cheer / Live Reactions Dock */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-center shadow-2xs">
        <div className="text-[11px] font-bold text-slate-500 mb-2 flex items-center justify-center space-x-1">
          <Sparkles className="w-3 h-3 text-indigo-600" />
          <span>Tap to cheer the live stage</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          {reactionEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-125 hover:scale-105 transition-all text-xl flex items-center justify-center shadow-2xs border border-slate-200/80 cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
