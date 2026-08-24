import React from 'react';
import { useEvent } from '../../context/EventContext';
import { Users, Clock, Sparkles, LogOut, CheckCircle2 } from 'lucide-react';

export const ParticipantWaiting: React.FC = () => {
  const { currentEvent, currentParticipant, leaveRoom, sendReaction } = useEvent();

  const reactionEmojis = ['👏', '🔥', '❤️', '💡', '🚀', '✨', '🎉'];

  return (
    <div className="w-full max-w-md mx-auto px-3 py-2 flex flex-col justify-between flex-1 gap-3 min-h-0 overflow-y-auto">
      {/* Main Waiting Card */}
      <div className="my-auto py-4 sm:py-8 text-center bg-white rounded-2xl p-4 sm:p-7 border border-slate-200/90 shadow-2xs relative overflow-hidden shrink-0">
        
        {/* Pulsing Animated Wave Radar */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-indigo-400/20 animate-ping opacity-60" />
          <div className="absolute inset-2 rounded-full bg-indigo-100/70 animate-pulse" />
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs font-bold text-xl sm:text-2xl">
            <Clock className="w-6 h-6 sm:w-7 sm:h-7 animate-pulse" />
          </div>
        </div>

        <div className="inline-block px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md text-[11px] font-bold text-indigo-700 mb-2">
          Lobby Waiting Room
        </div>

        <h2 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 mb-1 leading-snug font-display">
          {currentEvent?.title || 'Waiting for Presenter to Begin'}
        </h2>

        <p className="text-[11px] sm:text-sm text-slate-500 max-w-xs mx-auto mb-3 sm:mb-5">
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
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 text-center shadow-2xs shrink-0">
        <div className="text-[11px] font-bold text-slate-500 mb-2 flex items-center justify-center space-x-1">
          <Sparkles className="w-3 h-3 text-indigo-600" />
          <span>Tap to cheer the live stage</span>
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

      {/* Mobile Exit Button — always visible at bottom */}
      <button
        onClick={leaveRoom}
        className="w-full py-2.5 flex items-center justify-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer shrink-0 border border-transparent hover:border-rose-200"
        title="Keluar dari room"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Keluar dari Room</span>
      </button>
    </div>
  );
};
