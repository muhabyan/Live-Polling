import React from 'react';
import { useEvent } from '../../context/EventContext';
import { Users, Clock, Sparkles, LogOut } from 'lucide-react';

export const ParticipantWaiting: React.FC = () => {
  const { currentEvent, currentParticipant, leaveRoom, sendReaction } = useEvent();

  const reactionEmojis = ['👏', '🔥', '❤️', '💡', '🚀', '✨', '🎉'];

  return (
    <div className="w-full max-w-md mx-auto px-3 py-2 flex flex-col justify-between flex-1 gap-3 min-h-0 overflow-y-auto">
      {/* Main Waiting Card */}
      <div className="my-auto py-4 sm:py-8 text-center neo-card p-4 sm:p-7 relative overflow-hidden shrink-0">
        
        {/* Pulsing Clock Icon */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-lg border-2 border-[#1E1E1E] bg-[#4F46E5]/10 animate-ping opacity-40" />
          <div
            className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg border-2 border-[#1E1E1E] bg-[#4F46E5] text-white flex items-center justify-center font-bold text-xl sm:text-2xl"
            style={{ boxShadow: '3px 3px 0px #1E1E1E' }}
          >
            <Clock className="w-6 h-6 sm:w-7 sm:h-7 animate-pulse" />
          </div>
        </div>

        <span className="neo-badge bg-[#FACC15] text-[#1E1E1E] mb-2 inline-flex">
          Lobby Waiting Room
        </span>

        <h2 className="text-base sm:text-xl font-black tracking-tight text-[#1E1E1E] mb-1 leading-snug font-display uppercase">
          {currentEvent?.title || 'Waiting for Presenter to Begin'}
        </h2>

        <p className="text-[11px] sm:text-sm text-gray-500 max-w-xs mx-auto mb-3 sm:mb-5">
          Questions will appear here automatically when the host starts the session.
        </p>

        {/* Live Participant Counter */}
        <div className="neo-badge bg-white text-[#1E1E1E] text-xs inline-flex">
          <Users className="w-3.5 h-3.5 text-[#4F46E5]" />
          <span className="font-mono font-black">
            {currentEvent?.participants.length || 1}
          </span>
          <span className="text-gray-500 font-normal">participants connected</span>
        </div>
      </div>

      {/* Tap to Cheer / Live Reactions Dock */}
      <div className="neo-card p-3 sm:p-3.5 text-center shrink-0">
        <div className="text-[11px] font-bold text-gray-500 mb-2 flex items-center justify-center space-x-1 font-mono">
          <Sparkles className="w-3 h-3 text-[#4F46E5]" />
          <span>Tap to cheer the live stage</span>
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

      {/* Mobile Exit Button */}
      <button
        onClick={leaveRoom}
        className="neo-btn w-full py-2.5 bg-white text-gray-500 hover:bg-[#FB7185]/20 hover:text-[#1E1E1E] text-xs shrink-0"
        title="Keluar dari room"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Keluar dari Room</span>
      </button>
    </div>
  );
};
